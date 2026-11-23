# Review R1: content + SEO files (workflow, adversarially verified)

28 confirmed findings.

## 1. [high] [honesty] src/content/home.ts:223

**Issue:** Copy says follow-up contact is optional ("only if you agree, to follow up about it"), but the app makes it mandatory: src/app/api/audit/unlock/route.ts:22 requires `consent: z.literal(true)`, the leads table has `check (consent)`, and the only consent label (src/content/audit.ts:56) bundles storing the email AND being contacted. The report cannot be unlocked without agreeing to contact. The same false optionality is in src/content/legal.ts:31 ("whether you gave consent to be contacted ... if you agreed, to contact you about it") and legal.ts:67 ("If you agreed to be contacted...").

**Fix:** home.ts:223 replace the answer with: "Your scores and top three issues are free with no strings. To see every issue and fix, we ask for your email and for your agreement that we may store it with the report and contact you about it. You can ask us to delete it at any time. No password, no card and nothing to install."
legal.ts:31 replace with: "When you unlock a full report: your email address, the audit it belongs to, the website address and score, a record that you ticked the consent box, and the browser's user-agent string. Ticking that box is required to unlock the report; it covers storing your email with the report and contacting you about it. You can withdraw it at any time (see \"Your rights\")."
legal.ts:67 replace with: "You can withdraw your consent to be contacted about your report at any time by replying to any email from us or writing to the address above."

## 2. [high] [honesty] src/content/pricing.ts:82

**Issue:** Invented customer behaviour. "Many people buy the audit, fix the quick wins themselves, and hand the rest to us." asserts an existing customer base and a purchase pattern for a v1 product whose prices are still placeholders. Line 78 does the same with an experience claim: "Most local sites need a full audit and one fix sprint, then only occasional checks." Both break the types.ts rule (no invented customers / stats-about-us).

**Fix:** Line 82 replace the answer with: "The full audit tells you what to fix and in what order; the fix sprint is us doing the fixing. You can buy the audit, fix the quick wins yourself, and hand the rest to us."
Line 78 replace the answer with: "Yes. Our prices are set for small teams and local businesses such as clinics, cafés, studios and trades, not for enterprise budgets. A typical path for a local site is a full audit and one fix sprint, then occasional checks."

## 3. [high] [honesty] src/content/legal.ts:39

**Issue:** Privacy policy says "We respect robots.txt rules for noticrbot", but src/lib/audit/crawl.ts fetches the entered URL (line 165), /sitemap.xml and /llms.txt (lines 237-242) before robots.txt is even parsed and regardless of its rules; only the up-to-five internal pages are filtered with isBlocked(..., OUR_BOT) (crawl.ts:287). Also line 40 says "the homepage address" is sent to Google, while crawl.ts:160 sends the URL the user entered (`fetchPsi(requestedUrl)`), which may be a deeper page.

**Fix:** Line 39 replace with: "When you enter a website address, our crawler (user agent \"noticrbot\") fetches publicly available pages from that site: the address you entered (normally the homepage), robots.txt, the sitemap, llms.txt and up to five internal pages. We always read the page you asked us to audit; for the internal pages we skip anything the site's robots.txt disallows for noticrbot. We never submit forms and never access password-protected areas."
Line 40 replace with: "We also send the address you entered to Google PageSpeed Insights to measure performance. Google processes that request under its own terms and privacy policy."

## 4. [high] [conversion] src/content/services.ts:29

**Issue:** Services and pricing contradict each other on what $49 buys. services.ts sells "SEO audit" (line 29, "From $49") and "GEO audit" (line 46, "From $49") as two separate priced services. pricing.ts sells one "Full audit" at $49 described as "A human-reviewed SEO and GEO audit" (line 31) that includes the GEO audit's AI answer snapshot (line 35), yet its CTA preselects only service=seo-audit (line 39). A buyer cannot tell whether SEO + GEO costs $49 or $98, and "Full audit" is a name that never appears on /services. Separately, "Content & entity" (services.ts:79, From $149) is absent from the pricing page altogether, so the pricing page silently drops one of the "five focused services" home.ts:183 promises.

**Fix:** Keep every priceFrom string unchanged (short label, per the types.ts:31 contract). Resolve the ambiguity in prose fields instead.

