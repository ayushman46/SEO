# Pricing research 1: price points for seenhq (2026-11-23)

Scope: published prices for offers comparable to seenhq's, worldwide and in India, plus unit economics for a small India-based team. This file does not repeat `docs/MARKET_RESEARCH_3_FULL.md` or `docs/CONVERSION_RESEARCH.md`; where a source from those files matters here it is named as "prior research" and not re-listed.

## How to read this

- Every URL below was opened on 2026-11-23 unless a row says otherwise. "Page date" is the date printed on the page, when it prints one.
- Source tags: **[V]** vendor selling the thing priced (or a competing thing); **[M]** public marketplace listing; **[3P]** third-party aggregator or blog; **[O]** official or regulator.
- All prices are sellers' list prices. No transaction data and no buyer willingness-to-pay data was found for these price points. That is the main limit of this file.
- Exchange rate used: Rs 92.97 per US dollar, the RBI/FBIL reference rate for 2026-11-20 as shown at https://www.msei.in/markets/currency/historical-data/rbireferenceratearchives [3P republishing O]. Rounded to Rs 93 in the sums.
- seenhq's own page, opened today (https://seenhq.vercel.app/pricing): Full audit $49 / Rs 3,999 "a person reviews an SEO audit and a GEO audit covering up to 50 pages", written plan, written walkthrough, short call on request; Fix sprint from $199 / Rs 14,999 (top issues, robots.txt, sitemap, llms.txt, structured data for business and FAQs, quick performance wins, before/after re-audit); Monitoring $29 / Rs 1,999 per month (monthly re-audit of key pages, short email). Prices exclude tax. No turnaround and no hour cap are stated.
- At Rs 93 per dollar seenhq's rupee prices equal $43 (audit), $161 (sprint), $21.50 (monitoring), $54 (fact-check), $107.50 (local setup, crawler unblock). India is priced 12% to 28% below the USD list.

### Not accessible (recorded, not worked around)

| Site / page | Result |
|---|---|
| Upwork service listings (2 opened) | HTTP 403 |
| Fiverr gig page | HTTP 403 |
| TemplateMonster AI search optimisation service | HTTP 403 |
| BrightLocal help article on managed service cost | HTTP 403 |
| coloradowebimpressions.com GBP cost answer | HTTP 403 |
| AmbitionBox SEO executive salary | HTTP 403 |
| YourStory (Google MSME study), exchange4media (MSME ad spend) | HTTP 403 |
| ClearTax (GST threshold page, SAC 9983 page), RecurPost GMB pricing | HTTP 410 |
| Tally Solutions GST threshold page | HTTP 403 |
| Truelancer SEO freelancers | HTTP 429 |
| PeoplePerHour category page, Finsweet SEO page, PageTraffic packages, dev.to India SEO cost posts, neilpatel.com Ubersuggest pricing | HTTP 404 |
| SEO Discovery packages | HTTP 307, no body |
| blog.brainguru.in | DNS failure |
| SEOReseller pricing | Returned an image, no text |
| cbic-gst.gov.in rate page, CBIC FAQ, GST portal user guide | Opened, but the relevant text was not in the returned content |

