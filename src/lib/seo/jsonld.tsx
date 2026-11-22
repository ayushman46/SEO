import { site } from "@/content/site";
import type { FaqItem, Service } from "@/content/types";
import { absoluteUrl, siteUrl } from "./metadata";

/** A JSON-LD node. Kept loose on purpose; schema.org is large and we only emit a few types. */
export type JsonLdNode = { "@context"?: "https://schema.org"; "@type": string } & Record<string, unknown>;

const CONTEXT = "https://schema.org" as const;

/** True when a value is still a founder placeholder and must not be published as structured data. */
function isPlaceholder(value: string): boolean {
  return value.includes("[PLACEHOLDER");
}

export const organizationId = () => `${siteUrl()}/#organization`;
export const websiteId = () => `${siteUrl()}/#website`;

/**
 * Social / directory profiles for Organization.sameAs.
 * [PLACEHOLDER] Founder: add real profile URLs (LinkedIn, X, GitHub, Google Business Profile…). Leave empty until then.
 */
export const sameAsProfiles: string[] = [];

export function organizationLd(): JsonLdNode {
  const node: JsonLdNode = {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": organizationId(),
    name: site.name,
    url: absoluteUrl("/"),
    description: site.description,
    slogan: site.tagline,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/opengraph-image"),
      width: 1200,
      height: 630,
    },
    image: absoluteUrl("/opengraph-image"),
    knowsAbout: [
      "Search engine optimization",
      "Generative Engine Optimization",
      "AI search visibility",
      "Structured data",
      "Core Web Vitals",
      "llms.txt",
    ],
  };
  if (sameAsProfiles.length > 0) node.sameAs = sameAsProfiles;
  if (!isPlaceholder(site.contactEmail)) {
    node.email = site.contactEmail;
    node.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: site.contactEmail,
      url: absoluteUrl("/contact"),
      availableLanguage: ["English"],
    };
  } else {
    node.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/contact"),
      availableLanguage: ["English"],
    };
  }
  return node;
}

export function websiteLd(): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": websiteId(),
    name: site.name,
    url: absoluteUrl("/"),
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": organizationId() },
  };
}

/** Service node. Prices are omitted while they are placeholders. */
export function serviceLd(service: Service): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "Service",
    "@id": `${absoluteUrl("/services")}#${service.slug}`,
    name: service.name,
    serviceType: service.name,
    description: service.description,
    url: `${absoluteUrl("/services")}#${service.slug}`,
    provider: { "@id": organizationId() },
    audience: { "@type": "BusinessAudience", name: service.forWho },
    areaServed: "Worldwide",
  };
}

export function faqLd(items: readonly FaqItem[]): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export interface BreadcrumbInput {
  name: string;
  /** Site path, e.g. "/pricing". */
  path: string;
}

/** BreadcrumbList. Pass the trail without Home; it is prepended automatically. */
export function breadcrumbLd(items: readonly BreadcrumbInput[]): JsonLdNode {
  const trail: BreadcrumbInput[] = [{ name: "Home", path: "/" }, ...items.filter((i) => i.path !== "/")];
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** WebPage node with dates, so inner pages carry an explicit last-updated signal. */
export function webPageLd(input: { name: string; description: string; path: string; dateModified: string }): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "WebPage",
    "@id": `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.name,
    description: input.description,
    inLanguage: "en",
    isPartOf: { "@id": websiteId() },
    about: { "@id": organizationId() },
    dateModified: input.dateModified,
  };
}

/** Serialize for a <script type="application/ld+json">, escaping "<" so content can't close the tag. */
export function serializeJsonLd(data: JsonLdNode | readonly JsonLdNode[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Server component: renders one or more JSON-LD nodes.
 * Usage: <JsonLd data={[organizationLd(), websiteLd()]} />
 * (Lives in this file rather than a separate JsonLd.tsx: "JsonLd" and "jsonld" collide on case-insensitive filesystems.)
 */
export function JsonLd({ data }: { data: JsonLdNode | readonly JsonLdNode[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
