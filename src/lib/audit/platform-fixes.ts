/**
 * Platform-aware fix steps (T024, ADR-019). Platform × issue family → concrete "where to click"
 * steps, appended to the generic howToFix when the platform is detected.
 *
 * ACCURACY RULE: an entry exists only if its steps were read today on the vendor's own help or
 * documentation page, fetched with curl. Every entry records that page (sourceUrl) and the date
 * (checkedOn). Vendors move menus often: entries older than ~6 months must be re-checked (a test
 * fails after 2027-05-23) and any step that no longer matches the page must be removed, not
 * guessed. Missing entry = the generic howToFix stays alone.
 */
import type { AuditIssue } from "./types";
import type { IssueKey } from "./issues";
import type { CloudflareDetection, Confidence, PlatformDetection, PlatformId, SeoPluginId } from "./platform";

export const FIXES_CHECKED_ON = "2026-11-23";

/** Issue families: one set of platform steps covers every issue id in the family. */
export const ISSUE_FAMILIES = {
  "meta-title": ["seo.title:missing", "seo.title:length", "seo.title:duplicate"],
  "meta-description": ["seo.meta-description:missing", "seo.meta-description:length", "seo.meta-description:duplicate"],
  canonical: [
    "seo.canonical:missing",
    "seo.canonical:relative",
    "seo.canonical:other-host",
    "seo.canonical:multiple",
    "seo.canonical:points-to-home",
  ],
  noindex: ["seo.indexability:noindex"],
  "robots-txt": ["seo.robots-txt:blocks-all", "seo.robots-txt:blocks-unlisted"],
  "ai-crawlers-search": ["geo.ai-crawlers:search-blocked", "geo.ai-crawlers:partially-blocked"],
  "ai-crawlers-training": ["geo.ai-crawlers:training-blocked"],
  "ai-crawler-firewall": ["geo.ai-crawler-probe:blocked-cloudflare"],
  sitemap: ["seo.sitemap:missing", "seo.sitemap:invalid", "seo.sitemap:empty"],
  "llms-txt": ["geo.llms-txt:missing", "geo.llms-txt:invalid-format"],
  "structured-data": ["seo.structured-data:missing", "seo.structured-data:invalid-json", "seo.structured-data:no-type"],
  "org-schema": ["geo.organization-schema:missing", "geo.organization-schema:incomplete"],
  "image-alt": ["seo.image-alt:missing", "geo.content-format:weak-alt"],
  redirects: ["seo.indexability:bad-status", "seo.soft-404:redirects-home"],
  "soft-404": ["seo.soft-404:returns-200"],
  "bing-verification": ["seo.bing-indexnow:not-verified"],
  "snippet-controls": ["geo.snippet-eligibility:nosnippet", "geo.snippet-eligibility:max-snippet", "geo.snippet-eligibility:noarchive"],
  "data-nosnippet": ["geo.snippet-eligibility:data-nosnippet-facts"],
  "js-shell": ["geo.raw-html-facts:js-shell"],
} as const satisfies Record<string, readonly IssueKey[]>;

export type IssueFamily = keyof typeof ISSUE_FAMILIES;

export interface FixEntry {
  /** where to click, in plain English; may contain short `code` */
  steps: string;
  /** the vendor page the steps were read from */
  sourceUrl: string;
  /** when (YYYY-MM-DD) the page was fetched and the steps compared */
  checkedOn: string;
  /** set when the human URL refused curl and the same article was read another way */
  checkedVia?: string;
  /** further vendor pages the steps also rely on (same checkedOn) */
  extraSourceUrls?: string[];
}

/** Who the steps are for: a detected platform, a WordPress SEO plugin, or Cloudflare in front. */
export type FixTarget = PlatformId | SeoPluginId | "cloudflare";

export const FIX_TARGET_LABELS: Record<FixTarget, string> = {
  wordpress: "WordPress",
  wix: "Wix",
  squarespace: "Squarespace",
  shopify: "Shopify",
  webflow: "Webflow",
  framer: "Framer",
  "nextjs-app": "Next.js (App Router)",
  "nextjs-pages": "Next.js (Pages Router)",
  lovable: "Lovable",
  "google-sites": "Google Sites",
  godaddy: "GoDaddy Website Builder",
  blogger: "Blogger",
  yoast: "Yoast SEO",
  "rank-math": "Rank Math",
  aioseo: "All in One SEO",
  cloudflare: "Cloudflare",
};

const D = FIXES_CHECKED_ON;
const e = (steps: string, sourceUrl: string, checkedVia?: string): FixEntry =>
  checkedVia ? { steps, sourceUrl, checkedOn: D, checkedVia } : { steps, sourceUrl, checkedOn: D };

