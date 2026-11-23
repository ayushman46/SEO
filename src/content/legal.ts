import type { LegalDoc } from "./types";

/** Meta for the legal pages (LegalDoc has no meta fields). */
export const privacyMeta = {
  metaTitle: "Privacy policy: how we handle your data",
  metaDescription:
    "How noticr handles data from the free audit, its AI reading, report unlock and contact form: what we collect, why, who processes it and how to delete it.",
};

export const termsMeta = {
  metaTitle: "Terms of service: audits and paid services",
  metaDescription:
    "The terms for using noticr: what the free audit does and doesn't promise, acceptable use, paid services, liability and how these terms can change.",
};

export const privacy = {
  title: "Privacy policy",
  updated: "2026-11-23",
  sections: [
    {
      heading: "Who we are",
      body: [
        "This website and its services are operated under the noticr name. In this policy, \"noticr\", \"we\" and \"us\" mean the operator of noticr.",
        "For any question about this policy or your data, use the contact form at /contact and we will reply by email.",
      ],
    },
    {
      heading: "What we collect and why",
      body: [
        "When you run an audit: the website address you enter and the results of the audit (scores, checks, issues, a summary of the pages we scanned and, when it runs, the AI reading of those pages and its drafts). We use these to show you the report. Today we do not store them on our servers (see \"How long we keep it\").",
        "When you unlock a full report: your email address, the audit it belongs to, the website address and score, a record that you ticked the consent box, and the browser's user-agent string. Ticking that box is required to unlock the report; it covers storing your email with the report and contacting you about it. You can withdraw it at any time (see \"Your rights\").",
        "When you use the contact form: your name, email, and any business name, website, service, budget and message you choose to send. We use this only to reply to your enquiry and to deliver any work you ask for.",
        "For all of the above we also use a one-way, salted hash of your IP address. We use it to limit abuse (for example, too many audits per hour). We do not store your IP address itself.",
      ],
    },
    {
      heading: "What we fetch from the websites you audit",
      body: [
        "When you enter a website address, our crawler (user agent \"noticrbot\") fetches publicly available pages from that site: the address you entered (normally the homepage), robots.txt, the sitemap, llms.txt and up to five internal pages. We always read the page you asked us to audit; for the internal pages we skip anything the site's robots.txt disallows for noticrbot. We never submit forms and never access password-protected areas.",
        "As part of the crawler access test, we also send a small number of simulated requests to public pages of that site whose user agent names the AI crawler being simulated and is labelled as a noticr test. These requests come from our servers, not from OpenAI, Anthropic, Perplexity, Google or any other AI company. Details are on our crawler page at /bot.",
        "We also send the address you entered to Google PageSpeed Insights to measure performance. Google processes that request under its own terms and privacy policy.",
      ],
    },
    {
      heading: "AI analysis of the websites you audit",
      body: [
        "When the AI reading runs, we send text from the public pages we fetched from the audited website to NVIDIA's hosted model API, where an open-weight language model analyses it and returns the result to us. What we send: each page's address, title, meta description, headings and visible text, shortened to a fixed length, plus technical facts our own checks found (such as robots.txt and structured data results). NVIDIA processes these requests under its own terms and privacy policy.",
        "We never send your email address, your contact form messages, your IP address or any other information about you as a visitor to NVIDIA or to any AI model. Only content the audited website already publishes to everyone is sent.",
        "If the AI reading is unavailable or too slow, the audit finishes without it.",
      ],
    },
    {
      heading: "Cookies and analytics",
      body: [
        "noticr does not set advertising or tracking cookies. We use Vercel Web Analytics and Speed Insights, which measure page views and performance without cookies and without identifying you personally.",
        "While you view an audit, your browser briefly holds an encrypted copy of the full report so it can be unlocked. It expires after two hours and cannot be read without the unlock step.",
      ],
    },
    {
      heading: "Who processes your data",
      body: [
        "We use a small number of service providers to run noticr: our hosting provider (Vercel), which also provides our cookie-free analytics and server logs; if we send email notifications, our email provider; if we add a database, our database provider; Google PageSpeed Insights for performance checks; and NVIDIA's hosted model API for the AI reading of audited public pages (it receives page text only, never visitor data).",
        "We do not sell your personal data and we do not share it with anyone for their own marketing.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "As of 23 November 2026 we do not run a database. Audit requests, unlocked-report emails and contact messages are processed in memory and appear in our hosting provider's server logs, which Vercel keeps for a limited time under its own retention settings. Notifications we receive by email are deleted within 24 months, or sooner if you ask.",
        "If we add a database, we will update this page first. We keep audit records, leads and contact messages for up to 24 months, then delete them, or sooner if you ask.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "You can ask us for a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it. Contact us via the contact form at /contact, using the email address you gave us, and we will act on it within 30 days.",
        "You can withdraw your consent to be contacted about your report at any time by replying to any email from us or contacting us via the contact form at /contact.",
        "Depending on where you live, you may also have the right to complain to your local data protection authority.",
      ],
    },
    {
      heading: "Security",
      body: [
        "Data is sent over HTTPS. If we add a database, only our server will be able to access it. Full audit reports held in your browser are encrypted. No system is perfectly secure, but we limit what we collect so there is less to protect.",
      ],
    },
    {
      heading: "Changes to this policy",
      body: [
        "If we change how we handle data, we will update this page and the date at the top. Significant changes will be highlighted on the site.",
      ],
    },
  ],
} satisfies LegalDoc;

