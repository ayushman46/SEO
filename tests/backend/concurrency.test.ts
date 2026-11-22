import { describe, expect, it } from "vitest";
import { AUDIT_IN_FLIGHT_LIMITS, InFlightGuard, auditInFlightGuard } from "@/lib/security/concurrency";

describe("InFlightGuard (R2 finding 9: per-instance cap)", () => {
  it("caps concurrent operations per key", () => {
    const g = new InFlightGuard({ maxTotal: 4, maxPerKey: 1 });
    const a = g.tryAcquire("a");
    expect(a.ok).toBe(true);
    expect(g.tryAcquire("a")).toEqual({ ok: false, reason: "key_busy" });
    expect(g.tryAcquire("b").ok).toBe(true);
  });

  it("caps total concurrent operations on the instance", () => {
    const g = new InFlightGuard({ maxTotal: 2, maxPerKey: 1 });
    const one = g.tryAcquire("1");
    expect(g.tryAcquire("2").ok).toBe(true);
    expect(g.tryAcquire("3")).toEqual({ ok: false, reason: "instance_busy" });
    if (one.ok) one.release();
    expect(g.tryAcquire("3").ok).toBe(true);
  });

  it("release is idempotent and frees the key", () => {
    const g = new InFlightGuard({ maxTotal: 2, maxPerKey: 1 });
    const a = g.tryAcquire("a");
    const b = g.tryAcquire("b");
    if (!a.ok || !b.ok) throw new Error("expected slots");
    a.release();
    a.release(); // must not free b's slot
    expect(g.inFlight).toBe(1);
    expect(g.tryAcquire("a").ok).toBe(true);
    expect(g.tryAcquire("c")).toEqual({ ok: false, reason: "instance_busy" });
  });

  it("rejects invalid limits", () => {
    expect(() => new InFlightGuard({ maxTotal: 0, maxPerKey: 1 })).toThrow();
    expect(() => new InFlightGuard({ maxTotal: 1, maxPerKey: 1.5 })).toThrow();
  });

  it("exposes one shared audit guard with the documented limits", () => {
    expect(auditInFlightGuard()).toBe(auditInFlightGuard());
    expect(AUDIT_IN_FLIGHT_LIMITS).toEqual({ maxTotal: 4, maxPerKey: 1 });
  });
});