1. C:\Users\Ayush\Downloads\SEO\src\content\services.ts:19 (seo-audit description), append one sentence so the line ends:
"...turn the findings into a short, prioritised plan. The SEO audit and GEO audit are sold together as the Full audit on our pricing page: one review, one price."

2. C:\Users\Ayush\Downloads\SEO\src\content\services.ts:36 (geo-audit description), append the same sentence so the line ends:
"...to see who they mention today. The GEO audit and SEO audit are sold together as the Full audit on our pricing page: one review, one price."

3. C:\Users\Ayush\Downloads\SEO\src\content\pricing.ts:31, replace with:
    description: "Our SEO audit and GEO audit in one human review, with a prioritised plan you can act on.",

4. Optional, for the Content & entity gap: in C:\Users\Ayush\Downloads\SEO\src\content\pricing.ts, add to pricingFaq after the entry ending at line 83 (no price, no placeholder, no layout reference, consistent with "fixed scope"):
  {
    q: "Do you offer anything beyond the audit, fix sprint and monitoring?",
    a: "Yes. Content and entity work, where we rewrite key page sections, add an FAQ block and align your business details, is a separate fixed-scope service. It is described on the services page, and we confirm the price by email before any work starts.",
  },

Leave pricing.ts:39 (href "/contact?service=seo-audit") as is: the contact enum has no combined value, and adding one would break the server schema and tests/content/seo-copy.test.ts:95. Do not change priceFrom at services.ts:29 or :46.

## 5. [high] [conversion] src/content/pricing.ts:36

**Issue:** The Full audit does not answer "why should I pay". Its headline paid feature, "Prioritised fix list ranked by impact and effort" (pricing.ts:36, repeated at services.ts:25), is something the free audit already gives: home.ts:128-138 says the free report is "ordered by the points it can recover" with "Effort labelled", and audit.ts:52 says the email unlock shows "every issue, every check and the exact fix for each". services.ts:21 ("Full automated report across your key pages") is also just the free product. "AI answer snapshot for customer-style questions" (pricing.ts:35) is the one thing only the paid tier does, but it is worded so vaguely a dentist will not know what it is. There is no FAQ on free vs Full; the only comparison FAQ is Full vs Fix sprint (line 81).

**Fix:** Severity: medium.

**`C:\Users\Ayush\Downloads\SEO\src\content\pricing.ts:33-37`** — replace the features array contents with (as proposed):
```
"Everything in the free audit",
"A person reads your key pages and checks what a script can't judge",
"What AI engines answer today when asked your customers' questions, and who they cite",
"A written plan: what to fix first, what can wait, what to ignore",
"A short call or written walkthrough [PLACEHOLDER]",
```

**`pricing.ts` `pricingFaq`** — insert as the second entry, after line 75 (as proposed):
```
{
  q: "What does the Full audit add to the free audit?",
  a: "The free audit is automated: it runs a fixed set of checks on your homepage and up to five pages. In the Full audit a person reads your key pages and judges what a script can't, such as whether a page really answers the question a customer would ask, and puts a set of customer-style questions to AI answer engines to see who they mention today. You get a written plan that says what to fix first, what can wait and what to ignore.",
},
```

**`C:\Users\Ayush\Downloads\SEO\src\content\services.ts:21`** — changed from the proposal (drop "and corrected"):
```
"The automated noticr report for your key pages, checked by a person",
```

**`services.ts:25`** — as proposed:
```
"A written plan: what to fix first, what can wait and what to ignore",
```

**`services.ts:42`** — changed from the proposal (no new placeholder, no question count, site-consistent engine naming):
```
"What AI answer engines such as ChatGPT, Perplexity and Google AI Overviews say today when asked your customers' questions, with who they mention and which sources they cite",
```

If the founder does want a fixed question count, add it later as a `[PLACEHOLDER: ...]`, but only once the services page renders deliverables through `PlaceholderText` and the placeholder is added to the founder's replacement list.

## 6. [high] [conversion] src/content/home.ts:196

**Issue:** The dark section promises something the free audit does not do, then sends the reader to the free audit. Body: "the engine has already decided which sources to trust. noticr shows you whether yours is one of them", CTA "Check my site" -> /audit. The free audit never asks an AI engine anything: its GEO checks are readiness signals only (src/lib/audit/checks/geo: ai-crawlers, llms-txt, organization-schema, faq, author, dates, answer-ready, entity-consistency). Only the paid GEO audit looks at who engines actually mention (services.ts:36). A founder who runs the audit expecting "am I cited by ChatGPT: yes/no" gets a score instead, which reads as bait and undercuts the honest tone of the FAQ at home.ts:231.

