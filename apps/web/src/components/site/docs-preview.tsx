"use client";

import { useId, useState, type FormEvent } from "react";
import type { DocBlock } from "@content/site/docs-types";
import { DocCodeBlock, docsTabKeyboard } from "./docs-interactive";
import { Icon } from "./shared";
import { Thumbnail, type ThumbnailData } from "./thumbnail";

type PreviewBlock = Extract<DocBlock, { type: "preview" }>;
const runSteps = [["Read ticket", "8ms"], ["Search knowledge base", "380ms"], ["Draft answer", "1.2s"], ["Policy check", "22ms"], ["Request approval", "12ms"]] as const;
const gridRows = [["Northwind Logistics", "Hot", 88, "$84k", "Priya"], ["Lumen Health", "Hot", 81, "$52k", "Arjun"], ["Harborline", "Proposal", 76, "$120k", "Priya"], ["Acme Freight", "Nurture", 64, "$23k", "Jon"]] as const;

function ApprovalDemo() {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  return <div className="st-real st-preview-approval"><div className="lp-ap is-show"><div className="lp-ap-h"><Icon name="shield" /><span>{decision ? "Decision recorded" : "Approval needed"}</span><span className="lp-ap-who">refund.create</span></div><div className="lp-ap-t">Refund $49.00 to Daniel Reyes</div><div className="lp-ap-p">Two charges of $49.00 on Oct 3 for the Team plan. Policy: duplicate charges are refundable in full.</div>{decision ? <div className="st-preview-decision" role="status">Refund {decision}. <button type="button" onClick={() => setDecision(null)}>Reset demo</button></div> : <div className="lp-ap-a"><button type="button" className="lp-ap-no" onClick={() => setDecision("rejected")}>Reject</button><button type="button" className="lp-ap-yes" onClick={() => setDecision("approved")}>Approve refund</button></div>}</div></div>;
}

function RunDemo() {
  const [step, setStep] = useState(2);
  return <div className="st-real lp-tile st-preview-run"><div className="lp-tile-b"><div className="lp-rt" aria-label="Sample agent run">{runSteps.map(([title, timing], index) => <div className={`lp-rt-i ${index < step ? "is-done" : index === step ? "is-run" : ""}`} key={title}><i aria-hidden="true" /><b>{title}</b><em>{index < step ? timing : index === step ? "..." : ""}</em></div>)}</div><button className="st-preview-action" type="button" onClick={() => setStep((current) => current >= runSteps.length ? 0 : current + 1)}>{step >= runSteps.length ? "Run again" : "Next step"}</button></div></div>;
}

function KpiDemo() {
  const [period, setPeriod] = useState<7 | 30>(7);
  return <div className="st-real lp-tile st-preview-kpi"><div className="lp-tile-b"><div className="lp-kpi-top"><span>Auto-resolved</span><div className="lp-kpi-seg" role="group" aria-label="Date range">{([7, 30] as const).map((days) => <button type="button" className={period === days ? "is-on" : ""} aria-pressed={period === days} onClick={() => setPeriod(days)} key={days}>{days}d</button>)}</div></div><div className="lp-kpi-v" aria-live="polite"><b>{period === 7 ? "63%" : "71%"}</b><span>{period === 7 ? "+8.2 pts" : "+12.4 pts"}</span></div><svg className="lp-spark" viewBox="0 0 200 54" preserveAspectRatio="none" role="img" aria-label={`Sample auto-resolution trend over ${period} days`}><path d={period === 7 ? "M0 46 L16 42 L31 44 L46 38 L62 40 L77 33 L92 35 L108 28 L123 30 L139 24 L154 21 L169 22 L185 17 L200 10" : "M0 48 L20 45 L40 39 L60 42 L80 31 L100 28 L120 25 L140 18 L160 21 L180 11 L200 5"} vectorEffect="non-scaling-stroke" /></svg></div></div>;
}

function ChatDemo() {
  const [prompt, setPrompt] = useState("");
  const [question, setQuestion] = useState("Why do Okta logins fail for Harborline since this morning?");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setQuestion(prompt.trim());
    setPrompt("");
  }
  return <div className="st-real lp-tile st-preview-chat"><div className="lp-tile-b"><div className="lp-msg-u">{question}</div><div className="lp-msg-a"><span className="lp-msg-av"><Icon name="spark" /></span><div className="lp-msg-c"><div className="lp-tool"><Icon name="search" /><code>kb.search</code><span>okta audience uri</span><span>3 results</span></div><div className="lp-msg-t">Harborline moved its SSO domain at 08:10, so Okta now sends an Audience URI that no longer matches. Set it to app.fieldline.example/sso.</div><div className="lp-cites is-on"><span><b>1</b>SSO setup guide</span><span><b>2</b>Okta error codes</span></div></div></div><form onSubmit={submit} className="st-preview-prompt"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask about this sample ticket" aria-label="Sample chat message" maxLength={180} /><button type="submit" aria-label="Send sample message" disabled={!prompt.trim()}><Icon name="up" /></button></form></div></div>;
}

