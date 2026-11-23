/** Copy for the audit URL form (home hero and /audit). Split from audit.ts (R5 #16); audit.ts re-exports it. */
export const auditForm = {
  label: "Website address",
  placeholder: "example.com",
  help: "We only read public pages, the same way a search engine does.",
  submitLabel: "Run free audit",
  submittingLabel: "Auditing…",
  invalidInput: "That doesn't look like a website address. Try something like example.com.",
  /** Shown only when scripts are off (<noscript> on /audit): the GET form just carries the address. */
  noScript: "The audit runs in your browser, so it needs JavaScript. Please turn JavaScript on and try again.",
} as const;
