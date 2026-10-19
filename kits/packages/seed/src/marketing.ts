import type { PlantedCase, SeedRecords } from "./types.js";
import recipe from "../recipe/data.json" with { type: "json" };
import { at, common, date, id, money, pick, rng, slug } from "./random.js";

export function marketing(seed: number, planted: PlantedCase[]): Pick<SeedRecords, "ContentItem" | "SeoBrief" | "CompetitorChange" | "Mention" | "AdMetricDay"> {
  const random = rng(seed, 202);
  const ContentItem: SeedRecords["ContentItem"] = Array.from({ length: 30 }, (_, i) => {
    const title = pick(recipe.contentTopics, i);
    const kind = i < 20 ? "article" : i < 26 ? "video" : "podcast";
    const body = kind === "article" ? `# ${title}\n\nA fleet maintenance review begins with a clear asset list and named owners. This fictional Fieldline guide explains a repeatable weekly routine.\n\n## Prepare the workshop\nCollect open work orders, parts availability and technician capacity. Review overdue inspections before assigning new work.\n\n## Run the review\nCheck the highest downtime assets first. Assign an owner, a service window and a measurable next action to each open item. Compare the weekly maintenance backlog with the previous period.\n\n## Close the loop\nRecord completed repairs and verify that stock movements match the work order. Share a concise review with depot leads and make the next inspection date visible.\n` : `[00:00] ${title}\n[00:15] Host: Welcome to the Fieldline maintenance workshop. Today we review asset history, technician capacity and parts stock.\n[01:10] Planner: We start with overdue inspections, assign a depot owner and reserve the required parts.\n[02:30] Host: How do you confirm the plan worked?\n[03:00] Planner: Compare completed work orders with downtime and record the next service date.\n[04:00] Host: Keep the weekly review short and give every action an owner. End of fictional transcript.\n`;
    return { ...common("content", i, -60 + i), kind, channel: "blog", title, body, status: "published", metrics: { impressions: 1200 + random(9000), clicks: 80 + random(700), engagements: 30 + random(180) } };
  });
  const SeoBrief: SeedRecords["SeoBrief"] = Array.from({ length: 6 }, (_, i) => ({ ...common("seo-brief", i, -8), keyword: pick(recipe.contentTopics, i).toLowerCase(), intent: "informational", serp: [{ url: `https://fleet-notes.example/guides/${i + 1}`, title: pick(recipe.contentTopics, i), position: 1 }], outline: "Define the maintenance problem; explain the weekly routine; show a depot checklist; describe measurable outcomes.", questions: ["Who owns each maintenance action?", "How is vehicle downtime measured?"], entities: ["work order", "depot", "technician", "parts inventory"], wordCountTarget: 1200 + i * 100 }));
  const CompetitorChange: SeedRecords["CompetitorChange"] = Array.from({ length: 6 }, (_, i) => ({ ...common("competitor-change", i, -7 + i), competitor: pick(["Veyra Fleet", "Keltra Works", "Orven Dispatch"], i), url: `https://${slug(pick(["Veyra Fleet", "Keltra Works", "Orven Dispatch"], i))}.example/${i % 2 === 0 ? "pricing" : "changes"}`, kind: i % 2 === 0 ? "pricing" : "changelog", before: i % 2 === 0 ? "Growth includes 10 automation rules" : "Manual depot exports", after: i % 2 === 0 ? "Growth includes 20 automation rules" : "Scheduled depot exports", diffSummary: i % 2 === 0 ? "Automation allowance increased from 10 to 20" : "Added scheduled exports", detectedAt: at(-7 + i) }));
  const Mention: SeedRecords["Mention"] = Array.from({ length: 15 }, (_, i) => ({ ...common("mention", i, -10 + i % 10), platform: i % 2 === 0 ? "linkedin" : "x", url: `https://social.fieldline.example/posts/${i + 1}`, author: `${pick(recipe.firstNames, i)} ${pick(recipe.lastNames, i)}`, text: "Fieldline made our weekly workshop review easier to follow. The asset history and parts reservation view help our depot team.", sentiment: "positive", suggestedReply: "Thank you for sharing your workshop routine. We are glad the depot review is clearer." }));
  const anomalyIndices = [31, 192, 350, 487];
  const AdMetricDay: SeedRecords["AdMetricDay"] = Array.from({ length: 540 }, (_, i) => {
    const anomalyIndex = anomalyIndices.indexOf(i);
    const spend = 4000 + random(2500);
    const impressions = 8000 + random(5000);
    const clicks = 180 + random(100);
    const conversions = 8 + random(12);
    const actualConversions = anomalyIndex === 1 ? 1 : anomalyIndex === 2 ? 0 : conversions;
    const row: SeedRecords["AdMetricDay"][number] = { ...common("ad-metric", i, -179 + Math.floor(i / 3)), date: date(-179 + Math.floor(i / 3)), platform: pick(["linkedin", "search", "x"], i), campaign: "fleet-maintenance-growth", spend: money(anomalyIndex === 0 ? spend * 8 : spend), impressions: anomalyIndex === 3 ? Math.floor(impressions / 10) : impressions, clicks: anomalyIndex === 1 ? 2 : clicks, conversions: actualConversions, revenue: money(actualConversions * 49000) };
    if (anomalyIndex >= 0) { const metric = pick(["spend", "clicks", "conversions", "impressions"], anomalyIndex); row.anomaly = { metric, zScore: anomalyIndex === 0 ? 7.8 : -6.1, note: `Abrupt ${metric} deviation from the campaign baseline` }; planted.push({ id: id("case-ad-anomaly", anomalyIndex), kind: "ad_anomaly", recordType: "AdMetricDay", recordIds: [row.id], description: row.anomaly.note, expected: `Flag ${metric} against the preceding campaign baseline and request human review.` }); }
    return row;
  });
  return { ContentItem, SeoBrief, CompetitorChange, Mention, AdMetricDay };
}
