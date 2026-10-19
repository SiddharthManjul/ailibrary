"use client";

import { cn } from "cn";
import type { ComponentProps } from "react";
import "./sparkline.css";

export interface SparklineSummary {
  /** The localized up, down or flat label. */
  trend: string;
  min: string;
  max: string;
  last: string;
  count: number;
  omitted: number;
}

export interface SparklineLabels {
  empty: string;
  up: string;
  down: string;
  flat: string;
  summary: (values: SparklineSummary) => string;
}

export type SparklineVariant = "line" | "area" | "bar";

export interface SparklineProps extends Omit<ComponentProps<"svg">, "children" | "data"> {
  data: readonly number[];
  variant?: SparklineVariant;
  showLast?: boolean;
  showMinMax?: boolean;
  locale?: string;
  labels?: Partial<SparklineLabels>;
}

const defaults: SparklineLabels = {
  empty: "No trend data.",
  up: "Upward",
  down: "Downward",
  flat: "Flat",
  summary: ({ trend, min, max, last, omitted }) =>
    `${trend} trend. Minimum ${min}, maximum ${max}, last ${last}.${omitted ? " Unavailable values omitted." : ""}`,
};

// Reuse Intl's relatively expensive formatter across table cells, with bounded memory.
const formatters = new Map<string, Intl.NumberFormat>();
function formatter(locale: string) {
  let value = formatters.get(locale);
  if (!value) {
    value = new Intl.NumberFormat(locale);
    if (formatters.size === 8) formatters.delete(formatters.keys().next().value!);
    formatters.set(locale, value);
  }
  return value;
}

const coordinate = (value: number) => Math.round(value * 100) / 100;

/** A passive, container-sized SVG trend. Supply exact values alongside the chart. */
export function Sparkline({
  data, variant = "line", width = "100%", height = 40,
  showLast = false, showMinMax = false, locale = "en-US",
  labels: customLabels, className, "aria-label": accessibleName, ...props
}: SparklineProps) {
  const values: number[] = [];
  let min = Infinity;
  let max = -Infinity;
  let minIndex = 0;
  let maxIndex = 0;
  for (const value of data) {
    if (!Number.isFinite(value)) continue;
    if (value < min) { min = value; minIndex = values.length; }
    if (value > max) { max = value; maxIndex = values.length; }
    values.push(value);
  }
  const count = values.length;
  const last = values[count - 1] ?? 0;
  const first = values[0] ?? last;
  const omitted = data.length - count;
  const labels = { ...defaults, ...customLabels };
  const trend = last > first ? "up" : last < first ? "down" : "flat";
  let summary = labels.empty;
  if (count) {
    const format = formatter(locale);
    summary = labels.summary({
      trend: labels[trend], min: format.format(min), max: format.format(max),
      last: format.format(last), count, omitted,
    });
  }

  // Scale before subtracting: [-MAX_VALUE, MAX_VALUE] otherwise overflows.
  const low = variant === "bar" ? Math.min(0, min) : min;
  const high = variant === "bar" ? Math.max(0, max) : max;
  const scale = Math.max(Math.abs(low), Math.abs(high)) || 1;
  const start = low / scale;
  const span = high / scale - start;
  const y = (value: number) => coordinate(span ? 36 - ((value / scale - start) / span) * 32 : 20);
  const x = (index: number) => coordinate(variant === "bar" ? 4 + ((index + 0.5) / count) * 152 : count > 1 ? 4 + (index / (count - 1)) * 152 : 80);
  let line = count ? `M${x(0)},${y(first)}` : "";
  if (variant !== "bar") for (let index = 1; index < count; index++) {
    const middle = coordinate((x(index - 1) + x(index)) / 2);
    line += `C${middle},${y(values[index - 1]!)} ${middle},${y(values[index]!)} ${x(index)},${y(values[index]!)}`;
  }
  if (count === 1) line += `l0,0`;
  const baseline = count ? y(0) : 20;
  const dot = (index: number, slot: string, color: string, size = 5) => (
    <path key={slot} data-slot={slot} d={`M${x(index)},${y(values[index]!)}l0,0`}
      fill="none" stroke={color} strokeWidth={size} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
  );

  return (
    <svg {...props} role="img" aria-label={accessibleName ?? summary} focusable="false"
      width={width} height={height} viewBox="0 0 160 40" preserveAspectRatio="none"
      data-slot="sparkline" data-state={!count ? "empty" : omitted ? "partial" : min === max ? "flat" : "normal"}
      data-variant={variant} data-trend={trend} className={cn("ail-sparkline", className)}>
      {!count ? <path data-slot="sparkline-empty" d="M4,20H156" fill="none" stroke="var(--border)" vectorEffect="non-scaling-stroke" /> : (
        <>
          {variant === "bar" ? values.map((value, index) => {
            const top = y(value);
            const step = 152 / count;
            return <rect key={index} data-slot="sparkline-bar" x={coordinate(4 + (index + 0.15) * step)}
              y={Math.min(top, baseline)} width={coordinate(step * 0.7)} height={Math.max(0.5, coordinate(Math.abs(top - baseline)))} rx={2}
              fill={index === count - 1 ? "currentColor" : "var(--border-strong,var(--border))"} />;
          }) : <>
            {variant === "area" && <path data-slot="sparkline-area" d={`${line}L${x(count - 1)},40L${x(0)},40Z`} fill="var(--primary-soft,var(--muted))" />}
            <path data-slot="sparkline-line" d={line} fill="none" stroke="currentColor"
              strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </>}
          {showMinMax && dot(minIndex, "sparkline-min", "var(--destructive)")}
          {showMinMax && maxIndex !== minIndex && dot(maxIndex, "sparkline-max", "var(--success)")}
          {showLast && dot(count - 1, "sparkline-last-ring", "var(--card)", 8)}
          {showLast && dot(count - 1, "sparkline-last", "currentColor", 4)}
        </>
      )}
    </svg>
  );
}