**Fix:** home.ts:196, replace body with:
  body: "When someone asks an AI assistant for the best tool, clinic or café near them, the engine has already decided which sources to trust. The free audit shows whether your site gives those engines what they need to read, trust and quote you, and what to change if it doesn't.",

## 7. [high] [self-audit] src/lib/seo/metadata.ts:93

**Issue:** No author signal is emitted anywhere, so our own `geo.author` check (weight 7 of 88 GEO points, src/lib/audit/checks/geo/author.ts) scores 0 on noticr. The engine accepts only <meta name="author">, rel=author, byline classes, JSON-LD `author`, a Person node or `founder`. rootMetadata sets `creator` and `publisher`, which Next 16.4 renders as <meta name="creator"> / <meta name="publisher"> (not recognised), buildMetadata sets neither, and no JSON-LD helper emits author/founder/Person.

**Fix:** In metadata.ts add `authors` in both places (Next renders it as <meta name="author" content="noticr"> plus <link rel="author" href=…>, confirmed in node_modules/next/dist/lib/metadata/metadata-elements.js):
1) buildMetadata return, after line 63 `description,`:
    authors: [{ name: site.name, url: siteUrl() }],
2) rootMetadata, before line 93 `creator: site.name,`:
  authors: [{ name: site.name, url: siteUrl() }],
Optional follow-up in src/lib/seo/jsonld.tsx next to `sameAsProfiles` (line 22), so a real Person appears once the founder placeholder is replaced:
  /** [PLACEHOLDER] Founder: set your real name to publish a founder Person node. Leave empty until then. */
  export const founderName = "";
and in organizationLd() after line 49:
  if (founderName) node.founder = { "@type": "Person", name: founderName };

## 8. [high] [self-audit] src/lib/seo/jsonld.tsx:70

**Issue:** No date signal reaches the pages the engine will crawl, so `geo.dates` (weight 8 of 88) scores 0. dateModified exists only in webPageLd(), which no page is specified to render: docs/tasks/006-pages.md asks only for Breadcrumb on all pages, Service on /services and FAQPage on /pricing and home, with Organization + WebSite sitewide. None of organizationLd / websiteLd / faqLd / serviceLd / breadcrumbLd carries datePublished or dateModified, and buildMetadata emits no date meta. The only visible dates are on /privacy and /terms, which are footer links and fall outside the homepage + 5 nav pages crawl.

**Fix:** Put the date on the sitewide WebSite node (dateModified is valid on WebSite as a CreativeWork).
Line 1: `import { site, contentUpdated } from "@/content/site";`
In websiteLd() (lines 71-80) add one property after `inLanguage: "en",`:
    dateModified: contentUpdated,
Every page that renders websiteLd() then satisfies hasDateSignal() (`typeof n.dateModified === "string"`). The existing test 'emits expected types and no placeholders' still passes.

## 9. [medium] [honesty] src/content/home.ts:196

**Issue:** Promises AI-visibility detection the product does not have. "the engine has already decided which sources to trust. noticr shows you whether yours is one of them" claims noticr reports whether AI engines trust/cite the site; the free audit only checks readiness signals (crawler access, llms.txt, schema, answer-ready content) and never queries any engine. Same overclaim in homeMeta.metaDescription (line 246: "See how Google, ChatGPT, Perplexity and AI Overviews read your site") and in the AI Overviews FAQ (line 211: being a linked source "depends on the same signals our GEO checks look at"), which states as fact how Google selects sources and is also emitted into FAQPage JSON-LD and llms.txt.

**Fix:** Required change (src/content/home.ts line 196), replace the body string with:
"When someone asks an AI assistant for the best tool, clinic or café near them, the engine has already decided which sources to trust. noticr shows you whether your site is ready to be one of them, and what to change if it isn't."

Optional, safe but not required (treat as low priority, not part of the defect):
- Line 211 answer: "Google AI Overviews are AI-generated summaries that appear at the top of some Google search results, with links to the sources they draw on. Google decides which sources to link. Pages that are crawlable, well structured and answer the question clearly are easier to use as a source, and that is what our GEO checks look at."
- Line 246: leave as is (the "read your site" wording is accurate for a crawler-style audit). If changed anyway, the proposed 149-char text passes the 120-155 length test and the uniqueness test.

