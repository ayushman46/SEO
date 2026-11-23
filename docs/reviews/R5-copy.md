# Review R5: copy, second round

Date: 2026-11-23. Read as a visitor from the production build at http://localhost:3210 (all 11 pages, plus /llms.txt), then checked against `src/content/*.ts`, `src/lib/audit/issues.ts`, `src/components/audit/labels.ts`, `src/lib/quote/*`, `src/lib/audit/score.ts`, `src/lib/db/*`.

## Verdict in short

The rewrite worked at sentence level. Prices, the 15-page and 8-fix scope, tax wording and the "simulated" / "one model's reading" rules are consistent across every page and the quote engine. No old price ($199, $29, $69, ₹14,999, "50 pages", a promised audit call) is left in rendered HTML or in `src/content`; the only leftovers are code comments (list B, item 12).

What is still wrong is not slop, it is the offer. The pitch the research says matters (fixed price, no contract, before/after proof per item) is not on the home page at all, because the two blocks that carry it are no longer rendered. The report then undercuts the pitch twice: a heading says "Your fixed quote" above a total that reads "From $356", and every issue carries a "$149" button that reads as a per-issue price. Fix items 1 to 8 and the site sells what it actually sells.

Not copy, but seen while reading: the build was made without `NEXT_PUBLIC_SITE_URL`, so canonicals and every link in /llms.txt point to `http://localhost:3000`. Check the production env.

## First screens

**/** First 60 words: "Be seen by people and by the machines they ask. Paste your website address. In about a minute you get scores and a ranked list of what stops Google and AI answer engines like ChatGPT and Perplexity from reading and quoting your site, with the fix for each. [Website address] [Run free audit] We only read public pages, the same way a search engine does. See a sample report."
Would they act: yes on the free audit, the field is right there. But the H1 is still the slogan, and nothing says noticr fixes things, what that costs, or that there is no contract. The owner escaping a retainer gets no signal until a price list six screens down. See edits 3 and 4.

**/pricing** First 60 words: "Prices for small teams and local businesses. The audit is free. Fixed prices. No contract, no minimum term, no exit fee. Before/after proof: we re-run the audit after the work and send you what changed. Our Full audit and Fix sprint are priced below typical freelancer and agency rates for the same scope. We confirm scope and a fixed quote in writing before any paid work starts."
Would they act: they would keep reading, which is the problem. Sixty words and no number. The H1 says who it is for, not what it costs, and the intro is six sentences, one of them an unsourced comparison. See edit 5.

**/audit** First 60 words: "Free audit. Audit your site for Google and AI search. [Website address] [Run free audit] We only read public pages, the same way a search engine does. Enter your website address. We read your homepage and up to five more pages, score them for SEO, GEO and mobile speed, and rank what to fix first. It takes about a minute."
Would they act: yes. This is the best first screen on the site. Two small fixes in edit 17.

---

## A. Edits, most damaging first

### 1. `src/content/audit.ts:177` (auditQuoteCopy.title)
Current: `"Your fixed quote"`
Replace: `"Your quote"`
Reason: on /sample-report this heading sits above "Total From $356" and "A person confirms the final price within 1 business day". A heading that says fixed over a total that says From is the worst line on the site for a buyer who has been burned. The engine only returns a fixed total when no line is a "from" price, there are 8 or fewer issues, 6 or fewer pages and no "involved" fix (`src/lib/quote/quote.ts:268-274`). /contact already calls it "Your quote" (`contact.ts:103`).

### 2. `src/content/audit.ts:197` (auditQuoteCopy.haveUsFix)
Current: ``haveUsFix: (priceText: string) => `Have us fix this · ${priceText}` ``
Replace: ``haveUsFix: (priceText: string) => `Add to my quote · ${priceText} for the whole service` ``
Reason: the sample report shows 18 issues, 11 of them with a "Have us fix this · $149" button. A shop owner reads that as 11 × $149. The code comment at `quote.ts:387` already says it is "the price of the whole service, not of this one issue"; the visitor is never told. The button also appears on issues the same report lists under "You can fix these yourself for free" and "Safe to ignore for now".

