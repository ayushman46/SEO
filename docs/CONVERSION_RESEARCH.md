# Conversion research: free audit to paid service (2026-11-23)

Question: what makes a first-time user of a free website audit pay, and how should seenhq design its free-to-paid path while purchase still means contact form plus invoice?

## How to read this

- Every number below comes from a page opened on 2026-11-23. The URL and the page's own date follow each claim.
- **[V]** = vendor or agency source with something to sell. **[I]** = independent (regulator, research group, filing, survey by a non-seller). **[S]** = self-reported by a single founder, tiny sample.
- "Not found" means searches and page fetches on 2026-11-23 did not produce usable evidence. It does not mean the evidence does not exist.
- Pages that refused to load (HTTP 403/404) and are therefore **not** used for any number: CXL "ungating your primary free offer", all seoptimer.com pages, Woorank pricing, HubSpot Website Grader (current page), Capterra subscription-fatigue survey, Indie Hackers threads, Reddit.
- Not inspected: seenhq's live report screen (no audit was run). Recommendations about the report are based on what /, /audit, /pricing, /services, /about and /terms say it contains.
- Effort figures are my estimates, not measurements.

## Where seenhq stands today (pages opened 2026-11-23)

| Observation | Source |
|---|---|
| Free audit: scores plus top three issues free; "Enter your email to see every issue, every check and every fix." | https://seenhq.vercel.app/ and /audit |
| No sample report link, no description of how scores are calculated | https://seenhq.vercel.app/audit |
| No named person anywhere; "small SEO and GEO studio", "Remote, worldwide"; no email or phone on About | https://seenhq.vercel.app/about |
| Every paid CTA goes to a contact form: "Request a full audit", "Get a quote for SEO audit" (for a fixed $49 item) | https://seenhq.vercel.app/pricing, /services |
| Pricing page has no refund wording and no turnaround times | https://seenhq.vercel.app/pricing |
| Terms do have a refund rule: full refund if work has not started, "fair partial refund" once started; prices exclude applicable taxes | https://seenhq.vercel.app/terms |
| Three India add-ons show rupee prices on /pricing only; Content & entity has no rupee price | https://seenhq.vercel.app/pricing |
| Honest limits are already stated ("never promise rankings or AI citations") | /about, /services, /terms |

The honest-limits copy is a strength. The gaps are: nothing to verify before giving an email, no person, no price attached to the user's own result, and a contact form between a $49 decision and paying.

---

## Findings by theme

### 1. Free-tool-led growth: what is actually published

| Claim | Type | Source and date |
|---|---|---|
| HubSpot Website Grader launched February 2007, passed 1 million graded URLs in June 2009 and 2 million about seven months later. HubSpot says it was built for buzz, traffic, links and leads. **No lead or customer count is published.** | V | https://www.hubspot.com/blog/bid/5539/Website-Grader-Analyzes-Over-2-Million-Sites (undated, about Jan 2010) |
| Semrush ended 2024 with "over 1.0 million registered free active customers" and "approximately 117,000 paying customers". These are two stock figures, not a conversion rate, and Semrush is software, not a service. | I (SEC filing exhibit) | https://www.sec.gov/Archives/edgar/data/0001831840/000162828025008190/semrush8-kexhibit991q42024.htm (2025-02-26) |
| Benchmark for self-serve freemium software: 3%-5% of new accounts paying within 6 months is "good", 6%-8% "great"; sales-assisted freemium 5%-7% good, 10%-15% great; free trial 8%-12% good. Survey of 1,000+ B2B SaaS products. Applies to software accounts, not to one-off service buyers. | I/V (newsletter with OpenView and Pendo) | https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion (2023-08-01) |
| Ahrefs trial history (secondary write-up): a card-required 14-day trial was abused and free-trial users outnumbered paying users two to one; a $7 for 7 days trial replaced it; growth did not change but support load fell. | Secondary, undated | https://www.btw.so/blog/ahrefs-product-led-content-marketing-strategy/ |
| Embedded audit forms sold to agencies: across MySiteAuditor customers the best pages convert over 30% of visitors to leads and the worst about 1%; pages with little besides the form converted almost 25%, text-heavy pages under 5%; each extra second of load time cost almost 1% conversion. Visitor-to-lead only; says nothing about lead-to-customer. | V (about 2016) | https://mysiteauditor.com/blog/?p=5061 |
| Insites case study: an agency whose reps pull audits live during prospect calls moved from 1 in 80 to 1 in 25 "from initial outreach to booking appointments". The page headline says "a quarter of all prospects", which does not match its own figures. | V (undated) | https://insites.com/success-stories/wordjack/ |
| Quiz-style lead magnets: 40.1% of people who start a quiz leave contact details (denominator is quiz starts, not visitors). Platform says these are "observational platform benchmarks, not the results of a controlled experiment". | V | https://tryinteract.com/blog/quiz-conversion-rate-report/ (updated 2026-09-08) |
| Seobility's free check allows 5 checks per day on the free plan; the upsell is a 14-day trial that renews at $69.90/month. | V (pricing fact) | https://www.seobility.net/en/seocheck/ (opened 2026-11-23) |
| Sitechecker plans start at $99/month with a 48-hour refund window. | V (pricing fact) | https://sitechecker.pro/plans/ (opened 2026-11-23) |
| SEOmator's free audit states "No account, no email — the full report renders right here", 172 checks, PDF export, one page per run. So a no-email full report is the current competitive baseline for a single page. | V (product fact) | https://seomator.com/free-seo-audit-tool (opened 2026-11-23) |

