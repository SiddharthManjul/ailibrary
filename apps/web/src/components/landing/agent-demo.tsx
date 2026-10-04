"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { demoCopy, home, homeCopy } from "@content/home";
import { CopyButton } from "./copy-button";
import { Frame, Icon } from "./parts";
import { useDemoClock } from "./use-demo-clock";

type Decision = { kind: "approved" | "rejected"; at: number; timeline: number };

function tabIndexForKey(event: KeyboardEvent<HTMLButtonElement>, index: number, count: number) {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") return (index + 1) % count;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") return (index + count - 1) % count;
  if (event.key === "Home") return 0;
  if (event.key === "End") return count - 1;
  return null;
}

export function AgentDemo({ codePanels, heading }: { codePanels?: readonly ReactNode[]; heading?: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { ref, elapsed, reduced, visible, reset } = useDemoClock("agent", { running: !hovered && !focused });
  const [level, setLevel] = useState(0);
  const [form, setForm] = useState(0);
  const [manualDecision, setManualDecision] = useState<Decision | null>(null);
  const manualActive = manualDecision !== null && (reduced || elapsed < manualDecision.at + 4600);
  const cycleLength = level === 0 ? 13600 : 8200;
  const origin = manualDecision ? manualDecision.at + 4600 : 0;
  const timeline = reduced ? 10000 : manualActive ? manualDecision.timeline + elapsed - manualDecision.at : Math.max(0, elapsed - origin) % cycleLength;
  const showApproval = timeline >= 3600;
  const decision = manualActive ? manualDecision.kind : level > 0 && showApproval ? "automatic" : timeline >= 9000 ? "demo-approved" : null;
  const decidedAt = manualActive ? manualDecision.timeline : level > 0 ? 3600 : 9000;
  const replied = decision !== null && decision !== "rejected" && (reduced || timeline >= decidedAt + 900);
  const status = decision === "rejected" ? "stopped by a person" : decision ? "done · 4.1s · $0.006" : showApproval ? "waiting for approval" : timeline >= 500 ? `running · step ${Math.min(4, Math.floor((timeline - 500) / 750) + 1)} of 4` : "reading ticket";
  const policy = demoCopy.agent.policies[level] ?? demoCopy.agent.policies[0];
  const completedMessage = decision === "approved" ? "Approved by you · refund re_3Qk81 created" : decision === "demo-approved" ? "Approved by Maya Chen · refund re_3Qk81 created" : decision === "rejected" ? "Rejected · the agent drafts a reply explaining why" : "Refunded automatically · logged for review";
  const approvalClass = `${showApproval ? "is-show" : ""}${decision === "rejected" ? " is-no" : decision === "automatic" ? " is-auto" : decision ? " is-done" : ""}`;
  const activeForm = home.agentForms[form];

  function selectLevel(index: number) {
    setLevel(index);
    setManualDecision(null);
    reset();
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number, count: number, select: (index: number) => void) {
    const nextIndex = tabIndexForKey(event, index, count);
    if (nextIndex === null) return;
    event.preventDefault();
    select(nextIndex);
    const group = event.currentTarget.parentElement;
    group?.querySelectorAll<HTMLButtonElement>('[role="tab"], [role="radio"]')[nextIndex]?.focus();
  }

  return (
    <div ref={ref} className="lp-split is-rev" data-paused={hovered || focused || !visible || reduced} onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="lp-ag-l">
        <Frame title="helpdesk · ticket #9921" className="lp-hd" headerEnd={<span className={`lp-hd-st${replied ? " is-ok" : ""}`}>{replied ? "Solved" : showApproval && !decision ? "Pending approval" : "Open"}</span>}>
          <div className="lp-hd-tk"><div className="lp-hd-av">DR</div><div><b>Daniel Reyes</b><span>daniel@harborline.example · Team plan</span></div><span className="lp-hd-time">10:04</span></div>
          <div className="lp-hd-msg"><b>{demoCopy.agent.ticket.subject}</b><p>{demoCopy.agent.ticket.message}</p></div>
          <div className="lp-hd-ag">
            <div className="lp-hd-agh"><span className="lp-hd-agi"><Icon name="spark" /></span><b>refund-decision</b><span className="lp-tag">AGENT</span><span className="lp-hd-agst">{status}</span></div>
            {demoCopy.agent.toolCalls.map(([name, argument, duration], index) => {
              const start = 500 + 750 * index;
              const done = timeline >= start + 600;
              const running = timeline >= start && !done;
              return <div className={`lp-tc${done ? " is-done" : running ? " is-run" : ""}`} key={name}><i className="lp-tc-s" /><code>{name}</code><span className="lp-tc-a">{argument}</span><span className="lp-tc-ms">{done ? duration : running ? "…" : ""}</span></div>;
            })}
            <div className={`lp-ap ${approvalClass}`} aria-hidden={!showApproval}>
              <div className="lp-ap-h"><Icon name="shield" /><span>{decision === "automatic" ? "Ran alone" : "Approval needed"}</span><span className="lp-ap-who">refund.create</span></div>
              <div className="lp-ap-t">Refund $49.00 to Daniel Reyes</div><div className="lp-ap-p">{policy}</div>
              <div className="lp-ap-a"><button type="button" className="lp-ap-no" disabled={!showApproval || decision !== null} onClick={() => setManualDecision({ kind: "rejected", at: elapsed, timeline })}>Reject</button><button type="button" className="lp-ap-yes" disabled={!showApproval || decision !== null} onClick={() => setManualDecision({ kind: "approved", at: elapsed, timeline })}>Approve refund</button></div>
              <div className="lp-ap-done" role={manualActive ? "status" : undefined}><Icon name={decision === "rejected" ? "x" : "check"} />{completedMessage}</div>
            </div>
            <div className={`lp-hd-reply${replied || decision === "rejected" ? " is-on" : ""}`}><Icon name={decision === "rejected" ? "file" : "check"} />{decision === "rejected" ? "Refund stopped · explanation drafted for review" : replied ? "Reply sent to Daniel · ticket solved" : "Reply drafted"}</div>
          </div>
        </Frame>
        <a className="lp-agcat" href="/agents">
          <b className="lp-agcat-n">50</b><div className="lp-agcat-t"><b>agents, 10 per kit</b><p>{demoCopy.agent.catalogDescription}</p></div>
          <div className="lp-agcat-f">{home.agentForms.map(([name]) => <span key={name}>{name}</span>)}</div>
          <span className="lp-link">Open the catalog <Icon name="arrow" /></span>
        </a>
      </div>
      <div className="lp-split-txt">
        {heading ?? <><h2 className="lp-h2" id="ag-h">{homeCopy.agents.title} <em>{homeCopy.agents.accent}</em></h2><p className="lp-sub">{homeCopy.agents.description}</p></>}
        <div className="lp-ck-h">Every agent ships four ways</div>
        <div className="lp-code">
          <div className="lp-code-tabs">
            <div role="tablist" aria-label="Agent forms" style={{ display: "flex", alignItems: "center", gap: "calc(2 * var(--u))" }}>{home.agentForms.map(([name], index) => <button key={name} type="button" role="tab" className={form === index ? "is-on" : ""} aria-selected={form === index} aria-controls={`agent-form-${index}`} tabIndex={form === index ? 0 : -1} onClick={() => setForm(index)} onKeyDown={(event) => moveFocus(event, index, home.agentForms.length, setForm)}>{name}</button>)}</div>
            <CopyButton text={activeForm[2]} className="lp-copy" />
          </div>
          {home.agentForms.map(([name, lines], index) => <div key={name} id={`agent-form-${index}`} role="tabpanel" aria-label={name} hidden={form !== index}>{codePanels?.[index] ?? <pre className="lp-code-b"><code>{lines.map(([line, className], lineIndex) => <span className={`lp-cl ${className}`} key={lineIndex}>{line || " "}</span>)}</code></pre>}</div>)}
        </div>
        <div className="lp-ck-h">You decide what runs alone</div>
        <div className="lp-lv" role="radiogroup" aria-label="Agent autonomy">
          {home.autonomyLevels.map(([number, title, description], index) => <button key={number} type="button" role="radio" aria-checked={level === index} tabIndex={level === index ? 0 : -1} className={`lp-lv-b${level === index ? " is-on" : ""}`} onClick={() => selectLevel(index)} onKeyDown={(event) => moveFocus(event, index, home.autonomyLevels.length, selectLevel)}><span className="lp-lv-n">{number}</span><b>{title}</b><span>{description}</span></button>)}
        </div>
      </div>
    </div>
  );
}
