# R5: design, accessibility and regression QA after the redesign (T029)

Date: 2026-11-23. Reviewer: qa-security. Target: the production build already running at http://localhost:3210 (built from commit 13f3c91 / eb2fe8d; not rebuilt). Read-only for `src/**`.

How: real rendering in headless Chrome (puppeteer-core from the cached Lighthouse 13.6.0), full-page screenshots at 360x740, 768x1024, 1280x800 and 1920x1080 on 10 routes plus a 404, scripted keyboard / pointer / touch checks, axe-core (bundled with Lighthouse) and Lighthouse 13.6.0. Scripts and every screenshot are in the session scratchpad: `C:\Users\Ayush\AppData\Local\Temp\claude\11a785f75f0135c8\c76b4fba-778c-45c4-b713-c060e6b08433\scratchpad\r5\` (below: `SP\`). Full-page shots are `SP\shots\<width>_<page>.png`; contact sheets for reading them are `SP\sheets\`.

**Working tree warning.** While this review ran, other agents had uncommitted edits in 19 files under `src/components`/`src/app` and 10 files under `src/content` (for example `IssueCard.tsx`, `FixTray.tsx`, `labels.ts`, `pricing/page.tsx`, `home.ts`). The screenshots and runtime checks describe the committed build on :3210. File:line references below are against `HEAD`. One of those uncommitted edits breaks `npm run typecheck` (finding 1).

Severity: **critical** = blocks production deploy; **high** = fix before deploy; **medium** = fix soon; **low** = polish.

## Findings

__FINDINGS__

## Measured numbers

__NUMBERS__

## What passed

__PASSED__
