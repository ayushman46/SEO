import "server-only";
import { getDb } from "@/lib/db";
import { isProduction } from "./env";
import { hashIp, rateLimitSubject } from "./request";

export interface RateLimitOptions {
  /** max requests per window */
  limit: number;
  /** window length in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** seconds until the current window resets (0 when ok) */
  retryAfter: number;
  /** which store answered */
  store: "postgres" | "memory";
}

/* ---------------------------------------------------------------------------------------------
 * In-memory fallback (per process). Used when DATABASE_URL is unset or Postgres errors.
 *
 * HONEST LIMITS (ADR-013): this counts per server instance, not per IP. On Vercel serverless,
 * traffic is spread over several instances and a cold start begins with an empty map, so a client
 * can get up to `limit x number of warm instances` per window. Setting DATABASE_URL switches every
 * limiter to the shared Postgres counter. The per-instance concurrency guard (./concurrency.ts)
 * caps how much work any one instance does at once, regardless of the counter.
 * ------------------------------------------------------------------------------------------- */

interface MemoryEntry {
  windowStart: number;
  windowMs: number;
  count: number;
}

const MAX_MEMORY_ENTRIES = 10_000;
const memory = new Map<string, MemoryEntry>();
let lastSweep = 0;

function sweepMemory(now: number): void {
  // sweep at most once a minute, or immediately when the map is full
  if (now - lastSweep < 60_000 && memory.size < MAX_MEMORY_ENTRIES) return;
  lastSweep = now;
  for (const [key, entry] of memory) {
    if (entry.windowStart + entry.windowMs <= now) memory.delete(key);
  }
  // still full (many active buckets): drop the oldest entries (Map keeps insertion order)
  while (memory.size >= MAX_MEMORY_ENTRIES) {
    const oldest = memory.keys().next();
    if (oldest.done) break;
    memory.delete(oldest.value);
  }
}

function windowStartFor(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

function toResult(count: number, opts: RateLimitOptions, windowStart: number, now: number, store: RateLimitResult["store"]): RateLimitResult {
  const ok = count <= opts.limit;
  const resetAt = windowStart + opts.windowSec * 1000;
  return {
    ok,
    limit: opts.limit,
    remaining: Math.max(0, opts.limit - count),
    retryAfter: ok ? 0 : Math.max(1, Math.ceil((resetAt - now) / 1000)),
    store,
  };
}

function memoryRateLimit(bucket: string, opts: RateLimitOptions, now: number): RateLimitResult {
  sweepMemory(now);
  const windowMs = opts.windowSec * 1000;
  const windowStart = windowStartFor(now, windowMs);
  const key = `${bucket}|${opts.windowSec}`;
  const existing = memory.get(key);

  let count: number;
  if (existing && existing.windowStart === windowStart) {
    existing.count += 1;
    count = existing.count;
  } else {
    memory.delete(key); // re-insert so insertion order tracks recency
    memory.set(key, { windowStart, windowMs, count: 1 });
    count = 1;
  }
  return toResult(count, opts, windowStart, now, "memory");
}

/* ---------------------------------------------------------------------------------------------
 * Postgres fixed window
 * ------------------------------------------------------------------------------------------- */

let warnedDbFailure = false;
let warnedMemoryInProduction = false;

function warnMemoryInProduction(): void {
  if (warnedMemoryInProduction || !isProduction()) return;
  warnedMemoryInProduction = true;
  console.warn(
    "[rate-limit] DATABASE_URL is not set: rate limits are counted per server instance (best effort). " +
      "Set DATABASE_URL to enable the shared Postgres limiter. See DECISIONS ADR-013.",
  );
}

/**
 * Fixed-window rate limit. Postgres when configured (atomic upsert), in-memory otherwise.
 * On a DB error it falls back to memory for that call rather than failing open or closed.
 */
export async function rateLimit(bucket: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  if (!Number.isInteger(opts.limit) || opts.limit < 1 || !Number.isInteger(opts.windowSec) || opts.windowSec < 1) {
    throw new Error("rateLimit: limit and windowSec must be positive integers");
  }
  const safeBucket = bucket.slice(0, 200);
  const now = Date.now();
  const sql = getDb();
  if (!sql) {
    warnMemoryInProduction();
    return memoryRateLimit(safeBucket, opts, now);
  }

  const windowStart = windowStartFor(now, opts.windowSec * 1000);
  try {
    const rows = await sql<{ count: number }[]>`
      insert into rate_limits (bucket, window_start, count)
      values (${safeBucket}, ${new Date(windowStart).toISOString()}::timestamptz, 1)
      on conflict (bucket, window_start)
      do update set count = rate_limits.count + 1
      returning count
    `;
    const count = rows[0]?.count ?? 1;

    // opportunistic cleanup of old windows (~1% of calls), never awaited by the caller's path
    if (Math.random() < 0.01) {
      sql`delete from rate_limits where window_start < now() - interval '2 days'`.catch(() => {});
    }
    return toResult(count, opts, windowStart, now, "postgres");
  } catch (error) {
    if (!warnedDbFailure) {
      warnedDbFailure = true;
      console.error(
        `[rate-limit] Postgres unavailable, using in-memory fallback: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
    return memoryRateLimit(safeBucket, opts, now);
  }
}

/** Bucket shared by every request whose client IP is missing or unparsable. */
export const UNKNOWN_IP_BUCKET = "unknown-ip";

/**
 * Limit for the shared unknown-IP bucket: half the per-IP limit (at least 1). All clients without
 * a usable IP share it, so it must not become a way around the per-IP limit. On Vercel the platform
 * always sets x-forwarded-for, so this bucket only fills when the deployment is misconfigured.
 */
export function unknownIpLimit(limit: number): number {
  return Math.max(1, Math.floor(limit / 2));
}

/**
 * Stable per-client key: salted hash of the IPv4 address or IPv6 /64 prefix, or UNKNOWN_IP_BUCKET
 * when the request carries no usable IP.
 */
export function clientKey(ip: string): string {
  const subject = rateLimitSubject(ip);
  return subject === null ? UNKNOWN_IP_BUCKET : hashIp(subject);
}

/**
 * Per-client rate limit for `scope` ("audit", "unlock", "contact"), keyed by clientKey(ip).
 * Requests without a usable IP all share one bucket with a stricter limit.
 */
export async function rateLimitByIp(scope: string, ip: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const key = clientKey(ip);
  const effective = key === UNKNOWN_IP_BUCKET ? { ...opts, limit: unknownIpLimit(opts.limit) } : opts;
  return rateLimit(`${scope}:${key}`, effective);
}

/** Test helper: clears the in-memory store. */
export function resetMemoryRateLimit(): void {
  memory.clear();
  lastSweep = 0;
  warnedMemoryInProduction = false;
}
