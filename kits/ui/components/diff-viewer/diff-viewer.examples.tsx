"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDesignAccentStyle, type DesignAccent } from "../../../packages/ui-foundation/src/design-accent";
import { DiffViewer } from "./diff-viewer";
import type { DiffDemoCrm, DiffDemoReply } from "./diff-viewer.demo";
import "./diff-viewer.demo.css";

export type DiffViewerStory = "empty" | "large" | "json" | "code" | "interactive";
export interface DiffViewerExamplesProps {
  story: DiffViewerStory;
  reply: DiffDemoReply;
  crm: DiffDemoCrm;
  accent?: DesignAccent;
}

const descriptions: Record<DiffViewerStory, string> = {
  empty: "The record matches. There are no proposed changes to review.",
  large: "5,000 support notes. Expand folded context to inspect the original text.",
  json: "The same Brooklyn proposal, compared as JSON with stable property order.",
  code: "TypeScript generated from the Brooklyn CRM proposal.",
  interactive: "Accept or reject a field. Reviews are saved to this preview only.",
};
const titles: Record<DiffViewerStory, string> = {
  empty: "No proposed changes", large: "Brooklyn support history", json: "Brooklyn CRM record · JSON",
  code: "Brooklyn expansion · TypeScript", interactive: "Review Brooklyn changes",
};
const asCode = (record: Readonly<Record<string, string>>) => `type Deal = Record<string, string>;\n\nconst deal: Deal = ${JSON.stringify(record, null, 2)};\n`;

/** Optional states for the docs playground; every example uses the supplied seed records. */
export function DiffViewerExamples({ story, reply, crm, accent = "mono" }: DiffViewerExamplesProps) {
  const [simulateFailure, setSimulateFailure] = useState(false);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pending = timers.current;
    return () => { for (const timer of pending) clearTimeout(timer); };
  }, []);
  const large = useMemo(() => {
    if (story !== "large") return null;
    const original = reply.before.split("\n").filter((line) => line.trim());
    const proposed = reply.after.split("\n").filter((line) => line.trim());
    const before = Array.from({ length: 5000 }, (_, index) => `Brooklyn · support note ${String(index + 1).padStart(4, "0")}: ${original[index % original.length] ?? reply.title}`);
    const after = [...before];
    after[12] = `Brooklyn · support note 0013: ${proposed[1] ?? reply.after}`;
    after[4990] = `Brooklyn · support note 4991: ${proposed.at(-1) ?? reply.after}`;
    return { before: before.join("\n"), after: after.join("\n") };
  }, [story, reply.before, reply.after, reply.title]);
  const mode = story === "empty" || story === "interactive" ? "fields" : story === "json" ? "json" : story === "code" ? "code" : "text";
  const before = story === "large" ? large!.before : story === "code" ? asCode(crm.before) : crm.before;
  const after = story === "empty" ? crm.before : story === "large" ? large!.after : story === "code" ? asCode(crm.after) : crm.after;
  const review = async () => {
    const fail = simulateFailure;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => { timers.current.delete(timer); resolve(); }, 450);
      timers.current.add(timer);
    });
    if (fail) throw new Error("Synthetic local preview failure");
  };

  return <section className="ail-diff-demo ail-diff-examples" data-ui-design data-testid="diff-viewer-examples" data-story={story} style={getDesignAccentStyle(accent)} aria-label={`${titles[story]} example`}>
    <div className="ail-diff-demo-tools">
      <p className="ail-diff-demo-note">{descriptions[story]}</p>
      {story === "interactive" && <Button type="button" size="sm" variant="outline" className="ail-diff-demo-button"
        aria-pressed={simulateFailure} onClick={() => setSimulateFailure((previous) => !previous)}>Simulate failure</Button>}
    </div>
    <DiffViewer mode={mode} before={before} after={after} title={titles[story]} language="typescript"
      interactive={story === "interactive"} {...(story === "interactive" ? { onHunkDecision: review } : {})} />
    {story === "interactive" && <p className="ail-diff-demo-note">No CRM data is changed. A failed review keeps the previous decision and can be retried.</p>}
  </section>;
}
