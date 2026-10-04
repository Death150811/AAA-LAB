import { ButtonLink } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="mono text-sm text-cyan">404</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Такой страницы нет в системе</h1>
      <p className="mt-3 text-fg-muted">
        Возможно, тема ещё не опубликована или ссылка устарела. Воспользуйтесь поиском (Ctrl&nbsp;K) или вернитесь к программе.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/learn" variant="primary">К программе</ButtonLink>
        <ButtonLink href="/">На главную</ButtonLink>
      </div>
    </div>
  );
}
