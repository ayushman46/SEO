import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { methodologyFaq, methodologySections } from "@/content/methodology";
import { botSections } from "@/content/bot";
import { sampleReportCopy, sampleReportResult as r } from "@/content/sample-report";
import { computeClarityScore } from "@/lib/audit/ai/clarity";
import { ISSUE_CATALOG } from "@/lib/audit/issues";
import { CHECK_WEIGHTS, computeScores, sortIssues } from "@/lib/audit/score";
import { FullReport } from "@/components/audit/FullReport";
import { CodeBlock, DocBody, checkAnchor } from "./DocBody";

describe("DocBody", () => {
  const html = renderToStaticMarkup(
    createElement(DocBody, {
      label: "How the noticr audit works",
      sections: methodologySections,
      faq: { id: "faq", title: "Common questions", items: methodologyFaq },
    }),
  );

  it("renders every section with an anchor and a nav entry", () => {
    for (const s of methodologySections) {
      expect(html).toContain(`id="${s.id}"`);
      expect(html).toContain(`href="#${s.id}"`);
    }
    expect(html).toContain('id="faq"');
  });

  it("anchors every scored check and shows its weight as a chip", () => {
    const items = methodologySections.flatMap((s) => s.groups ?? []).flatMap((g) => g.items);
    for (const item of items) {
      if (!item.id) continue;
      expect(html).toContain(`id="${checkAnchor(item.id)}"`);
    }
    expect(checkAnchor("seo.title")).toBe("check-seo-title");
    expect(html).toMatch(/weight<\/span><span class="[^"]*tabular-nums">15<\/span>/);
  });

  it("renders FAQ answers and section links", () => {
    for (const f of methodologyFaq) expect(html).toContain(f.q);
    expect(html).toContain('href="/bot"');
    expect(html).toContain('href="/contact"');
  });

  it("renders per-section extras (bot code blocks)", () => {
    const bot = renderToStaticMarkup(
      createElement(DocBody, {
        label: "About noticrbot",
        sections: botSections,
        extras: { block: createElement(CodeBlock, null, "User-agent: noticrbot\nDisallow: /") },
      }),
    );
    expect(bot).toContain("User-agent: noticrbot\nDisallow: /");
  });
});

describe("sample report fixture", () => {
  it("is a fictional business on a reserved domain", () => {
    expect(r.hostname.endsWith(".example")).toBe(true);
    expect(sampleReportCopy.disclaimer).toMatch(/^Illustrative sample for a fictional business\./);
  });

  it("scores are the engine's own (computeScores over the stored checks)", () => {
    expect(computeScores(r.checks)).toEqual(r.scores);
    for (const c of r.checks) expect(c.weight, c.id).toBe(CHECK_WEIGHTS[c.id]);
    expect(r.ai && computeClarityScore(r.ai.facts, r.ai.questions, true)).toBe(r.ai?.clarityScore);
  });

  it("issues use the engine's catalog wording and order (re-run scripts/build-sample-report.ts if this fails)", () => {
    const catalog = ISSUE_CATALOG as Record<string, { title: string; howToFix: string; description: string }>;
    for (const i of r.issues) {
      const copy = catalog[i.id];
      expect(copy, i.id).toBeDefined();
      expect(i.title).toBe(copy.title);
      expect(i.howToFix).toBe(copy.howToFix);
      expect(i.description.startsWith(copy.description)).toBe(true);
    }
    expect(r.issues.map((i) => i.id)).toEqual(sortIssues(r.issues).map((i) => i.id));
  });

  it("is a realistic mix: ~14+ issues across severities, 6 pages, a full AI section", () => {
    expect(r.issues.length).toBeGreaterThanOrEqual(12);
    expect(new Set(r.issues.map((i) => i.severity)).size).toBeGreaterThanOrEqual(3);
    expect(r.pages).toHaveLength(6);
    const statuses = new Set(r.checks.map((c) => c.status));
    for (const st of ["pass", "warn", "fail"] as const) expect(statuses.has(st), st).toBe(true);
    expect(r.coreWebVitals).not.toBeNull();
    expect(r.ai?.facts).toHaveLength(7);
    expect(r.ai?.questions).toHaveLength(6);
    expect(Object.values(r.ai!.drafts).every((d) => typeof d === "string" && d.length > 0)).toBe(true);
    expect(() => JSON.parse(r.ai!.drafts.organizationJsonLd!)).not.toThrow();
  });

  it("renders as a full report with its own badge", () => {
    const html = renderToStaticMarkup(createElement(FullReport, { result: r, headingId: "s", badgeLabel: "Sample report" }));
    expect(html).toContain("Sample report");
    for (const i of r.issues) expect(html).toContain(i.title.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;"));
  });
});
