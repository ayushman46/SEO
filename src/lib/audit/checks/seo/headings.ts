import { outcome, plural, type Check, type IssueSeed } from "../../context";

const def = { id: "seo.headings", category: "seo", label: "Headings" } as const;

/** True when heading levels jump down by more than one step (e.g. H2 → H4). */
export function hasSkippedLevels(levels: number[]): boolean {
  let prev = 0;
  for (const l of levels) {
    if (prev > 0 && l > prev + 1) return true;
    // The first heading may be an H1 or H2 (some layouts put the H1 later); H3+ first counts as a skip.
    if (prev === 0 && l > 2) return true;
    prev = l;
  }
  return false;
}

export const headingsCheck: Check = (ctx) => {
  const missing: string[] = [];
  const multiple: string[] = [];
  const skipped: string[] = [];
  let total = 0;
  let good = 0;

  for (const p of ctx.pages) {
    let s = 1;
    if (p.h1Count === 0) {
      missing.push(p.url);
      s -= 0.6;
    } else if (p.h1Count > 1) {
      multiple.push(p.url);
      s -= 0.25;
    }
    if (hasSkippedLevels(p.headingLevels)) {
      skipped.push(p.url);
      s -= 0.2;
    }
    if (s === 1) good++;
    total += Math.max(0, s);
  }

  const issues: IssueSeed[] = [];
  if (missing.length) issues.push({ key: "seo.headings:missing-h1", affectedUrls: missing, share: 3 });
  if (multiple.length) issues.push({ key: "seo.headings:multiple-h1", affectedUrls: multiple, share: 1 });
  if (skipped.length) issues.push({ key: "seo.headings:skipped-levels", affectedUrls: skipped, share: 1 });

  const n = ctx.pages.length;
  return outcome(def, {
    score: n ? total / n : 0,
    summary: `${good} of ${plural(n, "page")} ${good === 1 ? "has" : "have"} exactly one H1 and headings in order.`,
    issues,
  });
};
