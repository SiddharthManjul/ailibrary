"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "cn";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ComponentProps, HTMLAttributes, ReactNode, Ref } from "react";
import { useControllableState } from "../../../packages/ui-foundation/src/hooks/use-controllable-state";
import "./confidence-badge.css";

export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";
export interface ConfidenceThresholds { high: number; medium: number }
export interface ConfidenceLabelValues {
  confidence: string;
  level: string;
  /** Localized decimal, or null for unknown. */
  value: string | null;
  /** Localized percentage, or null for unknown. */
  percentage: string | null;
}
export interface ConfidenceLabels {
  confidence: string;
  high: string;
  medium: string;
  low: string;
  unknown: string;
  scaleLabel: string;
  reasonsLabel: string;
  accessibleName: (values: ConfidenceLabelValues) => string;
  detailsTitle: (values: ConfidenceLabelValues) => string;
  scaleDescription: (values: { scaleLabel: string; medium: string; high: string; reviewThreshold: string | null }) => string;
}

interface ConfidenceDataProps {
  /** Only finite numbers within 0..1 represent a known confidence. */
  value?: number | null | undefined;
  /** Inclusive lower bounds. Must satisfy 0 <= medium < high <= 1. */
  thresholds?: ConfidenceThresholds | undefined;
  reasons?: readonly string[] | undefined;
  locale?: string | undefined;
  labels?: Partial<ConfidenceLabels> | undefined;
  /** Optional independent human-review marker; never changes the score. */
  reviewThreshold?: number | undefined;
}

export interface ConfidenceBadgeProps extends ConfidenceDataProps,
  Omit<HTMLAttributes<HTMLButtonElement | HTMLSpanElement>, "children" | "defaultValue"> {
  size?: "sm" | "md";
  showValue?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  detailsFooter?: ReactNode;
  ref?: Ref<HTMLButtonElement | HTMLSpanElement>;
}

export interface ConfidenceDetailsProps extends ConfidenceDataProps,
  Omit<ComponentProps<"div">, "children" | "defaultValue"> {
  footer?: ReactNode;
  /** Supply matching IDs when using this body to label your own dialog. */
  titleId?: string;
  reasonsId?: string;
}

const defaultThresholds: ConfidenceThresholds = { high: 0.85, medium: 0.6 };
const defaultLabels: ConfidenceLabels = {
  confidence: "Confidence", high: "High", medium: "Medium", low: "Low", unknown: "Unknown",
  scaleLabel: "Confidence scale", reasonsLabel: "Reasons",
  accessibleName: ({ confidence, level, percentage }) => `${confidence}: ${level}${percentage ? ` (${percentage})` : ""}`,
  detailsTitle: ({ confidence, level, value }) => `${level} ${confidence.toLocaleLowerCase()}${value ? ` · ${value}` : ""}`,
  scaleDescription: ({ scaleLabel, medium, high, reviewThreshold }) => `${scaleLabel}. Medium starts at ${medium}; high starts at ${high}.${reviewThreshold ? ` Human review below ${reviewThreshold}.` : ""}`,
};
const validValue = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
function resolveThresholds(thresholds?: ConfidenceThresholds): ConfidenceThresholds {
  return thresholds && validValue(thresholds.medium) && validValue(thresholds.high) && thresholds.medium < thresholds.high
    ? thresholds : defaultThresholds;
}
function resolveLabels(custom?: Partial<ConfidenceLabels>): ConfidenceLabels {
  const result = { ...defaultLabels };
  // JS consumers can supply malformed/empty labels. Never erase the level word.
  for (const key of ["confidence", "high", "medium", "low", "unknown", "scaleLabel", "reasonsLabel"] as const) {
    const value = custom?.[key];
    if (typeof value === "string" && value.trim()) result[key] = value;
  }
  if (typeof custom?.accessibleName === "function") result.accessibleName = custom.accessibleName;
  if (typeof custom?.detailsTitle === "function") result.detailsTitle = custom.detailsTitle;
  if (typeof custom?.scaleDescription === "function") result.scaleDescription = custom.scaleDescription;
  return result;
}
function confidenceData({ value, thresholds, locale = "en-US", labels: customLabels, reasons }: ConfidenceDataProps) {
  const bounds = resolveThresholds(thresholds);
  const known = validValue(value);
  const level: ConfidenceLevel = !known ? "unknown" : value >= bounds.high ? "high" : value >= bounds.medium ? "medium" : "low";
  const labels = resolveLabels(customLabels);
  const decimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const values: ConfidenceLabelValues = {
    confidence: labels.confidence, level: labels[level],
    value: known ? decimal.format(value) : null, percentage: known ? percent.format(value) : null,
  };
  const safeReasons = Array.isArray(reasons) ? reasons.filter((reason): reason is string => typeof reason === "string" && Boolean(reason.trim())) : [];
  return { known, level, labels, values, bounds, decimal, safeReasons };
}

