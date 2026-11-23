/**
 * Mechanical checks for the house style in docs/COPY_STYLE.md (adopted from review R4).
 * Cheap on purpose: they catch the patterns that crept in before, not every style rule.
 */
import { describe, expect, it } from "vitest";
import * as siteMod from "@/content/site";
import * as homeMod from "@/content/home";
import * as servicesMod from "@/content/services";
import * as pricingMod from "@/content/pricing";
import * as aboutMod from "@/content/about";
import * as contactMod from "@/content/contact";
import * as auditMod from "@/content/audit";
import * as methodologyMod from "@/content/methodology";
import * as botMod from "@/content/bot";
import * as sampleMod from "@/content/sample-report";
import * as legalMod from "@/content/legal";
import { buildLlmsTxt } from "@/lib/seo/llms";

/** Every string reachable from a value, skipping meta fields (not body copy) and URLs. */
function strings(v: unknown, out: string[] = [], key = ""): string[] {
  if (/^meta/i.test(key) || key === "href" || key === "priceFrom") return out;
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) strings(x, out, k);
  return out;
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const marketing = {
  site: siteMod,
  home: homeMod,
  services: servicesMod,
  pricing: pricingMod,
  about: aboutMod,
  contact: contactMod,
  audit: auditMod,
  sample: sampleMod,
};
const reference = { methodology: methodologyMod, bot: botMod, legal: legalMod };

const marketingText = strings(marketing).join("\n");
const allText = [marketingText, strings(reference).join("\n"), buildLlmsTxt()].join("\n");

describe("house style (docs/COPY_STYLE.md)", () => {
  it("rule 5: no banned filler words or phrases", () => {
    const banned =
      /\b(a handful|simpl[ey]|affordab\w*|increasingly|seamless\w*|robust|leverag\w*|empower\w*|unlock the power|game[- ]chang\w*|cutting[- ]edge|supercharg\w*|effortless\w*|elevate|delve|journey|in today's|enterprise budgets|ten blue links|done-with-you|action plan|worth flagging|nobody can|builds trust|well-kept|from time to time|strong candidate|plan your week|live test)\b/i;
    expect(allText).not.toMatch(banned);
  });

  it("rule 3: no three-verb lists like 'found, cited and chosen'", () => {
    const v = "(?:find|found|read|trust|trusted|understand|cite|cited|quote|quoted|choose|chosen)";
    const triad = new RegExp(`\\b${v},\\s+${v},?\\s+(?:and|or)\\s+${v}\\b`, "gi");
    expect(allText.match(triad) ?? []).toEqual([]);
  });

  it("rule 4: headings, titles and kickers are not questions", () => {
    const offenders: string[] = [];
    const walk = (v: unknown, key = "") => {
      if (typeof v === "string") {
        if (/^(title|kicker|heading)$/.test(key) && v.trim().endsWith("?")) offenders.push(v);
      } else if (Array.isArray(v)) v.forEach((x) => walk(x));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
    };
    walk({ ...marketing, ...reference });
    expect(offenders).toEqual([]);
  });

  // priceFrom is skipped above: the SEO and GEO audit cards share one price by design.
  it("rule 8: FAQ answers stay short, and no marketing paragraph runs long", () => {
    const faqs = [...homeMod.home.faq, ...pricingMod.pricingFaq];
    for (const f of faqs) expect(words(f.a), f.q).toBeLessThanOrEqual(75);
    const body = strings({ ...marketing, sample: undefined });
    for (const s of body) expect(words(s), s.slice(0, 60)).toBeLessThanOrEqual(90);
  });

  it("rule 2: no sentence (6+ words) repeated verbatim on one page", () => {
    const p = pricingMod;
    const pages: Record<string, unknown> = {
      home: homeMod.home,
      services: [servicesMod.servicesPage, servicesMod.services, servicesMod.servicesClosing],
      about: aboutMod,
      "pricing (USD)": [
        p.pricingPage,
        p.pricingRateCardHeader,
        p.pricingTiers,
        p.pricingExtrasHeading,
        p.pricingExtrasUsd,
        p.pricingNote,
        p.pricingTaxNote,
        p.pricingOrderSteps,
        p.pricingFaq,
        p.pricingClosing,
      ],
      "pricing (INR)": [
        p.pricingPage,
        p.pricingRateCardHeader,
        p.pricingIndiaHeading,
        p.pricingTiersInr,
        p.pricingIndiaExtras,
        p.pricingIndiaNotes,
        p.pricingNoteInr,
        p.pricingOrderSteps,
        p.pricingFaq,
        p.pricingClosing,
      ],
      methodology: methodologyMod,
      bot: botMod,
    };
    for (const [name, page] of Object.entries(pages)) {
      const seen = new Map<string, number>();
      for (const s of strings(page)) {
        for (const sentence of s.split(/(?<=[.!?])\s+/)) {
          const key = sentence.trim().toLowerCase();
          if (words(key) >= 6) seen.set(key, (seen.get(key) ?? 0) + 1);
        }
      }
      const repeated = [...seen].filter(([, n]) => n > 1).map(([k]) => k);
      expect(repeated, name).toEqual([]);
    }
  });

  it("keeps at most one sourced statistic on the marketing pages", () => {
    const stats = strings({ ...marketing, sample: undefined }).join(" ").match(/\b\d{1,3}(\.\d)?% (of|had|said|were)\b/g) ?? [];
    expect(stats.length).toBeLessThanOrEqual(1);
  });
});
