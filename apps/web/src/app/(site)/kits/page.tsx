import { Kits } from "@/components/site/kits";
import { pageMetadata } from "@/lib/site-metadata";
import "@/components/site/kits.css";

export const metadata = pageMetadata("Kits", "Every workflow, agent and screen one team needs, wired together on the same data and tested every night.", "/kits");

export default function KitsPage() {
  return <Kits />;
}
