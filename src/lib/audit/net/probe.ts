import "server-only";
import type { AuditContext, BotProbe, CrawlerProbe, ProbeResponse, ProbeTarget } from "../context";
import { AuditError } from "../types";
import { isBlocked, OUR_BOT, parseRobots } from "../robots";
import { PROBE_BOTS } from "../checks/geo/crawler-probe";
import { safeFetch, type SafeFetchOptions, type SafeFetchResult, type SimulatedBotToken } from "./fetch";

/**
 * Live AI-crawler probe (T016 C, ADR-017). Same host only, through safeFetch (SSRF-pinned), with a
 * labelled simulated User-Agent per bot. HEAD first; GET (small body cap) only for the homepage
 * or when HEAD looks refused/unsupported. Low concurrency, short per-request timeout and a hard
 * phase deadline. The "browser" baseline is the crawler's own noticrbot response. Never throws.
 */

export const PROBE_MAX_MS = 6_000;
export const PROBE_REQUEST_TIMEOUT_MS = 2_500;
export const PROBE_CONCURRENCY = 2;
/** At most this many GETs per bot (block-page classification); everything else is HEAD. */
export const PROBE_MAX_GETS_PER_BOT = 2;
/** Reuse a host's probe result for this long (R3 M4). In-memory, per server instance. */
export const PROBE_CACHE_TTL_MS = 15 * 60 * 1000;
const PROBE_CACHE_MAX = 500;
const probeCache = new Map<string, { at: number; result: Extract<CrawlerProbe, { status: "ok" }> }>();

export function clearProbeCache(): void {
  probeCache.clear();
}

function cacheKey(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}
export const PROBE_BODY_CAP = 64 * 1024;
/** Homepage + this many other crawled pages. */
export const PROBE_EXTRA_PAGES = 2;

export type Fetcher = (url: string, opts: SafeFetchOptions) => Promise<SafeFetchResult>;

export interface ProbeOptions {
  /** absolute epoch-ms deadline for the whole probe */
  deadline: number;
  signal?: AbortSignal;
  fetcher?: Fetcher;
}

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host.toLowerCase() === new URL(b).host.toLowerCase();
  } catch {
    return false;
  }
}

/** URLs to probe, with what our crawler got for each. */
export function probeTargets(ctx: AuditContext): ProbeTarget[] {
  const home = ctx.pages[0];
  if (!home) return [];
  const targets: ProbeTarget[] = [];
  const robots = parseRobots(ctx.robots);
  const add = (t: ProbeTarget) => {
    if (!sameHost(t.url, home.url)) return; // never probe another host
    if (isBlocked(robots, t.url, OUR_BOT)) return; // respect robots.txt for our own bot
    if (targets.some((x) => x.url === t.url)) return;
    targets.push(t);
  };
  let homeSize: number | null = null;
  try {
    homeSize = home.$.html().length;
  } catch {
    homeSize = null;
  }
  add({ url: home.url, kind: "page", baselineStatus: home.statusCode, baselineSize: homeSize });
  for (const p of ctx.pages.slice(1)) {
    if (targets.length >= 1 + PROBE_EXTRA_PAGES) break;
    if (p.statusCode >= 400) continue;
    add({ url: p.url, kind: "page", baselineStatus: p.statusCode, baselineSize: null });
  }
  if (ctx.robots.statusCode !== null) {
    add({ url: ctx.robots.requestedUrl ?? ctx.robots.url, kind: "robots", baselineStatus: ctx.robots.statusCode, baselineSize: null });
  }
  if (ctx.llms.status === "ok" && ctx.llms.statusCode !== null) {
    add({ url: ctx.llms.requestedUrl ?? ctx.llms.url, kind: "llms", baselineStatus: ctx.llms.statusCode, baselineSize: null });
  }
  return targets;
}

function toResponse(method: "HEAD" | "GET", r: SafeFetchResult): ProbeResponse {
  const keep: Record<string, string> = {};
  // Only headers the classifier uses; never store cookies.
  for (const k of [
    "server", "via", "cf-ray", "cf-mitigated", "x-vercel-id", "x-vercel-mitigated", "akamai-grn", "x-sucuri-id",
    "x-sucuri-block", "x-iinfo", "x-cdn", "x-amz-cf-id", "x-datadome", "x-nf-request-id", "x-fastly-request-id",
    "x-served-by", "content-type",
  ]) {
    if (r.headers[k] !== undefined) keep[k] = r.headers[k].slice(0, 200);
  }
  return { method, status: r.status, headers: keep, body: method === "GET" ? r.text.slice(0, 20_000) : "", size: r.text.length };
}

