import type { z } from "zod";
import type { recordSchemas, RecordName } from "@ai-library/contracts";

export type SeedRecords = { [K in RecordName]: z.infer<(typeof recordSchemas)[K]>[] };
export interface Person { id: string; name: string; email: string; roles: string[] }
export interface PlantedCase { id: string; kind: string; recordType: string; recordIds: string[]; description: string; expected: string }
export interface KnowledgeArticle { id: string; slug: string; title: string; body: string; category: string }
export interface PullRequest { id: string; number: number; title: string; patch: string; plantedBug?: string }
export interface MediaEntry { sha256: string; [key: string]: unknown }
export type MediaManifest = Record<string, MediaEntry>;
export interface DocumentSpec { id: string; recordType: "Invoice" | "Contract"; filename: string; kind: "pdf" | "image"; text: string[]; degraded: boolean; duplicateOf?: string }
export interface IncidentContext { deploys: { id: string; incidentId: string; service: string; at: string; sha: string }[]; alerts: { id: string; incidentId: string; at: string; service: string; metric: string; value: number; threshold: number }[]; errors: { id: string; incidentId: string; at: string; service: string; message: string; stack: string[]; occurrences: number }[] }
export interface SeedDataset { recipeVersion: string; seed: number; referenceDate: string; company: { name: string; domain: string; description: string; employees: number; founded: number; headquarters: string; offices: string[]; plans: { name: string; pricePerSeatUsd?: number; interval: string }[]; stack: string[] }; people: Person[]; records: SeedRecords; knowledgeBase: KnowledgeArticle[]; pullRequests: PullRequest[]; engineeringContext: IncidentContext; planted: PlantedCase[] }
