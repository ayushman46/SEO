import type { HomeContent } from "./types";

export const home = {
  hero: {
    eyebrow: "SEO + GEO audits for startups and local businesses",
    title: "Be seen by people and by the machines they ask.",
    subtitle:
      "seenhq checks your website for Google and for AI answer engines like ChatGPT, Perplexity and Gemini. Paste your address, get a scored report in about a minute, and fix what holds you back.",
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
      body: "GEO (Generative Engine Optimization) is making your site easy for AI answer engines to read, trust and quote. We check the signals those engines rely on.",
      bullets: [
        {
          icon: "bot",
          title: "AI crawler access",
          body: "Which AI bots your robots.txt allows or blocks, from GPTBot to Google-Extended.",
        },
        {
          icon: "file",
          title: "llms.txt",
          body: "Whether you offer AI tools a short, plain-text guide to your most important pages.",
        },
        {
          icon: "sparkles",
          title: "Answer-ready content",
          body: "Clear definitions, short summaries, FAQs and lists that an engine can lift into an answer.",
        },
        {
          icon: "eye",
          title: "Entity and trust signals",
          body: "Organization or LocalBusiness schema, a consistent name, authors and visible dates.",
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
          body: "Critical issues first, then the fixes that move your score the most.",
        },
        {
          icon: "clock",
          title: "Effort labelled",
          body: "Quick wins, moderate jobs and involved work, so you can plan your week.",
        },
        {
          icon: "file",
          title: "Copy-paste snippets",
          body: "Where it helps, the exact tag, rule or schema to add.",
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
        body: "An overall score plus separate SEO, GEO and Performance scores, with your top three issues shown straight away.",
      },
      {
        title: "Unlock the full report with your email",
        body: "Enter your email to see every issue, every check and every fix. Work through it yourself, or ask us to handle it.",
      },
    ],
  },

  sampleReport: {
    kicker: "What you get",
    title: "A report written for people, not just developers",
    body: "Each issue says what is wrong, why it matters for search and AI answers, and exactly how to fix it. Pages, checks and Core Web Vitals are all laid out in one place.",
    note: "Illustrative sample report",
  },

  servicesTeaser: {
    kicker: "Services",
    title: "Prefer it done for you?",
    body: "Five focused services, from a deeper SEO or GEO audit to hands-on technical fixes, content and entity work, and monthly monitoring. Fixed scope, plain pricing.",
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
    body: "When someone asks an AI assistant for the best tool, clinic or café near them, the engine has already decided which sources to trust. seenhq shows you whether yours is one of them, and what to change if it isn't.",
    cta: { label: "Check my site", href: "/audit" },
  },

  faq: [
    {
      q: "What is GEO (Generative Engine Optimization)?",
      a: "GEO, or Generative Engine Optimization, is the practice of making your website easy for AI answer engines such as ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews to read, trust and cite. It builds on SEO and adds things like allowing AI crawlers, writing answer-ready content and publishing clear structured data about who you are.",
    },
    {
      q: "How is GEO different from SEO?",
      a: "SEO helps your pages rank in a list of search results; GEO helps your content get quoted inside an AI-written answer. Most of the foundations are shared, such as crawlable pages, fast load times and clear titles. GEO adds extra weight on direct answers, entity clarity and letting AI crawlers in.",
    },
    {
      q: "What are Google AI Overviews?",
      a: "Google AI Overviews are AI-generated summaries that appear at the top of some Google search results, with links to the sources they draw on. Being one of those linked sources depends on the same signals our GEO checks look at: crawlable, well-structured pages that answer the question clearly.",
    },
    {
      q: "What is llms.txt?",
      a: "llms.txt is a plain-text file at the root of a website, for example example.com/llms.txt, that gives AI tools a short summary of the site and links to its most useful pages. It is a proposed standard described at llmstxt.org. It is not required, but it is quick to add and makes your site easier for language models to understand.",
    },
    {
      q: "What does the free seenhq audit check?",
      a: "The free audit checks your homepage and up to five internal pages for SEO basics, GEO readiness and mobile performance. That includes titles, headings, canonicals, robots.txt, sitemap, structured data, AI crawler access, llms.txt, answer-ready content and Google PageSpeed Insights results. It usually finishes in about a minute.",
    },
    {
      q: "Why do you ask for my email to see the full report?",
      a: "Your scores and top three issues are free with no strings. To see every issue and fix, we ask for your email. We use it to keep a record of your report and, only if you agree, to follow up about it. No password, no card and nothing to install.",
    },
    {
      q: "Is seenhq useful for a local business, not just a startup?",
      a: "Yes. Local businesses are increasingly recommended by AI assistants when someone asks for a nearby service. We check LocalBusiness schema, a consistent business name and the basics that help both Google and AI engines connect your website to your real-world location.",
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
    "Free SEO and GEO audit for startups and local businesses. See how Google, ChatGPT, Perplexity and AI Overviews read your site, and fix what holds you back.",
};
