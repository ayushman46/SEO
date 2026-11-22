import { describe, expect, it } from "vitest";
import { classifyIp, isIpLiteral, isPublicIp } from "@/lib/audit/net/ip";

describe("classifyIp — blocked ranges", () => {
  const blocked = [
    // IPv4
    "0.0.0.0", // unspecified
    "0.1.2.3", // 0.0.0.0/8
    "127.0.0.1", // loopback
    "127.255.255.254",
    "10.0.0.1", // RFC1918
    "10.255.255.255",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.0.1",
    "192.168.255.255",
    "100.64.0.1", // CGNAT
    "100.127.255.254",
    "169.254.169.254", // cloud metadata / link-local
    "169.254.0.1",
    "224.0.0.1", // multicast
    "239.255.255.250",
    "255.255.255.255", // broadcast
    "240.0.0.1", // reserved
    "192.0.2.1", // TEST-NET-1
    "198.51.100.1", // TEST-NET-2
    "203.0.113.1", // TEST-NET-3
    "198.18.0.1", // benchmarking
    "192.0.0.1", // IETF protocol assignments
    // IPv6
    "::", // unspecified
    "::1", // loopback
    "[::1]",
    "fc00::1", // ULA
    "fd12:3456:789a::1",
    "fe80::1", // link-local
    "fe80::1%eth0",
    "ff02::1", // multicast
    "::ffff:127.0.0.1", // IPv4-mapped loopback
    "::ffff:7f00:1", // same, hex form
    "::ffff:10.0.0.1",
    "::ffff:8.8.8.8", // mapped public: still rejected (never connect via mapped forms)
    "64:ff9b::a00:1", // NAT64 → 10.0.0.1
    "2002:7f00:1::", // 6to4 embedding 127.0.0.1
    "2001::1", // Teredo
    "2001:db8::1", // documentation
    "100::1", // discard
    "::2", // outside 2000::/3
    "fec0::1", // deprecated site-local
  ];
  for (const ip of blocked) {
    it(`blocks ${ip}`, () => {
      expect(isPublicIp(ip)).toBe(false);
    });
  }
});

describe("classifyIp — public addresses", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "93.184.215.14", "151.101.1.69", "2606:4700:4700::1111", "2a00:1450:4009:81f::200e"]) {
    it(`allows ${ip}`, () => {
      expect(isPublicIp(ip)).toBe(true);
    });
  }
});

describe("classifyIp — malformed / non-canonical", () => {
  it("rejects non-IP strings and shorthand forms (URL parser normalises those first)", () => {
    expect(classifyIp("example.com").public).toBe(false);
    expect(classifyIp("2130706433").public).toBe(false);
    expect(classifyIp("0x7f.0.0.1").public).toBe(false);
    expect(classifyIp("127.1").public).toBe(false);
    expect(classifyIp("").public).toBe(false);
  });

  it("reports the range for diagnostics", () => {
    expect(classifyIp("10.1.2.3").range).toBe("private");
    expect(classifyIp("100.64.0.1").range).toBe("carrierGradeNat");
    expect(classifyIp("::ffff:127.0.0.1").range).toBe("ipv4Mapped");
  });

  it("detects IP literals", () => {
    expect(isIpLiteral("1.2.3.4")).toBe(true);
    expect(isIpLiteral("[::1]")).toBe(true);
    expect(isIpLiteral("example.com")).toBe(false);
  });
});
