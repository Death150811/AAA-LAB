"use client";

import { useUserStore } from "@/store/user-store";
import { QuizRunner, type QuizItem } from "./Quiz";

/** Проверка мастерства: при результате ≥70% предлагает отметить тему изученной. */
export function MasteryQuiz({ items, topicId }: { items: QuizItem[]; topicId: string }) {
  const done = useUserStore((s) => !!s.completedTopics[topicId]);
  const toggle = useUserStore((s) => s.toggleTopic);
  return (
    <QuizRunner
      items={items}
      onComplete={() => {
        if (!done) toggle(topicId);
      }}
      completeLabel={done ? "Тема уже отмечена изученной" : "Отметить тему изученной"}
    />
  );
}
