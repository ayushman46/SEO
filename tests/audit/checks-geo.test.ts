import { describe, expect, it } from "vitest";
import { doc, goodHome, makeCtx, page } from "./helpers";
import { aiCrawlersCheck } from "@/lib/audit/checks/geo/ai-crawlers";
import { llmsTxtCheck, isValidLlmsTxt } from "@/lib/audit/checks/geo/llms-txt";
import { organizationSchemaCheck } from "@/lib/audit/checks/geo/organization-schema";
import { faqCheck, isQuestion } from "@/lib/audit/checks/geo/faq";
import { authorCheck } from "@/lib/audit/checks/geo/author";
import { datesCheck } from "@/lib/audit/checks/geo/dates";
import { answerReadyCheck, isAnswerParagraph } from "@/lib/audit/checks/geo/answer-ready";
import { entityConsistencyCheck, namesMatch } from "@/lib/audit/checks/geo/entity-consistency";
import { GEO_CHECKS } from "@/lib/audit/checks/geo";

const keys = (o: { issues: { key: string }[] }) => o.issues.map((i) => i.key);
const ld = (obj: unknown) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
const blank = () => makeCtx({ pages: [page(doc({ head: "<title>Acme</title>" }))] });

describe("a well-built site passes every GEO check", () => {
  it("all pass", () => {
    const ctx = makeCtx({ pages: [page(goodHome())], llms: "# Acme Plumbing\n> Plumbers in Leeds\n" });
    for (const check of GEO_CHECKS) {
      const o = check(ctx);
      expect({ id: o.id, status: o.status, issues: keys(o) }).toEqual({ id: o.id, status: "pass", issues: [] });
    }
  });
});

describe("geo.ai-crawlers", () => {
  it("no robots.txt → everyone allowed", () => {
    expect(aiCrawlersCheck(blank()).status).toBe("pass");
  });
  it("blocking search bots is worse than blocking training bots", () => {
    const training = aiCrawlersCheck(
      makeCtx({ pages: [page(doc())], robots: "User-agent: GPTBot\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n" }),
    );
    expect(keys(training)).toEqual(["geo.ai-crawlers:training-blocked"]);
    expect(training.issues[0].detail).toContain("GPTBot");

    const search = aiCrawlersCheck(
      makeCtx({ pages: [page(doc())], robots: "User-agent: OAI-SearchBot\nUser-agent: PerplexityBot\nDisallow: /\n" }),
    );
    expect(keys(search)).toEqual(["geo.ai-crawlers:search-blocked"]);
    expect(search.score).toBeLessThan(training.score);
  });
  it("a wildcard disallow blocks every AI bot (critical)", () => {
    const o = aiCrawlersCheck(makeCtx({ pages: [page(doc())], robots: "User-agent: *\nDisallow: /\n" }));
    expect(o.score).toBe(0);
    expect(o.status).toBe("fail");
    expect(o.issues.find((i) => i.key === "geo.ai-crawlers:search-blocked")?.severity).toBe("critical");
  });
  it("explicit allow for a bot overrides the wildcard", () => {
    const o = aiCrawlersCheck(
      makeCtx({
        pages: [page(doc())],
        robots: "User-agent: *\nDisallow: /\n\nUser-agent: OAI-SearchBot\nUser-agent: ChatGPT-User\nUser-agent: Claude-SearchBot\nUser-agent: PerplexityBot\nAllow: /\n",
      }),
    );
    expect(keys(o)).toEqual(["geo.ai-crawlers:training-blocked"]);
  });
});

describe("geo.llms-txt", () => {
  it("format", () => {
    expect(isValidLlmsTxt("# Acme\n> hi")).toBe(true);
    expect(isValidLlmsTxt("﻿\n# Acme")).toBe(true);
    expect(isValidLlmsTxt("Acme\n")).toBe(false);
    expect(isValidLlmsTxt("#Acme")).toBe(false);
  });
  it("missing warns, bad format warns", () => {
    expect(llmsTxtCheck(blank())).toMatchObject({ status: "warn" });
    expect(keys(llmsTxtCheck(makeCtx({ pages: [page(doc())], llms: "hello" })))).toEqual(["geo.llms-txt:invalid-format"]);
  });
});

