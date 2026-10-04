import type { Topic } from "../../types";
import {
  annotated,
  beforeAfter,
  code,
  def,
  diagram,
  exercise,
  h,
  insight,
  iq,
  mcq,
  note,
  ol,
  open,
  p,
  section,
  steps,
  table,
  tip,
  ul,
  warn,
  wrongRight,
} from "../../dsl";

export const overflowSizing: Topic = {
  id: "css.overflow-sizing",
  slug: "overflow-sizing",
  domain: "css",
  module: "box-flow",
  title: "Размеры, содержимое и overflow",
  titleEn: "Sizing and overflow: min/max sizes, intrinsic keywords, aspect-ratio, overflow and text truncation",
  summary:
    "Что происходит, когда содержимое не помещается в блок? Тема разбирает размеры (`auto`, `min-*`, `max-*`), внутренние ключевые слова (`min-content`, `max-content`, `fit-content`), `aspect-ratio`, значения `overflow` и их влияние на прокрутку и контекст форматирования, перенос слов, усечение текста многоточием, `min-width: 0` во Flexbox и Grid и проблемы доступности прокручиваемых областей.",
  minutes: 55,
  prerequisites: ["css.box-model", "css.display-flow"],
  tags: ["width", "height", "min-width", "max-width", "min-content", "max-content", "fit-content", "aspect-ratio", "overflow", "overflow-wrap", "text-overflow", "line-clamp", "scrollbar-gutter", "overscroll-behavior", "object-fit", "resize", "intrinsic size"],
  keyConcepts: [
    { term: "Внутренние размеры", en: "intrinsic sizes", text: "`min-content` — самая узкая ширина без переполнения (самое длинное слово), `max-content` — ширина без переносов, `fit-content` — `max-content`, ограниченный доступным местом." },
    { term: "Проценты высоты", text: "`height: 50%` работает, только если у контейнера высота определена. Для гибкой высоты используйте `min-height`, Flexbox, Grid." },
    { term: "`overflow` — это ещё и контекст", text: "Любое значение `overflow`, кроме `visible`, делает элемент прокручиваемым контейнером и корнем BFC; `overflow: clip` обрезает без создания контекста прокрутки." },
    { term: "`min-width: 0` во Flexbox", text: "У flex- и grid-элементов `min-width` по умолчанию равен `auto` (по содержимому): длинное слово не даёт элементу сжаться. Разрешить сжатие помогает `min-width: 0`." },
    { term: "Прокручиваемая область должна быть доступна", text: "Область с `overflow: auto` без интерактивного содержимого не получает фокус и недоступна клавиатуре: нужны `tabindex=\"0\"`, роль и имя." },
  ],
  sections: [
    section("definition", [
      def("Переполнение", "Ситуация, когда содержимое блока по размеру превышает его область содержимого. Поведение определяет свойство `overflow`.", "overflow"),
      def("Внутренний размер", "Размер, определяемый самим содержимым: `min-content`, `max-content`, `fit-content`. Не зависит от размеров контейнера, если не заданы ограничения.", "intrinsic size"),
      def("Соотношение сторон", "Отношение ширины к высоте, задаваемое `aspect-ratio`. Позволяет вычислять один размер из другого для любых блоков, а не только для изображений и видео.", "aspect ratio"),
      def("Прокручиваемый контейнер", "Элемент с `overflow: auto/scroll/hidden` по соответствующей оси: он создаёт область прокрутки и корень BFC.", "scroll container"),
    ]),

    section("why", [
      h("Контент не бывает «правильной длины»"),
      p("Реальные тексты длиннее макета: имена из 30 символов, немецкие слова из 25 букв, пользовательский ввод, перевод на другой язык, увеличенный шрифт. Блоки, которые хорошо выглядят в дизайне, ломаются в продукте: текст вылезает за границы, кнопки теряют подписи, карточки растягивают сетку. Понимание размеров и переполнения позволяет проектировать компоненты, **устойчивые к любому содержимому**."),
      h("Что даёт понимание"),
      ul(
        "**Гибкие компоненты:** блок сам решает, сколько места ему нужно, и сжимается или переносится по правилам.",
        "**Меньше жёстких размеров:** `min-height` вместо `height`, `max-width` вместо `width`.",
        "**Контроль переполнения:** вы выбираете: перенос, обрезка, многоточие, прокрутка.",
        "**Доступность:** прокручиваемые области можно использовать клавиатурой.",
      ),
      insight("Лучший CSS — тот, который **не знает**, сколько будет текста. Задавайте ограничения (`min-*`, `max-*`, `fit-content`), а не конкретные размеры, и выбирайте поведение при переполнении осознанно."),
    ]),

    section("mental-model", [
      p("Представьте **ведро и воду**. Ведро — блок, вода — содержимое. Если ведро резиновое (`height: auto`), оно растёт вместе с водой. Если ведро жёсткое (`height: 100px`), лишняя вода: переливается через край (`visible`), обрезается ровно по краю (`hidden`), или к ведру приделан кран с лентой прокрутки (`auto`). Внутренние размеры — это ответ на вопрос «какое ведро нужно этой воде?»: `min-content` — самое узкое, куда вода ещё поместится (разбив длинные слова нельзя), `max-content` — самое широкое, если воду не переносить."),
      diagram(
        `
        ширина по содержимому
        ├── min-content   : самое длинное неразрывное слово       «Обязательность»
        ├── fit-content   : max-content, но не шире доступного    «min(max-content, max(min-content, доступно))»
        └── max-content   : вся строка без переносов              «Обязательность не должна быть единственным признаком»

        поведение при переполнении
        visible → вылезает   hidden → обрезается   clip → обрезается (без прокрутки)
        scroll  → полосы всегда   auto → полосы при необходимости
        `,
        "Внутренние размеры и варианты overflow",
      ),
      table(
        ["Задача", "Инструмент"],
        [
          ["Блок по ширине содержимого, но не шире контейнера", "`width: fit-content` или `max-width: 100%`"],
          ["Ограничить длину строки", "`max-width: 65ch`"],
          ["Видео или карточка 16:9", "`aspect-ratio: 16 / 9`"],
          ["Обрезать длинный текст многоточием", "`text-overflow: ellipsis` + `white-space: nowrap` + `overflow: hidden`"],
          ["Ограничить текст тремя строками", "`-webkit-line-clamp: 3` вместе с `display: -webkit-box`"],
          ["Прокручиваемая область", "`overflow: auto` + доступность"],
          ["Разрешить flex-элементу сжаться ниже содержимого", "`min-width: 0`"],
        ],
        "Что использовать",
      ),
    ]),

    section("technical", [
      h("Размеры и ограничения"),
      ul(
        "**`width: auto`:** блок заполняет контейнер; `inline-block`, `float` и flex-элементы — по содержимому.",
        "**`min-width`, `max-width`, `min-height`, `max-height`** ограничивают итоговый размер. Сначала применяется `max-*`, затем `min-*` (минимум побеждает).",
        "**`height: auto`** — по содержимому; проценты высоты требуют определённой высоты у родителя.",
        "**`aspect-ratio`:** при одном заданном размере второй вычисляется из соотношения; для replaced элементов используется собственное соотношение.",
      ),
      h("Внутренние ключевые слова"),
      table(
        ["Значение", "Смысл", "Типичное применение"],
        [
          ["`min-content`", "Самая узкая ширина без переполнения (перенос на каждом возможном месте)", "Колонки Grid по содержимому, `width: min-content` у подсказок"],
          ["`max-content`", "Ширина всего содержимого без переносов", "Кнопки, метки, колонки таблиц"],
          ["`fit-content`", "`min(max-content, max(min-content, доступное место))`", "Блок «по содержимому, но не шире контейнера»"],
          ["`fit-content(20rem)`", "То же с верхней границей", "Колонки Grid: `grid-template-columns: fit-content(20rem) 1fr`"],
          ["`stretch`", "Заполнить доступное место (включая margin)", "Замена `width: 100%` без выхода за пределы; поддержка выборочная — проверяйте"],
        ],
        "Внутренние размеры",
      ),
      code(
        "css",
        `
        .tag     { width: fit-content; }                      /* по тексту, но не шире контейнера */
        .tooltip { width: max-content; max-width: 20rem; }     /* по тексту, но не шире 20rem */
        .video   { aspect-ratio: 16 / 9; width: 100%; }        /* высота вычисляется */
        .avatar  { aspect-ratio: 1; width: 3rem; border-radius: 50%; object-fit: cover; }
        `,
        { filename: "sizing.css" },
      ),
      h("overflow"),
      table(
        ["Значение", "Поведение", "Заметки"],
        [
          ["`visible` (по умолчанию)", "Содержимое выходит за границы", "Родитель может получить горизонтальную прокрутку страницы"],
          ["`hidden`", "Обрезается, прокрутки нет у пользователя", "Создаёт контекст прокрутки: можно прокрутить программно или фокусом"],
          ["`clip`", "Обрезается строго по границе", "Не создаёт прокручиваемого контейнера и BFC; нет программной прокрутки"],
          ["`scroll`", "Полосы показываются всегда", "На macOS с оверлейными полосами визуально как `auto`"],
          ["`auto`", "Полосы по необходимости", "Самый частый выбор для прокручиваемых областей"],
        ],
        "Значения overflow",
      ),
      ul(
        "`overflow-x` и `overflow-y` задаются отдельно, но если одно значение не `visible`, то другое `visible` превращается в `auto`.",
        "**`scrollbar-gutter: stable`** резервирует место под полосу, чтобы раскладка не «прыгала» при её появлении.",
        "**`overscroll-behavior: contain`** не даёт прокрутке «просачиваться» из модального окна на страницу.",
        "**`scroll-behavior: smooth`** плавная программная прокрутка; отключайте при `prefers-reduced-motion`.",
      ),
      h("Перенос и усечение текста"),
      code(
        "css",
        `
        /* перенос длинных строк: URL, пользовательский ввод */
        .user-text { overflow-wrap: anywhere; }

        /* одна строка с многоточием */
        .ellipsis {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ограничение трёх строк */
        .clamp-3 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          overflow: hidden;
        }
        `,
        { filename: "text-overflow.css" },
      ),
      note("`overflow-wrap: anywhere` позволяет переносить длинные слова и учитывается при расчёте `min-content`, поэтому не мешает сжатию flex-элементов. `word-break: break-all` режет слова безжалостно и ухудшает читаемость; используйте его редко."),
      h("Flexbox, Grid и `min-width: auto`"),
      p("У flex- и grid-элементов `min-width` (и `min-height`) по умолчанию равен `auto`: элемент не уменьшается ниже размера своего содержимого (`min-content`). Поэтому длинная строка без пробелов растягивает колонку и вылезает за контейнер. Решение — `min-width: 0` у элемента (или `overflow: hidden/auto`, `overflow-wrap: anywhere`)."),
      code(
        "css",
        `
        .row { display: flex; gap: 1rem; }
        .row > .main { flex: 1; min-width: 0; }        /* разрешаем сжиматься ниже длины содержимого */
        .row > .main p { overflow-wrap: anywhere; }

        .layout { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; }   /* для Grid — minmax(0, 1fr) */
        `,
        { filename: "min-width-zero.css" },
      ),
      h("Доступность прокручиваемых областей"),
      ul(
        "Прокручиваемая область без фокусируемого содержимого **недоступна клавиатуре**: добавьте `tabindex=\"0\"`.",
        "Дайте ей **роль и имя**: `role=\"region\"` и `aria-label`/`aria-labelledby`, чтобы скринридер объявил её назначение.",
        "Видимый индикатор фокуса: `:focus-visible { outline: … }`.",
        "Не прячьте важное содержимое в областях с прокруткой; для таблиц данных — обёртка с прокруткой и заголовок (см. тему о таблицах).",
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .card {
          width: fit-content;
          max-width: 100%;
          min-height: 8rem;
        }

        .card__title {
          overflow-wrap: anywhere;
        }

        .card__body {
          max-height: 12rem;
          overflow: auto;
        }

        .thumb { aspect-ratio: 4 / 3; object-fit: cover; width: 100%; }
        `,
        [
          { line: 2, text: "Карточка занимает ширину содержимого, но не шире контейнера (`max-width: 100%`)." },
          { line: 4, text: "`min-height` вместо `height`: карточка растёт, если текста много." },
          { line: 8, text: "Длинные слова и адреса в заголовке переносятся, а не ломают раскладку." },
          { line: [11, 14], text: "Тело ограничено по высоте и прокручивается, но не обрезается молча." },
          { line: 16, text: "`aspect-ratio` и `object-fit` обеспечивают одинаковые миниатюры любых исходных размеров." },
        ],
        "syntax.css",
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <!doctype html>
        <meta charset="utf-8">
        <title>Размеры и overflow</title>
        <style>
          body { font: 16px/1.5 system-ui, sans-serif; margin: 1rem; }
          .box { width: 12rem; border: 1px solid #5c6bc0; margin-bottom: 1rem; padding: 0.25rem; }
          .hidden { overflow: hidden; height: 3rem; }
          .scroll { overflow: auto; height: 3rem; }
          .ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .fit { width: fit-content; background: #e8eaf6; }
          .video { aspect-ratio: 16 / 9; width: 12rem; background: #263238; }
        </style>
        <div class="box hidden">hidden: Очень длинный текст, который не помещается в три строки и будет обрезан.</div>
        <div class="box scroll">auto: Очень длинный текст, который не помещается в три строки и прокручивается.</div>
        <div class="box ellipsis">ellipsis: Очень длинный текст в одну строку заменяется многоточием</div>
        <div class="fit">fit-content</div>
        <div class="video"></div>
        `,
        { filename: "overflow-basics.html", runnable: true },
      ),
    ]),

    section("detailed-example", [
      p("Список контактов с именами разной длины: колонка с текстом должна сжиматься, длинное имя — усекаться многоточием, а комментарий — ограничиваться тремя строками. Покажите, как исчезает горизонтальная прокрутка благодаря `min-width: 0`."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <title>Контакты</title>
        <style>
          body { font: 1rem/1.5 system-ui, sans-serif; margin: 0; padding: 1rem; max-width: 24rem; }
          ul { list-style: none; margin: 0; padding: 0; }
          li { display: flex; gap: 0.75rem; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0; }

          .avatar { flex: none; aspect-ratio: 1; width: 2.5rem; border-radius: 50%; background: #c5cae9; }

          .text { flex: 1; min-width: 0; }       /* без этого длинное имя растянет строку */
          .name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .note {
            color: #546e7a;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
          }
        </style>
        <ul>
          <li><span class="avatar"></span><div class="text"><div class="name">Александра-Мария Константинопольская-Нижегородцева</div><div class="note">Отвечает на сообщения по вечерам, предпочитает письменную связь и просит не звонить по выходным дням и праздникам.</div></div></li>
          <li><span class="avatar"></span><div class="text"><div class="name">Иван</div><div class="note">Короткая заметка.</div></div></li>
        </ul>
        </html>
        `,
        { filename: "contacts.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      steps(
        [
          ["Аватар", "`flex: none` и `aspect-ratio: 1` дают круглую иконку постоянного размера, не сжимающуюся при нехватке места."],
          ["Колонка с текстом", "`flex: 1; min-width: 0` разрешает колонке сжиматься **ниже** ширины содержимого. Без `min-width: 0` длинное имя (неразрывная строка) растянуло бы колонку и строку за пределы контейнера."],
          ["Имя", "Три объявления: `white-space: nowrap` (одна строка), `overflow: hidden` (обрезка), `text-overflow: ellipsis` (многоточие). Нужны **все три**."],
          ["Комментарий", "`-webkit-line-clamp` ограничивает двумя строками. Без `overflow: hidden` текст выйдет за границу."],
        ],
        "Как работает пример",
      ),
      ul(
        "Усечение скрывает информацию: полный текст стоит дать в подсказке или на странице подробностей; не усекайте то, что пользователю необходимо прочитать целиком.",
        "Для Grid аналогично: `grid-template-columns: minmax(0, 1fr)` вместо `1fr`, чтобы колонка могла сжаться.",
      ),
    ]),

    section("internals", [
      h("Как браузер определяет ширину по содержимому"),
      steps(
        [
          ["Минимальная ширина (`min-content`)", "Браузер находит самое длинное **неразрывное** фрагмент: слово, изображение, фиксированный блок. Любая ширина меньше вызвала бы переполнение."],
          ["Предпочтительная ширина (`max-content`)", "Ширина всего содержимого без переносов, включая отступы."],
          ["Доступное место", "Ширина контейнера минус поля и границы."],
          ["Итог для `fit-content`", "`min(max-content, max(min-content, доступное место))`."],
        ],
        "Три величины для вычисления ширины",
      ),
      h("`overflow` и контекст прокрутки"),
      p("Значения `hidden`, `auto`, `scroll` создают **прокручиваемый контейнер**: он становится корнем BFC и содержащим блоком для некоторых позиционированных потомков, влияет на `position: sticky` и обрезает потомков, включая тени и фокусные рамки. `overflow: clip` обрезает без создания контейнера прокрутки: удобен, когда нужно только обрезание и не нужен BFC."),
      h("Измерение переполнения в JavaScript"),
      code(
        "js",
        `
        const el = document.querySelector(".name");

        // обрезан ли текст многоточием?
        const truncated = el.scrollWidth > el.clientWidth;

        // есть ли вертикальная прокрутка?
        const scrollable = el.scrollHeight > el.clientHeight;

        // горизонтальная прокрутка страницы (признак «вылезшего» блока)
        const pageOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        `,
        { filename: "overflow-check.js" },
      ),
      note("Сравнение `scrollWidth` и `clientWidth` — надёжный тест на переполнение; его можно использовать для автоматических проверок вёрстки на «неудобных» данных (длинные имена, переводы)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Фиксированная высота"),
      wrongRight(
        "css",
        {
          code: `
            .card { height: 200px; }
          `,
          note: "Если текста больше (увеличили шрифт, перевели на другой язык), он вылезет за границы карточки.",
        },
        {
          code: `
            .card { min-height: 12.5rem; }
          `,
          note: "Минимальная высота задана, а рост допускается.",
        },
      ),
      h("Ошибка 2. Забыть `min-width: 0`"),
      p("Длинный URL или слово растягивает flex-колонку и вылезает за контейнер. Добавьте `min-width: 0` (или `minmax(0, 1fr)` в Grid) и разрешите перенос: `overflow-wrap: anywhere`."),
      h("Ошибка 3. Многоточие без остальных двух свойств"),
      wrongRight(
        "css",
        {
          code: `
            .name { text-overflow: ellipsis; }
          `,
          note: "Без `overflow: hidden` и `white-space: nowrap` текст не обрезается и многоточие не показывается.",
        },
        {
          code: `
            .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          `,
          note: "Нужны все три объявления.",
        },
      ),
      h("Ошибка 4. `overflow: hidden` ради «лечения» схлопывания или плавающих"),
      p("Обрезает тени, рамки фокуса и выступающие элементы. Используйте `display: flow-root`."),
      h("Ошибка 5. `height: 100%` без высоты родителя"),
      p("Проценты не заработают; задайте `min-height`, используйте Flexbox/Grid или единицы окна."),
      h("Ошибка 6. Прокручиваемая область без доступности"),
      p("Блок с `overflow: auto` и текстом без интерактивных элементов нельзя прокрутить клавиатурой. Добавьте `tabindex=\"0\"`, `role=\"region\"`, `aria-label` и видимый фокус."),
      h("Ошибка 7. Усечение важного текста"),
      p("Обрезанные цены, адреса и имена, которые невозможно прочитать целиком, — потеря информации. Дайте способ развернуть или показать полностью."),
      h("Ошибка 8. `word-break: break-all` везде"),
      p("Режет слова на любом месте и портит читаемость. Предпочитайте `overflow-wrap: anywhere` или `hyphens: auto`."),
    ]),

    section("antipatterns", [
      ul(
        "**Фиксированные `height` у блоков с текстом.**",
        "**`overflow: hidden` по умолчанию** на контейнерах, чтобы «скрыть проблемы».",
        "**Макеты, проверенные только на «идеальном» тексте** без длинных слов и переводов.",
        "**Процентные `height` как основа раскладки.**",
        "**Усечение критичной информации** без способа прочитать полностью.",
        "**Блоки с прокруткой внутри прокрутки** (вложенные `overflow: auto`) — трудно использовать на touch-устройствах.",
        "**Прокручиваемые области без фокуса и имени.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Используйте `min-height` и `max-width`,** а не `height` и `width`, для блоков с текстом.",
        "**Проверяйте компоненты на «злом» контенте:** длинные слова, URL, пустые значения, переводы, увеличенный шрифт.",
        "**Во Flex/Grid:** `min-width: 0` и `minmax(0, 1fr)`; перенос `overflow-wrap: anywhere` там, где ожидается пользовательский ввод.",
        "**`aspect-ratio` и `object-fit`** для медиа: стабильные размеры без «прыжков».",
        "**Многоточие и `-webkit-line-clamp` — только для необязательных данных;** полный текст доступен по запросу.",
        "**Прокручиваемые области:** `tabindex=\"0\"`, `role=\"region\"`, `aria-label`, видимый фокус.",
        "**`scrollbar-gutter: stable`** для областей, где полоса появляется динамически.",
        "**Автоматизируйте:** тест на горизонтальную прокрутку страницы и на переполнение ключевых блоков.",
      ),
    ]),

    section("edge-cases", [
      h("`min-height: auto` у flex-элементов"),
      p("В колонке Flexbox `min-height: auto` не даёт элементу сжаться ниже содержимого: вложенный прокручиваемый блок с `overflow: auto` «не работает», пока у родителя не задан `min-height: 0`."),
      h("Проценты в `max-height`"),
      p("`max-height: 50%` ведёт себя как `none`, если у контейнера нет определённой высоты. Для ограничений относительно экрана используйте `dvh`."),
      h("Выпадающее содержимое и обрезка"),
      p("Выпадающие меню и подсказки внутри контейнера с `overflow: hidden/auto` будут обрезаны. Используйте позиционирование относительно окна (`position: fixed`), верхний слой (`popover`, `dialog`) или избегайте обрезки контейнера."),
      h("`position: sticky` внутри `overflow`"),
      p("Если у предка есть `overflow` не `visible`, `position: sticky` прилипает к **этому** предку, а не к окну. Частая причина «залипание не работает»."),
      h("`overflow: hidden` на `body`"),
      p("Блокирует прокрутку страницы (приём для модальных окон), но может сместить раскладку из-за исчезновения полосы: используйте `scrollbar-gutter: stable` и `overscroll-behavior`."),
      h("`text-overflow` и многострочный текст"),
      p("`text-overflow: ellipsis` работает только для переполнения по строке: для многострочного текста нужен `-webkit-line-clamp`, который работает в паре с `display: -webkit-box` и `-webkit-box-orient: vertical`."),
      h("`aspect-ratio` и содержимое"),
      p("`aspect-ratio` — минимальный размер: если содержимое выше, блок вырастет (только при `height: auto`). Чтобы блок точно соответствовал пропорции, добавьте `overflow: hidden` или `min-height: 0`."),
    ]),

    section("related", [
      ul(
        "[Блочная модель](/learn/css/box-model) — `box-sizing`, `min-*`/`max-*`.",
        "[display и нормальный поток](/learn/css/display-flow) — блочные и строчные коробки, BFC.",
        "[Схлопывание полей и BFC](/learn/css/margin-collapsing) — `overflow` и контексты форматирования.",
        "[Flex: размеры элементов](/learn/css/flex-sizing) — `flex-basis`, `min-width: auto`.",
        "[Grid: адаптивные сетки](/learn/css/grid-responsive) — `minmax(0, 1fr)`, `fit-content()`.",
        "[Таблицы: доступность](/learn/html/tables-accessibility) — прокручиваемые обёртки.",
        "Из других курсов: **JS** — `scrollWidth`, `clientWidth`, `ResizeObserver`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Жёсткие размеры и обрезка",
          code: `
            .card { width: 320px; height: 200px; overflow: hidden; }
            .title { height: 24px; overflow: hidden; }
            .row { display: flex; }
            .row .text { flex: 1; }
          `,
          note: "Контент обрезается молча, при увеличении шрифта ломается, длинное слово растягивает колонку.",
        },
        {
          title: "Устойчивые размеры",
          code: `
            .card { width: min(100%, 20rem); min-height: 12.5rem; }
            .title { overflow-wrap: anywhere; }
            .row { display: flex; gap: 1rem; }
            .row .text { flex: 1; min-width: 0; }
          `,
          note: "Размеры ограничены, но не фиксированы: блок растёт, перенос обрабатывает длинные слова, колонка может сжиматься.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.overflow-sizing.ex1",
      title: "Выберите значение overflow",
      difficulty: "foundation",
      kind: "recall",
      prompt: [
        p("Для каждой ситуации выберите значение `overflow` и объясните выбор:"),
        ol(
          "Список с сообщениями чата в блоке фиксированной высоты.",
          "Миниатюра изображения, скруглённая по краям.",
          "Таблица шире экрана на телефоне.",
          "Тень и рамка фокуса карточки не должны обрезаться.",
        ),
      ],
      hints: ["Нужна ли пользователю прокрутка?", "Что обрезает `overflow`, кроме содержимого?"],
      checks: ["Выбор обоснован для всех четырёх"],
      solution: [
        table(
          ["Ситуация", "Значение", "Обоснование"],
          [
            ["Чат фиксированной высоты", "`auto`", "Прокрутка по необходимости"],
            ["Скруглённая миниатюра", "`hidden` или `clip`", "Обрезка по скруглению; `clip` без создания контекста прокрутки"],
            ["Широкая таблица", "`auto` у обёртки + `tabindex=\"0\"`, `role=\"region\"`", "Горизонтальная прокрутка внутри области, доступная клавиатуре"],
            ["Тень и фокус", "`visible` (по умолчанию)", "Любое другое значение обрежет эффекты"],
          ],
        ),
      ],
    }),
    exercise({
      id: "css.overflow-sizing.ex2",
      title: "Усечение и ограничение строк",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Заголовок карточки должен занимать **одну строку** и усекаться многоточием, а описание — **не более трёх строк**. Напишите CSS для обоих случаев, объясните, зачем нужны все три объявления для многоточия, и укажите, как показать полный текст."),
      ],
      hints: ["Какие три свойства нужны для `text-overflow: ellipsis`?", "Как ограничивают число строк?", "Как сделать полный текст доступным?"],
      checks: ["Есть три объявления для многоточия", "Есть `-webkit-line-clamp` для многострочного", "Предложен способ показать текст полностью"],
      solution: [
        code(
          "css",
          `
          .title {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .desc {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            overflow: hidden;
          }
          `,
          { lineNumbers: true },
        ),
        ul(
          "Многоточие требует трёх условий: строка не переносится (`nowrap`), лишнее обрезается (`overflow: hidden`), вместо обрезанного показывается `…` (`text-overflow`).",
          "`-webkit-line-clamp` ограничивает число строк; название историческое, но поддерживается всеми современными браузерами при `display: -webkit-box` и `-webkit-box-orient: vertical`.",
          "Полный текст: атрибут `title` как необязательная подсказка (но не как единственный способ), кнопка «Читать полностью» или страница подробностей.",
        ),
      ],
    }),
    exercise({
      id: "css.overflow-sizing.ex3",
      title: "Колонка вылезает за контейнер",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("В flex-контейнере слева идёт боковая панель, справа — основная колонка, в которую пользователь вставил длинный идентификатор без пробелов и дефисов. Страница получила горизонтальную прокрутку. Найдите причину и исправьте тремя способами."),
      ],
      starter: {
        lang: "html",
        code: `
          <style>
            .layout { display: flex; gap: 1rem; width: 24rem; }
            .side { flex: none; width: 6rem; background: #e8eaf6; }
            .main { flex: 1; background: #fff3e0; }
          </style>
          <div class="layout">
            <aside class="side">Панель</aside>
            <main class="main">ОченьДлинныйИдентификаторБезПробеловИДефисовКоторомуНекудаПереноситься</main>
          </div>
        `,
      },
      hints: ["Чему равен `min-width` flex-элемента по умолчанию?", "Что разрешает перенос внутри длинной строки?"],
      checks: ["Названа причина `min-width: auto`", "Три способа исправления"],
      solution: [
        ul(
          "**Причина:** `.main` — flex-элемент, у которого `min-width: auto`: он не может стать уже `min-content` (длинного неразрывного слова), поэтому растягивает контейнер. Обычный URL с косыми чертами переносится по ним, а слово без пробелов и дефисов — нет.",
          "**Способ 1:** `min-width: 0` у `.main` + `overflow-wrap: anywhere`.",
          "**Способ 2:** `overflow: hidden` (или `auto`) у `.main`: для элементов с `overflow` не `visible` минимальная ширина `auto` вычисляется как 0.",
          "**Способ 3:** `overflow-wrap: anywhere` на тексте — он уменьшает `min-content`, и колонка может сжаться без `min-width: 0`.",
        ),
        code(
          "css",
          `
          .main { flex: 1; min-width: 0; overflow-wrap: anywhere; }
          `,
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.overflow-sizing.challenge",
    title: "Устойчивый компонент карточки к «злому» контенту",
    scenario: [
      p("Компонент карточки товара ломается на реальных данных: названия в 80 символов, цены в разных валютах, немецкие слова из 30 букв, пустые описания и увеличенный пользовательский шрифт. Нужно сделать компонент устойчивым и написать автоматический тест на «злых» данных, который ловит переполнение."),
    ],
    requirements: [
      "Карточка не вылезает за контейнер ни при каких данных",
      "Название — не более 2 строк, цена всегда видна полностью",
      "Изображение держит пропорцию 4:3 для любых исходных размеров",
      "Тест на наборе «злых» данных проверяет отсутствие горизонтальной прокрутки и обрезки цены",
    ],
    constraints: [
      "Цена не должна усекаться",
      "Высота карточки не фиксирована",
    ],
    acceptance: [
      "Горизонтальной прокрутки страницы нет на всех наборах данных",
      "Цена видна полностью (scrollWidth ≤ clientWidth)",
      "Название ограничено двумя строками, длинные слова переносятся",
      "Изображения одинаковой пропорции",
    ],
    hints: [
      "Какие свойства защищают flex- и grid-элементы от растягивания длинным словом?",
      "Как ограничить строки и всё же не потерять информацию?",
      "Как измерить переполнение в тесте?",
    ],
    solution: [
      code(
        "css",
        `
        .card { display: grid; grid-template-rows: auto 1fr auto; min-width: 0; max-width: 20rem; border: 1px solid #c5cae9; border-radius: 0.75rem; overflow: clip; }
        .card__img { aspect-ratio: 4 / 3; width: 100%; object-fit: cover; }
        .card__title {
          padding: 0.75rem 1rem 0;
          overflow-wrap: anywhere;
          hyphens: auto;
          display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
        }
        .card__price { padding: 0.5rem 1rem 1rem; font-weight: 700; white-space: nowrap; }   /* цена — целиком */
        `,
        { filename: "card.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        // Playwright: прогон «злых» данных
        const cases = [
          { title: "Очень длинное название товара ".repeat(4), price: "1 234 567,89 ₽" },
          { title: "Donaudampfschifffahrtsgesellschaftskapitänsmütze", price: "€ 12.345,67" },
          { title: "", price: "0 ₽" },
        ];

        for (const data of cases) {
          await page.setContent(renderCard(data));   // вставляем данные в шаблон карточки
          const result = await page.evaluate(() => {
            const page = document.documentElement;
            const price = document.querySelector(".card__price");
            return {
              pageOverflow: page.scrollWidth > page.clientWidth,
              priceCut: price.scrollWidth > price.clientWidth,
            };
          });
          expect(result).toEqual({ pageOverflow: false, priceCut: false });
        }
        `,
        { filename: "card.test.js" },
      ),
      ul(
        "**Устойчивость:** `min-width: 0` и `overflow-wrap: anywhere` не дают длинным словам растягивать карточку; `aspect-ratio` + `object-fit` стабилизируют изображения.",
        "**Информация:** название ограничено двумя строками, но цена — `nowrap` и не усечена; полное название доступно на странице товара и в `aria-label`.",
        "**Тест:** измеряет результат на неудобных данных — этим ловятся регрессии при изменении шрифтов, переводов и стилей.",
        "**Дополнительно:** прогон при увеличенном шрифте (`page.emulateMedia` не заменяет — используйте масштабирование или переопределение корневого размера).",
      ),
    ],
  },

  interview: [
    iq("css.overflow-sizing.i1", "basic", "Какие значения `overflow` вы знаете?", [
      ul(
        "`visible` — содержимое выходит за границы (по умолчанию).",
        "`hidden` — обрезается.",
        "`clip` — обрезается, но без прокрутки и без создания контекста.",
        "`scroll` — полосы всегда; `auto` — по необходимости.",
      ),
    ]),
    iq("css.overflow-sizing.i2", "basic", "Как обрезать длинный текст многоточием?", [
      p("Три объявления: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`. Для многострочного текста — `-webkit-line-clamp` вместе с `display: -webkit-box` и `-webkit-box-orient: vertical`."),
    ]),
    iq("css.overflow-sizing.i3", "intermediate", "Что означают `min-content`, `max-content` и `fit-content`?", [
      ul(
        "`min-content` — самая узкая ширина без переполнения (самое длинное слово).",
        "`max-content` — ширина всего содержимого без переносов.",
        "`fit-content` — `max-content`, ограниченный доступным местом.",
      ),
    ]),
    iq("css.overflow-sizing.i4", "intermediate", "Почему flex-элемент с длинной строкой растягивает контейнер и как это исправить?", [
      p("У flex-элементов `min-width` по умолчанию равен `auto` (размеру содержимого), поэтому они не сжимаются ниже длины неразрывной строки. Решения: `min-width: 0`, `overflow: hidden/auto`, `overflow-wrap: anywhere`. Для Grid — `minmax(0, 1fr)`."),
    ]),
    iq("css.overflow-sizing.i5", "intermediate", "Чем `overflow: clip` отличается от `hidden`?", [
      p("`hidden` создаёт прокручиваемый контейнер (можно прокручивать программно, создаётся BFC), `clip` обрезает строго по границе, не создаёт контекста и запрещает программную прокрутку. `clip` подходит для чистой обрезки без побочных эффектов."),
    ]),
    iq("css.overflow-sizing.i6", "advanced", "Что нужно для доступности прокручиваемой области?", [
      ul(
        "Фокусируемость: `tabindex=\"0\"`, если внутри нет интерактивных элементов.",
        "Роль и имя: `role=\"region\"`, `aria-label`/`aria-labelledby`.",
        "Видимый индикатор фокуса.",
        "Нет вложенных прокруток без необходимости.",
      ),
    ]),
    iq("css.overflow-sizing.i7", "engineering", "Как построить компоненты, устойчивые к любому контенту?", [
      ul(
        "Не фиксировать размеры: `min-*`, `max-*`, `fit-content`, `aspect-ratio`.",
        "Flex/Grid: `min-width: 0`, `minmax(0, 1fr)`, `overflow-wrap`.",
        "Явно выбирать поведение при переполнении: перенос, усечение, прокрутка — с доступом к полному содержимому.",
        "Тестировать на «злых» данных: длинные слова, переводы, пустые значения, увеличенный шрифт, и автоматизировать проверки переполнения.",
      ),
    ]),
    iq("css.overflow-sizing.i8", "debugging", "Страница получила горизонтальную прокрутку. Как найти виновника?", [
      ul(
        "В консоли пройти по элементам и найти те, у которых `getBoundingClientRect().right` превышает ширину окна.",
        "Проверить `100vw`, фиксированные ширины, flex/grid-элементы без `min-width: 0`, длинные слова, отрицательные поля.",
        "Исправить: ограничить `max-width: 100%`, `min-width: 0`, перенос слов; вставить `overflow-x: clip` на обёртку — только как последнее средство.",
      ),
    ]),
  ],

  exam: [
    mcq("css.overflow-sizing.e1", "foundation", "Какие три свойства нужны для усечения одной строки многоточием?", ["`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`", "`overflow: scroll; word-break: break-all; display: block`", "`text-overflow: ellipsis; line-height: 1`", "`overflow: auto; height: 1em`"], 0, "Нужно запретить перенос (`nowrap`), обрезать лишнее (`overflow: hidden`) и заменить обрезанное многоточием (`text-overflow`)."),
    mcq("css.overflow-sizing.e2", "foundation", "Что означает `width: fit-content`?", ["Ширина равна 100 %", "Ширина по содержимому, но не больше доступного места", "Ширина окна", "Минимальная ширина"], 1, "`fit-content` — `max-content`, ограниченный доступным местом контейнера."),
    mcq("css.overflow-sizing.e3", "intermediate", "Почему flex-элемент не сжимается ниже длины длинного слова?", ["`flex-shrink: 0`", "У него `min-width: auto` по умолчанию", "`display: block`", "Из-за `gap`"], 1, "Минимальная ширина flex-элемента по умолчанию определяется содержимым; `min-width: 0` разрешает сжатие."),
    mcq("css.overflow-sizing.e4", "intermediate", "Что делает `aspect-ratio: 16 / 9` у блока с `width: 320px` и `height: auto`?", ["Высота становится 180px", "Высота 320px", "Ничего", "Высота 9px"], 0, "Высота вычисляется из ширины и соотношения: 320 × 9 / 16 = 180px."),
    mcq("css.overflow-sizing.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`overflow: hidden` создаёт прокручиваемый контейнер", "`overflow: clip` создаёт BFC", "`scrollbar-gutter: stable` резервирует место под полосу", "Область с `overflow: auto` без интерактивных элементов доступна клавиатуре по умолчанию"], [0, 2], "`hidden` создаёт контейнер прокрутки, `scrollbar-gutter` резервирует место. `clip` BFC не создаёт, а без `tabindex` такая область недоступна клавиатуре."),
    mcq("css.overflow-sizing.e6", "advanced", "Почему `height: 100%` может не сработать?", ["Устаревшее значение", "У родителя не определена высота", "Нужен `display: inline`", "Нужен `position: static`"], 1, "Процентная высота требует определённой высоты у родителя; иначе она ведёт себя как `auto`."),
    open("css.overflow-sizing.e7", "intermediate", "Объясните, как сделать колонку Flexbox/Grid устойчивой к длинным словам.", [
      ul(
        "Flex: `min-width: 0` у элемента; Grid: `minmax(0, 1fr)` вместо `1fr`.",
        "Разрешить перенос: `overflow-wrap: anywhere`.",
        "Альтернатива: `overflow: hidden/auto` у элемента.",
        "Проверить на «злых» данных (URL, длинные слова, переводы).",
      ),
    ], ["Названы `min-width: 0`/`minmax(0, 1fr)`", "Упомянут перенос слов", "Упомянута проверка на реальных данных"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.overflow-sizing.m1", "intermediate", "У предка `overflow: auto`, а потомок с `position: sticky` не прилипает к окну. Почему?", ["Баг браузера", "Sticky прилипает к ближайшему прокручиваемому предку", "Нужен `z-index`", "Нужен `display: flex`"], 1, "`position: sticky` работает относительно ближайшего предка с контекстом прокрутки, а не окна."),
    mcq("css.overflow-sizing.m2", "advanced", "Что даёт `overflow-wrap: anywhere` по сравнению с `break-word`?", ["Ничего", "Учитывается при расчёте `min-content`, поэтому flex-элемент может сжаться", "Работает только в Safari", "Отключает переносы"], 1, "`anywhere` позволяет переносить в любом месте и уменьшает `min-content`, чего не делает `break-word`."),
    mcq("css.overflow-sizing.m3", "advanced", "Как отличить обрезанный многоточием текст в JS?", ["`el.textContent.length`", "`el.scrollWidth > el.clientWidth`", "`getComputedStyle(el).overflow`", "`el.offsetWidth`"], 1, "Если полная ширина содержимого больше видимой, текст обрезан; для вертикали используйте `scrollHeight > clientHeight`."),
    open("css.overflow-sizing.m4", "advanced", "Опишите стратегию тестирования вёрстки на переполнение для библиотеки компонентов.", [
      ul(
        "Набор «злых» данных: длинные слова и URL, пустые значения, переводы (немецкий, финский), RTL, большие числа.",
        "Автоматические проверки: нет горизонтальной прокрутки страницы, `scrollWidth ≤ clientWidth` у критичных элементов, визуальные снимки.",
        "Прогон при увеличенном шрифте и на узких экранах (320px).",
        "Правила: `min-width: 0`, перенос слов, `min-height` вместо `height`; линтер на фиксированные размеры.",
        "Интеграция в CI и сторибук.",
      ),
    ], ["Есть набор неудобных данных", "Автоматические проверки переполнения", "Масштаб и узкие экраны"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.overflow-sizing.f1", front: "Три свойства для многоточия?", back: "`white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`." },
    { id: "css.overflow-sizing.f2", front: "`min-content` и `max-content`?", back: "Самая узкая ширина без переполнения / ширина без переносов." },
    { id: "css.overflow-sizing.f3", front: "Flex-элемент не сжимается?", back: "У него `min-width: auto`. Решение: `min-width: 0` (Grid: `minmax(0, 1fr)`)." },
    { id: "css.overflow-sizing.f4", front: "`overflow: clip`?", back: "Обрезка без прокрутки и без создания BFC." },
    { id: "css.overflow-sizing.f5", front: "Доступность области прокрутки?", back: "`tabindex=\"0\"`, `role=\"region\"`, `aria-label`, видимый фокус." },
    { id: "css.overflow-sizing.f6", front: "`aspect-ratio: 16 / 9` при ширине 320px?", back: "Высота 180px." },
  ],

  sources: [
    { title: "CSS Sizing Module Level 3", url: "https://www.w3.org/TR/css-sizing-3/", publisher: "W3C" },
    { title: "CSS Overflow Module Level 3", url: "https://www.w3.org/TR/css-overflow-3/", publisher: "W3C" },
    { title: "MDN: overflow", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/overflow", publisher: "MDN" },
    { title: "MDN: aspect-ratio", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio", publisher: "MDN" },
    { title: "MDN: text-overflow", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow", publisher: "MDN" },
    { title: "MDN: min-content, max-content, fit-content", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/width", publisher: "MDN" },
  ],
};
