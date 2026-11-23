import type { HomeContent } from "./types";

export const home = {
  hero: {
    eyebrow: "SEO + GEO audits for startups and local businesses",
    title: "Be seen by people and by the machines they ask.",
    subtitle:
      "Paste your website address. In about a minute you get scores and a ranked list of what stops Google and AI answer engines like ChatGPT and Perplexity from reading and quoting your site, with the fix for each.",
    primaryCta: { label: "Run a free audit", href: "/audit" },
    secondaryCta: { label: "See services", href: "/services" },
  },

  proofLine:
    "Reads up to six public pages, plus the robots.txt, sitemap and llms.txt files crawlers use.",

  problem: {
    kicker: "Problem",
    title: "People still search. More and more, they ask.",
    body: "Many buyers now ask ChatGPT, Perplexity or Google's AI Overviews and get one written answer instead of a list of links. If those systems can't read or quote your site, you are not in the answer, however well you rank on Google. In BrightLocal's October 2026 survey of 1,002 US local business owners, 46% had not checked or did not know whether they appear in AI results.",
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
      title: "What Google needs to index you",
      body: "We read your homepage and up to five key pages the way a crawler does, and check the basics that decide whether you get indexed and clicked.",
      bullets: [
        {
          icon: "search",
          title: "Titles and descriptions",
          body: "Present, unique and short enough not to be cut off in results.",
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
      body: "GEO (Generative Engine Optimization) means making your site easy for AI answer engines to read and quote. We check what gets in their way.",
      bullets: [
        {
          icon: "bot",
          title: "AI crawler access",
          body: "Which AI bots your robots.txt allows or blocks, plus a simulated fetch as those bots that names the layer refusing them, such as a firewall or CDN.",
        },
        {
          icon: "sparkles",
          title: "How an AI model reads you",
          body: "A language model reads your pages and reports which core facts are clear, vague or missing and which customer questions you answer. One model's reading, not what ChatGPT or Gemini say.",
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
          title: "Who you are",
          body: "Structured data that names your business, the same name everywhere, named authors and visible dates.",
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
          body: "Critical issues first, each labelled quick, moderate or involved.",
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
    title: "Three steps, about a minute",
    steps: [
      {
        title: "Paste your website address",
        body: "Nothing to install. We read only public pages.",
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
    title: "A report a business owner can read",
    body: "Each issue says what is wrong, why it matters and how to fix it.",
    note: "Illustrative sample report",
  },

  servicesTeaser: {
    kicker: "Services",
    title: "We can fix it for you",
    body: "Eight services, each with a fixed scope and a price shown up front, each done by a person. Before/after proof: we re-run the audit after the work and send you what changed.",
  },

  pricingTeaser: {
    kicker: "Pricing",
    title: "Free audit. Paid work is quoted first.",
    body: "A person-reviewed Full audit, a one-time fix sprint and monthly monitoring. Fixed prices. No contract, no minimum term, no exit fee.",
    cta: { label: "See pricing", href: "/pricing" },
  },

  nightSky: {
    kicker: "AI search",
    title: "The answer is written before anyone visits your site.",
    body: "When someone asks an AI assistant for the best clinic or café nearby, it has already chosen its sources. The free audit checks whether those engines can read and quote your site, and lists what to change if they can't.",
    cta: { label: "Check my site", href: "/audit" },
  },

  faq: [
    {
      q: "What is GEO (Generative Engine Optimization)?",
      a: "GEO, or Generative Engine Optimization, is making your website easy for AI answer engines such as ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews to read and quote. SEO gets a page ranked in a list of results; GEO gets its content quoted inside an AI-written answer. The foundations are shared, and GEO adds direct answers, one consistent description of your business and letting AI crawlers in.",
    },
    {
      q: "What are Google AI Overviews?",
      a: "Google AI Overviews are AI-generated summaries that appear at the top of some Google search results, with links to the sources they draw on. Google decides which sources to link. Pages that are crawlable, well structured and answer the question clearly are easier to use as a source, and that is what our GEO checks look at.",
    },
    {
      q: "What is llms.txt?",
      a: "llms.txt is a plain-text file at the root of a website, for example example.com/llms.txt, that gives AI tools a short summary of the site and links to its most useful pages. It is a proposed standard described at llmstxt.org. It is optional and quick to add.",
    },
    {
      q: "What does the free seenhq audit check?",
      a: "Your homepage and up to five more pages. It checks whether Google and AI crawlers can reach and read them, whether your name, prices, hours and contact details are in plain text and agree from page to page, and how fast the page loads on a phone. It also runs a simulated AI-crawler test. Every check and its weight is on the methodology page.",
    },
    {
      q: "Does the audit use AI?",
      a: "Yes, for one part. Most checks are fixed rules. Separately, an open-weight language model hosted on NVIDIA's API reads your page text, reports which basic facts about your business are clear, vague or missing, and drafts fixes from facts already on your site. It is one model's reading, not what ChatGPT, Gemini or Perplexity say about you, and it can be wrong, so check every draft before you publish it.",
    },
    {
      q: "Why do you ask for my email to see the full report?",
      a: "Because we may contact you about the report, and we store your email with it. Scores and your top three issues need no email, and you can ask us to delete yours at any time.",
    },
    {
      q: "What if an AI assistant says something wrong about my business?",
      a: "You cannot edit an AI answer, so fix what it reads. A wrong phone number, an old price or a \"permanently closed\" label usually traces back to your site, a business profile or a directory. Correct your own site and profiles first, then ask the other sites to fix theirs. Our AI fact-check & fix service does this and re-tests after 30 days. Answers vary between runs, so we cannot promise a result.",
    },
    {
      q: "Can you guarantee rankings or AI citations?",
      a: "No. Nobody controls what Google or an AI engine shows. We remove what stops your site being read and quoted.",
    },
  ],

  finalCta: {
    title: "See how your site looks to search and AI.",
    body: "Free. Takes about a minute.",
    cta: { label: "Run a free audit", href: "/audit" },
  },
} satisfies HomeContent;

/**
 * Source of the one statistic on the home page (named in home.problem.body). Optional for the UI:
 * render it as a small "Source" link under the problem paragraph if there is room.
 */
export const homeProblemSource = {
  label: "BrightLocal, October 2026",
  href: "https://www.brightlocal.com/research/smb-report-confident-visibility/",
} as const;

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
