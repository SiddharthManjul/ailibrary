"use client";

import { Menu, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as Popover from "radix-ui/popover";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SearchItem } from "@content/site/catalog";

import s from "./mobile-navigation.module.css";

const SiteNavigation = dynamic(() => import("@/components/site/site-navigation").then(module => module.SiteNavigation));

const links = [
  { href: "#kits", label: "Kits" },
  { href: "#workflows", label: "Workflows" },
  { href: "#agents", label: "Agents" },
  { href: "#ui", label: "UI" },
  { href: "#pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
] as const;

type HeroNavigationProps = {
  variant?: "hero";
  multicolor: boolean;
  onColorModeChange: () => void;
} | { variant: "site"; searchItems: readonly SearchItem[] };

export function HeroNavigation(props: HeroNavigationProps) {
  return props.variant === "site" ? <SiteNavigation /> : <HeroNavigationContent {...props} />;
}

function HeroNavigationContent({ multicolor, onColorModeChange }: { multicolor: boolean; onColorModeChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const colorLabel = multicolor ? "Switch hero to single color" : "Switch hero to multicolor";
  const MenuIcon = open ? X : Menu;

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 1100px)");
    const closeOnDesktop = () => {
      if (!compact.matches) setOpen(false);
    };

    compact.addEventListener("change", closeOnDesktop);
    return () => compact.removeEventListener("change", closeOnDesktop);
  }, []);

  const close = () => setOpen(false);

  return (
    <header ref={setPortalContainer} className={s.header} data-scrolled={scrolled}>
      <Link
        href="#top"
        className={`${s.brand}${multicolor ? ` ${s.brandMulticolor}` : ""}`}
        aria-label="AI Library home"
      >
        <BrandMark className={s.mark} />
        <span>AI Library</span>
      </Link>
      <nav className={s.desktopLinks} aria-label="Main">
        {links.map((link) => (
          <Link href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className={s.controls}>
        <button
          type="button"
          className={s.icon}
          onClick={onColorModeChange}
          aria-label={colorLabel}
          aria-pressed={multicolor}
          title={colorLabel}
          data-slot="hero-color-toggle"
        >
          <span className={multicolor ? s.singleSwatch : s.multiSwatch} aria-hidden="true">
            {multicolor ? <i /> : <><i /><i /><i /></>}
          </span>
        </button>
        <ThemeToggle className={s.icon} />
        <Link href="#free" className={s.getStarted}>
          Get started
        </Link>
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={`${s.icon} ${s.menuTrigger}`}
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            >
              <MenuIcon aria-hidden="true" />
            </button>
          </Popover.Trigger>
          <Popover.Portal container={portalContainer}>
            <Popover.Content
              className={s.menu}
              align="end"
              side="bottom"
              sideOffset={12}
              collisionPadding={16}
              aria-label="Mobile navigation"
            >
              <nav aria-label="Mobile main">
                <div className={s.menuLinks}>
                  {links.map((link) => (
                    <Link href={link.href} key={link.href} className={s.menuLink} onClick={close}>
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className={s.account}>
                  <Link href="#free" className={s.menuSignup} onClick={close}>
                    Get started
                  </Link>
                </div>
              </nav>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </header>
  );
}
