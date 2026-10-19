"use client";

import { Button } from "@/components/ui/button";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "cn";
import { Check, ChevronsUpDown, Minus, Plus, X } from "lucide-react";
import { memo, useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import { useControllableState } from "../../../packages/ui-foundation/src/hooks/use-controllable-state";
import { buildDiffModel, formatDiffValue, getDiffInputKey } from "./diff-model";
import type { DiffDecision, DiffDecisions, DiffField, DiffInput, DiffLine, DiffLinePair, DiffMode, DiffModel, DiffTextGroup, DiffView } from "./diff-model";
import type { DiffCodeLines } from "./diff-code";
import "./diff-viewer.css";

export { getDiffFieldId } from "./diff-model";
export type { DiffDecision, DiffDecisions, DiffField, DiffInput, DiffLine, DiffLinePair, DiffMode, DiffModel, DiffSegment, DiffTextGroup, DiffView } from "./diff-model";

export interface DiffLabels {
  title: string; unified: string; split: string; view: string; hideWhitespace: string;
  before: string; after: string; field: string; actions: string; accept: string; reject: string;
  accepted: string; rejected: string; pending: string; loading: string; noChanges: string;
  added: string; removed: string; changed: string; unchanged: string; missing: string;
  collapse: string; error: string; retry: string; codeFallback: string;
  hunk: (index: number, total: number) => string;
  showLines: (count: number) => string;
  decision: (action: string, name: string) => string;
  counts: (added: number, removed: number) => string;
}
const defaultLabels: DiffLabels = {
  title: "Proposed changes", unified: "Unified", split: "Split", view: "Diff view", hideWhitespace: "Hide whitespace",
  before: "Before", after: "After", field: "Field", actions: "Decisions", accept: "Accept", reject: "Reject",
  accepted: "Accepted", rejected: "Rejected", pending: "Saving decision", loading: "Comparing changes…", noChanges: "No changes",
  added: "Added", removed: "Removed", changed: "Changed", unchanged: "Unchanged", missing: "Not present",
  collapse: "Collapse unchanged lines", error: "Could not complete this change", retry: "Retry", codeFallback: "Syntax highlighting unavailable. Plain code remains available.",
  hunk: (index, total) => `Change ${index} of ${total}`,
  showLines: (count) => `Show ${count} unchanged lines`,
  decision: (action, name) => `${action} ${name.toLocaleLowerCase()}`,
  counts: (added, removed) => `${added} additions, ${removed} removals`,
};
function resolveLabels(custom?: Partial<DiffLabels>): DiffLabels {
  const labels = { ...defaultLabels };
  for (const key of Object.keys(defaultLabels) as (keyof DiffLabels)[]) {
    const value = custom?.[key];
    if (typeof value === typeof defaultLabels[key] && (typeof value !== "string" || value.trim())) Object.assign(labels, { [key]: value });
  }
  return labels;
}
type RootProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "onChange">;
export interface DiffViewerProps extends RootProps {
  mode?: DiffMode; before: DiffInput; after: DiffInput; language?: string;
  title?: ReactNode; icon?: ReactNode; toolbarActions?: ReactNode; toolbarStatus?: ReactNode;
  view?: DiffView; defaultView?: DiffView; onViewChange?: (view: DiffView) => void;
  hideWhitespace?: boolean; defaultHideWhitespace?: boolean; onHideWhitespaceChange?: (hidden: boolean) => void;
  interactive?: boolean; disabled?: boolean;
  decisions?: DiffDecisions; defaultDecisions?: DiffDecisions; onDecisionsChange?: (decisions: DiffDecisions) => void;
  onHunkDecision?: ((hunkId: string, decision: DiffDecision) => void | Promise<void>) | undefined;
  expandedRegions?: readonly string[]; defaultExpandedRegions?: readonly string[]; onExpandedRegionsChange?: (ids: readonly string[]) => void;
  /** Regions longer than this collapse. The production default is six. */
  collapseThreshold?: number; maxHeight?: number; labels?: Partial<DiffLabels>; locale?: string;
  ref?: Ref<HTMLDivElement>;
}
export interface DiffToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode; icon?: ReactNode; actions?: ReactNode; status?: ReactNode;
  view?: DiffView; onViewChange?: (view: DiffView) => void;
  hideWhitespace?: boolean; onHideWhitespaceChange?: (hidden: boolean) => void;
  additions?: number; removals?: number; showViewControls?: boolean; disabled?: boolean;
  labels?: Partial<DiffLabels>; locale?: string; ref?: Ref<HTMLDivElement>;
}
export function DiffToolbar({ title, icon, actions, status, view = "unified", onViewChange, hideWhitespace = true, onHideWhitespaceChange, additions = 0, removals = 0, showViewControls = true, disabled = false, labels: custom, locale = "en-US", className, ref, ...props }: DiffToolbarProps) {
  const labels = resolveLabels(custom); const number = new Intl.NumberFormat(locale);
  return <div {...props} ref={ref} data-slot="diff-toolbar" data-state={disabled ? "disabled" : "ready"} className={cn("ail-diff-toolbar", className)}>
    <div className="ail-diff-title">{icon && <span aria-hidden="true" className="ail-diff-icon">{icon}</span>}<b>{title ?? labels.title}</b>
      {showViewControls && <span data-slot="diff-counts" className="ail-diff-counts" role="img" aria-label={labels.counts(additions, removals)}><span aria-hidden="true" data-change="added">+{number.format(additions)}</span><span aria-hidden="true" data-change="removed">−{number.format(removals)}</span></span>}
      {status != null && <span className="ail-diff-toolbar-status">{status}</span>}
    </div>
    <div className="ail-diff-tools">{showViewControls && <>
      <Button variant="ghost" type="button" role="switch" aria-checked={hideWhitespace} disabled={disabled} onClick={() => onHideWhitespaceChange?.(!hideWhitespace)} className="ail-diff-whitespace"><span className="ail-diff-switch" aria-hidden="true"><i /></span><span>{labels.hideWhitespace}</span></Button>
      <div role="group" aria-label={labels.view} className="ail-diff-segment">{(["unified", "split"] as const).map((option) => <Button key={option} variant="ghost" type="button" aria-pressed={view === option} disabled={disabled} onClick={() => onViewChange?.(option)}>{labels[option]}</Button>)}</div>
    </>}{actions}</div>
  </div>;
}

