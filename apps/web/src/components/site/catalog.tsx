"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { Agent, CatalogPageData, UIItem, Workflow } from "@content/site/catalog";
import { kits, siteData } from "@content/site/settings";
import { CatalogCard, type CatalogEntry } from "./catalog-card";
import { Icon, Trio } from "./shared";
import { URLQuery } from "./url-query";

export type CatalogKind = "workflows" | "agents" | "ui";
export type CatalogData = { page: CatalogPageData } & (
  | { kind: "workflows"; items: Workflow[] }
  | { kind: "agents"; items: Agent[] }
  | { kind: "ui"; components: UIItem[]; blocks: UIItem[] }
);
type FilterKey = "kit" | "platform" | "access" | "app" | "wave" | "tools" | "group";
type CatalogState = Record<FilterKey | "q" | "view" | "tab", string>;
type FilterOption = { label: string; count: number; trio?: readonly string[] };
type FilterGroup = { title: string; field: FilterKey; options: (FilterOption & { value: string })[] };
type CatalogSection = { key: string; title: string; noun: string; entries: CatalogEntry[]; allLabel: string };

function readState(params: URLSearchParams, kind: CatalogKind, workflowApps: readonly string[] = []): CatalogState {
  const valid = (key: string, allowed: readonly string[]) => {
    const value = params.get(key) ?? "";
    return allowed.includes(value) ? value : "";
  };
  const state: CatalogState = { kit: "", platform: "", access: "", app: "", wave: "", tools: "", group: "", q: params.get("q") ?? "", view: "", tab: "" };
  if (kind !== "ui") state.kit = valid("kit", kits.map((kit) => kit.slug));
  if (kind === "workflows") {
    state.platform = valid("platform", ["n8n", "make", "zapier"]);
    state.access = valid("access", ["free", "hero"]);
    state.app = valid("app", workflowApps);
  } else if (kind === "agents") {
    state.wave = valid("wave", ["launch", "next"]);
    state.tools = valid("tools", ["read", "write"]);
    state.access = valid("access", ["free"]);
    state.view = valid("view", ["table"]);
  } else {
    state.tab = valid("tab", ["blocks"]);
    state.group = valid("group", siteData.uiGroups[state.tab === "blocks" ? "blocks" : "components"].map((group) => group[0]));
    if (!state.tab) state.access = valid("access", ["free"]);
  }
  return state;
}

function readCatalogState(params: URLSearchParams, data: CatalogData): CatalogState {
  return readState(params, data.kind, data.kind === "workflows" ? data.items.flatMap((workflow) => workflow.apps) : []);
}

function filterGroups(data: CatalogData, state: CatalogState): FilterGroup[] {
  const kind = data.kind;
  const filters = kind === "ui" && state.tab === "blocks" ? data.page.blocksTab?.filters ?? data.page.filters : data.page.filters;
  const fields: FilterKey[] = kind === "workflows" ? ["kit", "platform", "access", "app"] : kind === "agents" ? ["kit", "wave", "tools", "access"] : ["group", "access"];
  return filters.map((group, groupIndex) => {
    const field = fields[groupIndex];
    return {
      title: group.title,
      field,
      options: group.options.map((option: FilterOption, optionIndex) => {
        let value = "";
        if (optionIndex > 0) {
          if (field === "kit") value = kits[optionIndex - 1].slug;
          else if (field === "platform") value = option.label.toLowerCase();
          else if (field === "access") value = optionIndex === 1 ? "free" : "hero";
          else if (field === "app") value = option.label;
          else if (field === "wave") value = optionIndex === 1 ? "launch" : "next";
          else if (field === "tools") value = optionIndex === 1 ? "read" : "write";
          else value = siteData.uiGroups[state.tab === "blocks" ? "blocks" : "components"][optionIndex - 1][0];
        }
        return { ...option, value };
      }),
    };
  });
}

function catalogEntries(data: CatalogData, state: CatalogState): CatalogEntry[] {
  const query = state.q.trim().toLowerCase();
  const matches = (item: { title: string; summary: string }) => !query || `${item.title} ${item.summary}`.toLowerCase().includes(query);
  if (data.kind === "workflows") return data.items.filter((item) =>
    (!state.kit || item.kit === state.kit)
    && (!state.platform || item.platforms.some((platform) => platform.toLowerCase() === state.platform))
    && (!state.access || (state.access === "free" ? item.free : item.kitHero))
    && (!state.app || item.apps.includes(state.app)) && matches(item)
  ).map((item) => ({ type: "workflow", item }));
  if (data.kind === "agents") return data.items.filter((item) =>
    (!state.kit || item.kit === state.kit)
    && (!state.wave || (state.wave === "next" ? item.nextDrop : !item.nextDrop))
    && (!state.tools || (state.tools === "read" ? item.writeTools === 0 : item.writeTools > 0))
    && (!state.access || item.free) && matches(item)
  ).map((item) => ({ type: "agent", item }));
  const type = state.tab === "blocks" ? "block" : "component";
  return (type === "block" ? data.blocks : data.components).filter((item) =>
    (!state.group || item.group === state.group) && (!state.access || item.free) && matches(item)
  ).map((item) => ({ type, item }));
}