### 3. `src/content/home.ts:8` (hero.subtitle)
Current: `"Paste your website address. In about a minute you get scores and a ranked list of what stops Google and AI answer engines like ChatGPT and Perplexity from reading and quoting your site, with the fix for each."`
Replace: `"Paste your website address. In about a minute you get a free, ranked list of what stops Google and AI answer engines like ChatGPT from reading your site. Fix it yourself, or we fix up to 8 items for $149. No contract."`
Reason: the hero never says free in prose, never says noticr does the work, and never names a price. This puts the whole offer in the first 45 words.

### 4. `src/components/home/Sections.tsx:118` and `src/content/home.ts:193` (servicesTeaser.body, not rendered)
Current (in content, never shown): `"Eight services, each with a fixed scope and a price shown up front, each done by a person. Before/after proof: we re-run the audit after the work and send you what changed."`
Replace with, and pass it as `body` to the SectionHeading: `"Fixed prices, no contract. After the work we re-run the audit and send you what changed."`
Reason: the home page currently contains the words "no contract" zero times and "before/after" zero times. Both sentences exist in `home.ts` but nothing renders them (list B, item 9). This is the single place the pitch should sit, directly above the price list.

### 5. `src/content/pricing.ts:16-18` (pricingPage.title and intro)
Current title: `"Prices for small teams and local businesses"`
Replace: `"Fixed prices from $39, no contract"`
Current intro: `"The audit is free. Fixed prices. No contract, no minimum term, no exit fee. Before/after proof: we re-run the audit after the work and send you what changed. Our Full audit and Fix sprint are priced below typical freelancer and agency rates for the same scope. We confirm scope and a fixed quote in writing before any paid work starts."`
Replace: `"The audit is free. A person-reviewed Full audit is $39 and a Fix sprint of up to 8 fixes is $149. No minimum term and no exit fee. After the work we re-run the audit and send you what changed."`
Reason: numbers in the first screen. "Priced below typical freelancer and agency rates" is an unsourced comparison on a page that otherwise sources its one comparison (OneCity); cut it. The last sentence repeats step 2 and 3 of "What happens after you order" on the same page.
Note: the intro shows in both currency views, so either accept dollars in the INR view or make the intro currency-aware.

### 6. `src/app/(marketing)/pricing/page.tsx:91-94` ("Rates" strip)
Current (rendered): `Rates  Fixed prices. No contract, no minimum term, no exit fee.`
Replace: DELETE the FIXED_LINE span (keep the currency switch).
Reason: the same sentence is in the intro 40 pixels above. House rule 2, one fact one place.

### 7. `src/components/pages/ServiceBlock.tsx:42`
Current: `Get a quote<span className="sr-only"> for {service.name}</span>`
Replace: `Request this<span className="sr-only">: {service.name}</span>`
Reason: six of the eight cards have a fixed published price. "Get a quote" next to "Price $149" tells the buyer the price is not the price. /pricing already uses "Request a fix sprint".

### 8. `src/content/services.ts:8-10` (servicesPage.title and intro)
Current title: `"Get found on Google and cited by AI, without hiring an agency"`
Replace: `"Fixed-price SEO and GEO services, done by a person"`
Current intro: `"Eight services, each with a fixed scope and done by a person. You get the price in writing before we start. None of them can promise what Google or an AI will say."`
Replace: `"Eight services, each with a fixed scope and a published price. No contract. After the work we re-run the audit and send you what changed."`
Reason: "cited by AI" in an H1 implies the result the next paragraph says cannot be promised. The caveat is then stated again in three service descriptions and two "Not promised" bullets on the same page; the intro does not need it. The intro has no "no contract" and no proof line.

### 9. `src/content/contact.ts:27-33` (contactBudgetOptions) and the budget field
Current: `Under $100 / $100 to $300 / $300 to $1,000 / Over $1,000 / Not sure yet`, help `"Optional. Helps us suggest the right scope."`
Replace: DELETE the field from the form (keep the enum server-side so nothing breaks).
Reason: every published price is between $19 and $149 and the larger-job floor is $249. A budget dropdown that tops out at "Over $1,000" is the agency intake form the buyer is running from, and it tells them the fixed prices are an opening bid.

