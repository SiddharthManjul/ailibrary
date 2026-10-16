"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

import { icons, kits } from "@content/site/settings";

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <svg className={`lp-ic ${className}`} viewBox="0 0 24 24" aria-hidden="true"><path d={icons[name] || icons.layers} /></svg>;
}

export function Trio({ colors, kit, large = false }: { colors?: readonly string[]; kit?: string; large?: boolean }) {
  const palette = colors || kits.find(item => item.slug === kit)?.trio || [];
  return <span className={`lp-trio st-trio${large ? " is-lg" : ""}`} aria-hidden="true">{palette.map((color, index) => <i key={`${color}-${index}`} style={{ background: color }} />)}</span>;
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="st-chip">{children}</span>;
}

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2400);
    }
  }
  return <button className={`st-copy ${className}`} type="button" onClick={copy} aria-live="polite"><Icon name={status === "copied" ? "check" : "copy"} />{status === "copied" ? "Copied" : status === "error" ? "Copy failed" : label}</button>;
}

export function CodeBlock({ title, lang, lines }: { title?: string; lang?: string; lines: readonly string[] }) {
  return <div className="st-code"><div className="st-code-h"><span>{title || lang || "Terminal"}</span><CopyButton text={lines.join("\n")} /></div><pre><code>{lines.map((line, index) => <span className={`st-code-line${/^(#|\/\/)/.test(line) ? " is-comment" : line.startsWith("✓") ? " is-success" : ""}`} key={index}>{line.startsWith("$ ") ? <><span className="st-code-prompt">$ </span>{line.slice(2)}</> : line}{index < lines.length - 1 ? "\n" : ""}</span>)}</code></pre></div>;
}

export function Tabs({ tabs, value, onChange, label = "Options", className = "st-tabs" }: { tabs: readonly { label: string; value: string }[]; value: string; onChange: (value: string) => void; label?: string; className?: string }) {
  const identifier = useId();
  return <div className={className} role="tablist" aria-label={label} onKeyDown={event => {
    const current = tabs.findIndex(tab => tab.value === value);
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!delta && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + delta + tabs.length) % tabs.length;
    onChange(tabs[index].value);
    (event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")[index])?.focus();
  }}>{tabs.map(tab => <button type="button" role="tab" id={`${identifier}-${tab.value}`} aria-selected={value === tab.value} tabIndex={value === tab.value ? 0 : -1} className={value === tab.value ? "is-on" : undefined} onClick={() => onChange(tab.value)} key={tab.value}>{tab.label}</button>)}</div>;
}

export function TableFrame({ columns, rows, grid, label }: { columns: readonly string[]; rows: readonly (readonly ReactNode[])[]; grid?: string; label?: string }) {
  return <div className="st-dtbl" role="region" aria-label={label || "Table"} tabIndex={0}><table className="st-table" style={grid ? { "--gtc": grid } as CSSProperties : undefined}><thead><tr>{columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
