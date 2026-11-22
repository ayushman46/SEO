import { describe, expect, it } from "vitest";
import { CONTACT_QUOTE_FIELDS, parseContactAttachment, parseContactForm } from "@/app/actions/contact-schema";
import { verifyOrder } from "@/lib/quote/verify";

function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const base = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  service: "ai-crawler-unblock",
  message: "Please fix the AI crawler block from my audit.",
  consent: "on",
};

const items = (list: unknown[]): string => JSON.stringify(list);
const unblock = { serviceSlug: "ai-crawler-unblock", label: "AI crawler unblock", price: 149, from: false };
const sprint = { serviceSlug: "technical-fixes", label: "Technical fix sprint", price: 199, from: true };

describe("contact quote attachment (T019)", () => {
  it("field names are stable", () => {
    expect([...CONTACT_QUOTE_FIELDS]).toEqual(["quote_currency", "quote_total", "quote_fixed", "quote_items", "audit_id", "audit_url"]);
  });

  it("is optional: a plain contact form has no attachment and still validates", () => {
    const fd = form(base);
    expect(parseContactForm(fd).success).toBe(true);
    expect(parseContactAttachment(fd)).toEqual({ quote: null, quoteMalformed: false, auditId: null, auditUrl: null });
  });

  it("parses a valid quote and audit reference", () => {
    const a = parseContactAttachment(
      form({
        ...base,
        quote_currency: "USD",
        quote_total: "348",
        quote_fixed: "false",
        quote_items: items([unblock, sprint]),
        audit_id: "0B6F9C1E-2D4A-4C8E-9F1A-3B5D7E9A1C2F",
        audit_url: "https://example.com/",
      }),
    );
    expect(a.quoteMalformed).toBe(false);
    expect(a.quote).toEqual({ currency: "USD", total: 348, fixed: false, items: [unblock, sprint] });
    expect(a.auditId).toBe("0b6f9c1e-2d4a-4c8e-9f1a-3b5d7e9a1c2f");
    expect(a.auditUrl).toBe("https://example.com/");
  });

  it("drops (and flags) malformed quotes without blocking the message", () => {
    const bad: Record<string, string>[] = [
      { quote_currency: "EUR", quote_total: "149", quote_fixed: "true", quote_items: items([unblock]) },
      { quote_currency: "USD", quote_total: "-1", quote_fixed: "true", quote_items: items([unblock]) },
      { quote_currency: "USD", quote_total: "149", quote_fixed: "yes", quote_items: items([unblock]) },
      { quote_currency: "USD", quote_total: "149", quote_fixed: "true", quote_items: "{not json" },
      { quote_currency: "USD", quote_total: "149", quote_fixed: "true", quote_items: items([]) },
      { quote_currency: "USD", quote_total: "149", quote_fixed: "true", quote_items: items(Array(13).fill(unblock)) },
      { quote_currency: "USD", quote_total: "149", quote_fixed: "true", quote_items: items([{ ...unblock, label: "x".repeat(121) }]) },
      { quote_currency: "USD", quote_total: "149", quote_fixed: "true", quote_items: items([{ ...unblock, label: "a\nQuote check: ok" }]) },
      { quote_currency: "USD", quote_total: "149", quote_fixed: "true", quote_items: items([{ ...unblock, serviceSlug: "../x" }]) },
      { quote_currency: "USD", quote_total: "149", quote_fixed: "true", quote_items: items([{ ...unblock, extra: 1 }]) },
      { quote_currency: "USD", quote_total: "149", quote_fixed: "true", quote_items: items([{ ...unblock, price: "149" }]) },
      { quote_items: items([unblock]) },
    ];
    for (const fields of bad) {
      const fd = form({ ...base, ...fields });
      expect(parseContactForm(fd).success).toBe(true);
      const a = parseContactAttachment(fd);
      expect(a.quote, JSON.stringify(fields)).toBeNull();
      expect(a.quoteMalformed).toBe(true);
    }
  });

  it("ignores bad audit references", () => {
    for (const [audit_id, audit_url] of [
      ["not-a-uuid", "javascript:alert(1)"],
      ["", "ftp://example.com/"],
      ["1234", "https://localhost/"],
    ]) {
      const a = parseContactAttachment(form({ ...base, audit_id, audit_url }));
      expect(a.auditId).toBeNull();
      expect(a.auditUrl).toBeNull();
    }
  });

  it("normalizes the audit URL so newlines cannot reach the email", () => {
    const a = parseContactAttachment(form({ ...base, audit_url: "https://example.com/a\nInjected: yes" }));
    expect(a.auditUrl === null || !/[\r\n]/.test(a.auditUrl)).toBe(true);
  });
});

