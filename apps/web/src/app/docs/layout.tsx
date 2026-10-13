import type { ReactNode } from "react";
import { SiteShell } from "@/components/site/site-shell";
import "@/components/site/docs-base.css";
import "@/components/site/docs.css";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
