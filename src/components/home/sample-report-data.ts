import type { AuditIssue, PartialAuditReport } from "@/lib/audit/types";

/**
 * ILLUSTRATIVE ONLY. A made-up report for a fictional site on the reserved
 * ".example" domain, used to show the report layout. Never present as real data.
 */
export const sampleReport: PartialAuditReport = {
  id: "00000000-0000-4000-8000-000000000000",
  finalUrl: "https://your-site.example/",
  hostname: "your-site.example",
  scores: { overall: 68, seo: 81, geo: 52, performance: 71 },
  pagesScanned: 6,
  issueCounts: { critical: 0, high: 1, medium: 5, low: 4 },
  topIssues: [
    {
      id: "geo.ai-crawlers:search-blocked",
      checkId: "geo.ai-crawlers",
      category: "geo",
      severity: "high",
      title: "AI search assistants are blocked from your site",
      description: "AI answer engines can't read pages they are blocked from.",
      howToFix: "Remove the `Disallow: /` rules for AI search bots in robots.txt.",
      effort: "quick",
      impact: 9,
      affectedUrls: [],
    },
    {
      id: "seo.meta-description:missing",
      checkId: "seo.meta-description",
      category: "seo",
      severity: "medium",
      title: "4 of 6 pages have no meta description",
      description: "Search engines write their own snippet, often a poor one.",
      howToFix: "Add a 120–155 character description to each page.",
      effort: "quick",
      impact: 5,
      affectedUrls: [],
    },
    {
      id: "seo.structured-data:missing",
      checkId: "seo.structured-data",
      category: "seo",
      severity: "medium",
      title: "No structured data (schema) found",
      description: "Search engines and AI assistants get no machine-readable summary of your business.",
      howToFix: "Add LocalBusiness JSON-LD to your homepage.",
      effort: "moderate",
      impact: 4,
      affectedUrls: [],
    },
  ],
  lockedIssues: [
    { id: "performance.cwv:lcp", title: "The main content takes too long to appear", severity: "medium", category: "performance" },
    { id: "geo.llms-txt:missing", title: "No llms.txt file", severity: "low", category: "geo" },
  ],
  checks: [],
  durationMs: 48_000,
  truncated: false,
};

export const sampleEffort: Record<string, AuditIssue["effort"]> = {
  "performance.cwv:lcp": "moderate",
  "geo.llms-txt:missing": "quick",
};
