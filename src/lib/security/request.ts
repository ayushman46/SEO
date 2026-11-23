import "server-only";
import { createHash } from "node:crypto";
import ipaddr from "ipaddr.js";
import { getServerEnv } from "./env";

type HeaderSource = Pick<Headers, "get">;

/** Returned by getClientIp when no usable client IP header is present. */
export const UNKNOWN_IP = "unknown";

const IP_CHARS = /^[0-9a-fA-F:.]{2,45}$/;

function cleanIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.trim();
  // "[2001:db8::1]:443" → "2001:db8::1"
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(ip);
  if (bracketed) ip = bracketed[1];
  // "203.0.113.7:51234" → "203.0.113.7" (IPv4 with port; IPv6 has more than one colon)
  else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(":"));
  return IP_CHARS.test(ip) ? ip.toLowerCase() : null;
}

/**
 * Client IP from proxy headers: first hop of `x-forwarded-for`, else `x-real-ip`, else "unknown".
 * Trust note: correct on Vercel (the platform overwrites these headers). Behind another proxy,
 * make sure it strips client-supplied values, otherwise a client can pick its own rate-limit bucket.
 */
export function getClientIp(headers: HeaderSource): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = cleanIp(forwarded.split(",")[0]);
    if (first) return first;
  }
  return cleanIp(headers.get("x-real-ip")) ?? UNKNOWN_IP;
}

/**
 * The identity a rate limit should count: IPv4 as-is (IPv4-mapped IPv6 unwrapped), IPv6 collapsed
 * to its /64 prefix (one subscriber / one cloud VM usually owns a whole /64, so per-address buckets
 * would be trivially rotated). Returns null for a missing or unparsable IP.
 */
export function rateLimitSubject(ip: string): string | null {
  if (ip === UNKNOWN_IP || !ipaddr.isValid(ip)) return null;
  const addr = ipaddr.process(ip);
  if (addr.kind() === "ipv4") return addr.toString();
  const bytes = addr.toByteArray().slice(0, 8);
  const groups: string[] = [];
  for (let i = 0; i < 8; i += 2) groups.push(((bytes[i] << 8) | bytes[i + 1]).toString(16));
  return `${groups.join(":")}::/64`;
}

const DEV_SALT = "noticr-dev-ip-salt-not-for-production";
let warnedSalt = false;

/** Salted SHA-256 of an IP (hex, 64 chars). Raw IPs are never stored. */
export function hashIp(ip: string): string {
  let salt = getServerEnv().IP_HASH_SALT;
  if (!salt) {
    if (!warnedSalt) {
      warnedSalt = true;
      console.warn("[security] IP_HASH_SALT is not set; using a fixed development salt. Set it in production.");
    }
    salt = DEV_SALT;
  }
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** User agent truncated to 256 chars (fits the DB check), or null. */
export function getUserAgent(headers: HeaderSource): string | null {
  const ua = headers.get("user-agent");
  if (!ua) return null;
  const trimmed = ua.trim().slice(0, 256);
  return trimmed === "" ? null : trimmed;
}
