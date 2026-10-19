"use client";

import { Button } from "@/components/ui/button";
import { cn } from "cn";
import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
} from "react";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useControllableState } from "./hooks/use-controllable-state";
import { useReducedMotion } from "./hooks/use-reduced-motion";

export const chartPalette = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)", "var(--chart-6)",
] as const;

export interface ChartFrameRow {
  /** Stable, unique row identifier. */
  id: string;
  label: string;
  value: number;
}

export interface ChartFrameLabels {
  showTable: string;
  hideTable: string;
  tableCaption: (title: string) => string;
  labelColumn: string;
  valueColumn: string;
  loading: string;
  empty: string;
  error: string;
  chartNavigation: string;
  point: (row: ChartFrameRow, formattedValue: string) => string;
}

export interface ChartFrameRenderContext {
  rows: readonly ChartFrameRow[];
  formatValue: (value: number) => string;
  palette: typeof chartPalette;
  activeIndex: number | null;
}

export interface ChartFrameProps extends Omit<ComponentProps<"figure">, "children" | "title"> {
  title: string;
  /** Describe the main finding; do not merely repeat the chart title. */
  summary: string;
  rows: readonly ChartFrameRow[];
  children?: ReactNode | ((context: ChartFrameRenderContext) => ReactNode);
  state?: "ready" | "loading" | "empty" | "error";
  locale?: string;
  valueFormat?: Intl.NumberFormatOptions;
  tableOpen?: boolean;
  defaultTableOpen?: boolean;
  onTableOpenChange?: (open: boolean) => void;
  labels?: Partial<ChartFrameLabels>;
}

export type ChartFrameTitleProps = ComponentProps<"h3">;
export type ChartFrameDescriptionProps = ComponentProps<"p">;
export type ChartFramePlotProps = ComponentProps<"div">;
export interface ChartFramePointProps extends ComponentProps<"button"> {
  index: number;
}
export type ChartFrameTooltipProps = ComponentProps<"div">;
export type ChartFrameTableProps = ComponentProps<"table">;

const defaultLabels: ChartFrameLabels = {
  showTable: "Show data table",
  hideTable: "Hide data table",
  tableCaption: (title) => `${title} — data table`,
  labelColumn: "Label",
  valueColumn: "Value",
  loading: "Loading chart data…",
  empty: "No chart data yet.",
  error: "Chart data could not be displayed.",
  chartNavigation: "Chart values. Use arrow keys to move, Home or End to jump, Escape to dismiss the tooltip.",
  point: (row, value) => `${row.label}: ${value}`,
};

interface FrameContext extends ChartFrameRenderContext {
  title: string;
  labels: ChartFrameLabels;
  summaryId: string;
  tooltipId: string;
  tableId: string;
  tableOpen: boolean;
  tooltipVisible: boolean;
  focusIndex: number;
  activate: (index: number, focused: boolean) => void;
  dismiss: () => void;
  leave: () => void;
  leavePointer: () => void;
  focusPoint: (index: number) => void;
  registerPoint: (index: number, point: HTMLButtonElement | null) => void;
}

const FrameContext = createContext<FrameContext | null>(null);

function useFrame() {
  const context = useContext(FrameContext);
  if (!context) throw new Error("ChartFrame parts must be rendered inside ChartFrame.");
  return context;
}

