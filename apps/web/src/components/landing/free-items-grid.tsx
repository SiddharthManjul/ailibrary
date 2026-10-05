"use client";

import { useState, useSyncExternalStore } from "react";
import { home } from "@content/home";
import { CopyButton } from "./copy-button";
import { Icon, Trio } from "./parts";
import { useDemoClock } from "./use-demo-clock";

function subscribeTouch(callback: () => void) {
  const query = window.matchMedia("(hover: none)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function FreeItemsGrid() {
  const touch = useSyncExternalStore(subscribeTouch, () => window.matchMedia("(hover: none)").matches, () => false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const { ref, elapsed, reduced } = useDemoClock("free", { running: touch && hovered === null && focused === null });
  const active = Math.floor(elapsed / 2600) % home.freeItems.length;
  return (
    <div ref={ref} className="lp-free">
      {home.freeItems.map((item, index) => (
        <article key={item[3]} tabIndex={0} className={`lp-fc ${reduced || hovered === index || focused === index || (touch && active === index) ? "is-res" : ""}`} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocusCapture={() => setFocused(index)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null); }} aria-label={`${item[3]} preview`}>
          <div className="lp-fc-th">
            <pre className="lp-ascii" aria-hidden="true">{item[11]}</pre>
            <div className="lp-prev" aria-hidden="true">
              {item[6] === 0 && <div className="lp-mp"><div className="lp-mp-row"><span className="lp-mp-n is-f"><Icon name="mail" /></span><span className="lp-mp-e" /><span className="lp-mp-n"><Icon name="spark" /></span><span className="lp-mp-e" /><span className="lp-mp-n"><Icon name="db" /></span></div><div className="lp-mp-cap">{item[7]}</div></div>}
              {item[6] === 1 && <div className="lp-mp">{[item[8], item[9], item[10]].map((line, lineIndex) => <div className={`lp-mp-li ${lineIndex === 2 ? "is-dim" : ""}`} key={line}><i />{line}<span>{lineIndex === 2 ? "next" : "ok"}</span></div>)}</div>}
              {item[6] === 2 && <div className="lp-mp lp-mp-k"><span>{item[8]}</span><b>{item[9]}</b><svg viewBox="0 0 100 36" preserveAspectRatio="none"><path d="M0 30 L14 26 L28 28 L42 20 L56 22 L70 12 L84 14 L100 4" vectorEffect="non-scaling-stroke" /></svg></div>}
            </div>
          </div>
          <div className="lp-fc-b"><div className="lp-fc-top"><span className="lp-tag">{item[0]}</span><Trio kit={item[1]} />{item[2]}</div><b>{item[3]}</b><p>{item[4]}</p><div className="lp-cmd"><span><b>$</b>{item[5]}</span><CopyButton text={item[5]} /></div></div>
        </article>
      ))}
    </div>
  );
}
