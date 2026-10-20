import { cache } from "react";
import { generateDataset } from "@ai-library/seed/generator";
import { getConfidenceBadgeDesignScene, getDiffViewerDesignScene, getSparklineDesignScene } from "@ai-library/seed/design";

/** Explicit synthetic design scenario; the original record dataset remains intact. */
export const getUIDesignSparklineScene = cache(getSparklineDesignScene);
export const getUIDesignConfidenceScene = cache(getConfidenceBadgeDesignScene);
export const getUIDesignDiffScene = cache(getDiffViewerDesignScene);

/** Real deterministic F2 data stays on the server; previews receive only seven rows. */
export const getFieldlineChartRows = cache(() => {
  const { records } = generateDataset();
  const stages = ["lead", "qualified", "demo", "proposal", "negotiation", "won", "lost"] as const;
  const labels = {
    lead: "Lead", qualified: "Qualified", demo: "Demo", proposal: "Proposal",
    negotiation: "Negotiation", won: "Won", lost: "Lost",
  } as const;
  return stages.map((stage) => ({
    id: stage,
    label: labels[stage],
    value: records.Deal.filter((deal) => deal.stage === stage).length,
  }));
});

/** Only seven UTC buckets cross the server/client boundary, including zero days. */
export const getFieldlineLeadDays = cache(() => {
  const { records } = generateDataset();
  const counts = new Map<string, number>();
  for (const lead of records.Lead) {
    const day = lead.createdAt.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const lastDay = [...counts.keys()].sort().at(-1);
  if (!lastDay) return [];
  const end = Date.parse(`${lastDay}T00:00:00Z`);
  const format = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return Array.from({ length: 7 }, (_, index) => {
    const instant = new Date(end - (6 - index) * 86_400_000);
    const date = instant.toISOString().slice(0, 10);
    return { date, label: format.format(instant), value: counts.get(date) ?? 0 };
  });
});
