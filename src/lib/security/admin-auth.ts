/**
 * HTTP Basic auth check for /admin (user "admin", password = ADMIN_PASSWORD).
 * Used by src/proxy.ts and, as defense in depth, by the admin page itself.
 *
 * No `server-only` import and only Web APIs (crypto.subtle, atob, TextDecoder) so it runs in
 * Proxy as well as in Server Components.
 */

export const ADMIN_USER = "admin";
export const ADMIN_REALM = "seenhq admin";
/** Shorter passwords are treated as "not configured" (→ /admin is a 404). */
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

export function getAdminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length >= ADMIN_PASSWORD_MIN_LENGTH ? pw : null;
}

async function sha256(input: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)));
}

/** Constant-time comparison: both sides are hashed to fixed length first, then XOR-accumulated. */
async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

function decodeBasic(authorization: string): { user: string; pass: string } | null {
  const match = /^Basic\s+([A-Za-z0-9+/=]+)\s*$/i.exec(authorization);
  if (!match || match[1].length > 1024) return null;
  try {
    const binary = atob(match[1]);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const sep = decoded.indexOf(":");
    if (sep < 0) return null;
    return { user: decoded.slice(0, sep), pass: decoded.slice(sep + 1) };
  } catch {
    return null;
  }
}

/** True only when ADMIN_PASSWORD is configured and the header carries matching credentials. */
export async function isAuthorizedAdmin(
  authorization: string | null | undefined,
  password: string | null = getAdminPassword(),
): Promise<boolean> {
  if (!password || !authorization) return false;
  const creds = decodeBasic(authorization);
  if (!creds) return false;
  return constantTimeEqual(`${creds.user}:${creds.pass}`, `${ADMIN_USER}:${password}`);
}
