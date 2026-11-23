import type { PageCopy } from "./types";

export const contactPage = {
  metaTitle: "Contact us about an audit or fix",
  metaDescription:
    "Tell us about your website. We reply within two working days, by email, with a fixed quote, and nothing starts until you agree to it.",
  kicker: "Contact",
  title: "Tell us about your website",
  intro:
    "Tell us what you need. We reply within two working days, by email, with a fixed quote.",
} satisfies PageCopy;

/** Service values match the contact server action enum. */
export const contactServiceOptions: { value: string; label: string }[] = [
  { value: "seo-audit", label: "SEO audit" },
  { value: "geo-audit", label: "GEO audit" },
  { value: "technical-fixes", label: "Fix sprint" },
  { value: "content-entity", label: "Content & entity" },
  { value: "monitoring", label: "Monitoring" },
  { value: "ai-fact-check", label: "AI fact-check & fix" },
  { value: "local-ai-setup", label: "Local AI visibility setup" },
  { value: "ai-crawler-unblock", label: "AI crawler unblock" },
  { value: "not-sure", label: "Not sure yet" },
];

/**
 * @deprecated R5 edit 9: the budget field is no longer in the form. The server still accepts the
 * value as optional (CONTACT_BUDGETS in src/app/actions/contact-schema.ts mirrors these), and
 * tests/backend/contact-schema.test.ts pins them, so this export stays until that test changes.
 */
export const contactBudgetOptions: { value: string; label: string }[] = [
  { value: "under-100", label: "Under $100" },
  { value: "100-300", label: "$100 to $300" },
  { value: "300-1000", label: "$300 to $1,000" },
  { value: "1000-plus", label: "Over $1,000" },
  { value: "not-sure", label: "Not sure yet" },
];

export const contactForm = {
  fields: {
    name: { label: "Your name", help: "", placeholder: "Jane Doe" },
    email: {
      label: "Email",
      help: "We only use this to reply to you.",
      placeholder: "you@company.com",
    },
    company: { label: "Business name", help: "Optional.", placeholder: "Acme Dental" },
    website: {
      label: "Website",
      help: "Optional. The address you want us to look at.",
      placeholder: "example.com",
    },
    service: { label: "What do you need?", help: "Pick the closest match.", placeholder: "Choose a service" },
    message: {
      label: "Message",
      help: "What's the goal, and is there anything we should know about your site?",
      placeholder: "We rank well locally but never show up when people ask ChatGPT for a dentist nearby.",
    },
    consent: {
      label: "I agree that noticr may store these details to reply to my enquiry, as described in the privacy policy.",
    },
  },
  submitLabel: "Send message",
  submittingLabel: "Sending…",
  success: {
    title: "Thanks, your message is in.",
    body: "We reply within two working days. In the meantime, you can run a free audit of your site.",
    cta: { label: "Run a free audit", href: "/audit" },
  },
  /** Success after sending a quote from an audit report: no "run an audit" nudge (R7 #11). */
  successWithQuote: { body: "We reply within two working days with your quote in writing." },
  errors: {
    generic: "Something went wrong sending your message. Please try again in a few minutes.",
    rateLimited: "You have sent several messages in a short time. Please wait a while and try again.",
    fieldsInvalid: "Please check the highlighted fields.",
  },
} as const;

/** "What happens next" panel beside the contact form (added by frontend-designer for T006; content-seo may refine). */
export const contactNextSteps = {
  title: "What happens next",
  steps: [
    {
      title: "We read your message",
      body: "A person reads every enquiry. If you shared your website, we take a first look before replying.",
    },
    {
      title: "You get a reply by email",
      body: "We reply within two working days with questions, next steps and a fixed quote for the work.",
    },
    {
      title: "Nothing starts until you agree",
      body: "You pay nothing until you accept the quote.",
    },
  ],
  auditPrompt: {
    body: "Haven't run the free audit yet? It takes about a minute and gives us a head start.",
    cta: { label: "Run a free audit", href: "/audit" },
  },
};

/**
 * Quote carried over from the audit report (T022). Shown above the form when a visitor
 * clicks "Request this fix"; nothing personal travels in the URL.
 */
export const contactQuoteCopy = {
  title: "Your quote",
  intro: (site: string) => `From the free audit of ${site}. It is sent with your message; you can still change anything.`,
  totalLabel: "Total",
  remove: "Remove quote",
  removed: "Quote removed. Your message will be sent without it.",
  message: (site: string) => `Please fix the items in my quote for ${site}.`,
  nextSteps: {
    title: "What happens next",
    steps: [
      {
        title: "A person checks your quote",
        body: "We compare it with your audit. Where a price is a starting price, we confirm the final number within two working days.",
      },
      {
        title: "You get the quote in writing",
        body: "By email, with what is covered, what is not, and what access we need from you.",
      },
      {
        title: "Nothing starts until you agree",
        body: "You pay nothing until you accept the quote. Prices exclude applicable taxes.",
      },
    ],
  },
} as const;
