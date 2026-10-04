"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./parts";

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
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

  return <button type="button" className={`${className}${status === "copied" ? " is-copied" : ""}`} onClick={copy} aria-label={status === "failed" ? "Copy failed. Select the command to copy it manually." : label.endsWith("command") ? label : `${label} command`}><Icon name={status === "copied" ? "check" : "copy"} /><span role="status">{status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : label}</span></button>;
}
