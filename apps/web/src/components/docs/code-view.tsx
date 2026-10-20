import { Fragment } from "react";
import styles from "./code-view.module.css";

/** The gutter is separate from the code so selection and copying stay clean. */
export function CodeView({ code, html, label, compact = false }: { code: string; html?: string; label: string; compact?: boolean }) {
  const lines = code.split("\n");
  return <div className={`${styles.editor}${compact ? ` ${styles.compact}` : ""}`} data-testid="code-editor">
    <div className={styles.rows}>
      <div className={styles.gutter} aria-hidden="true" data-testid="code-line-numbers">
        {lines.map((_line, index) => <span key={index}>{index + 1}</span>)}
      </div>
      <pre className={styles.code} tabIndex={0} aria-label={label} data-highlighted={Boolean(html)}>
        {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{lines.map((line, index) => <Fragment key={index}><span className="line">{line}</span>{index < lines.length - 1 ? "\n" : ""}</Fragment>)}</code>}
      </pre>
    </div>
  </div>;
}
