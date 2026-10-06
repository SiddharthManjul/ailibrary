"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { home } from "@content/home";

import { Frame, Icon, Trio } from "./parts";
import { useDemoClock } from "./use-demo-clock";

const STEP_DURATIONS = [3400, 4300, 5600, 4300] as const;
const STEP_STARTS = [0, 3400, 7700, 13300] as const;
const STORY_DURATION = 17600;
const MANUAL_STAGE_TIMES = [3000, 3800, 3000, 1500] as const;

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function KitsStoryDemo() {
  const [editing, setEditing] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [approvedKey, setApprovedKey] = useState<string | null>(null);
  const [position, setPosition] = useState({ kit: 0, offset: 0, started: 0, generation: 0, manual: false });
  const [reducedStep, setReducedStep] = useState(3);
  const { ref, elapsed, reduced, paused } = useDemoClock("kits", { running: editing === null });
  const totalElapsed = position.offset + Math.max(0, elapsed - position.started);
  const cycle = Math.floor(totalElapsed / STORY_DURATION);
  const storyElapsed = totalElapsed % STORY_DURATION;
  const kitIndex = (position.kit + cycle) % home.kitsStory.length;
  const kit = home.kitsStory[kitIndex] ?? home.kitsStory[0];
  const stepIndex = reduced
    ? reducedStep
    : Math.max(0, STEP_STARTS.findLastIndex((started) => storyElapsed >= started));
  const stepElapsed = reduced ? 1_000_000 : position.manual && cycle === 0 && (paused || editing !== null) ? MANUAL_STAGE_TIMES[stepIndex] ?? MANUAL_STAGE_TIMES[0] : storyElapsed - (STEP_STARTS[stepIndex] ?? 0);
  const step = kit.steps[stepIndex] ?? kit.steps[0];
  const runKey = `${kit.slug}:${position.generation + cycle}`;
  const approved = approvedKey === runKey || stepElapsed >= 4400;
  const preview = edits[runKey] ?? kit.prev;
  const dashboardProgress = 1 - Math.pow(1 - clampProgress((stepElapsed - 200) / 1000), 3);

  function selectKit(nextKit: number) {
    setPosition({ kit: nextKit, offset: 0, started: elapsed, generation: position.generation + cycle + 1, manual: true });
    setReducedStep(3);
    setEditing(null);
    setApprovedKey(null);
  }

  function selectStep(nextStep: number) {
    setPosition({ kit: kitIndex, offset: STEP_STARTS[nextStep] ?? 0, started: elapsed, generation: position.generation + cycle + 1, manual: true });
    setReducedStep(nextStep);
    setEditing(null);
    setApprovedKey(null);
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % home.kitsStory.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex + home.kitsStory.length - 1) % home.kitsStory.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = home.kitsStory.length - 1;
    else return;
    event.preventDefault();
    selectKit(nextIndex);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']")[nextIndex]?.focus();
  }

  function approve() {
    setApprovedKey(runKey);
    setEditing(null);
    if (!reduced) {
      setPosition({ kit: kitIndex, offset: STEP_STARTS[3] - 1500, started: elapsed, generation: position.generation + cycle, manual: false });
    }
  }

  return (
    <div ref={ref} className="lp-kits-demo">
      <div className="lp-kt-bar">
        <div className="lp-kt-tabs" role="tablist" aria-label="Kit demonstrations">
          {home.kitsStory.map((tabKit, index) => (
            <button
              key={tabKit.slug}
              id={`kit-tab-${tabKit.slug}`}
              className={`lp-kt-tab ${index === kitIndex ? "is-on" : ""}`}
              type="button"
              role="tab"
              aria-selected={index === kitIndex}
              aria-controls="kit-story-panel"
              tabIndex={index === kitIndex ? 0 : -1}
              onClick={() => selectKit(index)}
              onKeyDown={(event) => handleTabKey(event, index)}
            >
              <Trio kit={tabKit.slug} />
              {tabKit.name}
              <span className="lp-kt-tabbar" style={{ width: `${index === kitIndex ? (reduced ? 100 : clampProgress(storyElapsed / STORY_DURATION) * 100) : 0}%` }} />
            </button>
          ))}
        </div>
        <div className="lp-kt-meta">running on <b>Fieldline</b> seed data · {kit.name} kit · step {stepIndex + 1} of 4</div>
      </div>

      <div className="lp-kt" id="kit-story-panel" role="tabpanel" aria-labelledby={`kit-tab-${kit.slug}`}>
        <ol className="lp-kt-steps" aria-label={`${kit.name} kit steps`}>
          {kit.steps.map((storyStep, index) => {
            const fill = index < stepIndex ? 100 : index === stepIndex ? clampProgress(stepElapsed / (STEP_DURATIONS[index] ?? STEP_DURATIONS[0])) * 100 : 0;
            return (
              <li key={`${kit.slug}-${index}`}>
                <button
                  className={`lp-kt-step ${index === stepIndex ? "is-on" : index < stepIndex ? "is-done" : ""}`}
                  type="button"
                  aria-current={index === stepIndex ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${storyStep[1]}`}
                  onClick={() => selectStep(index)}
                >
                  <span className="lp-kt-sn">0{index + 1}</span>
                  <span className="lp-kt-sb">
                    <span className="lp-tag">{storyStep[0]}</span>
                    <span className="lp-kt-st">{storyStep[1]}</span>
                    <span className="lp-kt-sd"><span>{storyStep[2]}</span></span>
                  </span>
                  <span className="lp-kt-sp" aria-hidden="true"><i style={{ height: `${fill}%`, "--f": `${fill}%` } as CSSProperties} /></span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="lp-kt-cap lp-sub"><b>{step[1]}</b>{step[2]}</p>

        <Frame className="lp-kt-stage" title={`fieldline / ${kit.slug}-kit`} tag={step[0]}>
          <div className="lp-kt-body">
            <div className={`lp-kp lp-kp-in ${stepIndex === 0 ? "is-on" : ""}`} aria-hidden={stepIndex !== 0} inert={stepIndex !== 0}>
              <div className="lp-in-card">
                <div className="lp-in-h"><b>{kit.inTitle}</b><span>{kit.inSrc}</span></div>
                {kit.inFields.map((field, index) => {
                  const startsAt = 150 + index * 520;
                  const progress = clampProgress((stepElapsed - startsAt) / 420);
                  return (
                    <div className="lp-in-f" key={field[0]}>
                      <span className="lp-in-label">{field[0]}</span>
                      <div className="lp-in-v">{field[1].slice(0, Math.floor(field[1].length * progress))}<i className={`lp-caret ${stepElapsed >= startsAt && progress < 1 ? "is-on" : ""}`} aria-hidden="true" /></div>
                    </div>
                  );
                })}
                <div className={`lp-in-btn ${stepElapsed >= 2350 ? "is-on" : ""}`}>{kit.inBtn}</div>
              </div>
              <div className={`lp-in-foot ${stepElapsed >= 2650 ? "is-on" : ""}`}><i aria-hidden="true" />{kit.inFoot}</div>
            </div>

            <div className={`lp-kp lp-kp-wf ${stepIndex === 1 ? "is-on" : ""}`} aria-hidden={stepIndex !== 1} inert={stepIndex !== 1}>
              <div className="lp-kf-file"><Icon name="bolt" />{kit.flowFile}</div>
              <div className="lp-kf-row">
                {kit.nodes.map((node, index) => {
                  const started = 250 + index * 520;
                  return (
                    <div key={node[0]} className={`lp-kf-n ${stepElapsed >= started + 520 ? "is-done" : stepElapsed >= started ? "is-run" : ""}`}>
                      <i><Icon name={node[2]} /></i><b>{node[0]}</b><em>{node[1]}</em>
                    </div>
                  );
                })}
              </div>
              <div className="lp-kf-out">
                {kit.out.map((result, index) => <div key={result[0]} className={`lp-kf-o ${stepElapsed >= 2900 + index * 220 ? "is-on" : ""}`}><span>{result[0]}</span><b>{result[1]}</b></div>)}
              </div>
            </div>

            <div className={`lp-kp lp-kp-ag ${stepIndex === 2 ? "is-on" : ""}`} aria-hidden={stepIndex !== 2} inert={stepIndex !== 2}>
              <div className="lp-ka-run">
                <div className="lp-ka-h"><span className={`lp-ka-dot ${stepElapsed < 2500 ? "is-on" : ""}`} />agents/{kit.agName}<span className="lp-ka-ms">{(Math.min(stepElapsed, 2400) / 1000).toFixed(1)}s</span></div>
                {kit.calls.map((call, index) => {
                  const startsAt = 200 + index * 560;
                  const finished = stepElapsed >= startsAt + 460;
                  return (
                    <div key={call[0]} className={`lp-tc ${finished ? "is-done" : stepElapsed >= startsAt ? "is-run" : ""}`}>
                      <i className="lp-tc-s" aria-hidden="true" /><code>{call[0]}</code><span className="lp-tc-a">{call[1]}</span><span className="lp-tc-ms">{finished ? call[2] : stepElapsed >= startsAt ? "..." : ""}</span>
                    </div>
                  );
                })}
              </div>
              <div className={`lp-ap ${stepElapsed >= 2500 ? "is-show" : ""} ${approved ? "is-done" : ""}`} inert={stepElapsed < 2500}>
                <div className="lp-ap-h"><Icon name="shield" /><span>Approval needed</span><span className="lp-ap-who">{kit.who}</span></div>
                <div className="lp-ap-t">{kit.ask}</div>
                {editing === runKey ? (
                  <label className="lp-approval-editor">
                    <span className="sr-only">Edit the agent draft</span>
                    <textarea className="lp-approval-edit" value={preview} onChange={(event) => setEdits((current) => ({ ...current, [runKey]: event.target.value }))} autoFocus />
                  </label>
                ) : <div className="lp-ap-p">{preview}</div>}
                <div className="lp-ap-a">
                  <button type="button" className="lp-ap-no" onClick={() => setEditing(editing === runKey ? null : runKey)}>{editing === runKey ? "Save draft" : "Edit"}</button>
                  <button type="button" className="lp-ap-yes" onClick={approve}>Approve</button>
                </div>
                <div className="lp-ap-done" role={approved && stepIndex === 2 ? "status" : undefined}><Icon name="check" />{approvedKey === runKey ? "Approved by you · ready to send" : kit.done}</div>
              </div>
            </div>

            <div className={`lp-kp lp-kp-ui ${stepIndex === 3 ? "is-on" : ""}`} aria-hidden={stepIndex !== 3} inert={stepIndex !== 3}>
              <div className="lp-kd-top"><span>components/{kit.dashFile}</span><span className="lp-live"><i />LIVE</span></div>
              <div className="lp-kd-kpis">
                {kit.kpis.map((metric) => <div className="lp-kd-k" key={metric[0]}><span>{metric[0]}</span><b>{metric[1]}{(metric[2] * dashboardProgress).toFixed(metric[4])}{metric[3]}</b></div>)}
              </div>
              <div className="lp-kd-tbl" role="table" aria-label={`${kit.name} dashboard`}>
                <div className="lp-kd-tr is-h" role="row">{kit.cols.map((column) => <span role="columnheader" key={column}>{column}</span>)}</div>
                {kit.rows.map((row, index) => <div className={`lp-kd-tr ${index === 0 && stepElapsed >= 500 ? "is-new" : ""}`} role="row" key={row[0]}>{row.map((value, columnIndex) => <span role="cell" key={columnIndex}>{value}</span>)}</div>)}
              </div>
            </div>
          </div>
        </Frame>
      </div>

      <div className="lp-kt-inside">
        <div className="lp-kt-in-l">
          <span className="lp-kt-in-k">Inside the {kit.name} kit</span>
          <div className="lp-kt-counts">
            {[[12, "workflows", "/workflows"], [10, "agents", "/agents"], [1, "dashboard", "/ui"], [kit.comps, "components", "/ui"]].map(([count, label, href]) => <Link prefetch={false} className="lp-kt-c" key={label} href={`${href}?kit=${kit.slug}`}><b>{count}</b><span>{label}</span></Link>)}
          </div>
        </div>
        <div className="lp-kt-in-r"><span className="lp-kt-price">{kit.price}<em>one-time</em></span><Link prefetch={false} className="lp-btn lp-btn-p" href={`/kits/${kit.slug}`}>View the {kit.name} kit <Icon name="arrow" /></Link></div>
      </div>
    </div>
  );
}