/* ── Sources (all fetched with curl on 2026-11-23) ── */
const WP_READING = "https://wordpress.org/documentation/article/settings-reading-screen/";
const WP_SITEMAPS = "https://make.wordpress.org/core/2020/07/22/new-xml-sitemaps-functionality-in-wordpress-5-5/";
const WP_IMAGE = "https://wordpress.org/documentation/article/image-block/";
const YOAST_HOME = "https://yoast.com/help/optimizing-the-seo-title-and-meta-description-of-your-homepage/";
const YOAST_NOINDEX = "https://yoast.com/help/how-do-i-noindex-urls/";
const YOAST_ROBOTS = "https://yoast.com/help/how-to-edit-robots-txt-through-yoast-seo/";
const YOAST_SITEMAP = "https://yoast.com/help/xml-sitemaps-in-the-wordpress-seo-plugin/";
const YOAST_LLMS = "https://yoast.com/help/enable-llmstxt/";
const YOAST_SITEREP = "https://yoast.com/help/yoast-seo-settings-site-representation/";
const YOAST_BING = "https://yoast.com/help/how-to-connect-your-website-to-bing-webmaster-tools/";
const RM_HOME = "https://rankmath.com/kb/homepage-meta-title-and-description/";
const RM_NOINDEX = "https://rankmath.com/kb/how-to-noindex-urls/";
const RM_ROBOTS = "https://rankmath.com/kb/how-to-edit-robots-txt-with-rank-math/";
const RM_SITEMAPS = "https://rankmath.com/kb/configure-sitemaps/";
const RM_LLMS = "https://rankmath.com/kb/llms-txt/";
const RM_LOCAL = "https://rankmath.com/kb/local-seo/";
const RM_BING = "https://rankmath.com/kb/verify-your-site-with-bing-webmaster-tools/";
const AIO_TITLE = "https://aioseo.com/docs/setting-the-seo-title-and-description-for-your-content/";
const AIO_ROBOTSMETA = "https://aioseo.com/docs/setting-the-robots-meta-for-individual-content/";
const AIO_ROBOTS = "https://aioseo.com/docs/using-the-robots-txt-tool-in-all-in-one-seo/";
const AIO_SITEMAP = "https://aioseo.com/docs/how-to-create-an-xml-sitemap/";
const AIO_LLMS = "https://aioseo.com/docs/how-to-create-an-llms-txt-using-all-in-one-seo/";
const AIO_SCHEMA = "https://aioseo.com/docs/configuring-the-schema-settings-in-all-in-one-seo/";
const AIO_BING = "https://aioseo.com/docs/how-to-verify-your-site-with-bing-webmaster-tools/";
const SHOP_KEYWORDS = "https://help.shopify.com/en/manual/promoting-marketing/seo/adding-keywords";
const SHOP_HIDE = "https://help.shopify.com/en/manual/promoting-marketing/seo/hide-a-page-from-search-engines";
const SHOP_ROBOTS = "https://help.shopify.com/en/manual/promoting-marketing/seo/editing-robots-txt";
const SHOP_SITEMAP = "https://help.shopify.com/en/manual/promoting-marketing/seo/find-site-map";
const SHOP_REDIRECT = "https://help.shopify.com/en/manual/online-store/menus-and-links/url-redirect";
const SHOP_VIA = "the article's .md rendition on help.shopify.com (the HTML page showed a bot check)";
const WIX_META = "https://support.wix.com/en/article/adding-seo-title-tags-and-meta-descriptions-to-your-pages";
const WIX_SEOPANEL = "https://support.wix.com/en/article/customizing-your-pages-seo-settings-in-the-seo-panel";
const WIX_ROBOTS = "https://support.wix.com/en/article/editing-your-sites-robotstxt-file";
const WIX_AI = "https://support.wix.com/en/article/blocking-ai-crawlers-from-your-site";
const WIX_SITEMAP = "https://support.wix.com/en/article/understanding-your-sites-sitemap-file";
const WIX_LLMS = "https://support.wix.com/en/article/understanding-your-sites-llms-txt-file";
const WIX_BUSINESS = "https://support.wix.com/en/article/adding-your-sites-business-information";
const WIX_ALT = "https://support.wix.com/en/article/optimizing-your-images-and-galleries-for-seo-alt-text";
const WIX_301 = "https://support.wix.com/en/article/setting-up-a-301-redirect-for-a-page-on-your-site";
const WIX_BING = "https://support.wix.com/en/article/verifying-your-site-with-bing-webmaster-tools";
const WIX_ROBOTSMETA = "https://support.wix.com/en/article/using-the-robots-meta-tag";
const SQ = "https://support.squarespace.com/hc/en-us/articles/";
const SQ_TITLES = `${SQ}205814428-Change-how-page-titles-appear-in-search-engines-browser-tabs-and-social-shares`;
const SQ_DESC = `${SQ}206016198-Add-SEO-descriptions-to-your-site-pages-and-products`;
const SQ_HIDE = `${SQ}21829426828045-Hiding-your-site-from-search-results`;
const SQ_AI = `${SQ}360022347072-Request-that-AI-models-exclude-your-site`;
const SQ_HOWOPT = `${SQ}206744067-How-does-Squarespace-optimize-my-site-for-search-results`;
const SQ_LLMS = `${SQ}47434125611277-Create-an-llms-txt-file`;
const SQ_ALT = `${SQ}206542357-Add-alt-text-to-images-for-accessibility-and-SEO`;
const SQ_URLMAP = `${SQ}205815308-URL-mappings`;
const SQ_404 = `${SQ}205814478-Creating-a-custom-404-page`;
const SQ_BING = `${SQ}205813858-Verifying-your-site-with-Bing-Webmaster-Tools`;
const SQ_CODEINJ = `${SQ}205815908-Customize-parts-of-your-site-with-code-injection`;
const WF = "https://help.webflow.com/hc/en-us/articles/";
const WF_VIA = "help.webflow.com's public Help Center API (/api/v2/help_center/en-us/articles/<id>.json; the HTML page showed a bot check)";
const WF_META = `${WF}33961237278611-Add-SEO-title-and-meta-description`;
const WF_CANON = `${WF}33961263684115-Set-canonical-tags-to-improve-SEO`;
const WF_NOINDEX = `${WF}33961368603539-Disable-search-engine-indexing`;
const WF_ROBOTS = `${WF}41954080897683-Set-robots-txt-rules`;
const WF_SITEMAP = `${WF}33961355371667-Create-a-sitemap-in-Webflow`;
const WF_LLMS = `${WF}43240104183315-Upload-an-llms-txt-file-to-your-site`;
const WF_SCHEMA = `${WF}45766917223955-Add-schema-markup-in-Webflow-to-improve-SEO-and-AEO`;
const WF_ALT = `${WF}33961330170643-Include-alt-text-on-images`;
const WF_REDIR = `${WF}33961294898835-How-do-I-set-up-redirects-in-Webflow`;
const WF_CODE = `${WF}33961357265299-Custom-code-in-head-and-body-tags`;
const FR = "https://www.framer.com/help/articles/";
const FR_META = `${FR}how-to-update-page-titles-descriptions-and-social-images/`;
const FR_NOINDEX = `${FR}how-do-i-prevent-specific-pages-from-getting-indexed-by-search-engines/`;
const FR_ROBOTS = `${FR}how-can-i-access-the-robots-txt-file/`;
const FR_SITEMAP = `${FR}how-can-i-access-the-sitemap-xml-file/`;
const FR_LLMS = `${FR}llms-txt-framer/`;
const FR_JSONLD = `${FR}structured-data-through-json-ld/`;
const FR_ALT = `${FR}how-to-add-alt-tags-to-images/`;
const FR_REDIR = `${FR}how-to-setup-redirects-to-maintain-seo-ranking/`;
const FR_CANON = `${FR}setting-up-a-custom-canonical-url-in-framer/`;
const FR_CODE = `${FR}how-to-add-custom-code/`;
const NX = "https://nextjs.org/docs/app/";
const NX_META = `${NX}api-reference/functions/generate-metadata`;
const NX_ROBOTS = `${NX}api-reference/file-conventions/metadata/robots`;
const NX_SITEMAP = `${NX}api-reference/file-conventions/metadata/sitemap`;
const NX_JSONLD = `${NX}guides/json-ld`;
const NX_NOTFOUND = `${NX}api-reference/file-conventions/not-found`;
const NX_REDIRECTS = `${NX}api-reference/config/next-config-js/redirects`;
const NX_PUBLIC = `${NX}api-reference/file-conventions/public-folder`;
const LV_META = "https://docs.lovable.dev/features/site-metadata";
const LV_SEO = "https://docs.lovable.dev/features/seo-aeo";
const BL_FIND = "https://support.google.com/blogger/answer/41373?hl=en";
const BL_SETTINGS = "https://support.google.com/blogger/answer/9691230?hl=en";
const GS_PUBLISH = "https://support.google.com/sites/answer/6372880?hl=en";
const GS_A11Y = "https://support.google.com/sites/answer/7529116?hl=en";
const CF_POLICIES = "https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/";
const CF_ROBOTS = "https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/";

