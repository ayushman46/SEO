# Market gap research (2026-11-22)

Method: 7 research angles with live web sources, 30 candidates merged to 9, each checked by 3 adversarial verifiers (evidence, competition, deliverability). Counts: {"candidates":30,"merged":9,"passedAll":3,"passedTwo":6,"rejected":0}

## Market summary

Consumer use of AI assistants for local choices is now mainstream: BrightLocal's 2026 survey of 1,002 US adults found 45% use ChatGPT or similar tools for local business recommendations, up from 6% a year earlier (https://www.brightlocal.com/research/local-consumer-review-survey/), yet 46% of 1,002 local owners have not checked or do not know whether they appear in AI results (https://www.brightlocal.com/research/smb-report-confident-visibility/). Accuracy is the clearest unmet need: a survey of 3,608 small business owners found 14.8% had seen AI search show wrong information about their business and 34.4% were unsure (https://www.thesmallbusinessexpo.com/blog/ai-search-traffic-small-business/), a vendor study of 10,000 local businesses found 93% known to an AI platform but only 55% described accurately (https://insites.com/blog/what-ai-uses-to-choose-local-businesses-and-what-it-ignores/), and the only provider found selling a full check-trace-fix-retest service charges $1,000 to $15,000 (https://nohacks.co/accuracy). Measurement and diagnosis are already cheap or free, so they are not gaps: trackers start at EUR 29/month (https://otterly.ai/pricing) and $31-$65/month for local (https://www.brightlocal.com/pricing/), and one-off snapshots sell for $99 or less (https://whop.com/joined/ad-autopsy/products/ai-visibility-snapshot-is-your-business-in-chatgpt-s-answers/). What remains thin is low-priced, done-for-you fix work with honest re-testing, sitting below agency pricing where the starter GEO retainer is $1,800-$4,200/month with a 3-month minimum and the median one-time audit is $4,300 (https://firstpagesage.com/reports/geo-aeo-pricing-statistics/). The ground is moving: OpenAI opened ChatGPT Business Hub on 10 November 2026 (https://openai.com/index/introducing-businesses-chatgpt/), but local stores and restaurants can claim only existing US listings (https://help.openai.com/en/articles/20001635-setting-up-your-business-on-chatgpt), and Cloudflare changed new-domain defaults on 15 September 2026 to block training and agent bots on pages with ads (https://blog.cloudflare.com/content-independence-day-ai-options/). Silent blocking is measurable: in one scan of 591 sites, 100 refused GPTBot or ClaudeBot and only 4 said so in robots.txt (https://hackernoon.com/i-found-my-own-website-blocking-chatgpt-then-i-checked-640-others). India is ChatGPT's largest market by weekly users per OpenAI's India head (https://inc42.com/buzz/india-becomes-chatgpts-largest-market-globally-user-base-doubles-since-january/), while most published Indian GEO pricing is retainer-based at Rs 25,000 per month and up, with one newer programme at Rs 3,999/month on a three-month minimum (https://businessnewsthisweek.com/?p=446666). Caveats that apply throughout: most accuracy and visibility statistics come from vendors selling related products, freelancer marketplace pages could not be opened so cheap gigs may exist, willingness to pay at seenhq's prices is untested, and repeat-run overlap of AI answers is only 21-33% (https://www.brightlocal.com/research/local-ai-visibility-study/), so no service can promise what an AI will say.

## Recommended services

### 1. AI Fact-Check and Fix (`ai-fact-check-and-fix`) — confidence: medium

**Buyer:** Owner-run local businesses (clinics, restaurants, shops, trades, studios; one or a few locations) and small companies whose hours, phone, address, open/closed status, services or name are stated wrongly by AI assistants, or who have never checked.

**One line:** We check what ChatGPT, Gemini, Perplexity, Copilot and Google AI say about your business against your real facts, trace each wrong fact to its source, fix the sources you control, and re-test after 30 days.

**Gap:** The need is documented by independent news cases, an owner forum thread with no confirmed fix, and two owner surveys. Diagnosis alone is already cheap or free (Insites free audit, Apify fact-check at about $1.49 per check, Stork $29 report), so we do not sell diagnosis as the gap. The unserved part is the done-for-you work: source tracing, correction and re-test for a single small business. The only provider found selling that exact bundle (No Hacks) charges $1,000 for a 20-question check and $6,000-$15,000 for the fix. BrightLocal's $31-$65/month tracker lists no fact-accuracy feature and its platform works only in the USA, UK, Canada and Australia. Searches were not exhaustive, and Fiverr/Upwork gigs could not be opened, so the site must not claim that nobody else does this.

**Deliverables:**
- One-page truth sheet completed with the owner (name, address, phone, hours, open status, services, prices)
- Manual fact-check: 10-12 fixed customer questions on 4-5 AI surfaces, 2 runs each, in logged-out or temporary chats, with dated screenshots
- Scoring sheet marking each fact right / wrong / missing / confused with another business, with the cited source URL where the engine shows one
- Fixes on owner-controlled sources: website facts page, LocalBusiness/Organization schema, Google Business Profile, Bing Places, Apple Business, Yelp, plus up to 5 cited directories (owner does the verification steps)
- Up to 5 correction requests to third-party pages that were cited, plus in-product feedback filed on each engine
- ChatGPT Business Hub profile claim where the business is eligible (currently existing US listings for local stores and restaurants)
- Re-test at 30 days with a before/after sheet; a 5-question, 3-engine re-check inside the $29/month monitoring

**Suggested price:** $69 for the check alone (a 5-question lite version sits inside the $49 audit); $199 for the fix sprint including the 30-day re-test, single location, capped at 5 directories and 5 correction requests

**Effort:** Check 2.5-4 hours; fix plus re-test 4-8 hours; about 7-12 hours combined (verifier estimate)

**Honest limits:** We check and correct the sources AI reads; we cannot control what an AI says, cannot guarantee an answer changes or when, and our screenshots are a dated sample because answers vary between runs, accounts and countries (we test from India with the location set in the prompt, which may differ from what your local customers see).

**Competitors:**
- No Hacks accuracy service: $1,000 starter check, $6,000-$15,000 full fix, re-checks from $2,500/month
- BrightLocal Local AI Visibility: $31-$65/month per location, no fact-accuracy feature listed, USA/UK/Canada/Australia only
- Insites free AI visibility audit: scores accuracy, report only, aimed at agencies
- Apify 'AI Fact-Check' actor: about $1.49 per check, ChatGPT and Perplexity only, developer tool, no fixes
- Stork AI Reputation Report: $29 one-time, $9/month monitoring, no fixes
- Otterly.AI: EUR 29/189/489 per month, no accuracy check
- OpenAI Business Hub: free self-serve profile for ChatGPT only; local claims limited to existing US listings

**Evidence:**
- Search Engine Journal: no report alerts a business when an AI answer gives wrong hours or says it is closed; the audit is manual, repeated and logged. Cites a vendor (Searchable) test where 93% of 165 London businesses had at least one basic fact wrong or missing. (2026-07-20) https://www.searchenginejournal.com/ai-answers-about-your-locations-are-often-wrong-check-before-customers-do/582205/
- Google's AI Overview said The Viridian Bookshop (Ohio) had permanently closed; the owner learned from a customer, and the error kept returning even after she claimed and edited her Google Business Profile. Quote: "It was consuming my life because it was damaging us so much." (2026-09-04) https://clevelandmagazine.com/articles/willoughby-bookstore-confronts-google-ai-error-claiming-it-was-permanently-closed/
- A Google AI Overview said Anna Mae's Bakery (Ontario) would close on July 31, 2026; the owner got it corrected by typing a correction into the AI search bar, with no ticket, timeline or appeal process. (2026-07-26) https://ppc.land/google-ai-overview-forces-anna-maes-bakery-to-deny-fake-july-31-closing/
- Small Business Expo survey of 3,608 owners: 14.8% say AI-powered search showed incorrect information about their business and a further 34.4% are not sure (self-reported). (2026-09-29) https://www.thesmallbusinessexpo.com/blog/ai-search-traffic-small-business/
- BrightLocal survey of 1,002 US local business owners: 86% know consumers use AI to choose local businesses, but 46% have not checked or do not know whether they appear. (2026-10-21) https://www.brightlocal.com/research/smb-report-confident-visibility/
- Insites audit of 10,000 US local businesses (vendor study): ChatGPT gave a wrong phone number for 30.09% and Perplexity for 38.81% of businesses found; some mismatches may be call-tracking numbers. (2026-07-23) https://insites.com/blog/does-chatgpt-hallucinate-local-businesses-the-data-on-ai-accuracy/
- BrightLocal study of about 200,000 local AI prompts: repeat-run overlap was only 23% (ChatGPT), 21% (AI Mode) and 33% (AI Overviews), so a single manual check misleads. (2026-09-16) https://www.brightlocal.com/research/local-ai-visibility-study/
- No Hacks sells the same check, trace, fix and re-ask service at $1,000 for a starter check, $6,000-$15,000 for the full fix and from $2,500/month for re-checks. (undated; example tests dated 2026-10-07) https://nohacks.co/accuracy
- OpenAI help centre: Business Hub owners can update website, description, category, logo and policies after review; local stores and restaurants can claim only an existing US listing; ChatGPT may still use other sources. (opened 2026-11-22) https://help.openai.com/articles/20001635
- OpenAI's terms prohibit automatically or programmatically extracting data or Output, so the check must be typed by a person, not run by a bot. (effective 2026-01-01) https://openai.com/policies/row-terms-of-use/

### 2. Local AI Visibility Setup (`local-ai-visibility-setup`) — confidence: medium

**Buyer:** Single-location or few-location local businesses (dentists, salons, restaurants, studios, home services) that only ever set up a Google Business Profile, have few or Google-only reviews, and hear that customers now ask AI assistants for 'best X near me'.

**One line:** A one-time, done-with-you setup of the profiles and facts AI assistants read beyond Google (Bing Places, Apple Business, Yelp or the local equivalent, and the ChatGPT profile where eligible), plus a review plan and a before/after prompt check.

**Gap:** The parts are served cheaply (profile-claiming gigs on Fiverr/Upwork with unverified prices; a $100 PeoplePerHour citation offer) and the bundle is served expensively (LocalPlus $499/month including ChatGPT Business Hub management; Whitespark $399 one-time over 4-6 weeks; a Contra freelancer from $400 with no AI component). What was not found is an honest, low fixed-price bundle with measured AI checks and a review plan for one location. This is a packaging and trust offer, not a capability nobody else has; the competition verifier's search was cut short, so confidence is medium at best. The ChatGPT Business Hub part is narrowed to existing US local listings and eligible online businesses; for everyone else it is 'ready to claim when it opens'.

**Deliverables:**
- Before/after check: 10-12 local prompts typed by hand into ChatGPT, Gemini and Google AI Mode, with dated screenshots
- One master fact sheet (name, address, phone, hours, categories, description, services)
- Consistency fixes on Google Business Profile, Bing Places (via Google import), Apple Business, Yelp or local equivalent, and 1-2 category directories; owner stays admin and does every verification step
- One screen-share call to walk the owner through claims and the DNS TXT record
- Website checks from the existing crawler: LocalBusiness schema, services/location/FAQ block, AI crawlers not blocked
- Review plan: review counts and recency versus 3 competitors, which review platforms show up for the category and city, and an ask kit (QR card, WhatsApp/SMS/email wording, reply templates) that excludes Yelp and uses no incentives or gating
- Optional ChatGPT Business Hub claim help, only where OpenAI allows it

**Suggested price:** $149 one-time per location (ChatGPT profile help alone: $39 add-on); a profiles-only slice at $99

**Effort:** 7-10 hours for the full scope; about 3 hours for profiles only (verifier estimate)

**Honest limits:** We submit and verify profiles where each platform allows it; we do not promise a profile goes live by a date, we never handle your ID documents, codes or passwords, and claiming a profile does not guarantee that any AI assistant recommends you.

**Competitors:**
- LocalPlus: $299/$499/$799 per month; ChatGPT Business Hub, Bing, Apple and Yelp consistency in the $499 tier; no one-time option
- Whitespark Listings Service: $399/$599/$999 one-time per location, 4-6 weeks, about 30% of listings live at report time
- Contra freelancer 'Local Visibility Setup': from $400 one-time, no AI component
- BrightLocal: Track $41, Manage $54, Grow $65 per month; citations from $2-$3.20 per site
- Semrush Local: $30/$60 per location per month, billed annually
- PeoplePerHour 'Local SEO + AI boost' offer: $100, citations and social signals only
- upGrowth 'ChatGPT Profile Readiness Sprint' (India/GCC): fixed scope, price quoted after a call

**Evidence:**
- BrightLocal survey of 1,002 US adults: 45% use ChatGPT or other generative AI for local business recommendations, up from 6% a year earlier; 47% will not use a business with fewer than 20 reviews. (2026-02-11) https://www.brightlocal.com/research/local-consumer-review-survey/
- SOCi Local Visibility Index (350,000+ locations of multi-location brands): ChatGPT recommended 1.2% of locations versus 35.9% appearing in Google's local 3-pack. (2026-01-28) https://www.localogy.com/2026/01/soci-lvi-report-reveals-how-ai-is-rewriting-local-search-visibility/
- BrightLocal citation study: no single source to optimise; Google Business Profile is about 28.6% of citations and Yelp appears in about 80% of ChatGPT answers. (2026-08-26) https://www.brightlocal.com/resources/ai-directory-sources/
- Steady Demand study of 2,880 US prompts: Yelp appeared in ChatGPT's business-card grounding on 95.83% of runs. (2026-08-21) https://www.steadydemand.com/?p=4927
- OpenAI launched Businesses in ChatGPT (Business Hub, beta) on 10 November 2026; businesses must be verified before updating key details. (2026-11-10) https://openai.com/index/introducing-businesses-chatgpt/
- OpenAI help centre: local stores and restaurants can claim only an existing US listing; Persona identity verification is required; the admin can grant agency access; claiming does not guarantee increased visibility. (opened 2026-11-22) https://help.openai.com/en/articles/20001635-setting-up-your-business-on-chatgpt
- Apple Business launched 14 April 2026, free in 200+ countries and regions, replacing Apple Business Connect. (2026-03-24) https://apple.com/newsroom/2026/03/introducing-apple-business-a-new-all-in-one-platform-for-businesses-of-all-sizes
- Insites study of 10,000 local businesses (vendor, correlational): businesses found by both ChatGPT and Perplexity averaged 133 Google reviews versus 11 for those invisible to AI. (2026-05-05) https://insites.com/blog/what-ai-uses-to-choose-local-businesses-and-what-it-ignores/
- LocalPlus sells ChatGPT Business Hub management with Bing Places, Apple Maps and Yelp consistency in its $499/month Pro plan; no one-time option. (opened 2026-11-22) https://localplus.co/services/ai-searches
- Whitespark's listings service is $399/$599/$999 one-time per location, takes 4-6 weeks, and about 30% of submissions are live at report time. (opened 2026-11-22) https://whitespark.ca/listings-service/

### 3. Local AI Starter (India), priced in rupees (`local-ai-starter-india`) — confidence: medium

**Buyer:** Indian local businesses (eateries, trades such as AC repair, real-estate offices, studios, often with a Google profile and no website) and bootstrapped Indian startups that cannot pay agency GEO retainers. Clinics only in a restricted, facts-only form.

**One line:** The seenhq ladder published in INR with UPI: a one-time human local AI audit and a fixed-scope fix sprint with no retainer and no minimum term, including a simple website for owners who have none.

**Gap:** India is ChatGPT's largest market by weekly users per OpenAI's India head, BrightLocal's platform does not work in India, and OpenAI's help page limits local Business Hub claims to existing US listings (one Indian agency reports a waitlist). Most published Indian GEO pricing is retainer-based at Rs 25,000-75,000+ per month. The gap is narrower than first stated: Zaillor launched a small-business programme at Rs 3,999/month with a 3-month minimum (press release), so price alone is not the difference. What was not found is a one-time, no-lock-in, done-for-you local bundle that works for a business without a website. Willingness to pay is untested; all price evidence is vendor-published. The Hindi/Hinglish answer check is kept only as an optional add-on with no demand evidence, offered only if a native Hindi reader does the work.

**Deliverables:**
- Human Local AI audit: 10-15 local questions typed by hand into ChatGPT, Gemini and Google AI with screenshots, Google profile and listing-consistency check, PDF fix list
- Fix sprint: Google Business Profile completion, Bing Places, corrections on up to 3 directories (e.g. Justdial, Sulekha, one category listing), LocalBusiness schema, AI-crawler access; listed as consistency work, not a proven AI signal
- WhatsApp-first review-ask kit for non-medical businesses only
- Optional 1-5 page website (hours, services, prices, area served, FAQs) for owners with none; domain and hosting billed to the client
- Optional Hindi/Hinglish check: the 10 most important questions in English, Hindi and Hinglish on 3 assistants, plus a human-written Hindi FAQ
- Clinics: factual accuracy work only (name, contact, departments, facilities, fees, schema); no review requests and no promotional content

**Suggested price:** Audit Rs 3,999 one-time; fix sprint Rs 14,999 one-time; website Rs 9,999 extra; Hindi/Hinglish check Rs 2,999; monitoring Rs 1,999/month; UPI accepted, no minimum term

**Effort:** Audit 3-4 hours; sprint 8-12 hours; website 6-10 hours extra; Hindi check 3-4 hours (verifier estimates)

**Honest limits:** We test, fix and document; we do not promise you will be cited or recommended by any AI, we do not claim Justdial, Practo or similar listings influence AI answers, listing edits are 'submitted and documented' rather than guaranteed live, and for clinics we do factual corrections only because the NMC's October 2026 advertising guidelines restrict third-party marketing and review solicitation for doctors.

**Competitors:**
- Zaillor Foundation AI SEO: Rs 3,999/month, 3-month minimum, assumes a website (press release)
- OneCity (Bangalore): GEO Starter Rs 25,000-45,000/month, page also says from Rs 15,000; quoted after audit
- Redefine ROI (Noida): from Rs 35,000/month
- Gaurav Tiwari: GEO from Rs 30,000/month retainer only; one-time Google profile package Rs 12,000 with no AI component
- upGrowth: retainers Rs 75,000-3,50,000/month, audits Rs 1,50,000-8,00,000
- GGM Technologies on IndiaMART: GEO at Rs 21,000 per project, 3-month minimum
- BrightLocal: platform not available in India
- Otterly.AI: from EUR 29/month, tracking only

**Evidence:**
- OpenAI India MD said India has become ChatGPT's largest market by weekly active users, with the user base doubling since January 2026. (2026-11-03) https://inc42.com/buzz/india-becomes-chatgpts-largest-market-globally-user-base-doubles-since-january/
- Sam Altman said India has 100 million weekly active ChatGPT users. (2026-02-15) https://techcrunch.com/2026/02/15/india-has-100m-weekly-active-chatgpt-users-sam-altman-says/
- upGrowth benchmark (agency's own figures): Indian GEO retainers Rs 75,000-3,50,000/month with 6-month minimums and one-time audits Rs 1,50,000-8,00,000; says retainers under Rs 1,00,000 'rarely produce measurable citation share growth'. (2026-04-20 (modified 2026-11-21)) https://upgrowth.in/geo-aeo-pricing-benchmark-india-2026/
- OneCity (Bangalore) lists a local-business GEO Starter at Rs 25,000-45,000 per month, and also says pricing starts at Rs 15,000 per month. (updated 2026-06-04) https://onecity.co.in/generative-engine-optimization-services-bangalore
- Zaillor launched a small-business AI SEO programme at Rs 3,999/month with a three-month minimum (press-release style). (2026-10-05) https://businessnewsthisweek.com/?p=446666
- An Indian consultant publishes GEO from Rs 30,000 per month, retainer only, and says it is not a fit for budgets under Rs 30,000 a month. (n.d.) https://gauravtiwari.org/ai-search-optimization-geo-services/
- BrightLocal's pricing page says its platform works in the USA, UK, Canada and Australia. (opened 2026-11-22) https://www.brightlocal.com/pricing/
- Outlook Business: an AC-repair owner with 10 staff says "We don't have a website. We only have a Google profile where customers leave reviews"; a Lucknow realty firm reports two or three customers who found it through ChatGPT. (2026-07-21 (header date)) https://www.outlookbusiness.com/newsletter/the-inference/google-chatgpt-and-the-ai-anxiety-of-small-businesses
- NMC advertising guidelines (notice dated 2026-10-06, as reported): doctors must not engage third parties to market medical services or procure reviews and ratings; clinics may publish only objective, verifiable particulars. (2026-10-07) https://medicaldialogues.in/health-news/nmc/nmc-issues-ethical-advertising-public-communication-guidelines-for-doctors-hospitals-details-180731
- upGrowth reports its own India attempt to claim a ChatGPT Business Hub profile landed on a waitlist; it sells a fixed-scope readiness sprint with no public price. (2026-11-11) https://upgrowth.in/chatgpt-business-hub-agency-india/

### 4. AI Crawler Unblock: find the layer, fix or ticket it, retest (`ai-crawler-unblock`) — confidence: medium

**Buyer:** Startup/SaaS founders and small businesses whose sites sit behind Cloudflare or on hosts with default bot rules (WP Engine, Hetzner managed hosting, Hostinger), who did not choose to block AI crawlers and cannot tell which layer is doing it.

**One line:** We test what AI crawlers actually receive from your server, name the layer that refuses them, change the settings you control or file and chase the host ticket, set one consistent access policy, and retest.

**Gap:** The competition lens failed for diagnosis: free no-signup checkers (365i, Layer3 Labs, Keyword.com, Writesonic, Suganthan) already compare per-bot status codes and raw versus rendered HTML, and fix gigs exist on Fiverr (prices unverified). So the free probe and the $49 audit are parity, not a gap, and the site must not present them as unique. The narrowed service is the part no priced competitor was found for: a fixed-price, done-for-you 'name the vendor layer, fix or ticket it, set the policy, retest' sprint. It also upgrades seenhq's current robots.txt-only check, which misses silent blocks. Render fixes are limited to configuration-level changes; custom single-page apps are quoted separately. No measurement specific to small or local sites exists, and buyer demand is inferred from technical data, not complaints.

**Deliverables:**
- Free: automated status-code matrix per AI-bot user-agent versus what robots.txt declares, labelled as a simulated request
- $49 audit: up to 5 key pages; names the blocking layer from response headers and the owner's dashboard screenshots; lists facts that appear only after JavaScript
- Sprint: change the Cloudflare or security-plugin setting on a screen-share, or write and chase the host support ticket; allow-list published bot IPs where needed
- Per-bot robots.txt policy separating training bots from search and user-triggered fetchers, from a short questionnaire
- Retest, including confirmation via Search Console that Google is not blocked, repeated after two weeks because blocks can be intermittent
- Monthly re-probe inside the $29 monitoring, because CDN defaults change without the owner acting
- Optional log report ($79) where the owner can export raw access logs

**Suggested price:** Free simulated probe; inside the $49 human audit (5-page cap); $149 unblock-and-policy sprint; config-level render fix inside the $199 fix sprint

**Effort:** Audit 1-1.5 hours; unblock and policy sprint 3-5 hours; config-level render fix 3-6 hours (verifier estimates)

**Honest limits:** We test what your server sends to AI crawlers and fix or ticket the layers you control; host-level blocks are the host's decision, our probes are simulations from non-verified IPs that can be wrong in either direction, robots.txt is advisory, and being reachable does not mean being cited or protected from AI training.

**Competitors:**
- 365i AI Bot Checker: free, 14 bots, robots.txt plus live server test, drafts a message to the host; no fix service
- Layer3 Labs AI crawler checker: free, per-crawler 200/403/429, unpriced consultation
- Keyword.com AI Crawler Simulator: free, 12 crawlers
- Writesonic AI Crawl Checker and Suganthan JS Rendering Gap Checker: free raw-versus-rendered diagnosis
- Cloudflare AI Crawl Control: free, Cloudflare layer only
- Known Agents: $0 / $29 / $299 per month, self-install analytics
- Prerender.io: $59 / $169 / $419 per month
- Fiverr 'fix blocked AI crawlers' gigs: exist, prices unverified (pages returned 403)

**Evidence:**
- A founder found his own site returning 403 to GPTBot, ClaudeBot and others because of a Cloudflare setting although robots.txt allowed them; in a scan of 591 sites, 100 refused GPTBot or ClaudeBot and only 4 declared it in robots.txt. A second host-firewall layer needed 18 Perplexity IPs allow-listed. (2026-11-19) https://hackernoon.com/i-found-my-own-website-blocking-chatgpt-then-i-checked-640-others
- Hetzner documentation: managed hosting blocks GPTBot, ClaudeBot and others by default with HTTP 403; customers cannot edit the list and must file a support request. (2026-05-18) https://docs.hetzner.com/managed/webserver/blocked-user-agents/
- Cloudflare: from 15 September 2026 new domains block Training and Agent bots by default on pages with ads; multi-purpose crawlers such as Googlebot and BingBot 'will be blocked' for customers who block Training. (2026-07-01) https://blog.cloudflare.com/content-independence-day-ai-options/
- WP Engine returns HTTP 429 to ClaudeBot, GPTBot and Amazonbot at platform level (29%/29%/51% of requests in one site's 7-day logs); not visible in customer dashboards and lifted only by escalation. Secondary report, one site. (2026-05-14 (updated 2026-10-22)) https://www.drweb.de/wp-engine-sperrt-ki-crawler-kunden-tappen-im-dunkeln/
- HasData test of about 10,900 sites as reported: of 592 sites whose robots.txt disallows GPTBot, 234 (39.5%) still served it a page; sites blocking GPTBot without declaring it rose from 115 to 178. Probes used the user-agent string, not OpenAI's IPs. (2026-10-08) https://ppc.land/cloudflare-drops-ai-opt-outs-from-118-sites-robots-txt-hasdata-finds/
- Study of 274 fintech homepages: 36% returned less than 80% of their final content to a raw fetch without JavaScript; 17% returned no readable content. (2026-06-26) https://www.searchenginejournal.com/a-third-of-fintech-is-invisible-to-ai-agents/576193/
- A free checker already requests the homepage as each of 14 AI bots and a browser, detects host/CDN-level blocks and drafts a message for the host; it lists no priced unblock service. (n.d.) https://www.365i.co.uk/tools/ai-bot-checker/
- OpenAI's crawler documentation publishes IP files per bot and says of ChatGPT-User that robots.txt rules may not apply. (n.d.) https://developers.openai.com/api/docs/bots
- Ahrefs log study of 137,210 domains: 97% of llms.txt files received zero requests in May 2026, so llms.txt is offered as an optional extra, not a scored failure. (2026-06-15) https://ahrefs.com/blog/llmstxt-study/

### 5. AI Pricing and Facts Check for SaaS (`ai-pricing-facts-check-saas`) — confidence: low

**Buyer:** Startup and small B2B SaaS founders whose buyers ask AI assistants what the product costs and does, especially with a recently changed pricing page, 'contact sales' pricing, or a JavaScript-rendered pricing table.

**One line:** A one-time, human-run check of what ChatGPT, Perplexity, Gemini and Claude tell buyers about your price, plans and features, compared with your truth sheet, plus a check that your pricing page is readable by AI fetchers and a fixed fix list.

**Gap:** Lowest-confidence recommendation. The need is supported by two vendor-run datasets (Omnius, Siteline via Search Engine Journal); Forrester's post relies on the same Siteline benchmark and is not independent. The competition verifier's page fetches failed, so its verdict rests on search snippets: low-cost subscription tools that claim pricing-accuracy checks (LLMClicks at a reported $49-$399/month, an Apify brand-accuracy actor) appear to exist but were not confirmed. The offer is therefore narrowed to what was not found served: a one-time, human-run, fixed-price check combined with pricing-page readability checks and a fix sprint for small SaaS. It is the SaaS variant of AI Fact-Check and Fix and shares its method. The site must not say that no low-cost option exists.

**Deliverables:**
- Truth sheet from the founder: plans, prices per billing term, limits, free tier, top integrations, compliance claims
- Human-typed test: 8-10 fixed buyer questions on ChatGPT, Perplexity, Gemini and Claude on two days, each answer logged with screenshot, cited sources and a correct / wrong / stale / unsupported mark
- Crawler checks: pricing table present in raw HTML without JavaScript; bot access for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot; struck-through or hidden prices in page code; inconsistent prices across terms; Offer/SoftwareApplication schema
- Source trace of which third-party pages (review sites, comparison posts) carry the wrong figure
- Prioritised fix list in a 6-10 page report
- Fix sprint: server-rendered pricing block, HTML plan table, dated plain-text pricing facts, one consistent price per plan and term, up to 5 listing correction requests

**Suggested price:** $99 for the check (a 5-question, 2-assistant lite version inside the $49 audit); $199 fix sprint capped at one pricing page and 5 correction requests

**Effort:** 5-7 hours for the check; about 1.5 hours for the lite version (verifier estimate)

**Honest limits:** This is a dated snapshot of what the assistants answered on the days we asked; we make your pricing page readable and consistent and send correction requests, but we cannot make an AI stop repeating an old price and third-party sites may ignore us.

**Competitors:**
- Attract Group Agent Readiness: free audit, fixes from $1,499
- GEO agency one-time audits (First Page Sage dataset): $1,500-$12,000, median $4,300
- Peec AI: $95/$245/$495 per month, mentions tracking, no fact fixing
- Profound: enterprise, contact sales since September 2026
- Cloudflare Agent Readiness score: free, protocol checks only
- LLMClicks.ai: reported $49-$399/month with pricing-accuracy checks (search snippet only, not confirmed on the page)
- Apify 'AI Brand Accuracy' actor: reported from $44 per 1,000 fact checks (search snippet only)

**Evidence:**
- Omnius ran 400 ChatGPT tests on about 20 AI customer-service vendors: ChatGPT gave a price figure for all 10 'contact sales' vendors (38 of 49 answers), and repeated Intercom's struck-through $29 price in 59 answers. One engine, one niche, vendor-run. (2026-10-21) https://www.omnius.so/blog/saas-pricing-transparency
- Siteline benchmark as reported: in 534 simulated agent attempts to find plan prices, about 30% hit a fetch or search error; runs with access errors drew 58% of content from third-party sources versus 12% in error-free runs; Zendesk's JavaScript-rendered plan table sent the agent to third-party blogs. Vendor benchmark, one model. (2026-06-30) https://www.searchenginejournal.com/ai-agents-struggle-to-read-b2b-pricing-report-finds/581186/
- Forrester analysts recommend auditing pricing pages for agent retrieval and making pricing readable without login or JavaScript (the post relies on the Siteline benchmark). (2026-08-05) https://www.forrester.com/blogs/ai-agents-cant-read-your-pricing-and-its-becoming-a-revenue-problem/
- Entrepreneur lists 'old prices' and 'retired products' among the errors a brand check finds and recommends dated plain-language statements of current prices. (2026-09-30) https://www.entrepreneur.com/building-a-business/business-plan/ai-just-told-a-customer-something-false-about-your-company-now-what
- Attract Group sells agent-readiness fixes from $1,499 after a free audit, with no test of what assistants say about pricing. (n.d.) https://attractgroup.com/services/agent-readiness/
- ChatGPT repeatedly told users Soundslice supported a feature that did not exist; the founder ended up building it (older than 12 months). (2025-07-09) https://techcrunch.com/2025/07/09/chatgpt-hallucinated-about-music-app-soundslice-so-often-the-founder-made-the-lie-come-true

## Not recommended

- **One-off AI Recommendation Snapshot (standalone service):** Failed the competition lens. The same product shape exists at seenhq's own price points: an Ad Autopsy 'AI Visibility Snapshot' at $99 one-time with 36 questions, screenshots and top-5 fixes (https://whop.com/joined/ad-autopsy/products/ai-visibility-snapshot-is-your-business-in-chatgpt-s-answers/), VisiScan at a listed $49 one-time plus $29/month (third-party listing, https://www.gappsy.com/tools/visiscan/), an Apify report at $1.99-$9.99 per run, and a free 150-query checker from Exploding Topics. Keep a capped 5-prompt, 2-engine, 2-run check as a feature of the $49 audit and as the baseline for the other services, but do not launch it as a new service or claim alternatives start at about $500.
- **Citation and Entity Fix Sprint (as a new service):** Failed the competition lens. Fixed-price done-for-you GEO implementation already exists at $297/$597/$997 one-time (https://onetimegeo.pages.dev/), Sourcelift publishes a $390 audit and $2,400 sprint, a Contra freelancer sells a near-identical sprint with a 14-day re-audit, and local directory consistency is a commodity at $2-$3.20 per citation. A before/after re-check on 10-15 prompts cannot reliably separate the fix from run-to-run noise. Keep the existing $199 fix sprint and add an honest 30-day re-test, but do not present it as a market gap.
- **AI Traffic and Lead-Source Tracking Setup (standalone):** Failed the competition lens. GA4 has had a native AI Assistant channel since May 2026, free Looker Studio dashboards (Previsible, Wpromote) and free guides cover the setup (Orbit Media calls the basic report 'four clicks and four keystrokes'), and MonsterInsights has a built-in report. AI referrals are about 0.32% of website traffic (SE Ranking) and most ChatGPT clicks now arrive without a referrer, so the deliverable's value is small. Bundle it as a line item in the $199 sprint or $29 monitoring only.
- **"Where did my Google clicks go?" click-loss diagnosis (standalone):** Failed the competition lens. The need is real, but agencies give the diagnosis away as lead generation (NuroSparx free calculator and free audit), the method is published free in several guides, a free query classifier handles Search Console exports, and marketplace gigs sit at the same price (prices unverified). Marie Haynes sells the specialist version at $500. Offer it at most as a $49-$79 add-on to the human audit, worded as a likely-cause diagnosis; very low-traffic local sites give no usable signal.
- **ChatGPT Business Hub claiming for non-US local businesses:** Not deliverable today. OpenAI's help page says local stores and restaurants can claim only an existing US listing, and one Indian agency reports a waitlist. Offer 'readiness, claim when it opens' inside Local AI Visibility Setup rather than a separate service.
- **Regional-language (beyond Hindi) AI answer checks and review-request kits for Indian clinics:** Regional languages have no independent demand evidence and cannot be delivered honestly without a native reader on the team. Review solicitation and third-party marketing for doctors are restricted by the NMC guidelines reported on 2026-10-07, so clinics get factual corrections only.
- **llms.txt, Markdown-for-agents and MCP endpoints as scored must-haves:** Evidence does not support selling them: Ahrefs found 97% of llms.txt files received zero requests in May 2026, Insites found no meaningful correlation between local AI visibility and llms.txt, schema or Core Web Vitals, and fewer than 15 of the 200,000 most visited sites have MCP Server Cards. Relabel the existing llms.txt check as an optional low-impact extra.