describe("geo.organization-schema", () => {
  it("missing", () => {
    expect(keys(organizationSchemaCheck(blank()))).toEqual(["geo.organization-schema:missing"]);
  });
  it("incomplete (name only) vs complete LocalBusiness subtype", () => {
    const partial = organizationSchemaCheck(makeCtx({ pages: [page(doc({ head: ld({ "@type": "Organization", name: "Acme" }) }))] }));
    expect(keys(partial)).toEqual(["geo.organization-schema:incomplete"]);
    expect(partial.issues[0].detail).toContain("url");
    const full = organizationSchemaCheck(
      makeCtx({
        pages: [
          page(
            doc({
              head: ld({ "@context": "https://schema.org", "@type": ["Dentist"], name: "Acme", url: "https://a.com", sameAs: ["https://x.com/a"] }),
            }),
          ),
        ],
      }),
    );
    expect(full.status).toBe("pass");
  });
  it("finds orgs nested in @graph or as a publisher", () => {
    const nested = ld({
      "@type": "WebPage",
      publisher: { "@type": "Organization", name: "Acme", url: "https://a.com", logo: { "@type": "ImageObject", url: "https://a.com/l.png" } },
    });
    expect(organizationSchemaCheck(makeCtx({ pages: [page(doc({ head: nested }))] })).status).toBe("pass");
  });
  it("a plain Service is not an organization", () => {
    expect(keys(organizationSchemaCheck(makeCtx({ pages: [page(doc({ head: ld({ "@type": "Service", name: "Cleaning" }) }))] })))).toEqual([
      "geo.organization-schema:missing",
    ]);
  });
});

describe("geo.faq", () => {
  it("question detection", () => {
    expect(isQuestion("How much does it cost?")).toBe(true);
    expect(isQuestion("How to fix a dripping tap")).toBe(true);
    expect(isQuestion("What is a root canal")).toBe(true);
    expect(isQuestion("Why us?")).toBe(true);
    expect(isQuestion("How we work")).toBe(false);
    expect(isQuestion("Who we are")).toBe(false);
    expect(isQuestion("Our services")).toBe(false);
  });
  it("FAQPage schema passes; 3 question headings pass; 1 warns; 0 fails", () => {
    expect(faqCheck(makeCtx({ pages: [page(doc({ head: ld({ "@type": "FAQPage" }) }))] })).status).toBe("pass");
    const three = doc({ body: "<h2>How long does it take?</h2><h2>Do you offer refunds?</h2><h3>Is parking free?</h3>" });
    expect(faqCheck(makeCtx({ pages: [page(three)] })).status).toBe("pass");
    expect(keys(faqCheck(makeCtx({ pages: [page(doc({ body: "<h2>Why us?</h2>" }))] })))).toEqual(["geo.faq:few"]);
    expect(keys(faqCheck(blank()))).toEqual(["geo.faq:missing"]);
  });
  it("counts <details><summary> questions", () => {
    const html = doc({ body: "<details><summary>Can I pay by card?</summary>Yes</details>".repeat(1) + "<details><summary>Do you deliver?</summary></details><details><summary>Where are you based?</summary></details>" });
    expect(faqCheck(makeCtx({ pages: [page(html)] })).status).toBe("pass");
  });
});