## 10. [medium] [honesty] src/content/services.ts:90

**Issue:** Monitoring is described as a monthly human re-audit, but the deliverable "Alerts when AI crawlers or search engines get blocked" (also pricing.ts:64 "Alerts when search or AI crawlers get blocked") promises automated, as-it-happens alerting that does not exist in v1; a block could go unnoticed for up to a month. pricing.ts:67 CTA "Start monitoring" implies a self-serve product start, but it only opens the contact form.

**Fix:** services.ts:90 replace with: "A flag in your monthly summary if AI crawlers or search engines have become blocked"
pricing.ts:64 replace with: "A flag if search or AI crawlers have become blocked"
pricing.ts:67 change label to: "Ask about monitoring" (keep href "/contact?service=monitoring")

## 11. [medium] [honesty] src/content/legal.ts:114

**Issue:** Unmarked placeholder business terms in the Terms. "Monitoring is billed monthly and can be cancelled any month by email; cancellation takes effect at the end of the current month." is stated as a firm contractual term, while the same commitment is treated as undecided elsewhere (pricing.ts:86 "There is no minimum term [PLACEHOLDER]", pricing.ts:94 payment method placeholder, all prices placeholders). The billing cycle and cancellation effect date were never decided by the founder.

**Fix:** In C:\Users\Ayush\Downloads\SEO\src\content\legal.ts line 114, keep the payment placeholder and the monthly/cancel-any-month wording (it matches pricing.ts and services.ts) and mark only the invented effective-date clause. Replace the line with:

        "Payment terms: [PLACEHOLDER: payment method, due date and refund policy]. Monitoring is billed monthly and can be cancelled any month by email; cancellation takes effect [PLACEHOLDER: when cancellation takes effect, e.g. at the end of the current billing month].",

No other file needs to change. Severity should be low rather than medium.

## 12. [medium] [seo-tech] src/lib/seo/jsonld.tsx:99

**Issue:** faqLd() publishes founder placeholders as structured data. docs/tasks/006-pages.md wires FAQPage on /pricing to pricingFaq, and two of its answers contain placeholder text (src/content/pricing.ts:86 "There is no minimum term [PLACEHOLDER]." and :94 "we send an invoice [PLACEHOLDER: payment method]"). organizationLd/serviceLd guard against this via isPlaceholder(), but faqLd does not, and the existing 'no placeholders' test in tests/content/seo-copy.test.ts (line ~144) does not include faqLd(pricingFaq), so the leak is untested.

**Fix:** Proposed fix is fine as written. Optional hardening of the test only (src/lib/seo/jsonld.tsx change unchanged):