### 10. `src/content/pricing.ts:41-47` and `src/content/services.ts:28-29` (Full audit deliverables)
Current: `"A written plan: what to fix first, what can wait, what to ignore"` followed by `"A written walkthrough of your report, by email"`
Replace: DELETE the walkthrough line in both files.
Reason: it is what was left when the call was removed. A plan by email and a walkthrough by email are the same deliverable listed twice, and a buyer will ask what the second one is.

### 11. `src/content/pricing.ts:56-62` (Fix sprint features)
Current: `"Up to 8 fixes from your audit, agreed up front"`, `"robots.txt, sitemap and llms.txt set up"`, `"Structured data for your business and FAQs"`, `"Quick performance wins"`, `"Before/after proof for every fix"`
Replace: `"Up to 8 fixes from your audit, agreed up front"`, `"Typical fixes: robots.txt, sitemap, llms.txt, structured data, image sizes"`, `"On one site, on a platform we can access"`, `"Before/after proof for every fix"`
Reason: as written, nobody can tell whether robots.txt, structured data and speed work are extra to the 8 or are the 8. Same ambiguity in `services.ts:58-62`; apply the same change there.

### 12. `src/components/home/sample-report-data.ts:19-21,43-45` (home mock report) and `src/components/home/FeatureTabs.tsx:181`
Current: `severity: "critical"`, `title: "robots.txt blocks GPTBot and ClaudeBot"`, `impact: 9`; and `severity: "high"`, `title: "No llms.txt file"`, `impact: 4`
Replace: `severity: "high"`, `title: "robots.txt blocks ChatGPT search and Perplexity"`, keep impact; and swap the llms.txt row for `severity: "high"`, `title: "No business details in machine-readable form"`
Reason: the mock contradicts the product. The engine rates blocked training crawlers (GPTBot, ClaudeBot) low (`issues.ts:380`) and blocked search assistants high, never critical (`issues.ts:369`). It rates a missing llms.txt low (`issues.ts:402`), and /methodology says it "carries little weight". The real /sample-report shows "No llms.txt file" as Low and under "Safe to ignore for now". "Illustrative" does not cover showing severities the engine never produces.

### 13. `src/components/ui/IssueRow.tsx:14`
Current: `quick: "Quick win",`
Replace: `quick: "Quick fix",`
Reason: the real report says "Quick fix" (`audit.ts:45`). Same label, two names, on pages one click apart.

### 14. `src/components/audit/labels.ts:27`
Current: ``impact: (n: number) => `Up to +${n} pts`,``
Replace: ``impact: (n: number) => (n < 1 ? "Under +1 pt" : `Up to +${n} ${n === 1 ? "pt" : "pts"}`),``
Reason: the sample report prints "Up to +0 pts" on seven issues and "Up to +1 pts" on seven more (`IssueCard.tsx:114-117` rounds a positive impact down to 0). A gain of zero under a "Have us fix this" button is not a sales argument.

### 15. `src/content/home.ts:18` (problem.title), `:205-206` (nightSky), `src/components/home/Sections.tsx:176`
Current: `"People still search. More and more, they ask."`
Replace: `"Buyers now ask AI, not only Google"`
Current: `"The answer is written before anyone visits your site."`
Replace: `"Check whether AI assistants can read your site"`
Current body: `"When someone asks an AI assistant for the best clinic or café nearby, it has already chosen its sources. The free audit checks whether those engines can read and quote your site, and lists what to change if they can't."`
Replace: `"The free audit checks whether AI assistants can read and quote your site, and lists what to change if they can't."`
Current: `title="Questions, answered plainly"`
Replace: `title="Questions"`
Reason: three slogans left (house rule 4). "It has already chosen its sources" is drama and not accurate for assistants that search live. "Answered plainly" is the page praising itself.