export function ChartFrame({
  title,
  summary,
  rows,
  children,
  state = "ready",
  locale = "en-US",
  valueFormat,
  tableOpen: controlledOpen,
  defaultTableOpen = false,
  onTableOpenChange,
  labels: customLabels,
  className,
  ...props
}: ChartFrameProps) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const [tableOpen, setTableOpen] = useControllableState({
    value: controlledOpen, defaultValue: defaultTableOpen, onChange: onTableOpenChange,
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [tabStopId, setTabStopId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const points = useRef(new Map<number, HTMLButtonElement>());
  const labels = { ...defaultLabels, ...customLabels };
  const numberFormat = new Intl.NumberFormat(locale, valueFormat);
  const formatValue = (value: number) => numberFormat.format(value);
  const resolvedState = state === "ready" && rows.length === 0 ? "empty" : state;
  const ready = resolvedState === "ready";
  const activeId = hoveredId ?? focusedId;
  const activeIndex = ready && activeId !== null ? rows.findIndex((row) => row.id === activeId) : -1;
  const validActiveIndex = activeIndex === -1 ? null : activeIndex;
  const clampedFocusIndex = Math.max(0, rows.findIndex((row) => row.id === tabStopId));
  const context: FrameContext = {
    title, rows, labels, formatValue, palette: chartPalette,
    activeIndex: validActiveIndex,
    focusIndex: clampedFocusIndex,
    tooltipVisible: validActiveIndex !== null && !dismissed,
    summaryId: `${id}-summary`, tooltipId: `${id}-tooltip`, tableId: `${id}-table`, tableOpen,
    activate(index, focused) {
      const rowId = rows[index]?.id ?? null;
      if (focused) {
        setFocusedId(rowId);
        setTabStopId(rowId);
        setHoveredId(null);
      } else setHoveredId(rowId);
      setDismissed(false);
    },
    dismiss: () => setDismissed(true),
    leave: () => setFocusedId(null),
    leavePointer: () => setHoveredId(null),
    focusPoint: (index) => points.current.get(index)?.focus(),
    registerPoint(index, point) {
      if (point) points.current.set(index, point);
      else points.current.delete(index);
    },
  };

  return (
    <FrameContext.Provider value={context}>
      <figure
        aria-labelledby={`${id}-title`}
        aria-describedby={context.summaryId}
        aria-busy={resolvedState === "loading"}
        data-slot="chart-frame"
        data-state={resolvedState}
        data-reduced-motion={reducedMotion}
        className={cn("@container/chart-frame min-w-0 rounded-lg border bg-card p-4 text-card-foreground", className)}
        {...props}
      >
        <figcaption data-slot="chart-frame-caption" className="flex flex-wrap items-start justify-between gap-3">
          <div data-slot="chart-frame-heading" className="min-w-0 flex-1 basis-48">
            <ChartFrameTitle id={`${id}-title`}>{title}</ChartFrameTitle>
            <ChartFrameDescription id={context.summaryId}>{summary}</ChartFrameDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            aria-controls={context.tableId}
            aria-expanded={tableOpen}
            onClick={() => setTableOpen((previous) => !previous)}
            data-slot="chart-frame-table-toggle"
            data-state={tableOpen ? "open" : "closed"}
            className="min-h-11 max-w-full whitespace-normal"
          >
            {tableOpen ? labels.hideTable : labels.showTable}
          </Button>
        </figcaption>
        <div data-slot="chart-frame-content" className="min-h-48 pt-5">
          {ready ? (
            <>
              {typeof children === "function" ? children(context) : children ?? (
                <ChartFramePlot>
                  {rows.map((row, index) => (
                    <ChartFramePoint key={row.id} index={index} className="flex w-full items-center justify-between gap-3">
                      <span>{row.label}</span><span className="tabular-nums">{formatValue(row.value)}</span>
                    </ChartFramePoint>
                  ))}
                </ChartFramePlot>
              )}
              <ChartFrameTooltip />
            </>
          ) : (
            <p
              data-slot="chart-frame-status"
              role={resolvedState === "error" ? "alert" : "status"}
              className={cn("flex min-h-40 items-center justify-center text-sm", resolvedState === "error" ? "text-destructive" : "text-muted-foreground")}
            >
              {resolvedState === "loading" ? labels.loading : resolvedState === "error" ? labels.error : labels.empty}
            </p>
          )}
        </div>
        <div hidden={!tableOpen} data-slot="chart-frame-table-container" className="overflow-x-auto border-t pt-4">
          <ChartFrameTable />
        </div>
      </figure>
    </FrameContext.Provider>
  );
}

export function ChartFrameTitle({ className, ...props }: ChartFrameTitleProps) {
  return <h3 data-slot="chart-frame-title" className={cn("text-base font-semibold", className)} {...props} />;
}

export function ChartFrameDescription({ className, ...props }: ChartFrameDescriptionProps) {
  return <p data-slot="chart-frame-description" className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />;
}

export function ChartFramePlot({ className, onBlur, ...props }: ChartFramePlotProps) {
  const frame = useFrame();
  return (
    <div
      data-slot="chart-frame-plot"
      role="group"
      aria-label={frame.labels.chartNavigation}
      aria-describedby={frame.summaryId}
      className={cn("grid min-w-0 gap-2", className)}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) frame.leave();
      }}
      {...props}
    />
  );
}

