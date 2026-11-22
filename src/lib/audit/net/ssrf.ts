import "server-only";
import { promises as dns } from "node:dns";
import { AuditError } from "../types";
import { classifyIp, isIpLiteral } from "./ip";

export interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

const DNS_TIMEOUT_MS = 5_000;
const DNS_QUERY_TIMEOUT_MS = 2_000;

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

  // RFC 6761: *.localhost is always loopback. Reject without asking DNS.
  const lower = host.toLowerCase().replace(/[.]$/, "");
  if (lower === "localhost" || lower.endsWith(".localhost")) {
    throw new AuditError("blocked_host", "That address points to this server and can't be checked.");
  }

  if (signal?.aborted) throw new AuditError("timeout", `Looking up ${host} took too long.`);
  // c-ares resolver (not getaddrinfo): it does not occupy a libuv threadpool thread, has its
  // own per-query timeout, and cancel() really stops pending queries on timeout/abort.
  const resolver = new dns.Resolver({ timeout: DNS_QUERY_TIMEOUT_MS, tries: 2 });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const records: { address: string; family: 4 | 6 }[] = [];
  try {
    const [a, aaaa] = await Promise.race([
      Promise.allSettled([resolver.resolve4(host), resolver.resolve6(host)]),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          resolver.cancel();
          reject(new Error("dns-timeout"));
        }, DNS_TIMEOUT_MS);
        onAbort = () => {
          resolver.cancel();
          reject(new Error("dns-timeout"));
        };
        signal?.addEventListener("abort", onAbort, { once: true });
      }),
    ]);
    if (a.status === "fulfilled") for (const address of a.value) records.push({ address, family: 4 });
    if (aaaa.status === "fulfilled") for (const address of aaaa.value) records.push({ address, family: 6 });
    if (records.length === 0) {
      const timedOut = [a, aaaa].some(
        (r) => r.status === "rejected" && /ETIMEOUT|ECANCELLED/.test(String((r.reason as NodeJS.ErrnoException)?.code)),
      );
      if (timedOut) throw new Error("dns-timeout");
    }
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
  return { address: chosen.address, family: chosen.family };
}
