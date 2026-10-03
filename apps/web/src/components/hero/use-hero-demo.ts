"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { KITS } from "./kits";

const CYCLE_MS = 9000;
const FRAME_MS = 48;
const INITIAL = { index: 0, elapsed: 0, reduced: false };

function createDemoClock() {
  let snapshot = INITIAL;
  const listeners = new Set<() => void>();
  let frame = 0;
  let lastTime = 0;
  let running = false;
  let paused = false;
  let visible = true;
  let hidden = false;
  let mounted = false;

  const publish = (next: typeof INITIAL) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const advance = (now: number) => {
    const elapsed = snapshot.elapsed + Math.max(0, now - lastTime);
    const completed = Math.floor(elapsed / CYCLE_MS);
    lastTime = now;
    publish({
      ...snapshot,
      index: (snapshot.index + completed) % KITS.length,
      elapsed: elapsed % CYCLE_MS,
    });
  };

  const tick = (now: number) => {
    frame = 0;
    if (!running) return;
    if (now - lastTime >= FRAME_MS) advance(now);
    frame = requestAnimationFrame(tick);
  };

  const syncRunning = () => {
    const next = mounted && !paused && visible && !hidden && !snapshot.reduced;
    if (next === running) return;
    if (running) advance(performance.now());
    running = next;
    cancelAnimationFrame(frame);
    frame = 0;
    if (running) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => INITIAL,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    pick: (index: number) => {
      if (!Number.isInteger(index) || index < 0 || index >= KITS.length) return;
      lastTime = performance.now();
      publish({ index, elapsed: snapshot.reduced ? CYCLE_MS : 0, reduced: snapshot.reduced });
    },
    pause: () => {
      paused = true;
      syncRunning();
    },
    resume: () => {
      paused = false;
      syncRunning();
    },
    mount: (hero: HTMLElement | null) => {
      mounted = true;
      hidden = document.hidden;
      const bounds = hero?.getBoundingClientRect();
      visible = !bounds || (bounds.bottom > 0 && bounds.top < window.innerHeight);
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onReducedChange = () => {
        if (running) {
          advance(performance.now());
          running = false;
          cancelAnimationFrame(frame);
          frame = 0;
        }
        publish({ ...snapshot, reduced: media.matches, elapsed: media.matches ? CYCLE_MS : 0 });
        syncRunning();
      };
      const onVisibilityChange = () => {
        hidden = document.hidden;
        syncRunning();
      };
      const observer = hero ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        syncRunning();
      }) : null;
      if (hero) observer?.observe(hero);
      media.addEventListener("change", onReducedChange);
      document.addEventListener("visibilitychange", onVisibilityChange);
      if (media.matches !== snapshot.reduced) {
        publish({ ...snapshot, reduced: media.matches, elapsed: media.matches ? CYCLE_MS : 0 });
      }
      syncRunning();

      return () => {
        mounted = false;
        syncRunning();
        observer?.disconnect();
        media.removeEventListener("change", onReducedChange);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    },
  };
}

export function useHeroDemo(heroRef: RefObject<HTMLElement | null>) {
  const [clock] = useState(createDemoClock);
  const snapshot = useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot);

  useEffect(() => clock.mount(heroRef.current), [clock, heroRef]);

  return { ...snapshot, pick: clock.pick, pause: clock.pause, resume: clock.resume };
}
