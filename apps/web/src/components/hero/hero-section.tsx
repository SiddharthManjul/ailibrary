"use client";

import { ArrowRight, ChartNoAxesColumnIncreasing, Check, Layers, PanelsTopLeft, Send, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { HeroCursorField } from "./hero-cursor-field";
import { KITS } from "./kits";
import { HeroNavigation } from "./mobile-navigation";
import { useHeroDemo } from "./use-hero-demo";
import { useHeroEffects } from "./use-hero-effects";
import s from "./hero-section.module.css";

const NODE_ICONS = [Zap, Layers, Sparkles, Send];
const MINI_ICONS = [Zap, Sparkles, PanelsTopLeft];
const LINK_WINDOWS = [[1450, 2050], [3700, 4300], [6150, 6750]];
const MINI_PATH = "M0 10 C12 1 25 1 37 10 S62 19 75 10 S92 2 100 10";
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function Dots() {
  return <span className={s.dots} aria-hidden="true"><i /><i /><i /></span>;
}

function WindowHeader({ title, tag }: { title: ReactNode; tag: string }) {
  return (
    <div className={s.ch}>
      <Dots />
      <span className={s.cname}>{title}</span>
      <span className={s.ctag}>{tag}</span>
    </div>
  );
}

export function HeroSection({ className }: { className?: string }) {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const windows = useMemo(() => [terminalRef, workflowRef, agentRef, uiRef], []);
  const { index, elapsed, reduced, pick, pause, resume } = useHeroDemo(heroRef);
  const [multicolor, setMulticolor] = useState(false);
  const [approval, setApproval] = useState<{ kit: string; value: boolean } | null>(null);
  const pickerId = useId();
  const kit = KITS[index];
  const { noInk, links, compact } = useHeroEffects({ heroRef, stageRef, canvasRef, windows, kit, multicolor, reduced });

  useEffect(() => {
    const tabs = tabsRef.current;
    const tab = tabs?.children[index] as HTMLElement | undefined;
    if (!tabs || !tab || tabs.scrollWidth <= tabs.clientWidth) return;
    tabs.scrollTo({ left: Math.max(0, tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2), behavior: reduced ? "instant" : "smooth" });
  }, [index, reduced]);

  const onKitKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[event.key];
    if (!direction && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? KITS.length - 1 : (index + direction + KITS.length) % KITS.length;
    pick(next);
    (tabsRef.current?.children[next] as HTMLElement | undefined)?.focus();
  };

  const command = `npx ailibrary kit add ${kit.id}`;
  const typed = command.slice(0, Math.max(0, Math.floor((elapsed - 150) / 22)));
  const files = [`workflows/${kit.flowFile}`, `${kit.agentFile}/`, `components/${kit.uiFile}`];
  const workflowStep = Math.floor((elapsed - 1950) / 430);
  const workflowDone = elapsed >= 3670;
  const agentProgress = clamp((elapsed - 4200) / 1520);
  const score = elapsed > 5720 ? Math.round(kit.score * clamp((elapsed - 5720) / 400)) : "--";
  const verdictReady = elapsed > 6140;
  const approved = approval?.kit === kit.id ? approval.value : verdictReady;
  const uiReady = elapsed >= 6500;
  const kpiMatch = kit.kpis[0][1].match(/^(\d+)(.*)$/);
  const kpi = kpiMatch ? `${Math.round(Number(kpiMatch[1]) * clamp((elapsed - 6500) / 800))}${kpiMatch[2]}` : kit.kpis[0][1];
  const phase = elapsed < 3800 ? 0 : elapsed < 6250 ? 1 : 2;
  const currentStep = kit.run[Math.max(0, Math.min(3, Math.floor((elapsed - 4200) / 380)))];
  const currentNode = kit.nodes[Math.max(0, Math.min(3, workflowStep))];
  const miniTitle = [kit.flowFile, kit.agentFile, kit.uiFile][phase];
  const miniDetail = phase === 0
    ? elapsed < 1950 ? `Installing the ${kit.name} kit` : `Workflow · ${currentNode.label} · ${currentNode.meta}`
    : phase === 1 ? `Agent · ${currentStep.tool} ${currentStep.arg}` : `UI · ${kit.kpis[0][0]} ${kpi}`;
  const live = (start: number, end: number) => elapsed >= start && elapsed < end;

  return (
    <section ref={heroRef} className={cn(s.root, className)} data-hero-theme="" data-color-mode={multicolor ? "multi" : "single"} aria-labelledby="hero-title">
      <HeroNavigation multicolor={multicolor} onColorModeChange={() => setMulticolor(value => !value)} />
      <div className={s.split}>
        <div className={s.left}>
          <HeroCursorField className={s.dash} />
          <div className={s.lc}>
            <div className={s.intro}>
              <h1 id="hero-title" className={s.h1}>
                <span>The AI kit your</span>
                <span className={s.hl}>whole business</span>
                <span>can run on</span>
              </h1>
              <p className={s.desc}>Production-ready workflows, agents and UI components running standalone &amp; packaged as kits for every team.</p>
              <div className={s.ctas}>
                <Link href="/kits" prefetch={false} className={cn(s.btn, s.btnAcc)}>Browse kits <ArrowRight aria-hidden="true" /></Link>
                <Link href="/workflows?access=free" prefetch={false} className={cn(s.btn, s.btnGhost)}>Get a free item</Link>
              </div>
            </div>
            <div className={s.kits}
              onPointerEnter={event => { if (event.pointerType !== "touch") pause(); }}
              onPointerLeave={event => { if (!event.currentTarget.matches(":focus-within")) resume(); }}
              onFocusCapture={pause}
              onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(":hover")) resume(); }}
            >
              <div className={s.kitsH}>
                <Dots /><span id={pickerId} className={s.kitsT}>kits</span><span className={s.kitsN}>5 NICHES</span>
              </div>
              <div ref={tabsRef} className={s.tabs} role="radiogroup" aria-labelledby={pickerId} onKeyDown={onKitKey}>
                {KITS.map((item, kitIndex) => (
                  <button key={item.id} type="button" role="radio" aria-checked={index === kitIndex} tabIndex={index === kitIndex ? 0 : -1} className={cn(s.tab, index === kitIndex && s.isOn)} onClick={() => pick(kitIndex)}>
                    <span className={s.trio} aria-hidden="true">{item.swatch.map(color => <i key={color} style={{ background: color }} />)}</span>
                    <span>{item.name}</span>
                    <span className={s.tabBar} style={{ width: `${index === kitIndex ? clamp(elapsed / 9000) * 100 : 0}%` }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div ref={stageRef} className={cn(s.right, noInk && s.isNoink, compact && s.is3)} role="group" aria-label="Live kit preview">
          <canvas ref={canvasRef} className={s.ink} aria-hidden="true" />
          <div className={s.inkfb} aria-hidden="true" />
          <svg className={s.linksSvg} aria-hidden="true">
            {links.map((link, linkIndex) => {
              if (link.hidden) return null;
              const [start, end] = LINK_WINDOWS[linkIndex];
              return (
                <Fragment key={linkIndex}>
                  <path className={s.lkBase} d={link.path} />
                  <path className={cn(s.lkFlow, live(start, end + 200) && s.isFlow, elapsed >= end + 200 && s.isDone)} d={link.path} />
                  <circle className={cn(s.lkDot, elapsed >= start && s.isOn)} cx={link.start.x} cy={link.start.y} r="3.5" />
                  <circle className={cn(s.lkDot, elapsed >= start + 600 && s.isOn)} cx={link.end.x} cy={link.end.y} r="3.5" />
                </Fragment>
              );
            })}
          </svg>
          {!reduced && links.map((link, linkIndex) => !link.hidden && live(...LINK_WINDOWS[linkIndex] as [number, number]) && (
            <i key={`${kit.id}-${linkIndex}`} className={cn(s.pk, s.isGo)} style={{ offsetPath: `path("${link.path}")` }} aria-hidden="true" />
          ))}

          <div className={s.mini} role="group" aria-label={`${kit.name} kit: ${["workflow", "agent", "UI"][phase]}`}>
            <div className={s.miniTop}><span className={s.miniLive}><i />LIVE RUN</span><span>{kit.name} kit</span></div>
            <div className={s.miniFlow}>
              {MINI_ICONS.map((Icon, miniIndex) => (
                <Fragment key={miniIndex}>
                  {miniIndex > 0 && (
                    <svg className={cn(s.mw, phase === miniIndex && s.isFlow, phase > miniIndex && s.isDone)} viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                      <path d={MINI_PATH} vectorEffect="non-scaling-stroke" /><path d={MINI_PATH} vectorEffect="non-scaling-stroke" />
                    </svg>
                  )}
                  <div className={cn(s.mn, phase === miniIndex && s.isOn, phase > miniIndex && s.isDone)}>
                    <span className={s.mnI}><Icon aria-hidden="true" /></span><b>{["workflow", "agent", "UI"][miniIndex]}</b>
                  </div>
                </Fragment>
              ))}
            </div>
            <div className={s.miniSt}><div className={s.miniT}>{miniTitle}</div><div className={s.miniS}>{miniDetail}</div><span className={s.miniBar}><i style={{ width: `${clamp(elapsed / 9000) * 100}%` }} /></span></div>
          </div>

          <div ref={terminalRef} className={cn(s.card, s.cT, live(0, 1550) && s.isOn)}>
            <WindowHeader title="zsh" tag="INSTALL" />
            <div className={s.tb}>
              <div className={cn(s.tl, s.isCmd)}><b>$</b><span>{typed}<i className={s.caret} aria-hidden="true" /></span></div>
              {files.map((file, fileIndex) => <div key={file} className={cn(s.tl, s.isChk, elapsed > 1000 + fileIndex * 180 && s.isOn)}><b>✓</b><span>{file}</span></div>)}
            </div>
          </div>

          <div ref={workflowRef} className={cn(s.card, s.cW, live(compact ? 0 : 1800, 3800) && s.isOn)}>
            <WindowHeader title={kit.flowFile} tag="WORKFLOW" />
            <div className={s.wn}>
              {kit.nodes.map((node, nodeIndex) => {
                const Icon = NODE_ICONS[nodeIndex];
                return (
                  <div key={node.label} className={cn(s.node, workflowStep === nodeIndex && s.isRun, workflowStep > nodeIndex && s.isDone)}>
                    <span className={s.ni}><Icon aria-hidden="true" /></span><Check className={s.nok} aria-hidden="true" />
                    <span className={s.nl}>{node.label}</span><span className={s.ns}>{node.meta}</span>
                  </div>
                );
              })}
            </div>
            <div className={s.cf}><span>{kit.platforms}</span><b className={workflowDone ? s.isOn : undefined}>{workflowDone ? "✓ " : ""}{kit.flowStat}</b></div>
          </div>

          <div ref={agentRef} className={cn(s.card, s.cA, live(4050, 6250) && s.isOn)}>
            <WindowHeader title={kit.agentFile} tag="AGENT" />
            <div className={s.ab}>
              {kit.run.map((step, stepIndex) => {
                const busy = live(4200 + stepIndex * 380, 4580 + stepIndex * 380);
                const done = elapsed >= 4580 + stepIndex * 380;
                return <div key={step.tool + stepIndex} className={cn(s.st, busy && s.isRun, done && s.isDone)}><i className={s.si} aria-hidden="true" /><span className={s.stN}><b>{step.tool}</b>{step.arg}</span><span className={s.stMs}>{done ? step.time : busy ? "..." : ""}</span></div>;
              })}
              <div className={s.pr}><span className={s.prB}><i style={{ width: `${agentProgress * 100}%` }} /></span><span className={s.prN}>{score}</span></div>
            </div>
            <div className={s.cf}><span>approval</span><span className={s.af}><b className={verdictReady ? s.isOn : undefined}>{verdictReady ? kit.verdict : "pending"}</b><button type="button" role="switch" aria-label="Approve agent result" aria-checked={approved} className={cn(s.tg, approved && s.isOn)} onClick={() => setApproval({ kit: kit.id, value: !approved })}><i /></button></span></div>
          </div>

          <div ref={uiRef} className={cn(s.card, s.cU, uiReady && s.isOn)}>
            <WindowHeader title={kit.uiFile} tag="UI" />
            <div className={s.ub}>
              <div className={s.uk}>{kit.name}</div><div className={s.ut}><span>Overview</span><ChartNoAxesColumnIncreasing aria-hidden="true" /></div>
              <div className={s.kp}><div className={cn(s.kb, s.isAcc)}><span>{kit.kpis[0][0]}</span><b>{kpi}</b></div><div className={s.kb}><span>{kit.kpis[1][0]}</span><b>{kit.kpis[1][1]}</b></div></div>
              <div className={s.bars} aria-hidden="true">{kit.spark.map((height, barIndex) => <i key={barIndex} className={barIndex === 6 && uiReady ? s.isHot : undefined} style={{ height: `${height * 10 + (barIndex === 6 && uiReady ? 10 : 0)}%` }} />)}</div>
              <div className={s.rows}>{kit.rows.slice(0, 2).map((row, rowIndex) => <div key={row[0]} className={cn(s.row, rowIndex === 0 && uiReady && s.isNew)}><span>{row[0]}</span><em>{row[3]}</em></div>)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
