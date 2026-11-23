import "server-only";
import { gunzipSync } from "node:zlib";
import { AuditError } from "./types";
import type { AuditContext, FetchedText, PsiOutcome } from "./context";
import { parsePage, resolveHref, visibleText, type PageData } from "./html";
import { isHtmlContentType, looksLikeHtml, safeFetch, REQUEST_TIMEOUT_MS, type SafeFetchResult } from "./net/fetch";
import { detectHomepageRefusal, SiteRefusedError } from "./refusal";
import { resolvePublicAddress } from "./net/ssrf";
import { isSameSite, normalizeAuditUrl, pageKey } from "./url";
import { isBlocked, looksLikeRobotsTxt, OUR_BOT, parseRobots } from "./robots";
import { parseSitemap, type ParsedSitemap } from "./checks/seo/sitemap";
import { fetchPsi } from "./net/psi";

export interface CrawlOptions {
  maxPages: number;
  budgetMs: number;
  signal?: AbortSignal;
}

export interface CrawlOutput {
  ctx: AuditContext;
  notes: string[];
  truncated: boolean;
}

const PAGE_CONCURRENCY = 3;
/** Time kept back at the end of the budget for analysis + response. */
const RESERVE_MS = 1_000;
/** Don't start a new page fetch with less than this left. */
const MIN_PAGE_START_MS = 2_000;

const ASSET_EXT =
  /\.(pdf|jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|mp4|webm|mov|avi|mp3|wav|ogg|zip|rar|7z|gz|tar|dmg|exe|msi|apk|css|js|mjs|json|xml|txt|rss|atom|csv|xlsx?|docx?|pptx?|woff2?|ttf|eot|otf)$/i;
const SKIP_PATH =
  /\/(wp-admin|wp-login|wp-json|xmlrpc|cdn-cgi|feed|login|logout|signin|sign-in|signup|sign-up|register|cart|checkout|basket|account|my-account)(\/|$|\.)/i;

function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}

function depth(url: string): number {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).length;
  } catch {
    return 99;
  }
}

/**
 * Pick up to `max` internal pages: same site, http(s), not assets/utility pages, deduped,
 * nav links first, then shallow paths, then document order. Sitemap URLs fill any gap.
 */
