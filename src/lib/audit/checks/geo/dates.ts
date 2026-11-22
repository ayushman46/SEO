import { outcome, plural, type Check } from "../../context";
import { metaContent, type PageData } from "../../html";

const def = { id: "geo.dates", category: "geo", label: "Freshness dates" } as const;

const DATE_META = [
  "article:modified_time",
  "article:published_time",
  "og:updated_time",
  "date",
  "last-modified",
  "datepublished",
  "datemodified",
  "dc.date",
  "dcterms.modified",
];

export function hasDateSignal(p: PageData): boolean {
  for (const b of p.jsonLd) {
    for (const n of b.nodes) {
      if (typeof n.datePublished === "string" || typeof n.dateModified === "string") return true;
    }
  }
  // One selector pass (each full-document query costs a tree walk).
  if (p.$('time[datetime], [itemprop="dateModified"], [itemprop="datePublished"]').length > 0) return true;
  return DATE_META.some((k) => metaContent(p.$, k));
}

export const datesCheck: Check = (ctx) => {
  const withDates = ctx.pages.filter(hasDateSignal);
  const n = ctx.pages.length;
  if (withDates.length > 0) {
    return outcome(def, {
      score: 1,
      summary: `Published/updated dates found on ${withDates.length} of ${plural(n, "page")}.`,
      issues: [],
    });
  }
  return outcome(def, {
    score: 0,
    status: "warn",
    summary: "No published or updated dates were found on the scanned pages.",
    issues: [{ key: "geo.dates:missing", affectedUrls: ctx.pages.map((p) => p.url) }],
  });
};
