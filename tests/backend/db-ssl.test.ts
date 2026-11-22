import { describe, expect, it } from "vitest";
import { sslOptionFor, sslOptionsFor, urlSetsTls } from "@/lib/db/ssl";

const noEnv = {};

describe("DB TLS option (R2 findings 10 + 21)", () => {
  it("lets the URL's sslmode decide (no explicit ssl option)", () => {
    for (const url of [
      "postgres://u:p@ep-x.neon.tech/app?sslmode=verify-full",
      "postgres://u:p@ep-x.neon.tech/app?sslmode=require",
      "postgres://u:p@db:5432/app?sslmode=disable",
      "postgres://u:p@aws-0.pooler.supabase.com:6543/postgres?sslrootcert=/ca.crt",
      "postgres://u:p@host/app?ssl=true",
    ]) {
      expect(urlSetsTls(url, noEnv)).toBe(true);
      expect(sslOptionFor(url, noEnv)).toBeUndefined();
      expect(sslOptionsFor(url, noEnv)).toEqual({});
    }
  });

  it("defaults hosted databases to verified TLS, never to unverified 'require'", () => {
    expect(sslOptionFor("postgres://u:p@ep-x.neon.tech/app", noEnv)).toBe("verify-full");
    expect(sslOptionsFor("postgres://u:p@ep-x.neon.tech/app", noEnv)).toEqual({ ssl: "verify-full" });
  });

  it("turns TLS off for localhost without parameters", () => {
    expect(sslOptionFor("postgres://u:p@localhost:5432/app", noEnv)).toBe(false);
    expect(sslOptionFor("postgres://u:p@127.0.0.1/app", noEnv)).toBe(false);
    expect(sslOptionFor("postgres://u:p@[::1]/app", noEnv)).toBe(false);
  });

  it("respects PGSSLMODE", () => {
    expect(sslOptionFor("postgres://u:p@db/app", { PGSSLMODE: "disable" })).toBeUndefined();
  });
});
