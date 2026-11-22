/**
 * Applies pending SQL migrations from db/migrations in filename order.
 *
 *   npm run db:migrate          (= npx tsx scripts/migrate.ts)
 *
 * - Connection: DATABASE_URL_UNPOOLED (direct, non-pooled) if set, else DATABASE_URL, read from
 *   the environment with a fallback to .env.local / .env. Prefer the direct URL for migrations.
 * - Tracks applied files in `schema_migrations` (name, checksum, applied_at).
 * - Each file runs in its own transaction; a failure rolls that file back and stops.
 * - Concurrency: every schema-touching transaction first takes a TRANSACTION-scoped advisory lock
 *   (pg_advisory_xact_lock). Unlike a session lock this is safe on transaction-mode poolers
 *   (Neon -pooler, Supabase :6543): it lives and dies with the transaction, on one backend, and is
 *   released on commit/rollback, so it can neither leak nor be unlocked on the wrong backend.
 *
 * Imports only src/lib/db/ssl.ts from the app (pure, not `server-only`).
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres, { type TransactionSql } from "postgres";
import { sslOptionsFor } from "../src/lib/db/ssl";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db", "migrations");
const LOCK_KEY = 7_311_420_501; // arbitrary, stable advisory-lock id for seenhq migrations

const LOCK_TIMEOUT = "60s";

function migrationUrl(): string | undefined {
  const pick = (v: string | undefined): string | undefined => (v && v.trim() !== "" ? v : undefined);
  return pick(process.env.DATABASE_URL_UNPOOLED) ?? pick(process.env.DATABASE_URL);
}

function loadEnvFallback(): void {
  if (migrationUrl()) return;
  for (const file of [".env.local", ".env"]) {
    const full = path.resolve(process.cwd(), file);
    if (existsSync(full)) {
      process.loadEnvFile(full);
      if (migrationUrl()) return;
    }
  }
}

/** Serializes migrators: waits up to LOCK_TIMEOUT for the lock, held until this transaction ends. */
async function takeLock(tx: TransactionSql): Promise<void> {
  await tx.unsafe(`set local lock_timeout = '${LOCK_TIMEOUT}'`);
  await tx`select pg_advisory_xact_lock(${LOCK_KEY}::bigint)`;
}

function checksum(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function main(): Promise<void> {
  loadEnvFallback();
  const databaseUrl = migrationUrl();
  if (!databaseUrl) {
    console.error("[migrate] DATABASE_URL_UNPOOLED / DATABASE_URL is not set (env, .env.local or .env). Nothing to do.");
    process.exitCode = 1;
    return;
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/i.test(f))
    .sort();

  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false, // works through transaction-mode poolers too
    ...sslOptionsFor(databaseUrl),
    onnotice: false,
    connect_timeout: 15,
  });

  try {
    await sql.begin(async (tx) => {
      await takeLock(tx);
      await tx`
        create table if not exists schema_migrations (
          name       text        primary key,
          checksum   text        not null,
          applied_at timestamptz not null default now()
        )
      `;
      await tx`alter table schema_migrations enable row level security`;
    });

    let ran = 0;
    for (const file of files) {
      const content = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      const sum = checksum(content);

      // Check, apply and record inside ONE locked transaction, so a concurrent runner either
      // sees the row (and skips) or waits for the lock.
      const outcome = await sql.begin(async (tx): Promise<"applied" | "skipped"> => {
        await takeLock(tx);
        const done = await tx<{ checksum: string }[]>`
          select checksum from schema_migrations where name = ${file}
        `;
        const previous = done[0];
        if (previous) {
          if (previous.checksum !== sum) {
            console.warn(
              `[migrate] WARNING: ${file} changed after it was applied (checksum mismatch). ` +
                "Applied migrations are immutable; put changes in a new file.",
            );
          }
          return "skipped";
        }
        console.log(`[migrate] applying ${file} …`);
        await tx.unsafe(content); // no args → simple protocol, allows several statements
        await tx`insert into schema_migrations (name, checksum) values (${file}, ${sum})`;
        return "applied";
      });

      if (outcome === "applied") {
        ran += 1;
        console.log(`[migrate] applied ${file}`);
      }
    }

    console.log(ran === 0 ? "[migrate] up to date." : `[migrate] done, ${ran} migration(s) applied.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[migrate] failed: ${message}`);
  process.exitCode = 1;
});
