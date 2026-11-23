# noticr

SEO + GEO (Generative Engine Optimization) audits: see how your site shows up in search **and** in AI answers.

- Stack, routes and data model: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Plan and status: [docs/PLAN.md](docs/PLAN.md), [docs/STATUS.md](docs/STATUS.md)

## Local setup
```bash
npm install
cp .env.example .env.local   # fill values (all optional for local dev)
npm run db:migrate           # only if DATABASE_URL is set
npm run dev
```
Checks: `npm run typecheck && npm run lint && npm test && npm run build`.
