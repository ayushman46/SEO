import type { PageCopy } from "./types";

export const aboutPage = {
  metaTitle: "About us: SEO and GEO for real businesses",
  metaDescription:
    "seenhq helps startups, SaaS teams and local businesses be found on Google and cited by AI answer engines. Learn who we are and how we work.",
  kicker: "About",
  title: "Be seen by people and by the machines they ask",
  intro:
    "seenhq is a small SEO and GEO studio. We audit websites for search engines and AI answer engines, then help fix what stops them from being found, trusted and cited.",
} satisfies PageCopy;

export const aboutSections: { title: string; body: string }[] = [
  {
    title: "seenhq at a glance",
    body: "seenhq checks how well a website works for two audiences at once: people searching on Google and Bing, and AI answer engines such as ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews. Our free audit scores a site on SEO, GEO and performance in about a minute, and our services fix what the audit finds.",
  },
  {
    title: "Why we started",
    body: "More people now ask an AI assistant instead of scrolling through search results. Most small businesses have no idea whether those assistants can read their website, let alone recommend it. We built seenhq to make that visible and fixable without an agency retainer.",
  },
  {
    title: "Who we work with",
    body: "Startups and SaaS teams who need their product understood by the tools their buyers use, and local businesses such as clinics, studios, cafés and trades who want to be the answer when someone nearby asks.",
  },
  {
    title: "How we work",
    body: "Plain language, fixed scope and honest limits. We tell you what we found, what it is worth fixing and what it will cost before we start. We never promise rankings or AI citations, because nobody can.",
  },
  {
    title: "Who is behind seenhq",
    body: "seenhq is run by [PLACEHOLDER: founder name], [PLACEHOLDER: one or two sentences on background and why you care about search and AI visibility]. Based in [PLACEHOLDER: City, Country].",
  },
];
