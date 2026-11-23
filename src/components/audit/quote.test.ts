import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTACT_QUOTE_FIELDS } from "@/app/actions/contact-schema";
import { auditQuoteCopy } from "@/content/audit";
import { contactQuoteCopy } from "@/content/contact";
import { sampleReportResult } from "@/content/sample-report";
import type { AuditIssue } from "@/lib/audit/types";
import { QUOTE_TEXT, buildQuote, routeFor, type QuoteIssueInput } from "@/lib/quote";
import { QuoteAttachment, QuoteSummary } from "@/components/contact/QuoteAttachment";
import { IssueCard } from "./IssueCard";
import { FixTray } from "./quote/FixTray";
import {
  QUOTE_CHANGE_EVENT,
  clearStoredQuote,
  readStoredQuote,
  storeQuote,
  toStoredQuote,
  type StoredQuote,
} from "./quote/handoff";
import { QuotePanel } from "./quote/QuotePanel";
import { QuoteProvider } from "./quote/QuoteContext";

const AUDIT = { id: "5a3e0c1d-7b2f-4c8e-9d41-0f6a2b8c9e13", url: "https://shop.example/", hostname: "shop.example" };
const issues = sampleReportResult.issues;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/</g, "&lt;");

function withQuote(child: ReactNode, opts: { issues?: readonly QuoteIssueInput[]; selected?: string[]; sample?: boolean } = {}) {
  return renderToStaticMarkup(
    createElement(
      QuoteProvider,
      {
        issues: opts.issues ?? issues,
        pagesScanned: 6,
        audit: AUDIT,
        initialSelected: opts.selected,
        sample: opts.sample,
      },
      child,
    ),
  );
}

const issue = (id: string, extra: Partial<AuditIssue> = {}): AuditIssue => ({
  id,
  checkId: id.split(":")[0],
  category: id.startsWith("seo") ? "seo" : "geo",
  severity: "medium",
  title: `Title for ${id}`,
  description: "Why it matters.",
  howToFix: "Do the thing.",
  effort: "quick",
  impact: 1,
  affectedUrls: [],
  ...extra,
});

describe("quote panel", () => {
  it("always shows the tax note, and the confirm note when the total is not fixed", () => {
    const quote = buildQuote({ issues, pagesScanned: 6, currency: "USD" });
    expect(quote.fixedTotal).toBe(false);
    const html = withQuote(createElement(QuotePanel, { headingId: "q", diyHref: "#issues" }));
    expect(html).toContain(auditQuoteCopy.title);
    expect(html).toContain(esc(QUOTE_TEXT.tax));
    expect(html).toContain(esc(QUOTE_TEXT.confirm));
    expect(html).toContain(esc(quote.totalText));
    for (const l of quote.lines) expect(html).toContain(esc(l.priceText));
  });

  it("omits the confirm note when every price is fixed, but keeps the tax note", () => {
    const only = [issue("geo.ai-crawler-probe:blocked-cloudflare", { severity: "high", effort: "moderate" })];
    const quote = buildQuote({ issues: only, pagesScanned: 6, currency: "USD" });
    expect(quote.fixedTotal).toBe(true);
    const html = withQuote(createElement(QuotePanel, { headingId: "q", diyHref: "#issues" }), { issues: only });
    expect(html).toContain(esc(QUOTE_TEXT.tax));
    expect(html).not.toContain(esc(QUOTE_TEXT.confirm));
  });

  it("lists the do-it-yourself issues and the ones safe to ignore", () => {
    const quote = buildQuote({ issues, pagesScanned: 6, currency: "USD" });
    expect(quote.diyIssueIds.length).toBeGreaterThan(0);
    const html = withQuote(createElement(QuotePanel, { headingId: "q", diyHref: "#issues" }));
    expect(html).toContain(esc(auditQuoteCopy.diyTitle));
    expect(html).toContain(auditQuoteCopy.ignoreTitle);
    const title = (id: string) => issues.find((i) => i.id === id)!.title;
    for (const id of quote.diyIssueIds) expect(html).toContain(esc(title(id)));
    for (const id of quote.safeToIgnore) expect(html).toContain(esc(title(id)));
    // the DIY path is a real link next to the request, not hidden
    expect(html).toContain('href="#issues"');
    expect(html).toContain(esc(auditQuoteCopy.diy));
  });

  it("never pre-selects anything and has no urgency or discount wording", () => {
    const html = withQuote(createElement(QuotePanel, { headingId: "q", diyHref: "#issues" }));
    expect(html).not.toContain('aria-pressed="true"');
    expect(html.match(/checked=""/g)).toHaveLength(1); // only the USD currency radio
    expect(JSON.stringify(auditQuoteCopy)).not.toMatch(
      /today only|hurry|limited time|expires|discount|save \d|% off|act now|guarantee|\balert/i,
    );
  });

  describe("the Fix sprint explainer shows only when it is true (R7 findings 2/9)", () => {
    const explainer = esc(auditQuoteCopy.fixListExplainer("USD"));
    const panel = (only: AuditIssue[]) => withQuote(createElement(QuotePanel, { headingId: "q", diyHref: "#issues" }), { issues: only });

    it("shows it for a quote that is one fixed-price Fix sprint", () => {
      const only = [issue("seo.sitemap:missing"), issue("seo.viewport:missing", { severity: "high" })];
      expect(buildQuote({ issues: only, pagesScanned: 6, currency: "USD" }).lines.map((l) => [l.key, l.priceKind])).toEqual([
        ["fix-sprint", "fixed"],
      ]);
      expect(panel(only)).toContain(explainer);
    });

    it("hides it for a mixed quote (Fix sprint + Content & entity)", () => {
      const mixed = [issue("seo.sitemap:missing"), issue("geo.faq:missing")];
      expect(buildQuote({ issues: mixed, pagesScanned: 6, currency: "USD" }).lines).toHaveLength(2);
      const html = panel(mixed);
      expect(html).toContain("$149");
      expect(html).not.toContain(explainer);
    });

    it("hides it when nothing needs paid help", () => {
      const none = [issue("geo.ai-crawlers:training-blocked", { severity: "low" })];
      const html = panel(none);
      expect(html).toContain(esc(auditQuoteCopy.noLines));
      expect(html).not.toContain(explainer);
    });

    it("hides it for a Fix sprint over the 8-fix cap (larger-job price)", () => {
      const ids = ["seo.sitemap:missing", "seo.sitemap:invalid", "seo.sitemap:empty", "seo.viewport:missing", "seo.https:no-redirect",
        "seo.structured-data:missing", "seo.structured-data:no-type", "geo.dates:missing", "seo.soft-404:returns-200"];
      const over = ids.map((id) => issue(id));
      expect(buildQuote({ issues: over, pagesScanned: 6, currency: "USD" }).lines[0]).toMatchObject({ key: "fix-sprint", priceKind: "from" });
      expect(panel(over)).not.toContain(explainer);
    });
  });

  it("renders nothing outside a QuoteProvider (home page preview)", () => {
    expect(renderToStaticMarkup(createElement(QuotePanel, { headingId: "q", diyHref: "#x" }))).toBe("");
  });
});

