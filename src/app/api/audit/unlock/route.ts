import { after } from "next/server";
import { z } from "zod";
import type { AuditResult } from "@/lib/audit/types";
import { insertLead } from "@/lib/db/leads";
import { notifyTeam } from "@/lib/mailer";
import { jsonError, jsonOk, readJsonBody } from "@/lib/security/http";
import { rateLimitByIp } from "@/lib/security/rate-limit";
import { getClientIp, getUserAgent, hashIp } from "@/lib/security/request";
import { unseal } from "@/lib/security/seal";

// See ../route.ts: with cacheComponents only maxDuration is allowed as segment config.
export const maxDuration = 15;

/** A sealed full report is typically 5–40 KB; leave generous headroom. */
const MAX_SEALED_CHARS = 400_000;
const MAX_BODY_BYTES = 512 * 1024;
const RATE_LIMIT = { limit: 10, windowSec: 60 * 60 } as const;

const bodySchema = z.object({
  sealed: z.string().min(1).max(MAX_SEALED_CHARS).regex(/^[A-Za-z0-9_-]+$/),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  consent: z.literal(true),
});

function looksLikeAuditResult(value: unknown): value is AuditResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<AuditResult>;
  return (
    typeof v.id === "string" &&
    v.version === 1 &&
    typeof v.requestedUrl === "string" &&
    typeof v.finalUrl === "string" &&
    typeof v.scores === "object" &&
    v.scores !== null &&
    Array.isArray(v.issues)
  );
}

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = bodySchema.safeParse(body.value);
  if (!parsed.success) {
    const fields = new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "")));
    if (fields.has("email")) return jsonError(400, "invalid_email", "Enter a valid email address.");
    if (fields.has("consent")) {
      return jsonError(400, "consent_required", "Please agree to receive your report by email to continue.");
    }
    return jsonError(400, "invalid_or_expired", "This report link is invalid or has expired. Please run the audit again.");
  }

  const ip = getClientIp(request.headers);
  const ipHash = hashIp(ip);
  const limited = await rateLimitByIp("unlock", ip, RATE_LIMIT);
  if (!limited.ok) {
    return jsonError(429, "rate_limited", "Too many unlock attempts. Please try again later.", {
      retryAfter: limited.retryAfter,
    });
  }

  const result = unseal<unknown>(parsed.data.sealed);
  if (!looksLikeAuditResult(result)) {
    return jsonError(400, "invalid_or_expired", "This report has expired (reports stay unlockable for 2 hours). Please run the audit again.");
  }

  const { email } = parsed.data;
  const userAgent = getUserAgent(request.headers);

  // Best effort: the user gets their report even if storage fails; the notification below
  // still carries the email so the lead isn't lost.
  let stored = false;
  try {
    stored = (await insertLead({
      email,
      auditId: result.id,
      url: result.finalUrl,
      overallScore: result.scores.overall,
      source: "free_audit",
      consent: true,
      ipHash,
      userAgent,
    })) !== null;
  } catch (error) {
    console.error(`[api/audit/unlock] could not store lead: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  after(() =>
    notifyTeam(
      `New seenhq lead: ${result.hostname}`,
      [
        `Email: ${email}`,
        `Site: ${result.finalUrl}`,
        `Overall score: ${result.scores.overall}/100 (SEO ${result.scores.seo}, GEO ${result.scores.geo}, Performance ${result.scores.performance ?? "n/a"})`,
        `Issues: ${result.issues.length}`,
        `Audit id: ${result.id}`,
        `Stored in database: ${stored ? "yes" : "no"}`,
      ].join("\n"),
    ),
  );

  return jsonOk({ result });
}
