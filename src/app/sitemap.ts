import type { MetadataRoute } from "next";
import { contentUpdated } from "@/content/site";
import { absoluteUrl, publicRoutes } from "@/lib/seo/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: contentUpdated,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
