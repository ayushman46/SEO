import { describe, expect, it } from "vitest";
import { CATALOG, catalogItem, catalogItemForSlug, formatPrice, type CatalogKey, type CatalogPrice } from "@/lib/quote/catalog";
import { services } from "@/content/services";
import {
  pricingExtrasUsd,
  pricingIndiaExtras,
  pricingNote,
  pricingNoteInr,
  pricingOrderSteps,
  pricingTiers,
  pricingTiersInr,
} from "@/content/pricing";
import { auditQuoteCopy } from "@/content/audit";
import { CONTACT_SERVICES } from "@/app/actions/contact-schema";

/**
 * "From $99" → {from, 99}; "$149" → {fixed, 149}; "Included in the Full audit · $39" → {fixed, 39};
 * "₹3,999 per location" → {fixed, 3999}. The first price in the string counts.
 */
function parsePrice(text: string, symbol: "$" | "₹"): CatalogPrice {
  const re = new RegExp(`(?:^|\\s)(From )?\\${symbol}([0-9][0-9,]*)(?![0-9,])`);
  const m = re.exec(text.trim());
  if (!m) throw new Error(`Cannot parse price "${text}"`);
  return { kind: m[1] ? "from" : "fixed", amount: Number(m[2].replace(/,/g, "")) };
}

const TIER_KEYS: Record<string, CatalogKey> = {
  "Full audit": "full-audit",
  "Fix sprint": "fix-sprint",
  Monitoring: "monitoring",
};
const INDIA_EXTRA_KEYS: Record<string, CatalogKey> = {
  "AI fact-check & fix": "ai-fact-check",
  "Local AI visibility setup": "local-ai-setup",
  "AI crawler unblock": "ai-crawler-unblock",
  "Content & entity": "content-entity",
};

