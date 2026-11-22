import { afterEach, describe, expect, it, vi } from "vitest";

async function cspFor(env: Record<string, string>): Promise<string> {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const config = (await import("../../next.config")).default;
  const rules = await config.headers!();
  const csp = rules[0]?.headers.find((h) => h.key === "Content-Security-Policy")?.value;
  if (!csp) throw new Error("no CSP");
  return csp;
}

describe("CSP on Vercel preview deployments (R2 finding 19)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows the Vercel Toolbar only on preview", async () => {
    const preview = await cspFor({ NODE_ENV: "production", VERCEL_ENV: "preview" });
    expect(preview).toContain("frame-src https://vercel.live");
    expect(preview).toMatch(/script-src [^;]*https:\/\/vercel\.live/);
    expect(preview).toMatch(/connect-src [^;]*wss:\/\/ws-us3\.pusher\.com/);
  });

  it("keeps the production policy free of vercel.live", async () => {
    const prod = await cspFor({ NODE_ENV: "production", VERCEL_ENV: "production" });
    expect(prod).not.toContain("vercel.live");
    expect(prod).not.toContain("pusher");
    expect(prod).not.toContain("frame-src");
    expect(prod).toContain("upgrade-insecure-requests");
  });
});
