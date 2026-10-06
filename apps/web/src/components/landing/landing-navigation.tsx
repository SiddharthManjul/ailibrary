"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

export function LandingNavigation() {
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let disposed = false;
    let generation = 0;
    let programmatic = false;
    let stopSmoothing = () => {};
    let cancel = () => {};

    async function configureSmoothing() {
      const current = ++generation;
      stopSmoothing();
      stopSmoothing = () => {};
      lenis = null;
      if (motion.matches) return;
      try {
        const [{ default: Lenis }, { gsap }] = await Promise.all([import("lenis"), import("gsap")]);
        if (disposed || current !== generation || motion.matches) return;
        const instance = new Lenis({
          autoRaf: false,
          autoResize: true,
          smoothWheel: true,
          syncTouch: false,
          lerp: 0.1,
          allowNestedScroll: true,
          anchors: false,
          stopInertiaOnNavigate: true,
        });
        const tick = (seconds: number) => instance.raf(seconds * 1000);
        lenis = instance;
        gsap.ticker.add(tick);
        stopSmoothing = () => { gsap.ticker.remove(tick); instance.destroy(); };
      } catch {
        lenis = null;
      }
    }

    function scrollTo(target: HTMLElement, animate: boolean) {
      const immediate = !animate || motion.matches;
      programmatic = !immediate;
      if (lenis) {
        lenis.resize();
        lenis.scrollTo(target, { immediate, duration: 1, lerp: 0, onComplete: () => { programmatic = false; } });
      } else {
        target.scrollIntoView({ behavior: immediate ? "instant" : "smooth", block: "start" });
      }
    }

    function navigate(hash: string, updateHistory: boolean) {
      let identifier: string;
      try { identifier = decodeURIComponent(hash.slice(1)); } catch { return; }
      const target = document.getElementById(identifier);
      if (!target) return;
      interrupt();
      if (updateHistory && window.location.hash !== hash) window.history.pushState(null, "", hash);
      if (identifier === "top") { scrollTo(target, updateHistory); return; }
      window.dispatchEvent(new CustomEvent("landing:reveal", { detail: target.id }));
      const started = performance.now();
      let previous = -1;
      let stable = 0;
      let frame = 0;
      function settle() {
        const preceding = [...document.querySelectorAll<HTMLElement>(".lp-lazy")].filter((demo) => target?.contains(demo) || Boolean(demo.compareDocumentPosition(target!) & Node.DOCUMENT_POSITION_FOLLOWING));
        const loaded = preceding.every((demo) => demo.dataset.ready === "true" && demo.firstElementChild !== null);
        const top = target!.getBoundingClientRect().top + window.scrollY;
        stable = loaded && Math.abs(top - previous) < 1 ? stable + 1 : 0;
        previous = top;
        if (stable >= 8 || performance.now() - started > 3000) {
          scrollTo(target!, updateHistory);
          return;
        }
        frame = requestAnimationFrame(settle);
      }
      frame = requestAnimationFrame(settle);
      cancel = () => cancelAnimationFrame(frame);
    }

    function click(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute("href");
      if (!hash || hash.length < 2 || link?.hasAttribute("download") || (link?.target && link.target !== "_self")) return;
      let identifier: string;
      try { identifier = decodeURIComponent(hash.slice(1)); } catch { return; }
      if (!document.getElementById(identifier)) return;
      event.preventDefault();
      navigate(hash, true);
    }

    function interrupt() {
      cancel();
      if (!programmatic) return;
      programmatic = false;
      if (lenis) { lenis.stop(); lenis.start(); }
      else window.scrollTo({ top: window.scrollY, behavior: "instant" });
    }

    function keydown(event: KeyboardEvent) {
      if (event.defaultPrevented || !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, button, [contenteditable="true"], [role="tab"], [role="radio"]')) return;
      interrupt();
    }

    function motionChanged() {
      interrupt();
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
      void configureSmoothing();
    }

    const hashChanged = () => { interrupt(); if (window.location.hash) navigate(window.location.hash, false); };
    const scrollEnded = () => { if (!lenis) programmatic = false; };
    void configureSmoothing();
    motion.addEventListener("change", motionChanged);
    document.addEventListener("click", click, true);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("keydown", keydown);
    window.addEventListener("hashchange", hashChanged);
    window.addEventListener("scrollend", scrollEnded);
    hashChanged();
    return () => {
      cancel();
      disposed = true;
      stopSmoothing();
      motion.removeEventListener("change", motionChanged);
      document.removeEventListener("click", click, true);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("hashchange", hashChanged);
      window.removeEventListener("scrollend", scrollEnded);
    };
  }, []);
  return null;
}
