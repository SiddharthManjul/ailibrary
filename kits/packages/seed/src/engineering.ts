import type { IncidentContext, PlantedCase, PullRequest, SeedRecords } from "./types.js";
import { at, common, date, id, pick } from "./random.js";
import { BUG_EDITS, SERVICE_SOURCE } from "./service.js";

function cleanAddition(index: number): string[] {
  const suffix = String(index + 1).padStart(3, "0");
  const limit = 24 + index;
  switch (index % 4) {
    case 0: return ["", `export function isDepot${suffix}Overdue(elapsedHours: number): boolean {`, `  return elapsedHours >= ${limit};`, "}"];
    case 1: return ["", `export function laborEstimate${suffix}(hours: number, rateCents: number): number {`, "  return Math.round(Math.max(0, hours) * Math.max(0, rateCents));", "}"];
    case 2: return ["", `export function reserveParts${suffix}(available: number, requested: number): number {`, "  return Math.max(0, available - Math.max(0, requested));", "}"];
    default: return ["", `export function serviceLabel${suffix}(assetId: string): string {`, `  return \`Depot ${suffix}: \${assetId}\`;`, "}"];
  }
}

export function pullRequests(planted: PlantedCase[]): PullRequest[] {
  const base = SERVICE_SOURCE.trimEnd().split("\n");
  return Array.from({ length: 80 }, (_, i) => {
    const edit = BUG_EDITS[i];
    const changed = edit ? base.map((line) => line === edit.before ? edit.after : line) : [...base, ...cleanAddition(i)];
    const diff: string[] = ["diff --git a/src/maintenance.ts b/src/maintenance.ts", "--- a/src/maintenance.ts", "+++ b/src/maintenance.ts", `@@ -1,${base.length} +1,${changed.length} @@`];
    if (edit) base.forEach((line) => { if (line === edit.before) diff.push(`-${line}`, `+${edit.after}`); else diff.push(` ${line}`); });
    else { base.forEach((line) => diff.push(` ${line}`)); cleanAddition(i).forEach((line) => diff.push(`+${line}`)); }
    const pr: PullRequest = { id: id("pr", i), number: 1001 + i, title: edit ? `Refactor ${edit.kind.replaceAll("_", " ")} calculation` : `Add depot ${i + 1} maintenance helper`, patch: `${diff.join("\n")}\n` };
    if (edit) { pr.plantedBug = edit.kind; planted.push({ id: id("case-pr-bug", i), kind: "code_bug", recordType: "PullRequest", recordIds: [pr.id], description: `${edit.kind}: src/maintenance.ts line ${edit.line}.`, expected: edit.expected }); }
    return pr;
  });
}

export function engineering(planted: PlantedCase[]): { records: Pick<SeedRecords, "Incident" | "PrReview" | "IssueRecord" | "Release">; context: IncidentContext; prs: PullRequest[] } {
  const context: IncidentContext = { deploys: [], alerts: [], errors: [] };
  const Incident: SeedRecords["Incident"] = Array.from({ length: 14 }, (_, i) => {
    const service = pick(["work-order-api", "parts-sync", "scheduler", "billing-worker"], i);
    const days = -84 + i * 6;
    const incidentId = id("incident", i);
    const deployId = id("deploy", i);
    const alertId = id("alert", i);
    const errorId = id("error", i);
    context.deploys.push({ id: deployId, incidentId, service, at: at(days, -20), sha: (i + 100).toString(16).padStart(40, "0") });
    context.alerts.push({ id: alertId, incidentId, at: at(days), service, metric: "error_rate_percent", value: 12 + i, threshold: 5 });
    context.errors.push({ id: errorId, incidentId, at: at(days, 1), service, message: "MaintenanceQueueTimeout: worker did not acknowledge within 5000 ms", stack: ["at enqueueWorkOrder (src/queue.ts:42:11)", "at handleRequest (src/api.ts:88:7)"], occurrences: 80 + i * 11 });
    return { ...common("incident", i, days), updatedAt: at(days, 90), alertSource: "Fieldline monitor", service, severity: pick(["sev1", "sev2", "sev3", "sev4"] as const, i), startedAt: at(days), summary: `${service} queue timeout after deployment ${deployId}`, suspects: [{ kind: "deploy", ref: deployId, url: `https://code.fieldline.example/deploys/${deployId}`, confidence: 0.88 }], owners: [id("person", 8 + i % 4)], links: [{ label: "Alert", url: `https://monitor.fieldline.example/alerts/${alertId}` }, { label: "Error trace", url: `https://errors.fieldline.example/events/${errorId}` }], status: "resolved", timeline: [{ at: at(days), text: `Alert ${alertId} exceeded the error threshold` }, { at: at(days, 15), text: `Correlated error ${errorId} with deployment ${deployId}` }, { at: at(days, 45), text: "Rolled back queue concurrency configuration" }, { at: at(days, 90), text: "Queue latency and error rate returned to baseline" }] };
  });
  const prs = pullRequests(planted);
  const PrReview: SeedRecords["PrReview"] = prs.map((pr, i) => {
    const bug = BUG_EDITS[i];
    return { ...common("pr-review", i, -30 + Math.floor(i / 4)), repo: "fieldline/maintenance-service", number: pr.number, headSha: (i + 1000).toString(16).padStart(40, "0"), risk: bug ? "high" : "low", summary: bug ? `Requires correction: ${bug.kind.replaceAll("_", " ")}` : "Adds a scoped maintenance utility without changing existing behavior", findings: bug ? [{ file: "src/maintenance.ts", line: bug.line, severity: "major", category: bug.kind, message: bug.expected, suggestion: `Restore: ${bug.before.trim()}` }] : [] };
  });
  const IssueRecord: SeedRecords["IssueRecord"] = Array.from({ length: 24 }, (_, i) => {
    const duplicate = i >= 20;
    return { ...common("issue", i, -15), tracker: "linear", key: `FL-${501 + i}`, title: duplicate ? `Queue timeout during maintenance sync ${i - 20 + 1}` : `Queue timeout during maintenance sync ${i + 1}`, body: `Depot operators see the maintenance queue timeout after a new configuration. Affected service: ${pick(["work-order-api", "parts-sync", "scheduler", "billing-worker"], i)}. Reproduction: open an asset, create a work order and submit during the scheduled sync.`, labels: ["maintenance", "triage"], priority: i % 2 === 0 ? "high" : "normal", duplicates: duplicate ? [`FL-${501 + i - 20}`] : [], missingInfo: [] };
  });
  for (let i = 20; i < 24; i++) planted.push({ id: id("case-issue-duplicate", i - 20), kind: "duplicate_issue", recordType: "IssueRecord", recordIds: [id("issue", i - 20), id("issue", i)], description: "Two issue reports describe the same maintenance sync failure.", expected: "Link the duplicate to the original FL issue and retain customer context." });
  const Release: SeedRecords["Release"] = Array.from({ length: 4 }, (_, i) => ({ ...common("release", i, -24 + i * 6), version: `1.${i + 1}.0`, date: date(-24 + i * 6), highlights: [`Depot ${i + 1} maintenance helpers`, "Improved queue visibility"], sections: [{ title: "Maintenance", items: [{ text: "Added reviewed maintenance helpers", prs: Array.from({ length: 18 }, (_, j) => 1007 + i * 18 + j) }] }] }));
  return { records: { Incident, PrReview, IssueRecord, Release }, context, prs };
}
