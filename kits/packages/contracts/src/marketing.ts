import { z } from "zod";
import { commonShape, CountSchema, DateSchema, IdentifierSchema, TextSchema, TimestampSchema, UrlSchema } from "./shared.js";

export const ContentItemSchema = z.strictObject({
  ...commonShape,
  sourceId: IdentifierSchema.optional(),
  kind: z.enum(["article", "video", "podcast", "post", "thread", "newsletter", "carousel", "brief", "testimonial"]),
  channel: z.enum(["x", "linkedin", "newsletter", "blog", "instagram"]).optional(),
  title: TextSchema.optional(),
  body: TextSchema,
  status: z.enum(["draft", "pending_approval", "approved", "scheduled", "published", "rejected"]),
  scheduledAt: TimestampSchema.optional(),
  approval: IdentifierSchema.optional(),
  metrics: z.strictObject({ impressions: CountSchema.optional(), clicks: CountSchema.optional(), engagements: CountSchema.optional() }).optional(),
});
export type ContentItem = z.infer<typeof ContentItemSchema>;
export const ContentItemJsonSchema = z.toJSONSchema(ContentItemSchema, { target: "draft-2020-12" });

export const SeoBriefSchema = z.strictObject({
  ...commonShape,
  keyword: TextSchema,
  intent: TextSchema,
  serp: z.array(z.strictObject({ url: UrlSchema, title: TextSchema, position: z.number().int().positive() })),
  outline: TextSchema,
  questions: z.array(TextSchema),
  entities: z.array(TextSchema),
  wordCountTarget: z.number().int().positive(),
});
export type SeoBrief = z.infer<typeof SeoBriefSchema>;
export const SeoBriefJsonSchema = z.toJSONSchema(SeoBriefSchema, { target: "draft-2020-12" });

export const CompetitorChangeSchema = z.strictObject({
  ...commonShape,
  competitor: TextSchema,
  url: UrlSchema,
  kind: z.enum(["pricing", "changelog", "page"]),
  before: TextSchema.optional(),
  after: TextSchema,
  diffSummary: TextSchema,
  detectedAt: TimestampSchema,
});
export type CompetitorChange = z.infer<typeof CompetitorChangeSchema>;
export const CompetitorChangeJsonSchema = z.toJSONSchema(CompetitorChangeSchema, { target: "draft-2020-12" });

export const MentionSchema = z.strictObject({
  ...commonShape,
  platform: TextSchema,
  url: UrlSchema,
  author: TextSchema,
  text: TextSchema,
  sentiment: TextSchema,
  suggestedReply: TextSchema.optional(),
});
export type Mention = z.infer<typeof MentionSchema>;
export const MentionJsonSchema = z.toJSONSchema(MentionSchema, { target: "draft-2020-12" });

export const AdMetricDaySchema = z.strictObject({
  ...commonShape,
  date: DateSchema,
  platform: TextSchema,
  campaign: TextSchema,
  spend: z.number().nonnegative(),
  impressions: CountSchema,
  clicks: CountSchema,
  conversions: CountSchema,
  revenue: z.number().optional(),
  anomaly: z.strictObject({ metric: TextSchema, zScore: z.number(), note: TextSchema }).optional(),
});
export type AdMetricDay = z.infer<typeof AdMetricDaySchema>;
export const AdMetricDayJsonSchema = z.toJSONSchema(AdMetricDaySchema, { target: "draft-2020-12" });
