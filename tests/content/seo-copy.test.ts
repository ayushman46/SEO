import { afterEach, describe, expect, it, vi } from "vitest";
import { site } from "@/content/site";
import { home, homeMeta } from "@/content/home";
import { services, servicesPage } from "@/content/services";
import { pricingFaq, pricingPage, pricingTiers } from "@/content/pricing";
import { aboutPage, aboutSections } from "@/content/about";
import { contactForm, contactPage, contactServiceOptions } from "@/content/contact";
import { auditEmailGate, auditErrors, auditPage, auditProgressSteps } from "@/content/audit";
import { privacy, privacyMeta, terms, termsMeta } from "@/content/legal";
import { TITLE_SUFFIX, buildMetadata, pageMetadata, rootMetadata, siteUrl } from "@/lib/seo/metadata";
import {
  breadcrumbLd,
  faqLd,
  innerPageLd,
  offerCatalogLd,
  organizationLd,
  serializeJsonLd,
  serviceLd,
  webPageLd,
  websiteLd,
} from "@/lib/seo/jsonld";
import { formatContentDate, lastUpdated } from "@/lib/seo/dates";
import { contentUpdated } from "@/content/site";
import robots from "@/app/robots";
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
    it(`${name}: rendered title is 30-60 chars with the brand exactly once`, () => {
      const rendered = page.metaTitle + TITLE_SUFFIX;
      expect(rendered.length).toBeGreaterThanOrEqual(30);
      expect(rendered.length).toBeLessThanOrEqual(60);
      expect(rendered.match(/seenhq/gi)).toHaveLength(1);
    });
    it(`${name}: description 120-155 chars`, () => {
      expect(page.metaDescription.length).toBeGreaterThanOrEqual(120);
      expect(page.metaDescription.length).toBeLessThanOrEqual(155);
    });
  }

  it("home: absolute title <= 60 and description 120-155", () => {
    expect(homeMeta.metaTitle.length).toBeLessThanOrEqual(60);
    expect(homeMeta.metaTitle.length).toBeGreaterThanOrEqual(30);
    expect(homeMeta.metaTitle.match(/seenhq/gi)).toHaveLength(1);
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

  it("never claims to track AI mentions/citations or to send real-time alerts", () => {
    expect(allCopy).not.toMatch(/who they (mention|cite)|answer snapshot|\balerts?\b/i);
    expect(allCopy).not.toMatch(/shows you whether yours is one of them/i);
  });

  it("SEO and GEO audits are sold as one Full audit at the same fixed price", () => {
    const seo = services.find((s) => s.slug === "seo-audit")!;
    const geo = services.find((s) => s.slug === "geo-audit")!;
    const full = pricingTiers.find((t) => t.name === "Full audit")!;
    expect(seo.priceFrom).toBe(geo.priceFrom);
    expect(seo.priceFrom.startsWith(full.price.replace(" [PLACEHOLDER]", ""))).toBe(true);
    expect(full.price).not.toMatch(/^From/);
    for (const s of [seo, geo]) expect(s.description).toContain("Full audit");
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

describe("siteUrl", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("normalises scheme-less values and strips paths", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "www.seenhq.example");
    expect(siteUrl()).toBe("https://www.seenhq.example");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://seenhq.example/home/");
    expect(siteUrl()).toBe("https://seenhq.example");
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

  it("emits an author and twitter image alt everywhere", () => {
    for (const m of [rootMetadata, ...Object.values(pageMetadata)]) {
      expect(m.authors).toBeTruthy();
      expect(JSON.stringify(m.twitter)).toContain('"alt"');
    }
  });

  it("robots.txt has no non-standard Host line", () => {
    expect(robots()).not.toHaveProperty("host");
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

describe("json-ld placeholders, authors and dates", () => {
  it("faqLd skips items containing placeholders but keeps the rest", () => {
    const node = faqLd(pricingFaq);
    const out = JSON.stringify(node);
    expect(out).not.toContain("[PLACEHOLDER");
    const kept = node.mainEntity as unknown[];
    expect(kept.length).toBeGreaterThan(0);
    expect(kept.length).toBe(pricingFaq.filter((f) => !`${f.q}${f.a}`.includes("[PLACEHOLDER")).length);
  });

  it("services and pricing structured data contain no placeholders", () => {
    expect(JSON.stringify(services.map(serviceLd))).not.toContain("[PLACEHOLDER");
    expect(JSON.stringify(offerCatalogLd(pricingTiers))).not.toContain("[PLACEHOLDER");
    expect(serializeJsonLd({ "@type": "Thing", name: "x [PLACEHOLDER]", list: ["ok", "[PLACEHOLDER: y]"] })).toBe(
      '{"@type":"Thing","list":["ok"]}',
    );
  });

  it("webPageLd and innerPageLd carry author, publisher and dateModified", () => {
    const page = webPageLd({ name: "Pricing", description: "d", path: "/pricing" });
    expect(page.author).toEqual({ "@id": organizationLd()["@id"] });
    expect(page.publisher).toEqual({ "@id": organizationLd()["@id"] });
    expect(page.dateModified).toBe(contentUpdated);
    expect(webPageLd({ name: "P", description: "d", path: "/privacy", dateModified: privacy.updated }).dateModified).toBe(
      privacy.updated,
    );
    expect(innerPageLd({ name: "Pricing", description: "d", path: "/pricing" }).map((n) => n["@type"])).toEqual([
      "WebPage",
      "BreadcrumbList",
    ]);
  });

  it("websiteLd carries a date and organization uses the square logo", () => {
    expect(websiteLd().dateModified).toBe(contentUpdated);
    expect((organizationLd().logo as { url: string }).url).toMatch(/\/logo\.png$/);
  });

  it("formats the visible last-updated date deterministically", () => {
    expect(formatContentDate("2026-11-22")).toBe("22 November 2026");
    expect(lastUpdated()).toEqual({ label: "Last updated", iso: contentUpdated, display: formatContentDate(contentUpdated) });
  });
});

describe("llms.txt", () => {
  it("follows the llmstxt.org shape", () => {
    const txt = buildLlmsTxt();
    expect(txt.startsWith("# seenhq\n\n> ")).toBe(true);
    expect(txt).toMatch(/^## Key pages$/m);
    expect(txt).toMatch(/^- \[Pricing\]\(https?:\/\/.+\/pricing\): .+$/m);
    const firstH2 = txt.indexOf("\n## ");
    for (const line of txt.slice(firstH2).split("\n").filter((l) => l.startsWith("- "))) {
      expect(line).toMatch(/^- \[[^\]]+\]\([^)]+\)(: .+)?$/);
    }
    expect(txt.indexOf("What is GEO")).toBeLessThan(firstH2);
  });
});
