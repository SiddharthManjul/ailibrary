import type { Metadata } from "next";

function configuredOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  try {
    const url = new URL(configured || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000"));
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) return url.origin;
  } catch {}
  return "http://localhost:3000";
}

export const siteOrigin = configuredOrigin();

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const fullTitle = title.includes("AI Library") ? title : `${title} · AI Library`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: new URL(path, siteOrigin).href },
    openGraph: { title: fullTitle, description, url: new URL(path, siteOrigin).href, type: "website", images: [{ url: new URL("/og?theme=dark", siteOrigin).href, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [new URL("/og?theme=dark", siteOrigin).href] },
  };
}
