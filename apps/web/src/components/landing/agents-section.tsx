import { highlight } from "fumadocs-core/highlight";
import { Fragment } from "react";
import { home, homeCopy } from "@content/home";
import { LazyDemo } from "./lazy-demo";

const codeTheme = {
  name: "ai-library-marketing",
  type: "dark" as const,
  colors: { "editor.background": "#111114", "editor.foreground": "#F4F4F2" },
  settings: [
    { scope: ["comment"], settings: { foreground: "#71717A" } },
    { scope: ["keyword", "storage", "entity.name.function"], settings: { foreground: "#9B7BFF" } },
    { scope: ["string"], settings: { foreground: "#4ADE80" } },
    { scope: ["constant.numeric", "constant.language"], settings: { foreground: "#9B7BFF" } },
  ],
};

const semanticColors: Record<string, string> = {
  "#111114": "transparent",
  "#F4F4F2": "var(--ink)",
  "#71717A": "var(--faint)",
  "#9B7BFF": "var(--p)",
  "#4ADE80": "var(--ok)",
};

export async function AgentsSection() {
  const codePanels = await Promise.all(home.agentForms.map(async ([, lines], index) => {
    if (index !== 0 && index !== 2) return <pre className="lp-code-b" key={index}><code>{lines.map(([line, className], lineIndex) => <span className={`lp-cl ${className}`} key={lineIndex}>{line || " "}</span>)}</code></pre>;
    const highlighted = await highlight(lines.map(([line]) => line).join("\n"), {
      lang: index === 0 ? "typescript" : "json",
      theme: codeTheme,
      components: {
        pre: ({ children }) => <pre className="lp-code-b">{children}</pre>,
        code: ({ children }) => <code>{children}</code>,
        span: ({ children, className, style }) => <span className={className === "line" ? "lp-cl" : className} style={style ? { ...style, color: semanticColors[String(style.color).toUpperCase()] ?? style.color } : undefined}>{children}</span>,
      },
    });
    return <Fragment key={index}>{highlighted}</Fragment>;
  }));

  return (
    <section className="lp-sec" id="agents" aria-labelledby="ag-h">
      <div className="lp-wrap">
        <LazyDemo name="agent" codePanels={codePanels}><h2 className="lp-h2" id="ag-h">{homeCopy.agents.title} <em>{homeCopy.agents.accent}</em></h2><p className="lp-sub">{homeCopy.agents.description}</p></LazyDemo>
        <LazyDemo name="agent-results" />
      </div>
    </section>
  );
}
