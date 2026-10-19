import type { SeedRecords, PlantedCase } from "./types.js";
import recipe from "../recipe/data.json" with { type: "json" };
import { at, common, date, id, money, pick, rng, slug } from "./random.js";

export function sales(seed: number, planted: PlantedCase[]): Pick<SeedRecords, "Account" | "Lead" | "Deal" | "Activity"> {
  const random = rng(seed, 101);
  const Account: SeedRecords["Account"] = Array.from({ length: 60 }, (_, i) => {
    const name = `${pick(recipe.accountPrefixes, Math.floor(i / 10))} ${pick(recipe.accountSuffixes, i)}`;
    const domain = `${slug(name)}.example`;
    return { ...common("account", i, -180), updatedAt: at(-30 - i % 30), domain, name, industry: pick(recipe.industries, i), employees: 25 + random(2400), revenueBand: pick(["1m-5m", "5m-20m", "20m-100m"], i), hq: `${pick(recipe.cities, i)}, ${pick(recipe.countries, i)}`, techStack: ["Fleet ERP", "Cloud mail", i % 2 === 0 ? "Vehicle telematics" : "Dispatch planner"], signals: [{ kind: "hiring", title: `${name} expands workshop team`, url: `https://${domain}/careers`, date: date(-30 - i % 30) }], brief: `${name} operates ${20 + i * 3} vehicles across ${1 + i % 5} depots.`, crmId: id("crm-account", i) };
  });
  const Lead: SeedRecords["Lead"] = Array.from({ length: 240 }, (_, i) => {
    const original = i >= 216 ? i - 168 : i;
    const account = pick(Account, original);
    const firstName = pick(recipe.firstNames, original);
    const lastName = pick(recipe.lastNames, Math.floor(original / 20));
    const free = original < 36;
    const junk = original >= 36 && original < 48;
    const tier = junk ? "disqualified" : pick(["hot", "warm", "cold"] as const, original);
    const score = junk ? 0 : tier === "hot" ? 88 : tier === "warm" ? 65 : 30;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${free ? pick(["mailme.example", "postbox.example", "publicmail.example"], original) : account.domain}`;
    return { ...common("lead", i), email, firstName, lastName, title: junk ? "Test submission" : pick(["Fleet manager", "Operations director", "Maintenance planner", "Depot supervisor"], original), company: { name: account.name, domain: account.domain, employees: account.employees ?? 0, industry: account.industry ?? "Fleet", country: pick(recipe.countries, original) }, channel: pick(["form", "chat", "import", "visitor"] as const, original), utm: { source: pick(["search", "partner", "newsletter"], original), medium: "referral", campaign: "maintenance-autumn" }, message: junk ? "test test 0000 no fleet just checking form" : `We manage ${30 + original % 150} vehicles and need recurring maintenance scheduling. Please share a Growth plan demo.`, score: { fit: score, intent: score, total: score, tier, reasons: [junk ? "Synthetic junk submission with no buying intent" : "Fleet maintenance use case and team size supplied"] }, ownerId: id("person", original % 2), crmId: id("crm-contact", original), status: junk ? "disqualified" : "routed" };
  });
  planted.push({ id: "case-free-email", kind: "free_email", recordType: "Lead", recordIds: Lead.slice(0, 36).map((x) => x.id), description: "36 fictional consumer-mail contacts use reserved .example domains.", expected: "Detect consumer mailbox domains using the explicit recipe list; never contact them." });
  planted.push({ id: "case-junk-leads", kind: "junk_lead", recordType: "Lead", recordIds: Lead.slice(36, 48).map((x) => x.id), description: "12 valid wire records contain junk intake content.", expected: "Disqualify test submissions without breaking schema validation." });
  for (let i = 216; i < 240; i++) planted.push({ id: id("case-lead-duplicate", i - 216), kind: "duplicate_contact", recordType: "Lead", recordIds: [id("lead", i - 168), id("lead", i)], description: "Two lead records represent the same existing CRM contact.", expected: "Merge or flag by normalized email and CRM contact ID; preserve both source IDs." });
  const Deal: SeedRecords["Deal"] = Array.from({ length: 45 }, (_, i) => {
    const stage = i < 8 ? pick(["lead", "qualified", "demo", "proposal", "negotiation"] as const, i) : pick(["lead", "qualified", "demo", "proposal", "negotiation", "won", "lost"] as const, i);
    const days = i < 8 ? -28 - i : -(i % 15);
    return { ...common("deal", i), updatedAt: at(days), name: `${pick(Account, i).name} Growth rollout`, accountId: id("account", i), ownerId: id("person", i % 2), stage, amount: money(250000 + random(2200000)), currency: pick(["USD", "EUR", "GBP"], i), closeDate: date(stage === "won" || stage === "lost" ? -i % 20 : 10 + i % 50), lastActivityAt: at(days), nextStep: stage === "won" ? "Schedule onboarding" : stage === "lost" ? "Capture decision feedback" : "Confirm workshop demo date", health: { score: i < 8 ? 28 : 85, risks: i < 8 ? ["No activity for more than 21 days"] : [] } };
  });
  for (let i = 0; i < 8; i++) planted.push({ id: id("case-idle-deal", i), kind: "idle_deal", recordType: "Deal", recordIds: [id("deal", i)], description: "Open deal has no recorded activity for over 21 days.", expected: "Escalate the idle opportunity to its sales owner." });
  const Activity: SeedRecords["Activity"] = Array.from({ length: 900 }, (_, i) => {
    const subjectType = pick(["lead", "account", "deal"] as const, i);
    const target = subjectType === "lead" ? i % 240 : subjectType === "account" ? i % 60 : i % 45;
    const dealDay = target < 8 ? -28 - target : -(target % 15);
    const days = subjectType === "deal" ? dealDay - i % 14 : -(Math.floor(i / 3) % 120);
    const time = at(days, -(i % 60));
    return { ...common("activity", i, days), createdAt: time, updatedAt: time, type: pick(["call", "email", "meeting", "note", "task"] as const, i), subjectType, subjectId: id(subjectType, target), ownerId: id("person", i % 3), at: time, summary: pick(["Discussed the depot rollout and maintenance backlog", "Shared a parts inventory walkthrough", "Reviewed recurring service requirements", "Confirmed technician scheduling constraints", "Sent the workshop evaluation checklist"], i), outcome: pick(["Demo requested", "Waiting for fleet manager", "Requirements confirmed"], i), nextSteps: ["Confirm the next review with the account owner"] };
  });
  return { Account, Lead, Deal, Activity };
}
