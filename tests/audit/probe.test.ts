/** T016 C: live AI-crawler probe with a mocked fetcher (no network). */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SafeFetchOptions, SafeFetchResult } from "@/lib/audit/net/fetch";
import { botInfoUrl, simulatedUserAgent, SIMULATED_BOT_TOKENS, userAgent } from "@/lib/audit/net/fetch";
import { probeCrawlers, probeTargets } from "@/lib/audit/net/probe";
import { classifyLayer, crawlerProbeOutcome, PROBE_BOTS, PROBE_HONESTY } from "@/lib/audit/checks/geo/crawler-probe";
import { ISSUE_CATALOG } from "@/lib/audit/issues";
import { AuditError } from "@/lib/audit/types";
import { doc, makeCtx, page } from "./helpers";

const HOME = "https://acme.example.com/";
const BIG = `<p>${"Real content for people and crawlers. ".repeat(200)}</p>`;

function ctx(opts: { robots?: string; homeStatus?: number } = {}) {
  return makeCtx({
    pages: [
      page(doc({ body: BIG }), HOME, { status: opts.homeStatus }),
      page(doc({ body: "<p>About</p>" }), `${HOME}about`),
      page(doc({ body: "<p>Pricing</p>" }), `${HOME}pricing`),
      page(doc({ body: "<p>Blog</p>" }), `${HOME}blog`),
    ],
    robots: opts.robots ?? "User-agent: *\nAllow: /",
  });
}

function res(url: string, status: number, headers: Record<string, string> = {}, text = ""): SafeFetchResult {
  return { requestedUrl: url, finalUrl: url, status, headers, bytes: Buffer.from(text), text, truncated: false, redirects: [], location: null };
}

type Handler = (url: string, o: SafeFetchOptions) => SafeFetchResult | Promise<SafeFetchResult>;
function fetcher(h: Handler) {
  const calls: { url: string; method: string; simulate?: string; host: string; acceptHtml?: boolean }[] = [];
  const f = vi.fn(async (url: string, o: SafeFetchOptions) => {
    calls.push({ url, method: o.method ?? "GET", simulate: o.simulate, host: new URL(url).host, acceptHtml: o.acceptHtml });
    return h(url, o);
  });
  return { f, calls };
}

const okAll: Handler = (url, o) => res(url, 200, { server: "nginx" }, o.method === "GET" ? BIG.repeat(2) : "");
const deadline = () => Date.now() + 5_000;

describe("labelled simulated user agent", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("info URL falls back to seenhq.vercel.app and NEXT_PUBLIC_SITE_URL overrides it", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(botInfoUrl()).toBe("https://seenhq.vercel.app/bot");
    expect(userAgent()).toBe("Mozilla/5.0 (compatible; seenhqbot/1.0; +https://seenhq.vercel.app/bot)");
    expect(simulatedUserAgent("GPTBot/1.3")).toBe("Mozilla/5.0 (compatible; GPTBot/1.3; simulated-by seenhqbot/1.0; +https://seenhq.vercel.app/bot)");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.org/");
    expect(userAgent()).toContain("+https://example.org/bot)");
    expect(simulatedUserAgent("bingbot/2.0")).toContain("+https://example.org/bot)");
  });

  it("carries the bot token AND our marker; never a bare vendor UA", () => {
    for (const t of SIMULATED_BOT_TOKENS) {
      const ua = simulatedUserAgent(t);
      expect(ua).toContain(t);
      expect(ua).toMatch(/simulated-by seenhqbot\/1\.0; \+https?:\/\/\S+\/bot\)$/);
    }
    // unknown token → plain seenhqbot UA
    expect(simulatedUserAgent("EvilBot/9" as never)).toMatch(/^Mozilla\/5\.0 \(compatible; seenhqbot\/1\.0;/);
  });
});

describe("probe targets", () => {
  it("homepage + 2 pages + robots.txt (+ llms.txt when present), same host, respecting our robots rules", () => {
    const t = probeTargets(ctx({ robots: "User-agent: seenhqbot\nDisallow: /about\n" }));
    expect(t.map((x) => x.url)).toEqual([HOME, `${HOME}pricing`, `${HOME}blog`, `${HOME}robots.txt`]);
    expect(t[0].baselineSize).toBeGreaterThan(5_000);
  });
});

