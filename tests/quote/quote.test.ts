import { describe, expect, it } from "vitest";
import type { AuditIssue } from "@/lib/audit/types";
import { ISSUE_CATALOG, type IssueKey } from "@/lib/audit/issues";
import { CATALOG, QUOTE_SCOPE_CAP } from "@/lib/quote/catalog";
import { buildQuote, issueFixInfo, toOrderFields, toOrderItems, type QuoteIssueInput } from "@/lib/quote/quote";
import { verifyOrder } from "@/lib/quote/verify";

function issue(key: IssueKey, over: Partial<AuditIssue> = {}): AuditIssue {
  const c = ISSUE_CATALOG[key];
  return {
    id: key,
    checkId: c.checkId,
    category: c.category,
    severity: c.severity,
    title: c.title,
    description: c.description,
    howToFix: c.howToFix,
    effort: c.effort,
    impact: 1,
    affectedUrls: [],
    ...over,
  };
}

/** The partial report's locked-issue shape: id/title/severity/category only. */
const locked = (key: IssueKey): QuoteIssueInput => {
  const c = ISSUE_CATALOG[key];
  return { id: key, title: c.title, severity: c.severity };
};

describe("buildQuote", () => {
  it("quotes only the AI crawler unblock when that is the only serious problem", () => {
    const q = buildQuote({ issues: [issue("geo.ai-crawlers:search-blocked")], pagesScanned: 6, currency: "USD" });
    expect(q.lines.map((l) => l.key)).toEqual(["ai-crawler-unblock"]);
    expect(q.total).toBe(149);
    expect(q.fixedTotal).toBe(true);
    expect(q.totalText).toBe("$149");
    expect(q.confirmNote).toBeNull();
    expect(q.reviewReasons).toEqual([]);
    expect(q.taxNote).toBe("excludes-applicable-taxes");
    expect(q.bundle).toBeNull();
    expect(q.summary).toContain("AI crawler unblock ($149)");
    expect(q.summary).toContain("Total $149, fixed, excluding applicable taxes.");
  });

  it("folds robots.txt crawler blocks into the fix sprint instead of adding $149", () => {
    const q = buildQuote({
      issues: [issue("geo.ai-crawlers:search-blocked"), issue("seo.sitemap:missing")],
      pagesScanned: 6,
      currency: "USD",
    });
    expect(q.lines.map((l) => l.key)).toEqual(["fix-sprint"]);
    expect(q.lines[0].covers.map((c) => c.id)).toEqual(["seo.sitemap:missing", "geo.ai-crawlers:search-blocked"]);
    expect(q.bundle).toMatchObject({ into: "fix-sprint", absorbed: ["ai-crawler-unblock"], avoidedAmount: 149 });
    expect(q.total).toBe(199);
  });

  it("keeps a separate unblock when the block is at server/CDN level (probe)", () => {
    const q = buildQuote({
      issues: [
        { id: "geo.ai-crawler-probe:blocked", checkId: "geo.ai-crawler-probe", severity: "high", title: "AI crawlers get 403", effort: "moderate" },
        issue("seo.sitemap:missing"),
      ],
      pagesScanned: 6,
      currency: "USD",
    });
    expect(q.lines.map((l) => l.key)).toEqual(["ai-crawler-unblock", "fix-sprint"]);
    expect(q.bundle).toBeNull();
    expect(q.total).toBe(348);
  });

  it("never shows a 'from' price as fixed", () => {
    const q = buildQuote({ issues: [issue("seo.sitemap:missing")], pagesScanned: 6, currency: "USD" });
    expect(q.lines[0]).toMatchObject({ key: "fix-sprint", price: 199, priceKind: "from", priceText: "From $199" });
    expect(q.fixedTotal).toBe(false);
    expect(q.reviewReasons).toContain("from-price");
    expect(q.totalText).toBe("From $199");
    expect(q.confirmNote).toBe("person-confirms-within-1-business-day");
    expect(q.summary).toContain("a person confirms the final price within 1 business day");
  });

  it("lists DIY items and never prices them by default", () => {
    const q = buildQuote({
      issues: [issue("seo.title:missing"), issue("seo.meta-description:missing"), issue("geo.ai-crawlers:search-blocked")],
      pagesScanned: 6,
      currency: "USD",
    });
    expect(q.diyIssueIds).toEqual(["seo.title:missing", "seo.meta-description:missing"]);
    expect(q.coveredIssueIds).toEqual(["geo.ai-crawlers:search-blocked"]);
    expect(q.summary).toContain("2 of them you can fix yourself");
  });

  it("puts low-severity and deliberate-choice items in safeToIgnore, unpriced", () => {
    const q = buildQuote({
      issues: [issue("geo.llms-txt:missing"), issue("geo.ai-crawlers:training-blocked"), issue("seo.open-graph:incomplete")],
      pagesScanned: 6,
      currency: "USD",
    });
    expect(q.safeToIgnore).toEqual(["geo.llms-txt:missing", "geo.ai-crawlers:training-blocked", "seo.open-graph:incomplete"]);
    expect(q.lines).toEqual([]);
    expect(q.total).toBe(0);
    expect(q.summary).toContain("Nothing else needs paid help.");
  });

  it("prices exactly the selected issues, DIY and low ones included", () => {
    const issues = [issue("seo.title:missing"), issue("geo.llms-txt:missing"), issue("geo.faq:missing"), issue("seo.https:not-https")];
    const q = buildQuote({ issues, pagesScanned: 6, currency: "USD", selectedIssueIds: ["seo.title:missing", "geo.llms-txt:missing", "nope"] });
    expect(q.lines.map((l) => l.key)).toEqual(["fix-sprint"]);
    expect(q.coveredIssueIds).toEqual(["seo.title:missing", "geo.llms-txt:missing"]);
    // DIY list is always shown, even for picked items
    expect(q.diyIssueIds).toEqual(["seo.title:missing"]);
    expect(q.safeToIgnore).toEqual([]);
    expect(q.summary).toContain("For the 2 issues you picked");
  });

  it("an empty selection quotes nothing", () => {
    const q = buildQuote({ issues: [issue("seo.https:not-https")], pagesScanned: 6, currency: "USD", selectedIssueIds: [] });
    expect(q.lines).toEqual([]);
    expect(q.summary).toContain("You haven't picked any issues for us to fix yet.");
  });

  it("works from the partial report's minimal shape", () => {
    const q = buildQuote({
      issues: [locked("geo.ai-crawlers:search-blocked"), locked("seo.title:missing"), locked("geo.faq:missing")],
      pagesScanned: 4,
      currency: "USD",
    });
    expect(q.lines.map((l) => l.key)).toEqual(["ai-crawler-unblock", "content-entity"]);
    expect(q.diyIssueIds).toEqual(["seo.title:missing"]);
    expect(q.total).toBe(298);
    expect(q.fixedTotal).toBe(false);
  });

  it("uses rupee prices and marks Content & entity as price-on-request in INR", () => {
    const q = buildQuote({
      issues: [issue("geo.ai-crawlers:search-blocked"), issue("geo.faq:missing")],
      pagesScanned: 6,
      currency: "INR",
    });
    expect(q.lines.map((l) => [l.key, l.price, l.priceKind, l.priceText])).toEqual([
      ["ai-crawler-unblock", 9999, "fixed", "₹9,999"],
      ["content-entity", null, "on-request", "Price confirmed by email"],
    ]);
    expect(q.total).toBe(9999);
    expect(q.reviewReasons).toEqual(["price-on-request"]);
    expect(q.totalText).toBe("From ₹9,999");
  });

  it("says 'price by email' when nothing has a published price", () => {
    const q = buildQuote({ issues: [issue("geo.faq:missing")], pagesScanned: 6, currency: "INR" });
    expect(q.totalText).toBe("Price confirmed by email");
    expect(q.summary).toContain("A person confirms the price by email within 1 business day");
  });

  it("is not fixed above the scope cap or for developer-level work", () => {
    const one = [issue("geo.ai-crawlers:search-blocked")];
    expect(buildQuote({ issues: one, pagesScanned: QUOTE_SCOPE_CAP.maxPagesScanned + 1, currency: "USD" }).reviewReasons).toEqual([
      "pages-over-cap",
    ]);
    const many: QuoteIssueInput[] = Array.from({ length: QUOTE_SCOPE_CAP.maxPaidIssues + 1 }, (_, i) => ({
      id: `geo.ai-crawler-probe:x${i}`,
      checkId: "geo.ai-crawler-probe",
      severity: "high",
      title: `Probe ${i}`,
    }));
    expect(buildQuote({ issues: many, pagesScanned: 6, currency: "USD" }).reviewReasons).toEqual(["issues-over-cap"]);
    const involved = buildQuote({
      issues: [{ id: "geo.ai-crawler-probe:waf", checkId: "geo.ai-crawler-probe", severity: "high", title: "WAF", effort: "involved" }],
      pagesScanned: 6,
      currency: "USD",
    });
    expect(involved.fixedTotal).toBe(false);
    expect(involved.reviewReasons).toEqual(["involved-work"]);
  });

  it("never adds monitoring and offers the Full audit only as an unpriced alternative", () => {
    const issues = Object.keys(ISSUE_CATALOG).map((k) => issue(k as IssueKey));
    const q = buildQuote({ issues, pagesScanned: 6, currency: "USD" });
    expect(q.lines.some((l) => l.key === "monitoring" || l.key === "full-audit")).toBe(false);
    expect(q.alternatives.map((a) => [a.key, a.price, a.priceKind])).toEqual([["full-audit", 49, "fixed"]]);
    expect(q.total).toBe(q.lines.reduce((s, l) => s + (l.price ?? 0), 0));
  });

  it("every price in a quote comes from the catalog", () => {
    const issues = Object.keys(ISSUE_CATALOG).map((k) => issue(k as IssueKey));
    for (const currency of ["USD", "INR"] as const) {
      const q = buildQuote({ issues, pagesScanned: 6, currency, selectedIssueIds: issues.map((i) => i.id) });
      for (const l of [...q.lines, ...q.alternatives]) {
        const item = CATALOG.find((c) => c.key === l.key)!;
        const p = currency === "USD" ? item.usd : item.inr;
        expect(l.price).toBe(p === null ? null : p.amount);
        expect(l.priceKind).toBe(p === null ? "on-request" : p.kind);
      }
    }
  });

  it("is deterministic and tolerates duplicates and junk", () => {
    const issues = [issue("seo.sitemap:missing"), issue("seo.sitemap:missing"), { id: "", title: "x", severity: "high" } as QuoteIssueInput];
    const a = buildQuote({ issues, pagesScanned: Number.NaN, currency: "USD" });
    const b = buildQuote({ issues, pagesScanned: Number.NaN, currency: "USD" });
    expect(a).toEqual(b);
    expect(a.coveredIssueIds).toEqual(["seo.sitemap:missing"]);
    expect(a.summary).toBe(
      "We found 1 issue. We suggest Technical fix sprint (from $199). Total from $199, excluding applicable taxes; a person confirms the final price within 1 business day, before you pay anything.",
    );
  });

  it("handles a clean site", () => {
    const q = buildQuote({ issues: [], pagesScanned: 6, currency: "USD" });
    expect(q.lines).toEqual([]);
    expect(q.alternatives).toEqual([]);
    expect(q.summary).toBe("We found no issues on the 6 pages we read, so there is nothing to quote.");
  });
});

