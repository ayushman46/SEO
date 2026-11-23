import { describe, expect, it } from "vitest";
import type { AuditIssue } from "@/lib/audit/types";
import { ISSUE_CATALOG, type IssueKey } from "@/lib/audit/issues";
import { CATALOG, catalogItem, QUOTE_SCOPE_CAP } from "@/lib/quote/catalog";
import { QUOTE_TEXT, buildQuote, issueFixInfo, toOrderFields, toOrderItems, type QuoteIssueInput } from "@/lib/quote/quote";
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
    expect(q.total).toBe(49);
    expect(q.fixedTotal).toBe(true);
    expect(q.totalText).toBe("$49");
    expect(q.confirmNote).toBeNull();
    expect(q.reviewReasons).toEqual([]);
    expect(q.taxNote).toBe("excludes-applicable-taxes");
    expect(q.bundle).toBeNull();
    expect(q.summary).toContain("AI crawler unblock ($49)");
    expect(q.summary).toContain("Total $49, fixed, excluding applicable taxes.");
  });

  it("folds robots.txt crawler blocks into the fix sprint instead of adding $49", () => {
    const q = buildQuote({
      issues: [issue("geo.ai-crawlers:search-blocked"), issue("seo.sitemap:missing")],
      pagesScanned: 6,
      currency: "USD",
    });
    expect(q.lines.map((l) => l.key)).toEqual(["fix-sprint"]);
    expect(q.lines[0].covers.map((c) => c.id)).toEqual(["seo.sitemap:missing", "geo.ai-crawlers:search-blocked"]);
    expect(q.bundle).toMatchObject({ into: "fix-sprint", absorbed: ["ai-crawler-unblock"], avoidedAmount: 49 });
    expect(q.total).toBe(149);
    expect(q.fixedTotal).toBe(true);
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
    expect(q.total).toBe(198);
  });

  it("quotes the Fix sprint at its fixed price within the scope cap", () => {
    const q = buildQuote({ issues: [issue("seo.sitemap:missing")], pagesScanned: 6, currency: "USD" });
    expect(q.lines[0]).toMatchObject({ key: "fix-sprint", price: 149, priceKind: "fixed", priceText: "$149" });
    expect(q.fixedTotal).toBe(true);
    expect(q.totalText).toBe("$149");
    expect(QUOTE_SCOPE_CAP.maxPaidIssues).toBe(8);
  });

  it("never shows a 'from' price as fixed", () => {
    const q = buildQuote({ issues: [issue("geo.faq:missing")], pagesScanned: 6, currency: "USD" });
    expect(q.lines[0]).toMatchObject({ key: "content-entity", price: 99, priceKind: "from", priceText: "From $99" });
    expect(q.fixedTotal).toBe(false);
    expect(q.reviewReasons).toContain("from-price");
    expect(q.totalText).toBe("From $99");
    expect(q.confirmNote).toBe("person-confirms-within-1-business-day");
    expect(q.summary).toContain("a person confirms the final price within two working days");
  });

  it("states the reply time in the one agreed wording (R5 ruling 5)", () => {
    expect(QUOTE_TEXT.confirm).toBe("A person confirms the final price within two working days, before you pay anything.");
    expect(JSON.stringify(QUOTE_TEXT)).not.toMatch(/business day/);
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
    expect(q.total).toBe(148);
    expect(q.fixedTotal).toBe(false);
  });

  it("uses rupee prices, including the Content & entity starting price", () => {
    const q = buildQuote({
      issues: [issue("geo.ai-crawlers:search-blocked"), issue("geo.faq:missing")],
      pagesScanned: 6,
      currency: "INR",
    });
    expect(q.lines.map((l) => [l.key, l.price, l.priceKind, l.priceText])).toEqual([
      ["ai-crawler-unblock", 2999, "fixed", "₹2,999"],
      ["content-entity", 6999, "from", "From ₹6,999"],
    ]);
    expect(q.total).toBe(9998);
    expect(q.reviewReasons).toEqual(["from-price"]);
    expect(q.totalText).toBe("From ₹9,998");
  });

  it("every catalog item has a rupee price, so no INR line is 'price by email'", () => {
    expect(CATALOG.every((c) => c.inr !== null)).toBe(true);
    const q = buildQuote({ issues: [issue("geo.faq:missing")], pagesScanned: 6, currency: "INR" });
    expect(q.totalText).toBe("From ₹6,999");
    expect(q.summary).toContain("a person confirms the final price within two working days");
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
    const overCap = buildQuote({ issues: many, pagesScanned: 6, currency: "USD" });
    expect(overCap.reviewReasons).toEqual(["issues-over-cap"]);
    // No Fix sprint line here (probe blocks go to the AI crawler unblock), so nothing is repriced.
    expect(overCap.lines.map((l) => [l.key, l.priceText])).toEqual([["ai-crawler-unblock", "$49"]]);
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
    expect(q.alternatives.map((a) => [a.key, a.price, a.priceKind])).toEqual([["full-audit", 39, "fixed"]]);
    expect(q.total).toBe(q.lines.reduce((s, l) => s + (l.price ?? 0), 0));
  });

  it("every price in a quote comes from the catalog", () => {
    const issues = Object.keys(ISSUE_CATALOG).map((k) => issue(k as IssueKey));
    for (const currency of ["USD", "INR"] as const) {
      const q = buildQuote({ issues, pagesScanned: 6, currency, selectedIssueIds: issues.map((i) => i.id) });
      expect(q.reviewReasons).toContain("issues-over-cap");
      for (const l of [...q.lines, ...q.alternatives]) {
        const item = CATALOG.find((c) => c.key === l.key)!;
        // Above the cap, an item with a larger-job price is quoted at that price.
        const larger = item.largerJob ? (currency === "USD" ? item.largerJob.usd : item.largerJob.inr) : null;
        const p = q.alternatives.includes(l) || !larger ? (currency === "USD" ? item.usd : item.inr) : larger;
        expect(l.price).toBe(p === null ? null : p.amount);
        expect(l.priceKind).toBe(p === null ? "on-request" : p.kind);
      }
    }
  });

  it("prices a Fix sprint above the 8-fix cap at the larger-job starting price (R5 B1, ruling 6)", () => {
    const sprintIssues = Object.keys(ISSUE_CATALOG)
      .map((k) => issue(k as IssueKey))
      .filter((i) => issueFixInfo(i, "USD").serviceSlug === "technical-fixes" && i.effort !== "involved");
    expect(sprintIssues.length).toBeGreaterThan(QUOTE_SCOPE_CAP.maxPaidIssues);
    const ids = sprintIssues.map((i) => i.id);

    const within = buildQuote({ issues: sprintIssues, pagesScanned: 6, currency: "USD", selectedIssueIds: ids.slice(0, 8) });
    expect(within.lines.find((l) => l.key === "fix-sprint")).toMatchObject({ price: 149, priceKind: "fixed", priceText: "$149" });

    const usd = buildQuote({ issues: sprintIssues, pagesScanned: 6, currency: "USD", selectedIssueIds: ids.slice(0, 9) });
    expect(usd.lines.map((l) => l.key)).toEqual(["fix-sprint"]);
    expect(usd.lines[0]).toMatchObject({ price: 249, priceKind: "from", priceText: "From $249" });
    expect(usd.reviewReasons).toEqual(["issues-over-cap"]);
    expect(usd.fixedTotal).toBe(false);
    expect(usd.total).toBe(249);
    expect(usd.totalText).toBe("From $249");
    expect(usd.summary).toContain("Fix sprint (from $249)");
    expect(usd.summary).not.toContain("$149");

    const inr = buildQuote({ issues: sprintIssues, pagesScanned: 6, currency: "INR", selectedIssueIds: ids.slice(0, 9) });
    expect(inr.lines[0]).toMatchObject({ price: 17999, priceKind: "from", priceText: "From ₹17,999" });
    expect(catalogItem("fix-sprint").largerJob).toEqual({ usd: { amount: 249, kind: "from" }, inr: { amount: 17999, kind: "from" } });

    // The order hand-off of an over-cap quote still verifies against the catalog, and is never fixed.
    for (const q of [usd, inr]) {
      const v = verifyOrder({ currency: q.currency, items: toOrderItems(q), submittedTotal: q.total, submittedFixed: q.fixedTotal });
      expect(v).toMatchObject({ valid: true, fixed: false, catalogTotal: q.total });
    }
  });

  it("is deterministic and tolerates duplicates and junk", () => {
    const issues = [issue("seo.sitemap:missing"), issue("seo.sitemap:missing"), { id: "", title: "x", severity: "high" } as QuoteIssueInput];
    const a = buildQuote({ issues, pagesScanned: Number.NaN, currency: "USD" });
    const b = buildQuote({ issues, pagesScanned: Number.NaN, currency: "USD" });
    expect(a).toEqual(b);
    expect(a.coveredIssueIds).toEqual(["seo.sitemap:missing"]);
    expect(a.summary).toBe(
      "We found 1 issue. We suggest Fix sprint ($149). Total $149, fixed, excluding applicable taxes.",
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
      serviceLabel: "Fix sprint",
      priceText: "$149",
    });
    expect(issueFixInfo({ id: "geo.ai-crawlers:search-blocked" }, "INR").priceText).toBe("₹2,999");
    expect(issueFixInfo({ id: "geo.faq:missing" }, "INR").priceText).toBe("From ₹6,999");
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
    expect(v).toMatchObject({ valid: true, fixed: true, catalogTotal: 49 });
  });
});

