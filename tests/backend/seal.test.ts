import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEAL_TTL_MS, seal, unseal } from "@/lib/security/seal";

const SECRET_A = "a".repeat(48);
const SECRET_B = "b".repeat(48);
const payload = { id: "3f1c2b8e-0000-4000-8000-000000000001", scores: { overall: 72 }, notes: ["ünïcødé ✓"] };

describe("seal / unseal", () => {
  beforeEach(() => {
    vi.stubEnv("AUDIT_SEAL_SECRET", SECRET_A);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips data", () => {
    const token = seal(payload);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(unseal(token)).toEqual(payload);
  });

  it("produces a different token each time (random IV)", () => {
    expect(seal(payload)).not.toBe(seal(payload));
  });

  it("rejects a tampered token", () => {
    const token = seal(payload);
    const bytes = Buffer.from(token, "base64url");
    bytes[bytes.length - 1] ^= 0x01; // flip a ciphertext bit
    expect(unseal(bytes.toString("base64url"))).toBeNull();

    const tagTampered = Buffer.from(token, "base64url");
    tagTampered[20] ^= 0xff; // inside the auth tag
    expect(unseal(tagTampered.toString("base64url"))).toBeNull();
  });

  it("rejects garbage and truncated input", () => {
    expect(unseal("")).toBeNull();
    expect(unseal("not a token!")).toBeNull();
    expect(unseal(seal(payload).slice(0, 20))).toBeNull();
  });

  it("rejects a token sealed with another secret", () => {
    const token = seal(payload);
    vi.stubEnv("AUDIT_SEAL_SECRET", SECRET_B);
    expect(unseal(token)).toBeNull();
  });

  it("expires after 2 hours", () => {
    const now = Date.UTC(2026, 10, 22, 12, 0, 0);
    const token = seal(payload, { now });
    expect(unseal(token, { now: now + SEAL_TTL_MS - 1 })).toEqual(payload);
    expect(unseal(token, { now: now + SEAL_TTL_MS + 1 })).toBeNull();
    expect(SEAL_TTL_MS).toBe(2 * 60 * 60 * 1000);
  });

  it("works without a secret using a per-process key", () => {
    vi.stubEnv("AUDIT_SEAL_SECRET", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const token = seal(payload);
    expect(unseal(token)).toEqual(payload);
    warn.mockRestore();
    error.mockRestore();
  });
});