describe("issueFixInfo", () => {
  it("describes the per-issue button", () => {
    expect(issueFixInfo({ id: "seo.title:missing" }, "USD")).toEqual({
      fixer: "diy",
      diy: true,
      serviceSlug: "technical-fixes",
      serviceLabel: "Technical fix sprint",
      priceText: "From $199",
    });
    expect(issueFixInfo({ id: "geo.ai-crawlers:search-blocked" }, "INR").priceText).toBe("₹9,999");
    expect(issueFixInfo({ id: "geo.faq:missing" }, "INR").priceText).toBe("Price confirmed by email");
  });
});

describe("order hand-off round trip", () => {
  it("toOrderFields output verifies against the catalog", () => {
    for (const currency of ["USD", "INR"] as const) {
      const q = buildQuote({
        issues: [issue("geo.ai-crawlers:search-blocked"), issue("geo.faq:missing"), issue("seo.sitemap:missing"), issue("geo.fact-consistency:phones")],
        pagesScanned: 6,
        currency,
      });
      const fields = toOrderFields(q);
      const v = verifyOrder({
        currency: fields.quote_currency,
        items: JSON.parse(fields.quote_items),
        submittedTotal: Number(fields.quote_total),
        submittedFixed: fields.quote_fixed === "true",
      });
      expect(v.valid).toBe(true);
      expect(v.catalogTotal).toBe(q.total);
      expect(v.fixed).toBe(false);
    }
  });

  it("a fixed quote stays fixed", () => {
    const q = buildQuote({ issues: [issue("geo.ai-crawlers:search-blocked")], pagesScanned: 6, currency: "USD" });
    const v = verifyOrder({ currency: "USD", items: toOrderItems(q), submittedTotal: q.total, submittedFixed: q.fixedTotal });
    expect(v).toMatchObject({ valid: true, fixed: true, catalogTotal: 149 });
  });
});
