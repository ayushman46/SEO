/**
 * Internal types shared by crawl → checks → scoring. Not part of the public contract.
 */
import type { Category, CheckStatus, CoreWebVitals, Severity } from "./types";
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
