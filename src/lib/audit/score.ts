/**
 * Scoring (see docs/ARCHITECTURE.md → Scoring).
 *
 *   check score       0..1, "unavailable" checks are excluded from the denominator
 *   category score    Σ(weight·score) / Σ(weight) × 100
 *   overall           0.45·SEO + 0.35·GEO + 0.20·Performance
 *                     (Performance excluded and the rest re-weighted when PSI is unavailable)
 *   issue impact      overall points recoverable if the check went to 1.0, split across
 *                     that check's issues by `share`
 */
import type { AuditIssue, AuditScores, Category, CheckResult, Severity } from "./types";
import type { CheckOutcome } from "./context";
import { issueCopy } from "./issues";

/** Relative weight of each check inside its category. Higher = matters more. */
export const CHECK_WEIGHTS: Record<string, number> = {
  // ── SEO ── (can Google find, read and show the site?)
  "seo.indexability": 15, // noindex / error status = invisible; the single biggest failure mode
  "seo.https": 10, // "Not secure" warnings + ranking signal
  "seo.title": 12, // the clickable headline in results
  "seo.robots-txt": 8, // blocking everything is catastrophic; missing file is minor
  "seo.meta-description": 8, // click-through, not ranking
  "seo.headings": 7, // topical clarity
  "seo.viewport": 7, // mobile-first indexing
  "seo.canonical": 6, // duplicate-URL consolidation
  "seo.sitemap": 6, // discovery
  "seo.structured-data": 6, // rich results
  "seo.image-alt": 5, // image search + accessibility
  "seo.open-graph": 4, // social previews, indirect
  "seo.lang": 3, // small hygiene signal

  // ── GEO ── (can AI assistants read, understand and quote the site?)
  "geo.ai-crawlers": 20, // blocked AI search bots = no AI visibility at all
  "geo.answer-ready": 15, // quotable answer blocks drive citations
  "geo.organization-schema": 14, // entity understanding (who you are)
  "geo.faq": 10, // question-shaped content matches question-shaped prompts
  "geo.entity-consistency": 8, // one name everywhere = one entity
  "geo.dates": 8, // freshness
  "geo.author": 7, // E-E-A-T style trust signals
  "geo.llms-txt": 6, // emerging, optional standard: low weight on purpose

  // ── Performance ── (single PSI-backed check)
  "performance.cwv": 1,
};

/** Share of the overall score per category. */
export const CATEGORY_WEIGHTS: Record<Category, number> = { seo: 0.45, geo: 0.35, performance: 0.2 };

export const SEVERITY_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function weightFor(checkId: string): number {
  return CHECK_WEIGHTS[checkId] ?? 1;
}

/** Unrounded 0..100 category score, or null when every check is unavailable. */
export function categoryScore(checks: CheckResult[], category: Category): number | null {
  let num = 0;
  let den = 0;
  for (const c of checks) {
    if (c.category !== category || c.status === "unavailable") continue;
    num += c.weight * c.score;
    den += c.weight;
  }
  return den > 0 ? (num / den) * 100 : null;
}

/** Category weights actually applied to the overall score (re-normalised when one is missing). */
export function effectiveCategoryWeights(available: Record<Category, boolean>): Record<Category, number> {
  const total = (Object.keys(CATEGORY_WEIGHTS) as Category[]).reduce(
    (s, k) => s + (available[k] ? CATEGORY_WEIGHTS[k] : 0),
    0,
  );
  const out: Record<Category, number> = { seo: 0, geo: 0, performance: 0 };
  if (total === 0) return out;
  for (const k of Object.keys(CATEGORY_WEIGHTS) as Category[]) {
    out[k] = available[k] ? CATEGORY_WEIGHTS[k] / total : 0;
  }
  return out;
}

const clampInt = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function computeScores(checks: CheckResult[]): AuditScores {
  const seo = categoryScore(checks, "seo");
  const geo = categoryScore(checks, "geo");
  const perf = categoryScore(checks, "performance");
  const w = effectiveCategoryWeights({ seo: seo !== null, geo: geo !== null, performance: perf !== null });
  const overall = (seo ?? 0) * w.seo + (geo ?? 0) * w.geo + (perf ?? 0) * w.performance;
  return {
    overall: clampInt(overall),
    seo: clampInt(seo ?? 0),
    geo: clampInt(geo ?? 0),
    performance: perf === null ? null : clampInt(perf),
  };
}

/** Overall points recoverable if `check` went from its score to 1.0. */
export function recoverablePoints(check: CheckResult, checks: CheckResult[]): number {
  if (check.status === "unavailable") return 0;
  const available = {
    seo: categoryScore(checks, "seo") !== null,
    geo: categoryScore(checks, "geo") !== null,
    performance: categoryScore(checks, "performance") !== null,
  };
  const catW = effectiveCategoryWeights(available)[check.category];
  const den = checks
    .filter((c) => c.category === check.category && c.status !== "unavailable")
    .reduce((s, c) => s + c.weight, 0);
  if (den === 0) return 0;
  return catW * (check.weight / den) * (1 - check.score) * 100;
}

export function sortIssues(issues: AuditIssue[]): AuditIssue[] {
  return [...issues].sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.impact - a.impact || a.id.localeCompare(b.id),
  );
}

/** Turn check outcomes into contract CheckResults + AuditIssues (with impact), sorted. */
export function finalize(outcomes: CheckOutcome[]): { checks: CheckResult[]; issues: AuditIssue[] } {
  const checks: CheckResult[] = outcomes.map((o) => ({
    id: o.id,
    category: o.category,
    label: o.label,
    status: o.status,
    score: Math.round(o.score * 1000) / 1000,
    weight: weightFor(o.id),
    summary: o.summary,
  }));

  const byId = new Map<string, AuditIssue>();
  outcomes.forEach((o, i) => {
    if (o.status === "unavailable" || o.issues.length === 0) return;
    const points = recoverablePoints(checks[i], checks);
    const shares = o.issues.reduce((s, seed) => s + (seed.share ?? 1), 0) || 1;
    for (const seed of o.issues) {
      const copy = issueCopy(seed.key);
      const impact = Math.round(((points * (seed.share ?? 1)) / shares) * 10) / 10;
      const existing = byId.get(seed.key);
      if (existing) {
        existing.impact = Math.round((existing.impact + impact) * 10) / 10;
        existing.affectedUrls = [...new Set([...existing.affectedUrls, ...(seed.affectedUrls ?? [])])];
        continue;
      }
      byId.set(seed.key, {
        id: seed.key,
        checkId: o.id,
        category: o.category,
        severity: seed.severity ?? copy.severity,
        title: copy.title,
        description: seed.detail ? `${copy.description} ${seed.detail}` : copy.description,
        howToFix: copy.howToFix,
        effort: copy.effort,
        impact: Math.max(0, Math.min(100, impact)),
        affectedUrls: [...new Set(seed.affectedUrls ?? [])],
      });
    }
  });

  return { checks, issues: sortIssues([...byId.values()]) };
}
