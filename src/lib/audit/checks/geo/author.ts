import { outcome, plural, type Check } from "../../context";
import { metaContent, nodeTypes, type PageData } from "../../html";

const def = { id: "geo.author", category: "geo", label: "Author signals" } as const;

export function hasAuthorSignal(p: PageData): boolean {
  if (metaContent(p.$, "author") || metaContent(p.$, "article:author")) return true;
  if (p.$('a[rel~="author" i], link[rel~="author" i], [itemprop="author"], [rel="author"]').length > 0) return true;
  if (p.$('.byline, .author, .post-author, .entry-author, [class*="byline"]').length > 0) return true;
  for (const b of p.jsonLd) {
    for (const n of b.nodes) {
      if (n.author !== undefined && n.author !== null && n.author !== "") return true;
      if (nodeTypes(n).includes("Person")) return true;
      if (n.founder !== undefined) return true;
    }
  }
  return false;
}

export const authorCheck: Check = (ctx) => {
  const withAuthor = ctx.pages.filter(hasAuthorSignal);
  const n = ctx.pages.length;
  if (withAuthor.length > 0) {
    return outcome(def, {
      score: 1,
      summary: `Author or owner information found on ${withAuthor.length} of ${plural(n, "page")}.`,
      issues: [],
    });
  }
  return outcome(def, {
    score: 0,
    status: "warn",
    summary: "No author, byline or Person schema was found.",
    issues: [{ key: "geo.author:missing" }],
  });
};
