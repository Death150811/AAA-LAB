import type { DomainDef } from "../types";

export const cssDomain: DomainDef = {
  id: "css",
  code: "02",
  slug: "css",
  title: "CSS",
  subtitle: "Visual and Layout Engineering",
  tagline: "Визуальная и компоновочная инженерия",
  overview: [
    "CSS описывает, **как выглядит** документ и как его элементы располагаются на экране любого размера. Это не набор «красивостей», а система правил со строгой моделью: каскад, наследование, специфичность, блочная модель, потоки раскладки.",
    "Курс строится от ментальной модели к современным возможностям: Flexbox, Grid, контейнерные запросы, каскадные слои, `:has()`, анимации, архитектура стилей.",
  ],
  why: [
    "Большинство «магических» багов в вёрстке — следствие непонимания каскада и раскладки, а не недостатка трюков.",
    "Современный CSS заменил значительную часть JavaScript и препроцессоров; знание платформы дешевле зависимостей.",
  ],
  outcomes: [
    "Предсказывать, какое правило победит, и объяснять почему",
    "Выбирать между Flexbox, Grid и потоком под задачу",
    "Строить адаптивные интерфейсы без «магических чисел»",
    "Проектировать масштабируемую архитектуру стилей",
    "Анимировать производительно и с уважением к `prefers-reduced-motion`",
  ],
  prerequisites: ["Модуль «Основы документа» и «Семантический HTML» из курса HTML"],
  estimatedHours: 60,
  accent: "indigo",
  modules: [
    { id: "mental-model", index: 1, title: "Ментальная модель CSS", titleEn: "CSS Mental Model", summary: "Селекторы, каскад, наследование, специфичность, значения, единицы и цвета.", level: "foundation" },
    { id: "box-flow", index: 2, project: "css.p01-readable-article", title: "Блочная модель и поток", titleEn: "Box Model & Normal Flow", summary: "Из чего состоит блок, как работает нормальный поток, display, схлопывание отступов.", level: "foundation" },
    { id: "positioning", index: 3, project: "css.p02-interface-layers", title: "Позиционирование", titleEn: "Positioning", summary: "static, relative, absolute, fixed, sticky, контексты наложения.", level: "core" },
    { id: "flexbox", index: 4, project: "css.p03-flex-components", title: "Flexbox", summary: "Одномерная раскладка, выравнивание, гибкие размеры.", level: "core" },
    { id: "grid", index: 5, project: "css.p04-grid-dashboard", title: "Grid", summary: "Двумерная раскладка, области, auto-fit/auto-fill, minmax, subgrid.", level: "intermediate" },
    { id: "responsive", index: 6, project: "css.p05-responsive-landing", title: "Адаптивный дизайн", titleEn: "Responsive Design", summary: "Медиазапросы, mobile-first, fluid typography, контейнерные запросы.", level: "intermediate" },
    { id: "modern", index: 7, project: "css.p06-design-system", title: "Современный CSS", titleEn: "Modern CSS", summary: "Custom properties, :is(), :where(), :has(), логические свойства, cascade layers, вложенность.", level: "advanced" },
    { id: "animation", index: 8, title: "Анимация", titleEn: "Animation", summary: "Transitions, keyframes, трансформации, производительность, reduced motion, scroll-driven.", level: "advanced" },
    { id: "architecture", index: 9, title: "Архитектура CSS", titleEn: "CSS Architecture", summary: "Организация, BEM, utility-подход, дизайн-токены, борьба со специфичностью.", level: "engineering" },
    { id: "rendering", index: 10, title: "Рендеринг и производительность", titleEn: "Rendering & Performance", summary: "Как браузер применяет стили, layout, paint, composite.", level: "engineering" },
    { id: "capstone", index: 11, project: "css.p07-final", title: "Итоговый проект", titleEn: "Final Project", summary: "Дизайн-система и адаптивный сайт на чистом CSS.", level: "mastery" },
  ],
};
