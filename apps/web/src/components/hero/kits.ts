export type FlowNode = { icon: string; label: string; meta: string };
export type RunStep = { tool: string; arg: string; time: string };
export type Row = [name: string, detail: string, score: number, status: string];

export type Kit = {
  id: string;
  name: string;
  accent: { dark: string; light: string };
  ink: { dark: string; light: string };
  swatch: [string, string, string];
  flowFile: string;
  platforms: string;
  flowStat: string;
  nodes: FlowNode[];
  agentFile: string;
  run: RunStep[];
  score: number;
  verdict: string;
  uiFile: string;
  kpis: [label: string, value: string][];
  spark: number[];
  rows: Row[];
  newRow: Row;
};

export const KITS: Kit[] = [
  {
    id: "sales",
    name: "Sales",
    accent: { dark: "#FFB224", light: "#B45309" },
    ink: { dark: "#FFB224", light: "#FFD992" },
    swatch: ["#F07A2E", "#FFB224", "#FFE3A1"],
    flowFile: "lead-qualifier.n8n.json",
    platforms: "n8n · Make",
    flowStat: "1.8s · $0.004",
    nodes: [
      { icon: "⚡", label: "Form", meta: "new lead" },
      { icon: "⌕", label: "Enrich", meta: "company" },
      { icon: "≡", label: "Score", meta: "fit 0-100" },
      { icon: "◎", label: "Route", meta: "HubSpot" },
    ],
    agentFile: "agents/inbound-qualifier",
    run: [
      { tool: "read", arg: "lead #4182", time: "6ms" },
      { tool: "enrich", arg: "firmographics", time: "840ms" },
      { tool: "score", arg: "ICP match", time: "1.1s" },
      { tool: "route", arg: "owner assigned", time: "90ms" },
    ],
    score: 88,
    verdict: "qualified",
    uiFile: "pipeline-board.tsx",
    kpis: [["Qualified", "38"], ["Pipeline", "$84k"]],
    spark: [3, 4, 4, 6, 5, 7, 9],
    rows: [
      ["Northwind Labs", "", 0, "Hot"],
      ["Acme Freight", "", 0, "Nurture"],
    ],
    newRow: ["Northwind Labs", "", 0, "Hot"],
  },
  {
    id: "support",
    name: "Support",
    accent: { dark: "#2DD4BF", light: "#0F766E" },
    ink: { dark: "#2DD4BF", light: "#96EADF" },
    swatch: ["#2A8C9C", "#4FD6D8", "#BDF4F2"],
    flowFile: "ticket-triage.n8n.json",
    platforms: "n8n · Zapier",
    flowStat: "1.4s · $0.003",
    nodes: [
      { icon: "✉", label: "Ticket", meta: "Zendesk" },
      { icon: "⌕", label: "Classify", meta: "intent" },
      { icon: "✎", label: "Draft", meta: "from KB" },
      { icon: "✓", label: "Route", meta: "tier 1/2" },
    ],
    agentFile: "agents/support-triage",
    run: [
      { tool: "read", arg: "ticket #9921", time: "4ms" },
      { tool: "kb.search", arg: "3 articles", time: "410ms" },
      { tool: "draft", arg: "grounded reply", time: "1.6s" },
      { tool: "check", arg: "tone, policy", time: "280ms" },
    ],
    score: 92,
    verdict: "approved",
    uiFile: "support-ops.tsx",
    kpis: [["Auto-resolved", "63%"], ["CSAT", "4.7"]],
    spark: [6, 5, 6, 7, 6, 8, 9],
    rows: [
      ["#9921 Refund", "", 0, "Drafted"],
      ["#9918 SSO login", "", 0, "Escalated"],
    ],
    newRow: ["#9921 Refund", "", 0, "Drafted"],
  },
  {
    id: "marketing",
    name: "Marketing",
    accent: { dark: "#FF4FA3", light: "#D61F69" },
    ink: { dark: "#FF4FA3", light: "#FFA7D1" },
    swatch: ["#C2185B", "#FF4FA3", "#FFC2DC"],
    flowFile: "content-brief.n8n.json",
    platforms: "n8n · Make",
    flowStat: "2.1s · $0.006",
    nodes: [
      { icon: "⚡", label: "Brief", meta: "form" },
      { icon: "▤", label: "Plan", meta: "7 days" },
      { icon: "✎", label: "Draft", meta: "per channel" },
      { icon: "◷", label: "Schedule", meta: "LinkedIn, X" },
    ],
    agentFile: "agents/campaign-writer",
    run: [
      { tool: "read", arg: "q4 webinar brief", time: "5ms" },
      { tool: "brand.voice", arg: "load rules", time: "120ms" },
      { tool: "draft", arg: "3 channels", time: "2.2s" },
      { tool: "check", arg: "length, CTA", time: "310ms" },
    ],
    score: 87,
    verdict: "ready",
    uiFile: "campaign-board.tsx",
    kpis: [["Drafts", "24"], ["Open rate", "46%"]],
    spark: [4, 4, 5, 5, 6, 6, 8],
    rows: [
      ["Webinar invite", "", 0, "Queued"],
      ["Speaker teaser", "", 0, "Draft"],
    ],
    newRow: ["Webinar invite", "", 0, "Queued"],
  },
  {
    id: "engineering",
    name: "Engineering",
    accent: { dark: "#9B7BFF", light: "#6D28D9" },
    ink: { dark: "#9B7BFF", light: "#CDBDFF" },
    swatch: ["#5B3FD6", "#9B7BFF", "#D9CFFF"],
    flowFile: "pr-digest.n8n.json",
    platforms: "n8n",
    flowStat: "1.3s · $0.005",
    nodes: [
      { icon: "⑂", label: "GitHub", meta: "PR opened" },
      { icon: "±", label: "Diff", meta: "+412 −88" },
      { icon: "◇", label: "Review", meta: "risk check" },
      { icon: "#", label: "Slack", meta: "digest" },
    ],
    agentFile: "agents/code-reviewer",
    run: [
      { tool: "read", arg: "PR #1187", time: "6ms" },
      { tool: "git.diff", arg: "14 files", time: "340ms" },
      { tool: "tests.map", arg: "coverage", time: "520ms" },
      { tool: "review", arg: "1 change", time: "3.1s" },
    ],
    score: 74,
    verdict: "1 change",
    uiFile: "release-board.tsx",
    kpis: [["PRs reviewed", "41"], ["First review", "14m"]],
    spark: [5, 6, 4, 6, 7, 6, 8],
    rows: [
      ["#1191 Retry queue", "", 0, "Approved"],
      ["#1187 Prorate", "", 0, "Changes"],
    ],
    newRow: ["#1191 Retry queue", "", 0, "Approved"],
  },
  {
    id: "operations",
    name: "Operations",
    accent: { dark: "#7CF46A", light: "#15803D" },
    ink: { dark: "#7CF46A", light: "#BEFAB5" },
    swatch: ["#3C8F38", "#7CF46A", "#CDFAC4"],
    flowFile: "invoice-intake.n8n.json",
    platforms: "n8n · Make",
    flowStat: "0.9s · $0.002",
    nodes: [
      { icon: "✉", label: "Inbox", meta: "invoice.pdf" },
      { icon: "⌗", label: "Extract", meta: "fields" },
      { icon: "⇄", label: "Match", meta: "PO-7781" },
      { icon: "▦", label: "Ledger", meta: "Xero" },
    ],
    agentFile: "agents/reconciler",
    run: [
      { tool: "read", arg: "INV-20931", time: "4ms" },
      { tool: "po.lookup", arg: "PO-7781", time: "190ms" },
      { tool: "bank.check", arg: "unchanged", time: "220ms" },
      { tool: "post", arg: "ledger entry", time: "0.9s" },
    ],
    score: 96,
    verdict: "matched",
    uiFile: "ops-ledger.tsx",
    kpis: [["Auto-matched", "91%"], ["Days to close", "2.5"]],
    spark: [5, 6, 6, 7, 7, 8, 9],
    rows: [
      ["INV-20931", "", 0, "Matched"],
      ["INV-20928", "", 0, "Review"],
    ],
    newRow: ["INV-20931", "", 0, "Matched"],
  },
];
