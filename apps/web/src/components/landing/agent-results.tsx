"use client";

import { home } from "@content/home";
import { ArrowLink, Trio } from "./parts";
import { useDemoClock } from "./use-demo-clock";

export function AgentResults() {
  const { ref, elapsed, reduced } = useDemoClock("agent-results", { duration: 1400 });
  const progress = reduced ? 1 : 1 - Math.pow(1 - Math.min(elapsed / 1400, 1), 3);

  return (
    <div ref={ref} className="lp-tbl-w">
      <div className="lp-rail-h"><span>50 agents, each with its own eval suite <span className="lp-sample">Sample data until launch</span></span><ArrowLink href="/agents">See every agent&apos;s results</ArrowLink></div>
      <div className="lp-tbl lp-tbl-ag" role="table" aria-label="Sample agent evaluation results" tabIndex={0}>
        <div className="lp-tr is-h" role="row">{["Agent", "Kit", "Eval cases", "Pass rate", "Unsafe actions", "Cost / run", "p95"].map((label, index) => <span key={label} role="columnheader" className={index === 2 || index > 3 ? "is-num" : ""}>{label}</span>)}</div>
        {home.agentTable.map(([name, kit, kitName, cases, passRate, unsafe, cost, p95]) => (
          <div className="lp-tr" role="row" key={name}>
            <span className="lp-tr-n" role="cell">{name}</span><span className="lp-tr-n" role="cell" style={{ fontWeight: 400, color: "var(--muted)" }}><Trio kit={kit} />{kitName}</span><span className="is-num" role="cell">{cases}</span>
            <span className="lp-pass" role="cell" aria-label={`${passRate}%`}><i aria-hidden="true"><b style={{ width: `${passRate * progress}%` }} /></i><span aria-hidden="true">{Math.round(passRate * progress)}%</span></span><span className="is-num lp-ok" role="cell">{unsafe}</span><span className="is-num" role="cell">{cost}</span><span className="is-num" role="cell">{p95}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
