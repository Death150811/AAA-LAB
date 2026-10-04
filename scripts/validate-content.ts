/**
 * Контроль качества контента (Quality Gate).
 * Запуск: npm run validate:content
 *
 * ERROR  — структурная ошибка: ломает сборку/навигацию/проверку знаний, должна быть исправлена.
 * WARN   — недостаточная глубина темы относительно стандарта DevDock; исправляется до принятия темы.
 */
import { allProjects, allTopics, domains } from "../src/content/registry";
import { SECTION_META } from "../src/content/sections";
import type { Block, QuizQuestion, Topic } from "../src/content/types";

const errors: string[] = [];
const warns: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warns.push(`${where}: ${msg}`);

/* ───────── утилиты ───────── */
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1").replace(/[*`]/g, "");
function blockWords(b: Block): number {
  const count = (s: string) => plain(s).split(/\s+/).filter(Boolean).length;
  switch (b.type) {
    case "p":
    case "h":
      return count(b.text);
    case "list":
      return b.items.reduce((n, i) => n + count(i), 0);
    case "callout":
      return count(b.text);
    case "definition":
      return count(b.text);
    case "table":
      return b.rows.flat().reduce((n, c) => n + count(c), 0);
    case "steps":
      return b.items.reduce((n, i) => n + count(i.title) + count(i.text), 0);
    case "compare":
      return count(b.bad.note) + count(b.good.note);
    case "annotated":
      return b.notes.reduce((n, i) => n + count(i.text), 0);
    default:
      return 0;
  }
}
const lineCount = (code: string) => code.split("\n").length;

/* ───────── ссылки ───────── */
const topicPaths = new Set(allTopics.map((t) => `/learn/${t.domain}/${t.slug}`));
const domainPaths = new Set(domains.map((d) => `/learn/${d.slug}`));
const projectPaths = new Set(allProjects.map((p) => `/projects/${p.domain}/${p.id.split(".")[1]}`));

function checkLinks(where: string, text: string) {
  for (const m of text.matchAll(/\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g)) {
    const path = m[1]!.replace(/\/$/, "");
    if (!topicPaths.has(path) && !domainPaths.has(path) && !projectPaths.has(path) && !["/learn", "/playground", "/me", "/flashcards"].includes(path)) {
      err(where, `битая внутренняя ссылка ${path}`);
    }
  }
}

