"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { SearchItem } from "@content/site/catalog";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Icon } from "./shared";

const navigation = [
  { title: "Kits", href: "/kits" },
  { title: "Workflows", href: "/workflows" },
  { title: "Agents", href: "/agents" },
  { title: "UI", href: "/ui" },
  { title: "Pricing", href: "/pricing" },
  { title: "Docs", href: "/docs" },
];

type DialogModule = typeof import("./site-dialogs");
type DialogKind = "search" | "menu";
let dialogModulePromise: Promise<DialogModule> | null = null;
let searchIndexPromise: Promise<readonly SearchItem[]> | null = null;

function isSearchIndex(value: unknown): value is SearchItem[] {
  return Array.isArray(value) && value.every(item => item && typeof item.title === "string" && typeof item.type === "string" && typeof item.kit === "string" && typeof item.path === "string" && item.path.startsWith("/docs/"));
}

function loadDialogModule() {
  dialogModulePromise ??= import("./site-dialogs").catch(error => {
    dialogModulePromise = null;
    throw error;
  });
  return dialogModulePromise;
}

function loadSearchIndex() {
  searchIndexPromise ??= fetch("/search-index.json").then(async response => {
    if (!response.ok) throw new Error("Search index request failed");
    const items: unknown = await response.json();
    if (!isSearchIndex(items)) throw new Error("Search index response is invalid");
    return items;
  }).catch(error => {
    searchIndexPromise = null;
    throw error;
  });
  return searchIndexPromise;
}

