import "server-only";
import { getDb } from "@/lib/db";

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
  if (!sql) return memoryRateLimit(safeBucket, opts, now);

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

/** Test helper: clears the in-memory store. */
export function resetMemoryRateLimit(): void {
  memory.clear();
  lastSweep = 0;
}