function walkBlocks(where: string, blocks: Block[]) {
  for (const b of blocks) {
    const texts: string[] = [];
    switch (b.type) {
      case "p":
      case "h":
      case "callout":
        texts.push(b.text);
        break;
      case "list":
        texts.push(...b.items);
        break;
      case "table":
        texts.push(...b.head, ...b.rows.flat());
        break;
      case "definition":
        texts.push(b.text);
        break;
      case "steps":
        texts.push(...b.items.map((i) => i.text));
        break;
      case "compare":
        texts.push(b.bad.note, b.good.note);
        break;
      case "annotated": {
        texts.push(...b.notes.map((n) => n.text));
        const n = lineCount(b.code);
        for (const note of b.notes) {
          const [a, z] = typeof note.line === "number" ? [note.line, note.line] : note.line;
          if (a < 1 || z > n || a > z) err(where, `аннотация указывает на строки ${a}–${z}, а в коде ${n} строк`);
        }
        break;
      }
      case "code": {
        const n = lineCount(b.code);
        for (const l of b.highlight ?? []) if (l < 1 || l > n) err(where, `подсветка строки ${l} вне диапазона (в коде ${n})`);
        if (/\t/.test(b.code)) warn(where, "в коде есть символы табуляции");
        break;
      }
    }
    texts.forEach((t) => checkLinks(where, t));
    // непарные маркеры разметки — частая опечатка
    for (const t of texts) {
      if ((t.match(/`/g)?.length ?? 0) % 2) err(where, `непарный символ ` + "`" + ` в тексте: «${t.slice(0, 60)}…»`);
      // `**` внутри кода (оператор возведения в степень) — не разметка
      if (((t.replace(/`[^`]*`/g, "").match(/\*\*/g)?.length) ?? 0) % 2) err(where, `непарный ** в тексте: «${t.slice(0, 60)}…»`);
    }
  }
}

function checkQuestion(where: string, q: QuizQuestion) {
  if (q.type === "mcq") {
    if (q.options.length < 3) warn(where, `у вопроса ${q.id} меньше трёх вариантов`);
    if (!q.correct.length) err(where, `у вопроса ${q.id} нет верного варианта`);
    for (const c of q.correct) if (c < 0 || c >= q.options.length) err(where, `у вопроса ${q.id} индекс верного ответа ${c} вне диапазона`);
    if (new Set(q.options).size !== q.options.length) err(where, `у вопроса ${q.id} повторяются варианты`);
    if (q.explanation.length < 40) warn(where, `у вопроса ${q.id} слишком короткое объяснение`);
    // позиция верного ответа не должна быть всегда одной и той же — проверяется на уровне темы
  } else {
    if (!q.rubric.length) err(where, `у открытого вопроса ${q.id} нет критериев оценки`);
    walkBlocks(where, q.modelAnswer);
  }
}

/* ───────── уникальность id ───────── */
const seen = new Map<string, string>();
function uniq(where: string, id: string) {
  if (seen.has(id)) err(where, `повторяющийся id «${id}» (также в ${seen.get(id)})`);
  seen.set(id, where);
}

/* ───────── темы ───────── */
const REQUIRED = ["definition", "why", "mental-model", "technical", "syntax", "minimal-example", "detailed-example", "analysis", "mistakes", "best-practices", "edge-cases", "related"] as const;

function checkTopic(t: Topic) {
  const where = t.id;
  uniq(where, t.id);
  if (t.id !== `${t.domain}.${t.slug}`) err(where, `id должен быть «${t.domain}.${t.slug}»`);
  const dom = domains.find((d) => d.id === t.domain);
  if (!dom?.modules.some((m) => m.id === t.module)) err(where, `неизвестный модуль «${t.module}»`);

  for (const pre of t.prerequisites) {
    if (!allTopics.some((x) => x.id === pre)) err(where, `пререквизит «${pre}» не существует`);
    if (pre === t.id) err(where, "тема указана пререквизитом самой себя");
  }

  // порядок: пререквизит должен идти раньше в программе (в пределах домена — по порядку в списке; кросс-доменный — по порядку доменов)
  const order = allTopics.map((x) => x.id);
  for (const pre of t.prerequisites) {
    const a = order.indexOf(pre);
    const b = order.indexOf(t.id);
    if (a > b && a !== -1) warn(where, `пререквизит «${pre}» стоит в программе позже самой темы`);
  }

  const kinds = new Set(t.sections.map((s) => s.kind));
  const order2 = Object.keys(SECTION_META);
  let last = -1;
  for (const s of t.sections) {
    const i = order2.indexOf(s.kind);
    if (i < last) err(where, `раздел «${s.kind}» нарушает фиксированный порядок разделов`);
    last = i;
  }
  for (const k of REQUIRED) if (!kinds.has(k)) warn(where, `нет обязательного раздела «${k}»`);
  if (t.sections.length !== kinds.size) err(where, "повторяющиеся разделы");

  // объём и содержательность
  let words = 0;
  let codeBlocks = 0;
  for (const s of t.sections) {
    if (!s.blocks.length) err(where, `раздел «${s.kind}» пуст`);
    walkBlocks(`${where}#${s.kind}`, s.blocks);
    for (const b of s.blocks) {
      words += blockWords(b);
      if (b.type === "code" || b.type === "annotated" || b.type === "compare") codeBlocks++;
    }
  }
  if (words < 900) warn(where, `мало текста теории: ~${words} слов (ориентир ≥ 900)`);
  if (codeBlocks < 3) warn(where, `мало примеров кода: ${codeBlocks} (ориентир ≥ 3)`);
  if (t.keyConcepts.length < 3) warn(where, "меньше трёх ключевых понятий");
  if (t.minutes < 5) warn(where, "нереалистичная оценка времени");

  // практика
  if (t.exercises.length < 2) warn(where, `упражнений: ${t.exercises.length} (ориентир ≥ 2)`);
  if (new Set(t.exercises.map((e) => e.difficulty)).size < 2 && t.exercises.length >= 2) warn(where, "все упражнения одной сложности");
  for (const e of t.exercises) {
    uniq(`${where}/${e.id}`, e.id);
    walkBlocks(`${where}/${e.id}`, [...e.prompt, ...e.solution]);
    if (!e.checks.length) warn(`${where}/${e.id}`, "нет критериев самопроверки");
    if (e.hints.length < 2) warn(`${where}/${e.id}`, "меньше двух подсказок");
    if (e.solution.length === 0) err(`${where}/${e.id}`, "нет решения");
  }
  if (!t.challenge) warn(where, "нет инженерной задачи");
  else {
    uniq(`${where}/challenge`, t.challenge.id);
    walkBlocks(`${where}/challenge`, [...t.challenge.scenario, ...t.challenge.solution]);
    if (t.challenge.requirements.length < 2 || t.challenge.acceptance.length < 2) warn(where, "в инженерной задаче мало требований/критериев");
  }

  // собеседование
  if (t.interview.length < 5) warn(where, `вопросов собеседования: ${t.interview.length} (ориентир ≥ 5)`);
  const levels = new Set(t.interview.map((q) => q.level));
  if (levels.size < 3) warn(where, "вопросы собеседования покрывают менее трёх уровней сложности");
  for (const q of t.interview) {
    uniq(`${where}/${q.id}`, q.id);
    walkBlocks(`${where}/${q.id}`, q.answer);
  }

  // экзамен и мастерство
  if (t.exam.length < 4) warn(where, `экзаменационных вопросов: ${t.exam.length} (ориентир ≥ 4)`);
  if (t.mastery.length < 3) warn(where, `вопросов проверки мастерства: ${t.mastery.length} (ориентир ≥ 3)`);
  for (const q of [...t.exam, ...t.mastery]) {
    uniq(`${where}/${q.id}`, q.id);
    checkQuestion(`${where}/${q.id}`, q);
  }
  const mcqs = [...t.exam, ...t.mastery].filter((q) => q.type === "mcq");
  if (mcqs.length >= 4) {
    const pos = new Set(mcqs.map((q) => (q.type === "mcq" ? q.correct.join(",") : "")));
    if (pos.size < 2) warn(where, "верный вариант всегда на одной и той же позиции");
  }
  if (!t.exam.concat(t.mastery).some((q) => q.type === "open")) warn(where, "нет ни одного вопроса на объяснение (open)");

  for (const f of t.flashcards ?? []) uniq(`${where}/${f.id}`, f.id);
  if (!t.sources?.length) warn(where, "не указаны первоисточники");

  // placeholders
  const raw = JSON.stringify(t);
  if (/TODO|скоро будет|coming soon|lorem ipsum|добавим позже/i.test(raw)) err(where, "в контенте найден placeholder (TODO / «скоро» / lorem ipsum)");
  checkLinks(where, t.summary);
}

for (const t of allTopics) checkTopic(t);

/* ───────── граф пререквизитов: циклы ───────── */
{
  const byId = new Map(allTopics.map((t) => [t.id, t]));
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string, path: string[]) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      err("prerequisites", `цикл: ${[...path, id].join(" → ")}`);
      return;
    }
    state.set(id, 1);
    for (const p of byId.get(id)?.prerequisites ?? []) visit(p, [...path, id]);
    state.set(id, 2);
  };
  for (const t of allTopics) visit(t.id, []);
}

/* ───────── проекты ───────── */
for (const p of allProjects) {
  const where = p.id;
  uniq(where, p.id);
  if (!p.id.startsWith(`${p.domain}.`)) err(where, "id проекта должен начинаться с домена");
  for (const b of p.buildsOn) if (!allProjects.some((x) => x.id === b)) err(where, `buildsOn «${b}» не существует`);
  for (const t of p.topics) if (!allTopics.some((x) => x.id === t)) err(where, `тема «${t}» не существует`);
  walkBlocks(where, [...p.scenario, ...(p.solution ?? [])]);
  const lists: [string, string[], number][] = [
    ["requirements", p.requirements, 4],
    ["constraints", p.constraints, 2],
    ["expected", p.expected, 2],
    ["technical", p.technical, 2],
    ["acceptance", p.acceptance, 4],
    ["hints", p.hints, 3],
    ["advanced", p.advanced, 2],
    ["failureModes", p.failureModes, 3],
  ];
  for (const [name, list, min] of lists) if (list.length < min) warn(where, `${name}: ${list.length} (ориентир ≥ ${min})`);
  const total = p.rubric.reduce((n, r) => n + r.weight, 0);
  if (total !== 100) err(where, `сумма весов рубрики = ${total}, должна быть 100`);
}

/* ───────── модули ───────── */
for (const d of domains) {
  for (const m of d.modules) {
    if (m.project && !allProjects.some((p) => p.id === m.project)) err(`${d.id}.${m.id}`, `проект «${m.project}» не существует`);
  }
}

/* ───────── отчёт ───────── */
const topicCount = allTopics.length;
console.log(`\nПроверено: ${topicCount} тем, ${allProjects.length} проектов, ${domains.length} доменов.`);
if (warns.length) {
  console.log(`\nПредупреждения (${warns.length}) — глубина ниже стандарта:`);
  warns.forEach((w) => console.log("  ⚠ " + w));
}
if (errors.length) {
  console.log(`\nОШИБКИ (${errors.length}):`);
  errors.forEach((e) => console.log("  ✖ " + e));
  process.exit(1);
}
console.log(warns.length ? "\nОшибок нет, но есть предупреждения о глубине." : "\nКонтент соответствует стандарту DevDock.");
