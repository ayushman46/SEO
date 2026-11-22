import { outcome, plural, type Check } from "../../context";
import { evaluateTextField } from "./text-field";

const def = { id: "seo.meta-description", category: "seo", label: "Meta descriptions" } as const;

export const metaDescriptionCheck: Check = (ctx) => {
  const r = evaluateTextField(ctx.pages, (p) => p.metaDescription, {
    min: 70,
    max: 160,
    keys: {
      missing: "seo.meta-description:missing",
      length: "seo.meta-description:length",
      duplicate: "seo.meta-description:duplicate",
    },
  });
  const n = ctx.pages.length;
  return outcome(def, {
    score: r.score,
    summary: `${r.good} of ${plural(n, "page")} ${r.good === 1 ? "has" : "have"} a unique meta description between 70 and 160 characters.`,
    issues: r.issues,
  });
};