**Not found:** any published rate for "ran a free audit" to "bought a service" from HubSpot, Ahrefs, Semrush, Ubersuggest, SEOptimer, Seobility, Woorank or Sitechecker. SEOptimer agency case studies exist but the pages returned 403. Ubersuggest revenue or conversion numbers: not found.

**Smallest but closest evidence (single founders, treat as anecdotes):**

| Claim | Type | Source |
|---|---|---|
| A solo developer put a $99 "we fix it" CTA at the end of free scanner reports. Over 48 hours and "a few dozen" runs: zero clicks. The developer's 0.5-1% conversion estimate is a guess, not data. | S | https://dev.to/perufitlife/i-added-a-29-tripwire-next-to-my-99-security-audit-hormozi-math-on-solo-dev-offers-5f0m (posted May 18, year not shown, likely 2026) |
| A founder gave 25 manual free audits (short video plus one-page PDF, about 40 minutes each) and reports 6 buyers of a $99 full report. The buyers were the people who had replied with a specific question. The post's weekly breakdown does not add up to 6, and the author sells a kit teaching this method. | S | https://dev.to/_omqxansi_258d1166f7/i-gave-away-free-brand-audits-for-2-weeks-heres-what-actually-converted-2gll (posted May 6, likely 2026) |

Reading: a CTA bolted to the end of an automated report is not enough on its own, and replies/questions are the behaviour most linked to buying in the one case that reports it. Both are too small to generalise.

### 2. Email gate, partial report, full report

| Claim | Type | Source and date |
|---|---|---|
| "Give your users something before you ask for anything from them." Asking for an email too early makes users suspicious and prone to entering false details. Cites Gamberini et al. (2007): people who received content first gave more information, but more people submitted the form when it came first. So gating raises form count and lowers data quality and trust. | I | https://www.nngroup.com/articles/reciprocity-principle/ (2014-02-16) |
| Alternating-day test on a white paper: ungated days produced 47 times more downloads; all leads came from gated days. Conclusion: decide whether you are optimising reach or leads. One consultant's test. | S/secondary | https://www.practicalecommerce.com/Content-Downloads-vs-Lead-Generation (2013-11-22) |
| Unbounce's review of gating found no clean gated-versus-ungated comparison and calls the comparison "apples and oranges". | V | https://unbounce.com/content-marketing/gated-content/ (2014-08-08) |
| Baymard: among shoppers who abandoned for a reason other than browsing, 18% left because the site required an account, 19% because they did not trust the site with card details, 12% because they could not see the total cost up front. Retail checkout data, not B2B services. | I | https://baymard.com/blog/cart-abandonment-rate-statistics (2026-10-28) |

**Not found:** a controlled test of "partial report then email gate" versus "full report, no gate" for an SEO audit tool. CXL's ungating case study could not be opened.

Reading for seenhq: the gate itself is defensible (it is how a services business gets a way to follow up), but competitors show a full single-page report with no email, and a brand with no named person and no sample is asking for trust before giving a way to check it. The safer design is to give more before the gate (sample report, all issue titles, the price) and gate convenience (fix steps, export, saved link).

