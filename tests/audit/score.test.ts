import { describe, expect, it } from "vitest";
import type { AuditResult, CheckResult } from "@/lib/audit/types";
import type { CheckOutcome } from "@/lib/audit/context";
import {
  categoryScore,
  CHECK_WEIGHTS,
  computeScores,
  effectiveCategoryWeights,
  finalize,
  recoverablePoints,
  sortIssues,
} from "@/lib/audit/score";
import { ISSUE_CATALOG } from "@/lib/audit/issues";
import { toPartialReport } from "@/lib/audit/report";
import { analyze, ALL_CHECKS } from "@/lib/audit/analyze";
import { parsePsi, performanceCheck } from "@/lib/audit/checks/performance";
import { doc, goodHome, makeCtx, page } from "./helpers";

function check(id: string, category: CheckResult["category"], score: number, weight: number, status?: CheckResult["status"]): CheckResult {
  return { id, category, label: id, status: status ?? (score === 1 ? "pass" : "warn"), score, weight, summary: "" };
}

describe("category + overall scoring", () => {
  it("weighted mean per category, unavailable excluded", () => {
    const checks = [check("a", "seo", 1, 3), check("b", "seo", 0, 1), check("c", "seo", 0, 5, "unavailable")];
    expect(categoryScore(checks, "seo")).toBeCloseTo(75);
    expect(categoryScore(checks, "geo")).toBeNull();
  });

  it("overall = 0.45 SEO + 0.35 GEO + 0.20 Perf", () => {
    const s = computeScores([check("s", "seo", 0.8, 1), check("g", "geo", 0.6, 1), check("p", "performance", 0.5, 1)]);
    expect(s).toEqual({ overall: Math.round(0.45 * 80 + 0.35 * 60 + 0.2 * 50), seo: 80, geo: 60, performance: 50 });
  });

  it("re-weights when performance is unavailable", () => {
    const s = computeScores([check("s", "seo", 0.8, 1), check("g", "geo", 0.6, 1), check("p", "performance", 0, 1, "unavailable")]);
    expect(s.performance).toBeNull();
    expect(s.overall).toBe(Math.round((0.45 * 80 + 0.35 * 60) / 0.8));
    expect(effectiveCategoryWeights({ seo: true, geo: true, performance: false })).toEqual({
      seo: 0.45 / 0.8,
      geo: 0.35 / 0.8,
      performance: 0,
    });
  });

  it("scores are integers in 0..100", () => {
    const s = computeScores([check("s", "seo", 0.333, 1), check("g", "geo", 0.777, 1)]);
    for (const v of [s.overall, s.seo, s.geo]) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("recoverable points sum to the overall gap", () => {
    const checks = [check("s1", "seo", 0.5, 2), check("s2", "seo", 1, 2), check("g", "geo", 0, 1), check("p", "performance", 0.4, 1)];
    const total = checks.reduce((sum, c) => sum + recoverablePoints(c, checks), 0);
    const overallRaw = 0.45 * 75 + 0.35 * 0 + 0.2 * 40;
    expect(total).toBeCloseTo(100 - overallRaw);
    expect(recoverablePoints(checks[0], checks)).toBeCloseTo(0.45 * 0.5 * 0.5 * 100);
  });

  it("every check id has a weight and every issue key belongs to a known check", () => {
    const ctx = makeCtx({ pages: [page(goodHome())] });
    for (const c of ALL_CHECKS) expect(CHECK_WEIGHTS[c(ctx).id]).toBeGreaterThan(0);
    for (const copy of Object.values(ISSUE_CATALOG)) {
      expect(CHECK_WEIGHTS[copy.checkId]).toBeGreaterThan(0);
      expect(copy.title.length).toBeGreaterThan(5);
      expect(copy.howToFix.length).toBeGreaterThan(20);
    }
  });
});

describe("finalize → issues", () => {
  const outcomes: CheckOutcome[] = [
    {
      id: "seo.title",
      category: "seo",
      label: "Title tags",
      status: "fail",
      score: 0.2,
      summary: "",
      issues: [
        { key: "seo.title:missing", affectedUrls: ["https://a.com/"], share: 3 },
        { key: "seo.title:length", affectedUrls: ["https://a.com/x"], share: 1, detail: "Extra detail." },
      ],
    },
    { id: "seo.lang", category: "seo", label: "Lang", status: "pass", score: 1, summary: "", issues: [] },
    {
      id: "geo.llms-txt",
      category: "geo",
      label: "llms",
      status: "warn",
      score: 0,
      summary: "",
      issues: [{ key: "geo.llms-txt:missing" }],
    },
  ];

  it("splits impact by share, applies copy + detail, sorts by severity then impact", () => {
    const { checks, issues } = finalize(outcomes);
    expect(checks.map((c) => c.weight)).toEqual([CHECK_WEIGHTS["seo.title"], CHECK_WEIGHTS["seo.lang"], CHECK_WEIGHTS["geo.llms-txt"]]);
    const missing = issues.find((i) => i.id === "seo.title:missing")!;
    const length = issues.find((i) => i.id === "seo.title:length")!;
    expect(missing.impact / length.impact).toBeCloseTo(3, 0);
    expect(length.description.endsWith("Extra detail.")).toBe(true);
    expect(missing).toMatchObject({ checkId: "seo.title", category: "seo", severity: "high", effort: "quick" });
    expect(issues.map((i) => i.id)).toEqual(sortIssues(issues).map((i) => i.id));
    // high first, then lows by impact
    expect(issues[0].id).toBe("seo.title:missing");
    for (let i = 1; i < issues.length; i++) {
      const rank = { critical: 4, high: 3, medium: 2, low: 1 };
      const a = issues[i - 1];
      const b = issues[i];
      expect(rank[a.severity] > rank[b.severity] || (rank[a.severity] === rank[b.severity] && a.impact >= b.impact)).toBe(true);
    }
  });

  it("every non-pass check produces at least one issue (end-to-end on a bare page)", () => {
    const a = analyze(makeCtx({ pages: [page(doc({ lang: null }))] }));
    for (const c of a.checks) {
      if (c.status === "warn" || c.status === "fail") {
        expect(a.issues.some((i) => i.checkId === c.id), c.id).toBe(true);
      }
      if (c.status === "pass") expect(a.issues.some((i) => i.checkId === c.id), c.id).toBe(false);
    }
    expect(a.scores.performance).toBeNull();
    expect(a.pages[0].issueCount).toBeGreaterThan(0);
  });

  it("a good site scores high", () => {
    const a = analyze(
      makeCtx({
        pages: [page(goodHome())],
        robots: "User-agent: *\nAllow: /",
        sitemap: `<urlset><url><loc>https://acme.example.com/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url></urlset>`,
        llms: "# Acme\n",
      }),
    );
    expect(a.scores.seo).toBe(100);
    expect(a.scores.geo).toBe(100);
    expect(a.scores.overall).toBe(100);
    expect(a.issues).toEqual([]);
  });
});

describe("performance (PSI)", () => {
  const psiJson = (score: number, lcp: number, cls: number, tbt: number) => ({
    lighthouseResult: {
      categories: { performance: { score } },
      audits: {
        "largest-contentful-paint": { numericValue: lcp },
        "cumulative-layout-shift": { numericValue: cls },
        "total-blocking-time": { numericValue: tbt },
        "first-contentful-paint": { numericValue: 1234.5 },
      },
    },
    loadingExperience: { metrics: { INTERACTION_TO_NEXT_PAINT: { percentile: 180 } } },
  });

  it("parses PSI v5 JSON", () => {
    expect(parsePsi(psiJson(0.42, 4200.4, 0.123456, 650))).toEqual({
      source: "pagespeed-insights",
      strategy: "mobile",
      performanceScore: 42,
      lcpMs: 4200,
      cls: 0.123,
      inpMs: 180,
      fcpMs: 1235,
      tbtMs: 650,
    });
    expect(parsePsi({ error: { code: 429 } })).toBeNull();
  });

  it("status thresholds: ≥90 pass, 50–89 warn, <50 fail; issues per bad metric", () => {
    const run = (j: unknown) =>
      performanceCheck(makeCtx({ pages: [page(doc())], psi: { ok: true, vitals: parsePsi(j), error: null } }));
    const fast = run(psiJson(0.95, 1500, 0.01, 50));
    expect(fast).toMatchObject({ status: "pass", score: 0.95, issues: [] });
    expect(run(psiJson(0.7, 2000, 0.05, 100)).status).toBe("warn");
    const slow = run(psiJson(0.3, 5000, 0.3, 900));
    expect(slow.status).toBe("fail");
    expect(slow.issues.map((i) => i.key)).toEqual([
      "performance.cwv:slow",
      "performance.cwv:lcp",
      "performance.cwv:cls",
      "performance.cwv:tbt",
    ]);
  });

  it("unavailable when PSI failed", () => {
    expect(performanceCheck(makeCtx({ pages: [page(doc())] })).status).toBe("unavailable");
  });
});

describe("toPartialReport", () => {
  it("top 3 in full, rest as teasers, counts, checks without summaries", () => {
    const a = analyze(makeCtx({ pages: [page(doc())] }));
    const result: AuditResult = {
      id: "00000000-0000-4000-8000-000000000000",
      version: 1,
      requestedUrl: "https://acme.example.com/",
      finalUrl: "https://acme.example.com/",
      hostname: "acme.example.com",
      startedAt: new Date(0).toISOString(),
      durationMs: 1234,
      scores: a.scores,
      checks: a.checks,
      issues: a.issues,
      pages: a.pages,
      coreWebVitals: null,
      truncated: false,
      notes: [],
    };
    const p = toPartialReport(result);
    expect(Object.keys(p).sort()).toEqual(
      ["ai", "checks", "durationMs", "finalUrl", "hostname", "id", "issueCounts", "lockedIssues", "pagesScanned", "scores", "topIssues", "truncated"].sort(),
    );
    expect(p.ai).toBeNull(); // contract v1.1: no AI insights → null teaser
    expect(p.topIssues).toHaveLength(3);
    expect(p.topIssues).toEqual(result.issues.slice(0, 3));
    expect(p.lockedIssues).toHaveLength(result.issues.length - 3);
    for (const l of p.lockedIssues) expect(Object.keys(l).sort()).toEqual(["category", "id", "severity", "title"]);
    for (const c of p.checks) expect(Object.keys(c).sort()).toEqual(["category", "id", "label", "status"]);
    const total = p.issueCounts.critical + p.issueCounts.high + p.issueCounts.medium + p.issueCounts.low;
    expect(total).toBe(result.issues.length);
    expect(p.pagesScanned).toBe(1);
    // must not leak locked detail
    expect(JSON.stringify(p.lockedIssues)).not.toContain("howToFix");
  });
});
