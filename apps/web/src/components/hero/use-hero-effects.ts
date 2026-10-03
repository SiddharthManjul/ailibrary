"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { InkFluid } from "./ink-fluid";
import type { Kit } from "./kits";

type Point = { x: number; y: number };
type Anchor = Point & { dx: number; dy: number };
type Box = Point & { width: number; height: number };
type Side = "right" | "left" | "top" | "bottom";
type Rgb = [number, number, number];
type Mode = "light" | "dark";

export type HeroLink = {
  path: string;
  start: Point;
  end: Point;
  hidden: boolean;
};

type HeroEffectsOptions = {
  heroRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  windows: readonly RefObject<HTMLDivElement | null>[];
  kit: Kit;
  multicolor: boolean;
  reduced: boolean;
};

const emptyLink = (): HeroLink => ({
  path: "",
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 },
  hidden: true,
});

const hexToRgb = (hex: string): Rgb => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = (color: Rgb) =>
  `#${color.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;

const mixColor = (from: Rgb, to: Rgb, progress: number): Rgb => [
  from[0] + (to[0] - from[0]) * progress,
  from[1] + (to[1] - from[1]) * progress,
  from[2] + (to[2] - from[2]) * progress,
];

const themeMode = (): Mode => document.documentElement.classList.contains("dark") ? "dark" : "light";

const palette = (kit: Kit, multicolor: boolean, mode: Mode) => ({
  accent: multicolor ? kit.accent[mode] : mode === "dark" ? "#9B7BFF" : "#6D28D9",
  ink: multicolor ? kit.ink[mode] : mode === "dark" ? "#9B7BFF" : "#CDBDFF",
  onAccent: mode === "dark" ? "#0B0B0D" : "#FFFFFF",
});

const backgroundColor = (hero: HTMLElement, mode: Mode) => {
  const background = getComputedStyle(hero).getPropertyValue("--hx-rbg").trim();
  return /^#[\da-f]{6}$/i.test(background) ? background : mode === "dark" ? "#0B0B0E" : "#EFEFEB";
};

const anchor = (box: Box, side: Side, fraction: number): Anchor => {
  if (side === "right") return { x: box.x + box.width, y: box.y + box.height * fraction, dx: 1, dy: 0 };
  if (side === "left") return { x: box.x, y: box.y + box.height * fraction, dx: -1, dy: 0 };
  if (side === "top") return { x: box.x + box.width * fraction, y: box.y, dx: 0, dy: -1 };
  return { x: box.x + box.width * fraction, y: box.y + box.height, dx: 0, dy: 1 };
};

const wavyPath = (start: Anchor, end: Anchor, unit: number) => {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const handle = Math.max(46 * unit, distance * 0.42);
  const first = { x: start.x + start.dx * handle, y: start.y + start.dy * handle };
  const second = { x: end.x + end.dx * handle, y: end.y + end.dy * handle };
  const segments = 36;
  const amplitude = Math.min(6 * unit, distance * 0.04);
  const points: Point[] = [];

  for (let index = 0; index <= segments; index++) {
    const progress = index / segments;
    const remaining = 1 - progress;
    const x = remaining ** 3 * start.x + 3 * remaining ** 2 * progress * first.x + 3 * remaining * progress ** 2 * second.x + progress ** 3 * end.x;
    const y = remaining ** 3 * start.y + 3 * remaining ** 2 * progress * first.y + 3 * remaining * progress ** 2 * second.y + progress ** 3 * end.y;
    const tangentX = 3 * remaining ** 2 * (first.x - start.x) + 6 * remaining * progress * (second.x - first.x) + 3 * progress ** 2 * (end.x - second.x);
    const tangentY = 3 * remaining ** 2 * (first.y - start.y) + 6 * remaining * progress * (second.y - first.y) + 3 * progress ** 2 * (end.y - second.y);
    const tangentLength = Math.hypot(tangentX, tangentY) || 1;
    const offset = amplitude * Math.sin(progress * Math.PI * 4) * Math.sin(progress * Math.PI);
    points.push({ x: x - tangentY / tangentLength * offset, y: y + tangentX / tangentLength * offset });
  }

  let path = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index++) {
    const previous = points[Math.max(0, index - 1)];
    const current = points[index];
    const next = points[index + 1];
    const following = points[Math.min(points.length - 1, index + 2)];
    const firstX = current.x + (next.x - previous.x) / 6;
    const firstY = current.y + (next.y - previous.y) / 6;
    const secondX = next.x - (following.x - current.x) / 6;
    const secondY = next.y - (following.y - current.y) / 6;
    path += ` C${firstX.toFixed(1)} ${firstY.toFixed(1)} ${secondX.toFixed(1)} ${secondY.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return path;
};

