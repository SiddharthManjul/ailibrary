import { blocks, catalogPages, components } from "@content/site/catalog";
import { Catalog } from "@/components/site/catalog";
import { pageMetadata } from "@/lib/site-metadata";
import "@/components/site/catalog.css";

export const metadata = pageMetadata("UI", catalogPages.ui.sub, "/ui");

export default function UIPage() {
  return <Catalog data={{ kind: "ui", page: catalogPages.ui, components, blocks }} />;
}
