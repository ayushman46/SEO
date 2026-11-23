/**
 * Builds src/content/sample-report.json: the illustrative full report shown on /sample-report.
 *
 *   npx tsx scripts/build-sample-report.ts
 *
 * The business ("Marigold Dental", marigold-dental.example) is fictional and lives on a reserved
 * domain. Everything about the result except the AI reading is produced by the real engine: the
 * fictional pages below are parsed with parsePage() and scored with runChecks() + assemble(), so
 * every check, issue title, description, fix and score is the engine's own wording and maths.
 * The AI reading (readback, facts, questions, drafts) is written by hand as plausible model output;
 * its clarityScore is computed with the engine's computeClarityScore().
 *
 * Re-run after engine changes so the sample keeps matching what a real report says.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assemble, runChecks } from "../src/lib/audit/analyze";
import { computeClarityScore } from "../src/lib/audit/ai/clarity";
import { DEFAULT_MODEL } from "../src/lib/audit/ai/config";
import type { AiPhase, AuditContext, BotProbe, CrawlerProbe, FetchedText, ProbeResponse, ProbeTarget, Soft404Probe } from "../src/lib/audit/context";
import { PROBE_BOTS } from "../src/lib/audit/checks/geo/crawler-probe";
import { parsePage } from "../src/lib/audit/html";
import type { AiFact, AiInsights, AiQuestion, AuditResult, CoreWebVitals } from "../src/lib/audit/types";

const ORIGIN = "https://www.marigold-dental.example";
const HOME = `${ORIGIN}/`;
const u = (path: string) => `${ORIGIN}${path}`;
/** When the illustrative audit "ran". */
const STARTED_AT = "2026-11-23T09:41:52.000Z";

/* ───────────────────────── Fictional site ───────────────────────── */

// UK phone numbers in the 0113 496 0xxx range are reserved by Ofcom for fiction.
const PHONE = "0113 496 0418";
const OLD_PHONE = "0113 496 0952";
const EMAIL = "hello@marigold-dental.example";
const ADDRESS = "3 Marigold Lane, Headingley, Leeds LS6 2QA";

const nav = `<header><a href="/"><img src="/img/logo.svg" alt="Marigold Dental"></a><nav>
  <a href="/treatments/">Treatments</a><a href="/treatments/invisalign/">Invisalign</a>
  <a href="/fees/">Fees</a><a href="/about/">About us</a><a href="/contact/">Contact</a></nav></header>`;
const footer = (phone = PHONE) => `<footer><p>Marigold Dental, ${ADDRESS}.</p>
  <p>Call <a href="tel:${phone.replace(/\s/g, "")}">${phone}</a> or email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
  <p>Mon to Fri 8:30am to 6pm, Sat 9am to 1pm.</p></footer>`;

