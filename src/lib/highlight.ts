import "server-only";
/**
 * Серверная подсветка синтаксиса (Shiki, JS-движок регулярных выражений, без WASM).
 * Результат — токены по строкам: рендерим сами, чтобы управлять нумерацией и подсветкой строк.
 * При любой ошибке подсветки возвращается обычный текст: код всегда читаем.
 */
import { createHighlighterCore, type HighlighterCore, type ThemeRegistrationRaw } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { bundledLanguages } from "shiki/langs";
import type { CodeLang } from "@/content/types";

import type { TokenLine } from "./highlight-types";
export type { Token, TokenLine } from "./highlight-types";

const theme: ThemeRegistrationRaw = {
  name: "devdock",
  type: "dark",
  colors: { "editor.background": "#0c0b09", "editor.foreground": "#e3dcc9" },
  // Внимание: Shiki читает правила из `settings` и игнорирует `tokenColors`, если `settings` задан.
  // Палитра «Атласа»: ключевые слова — ляпис, строки — медянка, числа — крапп, функции — гуммигут, теги — киноварь.
  settings: [
    { settings: { foreground: "#e3dcc9", background: "#0c0b09" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#8f8670", fontStyle: "italic" } },
    { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: "#7ccdb0" } },
    { scope: ["constant.numeric", "constant.language", "constant.character", "keyword.other.unit"], settings: { foreground: "#e58aa9" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new"], settings: { foreground: "#86a6f2" } },
    { scope: ["keyword.operator"], settings: { foreground: "#b8ae98" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#e6b43e" } },
    { scope: ["entity.name.tag", "meta.tag.sgml", "entity.name.tag.css", "entity.name.tag.html"], settings: { foreground: "#ee7455" } },
    { scope: ["entity.other.attribute-name", "entity.other.attribute-name.html"], settings: { foreground: "#b79be3" } },
    { scope: ["entity.other.attribute-name.class.css", "entity.other.attribute-name.id.css", "entity.other.attribute-name.pseudo-class.css", "entity.other.attribute-name.pseudo-element.css"], settings: { foreground: "#ee7455" } },
    { scope: ["support.type.property-name", "meta.property-name", "support.type.property-name.css", "variable.other.property", "variable.other.object.property", "meta.object-literal.key"], settings: { foreground: "#9db8f5" } },
    { scope: ["support.constant", "support.constant.property-value", "meta.property-value"], settings: { foreground: "#e58aa9" } },
    { scope: ["variable", "variable.other", "variable.parameter"], settings: { foreground: "#e3dcc9" } },
    { scope: ["support.class", "entity.name.type", "entity.name.class", "support.type"], settings: { foreground: "#c6a8ee" } },
    { scope: ["punctuation", "meta.brace", "punctuation.separator", "punctuation.terminator"], settings: { foreground: "#9b927b" } },
    { scope: ["punctuation.definition.tag"], settings: { foreground: "#9b927b" } },
    { scope: ["markup.inserted"], settings: { foreground: "#7ccdb0" } },
    { scope: ["markup.deleted"], settings: { foreground: "#ee7455" } },
    { scope: ["invalid"], settings: { foreground: "#ee7455" } },
  ],
};

const LANG_MAP: Record<CodeLang, keyof typeof bundledLanguages | null> = {
  html: "html",
  css: "css",
  js: "javascript",
  ts: "typescript",
  json: "json",
  sql: "sql",
  bash: "shellscript",
  http: "http",
  text: null,
  diff: "diff",
  c: "c",
  python: "python",
  yaml: "yaml",
};

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [theme],
    langs: [
      bundledLanguages.html,
      bundledLanguages.css,
      bundledLanguages.javascript,
      bundledLanguages.typescript,
      bundledLanguages.json,
      bundledLanguages.sql,
      bundledLanguages.shellscript,
      bundledLanguages.http,
      bundledLanguages.diff,
      bundledLanguages.c,
      bundledLanguages.python,
      bundledLanguages.yaml,
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}

const plain = (code: string): TokenLine[] => code.split("\n").map((l) => [{ content: l }]);

export async function highlight(code: string, lang: CodeLang): Promise<TokenLine[]> {
  const shikiLang = LANG_MAP[lang];
  if (!shikiLang) return plain(code);
  try {
    const hl = await getHighlighter();
    const { tokens } = hl.codeToTokens(code, { lang: shikiLang, theme: "devdock" });
    return tokens.map((line) =>
      line.map((t) => ({
        content: t.content,
        color: t.color,
        // fontStyle — битовая маска: 1 italic, 2 bold
        italic: !!t.fontStyle && (t.fontStyle & 1) === 1,
        bold: !!t.fontStyle && (t.fontStyle & 2) === 2,
      })),
    );
  } catch {
    return plain(code);
  }
}
