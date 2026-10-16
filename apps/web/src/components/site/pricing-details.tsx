import { Icon } from "./shared";
import { formatMoney, PRICES, STUDIO_OFFERS, TEAM_SEATS_INCLUDED, TEAM_SEATS_MAX } from "@/lib/pricing";

const TEAM_PERKS = [
  ["Own accounts and tokens", "Invite by email; every person gets their own CLI and MCP token."],
  ["Organisation-wide licence", "Use everything across every project the team ships."],
  ["Priority fixes", "Team issues jump the queue on the nightly fix list."],
  ["A free 30-minute fit call", "We look at your stack and tell you which kit to start with."],
] as const;

export function PricingTeamAndComparison() {
  const teamRows = [["One niche kit", PRICES.kit], ["Any library", PRICES.ui], ["All-Access", PRICES.all]] as const;
  const comparison = [
    ["Workflows", "10", "60 (Workflows)", "12 for one team", "60"],
    ["Agents, in four forms", "3", "50 (Agents)", "10 for one team", "50"],
    ["UI components and blocks", "15", "100 (UI)", "Dashboard + its components", "100"],
    ["Wired together on seed data", "·", "·", "Yes", "Yes"],
    ["CLI, registry and MCP install", "Yes", "Yes", "Yes", "Yes"],
    ["New drops and fixes", "Fixes", "12 months", "12 months", "12 months, every library"],
    ["Commercial and client work", "Yes", "Yes", "Yes", "Yes"],
    ["Price, individual", formatMoney(0), formatMoney(PRICES.ui.solo), formatMoney(PRICES.kit.solo), formatMoney(PRICES.all.solo)],
    [`Price, team of ${TEAM_SEATS_INCLUDED}`, formatMoney(0), formatMoney(PRICES.ui.team), formatMoney(PRICES.kit.team), formatMoney(PRICES.all.team)],
  ];

  return <>
    <section className="st-psec"><div className="st-pgh"><h2>For your team</h2><span>{TEAM_SEATS_INCLUDED} seats included; add more any time, up to {TEAM_SEATS_MAX}</span></div><div className="st-team">
      <ul className="lp-ck st-team-ck">{TEAM_PERKS.map(([title, description]) => <li key={title}><span className="lp-ck-i"><Icon name="check" /></span><div><b>{title}</b><span>{description}</span></div></li>)}</ul>
      <div className="lp-tbl st-rtbl" role="table" aria-label="Team plan prices" tabIndex={0}><div className="lp-tr is-h" role="row">{["Plan", "Individual", `Team of ${TEAM_SEATS_INCLUDED}`, "Extra seats", "Renewal"].map((label, index) => <span className={index ? "is-num" : undefined} role="columnheader" key={label}>{label}</span>)}</div>{teamRows.map(([name, price]) => <div className="lp-tr" role="row" key={name}><span className="lp-tr-n" role="rowheader">{name}</span><span className="is-num" role="cell">{formatMoney(price.solo)}</span><span className="is-num" role="cell">{formatMoney(price.team)}</span><span className="is-num" role="cell">{formatMoney(price.seat)} a seat</span><span className="is-num" role="cell">{formatMoney(price.renew)}/yr</span></div>)}</div>
    </div><p className="st-small">Above {TEAM_SEATS_MAX} seats, Enterprise runs through Studio, with onboarding and support in the agreement.</p></section>
    <section className="st-psec"><div className="st-pgh"><h2>Compare plans</h2><span>What each plan includes</span></div><div className="lp-tbl st-ctbl" role="table" aria-label="Compare plans" tabIndex={0}>
      <div className="lp-tr is-h" role="row">{["Feature", "Free", "Library", "Kit", "All-Access"].map((label) => <span role="columnheader" key={label}>{label}</span>)}</div>
      {comparison.map(([label, ...values]) => <div className="lp-tr" role="row" key={label}><span className="lp-tr-n" role="rowheader">{label}</span>{values.map((value, index) => <span role="cell" className={index === values.length - 1 || value === "Yes" ? "st-y" : undefined} key={index}>{value}</span>)}</div>)}
    </div></section>
  </>;
}

export function PricingStudio() {
  return <section className="st-psec" id="studio"><div className="st-pgh"><h2>Studio</h2><span>Fixed scope, fixed price, built to the same tests as the catalog</span></div><div className="st-studio">{STUDIO_OFFERS.map((offer) => <div className="lp-so" key={offer.title}><span className="lp-so-n">from {formatMoney(offer.price)}{offer.monthly ? " a month" : ""}</span><b>{offer.title}</b><p>{offer.description}</p></div>)}</div></section>;
}
