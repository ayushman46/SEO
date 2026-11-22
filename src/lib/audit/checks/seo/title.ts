import { outcome, plural, type Check } from "../../context";
import { evaluateTextField } from "./text-field";

const def = { id: "seo.title", category: "seo", label: "Title tags" } as const;

export const titleCheck: Check = (ctx) => {
  const r = evaluateTextField(ctx.pages, (p) => p.title, {
    min: 30,
    max: 60,
    keys: { missing: "seo.title:missing", length: "seo.title:length", duplicate: "seo.title:duplicate" },
    homeMissingSeverity: "critical",
  });
  const n = ctx.pages.length;
  return outcome(def, {
    score: r.score,
    summary: `${r.good} of ${plural(n, "page")} ${r.good === 1 ? "has" : "have"} a unique title between 30 and 60 characters.`,
    issues: r.issues,
  });
};