describe("geo.author and geo.dates", () => {
  it("author signals", () => {
    expect(authorCheck(blank()).status).toBe("warn");
    expect(authorCheck(makeCtx({ pages: [page(doc({ head: '<meta name="author" content="Jane">' }))] })).status).toBe("pass");
    expect(authorCheck(makeCtx({ pages: [page(doc({ body: '<a rel="author" href="/jane">Jane</a>' }))] })).status).toBe("pass");
    expect(authorCheck(makeCtx({ pages: [page(doc({ head: ld({ "@type": "Article", author: { "@type": "Person", name: "J" } }) }))] })).status).toBe("pass");
  });
  it("date signals", () => {
    expect(keys(datesCheck(blank()))).toEqual(["geo.dates:missing"]);
    expect(datesCheck(makeCtx({ pages: [page(doc({ body: '<time datetime="2026-01-01">1 Jan</time>' }))] })).status).toBe("pass");
    expect(datesCheck(makeCtx({ pages: [page(doc({ head: ld({ "@type": "Article", dateModified: "2026-02-02" }) }))] })).status).toBe("pass");
    expect(datesCheck(makeCtx({ pages: [page(doc({ head: '<meta property="article:modified_time" content="2026-01-01">' }))] })).status).toBe("pass");
  });
});

describe("geo.answer-ready", () => {
  const answer =
    "A root canal removes infected pulp from inside a tooth, cleans the canals and seals them. It usually takes one or two visits and saves the natural tooth.";
  it("paragraph rule: 20–60 words, ≤3 sentences", () => {
    expect(isAnswerParagraph(answer)).toBe(true);
    expect(isAnswerParagraph("Too short to count.")).toBe(false);
    expect(isAnswerParagraph(`${answer} ${answer} ${answer}`)).toBe(false);
  });
  it("scores answer blocks, summary and lists separately", () => {
    const none = answerReadyCheck(blank());
    expect(keys(none).sort()).toEqual(["geo.answer-ready:no-answer-blocks", "geo.answer-ready:no-lists", "geo.answer-ready:no-summary"]);
    expect(none.score).toBe(0);

    const html = doc({
      body: `<main><h2>What is a root canal?</h2><p>${answer}</p><div><h2>Does it hurt?</h2></div><div><p>${answer}</p></div><h2>Recovery</h2><p>${answer}</p><ol><li>a</li><li>b</li><li>c</li></ol></main>`,
    });
    const o = answerReadyCheck(makeCtx({ pages: [page(html)] }));
    expect(keys(o)).toEqual(["geo.answer-ready:no-summary"]);
    expect(o.score).toBeCloseTo(0.8);
  });
  it("nav lists don't count as content lists", () => {
    const html = doc({ body: "<nav><ul><li>a</li><li>b</li><li>c</li></ul></nav>" });
    expect(keys(answerReadyCheck(makeCtx({ pages: [page(html)] })))).toContain("geo.answer-ready:no-lists");
  });
});

describe("geo.entity-consistency", () => {
  it("name matching ignores case, punctuation and legal suffixes", () => {
    expect(namesMatch("Acme Plumbing Ltd.", "acme plumbing")).toBe(true);
    expect(namesMatch("Smith & Sons", "Smith and Sons LLC")).toBe(true);
    expect(namesMatch("Acme", "Globex")).toBe(false);
  });
  it("not declared / inconsistent / consistent", () => {
    expect(keys(entityConsistencyCheck(blank()))).toEqual(["geo.entity-consistency:not-declared"]);
    const mismatch = entityConsistencyCheck(
      makeCtx({
        pages: [page(doc({ head: `<title>Acme | Home</title><meta property="og:site_name" content="Acme">${ld({ "@type": "Organization", name: "Globex Corp" })}` }))],
      }),
    );
    expect(keys(mismatch)).toEqual(["geo.entity-consistency:inconsistent"]);
    expect(mismatch.issues[0].detail).toContain("Globex");
    const ok = entityConsistencyCheck(
      makeCtx({
        pages: [page(doc({ head: `<title>Plumber in Leeds | Acme</title><meta property="og:site_name" content="Acme">${ld({ "@type": "Organization", name: "Acme Ltd" })}` }))],
      }),
    );
    expect(ok.status).toBe("pass");
  });
});
