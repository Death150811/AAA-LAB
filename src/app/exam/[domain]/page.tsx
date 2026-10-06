import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DomainHeader } from "@/components/layout/DomainHeader";
import { ReshuffleLink, SeedForm } from "@/components/practice/Reshuffle";
import { buildMixedQuizItems } from "@/components/practice/build-items";
import { QuizRunner } from "@/components/practice/Quiz";
import { Badge, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { domains, getDomain } from "@/content/registry";
import type { Difficulty } from "@/content/types";
import { DIFFICULTY_LABEL } from "@/content/sections";
import { clampInt, composeExam, oneOf, questionPool } from "@/lib/practice-data";

export function generateStaticParams() {
  return domains.map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const d = getDomain(domain);
  return { title: d ? `Экзамен: ${d.title}` : "Экзамен" };
}

const LEVELS = ["all", "foundation", "intermediate", "advanced"] as const;
const FORMATS = ["all", "concept", "code-analysis", "output", "debug", "architecture", "sql"] as const;
const FORMAT_LABEL: Record<(typeof FORMATS)[number], string> = {
  all: "Любые",
  concept: "Концепция",
  "code-analysis": "Анализ кода",
  output: "Вывод программы",
  debug: "Отладка",
  architecture: "Архитектура",
  sql: "SQL",
};

type SP = Record<string, string | string[] | undefined>;

export default async function ExamPage({ params, searchParams }: { params: Promise<{ domain: string }>; searchParams: Promise<SP> }) {
  const { domain: slug } = await params;
  const sp = await searchParams;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const level = oneOf(sp.level, LEVELS, "all");
  const format = oneOf(sp.format, FORMATS, "all");
  const moduleIds = domain.modules.filter((m) => m.topics.length > 0).map((m) => m.id);
  const moduleId = oneOf(sp.module, ["all", ...moduleIds] as const, "all");
  const count = clampInt(sp.count, 5, 40, 10);
  const started = sp.seed !== undefined;
  const seed = clampInt(sp.seed, 0, 999_999, 1);

  const pool = questionPool(domain.id, { level, module: moduleId, format });
  const exam = started ? composeExam(domain.id, { level, module: moduleId, format, count, seed }) : [];
  const items = buildMixedQuizItems(exam);

  const totalAvailable = questionPool(domain.id, { level: "all", module: "all", format: "all" }).length;

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-10 sm:px-6">
      <DomainHeader
        domain={domain}
        tab="exam"
        title={`Экзамен: ${domain.title}`}
        lead="Вариант собирается из вопросов тем курса и упорядочивается от базового к продвинутому. После каждого ответа — объяснение: экзамен здесь — тренировка понимания, а не проверка памяти."
      />

      {totalAvailable === 0 ? (
        <div className="mt-10">
          <EmptyState title="Экзаменационные вопросы появятся вместе с темами курса">
            Вопросы пишутся вместе с содержанием каждой темы. Пока в этом домене нет опубликованных тем.
          </EmptyState>
        </div>
      ) : (
        <>
          <SeedForm className="mt-8 grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5" aria-label="Параметры варианта экзамена">
            <Field label="Сложность" name="level" value={level} options={LEVELS.map((v) => [v, v === "all" ? "Все уровни" : DIFFICULTY_LABEL[v as Difficulty]])} />
            <Field label="Модуль" name="module" value={moduleId} options={[["all", "Все модули"], ...domain.modules.filter((m) => m.topics.length > 0).map((m) => [m.id, m.title] as [string, string])]} />
            <Field label="Тип вопроса" name="format" value={format} options={FORMATS.map((v) => [v, FORMAT_LABEL[v]])} />
            <Field label="Вопросов" name="count" value={String(count)} options={[["5", "5"], ["10", "10"], ["20", "20"], ["30", "30"]]} />
            <div className="flex items-end">
              <input type="hidden" name="seed" defaultValue="1" />
              <button type="submit" className="h-10 w-full rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-accent-ink transition-transform active:scale-[0.97]">
                Составить вариант
              </button>
            </div>
          </SeedForm>
          <p className="mt-3 text-xs text-fg-dim">
            В выбранном пуле — {pool.length} из {totalAvailable} вопросов.
            {pool.length < count && " Вопросов меньше запрошенного числа: будут использованы все."}
          </p>

          {started && items.length > 0 && (
            <section aria-labelledby="exam-run" className="mt-10">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <h2 id="exam-run" className="text-xl font-semibold tracking-tight">Вариант №{seed}</h2>
                <Badge tone="accent">{items.length} вопросов</Badge>
                <ReshuffleLink className="ml-auto text-sm text-accent-text hover:underline">Другой вариант →</ReshuffleLink>
              </div>
              <QuizRunner items={items} />
            </section>
          )}
          {started && items.length === 0 && (
            <div className="mt-10">
              <EmptyState title="Под выбранные условия нет вопросов" action={<ButtonLink href={`/exam/${domain.slug}`}>Сбросить фильтры</ButtonLink>}>
                Ослабьте фильтры: например, выберите «Любые» типы вопросов.
              </EmptyState>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Field({ label, name, value, options }: { label: string; name: string; value: string; options: readonly (readonly [string, string])[] }) {
  return (
    <label className="block text-[13px] text-fg-muted">
      <span className="mb-1.5 block">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="h-10 w-full rounded-lg border border-line-strong bg-bg-raised px-3 text-sm text-fg focus:border-accent/60 focus:outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
