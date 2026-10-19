"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "../../../packages/ui-foundation/src/hooks/use-reduced-motion";
import { getDesignAccentStyle, type DesignAccent } from "../../../packages/ui-foundation/src/design-accent";

import { Sparkline, type SparklineVariant } from "./sparkline";
import "./sparkline.demo.css";

export interface SparklineDay { date: string; label: string; value: number }
export type SparklineDemoState = "normal" | "flat" | "empty" | "partial" | "single" | "negative" | "loading" | "error";

const defaultFailures = [8, 6, 9, 5, 7, 4, 6, 9, 11, 8, 7, 10, 6, 7] as const;
const number = new Intl.NumberFormat("en-US");
const dateLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const pointChanges = [3, -2, 6, -1, 4, -3, 5] as const;
const failureChanges = [-1, 2, -2, 1, 0] as const;
const cardNames = ["Line with last point", "Area", "Bars", "Min and max"] as const;
const cardKeys = ["line", "area", "bar", "minmax"] as const;
interface Timeline { days: readonly SparklineDay[]; failures: readonly number[]; step: number }
function initialTimeline(days: readonly SparklineDay[], failures: readonly number[]): Timeline {
  const offset = Math.max(0, days.length - 14);
  return { days: days.slice(offset), failures: days.slice(offset).map((_, index) => failures[offset + index] ?? defaultFailures[index % defaultFailures.length]!), step: 0 };
}
function subscribeVisibility(change: () => void) {
  document.addEventListener("visibilitychange", change);
  return () => document.removeEventListener("visibilitychange", change);
}
function subscribeHash(change: () => void) {
  window.addEventListener("hashchange", change);
  return () => window.removeEventListener("hashchange", change);
}
const clientVisible = () => document.visibilityState === "visible";
const noAutoplay = () => window.location.hash === "#noauto";
const serverFalse = () => false;

