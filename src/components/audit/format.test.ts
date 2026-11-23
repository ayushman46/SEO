import { describe, expect, it } from "vitest";
import { auditEmailGate, auditErrors } from "@/content/audit";
import type { AuditIssue } from "@/lib/audit/types";
import { afterEach, vi } from "vitest";
import { isRetryable, looksLikeEmail, requestAudit, toFlowError } from "./api";
import { displayUrl, formatMetric, groupIssues, rateMetric, safeHref, splitInlineCode } from "./format";

describe("splitInlineCode", () => {
  it("splits backtick spans into code parts", () => {
    expect(splitInlineCode("Add `<title>` to the `<head>`.")).toEqual([
      { code: false, text: "Add " },
      { code: true, text: "<title>" },
      { code: false, text: " to the " },
      { code: true, text: "<head>" },
      { code: false, text: "." },
    ]);
  });
  it("keeps an unmatched backtick as text", () => {
    expect(splitInlineCode("a `b")).toEqual([{ code: false, text: "a `b" }]);
    expect(splitInlineCode("`x` and `y")).toEqual([
      { code: true, text: "x" },
      { code: false, text: " and `y" },
    ]);
  });
  it("handles plain text", () => {
    expect(splitInlineCode("no code")).toEqual([{ code: false, text: "no code" }]);
  });
});

describe("safeHref / displayUrl", () => {
  it("only allows http(s)", () => {
    expect(safeHref("https://a.com/x")).toBe("https://a.com/x");
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("not a url")).toBeNull();
  });
  it("never links to a reserved TLD that cannot resolve (R7 #13)", () => {
    expect(safeHref("https://www.marigold-dental.example/fees/")).toBeNull();
    expect(safeHref("http://site.test/")).toBeNull();
    expect(safeHref("https://a.invalid./x")).toBeNull();
    expect(safeHref("https://example.com/")).toBe("https://example.com/");
    expect(safeHref("https://shop.example.co.uk/")).toBe("https://shop.example.co.uk/");
  });
  it("shortens same-host URLs to their path", () => {
    expect(displayUrl("https://www.a.com/blog?p=1", "a.com")).toBe("/blog?p=1");
    expect(displayUrl("https://b.com/", "a.com")).toBe("b.com");
  });
});

describe("metrics", () => {
  it("rates against CWV thresholds", () => {
    expect(rateMetric("lcp", 2400)).toBe("good");
    expect(rateMetric("lcp", 3000)).toBe("improve");
    expect(rateMetric("cls", 0.3)).toBe("poor");
    expect(rateMetric("inp", null)).toBe("none");
  });
  it("formats", () => {
    expect(formatMetric("lcp", 2430)).toBe("2.4 s");
    expect(formatMetric("cls", 0.051)).toBe("0.05");
    expect(formatMetric("tbt", 1234.4)).toBe("1,234 ms");
    expect(formatMetric("inp", null)).toBe("–");
  });
});

describe("groupIssues", () => {
  const issue = (id: string, category: AuditIssue["category"], severity: AuditIssue["severity"]): AuditIssue => ({
    id,
    checkId: id,
    category,
    severity,
    title: id,
    description: "",
    howToFix: "",
    effort: "quick",
    impact: 1,
    affectedUrls: [],
  });
  it("groups by category then severity", () => {
    const g = groupIssues([issue("a", "geo", "low"), issue("b", "seo", "high"), issue("c", "geo", "critical")]);
    expect(g.map((x) => [x.category, x.count])).toEqual([
      ["seo", 1],
      ["geo", 2],
      ["performance", 0],
    ]);
    expect(g[1].bySeverity.map((s) => s.severity)).toEqual(["critical", "low"]);
  });
});

describe("error mapping", () => {
  it("maps every API code to copy", () => {
    for (const code of ["invalid_url", "blocked_host", "unreachable", "timeout", "not_html", "too_large", "rate_limited", "server_busy", "invalid_or_expired"] as const) {
      expect(toFlowError(code).message).toBe(auditErrors[code]);
    }
    expect(toFlowError("consent_required").message).toBe(auditEmailGate.consentRequired);
    expect(toFlowError("invalid_email").message).toBe(auditEmailGate.invalidEmail);
    expect(toFlowError("internal_error")).toMatchObject({ code: "generic", message: auditErrors.generic });
    expect(toFlowError("payload_too_large").message).toBe(auditErrors.generic);
  });
  it("keeps a valid retryAfter only", () => {
    expect(toFlowError("rate_limited", 120).retryAfter).toBe(120);
    expect(toFlowError("rate_limited", -1).retryAfter).toBeUndefined();
  });
  it("knows what is retryable", () => {
    expect(isRetryable("timeout")).toBe(true);
    expect(isRetryable("blocked_host")).toBe(false);
    expect(isRetryable("server_busy")).toBe(true);
  });
  it("keeps server_busy and its retry time (R7 #8)", () => {
    expect(toFlowError("server_busy", 30)).toMatchObject({ code: "server_busy", message: auditErrors.server_busy, retryAfter: 30 });
  });
  it("checks emails loosely", () => {
    expect(looksLikeEmail("a@b.co")).toBe(true);
    expect(looksLikeEmail("nope")).toBe(false);
  });
});

describe("requestAudit error bodies", () => {
  afterEach(() => vi.unstubAllGlobals());
  const respond = (status: number, body: unknown) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })));

  it("shows the server's specific invalid_url reason (R7 #24)", async () => {
    respond(400, { error: { code: "invalid_url", message: "Only standard web ports (80 and 443) are supported." } });
    const out = await requestAudit("example.com:8443", new AbortController().signal);
    expect(out).toMatchObject({ ok: false, error: { code: "invalid_url", message: "Only standard web ports (80 and 443) are supported." } });
  });

  it("maps a 503 server_busy to its own copy and retry time (R7 #8)", async () => {
    respond(503, { error: { code: "server_busy", message: "An audit from your network is already running.", retryAfter: 30 } });
    const out = await requestAudit("example.com", new AbortController().signal);
    expect(out).toMatchObject({ ok: false, error: { code: "server_busy", message: auditErrors.server_busy, retryAfter: 30 } });
  });
});
