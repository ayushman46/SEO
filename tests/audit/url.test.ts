import { describe, expect, it } from "vitest";
import { normalizeAuditUrl } from "@/lib/audit/url";
import { AuditError } from "@/lib/audit/types";

function codeOf(input: string): string | null {
  try {
    normalizeAuditUrl(input);
    return null;
  } catch (e) {
    expect(e).toBeInstanceOf(AuditError);
    return (e as AuditError).code;
  }
}

describe("normalizeAuditUrl — accepted input", () => {
  const cases: [string, string][] = [
    ["example.com", "https://example.com/"],
    ["  Example.COM  ", "https://example.com/"],
    ["https://example.com/path?q=1#frag", "https://example.com/path?q=1"],
    ["http://example.com", "http://example.com/"],
    ["HTTPS://WWW.Example.com/Blog/", "https://www.example.com/Blog/"],
    ["example.com/about", "https://example.com/about"],
    ["//example.com/x", "https://example.com/x"],
    ["https://example.com:443/", "https://example.com/"],
    ["http://example.com:80/", "http://example.com/"],
    ["example.com.", "https://example.com/"],
    ["https://8.8.8.8/", "https://8.8.8.8/"],
    ["https://bücher.de", "https://xn--bcher-kva.de/"],
  ];
  for (const [input, expected] of cases) {
    it(`${JSON.stringify(input)} → ${expected}`, () => {
      expect(normalizeAuditUrl(input)).toBe(expected);
    });
  }
});

describe("normalizeAuditUrl — rejected input", () => {
  const invalid: [string, string][] = [
    ["", "invalid_url"],
    ["   ", "invalid_url"],
    ["ftp://example.com", "invalid_url"],
    ["file:///etc/passwd", "invalid_url"],
    ["javascript:alert(1)", "invalid_url"],
    ["data:text/html,hi", "invalid_url"],
    ["gopher://example.com", "invalid_url"],
    ["https://user:pass@example.com", "invalid_url"],
    ["https://user@example.com", "invalid_url"],
    ["https://example.com:8080", "invalid_url"],
    ["example.com:22", "invalid_url"],
    ["http://example.com:443", "invalid_url"],
    ["https://example.com:80", "invalid_url"],
    ["intranet", "invalid_url"],
    ["https://server/", "invalid_url"],
    ["exa mple.com", "invalid_url"],
    [`https://example.com/${"a".repeat(2050)}`, "invalid_url"],
    // Private by construction
    ["localhost", "blocked_host"],
    ["http://localhost:80", "blocked_host"],
    ["app.localhost", "blocked_host"],
    ["printer.local", "blocked_host"],
    ["metadata.google.internal", "blocked_host"],
    ["router.home.arpa", "blocked_host"],
    ["http://127.0.0.1", "blocked_host"],
    ["http://0.0.0.0", "blocked_host"],
    ["http://10.0.0.1", "blocked_host"],
    ["http://172.16.5.4", "blocked_host"],
    ["http://192.168.1.1", "blocked_host"],
    ["http://100.64.0.1", "blocked_host"],
    ["http://169.254.169.254/latest/meta-data/", "blocked_host"],
    ["http://[::1]/", "blocked_host"],
    ["http://[fc00::1]/", "blocked_host"],
    ["http://[fe80::1]/", "blocked_host"],
    ["http://[::ffff:127.0.0.1]/", "blocked_host"],
    // Decimal / octal / hex / shorthand IPv4 forms (normalised by the URL parser)
    ["http://2130706433/", "blocked_host"],
    ["http://017700000001/", "blocked_host"],
    ["http://0x7f000001/", "blocked_host"],
    ["http://0x7f.0.0.1/", "blocked_host"],
    ["http://127.1/", "blocked_host"],
    ["http://0251.0376.0251.0376/", "blocked_host"], // 169.254.169.254 in octal
  ];
  for (const [input, code] of invalid) {
    it(`rejects ${JSON.stringify(input.length > 60 ? `${input.slice(0, 60)}…` : input)} (${code})`, () => {
      expect(codeOf(input)).toBe(code);
    });
  }
});