/* ── Steps ── */

const yoastMeta = e(
  "Edit the page, open the Yoast SEO sidebar, go to Search appearance and edit the SEO title and meta description. For a homepage that shows your latest posts, go to Yoast SEO > Settings > Content types > Homepage instead.",
  YOAST_HOME,
);
const yoastAi = e(
    "Go to Yoast SEO > Tools > File editor and remove the `Disallow: /` lines under these bots in robots.txt. The File editor is hidden if your site disables file editing; then edit the file on your server or ask your host.",
    YOAST_ROBOTS,
);
const rmAi = e(
    "Go to Rank Math SEO, switch on Advanced Mode (top right), then General Settings > Edit robots.txt; remove the `Disallow: /` lines under these bots and click Save Changes.",
    RM_ROBOTS,
);
const aioAi = e(
    "Go to All in One SEO > Tools > Robots.txt Editor, delete the rules that disallow these bots (trash icon) and click Save Changes; Open Robots.txt shows the result.",
    AIO_ROBOTS,
);
const rmMeta = e(
  "Edit the page, open Rank Math in the editor sidebar, click Edit Snippet and enter the Meta Title and Description, then click Update. For a homepage that shows your latest posts, use Rank Math SEO > Titles & Meta > Homepage.",
  RM_HOME,
);
const aioMeta = e(
  "Edit the page and scroll down to AIOSEO Settings; set the Title and Meta Description there (they override the defaults under All in One SEO > Search Appearance), then update the page.",
  AIO_TITLE,
);
const shopMeta = e(
  "Pages: Online Store > Pages > open the page > Search engine listing preview > Edit website SEO, fill in Page title and Description, Save. Homepage: Online Store > Preferences > the 'Social sharing image and SEO' section. Products, collections and blog posts have the same search listing fields.",
  SHOP_KEYWORDS,
  SHOP_VIA,
);
const shopRobots = e(
  "Shopify's default robots.txt lets crawlers in, so a block comes from a custom robots.txt.liquid template. Go to Online Store > (...) next to your theme > Edit code > templates/robots.txt.liquid and change the rules, or right-click robots.txt.liquid > Delete permanently to go back to Shopify's default. Shopify Support can't help with edits to this file.",
  SHOP_ROBOTS,
  SHOP_VIA,
);
const wixMeta = e(
  "In the editor click Pages & Menu > More Actions (...) next to the page > SEO basics, enter the Title tag and Meta description, then Publish.",
  WIX_META,
);
const wixRobots = e(
  "Go to SEO & GEO in your site's dashboard > Tools and settings > Robots.txt Editor > View File, remove the Disallow lines you don't want (Reset to Default restores Wix's version), click Save Changes, then Save.",
  WIX_ROBOTS,
);
const wixSnippet = e(
  "In the editor click Pages & Menu > More Actions (...) next to the page > SEO basics > Advanced SEO tab > Robots meta tag, untick nosnippet / noarchive (max-snippet -1 means no limit), then Publish.",
  WIX_ROBOTSMETA,
);
const sqLlmsSteps = e(
  "Version 7.1 sites: open the SEO/AI Visibility panel > SEO Settings > LLMS.txt tab, add the file's text in the field (it's off until you do) and click Save.",
  SQ_LLMS,
);
const wfMeta = e(
  "Open the Pages panel > Page settings (cog) > SEO settings and fill in the Title tag and Meta description (or click Generate), then publish the site. Collection pages take a pattern with Add field.",
  WF_META,
  WF_VIA,
);
const wfRobots = e(
  "Go to Site settings > SEO > Indexing, edit the robots.txt rules (remove the `Disallow` lines you don't want), click Save and publish the site.",
  WF_ROBOTS,
  WF_VIA,
);
const wfSchema = e(
  "Open the Pages panel, hover the page > Settings, scroll to Schema markup, paste your JSON-LD (or click Generate schema markup), Save and publish. Needs a paid Site plan or Workspace.",
  WF_SCHEMA,
  WF_VIA,
);
const frMeta = e(
  "Set the defaults in Site Settings (Site title, Site description); override per page in Page Settings (Title, Page Description), then re-publish.",
  FR_META,
);
const frRobots = e(
  "Framer generates robots.txt automatically. If you uploaded your own (Pro and Enterprise plans: project dashboard > your domain > Files tab), edit or remove that file, then publish.",
  FR_ROBOTS,
);
const frJsonLd = e(
  "Add JSON-LD with Custom Code: Project Settings > Custom Code > Add Script, put a `<script type=\"application/ld+json\">` block in the head, choose the pages, then publish.",
  FR_JSONLD,
);
const nxMeta = e(
  "Export `metadata` (or `generateMetadata`) from the page's or layout's `page.tsx`/`layout.tsx`, e.g. `export const metadata = { title: '…', description: '…' }`.",
  NX_META,
);
const nxRobotsMeta = e(
  "Set the `robots` field in `metadata`, e.g. `robots: { index: true, follow: true, googleBot: { 'max-snippet': -1 } }`, and remove any `index: false` / `nosnippet` you didn't mean.",
  NX_META,
);
const nxRobots = e(
  "Edit `app/robots.ts` (or a static `app/robots.txt`): return `rules: { userAgent: '*', allow: '/' }` plus your `sitemap` URL, and drop the `disallow` rules for bots you want in.",
  NX_ROBOTS,
);
const nxJsonLd = e(
  "Render a `<script type=\"application/ld+json\">` tag in `layout.tsx` or `page.tsx` with `JSON.stringify(data)`, replacing `<` with `\\u003c` so page data can't break out of the tag.",
  NX_JSONLD,
);
const lvReview = e(
  "Open More > Analytics > SEO & AI tab, click Run SEO scan, then Try to fix on the finding (it covers robots.txt, sitemap, metadata, structured data, canonical tags, alt text and indexing). Publish and click Scan again to confirm.",
  LV_SEO,
);
const lvMeta = e(
  "Ask Lovable in the project chat, e.g. \"Change my site title to … and write a meta description about …\"; newer TanStack Start apps can set it per page. Publish to make it live.",
  LV_META,
);
const blRobotsHeader = e(
  "Settings > Privacy: turn on 'Visible to search engines'. Then Settings > Crawlers and indexing: if 'Enable custom robots header tags' is on, check the Home page, Archive and search page, and Post and page tags; in a post's editor settings check 'Custom robots tags' for No index.",
  BL_FIND,
);
const cfPolicies = e(
  "In the Cloudflare dashboard go to Security > Settings, filter by Bot traffic, open AI Crawler and Agent access policies and set Search and Agent (and Training, if you want AI models to learn about you) to 'Allow (do not block)', then Save.",
  CF_POLICIES,
);
const cfManaged = e(
  "Your robots.txt starts with Cloudflare's managed block, which Cloudflare adds when a policy is set to Block or Training to Disallow. In the Cloudflare dashboard go to Security > Settings > (Bot traffic) AI Crawler and Agent access policies and set the policies to 'Allow (do not block)', or turn off Enable Bot Preference Sync, then Save; reload robots.txt to check.",
  CF_ROBOTS,
);

