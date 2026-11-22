# Market research round 2: product feature gaps (2026-11-23)

Method: one research agent opened the free checkers and pricing pages of ~28 tools (HubSpot AI Search Grader, Semrush, Ahrefs, Otterly, Profound, Peec, AthenaHQ, Scrunch, SE Ranking, Seobility, Ubersuggest, Screaming Frog, Sitebulb, Cloudflare isitagentready + AI Crawl Control, 365i, Layer3 Labs, Keyword.com, Writesonic, Suganthan, LLM Pulse, Frase, Geoptie, Wiremo, Uberall, Admiral Media, SEOmator, Fern, llms.txt generators). "Absent" means not described on the pages opened that day, which is weaker than proof of absence. Not verified: Moz, SEOptimer, HubSpot Website Grader, Adobe checker.

## Headline
The free AI-readiness checker market is crowded. Two things we were treating as differentiators are roughly parity:
- LLM reading of facts/questions with draft fixes: Admiral Media's free checker does a version of it (https://admiral.media/geo-checker/).
- Paste-ready JSON-LD, share link, PDF: SEOmator's free GEO audit (https://seomator.com/geo-audit-tool).
Real gaps are narrow, cheap checks and how fixes are delivered.

## Decision: build now (T016)
| # | Feature | Why it is a gap | Evidence | Honest limit |
|---|---|---|---|---|
| 1 | Image-only / PDF-only content detector (menu, prices, hours exist only as an image or PDF) | Not listed by Wiremo, Admiral, SEOmator, Frase, Seobility, 365i | Yext (vendor) https://www.yext.com/knowledge-center/how-restaurants-use-menus-to-win-citations-near-me-searches | We do not read the PDF/image; some AI systems can parse PDFs |
| 2 | Crossed-out, hidden and conflicting facts (struck-through old prices, hidden text with prices/phones, different phone/price/hours across pages and schema, stale footer year) | No tool in the table describes it | Omnius (vendor): ChatGPT quoted Intercom's struck-through $29 in 59 answers, live $19 once https://www.omnius.so/blog/saas-pricing-transparency | External-CSS styles missed; call-tracking numbers cause false conflicts |
| 3 | Blocked-crawler test on all crawled pages that names the blocking layer (Cloudflare, WAF, host) and where to change it | Per-bot probes exist free (365i, Layer3, Keyword.com, Otterly) but test one URL and do not name the provider | 100 of 591 sites refused GPTBot/ClaudeBot, only 4 said so in robots.txt https://hackernoon.com/i-found-my-own-website-blocking-chatgpt-then-i-checked-640-others | Simulated from our IPs: firewalls that verify crawler IPs can differ either way |
| 4 | Developer hand-off export ("Copy as tickets" Markdown, "Copy as one prompt for a coding agent") | Ahrefs exports CSV only; Lumar's ticket drafting is enterprise | Lumar describes ticket writing as the bottleneck | No Jira/Linear integration |
| 6 | Fact-level raw-HTML check (is each core fact in the HTML a non-JS fetcher receives, only in JSON-LD, or missing; SPA shell detection) | Rendering-gap tools give a % for one URL, none ties it to named business facts | 36% of 274 fintech homepages returned <80% of content to a raw fetch https://www.searchenginejournal.com/a-third-of-fintech-is-invisible-to-ai-agents/576193/ | No headless browser: we can say the raw HTML lacks it, not what appears after JS |

## Later (BACKLOG)
- 5 Platform-aware fix steps (Wix/Squarespace/Shopify/WordPress "where to click"), 8-12 h, needs dated help-page verification.
- 7 Owner summary in the owner's language: demand evidence weak; only ship languages the team can read.
- 8 Re-audit diff: retention feature, needs the database.
- 9 One-competitor readiness comparison: doubles cost per audit.

## Do not build as differentiators (free elsewhere)
AI visibility/mention scores (HubSpot, Semrush 3/day, Frase); per-bot probe as a headline (365i, Layer3, Keyword.com); JS rendering gap % (Writesonic, Suganthan, LLM Pulse); agent-protocol checks (Cloudflare isitagentready); llms.txt generators (Writesonic, Mintlify; Wix auto-generates); LocalBusiness schema generator + Google profile cross-check (Wiremo); share link/PDF as selling points (SEOmator); AI citation analytics (Google Search Console and Bing Webmaster now report these first-party: point users to both).
