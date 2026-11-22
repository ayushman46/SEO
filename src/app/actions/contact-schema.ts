import { z } from "zod";
import { MAX_ORDER_ITEMS, QUOTE_CURRENCIES, type QuoteCurrency } from "@/lib/quote/catalog";

/**
 * Contact form schema + state types. Shared by the server action (src/app/actions/contact.ts),
 * the DB repo, tests, and the frontend form (field names / option slugs / state shape).
 * No "use server" here: a server-action module may only export async functions.
 */

/**
 * THE list of contact-form service slugs (single source of truth for validation and types).
 * Adding a service = one line here, plus its label in src/content/contact.ts contactServiceOptions
 * (tests/backend/contact-schema.test.ts fails if the two drift). The DB only checks the slug shape
 * (lowercase, hyphenated, <= 64 chars), so no migration is needed.
 */
export const CONTACT_SERVICES = [
  "seo-audit",
  "geo-audit",
  "technical-fixes",
  "content-entity",
  "monitoring",
  "ai-fact-check",
  "local-ai-setup",
  "ai-crawler-unblock",
  "not-sure",
] as const;
export type ContactService = (typeof CONTACT_SERVICES)[number];

export const CONTACT_BUDGETS = ["under-100", "100-300", "300-1000", "1000-plus", "not-sure"] as const;
export type ContactBudget = (typeof CONTACT_BUDGETS)[number];

/** Form field names the server action reads. CONTACT_HONEYPOT_FIELD is the honeypot (must stay empty). */
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
/** Honeypot field name. Deliberately meaningless so browser autofill never fills it for real users. */
export const CONTACT_HONEYPOT_FIELD = "hp_field_x7";

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

/* ------------------------------------------------------------------ */
/* Optional quote / audit attachment (T019). Additive: the form works   */
/* exactly as before without these fields. They are hidden inputs the   */
/* user cannot correct, so a malformed attachment is dropped (and       */
/* flagged to the team) instead of blocking the message.                */
/* ------------------------------------------------------------------ */

/** Optional hidden fields carrying an instant quote and the audit it came from. */
export const CONTACT_QUOTE_FIELDS = [
  "quote_currency",
  "quote_total",
  "quote_fixed",
  "quote_items",
  "audit_id",
  "audit_url",
] as const;
export type ContactQuoteField = (typeof CONTACT_QUOTE_FIELDS)[number];

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Control characters (Cc) and line/paragraph separators (Zl, Zp) are rejected.
const NO_CONTROL_CHARS = /^[^\p{Cc}\p{Zl}\p{Zp}]*$/u;
const MAX_QUOTE_ITEMS_JSON = 8_000;
const MAX_PRICE = 10_000_000;

export const orderItemSchema = z.strictObject({
  serviceSlug: z.string().max(64).regex(SLUG_RE),
  label: z.string().trim().min(1).max(120).regex(NO_CONTROL_CHARS),
  price: z.number().finite().min(0).max(MAX_PRICE).nullable(),
  from: z.boolean(),
});
export type OrderItemInput = z.output<typeof orderItemSchema>;

const quoteItemsSchema = z
  .string()
  .max(MAX_QUOTE_ITEMS_JSON)
  .transform((value, ctx) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "quote_items is not JSON" });
      return z.NEVER;
    }
  })
  .pipe(z.array(orderItemSchema).min(1).max(MAX_ORDER_ITEMS));

const quoteSchema = z.strictObject({
  quote_currency: z.enum(QUOTE_CURRENCIES),
  quote_total: z
    .string()
    .trim()
    .regex(/^\d{1,9}(\.\d{1,2})?$/)
    .transform(Number)
    .pipe(z.number().min(0).max(MAX_PRICE)),
  quote_fixed: z.enum(["true", "false"]).transform((v) => v === "true"),
  quote_items: quoteItemsSchema,
});

const auditIdSchema = z.uuid();
const auditUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .transform((value, ctx) => {
    try {
      // new URL() silently drops tabs/newlines; returning its serialization keeps them out of
      // the notification email and the database.
      const u = new URL(value);
      const href = u.toString();
      if ((u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".") && href.length <= 2048) {
        return href;
      }
    } catch {
      // fall through
    }
    ctx.addIssue({ code: "custom", message: "invalid audit_url" });
    return z.NEVER;
  });

export interface ContactQuoteInput {
  currency: QuoteCurrency;
  /** client-computed; the server compares it with the catalog and never stores it as truth */
  total: number;
  fixed: boolean;
  items: OrderItemInput[];
}

export interface ContactAttachment {
  /** null when no quote was attached or it was malformed */
  quote: ContactQuoteInput | null;
  /** true when quote fields were present but could not be read (dropped, flagged to the team) */
  quoteMalformed: boolean;
  auditId: string | null;
  auditUrl: string | null;
}

/** Reads the optional quote/audit fields. Never fails: bad values become null. */
export function parseContactAttachment(formData: FormData): ContactAttachment {
  const raw: Partial<Record<ContactQuoteField, string>> = {};
  for (const field of CONTACT_QUOTE_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string" && value.trim() !== "") raw[field] = value;
  }

  const quoteKeys = ["quote_currency", "quote_total", "quote_fixed", "quote_items"] as const;
  const anyQuote = quoteKeys.some((k) => raw[k] !== undefined);
  let quote: ContactQuoteInput | null = null;
  let quoteMalformed = false;
  if (anyQuote) {
    const parsed = quoteSchema.safeParse({
      quote_currency: raw.quote_currency,
      quote_total: raw.quote_total,
      quote_fixed: raw.quote_fixed,
      quote_items: raw.quote_items,
    });
    if (parsed.success) {
      quote = {
        currency: parsed.data.quote_currency,
        total: parsed.data.quote_total,
        fixed: parsed.data.quote_fixed,
        items: parsed.data.quote_items,
      };
    } else {
      quoteMalformed = true;
    }
  }

  const auditId = auditIdSchema.safeParse(raw.audit_id?.trim());
  const auditUrl = auditUrlSchema.safeParse(raw.audit_url);
  return {
    quote,
    quoteMalformed,
    auditId: auditId.success ? auditId.data.toLowerCase() : null,
    auditUrl: auditUrl.success ? auditUrl.data : null,
  };
}

/** True when the hidden honeypot field was filled in (i.e. almost certainly a bot). */
export function isHoneypotTripped(formData: FormData): boolean {
  const value = formData.get(CONTACT_HONEYPOT_FIELD);
  return typeof value === "string" ? value.trim() !== "" : value !== null;
}
