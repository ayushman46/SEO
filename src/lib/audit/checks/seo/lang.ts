import { outcome, plural, type Check } from "../../context";

const def = { id: "seo.lang", category: "seo", label: "Language attribute" } as const;

export const langCheck: Check = (ctx) => {
  const bad = ctx.pages.filter((p) => !(p.$.root().children("html").attr("lang") ?? "").trim()).map((p) => p.url);
  const n = ctx.pages.length;
  const good = n - bad.length;
  return outcome(def, {
    score: n ? good / n : 0,
    summary: `${good} of ${plural(n, "page")} declare${good === 1 ? "s" : ""} a language on the <html> tag.`,
    issues: bad.length ? [{ key: "seo.lang:missing", affectedUrls: bad }] : [],
  });
};
