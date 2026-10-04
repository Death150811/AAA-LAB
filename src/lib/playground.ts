/**
 * Сборка документа для песочницы. Чистые функции без доступа к DOM.
 *
 * Безопасность: документ показывается в <iframe sandbox="allow-scripts …"> БЕЗ allow-same-origin —
 * у кода песочницы «непрозрачный» origin: нет доступа ни к родительской странице, ни к localStorage/cookies сайта.
 * Дополнительно внутри документа действует CSP: запрещены сетевые запросы (fetch/XHR/WebSocket), формы, вложенные фреймы.
 */

export interface PlaygroundSource {
  html: string;
  css: string;
  js: string;
}

const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob: https:",
  "media-src data: blob: https:",
  "font-src data:",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

/** Мост консоли: перехватывает console.* и ошибки, передаёт строки в родителя. Содержимое всегда — обычный текст. */
const bridge = (runId: string) => `
(function () {
  var RUN = ${JSON.stringify(runId)};
  function ser(v) {
    try {
      if (v instanceof Error) return v.name + ": " + v.message;
      if (typeof v === "string") return v;
      if (typeof v === "undefined") return "undefined";
      if (typeof v === "function") return "ƒ " + (v.name || "anonymous") + "()";
      var seen = [];
      return JSON.stringify(v, function (k, val) {
        if (typeof val === "function") return "ƒ";
        if (typeof val === "object" && val !== null) {
          if (seen.indexOf(val) !== -1) return "[Circular]";
          seen.push(val);
        }
        return val;
      }, 2);
    } catch (e) {
      try { return String(v); } catch (_) { return "[object]"; }
    }
  }
  function send(level, args) {
    var text = Array.prototype.map.call(args, ser).join(" ");
    if (text.length > 4000) text = text.slice(0, 4000) + "…";
    parent.postMessage({ source: "devdock-playground", run: RUN, level: level, text: text }, "*");
  }
  ["log", "info", "warn", "error", "debug"].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      send(level, arguments);
      try { original.apply(console, arguments); } catch (e) {}
    };
  });
  window.addEventListener("error", function (e) {
    send("error", [e.message + (e.lineno ? " (строка " + e.lineno + ")" : "")]);
  });
  window.addEventListener("unhandledrejection", function (e) {
    send("error", ["Необработанное отклонение промиса: " + ser(e.reason)]);
  });
})();`;

const isFullDocument = (html: string) => /<!doctype|<html[\s>]/i.test(html);

export function buildSrcDoc({ html, css, js }: PlaygroundSource, runId: string): string {
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${CSP}"><style>${css}</style><script>${bridge(runId)}</script>`;
  const userScript = js.trim() ? `<script>\n${js}\n</script>` : "";

  if (!isFullDocument(html)) {
    return `<!doctype html><html lang="ru"><head>${head}</head><body>${html}${userScript}</body></html>`;
  }

  // Пользователь написал полный документ: внедряем мост/стили в <head>, скрипт — перед </body>.
  let doc = html;
  if (/<head[\s>]/i.test(doc)) doc = doc.replace(/<head([^>]*)>/i, `<head$1>${head}`);
  else if (/<html[^>]*>/i.test(doc)) doc = doc.replace(/<html([^>]*)>/i, `<html$1><head>${head}</head>`);
  else doc = doc.replace(/<!doctype[^>]*>/i, (m) => `${m}<head>${head}</head>`);
  if (userScript) doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, `${userScript}</body>`) : doc + userScript;
  return doc;
}

/** Состояние ↔ фрагмент URL (#html=…&css=…&js=…). */
export function encodeHash(s: PlaygroundSource): string {
  const parts: string[] = [];
  if (s.html) parts.push(`html=${encodeURIComponent(s.html)}`);
  if (s.css) parts.push(`css=${encodeURIComponent(s.css)}`);
  if (s.js) parts.push(`js=${encodeURIComponent(s.js)}`);
  return parts.join("&");
}

export function decodeHash(hash: string): Partial<PlaygroundSource> | null {
  const h = hash.replace(/^#/, "");
  if (!h) return null;
  try {
    const out: Partial<PlaygroundSource> = {};
    for (const part of h.split("&")) {
      const i = part.indexOf("=");
      if (i < 0) continue;
      const key = part.slice(0, i);
      const val = decodeURIComponent(part.slice(i + 1));
      if (key === "html" || key === "css" || key === "js") out[key] = val;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
