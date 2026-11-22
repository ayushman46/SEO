import { outcome, type Check } from "../../context";
import { allJsonLdNodes, nodeTypes } from "../../html";
import { hasProp, isOrgNode } from "./schema-util";

const def = { id: "geo.organization-schema", category: "geo", label: "Business schema" } as const;

export const organizationSchemaCheck: Check = (ctx) => {
  const orgs = allJsonLdNodes(ctx.pages).filter(({ node }) => isOrgNode(node));
  if (orgs.length === 0) {
    return outcome(def, {
      score: 0,
      summary: "No Organization or LocalBusiness schema was found.",
      issues: [{ key: "geo.organization-schema:missing", affectedUrls: ctx.pages[0] ? [ctx.pages[0].url] : [] }],
    });
  }
  // Use the most complete org node (homepage first on ties).
  const scored = orgs.map(({ node, url }) => {
    const fields = {
      name: hasProp(node, "name"),
      url: hasProp(node, "url") || (typeof node["@id"] === "string" && /^https?:/i.test(node["@id"] as string)),
      "logo or sameAs": hasProp(node, "logo") || hasProp(node, "sameAs") || hasProp(node, "image"),
    };
    const present = Object.values(fields).filter(Boolean).length;
    return { node, url, fields, present };
  });
  scored.sort((a, b) => b.present - a.present);
  const best = scored[0];
  const missing = Object.entries(best.fields)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);
  const type = nodeTypes(best.node)[0] ?? "Organization";

  if (missing.length === 0) {
    return outcome(def, {
      score: 1,
      summary: `${type} schema found with name, url and logo/sameAs.`,
      issues: [],
    });
  }
  return outcome(def, {
    score: 0.4 + 0.6 * (best.present / 3),
    summary: `${type} schema found but it's missing: ${missing.join(", ")}.`,
    issues: [
      {
        key: "geo.organization-schema:incomplete",
        affectedUrls: [best.url],
        detail: `Missing: ${missing.join(", ")}.`,
      },
    ],
  });
};
