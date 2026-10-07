"use client";

import { home } from "@content/home";
import { useDemoClock } from "./use-demo-clock";

export function NightlyResults() {
  const { ref, elapsed, reduced } = useDemoClock("nightly", { duration: 1400 });
  const progress = reduced ? 1 : 1 - Math.pow(1 - Math.min(1, elapsed / 1400), 3);
  return (
    <div ref={ref} className="lp-tbl-scroll" tabIndex={0} role="region" aria-label="Sample nightly test results. Scroll horizontally for all columns.">
      <div className="lp-tbl lp-tbl-n" role="table" aria-label="Sample nightly results">
        <div className="lp-tr is-h" role="row">{["Item", "Type", "Kit", "Pass rate", "Cost / run", "Runtime", "Last passed"].map((heading, index) => <span role="columnheader" key={heading} className={index > 3 ? "is-num" : ""}>{heading}</span>)}</div>
        {home.nightlyTable.map((row) => {
          const pass = Math.round(row[3] * progress);
          return <div className="lp-tr" role="row" key={row[0]}>
            <span role="cell" className="lp-tr-n">{row[0]}</span><span role="cell"><span className={`lp-tag ${row[1] === "UI" ? "is-mute" : ""}`}>{row[1]}</span></span><span role="cell">{row[2]}</span>
            <span role="cell" className="lp-pass"><i aria-hidden="true"><b style={{ width: `${pass}%` }} /></i><span>{pass}%</span></span><span role="cell" className="is-num">{row[4]}</span><span role="cell" className="is-num">{row[5]}</span><span role="cell" className="is-num lp-ok">today {row[6]}</span>
          </div>;
        })}
      </div>
    </div>
  );
}
