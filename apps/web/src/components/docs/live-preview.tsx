"use client";

import { useEffect, useId, useState } from "react";
import {
  ButtonExample,
  ChartFrame,
  ChartFramePlot,
  ChartFramePoint,
  useContainerSize,
  useReducedMotion,
  getDesignAccentStyle,
  type DesignAccent,
  type ChartFrameRow,
} from "@ai-library/ui-foundation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SparklineDemo, type SparklineDay, type SparklineDemoState } from "../../../../../kits/ui/components/sparkline/sparkline.demo";
import type { SparklineVariant } from "@ai-library/sparkline";
import { ConfidenceBadgeDemo, type ConfidenceInvoiceField } from "../../../../../kits/ui/components/confidence-badge/confidence-badge.demo";
import { DiffViewerDemo, type DiffViewerDemoProps } from "../../../../../kits/ui/components/diff-viewer/diff-viewer.demo";
import { DiffViewerExamples, type DiffViewerStory } from "../../../../../kits/ui/components/diff-viewer/diff-viewer.examples";

import type { DocsSlug } from "./content";
import styles from "./live-preview.module.css";

export type DemoState = "default" | "loading" | "error" | "empty" | "partial";
type MotionPreference = "system" | "reduce" | "full";

export function LivePreview({ item, chartRows, leadDays = [], failures, confidenceRows = [], confidenceUpdatedRows, diffScene }: { item: DocsSlug; chartRows: readonly ChartFrameRow[]; leadDays?: readonly SparklineDay[]; failures?: readonly number[]; confidenceRows?: readonly ConfidenceInvoiceField[]; confidenceUpdatedRows?: readonly ConfidenceInvoiceField[]; diffScene?: DiffViewerDemoProps }) {
  const id = useId();
  const designed = item === "sparkline" || item === "confidence-badge" || item === "diff-viewer";
  const [width, setWidth] = useState("fit");
  const [motion, setMotion] = useState<MotionPreference>("system");
  const [demoState, setDemoState] = useState<DemoState>("default");
  const [sparklineState, setSparklineState] = useState<SparklineDemoState>("normal");
  const [sparklineVariant, setSparklineVariant] = useState<SparklineVariant>("line");
  const [designAccent, setDesignAccent] = useState<DesignAccent>("mono");
  const [diffStory, setDiffStory] = useState<"board" | DiffViewerStory>("board");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const html = document.documentElement;
    const previous = html.getAttribute("data-reduced-motion");
    if (motion === "system") html.removeAttribute("data-reduced-motion");
    else html.setAttribute("data-reduced-motion", motion === "reduce" ? "true" : "false");
    return () => {
      if (previous === null) html.removeAttribute("data-reduced-motion");
      else html.setAttribute("data-reduced-motion", previous);
    };
  }, [motion]);

  return (
    <section className={styles.preview} aria-label="Live preview">
      <h2 className={styles.previewTitle}>Interactive component preview</h2>
      <div className={styles.toolbar}>
        <div className={styles.previewIntro}>
          <p className={styles.previewHeading}>Live preview</p>
          <p className={styles.previewLabel}>Adjust the settings to explore the component.</p>
        </div>
        <div className={styles.controls}>
          <ThemeToggle variant="select" className={styles.control} />
          <PreviewSelect
            id={`${id}-motion`}
            label="Motion preference"
            value={motion}
            onValueChange={(value) => setMotion(value as MotionPreference)}
            options={[
              { value: "system", label: "System" },
              { value: "reduce", label: "Reduced" },
              { value: "full", label: "Full" },
            ]}
          />
          <PreviewSelect
            id={`${id}-width`}
            label="Preview width"
            value={width}
            onValueChange={setWidth}
            options={[
              { value: "fit", label: "Fit to page" },
              { value: "320", label: "Small phone · 320 px" },
              ...(designed ? [
                { value: "324", label: "Phone · 324 px" },
                { value: "712", label: "Tablet · 712 px" },
              ] : []),
              { value: "768", label: "Tablet · 768 px" },
              ...(designed ? [{ value: "910", label: "Desktop · 910 px" }] : []),
              { value: "1280", label: "Wide · 1280 px" },
            ]}
          />
          {item === "chart-frame" && (
            <PreviewSelect
              id={`${id}-state`}
              label="Demo state"
              value={demoState}
              onValueChange={(value) => setDemoState(value as DemoState)}
              options={[
                { value: "default", label: "Default" },
                { value: "loading", label: "Loading" },
                { value: "error", label: "Error" },
                { value: "empty", label: "Empty" },
                { value: "partial", label: "Partial" },
              ]}
            />
          )}
          {designed &&
            <PreviewSelect
              id={`${id}-accent`}
              label="Component accent"
              value={designAccent}
              onValueChange={(value) => setDesignAccent(value as DesignAccent)}
              options={[
                { value: "mono", label: "Mono" },
                { value: "violet", label: "Violet" },
                { value: "indigo", label: "Indigo" },
                { value: "blue", label: "Blue" },
                { value: "teal", label: "Teal" },
                { value: "amber", label: "Amber" },
                { value: "orange", label: "Orange" },
                { value: "rose", label: "Rose" },
                { value: "#125744", label: "Custom · #125744" },
              ]}
            />
          }
          {item === "sparkline" && <>
            <PreviewSelect
              id={`${id}-variant`}
              label="Sparkline variant"
              value={sparklineVariant}
              onValueChange={(value) => setSparklineVariant(value as SparklineVariant)}
              options={[
                { value: "line", label: "Line" },
                { value: "area", label: "Area" },
                { value: "bar", label: "Bar" },
              ]}
            />
            <PreviewSelect
              id={`${id}-sparkline-state`}
              label="Demo state"
              value={sparklineState}
              onValueChange={(value) => setSparklineState(value as SparklineDemoState)}
              options={[
                { value: "normal", label: "Normal" },
                { value: "flat", label: "Flat" },
                { value: "empty", label: "Empty" },
                { value: "partial", label: "Partial" },
                { value: "single", label: "Single point" },
                { value: "negative", label: "Negative deviation" },
                { value: "loading", label: "Loading" },
                { value: "error", label: "Error" },
              ]}
            />
          </>}
          {item === "diff-viewer" && <PreviewSelect
            id={`${id}-diff-story`}
            label="Diff example"
            value={diffStory}
            onValueChange={(value) => setDiffStory(value as "board" | DiffViewerStory)}
            options={[
              { value: "board", label: "Review board" },
              { value: "empty", label: "No changes" },
              { value: "large", label: "Large diff · 5,000 lines" },
              { value: "json", label: "JSON changes" },
              { value: "code", label: "Code changes" },
              { value: "interactive", label: "Async decisions" },
            ]}
          />}
        </div>
      </div>
      <div className={styles.viewport} tabIndex={0} role="region" aria-label="Scrollable preview canvas">
        <div className={styles.canvas} data-testid="live-preview" data-width={width} data-item={item} data-ui-design={designed ? "" : undefined} style={designed ? getDesignAccentStyle(designAccent) : undefined} data-motion-reduced={String(reducedMotion)}>
          {item === "ui-foundation" && <FoundationDemo />}
          {item === "button-example" && <ButtonDemo />}
          {item === "chart-frame" && <ChartDemo rows={chartRows} state={demoState} />}
          {item === "sparkline" && <SparklineDemo days={leadDays} failures={failures} state={sparklineState} variant={sparklineVariant} accent={designAccent} />}
          {item === "confidence-badge" && <ConfidenceBadgeDemo rows={confidenceRows} updatedRows={confidenceUpdatedRows} accent={designAccent} />}
          {item === "diff-viewer" && diffScene && (diffStory === "board"
            ? <DiffViewerDemo {...diffScene} accent={designAccent} />
            : <DiffViewerExamples story={diffStory} reply={diffScene.reply} crm={diffScene.crm} accent={designAccent} />)}
        </div>
      </div>
      <div className={styles.caption}>
        <span>{item === "chart-frame" ? "Fieldline · F2 deterministic deal records" : designed ? "Doom Studio · Synthetic design scenario · UTC" : "React + shadcn · Shared semantic tokens"}</span>
        <span>{width === "fit" ? "Fit to page" : `${width} px container`} · {reducedMotion ? "Reduced motion" : "Full motion"}</span>
      </div>
    </section>
  );
}

