# Pricing and positioning recommendation (2026-11-23)

Synthesis of `pricing-1-price-points.md` (45 global + 33 Indian published prices, unit economics) and `pricing-2-buyers-and-gap.md` (25 buyer quotes, demand signals, gap verdicts). Nothing here is applied to the live site until the founder approves.

## Limits of the evidence
- Every price is a seller's list price or what a buyer says they paid. No source states what a buyer *would* pay for a one-time fix.
- Reddit, Indie Hackers, Fiverr, Upwork, G2, BBB and others refused automated access and were not worked around. Buyer quotes skew to complaint reviews of large vendors.
- India: no first-hand buyer quote with a rupee amount. GST facts come from secondary sources: confirm with an accountant.
- No published conversion rate exists from a sub-$100 audit to a sub-$300 fix.

## The exact gap
Price is not the gap. One-off SEO fixes already sell for $50 to $300, and owners already pay $240 to $840 a month for bundles they say deliver nothing visible.

The gap is a **no-contract, fixed-price fix of the exact problems a free audit has already shown the owner, with before/after proof per item and a named person**, on the site builders small owners use (Wix, Squarespace, WordPress, Shopify).

AI-specific work (wrong facts in AI answers, crawler access, facts in raw HTML) makes the offer different from a marketplace gig, but has no visible buyers on its own yet: GEO browser extensions have 6 to 1,000 users against 600,000 for a mainstream SEO extension. It should ride inside the fix, not lead the pitch.

## First 100 customers
- **Who:** the owner, deciding alone, no marketing employee.
- **Business:** (a) single-location local service businesses on a site builder or vendor-built site; (b) small Shopify store owners who already paid $160 to $700 to a one-off "expert"; (c) a smaller group of bootstrapped founders who cancelled a roughly $2,000/month agency.
- **Trigger:** just cancelled, or trying to escape, a monthly marketing contract with no visible work. Second: an unexplained traffic drop or one after a migration. Third: asked ChatGPT about their category and saw only competitors.
- **Where:** searches about cancelling or replacing Thryv, Hibu, Yell and similar; those vendors' Trustpilot pages; Shopify Community SEO threads; Alignable; Wix and Squarespace ecosystems; PeoplePerHour.
- **First purchase:** $150 to $300 one-time, by card without a call, scope listed item by item, proof delivered with the work.

## Recommended price ladder

| Offer | Now | Recommended | Why | Confidence |
|---|---|---|---|---|
| Free audit | $0 | Keep | Free graders are the norm | High |
| Full audit | $49 / ₹3,999 | **$99, up to 15 pages, written plan, no promised call**; keep ₹3,999 | Cheapest comparable human audits: $50 for 6 pages, $100 for 10 URLs. $49 pays for about 4 hours, which cannot cover 50 pages by hand, and reads as suspiciously cheap outside India | Medium |
| Fix sprint | from $199 / from ₹14,999 | **Fixed $199 for a published scope** (the items in your quote, up to a stated cap, one site), typical larger jobs $299–399; ₹14,999 | A UK seller has 2,851 sales of the same scope at $190; an Indian firm sells it at ₹15,000 incl. GST. Buyers ask for "fixed price only". $199 pays for about 10 hours | Medium to high |
| Monitoring | $29 / ₹1,999 a month | Keep; no minimum term stays the headline | At the floor of published care plans; lock-in is the top complaint | Medium |
| AI fact-check & fix | from $69 / from ₹4,999 | **From $99 with a stated cap**; keep ₹4,999 | Thin comparables; 2.5–4 h of manual work | Low |
| Local AI setup | $149 / ₹9,999 | Keep $149; **₹6,999** | Indian listing services sell at ₹2,000–5,000 a year | Medium / low |
| AI crawler unblock | $149 / ₹9,999 | **$99 / ₹6,999**, and say it is included in a Fix sprint | It is a subset of the sprint; weakest demand of the seven gaps | Low |
| Content & entity | from $149 / no INR | Keep; **add from ₹9,999** | Missing rupee price breaks rupee quotes | Low |

## Packaging and promises (these matter more than the numbers)
1. **Lead with the fix, not the audit.** Home and pricing headline: fixed price, no contract, cancel nothing, proof for every item.
2. **Before/after proof per item** as a named deliverable of every paid job: we re-run the audit after the work and send the changed checks, with the page and the date. We already have the engine for this.
3. **Fixed scope printed on the page**: what $199 buys, item by item, and what is out of scope. "From" prices only where the scope truly varies.
4. **No lock-in said once, plainly**: no contract, no minimum term, no exit fee, you keep every login.
5. **Pay by card without a call** (needs a payment link: Razorpay/Stripe; founder account).
6. **A named person** on the site and in the quote email (founder identity).
7. **Tax display**: Indian competitors print GST-inclusive prices; state our GST position.

## Cheap experiments to run on the live site
1. Full audit at $99/15 pages vs $49/50 pages: count quote requests per 100 audits.
2. Fix sprint "fixed $199" vs "from $199": count "Request this fix" clicks.
3. Headline: "fixed-price fixes, no contract" vs the current "be seen" line: audit starts per 100 visitors.
4. Quote shown before vs after the email gate (already before): keep measuring.
5. A landing page for "cancel Thryv / Hibu / Yell: what to do next" with a free audit.

