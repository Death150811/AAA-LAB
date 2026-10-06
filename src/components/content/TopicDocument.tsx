import { ArrowLeft, ArrowRight, Clock, ExternalLink, Layers, Link2, Target } from "lucide-react";
import Link from "next/link";
import { Blocks } from "./Blocks";
import { CodeView } from "./CodeView";
import { BookmarkButton, CompleteButton, PrereqStatus, TopicNotes, TopicTracker } from "./TopicActions";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import { MasteryQuiz } from "@/components/practice/MasteryQuiz";
import { QuizRunner } from "@/components/practice/Quiz";
import { buildQuizItems } from "@/components/practice/build-items";
import { Toc, type TocItem } from "@/components/nav/Toc";
import { ReadingProgress } from "@/components/nav/ReadingProgress";
import { Badge } from "@/components/ui/primitives";
import { getAdjacent, getDependents, getModuleOf, getTopicById, topicHref } from "@/content/registry";
import { INTERVIEW_LEVEL_LABEL, LEVEL_LABEL, SECTION_META, type DocSectionId } from "@/content/sections";
import type { Domain, Topic } from "@/content/types";
import { Inline } from "@/lib/inline";

function SectionHeading({ id, suffix }: { id: DocSectionId; suffix?: string }) {
  const m = SECTION_META[id];
  return (
    <h2 id={id} className="group flex flex-wrap items-baseline gap-x-3 border-b border-line pb-3 text-[1.45rem] font-semibold leading-tight tracking-tight text-fg">
      <span className="mono text-sm font-medium text-accent-text tabular">{m.num}</span>
      <span>{suffix ? `${m.title}: ${suffix}` : m.title}</span>
      <span className="mono ml-auto hidden text-[11px] font-normal uppercase tracking-wider text-fg-dim sm:inline">{m.en}</span>
      <a href={`#${id}`} aria-label={`Ссылка на раздел «${m.title}»`} className="text-fg-dim opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100">
        <Link2 size={15} />
      </a>
    </h2>
  );
}

export function buildToc(topic: Topic): TocItem[] {
  const items: TocItem[] = topic.sections.map((s) => ({
    id: s.kind,
    num: SECTION_META[s.kind].num,
    title: SECTION_META[s.kind].title,
  }));
  const push = (id: DocSectionId) => items.push({ id, num: SECTION_META[id].num, title: SECTION_META[id].title });
  if (topic.exercises.length) push("practice");
  if (topic.challenge) push("challenge");
  if (topic.interview.length) push("interview");
  if (topic.exam.length) push("exam");
  if (topic.mastery.length) push("mastery");
  return items;
}

