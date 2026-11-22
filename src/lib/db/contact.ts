import "server-only";
import type { ContactBudget, ContactInput } from "@/app/actions/contact-schema";
import type { QuoteCurrency } from "@/lib/quote/catalog";
import type { VerifiedOrderItem } from "@/lib/quote/verify";
import { getDb } from "./index";

export type ContactStatus = "new" | "contacted" | "qualified" | "closed" | "spam";

/**
 * Quote attached to a contact submission (T019), stored as jsonb. Prices were checked against
 * src/lib/quote/catalog.ts on the server; `catalogTotal` is ours, `submittedTotal` the client's.
 */
export interface StoredQuote {
  version: 1;
  /** null only when malformed */
  currency: QuoteCurrency | null;
  items: VerifiedOrderItem[];
  catalogTotal: number;
  submittedTotal: number | null;
  valid: boolean;
  fixed: boolean;
  /** quote fields were present but unreadable, so nothing from them was kept */
  malformed: boolean;
}

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  /** Slug as stored; may be a slug that has since been removed from CONTACT_SERVICES. */
  service: string;
  budget: ContactBudget | null;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  /** null when no quote was attached, or before migration 0002 */
  quote: StoredQuote | null;
  quoteValid: boolean | null;
  auditId: string | null;
  auditUrl: string | null;
}

export interface ContactInsert extends ContactInput {
  ipHash: string | null;
  quote?: StoredQuote | null;
  auditId?: string | null;
  auditUrl?: string | null;
}

/** Postgres "undefined_column": migration 0002 has not been applied yet. */
const isMissingColumn = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === "42703";

/**
 * Returns the new id, or null when no DB is configured. Throws on DB errors.
 * Submissions without a quote or audit use the 0001 column set, so they keep working on a
 * database where migration 0002 has not been applied.
 */
export async function insertContact(input: ContactInsert): Promise<string | null> {
  const sql = getDb();
  if (!sql) return null;
  const quote = input.quote ?? null;
  const auditId = input.auditId ?? null;
  const auditUrl = input.auditUrl === undefined || input.auditUrl === null ? null : input.auditUrl.slice(0, 2048);

  if (quote === null && auditId === null && auditUrl === null) {
    const rows = await sql<{ id: string }[]>`
      insert into contact_submissions (name, email, company, website, service, budget, message, ip_hash)
      values (
        ${input.name},
        ${input.email.toLowerCase()},
        ${input.company ?? null},
        ${input.website ?? null},
        ${input.service},
        ${input.budget ?? null},
        ${input.message},
        ${input.ipHash}
      )
      returning id
    `;
    return rows[0]?.id ?? null;
  }

  const rows = await sql<{ id: string }[]>`
    insert into contact_submissions (
      name, email, company, website, service, budget, message, ip_hash,
      quote, quote_valid, audit_id, audit_url
    )
    values (
      ${input.name},
      ${input.email.toLowerCase()},
      ${input.company ?? null},
      ${input.website ?? null},
      ${input.service},
      ${input.budget ?? null},
      ${input.message},
      ${input.ipHash},
      ${quote === null ? null : sql.json(quote)},
      ${quote === null ? null : quote.valid},
      ${auditId}::uuid,
      ${auditUrl}
    )
    returning id
  `;
  return rows[0]?.id ?? null;
}

export async function listContacts(limit = 200): Promise<ContactRow[]> {
  const sql = getDb();
  if (!sql) return [];
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
  try {
    return await sql<ContactRow[]>`
      select id, name, email, company, website, service, budget, message, status,
             created_at as "createdAt",
             quote, quote_valid as "quoteValid", audit_id as "auditId", audit_url as "auditUrl"
      from contact_submissions
      order by created_at desc
      limit ${safeLimit}
    `;
  } catch (error) {
    if (!isMissingColumn(error)) throw error;
    // Pre-0002 schema: show submissions without quotes rather than failing the admin page.
    return sql<ContactRow[]>`
      select id, name, email, company, website, service, budget, message, status,
             created_at as "createdAt",
             null::jsonb as quote, null::boolean as "quoteValid", null::uuid as "auditId", null::text as "auditUrl"
      from contact_submissions
      order by created_at desc
      limit ${safeLimit}
    `;
  }
}
