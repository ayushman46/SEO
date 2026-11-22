import { outcome, type Check } from "../../context";
import { metaContent, nodeTypes } from "../../html";
import { isOrgNode, stringProp } from "./schema-util";

const def = { id: "geo.entity-consistency", category: "geo", label: "Name consistency" } as const;

const LEGAL_SUFFIX = /\b(inc|llc|ltd|limited|co|corp|corporation|company|gmbh|plc|pty|sa|srl|bv|ag|llp)\b\.?/g;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(LEGAL_SUFFIX, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function compact(s: string): string {
  return s.replace(/\s+/g, "");
}

/** Two names match if one contains the other once normalised (ignoring spaces). */
export function namesMatch(a: string, b: string): boolean {
  const x = compact(normalizeName(a));
  const y = compact(normalizeName(b));
  if (!x || !y) return false;
  return x.includes(y) || y.includes(x);
}

export const entityConsistencyCheck: Check = (ctx) => {
  const home = ctx.pages[0];
  if (!home) return outcome(def, { score: 0, summary: "No pages were scanned.", issues: [{ key: "geo.entity-consistency:not-declared" }] });

  const sources: { label: string; name: string }[] = [];
  const og = metaContent(home.$, "og:site_name") ?? ctx.pages.map((p) => metaContent(p.$, "og:site_name")).find(Boolean);
  if (og) sources.push({ label: "og:site_name", name: og });

  let orgName: string | null = null;
  let siteName: string | null = null;
  for (const p of ctx.pages) {
    for (const b of p.jsonLd) {
      for (const n of b.nodes) {
        if (!orgName && isOrgNode(n)) orgName = stringProp(n, "name");
        if (!siteName && nodeTypes(n).includes("WebSite")) siteName = stringProp(n, "name");
      }
    }
  }
  if (orgName) sources.push({ label: "Organization schema name", name: orgName });
  if (siteName) sources.push({ label: "WebSite schema name", name: siteName });
  const appName = metaContent(home.$, "application-name");
  if (appName) sources.push({ label: "application-name", name: appName });

  const title = home.title ?? "";
  const describe = () =>
    [...sources.map((s) => `${s.label} "${s.name}"`), ...(title ? [`homepage title "${title}"`] : [])].join(", ");

  if (sources.length === 0) {
    return outcome(def, {
      score: 0.4,
      status: "warn",
      summary: "Your business name isn't declared in og:site_name or schema, so AI tools have to guess it.",
      issues: [{ key: "geo.entity-consistency:not-declared", affectedUrls: [home.url] }],
    });
  }

  const mismatched = sources.filter((s) => !namesMatch(s.name, sources[0].name));
  const inTitle = !title || sources.some((s) => namesMatch(title, s.name) || normalizeName(title).includes(normalizeName(s.name)));

  if (mismatched.length > 0) {
    return outcome(def, {
      score: 0.3,
      summary: "Your business name differs between your title, social tags and schema.",
      issues: [{ key: "geo.entity-consistency:inconsistent", affectedUrls: [home.url], detail: `We found: ${describe()}.` }],
    });
  }
  if (!inTitle) {
    return outcome(def, {
      score: 0.6,
      summary: "Your declared business name doesn't appear in your homepage title.",
      issues: [
        {
          key: "geo.entity-consistency:inconsistent",
          affectedUrls: [home.url],
          severity: "low",
          detail: `We found: ${describe()}.`,
        },
      ],
    });
  }
  return outcome(def, {
    score: 1,
    summary: `Your business name is consistent (${sources[0].name}).`,
    issues: [],
  });
};
