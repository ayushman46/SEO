/**
 * Validation + post-processing of model output (pure). The model read untrusted page text, so
 * its output is untrusted too: every field is Zod-validated, length-capped and checked for HTML,
 * foreign URLs and contact details that do not appear in the input. Anything that fails is
 * dropped (field → null, item → removed); a broken required field rejects the whole answer.
 */
import { z } from "zod";
import type { AiDrafts, AiFact, AiQuestion, Answered, FactStatus } from "../types";
import { isValidLlmsTxt } from "../checks/geo/llms-txt";
import { FACT_KEYS, FACT_LABELS, type FactKey } from "./prompt";

/* ── Caps (characters) ── */
export const CAPS = {
  readback: 700,
  businessType: 80,
  factValue: 300,
  question: 200,
  note: 300,
  title: 80,
  metaDescription: 200,
  llmsTxt: 4_000,
  organizationJsonLd: 4_000,
  answerParagraph: 900,
} as const;
export const MAX_QUESTIONS = 8;
export const MIN_QUESTIONS = 3;
/** We never parse more than this much model text. */
export const MAX_CONTENT_CHARS = 60_000;

export interface Guard {
  /** audited hostname (www. is ignored when comparing) */
  hostname: string;
  /** the exact data section we sent: the only source of facts the model may use */
  input: string;
  /** URLs of the crawled pages (valid sourceUrl targets) */
  pageUrls: string[];
  /** site already has a valid llms.txt → never draft one */
  hasLlmsTxt: boolean;
  /**
   * Off-host URLs the site itself links to from a real <a href> (social/profile links). Off-host
   * URLs that merely appear in page text are NOT allowed: that is where an injection would put them.
   */
  externalLinks?: string[];
}

/* ── JSON extraction ── */

/** Parse the first JSON object in a model reply (tolerates code fences and chatter). */
export function parseModelJson(content: string): unknown {
  if (typeof content !== "string" || content.length > MAX_CONTENT_CHARS) return null;
  const t = content.replace(/```(?:json)?/gi, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const v: unknown = JSON.parse(t.slice(start, end + 1));
    return typeof v === "object" && v !== null && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/* ── Text guards ── */

const CONTROL = /[\u0000-\u0008\u000b-\u000c\u000e-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/g;
const HTML_TAG = /<\s*\/?\s*[a-z!?][^>]*>/i;
const BAD_SCHEME = /\b(javascript|data|vbscript|file):/i;
const URL_RE = /\bhttps?:\/\/[^\s<>"'`)\]}]+|\bwww\.[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s<>"'`)\]}]*/gi;
const EMAIL_RE = /(?<![a-z0-9._%+-])[a-z0-9._%+-]{1,64}@[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63}){0,8}\.[a-z]{2,24}/gi;
const PHONE_RE = /(?<![\d+])\+?\(?\d[\d\s().-]{5,22}\d/g;

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");

function digitsOf(s: string): string {
  return s.replace(/\D/g, "");
}

/** Phone-like numbers (7–15 digits) in a string, digits only. */
export function phonesIn(s: string): string[] {
  return (s.match(PHONE_RE) ?? []).map(digitsOf).filter((d) => d.length >= 7 && d.length <= 15);
}

export function emailsIn(s: string): string[] {
  return (s.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase());
}

function trimUrl(u: string): string {
  return u.replace(/[.,;:!?]+$/, "");
}

/** URL allowed in output: on the audited host, or one of the site's own profile links. */
function urlAllowed(raw: string, g: Guard, extraHosts: string[] = []): boolean {
  const u = trimUrl(raw);
  let parsed: URL;
  try {
    parsed = new URL(/^www\./i.test(u) ? `https://${u}` : u);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  const host = bareHost(parsed.hostname);
  if (host === bareHost(g.hostname)) return true;
  if (extraHosts.includes(host)) return true;
  const norm = (x: string) => x.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/+$/, "").toLowerCase();
  const target = norm(u);
  return (g.externalLinks ?? []).some((l) => norm(l) === target);
}

/** Contact details in `s` that are not in the input (i.e. made up). */
let memo: { input: string; emails: Set<string>; phones: string[] } | null = null;
function inputContacts(input: string): { emails: Set<string>; phones: string[] } {
  if (memo?.input !== input) memo = { input, emails: new Set(emailsIn(input)), phones: phonesIn(input) };
  return memo;
}

export function hasFabricatedContact(s: string, g: Guard): boolean {
  const known = inputContacts(g.input);
  const inputEmails = known.emails;
  for (const e of emailsIn(s)) if (!inputEmails.has(e)) return true;
  const phones = phonesIn(s);
  if (phones.length === 0) return false;
  const inputPhones = known.phones;
  for (const p of phones) {
    const tail = p.slice(-9);
    const known = inputPhones.some((q) => q === p || (tail.length >= 7 && q.endsWith(tail)) || p.endsWith(q.slice(-9)));
    if (!known) return true;
  }
  return false;
}

interface TextRules {
  max: number;
  min?: number;
  multiline?: boolean;
  /** "none" = no URLs at all; "site" = only on-host or present in the input */
  urls?: "none" | "site";
  extraHosts?: string[];
}

/** Returns the cleaned text, or null when the field must be dropped. */
export function safeText(value: unknown, rules: TextRules, g: Guard): string | null {
  if (typeof value !== "string") return null;
  let s = value.replace(/\r\n?/g, "\n").replace(CONTROL, "");
  s = rules.multiline
    ? s
        .split("\n")
        .map((l) => l.replace(/[ \t]+/g, " ").trimEnd())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    : s.replace(/\s+/g, " ").trim();
  if (!s || s.length < (rules.min ?? 1) || s.length > rules.max) return null;
  if (HTML_TAG.test(s) || BAD_SCHEME.test(s)) return null;
  const urls = s.match(URL_RE) ?? [];
  if (urls.length && (rules.urls ?? "site") === "none") return null;
  for (const u of urls) if (!urlAllowed(u, g, rules.extraHosts)) return null;
  if (hasFabricatedContact(s, g)) return null;
  return s;
}

/** sourceUrl must be one of the crawled pages; returns that page's URL as crawled. */
export function matchPageUrl(value: unknown, g: Guard): string | null {
  if (typeof value !== "string" || value.length > 2_048) return null;
  const key = (u: string) => {
    try {
      const p = new URL(u.trim());
      if (p.protocol !== "http:" && p.protocol !== "https:") return null;
      return `${bareHost(p.hostname)}${p.pathname.replace(/\/+$/, "") || ""}${p.search}`;
    } catch {
      return null;
    }
  };
  const k = key(value);
  if (!k) return null;
  return g.pageUrls.find((u) => key(u) === k) ?? null;
}

/* ── Zod shapes ── */

const lower = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : v);
const FactStatusZ = z.preprocess(lower, z.enum(["clear", "vague", "missing"]));
const AnsweredZ = z.preprocess(lower, z.enum(["yes", "partly", "no"]));