function PreviewSelect({ id, label, value, onValueChange, options }: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className={styles.control} htmlFor={id}>
      <span>{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} aria-label={label} data-value={value}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}

function FoundationDemo() {
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const tokens = [
    { label: "Primary", token: "--primary" },
    { label: "Muted", token: "--muted" },
    { label: "Background", token: "--background" },
    { label: "Success", token: "--success" },
    { label: "Warning", token: "--warning" },
    { label: "Info", token: "--info" },
  ];

  return (
    <div className={styles.sample} ref={ref}>
      <div>
        <p className={styles.sampleLabel}>One theme, every surface</p>
        <p className={styles.sampleDescription}>Colors follow the root theme. Status labels remain readable without color.</p>
      </div>
      <div className={styles.palette}>
        {tokens.map(({ label, token }) => (
          <div className={styles.swatch} key={token}>
            <div className={styles.swatchColor} style={{ background: `var(${token})` }} aria-hidden="true" />
            <div className={styles.swatchText}>{label}</div>
          </div>
        ))}
      </div>
      <div className={styles.sampleRow}>
        <Button type="button" className="min-h-11">Primary</Button>
        <Button type="button" variant="outline" className="min-h-11">Outline</Button>
        <Button type="button" disabled className="min-h-11">Disabled</Button>
      </div>
      <dl className={styles.metrics}>
        <div><dt>Measured content</dt><dd>{Math.round(width)} px</dd></div>
        <div><dt>Motion</dt><dd data-reduced-motion={String(reducedMotion)}>{reducedMotion ? "Reduced" : "Full"}</dd></div>
      </dl>
    </div>
  );
}

