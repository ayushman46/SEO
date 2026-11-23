import type { Metadata } from "next";
import { site } from "@/content/site";
import { homeMeta, sampleReportMeta } from "@/content/home";
import { servicesPage } from "@/content/services";
import { pricingPage } from "@/content/pricing";
import { aboutPage } from "@/content/about";
import { contactPage } from "@/content/contact";
import { auditPage } from "@/content/audit";
import { privacyMeta, termsMeta } from "@/content/legal";
import { methodologyPage } from "@/content/methodology";
import { botPage } from "@/content/bot";

export const TITLE_SUFFIX = " · seenhq";
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "seenhq: be seen by people and by the machines they ask.",
} as const;

/** Normalise any configured site address to a bare origin: adds https:// when missing, drops paths and trailing slashes. */
function toOrigin(raw: string): string {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return new URL(withScheme).origin;
}

/**
 * Absolute base URL of the site (an origin, no trailing slash).
 * NEXT_PUBLIC_SITE_URL wins; then the Vercel production URL; then localhost.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return toOrigin(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return toOrigin(vercel);
  return "http://localhost:3000";
}

/** Absolute URL for a site path ("/pricing" -> "https://…/pricing"). */
export function absoluteUrl(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p === "/" ? `${siteUrl()}/` : `${siteUrl()}${p}`;
}

export interface BuildMetadataInput {
  /** Page title without the " · seenhq" suffix (the root template adds it). */
  title: string;
  description: string;
  /** Site path, e.g. "/pricing". Used for the canonical and og:url. */
  path: string;
  noindex?: boolean;
  /** Use the title exactly as given, skipping the template (home page). */
  absoluteTitle?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  noindex = false,
  absoluteTitle = false,
}: BuildMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title}${TITLE_SUFFIX}`;
  return {
    metadataBase: new URL(siteUrl()),
    title: absoluteTitle ? { absolute: title } : title,
    description,
    authors: [{ name: site.name, url: siteUrl() }],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Default metadata for src/app/layout.tsx. Pages override with `pageMetadata.*` or `buildMetadata`. */
export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: site.name,
  title: {
    default: homeMeta.metaTitle,
    template: `%s${TITLE_SUFFIX}`,
  },
  description: site.description,
  authors: [{ name: site.name, url: siteUrl() }],
  creator: site.name,
  publisher: site.name,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    title: homeMeta.metaTitle,
    description: site.description,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: homeMeta.metaTitle,
    description: site.description,
    images: [OG_IMAGE],
  },
  // One generic robots tag (R6 finding 8). A separate googleBot "index, follow" tag survived on noindex
  // pages (the 404) next to Next's own noindex, so the snippet settings live on the generic tag and
  // any page that sets its own `robots` replaces the whole object.
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

/** Ready-made `export const metadata = pageMetadata.x` values for each marketing page. */
export const pageMetadata = {
  home: buildMetadata({
    title: homeMeta.metaTitle,
    description: homeMeta.metaDescription,
    path: "/",
    absoluteTitle: true,
  }),
  audit: buildMetadata({ title: auditPage.metaTitle, description: auditPage.metaDescription, path: "/audit" }),
  services: buildMetadata({
    title: servicesPage.metaTitle,
    description: servicesPage.metaDescription,
    path: "/services",
  }),
  pricing: buildMetadata({ title: pricingPage.metaTitle, description: pricingPage.metaDescription, path: "/pricing" }),
  about: buildMetadata({ title: aboutPage.metaTitle, description: aboutPage.metaDescription, path: "/about" }),
  contact: buildMetadata({ title: contactPage.metaTitle, description: contactPage.metaDescription, path: "/contact" }),
  methodology: buildMetadata({
    title: methodologyPage.metaTitle,
    description: methodologyPage.metaDescription,
    path: "/methodology",
  }),
  sampleReport: buildMetadata({
    title: sampleReportMeta.metaTitle,
    description: sampleReportMeta.metaDescription,
    path: "/sample-report",
  }),
  bot: buildMetadata({ title: botPage.metaTitle, description: botPage.metaDescription, path: "/bot" }),
  privacy: buildMetadata({ title: privacyMeta.metaTitle, description: privacyMeta.metaDescription, path: "/privacy" }),
  terms: buildMetadata({ title: termsMeta.metaTitle, description: termsMeta.metaDescription, path: "/terms" }),
} satisfies Record<string, Metadata>;

/** Public, indexable routes. Single source for sitemap.xml and llms.txt. */
export const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/audit", priority: 0.9, changeFrequency: "monthly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/sample-report", priority: 0.7, changeFrequency: "monthly" },
  { path: "/methodology", priority: 0.6, changeFrequency: "monthly" },
  { path: "/bot", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
] as const;
