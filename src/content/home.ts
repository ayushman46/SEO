import type { HomeContent } from "./types";

export const home = {
  hero: {
    eyebrow: "SEO + GEO audits for startups and local businesses",
    title: "Be seen by people and by the machines they ask.",
    subtitle:
      "seenhq checks your website for Google and for AI answer engines like ChatGPT, Perplexity and Gemini. Paste your address to get scores, a separate AI model's reading of your pages and a ranked list of fixes, in about a minute.",
    primaryCta: { label: "Run a free audit", href: "/audit" },
    secondaryCta: { label: "See services", href: "/services" },
  },

  proofLine:
    "Checks your site against what search engines and AI answer engines need to find, trust and cite you.",

  problem: {
    kicker: "The shift",
    title: "People still search. More and more, they ask.",
    body: "Many buyers now ask ChatGPT, Perplexity or Google's AI Overviews and get a single written answer instead of ten blue links. If your site is hard for those systems to read, trust or quote, you are left out of the answer, even when your Google rankings look fine.",
    points: [
      {
        icon: "bot",
        title: "AI crawlers get blocked by accident",
        body: "One line in robots.txt or a firewall rule can stop GPTBot, ClaudeBot or PerplexityBot from ever reading your pages.",
      },
      {
        icon: "file",
        title: "Pages don't answer the question",
        body: "Answer engines quote clear, self-contained statements. Vague hero copy and walls of marketing text rarely get cited.",
      },
      {
        icon: "eye",
        title: "Machines can't tell who you are",
        body: "Without consistent names, structured data and an About page, engines struggle to connect your site to your business.",
      },
      {
        icon: "gauge",
        title: "Slow pages lose twice",
        body: "Poor Core Web Vitals hurt rankings and conversions, and slow, script-heavy pages are harder for every crawler to read.",
      },
    ],
  },

  tabs: [
    {
      id: "seo",
      label: "SEO",
      title: "The fundamentals Google still runs on",
      body: "We read your homepage and up to five key pages the way a crawler does, and check the basics that decide whether you get indexed and clicked.",
      bullets: [
        {
          icon: "search",
          title: "Titles and descriptions",
          body: "Present, unique and the right length, so your result reads well on the page.",
        },
        {
          icon: "list",
          title: "Headings and structure",
          body: "One clear H1 per page and a heading order that makes sense.",
        },
        {
          icon: "link",
          title: "Canonicals, robots and sitemap",
          body: "Search engines can find, crawl and index the pages you care about.",
        },
        {
          icon: "shield",
          title: "HTTPS, mobile and language",
          body: "Secure URLs, a mobile viewport and a declared page language.",
        },
      ],
    },
    {
      id: "geo",
      label: "GEO",
      title: "Ready to be read and cited by AI",
      body: "GEO (Generative Engine Optimization) is making your site easy for AI answer engines to read, trust and quote. We check the signals that make a site easier for them to use as a source, and have a language model read your pages to see how clearly they describe you.",
      bullets: [
        {
          icon: "bot",
          title: "AI crawler access",
          body: "Which AI bots your robots.txt allows or blocks, plus a simulated fetch as those bots that names the layer refusing them, such as a firewall or CDN.",
        },
        {
          icon: "sparkles",
          title: "How an AI model reads you",
          body: "A language model reads your pages and reports how it would describe you, which core facts are clear, vague or missing, and which customer questions you answer. It is one model's reading, not what ChatGPT or Gemini say.",
        },
        {
          icon: "eye",
          title: "Facts a crawler can actually see",
          body: "Whether your name, prices, hours and contact details are in the plain HTML, or only appear after JavaScript runs or inside an image or PDF.",
        },
        {
          icon: "list",
          title: "Old, hidden and conflicting facts",
          body: "Crossed-out prices, hidden text, and phone numbers or opening hours that differ from page to page.",
        },
        {
          icon: "file",
          title: "llms.txt and answer-ready content",
          body: "A short plain-text guide for AI tools, plus clear definitions, summaries and FAQs an engine can lift into an answer.",
        },
        {
          icon: "shield",
          title: "Identity and trust signals",
          body: "Structured data that states who you are (Organization or LocalBusiness schema), a consistent name, authors and visible dates.",
        },
      ],
    },
    {
      id: "performance",
      label: "Performance",
      title: "Speed measured with Google's own tool",
      body: "We run Google PageSpeed Insights on the mobile version of your homepage and translate the numbers into plain language.",
      bullets: [
        {
          icon: "gauge",
          title: "Performance score",
          body: "The same 0 to 100 lab score Google reports, on a mobile connection.",
        },
        {
          icon: "clock",
          title: "Largest Contentful Paint",
          body: "How long it takes for the main content to appear on screen.",
        },
        {
          icon: "chart",
          title: "Layout shift and blocking time",
          body: "Whether the page jumps around and how long scripts freeze it.",
        },
      ],
    },
    {
      id: "fixes",
      label: "Fixes",
      title: "A ranked list of what to fix first",
      body: "Every problem comes with why it matters, how to fix it and how much effort it takes, ordered by the points it can recover on your score.",
      bullets: [
        {
          icon: "list",
          title: "Prioritised by impact",
          body: "Critical issues first, each labelled as a quick fix, a moderate job or involved work, so you can plan your week.",
        },
        {
          icon: "file",
          title: "Copy-paste snippets and drafts",
          body: "The exact tag, rule or schema to add, plus AI-drafted titles, llms.txt and schema built only from facts on your site. Review them before you publish.",
        },
        {
          icon: "link",
          title: "Hand-off for your developer",
          body: "Export the list as Markdown tickets, or as one prompt you can give a coding agent.",
        },
        {
          icon: "sparkles",
          title: "Or we do it for you",
          body: "Hand the list to us as a one-time fix sprint if you'd rather not touch the code.",
        },
      ],
    },
  ],

  howItWorks: {
    kicker: "How it works",
    title: "From address to action plan in three steps",
    steps: [
      {
        title: "Paste your website address",
        body: "No setup and no code to install. We fetch only the public pages anyone can see.",
      },
      {
        title: "Get your scores in about a minute",
        body: "An overall score plus separate SEO, GEO and Performance scores, your top three issues, and a short reading of how an AI model describes your business.",
      },
      {
        title: "Unlock the full report with your email",
        body: "Enter your email to see every issue, check and fix, plus ready-to-paste drafts. Export it as developer tickets or one prompt for a coding agent, or ask us to handle it.",
      },
    ],
  },

  sampleReport: {
    kicker: "What you get",
    title: "A report written for people, not just developers",
    body: "Each issue says what is wrong, why it matters for search and AI answers, and exactly how to fix it. Pages, checks, Core Web Vitals and the AI reading are laid out in one place.",
    note: "Illustrative sample report",
  },

  servicesTeaser: {
    kicker: "Services",
    title: "Prefer it done for you?",
    body: "Eight focused services: a Full audit that covers SEO and GEO together, hands-on technical fixes, content and entity work, monthly monitoring, an AI fact-check and fix, local AI visibility setup and AI crawler unblocking. Fixed scope, plain pricing, all done by a person.",
  },

  pricingTeaser: {
    kicker: "Pricing",
    title: "Start free. Pay only when you want more.",
    body: "The audit is free. A full expert audit, a one-time fix sprint and monthly monitoring are priced for small teams and local businesses, not enterprise budgets.",
    cta: { label: "See pricing", href: "/pricing" },
  },

  nightSky: {
    kicker: "After dark",
    title: "The answer is written before anyone visits your site.",
    body: "When someone asks an AI assistant for the best tool, clinic or café near them, the engine has already decided which sources to trust. The free audit shows whether your site gives those engines what they need to read, understand and quote you, and what to change if it doesn't. It checks readiness; it does not track what the engines say about you.",
    cta: { label: "Check my site", href: "/audit" },
  },

  faq: [
    {
      q: "What is GEO (Generative Engine Optimization)?",
      a: "GEO, or Generative Engine Optimization, is the practice of making your website easy for AI answer engines such as ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews to read, trust and cite. It builds on SEO and adds things like allowing AI crawlers, writing answer-ready content and publishing clear structured data about who you are.",
    },
    {
      q: "How is GEO different from SEO?",
      a: "SEO helps your pages rank in a list of search results; GEO helps your content get quoted inside an AI-written answer. Most of the foundations are shared, such as crawlable pages, fast load times and clear titles. GEO adds extra weight on direct answers, a clear and consistent identity for your business, and letting AI crawlers in.",
    },
    {
      q: "What are Google AI Overviews?",
      a: "Google AI Overviews are AI-generated summaries that appear at the top of some Google search results, with links to the sources they draw on. Google decides which sources to link. Pages that are crawlable, well structured and answer the question clearly are easier to use as a source, and that is what our GEO checks look at.",
    },
    {
      q: "What is llms.txt?",
      a: "llms.txt is a plain-text file at the root of a website, for example example.com/llms.txt, that gives AI tools a short summary of the site and links to its most useful pages. It is a proposed standard described at llmstxt.org. It is not required, but it is quick to add and makes your site easier for language models to understand.",
    },
    {
      q: "What does the free seenhq audit check?",
      a: "The free audit checks your homepage and up to five internal pages for SEO basics, GEO readiness and mobile performance. That includes titles, headings, canonicals, robots.txt, sitemap, structured data, AI crawler access, llms.txt, answer-ready content and Google PageSpeed Insights results. It also flags key facts that exist only in images, PDFs or JavaScript, crossed-out or conflicting prices, phone numbers and hours, snippet settings that keep pages out of AI Overviews, missing pages that don't return 404, Bing readiness and review signals, and it runs a simulated AI-crawler test. It usually finishes in about a minute.",
    },
    {
      q: "Does the audit use AI?",
      a: "Yes, for one part. Most checks are fixed rules that read your HTML, robots.txt and sitemap. The AI reading is separate: an open-weight language model hosted on NVIDIA's API reads the text of the pages we fetch and reports how an AI model would describe your business, which of seven core facts are clear, vague or missing, and which customer questions you answer. It also drafts a title, meta description, llms.txt, Organization schema and an answer-ready paragraph, using only facts from your site. It is one model's reading of your pages, not what ChatGPT, Gemini or Perplexity say about you, and it can be wrong, so review every draft before you use it.",
    },
    {
      q: "Why do you ask for my email to see the full report?",
      a: "Your scores and top three issues are free with no strings. To see every issue and fix, we ask for your email and for your agreement that we may store it with the report and contact you about it. You can ask us to delete it at any time. No password, no card and nothing to install.",
    },
    {
      q: "Is seenhq useful for a local business, not just a startup?",
      a: "Yes. Local businesses are increasingly recommended by AI assistants when someone asks for a nearby service. We check LocalBusiness schema, a consistent business name and the basics that help both Google and AI engines connect your website to your real-world location.",
    },
    {
      q: "What if an AI assistant says something wrong about my business?",
      a: "Fix the sources it learns from, because you cannot edit an AI answer directly. Assistants such as ChatGPT, Gemini and Google AI Overviews build answers from your website, your business profiles and other pages about you, so a wrong phone number, an old price or a \"permanently closed\" label usually traces back to a page somewhere. Correct the facts on your own site and profiles first, then ask other sites to fix theirs and use each assistant's feedback button. Our AI fact-check & fix service does this for you and re-tests after 30 days. Nobody can control what an AI says, and answers vary between runs, so we report what changed rather than promise a result.",
    },
    {
      q: "Can you guarantee rankings or AI citations?",
      a: "No. Nobody controls what Google or an AI engine chooses to show, and anyone who promises a specific ranking or citation is guessing. What we can do is remove the problems that stop you being considered and make your site clear enough to be a strong candidate.",
    },
  ],

  finalCta: {
    title: "See how your site looks to search and AI.",
    body: "Free, about a minute, no setup. Just your website address.",
    cta: { label: "Run a free audit", href: "/audit" },
  },
} satisfies HomeContent;

/** Home page meta. The title is used as-is (no " · seenhq" suffix), so it carries the brand itself. */
export const homeMeta = {
  metaTitle: "seenhq: SEO and GEO audits for Google and AI search",
  metaDescription:
    "Free SEO and GEO audit for startups and local businesses. Check what Google and AI answer engines need from your site, and get a ranked list of fixes.",
};

/** Meta for /sample-report (an illustrative report, built by frontend from sample data). */
export const sampleReportMeta = {
  metaTitle: "Sample audit report: see every check and fix",
  metaDescription:
    "An illustrative seenhq audit report: SEO, GEO and speed scores, the AI reading, every check with its fix, and the export for your developer.",
};
