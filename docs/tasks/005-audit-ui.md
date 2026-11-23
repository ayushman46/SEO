# T005 — /audit flow UI
**Agent:** frontend-designer · **Depends on:** T001 components, T002/T003 API contract, `src/content/audit.ts`

## Goal
The free audit experience: URL in → live progress → partial report → email gate → full report. This is the lead magnet, so it must feel fast, honest and premium.

## Files
`src/app/(marketing)/audit/page.tsx` (server: metadata, heading, reads `searchParams.url` to prefill), `src/components/audit/AuditFlow.tsx` (client island), `src/components/audit/*` (ProgressSteps, ScoreSummary, IssueList, IssueCard, EmailGate, FullReport, CheckGrid, ErrorState).

## Behaviour
- Form: URL input (prefilled from `?url=`; auto-start if present), submit → `POST /api/audit {url}`.
- While waiting (up to 60 s): progress steps from `auditPage` copy, advancing on a timer (honest: "usually 15–40 seconds"); `aria-live="polite"` status; cancel button (AbortController).
- Errors: map `{error:{code}}` to copy in `src/content/audit.ts`; 429 shows retry time.
- Partial report: ScoreRing ×3–4 (overall, SEO, GEO, Performance or "n/a"), issue counts by severity, top 3 issues fully expanded, locked issues shown as blurred/teaser rows (titles + severity only — real titles, no fake blur text), check grid (pass/warn/fail chips).
- Email gate card: email + consent checkbox ("Email me this report and occasional tips from noticr. Unsubscribe anytime.") → `POST /api/audit/unlock {sealed, email, consent:true}` → render FullReport (all issues grouped by category with howToFix, affected URLs collapsible, pages table, CWV numbers). Keep the result in component state only.
- "Run another audit" + CTA to /contact ("Want us to fix these?").
- Results area announced to screen readers; focus moves to the results heading when done.
- 360px: everything single column, ring sizes shrink, tables become stacked cards.

## Acceptance
Typecheck/lint pass; keyboard-complete; reduced-motion respected; no layout shift when the report appears below the fold.
