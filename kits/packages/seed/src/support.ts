import type { KnowledgeArticle, PlantedCase, SeedRecords } from "./types.js";
import recipe from "../recipe/data.json" with { type: "json" };
import { at, common, id, pick, slug } from "./random.js";

export function knowledgeBase(planted: PlantedCase[]): KnowledgeArticle[] {
  recipe.gaps.forEach((gap, i) => planted.push({ id: id("case-kb-gap", i), kind: "knowledge_gap", recordType: "Ticket", recordIds: [id("ticket", i)], description: `The knowledge base deliberately does not document: ${gap}.`, expected: "Abstain from inventing policy; route to the support lead and propose a KB article." }));
  return recipe.kbTopics.map((title, i) => ({ id: id("kb", i), slug: slug(title), title, category: pick(recipe.ticketCategories, Math.floor(i / 6)), body: `# ${title}\n\nFieldline helps fleet teams manage work orders, parts and technician schedules.\n\n## Before you start\n\nSign in to the correct team workspace and confirm your assigned role permits this action. Record the asset or work-order identifier before making changes.\n\n## Steps\n\n1. Open the ${pick(recipe.ticketCategories, Math.floor(i / 6)).replaceAll("_", " ")} section from the workspace menu.\n2. Select the relevant record and review its current details.\n3. Choose ${title.toLowerCase()}, enter the required details, and review the confirmation.\n4. Save once. Refresh the record and verify the activity history.\n\n## If it fails\n\nKeep the record identifier, error text and time. Contact support at support@fieldline.example; do not send passwords, tokens or payment details.\n\n_Last reviewed: 2026-10-20. Synthetic training article ${i + 1}._\n` }));
}

export function support(planted: PlantedCase[]): Pick<SeedRecords, "Ticket" | "DraftReply" | "QaScore" | "ChurnSignal"> {
  const Ticket: SeedRecords["Ticket"] = Array.from({ length: 600 }, (_, i) => {
    const language = pick(recipe.languages, i) as keyof typeof recipe.ticketText;
    const text = recipe.ticketText[language];
    const category = pick(recipe.ticketCategories, i);
    const accountIndex = i % 60;
    const accountName = `${pick(recipe.accountPrefixes, Math.floor(accountIndex / 10))} ${pick(recipe.accountSuffixes, accountIndex)}`;
    const name = `${pick(recipe.firstNames, i % 240)} ${pick(recipe.lastNames, Math.floor((i % 240) / 20))}`;
    const days = -90 + i % 90;
    const status = i < 6 ? "open" : pick(["new", "open", "pending", "solved", "closed"] as const, i);
    const negative = i < 6 || i % 3 === 0;
    const ticket: SeedRecords["Ticket"][number] = { ...common("ticket", i, days), channel: pick(["email", "chat", "form", "social"] as const, i), subject: i < 6 ? pick(recipe.gaps, i) : `${category.replaceAll("_", " ")} - asset FL-${1000 + i}`, body: `${text.open} ${category.replaceAll("_", " ")}.\n\n${text.detail}${i < 6 ? `\n\n${pick(recipe.gaps, i)}? We cannot find a documented answer and are considering cancelling our renewal.` : ""}\n\n${name}\n${text.sign} | ${accountName}\ncontact@${slug(accountName)}.example\n\n> ${text.quote}`, customer: { email: `contact@${slug(accountName)}.example`, name, accountId: id("account", accountIndex), plan: pick(["Starter", "Growth", "Enterprise"], i), mrr: 490 + i % 12 * 89 }, language, category, priority: pick(["p1", "p2", "p3", "p4"] as const, i), sentiment: negative ? "negative" : i % 3 === 1 ? "neutral" : "positive", sentimentScore: negative ? -0.8 : i % 3 === 1 ? 0 : 0.7, intent: i < 6 ? "request undocumented policy and discuss cancellation" : `resolve ${category}`, team: "fleet-support", assigneeId: id("person", 4 + i % 3), status, slaDueAt: at(days, 8 * 60), externalId: id("helpdesk", i) };
    if (status !== "new") ticket.firstResponseAt = at(days, 30);
    if (status === "solved" || status === "closed") { ticket.resolvedAt = at(days, 300); ticket.updatedAt = at(days, 300); ticket.csat = negative ? 2 : 5; }
    else if (status !== "new") ticket.updatedAt = at(days, 30);
    return ticket;
  });
  const DraftReply: SeedRecords["DraftReply"] = Array.from({ length: 24 }, (_, i) => ({ ...common("draft-reply", i, -5), ticketId: id("ticket", i), body: i < 6 ? "I could not find an approved article for this policy. I have asked the support lead to confirm the next step." : "Please confirm the workspace and asset identifier, then follow the linked article. We can review the activity history together.", citations: i < 6 ? [] : [{ claim: "Review the relevant record before saving a change", sourceId: id("kb", i % 45), url: `https://fieldline.example/kb/${slug(pick(recipe.kbTopics, i))}` }], confidence: i < 6 ? 0.35 : 0.93, status: "pending" }));
  const QaScore: SeedRecords["QaScore"] = Array.from({ length: 24 }, (_, i) => ({ ...common("qa-score", i, -4), ticketId: id("ticket", i), agentId: id("person", 4 + i % 3), rubric: [{ criterion: "Grounding", score: i < 6 ? 5 : 4, note: i < 6 ? "Correctly escalated missing policy" : "Used the approved KB source" }, { criterion: "Clarity", score: 4, note: "Clear safe next action" }], total: i < 6 ? 9 : 8, coaching: "Confirm the customer's outcome before closing the ticket." }));
  const ChurnSignal: SeedRecords["ChurnSignal"] = Array.from({ length: 6 }, (_, i) => ({ ...common("churn-signal", i, -2), accountId: id("account", i), signals: [{ kind: "cancellation_language", detail: `Ticket ${id("ticket", i)} explicitly mentions cancelling renewal`, at: at(-90 + i) }, { kind: "unresolved_policy", detail: pick(recipe.gaps, i), at: at(-90 + i) }], risk: "high", ownerId: id("person", i % 2) }));
  ChurnSignal.forEach((row, i) => planted.push({ id: id("case-churn-risk", i), kind: "churn_risk", recordType: "ChurnSignal", recordIds: [row.id], description: `Account ${row.accountId} has unresolved cancellation language in ${id("ticket", i)}.`, expected: "Flag high renewal risk, cite the source ticket and assign the account owner." }));
  return { Ticket, DraftReply, QaScore, ChurnSignal };
}
