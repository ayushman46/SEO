/**
 * CONTRACT — owned by Fable. Agents may not change shapes without escalating.
 * Shared by audit-engine (producer), architect-backend (API), frontend-designer (UI).
 */

export type Severity = "critical" | "high" | "medium" | "low";
export type Category = "seo" | "geo" | "performance";
export type Effort = "quick" | "moderate" | "involved";
export type CheckStatus = "pass" | "warn" | "fail" | "unavailable";

export interface CheckResult {
  /** stable id, e.g. "seo.title", "geo.ai-crawlers" */
  id: string;
  category: Category;
  /** short human label, e.g. "Title tags" */
  label: string;
  status: CheckStatus;
  /** 0..1, ignored when status === "unavailable" */
  score: number;
  /** relative weight inside its category */
  weight: number;
  /** one-sentence plain-English result, e.g. "4 of 6 pages have a title between 30 and 60 characters." */
  summary: string;
}

export interface AuditIssue {
  /** unique within a result, e.g. "seo.title:missing" */
  id: string;
  checkId: string;
  category: Category;
  severity: Severity;
  title: string;
  /** why it matters, 1–2 sentences */
  description: string;
  /** concrete fix, may contain a short code snippet in backticks */
  howToFix: string;
  effort: Effort;
  /** estimated overall-score points recoverable if fixed (0..100) */
  impact: number;
  /** pages affected (absolute URLs); empty for site-level issues */
  affectedUrls: string[];
}

export interface PageSummary {
  url: string;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  wordCount: number;
  indexable: boolean;
  issueCount: number;
}

export interface CoreWebVitals {
  source: "pagespeed-insights";
  strategy: "mobile";
  performanceScore: number | null; // 0..100
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null; // field data only, may be null
  fcpMs: number | null;
  tbtMs: number | null;
}

export interface AuditScores {
  overall: number; // 0..100 integer
  seo: number;
  geo: number;
  performance: number | null; // null when PSI unavailable
}

export interface AuditResult {
  id: string; // uuid
  version: 1;
  requestedUrl: string;
  finalUrl: string;
  hostname: string;
  startedAt: string; // ISO
  durationMs: number;
  scores: AuditScores;
  checks: CheckResult[];
  issues: AuditIssue[]; // sorted: severity desc, impact desc
  pages: PageSummary[];
  coreWebVitals: CoreWebVitals | null;
  /** true when the time budget cut the crawl short */
  truncated: boolean;
  notes: string[]; // e.g. "robots.txt disallows crawling /blog — skipped"
  /** LLM-assisted insights (contract v1.1). null/absent when no LLM key, on timeout or on error. */
  ai?: AiInsights | null;
}

/* ---------- AI insights (contract v1.1, additive) ----------
 * Produced by an LLM reading ONLY text we extracted from the audited site.
 * Everything here is one model's reading of the site, never a claim about what
 * ChatGPT, Gemini or any other assistant actually answers. Page text is untrusted input.
 */
export type FactStatus = "clear" | "vague" | "missing";
export type Answered = "yes" | "partly" | "no";

export interface AiFact {
  /** fixed keys: "what" | "who-for" | "where" | "pricing" | "contact" | "proof" | "differentiator" */
  key: string;
  label: string;
  /** what the model found, quoted or closely paraphrased from the site; null when missing */
  value: string | null;
  status: FactStatus;
}

export interface AiQuestion {
  /** a question a real customer would ask an AI assistant about this business */
  question: string;
  answered: Answered;
  /** URL of the audited page that answers it, when answered */
  sourceUrl: string | null;
  /** one sentence: what is missing, or where the answer is */
  note: string;
}

export interface AiDrafts {
  /** ready-to-paste improvements; each is null when the current one is already good or cannot be drafted */
  title: string | null;
  metaDescription: string | null;
  /** a complete llms.txt draft (llmstxt.org format); null if the site already has one */
  llmsTxt: string | null;
  /** Organization/LocalBusiness JSON-LD draft (valid JSON string) built only from facts found on the site */
  organizationJsonLd: string | null;
  /** 2-4 sentence answer-ready "about" paragraph built only from facts found on the site */
  answerParagraph: string | null;
}

export interface AiInsights {
  /** provider model id */
  model: string;
  /** 2-3 sentences: how an AI model would describe this business from its own site */
  readback: string;
  /** detected business type, e.g. "local dental clinic", "B2B SaaS" */
  businessType: string | null;
  facts: AiFact[];
  questions: AiQuestion[];
  drafts: AiDrafts;
  /** 0..100, computed deterministically from facts + questions (never chosen by the model) */
  clarityScore: number;
}

export interface PartialAiInsights {
  model: string;
  readback: string;
  businessType: string | null;
  clarityScore: number;
  factCounts: Record<FactStatus, number>;
  questionCounts: Record<Answered, number>;
  /** first 2 questions in full; the rest and all drafts are locked */
  sampleQuestions: AiQuestion[];
  lockedQuestionCount: number;
  /** which drafts exist, e.g. ["title", "llmsTxt"] */
  lockedDrafts: (keyof AiDrafts)[];
}

/** What the browser gets before the email gate. */
export interface PartialAuditReport {
  id: string;
  finalUrl: string;
  hostname: string;
  scores: AuditScores;
  pagesScanned: number;
  issueCounts: Record<Severity, number>;
  /** top 3 issues by severity/impact, full detail */
  topIssues: AuditIssue[];
  /** remaining issues: title + severity only (teaser) */
  lockedIssues: Pick<AuditIssue, "id" | "title" | "severity" | "category">[];
  checks: Pick<CheckResult, "id" | "category" | "label" | "status">[];
  durationMs: number;
  truncated: boolean;
  /** Teaser of the AI insights; full detail only after unlock. */
  ai?: PartialAiInsights | null;
}

export interface RunAuditOptions {
  /** max internal pages beyond the homepage (default 5) */
  maxPages?: number;
  /** total budget in ms (default 55_000) */
  budgetMs?: number;
  /** abort signal from the request */
  signal?: AbortSignal;
}

/** Error the engine throws for user-facing failures (bad URL, blocked host, unreachable). */
export class AuditError extends Error {
  constructor(
    public code:
      | "invalid_url"
      | "blocked_host"
      | "unreachable"
      | "timeout"
      | "not_html"
      | "too_large",
    message: string,
  ) {
    super(message);
    this.name = "AuditError";
  }
}

/*
 * Engine entry points (implemented by audit-engine in src/lib/audit/index.ts):
 *   export async function runAudit(url: string, opts?: RunAuditOptions): Promise<AuditResult>
 *   export function toPartialReport(result: AuditResult): PartialAuditReport
 *   export function normalizeAuditUrl(input: string): string   // throws AuditError("invalid_url")
 *
 * API contract (implemented by architect-backend):
 *   POST /api/audit          body {url}                      -> 200 {partial: PartialAuditReport, sealed: string}
 *                                                               4xx {error: {code, message}}  (429 includes retryAfter seconds)
 *   POST /api/audit/unlock   body {sealed, email, consent:true}-> 200 {result: AuditResult} | 4xx {error}
 */
