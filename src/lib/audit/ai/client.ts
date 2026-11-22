import "server-only";
import { AI_RETRY_MIN_MS, NVIDIA_CHAT_URL, supportsThinkingToggle, type AiConfig } from "./config";

/**
 * Minimal OpenAI-compatible chat client for the NVIDIA API catalog (ADR-015).
 * fetch only, no SDK. Never throws, never logs the key, the prompt or the response.
 */

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export type ChatFailure = "aborted" | "timeout" | "rate_limited" | "server_error" | "http_error" | "bad_response";

export type ChatResult =
  | { ok: true; model: string; content: string }
  | { ok: false; reason: ChatFailure; status?: number };

export interface ChatOptions {
  config: AiConfig;
  messages: ChatMessage[];
  maxTokens: number;
  /** absolute epoch-ms deadline for this call including any retry */
  deadline: number;
  signal?: AbortSignal;
  /** injectable for tests; defaults to global fetch */
  fetchImpl?: typeof fetch;
}

/** Upper bound on the response body we will read (a 2k-token answer is ~10 KB). */
const MAX_RESPONSE_BYTES = 256 * 1024;

async function readCapped(res: Response): Promise<string | null> {
  if (!res.body) return null;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * Remove <think>...</think> blocks with indexOf (linear). A lazy regex here was quadratic on a
 * reply full of unclosed "<think>" tags (R3 regex sweep).
 */
export function stripThinking(content: string): string {
  const lower = content.toLowerCase();
  let out = "";
  let i = 0;
  for (;;) {
    const open = lower.indexOf("<think>", i);
    if (open < 0) break;
    const close = lower.indexOf("</think>", open + 7);
    if (close < 0) break;
    out += content.slice(i, open);
    i = close + 8;
  }
  return out + content.slice(i);
}

/** Pull the assistant text out of an OpenAI-style chat completion. */
export function extractContent(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const msg = (choices[0] as { message?: { content?: unknown } } | undefined)?.message;
  const content = msg?.content;
  if (typeof content !== "string") return null;
  // Some reasoning models inline their thinking; we only want the answer.
  const stripped = stripThinking(content).trim();
  return stripped || null;
}

async function callOnce(
  model: string,
  opts: ChatOptions,
): Promise<ChatResult> {
  const remaining = opts.deadline - Date.now();
  if (remaining <= 0) return { ok: false, reason: "timeout" };
  if (opts.signal?.aborted) return { ok: false, reason: "aborted" };
  const timeout = AbortSignal.timeout(remaining);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: opts.maxTokens,
    stream: false,
  };
  if (supportsThinkingToggle(model)) body.chat_template_kwargs = { enable_thinking: false };

  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(NVIDIA_CHAT_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${opts.config.apiKey}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      signal,
      cache: "no-store",
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      const reason: ChatFailure =
        res.status === 429 ? "rate_limited" : res.status >= 500 ? "server_error" : "http_error";
      return { ok: false, reason, status: res.status };
    }
    const text = await readCapped(res);
    if (text === null) return { ok: false, reason: signal.aborted ? abortReason(opts.signal) : "bad_response" };
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, reason: "bad_response" };
    }
    const content = extractContent(json);
    if (!content) return { ok: false, reason: "bad_response" };
    return { ok: true, model, content };
  } catch {
    return { ok: false, reason: signal.aborted ? abortReason(opts.signal) : "server_error" };
  }
}

function abortReason(caller?: AbortSignal): ChatFailure {
  return caller?.aborted ? "aborted" : "timeout";
}

/**
 * One call to the primary model; on 429/5xx (or a network error) one retry with the fallback
 * model, if time allows. Resolves to a tagged result, never rejects.
 */
export async function chatComplete(opts: ChatOptions): Promise<ChatResult> {
  try {
    const first = await callOnce(opts.config.model, opts);
    if (first.ok) return first;
    const retryable = first.reason === "rate_limited" || first.reason === "server_error";
    const fallback = opts.config.fallbackModel;
    if (!retryable || !fallback || opts.deadline - Date.now() < AI_RETRY_MIN_MS || opts.signal?.aborted) {
      return first;
    }
    return await callOnce(fallback, opts);
  } catch {
    return { ok: false, reason: "bad_response" };
  }
}
