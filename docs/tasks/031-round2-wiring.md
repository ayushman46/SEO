# T031 — Round 2 wiring (frontend-designer)

Copy round 2 (T030) changed content and added exports. Wire them in components. Source review: docs/reviews/R5-copy.md.

## Report quote (`src/components/audit/quote/*`)
- `auditQuoteCopy.title` now reads "Your quote" (already used). Tidy the "Your fixed quote" comment in `QuotePanel.tsx`.
- `IssueActions.tsx`: replace `haveUsFix(info.priceText)` with `selected ? auditQuoteCopy.onFixList : auditQuoteCopy.addToFixList`. Keep `aria-pressed`. Show NO price on the issue button.
- Update `src/components/audit/quote.test.ts` where it pins `haveUsFix` / "Have us fix this". Then delete the deprecated `haveUsFix` export from `src/content/audit.ts` if nothing else imports it.
- `FixTray.tsx` and `QuotePanel.tsx`: render one line `auditQuoteCopy.fixListExplainer(q.currency)` ("One Fix sprint covers up to 8 of these for $149." / "₹9,999").
- `QuotePanel.tsx` uses the literal `confirmNote: "person-confirms-within-1-business-day"` key: keep the key; the visible text comes from `QUOTE_TEXT.confirm` (now "two working days").

## Positioning lines
- Home, above the services index: `Sections.tsx`, pass `body={servicesTeaser.body}` to that `SectionHeading` (built from `offerLines` in `src/content/site.ts`).
- Pricing rate-card header: `pricing/page.tsx`: delete the `FIXED_LINE` regex and render `pricingRateCardHeader.label` and both `pricingRateCardHeader.lines` in the currency strip.

## /pricing
- USD panel: render `pricingExtrasUsd` under `pricingExtrasHeading` ("Other services"). `IndiaPricingExtras` has "India extras" hard-coded and requires notes + a comparison: give it a heading prop / make notes optional, or add a small component.
- Move `pricingNote` and `pricingTaxNote` INSIDE the USD panel (today they render outside both panels, so the INR view says "Prices are in US dollars" and states tax twice).
- Use `pricingFaqHeading` instead of the hard-coded FAQ heading.

## /services
- `ServiceBlock.tsx`: CTA is `{serviceCardCta.label}<span className="sr-only">{serviceCardCta.srSuffix(service.name)}</span>`; href stays `/contact?service=${slug}`.

## /contact
- Remove the budget select from `ContactForm.tsx` and "budget" from its field list (server keeps it optional). Then delete the deprecated budget copy in `src/content/contact.ts` if nothing imports it (a backend test imports the options: leave the export if so).
- Remove the `directEmailLabel` paragraph in `contact/page.tsx` (string is now empty).

## Home mock report must match the engine (`src/components/home/sample-report-data.ts`)
Severities from `src/lib/audit/issues.ts`:
- `topIssues[0]`: id `geo.ai-crawlers:search-blocked`, severity `"high"`, title "AI search assistants are blocked from your site", keep impact 9, effort quick.
- `topIssues[1]`: `seo.meta-description:missing`, severity `"medium"`.
- `topIssues[2]`: replace the llms.txt row with id `seo.structured-data:missing`, checkId `seo.structured-data`, category `seo`, severity `"medium"`, effort `"moderate"`, title "No structured data (schema) found".
- `lockedIssues`: replace `performance.lcp:slow` with `performance.cwv:lcp`, severity `"medium"`, title "The main content takes too long to appear"; replace `geo.schema:missing` with `geo.llms-txt:missing`, severity `"low"`, title "No llms.txt file".
- `sampleEffort`: `{ "performance.cwv:lcp": "moderate", "geo.llms-txt:missing": "quick" }`.
- `issueCounts`: `{ critical: 0, high: 1, medium: 5, low: 4 }`.
- `FeatureTabs.tsx` FixesCard: "Unblock AI crawlers" → `"high"`, "Add meta descriptions" → `"medium"`.

## Small items
- `IssueRow.tsx`: `quick: "Quick fix"`.
- `src/components/audit/labels.ts`: `impact: (n) => (n < 1 ? "Under +1 pt" : \`Up to +${n} ${n === 1 ? "pt" : "pts"}\`)`; check rounding in `IssueCard.tsx` that turns small positive impacts into 0.
- `labels.ts`: `nextTitle: "Next steps"`.
- `Sections.tsx` FAQ heading: `title={homeFaqHeading}` ("Questions").
- Tidy stale price comments (`Sections.tsx`, `PricingCard.tsx`).
- Team-facing strings: `src/app/actions/contact.ts` and `src/app/admin/page.tsx` still say "1 business day" → "two working days" (Fable authorises these two string edits).

## Contract
`src/content/types.ts` `HomeContent` still lists fields content no longer provides (hero.eyebrow, hero.secondaryCta, proofLine, problem.kicker, tabs[].body, howItWorks.title, pricingTeaser). Fable authorises you to remove those from the contract and drop the local `RenderedHomeContent` workaround in `src/content/home.ts`, provided nothing renders them.

## Verify
tsc, eslint, full vitest clean; `npm run build` succeeds (only when Fable says the QA agent has finished using the running server: ask in your report instead of building if unsure; you may build to a different dist dir is NOT available, so skip the build and report).