### 3. What happens after the report

| Claim | Type | Source and date |
|---|---|---|
| Workato sent demo requests to 114 B2B companies: 1 replied by email within 5 minutes, none by phone; average personalised email reply took 11 hours 54 minutes; nearly 1 in 5 never emailed back. | V (study by a seller, simple method) | https://workato.com/the-connector/lead-response-time-study (2026-03-19) |
| HBR (Oldroyd, McElheran, Elkington): "most companies are not responding nearly fast enough" to online leads. The numeric findings are behind the paywall and are **not quoted here**. | I | https://hbr.org/2011/03/the-short-life-of-online-sales-leads (March 2011) |
| Omnisend platform data for 2025 (27,000+ brands): automated emails had about the same open rate as campaigns (30.21% vs 30.41%) but a click rate of 4.66% vs 0.74%; welcome emails opened at 35.53%. Mostly e-commerce senders. | V | https://www.omnisend.com/blog/email-marketing-benchmarks/ (2026-05-12) |
| Quote flow test for a B2B VoIP seller: replacing "a rep will contact you" with an instant quote after a shorter form, plus reassurance copy, raised lead rate by 262.3%. Several things changed at once; no sample size given. | V/research org | https://marketingexperiments.com/?p=10874 (2012-09-26) |
| Trex cost calculator: three tests moved the calculator's conversion from roughly 16% to 24%; the agency's "about 50% average lift" does not match its own per-test numbers. | V | https://www.seerinteractive.com/work/case-studies/trex-calculator-conversions-lift (undated) |
| NN/g on configurators: complex, slow and error-prone; only highly engaged customers use them. It recommends sample prices for typical scenarios instead. | I | https://www.nngroup.com/articles/show-price/ (2013-12-01) |

**Not found:** evidence comparing email sequence versus call versus self-serve checkout for sub-$200 productised services.

Reading: an instant price computed for the user beats "we will get back to you", but it should be automatic from the audit result, not a calculator the user has to operate. A fast human reply is rare, so it is a cheap way to stand out, provided the promise is kept.

### 4. Pricing evidence

| Claim | Type | Source and date |
|---|---|---|
| WebFX survey of 250 US businesses on audit spend: under $50: 1.72%; $50-$100: 9.48%; $101-$500: 20.69%; $501-$750: 22.41%; $751-$1,000: 11.21%. Startups with 1-10 staff: $50-$750. The page contradicts itself elsewhere ("$650-$14,000"), so treat as rough. | V | https://www.webfx.com/seo/pricing/how-much-does-seo-audit-cost/ (schema dates 2025-09-24 / 2026-10-20) |
| Ahrefs poll of 439 SEO providers: 78.2% offer retainers, 48.9% per-project, 34.8% hourly. Most common per-project band $2,501-$5,000. India is the outlier: 93.75% of India-based providers charge $1,500 or less per project and 85.7% charge $30 or less per hour. Sellers' prices, not buyers' budgets. | V (tool vendor, large sample) | https://ahrefs.com/blog/seo-pricing/ (updated 2024-08-15) |
| Of 12 audit providers reviewed, only two publish a standalone audit price: Loganix $500 and $750 (about ten days) and The HOTH $1,000 (20-30 business days). None of the 12 states refund terms on the pages reviewed. | V (review site that sells a competing service) | https://thestacc.com/best/seo-audit-services/ (checked 2026-11-06) |
| An Indian consultant sells a fixed-price audit at ₹25,000 including GST ($299), seven working days, bought via contact form or WhatsApp after an intake call; no refund terms, no sample report mentioned. | V | https://gauravtiwari.org/services/seo-audit-services/ (opened 2026-11-23) |
| One-time GEO packages at $297 / $597 / $997 with "30-day citation results or money back" on the middle tier; packages are bought by email, not checkout; no founder named. | V | https://onetimegeo.pages.dev/ (opened 2026-11-23) |
| Earlier seenhq research (not re-opened today): median one-time GEO audit $4,300; India retainers ₹25,000+/month; one India programme at ₹3,999/month with a 3-month minimum. | see doc | C:\Users\Ayush\Downloads\SEO\docs\MARKET_RESEARCH.md |
| Google: "No one can guarantee a #1 ranking on Google." An audit "should be about giving you realistic estimates of improvement, and an estimate of the work involved." Google also tells buyers to ask past clients whether the SEO was useful. | I | https://developers.google.com/search/docs/fundamentals/do-i-need-seo (no date shown) |

