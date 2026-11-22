import "server-only";
import { gunzipSync } from "node:zlib";
import { AuditError } from "./types";
import type { AuditContext, FetchedText, PsiOutcome } from "./context";
import { parsePage, resolveHref, type PageData } from "./html";
import { safeFetch, REQUEST_TIMEOUT_MS, type SafeFetchResult } from "./net/fetch";
import { resolvePublicAddress } from "./net/ssrf";
import { isSameSite, normalizeAuditUrl } from "./url";
import { isBlocked, looksLikeRobotsTxt, OUR_BOT, parseRobots } from "./robots";
import { parseSitemap } from "./checks/seo/sitemap";
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

/** Comparable key: origin + path without trailing slash + query. */
function pageKey(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.hostname.replace(/^www\./, "")}${path}${u.search}`;
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

function textOutcome(url: string, res: SafeFetchResult | null): FetchedText {
  if (!res) return { status: "error", url, statusCode: null, text: null };
  const code = res.status;
  if (code === 200) {
    const looksHtml = /^\s*(<!doctype html|<html)/i.test(res.text.slice(0, 512));
    if (looksHtml) return { status: "missing", url: res.finalUrl, statusCode: code, text: null };
    return { status: "ok", url: res.finalUrl, statusCode: code, text: res.text };
  }
  if (code >= 400 && code < 500) return { status: "missing", url: res.finalUrl, statusCode: code, text: null };
  return { status: "error", url: res.finalUrl, statusCode: code, text: null };
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
    const homeRes = await safeFetch(requestedUrl, { kind: "html", timeoutMs: reqTimeout(), signal });
    const homeUrl = homeRes.finalUrl;
    const home = new URL(homeUrl);
    const origin = home.origin;
    if (homeRes.redirects.length && !isSameSite(home.hostname, new URL(requestedUrl).hostname)) {
      notes.push(`${new URL(requestedUrl).hostname} redirects to ${home.hostname}, so we audited ${home.hostname}.`);
    }
    if (homeRes.status >= 400) {
      notes.push(
        `Your homepage answered with status ${homeRes.status}. If your site blocks automated visitors, some results may be incomplete.`,
      );
    }
    if (homeRes.truncated) notes.push("Your homepage is very large; only the first 2 MB was analysed.");

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
            return { status: "ok", url: res.finalUrl, statusCode: 200, text: xml };
          } catch {
            return { status: "error", url: res.finalUrl, statusCode: 200, text: null };
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

    const robotsParsed = parseRobots(robots);
    let sitemap = sitemapDefault;
    if (sitemap.status !== "ok" || !sitemap.text || parseSitemap(sitemap.text).kind === "invalid") {
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
        if (r.status === "ok" && r.text && parseSitemap(r.text).kind !== "invalid") {
          sitemap = r;
          break;
        }
      }
    }
    // A /sitemap.xml that serves an HTML page isn't a sitemap; keep "missing".

    // ── 3. Internal pages ──
    const sitemapUrls =
      sitemap.status === "ok" && sitemap.text
        ? (() => {
            const p = parseSitemap(sitemap.text);
            return p.kind === "urlset" ? p.locs : [];
          })()
        : [];
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
          const page = parsePage({
            url: res.finalUrl,
            requestedUrl: url,
            statusCode: res.status,
            headers: res.headers,
            html: res.text,
            isHome: false,
          });
          // A page whose canonical is the homepage (e.g. "/home") is a duplicate URL, not a new page.
          const canonical = page.$('link[rel~="canonical" i][href]').first().attr("href");
          const canonicalUrl = canonical ? resolveHref(canonical, page.url) : null;
          if (canonicalUrl && pageKey(canonicalUrl) === pageKey(homeUrl)) continue;
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
