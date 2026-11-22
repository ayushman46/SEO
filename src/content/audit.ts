import type { PageCopy } from "./types";

export const auditPage = {
  metaTitle: "Free SEO and GEO audit for your website",
  metaDescription:
    "Check your website for Google and AI answer engines in about a minute. Get SEO, GEO and performance scores plus a ranked list of fixes, for free.",
  kicker: "Free audit",
  title: "How does your site look to search and AI?",
  intro:
    "Enter your website address. seenhq checks your homepage and up to five key pages for SEO, GEO and mobile performance, then scores them and ranks what to fix first.",
} satisfies PageCopy;

export const auditForm = {
  label: "Website address",
  placeholder: "example.com",
  help: "We only read public pages, the same way a search engine does.",
  submitLabel: "Run free audit",
  submittingLabel: "Auditing…",
  invalidInput: "That doesn't look like a website address. Try something like example.com.",
} as const;

/** Shown in order while the audit runs. */
export const auditProgressSteps = [
  "Checking the address",
  "Reading robots.txt and sitemap",
  "Scanning pages",
  "Asking PageSpeed",
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
  helpCta: { label: "Get help fixing this", href: "/contact" },
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
  invalid_url: "That doesn't look like a valid website address. Check the spelling and try again, for example example.com.",
  blocked_host: "We can't audit that address. It points to a private or reserved network, which we don't scan for security reasons.",
  unreachable: "We couldn't reach that website. Check that it is online and publicly accessible, then try again.",
  timeout: "The website took too long to respond. It may be slow or busy right now, so please try again in a few minutes.",
  not_html: "That address doesn't return a web page. Try your homepage address instead.",
  too_large: "That page is too large for us to scan. Try your homepage address or a lighter page.",
  rate_limited: "You've run several audits in a short time. Please wait a little while before running another one.",
  invalid_or_expired: "This report has expired. Run the audit again to unlock the full results.",
  generic: "Something went wrong on our side. Please try again in a moment.",
} as const;

export type AuditErrorCopyKey = keyof typeof auditErrors;
