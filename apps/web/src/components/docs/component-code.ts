import "server-only";

import { getHighlighter } from "fumadocs-core/highlight";
import type { ComponentSourceFile } from "./component-source.types";

type CodePalette = {
  foreground: string;
  background: string;
  keyword: string;
  string: string;
  type: string;
  number: string;
  comment: string;
};

/** These editor colours stay local to source previews, independent of UI accents. */
function codeTheme(name: string, type: "light" | "dark", palette: CodePalette) {
  return {
    name,
    type,
    colors: {
      "editor.foreground": palette.foreground,
      "editor.background": palette.background,
    },
    tokenColors: [
      { scope: ["keyword", "storage"], settings: { foreground: palette.keyword } },
      { scope: ["string", "constant.other.symbol"], settings: { foreground: palette.string } },
      {
        scope: ["entity.name.type", "entity.name.class", "entity.name.namespace", "entity.other.inherited-class", "support.type", "support.class", "entity.name.tag", "entity.other.attribute-name"],
        settings: { foreground: palette.type },
      },
      { scope: ["constant.numeric", "constant.language", "keyword.other.unit"], settings: { foreground: palette.number } },
      { scope: ["keyword.operator", "punctuation.section.embedded", "punctuation.definition.template-expression"], settings: { foreground: palette.foreground } },
      { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: palette.comment, fontStyle: "italic" } },
    ],
  };
}

const lightTheme = codeTheme("ailibrary-code-light", "light", {
  foreground: "#24292E",
  background: "#F6F6F3",
  keyword: "#6639BA",
  string: "#116329",
  type: "#0550AE",
  number: "#953800",
  comment: "#5F6873",
});
const darkTheme = codeTheme("ailibrary-code-dark", "dark", {
  foreground: "#E1E4E8",
  background: "#111114",
  keyword: "#D69CEB",
  string: "#79D9B1",
  type: "#8DB9FF",
  number: "#EDB887",
  comment: "#A0A6B0",
});

/** Highlight on the server so the browser never downloads a syntax engine. */
export async function highlightComponentFile(file: ComponentSourceFile): Promise<string> {
  const highlighter = await getHighlighter("js", {
    langs: ["tsx", "typescript", "css"],
    themes: [lightTheme, darkTheme],
  });
  const html = highlighter.codeToHtml(file.code, {
    lang: file.language,
    themes: { light: lightTheme.name, dark: darkTheme.name },
    defaultColor: false,
  });
  const start = html.indexOf("<code>");
  const end = html.lastIndexOf("</code>");
  if (start < 0 || end < start) throw new Error("Syntax highlighter did not return a code element");
  // Only Shiki's escaped, server-generated tokens cross this HTML boundary.
  return html.slice(start + "<code>".length, end);
}