### 16. `src/content/home.ts:178` (howItWorks step 3 body, also shown on /audit)
Current: `"Enter your email to see every issue, check and fix, plus ready-to-paste drafts. Export it as developer tickets or one prompt for a coding agent, or ask us to handle it."`
Replace: `"Enter your email to see every issue with its fix. Send the list to whoever builds your site, or have us fix it at a fixed price."`
Reason: a dentist does not know what a coding agent or a developer ticket is, and "ask us to handle it" hides the offer. The export wording belongs in the report, where it already is.

### 17. `src/content/audit.ts:10` (auditPage.intro)
Current: `"Enter your website address. We read your homepage and up to five more pages, score them for SEO, GEO and mobile speed, and rank what to fix first. It takes about a minute."`
Replace: `"We read your homepage and up to five more pages, score them for Google, AI answer engines and mobile speed, and rank what to fix first. About a minute. No email needed for your scores and top three issues."`
Reason: the first sentence repeats the field label directly above it. GEO is never defined on /audit. "No email needed" is the objection the visitor has at this moment and the page only answers it after the audit has run.

### 18. `src/content/services.ts:104` and `:143` (caveats stated twice per service)
Current (ai-fact-check description, last sentence): `" We cannot control what an AI says, and answers vary between runs, so our screenshots are a dated sample."`
Replace: DELETE. The "Not promised:" bullet at `:112` says it.
Current (ai-crawler-unblock description, last two sentences): `"A block set by your host is the host's decision. Our requests are simulated from our own servers, so they can be wrong in either direction, and being reachable does not mean being cited."`
Replace: `"Our requests are simulated from our own servers, so the real crawler may be treated differently."`
Reason: /services states a limit seven times (intro, two descriptions, two "Not promised" bullets, local AI, FAQ on /pricing). One per service is enough; "simulated" stays.

### 19. `src/content/home.ts:241` and `src/content/methodology.ts:235`
Current: `"No. Nobody controls what Google or an AI engine shows. We remove what stops your site being read and quoted."`
Replace: `"No. We cannot control what Google or an AI engine shows. We remove what stops your site being read and quoted."`
Current: `"Scores reflect good practice at the time of the audit. No one can guarantee a ranking or an AI citation."`
Replace: `"Scores reflect good practice at the time of the audit. We cannot guarantee a ranking or an AI citation."`
Reason: house rule 6 and the banned list ("nobody can"). Both dodge the test by one word.

### 20. `src/content/home.ts:233` (FAQ: why the email)
Current: `"Because we may contact you about the report, and we store your email with it. Scores and your top three issues need no email, and you can ask us to delete yours at any time."`
Replace: `"So we can contact you about your report. Scores and your top three issues need no email. You can ask us to delete it at any time."`
Reason: "we store your email with it" is a consequence, not a reason; it reads like a consent form.

### 21. `src/content/home.ts:29` and `:38-39` (problem points)
Current: `"Answer engines quote clear, self-contained statements. Vague hero copy and walls of marketing text rarely get cited."`
Replace: `"Answer engines quote short, clear statements. A page that never says what you do, where and for how much gives them nothing to quote."`
Current: `title: "Slow pages lose twice"`, `body: "Poor Core Web Vitals hurt rankings and conversions, and slow, script-heavy pages are harder for every crawler to read."`
Replace: `title: "Slow pages lose visitors and rankings"`, `body: "A slow page ranks lower on Google and loses visitors on phones. Pages that depend on heavy scripts are also harder for crawlers to read."`
Reason: "hero copy", "Core Web Vitals" and "conversions" are trade words on the page written for the owner (house rule 7); "lose twice" is a slogan.

### 22. `src/content/home.ts:63,82,124` (tab bullets)
Current: `title: "Canonicals, robots and sitemap"`
Replace: `title: "Indexing, robots.txt and sitemap"`
Current: `"Which AI bots your robots.txt allows or blocks, plus a simulated fetch as those bots that names the layer refusing them, such as a firewall or CDN."`
Replace: `"Which AI bots your robots.txt allows or blocks, plus a simulated request as each bot to see whether a firewall refuses it."`
Current: `title: "Largest Contentful Paint"`
Replace: `title: "Time until the main content shows"`
Reason: same rule. The report itself already uses the plain version ("The main content takes too long to appear").

