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
import { images } from "./images";
import { responsiveImages } from "./responsive-images";
import { audioVideo } from "./audio-video";
import { embeddedContent } from "./embedded-content";
import { landmarks } from "./landmarks";
import { sectioning } from "./sectioning";
import { contentSemantics } from "./content-semantics";
import { tablesStructure } from "./tables-structure";
import { tablesAccessibility } from "./tables-accessibility";
import { formsBasics } from "./forms-basics";
import { inputTypes } from "./input-types";
import { formControls } from "./form-controls";
import { formValidation } from "./form-validation";
import { formUxAutocomplete } from "./form-ux-autocomplete";
import { a11yFundamentals } from "./a11y-fundamentals";
import { aria } from "./aria";
import { keyboardFocus } from "./keyboard-focus";
import { accessibleForms } from "./accessible-forms";
import { a11yFailures } from "./a11y-failures";
import { headMetadata } from "./head-metadata";
import { seoFundamentals } from "./seo-fundamentals";
import { openGraphStructuredData } from "./open-graph-structured-data";

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
  // Модуль 4 — Изображения и медиа
  images,
  responsiveImages,
  audioVideo,
  embeddedContent,
  // Модуль 5 — Семантический HTML
  landmarks,
  sectioning,
  contentSemantics,
  // Модуль 6 — Таблицы
  tablesStructure,
  tablesAccessibility,
  // Модуль 7 — Формы
  formsBasics,
  inputTypes,
  formControls,
  formValidation,
  formUxAutocomplete,
  // Модуль 8 — Доступность
  a11yFundamentals,
  aria,
  keyboardFocus,
  accessibleForms,
  a11yFailures,
  // Модуль 9 — Метаданные и SEO
  headMetadata,
  seoFundamentals,
  openGraphStructuredData,
];