export const terms = {
  title: "Terms of service",
  updated: "2026-11-23",
  sections: [
    {
      heading: "About these terms",
      body: [
        "These terms apply to your use of the noticr website, the free audit and any paid services. This website and its services are operated under the noticr name. By using the site you agree to these terms.",
      ],
    },
    {
      heading: "The free audit",
      body: [
        "The audit is an automated check of publicly available pages. It is a guide, not a guarantee: automated checks can miss things or flag issues that do not matter for your site, and third-party data such as Google PageSpeed Insights may be unavailable or vary between runs.",
        "Scores and recommendations are our opinion of good practice at the time of the audit. Search engines and AI answer engines change often and decide for themselves what to rank, show or cite.",
        "The AI reading and its drafts (titles, descriptions, llms.txt, schema and paragraphs) are generated by a language model. They are one model's reading of your public pages, not what ChatGPT, Gemini, Perplexity or any other assistant says about you, and they may contain errors or omissions. Review and correct every AI-generated reading or draft before you rely on it or publish it.",
        "The AI crawler test is simulated from our servers. Sites that verify crawler IP addresses may treat the real crawlers differently, in either direction.",
      ],
    },
    {
      heading: "Acceptable use",
      body: [
        "Please only audit websites you own, manage or have a legitimate interest in. Do not use noticr to overload, probe or attack any website, to get around our rate limits, or to scrape our site or reports at scale.",
        "We may block requests or addresses that we believe are abusing the service.",
      ],
    },
    {
      heading: "Paid services",
      body: [
        "Paid services such as Full audits, Fix sprints, content work and monitoring are agreed by email before work starts. The agreed scope, price and timing in that email, together with these terms, form our agreement.",
        "Payment: we send an invoice before work starts, and you can pay by bank transfer, UPI or card. Payment is due before work starts for one-time services; monitoring is billed monthly in advance. Prices exclude applicable taxes.",
        "Refunds: if we haven't started the work, you get a full refund. Once work has started, we'll agree a fair partial refund based on what's been delivered.",
        "Monitoring can be cancelled any time by email and stops at the end of the month you have paid for.",
        "Where we make changes to your website, you are responsible for giving us appropriate access and for keeping your own backups.",
      ],
    },
    {
      heading: "No guarantees of rankings or citations",
      body: [
        "We do not and cannot guarantee any particular ranking in Google, Bing or any other search engine, or that ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews, Microsoft Copilot or any other AI engine will mention or cite your website. noticr is not affiliated with or endorsed by any of these companies; their names are used only to describe what we check.",
      ],
    },
    {
      heading: "Your content and our reports",
      body: [
        "You keep all rights in your website and content. Reports we produce for you are yours to use within your business. The noticr site, software, design and brand remain ours.",
      ],
    },
    {
      heading: "Liability",
      body: [
        "The free audit is provided \"as is\" without warranties of any kind. To the extent the law allows, we are not liable for indirect or consequential losses, such as lost profits or lost traffic, and our total liability for any paid service is limited to the amount you paid for it.",
        "Nothing in these terms limits liability that cannot be limited by law.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These terms are governed by the laws of India, and the competent courts in India have jurisdiction over any dispute.",
      ],
    },
    {
      heading: "Changes and contact",
      body: [
        "We may update these terms. The date at the top shows when they last changed. For questions, use the contact form at /contact and we'll reply by email.",
      ],
    },
  ],
} satisfies LegalDoc;