**Not found:**
- What small-business owners or indie founders say they would pay for an audit or fix sprint in their own words (Reddit and Indie Hackers threads could not be opened).
- A survey of small-business preference for one-time versus subscription for services (the Capterra survey is consumer data and returned 403).
- Evidence that pay-after-results or credit models convert better for small SEO services. Google's warning about guarantees is the only solid source and it points against results-based promises.
- Independent India SMB willingness-to-pay data. All rupee figures found are sellers' list prices.

Reading: seenhq's $49 / ₹3,999 audit and $199 / ₹14,999 sprint sit at the bottom of every published range, so price is unlikely to be the main objection. At that price, the friction of a contact form, an invoice and an unknown seller is a larger share of the total "cost" to the buyer than the money.

### 5. Money-back guarantees

| Claim | Type | Source and date |
|---|---|---|
| Course seller: adding "60-day money-back guarantee" under the buy button raised sales 29% versus 10% for a value reminder. No sample size or significance reported; client unnamed. | V | https://conversion-rate-experts.com/button-microcopy-win-report/ (undated) |
| KitchenAid: promoting an existing 90-day guarantee on product pages cut orders by a double-digit percentage. Explanation given: a trusted category leader does not need it, so the message introduced doubt. | V (agency podcast) | https://conversion.com/podcast/the-conversion-podcast-bonus-episode-4/ (undated) |
| GoodUI lists five guarantee tests (for example Reverb.com, 488,288 visitors) but the results are paywalled. | V | https://goodui.org/patterns/103/ |
| Sitechecker offers a 48-hour full refund; seenhq's own terms already promise a full refund before work starts. | fact | https://sitechecker.pro/plans/ ; https://seenhq.vercel.app/terms |

Reading: evidence is mixed and all vendor-reported. The KitchenAid explanation suggests guarantees help where buyers have real doubt about the seller, which is exactly the position of a new, unnamed studio. There is no evidence a guarantee helps at seenhq specifically; it is cheap to add and must be one seenhq can honour.

### 6. Trust for a company with no testimonials

| Claim | Type | Source and date |
|---|---|---|
| Stanford Web Credibility guidelines, from three years of research with over 4,500 people: make it easy to verify accuracy; show there is a real organisation; show honest and trustworthy people stand behind the site; make it easy to contact you; show the content was reviewed recently; use restraint with promotional content; avoid errors of all types. | I | https://credibility.stanford.edu/guidelines/index.html |
| NN/g: hiding prices makes users leave for competitors and creates a negative halo over the whole brand; show sample prices for typical scenarios when exact prices are impossible. Qualitative usability findings, no statistics. | I | https://www.nngroup.com/articles/show-price/ (2013-12-01) |
| Adding a named team member's photo and introduction to a calculator page raised completions 79%; the headline and question format changed at the same time. | V | https://conversion-rate-experts.com/person-on-the-page-win-report/ (undated) |
| FTC rule on reviews and testimonials: bans fake or AI-generated testimonials, testimonials from people without real experience, undisclosed insider reviews and bought social proof; civil penalties for knowing violations. | I | https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials (2024-08-14) |

**Not found:** experiments on sample reports, methodology pages, public changelogs or open data as trust signals. The case for them rests on the Stanford guidelines ("easy to verify") and Google's advice, not on measured lifts.

### 7. Honest behavioural design and the legal floor

| Claim | Type | Source and date |
|---|---|---|
| Informal poll of almost 700 SEOs: 56% say fewer than 40% of their recommendations get implemented; 82% say fewer than 70%. Supports "the fix is the bottleneck, not the diagnosis". Twitter poll, 2021. | I (informal) | https://www.seroundtable.com/seo-recommendation-implementation-poll-31485.html (2021-05-27) |
| Google says an audit should give an estimate of improvement and of the work involved. Supports labelling each issue with effort and expected effect. | I | https://developers.google.com/search/docs/fundamentals/do-i-need-seo |
| India's CCPA dark-pattern guidelines apply to platforms, advertisers and sellers offering goods or services in India and list 13 patterns, including false urgency, basket sneaking, confirm shaming, forced action, subscription trap, interface interference, bait and switch, drip pricing, disguised advertisement, nagging, trick question and SaaS billing. | I (law-firm summary of the guidelines) | https://www.barandbench.com/law-firms/view-point/ccpa-steps-in-to-curb-dark-patterns (2023-12-18) |
| FTC staff report on dark patterns names fake countdown timers, disguised ads, buried fees, hard cancellation and tricking users into sharing data. | I | https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers (2022-09-15) |
| Razorpay Payment Links: created from a dashboard, sent by SMS, email or WhatsApp; cards, UPI and wallets; "nearly 100 major currencies". Fees are not on the page and were not verified. | V (product fact) | https://razorpay.com/payment-links/ (opened 2026-11-23) |

