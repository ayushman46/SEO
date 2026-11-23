import "server-only";
import postgres, { type Sql } from "postgres";
import { getServerEnv } from "@/lib/security/env";
import { sslOptionsFor } from "./ssl";

export type { Sql };

/**
 * Lazy singleton Postgres client. Returns null when DATABASE_URL is not configured so callers
 * can degrade gracefully. Cached on globalThis so dev hot-reloads don't leak connection pools.
 */
const globalForDb = globalThis as typeof globalThis & {
  __noticrDb?: { url: string; sql: Sql };
};

export function getDb(): Sql | null {
  const url = getServerEnv().DATABASE_URL;
  if (!url) return null;

  const cached = globalForDb.__noticrDb;
  if (cached && cached.url === url) return cached.sql;

  const sql = postgres(url, {
    max: 5,
    prepare: false, // required by transaction-mode poolers (Neon pooler, Supabase pgbouncer)
    // TLS: the URL's sslmode/sslrootcert win; otherwise verify-full (localhost: off). ADR-014.
    ...sslOptionsFor(url),
    idle_timeout: 20,
    // Short timeouts: every DB call is best effort and must fit inside the routes' maxDuration
    // (unlock: 15 s with two sequential DB calls; audit: 60 s incl. the crawl budget).
    connect_timeout: 5,
    query_timeout: 5,
    onnotice: false,
  });
  globalForDb.__noticrDb = { url, sql };
  return sql;
}

export const isDbConfigured = (): boolean => getServerEnv().DATABASE_URL !== undefined;
