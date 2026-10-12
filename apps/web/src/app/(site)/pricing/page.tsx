import { PricingPage } from "@/components/site/pricing";
import { PricingStudio, PricingTeamAndComparison } from "@/components/site/pricing-details";
import { pageMetadata } from "@/lib/site-metadata";
import "@/components/site/pricing.css";

export const metadata = pageMetadata("Pricing", "Pay once for production-ready workflows, agents and UI. Compare individual and team plans, calculate upgrade credit and keep everything you install.", "/pricing");

export default function PricingRoute() {
  return <PricingPage beforeEstimate={<PricingTeamAndComparison />} afterEstimate={<PricingStudio />} />;
}
