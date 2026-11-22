import { nodeTypes, type JsonLdNode } from "../../html";
import { ORG_TYPES } from "./org-types";

/** Extension / custom types we don't know: only clearly business-like names count. */
const ORG_SUFFIX = /(business|organization|organisation|store|agency|clinic|contractor)$/;

export function isOrgType(type: string): boolean {
  const t = type
    .trim()
    .replace(/^https?:[/][/](www[.])?schema[.]org[/]/i, "")
    .replace(/^schema:/i, "")
    .toLowerCase();
  if (!t) return false;
  if (ORG_TYPES.has(t)) return true;
  // "Service" and its subtypes (TaxiService, FoodService, ...) describe an offering, not a business.
  if (t.endsWith("service")) return false;
  return ORG_SUFFIX.test(t);
}

/**
 * priceRange is defined only on LocalBusiness (openingHours is shared with CivicStructure,
 * and address/telephone with Person/Place/ContactPoint, so those are not business signals).
 */
const LOCAL_BUSINESS_PROPS = ["priceRange"];

export function isOrgNode(node: JsonLdNode): boolean {
  if (nodeTypes(node).some(isOrgType)) return true;
  return LOCAL_BUSINESS_PROPS.some((k) => node[k] !== undefined && node[k] !== null);
}

export function stringProp(node: JsonLdNode, key: string): string | null {
  const v = node[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v)) {
    const s = v.find((x): x is string => typeof x === "string" && x.trim().length > 0);
    if (s) return s.trim();
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as JsonLdNode;
    for (const k of ["url", "@id", "contentUrl", "name"]) {
      if (typeof o[k] === "string" && (o[k] as string).trim()) return (o[k] as string).trim();
    }
  }
  return null;
}

export function hasProp(node: JsonLdNode, key: string): boolean {
  const v = node[key];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}
