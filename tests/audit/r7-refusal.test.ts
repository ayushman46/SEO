/**
 * R7 #3: a homepage that refuses / challenges our crawler must not be scored. R7 #14: a quote
 * attributed in its <figure>'s <figcaption> is not anonymous.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SafeFetchResult } from "@/lib/audit/net/fetch";
import { AuditError } from "@/lib/audit/types";
import { detectHomepageRefusal, isChallengePage, refusalMessage, SiteRefusedError } from "@/lib/audit/refusal";
import { reviewSignalsCheck } from "@/lib/audit/checks/geo/review-signals";
import { scanPage } from "@/lib/audit/checks/geo/page-scan";
import { doc, makeCtx, page } from "./helpers";

/* ── fixtures ── */

const CF_CHALLENGE = `<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="refresh" content="390"></head><body><div class="main-wrapper"><noscript>Enable JavaScript and cookies to continue</noscript></div><script>(function(){window._cf_chl_opt={cvId: '3',cZone: "www.example.com",cType: 'managed'};var a = document.createElement('script');a.src = '/cdn-cgi/challenge-platform/h/g/orchestrate/chl_page/v1?ray=8a1b';document.getElementsByTagName('head')[0].appendChild(a);}());</script></body></html>`;
const CF_BLOCK = `<!DOCTYPE html><html><head><title>Attention Required! | Cloudflare</title></head><body><h1>Sorry, you have been blocked</h1><p>You are unable to access example.com</p><p>Cloudflare Ray ID: 8a1b2c3d4e5f</p></body></html>`;
const PLAIN_403 = `<html><head><title>403 Forbidden</title></head><body><h1>Forbidden</h1><p>You don't have permission to access this resource.</p></body></html>`;
const AKAMAI_403 = `<HTML><HEAD><TITLE>Access Denied</TITLE></HEAD><BODY><H1>Access Denied</H1>You don't have permission to access "http&#58;&#47;&#47;www&#46;example&#46;com&#47;" on this server.<P>Reference&#32;&#35;18&#46;1a2b3c</BODY></HTML>`;

const realPage = (body: string, title = "Acme Security | Locksmiths in Leeds") =>
  `<!doctype html><html lang="en"><head><title>${title}</title><meta name="description" content="Locksmiths in Leeds."><meta name="viewport" content="width=device-width"></head><body><nav><a href="/about">About</a></nav><main><h1>Acme Security</h1>${body}</main></body></html>`;

const res = (status: number, text: string, headers: Record<string, string> = {}) => ({
  status,
  headers: { "content-type": "text/html; charset=UTF-8", ...headers },
  text,
});

/* ── pure classifier ── */

