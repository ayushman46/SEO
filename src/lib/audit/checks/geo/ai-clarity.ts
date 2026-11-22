import type { AiFact } from "../../types";
import { plural, unavailable, type AiPhase, type CheckOutcome, type IssueSeed } from "../../context";
import type { IssueKey } from "../../issues";

export const AI_CLARITY_ID = "geo.ai-clarity";
const def = { id: AI_CLARITY_ID, category: "geo", label: "AI readability of your business" } as const;

export const PASS_AT = 80;
export const WARN_AT = 50;
/** How many unanswered questions the issue lists by name. */
const MAX_LISTED_QUESTIONS = 8;

const UNAVAILABLE_SUMMARY: Record<Exclude<AiPhase, { status: "ok" }>["reason"], string> = {
  no_key: "AI reading isn't switched on for this audit, so this check was left out of the score.",
  no_time: "There wasn't enough time left to have an AI model read your site, so this check was left out of the score.",
  aborted: "The AI reading was cancelled, so this check was left out of the score.",
  error: "The AI reading couldn't be completed this time, so this check was left out of the score.",
};

const FACT_ISSUES: { key: string; issue: IssueKey; missing: IssueSeed["severity"]; vague: IssueSeed["severity"] }[] = [
  { key: "what", issue: "geo.ai-clarity:what", missing: "high", vague: "medium" },
  { key: "who-for", issue: "geo.ai-clarity:who-for", missing: "high", vague: "medium" },
  { key: "where", issue: "geo.ai-clarity:where", missing: "medium", vague: "low" },
  { key: "pricing", issue: "geo.ai-clarity:pricing", missing: "medium", vague: "low" },
  { key: "contact", issue: "geo.ai-clarity:contact", missing: "medium", vague: "low" },
];
const SHARE = { high: 3, medium: 2, low: 1, critical: 3 } as const;

/**
 * geo.ai-clarity: how clearly an AI model reading the site can tell what the business is.
 * score = clarityScore / 100; pass ≥ 80, warn 50–79, fail < 50; "unavailable" without a result.
 * Issues only on warn/fail (a passing check carries no issues, like every other check).
 */
export function aiClarityOutcome(phase: AiPhase): CheckOutcome {
  if (phase.status !== "ok") return unavailable(def, UNAVAILABLE_SUMMARY[phase.reason]);
  const { insights, local } = phase;
  const clarity = insights.clarityScore;
  const score = Math.max(0, Math.min(1, clarity / 100));
  const byKey = new Map<string, AiFact>(insights.facts.map((f) => [f.key, f]));

  const weakCore = FACT_ISSUES.filter(({ key }) => {
    if (key === "where" && !local) return false;
    const f = byKey.get(key);
    return !f || f.status !== "clear";
  });
  const open = insights.questions.filter((q) => q.answered !== "yes");
  const summary =
    `An AI model reading your site rated its clarity ${clarity}/100: ` +
    `${plural(weakCore.length, "core fact")} ${weakCore.length === 1 ? "is" : "are"} vague or missing, and ` +
    `${open.length} of ${insights.questions.length} likely customer questions ${open.length === 1 ? "isn't" : "aren't"} fully answered.`;

  if (clarity >= PASS_AT) return { ...def, status: "pass", score, summary, issues: [] };

  const issues: IssueSeed[] = [];
  for (const fi of weakCore) {
    const f = byKey.get(fi.key);
    const missing = !f || f.status === "missing";
    const severity = missing ? fi.missing : fi.vague;
    issues.push({
      key: fi.issue,
      severity,
      share: SHARE[severity ?? "low"],
      detail: missing ? "It wasn't found on the pages we read." : "It's mentioned, but only vaguely or partly.",
    });
  }
  if (open.length > 0) {
    const listed = open.slice(0, MAX_LISTED_QUESTIONS).map((q) => `"${q.question}"`);
    issues.push({
      key: "geo.ai-clarity:unanswered-questions",
      severity: open.length >= Math.ceil(insights.questions.length / 2) ? "medium" : "low",
      share: 2,
      detail: `Not fully answered: ${listed.join("; ")}.`,
    });
  }
  const proofWeak = ["proof", "differentiator"].some((k) => byKey.get(k)?.status !== "clear");
  if (proofWeak || issues.length === 0) {
    issues.push({ key: "geo.ai-clarity:proof", share: 1 });
  }

  return { ...def, status: clarity >= WARN_AT ? "warn" : "fail", score: Math.min(score, 0.99), summary, issues };
}
