import { auditEmailGate, auditErrors } from "@/content/audit";
import type { AuditResult, PartialAuditReport } from "@/lib/audit/types";

/** A user-facing failure, already mapped to copy. */
export interface FlowError {
  code: string;
  message: string;
  /** seconds until a retry is allowed (429 only) */
  retryAfter?: number;
  /** epoch ms when the error was received, to compute the retry time */
  at: number;
}

const SITE_CODES = new Set(["invalid_url", "blocked_host", "unreachable", "timeout", "not_html", "too_large"]);

/** Whether a "Try again" with the same input is likely to help. */
export function isRetryable(code: string): boolean {
  return code === "unreachable" || code === "timeout" || code === "generic" || code === "internal_error";
}

export function isSiteError(code: string): boolean {
  return SITE_CODES.has(code);
}

/** Maps any API error code to copy from src/content/audit.ts. Unknown codes fall back to the generic message. */
export function toFlowError(code: string, retryAfter?: number): FlowError {
  let message: string;
  switch (code) {
    case "invalid_url":
    case "blocked_host":
    case "unreachable":
    case "timeout":
    case "not_html":
    case "too_large":
    case "rate_limited":
    case "invalid_or_expired":
      message = auditErrors[code];
      break;
    case "invalid_email":
      message = auditEmailGate.invalidEmail;
      break;
    case "consent_required":
      message = auditEmailGate.consentRequired;
      break;
    default:
      message = auditErrors.generic;
      code = "generic";
  }
  return {
    code,
    message,
    retryAfter: typeof retryAfter === "number" && Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    at: Date.now(),
  };
}

function readError(body: unknown, res: Response): FlowError {
  const err = (body as { error?: { code?: unknown; retryAfter?: unknown } } | null)?.error;
  const code = typeof err?.code === "string" ? err.code : res.status === 429 ? "rate_limited" : "generic";
  let retryAfter = typeof err?.retryAfter === "number" ? err.retryAfter : undefined;
  if (retryAfter === undefined) {
    const header = Number(res.headers.get("retry-after"));
    if (Number.isFinite(header) && header > 0) retryAfter = header;
  }
  return toFlowError(code, retryAfter);
}

async function postJson(url: string, payload: unknown, signal?: AbortSignal): Promise<{ res: Response; body: unknown }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  const body: unknown = await res.json().catch(() => null);
  return { res, body };
}

function isPartial(v: unknown): v is { partial: PartialAuditReport; sealed: string } {
  const o = v as { partial?: PartialAuditReport; sealed?: unknown } | null;
  return (
    !!o &&
    typeof o.sealed === "string" &&
    !!o.partial &&
    typeof o.partial.hostname === "string" &&
    typeof o.partial.scores === "object" &&
    Array.isArray(o.partial.topIssues) &&
    Array.isArray(o.partial.lockedIssues) &&
    Array.isArray(o.partial.checks)
  );
}

function isFull(v: unknown): v is { result: AuditResult } {
  const r = (v as { result?: AuditResult } | null)?.result;
  return !!r && typeof r.hostname === "string" && Array.isArray(r.issues) && Array.isArray(r.checks) && Array.isArray(r.pages);
}

export type ApiOutcome<T> = { ok: true; data: T } | { ok: false; error: FlowError };

/** POST /api/audit. Throws only on abort/network failure (callers decide what that means). */
export async function requestAudit(
  url: string,
  signal: AbortSignal,
): Promise<ApiOutcome<{ partial: PartialAuditReport; sealed: string }>> {
  const { res, body } = await postJson("/api/audit", { url }, signal);
  if (res.ok && isPartial(body)) return { ok: true, data: body };
  return { ok: false, error: res.ok ? toFlowError("generic") : readError(body, res) };
}

/** POST /api/audit/unlock. */
export async function requestUnlock(
  sealed: string,
  email: string,
  signal?: AbortSignal,
): Promise<ApiOutcome<AuditResult>> {
  const { res, body } = await postJson("/api/audit/unlock", { sealed, email, consent: true }, signal);
  if (res.ok && isFull(body)) return { ok: true, data: body.result };
  return { ok: false, error: res.ok ? toFlowError("generic") : readError(body, res) };
}

/** "about 12 minutes (around 14:32)" style retry hint inputs. Client-only (uses the clock). */
export function retryInfo(err: FlowError): { minutes: number; at: string } | null {
  if (!err.retryAfter) return null;
  const when = new Date(err.at + err.retryAfter * 1000);
  return {
    minutes: Math.max(1, Math.ceil(err.retryAfter / 60)),
    at: when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

/** Loose client-side email check; the server validates for real. */
export function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.trim().length <= 254;
}
