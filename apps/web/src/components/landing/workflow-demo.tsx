"use client";

import { useState, useSyncExternalStore } from "react";
import { home } from "@content/home";
import { Icon } from "./parts";
import { useDemoClock } from "./use-demo-clock";

type WorkflowNodeId = keyof typeof home.workflowDemo.positions.h;

const platformNames = ["n8n", "Make", "Zapier"] as const;
const platformFiles = ["inbound-lead-qualifier.n8n.json", "inbound-lead-qualifier.blueprint.json", "inbound-lead-qualifier.zap.json"] as const;

function subscribePhone(callback: () => void) {
  const media = window.matchMedia("(max-width: 640px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function phoneSnapshot() {
  return window.matchMedia("(max-width: 640px)").matches;
}

function nodeState(node: WorkflowNodeId, elapsed: number) {
  if (node === "wh") return elapsed < 450 ? "is-run" : "is-done";
  if (node === "va") return elapsed < 450 ? "" : elapsed < 950 ? "is-run" : "is-done";
  if (node === "en") return elapsed < 950 ? "" : elapsed < 1500 ? "is-run" : elapsed < 2700 ? "is-err" : elapsed < 3300 ? "is-run" : "is-done";
  if (node === "ai") return elapsed < 3300 ? "" : elapsed < 4400 ? "is-run" : "is-done";
  if (node === "if") return elapsed < 4400 ? "" : elapsed < 4800 ? "is-run" : "is-done";
  if (node === "hs") return elapsed < 4800 ? "" : elapsed < 5500 ? "is-run" : "is-done";
  if (node === "nu") return elapsed < 4800 ? "" : "is-skip";
  return "is-dl";
}

export function WorkflowDemo() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { ref, elapsed, reduced, visible, reset } = useDemoClock("workflow", { running: !hovered && !focused });
  const [selectedPlatform, setSelectedPlatform] = useState<number | null>(null);
  const phone = useSyncExternalStore(subscribePhone, phoneSnapshot, () => false);
  const platform = selectedPlatform ?? (reduced ? 0 : Math.floor(elapsed / 10500) % platformNames.length);
  const timeline = reduced ? 6000 : elapsed % 10500;
  const vertical = phone || platform === 2;
  const positions = home.workflowDemo.positions[vertical ? "v" : "h"];
  const state = timeline >= 1500 && timeline < 2700 ? "is-err" : timeline >= 5500 ? "is-ok" : "is-run";
  const status = state === "is-err" ? "429 · retrying" : state === "is-ok" ? "Succeeded · 5.5s" : "Running";
  const log = home.workflowDemo.log.filter((line) => timeline >= line[0]).slice(-4);

  function position(node: WorkflowNodeId): readonly [number, number] {
    return phone && node === "dl" ? [89, 37] : positions[node];
  }

  return (
    <div ref={ref} className="lp-frame lp-wf" role="group" aria-label="Interactive workflow demonstration" data-paused={hovered || focused || !visible || reduced} onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="lp-wf-bar">
        <div className="lp-seg" role="tablist" aria-label="Workflow platform">
          {platformNames.map((name, index) => (
            <button
              className={`lp-seg-b${platform === index ? " is-on" : ""}`}
              key={name}
              type="button"
              role="tab"
              aria-selected={platform === index}
              aria-controls="workflow-canvas"
              tabIndex={platform === index ? 0 : -1}
              onClick={() => { setSelectedPlatform(index); reset(); }}
              onKeyDown={(event) => {
                const next = event.key === "ArrowRight" ? (index + 1) % platformNames.length : event.key === "ArrowLeft" ? (index + platformNames.length - 1) % platformNames.length : event.key === "Home" ? 0 : event.key === "End" ? platformNames.length - 1 : null;
                if (next === null) return;
                event.preventDefault();
                setSelectedPlatform(next);
                reset();
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
              }}
            >{name}</button>
          ))}
        </div>
        <span className="lp-wf-file">{platformFiles[platform]}</span>
        <span className={`lp-wf-st ${state}`}><i />{status}</span>
      </div>
      <div id="workflow-canvas" role="tabpanel" aria-label={`${platformNames[platform]} workflow`} className={`lp-wf-cv is-${platformNames[platform].toLowerCase()}${vertical ? " is-zapier" : ""}${phone ? " is-phone" : ""}`}>
        <svg className="lp-wf-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {home.workflowDemo.edges.map(([source, target]) => {
            const [sourceX, sourceY] = position(source);
            const [targetX, targetY] = position(target);
            const midX = (sourceX + targetX) / 2;
            const midY = (sourceY + targetY) / 2;
            const path = target === "dl"
              ? `M${sourceX} ${sourceY} L${targetX} ${targetY}`
              : vertical
                ? `M${sourceX} ${sourceY} C${sourceX} ${midY} ${targetX} ${midY} ${targetX} ${targetY}`
                : `M${sourceX} ${sourceY} C${midX} ${sourceY} ${midX} ${targetY} ${targetX} ${targetY}`;
            const targetState = nodeState(target, timeline);
            const edgeState = target === "dl"
              ? state === "is-err" ? "is-err" : ""
              : targetState === "is-run" ? "is-flow" : targetState;
            return <path key={`${source}-${target}`} className={edgeState} d={path} style={{ d: `path("${path}")`, transition: reduced ? "none" : "d .7s cubic-bezier(.6,0,.2,1), stroke .3s, opacity .5s" }} vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
        {home.workflowDemo.nodes.map(([node, label, detail, icon]) => {
          const [left, top] = position(node);
          const branch = vertical && (node === "hs" || node === "nu");
          return (
            <div key={node} className={`lp-wn ${nodeState(node, timeline)}${branch ? " is-sm" : ""}`} style={{ left: `${left}%`, top: `${top}%` }}>
              <span className="lp-wn-i"><Icon name={icon} /></span>
              <span className="lp-wn-t"><b>{label}</b><em>{detail}</em></span>
              {node === "en" && <span className="lp-wn-bd" aria-hidden={state !== "is-err"}>429</span>}
            </div>
          );
        })}
      </div>
      <div className="lp-wf-log" role="group" aria-label="Workflow run log">
        {log.map(([at, time, node, message, className]) => (
          <div className={`lp-wf-ll ${className}${timeline - at < 400 ? " is-new" : ""}`} key={`${at}-${message}`}>
            <span>{time}</span><b>{node}</b><span>{message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
