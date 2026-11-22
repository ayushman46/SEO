import { z } from "zod";

/**
 * Contact form schema + state types. Shared by the server action (src/app/actions/contact.ts),
 * the DB repo, tests, and the frontend form (field names / option slugs / state shape).
 * No "use server" here: a server-action module may only export async functions.
 */

export const CONTACT_SERVICES = [
  "seo-audit",
  "geo-audit",
  "technical-fixes",
  "content-entity",
  "monitoring",
  "not-sure",
] as const;
export type ContactService = (typeof CONTACT_SERVICES)[number];

export const CONTACT_BUDGETS = ["under-100", "100-300", "300-1000", "1000-plus", "not-sure"] as const;
export type ContactBudget = (typeof CONTACT_BUDGETS)[number];

/** Form field names the server action reads. `company_website` is the honeypot (must stay empty). */
export const CONTACT_FIELDS = [
  "name",
  "email",
  "company",
  "website",
  "service",
  "budget",
  "message",
  "consent",
] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];
export const CONTACT_HONEYPOT_FIELD = "company_website";

const emptyToUndefined = (v: unknown): unknown =>
  v === null || (typeof v === "string" && v.trim() === "") ? undefined : v;

/** Accepts "example.com" or a full http(s) URL; returns a normalized absolute URL. */
const websiteSchema = z
  .string()
  .trim()
  .max(2048, "Website URL is too long.")
  .transform((value, ctx) => {
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(candidate);
      if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname.includes(".")) {
        throw new Error("bad url");
      }
      const normalized = url.toString();
      if (normalized.length > 2048) throw new Error("too long");
      return normalized;
    } catch {
      ctx.addIssue({ code: "custom", message: "Enter a valid website, e.g. example.com." });
      return z.NEVER;
    }
  });

export const contactSchema = z.object({
  name: z
    .string({ error: "Please enter your name." })
    .trim()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(100, "Name must be 100 characters or fewer."),
  email: z
    .string({ error: "Please enter your email." })
    .trim()
    .toLowerCase()
    .max(254, "Email is too long.")
    .pipe(z.email("Enter a valid email address.")),
  company: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120, "Company must be 120 characters or fewer.").optional(),
  ),
  website: z.preprocess(emptyToUndefined, websiteSchema.optional()),
  service: z.enum(CONTACT_SERVICES, { error: "Choose what you need help with." }),
  budget: z.preprocess(emptyToUndefined, z.enum(CONTACT_BUDGETS, { error: "Choose a budget range." }).optional()),
  message: z
    .string({ error: "Please write a short message." })
    .trim()
    .min(10, "Please tell us a bit more (at least 10 characters).")
    .max(4000, "Message must be 4000 characters or fewer."),
  consent: z.preprocess(
    (v) => v === true || v === "on" || v === "true" || v === "1",
    z.literal(true, { error: "Please agree so we can reply to you." }),
  ),
});

export type ContactInput = z.output<typeof contactSchema>;

export type ContactFieldErrors = Partial<Record<ContactField, string[]>>;

export type ContactFormState =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors: ContactFieldErrors;
      /** submitted values (minus honeypot/consent) so the form can be re-filled after an error */
      values: Partial<Record<Exclude<ContactField, "consent">, string>>;
    };

/** Pass as the initial state to useActionState, or use `null`. */
export const initialContactState: ContactFormState | null = null;

export type ContactParseResult =
  | { success: true; data: ContactInput }
  | { success: false; fieldErrors: ContactFieldErrors };

/** Reads only string values from FormData (File entries are ignored) and validates them. */
export function parseContactForm(formData: FormData): ContactParseResult {
  const raw: Record<string, string | undefined> = {};
  for (const field of CONTACT_FIELDS) {
    const value = formData.get(field);
    raw[field] = typeof value === "string" ? value : undefined;
  }
  const parsed = contactSchema.safeParse(raw);
  if (parsed.success) return { success: true, data: parsed.data };

  const fieldErrors: ContactFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && (CONTACT_FIELDS as readonly string[]).includes(key)) {
      const field = key as ContactField;
      (fieldErrors[field] ??= []).push(issue.message);
    }
  }
  return { success: false, fieldErrors };
}

/** True when the hidden honeypot field was filled in (i.e. almost certainly a bot). */
export function isHoneypotTripped(formData: FormData): boolean {
  const value = formData.get(CONTACT_HONEYPOT_FIELD);
  return typeof value === "string" ? value.trim() !== "" : value !== null;
}
