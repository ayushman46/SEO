/**
 * Homepage refusal detection (R7 #3). When the audited site answers our own crawler (seenhqbot)
 * with a refusal (401/403/407/429/451), a server error (5xx) or a firewall / bot-check page, there
 * is no homepage to score: grading the block page would produce a false report. Pure (no I/O).
 *
 * Internal pages are not handled here: a refused internal page is skipped with a note by crawl().
 */
import { AuditError } from "./types";
import { classifyLayer, LAYER_NAME, type Layer } from "./checks/geo/crawler-probe";

/** Statuses that mean "you may not have this page" rather than "this page does not exist". */
export const REFUSAL_STATUSES: ReadonlySet<number> = new Set([401, 403, 407, 429, 451]);

/**
 * A 2xx/other-4xx body only counts as a bot check when it is small: real challenge pages are a
 * few KB of inline script, a real homepage that happens to match a marker is usually far larger.
 */
export const CHALLENGE_MAX_BYTES = 100 * 1024;
/** How much of the body we look at (bounded so the regexes stay linear on hostile input). */
const SCAN_CHARS = 32 * 1024;

/**
 * Markers that only appear on bot-check / block pages, never on a normal page that merely sits
 * behind the same CDN. Deliberately stricter than CHALLENGE_BODY in crawler-probe.ts: that one
 * compares against a known-good baseline; here a match on a 200 response throws the audit away.
 * Notably NOT included: "challenge-platform" (Cloudflare injects its bot script on normal pages),
 * g-recaptcha / h-captcha (contact forms), and any phrase in body copy.
 */
const STRONG_CHALLENGE =
  /_cf_chl_opt|<title>\s{0,20}(?:just a moment\.{0,3}|attention required! \| cloudflare|access denied|security check|you have been blocked|ddos-guard|one moment, please\.{0,3})\s{0,20}<\/title>|captcha-delivery\.com|incapsula incident id|sucuri website firewall\s{0,5}-\s{0,5}(?:access denied|cloudproxy)|access to this site has been limited by the site owner/i;

export type RefusalKind = "challenge" | "refused" | "rate_limited" | "server_error";

export interface HomepageRefusal {
  kind: RefusalKind;
  status: number;
  /** the firewall / CDN we think answered, when we can name it */
  layer: Layer | null;
  layerName: string | null;
}

export interface HomepageResponse {
  status: number;
  /** lower-cased header names */
  headers: Record<string, string>;
  text: string;
}

function headerChallenge(headers: Record<string, string>): boolean {
  if ((headers["cf-mitigated"] ?? "").toLowerCase().includes("challenge")) return true;
  return (headers["x-vercel-mitigated"] ?? "").toLowerCase().trim() === "challenge";
}

/** True when the response is a bot check / block page (strict: safe to apply to a 200). */
export function isChallengePage(res: HomepageResponse): boolean {
  if (headerChallenge(res.headers)) return true;
  if (res.text.length > CHALLENGE_MAX_BYTES) return false;
  return STRONG_CHALLENGE.test(res.text.slice(0, SCAN_CHARS));
}

/** Loose markers, only used to word an already-refused response (never to decide on a 200). */
const LOOSE_CHALLENGE = /challenge-platform|cf-chl|verify you are human|are you a robot/i;

/**
 * Classify the homepage response our crawler got. Returns null for a page we should audit
 * (including 404/410 and other 4xx: those keep the existing "homepage answered with status" note).
 */
export function detectHomepageRefusal(res: HomepageResponse): HomepageRefusal | null {
  const { status } = res;
  const strong = isChallengePage(res);
  const refusedStatus = REFUSAL_STATUSES.has(status) || status >= 500;
  if (!refusedStatus && !strong) return null;

  const challenge = strong || (status >= 400 && LOOSE_CHALLENGE.test(res.text.slice(0, SCAN_CHARS)));
  const kind: RefusalKind = challenge
    ? "challenge"
    : status === 429
      ? "rate_limited"
      : status >= 500
        ? "server_error"
        : "refused";

  // Name the layer only when the response itself points at a firewall / CDN. A plain 5xx is
  // usually the site's own server, so we don't blame the CDN in front of it.
  let layer: Layer | null = null;
  if (kind !== "server_error") {
    const c = classifyLayer({ method: "GET", status, headers: res.headers, body: res.text.slice(0, 20_000), size: res.text.length });
    layer = c.layer === "host" ? null : c.layer;
  }
  return { kind, status, layer, layerName: layer ? LAYER_NAME[layer] : null };
}

const ALLOW_HINT = "If it is your site, allow the user agent seenhqbot";

/** The sentence the visitor sees. Plain English, names the layer when we know it. */
export function refusalMessage(r: HomepageRefusal): string {
  const via = r.layerName ? `, looks like ${r.layerName}` : "";
  switch (r.kind) {
    case "challenge":
      return `This site showed our crawler a bot check (HTTP ${r.status}${via}) instead of its homepage, so we can't audit it from outside. ${ALLOW_HINT}, then run the audit again.`;
    case "rate_limited":
      return `This site is limiting how often our crawler can visit (HTTP 429${via}), so we can't audit it right now. Please try again in a few minutes. ${ALLOW_HINT} if this keeps happening.`;
    case "server_error":
      return `This site answered our crawler with a server error (HTTP ${r.status}), so there was no homepage to audit. It may be down or overloaded, or a firewall may be refusing automated visitors. Please try again later. ${ALLOW_HINT} and check that the homepage loads.`;
    default:
      return `This site refused our crawler (HTTP ${r.status}${via}). We can't audit it from outside. ${ALLOW_HINT} or try again later.`;
  }
}

/**
 * AuditError("unreachable") whose message is written for the visitor (the API passes it through
 * instead of its generic unreachable copy). Same name and code as any AuditError.
 */
export class SiteRefusedError extends AuditError {
  /** marker the API route checks (works across module copies, unlike instanceof) */
  readonly userFacing = true as const;
  readonly refusal: HomepageRefusal;
  constructor(refusal: HomepageRefusal) {
    super("unreachable", refusalMessage(refusal));
    this.refusal = refusal;
  }
}
