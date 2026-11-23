/**
 * safeFetch integration tests against a local server.
 *
 * - DNS is mocked: test hostnames "resolve" to fixed IPs which go through the REAL
 *   classifier; public ones are pinned to 127.0.0.1 (where the test server lives),
 *   which also proves the socket uses the resolver's address rather than real DNS.
 * - node:http is wrapped only to swap port 80 for the test server's random port.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import http from "node:http";
import zlib from "node:zlib";
import type { AddressInfo } from "node:net";
import { AuditError } from "@/lib/audit/types";

const state = vi.hoisted(() => ({ port: 0, resolved: [] as string[] }));

vi.mock("node:http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:http")>();
  const request = ((opts: http.RequestOptions, cb?: (res: http.IncomingMessage) => void) =>
    actual.request({ ...opts, port: state.port }, cb)) as typeof actual.request;
  return { ...actual, request, default: { ...actual, request } };
});

vi.mock("@/lib/audit/net/ssrf", async () => {
  const { classifyIp } = await import("@/lib/audit/net/ip");
  const { AuditError: AE } = await import("@/lib/audit/types");
  const FAKE_DNS: Record<string, string> = {
    "site.noticr-test.com": "93.184.215.14",
    "www.site.noticr-test.com": "93.184.215.14",
    "rebind.noticr-test.com": "10.0.0.7",
    "meta.noticr-test.com": "169.254.169.254",
  };
  return {
    resolvePublicAddress: async (host: string) => {
      state.resolved.push(host);
      const ip = FAKE_DNS[host];
      if (!ip) throw new AE("unreachable", `no such host ${host}`);
      if (!classifyIp(ip).public) throw new AE("blocked_host", `${host} is private`);
      return { address: "127.0.0.1", family: 4 };
    },
  };
});

const { safeFetch } = await import("@/lib/audit/net/fetch");

const BASE = "http://site.noticr-test.com";
const HTML = "<!doctype html><html><head><title>ok</title></head><body>hello</body></html>";
let server: http.Server;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const path = req.url ?? "/";
    const redirect = (to: string, code = 302) => {
      res.writeHead(code, { location: to });
      res.end();
    };
    if (path === "/json-429") {
      res.writeHead(429, { "content-type": "application/json" });
      res.end('{"error":"slow down"}');
    } else if (path === "/ok") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(HTML);
    } else if (path === "/host") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(`<html><body>${req.headers.host}|${req.headers["user-agent"]}</body></html>`);
    } else if (path === "/r1") redirect("/ok");
    else if (path === "/to-www") redirect("http://www.site.noticr-test.com/ok", 301);
    else if (path.startsWith("/loop/")) {
      // /loop/n redirects to n+1 until n reaches 3, then serves a page.
      const n = Number(path.split("/")[2]);
      if (n < 3) redirect(`/loop/${n + 1}`);
      else {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(HTML);
      }
    }
    else if (path === "/to-metadata") redirect("http://169.254.169.254/latest/meta-data/");
    else if (path === "/to-decimal-ip") redirect("http://2130706433/");
    else if (path === "/to-rebind") redirect("http://rebind.noticr-test.com/");
    else if (path === "/to-meta-host") redirect("http://meta.noticr-test.com/");
    else if (path === "/to-port") redirect("http://site.noticr-test.com:8080/");
    else if (path === "/to-file") redirect("file:///etc/passwd");
    else if (path === "/to-creds") redirect("http://user:pw@site.noticr-test.com/");
    else if (path === "/pdf") {
      res.writeHead(200, { "content-type": "application/pdf" });
      res.end("%PDF-1.4");
    } else if (path === "/big") {
      res.writeHead(200, { "content-type": "text/html" });
      const chunk = "x".repeat(64 * 1024);
      let sent = 0;
      const pump = () => {
        while (sent < 3 * 1024 * 1024) {
          sent += chunk.length;
          if (!res.write(chunk)) return void res.once("drain", pump);
        }
        res.end();
      };
      res.on("error", () => undefined);
      pump();
    } else if (path === "/big-declared") {
      res.writeHead(200, { "content-type": "text/html", "content-length": String(5 * 1024 * 1024) });
      res.end("<html></html>");
    } else if (path === "/gzip") {
      res.writeHead(200, { "content-type": "text/html", "content-encoding": "gzip" });
      res.end(zlib.gzipSync(HTML));
    } else if (path === "/latin1") {
      res.writeHead(200, { "content-type": "text/html; charset=iso-8859-1" });
      res.end(Buffer.from("<html><body>caf\xe9</body></html>", "latin1"));
    } else if (path === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(`User-agent: *\nAllow: /\n${"#".repeat(600 * 1024)}`);
    } else if (path === "/slow") {
      res.writeHead(200, { "content-type": "text/html" });
      res.write("<html>");
      // never ends
    } else {
      res.writeHead(404, { "content-type": "text/html" });
      res.end("<html><body>not found</body></html>");
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  state.port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((r) => server.close(() => r()));
});

beforeEach(() => {
  state.resolved = [];
});

async function code(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "ok";
  } catch (e) {
    expect(e).toBeInstanceOf(AuditError);
    return (e as AuditError).code;
  }
}

describe("safeFetch", () => {
  it("connects to the pinned (validated) address while keeping the Host header and UA", async () => {
    const r = await safeFetch(`${BASE}/host`, { kind: "html" });
    expect(r.status).toBe(200);
    expect(r.text).toMatch(/site\.noticr-test\.com(:\d+)?\|/);
    expect(r.text).toContain("noticrbot/1.0");
  });

  it("follows redirects and re-validates every hop", async () => {
    const r = await safeFetch(`${BASE}/r1`, { kind: "html" });
    expect(r.finalUrl).toBe(`${BASE}/ok`);
    expect(r.redirects).toEqual([`${BASE}/ok`]);
    expect(state.resolved).toEqual(["site.noticr-test.com", "site.noticr-test.com"]);

    const www = await safeFetch(`${BASE}/to-www`, { kind: "html" });
    expect(www.finalUrl).toBe("http://www.site.noticr-test.com/ok");
  });

  it("stops after 3 redirects", async () => {
    expect(await code(safeFetch(`${BASE}/loop/0`, { kind: "html" }))).toBe("ok"); // 3 redirects: allowed
    expect(await code(safeFetch(`${BASE}/loop/-1`, { kind: "html" }))).toBe("unreachable"); // 4 redirects
  });

  it("blocks redirects to private / metadata / rebinding targets", async () => {
    expect(await code(safeFetch(`${BASE}/to-metadata`, { kind: "html" }))).toBe("blocked_host");
    expect(await code(safeFetch(`${BASE}/to-decimal-ip`, { kind: "html" }))).toBe("blocked_host");
    expect(await code(safeFetch(`${BASE}/to-rebind`, { kind: "html" }))).toBe("blocked_host");
    expect(await code(safeFetch(`${BASE}/to-meta-host`, { kind: "html" }))).toBe("blocked_host");
  });

  it("rejects redirects to bad ports, schemes and credentials", async () => {
    expect(await code(safeFetch(`${BASE}/to-port`, { kind: "html" }))).toBe("invalid_url");
    expect(await code(safeFetch(`${BASE}/to-file`, { kind: "html" }))).toBe("invalid_url");
    expect(await code(safeFetch(`${BASE}/to-creds`, { kind: "html" }))).toBe("invalid_url");
  });

  it("rejects private targets before any request", async () => {
    expect(await code(safeFetch("http://127.0.0.1/", { kind: "html" }))).toBe("blocked_host");
    expect(await code(safeFetch("http://localhost/", { kind: "html" }))).toBe("blocked_host");
    expect(await code(safeFetch("http://rebind.noticr-test.com/", { kind: "html" }))).toBe("blocked_host");
  });

  it("returns the redirect itself when maxRedirects is 0", async () => {
    const r = await safeFetch(`${BASE}/r1`, { kind: "text", maxRedirects: 0 });
    expect(r.status).toBe(302);
    expect(r.location).toBe(`${BASE}/ok`);
  });

  it("requires HTML for pages", async () => {
    expect(await code(safeFetch(`${BASE}/pdf`, { kind: "html" }))).toBe("not_html");
  });

  it("allowErrorBodies returns a non-HTML error response instead of not_html (R7 #3)", async () => {
    expect(await code(safeFetch(`${BASE}/json-429`, { kind: "html" }))).toBe("not_html");
    const r = await safeFetch(`${BASE}/json-429`, { kind: "html", allowErrorBodies: true });
    expect(r.status).toBe(429);
    expect(r.text).toContain("slow down");
    // a 200 non-HTML response is still refused
    expect(await code(safeFetch(`${BASE}/pdf`, { kind: "html", allowErrorBodies: true }))).toBe("not_html");
  });

  it("caps HTML at 2 MB (streamed and declared)", async () => {
    expect(await code(safeFetch(`${BASE}/big`, { kind: "html" }))).toBe("too_large");
    expect(await code(safeFetch(`${BASE}/big-declared`, { kind: "html" }))).toBe("too_large");
  });

  it("truncates text resources at 512 KB instead of failing", async () => {
    const r = await safeFetch(`${BASE}/robots.txt`, { kind: "text" });
    expect(r.truncated).toBe(true);
    expect(r.bytes.length).toBe(512 * 1024);
    expect(r.text.startsWith("User-agent: *")).toBe(true);
  });

  it("decompresses gzip and honours the charset", async () => {
    expect((await safeFetch(`${BASE}/gzip`, { kind: "html" })).text).toBe(HTML);
    expect((await safeFetch(`${BASE}/latin1`, { kind: "html" })).text).toContain("café");
  });

  it("times out slow responses", async () => {
    expect(await code(safeFetch(`${BASE}/slow`, { kind: "html", timeoutMs: 300 }))).toBe("timeout");
  });

  it("honours an outer abort signal", async () => {
    const ac = new AbortController();
    const p = safeFetch(`${BASE}/slow`, { kind: "html", signal: ac.signal });
    setTimeout(() => ac.abort(), 100);
    expect(await code(p)).toBe("timeout");
  });
});
