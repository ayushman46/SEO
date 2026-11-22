import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { auditAiCopy, auditDraftCopy, auditExportCopy } from "@/content/audit";
import type { AiInsights, AuditResult, PartialAiInsights } from "@/lib/audit/types";
import { AiFullSection, AiPartialCard } from "./AiReading";
import { CheckGrid, checkLabel } from "./CheckGrid";
import { exportFilename } from "./clipboard";
import { FullReport } from "./FullReport";

const XSS = '</script><script>alert("x")</script><img src=x onerror=alert(1)>';

const aiFixture: AiInsights = {
  model: "example/open-weight-model-70b-instruct",
  readback: "A family-run dental clinic in Pune that offers check-ups, cleaning and braces.",
  businessType: "local dental clinic",
  clarityScore: 64,
  facts: [
    { key: "what", label: "What you do", value: "General and cosmetic dentistry", status: "clear" },
    { key: "who-for", label: "Who it's for", value: "Families in Pune", status: "clear" },
    { key: "where", label: "Where", value: "Baner, Pune", status: "clear" },
    { key: "pricing", label: "Pricing", value: null, status: "missing" },
    { key: "contact", label: "Contact", value: "+91 20 0000 0000", status: "clear" },
    { key: "proof", label: "Proof", value: "Some reviews mentioned", status: "vague" },
    { key: "differentiator", label: "What makes you different", value: null, status: "missing" },
  ],
  questions: [
    { question: "Do they do braces for adults?", answered: "yes", sourceUrl: "https://clinic.example/services", note: "The services page lists adult braces." },
    { question: "How much is a cleaning?", answered: "no", sourceUrl: null, note: "No prices anywhere on the site." },
    { question: "Are they open on Sunday?", answered: "partly", sourceUrl: "javascript:alert(1)", note: "Hours are listed without Sundays." },
    { question: "Do they take insurance?", answered: "no", sourceUrl: null, note: "Not mentioned." },
  ],
  drafts: {
    title: "Family Dentist in Baner, Pune | Example Dental",
    metaDescription: null,
    llmsTxt: `# Example Dental\n\n> ${XSS}`,
    organizationJsonLd: JSON.stringify({ "@context": "https://schema.org", "@type": "Dentist", name: XSS }, null, 2),
    answerParagraph: "Example Dental is a family-run clinic in Baner, Pune.",
  },
};

const partialFixture: PartialAiInsights = {
  model: aiFixture.model,
  readback: aiFixture.readback,
  businessType: aiFixture.businessType,
  clarityScore: aiFixture.clarityScore,
  factCounts: { clear: 4, vague: 1, missing: 2 },
  questionCounts: { yes: 1, partly: 1, no: 2 },
  sampleQuestions: aiFixture.questions.slice(0, 2),
  lockedQuestionCount: 2,
  lockedDrafts: ["title", "llmsTxt", "organizationJsonLd", "answerParagraph"],
};

const resultFixture: AuditResult = {
  id: "00000000-0000-4000-8000-000000000000",
  version: 1,
  requestedUrl: "https://clinic.example",
  finalUrl: "https://clinic.example/",
  hostname: "clinic.example",
  startedAt: "2026-11-23T10:00:00.000Z",
  durationMs: 21000,
  scores: { overall: 61, seo: 70, geo: 52, performance: null },
  checks: [
    { id: "geo.ai-clarity", category: "geo", label: "", status: "warn", score: 0.6, weight: 1, summary: "4 of 7 facts are clear." },
    { id: "geo.ai-crawler-probe", category: "geo", label: "", status: "unavailable", score: 0, weight: 1, summary: "" },
  ],
  issues: [],
  pages: [],
  coreWebVitals: null,
  truncated: false,
  notes: [],
  ai: aiFixture,
};

