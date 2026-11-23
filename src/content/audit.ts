import type { PageCopy } from "./types";
import { catalogItem, formatPrice, priceIn, QUOTE_SCOPE_CAP, type QuoteCurrency } from "@/lib/quote/catalog";

export const auditPage = {
  metaTitle: "Free SEO and GEO audit for your website",
  metaDescription:
    "Free check for Google and AI answer engines: SEO, GEO and speed scores, an AI model's reading of your pages and a ranked fix list, in about a minute.",
  kicker: "Free audit",
  title: "Audit your site for Google and AI search",
  intro:
    "We read your homepage and up to five more pages, score them for Google, AI answer engines and mobile speed, and rank what to fix first. About a minute. No email needed for your scores and top three issues.",
} satisfies PageCopy;

// The URL form copy lives in its own module so client islands (the home hero form) do not
// bundle the whole report copy (R5 #16). Re-exported so existing imports keep working.
import { auditForm } from "./audit-form";
export { auditForm };

/** Shown in order while the audit runs. */
export const auditProgressSteps = [
  "Checking the address",
  "Reading robots.txt and sitemap",
  "Scanning pages",
  "Asking PageSpeed",
  "Running the AI reading",
  "Scoring",
] as const;

export const auditResultCopy = {
  scoreLabels: {
    overall: "Overall",
    seo: "SEO",
    geo: "GEO",
    performance: "Performance",
  },
  performanceUnavailable:
    "Performance data was unavailable this time, so the overall score is based on SEO and GEO only.",
  truncatedNote: "We ran out of time before checking every page, so a few pages may be missing from this report.",
  topIssuesTitle: "Your top issues",
  lockedIssuesTitle: "More issues found",
  severityLabels: { critical: "Critical", high: "High", medium: "Medium", low: "Low" },
  effortLabels: { quick: "Quick fix", moderate: "Moderate", involved: "Involved" },
  categoryLabels: { seo: "SEO", geo: "GEO", performance: "Performance" },
  runAnother: "Audit another site",
  helpCta: { label: "Have us fix these for you", href: "/contact?service=technical-fixes" },
} as const;

export const auditEmailGate = {
  title: "See the full report",
  body: "Enter your email to unlock every issue, every check and the exact fix for each. No password and no card.",
  emailLabel: "Email",
  emailPlaceholder: "you@company.com",
  consentLabel:
    "I agree that seenhq may store my email with this report and contact me about it. I can ask for it to be deleted at any time.",
  submitLabel: "Unlock full report",
  submittingLabel: "Unlocking…",
  privacyNote: "We never sell your email. See the privacy policy for details.",
  invalidEmail: "Please enter a valid email address.",
  consentRequired: "Please tick the box so we can store your email with this report.",
} as const;

/**
 * User-facing error messages keyed by AuditError code (src/lib/audit/types.ts),
 * plus API-level codes from the audit and unlock routes.
 */
export const auditErrors = {
  invalid_url: auditForm.invalidInput,
  blocked_host: "We can't audit that address. It points to a private or reserved network, which we don't scan for security reasons.",
  unreachable:
    "We couldn't read that website. It may be offline, or its firewall may be refusing our crawler. Check the address and try again. If it is your site, allow the user agent seenhqbot.",
  timeout: "The website took too long to respond. Try again in a few minutes.",
  not_html: "That address doesn't return a web page. Try your homepage address instead.",
  too_large: "That page is too large for us to scan. Try your homepage address or a lighter page.",
  rate_limited: "You've run several audits in a short time. Please wait a little while before running another one.",
  invalid_or_expired: "This report has expired. Run the audit again to unlock the full results.",
  generic: "Something went wrong on our side. Please try again in a moment.",
  server_busy: "We're running a lot of audits right now. Please try again in a minute.",
} as const;

/**
 * Sentence-length strings for the audit flow UI. Single source: src/components/audit/labels.ts
 * imports these, so edit them here only.
 */