describe("detectHomepageRefusal", () => {
  it("403 block page from the host is refused, no layer named", () => {
    const r = detectHomepageRefusal(res(403, PLAIN_403, { server: "Apache" }));
    expect(r).toMatchObject({ kind: "refused", status: 403, layer: null });
    expect(refusalMessage(r!)).toBe(
      "This site refused our crawler (HTTP 403). We can't audit it from outside. If it is your site, allow the user agent seenhqbot or try again later.",
    );
  });

  it("403 Cloudflare block names Cloudflare", () => {
    const r = detectHomepageRefusal(res(403, CF_BLOCK, { server: "cloudflare", "cf-ray": "8a1b2c3d4e5f-LHR" }));
    expect(r).toMatchObject({ kind: "challenge", status: 403, layer: "cloudflare", layerName: "Cloudflare" });
    expect(refusalMessage(r!)).toContain("(HTTP 403, looks like Cloudflare)");
    expect(refusalMessage(r!)).toContain("allow the user agent seenhqbot");
  });

  it("Akamai 403 names Akamai", () => {
    const r = detectHomepageRefusal(res(403, AKAMAI_403, { server: "AkamaiGHost" }));
    expect(r).toMatchObject({ status: 403, layer: "akamai" });
    expect(refusalMessage(r!)).toContain("looks like Akamai");
  });

  it("Cloudflare challenge is caught at 200, 403 and 503", () => {
    for (const status of [200, 403, 503]) {
      const r = detectHomepageRefusal(res(status, CF_CHALLENGE, { server: "cloudflare", "cf-ray": "8a1b-LHR" }));
      expect(r, `status ${status}`).toMatchObject({ kind: "challenge", status, layer: "cloudflare" });
      expect(refusalMessage(r!)).toContain(`bot check (HTTP ${status}, looks like Cloudflare)`);
    }
    // header-only signal, no body markers
    expect(detectHomepageRefusal(res(200, "<html><body></body></html>", { "cf-mitigated": "challenge", server: "cloudflare" }))).toMatchObject({
      kind: "challenge",
      layer: "cloudflare",
    });
    expect(detectHomepageRefusal(res(429, "", { "x-vercel-mitigated": "challenge" }))).toMatchObject({ kind: "challenge", layer: "vercel" });
  });

  it("429 is rate limiting", () => {
    const r = detectHomepageRefusal(res(429, "Too many requests", { "content-type": "text/plain" }));
    expect(r).toMatchObject({ kind: "rate_limited", status: 429 });
    expect(refusalMessage(r!)).toMatch(/^This site is limiting how often our crawler can visit \(HTTP 429\)/);
  });

  it("401, 407 and 451 are refusals", () => {
    for (const status of [401, 407, 451]) expect(detectHomepageRefusal(res(status, PLAIN_403))?.kind).toBe("refused");
  });

  it("5xx is a server error and does not blame the CDN", () => {
    for (const status of [500, 502, 504]) {
      const r = detectHomepageRefusal(res(status, "<html><body><h1>Internal Server Error</h1></body></html>", { server: "cloudflare", "cf-ray": "x" }));
      expect(r, `status ${status}`).toMatchObject({ kind: "server_error", status, layer: null });
      expect(refusalMessage(r!)).toContain(`server error (HTTP ${status})`);
      expect(refusalMessage(r!)).not.toContain("Cloudflare");
    }
  });

  it("a real 200 page that mentions 'access denied' or a captcha in its copy is audited", () => {
    const body =
      "<p>Locked out? Access denied by a broken lock? We open doors in 30 minutes. Are you a robot? No, we're real people. Verify you are human-friendly service.</p>" +
      '<form><div class="g-recaptcha" data-sitekey="x"></div></form><script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script>';
    expect(detectHomepageRefusal(res(200, realPage(body), { server: "cloudflare", "cf-ray": "8a1b-LHR" }))).toBeNull();
    expect(detectHomepageRefusal(res(200, realPage("<p>Access denied: the security check you need.</p>", "Access denied? Call Acme")))).toBeNull();
  });

  it("a tiny or odd 200 homepage is audited", () => {
    expect(detectHomepageRefusal(res(200, "<html><body>Hi</body></html>"))).toBeNull();
    expect(detectHomepageRefusal(res(200, ""))).toBeNull();
    expect(detectHomepageRefusal(res(200, '<div id="root"></div><script src="/app.js"></script>'))).toBeNull();
  });

  it("404 / 410 homepages keep the existing note path", () => {
    expect(detectHomepageRefusal(res(404, "<html><body>Not found</body></html>"))).toBeNull();
    expect(detectHomepageRefusal(res(410, "<html><body>Gone</body></html>"))).toBeNull();
  });

  it("a large page with a challenge-looking title is not a challenge (size gate)", () => {
    const big = realPage(`<p>${"word ".repeat(30_000)}</p>`, "Security Check");
    expect(isChallengePage(res(200, big))).toBe(false);
    expect(isChallengePage(res(200, realPage("<p>x</p>", "Security Check")))).toBe(true);
  });

  it("SiteRefusedError is an AuditError('unreachable') marked user-facing", () => {
    const e = new SiteRefusedError(detectHomepageRefusal(res(403, PLAIN_403))!);
    expect(e).toBeInstanceOf(AuditError);
    expect(e.name).toBe("AuditError");
    expect(e.code).toBe("unreachable");
    expect(e.userFacing).toBe(true);
  });
});

/* ── crawl(): the homepage is never scored when refused ── */

interface Route {
  status?: number;
  body: string;
  contentType?: string;
  headers?: Record<string, string>;
}
const site = vi.hoisted(() => ({ routes: new Map<string, Route>(), fetched: [] as string[] }));

vi.mock("@/lib/audit/net/ssrf", () => ({
  resolvePublicAddress: async () => ({ address: "93.184.215.14", family: 4 }),
}));
vi.mock("@/lib/audit/net/psi", () => ({
  fetchPsi: async () => ({ ok: false, vitals: null, error: "PageSpeed Insights was skipped in tests" }),
}));
vi.mock("@/lib/audit/net/fetch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/audit/net/fetch")>();
  const { AuditError: AE } = await import("@/lib/audit/types");
  return {
    ...actual,
    safeFetch: async (url: string, opts: { kind: "html" | "text"; allowErrorBodies?: boolean }): Promise<SafeFetchResult> => {
      site.fetched.push(url);
      const r = site.routes.get(url);
      const status = r ? (r.status ?? 200) : 404;
      const body = r ? r.body : "<html><body>Not found</body></html>";
      const contentType = r?.contentType ?? "text/html";
      const lenient = opts.allowErrorBodies && status >= 400;
      if (opts.kind === "html" && !lenient && !/html/.test(contentType)) throw new AE("not_html", `${url} isn't HTML`);
      return {
        requestedUrl: url,
        finalUrl: url,
        status,
        headers: { "content-type": contentType, ...(r?.headers ?? {}) },
        bytes: Buffer.from(body),
        text: body,
        truncated: false,
        redirects: [],
        location: null,
      };
    },
  };
});

const { crawl } = await import("@/lib/audit/crawl");

const O = "https://acme.example.com";
const route = (path: string, r: Route) => site.routes.set(`${O}${path}`, r);
const crawlHome = () => crawl(`${O}/`, { maxPages: 5, budgetMs: 20_000 });
async function failure(p: Promise<unknown>): Promise<AuditError> {
  try {
    await p;
  } catch (e) {
    return e as AuditError;
  }
  throw new Error("expected the crawl to fail");
}

