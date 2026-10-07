"use client";

import { useState, type KeyboardEvent } from "react";
import { home } from "@content/home";
import { Icon } from "./parts";

export function PricingPlans() {
  const [team, setTeam] = useState(false);
  const navigate = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? false : event.key === "End" ? true : !team;
    setTeam(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next ? 1 : 0]?.focus();
  };
  return (
    <div>
      <div className="lp-pr-tg"><div className="lp-tgl" role="radiogroup" aria-label="Plan size">
        <button type="button" role="radio" aria-checked={!team} tabIndex={!team ? 0 : -1} className={!team ? "is-on" : ""} onClick={() => setTeam(false)} onKeyDown={navigate}><Icon name="user" />Individual</button>
        <button type="button" role="radio" aria-checked={team} tabIndex={team ? 0 : -1} className={team ? "is-on" : ""} onClick={() => setTeam(true)} onKeyDown={navigate}><Icon name="users" />Team · 5 seats</button>
      </div></div>
      <div className="lp-pr">
        {home.pricing.map((plan) => (
          <div className={`lp-pc ${plan.best ? "is-best" : ""}`} key={plan.k}>
            {plan.best && <span className="lp-pc-badge">Best value</span>}
            <div className="lp-pc-k">{plan.k}</div><div className="lp-pc-t">{plan.t}</div><div className="lp-pc-d">{plan.d}</div><div className="lp-pc-p"><b>{plan.p[team ? 1 : 0]}</b><span>one-time</span></div><div className="lp-pc-s">{plan.s[team ? 1 : 0]}</div>
            <ul>{plan.f.map((feature) => <li key={feature}><Icon name="check" /><span>{feature}</span></li>)}</ul>
            <a className={`lp-btn ${plan.best ? "lp-btn-p" : "lp-btn-g"}`} href={`/pricing?plan=${encodeURIComponent(plan.k.toLowerCase())}&seats=${team ? 5 : 1}`}>{plan.cta}</a>
          </div>
        ))}
      </div>
    </div>
  );
}