export function faqLd(items: readonly FaqItem[]): JsonLdNode {
  const publishable = items.filter((item) => !isPlaceholder(item.q) && !isPlaceholder(item.a));
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: publishable.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

In tests/content/seo-copy.test.ts, inside "emits expected types and no placeholders" (after line 146), add:

    const pricingFaqNode = faqLd(pricingFaq);
    expect(JSON.stringify(pricingFaqNode)).not.toContain("[PLACEHOLDER");
    expect((pricingFaqNode.mainEntity as unknown[]).length).toBeGreaterThan(0);

The second assertion guards against an empty (invalid) FAQPage if every item ever becomes a placeholder; the /pricing page should skip rendering the FAQPage node in that case.

## 13. [medium] [seo-tech] src/lib/seo/llms.ts:40

**Issue:** The "## Definitions" section breaks the llmstxt.org format. Per the spec, free-form content (paragraphs, lists) must come before the first H2; every H2 section is a "file list" whose items are markdown links `[name](url)` with optional `: notes`. Lines 40-43 emit an H2 whose list items are plain Q+A text with no link (`- What is GEO...? GEO, or ...`), so spec-following parsers (e.g. llms_txt2ctx) will drop or mis-parse these items. This is also the format noticr's own audit sells checks for.

**Fix:** Delete lines 40-43 ("## Definitions", "", ...definitions.map(...), "") and emit the definitions as heading-less paragraphs in the pre-H2 details area, immediately before the `Last updated: ${contentUpdated}` line (line 25):

    ...definitions.flatMap((f) => [`**${f.q}** ${f.a}`, ""]),

Resulting order: H1, blockquote, description paragraph, engines paragraph, definition paragraphs, Last updated, then "## Key pages" / "## Services" / "## Optional" (all link lists).

## 14. [medium] [conversion] src/content/pricing.ts:10

**Issue:** Three different stories about whether the price is fixed. pricing.ts shows flat prices ("$49", "$199", "$29" at lines 29, 44, 58); services.ts shows the same items as "From $49 / From $199 / From $29/month" (lines 29, 63, 94); contact.ts:10 and its meta description (line 6) say you will get "a fixed quote" by email; home.ts:183 says "Fixed scope, plain pricing". A local owner who sees $199 on /pricing, "From $199" on /services and "we'll send a quote" on /contact assumes the real number is higher and hidden. Nothing says what makes the price go above the starting figure.

**Fix:** Use "From" in both places and say once what moves it.

pricing.ts:29 -> price: "From $49 [PLACEHOLDER]",
pricing.ts:44 -> price: "From $199 [PLACEHOLDER]",
pricing.ts:58 -> price: "From $29 [PLACEHOLDER]",

pricing.ts:10, replace intro with:
  "The noticr audit is free. If you want a deeper review, hands-on fixes or ongoing monitoring, pick the option that fits. Prices shown are starting prices for a small site. If yours needs more, you get a fixed price by email before any work starts, and you pay nothing until you agree to it. One-time prices are paid once, and monitoring can be cancelled any month."

(Both price strings still contain "[PLACEHOLDER", so tests/content/seo-copy.test.ts keeps passing.)

## 15. [medium] [conversion] src/content/services.ts:70

**Issue:** "Entity" is a service name and a recurring selling point but is never explained, and "schema" / "structured data" are used bare. A dentist or plumber reading "Content & entity" (services.ts:67), "Entity checklist" (services.ts:75), "entity signals" (services.ts:36), "Entity and trust signals ... Organization or LocalBusiness schema" (home.ts:96-97) or "entity clarity" (home.ts:207) has no idea what is being sold. GEO, AI Overviews and llms.txt all get a definition; this term does not, and it is the one attached to a $149 service.

**Fix:** Keep the service name "Content & entity" and the slug `content-entity` unchanged (the slug is a contract; the label is also used at `contact.ts:18` and `site.ts:35`). Define the term once where it is sold and remove the other bare uses. No scope changes.

**`src/content/services.ts`**

Line 36, replace "answer-ready content and entity signals" so the sentence reads:
"We review crawler access, answer-ready content and the signals that tell engines who you are, and ask the engines a set of questions your customers would ask to see who they mention today."

Line 41, replace with:
"Organization or LocalBusiness schema check, and whether your business name is consistent across your site",

Line 70, replace the description with:
"Content and entity work makes your key pages easy to quote and makes your business easy to identify. An entity is your business as search and AI engines understand it: one name, one clear description and one set of details they can match across the web. We rewrite page openings into clear, answer-ready statements, add FAQs where they help, and align your name, description and details everywhere they appear.",

Line 75, replace with:
"A checklist for keeping your name, address and profiles consistent across the web",

**`src/content/home.ts`**

Line 96, replace with:
title: "Identity and trust signals",

Line 97, replace with:
body: "Structured data that states who you are (Organization or LocalBusiness schema), a consistent name, authors and visible dates.",

Line 207, replace the last sentence with:
"GEO adds extra weight on direct answers, a clear and consistent identity for your business, and letting AI crawlers in."

Leave "content and entity work" at `home.ts:183` and `services.ts:6` as they are: they name the service, which is now defined at `services.ts:70`. `services.ts:6` is also a `metaDescription` bound by the 120-155 character test.

## 16. [medium] [conversion] src/content/services.ts:90

**Issue:** The Monitoring offer is not concrete and the pricing FAQ argues against buying it. (a) "Alerts when AI crawlers or search engines get blocked" (services.ts:90, pricing.ts:64) implies continuous alerting, but the service is a once-a-month re-audit (services.ts:86, 88); a block that happens the day after the check is not caught for a month. (b) Nothing says how the buyer receives anything; with no dashboards in v1, "Short summary" (services.ts:89) needs to say it arrives by email. (c) "Cancel any month" (services.ts:91) is listed as a deliverable. (d) pricing.ts:78 tells local owners "Most local sites need a full audit and one fix sprint, then only occasional checks": an unbacked claim about customers that also tells them to skip the monthly tier.

**Fix:** Apply only the alert/delivery wording changes; leave pricing.ts:78 unchanged.

C:\Users\Ayush\Downloads\SEO\src\content\services.ts lines 88-91, replace the deliverables with:
      "Monthly re-audit of your key pages",
      "A short email on what changed since last month and what to fix",
      "A clear warning in that email if search engines or AI crawlers have been blocked",
      "Cancel any month by email",

C:\Users\Ayush\Downloads\SEO\src\content\pricing.ts lines 63-64, replace with (keep line 62 "Monthly re-audit of your key pages" and line 65 "Cancel any month" as they are):
      "A short plain-English email on what changed",
      "A warning if search or AI crawlers have been blocked",

Do not change pricing.ts:78.

## 17. [medium] [conversion] src/content/audit.ts:47

**Issue:** The paid CTAs are weak or misleading at the two points where intent is highest. (a) After the report, helpCta is a vague "Get help fixing this" -> "/contact" with no service preselected, although the matching offer exists (fix sprint) and /contact prefills its select from ?service= (docs/tasks/006-pages.md:12; pricing.ts already uses it). The reader who just saw a list of problems is not told that noticr will do the fixing. (b) On pricing, "Book a fix sprint" (pricing.ts:54) and "Start monitoring" (pricing.ts:67) promise a booking or an instant start, but both open the contact form: v1 has no checkout, and pricing.ts:94 says scope is agreed by email and work starts after an invoice is paid. The first tier is honest ("Request a full audit"); the other two are not, and the three verbs are inconsistent for the same action.

**Fix:** audit.ts:47 -> helpCta: { label: "Have us fix these for you", href: "/contact?service=technical-fixes" },

pricing.ts:54 -> cta: { label: "Request a fix sprint", href: "/contact?service=technical-fixes" },
pricing.ts:67 -> cta: { label: "Request monitoring", href: "/contact?service=monitoring" },

## 18. [medium] [self-audit] src/lib/seo/jsonld.tsx:133

**Issue:** webPageLd() has no author and no publisher, and dateModified is a required argument with no default, so callers must remember to pass contentUpdated themselves. A WebPage node rendered from this helper still fails the author check, and legal pages have no single obvious way to pass their own `updated` date versus the sitewide one.

**Fix:** In C:\Users\Ayush\Downloads\SEO\src\lib\seo\jsonld.tsx, make two changes (the first is required for the second to compile and must not depend on another finding).

1) Replace line 1:
import { site } from "@/content/site";
with:
import { contentUpdated, site } from "@/content/site";