export async function TopicDocument({ topic, domain }: { topic: Topic; domain: Domain }) {
  const mod = getModuleOf(topic);
  const toc = buildToc(topic);
  const { prev, next } = getAdjacent(topic);
  const href = topicHref(topic);

  const examItems = buildQuizItems(topic.exam, { topicId: topic.id, domain: topic.domain });
  const masteryItems = buildQuizItems(topic.mastery, { topicId: topic.id, domain: topic.domain });

  return (
    <>
      <ReadingProgress targetId="topic-article" />
      <TopicTracker id={topic.id} title={topic.title} href={href} />

      <article id="topic-article" className="min-w-0 py-8 lg:py-10">
        {/* ───── Заголовок ───── */}
        <header className="mb-10">
          <nav aria-label="Хлебные крошки" className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fg-dim">
            <Link href={`/learn/${domain.slug}`} className="hover:text-fg">{domain.title}</Link>
            <span aria-hidden>/</span>
            <span>Модуль {String(mod?.index ?? 0).padStart(2, "0")} · {mod?.title}</span>
          </nav>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {mod && <Badge tone="accent">{LEVEL_LABEL[mod.level]}</Badge>}
            <span className="flex items-center gap-1.5 text-xs text-fg-dim">
              <Clock size={13} aria-hidden /> {topic.minutes} мин чтения и практики
            </span>
          </div>

          <h1 className="text-[2rem] font-semibold leading-[1.15] tracking-tight text-fg sm:text-[2.5rem]">
            {topic.title}
          </h1>
          {topic.titleEn && <p className="mono mt-2 text-sm text-fg-dim">{topic.titleEn}</p>}
          <p className="mt-5 max-w-3xl text-[1.12rem] leading-relaxed text-fg-muted">
            <Inline text={topic.summary} />
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <CompleteButton topicId={topic.id} />
            <BookmarkButton kind="topic" refId={topic.id} title={topic.title} href={href} />
          </div>

          {topic.prerequisites.length > 0 && (
            <div className="mt-6 rounded-xl border border-line bg-surface/50 p-4">
              <div className="eyebrow mb-2.5 flex items-center gap-2">
                <Layers size={12} aria-hidden /> Перед этой темой
              </div>
              <PrereqStatus
                items={topic.prerequisites.flatMap((id) => {
                  const t = getTopicById(id);
                  return t ? [{ id: t.id, title: t.title, href: topicHref(t) }] : [];
                })}
              />
            </div>
          )}

          {/* Содержание на малых экранах */}
          <details className="group mt-6 rounded-xl border border-line bg-surface/50 xl:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm text-fg-muted marker:hidden [&::-webkit-details-marker]:hidden">
              <span>Содержание темы</span>
              <span className="text-xs text-accent-text group-open:hidden">Показать</span>
              <span className="hidden text-xs text-accent-text group-open:inline">Скрыть</span>
            </summary>
            <div className="border-t border-line px-4 py-3">
              <Toc items={toc} label="Содержание темы (мобильное)" />
            </div>
          </details>
        </header>

        {/* ───── Теория ───── */}
        <div className="space-y-14">
          {topic.sections.map((s) => (
            <section key={s.kind} aria-labelledby={s.kind} className="scroll-mt-24">
              <SectionHeading id={s.kind} suffix={s.heading} />
              <div className="doc mt-6">
                <Blocks blocks={s.blocks} />
              </div>
            </section>
          ))}

          {/* ───── 16. Практика ───── */}
          {topic.exercises.length > 0 && (
            <section aria-labelledby="practice" className="scroll-mt-24">
              <SectionHeading id="practice" />
              <p className="mt-5 max-w-3xl text-[0.98rem] text-fg-muted">
                Сначала решайте сами. Подсказки и решение раскрываются по запросу — заглядывайте в них только после
                честной попытки.
              </p>
              <div className="mt-6 space-y-5">
                {topic.exercises.map((e, i) => (
                  <ExerciseCard
                    key={e.id}
                    id={e.id}
                    index={i + 1}
                    title={e.title}
                    kind={e.kind}
                    difficulty={e.difficulty}
                    topicId={topic.id}
                    domain={topic.domain}
                    hints={e.hints}
                    checks={e.checks}
                    promptNode={<Blocks blocks={e.prompt} />}
                    starterNode={e.starter ? <CodeView lang={e.starter.lang} code={e.starter.code} bare /> : undefined}
                    solutionNode={<Blocks blocks={e.solution} />}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ───── 17. Инженерная задача ───── */}
          {topic.challenge && (
            <section aria-labelledby="challenge" className="scroll-mt-24">
              <SectionHeading id="challenge" />
              <div className="mt-6 rounded-xl border border-indigo/30 bg-indigo/[0.04] p-5 sm:p-6">
                <div className="mb-1 flex items-center gap-2 text-indigo">
                  <Target size={16} aria-hidden />
                  <span className="eyebrow !text-indigo">Задача</span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-fg">{topic.challenge.title}</h3>
                <div className="doc mt-4">
                  <Blocks blocks={topic.challenge.scenario} />
                </div>
                <div className="mt-6 grid gap-5 md:grid-cols-3">
                  <ChallengeList title="Требования" items={topic.challenge.requirements} />
                  <ChallengeList title="Ограничения" items={topic.challenge.constraints} />
                  <ChallengeList title="Критерии приёмки" items={topic.challenge.acceptance} />
                </div>
                <details className="mt-6 rounded-lg border border-line bg-bg-raised/50">
                  <summary className="cursor-pointer px-4 py-2.5 text-sm text-fg-muted hover:text-fg">Подсказки</summary>
                  <ol className="m-0 space-y-2 px-4 pb-4 pl-9 text-[0.95rem] leading-relaxed text-fg-muted">
                    {topic.challenge.hints.map((h, i) => (
                      <li key={i}><Inline text={h} /></li>
                    ))}
                  </ol>
                </details>
                <details className="mt-3 rounded-lg border border-line bg-bg-raised/50">
                  <summary className="cursor-pointer px-4 py-2.5 text-sm text-fg-muted hover:text-fg">
                    Разбор решения (откройте после попытки)
                  </summary>
                  <div className="doc space-y-3 px-4 pb-4 text-[0.98rem]">
                    <Blocks blocks={topic.challenge.solution} />
                  </div>
                </details>
              </div>
            </section>
          )}

          {/* ───── 18. Собеседование ───── */}
          {topic.interview.length > 0 && (
            <section aria-labelledby="interview" className="scroll-mt-24">
              <SectionHeading id="interview" />
              <p className="mt-5 max-w-3xl text-[0.98rem] text-fg-muted">
                Ответьте вслух, потом раскройте эталон. Хороший ответ — это определение, механизм, пример и границы применимости.
              </p>
              <div className="mt-6 space-y-2.5">
                {topic.interview.map((q) => (
                  <details key={q.id} className="group rounded-xl border border-line bg-surface/60 open:bg-surface">
                    <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 marker:hidden [&::-webkit-details-marker]:hidden">
                      <Badge tone={q.level === "basic" ? "emerald" : q.level === "intermediate" ? "accent" : q.level === "advanced" ? "indigo" : q.level === "engineering" ? "amber" : "rose"} className="mt-0.5 shrink-0">
                        {INTERVIEW_LEVEL_LABEL[q.level]}
                      </Badge>
                      <span className="flex-1 text-[1rem] font-medium leading-relaxed text-fg">
                        <Inline text={q.question} />
                      </span>
                    </summary>
                    <div className="doc space-y-3 border-t border-line px-4 py-4 text-[0.98rem]">
                      <Blocks blocks={q.answer} />
                      {q.followUps && q.followUps.length > 0 && (
                        <div className="!mt-5 rounded-lg border border-line bg-bg-raised/60 px-4 py-3">
                          <div className="eyebrow mb-2">Уточняющие вопросы интервьюера</div>
                          <ul className="!m-0 !pl-5 text-[0.93rem]">
                            {q.followUps.map((f, i) => (
                              <li key={i}><Inline text={f} /></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ───── 19. Экзамен ───── */}
          {examItems.length > 0 && (
            <section aria-labelledby="exam" className="scroll-mt-24">
              <SectionHeading id="exam" />
              <div className="mt-6">
                <QuizRunner items={examItems} />
              </div>
            </section>
          )}

          {/* ───── 20. Мастерство ───── */}
          {masteryItems.length > 0 && (
            <section aria-labelledby="mastery" className="scroll-mt-24">
              <SectionHeading id="mastery" />
              <p className="mt-5 max-w-3xl text-[0.98rem] text-fg-muted">
                Финальная проверка понимания, а не памяти. При результате от 70% тему можно отметить изученной.
              </p>
              <div className="mt-6">
                <MasteryQuiz items={masteryItems} topicId={topic.id} />
              </div>
            </section>
          )}
        </div>

        {/* ───── Источники ───── */}
        {topic.sources && topic.sources.length > 0 && (
          <footer className="mt-14 border-t border-line pt-6">
            <div className="eyebrow mb-3">Первоисточники для углубления</div>
            <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
              {topic.sources.map((s) => (
                <li key={s.url} className="min-w-0">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[13px] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                  >
                    <ExternalLink size={13} aria-hidden className="shrink-0 text-fg-dim" />
                    <span className="min-w-0 flex-1 truncate">{s.title}</span>
                    <span className="mono text-[10px] uppercase text-fg-dim">{s.publisher}</span>
                  </a>
                </li>
              ))}
            </ul>
          </footer>
        )}

        {/* ───── Навигация ───── */}
        <nav aria-label="Предыдущая и следующая тема" className="mt-12 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={topicHref(prev)} className="group rounded-xl border border-line bg-surface p-4 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-line-strong">
              <span className="eyebrow flex items-center gap-1.5"><ArrowLeft size={12} aria-hidden /> Назад</span>
              <span className="mt-2 block text-[0.98rem] font-medium text-fg">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={topicHref(next)} className="group rounded-xl border border-line bg-surface p-4 text-right transition-[transform,border-color] hover:-translate-y-0.5 hover:border-accent/40 sm:col-start-2">
              <span className="eyebrow flex items-center justify-end gap-1.5">Далее <ArrowRight size={12} aria-hidden /></span>
              <span className="mt-2 block text-[0.98rem] font-medium text-fg">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>
    </>
  );
}

function ChallengeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="eyebrow mb-2">{title}</div>
      <ul className="m-0 list-none space-y-1.5 p-0 text-[0.93rem] leading-relaxed text-fg-muted">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo" />
            <span><Inline text={it} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopicRail({ topic }: { topic: Topic }) {
  const toc = buildToc(topic);
  const dependents = getDependents(topic.id);
  const prereq = topic.prerequisites.flatMap((id) => {
    const t = getTopicById(id);
    return t ? [{ id: t.id, title: t.title, href: topicHref(t) }] : [];
  });

  return (
    <div className="space-y-8 text-sm">
      <div className="hidden xl:block">
        <div className="eyebrow mb-3">Содержание</div>
        <Toc items={toc} />
      </div>

      {topic.keyConcepts.length > 0 && (
        <div>
          <div className="eyebrow mb-3">Ключевые понятия</div>
          <dl className="m-0 space-y-3">
            {topic.keyConcepts.map((k) => (
              <div key={k.term} className="rounded-lg border border-line bg-surface/50 px-3 py-2.5">
                <dt className="flex flex-wrap items-baseline gap-x-2 font-semibold text-fg">
                  {k.term}
                  {k.en && <span className="mono text-[10px] font-normal text-fg-dim">{k.en}</span>}
                </dt>
                <dd className="m-0 mt-1 text-[13px] leading-relaxed text-fg-muted">
                  <Inline text={k.text} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div>
        <div className="eyebrow mb-3">Зависимости</div>
        {prereq.length > 0 && (
          <div className="mb-3">
            <div className="mb-1 text-xs text-fg-dim">Нужно знать</div>
            <PrereqStatus items={prereq} />
          </div>
        )}
        {dependents.length > 0 && (
          <div>
            <div className="mb-1 text-xs text-fg-dim">Откроет доступ к</div>
            <ul className="m-0 list-none space-y-1 p-0">
              {dependents.map((d) => (
                <li key={d.id}>
                  <Link href={topicHref(d)} className="block rounded-md px-1 py-1 text-[13px] leading-snug text-fg-muted hover:text-fg">
                    → {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {prereq.length === 0 && dependents.length === 0 && (
          <p className="text-[13px] text-fg-dim">Самостоятельная тема.</p>
        )}
      </div>

      <div>
        <div className="eyebrow mb-3">Быстрый переход</div>
        <ul className="m-0 list-none space-y-1 p-0 text-[13px]">
          {topic.exercises.length > 0 && (
            <li><a className="text-fg-muted hover:text-accent-text" href="#practice">Практика · {topic.exercises.length}</a></li>
          )}
          {topic.interview.length > 0 && (
            <li><a className="text-fg-muted hover:text-accent-text" href="#interview">Собеседование · {topic.interview.length}</a></li>
          )}
          {topic.mastery.length > 0 && (
            <li><a className="text-fg-muted hover:text-accent-text" href="#mastery">Проверка мастерства</a></li>
          )}
        </ul>
      </div>

      <TopicNotes topicId={topic.id} topicTitle={topic.title} />
    </div>
  );
}
