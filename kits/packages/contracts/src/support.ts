import { z } from "zod";
import { commonShape, ConfidenceSchema, EmailSchema, IdentifierSchema, TextSchema, TimestampSchema, UrlSchema } from "./shared.js";

export const TicketSchema = z.strictObject({
  ...commonShape,
  channel: z.enum(["email", "chat", "form", "social"]),
  subject: TextSchema,
  body: TextSchema,
  customer: z.strictObject({ email: EmailSchema, name: TextSchema.optional(), accountId: IdentifierSchema.optional(), plan: TextSchema.optional(), mrr: z.number().nonnegative().optional() }),
  language: z.string().regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$(?![\s\S])/),
  category: TextSchema,
  priority: z.enum(["p1", "p2", "p3", "p4"]),
  sentiment: z.enum(["negative", "neutral", "positive"]),
  sentimentScore: z.number().min(-1).max(1),
  intent: TextSchema,
  team: TextSchema.optional(),
  assigneeId: IdentifierSchema.optional(),
  status: z.enum(["new", "open", "pending", "solved", "closed"]),
  slaDueAt: TimestampSchema.optional(),
  firstResponseAt: TimestampSchema.optional(),
  resolvedAt: TimestampSchema.optional(),
  csat: z.number().int().min(1).max(5).optional(),
  externalId: IdentifierSchema,
});
export type Ticket = z.infer<typeof TicketSchema>;
export const TicketJsonSchema = z.toJSONSchema(TicketSchema, { target: "draft-2020-12" });

export const DraftReplySchema = z.strictObject({
  ...commonShape,
  ticketId: IdentifierSchema,
  body: TextSchema,
  citations: z.array(z.strictObject({ claim: TextSchema, sourceId: IdentifierSchema, url: UrlSchema.optional() })),
  confidence: ConfidenceSchema,
  status: z.enum(["pending", "approved", "edited", "sent", "rejected"]),
  approval: IdentifierSchema.optional(),
});
export type DraftReply = z.infer<typeof DraftReplySchema>;
export const DraftReplyJsonSchema = z.toJSONSchema(DraftReplySchema, { target: "draft-2020-12" });

export const QaScoreSchema = z.strictObject({
  ...commonShape,
  ticketId: IdentifierSchema,
  agentId: IdentifierSchema,
  rubric: z.array(z.strictObject({ criterion: TextSchema, score: z.number().int().min(1).max(5), note: TextSchema })),
  total: z.number().nonnegative(),
  coaching: TextSchema.optional(),
});
export type QaScore = z.infer<typeof QaScoreSchema>;
export const QaScoreJsonSchema = z.toJSONSchema(QaScoreSchema, { target: "draft-2020-12" });

export const ChurnSignalSchema = z.strictObject({
  ...commonShape,
  accountId: IdentifierSchema,
  signals: z.array(z.strictObject({ kind: TextSchema, detail: TextSchema, at: TimestampSchema })),
  risk: z.enum(["low", "medium", "high"]),
  ownerId: IdentifierSchema.optional(),
});
export type ChurnSignal = z.infer<typeof ChurnSignalSchema>;
export const ChurnSignalJsonSchema = z.toJSONSchema(ChurnSignalSchema, { target: "draft-2020-12" });
