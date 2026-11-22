"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { insertContact, type StoredQuote } from "@/lib/db/contact";
import { notifyTeam } from "@/lib/mailer";
import { formatPrice } from "@/lib/quote/catalog";
import { verifyOrder } from "@/lib/quote/verify";
import { rateLimitByIp } from "@/lib/security/rate-limit";
import { getClientIp, hashIp } from "@/lib/security/request";
import {
  CONTACT_FIELDS,
  isHoneypotTripped,
  parseContactAttachment,
  parseContactForm,
  type ContactAttachment,
  type ContactField,
  type ContactFormState,
} from "./contact-schema";

const RATE_LIMIT = { limit: 5, windowSec: 60 * 60 } as const;
const SUCCESS_MESSAGE = "Thanks — your message is on its way. We'll get back to you soon.";

function echoValues(formData: FormData): Extract<ContactFormState, { ok: false }>["values"] {
  const values: Partial<Record<Exclude<ContactField, "consent">, string>> = {};
  for (const field of CONTACT_FIELDS) {
    if (field === "consent") continue;
    const v = formData.get(field);
    if (typeof v === "string") values[field] = v.slice(0, 4000);
  }
  return values;
}

/** Re-checks an attached quote against the catalog. Client prices are compared, never trusted. */
function toStoredQuote(attachment: ContactAttachment): StoredQuote | null {
  if (attachment.quote) {
    const v = verifyOrder({
      currency: attachment.quote.currency,
      items: attachment.quote.items,
      submittedTotal: attachment.quote.total,
      submittedFixed: attachment.quote.fixed,
    });
    return {
      version: 1,
      currency: v.currency,
      items: v.items,
      catalogTotal: v.catalogTotal,
      submittedTotal: v.submittedTotal,
      valid: v.valid,
      fixed: v.fixed,
      malformed: false,
    };
  }
  if (attachment.quoteMalformed) {
    return {
      version: 1,
      currency: null,
      items: [],
      catalogTotal: 0,
      submittedTotal: null,
      valid: false,
      fixed: false,
      malformed: true,
    };
  }
  return null;
}

/** Plain-text quote block for the team notification. */
function quoteLines(quote: StoredQuote | null, attachment: ContactAttachment): string[] {
  const lines: string[] = [];
  if (attachment.auditId || attachment.auditUrl) {
    lines.push(`Audit: ${attachment.auditUrl ?? "-"} (id ${attachment.auditId ?? "-"})`);
  }
  if (!quote) return lines;
  if (quote.malformed || quote.currency === null) {
    lines.push("Quote: attached but unreadable, dropped. Ask the client what they want.");
    return lines;
  }
  const currency = quote.currency;
  const money = (n: number | null): string => (n === null ? "by email" : formatPrice(n, currency));
  lines.push(
    `Quote (${currency}): ${quote.fixed ? "" : "from "}${money(quote.catalogTotal)} at catalog prices, excl. taxes, ` +
      `${quote.fixed ? "FIXED" : "NOT fixed: confirm within 1 business day"}`,
  );
  lines.push(
    quote.valid
      ? "Quote check: every item matches the catalog."
      : `Quote check: MISMATCH. Client total ${money(quote.submittedTotal)}; use catalog prices, not the client's.`,
  );
  for (const item of quote.items) {
    const status = item.valid ? "ok" : `INVALID (${item.problem ?? "unknown"})`;
    lines.push(
      `  - ${item.label} [${item.serviceSlug}] ${item.submittedFrom ? "from " : ""}${money(item.submittedPrice)}` +
        (item.valid ? "" : `; catalog ${item.catalogPrice === null ? "-" : money(item.catalogPrice)}`) +
        ` (${status})` +
        (item.submittedLabel ? `; client label was: "${item.submittedLabel}"` : ""),
    );
  }
  return lines;
}

/**
 * Contact form server action, for `useActionState(submitContact, null)`.
 * Field names: see CONTACT_FIELDS in ./contact-schema (plus the empty honeypot CONTACT_HONEYPOT_FIELD),
 * and the optional hidden quote/audit fields CONTACT_QUOTE_FIELDS (T019).
 */
export async function submitContact(
  _prevState: ContactFormState | null,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot: pretend success so bots learn nothing; store and send nothing.
  if (isHoneypotTripped(formData)) return { ok: true, message: SUCCESS_MESSAGE };

  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
      values: echoValues(formData),
    };
  }

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const ipHash = hashIp(ip);
  const limited = await rateLimitByIp("contact", ip, RATE_LIMIT);
  if (!limited.ok) {
    const minutes = Math.max(1, Math.ceil(limited.retryAfter / 60));
    return {
      ok: false,
      message: `Too many messages from your network. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      fieldErrors: {},
      values: echoValues(formData),
    };
  }

  const data = parsed.data;
  const attachment = parseContactAttachment(formData);
  const quote = toStoredQuote(attachment);
  let stored = false;
  try {
    stored =
      (await insertContact({
        ...data,
        ipHash,
        quote,
        auditId: attachment.auditId,
        auditUrl: attachment.auditUrl,
        attachmentText: quoteLines(quote, attachment).join("\n"),
      })) !== null;
  } catch (error) {
    // Best effort (ADR-010): the notification below still carries the full message.
    console.error(`[actions/contact] could not store submission: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  after(() =>
    notifyTeam(
      `New seenhq ${quote && !quote.malformed ? "order request" : "enquiry"}: ${data.name} (${data.service})`,
      [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Company: ${data.company ?? "-"}`,
        `Website: ${data.website ?? "-"}`,
        `Service: ${data.service}`,
        `Budget: ${data.budget ?? "-"}`,
        `Stored in database: ${stored ? "yes" : "no"}`,
        ...quoteLines(quote, attachment),
        "",
        data.message,
      ].join("\n"),
    ),
  );

  return { ok: true, message: SUCCESS_MESSAGE };
}
