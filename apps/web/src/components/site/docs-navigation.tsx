"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DocNavigation, DocNavItem } from "@content/site/docs-types";
import { Icon } from "./shared";

function storedGroups(): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem("ail-docs-groups") ?? "{}");
    if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, open]) => typeof open === "boolean")) as Record<string, boolean>;
  } catch { return {}; }
}

export function DocsWorkspace({ navigation, currentId, title, children }: { navigation: DocNavigation; currentId: string; title: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    const saved = storedGroups();
    const hydrate = requestAnimationFrame(() => setChoices(saved));
    return () => cancelAnimationFrame(hydrate);
  }, []);
  useEffect(() => {
    const selected = sidebar.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const container = sidebar.current;
    if (!selected || !container) return;
    const offset = selected.offsetTop - container.offsetTop;
    if (offset < container.scrollTop || offset + selected.offsetHeight > container.scrollTop + container.clientHeight) container.scrollTop = Math.max(0, offset - container.clientHeight / 2);
  }, [currentId, choices]);
  useEffect(() => {
    function close(event: globalThis.KeyboardEvent) { if (event.key === "Escape") setMobileOpen(false); }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  function toggleGroup(key: string, open: boolean) {
    const next = { ...choices, [key]: !open };
    setChoices(next);
    try { sessionStorage.setItem("ail-docs-groups", JSON.stringify(next)); } catch {}
  }

  function link(item: DocNavItem) {
    const selected = item.id === currentId;
    return <Link className={`st-dl${selected ? " is-on" : ""}`} href={navigation.pathOf[item.id]} prefetch={false} aria-current={selected ? "page" : undefined} key={item.id} onClick={() => setMobileOpen(false)}><span>{item.title}</span>{item.badge && <em className={item.badge === "Free" ? "is-free" : "is-soon"}>{item.badge}</em>}</Link>;
  }

  return <div className="st-docs"><button type="button" className="st-dmenu" data-testid="docs-menu-toggle" aria-expanded={mobileOpen} aria-controls="docs-sidebar" onClick={() => setMobileOpen(!mobileOpen)}><Icon name={mobileOpen ? "x" : "menu"} /><span>Docs menu</span><b>{title}</b></button><aside className={`st-dside${mobileOpen ? " is-open" : ""}`} id="docs-sidebar" data-testid="docs-sidebar" ref={sidebar}><nav aria-label="Docs"><button type="button" className="st-search st-dsearch" onClick={() => window.dispatchEvent(new Event("site:search"))}><Icon name="search" /><span>Search docs</span><kbd>⌘K</kbd></button>{navigation.groups.map((group) => {
    const items = [...group.items ?? [], ...group.sections?.flatMap((section) => section.items) ?? []];
    const open = choices[group.key] ?? (group.defaultOpen || items.some((item) => item.id === currentId));
    return <div className={`st-dg${open ? " is-open" : ""}`} key={group.key}><button type="button" className="st-dg-h" aria-expanded={open} aria-controls={`docs-group-${group.key}`} onClick={() => toggleGroup(group.key, open)}><span>{group.title}</span><em>{items.length}</em><Icon name="chevd" /></button><div className="st-dg-l" id={`docs-group-${group.key}`} hidden={!open}>{open && <>{group.items?.map(link)}{group.sections?.map((section) => <div key={section.label}><div className="st-dl-lab">{section.label}</div>{section.items.map(link)}</div>)}</>}</div></div>;
  })}</nav></aside>{children}</div>;
}