function doc(opts: { title: string; description?: string; canonical?: string | null; head?: string; body: string; phone?: string }): string {
  const canonical = opts.canonical === null ? "" : `<link rel="canonical" href="${opts.canonical}">`;
  const desc = opts.description ? `<meta name="description" content="${opts.description}">` : "";
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${opts.title}</title><meta name="author" content="Marigold Dental"><meta property="article:modified_time" content="2026-09-14">${desc}${canonical}${opts.head ?? ""}</head>
<body>${nav}<main>${opts.body}</main>${footer(opts.phone)}</body></html>`;
}

const p = (s: string) => `<p>${s}</p>`;

const pages: { url: string; html: string }[] = [
  {
    url: HOME,
    html: doc({
      title: "Marigold Dental | Family &amp; Cosmetic Dentist in Leeds",
      description:
        "Friendly family dentist in Headingley, Leeds. Check-ups, hygiene, white fillings, whitening and Invisalign. New NHS and private patients welcome.",
      canonical: HOME,
      head: `<meta property="og:title" content="Marigold Dental">
<meta property="og:description" content="Family and cosmetic dentist in Headingley, Leeds.">
<meta property="og:image" content="${u("/img/share.jpg")}">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Dentist","name":"Marigold Dental","url":"${HOME}","telephone":"${PHONE}"}</script>`,
      body: `<h1>Your friendly family dentist in Headingley</h1>
${p("Marigold Dental is an independent dental practice in Headingley, Leeds, looking after children and adults for check-ups, hygiene visits, fillings, teeth whitening and Invisalign clear aligners.")}
${p("We have been part of the neighbourhood for years and we keep appointments unhurried, so there is always time to ask questions and talk through your options before any treatment.")}
<img src="/img/hero-smile.jpg">
<img src="/img/waiting-room.jpg">
<h2>Our treatments</h2>
${p("General dentistry, hygiene, cosmetic dentistry and orthodontics under one roof. Most treatments can start within two weeks of your first visit.")}
<ul><li>Check-ups and hygiene</li><li>White fillings and crowns</li><li>Teeth whitening</li><li>Invisalign clear aligners</li></ul>
<h2>New patients</h2>
${p("We are currently welcoming new private patients and have limited NHS places for children. Call us or use the contact page to book your first appointment.")}
<img src="/img/team.jpg">`,
    }),
  },
  {
    url: u("/treatments/"),
    html: doc({
      title: "Dental Treatments in Leeds | Marigold Dental",
      description:
        "Check-ups, hygiene, white fillings, crowns, teeth whitening and Invisalign at Marigold Dental in Headingley, Leeds. See what each treatment involves.",
      canonical: u("/treatments/"),
      body: `<h1>Treatments</h1>
${p("From routine check-ups to cosmetic work, every treatment starts with a conversation about what you want to achieve and what it will involve.")}
<h2>Check-ups and hygiene</h2>
${p("A full examination with a dentist, followed by a hygiene appointment to remove plaque and tartar and keep your gums healthy.")}
<h2>White fillings</h2>
${p("Tooth-coloured fillings that blend with your natural teeth, usually completed in a single visit.")}
<h2>Does teeth whitening hurt?</h2>
${p("Some people notice mild sensitivity for a day or two. We use a gentle gel strength and check your teeth and gums before you start.")}
<h2>Teeth whitening</h2>
${p("Professional home whitening with custom trays made from a scan of your teeth, supervised by your dentist.")}
<img src="/img/whitening.jpg">
<h2>Invisalign</h2>
${p("Clear aligners that straighten teeth gradually without fixed braces. See our Invisalign page for how it works.")}`,
    }),
  },
  {
    url: u("/treatments/invisalign/"),
    html: doc({
      title: "Invisalign Clear Aligners in Leeds | Marigold Dental",
      canonical: u("/treatments/invisalign/"),
      body: `<h1>Invisalign in Leeds</h1>
<h2>At a glance</h2>
<ul><li>Clear, removable aligners</li><li>Most adult cases take 6 to 18 months</li><li>Free consultation with a 3D scan</li></ul>
${p("Invisalign uses a series of clear, removable aligners to move your teeth step by step. Most adult cases take between six and eighteen months.")}
<h2>How does Invisalign work?</h2>
${p("After a 3D scan, your dentist plans each movement and you see a preview of the result before you commit. You change aligners every one to two weeks and visit us every six to eight weeks.")}
<h2>Is Invisalign right for me?</h2>
${p("Invisalign suits most crowding and spacing problems. Complex bites may need fixed braces, and we will tell you honestly at your consultation.")}
<img src="/img/aligner.jpg">`,
    }),
  },
  {
    url: u("/fees/"),
    html: doc({
      title: "Private &amp; NHS Dental Fees | Marigold Dental",
      description:
        "Private and NHS dental fees at Marigold Dental in Headingley, Leeds. Download our full price list or ask about spreading the cost of treatment.",
      canonical: u("/fees/"),
      body: `<h1>Fees</h1>
${p("We publish our private fees so you know where you stand before you book. Our full price list is available to download below.")}
${p('<a href="/files/marigold-dental-price-list.pdf">Download our price list (PDF)</a>')}
${p("NHS treatment is charged at the national bands. Ask the team about spreading the cost of larger treatments.")}`,
    }),
  },
  {
    url: u("/about/"),
    html: doc({
      title: "Marigold Dental | Dentist in Headingley, Leeds",
      canonical: u("/about/"),
      body: `<h1>About us</h1>
${p("Marigold Dental is run by a small team of dentists, hygienists and nurses who live locally and care about doing things properly.")}
${p("Our practice was refurbished with a calm waiting room, step-free access and a dedicated hygiene suite.")}
<img src="/img/practice-front.jpg">
<h2>Our team</h2>
${p("Our dentists are registered with the General Dental Council and take part in regular training.")}`,
    }),
  },
  {
    url: u("/contact/"),
    html: doc({
      title: "Marigold Dental | Dentist in Headingley, Leeds",
      canonical: u("/contact/"),
      phone: OLD_PHONE,
      body: `<h1>Contact us</h1>
${p(`Find us at ${ADDRESS}. There is free on-street parking nearby and the 1 bus stops outside.`)}
${p(`Call reception on <a href="tel:${OLD_PHONE.replace(/\s/g, "")}">${OLD_PHONE}</a> or email ${EMAIL} and we will reply within one working day.`)}
<h2>Opening hours</h2>
${p("Mon to Fri 8:30am to 6pm, Sat 9am to 1pm.")}`,
    }),
  },
];

