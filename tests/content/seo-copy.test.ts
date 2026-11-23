import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { site } from "@/content/site";
import { home, homeMeta, sampleReportMeta } from "@/content/home";
import { services, servicesClosing, servicesPage } from "@/content/services";
import {
  pricingHighlightLabel,
  pricingClosing,
  pricingFaq,
  pricingFaqHeading,
  pricingNote,
  pricingPage,
  pricingServicesLink,
  pricingTiers,
  currencyLabels,
  pricingIndiaComparison,
  pricingIndiaExtras,
  pricingIndiaHeading,
  pricingIndiaNotes,
  pricingNoteInr,
  pricingTiersInr,
  pricingTaxNote,
} from "@/content/pricing";
import { aboutClosing, aboutPage, aboutSections } from "@/content/about";
import { contactForm, contactNextSteps, contactPage, contactServiceOptions } from "@/content/contact";
import {
  auditAiCopy,
  auditEmailGate,
  auditErrors,
  auditExportCopy,
  auditFlowCopy,
  auditPage,
  auditProgressSteps,
} from "@/content/audit";
import { methodologyFaq, methodologyPage, methodologySections } from "@/content/methodology";
import {
  botFaq,
  botPage,
  botRobotsRule,
  botSections,
  botSimulatedTokens,
  botSimulatedUserAgent,
  botToken,
  botUserAgent,
} from "@/content/bot";
import { CHECK_WEIGHTS } from "@/lib/audit/score";
import { SIMULATED_BOT_TOKENS, simulatedUserAgent, userAgent } from "@/lib/audit/net/fetch";
import sitemap from "@/app/sitemap";
import { privacy, privacyMeta, terms, termsMeta } from "@/content/legal";
import { TITLE_SUFFIX, buildMetadata, pageMetadata, rootMetadata, siteUrl } from "@/lib/seo/metadata";
import {
  breadcrumbLd,
  faqLd,
  innerPageLd,
  founderName,
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
  methodologyPage,
  botPage,
  sampleReportMeta,
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
  pricingNote,
  pricingClosing,
  pricingFaqHeading,
  pricingServicesLink,
  pricingTiersInr,
  pricingIndiaExtras,
  pricingIndiaNotes,
  pricingIndiaHeading,
  pricingIndiaComparison,
  pricingNoteInr,
  currencyLabels,
  aboutPage,
  aboutSections,
  contactPage,
  contactForm,
  contactNextSteps,
  contactServiceOptions,
  aboutClosing,
  pricingHighlightLabel,
  auditPage,
  auditEmailGate,
  auditErrors,
  auditFlowCopy,
  servicesClosing,
  privacy,
  terms,
  methodologyPage,
  methodologySections,
  methodologyFaq,
  botPage,
  botSections,
  botFaq,
  auditAiCopy,
  auditExportCopy,
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
    expect(seo.priceFrom).toBe("Included in the Full audit · $39");
    expect(full.price).toBe("$39");
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
      "ai-fact-check",
      "local-ai-setup",
      "ai-crawler-unblock",
    ]);
    for (const s of services) expect(s.priceFrom).toMatch(/\$\d/);
  });

  it("service prices are the agreed list prices", () => {
    const price = (slug: string) => services.find((s) => s.slug === slug)!.priceFrom;
    expect(price("technical-fixes")).toBe("$149");
    expect(price("content-entity")).toBe("From $99");
    expect(price("monitoring")).toBe("$19/month");
    expect(price("ai-fact-check")).toBe("$59");
    expect(price("local-ai-setup")).toBe("$99 per location");
    expect(price("ai-crawler-unblock")).toBe("$49");
  });

  it("service descriptions carry no placeholders, so Service JSON-LD keeps them", () => {
    for (const s of services) {
      expect(s.description).not.toContain("[PLACEHOLDER");
      expect(s.forWho).not.toContain("[PLACEHOLDER");
    }
  });

  it("AI-facing services state their limits plainly", () => {
    const text = (slug: string) => {
      const s = services.find((x) => x.slug === slug)!;
      return `${s.description} ${s.deliverables.join(" ")}`;
    };
    expect(text("ai-fact-check")).toMatch(/cannot control what an AI says/);
    expect(text("ai-fact-check")).toMatch(/vary/);
    expect(text("local-ai-setup")).toMatch(/only for an existing US listing/);
    expect(text("local-ai-setup")).toMatch(/does not mean any AI assistant will recommend you/);
    expect(text("ai-crawler-unblock")).toMatch(/host's decision/);
    expect(text("ai-crawler-unblock")).toMatch(/does not mean being cited/);
  });

  it("never claims exclusivity, guarantees or results", () => {
    expect(allCopy).not.toMatch(
      /only provider|nobody else|no one else|the only (service|company|agency|one)|unique in the market|we guarantee|guaranteed (results|rankings?|citations?|placement)|used by \d|trusted by/i,
    );
  });

  it("nothing still says there are five services", () => {
    expect(allCopy).not.toMatch(/\bfive (focused |fixed-scope )?services\b/i);
  });

  it("footer lists every service", () => {
    const footer = site.footerGroups.find((g) => g.title === "Services")!;
    expect(footer.links.map((l) => l.href)).toEqual(services.map((s) => `/services#${s.slug}`));
  });

  it("home FAQ answers the wrong-AI-answer question", () => {
    expect(home.faq.map((f) => f.q)).toContain("What if an AI assistant says something wrong about my business?");
  });

  it("audit flow copy and pricing helpers exist", () => {
    for (const key of [
      "timeHint",
      "slowHint",
      "noTopIssues",
      "lockedHint",
      "fullReportUnlocked",
      "cwvSource",
      "cwvUnavailable",
      "retryIn",
      "errorTitle",
      "rateTitle",
      "genericTitle",
      "unlockRateLimited",
    ]) {
      expect(auditFlowCopy).toHaveProperty(key);
    }
    expect(auditFlowCopy.retryIn(1, "10:00")).toBe("You can try again in about a minute (around 10:00).");
    expect(auditErrors.server_busy).toBe("We're running a lot of audits right now. Please try again in a minute.");
    expect(pricingFaqHeading.cta.href).toBe("/contact");
    expect(pricingServicesLink.href).toBe("/services");
  });

  it("contact service options cover every service plus not-sure", () => {
    expect(contactServiceOptions.map((o) => o.value)).toEqual([...services.map((s) => s.slug), "not-sure"]);
  });

  it("USD tier prices are the agreed list prices", () => {
    expect(pricingTiers.map((t) => [t.name, t.price])).toEqual([
      ["Free audit", "$0"],
      ["Full audit", "$39"],
      ["Fix sprint", "$149"],
      ["Monitoring", "$19"],
    ]);
  });

  it("pricing states taxes once per currency view and the written quote once, with no GST claim", () => {
    const tax = /Prices are per site and exclude applicable taxes\./g;
    // The hero intro is shared by both views; each currency panel adds its own copy.
    const usdView = [pricingPage.intro, pricingNote, pricingTaxNote].join(" ");
    const inrView = [pricingPage.intro, pricingIndiaHeading.intro, ...pricingIndiaNotes, pricingNoteInr].join(" ");
    expect(usdView.match(tax)?.length).toBe(1);
    expect(inrView.match(tax)?.length).toBe(1);
    expect(pricingPage.intro).toContain("We confirm scope and a fixed quote in writing before any paid work starts.");
    expect(allCopy).not.toMatch(/\bGST\b/);
  });

  it("INR tiers parallel the USD tiers by name, order and everything but price", () => {
    expect(pricingTiersInr.map((t) => t.name)).toEqual(pricingTiers.map((t) => t.name));
    pricingTiersInr.forEach((t, i) => {
      expect({ ...t, price: "" }).toEqual({ ...pricingTiers[i], price: "" });
      expect(t.price).toContain("₹");
      expect(t.price).not.toContain("$");
    });
    expect(pricingTiersInr.find((t) => t.name === "Free audit")!.price).toBe("₹0");
  });

  it("INR prices and India extras are the agreed list prices, with no Hindi add-on", () => {
    expect(pricingTiersInr.map((t) => t.price)).toEqual(["₹0", "₹2,999", "₹9,999", "₹999"]);
    expect(pricingIndiaExtras.map((x) => [x.name, x.price])).toEqual([
      ["AI fact-check & fix", "₹3,999"],
      ["Local AI visibility setup", "₹3,999 per location"],
      ["AI crawler unblock", "₹2,999"],
      ["Content & entity", "From ₹6,999"],
    ]);
    expect(allCopy).not.toMatch(/Hindi|Hinglish/);
    expect(pricingIndiaNotes).toContain("UPI, bank transfer or card, against an invoice we send before work starts");
    expect(pricingIndiaNotes).toContain("No retainer and no minimum term");
    expect(pricingIndiaComparison.source.href).toMatch(/^https:\/\//);
    expect(currencyLabels.usd).toContain("$");
    expect(currencyLabels.inr).toContain("₹");
  });

  it("pricing FAQ answers the rupee question without placeholders, so FAQ JSON-LD keeps it", () => {
    const item = pricingFaq.find((f) => f.q === "Do you offer pricing in rupees?");
    expect(item).toBeDefined();
    expect(item!.a).toMatch(/^Yes\./);
    expect(item!.a).not.toContain("[PLACEHOLDER");
    const names = (faqLd(pricingFaq).mainEntity as Array<{ name: string }>).map((q) => q.name);
    expect(names).toContain("Do you offer pricing in rupees?");
  });

  it("INR prices never leak into the OfferCatalog", () => {
    const json = JSON.stringify(offerCatalogLd(pricingTiersInr));
    expect(json).not.toContain("[PLACEHOLDER");
    expect(json).not.toContain("₹");
    expect(json).not.toContain('"price"');
    expect(json).not.toContain("INR");
  });

  it("USD offers publish numeric prices in USD", () => {
    const offers = offerCatalogLd(pricingTiers).itemListElement as Array<Record<string, unknown>>;
    expect(offers.map((o) => [o.name, o.price, o.priceCurrency])).toEqual([
      ["Free audit", 0, "USD"],
      ["Full audit", 39, "USD"],
      ["Fix sprint", 149, "USD"],
      ["Monitoring", 19, "USD"],
    ]);
    for (const o of offers) expect(typeof o.price).toBe("number");
    // The Fix sprint is now a fixed price, so it carries no minimum-price specification.
    expect(offers[2].priceSpecification).toBeUndefined();
    expect(offers[3].priceSpecification).toMatchObject({ price: 19, priceCurrency: "USD", unitText: "MONTH" });
  });

  it("payment, refund, cancellation, reply time and governing law use the agreed neutral wording", () => {
    const termsText = terms.sections.flatMap((x) => x.body).join(" ");
    expect(termsText).toContain("if we haven't started the work, you get a full refund.");
    expect(termsText).toContain("Once work has started, we'll agree a fair partial refund based on what's been delivered.");
    expect(termsText).toContain(
      "Monitoring can be cancelled any time by email and stops at the end of the month you have paid for.",
    );
    expect(termsText).toContain("These terms are governed by the laws of India, and the competent courts in India");
    const pay = pricingFaq.find((f) => f.q === "How do I pay?")!.a;
    expect(pay).toContain("Pay by bank transfer, UPI or card.");
    expect(pay).toContain(
      "Payment is due before work starts for one-time services; monitoring is billed monthly in advance",
    );
    expect(contactForm.success.body).toContain("We reply within two working days.");
    expect(contactNextSteps.steps[1].body).toContain("We reply within two working days");
  });

  it("names no person, address, company registration or public email", () => {
    expect(site.contactEmail).toBe("");
    // The only address allowed is the contact form's example input placeholder.
    expect(allCopy.replaceAll("you@company.com", "")).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(aboutSections.map((x) => x.title)).not.toContain("Who is behind seenhq");
    expect(founderName).toBe("");
    const org = organizationLd();
    expect(org).not.toHaveProperty("email");
    expect(org).not.toHaveProperty("founder");
    expect(JSON.stringify(org.contactPoint)).not.toContain("email");
    const privacyText = privacy.sections.flatMap((x) => x.body).join(" ");
    expect(privacyText).toContain(
      "We keep audit records, leads and contact messages for up to 24 months, then delete them, or sooner if you ask.",
    );
    expect(privacyText).toContain("within 30 days");
    expect(privacyText).toMatch(/Vercel/);
  });

  it("home has 4 tabs, 3 steps and 6-10 FAQs", () => {
    expect(home.tabs.map((t) => t.id)).toEqual(["seo", "geo", "performance", "fixes"]);
    expect(home.howItWorks.steps).toHaveLength(3);
    expect(home.faq.length).toBeGreaterThanOrEqual(6);
    expect(home.faq.length).toBeLessThanOrEqual(10);
    expect(home.faq.map((f) => f.q)).toContain("What are Google AI Overviews?");
  });

  it("audit copy covers every error code and progress step", () => {
    for (const code of ["invalid_url", "blocked_host", "unreachable", "timeout", "not_html", "too_large", "rate_limited"]) {
      expect(auditErrors).toHaveProperty(code);
    }
    expect(auditProgressSteps).toHaveLength(6);
    expect(auditProgressSteps).toContain("Running the AI reading");
  });
});