function catalogSections(kind: CatalogKind, state: CatalogState, entries: CatalogEntry[]): CatalogSection[] {
  if (kind !== "ui") return kits.map((kit) => ({
    key: kit.slug,
    title: `${kit.name} kit`,
    noun: kind,
    entries: entries.filter((entry) => "kit" in entry.item && entry.item.kit === kit.slug),
    allLabel: `All ${entries.filter((entry) => "kit" in entry.item && entry.item.kit === kit.slug).length} ${kit.name} ${kind}`,
  })).filter((section) => section.entries.length > 0);
  const tab = state.tab === "blocks" ? "blocks" : "components";
  return siteData.uiGroups[tab].map(([key, title]) => ({
    key,
    title,
    noun: tab,
    entries: entries.filter((entry) => "group" in entry.item && entry.item.group === key),
    allLabel: `All ${entries.filter((entry) => "group" in entry.item && entry.item.group === key).length} in ${title}`,
  })).filter((section) => section.entries.length > 0);
}

function AgentTable({ entries }: { entries: CatalogEntry[] }) {
  return <div className="lp-tbl st-atbl" role="table" aria-label="Agent eval targets">
    <div className="lp-tr is-h" role="row">{["Agent", "Kit", "Tools", "Pass target", "p95 target", "Cost target", "Availability"].map((heading) => <span role="columnheader" aria-label={heading === "Availability" ? heading : undefined} key={heading}>{heading === "Availability" ? "" : heading}</span>)}</div>
    {entries.map(({ item }) => {
      const agent = item as Agent;
      const kit = kits.find((candidate) => candidate.slug === agent.kit);
      return <Link href={agent.docPath} prefetch={false} className="lp-tr st-arow" role="row" data-testid="agent-row" key={agent.id}>
        <span className="lp-tr-n" role="cell" data-testid="agent-name">{agent.title}</span>
        <span className="lp-tr-n" role="cell" style={{ fontWeight: 400, color: "var(--muted)" }}><Trio colors={kit?.trio} />{kit?.name}</span>
        <span className="is-num" role="cell">{agent.readTools} read · {agent.writeTools} write</span>
        <span className="is-num" role="cell">{agent.targets.pass || "see docs"}</span>
        <span className="is-num" role="cell">{agent.targets.p95 || "·"}</span>
        <span className="is-num" role="cell">{agent.targets.cost || "·"}</span>
        <span className="st-soon" role="cell">{agent.nextDrop ? "Next drop" : ""}</span>
      </Link>;
    })}
  </div>;
}