describe("per-issue actions", () => {
  it("offers both choices with equal weight on paid issues", () => {
    const i = issue("seo.canonical:missing");
    const html = withQuote(createElement(IssueCard, { issue: i }), { issues: [i] });
    expect(html).toContain(auditQuoteCopy.fixMyself);
    expect(html).toContain(esc(auditQuoteCopy.addToFixList));
    // no price on the per-issue button (Fable's ruling 1 on R5)
    expect(html).not.toContain("$149");
    expect(html).toContain('aria-pressed="false"');
  });

  it("hides the paid button when nothing needs fixing (fixer none)", () => {
    const id = "geo.ai-crawlers:training-blocked";
    expect(routeFor({ id }).fixer).toBe("none");
    const i = issue(id, { severity: "low" });
    const html = withQuote(createElement(IssueCard, { issue: i }), { issues: [i] });
    expect(html).toContain(auditQuoteCopy.fixMyself);
    expect(html).not.toContain(auditQuoteCopy.addToFixList);
  });

  it("keeps the paid option as a quiet text button on DIY issues", () => {
    const i = issue("seo.title:duplicate");
    expect(routeFor({ id: i.id }).fixer).toBe("diy");
    const html = withQuote(createElement(IssueCard, { issue: i }), { issues: [i] });
    expect(html).toContain(auditQuoteCopy.addToFixList);
    expect(html).toMatch(/aria-pressed="false" class="[^"]*underline/);
  });

  it("adds a copy-as-ticket button only when a ticket is given", () => {
    const i = issue("seo.canonical:missing");
    expect(renderToStaticMarkup(createElement(IssueCard, { issue: i }))).not.toContain("as a ticket");
    expect(renderToStaticMarkup(createElement(IssueCard, { issue: i, ticket: "## ticket" }))).toContain("as a ticket");
  });
});

