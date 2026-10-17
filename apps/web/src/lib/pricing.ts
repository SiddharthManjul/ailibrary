import { siteData } from "@content/site/settings";

export type KitSlug = "sales" | "support" | "marketing" | "engineering" | "operations";
export type LibraryId = "ui" | "workflows" | "agents";
export type PlanId = `kit:${KitSlug}` | LibraryId | "all";
export type Owned = "none" | "kit" | "lib" | "two";
type PriceKey = "kit" | LibraryId | "all";

export const PRICES: Record<PriceKey, { solo: number; team: number; renew: number; seat: number }> = siteData.prices;
export const TEAM_SEATS_INCLUDED = 5;
export const TEAM_SEATS_MAX = 25;
export const GUIDED_SETUP_PRICE = 299;
export const STUDIO_OFFERS = [
  { title: "Automation Sprint", price: 3500, monthly: false, description: "Three workflows fitted to your stack, deployed and documented, in two weeks." },
  { title: "Agent Build", price: 9000, monthly: false, description: "One production agent with evals, approvals and a dashboard, in four weeks." },
  { title: "Custom Dashboard or CRM", price: 6000, monthly: false, description: "A branded internal tool on our blocks, wired to your data, in three weeks." },
  { title: "AI Ops Retainer", price: 2500, monthly: true, description: "Monitoring, fixes and two new workflows every month." },
] as const;
export const OWNED_VALUE: Record<Owned, number> = { none: 0, kit: PRICES.kit.solo, lib: PRICES.ui.solo, two: PRICES.kit.solo * 2 };

const KIT_NAMES: Record<KitSlug, string> = { sales: "Sales", support: "Support", marketing: "Marketing", engineering: "Engineering", operations: "Operations" };
const LIB_NAMES: Record<LibraryId, string> = { ui: "UI library", workflows: "Workflows library", agents: "Agents library" };

export const formatMoney = (amount: number) => "$" + amount.toLocaleString("en-US");

export function priceKey(plan: PlanId): PriceKey {
  return plan.startsWith("kit:") ? "kit" : (plan as LibraryId | "all");
}

export function planName(plan: PlanId): string {
  if (plan.startsWith("kit:")) return KIT_NAMES[plan.slice(4) as KitSlug] + " kit";
  if (plan === "all") return "All-Access";
  return LIB_NAMES[plan as LibraryId];
}

export function clampSeats(seats: number): number {
  return Math.max(TEAM_SEATS_INCLUDED, Math.min(TEAM_SEATS_MAX, Math.round(seats || TEAM_SEATS_INCLUDED)));
}

export interface Quote {
  name: string;
  unitLabel: string;
  seats: number;
  base: number;
  extraSeats: number;
  extraPerSeat: number;
  extra: number;
  extraLabel: string;
  credit: number;
  creditNote: boolean;
  total: number;
  renewal: number;
  renewalLabel: string;
}

export function quote(input: { plan: PlanId; team: boolean; seats: number; owned: Owned }): Quote {
  const price = PRICES[priceKey(input.plan)];
  const seats = input.team ? clampSeats(input.seats) : 1;
  const base = input.team ? price.team : price.solo;
  const extraSeats = input.team ? seats - TEAM_SEATS_INCLUDED : 0;
  const extra = extraSeats * price.seat;
  const ownedValue = OWNED_VALUE[input.owned] ?? 0;
  const credit = ownedValue > 0 && ownedValue < base ? ownedValue : 0;
  return {
    name: planName(input.plan),
    unitLabel: input.team ? `Team · ${seats} seats` : "Individual · 1 seat",
    seats,
    base,
    extraSeats,
    extraPerSeat: price.seat,
    extra,
    extraLabel: `${extraSeats} extra seats × ${formatMoney(price.seat)}`,
    credit,
    creditNote: ownedValue > 0 && credit === 0,
    total: base + extra - credit,
    renewal: price.renew,
    renewalLabel: `${formatMoney(price.renew)} a year after 12 months, only if you want updates`,
  };
}

export const HOURS = { workflow: 6, agent: 12, component: 4, block: 10, dashboard: 16 };

