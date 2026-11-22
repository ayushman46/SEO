/**
 * Pure IP classifier for SSRF protection (no network IO, safe to unit-test).
 *
 * An address is "public" only when ipaddr.js classifies it as `unicast` AND it is
 * not an IPv4-mapped / translated IPv6 form, and (for IPv6) it lives inside the
 * global-unicast block 2000::/3. Everything else (loopback, private, link-local,
 * CGNAT, metadata 169.254.169.254, ULA fc00::/7, multicast, reserved, NAT64, 6to4,
 * Teredo, documentation ranges, ...) is rejected.
 */
import ipaddr from "ipaddr.js";

export interface IpVerdict {
  public: boolean;
  /** ipaddr.js range name (or our own reason) for logs/notes */
  range: string;
}

const GLOBAL_UNICAST_V6 = ipaddr.IPv6.parseCIDR("2000::/3");

/** Strip URL brackets and IPv6 zone ids ("[fe80::1%eth0]" -> "fe80::1"). */
function cleanIpLiteral(input: string): string {
  let s = input.trim();
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  const zone = s.indexOf("%");
  if (zone !== -1) s = s.slice(0, zone);
  return s;
}

/** True when `input` is an IP literal in strict dotted-quad / IPv6 notation. */
export function isIpLiteral(input: string): boolean {
  const s = cleanIpLiteral(input);
  return ipaddr.IPv4.isValidFourPartDecimal(s) || ipaddr.IPv6.isValid(s);
}

export function classifyIp(input: string): IpVerdict {
  const s = cleanIpLiteral(input);
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    // Only accept canonical four-part decimal IPv4 here. Shorthand / octal / hex forms
    // are normalised by the WHATWG URL parser before they ever reach us; anything else
    // that is not a clean literal is treated as non-public.
    if (ipaddr.IPv4.isValidFourPartDecimal(s)) addr = ipaddr.IPv4.parse(s);
    else if (ipaddr.IPv6.isValid(s)) addr = ipaddr.IPv6.parse(s);
    else return { public: false, range: "invalid" };
  } catch {
    return { public: false, range: "invalid" };
  }

  if (addr.kind() === "ipv6") {
    const v6 = addr as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) {
      // ::ffff:a.b.c.d — never connect via a mapped form, regardless of the embedded v4.
      return { public: false, range: "ipv4Mapped" };
    }
    const range = v6.range();
    if (range !== "unicast") return { public: false, range };
    if (!v6.match(GLOBAL_UNICAST_V6)) return { public: false, range: "notGlobalUnicast" };
    return { public: true, range };
  }

  const range = (addr as ipaddr.IPv4).range();
  return { public: range === "unicast", range };
}

export function isPublicIp(input: string): boolean {
  return classifyIp(input).public;
}
