import type { MetadataRoute } from "next";
import { docsPages } from "@content/site/docs";
import { siteOrigin } from "@/lib/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/kits", "/workflows", "/agents", "/ui", "/pricing", ...docsPages.map((page) => page.path)].map((path) => ({ url: `${siteOrigin}${path}`, changeFrequency: path.startsWith("/docs") ? "weekly" : "monthly", priority: path === "/" ? 1 : path === "/docs" ? 0.9 : 0.7 }));
}
