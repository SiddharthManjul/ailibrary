import items from "./data/items.json";
import pageData from "./data/catalog-pages.json";
export { kits, siteData, icons, type Kit } from "./settings";

export type KitSlug = "sales" | "support" | "marketing" | "engineering" | "operations";
export type ThumbnailData = { variant: string; bars: number[]; w1: number; w2: number; w3: number };
type CatalogBase = { title: string; summary: string; free: boolean; docId: string; docPath: string; slug: string };
export type Workflow = CatalogBase & { id: string; kit: string; n: string; kitHero: boolean; platforms: string[]; apps: string[]; thumbNodes: string[] };
export type Agent = CatalogBase & { id: string; kit: string; nextDrop: boolean; readTools: number; writeTools: number; targets: { pass?: string; p95?: string; cost?: string }; cardRun: { tool: string; state: string }[] };
export type UIItem = CatalogBase & { group: string; thumbnail: ThumbnailData };
export type FilterOption = { label: string; count: number; trio?: string[] };
export type FilterGroup = { title: string; options: FilterOption[] };
export type CatalogPageData = { title: string; sub: string; stats: { v: string; l: string }[]; searchPlaceholder: string; filters: FilterGroup[]; blocksTab?: { searchPlaceholder: string; filters: FilterGroup[] } };

export const workflows: Workflow[] = items.workflows;
export const agents: Agent[] = items.agents;
export const components: UIItem[] = items.components;
export const blocks: UIItem[] = items.blocks;
export const catalogPages: Record<"workflows" | "agents" | "ui", CatalogPageData> = pageData;

export type SearchItem = { title: string; type: string; kit: string; path: string };
export const searchIndex: SearchItem[] = [
  ...workflows.map(item => ({ title: item.title, type: "Workflow", kit: item.kit, path: item.docPath })),
  ...agents.map(item => ({ title: item.title, type: "Agent", kit: item.kit, path: item.docPath })),
  ...components.map(item => ({ title: item.title, type: "Component", kit: "", path: item.docPath })),
  ...blocks.map(item => ({ title: item.title, type: "Block", kit: "", path: item.docPath })),
];