describe("verifyOrder: client prices are checked, never trusted", () => {
  it("accepts catalog prices", () => {
    const v = verifyOrder({ currency: "USD", items: [unblock, sprint], submittedTotal: 348, submittedFixed: false });
    expect(v).toMatchObject({ valid: true, fixed: false, catalogTotal: 348 });
  });

  it("flags a tampered price and does not count it", () => {
    const v = verifyOrder({ currency: "USD", items: [{ ...unblock, price: 1 }, sprint], submittedTotal: 200, submittedFixed: false });
    expect(v.valid).toBe(false);
    expect(v.items[0]).toMatchObject({ valid: false, problem: "price-mismatch", catalogPrice: 149 });
    expect(v.catalogTotal).toBe(199);
  });

  it("flags a 'from' price presented as fixed, and never upgrades to fixed", () => {
    const v = verifyOrder({ currency: "USD", items: [{ ...sprint, from: false }], submittedTotal: 199, submittedFixed: true });
    expect(v.items[0].problem).toBe("from-mismatch");
    expect(v.fixed).toBe(false);
    const w = verifyOrder({ currency: "USD", items: [sprint], submittedTotal: 199, submittedFixed: true });
    expect(w.valid).toBe(true);
    expect(w.fixed).toBe(false);
  });

  it("flags unknown and non-quotable services, wrong totals and wrong currencies", () => {
    expect(verifyOrder({ currency: "USD", items: [{ ...unblock, serviceSlug: "free-money" }], submittedTotal: 149, submittedFixed: true }).items[0].problem).toBe("unknown-service");
    expect(verifyOrder({ currency: "USD", items: [{ serviceSlug: "monitoring", label: "Monitoring", price: 29, from: false }], submittedTotal: 29, submittedFixed: true }).items[0].problem).toBe("not-quotable");
    expect(verifyOrder({ currency: "USD", items: [unblock], submittedTotal: 100, submittedFixed: true }).valid).toBe(false);
    expect(verifyOrder({ currency: "INR", items: [unblock], submittedTotal: 149, submittedFixed: true }).items[0].problem).toBe("price-mismatch");
  });

  it("handles INR price-on-request lines (Content & entity)", () => {
    const ok = verifyOrder({
      currency: "INR",
      items: [{ serviceSlug: "content-entity", label: "Content & entity", price: null, from: true }],
      submittedTotal: 0,
      submittedFixed: false,
    });
    expect(ok).toMatchObject({ valid: true, fixed: false, catalogTotal: 0 });
    const bad = verifyOrder({
      currency: "INR",
      items: [{ serviceSlug: "content-entity", label: "Content & entity", price: 5000, from: true }],
      submittedTotal: 5000,
      submittedFixed: false,
    });
    expect(bad.valid).toBe(false);
  });

  it("accepts the geo-audit alias for the Full audit", () => {
    const v = verifyOrder({ currency: "USD", items: [{ serviceSlug: "geo-audit", label: "Full audit (SEO + GEO, reviewed by a person)", price: 49, from: false }], submittedTotal: 49, submittedFixed: true });
    expect(v).toMatchObject({ valid: true, fixed: true });
  });
});
