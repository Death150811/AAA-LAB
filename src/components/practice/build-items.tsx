import type { DomainId, QuizQuestion } from "@/content/types";
import { Blocks } from "@/components/content/Blocks";
import { CodeView } from "@/components/content/CodeView";
import type { QuizItem } from "./Quiz";

/** Серверная подготовка вопросов: подсветка кода и отрисовка эталонных ответов превращаются в готовые узлы. */
export function buildQuizItems(
  questions: QuizQuestion[],
  ctx: { topicId: string | null; domain: DomainId; source?: string },
): QuizItem[] {
  return questions.map((question) => ({
    question,
    topicId: ctx.topicId,
    domain: ctx.domain,
    source: ctx.source,
    codeNode: question.code ? (
      <CodeView lang={question.code.lang} code={question.code.code} bare />
    ) : undefined,
    answerNode: question.type === "open" ? <Blocks blocks={question.modelAnswer} /> : undefined,
  }));
}
