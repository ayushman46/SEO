import "server-only";
import { promises as dns } from "node:dns";
import { AuditError } from "../types";
import { classifyIp, isIpLiteral } from "./ip";

export interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

const DNS_TIMEOUT_MS = 5_000;

function stripBrackets(host: string): string {
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}

/**
 * Resolve `hostname` and make sure EVERY address is public. Returns the address we
 * will pin the socket to (IPv4 preferred for connectivity). Throws AuditError.
 */
export async function resolvePublicAddress(hostname: string, signal?: AbortSignal): Promise<ResolvedAddress> {
  const host = stripBrackets(hostname);

  if (isIpLiteral(host)) {
    if (!classifyIp(host).public) {
      throw new AuditError("blocked_host", "That address points to a private network and can't be checked.");
    }
    return { address: host, family: host.includes(":") ? 6 : 4 };
  }

  if (signal?.aborted) throw new AuditError("timeout", `Looking up ${host} took too long.`);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  let records: { address: string; family: number }[];
  try {
    records = await Promise.race([
      dns.lookup(host, { all: true, verbatim: true }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("dns-timeout")), DNS_TIMEOUT_MS);
        onAbort = () => reject(new Error("dns-timeout"));
        signal?.addEventListener("abort", onAbort, { once: true });
      }),
    ]);
  } catch (err) {
    if (err instanceof Error && err.message === "dns-timeout") {
      throw new AuditError("timeout", `Looking up ${host} took too long.`);
    }
    throw new AuditError("unreachable", `We couldn't find a website at ${host}. Check the spelling and try again.`);
  } finally {
    if (timer) clearTimeout(timer);
    if (onAbort) signal?.removeEventListener("abort", onAbort);
  }

  if (records.length === 0) {
    throw new AuditError("unreachable", `We couldn't find a website at ${host}.`);
  }
  for (const r of records) {
    if (!classifyIp(r.address).public) {
      throw new AuditError(
        "blocked_host",
        `${host} points to a private or reserved network address, so we can't check it.`,
      );
    }
  }
  const v4 = records.find((r) => r.family === 4);
  const chosen = v4 ?? records[0];
  return { address: chosen.address, family: chosen.family === 6 ? 6 : 4 };
}
