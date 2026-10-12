import data from "./data/site-data.json";
import iconData from "./data/icons.json";

export type Kit = { slug: string; name: string; trio: string[]; components: number; promise: string; heroWorkflow: string; heroAgent: string; dashboardBlock: string; apps: string; installCommand: string; docId: string };
export const kits: Kit[] = data.kits;
export const siteData = data;
export const icons: Record<string, string> = iconData;