export function SiteNavigation() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogsRequested, setDialogsRequested] = useState(false);
  const [dialogModule, setDialogModule] = useState<DialogModule | null>(null);
  const [searchItems, setSearchItems] = useState<readonly SearchItem[] | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [searchSession, setSearchSession] = useState(0);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [shortcut, setShortcut] = useState("⌘K");
  const activeDialog = useRef<DialogKind | null>(null);
  const dialogRequest = useRef(0);
  const mounted = useRef(true);
  const focusReturn = useRef<HTMLElement | null>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const searchId = useId();
  const menuId = useId();

  const closeSearch = useCallback(() => {
    if (activeDialog.current === "search") {
      activeDialog.current = null;
      dialogRequest.current += 1;
    }
    setSearchOpen(false);
  }, []);

  const closeMenu = useCallback(() => {
    if (activeDialog.current === "menu") {
      activeDialog.current = null;
      dialogRequest.current += 1;
    }
    setMenuOpen(false);
  }, []);

  const restoreSearchFocus = useCallback(() => {
    if (activeDialog.current) return;
    const opener = focusReturn.current;
    if (opener?.isConnected) opener.focus();
    else searchTrigger.current?.focus();
  }, []);

  const restoreMenuFocus = useCallback(() => {
    if (!activeDialog.current) menuTrigger.current?.focus();
  }, []);

  const requestDialogs = useCallback((requestedDialog: DialogKind, explicitOpen: boolean) => {
    const request = dialogRequest.current;
    const moduleRequest = loadDialogModule().then(module => {
      if (mounted.current) setDialogModule(module);
    });
    const resources = requestedDialog === "search" ? Promise.all([moduleRequest, loadSearchIndex().then(items => {
      if (mounted.current) setSearchItems(items);
    })]) : moduleRequest;
    void resources.catch(() => {
      if (!mounted.current || !explicitOpen || activeDialog.current !== requestedDialog || dialogRequest.current !== request) return;
      closeSearch();
      closeMenu();
      setDialogsRequested(false);
      setDialogError(requestedDialog === "search" ? "Search could not load. Please try again." : "The menu could not load. Please try again.");
      if (requestedDialog === "search") restoreSearchFocus();
      else restoreMenuFocus();
    });
  }, [closeSearch, closeMenu, restoreSearchFocus, restoreMenuFocus]);

  const openSearch = useCallback(() => {
    if (activeDialog.current !== "search") focusReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRequest.current += 1;
    activeDialog.current = "search";
    setMenuOpen(false);
    setSearchSession(current => current + 1);
    setDialogError("");
    setDialogsRequested(true);
    setSearchOpen(true);
    requestDialogs("search", true);
  }, [requestDialogs]);

  function toggleMenu() {
    if (activeDialog.current === "menu") {
      closeMenu();
      return;
    }
    dialogRequest.current += 1;
    activeDialog.current = "menu";
    setSearchOpen(false);
    setDialogError("");
    setDialogsRequested(true);
    setMenuOpen(true);
    requestDialogs("menu", true);
  }

  function warmSearch() { requestDialogs("search", false); }
  function warmMenu() { requestDialogs("menu", false); }

  useEffect(() => {
    mounted.current = true;
    const platform = navigator.userAgent;
    const keyHint = /Mac|iPhone|iPad/.test(platform) ? "⌘K" : "Ctrl K";
    const frame = requestAnimationFrame(() => setShortcut(keyHint));
    function keydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (activeDialog.current === "search") closeSearch();
        else openSearch();
      } else if (event.key === "Escape") {
        const contentId = activeDialog.current === "search" ? searchId : menuId;
        if (event.defaultPrevented && document.getElementById(contentId)) return;
        if (activeDialog.current === "search") closeSearch();
        else if (activeDialog.current === "menu") closeMenu();
      }
    }
    function requested() { openSearch(); }
    document.addEventListener("keydown", keydown);
    window.addEventListener("site:search", requested);
    const media = window.matchMedia("(min-width: 1101px)");
    function resize() { if (media.matches) closeMenu(); }
    media.addEventListener("change", resize);
    return () => {
      mounted.current = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("site:search", requested);
      media.removeEventListener("change", resize);
    };
  }, [closeMenu, closeSearch, openSearch, searchId, menuId]);

  function isCurrent(href: string) { return href === "/docs" ? pathname.startsWith("/docs") : pathname === href; }
  const SiteDialogs = dialogModule?.default;

  return <>
    <header className="st-hd" data-testid="site-header">
      <Link href="/" prefetch={false} className="al-brand st-brand" aria-label="AI Library home"><BrandMark className="al-mark" /><span>AI Library</span></Link>
      <nav className="st-nav" aria-label="Main">{navigation.map(link => <Link href={link.href} prefetch={false} className={isCurrent(link.href) ? "is-on" : undefined} aria-current={isCurrent(link.href) ? "page" : undefined} key={link.href}>{link.title}</Link>)}</nav>
      <div className="st-hr">
        <button ref={searchTrigger} type="button" className="st-sbtn" aria-label="Search the library" aria-haspopup="dialog" aria-expanded={searchOpen} aria-controls={searchOpen ? searchId : undefined} data-state={searchOpen ? "open" : "closed"} onPointerEnter={warmSearch} onFocus={warmSearch} onClick={openSearch}><Icon name="search" /><span>Search the library</span><kbd>{shortcut}</kbd></button>
        <ThemeToggle className="st-ib" ariaLabel="Toggle theme" />
        <Link href="/workflows?access=free" prefetch={false} className="lp-btn lp-btn-p st-btn-sm">Get started</Link>
        <button ref={menuTrigger} type="button" className="st-ib st-menu" aria-label="Menu" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls={menuOpen ? menuId : undefined} data-state={menuOpen ? "open" : "closed"} onPointerEnter={warmMenu} onFocus={warmMenu} onClick={toggleMenu}><Icon name={menuOpen ? "x" : "menu"} /></button>
      </div>
    </header>
    <div ref={setPortal} className="st-portals" />
    {dialogError && <p className="sr-only" role="status">{dialogError}</p>}
    {dialogsRequested && SiteDialogs && <SiteDialogs items={searchItems ?? []} navigation={navigation} pathname={pathname} portal={portal} searchOpen={searchOpen && searchItems !== null} menuOpen={menuOpen} searchSession={searchSession} searchId={searchId} menuId={menuId} closeSearch={closeSearch} closeMenu={closeMenu} restoreSearchFocus={restoreSearchFocus} restoreMenuFocus={restoreMenuFocus} />}
  </>;
}
