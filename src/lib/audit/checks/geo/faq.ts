import { outcome, plural, type Check } from "../../context";
import { allJsonLdNodes, cleanText, nodeTypes } from "../../html";

const def = { id: "geo.faq", category: "geo", label: "Questions & answers" } as const;

/**
 * Question-shaped headings without a "?" ("How to fix a leak", "What is a root canal").
 * Deliberately excludes label-style headings like "How we work" / "Who we are".
 */
const QUESTION_SHAPE = [
  /^(how|what|why|when|where|who|which)\s+(is|are|was|were|do|does|did|can|could|should|will|would|much|many|long|often|to)\b/i,
  /^(can|could|do|does|did|is|are|should|will|would|may|have|has)\s+(i|you|we|they|my|your|our|the|it|a|an|this|there)\b/i,
];

export function isQuestion(text: string): boolean {
  const t = cleanText(text);
  if (t.length < 6 || t.length > 200) return false;
  return t.endsWith("?") || QUESTION_SHAPE.some((r) => r.test(t));
}

export const faqCheck: Check = (ctx) => {
  const faqSchemaPages = new Set(
    allJsonLdNodes(ctx.pages)
      .filter(({ node }) => nodeTypes(node).some((t) => t === "FAQPage" || t === "QAPage"))
      .map(({ url }) => url),
  );
  const questions = new Set<string>();
  for (const p of ctx.pages) {
    for (const h of p.headings) if (h.level >= 2 && isQuestion(h.text)) questions.add(h.text.toLowerCase());
    p.$("summary, dt").each((_, el) => {
      const t = cleanText(p.$(el).text());
      if (isQuestion(t)) questions.add(t.toLowerCase());
    });
  }
  const q = questions.size;

  if (faqSchemaPages.size > 0) {
    return outcome(def, {
      score: 1,
      summary: `FAQ schema found${q ? ` and ${plural(q, "question-style heading")}` : ""}.`,
      issues: [],
    });
  }
  if (q >= 3) {
    return outcome(def, {
      score: 1,
      summary: `${plural(q, "question-style heading")} found across your pages.`,
      issues: [],
    });
  }
  if (q > 0) {
    return outcome(def, {
      score: 0.5,
      summary: `Only ${plural(q, "question-style heading")} found and no FAQ schema.`,
      issues: [{ key: "geo.faq:few" }],
    });
  }
  return outcome(def, {
    score: 0,
    summary: "No FAQ schema or question-style headings were found.",
    issues: [{ key: "geo.faq:missing" }],
  });
};
