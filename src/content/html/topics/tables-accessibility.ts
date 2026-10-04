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

export const tablesAccessibility: Topic = {
  id: "html.tables-accessibility",
  slug: "tables-accessibility",
  domain: "html",
  module: "tables",
  title: "Сложные и доступные таблицы",
  titleEn: "Complex tables: headers/id, scope, responsive tables, sorting",
  summary:
    'Как сделать так, чтобы таблицу можно было прочитать без глаз, пролистать на телефоне и отсортировать с клавиатуры: связь ячеек с заголовками (`scope`, `headers`), группировка, прокручиваемые контейнеры, `aria-sort`, подпись и описание, проверка программой чтения. Плюс главный принцип: **сложную таблицу лучше разделить на простые**.',
  minutes: 45,
  prerequisites: ["html.tables-structure"],
  tags: ["headers", "scope", "colgroup", "rowgroup", "aria-sort", "адаптивные таблицы", "sticky", "caption", "aria-describedby", "доступность таблиц", "wcag", "responsive"],
  keyConcepts: [
    { term: "Простая таблица", text: "Один ряд заголовков столбцов и/или один столбец заголовков строк. Достаточно `th` + `scope`." },
    { term: "Сложная таблица", text: "Многоуровневые заголовки, объединённые ячейки, группы. Требует `headers`/`id` или лучше — разбиения." },
    { term: "headers/id", text: "Явная связь ячейки со списком `id` заголовков: `td headers=\"col-price row-basic\"`." },
    { term: "Прокручиваемый контейнер", text: "Обёртка с `overflow-x: auto`, делающая широкую таблицу доступной на узком экране без разрушения семантики." },
    { term: "aria-sort", text: "Атрибут на `th`, сообщающий текущее направление сортировки: `ascending`, `descending`, `none`." },
  ],
  sections: [
    section("definition", [
      def("Доступная таблица", "Таблица, из разметки которой ассистивные технологии могут восстановить **заголовки** каждой ячейки данных, **название**, **размеры** и **группы**, и которой можно пользоваться с клавиатуры (прокрутка, сортировка) на любом размере экрана.", "accessible table"),
      table(
        ["Требование", "Как реализуется", "Критерий WCAG"],
        [
          ["Заголовки связаны с данными", "`th` + `scope` или `headers`/`id`", "1.3.1 Информация и взаимосвязи (A)"],
          ["Название таблицы", "`caption`", "2.4.6 Заголовки и метки (AA); 1.3.1"],
          ["Сложная структура понятна", "`colgroup`, `scope=\"colgroup\"`, `rowgroup`", "1.3.1"],
          ["Управление клавиатурой", "Кнопки в заголовках, фокус на прокручиваемом контейнере", "2.1.1 Клавиатура (A)"],
          ["Масштабирование и reflow", "Контейнер с прокруткой; без потери данных", "1.4.10 Reflow (AA)"],
        ],
      ),
    ]),

    section("why", [
      h("Что слышит пользователь программы чтения"),
      p("Читая таблицу, программа чтения озвучивает не только значение ячейки, но и **её заголовки**: «Расширенный, Цена, 1 990 рублей». Пользователь может двигаться по ячейкам стрелками с модификаторами (NVDA/JAWS — `Ctrl+Alt+стрелки`, VoiceOver — `VO+стрелки`) и на каждом шаге слышит контекст. Это работает **только если разметка связывает** заголовки и данные."),
      p("Если связей нет, пользователь слышит последовательность чисел: «990, 1 990, 3, без ограничений» — и не знает, какое из них к какому тарифу."),
      h("Почему «сложные» таблицы — особая проблема"),
      p("Для простой таблицы `scope` достаточно. Но если шапка двухуровневая, есть объединённые ячейки и несколько групп строк, механизм `scope` не всегда однозначен, и программы чтения могут ошибаться. Тогда нужно либо явно задать `headers`, либо — лучше — **упростить структуру**."),
      h("Проблема мобильных экранов"),
      p("Широкая таблица на экране 360px либо ломает макет, либо требует горизонтальной прокрутки. Универсального идеального решения нет, но есть безопасные паттерны, которые не уничтожают семантику."),
      insight("Лучшая доступность сложной таблицы — **отсутствие сложной таблицы**: две простые, связанные заголовками, понятнее одной с пятью объединёнными ячейками."),
    ]),

    section("mental-model", [
      p("Представьте, что вы диктуете таблицу по телефону. Для простой достаточно: «Строка Базовый: цена 990, проектов 3». Для сложной с группами вам придётся каждый раз уточнять: «В группе “Цена”, подгруппа “в год”, для тарифа “Бизнес”…». Атрибуты `scope` и `headers` — это способ записать такие уточнения в разметку, чтобы программа произнесла их за вас."),
      diagram(
        `
        Простая таблица:               Сложная таблица:
        scope="col" / scope="row"      headers="id1 id2 id3"  (явный список заголовков)

        ┌──────┬───────┬───────┐        ┌───────┬─────────────────────┐
        │      │ Баз.  │ Про   │        │       │       Цена          │  ← colgroup
        ├──────┼───────┼───────┤        │       ├──────────┬──────────┤
        │ Цена │ 990   │ 1990  │        │ Тариф │ в месяц  │  в год   │
        └──────┴───────┴───────┘        ├───────┼──────────┼──────────┤
                                         │ Базов.│   990    │  9 900   │
        Заголовки — одним уровнем        └───────┴──────────┴──────────┘
        `,
        "Простая и сложная таблицы",
      ),
    ]),

    section("technical", [
      h("`scope`"),
      table(
        ["Значение", "Заголовок относится к"],
        [
          ["`col`", "Всем ячейкам столбца ниже"],
          ["`row`", "Всем ячейкам строки справа"],
          ["`colgroup`", "Всем столбцам группы (`<colgroup>` или `colspan`)"],
          ["`rowgroup`", "Всем строкам группы (`<tbody>`/`<thead>`/`<tfoot>` или `rowspan`)"],
        ],
      ),
      h("`headers` и `id`: явная связь"),
      p("Если `scope` не может выразить связь (нерегулярные таблицы, пересекающиеся группы), каждому `th` задают `id`, а у `td` перечисляют **все** нужные `id` в `headers`:"),
      code(
        "html",
        `
        <table>
          <caption>Цены и скидки</caption>
          <thead>
            <tr>
              <td rowspan="2"></td>
              <th id="price" colspan="2" scope="colgroup">Цена</th>
            </tr>
            <tr>
              <th id="month" scope="col" headers="price">в месяц</th>
              <th id="year"  scope="col" headers="price">в год</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th id="basic" scope="row">Базовый</th>
              <td headers="basic price month">990&nbsp;₽</td>
              <td headers="basic price year">9&nbsp;900&nbsp;₽</td>
            </tr>
          </tbody>
        </table>
        `,
        { lineNumbers: true },
      ),
      note("`headers` — трудоёмкий и хрупкий механизм: при изменении таблицы нужно править каждую ячейку. Используйте его только когда без него нельзя, а чаще **упрощайте структуру**."),
      h("Подпись и описание"),
      ul(
        "**`<caption>`** — название таблицы. Устаревший атрибут `summary` не используется.",
        "**Описание** (что показано, как читать, главный вывод) — отдельный абзац до или после таблицы, связанный через `aria-describedby` (необязательно).",
        "**Для графиков** — таблица данных как текстовая альтернатива.",
      ),
      h("Адаптивность: безопасные паттерны"),
      table(
        ["Подход", "Суть", "Плюсы", "Риски"],
        [
          ["**Прокручиваемый контейнер**", "Обёртка с `overflow-x: auto`; таблица сохраняет размеры", "Семантика не нарушается; всё содержимое доступно", "Нужна фокусируемая обёртка с именем; пользователь должен заметить прокрутку"],
          ["**Скрытие второстепенных столбцов**", "На узких экранах `display: none` для колонок", "Компактность", "Данные исчезают и для программ чтения; нужна альтернатива (раскрытие)"],
          ["**Карточки вместо строк**", "CSS превращает `tr` в блоки с подписями `::before`", "Удобно на телефоне", "Часто теряется семантика таблицы; подписи из CSS-контента; требует восстановления ролей"],
        ],
      ),
      code(
        "html",
        `
        <div class="table-scroll" role="region" aria-labelledby="t1-cap" tabindex="0">
          <table>
            <caption id="t1-cap">Показатели по регионам</caption>
            …
          </table>
        </div>

        <style>
          .table-scroll { overflow-x: auto; max-inline-size: 100%; }
          .table-scroll:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
          .table-scroll table { min-inline-size: 40rem; border-collapse: collapse; }
        </style>
        `,
        { lineNumbers: true },
      ),
      p("`role=\"region\"` с `aria-labelledby` делает обёртку именованной областью (иначе прокручиваемый элемент без имени — загадочный «группа»). `tabindex=\"0\"` даёт клавиатурным пользователям возможность прокручивать стрелками: в новых версиях браузеров прокручиваемые контейнеры становятся фокусируемыми сами, но явный атрибут остаётся надёжнее."),
      h("Липкие заголовки"),
      code(
        "css",
        `
        thead th { position: sticky; inset-block-start: 0; background: var(--bg); }
        tbody th { position: sticky; inset-inline-start: 0; background: var(--bg); }
        `,
        { caption: "`position: sticky` не меняет семантику — безопасный способ держать шапку на виду." },
      ),
      h("Сортировка"),
      p("Заголовок сортируемого столбца содержит **кнопку**, а `th` получает `aria-sort`. Только один столбец имеет `ascending`/`descending`; остальные — `none` или без атрибута. Состояние дополнительно озвучивают сообщением в live-регионе."),
      code(
        "html",
        `
        <table>
          <caption>Книги <span id="sort-status" class="visually-hidden" role="status"></span></caption>
          <thead>
            <tr>
              <th scope="col" aria-sort="ascending">
                <button type="button">Название</button>
              </th>
              <th scope="col" aria-sort="none">
                <button type="button">Год</button>
              </th>
            </tr>
          </thead>
          …
        </table>
        `,
        { lineNumbers: true },
      ),
    ]),

    section("syntax", [
      diagram(
        `
        <div role="region" aria-labelledby="cap" tabindex="0">    ← прокручиваемая именованная область
          <table aria-describedby="desc">                          ← необязательное описание
            <caption id="cap">…</caption>                          ← название
            <colgroup><col><col span="2"></colgroup>               ← группы столбцов
            <thead>
              <tr><th scope="col" aria-sort="…"><button>…</button></th> …
            <tbody>
              <tr><th scope="row">…</th><td>…</td> …
            <tfoot> …
          </table>
        </div>
        <p id="desc">Таблица показывает … Главный вывод: …</p>     ← описание
        `,
        "Каркас доступной таблицы",
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <div class="table-scroll" role="region" aria-labelledby="c" tabindex="0">
          <table>
            <caption id="c">Города и население</caption>
            <thead><tr><th scope="col">Город</th><th scope="col">Население, млн</th></tr></thead>
            <tbody>
              <tr><th scope="row">Москва</th><td>13,1</td></tr>
              <tr><th scope="row">Санкт-Петербург</th><td>5,6</td></tr>
            </tbody>
          </table>
        </div>
        <style>
          .table-scroll { overflow-x: auto; }
          table { border-collapse: collapse; min-width: 30rem; }
          th, td { border: 1px solid #888; padding: .4rem .8rem; text-align: left; }
        </style>
        `,
        { runnable: true },
      ),
      p("Минимальный доступный набор: подпись, `th` с `scope`, прокручиваемый именованный контейнер. Остальное — по мере сложности."),
    ]),

    section("detailed-example", [
      p("Таблица заказов с липкой шапкой, сортировкой, чекбоксами выбора и колонкой действий. Все интерактивные элементы — настоящие `button` и `input`; семантика таблицы сохраняется."),
      code(
        "html",
        `
        <div class="table-scroll" role="region" aria-labelledby="orders-cap" tabindex="0">
          <table class="orders">
            <caption id="orders-cap">Заказы за март (показано 3 из 128)</caption>
            <thead>
              <tr>
                <th scope="col"><input type="checkbox" id="all" aria-label="Выбрать все заказы"></th>
                <th scope="col" aria-sort="descending"><button type="button">Дата</button></th>
                <th scope="col" aria-sort="none"><button type="button">Клиент</button></th>
                <th scope="col" class="num" aria-sort="none"><button type="button">Сумма, ₽</button></th>
                <th scope="col"><span class="visually-hidden">Действия</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox" aria-label="Выбрать заказ 1042"></td>
                <th scope="row"><time datetime="2026-03-14">14 марта</time></th>
                <td>Анна Соколова</td>
                <td class="num">12&nbsp;490</td>
                <td><a href="/orders/1042">Открыть<span class="visually-hidden"> заказ 1042</span></a></td>
              </tr>
              <!-- …ещё строки… -->
            </tbody>
          </table>
        </div>
        `,
        { lineNumbers: true, filename: "orders.html", collapsed: true },
      ),
      code(
        "js",
        `
        // Сортировка: меняем aria-sort у заголовка и сообщаем результат
        function sortBy(th, direction) {
          th.closest("thead").querySelectorAll("th[aria-sort]").forEach((h) => h.setAttribute("aria-sort", "none"));
          th.setAttribute("aria-sort", direction);
          document.getElementById("sort-status").textContent =
            "Отсортировано по «" + th.textContent.trim() + "»: " + (direction === "ascending" ? "по возрастанию" : "по убыванию");
        }
        `,
        { lineNumbers: true },
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <th scope="col" aria-sort="descending">
          <button type="button">Дата</button>
        </th>
        <th scope="col" class="num" aria-sort="none">
          <button type="button">Сумма, ₽</button>
        </th>
        <th scope="col"><span class="visually-hidden">Действия</span></th>
        `,
        [
          { line: 1, text: "`aria-sort=\"descending\"` — текущее состояние сортировки. Только у **одного** столбца: у остальных `none` или атрибута нет." },
          { line: 2, text: "Внутри `th` — настоящая `<button>`: фокус, Enter/Space, роль. Заголовок остаётся `th` и сохраняет связь с данными." },
          { line: 4, text: "Столбец «Сумма» — числовой: класс `num` выравнивает по правому краю; заголовок кнопки содержит единицу измерения." },
          { line: 6, text: "Столбец без видимого заголовка (кнопки действий) всё равно получает **название** для программ чтения — скрытый визуально текст. Пустой `th` создал бы безымянный столбец." },
        ],
        "sort-headers.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Построение сетки", "Браузер строит модель таблицы с учётом `colspan`/`rowspan` и вычисляет для каждой ячейки данных набор заголовков по алгоритму ассоциации: либо по `headers`, либо по `scope` и положению."],
          ["Дерево доступности", "Таблица экспонируется как `table`/`grid`; `th` — `columnheader`/`rowheader`; ячейки — `cell`. Размеры (число строк/столбцов) вычисляются автоматически либо задаются `aria-rowcount`/`aria-colcount` для виртуализации."],
          ["Озвучивание", "При перемещении по ячейкам программа чтения проговаривает заголовки (по настройкам: строка, столбец или оба) и позицию."],
          ["Смена `display`", "Если элементам таблицы задать `display`, отличный от табличных, ряд браузеров перестаёт строить табличную семантику; это объясняет «потерянные» таблицы после «адаптивного» CSS."],
          ["Прокрутка", "Прокручиваемый контейнер с `tabindex=\"0\"` попадает в порядок фокуса; клавиши-стрелки прокручивают его содержимое."],
        ],
        "От разметки к озвучиванию",
      ),
      warn("Таблицы с `display: block/flex/grid` на `tr`/`td` без восстановления ролей (`role=\"row\"`, `role=\"cell\"` и т.д.) в проверенных связках Safari/VoiceOver перестают быть таблицами. Если вы всё же перестраиваете таблицу CSS, обязательно проверьте это сочетание вручную."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Заголовки без `scope` в сложной таблице"),
      p("Для многоуровневых шапок и объединённых ячеек одних `th` без `scope`/`headers` недостаточно: программа может связать ячейку не с теми заголовками. Либо упростите таблицу, либо задайте `scope=\"colgroup\"`/`rowgroup`, либо `headers`."),
      h("Ошибка 2. Пустой `th`"),
      wrongRight(
        "html",
        {
          code: `<th></th>`,
          note: "Безымянный заголовок: программа чтения не знает, что описывает столбец (чаще всего — колонка с кнопками или чекбоксами).",
        },
        {
          code: `<th scope="col"><span class="visually-hidden">Действия</span></th>`,
          note: "Название есть: визуально скрыто, но озвучивается.",
        },
      ),
      h("Ошибка 3. «Адаптивная» таблица через `display: block`"),
      wrongRight(
        "css",
        {
          code: `
            @media (max-width: 600px) {
              table, thead, tbody, tr, th, td { display: block; }
              thead { display: none; }
              td::before { content: attr(data-label); }
            }
          `,
          note: "Семантика таблицы может исчезнуть, заголовки скрыты, подписи — CSS-контент (часто не озвучивается или озвучивается непредсказуемо).",
        },
        {
          code: `
            .table-scroll { overflow-x: auto; }
            .table-scroll table { min-width: 40rem; }
          `,
          note: "Таблица остаётся таблицей. Горизонтальная прокрутка сообщает о наличии содержимого и сохраняет все данные.",
        },
      ),
      h("Ошибка 4. Сортировка по клику на `th` без кнопки"),
      p("`<th onclick=\"sort()\">` не получает фокус, не имеет роли и не объявляет состояние. Нужна `<button>` внутри `th` и `aria-sort`."),
      h("Ошибка 5. Прокручиваемый контейнер без имени и фокуса"),
      p("`<div style=\"overflow:auto\">` с таблицей — «группа» без названия, недоступная клавиатуре в части браузеров. Добавьте `role=\"region\"`, `aria-labelledby` и `tabindex=\"0\"`."),
      h("Ошибка 6. Цвет как единственный признак"),
      p("Красные/зелёные ячейки без текста «ниже нормы»/«в норме» недоступны пользователям с нарушениями цветового зрения (WCAG 1.4.1). Добавьте текст, значок с названием или символы."),
    ]),

    section("antipatterns", [
      ul(
        "**Сложная таблица на 12 столбцов с 5 уровнями объединения** вместо нескольких простых.",
        "**Таблица как картинка** (скриншот, `<img>`) — недоступна и не масштабируется.",
        "**Невидимые таблицы-разметка в `<table role=\"presentation\">` для почтовых шаблонов** допустимы только там, где иначе нельзя (HTML-письма); в вебе — Grid/Flexbox.",
        "**Липкая шапка без фона** — текст накладывается на прокручиваемое содержимое.",
        "**Автоматическая «виртуализация» без `aria-rowcount`/`aria-rowindex`** — программа чтения не знает реального размера таблицы.",
        "**Сортировка и фильтры, меняющие таблицу без уведомления** пользователя программы чтения.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Проектируйте простые таблицы:** один ряд заголовков столбцов и (при необходимости) один столбец заголовков строк.",
        "**Сложную таблицу разбейте** на несколько простых; если нельзя — `scope=\"colgroup\"/\"rowgroup\"` и, при необходимости, `headers`.",
        "**Всегда `caption`;** при необходимости — описание рядом.",
        "**Каждому столбцу — название,** даже если оно визуально скрыто.",
        "**Широкие таблицы — в прокручиваемый именованный контейнер** (`role=\"region\"`, `aria-labelledby`, `tabindex=\"0\"`).",
        "**Сортировка — кнопка в `th` + `aria-sort` + сообщение о результате.**",
        "**Числа — правый край и `tabular-nums`; единицы — в заголовке.**",
        "**Не передавайте смысл цветом.**",
        "**Проверяйте:** NVDA (Ctrl+Alt+стрелки), VoiceOver, клавиатура, масштаб 200–400%, ориентация экрана.",
        "**Для графиков и инфографики — таблица данных как альтернатива.**",
      ),
    ]),

    section("edge-cases", [
      h("Таблицы-раскладки в HTML-письмах"),
      p("Почтовые клиенты плохо поддерживают современный CSS, поэтому раскладку писем по-прежнему делают таблицами. В таком случае таблице добавляют `role=\"presentation\"` (она не объявляется как таблица), а `th`/`caption`/`scope` не используют."),
      h("`aria-rowcount` и виртуализация"),
      p("Если в DOM отрисована только часть строк (виртуализация длинного списка), задайте таблице `aria-rowcount` с реальным числом строк, а строкам — `aria-rowindex`. Тогда программа чтения сообщит «строка 120 из 5 000»."),
      h("Интерактивные таблицы (grid)"),
      p("Если ячейки редактируются, а навигация — стрелками как в электронной таблице, нужен паттерн **grid** (`role=\"grid\"`, `gridcell`) и полноценная клавиатурная реализация по APG. Это существенно сложнее обычной таблицы — используйте готовую проверенную библиотеку."),
      h("`abbr` в заголовках"),
      p("Для длинных заголовков допустим `<th abbr=\"Цена\">Цена за единицу при заказе от 100 штук</th>` — программа чтения может озвучивать краткую форму при навигации."),
      h("Печать и ширина"),
      p("Для печати широкую таблицу можно уменьшить (`@media print`), сделать шрифт меньше или разрешить перенос; прокрутка при печати не работает."),
      h("Заголовки в каждой строке длинной таблицы"),
      p("Если таблица очень длинная, можно повторять шапку блоков через несколько `tbody` с собственными `th scope=\"rowgroup\"`, но избегайте дублирования самих столбцовых заголовков внутри данных."),
      h("Языки с письмом справа налево"),
      p("Для RTL-интерфейсов используйте логические свойства (`inset-inline-start`, `padding-inline`) — так липкий первый столбец окажется справа, а прокрутка будет корректной."),
    ]),

    section("related", [
      ul(
        "[Таблицы: структура и ячейки](/learn/html/tables-structure) — основа: `th`, `scope`, `caption`, группы.",
        "[ARIA](/learn/html/aria) — `aria-sort`, `aria-describedby`, `aria-rowcount`.",
        "[Клавиатура и фокус](/learn/html/keyboard-focus) — фокус на прокручиваемых областях и кнопках в заголовках.",
        "[Основы доступности](/learn/html/a11y-fundamentals) — как устроено дерево доступности.",
        "Из других курсов: **CSS** — `position: sticky`, `overflow`, логические свойства; **JS** — сортировка и фильтрация данных, управление `aria-sort`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Таблица, которую нельзя прочитать на слух",
          code: `
            <div style="overflow:auto">
              <table border="1">
                <tr><td><b>Дата</b></td><td onclick="sort()"><b>Сумма</b></td><td></td></tr>
                <tr><td>14.03</td><td style="color:red">12490</td><td><img src="edit.png"></td></tr>
              </table>
            </div>
          `,
          note: "Нет `caption` и заголовков, сортировка на `td`, красный цвет без текста, безымянные колонки, иконка без `alt`, контейнер без имени и фокуса.",
        },
        {
          title: "Доступная таблица",
          code: `
            <div class="table-scroll" role="region" aria-labelledby="c" tabindex="0">
              <table>
                <caption id="c">Заказы</caption>
                <thead><tr>
                  <th scope="col" aria-sort="descending"><button type="button">Дата</button></th>
                  <th scope="col" aria-sort="none"><button type="button">Сумма, ₽</button></th>
                  <th scope="col"><span class="visually-hidden">Действия</span></th>
                </tr></thead>
                <tbody><tr>
                  <th scope="row"><time datetime="2026-03-14">14 марта</time></th>
                  <td>12&nbsp;490 <span class="status">(выше плана)</span></td>
                  <td><a href="/orders/1">Изменить</a></td>
                </tr></tbody>
              </table>
            </div>
          `,
          note: "Подпись, заголовки с `scope`, кнопки сортировки с состоянием, текстовое пояснение вместо цвета, именованные столбцы, доступный контейнер.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.tables-accessibility.ex1",
      title: "Прослушайте таблицу в уме",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Представьте, что программа чтения озвучивает ячейку «1 990» в каждой из двух разметок. Что услышит пользователь и в чём разница?"),
        code(
          "html",
          `
          <!-- А -->
          <tr><td><b>Расширенный</b></td><td>1 990</td></tr>

          <!-- Б -->
          <tr><th scope="row">Расширенный</th><td>1 990</td></tr>
          `,
        ),
        p("Дополните: что изменится, если в шапке столбца стоит `<th scope=\"col\">Цена, ₽</th>`?"),
      ],
      hints: ["Что программа читает вместе со значением ячейки?", "Когда ячейка знает свои заголовки?"],
      checks: ["Объяснено, что в варианте А заголовок строки не связан с данными", "Для Б указан озвученный контекст"],
      solution: [
        ul(
          "**А:** `td` — обычная ячейка, а `<b>` — оформление. Программа озвучит просто «1 990» (возможно, «ячейка 2 строки 1»); связи с «Расширенный» нет.",
          "**Б:** `th scope=\"row\"` связывает заголовок с ячейками справа: при чтении «1 990» будет озвучено «Расширенный, 1 990».",
          "**С шапкой «Цена, ₽»** при `scope=\"col\"` пользователь услышит оба заголовка: «Цена, рубли; Расширенный; 1 990».",
        ),
      ],
    }),
    exercise({
      id: "html.tables-accessibility.ex2",
      title: "Адаптивная сортируемая таблица",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сделайте таблицу «Книги» (название, автор, год, цена) доступной и адаптивной: подпись, `scope`, прокручиваемый контейнер с именем и фокусом, сортировка по двум столбцам с `aria-sort` и сообщением о результате (live-регион). Напишите разметку и JavaScript-функцию смены состояния."),
      ],
      hints: ["`aria-sort` на `th`, кнопка внутри `th`.", "Live-регион: `role=\"status\"` с текстом результата.", "Только один столбец с текущей сортировкой."],
      checks: ["`caption`, `scope`, контейнер `role=\"region\"` + `aria-labelledby` + `tabindex`", "Кнопки в заголовках, `aria-sort`", "Скрытый `role=\"status\"` объявляет результат"],
      solution: [
        code(
          "html",
          `
          <p id="sort-status" class="visually-hidden" role="status"></p>
          <div class="table-scroll" role="region" aria-labelledby="books-cap" tabindex="0">
            <table id="books">
              <caption id="books-cap">Книги</caption>
              <thead>
                <tr>
                  <th scope="col" aria-sort="none"><button type="button" data-key="title">Название</button></th>
                  <th scope="col">Автор</th>
                  <th scope="col" aria-sort="none"><button type="button" data-key="year">Год</button></th>
                  <th scope="col">Цена, ₽</th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">Чистый код</th><td>Р. Мартин</td><td>2008</td><td>1&nbsp;890</td></tr>
                <tr><th scope="row">Рефакторинг</th><td>М. Фаулер</td><td>1999</td><td>2&nbsp;100</td></tr>
              </tbody>
            </table>
          </div>
          <script>
            const table = document.getElementById("books");
            const status = document.getElementById("sort-status");
            table.tHead.addEventListener("click", (e) => {
              const btn = e.target.closest("button[data-key]");
              if (!btn) return;
              const th = btn.closest("th");
              const dir = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";
              table.tHead.querySelectorAll("th[aria-sort]").forEach((h) => h.setAttribute("aria-sort", "none"));
              th.setAttribute("aria-sort", dir);
              const col = th.cellIndex;
              const rows = [...table.tBodies[0].rows];
              rows.sort((a, b) => a.cells[col].textContent.localeCompare(b.cells[col].textContent, "ru", { numeric: true }) * (dir === "ascending" ? 1 : -1));
              table.tBodies[0].append(...rows);
              status.textContent = "Отсортировано по «" + btn.textContent + "»: " + (dir === "ascending" ? "по возрастанию" : "по убыванию");
            });
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        tip("Для сортировки по числам важно приводить значения к числам (`numeric: true` в `localeCompare` решает часть случаев). Для цен с неразрывными пробелами нужна очистка строки."),
      ],
    }),
    exercise({
      id: "html.tables-accessibility.ex3",
      title: "Таблица потеряла семантику на телефоне",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("После внедрения «адаптивного» CSS программа чтения VoiceOver на iPhone перестала объявлять таблицу заказов («таблица, 12 строк»), а клавиатурные пользователи не могут прокрутить боковые столбцы на планшете. Найдите причины и предложите решение."),
      ],
      starter: {
        lang: "html",
        code: `
          <div class="wrap" style="overflow:auto">
            <table class="orders">
              <thead><tr><th>№</th><th>Клиент</th><th>Сумма</th></tr></thead>
              <tbody><tr><td data-label="№">1042</td><td data-label="Клиент">Анна</td><td data-label="Сумма">12 490</td></tr></tbody>
            </table>
          </div>
          <style>
            @media (max-width: 600px) {
              .orders, .orders thead, .orders tbody, .orders tr, .orders td { display: block; }
              .orders thead { display: none; }
              .orders td::before { content: attr(data-label); font-weight: 700; }
            }
          </style>
        `,
      },
      hints: ["Что делает `display: block` с ролями таблицы?", "Куда уходят заголовки при `thead { display: none }`?", "Что нужно контейнеру `overflow:auto` для клавиатуры?"],
      checks: ["Названа потеря табличной семантики", "Предложен прокручиваемый именованный контейнер с `tabindex`", "Заголовки — `th` с `scope`, добавлен `caption`"],
      solution: [
        ul(
          "**`display: block` на частях таблицы** — браузеры могут перестать строить табличные роли (`table`, `row`, `cell`): таблица не объявляется.",
          "**`thead { display: none }`** — заголовки пропадают для всех, включая программу чтения; подписи из `::before` — CSS-контент, озвучивается непоследовательно.",
          "**Контейнер `overflow:auto` без `tabindex` и имени** — клавиатурный пользователь не может его прокрутить (в части браузеров), а программа чтения не понимает, что это.",
          "**Нет `caption` и `scope`.**",
        ),
        code(
          "html",
          `
          <div class="table-scroll" role="region" aria-labelledby="o-cap" tabindex="0">
            <table class="orders">
              <caption id="o-cap">Заказы</caption>
              <thead><tr><th scope="col">№</th><th scope="col">Клиент</th><th scope="col">Сумма, ₽</th></tr></thead>
              <tbody><tr><th scope="row">1042</th><td>Анна</td><td>12&nbsp;490</td></tr></tbody>
            </table>
          </div>
          <style>
            .table-scroll { overflow-x: auto; }
            .orders { min-inline-size: 32rem; border-collapse: collapse; }
          </style>
          `,
        ),
        note("Если дизайн строго требует «карточек» на телефоне — используйте отдельную разметку (список карточек) для узких экранов и таблицу для широких, переключая их стилями с `hidden`/`display: none` у **неиспользуемого** варианта, либо восстановите роли `table`/`row`/`cell` и обязательно проверьте на реальных программах чтения."),
      ],
    }),
  ],

  challenge: {
    id: "html.tables-accessibility.challenge",
    title: "Отчётная таблица на 6 000 строк с сортировкой и выбором",
    scenario: [
      p("Административная панель показывает таблицу заказов (около 6 000 строк): столбцы «Дата», «Клиент», «Статус» (цветной индикатор), «Сумма», «Действия»; сортировка по трём столбцам, выбор строк, постраничная загрузка по 50 строк."),
      p("Спроектируйте доступное и адаптивное решение: структура таблицы, пагинация и объявление состояний, обработка статусов без цвета, клавиатурное управление, поведение на телефоне, проверка."),
    ],
    requirements: [
      "Структура: `caption` с текущей выборкой, `scope`, `aria-sort`",
      "Статусы — текстом (цвет только дополняет)",
      "Выбор строк — настоящие `checkbox` с понятными именами",
      "Постраничная навигация и сообщение о смене страницы",
      "Адаптивность без потери семантики",
    ],
    constraints: [
      "Нельзя полагаться на цвет как единственный признак",
      "Нельзя использовать `display` не табличных значений на частях таблицы",
      "Все действия — клавиатурой",
    ],
    acceptance: [
      "`caption` содержит «показано 51–100 из 6 000»",
      "Кнопки в заголовках сортировки, одна `aria-sort` у активного столбца",
      "Страница меняется — live-регион объявляет «Страница 2 из 120»",
      "Горизонтальная прокрутка — в именованном контейнере с `tabindex`",
    ],
    hints: [
      "Как будет объявляться смена страницы?",
      "Какой текст у `th` столбца «Действия»?",
      "Как сделать понятным имя чекбокса в строке?",
    ],
    solution: [
      code(
        "html",
        `
        <p id="live" class="visually-hidden" role="status"></p>

        <div class="table-scroll" role="region" aria-labelledby="ord-cap" tabindex="0">
          <table>
            <caption id="ord-cap">Заказы: показано 51–100 из 6 000</caption>
            <thead>
              <tr>
                <th scope="col"><input type="checkbox" aria-label="Выбрать все заказы на странице"></th>
                <th scope="col" aria-sort="descending"><button type="button">Дата</button></th>
                <th scope="col">Клиент</th>
                <th scope="col" aria-sort="none"><button type="button">Статус</button></th>
                <th scope="col" aria-sort="none"><button type="button">Сумма, ₽</button></th>
                <th scope="col"><span class="visually-hidden">Действия</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox" aria-label="Выбрать заказ 1042"></td>
                <th scope="row"><time datetime="2026-03-14">14 марта</time></th>
                <td>Анна Соколова</td>
                <td><span class="badge badge--ok">Оплачен</span></td>
                <td class="num">12&nbsp;490</td>
                <td><a href="/orders/1042">Открыть<span class="visually-hidden"> заказ 1042</span></a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav aria-label="Страницы заказов">
          <ul>
            <li><a href="?page=1" rel="prev">Назад</a></li>
            <li><a href="?page=2" aria-current="page" aria-label="Страница 2">2</a></li>
            <li><a href="?page=3" rel="next">Вперёд</a></li>
          </ul>
        </nav>
        `,
        { lineNumbers: true, collapsed: true },
      ),
      ul(
        "**Пагинация на сервере** (ссылки `?page=N`) — каждая страница полноценна без JavaScript; при динамической загрузке — `role=\"status\"` сообщает «Страница 2 из 120, показано 51–100».",
        "**Статус** — текст («Оплачен», «Отменён») + цвет/иконка как дополнение: смысл не зависит от цвета.",
        "**Выбор** — `<input type=\"checkbox\">` с `aria-label` «Выбрать заказ N»; массовый чекбокс в шапке; `aria-selected` не нужен (это не grid).",
        "**Адаптивность:** прокручиваемый контейнер; важные столбцы («Дата», «Сумма») закрепляются `position: sticky`; для узких экранов опционально — переключатель «Компактный вид» (скрывает **редко нужные** столбцы с возможностью вернуть).",
        "**Виртуализация не нужна** при пагинации по 50 строк; при бесконечной прокрутке — `aria-rowcount`/`aria-rowindex`.",
        "**Проверка:** NVDA/JAWS (Ctrl+Alt+стрелки), VoiceOver (macOS+iOS), клавиатура (Tab → контейнер, сортировка Enter), масштаб 200–400%, автоматические проверки axe (`th-has-data-cells`, `scope-attr-valid`, `aria-allowed-attr`).",
      ),
    ],
  },

  interview: [
    iq("html.tables-accessibility.i1", "basic", "Зачем нужен атрибут `scope`?", [
      p("Он указывает, к какому набору ячеек относится заголовок `th`: столбцу (`col`), строке (`row`), группе столбцов (`colgroup`) или строк (`rowgroup`). По нему программы чтения при чтении ячейки озвучивают связанные заголовки."),
    ]),
    iq("html.tables-accessibility.i2", "basic", "Что такое `caption` и чем он лучше отдельного заголовка рядом?", [
      p("`caption` — название самой таблицы и её доступное имя: программа чтения объявляет его при входе в таблицу. Отдельный заголовок структурно полезен, но не связан с таблицей как с объектом."),
    ]),
    iq("html.tables-accessibility.i3", "intermediate", "Когда нужны `headers` и `id` вместо `scope`?", [
      p("Для нерегулярных и многоуровневых таблиц, где `scope` не выражает связь однозначно (пересекающиеся группы, объединённые ячейки в неочевидных местах). Но этот механизм трудоёмок и хрупок — сначала стоит упростить таблицу."),
    ]),
    iq("html.tables-accessibility.i4", "intermediate", "Как сделать широкую таблицу доступной на мобильном экране?", [
      p("Обернуть в прокручиваемый контейнер (`overflow-x: auto`) с именем (`role=\"region\"` + `aria-labelledby`) и фокусом (`tabindex=\"0\"`). Это сохраняет семантику таблицы и все данные. Альтернативы (скрытие столбцов, «карточки») требуют осторожности: можно потерять данные или роли."),
    ]),
    iq("html.tables-accessibility.i5", "intermediate", "Как правильно реализовать сортировку столбцов?", [
      p("В `th` — `<button>` (фокус, клавиатура), `aria-sort=\"ascending|descending\"` у активного столбца и `none` у остальных, сообщение о результате в live-регионе (`role=\"status\"`). Сортировать можно на клиенте или сервером (ссылки)."),
    ]),
    iq("html.tables-accessibility.i6", "advanced", "Почему «таблица-карточки» через `display: block` — рискованное решение?", [
      p("В ряде браузеров смена `display` у `table`, `tr`, `td` снимает табличную семантику в дереве доступности. Шапка скрывается, а подписи берутся из CSS-контента (`::before`), который озвучивается непоследовательно. Если такой подход необходим, нужно восстановить роли и проверить на целевых программах чтения; безопаснее — отдельная разметка для мобильного вида или прокрутка."),
    ]),
    iq("html.tables-accessibility.i7", "engineering", "Как вы построите проверку доступности таблиц в CI?", [
      ul(
        "axe-правила: `td-headers-attr`, `th-has-data-cells`, `scope-attr-valid`, `table-duplicate-name`, `aria-required-children`.",
        "Линтер компонента: `caption` обязателен, `th` с `scope`, пустые `th` запрещены.",
        "Снимки дерева доступности для ключевых таблиц.",
        "Ручной прогон с программой чтения для эталонных таблиц в дизайн-системе.",
      ),
    ]),
    iq("html.tables-accessibility.i8", "debugging", "Пользователь программы чтения жалуется, что в таблице «не слышно, какой столбец». Что проверите?", [
      ol(
        "Есть ли `th` с `scope=\"col\"` и корректно ли заполнены.",
        "Не заменены ли заголовки на `td` с жирным шрифтом.",
        "Не сломана ли семантика CSS (`display`).",
        "Нет ли пустых `th`; не скрыт ли `thead` через `display: none`.",
        "Соответствует ли таблица простой модели; не нужна ли `headers`.",
      ),
    ]),
  ],

  exam: [
    mcq("html.tables-accessibility.e1", "foundation", "Какой атрибут связывает ячейку данных с конкретными заголовками по `id`?", ["`scope`", "`headers`", "`for`", "`aria-labelledby`"], 1, "`headers` перечисляет `id` заголовков, относящихся к ячейке."),
    mcq("html.tables-accessibility.e2", "foundation", "Что указывает `aria-sort=\"ascending\"`?", ["Столбец отсортирован по возрастанию", "Столбец нельзя сортировать", "Столбец скрыт", "Столбец числовой"], 0, "Атрибут сообщает текущее состояние сортировки столбца."),
    mcq("html.tables-accessibility.e3", "intermediate", "Какое решение сохраняет семантику таблицы на узком экране?", ["`display: block` для `td`", "Прокручиваемая обёртка с `overflow-x: auto`", "Скрыть `thead` через `display: none`", "Заменить `table` на `div`"], 1, "Прокрутка не меняет структуру: таблица остаётся таблицей."),
    mcq("html.tables-accessibility.e4", "intermediate", "Что нужно прокручиваемой обёртке для клавиатурных пользователей и программ чтения?", ["Ничего", "`tabindex=\"0\"` и доступное имя (например, `role=\"region\"` + `aria-labelledby`)", "`aria-hidden=\"true\"`", "`display: contents`"], 1, "Фокусируемость позволяет прокручивать содержимое клавишами, имя объясняет назначение области."),
    mcq("html.tables-accessibility.e5", "intermediate", "Выберите все верные утверждения о заголовках-кнопках сортировки.", ["Кнопка находится внутри `th`", "`aria-sort` ставят на все столбцы одновременно в `ascending`", "Активный столбец имеет `ascending` или `descending`", "Результат сортировки лучше сообщить в live-регионе"], [0, 2, 3], "Активным может быть только один столбец; остальные — `none`."),
    mcq("html.tables-accessibility.e6", "advanced", "Что делает `aria-rowcount` у таблицы?", ["Скрывает лишние строки", "Сообщает реальное число строк при виртуализации", "Ограничивает число строк", "Включает нумерацию"], 1, "Когда в DOM лишь часть строк, `aria-rowcount` и `aria-rowindex` сообщают программе чтения реальный размер таблицы."),
    open("html.tables-accessibility.e7", "advanced", "Почему лучше разделить сложную таблицу на несколько простых, чем описывать её через `headers`? Приведите аргументы и пример.", [
      ul(
        "**Надёжность озвучивания:** простые таблицы с `scope` поддерживаются всеми связками; сложные с `headers` — разными программами чтения по-разному.",
        "**Поддерживаемость:** `headers` требует вручную поддерживать `id` на каждой ячейке; любое изменение таблицы — риск рассинхрона.",
        "**Понятность:** пользователю проще воспринять две таблицы с ясными заголовками, чем одну с многоуровневыми объединениями.",
        "**Адаптивность:** простые таблицы проще прокручивать и перестраивать.",
      ),
      p("Пример: прайс «тарифы × (цена в месяц/в год) × (регионы)» разделить на таблицу цен и таблицу региональных коэффициентов."),
    ], ["Названы надёжность и поддерживаемость", "Названо превосходство простой модели для пользователя", "Приведён пример разделения"], { format: "architecture" }),
  ],

  mastery: [
    mcq("html.tables-accessibility.m1", "intermediate", "Какой из столбцов «Действия» (кнопки) оформлен корректно?", ["`<th></th>`", "`<th scope=\"col\"><span class=\"visually-hidden\">Действия</span></th>`", "`<td>Действия</td>`", "`<th aria-hidden=\"true\">Действия</th>`"], 1, "Столбцу нужно название: визуально скрытый текст озвучивается программой чтения."),
    mcq("html.tables-accessibility.m2", "advanced", "Что произойдёт при `thead { display: none }` для программ чтения?", ["Ничего", "Заголовки столбцов исчезнут из дерева доступности", "Заголовки станут видимы только программам чтения", "Таблица станет списком"], 1, "`display: none` убирает элемент из дерева доступности, связи с заголовками теряются."),
    mcq("html.tables-accessibility.m3", "advanced", "Как правильно показать статус заказа в таблице?", ["Красным/зелёным цветом ячейки", "Текстом («Оплачен», «Отменён») с цветом как дополнением", "Только иконкой без `alt`", "Только `title`"], 1, "Цвет не должен быть единственным признаком (WCAG 1.4.1)."),
    open("html.tables-accessibility.m4", "advanced", "Подготовьте чек-лист из 8 пунктов для ревью компонента «таблица данных» в дизайн-системе. Отметьте, какие пункты проверяются автоматически.", [
      ol(
        "У таблицы есть `caption`. *Автоматически.*",
        "Заголовки — `th` с корректным `scope` (или `headers`). *Автоматически.*",
        "Нет пустых `th`. *Автоматически.*",
        "Широкая таблица в именованном прокручиваемом контейнере с `tabindex`. *Ревью + автоматически (частично).*",
        "Сортировка: кнопка в `th`, `aria-sort`, live-сообщение. *Ревью/e2e.*",
        "Статусы и ошибки передаются не только цветом. *Ревью + контраст автоматически.*",
        "`display` частей таблицы не менялся (семантика сохранена). *Ревью/e2e в программе чтения.*",
        "Проверка программой чтения (NVDA/VoiceOver) для эталонных примеров. *Ручная.*",
      ),
    ], ["Восемь осмысленных пунктов", "Разделены автоматизируемые и ручные", "Покрыты заголовки, адаптивность, сортировку и цвет"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.tables-accessibility.f1", front: "Что делает `scope`?", back: "Определяет охват `th`: `col`, `row`, `colgroup`, `rowgroup` — для связи с данными." },
    { id: "html.tables-accessibility.f2", front: "Когда `headers`?", back: "Сложные нерегулярные таблицы. Трудоёмко и хрупко — сначала упростить." },
    { id: "html.tables-accessibility.f3", front: "Адаптивная таблица?", back: "Прокручиваемая обёртка: `overflow-x:auto` + `role=region` + `aria-labelledby` + `tabindex=0`." },
    { id: "html.tables-accessibility.f4", front: "Сортировка в таблице?", back: "Кнопка в `th`, `aria-sort` на активном столбце, сообщение в live-регионе." },
    { id: "html.tables-accessibility.f5", front: "Почему `display:block` на tr/td опасен?", back: "Может снять табличную семантику; заголовки теряются; CSS-подписи не надёжны." },
    { id: "html.tables-accessibility.f6", front: "Статус без цвета?", back: "Текст/иконка с названием; цвет — дополнение (WCAG 1.4.1)." },
  ],

  sources: [
    { title: "W3C WAI: Tables Concepts", url: "https://www.w3.org/WAI/tutorials/tables/", publisher: "W3C" },
    { title: "HTML Living Standard — Table model / header cells", url: "https://html.spec.whatwg.org/multipage/tables.html#header-and-data-cell-semantics", publisher: "WHATWG" },
    { title: "WAI-ARIA Authoring Practices — Table pattern", url: "https://www.w3.org/WAI/ARIA/apg/patterns/table/", publisher: "W3C" },
    { title: "WCAG 2.2 — 1.4.10 Reflow", url: "https://www.w3.org/TR/WCAG22/#reflow", publisher: "W3C" },
  ],
};
