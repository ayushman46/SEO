/**
 * Applies pending SQL migrations from db/migrations in filename order.
 *
 *   npm run db:migrate          (= npx tsx scripts/migrate.ts)
 *
 * - Reads DATABASE_URL from the environment, falling back to .env.local / .env.
 * - Tracks applied files in `schema_migrations` (name, checksum, applied_at).
 * - Each file runs in its own transaction; a failure rolls that file back and stops.
 * - A Postgres advisory lock prevents two runners from migrating at once.
 *
 * Deliberately does not import src/lib/** (those modules are `server-only`).
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db", "migrations");
const LOCK_KEY = 7_311_420_501; // arbitrary, stable advisory-lock id for seenhq migrations

function loadEnvFallback(): void {
  if (process.env.DATABASE_URL) return;
  for (const file of [".env.local", ".env"]) {
    const full = path.resolve(process.cwd(), file);
    if (existsSync(full)) {
      process.loadEnvFile(full);
      if (process.env.DATABASE_URL) return;
    }
  }
}

function isLocalHost(databaseUrl: string): boolean {
  try {
    const host = new URL(databaseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  } catch {
    return false;
  }
}

function checksum(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function main(): Promise<void> {
  loadEnvFallback();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[migrate] DATABASE_URL is not set (env, .env.local or .env). Nothing to do.");
    process.exitCode = 1;
    return;
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/i.test(f))
    .sort();

  const sql = postgres(databaseUrl, {
    max: 1, // one connection so the advisory lock and the migrations share a session
    prepare: false,
    ssl: isLocalHost(databaseUrl) ? false : "require",
    onnotice: false,
    connect_timeout: 15,
  });

  try {
    await sql`select pg_advisory_lock(${LOCK_KEY}::bigint)`;

    await sql`
      create table if not exists schema_migrations (
        name       text        primary key,
        checksum   text        not null,
        applied_at timestamptz not null default now()
      )
    `;
    await sql`alter table schema_migrations enable row level security`;

    const appliedRows = await sql<{ name: string; checksum: string }[]>`
      select name, checksum from schema_migrations
    `;
    const applied = new Map(appliedRows.map((r) => [r.name, r.checksum]));

    let ran = 0;
    for (const file of files) {
      const content = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      const sum = checksum(content);
      const previous = applied.get(file);

      if (previous !== undefined) {
        if (previous !== sum) {
          console.warn(
            `[migrate] WARNING: ${file} changed after it was applied (checksum mismatch). ` +
              "Applied migrations are immutable; put changes in a new file.",
          );
        }
        continue;
      }

      console.log(`[migrate] applying ${file} …`);
      await sql.begin(async (tx) => {
        await tx.unsafe(content); // no args → simple protocol, allows several statements
        await tx`insert into schema_migrations (name, checksum) values (${file}, ${sum})`;
      });
      ran += 1;
      console.log(`[migrate] applied ${file}`);
    }

    console.log(ran === 0 ? "[migrate] up to date." : `[migrate] done, ${ran} migration(s) applied.`);
  } finally {
    try {
      await sql`select pg_advisory_unlock(${LOCK_KEY}::bigint)`;
    } catch {
      // connection may already be gone; the lock is released with the session anyway
    }
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[migrate] failed: ${message}`);
  process.exitCode = 1;
});