describe("probeCrawlers + geo.ai-crawler-probe", () => {
  it("all bots get the crawler's response → pass, with the honesty caveat", async () => {
    const { f, calls } = fetcher(okAll);
    const p = await probeCrawlers(ctx(), { deadline: deadline(), fetcher: f });
    expect(p.status).toBe("ok");
    expect(new Set(calls.map((c) => c.host))).toEqual(new Set(["acme.example.com"]));
    expect(new Set(calls.map((c) => c.simulate))).toEqual(new Set(PROBE_BOTS.map((b) => b.token)));
    // HEAD first everywhere; GET only for the homepage when HEAD looks normal
    expect(calls.filter((c) => c.method === "GET").every((c) => c.url === HOME)).toBe(true);
    // pages are requested with the crawler's HTML Accept header (vercel.com serves Markdown to text/plain)
    expect(calls.filter((c) => !c.url.endsWith(".txt")).every((c) => c.acceptHtml === true)).toBe(true);
    expect(calls.filter((c) => c.url.endsWith("/robots.txt")).every((c) => !c.acceptHtml)).toBe(true);
    const o = crawlerProbeOutcome(p);
    expect(o.status).toBe("pass");
    expect(o.summary).toContain(PROBE_HONESTY);
  });

  it("Cloudflare challenge for search bots → high issue naming Cloudflare", async () => {
    const blocked = new Set(["OAI-SearchBot/1.3", "PerplexityBot/1.0"]);
    const { f } = fetcher((url, o) =>
      blocked.has(o.simulate!)
        ? res(url, 403, { server: "cloudflare", "cf-ray": "abc-BLR" }, o.method === "GET" ? '<html><title>Just a moment...</title><script src="/cdn-cgi/challenge-platform/x"></script>' : "")
        : okAll(url, o),
    );
    const p = await probeCrawlers(ctx(), { deadline: deadline(), fetcher: f });
    const o = crawlerProbeOutcome(p);
    expect(o.status).not.toBe("pass");
    const issue = o.issues.find((i) => i.key === "geo.ai-crawler-probe:blocked-cloudflare")!;
    expect(issue.severity).toBe("high");
    expect(issue.detail).toMatch(/OAI-SearchBot, PerplexityBot/);
    expect(o.summary).toContain("Cloudflare");
    expect(o.summary).toContain(PROBE_HONESTY);
  });

  it("training-only block on some pages → medium; unknown layer → host", async () => {
    const { f } = fetcher((url, o) => (o.simulate === "GPTBot/1.3" && url.endsWith("/pricing") ? res(url, 403, {}, "Forbidden") : okAll(url, o)));
    const o = crawlerProbeOutcome(await probeCrawlers(ctx(), { deadline: deadline(), fetcher: f }));
    const issue = o.issues.find((i) => i.key === "geo.ai-crawler-probe:blocked-host")!;
    expect(issue.severity).toBe("medium");
    expect(issue.affectedUrls).toEqual([`${HOME}pricing`]);
  });

  it("bots disallowed by robots.txt are not probed (that's geo.ai-crawlers' finding)", async () => {
    const { f, calls } = fetcher(okAll);
    const p = await probeCrawlers(ctx({ robots: "User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /" }), { deadline: deadline(), fetcher: f });
    expect(calls.some((c) => c.simulate === "GPTBot/1.3" && !c.url.endsWith("/robots.txt"))).toBe(false);
    if (p.status === "ok") expect(p.skippedByRobots.filter((s) => s.bot === "GPTBot").length).toBe(3);
  });

  it("seenhqbot baseline refused → inconclusive, unavailable, no requests", async () => {
    const { f, calls } = fetcher(okAll);
    const p = await probeCrawlers(ctx({ homeStatus: 403 }), { deadline: deadline(), fetcher: f });
    expect(p).toEqual({ status: "inconclusive", baselineStatus: 403 });
    expect(calls).toHaveLength(0);
    const o = crawlerProbeOutcome(p);
    expect(o.status).toBe("unavailable");
    expect(o.summary).toMatch(/seenhqbot.*inconclusive/);
  });

  it("HEAD unsupported (405) → falls back to GET", async () => {
    const { f, calls } = fetcher((url, o) => (o.method === "HEAD" ? res(url, 405) : okAll(url, o)));
    const p = await probeCrawlers(ctx(), { deadline: deadline(), fetcher: f });
    expect(calls.filter((c) => c.method === "GET").length).toBeGreaterThan(PROBE_BOTS.length);
    expect(crawlerProbeOutcome(p).status).toBe("pass");
  });

  it("much smaller page for a bot → different-content (low)", async () => {
    const { f } = fetcher((url, o) => (o.simulate === "ClaudeBot/1.0" && o.method === "GET" ? res(url, 200, {}, "<html>hi</html>") : okAll(url, o)));
    const o = crawlerProbeOutcome(await probeCrawlers(ctx(), { deadline: deadline(), fetcher: f }));
    expect(o.issues.map((i) => i.key)).toEqual(["geo.ai-crawler-probe:different-content"]);
  });

  it("respects the deadline: hanging fetches → untested → unavailable, fast", async () => {
    const hang = vi.fn(
      (_u: string, o: SafeFetchOptions) =>
        new Promise<SafeFetchResult>((_, reject) => o.signal?.addEventListener("abort", () => reject(new AuditError("timeout", "slow")))),
    );
    const t0 = Date.now();
    const p = await probeCrawlers(ctx(), { deadline: Date.now() + 400, fetcher: hang });
    expect(Date.now() - t0).toBeLessThan(5_000);
    expect(crawlerProbeOutcome(p).status).toBe("unavailable");
  });

  it("caller abort → skipped, never throws", async () => {
    const ac = new AbortController();
    ac.abort();
    expect(await probeCrawlers(ctx(), { deadline: deadline(), signal: ac.signal, fetcher: fetcher(okAll).f })).toEqual({ status: "skipped", reason: "aborted" });
    const boom = vi.fn(async () => {
      throw new TypeError("boom");
    });
    expect((await probeCrawlers(ctx(), { deadline: deadline(), fetcher: boom })).status).toBe("ok");
  });

  it("not run → unavailable (excluded from scores)", () => {
    expect(crawlerProbeOutcome({ status: "skipped", reason: "not_run" }).status).toBe("unavailable");
  });
});

