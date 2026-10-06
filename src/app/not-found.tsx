import { ButtonLink } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="mono text-sm text-accent-text">404</div>
      <h1 className="mt-4 font-display text-[clamp(2.3rem,5vw,3.6rem)] font-light leading-[1.04] tracking-[-0.03em]">Такой страницы нет в системе</h1>
      <p className="mt-5 font-serif text-[1.1rem] leading-[1.65] text-fg-muted">
        Возможно, тема ещё не опубликована или ссылка устарела. Воспользуйтесь поиском (Ctrl&nbsp;K) или вернитесь к программе.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/learn" variant="primary">К программе</ButtonLink>
        <ButtonLink href="/">На главную</ButtonLink>
      </div>
    </div>
  );
}
