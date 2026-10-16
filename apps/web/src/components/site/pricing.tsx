"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { kits, siteData } from "@content/site/settings";
import {
  clampSeats,
  estimate,
  formatMoney,
  formatPriceTemplate,
  GUIDED_SETUP_PRICE,
  OWNED_VALUE,
  PRICES,
  quote,
  TEAM_SEATS_INCLUDED,
  TEAM_SEATS_MAX,
  UPGRADE_PATHS,
  type LibraryId,
  type Owned,
  type PlanId,
} from "@/lib/pricing";
import { Icon, Trio } from "./shared";
import { URLQuery } from "./url-query";

const PLAN_IDS: readonly PlanId[] = ["kit:sales", "kit:support", "kit:marketing", "kit:engineering", "kit:operations", "ui", "workflows", "agents", "all"];
const OWNED_IDS: readonly Owned[] = ["none", "kit", "lib", "two"];
const LIBRARIES: readonly { id: LibraryId; name: string; line: string }[] = [
  { id: "ui", name: "UI library", line: "50 components and 50 blocks" },
  { id: "workflows", name: "Workflows library", line: "60 workflows for n8n, Make and Zapier" },
  { id: "agents", name: "Agents library", line: "50 agents in four forms each" },
];

type Selection = { plan: PlanId; team: boolean; seats: number; owned: Owned };

function moveRadio(event: KeyboardEvent<HTMLDivElement>) {
  if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button[role='radio']"));
  const current = buttons.findIndex((button) => button === event.target);
  if (current < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + buttons.length) % buttons.length;
  buttons[next]?.focus();
  buttons[next]?.click();
}

