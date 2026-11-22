import { outcome, plural, type Check, type IssueSeed } from "../../context";
import { nodeTypes } from "../../html";

const def = { id: "seo.structured-data", category: "seo", label: "Structured data" } as const;

export const structuredDataCheck: Check = (ctx) => {
  const invalid: string[] = [];
  const noType: string[] = [];
  const types = new Set<string>();
  let withValid = 0;

  for (const p of ctx.pages) {
    if (p.jsonLd.length === 0) continue;
    let pageValid = false;
    let pageInvalid = false;
    let pageNoType = false;
    for (const b of p.jsonLd) {
      if (!b.valid) {
        pageInvalid = true;
        continue;
      }
      const typed = b.nodes.filter((n) => nodeTypes(n).length > 0);
      if (typed.length === 0) pageNoType = true;
      else {
        pageValid = true;
        for (const n of typed) for (const t of nodeTypes(n)) types.add(t);
      }
    }
    if (pageInvalid) invalid.push(p.url);
    if (pageNoType && !pageValid) noType.push(p.url);
    if (pageValid) withValid++;
  }

  const n = ctx.pages.length;
  const issues: IssueSeed[] = [];
  if (invalid.length) issues.push({ key: "seo.structured-data:invalid-json", affectedUrls: invalid, share: 2 });
  if (noType.length) issues.push({ key: "seo.structured-data:no-type", affectedUrls: noType, share: 1 });
  if (withValid === 0 && invalid.length === 0 && noType.length === 0) {
    issues.push({ key: "seo.structured-data:missing", affectedUrls: [], share: 2 });
  }

  // Site-level: having valid schema on the homepage matters most; other pages add coverage.
  const home = ctx.pages[0];
  const homeValid = home ? home.jsonLd.some((b) => b.valid && b.nodes.some((x) => nodeTypes(x).length > 0)) : false;
  const coverage = n ? withValid / n : 0;
  let score = withValid === 0 ? 0 : 0.5 * (homeValid ? 1 : 0.4) + 0.5 * coverage;
  if (invalid.length) score = Math.min(score, 0.6);
  if (withValid > 0 && !homeValid && home) {
    issues.push({ key: "seo.structured-data:missing", affectedUrls: [home.url], share: 1 });
  }
  const typeList = [...types].slice(0, 6).join(", ");

  return outcome(def, {
    score,
    summary:
      withValid > 0
        ? `${withValid} of ${plural(n, "page")} ${withValid === 1 ? "has" : "have"} valid JSON-LD (${typeList}).`
        : "No valid JSON-LD structured data was found.",
    issues,
  });
};
