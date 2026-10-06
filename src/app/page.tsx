import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { KnowledgeMap } from "@/components/home/KnowledgeMap";
import { Ledger } from "@/components/home/Ledger";
import { NoteOfDay, type NoteTopic } from "@/components/home/NoteOfDay";
import { DomainMotif } from "@/components/motifs/DomainMotif";
import { ButtonLink } from "@/components/ui/primitives";
import { Plate } from "@/components/ui/Plate";
import { LORE } from "@/content/lore";
import { allProjects, allTopics, domains } from "@/content/registry";
import { LEVEL_LABEL, LEVEL_ORDER, SECTION_META } from "@/content/sections";
import { buildKnowledgeMap, MAP_H, MAP_W } from "@/lib/knowledge-graph";

const FIVE = [
  ["Что это?", "Точное определение без расплывчатых формулировок."],
  ["Зачем это существует?", "Инженерная проблема, ради которой понятие появилось."],
  ["Как это работает?", "Ментальная модель и технический механизм."],
  ["Как этим пользоваться?", "Минимальный и реалистичный примеры, разбор по частям."],
  ["Когда это применять?", "Компромиссы, ограничения, альтернативы и крайние случаи."],
] as const;

const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

export default function HomePage() {
  const graph = buildKnowledgeMap(domains, allTopics);
  const topicTotals = new Map(domains.map((d) => [d.id, d.modules.reduce((n, m) => n + m.topics.length, 0)]));
  const projectTotals = new Map(domains.map((d) => [d.id, allProjects.filter((p) => p.domain === d.id).length]));

  // Заметки ссылаются на темы: клиентскому блоку нужны только заголовки и адреса этих тем.
  const noteTopics: Record<string, NoteTopic> = {};
  for (const l of LORE) {
    const t = l.topic ? allTopics.find((x) => x.id === l.topic) : undefined;
    if (t && l.topic) noteTopics[l.topic] = { id: t.id, title: t.title, href: `/learn/${t.domain}/${t.slug}` };
  }

  return (
    <>
      {/* ───────────── Титул ───────────── */}
      <section className="relative overflow-hidden border-b border-line-strong">
        <div aria-hidden className="bg-blueprint pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto grid max-w-[1360px] items-center gap-x-10 gap-y-12 px-4 py-14 sm:px-6 lg:min-h-[calc(100svh-var(--header-h)-9.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6.4fr)] lg:py-16">
          <div>
            <div className="animate-fade-up flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-fg-dim" />
              <span className="eyebrow">Атлас инженерных знаний</span>
            </div>
            <h1
              className="animate-fade-up mt-7 font-display text-[clamp(2.4rem,3.7vw,3.9rem)] font-light leading-[1.02] tracking-[-0.03em] text-fg"
              style={{ animationDelay: "70ms" }}
            >
              Понять веб.
              <br />
              Построить системы.
              <br />
              <em className="not-italic text-fg-muted">
                Выучить <span className="italic text-tyrian">CS</span>, которая за ними стоит.
              </em>
            </h1>
            <p className="animate-fade-up mt-8 max-w-[34rem] font-serif text-[1.15rem] leading-[1.65] text-fg-muted" style={{ animationDelay: "140ms" }}>
              HTML, CSS, JavaScript, SQL, Git и основы Computer Science — не набор уроков, а связанная система: от определения и ментальной модели до инженерных задач, проектов и подготовки к собеседованиям.
            </p>
            <div className="animate-fade-up mt-9 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "210ms" }}>
              <ButtonLink href="/learn/html" variant="primary" size="lg">
                Начать с HTML <ArrowRight size={17} aria-hidden />
              </ButtonLink>
              <Link href="/learn" className="group inline-flex items-center gap-2 text-[0.95rem] text-fg-muted transition-colors hover:text-fg">
                <span className="underline decoration-line-strong decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-accent">Вся программа</span>
                <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <dl className="animate-fade-up mt-12 flex max-w-lg gap-10 border-t border-line pt-6" style={{ animationDelay: "280ms" }}>
              {[
                [String(allTopics.length), "тем"],
                [String(allProjects.length), "проектов"],
                ["6", "доменов"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dd className="m-0 font-display text-[2.6rem] font-light leading-none text-fg tabular">{n}</dd>
                  <dt className="label mt-2 text-fg-dim">{l}</dt>
                </div>
              ))}
            </dl>
          </div>

          <Plate number="I" title="Карта знаний" className="animate-fade-up !p-4 sm:!p-5">
            <KnowledgeMap nodes={graph.nodes} edges={graph.edges} domains={graph.domains} width={MAP_W} height={MAP_H} />
          </Plate>
        </div>
      </section>

      <Ledger totalTopics={allTopics.length} />
      <NoteOfDay pool={LORE} topics={noteTopics} />

      {/* ───────────── Шесть таблиц ───────────── */}
      <section className="mx-auto max-w-[1360px] px-4 py-20 sm:px-6" aria-labelledby="domains">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Шесть доменов</div>
            <h2 id="domains" className="mt-3 max-w-2xl font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-light leading-[1.05] tracking-[-0.02em]">
              Одна система вместо шести <em className="italic text-fg-muted">разрозненных курсов</em>
            </h2>
          </div>
          <Link href="/learn" className="group inline-flex items-center gap-2 text-[0.92rem] text-fg-muted hover:text-fg">
            <span className="underline decoration-line-strong decoration-1 underline-offset-[6px] group-hover:decoration-accent">Вся программа</span>
            <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <ul className="m-0 mt-12 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
          {domains.map((d, i) => (
            <li key={d.id} data-domain={d.id}>
              <Link href={`/learn/${d.slug}`} className="group block h-full">
                <Plate number={NUMERALS[i]} title={d.subtitle} className="h-full transition-colors duration-300 group-hover:border-accent/60">
                  <DomainMotif domain={d.id} />
                  <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-line pt-5">
                    <h3 className="font-display text-[2rem] font-light leading-none tracking-[-0.02em] text-fg">{d.title}</h3>
                    <span className="label tabular text-fg-dim">
                      {topicTotals.get(d.id)} тем · {projectTotals.get(d.id)} пр.
                    </span>
                  </div>
                  <p className="mt-3 font-serif text-[0.98rem] leading-relaxed text-fg-muted">{d.tagline}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[0.85rem] text-accent-text">
                    Открыть курс <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Plate>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── Пять вопросов ───────────── */}
      <section className="border-y border-line-strong bg-bg-raised" aria-labelledby="five">
        <div className="mx-auto max-w-[1360px] px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[19rem_minmax(0,1fr)]">
            <div>
              <div className="eyebrow">Принцип</div>
              <h2 id="five" className="mt-3 font-display text-[clamp(1.8rem,3vw,2.5rem)] font-light leading-[1.08] tracking-[-0.02em]">
                Каждая тема отвечает на <em className="italic text-fg-muted">пять вопросов</em>
              </h2>
              <p className="mt-4 font-serif text-[0.98rem] leading-relaxed text-fg-muted">
                Определения и фрагмента кода недостаточно. Тема считается законченной, только когда понятны причина, механизм, применение и границы.
              </p>
            </div>
            <ol className="m-0 grid list-none gap-px border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-5">
              {FIVE.map(([q, a], i) => (
                <li key={q} className="bg-bg-raised p-5">
                  <div className="font-display text-[2.2rem] font-light leading-none text-accent-text tabular">{["i", "ii", "iii", "iv", "v"][i]}</div>
                  <div className="mt-4 font-display text-[1.15rem] leading-snug text-fg">{q}</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{a}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────────── Анатомия темы ───────────── */}
      <section className="mx-auto max-w-[1360px] px-4 py-20 sm:px-6" aria-labelledby="anatomy">
        <div className="eyebrow">Topic Document</div>
        <h2 id="anatomy" className="mt-3 max-w-3xl font-display text-[clamp(1.8rem,3vw,2.5rem)] font-light leading-[1.08] tracking-[-0.02em]">
          Тема — это компактная академическая глава, <em className="italic text-fg-muted">а не заметка</em>
        </h2>
        <p className="mt-4 max-w-2xl font-serif text-[1rem] leading-relaxed text-fg-muted">
          Нумерация разделов фиксирована во всех темах всех курсов. Через полгода вы найдёте «Типичные ошибки» или «Крайние случаи» там же, где искали раньше.
        </p>
        <ol className="m-0 mt-10 grid list-none gap-x-10 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(SECTION_META).map((s) => (
            <li key={s.id} className="flex items-baseline gap-3 border-t border-line py-3">
              <span className="label tabular text-accent-text">{s.num}</span>
              <span className="font-display text-[1.02rem] text-fg">{s.title}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── Путь ───────────── */}
      <section className="border-t border-line-strong bg-bg-raised" aria-labelledby="path">
        <div className="mx-auto max-w-[1360px] px-4 py-20 sm:px-6">
          <div className="eyebrow">Путь обучения</div>
          <h2 id="path" className="mt-3 font-display text-[clamp(1.8rem,3vw,2.5rem)] font-light leading-[1.08] tracking-[-0.02em]">
            От «я не знаю» до <em className="italic text-fg-muted">«я могу объяснить»</em>
          </h2>
          <ol className="m-0 mt-12 flex list-none flex-col gap-0 p-0 md:flex-row">
            {LEVEL_ORDER.map((lvl, i) => (
              <li key={lvl} className="relative flex-1 border-l border-line-strong py-1 pl-5 md:border-l-0 md:border-t md:pl-0 md:pt-6">
                <span aria-hidden className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border border-line-strong bg-bg-raised md:-top-[5px] md:left-0" />
                <div className="label tabular text-fg-dim">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 font-display text-[1.25rem] text-fg">{LEVEL_LABEL[lvl]}</div>
                <p className="mt-1 max-w-[12rem] pb-4 text-[12.5px] leading-snug text-fg-muted md:pb-0">
                  {
                    [
                      "Термины и базовая структура",
                      "Устойчивое владение инструментом",
                      "Сложные случаи и взаимодействия",
                      "Механизмы и спецификации",
                      "Проектирование и компромиссы",
                      "Самостоятельное решение больших задач",
                    ][i]
                  }
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
