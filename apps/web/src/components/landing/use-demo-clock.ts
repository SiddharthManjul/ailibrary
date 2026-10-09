"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeMotion(notify: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}

export function useDemoClock(name: string, { running = true, duration }: { running?: boolean; duration?: number } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const total = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const documentVisible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => true);
  const paused = !visible || !documentVisible || reduced || !running || (duration === undefined && (hovered || focused));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "160px" });
    const enter = (event: PointerEvent) => { if (event.pointerType !== "touch") setHovered(true); };
    const leave = () => setHovered(false);
    const focus = () => setFocused(true);
    const blur = (event: FocusEvent) => { if (!element.contains(event.relatedTarget as Node | null)) setFocused(false); };
    observer.observe(element);
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("focusin", focus);
    element.addEventListener("focusout", blur);
    return () => {
      observer.disconnect();
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("focusin", focus);
      element.removeEventListener("focusout", blur);
    };
  }, [name]);

  useEffect(() => {
    ref.current?.style.setProperty("--demo-play-state", paused ? "paused" : "running");
    if (paused) return;
    let frame = 0;
    let previous = performance.now();
    let rendered = previous;
    function tick(now: number) {
      total.current += Math.min(now - previous, 100);
      if (duration !== undefined && total.current >= duration) {
        total.current = duration;
        setElapsed(duration);
        return;
      }
      previous = now;
      if (now - rendered >= 62.5) {
        setElapsed(total.current);
        rendered = now;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, duration]);

  const reset = useCallback(() => { total.current = 0; setElapsed(0); }, []);
  return { ref, elapsed, reduced, visible, paused, reset };
}