export const PLATFORM_FIXES: Partial<Record<FixTarget, Partial<Record<IssueFamily, FixEntry>>>> = {
  wordpress: {
    noindex: e(
      "Go to Settings > Reading and untick 'Discourage search engines from indexing this site', then click Save Changes. Since WordPress 5.3 that box adds a noindex, nofollow robots tag to every page.",
      WP_READING,
    ),
    sitemap: e(
      "WordPress 5.5 and later publish a sitemap index at /wp-sitemap.xml and list it in robots.txt. If it's missing, untick Settings > Reading > 'Discourage search engines' (that setting turns the sitemaps off) and check no code disables them with the wp_sitemaps_enabled filter.",
      WP_SITEMAPS,
    ),
    "image-alt": e(
      `Select the image in the block editor and fill in Alternative text in the block settings (that page only), or set Alt Text on the image in the Media Library so it's the default wherever you insert it.`,
      WP_IMAGE,
    ),
  },
  yoast: {
    "meta-title": yoastMeta,
    "meta-description": yoastMeta,
    noindex: e(
      "Edit the page, open the Yoast SEO sidebar or metabox > Advanced tab and set 'Allow search engines to show this content in search results?' to Yes. For a whole content type, go to Yoast SEO > Settings > that content type (e.g. Pages) and switch its search-results toggle back on, then Save changes.",
      YOAST_NOINDEX,
    ),
    "robots-txt": e(
      "Go to Yoast SEO > Tools > File editor and edit robots.txt there (Yoast's default is `User-agent: *` with an empty `Disallow:`, which allows everything). The File editor is hidden if your site disables file editing; then edit the file on your server or ask your host.",
      YOAST_ROBOTS,
    ),
    "ai-crawlers-search": yoastAi,
    "ai-crawlers-training": yoastAi,
    sitemap: e(
      "Go to Yoast SEO > Settings > Site features and, under Technical SEO, switch XML sitemaps on; View the XML sitemap shows the URL to submit. A sitemap at /sitemap.xml isn't Yoast's: it comes from WordPress or another plugin.",
      YOAST_SITEMAP,
    ),
    "llms-txt": e("Go to Yoast SEO > Settings > Site features, under AI tools go to llms.txt, switch it on and click Save changes.", YOAST_LLMS),
    "org-schema": e(
      "Go to Yoast SEO > Settings > Site representation, choose Organization (also for a local business), enter the organization name, upload a logo and add your social profiles, then click Save changes.",
      YOAST_SITEREP,
    ),
    "bing-verification": e(
      "In Bing Webmaster Tools pick the HTML Meta Tag option and copy the code; in WordPress go to Yoast SEO > Settings > Site connections, paste it under Bing, click Save changes, then click Verify in Bing.",
      YOAST_BING,
    ),
  },
  "rank-math": {
    "meta-title": rmMeta,
    "meta-description": rmMeta,
    noindex: e(
      "Edit the page, click the Rank Math icon > Advanced and make sure No Index isn't selected, then update the page. Site-wide rules live in Rank Math SEO > Titles & Meta, where a Robots Meta set to No Index applies to a whole post type.",
      RM_NOINDEX,
    ),
    "robots-txt": e(
      "Go to Rank Math SEO, switch on Advanced Mode (top right), then General Settings > Edit robots.txt; fix the rules and click Save Changes.",
      RM_ROBOTS,
    ),
    "ai-crawlers-search": rmAi,
    "ai-crawlers-training": rmAi,
    sitemap: e("Open the Rank Math menu > Sitemap Settings to check what's included; Rank Math serves its sitemap at /sitemap_index.xml.", RM_SITEMAPS),
    "llms-txt": e(
      "Go to Rank Math SEO > Dashboard and switch on the LLMS Txt module, then Rank Math SEO > General Settings > Edit llms.txt, adjust it and click Save Changes.",
      RM_LLMS,
    ),
    "org-schema": e(
      "Go to Rank Math SEO > Titles & Meta > Local SEO, choose Person or Company and fill in the website name, organization name, description and logo.",
      RM_LOCAL,
    ),
    "bing-verification": e(
      "Copy the code Bing gives you, then go to Rank Math SEO > General Settings > Webmaster Tools, paste it into the Bing field and click Save Changes.",
      RM_BING,
    ),
  },
  aioseo: {
    "meta-title": aioMeta,
    "meta-description": aioMeta,
    noindex: e(
      "Edit the page, scroll to AIOSEO Settings > Advanced tab, switch on Robots Setting and untick No Index, then update the page.",
      AIO_ROBOTSMETA,
    ),
    "snippet-controls": e(
      "Edit the page, scroll to AIOSEO Settings > Advanced tab, switch on Robots Setting and untick No Snippet and No Archive, then update the page.",
      AIO_ROBOTSMETA,
    ),
    "robots-txt": e(
      "Go to All in One SEO > Tools > Robots.txt Editor. With Enable Custom Robots.txt on, delete the blocking rule (trash icon) and click Save Changes; Open Robots.txt shows the result.",
      AIO_ROBOTS,
    ),
    "ai-crawlers-search": aioAi,
    "ai-crawlers-training": aioAi,
    sitemap: e("Go to All in One SEO > Sitemaps and make sure Enable Sitemap is on; Open Sitemap shows the URL to submit.", AIO_SITEMAP),
    "llms-txt": e("Go to All in One SEO > Sitemaps > LLMs.txt tab and enable the llms.txt file (it's on by default), then save.", AIO_LLMS),
    "org-schema": e(
      "Go to All in One SEO > Search Appearance > Global Settings > Knowledge Graph, choose Organization and fill in the organization name, description, email and phone.",
      AIO_SCHEMA,
    ),
    "bing-verification": e(
      "Go to All in One SEO > General Settings > Webmaster Tools tab, click Bing Webmaster Tools, paste the code into Bing Verification Code and click Save Changes, then click Verify in Bing.",
      AIO_BING,
    ),
  },
  shopify: {
    "meta-title": shopMeta,
    "meta-description": shopMeta,
    "image-alt": e(
      "Products > open the product > click the image > Edit alt text > Save alt text. For a collection or blog post featured image: open it > Update > Edit image, enter the alt text and Save.",
      SHOP_KEYWORDS,
      SHOP_VIA,
    ),
    noindex: e(
      "Look in Online Store > (...) next to your theme > Edit code > layout/theme.liquid for a `<meta name=\"robots\" content=\"noindex\">` block and remove it. Also check the page or product doesn't have the `seo.hidden` metafield set to 1, and that products you want found aren't Unlisted.",
      SHOP_HIDE,
      SHOP_VIA,
    ),
    "robots-txt": shopRobots,
    "ai-crawlers-search": shopRobots,
    "ai-crawlers-training": shopRobots,
    sitemap: e(
      "Shopify generates /sitemap.xml automatically. Crawlers can't read it while the store is password-protected (private mode), so remove the password first, then submit sitemap.xml in Google Search Console > Indexing > Sitemaps.",
      SHOP_SITEMAP,
      SHOP_VIA,
    ),
    "structured-data": e(
      "Shopify says all current Shopify-supported and Theme Store themes include structured data by default, so none usually means an old or heavily customised theme: ask its developer or switch to a current theme.",
      SHOP_SITEMAP,
      SHOP_VIA,
    ),
    redirects: e(
      "Content > Menus > View URL Redirects > Create URL redirect, enter Redirect from (old URL) and Redirect to (new URL), then Save redirect. Shopify only redirects URLs that currently show 'Page not found'.",
      SHOP_REDIRECT,
      SHOP_VIA,
    ),
    "bing-verification": e(
      "Copy Bing's HTML meta tag, then go to Online Store > (...) next to your theme > Edit code > layout/theme.liquid, paste it on a blank line right below `<head>` and Save (Shopify documents these steps for Google's tag; Bing's works the same way).",
      SHOP_SITEMAP,
      SHOP_VIA,
    ),
  },
  wix: {
    "meta-title": wixMeta,
    "meta-description": wixMeta,
    noindex: e(
      "In the editor click Pages & Menu > More Actions (...) next to the page > SEO basics and switch on 'Let search engines index this page', then Publish. Indexing can also be turned off for the whole site or a page type, so check those settings too.",
      WIX_SEOPANEL,
    ),
    "robots-txt": wixRobots,
    "ai-crawlers-search": e(
      "Go to SEO & GEO in your site's dashboard > Tools and settings > Robots.txt Editor > View File and remove the `User-agent: …` / `Disallow: /` lines for these bots (Wix's AI-blocking guide adds lines like `User-agent: ChatGPT-User` / `Disallow: /`), click Save Changes, then Save.",
      WIX_AI,
    ),
    "ai-crawlers-training": wixRobots,
    sitemap: e(
      "Wix creates and updates /sitemap.xml automatically. A page drops out of it if you changed its canonical tag; remove that custom canonical to bring it back.",
      WIX_SITEMAP,
    ),
    "llms-txt": e(
      "Wix generates /llms.txt automatically on upgraded sites with a custom domain and search indexing on. Check SEO & GEO in your dashboard > Tools and settings > Go to llms.txt: make sure the 'Use your llms.txt file' toggle isn't opted out (More Actions > Edit file lets you change it).",
      WIX_LLMS,
    ),
    "org-schema": e(
      "Go to Business Info in your site's dashboard and add your business name, logo, description, address and contact details, then Save; Wix then adds Local Business structured data to your homepage automatically.",
      WIX_BUSINESS,
    ),
    "image-alt": e(
      "In the editor click the image > Settings icon and describe it under 'What's in the image?'. For galleries: click the gallery > Manage Media, select each image, enter its title on the right and click Done.",
      WIX_ALT,
    ),
    redirects: e(
      "Go to SEO & GEO in your site's dashboard > Tools and settings > URL Redirect Manager > + New Redirect > Single redirect, enter the old URL path and the new URL, then Save.",
      WIX_301,
    ),
    "bing-verification": e(
      "Go to SEO & GEO in your site's dashboard > View tasks > 'Connect this site to Bing Webmaster Tools' > Connect to Bing, choose the account and click Allow.",
      WIX_BING,
    ),
    "snippet-controls": wixSnippet,
  },
  squarespace: {
    "meta-title": e(
      "Open the SEO/AI Visibility panel > SEO Settings > Search Appearance and edit the SEO Title Format on the Home, Pages or Items tab (version 7.0: the SEO appearance panel), then Save. `%p` inserts each page's own SEO title.",
      SQ_TITLES,
    ),
    "meta-description": e(
      "Pages: open the Pages panel, hover the page > page settings > SEO tab > SEO Description > Save. Homepage: SEO/AI Visibility panel > SEO Settings > Home tab > SEO site description.",
      SQ_DESC,
    ),
    noindex: e(
      "One page: Pages panel > hover the page > page settings > SEO tab and switch 'Hide page from search results' off. Whole site: Settings > Crawlers and untick 'Block Search engine crawlers'. Also remove any `<meta name=\"robots\" content=\"noindex\">` from Page header code injection.",
      SQ_HIDE,
    ),
    "robots-txt": e(
      "Open the Settings panel > Crawlers and untick 'Block Search engine crawlers'; that option is what adds `Disallow: /` to a Squarespace robots.txt.",
      SQ_HIDE,
    ),
    "ai-crawlers-training": e(
      "Open the Settings panel > Crawlers and untick 'Block known artificial intelligence crawlers' (it disallows GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, Bytespider and others in robots.txt).",
      SQ_AI,
    ),
    sitemap: e("Squarespace creates and updates your sitemap automatically; there's nothing to create or submit by hand.", SQ_HOWOPT),
    "llms-txt": sqLlmsSteps,
    "org-schema": {
      ...e(
        "Squarespace adds Organization, Local business and Website structured data automatically, and you can't edit or remove it. To add your own JSON-LD, open the Code Injection panel and paste it into Header (Core, Plus, Advanced and some legacy plans).",
        SQ_HOWOPT,
      ),
      extraSourceUrls: [SQ_CODEINJ],
    },
    "image-alt": e(
      "Pages panel > open the page > Edit, click the image block > pencil icon > Content tab and fill in Image alt text (it saves automatically).",
      SQ_ALT,
    ),
    redirects: e(
      "Open the Developer tools panel > URL mappings, add a line like `/old-url -> /new-url 301` and click Save. Redirects only work once the old page is deleted or disabled.",
      SQ_URLMAP,
    ),
    "soft-404": e(
      "Pages panel > scroll down > System Pages > 404 Page. Squarespace notes that a custom 404 page can be flagged as a soft 404: use the System Default page, or noindex your custom one.",
      SQ_404,
    ),
    "bing-verification": e(
      "In Bing Webmaster Tools copy the `<meta>` tag, then open the Code Injection panel, paste it into Header and Save (plans with code injection). On the Personal plan verify with the CNAME option instead.",
      SQ_BING,
    ),
  },
  webflow: {
    "meta-title": wfMeta,
    "meta-description": wfMeta,
    canonical: e(
      "Go to Site settings > SEO > Global canonical tag URL, enter your full site address (e.g. https://www.yourdomain.com) and save; override a single page in Page settings > SEO settings. Then publish.",
      WF_CANON,
      WF_VIA,
    ),
    noindex: e(
      "Open the page's Page settings > SEO settings and switch Sitemap indexing back on, then publish. Also check Site settings > SEO > Indexing for robots.txt rules or traffic-control toggles that block search engines.",
      WF_NOINDEX,
      WF_VIA,
    ),
    "robots-txt": wfRobots,
    "ai-crawlers-search": e(
      "Go to Site settings > SEO > Indexing: under Traffic control switch 'AI bots' (ChatGPT-User, PerplexityBot, ClaudeBot, GPTBot…) and 'Search engine crawlers' (includes OAI-SearchBot) back on, remove any robots.txt rules that disallow them, then save and publish.",
      WF_NOINDEX,
      WF_VIA,
    ),
    "ai-crawlers-training": e(
      "Go to Site settings > SEO > Indexing: switch the 'AI bots' traffic-control toggle back on if you want AI models to learn about you, or remove the robots.txt rules for these bots, then save and publish.",
      WF_NOINDEX,
      WF_VIA,
    ),
    sitemap: e("Go to Site settings > SEO tab > Sitemap, set Auto-generate sitemap to Yes, click Save changes and publish.", WF_SITEMAP, WF_VIA),
    "llms-txt": e(
      "Go to Site settings > SEO > LLMs.txt > Upload file (UTF-8, under 100 KB), click Save changes and publish; it's served on your custom domain only.",
      WF_LLMS,
      WF_VIA,
    ),
    "structured-data": wfSchema,
    "org-schema": wfSchema,
    "image-alt": e(
      "Open the Assets panel (J), hover the image > cog icon and write the alt text in the Descriptive field (or click Decorative). To change one instance, select it on the canvas > cog > Alt text > Custom description.",
      WF_ALT,
      WF_VIA,
    ),
    redirects: e("Go to Site settings > Publishing > 301 redirects > Add redirect path, enter the old and new paths, then publish.", WF_REDIR, WF_VIA),
    "bing-verification": e(
      "Go to Site settings > Custom code tab, paste Bing's `<meta>` tag into Head code and click Save changes, then publish (needs a paid Site plan or Workspace).",
      WF_CODE,
      WF_VIA,
    ),
  },
  framer: {
    "meta-title": frMeta,
    "meta-description": frMeta,
    canonical: e(
      "Framer sets canonical tags from your connected domain. If the site is served through a reverse proxy, go to Settings > Domains > Canonical URL, enter your public URL and re-publish.",
      FR_CANON,
    ),
    noindex: e("Open the page's Page Settings (gear icon in the top toolbar) > Search engines, switch it on and re-publish.", FR_NOINDEX),
    "robots-txt": frRobots,
    "ai-crawlers-search": frRobots,
    "ai-crawlers-training": frRobots,
    sitemap: e("Framer generates /sitemap.xml automatically when you publish; no setup is needed.", FR_SITEMAP),
    "llms-txt": e(
      "Pro and Enterprise plans: open Site Settings > Hosting > Files, upload your llms.txt and publish; it's served at /llms.txt.",
      FR_LLMS,
    ),
    "structured-data": frJsonLd,
    "org-schema": frJsonLd,
    "image-alt": e(
      "On the canvas: select the image, click Fill in the Styles panel and enter the alt text in the pop-up. CMS images: open the item and use Choose Image.",
      FR_ALT,
    ),
    redirects: e("Go to Site Settings > Hosting > Redirects, enter the old URL and the new URL, then publish.", FR_REDIR),
    "bing-verification": e(
      "Go to Project Settings > Custom Code > Add Script, paste Bing's `<meta>` tag, place it in the head and publish.",
      FR_CODE,
    ),
    "data-nosnippet": e(
      "If you used Framer's Accessibility setting 'Google Bot: Skip' (Framer's way to make Google ignore content for descriptions), select the frames that hold these facts, open Accessibility, remove that setting and publish.",
      FR_META,
    ),
  },
  "nextjs-app": {
    "meta-title": nxMeta,
    "meta-description": nxMeta,
    canonical: e(
      "Set `metadataBase: new URL('https://yourdomain.com')` in the root layout and `alternates: { canonical: '/this-page' }` in each page's `metadata`.",
      NX_META,
    ),
    noindex: nxRobotsMeta,
    "snippet-controls": nxRobotsMeta,
    "robots-txt": nxRobots,
    "ai-crawlers-search": nxRobots,
    "ai-crawlers-training": nxRobots,
    sitemap: e("Add `app/sitemap.ts` returning your URLs (or a static `app/sitemap.xml`) and reference it from robots.", NX_SITEMAP),
    "llms-txt": e("Put `llms.txt` in the `public` folder; files there are served from the site root, so it appears at /llms.txt.", NX_PUBLIC),
    "structured-data": nxJsonLd,
    "org-schema": nxJsonLd,
    "soft-404": e(
      "Call `notFound()` for unknown routes and add `app/not-found.tsx` (or `global-not-found.tsx` for unmatched URLs). Next.js only sends status 404 if that happens before streaming starts; after that the status stays 200 (with a noindex tag).",
      NX_NOTFOUND,
    ),
    redirects: e(
      "Add entries to `redirects()` in `next.config.js`, e.g. `{ source: '/old', destination: '/new', permanent: true }`.",
      NX_REDIRECTS,
    ),
    "bing-verification": e(
      "Add it to the root layout's `metadata`: `verification: { other: { 'msvalidate.01': 'YOUR-CODE' } }` (the `other` map outputs a `<meta name=… content=…>` tag).",
      NX_META,
    ),
  },
  lovable: {
    "meta-title": lvMeta,
    "meta-description": lvMeta,
    canonical: lvReview,
    noindex: lvReview,
    "robots-txt": lvReview,
    "ai-crawlers-search": lvReview,
    sitemap: lvReview,
    "structured-data": lvReview,
    "org-schema": lvReview,
    "image-alt": lvReview,
    "js-shell": e(
      "Older Lovable apps (React + Vite) are pre-rendered only for verified crawlers, so other tools still get an empty shell. Apps created from May 13, 2026 use TanStack Start with server-side rendering for every request; older apps can be upgraded to TanStack Start.",
      LV_SEO,
    ),
  },
  blogger: {
    "meta-description": e(
      "Settings > Meta tags > Enable search description, then write your blog's search description.",
      BL_SETTINGS,
    ),
    noindex: blRobotsHeader,
    "robots-txt": e(
      "Settings > Crawlers and indexing: if 'Enable custom robots.txt' is on, fix its rules or turn it off to use Blogger's default.",
      BL_SETTINGS,
    ),
    "image-alt": e("In the post editor click the image > Edit, fill in the 'alt' field (and a 'title' if you like), then Update.", BL_FIND),
    redirects: e(
      "Settings > Errors and redirects > Custom redirects: add the deleted URL in From and the new URL in To, and select Permanent.",
      BL_SETTINGS,
    ),
  },
  "google-sites": {
    noindex: e(
      "Open the site in Google Sites, click the arrow next to Publish > Publish settings, untick 'Request public search engines to not display my site' and Save.",
      GS_PUBLISH,
    ),
    "image-alt": e("Select the image or logo > More editing options > Add alt text, and enter the description.", GS_A11Y),
  },
  cloudflare: {
    "ai-crawlers-search": cfManaged,
    "ai-crawlers-training": cfManaged,
    "ai-crawler-firewall": cfPolicies,
  },
};