2) Replace lines 132-146 with:
/** WebPage node with author, publisher and a last-updated date. dateModified defaults to the sitewide contentUpdated; legal pages pass their own `updated`. */
export function webPageLd(input: { name: string; description: string; path: string; dateModified?: string }): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "WebPage",
    "@id": `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.name,
    description: input.description,
    inLanguage: "en",
    isPartOf: { "@id": websiteId() },
    about: { "@id": organizationId() },
    author: { "@id": organizationId() },
    publisher: { "@id": organizationId() },
    dateModified: input.dateModified ?? contentUpdated,
  };
}

Callers: /privacy and /terms pass `dateModified: privacy.updated` / `terms.updated`; other inner pages omit it. This only reaches the rendered HTML on pages that actually render webPageLd() via <JsonLd>; no page does yet.

## 19. [medium] [self-audit] src/content/about.ts:15

**Issue:** No heading in any content file matches the engine's summary pattern (/tl;dr|summary|key takeaways|in short|at a glance|in brief|quick answer|the short answer|bottom line/ in src/lib/audit/checks/geo/answer-ready.ts), so `geo.answer-ready` (weight 15) is capped at 0.8 and our own report would list the issue `geo.answer-ready:no-summary`. I checked every title/heading string in home.ts, services.ts, pricing.ts, about.ts, contact.ts, audit.ts and legal.ts; 'summary' appears only inside list items, never in a heading.

**Fix:** Line 15: change `title: "What noticr does",` to `title: "noticr at a glance",`. The section body is already a genuine 55-word, 2-sentence summary of the product, and /about is one of the five nav links the crawler picks, so hasSummary() becomes true (the check ORs across crawled pages). Requires aboutSections titles to be rendered as h2/h3, which is the natural rendering.

## 20. [medium] [self-audit] src/lib/seo/jsonld.tsx:103

**Issue:** faqLd() publishes founder placeholders into FAQPage structured data. T006 renders faqLd(pricingFaq) on /pricing, and two answers contain placeholder text: src/content/pricing.ts line 86 ('There is no minimum term [PLACEHOLDER].') and line 94 ('we send an invoice [PLACEHOLDER: payment method].'). The file already has an isPlaceholder() guard (line 11, 'must not be published as structured data') but applies it only to the email; the vitest check 'emits expected types and no placeholders' never exercises faqLd(pricingFaq), so it passes anyway. AI engines and Google would quote the bracketed text as our answer.

**Fix:** Replace line 103 `mainEntity: items.map((item) => ({` with:
    mainEntity: items
      .filter((item) => !isPlaceholder(item.q) && !isPlaceholder(item.a))
      .map((item) => ({
(keep the body and close as `})),`). Recommended companion assertion in tests/content/seo-copy.test.ts: `expect(JSON.stringify(faqLd(pricingFaq))).not.toContain("[PLACEHOLDER");`.

## 21. [medium] [self-audit] src/content/legal.ts:5

**Issue:** Two rendered titles are below the engine's 30-character minimum (`seo.title`, 30-60 chars, -0.3 per page plus a `seo.title:length` issue): 'Privacy policy · noticr' is 23 chars and 'Terms of service · noticr' is 25 chars. The existing vitest only asserts the upper bound (<= 60), so this slipped through. All other titles measure 45-54 chars and all descriptions 139-155.

**Fix:** Line 5: `metaTitle: "Privacy policy: how we handle your data",` (48 chars with the ' · noticr' suffix).
Line 11: `metaTitle: "Terms of service: audits and paid services",` (51 chars with suffix).
The on-page H1s come from privacy.title / terms.title and llms.ts uses its own literals, so nothing else changes. Recommended companion assertion in tests/content/seo-copy.test.ts: `expect((page.metaTitle + TITLE_SUFFIX).length).toBeGreaterThanOrEqual(30)`.

## 22. [low] [seo-tech] src/app/robots.ts:46

**Issue:** `host: siteUrl()` makes Next emit a `Host: https://...` line (verified in node_modules/next/dist/build/webpack/loaders/metadata/resolve-route-data.js). Host is not part of RFC 9309; it was a Yandex-only directive that Yandex dropped in 2018, it expected a bare hostname rather than a URL with scheme, and robots.txt validators flag it as an unknown directive. With no env set it outputs `Host: http://localhost:3000`. The rest of the output is correct: the 19 named agents are emitted as stacked User-Agent lines sharing one rule group, which is a valid multi-agent group, and nothing important (/_next, /opengraph-image, /llms.txt) is disallowed.

