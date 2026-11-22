import type { Metadata } from "next";
import { site } from "@/content/site";
import { homeMeta } from "@/content/home";
import { servicesPage } from "@/content/services";
import { pricingPage } from "@/content/pricing";
import { aboutPage } from "@/content/about";
import { contactPage } from "@/content/contact";
import { auditPage } from "@/content/audit";
import { privacyMeta, termsMeta } from "@/content/legal";

export const TITLE_SUFFIX = " · seenhq";
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "seenhq: be seen by people and by the machines they ask.",
} as const;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Absolute base URL of the site, without a trailing slash.
 * NEXT_PUBLIC_SITE_URL wins; then the Vercel production URL; then localhost.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return stripTrailingSlash(`https://${vercel.replace(/^https?:\/\//, "")}`);
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
      images: [OG_IMAGE.url],
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
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
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
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
] as const;