const FactZ = z.object({
  key: z.preprocess(lower, z.enum(FACT_KEYS)),
  value: z.string().max(2_000).nullish(),
  status: FactStatusZ,
});

const QuestionZ = z.object({
  question: z.string().min(8).max(1_000),
  answered: AnsweredZ,
  sourceUrl: z.string().max(2_048).nullish(),
  note: z.string().max(2_000).nullish(),
});

export const AnalysisZ = z.object({
  readback: z.string().min(20).max(4_000),
  businessType: z.string().max(1_000).nullish(),
  local: z.boolean().nullish(),
  facts: z.array(z.unknown()).min(1).max(30),
  questions: z.array(z.unknown()).min(1).max(30),
});

export const DraftsZ = z.object({
  title: z.string().max(2_000).nullish(),
  metaDescription: z.string().max(4_000).nullish(),
  llmsTxt: z.string().max(20_000).nullish(),
  organizationJsonLd: z.union([z.string().max(20_000), z.record(z.string(), z.unknown())]).nullish(),
  answerParagraph: z.string().max(5_000).nullish(),
});

export interface Analysis {
  readback: string;
  businessType: string | null;
  local: boolean;
  facts: AiFact[];
  questions: AiQuestion[];
}

/** Validate call 1. null = reject the whole analysis (AI insights unavailable). */
export function validateAnalysis(raw: unknown, g: Guard): Analysis | null {
  const parsed = AnalysisZ.safeParse(raw);
  if (!parsed.success) return null;
  const a = parsed.data;

  const readback = safeText(a.readback, { max: CAPS.readback, min: 20 }, g);
  if (!readback) return null;
  const businessType = a.businessType ? safeText(a.businessType, { max: CAPS.businessType, urls: "none" }, g) : null;

  const byKey = new Map<FactKey, AiFact>();
  for (const item of a.facts) {
    const f = FactZ.safeParse(item);
    if (!f.success || byKey.has(f.data.key)) continue;
    let status: FactStatus = f.data.status;
    let value = status === "missing" || !f.data.value ? null : safeText(f.data.value, { max: CAPS.factValue }, g);
    if (status === "missing") value = null;
    // The UI shows the value as evidence; "clear" without usable evidence is at best vague.
    if (value === null && status !== "missing") status = "vague";
    byKey.set(f.data.key, { key: f.data.key, label: FACT_LABELS[f.data.key], value, status });
  }
  if (byKey.size < 5) return null;
  const facts: AiFact[] = FACT_KEYS.map(
    (k) => byKey.get(k) ?? { key: k, label: FACT_LABELS[k], value: null, status: "missing" as const },
  );

  const seen = new Set<string>();
  const questions: AiQuestion[] = [];
  for (const item of a.questions) {
    if (questions.length >= MAX_QUESTIONS) break;
    const q = QuestionZ.safeParse(item);
    if (!q.success) continue;
    const question = safeText(q.data.question, { max: CAPS.question, min: 8, urls: "none" }, g);
    if (!question || seen.has(question.toLowerCase())) continue;
    const note = q.data.note ? safeText(q.data.note, { max: CAPS.note, urls: "none" }, g) : null;
    if (!note) continue;
    const answered: Answered = q.data.answered;
    const sourceUrl = answered === "no" ? null : matchPageUrl(q.data.sourceUrl, g);
    seen.add(question.toLowerCase());
    questions.push({ question, answered, sourceUrl, note });
  }
  if (questions.length < MIN_QUESTIONS) return null;

  return { readback, businessType: businessType ?? null, local: a.local === true, facts, questions };
}

