import type { Cta, FaqItem, PageCopy } from "./types";

/**
 * /methodology: "How the seenhq audit works". Our main trust page, so every number here is the
 * engine's real number. Check weights mirror CHECK_WEIGHTS in src/lib/audit/score.ts, and
 * tests/content/seo-copy.test.ts fails if they drift.
 */

/** One line in a list: a label and a sentence. `weight` is the check's weight inside its category. */
export interface DocItem {
  /** engine check id (e.g. "seo.title") when the item is a scored check; a local id otherwise */
  id?: string;
  label: string;
  body: string;
  weight?: number;
}

/** A group of checks (SEO, GEO, AI reading, Performance). */
export interface CheckGroup {
  id: "seo" | "geo" | "ai" | "performance";
  title: string;
  intro: string;
  items: DocItem[];
}

/** A generic page section. Render body paragraphs, then items (if any), then groups (if any), then cta. */
export interface DocSection {
  /** anchor id */
  id: string;
  title: string;
  body: string[];
  items?: DocItem[];
  groups?: CheckGroup[];
  cta?: Cta;
}

export const methodologyPage = {
  metaTitle: "How the audit works: checks, scores and limits",
  metaDescription:
    "What the free seenhq audit fetches, every SEO, GEO, AI reading and speed check it runs, how the scores are weighted, and the limits we know about.",
  kicker: "Methodology",
  title: "How the seenhq audit works",
  intro:
    "The seenhq audit is a free, automated check that reads up to six public pages of a website and scores them for SEO, GEO (Generative Engine Optimization) and mobile performance. This page lists what it fetches, every check it runs, how the scores are calculated, what the AI reading is and is not, and the limits we know about.",
} satisfies PageCopy;