describe("layer classification (signatures checked with curl on 2026-11-23 where possible)", () => {
  const r = (headers: Record<string, string>, body = "") => ({ method: "GET" as const, status: 403, headers, body, size: body.length });
  it("names the layer", () => {
    expect(classifyLayer(r({ server: "cloudflare", "cf-ray": "x" })).layer).toBe("cloudflare");
    expect(classifyLayer(r({}, '<script src="/cdn-cgi/challenge-platform/h/b"></script>')).layer).toBe("cloudflare");
    expect(classifyLayer(r({ "akamai-grn": "0.6d.1795" }, "<TITLE>Access Denied</TITLE>")).layer).toBe("akamai");
    expect(classifyLayer(r({}, "Reference&#32;&#35;18&#46;6d https&#58;&#47;&#47;errors&#46;edgesuite&#46;net")).layer).toBe("akamai"); // the real, entity-encoded Akamai block page
    expect(classifyLayer(r({}, "see https://errors.edgesuite.net/18.6d")).layer).toBe("akamai");
    expect(classifyLayer(r({ server: "Vercel", "x-vercel-mitigated": "challenge" })).layer).toBe("vercel");
    expect(classifyLayer(r({ server: "Sucuri/Cloudproxy", "x-sucuri-block": "BOT01" })).layer).toBe("sucuri");
    expect(classifyLayer(r({ server: "Apache" }, "Your access to this site has been limited by the site owner. Generated by Wordfence")).layer).toBe("wordfence");
    expect(classifyLayer(r({ "x-iinfo": "1-2" })).layer).toBe("imperva");
    expect(classifyLayer(r({ "x-amz-cf-id": "abc", via: "1.1 x.cloudfront.net (CloudFront)" })).layer).toBe("aws");
    expect(classifyLayer(r({ server: "Apache" })).layer).toBe("host");
  });

  it("every probe issue states the simulation caveat", () => {
    const probeIssues = Object.entries(ISSUE_CATALOG).filter(([k]) => k.startsWith("geo.ai-crawler-probe:"));
    expect(probeIssues.length).toBeGreaterThanOrEqual(9);
    for (const [, c] of probeIssues) expect(c.description).toContain(PROBE_HONESTY);
  });
});