export function useHeroEffects({ heroRef, stageRef, canvasRef, windows, kit, multicolor, reduced }: HeroEffectsOptions) {
  const [noInk, setNoInk] = useState(true);
  const [links, setLinks] = useState<HeroLink[]>(() => [emptyLink(), emptyLink(), emptyLink()]);
  const [compact, setCompact] = useState(false);
  const inkRef = useRef<InkFluid | null>(null);
  const preferencesRef = useRef({ kit, multicolor, reduced });
  const updatePaletteRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    preferencesRef.current = { kit, multicolor, reduced };
    updatePaletteRef.current?.();
  }, [kit, multicolor, reduced]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let frame = 0;
    let currentMode = themeMode();
    let currentMulticolor = preferencesRef.current.multicolor;
    let initialized = false;
    const initial = palette(preferencesRef.current.kit, currentMulticolor, currentMode);
    let accent = hexToRgb(initial.accent);
    let ink = hexToRgb(initial.ink);

    const writeColors = (accentColor: Rgb, inkColor: Rgb) => {
      accent = accentColor;
      ink = inkColor;
      hero.style.setProperty("--hx-accent", rgbToHex(accentColor));
      hero.style.setProperty("--hx-ink-color", rgbToHex(inkColor));
    };

    const updatePalette = () => {
      const preferences = preferencesRef.current;
      const mode = themeMode();
      const next = palette(preferences.kit, preferences.multicolor, mode);
      const themeChanged = mode !== currentMode;
      const preferenceChanged = preferences.multicolor !== currentMulticolor;
      const immediate = !initialized || preferences.reduced || themeChanged || preferenceChanged;
      const targetAccent = hexToRgb(next.accent);
      const targetInk = hexToRgb(next.ink);
      cancelAnimationFrame(frame);
      hero.dataset.heroTheme = mode;
      hero.style.setProperty("--hx-on-accent", next.onAccent);
      inkRef.current?.setMode(mode);
      inkRef.current?.setBackground(backgroundColor(hero, mode));
      inkRef.current?.setColor(next.ink, immediate);
      currentMode = mode;
      currentMulticolor = preferences.multicolor;
      initialized = true;

      if (immediate || (rgbToHex(accent) === next.accent.toLowerCase() && rgbToHex(ink) === next.ink.toLowerCase())) {
        writeColors(targetAccent, targetInk);
        return;
      }

      const fromAccent: Rgb = [...accent];
      const fromInk: Rgb = [...ink];
      const started = performance.now();
      const tween = (now: number) => {
        const progress = Math.min(1, (now - started) / 800);
        const eased = progress * progress * (3 - 2 * progress);
        writeColors(mixColor(fromAccent, targetAccent, eased), mixColor(fromInk, targetInk, eased));
        if (progress < 1) frame = requestAnimationFrame(tween);
      };
      frame = requestAnimationFrame(tween);
    };

    updatePaletteRef.current = updatePalette;
    updatePalette();
    const observer = new MutationObserver(updatePalette);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      updatePaletteRef.current = null;
      hero.style.removeProperty("--hx-accent");
      hero.style.removeProperty("--hx-ink-color");
      hero.style.removeProperty("--hx-on-accent");
    };
  }, [heroRef]);

  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    if (!hero || !stage) return;
    let frame = 0;
    let active = true;
    let compactLayout = false;
    let geometryKey = "";
    const stackedQuery = matchMedia("(max-width: 1100px)");
    const mobileQuery = matchMedia("(max-width: 640px)");

    const schedule = () => {
      if (active && !frame) frame = requestAnimationFrame(measure);
    };

    const measure = () => {
      frame = 0;
      if (!active) return;
      const unit = Number.parseFloat(getComputedStyle(hero).getPropertyValue("--hero-unit")) || 1;
      const stacked = stackedQuery.matches;
      const mobile = mobileQuery.matches;
      const nextCompact = !stacked && stage.clientHeight / unit < 820;
      if (compactLayout !== nextCompact) {
        compactLayout = nextCompact;
        setCompact(nextCompact);
        schedule();
        return;
      }

      const boxes = windows.map((windowRef): Box | null => {
        const card = windowRef.current;
        if (!card?.offsetParent || !card.offsetWidth || !card.offsetHeight) return null;
        return { x: card.offsetLeft, y: card.offsetTop, width: card.offsetWidth, height: card.offsetHeight };
      });
      const nextKey = [stage.clientWidth, stage.clientHeight, unit.toFixed(3), stacked, mobile, ...boxes.map((box) => box ? `${box.x},${box.y},${box.width},${box.height}` : "-")].join("|");
      if (geometryKey === nextKey) return;
      geometryKey = nextKey;
      const specs: [number, Side, number, number, Side, number][] = stacked
        ? [[0, "bottom", 0.72, 1, "top", 0.28], [1, "bottom", 0.28, 2, "top", 0.72], [2, "bottom", 0.72, 3, "top", 0.3]]
        : [[0, "right", 0.5, 1, "top", 0.4], [1, "left", 0.55, 2, "top", 0.62], [2, "bottom", 0.5, 3, "left", 0.84]];
      setLinks(specs.map(([startIndex, startSide, startFraction, endIndex, endSide, endFraction]) => {
        const first = boxes[startIndex];
        const second = boxes[endIndex];
        if (mobile || !first || !second) return emptyLink();
        const start = anchor(first, startSide, startFraction);
        const end = anchor(second, endSide, endFraction);
        return { path: wavyPath(start, end, unit), start: { x: start.x, y: start.y }, end: { x: end.x, y: end.y }, hidden: false };
      }));
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(hero);
    observer.observe(stage);
    windows.forEach((windowRef) => {
      if (windowRef.current) observer.observe(windowRef.current);
    });
    window.addEventListener("resize", schedule);
    stackedQuery.addEventListener("change", schedule);
    mobileQuery.addEventListener("change", schedule);
    document.fonts.addEventListener("loadingdone", schedule);
    void document.fonts.ready.then(schedule);
    schedule();

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      stackedQuery.removeEventListener("change", schedule);
      mobileQuery.removeEventListener("change", schedule);
      document.fonts.removeEventListener("loadingdone", schedule);
    };
  }, [heroRef, stageRef, windows]);

  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!hero || !stage || !canvas || reduced) return;
    let active = true;
    let idle = 0;
    let timeout = 0;
    let instance: InkFluid | null = null;

    const initialize = async () => {
      try {
        const { InkFluid: Fluid } = await import("./ink-fluid");
        if (!active) return;
        instance = new Fluid(canvas, stage);
        if (!instance.ok) {
          instance.destroy();
          instance = null;
          setNoInk(true);
          return;
        }
        const preferences = preferencesRef.current;
        const mode = themeMode();
        const colors = palette(preferences.kit, preferences.multicolor, mode);
        instance.setMode(mode);
        instance.setBackground(backgroundColor(hero, mode));
        instance.setColor(colors.ink, true);
        inkRef.current = instance;
        instance.start();
        setNoInk(false);
      } catch {
        if (inkRef.current === instance) inkRef.current = null;
        instance?.destroy();
        instance = null;
        if (active) setNoInk(true);
      }
    };

    const frame = requestAnimationFrame(() => {
      setNoInk(true);
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(() => void initialize(), { timeout: 1200 });
      else timeout = window.setTimeout(() => void initialize(), 50);
    });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      if (idle) window.cancelIdleCallback(idle);
      clearTimeout(timeout);
      if (inkRef.current === instance) inkRef.current = null;
      instance?.destroy();
    };
  }, [heroRef, stageRef, canvasRef, reduced]);

  return { noInk: reduced || noInk, links, compact };
}
