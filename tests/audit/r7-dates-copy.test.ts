/**
 * R7 #12: geo.dates copy must match what the check reads (machine-readable dates only) and must
 * never tell owners to put dateModified on Organization/LocalBusiness (not valid there).
 */
import { describe, expect, it } from "vitest";
import { issueCopy } from "@/lib/audit/issues";
import { ACCEPTANCE_TESTS } from "@/lib/audit/export";
import { methodologySections } from "@/content/methodology";
import { hasDateSignal } from "@/lib/audit/checks/geo/dates";
import { doc, makeCtx, page } from "./helpers";

const pageOf = (body: string, head = "") => makeCtx({ pages: [page(doc({ head, body }))] }).pages[0];

describe("geo.dates copy (R7 #12)", () => {
  const c = issueCopy("geo.dates:missing");

  it("title says the date must be readable by machines, not merely shown", () => {
    expect(c.title).toBe("Pages have no published or updated date that search engines and AI can read");
  });

  it("howToFix says typed text does not count and names only CreativeWork hosts", () => {
    expect(c.howToFix).toContain("A date typed as plain text is not counted.");
    expect(c.howToFix).toMatch(/WebPage or Article JSON-LD/);
    expect(c.howToFix).not.toMatch(/Organization|LocalBusiness/);
    expect(c.howToFix).toContain('<time datetime="2026-01-15">');
  });

  it("export and methodology descriptions no longer promise that visible text counts", () => {
    expect(ACCEPTANCE_TESTS["geo.dates"]).not.toMatch(/visibl/i);
    const item = methodologySections.flatMap((s) => s.groups ?? []).flatMap((g) => g.items).find((i) => i.id === "geo.dates");
    expect(item?.body).toBeDefined();
    expect(item?.body).not.toMatch(/visibl/i);
  });

  it("the copy matches the check: typed text fails, the fixes it names pass", () => {
    expect(hasDateSignal(pageOf("<p>Last updated 15 January 2026</p>"))).toBe(false);
    expect(hasDateSignal(pageOf('<p>Updated <time datetime="2026-01-15">15 Jan 2026</time></p>'))).toBe(true);
    const ld = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","dateModified":"2026-01-15"}</script>';
    expect(hasDateSignal(pageOf("<p>Hello</p>", ld))).toBe(true);
  });
});
