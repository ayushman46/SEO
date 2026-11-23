import "server-only";
import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import type { IncomingMessage } from "node:http";
import type { LookupFunction } from "node:net";
import type { Readable } from "node:stream";
import { AuditError } from "../types";
import { normalizeAuditUrl } from "../url";
import { resolvePublicAddress, type ResolvedAddress } from "./ssrf";

export const REQUEST_TIMEOUT_MS = 8_000;
export const MAX_HTML_BYTES = 2 * 1024 * 1024;
export const MAX_TEXT_BYTES = 512 * 1024;
export const MAX_REDIRECTS = 3;

/** Fallback public site when NEXT_PUBLIC_SITE_URL is unset (we don't own seenhq.com). */
export const DEFAULT_SITE_URL = "https://seenhq.vercel.app";

/** Info URL in every User-Agent we send: `${NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL}/bot`. */
export function botInfoUrl(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/+$/, "");
  return `${base}/bot`;
}

export function userAgent(): string {
  return `Mozilla/5.0 (compatible; seenhqbot/1.0; +${botInfoUrl()})`;
}

/**
 * Product tokens we may put in a *labelled* simulated User-Agent (ADR-017). The UA always
 * carries our own marker; a bot's official UA string is never sent verbatim.
 */
export const SIMULATED_BOT_TOKENS = [
  "GPTBot/1.3",
  "OAI-SearchBot/1.3",
  "ChatGPT-User/1.0",
  "ClaudeBot/1.0",
  "PerplexityBot/1.0",
  "bingbot/2.0",
] as const;
export type SimulatedBotToken = (typeof SIMULATED_BOT_TOKENS)[number];

/** e.g. "Mozilla/5.0 (compatible; GPTBot/1.3; simulated-by seenhqbot/1.0; +https://seenhq.vercel.app/bot)" */
export function simulatedUserAgent(token: SimulatedBotToken): string {
  if (!(SIMULATED_BOT_TOKENS as readonly string[]).includes(token)) return userAgent();
  return `Mozilla/5.0 (compatible; ${token}; simulated-by seenhqbot/1.0; +${botInfoUrl()})`;
}

export interface SafeFetchOptions {
  /** send the HTML Accept header without enforcing an HTML response (crawler probe) */
  acceptHtml?: boolean;
  /** default GET; HEAD returns an empty body */
  method?: "GET" | "HEAD";
  /** crawler probe only: send a labelled simulated UA for this bot token (see simulatedUserAgent) */
  simulate?: SimulatedBotToken;
  /** "html": content-type must be HTML; "text": anything (robots, sitemap, llms.txt). */
  kind: "html" | "text";
  /** body cap in bytes (after decompression) */
  maxBytes?: number;
  /** what to do when the body exceeds maxBytes */
  onOverflow?: "error" | "truncate";
  /** timeout covering the whole call incl. redirects (default 8 s) */
  timeoutMs?: number;
  /** outer abort signal (global budget / caller) */
  signal?: AbortSignal;
  /** default 3; 0 = return the redirect response itself without following */
  maxRedirects?: number;
  /**
   * kind "html" only: return non-HTML error responses (status >= 400, content type missing or not
   * HTML) with the body truncated at 64 KB instead of failing with not_html. The homepage uses this so
   * a firewall's JSON or plain-text refusal is reported as a refusal (R7 #3).
   */
  allowErrorBodies?: boolean;
}

/** Body cap for error responses read under allowErrorBodies. */
export const ERROR_BODY_MAX_BYTES = 64 * 1024;

export interface SafeFetchResult {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  /** lower-cased header names; repeated headers joined with ", " */
  headers: Record<string, string>;
  /** raw (decompressed) body bytes */
  bytes: Buffer;
  /** decoded body text */
  text: string;
  truncated: boolean;
  /** every URL we were redirected to, in order */
  redirects: string[];
  /** Location header when maxRedirects === 0 and the response is a redirect */
  location: string | null;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function flattenHeaders(res: IncomingMessage): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(res.headers)) {
    if (v === undefined) continue;
    out[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : v;
  }
  // Keep one line per X-Robots-Tag header: a bot scope ("bingbot: nofollow") must not leak
  // into a separate, generic header ("noindex") when the two are joined.
  const xr = res.headersDistinct?.["x-robots-tag"];
  if (xr?.length) out["x-robots-tag"] = xr.join("\n");
  return out;
}

export function isHtmlContentType(ct: string): boolean {
  return /\b(text\/html|application\/xhtml\+xml)\b/i.test(ct);
}

export function looksLikeHtml(text: string): boolean {
  return /<(!doctype\s+html|html[\s>]|head[\s>]|body[\s>])/i.test(text.slice(0, 4096));
}

