import { z } from "zod";
import type { CoreWebVitals } from "../types";
import { unavailable, type Check, type CheckOutcome, type IssueSeed } from "../context";

const def = { id: "performance.cwv", category: "performance", label: "Mobile speed (Core Web Vitals)" } as const;

const metric = z.object({ numericValue: z.number().optional() });
const PsiResponse = z.object({
  lighthouseResult: z.object({
    categories: z.object({
      performance: z.object({ score: z.number().nullable().optional() }),
    }),
    audits: z.record(z.string(), metric).optional(),
  }),
  loadingExperience: z
    .object({
      metrics: z.record(z.string(), z.object({ percentile: z.number().optional() })).optional(),
    })
    .optional(),
});

/** Map a PSI v5 JSON body to CoreWebVitals (null when the shape is unexpected). */
export function parsePsi(json: unknown): CoreWebVitals | null {
  const parsed = PsiResponse.safeParse(json);
  if (!parsed.success) return null;
  const lr = parsed.data.lighthouseResult;
  const audits = lr.audits ?? {};
  const num = (k: string): number | null => {
    const v = audits[k]?.numericValue;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };
  const score = lr.categories.performance.score;
  const inp = parsed.data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile;
  const round = (v: number | null) => (v === null ? null : Math.round(v));
  const cls = num("cumulative-layout-shift");
  return {
    source: "pagespeed-insights",
    strategy: "mobile",
    performanceScore: typeof score === "number" ? Math.round(score * 100) : null,
    lcpMs: round(num("largest-contentful-paint")),
    cls: cls === null ? null : Math.round(cls * 1000) / 1000,
    inpMs: typeof inp === "number" ? Math.round(inp) : null,
    fcpMs: round(num("first-contentful-paint")),
    tbtMs: round(num("total-blocking-time")),
  };
}

function fmtSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

export const performanceCheck: Check = (ctx): CheckOutcome => {
  const v = ctx.psi.vitals;
  if (!ctx.psi.ok || !v || v.performanceScore === null) {
    return unavailable(def, "Mobile speed couldn't be measured right now (Google PageSpeed Insights was unavailable).");
  }
  const s = v.performanceScore;
  const status = s >= 90 ? "pass" : s >= 50 ? "warn" : "fail";
  const parts = [
    v.lcpMs !== null ? `LCP ${fmtSeconds(v.lcpMs)}` : null,
    v.cls !== null ? `CLS ${v.cls}` : null,
    v.tbtMs !== null ? `TBT ${v.tbtMs} ms` : null,
    v.inpMs !== null ? `INP ${v.inpMs} ms` : null,
  ].filter(Boolean);
  const summary = `Mobile performance score ${s}/100${parts.length ? ` (${parts.join(", ")})` : ""}.`;

  const issues: IssueSeed[] = [];
  if (status !== "pass") {
    issues.push({
      key: "performance.cwv:slow",
      affectedUrls: [ctx.finalUrl],
      severity: status === "fail" ? "high" : "medium",
      detail: `Google's mobile score for your homepage is ${s}/100.`,
      share: 2,
    });
    if (v.lcpMs !== null && v.lcpMs > 2500) {
      issues.push({
        key: "performance.cwv:lcp",
        affectedUrls: [ctx.finalUrl],
        detail: `Yours is ${fmtSeconds(v.lcpMs)}.`,
        severity: v.lcpMs > 4000 ? "high" : "medium",
      });
    }
    if (v.cls !== null && v.cls > 0.1) {
      issues.push({
        key: "performance.cwv:cls",
        affectedUrls: [ctx.finalUrl],
        detail: `Yours is ${v.cls}.`,
        severity: v.cls > 0.25 ? "high" : "medium",
      });
    }
    if (v.tbtMs !== null && v.tbtMs > 200) {
      issues.push({
        key: "performance.cwv:tbt",
        affectedUrls: [ctx.finalUrl],
        detail: `Yours is ${v.tbtMs} ms.`,
        severity: v.tbtMs > 600 ? "high" : "medium",
      });
    }
  }
  return { ...def, status, score: s / 100, summary, issues };
};
