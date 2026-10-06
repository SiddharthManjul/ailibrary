import { AgentsSection } from "./agents-section";
import { ClosingSection } from "./closing-section";
import { FAQSection } from "./faq-section";
import { Footer } from "./footer";
import { FreeSection } from "./free-section";
import { InstallSection } from "./install-section";
import { KitsSection } from "./kits-section";
import { LandingNavigation } from "./landing-navigation";
import { PricingSection } from "./pricing-section";
import { StudioSection } from "./studio-section";
import { TestedSection } from "./tested-section";
import { UISection } from "./ui-section";
import { WorkflowsSection } from "./workflows-section";
import { WorksWith } from "./works-with";
import "./landing.css";

export function LandingPage() {
  return <div className="landing lp-main"><LandingNavigation /><WorksWith /><KitsSection /><WorkflowsSection /><AgentsSection /><UISection /><InstallSection /><TestedSection /><FreeSection /><PricingSection /><StudioSection /><FAQSection /><ClosingSection /><Footer /></div>;
}
