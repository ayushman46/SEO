"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { insertContact } from "@/lib/db/contact";
import { notifyTeam } from "@/lib/mailer";
import { rateLimitByIp } from "@/lib/security/rate-limit";
import { getClientIp, hashIp } from "@/lib/security/request";
import {
  CONTACT_FIELDS,
  isHoneypotTripped,
  parseContactForm,
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

/**
 * Contact form server action, for `useActionState(submitContact, null)`.
 * Field names: see CONTACT_FIELDS in ./contact-schema (plus the empty honeypot CONTACT_HONEYPOT_FIELD).
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
  let stored = false;
  try {
    stored = (await insertContact({ ...data, ipHash })) !== null;
  } catch (error) {
    // Best effort (ADR-010): the notification below still carries the full message.
    console.error(`[actions/contact] could not store submission: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  after(() =>
    notifyTeam(
      `New seenhq enquiry: ${data.name} (${data.service})`,
      [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Company: ${data.company ?? "-"}`,
        `Website: ${data.website ?? "-"}`,
        `Service: ${data.service}`,
        `Budget: ${data.budget ?? "-"}`,
        `Stored in database: ${stored ? "yes" : "no"}`,
        "",
        data.message,
      ].join("\n"),
    ),
  );

  return { ok: true, message: SUCCESS_MESSAGE };
}
