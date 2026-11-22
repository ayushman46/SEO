import { describe, expect, it } from "vitest";
import { CATALOG, catalogItem, catalogItemForSlug, formatPrice, type CatalogKey, type CatalogPrice } from "@/lib/quote/catalog";
import { services } from "@/content/services";
import { pricingIndiaExtras, pricingTiers, pricingTiersInr } from "@/content/pricing";
import { CONTACT_SERVICES } from "@/app/actions/contact-schema";

/** "From $199" → {from, 199}; "$49 as part of…" → {fixed, 49}; "₹9,999 per location" → {fixed, 9999}. */
function parsePrice(text: string, symbol: "$" | "₹"): CatalogPrice {
  const re = new RegExp(`^(From )?\\${symbol}([0-9][0-9,]*)(?![0-9,])`);
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

  it("Content & entity has no rupee price, so the catalog has none (update both together)", () => {
    expect(catalogItem("content-entity").inr).toBeNull();
    expect(pricingIndiaExtras.some((e) => /content/i.test(e.name))).toBe(false);
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
