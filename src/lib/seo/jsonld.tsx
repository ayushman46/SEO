import { contentUpdated, site } from "@/content/site";
import type { FaqItem, PricingTier, Service } from "@/content/types";
import { absoluteUrl, siteUrl } from "./metadata";

/** A JSON-LD node. Kept loose on purpose; schema.org is large and we only emit a few types. */
export type JsonLdNode = { "@context"?: "https://schema.org"; "@type": string } & Record<string, unknown>;

const CONTEXT = "https://schema.org" as const;

/** True when a value is still a founder placeholder and must not be published as structured data. */
export function isPlaceholder(value: string): boolean {
  return value.includes("[PLACEHOLDER");
}

export const organizationId = () => `${siteUrl()}/#organization`;
export const websiteId = () => `${siteUrl()}/#website`;

/**
 * Social / directory profiles for Organization.sameAs.
 * [PLACEHOLDER] Founder: add real profile URLs (LinkedIn, X, GitHub, Google Business Profile…). Leave empty until then.
 */
export const sameAsProfiles: string[] = [];

/** [PLACEHOLDER] Founder: set your real name to publish a founder Person node. Leave empty until then. */
export const founderName: string = "";

/** Square brand logo served from public/logo.png (512×512). */
export const LOGO = { path: "/logo.png", width: 512, height: 512 } as const;

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
      url: absoluteUrl(LOGO.path),
      width: LOGO.width,
      height: LOGO.height,
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
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/contact"),
      availableLanguage: ["English"],
      ...(isPlaceholder(site.contactEmail) ? {} : { email: site.contactEmail }),
    },
  };
  if (!isPlaceholder(site.contactEmail)) node.email = site.contactEmail;
  if (sameAsProfiles.length > 0) node.sameAs = sameAsProfiles;
  if (founderName && !isPlaceholder(founderName)) node.founder = { "@type": "Person", name: founderName };
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
    dateModified: contentUpdated,
    publisher: { "@id": organizationId() },
    author: { "@id": organizationId() },
  };
}

/** Service node. Prices are never included here; see offerCatalogLd for prices. */
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
    audience: { "@type": "BusinessAudience", audienceType: service.forWho },
    areaServed: "Worldwide",
  };
}

/** Parses "$49" / "From $199" into a number. Returns null for placeholder-marked or unparseable prices. */
function publishablePrice(price: string): number | null {
  if (isPlaceholder(price)) return null;
  const m = price.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

/** OfferCatalog for /pricing. Tiers keep name/description; a price is only published once it is no longer a placeholder. */
export function offerCatalogLd(tiers: readonly PricingTier[]): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "OfferCatalog",
    name: `${site.name} pricing`,
    url: absoluteUrl("/pricing"),
    itemListElement: tiers.map((tier) => {
      const price = publishablePrice(tier.price);
      return {
        "@type": "Offer",
        name: tier.name,
        description: tier.description,
        seller: { "@id": organizationId() },
        ...(price === null ? {} : { price, priceCurrency: "USD" }),
      };
    }),
  };
}

/** FAQPage node. Items whose question or answer still contains "[PLACEHOLDER" are skipped. */
export function faqLd(items: readonly FaqItem[]): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items
      .filter((item) => !isPlaceholder(item.q) && !isPlaceholder(item.a))
      .map((item) => ({
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

export interface WebPageInput {
  name: string;
  description: string;
  path: string;
  /** ISO date. Defaults to the sitewide contentUpdated; legal pages pass their own `updated`. */
  dateModified?: string;
}

/** WebPage node with author, publisher and a last-updated date. */
export function webPageLd(input: WebPageInput): JsonLdNode {
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
    author: { "@id": organizationId() },
    publisher: { "@id": organizationId() },
    dateModified: input.dateModified ?? contentUpdated,
  };
}

/**
 * The standard graph for an inner page: WebPage (author, publisher, dateModified) + BreadcrumbList (Home > page).
 * Usage on /pricing: <JsonLd data={innerPageLd({ name: "Pricing", path: "/pricing", description: pricingPage.metaDescription })} />
 */
export function innerPageLd(input: WebPageInput & { breadcrumbName?: string }): JsonLdNode[] {
  return [
    webPageLd(input),
    breadcrumbLd([{ name: input.breadcrumbName ?? input.name, path: input.path }]),
  ];
}

/** Recursively drops any string (and the key holding it) that still contains "[PLACEHOLDER". */
export function stripPlaceholders<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((v) => !(typeof v === "string" && isPlaceholder(v)))
      .map((v) => stripPlaceholders(v)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === "string" && isPlaceholder(v)) continue;
      out[k] = stripPlaceholders(v);
    }
    return out as T;
  }
  return value;
}

/**
 * Serialize for a <script type="application/ld+json">: strips any leftover placeholders,
 * then escapes "<" so content can't close the tag.
 */
export function serializeJsonLd(data: JsonLdNode | readonly JsonLdNode[]): string {
  return JSON.stringify(stripPlaceholders(data)).replace(/</g, "\\u003c");
}

/**
 * Server component: renders one or more JSON-LD nodes.
 * Usage: <JsonLd data={[organizationLd(), websiteLd()]} />
 * (Lives in this file rather than a separate JsonLd.tsx: "JsonLd" and "jsonld" collide on case-insensitive filesystems.)
 */
export function JsonLd({ data }: { data: JsonLdNode | readonly JsonLdNode[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
