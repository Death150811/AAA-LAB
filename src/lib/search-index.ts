import "server-only";
import { allProjects, allTopics, domains, getModuleOf, projectHref, topicHref } from "@/content/registry";
import type { Block } from "@/content/types";
import type { SearchEntry } from "./search-types";
import { stripInline } from "./inline";

function blockText(b: Block): string {
  switch (b.type) {
    case "p":
    case "h":
      return stripInline(b.type === "p" ? b.text : b.text);
    case "list":
      return b.items.map(stripInline).join(" ");
    case "callout":
      return stripInline(b.text);
    case "definition":
      return `${b.term} ${b.en ?? ""} ${stripInline(b.text)}`;
    case "table":
      return [...b.head, ...b.rows.flat()].map(stripInline).join(" ");
    case "steps":
      return b.items.map((s) => `${s.title} ${stripInline(s.text)}`).join(" ");
    case "compare":
      return `${stripInline(b.bad.note)} ${stripInline(b.good.note)}`;
    case "annotated":
      return b.notes.map((n) => stripInline(n.text)).join(" ");
    case "code":
    case "diagram":
      return "";
  }
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** Строит плоский индекс для клиентского нечёткого поиска. Выполняется на этапе сборки. */
export function buildSearchIndex(): SearchEntry[] {
  const out: SearchEntry[] = [];

  for (const d of domains) {
    out.push({
      id: `domain:${d.id}`,
      kind: "domain",
      title: `${d.title} — ${d.tagline}`,
      text: [...d.overview, ...d.outcomes].map(stripInline).join(" "),
      href: `/learn/${d.slug}`,
      domain: d.id,
      context: "Курс",
      tags: [d.id, d.subtitle],
    });
  }

  for (const t of allTopics) {
    const dom = domains.find((d) => d.id === t.domain)!;
    const mod = getModuleOf(t);
    const ctx = `${dom.title} · ${mod?.title ?? ""}`;
    const href = topicHref(t);
    const body = t.sections.flatMap((s) => s.blocks.map(blockText)).join(" ");

    out.push({
      id: `topic:${t.id}`,
      kind: "topic",
      title: t.title,
      text: clip(`${t.titleEn ?? ""} ${t.summary} ${body}`, 1800),
      href,
      domain: t.domain,
      context: ctx,
      tags: t.tags,
    });

    for (const k of t.keyConcepts) {
      out.push({
        id: `concept:${t.id}:${k.term}`,
        kind: "concept",
        title: k.en ? `${k.term} (${k.en})` : k.term,
        text: stripInline(k.text),
        href,
        domain: t.domain,
        context: `${ctx} · ${t.title}`,
        tags: t.tags,
      });
    }

    for (const e of t.exercises) {
      out.push({
        id: `exercise:${e.id}`,
        kind: "exercise",
        title: e.title,
        text: clip(e.prompt.map(blockText).join(" "), 600),
        href: `${href}#practice`,
        domain: t.domain,
        context: `${ctx} · ${t.title}`,
        tags: t.tags,
      });
    }

    for (const q of t.interview) {
      out.push({
        id: `interview:${q.id}`,
        kind: "interview",
        title: stripInline(q.question),
        text: clip(q.answer.map(blockText).join(" "), 600),
        href: `${href}#interview`,
        domain: t.domain,
        context: `${ctx} · ${t.title}`,
        tags: t.tags,
      });
    }

    // Код: по одной записи на блок — чтобы находить `aria-labelledby`, `Promise.all` и т.п.
    let n = 0;
    for (const s of t.sections) {
      for (const b of s.blocks) {
        if (b.type === "code" && n < 6) {
          out.push({
            id: `code:${t.id}:${n}`,
            kind: "code",
            title: b.filename ?? b.caption ?? clip(b.code.split("\n").find((l) => l.trim()) ?? "", 60),
            text: clip(b.code, 400),
            href,
            domain: t.domain,
            context: `${ctx} · ${t.title}`,
            tags: [b.lang],
          });
          n++;
        }
      }
    }
  }

  for (const p of allProjects) {
    out.push({
      id: `project:${p.id}`,
      kind: "project",
      title: p.title,
      text: clip(`${p.subtitle} ${p.objective} ${p.requirements.join(" ")}`, 800),
      href: projectHref(p),
      domain: p.domain,
      context: `Проект ${String(p.order).padStart(2, "0")}`,
      tags: [p.domain, "проект"],
    });
  }

  return out;
}
