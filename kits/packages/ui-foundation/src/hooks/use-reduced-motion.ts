"use client";

import { useReducedMotion as useMotionReducedMotion } from "motion/react";
import { useCallback, useSyncExternalStore } from "react";

const mediaQuery = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = typeof window.matchMedia === "function" ? window.matchMedia(mediaQuery) : null;
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-reduced-motion"],
  });
  query?.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    query?.removeEventListener("change", onChange);
  };
}

/** A reactive HTML override takes precedence over Motion and OS preferences. */
export function useReducedMotion(): boolean {
  const motionPreference = useMotionReducedMotion();
  const getSnapshot = useCallback(() => {
    const override = document.documentElement.dataset.reducedMotion;
    if (override === "true") return true;
    if (override === "false") return false;
    return typeof window.matchMedia === "function"
      ? window.matchMedia(mediaQuery).matches
      : (motionPreference ?? true);
  }, [motionPreference]);
  // Reserve a stable, motion-safe server frame until the client preference loads.
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
