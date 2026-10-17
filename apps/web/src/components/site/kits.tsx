"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { agents, blocks, components, kits, workflows } from "@content/site/catalog";
import { formatMoney, PRICES, TEAM_SEATS_INCLUDED } from "@/lib/pricing";
import { CopyButton, Icon, Trio } from "./shared";

type Kit = (typeof kits)[number];
type KitTab = "workflows" | "agents" | "ui";
const kitComponents = ["data-grid", "kpi-stat", "approval-card", "run-timeline", "line-chart", "activity-timeline"];

function kitHighlights(kit: Kit) {
  return {
    workflow: workflows.find((item) => item.kit === kit.slug && item.slug === kit.heroWorkflow)!,
    agent: agents.find((item) => item.kit === kit.slug && item.slug === kit.heroAgent)!,
    dashboard: blocks.find((item) => item.slug === kit.dashboardBlock)!,
  };
}

function KitCard({ kit }: { kit: Kit }) {
  const [tab, setTab] = useState<KitTab>("workflows");
  const panelId = useId();
  const kitWorkflows = workflows.filter((item) => item.kit === kit.slug);
  const kitAgents = agents.filter((item) => item.kit === kit.slug);
  const { workflow, agent, dashboard } = kitHighlights(kit);
  const counts = [{ value: kitWorkflows.length, label: "workflows" }, { value: kitAgents.length, label: "agents" }, { value: 1, label: "dashboard" }, { value: kit.components, label: "components" }];
  const chain = [{ title: workflow.title, type: "Workflow", icon: "bolt" }, { title: agent.title, type: "Agent", icon: "spark" }, { title: dashboard.title, type: "UI", icon: "layers" }];
  const tabs: { value: KitTab; label: string; count: number }[] = [{ value: "workflows", label: "Workflows", count: kitWorkflows.length }, { value: "agents", label: "Agents", count: kitAgents.length }, { value: "ui", label: "UI", count: 7 }];
  const items = tab === "workflows"
    ? kitWorkflows.map((item) => ({ ...item, tag: item.kitHero ? "hero" : item.free ? "free" : "" }))
    : tab === "agents"
      ? kitAgents.map((item) => ({ ...item, tag: item.nextDrop ? "next drop" : item.free ? "free" : "" }))
      : [{ ...dashboard, tag: "dashboard" }, ...kitComponents.map((slug) => ({ ...components.find((item) => item.slug === slug)!, tag: "component" }))];

  return <article className="st-kit" id={kit.slug} data-testid="kit-card">
    <div className="st-kit-l">
      <div className="st-kit-name"><Trio colors={kit.trio} large /><h2>{kit.name} kit</h2></div>
      <p className="st-kit-p">{kit.promise}</p>
      <div className="st-kit-counts">{counts.map((count) => <span key={count.label}><b>{count.value}</b>{count.label}</span>)}</div>
      <div className="st-chain">{chain.map((node) => <div className="st-chain-n" key={node.type}><span className="st-chain-i"><Icon name={node.icon} /></span><span className="st-chain-t"><em>{node.type}</em><b title={node.title}>{node.title}</b></span></div>)}</div>
      <div className="st-kit-cmd"><span><b>$</b>{kit.installCommand}</span><CopyButton text={kit.installCommand} /></div>
      <div className="st-kit-buy"><div className="st-kit-price"><b>{formatMoney(PRICES.kit.solo)}</b><span>one-time · {formatMoney(PRICES.kit.team)} for a team of {TEAM_SEATS_INCLUDED}</span></div><div className="st-kit-a"><Link className="lp-btn lp-btn-g" href={`/docs/kits/${kit.slug}`}>Kit docs</Link><Link className="lp-btn lp-btn-p" href={`/pricing?plan=kit:${kit.slug}`}><span>Buy the {kit.name} kit</span><Icon name="arrow" /></Link></div></div>
    </div>
    <div className="st-kit-r">
      <div className="st-kit-tabs" role="tablist" aria-label={`${kit.name} kit items`}>{tabs.map((option, index) => <button type="button" role="tab" id={`${panelId}-${option.value}`} aria-selected={tab === option.value} aria-controls={panelId} tabIndex={tab === option.value ? 0 : -1} className={tab === option.value ? "is-on" : ""} key={option.value} onClick={() => setTab(option.value)} onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
        setTab(tabs[nextIndex].value);
        const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button");
        buttons?.[nextIndex].focus();
      }}>{option.label}<em>{option.count}</em></button>)}</div>
      <div role="tabpanel" id={panelId} aria-labelledby={`${panelId}-${tab}`}>
        <ul className="st-kit-list">{items.map((item) => <li key={item.docPath}><Link href={item.docPath} prefetch={false} data-testid="kit-item"><span>{item.title}</span>{item.tag && <em>{item.tag}</em>}<Icon name="chevr" /></Link></li>)}</ul>
      </div>
      <p className="st-kit-apps">Connects to {kit.apps}</p>
    </div>
  </article>;
}

export function Kits() {
  return <main className="st-page" id="site-content" tabIndex={-1}><div className="st-wrap">
    <div className="st-ph"><div className="st-crumb"><span>Library</span><Icon name="chevr" /><b>Kits</b></div><h1>Five teams. <em>One kit each.</em></h1><p>A kit is every workflow, agent and screen one team needs, wired together on the same data and tested every night. {formatMoney(PRICES.kit.solo)} a kit, or every kit with All-Access for {formatMoney(PRICES.all.solo)}.</p></div>
    <div className="st-kits">{kits.map((kit) => <KitCard kit={kit} key={kit.slug} />)}</div>
    <div className="st-cmp-h"><h2>Compare the kits</h2><p>Each kit is built around one hero workflow, one hero agent and one dashboard block.</p></div>
    <div className="lp-tbl st-ktbl" role="table" aria-label="Compare the kits">
      <div className="lp-tr is-h" role="row">{["Kit", "Hero workflow", "Hero agent", "Dashboard", "Apps", "Free to try"].map((heading) => <span role="columnheader" key={heading}>{heading}</span>)}</div>
      {kits.map((kit) => {
        const { workflow, agent, dashboard } = kitHighlights(kit);
        return <div className="lp-tr" role="row" key={kit.slug}><span className="lp-tr-n" role="cell"><Trio colors={kit.trio} />{kit.name}</span><span role="cell">{workflow.title}</span><span role="cell">{agent.title}</span><span role="cell">{dashboard.title}</span><span role="cell" style={{ color: "var(--muted)" }}>{kit.apps}</span><span className="is-num" role="cell">{workflows.filter((item) => item.kit === kit.slug && item.free).length} workflows</span></div>;
      })}
    </div>
    <div className="st-aa"><div><h2>Need more than one team covered?</h2><p>Four kits cost {formatMoney(4 * PRICES.kit.solo)}. All-Access is {formatMoney(PRICES.all.solo)} and covers all five kits, all three libraries and every drop for 12 months.</p></div><Link className="lp-btn lp-btn-p lp-btn-lg" href="/pricing?plan=all">See All-Access <Icon name="arrow" /></Link></div>
  </div></main>;
}
