import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { getServerEnv, isProduction } from "./env";

/**
 * Stateless sealing for the email gate (ADR-009).
 *
 * token = base64url( version(1) | iv(12) | authTag(16) | ciphertext )
 * plaintext = deflateRaw(JSON.stringify({ exp, data }))
 * key = SHA-256(AUDIT_SEAL_SECRET); without a secret a random per-process key is used (warned once),
 * which means seals only unlock on the same server instance — fine for dev, not for production.
 */

const VERSION = 1;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = 1 + IV_BYTES + TAG_BYTES;
export const SEAL_TTL_MS = 2 * 60 * 60 * 1000;
/** Guard against decompression blow-ups (payload is authenticated, but be defensive anyway). */
const MAX_INFLATED_BYTES = 8 * 1024 * 1024;

let processKey: Buffer | null = null;
let warnedKey = false;

function getKey(): Buffer {
  const secret = getServerEnv().AUDIT_SEAL_SECRET;
  if (secret) return createHash("sha256").update(secret, "utf8").digest();

  if (!warnedKey) {
    warnedKey = true;
    const msg =
      "[security] AUDIT_SEAL_SECRET is not set; using a random per-process key. " +
      "Sealed audit results will not unlock after a restart or on another instance.";
    if (isProduction()) console.error(msg);
    else console.warn(msg);
  }
  processKey ??= randomBytes(32);
  return processKey;
}

interface SealEnvelope {
  exp: number;
  data: unknown;
}

export interface SealOptions {
  /** override "now" (ms since epoch); for tests */
  now?: number;
  /** lifetime in ms, default 2 h */
  ttlMs?: number;
}

export function seal(data: unknown, opts: SealOptions = {}): string {
  const now = opts.now ?? Date.now();
  const envelope: SealEnvelope = { exp: now + (opts.ttlMs ?? SEAL_TTL_MS), data };
  const plaintext = deflateRawSync(Buffer.from(JSON.stringify(envelope), "utf8"));

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([Buffer.from([VERSION]), iv, tag, ciphertext]).toString("base64url");
}

/**
 * Returns the sealed data, or null when the token is malformed, tampered with, sealed with
 * another key, or expired. Never throws.
 */
export function unseal<T = unknown>(token: string, opts: Pick<SealOptions, "now"> = {}): T | null {
  try {
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
    const raw = Buffer.from(token, "base64url");
    if (raw.length <= HEADER_BYTES || raw[0] !== VERSION) return null;

    const iv = raw.subarray(1, 1 + IV_BYTES);
    const tag = raw.subarray(1 + IV_BYTES, HEADER_BYTES);
    const ciphertext = raw.subarray(HEADER_BYTES);

    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv, { authTagLength: TAG_BYTES });
    decipher.setAuthTag(tag);
    const compressed = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const json = inflateRawSync(compressed, { maxOutputLength: MAX_INFLATED_BYTES }).toString("utf8");

    const envelope = JSON.parse(json) as Partial<SealEnvelope>;
    if (typeof envelope.exp !== "number" || !("data" in envelope)) return null;
    if ((opts.now ?? Date.now()) > envelope.exp) return null;
    return envelope.data as T;
  } catch {
    return null;
  }
}