Two seenhq-specific exposures follow from this list:
1. **Drip pricing.** Terms say prices exclude applicable taxes. A quote that shows $199 and an invoice that shows more is the pattern the Indian guidelines describe. Show the tax-inclusive total, or "no tax applies", in the quote itself.
2. **Forced action / consent.** The email gate also asks for agreement to be contacted. Keep the consent specific and keep the report email separate from marketing follow-ups, with a one-click stop. India's DPDP rules are being phased in; exact dates were not verified here and need a lawyer's check.

---

## Recommended changes, in priority order

Order is by expected effect on first-time buyers per hour of work, given the evidence above. No conversion numbers are predicted because none exist for this kind of offer.

### 1. Instant fixed quote generated from the audit result

**Build.** A "Your fix quote" block near the top of the report (and in the report email), computed from the issues found, visible without any extra form. Deterministic mapping from check results to services:

| Audit finding (check group) | Service line | Price shown (USD / INR) |
|---|---|---|
| AI crawlers refused by robots.txt or by server response on probed pages | AI crawler unblock | $149 / ₹9,999 |
| Title, description, heading, canonical, robots.txt, sitemap, structured data, llms.txt, quick performance issues, within the pages audited | Fix sprint | $199 / ₹14,999 (see cap below) |
| Weak answer-readiness, no FAQ, unclear About or business description | Content & entity | from $149 (no rupee price exists yet: set one, or show "quoted by email") |
| Local business detected (address, phone, opening hours, or LocalBusiness schema missing or inconsistent) | Local AI visibility setup | $149 / ₹9,999 per location |
| Conflicting facts across pages or schema (phone, price, hours) | AI fact-check | from $69 / ₹4,999 |
| Site has more pages than the free audit read, or the user wants a person's judgement first | Full audit | $49 / ₹3,999 |
| Offered only after a fix is bought, never pre-selected | Monitoring | $29 / ₹1,999 per month |

Rules that make the quote genuinely fixed:
- Define the base sprint scope in writing, for example "all issues listed below on the 6 pages we audited". If the result exceeds a set cap (issue count, or a platform seenhq cannot edit), the block says "This one needs a person to look. Fixed quote within 1 business day" instead of a number.
- List exactly which issues the price covers and which it does not. Show the total including tax, or say that no tax applies.
- State a real validity period ("valid 14 days, because sites change") and what seenhq needs from the buyer (CMS or host access).
- Recommend the smallest sensible package first. If the only serious problem is blocked crawlers, quote $149, not $199 plus $149.
- Currency by the visitor's choice, with a visible switch; never by hidden geo-pricing.

**Evidence.** NN/g show-price (hidden prices send users to competitors; show typical-scenario prices; avoid configurators). MarketingExperiments instant quote test (multifactor). Workato response-time study (humans reply slowly). Baymard (12% abandon when they cannot see total cost).
**Expected effect.** Removes the "what will this cost me" email round-trip, which is the largest step between report and decision. Likely the single biggest change.
**Effort.** 10-14 h (mapping table, cap rules, UI block, email block, tests).
**Constraint.** The price shown must be honoured. Tax-inclusive total to avoid drip pricing. No pre-ticked add-ons (basket sneaking). The quote is an offer, not a diagnosis of lost revenue.

### 2. Per-issue "Have us fix this" action