const render = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("AiPartialCard", () => {
  it("renders only the quiet line when ai is null or missing", () => {
    for (const ai of [null, undefined]) {
      const html = render(createElement(AiPartialCard, { ai, headingId: "r-ai", gateHref: "#gate" }));
      expect(html).toContain(auditAiCopy.unavailable.replaceAll("'", "&#x27;"));
      expect(html).not.toContain("<section");
      expect(html).not.toContain(auditAiCopy.partialTitle);
    }
  });

  it("shows readback, counts, two samples, locked names and the honesty label, but never draft text", () => {
    // Even if a future API leaked drafts into the partial payload, the card must not render them.
    const leaky = { ...partialFixture, drafts: aiFixture.drafts, questions: aiFixture.questions } as unknown as PartialAiInsights;
    const html = render(createElement(AiPartialCard, { ai: leaky, headingId: "r-ai", gateHref: "#gate" }));
    expect(html).toContain(auditAiCopy.partialTitle);
    expect(html).toContain("A family-run dental clinic in Pune");
    expect(html).toContain("local dental clinic");
    expect(html).toContain(aiFixture.model);
    expect(html).toContain("Do they do braces for adults?");
    expect(html).toContain("How much is a cleaning?");
    expect(html).not.toContain("Are they open on Sunday?");
    expect(html).toContain(auditAiCopy.lockedQuestions(2));
    expect(html).toContain(auditDraftCopy.llmsTxt.label);
    expect(html).toContain('href="#gate"');
    expect(html).not.toContain("Family Dentist in Baner");
    expect(html).not.toContain("Example Dental");
    expect(html).not.toContain("schema.org");
    expect(html).not.toMatch(/<pre|<code>/);
  });
});

describe("AiFullSection", () => {
  const html = render(createElement(AiFullSection, { ai: aiFixture, hostname: "clinic.example", idPrefix: "f-ai" }));

  it("renders drafts as plain text: markup shows literally", () => {
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;/script&gt;&lt;script&gt;alert(");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("shows all 7 facts, 'Not found' for missing values, and every non-null draft with a Copy button", () => {
    expect(html.match(/<dt/g)).toHaveLength(7);
    expect(html.split(auditAiCopy.factNotFound).length - 1).toBe(2);
    expect(html.match(/<pre/g)).toHaveLength(4);
    expect(html).not.toContain(auditDraftCopy.metaDescription.label);
    expect(html).toContain(`${auditAiCopy.copy} ${auditDraftCopy.title.label}`);
  });

  it("links only http(s) source URLs, in a new tab with noopener", () => {
    expect(html).toContain('href="https://clinic.example/services"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).not.toContain("javascript:");
  });
});

describe("FullReport", () => {
  it("includes the export bar and the AI reading section", () => {
    const html = render(createElement(FullReport, { result: resultFixture, headingId: "full" }));
    expect(html).toContain(auditExportCopy.copyTickets);
    expect(html).toContain(auditExportCopy.copyPrompt);
    expect(html).toContain(auditAiCopy.fullTitle);
  });

  it("shows the quiet line when ai is null", () => {
    const html = render(createElement(FullReport, { result: { ...resultFixture, ai: null }, headingId: "full" }));
    expect(html).toContain(auditAiCopy.unavailable.replaceAll("'", "&#x27;"));
    expect(html).not.toContain('id="full-ai"');
  });
});

describe("checks with new ids", () => {
  it("falls back to friendly labels and reads 'Not run' for unavailable", () => {
    expect(checkLabel({ id: "geo.ai-crawler-probe", label: "" })).toBe("AI crawler access test");
    expect(checkLabel({ id: "geo.brand-new-thing", label: "" })).toBe("Brand new thing");
    expect(checkLabel({ id: "seo.title", label: "Title tags" })).toBe("Title tags");
    const html = render(
      createElement(CheckGrid, {
        checks: [
          ...resultFixture.checks,
          { id: "x.future", category: "future" as never, label: "Future check", status: "pass" },
        ],
      }),
    );
    expect(html).toContain("Not run");
    expect(html).toContain("1 not run");
    expect(html).toContain("Future check");
    expect(html).toContain("Other");
  });

  it("builds safe export filenames", () => {
    expect(exportFilename("Clinic.Example", "tickets")).toBe("seenhq-clinic.example-tickets.md");
    expect(exportFilename("../../etc", "tickets")).toBe("seenhq-etc-tickets.md");
  });
});
