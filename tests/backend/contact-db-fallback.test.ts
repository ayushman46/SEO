import { beforeEach, describe, expect, it, vi } from "vitest";

/** Fake postgres.js tag: records every query; columns from 0002 fail like a pre-0002 database. */
const calls: { text: string; values: unknown[] }[] = [];
let has0002 = false;
let otherFailure: string | null = null;

vi.mock("@/lib/db/index", () => {
  const sql = Object.assign(
    async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const text = strings.join("?");
      calls.push({ text, values });
      if (otherFailure) throw Object.assign(new Error("other failure"), { code: otherFailure });
      if (!has0002 && text.includes("quote_valid")) {
        throw Object.assign(new Error('column "quote" does not exist'), { code: "42703" });
      }
      return [{ id: "00000000-0000-4000-8000-000000000001" }];
    },
    { json: (v: unknown) => v },
  );
  return { getDb: () => sql, isDbConfigured: () => true };
});

import { insertContact, messageWithAttachment, type StoredQuote } from "@/lib/db/contact";

const quote: StoredQuote = {
  version: 1,
  currency: "USD",
  items: [],
  catalogTotal: 149,
  submittedTotal: 149,
  valid: true,
  fixed: true,
  malformed: false,
};

const base = {
  name: "Ada",
  email: "ada@example.com",
  company: undefined,
  website: undefined,
  service: "ai-crawler-unblock" as const,
  budget: undefined,
  message: "Please fix the crawler block.",
  consent: true as const,
  ipHash: null,
};

describe("R3 L5: quote submissions are stored without migration 0002", () => {
  beforeEach(() => {
    calls.length = 0;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("retries the 0001 insert with the quote in the message", async () => {
    has0002 = false;
    const id = await insertContact({ ...base, quote, attachmentText: "Quote (USD): $149 ... FIXED" });
    expect(id).not.toBeNull();
    expect(calls).toHaveLength(2);
    expect(calls[1].text).not.toContain("quote");
    const message = calls[1].values.find((v) => typeof v === "string" && v.startsWith("Please fix")) as string;
    expect(message).toContain("Please fix the crawler block.");
    expect(message).toContain("Quote (USD): $149 ... FIXED");
  });

  it("uses the quote columns when 0002 is applied", async () => {
    has0002 = true;
    await insertContact({ ...base, quote, attachmentText: "x" });
    expect(calls).toHaveLength(1);
    expect(calls[0].text).toContain("quote_valid");
    expect(calls[0].values).toContain(base.message);
  });

  it("rethrows other database errors without a retry", async () => {
    has0002 = false;
    otherFailure = "23514"; // check_violation
    await expect(insertContact({ ...base, quote, attachmentText: "x" })).rejects.toThrow("other failure");
    expect(calls).toHaveLength(1);
    otherFailure = null;
  });

  it("keeps the message within the 4000-character column limit", () => {
    const long = messageWithAttachment("m".repeat(3990), "q".repeat(500));
    expect(Array.from(long).length).toBeLessThanOrEqual(4000);
    expect(messageWithAttachment("hello", "")).toBe("hello");
  });
});