### 23. `src/content/services.ts:56`
Current: `"...on one site and a platform we can access: usually meta tags, canonicals, robots.txt, sitemap, structured data, llms.txt and quick speed wins."`
Replace: `"...on one site and a platform we can access: usually page titles and descriptions, robots.txt, sitemap, structured data, llms.txt and image sizes."`
Reason: "canonicals" and "quick speed wins" on a marketing page.

### 24. `src/content/contact.ts:72` and `:89`
Current: `directEmailLabel: "No public email: use the form and we reply by email."`
Replace: DELETE (render nothing).
Current: `"You pay nothing until you accept the quote. If we are not the right fit, we will say so."`
Replace: `"You pay nothing until you accept the quote."`
Reason: the first is an apology nobody asked for and step 2 already says the reply comes by email. "Not the right fit" is agency talk.

### 25. `src/content/about.ts:17,25,32`
Current: `"A small business has no easy way to tell whether Google and AI answer engines such as ChatGPT and Perplexity can read its website. noticr checks that for free in about a minute. Our paid services fix what it finds, with no agency retainer."`
Replace: `"noticr checks for free, in about a minute, whether Google and AI answer engines such as ChatGPT can read your website. Our paid services fix what it finds at a fixed price, with no contract."`
Current: `"Before we start, you get what we found, what is worth fixing and a fixed price. We never promise rankings or AI citations."`
Replace: `"Before we start, you get what we found, what is worth fixing and a fixed price. After the work we re-run the audit and send you what changed. We never promise rankings or AI citations."`
Current: `"Start with the free audit, or tell us about your site and we will reply by email with next steps."`
Replace: `"Start with the free audit, or tell us about your site and we reply by email within two working days."`
Reason: result first (rule 1); the proof line is missing from the page that explains how noticr works; the reply time is stated everywhere except here.
Not fixable by an editor: "done by a person" appears on six pages and /about names no person. Do not invent one. If the founder is willing to be named, one line here is worth more than every other edit in this list.

### 26. `src/lib/audit/issues.ts:844-846` and `:879-882` (over-explained issue text)
Current: `"We found no links to review profiles such as Google Business Profile, Trustpilot, G2 or Yelp. Evidence that this affects AI answers is mostly vendor-run and correlational, so it counts for little. We don't read the review sites themselves."`
Replace: `"We found no links to review profiles such as Google Business Profile, Trustpilot, G2 or Yelp. This counts for little in your score. We don't read the review sites themselves."`
Current: ``"We didn't find Bing's verification tag (`msvalidate.01`) on your homepage. Bing's index is confirmed to feed Microsoft Copilot; whether it feeds other assistants isn't confirmed. If you verified by DNS or an XML file, which we can't see, ignore this."``
Replace: ``"We didn't find Bing's verification tag (`msvalidate.01`) on your homepage. Bing feeds Microsoft Copilot. If you verified by DNS or an XML file, which we can't see, ignore this."``
Current (howToFix, last sentence): `" Then check the AI Performance report."`
Replace: DELETE.
Reason: "vendor-run and correlational" is a methodology footnote in the middle of a dentist's report; /methodology already carries it. "AI Performance report" is named and never explained.

### 27. `src/components/audit/labels.ts:76`
Current: `nextTitle: "What next?",`
Replace: `nextTitle: "Next steps",`
Reason: rule 4, no question headings outside an FAQ. The test only covers `title`, `kicker` and `heading` keys, so this one slipped through.

