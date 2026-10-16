"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "radix-ui/dialog";
import { useId, useRef, useState } from "react";

import type { SearchItem } from "@content/site/catalog";
import { Icon } from "./shared";

type SearchDialogProps = {
  items: readonly SearchItem[];
  portal: HTMLDivElement | null;
  searchOpen: boolean;
  searchId: string;
  closeSearch: () => void;
  restoreSearchFocus: () => void;
};

function SearchDialog({ items, portal, searchOpen, searchId, closeSearch, restoreSearchFocus }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const results = query.trim() ? items.filter(item => item.title.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8) : [];
  const active = Math.min(selected, Math.max(0, results.length - 1));

  function openResult(index: number) {
    const result = results[index];
    if (!result) return;
    closeSearch();
    router.push(result.path);
  }

  return <Dialog.Root open={searchOpen} onOpenChange={open => { if (!open) closeSearch(); }}>
    <Dialog.Portal container={portal}>
      <Dialog.Overlay className="st-pal-bg" />
      <Dialog.Content id={searchId} className="st-pal" aria-label="Search" aria-describedby={undefined} onOpenAutoFocus={event => { event.preventDefault(); inputRef.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); restoreSearchFocus(); }}>
        <Dialog.Title className="sr-only">Search</Dialog.Title>
        <div className="st-pal-in"><Icon name="search" /><input ref={inputRef} type="text" role="combobox" aria-label="Search workflows, agents, components and blocks" placeholder="Search workflows, agents, components and blocks" aria-expanded="true" aria-autocomplete="list" aria-controls={listId} aria-activedescendant={results.length ? `${listId}-${active}` : undefined} value={query} onChange={event => { setQuery(event.target.value); setSelected(0); }} onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (results.length) setSelected((active + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
          } else if (event.key === "Enter") { event.preventDefault(); openResult(active); }
        }} /><Dialog.Close aria-label="Close search"><kbd>Esc</kbd></Dialog.Close></div>
        <div className="st-pal-r" role="listbox" id={listId} aria-label="Search results">{results.map((result, index) => <button type="button" role="option" tabIndex={-1} id={`${listId}-${index}`} aria-selected={active === index} className={active === index ? "is-on" : undefined} key={result.path} onPointerMove={() => setSelected(index)} onClick={() => openResult(index)}><b data-testid="result-title">{result.title}</b><span>{result.type}{result.kit ? ` · ${result.kit[0].toUpperCase()}${result.kit.slice(1)}` : ""}</span></button>)}</div>
        {!query.trim() ? <p className="st-pal-hint">Type a name: &quot;triage&quot;, &quot;approval&quot;, &quot;invoice&quot;…</p> : !results.length ? <p className="st-pal-hint" role="status">No items match.</p> : null}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

type SiteDialogsProps = SearchDialogProps & {
  navigation: readonly { title: string; href: string }[];
  pathname: string;
  menuOpen: boolean;
  searchSession: number;
  menuId: string;
  closeMenu: () => void;
  restoreMenuFocus: () => void;
};

export default function SiteDialogs({ navigation, pathname, menuOpen, searchSession, menuId, closeMenu, restoreMenuFocus, ...searchProps }: SiteDialogsProps) {
  function isCurrent(href: string) { return href === "/docs" ? pathname.startsWith("/docs") : pathname === href; }

  return <>
    <Dialog.Root open={menuOpen} onOpenChange={open => { if (!open) closeMenu(); }}>
      <Dialog.Portal container={searchProps.portal}>
        <Dialog.Overlay className="st-menu-bg" />
        <Dialog.Content id={menuId} className="st-sheet" aria-describedby={undefined} onCloseAutoFocus={event => { event.preventDefault(); restoreMenuFocus(); }}>
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <div className="st-sheet-heading"><span>Explore the library</span><Dialog.Close className="st-ib" aria-label="Close menu"><Icon name="x" /></Dialog.Close></div>
          <nav aria-label="Mobile main">{navigation.map(link => <Link href={link.href} prefetch={false} aria-current={isCurrent(link.href) ? "page" : undefined} className={isCurrent(link.href) ? "is-on" : undefined} key={link.href} onClick={closeMenu}>{link.title}<Icon name="arrow" /></Link>)}</nav>
          <Link href="/workflows?access=free" prefetch={false} onClick={closeMenu}>Get started<Icon name="arrow" /></Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <SearchDialog key={searchSession} {...searchProps} />
  </>;
}
