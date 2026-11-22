import type { PageCopy } from "./types";

export const contactPage = {
  metaTitle: "Contact us about an audit or fix",
  metaDescription:
    "Tell us about your website and what you need, from a full SEO or GEO audit to hands-on fixes. We reply by email with next steps and a fixed quote.",
  kicker: "Contact",
  title: "Tell us about your website",
  intro:
    "Share a few details and we will reply by email with next steps and a fixed quote. If you haven't run the free audit yet, it is a good place to start.",
} satisfies PageCopy;

/** Service values match the contact server action enum. */
export const contactServiceOptions: { value: string; label: string }[] = [
  { value: "seo-audit", label: "SEO audit" },
  { value: "geo-audit", label: "GEO audit" },
  { value: "technical-fixes", label: "Technical fixes" },
  { value: "content-entity", label: "Content & entity" },
  { value: "monitoring", label: "Monitoring" },
  { value: "ai-fact-check", label: "AI fact-check & fix" },
  { value: "local-ai-setup", label: "Local AI visibility setup" },
  { value: "ai-crawler-unblock", label: "AI crawler unblock" },
  { value: "not-sure", label: "Not sure yet" },
];

/** Budget values: architect-backend should mirror these in the contact schema enum. */
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
    budget: { label: "Budget", help: "Optional. Helps us suggest the right scope.", placeholder: "Choose a range" },
    message: {
      label: "Message",
      help: "What's the goal, and is there anything we should know about your site?",
      placeholder: "We rank well locally but never show up when people ask ChatGPT for a dentist nearby.",
    },
    consent: {
      label: "I agree that seenhq may store these details to reply to my enquiry, as described in the privacy policy.",
    },
  },
  submitLabel: "Send message",
  submittingLabel: "Sending…",
  success: {
    title: "Thanks, your message is in.",
    body: "We will reply by email within [PLACEHOLDER: 2 working days]. In the meantime, you can run a free audit of your site.",
    cta: { label: "Run a free audit", href: "/audit" },
  },
  errors: {
    generic: "Something went wrong sending your message. Please try again, or email us directly.",
    rateLimited: "You have sent several messages in a short time. Please wait a while and try again.",
    fieldsInvalid: "Please check the highlighted fields.",
  },
  directEmailLabel: "Prefer email? Write to",
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
      body: "We reply within [PLACEHOLDER: 2 working days] with questions, next steps and a fixed quote for the work.",
    },
    {
      title: "Nothing starts until you agree",
      body: "You pay nothing until you accept the quote. If we are not the right fit, we will say so.",
    },
  ],
  auditPrompt: {
    body: "Haven't run the free audit yet? It takes about a minute and gives us a head start.",
    cta: { label: "Run a free audit", href: "/audit" },
  },
};