export function ChartFramePoint({
  index, className, ref, onFocus, onBlur, onKeyDown, onPointerEnter, onPointerLeave, style, ...props
}: ChartFramePointProps) {
  const frame = useFrame();
  const row = frame.rows[index];
  if (!row) throw new Error(`ChartFramePoint index ${index} is outside the supplied rows.`);
  const active = frame.activeIndex === index;
  return (
    <button
      type="button"
      data-slot="chart-frame-point"
      data-state={active ? "active" : "idle"}
      data-disabled={props.disabled ? "" : undefined}
      aria-label={frame.labels.point(row, frame.formatValue(row.value))}
      aria-describedby={active && frame.tooltipVisible ? frame.tooltipId : undefined}
      tabIndex={frame.focusIndex === index ? 0 : -1}
      className={cn("min-h-11 min-w-11 rounded-md border border-input px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", className)}
      style={{ "--chart-color": frame.palette[index % frame.palette.length], ...style } as CSSProperties}
      ref={(node) => {
        frame.registerPoint(index, node);
        const cleanup = typeof ref === "function" ? ref(node) : undefined;
        if (ref && typeof ref !== "function") ref.current = node;
        return () => {
          frame.registerPoint(index, null);
          if (typeof cleanup === "function") cleanup();
          else if (typeof ref === "function") ref(null);
          else if (ref) ref.current = null;
        };
      }}
      onFocus={(event) => { onFocus?.(event); frame.activate(index, true); }}
      onBlur={(event) => { onBlur?.(event); }}
      onPointerEnter={(event) => { onPointerEnter?.(event); frame.activate(index, false); }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        frame.leavePointer();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        let target: number | undefined;
        switch (event.key) {
          case "ArrowRight": case "ArrowDown": target = (index + 1) % frame.rows.length; break;
          case "ArrowLeft": case "ArrowUp": target = (index + frame.rows.length - 1) % frame.rows.length; break;
          case "Home": target = 0; break;
          case "End": target = frame.rows.length - 1; break;
          case "Escape": event.preventDefault(); frame.dismiss(); return;
        }
        if (target !== undefined) { event.preventDefault(); frame.focusPoint(target); }
      }}
      {...props}
    />
  );
}

export function ChartFrameTooltip({ className, ...props }: ChartFrameTooltipProps) {
  const frame = useFrame();
  const row = frame.activeIndex === null ? undefined : frame.rows[frame.activeIndex];
  return (
    <div data-slot="chart-frame-tooltip-space" className="min-h-20 py-2">
      {row && frame.tooltipVisible && (
        <div
          id={frame.tooltipId}
          role="tooltip"
          data-slot="chart-frame-tooltip"
          className={cn("w-fit max-w-full rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground", className)}
          {...props}
        >
          {frame.labels.point(row, frame.formatValue(row.value))}
        </div>
      )}
    </div>
  );
}

export function ChartFrameTable({ className, ...props }: ChartFrameTableProps) {
  const frame = useFrame();
  return (
    <table
      id={frame.tableId}
      data-slot="chart-frame-table"
      tabIndex={0}
      className={cn("w-full rounded-md text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    >
      <caption className="pb-3 text-left font-medium">{frame.labels.tableCaption(frame.title)}</caption>
      <thead><tr><th scope="col" className="px-2 py-2 font-medium">{frame.labels.labelColumn}</th><th scope="col" className="px-2 py-2 text-right font-medium">{frame.labels.valueColumn}</th></tr></thead>
      <tbody>{frame.rows.map((row) => (
        <tr key={row.id} className="border-t"><th scope="row" className="px-2 py-2 font-normal">{row.label}</th><td className="px-2 py-2 text-right tabular-nums">{frame.formatValue(row.value)}</td></tr>
      ))}</tbody>
    </table>
  );
}