function pickCharset(contentType: string, head: Buffer): string {
  const fromHeader = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType)?.[1];
  if (fromHeader) return fromHeader;
  const sniff = head.subarray(0, 2048).toString("latin1");
  const fromMeta =
    /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(sniff)?.[1] ??
    /<meta[^>]+content\s*=\s*["'][^"']*charset=([\w-]+)/i.exec(sniff)?.[1];
  return fromMeta ?? "utf-8";
}

function decode(bytes: Buffer, charset: string): string {
  try {
    return new TextDecoder(charset.toLowerCase()).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function networkError(err: unknown, url: URL, signal: AbortSignal): AuditError {
  if (err instanceof AuditError) return err;
  if (signal.aborted) return new AuditError("timeout", `${url.hostname} took too long to respond.`);
  const e = err as NodeJS.ErrnoException | undefined;
  const code = e?.code ?? "";
  const name = e?.name ?? "";
  if (name === "AbortError" || name === "TimeoutError" || code === "ABORT_ERR") {
    return new AuditError("timeout", `${url.hostname} took too long to respond.`);
  }
  if (/CERT|SSL|TLS|SELF_SIGNED|UNABLE_TO_VERIFY/i.test(code) || /certificate/i.test(e?.message ?? "")) {
    return new AuditError(
      "unreachable",
      `${url.hostname} has a security certificate problem, so browsers (and we) can't connect safely.`,
    );
  }
  if (code === "ECONNREFUSED") {
    return new AuditError("unreachable", `${url.hostname} refused the connection.`);
  }
  return new AuditError("unreachable", `We couldn't connect to ${url.hostname}.`);
}

function requestOnce(
  url: URL,
  pinned: ResolvedAddress,
  signal: AbortSignal,
  accept: string,
  method: "GET" | "HEAD" = "GET",
  ua: string = userAgent(),
): Promise<IncomingMessage> {
  const isHttps = url.protocol === "https:";
  const mod = isHttps ? https : http;
  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  // Pin the socket to the address we validated (defeats DNS rebinding). Handles
  // both the single-address and the `all: true` (happy-eyeballs) lookup shapes.
  const lookup: LookupFunction = (_host, options, callback) => {
    if (options && options.all) {
      callback(null, [{ address: pinned.address, family: pinned.family }]);
    } else {
      callback(null, pinned.address, pinned.family);
    }
  };

  return new Promise<IncomingMessage>((resolve, reject) => {
    const req = mod.request(
      {
        protocol: url.protocol,
        hostname,
        port: url.port ? Number(url.port) : isHttps ? 443 : 80,
        path: `${url.pathname}${url.search}`,
        method,
        agent: false,
        lookup,
        family: pinned.family,
        signal,
        ...(isHttps && !hostname.includes(":") && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)
          ? { servername: hostname }
          : {}),
        headers: {
          "user-agent": ua,
          accept,
          "accept-language": "en;q=0.9, *;q=0.5",
          "accept-encoding": "gzip, deflate, br",
          connection: "close",
        },
      },
      resolve,
    );
    req.on("error", reject);
    req.end();
  });
}

async function readBody(
  res: IncomingMessage,
  maxBytes: number,
  onOverflow: "error" | "truncate",
  hostname: string,
): Promise<{ bytes: Buffer; truncated: boolean }> {
  const enc = (res.headers["content-encoding"] ?? "").toString().toLowerCase().trim();
  let stream: Readable = res;
  if (enc === "gzip" || enc === "x-gzip") stream = res.pipe(zlib.createGunzip());
  else if (enc === "deflate") stream = res.pipe(zlib.createInflate());
  else if (enc === "br") stream = res.pipe(zlib.createBrotliDecompress());

  if (stream !== res) {
    // Propagate socket errors/aborts into the decompressor so the loop below rejects.
    res.on("error", (err) => stream.destroy(err));
  }

  const chunks: Buffer[] = [];
  let size = 0;
  let truncated = false;
  try {
    for await (const chunk of stream) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      if (size + buf.length > maxBytes) {
        if (onOverflow === "error") {
          throw new AuditError("too_large", `The page at ${hostname} is larger than 2 MB, which is too big to check.`);
        }
        chunks.push(buf.subarray(0, maxBytes - size));
        size = maxBytes;
        truncated = true;
        break;
      }
      chunks.push(buf);
      size += buf.length;
    }
  } finally {
    // Stop downloading (no-op if the body was fully read).
    res.destroy();
    if (stream !== res) stream.destroy();
  }
  return { bytes: Buffer.concat(chunks, size), truncated };
}

