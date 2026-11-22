import { site, contentUpdated } from "@/content/site";
import { home, sampleReportMeta } from "@/content/home";
import { services, servicesPage } from "@/content/services";
import { pricingPage } from "@/content/pricing";
import { aboutPage } from "@/content/about";
import { contactPage } from "@/content/contact";
import { auditPage } from "@/content/audit";
import { privacyMeta, termsMeta } from "@/content/legal";
import { methodologyPage } from "@/content/methodology";
import { botPage } from "@/content/bot";
import { absoluteUrl } from "./metadata";

/** Builds /llms.txt following the llmstxt.org format: H1, blockquote summary, details, then H2 link lists. */
export function buildLlmsTxt(): string {
  const link = (title: string, path: string, desc: string) => `- [${title}](${absoluteUrl(path)}): ${desc}`;
  const definitions = home.faq.filter((f) => /^What (is|are) /.test(f.q));

  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} (always written in lowercase) offers a free automated website audit that scores a site on SEO, GEO (Generative Engine Optimization) and mobile performance, plus fixed-scope services for startups, SaaS teams and local businesses. The audit reads a site's homepage and up to five internal pages, robots.txt, sitemap and llms.txt, and runs Google PageSpeed Insights. It also flags key facts that exist only in images, PDFs or JavaScript, crossed-out, hidden or conflicting facts such as old prices or different phone numbers across pages, and runs a simulated AI-crawler fetch test from its own servers. The full report is unlocked by entering an email address; nothing else is required, and it can be exported as developer tickets in Markdown or as one prompt for a coding agent.`,
    "",
    `The audit's AI reading sends the text of the fetched public pages to an open-weight language model hosted on NVIDIA's API, which reports how an AI model would describe the business, which of seven core facts are clear, vague or missing, which customer questions the pages answer, and drafts a title, meta description, llms.txt, Organization JSON-LD and an answer-ready paragraph from facts on the site only. It is one model's reading of the pages, not what ChatGPT, Gemini or Perplexity say about the business, and it can be wrong. The audit does not run JavaScript, open PDFs or read images.`,
    "",
    `Paid services are done by a person, not by automated tracking. Besides audits, fixes, content work and monthly monitoring, they include an AI fact-check & fix (checking what AI assistants say about a business against its real facts and correcting the sources it controls), a local AI visibility setup (Bing Places, Apple Business, Yelp or a local equivalent, and the ChatGPT business profile where eligible) and an AI crawler unblock (finding and fixing the server, CDN or host layer that refuses AI crawlers). ${site.name} cannot control what any AI assistant says, and AI answers vary between runs.`,
    "",
    `Engines checked against: ${site.enginesTracked.join(", ")}. ${site.name} is not affiliated with any of them.`,
    "",
    ...definitions.flatMap((f) => [`**${f.q}** ${f.a}`, ""]),
    `Last updated: ${contentUpdated}`,
    "",
    "## Key pages",
    "",
    link("Home", "/", "What seenhq is, how the audit works, and answers to common questions about SEO and GEO."),
    link("Free audit", "/audit", auditPage.metaDescription),
    link("Services", "/services", servicesPage.metaDescription),
    link("Pricing", "/pricing", pricingPage.metaDescription),
    link("About", "/about", aboutPage.metaDescription),
    link("Contact", "/contact", contactPage.metaDescription),
    link("Sample audit report", "/sample-report", sampleReportMeta.metaDescription),
    link("How the audit works", "/methodology", methodologyPage.metaDescription),
    link("About seenhqbot", "/bot", botPage.metaDescription),
    "",
    "## Services",
    "",
    ...services.map((s) => link(s.name, `/services#${s.slug}`, s.tagline)),
    "",
    "## Optional",
    "",
    link("Privacy policy", "/privacy", privacyMeta.metaDescription),
    link("Terms of service", "/terms", termsMeta.metaDescription),
    link("Sitemap", "/sitemap.xml", "XML sitemap of all public pages."),
    "",
  ];
  return lines.join("\n");
}