describe("R3 regressions: verifyOrder", () => {
  it("H1: a tampered label is replaced by the catalog label and flagged", () => {
    const v = verifyOrder({
      currency: "USD",
      items: [
        { serviceSlug: "ai-crawler-unblock", label: "Full site rebuild + 12 months retainer (agreed by phone)", price: 49, from: false },
      ],
      submittedTotal: 49,
      submittedFixed: true,
    });
    expect(v.valid).toBe(false);
    expect(v.fixed).toBe(false);
    expect(v.items[0]).toMatchObject({
      label: "AI crawler unblock",
      submittedLabel: "Full site rebuild + 12 months retainer (agreed by phone)",
      problem: "label-mismatch",
      valid: false,
    });
  });

  it("H1: the label buildQuote produces verifies cleanly", () => {
    const q = buildQuote({ issues: [issue("geo.ai-crawlers:search-blocked")], pagesScanned: 6, currency: "USD" });
    const v = verifyOrder({ currency: "USD", items: toOrderItems(q), submittedTotal: q.total, submittedFixed: true });
    expect(v.items[0]).toMatchObject({ label: "AI crawler unblock", submittedLabel: null, problem: null });
  });

  it("the larger-job price only verifies as a 'from' price, never as fixed", () => {
    const sprint = { serviceSlug: "technical-fixes", label: "Fix sprint" };
    const asFixed = verifyOrder({ currency: "USD", items: [{ ...sprint, price: 249, from: false }], submittedTotal: 249, submittedFixed: true });
    expect(asFixed.valid).toBe(false);
    expect(asFixed.items[0].problem).toBe("price-mismatch");
    const asFrom = verifyOrder({ currency: "USD", items: [{ ...sprint, price: 249, from: true }], submittedTotal: 249, submittedFixed: true });
    expect(asFrom).toMatchObject({ valid: true, fixed: false });
    const wrongCurrency = verifyOrder({ currency: "INR", items: [{ ...sprint, price: 249, from: true }], submittedTotal: 249, submittedFixed: false });
    expect(wrongCurrency.valid).toBe(false);
  });

  it("L4: duplicate services are flagged and never valid or fixed", () => {
    const same = { serviceSlug: "ai-crawler-unblock", label: "AI crawler unblock", price: 49, from: false };
    const v = verifyOrder({ currency: "USD", items: Array(12).fill(same), submittedTotal: 588, submittedFixed: true });
    expect(v.valid).toBe(false);
    expect(v.fixed).toBe(false);
    expect(v.items[0].problem).toBeNull();
    expect(v.items.slice(1).every((i) => i.problem === "duplicate")).toBe(true);
    expect(v.catalogTotal).toBe(49);
    // aliases count as the same service
    const full = { label: "Full audit (SEO + GEO, reviewed by a person)", price: 39, from: false };
    const w = verifyOrder({
      currency: "USD",
      items: [{ serviceSlug: "seo-audit", ...full }, { serviceSlug: "geo-audit", ...full }],
      submittedTotal: 78,
      submittedFixed: true,
    });
    expect(w.items[1].problem).toBe("duplicate");
    expect(w.valid).toBe(false);
  });
});
