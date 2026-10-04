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

export const aria: Topic = {
  id: "html.aria",
  slug: "aria",
  domain: "html",
  module: "a11y",
  title: "ARIA: роли, состояния и свойства",
  titleEn: "WAI-ARIA: roles, states, properties, live regions and the five rules",
  summary:
    "ARIA — это словарь, который позволяет сообщить вспомогательным технологиям то, что нельзя выразить нативным HTML. Он ничего не «включает» в поведении: ARIA — обещание, которое разработчик обязан выполнить сам. Тема учит пяти правилам ARIA, ключевым атрибутам и построению простых паттернов.",
  minutes: 60,
  prerequisites: ["html.a11y-fundamentals", "html.landmarks", "html.form-controls"],
  tags: ["ARIA", "WAI-ARIA", "role", "aria-label", "aria-labelledby", "aria-describedby", "aria-expanded", "aria-controls", "aria-live", "role=status", "role=alert", "aria-hidden", "aria-current", "tabs", "disclosure", "dialog", "APG"],
  keyConcepts: [
    { term: "ARIA только меняет дерево доступности", text: "Атрибуты `role` и `aria-*` не добавляют поведения, фокуса или стилей — только **сообщают** информацию. Клавиатуру и состояния реализует разработчик." },
    { term: "Пять правил ARIA", text: "Нативный элемент лучше ARIA; не менять нативную семантику; всё интерактивное — с клавиатуры; не скрывать фокусируемое; у интерактивного — имя." },
    { term: "Роль, свойство, состояние", text: "**Роль** — что это; **свойство** — характеристика (`aria-label`); **состояние** — то, что меняется (`aria-expanded`)." },
    { term: "Живые области", text: "`role=\"status\"`, `role=\"alert\"`, `aria-live` — объявление динамических изменений без перевода фокуса. Область должна существовать **до** обновления." },
    { term: "Плохой ARIA хуже, чем никакого", text: "Неверная роль или забытое состояние вводят пользователя в заблуждение сильнее, чем отсутствие атрибута." },
  ],
  sections: [
    section("definition", [
      def("WAI-ARIA", "Accessible Rich Internet Applications — спецификация W3C со словарём ролей, состояний и свойств, позволяющих описать сложные интерфейсные компоненты (вкладки, меню, деревья, диалоги) так, чтобы вспомогательные технологии поняли их назначение и текущее состояние.", "WAI-ARIA"),
      def("Роль (role)", "Атрибут, который объявляет, **чем является** элемент: `button`, `tab`, `dialog`, `status`, `navigation`… Роль заменяет нативную семантику в дереве доступности.", "role"),
      def("Состояния и свойства (aria-*)", "Атрибуты `aria-*`, описывающие характеристики элемента. **Состояния** меняются в ходе работы (`aria-expanded`, `aria-checked`, `aria-selected`, `aria-busy`), **свойства** более устойчивы (`aria-label`, `aria-controls`, `aria-haspopup`).", "states and properties"),
    ]),

    section("why", [
      h("Проблема: HTML описывает документы, а не приложения"),
      p("Нативный HTML знает кнопки, ссылки, поля, списки, таблицы. Но у него нет вкладок, деревьев, меню действий, комбобоксов с подсказками, уведомлений и динамических областей. Раньше такие компоненты строили из `div`, и для вспомогательных технологий они оставались набором безликих блоков."),
      p("ARIA появилась, чтобы **описать** эти компоненты: «это вкладка, она выбрана, управляет панелью №2». Теперь скринридер объявляет «вкладка 2 из 3, выбрана», хотя в DOM — `<div>`."),
      h("Проблема: ARIA легко использовать неправильно"),
      p("Проверки больших сайтов (например, исследование WebAIM Million) стабильно показывают: страницы с ARIA в среднем содержат **больше** ошибок доступности, чем без неё. Причина — ARIA даёт обещание, а выполнять его нужно самому: клавиатуру, фокус, состояния."),
      insight("Правильная последовательность решений: (1) нативный элемент → (2) нативный элемент + атрибут ARIA для недостающего состояния → (3) ARIA-виджет по образцу APG. Сразу «рисовать» виджет из `div` — крайний случай."),
    ]),

    section("mental-model", [
      p("ARIA — это **этикетки на упаковках**: они сообщают, что внутри, но не меняют содержимого. Если на коробке написано «хрупкое: стекло», а внутри кирпичи, человек будет осторожен зря; если «кирпичи», а внутри стекло, — разобьёт. Роль `button` на `div` обещает, что элемент реагирует на Enter и Space, получает фокус и имеет имя. Выполнить это — задача кода."),
      diagram(
        `
        <div role="button" aria-pressed="false" tabindex="0">Избранное</div>
             │             │                  │
             │             │                  └─ фокус: НУЖНО ДОБАВИТЬ САМОМУ
             │             └─ состояние: нужно обновлять скриптом
             └─ роль: скринридер скажет «кнопка-переключатель»

        обещано дереву доступности   ≠   реализовано поведение
        `,
        "ARIA сообщает, но ничего не делает",
      ),
      table(
        ["Вы хотите…", "Используйте"],
        [
          ["Кнопку, ссылку, поле, флажок, список, таблицу", "Нативный элемент"],
          ["Развернуть/свернуть блок", "`<details>` или `<button aria-expanded>`"],
          ["Диалог", "`<dialog>`"],
          ["Сообщить об изменении без смены фокуса", "`role=\"status\"` / `role=\"alert\"`"],
          ["Назвать элемент без видимого текста", "`aria-label` или `aria-labelledby`"],
          ["Связать подсказку/ошибку с полем", "`aria-describedby`"],
          ["Вкладки, дерево, меню действий, комбобокс", "ARIA-виджет по образцу APG"],
        ],
        "Что выбрать",
      ),
    ]),

    section("technical", [
      h("Пять правил ARIA"),
      ol(
        "**Не используйте ARIA, если нативный элемент или атрибут решает задачу.** `<button>` вместо `<div role=\"button\">`.",
        "**Не меняйте нативную семантику без необходимости.** `<h2 role=\"tab\">` конфликтует; вложите `<button role=\"tab\">` в заголовок.",
        "**Все интерактивные ARIA-элементы должны управляться с клавиатуры** согласно ожиданиям пользователя для этой роли.",
        "**Не применяйте `role=\"presentation\"` и `aria-hidden=\"true\"` к фокусируемым элементам.**",
        "**Все интерактивные элементы должны иметь доступное имя.**",
      ),
      h("Роли: основные категории"),
      table(
        ["Категория", "Примеры", "Комментарий"],
        [
          ["Ориентиры (landmark)", "`banner`, `navigation`, `main`, `complementary`, `contentinfo`, `search`, `form`, `region`", "Чаще всего даются нативными `header`, `nav`, `main`, `aside`, `footer`"],
          ["Структура документа", "`list`, `listitem`, `table`, `heading`, `img`, `figure`", "Нативные эквиваленты есть почти всегда"],
          ["Виджеты", "`button`, `checkbox`, `radio`, `tab`, `tablist`, `tabpanel`, `dialog`, `menu`, `listbox`, `combobox`, `slider`, `tree`", "Требуют клавиатурного поведения по APG"],
          ["Живые области", "`status`, `alert`, `log`, `timer`, `marquee`", "Объявляют динамические обновления"],
          ["Окна", "`dialog`, `alertdialog`", "С управлением фокусом"],
          ["Абстрактные", "`widget`, `landmark`, `range`…", "**Не используются в разметке** — только как основа иерархии"],
        ],
      ),
      h("Ключевые состояния и свойства"),
      table(
        ["Атрибут", "Тип", "Назначение", "Пример"],
        [
          ["`aria-label`", "свойство", "Имя строкой", "`<button aria-label=\"Закрыть\">×</button>`"],
          ["`aria-labelledby`", "свойство", "Имя из других элементов по `id`", "`<section aria-labelledby=\"t\">`"],
          ["`aria-describedby`", "свойство", "Описание/подсказка/ошибка по `id`", "`<input aria-describedby=\"hint\">`"],
          ["`aria-expanded`", "состояние", "Раскрыт ли управляемый блок", "кнопка меню, аккордеон"],
          ["`aria-controls`", "свойство", "Какой элемент управляется", "кнопка → панель"],
          ["`aria-pressed`", "состояние", "Кнопка-переключатель включена", "«Избранное»"],
          ["`aria-selected`", "состояние", "Выбран пункт (tab, option)", "вкладка"],
          ["`aria-checked`", "состояние", "Для `role=checkbox/switch/radio` (не для нативных)", "кастомный переключатель"],
          ["`aria-current`", "состояние", "Текущий элемент в наборе: `page`, `step`, `location`, `date`, `true`", "пункт меню"],
          ["`aria-disabled`", "состояние", "Элемент недоступен, но остаётся фокусируемым", "кнопка отправки"],
          ["`aria-invalid`", "состояние", "Значение недопустимо", "поле с ошибкой"],
          ["`aria-required`", "свойство", "Обязательность для не нативных полей (для нативных — `required`)", "кастомное поле"],
          ["`aria-busy`", "состояние", "Область обновляется", "список при загрузке"],
          ["`aria-hidden`", "состояние", "Скрыть от технологий (не фокусируемое!)", "декоративная иконка"],
          ["`aria-haspopup`", "свойство", "Элемент вызывает всплывающий блок", "кнопка меню"],
          ["`aria-modal`", "свойство", "Диалог модальный (фон недоступен)", "`dialog`"],
          ["`aria-live`", "свойство", "Область, обновления которой объявляются", "`polite`, `assertive`"],
        ],
      ),
      note("Спецификация ARIA запрещает `aria-label`/`aria-labelledby` на ряде ролей без назначения имени: `generic` (обычные `div` и `span`), `paragraph`, `presentation`, `strong`, `emphasis`, `code` и др. На таких элементах имя **игнорируется** или даёт непредсказуемый результат."),
      h("`aria-label`, `aria-labelledby`, `aria-describedby`"),
      ul(
        "**`aria-labelledby`** важнее `aria-label`; указывает на существующие элементы (даже скрытые). Лучше, когда подпись уже есть на экране (заголовок диалога, секции).",
        "**`aria-label`** нужен, когда видимого текста нет (иконка-кнопка) или нужно различить однотипные ориентиры (`nav aria-label=\"Основная\"`).",
        "**`aria-describedby`** — **дополнительное** описание (подсказка формата, сообщение об ошибке). Читается после имени и роли.",
        "Видимая подпись должна **входить в имя** (WCAG 2.5.3): `aria-label=\"Отправка\"` на кнопке «Отправить» ломает голосовое управление.",
      ),
      h("Живые области"),
      table(
        ["Способ", "Вежливость", "Когда"],
        [
          ["`role=\"status\"` (= `aria-live=\"polite\"` + `aria-atomic=\"true\"`)", "Дождётся паузы", "Результат действия: «Сохранено», «Найдено 12 товаров»"],
          ["`role=\"alert\"` (= `aria-live=\"assertive\"` + `aria-atomic=\"true\"`)", "Перебивает", "Срочное: сообщение об ошибке, потеря связи"],
          ["`role=\"log\"`", "Вежливо, по порядку", "Чат, журнал событий"],
          ["`aria-live=\"polite\"`", "Вежливо", "Произвольный контейнер обновлений"],
        ],
      ),
      ul(
        "**Область должна быть в DOM до изменения.** Вставка «с нуля» вместе с текстом часто не озвучивается; сначала вставьте пустой контейнер, затем меняйте текст.",
        "**Обновляйте кратко и по делу;** не заворачивайте в `aria-live` большие блоки — скринридер зачитает всё.",
        "**Не злоупотребляйте `assertive`:** это перебивает речь пользователя.",
        "**Не дублируйте:** если фокус перенесён на сообщение, отдельное объявление не нужно.",
      ),
      h("Типичные паттерны (Authoring Practices Guide)"),
      ul(
        "**Disclosure:** `<button aria-expanded=\"false\" aria-controls=\"id\">` + панель; скрипт меняет `aria-expanded` и `hidden`.",
        "**Tabs:** `tablist` > `tab` (`aria-selected`, `aria-controls`) + `tabpanel` (`aria-labelledby`); «блуждающий» `tabindex` (активная вкладка — `0`, остальные — `-1`), стрелки переключают вкладки, Tab уходит в панель.",
        "**Dialog:** нативный `<dialog>` (рекомендуется) либо `role=\"dialog\"` + `aria-modal=\"true\"` + `aria-labelledby`, захват и возврат фокуса, закрытие по Esc.",
        "**Breadcrumb, navigation:** `nav aria-label` + `aria-current=\"page\"` у текущей ссылки.",
        "**Combobox, tree, menu:** сложные паттерны с десятками правил; берите проверенные библиотеки (Radix, React Aria, Headless UI и др.), не пишите с нуля.",
      ),
      warn("`role=\"menu\"` предназначена для меню **действий** (как в приложениях), а не для навигации по сайту. Для навигации — `<nav>` со списком ссылок (при необходимости с кнопкой раскрытия)."),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <!-- Имя -->
        <button type="button" aria-label="Закрыть уведомление">×</button>
        <section aria-labelledby="orders-title">
          <h2 id="orders-title">Мои заказы</h2>
        </section>

        <!-- Описание и состояние поля -->
        <label for="pw">Пароль</label>
        <input id="pw" type="password" aria-describedby="pw-hint pw-err" aria-invalid="true">
        <p id="pw-hint">Минимум 10 символов</p>
        <p id="pw-err">Слишком короткий пароль</p>

        <!-- Раскрытие -->
        <button type="button" aria-expanded="false" aria-controls="filters">Фильтры</button>
        <div id="filters" hidden>…</div>

        <!-- Навигация -->
        <nav aria-label="Основная">
          <a href="/">Главная</a>
          <a href="/catalog" aria-current="page">Каталог</a>
        </nav>

        <!-- Живая область: контейнер есть заранее -->
        <p id="status" role="status"></p>
        `,
        { lineNumbers: true, filename: "aria-basics.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <div role="tablist" aria-label="Тарифы">
          <button role="tab" id="t1" aria-selected="true"  aria-controls="p1" tabindex="0">Базовый</button>
          <button role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">Про</button>
          <button role="tab" id="t3" aria-selected="false" aria-controls="p3" tabindex="-1">Команда</button>
        </div>
        <div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">Для одного человека: 0 ₽.</div>
        <div role="tabpanel" id="p2" aria-labelledby="t2" tabindex="0" hidden>Для небольших проектов: 490 ₽.</div>
        <div role="tabpanel" id="p3" aria-labelledby="t3" tabindex="0" hidden>Для команд: 1 990 ₽.</div>

        <script>
          const tabs = [...document.querySelectorAll('[role="tab"]')];

          function select(tab) {
            for (const t of tabs) {
              const on = t === tab;
              t.setAttribute("aria-selected", String(on));
              t.tabIndex = on ? 0 : -1;
              document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
            }
            tab.focus();
            console.log("выбрана вкладка:", tab.textContent);
          }

          tabs.forEach((tab, i) => {
            tab.addEventListener("click", () => select(tab));
            tab.addEventListener("keydown", (e) => {
              let next = null;
              if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
              if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
              if (e.key === "Home") next = tabs[0];
              if (e.key === "End") next = tabs[tabs.length - 1];
              if (next) { e.preventDefault(); select(next); }
            });
          });
        </script>
        `,
        { runnable: true },
      ),
      p("Попробуйте клавиатуру: Tab попадает на активную вкладку, стрелки переключают вкладки, Home/End уходят в начало и конец. Роль даёт имена и состояние, а **поведение** — наш скрипт: именно это и имеется в виду под «ARIA — обещание»."),
    ]),

    section("detailed-example", [
      p("Фильтры каталога с раскрытием, результатами и объявлением итога. Кнопка управляет панелью (`aria-expanded`), число найденных товаров озвучивается через `role=\"status\"`, а во время загрузки область помечается `aria-busy`."),
      code(
        "html",
        `
        <button type="button" id="toggle" aria-expanded="false" aria-controls="filters">Фильтры</button>

        <form id="filters" hidden>
          <fieldset>
            <legend>Цвет</legend>
            <label><input type="checkbox" name="color" value="black"> Чёрный</label>
            <label><input type="checkbox" name="color" value="white"> Белый</label>
          </fieldset>
          <button type="submit">Применить</button>
        </form>

        <p id="count" role="status"></p>
        <ul id="results" aria-busy="false"></ul>

        <script>
          const toggle = document.getElementById("toggle");
          const panel = document.getElementById("filters");
          const count = document.getElementById("count");
          const list = document.getElementById("results");

          toggle.addEventListener("click", () => {
            const open = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!open));
            panel.hidden = open;
          });

          panel.addEventListener("submit", async (e) => {
            e.preventDefault();
            list.setAttribute("aria-busy", "true");
            count.textContent = "Загрузка…";
            const items = await fakeSearch(new FormData(panel).getAll("color"));
            list.replaceChildren(...items.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
            list.setAttribute("aria-busy", "false");
            count.textContent = "Найдено товаров: " + items.length;
          });

          function fakeSearch(colors) {
            const all = ["Футболка чёрная", "Футболка белая", "Худи чёрное"];
            const found = all.filter((t) => !colors.length || colors.some((c) => t.toLowerCase().includes(c === "black" ? "чёрн" : "бел")));
            return new Promise((r) => setTimeout(() => r(found), 300));
          }
        </script>
        `,
        { lineNumbers: true, filename: "filters.html", collapsed: true },
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <button type="button" aria-expanded="false" aria-controls="menu" aria-haspopup="true">Профиль</button>
        <ul id="menu" hidden>…</ul>
        <p id="msg" role="status"></p>
        <input id="e" aria-invalid="true" aria-describedby="e-err">
        <p id="e-err">Введите адрес почты</p>
        <a href="/catalog" aria-current="page">Каталог</a>
        `,
        [
          { line: 1, text: "Нативная кнопка (фокус, Enter/Space — бесплатно) плюс **состояние** `aria-expanded`. `aria-controls` связывает её с панелью, `aria-haspopup` предупреждает о всплывающем блоке. Скрипт обязан менять `aria-expanded` вместе с видимостью." },
          { line: 2, text: "Скрытый блок (`hidden`) исключён из дерева доступности и из порядка фокуса, пока не раскрыт. `aria-controls` поддерживается скринридерами неравномерно, поэтому основной сигнал — `aria-expanded`." },
          { line: 3, text: "Контейнер `role=\"status\"` пуст и уже находится в DOM: изменение его текста будет объявлено вежливо — без перевода фокуса." },
          { line: 4, text: "`aria-invalid=\"true\"` сообщает, что значение недопустимо; `aria-describedby` добавляет объяснение. Состояние нужно **снимать** при исправлении." },
          { line: 5, text: "Текст ошибки существует отдельным элементом, на который ссылается `aria-describedby`; виден всем, а не только скринридеру." },
          { line: 6, text: "`aria-current=\"page\"` отмечает текущую страницу в навигации — не только цветом. Значение `page` используют для ссылок на текущую страницу." },
        ],
        "aria-attrs.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Роль", "Браузер определяет роль элемента: из `role` (если допустима для этого элемента) либо из нативной семантики (по таблицам HTML-AAM / ARIA in HTML). `role` **заменяет** нативную роль в дереве, но не отключает нативного поведения: `<a role=\"button\" href>` остаётся ссылкой по поведению."],
          ["Имя и описание", "Вычисляются по алгоритму Accname: `aria-labelledby` → `aria-label` → нативные источники → `title`. Описание — из `aria-describedby`, затем `title`."],
          ["Состояния", "Значения `aria-*` читаются в дереве как есть. Браузер **не проверяет**, соответствуют ли они реальности: `aria-expanded=\"true\"` на закрытом меню — ложь, которую скринридер объявит как истину."],
          ["Живые области", "При изменении содержимого области браузер создаёт событие в дереве доступности; скринридер ставит объявление в очередь (вежливое) или прерывает речь (`assertive`)."],
          ["Конфликты", "Если роль недопустима для элемента или состояние не поддерживается ролью, результат зависит от браузера и скринридера: ошибка не исключение, а «тихий» сбой."],
        ],
        "Как браузер использует ARIA",
      ),
      note("ARIA не добавляет клавиатурного поведения и не стилизует. Состояние в CSS можно использовать через селекторы атрибутов: `[aria-expanded=\"true\"] { … }` — это удобный способ держать визуальное состояние в согласии с семантическим."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Лишние и конфликтующие роли"),
      wrongRight(
        "html",
        {
          code: `
            <button role="button">Сохранить</button>
            <nav role="navigation">…</nav>
            <h2 role="tab">Профиль</h2>
            <a href="/x" role="button">Далее</a>
            <input type="checkbox" role="checkbox" aria-checked="true">
          `,
          note: "Первые два дублируют нативную роль; третий ломает семантику заголовка; четвёртый — ссылка, притворяющаяся кнопкой (поведение ссылки останется); пятый конфликтует с нативным состоянием.",
        },
        {
          code: `
            <button>Сохранить</button>
            <nav>…</nav>
            <h2><button role="tab">Профиль</button></h2>
            <a href="/x">Далее</a>
            <input type="checkbox" checked>
          `,
          note: "Нативная семантика там, где она есть; ARIA — только для недостающего.",
        },
      ),
      h("Ошибка 2. `role=\"button\"` без клавиатуры"),
      wrongRight(
        "html",
        {
          code: `
            <div role="button" onclick="save()">Сохранить</div>
          `,
          note: "Роль обещает кнопку, но нет фокуса и реакции на Enter/Space.",
        },
        {
          code: `
            <button type="button" onclick="save()">Сохранить</button>
          `,
          note: "Нативная кнопка делает всё без обещаний.",
        },
      ),
      h("Ошибка 3. Состояние не обновляется"),
      p("`aria-expanded=\"false\"` в разметке и скрипт, который показывает панель, но не меняет атрибут: скринридер продолжает говорить «свёрнуто». Меняйте состояние **там же**, где меняете видимость."),
      h("Ошибка 4. `aria-label` перекрывает видимый текст"),
      p("Кнопка «Отправить» с `aria-label=\"Отправка формы\"`: пользователь голосового управления говорит «нажми Отправить», а имя другое. Видимый текст должен входить в имя (WCAG 2.5.3)."),
      h("Ошибка 5. `aria-hidden` на фокусируемом"),
      p("Скрытая от скринридера ссылка остаётся достижимой по Tab: фокус «пропадает». Скрывайте блок целиком через `inert`/`hidden`."),
      h("Ошибка 6. Живая область, созданная вместе с текстом"),
      wrongRight(
        "js",
        {
          code: `
            const el = document.createElement("div");
            el.setAttribute("role", "alert");
            el.textContent = "Ошибка сохранения";
            document.body.append(el);
          `,
          note: "Область появляется сразу с текстом: часть скринридеров не объявит (кроме `alert`, который обрабатывается лучше, но ненадёжно).",
        },
        {
          code: `
            // в разметке заранее: <div id="live" role="status"></div>
            document.getElementById("live").textContent = "Ошибка сохранения";
          `,
          note: "Контейнер уже есть, меняется только текст — надёжное объявление.",
        },
      ),
      h("Ошибка 7. Меню навигации как `role=\"menu\"`"),
      p("Роль `menu` вводит режим приложения: скринридер переключается на специальную клавиатурную модель, ожидая стрелок и действий. Для навигации по сайту — `nav` + список ссылок."),
      h("Ошибка 8. Невалидные значения и ссылки"),
      ul(
        "Опечатки: `aria-expaned`, `role=\"buton\"` — тихо игнорируются.",
        "`aria-labelledby` / `aria-describedby` / `aria-controls` на несуществующий `id`.",
        "Дубликаты `id`: ссылка попадёт на первый элемент.",
        "`aria-checked=\"yes\"`: допустимы только `true`, `false`, `mixed`.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**«ARIA везде, чтобы наверняка».** Избыточные атрибуты увеличивают риск конфликтов и ухудшают поддерживаемость.",
        "**Собственные виджеты (меню, комбобокс, дерево, календарь) без APG и тестов скринридером.** Требования к клавиатуре сложнее, чем кажется.",
        "**`aria-live=\"assertive\"` на всё подряд:** ставит объявления в очередь и перебивает чтение.",
        "**`aria-label` на `div`, `span`, `p`** — не поддерживается ролью, имя пропадает.",
        "**`role=\"application\"` на всю страницу:** отключает привычные команды чтения скринридера.",
        "**Сообщения в `title`/`aria-label` вместо видимого текста.**",
        "**Использование ARIA для «починки» плохой структуры** вместо исправления структуры: `role=\"heading\" aria-level=\"2\"` на `div` вместо `<h2>`.",
        "**Скрытие семантики таблицы** `role=\"presentation\"` у настоящих данных, потому что «так нужна вёрстка».",
        "**Отсутствие тестирования:** «в DevTools выглядит правильно» ≠ «скринридер говорит верно».",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Сначала нативный HTML** (`button`, `a`, `details`, `dialog`, `label`, `table`), затем ARIA.",
        "**Все ARIA-виджеты строить по Authoring Practices Guide** и повторять его клавиатурные таблицы.",
        "**Состояние меняйте вместе с видимостью** и храните в одном месте (источник истины — атрибут или данные).",
        "**Для всех интерактивных элементов проверяйте имя** в панели Accessibility.",
        "**Живые области создавайте заранее** и обновляйте кратким текстом; `status` по умолчанию, `alert` — для срочного.",
        "**Помечайте текущее:** `aria-current` в навигации и шагах мастера.",
        "**Связывайте подсказки и ошибки с полем** через `aria-describedby`.",
        "**Используйте ARIA в CSS:** `[aria-expanded=\"true\"]`, `[aria-selected=\"true\"]` — чтобы внешний вид и семантика не расходились.",
        "**Проверяйте автоматикой** (axe: правила `aria-*`) **и вручную** (клавиатура, скринридер).",
        "**Предпочитайте проверенные библиотеки** для сложных виджетов и обновляйте их.",
      ),
    ]),

    section("edge-cases", [
      h("`<ul role=\"list\">`"),
      p("Исторически Safari с VoiceOver не объявлял список, если у `ul` убрали маркеры стилем `list-style: none`. Поэтому для навигационных списков иногда явно добавляют `role=\"list\"`. Поведение менялось от версии к версии — проверяйте в актуальных браузерах и не добавляйте роль «по привычке»."),
      h("`aria-controls`"),
      p("Из скринридеров связь `aria-controls` по-настоящему используют единицы; остальные игнорируют. Не рассчитывайте на неё как на единственный сигнал: состояние (`aria-expanded`) и логика DOM важнее."),
      h("`aria-disabled` и `disabled`"),
      p("`disabled` убирает кнопку из порядка фокуса и делает её недоступной; `aria-disabled=\"true\"` оставляет её фокусируемой, но вы должны **сами** блокировать действие. Второй вариант полезен для кнопок отправки, чтобы пользователь мог дойти до них и услышать причину."),
      h("`aria-label` на ориентирах"),
      p("Два `nav` на странице без имён будут озвучены одинаково. Дайте им различные имена: `aria-label=\"Основная\"`, `aria-label=\"Хлебные крошки\"`. Не добавляйте слово «навигация»: роль уже озвучивается."),
      h("Заголовки и `aria-level`"),
      p("`role=\"heading\" aria-level=\"2\"` на `div` технически создаёт заголовок, но нативный `<h2>` надёжнее: он виден инструментам, поисковикам и режиму чтения."),
      h("`aria-live` и частые обновления"),
      p("Часто обновляющаяся область (таймер, прогресс) превращает речь скринридера в шум. Обновляйте реже (например, при ключевых значениях), для прогресса используйте `<progress>` и объявляйте этапы."),
      h("`aria-owns` и `aria-activedescendant`"),
      p("`aria-owns` меняет дерево доступности, перенаправляя потомков; `aria-activedescendant` указывает активный пункт составного виджета, когда фокус остаётся на контейнере. Оба — для продвинутых случаев (combobox, listbox) и требуют тестирования."),
      h("Состояние и локализация"),
      p("Значения `aria-label`, `aria-description` и `aria-roledescription` — строки, видимые скринридеру: переводите их вместе с интерфейсом и не злоупотребляйте `aria-roledescription` (он может сбить с толку)."),
    ]),

    section("related", [
      ul(
        "[Основы доступности](/learn/html/a11y-fundamentals) — имя, роль, состояние и дерево доступности.",
        "[Клавиатура и фокус](/learn/html/keyboard-focus) — `tabindex`, управление фокусом, диалоги.",
        "[Доступные формы](/learn/html/accessible-forms) — `aria-describedby`, `aria-invalid`, ошибки.",
        "[Ориентиры страницы](/learn/html/landmarks) — нативные эквиваленты ролей-ориентиров.",
        "[Интерактивные элементы](/learn/html/interactive-elements) — `<details>`, `<dialog>`, popover вместо самодельных виджетов.",
        "Из других курсов: **JS** — события клавиатуры, управление фокусом, `MutationObserver`; **CSS** — селекторы по атрибутам `[aria-*]`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Виджет из `div`",
          code: `
            <div class="tab active" onclick="show(1)">Профиль</div>
            <div class="tab" onclick="show(2)">Заказы</div>
            <div class="panel" id="p1">…</div>
            <div class="panel" id="p2" style="display:none">…</div>
            <div class="toast">Сохранено</div>
          `,
          note: "Нет ролей, имён и состояний; нет фокуса и клавиатуры; уведомление не объявляется.",
        },
        {
          title: "ARIA по образцу",
          code: `
            <div role="tablist" aria-label="Раздел кабинета">
              <button role="tab" id="t1" aria-selected="true"  aria-controls="p1" tabindex="0">Профиль</button>
              <button role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">Заказы</button>
            </div>
            <div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">…</div>
            <div role="tabpanel" id="p2" aria-labelledby="t2" tabindex="0" hidden>…</div>
            <p role="status" id="toast"></p>
          `,
          note: "Роли и состояния, управляемые вкладки с блуждающим `tabindex`, нативные кнопки и заранее созданная живая область.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.aria.ex1",
      title: "Верно или избыточно?",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждого фрагмента скажите: корректно, избыточно или ошибочно, и почему. Предложите исправление."),
        ol(
          "`<button role=\"button\">Сохранить</button>`",
          "`<div role=\"button\" onclick=\"go()\">Далее</div>`",
          "`<span aria-label=\"Предупреждение\">!</span>`",
          "`<a href=\"/help\" aria-hidden=\"true\">Помощь</a>`",
          "`<p role=\"status\" id=\"s\"></p>` (в разметке заранее), затем скрипт пишет в него «Сохранено»",
          "`<nav aria-label=\"Основная\"><ul role=\"menu\">…</ul></nav>`",
          "`<input type=\"checkbox\" id=\"a\" aria-checked=\"true\">`",
          "`<button aria-expanded=\"false\" aria-controls=\"nav\">Меню</button>` при скрипте, который показывает `nav`, но не меняет атрибут",
        ),
      ],
      hints: ["Правило №1: нативное лучше ARIA.", "Что обещает роль и кто выполняет обещание?", "`aria-label` на `span` поддерживается?"],
      checks: ["Распознаны избыточные и ошибочные пары", "Названа причина для каждого", "Предложено нативное решение"],
      solution: [
        ol(
          "**Избыточно:** `button` уже имеет роль кнопки — убрать `role`.",
          "**Ошибочно:** нет фокуса и клавиатуры → `<button type=\"button\">`.",
          "**Ошибочно:** `aria-label` на `span` (роль generic) не поддерживается. Использовать видимый текст «Предупреждение» или `role=\"img\"` с `aria-label`, если это значок.",
          "**Ошибочно:** фокусируемая ссылка скрыта от скринридера. Убрать `aria-hidden` или скрыть ссылку полностью (`hidden`).",
          "**Корректно:** контейнер создан заранее, меняется только текст.",
          "**Ошибочно:** `role=\"menu\"` для навигации — переключает скринридер в режим приложения. Оставить список ссылок.",
          "**Ошибочно:** `aria-checked` конфликтует с нативным состоянием `checked`; убрать.",
          "**Ошибочно:** состояние не обновляется: скринридер продолжает говорить «свёрнуто». Менять `aria-expanded` вместе с видимостью.",
        ),
      ],
    }),
    exercise({
      id: "html.aria.ex2",
      title: "Аккордеон на кнопках",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сделайте аккордеон из трёх вопросов-ответов (FAQ): каждый заголовок — кнопка, раскрывающая панель. Нужны `aria-expanded`, `aria-controls`, правильные заголовки и работа с клавиатуры. Затем сравните с решением на `<details>`/`<summary>` и скажите, что лучше и почему."),
      ],
      hints: ["Внутри `h3` лежит `button`.", "Панель скрывается атрибутом `hidden`.", "Что даёт `<details>` бесплатно?"],
      checks: ["Нативные `button` внутри заголовков", "`aria-expanded` меняется вместе с `hidden`", "Сравнение с `details`"],
      solution: [
        code(
          "html",
          `
          <div class="faq">
            <h3><button type="button" aria-expanded="false" aria-controls="a1" id="q1">Как оформить возврат?</button></h3>
            <div id="a1" role="region" aria-labelledby="q1" hidden>
              <p>Возврат оформляется в течение 14 дней…</p>
            </div>

            <h3><button type="button" aria-expanded="false" aria-controls="a2" id="q2">Сколько идёт доставка?</button></h3>
            <div id="a2" role="region" aria-labelledby="q2" hidden>
              <p>В среднем 2–5 рабочих дней.</p>
            </div>
          </div>

          <script>
            document.querySelectorAll(".faq button[aria-expanded]").forEach((btn) => {
              btn.addEventListener("click", () => {
                const open = btn.getAttribute("aria-expanded") === "true";
                btn.setAttribute("aria-expanded", String(!open));
                document.getElementById(btn.getAttribute("aria-controls")).hidden = open;
              });
            });
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        code(
          "html",
          `
          <details>
            <summary>Как оформить возврат?</summary>
            <p>Возврат оформляется в течение 14 дней…</p>
          </details>
          `,
        ),
        ul(
          "**`<details>`** — меньше кода, роль и состояние, клавиатура и поиск по странице (в браузерах) работают без скриптов. Подходит почти всегда.",
          "**Кнопка + `aria-expanded`** нужна, когда требуется нестандартное поведение: анимация высоты, закрытие остальных (исключительный режим), общее управление «развернуть всё».",
          "`role=\"region\"` на панели допустим, но не стоит ставить его на каждую (много ориентиров — шум); для коротких панелей можно обойтись без роли.",
        ),
      ],
    }),
    exercise({
      id: "html.aria.ex3",
      title: "Сломанный виджет вкладок",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Скринридер читает «Профиль, Заказы» как обычные блоки текста, Tab проходит по каждой вкладке, стрелки не работают, выбранная вкладка не объявляется, а сообщение «Сохранено» не озвучивается. Найдите ошибки и исправьте."),
      ],
      starter: {
        lang: "html",
        code: `
          <div class="tabs">
            <div class="tab on" role="tab" onclick="show(1)">Профиль</div>
            <div class="tab" role="tab" onclick="show(2)">Заказы</div>
          </div>
          <div id="p1" role="tabpanel" aria-labelledby="t1">…</div>
          <div id="p2" role="tabpanel" aria-labelledby="t2" style="display:none">…</div>
          <script>
            function show(n) {
              p1.style.display = n === 1 ? "" : "none";
              p2.style.display = n === 2 ? "" : "none";
              const t = document.createElement("div");
              t.setAttribute("aria-live", "polite");
              t.textContent = "Сохранено";
              document.body.append(t);
            }
          </script>
        `,
      },
      hints: ["Где `tablist`?", "Что должно получать фокус? Какой `tabindex`?", "Откуда имя у панели? Есть ли `id=\"t1\"`?", "Когда создаётся живая область?"],
      checks: ["`tablist` и нативные кнопки", "`aria-selected` и блуждающий `tabindex`", "Клавиши ←/→/Home/End", "Живая область создана заранее"],
      solution: [
        ul(
          "**Нет `tablist`:** вкладки должны быть внутри контейнера с `role=\"tablist\"` и именем.",
          "**`div` вместо `button`:** нет фокуса и Enter/Space → `<button role=\"tab\">`.",
          "**Нет `aria-selected`** и `aria-controls`; активная вкладка не объявляется.",
          "**`aria-labelledby=\"t1\"` ссылается на несуществующий `id`** → у вкладок должны быть `id`.",
          "**Нет клавиш стрелок** и «блуждающего» `tabindex` (активная — 0, остальные — −1).",
          "**Живая область** создаётся одновременно с текстом → создать `role=\"status\"` заранее.",
          "**`style.display`** вместо `hidden` — функционально эквивалентно, но атрибут `hidden` проще и согласуется с состоянием.",
        ),
        code(
          "html",
          `
          <div role="tablist" aria-label="Раздел кабинета">
            <button role="tab" id="t1" aria-selected="true"  aria-controls="p1" tabindex="0">Профиль</button>
            <button role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">Заказы</button>
          </div>
          <div id="p1" role="tabpanel" aria-labelledby="t1" tabindex="0">…</div>
          <div id="p2" role="tabpanel" aria-labelledby="t2" tabindex="0" hidden>…</div>
          <p id="live" role="status"></p>

          <script>
            const tabs = [...document.querySelectorAll('[role="tab"]')];
            function select(tab) {
              for (const t of tabs) {
                const on = t === tab;
                t.setAttribute("aria-selected", String(on));
                t.tabIndex = on ? 0 : -1;
                document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
              }
              tab.focus();
            }
            tabs.forEach((tab, i) => {
              tab.addEventListener("click", () => select(tab));
              tab.addEventListener("keydown", (e) => {
                const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
                if (step) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length]); }
                if (e.key === "Home") { e.preventDefault(); select(tabs[0]); }
                if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1]); }
              });
            });
            // сообщение: document.getElementById("live").textContent = "Сохранено";
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.aria.challenge",
    title: "Уведомления, поиск и фильтры без потери контекста",
    scenario: [
      p("В интерфейсе каталога появляются динамические сообщения: «Товар добавлен в корзину», «Найдено 24 товара», «Не удалось сохранить», индикатор загрузки результатов, раскрывающаяся панель фильтров и всплывающее меню профиля. Пользователи скринридеров жалуются, что «ничего не слышно» или, наоборот, «всё говорит одновременно». Команда уже хотела поставить `aria-live=\"assertive\"` на всё приложение."),
      p("Спроектируйте разметку и логику объявлений: какие области и роли нужны, как избежать шума, как управлять фокусом при ошибках и загрузке, как оформить раскрывающиеся блоки и меню."),
    ],
    requirements: [
      "Схема: какие сообщения `status`, какие `alert`, какие вообще не объявляются",
      "Разметка фильтров (раскрытие), результатов (загрузка, число найденных) и меню профиля",
      "Правила обновления живых областей (когда создаются, как обновляются, дебаунс)",
      "Решение по фокусу: когда его переносят, а когда нет",
    ],
    constraints: [
      "Нельзя ставить `aria-live=\"assertive\"` на контейнер всего приложения",
      "Меню профиля — не `role=\"menu\"` без необходимости",
      "Все элементы управления имеют имя и доступны с клавиатуры",
    ],
    acceptance: [
      "Успехи и обычные результаты — `status`; срочные ошибки — `alert`",
      "Области созданы заранее; изменения текста краткие",
      "Состояния `aria-expanded`, `aria-busy`, `aria-current` согласованы с видимостью",
      "Описан порядок тестирования скринридером",
    ],
    hints: [
      "Что должно прервать пользователя, а что подождёт?",
      "Нужно ли объявлять каждый ввод символа в поиск?",
      "Что делать с фокусом после открытия меню?",
    ],
    solution: [
      table(
        ["Событие", "Механизм", "Почему"],
        [
          ["«Товар добавлен в корзину»", "`role=\"status\"`, текст обновляется", "Подтверждение действия, не срочное"],
          ["«Найдено 24 товара»", "Тот же `status`, **после** завершения загрузки", "Итог обновления; не по каждому символу"],
          ["Загрузка результатов", "`aria-busy=\"true\"` на списке, текст «Загрузка…» в `status`", "Сообщает о состоянии без шума"],
          ["«Не удалось сохранить»", "`role=\"alert\"`", "Срочно и требует реакции"],
          ["Ошибки полей формы", "`aria-describedby` + сводка с переносом фокуса", "Контекст и навигация, а не вещание"],
          ["Обновление цен в списке", "Не объявляется", "Не влияет на решение пользователя; шум"],
        ],
      ),
      code(
        "html",
        `
        <header>
          <nav aria-label="Основная"><a href="/catalog" aria-current="page">Каталог</a> <a href="/cart">Корзина</a></nav>
          <button type="button" id="profile-btn" aria-expanded="false" aria-controls="profile-menu">Профиль</button>
          <div id="profile-menu" hidden>
            <a href="/account">Личный кабинет</a>
            <a href="/orders">Заказы</a>
            <button type="button">Выйти</button>
          </div>
        </header>

        <main>
          <h1>Каталог</h1>

          <button type="button" id="filters-btn" aria-expanded="false" aria-controls="filters">Фильтры</button>
          <form id="filters" hidden>…</form>

          <p id="status" role="status"></p>
          <div id="errors" role="alert"></div>

          <ul id="results" aria-busy="false"></ul>
        </main>
        `,
        { lineNumbers: true, filename: "catalog-live.html", collapsed: true },
      ),
      code(
        "js",
        `
        const status = document.getElementById("status");
        const errors = document.getElementById("errors");
        const results = document.getElementById("results");
        let timer;

        // Обновляем status не чаще, чем раз в 600 мс, и только итоговым текстом
        function announce(text) {
          clearTimeout(timer);
          timer = setTimeout(() => { status.textContent = text; }, 600);
        }

        async function search(query) {
          results.setAttribute("aria-busy", "true");
          announce("Загрузка…");
          try {
            const items = await fetchItems(query);
            render(items);
            announce("Найдено товаров: " + items.length);
          } catch {
            errors.textContent = "Не удалось загрузить результаты. Повторите попытку.";
          } finally {
            results.setAttribute("aria-busy", "false");
          }
        }
        `,
        { lineNumbers: true, filename: "announce.js" },
      ),
      ul(
        "**Фокус:** после открытия меню профиля или панели фильтров фокус остаётся на кнопке (пользователь сам идёт Tab-ом по содержимому), либо переносится на первый пункт — по выбранному паттерну, но единообразно. Закрытие по Esc возвращает фокус на кнопку. Для модального окна фокус переходит внутрь и возвращается после закрытия.",
        "**Объявления:** `status` и `alert` создаются в разметке заранее; тексты короткие («Найдено 24 товара»), с дебаунсом; `alert` — только для ошибок, которые мешают работе.",
        "**Меню профиля:** набор ссылок и кнопок с `aria-expanded` — не `role=\"menu\"`, потому что это не меню приложения с «режимом стрелок».",
        "**Тестирование:** NVDA+Firefox и VoiceOver+Safari: запустить сценарий с клавиатуры, убедиться, что сообщения слышны один раз, в нужном порядке; добавить в CI проверку axe и e2e-тест, проверяющий атрибуты `aria-expanded` и текст `status`.",
      ),
    ],
  },

  interview: [
    iq("html.aria.i1", "basic", "Что делает ARIA и чего она НЕ делает?", [
      p("ARIA меняет информацию в дереве доступности: роль, имя, состояние, свойства. Она **не** добавляет фокус, клавиатурное поведение, стили или функциональность — всё это нужно реализовать самому."),
    ]),
    iq("html.aria.i2", "basic", "Назовите первое правило ARIA.", [
      p("Если нативный элемент или атрибут решает задачу, используйте его, а не ARIA. `<button>` вместо `<div role=\"button\">`."),
    ]),
    iq("html.aria.i3", "intermediate", "Чем `aria-label`, `aria-labelledby` и `aria-describedby` различаются?", [
      ul(
        "`aria-label` — имя строкой, `aria-labelledby` — имя из других элементов по `id` (приоритетнее).",
        "`aria-describedby` — **описание** (подсказка, ошибка), читается после имени и роли.",
        "Имя называет, описание поясняет; видимая подпись должна входить в имя.",
      ),
    ]),
    iq("html.aria.i4", "intermediate", "Когда использовать `role=\"status\"`, а когда `role=\"alert\"`?", [
      p("`status` — вежливое объявление результата действия (дождётся паузы в речи), `alert` — срочное сообщение, которое прерывает речь (ошибка, потеря связи). Область должна существовать в DOM до обновления."),
    ]),
    iq("html.aria.i5", "intermediate", "Что случится, если поставить `aria-hidden=\"true\"` на кнопку?", [
      p("Скринридер её не увидит, но кнопка останется фокусируемой и активируемой с клавиатуры — «призрачный» элемент. Для скрытия используйте `hidden`, `inert` или `display: none`."),
    ]),
    iq("html.aria.i6", "advanced", "Как правильно реализовать вкладки на ARIA?", [
      ul(
        "Контейнер `role=\"tablist\"` с именем, вкладки `role=\"tab\"` (лучше `button`) с `aria-selected` и `aria-controls`, панели `role=\"tabpanel\"` с `aria-labelledby`.",
        "«Блуждающий» `tabindex`: активная вкладка 0, остальные −1; ←/→ переключают, Home/End — крайние вкладки.",
        "Tab из вкладки переводит в панель; панель при необходимости получает `tabindex=\"0\"`.",
        "Следовать паттерну из Authoring Practices Guide и проверять скринридером.",
      ),
    ]),
    iq("html.aria.i7", "engineering", "Команде нужен выпадающий список с поиском (combobox). Писать самим или брать библиотеку?", [
      ul(
        "Паттерн combobox содержит множество клавиатурных и озвучивающих деталей (`aria-activedescendant`, `aria-expanded`, `listbox`, фокус, режимы), которые различаются в скринридерах.",
        "Лучше взять проверенную библиотеку (React Aria, Radix, Headless UI, Ariakit) и протестировать, чем разрабатывать с нуля.",
        "Если нужен собственный — следовать APG, написать тесты и проверить на NVDA, JAWS, VoiceOver, TalkBack.",
        "Для простых случаев подойдут нативный `<select>` или `<input list>` + `<datalist>`.",
      ),
    ]),
    iq("html.aria.i8", "debugging", "Скринридер не озвучивает сообщение «Сохранено», которое появляется после действия. С чего начнёте поиск?", [
      ul(
        "Есть ли область с `role=\"status\"`/`aria-live` в DOM **до** обновления.",
        "Не создаётся ли она вместе с текстом (нужно: пустой контейнер, затем текст).",
        "Не скрыта ли область (`display: none`, `aria-hidden`) и не перекрыта ли другим обновлением.",
        "Не заменяется ли весь контейнер целиком (замена узла сбрасывает область); достаточно менять текст внутри.",
        "Проверить в другом скринридере: поведение различается.",
      ),
    ]),
  ],

  exam: [
    mcq("html.aria.e1", "foundation", "Что делает `aria-expanded=\"true\"`?", ["Раскрывает блок", "Сообщает вспомогательным технологиям, что управляемый блок раскрыт", "Делает кнопку фокусируемой", "Добавляет анимацию"], 1, "ARIA лишь описывает состояние. Видимость блока и обновление атрибута — ответственность разработчика."),
    mcq("html.aria.e2", "foundation", "Какая запись корректна для кнопки закрытия, содержащей только значок «×»?", ["`<button>×</button>`", "`<button aria-label=\"Закрыть\">×</button>`", "`<div role=\"button\">×</div>`", "`<span onclick>×</span>`"], 1, "У кнопки нет видимого текстового имени, поэтому `aria-label` задаёт его; `div` и `span` не интерактивны."),
    mcq("html.aria.e3", "intermediate", "Какая роль подойдёт для сообщения «Сохранено», не прерывающего речь?", ["`alert`", "`status`", "`dialog`", "`log` assertive"], 1, "`status` — вежливая живая область для результатов действий; `alert` прерывает речь."),
    mcq("html.aria.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["Роль `button` на `div` автоматически добавляет реакцию на Enter и Space", "ARIA не добавляет поведения", "`aria-label` на `span` без роли обычно не работает", "Живая область должна существовать до обновления"], [1, 2, 3], "ARIA только описывает; поведение — задача разработчика."),
    mcq("html.aria.e5", "intermediate", "Какое значение допустимо для `aria-checked`?", ["`yes`", "`true`, `false`, `mixed`", "`on`/`off`", "Любая строка"], 1, "Допустимы `true`, `false` и `mixed` (частично); `undefined` означает отсутствие состояния."),
    mcq("html.aria.e6", "advanced", "Что означает 5-е правило ARIA?", ["Все ARIA-атрибуты должны быть на английском", "Все интерактивные элементы должны иметь доступное имя", "Нельзя использовать `aria-live`", "Роли нельзя менять"], 1, "Каждому интерактивному элементу нужно имя; без имени пользователь не знает его назначения."),
    open("html.aria.e7", "intermediate", "Объясните фразу «ARIA — это обещание, а не поведение». Приведите пример `role=\"button\"` на `div` и перечислите, что нужно сделать, чтобы выполнить обещание.", [
      p("Роль сообщает скринридеру, что элемент — кнопка, и пользователь ожидает кнопку: фокус, активацию Enter/Space, имя, состояние. Но браузер ничего из этого не добавляет."),
      ul(
        "`tabindex=\"0\"` — чтобы элемент получал фокус.",
        "Обработчики `keydown` для Enter и Space (Space — на `keyup`), а также `click`.",
        "Доступное имя (текст или `aria-label`) и состояния (`aria-pressed`, `aria-disabled`).",
        "Видимый фокус и стили.",
      ),
      p("Проще и надёжнее использовать `<button>`: всё перечисленное уже есть."),
    ], ["Названо, что ARIA не добавляет поведения", "Перечислены фокус, клавиши, имя, состояние", "Предложен нативный `button`"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.aria.m1", "intermediate", "Что нужно для работы `role=\"status\"`?", ["Ничего, он создаётся вместе с текстом", "Контейнер в DOM до изменения текста", "Только `aria-hidden=\"false\"`", "Фокус на контейнере"], 1, "Изменения объявляются, если область уже существовала; вставка вместе с текстом часто пропускается."),
    mcq("html.aria.m2", "advanced", "Для чего «блуждающий» `tabindex` во вкладках?", ["Чтобы вкладки не получали фокус", "Чтобы Tab попадал в группу один раз, а стрелки перемещали внутри", "Чтобы вкладки менялись местами", "Для анимации"], 1, "Активная вкладка получает `tabindex=0`, остальные — `-1`; Tab входит в группу один раз, внутри перемещаются стрелками."),
    mcq("html.aria.m3", "advanced", "Почему `role=\"menu\"` не подходит для навигации по сайту?", ["Он устарел", "Он включает режим приложения и особую клавиатурную модель", "Он не поддерживается браузерами", "Он требует `aria-live`"], 1, "`menu` предназначена для меню действий в приложении; для навигации — `nav` со списком ссылок."),
    open("html.aria.m4", "advanced", "Аудит показал на странице 120 ARIA-атрибутов и 45 ошибок доступности. Руководитель предлагает «добавить ещё ARIA, чтобы покрыть остальное». Что вы ответите и как вы будете действовать?", [
      ul(
        "Больше ARIA ≠ больше доступности: ошибки часто вызваны самой ARIA (неверные роли, забытые состояния).",
        "Классифицировать ошибки: что можно заменить нативным элементом (кнопки, ссылки, `details`, `dialog`), что — исправить значения и ссылки.",
        "Удалить избыточные и конфликтующие роли, свести виджеты к паттернам APG, добавить недостающие состояния.",
        "Проверить имя, роль и состояние в панели Accessibility; вручную пройти сценарии с клавиатурой и скринридером.",
        "Добавить линтеры и axe в CI, чтобы не регрессировало.",
      ),
    ], ["Названо, что ARIA может создавать ошибки", "Предложена замена на нативное", "Предложены ручные проверки и автоматизация"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.aria.f1", front: "ARIA — это...?", back: "Описание для дерева доступности (роль, имя, состояние); не добавляет поведения и стилей." },
    { id: "html.aria.f2", front: "Пять правил ARIA (кратко)?", back: "Нативное лучше; не менять семантику; клавиатура; не скрывать фокусируемое; у интерактивного — имя." },
    { id: "html.aria.f3", front: "`status` vs `alert`?", back: "`status` — вежливо (polite), `alert` — срочно (assertive). Область создаётся заранее." },
    { id: "html.aria.f4", front: "`aria-label` vs `aria-labelledby` vs `aria-describedby`?", back: "Имя строкой / имя из элементов по id (приоритетнее) / описание (подсказка, ошибка)." },
    { id: "html.aria.f5", front: "`aria-hidden=\"true\"` на фокусируемом?", back: "Ошибка: фокус остаётся, а скринридер элемент не видит. Использовать `hidden`/`inert`." },
    { id: "html.aria.f6", front: "Состояния вкладок?", back: "`tablist` > `tab` (`aria-selected`, `aria-controls`, roving `tabindex`) + `tabpanel` (`aria-labelledby`)." },
  ],

  sources: [
    { title: "Accessible Rich Internet Applications (WAI-ARIA) 1.2", url: "https://www.w3.org/TR/wai-aria-1.2/", publisher: "W3C" },
    { title: "Using ARIA (ARIA in HTML — rules of use)", url: "https://www.w3.org/TR/using-aria/", publisher: "W3C" },
    { title: "ARIA in HTML", url: "https://www.w3.org/TR/html-aria/", publisher: "W3C" },
    { title: "ARIA Authoring Practices Guide (APG)", url: "https://www.w3.org/WAI/ARIA/apg/", publisher: "W3C" },
    { title: "MDN: ARIA", url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA", publisher: "MDN" },
    { title: "WebAIM Million: report on the accessibility of the top 1,000,000 home pages", url: "https://webaim.org/projects/million/", publisher: "Other" },
  ],
};
