import { AuditError } from "./types";
import { classifyIp, isIpLiteral } from "./net/ip";

const MAX_URL_LENGTH = 2048;

/** Hostname suffixes that only exist on private networks. */
const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".corp",
  ".home.arpa",
  ".localdomain",
];

/**
 * Normalise user input into an absolute https/http URL we are willing to fetch.
 * Pure (no DNS). Throws AuditError("invalid_url") for malformed input and
 * AuditError("blocked_host") for hosts that are private by construction.
 */
export function normalizeAuditUrl(input: string): string {
  if (typeof input !== "string") {
    throw new AuditError("invalid_url", "Please enter a website address.");
  }
  let raw = input.trim();
  if (raw.length === 0) {
    throw new AuditError("invalid_url", "Please enter a website address.");
  }
  if (raw.length > MAX_URL_LENGTH) {
    throw new AuditError("invalid_url", "That address is too long.");
  }
  // Disallow whitespace/control chars inside the URL.
  if (/[\s\u0000-\u001f\u007f]/.test(raw)) {
    throw new AuditError("invalid_url", "That doesn't look like a valid website address.");
  }

  // Add a scheme when the user typed a bare domain ("example.com/path").
  // A string like "ftp://x" or "javascript:..." has an explicit scheme and is rejected below.
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  const looksLikeHostPort = /^[^/:]+:\d+(\/|$)/.test(raw); // "example.com:8080"
  if (raw.startsWith("//")) raw = `https:${raw}`;
  else if (!hasScheme || looksLikeHostPort) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AuditError("invalid_url", "That doesn't look like a valid website address.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new AuditError("invalid_url", "Only http:// and https:// websites can be checked.");
  }
  if (url.username || url.password) {
    throw new AuditError("invalid_url", "Website addresses with a username or password aren't supported.");
  }
  // URL drops default ports, so any remaining port is non-default.
  if (url.port !== "") {
    const port = Number(url.port);
    const ok =
      (url.protocol === "https:" && port === 443) || (url.protocol === "http:" && port === 80);
    if (!ok) {
      throw new AuditError("invalid_url", "Only standard web ports (80 and 443) are supported.");
    }
  }

  let host = url.hostname.toLowerCase();
  if (host.endsWith(".")) host = host.slice(0, -1);
  if (!host) {
    throw new AuditError("invalid_url", "That doesn't look like a valid website address.");
  }

  if (isIpLiteral(host)) {
    // The WHATWG parser has already turned decimal/octal/hex IPv4 forms into dotted quads.
    if (!classifyIp(host).public) {
      throw new AuditError("blocked_host", "That address points to a private network and can't be checked.");
    }
  } else {
    if (host === "localhost" || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
      throw new AuditError("blocked_host", "That address points to a private network and can't be checked.");
    }
    if (!host.includes(".")) {
      throw new AuditError("invalid_url", "Please enter a full domain, like example.com.");
    }
    const labels = host.split(".");
    if (labels.some((l) => l.length === 0 || l.length > 63) || host.length > 253) {
      throw new AuditError("invalid_url", "That doesn't look like a valid website address.");
    }
    // The TLD must not be purely numeric (catches things like "1.2.3" that aren't IPs).
    const tld = labels[labels.length - 1];
    if (/^\d+$/.test(tld)) {
      throw new AuditError("invalid_url", "That doesn't look like a valid website address.");
    }
  }

  url.hostname = host;
  url.hash = "";
  const out = url.toString();
  if (out.length > MAX_URL_LENGTH) {
    throw new AuditError("invalid_url", "That address is too long.");
  }
  return out;
}

/** Hostname without a leading "www." — used to treat www and apex as one site. */
export function siteKey(hostname: string): string {
  const h = hostname.toLowerCase();
  return h.startsWith("www.") ? h.slice(4) : h;
}

export function isSameSite(a: string, b: string): boolean {
  return siteKey(a) === siteKey(b);
}