function ToolDemo() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const tools = [{ name: "stripe.list_charges", args: "customer cus_9921, since Oct 1", timing: "340ms", state: "done" }, { name: "refund.calculate", args: "charge ch_3Qk8", timing: "22ms", state: "done" }, { name: "refund.create", args: "amount 4900, usd", timing: "approval", state: "pending" }];
  return <div className="st-real st-preview-tools">{tools.map((tool, index) => <div key={tool.name}><button type="button" className={`lp-tc is-${tool.state}`} aria-expanded={expanded === index} onClick={() => setExpanded(expanded === index ? null : index)}><i className="lp-tc-s" aria-hidden="true" /><code>{tool.name}</code><span className="lp-tc-a">{tool.args}</span><span className="lp-tc-ms">{tool.timing}</span></button>{expanded === index && <pre className="st-preview-tool-detail">{JSON.stringify({ tool: tool.name, arguments: tool.args, status: tool.state === "pending" ? "Approval required before execution" : "Completed on sample data" }, null, 2)}</pre>}</div>)}</div>;
}

function GridDemo() {
  const [sort, setSort] = useState({ column: 2, ascending: false });
  const sorted = [...gridRows].sort((first, second) => {
    const firstValue = first[sort.column];
    const secondValue = second[sort.column];
    return (typeof firstValue === "number" && typeof secondValue === "number" ? firstValue - secondValue : String(firstValue).localeCompare(String(secondValue))) * (sort.ascending ? 1 : -1);
  });
  return <div className="st-real lp-tile st-preview-grid"><div className="lp-dg" role="table" aria-label="Sample Fieldline accounts"><div className="lp-dg-r is-h" role="row">{["Account", "Stage", "Fit", "ARR", "Owner"].map((title, index) => <span role="columnheader" aria-sort={sort.column === index ? sort.ascending ? "ascending" : "descending" : "none"} key={title}><button type="button" onClick={() => setSort({ column: index, ascending: sort.column === index ? !sort.ascending : true })}>{title}<Icon name="sort" /></button></span>)}</div>{sorted.map((row) => <div className="lp-dg-r" role="row" key={row[0]}>{row.map((cell, index) => <span role="cell" key={index}>{index === 1 ? <span className={`lp-chip ${cell === "Hot" ? "is-hot" : cell === "Proposal" ? "is-ok" : ""}`}><i aria-hidden="true" />{cell}</span> : cell}</span>)}</div>)}</div></div>;
}

export function DocPreview({ code, caption, designedDemo, thumbnail, thumbnailData }: PreviewBlock & { thumbnailData?: ThumbnailData }) {
  const [tab, setTab] = useState(0);
  const id = useId();
  const demos: Record<string, () => React.ReactNode> = { "approval-card": ApprovalDemo, "run-timeline": RunDemo, "kpi-stat": KpiDemo, "chat-thread": ChatDemo, "tool-call-card": ToolDemo, "data-grid": GridDemo };
  const Demo = designedDemo ? demos[designedDemo] : undefined;
  return <section className="st-dpv" data-testid="doc-preview" aria-label="Component example"><div className="st-code-h is-tabs"><div className="st-ctabs" role="tablist" aria-label="Example view">{["Preview", "Code"].map((label, index) => <button type="button" role="tab" key={label} id={`${id}-tab-${index}`} aria-controls={`${id}-panel`} aria-selected={tab === index} tabIndex={tab === index ? 0 : -1} className={tab === index ? "is-on" : ""} onClick={() => setTab(index)} onKeyDown={(event) => docsTabKeyboard(event, index, 2, setTab)}>{label}</button>)}</div><span className="st-dpv-k">{Demo ? "Live on seed data" : "Component outline"}</span></div><div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`}>{tab === 0 ? <div className="st-dpv-b">{Demo ? <Demo /> : <div className="st-preview-fallback"><Thumbnail thumbnail={thumbnailData ?? { variant: thumbnail, bars: [46, 70, 58, 88, 66, 93, 76], w1: 42, w2: 60, w3: 78 }} /><p>Live preview ships with the component</p></div>}</div> : <DocCodeBlock title="Usage" lang="tsx" lines={code} />}</div><p className="st-dpv-cap">{caption}</p></section>;
}
