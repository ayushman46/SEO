import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { home, homeMeta } from "@/content/home";
import { services, servicesPage } from "@/content/services";
import { pricingFaq, pricingPage, pricingTiers } from "@/content/pricing";
import { aboutPage, aboutSections } from "@/content/about";
import { contactForm, contactPage, contactServiceOptions } from "@/content/contact";
import { auditEmailGate, auditErrors, auditPage, auditProgressSteps } from "@/content/audit";
import { privacy, privacyMeta, terms, termsMeta } from "@/content/legal";
import { TITLE_SUFFIX, buildMetadata, pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbLd, faqLd, organizationLd, serializeJsonLd, serviceLd, websiteLd } from "@/lib/seo/jsonld";
import { buildLlmsTxt } from "@/lib/seo/llms";

const templatedPages = {
  servicesPage,
  pricingPage,
  aboutPage,
  contactPage,
  auditPage,
  privacyMeta,
  termsMeta,
};

const allCopy = JSON.stringify({
  site,
  home,
  homeMeta,
  services,
  servicesPage,
  pricingTiers,
  pricingFaq,
  pricingPage,
  aboutPage,
  aboutSections,
  contactPage,
  contactForm,
  auditPage,
  auditEmailGate,
  auditErrors,
  privacy,
  terms,
  llms: buildLlmsTxt(),
});

describe("page meta lengths", () => {
  for (const [name, page] of Object.entries(templatedPages)) {
    it(`${name}: title with suffix <= 60 chars`, () => {
      expect((page.metaTitle + TITLE_SUFFIX).length).toBeLessThanOrEqual(60);
    });
    it(`${name}: description 120-155 chars`, () => {
      expect(page.metaDescription.length).toBeGreaterThanOrEqual(120);
      expect(page.metaDescription.length).toBeLessThanOrEqual(155);
    });
  }

  it("home: absolute title <= 60 and description 120-155", () => {
    expect(homeMeta.metaTitle.length).toBeLessThanOrEqual(60);
    expect(homeMeta.metaDescription.length).toBeGreaterThanOrEqual(120);
    expect(homeMeta.metaDescription.length).toBeLessThanOrEqual(155);
  });

  it("site default description 120-155", () => {
    expect(site.description.length).toBeGreaterThanOrEqual(120);
    expect(site.description.length).toBeLessThanOrEqual(155);
  });

  it("titles and descriptions are unique", () => {
    const all = [homeMeta, ...Object.values(templatedPages)];
    expect(new Set(all.map((p) => p.metaTitle)).size).toBe(all.length);
    expect(new Set(all.map((p) => p.metaDescription)).size).toBe(all.length);
  });
});

describe("content rules", () => {
  it("brand is always lowercase seenhq", () => {
    expect(allCopy).not.toMatch(/SeenHQ|Seenhq|SEENHQ|seenHQ/);
  });

  it("never mentions sign up, log in, dashboards or accounts", () => {
    expect(allCopy).not.toMatch(/sign[ -]?up|log[ -]?in|dashboard|account/i);
  });

  it("service slugs are exact", () => {
    expect(services.map((s) => s.slug)).toEqual([
      "seo-audit",
      "geo-audit",
      "technical-fixes",
      "content-entity",
      "monitoring",
    ]);
    for (const s of services) expect(s.priceFrom).toContain("[PLACEHOLDER");
  });

  it("contact service options cover every service plus not-sure", () => {
    expect(contactServiceOptions.map((o) => o.value)).toEqual([...services.map((s) => s.slug), "not-sure"]);
  });

  it("paid prices are placeholder-marked", () => {
    for (const t of pricingTiers.filter((t) => t.price !== "$0")) expect(t.price).toContain("[PLACEHOLDER");
  });

  it("home has 4 tabs, 3 steps and 6-8 FAQs", () => {
    expect(home.tabs.map((t) => t.id)).toEqual(["seo", "geo", "performance", "fixes"]);
    expect(home.howItWorks.steps).toHaveLength(3);
    expect(home.faq.length).toBeGreaterThanOrEqual(6);
    expect(home.faq.length).toBeLessThanOrEqual(8);
  });

  it("audit copy covers every error code and progress step", () => {
    for (const code of ["invalid_url", "blocked_host", "unreachable", "timeout", "not_html", "too_large", "rate_limited"]) {
      expect(auditErrors).toHaveProperty(code);
    }
    expect(auditProgressSteps).toHaveLength(5);
  });
});

describe("metadata", () => {
  it("buildMetadata sets canonical, OG and Twitter", () => {
    const m = buildMetadata({ title: "X", description: "Y", path: "/pricing" });
    expect(m.alternates?.canonical).toBe("/pricing");
    expect(m.openGraph?.url).toBe("/pricing");
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
    expect(m.robots).toBeUndefined();
    expect(buildMetadata({ title: "X", description: "Y", path: "/x", noindex: true }).robots).toMatchObject({
      index: false,
    });
  });

  it("every page has metadata", () => {
    expect(Object.keys(pageMetadata).sort()).toEqual(
      ["about", "audit", "contact", "home", "pricing", "privacy", "services", "terms"].sort(),
    );
  });
});

describe("json-ld", () => {
  it("escapes < so content cannot close the script tag", () => {
    const out = serializeJsonLd(faqLd([{ q: "</script><script>alert(1)</script>", a: "a" }]));
    expect(out).not.toContain("<");
    expect(JSON.parse(out).mainEntity[0].name).toBe("</script><script>alert(1)</script>");
  });

  it("emits expected types and no placeholders", () => {
    const nodes = [organizationLd(), websiteLd(), serviceLd(services[0]), breadcrumbLd([{ name: "Pricing", path: "/pricing" }])];
    expect(nodes.map((n) => n["@type"])).toEqual(["Organization", "WebSite", "Service", "BreadcrumbList"]);
    expect(JSON.stringify(nodes)).not.toContain("[PLACEHOLDER");
  });
});

describe("llms.txt", () => {
  it("follows the llmstxt.org shape", () => {
    const txt = buildLlmsTxt();
    expect(txt.startsWith("# seenhq\n\n> ")).toBe(true);
    expect(txt).toMatch(/^## Key pages$/m);
    expect(txt).toMatch(/^- \[Pricing\]\(https?:\/\/.+\/pricing\): .+$/m);
  });
});
