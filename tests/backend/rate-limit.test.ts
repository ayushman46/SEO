import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  UNKNOWN_IP_BUCKET,
  clientKey,
  rateLimit,
  rateLimitByIp,
  resetMemoryRateLimit,
  unknownIpLimit,
} from "@/lib/security/rate-limit";

describe("rateLimit (memory fallback, no DATABASE_URL)", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 22, 10, 0, 0)));
    resetMemoryRateLimit();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("allows up to the limit, then blocks with Retry-After", async () => {
    const opts = { limit: 3, windowSec: 3600 };
    for (let i = 1; i <= 3; i++) {
      const r = await rateLimit("test:a", opts);
      expect(r).toMatchObject({ ok: true, remaining: 3 - i, retryAfter: 0, store: "memory" });
    }
    const blocked = await rateLimit("test:a", opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBe(3600); // window started exactly at 10:00
  });

  it("keeps buckets independent", async () => {
    const opts = { limit: 1, windowSec: 60 };
    expect((await rateLimit("test:b", opts)).ok).toBe(true);
    expect((await rateLimit("test:b", opts)).ok).toBe(false);
    expect((await rateLimit("test:c", opts)).ok).toBe(true);
  });

  it("resets when the window rolls over", async () => {
    const opts = { limit: 1, windowSec: 60 };
    expect((await rateLimit("test:d", opts)).ok).toBe(true);
    vi.advanceTimersByTime(30_000);
    const blocked = await rateLimit("test:d", opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(30);
    vi.advanceTimersByTime(30_000);
    expect((await rateLimit("test:d", opts)).ok).toBe(true);
  });

  it("sweeps expired entries without breaking active ones", async () => {
    const opts = { limit: 2, windowSec: 60 };
    await rateLimit("test:old", opts);
    vi.advanceTimersByTime(5 * 60_000); // past the window and the 1-minute sweep interval
    await rateLimit("test:new", opts);
    expect((await rateLimit("test:new", opts)).remaining).toBe(0);
    expect((await rateLimit("test:old", opts)).remaining).toBe(1); // fresh window after sweep
  });

  it("rejects invalid options", async () => {
    await expect(rateLimit("x", { limit: 0, windowSec: 60 })).rejects.toThrow();
    await expect(rateLimit("x", { limit: 1, windowSec: 0.5 })).rejects.toThrow();
  });
});

describe("rateLimitByIp (R2 finding 9)", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("IP_HASH_SALT", "test-salt-0123456789");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 22, 10, 0, 0)));
    resetMemoryRateLimit();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("puts every request without a usable IP into one shared, stricter bucket", async () => {
    const opts = { limit: 5, windowSec: 3600 };
    expect(unknownIpLimit(5)).toBe(2);
    expect(unknownIpLimit(1)).toBe(1);
    expect(clientKey("unknown")).toBe(UNKNOWN_IP_BUCKET);
    expect(clientKey("not-an-ip")).toBe(UNKNOWN_IP_BUCKET);
    expect((await rateLimitByIp("audit", "unknown", opts)).ok).toBe(true);
    expect((await rateLimitByIp("audit", "garbage", opts)).ok).toBe(true);
    const third = await rateLimitByIp("audit", "unknown", opts);
    expect(third.ok).toBe(false);
    expect(third.limit).toBe(2);
    // a real IP is unaffected
    expect((await rateLimitByIp("audit", "203.0.113.7", opts)).ok).toBe(true);
  });

  it("counts a whole IPv6 /64 as one client", async () => {
    const opts = { limit: 2, windowSec: 3600 };
    expect(clientKey("2001:db8:1:2::1")).toBe(clientKey("2001:db8:1:2:ffff::9"));
    expect(clientKey("2001:db8:1:2::1")).not.toBe(clientKey("2001:db8:1:3::1"));
    expect((await rateLimitByIp("audit", "2001:db8:1:2::1", opts)).ok).toBe(true);
    expect((await rateLimitByIp("audit", "2001:db8:1:2::2", opts)).ok).toBe(true);
    expect((await rateLimitByIp("audit", "2001:db8:1:2::3", opts)).ok).toBe(false);
  });

  it("treats IPv4-mapped IPv6 as the IPv4 address", () => {
    expect(clientKey("::ffff:203.0.113.7")).toBe(clientKey("203.0.113.7"));
  });

  it("keeps scopes independent", async () => {
    const opts = { limit: 1, windowSec: 3600 };
    expect((await rateLimitByIp("audit", "198.51.100.1", opts)).ok).toBe(true);
    expect((await rateLimitByIp("contact", "198.51.100.1", opts)).ok).toBe(true);
    expect((await rateLimitByIp("audit", "198.51.100.1", opts)).ok).toBe(false);
  });

  it("warns once in production that the limiter is per-instance", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await rateLimitByIp("audit", "198.51.100.2", { limit: 5, windowSec: 60 });
    await rateLimitByIp("audit", "198.51.100.2", { limit: 5, windowSec: 60 });
    const msgs = warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes("per server instance"));
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toContain("DATABASE_URL");
  });
});
