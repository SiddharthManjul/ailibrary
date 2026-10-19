import { z } from "zod";
import { commonShape, CountSchema, CurrencySchema, DateSchema, EmailSchema, IdentifierSchema, JsonValueSchema, ScoreSchema, TextSchema, TimestampSchema, UrlSchema } from "./shared.js";

export const LeadSchema = z.strictObject({
  ...commonShape,
  email: EmailSchema,
  firstName: TextSchema,
  lastName: TextSchema,
  title: TextSchema,
  phone: TextSchema.optional(),
  company: z.strictObject({ name: TextSchema, domain: TextSchema, employees: CountSchema.optional(), industry: TextSchema.optional(), country: TextSchema.optional() }),
  channel: z.enum(["form", "chat", "import", "visitor", "event"]),
  utm: z.strictObject({ source: TextSchema, medium: TextSchema, campaign: TextSchema }).optional(),
  message: TextSchema.optional(),
  enrichment: z.strictObject({ provider: TextSchema, fetchedAt: TimestampSchema, fields: z.record(z.string(), JsonValueSchema) }).optional(),
  qualification: z.strictObject({
    opener: z.string().refine((value) => Array.from(value).length <= 160).meta({ maxLength: 160 }),
    language: TextSchema,
    emailClass: z.enum(["business", "free", "disposable"]),
    roleInbox: z.boolean(),
    enrichmentDeferred: z.boolean(),
  }).optional(),
  score: z.strictObject({ fit: ScoreSchema, intent: ScoreSchema, total: ScoreSchema, tier: z.enum(["hot", "warm", "cold", "disqualified"]), reasons: z.array(TextSchema) }),
  ownerId: IdentifierSchema.optional(),
  crmId: IdentifierSchema.optional(),
  status: z.enum(["new", "routed", "contacted", "disqualified"]),
});
export type Lead = z.infer<typeof LeadSchema>;
export const LeadJsonSchema = z.toJSONSchema(LeadSchema, { target: "draft-2020-12" });

export const AccountSchema = z.strictObject({
  ...commonShape,
  domain: TextSchema,
  name: TextSchema,
  industry: TextSchema.optional(),
  employees: CountSchema.optional(),
  revenueBand: TextSchema.optional(),
  hq: TextSchema.optional(),
  techStack: z.array(TextSchema),
  signals: z.array(z.strictObject({ kind: z.enum(["hiring", "funding", "news", "launch", "job_change"]), title: TextSchema, url: UrlSchema, date: DateSchema })),
  brief: TextSchema.optional(),
  crmId: IdentifierSchema.optional(),
});
export type Account = z.infer<typeof AccountSchema>;
export const AccountJsonSchema = z.toJSONSchema(AccountSchema, { target: "draft-2020-12" });

export const DealSchema = z.strictObject({
  ...commonShape,
  name: TextSchema,
  accountId: IdentifierSchema,
  ownerId: IdentifierSchema,
  stage: z.enum(["lead", "qualified", "demo", "proposal", "negotiation", "won", "lost"]),
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  closeDate: DateSchema,
  lastActivityAt: TimestampSchema,
  nextStep: TextSchema.optional(),
  health: z.strictObject({ score: ScoreSchema, risks: z.array(TextSchema) }).optional(),
});
export type Deal = z.infer<typeof DealSchema>;
export const DealJsonSchema = z.toJSONSchema(DealSchema, { target: "draft-2020-12" });

export const ActivitySchema = z.strictObject({
  ...commonShape,
  type: z.enum(["call", "email", "meeting", "note", "task"]),
  subjectType: z.enum(["lead", "account", "deal"]),
  subjectId: IdentifierSchema,
  ownerId: IdentifierSchema,
  at: TimestampSchema,
  summary: TextSchema,
  outcome: TextSchema.optional(),
  nextSteps: z.array(TextSchema),
});
export type Activity = z.infer<typeof ActivitySchema>;
export const ActivityJsonSchema = z.toJSONSchema(ActivitySchema, { target: "draft-2020-12" });