describe("crawl: refused homepage (R7 #3)", () => {
  beforeEach(() => {
    site.routes.clear();
    site.fetched = [];
    route("/about", { body: realPage("<p>About us, family run since 1990.</p>", "About Acme") });
  });

  it("403 block page: fails with unreachable + the visitor message, fetches nothing else", async () => {
    route("/", { status: 403, body: CF_BLOCK, headers: { server: "cloudflare", "cf-ray": "8a1b-LHR" } });
    const e = await failure(crawlHome());
    expect(e).toBeInstanceOf(AuditError);
    expect(e.code).toBe("unreachable");
    expect(e.message).toContain("(HTTP 403, looks like Cloudflare)");
    expect((e as { userFacing?: boolean }).userFacing).toBe(true);
    expect(site.fetched).toEqual([`${O}/`]);
  });

  it("Cloudflare challenge served as 200 is not scored", async () => {
    route("/", { status: 200, body: CF_CHALLENGE, headers: { server: "cloudflare" } });
    const e = await failure(crawlHome());
    expect(e.code).toBe("unreachable");
    expect(e.message).toContain("bot check (HTTP 200, looks like Cloudflare)");
  });

  it("Cloudflare challenge served as 503 is a challenge, not a server error", async () => {
    route("/", { status: 503, body: CF_CHALLENGE, headers: { server: "cloudflare", "cf-mitigated": "challenge" } });
    expect((await failure(crawlHome())).message).toContain("bot check (HTTP 503, looks like Cloudflare)");
  });

  it("429 with a JSON body is reported as rate limiting, not not_html", async () => {
    route("/", { status: 429, body: '{"error":"too many requests"}', contentType: "application/json" });
    const e = await failure(crawlHome());
    expect(e.code).toBe("unreachable");
    expect(e.message).toContain("HTTP 429");
  });

  it("5xx is reported as a server error", async () => {
    route("/", { status: 502, body: "<html><body>Bad gateway</body></html>" });
    const e = await failure(crawlHome());
    expect(e.code).toBe("unreachable");
    expect(e.message).toContain("server error (HTTP 502)");
  });

  it("a real 200 homepage mentioning 'access denied' is crawled and scored as normal", async () => {
    route("/", { body: realPage("<p>Access denied by your own front door? We open locks fast. Verify you are human: call us.</p>") });
    const out = await crawlHome();
    expect(out.ctx.pages[0].statusCode).toBe(200);
    expect(out.ctx.pages.map((p) => p.url)).toContain(`${O}/about`);
  });

  it("a 404 HTML homepage is still audited with a note; a non-HTML 404 is still not_html", async () => {
    route("/", { status: 404, body: realPage("<p>Page not found</p>") });
    const out = await crawlHome();
    expect(out.notes.some((n) => n.includes("status 404"))).toBe(true);
    route("/", { status: 404, body: "nope", contentType: "text/plain" });
    expect((await failure(crawlHome())).code).toBe("not_html");
  });

  it("a refused internal page does not fail the audit (behaviour unchanged)", async () => {
    route("/", { body: realPage("<p>Welcome to Acme.</p>") });
    route("/about", { status: 403, body: CF_BLOCK, headers: { server: "cloudflare" } });
    const out = await crawlHome();
    expect(out.ctx.pages[0].statusCode).toBe(200);
    // unchanged: internal error pages are kept with their status for the indexability check
    expect(out.ctx.pages.find((p) => p.url === `${O}/about`)?.statusCode).toBe(403);
  });
});

/* ── R7 #14: figure/figcaption attribution ── */

describe("review signals: <figure> attribution (R7 #14)", () => {
  const scanOf = (body: string) => scanPage(makeCtx({ pages: [page(doc({ body }))] }).pages[0]);

  it("a quote attributed by its figure's figcaption is attributed", () => {
    const s = scanOf("<figure><blockquote>They fixed our boiler on the same day, brilliant service.</blockquote><figcaption>Jane Doe, Leeds</figcaption></figure>");
    expect(s.testimonials).toEqual([expect.objectContaining({ attributed: true })]);
    const before = scanOf("<figure><figcaption>Jane Doe, Leeds</figcaption><blockquote>They fixed our boiler on the same day, brilliant service.</blockquote></figure>");
    expect(before.testimonials[0].attributed).toBe(true);
  });

  it("a bare blockquote with no source is still anonymous", () => {
    expect(scanOf("<blockquote>They fixed our boiler on the same day, brilliant service.</blockquote>").testimonials[0].attributed).toBe(false);
  });

  it("no anonymous-testimonials issue for figure-captioned quotes", () => {
    const ctx = makeCtx({
      pages: [page(doc({ body: "<figure><figcaption>What it understood from your pages</figcaption><blockquote>Marigold Dental is an independent family and cosmetic dental practice in Headingley, Leeds.</blockquote></figure>" }))],
    });
    expect(reviewSignalsCheck(ctx).issues.map((i) => i.key)).not.toContain("geo.review-signals:anonymous-testimonials");
  });
});
