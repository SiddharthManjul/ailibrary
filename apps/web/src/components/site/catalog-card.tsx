import Link from "next/link";
import type { Agent, UIItem, Workflow } from "@content/site/catalog";
import { kits, siteData } from "@content/site/settings";
import { Icon, Trio } from "./shared";
import { Thumbnail } from "./thumbnail";

export type { Agent, UIItem, Workflow } from "@content/site/catalog";
export type CatalogEntry =
  | { type: "workflow"; item: Workflow }
  | { type: "agent"; item: Agent }
  | { type: "component" | "block"; item: UIItem };

export function CatalogCard({ entry }: { entry: CatalogEntry }) {
  const { item, type } = entry;
  const kit = "kit" in item ? kits.find((candidate) => candidate.slug === item.kit) : undefined;
  const meta = type === "workflow"
    ? `${kit?.name} · #${entry.item.n.padStart(2, "0")}`
    : type === "agent"
      ? `${kit?.name} · ${entry.item.readTools} read, ${entry.item.writeTools} write tools`
      : siteData.uiGroups[type === "block" ? "blocks" : "components"].find((group) => group[0] === entry.item.group)?.[1];
  const chips = type === "workflow"
    ? [entry.item.platforms.join(" · "), ...entry.item.apps.slice(0, 2), "15 min setup"]
    : type === "agent"
      ? ["Code · Skill · MCP · n8n", ...(entry.item.targets.pass ? [`pass ${entry.item.targets.pass}`] : []), ...(entry.item.targets.p95 ? [`p95 < ${entry.item.targets.p95}`] : [])]
      : [type === "block" ? "Block" : "Component", "shadcn registry"];

  return (
    <Link className="st-card" data-testid="catalog-card" href={item.docPath} prefetch={false}>
      <div className="st-thumb">
        {type === "workflow" && <div className="st-tn-row" aria-hidden="true">{entry.item.thumbNodes.slice(0, 4).map((node, index) => <span className="st-tn" key={`${node}-${index}`}><Icon name={node} /></span>)}</div>}
        {type === "agent" && <div className="st-trun" aria-hidden="true">{entry.item.cardRun.slice(0, 3).map((run, index) => <div className={`st-tr ${run.state === "approval" ? "is-wait" : "is-done"}`} key={`${run.tool}-${index}`}><i style={{ background: run.state === "approval" ? "var(--warn)" : "var(--ok)", border: 0 }} /><code>{run.tool}</code><span>{run.state}</span></div>)}</div>}
        {(type === "component" || type === "block") && <Thumbnail thumbnail={entry.item.thumbnail} />}
        <span className="st-badges">
          {item.free && <em className="is-free">Free</em>}
          {type === "workflow" && entry.item.kitHero && <em>Kit hero</em>}
          {type === "agent" && entry.item.nextDrop && <em className="is-soon">Next drop</em>}
        </span>
      </div>
      <div className="st-cb">
        <div className="st-cmeta">{kit && <Trio colors={kit.trio} />}{meta}</div>
        <b className="st-ct" data-testid="card-title">{item.title}</b>
        <p>{item.summary}</p>
        <div className="st-chips">{chips.map((chip) => <span key={chip}>{chip}</span>)}</div>
      </div>
      <span className="st-go">Docs <Icon name="arrow" /></span>
    </Link>
  );
}