/** Synthetic scene data arrives from the server; the reusable SVG never runs a timer. */
export function SparklineDemo({ days, failures = defaultFailures, state = "normal", variant = "line", accent = "mono" }: {
  days: readonly SparklineDay[]; failures?: readonly number[]; state?: SparklineDemoState; variant?: SparklineVariant; accent?: DesignAccent;
}) {
  const [source, setSource] = useState(() => ({ days, failures, timeline: initialTimeline(days, failures) }));
  // Parent replacements apply during rendering, so charts and the table never show an old prop frame.
  if (source.days !== days || source.failures !== failures) setSource({ days, failures, timeline: initialTimeline(days, failures) });
  const timeline = source.timeline;
  const [tableOpen, setTableOpen] = useState(false);
  const [manualPause, setManualPause] = useState<boolean | null>(null);
  const [idle, setIdle] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [cursor, setCursor] = useState<{ card: number; index: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const announcementCount = useRef(0);
  const visible = useSyncExternalStore(subscribeVisibility, clientVisible, serverFalse);
  const noAuto = useSyncExternalStore(subscribeHash, noAutoplay, serverFalse);
  const paused = manualPause ?? noAuto;
  const reduced = useReducedMotion();
  const idleTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rootRef = useRef<HTMLElement>(null);
  const tableId = useId();
  const instructionsId = useId();
  const readoutId = useId();

  const noteInput = useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimeout.current);
    idleTimeout.current = setTimeout(() => setIdle(true), 6000);
  }, []);
  useEffect(() => {
    document.addEventListener("pointerdown", noteInput);
    document.addEventListener("keydown", noteInput);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false));
    if (rootRef.current && observer) observer.observe(rootRef.current);
    return () => {
      document.removeEventListener("pointerdown", noteInput);
      document.removeEventListener("keydown", noteInput);
      observer?.disconnect();
      clearTimeout(idleTimeout.current);
    };
  }, [noteInput]);

  const append = useCallback((manual = false) => {
    setSource((previous) => {
      const { timeline: current } = previous;
      const lastDay = current.days.at(-1);
      if (!lastDay) return previous;
      const value = Math.max(0, lastDay.value + pointChanges[current.step % pointChanges.length]!);
      const failed = Math.min(13, Math.max(1, (current.failures.at(-1) ?? 7) + failureChanges[current.step % failureChanges.length]!));
      const date = new Date(`${lastDay.date}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + 1);
      const next = { date: date.toISOString().slice(0, 10), label: dateLabel.format(date), value };
      return { ...previous, timeline: { days: [...current.days, next].slice(-14), failures: [...current.failures, failed].slice(-14), step: current.step + 1 } };
    });
    setCursor(null);
    // Only explicit input announces a change; idle animation never speaks every two seconds.
    if (manual) setAnnouncement(`Added data point ${++announcementCount.current}. The latest values and data table have been updated.`);
  }, []);
  const live = !paused && !reduced && idle && !hovered && !focused && visible && inView && state === "normal" && timeline.days.length > 0;
  useEffect(() => {
    if (!live) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => { append(); interval = setInterval(() => append(), 2000); }, 1800);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [live, append]);

  const values = timeline.days.map((day) => day.value);
  const last = values.at(-1) ?? 0;
  const selected = state === "empty" ? [] : state === "flat" ? values.map(() => values[0] ?? 0)
    : state === "single" ? values.slice(-1) : state === "negative" ? values.map((value) => value - last)
      : state === "partial" ? values.map((value, index) => index === 2 ? Number.NaN : value) : values;
  const failureValues = state === "empty" ? [] : state === "single" ? timeline.failures.slice(-1) : timeline.failures;
  const first = selected.find(Number.isFinite) ?? 0;
  const chartLast = selected.filter(Number.isFinite).at(-1) ?? 0;
  const change = first ? (chartLast - first) / first * 100 : 0;
  const available = state !== "loading" && state !== "error";
  const tableDays = state === "empty" ? [] : state === "single" ? timeline.days.slice(-1) : timeline.days;
  const descriptions: Record<SparklineDemoState, string> = {
    normal: "Doom Studio design scenario: fourteen synthetic daily signup counts and failed-run counts. Live points are deterministic demo updates, not production activity.",
    flat: "Demonstration: every selected day has the same signup count. A constant series stays centered.",
    empty: "No selected days. Each graphic reserves its dimensions and announces that data is unavailable.",
    partial: "Demonstration: one signup count is unavailable. The line connects the remaining finite samples; it does not mark a missing day as zero.",
    single: "Only the latest daily signup count is selected. One sample is presented as a flat trend.",
    negative: `Derived example: daily signups minus the latest day’s ${number.format(last)} signups. These are deviations, not negative signup counts.`,
    loading: "Application loading boundary: space remains reserved while the parent prepares daily counts.",
    error: "Application error boundary: the parent reports a failed load without displaying stale counts as a success.",
  };
  function inspectKey(event: KeyboardEvent<HTMLDivElement>, card: number, data: readonly number[]) {
    if (!available || !data.length) return;
    const index = cursor?.card === card ? Math.min(cursor.index, data.length - 1) : data.length - 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? data.length - 1
      : event.key === "ArrowLeft" ? Math.max(0, index - 1) : event.key === "ArrowRight" ? Math.min(data.length - 1, index + 1) : null;
    if (event.key === "Escape") { setCursor(null); return; }
    if (next === null) return;
    event.preventDefault(); noteInput(); setCursor({ card, index: next });
  }
  function inspectPointer(event: PointerEvent<HTMLDivElement>, card: number, data: readonly number[]) {
    noteInput();
    if (!available || !data.length) return;
    const bounds = event.currentTarget.querySelector("svg")?.getBoundingClientRect();
    if (!bounds?.width) return;
    const fraction = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    setCursor({ card, index: Math.round(fraction * (data.length - 1)) });
  }
  function readout(card: number, data: readonly number[]) {
    if (!available) return "Unavailable";
    if (!data.length) return "No data";
    if (cursor?.card === card && cursor.index < data.length) {
      const value = data[cursor.index];
      const label = state === "single" ? timeline.days.at(-1)?.label : timeline.days[cursor.index]?.label;
      return `${Number.isFinite(value) ? number.format(value!) : "Unavailable"} · ${label ?? `day ${cursor.index + 1}`}`;
    }
    if (card === 1 && state !== "negative") return `${change >= 0 ? "+" : ""}${change.toFixed(0)}% in ${data.length} ${data.length === 1 ? "day" : "days"}`;
    if (card === 3) return `min ${number.format(Math.min(...data))} · max ${number.format(Math.max(...data))}`;
    return `${number.format(data.at(-1)!)} ${card === 2 ? "latest" : "today"}`;
  }
  function marker(card: number, data: readonly number[], currentVariant: SparklineVariant): CSSProperties | undefined {
    if (cursor?.card !== card || !Number.isFinite(data[cursor.index])) return;
    const finite = data.filter(Number.isFinite);
    const index = data.slice(0, cursor.index).filter(Number.isFinite).length;
    const low = currentVariant === "bar" ? Math.min(0, ...finite) : Math.min(...finite);
    const high = currentVariant === "bar" ? Math.max(0, ...finite) : Math.max(...finite);
    const y = high === low ? 20 : 36 - (data[cursor.index]! - low) / (high - low) * 32;
    const x = currentVariant === "bar" ? 4 + (index + 0.5) / finite.length * 152 : finite.length > 1 ? 4 + index / (finite.length - 1) * 152 : 80;
    return { left: `${x / 160 * 100}%`, top: y };
  }

  return (
    <section ref={rootRef} data-ui-design style={getDesignAccentStyle(accent)} className="ail-sp-demo" aria-label="Doom Studio daily signup preview"
      data-testid="sparkline-demo" data-demo-state={state} data-variant={variant} data-autoplay={live ? "playing" : "paused"}
      onPointerEnter={() => setHovered(true)} onPointerLeave={() => { setHovered(false); setCursor(null); noteInput(); }}
      onFocusCapture={() => { setFocused(true); noteInput(); }} onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); setCursor(null); noteInput(); }
      }}>
      <div data-testid="sparkline-scene">
        <div className="ail-sp-demo-top">
          <Button type="button" variant="ghost" size="sm" className="ail-sp-demo-live" data-live={live}
            data-testid="sparkline-pause" aria-label={paused ? "Resume live preview" : "Pause live preview"} aria-pressed={paused}
            title={paused ? "Resume live preview" : "Pause live preview"} onClick={() => setManualPause(!paused)}>
            <svg viewBox="0 0 12 12" aria-hidden="true" className="ail-sp-demo-live-icon">
              {paused ? <path d="M3 1.5v9L10 6Z" fill="currentColor" /> : <path d="M3 2v8M8 2v8" fill="none" stroke="currentColor" strokeWidth="2" />}
            </svg>
            <span>{live ? "Live · new point every 2s" : paused ? "Paused · resume preview" : "Paused while you look"}</span>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="ail-sp-demo-add" data-testid="sparkline-add"
            disabled={!available || state !== "normal" || !timeline.days.length} onClick={() => { noteInput(); append(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            <span>Add a data point</span>
          </Button>
          <span className="ail-sp-demo-hint">Hover a chart to read a value</span>
        </div>
        <p className="ail-sp-demo-sr" id={instructionsId}>Use Left and Right arrows, Home and End to inspect daily values. Escape restores the latest summary. The exact values are also available in the data table.</p>
        <div className="ail-sp-demo-grid" data-slot="sparkline-demo-grid" role="group" aria-label="Sparkline variants">
          {cardKeys.map((key, card) => {
            const data = card === 3 ? failureValues : selected;
            const cardVariant: SparklineVariant = card === 0 ? variant : card === 1 ? "area" : card === 2 ? "bar" : "line";
            const pointStyle = marker(card, data, cardVariant);
            return (
              <div key={key} className="ail-sp-demo-card" data-testid={`sparkline-card-${key}`} data-slot="sparkline-demo-card"
                role="group" tabIndex={available && data.length ? 0 : undefined} aria-label={cardNames[card]} aria-describedby={`${instructionsId} ${readoutId}-${key}`}
                onPointerMove={(event) => inspectPointer(event, card, data)} onPointerLeave={() => setCursor(null)}
                onKeyDown={(event) => inspectKey(event, card, data)} onBlur={() => setCursor(null)}>
                <span className="ail-sp-demo-caption">{card === 0 && variant !== "line" ? `${variant} with last point` : cardNames[card]}</span>
                <div className="ail-sp-demo-chart" data-testid={card === 0 ? "sparkline-current-boundary" : undefined}>
                  {available ? <Sparkline data={data} variant={cardVariant} showLast={card === 0} showMinMax={card === 3}
                    className={card === 3 ? "ail-sp-demo-fail" : undefined}
                    data-testid={card === 0 ? "sparkline-current" : `sparkline-${key}`} />
                    : <div className="ail-sp-demo-boundary" role={card === 0 ? state === "error" ? "alert" : "status" : undefined}
                      aria-busy={state === "loading" ? true : undefined}>{state === "loading" ? "Loading lead volume…" : "Lead volume could not be loaded."}</div>}
                  {pointStyle && <i className={`ail-sp-demo-dot${card === 3 ? " ail-sp-demo-fail" : ""}`} style={pointStyle} aria-hidden="true" />}
                </div>
                <span id={`${readoutId}-${key}`} data-testid={`sparkline-readout-${key}`} aria-live={cursor?.card === card ? "polite" : "off"} className={`ail-sp-demo-value${card === 1 && state === "normal" && cursor?.card !== card ? change >= 0 ? " ail-sp-demo-up" : " ail-sp-demo-down" : ""}`}>{readout(card, data)}</span>
              </div>
            );
          })}
        </div>
        <p className="ail-sp-demo-inline">Signups this week <Sparkline data={available ? selected : []} className="ail-sp-demo-inline-chart" /> <b>{available ? number.format(selected.slice(-7).filter(Number.isFinite).reduce((sum, value) => sum + value, 0)) : "Unavailable"}</b> and failed runs <Sparkline data={available ? failureValues : []} className="ail-sp-demo-inline-chart ail-sp-demo-danger" /> <b>{available ? number.format(failureValues.slice(-7).reduce((sum, value) => sum + value, 0)) : "Unavailable"}</b>, both inline with text.</p>
      </div>
      <p className="ail-sp-demo-description" data-testid="sparkline-state-description">{descriptions[state]}</p>
      <div className="ail-sp-demo-disclosure">
        <Button type="button" variant="outline" aria-expanded={tableOpen} aria-controls={tableId}
          onClick={() => setTableOpen((open) => !open)}>{tableOpen ? "Hide lead volume data" : "Show lead volume data"}</Button>
        {tableOpen && <div className="ail-sp-demo-table-wrap" id={tableId}>
          <table aria-label="Selected lead volume data">
            <caption>Selected preview values · {state === "negative" ? "deviation from the latest day" : "daily signups"}</caption>
            <thead><tr><th scope="col">UTC date</th><th scope="col">{state === "negative" ? "Signup deviation" : "Signups"}</th><th scope="col">Failed runs</th></tr></thead>
            <tbody>{tableDays.length ? tableDays.map((day, index) => <tr key={day.date}><th scope="row">{day.date}</th>
              <td>{!available || !Number.isFinite(selected[index]) ? "Unavailable" : number.format(selected[index]!)}</td>
              <td>{available ? number.format(failureValues[index] ?? 0) : "Unavailable"}</td>
            </tr>) : <tr><td colSpan={3}>No selected days.</td></tr>}</tbody>
          </table>
        </div>}
      </div>
      <p className="ail-sp-demo-sr" role="status" aria-live="polite">{announcement}</p>
      <noscript><table aria-label="Lead volume data without JavaScript">
        <caption>Doom Studio synthetic daily signups · UTC</caption>
        <thead><tr><th scope="col">UTC date</th><th scope="col">Signups</th><th scope="col">Failed runs</th></tr></thead>
        <tbody>{days.map((day, index) => <tr key={day.date}><th scope="row">{day.date}</th><td>{number.format(day.value)}</td><td>{number.format(failures[index] ?? 0)}</td></tr>)}</tbody>
      </table></noscript>
    </section>
  );
}
