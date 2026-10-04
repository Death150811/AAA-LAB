import type { Topic } from "../../types";
import { whatIsHtml } from "./what-is-html";
import { documentAnatomy } from "./document-anatomy";
import { elementsAttributes } from "./elements-attributes";
import { parsingDom } from "./parsing-dom";
import { headingsParagraphs } from "./headings-paragraphs";
import { inlineText } from "./inline-text";
import { lists } from "./lists";
import { links } from "./links";
import { navigationPatterns } from "./navigation-patterns";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const htmlTopics: Topic[] = [
  // Модуль 1 — Основы документа
  whatIsHtml,
  documentAnatomy,
  elementsAttributes,
  parsingDom,
  // Модуль 2 — Текст и контент
  headingsParagraphs,
  inlineText,
  lists,
  // Модуль 3 — Ссылки и навигация
  links,
  navigationPatterns,
];
