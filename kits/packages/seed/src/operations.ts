import type { MediaManifest, PlantedCase, SeedRecords } from "./types.js";
import recipe from "../recipe/data.json" with { type: "json" };
import { invoiceData, contractData } from "./documents.js";
import { at, common, date, id, money, pick, rng } from "./random.js";

export function operations(seed: number, media: MediaManifest, planted: PlantedCase[]): Pick<SeedRecords, "Invoice" | "Contract" | "Transaction" | "KpiSnapshot" | "Task"> {
  const random = rng(seed, 303);
  const Invoice = invoiceData(media);
  const Contract = contractData();
  for (let i = 114; i < 120; i++) planted.push({ id: id("case-invoice-duplicate", i - 114), kind: "duplicate_invoice", recordType: "Invoice", recordIds: [id("invoice", i - 114), id("invoice", i)], description: "A second uploaded file is byte-identical to an earlier document.", expected: "Match both file SHA-256 and vendor invoice number; do not post a second payment." });
  for (let i = 10; i < 14; i++) planted.push({ id: id("case-invoice-math", i - 10), kind: "invoice_math_error", recordType: "Invoice", recordIds: [id("invoice", i)], description: "The displayed total is 17.00 higher than subtotal plus tax.", expected: "Flag the arithmetic discrepancy and require review before approval." });
  for (let i = 20; i < 25; i++) planted.push({ id: id("case-degraded-scan", i - 20), kind: "degraded_scan", recordType: "Invoice", recordIds: [id("invoice", i)], description: "The source PNG contains deterministic blur, low contrast and scan noise.", expected: "Extract conservatively and route low-confidence fields to human review." });
  const months = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
  const Transaction: SeedRecords["Transaction"] = Array.from({ length: 3000 }, (_, i) => {
    const month = Math.floor(i / 500);
    const withinMonth = i % 500;
    const day = 1 + withinMonth % (month === 5 ? 20 : 28);
    const dayString = `${pick(months, month)}-${String(day).padStart(2, "0")}`;
    const time = `${dayString}T12:00:00Z`;
    const anomalous = withinMonth < 2;
    const cents = 1200 + random(60000);
    const row: SeedRecords["Transaction"][number] = { ...common("transaction", i), createdAt: time, updatedAt: time, date: dayString, merchant: anomalous && withinMonth === 1 ? "Velrune Specialty Parts" : pick(recipe.vendors, i), amount: money(anomalous ? 1500000 + month * 100000 + withinMonth * 250000 : cents), currency: pick(["USD", "EUR", "GBP"], i), category: anomalous ? "exceptional_equipment" : pick(["software", "parts", "travel", "office", "training"], i), cardholder: pick(recipe.people, i).name, memo: anomalous ? "Unusually large one-off purchase outside the normal depot budget" : "Approved fictional operating expense" };
    if (anomalous) { row.anomaly = { score: 0.98, reasons: [withinMonth === 0 ? "Amount exceeds the normal merchant baseline by over 20x" : "New merchant with unusually high initial charge"] }; planted.push({ id: id("case-transaction-anomaly", month * 2 + withinMonth), kind: "transaction_anomaly", recordType: "Transaction", recordIds: [row.id], description: `${pick(months, month)}: ${row.anomaly.reasons[0] ?? "Unusual transaction"}.`, expected: "Flag the transaction for finance review and retain currency; do not convert or pay automatically." }); }
    return row;
  });
  const KpiSnapshot: SeedRecords["KpiSnapshot"] = months.map((period, i) => ({ ...common("kpi", i, -1), period, metrics: { mrr: 148000 + i * 3200, customers: 340 + i * 12, openTickets: 20 + i * 3, grossMarginPercent: 78 + i }, deltas: { mrrPercent: 2, customers: 12, openTickets: 3 }, notes: ["Synthetic operating snapshot; amounts are stated in USD for this summary only."] }));
  const Task: SeedRecords["Task"] = Array.from({ length: 18 }, (_, i) => ({ ...common("task", i, -3), title: `Review renewal terms for ${pick(Contract, i).counterparty}`, ownerEmail: pick(recipe.people, i).email, dueDate: date(7 + i), sourceKind: "doc", sourceId: id("contract", i), tool: pick(["linear", "asana", "notion", "jira", "todoist"] as const, i), externalId: id("task-external", i) }));
  return { Invoice, Contract, Transaction, KpiSnapshot, Task };
}

export function shared(): Pick<SeedRecords, "Approval" | "RunEvent" | "DeadLetter"> {
  const Approval: SeedRecords["Approval"] = Array.from({ length: 12 }, (_, i) => ({ ...common("approval", i, -4), kind: "send_reply", subject: `Review response for ${id("ticket", i)}`, summary: "Confirm the draft uses approved guidance before sending.", payload: { ticketId: id("ticket", i), draftId: id("draft-reply", i) }, requestedBy: id("person", 4 + i % 3), requestedAt: at(-4), status: "pending" }));
  const RunEvent: SeedRecords["RunEvent"] = Array.from({ length: 18 }, (_, i) => ({ ...common("run-event", i, -2), updatedAt: at(-2, i + 1), itemSlug: "fieldline-fixture-replay", itemKind: "workflow", version: "1.0.0", startedAt: at(-2, i), endedAt: at(-2, i + 1), status: i < 6 ? "failed" : "success", steps: 3, ...(i < 6 ? { error: { class: "input", message: "Fixture intentionally exercises a recoverable input failure" } } : {}) }));
  const DeadLetter: SeedRecords["DeadLetter"] = Array.from({ length: 6 }, (_, i) => ({ ...common("dead-letter", i, -2), itemSlug: "fieldline-fixture-replay", step: "validate-intake", errorClass: "input", message: "Fixture payload omitted the external workspace context", input: { ticketId: id("ticket", i), runId: id("run-event", i) }, at: at(-2), retries: 0 }));
  return { Approval, RunEvent, DeadLetter };
}
