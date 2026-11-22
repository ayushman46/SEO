import { describe, expect, it } from "vitest";
import { resolvePublicAddress } from "@/lib/audit/net/ssrf";
import { AuditError } from "@/lib/audit/types";

async function code(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "ok";
  } catch (e) {
    expect(e).toBeInstanceOf(AuditError);
    return (e as AuditError).code;
  }
}

describe("resolvePublicAddress (real DNS, offline-safe cases)", () => {
  it("rejects names that resolve to loopback", async () => {
    expect(await code(resolvePublicAddress("localhost"))).toBe("blocked_host");
  });
  it("rejects private IP literals without a lookup", async () => {
    expect(await code(resolvePublicAddress("10.1.2.3"))).toBe("blocked_host");
    expect(await code(resolvePublicAddress("[::1]"))).toBe("blocked_host");
    expect(await code(resolvePublicAddress("169.254.169.254"))).toBe("blocked_host");
  });
  it("passes public IP literals through", async () => {
    expect(await resolvePublicAddress("8.8.8.8")).toEqual({ address: "8.8.8.8", family: 4 });
  });
  it("honours an aborted signal", async () => {
    const ac = new AbortController();
    ac.abort();
    expect(await code(resolvePublicAddress("example.com", ac.signal))).toBe("timeout");
  });
});
