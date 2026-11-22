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
  issueCounts: { critical: 1, high: 3, medium: 5, low: 4 },
  topIssues: [
    {
      id: "geo.ai-crawlers:blocked",
      checkId: "geo.ai-crawlers",
      category: "geo",
      severity: "critical",
      title: "robots.txt blocks GPTBot and ClaudeBot",
      description: "AI answer engines can't read pages they are blocked from.",
      howToFix: "Remove the `Disallow: /` rules for these user agents.",
      effort: "quick",
      impact: 9,
      affectedUrls: [],
    },
    {
      id: "seo.meta-description:missing",
      checkId: "seo.meta-description",
      category: "seo",
      severity: "high",
      title: "4 of 6 pages have no meta description",
      description: "Search engines write their own snippet, often a poor one.",
      howToFix: "Add a 120–155 character description to each page.",
      effort: "quick",
      impact: 5,
      affectedUrls: [],
    },
    {
      id: "geo.llms-txt:missing",
      checkId: "geo.llms-txt",
      category: "geo",
      severity: "high",
      title: "No llms.txt file",
      description: "AI tools get no short guide to your most important pages.",
      howToFix: "Publish /llms.txt with a summary and links to key pages.",
      effort: "quick",
      impact: 4,
      affectedUrls: [],
    },
  ],
  lockedIssues: [
    { id: "performance.lcp:slow", title: "Largest Contentful Paint is 3.9 s on mobile", severity: "high", category: "performance" },
    { id: "geo.schema:missing", title: "No Organization or LocalBusiness schema", severity: "medium", category: "geo" },
  ],
  checks: [],
  durationMs: 48_000,
  truncated: false,
};

export const sampleEffort: Record<string, AuditIssue["effort"]> = {
  "performance.lcp:slow": "involved",
  "geo.schema:missing": "moderate",
};
