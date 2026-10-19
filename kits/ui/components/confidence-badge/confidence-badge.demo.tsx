"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useControllableState } from "../../../packages/ui-foundation/src/hooks/use-controllable-state";
import { useReducedMotion } from "../../../packages/ui-foundation/src/hooks/use-reduced-motion";
import { getDesignAccentStyle, type DesignAccent } from "../../../packages/ui-foundation/src/design-accent";
import { ConfidenceBadge, type ConfidenceThresholds } from "./confidence-badge";
import "./confidence-badge.demo.css";

export interface ConfidenceInvoiceField {
  id: string;
  label: string;
  value: string;
  confidence: number | null;
  reasons: readonly string[];
}

export interface ConfidenceBadgeDemoProps {
  rows: readonly ConfidenceInvoiceField[];
  updatedRows?: readonly ConfidenceInvoiceField[];
  reviewThreshold?: number;
  defaultReviewThreshold?: number;
  onReviewThresholdChange?: (threshold: number) => void;
  thresholds?: ConfidenceThresholds;
  accent?: DesignAccent;
  className?: string;
}

const reviewOptions = [0.5, 0.7, 0.8, 0.9] as const;
const examples = [0.94, 0.71, 0.38, null] as const;
const classification = { high: 0.85, medium: 0.6 };
const hasScore = (value: number | null): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
const fingerprint = (row: ConfidenceInvoiceField) => JSON.stringify([row.value, row.confidence]);
function subscribeVisibility(change: () => void) {
  document.addEventListener("visibilitychange", change);
  return () => document.removeEventListener("visibilitychange", change);
}
const isVisible = () => document.visibilityState === "visible";
const serverVisible = () => false;

