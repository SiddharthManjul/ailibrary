import type { Metadata } from "next";
import { HeroSection } from "@/components/hero/hero-section";
import { LandingPage } from "@/components/landing/landing-page";
import { getSiteURL, landingDescription, landingTitle, StructuredData } from "@/components/landing/structured-data";

const siteURL = getSiteURL();

export const metadata: Metadata = {
  title: { absolute: landingTitle },
  description: landingDescription,
  metadataBase: siteURL ?? new URL("http://localhost:3000"),
  ...(siteURL ? { metadataBase: siteURL, alternates: { canonical: siteURL.href } } : {}),
  openGraph: {
    type: "website",
    title: landingTitle,
    description: landingDescription,
    siteName: "AI Library",
    ...(siteURL ? { url: siteURL.href } : {}),
    images: [
      { url: "/og?theme=dark", width: 1200, height: 630, alt: "AI Library: the AI kit your whole business can run on, dark theme" },
      { url: "/og?theme=light", width: 1200, height: 630, alt: "AI Library: the AI kit your whole business can run on, light theme" },
    ],
  },
  twitter: { card: "summary_large_image", title: landingTitle, description: landingDescription, images: [{ url: "/og?theme=dark", alt: "AI Library: the AI kit your whole business can run on" }] },
};

export default function HomePage() {
  return (
    <main id="top">
      <StructuredData />
      <HeroSection />
      <LandingPage />
    </main>
  );
}
