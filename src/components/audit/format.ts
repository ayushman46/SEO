import type { AuditIssue, Category, Severity } from "@/lib/audit/types";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
export const CATEGORIES: Category[] = ["seo", "geo", "performance"];

/** Splits text on backticks: odd segments are inline code. Unbalanced trailing backtick is kept as text. */
export function splitInlineCode(text: string): { code: boolean; text: string }[] {
  const parts = text.split("`");
  // An even number of parts means an unmatched backtick: glue the last part back as plain text.
  if (parts.length % 2 === 0) {
    const tail = parts.pop() ?? "";
    parts[parts.length - 1] = `${parts[parts.length - 1]}\`${tail}`;
  }
  return parts.map((t, i) => ({ code: i % 2 === 1, text: t })).filter((p) => p.text.length > 0);
}

/** Reserved TLDs (RFC 2606/6761) can never resolve, e.g. the sample report's fictional site. */
const RESERVED_TLD = /\.(example|test|invalid|localhost)\.?$/i;

/** Only http(s) URLs on a resolvable host become links; anything else renders as text. */
export function safeHref(url: string): string | null {
  try {
    const u = new URL(url);
    if (RESERVED_TLD.test(u.hostname)) return null; // a link there only opens a DNS error (R7 #13)
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

/** Short readable form of a page URL: path (+ query) on the audited host, full host otherwise. */
export function displayUrl(url: string, hostname?: string): string {
  try {
    const u = new URL(url);
    const path = `${u.pathname}${u.search}` || "/";
    if (!hostname || u.hostname === hostname || u.hostname === `www.${hostname}` || `www.${u.hostname}` === hostname) {
      return path;
    }
    return `${u.hostname}${path === "/" ? "" : path}`;
  } catch {
    return url;
  }
}

/** Issues grouped by category (seo, geo, performance), then severity. Stable within a group. */
export function groupIssues(issues: AuditIssue[]): { category: Category; bySeverity: { severity: Severity; issues: AuditIssue[] }[]; count: number }[] {
  return CATEGORIES.map((category) => {
    const inCat = issues.filter((i) => i.category === category);
    return {
      category,
      count: inCat.length,
      bySeverity: SEVERITIES.map((severity) => ({ severity, issues: inCat.filter((i) => i.severity === severity) })).filter(
        (g) => g.issues.length > 0,
      ),
    };
  });
}

export type Rating = "good" | "improve" | "poor" | "none";

/** Google's published Core Web Vitals / Lighthouse thresholds. */
const THRESHOLDS = {
  lcp: [2500, 4000],
  cls: [0.1, 0.25],
  inp: [200, 500],
  fcp: [1800, 3000],
  tbt: [200, 600],
} as const;

export type MetricKey = keyof typeof THRESHOLDS;

export function rateMetric(key: MetricKey, value: number | null): Rating {
  if (value === null || !Number.isFinite(value)) return "none";
  const [good, poor] = THRESHOLDS[key];
  return value <= good ? "good" : value <= poor ? "improve" : "poor";
}

export function formatMetric(key: MetricKey, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "–";
  if (key === "cls") return value.toFixed(2);
  if (key === "lcp" || key === "fcp") return `${(value / 1000).toFixed(1)} s`;
  return `${Math.round(value).toLocaleString("en-US")} ms`;
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** Stable anchor id for an issue card, e.g. "issue-seo-missing-title" (front page "Fix first" links). */
export function issueAnchor(issueId: string): string {
  return `issue-${issueId.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}