const robotsTxt = `User-agent: *
Allow: /

# added by a security plugin
User-agent: PerplexityBot
Disallow: /

Sitemap: ${u("/sitemap.xml")}
`;
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((pg) => `  <url><loc>${pg.url}</loc><lastmod>2026-09-14</lastmod></url>`).join("\n")}
</urlset>`;

const ok = (url: string, text: string): FetchedText => ({ status: "ok", url, requestedUrl: url, statusCode: 200, text });
const missing = (url: string): FetchedText => ({ status: "missing", url, requestedUrl: url, statusCode: 404, text: null });

const vitals: CoreWebVitals = {
  source: "pagespeed-insights",
  strategy: "mobile",
  performanceScore: 44,
  lcpMs: 4620,
  cls: 0.04,
  inpMs: null,
  fcpMs: 2240,
  tbtMs: 170,
};

const ctx: AuditContext = {
  requestedUrl: HOME,
  finalUrl: HOME,
  hostname: new URL(HOME).hostname,
  origin: ORIGIN,
  pages: pages.map((pg, i) =>
    parsePage({
      url: pg.url,
      requestedUrl: pg.url,
      statusCode: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
      html: pg.html,
      isHome: i === 0,
    }),
  ),
  robots: ok(u("/robots.txt"), robotsTxt),
  sitemap: ok(u("/sitemap.xml"), sitemapXml),
  llms: missing(u("/llms.txt")),
  httpToHttps: { checked: true, redirectsToHttps: true },
  psi: { ok: true, vitals, error: null },
  now: new Date(STARTED_AT),
};

/* ───────────────────────── Simulated crawler probe ─────────────────────────
 * Cloudflare's bot rules refuse the two AI training crawlers; the other crawlers get through. */

const targets: ProbeTarget[] = [
  { url: HOME, kind: "page", baselineStatus: 200, baselineSize: 38_400 },
  { url: u("/treatments/"), kind: "page", baselineStatus: 200, baselineSize: 31_200 },
  { url: u("/fees/"), kind: "page", baselineStatus: 200, baselineSize: 24_900 },
  { url: u("/robots.txt"), kind: "robots", baselineStatus: 200, baselineSize: 64 },
  { url: u("/llms.txt"), kind: "llms", baselineStatus: 404, baselineSize: null },
];
const cfHeaders = { server: "cloudflare", "cf-ray": "8e2f1a9c7d3b4e10-LHR" };
const head = (status: number, headers: Record<string, string> = cfHeaders): ProbeResponse => ({
  method: "HEAD",
  status,
  headers,
  body: "",
  size: 0,
});
const REFUSED = new Set(["GPTBot", "ClaudeBot"]);
const probes: BotProbe[] = PROBE_BOTS.flatMap((b) =>
  targets.map((t) => ({
    bot: b.name,
    url: t.url,
    kind: t.kind,
    response: REFUSED.has(b.name) && t.kind !== "llms" ? head(403) : head(t.baselineStatus ?? 200),
  })),
);
const probe: CrawlerProbe = { status: "ok", targets, probes, skippedByRobots: [] };

/* ───────────────────────── AI reading (illustrative model output) ───────────────────────── */

const facts: AiFact[] = [
  {
    key: "what",
    label: "What you do",
    value: "Independent dental practice offering check-ups, hygiene, white fillings, crowns, teeth whitening and Invisalign.",
    status: "clear",
  },
  {
    key: "who-for",
    label: "Who it is for",
    value: "Children and adults in Headingley; new private patients and limited NHS places for children.",
    status: "clear",
  },
  { key: "where", label: "Where you are", value: ADDRESS, status: "clear" },
  {
    key: "pricing",
    label: "Pricing",
    value: "Private fees are said to be published, but only in a downloadable PDF; NHS treatment at national bands.",
    status: "vague",
  },
  {
    key: "contact",
    label: "How to contact you",
    value: `Phone ${PHONE} in the footer, but ${OLD_PHONE} on the contact page; email ${EMAIL}.`,
    status: "vague",
  },
  { key: "proof", label: "Proof", value: null, status: "missing" },
  {
    key: "differentiator",
    label: "What makes you different",
    value: "Unhurried appointments and an independent, local team.",
    status: "vague",
  },
];

const questions: AiQuestion[] = [
  {
    question: "Is Marigold Dental taking new patients?",
    answered: "yes",
    sourceUrl: HOME,
    note: "The homepage says new private patients are welcome and there are limited NHS places for children.",
  },
  {
    question: "How much does a check-up cost at Marigold Dental?",
    answered: "no",
    sourceUrl: null,
    note: "Prices are only in a PDF price list, so no fee appears in the page text.",
  },
  {
    question: "Does Marigold Dental offer Invisalign, and how long does it take?",
    answered: "yes",
    sourceUrl: u("/treatments/invisalign/"),
    note: "The Invisalign page says most adult cases take six to eighteen months.",
  },
  {
    question: "What are Marigold Dental's opening hours?",
    answered: "yes",
    sourceUrl: u("/contact/"),
    note: "Hours are listed on the contact page and in the footer.",
  },
  {
    question: "Does Marigold Dental see emergency patients?",
    answered: "no",
    sourceUrl: null,
    note: "No page mentions emergency or same-day appointments.",
  },
  {
    question: "Can I spread the cost of treatment?",
    answered: "partly",
    sourceUrl: u("/fees/"),
    note: "The fees page invites you to ask about spreading the cost but gives no plan, deposit or terms.",
  },
];

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: "Marigold Dental",
  url: HOME,
  telephone: PHONE,
  email: EMAIL,
  address: {
    "@type": "PostalAddress",
    streetAddress: "3 Marigold Lane, Headingley",
    addressLocality: "Leeds",
    postalCode: "LS6 2QA",
    addressCountry: "GB",
  },
  openingHours: ["Mo-Fr 08:30-18:00", "Sa 09:00-13:00"],
  availableService: ["Dental check-ups", "Dental hygiene", "White fillings", "Teeth whitening", "Invisalign"],
};

const ai: AiInsights = {
  model: DEFAULT_MODEL,
  readback:
    "Marigold Dental is an independent family and cosmetic dental practice in Headingley, Leeds, offering check-ups, hygiene, white fillings, teeth whitening and Invisalign for children and adults. It is welcoming new private patients and has limited NHS places for children.",
  businessType: "local dental practice",
  facts,
  questions,
  drafts: {
    title: "Family Dentist in Headingley, Leeds | Marigold Dental",
    metaDescription:
      "Independent family dentist in Headingley, Leeds: check-ups, hygiene, white fillings, whitening and Invisalign. New private patients welcome. Call 0113 496 0418.",
    llmsTxt: [
      "# Marigold Dental",
      "",
      "> Independent family and cosmetic dental practice in Headingley, Leeds, offering check-ups, hygiene, white fillings, teeth whitening and Invisalign for children and adults.",
      "",
      `Address: ${ADDRESS}. Phone: ${PHONE}. Email: ${EMAIL}. Open Mon to Fri 8:30am to 6pm, Sat 9am to 1pm.`,
      "",
      "## Pages",
      "",
      `- [Treatments](${u("/treatments/")}): check-ups, hygiene, fillings, whitening and Invisalign`,
      `- [Invisalign](${u("/treatments/invisalign/")}): how clear aligners work and how long they take`,
      `- [Fees](${u("/fees/")}): private and NHS fees`,
      `- [About us](${u("/about/")}): the team and the practice`,
      `- [Contact](${u("/contact/")}): address, phone, opening hours`,
      "",
    ].join("\n"),
    organizationJsonLd: JSON.stringify(orgJsonLd, null, 2),
    answerParagraph:
      "Marigold Dental is an independent dental practice at 3 Marigold Lane in Headingley, Leeds. It offers check-ups, hygiene visits, white fillings, crowns, teeth whitening and Invisalign clear aligners for children and adults. The practice is open Monday to Friday 8:30am to 6pm and Saturday 9am to 1pm, and new private patients can book by calling 0113 496 0418.",
  },
  clarityScore: computeClarityScore(facts, questions, true),
};

const aiPhase: AiPhase = { status: "ok", insights: ai, local: true };

/* ───────────────────────── Assemble with the engine ───────────────────────── */

const det = runChecks(ctx);
/* A made-up URL redirects to the homepage (a common CMS setting), so seo.soft-404 warns. */
const soft404: Soft404Probe = {
  status: "ok",
  url: u("/noticr-check-7f3a9c2e"),
  statusCode: 301,
  location: HOME,
  title: null,
};

const a = assemble(ctx, det, aiPhase, probe, soft404);

const result: AuditResult = {
  id: "5a3e0c1d-7b2f-4c8e-9d41-0f6a2b8c9e13",
  version: 1,
  requestedUrl: HOME,
  finalUrl: HOME,
  hostname: ctx.hostname,
  startedAt: STARTED_AT,
  durationMs: 31_480,
  scores: a.scores,
  checks: a.checks,
  issues: a.issues,
  pages: a.pages,
  coreWebVitals: vitals,
  truncated: false,
  notes: a.notes,
  ai,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content", "sample-report.json");
writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);

const counts = result.issues.reduce<Record<string, number>>((m, i) => ((m[i.severity] = (m[i.severity] ?? 0) + 1), m), {});
console.log(`Wrote ${out}`);
console.log(`scores ${JSON.stringify(result.scores)}  clarity ${ai.clarityScore}`);
console.log(`${result.issues.length} issues ${JSON.stringify(counts)}`);
for (const c of result.checks) console.log(`  ${c.status.padEnd(11)} ${c.id} ${c.score}`);
for (const i of result.issues) console.log(`  [${i.severity}] ${i.id} (${i.impact})`);