/** Issue id → family (built once). */
export const FAMILY_OF: ReadonlyMap<string, IssueFamily> = new Map(
  (Object.entries(ISSUE_FAMILIES) as [IssueFamily, readonly string[]][]).flatMap(([family, ids]) => ids.map((id) => [id, family] as const)),
);

export function fixFor(target: FixTarget, issueId: string): FixEntry | null {
  const family = FAMILY_OF.get(issueId);
  if (!family) return null;
  return PLATFORM_FIXES[target]?.[family] ?? null;
}

/* ── Wiring (used by analyze.assemble) ── */

export interface PlatformContext {
  platform: PlatformDetection | null;
  cloudflare: CloudflareDetection | null;
}

/** "On Wix: … (checked 2026-11-23, source: https://…)" */
export function fixBlock(target: FixTarget, entry: FixEntry, confidence: Confidence): string {
  const label = FIX_TARGET_LABELS[target];
  const plugin = target === "yoast" || target === "rank-math" || target === "aioseo";
  const lead = plugin
    ? confidence === "high"
      ? `In ${label}:`
      : `If you use ${label}:`
    : confidence === "high"
      ? `On ${label}:`
      : `If your site runs on ${label}:`;
  const sources = [entry.sourceUrl, ...(entry.extraSourceUrls ?? [])].join("; ");
  return `${lead} ${entry.steps} (checked ${entry.checkedOn}, source: ${sources})`;
}

