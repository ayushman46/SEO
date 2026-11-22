import { describe, expect, it } from "vitest";
import { contactSchema, isHoneypotTripped, parseContactForm } from "@/app/actions/contact-schema";

function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const valid = {
  name: "  Ada Lovelace ",
  email: " Ada@Example.COM ",
  company: "",
  website: "example.com/about",
  service: "geo-audit",
  budget: "",
  message: "We'd like an AI visibility review of our docs site.",
  consent: "on",
  company_website: "",
};

describe("contact schema", () => {
  it("accepts a valid submission and normalizes it", () => {
    const r = parseContactForm(form(valid));
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      company: undefined,
      website: "https://example.com/about",
      service: "geo-audit",
      budget: undefined,
      message: "We'd like an AI visibility review of our docs site.",
      consent: true,
    });
  });

  it("reports field errors", () => {
    const r = parseContactForm(
      form({ ...valid, name: "A", email: "nope", service: "seo", message: "short", website: "javascript:alert(1)", budget: "lots" }),
    );
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(Object.keys(r.fieldErrors).sort()).toEqual(["budget", "email", "message", "name", "service", "website"]);
  });

  it("requires consent", () => {
    const fd = form(valid);
    fd.delete("consent");
    const r = parseContactForm(fd);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.fieldErrors.consent).toBeDefined();
  });

  it("enforces maximum lengths", () => {
    expect(contactSchema.safeParse({ ...valid, consent: true, name: "x".repeat(101) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, consent: true, company: "x".repeat(121) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, consent: true, message: "x".repeat(4001) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, consent: true, email: `${"x".repeat(250)}@a.co` }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, consent: true, message: "x".repeat(4000) }).success).toBe(true);
  });

  it("accepts every documented budget and service", () => {
    for (const service of ["seo-audit", "geo-audit", "technical-fixes", "content-entity", "monitoring", "not-sure"]) {
      expect(contactSchema.safeParse({ ...valid, consent: true, service }).success).toBe(true);
    }
    for (const budget of ["under-100", "100-300", "300-1000", "1000-plus", "not-sure"]) {
      expect(contactSchema.safeParse({ ...valid, consent: true, budget }).success).toBe(true);
    }
  });

  it("ignores non-string FormData entries", () => {
    const fd = form(valid);
    fd.set("message", new Blob(["a file"]), "x.txt");
    const r = parseContactForm(fd);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.fieldErrors.message).toBeDefined();
  });

  it("detects the honeypot", () => {
    expect(isHoneypotTripped(form(valid))).toBe(false);
    expect(isHoneypotTripped(form({ ...valid, company_website: "http://spam.example" }))).toBe(true);
  });
});
