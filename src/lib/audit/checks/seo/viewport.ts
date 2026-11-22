import { outcome, plural, type Check } from "../../context";
import { metaContent } from "../../html";

const def = { id: "seo.viewport", category: "seo", label: "Mobile viewport" } as const;

export const viewportCheck: Check = (ctx) => {
  const bad = ctx.pages
    .filter((p) => !/width\s*=\s*device-width/i.test(metaContent(p.$, "viewport") ?? ""))
    .map((p) => p.url);
  const n = ctx.pages.length;
  const good = n - bad.length;
  return outcome(def, {
    score: n ? good / n : 0,
    summary: `${good} of ${plural(n, "page")} ${good === 1 ? "is" : "are"} set up for mobile screens (width=device-width).`,
    issues: bad.length
      ? [{ key: "seo.viewport:missing", affectedUrls: bad, ...(bad.includes(ctx.pages[0]?.url) ? {} : { severity: "medium" as const }) }]
      : [],
  });
};