### 28. Meta
`src/content/pricing.ts:12` Current: `"Pricing: free audit, then pay as you go"` Replace: `"Pricing: free audit, fixed prices, no contract"` (55 rendered chars). Reason: nothing is pay-as-you-go; it is fixed price per job.
`src/content/services.ts:4-6` Current title: `"SEO and GEO services for small teams"` Replace: `"Fixed-price SEO and GEO services, no contract"` (54). Current description: `"Eight fixed-scope services from noticr: SEO and GEO audits, fixes, content, monitoring, AI fact-checks, local AI setup and AI crawler unblocking."` Replace: `"Fixed-price SEO and GEO services done by a person: Full audit $39, Fix sprint $149 for up to 8 fixes, monitoring $19 a month. No contract."` (138).
`src/content/home.ts:265` Current: `"Free SEO and GEO audit for startups and local businesses. Check what Google and AI answer engines need from your site, and get a ranked list of fixes."` Replace: `"Free SEO and GEO audit in about a minute, then fixed-price fixes done for you: Full audit $39, Fix sprint $149 for up to 8 fixes. No contract."` (142).
`src/content/contact.ts:6` Current: `"Tell us about your website and what you need, from a full SEO or GEO audit to hands-on fixes. We reply by email with next steps and a fixed quote."` Replace: `"Tell us about your website. A person replies by email within two working days with a fixed quote, and nothing starts until you agree to it."` (139).
All other titles (41 to 60 rendered) and descriptions (136 to 153) are in range and match their pages.

---

## B. Contradictions and claims that are not true of the product

1. **Larger jobs: "from $249" on the site, "From $149" in the report.** `pricing.ts:120` and `services.ts:56` say a job over 8 fixes "gets a fixed quote from $249". The quote engine, for more than 8 covered issues, only adds the reason text and prefixes the same total with "From" (`quote.ts:271-281`, `QUOTE_TEXT.review["issues-over-cap"]` at `quote.ts:127`); the Fix sprint line still shows $149 (`catalog.ts:83`). A visitor with 12 issues sees "From $149" in the report and "$249" on /pricing. Either the engine swaps to the $249 floor above the cap or the review text names it.

2. **"Fixed prices stay fixed" is not always true.** `pricing.ts:241` says it. In `quote.ts:268-281` a quote of fixed-price lines becomes "From ..." with "A person confirms the final price" when the audit read more than 6 pages, covers more than 8 issues, or contains one fix with effort "involved". The sample report shows it: the $149 sprint includes "Your site is slow on mobile" (Involved) and the total is "From $356". Suggested wording: `"A fixed price stays fixed unless the job is larger than its stated scope. We confirm any starting price within 1 business day."`

3. **Reply time: two working days or one business day.** `contact.ts:10`, `:64`, `:85` say "within two working days". `pricing.ts:241`, `contact.ts:114`, `quote.ts:121` and `quote.ts:365` say "within 1 business day". A visitor who arrives on /contact from the report sees both on one screen. Pick one number and one term ("working days" or "business days").

4. **Privacy says nothing is stored; methodology says it is kept 24 months.** `legal.ts:30` "Today we do not store them on our servers" and `legal.ts:69` "As of 23 November 2026 we do not run a database". `methodology.ts:242` says, with no condition, "We keep audit records (the address audited and its results, including any AI reading), report unlock emails and contact messages for up to 24 months, then delete them." Replace the methodology sentence with `"What we store and for how long is in the privacy policy."` and keep the NVIDIA sentence.

5. **The "no database" statement depends on an env var, and the code is ready to store everything.** `src/lib/db/audits.ts:11-22` inserts the full audit result and an IP hash, `src/lib/db/leads.ts:44` inserts email, URL, score, consent, IP hash and user agent, `src/lib/db/contact.ts:109-113` inserts the message, whenever `DATABASE_URL` is set (`src/lib/db/index.ts:39`; it is listed in `.env.example`, and /admin reads from it). The privacy text is true only while production has no `DATABASE_URL`. Confirm before launch; the policy promises to update the page first.

6. **"Then delete them" has no code behind it.** `legal.ts:70` and `methodology.ts:242` promise deletion at 24 months. The only delete in `src/lib` is the rate-limit cleanup (`src/lib/security/rate-limit.ts:138`). Fine if it is a manual process, but someone has to own it.

