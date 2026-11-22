import "server-only";
import type { AuditResult } from "@/lib/audit/types";
import { getDb } from "./index";

const clampScore = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Stores a completed audit. Uses the engine's result.id as the primary key so leads can reference
 * it later. Returns false when no DB is configured. Throws on DB errors (callers decide).
 */
export async function insertAudit(input: { result: AuditResult; ipHash: string | null }): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  const r = input.result;

  await sql`
    insert into audits (
      id, url, final_url, hostname,
      overall_score, seo_score, geo_score, performance_score,
      pages_scanned, issue_count, truncated, duration_ms,
      result, ip_hash
    ) values (
      ${r.id}::uuid, ${r.requestedUrl.slice(0, 2048)}, ${r.finalUrl.slice(0, 2048)}, ${r.hostname.slice(0, 253)},
      ${clampScore(r.scores.overall)}, ${clampScore(r.scores.seo)}, ${clampScore(r.scores.geo)},
      ${r.scores.performance === null ? null : clampScore(r.scores.performance)},
      ${r.pages.length}, ${r.issues.length}, ${r.truncated}, ${Math.max(0, Math.round(r.durationMs))},
      ${sql.json(r)}, ${input.ipHash}
    )
    on conflict (id) do nothing
  `;
  return true;
}