/**
 * SSRF-safe GET. Every hop is re-normalised (scheme/port/host rules), DNS-resolved,
 * checked against private ranges, and the socket is pinned to the validated IP.
 * Never throws anything but AuditError.
 */
export async function safeFetch(inputUrl: string, opts: SafeFetchOptions): Promise<SafeFetchResult> {
  const maxBytes = opts.maxBytes ?? (opts.kind === "html" ? MAX_HTML_BYTES : MAX_TEXT_BYTES);
  const onOverflow = opts.onOverflow ?? (opts.kind === "html" ? "error" : "truncate");
  const maxRedirects = opts.maxRedirects ?? MAX_REDIRECTS;
  const timeoutSignal = AbortSignal.timeout(opts.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeoutSignal]) : timeoutSignal;
  const accept =
    opts.kind === "html" || opts.acceptHtml
      ? "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5"
      : "text/plain,application/xml,text/xml;q=0.9,*/*;q=0.5";

  const requestedUrl = normalizeAuditUrl(inputUrl);
  const redirects: string[] = [];
  let current = requestedUrl;

  for (let hop = 0; ; hop++) {
    const url = new URL(current);
    if (signal.aborted) {
      throw new AuditError("timeout", `${url.hostname} took too long to respond.`);
    }
    const pinned = await resolvePublicAddress(url.hostname, signal);

    let res: IncomingMessage;
    try {
      res = await requestOnce(
        url,
        pinned,
        signal,
        accept,
        opts.method ?? "GET",
        opts.simulate ? simulatedUserAgent(opts.simulate) : userAgent(),
      );
    } catch (err) {
      throw networkError(err, url, signal);
    }
    const status = res.statusCode ?? 0;
    const headers = flattenHeaders(res);

    if (REDIRECT_STATUSES.has(status) && headers.location) {
      res.destroy();
      if (maxRedirects === 0) {
        let location: string | null = null;
        try {
          location = new URL(headers.location, url).toString();
        } catch {
          location = null;
        }
        return {
          requestedUrl,
          finalUrl: current,
          status,
          headers,
          bytes: Buffer.alloc(0),
          text: "",
          truncated: false,
          redirects,
          location,
        };
      }
      if (hop >= maxRedirects) {
        throw new AuditError("unreachable", `${url.hostname} redirected too many times.`);
      }
      let next: string;
      try {
        next = normalizeAuditUrl(new URL(headers.location, url).toString());
      } catch (err) {
        if (err instanceof AuditError) throw err;
        throw new AuditError("unreachable", `${url.hostname} redirected to an invalid address.`);
      }
      redirects.push(next);
      current = next;
      continue;
    }

    const contentType = headers["content-type"] ?? "";
    // HTML error pages take the normal path (2 MB cap); only non-HTML error bodies are read here.
    const errorBody =
      opts.kind === "html" &&
      opts.allowErrorBodies === true &&
      status >= 400 &&
      (!contentType || !isHtmlContentType(contentType));
    if (opts.method === "HEAD") {
      res.destroy();
      return { requestedUrl, finalUrl: current, status, headers, bytes: Buffer.alloc(0), text: "", truncated: false, redirects, location: null };
    }
    if (errorBody) {
      let body: { bytes: Buffer; truncated: boolean };
      try {
        body = await readBody(res, ERROR_BODY_MAX_BYTES, "truncate", url.hostname);
      } catch (err) {
        throw networkError(err, url, signal);
      }
      const text = decode(body.bytes, pickCharset(contentType, body.bytes));
      return { requestedUrl, finalUrl: current, status, headers, bytes: body.bytes, text, truncated: body.truncated, redirects, location: null };
    }
    if (opts.kind === "html" && contentType && !isHtmlContentType(contentType)) {
      res.destroy();
      throw new AuditError("not_html", `${current} isn't a web page (it returned ${contentType.split(";")[0]}).`);
    }
    const declaredLength = Number(headers["content-length"] ?? "");
    if (onOverflow === "error" && Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      res.destroy();
      throw new AuditError("too_large", `The page at ${url.hostname} is larger than 2 MB, which is too big to check.`);
    }

    let body: { bytes: Buffer; truncated: boolean };
    try {
      body = await readBody(res, maxBytes, onOverflow, url.hostname);
    } catch (err) {
      throw networkError(err, url, signal);
    }

    const text = decode(body.bytes, pickCharset(contentType, body.bytes));
    if (opts.kind === "html" && !contentType && !looksLikeHtml(text)) {
      throw new AuditError("not_html", `${current} doesn't look like a web page.`);
    }

    return {
      requestedUrl,
      finalUrl: current,
      status,
      headers,
      bytes: body.bytes,
      text,
      truncated: body.truncated,
      redirects,
      location: null,
    };
  }
}
