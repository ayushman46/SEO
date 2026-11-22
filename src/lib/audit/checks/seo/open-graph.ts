import { outcome, plural, type Check } from "../../context";
import { metaContent } from "../../html";

const def = { id: "seo.open-graph", category: "seo", label: "Social sharing (Open Graph)" } as const;
const TAGS = ["og:title", "og:description", "og:image"] as const;

export const openGraphCheck: Check = (ctx) => {
  const missingByTag = new Map<string, string[]>();
  let total = 0;
  let complete = 0;
  for (const p of ctx.pages) {
    let present = 0;
    for (const tag of TAGS) {
      if (metaContent(p.$, tag)) present++;
      else missingByTag.set(tag, [...(missingByTag.get(tag) ?? []), p.url]);
    }
    total += present / TAGS.length;
    if (present === TAGS.length) complete++;
  }
  const n = ctx.pages.length;
  const affected = [...new Set([...missingByTag.values()].flat())];
  return outcome(def, {
    score: n ? total / n : 0,
    summary: `${complete} of ${plural(n, "page")} ${complete === 1 ? "has" : "have"} og:title, og:description and og:image.`,
    issues: affected.length
      ? [
          {
            key: "seo.open-graph:incomplete",
            affectedUrls: affected,
            detail: `Missing: ${[...missingByTag.entries()]
              .map(([tag, urls]) => `${tag} (${plural(urls.length, "page")})`)
              .join(", ")}.`,
          },
        ]
      : [],
  });
};
