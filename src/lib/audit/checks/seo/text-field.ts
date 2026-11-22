import type { PageData } from "../../html";
import type { IssueSeed } from "../../context";
import type { IssueKey } from "../../issues";

/**
 * Shared logic for title / meta description: present, within [min,max] chars,
 * unique across crawled pages. Per-page score: missing 0; else 1 minus penalties.
 */
export function evaluateTextField(
  pages: PageData[],
  pick: (p: PageData) => string | null,
  opts: {
    min: number;
    max: number;
    keys: { missing: IssueKey; length: IssueKey; duplicate: IssueKey };
    /** severity bump when the homepage is the one missing it */
    homeMissingSeverity?: IssueSeed["severity"];
  },
): { score: number; good: number; issues: IssueSeed[] } {
  const missing: string[] = [];
  const badLength: string[] = [];
  const duplicate: string[] = [];
  const lengths: string[] = [];

  const counts = new Map<string, number>();
  for (const p of pages) {
    const v = pick(p);
    if (v) counts.set(v.toLowerCase(), (counts.get(v.toLowerCase()) ?? 0) + 1);
  }

  let total = 0;
  let good = 0;
  for (const p of pages) {
    const v = pick(p);
    if (!v) {
      missing.push(p.url);
      continue;
    }
    let s = 1;
    const len = [...v].length;
    if (len < opts.min || len > opts.max) {
      badLength.push(p.url);
      lengths.push(`${len}`);
      s -= 0.3;
    }
    if ((counts.get(v.toLowerCase()) ?? 0) > 1) {
      duplicate.push(p.url);
      s -= 0.4;
    }
    if (s === 1) good++;
    total += s;
  }

  const issues: IssueSeed[] = [];
  if (missing.length) {
    const homeMissing = pages[0] && missing.includes(pages[0].url);
    issues.push({
      key: opts.keys.missing,
      affectedUrls: missing,
      share: 3,
      ...(homeMissing && opts.homeMissingSeverity ? { severity: opts.homeMissingSeverity } : {}),
    });
  }
  if (duplicate.length) issues.push({ key: opts.keys.duplicate, affectedUrls: duplicate, share: 2 });
  if (badLength.length) {
    issues.push({
      key: opts.keys.length,
      affectedUrls: badLength,
      detail: `We found lengths of ${lengths.slice(0, 5).join(", ")} characters; aim for ${opts.min}–${opts.max}.`,
      share: 1,
    });
  }
  return { score: pages.length ? total / pages.length : 0, good, issues };
}
