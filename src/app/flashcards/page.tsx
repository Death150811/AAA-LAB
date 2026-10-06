import type { Metadata } from "next";
import { FlashcardsApp, type CardData } from "@/components/flashcards/FlashcardsApp";
import { allTopics, domains, topicHref } from "@/content/registry";

export const metadata: Metadata = {
  title: "Карточки",
  description: "Интервальное повторение определений, различий и правил из тем курсов.",
};

export default function FlashcardsPage() {
  const cards: CardData[] = allTopics.flatMap((t) =>
    (t.flashcards ?? []).map((f) => ({
      id: f.id,
      front: f.front,
      back: f.back,
      topicTitle: t.title,
      topicHref: topicHref(t),
      domain: t.domain,
    })),
  );
  const domainsWithCards = domains.filter((d) => cards.some((c) => c.domain === d.id)).map((d) => ({ id: d.id, title: d.title }));

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6">
      <div className="eyebrow">Повторение</div>
      <h1 className="mt-4 font-display text-[clamp(2.3rem,5vw,3.6rem)] font-light leading-[1.04] tracking-[-0.03em]">Карточки</h1>
      <p className="mt-5 max-w-xl font-serif text-[1.12rem] leading-[1.65] text-fg-muted">
        Вспомогательный инструмент: определения, различия, правила и крайние случаи. Понимание строится в темах — карточки
        помогают его не забыть.
      </p>
      <div className="mt-10 max-w-[46rem]">
        <FlashcardsApp cards={cards} domains={domainsWithCards} />
      </div>
    </div>
  );
}
