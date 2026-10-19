"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Database, Mail, Pause, Play, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "../../../packages/ui-foundation/src/hooks/use-reduced-motion";
import { getDesignAccentStyle, type DesignAccent } from "../../../packages/ui-foundation/src/design-accent";
import { DiffViewer, type DiffDecisions } from "./diff-viewer";
import "./diff-viewer.demo.css";

export interface DiffDemoReply {
  title: string;
  before: string;
  after: string;
}

export interface DiffDemoCrm {
  title: string;
  agent: string;
  before: Readonly<Record<string, string>>;
  after: Readonly<Record<string, string>>;
}

export interface DiffDemoApplyRequest {
  before: Readonly<Record<string, string>>;
  proposal: Readonly<Record<string, string>>;
  decisions: Readonly<DiffDecisions>;
  acceptedFields: readonly string[];
  nextRecord: Readonly<Record<string, string>>;
}

export interface DiffViewerDemoProps {
  reply: DiffDemoReply;
  crm: DiffDemoCrm;
  updatedReply?: DiffDemoReply;
  updatedCrm?: DiffDemoCrm;
  /** Optional local preview persistence hook. The default waits 450 ms; no network request occurs. */
  onApply?: (request: DiffDemoApplyRequest) => void | Promise<void>;
  accent?: DesignAccent;
  className?: string;
}

type PreviewPhase = "idle" | "applying" | "applied" | "error";
interface PreviewState {
  sourceKey: string;
  decisions: DiffDecisions;
  phase: PreviewPhase;
  operation: number;
  record: Record<string, string> | null;
  announcement: string;
}
function subscribeVisibility(change: () => void) {
  document.addEventListener("visibilitychange", change);
  return () => document.removeEventListener("visibilitychange", change);
}
const isVisible = () => document.visibilityState === "visible";
const serverVisible = () => false;
const blank = (sourceKey: string, operation = 0): PreviewState => ({ sourceKey, decisions: {}, phase: "idle", operation, record: null, announcement: "" });
const fieldId = (field: string) => `field:${field}`;

