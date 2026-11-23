/** R7 #15: optional Bing Webmaster Tools meta-tag verification, inert when unset. */
import { afterEach, describe, expect, it, vi } from "vitest";

async function freshRoot() {
  vi.resetModules();
  return (await import("@/lib/seo/metadata")).rootMetadata;
}

describe("Bing verification meta (R7 #15)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("emits no verification key when BING_SITE_VERIFICATION is unset or blank", async () => {
    vi.stubEnv("BING_SITE_VERIFICATION", "");
    expect((await freshRoot()).verification).toBeUndefined();
    vi.stubEnv("BING_SITE_VERIFICATION", "   ");
    expect((await freshRoot()).verification).toBeUndefined();
  });

  it("emits msvalidate.01 when the token is set", async () => {
    vi.stubEnv("BING_SITE_VERIFICATION", " ABC123TOKEN ");
    expect((await freshRoot()).verification).toEqual({ other: { "msvalidate.01": "ABC123TOKEN" } });
  });
});