export const methodologySections: DocSection[] = [
  {
    id: "what-we-fetch",
    title: "What we fetch",
    body: [
      "Our crawler, seenhqbot, visits a site only when someone enters its address on our audit page. It fetches public pages over the normal web, the same way a search engine crawler does, and never runs JavaScript, submits forms or enters password-protected areas.",
    ],
    items: [
      {
        label: "Pages",
        body: "The page you enter (normally the homepage) plus up to five internal pages picked from its links and your sitemap: at most six HTML pages per audit.",
      },
      {
        label: "Site files",
        body: "robots.txt, sitemap.xml (or up to two sitemaps your robots.txt points to), llms.txt, the plain http:// address of your homepage to see whether it redirects to https, and one made-up address to see whether missing pages return 404.",
      },
      {
        label: "robots.txt",
        body: "We always read the page you asked us to audit. Internal pages your robots.txt disallows for seenhqbot are skipped and listed in the report.",
      },
      {
        label: "Speed",
        body: "Google PageSpeed Insights measures the mobile version of the page you entered. Google makes that request, not us.",
      },
      {
        label: "Simulated AI-crawler requests",
        body: "Short requests to your homepage, up to two other fetched pages, robots.txt and llms.txt, once per simulated crawler, with a labelled user agent such as \"GPTBot/1.3; simulated-by seenhqbot/1.0\", to see whether a firewall, CDN or host refuses that crawler. Anything your robots.txt disallows for seenhqbot is skipped.",
      },
      {
        label: "Limits per audit",
        body: "Each request times out after 8 seconds, HTML pages are capped at 2 MB, we follow at most 3 redirects, fetch at most 3 pages at once, and stop the whole audit after 55 seconds. Private and internal network addresses are refused.",
      },
    ],
    cta: { label: "About seenhqbot", href: "/bot" },
  },
  {
    id: "checks",
    title: "Every check we run",
    body: [
      "Each check below gives a score from 0 to 1 and a pass, warning or fail status. The number next to a check is its weight inside its category: a higher weight means it moves that category's score more.",
    ],
    groups: [
      {
        id: "seo",
        title: "SEO",
        intro: "Can Google and Bing find, read and show your pages?",
        items: [
          { id: "seo.indexability", weight: 15, label: "Indexability", body: "Pages answer with a normal status and are not marked noindex." },
          { id: "seo.title", weight: 12, label: "Title tags", body: "Every page has a title that is present, unique and a sensible length." },
          { id: "seo.https", weight: 10, label: "HTTPS", body: "Pages load over HTTPS and the http:// address redirects to it." },
          { id: "seo.robots-txt", weight: 8, label: "robots.txt", body: "The file exists and does not block pages you want found." },
          { id: "seo.meta-description", weight: 8, label: "Meta descriptions", body: "Every page has a unique description of a sensible length." },
          { id: "seo.headings", weight: 7, label: "Headings", body: "One H1 per page and heading levels that do not skip." },
          { id: "seo.viewport", weight: 7, label: "Mobile viewport", body: "Pages declare a mobile viewport." },
          { id: "seo.canonical", weight: 6, label: "Canonical URLs", body: "Each page names its own preferred address on your site." },
          { id: "seo.sitemap", weight: 6, label: "XML sitemap", body: "A valid sitemap lists your public pages and robots.txt points to it." },
          { id: "seo.structured-data", weight: 6, label: "Structured data", body: "Your JSON-LD parses and every item states a schema.org type." },
          { id: "seo.image-alt", weight: 5, label: "Image alt text", body: "Meaningful images have descriptive alt text." },
          { id: "seo.open-graph", weight: 4, label: "Social sharing (Open Graph)", body: "The homepage has a share title, description and image." },
          { id: "seo.lang", weight: 3, label: "Language attribute", body: "Pages declare their language." },
          {
            id: "seo.soft-404",
            weight: 4,
            label: "Missing pages return 404",
            body: "We request one made-up address on your site and check that it returns 404, not a normal page or a redirect to the homepage. It is one request, so it cannot catch every case.",
          },
          {
            id: "seo.bing-indexnow",
            weight: 3,
            label: "Bing & IndexNow readiness",
            body: "Bing verification, IndexNow and fresh sitemap dates. Bing is confirmed to feed Microsoft Copilot, not confirmed for other assistants, and we cannot see DNS or file verification, so this check is never worse than a warning.",
          },
        ],
      },
      {
        id: "geo",
        title: "GEO",
        intro: "Can AI answer engines read, understand and quote your site?",
        items: [
          {
            id: "geo.ai-crawlers",
            weight: 20,
            label: "AI crawler access",
            body: "Whether robots.txt lets in AI crawlers such as OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot, GPTBot, ClaudeBot and Google-Extended on every page we crawled. Search crawlers count three times as much as training crawlers.",
          },
          {
            id: "geo.ai-crawler-probe",
            weight: 8,
            label: "AI crawler access (live test)",
            body: "We request your homepage and a few key files as GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot and bingbot, using labelled test user agents, compare the answers with our own crawler's, and name the layer that refuses a bot, such as a firewall, CDN or host. It is simulated from our servers, so sites that verify crawler IP addresses may treat the real bots differently.",
          },
          {
            id: "geo.snippet-eligibility",
            weight: 8,
            label: "Eligible for AI answers (snippet controls)",
            body: "No nosnippet, very low max-snippet, data-nosnippet around key facts or noarchive. Google says a page must be eligible to show with a snippet to be a supporting link in AI Overviews or AI Mode; being eligible does not mean being shown.",
          },
          {
            id: "geo.review-signals",
            weight: 3,
            label: "Review signals",
            body: "Links to your review profiles, rating markup that matches visible reviews, and testimonials with a named source. The evidence that reviews affect AI answers is mostly vendor-run and correlational, so the weight is low, and we do not read the review sites.",
          },
          { id: "geo.answer-ready", weight: 15, label: "Answer-ready content", body: "Sections open with a short, direct answer, and long pages have a summary and a list or table." },
          { id: "geo.organization-schema", weight: 14, label: "Business schema", body: "The homepage has Organization or LocalBusiness structured data with your name, website address, logo and profile links." },
          { id: "geo.faq", weight: 10, label: "Questions & answers", body: "At least three customer questions are answered on the site." },
          { id: "geo.entity-consistency", weight: 8, label: "Name consistency", body: "Your business name is the same in titles, share tags and schema." },
          { id: "geo.dates", weight: 8, label: "Freshness dates", body: "Content pages show a published or updated date, visibly or in schema." },
          { id: "geo.raw-html-facts", weight: 8, label: "Facts readable without JavaScript", body: "Your core facts are in the HTML a plain fetcher receives, not only in JSON-LD or after scripts run. Sites that are an empty shell until JavaScript runs are flagged." },
          { id: "geo.author", weight: 7, label: "Author signals", body: "Content pages name an author or the business owner, visibly or in schema." },
          { id: "geo.llms-txt", weight: 6, label: "llms.txt", body: "A plain-text guide for AI tools exists at /llms.txt. It is an optional, emerging standard, so it carries little weight." },
          { id: "geo.fact-consistency", weight: 6, label: "Consistent prices & contact details", body: "No crossed-out old prices, hidden prices or phone numbers, and the same phone, address and hours across pages and schema." },
          { id: "geo.content-format", weight: 5, label: "Menus, prices & hours as text", body: "Menus, price lists and opening hours are written as text, not only shown as an image or a PDF." },
          { id: "geo.ai-clarity", weight: 11, label: "AI readability of your business", body: "The score from the AI reading (see the next group). It counts only when the AI reading runs." },
        ],
      },
      {
        id: "ai",
        title: "AI reading",
        intro: "A language model reads the text of the pages we fetched and reports what it understood. Everything it returns is checked by our code before you see it.",
        items: [
          { id: "ai.readback", label: "How it would describe you", body: "Two or three sentences on what the business is, written from your own pages, plus a business type." },
          {
            id: "ai.facts",
            label: "Seven core facts",
            body: "What you do, who it is for, where you are, pricing, how to contact you, proof and what makes you different, each marked clear, vague or missing.",
          },
          { id: "ai.questions", label: "Customer questions", body: "Six to eight questions a customer might ask an AI assistant about you, marked answered, partly answered or not answered, with the page that answers each one." },
          {
            id: "ai.drafts",
            label: "Ready-to-paste drafts",
            body: "A title, meta description, llms.txt, Organization schema and an answer-ready paragraph, built only from facts on your site. Drafts that contain a phone number, email or link not found on your site are dropped.",
          },
        ],
      },
      {
        id: "performance",
        title: "Performance",
        intro: "How fast your page loads on a phone, measured by Google.",
        items: [
          {
            id: "performance.cwv",
            weight: 1,
            label: "Mobile speed (Core Web Vitals)",
            body: "Google PageSpeed Insights' 0 to 100 mobile lab score for the page you entered, with Largest Contentful Paint, layout shift and blocking time explained. It is the only Performance check.",
          },
        ],
      },
    ],
  },
  {
    id: "scores",
    title: "How the scores are calculated",
    body: [
      "Category scores: each check's score is multiplied by its weight, the results are added up and divided by the total weight of the checks that ran, then shown out of 100. A check that could not run (for example, PageSpeed Insights did not answer) is left out of both sides, so it neither helps nor hurts.",
      "Overall score: 45% SEO, 35% GEO and 20% Performance. If Performance data is unavailable, the overall score uses SEO and GEO only, in the same 45 to 35 proportion.",
      "AI readability score: facts count for 60% and questions for 40%. A clear fact scores 1, a vague one 0.5 and a missing one 0; what you do weighs 3, who it is for 2, contact 2, location 1.5 (local businesses only) and pricing, proof and what makes you different 1 each. Questions score 1 if answered, 0.5 if partly answered and 0 if not. The check passes at 80 and warns from 50 to 79. We calculate this number ourselves; the model does not choose it.",
      "When the AI reading does not run, its check is marked unavailable and every other score is exactly what it would have been without it. The simulated crawler test and the missing-page test are also marked unavailable when they run out of time or when your site refuses our own crawler.",
      "Issue order: issues are sorted by severity (critical, high, medium, low), then by how many overall points fixing them could recover.",
    ],
  },
  {
    id: "ai-reading",
    title: "What the AI reading is, and what it is not",
    body: [
      "The AI reading is one model's reading of your pages. We send the text of the pages we fetched (titles, descriptions, headings and visible text, shortened to a fixed length) to an open-weight language model hosted on NVIDIA's API, and ask how an AI model would describe the business from that text alone.",
      "It is not what ChatGPT, Gemini, Perplexity, Claude or Google AI Overviews say about you. Those assistants use their own models, search results and many other sources, and their answers change between runs. We do not query them and we do not track their answers.",
      "It can be wrong. The model can misread a page, miss a fact that is there or rate a vague fact as clear. Page text is treated as data, never as instructions, and we validate every field the model returns, but you should still check each fact and draft before you rely on it or publish it.",
      "It does not replace the rule-based checks. It adds one check, AI readability, worth 11 of the GEO weights, and nothing else in the score depends on it.",
    ],
  },
  {
    id: "limits",
    title: "Known limits",
    body: ["The audit is a guide, not a guarantee. These are the limits we know about."],
    items: [
      { id: "limit.pages", label: "Six pages at most", body: "Problems on pages we did not fetch are not in the report. Slow sites may get fewer pages before the 55-second limit." },
      { id: "limit.javascript", label: "No JavaScript", body: "We read the HTML a plain fetcher receives. Content that only appears after scripts run counts as missing, even though Google and some AI systems do run JavaScript." },
      { id: "limit.files", label: "No PDFs or images", body: "We spot facts that seem to live only in a PDF or an image, but we do not open the PDF or read the image. Some AI systems can read PDFs." },
      { id: "limit.styles", label: "Styles in the page only", body: "Crossed-out and hidden text is detected from the HTML itself, such as strike-through tags and inline styles. Styling from separate stylesheets is not seen." },
      { id: "limit.conflicts", label: "Possible false conflicts", body: "Call-tracking numbers or branch-specific hours can look like conflicting facts when they are intended." },
      {
        id: "limit.crawler-test",
        label: "Simulated crawler test",
        body: "The AI-crawler test is simulated from our servers. Sites that verify crawler IP addresses may treat the real crawler differently, in either direction.",
      },
      { id: "limit.ai", label: "One model, one run", body: "The AI reading can be wrong and can vary between runs. When the model is unavailable or too slow, the audit finishes without it." },
      { id: "limit.speed", label: "Lab speed data", body: "PageSpeed Insights results vary between runs and are sometimes unavailable; we then score without them." },
      { id: "limit.outcomes", label: "No promised outcomes", body: "Scores reflect good practice at the time of the audit. No one can guarantee a ranking or an AI citation." },
    ],
  },
  {
    id: "data-removal",
    title: "Your data, and how to have it removed",
    body: [
      "We keep audit records (the address audited and its results, including any AI reading), report unlock emails and contact messages for up to 24 months, then delete them. Text from audited pages is sent to NVIDIA's hosted model API for the AI reading; visitor emails and contact messages are never sent to it.",
      "To have an audit record, an email or a message deleted sooner, send a request through the contact form with the website address or email it relates to. We act on requests within 30 days. To stop seenhqbot from fetching your internal pages, see the crawler page.",
    ],
    cta: { label: "Request removal", href: "/contact" },
  },
];

export const methodologyFaq: FaqItem[] = [
  {
    q: "Is the AI reading what ChatGPT says about my business?",
    a: "No. The AI reading is one open-weight language model, hosted on NVIDIA's API, reading the text of the pages we fetched from your site. ChatGPT, Gemini, Perplexity and other assistants use their own models and sources, and we do not query them. Use the AI reading to see whether your pages state your key facts clearly, not as a record of what any assistant says.",
  },
  {
    q: "Does the seenhq audit run JavaScript?",
    a: "No. The audit reads the HTML a plain fetcher receives, without running scripts. If your core facts only appear after JavaScript runs, the audit reports them as missing from the raw HTML, because fetchers that do not run JavaScript will not see them either.",
  },
  {
    q: "Does the audit read PDFs and images?",
    a: "No. The audit notices when a menu, price list or opening hours seem to exist only as a PDF or an image, and recommends publishing them as text too. It does not open the PDF or read the image, so it cannot tell you what they say.",
  },
];
