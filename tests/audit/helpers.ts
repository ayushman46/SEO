import type { AuditContext, FetchedText, PsiOutcome } from "@/lib/audit/context";
import { parsePage } from "@/lib/audit/html";

export interface FixturePage {
  url: string;
  html: string;
  status?: number;
  headers?: Record<string, string>;
}

export function page(html: string, url = "https://acme.example.com/", extra: Partial<FixturePage> = {}): FixturePage {
  return { url, html, ...extra };
}

export const missingText = (url: string): FetchedText => ({ status: "missing", url, statusCode: 404, text: null });
export const okText = (url: string, text: string): FetchedText => ({ status: "ok", url, statusCode: 200, text });

export function makeCtx(opts: {
  pages: FixturePage[];
  robots?: string | null;
  sitemap?: string | null;
  llms?: string | null;
  httpToHttps?: AuditContext["httpToHttps"];
  psi?: PsiOutcome;
}): AuditContext {
  const home = new URL(opts.pages[0].url);
  const origin = home.origin;
  return {
    requestedUrl: opts.pages[0].url,
    finalUrl: opts.pages[0].url,
    hostname: home.hostname,
    origin,
    pages: opts.pages.map((p, i) =>
      parsePage({
        url: p.url,
        requestedUrl: p.url,
        statusCode: p.status ?? 200,
        headers: p.headers ?? { "content-type": "text/html" },
        html: p.html,
        isHome: i === 0,
      }),
    ),
    robots: opts.robots ? okText(`${origin}/robots.txt`, opts.robots) : missingText(`${origin}/robots.txt`),
    sitemap: opts.sitemap ? okText(`${origin}/sitemap.xml`, opts.sitemap) : missingText(`${origin}/sitemap.xml`),
    llms: opts.llms ? okText(`${origin}/llms.txt`, opts.llms) : missingText(`${origin}/llms.txt`),
    httpToHttps: opts.httpToHttps ?? { checked: true, redirectsToHttps: true },
    psi: opts.psi ?? { ok: false, vitals: null, error: "test" },
  };
}

/** Wrap body/head fragments into a document. */
export function doc(opts: { head?: string; body?: string; lang?: string | null } = {}): string {
  const lang = opts.lang === null ? "" : ` lang="${opts.lang ?? "en"}"`;
  return `<!doctype html><html${lang}><head>${opts.head ?? ""}</head><body>${opts.body ?? ""}</body></html>`;
}

const LOREM =
  "Acme Plumbing fixes leaking pipes, blocked drains and broken boilers across Leeds, with same-day visits and fixed prices quoted before any work begins.";

/** A page that should pass every SEO + GEO check. */
export function goodHome(url = "https://acme.example.com/"): string {
  return doc({
    head: `
      <title>Emergency Plumber in Leeds | Acme Plumbing Ltd</title>
      <meta name="description" content="Acme Plumbing fixes leaks, drains and boilers across Leeds. Same-day visits, fixed prices, 5-star rated local plumbers.">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="canonical" href="${url}">
      <meta property="og:title" content="Acme Plumbing">
      <meta property="og:description" content="Same-day plumbers in Leeds.">
      <meta property="og:image" content="https://acme.example.com/share.jpg">
      <meta property="og:site_name" content="Acme Plumbing">
      <meta name="author" content="Jane Acme">
      <meta property="article:modified_time" content="2026-01-10">
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[
        {"@type":"Plumber","name":"Acme Plumbing","url":"https://acme.example.com/","logo":"https://acme.example.com/logo.png","sameAs":["https://facebook.com/acme"]},
        {"@type":"FAQPage","mainEntity":[]}
      ]}</script>`,
    body: `
      <header><nav><a href="/services/">Services</a><a href="/about/">About</a><a href="/contact/">Contact</a></nav></header>
      <main>
        <h1>Emergency plumbers in Leeds</h1>
        <p>${LOREM}</p>
        <h2>Key takeaways</h2>
        <ul><li>Same-day visits</li><li>Fixed prices</li><li>Gas Safe engineers</li></ul>
        <h2>How much does a boiler service cost?</h2>
        <p>${LOREM}</p>
        <h2>Do you cover weekends?</h2>
        <p>${LOREM}</p>
        <h2>Are your plumbers insured?</h2>
        <p>${LOREM}</p>
        <img src="/van.jpg" alt="Acme Plumbing van">
        <img src="/divider.png" alt="">
      </main>
      <footer><p>Call <a href="tel:+441134960000">0113 496 0000</a> or email <a href="mailto:hello@acme.example.com">hello@acme.example.com</a>.</p></footer>`,
  });
}
