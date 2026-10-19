import { z } from "zod";
import { commonShape, ConfidenceSchema, DateSchema, TextSchema, TimestampSchema, UrlSchema, VersionSchema } from "./shared.js";

export const IncidentSchema = z.strictObject({
  ...commonShape,
  alertSource: TextSchema,
  service: TextSchema,
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"]),
  startedAt: TimestampSchema,
  summary: TextSchema,
  suspects: z.array(z.strictObject({ kind: z.enum(["deploy", "config", "dependency", "traffic"]), ref: TextSchema, url: UrlSchema, confidence: ConfidenceSchema })),
  owners: z.array(TextSchema),
  links: z.array(z.strictObject({ label: TextSchema, url: UrlSchema })),
  status: z.enum(["triggered", "investigating", "mitigated", "resolved"]),
  timeline: z.array(z.strictObject({ at: TimestampSchema, text: TextSchema })),
});
export type Incident = z.infer<typeof IncidentSchema>;
export const IncidentJsonSchema = z.toJSONSchema(IncidentSchema, { target: "draft-2020-12" });

export const PrReviewSchema = z.strictObject({
  ...commonShape,
  repo: TextSchema,
  number: z.number().int().positive(),
  headSha: z.string().regex(/^[a-fA-F0-9]{40}$(?![\s\S])/),
  risk: z.enum(["low", "medium", "high"]),
  summary: TextSchema,
  findings: z.array(z.strictObject({ file: TextSchema, line: z.number().int().positive().optional(), severity: z.enum(["info", "minor", "major", "blocker"]), category: TextSchema, message: TextSchema, suggestion: TextSchema.optional() })),
});
export type PrReview = z.infer<typeof PrReviewSchema>;
export const PrReviewJsonSchema = z.toJSONSchema(PrReviewSchema, { target: "draft-2020-12" });

export const IssueRecordSchema = z.strictObject({
  ...commonShape,
  tracker: z.enum(["github", "linear", "jira"]),
  key: TextSchema,
  title: TextSchema,
  body: TextSchema,
  labels: z.array(TextSchema),
  priority: TextSchema.optional(),
  duplicates: z.array(TextSchema),
  missingInfo: z.array(TextSchema),
});
export type IssueRecord = z.infer<typeof IssueRecordSchema>;
export const IssueRecordJsonSchema = z.toJSONSchema(IssueRecordSchema, { target: "draft-2020-12" });

export const ReleaseSchema = z.strictObject({
  ...commonShape,
  version: VersionSchema,
  date: DateSchema,
  highlights: z.array(TextSchema),
  sections: z.array(z.strictObject({ title: TextSchema, items: z.array(z.strictObject({ text: TextSchema, prs: z.array(z.number().int().positive()) })) })),
});
export type Release = z.infer<typeof ReleaseSchema>;
export const ReleaseJsonSchema = z.toJSONSchema(ReleaseSchema, { target: "draft-2020-12" });
