import "server-only";
import { randomBytes } from "node:crypto";
import type { AuditContext, Soft404Probe } from "../context";
import { isBlocked, OUR_BOT, parseRobots } from "../robots";
import { safeFetch, type SafeFetchOptions, type SafeFetchResult } from "./fetch";

/**
 * One request to an obviously non-existent path on the audited host (T020 N6). No redirects are
 * followed (we stay on the host and see where it points). Never throws.
 */
export const SOFT404_TIMEOUT_MS = 4_000;
export const TITLE_RE = /<title[^<>]{0,200}>([^<]{0,200})/i;
const BODY_CAP = 32 * 1024;

export function soft404Path(): string {
  return `/noticr-missing-page-${randomBytes(6).toString("hex")}`;
}

export async function probeSoft404(
  ctx: AuditContext,
  opts: { timeoutMs: number; signal?: AbortSignal; path?: string; fetcher?: (u: string, o: SafeFetchOptions) => Promise<SafeFetchResult> },
): Promise<Soft404Probe> {
  try {
    if (opts.signal?.aborted) return { status: "skipped", reason: "aborted" };
    const url = new URL(opts.path ?? soft404Path(), ctx.origin).toString();
    if (isBlocked(parseRobots(ctx.robots), url, OUR_BOT)) return { status: "skipped", reason: "robots" };
    const res = await (opts.fetcher ?? safeFetch)(url, {
      kind: "text",
      maxRedirects: 0,
      maxBytes: BODY_CAP,
      onOverflow: "truncate",
      timeoutMs: Math.max(500, Math.min(SOFT404_TIMEOUT_MS, opts.timeoutMs)),
      signal: opts.signal,
    });
    const title = TITLE_RE.exec(res.text.slice(0, BODY_CAP))?.[1]?.trim() ?? null;
    return { status: "ok", url, statusCode: res.status, location: res.location, title };
  } catch {
    return { status: "skipped", reason: opts.signal?.aborted ? "aborted" : "error" };
  }
}
