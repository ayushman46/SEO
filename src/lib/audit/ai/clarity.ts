/**
 * clarityScore: computed by us from the model's fact/question statuses, never chosen by the model.
 *
 *   facts      weighted mean of clear=1 / vague=0.5 / missing=0
 *              weights: what 3, who-for 2, contact 2, where 1.5 (local businesses only), pricing 1,
 *              proof 1, differentiator 1
 *   questions  mean of yes=1 / partly=0.5 / no=0
 *   clarity    round(100 × (0.6 × facts + 0.4 × questions))
 */
import type { AiFact, AiQuestion, Answered, FactStatus } from "../types";

export const FACT_WEIGHTS: Record<string, number> = {
  what: 3,
  "who-for": 2,
  contact: 2,
  where: 1.5,
  pricing: 1,
  proof: 1,
  differentiator: 1,
};

export const FACT_VALUE: Record<FactStatus, number> = { clear: 1, vague: 0.5, missing: 0 };
export const ANSWER_VALUE: Record<Answered, number> = { yes: 1, partly: 0.5, no: 0 };
export const FACTS_SHARE = 0.6;
export const QUESTIONS_SHARE = 0.4;

export function factsScore(facts: AiFact[], local: boolean): number {
  let num = 0;
  let den = 0;
  for (const f of facts) {
    if (f.key === "where" && !local) continue;
    const w = FACT_WEIGHTS[f.key] ?? 0;
    num += w * FACT_VALUE[f.status];
    den += w;
  }
  return den > 0 ? num / den : 0;
}

export function questionsScore(questions: AiQuestion[]): number {
  if (questions.length === 0) return 0;
  return questions.reduce((s, q) => s + ANSWER_VALUE[q.answered], 0) / questions.length;
}

export function computeClarityScore(facts: AiFact[], questions: AiQuestion[], local: boolean): number {
  const raw = FACTS_SHARE * factsScore(facts, local) + QUESTIONS_SHARE * questionsScore(questions);
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}
