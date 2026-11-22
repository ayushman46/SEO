import { z } from "zod";
import { AuditError, normalizeAuditUrl, runAudit, toPartialReport } from "@/lib/audit";
import type { AuditError as AuditErrorShape, AuditResult, PartialAuditReport } from "@/lib/audit/types";
import { insertAudit } from "@/lib/db/audits";
import { jsonError, jsonOk, readJsonBody } from "@/lib/security/http";
import { auditInFlightGuard } from "@/lib/security/concurrency";
import { clientKey, rateLimitByIp } from "@/lib/security/rate-limit";
import { getClientIp, hashIp } from "@/lib/security/request";
import { seal } from "@/lib/security/seal";

/*
 * Route segment config. With `cacheComponents: true` (next.config.ts) Next 16 removes the
 * `dynamic` option and rejects a `runtime` export (Node.js is the only runtime there), so only
 * `maxDuration` is set. POST handlers always run at request time.
 */
export const maxDuration = 60;

/**
 * Crawl budget is measured from the start of the request, so time spent on the rate limiter (a
 * slow or unreachable DB) is not added on top. Leaves ~10 s of the 60 s for persistence + sealing.
 */
const REQUEST_BUDGET_MS = 50_000;

const MAX_BODY_BYTES = 4 * 1024;
const RATE_LIMIT = { limit: 5, windowSec: 60 * 60 } as const;

const bodySchema = z.object({
  url: z.string().trim().min(1).max(2048),
});

type AuditErrorCode = AuditErrorShape["code"];

const AUDIT_ERROR_MAP: Record<AuditErrorCode, { status: number; message: string }> = {
  invalid_url: { status: 400, message: "That doesn't look like a valid website address. Try something like example.com." },
  blocked_host: { status: 422, message: "We can only audit public websites. That address points to a private or reserved network." },
  unreachable: { status: 422, message: "We couldn't reach that website. Check the address and that the site is online, then try again." },
  not_html: { status: 422, message: "That address didn't return a web page (HTML), so there's nothing to audit." },
  too_large: { status: 422, message: "That page is too large for the free audit to process." },
  timeout: { status: 504, message: "The website took too long to respond, so the audit timed out. Please try again in a moment." },
};

/** Recognizes the engine's AuditError (also across module copies, by name + known code). */
function auditErrorCode(error: unknown): AuditErrorCode | null {
  const candidate: unknown =
    error instanceof AuditError || (error instanceof Error && error.name === "AuditError")
      ? (error as { code?: unknown }).code
      : undefined;
  return typeof candidate === "string" && Object.hasOwn(AUDIT_ERROR_MAP, candidate)
    ? (candidate as AuditErrorCode)
    : null;
}

function auditErrorResponse(code: AuditErrorCode): Response {
  const mapped = AUDIT_ERROR_MAP[code];
  return jsonError(mapped.status, code, mapped.message);
}

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = bodySchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError(400, "invalid_url", "Enter a website address (up to 2048 characters).");
  }

  let normalized: string;
  try {
    normalized = normalizeAuditUrl(parsed.data.url);
  } catch (error) {
    const code = auditErrorCode(error) ?? "invalid_url";
    // The engine's invalid_url messages are user-facing and specific (scheme, port, credentials).
    if (code === "invalid_url" && error instanceof Error && error.name === "AuditError" && error.message) {
      return jsonError(400, code, error.message);
    }
    return auditErrorResponse(code);
  }

  const ip = getClientIp(request.headers);
  const ipHash = hashIp(ip);

  // Per-instance in-flight cap (ADR-013). Taken before the rate limiter so a busy instance does
  // not spend the client's quota, and released only after the whole audit has finished.
  const slot = auditInFlightGuard().tryAcquire(clientKey(ip));
  if (!slot.ok) {
    return jsonError(
      503,
      "server_busy",
      slot.reason === "key_busy"
        ? "An audit from your network is already running. Please wait for it to finish."
        : "We're running a lot of audits right now. Please try again in a minute.",
      { retryAfter: slot.reason === "key_busy" ? 30 : 60 },
    );
  }
  try {
    return await runLimitedAudit(request, normalized, ip, ipHash, startedAt);
  } finally {
    slot.release();
  }
}

async function runLimitedAudit(
  request: Request,
  normalized: string,
  ip: string,
  ipHash: string,
  startedAt: number,
): Promise<Response> {
  const limited = await rateLimitByIp("audit", ip, RATE_LIMIT);
  if (!limited.ok) {
    return jsonError(
      429,
      "rate_limited",
      `You've run ${limited.limit} free audits in the last hour. Please try again later.`,
      { retryAfter: limited.retryAfter },
    );
  }

  let result: AuditResult;
  try {
    // runAudit clamps the budget to at least 5 s.
    result = await runAudit(normalized, {
      signal: request.signal,
      budgetMs: REQUEST_BUDGET_MS - (Date.now() - startedAt),
    });
  } catch (error) {
    const code = auditErrorCode(error);
    if (code) return auditErrorResponse(code);
    if (request.signal.aborted) return jsonError(499, "client_closed_request", "The request was cancelled.");
    console.error(`[api/audit] unexpected failure: ${error instanceof Error ? error.message : "unknown error"}`);
    return jsonError(500, "internal_error", "Something went wrong while running the audit. Please try again.");
  }

  // Best effort: persistence must never fail the response.
  try {
    await insertAudit({ result, ipHash });
  } catch (error) {
    console.error(`[api/audit] could not store audit: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  let sealed: string;
  let partial: PartialAuditReport;
  try {
    partial = toPartialReport(result);
    sealed = seal(result);
  } catch (error) {
    console.error(`[api/audit] could not prepare response: ${error instanceof Error ? error.message : "unknown error"}`);
    return jsonError(500, "internal_error", "Something went wrong while preparing your report. Please try again.");
  }

  return jsonOk({ partial, sealed });
}
