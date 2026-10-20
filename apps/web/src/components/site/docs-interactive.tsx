"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import type { DocCodeTab, DocStep } from "@content/site/docs-types";
import { Icon } from "./shared";

export function DocCopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    timer.current = setTimeout(() => setStatus("idle"), 1600);
  }

  return <button type="button" onClick={copy}><Icon name={status === "copied" ? "check" : "copy"} /><span aria-live="polite">{status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : label}</span></button>;
}

export function DocCodeLines({ lines, lang }: { lines: readonly string[]; lang?: string }) {
  return <pre tabIndex={0} aria-label={`${lang ?? "Code"} example`}><code>{lines.map((line, index) => <span className={`lp-cl ${line.startsWith("#") || line.startsWith("//") ? "is-comment" : line.startsWith("✓") ? "is-ok" : ""}`} key={index}>{line.startsWith("$ ") ? <><span className="st-code-prompt">$</span>{line.slice(1)}</> : line || " "}{index < lines.length - 1 ? "\n" : ""}</span>)}</code></pre>;
}

export function DocCodeBlock({ title, lang, lines }: { title?: string; lang?: string; lines: readonly string[] }) {
  return <div className="st-code"><div className="st-code-h"><span>{title ?? lang ?? "Code"}</span><DocCopyButton text={lines.join("\n")} /></div><DocCodeLines lines={lines} lang={lang} /></div>;
}

function tabKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number, count: number, choose: (index: number) => void) {
  let target: number;
  if (["ArrowRight", "ArrowDown"].includes(event.key)) target = (index + 1) % count;
  else if (["ArrowLeft", "ArrowUp"].includes(event.key)) target = (index - 1 + count) % count;
  else if (event.key === "Home") target = 0;
  else if (event.key === "End") target = count - 1;
  else return;
  event.preventDefault();
  choose(target);
  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[target]?.focus();
}

export function DocCodeTabs({ tabs, value, onChange, label = "Code options", copyText }: { tabs: readonly DocCodeTab[]; value?: number; onChange?: (index: number) => void; label?: string; copyText?: string }) {
  const [localValue, setLocalValue] = useState(0);
  const id = useId();
  const selected = value ?? localValue;
  const active = tabs[selected] ?? tabs[0];
  function choose(index: number) { if (onChange) onChange(index); else setLocalValue(index); }
  if (!active) return null;
  return <div className="st-code" data-testid="code-tabs"><div className="st-code-h is-tabs"><div className="st-ctabs" role="tablist" aria-label={label}>{tabs.map((tab, index) => <button type="button" key={tab.label} role="tab" id={`${id}-tab-${index}`} aria-selected={selected === index} aria-controls={`${id}-panel`} tabIndex={selected === index ? 0 : -1} className={selected === index ? "is-on" : ""} onClick={() => choose(index)} onKeyDown={(event) => tabKeyboard(event, index, tabs.length, choose)}>{tab.label}</button>)}</div><DocCopyButton text={copyText ?? active.lines.join("\n")} /></div><div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${selected}`}><DocCodeLines lines={active.lines} lang={active.lang} />{active.note && <p className="st-code-note">{active.note}</p>}</div></div>;
}

const managers = ["pnpm", "npm", "yarn", "bun"] as const;
const commands = ["pnpm dlx", "npx", "yarn dlx", "bunx --bun"] as const;
function subscribeManager(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("ail-pm-change", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("ail-pm-change", callback); };
}
function managerSnapshot() {
  try { return localStorage.getItem("ail-pm") ?? "pnpm"; } catch { return "pnpm"; }
}

export function PackageManagerCommand({ command, mode = "execute" }: { command: string; mode?: "execute" | "install" }) {
  const remembered = useSyncExternalStore(subscribeManager, managerSnapshot, () => "pnpm");
  const selected = Math.max(0, managers.findIndex((manager) => manager === remembered));
  function choose(index: number) {
    try { localStorage.setItem("ail-pm", managers[index]); } catch {}
    window.dispatchEvent(new Event("ail-pm-change"));
  }
  const prefixes = mode === "install" ? ["pnpm add", "npm install", "yarn add", "bun add"] : commands;
  return <DocCodeTabs label="Package manager" tabs={managers.map((label, index) => ({ label, lang: "bash", lines: [`$ ${prefixes[index]} ${command}`] }))} value={selected} onChange={choose} copyText={`${prefixes[selected]} ${command}`} />;
}

export function DocSteps({ items }: { items: readonly DocStep[] }) {
  return <ol className="st-ol">{items.map((item, index) => <li key={`${item.title}-${index}`}><span className="st-ol-n" aria-hidden="true">{index + 1}</span><div><b>{item.title}</b>{item.detail && <span>{item.detail}</span>}</div></li>)}</ol>;
}

export function DocInstallUI({ command, manual }: { command: string; manual: readonly DocStep[] }) {
  const [mode, setMode] = useState(0);
  return <div data-testid="install-ui" className="st-install-ui"><div className="st-seg" role="radiogroup" aria-label="Installation method">{["CLI", "Manual"].map((label, index) => <button type="button" role="radio" key={label} aria-checked={mode === index} tabIndex={mode === index ? 0 : -1} className={mode === index ? "is-on" : ""} onClick={() => setMode(index)} onKeyDown={(event) => tabKeyboard(event, index, 2, setMode)}>{label}</button>)}</div>{mode === 0 ? <PackageManagerCommand command={command} /> : <DocSteps items={manual} />}</div>;
}

export function DocToc({ toc, editHref = "https://github.com/SiddharthManjul/ailibrary/blob/main/apps/web/content/site/data/docs/pages.json" }: { toc: readonly { text: string; anchor: string }[]; editHref?: string | null }) {
  const [active, setActive] = useState(toc[0]?.anchor ?? "");
  useEffect(() => {
    const headings = toc.map((item) => document.getElementById(item.anchor)).filter((heading): heading is HTMLElement => heading !== null);
    let frame = 0;
    const update = () => {
      let selected = headings[0]?.id ?? "";
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 100) selected = heading.id;
        else break;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) selected = headings.at(-1)?.id ?? selected;
      setActive(selected);
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(onScroll, { rootMargin: "-96px 0px -65% 0px", threshold: [0, 1] });
    headings.forEach((heading) => observer.observe(heading));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [toc]);
  return <nav className="st-toc" aria-label="On this page" data-testid="doc-toc"><div className="st-toc-h">On this page</div>{toc.map((item) => <a key={item.anchor} href={`#${item.anchor}`} aria-current={active === item.anchor ? "true" : undefined} className={active === item.anchor ? "is-on" : ""}>{item.text}</a>)}<div className="st-toc-f"><span>Was this page useful?</span>{editHref && <a href={editHref} target="_blank" rel="noreferrer">Edit on GitHub</a>}</div></nav>;
}

export { tabKeyboard as docsTabKeyboard };
