import assert from "node:assert/strict";
import { recordSchemas, type RecordName } from "@ai-library/contracts";
import recipe from "../recipe/data.json" with { type: "json" };
import { validateSeedRecords } from "./load.js";
import { REFERENCE_DATE, SOURCE } from "./random.js";
import type { SeedDataset } from "./types.js";
import { documentSpecs } from "./documents.js";

export const EXPECTED_COUNTS: Record<RecordName, number> = {
  Account: 60, Lead: 240, Deal: 45, Activity: 900, ContentItem: 30, SeoBrief: 6,
  CompetitorChange: 6, Mention: 15, AdMetricDay: 540, Ticket: 600, DraftReply: 24,
  QaScore: 24, ChurnSignal: 6, Incident: 14, PrReview: 80, IssueRecord: 24,
  Release: 4, Invoice: 120, Contract: 18, Transaction: 3000, KpiSnapshot: 6,
  Task: 18, Approval: 12, RunEvent: 18, DeadLetter: 6,
};
const members = (rows: readonly { id: string }[]) => new Set(rows.map((row) => row.id));
const cents = (value: number) => Math.round(value * 100);

/** F1 validation plus the relationships and deliberately planted F2 cases. */
export function validateDataset(dataset: SeedDataset, requireMedia = false): SeedDataset {
  assert.ok(Number.isInteger(dataset.seed) && dataset.seed >= 0 && dataset.seed <= 0xffffffff, "Invalid seed");
  assert.equal(dataset.referenceDate, REFERENCE_DATE);
  assert.equal(dataset.recipeVersion, recipe.version);
  validateSeedRecords(dataset.records);
  const names = Object.keys(recordSchemas) as RecordName[];
  const ids = new Set<string>();
  for (const name of names) {
    assert.equal(dataset.records[name].length, EXPECTED_COUNTS[name], `${name} count`);
    for (const record of dataset.records[name]) {
      assert.ok(!ids.has(record.id), `Repeated global record id ${record.id}`); ids.add(record.id);
      assert.equal(record.source, SOURCE); assert.equal(record.aiUsed, false);
      assert.ok(record.createdAt <= record.updatedAt && record.updatedAt <= REFERENCE_DATE, `Invalid chronology ${record.id}`);
    }
  }
  const { records: r } = dataset;
  assert.equal(dataset.people.length, 12); assert.equal(members(dataset.people).size, 12);
  assert.equal(dataset.company.employees, 64); assert.equal(dataset.company.domain, "fieldline.example");
  const people = members(dataset.people); const accounts = members(r.Account); const kb = members(dataset.knowledgeBase);
  const emails = new Set(dataset.people.map((person) => person.email));
  for (const [role, count] of Object.entries({ sales_rep: 2, sdr: 1, support_lead: 1, support_agent: 3, engineering_manager: 1, engineer: 4, marketer: 1, finance_lead: 1 })) {
    assert.equal(dataset.people.filter((person) => person.roles.includes(role)).length, count, `${role} count`);
  }
  for (const row of [...r.Lead, ...r.Deal, ...r.Activity, ...r.ChurnSignal]) if (row.ownerId) assert.ok(people.has(row.ownerId), `Unknown owner on ${row.id}`);
  for (const row of r.Ticket) {
    if (row.customer.accountId) assert.ok(accounts.has(row.customer.accountId), `Unknown customer on ${row.id}`);
    if (row.assigneeId) assert.ok(people.has(row.assigneeId));
    if (row.firstResponseAt) assert.ok(row.firstResponseAt >= row.createdAt && row.firstResponseAt <= row.updatedAt);
    if (row.resolvedAt) assert.ok(row.resolvedAt >= (row.firstResponseAt ?? row.createdAt) && row.resolvedAt <= row.updatedAt);
  }
  for (const row of r.QaScore) assert.ok(people.has(row.agentId));
  for (const row of r.DraftReply) for (const citation of row.citations) assert.ok(kb.has(citation.sourceId), `Unknown citation on ${row.id}`);
  for (const row of r.Activity) {
    const subjects = row.subjectType === "lead" ? r.Lead : row.subjectType === "account" ? r.Account : r.Deal;
    assert.ok(subjects.some((subject) => subject.id === row.subjectId), `Unknown activity subject ${row.id}`);
    assert.ok(row.at >= row.createdAt && row.at <= row.updatedAt);
    if (row.subjectType === "deal") assert.ok(row.at <= (r.Deal.find((deal) => deal.id === row.subjectId)?.lastActivityAt ?? ""), `Activity contradicts deal history ${row.id}`);
  }
  for (const row of r.Task) { assert.ok(r.Contract.some((contract) => contract.id === row.sourceId)); if (row.ownerEmail) assert.ok(emails.has(row.ownerEmail)); }
  for (const row of r.Approval) { assert.ok(people.has(row.requestedBy)); if (row.decidedBy) assert.ok(people.has(row.decidedBy)); }
  for (const row of r.Incident) {
    assert.ok(row.owners.every((owner) => people.has(owner)));
    for (const kind of ["deploys", "alerts", "errors"] as const) assert.equal(dataset.engineeringContext[kind].filter((context) => context.incidentId === row.id && context.service === row.service).length, 1, `${row.id} ${kind}`);
    assert.ok(row.timeline.every((event) => event.at >= row.startedAt && event.at <= row.updatedAt));
  }
  assert.equal(new Set(r.Ticket.map((row) => row.category)).size, 8);
  assert.deepEqual([...new Set(r.Ticket.map((row) => row.language))].sort(), [...recipe.languages].sort());
  assert.equal(new Set(r.Ticket.map((row) => row.priority)).size, 4);
  assert.ok(r.Ticket.every((row) => row.body.includes("\n> ") && row.body.includes(".example")));
  assert.equal(new Set(r.Deal.map((row) => row.stage)).size, 7);
  assert.equal(r.Deal.filter((row) => Date.parse(REFERENCE_DATE) - Date.parse(row.lastActivityAt) > 21 * 86400000).length, 8);
  assert.equal(r.Lead.filter((row) => ["mailme.example", "postbox.example", "publicmail.example"].includes(row.email.split("@")[1] ?? "")).length, 36);
  assert.equal(r.Lead.filter((row) => row.status === "disqualified").length, 12);
  assert.equal(r.Lead.length - new Set(r.Lead.map((row) => row.email)).size, 24);
  assert.equal(dataset.knowledgeBase.length, 45); assert.equal(kb.size, 45);
  assert.equal(dataset.pullRequests.length, 80); assert.equal(members(dataset.pullRequests).size, 80);
  assert.equal(dataset.pullRequests.filter((pr) => pr.plantedBug).length, 6);
  assert.ok(r.PrReview.every((review) => dataset.pullRequests.some((pr) => pr.number === review.number)));
  assert.equal(r.ContentItem.filter((row) => row.kind === "article").length, 20);
  assert.equal(r.ContentItem.filter((row) => row.kind === "video").length, 6);
  assert.equal(r.ContentItem.filter((row) => row.kind === "podcast").length, 4);
  assert.equal(new Set(r.AdMetricDay.map((row) => row.date)).size, 180);
  assert.ok([...new Set(r.AdMetricDay.map((row) => row.date))].every((date) => r.AdMetricDay.filter((row) => row.date === date).length === 3));
  assert.equal(r.AdMetricDay.filter((row) => row.anomaly).length, 4);
  assert.equal(r.Transaction.filter((row) => row.anomaly).length, 12);
  for (const month of new Set(r.Transaction.map((row) => row.date.slice(0, 7)))) assert.equal(r.Transaction.filter((row) => row.date.startsWith(month) && row.anomaly).length, 2);
  assert.equal(new Set(r.Invoice.map((row) => row.vendor.name)).size, 10);
  assert.deepEqual([...new Set(r.Invoice.map((row) => row.currency))].sort(), ["EUR", "GBP", "USD"]);
  assert.equal(r.Invoice.filter((row) => row.status === "duplicate").length, 6);
  assert.equal(r.Invoice.filter((row) => cents(row.total) !== cents(row.subtotal) + cents(row.tax)).length, 4);
  if (requireMedia) assert.ok(r.Invoice.every((row) => row.file.sha256 !== "0".repeat(64)), "Canonical media hashes required");

  const plantedIds = new Set<string>();
  const cases = (kind: string) => dataset.planted.filter((entry) => entry.kind === kind);
  for (const entry of dataset.planted) {
    assert.ok(!plantedIds.has(entry.id)); plantedIds.add(entry.id);
    assert.ok(entry.description && entry.expected && entry.recordIds.length);
    const valid = entry.recordType === "PullRequest" ? members(dataset.pullRequests) : members(r[entry.recordType as RecordName] ?? []);
    assert.ok(entry.recordIds.every((id) => valid.has(id)), `Dangling planted case ${entry.id}`);
  }
  for (const [kind, count] of Object.entries({ free_email: 1, junk_lead: 1, duplicate_contact: 24, idle_deal: 8, knowledge_gap: 6, churn_risk: 6, code_bug: 6, duplicate_issue: 4, ad_anomaly: 4, duplicate_invoice: 6, invoice_math_error: 4, degraded_scan: 5, transaction_anomaly: 12 })) assert.equal(cases(kind).length, count, `Planted ${kind}`);
  const emailFrequency = new Map<string, number>();
  for (const row of r.Lead) emailFrequency.set(row.email, (emailFrequency.get(row.email) ?? 0) + 1);
  const duplicatedIssueIds = new Set(r.IssueRecord.filter((row) => row.duplicates.length).flatMap((row) => [row.id, ...row.duplicates.map((key) => r.IssueRecord.find((original) => original.key === key)?.id ?? "missing")]));
  const duplicatedInvoiceIds = new Set(r.Invoice.filter((row) => row.status === "duplicate").flatMap((row) => [row.id, r.Invoice.find((original) => original.id !== row.id && original.number === row.number && original.vendor.name === row.vendor.name)?.id ?? "missing"]));
  const coverage: Record<string, [string, string[]]> = {
    free_email: ["Lead", r.Lead.filter((row) => ["mailme.example", "postbox.example", "publicmail.example"].includes(row.email.split("@")[1] ?? "")).map((row) => row.id)],
    junk_lead: ["Lead", r.Lead.filter((row) => row.status === "disqualified").map((row) => row.id)],
    duplicate_contact: ["Lead", r.Lead.filter((row) => (emailFrequency.get(row.email) ?? 0) > 1).map((row) => row.id)],
    idle_deal: ["Deal", r.Deal.filter((row) => Date.parse(REFERENCE_DATE) - Date.parse(row.lastActivityAt) > 21 * 86400000).map((row) => row.id)],
    knowledge_gap: ["Ticket", r.Ticket.filter((row) => recipe.gaps.some((gap) => row.subject === gap)).map((row) => row.id)],
    churn_risk: ["ChurnSignal", r.ChurnSignal.filter((row) => row.risk === "high").map((row) => row.id)],
    code_bug: ["PullRequest", dataset.pullRequests.filter((row) => row.plantedBug).map((row) => row.id)],
    duplicate_issue: ["IssueRecord", [...duplicatedIssueIds]],
    ad_anomaly: ["AdMetricDay", r.AdMetricDay.filter((row) => row.anomaly).map((row) => row.id)],
    duplicate_invoice: ["Invoice", [...duplicatedInvoiceIds]],
    invoice_math_error: ["Invoice", r.Invoice.filter((row) => cents(row.total) !== cents(row.subtotal) + cents(row.tax)).map((row) => row.id)],
    degraded_scan: ["Invoice", documentSpecs().filter((spec) => spec.degraded).map((spec) => spec.id)],
    transaction_anomaly: ["Transaction", r.Transaction.filter((row) => row.anomaly).map((row) => row.id)],
  };
  assert.equal(Object.keys(coverage).reduce((total, kind) => total + cases(kind).length, 0), dataset.planted.length, "Unknown planted kind");
  for (const [kind, [type, expected]] of Object.entries(coverage)) {
    assert.ok(cases(kind).every((entry) => entry.recordType === type), `Wrong planted record type: ${kind}`);
    const actual = cases(kind).flatMap((entry) => entry.recordIds);
    assert.equal(new Set(actual).size, actual.length, `Repeated planted membership: ${kind}`);
    assert.deepEqual(actual.sort(), [...expected].sort(), `Planted semantic coverage: ${kind}`);
  }
  for (const entry of cases("duplicate_contact")) {
    const [first, second] = entry.recordIds.map((id) => r.Lead.find((row) => row.id === id));
    assert.ok(first && second); assert.equal(first.email, second.email); assert.equal(first.crmId, second.crmId);
  }
  for (const entry of cases("duplicate_invoice")) {
    const [first, second] = entry.recordIds.map((id) => r.Invoice.find((row) => row.id === id));
    assert.ok(first && second); assert.equal(first.number, second.number); assert.equal(first.vendor.name, second.vendor.name); assert.equal(first.total, second.total);
    if (requireMedia) assert.equal(first.file.sha256, second.file.sha256);
  }
  for (const [i, entry] of cases("knowledge_gap").entries()) {
    const ticket = r.Ticket.find((row) => row.id === entry.recordIds[0]); const gap = recipe.gaps[i];
    assert.ok(ticket && gap && ticket.body.includes(gap));
    assert.ok(dataset.knowledgeBase.every((article) => !article.body.includes(gap)));
  }
  function checkDomains(value: unknown): void {
    if (Array.isArray(value)) value.forEach(checkDomains);
    else if (value && typeof value === "object") for (const [key, field] of Object.entries(value)) {
      if (typeof field === "string" && (key.toLowerCase().endsWith("email") || key === "domain")) assert.ok(field.split("@").at(-1)?.endsWith(".example"), `Non-fictional domain ${field}`);
      else if (key === "url" && typeof field === "string") assert.ok(new URL(field).hostname.endsWith(".example"), `Non-fictional URL ${field}`);
      checkDomains(field);
    }
  }
  checkDomains(dataset);
  return dataset;
}
