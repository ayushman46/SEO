import "server-only";
import { getDb } from "./index";

export interface AdminMetrics {
  auditsToday: number;
  audits7d: number;
  leads7d: number;
  contacts7d: number;
}

/** Counts for the admin dashboard. "Today" is the current UTC day. Null when no DB. */
export async function getAdminMetrics(): Promise<AdminMetrics | null> {
  const sql = getDb();
  if (!sql) return null;
  const rows = await sql<AdminMetrics[]>`
    select
      (select count(*)::int from audits where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc') as "auditsToday",
      (select count(*)::int from audits where created_at >= now() - interval '7 days') as "audits7d",
      (select count(*)::int from leads where created_at >= now() - interval '7 days') as "leads7d",
      (select count(*)::int from contact_submissions where created_at >= now() - interval '7 days') as "contacts7d"
  `;
  return rows[0] ?? null;
}