/** A seeded review board. Apply and Undo affect a local snapshot, never a live CRM. */
export function DiffViewerDemo({ reply, crm, updatedReply, updatedCrm, onApply, accent = "mono", className }: DiffViewerDemoProps) {
  const [replacement, setReplacement] = useState(false);
  const activeReply = replacement && updatedReply ? updatedReply : reply;
  const activeCrm = replacement && updatedCrm ? updatedCrm : crm;
  const sourceKey = JSON.stringify([activeReply, activeCrm]);
  const [state, setState] = useState<PreviewState>(() => blank(sourceKey));
  // A new proposal invalidates earlier decisions and any in-flight local save.
  const current = state.sourceKey === sourceKey ? state : blank(sourceKey, state.operation + 1);
  if (state.sourceKey !== sourceKey) setState(current);
  const fields = [...new Set([...Object.keys(activeCrm.before), ...Object.keys(activeCrm.after)])]
    .filter((field) => activeCrm.before[field] !== activeCrm.after[field]);
  const acceptedFields = fields.filter((field) => current.decisions[fieldId(field)] === "accept");
  const decidedCount = fields.filter((field) => current.decisions[fieldId(field)]).length;
  const locked = current.phase === "applying" || current.phase === "applied";
  const [view, setView] = useState<"unified" | "split">("unified");
  const [hideWhitespace, setHideWhitespace] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(true);
  const root = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const visible = useSyncExternalStore(subscribeVisibility, isVisible, serverVisible);
  const reduced = useReducedMotion();

  useEffect(() => {
    mounted.current = true;
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false));
    if (root.current && observer) observer.observe(root.current);
    return () => {
      mounted.current = false;
      observer?.disconnect();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Walk through presentation controls only. Decisions and application always require user input.
  useEffect(() => {
    if (!playing || reduced || !visible || !inView) return;
    const walkthrough = setTimeout(() => {
      if (step % 4 === 0) setView("split");
      if (step % 4 === 1) setView("unified");
      if (step % 4 === 2) setHideWhitespace(false);
      if (step % 4 === 3) setHideWhitespace(true);
      setStep((previous) => previous + 1);
    }, 1800);
    return () => clearTimeout(walkthrough);
  }, [playing, reduced, visible, inView, step]);

  const pauseForInput = (target: EventTarget | null) => {
    if (target instanceof Element && target.closest("[data-walkthrough-control]")) return;
    setPlaying(false);
  };
  const decideAll = (decision: "accept" | "reject") => {
    if (locked) return;
    setState((previous) => ({ ...previous, decisions: Object.fromEntries(fields.map((field) => [fieldId(field), decision])), phase: "idle",
      announcement: `All ${fields.length} changes ${decision === "accept" ? "accepted" : "rejected"} for this local preview.` }));
  };
  const apply = async () => {
    if (locked || !acceptedFields.length) return;
    const operation = current.operation + 1;
    const record = { ...activeCrm.before };
    for (const field of acceptedFields) {
      const value = activeCrm.after[field];
      if (value === undefined) delete record[field];
      else record[field] = value;
    }
    const request: DiffDemoApplyRequest = {
      before: { ...activeCrm.before }, proposal: { ...activeCrm.after }, decisions: { ...current.decisions },
      acceptedFields: [...acceptedFields], nextRecord: { ...record },
    };
    setState((previous) => ({ ...previous, phase: "applying", operation, announcement: "Applying accepted changes to the local preview." }));
    try {
      if (onApply) await onApply(request);
      else await new Promise<void>((resolve) => { timer.current = setTimeout(resolve, 450); });
      if (!mounted.current) return;
      setState((previous) => previous.operation === operation && previous.sourceKey === sourceKey && previous.phase === "applying"
        ? { ...previous, phase: "applied", record, announcement: `Applied ${acceptedFields.length} ${acceptedFields.length === 1 ? "change" : "changes"} locally. ${fields.length - acceptedFields.length} skipped. No HubSpot data was changed.` }
        : previous);
    } catch {
      if (!mounted.current) return;
      setState((previous) => previous.operation === operation && previous.sourceKey === sourceKey && previous.phase === "applying"
        ? { ...previous, phase: "error", record: null, announcement: "The local preview could not be updated. Your decisions are kept. Try Apply again." }
        : previous);
    }
  };
  const toolbarStatus = current.phase === "applied" ? "Local preview updated"
    : current.phase === "applying" ? "Applying to local preview…"
    : decidedCount ? `${decidedCount} of ${fields.length} decided` : `${fields.length} changes proposed by ${activeCrm.agent}`;
  const walkthroughActive = playing && !reduced && visible && inView;

  return <section ref={root} className={`ail-diff-demo${className ? ` ${className}` : ""}`} data-ui-design data-slot="diff-viewer-demo"
    data-testid="diff-viewer-demo" data-preview-state={current.phase} data-autoplay={walkthroughActive ? "playing" : "paused"}
    style={getDesignAccentStyle(accent)} aria-label="Support reply and CRM proposal preview"
    onPointerDownCapture={(event) => pauseForInput(event.target)} onKeyDownCapture={(event) => pauseForInput(event.target)}>
    <DiffViewer mode="text" before={activeReply.before} after={activeReply.after} title={activeReply.title} icon={<Mail aria-hidden="true" />}
      view={view} onViewChange={setView} hideWhitespace={hideWhitespace} onHideWhitespaceChange={setHideWhitespace} collapseThreshold={3} />
    <DiffViewer mode="fields" before={activeCrm.before} after={activeCrm.after} title={activeCrm.title} icon={<Database aria-hidden="true" />}
      interactive decisions={current.decisions} onDecisionsChange={(decisions) => setState((previous) => ({ ...previous, decisions, phase: "idle", announcement: "Review decision updated. Apply affects the local preview only." }))}
      disabled={locked} toolbarStatus={toolbarStatus} toolbarActions={<div className="ail-diff-demo-actions">
        {current.phase === "applied" ? <>
          <span className="ail-diff-demo-applied"><Check aria-hidden="true" />Applied {acceptedFields.length} locally{fields.length > acceptedFields.length ? ` · skipped ${fields.length - acceptedFields.length}` : ""}</span>
          <Button type="button" variant="ghost" size="sm" className="ail-diff-demo-button" onClick={() => setState((previous) => ({ ...previous, phase: "idle", record: null,
            operation: previous.operation + 1, announcement: "Local preview restored. Your review decisions are kept; no HubSpot data was changed." }))}>
            <Undo2 aria-hidden="true" />Undo</Button>
        </> : <>
          <Button type="button" variant="ghost" size="sm" className="ail-diff-demo-button" disabled={locked || !fields.length} onClick={() => decideAll("reject")}>Reject all</Button>
          <Button type="button" variant="outline" size="sm" className="ail-diff-demo-button" disabled={locked || !fields.length} onClick={() => decideAll("accept")}>Accept all</Button>
          <Button type="button" size="sm" className="ail-diff-demo-button" disabled={locked || !acceptedFields.length} aria-busy={current.phase === "applying"} onClick={() => void apply()}>
            {current.phase === "applying" ? "Applying…" : `Apply${acceptedFields.length ? ` ${acceptedFields.length}` : ""}`}</Button>
        </>}
      </div>} />
    <div className="ail-diff-demo-footer">
      <p className="ail-diff-demo-note">Preview only. Apply and Undo update a local record; no HubSpot data is changed.</p>
      {current.phase === "error" && <p className="ail-diff-demo-error" role="alert">The local preview could not be updated. Try Apply again.</p>}
      {current.record && <details className="ail-diff-demo-record"><summary>View local record</summary>
        <dl>{Object.entries(current.record).map(([field, value]) => <div key={field}><dt>{field}</dt><dd>{value}</dd></div>)}</dl>
      </details>}
      <div className="ail-diff-demo-tools">
        <Button type="button" variant="ghost" size="sm" className="ail-diff-demo-button" data-walkthrough-control
          aria-pressed={playing} disabled={reduced} onClick={() => setPlaying((previous) => !previous)}>
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {playing ? "Pause walkthrough" : "Play walkthrough"}</Button>
        {(updatedReply || updatedCrm) && <Button type="button" variant="outline" size="sm" className="ail-diff-demo-button" onClick={() => {
          setReplacement((previous) => !previous);
          setState((previous) => ({ ...previous, operation: previous.operation + 1, phase: "idle", record: null, decisions: {}, announcement: "Replacement proposal loaded. Review its changes again." }));
        }}>{replacement ? "Restore proposal" : "Replace proposal"}</Button>}
        {reduced && <span className="ail-diff-demo-note">Walkthrough paused for reduced motion.</span>}
      </div>
    </div>
    <p className="ail-diff-demo-sr" data-testid="diff-demo-status" role="status" aria-live="polite">{current.announcement}</p>
  </section>;
}
