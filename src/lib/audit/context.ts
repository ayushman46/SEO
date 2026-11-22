/**
 * Internal types shared by crawl → checks → scoring. Not part of the public contract.
 */
import type { AiInsights, Category, CheckStatus, CoreWebVitals, Severity } from "./types";
import type { PageData } from "./html";
import type { IssueKey } from "./issues";

export type FetchedStatus = "ok" | "missing" | "error" | "skipped";

export interface FetchedText {
  status: FetchedStatus;
  /** final URL after redirects (or the URL we would have fetched) */
  url: string;
  /** URL we asked for, before redirects (e.g. https://site/robots.txt) */
  requestedUrl?: string;
  statusCode: number | null;
  text: string | null;
}

export interface PsiOutcome {
  ok: boolean;
  vitals: CoreWebVitals | null;
  /** why it is unavailable, for notes */
  error: string | null;
}

export interface AuditContext {
  requestedUrl: string;
  finalUrl: string;
  hostname: string;
  origin: string;
  /** pages[0] is the homepage */
  pages: PageData[];
  robots: FetchedText;
  sitemap: FetchedText;
  llms: FetchedText;
  /** result of probing http://host/ — null when not checked */
  httpToHttps: { checked: boolean; redirectsToHttps: boolean | null };
  psi: PsiOutcome;
  /** audit start time; date-dependent checks use this (falls back to the current time) */
  now?: Date;
}

export interface IssueSeed {
  key: IssueKey;
  affectedUrls?: string[];
  /** extra sentence appended to the catalog description (specifics such as bot names) */
  detail?: string;
  /** override the catalog severity (e.g. homepage-only problems) */
  severity?: Severity;
  /** relative share of this check's recoverable points (default 1) */
  share?: number;
}

export interface CheckOutcome {
  id: string;
  category: Category;
  label: string;
  status: CheckStatus;
  /** 0..1 */
  score: number;
  summary: string;
  issues: IssueSeed[];
}

export type Check = (ctx: AuditContext) => CheckOutcome;

/**
 * Build an outcome while enforcing the invariants:
 *  - no issues  → status "pass", score 1
 *  - has issues → status "warn" or "fail" (fail when score < 0.5 unless overridden)
 */
export function outcome(
  def: { id: string; category: Category; label: string },
  r: { score: number; summary: string; issues: IssueSeed[]; status?: "warn" | "fail" },
): CheckOutcome {
  if (r.issues.length === 0) {
    return { ...def, status: "pass", score: 1, summary: r.summary, issues: [] };
  }
  const score = Math.max(0, Math.min(1, r.score));
  const status = r.status ?? (score < 0.5 ? "fail" : "warn");
  // A non-pass check never reports a perfect score.
  return { ...def, status, score: Math.min(score, 0.99), summary: r.summary, issues: r.issues };
}

export function unavailable(
  def: { id: string; category: Category; label: string },
  summary: string,
): CheckOutcome {
  return { ...def, status: "unavailable", score: 0, summary, issues: [] };
}

export function plural(n: number, one: string, many?: string): string {
  return `${n} ${n === 1 ? one : (many ?? `${one}s`)}`;
}

/**
 * Outcome of the optional LLM phase (T014). "skipped" = no key or not enough time;
 * "failed" = the model call or its output didn't pass validation. Either way the
 * geo.ai-clarity check is "unavailable" and scores are unchanged.
 */
export type AiPhase =
  | { status: "ok"; insights: AiInsights; local: boolean }
  | { status: "skipped" | "failed"; reason: "no_key" | "no_time" | "aborted" | "error" };

/* ── Crawler probe (T016 C, ADR-017) ── */

export type ProbeTargetKind = "page" | "robots" | "llms";

export interface ProbeTarget {
  url: string;
  kind: ProbeTargetKind;
  /** status the crawler (seenhqbot) got for this URL */
  baselineStatus: number | null;
  /** body size the crawler got (chars), when known */
  baselineSize: number | null;
}

export interface ProbeResponse {
  method: "HEAD" | "GET";
  status: number;
  headers: Record<string, string>;
  /** first part of the body (GET only, capped) */
  body: string;
  size: number;
}

export interface BotProbe {
  /** robots.txt product token, e.g. "GPTBot" */
  bot: string;
  url: string;
  kind: ProbeTargetKind;
  /** null = not tested (time ran out, network error) */
  response: ProbeResponse | null;
}

export type CrawlerProbe =
  | { status: "ok"; targets: ProbeTarget[]; probes: BotProbe[]; skippedByRobots: { bot: string; url: string }[] }
  | { status: "inconclusive"; baselineStatus: number }
  | { status: "skipped"; reason: "not_run" | "no_time" | "aborted" | "error" };

/* ── Soft-404 probe (T020 N6) ── */
export type Soft404Probe =
  | { status: "ok"; url: string; statusCode: number; location: string | null; title: string | null }
  | { status: "skipped"; reason: "not_run" | "no_time" | "aborted" | "error" | "robots" };
