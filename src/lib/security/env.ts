import "server-only";
import { z } from "zod";

/**
 * Server-only environment access. Every variable is optional so the app runs with no env at all
 * (memory rate limit, dev seal key, console mailer, audits not persisted).
 *
 * Empty strings (as in .env.example) count as "unset". A variable that is set but invalid is
 * treated as unset and reported once by NAME (never by value).
 */

const optionalString = (schema: z.ZodType<string>) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const fields = {
  NODE_ENV: z.enum(["development", "production", "test"]).catch("development"),
  NEXT_PUBLIC_SITE_URL: optionalString(z.url({ protocol: /^https?$/ })),
  DATABASE_URL: optionalString(z.string().regex(/^postgres(ql)?:\/\//, "must be a postgres:// URL")),
  AUDIT_SEAL_SECRET: optionalString(z.string().min(32, "must be at least 32 characters")),
  IP_HASH_SALT: optionalString(z.string().min(16, "must be at least 16 characters")),
  ADMIN_PASSWORD: optionalString(z.string().min(12, "must be at least 12 characters")),
  PAGESPEED_API_KEY: optionalString(z.string()),
  RESEND_API_KEY: optionalString(z.string()),
  CONTACT_NOTIFY_EMAIL: optionalString(z.email()),
  MAIL_FROM: optionalString(z.string().max(200)),
} as const;

type Fields = typeof fields;
export type ServerEnv = { [K in keyof Fields]: z.output<Fields[K]> };

const warned = new Set<string>();

/** Parses process.env on every call (cheap) so tests and runtime changes are honoured. */
export function getServerEnv(): ServerEnv {
  const out: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(fields) as [keyof Fields, z.ZodType][]) {
    const parsed = schema.safeParse(process.env[key]);
    if (parsed.success) {
      out[key] = parsed.data;
    } else {
      out[key] = undefined;
      if (!warned.has(key)) {
        warned.add(key);
        console.warn(`[env] ${key} is set but invalid (${parsed.error.issues[0]?.message ?? "invalid"}); ignoring it.`);
      }
    }
  }
  return out as ServerEnv;
}

export const isProduction = (): boolean => process.env.NODE_ENV === "production";
