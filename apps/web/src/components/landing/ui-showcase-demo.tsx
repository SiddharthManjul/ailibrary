"use client";

import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { demoCopy, home } from "@content/home";

import { Icon } from "./parts";
import { useDemoClock } from "./use-demo-clock";

const GRID_COLUMNS = ["Account", "Stage", "Fit", "ARR", "Owner"];
const FILTERS = ["All", "Refunds", "Outbound", "Finance"];
type Decision = "yes" | "no" | null;
type PreviewTheme = "dark" | "light";
type ChatResponse = { answer: string; query: string; citations: readonly string[] };
type Conversation = ChatResponse & { question: string; started: number; manual: boolean };

function Tile({ className, title, block = false, children }: { className: string; title: string; block?: boolean; children: ReactNode }) {
  return (
    <div className={`lp-tile ${className}`}>
      <div className="lp-tile-h">{title}<span className="lp-tag">{block ? "BLOCK" : "COMPONENT"}</span></div>
      <div className="lp-tile-b">{children}</div>
    </div>
  );
}

function responseFor(question: string): ChatResponse {
  const normalized = question.toLowerCase();
  return demoCopy.ui.responses.find((response) => response.keywords.some((keyword) => normalized.includes(keyword))) ?? demoCopy.ui.defaultResponse;
}

