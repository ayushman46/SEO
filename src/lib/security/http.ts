import "server-only";

/** Shared helpers for JSON route handlers: uniform `{ error: { code, message } }` bodies. */

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function jsonOk(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return Response.json(body, { status: init.status ?? 200, headers: { ...NO_STORE, ...init.headers } });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  extra: { retryAfter?: number; headers?: Record<string, string> } = {},
): Response {
  const headers: Record<string, string> = { ...NO_STORE, ...extra.headers };
  const error: { code: string; message: string; retryAfter?: number } = { code, message };
  if (extra.retryAfter !== undefined) {
    error.retryAfter = extra.retryAfter;
    headers["Retry-After"] = String(extra.retryAfter);
  }
  return Response.json({ error }, { status, headers });
}

export type ReadJsonResult = { ok: true; value: unknown } | { ok: false; response: Response };

/**
 * Reads a JSON body with a hard byte cap. Rejects non-JSON content types (415), oversized bodies
 * (413, checked against Content-Length first and then while streaming) and malformed JSON (400).
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<ReadJsonResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/(?:[\w.+-]+\+)?json\b/i.test(contentType.trim())) {
    return { ok: false, response: jsonError(415, "unsupported_media_type", "Send the request as JSON.") };
  }

  const tooLarge = () => ({
    ok: false as const,
    response: jsonError(413, "payload_too_large", "The request body is too large."),
  });

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return tooLarge();
  if (!request.body) {
    return { ok: false, response: jsonError(400, "invalid_json", "The request body must be valid JSON.") };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return tooLarge();
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, response: jsonError(400, "invalid_json", "The request body could not be read.") };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { ok: false, response: jsonError(400, "invalid_json", "The request body must be valid JSON.") };
  }
}