/** The invoice scene receives seed data. Human checks never rewrite model confidence. */
export function ConfidenceBadgeDemo({ rows, updatedRows, reviewThreshold, defaultReviewThreshold = 0.8,
  onReviewThresholdChange, thresholds = classification, accent = "mono", className }: ConfidenceBadgeDemoProps) {
  const [threshold, setThreshold] = useControllableState({ value: reviewThreshold, defaultValue: defaultReviewThreshold, onChange: onReviewThresholdChange });
  const safeThreshold = hasScore(threshold) ? threshold : 0.8;
  const [replacement, setReplacement] = useState(false);
  const activeRows = replacement && updatedRows ? updatedRows : rows;
  const sourceKey = JSON.stringify(activeRows.map((row) => [row.id, fingerprint(row)]));
  const [verification, setVerification] = useState<{ sourceKey: string; checked: Record<string, string> }>(() => ({ sourceKey, checked: {} }));
  const checked = verification.sourceKey === sourceKey ? verification.checked : Object.fromEntries(activeRows
    .filter((row) => verification.checked[row.id] === fingerprint(row)).map((row) => [row.id, fingerprint(row)]));
  // Reconcile before commit so a changed field cannot inherit a stale human check.
  if (verification.sourceKey !== sourceKey) setVerification({ sourceKey, checked });
  const [openId, setOpenId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(true);
  const visible = useSyncExternalStore(subscribeVisibility, isVisible, serverVisible);
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const thresholdLabelId = useId();
  const reviewCount = activeRows.filter((row) => !checked[row.id] && (!hasScore(row.confidence) || row.confidence < safeThreshold)).length;
  const summary = !activeRows.length ? "No extracted fields. Nothing is routed for review." : reviewCount
    ? `${reviewCount} ${reviewCount === 1 ? "field goes" : "fields go"} to a person at ${safeThreshold.toFixed(1)}. The rest post on their own.`
    : `Every field clears ${safeThreshold.toFixed(1)}. Nothing waits for a person.`;

  useEffect(() => {
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false));
    if (root.current && observer) observer.observe(root.current);
    return () => observer?.disconnect();
  }, []);

  // An explicitly started walkthrough shows explanations and routing thresholds;
  // it never simulates a person's approval or changes the supplied extraction.
  useEffect(() => {
    if (!playing || reduced || !visible || !inView || !activeRows.length) return;
    const timer = setTimeout(() => {
      const current = step % 6;
      if (current === 0) setOpenId(activeRows[3]?.id ?? activeRows[0]!.id);
      if (current === 1) setThreshold(0.5);
      if (current === 2) setThreshold(0.9);
      if (current === 3) { setThreshold(0.8); setOpenId(activeRows[2]?.id ?? activeRows[0]!.id); }
      if (current === 4) setOpenId(null);
      if (current === 5) setOpenId(activeRows[2]?.id ?? activeRows[0]!.id);
      setStep((previous) => previous + 1);
    }, 1800);
    return () => clearTimeout(timer);
  }, [playing, reduced, visible, inView, activeRows, threshold, openId, setThreshold, step]);

  const verify = (row: ConfidenceInvoiceField, next: boolean) => {
    setVerification((previous) => {
      const nextChecked = { ...previous.checked };
      if (next) nextChecked[row.id] = fingerprint(row);
      else delete nextChecked[row.id];
      return { sourceKey, checked: nextChecked };
    });
    setAnnouncement(`${row.label} ${next ? "marked as checked" : "check undone"}. The model confidence is unchanged.`);
  };
  const pauseForInput = (target: EventTarget | null) => {
    if (target instanceof Element && target.closest("[data-walkthrough-control]")) return;
    setPlaying(false);
  };
  const walkthroughActive = playing && !reduced && visible && inView && activeRows.length > 0;

  return <section ref={root} className={`ail-cf-demo${className ? ` ${className}` : ""}`} data-ui-design data-slot="confidence-badge-demo"
    data-testid="confidence-badge-demo" data-autoplay={walkthroughActive ? "playing" : "paused"} style={getDesignAccentStyle(accent)}
    aria-label="Invoice confidence preview" onPointerDownCapture={(event) => pauseForInput(event.target)} onKeyDownCapture={(event) => pauseForInput(event.target)}>
    <div className="ail-cf-demo-top">
      <div className="ail-cf-demo-examples" aria-label="Confidence levels">
        {examples.map((value, index) => <ConfidenceBadge key={index} value={value} thresholds={thresholds} />)}
      </div>
      <div className="ail-cf-demo-threshold">
        <span className="ail-cf-demo-threshold-label" id={thresholdLabelId}>Ask a person below</span>
        <div className="ail-cf-demo-segmented" role="group" aria-labelledby={thresholdLabelId}>
          {reviewOptions.map((option) => <button key={option} type="button" aria-pressed={safeThreshold === option}
            onClick={() => { setThreshold(option); setAnnouncement(`Review threshold changed to ${option.toFixed(1)}.`); }}>{option.toFixed(1)}</button>)}
        </div>
      </div>
    </div>
    <div className="ail-cf-demo-table-frame">
      <table className="ail-cf-demo-table" aria-label="Invoice field confidences">
        <colgroup><col className="ail-cf-demo-field-column" /><col /><col className="ail-cf-demo-confidence-column" /></colgroup>
        <thead><tr><th scope="col">Field</th><th scope="col">Extracted</th><th scope="col">Confidence</th></tr></thead>
        <tbody>{activeRows.length ? activeRows.map((row) => {
          const verified = Boolean(checked[row.id]);
          const review = !verified && (!hasScore(row.confidence) || row.confidence < safeThreshold);
          const canVerify = hasScore(row.confidence) && row.confidence < thresholds.high;
          return <tr key={row.id} data-testid={`confidence-row-${row.id}`} data-review={review ? "true" : "false"} data-checked={verified ? "true" : "false"}>
            <th scope="row">{row.label}</th>
            <td><span className="ail-cf-demo-value"><span>{row.value || "·"}</span>{review && <em className="ail-cf-demo-review">Review</em>}
              {verified && <em className="ail-cf-demo-checked"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>Checked</em>}</span></td>
            <td><ConfidenceBadge value={row.confidence} thresholds={thresholds} reasons={row.reasons} reviewThreshold={safeThreshold}
              data-testid={`confidence-${row.id}`} open={openId === row.id} onOpenChange={(open) => setOpenId(open ? row.id : null)}
              detailsFooter={canVerify || verified ? <div className="ail-cf-demo-verification">
                {verified && <span className="ail-cf-demo-verified-note">Checked by you. Model confidence is unchanged.</span>}
                <Button type="button" variant={verified ? "ghost" : "outline"} size="sm" className="ail-cf-demo-check"
                  onClick={() => verify(row, !verified)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {verified ? <><path d="M3 10h12a6 6 0 0 1 0 12" /><path d="m3 10 5-5M3 10l5 5" /></> : <path d="m5 12 4 4L19 6" />}</svg>{verified ? "Undo check" : "Mark as checked"}</Button>
              </div> : undefined} /></td>
          </tr>;
        }) : <tr><td colSpan={3} className="ail-cf-demo-empty">No extracted fields.</td></tr>}</tbody>
      </table>
    </div>
    <p className="ail-cf-demo-summary" data-testid="confidence-review-summary">{summary}</p>
    <div className="ail-cf-demo-tools">
      <Button type="button" variant="ghost" size="sm" className="ail-cf-demo-walkthrough" data-walkthrough-control
        aria-pressed={playing} disabled={reduced || !activeRows.length} onClick={() => setPlaying((current) => !current)}>
        <svg viewBox="0 0 12 12" aria-hidden="true">{playing ? <path d="M3 2v8M8 2v8" fill="none" stroke="currentColor" strokeWidth="2" /> : <path d="m3 2 7 4-7 4Z" fill="currentColor" />}</svg>
        {playing ? "Pause walkthrough" : "Play walkthrough"}
      </Button>
      {updatedRows && <Button type="button" variant="outline" size="sm" className="ail-cf-demo-replace" onClick={() => {
        setReplacement((current) => !current); setOpenId(null); setAnnouncement(replacement ? "Original extraction restored." : "Updated extraction loaded. Changed fields need a new human check.");
      }}>{replacement ? "Restore extraction" : "Replace extraction"}</Button>}
      {reduced && <span className="ail-cf-demo-motion-note">Walkthrough paused for reduced motion.</span>}
    </div>
    <p className="ail-cf-demo-sr" role="status" aria-live="polite">{announcement}</p>
  </section>;
}
