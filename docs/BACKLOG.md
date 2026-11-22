# Backlog (cut from v1)

| Item | Why cut | Notes |
|---|---|---|
| User auth (email/password, magic link, Google OAuth, roles) | Founder decision ADR-011 | Supabase Auth or Better Auth when needed |
| Client dashboard (projects, audit history, report detail) | Depends on auth | Audits are already stored in `audits` table, so history can be backfilled by email |
| AI visibility module (LLM brand mention checks) | Deadline override | Feature-flag + server-side keys |
| PDF export | Deadline override | @react-pdf/renderer |
| Share links | Deadline override | token table, revocable |
| Background job queue / crawls > 6 pages | Deadline override | |
| Team invites, Stripe | Deadline override / Phase 2 | |
| Blog (MDX) | Deadline override | |
| Dark mode | Deadline override | Tokens already variables |
| Per-service pages | Deadline override | One /services page in v1 |
| Trend charts | Deadline override | |
| Resend email notifications | No API key yet | Console mailer in v1; set `RESEND_API_KEY` |
