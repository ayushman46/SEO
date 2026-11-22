-- seenhq — 0001_init
-- Requires PostgreSQL 13+ (gen_random_uuid() is built in; no extension needed).
-- Idempotent: safe to run more than once. scripts/migrate.ts wraps each file in a transaction,
-- so this file deliberately has no BEGIN/COMMIT.
--
-- Access model: every table has row level security ENABLED with NO policies. The server connects
-- as the table owner (which bypasses RLS), so if this database ever sits behind a public data API
-- (e.g. Supabase's anon/authenticated roles) nothing is readable or writable through it.

-- ---------------------------------------------------------------------------
-- audits: one row per completed free audit
-- ---------------------------------------------------------------------------
create table if not exists audits (
  id                uuid        primary key default gen_random_uuid(),
  url               text        not null check (char_length(url) between 1 and 2048),
  final_url         text        not null check (char_length(final_url) between 1 and 2048),
  hostname          text        not null check (char_length(hostname) between 1 and 253),
  overall_score     smallint    not null check (overall_score between 0 and 100),
  seo_score         smallint    not null check (seo_score between 0 and 100),
  geo_score         smallint    not null check (geo_score between 0 and 100),
  performance_score smallint             check (performance_score is null or performance_score between 0 and 100),
  pages_scanned     smallint    not null default 0 check (pages_scanned >= 0),
  issue_count       integer     not null default 0 check (issue_count >= 0),
  truncated         boolean     not null default false,
  duration_ms       integer     not null default 0 check (duration_ms >= 0),
  result            jsonb       not null,
  ip_hash           text                 check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  created_at        timestamptz not null default now()
);

create index if not exists audits_created_at_idx on audits (created_at desc);
create index if not exists audits_hostname_created_at_idx on audits (hostname, created_at desc);

alter table audits enable row level security;

-- ---------------------------------------------------------------------------
-- leads: emails captured by the free-audit email gate
-- ---------------------------------------------------------------------------
create table if not exists leads (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null check (
                              char_length(email) between 3 and 254
                              and email = lower(email)
                              and position('@' in email) > 1
                            ),
  audit_id      uuid                 references audits (id) on delete set null,
  url           text                 check (url is null or char_length(url) <= 2048),
  overall_score smallint             check (overall_score is null or overall_score between 0 and 100),
  source        text        not null default 'free_audit' check (source in ('free_audit')),
  consent       boolean     not null check (consent),
  ip_hash       text                 check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent    text                 check (user_agent is null or char_length(user_agent) <= 256),
  created_at    timestamptz not null default now()
);

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_email_idx on leads (email);
create index if not exists leads_audit_id_idx on leads (audit_id);

alter table leads enable row level security;

-- ---------------------------------------------------------------------------
-- contact_submissions: the /contact form
-- (minimum lengths are enforced by the app's Zod schema; the DB checks only guard non-empty
--  and maximums, since Postgres counts characters while JS counts UTF-16 code units)
-- ---------------------------------------------------------------------------
create table if not exists contact_submissions (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null check (char_length(btrim(name)) between 1 and 100),
  email      text        not null check (
                           char_length(email) between 3 and 254
                           and email = lower(email)
                           and position('@' in email) > 1
                         ),
  company    text                 check (company is null or char_length(company) <= 120),
  website    text                 check (website is null or char_length(website) <= 2048),
  service    text        not null check (service in (
                           'seo-audit', 'geo-audit', 'technical-fixes',
                           'content-entity', 'monitoring', 'not-sure'
                         )),
  budget     text                 check (budget is null or budget in (
                           'under-100', '100-300', '300-1000', '1000-plus', 'not-sure'
                         )),
  message    text        not null check (char_length(btrim(message)) between 1 and 4000),
  status     text        not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  ip_hash    text                 check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx on contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx on contact_submissions (status, created_at desc);

alter table contact_submissions enable row level security;

-- ---------------------------------------------------------------------------
-- rate_limits: fixed-window counters (bucket = "<scope>:<ip hash>")
-- ---------------------------------------------------------------------------
create table if not exists rate_limits (
  bucket       text        not null check (char_length(bucket) between 1 and 200),
  window_start timestamptz not null,
  count        integer     not null default 0 check (count >= 0),
  primary key (bucket, window_start)
);

-- supports the periodic cleanup of expired windows
create index if not exists rate_limits_window_start_idx on rate_limits (window_start);

alter table rate_limits enable row level security;
