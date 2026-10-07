"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";

const demos = {
  kits: dynamic(() => import("./kits-story-demo").then((module) => module.KitsStoryDemo)),
  ui: dynamic(() => import("./ui-showcase-demo").then((module) => module.UIShowcaseDemo)),
  workflow: dynamic(() => import("./workflow-demo").then((module) => module.WorkflowDemo)),
  agent: dynamic(() => import("./agent-demo").then((module) => module.AgentDemo)),
  "agent-results": dynamic(() => import("./agent-results").then((module) => module.AgentResults)),
  terminal: dynamic(() => import("./install-terminal").then((module) => module.InstallTerminal)),
  nightly: dynamic(() => import("./nightly-results").then((module) => module.NightlyResults)),
  free: dynamic(() => import("./free-items-grid").then((module) => module.FreeItemsGrid)),
  pricing: dynamic(() => import("./pricing-plans").then((module) => module.PricingPlans)),
  faq: dynamic(() => import("./faq-accordion").then((module) => module.FAQAccordion)),
};

export function LazyDemo({ name, children, codePanels }: { name: keyof typeof demos; children?: ReactNode; codePanels?: readonly ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); observer.disconnect(); }
    }, { rootMargin: "400px" });
    observer.observe(element);
    const reveal = (event: Event) => {
      const target = document.getElementById((event as CustomEvent<string>).detail);
      if (target && (target.contains(element) || Boolean(element.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING))) {
        setReady(true);
        observer.disconnect();
      }
    };
    window.addEventListener("landing:reveal", reveal);
    return () => { observer.disconnect(); window.removeEventListener("landing:reveal", reveal); };
  }, []);
  const Demo = demos[name] as ComponentType<{ children?: ReactNode; heading?: ReactNode; codePanels?: readonly ReactNode[] }>;
  return <div ref={ref} className={`lp-lazy lp-lazy-${name}`} data-ready={ready}>{ready ? <Demo heading={children} codePanels={codePanels}>{children}</Demo> : <><div className="lp-lazy-heading">{children}</div><div className="lp-demo-placeholder" aria-label="Interactive preview loading" /></>}</div>;
}
