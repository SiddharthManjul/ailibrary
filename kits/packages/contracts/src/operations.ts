import { z } from "zod";
import { commonShape, ConfidenceSchema, CountSchema, CurrencySchema, DateSchema, EmailSchema, IdentifierSchema, TextSchema } from "./shared.js";

export const InvoiceSchema = z.strictObject({
  ...commonShape,
  kind: z.enum(["invoice", "receipt", "credit_note"]),
  vendor: z.strictObject({ name: TextSchema, taxId: TextSchema.optional(), email: EmailSchema.optional(), address: TextSchema.optional() }),
  number: TextSchema,
  issueDate: DateSchema,
  dueDate: DateSchema.optional(),
  currency: CurrencySchema,
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  lineItems: z.array(z.strictObject({ description: TextSchema, quantity: z.number().positive(), unitPrice: z.number(), amount: z.number(), taxRate: ConfidenceSchema.optional() })),
  poNumber: TextSchema.optional(),
  fieldConfidence: z.record(z.string(), ConfidenceSchema),
  checks: z.array(z.strictObject({ name: TextSchema, passed: z.boolean(), detail: TextSchema })),
  status: z.enum(["extracted", "needs_review", "approved", "posted", "rejected", "duplicate"]),
  ledgerRef: TextSchema.optional(),
  file: z.strictObject({ name: TextSchema, sha256: z.string().regex(/^[a-fA-F0-9]{64}$(?![\s\S])/) }),
});
export type Invoice = z.infer<typeof InvoiceSchema>;
export const InvoiceJsonSchema = z.toJSONSchema(InvoiceSchema, { target: "draft-2020-12" });

export const ContractSchema = z.strictObject({
  ...commonShape,
  counterparty: TextSchema,
  kind: TextSchema,
  startDate: DateSchema,
  endDate: DateSchema.optional(),
  autoRenew: z.boolean(),
  noticeDays: CountSchema.optional(),
  renewalDate: DateSchema.optional(),
  value: z.number().nonnegative().optional(),
  currency: CurrencySchema.optional(),
  keyTerms: z.array(z.strictObject({ name: TextSchema, value: TextSchema, clause: TextSchema })),
});
export type Contract = z.infer<typeof ContractSchema>;
export const ContractJsonSchema = z.toJSONSchema(ContractSchema, { target: "draft-2020-12" });

export const TransactionSchema = z.strictObject({
  ...commonShape,
  date: DateSchema,
  merchant: TextSchema,
  amount: z.number(),
  currency: CurrencySchema,
  category: TextSchema.optional(),
  cardholder: TextSchema.optional(),
  memo: TextSchema.optional(),
  anomaly: z.strictObject({ score: ConfidenceSchema, reasons: z.array(TextSchema) }).optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;
export const TransactionJsonSchema = z.toJSONSchema(TransactionSchema, { target: "draft-2020-12" });

export const KpiSnapshotSchema = z.strictObject({
  ...commonShape,
  period: z.string().regex(/^[0-9]{4}-(?:0[1-9]|1[0-2]|W(?:0[1-9]|[1-4][0-9]|5[0-3]))$(?![\s\S])/),
  metrics: z.record(z.string(), z.number()),
  deltas: z.record(z.string(), z.number()),
  notes: z.array(TextSchema),
});
export type KpiSnapshot = z.infer<typeof KpiSnapshotSchema>;
export const KpiSnapshotJsonSchema = z.toJSONSchema(KpiSnapshotSchema, { target: "draft-2020-12" });

export const TaskSchema = z.strictObject({
  ...commonShape,
  title: TextSchema,
  ownerEmail: EmailSchema.optional(),
  dueDate: DateSchema.optional(),
  sourceKind: z.enum(["meeting", "email", "doc"]),
  sourceId: IdentifierSchema,
  tool: z.enum(["linear", "asana", "notion", "jira", "todoist"]),
  externalId: IdentifierSchema.optional(),
});
export type Task = z.infer<typeof TaskSchema>;
export const TaskJsonSchema = z.toJSONSchema(TaskSchema, { target: "draft-2020-12" });