export const auditFlowCopy = {
  timeHint: "This usually takes 15 to 40 seconds.",
  slowHint: "Still working. Larger or slower sites can take up to a minute.",
  noTopIssues: "No issues found on the pages we checked.",
  lockedHint: "Unlock with your email to see the details and fixes.",
  fullReportUnlocked: "Unlocked. Every issue and every fix is below.",
  cwvSource: "Mobile, measured by Google PageSpeed Insights.",
  cwvUnavailable: "PageSpeed data was not available for this audit.",
  retryIn: (mins: number, at: string) =>
    mins <= 1 ? `You can try again in about a minute (around ${at}).` : `You can try again in about ${mins} minutes (around ${at}).`,
  errorTitle: "We couldn't finish this audit",
  rateTitle: "Please wait a little",
  genericTitle: "Something went wrong",
  unlockRateLimited: "Too many unlock attempts. Please wait a little before trying again.",
} as const;

export type AuditErrorCopyKey = keyof typeof auditErrors;

/* ---------- AI reading (T017) ---------- */

export const auditAiCopy = {
  partialTitle: "How an AI model reads your site",
  fullTitle: "AI reading",
  honesty:
    "Read by an open-weight language model hosted on NVIDIA. This is how one AI model reads your pages, not what ChatGPT or Gemini say about you.",
  modelLabel: "Model",
  unavailable: "AI reading wasn't available for this run. Your scores don't depend on it.",
  readbackLabel: "What it understood from your pages",
  businessTypeLabel: "Business type",
  clarityLabel: "Clarity",
  clarityHint:
    "How clearly your pages state the basics customers ask about. We calculate it from the facts and questions below; the model doesn't pick it.",
  factsTitle: "Key facts",
  factsIntro: "The seven things an AI model needs to describe you correctly.",
  factNotFound: "Not found on your site",
  questionsTitle: "Customer questions",
  questionsIntro: "Questions a real customer might ask an AI assistant about you, and whether your pages answer them.",
  answeredOn: "Answered on",
  lockedTitle: "Unlocks with your email",
  lockedQuestions: (n: number) => `${n} more customer ${n === 1 ? "question" : "questions"}`,
  lockedDraft: (label: string) => `${label}, ready to paste`,
  lockedCta: "Unlock the full report",
  draftsTitle: "Ready-to-paste drafts",
  draftsIntro: "Written only from facts found on your pages. Check every fact before you publish.",
  noDrafts: "Nothing to draft this time: what you have already reads well, or there wasn't enough on your pages to write from.",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn't copy. Select the text and copy it by hand.",
} as const;

export const auditFactStatusLabels = { clear: "Clear", vague: "Vague", missing: "Missing" } as const;

export const auditAnsweredLabels = { yes: "Answered", partly: "Partly answered", no: "Not answered" } as const;

/** Draft names and one line on where each one goes. Keys match AiDrafts in src/lib/audit/types.ts. */
export const auditDraftCopy = {
  title: { label: "Title tag", where: "Replace the text inside the <title> tag in your homepage's <head>." },
  metaDescription: {
    label: "Meta description",
    where: 'Use as the content of <meta name="description"> in your homepage\'s <head>.',
  },
  llmsTxt: { label: "llms.txt", where: "Save as a plain-text file at the root of your site, so it loads at /llms.txt." },
  organizationJsonLd: {
    label: "Organization schema (JSON-LD)",
    where: 'Paste inside a <script type="application/ld+json"> tag in your homepage\'s <head>.',
  },
  answerParagraph: {
    label: "Answer-ready About paragraph",
    where: "Place near the top of your homepage or About page, directly under the main heading.",
  },
} as const;

export const auditExportCopy = {
  title: "Hand it to whoever builds your site",
  helper:
    "Copy every issue as Markdown tickets with an acceptance test each, or as one prompt you can paste into a coding agent such as Claude Code or Cursor.",
  copyTickets: "Copy as developer tickets",
  copyPrompt: "Copy as one prompt for a coding agent",
  download: "Download .md",
  copiedTickets: "Developer tickets copied.",
  copiedPrompt: "Coding agent prompt copied.",
  downloaded: "Tickets downloaded.",
  copyFailed: "Couldn't copy. Try Download .md instead.",
} as const;

