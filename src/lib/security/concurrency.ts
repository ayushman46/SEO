import "server-only";

/**
 * Per-instance in-flight guard. Caps how many expensive operations (audits) ONE server instance
 * runs at the same time, in total and per client key.
 *
 * Scope, stated plainly (ADR-013): this protects each instance's CPU, memory and outbound
 * connections from being flooded. It does NOT limit totals across instances; Vercel can start more
 * instances under load, so the platform-wide ceiling is `maxTotal x instances`. Use it alongside
 * the rate limiter, never instead of it.
 */

export interface InFlightLimits {
  /** max concurrent operations on this instance */
  maxTotal: number;
  /** max concurrent operations per key (e.g. per client IP hash) on this instance */
  maxPerKey: number;
}

export type Release = () => void;

export type AcquireResult = { ok: true; release: Release } | { ok: false; reason: "instance_busy" | "key_busy" };

export class InFlightGuard {
  private total = 0;
  private readonly perKey = new Map<string, number>();

  constructor(private readonly limits: InFlightLimits) {
    if (
      !Number.isInteger(limits.maxTotal) ||
      limits.maxTotal < 1 ||
      !Number.isInteger(limits.maxPerKey) ||
      limits.maxPerKey < 1
    ) {
      throw new Error("InFlightGuard: limits must be positive integers");
    }
  }

  /** Synchronous check-and-take, so concurrent requests on one instance cannot both pass. */
  tryAcquire(key: string): AcquireResult {
    const forKey = this.perKey.get(key) ?? 0;
    if (forKey >= this.limits.maxPerKey) return { ok: false, reason: "key_busy" };
    if (this.total >= this.limits.maxTotal) return { ok: false, reason: "instance_busy" };

    this.total += 1;
    this.perKey.set(key, forKey + 1);
    let released = false;
    return {
      ok: true,
      release: () => {
        if (released) return; // idempotent: a double release must not free someone else's slot
        released = true;
        this.total -= 1;
        const left = (this.perKey.get(key) ?? 1) - 1;
        if (left <= 0) this.perKey.delete(key);
        else this.perKey.set(key, left);
      },
    };
  }

  get inFlight(): number {
    return this.total;
  }
}

/**
 * The /api/audit guard. An audit holds sockets, up to 2 MB per page and synchronous parse time
 * for up to ~55 s, so a single instance runs at most 4 at once and at most 1 per client.
 */
export const AUDIT_IN_FLIGHT_LIMITS: InFlightLimits = { maxTotal: 4, maxPerKey: 1 };

const globalForGuards = globalThis as typeof globalThis & { __seenhqAuditGuard?: InFlightGuard };

/** Shared per-instance guard for /api/audit (cached on globalThis so dev reloads keep one copy). */
export function auditInFlightGuard(): InFlightGuard {
  globalForGuards.__seenhqAuditGuard ??= new InFlightGuard(AUDIT_IN_FLIGHT_LIMITS);
  return globalForGuards.__seenhqAuditGuard;
}