7. **Privacy, same paragraph, reads two ways.** `legal.ts:70`: "If we add a database, we will update this page first. We keep audit records, leads and contact messages for up to 24 months". The second sentence is present tense straight after "we do not run a database". Intended meaning is presumably "Once we do, we will keep ...". Owner to confirm; legal meaning should not be changed by an editor.

8. **Privacy under-describes the contact form.** `legal.ts:32` lists name, email, business name, website, service, budget and message. The contact action also stores the attached quote and the audit id and URL it came from (`src/lib/db/contact.ts:104-113`; `contact.ts:104` tells the visitor "It is sent with your message"). Add "and any quote you send with it".

9. **Orphaned copy after sections were removed.** In `home.ts` and never rendered on /: `hero.eyebrow` (:5), `hero.secondaryCta` (:10), `proofLine` (:13), `problem.kicker` (:17), all four `tabs[].body` (:49, :77, :115, :138, including the only plain definition of GEO outside the FAQ), `howItWorks.kicker` and `.title` (:165-166), `servicesTeaser.body` (:193) and the whole `pricingTeaser` (:196-201). Either render or delete; at the moment the content file describes a page that does not exist, and edit 4 depends on it.

10. **One product, three names.** "Technical fixes" (`services.ts:53`, footer, contact dropdown), "Fix sprint" (`pricing.ts:52`, FAQ, `services.ts:151`), "Technical fix sprint" (`catalog.ts:82`, shown in the quote). Same for the audit: "SEO audit" and "GEO audit" cards priced "Included in the Full audit · $39" (`services.ts:15`), with no "Full audit" card on /services to be included in. Suggest the display name "Fix sprint" everywhere (slug unchanged) and the price label `"$39 for the SEO and GEO audit together"`; check `src/lib/seo/jsonld.tsx:107` and `tests/quote/catalog.test.ts` before changing the label, both parse it.

11. **Unit of sale.** `pricing.ts:229` "Prices are per site". Local AI setup is "$99 per location" (`services.ts:136`). AI fact-check is "per location or product" on /services (`services.ts:113`) and unit `"site"` in the catalog (`catalog.ts:115`). Suggested tax note: `"Prices exclude applicable taxes. We show the total including tax in writing before you pay."`

12. **USD visitors cannot see four prices on /pricing.** The rupee view lists AI fact-check, local AI setup, crawler unblock and content under "India extras" (`pricing.ts:177-203`). The dollar view only says they "are priced on the services page" (`pricing.ts:120`); the prices appear once, inside an FAQ answer. Show the same four rows in both currencies; the data is in `services.priceFrom`.

13. **Old prices.** None in rendered HTML, `src/content` or /llms.txt. ₹3,999 on /pricing is the current AI fact-check and local AI price and matches `catalog.ts:104,114`; $49 is the current crawler-unblock price. Stale examples remain only in comments: `src/content/types.ts:31` ("From $49 [PLACEHOLDER]"), `src/components/home/Sections.tsx:94`, `src/components/pages/PricingCard.tsx:12`, `src/lib/quote/quote.ts:59,387`, `src/lib/seo/jsonld.tsx:107-108`, `src/lib/quote/catalog.ts:177`. Harmless; tidy when passing.

14. **Checked and consistent, no action:** 15 pages (pricing, services, quote note); 8 fixes (pricing, services, `QUOTE_SCOPE_CAP`); six pages for the free audit (home, audit, methodology, bot, privacy, engine cap); tax wording (pricing, terms, quote); payment and cancellation (pricing FAQ, terms); every methodology weight against `CHECK_WEIGHTS` in `score.ts:16-50` and the 45/35/20 split; every USD and INR price against `catalog.ts`; "simulated" used everywhere, "live" nowhere in visitor copy; the AI reading is never presented as ChatGPT's or Gemini's answer.

---

## What not to touch

/methodology, /bot, /terms and the report's issue titles and how-to-fix text read like someone who has done the work wrote them. The caveats there are specific ("We tested one URL only", "Menu names change over time") and earn their place. /audit needs two sentences changed. Leave the rest alone.
