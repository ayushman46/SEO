/**
 * TLS settings for the postgres.js client, shared by the app (src/lib/db/index.ts) and the
 * migration runner (scripts/migrate.ts). Pure and free of `server-only` so the script can import it.
 *
 * postgres.js gives an explicit `ssl` option precedence over the URL's `sslmode`, and maps
 * `ssl: "require"` to `rejectUnauthorized: false` (no certificate check). So:
 *  - if the URL (or PGSSLMODE) says anything about TLS, we pass NO `ssl` option and the URL wins
 *    (`sslmode=verify-full`, `sslrootcert=system|<path>`, `sslmode=disable` for docker-compose, ...);
 *  - localhost without TLS parameters: TLS off;
 *  - any other host without TLS parameters: `verify-full` (certificate + hostname verified against
 *    Node's CA store). Hosts with a private CA (e.g. Supabase) must add `sslrootcert=<path>` or opt
 *    out explicitly with `sslmode=require`. See ADR-014.
 */

export type SslOption = false | "verify-full";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function isLocalDbHost(databaseUrl: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(databaseUrl).hostname);
  } catch {
    return false;
  }
}

/** True when the connection string (or PGSSLMODE) already decides the TLS mode. */
export function urlSetsTls(databaseUrl: string, env: Record<string, string | undefined> = process.env): boolean {
  if (env.PGSSLMODE) return true;
  try {
    const params = new URL(databaseUrl).searchParams;
    return params.has("sslmode") || params.has("ssl") || params.has("sslrootcert");
  } catch {
    return false;
  }
}

/**
 * The `ssl` client option to pass, or `undefined` to let the URL decide.
 * Spread as `...sslOptionsFor(url)` so `undefined` really omits the key.
 */
export function sslOptionFor(
  databaseUrl: string,
  env: Record<string, string | undefined> = process.env,
): SslOption | undefined {
  if (urlSetsTls(databaseUrl, env)) return undefined;
  return isLocalDbHost(databaseUrl) ? false : "verify-full";
}

export function sslOptionsFor(
  databaseUrl: string,
  env: Record<string, string | undefined> = process.env,
): { ssl?: SslOption } {
  const ssl = sslOptionFor(databaseUrl, env);
  return ssl === undefined ? {} : { ssl };
}
