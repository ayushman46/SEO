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
 * phase deadline. The "browser" baseline is the crawler's own seenhqbot response. Never throws.
 */

export const PROBE_MAX_MS = 6_000;
export const PROBE_REQUEST_TIMEOUT_MS = 2_500;
export const PROBE_CONCURRENCY = 4;
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
    // Baseline: the response our crawler already got. If seenhqbot itself was refused, we can't compare.
    if (home.statusCode >= 400) return { status: "inconclusive", baselineStatus: home.statusCode };
    if (opts.signal?.aborted) return { status: "skipped", reason: "aborted" };

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
      } catch (err) {
        if (signal.aborted || !(err instanceof AuditError)) return;
        res = null; // HEAD failed (some servers reset HEAD): fall through to GET
      }
      const needGet =
        res === null ||
        (target.kind === "page" && target === targets[0]) ||
        res.status >= 400 ||
        res.status !== target.baselineStatus;
      if (needGet && !signal.aborted && opts.deadline - Date.now() > 300) {
        try {
          const get = await fetcher(target.url, { ...base, method: "GET", maxBytes: PROBE_BODY_CAP, onOverflow: "truncate", timeoutMs: timeout() });
          res = toResponse("GET", get);
        } catch {
          /* keep the HEAD result if we have one */
        }
      }
      probes[i].response = res;
    };
    const worker = async () => {
      while (next < jobs.length && !signal.aborted && opts.deadline - Date.now() > 300) {
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
    return { status: "ok", targets, probes, skippedByRobots };
  } catch {
    return { status: "skipped", reason: "error" };
  }
}