describe("catalog matches the published prices", () => {
  it("every catalog USD price equals the services page price (amount and From wording)", () => {
    for (const item of CATALOG) {
      for (const slug of [item.serviceSlug, ...item.alsoMatches]) {
        const service = services.find((s) => s.slug === slug);
        expect(service, `service ${slug}`).toBeDefined();
        expect(parsePrice(service!.priceFrom, "$"), `${slug}: "${service!.priceFrom}"`).toEqual(item.usd);
      }
    }
  });

  it("every services page price is in the catalog", () => {
    for (const s of services) expect(catalogItemForSlug(s.slug), s.slug).not.toBeNull();
  });

  it("USD pricing tiers agree with the catalog", () => {
    for (const tier of pricingTiers) {
      if (tier.name === "Free audit") continue;
      const key = TIER_KEYS[tier.name];
      expect(key, `unmapped tier ${tier.name}`).toBeDefined();
      expect(parsePrice(tier.price, "$"), tier.name).toEqual(catalogItem(key).usd);
    }
  });

  it("INR tiers and India extras agree with the catalog", () => {
    const seen = new Set<CatalogKey>();
    for (const tier of pricingTiersInr) {
      if (tier.name === "Free audit") continue;
      const key = TIER_KEYS[tier.name];
      expect(key, `unmapped tier ${tier.name}`).toBeDefined();
      expect(parsePrice(tier.price, "₹"), tier.name).toEqual(catalogItem(key).inr);
      seen.add(key);
    }
    for (const extra of pricingIndiaExtras) {
      const key = INDIA_EXTRA_KEYS[extra.name];
      expect(key, `unmapped India extra ${extra.name}`).toBeDefined();
      expect(parsePrice(extra.price, "₹"), extra.name).toEqual(catalogItem(key).inr);
      seen.add(key);
    }
    // Every catalog item with an INR price is published in rupees, and vice versa.
    for (const item of CATALOG) {
      expect(item.inr !== null, `${item.key} INR published=${seen.has(item.key)}`).toBe(seen.has(item.key));
    }
  });

  it("USD 'Other services' mirror the India extras and agree with the catalog (R5 B12)", () => {
    expect(pricingExtrasUsd.map((e) => [e.name, e.href, e.description])).toEqual(
      pricingIndiaExtras.map((e) => [e.name, e.href, e.description]),
    );
    for (const extra of pricingExtrasUsd) {
      const key = INDIA_EXTRA_KEYS[extra.name];
      expect(key, `unmapped extra ${extra.name}`).toBeDefined();
      expect(parsePrice(extra.price, "$"), extra.name).toEqual(catalogItem(key).usd);
    }
    expect(pricingExtrasUsd.map((e) => e.price)).toEqual(["$59", "$99 per location", "$49", "From $99"]);
  });

  it("the Fix sprint's larger-job price on /pricing and /services is the catalog's (R5 B1, ruling 6)", () => {
    const larger = catalogItem("fix-sprint").largerJob!;
    expect(larger.usd).toEqual({ amount: 249, kind: "from" });
    expect(larger.inr).toEqual({ amount: 17999, kind: "from" });
    const usdText = `from ${formatPrice(larger.usd.amount, "USD")}`;
    const inrText = `from ${formatPrice(larger.inr!.amount, "INR")}`;
    expect(pricingNote).toContain(`A job larger than 8 fixes gets a fixed quote ${usdText} before work starts.`);
    expect(pricingNoteInr).toContain(`A job larger than 8 fixes gets a fixed quote ${inrText} before work starts.`);
    const sprint = services.find((s) => s.slug === "technical-fixes")!;
    expect(sprint.description).toContain(`Larger jobs get a fixed quote ${usdText} before work starts.`);
    // Every larger-job figure anywhere in the pricing or services copy is the catalog's.
    const copy = JSON.stringify({ services, pricingNote, pricingNoteInr, pricingOrderSteps });
    for (const m of copy.matchAll(/(?:larger|more than 8)[^"]*?from ([$₹][\d,]+)/gi)) {
      expect([formatPrice(larger.usd.amount, "USD"), formatPrice(larger.inr!.amount, "INR")]).toContain(m[1]);
    }
    expect(JSON.stringify(pricingOrderSteps)).not.toMatch(/Fixed prices stay fixed/);
  });

  it("one product name: the Fix sprint (R5 B10, ruling 8)", () => {
    expect(catalogItem("fix-sprint").label).toBe("Fix sprint");
    expect(services.find((s) => s.slug === "technical-fixes")!.name).toBe("Fix sprint");
    expect(pricingTiers.some((t) => t.name === "Fix sprint")).toBe(true);
    expect(auditQuoteCopy.fixListExplainer("USD")).toBe("One Fix sprint covers up to 8 of these for $149.");
    expect(auditQuoteCopy.fixListExplainer("INR")).toBe("One Fix sprint covers up to 8 of these for ₹9,999.");
  });

  it("Content & entity has a rupee starting price in both the catalog and the India extras", () => {
    expect(catalogItem("content-entity").inr).toEqual({ amount: 6999, kind: "from" });
    expect(pricingIndiaExtras.find((e) => /content/i.test(e.name))?.price).toBe("From ₹6,999");
  });

  it("every catalog slug is an orderable contact-form service", () => {
    for (const item of CATALOG) {
      for (const slug of [item.serviceSlug, ...item.alsoMatches]) {
        expect((CONTACT_SERVICES as readonly string[]).includes(slug), slug).toBe(true);
      }
    }
  });

  it("keys are unique and slugs resolve to one item", () => {
    expect(new Set(CATALOG.map((c) => c.key)).size).toBe(CATALOG.length);
    const slugs = CATALOG.flatMap((c) => [c.serviceSlug, ...c.alsoMatches]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("monitoring is never quotable (offered only after a fix is bought)", () => {
    expect(catalogItem("monitoring").quotable).toBe(false);
  });
});

describe("formatPrice", () => {
  it("formats USD and INR deterministically", () => {
    expect(formatPrice(49, "USD")).toBe("$49");
    expect(formatPrice(1199, "USD")).toBe("$1,199");
    expect(formatPrice(1234567, "USD")).toBe("$1,234,567");
    expect(formatPrice(999, "INR")).toBe("₹999");
    expect(formatPrice(14999, "INR")).toBe("₹14,999");
    expect(formatPrice(100000, "INR")).toBe("₹1,00,000");
    expect(formatPrice(12345678, "INR")).toBe("₹1,23,45,678");
  });
});
