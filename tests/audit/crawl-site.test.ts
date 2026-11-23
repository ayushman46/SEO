/**
 * crawl() end-to-end against an in-memory site: safeFetch, DNS and PSI are mocked, everything
 * else (robots, sitemap, soft-404 detection, page selection, parsing, checks) is real.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SafeFetchResult } from "@/lib/audit/net/fetch";
import { AuditError } from "@/lib/audit/types";

interface Route {
  status?: number;
  body: string;
  contentType?: string;
  /** final URL after a (simulated) redirect */
  finalUrl?: string;
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
    safeFetch: async (url: string, opts: { kind: "html" | "text" }): Promise<SafeFetchResult> => {
      site.fetched.push(url);
      const r = site.routes.get(url);
      const status = r ? (r.status ?? 200) : 404;
      const body = r ? r.body : "<html><body>Not found</body></html>";
      const contentType = r?.contentType ?? (r ? "text/html" : "text/html");
      if (opts.kind === "html" && !/html/.test(contentType)) throw new AE("not_html", `${url} isn't HTML`);
      return {
        requestedUrl: url,
        finalUrl: r?.finalUrl ?? url,
        status,
        headers: { "content-type": contentType, ...(r?.headers ?? {}) },
        bytes: Buffer.from(body),
        text: body,
        truncated: false,
        redirects: r?.finalUrl ? [r.finalUrl] : [],
        location: null,
      };
    },
  };
});

const { crawl } = await import("@/lib/audit/crawl");
const { analyze } = await import("@/lib/audit/analyze");

const O = "https://acme.example.com";
const nav = '<nav><a href="/about">About</a><a href="/services">Services</a><a href="/contact">Contact</a></nav>';
const pageHtml = (title: string, body: string, head = "") =>
  `<!doctype html><html lang="en"><head><title>${title}</title>${head}</head><body>${nav}<main>${body}</main></body></html>`;

function route(path: string, r: Route) {
  site.routes.set(path.startsWith("http") ? path : `${O}${path}`, r);
}

async function run() {
  const out = await crawl(`${O}/`, { maxPages: 5, budgetMs: 20_000 });
  return { ...out, analysis: analyze(out.ctx) };
}

beforeEach(() => {
  site.routes.clear();
  site.fetched = [];
  route("/", { body: pageHtml("Acme Plumbing | Home", "<h1>Home</h1><p>Welcome to Acme.</p>") });
  route("/about", { body: pageHtml("About Acme", "<h1>About</h1><p>Family run since 1990.</p>") });
  route("/services", { body: pageHtml("Services", "<h1>Services</h1><p>Boilers, drains, leaks.</p>") });
  route("/contact", { body: pageHtml("Contact", "<h1>Contact</h1><p>Call us.</p>") });
});

describe("crawl: robots.txt redirected to another host (R2 #8, #25)", () => {
  it("applies the redirected rules to the audited site", async () => {
    route("/robots.txt", {
      body: "User-agent: *\nDisallow: /\n",
      contentType: "text/plain",
      finalUrl: "https://cdn.other-host.example.net/robots.txt",
    });
    const { ctx, notes, analysis } = await run();
    expect(ctx.robots.status).toBe("ok");
    expect(ctx.robots.url).toBe("https://cdn.other-host.example.net/robots.txt");
    expect(ctx.robots.requestedUrl).toBe(`${O}/robots.txt`);
    // The crawler honoured Disallow: / for noticrbot.
    expect(ctx.pages).toHaveLength(1);
    expect(notes.some((n) => n.includes("robots.txt disallows crawling /about"))).toBe(true);
    const ids = analysis.issues.map((i) => i.id);
    expect(ids).toContain("geo.ai-crawlers:search-blocked");
    expect(ids).toContain("seo.robots-txt:blocks-all");
  });
});

describe("crawl: HTML soft 404 at /llms.txt (R2 #24)", () => {
  it("a 200 HTML page starting with a comment is 'missing', not an invalid llms.txt", async () => {
    route("/llms.txt", { body: "<!-- 404 -->\n<!DOCTYPE html><html><body>Not found</body></html>", contentType: "text/html" });
    const { ctx, analysis } = await run();
    expect(ctx.llms.status).toBe("missing");
    const ids = analysis.issues.map((i) => i.id);
    expect(ids).toContain("geo.llms-txt:missing");
    expect(ids).not.toContain("geo.llms-txt:invalid-format");
  });

  it("a real llms.txt served with a text/html content-type still counts", async () => {
    route("/llms.txt", { body: "# Acme Plumbing\n\n> Plumbers in Leeds.\n\n- [About](https://acme.example.com/about)\n", contentType: "text/html" });
    const { ctx } = await run();
    expect(ctx.llms.status).toBe("ok");
  });
});

describe("crawl: canonicals pointing at the homepage (R2 #6)", () => {
  it("keeps distinct inner pages with a site-wide home canonical and reports them", async () => {
    const homeCanon = `<link rel="canonical" href="${O}/">`;
    route("/", { body: pageHtml("Acme Plumbing | Home", "<h1>Home</h1><p>Welcome to Acme.</p>", homeCanon) });
    route("/about", { body: pageHtml("About Acme", "<h1>About</h1><p>Family run since 1990.</p>", homeCanon) });
    route("/services", { body: pageHtml("Services", "<h1>Services</h1><p>Boilers.</p>", homeCanon) });
    route("/contact", { body: pageHtml("Contact", "<h1>Contact</h1><p>Call us.</p>", homeCanon) });
    const { ctx, analysis } = await run();
    expect(ctx.pages.map((p) => new URL(p.url).pathname).sort()).toEqual(["/", "/about", "/contact", "/services"]);
    const issue = analysis.issues.find((i) => i.id === "seo.canonical:points-to-home");
    expect(issue?.severity).toBe("high");
    expect(issue?.affectedUrls.sort()).toEqual([`${O}/about`, `${O}/contact`, `${O}/services`]);
    expect(analysis.checks.find((c) => c.id === "seo.canonical")?.status).not.toBe("pass");
  });

  it("still skips a true copy of the homepage (e.g. /home) with a note", async () => {
    const home = pageHtml(
      "Acme Plumbing | Home",
      '<h1>Home</h1><p>Welcome to Acme.</p><a href="/home">Home</a>',
      `<link rel="canonical" href="${O}/">`,
    );
    route("/", { body: home });
    route("/home", { body: home });
    const { ctx, notes } = await run();
    expect(site.fetched).toContain(`${O}/home`);
    expect(ctx.pages.some((p) => p.url === `${O}/home`)).toBe(false);
    expect(notes).toContain("/home is a copy of your homepage, so we skipped it.");
  });
});

describe("crawl: hostile page structure (element/depth guard)", () => {
  it("skips a too-complex internal page with a note", async () => {
    route("/services", { body: `<html><body>${"<div>".repeat(5_000)}</body></html>` });
    const { ctx, notes } = await run();
    expect(ctx.pages.some((p) => p.url.endsWith("/services"))).toBe(false);
    expect(notes.some((n) => n.startsWith("/services is too complex to analyse"))).toBe(true);
  });

  it("rejects a too-complex homepage with AuditError(too_large)", async () => {
    route("/", { body: `<html><body>${"<p>".repeat(80_000)}</body></html>` });
    const err = await crawl(`${O}/`, { maxPages: 5, budgetMs: 20_000 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AuditError);
    expect((err as AuditError).code).toBe("too_large");
  });
});
