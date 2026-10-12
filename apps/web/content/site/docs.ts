import "server-only";

import pagesJson from "./data/docs/pages.json";
import navJson from "./data/docs/nav.json";
import { formatMoney, PRICES, TEAM_SEATS_INCLUDED } from "@/lib/pricing";
import type { DocBlock, DocNavigation, DocPage } from "./docs-types";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function rows(value: unknown, fields: readonly string[]) {
  return Array.isArray(value) && value.every((item) => record(item) && fields.every((field) => typeof item[field] === "string"));
}

function validBlock(value: unknown): value is DocBlock {
  if (!record(value)) return false;
  switch (value.type) {
    case "h2": return typeof value.text === "string" && typeof value.anchor === "string";
    case "p": return typeof value.text === "string";
    case "ul": return strings(value.items);
    case "ol": return rows(value.items, ["title"]);
    case "code": return typeof value.lang === "string" && typeof value.title === "string" && strings(value.lines);
    case "tabs": return rows(value.tabs, ["label", "lang"]) && (value.tabs as Record<string, unknown>[]).every((tab) => strings(tab.lines));
    case "pm-command": return typeof value.command === "string";
    case "install-ui": return typeof value.command === "string" && rows(value.manual, ["title"]);
    case "table": return strings(value.columns) && typeof value.grid === "string" && Array.isArray(value.rows) && value.rows.every((row) => rows(row, ["text", "kind"]) && row.every((cell: Record<string, unknown>) => ["text", "code", "badge", "badge-write", "kbd"].includes(String(cell.kind))));
    case "callout": return ["info", "tip"].includes(String(value.tone)) && typeof value.text === "string";
    case "kv": return Array.isArray(value.rows) && value.rows.every((row) => strings(row) && row.length === 2);
    case "chips": return rows(value.chips, ["text"]);
    case "stats": return rows(value.stats, ["label", "value"]);
    case "flow": return rows(value.nodes, ["title", "sub", "icon"]);
    case "cards": return rows(value.cards, ["title", "desc", "docId"]);
    case "preview": return strings(value.code) && typeof value.caption === "string" && (value.designedDemo === null || typeof value.designedDemo === "string") && typeof value.thumbnail === "string";
    default: return false;
  }
}

function parsePages(input: unknown): readonly DocPage[] {
  if (!Array.isArray(input)) throw new Error("Documentation must be an array of pages.");
  for (const page of input) {
    if (!record(page) || !["id", "path", "title", "lead"].every((key) => typeof page[key] === "string") || !strings(page.crumbs) || !rows(page.meta, ["text"]) || !rows(page.toc, ["text", "anchor"]) || ![page.prev, page.next].every((value) => value === null || typeof value === "string") || !Array.isArray(page.blocks) || !page.blocks.every(validBlock)) {
      throw new Error(`Invalid documentation page: ${record(page) ? String(page.id) : "unknown"}`);
    }
  }
  return input as DocPage[];
}

export const docsNavigation: DocNavigation = navJson;

export const docsPages: readonly DocPage[] = parsePages(pagesJson).map((page) => page.id !== "guide:accounts" ? page : {
  ...page,
  blocks: page.blocks.map((block): DocBlock => block.type !== "kv" ? block : {
    type: "kv",
    rows: [
      ["Kit", `${formatMoney(PRICES.kit.solo)} · one niche, all three item types`],
      ["Library", `${formatMoney(PRICES.ui.solo)} · workflows, agents or UI`],
      ["All-Access", `${formatMoney(PRICES.all.solo)} · everything`],
      ["Team", `${TEAM_SEATS_INCLUDED} seats, ${formatMoney(PRICES.kit.team)} to ${formatMoney(PRICES.all.team)}, add more any time`],
    ],
  }),
});

const pagesByPath = new Map(docsPages.map((page) => [page.path, page]));
const pagesById = new Map(docsPages.map((page) => [page.id, page]));

for (const page of docsPages) {
  if (docsNavigation.pathOf[page.id] !== page.path) throw new Error(`Documentation URL mismatch: ${page.id}`);
  for (const id of [page.prev, page.next]) if (id && !pagesById.has(id)) throw new Error(`Unknown documentation neighbour: ${id}`);
  for (const block of page.blocks) {
    const links = block.type === "cards" ? block.cards : block.type === "chips" ? block.chips : [];
    for (const link of links) if (link.docId && !pagesById.has(link.docId)) throw new Error(`Unknown documentation link: ${link.docId}`);
  }
}

export function findDocPage(path: string) {
  return pagesByPath.get(path);
}

export function docLink(id: string | null) {
  const page = id ? pagesById.get(id) : undefined;
  return page ? { title: page.title, path: page.path } : null;
}

export function markdownPath(path: string) {
  return `${path}.md`;
}

function fenced(lines: readonly string[], lang: string) {
  return `\`\`\`${lang}\n${lines.join("\n")}\n\`\`\``;
}

function markdownCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

export function blockMarkdown(block: DocBlock): string {
  switch (block.type) {
    case "h2": return `## ${block.text}`;
    case "p": return block.text;
    case "ul": return block.items.map((item) => `- ${item}`).join("\n");
    case "ol": return block.items.map((item, index) => `${index + 1}. **${item.title}**${item.detail ? `\n   ${item.detail}` : ""}`).join("\n");
    case "code": return fenced(block.lines, block.lang);
    case "tabs": return block.tabs.map((tab) => `### ${tab.label}\n\n${fenced(tab.lines, tab.lang)}${tab.note ? `\n\n${tab.note}` : ""}`).join("\n\n");
    case "pm-command": return fenced([`pnpm dlx ${block.command}`], "bash");
    case "install-ui": return `${fenced([`pnpm dlx ${block.command}`], "bash")}\n\n### Manual\n\n${blockMarkdown({ type: "ol", items: block.manual })}`;
    case "table": return [`| ${block.columns.map(markdownCell).join(" | ")} |`, `| ${block.columns.map(() => "---").join(" | ")} |`, ...block.rows.map((row) => `| ${row.map((cell) => markdownCell(cell.kind === "code" ? `\`${cell.text}\`` : cell.text)).join(" | ")} |`)].join("\n");
    case "callout": return block.text.split("\n").map((line) => `> ${line}`).join("\n");
    case "kv": return block.rows.map(([key, value]) => `- **${key}:** ${value}`).join("\n");
    case "chips": return block.chips.map((chip) => `- ${chip.docId ? `[${chip.text}](${docsNavigation.pathOf[chip.docId]})` : chip.text}`).join("\n");
    case "stats": return block.stats.map((stat) => `- **${stat.label}:** ${stat.value}`).join("\n");
    case "flow": return block.nodes.map((node, index) => `${index + 1}. **${node.title}** (${node.sub})`).join("\n");
    case "cards": return block.cards.map((card) => `- [${card.title}](${docsNavigation.pathOf[card.docId]}): ${card.desc}`).join("\n");
    case "preview": return `${fenced(block.code, "tsx")}\n\n${block.caption}`;
  }
}

export function docMarkdown(page: DocPage) {
  return `# ${page.title}\n\n${page.lead}\n\n${page.blocks.map(blockMarkdown).join("\n\n")}\n`;
}