/**
 * Instant quote in the audit report (T022). Prices, the tax note and the confirm note come from
 * src/lib/quote (QUOTE_TEXT, buildQuote); this is only the wording around them.
 * Rules: no urgency, no discounts, no pre-selected extras, no loss estimates.
 */
export const auditQuoteCopy = {
  // Not "fixed": the total can be a "From" price (R5 edit 1, Fable's ruling 1).
  title: "Your quote",
  intro: "Our price to fix what this audit found. Or fix it yourself: every issue has the steps.",
  currencyLabel: "Currency",
  currencyUsd: "USD $",
  currencyInr: "India ₹",
  covers: "Covers",
  totalLabel: "Total",
  perLocation: "per location",
  alternativeTitle: "Have a person look first",
  diyTitle: "You can fix these yourself for free",
  diyEmpty: "None of these issues is a quick do-it-yourself fix.",
  ignoreTitle: "Safe to ignore for now",
  ignoreEmpty: "Nothing here is safe to leave.",
  noLines: "Nothing in this report needs paid help.",
  request: "Request this fix",
  requestMany: "Request these fixes",
  requestAlternative: "Request the full audit",
  diy: "I'll fix it myself",
  // per issue
  fixMyself: "Fix it myself",
  /**
   * Per-issue toggle (Fable's ruling 1): one constant label, no price on the issue. Render
   * `addToFixList` with aria-pressed="false" and `onFixList` with aria-pressed="true".
   */
  addToFixList: "Add to my fix list",
  onFixList: "On my fix list",
  /** One line in the fix-list tray and the quote panel: "One Fix sprint covers up to 8 of these for $149." */
  fixListExplainer: (currency: QuoteCurrency) => {
    const p = priceIn(catalogItem("fix-sprint"), currency);
    const price = p ? formatPrice(p.amount, currency) : "a fixed price";
    return `One Fix sprint covers up to ${QUOTE_SCOPE_CAP.maxPaidIssues} of these for ${price}.`;
  },
  /** screen-reader name after "Copy": "Copy as a ticket: <issue title>" */
  copyTicket: "as a ticket",
  // tray
  trayTitle: "Your fix list",
  trayCount: (n: number) => `${n} ${n === 1 ? "issue" : "issues"} picked`,
  trayClear: "Clear list",
  trayAdded: (title: string, n: number, total: string) => `Added "${title}" to your fix list. ${n} ${n === 1 ? "issue" : "issues"}, ${total}.`,
  trayRemoved: (title: string, n: number) => `Removed "${title}" from your fix list. ${n} ${n === 1 ? "issue" : "issues"} left.`,
  trayCleared: "Fix list cleared.",
  /** sample report: the same panel, pointing to the audit instead of an order */
  sampleRequest: "Run this on your own site",
  sampleNote: "This quote is for the fictional sample site. Run the audit on your own site for yours.",
} as const;

/**
 * Report "front page" and issue-action strings (added by frontend-designer for T026, additive).
 * Verdicts describe the result plainly: no promises, no alarm. Bands follow the overall score;
 * the second clause comes from the issue counts.
 */
export const auditFrontPageCopy = {
  outOf: "out of 100",
  fixFirstTitle: "Fix first",
  notMeasured: "not measured",
  aiReadability: "AI readability",
  verdictBands: [
    { min: 90, label: "Excellent" },
    { min: 70, label: "In good shape" },
    { min: 50, label: "Findable, with gaps" },
    { min: 0, label: "Hard to find" },
  ],
  verdictDetail: {
    critical: (n: number) => `${n} critical ${n === 1 ? "issue holds" : "issues hold"} it back.`,
    high: (n: number) => `${n} high-priority ${n === 1 ? "issue is" : "issues are"} the place to start.`,
    some: (n: number) => `${n} smaller ${n === 1 ? "issue" : "issues"} left to tidy.`,
    none: "No issues found on the pages we checked.",
  },
  unavailable: "Not enough data for an overall score.",
  /** per-issue DIY path: a plain label, not a button (Fable's ruling on R4 finding 11) */
  fixMyselfNote: "Fix it myself: the steps are above",
} as const;