/** A reusable details body. The owning Popover supplies dialog and focus behavior. */
export function ConfidenceDetails({
  value, thresholds, reasons, locale, labels, reviewThreshold, footer,
  titleId: suppliedTitleId, reasonsId: suppliedReasonsId, className, ...props
}: ConfidenceDetailsProps) {
  const id = useId();
  const titleId = suppliedTitleId ?? `${id}-title`;
  const reasonsId = suppliedReasonsId ?? `${id}-reasons`;
  const data = confidenceData({ value, thresholds, reasons, locale, labels });
  const ticks = [...new Set([0, data.bounds.medium, data.bounds.high, 1])];
  return (
    <div {...props} role={props.role ?? "group"} aria-labelledby={props["aria-labelledby"] ?? titleId}
      aria-describedby={props["aria-describedby"] ?? (data.safeReasons.length ? reasonsId : undefined)}
      data-slot="confidence-details" data-state={data.level} className={cn("ail-confidence-details", className)}>
      <h3 id={titleId} data-slot="confidence-details-title">{data.labels.detailsTitle(data.values)}</h3>
      <div data-slot="confidence-details-scale" className="ail-confidence-scale" role="img" aria-label={data.labels.scaleDescription({
        scaleLabel: data.labels.scaleLabel, medium: data.decimal.format(data.bounds.medium), high: data.decimal.format(data.bounds.high),
        reviewThreshold: validValue(reviewThreshold) ? data.decimal.format(reviewThreshold) : null,
      })}>
        <div aria-hidden="true" className="ail-confidence-track" style={{ gridTemplateColumns: `${data.bounds.medium}fr ${data.bounds.high - data.bounds.medium}fr ${1 - data.bounds.high}fr` }}>
          <span data-level="low" /><span data-level="medium" /><span data-level="high" />
          {data.known && <i data-slot="confidence-details-value-marker" style={{ left: `${value! * 100}%` }} />}
          {validValue(reviewThreshold) && <i data-slot="confidence-details-review-marker" style={{ left: `${reviewThreshold * 100}%` }} />}
        </div>
        <div aria-hidden="true" className="ail-confidence-ticks">{ticks.map((tick, index) => (
          <span key={index} data-slot="confidence-details-tick" style={{ left: `${tick * 100}%` }}>{new Intl.NumberFormat(locale ?? "en-US", { maximumFractionDigits: 2 }).format(tick)}</span>
        ))}</div>
      </div>
      {data.safeReasons.length > 0 && <ul id={reasonsId} data-slot="confidence-details-reasons" aria-label={data.labels.reasonsLabel}>
        {data.safeReasons.map((reason, index) => <li key={index}>{reason}</li>)}
      </ul>}
      {footer != null && <div data-slot="confidence-details-footer" className="ail-confidence-footer">{footer}</div>}
    </div>
  );
}

/** A labeled model score; reasons opt the badge into an accessible details popover. */
export function ConfidenceBadge({
  value, thresholds, reasons, locale, labels, reviewThreshold,
  size = "md", showValue = true, open: controlledOpen, defaultOpen = false, onOpenChange,
  disabled = false, detailsFooter, className, ref, "aria-label": accessibleName, ...props
}: ConfidenceBadgeProps) {
  const data = confidenceData({ value, thresholds, reasons, locale, labels });
  const [open, setOpen] = useControllableState({ value: controlledOpen, defaultValue: defaultOpen, onChange: onOpenChange });
  const [scope, setScope] = useState<{ design: boolean; accent: string | undefined }>({ design: false, accent: undefined });
  const trigger = useRef<HTMLButtonElement | null>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const reasonsId = `${id}-reasons`;
  const hasReasons = data.safeReasons.length > 0;
  const captureScope = useCallback((node: HTMLElement) => {
    const design = Boolean(node.closest("[data-ui-design]"));
    const accent = node.closest("[data-accent]")?.getAttribute("data-accent") ?? undefined;
    setScope((previous) => previous.design === design && previous.accent === accent ? previous : { design, accent });
  }, []);
  const triggerRef = useCallback((node: HTMLButtonElement | null) => {
    trigger.current = node;
    if (node) captureScope(node);
    if (typeof ref === "function") return ref(node);
    if (ref) ref.current = node;
  }, [captureScope, ref]);
  useEffect(() => {
    if (open && (!hasReasons || disabled)) setOpen(false);
  }, [open, hasReasons, disabled, setOpen]);
  function requestOpen(next: boolean) {
    if (disabled || !hasReasons) return;
    if (trigger.current) captureScope(trigger.current);
    setOpen(next);
  }
  const children = <>
    <span data-slot="confidence-badge-dot" aria-hidden="true" />
    <span data-slot="confidence-badge-label">{data.values.level}</span>
    {showValue && data.values.value && <span data-slot="confidence-badge-value" aria-hidden="true">{data.values.value}</span>}
  </>;
  const rootProps = {
    ...props, "aria-label": accessibleName ?? data.labels.accessibleName(data.values),
    "data-slot": "confidence-badge", "data-state": data.level, "data-size": size,
    "data-disabled": disabled ? "" : undefined,
    title: props.title ?? data.labels.accessibleName(data.values),
    className: cn("ail-confidence-badge", className),
  };
  if (!hasReasons) return <Badge {...rootProps} ref={ref as Ref<HTMLSpanElement>} role="img">{children}</Badge>;
  return (
    <Popover open={open && !disabled} onOpenChange={requestOpen}>
      <PopoverTrigger {...rootProps} ref={triggerRef} type="button" disabled={disabled} data-open={open && !disabled ? "open" : "closed"}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="ail-confidence-popover" align="start" sideOffset={8}
        aria-labelledby={titleId} aria-describedby={reasonsId}
        data-ui-design={scope.design ? "" : undefined} data-accent={scope.accent}>
        <ConfidenceDetails value={value} thresholds={thresholds} reasons={reasons} locale={locale} labels={labels}
          reviewThreshold={reviewThreshold} titleId={titleId} reasonsId={reasonsId} footer={detailsFooter} />
      </PopoverContent>
    </Popover>
  );
}
