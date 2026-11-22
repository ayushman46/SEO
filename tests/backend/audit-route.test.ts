import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runAudit = vi.fn();

vi.mock("@/lib/audit", () => {
  class AuditError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message);
      this.name = "AuditError";
    }
  }
  return {
    AuditError,
    normalizeAuditUrl: (u: string) => `https://${u.replace(/^https?:\/\//, "")}/`,
    runAudit: (...args: unknown[]) => runAudit(...args),
    toPartialReport: () => ({ partial: true }),
  };
});
vi.mock("@/lib/security/seal", () => ({ seal: () => "sealed-token" }));

import { POST } from "@/app/api/audit/route";
import { resetMemoryRateLimit } from "@/lib/security/rate-limit";

function req(ip: string | null): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (ip) headers["x-forwarded-for"] = ip;
  return new Request("http://localhost/api/audit", {
    method: "POST",
    headers,
    body: JSON.stringify({ url: "example.com" }),
  });
}

function deferred(): { promise: Promise<unknown>; resolve: (v: unknown) => void } {
  let resolve!: (v: unknown) => void;
  const promise = new Promise<unknown>((r) => (resolve = r));
  return { promise, resolve };
}

describe("POST /api/audit guards (R2 findings 9 + 20)", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("IP_HASH_SALT", "test-salt-0123456789");
    resetMemoryRateLimit();
    runAudit.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows one in-flight audit per client per instance and frees the slot afterwards", async () => {
    const d = deferred();
    runAudit.mockReturnValueOnce(d.promise);
    const first = POST(req("203.0.113.10"));
    await vi.waitFor(() => expect(runAudit).toHaveBeenCalledTimes(1));

    const second = await POST(req("203.0.113.10"));
    expect(second.status).toBe(503);
    expect(((await second.json()) as { error: { code: string } }).error.code).toBe("server_busy");
    expect(second.headers.get("retry-after")).toBe("30");

    d.resolve({ id: "x" });
    expect((await first).status).toBe(200);

    runAudit.mockResolvedValueOnce({ id: "y" });
    expect((await POST(req("203.0.113.10"))).status).toBe(200);
  });

  it("caps total in-flight audits on one instance", async () => {
    const pending = Array.from({ length: 4 }, () => deferred());
    for (const p of pending) runAudit.mockReturnValueOnce(p.promise);
    const running = pending.map((_, i) => POST(req(`198.51.100.${i + 1}`)));
    await vi.waitFor(() => expect(runAudit).toHaveBeenCalledTimes(4));

    const fifth = await POST(req("198.51.100.99"));
    expect(fifth.status).toBe(503);
    expect(runAudit).toHaveBeenCalledTimes(4);

    for (const p of pending) p.resolve({ id: "z" });
    await Promise.all(running);
  });

  it("releases the slot when the audit throws, and still applies the hourly limit", async () => {
    runAudit.mockRejectedValueOnce(new Error("boom"));
    expect((await POST(req("192.0.2.1"))).status).toBe(500);
    runAudit.mockResolvedValue({ id: "ok" });
    // 4 more succeed (5/h limit incl. the failed one), then 429
    for (let i = 0; i < 4; i++) expect((await POST(req("192.0.2.1"))).status).toBe(200);
    expect((await POST(req("192.0.2.1"))).status).toBe(429);
  });

  it("counts the time before the crawl against the 50 s request budget", async () => {
    runAudit.mockResolvedValueOnce({ id: "b" });
    await POST(req("192.0.2.50"));
    const opts = runAudit.mock.calls[0]?.[1] as { budgetMs: number; signal: AbortSignal };
    expect(opts.budgetMs).toBeLessThanOrEqual(50_000);
    expect(opts.budgetMs).toBeGreaterThan(40_000);
    expect(opts.signal).toBeInstanceOf(AbortSignal);
  });
});
