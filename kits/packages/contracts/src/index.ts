export * from "./shared.js";
export * from "./sales.js";
export * from "./marketing.js";
export * from "./support.js";
export * from "./engineering.js";
export * from "./operations.js";

import { AccountSchema, ActivitySchema, DealSchema, LeadSchema } from "./sales.js";
import { AdMetricDaySchema, CompetitorChangeSchema, ContentItemSchema, MentionSchema, SeoBriefSchema } from "./marketing.js";
import { ChurnSignalSchema, DraftReplySchema, QaScoreSchema, TicketSchema } from "./support.js";
import { IncidentSchema, IssueRecordSchema, PrReviewSchema, ReleaseSchema } from "./engineering.js";
import { ContractSchema, InvoiceSchema, KpiSnapshotSchema, TaskSchema, TransactionSchema } from "./operations.js";
import { ApprovalSchema, DeadLetterSchema, RunEventSchema } from "./shared.js";

export const recordSchemas = {
  Lead: LeadSchema,
  Account: AccountSchema,
  Deal: DealSchema,
  Activity: ActivitySchema,
  ContentItem: ContentItemSchema,
  SeoBrief: SeoBriefSchema,
  CompetitorChange: CompetitorChangeSchema,
  Mention: MentionSchema,
  AdMetricDay: AdMetricDaySchema,
  Ticket: TicketSchema,
  DraftReply: DraftReplySchema,
  QaScore: QaScoreSchema,
  ChurnSignal: ChurnSignalSchema,
  Incident: IncidentSchema,
  PrReview: PrReviewSchema,
  IssueRecord: IssueRecordSchema,
  Release: ReleaseSchema,
  Invoice: InvoiceSchema,
  Contract: ContractSchema,
  Transaction: TransactionSchema,
  KpiSnapshot: KpiSnapshotSchema,
  Task: TaskSchema,
  Approval: ApprovalSchema,
  RunEvent: RunEventSchema,
  DeadLetter: DeadLetterSchema,
} as const;

export type RecordName = keyof typeof recordSchemas;
