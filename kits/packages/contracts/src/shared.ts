import { z } from "zod";

/** Shared wire values. Validation never converts dates to Date objects. */
export const TextSchema = z.string().min(1);
export const IdentifierSchema = TextSchema;
const singleLine = /^[^\r\n]*(?![\s\S])/;
export const TimestampSchema = z.iso.datetime({ offset: true }).regex(singleLine).meta({ format: "date-time" });
export const DateSchema = z.iso.date().regex(singleLine).meta({ format: "date" });
export const CurrencySchema = z.string().regex(/^[A-Z]{3}$(?![\s\S])/);
export const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$(?![\s\S])/);
const numericVersion = "(0|[1-9][0-9]*)";
const prereleaseIdentifier = "(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)";
const semanticVersion = `${numericVersion}\\.${numericVersion}\\.${numericVersion}(?:-${prereleaseIdentifier}(?:\\.${prereleaseIdentifier})*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?`;
export const VersionSchema = z.string().regex(new RegExp(`^${semanticVersion}$(?![\\s\\S])`));
export const SourceSchema = z.string().regex(new RegExp(`^(workflow|agent):[a-z0-9]+(?:-[a-z0-9]+)*@${semanticVersion}$(?![\\s\\S])`));
// A portable HTTP(S) wire pattern keeps Zod, JSON Schema and Python in agreement.
// Unlike URL parsing, this never trims or normalizes the submitted string.
// eslint-disable-next-line no-control-regex -- HTTP wire values must reject embedded control characters.
export const UrlSchema = z.string().regex(/^https?:\/\/(?:[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?|\[[0-9A-Fa-f:.]+\])(?::[0-9]{1,5})?(?:[/?#][^\u0000-\u0020\u007f-\u009f\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]*)?$(?![\s\S])/);
export const EmailSchema = z.email().regex(singleLine).meta({ format: "email" });
export const CountSchema = z.number().int().nonnegative();
export const ScoreSchema = z.number().min(0).max(100);
export const ConfidenceSchema = z.number().min(0).max(1);
export const JsonValueSchema = z.json();

export const commonShape = {
  id: IdentifierSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  source: SourceSchema,
  aiUsed: z.boolean(),
};

export const ApprovalSchema = z.strictObject({
  ...commonShape,
  kind: z.enum(["send_reply", "publish", "refund", "crm_write", "payment", "access_change", "other"]),
  subject: TextSchema,
  summary: TextSchema,
  payload: JsonValueSchema,
  requestedBy: IdentifierSchema,
  requestedAt: TimestampSchema,
  status: z.enum(["pending", "approved", "rejected", "expired"]),
  decidedBy: IdentifierSchema.optional(),
  decidedAt: TimestampSchema.optional(),
  reason: TextSchema.optional(),
});
export type Approval = z.infer<typeof ApprovalSchema>;
export const ApprovalJsonSchema = z.toJSONSchema(ApprovalSchema, { target: "draft-2020-12" });

export const RunEventSchema = z.strictObject({
  ...commonShape,
  itemSlug: SlugSchema,
  itemKind: z.enum(["workflow", "agent"]),
  version: VersionSchema,
  startedAt: TimestampSchema,
  endedAt: TimestampSchema,
  status: z.enum(["success", "partial", "failed", "skipped"]),
  steps: CountSchema,
  model: TextSchema.optional(),
  tokensIn: CountSchema.optional(),
  tokensOut: CountSchema.optional(),
  costUsd: z.number().nonnegative().optional(),
  error: z.strictObject({ class: TextSchema, message: TextSchema }).optional(),
});
export type RunEvent = z.infer<typeof RunEventSchema>;
export const RunEventJsonSchema = z.toJSONSchema(RunEventSchema, { target: "draft-2020-12" });

export const DeadLetterSchema = z.strictObject({
  ...commonShape,
  itemSlug: SlugSchema,
  step: TextSchema,
  errorClass: z.enum(["transient", "input", "auth", "limit"]),
  message: TextSchema,
  input: JsonValueSchema,
  at: TimestampSchema,
  retries: CountSchema,
});
export type DeadLetter = z.infer<typeof DeadLetterSchema>;
export const DeadLetterJsonSchema = z.toJSONSchema(DeadLetterSchema, { target: "draft-2020-12" });
