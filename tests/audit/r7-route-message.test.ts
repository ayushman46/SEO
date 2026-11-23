/** R7 #3: POST /api/audit passes the engine's refusal message through for "unreachable". */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runAudit = vi.fn();

vi.mock("@/lib/audit", async () => {
  const { AuditError } = await import("@/lib/audit/types");
  return {
    AuditError,
    normalizeAuditUrl: (u: string) => `https://${u.replace(/^https?:\/\//, "")}/`,
    runAudit: (...args: unknown[]) => runAudit(...args),
    toPartialReport: () => ({ partial: true }),
  };
});
vi.mock("@/lib/security/seal", () => ({ seal: () => "sealed-token" }));

const { POST } = await import("@/app/api/audit/route");
const { resetMemoryRateLimit } = await import("@/lib/security/rate-limit");
const { AuditError } = await import("@/lib/audit/types");
const { SiteRefusedError, detectHomepageRefusal } = await import("@/lib/audit/refusal");

const req = () =>
  new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.77" },
    body: JSON.stringify({ url: "example.com" }),
  });
const errorOf = async (r: Response) => ((await r.json()) as { error: { code: string; message: string } }).error;

describe("POST /api/audit: refusal message", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("IP_HASH_SALT", "test-salt-0123456789");
    resetMemoryRateLimit();
    runAudit.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("passes a SiteRefusedError message through", async () => {
    const refusal = detectHomepageRefusal({ status: 403, headers: { server: "cloudflare" }, text: "<title>Forbidden</title>" })!;
    runAudit.mockRejectedValueOnce(new SiteRefusedError(refusal));
    const res = await POST(req());
    expect(res.status).toBe(422);
    const err = await errorOf(res);
    expect(err.code).toBe("unreachable");
    expect(err.message).toBe(
      "This site refused our crawler (HTTP 403, looks like Cloudflare). We can't audit it from outside. If it is your site, allow the user agent seenhqbot or try again later.",
    );
  });

  it("other unreachable errors keep the generic copy", async () => {
    runAudit.mockRejectedValueOnce(new AuditError("unreachable", "internal detail: ECONNRESET"));
    const err = await errorOf(await POST(req()));
    expect(err.code).toBe("unreachable");
    expect(err.message).not.toContain("ECONNRESET");
    expect(err.message).toContain("seenhqbot");
  });
});
