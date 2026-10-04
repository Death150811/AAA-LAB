import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroGraph, type GraphDomain } from "@/components/home/HeroGraph";
import { ButtonLink, CardLink, ProgressBar } from "@/components/ui/primitives";
import { ACCENT } from "@/components/ui/primitives";
import { domains } from "@/content/registry";
import { LEVEL_LABEL, LEVEL_ORDER, SECTION_META } from "@/content/sections";

/** Готовность курса = доля модулей программы, в которых есть хотя бы одна опубликованная тема. */
const readiness = (d: (typeof domains)[number]) =>
  d.modules.filter((m) => m.topics.length > 0).length / d.modules.length;

const FIVE = [
  ["Что это?", "Точное определение без расплывчатых формулировок."],
  ["Зачем это существует?", "Инженерная проблема, ради которой понятие появилось."],
  ["Как это работает?", "Ментальная модель и технический механизм."],
  ["Как этим пользоваться?", "Минимальный и реалистичный примеры, разбор по частям."],
  ["Когда это применять?", "Компромиссы, ограничения, альтернативы и крайние случаи."],
] as const;

export default function HomePage() {
  const graph: GraphDomain[] = domains.map((d) => ({
    id: d.id,
    slug: d.slug,
    code: d.code,
    title: d.title,
    tagline: d.tagline,
    modules: d.modules.length,
    topics: d.modules.reduce((n, m) => n + m.topics.length, 0),
  }));

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="bg-blueprint pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:py-28">
          <div>
            <div className="animate-fade-up flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-cyan" />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-cyan"
                  style={{ animation: "dd-pulse-ring 2.6s ease-out infinite" }}
                />
              </span>
              <span className="eyebrow">Engineering knowledge system</span>
            </div>
            <h1
              className="animate-fade-up mt-6 text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.025em] text-fg sm:text-[3.6rem]"
              style={{ animationDelay: "60ms" }}
            >
              Понять веб.
              <br />
              Построить системы.
              <br />
              <span className="text-fg-muted">Выучить&nbsp;CS, которая за ними стоит.</span>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-xl text-[1.1rem] leading-relaxed text-fg-muted"
              style={{ animationDelay: "120ms" }}
            >
              HTML, CSS, JavaScript, SQL, Git и основы Computer Science — не набор уроков, а связанная система: от
              определения и ментальной модели до инженерных задач, проектов и подготовки к собеседованиям.
            </p>
            <div className="animate-fade-up mt-9 flex flex-wrap gap-3" style={{ animationDelay: "180ms" }}>
              <ButtonLink href="/learn/html" variant="primary" size="lg">
                Начать с HTML <ArrowRight size={17} aria-hidden />
              </ButtonLink>
              <ButtonLink href="/learn" size="lg">
                Вся программа
              </ButtonLink>
            </div>
            <dl
              className="animate-fade-up mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6"
              style={{ animationDelay: "240ms" }}
            >
              {[
                ["6", "доменов знаний"],
                ["20", "разделов в теме"],
                ["6", "ступеней пути"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dd className="m-0 text-2xl font-semibold tabular text-fg">{n}</dd>
                  <dt className="mt-0.5 text-xs text-fg-dim">{l}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <HeroGraph domains={graph} />
          </div>
        </div>
      </section>

      {/* ───────────── Пять вопросов ───────────── */}
      <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6" aria-labelledby="five">
        <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <div className="eyebrow">Принцип</div>
            <h2 id="five" className="mt-3 text-[1.8rem] font-semibold leading-tight tracking-tight">
              Каждая тема отвечает на пять вопросов
            </h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-fg-muted">
              Определения и фрагмента кода недостаточно. Тема считается законченной, только когда понятны причина,
              механизм, применение и границы.
            </p>
          </div>
          <ol className="m-0 grid list-none gap-px overflow-hidden rounded-xl border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-5">
            {FIVE.map(([q, a], i) => (
              <li key={q} className="bg-surface p-5">
                <div className="mono text-[11px] text-cyan tabular">0{i + 1}</div>
                <div className="mt-3 text-[0.98rem] font-semibold leading-snug text-fg">{q}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{a}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── Домены ───────────── */}
      <section className="border-y border-line bg-bg-raised" aria-labelledby="domains">
        <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
          <div className="eyebrow">Шесть доменов</div>
          <h2 id="domains" className="mt-3 max-w-2xl text-[1.8rem] font-semibold leading-tight tracking-tight">
            Одна система вместо шести разрозненных курсов
          </h2>
          <ul className="m-0 mt-10 grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
            {domains.map((d) => {
              const topics = d.modules.reduce((n, m) => n + m.topics.length, 0);
              const a = ACCENT[d.accent];
              return (
                <li key={d.id}>
                  <CardLink href={`/learn/${d.slug}`} className="h-full p-6">
                    <div className="flex items-center justify-between">
                      <span className={`mono text-xs tabular ${a.text}`}>{d.code}</span>
                      <span className="mono text-[11px] text-fg-dim tabular">
                        {topics > 0 ? `${topics} тем` : "готовится"}
                      </span>
                    </div>
                    <h3 className="mt-5 text-[1.5rem] font-semibold tracking-tight text-fg">{d.title}</h3>
                    <p className="mono mt-1 text-[11px] text-fg-dim">{d.subtitle}</p>
                    <p className="mt-4 text-[0.93rem] leading-relaxed text-fg-muted">{d.tagline}</p>
                    <div className="mt-5">
                      <ProgressBar value={readiness(d)} accent={d.accent} label={`Готовность курса ${d.title}`} />
                      <div className="mt-2 flex justify-between text-[11px] text-fg-dim">
                        <span>
                          {d.modules.filter((m) => m.topics.length > 0).length} из {d.modules.length} модулей написано
                        </span>
                        <span className="flex items-center gap-1 text-fg-muted transition-colors group-hover:text-fg">
                          Открыть <ArrowRight size={12} aria-hidden />
                        </span>
                      </div>
                    </div>
                  </CardLink>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ───────────── Анатомия темы ───────────── */}
      <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6" aria-labelledby="anatomy">
        <div className="eyebrow">Topic Document</div>
        <h2 id="anatomy" className="mt-3 max-w-2xl text-[1.8rem] font-semibold leading-tight tracking-tight">
          Тема — это компактная академическая глава, а не заметка
        </h2>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-fg-muted">
          Нумерация разделов фиксирована во всех темах всех курсов. Через полгода вы найдёте «Типичные ошибки» или
          «Крайние случаи» там же, где искали раньше.
        </p>
        <ol className="m-0 mt-10 grid list-none gap-px overflow-hidden rounded-xl border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(SECTION_META).map((s) => (
            <li key={s.id} className="flex items-baseline gap-3 bg-surface px-5 py-3.5">
              <span className="mono text-[11px] text-cyan tabular">{s.num}</span>
              <span className="text-[0.93rem] text-fg">{s.title}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── Путь ───────────── */}
      <section className="border-t border-line bg-bg-raised" aria-labelledby="path">
        <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
          <div className="eyebrow">Путь обучения</div>
          <h2 id="path" className="mt-3 text-[1.8rem] font-semibold tracking-tight">
            От «я не знаю» до «я могу объяснить»
          </h2>
          <ol className="m-0 mt-10 flex list-none flex-col gap-0 p-0 md:flex-row">
            {LEVEL_ORDER.map((lvl, i) => (
              <li key={lvl} className="relative flex-1 border-l border-line-strong py-1 pl-5 md:border-l-0 md:border-t md:pl-0 md:pt-5">
                <span aria-hidden className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border border-line-strong bg-bg md:-top-[5px] md:left-0" />
                <div className="mono text-[11px] text-fg-dim tabular">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-1 text-[1rem] font-semibold text-fg">{LEVEL_LABEL[lvl]}</div>
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
          <div className="mt-12">
            <Link href="/learn/html" className="inline-flex items-center gap-2 text-[0.95rem] font-medium text-cyan hover:underline">
              Перейти к курсу HTML <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