**Fix:** Delete line 46 (`host: siteUrl(),`) and change the import on line 2 to `import { absoluteUrl } from "@/lib/seo/metadata";`.

## 23. [low] [seo-tech] src/lib/seo/metadata.ts:27

**Issue:** siteUrl() trusts NEXT_PUBLIC_SITE_URL verbatim. A scheme-less value such as `noticr.com` or `www.noticr.com` (an easy mistake in the Vercel env UI) makes `new URL(siteUrl())` at lines 61 and 86 throw `TypeError: Invalid URL` at module load, which fails every page plus robots.txt, sitemap.xml and llms.txt with an error that does not name the env var. A value with a path (e.g. `https://noticr.com/home`) would silently prefix every canonical, sitemap URL and JSON-LD @id with that path.

**Fix:** Normalise to an origin in siteUrl():

function toOrigin(raw: string): string {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return new URL(withScheme).origin; // no trailing slash, no path
}

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return toOrigin(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return toOrigin(vercel);
  return "http://localhost:3000";
}

(stripTrailingSlash can then be removed.)

## 24. [low] [seo-tech] src/lib/seo/jsonld.tsx:33

**Issue:** Organization.logo points at the 1200x630 social card (/opengraph-image), which is a full banner with tagline and footer text, not a logo. Google's Organization logo guidance expects a standalone mark that reads on a white background (min 112x112); a 1.9:1 card gets cropped or rejected for knowledge-panel/merchant use, and it tells AI engines the brand logo is a banner. No square brand asset exists in the project (only src/app/favicon.ico).

