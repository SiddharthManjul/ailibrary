"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { home } from "@content/home";
import { CopyButton } from "./copy-button";
import { useDemoClock } from "./use-demo-clock";

const schedules = home.terminalSessions.map((session) => {
  let time = 300;
  const lines = session[1].map((line) => {
    const start = time + (line[0] === "in" ? 350 : line[0] === "tool" ? 520 : 260);
    const end = start + (line[0] === "in" ? line[2].length * 30 : 0);
    time = end + (line[0] === "in" ? 250 : 0);
    return { start, end };
  });
  return { lines, total: time, duration: time + 3200 };
});
const cycleDuration = schedules.reduce((total, schedule) => total + schedule.duration, 0);

export function InstallTerminal() {
  const [manualTab, setManualTab] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { ref, elapsed, reduced, reset } = useDemoClock("terminal", { running: manualTab === null && !hovered && !focused });
  const id = useId();
  let activeTab = manualTab ?? 0;
  let time = elapsed;
  if (manualTab === null && !reduced) {
    time %= cycleDuration;
    for (const [index, candidate] of schedules.entries()) {
      if (time < candidate.duration) { activeTab = index; break; }
      time -= candidate.duration;
    }
  }
  const session = home.terminalSessions[activeTab] ?? home.terminalSessions[0];
  const schedule = schedules[activeTab] ?? { lines: [], total: 0, duration: 3200 };
  if (reduced || manualTab !== null) time = schedule.duration;
  const copyCommand = session[1].find((line) => line[0] === "in")?.[2] ?? "";
  const pick = (index: number) => { setManualTab(index); reset(); };
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % home.terminalSessions.length;
    else if (event.key === "ArrowLeft") next = (index + home.terminalSessions.length - 1) % home.terminalSessions.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = home.terminalSessions.length - 1;
    else return;
    event.preventDefault();
    pick(next);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]");
    tabs?.[next]?.focus();
  };
  return (
    <div ref={ref} className="lp-term" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="lp-term-h">
        <span className="lp-dots" aria-hidden="true"><i /><i /><i /></span>
        <div className="lp-term-tabs" role="tablist" aria-label="Install sessions">
          {home.terminalSessions.map((item, index) => (
            <button type="button" key={item[0]} id={`${id}-tab-${index}`} role="tab" aria-controls={`${id}-panel`} aria-selected={index === activeTab} tabIndex={index === activeTab ? 0 : -1} className={index === activeTab ? "is-on" : ""} onClick={() => pick(index)} onKeyDown={(event) => navigate(event, index)}>
              {item[0]}<i style={{ width: `${index === activeTab ? Math.min(100, time / schedule.duration * 100) : 0}%` }} />
            </button>
          ))}
        </div>
        <CopyButton text={copyCommand} label="Copy command" className="lp-copy" />
      </div>
      <div className="lp-term-b" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${activeTab}`} tabIndex={0} aria-live="off">
        {session[1].map((line, index) => {
          const timing = schedule.lines[index];
          if (!timing) return null;
          if (time < timing.start) return null;
          const count = line[0] === "in" ? Math.min(line[2].length, Math.floor((time - timing.start) / 30)) : line[2].length;
          const caret = !reduced && ((line[0] === "in" && time < timing.end + 250) || (index === session[1].length - 1 && time >= schedule.total));
          return <span className={`lp-tl is-${line[0]}`} data-p={line[1]} key={`${activeTab}-${index}`}>{line[2].slice(0, count)}<i className={`lp-caret ${caret ? "is-on" : ""}`} aria-hidden="true" /></span>;
        })}
      </div>
    </div>
  );
}
