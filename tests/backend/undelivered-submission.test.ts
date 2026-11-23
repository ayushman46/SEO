import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

/** R7 finding 1: a submission that was neither stored nor emailed must show up as a production error. */

const insertContact = vi.fn<() => Promise<string | null>>();
const pendingAfter: (() => unknown)[] = [];

vi.mock("@/lib/db/contact", () => ({ insertContact: () => insertContact() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }) }));
vi.mock("next/server", () => ({ after: (fn: () => unknown) => void pendingAfter.push(fn) }));

import { submitContact } from "@/app/actions/contact";
import { notifyTeam, reportUndeliveredSubmission } from "@/lib/mailer";
import { resetMemoryRateLimit } from "@/lib/security/rate-limit";

const SINK_VARS = ["DATABASE_URL", "RESEND_API_KEY", "CONTACT_NOTIFY_EMAIL", "MAIL_FROM"] as const;
const SECRET_KEY = "re_secret_value_never_logged";

function form(): FormData {
  const fd = new FormData();
  const values: Record<string, string> = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    service: "technical-fixes",
    message: "Please run the Fix sprint on our site.",
    consent: "on",
  };
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

async function runAfter(): Promise<void> {
  while (pendingAfter.length) await pendingAfter.shift()!();
}

let errors: MockInstance<typeof console.error>;

beforeEach(() => {
  for (const k of SINK_VARS) vi.stubEnv(k, "");
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  errors = vi.spyOn(console, "error").mockImplementation(() => {});
  insertContact.mockReset();
  pendingAfter.length = 0;
  resetMemoryRateLimit();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const errorText = () => errors.mock.calls.map((c) => String(c[0])).join("\n");

describe("reportUndeliveredSubmission", () => {
  it("logs one error naming the missing variables in production when nothing stored or emailed", () => {
    vi.stubEnv("NODE_ENV", "production");
    reportUndeliveredSubmission("actions/contact", "order request", { stored: false, emailed: false });
    expect(errors).toHaveBeenCalledOnce();
    const msg = errorText();
    expect(msg).toContain("[actions/contact] UNDELIVERED order request");
    expect(msg).toContain("not set: DATABASE_URL, RESEND_API_KEY, CONTACT_NOTIFY_EMAIL");
    expect(msg).toContain("npm run db:migrate");
  });

  it("is silent when one sink worked, and outside production", () => {
    vi.stubEnv("NODE_ENV", "production");
    reportUndeliveredSubmission("x", "lead", { stored: true, emailed: false });
    reportUndeliveredSubmission("x", "lead", { stored: false, emailed: true });
    vi.stubEnv("NODE_ENV", "development");
    reportUndeliveredSubmission("x", "lead", { stored: false, emailed: false });
    expect(errors).not.toHaveBeenCalled();
  });

  it("names a failed send (not a missing variable) when Resend is configured, and never logs values", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", SECRET_KEY);
    vi.stubEnv("CONTACT_NOTIFY_EMAIL", "team@example.com");
    reportUndeliveredSubmission("api/audit/unlock", "lead", { stored: false, emailed: false });
    const msg = errorText();
    expect(msg).toContain("not set: DATABASE_URL");
    expect(msg).toContain("the email send failed");
    expect(msg).not.toContain(SECRET_KEY);
    expect(msg).not.toContain("team@example.com");
  });
});

describe("notifyTeam reports whether the email was delivered", () => {
  it("false without a recipient (console only)", async () => {
    await expect(notifyTeam("s", "t")).resolves.toBe(false);
  });

  it("true when Resend accepts it, false when it fails", async () => {
    vi.stubEnv("RESEND_API_KEY", SECRET_KEY);
    vi.stubEnv("CONTACT_NOTIFY_EMAIL", "team@example.com");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    await expect(notifyTeam("s", "t")).resolves.toBe(true);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 403 })));
    await expect(notifyTeam("s", "t")).resolves.toBe(false);
  });
});

describe("submitContact with no sink configured", () => {
  it("still tells the visitor ok, and logs one production error after the response", async () => {
    vi.stubEnv("NODE_ENV", "production");
    insertContact.mockResolvedValue(null);
    const state = await submitContact(null, form());
    expect(state.ok).toBe(true);
    await runAfter();
    const undelivered = errors.mock.calls.filter((c) => String(c[0]).includes("UNDELIVERED"));
    expect(undelivered).toHaveLength(1);
    expect(String(undelivered[0][0])).toContain("[actions/contact] UNDELIVERED enquiry");
    expect(String(undelivered[0][0])).toContain("DATABASE_URL");
  });

  it("logs nothing when the message was stored", async () => {
    vi.stubEnv("NODE_ENV", "production");
    insertContact.mockResolvedValue("00000000-0000-4000-8000-000000000001");
    const state = await submitContact(null, form());
    expect(state.ok).toBe(true);
    await runAfter();
    expect(errorText()).not.toContain("UNDELIVERED");
  });
});
