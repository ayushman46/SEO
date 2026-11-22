/**
 * AI insights configuration (ADR-015). Read at call time so tests and the CLI can toggle env.
 * Never log the values returned here.
 */

export const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

/**
 * Defaults verified against https://integrate.api.nvidia.com/v1/models and the docs.api.nvidia.com
 * reference pages on 2026-11-23 (see ADR-015). Both are overridable by env.
 */
export const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
export const DEFAULT_FALLBACK_MODEL = "google/gemma-4-31b-it";

/**
 * Models whose documented request schema has `chat_template_kwargs.enable_thinking` (default true).
 * We turn reasoning off for these: it costs seconds we don't have and the output is JSON anyway.
 * Any other (env-supplied) model gets a plain OpenAI-compatible body with no extensions.
 */
const THINKING_TOGGLE_MODELS = new Set([DEFAULT_MODEL, DEFAULT_FALLBACK_MODEL]);

export function supportsThinkingToggle(model: string): boolean {
  return THINKING_TOGGLE_MODELS.has(model);
}

/** Model ids are sent to the provider as-is; keep them to a safe charset. */
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._/:-]{0,127}$/;

export interface AiConfig {
  apiKey: string;
  model: string;
  fallbackModel: string | null;
}

/** null when NVIDIA_API_KEY is unset/blank: AI insights are skipped entirely. */
export function getAiConfig(env: Record<string, string | undefined> = process.env): AiConfig | null {
  const apiKey = (env.NVIDIA_API_KEY ?? "").trim();
  if (!apiKey) return null;
  const pick = (v: string | undefined, dflt: string) => {
    const t = (v ?? "").trim();
    return t && MODEL_ID.test(t) ? t : dflt;
  };
  const model = pick(env.NVIDIA_MODEL, DEFAULT_MODEL);
  const fallback = pick(env.NVIDIA_MODEL_FALLBACK, DEFAULT_FALLBACK_MODEL);
  return { apiKey, model, fallbackModel: fallback === model ? null : fallback };
}

export function hasAiKey(env: Record<string, string | undefined> = process.env): boolean {
  return getAiConfig(env) !== null;
}

/* ── Budget (ms) ── */
/** LLM phase never gets more than this. */
export const AI_PHASE_MAX_MS = 20_000;
/** Kept back from the remaining audit budget for assembling the response. */
export const AI_PHASE_RESERVE_MS = 2_000;
/** Skip the LLM phase entirely below this much remaining budget. */
export const AI_PHASE_MIN_REMAINING_MS = 6_000;
/** Don't start a fallback retry with less than this left in the phase. */
export const AI_RETRY_MIN_MS = 4_000;
