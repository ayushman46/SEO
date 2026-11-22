import "server-only";
import type { PsiOutcome } from "../context";
import { parsePsi } from "../checks/performance";

export const PSI_TIMEOUT_MS = 30_000;
const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/** Run PageSpeed Insights (mobile). Never throws; resolves to an outcome. */
export async function fetchPsi(url: string, signal?: AbortSignal): Promise<PsiOutcome> {
  const params = new URLSearchParams({ url, strategy: "mobile", category: "performance" });
  const key = process.env.PAGESPEED_API_KEY;
  if (key) params.set("key", key);
  const timeout = AbortSignal.timeout(PSI_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, {
      signal: combined,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      const reason =
        res.status === 429
          ? "PageSpeed Insights quota was exceeded"
          : `PageSpeed Insights returned an error (status ${res.status})`;
      return { ok: false, vitals: null, error: reason };
    }
    const vitals = parsePsi(await res.json());
    if (!vitals || vitals.performanceScore === null) {
      return { ok: false, vitals: null, error: "PageSpeed Insights returned no performance score" };
    }
    return { ok: true, vitals, error: null };
  } catch (err) {
    const name = (err as Error | undefined)?.name;
    return {
      ok: false,
      vitals: null,
      error:
        name === "TimeoutError" || name === "AbortError"
          ? "PageSpeed Insights took too long to respond"
          : "PageSpeed Insights couldn't be reached",
    };
  }
}