export interface DiffHunkProps extends HTMLAttributes<HTMLElement> {
  hunkId: string; index: number; total: number; interactive?: boolean; disabled?: boolean;
  decision?: DiffDecision | undefined; pending?: boolean; error?: boolean;
  onDecision?: (id: string, decision: DiffDecision) => void;
  labels?: Partial<DiffLabels>; ref?: Ref<HTMLElement>;
}
export function DiffHunk({ hunkId, index, total, interactive = false, disabled = false, decision, pending = false, error = false, onDecision, labels: custom, children, className, ref, ...props }: DiffHunkProps) {
  const labels = resolveLabels(custom); const name = labels.hunk(index, total);
  return <section {...props} ref={ref} data-slot="diff-hunk" data-hunk-id={hunkId} data-state={pending ? "pending" : error ? "error" : decision === "accept" ? "accepted" : decision === "reject" ? "rejected" : "undecided"} role="region" aria-label={props["aria-label"] ?? name} aria-busy={pending || undefined} tabIndex={props.tabIndex ?? -1} className={cn("ail-diff-hunk", className)}>
    {interactive && <div className="ail-diff-hunk-tools"><span>{name}</span><DecisionButtons id={hunkId} name={name} decision={decision} disabled={disabled || pending} onDecision={onDecision} labels={labels} />{decision && <span className="ail-diff-outcome">{labels[decision === "accept" ? "accepted" : "rejected"]}</span>}{pending && <span role="status">{labels.pending}</span>}{error && <span role="alert">{labels.error}</span>}</div>}
    <div className="ail-diff-hunk-content">{children}</div>
  </section>;
}
function DecisionButtons({ id, name, decision, disabled, onDecision, labels }: { id: string; name: string; decision?: DiffDecision | undefined; disabled: boolean; onDecision?: ((id: string, decision: DiffDecision) => void) | undefined; labels: DiffLabels }) {
  return <span className="ail-diff-decisions">{(["reject", "accept"] as const).map((action) => <Button key={action} variant="outline" type="button" data-slot={`diff-hunk-${action}`} data-state={decision === action ? "on" : "off"} aria-label={labels.decision(labels[action], name)} aria-pressed={decision === action} disabled={disabled} onClick={() => onDecision?.(id, action)}>{action === "accept" ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</Button>)}</span>;
}

interface VirtualHandle { scrollToIndex: (index: number) => void }
function VirtualList<T extends { id: string }>({ items, render, maxHeight, handle, label }: { items: readonly T[]; render: (item: T, index: number) => ReactNode; maxHeight: number; handle?: Ref<VirtualHandle> | undefined; label: string }) {
  const scroll = useRef<HTMLDivElement>(null);
  const virtual = useVirtualizer({ count: items.length, getScrollElement: () => scroll.current, estimateSize: () => 52, overscan: 5, getItemKey: (index) => items[index]!.id, initialRect: { width: 600, height: maxHeight } });
  useImperativeHandle(handle, () => ({ scrollToIndex: (index) => virtual.scrollToIndex(index) }), [virtual]);
  return <div ref={scroll} role="region" aria-label={label} tabIndex={0} data-slot="diff-viewport" data-virtualized="true" className="ail-diff-viewport" style={{ maxHeight, height: Math.min(maxHeight, virtual.getTotalSize()) }}><div className="ail-diff-virtual-space" style={{ height: virtual.getTotalSize() }}>{virtual.getVirtualItems().map((row) => <div key={row.key} data-index={row.index} ref={virtual.measureElement} className="ail-diff-virtual-item" style={{ transform: `translateY(${row.start}px)` }}>{render(items[row.index]!, row.index)}</div>)}</div></div>;
}
const DiffRow = memo(function DiffRow({ pair, kind, view, labels, codeBefore, codeAfter }: { pair: DiffLinePair; kind: "changed" | "unchanged"; view: DiffView; labels: DiffLabels; codeBefore?: DiffCodeLines | undefined; codeAfter?: DiffCodeLines | undefined }) {
  const line = (value: DiffLine | undefined, change: "added" | "removed" | "unchanged", other?: DiffLine) => <div data-slot="diff-row" data-change={change} className={cn("ail-diff-line", !value && "ail-diff-placeholder")}>
    <span className="ail-diff-number" aria-hidden="true">{view === "split" ? value?.number : change === "added" ? "" : change === "unchanged" ? pair.before?.number : value?.number}</span>
    {view === "unified" && <span className="ail-diff-number" aria-hidden="true">{change === "removed" ? "" : other?.number ?? value?.number}</span>}
    <span className="ail-diff-prefix" aria-hidden="true">{value && (change === "added" ? "+" : change === "removed" ? "−" : " ")}</span>
    <span className="ail-diff-source">{value && <><span className="ail-diff-sr">{labels[change]}: </span><LineContent value={value} tokens={change === "removed" ? codeBefore?.[value.number - 1] : codeAfter?.[value.number - 1]} /></>}</span>
  </div>;
  if (view === "split") return <div className="ail-diff-pair">{line(pair.before, kind === "unchanged" ? "unchanged" : "removed")}{line(pair.after, kind === "unchanged" ? "unchanged" : "added")}</div>;
  if (kind === "unchanged") return line(pair.after, "unchanged", pair.after);
  return <>{pair.before && line(pair.before, "removed")}{pair.after && line(pair.after, "added")}</>;
});
function LineContent({ value, tokens }: { value: DiffLine; tokens?: DiffCodeLines[number] | undefined }) {
  if (!tokens) return <>{value.segments.map((segment, index) => segment.changed ? <mark key={index}>{segment.text}</mark> : <span key={index}>{segment.text}</span>)}</>;
  // Intersect semantic word ranges with syntax ranges without changing text.
  let position = 0; let segmentIndex = 0; let segmentEnd = value.segments[0]?.text.length ?? 0;
  return <>{tokens.flatMap((token, tokenIndex) => {
    const pieces: ReactNode[] = []; let offset = 0;
    while (offset < token.content.length) {
      while (segmentIndex < value.segments.length - 1 && position >= segmentEnd) { segmentIndex++; segmentEnd += value.segments[segmentIndex]!.text.length; }
      const length = Math.min(token.content.length - offset, Math.max(1, segmentEnd - position)); const text = token.content.slice(offset, offset + length);
      const syntax = <span className="ail-diff-token" style={{ "--diff-code-light": token.light, "--diff-code-dark": token.dark } as CSSProperties}>{text}</span>;
      pieces.push(value.segments[segmentIndex]?.changed ? <mark key={`${tokenIndex}:${offset}`}>{syntax}</mark> : <span key={`${tokenIndex}:${offset}`}>{syntax}</span>);
      offset += length; position += length;
    }
    return pieces;
  })}</>;
}
export interface DiffFieldTableProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  fields: readonly DiffField[]; interactive?: boolean; disabled?: boolean; decisions?: DiffDecisions;
  pendingIds?: readonly string[]; errorIds?: readonly string[]; onDecision?: (id: string, decision: DiffDecision) => void;
  labels?: Partial<DiffLabels>; maxHeight?: number; ref?: Ref<HTMLDivElement>;
  /** Optional navigation handle for owners coordinating a virtualized table. */
  navigationRef?: Ref<VirtualHandle>;
}
export function DiffFieldTable({ fields, interactive = false, disabled = false, decisions = {}, pendingIds = [], errorIds = [], onDecision, labels: custom, maxHeight = 480, className, ref, navigationRef, ...props }: DiffFieldTableProps) {
  const labels = resolveLabels(custom);
  const render = (field: DiffField, index: number) => <DiffHunk key={field.id} hunkId={field.id} data-field={field.field} index={index + 1} total={fields.length} labels={labels} decision={decisions[field.id]} pending={pendingIds.includes(field.id)} error={errorIds.includes(field.id)} className="ail-diff-field-hunk">
    <div className="ail-diff-field-row" data-change={field.kind}>
      <span className="ail-diff-field-name"><span className="ail-diff-field-kind" title={labels[field.kind]}>{field.kind === "added" ? <Plus aria-hidden="true" /> : field.kind === "removed" ? <Minus aria-hidden="true" /> : null}<span className="ail-diff-sr">{labels[field.kind]}: </span></span>{field.field}</span>
      <span className="ail-diff-field-before"><span className="ail-diff-sr">{labels.before}: </span>{field.hasBefore ? formatDiffValue(field.before) : <span className="ail-diff-missing">{labels.missing}</span>}</span>
      <span className="ail-diff-field-after"><span className="ail-diff-sr">{labels.after}: </span>{field.hasAfter ? formatDiffValue(field.after) : <span className="ail-diff-missing">{labels.missing}</span>}</span>
      <div className="ail-diff-field-actions">{interactive && <DecisionButtons id={field.id} name={field.field} decision={decisions[field.id]} disabled={disabled || pendingIds.includes(field.id)} onDecision={onDecision} labels={labels} />}{decisions[field.id] && <span className="ail-diff-sr">{labels[decisions[field.id] === "accept" ? "accepted" : "rejected"]}</span>}</div>
    </div>{pendingIds.includes(field.id) && <span className="ail-diff-inline-status" role="status">{labels.pending}</span>}{errorIds.includes(field.id) && <span className="ail-diff-inline-status" role="alert">{labels.error}</span>}
  </DiffHunk>;
  return <div {...props} ref={ref} data-slot="diff-field-table" data-state={fields.length ? "ready" : "empty"} className={cn("ail-diff-field-table", className)}>
    <div className="ail-diff-field-header" aria-hidden="true"><span>{labels.field}</span><span>{labels.before}</span><span>{labels.after}</span><span>{labels.actions}</span></div>
    {fields.length > 100 ? <VirtualList items={fields} render={render} maxHeight={maxHeight} handle={navigationRef} label={labels.title} /> : fields.map(render)}
  </div>;
}