describe("no placeholders left", () => {
  it("no exported copy contains a [PLACEHOLDER marker", () => {
    expect(allCopy).not.toContain("[PLACEHOLDER");
    expect(allCopy).not.toMatch(/placeholder"?:\s*true/i);
  });

  it("no file in src/content contains a [PLACEHOLDER marker (types.ts is Fable's contract docs)", () => {
    const dir = join(process.cwd(), "src", "content");
    const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && f !== "types.ts");
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) expect(readFileSync(join(dir, f), "utf8"), f).not.toContain("[PLACEHOLDER");
  });

  it("src/lib/seo only mentions [PLACEHOLDER inside the stripping helpers", () => {
    const dir = join(process.cwd(), "src", "lib", "seo");
    for (const f of readdirSync(dir).filter((x) => /\.tsx?$/.test(x))) {
      const lines = readFileSync(join(dir, f), "utf8")
        .split("\n")
        .filter((l) => l.includes("[PLACEHOLDER"));
      for (const l of lines) expect(l, f).toMatch(/includes\("\[PLACEHOLDER"\)|still contains "\[PLACEHOLDER"/);
    }
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
      [
        "about",
        "audit",
        "bot",
        "contact",
        "home",
        "methodology",
        "pricing",
        "privacy",
        "sampleReport",
        "services",
        "terms",
      ].sort(),
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

/** Split all exported copy into sentence-ish fragments (JSON string boundaries count as breaks). */
const sentences = allCopy
  .split(/\\n|(?<=[.!?])\s+|"\s*[,:{}[\]]\s*"?/)
  .map((x) => x.trim())
  .filter(Boolean);

describe("AI reading honesty (T018)", () => {
  const engines = /ChatGPT|Gemini|Perplexity|Claude\b|Copilot|AI Overviews/;
  const aiReading = /AI reading|how an AI model|AI model's reading|language model|open-weight/i;

  it("never says or implies the AI reading is what ChatGPT, Gemini or other assistants say", () => {
    expect(allCopy).not.toMatch(
      /(see|shows?|reveals?|find out|learn|check|tells? you) (exactly )?(what|how) (ChatGPT|Gemini|Perplexity|Claude|Copilot|AI Overviews|AI assistants?|AI engines?|answer engines?)[^."]{0,40} (says?|thinks?|knows?|reads?|describes?|sees?)\b/i,
    );
    expect(allCopy).not.toMatch(/(ChatGPT|Gemini|Perplexity)('s)? (reading|view|opinion) of/i);
    for (const s of sentences) {
      // A question may name both ("Is the AI reading what ChatGPT says...?"); its answer is checked below.
      if (s.endsWith("?")) continue;
      if (aiReading.test(s) && engines.test(s)) expect(s).toMatch(/\bnot\b|\bnever\b|\bno\b/i);
    }
    for (const f of [...home.faq, ...methodologyFaq, ...botFaq]) {
      if (aiReading.test(f.q) && engines.test(f.q)) expect(f.a, f.q).toMatch(/^No\./);
    }
  });

  it("states the AI reading's limits wherever it is explained", () => {
    const faq = home.faq.find((f) => f.q === "Does the audit use AI?");
    expect(faq).toBeDefined();
    expect(faq!.a).toMatch(/^Yes/);
    expect(faq!.a).toMatch(/NVIDIA/);
    expect(faq!.a).toMatch(/not what ChatGPT/);
    expect(faq!.a).toMatch(/can be wrong/);
    const ai = methodologySections.find((x) => x.id === "ai-reading")!.body.join(" ");
    expect(ai).toMatch(/It is not what ChatGPT/);
    expect(ai).toMatch(/It can be wrong/);
    expect(buildLlmsTxt()).toMatch(/not what ChatGPT, Gemini or Perplexity say/);
  });

  it("privacy names NVIDIA, the page text sent, and that visitor data is never sent", () => {
    const text = privacy.sections.flatMap((x) => x.body).join(" ");
    expect(privacy.updated).toBe("2026-11-23");
    expect(terms.updated).toBe("2026-11-23");
    expect(text).toMatch(/text from the public pages we fetched from the audited website to NVIDIA's hosted model API/);
    expect(text).toMatch(/never send your email address, your contact form messages/);
    expect(text).toMatch(/simulated requests/);
    const processors = privacy.sections.find((x) => x.heading === "Who processes your data")!.body.join(" ");
    expect(processors).toMatch(/NVIDIA/);
    const termsText = terms.sections.flatMap((x) => x.body).join(" ");
    expect(termsText).toMatch(/may contain errors/);
    expect(termsText).toMatch(/Review and correct every AI-generated reading or draft before you rely on it or publish it/);
  });

  it("the AI-crawler test is always described as simulated, with its IP caveat", () => {
    const mentions = sentences.filter((s) => /crawler (access )?test|AI-crawler (fetch|requests?|test)|fetch as those bots/i.test(s));
    expect(mentions.length).toBeGreaterThan(3);
    for (const s of mentions) expect(s).toMatch(/simulat/i);
    expect(JSON.stringify(methodologySections.find((x) => x.id === "limits"))).toMatch(/verify crawler IP addresses/);
  });
});

describe("methodology and bot pages (T018)", () => {
  it("methodology check weights match the engine and cover every weighted check", () => {
    const checks = methodologySections.find((x) => x.id === "checks")!;
    const items = checks.groups!.flatMap((g) => g.items);
    for (const item of items) {
      if (item.id && item.id in CHECK_WEIGHTS) expect(item.weight, item.id).toBe(CHECK_WEIGHTS[item.id]);
      if (item.weight !== undefined) expect(Object.keys(CHECK_WEIGHTS)).toContain(item.id);
    }
    const listed = new Set(items.map((i) => i.id));
    for (const id of Object.keys(CHECK_WEIGHTS)) expect(listed.has(id), id).toBe(true);
    expect(checks.groups!.map((g) => g.id)).toEqual(["seo", "geo", "ai", "performance"]);
  });

  it("methodology states the real scoring formula", () => {
    const scores = methodologySections.find((x) => x.id === "scores")!.body.join(" ");
    expect(scores).toContain("45% SEO, 35% GEO and 20% Performance");
    expect(scores).toMatch(/facts count for 60% and questions for 40%/);
  });

  it("methodology covers fetch, checks, scores, AI reading, limits and removal", () => {
    expect(methodologySections.map((x) => x.id)).toEqual([
      "what-we-fetch",
      "checks",
      "scores",
      "ai-reading",
      "limits",
      "data-removal",
    ]);
    const limits = JSON.stringify(methodologySections.find((x) => x.id === "limits"));
    expect(limits).toMatch(/do not open the PDF or read the image/);
    expect(limits).toMatch(/No JavaScript/);
    expect(methodologySections.find((x) => x.id === "data-removal")!.cta!.href).toBe("/contact");
  });

  it("bot page documents the real user agent, the robots rule and contact", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://seenhq.example");
    expect(botUserAgent(siteUrl())).toBe(userAgent());
    expect([...botSimulatedTokens]).toEqual([...SIMULATED_BOT_TOKENS]);
    for (const t of botSimulatedTokens) expect(botSimulatedUserAgent(t, siteUrl())).toBe(simulatedUserAgent(t));
    vi.unstubAllEnvs();
    expect(botToken).toBe("seenhqbot");
    expect(botRobotsRule).toBe("User-agent: seenhqbot\nDisallow: /");
    expect(botSections.find((x) => x.id === "contact")!.cta!.href).toBe("/contact");
    expect(JSON.stringify(botSections)).toMatch(/up to five internal pages/);
    expect(botFaq.map((f) => f.q)).toContain("How do I block seenhqbot?");
  });

  it("new FAQs are kept whole in FAQPage JSON-LD", () => {
    for (const list of [methodologyFaq, botFaq]) {
      expect((faqLd(list).mainEntity as unknown[]).length).toBe(list.length);
    }
  });

  it("footer, sitemap and llms.txt include the new pages", () => {
    const company = site.footerGroups.find((g) => g.title === "Company")!;
    expect(company.links.map((l) => l.href)).toContain("/methodology");
    expect(contentUpdated).toBe("2026-11-23");
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/methodology"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/bot"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/sample-report"))).toBe(true);
    expect(sampleReportMeta.metaTitle).toBe("Sample audit report: see every check and fix");
    expect(pageMetadata.sampleReport.alternates?.canonical).toBe("/sample-report");
    const txt = buildLlmsTxt();
    expect(txt).toMatch(/^- \[How the audit works\]\(https?:\/\/.+\/methodology\): .+$/m);
    expect(txt).toMatch(/^- \[Sample audit report\]\(https?:\/\/.+\/sample-report\): .+$/m);
    expect(txt).toMatch(/^- \[About seenhqbot\]\(https?:\/\/.+\/bot\): .+$/m);
  });
});
