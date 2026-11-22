import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientIp, getUserAgent, hashIp } from "@/lib/security/request";
import { isAuthorizedAdmin } from "@/lib/security/admin-auth";

const h = (init: Record<string, string>) => new Headers(init);

describe("getClientIp", () => {
  it("uses the first x-forwarded-for hop", () => {
    expect(getClientIp(h({ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2" }))).toBe("203.0.113.7");
  });
  it("strips ports and IPv6 brackets", () => {
    expect(getClientIp(h({ "x-forwarded-for": "203.0.113.7:51234" }))).toBe("203.0.113.7");
    expect(getClientIp(h({ "x-forwarded-for": "[2001:DB8::1]:443" }))).toBe("2001:db8::1");
    expect(getClientIp(h({ "x-forwarded-for": "2001:db8::1" }))).toBe("2001:db8::1");
  });
  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(getClientIp(h({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(getClientIp(h({ "x-forwarded-for": "not-an-ip", "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(getClientIp(h({}))).toBe("unknown");
    expect(getClientIp(h({ "x-forwarded-for": "<script>" }))).toBe("unknown");
  });
});

describe("hashIp", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is a deterministic, salted sha-256 hex digest", () => {
    vi.stubEnv("IP_HASH_SALT", "salt-one-0123456789");
    const a = hashIp("203.0.113.7");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIp("203.0.113.7")).toBe(a);
    expect(hashIp("203.0.113.8")).not.toBe(a);
    vi.stubEnv("IP_HASH_SALT", "salt-two-0123456789");
    expect(hashIp("203.0.113.7")).not.toBe(a);
  });
});

describe("getUserAgent", () => {
  it("truncates to 256 characters", () => {
    expect(getUserAgent(h({ "user-agent": "x".repeat(400) }))).toHaveLength(256);
    expect(getUserAgent(h({}))).toBeNull();
  });
});

describe("isAuthorizedAdmin", () => {
  const basic = (user: string, pass: string) => `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  const pw = "correct horse battery staple";

  it("accepts the right credentials only", async () => {
    expect(await isAuthorizedAdmin(basic("admin", pw), pw)).toBe(true);
    expect(await isAuthorizedAdmin(basic("admin", `${pw}x`), pw)).toBe(false);
    expect(await isAuthorizedAdmin(basic("root", pw), pw)).toBe(false);
    expect(await isAuthorizedAdmin(null, pw)).toBe(false);
    expect(await isAuthorizedAdmin("Bearer abc", pw)).toBe(false);
    expect(await isAuthorizedAdmin("Basic !!!", pw)).toBe(false);
  });

  it("denies everything when no password is configured", async () => {
    expect(await isAuthorizedAdmin(basic("admin", ""), null)).toBe(false);
  });
});
