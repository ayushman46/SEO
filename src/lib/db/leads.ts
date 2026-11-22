import "server-only";
import { getDb } from "./index";

export type LeadSource = "free_audit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface NewLead {
  email: string;
  auditId: string | null;
  url: string | null;
  overallScore: number | null;
  source: LeadSource;
  consent: true;
  ipHash: string | null;
  userAgent: string | null;
}

export interface LeadRow {
  id: string;
  email: string;
  auditId: string | null;
  url: string | null;
  overallScore: number | null;
  source: LeadSource;
  consent: boolean;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Inserts a lead. `audit_id` is linked only if that audit row exists (it may not have been stored
 * if the DB hiccupped during the audit), so a missing audit never loses the lead.
 * Returns the new id, or null when no DB is configured. Throws on DB errors.
 */
export async function insertLead(lead: NewLead): Promise<string | null> {
  const sql = getDb();
  if (!sql) return null;
  const score =
    lead.overallScore === null ? null : Math.max(0, Math.min(100, Math.round(lead.overallScore)));
  const auditId = lead.auditId !== null && UUID_RE.test(lead.auditId) ? lead.auditId : null;

  const rows = await sql<{ id: string }[]>`
    insert into leads (email, audit_id, url, overall_score, source, consent, ip_hash, user_agent)
    values (
      ${lead.email.trim().toLowerCase()},
      (select id from audits where id = ${auditId}::uuid),
      ${lead.url === null ? null : lead.url.slice(0, 2048)},
      ${score},
      ${lead.source},
      ${lead.consent},
      ${lead.ipHash},
      ${lead.userAgent === null ? null : lead.userAgent.slice(0, 256)}
    )
    returning id
  `;
  return rows[0]?.id ?? null;
}

export async function listLeads(limit = 200): Promise<LeadRow[]> {
  const sql = getDb();
  if (!sql) return [];
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
  return sql<LeadRow[]>`
    select
      id, email, audit_id as "auditId", url, overall_score as "overallScore",
      source, consent, user_agent as "userAgent", created_at as "createdAt"
    from leads
    order by created_at desc
    limit ${safeLimit}
  `;
}