export function selectInternalLinks(input: {
  homeUrl: string;
  links: { href: string; inNav: boolean }[];
  sitemapUrls: string[];
  max: number;
}): string[] {
  const home = new URL(input.homeUrl);
  const seen = new Set<string>([pageKey(input.homeUrl)]);
  const pool: { url: string; inNav: boolean; order: number; fromSitemap: boolean }[] = [];

  const consider = (href: string, inNav: boolean, order: number, fromSitemap: boolean) => {
    let u: URL;
    try {
      u = new URL(href);
    } catch {
      return;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return;
    if (!isSameSite(u.hostname, home.hostname)) return;
    if (u.port !== "") return; // non-default port: a different service, and not allowed anyway
    // Canonicalise onto the crawl host/scheme (www ↔ apex, http → https) to skip redirect hops.
    u.hostname = home.hostname;
    if (home.protocol === "https:") u.protocol = "https:";
    u.hash = "";
    if (ASSET_EXT.test(u.pathname) || SKIP_PATH.test(u.pathname)) return;
    if (u.search.length > 100) return;
    let normalized: string;
    try {
      normalized = normalizeAuditUrl(u.toString());
    } catch {
      return;
    }
    const key = pageKey(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    pool.push({ url: normalized, inNav, order, fromSitemap });
  };

  input.links.forEach((l, i) => consider(l.href, l.inNav, i, false));
  input.sitemapUrls.slice(0, 500).forEach((s, i) => consider(s, false, 100_000 + i, true));

  pool.sort(
    (a, b) =>
      Number(a.fromSitemap) - Number(b.fromSitemap) ||
      Number(b.inNav) - Number(a.inNav) ||
      depth(a.url) - depth(b.url) ||
      Number(a.url.includes("?")) - Number(b.url.includes("?")) ||
      a.order - b.order,
  );
  return pool.slice(0, Math.max(0, input.max * 3)).map((p) => p.url);
}

/** Body starts (after optional BOM/whitespace, comments or an XML declaration) with an HTML document. */
const STARTS_AS_HTML =
  /^﻿?\s*(?:(?:<!--[\s\S]{0,512}?-->|<\?xml[^>]{0,256}>)\s*){0,4}<(?:!doctype\s+html|html[\s>]|head[\s>]|body[\s>])/i;

/**
 * An HTML page served at /robots.txt, /llms.txt or /sitemap.xml is a soft 404. Sniff the body
 * (a real text/XML file with a wrong content-type must still count); a text/html content-type
 * plus HTML markup near the top is enough too.
 */
export function isHtmlSoft404(text: string, contentType: string): boolean {
  const head = text.slice(0, 2048);
  if (STARTS_AS_HTML.test(head)) return true;
  return /\btext\/html\b/i.test(contentType) && looksLikeHtml(head);
}

export function textOutcome(url: string, res: SafeFetchResult | null): FetchedText {
  if (!res) return { status: "error", url, requestedUrl: url, statusCode: null, text: null };
  const code = res.status;
  const base = { url: res.finalUrl, requestedUrl: url, statusCode: code };
  if (code === 200) {
    if (isHtmlSoft404(res.text, res.headers["content-type"] ?? "")) return { ...base, status: "missing", text: null };
    return { ...base, status: "ok", text: res.text };
  }
  if (code >= 400 && code < 500) return { ...base, status: "missing", text: null };
  return { ...base, status: "error", text: null };
}

export async function crawl(requestedUrl: string, opts: CrawlOptions): Promise<CrawlOutput> {
  const started = Date.now();
  const deadline = started + opts.budgetMs;
  const notes: string[] = [];
  let truncated = false;

  const budget = new AbortController();
  const budgetTimer = setTimeout(
    () => budget.abort(new DOMException("Audit time budget exceeded", "TimeoutError")),
    Math.max(0, opts.budgetMs - RESERVE_MS),
  );
  const onCallerAbort = () => budget.abort(new DOMException("Audit aborted", "AbortError"));
  if (opts.signal) {
    if (opts.signal.aborted) {
      clearTimeout(budgetTimer);
      throw new AuditError("timeout", "The audit was cancelled.");
    }
    opts.signal.addEventListener("abort", onCallerAbort, { once: true });
  }
  const signal = budget.signal;
  const remaining = () => deadline - RESERVE_MS - Date.now();
  const reqTimeout = (cap = REQUEST_TIMEOUT_MS) => Math.max(500, Math.min(cap, remaining()));

  try {
    // Validate the host up front so PSI is never pointed at a private target.
    await resolvePublicAddress(new URL(requestedUrl).hostname, signal);

    // PSI runs in parallel with the whole crawl; it has its own 30 s cap.
    const psiPromise: Promise<PsiOutcome> = fetchPsi(requestedUrl, signal);
    // Avoid unhandled rejection noise if we bail out early (fetchPsi never rejects, but be safe).
    psiPromise.catch(() => undefined);

    // ── 1. Homepage ──
    const homeRes = await safeFetch(requestedUrl, { kind: "html", timeoutMs: reqTimeout(), signal, allowErrorBodies: true });
    // A refused, rate-limited, failing or bot-checked homepage is not the owner's site: scoring it
    // would grade the block page (R7 #3). Fail with a message the visitor can act on.
    const refusal = detectHomepageRefusal(homeRes);
    if (refusal) throw new SiteRefusedError(refusal);
    if (homeRes.status >= 400) {
      // Other error pages (404, 410, ...) are still audited, but only when they are HTML.
      const ct = homeRes.headers["content-type"] ?? "";
      if (ct && !isHtmlContentType(ct)) {
        throw new AuditError("not_html", `${homeRes.finalUrl} isn't a web page (it returned ${ct.split(";")[0]}).`);
      }
      if (!ct && !looksLikeHtml(homeRes.text)) {
        throw new AuditError("not_html", `${homeRes.finalUrl} doesn't look like a web page.`);
      }
    }
    const homeUrl = homeRes.finalUrl;
    const home = new URL(homeUrl);
    const origin = home.origin;
    if (homeRes.redirects.length && !isSameSite(home.hostname, new URL(requestedUrl).hostname)) {
      notes.push(`${new URL(requestedUrl).hostname} redirects to ${home.hostname}, so we audited ${home.hostname}.`);
    }
    if (homeRes.status >= 400) {
      notes.push(
        `Your homepage answered with status ${homeRes.status}, so some results may describe that error page rather than your real homepage.`,
      );
    }
    if (homeRes.truncated && homeRes.status < 400) notes.push("Your homepage is very large; only the first 2 MB was analysed.");

    // Throws AuditError("too_large") for hostile/huge DOMs, before any analysis runs.
    const homePage = parsePage({
      url: homeUrl,
      requestedUrl,
      statusCode: homeRes.status,
      headers: homeRes.headers,
      html: homeRes.text,
      isHome: true,
    });

    // ── 2. robots.txt, sitemap.xml, llms.txt, http→https probe (parallel) ──
    const getText = async (url: string): Promise<FetchedText> => {
      try {
        const res = await safeFetch(url, { kind: "text", timeoutMs: reqTimeout(), signal });
        return textOutcome(url, res);
      } catch {
        return textOutcome(url, null);
      }
    };
    const getSitemap = async (url: string): Promise<FetchedText> => {
      try {
        const res = await safeFetch(url, {
          kind: "text",
          timeoutMs: reqTimeout(),
          signal,
          maxBytes: 2 * 1024 * 1024,
        });
        // Gzipped sitemap file (not transfer-encoded): magic bytes 1f 8b.
        if (res.status === 200 && res.bytes[0] === 0x1f && res.bytes[1] === 0x8b) {
          try {
            const xml = gunzipSync(res.bytes, { maxOutputLength: 4 * 1024 * 1024 }).toString("utf-8");
            return { status: "ok", url: res.finalUrl, requestedUrl: url, statusCode: 200, text: xml };
          } catch {
            return { status: "error", url: res.finalUrl, requestedUrl: url, statusCode: 200, text: null };
          }
        }
        return textOutcome(url, res);
      } catch {
        return textOutcome(url, null);
      }
    };
    const probeHttp = async (): Promise<AuditContext["httpToHttps"]> => {
      if (home.protocol !== "https:") return { checked: false, redirectsToHttps: null };
      try {
        const res = await safeFetch(`http://${home.host}/`, {
          kind: "text",
          timeoutMs: reqTimeout(5_000),
          signal,
          maxRedirects: 0,
          maxBytes: 64 * 1024,
        });
        if (res.location) return { checked: true, redirectsToHttps: res.location.startsWith("https://") };
        return { checked: true, redirectsToHttps: false };
      } catch {
        // Port 80 closed / unreachable: browsers can't land on an insecure copy either.
        return { checked: false, redirectsToHttps: null };
      }
    };

    const [robots, sitemapDefault, llms, httpToHttps] = await Promise.all([
      getText(`${origin}/robots.txt`),
      getSitemap(`${origin}/sitemap.xml`),
      getText(`${origin}/llms.txt`),
      probeHttp(),
    ]);
    if (robots.status === "ok" && robots.text !== null && !looksLikeRobotsTxt(robots.text)) {
      robots.status = "missing";
      robots.text = null;
    }

    // parseRobots binds rules to robots.requestedUrl (our origin), so a robots.txt that
    // redirects to another host still applies to this site (RFC 9309).
    const robotsParsed = parseRobots(robots);
    let sitemap = sitemapDefault;
    let sitemapParsed: ParsedSitemap | null = sitemap.status === "ok" && sitemap.text ? parseSitemap(sitemap.text) : null;
    if (!sitemapParsed || sitemapParsed.kind === "invalid") {
      const declared = (robotsParsed?.getSitemaps() ?? []).filter((u) => pageKey(u) !== pageKey(`${origin}/sitemap.xml`));
      for (const candidate of declared.slice(0, 2)) {
        if (remaining() < MIN_PAGE_START_MS) break;
        let normalized: string;
        try {
          normalized = normalizeAuditUrl(candidate);
        } catch {
          continue;
        }
        const r = await getSitemap(normalized);
        const parsed = r.status === "ok" && r.text ? parseSitemap(r.text) : null;
        if (parsed && parsed.kind !== "invalid") {
          sitemap = r;
          sitemapParsed = parsed;
          break;
        }
      }
    }
    // A /sitemap.xml that serves an HTML page isn't a sitemap; keep "missing".

    // ── 3. Internal pages ──
    const sitemapUrls = sitemap.status === "ok" && sitemapParsed?.kind === "urlset" ? sitemapParsed.locs : [];
    const candidates = selectInternalLinks({
      homeUrl,
      links: homePage.links,
      sitemapUrls,
      max: opts.maxPages,
    });

    // Candidates beyond maxPages are spares, used only when a page is skipped or fails.
    const queue = candidates;
    const pages: PageData[] = [homePage];
    const seenFinal = new Set<string>([pageKey(homeUrl)]);
    let homeText: string | null = null;
    const results: (PageData | null)[] = new Array(queue.length).fill(null);
    let cursor = 0;
    let collected = 0;
    let inFlight = 0;
    const worker = async () => {
      while (cursor < queue.length && collected + inFlight < opts.maxPages) {
        const idx = cursor++;
        const url = queue[idx];
        if (isBlocked(robotsParsed, url, OUR_BOT)) {
          notes.push(`robots.txt disallows crawling ${pathOf(url)} for seenhqbot, so we skipped it.`);
          continue;
        }
        if (remaining() < MIN_PAGE_START_MS || signal.aborted) {
          truncated = true;
          return;
        }
        inFlight++;
        try {
          const res = await safeFetch(url, { kind: "html", timeoutMs: reqTimeout(), signal });
          if (!isSameSite(new URL(res.finalUrl).hostname, home.hostname)) {
            notes.push(`${pathOf(url)} redirects to another website, so we skipped it.`);
            continue;
          }
          const key = pageKey(res.finalUrl);
          if (seenFinal.has(key)) continue;
          seenFinal.add(key);
          let page: PageData;
          try {
            page = parsePage({
              url: res.finalUrl,
              requestedUrl: url,
              statusCode: res.status,
              headers: res.headers,
              html: res.text,
              isHome: false,
            });
          } catch (err) {
            if (err instanceof AuditError && err.code === "too_large") {
              notes.push(`${pathOf(url)} is too complex to analyse (an extremely large page structure), so we skipped it.`);
              continue;
            }
            throw err;
          }
          // A page whose canonical is the homepage is skipped only when it really is a copy of the
          // homepage (e.g. "/home"). A site-wide canonical to "/" on distinct pages is a serious
          // misconfiguration that seo.canonical must report, so those pages are kept.
          const canonical = page.$('link[rel~="canonical" i][href]').first().attr("href");
          const canonicalUrl = canonical ? resolveHref(canonical, page.url) : null;
          if (canonicalUrl && pageKey(canonicalUrl) === pageKey(homeUrl)) {
            homeText ??= visibleText(homePage.$);
            if (page.title === homePage.title && visibleText(page.$) === homeText) {
              notes.push(`${pathOf(url)} is a copy of your homepage, so we skipped it.`);
              continue;
            }
          }
          results[idx] = page;
          collected++;
        } catch (err) {
          if (signal.aborted) {
            truncated = true;
            return;
          }
          const msg =
            err instanceof AuditError && err.code === "not_html"
              ? "isn't an HTML page"
              : err instanceof AuditError && err.code === "too_large"
                ? "is larger than 2 MB"
                : err instanceof AuditError && err.code === "timeout"
                  ? "took too long to load"
                  : "couldn't be loaded";
          notes.push(`${pathOf(url)} ${msg}, so we skipped it.`);
        } finally {
          inFlight--;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PAGE_CONCURRENCY, queue.length, opts.maxPages) }, worker));
    for (const r of results) if (r) pages.push(r);

    // ── 4. PSI ──
    const psi = await psiPromise;
    if (!psi.ok) {
      notes.push(`${psi.error ?? "PageSpeed Insights was unavailable"}, so the performance score was left out.`);
    }
    if (truncated) notes.push("We ran out of time before scanning every page; results cover the pages we reached.");

    return {
      ctx: {
        requestedUrl,
        finalUrl: homeUrl,
        hostname: home.hostname,
        origin,
        pages,
        robots,
        sitemap,
        llms,
        httpToHttps,
        psi,
      },
      notes,
      truncated,
    };
  } catch (err) {
    if (err instanceof AuditError) {
      if (err.code === "timeout" && opts.signal?.aborted) throw new AuditError("timeout", "The audit was cancelled.");
      throw err;
    }
    throw new AuditError("unreachable", "Something went wrong while checking this site. Please try again.");
  } finally {
    clearTimeout(budgetTimer);
    // Stop anything still in flight (PSI, stragglers).
    if (!budget.signal.aborted) budget.abort(new DOMException("Audit finished", "AbortError"));
    opts.signal?.removeEventListener("abort", onCallerAbort);
  }
}
