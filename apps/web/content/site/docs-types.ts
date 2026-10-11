export type DocStep = { title: string; detail?: string };
export type DocCodeTab = { label: string; lang: string; lines: readonly string[]; note?: string };
export type DocTableCell = { text: string; kind: "text" | "code" | "badge" | "badge-write" | "kbd" };
export type DocBlock =
  | { type: "h2"; text: string; anchor: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: readonly string[] }
  | { type: "ol"; items: readonly DocStep[] }
  | { type: "code"; lang: string; title: string; lines: readonly string[] }
  | { type: "tabs"; tabs: readonly DocCodeTab[] }
  | { type: "pm-command"; command: string }
  | { type: "install-ui"; command: string; manual: readonly DocStep[] }
  | { type: "table"; columns: readonly string[]; grid: string; rows: readonly (readonly DocTableCell[])[] }
  | { type: "callout"; tone: "info" | "tip"; text: string }
  | { type: "kv"; rows: readonly (readonly [string, string])[] }
  | { type: "chips"; chips: readonly { text: string; docId?: string }[] }
  | { type: "stats"; stats: readonly { label: string; value: string }[] }
  | { type: "flow"; nodes: readonly { title: string; sub: string; icon: string }[] }
  | { type: "cards"; cards: readonly { title: string; desc: string; tag?: string; docId: string }[] }
  | { type: "preview"; code: readonly string[]; caption: string; designedDemo: string | null; thumbnail: string };

export type DocPage = {
  id: string;
  path: string;
  title: string;
  lead: string;
  crumbs: readonly string[];
  meta: readonly { text: string; kitTrio?: readonly string[] }[];
  prev: string | null;
  next: string | null;
  toc: readonly { text: string; anchor: string }[];
  blocks: readonly DocBlock[];
};

export type DocNavItem = { id: string; title: string; badge?: string };
export type DocNavGroup = {
  key: string;
  title: string;
  defaultOpen: boolean;
  items?: readonly DocNavItem[];
  sections?: readonly { label: string; items: readonly DocNavItem[] }[];
};
export type DocNavigation = { pathOf: Readonly<Record<string, string>>; groups: readonly DocNavGroup[] };
export type DocLink = { title: string; path: string };