const editable = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="spinbutton"]'));
function useDiffInput(input: DiffInput): { value: DiffInput } {
  const key = getDiffInputKey(input);
  // Equal record contents retain the comparison snapshot across owner renders.
  return useMemo(() => ({ value: input }), [key, typeof input]);
}
export function DiffViewer({ mode = "text", before: beforeInput, after: afterInput, language = "typescript", title, icon, toolbarActions, toolbarStatus,
  view: controlledView, defaultView = "unified", onViewChange, hideWhitespace: controlledWhitespace, defaultHideWhitespace = true, onHideWhitespaceChange,
  interactive = false, disabled = false, decisions: controlledDecisions, defaultDecisions = {}, onDecisionsChange, onHunkDecision,
  expandedRegions: controlledExpanded, defaultExpandedRegions = [], onExpandedRegionsChange, collapseThreshold = 6, maxHeight = 480,
  labels: customLabels, locale = "en-US", className, ref, onKeyDown, ...props }: DiffViewerProps) {
  const before = useDiffInput(beforeInput); const after = useDiffInput(afterInput);
  const labels = useMemo(() => resolveLabels(customLabels), [customLabels]); const id = useId();
  const root = useRef<HTMLDivElement>(null); useImperativeHandle(ref, () => root.current!, []);
  const [view, setView] = useControllableState({ value: controlledView, defaultValue: defaultView, onChange: onViewChange });
  const [hideWhitespace, setWhitespace] = useControllableState({ value: controlledWhitespace, defaultValue: defaultHideWhitespace, onChange: onHideWhitespaceChange });
  const [decisions, setDecisions] = useControllableState({ value: controlledDecisions, defaultValue: defaultDecisions, onChange: onDecisionsChange });
  const [expanded, setExpanded] = useControllableState({ value: controlledExpanded, defaultValue: defaultExpandedRegions, onChange: onExpandedRegionsChange });
  const [narrow, setNarrow] = useState(false); const effectiveView = narrow ? "unified" : view;
  const [result, setResult] = useState<{ model?: DiffModel; error?: boolean; before: { value: DiffInput }; after: { value: DiffInput }; mode: DiffMode; hideWhitespace: boolean }>();
  const [retry, setRetry] = useState(0); const generation = useRef(0); const previousInput = useRef({ before, after, mode });
  const [staleControlledDecisions, setStaleControlledDecisions] = useState<DiffDecisions | undefined>();
  const [pending, setPending] = useState<Readonly<Record<string, boolean>>>({}); const [errors, setErrors] = useState<Readonly<Record<string, boolean>>>({});
  const inFlight = useRef(new Set<string>()); const [activeHunk, setActiveHunk] = useState<string>();
  const [syntax, setSyntax] = useState<{ model: DiffModel; language: string; before: DiffCodeLines; after: DiffCodeLines }>(); const [syntaxFailed, setSyntaxFailed] = useState(false);
  const groupsHandle = useRef<VirtualHandle>(null);
  const model = result?.before === before && result.after === after && result.mode === mode && result.hideWhitespace === hideWhitespace ? result.model : undefined;
  const loading = !model && !result?.error || result?.before !== before || result?.after !== after || result?.mode !== mode || result?.hideWhitespace !== hideWhitespace;
  const safeDecisions = controlledDecisions !== undefined && controlledDecisions === staleControlledDecisions ? {} : decisions;
  const latestDecisions = useRef<DiffDecisions>(safeDecisions);
  useEffect(() => { latestDecisions.current = safeDecisions; });
  useEffect(() => {
    const node = root.current; if (!node || typeof ResizeObserver === "undefined") return;
    const measure = () => setNarrow(node.getBoundingClientRect().width < 640);
    measure(); const observer = new ResizeObserver(measure); observer.observe(node); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const current = ++generation.current; const abort = new AbortController(); inFlight.current.clear(); setPending({}); setErrors({}); setSyntax(undefined); setSyntaxFailed(false);
    if (previousInput.current.before !== before || previousInput.current.after !== after || previousInput.current.mode !== mode) {
      if (controlledDecisions !== undefined) setStaleControlledDecisions(controlledDecisions); else setDecisions({});
      previousInput.current = { before, after, mode }; setActiveHunk(undefined);
    }
    void buildDiffModel(before.value, after.value, { mode, hideWhitespace, signal: abort.signal }).then((next) => {
      if (!abort.signal.aborted && generation.current === current) setResult({ model: next, before, after, mode, hideWhitespace });
    }).catch((error: unknown) => { if (!abort.signal.aborted && !(error instanceof DOMException && error.name === "AbortError")) setResult({ error: true, before, after, mode, hideWhitespace }); });
    return () => { abort.abort(); generation.current++; };
    // Controlled decision changes must not restart the comparison.
  }, [before, after, mode, hideWhitespace, retry, setDecisions]);
  useEffect(() => {
    if (mode !== "code" || !model) return;
    const abort = new AbortController(); setSyntaxFailed(false);
    void import("./diff-code").then(async ({ highlightDiffCode }) => {
      const previous = await highlightDiffCode(model.beforeText, language, abort.signal); const next = await highlightDiffCode(model.afterText, language, abort.signal);
      if (!abort.signal.aborted) setSyntax({ model, language, before: previous, after: next });
    }).catch(() => { if (!abort.signal.aborted) setSyntaxFailed(true); });
    return () => abort.abort();
  }, [mode, model, language]);
  const decide = useCallback(async (hunkId: string, decision: DiffDecision) => {
    if (!interactive || disabled || inFlight.current.has(hunkId)) return;
    const current = generation.current; inFlight.current.add(hunkId); setPending((value) => ({ ...value, [hunkId]: true })); setErrors((value) => ({ ...value, [hunkId]: false }));
    try {
      await onHunkDecision?.(hunkId, decision);
      if (generation.current !== current) return;
      const next = { ...latestDecisions.current, [hunkId]: decision };
      latestDecisions.current = next; setDecisions(next);
    } catch { if (generation.current === current) setErrors((value) => ({ ...value, [hunkId]: true })); }
    finally { if (generation.current === current) { inFlight.current.delete(hunkId); setPending((value) => ({ ...value, [hunkId]: false })); } }
  }, [interactive, disabled, onHunkDecision, setDecisions]);
  const hunks = model ? mode === "fields" ? model.fields.map((field) => field.id) : model.groups.filter((group) => group.kind === "changed").map((group) => group.id) : [];
  const focusHunk = (hunkId: string) => {
    setActiveHunk(hunkId); const groupIndex = (mode === "fields" ? model?.fields : model?.groups)?.findIndex((group) => group.id === hunkId) ?? -1;
    if (groupIndex >= 0) groupsHandle.current?.scrollToIndex(groupIndex);
    const focus = () => { if (!root.current) return; const node = [...root.current.querySelectorAll<HTMLElement>('[data-slot="diff-hunk"]')].find((entry) => entry.dataset.hunkId === hunkId); node?.focus({ preventScroll: true }); node?.scrollIntoView?.({ block: "nearest" }); };
    focus(); requestAnimationFrame(focus);
  };
  const renderGroup = (group: DiffTextGroup) => {
    const collapsed = group.kind === "unchanged" && group.pairs.length > Math.max(0, collapseThreshold); const open = expanded.includes(group.id);
    const toggle = () => setExpanded((previous) => previous.includes(group.id) ? previous.filter((key) => key !== group.id) : [...previous, group.id]);
    const orderedPairs = group.kind === "changed" && effectiveView === "unified"
      ? [...group.pairs.filter((pair) => pair.before).map((pair) => ({ before: pair.before! })), ...group.pairs.filter((pair) => pair.after).map((pair) => ({ after: pair.after! }))]
      : group.pairs;
    const rows = orderedPairs.map((pair, index) => ({ ...pair, id: `${group.id}:${index}` }));
    const currentSyntax = syntax?.model === model && syntax?.language === language ? syntax : undefined;
    const renderRow = (pair: DiffLinePair) => <DiffRow pair={pair} kind={group.kind} view={effectiveView} labels={labels} codeBefore={currentSyntax?.before} codeAfter={currentSyntax?.after} />;
    const body = collapsed && !open ? <Button variant="ghost" type="button" data-slot="diff-fold" aria-expanded={false} aria-controls={`${id}-${group.id}`} onClick={toggle} className="ail-diff-fold"><ChevronsUpDown aria-hidden="true" />{labels.showLines(group.pairs.length)}</Button> : <div id={`${id}-${group.id}`}>{rows.length > 100 ? <VirtualList items={rows} render={renderRow} maxHeight={maxHeight} label={labels.title} /> : rows.map((pair) => <div key={pair.id}>{renderRow(pair)}</div>)}{collapsed && <Button variant="ghost" type="button" data-slot="diff-fold" aria-expanded={true} aria-controls={`${id}-${group.id}`} onClick={toggle} className="ail-diff-fold"><ChevronsUpDown aria-hidden="true" />{labels.collapse}</Button>}</div>;
    if (group.kind === "unchanged") return <div key={group.id} data-slot="diff-context" data-state={collapsed && !open ? "collapsed" : "expanded"}>{body}</div>;
    return <DiffHunk key={group.id} hunkId={group.id} index={hunks.indexOf(group.id) + 1} total={hunks.length} interactive={interactive} disabled={disabled} decision={safeDecisions[group.id]} pending={Boolean(pending[group.id])} error={Boolean(errors[group.id])} onDecision={(key, decision) => { void decide(key, decision); }} labels={labels}>{body}</DiffHunk>;
  };
  const empty = model && !model.additions && !model.removals;
  return <div {...props} ref={root} role={props.role ?? "group"} aria-label={props["aria-label"] ?? (typeof title === "string" ? title : labels.title)} tabIndex={props.tabIndex ?? 0} className={cn("ail-diff-viewer", className)} data-slot="diff-viewer" data-mode={mode} data-disabled={disabled || undefined} data-state={loading ? "loading" : result?.error ? "error" : empty ? "empty" : "ready"} data-view={effectiveView} data-requested-view={view} aria-busy={loading || undefined}
    onFocusCapture={(event) => { props.onFocusCapture?.(event); const hunk = (event.target as HTMLElement).closest<HTMLElement>('[data-slot="diff-hunk"]'); if (hunk?.dataset.hunkId) setActiveHunk(hunk.dataset.hunkId); }}
    onKeyDown={(event) => {
      onKeyDown?.(event); if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || editable(event.target) || !hunks.length) return;
      const key = event.key.toLocaleLowerCase(); const index = activeHunk ? hunks.indexOf(activeHunk) : -1;
      if (key === "n" || key === "p") { event.preventDefault(); focusHunk(hunks[(index + (key === "n" ? 1 : index < 0 ? 0 : -1) + hunks.length) % hunks.length]!); }
      const focusedHunk = (event.target as HTMLElement).closest<HTMLElement>('[data-slot="diff-hunk"]')?.dataset.hunkId;
      if ((key === "a" || key === "r") && focusedHunk && interactive && !disabled) { event.preventDefault(); void decide(focusedHunk, key === "a" ? "accept" : "reject"); }
    }}>
    <DiffToolbar title={title} icon={icon} actions={toolbarActions} status={toolbarStatus} view={view} onViewChange={setView} hideWhitespace={hideWhitespace} onHideWhitespaceChange={setWhitespace} additions={model?.additions ?? 0} removals={model?.removals ?? 0} showViewControls={mode !== "fields"} disabled={disabled} labels={labels} locale={locale} />
    {loading ? <div role="status" data-slot="diff-status" className="ail-diff-empty">{labels.loading}</div> : result?.error ? <div role="alert" data-slot="diff-status" className="ail-diff-empty">{labels.error}<Button variant="outline" type="button" onClick={() => { setResult(undefined); setRetry((value) => value + 1); }}>{labels.retry}</Button></div> : empty ? <div role="status" data-slot="diff-status" className="ail-diff-empty"><Check aria-hidden="true" />{labels.noChanges}</div> : model && <>
      {mode === "fields" ? <DiffFieldTable fields={model.fields} interactive={interactive} disabled={disabled} decisions={safeDecisions} pendingIds={Object.keys(pending).filter((key) => pending[key])} errorIds={Object.keys(errors).filter((key) => errors[key])} onDecision={(key, decision) => { void decide(key, decision); }} labels={labels} maxHeight={maxHeight} navigationRef={groupsHandle} /> : <div className="ail-diff-text" data-slot="diff-text">{model.groups.length > 100 ? <VirtualList items={model.groups} render={renderGroup} maxHeight={maxHeight} handle={groupsHandle} label={labels.title} /> : model.groups.map(renderGroup)}</div>}
      {syntaxFailed && <div role="status" className="ail-diff-inline-status">{labels.codeFallback}</div>}
    </>}
  </div>;
}