export async function probeCrawlers(ctx: AuditContext, opts: ProbeOptions): Promise<CrawlerProbe> {
  try {
    const home = ctx.pages[0];
    if (!home) return { status: "skipped", reason: "error" };
    // Baseline: the response our crawler already got. If noticrbot itself was refused, we can't compare.
    if (home.statusCode >= 400) return { status: "inconclusive", baselineStatus: home.statusCode };
    if (opts.signal?.aborted) return { status: "skipped", reason: "aborted" };

    const key = cacheKey(home.url);
    const now = Date.now();
    const hit = key ? probeCache.get(key) : undefined;
    if (hit && now - hit.at < PROBE_CACHE_TTL_MS) return { ...hit.result, cached: true };

    const targets = probeTargets(ctx);
    const robots = parseRobots(ctx.robots);
    const fetcher = opts.fetcher ?? safeFetch;
    const phase = new AbortController();
    const timer = setTimeout(() => phase.abort(), Math.max(0, opts.deadline - Date.now()));
    const signal = opts.signal ? AbortSignal.any([opts.signal, phase.signal]) : phase.signal;

    const skippedByRobots: { bot: string; url: string }[] = [];
    const jobs: { bot: (typeof PROBE_BOTS)[number]; target: ProbeTarget }[] = [];
    for (const target of targets) {
      for (const bot of PROBE_BOTS) {
        // robots.txt itself is always fetchable; other URLs disallowed for this bot are the robots
        // check's business (geo.ai-crawlers), not a firewall finding.
        if (target.kind !== "robots" && isBlocked(robots, target.url, bot.name)) {
          skippedByRobots.push({ bot: bot.name, url: target.url });
          continue;
        }
        jobs.push({ bot, target });
      }
    }

    const probes: BotProbe[] = jobs.map((j) => ({ bot: j.bot.name, url: j.target.url, kind: j.target.kind, response: null }));
    let next = 0;
    let backOff = false; // a 429 stops new requests: never hammer a rate-limited site
    const getsPerBot = new Map<string, number>();
    const timeout = () => Math.max(300, Math.min(PROBE_REQUEST_TIMEOUT_MS, opts.deadline - Date.now()));
    const one = async (i: number) => {
      const { bot, target } = jobs[i];
      // Same Accept header as the crawler's baseline request, so content negotiation can't skew the comparison.
      const base = {
        kind: "text" as const,
        acceptHtml: target.kind === "page",
        maxRedirects: 0,
        signal,
        simulate: bot.token as SimulatedBotToken,
      };
      let res: ProbeResponse | null = null;
      try {
        const head = await fetcher(target.url, { ...base, method: "HEAD", timeoutMs: timeout() });
        res = toResponse("HEAD", head);
        if (res.status === 429) backOff = true;
      } catch (err) {
        if (signal.aborted || !(err instanceof AuditError)) return;
        res = null; // HEAD failed (some servers reset HEAD): fall through to GET
      }
      // GET only when HEAD is refused or unsupported (R3 M4), never after a 429, and at most
      // PROBE_MAX_GETS_PER_BOT times per bot.
      const needGet = res === null || (res.status >= 400 && res.status !== 429);
      const gets = getsPerBot.get(bot.name) ?? 0;
      if (needGet && !backOff && gets < PROBE_MAX_GETS_PER_BOT && !signal.aborted && opts.deadline - Date.now() > 300) {
        getsPerBot.set(bot.name, gets + 1);
        try {
          const get = await fetcher(target.url, { ...base, method: "GET", maxBytes: PROBE_BODY_CAP, onOverflow: "truncate", timeoutMs: timeout() });
          res = toResponse("GET", get);
          if (res.status === 429) backOff = true;
        } catch {
          /* keep the HEAD result if we have one */
        }
      }
      // HEAD unsupported and no GET made: we learned nothing about this bot here.
      if (res && res.method === "HEAD" && (res.status === 405 || res.status === 501)) res = null;
      probes[i].response = res;
    };
    const worker = async () => {
      while (next < jobs.length && !backOff && !signal.aborted && opts.deadline - Date.now() > 300) {
        const i = next++;
        await one(i);
      }
    };
    try {
      await Promise.all(Array.from({ length: Math.min(PROBE_CONCURRENCY, jobs.length) }, worker));
    } finally {
      clearTimeout(timer);
      if (!phase.signal.aborted) phase.abort();
    }
    if (opts.signal?.aborted) return { status: "skipped", reason: "aborted" };
    const result = { status: "ok" as const, targets, probes, skippedByRobots };
    if (key) {
      if (probeCache.size >= PROBE_CACHE_MAX) {
        const oldest = probeCache.keys().next().value;
        if (oldest !== undefined) probeCache.delete(oldest);
      }
      probeCache.set(key, { at: Date.now(), result });
    }
    return result;
  } catch {
    return { status: "skipped", reason: "error" };
  }
}