/* ── Drafts ── */

const MAX_JSONLD_DEPTH = 6;

function checkJsonLdValues(v: unknown, g: Guard, depth: number): boolean {
  if (depth > MAX_JSONLD_DEPTH) return false;
  if (v === null || typeof v === "number" || typeof v === "boolean") return true;
  if (typeof v === "string") {
    if (v.length > 1_000) return false;
    return safeText(v, { max: 1_000, extraHosts: ["schema.org"] }, g) !== null || v.trim() === "";
  }
  if (Array.isArray(v)) return v.length <= 30 && v.every((x) => checkJsonLdValues(x, g, depth + 1));
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length > 40) return false;
    return entries.every(
      ([k, x]) => k.length <= 60 && /^@?[A-Za-z][A-Za-z0-9_-]*$/.test(k) && checkJsonLdValues(x, g, depth + 1),
    );
  }
  return false;
}

/** JSON.parse the model's JSON-LD, check every value, re-serialise it ourselves. */
export function sanitizeJsonLd(value: unknown, g: Guard): string | null {
  let obj: unknown = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value.replace(/```(?:json)?/gi, "").trim());
    } catch {
      return null;
    }
  }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
  const rec = { ...(obj as Record<string, unknown>) };
  const type = rec["@type"];
  const typeOk =
    (typeof type === "string" && /^[A-Za-z]{2,60}$/.test(type)) ||
    (Array.isArray(type) && type.length > 0 && type.length <= 3 && type.every((t) => typeof t === "string" && /^[A-Za-z]{2,60}$/.test(t)));
  if (!typeOk) return null;
  if (typeof rec.name !== "string" || !rec.name.trim()) return null;
  rec["@context"] = "https://schema.org";
  if (!checkJsonLdValues(rec, g, 0)) return null;
  const out = JSON.stringify({ "@context": rec["@context"], ...rec }, null, 2);
  return out.length <= CAPS.organizationJsonLd ? out : null;
}

export function validateDrafts(raw: unknown, g: Guard): AiDrafts | null {
  const parsed = DraftsZ.safeParse(raw);
  if (!parsed.success) return null;
  const d = parsed.data;
  const llms = !g.hasLlmsTxt && d.llmsTxt ? safeText(d.llmsTxt, { max: CAPS.llmsTxt, multiline: true }, g) : null;
  return {
    title: d.title ? safeText(d.title, { max: CAPS.title, min: 10, urls: "none" }, g) : null,
    metaDescription: d.metaDescription
      ? safeText(d.metaDescription, { max: CAPS.metaDescription, min: 40, urls: "none" }, g)
      : null,
    llmsTxt: llms && isValidLlmsTxt(llms) ? llms : null,
    organizationJsonLd: d.organizationJsonLd ? sanitizeJsonLd(d.organizationJsonLd, g) : null,
    answerParagraph: d.answerParagraph
      ? safeText(d.answerParagraph, { max: CAPS.answerParagraph, min: 40 }, g)
      : null,
  };
}

export const EMPTY_DRAFTS: AiDrafts = {
  title: null,
  metaDescription: null,
  llmsTxt: null,
  organizationJsonLd: null,
  answerParagraph: null,
};
