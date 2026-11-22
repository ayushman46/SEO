import "server-only";
import postgres, { type Sql } from "postgres";
import { getServerEnv } from "@/lib/security/env";

export type { Sql };

/**
 * Lazy singleton Postgres client. Returns null when DATABASE_URL is not configured so callers
 * can degrade gracefully. Cached on globalThis so dev hot-reloads don't leak connection pools.
 */
const globalForDb = globalThis as typeof globalThis & {
  __seenhqDb?: { url: string; sql: Sql };
};

function isLocalHost(databaseUrl: string): boolean {
  try {
    const host = new URL(databaseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  } catch {
    return false;
  }
}

export function getDb(): Sql | null {
  const url = getServerEnv().DATABASE_URL;
  if (!url) return null;

  const cached = globalForDb.__seenhqDb;
  if (cached && cached.url === url) return cached.sql;

  const sql = postgres(url, {
    max: 5,
    prepare: false, // required by transaction-mode poolers (Neon pooler, Supabase pgbouncer)
    ssl: isLocalHost(url) ? false : "require",
    idle_timeout: 20,
    connect_timeout: 10,
    query_timeout: 10,
    onnotice: false,
  });
  globalForDb.__seenhqDb = { url, sql };
  return sql;
}

export const isDbConfigured = (): boolean => getServerEnv().DATABASE_URL !== undefined;