**Build.** On each issue card: effort, who usually does it, and two buttons with equal visual weight: "Fix it myself" (expands the steps) and "Have us fix this" (adds the issue to a small "fix list" tray that shows the running fixed price from the same mapping as change 1). The tray's single action is "Send me this quote" or "Pay and start" (see change 6). Carry the audit ID and selected issues into the contact form so the user types nothing twice.
**Evidence.** Implementation poll (most recommendations never get done). The single-founder case where buyers were those who engaged with a specific finding. The $99 CTA-at-the-end case with zero clicks suggests one generic end-of-report button is weak.
**Expected effect.** Puts the offer at the moment the user realises they cannot or will not do a fix; produces a specific request seenhq can answer quickly.
**Effort.** 5-7 h.
**Constraint.** The DIY path must stay complete and equally prominent (interface interference). No "No thanks, I like being invisible" wording (confirm shaming).

### 3. Sample full report viewable without an email

**Build.** `/sample-report`: a real, complete report rendered with the production components, linked from the homepage hero, the /audit form and the email gate ("See a full sample first"). Use seenhq's own site, or a demo site seenhq owns and labels as a demo. Include the quote block from change 1 so visitors see the whole path.
**Evidence.** NN/g reciprocity principle; Stanford guideline 1 (easy to verify); SEOmator shows a full report with no email. No experiment on sample reports was found.
**Expected effect.** Lets a sceptical visitor check quality before trusting an unknown brand with an email; should improve the quality of emails collected.
**Effort.** 3-5 h.
**Constraint.** Do not publish an audit of a third party's site without written permission. Do not stage a flattering fake; show a real result including the issues seenhq's own site fails.

### 4. Methodology and limits page