Pages that opened but print no price (so they are not in the tables): The HOTH local SEO (book a call), Loganix audit article, Schema App (custom quote, 12-month minimum, https://schemaapp.com/pricing), Bipper Media, Think Profits (retainers "start at $2,500/month", no audit price), Veza Digital AI search audit (no price on page; six-week delivery), W3era GMB packages (quote only, 3-month minimum, advance payment), Noir & Blanco maintenance (ranges only), IndiaMART website-maintenance category (all "Get Best Price"), Studio Happens GMB.

---

## Part 1. Global price points

### 1.1 Table of published prices (45 rows)

| # | Offer type | Seller (location if shown) | Price | What is included | URL | Page date | Tag |
|---|---|---|---|---|---|---|---|
| 1 | SEO audit, one-time | Zeeshan S. on PeoplePerHour (Pakistan; 4.9 from 112 reviews on profile) | $50 | Homepage + up to 5 pages, 8-12 page PDF, prioritised fix list, title/meta rewrites, 30-min call or Q&A, 4 days. Add-on to 10 pages + keyword map: +$117 | https://www.peopleperhour.com/hourlie/small-business-seo-audit-clear-fixes-prioritised-action-plan/1137995 | none | M |
| 2 | SEO audit, one-time | StoreAuditLab (country not stated) | $100 | Up to 10 URLs, up to 10 keyword/page opportunities, prioritised PDF in 48 h. No implementation | https://community.shopify.com/t/fixed-scope-ecommerce-seo-audit-100-up-to-10-urls-pdf-in-48-hours/665027 | 2026-08-11 | V |
| 3 | SEO audit, one-time | Aidan M. on PeoplePerHour (N. Ireland / Belgium on profile) | $170 | Site and traffic review, technical health, 3 competitors, action plan, Zoom walkthrough, 5-7 days. 1 sale shown | https://www.peopleperhour.com/hourlie/seo-audit-for-small-businesses-clear-priorities-no-jargon/871532 | none | M |
| 4 | SEO audit, one-time (agency) | Vizion Interactive (USA) | $4,000 / $7,650 / $11,250 | Technical audit, max 500 / 1,000 / 3,000 URLs, roadmap, kickoff and findings calls | https://www.vizion.com/technical-seo-audit-packages/ | footer 2026 | V |
| 5 | SEO audit, guide ranges | AgencyAnalytics (tool vendor) | Basic $300-$1,000; under 20 pages about $500-$1,000; "freelancer audits can cost under $100" | Says an in-depth audit takes 20 to 200 hours | https://agencyanalytics.com/blog/how-much-to-charge-seo-audit | 2025-08-14 | V |
| 6 | GEO audit, automated | Pixelmojo "Radar" | $5 single audit; packs $12 / $40; $199/month for 40 audits + weekly monitoring of one site | Automated technical readiness plus LLM citation and hallucination layer | https://www.pixelmojo.io/answers/how-much-does-an-ai-visibility-audit-cost | updated 2026-11-04 | V |
| 7 | GEO audit, automated | Apify actor "geo-audit" (3 users) | $0.025 per page + $0.02 per AI answer | Per-bot crawler fetch test, robots, llms.txt, schema, content depth. One URL per run | https://apify.com/s-r/geo-audit | none | M |
| 8 | GEO audit, one-time | Freelancer on Contra (Charleston, USA) | from $249 | GEO audit, citation-readiness notes, entity recommendations, roadmap, 5 days | https://contra.com/s/bRFmF3lq-geo-ai-citation-audit-for-ai-search-visibility | none | M |
| 9 | SEO + GEO audit bundle | Same Contra freelancer | from $399 | Technical review, on-page, LLM crawler access, schema, citation map, roadmap, 7 business days | https://contra.com/s/vEs2RNqE-complete-seo-geo-audit-bundle-search-and-ai-visibility | none | M |
| 10 | GEO audit, productised | Citant.ai | $440 | Six AI platforms, what models get wrong, sources feeding the category, quick wins, 72 h. Non-refundable; credited against a $7,875 pilot | https://citant.ai/ | none | V |
| 11 | GEO audit, productised | Tygart Media | $497 | Citation analysis on 4 assistants, entity map, GA4 AI referrals, competitor comparison, action plan, 5 business days. Refund only before work starts | https://tygartmedia.com/ai-visibility-audit/ | cites Sept 2026 | V |
| 12 | GEO audit, productised (secondary) | Avante Visibility, as reported by GTM 80/20 | $500 / $1,500 / $5,000 | Visibility Check / Audit / Full audit with 90-day re-measure. Same page gives bands: automated scan $99-$499, productised audit $440-$1,500, consultant $1,500-$5,000 | https://www.gtm8020.com/blog/geo-audit-cost | prices checked 2026-10-28, updated 2026-11-22 | V (agency writing about rivals) |
| 13 | Local AI visibility audit | Whitespark (Canada) | from $2,500 | One brand, one priority location, up to 3 services, 4 weeks | https://whitespark.ca/seo-services/ | none | V |
| 14 | GEO monitoring, monthly | Web Cited | $49 / $99 per month | 10 / 25 buyer prompts read weekly on 6 engines + AI Overviews, 10 / 25 page site scan, monthly re-scan, JSON-LD pack, email support | https://web-cited.pages.dev/pricing | none | V |
| 15 | Technical fix, one-time | Faisal M. on PeoplePerHour (Australia on profile) | $85 | Audit report, indexing and crawl fixes, sitemap and robots.txt, broken links, schema, Core Web Vitals, canonicals. 5 days. No sales count shown | https://www.peopleperhour.com/hourlie/do-technical-seo-audit-fixes/1064112 | none | M |
| 16 | Technical + GEO fix, one-time (WordPress) | Peter M. on PeoplePerHour (UK) | $190 | Meta tags, "AI search (GEO) text files", Yoast/Rank Math, schema, headings, sitemap, robots.txt, 2 days. **2,851 sales, 3,066 reviews, 100% rating** | https://www.peopleperhour.com/hourlie/100-overhaul-wordpress-website-for-seo-geo-ai-search/22296 | none | M |
| 17 | Audit + fix, one-time | eSEOspace (USA) | $800 (8 h of fixes) / $1,000 (10 h) / $1,200 (12 h, adds GEO/AEO push) | Full audit then capped hours of fixes: broken pages, speed, mobile, titles, schema basics, forms; before/after summary | https://eseospace.com/saas-technology-website-packages/ | none | V |
| 18 | On-site fix hours, one-time | 1Digital Agency (USA) | $1,699 for 5 h; $3,199 for 10 h; $185/h out of scope | Hour buckets, no contract | https://www.1digitalagency.com/ai-seo-pricing/ | footer 2026 | V |
| 19 | Schema markup | "Orbeen" on PeoplePerHour (USA; listing inactive, reviews 2018-2022) | $15 for 1 page; +$140 for 10 pages | Manual JSON-LD/Microdata, 1 day. 18 sales | https://www.peopleperhour.com/hourlie/rich-snippet-schema-markup-manually-microdata-jasonld-no-plugin/437856 | none | M |
| 20 | Schema markup | Md Syfur R. on PeoplePerHour (Bangladesh; listing inactive) | $55 for 5 pages; +$80 for 10; +$220 for 30 | LocalBusiness, product, article and other types, 7 days. 1 sale | https://www.peopleperhour.com/hourlie/integrate-rich-snippets-schema-markup-microdata-json-ld-and-structured-data-markup/354776 | none | M |
| 21 | Schema markup | "Manidip" on Legiit | from $57 | "Schema Markup For AI Overviews And Local SEO" (price from the listing card; detail page showed no tiers) | https://legiit.com/search?q=seo%20audit | none | M |
| 22 | Schema markup, productised | Tygart Media | $299 (top 10 pages); $499 with FAQ content written | FAQPage, LocalBusiness, Service, Article, BreadcrumbList; Rich Results validation; under a week | https://tygartmedia.com/wordpress-schema-starter/ | updated April 2026 | V |
| 23 | GBP setup, one-time | PeoplePerHour seller (India), 89% rating, 5 sales | $35 | GBP setup and optimisation, social profile setup, report, 5 days. One 2026 review alleges no work was done | https://www.peopleperhour.com/hourlie/google-business-page-setup-local-seo-maps-ranking/389096 | none | M |
| 24 | GBP optimisation, one-time | HomeASAP (USA, real-estate agents only) | $51.99 (regular $79.99) | Photos, contact details, custom cover photo, 3-5 business days | https://about.homeasap.com/google-my-business/ | none | V |
| 25 | GBP audit + setup, one-time | Olalekan Oyeniyi on Selar | $55 | Audit, description, categories, services, local keywords | https://selar.com/12727i2um8 | footer 2026 | M |
| 26 | GBP setup, one-time | Freelancer on Contra (Lahore, Pakistan) | from $150 | Setup or audit, categories, description, services/products, Q&A, photo guidance, review strategy, competitor comparison, before/after report, 5 days | https://contra.com/s/AOA2gZBo-google-business-profile-setup-and-optimization | none | M |
| 27 | GBP optimisation, one-time | Freelancer on Contra (Lagos, Nigeria) | from $350 | Full optimisation, audit, category and keyword research, 5 photos, 1 post, review QR code, 7 days support, 1 week | https://contra.com/s/ke3ARYYe-google-business-profile-optimization-one-time-setup | none | M |
| 28 | Local visibility setup, one-time | Troy Miller on Contra (New York) | from $400 | GBP, Maps categories, Yelp/Tripadvisor or industry profile, NAP review, directory recommendations, basic site metadata review, handoff guide, 1 week | https://contra.com/s/srmBqREc-seo-local-visibility-setup | none | M |
| 29 | Citations, one-time | FATJOE (UK) | from $90 (shown at $72 with 20% off) | Manual citation building, 7 days, white-label report | https://fatjoe.com/local-seo/ | none | V |
| 30 | GBP posting, monthly | Boomp | $39/month posts only; $900/month full local marketing, one location | $900 tier: profile upkeep, posts, review-request process, one search page a month, two small site updates, reporting. Review replies excluded | https://boomp.net/blog/google-business-profile-management-service | 2026-10-21 | V |
| 31 | GBP software, monthly | Merchynt "Paige" | $99/month | Automated GBP work plus a generated website | https://merchynt.com/post/google-my-business-management-pricing | 2024-03-20 (old) | V |
| 32 | GBP management, monthly | Whitespark | $499/month; GBP + website $1,999/month | Weekly posts, review strategy, spam fighting, monthly report, no setup fee. "Fully booked", waitlist | https://whitespark.ca/seo-services/ | none | V |
| 33 | Local SEO + AI, monthly | 1Digital Agency "WorkspaceCMS Local" | $499 / $699 / $999 per month (+ CMS plan from $89/month), 6-month term. Standard local retainer from $899/month | Deliverables not itemised on page | https://www.1digitalagency.com/ai-seo-pricing/ | footer 2026 | V |
| 34 | Local SEO, monthly | WebFX | from $575/month per location | Keyword research for 5 services, titles/meta, address schema, citations on 40+ directories, GBP setup, monthly reporting calls | https://www.webfx.com/local-seo/pricing/ | 2026-02-26 | V |
| 35 | Local SEO, survey | WebFX survey of 250 US marketing and sales staff | 43% of firms with 1-10 staff pay $100-$500/month for local SEO | The page's percentages do not sum cleanly; treat as rough | same URL | dataset 2025-09-11 | V |
| 36 | SEO retainer sold abroad by an Indian agency | eSearch Logix (Noida + Wyoming) | $225 / $375 / $599 / $949 / $1,350 per month | 25 to 200 keywords, 2 to 20 blog posts; GBP optimisation only from the $599 tier; 6 months recommended | https://www.esearchlogix.com/seo-packages | none | V |
| 37 | GBP software (secondary) | GBPcentral, Podium, as reported by Webtonic | $49 / $89 per month (GBPcentral); $399 / $599 (Podium) | Self-serve management tools; 12-month contracts said to be standard | https://www.webtonic.io/blog/plumbing-google-business-profile-management-statistics | none | 3P |
| 38 | Website care plan | Seahawk Media | $29 / $99 / $179 / $299 per month | $29: updates QA-tested, malware removal, daily backups, monthly report, no tasks. $99: 2 site tasks. $299: 10 tasks, "AI agent readiness" | https://seahawkmedia.com/maintenance/wordpress-maintenance-packages/ | footer 2026 | V |
| 39 | Website care plan | GoWP | $0 / $39 / $99 per site per month | Free: 5 AI edits, **one AI visibility audit a month**, monitoring. $39: auto updates, backups, security, reports. $99: adds 5 human edits of about 30 min | https://www.gowp.com/pricing/ | none | V |
| 40 | Website care plan | WP Buffs | $89 / $179 / $239 / $359 per month | $89: weekly updates, uptime, backups. $179: unlimited edits, security. $239: speed work | https://wpbuffs.com/plans/ | promo dated Dec 2025 | V |
| 41 | Website care plan | Codingclave (Lucknow, India) for clients abroad | $75 / $150 / $300 per month | 2 / 6 / 15 hours of changes, updates, backups, monitoring. Extra hours $15 | https://codingclave.com/services/website-maintenance | none | V |
| 42 | Website care plan, premium | SiteCare | $435 / $2,190 per month | Hosting, human-tested updates, Core Web Vitals work, 5 quick fixes and 5 content edits; top tier has 10 dev hours | https://sitecare.com/pricing/ | none | V |
| 43 | Maintenance after project | eSEOspace | from $250/month | Optional after a one-time package | https://eseospace.com/saas-technology-website-packages/ | none | V |
| 44 | GEO retainer, guide | Demand Local (USA) | "Tripwire audit" $1,500-$5,000; basic tier $1,500/month | A how-to-price article for agencies | https://www.demandlocal.com/blog/how-to-price-geo-services/ | 2026-04-07 | V |
| 45 | GEO audit, guide | AOK Marketing | "typically $2,000-$8,000" | No sample basis given | https://aokmarketing.com/geo-audit-cost-ai-visibility | none | V |

Two figures seen only in search-result snippets and **not** confirmed on an opened page (Upwork returned 403): an llms.txt + robots.txt setup at $40 with 2-day delivery, and an audit + sitemap + robots + HTTPS bundle at $1,099. They are context only.

### 1.2 Cheapest / typical / premium by offer type

"Typical" is my reading of where the opened listings cluster. It is not a median of a sampled market.

| Offer type | Cheapest | Typical | Premium | What the typical price buys |
|---|---|---|---|---|
| One-time SEO audit, human | $50 for 6 pages (row 1) | $100-$500 (rows 2, 3, 5) | $4,000-$11,250 (row 4) | 6 to 10 URLs reviewed, prioritised PDF, sometimes a call. No implementation |
| GEO / AI-visibility audit | $5 automated (row 6); $249 human (row 8) | $400-$500 (rows 9-12) | $1,500-$5,000 (rows 12, 13) | Prompts run on 4 to 6 assistants, crawler and schema check, action plan, 3 to 7 days |
| Technical SEO fix package | $85 (row 15) | $190-$800 (rows 16, 17) | $1,699 per 5 hours, i.e. $340/h (row 18) | Robots/sitemap/schema/meta fixes on one CMS, 2 to 10 days, or a cap of 8 hours |
| Schema markup | $11-$15 per page (rows 19, 20) | $57-$299 for a small site (rows 21, 22) | $499 with content; enterprise by quote on 12-month terms | 5 to 10 pages, 3 to 5 schema types, validation |
| GBP setup / optimisation, one-time | $35-$55 (rows 23-25) | $150-$400 (rows 26-28) | $2,500 for a local AI audit (row 13) | Categories, description, services, photos, review plan, before/after report |
| Single-location local SEO, monthly | $39 posts only (row 30); $49-$99 software (rows 31, 37) | $225-$575 (rows 33, 34, 36) | $900-$1,999 (rows 30, 32) | GBP upkeep, posts, citations, a monthly report; usually a 3 to 6 month term |
| Website care plan | $29-$39 (rows 38, 39) | $89-$179 (rows 38, 40, 41) | $299-$435+ (rows 38, 42) | Updates, backups, security scans, a monthly report; human edits start around $99 |

### 1.3 Verdict on $49, $199 and $29/month

**$49 full audit (human, SEO + GEO, up to 50 pages): reads as suspiciously cheap to a buyer outside India.**
- The cheapest human audits found cost the same or more for a fraction of the scope: $50 for 6 pages from a Pakistan-based freelancer (row 1) and $100 for 10 URLs (row 2). seenhq's per-page price is $0.98; those are $8.30 and $10.
- Every productised GEO audit with a named seller sits at $249 to $497 (rows 8-11). The vendor-written band for "automated scans" is $99-$499 (row 12), so $49 is priced below what the market calls automated.
- The $49 price point is already used for automated reports: AisleReady's fix report (prior research) and GoWP gives an AI visibility audit away monthly on its free plan (row 39). A buyer comparing will assume $49 means a tool export.
- Prior research (WebFX, not re-opened) had 1.72% of 250 US businesses paying under $50 for an audit.
- Counter-evidence: "freelancer audits can cost under $100" (row 5), so $49 is not unheard of. It is unusual for 50 pages with a person named as reviewer.

**$199 fix sprint ("from"): reads as normal for a marketplace freelancer and cheap for a productised agency.**
- The strongest single data point in this file: a UK seller's WordPress SEO + GEO optimisation at $190 with 2,851 sales and 3,066 reviews (row 16). That is a near-identical scope at a near-identical price with real volume.
- Agencies charge $800 for an audit plus 8 hours of fixes (row 17), $299 for schema alone on 10 pages (row 22) and $340 per hour at the top (row 18). Prior research had OneTimeGEO at $297 / $597 / $997.
- "From $199" is therefore credible, provided the page says what $199 buys. Today it does not state hours, page count or turnaround.

**$29/month monitoring: reads as normal, at the floor for anything with a person in it.**
- Same price as Seahawk's entry care plan (row 38) and within $10 of GoWP Pro (row 39). Web Cited charges $49/month for weekly prompt readings plus a monthly site re-scan (row 14). Prior research had Otterly at EUR 29.
- It is far below managed local or GBP services ($499+, rows 32-34), but those include ongoing work, which seenhq's monitoring does not.
- Risk at this price is not credibility but substitution: GoWP's free plan and free graders cover part of the same job.

---

## Part 2. India

### 2.1 Published Indian price lists (33 rows)

IndiaMART rows are individual vendor listings on a category page, in page order. They show a headline price only; scope is rarely stated.

| # | Seller (city) | Service | Price | URL | Page date | Tag |
|---|---|---|---|---|---|---|
| 1 | Codingclave (Lucknow) | Local SEO / SEO Growth / SEO Plus | Rs 10,000 / 25,000 / 45,000 per month **including 18% GST**; 3-month first term. Local: 1 Business Profile, 4 posts, review replies, 1 page, 2 developer hours, 8 directories in month 1 | https://codingclave.com/services/seo-services | none | V |
| 2 | Codingclave | One-time "setup sprint" | **Rs 15,000 including GST**, 10 working days, sites up to about 50 pages: technical audit with fixes, titles/meta/H1 for up to 20 pages, structured data, sitemap, analytics, llms.txt, 3-month plan | same URL | none | V |
| 3 | Codingclave | Website care | Rs 5,000 / 10,000 / 20,000 per month including GST (2 / 6 / 15 hours of changes); extra hours Rs 1,000 each | https://codingclave.com/services/website-maintenance | none | V |
| 4 | Techpullers (Kochi) | SEO audit, standalone | **Rs 10,000 one-time**; given free with any package | https://techpullers.com/seo-pricing/ | none | V |
| 5 | Techpullers | SEO packages | from Rs 25,000 / 40,000 / 75,000+ per month; Starter includes GBP setup, single location; content Rs 5,000 per page | same URL | none | V |
| 6 | Noir & Blanco (Mumbai region) | SEO plans | Rs 35,000 / 45,000 / 65,000 per month, all said to include AEO and GEO. The same page elsewhere quotes "basic" at Rs 8,000-25,000 | https://noirandblanco.com/seo-packages/ | footer 2026 | V |
| 7 | OneCity (Bangalore) | SEO packages | Rs 18,000 / 35,000 / 60,000-80,000 per month; says a standalone audit costs Rs 15,000-50,000 and a freelancer Rs 10,000-30,000/month | https://onecity.co.in/blog/seo-services-in-bangalore/ | 2026-05-09 | V |
| 8 | Aarav Infotech (Mumbai / Bhubaneswar) | WordPress maintenance | WP-Optimum Rs 13,999 ($249) / WP-Intense Rs 29,999 ($499) per month | https://www.aaravinfotech.com/wordpress-maintenance-services | none | V |
| 9 | Gaurav Tiwari (consultant) | GEO programme | from Rs 30,000 ($369) per month, GST included, month to month | https://gauravtiwari.org/ai-search-optimization-geo-services/ | none | V |
| 10 | upGrowth (Pune) | GEO audit and retainers | One-time GEO audit Rs 1,50,000-8,00,000 (its estimate); its own paid audit Rs 2,50,000-4,00,000; retainers from Rs 75,000/month | https://upgrowth.in/geo-aeo-pricing-benchmark-india-2026/ | 2026-04-20, modified 2026-11-21 | V |
| 11 | W3era (Jaipur) | SEO packages | "SEO package in India Rs 8,000-25,000 per month"; own starting price $499/month for overseas | https://www.w3era.com/seo/pricing/ | updated Jan 2026 | V |
| 12 | Coherent Lab (Jaipur) | Estimates by package | Starter Rs 8,000-15,000; **Local SEO (clinics, restaurants) Rs 10,000-25,000**; small business Rs 20,000-50,000 per month | https://www.coherentlab.com/blog/monthly-seo-packages-india | footer 2026 | V |
| 13 | SocioLabs (New Delhi) | Market ranges | One-off audits and fixes Rs 15,000-75,000; small-business retainers Rs 15,000-40,000/month | https://sociolabs.in/seo-price-in-india/ | 2026-08-13 | V |
| 14 | Digital Dawn | Freelancer rates ("data from over 200 freelancers", method not described) | **SEO audit Rs 5,000-25,000**; one-time optimisation Rs 15,000-60,000; local SEO setup Rs 10,000-30,000; retainers Rs 8,000-15,000 (fresher) to Rs 40,000-70,000 (3-5 years) | https://www.digitaldawn.in/?p=13099 | 2026-02-23 | 3P |
| 15 | Codingclave guide | Agency tiers | Local SEO single location Rs 10,000-30,000/month; technical SEO small site Rs 15,000-25,000/month; says Rs 10,000/month agencies may run "30+ clients per junior team member" | https://codingclave.com/guides/seo-services-india-2026-cost-roi-honest | 2026-06-09 | V |
| 16 | Zentelex (Kolkata), IndiaMART | SEO / Google Business listing | Rs 5,999 per month / Rs 3,999 per month | https://m.indiamart.com/impcat/search-engine-marketing.html and https://m.indiamart.com/impcat/maps-optimization-services.html | none | M |
| 17 | Innoblitz (Chennai), Nowgray (Lucknow), Preconet (Kolkata), IndiaMART | SEO | Rs 5,000 per month each | https://m.indiamart.com/impcat/search-engine-marketing.html | none | M |
| 18 | Hybridplus (Jaipur), IndiaMART | Mobile SEO | Rs 8,000 per month | same | none | M |
| 19 | Delkon (Ghaziabad), Grocient (Jaipur), IndiaMART | SEO / "freelance SEO" | Rs 10,000 per month each | same | none | M |
| 20 | B M Digital (Noida), Credofusion (Lucknow), IndiaMART | SEO | Rs 12,000 per month each | same | none | M |
| 21 | Payzonindia (Bhopal), Zordo (Kuchaman), IndiaMART | Digital marketing / SEO | Rs 15,000 per month each | same | none | M |
| 22 | Xcrino (New Delhi), Deneb (Ahmedabad), Nitai (New Delhi), IndiaMART | SEO | Rs 20,000 / 20,000 / 21,000 per month | same | none | M |
| 23 | Mevu E-Commerce (New Delhi), IndiaMART | GBP optimisation + web design + SEO + social | Rs 2,000 per month | same | none | M |
| 24 | Codetrex, Trevento, Basicmantra, Searchosis (Gurugram), IndiaMART | SEO | Rs 3,000 / 5,000 / 5,000 / 6,000 per month | https://m.indiamart.com/city/gurugram/seo-solution.html | none | M |
| 25 | Designs By Saransh, Intenim, Chamaksaathi, Codelare (Gurugram), IndiaMART | SEO | Rs 8,999 / 10,000 / 10,000 / 10,000 per month | same | none | M |
| 26 | Enlargenet, Countryedu, Supple Soft (Gurugram), IndiaMART | Local SEO / SEO | Rs 15,000 / 15,000 / 21,000 per month | same | none | M |
| 27 | Pixceladgram (Gurugram), IndiaMART | SEO, per project | Rs 35,000 per project | same | none | M |
| 28 | Vatshayan Technologies (New Delhi), IndiaMART | "Website SEO services" | Rs 800 per month | same | none | M |
| 29 | Delkon (Ghaziabad), VK Tech (Rajkot), IndiaMART | Google Business listing | Rs 2,000 per year each | https://m.indiamart.com/impcat/maps-optimization-services.html | none | M |
| 30 | Oneisok (Chak Alampur), Empirican (Chennai), IndiaMART | Google Business listing / local listing | Rs 5,000 per year / Rs 2,999 per year | same | none | M |
| 31 | Preconet (Kolkata), Global Advertising Media (Mumbai), IndiaMART | Local listing / Bing local listing | Rs 999 per month / Rs 3,000 per month | same | none | M |
| 32 | AJ Marketer (Hamirpur, HP), IndiaMART | Google My Business listing; Google local SEO; on-page SEO | Rs 10,000 per month each | https://m.indiamart.com/aj-marketer/seo-services.html | none | M |
| 33 | Indian SEO freelancers on Freelancer.com (first 10 shown) | Hourly rate | $3, $3, $4, $4, $5, $15, $15, $25, $30, $30 per hour (median $10) | https://www.freelancer.com/freelancers/india/seo | none | M |

Derived from rows 16-28 (my arithmetic): the median headline price of the 15 monthly listings on the IndiaMART search-engine-marketing page is **Rs 10,000 per month**; the median of the 14 monthly listings on the Gurugram SEO page is also **Rs 10,000**. Range Rs 800 to Rs 21,000.

Website maintenance: IndiaMART's category page shows no prices (all quote-only). The only published rate cards found are Codingclave (Rs 5,000-20,000 incl. GST) and Aarav Infotech (Rs 13,999-29,999).

AI SEO / GEO in India at small-business prices: only prior-research items (Pallix Rs 2,499/month, Zaillor Rs 3,999/month) plus Codingclave's sprint with llms.txt (row 2) and "AI-answer checks" in its Rs 45,000 plan. Everything else published is Rs 30,000/month and up (rows 9, 10).

### 2.2 INR pricing of SEO tools

| Tool | What was found | URL | Tag |
|---|---|---|---|
| Semrush | Own pricing page shows USD only: $139 / $199 / $299 per month (monthly billing); no INR and no India tax note on the page | https://www.semrush.com/prices/ | V |
| Semrush, Ahrefs, Ubersuggest (third-party read) | Semrush: marked as offering INR pricing and a GST invoice. Ahrefs: $129 / $249 / $449, bills only in USD, no GST invoice, no UPI. Ubersuggest: $29-$99, no INR | https://productgrowth.in/tools/compare/semrush-vs-ahrefs-vs-ubersuggest/ | 3P, checked 2026-11-11 |
| Ahrefs Starter, Similarweb, Moz Pro (third-party conversions at Rs 95.3 per dollar, before GST) | Ahrefs Starter Rs 2,764/month ($29); Similarweb from Rs 11,000/month; Moz Pro from Rs 9,435/month | https://productgrowth.in/tools/seo-optimization/guide/ | 3P, vendor pages read Jul-Nov 2026 |
| Ubersuggest own page | Not accessible (404) | - | - |

Reading: mainstream SEO suites do not publish rupee list prices. An Indian owner pays dollar prices by card, with forex and (per the third-party source) no GST invoice from Ahrefs. A rupee-invoiced Rs 1,999/month service is priced below every suite except Ahrefs Starter.

### 2.3 Survey and industry data on MSME digital marketing spend

| Finding | Source | Tag |
|---|---|---|
| FISME study of 300 MSMEs, released 2026-03-25: "nearly 90% report positive outcomes" from digital advertising; fewer than half can use reliable data. No spend amounts | https://knnindia.co.in/news/newsdetails/msme/friends-of-msmes-in-parliament-launches-fisme-study-on-digital-advertising-challenges | 3P news |
| Primus Partners survey of 1,000+ MSMEs and startups (article 2025-12-16): 69% already use digital advertising, 27% plan to within three years. No spend amounts; commissioner not stated | https://www.medianews4u.com/69-of-smbs-in-india-already-use-digital-advertising-and-another-27-plan-to-adopt-it-within-three-years-primus-partners/ | 3P news |
| Primus Partners (article 2024-12-13, sample not stated): 42% of surveyed SMBs put over 40% of their marketing budget into online advertising | https://theprint.in/economy/80-of-indian-smbs-rely-on-online-advertising-76-find-it-more-effective-than-traditional-methods-report/2401611 | 3P news (ANI) |
| A Google-linked study (3,249 MSMEs, June 2026) and a SIDBI 2025 survey are both reported as finding about 13% of MSMEs use digital marketing | Seen in search snippets only; YourStory page returned 403. **Unverified** | - |

**Not found:** any survey or government figure giving Indian MSME spend on SEO, websites or digital marketing in rupees per month or as a share of revenue. The 69% and 13% adoption figures conflict, which says the samples differ (advertisers versus all MSMEs).

### 2.4 Payment method norms

| Finding | Source | Tag |
|---|---|---|
| RBI Payment System Report (December 2025 issue, published 2026-05-18), H2 2025: UPI is 85.5% of payment volume but 9.5% of value; NEFT 3.6% of volume and 14.9% of value; RTGS 0.1% of volume and 68.6% of value. Average UPI ticket fell to Rs 1,313 in 2025 | https://rbi.org.in/Scripts/PublicationsView.aspx?id=23813 | O |
| Razorpay standard pricing (updated May 2026): 2% platform fee on all domestic instruments including UPI, up to 3% on international cards, 18% GST on the fee, no setup fee | https://razorpay.com/pricing/ | V |
| What Indian service sellers print: Codingclave invoices at the start of each month and takes USD by bank transfer; W3era takes payment in advance at the start of each quarterly cycle; seenhq lists bank transfer, UPI or card with an invoice before work | URLs in 2.1; https://www.w3era.com/seo/pricing/gmb-service-packages/ | V |

Reading (inference from the RBI split, not a survey): small-ticket payments run on UPI and larger business payments on NEFT/RTGS. seenhq's rupee prices (Rs 1,999 to Rs 14,999) are small tickets, so UPI by link or QR is the natural default, with bank transfer for GST-registered buyers who want an invoice trail. A survey of how Indian small businesses prefer to pay service vendors: **not found**. Cost of collection: 2.36% domestic and up to 3.54% international through a gateway (fee plus GST on the fee); a direct UPI or bank transfer avoids it.

### 2.5 GST

| Point | Source | Tag |
|---|---|---|
| Rate: advertising services (SAC 998361), internet advertising space (998365), management consulting (998311) and IT design and development (998314) are all 18%; unchanged by the rate restructuring of 2025-09-22 | https://busy.in/sac-code-9983/ | 3P (accounting software vendor) |
| The governing notification is No. 11/2017-Central Tax (Rate), "To notify the rates for supply of services under CGST Act" (annexure not read) | https://gstcouncil.gov.in/node/4432 | O (title only) |
| Registration threshold for service providers: aggregate turnover above Rs 20 lakh in a financial year; Rs 10 lakh in special category states | https://www.indiafilings.com/learn/service-providers-gst-registration-turnover and https://www.xflowpay.com/blog/gst-for-freelancers (2026-11-17) | 3P |
| Which states are "special category" is stated differently by different sources: Xflow names Manipur, Mizoram, Nagaland and Tripura; Razorpay's page lists more and contradicts itself | https://razorpay.com/learn/gst-registration-limits/ | 3P |
| Inter-state service suppliers under the threshold are exempt from registration under Notification 10/2017-Integrated Tax (2017-10-13) | indiafilings URL above | 3P citing O |
| Exports of services are zero-rated under section 16 of the IGST Act if the section 2(6) conditions are met; a registered exporter files an LUT (Form GST RFD-11) yearly or pays 18% IGST and claims a refund. Whether an exporter under the threshold must register is disputed between secondary sources (Notification 10/2017-IT versus section 24 of the CGST Act) | Xflow URL above; conflict seen in search results | 3P |

The official texts (section 22 and 24 of the CGST Act, the rate annexure) were **not** read today: the CBIC pages returned no usable content. Treat the table as a brief for a chartered accountant, not as advice.

What this means for the price page: Indian competitors that publish prices state them GST-inclusive (Codingclave, Gaurav Tiwari). seenhq says "prices exclude applicable taxes". If seenhq is registered, a clinic that cannot claim input credit pays Rs 4,719 for the Rs 3,999 audit and Rs 17,699 for the Rs 14,999 sprint, which makes the sprint 18% dearer than Codingclave's near-identical Rs 15,000 inclusive sprint. If seenhq is under the threshold and unregistered, it charges no GST and should say so.

### 2.6 Credible INR price points

**(a) Local clinic or restaurant (single location, often no marketing staff)**

| | Credible range | Evidence |
|---|---|---|
| One-time | **Rs 2,000 to Rs 10,000** | Google Business listing services at Rs 2,000-5,000 a year (2.1 rows 29, 30); freelancer audit floor Rs 5,000 (row 14); Techpullers audit Rs 10,000 (row 4); local SEO setup Rs 10,000-30,000 from freelancers (row 14) is the ceiling this buyer hears |
| Monthly | **Rs 1,000 to Rs 4,000 for a light service; Rs 5,000 to Rs 10,000 for managed local SEO** | Listing services Rs 999-3,999/month (rows 16, 31); median IndiaMART SEO listing Rs 10,000/month; Codingclave Local SEO Rs 10,000 incl. GST (row 1); Coherent Lab Rs 10,000-25,000 for clinics and restaurants (row 12) |

seenhq's Rs 3,999 audit and Rs 1,999 monitoring sit inside these ranges. Rs 9,999 for a one-time profile setup is at the top of the range, against listing services sold at Rs 2,000-5,000. Rs 14,999 for a sprint is 1.5 months of a median IndiaMART retainer, which is a real sum for this buyer.

**(b) Funded startup**

| | Credible range | Evidence |
|---|---|---|
| One-time | **Rs 10,000 to Rs 25,000 for an audit; Rs 15,000 to Rs 60,000 for audit plus fixes** | Techpullers Rs 10,000 (row 4); Gaurav Tiwari Rs 25,000 (prior research); OneCity Rs 15,000-50,000 (row 7); Codingclave sprint Rs 15,000 (row 2); freelancer one-time optimisation Rs 15,000-60,000 (row 14). GEO-labelled audits from agencies start at Rs 1,50,000 (row 10) but that is a seller's estimate |
| Monthly | **Rs 2,500 to Rs 6,000 for tracking or monitoring; Rs 25,000 to Rs 45,000 for a retainer** | Pallix Rs 2,499-5,999 (prior research); Codingclave Rs 25,000-45,000 (row 1); Techpullers from Rs 25,000 (row 5); Gaurav Tiwari GEO from Rs 30,000 (row 9); Noir & Blanco Rs 35,000-65,000 (row 6) |

For this buyer seenhq's rupee prices are below the bottom of the range for the audit (Rs 3,999 against Rs 10,000) and at the bottom for the sprint. A startup is not the buyer the 12-28% India discount needs to serve.

---

## Part 3. Unit economics

### 3.1 Salary and rate data

| Data point | Figure | Source | Tag |
|---|---|---|---|
| SEO Executive, India average | Rs 18,143 per month (156 salaries, updated 2026-05-07). Bengaluru Rs 32,338; New Delhi Rs 27,176; Mumbai Rs 27,138; Jaipur Rs 25,809 | https://in.indeed.com/career/seo-executive/salaries | 3P |
| SEO executive, India average | Rs 34,195 per month, Rs 190.77 per hour (about 1,456 records and job postings, dated 2026-11-18) | https://in.jooble.org/salary/seo-executive | 3P |
| SEO professional, India | Rs 3,20,000 per year median; 25th-75th percentile Rs 2,40,000-3,62,000 (only 10 profiles, updated 2025-01-18) | https://www.payscale.com/research/IN/Job=Search_Engine_Optimization_(SEO)_Professional/Salary | 3P, tiny sample |
| SEO skill, hourly, India | Rs 308.37 per hour (27 individuals, 2026-09-29) | https://www.payscale.com/research/IN/Skill=Search_Engine_Optimization_(SEO)/Hourly_Rate | 3P, small sample |
| Freelance SEO hourly, India | Fresher Rs 300-500; 1-3 years Rs 700-1,500; 3-5 years Rs 1,500-3,000; 5+ years Rs 3,000-6,000 | https://www.digitaldawn.in/?p=13099 (2026-02-23) | 3P, method not described |
| Indian SEO freelancers, listed rates | $3 to $30 per hour, median $10 (10 profiles) | https://www.freelancer.com/freelancers/india/seo | M |
| Agency charge-out for extra hours | Rs 1,000 ($15) per hour | https://codingclave.com/services/website-maintenance | V |
| Technical SEO engineer salary (a vendor's claim) | Rs 60,000-1,50,000 per month | https://codingclave.com/guides/seo-services-india-2026-cost-roi-honest | V |
| Rejected | solohourly.com's India figures are US rates times a multiplier with internal errors; not used | https://solohourly.com/rates/seo-consultant-rates-in-india | 3P |

Prior research (Ahrefs) had 85.7% of India-based SEO providers charging $30 or less per hour; the Freelancer.com sample agrees.

### 3.2 Cost per productive hour (my assumptions, stated)

- 176 paid hours a month (22 days x 8 h), 60% of them billable = 106 hours. This is an assumption; no utilisation benchmark for small Indian agencies was found.
- Loaded cost = salary x 1.3 for statutory contributions, tools and overheads. Also an assumption.
- "Healthy margin" = 60% gross margin on delivery, so delivery labour may use 40% of revenue net of payment fees. Sales time, support, refunds and founder time come out of the other 60%.
- Payment fee: 3.54% on USD card payments, 2.36% on domestic (Razorpay, 2.4).

| Who does the work | Basis | Cost per productive hour |
|---|---|---|
| Junior SEO executive | Rs 18,143/month (Indeed) | Rs 223 ($2.40) |
| Mid-level SEO executive | Rs 34,195/month (Jooble) | Rs 419 ($4.50) |
| Technical SEO / developer | Rs 60,000/month (Codingclave's low figure) | Rs 736 ($7.90) |
| Outside freelancer, 1-3 years | Rs 1,000/hour (mid of Rs 700-1,500; equals Codingclave's charge-out) | Rs 1,000 ($10.75) |

### 3.3 Hours each offer can afford at 60% gross margin

| Offer | Net of fees | Labour budget (40%) | Junior | Mid | Technical | Freelancer |
|---|---|---|---|---|---|---|
| Audit $49 | Rs 4,396 | Rs 1,758 | 7.9 h | **4.2 h** | 2.4 h | 1.8 h |
| Audit Rs 3,999 | Rs 3,905 | Rs 1,562 | 7.0 h | **3.7 h** | 2.1 h | 1.6 h |
| Audit at $99 (for comparison) | Rs 8,881 | Rs 3,552 | 16.0 h | 8.5 h | 4.8 h | 3.6 h |
| Fix sprint $199 | Rs 17,852 | Rs 7,141 | 32.1 h | 17.0 h | **9.7 h** | 7.1 h |
| Fix sprint Rs 14,999 | Rs 14,645 | Rs 5,858 | 26.3 h | 14.0 h | **8.0 h** | 5.9 h |
| Monitoring $29/month | Rs 2,602 | Rs 1,041 | 4.7 h | **2.5 h** | 1.4 h | 1.0 h |
| Monitoring Rs 1,999/month | Rs 1,952 | Rs 781 | 3.5 h | **1.9 h** | 1.1 h | 0.8 h |
| Fact-check $69 | Rs 6,190 | Rs 2,476 | 11.1 h | 5.9 h | 3.4 h | 2.5 h |
| Local setup / crawler unblock $149 | Rs 13,366 | Rs 5,347 | 24.0 h | 12.7 h | 7.3 h | 5.3 h |
| Local setup / crawler unblock Rs 9,999 | Rs 9,763 | Rs 3,905 | 17.6 h | 9.3 h | 5.3 h | 3.9 h |

Bold marks the grade of person the work realistically needs: a mid-level reviewer for an audit a founder will act on, a technical person for changes on a live site.

### 3.4 Does the promised scope fit?

**$49 / Rs 3,999 audit, 50 pages, human-reviewed, written plan, written walkthrough, optional call: it fits only as a review of the engine's output, and only just.**
- Budget is about 4 hours of a mid-level person. No published figure for hours per small audit was found other than AgencyAnalytics' "20 to 200 hours" for an in-depth audit [V], which is 5 to 50 times this budget.
- My estimate (not sourced): reading the crawl output and spot-checking templates on a 50-page site 1.5-2 h, writing the ranked plan 1 h, written walkthrough 0.5 h, email back-and-forth 0.5 h, optional call 0.5 h = 4 to 4.5 h. That uses the whole budget with nothing left for a second question from the buyer.
- Market check: sellers who charge $50-$100 cap scope at 6 to 10 pages (Part 1, rows 1, 2). Nobody found offers 50 human-reviewed pages near this price.
- Conclusion: the scope fits a 5-15 page local site comfortably and a 50-page SaaS site only if the person works from the automated report and does not hand-inspect each page. Either the page cap or the price should move. The call should not be promised at this price.

**$199 / Rs 14,999 fix sprint: it fits if "from" means a capped job; it does not fit an open-ended "top issues".**
- Budget is 8 to 10 hours of a technical person (or 14 to 17 of a mid-level one).
- Market check: eSEOspace sells exactly 8 hours of fixes for $800; Codingclave sells a near-identical scope on sites up to 50 pages for Rs 15,000 including GST over 10 working days; the PeoplePerHour seller does WordPress-only at $190 in 2 days at volume. So 8-10 hours is the normal size of this job, and seenhq's price matches the two cheapest credible sellers.
- My estimate (not sourced): robots.txt, sitemap, llms.txt 1-1.5 h; Organization/LocalBusiness and FAQ schema 2-3 h; top three to five audit fixes 2-4 h; quick performance wins 1-2 h; access, QA, re-audit and report 1.5-2 h = 7.5 to 12.5 h. On WordPress with admin access it lands inside the budget. On custom or headless sites, or where the client's developer must deploy, it will not.
- Conclusion: keep the floor, but state what the floor buys (for example one CMS, up to N fixes or a stated hour cap) and quote above it for anything else. The rupee floor leaves only 8 technical hours, so it has less slack than the dollar floor.

**$29 / Rs 1,999 monitoring: it fits, because most of it is automated.**
- Budget is 1.9 to 2.5 hours of a mid-level person per client per month. A scheduled re-audit plus a short human-checked email should take 20-40 minutes (my estimate), leaving room for the months when something broke and needs a longer note.
- It stops fitting if "monitoring" drifts into fixing what the alert found. That work belongs in a quoted sprint.

**Others, briefly.** Fact-check from $69 buys about 6 mid-level hours; "corrects the sources behind wrong answers" has no natural end, so it needs a cap (a stated number of facts and assistants). Local setup and crawler unblock at $149 / Rs 9,999 have 5 to 7 technical hours each, which is ample for either task. The crawler unblock is also partly inside the sprint (robots.txt, llms.txt) at only $50 more, so the ladder undersells the sprint or oversells the unblock.

---

## Recommendations

Confidence reflects how much of the evidence is list prices from few sellers. None of it is buyer data.

| Offer | USD now | USD recommended | INR now | INR recommended | Confidence | Two strongest sources |
|---|---|---|---|---|---|---|
| Free audit | $0 | Keep | Rs 0 | Keep | High | https://www.gowp.com/pricing/ ; https://techpullers.com/seo-pricing/ |
| Full audit | $49 | **Raise to $99** (or keep $49 and cap at 15 pages); drop the promised call; credit the fee against a sprint, as Citant does | Rs 3,999 | **Keep** for local sites; a startup would accept Rs 7,999-9,999 | Medium | https://community.shopify.com/t/fixed-scope-ecommerce-seo-audit-100-up-to-10-urls-pdf-in-48-hours/665027 ; https://techpullers.com/seo-pricing/ |
| Fix sprint | from $199 | **Keep** the floor; publish what $199 buys and a typical price ($299-$399) | from Rs 14,999 | **Keep**; state GST position, since the closest rival is Rs 15,000 inclusive | Medium to high | https://www.peopleperhour.com/hourlie/100-overhaul-wordpress-website-for-seo-geo-ai-search/22296 ; https://codingclave.com/services/seo-services |
| Monitoring | $29/month | **Keep** | Rs 1,999/month | **Keep** | Medium | https://seahawkmedia.com/maintenance/wordpress-maintenance-packages/ ; https://m.indiamart.com/impcat/maps-optimization-services.html |
| AI fact-check & fix | from $69 | **Raise to from $99** with a stated cap | from Rs 4,999 | **Keep** | Low | https://citant.ai/ ; https://www.pixelmojo.io/answers/how-much-does-an-ai-visibility-audit-cost |
| Local AI visibility setup | $149/location | **Keep** | Rs 9,999/location | **Lower to Rs 6,999** | Medium (USD), low (INR) | https://contra.com/s/srmBqREc-seo-local-visibility-setup ; https://m.indiamart.com/impcat/maps-optimization-services.html |
| AI crawler unblock | $149 | **Lower to $99** (it is a subset of the $199 sprint) | Rs 9,999 | **Lower to Rs 6,999** | Low | https://www.peopleperhour.com/hourlie/do-technical-seo-audit-fixes/1064112 ; https://codingclave.com/services/seo-services |
| Content & entity | from $149 | **Keep** | not published | **Publish from Rs 9,999** | Low | https://tygartmedia.com/wordpress-schema-starter/ ; https://techpullers.com/seo-pricing/ |

## What this research could not establish

- What buyers actually pay or would pay at these price points. Every figure is a seller's list price; several marketplace listings show one sale or none.
- Fiverr and Upwork prices, which are the largest pool of comparable gigs: both refused automated access.
- Hours that comparable sellers spend per audit or sprint. The hour estimates in 3.4 are mine.
- Indian MSME spend on websites or SEO in rupees, and how Indian small businesses prefer to pay service vendors.
- The official GST texts. The threshold, the special-category list and the position of small exporters need a chartered accountant.
- Whether raising the audit to $99 lowers free-to-paid conversion more than it raises trust. Only a test will show that; `CONVERSION_RESEARCH.md` item 13 (measure the funnel before changing prices) still applies.
