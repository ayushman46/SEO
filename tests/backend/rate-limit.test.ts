import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit, resetMemoryRateLimit } from "@/lib/security/rate-limit";

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