export function PricingPage({ beforeEstimate, afterEstimate }: { beforeEstimate?: ReactNode; afterEstimate?: ReactNode }) {
  const router = useRouter();
  const [queryString, setQueryString] = useState("");
  const searchParams = new URLSearchParams(queryString);
  const requestedPlan = searchParams.get("plan");
  const requestedOwned = searchParams.get("owned");
  const selection: Selection = {
    plan: PLAN_IDS.includes(requestedPlan as PlanId) ? requestedPlan as PlanId : "kit:sales",
    team: searchParams.get("team") === "1",
    seats: clampSeats(Number(searchParams.get("seats") || TEAM_SEATS_INCLUDED)),
    owned: OWNED_IDS.includes(requestedOwned as Owned) ? requestedOwned as Owned : "none",
  };
  const rememberedSeats = useRef(selection.seats);
  const pendingSelection = useRef<Selection | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rate, setRate] = useState(90);
  const [checkoutNote, setCheckoutNote] = useState(false);
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);
  const order = quote(selection);
  const calculation = estimate({ ...selection, rate });
  const unit = `once · ${selection.team ? `${TEAM_SEATS_INCLUDED} seats` : "1 seat"}`;

  useEffect(() => {
    if (!isPending) pendingSelection.current = null;
  }, [isPending]);

  function update(patch: Partial<Selection> | ((current: Selection) => Partial<Selection>)) {
    const current = pendingSelection.current ?? selection;
    const next = { ...current, ...(typeof patch === "function" ? patch(current) : patch) };
    next.seats = clampSeats(next.seats);
    pendingSelection.current = next;
    if (next.team) {
      rememberedSeats.current = clampSeats(next.seats);
      try { sessionStorage.setItem("ail-pricing-seats", String(rememberedSeats.current)); } catch {}
    }
    const params = new URLSearchParams();
    if (next.plan !== "kit:sales") params.set("plan", next.plan);
    if (next.team) {
      params.set("team", "1");
      if (next.seats !== TEAM_SEATS_INCLUDED) params.set("seats", String(clampSeats(next.seats)));
    }
    if (next.owned !== "none") params.set("owned", next.owned);
    startTransition(() => router.replace(`/pricing${params.size ? `?${params.toString()}` : ""}`, { scroll: false }));
  }

  function switchSize(team: boolean) {
    const current = pendingSelection.current ?? selection;
    if (current.team) {
      rememberedSeats.current = current.seats;
      try { sessionStorage.setItem("ail-pricing-seats", String(current.seats)); } catch {}
    } else if (team) {
      try {
        const savedSeats = sessionStorage.getItem("ail-pricing-seats");
        if (savedSeats) rememberedSeats.current = clampSeats(Number(savedSeats));
      } catch {}
    }
    update({ team, seats: team ? rememberedSeats.current : current.seats });
  }

  const ownedLabels: Record<Owned, string> = {
    none: "Nothing yet",
    kit: `A kit (${formatMoney(OWNED_VALUE.kit)})`,
    lib: `A library (${formatMoney(OWNED_VALUE.lib)})`,
    two: `Two kits (${formatMoney(OWNED_VALUE.two)})`,
  };

  return <main className="st-page st-pricing" id="site-content" tabIndex={-1}><URLQuery onChange={setQueryString} /><div className="st-wrap">
    <div className="st-ph is-c">
      <h1>Pay once. <em>Keep it forever.</em></h1>
      <p>Every plan includes 12 months of new drops and fixes. After that, renew for updates or keep everything you installed.</p>
      <div className="lp-tgl st-ptgl" role="radiogroup" aria-label="Plan size" onKeyDown={moveRadio}>
        <button type="button" role="radio" aria-checked={!selection.team} tabIndex={selection.team ? -1 : 0} className={!selection.team ? "is-on" : ""} onClick={() => switchSize(false)}><Icon name="user" />Individual</button>
        <button type="button" role="radio" aria-checked={selection.team} tabIndex={selection.team ? 0 : -1} className={selection.team ? "is-on" : ""} onClick={() => switchSize(true)}><Icon name="users" />Team · {TEAM_SEATS_INCLUDED} seats</button>
      </div>
    </div>

    <div className="st-pgrid">
      <div className="st-plans">
        <div role="radiogroup" aria-label="Plan" onKeyDown={moveRadio}>
          <div className="st-pgh"><h2>Buy by team</h2><span>One niche, all three item types, wired together</span></div>
          <div className="st-pkits">{kits.map((kit) => {
            const plan = `kit:${kit.slug}` as PlanId;
            const selected = selection.plan === plan;
            return <button type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} className={`st-pk${selected ? " is-sel" : ""}`} data-testid="plan-option" data-plan={plan} onClick={() => update({ plan })} key={plan}>
              <span className="st-pk-top"><Trio colors={kit.trio} /><i className="st-radio" aria-hidden="true" /></span>
              <b>{kit.name} kit</b><span className="st-pk-l">12 workflows · 10 agents · dashboard</span>
              <span className="st-pk-p">{formatMoney(selection.team ? PRICES.kit.team : PRICES.kit.solo)}<em>{unit}</em></span>
            </button>;
          })}</div>
          <div className="st-pgh"><h2>Buy by type</h2><span>One item type across every kit</span></div>
          <div className="st-plibs">{LIBRARIES.map((library) => {
            const selected = selection.plan === library.id;
            return <button type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} className={`st-pk${selected ? " is-sel" : ""}`} data-testid="plan-option" data-plan={library.id} onClick={() => update({ plan: library.id })} key={library.id}>
              <span className="st-pk-top"><span className="st-pk-tag">Library</span><i className="st-radio" aria-hidden="true" /></span><b>{library.name}</b><span className="st-pk-l">{library.line}</span>
              <span className="st-pk-p">{formatMoney(selection.team ? PRICES[library.id].team : PRICES[library.id].solo)}<em>{unit}</em></span>
            </button>;
          })}</div>
          <button type="button" role="radio" aria-checked={selection.plan === "all"} tabIndex={selection.plan === "all" ? 0 : -1} className={`st-paa${selection.plan === "all" ? " is-sel" : ""}`} data-testid="plan-option" data-plan="all" onClick={() => update({ plan: "all" })}>
            <span className="st-paa-l"><span className="st-pk-top"><span className="lp-pc-badge" style={{ position: "static" }}>Best value</span><i className="st-radio" aria-hidden="true" /></span><b>All-Access</b><span>Every kit and every library: 60 workflows, 50 agents, 100 UI items, plus every weekly drop for 12 months. Five kits bought one by one cost {formatMoney(PRICES.kit.solo * kits.length)}.</span></span>
            <span className="st-pk-p st-paa-p">{formatMoney(selection.team ? PRICES.all.team : PRICES.all.solo)}<em>{unit}</em></span>
          </button>
        </div>
        <div className="st-free"><span className="st-free-i"><Icon name="check" /></span><div><b>Free with an email</b><p>10 workflows, 15 components and 3 agents, tested and documented exactly like the paid ones.</p></div><Link className="lp-link" href="/workflows?access=free">Browse free items <Icon name="arrow" /></Link></div>
      </div>

      <aside className="st-sum" aria-label="Order summary" data-testid="order-summary">
        <div className="st-sum-h">Order summary</div>
        <div className="st-sum-item"><b data-testid="summary-plan">{order.name}</b><span data-testid="summary-unit">{order.unitLabel}</span></div>
        {selection.team && <div className="st-seats"><span>Seats</span><div className="st-step"><button type="button" aria-label="Fewer seats" disabled={order.seats <= TEAM_SEATS_INCLUDED} onClick={() => update((current) => ({ seats: current.seats - 1 }))}><Icon name="minus" /></button><b data-testid="seats-value">{order.seats}</b><button type="button" aria-label="More seats" disabled={order.seats >= TEAM_SEATS_MAX} onClick={() => update((current) => ({ seats: current.seats + 1 }))}><Icon name="plus" /></button></div></div>}
        <div className="st-own"><span>Already own a plan?</span><div className="st-own-o">{OWNED_IDS.map((owned) => <button type="button" data-testid="owned-option" data-owned={owned} aria-pressed={selection.owned === owned} className={selection.owned === owned ? "is-on" : ""} key={owned} onClick={() => update({ owned })}>{ownedLabels[owned]}</button>)}</div></div>
        <div className="st-sum-rows">
          <div><span>Plan</span><b>{formatMoney(order.base)}</b></div>
          {order.extra > 0 && <div data-testid="summary-extra"><span>{order.extraLabel}</span><b>{formatMoney(order.extra)}</b></div>}
          {order.credit > 0 && <div className="is-credit"><span>Upgrade credit</span><b data-testid="summary-credit">−{formatMoney(order.credit)}</b></div>}
          {order.creditNote && <div className="is-note"><span>Upgrade credit applies only to a plan that costs more than what you own.</span></div>}
          <div><span>Tax</span><b className="st-mute">Added at checkout</b></div>
          <div className="is-total" aria-live="polite" aria-atomic="true"><span>Total today</span><b data-testid="summary-total">{formatMoney(order.total)}</b></div>
        </div>
        <button type="button" className="lp-btn lp-btn-p st-sum-btn" onClick={() => setCheckoutNote(true)}>Continue to checkout <Icon name="arrow" /></button>
        {checkoutNote && <p className="st-sum-note is-on" role="status">Checkout opens on Dodo Payments in the live site.</p>}
        <p className="st-sum-note">Renews at {order.renewalLabel}. Payments by Dodo Payments, merchant of record.</p>
      </aside>
    </div>

    {beforeEstimate}

    <section className="st-psec st-two" aria-label="Build estimate and upgrade credit">
      <div className="st-calc" data-testid="estimate">
        <div className="st-pgh"><h2>What building it yourself costs</h2><span>{calculation.subtitle}</span></div>
        <p data-testid="estimate-text">{calculation.text}</p>
        <div className="st-bd" role="table" aria-label="Build estimate">{calculation.rows.map((row) => <div className="st-bd-r" role="row" key={row.label}><span className="st-bd-t" role="rowheader"><b>{row.label}</b><em>{row.note}</em></span><span className="st-bd-d" role="cell">{row.count} × {row.hoursEach} h</span><span className="st-bd-h" role="cell">{row.hours.toLocaleString("en-US")} h</span></div>)}<div className="st-bd-r is-tot" role="row"><span className="st-bd-t" role="rowheader"><b>Total</b></span><span className="st-bd-d" role="cell" /><span className="st-bd-h" role="cell">{calculation.totalHours.toLocaleString("en-US")} h</span></div></div>
        <label className="st-range"><span>Your hourly rate</span><b>{formatMoney(rate)}</b><input type="range" aria-label="Your hourly rate" min={40} max={200} step={5} value={rate} onChange={(event) => setRate(Number(event.target.value))} /></label>
        <div className="st-calc-r"><div><span>Building it</span><b data-testid="estimate-cost">{formatMoney(calculation.buildCost)}</b></div><div><span>{calculation.planLabel}</span><b className="st-pp" data-testid="estimate-plan">{formatMoney(calculation.planTotal)}</b></div><div><span>Building costs</span><b data-testid="estimate-ratio">{calculation.ratioLabel}</b></div></div>
      </div>
      <div className="st-upg">
        <div className="st-pgh"><h2>Upgrade credit</h2><span>Start with one thing, move up later</span></div><p>Everything you paid in the last 12 months counts toward a higher plan.</p>
        <div className="st-upg-ex"><div><span>Sales kit</span><b>{formatMoney(PRICES.kit.solo)}</b></div><Icon name="arrow" /><div><span>All-Access</span><b>{formatMoney(PRICES.all.solo)}</b></div><span className="st-eq">=</span><div className="is-p"><span>You pay</span><b>{formatMoney(PRICES.all.solo - PRICES.kit.solo)}</b></div></div>
        <h3>Other upgrade paths</h3><div className="st-bd" role="table" aria-label="Upgrade paths">{UPGRADE_PATHS.map((path) => <div className="st-bd-r" role="row" key={path.from + path.to}><span className="st-bd-t" role="rowheader"><b>{path.from} to {path.to}</b></span><span className="st-bd-d" role="cell">{path.math}</span><span className="st-bd-h" role="cell">{formatMoney(path.pay)}</span></div>)}</div>
        <div className="st-addon"><b>Guided setup, {formatMoney(GUIDED_SETUP_PRICE)}</b><p>A 60-minute install call with the team that built the kit, on any plan.</p></div>
      </div>
    </section>

    {afterEstimate}

    <section className="st-psec st-pfaq"><div className="st-pgh"><h2>Questions</h2><span>About buying, updates and licences</span></div><div className="lp-qa" data-testid="pricing-faq">{siteData.pricingFaq.map((question, index) => {
      const expanded = openQuestion === index;
      return <div className={`lp-q${expanded ? " is-on" : ""}`} key={question.q}><button type="button" id={`pricing-question-${index}`} aria-expanded={expanded} aria-controls={`pricing-answer-${index}`} onClick={() => setOpenQuestion(expanded ? null : index)}>{question.q}<i aria-hidden="true" /></button><div className="lp-q-a" id={`pricing-answer-${index}`} role="region" aria-labelledby={`pricing-question-${index}`} aria-hidden={!expanded} inert={!expanded}><div><p>{formatPriceTemplate(question.a)}</p></div></div></div>;
    })}</div></section>
  </div></main>;
}
