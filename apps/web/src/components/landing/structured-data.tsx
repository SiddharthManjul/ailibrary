import { home } from "@content/home";

export const landingTitle = "AI Library: workflows, agents and UI kits for every team";
export const landingDescription = "Production-ready workflows, agents and UI components running standalone & packaged as kits for every team.";

export function getSiteURL() {
  const hostname = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const configured = process.env.NEXT_PUBLIC_SITE_URL || (hostname ? `https://${hostname}` : undefined);
  if (!configured) return undefined;
  try {
    const url = new URL(configured);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return undefined;
    return new URL(url.origin);
  } catch {
    return undefined;
  }
}

export function StructuredData() {
  const siteURL = getSiteURL();
  const organization = {
    "@type": "Organization",
    name: "AI Library",
    description: landingDescription,
    ...(siteURL ? { "@id": new URL("/#organization", siteURL).href, url: siteURL.href, logo: new URL("/icon.svg", siteURL).href } : {}),
  };
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      ...home.pricing.map((plan) => ({
        "@type": "Product",
        name: `AI Library ${plan.k}`,
        description: plan.d,
        category: "Software",
        brand: { "@type": "Brand", name: "AI Library" },
        ...(siteURL ? { url: new URL(`/pricing?plan=${encodeURIComponent(plan.k.toLowerCase())}`, siteURL).href, image: new URL("/og?theme=dark", siteURL).href } : {}),
      })),
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />;
}
