import "server-only";
import type { ContactBudget, ContactInput } from "@/app/actions/contact-schema";
import { getDb } from "./index";

export type ContactStatus = "new" | "contacted" | "qualified" | "closed" | "spam";

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
}

/** Returns the new id, or null when no DB is configured. Throws on DB errors. */
export async function insertContact(input: ContactInput & { ipHash: string | null }): Promise<string | null> {
  const sql = getDb();
  if (!sql) return null;
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

export async function listContacts(limit = 200): Promise<ContactRow[]> {
  const sql = getDb();
  if (!sql) return [];
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
  return sql<ContactRow[]>`
    select id, name, email, company, website, service, budget, message, status,
           created_at as "createdAt"
    from contact_submissions
    order by created_at desc
    limit ${safeLimit}
  `;
}
