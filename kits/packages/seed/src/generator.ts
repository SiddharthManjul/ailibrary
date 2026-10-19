import recipe from "../recipe/data.json" with { type: "json" };
import { DEFAULT_SEED, REFERENCE_DATE, at, id } from "./random.js";
import { sales } from "./sales.js";
import { knowledgeBase, support } from "./support.js";
import { engineering } from "./engineering.js";
import { marketing } from "./marketing.js";
import { operations, shared } from "./operations.js";
import type { MediaManifest, PlantedCase, SeedDataset } from "./types.js";

/** Independent deterministic logic, with no filesystem, clock or network reads. */
export function generateDataset(seed = DEFAULT_SEED, mediaManifest: MediaManifest = {}): SeedDataset {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError("Seed must be an unsigned 32-bit integer");
  const planted: PlantedCase[] = [];
  const salesRecords = sales(seed, planted);
  const kb = knowledgeBase(planted);
  const supportRecords = support(planted);
  const engineeringData = engineering(planted);
  const marketingRecords = marketing(seed, planted);
  const operationRecords = operations(seed, mediaManifest, planted);
  const sharedRecords = shared();
  supportRecords.DraftReply.slice(0, 12).forEach((draft, i) => { draft.approval = id("approval", i); draft.updatedAt = at(-4); });
  return { recipeVersion: recipe.version, seed, referenceDate: REFERENCE_DATE,
    company: { name: "Fieldline", domain: "fieldline.example", description: "B2B fleet maintenance software for work orders, parts inventory and technician scheduling", employees: 64, founded: 2021, headquarters: "Austin", offices: ["Austin", "Bangalore", "Lisbon"], plans: [{ name: "Starter", pricePerSeatUsd: 49, interval: "month" }, { name: "Growth", pricePerSeatUsd: 89, interval: "month" }, { name: "Enterprise", interval: "custom" }], stack: ["HubSpot", "Zendesk", "Slack", "Google Workspace", "GitHub", "Linear", "Sentry", "Datadog", "Vercel", "AWS", "Stripe", "Xero", "Notion", "Ahrefs", "Google Search Console", "LinkedIn", "X"] },
    people: structuredClone(recipe.people), records: { ...salesRecords, ...marketingRecords, ...supportRecords, ...engineeringData.records, ...operationRecords, ...sharedRecords }, knowledgeBase: kb, pullRequests: engineeringData.prs, engineeringContext: engineeringData.context, planted };
}