export function UIShowcaseDemo({ children }: { children?: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme | null>(null);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [filter, setFilter] = useState("All");
  const [inboxState, setInboxState] = useState<{ values: Decision[]; completedAt: number | null }>({ values: [null, null, null, null], completedAt: null });
  const [inboxInteracted, setInboxInteracted] = useState(false);
  const [sort, setSort] = useState({ column: 2, direction: -1 });
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState<Conversation>({ question: demoCopy.ui.defaultQuestion, ...responseFor(demoCopy.ui.defaultQuestion), started: 0, manual: false });
  const { ref, elapsed, reduced, paused } = useDemoClock("ui");
  const selectedTheme = previewTheme ?? (resolvedTheme === "light" ? "light" : "dark");
  const inboxReset = inboxState.completedAt !== null && elapsed - inboxState.completedAt >= 2600;
  const decisions: Decision[] = reduced && !inboxInteracted ? ["yes", "yes", "yes", "yes"] : inboxReset ? [null, null, null, null] : inboxState.values;
  const pending = decisions.filter((decision) => decision === null).length;
  const chatElapsed = reduced || (conversation.manual && paused) ? 1_000_000 : Math.max(0, elapsed - conversation.started) % 11000;
  const characterCount = Math.max(0, Math.min(conversation.answer.length, Math.floor((chatElapsed - 1100) / 24)));
  const complete = characterCount >= conversation.answer.length;
  const timelineElapsed = reduced ? 1_000_000 : elapsed % 6400;
  const boardMoved = reduced || Math.floor(elapsed / 4200) % 2 === 1;
  const selectedMetric = demoCopy.ui.metrics[period];
  const sparkPoints = selectedMetric.points;
  const sparkPath = `M${sparkPoints.map((value, index) => `${(index / (sparkPoints.length - 1) * 200).toFixed(1)} ${(52 - (value - 15) / 55 * 48).toFixed(1)}`).join(" L")}`;
  const rows = [...home.dataGrid].sort((firstRow, secondRow) => {
    const firstValue = firstRow[sort.column];
    const secondValue = secondRow[sort.column];
    const difference = typeof firstValue === "number" && typeof secondValue === "number" ? firstValue - secondValue : String(firstValue).localeCompare(String(secondValue));
    return difference * sort.direction;
  });
  const { northwind, copperleaf, lumen, harborline } = demoCopy.ui.boardAccounts;
  const board = [
    { title: "New", cards: boardMoved ? [copperleaf] : [northwind, copperleaf] },
    { title: "Qualified", cards: boardMoved ? [northwind, lumen] : [lumen] },
    { title: "Proposal", cards: [harborline] },
  ];

  function decide(index: number, decision: Decision) {
    setInboxInteracted(true);
    const values = [...decisions];
    values[index] = decision;
    setInboxState({ values, completedAt: values.every(Boolean) ? elapsed : null });
  }

  function resetInbox() {
    setInboxInteracted(true);
    setInboxState({ values: [null, null, null, null], completedAt: null });
  }

  function sortBy(column: number) {
    setSort((current) => ({ column, direction: current.column === column ? -current.direction : column === 2 || column === 3 ? -1 : 1 }));
  }

  function sendPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = prompt.trim();
    if (!question) return;
    setConversation({ question, ...responseFor(question), started: elapsed, manual: true });
    setPrompt("");
    event.currentTarget.querySelector<HTMLInputElement>("input")?.blur();
  }

  function selectThemeWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextTheme = event.key === "Home" ? "dark" : event.key === "End" ? "light" : selectedTheme === "dark" ? "light" : "dark";
    setPreviewTheme(nextTheme);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-preview-theme='${nextTheme}']`)?.focus();
  }

  const themeToggle = (
    <div className="lp-tgl" role="radiogroup" aria-label="UI preview theme">
      {(["dark", "light"] as const).map((theme) => <button key={theme} type="button" role="radio" data-preview-theme={theme} aria-checked={selectedTheme === theme} tabIndex={selectedTheme === theme ? 0 : -1} className={selectedTheme === theme ? "is-on" : ""} onClick={() => setPreviewTheme(theme)} onKeyDown={selectThemeWithKeyboard}><Icon name={theme === "dark" ? "moon" : "sun"} />{theme === "dark" ? "Dark" : "Light"}</button>)}
    </div>
  );

  return (
    <div className="lp-ui-demo-wrap" ref={ref}>
      {children ? <div className="lp-head"><div>{children}</div><div className="lp-head-a">{themeToggle}</div></div> : <div className="lp-ui-theme-control">{themeToggle}</div>}
      <div className={`lp-bento ${previewTheme ? `lp-th-${previewTheme}` : ""}`} data-theme={previewTheme ?? undefined}>
        <Tile className="lp-t-inbox" title="approval-inbox" block>
          <div className="lp-ib-top"><b>Approvals</b><span>{pending} pending{pending === 0 ? <button className="lp-ib-reset" type="button" onClick={resetInbox}>Reset</button> : null}</span></div>
          <div className="lp-ib-f lp-ui-filter" role="group" aria-label="Filter approvals">
            {FILTERS.map((category) => <button type="button" key={category} className={filter === category ? "is-on" : ""} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}
          </div>
          {home.approvalInbox.map((request, index) => {
            const category = index === 0 ? "Refunds" : index === 1 ? "Outbound" : index === 2 ? "Finance" : "Engineering";
            if (filter !== "All" && category !== filter) return null;
            const decision = decisions[index];
            return (
              <div className={`lp-ib-i ${decision ? `is-${decision}` : ""}`} key={request[0]}>
                <span className="lp-ib-av"><Icon name={request[2]} /></span>
                <div className="lp-ib-x"><b title={request[0]}>{request[0]}</b><span>{request[1]}</span></div>
                <div className="lp-ib-a"><button type="button" aria-label={`Reject: ${request[0]}`} onClick={() => decide(index, "no")} disabled={decision !== null}><Icon name="x" /></button><button type="button" className="is-yes" aria-label={`Approve: ${request[0]}`} onClick={() => decide(index, "yes")} disabled={decision !== null}><Icon name="check" /></button></div>
                <span className="lp-ib-s">{decision === "yes" ? "Approved" : "Rejected"}</span>
              </div>
            );
          })}
        </Tile>

        <Tile className="lp-t-chat" title="chat-thread · tool-call-card">
          <div className="lp-msg-u">{conversation.question}</div>
          <div className="lp-msg-a"><span className="lp-msg-av"><Icon name="spark" /></span><div className="lp-msg-c">
            <div className="lp-tool"><Icon name="search" /><code>kb.search</code><span>{conversation.query}</span><span>{chatElapsed < 900 ? "running…" : "3 results"}</span></div>
            <div className="lp-msg-t lp-chat-stream" style={{ height: "calc(120 * var(--lp-unit))" }}>{conversation.answer.slice(0, characterCount)}<i className={`lp-caret ${characterCount > 0 && !complete ? "is-on" : ""}`} aria-hidden="true" /></div>
            <div className={`lp-cites ${complete ? "is-on" : ""}`} aria-hidden={!complete}>{conversation.citations.map((citation, index) => <span key={citation}><b>{index + 1}</b>{citation}</span>)}</div>
          </div></div>
          <form className="lp-prompt" onSubmit={sendPrompt} aria-label="Try the seed-data chat">
            <label className="sr-only" htmlFor="ui-chat-prompt">Ask about a ticket</label>
            <input id="ui-chat-prompt" className="lp-chat-input" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask about a ticket…" maxLength={200} autoComplete="off" />
            <button type="submit" className="lp-chat-send" aria-label="Send demo message" disabled={!prompt.trim()}><Icon name="up" /></button>
          </form>
        </Tile>

        <Tile className="lp-t-kpi" title="kpi-stat · sparkline">
          <div className="lp-kpi-top"><span>Auto-resolved</span><div className="lp-kpi-seg" role="group" aria-label="KPI date range">{([7, 30] as const).map((days) => <button key={days} type="button" className={period === days ? "is-on" : ""} aria-pressed={period === days} onClick={() => setPeriod(days)}>{days}d</button>)}</div></div>
          <div className="lp-kpi-v"><b>{selectedMetric.value}</b><span>{selectedMetric.delta}</span></div>
          <svg className="lp-spark" viewBox="0 0 200 54" preserveAspectRatio="none" role="img" aria-label={`Auto-resolution trend over ${period} days: ${sparkPoints.join(", ")} percent`}><path d={sparkPath} vectorEffect="non-scaling-stroke" /><path d={`${sparkPath} L200 54 L0 54 Z`} /></svg>
        </Tile>

        <Tile className="lp-t-run" title="run-timeline">
          <div className="lp-rt" role="group" aria-label="Agent run timeline">
            {demoCopy.ui.runSteps.map(([title, timing], index) => {
              const started = index * 950;
              const done = timelineElapsed >= started + 950;
              return <div key={title} className={`lp-rt-i ${done ? "is-done" : timelineElapsed >= started ? "is-run" : ""}`}><i aria-hidden="true" /><b>{title}</b><em>{done ? timing : timelineElapsed >= started ? "..." : ""}</em></div>;
            })}
          </div>
        </Tile>

        <Tile className="lp-t-grid" title="data-grid">
          <div className="lp-dg" role="table" aria-label="Fieldline sales accounts">
            <div className="lp-dg-r is-h" role="row">
              {GRID_COLUMNS.map((column, index) => <span key={column} role="columnheader" aria-sort={sort.column === index ? sort.direction < 0 ? "descending" : "ascending" : "none"}><button type="button" className={sort.column === index ? "is-on" : ""} onClick={() => sortBy(index)}>{column}<Icon name={sort.column === index ? sort.direction < 0 ? "chevd" : "chevu" : "sort"} /></button></span>)}
            </div>
            {rows.map((row) => <div className="lp-dg-r" role="row" key={row[0]}><span role="cell" title={row[0]}>{row[0]}</span><span role="cell"><span className={`lp-chip ${row[1] === "Hot" ? "is-hot" : row[1] === "Proposal" ? "is-ok" : ""}`}><i aria-hidden="true" />{row[1]}</span></span><span role="cell" className="is-num">{row[2]}</span><span role="cell" className="is-num">${Math.round(row[3] / 1000)}k</span><span role="cell">{row[4]}</span></div>)}
          </div>
        </Tile>

        <Tile className="lp-t-board" title="deal-pipeline-board" block>
          <div className="lp-bd" role="group" aria-label="Sales deal pipeline">
            {board.map((column) => <div className="lp-bd-c" key={column.title}><div className="lp-bd-h">{column.title}<em>{column.cards.length}</em></div>{column.cards.map((card) => <div className={`lp-bd-k ${boardMoved && card.name === northwind.name ? "is-new" : ""}`} key={card.name}><b title={card.name}>{card.name}</b><span>{card.value}<em>{card.owner}</em></span></div>)}</div>)}
          </div>
        </Tile>
      </div>
    </div>
  );
}
