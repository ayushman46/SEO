-- noticr — 0002_quote (T019: instant quote + order intake)
-- Additive and idempotent. scripts/migrate.ts wraps each file in a transaction (no BEGIN/COMMIT).
-- contact_submissions already has row level security enabled with no policies (0001); new columns
-- inherit that, so nothing here is reachable through a public data API.
--
-- quote:       the quote the visitor sent with the form, re-checked on the server against
--              src/lib/quote/catalog.ts (items carry both the submitted and the catalog price).
-- quote_valid: true only when every item and the total matched the catalog. Null iff no quote.
-- audit_id:    id of the free audit the quote came from. Deliberately NOT a foreign key: the audit
--              row may not exist (audits run without a database, or the insert failed).
-- audit_url:   the audited site's URL.

alter table contact_submissions add column if not exists quote       jsonb;
alter table contact_submissions add column if not exists quote_valid boolean;
alter table contact_submissions add column if not exists audit_id    uuid;
alter table contact_submissions add column if not exists audit_url   text;

alter table contact_submissions drop constraint if exists contact_submissions_quote_shape;
alter table contact_submissions add constraint contact_submissions_quote_shape check (
  quote is null
  or (
    jsonb_typeof(quote) = 'object'
    and octet_length(quote::text) <= 16384
    and case
          when jsonb_typeof(quote -> 'items') = 'array' then jsonb_array_length(quote -> 'items') <= 12
          else (quote -> 'items') is null
        end
  )
);

alter table contact_submissions drop constraint if exists contact_submissions_quote_valid_pair;
alter table contact_submissions add constraint contact_submissions_quote_valid_pair check (
  (quote is null) = (quote_valid is null)
);

alter table contact_submissions drop constraint if exists contact_submissions_audit_url_len;
alter table contact_submissions add constraint contact_submissions_audit_url_len check (
  audit_url is null or char_length(audit_url) between 1 and 2048
);

create index if not exists contact_submissions_audit_id_idx
  on contact_submissions (audit_id) where audit_id is not null;