**Build.** `/methodology`: every check, what a pass and fail mean, how the three scores are weighted, which pages are read (homepage plus up to five), the user-agent and IPs used, what is simulated (AI-crawler probes come from seenhq's servers, not the real crawlers), what is not checked (backlinks, rankings, what AI assistants actually say, JavaScript-rendered content), known false positives (call-tracking numbers, external CSS), and a dated changelog of scoring changes. Link each issue card to its section.
**Evidence.** Stanford guidelines 1, 3 and 8; Google's description of a useful audit. seenhq's earlier research already lists honest limits per check.
**Expected effect.** Gives technical buyers (startup founders) a reason to believe the score; reduces "is this just a lead trap" suspicion.
**Effort.** 4-6 h, plus keeping the changelog current.
**Constraint.** Must match the code. An out-of-date methodology page is worse than none.

### 5. Refund and guarantee wording that seenhq can deliver

**Build.** Put the terms' refund rule on the pricing page, in the quote block and on every invoice, and add a delivery guarantee. Suggested wording:

> **What we guarantee.** You get a fixed price in writing before you pay. If we have not started, you get a full refund on request. Full audit: if the written plan is not useful to you, tell us within 7 days of delivery and we refund the $49. Fix sprint: every fix in your agreed list will pass the same check in a re-audit we send you. If one does not, we fix it at no charge or refund that item's share of the price. If we cannot get the access we need, we refund the part we could not do.
>
> **What we do not guarantee.** Rankings, traffic, or what any AI assistant says about you. Nobody can.

**Evidence.** Mixed, vendor-reported (CRE +29%; KitchenAid drop). Baymard trust figure. Google's warning rules out results guarantees. Competitor onetimegeo promises "citation results or money back", which seenhq's own research says cannot be measured reliably.
**Expected effect.** Lowers the risk of a first purchase from an unknown seller. Effect size unknown.
**Effort.** 2 h for copy and placement; ongoing cost is the occasional $49 refund.
**Constraint.** Define "started" (for example, when access is used or the first deliverable is sent). Refund within a stated number of days, to the original payment method. Do not call it "risk-free". Have the wording checked against the terms so the two never disagree.

### 6. A way to pay without a conversation

**Build.** Until a processor is integrated: after "Pay and start" or "Send me this quote", email the itemised quote with a payment link (a hosted payment link or UPI ID for India, invoice with card or bank details elsewhere) and a one-line "reply to change anything". Rename CTAs for fixed-price items from "Get a quote" / "Request" to "Order the $49 audit". Add a three-step "what happens next" under every paid CTA: quote now, pay by link, work starts within N business days.
**Evidence.** Baymard (payment and account friction); MarketingExperiments (removing the "a rep will contact you" step); Razorpay product page for feasibility.
**Expected effect.** Lets a $49 decision close in one sitting instead of an email thread.
**Effort.** 3-6 h plus payment-provider onboarding time (identity checks; international card activation needs separate approval).
**Constraint.** Provider fees and international acceptance were not verified. Invoices must meet tax rules where seenhq is registered; ask an accountant. No stored cards and no auto-renewal for monitoring until the buyer has explicitly agreed to recurring billing (SaaS billing, subscription trap).

### 7. A named person

**Build.** On /about and in the report footer and emails: founder name, photo, city, one paragraph of relevant background, a real reply-to address, and typical reply time. Sign the follow-up emails with that name.
**Evidence.** Stanford guidelines 2, 4 and 5; CRE named-person test (confounded); Google tells buyers to check who they are hiring.
**Expected effect.** Removes the most visible reason to distrust the site today.
**Effort.** 2 h.
**Constraint.** Real identity only. No stock photos, no invented team.

### 8. Effort and impact on every issue, plus "what we would ignore"

**Build.** Each issue gets: effort band (under 15 minutes / about an hour / needs a developer), who can do it, what it affects (indexing, snippets, AI-crawler access, speed) and confidence (measured / simulated / opinion). Add a short "Safe to ignore for now" list (for example llms.txt, which seenhq's own research found is rarely fetched).
**Evidence.** Google: an audit should estimate improvement and work involved. Implementation poll. seenhq's pricing page already promises "what to fix first, what to defer, what to ignore" for the paid audit.
**Expected effect.** Makes the free report credible as advice rather than a scare list, and makes the effort visible, which is what makes paying for a fix rational.
**Effort.** 6-8 h (one-time labelling of each check plus UI).
**Constraint.** Do not attach traffic or revenue numbers to issues. Effort bands are estimates and must say so.

### 9. Give more before the gate

**Build.** Without email: scores, all issue titles with severity and effort, full detail on the top three, and the quote block. With email: fix steps for every issue, export (PDF, tickets, agent prompt), saved report link, re-audit. Add "See a sample first" and one line on what the email will be used for at the gate. If traffic allows, test this against the current gate, measuring paid orders and replies, not emails captured.
**Evidence.** NN/g reciprocity; practicalecommerce test (gating trades reach for leads); SEOmator's no-email baseline. No controlled test for audit tools found.
**Expected effect.** Fewer but better-qualified emails, and more people seeing a price. Direction on paid orders is uncertain, which is why it should be measured.
**Effort.** 3-5 h, plus 2 h for a split test.
**Constraint.** Keep consent to follow-up contact separate from the request for the report (forced action).

### 10. Follow-up flow: three emails, then stop

**Build.**
1. Immediately: the report link, the three highest-effect issues, the quote block, and one question: "Which of these do you want gone first? Reply and a person answers within 1 business day."
2. Day 3: one useful thing they can do themselves in under 15 minutes from their own report, plus the quote link.
3. Day 10 to 14: an offer to re-run the audit free so they can see what changed; quote link; "this is the last email unless you reply".
Every email plain text, from the named founder, with a working one-click stop.
**Evidence.** Single-founder case (buyers were the ones who replied with a question); Omnisend (triggered emails are clicked far more than campaigns, e-commerce data); Workato (fast human replies are rare).
**Expected effect.** Turns a one-visit tool into two or three chances to start a conversation, without pressure.
**Effort.** 5-7 h.
**Constraint.** Only email people who agreed to contact. Three emails is the cap (nagging). No "your quote expires tonight" unless a real, stated validity date is ending.

### 11. Pricing page repairs

**Build.** Add turnaround per service; the guarantee block; tax-inclusive or "no tax applies" statement; USD and INR for every service including Content & entity; a "typical first purchase" example with a real total; "what happens after you order" steps; link to sample report and methodology.
**Evidence.** NN/g show-price; Baymard total-cost figure; thestacc review shows published turnaround and refund terms are rare among audit sellers, so stating both is a differentiator.
**Expected effect.** Answers the questions that today require an email.
**Effort.** 3-4 h.
**Constraint.** Turnaround must be one seenhq can keep with current capacity.

### 12. "Cost of doing nothing" only where the audit has proof

**Build.** For issues with direct evidence, state the observed fact and its mechanical consequence: "Your server returned 403 to GPTBot on 4 of 6 pages at 14:02 UTC. While that holds, that crawler cannot read these pages." For everything else, say nothing about cost. Where a general statistic is used, cite it inline with source and date and label vendor studies.
**Evidence.** Stanford guideline 1; CCPA false-urgency rule (urgency backed by fact is treated differently); seenhq's own research notes most AI-visibility statistics are vendor-produced.
**Expected effect.** Makes the few genuinely urgent findings stand out and keeps the rest credible.
**Effort.** 3-4 h.
**Constraint.** No revenue or traffic loss estimates. Simulated probes must be labelled as simulated.

### 13. Measure the funnel before changing prices

**Build.** Events: audit started, audit finished, sample viewed, gate shown, email given, quote viewed, "have us fix this" clicked (per issue type), quote emailed, reply received, payment made, refund requested. One weekly table. Keep a short log of every buyer and non-buyer reply in their own words.
**Evidence.** Every benchmark found is for software or e-commerce; none transfers. Willingness to pay at seenhq's prices is untested in both this and the earlier research.
**Expected effect.** Replaces borrowed benchmarks with seenhq's own numbers within weeks; tells which service the audit actually sells.
**Effort.** 3-4 h.
**Constraint.** No third-party trackers that contradict the privacy page; aggregate counts are enough.

### 14. Build proof honestly as it arrives

**Build.** With written permission, publish before/after re-audit pairs (check results, not rankings) and the client's own words with name and business. Until then show nothing in the testimonial slot, or show real, checkable facts: number of audits run (true count), date of last methodology change, the sample report.
**Evidence.** FTC rule on fake testimonials; Stanford guidelines; Google's "ask past clients".
**Expected effect.** Slow but compounding; the first three real cases matter more than any copy change.
**Effort.** 2 h to build the template; about 1 h per case.
**Constraint.** Disclose any discount or free work given in exchange for a case study. Never write or edit a client's quote for them.

### 15. Reply-time promise

**Build.** State "A person replies within 1 business day (Mon-Fri, IST)" next to every contact point and in email 1, and route form submissions to a phone notification so it is kept.
**Evidence.** Workato study; HBR (qualitative).
**Expected effect.** Small, cheap trust signal that also raises the odds of catching a buyer while the report is open.
**Effort.** 1 h.
**Constraint.** Only promise what a small team can keep, including weekends and holidays wording.

---

## What not to do

| Do not | Why |
|---|---|
| Countdown timers, "3 slots left this week", "price rises Friday" unless literally true and stated with the reason | False urgency: CCPA guidelines (India), FTC dark-patterns report |
| Invented testimonials, logos, review stars, "500+ audits delivered" style counts that are not true, AI-written reviews | FTC reviews rule; unfair trade practice in India |
| Pre-ticked monitoring add-on in the quote, or monitoring that renews without explicit agreement | Basket sneaking, SaaS billing, subscription trap |
| Showing $199 and invoicing $199 plus tax without saying so first | Drip pricing; Baymard total-cost finding |
| Scores tuned to look worse than the methodology supports, or red "critical" labels on low-impact items such as llms.txt | Destroys the "easy to verify" trust the page depends on; contradicts seenhq's own research |
| Revenue-loss or traffic-loss figures per issue | No evidence behind them; every such figure found during this research was modelled by a vendor |
| Ranking, traffic or AI-citation guarantees, or "pay only if you rank" | Google's guidance; answers vary run to run per seenhq's earlier research |
| "No thanks, I don't want customers" decline links | Confirm shaming |
| Hiding the DIY fix steps to push the paid fix, or making "fix it myself" visually weaker | Interface interference; the free report's honesty is the product's main asset |
| More than three follow-up emails, or follow-ups to people who did not agree to contact | Nagging; consent |
| Claiming "no one else does this" or "the only" | Earlier seenhq research found competitors for most services |
| Quoting benchmark conversion rates from this document as seenhq targets | They are for software, quizzes or e-commerce, mostly vendor-reported |

## Open questions this research could not answer

1. What share of free-audit users buy a done-for-you service at $49 to $199. No published figure found for any comparable tool.
2. Whether seenhq's buyers prefer one-time or monthly. No SMB survey found.
3. Whether the email gate helps or hurts paid orders for seenhq. Needs change 13 and a split test.
4. Whether Indian small businesses will pay ₹3,999 for an audit. Only sellers' list prices were found.
5. Whether a guarantee raises orders for a new service brand. Evidence is mixed and from other categories.
6. Payment-provider fees, international acceptance and tax treatment for seenhq's set-up. Not verified; needs the provider's pricing page and an accountant.