function ButtonDemo() {
  const [controlled, setControlled] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const failureId = useId();

  return (
    <div className={styles.sample}>
      <div className={styles.sampleGroup} role="group" aria-label="Uncontrolled button example">
        <p className={styles.sampleLabel}>Uncontrolled · async update</p>
        <p className={styles.sampleDescription}>Save a local preference. The simulated action completes after 3 seconds.</p>
        <ButtonExample onAction={async () => {
          await new Promise<void>((resolve) => setTimeout(resolve, 3_000));
          if (simulateFailure) throw new Error("Simulated preference update failure");
        }} />
        <label className={styles.failureControl} htmlFor={failureId}>
          <input id={failureId} type="checkbox" checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} />
          Simulate failure
        </label>
      </div>
      <div className={styles.sampleGroup} role="group" aria-label="Controlled button example">
        <p className={styles.sampleLabel}>Controlled · parent owns the value</p>
        <ButtonExample value={controlled} onValueChange={setControlled}
          labels={{ off: "Enable daily digest", on: "Daily digest enabled" }} />
        <p className={styles.sampleDescription}>Parent value: {controlled ? "on" : "off"}</p>
      </div>
      <div className={styles.sampleGroup} role="group" aria-label="Disabled button example">
        <p className={styles.sampleLabel}>Disabled</p>
        <ButtonExample disabled labels={{ off: "Notifications unavailable" }} />
      </div>
    </div>
  );
}

function ChartDemo({ rows, state }: { rows: readonly ChartFrameRow[]; state: DemoState }) {
  const visibleRows = state === "partial" ? rows.slice(0, 3) : state === "empty" ? [] : rows;
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const chartState = state === "default" || state === "partial" ? "ready" : state;
  const summary = state === "partial"
    ? `Partial view: the first three pipeline stages. The full deterministic Fieldline dataset contains ${total} deals across seven stages.`
    : `${total} deals across seven stages in the deterministic Fieldline dataset. Each bar shows the number of deals in that stage.`;
  const max = Math.max(1, ...visibleRows.map((row) => row.value));

  return (
    <ChartFrame title="Fieldline deal stages" summary={summary} rows={visibleRows} state={chartState}>
      {({ rows: plotRows, formatValue }) => (
        <ChartFramePlot className={styles.bars}>
          {plotRows.map((row, index) => (
            <ChartFramePoint key={row.id} index={index} className={styles.barPoint}>
              <span>{row.label}</span>
              <span className={styles.bar} style={{ width: `${(row.value / max) * 100}%` }} aria-hidden="true" />
              <span className={styles.barValue}>{formatValue(row.value)}</span>
            </ChartFramePoint>
          ))}
        </ChartFramePlot>
      )}
    </ChartFrame>
  );
}