**Fix:** Serve the square logo from a plain route handler rather than the app/icon favicon convention, so no extra <link rel="icon"> is injected and favicon.ico stays the tab icon. The project already uses a dotted route folder (src/app/llms.txt/route.ts), and next.config.ts has cacheComponents: true, so do not add `export const dynamic`; with no request-time data the handler is prerendered like llms.txt.

1) New file src/app/logo.png/route.tsx:

    import { ImageResponse } from "next/og";
    import { site } from "@/content/site";

    const PAPER = "#F7F6F2";
    const INK = "#14130F";

    // Square brand mark for Organization.logo. Static: no request-time data.
    export function GET() {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: PAPER,
              color: INK,
              fontSize: 120,
              fontWeight: 700,
              letterSpacing: -6,
            }}
          >
            {site.name}
          </div>
        ),
        { width: 512, height: 512 },
      );
    }

2) src/lib/seo/jsonld.tsx lines 33-38 become:

    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo.png"),
      width: 512,
      height: 512,
    },

Keep line 39 (`image: absoluteUrl("/opengraph-image")`) unchanged.

If the reviewer's src/app/icon.tsx route is preferred instead, the artwork must be a single-glyph mark that still reads at 16px (e.g. a lowercase "s"), not the full wordmark, because that file also becomes a site-wide favicon link.

If no square asset is added at all, delete lines 33-38 (the `logo` property) and keep `image`.

## 25. [low] [seo-tech] src/lib/seo/jsonld.tsx:94

**Issue:** serviceLd puts the whole `forWho` sentence (e.g. "Founders and owners who want to know exactly what to fix, and in what order, before spending on content or ads.") into Audience.name. `name` is the entity's name; schema.org defines `audienceType` (Text, "the target group associated with a given audience") for exactly this, so consumers currently read a full sentence as the audience's name.

**Fix:** Replace line 94 with:

    audience: { "@type": "BusinessAudience", audienceType: service.forWho },

## 26. [low] [seo-tech] src/lib/seo/metadata.ts:78

**Issue:** Twitter images are passed as a bare URL string (`images: [OG_IMAGE.url]`, here and at line 108). Because twitter.images is set explicitly, Next does not fall back to the file-based image metadata (metadata-resolution-primitives.js only merges the static file when `images` is absent), so no `twitter:image:alt` is emitted on any page even though the alt text exists in OG_IMAGE.

**Fix:** Change line 78 and line 108 from `images: [OG_IMAGE.url],` to `images: [OG_IMAGE],` (the Twitter image descriptor accepts { url, alt, width, height }).

## 27. [low] [seo-tech] src/content/about.ts:4

**Issue:** Two metaTitles already contain the brand and then receive the ` · noticr` template suffix, so the rendered <title> and og:title repeat it: "About noticr: SEO and GEO for real businesses · noticr" (about.ts:4) and "Contact noticr about an audit or fix · noticr" (src/content/contact.ts:4). types.ts defines PageCopy.metaTitle as "<title> without brand suffix"; the duplicate brand token wastes title width and is a common trigger for Google title rewrites.

**Fix:** about.ts line 4: `metaTitle: "About us: SEO and GEO for real businesses",` (41 chars, 50 with suffix).
contact.ts line 4: `metaTitle: "Contact us about an audit or fix",` (32 chars, 41 with suffix).
Both stay unique and under the 60-char test limit.

## 28. [low] [self-audit] src/lib/seo/llms.ts:40

**Issue:** The '## Definitions' section breaks the llmstxt.org format the spec asks for: every H2 section must be a 'file list' whose items are markdown links `- [name](url): notes`, but lines 40-43 emit plain `- question answer` bullets with no link. Our own check only tests the leading '# ' so it passes today, but stricter llms.txt parsers drop or reject non-link items under an H2, and the definitions are the most quotable content in the file.

**Fix:** Move the definitions into the free-form area before the first H2 (prose is allowed there). Delete lines 40-43 (`"## Definitions", "", ...definitions.map(...), "",`) and insert after line 26 (the blank line following `Last updated`), before `"## Key pages"`:
    ...definitions.flatMap((f) => [`${f.q} ${f.a}`, ""]),
The existing llms.txt test (starts with '# noticr\n\n> ', has '## Key pages', Pricing link line) still passes.

