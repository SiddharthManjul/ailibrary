"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { DocCopyButton, PackageManagerCommand, docsTabKeyboard } from "@/components/site/docs-interactive";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComponentSourceBundle } from "./component-source.types";
import { CodeView } from "./code-view";
import styles from "./component-workbench.module.css";

type WorkbenchContext = {
  source: ComponentSourceBundle;
  view: number;
  setView: (view: number) => void;
  file: string;
  setFile: (file: string) => void;
  codeTab: RefObject<HTMLButtonElement | null>;
};
const Context = createContext<WorkbenchContext | null>(null);
const shadcnCLI = "shadcn@4.22.0";

export function ComponentDocsProvider({ source, children }: { source?: ComponentSourceBundle; children: ReactNode }) {
  const [view, setView] = useState(0);
  const [file, setFile] = useState(source?.files[0]?.path ?? "");
  const codeTab = useRef<HTMLButtonElement>(null);
  return <Context value={source ? { source, view, setView, file, setFile, codeTab } : null}>{children}</Context>;
}

export function ComponentQuickInstall() {
  const context = useContext(Context);
  const id = useId();
  if (!context) return null;
  const command = `pnpm dlx ${shadcnCLI} add ${context.source.registryName}`;
  return <div className={styles.quickInstall} data-testid="component-quick-install" role="group" aria-label="Installation command" aria-describedby={`${id}-status`}>
    <div className={styles.commandRow}>
      <span className={styles.prompt} aria-hidden="true">$</span>
      <code>{command}</code>
      <div className={styles.commandCopy}><DocCopyButton text={command} label="Copy installation command" /></div>
    </div>
    <p className={styles.commandStatus} id={`${id}-status`}>Registry publishing pending · <a href="#install">Manual installation</a></p>
  </div>;
}