describe("fix list tray", () => {
  it("is hidden until something is picked", () => {
    expect(withQuote(createElement(FixTray, { id: "t" }))).toBe(
      '<div role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>',
    );
  });

  it("shows the same total as buildQuote for the picked issues, with tax and confirm notes", () => {
    const picked = [issues[0].id, issues[3].id, issues[5].id];
    const expected = buildQuote({ issues, pagesScanned: 6, currency: "USD", selectedIssueIds: picked });
    const html = withQuote(createElement(FixTray, { id: "t" }), { selected: picked });
    expect(html).toContain(esc(expected.totalText));
    expect(html).toContain(auditQuoteCopy.trayCount(3));
    expect(html).toContain(esc(QUOTE_TEXT.tax));
    if (!expected.fixedTotal) expect(html).toContain(esc(QUOTE_TEXT.confirm));
    for (const l of expected.lines) expect(html).toContain(esc(l.priceText));
  });

  it("shows the Fix sprint explainer only for a pick that is one fixed-price Fix sprint (R7 findings 2/9)", () => {
    const explainer = esc(auditQuoteCopy.fixListExplainer("USD"));
    const pool = [issue("seo.sitemap:missing"), issue("geo.faq:missing"), issue("geo.fact-consistency:phones")];
    const tray = (selected: string[]) => withQuote(createElement(FixTray, { id: "t" }), { issues: pool, selected });
    expect(tray(["seo.sitemap:missing"])).toContain(explainer);
    expect(tray(["geo.faq:missing"])).not.toContain(explainer);
    expect(tray(["geo.fact-consistency:phones"])).not.toContain(explainer);
    expect(tray(["seo.sitemap:missing", "geo.faq:missing"])).not.toContain(explainer);
  });

  it("points the sample report at the audit instead of an order", () => {
    const html = withQuote(createElement(FixTray, { id: "t" }), { selected: [issues[0].id], sample: true });
    expect(html).toContain('href="/audit"');
    expect(html).not.toContain('href="/contact');
  });
});

/* ---------- order hand-off + contact form ---------- */

function fakeWindow() {
  const store = new Map<string, string>();
  const events: string[] = [];
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    dispatchEvent: (e: Event) => (events.push(e.type), true),
  });
  return { store, events };
}

/** Finds the first <button> element in a rendered (not mounted) element tree. */
function findButton(node: ReactNode): ReactElement<{ onClick?: () => void; children?: ReactNode }> | null {
  if (Array.isArray(node)) {
    for (const n of node) {
      const f = findButton(n);
      if (f) return f;
    }
    return null;
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (node.type === "button") return node as ReactElement<{ onClick?: () => void }>;
  return findButton(node.props.children);
}

describe("order hand-off", () => {
  afterEach(() => vi.unstubAllGlobals());

  const quote = buildQuote({ issues, pagesScanned: 6, currency: "INR" });
  const stored: StoredQuote = toStoredQuote(quote, AUDIT);

  it("stores the quote in sessionStorage (not the URL) and reads it back", () => {
    const { events } = fakeWindow();
    expect(storeQuote(stored)).toBe(true);
    expect(events).toContain(QUOTE_CHANGE_EVENT);
    const back = readStoredQuote();
    expect(back?.orderFields.quote_currency).toBe("INR");
    expect(back?.orderFields.quote_total).toBe(String(quote.total));
    expect(back?.summary.totalText).toBe(quote.totalText);
  });

  it("falls back cleanly when storage is blocked", () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
      dispatchEvent: () => true,
    });
    expect(storeQuote(stored)).toBe(false);
    expect(readStoredQuote()).toBeNull();
  });

  it("rejects malformed stored data", () => {
    const { store } = fakeWindow();
    store.set("noticr:quote", JSON.stringify({ ...stored, orderFields: { ...stored.orderFields, quote_currency: "EUR" } }));
    expect(readStoredQuote()).toBeNull();
    store.set("noticr:quote", "{not json");
    expect(readStoredQuote()).toBeNull();
  });

  it("contact form renders every hidden quote field from the stored data", () => {
    const html = renderToStaticMarkup(createElement(QuoteAttachment, { quote: stored, onRemove: () => {} }));
    for (const f of CONTACT_QUOTE_FIELDS) expect(html).toContain(`type="hidden" name="${f}"`);
    expect(html).toContain(`name="audit_id" value="${AUDIT.id}"`);
    expect(html).toContain(`name="quote_total" value="${quote.total}"`);
    expect(html).toContain(contactQuoteCopy.title);
    expect(html).toContain(esc(contactQuoteCopy.intro(AUDIT.hostname)));
  });

  it("'Remove quote' clears the stored quote, and with no quote no hidden field is rendered", () => {
    const { store, events } = fakeWindow();
    storeQuote(stored);
    const onRemove = vi.fn(() => clearStoredQuote());
    const tree = QuoteSummary({ quote: stored, onRemove });
    const button = findButton(tree);
    expect(button?.props.children).toBe(contactQuoteCopy.remove);
    button!.props.onClick!();
    expect(onRemove).toHaveBeenCalledOnce();
    expect(store.size).toBe(0);
    expect(events.filter((e) => e === QUOTE_CHANGE_EVENT)).toHaveLength(2);
    expect(readStoredQuote()).toBeNull();
    expect(renderToStaticMarkup(createElement(QuoteAttachment, { quote: readStoredQuote(), onRemove }))).toBe("");
  });
});
