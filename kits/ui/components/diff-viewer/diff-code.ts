export interface DiffCodeToken { content: string; light: string; dark: string }
export type DiffCodeLines = readonly (readonly DiffCodeToken[])[];
let highlighter: Promise<Awaited<ReturnType<typeof import("shiki/core")["createHighlighterCore"]>>> | undefined;
function theme(name: string, type: "light" | "dark", colors: readonly string[]) {
  const [foreground, background, keyword, string, entity, number, comment] = colors;
  return { name, type, colors: { "editor.foreground": foreground!, "editor.background": background! }, tokenColors: [
    { scope: ["keyword", "storage"], settings: { foreground: keyword! } },
    { scope: ["string", "constant.other.symbol"], settings: { foreground: string! } },
    { scope: ["entity.name.type", "entity.name.class", "entity.name.namespace", "entity.other.inherited-class", "support.type", "support.class", "entity.name.tag", "entity.other.attribute-name"], settings: { foreground: entity! } },
    { scope: ["constant.numeric", "constant.language", "keyword.other.unit"], settings: { foreground: number! } },
    { scope: ["keyword.operator", "punctuation.section.embedded", "punctuation.definition.template-expression"], settings: { foreground: foreground! } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: comment!, fontStyle: "italic" } },
  ] };
}
const light = theme("ail-diff-light", "light", ["#24292E", "#FFFFFF", "#6639BA", "#116329", "#0550AE", "#953800", "#5F6873"]);
const dark = theme("ail-diff-dark", "dark", ["#E1E4E8", "#121216", "#D69CEB", "#79D9B1", "#8DB9FF", "#EDB887", "#A0A6B0"]);

/** This module is imported only for mode=code. Never inject source as HTML. */
export async function highlightDiffCode(code: string, language: string, signal?: AbortSignal): Promise<DiffCodeLines> {
  if (!highlighter) highlighter = Promise.all([
    import("shiki/core"), import("shiki/engine/javascript"),
    import("shiki/langs/typescript.mjs"), import("shiki/langs/tsx.mjs"),
    import("shiki/langs/javascript.mjs"), import("shiki/langs/python.mjs"),
    import("shiki/langs/json.mjs"), import("shiki/langs/css.mjs"),
  ]).then(([core, engine, ...languages]) => core.createHighlighterCore({ themes: [light, dark], langs: languages.map((entry) => entry.default), engine: engine.createJavaScriptRegexEngine() })).catch((error: unknown) => { highlighter = undefined; throw error; });
  const instance = await highlighter;
  const lang = ({ ts: "typescript", js: "javascript", py: "python", jsx: "tsx" } as Record<string, string>)[language] ?? language;
  const supported = instance.getLoadedLanguages().includes(lang) ? lang : "text";
  const rows: DiffCodeToken[][] = [];
  // A tokenizer time limit applies to one line, rather than the entire batch.
  // Carry grammar state one line at a time and yield on an elapsed budget.
  let grammarState: ReturnType<typeof instance.codeToTokens> ["grammarState"];
  const lines = code.split("\n");
  let sliceStart = performance.now();
  for (let offset = 0; offset < lines.length; offset++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const result = instance.codeToTokensWithThemes(lines[offset]!, { lang: supported, themes: { light: light.name, dark: dark.name }, tokenizeMaxLineLength: 16000, tokenizeTimeLimit: 4, ...(grammarState ? { grammarState } : {}) });
    grammarState = instance.getLastGrammarState(result);
    rows.push(...result.map((row) => row.map((token) => ({ content: token.content, light: token.variants.light?.color ?? "currentColor", dark: token.variants.dark?.color ?? "currentColor" }))));
    if (performance.now() - sliceStart > 7 || offset % 40 === 39) { await new Promise<void>((resolve) => setTimeout(resolve, 0)); sliceStart = performance.now(); }
  }
  return rows;
}
