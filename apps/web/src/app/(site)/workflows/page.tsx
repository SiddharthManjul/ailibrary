import { catalogPages, workflows } from "@content/site/catalog";
import { Catalog } from "@/components/site/catalog";
import { pageMetadata } from "@/lib/site-metadata";
import "@/components/site/catalog.css";

export const metadata = pageMetadata("Workflows", catalogPages.workflows.sub, "/workflows");

export default function WorkflowsPage() {
  return <Catalog data={{ kind: "workflows", page: catalogPages.workflows, items: workflows }} />;
}