export function ComponentWorkbench({ children }: { children: ReactNode }) {
  const context = useContext(Context);
  const id = useId();
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const active = context?.source.files.find((item) => item.path === context.file) ?? context?.source.files[0];
  const view = context?.view;
  const slug = context?.source.slug;
  const filePath = active?.path;
  useEffect(() => {
    if (view !== 1 || !slug || !filePath || highlights[filePath]) return;
    const controller = new AbortController();
    void fetch(`/docs/ui/${slug}/highlight?file=${encodeURIComponent(filePath)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const result: unknown = await response.json();
        if (typeof result === "object" && result !== null && "path" in result && result.path === filePath && "html" in result && typeof result.html === "string") {
          setHighlights((previous) => ({ ...previous, [filePath]: result.html as string }));
        }
      })
      // Syntax colours are optional. Plain text and exact copying stay usable
      // if the request is interrupted or the highlighting service is offline.
      .catch(() => {});
    return () => controller.abort();
  }, [view, slug, filePath, highlights]);
  if (!context) return children;
  const { source, setView, setFile, codeTab } = context;
  return <section className={styles.workbench} data-testid="component-workbench" aria-label="Component example and source">
    <div className={`st-code-h is-tabs ${styles.header}`}>
      <div className="st-ctabs" role="tablist" aria-label="Component view">
        {["Preview", "Code"].map((label, index) => <button type="button" role="tab" key={label}
          ref={index === 1 ? codeTab : undefined} id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
          aria-selected={view === index} tabIndex={view === index ? 0 : -1} className={view === index ? "is-on" : ""}
          onClick={() => setView(index)} onKeyDown={(event) => docsTabKeyboard(event, index, 2, setView)}>{label}</button>)}
      </div>
      <span className={styles.meta}>React · TypeScript</span>
    </div>
    <div role="tabpanel" id={`${id}-panel-0`} aria-labelledby={`${id}-tab-0`} hidden={view !== 0} className={styles.previewPanel}>
      {children}
    </div>
    <div role="tabpanel" id={`${id}-panel-1`} aria-labelledby={`${id}-tab-1`} hidden={view !== 1} data-testid="component-source">
      {active && <>
        <div className={styles.sourceToolbar}>
          <label className={styles.fileControl} htmlFor={`${id}-file`}>
            <span>Source file</span>
            <Select value={active.path} onValueChange={setFile}>
              <SelectTrigger id={`${id}-file`} aria-label="Source file"><SelectValue /></SelectTrigger>
              <SelectContent className={styles.fileMenu}>
                {source.files.map((item) => <SelectItem key={item.path} value={item.path}>{item.path}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <div className={styles.copy}><DocCopyButton text={active.code} label="Copy code" /></div>
        </div>
        <div className={styles.fileInfo}><span>{active.kind === "example" ? "Example" : active.kind === "component" ? "Component" : "Shared dependency"}</span><span>{active.code.split("\n").length} lines · {active.language.toUpperCase()}</span></div>
        <CodeView key={active.path} code={active.code} html={highlights[active.path]} label={active.path} />
        <p className={styles.sourceNote}>Save files at the paths shown. Example files recreate the demo; component and shared files are reusable in your own UI. <a href={`/docs/ui/${source.slug}/source`}>View source JSON</a></p>
      </>}
    </div>
  </section>;
}

export function ComponentInstallation() {
  const context = useContext(Context);
  const [method, setMethod] = useState(0);
  if (!context) return null;
  const { source, setView, codeTab } = context;
  function showSource() {
    setView(1);
    requestAnimationFrame(() => {
      codeTab.current?.scrollIntoView({ block: "center", behavior: "instant" });
      codeTab.current?.focus({ preventScroll: true });
    });
  }
  return <div className={styles.install} data-testid="component-installation">
    <div className={`st-seg ${styles.methods}`} role="radiogroup" aria-label="Installation method">
      {["Manual", "CLI"].map((label, index) => <button key={label} type="button" role="radio" aria-checked={method === index}
        tabIndex={method === index ? 0 : -1} className={method === index ? "is-on" : ""} onClick={() => setMethod(index)}
        onKeyDown={(event) => docsTabKeyboard(event, index, 2, setMethod)}>{label}</button>)}
    </div>
    {method === 0 ? <div className={styles.manual}>
      <ol className="st-ol">
        <li><span className="st-ol-n" aria-hidden="true">1</span><div><b>Prepare your project</b><span>Use React 19, TypeScript and Tailwind CSS 4 with shadcn initialized. Keep your existing root theme provider and font.</span>
          {source.primitives.length > 0 && <PackageManagerCommand command={`${shadcnCLI} add ${source.primitives.join(" ")}`} />}
        </div></li>
        {source.dependencies.length > 0 && <li><span className="st-ol-n" aria-hidden="true">2</span><div><b>Add the dependencies</b><span>These packages support the component and the complete example.</span><PackageManagerCommand mode="install" command={source.dependencies.join(" ")} /></div></li>}
        <li><span className="st-ol-n" aria-hidden="true">{source.dependencies.length > 0 ? "3" : "2"}</span><div><b>Copy the source files</b><span>Copy the component, styles and shared dependencies from Code. Include the example files if you want the full preview.</span><button type="button" className={styles.sourceButton} onClick={showSource}>View source files <span aria-hidden="true">↗</span></button></div></li>
        <li><span className="st-ol-n" aria-hidden="true">{source.dependencies.length > 0 ? "4" : "3"}</span><div><b>Make it yours</b><span>Use the import in Usage below. Pass new data through props, and keep the CSS files together so theme and motion settings work.</span></div></li>
      </ol>
    </div> : <div className={styles.pending}>
      <span className={styles.pendingLabel}>Coming soon</span>
      <p>AI Library registry installation is not available yet. Use Manual to add this component today.</p>
      <p>The shadcn CLI is already available. The AI Library registry and npm packages have not been published.</p>
      <button type="button" className={styles.sourceButton} onClick={() => setMethod(0)}>Use manual installation <span aria-hidden="true">→</span></button>
    </div>}
  </div>;
}
