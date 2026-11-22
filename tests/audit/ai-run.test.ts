/**
 * runAudit + the LLM phase (T014): crawl is mocked to return a fixture context, the NVIDIA
 * endpoint is a stubbed global fetch. No network.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deflateRawSync } from "node:zlib";
import { randomBytes } from "node:crypto";
import type { AiInsights, AuditResult } from "@/lib/audit/types";
import { goodHome, makeCtx, page } from "./helpers";

const state = vi.hoisted(() => ({ crawlDelayMs: 0 }));
const HOME = "https://acme.example.com/";

vi.mock("@/lib/audit/crawl", async () => {
  const h = await import("./helpers");
  return {
    crawl: async () => {
      if (state.crawlDelayMs) await new Promise((r) => setTimeout(r, state.crawlDelayMs));
      return { ctx: h.makeCtx({ pages: [h.page(h.goodHome(HOME), HOME)] }), notes: [], truncated: false };
    },
  };
});

// The live crawler probe is network IO: never run it here (covered in probe.test.ts).
vi.mock("@/lib/audit/net/probe", () => ({
  PROBE_MAX_MS: 6_000,
  probeCrawlers: async () => ({ status: "skipped", reason: "not_run" }),
}));

vi.mock("@/lib/audit/net/soft404", () => ({
  SOFT404_TIMEOUT_MS: 4_000,
  probeSoft404: async () => ({ status: "skipped", reason: "not_run" }),
}));

const { runAudit } = await import("@/lib/audit/run");
const { analyze } = await import("@/lib/audit/analyze");
const { toPartialReport } = await import("@/lib/audit/report");
const { CAPS, MAX_QUESTIONS } = await import("@/lib/audit/ai/validate");

const ANALYSIS = {
  readback: "Acme Plumbing is a plumber in Leeds offering same-day visits and fixed prices for homeowners.",
  businessType: "local plumber",
  local: true,
  facts: [
    { key: "what", value: "Emergency plumbing", status: "clear" },
    { key: "who-for", value: null, status: "missing" },
    { key: "where", value: "Leeds", status: "clear" },
    { key: "pricing", value: "Fixed prices", status: "vague" },
    { key: "contact", value: null, status: "missing" },
    { key: "proof", value: "Gas Safe engineers", status: "vague" },
    { key: "differentiator", value: "Same-day visits", status: "clear" },
  ],
  questions: [
    { question: "Do you cover weekends?", answered: "partly", sourceUrl: HOME, note: "A heading asks it." },
    { question: "How much is a boiler service?", answered: "partly", sourceUrl: HOME, note: "No figure given." },
    { question: "How do I book?", answered: "no", sourceUrl: null, note: "No booking details." },
    { question: "What is your phone number?", answered: "no", sourceUrl: null, note: "No phone number found." },
  ],
};

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  state.crawlDelayMs = 0;
  fetchSpy = vi.fn(async (_u: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { model: string; messages: { content: string }[] };
    const isDrafts = body.messages[1].content.startsWith("Task: draft");
    const content = JSON.stringify(isDrafts ? { title: null, metaDescription: null, llmsTxt: null, organizationJsonLd: null, answerParagraph: null } : ANALYSIS);
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("runAudit AI phase", () => {
  it("no key: ai null, check unavailable, scores identical to deterministic-only, no model call", async () => {
    vi.stubEnv("NVIDIA_API_KEY", "");
    const r = await runAudit(HOME);
    expect(r.ai).toBeNull();
    expect(r.checks.find((c) => c.id === "geo.ai-clarity")?.status).toBe("unavailable");
    expect(fetchSpy).not.toHaveBeenCalled();
    const baseline = analyze(makeCtx({ pages: [page(goodHome(HOME), HOME)] }));
    expect(r.scores).toEqual(baseline.scores);
    expect(r.notes.some((n) => /AI/.test(n))).toBe(false);
  });

  it("with a key: insights attached, check scored, partial teaser present", async () => {
    vi.stubEnv("NVIDIA_API_KEY", "test-key-not-real");
    const r = await runAudit(HOME);
    expect(r.ai).not.toBeNull();
    expect(r.ai!.model).toBe("nvidia/nemotron-3.5-lightning-30b-a3b");
    const check = r.checks.find((c) => c.id === "geo.ai-clarity")!;
    expect(check.status).not.toBe("unavailable");
    expect(check.score).toBeCloseTo(r.ai!.clarityScore / 100, 2);
    expect(r.issues.some((i) => i.id === "geo.ai-clarity:who-for" && i.severity === "high")).toBe(true);
    expect(toPartialReport(r).ai?.lockedDrafts).toEqual([]);
  });

  it("model failure: audit still succeeds with ai null and a plain note", async () => {
    vi.stubEnv("NVIDIA_API_KEY", "test-key-not-real");
    fetchSpy.mockImplementation(async () => new Response("rate limited", { status: 429 }));
    const r = await runAudit(HOME);
    expect(r.ai).toBeNull();
    expect(r.checks.find((c) => c.id === "geo.ai-clarity")?.status).toBe("unavailable");
    expect(r.notes.join(" ")).toMatch(/AI reading .* couldn't be completed/);
  });

  it("skipped when less than 6 s of budget remains", async () => {
    vi.stubEnv("NVIDIA_API_KEY", "test-key-not-real");
    state.crawlDelayMs = 300;
    // budget clamps to ≥ 5 s, so 5 s − crawl < 6 s → skip
    const r = await runAudit(HOME, { budgetMs: 5_000 });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(r.ai).toBeNull();
    expect(r.notes.join(" ")).toMatch(/enough time/);
  });

  it("caller abort during the LLM phase returns promptly without throwing", async () => {
    vi.stubEnv("NVIDIA_API_KEY", "test-key-not-real");
    fetchSpy.mockImplementation(
      (_u: unknown, init?: RequestInit) =>
        new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("a", "AbortError")))),
    );
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 50);
    const t0 = Date.now();
    const r = await runAudit(HOME, { signal: ac.signal });
    expect(Date.now() - t0).toBeLessThan(5_000);
    expect(r.ai).toBeNull();
  });
});

describe("sealed payload size (unlock route caps sealed at 400k chars)", () => {
  it("worst-case AI section keeps a worst-case result well under the cap", async () => {
    vi.stubEnv("NVIDIA_API_KEY", "");
    const base = await runAudit(HOME);
    // Random text: incompressible, so this is a true worst case for the deflate step in seal().
    const rnd = (n: number) => randomBytes(n).toString("base64").replace(/[+/=]/g, " ").slice(0, n);
    const ai: AiInsights = {
      model: "x".repeat(128),
      readback: rnd(CAPS.readback),
      businessType: rnd(CAPS.businessType),
      facts: ["what", "who-for", "where", "pricing", "contact", "proof", "differentiator"].map((key) => ({
        key,
        label: "Why choose you",
        value: rnd(CAPS.factValue),
        status: "vague" as const,
      })),
      questions: Array.from({ length: MAX_QUESTIONS }, () => ({
        question: rnd(CAPS.question),
        answered: "partly" as const,
        sourceUrl: `${HOME}${rnd(2_000)}`,
        note: rnd(CAPS.note),
      })),
      drafts: {
        title: rnd(CAPS.title),
        metaDescription: rnd(CAPS.metaDescription),
        llmsTxt: rnd(CAPS.llmsTxt),
        organizationJsonLd: rnd(CAPS.organizationJsonLd),
        answerParagraph: rnd(CAPS.answerParagraph),
      },
      clarityScore: 10,
    };
    // Worst-case deterministic part: 21 pages with max-length URL/title/description.
    const pages = Array.from({ length: 21 }, (_, i) => ({
      ...base.pages[0],
      url: `${HOME}${i}/${rnd(2_040)}`,
      title: rnd(300),
      metaDescription: rnd(500),
    }));
    const worst: AuditResult = { ...base, pages, ai, notes: [...base.notes, ...Array.from({ length: 30 }, () => rnd(200))] };
    const aiJson = JSON.stringify(ai);
    expect(aiJson.length).toBeLessThan(60_000);
    // seal(): base64url(29-byte header + deflateRaw(JSON({exp,data}))). GCM adds no padding.
    const sealedChars = Math.ceil(((29 + deflateRawSync(Buffer.from(JSON.stringify({ exp: 0, data: worst }))).length) * 4) / 3);
    expect(sealedChars).toBeLessThan(400_000);
    // Even uncompressed, the AI section alone is < 20% of the cap.
    expect(Math.ceil((aiJson.length * 4) / 3)).toBeLessThan(80_000);
    if (process.env.SHOW_SEAL_SIZE) console.log({ aiJsonChars: aiJson.length, sealedChars });
  });
});
