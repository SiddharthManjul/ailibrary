import type { ReactNode } from "react";

import { Footer } from "@/components/landing/footer";
import { SiteNavigation } from "./site-navigation";
import "./site-shared.css";
import "./site.css";
import "./site-overrides.css";

export function SiteShell({ children }: { children: ReactNode }) {
  return <div className="landing lp-main st"><a className="st-skip" href="#site-content">Skip to content</a><SiteNavigation />{children}<Footer /></div>;
}
