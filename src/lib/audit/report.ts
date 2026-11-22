import type {
  AiDrafts,
  AiInsights,
  Answered,
  AuditIssue,
  AuditResult,
  FactStatus,
  PartialAiInsights,
  PartialAuditReport,
  Severity,
} from "./types";
import { sortIssues } from "./score";
import { issueCopy } from "./issues";

export const SAMPLE_QUESTIONS = 2;
const DRAFT_KEYS: (keyof AiDrafts)[] = ["title", "metaDescription", "llmsTxt", "organizationJsonLd", "answerParagraph"];

/** Teaser of the AI insights: no drafts, no fact values, only the first 2 questions in full. */
export function toPartialAi(ai: AiInsights | null | undefined): PartialAiInsights | null {
  if (!ai) return null;
  const factCounts: Record<FactStatus, number> = { clear: 0, vague: 0, missing: 0 };
  for (const f of ai.facts) factCounts[f.status]++;
  const questionCounts: Record<Answered, number> = { yes: 0, partly: 0, no: 0 };
  for (const q of ai.questions) questionCounts[q.answered]++;
  return {
    model: ai.model,
    readback: ai.readback,
    businessType: ai.businessType,
    clarityScore: ai.clarityScore,
    factCounts,
    questionCounts,
    sampleQuestions: ai.questions.slice(0, SAMPLE_QUESTIONS).map((q) => ({ ...q })),
    lockedQuestionCount: Math.max(0, ai.questions.length - SAMPLE_QUESTIONS),
    lockedDrafts: DRAFT_KEYS.filter((k) => ai.drafts[k] !== null && ai.drafts[k] !== undefined),
  };
}

/**
 * The unanswered-questions issue lists every question in its description; before unlock only
 * the catalog copy is shown so locked questions don't leak through a top issue.
 */
function redactForPartial(i: AuditIssue): AuditIssue {
  const copy = { ...i, affectedUrls: [...i.affectedUrls] };
  if (i.id === "geo.ai-clarity:unanswered-questions") {
    copy.description = `${issueCopy("geo.ai-clarity:unanswered-questions").description} The full list is in your full report.`;
  }
  return copy;
}

/** What the browser gets before the email gate: top 3 issues in full, the rest as a teaser. */
export function toPartialReport(result: AuditResult): PartialAuditReport {
  const sorted = sortIssues(result.issues);
  const issueCounts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const i of sorted) issueCounts[i.severity]++;
  return {
    id: result.id,
    finalUrl: result.finalUrl,
    hostname: result.hostname,
    scores: { ...result.scores },
    pagesScanned: result.pages.length,
    issueCounts,
    topIssues: sorted.slice(0, 3).map(redactForPartial),
    lockedIssues: sorted.slice(3).map((i) => ({ id: i.id, title: i.title, severity: i.severity, category: i.category })),
    checks: result.checks.map((c) => ({ id: c.id, category: c.category, label: c.label, status: c.status })),
    durationMs: result.durationMs,
    truncated: result.truncated,
    ai: toPartialAi(result.ai),
  };
}