Measuring any of this needs funnel events (Vercel Analytics custom events) and, for orders, the database.

## Appendix: Price vs market reference (applied 2026-11-23, T028)

The founder set the ladder below ("run according to the market but set the price lower than the market"). The site prints one market line, on /pricing: "Our Full audit and Fix sprint are priced below typical freelancer and agency rates for the same scope." It names only those two offers because they are the only rows with solid, same-scope comparables that sit above our price. No competitor is named on the site. Row numbers refer to `pricing-1-price-points.md` (section 1 global, section 2.1 India).

| Offer | Our price (USD / INR) | Comparable published prices | Sources | Backs the site line? |
|---|---|---|---|---|
| Full audit (up to 15 pages, by a person, written plan by email) | $39 / ₹2,999 | $50 for homepage + 5 pages (row 1); $100 for up to 10 URLs (row 2); "freelancer audits can cost under $100", basic $300-$1,000 (row 5). India: freelancer SEO audit ₹5,000-25,000 (2.1 row 14); standalone audit ₹15,000-50,000 (2.1 row 7) | https://www.peopleperhour.com/hourlie/small-business-seo-audit-clear-fixes-prioritised-action-plan/1137995 ; https://community.shopify.com/t/fixed-scope-ecommerce-seo-audit-100-up-to-10-urls-pdf-in-48-hours/665027 ; https://agencyanalytics.com/blog/how-much-to-charge-seo-audit ; https://www.digitaldawn.in/?p=13099 ; https://onecity.co.in/blog/seo-services-in-bangalore/ | Yes |
| Fix sprint (up to 8 fixes, one site, before/after proof) | $149 / ₹9,999 fixed; larger jobs from $249 / ₹17,999 | $190 WordPress SEO + GEO fix, 2,851 sales (row 16); $297 "Quick Start SEO Fix" (pricing-2); $800 audit + 8 h of fixes (row 17). Lower outlier: $85 technical fix gig, no sales shown (row 15). India: ₹15,000 incl. GST setup sprint (2.1 row 2); one-off fixes ₹15,000-75,000 (2.1 row 13) | https://www.peopleperhour.com/hourlie/100-overhaul-wordpress-website-for-seo-geo-ai-search/22296 ; https://onetimeseo.pages.dev/services/quick-start-seo-fix ; https://eseospace.com/saas-technology-website-packages/ ; https://www.peopleperhour.com/hourlie/do-technical-seo-audit-fixes/1064112 ; https://codingclave.com/services/seo-services ; https://sociolabs.in/seo-price-in-india/ | Yes ("typical", not "lowest": the $85 gig is cheaper) |
| Monitoring (monthly re-audit by a person, short email) | $19 / ₹999 a month | Care plans from $29 (row 38), $39 (row 39); GEO monitoring $49 (row 14). But GoWP's free tier includes an automated monthly AI visibility audit (row 39). India: SEO retainers ₹5,000+ a month (2.1 row 17) | https://seahawkmedia.com/maintenance/wordpress-maintenance-packages/ ; https://www.gowp.com/pricing/ ; https://web-cited.pages.dev/pricing ; https://m.indiamart.com/impcat/search-engine-marketing.html | No: the cheapest comparables are different scopes (care plans) or free automated tiers |
| AI fact-check & fix (up to 10 questions, 4 assistants, fixes, one re-test) | $59 / ₹3,999 | Nearest full service $1,000+ (No Hacks, MARKET_RESEARCH.md); trackers $29-$65 a month without fixes | https://nohacks.co/accuracy ; https://www.brightlocal.com/pricing/ | No: no solid same-scope comparable |
| Local AI visibility setup | $99 / ₹3,999 per location | GBP setup $35-$55 (rows 23-25), $150-$400 (rows 26-28). India listing services ₹2,000-5,000 a year (2.1 rows 29, 30) | https://www.peopleperhour.com/hourlie/google-business-page-setup-local-seo-maps-ranking/389096 ; https://contra.com/s/AOA2gZBo-google-business-profile-setup-and-optimization ; https://contra.com/s/srmBqREc-seo-local-visibility-setup ; https://m.indiamart.com/impcat/maps-optimization-services.html | No: cheaper single-profile gigs exist; ₹3,999 is inside the India range, not below it |
| AI crawler unblock | $49 / ₹2,999 | Technical fix gigs from $85 (row 15); a subset of the Fix sprint | https://www.peopleperhour.com/hourlie/do-technical-seo-audit-fixes/1064112 | No: no same-scope comparable |
| Content & entity | from $99 / from ₹6,999 | Schema packages $55-$57 for 5 pages (rows 20, 21), $299 for 10 pages (row 22) | https://www.peopleperhour.com/hourlie/integrate-rich-snippets-schema-markup-microdata-json-ld-and-structured-data-markup/354776 ; https://legiit.com/search?q=seo%20audit ; https://tygartmedia.com/wordpress-schema-starter/ | No: cheaper schema-only gigs exist |
