import type { Contract, Invoice } from "@ai-library/contracts";
import recipe from "../recipe/data.json" with { type: "json" };
import { at, common, date, id, money, pick, slug } from "./random.js";
import type { DocumentSpec, MediaManifest } from "./types.js";

export function invoiceFilename(index: number): string {
  const original = index >= 114 ? index - 114 : index;
  return `${id("invoice", index)}.${(original >= 20 && original < 25) || original % 10 === 7 ? "png" : "pdf"}`;
}

/** Document contents are canonical, independent of the dataset RNG seed. */
export function invoiceData(media: MediaManifest = {}): Invoice[] {
  return Array.from({ length: 120 }, (_, index) => {
    const original = index >= 114 ? index - 114 : index;
    const cents = 24000 + ((original * 1379) % 90000) * 2;
    const taxCents = Math.floor(cents / 10);
    const mathError = original >= 10 && original < 14;
    const degraded = original >= 20 && original < 25;
    const vendor = pick(recipe.vendors, original);
    const filename = invoiceFilename(index);
    return {
      ...common("invoice", index, -170 + original), updatedAt: at(-169 + original),
      kind: original % 4 === 0 ? "receipt" : "invoice",
      vendor: { name: vendor, taxId: `DEMO-TAX-${original % 10 + 1}`, email: `billing@${slug(vendor)}.example`, address: `${original % 10 + 1} Fictional Way, Demo City` },
      number: `FL-${String(original + 1).padStart(4, "0")}`, issueDate: date(-170 + original), dueDate: date(-140 + original),
      currency: pick(["USD", "EUR", "GBP"], original), subtotal: money(cents), tax: money(taxCents), total: money(cents + taxCents + (mathError ? 1700 : 0)),
      lineItems: [{ description: `${vendor} monthly service`, quantity: 2, unitPrice: money(cents / 2), amount: money(cents), taxRate: 0.1 }],
      poNumber: `PO-${String(original + 1).padStart(4, "0")}`, fieldConfidence: { vendor: degraded ? 0.64 : 0.99, total: degraded ? 0.58 : 0.99 },
      checks: [{ name: "arithmetic", passed: !mathError, detail: mathError ? "Displayed total exceeds subtotal plus tax by 17.00" : "Subtotal plus tax equals total" }],
      status: index >= 114 ? "duplicate" : mathError || degraded ? "needs_review" : "approved",
      file: { name: filename, sha256: media[filename]?.sha256 ?? "0".repeat(64) },
    };
  });
}

export function contractData(): Contract[] {
  return Array.from({ length: 18 }, (_, index) => {
    const autoRenew = index % 3 !== 0;
    const noticeDays = pick([30, 60, 90], index);
    const escalator = pick([0, 3, 5], index);
    return { ...common("contract", index, -300 + index), counterparty: pick(recipe.vendors, index), kind: index % 2 === 0 ? "software subscription" : "services agreement", startDate: date(-300 + index), endDate: date(65 + index), autoRenew, noticeDays, renewalDate: date(66 + index), value: 12000 + index * 1250, currency: pick(["USD", "EUR", "GBP"], index), keyTerms: [{ name: "renewal", value: autoRenew ? "Renews automatically for twelve months" : "Written approval required for renewal", clause: "4.1" }, { name: "notice", value: `Give written notice at least ${noticeDays} days before the end date`, clause: "4.2" }, { name: "price_escalator", value: `${escalator}% maximum annual increase`, clause: "5.3" }] };
  });
}

export function documentSpecs(): DocumentSpec[] {
  const invoices: DocumentSpec[] = invoiceData().map((invoice, index) => {
    const filename = invoice.file.name;
    const spec: DocumentSpec = { id: invoice.id, recordType: "Invoice", filename, kind: filename.endsWith("png") ? "image" : "pdf", degraded: index >= 20 && index < 25,
      text: ["FIELDLINE FICTIONAL DOCUMENT / NOT PAYABLE", invoice.kind.toUpperCase(), invoice.vendor.name, invoice.vendor.address ?? "", `Number: ${invoice.number}`, `Issued: ${invoice.issueDate}    Due: ${invoice.dueDate ?? ""}`, `Currency: ${invoice.currency}`, ...invoice.lineItems.map((line) => `${line.description} | Quantity ${line.quantity} | Unit ${line.unitPrice.toFixed(3)} | Amount ${line.amount.toFixed(2)}`), `Subtotal: ${invoice.subtotal.toFixed(2)}`, `Tax: ${invoice.tax.toFixed(2)}`, `Total: ${invoice.total.toFixed(2)}`, `Purchase order: ${invoice.poNumber ?? ""}`, "Recipient: Fieldline, Austin. Synthetic fixture; no payment details."] };
    if (index >= 114) spec.duplicateOf = invoiceFilename(index - 114);
    return spec;
  });
  const contracts: DocumentSpec[] = contractData().map((contract) => ({ id: contract.id, recordType: "Contract", filename: `${contract.id}.pdf`, kind: "pdf", degraded: false,
    text: ["FIELDLINE FICTIONAL AGREEMENT / NOT EXECUTABLE", contract.kind.toUpperCase(), `Parties: Fieldline and ${contract.counterparty}`, `Start: ${contract.startDate}    End: ${contract.endDate ?? ""}`, `Annual value: ${contract.value ?? 0} ${contract.currency ?? ""}`, ...contract.keyTerms.map((term) => `${term.clause} ${term.name}: ${term.value}`), "1.1 Services support fictional fleet maintenance operations.", "2.1 Each party shall protect confidential information.", "3.1 Support is available during the documented service window.", "6.1 Termination does not authorize removal of retention records.", "Synthetic test agreement. No signatures or real counterparties."] }));
  return [...invoices, ...contracts];
}