export function Catalog({ data }: { data: CatalogData }) {
  const kind = data.kind;
  const router = useRouter();
  const pathname = usePathname();
  const [queryString, setQueryString] = useState("");
  const state = readCatalogState(new URLSearchParams(queryString), data);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const pendingParams = useRef(queryString);
  const observedParams = useRef(queryString);
  const pendingWrites = useRef<string[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const observeQuery = useCallback((query: string) => {
    const ownWrite = pendingWrites.current.indexOf(query);
    observedParams.current = query;
    if (ownWrite >= 0) {
      pendingWrites.current.splice(0, ownWrite + 1);
      if (!pendingWrites.current.length) pendingParams.current = query;
    } else {
      pendingWrites.current = [];
      pendingParams.current = query;
      if (searchTimer.current) clearTimeout(searchTimer.current);
      setSearch(readState(new URLSearchParams(query), kind).q);
    }
    setQueryString(query);
  }, [kind]);

  useEffect(() => {
    if (!isPending) {
      pendingWrites.current = [];
      pendingParams.current = observedParams.current;
    }
  }, [isPending]);
  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);
  useEffect(() => {
    function restoreHistory() {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      pendingWrites.current = [];
      const query = new URLSearchParams(window.location.search).toString();
      observedParams.current = query;
      pendingParams.current = query;
      setQueryString(query);
      setSearch(readState(new URLSearchParams(query), kind).q);
    }
    window.addEventListener("popstate", restoreHistory);
    return () => window.removeEventListener("popstate", restoreHistory);
  }, [kind]);
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target;
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      event.preventDefault();
      searchInput.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const replaceState = useCallback((patch: Partial<CatalogState>, reset = false) => {
    const next = { ...readCatalogState(new URLSearchParams(reset ? "" : pendingParams.current), data), ...patch };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) if (value && (key !== "q" || value.trim())) params.set(key, value);
    const query = params.toString();
    pendingParams.current = query;
    pendingWrites.current.push(query);
    startTransition(() => router.replace(`${pathname}${params.size ? `?${query}` : ""}`, { scroll: false }));
  }, [data, pathname, router]);

  const clearFilters = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearch("");
    replaceState({ tab: state.tab, view: state.view }, true);
  };
  const changeSearch = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => replaceState({ q: value }), 200);
  };
  const groups = filterGroups(data, state);
  const entries = catalogEntries(data, { ...state, q: search });
  const sections = catalogSections(kind, state, entries);
  const capped = !(kind === "ui" ? state.group : state.kit);
  const isTable = kind === "agents" && state.view === "table";
  const shown = isTable ? entries.length : sections.reduce((count, section) => count + (capped ? Math.min(6, section.entries.length) : section.entries.length), 0);
  const copy = data.page;
  const placeholder = kind === "ui" && state.tab === "blocks" ? copy.blocksTab?.searchPlaceholder ?? "Search blocks" : copy.searchPlaceholder;
  const isFiltered = groups.some((group) => !!state[group.field]) || !!search;

  return <div className="st-cat">
    <URLQuery onChange={observeQuery} />
    <aside className="st-side" aria-label="Filters">
      <label className="st-search"><Icon name="search" /><input ref={searchInput} type="search" data-testid="catalog-search" placeholder={placeholder} aria-label={placeholder} value={search} onChange={(event) => changeSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); changeSearch(""); } }} /><kbd>/</kbd></label>
      {groups.map((group) => <div className="st-fg" key={group.field}><div className="st-fg-h" id={`filter-${group.field}`}>{group.title}</div><div className="st-fg-o" role="group" aria-labelledby={`filter-${group.field}`}>{group.options.map((option) => <button type="button" className={`st-fo ${state[group.field] === option.value ? "is-on" : ""}`} data-testid="filter-option" data-filter={group.field} data-value={option.value || "all"} aria-pressed={state[group.field] === option.value} onClick={() => replaceState({ [group.field]: option.value })} key={option.value}>{option.trio && <Trio colors={option.trio} />}<span className="st-fo-t">{option.label}</span><em>{option.count}</em></button>)}</div></div>)}
      {isFiltered && <button type="button" className="st-reset" onClick={clearFilters}><Icon name="x" />Clear filters</button>}
    </aside>
    <main className="st-cmain" id="site-content" tabIndex={-1}>
      <div className="st-ch"><div className="st-crumb"><span>Library</span><Icon name="chevr" /><b>{copy.title}</b></div><h1>{copy.title}</h1><p>{copy.sub}</p><div className="st-stats">{copy.stats.map((stat) => <span key={stat.l}><b>{stat.v}</b>{stat.l}</span>)}</div></div>
      {kind === "ui" && <div className="st-tabs" role="tablist" aria-label="UI type">{[{ value: "", label: "Components" }, { value: "blocks", label: "Blocks" }].map((tab, index) => <button type="button" role="tab" id={`catalog-tab-${tab.value || "components"}`} aria-controls="catalog-items" tabIndex={state.tab === tab.value ? 0 : -1} aria-selected={state.tab === tab.value} className={state.tab === tab.value ? "is-on" : ""} key={tab.label} onClick={() => replaceState({ tab: tab.value, group: "", access: "" })} onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? 1 : (index + 1) % 2;
        replaceState({ tab: nextIndex === 1 ? "blocks" : "", group: "", access: "" });
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[nextIndex]?.focus();
      }}>{tab.label}<em>50</em></button>)}</div>}
      <div className="st-tool"><span className="st-count" data-testid="catalog-count" aria-live="polite">Showing {shown} of {entries.length}</span>{kind === "agents" && <div className="lp-tgl st-view" role="group" aria-label="Agent view">{[{ value: "", label: "Cards" }, { value: "table", label: "Eval targets" }].map((view) => <button type="button" aria-pressed={state.view === view.value} className={state.view === view.value ? "is-on" : ""} key={view.label} onClick={() => replaceState({ view: view.value })}>{view.label}</button>)}</div>}</div>
      <div id="catalog-items" role={kind === "ui" ? "tabpanel" : undefined} aria-labelledby={kind === "ui" ? `catalog-tab-${state.tab || "components"}` : undefined}>
        {isTable ? entries.length > 0 && <AgentTable entries={entries} /> : sections.map((section) => <section className="st-sec" data-testid="catalog-section" key={section.key}><div className="st-sec-h"><h2>{section.title}</h2><span>{section.entries.length} {section.noun}</span></div><div className="st-grid">{(capped ? section.entries.slice(0, 6) : section.entries).map((entry) => <CatalogCard entry={entry} key={entry.item.docPath} />)}</div>{capped && section.entries.length > 6 && <button type="button" className="st-more" onClick={() => replaceState({ [kind === "ui" ? "group" : "kit"]: section.key })}>{section.allLabel}<Icon name="arrow" /></button>}</section>)}
        {entries.length === 0 && <div className="st-empty" data-testid="catalog-empty"><b>Nothing matches</b><p>Try another kit or clear the search.</p><button type="button" className="lp-btn lp-btn-g" onClick={clearFilters}>Clear filters</button></div>}
      </div>
    </main>
  </div>;
}