function targetsFor(pc: PlatformContext, issueId: string): { target: FixTarget; confidence: Confidence }[] {
  const out: { target: FixTarget; confidence: Confidence }[] = [];
  const p = pc.platform;
  if (p) {
    out.push({ target: p.id, confidence: p.confidence });
    if (p.plugin) out.push({ target: p.plugin.id, confidence: p.confidence });
  }
  const cf = pc.cloudflare;
  if (cf) {
    const family = FAMILY_OF.get(issueId);
    const useCf =
      (cf.managedRobots && (family === "ai-crawlers-search" || family === "ai-crawlers-training")) ||
      (cf.edge && family === "ai-crawler-firewall");
    if (useCf) out.push({ target: "cloudflare", confidence: "high" });
  }
  return out;
}

/**
 * Append verified platform steps to matching issues (generic text first, then one block per
 * platform / plugin / Cloudflare). Returns new issue objects; ids, scores and impact are untouched.
 */
export function augmentIssues(issues: AuditIssue[], pc: PlatformContext): { issues: AuditIssue[]; augmented: Set<FixTarget>; count: number } {
  const augmented = new Set<FixTarget>();
  let count = 0;
  const out = issues.map((issue) => {
    const blocks: string[] = [];
    for (const { target, confidence } of targetsFor(pc, issue.id)) {
      const entry = fixFor(target, issue.id);
      if (!entry) continue;
      blocks.push(fixBlock(target, entry, confidence));
      augmented.add(target);
    }
    if (blocks.length === 0) return issue;
    count++;
    return { ...issue, howToFix: `${issue.howToFix}\n\n${blocks.join("\n\n")}` };
  });
  return { issues: out, augmented, count };
}

/** Notes for result.notes, e.g. "Detected platform: Wix (generator meta tag)." */
export function platformNotes(pc: PlatformContext, augmentedCount: number, augmented: Set<FixTarget>): string[] {
  const notes: string[] = [];
  const p = pc.platform;
  if (p) {
    const name = p.plugin ? `${p.name} with ${p.plugin.name}` : p.name;
    const why = p.confidence === "high" ? p.evidence : `likely; ${p.evidence}`;
    let note = `Detected platform: ${name} (${why}).`;
    const forPlatform = augmented.has(p.id) || (p.plugin ? augmented.has(p.plugin.id) : false);
    if (forPlatform && augmentedCount > 0) {
      note += ` Where-to-click steps for it were added to ${augmentedCount === 1 ? "1 fix" : `${augmentedCount} fixes`}, checked against the vendor's help pages on ${FIXES_CHECKED_ON}.`;
    }
    notes.push(note);
  }
  if (pc.cloudflare && augmented.has("cloudflare")) {
    notes.push(`Detected Cloudflare in front of the site (${pc.cloudflare.evidence}); Cloudflare steps were added to the AI crawler fixes.`);
  }
  return notes;
}