type EstimateRow = { label: string; count: number; hoursEach: number; note: string };
const ROWS: Record<PriceKey, EstimateRow[]> = {
  kit: [
    { label: "Workflows", count: 12, hoursEach: HOURS.workflow, note: "with fixtures and the AI-off path" },
    { label: "Agents", count: 10, hoursEach: HOURS.agent, note: "with evals and four install forms" },
    { label: "Dashboard", count: 1, hoursEach: HOURS.dashboard, note: "wired to the same seed data" },
  ],
  workflows: [{ label: "Workflows", count: 60, hoursEach: HOURS.workflow, note: "with fixtures and the AI-off path" }],
  agents: [{ label: "Agents", count: 50, hoursEach: HOURS.agent, note: "with evals and four install forms" }],
  ui: [
    { label: "Components", count: 50, hoursEach: HOURS.component, note: "accessible, themed, both modes" },
    { label: "Blocks", count: 50, hoursEach: HOURS.block, note: "full screens built from the components" },
  ],
  all: [
    { label: "Workflows", count: 60, hoursEach: HOURS.workflow, note: "every kit" },
    { label: "Agents", count: 50, hoursEach: HOURS.agent, note: "every kit" },
    { label: "Components", count: 50, hoursEach: HOURS.component, note: "the whole UI library" },
    { label: "Blocks", count: 50, hoursEach: HOURS.block, note: "including all five dashboards" },
  ],
};

export function estimate(input: { plan: PlanId; team: boolean; seats: number; rate: number }) {
  const key = priceKey(input.plan);
  const order = quote({ plan: input.plan, team: input.team, seats: input.seats, owned: "none" });
  const rows = ROWS[key].map((row) => ({ ...row, hours: row.count * row.hoursEach }));
  const totalHours = rows.reduce((total, row) => total + row.hours, 0);
  const planTotal = order.base + order.extra;
  const name = planName(input.plan);
  const lead = key === "all" ? "All-Access" : "The " + name;
  const weeks = Math.round(totalHours / 40);
  let text = `${lead} is ${totalHours.toLocaleString("en-US")} hours of work, about ${weeks} weeks for one person full time` + (key === "all" ? ", before a year of weekly drops." : ".");
  if (input.team) text += ` Building it is the same work whether 1 or ${order.seats} people use it; the team plan covers all ${order.seats} for ${formatMoney(planTotal)}, ${formatMoney(Math.round(planTotal / order.seats))} a seat.`;
  const buildCost = totalHours * input.rate;
  return {
    subtitle: `${name} · ${input.team ? `Team, ${order.seats} seats` : "Individual"}`,
    text,
    rows,
    totalHours,
    weeks,
    buildCost,
    planLabel: input.team ? `The plan, ${order.seats} seats` : "The plan",
    planTotal,
    ratio: Math.round(buildCost / planTotal),
    ratioLabel: `${Math.round(buildCost / planTotal)}× more`,
  };
}

function upgradePath(from: string, to: string, target: number, owned: number) {
  return { from, to, math: `${formatMoney(target)} − ${formatMoney(owned)}`, pay: target - owned };
}

export const UPGRADE_PATHS = [
  upgradePath("Kit", "Library", PRICES.ui.solo, PRICES.kit.solo),
  upgradePath("Kit", "All-Access", PRICES.all.solo, PRICES.kit.solo),
  upgradePath("Library", "All-Access", PRICES.all.solo, PRICES.ui.solo),
  upgradePath("Two kits", "All-Access", PRICES.all.solo, OWNED_VALUE.two),
  upgradePath("Kit, team", "All-Access, team", PRICES.all.team, PRICES.kit.team),
];

export function formatPriceTemplate(template: string): string {
  return template.replace(/\{([a-z]+)\.([a-zA-Z]+)\}/g, (placeholder: string, category: string, field: string) => {
    if (category === "upgrade" && field === "kitAll") return formatMoney(PRICES.all.solo - PRICES.kit.solo);
    if (category === "seats" && field === "included") return String(TEAM_SEATS_INCLUDED);
    if (category === "seats" && field === "max") return String(TEAM_SEATS_MAX);
    const price = PRICES[category as PriceKey];
    const value = price?.[field as keyof typeof price];
    return typeof value === "number" ? formatMoney(value) : placeholder;
  }).replaceAll("{guidedSetup}", formatMoney(GUIDED_SETUP_PRICE));
}
