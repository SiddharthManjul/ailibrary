import { agents, catalogPages } from "@content/site/catalog";
import { Catalog } from "@/components/site/catalog";
import { pageMetadata } from "@/lib/site-metadata";
import "@/components/site/catalog.css";

export const metadata = pageMetadata("Agents", catalogPages.agents.sub, "/agents");

export default function AgentsPage() {
  return <Catalog data={{ kind: "agents", page: catalogPages.agents, items: agents }} />;
}
