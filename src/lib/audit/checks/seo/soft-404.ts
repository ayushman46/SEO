import { outcome, unavailable, type AuditContext, type CheckOutcome, type Soft404Probe } from "../../context";

const def = { id: "seo.soft-404", category: "seo", label: "Missing pages return 404" } as const;

const SKIPPED: Record<Extract<Soft404Probe, { status: "skipped" }>["reason"], string> = {
  not_run: "The missing-page test wasn't run for this audit.",
  no_time: "There wasn't enough time left for the missing-page test.",
  aborted: "The missing-page test was cancelled.",
  error: "The missing-page test couldn't reach your site.",
  robots: "robots.txt doesn't let our crawler request the test path, so the missing-page test was skipped.",
};

function isHome(location: string, ctx: AuditContext): boolean {
  try {
    const u = new URL(location, ctx.origin);
    const home = new URL(ctx.finalUrl);
    return u.hostname.replace(/^www\./, "") === home.hostname.replace(/^www\./, "") && (u.pathname === "/" || u.pathname === home.pathname) && !u.search;
  } catch {
    return false;
  }
}

/**
 * seo.soft-404 (T020 N6): a made-up URL should return 404/410. A 200 ("soft 404") or a redirect to
 * the homepage makes crawlers and AI agents treat junk URLs as real pages. One request only.
 */
export function soft404Outcome(probe: Soft404Probe, ctx: AuditContext): CheckOutcome {
  if (probe.status === "skipped") return unavailable(def, SKIPPED[probe.reason]);
  const path = (() => {
    try {
      return new URL(probe.url).pathname;
    } catch {
      return probe.url;
    }
  })();
  // Refused or errored: we learn nothing about soft 404s (R3 L7).
  if ([401, 403, 429].includes(probe.statusCode) || probe.statusCode >= 500) {
    return unavailable(def, `The site refused or errored on the test URL (status ${probe.statusCode}), so we couldn't check how it handles missing pages.`);
  }
  if (probe.statusCode === 404 || probe.statusCode === 410) {
    return outcome(def, { score: 1, summary: `A made-up URL (${path}) correctly returned ${probe.statusCode}.`, issues: [] });
  }
  if (probe.statusCode >= 200 && probe.statusCode < 300) {
    return outcome(def, {
      score: 0.3,
      status: "fail",
      summary: `A made-up URL (${path}) returned ${probe.statusCode} instead of 404${probe.title ? ` (page title "${probe.title.slice(0, 80)}")` : ""}.`,
      issues: [{ key: "seo.soft-404:returns-200", affectedUrls: [probe.url] }],
    });
  }
  if (probe.statusCode >= 300 && probe.statusCode < 400 && probe.location && isHome(probe.location, ctx)) {
    return outcome(def, {
      score: 0.5,
      status: "warn",
      summary: `A made-up URL (${path}) redirected to your homepage instead of returning 404.`,
      issues: [{ key: "seo.soft-404:redirects-home", affectedUrls: [probe.url] }],
    });
  }
  return outcome(def, {
    score: 1,
    summary: `A made-up URL (${path}) returned ${probe.statusCode}${probe.location ? ` (redirect to ${probe.location.slice(0, 120)})` : ""}, which isn't a soft 404.`,
    issues: [],
  });
}
