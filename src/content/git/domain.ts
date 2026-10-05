import type { DomainDef } from "../types";

export const gitDomain: DomainDef = {
  id: "git",
  code: "05",
  slug: "git",
  title: "Git",
  subtitle: "Version Control and Engineering Workflow",
  tagline: "Контроль версий и инженерный процесс",
  overview: [
    "Git — распределённая система контроля версий, в основе которой лежит простая модель: неизменяемые объекты, адресуемые по содержимому, и подвижные ссылки на них. Курс — не список команд, а модель, из которой команды выводятся.",
    "От рабочего каталога и индекса — к ветвлению, слиянию, rebase, reflog, внутреннему устройству и командным процессам.",
  ],
  why: [
    "Git страшен, пока он — набор заклинаний. С ментальной моделью любую ситуацию можно разобрать и безопасно исправить.",
    "Качество истории коммитов и процесса ревью напрямую влияет на скорость и надёжность команды.",
  ],
  outcomes: [
    "Объяснять, что такое коммит, ветка, HEAD и индекс на уровне объектов",
    "Безопасно использовать merge, rebase, reset, revert, reflog",
    "Разрешать конфликты осознанно",
    "Вести историю, которую приятно читать и удобно искать в ней ошибки",
    "Работать в командном процессе: ветки, pull request, ревью, релизы",
  ],
  prerequisites: ["Умение работать в терминале на базовом уровне"],
  estimatedHours: 35,
  accent: "emerald",
  modules: [
    { id: "fundamentals", index: 1, title: "Основы", titleEn: "Fundamentals", summary: "Репозиторий, рабочее дерево, индекс, коммиты, история.", level: "foundation" },
    { id: "core-ops", index: 2, project: "git.p01-tidy-history", title: "Базовые операции", titleEn: "Core Operations", summary: "init, clone, status, add, commit, log, diff, restore, switch.", level: "foundation" },
    { id: "branching", index: 3, project: "git.p02-merge-conflicts", title: "Ветки и слияние", titleEn: "Branching & Merging", summary: "Ветки как указатели, merge, fast-forward, конфликты.", level: "core" },
    { id: "collaboration", index: 4, project: "git.p03-remote-sync", title: "Совместная работа", titleEn: "Collaboration", summary: "remote, fetch, pull, push, pull request, code review.", level: "intermediate" },
    { id: "advanced-git", index: 5, project: "git.p04-history-rescue", title: "Продвинутый Git", titleEn: "Advanced Git", summary: "rebase, interactive rebase, cherry-pick, stash, reset, revert, reflog, bisect.", level: "advanced" },
    { id: "internals", index: 6, project: "git.p05-plumbing-repo", title: "Внутреннее устройство", titleEn: "Git Internals", summary: "Объекты, blob, tree, commit, ссылки, content addressing.", level: "advanced" },
    { id: "workflow", index: 7, project: "git.p06-release-flow", title: "Инженерный процесс", titleEn: "Engineering Workflow", summary: "Стратегии ветвления, conventional commits, релизы.", level: "engineering" },
  ],
};
