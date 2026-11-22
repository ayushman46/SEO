/**
 * Issue copy catalog. Every non-passing check maps to one or more entries here.
 * Copy rules: plain English a local business owner can follow, one concrete fix,
 * a short snippet in backticks where it helps. Keys are the public issue ids.
 */
import type { Category, Effort, Severity } from "./types";

export interface IssueCopy {
  checkId: string;
  category: Category;
  severity: Severity;
  effort: Effort;
  title: string;
  /** why it matters, 1–2 sentences */
  description: string;
  howToFix: string;
}

const CMS_HINT =
  "On WordPress this lives in your SEO plugin (Yoast, Rank Math); on Wix, Squarespace and Shopify it's in each page's SEO settings.";

export const ISSUE_CATALOG = {
  // ───────────────────────────── SEO ─────────────────────────────
  "seo.title:missing": {
    checkId: "seo.title",
    category: "seo",
    severity: "high",
    effort: "quick",
    title: "Pages are missing a title",
    description:
      "The title is the blue headline people click in Google results. Without one, search engines make one up, and it's usually worse.",
    howToFix: `Give every page a unique title of 30–60 characters, e.g. \`<title>Emergency Plumber in Leeds | Smith & Sons</title>\`. ${CMS_HINT}`,
  },
  "seo.title:length": {
    checkId: "seo.title",
    category: "seo",
    severity: "low",
    effort: "quick",
    title: "Page titles are too short or too long",
    description:
      "Titles under 30 characters waste space you could use to say what you do; titles over 60 get cut off with \"…\" in search results.",
    howToFix:
      "Rewrite each title to 30–60 characters: main service or topic first, then your brand, e.g. `Teeth Whitening in Austin | BrightSmile Dental`.",
  },
  "seo.title:duplicate": {
    checkId: "seo.title",
    category: "seo",
    severity: "medium",
    effort: "quick",
    title: "Several pages share the same title",
    description:
      "When pages have identical titles, Google can't tell which one to show and they end up competing with each other.",
    howToFix:
      "Make each title describe that specific page, e.g. `Pricing | Acme` and `About us | Acme` instead of `Acme` everywhere.",
  },
  "seo.meta-description:missing": {
    checkId: "seo.meta-description",
    category: "seo",
    severity: "medium",
    effort: "quick",
    title: "Pages are missing a meta description",
    description:
      "The meta description is the short text under your link in search results. A good one gets more people to click.",
    howToFix: `Add a 70–160 character summary to each page, e.g. \`<meta name="description" content="Family-run bakery in Bristol baking sourdough daily. Order online for next-day pickup.">\`. ${CMS_HINT}`,
  },
  "seo.meta-description:length": {
    checkId: "seo.meta-description",
    category: "seo",
    severity: "low",
    effort: "quick",
    title: "Meta descriptions are too short or too long",
    description:
      "Very short descriptions don't sell the click; long ones get cut off in search results.",
    howToFix:
      "Aim for 70–160 characters: say what the page offers and give a reason to click (price, location, free quote, etc.).",
  },
  "seo.meta-description:duplicate": {
    checkId: "seo.meta-description",
    category: "seo",
    severity: "low",
    effort: "quick",
    title: "Several pages share the same meta description",
    description:
      "Copy-pasted descriptions make your pages look interchangeable in search results, so Google often ignores them.",
    howToFix: "Write a separate description for each page that summarises what's on that specific page.",
  },
  "seo.headings:missing-h1": {
    checkId: "seo.headings",
    category: "seo",
    severity: "medium",
    effort: "quick",
    title: "Pages have no main heading (H1)",
    description:
      "The H1 is the main headline of a page. Search engines and AI assistants use it to understand what the page is about.",
    howToFix:
      "Add exactly one H1 near the top of each page that says what the page is about, e.g. `<h1>Wedding Photography in Denver</h1>`. In most site builders, set the top headline's style to \"Heading 1\".",
  },
  "seo.headings:multiple-h1": {
    checkId: "seo.headings",
    category: "seo",
    severity: "low",
    effort: "quick",
    title: "Pages have more than one H1 heading",
    description: "Several H1s blur which headline is the main topic of the page.",
    howToFix:
      "Keep one H1 for the page's main topic and change the others to H2 (section headings) in your editor.",
  },
  "seo.headings:skipped-levels": {
    checkId: "seo.headings",
    category: "seo",
    severity: "low",
    effort: "quick",
    title: "Heading levels skip steps",
    description:
      "Jumping from H2 straight to H4 breaks the outline that search engines, AI tools and screen readers use to follow your content.",
    howToFix:
      "Use headings in order: H1 for the page title, H2 for sections, H3 for sub-sections. Pick heading levels for structure, not for font size.",
  },
  "seo.canonical:missing": {
    checkId: "seo.canonical",
    category: "seo",
    severity: "medium",
    effort: "quick",
    title: "Pages don't declare a canonical URL",
    description:
      "A canonical tag tells Google which address is the \"real\" one when the same page is reachable in several ways (with tracking codes, www vs non-www, etc.).",
    howToFix:
      "Add a self-referencing canonical in each page's `<head>`, e.g. `<link rel=\"canonical\" href=\"https://www.example.com/services/\">`. Most SEO plugins and site builders do this automatically once enabled.",
  },
  "seo.canonical:relative": {
    checkId: "seo.canonical",
    category: "seo",
    severity: "low",
    effort: "quick",
    title: "Canonical URLs are relative",
    description: "Relative canonicals (\"/page\") are easy for crawlers to misread. Full addresses are safer.",
    howToFix: "Use the full address including https:// and your domain, e.g. `<link rel=\"canonical\" href=\"https://example.com/page\">`.",
  },
  "seo.canonical:other-host": {
    checkId: "seo.canonical",
    category: "seo",
    severity: "high",
    effort: "quick",
    title: "Canonical tags point to a different website",
    description:
      "This tells Google the real version of your page lives on another domain, so your page may be dropped from results.",
    howToFix:
      "Point each canonical at the page's own address on your domain. This often happens after copying a template or moving domains; check your SEO plugin or theme settings.",
  },
  "seo.canonical:multiple": {
    checkId: "seo.canonical",
    category: "seo",
    severity: "medium",
    effort: "quick",
    title: "Pages have conflicting canonical tags",
    description: "When a page lists several different canonicals, Google ignores all of them.",
    howToFix:
      "Keep exactly one `<link rel=\"canonical\">` per page. Two plugins (e.g. a theme and an SEO plugin) both adding one is the usual cause; turn one off.",
  },
  "seo.indexability:noindex": {
    checkId: "seo.indexability",
    category: "seo",
    severity: "high",
    effort: "quick",
    title: "Pages are hidden from Google (noindex)",
    description:
      "These pages tell search engines not to list them, so they cannot appear in Google or in AI answers that rely on search.",
    howToFix:
      "Remove `<meta name=\"robots\" content=\"noindex\">` (or the `X-Robots-Tag: noindex` header). On WordPress, untick Settings → Reading → \"Discourage search engines\"; in Wix/Squarespace, turn on \"Show in search results\" for the page.",
  },
  "seo.indexability:bad-status": {
    checkId: "seo.indexability",
    category: "seo",
    severity: "high",
    effort: "moderate",
    title: "Pages return an error instead of loading",
    description: "Pages that answer with an error code (like 404 or 500) are dropped from search results.",
    howToFix:
      "Fix or restore these pages, or redirect them (301) to the closest working page. Then update any links that point to them.",
  },
  "seo.robots-txt:missing": {
    checkId: "seo.robots-txt",
    category: "seo",
    severity: "low",
    effort: "quick",
    title: "No robots.txt file",
    description:
      "robots.txt is a small file that tells search engines and AI crawlers what they may visit and where your sitemap is. It's a basic signal of a well-kept site.",
    howToFix:
      "Create `/robots.txt` with: `User-agent: *` / `Allow: /` / `Sitemap: https://yourdomain.com/sitemap.xml`. Most CMSs and SEO plugins can generate it for you.",
  },
  "seo.robots-txt:blocks-all": {
    checkId: "seo.robots-txt",
    category: "seo",
    severity: "critical",
    effort: "quick",
    title: "robots.txt blocks search engines from your whole site",
    description:
      "Your robots.txt tells every crawler to stay away (`Disallow: /`), so Google can't read your pages. This is often left over from when the site was being built.",
    howToFix:
      "Edit `/robots.txt` and change `Disallow: /` to `Allow: /` under `User-agent: *` (or delete that line). On WordPress, untick \"Discourage search engines\" in Settings → Reading.",
  },
  "seo.robots-txt:unreadable": {
    checkId: "seo.robots-txt",
    category: "seo",
    severity: "medium",
    effort: "moderate",
    title: "robots.txt couldn't be read",
    description:
      "Your robots.txt returned an error. When Google can't read it, it may pause crawling your site.",
    howToFix:
      "Make sure `https://yourdomain.com/robots.txt` loads as a plain text file with a 200 status. Ask your host or developer if it returns a server error.",
  },
  "seo.sitemap:missing": {
    checkId: "seo.sitemap",
    category: "seo",
    severity: "medium",
    effort: "quick",
    title: "No XML sitemap found",
    description:
      "A sitemap is a list of your pages that helps Google and Bing find new and updated content faster.",
    howToFix:
      "Generate a sitemap at `/sitemap.xml` (WordPress SEO plugins, Wix, Squarespace and Shopify create one automatically), add `Sitemap: https://yourdomain.com/sitemap.xml` to robots.txt, and submit it in Google Search Console.",
  },
  "seo.sitemap:invalid": {
    checkId: "seo.sitemap",
    category: "seo",
    severity: "medium",
    effort: "moderate",
    title: "Your sitemap isn't valid XML",
    description: "Search engines can't read a broken sitemap, so it doesn't help them find your pages.",
    howToFix:
      "Make sure the sitemap starts with `<urlset>` (or `<sitemapindex>`) and lists pages in `<loc>` tags. Regenerating it with your CMS or SEO plugin usually fixes this.",
  },
  "seo.sitemap:empty": {
    checkId: "seo.sitemap",
    category: "seo",
    severity: "medium",
    effort: "quick",
    title: "Your sitemap lists no pages",
    description: "An empty sitemap gives search engines nothing to work with.",
    howToFix: "Regenerate the sitemap so it lists every public page in `<loc>` tags, then resubmit it in Google Search Console.",
  },
  "seo.image-alt:missing": {
    checkId: "seo.image-alt",
    category: "seo",
    severity: "medium",
    effort: "moderate",
    title: "Images are missing alt text",
    description:
      "Alt text describes an image for Google Images, AI tools and people using screen readers. Without it, your images are invisible to them.",
    howToFix:
      "Add a short description to each meaningful image, e.g. `<img src=\"cake.jpg\" alt=\"Three-tier lemon wedding cake\">`. For purely decorative images use `alt=\"\"`. Site builders have an \"Alt text\" field in each image's settings.",
  },
  "seo.structured-data:missing": {
    checkId: "seo.structured-data",
    category: "seo",
    severity: "medium",
    effort: "moderate",
    title: "No structured data (schema) found",
    description:
      "Structured data is a machine-readable summary of your business and pages. It powers rich results in Google and helps AI assistants describe you correctly.",
    howToFix:
      "Add JSON-LD to your homepage, e.g. `<script type=\"application/ld+json\">{\"@context\":\"https://schema.org\",\"@type\":\"LocalBusiness\",\"name\":\"…\",\"url\":\"…\"}</script>`. SEO plugins like Yoast or Rank Math can add this for you.",
  },
  "seo.structured-data:invalid-json": {
    checkId: "seo.structured-data",
    category: "seo",
    severity: "high",
    effort: "moderate",
    title: "Structured data has syntax errors",
    description: "Broken JSON-LD is ignored completely, so none of its information reaches Google or AI tools.",
    howToFix:
      "Paste the page URL into Google's Rich Results Test (search.google.com/test/rich-results) to see the exact error, then fix the missing comma, quote or bracket.",
  },
  "seo.structured-data:no-type": {
    checkId: "seo.structured-data",
    category: "seo",
    severity: "medium",
    effort: "quick",
    title: "Structured data is missing an @type",
    description: "Without an `@type`, search engines don't know what the data describes.",
    howToFix: "Add an `\"@type\"` to each JSON-LD block, e.g. `\"@type\": \"Organization\"` or `\"@type\": \"Product\"`.",
  },
  "seo.open-graph:incomplete": {
    checkId: "seo.open-graph",
    category: "seo",
    severity: "low",
    effort: "quick",
    title: "Social sharing previews are incomplete",
    description:
      "Open Graph tags control the title, text and image shown when your link is shared on Facebook, LinkedIn, WhatsApp or Slack. Missing tags mean plain or random previews.",
    howToFix:
      "Add to each page's `<head>`: `<meta property=\"og:title\" content=\"…\">`, `<meta property=\"og:description\" content=\"…\">` and `<meta property=\"og:image\" content=\"https://…/share.jpg\">` (1200×630 px works well). Most SEO plugins have a \"Social\" tab for this.",
  },
  "seo.https:not-https": {
    checkId: "seo.https",
    category: "seo",
    severity: "critical",
    effort: "moderate",
    title: "Your site isn't served over HTTPS",
    description:
      "Browsers show \"Not secure\" next to your address, which scares visitors away, and Google prefers secure sites.",
    howToFix:
      "Turn on a free SSL certificate in your hosting dashboard (most hosts offer Let's Encrypt in one click), then redirect all http:// traffic to https://.",
  },
  "seo.https:no-redirect": {
    checkId: "seo.https",
    category: "seo",
    severity: "medium",
    effort: "quick",
    title: "The http:// version of your site doesn't redirect to https://",
    description:
      "Visitors and links using http:// land on an insecure copy of your site, and search engines may see two versions of every page.",
    howToFix:
      "Add a permanent (301) redirect from http:// to https://. Most hosts and CDNs (e.g. Cloudflare's \"Always Use HTTPS\") have a single switch for this.",
  },
  "seo.viewport:missing": {
    checkId: "seo.viewport",
    category: "seo",
    severity: "high",
    effort: "quick",
    title: "Pages aren't set up for mobile screens",
    description:
      "Without a viewport tag, phones show a tiny zoomed-out desktop page. Google ranks the mobile version of your site.",
    howToFix: "Add this to every page's `<head>`: `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`.",
  },
  "seo.lang:missing": {
    checkId: "seo.lang",
    category: "seo",
    severity: "low",
    effort: "quick",
    title: "Page language isn't declared",
    description:
      "The `lang` attribute tells search engines, translators and screen readers which language your page is in.",
    howToFix: "Set the language on the `<html>` tag, e.g. `<html lang=\"en\">` (or `en-GB`, `es`, …). In most CMSs this follows the site language setting.",
  },

  // ───────────────────────────── GEO ─────────────────────────────
  "geo.ai-crawlers:search-blocked": {
    checkId: "geo.ai-crawlers",
    category: "geo",
    severity: "high",
    effort: "quick",
    title: "AI search assistants are blocked from your site",
    description:
      "Your robots.txt blocks the bots that ChatGPT search, Perplexity or Claude use to look up live answers, so they can't read or recommend your pages.",
    howToFix:
      "In `/robots.txt`, remove the `Disallow: /` lines for these bots, or allow them explicitly, e.g. `User-agent: OAI-SearchBot` / `Allow: /`. If a security plugin or CDN bot setting added the block, switch it off there.",
  },
  "geo.ai-crawlers:training-blocked": {
    checkId: "geo.ai-crawlers",
    category: "geo",
    severity: "low",
    effort: "quick",
    title: "AI training crawlers are blocked",
    description:
      "Blocking AI training bots is a legitimate choice, but it means future AI models learn less about your business. If you did this on purpose, you can ignore this.",
    howToFix:
      "If you want AI models to know your business, remove the `Disallow: /` rules for these bots in `/robots.txt`. Keep the block if you prefer not to share content for training.",
  },
  "geo.llms-txt:missing": {
    checkId: "geo.llms-txt",
    category: "geo",
    severity: "low",
    effort: "quick",
    title: "No llms.txt file",
    description:
      "llms.txt is an emerging, optional standard: a short plain-text guide to your site written for AI tools. It's cheap to add and helps AI assistants find your key pages.",
    howToFix:
      "Create `/llms.txt` starting with `# Your Business Name`, a one-line summary in `> quotes`, then a list of your most important pages as `- [Page name](https://…): what it covers`.",
  },
  "geo.llms-txt:invalid-format": {
    checkId: "geo.llms-txt",
    category: "geo",
    severity: "low",
    effort: "quick",
    title: "llms.txt doesn't follow the expected format",
    description: "AI tools expect llms.txt to start with a `# Title` line, followed by a summary and links.",
    howToFix:
      "Make the first line `# Your Business Name`, then a `> one-sentence summary`, then a bullet list of key pages in Markdown link format.",
  },
  "geo.organization-schema:missing": {
    checkId: "geo.organization-schema",
    category: "geo",
    severity: "high",
    effort: "moderate",
    title: "Your business isn't described in machine-readable form",
    description:
      "Organization or LocalBusiness schema tells Google and AI assistants your official name, website, logo and profiles, so they describe and cite you accurately.",
    howToFix:
      "Add JSON-LD to your homepage: `{\"@context\":\"https://schema.org\",\"@type\":\"LocalBusiness\",\"name\":\"Your Business\",\"url\":\"https://yourdomain.com\",\"logo\":\"https://yourdomain.com/logo.png\",\"sameAs\":[\"https://www.facebook.com/…\",\"https://www.linkedin.com/company/…\"]}`. Use `Organization` if you have no physical location.",
  },
  "geo.organization-schema:incomplete": {
    checkId: "geo.organization-schema",
    category: "geo",
    severity: "medium",
    effort: "quick",
    title: "Your business schema is missing key details",
    description:
      "AI assistants match your business across the web using its name, website, logo and social profiles. Missing fields make that harder.",
    howToFix:
      "Fill in `name`, `url`, and `logo` and/or `sameAs` (links to your Google Business Profile, Facebook, LinkedIn, Instagram, etc.) in your Organization/LocalBusiness JSON-LD.",
  },
  "geo.faq:missing": {
    checkId: "geo.faq",
    category: "geo",
    severity: "medium",
    effort: "moderate",
    title: "No questions and answers on your site",
    description:
      "People ask AI assistants questions. Pages that answer common customer questions directly are far more likely to be quoted.",
    howToFix:
      "Add an FAQ section with 5–8 real customer questions as headings (e.g. `<h2>How much does a boiler service cost?</h2>`) each followed by a short, direct answer. Mark it up with `FAQPage` schema if your plugin supports it.",
  },
  "geo.faq:few": {
    checkId: "geo.faq",
    category: "geo",
    severity: "low",
    effort: "moderate",
    title: "Only a few questions are answered on your site",
    description: "A handful of Q&As is a start; more coverage of real customer questions gives AI assistants more to quote.",
    howToFix:
      "Expand to at least 3–5 question-style headings with direct answers, or add an FAQ page with `FAQPage` schema.",
  },
  "geo.author:missing": {
    checkId: "geo.author",
    category: "geo",
    severity: "low",
    effort: "quick",
    title: "No author or owner information found",
    description:
      "AI assistants and Google favour content from identifiable people. Showing who wrote or stands behind your content builds trust.",
    howToFix:
      "Add a byline to articles and key pages (e.g. \"By Jane Smith, Head Chef\"), link it to an About page, and add `<meta name=\"author\" content=\"Jane Smith\">` or an `author` in your Article schema.",
  },
  "geo.dates:missing": {
    checkId: "geo.dates",
    category: "geo",
    severity: "medium",
    effort: "quick",
    title: "Pages don't show when they were published or updated",
    description:
      "AI assistants prefer fresh, dated information. Without dates they can't tell whether your prices, hours or advice are current.",
    howToFix:
      "Show a \"Last updated\" date on key pages using `<time datetime=\"2026-01-15\">15 Jan 2026</time>`, and add `datePublished` / `dateModified` to your Article or WebPage schema.",
  },
  "geo.answer-ready:no-answer-blocks": {
    checkId: "geo.answer-ready",
    category: "geo",
    severity: "medium",
    effort: "moderate",
    title: "Content isn't written in quotable, answer-first blocks",
    description:
      "AI assistants lift short, self-contained answers. Sections that start with a clear 1–3 sentence answer (20–60 words) right under the heading are much easier to quote.",
    howToFix:
      "Under each main heading, start with a direct answer before the detail, e.g. under \"What is a root canal?\" write a 2-sentence plain explanation first, then expand below.",
  },
  "geo.answer-ready:no-summary": {
    checkId: "geo.answer-ready",
    category: "geo",
    severity: "low",
    effort: "quick",
    title: "No summary or key takeaways",
    description: "A short summary at the top of long pages gives AI tools (and busy readers) the main points at a glance.",
    howToFix: "Add a \"Key takeaways\" or \"Summary\" box with 3–5 bullet points near the top of your longer pages.",
  },
  "geo.answer-ready:no-lists": {
    checkId: "geo.answer-ready",
    category: "geo",
    severity: "low",
    effort: "quick",
    title: "No lists or tables in your content",
    description:
      "Bulleted lists, steps and comparison tables are easy for AI assistants to extract and present as answers.",
    howToFix:
      "Turn services, prices, opening hours, steps or comparisons into bullet lists or simple tables instead of long paragraphs.",
  },
  "geo.entity-consistency:inconsistent": {
    checkId: "geo.entity-consistency",
    category: "geo",
    severity: "medium",
    effort: "quick",
    title: "Your business name is written differently in different places",
    description:
      "When your title, social tags and schema use different names, AI assistants may treat them as different businesses.",
    howToFix:
      "Pick one official name and use it everywhere: in your page titles, `<meta property=\"og:site_name\">`, Organization/LocalBusiness schema `name`, and your Google Business Profile.",
  },
  "geo.entity-consistency:not-declared": {
    checkId: "geo.entity-consistency",
    category: "geo",
    severity: "low",
    effort: "quick",
    title: "Your business name isn't clearly declared",
    description:
      "We couldn't find your business name in at least two machine-readable places, so AI tools have to guess it.",
    howToFix:
      "Add `<meta property=\"og:site_name\" content=\"Your Business\">` and a `name` in Organization/LocalBusiness schema, matching the name in your page titles.",
  },

  // ───────────────────────── Performance ─────────────────────────
  "performance.cwv:slow": {
    checkId: "performance.cwv",
    category: "performance",
    severity: "high",
    effort: "involved",
    title: "Your site is slow on mobile",
    description:
      "Google's PageSpeed test rates your homepage's mobile performance poorly. Slow pages lose visitors and rank lower.",
    howToFix:
      "Start with the biggest wins: compress and resize images (use WebP/AVIF), remove unused plugins/apps and third-party scripts, and enable caching on your host or a CDN.",
  },
  "performance.cwv:lcp": {
    checkId: "performance.cwv",
    category: "performance",
    severity: "medium",
    effort: "moderate",
    title: "The main content takes too long to appear",
    description:
      "Largest Contentful Paint (LCP) measures how long the biggest element (usually the hero image or headline) takes to show. Google wants under 2.5 seconds.",
    howToFix:
      "Shrink and compress the hero image, serve it as WebP/AVIF, don't lazy-load it (`loading=\"eager\"` / `fetchpriority=\"high\"`), and cut render-blocking scripts and fonts.",
  },
  "performance.cwv:cls": {
    checkId: "performance.cwv",
    category: "performance",
    severity: "medium",
    effort: "moderate",
    title: "The page jumps around while loading",
    description:
      "Cumulative Layout Shift (CLS) measures content moving as the page loads, which causes mis-taps. Google wants under 0.1.",
    howToFix:
      "Give images, videos and embeds fixed sizes (`width` and `height` attributes), reserve space for banners and ads, and avoid inserting content above what's already shown.",
  },
  "performance.cwv:tbt": {
    checkId: "performance.cwv",
    category: "performance",
    severity: "medium",
    effort: "involved",
    title: "Heavy scripts make the page slow to respond",
    description:
      "Total Blocking Time shows how long scripts freeze the page so taps and clicks don't work. Google wants under 200 ms.",
    howToFix:
      "Remove unused plugins, chat widgets and trackers, load third-party scripts with `defer` or after interaction, and ask your developer to split large JavaScript bundles.",
  },
} as const satisfies Record<string, IssueCopy>;

export type IssueKey = keyof typeof ISSUE_CATALOG;

export function issueCopy(key: IssueKey): IssueCopy {
  return ISSUE_CATALOG[key];
}
