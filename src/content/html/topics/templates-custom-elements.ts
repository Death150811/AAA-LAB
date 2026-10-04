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

export const templatesCustomElements: Topic = {
  id: "html.templates-custom-elements",
  slug: "templates-custom-elements",
  domain: "html",
  module: "advanced",
  title: "Шаблоны, slot и Custom Elements",
  titleEn: "template, slot, Shadow DOM and Custom Elements: building reusable components in plain HTML",
  summary:
    "Веб-компоненты — это три стандарта платформы: `<template>` (инертная заготовка), Shadow DOM (инкапсуляция разметки и стилей) и Custom Elements (собственные теги с жизненным циклом). Тема объясняет, как они работают вместе, как делать компоненты доступными, и когда они действительно нужны.",
  minutes: 60,
  prerequisites: ["html.parsing-dom", "html.interactive-elements", "html.aria"],
  tags: ["template", "slot", "Shadow DOM", "Custom Elements", "web components", "customElements.define", "attributeChangedCallback", "connectedCallback", "ElementInternals", "form-associated", "declarative shadow DOM", "::part", ":host", "composed events"],
  keyConcepts: [
    { term: "template", text: "Инертная заготовка: разметка внутри `<template>` не отображается, не загружает ресурсы и не выполняет скрипты, пока её не клонируют в документ." },
    { term: "Shadow DOM", text: "Отдельное поддерево элемента: его разметка и стили **изолированы** от страницы, а наружу выходят через `slot`, CSS-переменные и `::part`." },
    { term: "Custom Element", text: "Свой тег с дефисом в имени (`user-badge`) и классом-наследником `HTMLElement`; браузер вызывает его методы жизненного цикла." },
    { term: "Семантика не создаётся сама", text: "Собственный элемент не имеет роли, фокуса и клавиатуры. Их нужно добавить — или, лучше, **улучшать нативную разметку**." },
    { term: "Прогрессивное улучшение", text: "Хороший компонент работает без JS как обычная разметка и становится удобнее после регистрации." },
  ],
  sections: [
    section("definition", [
      def("<template>", "Элемент, содержимое которого парсится, но **не отображается** и не активируется: скрипты не выполняются, изображения не загружаются, стили не применяются. Содержимое доступно через `template.content` (`DocumentFragment`) и копируется в документ методом `cloneNode(true)`.", "template element"),
      def("Shadow DOM", "Механизм инкапсуляции: к элементу-«хозяину» (host) присоединяется теневое поддерево (`element.attachShadow({ mode })`). Селекторы и стили страницы **не проникают** внутрь, а стили внутри не «утекают» наружу.", "Shadow DOM"),
      def("Custom Element", "Элемент, определённый разработчиком через `customElements.define(\"my-name\", class extends HTMLElement { … })`. Имя содержит дефис. Браузер вызывает методы жизненного цикла: `constructor`, `connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`, `adoptedCallback`.", "custom element"),
      def("<slot>", "Точка вставки внутри теневого дерева: содержимое «светлого» DOM (то, что автор положил между тегами компонента) отображается в слоте. Бывают слот по умолчанию и именованные (`<slot name=\"title\">`).", "slot element"),
    ]),

    section("why", [
      h("Повторное использование без фреймворка"),
      p("Карточка пользователя, бейдж, выбор даты, плеер — одни и те же блоки появляются по всему сайту. Копирование разметки порождает расхождения и баги; CSS-классы начинают конфликтовать; JavaScript привязывается к случайным селекторам. Нужны **компонент** — единица, которая объединяет разметку, стили и поведение, и **инкапсуляция**, которая не позволяет внешнему миру её сломать."),
      h("Что даёт платформа"),
      ul(
        "**`<template>`** — готовая разметка без накладных расходов, пока она не понадобилась.",
        "**Shadow DOM** — стили и структура изолированы: можно использовать короткие имена классов, не опасаясь конфликтов.",
        "**Custom Elements** — декларативное использование (`<user-badge name=\"Анна\">`) в любой разметке: HTML-шаблонах, CMS, на другом фреймворке.",
        "**Без зависимостей:** работает в любом современном браузере и в любом стеке.",
      ),
      h("Цена"),
      p("Собственные элементы не наследуют семантику и поведение нативных. Кнопка-компонент без роли, фокуса и клавиатуры — шаг назад. Форма с кастомными полями требует особого API. Серверный рендеринг теневых деревьев сложнее. Это инструмент, а не замена `<button>` и `<select>`."),
      insight("Хорошее правило: **не создавайте новый элемент, пока нативный (`details`, `dialog`, `button`, `select`, `input`) решает задачу**. Веб-компоненты нужны для того, чего нет в платформе — и для переиспользуемых оболочек вокруг нативных элементов."),
    ]),

    section("mental-model", [
      p("Представьте **«умную» упаковку** для товара: снаружи — простая наклейка (`<user-badge name=\"Анна\">`), внутри — готовый механизм (разметка, стили, поведение), в который вы можете вставить содержимое через «окошки» (`slot`). Упаковка не пропускает внутрь чужие стили и не выпускает наружу свои, но через заранее предусмотренные отверстия (CSS-переменные, `::part`) её можно настраивать."),
      diagram(
        `
        <user-badge name="Анна">★</user-badge>            ← «светлый» DOM (то, что пишет автор страницы)
              │
              ▼ attachShadow({ mode: "open" })
        #shadow-root
          ├─ <style> :host { … } .name { … } </style>      ← стили инкапсулированы
          ├─ <span class="name">Анна</span>
          └─ <slot></slot>   ◄─── сюда «проецируется» ★ из светлого DOM

        <template> — заготовка для #shadow-root: клонируется в момент создания
        `,
        "Три слоя веб-компонента",
      ),
      table(
        ["Технология", "Отвечает за", "Ключевой API"],
        [
          ["`<template>`", "Заготовка разметки", "`template.content.cloneNode(true)`"],
          ["Shadow DOM", "Инкапсуляция структуры и стилей", "`attachShadow`, `slot`, `:host`, `::slotted`, `::part`"],
          ["Custom Elements", "Собственные теги и жизненный цикл", "`customElements.define`, `connectedCallback`, `observedAttributes`"],
          ["ElementInternals", "Интеграция с формами и ARIA", "`attachInternals`, `setFormValue`, `setValidity`"],
        ],
      ),
    ]),

    section("technical", [
      h("`<template>`"),
      code(
        "html",
        `
        <template id="row-tpl">
          <tr>
            <td class="name"></td>
            <td class="price"></td>
          </tr>
        </template>

        <table><tbody id="rows"></tbody></table>

        <script>
          const tpl = document.getElementById("row-tpl");
          const rows = document.getElementById("rows");
          for (const item of [{ name: "Кроссовки", price: 5990 }, { name: "Футболка", price: 1490 }]) {
            const row = tpl.content.cloneNode(true);       // копия фрагмента
            row.querySelector(".name").textContent = item.name;
            row.querySelector(".price").textContent = item.price + " ₽";
            rows.append(row);
          }
        </script>
        `,
        { lineNumbers: true, filename: "template-rows.html" },
      ),
      ul(
        "**Инертность:** внутри `<template>` скрипты не запускаются, `<img>` не грузятся, стили не применяются, а `id` не попадает в `document.getElementById` — до вставки копии.",
        "**Копирование:** `template.content.cloneNode(true)` — глубокая копия фрагмента; `document.importNode(template.content, true)` делает то же с принадлежностью документу.",
        "**Особый режим парсинга:** внутри `<template>` можно записывать фрагменты, которые вне своего контекста парсер бы отбросил, — например, строки таблицы `<tr>` или `<td>`.",
        "**Безопасность:** подставляйте данные через `textContent`/`setAttribute`, а не `innerHTML`.",
      ),
      h("Shadow DOM и `<slot>`"),
      code(
        "js",
        `
        const host = document.querySelector("#card");
        const root = host.attachShadow({ mode: "open" });   // "open": root доступен как host.shadowRoot
        root.innerHTML = '<style>:host{display:block} h2{margin:0}</style><h2><slot name="title"></slot></h2><slot></slot>';
        `,
      ),
      code(
        "html",
        `
        <user-card>
          <span slot="title">Анна Петрова</span>
          <p>Разработчик интерфейсов.</p>        <!-- попадает в слот по умолчанию -->
        </user-card>
        `,
        { caption: "Содержимое светлого DOM «проецируется» в слоты." },
      ),
      ul(
        "**`mode: \"open\"`** — теневое дерево доступно снаружи через `host.shadowRoot`; **`\"closed\"`** — нет. «Закрытый» режим не даёт настоящей защиты и мешает тестам; чаще используют `open`.",
        "**Слоты:** `<slot>` без имени — по умолчанию; `<slot name=\"title\">` принимает элементы с `slot=\"title\"`. **Содержимое по умолчанию** — то, что внутри `<slot>…</slot>` (показывается, если слот пуст). Событие `slotchange` сообщает об изменениях.",
        "**Слотированные элементы остаются в светлом DOM** — их стилизуют стили страницы; внутри компонента — `::slotted(selector)` (только прямые потомки-слотированные).",
        "**Стили:** правила в теневом дереве действуют только внутри; `:host` и `:host(.class)` стилизуют сам элемент-хозяин; наружные стили на элемент действуют как обычно (они сильнее, чем `:host`).",
        "**Настройка снаружи:** **CSS-переменные** (`--accent`) и наследуемые свойства (шрифт, цвет) проходят внутрь; отдельные части раскрывают через `part=\"…\"` и стилизуют `my-el::part(label)`.",
        "**События:** событие, созданное внутри, «всплывает» через границу только если `composed: true`; при этом `event.target` **ретаргетируется** на хозяина. Кастомные события создают с `bubbles: true, composed: true`.",
      ),
      h("Custom Elements: регистрация и жизненный цикл"),
      table(
        ["Метод", "Когда вызывается", "Что делать"],
        [
          ["`constructor()`", "Создание экземпляра (парсер, `createElement`, апгрейд)", "Вызвать `super()`; создать теневое дерево; **не** читать атрибуты и детей, **не** добавлять в DOM"],
          ["`connectedCallback()`", "Элемент добавлен в документ (может вызываться много раз)", "Отрисовать, подписаться на внешние события и ресурсы"],
          ["`disconnectedCallback()`", "Элемент удалён из документа", "Отписаться, освободить таймеры и подписки"],
          ["`attributeChangedCallback(name, old, new)`", "Изменился атрибут из `observedAttributes`", "Обновить отображение"],
          ["`adoptedCallback()`", "Элемент перенесён в другой документ", "Редко нужен"],
        ],
      ),
      ul(
        "**Имя** содержит **дефис** и строчные буквы (`user-badge`): так платформа отличает собственные теги от будущих стандартных.",
        "**Один раз:** `customElements.define` нельзя вызывать повторно с тем же именем; одно имя — один класс.",
        "**Апгрейд:** если тег уже есть в разметке до регистрации, браузер после `define` «поднимает» существующие элементы: сначала `constructor`, затем `attributeChangedCallback` для каждого начального атрибута, затем `connectedCallback`.",
        "**Ожидание:** `customElements.whenDefined(\"user-badge\")` возвращает промис, исполняющийся после регистрации; до этого элемент — обычный неопределённый `HTMLElement`, и CSS `:not(:defined)` позволяет оформить «загрузку».",
        "**Атрибуты и свойства:** отражайте (`reflect`) важные свойства в атрибуты и обратно (`get/set`), как у нативных элементов. Не используйте имена, конфликтующие с глобальными атрибутами (`role`, `hidden`, `title`).",
        "**Приватные поля и методы** (`#name`) скрывают внутреннее состояние.",
      ),
      h("Нативные элементы с `is=` и «автономные» элементы"),
      p("Есть два вида: **автономные** (`<user-badge>`, наследуют `HTMLElement`) и **расширяющие встроенные** (`<button is=\"fancy-button\">`, наследуют `HTMLButtonElement`). Второй вид сохраняет нативную семантику, но **не поддерживается в Safari**, поэтому для широкого использования выбирают автономные элементы либо улучшение разметки внутри компонента."),
      h("Доступность"),
      ul(
        "**Нет роли по умолчанию:** автономный элемент — `generic`. Добавляйте нативные элементы внутри (`<button>`, `<input>`) либо `role` и состояния через **ElementInternals** (`this.internals.role = \"button\"`, `ariaPressed`).",
        "**Фокус и клавиатура:** либо вложите нативные интерактивные элементы, либо добавьте `tabindex` и обработчики; `attachShadow({ delegatesFocus: true })` передаёт фокус первому фокусируемому элементу внутри.",
        "**Связи по `id` через границу Shadow DOM не работают:** `aria-labelledby`, `for`, `aria-describedby` не могут ссылаться на элемент в другом теневом дереве. Держите метку и поле в одном дереве или используйте ElementInternals/относительные API.",
        "**Слоты и дерево доступности:** содержимое слотов вставляется в дерево доступности в «плоском» виде — скринридер читает его по порядку.",
        "**Улучшайте, а не заменяйте:** лучший паттерн — компонент-обёртка в **светлом DOM** над нативной разметкой (`<char-counter for=\"msg\">`, `<tab-group>` вокруг ссылок), которая без JS остаётся читаемой.",
      ),
      h("Формы: ElementInternals и form-associated элементы"),
      code(
        "js",
        `
        class DsField extends HTMLElement {
          static formAssociated = true;               // участвует в формах
          #internals = this.attachInternals();
          #input;

          constructor() {
            super();
            const root = this.attachShadow({ mode: "open", delegatesFocus: true });
            root.innerHTML = '<input part="input">';
            this.#input = root.querySelector("input");
            this.#input.addEventListener("input", () => this.#sync());
          }

          get value() { return this.#input.value; }
          set value(v) { this.#input.value = v; this.#sync(); }

          #sync() {
            this.#internals.setFormValue(this.value);                  // значение в FormData
            if (this.hasAttribute("required") && !this.value)
              this.#internals.setValidity({ valueMissing: true }, "Заполните поле", this.#input);
            else
              this.#internals.setValidity({});
          }

          formResetCallback() { this.value = ""; }
        }
        customElements.define("ds-field", DsField);
        `,
        { lineNumbers: true, filename: "form-associated.js" },
      ),
      ul(
        "`static formAssociated = true` включает участие в `<form>`: имя (`name`), значение через `setFormValue`, проверка через `setValidity`, события `formResetCallback`, `formDisabledCallback`, `formStateRestoreCallback`.",
        "Без этого элемент **не попадёт** в `FormData` и валидацию.",
        "Внутренний нативный `<input>` в теневом дереве **не** участвует в внешней форме: его значение нужно передавать через `ElementInternals`.",
      ),
      h("Декларативный Shadow DOM и серверный рендеринг"),
      code(
        "html",
        `
        <user-badge name="Анна">
          <template shadowrootmode="open">
            <style>:host{display:inline-flex;gap:.5rem}</style>
            <span class="name">Анна</span><slot></slot>
          </template>
          ★
        </user-badge>
        `,
        { caption: "Теневое дерево, описанное в HTML: сервер может отдать готовую разметку без JavaScript." },
      ),
      ul(
        "Атрибут **`shadowrootmode=\"open\"`** (или `\"closed\"`) на `<template>` превращает его в теневое дерево родителя **при парсинге** — без JS.",
        "Это позволяет рендерить компоненты на сервере и показывать их сразу; JS затем «оживляет» элемент (гидрация).",
        "Работает в современных браузерах; для старых нужна запасная стратегия.",
      ),
      h("Когда веб-компоненты уместны"),
      table(
        ["Подходят", "Не подходят / осторожно"],
        [
          ["Дизайн-система, используемая разными командами и стеками", "Приложение целиком на одном фреймворке (его компоненты проще и богаче)"],
          ["Виджеты, встраиваемые на чужие страницы (карты, чаты, плееры)", "Простая разметка, которую решает нативный элемент"],
          ["Долгоживущие компоненты без привязки к фреймворку", "Критичный SEO-контент, зависящий от клиентского рендеринга теневого дерева"],
          ["Улучшение существующей разметки (счётчики, вкладки, галереи)", "Элементы, которые должны быть формой-полем без `ElementInternals`"],
        ],
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <template id="badge-tpl">
          <style>
            :host { display: inline-flex; gap: .5rem; align-items: center;
                    padding: .25rem .75rem; border: 1px solid var(--badge-border, #888); border-radius: 999px; }
            .role { font-size: .75em; opacity: .7; }
          </style>
          <span class="name" part="name"></span>
          <span class="role"></span>
          <slot></slot>
        </template>

        <user-badge name="Анна" role-title="админ">★</user-badge>

        <script>
          class UserBadge extends HTMLElement {
            static observedAttributes = ["name", "role-title"];
            #root;

            constructor() {
              super();
              this.#root = this.attachShadow({ mode: "open" });
              this.#root.append(document.getElementById("badge-tpl").content.cloneNode(true));
            }
            connectedCallback() { this.#render(); }
            attributeChangedCallback() { this.#render(); }

            #render() {
              this.#root.querySelector(".name").textContent = this.getAttribute("name") ?? "Гость";
              this.#root.querySelector(".role").textContent = this.getAttribute("role-title") ?? "";
            }
          }
          customElements.define("user-badge", UserBadge);
        </script>
        `,
        { lineNumbers: true, filename: "user-badge.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <template id="badge-tpl">
          <style>:host{display:inline-flex;gap:.5rem;padding:.25rem .75rem;border:1px solid #888;border-radius:999px}.role{opacity:.7}</style>
          <span class="name"></span><span class="role"></span><slot></slot>
        </template>

        <user-badge name="Анна" role-title="админ">★</user-badge>
        <button type="button" id="rename">Сменить имя</button>

        <script>
          class UserBadge extends HTMLElement {
            static observedAttributes = ["name", "role-title"];
            #root;
            constructor() {
              super();
              this.#root = this.attachShadow({ mode: "open" });
              this.#root.append(document.getElementById("badge-tpl").content.cloneNode(true));
              console.log("constructor");
            }
            connectedCallback() { console.log("connectedCallback"); this.#render(); }
            disconnectedCallback() { console.log("disconnectedCallback"); }
            attributeChangedCallback(name, oldV, newV) { console.log("attributeChanged:", name, String(oldV), "→", newV); this.#render(); }
            #render() {
              this.#root.querySelector(".name").textContent = this.getAttribute("name") ?? "Гость";
              this.#root.querySelector(".role").textContent = this.getAttribute("role-title") ?? "";
            }
          }
          customElements.define("user-badge", UserBadge);

          document.getElementById("rename").addEventListener("click", () => {
            document.querySelector("user-badge").setAttribute("name", "Борис");
          });
        </script>
        `,
        { runnable: true },
      ),
      p("Тег стоит в разметке **до** регистрации, поэтому браузер выполняет апгрейд: `constructor` → `attributeChanged` для каждого начального атрибута → `connectedCallback`. Нажмите кнопку — сработает `attributeChangedCallback`. Стили внутри компонента не влияют на страницу, а стили страницы — на внутренности."),
    ]),

    section("detailed-example", [
      p("Прогрессивное улучшение в светлом DOM: счётчик символов для `<textarea>`. Без JS пользователь видит статичный текст «Максимум 200 символов»; после регистрации компонент показывает остаток, предупреждает о превышении и объявляет итог скринридеру. Компонент не заменяет нативное поле — он его **дополняет**."),
      code(
        "html",
        `
        <label for="msg">Сообщение</label>
        <textarea id="msg" name="message" rows="4"></textarea>
        <char-counter for="msg" max="200">Максимум 200 символов</char-counter>

        <script>
          class CharCounter extends HTMLElement {
            static observedAttributes = ["max"];
            #field = null;
            #onInput = () => this.#update();

            connectedCallback() {
              this.#field = document.getElementById(this.getAttribute("for"));
              if (!this.#field) return;                         // нет поля: остаётся статичный текст
              this.setAttribute("role", "status");              // объявление остатка
              this.#field.addEventListener("input", this.#onInput);
              this.#update();
            }
            disconnectedCallback() {
              this.#field?.removeEventListener("input", this.#onInput);   // не утекаем
            }
            attributeChangedCallback() { if (this.isConnected) this.#update(); }

            get max() { return Number(this.getAttribute("max")) || 0; }

            #update() {
              if (!this.#field) return;
              const left = this.max - this.#field.value.length;
              this.textContent = left >= 0 ? "Осталось символов: " + left : "Лимит превышен на " + (-left);
              this.toggleAttribute("data-over", left < 0);
              this.#field.setAttribute("aria-invalid", String(left < 0));
            }
          }
          customElements.define("char-counter", CharCounter);
        </script>

        <style>char-counter { display: block; font-size: .875rem; } char-counter[data-over] { color: #b00020; }</style>
        `,
        { lineNumbers: true, filename: "char-counter.html", collapsed: true },
      ),
      ul(
        "**Светлый DOM:** компонент меняет собственное содержимое (`textContent`), стилизуется обычными стилями страницы и работает в любой разметке.",
        "**Жизненный цикл:** подписка в `connectedCallback`, отписка в `disconnectedCallback` — без утечек при удалении элемента.",
        "**Резервный контент:** если JS не загрузился или `for` указывает на несуществующее поле, остаётся статический текст.",
        "**Доступность:** `role=\"status\"` объявляет остаток; `aria-invalid` отмечает превышение. Ограничение лучше дублировать атрибутом `maxlength` или проверкой на сервере.",
      ),
    ]),

    section("analysis", [
      annotated(
        "js",
        `
        class UserBadge extends HTMLElement {
          static observedAttributes = ["name"];
          constructor() { super(); this.attachShadow({ mode: "open" }); }
          connectedCallback() { this.shadowRoot.textContent = this.getAttribute("name"); }
          attributeChangedCallback() { this.connectedCallback(); }
        }
        customElements.define("user-badge", UserBadge);
        `,
        [
          { line: 1, text: "Класс наследует `HTMLElement` — это автономный элемент. Он будет использоваться как `<user-badge>`." },
          { line: 2, text: "`observedAttributes` перечисляет атрибуты, изменение которых вызовет `attributeChangedCallback`. Остальные атрибуты браузер не отслеживает." },
          { line: 3, text: "В конструкторе обязателен `super()`; создаём теневое дерево. Здесь нельзя читать атрибуты и потомков — при создании через парсер их может ещё не быть." },
          { line: 4, text: "`connectedCallback` вызывается при добавлении в документ (и при каждом повторном добавлении). Здесь читают атрибуты и отрисовывают содержимое." },
          { line: 5, text: "Колбэк атрибута срабатывает и при апгрейде (для каждого начального атрибута), и при `setAttribute`. Вызов `connectedCallback` напрямую — упрощение: лучше выделить метод `render()`." },
          { line: 7, text: "Регистрация: имя с дефисом, один класс на имя. После вызова существующие в документе `<user-badge>` «поднимаются»." },
        ],
        "custom-element-annotated.js",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Парсинг шаблона", "Содержимое `<template>` парсится в `DocumentFragment` и хранится в `template.content` в **отдельном документе-заглушке**: скрипты не запускаются, ресурсы не загружаются. При `cloneNode(true)`/`importNode` копия принадлежит основному документу."],
          ["Регистрация элемента", "`customElements.define` связывает имя с классом. Если элементы с этим именем уже есть в документе, они ставятся в очередь на **апгрейд**: браузер создаёт экземпляр класса поверх существующего узла."],
          ["Создание и подключение", "Парсер создаёт элемент, вызывает `constructor`; затем для начальных атрибутов — `attributeChangedCallback`; после вставки в документ — `connectedCallback`."],
          ["Теневое дерево", "`attachShadow` создаёт `ShadowRoot`: отдельное дерево со своим набором стилей. Для отрисовки браузер строит «плоское дерево»: слоты заменяются на назначенные узлы светлого DOM."],
          ["Стили и селекторы", "Селекторы документа не видят теневое дерево; правила внутри ограничены им. Наследуемые свойства и CSS-переменные проходят внутрь; `::part` и `::slotted` дают контролируемые точки доступа."],
          ["События", "Событие, срабатывающее внутри, распространяется по пути, который включает теневое дерево; через границу оно выходит только при `composed: true`, а `event.target` для внешних слушателей подменяется на хозяина (ретаргетинг)."],
          ["Удаление", "При удалении из документа вызывается `disconnectedCallback`. Элемент и его теневое дерево остаются в памяти, пока на них есть ссылки — поэтому важно снимать подписки."],
        ],
        "Как браузер обрабатывает веб-компонент",
      ),
      note("Метод `connectedCallback` может вызываться **несколько раз** (при перемещении элемента). Делайте его идемпотентным: не создавайте дубликатов подписок и разметки."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Имя без дефиса"),
      wrongRight(
        "js",
        {
          code: `
            customElements.define("badge", class extends HTMLElement {});
          `,
          note: "`SyntaxError`: имя собственного элемента должно содержать дефис.",
        },
        {
          code: `
            customElements.define("user-badge", class extends HTMLElement {});
          `,
          note: "Строчные буквы и дефис: `user-badge`.",
        },
      ),
      h("Ошибка 2. Чтение атрибутов и детей в конструкторе"),
      p("Когда парсер создаёт элемент, атрибуты и потомки могут быть недоступны. Читайте их в `connectedCallback`/`attributeChangedCallback`. В конструкторе — только `super()` и подготовка внутреннего состояния/теневого дерева."),
      h("Ошибка 3. `innerHTML` с пользовательскими данными"),
      wrongRight(
        "js",
        {
          code: `
            connectedCallback() {
              this.shadowRoot.innerHTML = "<b>" + this.getAttribute("name") + "</b>";
            }
          `,
          note: "Атрибут может содержать разметку (`<img onerror=…>`): XSS внутри компонента.",
        },
        {
          code: `
            connectedCallback() {
              const b = document.createElement("b");
              b.textContent = this.getAttribute("name");
              this.shadowRoot.replaceChildren(b);
            }
          `,
          note: "Данные вставляются как текст, а не как HTML.",
        },
      ),
      h("Ошибка 4. Утечки: нет `disconnectedCallback`"),
      p("Слушатели на `window`/`document`, таймеры и подписки остаются после удаления элемента и удерживают его в памяти. Снимайте их в `disconnectedCallback`."),
      h("Ошибка 5. Ссылки по `id` через границу Shadow DOM"),
      wrongRight(
        "html",
        {
          code: `
            <label for="name">Имя</label>
            <my-input id="name"></my-input>   <!-- внутри <input> в shadow root -->
          `,
          note: "`for` и `aria-labelledby` не «видят» внутрь теневого дерева: поле остаётся без имени.",
        },
        {
          code: `
            <my-input label="Имя"></my-input>   <!-- метка и поле в одном теневом дереве -->
          `,
          note: "Метка внутри компонента (или связь через ElementInternals для form-associated элементов).",
        },
      ),
      h("Ошибка 6. Ожидание, что стили страницы подействуют внутри"),
      p("Глобальный `.btn { … }` не стилизует кнопку внутри теневого дерева. Используйте CSS-переменные, `::part` или подключайте стили внутрь (`<style>`, `adoptedStyleSheets`)."),
      h("Ошибка 7. События без `composed`"),
      p("`new CustomEvent(\"change\", { bubbles: true })` не пересечёт границу Shadow DOM: снаружи слушатель его не получит. Добавьте `composed: true`."),
      h("Ошибка 8. Компонент как замена нативному"),
      p("`<my-button>` без роли, `tabindex`, Enter/Space и `disabled` хуже `<button>`. Если нативный элемент подходит, используйте его (или оберните)."),
    ]),

    section("antipatterns", [
      ul(
        "**Весь интерфейс из собственных элементов** без необходимости: тяжело поддерживать, трудно доработать доступность.",
        "**Конструктор, который делает всё:** читает атрибуты, лезет в DOM, шлёт запросы.",
        "**Собственные атрибуты с именами глобальных** (`title`, `role`, `hidden`) — конфликт с платформой.",
        "**Сквозная «магия» глобальных переменных** вместо атрибутов, свойств и событий.",
        "**«closed»-режим для «безопасности»:** не защищает, но мешает тестированию и расширениям.",
        "**Критичный контент только внутри теневого дерева, рендерящегося на клиенте:** страдают SEO и скорость.",
        "**Нет запасного варианта без JS** там, где компонент — улучшение.",
        "**Дублирование функциональности библиотеки:** пишут «свой комбобокс» вместо проверенного.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Сначала нативные элементы;** веб-компонент — для недостающего или как обёртка и улучшение.",
        "**Улучшайте светлый DOM:** разметка читаема без JS; компонент добавляет поведение.",
        "**Жизненный цикл:** конструктор — минимум; подписки — в `connectedCallback`; очистка — в `disconnectedCallback`; идемпотентность.",
        "**API компонента:** атрибуты (строки) ↔ свойства (любые типы) ↔ события (`CustomEvent` с `composed`); документируйте.",
        "**Доступность:** роль, имя, состояние, клавиатура, фокус; `delegatesFocus`; метки внутри одного дерева; ElementInternals для форм.",
        "**Стилизация:** CSS-переменные для тем, `::part` для частей, `:host` для базовых стилей; уважайте `prefers-reduced-motion` и контраст.",
        "**Безопасность:** `textContent` и DOM API вместо `innerHTML` с данными.",
        "**Формы:** `formAssociated` + `ElementInternals` для полей.",
        "**Серверный рендеринг:** декларативный Shadow DOM и корректная гидрация, если важны скорость и SEO.",
        "**Тесты:** юнит-тесты жизненного цикла, e2e с клавиатурой и скринридером, проверка в целевых браузерах.",
      ),
    ]),

    section("edge-cases", [
      h("Порядок загрузки: определён после использования"),
      p("Если `customElements.define` вызывается после появления тега, элемент сначала неопределён (`:not(:defined)`), потом «апгрейдится». Скрывайте или оформляйте такие элементы CSS, чтобы не мигал контент: `user-badge:not(:defined) { visibility: hidden }` либо резервный стиль."),
      h("Дети и `connectedCallback`"),
      p("Если скрипт определён в `<head>` без `defer`, `connectedCallback` вызывается при встрече открывающего тега, когда потомки ещё не разобраны. Используйте `defer`/модули, `slotchange` или `MutationObserver`, если нужна работа с детьми."),
      h("Клонирование и `importNode`"),
      p("Копия элемента, созданная `cloneNode`, вызывает `constructor`, но состояние (например, значение внутри теневого дерева) не копируется — восстанавливайте его из атрибутов."),
      h("`attachShadow` — только один раз"),
      p("Повторный вызов бросает `NotSupportedError`. Для декларативного теневого дерева `attachShadow` в конструкторе, если корень уже есть, нужно использовать `this.shadowRoot ?? this.attachShadow(…)` (или `attachInternals().shadowRoot`)."),
      h("Стили: `adoptedStyleSheets`"),
      p("Чтобы не дублировать `<style>` в каждом экземпляре, создают `CSSStyleSheet` один раз и передают в `shadowRoot.adoptedStyleSheets`. Это экономит память и ускоряет создание."),
      h("Печать и тема"),
      p("Внутри теневого дерева действуют запросы `@media print` и `prefers-color-scheme`, но глобальные классы темы (`.dark`) не проникают. Прокидывайте тему через CSS-переменные и атрибут на хозяине."),
      h("Тестирование и инструменты"),
      p("В DevTools теневые деревья видны как `#shadow-root`; запросы `document.querySelector` внутрь не заходят — используйте `host.shadowRoot.querySelector`. Для тестов удобнее режим `open`."),
      h("Поддержка и полифиллы"),
      p("Template, Shadow DOM и автономные Custom Elements поддерживаются во всех современных браузерах. `is=` (customized built-ins) — нет в Safari; декларативный Shadow DOM — в современных версиях. Для стратегии поддержки используйте проверку возможностей."),
    ]),

    section("related", [
      ul(
        "[Парсинг и DOM](/learn/html/parsing-dom) — как парсер строит DOM; `template` как особый контекст.",
        "[Интерактивные элементы](/learn/html/interactive-elements) — нативные `details`, `dialog`, `popover`.",
        "[ARIA](/learn/html/aria) — роли и состояния для собственных элементов.",
        "[Глобальные атрибуты](/learn/html/global-attributes) — `slot`, `part`, `is`, `autofocus`.",
        "[Прогрессивное улучшение](/learn/html/progressive-enhancement) — компоненты, работающие без JS.",
        "[Безопасность HTML](/learn/html/html-security) — XSS и безопасная вставка данных.",
        "Из других курсов: **CSS** — `::part`, `::slotted`, `:host`, переменные; **JS** — классы, `CustomEvent`, `MutationObserver`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Копируемая разметка и глобальные классы",
          code: `
            <div class="badge"><span class="name">Анна</span><span class="role">админ</span></div>
            <div class="badge"><span class="name">Борис</span><span class="role">модератор</span></div>
            <style>.badge{…} .name{…} .role{…}</style>
            <script>
              document.querySelectorAll(".badge .name").forEach(el => el.onclick = …);
            </script>
          `,
          note: "Дублирование разметки; общие классы конфликтуют с другими блоками; скрипт привязан к случайным селекторам.",
        },
        {
          title: "Компонент с инкапсуляцией",
          code: `
            <user-badge name="Анна" role-title="админ"></user-badge>
            <user-badge name="Борис" role-title="модератор"></user-badge>

            <!-- разметка и стили — внутри компонента: customElements.define("user-badge", …) -->
          `,
          note: "Один источник разметки, стилей и поведения; страница использует простой тег; конфликты классов невозможны.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.templates-custom-elements.ex1",
      title: "Порядок вызовов жизненного цикла",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Дан фрагмент. Запишите, в каком порядке в консоли появятся сообщения, и объясните, почему."),
        code(
          "html",
          `
          <x-box color="red"></x-box>
          <script>
            class XBox extends HTMLElement {
              static observedAttributes = ["color"];
              constructor() { super(); console.log("1 constructor"); }
              connectedCallback() { console.log("2 connected"); }
              attributeChangedCallback(n, o, v) { console.log("3 attr", n, o, v); }
              disconnectedCallback() { console.log("4 disconnected"); }
            }
            customElements.define("x-box", XBox);
            const el = document.querySelector("x-box");
            el.setAttribute("color", "blue");
            el.remove();
          </script>
          `,
        ),
      ],
      hints: ["Тег стоит в документе до регистрации — это апгрейд.", "Какие атрибуты уже есть при апгрейде?"],
      checks: ["Порядок: 1, 3 (null → red), 2, 3 (red → blue), 4", "Объяснён апгрейд"],
      solution: [
        ol(
          "`1 constructor` — апгрейд создаёт экземпляр.",
          "`3 attr color null red` — для начального атрибута `color=\"red\"`.",
          "`2 connected` — элемент уже в документе.",
          "`3 attr color red blue` — `setAttribute`.",
          "`4 disconnected` — `remove()`.",
        ),
        p("Итог: constructor → attributeChanged (начальные атрибуты) → connected → attributeChanged (изменение) → disconnected."),
      ],
    }),
    exercise({
      id: "html.templates-custom-elements.ex2",
      title: "Компонент-улучшение: <tab-group> над нативной разметкой",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сделайте `<char-counter>`-подобный компонент `<read-time for=\"article\" wpm=\"200\">`: он считает время чтения текста элемента с `id=\"article\"` (слов / слов в минуту, округление вверх) и показывает «≈ N мин чтения». Без JS остаётся резервный текст «Время чтения не определено». Нужны `observedAttributes`, `connectedCallback`, аккуратная работа, если элемента нет."),
      ],
      hints: ["Как посчитать слова: `textContent.trim().split(/\\s+/)`.", "Где читать атрибут `for`?", "Что показывать, если элемента нет?"],
      checks: ["Чтение атрибутов в `connectedCallback`", "Обработка отсутствующего элемента", "Резервный текст остаётся", "Нет `innerHTML` с данными"],
      solution: [
        code(
          "html",
          `
          <p><read-time for="article" wpm="200">Время чтения не определено</read-time></p>
          <article id="article">
            <p>Длинный текст статьи…</p>
          </article>

          <script>
            class ReadTime extends HTMLElement {
              static observedAttributes = ["for", "wpm"];

              connectedCallback() { this.#render(); }
              attributeChangedCallback() { if (this.isConnected) this.#render(); }

              #render() {
                const target = document.getElementById(this.getAttribute("for") ?? "");
                if (!target) return;                                // резервный текст остаётся
                const wpm = Number(this.getAttribute("wpm")) || 200;
                const words = target.textContent.trim().split(/\\s+/).filter(Boolean).length;
                const minutes = Math.max(1, Math.ceil(words / wpm));
                this.textContent = "≈ " + minutes + " мин чтения";
              }
            }
            customElements.define("read-time", ReadTime);
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        note("Если скрипт определён до разметки статьи (в `head` без `defer`), `getElementById` вернёт `null`. Используйте `defer`/модуль или повторный вызов после `DOMContentLoaded`."),
      ],
    }),
    exercise({
      id: "html.templates-custom-elements.ex3",
      title: "Сломанный компонент",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Компонент «ломается»: консоль сообщает об ошибке регистрации, подпись из внешнего `<label>` не озвучивается, событие `select` не ловится снаружи, при удалении компонента растёт память, а в атрибуте `name` кто-то передал `<img onerror=…>`. Найдите ошибки и исправьте."),
      ],
      starter: {
        lang: "html",
        code: `
          <label for="u">Пользователь</label>
          <picker id="u" name="Анна"></picker>

          <script>
            class Picker extends HTMLElement {
              constructor() {
                this.attachShadow({ mode: "open" });
                this.shadowRoot.innerHTML = "<button>" + this.getAttribute("name") + "</button>";
                window.addEventListener("resize", () => this.layout());
              }
              layout() {}
            }
            customElements.define("picker", Picker);
            document.addEventListener("select", () => console.log("выбрано"));
            // внутри: this.dispatchEvent(new CustomEvent("select", { bubbles: true }));
          </script>
        `,
      },
      hints: ["Что обязательно в конструкторе?", "Нужен ли дефис?", "Что нужно событию, чтобы выйти из теневого дерева?", "Где снимать слушатели?", "Как безопасно подставить имя?"],
      checks: ["`super()`", "Имя с дефисом", "`composed: true`", "Отписка в `disconnectedCallback`", "`textContent` вместо `innerHTML`", "Метка внутри компонента"],
      solution: [
        ul(
          "**Имя `picker` без дефиса** — ошибка регистрации → `user-picker`.",
          "**Нет `super()` в конструкторе** — `ReferenceError`.",
          "**`innerHTML` с атрибутом** — XSS → `createElement` и `textContent`.",
          "**`<label for>` не видит внутрь теневого дерева** → принять `label` атрибутом и вывести метку внутри (или использовать ElementInternals).",
          "**Событие без `composed: true`** не выходит из Shadow DOM.",
          "**Слушатель `resize` не снимается** → подписаться в `connectedCallback`, отписаться в `disconnectedCallback`.",
          "**Чтение атрибутов в конструкторе** — делать в `connectedCallback`.",
        ),
        code(
          "html",
          `
          <user-picker label="Пользователь" name="Анна"></user-picker>

          <script>
            class UserPicker extends HTMLElement {
              #root; #onResize = () => this.layout();

              constructor() {
                super();
                this.#root = this.attachShadow({ mode: "open" });
              }
              connectedCallback() {
                const label = document.createElement("label");
                const text = document.createElement("span");
                text.textContent = this.getAttribute("label") ?? "";
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = this.getAttribute("name") ?? "";
                btn.addEventListener("click", () =>
                  this.dispatchEvent(new CustomEvent("select", { bubbles: true, composed: true, detail: { name: btn.textContent } })));
                label.append(text, " ", btn);
                this.#root.replaceChildren(label);
                window.addEventListener("resize", this.#onResize);
              }
              disconnectedCallback() { window.removeEventListener("resize", this.#onResize); }
              layout() {}
            }
            customElements.define("user-picker", UserPicker);
            document.addEventListener("select", (e) => console.log("выбрано:", e.detail.name));
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.templates-custom-elements.challenge",
    title: "Мини-библиотека компонентов для дизайн-системы",
    scenario: [
      p("Компания использует три стека (React, Vue и серверные шаблоны) и хочет единую библиотеку базовых компонентов: поле ввода с меткой и ошибкой (`<ds-text-field>`), кнопка-переключатель (`<ds-toggle>`) и диалог подтверждения (`<ds-confirm>`). Компоненты должны работать в формах, быть доступными, темизироваться, поддерживать серверный рендеринг и не ломаться при отсутствии JavaScript."),
      p("Спроектируйте API, структуру и ключевые участки реализации. Укажите, где вы применяете нативные элементы внутри компонентов, как реализуете форму/валидацию и доступность, и как тестируете."),
    ],
    requirements: [
      "API каждого компонента: атрибуты, свойства, события, слоты, части (`part`), CSS-переменные",
      "Реализация `<ds-text-field>` как form-associated элемента с валидацией",
      "Стратегия доступности (метки, ошибки, клавиатура, роли)",
      "Серверный рендеринг (declarative shadow DOM) и поведение без JS",
      "План тестирования и совместимости",
    ],
    constraints: [
      "Внутри компонентов — нативные `input`, `button`, `dialog`",
      "Все события — `CustomEvent` с `composed: true`",
      "Данные вставляются без `innerHTML`",
    ],
    acceptance: [
      "`<ds-text-field>` участвует в `FormData` и валидации формы",
      "Метка и ошибка озвучиваются; фокус передаётся внутрь (`delegatesFocus`)",
      "Темизация только через CSS-переменные и `::part`",
      "Без JS компонент остаётся читаемой разметкой/формой",
    ],
    hints: [
      "Чем заменить `for` и `aria-labelledby`, которые не работают через границу Shadow DOM?",
      "Как отобразить ошибку без `alert()`?",
      "Что отдавать с сервера: готовое теневое дерево или резервную разметку?",
    ],
    solution: [
      code(
        "js",
        `
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(
          ':host { display: block; font: inherit; } ' +
          '.label { display: block; margin-block-end: .25rem; } ' +
          'input { font: inherit; padding: .5rem .75rem; border: 1px solid var(--ds-border, #767676); border-radius: var(--ds-radius, 6px); } ' +
          'input:focus-visible { outline: 3px solid var(--ds-focus, #1a73e8); outline-offset: 2px; } ' +
          '.error { color: var(--ds-error, #b00020); }'
        );

        class DsTextField extends HTMLElement {
          static formAssociated = true;
          static observedAttributes = ["label", "value", "required", "disabled", "error"];

          #internals = this.attachInternals();
          #root; #input; #label; #error;

          constructor() {
            super();
            this.#root = this.attachShadow({ mode: "open", delegatesFocus: true });
            this.#root.adoptedStyleSheets = [sheet];

            this.#label = document.createElement("label");
            this.#label.className = "label";
            this.#label.setAttribute("part", "label");
            this.#input = document.createElement("input");
            this.#input.id = "input";
            this.#input.setAttribute("part", "input");
            this.#label.htmlFor = "input";
            this.#error = document.createElement("p");
            this.#error.id = "error";
            this.#error.className = "error";
            this.#error.hidden = true;
            this.#input.setAttribute("aria-describedby", "error");

            this.#input.addEventListener("input", () => { this.#sync(); this.#emit("input"); });
            this.#input.addEventListener("change", () => this.#emit("change"));
            this.#root.append(this.#label, this.#input, this.#error);
          }

          get value() { return this.#input.value; }
          set value(v) { this.#input.value = v ?? ""; this.#sync(); }

          connectedCallback() { this.#apply(); this.#sync(); }
          attributeChangedCallback(name, _old, value) { if (name === "value") this.#input.value = value ?? ""; this.#apply(); this.#sync(); }

          formResetCallback() { this.value = this.getAttribute("value") ?? ""; }
          formDisabledCallback(disabled) { this.#input.disabled = disabled; }

          #apply() {
            this.#label.textContent = this.getAttribute("label") ?? "";
            this.#input.required = this.hasAttribute("required");
            this.#input.disabled = this.hasAttribute("disabled");
          }

          #sync() {
            this.#internals.setFormValue(this.value);
            const custom = this.getAttribute("error");
            let message = "";
            if (custom) message = custom;
            else if (this.hasAttribute("required") && !this.value) message = "Заполните поле «" + (this.getAttribute("label") ?? "") + "»";

            this.#error.textContent = message;
            this.#error.hidden = !message;
            this.#input.setAttribute("aria-invalid", String(Boolean(message)));
            if (message) this.#internals.setValidity({ customError: true }, message, this.#input);
            else this.#internals.setValidity({});
          }

          #emit(type) {
            this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: { value: this.value } }));
          }
        }
        customElements.define("ds-text-field", DsTextField);
        `,
        { lineNumbers: true, filename: "ds-text-field.js", collapsed: true },
      ),
      ul(
        "**Нативные элементы внутри:** настоящие `label` и `input` в одном теневом дереве, связаны по `id` внутри него; `delegatesFocus: true` передаёт фокус полю при фокусировке хозяина.",
        "**Форма:** `formAssociated` + `ElementInternals`: значение в `FormData`, `setValidity` даёт нативную блокировку отправки; `formResetCallback` и `formDisabledCallback` реагируют на сброс и `fieldset disabled`.",
        "**Ошибки:** текст в `<p id=\"error\">`, связанный через `aria-describedby`, и `aria-invalid`; без `alert()`.",
        "**События:** `input`/`change` как `CustomEvent` с `composed: true` и `detail`.",
        "**Темизация:** CSS-переменные (`--ds-*`) и `::part(input)`/`::part(label)`; стили общего `CSSStyleSheet` (adoptedStyleSheets).",
        "**Серверный рендеринг:** сервер отдаёт `<ds-text-field label=… name=…><template shadowrootmode=\"open\">…</template></ds-text-field>` (declarative shadow DOM) с готовой разметкой `label`/`input`; JS регистрирует элемент и «оживляет» его. Для браузеров без поддержки — запасной вариант: обычные `label` и `input` вне компонента (progressive enhancement через `<noscript>`/`:not(:defined)`).",
        "**Другие компоненты:** `<ds-toggle>` — оболочка над `<button aria-pressed>` (или `input type=checkbox role=switch`); `<ds-confirm>` — над нативным `<dialog>` с `showModal()`, `returnValue` и `autofocus` на безопасном действии.",
        "**Тесты:** юнит-тесты жизненного цикла и API (Web Test Runner/Vitest + jsdom/Playwright); e2e с клавиатурой и скринридером; axe на примерах; проверка в целевых браузерах (включая Safari); визуальные снимки тем; тест на отсутствие утечек (удаление элемента снимает подписки).",
        "**Версионирование и совместимость:** семантические версии, документация (Storybook/каталог), события и части — часть публичного API, их удаление — мажорное изменение; не использовать `is=` из-за Safari.",
      ),
    ],
  },

  interview: [
    iq("html.templates-custom-elements.i1", "basic", "Что такое `<template>` и чем он отличается от скрытого `div`?", [
      p("Содержимое `<template>` инертно: скрипты не выполняются, картинки не загружаются, стили не применяются, элементы не попадают в поиск по документу. Доступ — через `template.content` и `cloneNode(true)`. Скрытый `div` — часть документа, его содержимое активно."),
    ]),
    iq("html.templates-custom-elements.i2", "basic", "Какие требования к имени Custom Element?", [
      p("Имя содержит дефис, начинается со строчной буквы и не совпадает с зарезервированными именами (например, `annotation-xml`). Примеры: `user-badge`, `x-box`."),
    ]),
    iq("html.templates-custom-elements.i3", "intermediate", "Какие методы жизненного цикла есть у Custom Elements и когда они вызываются?", [
      ul(
        "`constructor` — создание; `connectedCallback` — добавлен в документ; `disconnectedCallback` — удалён.",
        "`attributeChangedCallback` — изменился атрибут из `observedAttributes`; `adoptedCallback` — перенос в другой документ.",
        "При апгрейде существующего элемента: constructor → attributeChanged для начальных атрибутов → connected.",
      ),
    ]),
    iq("html.templates-custom-elements.i4", "intermediate", "Что делает Shadow DOM и как стилизовать компонент снаружи?", [
      p("Изолирует структуру и стили компонента. Снаружи его настраивают CSS-переменными, наследуемыми свойствами, частями `::part(name)` и слотами (содержимое слотов остаётся в светлом DOM и стилизуется страницей)."),
    ]),
    iq("html.templates-custom-elements.i5", "intermediate", "Почему событие из теневого дерева может «не дойти» до слушателя на документе?", [
      p("Событие выходит за границу Shadow DOM только при `composed: true`; кастомные события нужно создавать с `bubbles: true, composed: true`. При выходе `event.target` ретаргетируется на элемент-хозяин."),
    ]),
    iq("html.templates-custom-elements.i6", "advanced", "Какие проблемы доступности возникают у собственных элементов и как их решать?", [
      ul(
        "Нет роли, фокуса и клавиатуры по умолчанию → использовать нативные элементы внутри, `tabindex`, ElementInternals (`role`, `aria*`), `delegatesFocus`.",
        "Связи по `id` (`for`, `aria-labelledby`) не пересекают границу теневого дерева → держать метку и поле в одном дереве.",
        "Формы: `formAssociated` и `ElementInternals`, иначе поле не участвует в форме.",
        "Лучший подход — улучшение светлого DOM над нативной разметкой.",
      ),
    ]),
    iq("html.templates-custom-elements.i7", "engineering", "Когда веб-компоненты — хороший выбор, а когда лучше компонентный фреймворк?", [
      ul(
        "Подходят: общая дизайн-система для разных стеков, встраиваемые виджеты, долгоживущие компоненты, улучшение разметки.",
        "Фреймворк лучше для приложения целиком: состояние, маршрутизация, SSR-экосистема, инструменты.",
        "Они сочетаются: фреймворк использует веб-компоненты как строительные блоки.",
        "Критерии: SSR/SEO, доступность, поддержка форм, команда и инструменты.",
      ),
    ]),
    iq("html.templates-custom-elements.i8", "debugging", "Компонент мигает «сырым» содержимым перед отрисовкой и дважды подписывается на события. Почему?", [
      ul(
        "Элемент определён позже, чем отрисован: до `define` он неопределён (`:not(:defined)`) — нужен CSS для состояния «до определения» или `defer`-скрипт.",
        "`connectedCallback` вызывается при каждом добавлении в документ (перемещение элемента); подписки без проверки/отписки дублируются — делать идемпотентно и снимать в `disconnectedCallback`.",
      ),
    ]),
  ],

  exam: [
    mcq("html.templates-custom-elements.e1", "foundation", "Что происходит со скриптами внутри `<template>` до клонирования?", ["Выполняются сразу", "Не выполняются", "Выполняются после загрузки страницы", "Блокируют парсер"], 1, "Содержимое `template` инертно: скрипты не запускаются, ресурсы не загружаются."),
    mcq("html.templates-custom-elements.e2", "foundation", "Какое имя допустимо для Custom Element?", ["`badge`", "`UserBadge`", "`user-badge`", "`user_badge`"], 2, "Имя должно содержать дефис и быть строчным."),
    mcq("html.templates-custom-elements.e3", "intermediate", "Где правильно читать атрибуты элемента при создании через парсер?", ["В `constructor`", "В `connectedCallback` и `attributeChangedCallback`", "В глобальной области", "В `disconnectedCallback`"], 1, "В конструкторе атрибуты и потомки могут быть недоступны; читать нужно в колбэках."),
    mcq("html.templates-custom-elements.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["Стили страницы действуют внутри Shadow DOM", "CSS-переменные проходят через границу Shadow DOM", "`::part()` позволяет стилизовать раскрытые части", "Событие выходит из Shadow DOM без `composed`"], [1, 2], "Селекторы страницы не заходят в теневое дерево; событие требует `composed: true`."),
    mcq("html.templates-custom-elements.e5", "intermediate", "Что нужно, чтобы собственный элемент участвовал в `FormData` и валидации формы?", ["`static formAssociated = true` и `ElementInternals`", "Только атрибут `name`", "`<input>` внутри теневого дерева", "Ничего"], 0, "`formAssociated` и `setFormValue`/`setValidity` подключают элемент к форме."),
    mcq("html.templates-custom-elements.e6", "advanced", "Что даёт `shadowrootmode=\"open\"` на `<template>`?", ["Скрывает шаблон", "Создаёт теневое дерево при парсинге без JavaScript", "Закрывает доступ к `shadowRoot`", "Включает `delegatesFocus`"], 1, "Декларативный Shadow DOM позволяет серверу отдать готовое теневое дерево."),
    open("html.templates-custom-elements.e7", "intermediate", "Объясните принцип «улучшайте светлый DOM» на примере компонента-счётчика символов.", [
      ul(
        "Разметка остаётся обычной: `<textarea>` с `<label>` и резервным текстом внутри `<char-counter>`.",
        "Без JS пользователь видит статический текст; после регистрации компонент подписывается на `input` и обновляет подпись, объявляет остаток (`role=\"status\"`).",
        "Компонент не заменяет нативное поле, а дополняет его; он работает в любой разметке и не нарушает доступность.",
      ),
    ], ["Описан резервный контент", "Описано поведение после регистрации", "Подчёркнуто, что нативное не заменяется"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.templates-custom-elements.m1", "intermediate", "Почему `<label for=\"x\">` не связывает метку с `<input>` внутри Shadow DOM?", ["Метка устарела", "Ссылки по `id` не пересекают границу теневого дерева", "Нужен `aria-hidden`", "`for` работает только с `button`"], 1, "Идентификаторы изолированы теневым деревом: метка и поле должны быть в одном дереве либо связываться через ElementInternals."),
    mcq("html.templates-custom-elements.m2", "advanced", "Что важно делать в `disconnectedCallback`?", ["Ничего", "Снимать внешние подписки и таймеры", "Вызывать `connectedCallback`", "Удалять `shadowRoot`"], 1, "Иначе слушатели удерживают элемент в памяти и выполняются впустую."),
    mcq("html.templates-custom-elements.m3", "advanced", "Почему не рекомендуют использовать `is=` (customized built-in) для широкой поддержки?", ["Не работает в Safari", "Запрещено стандартом", "Нельзя наследовать `HTMLButtonElement`", "Блокирует Shadow DOM"], 0, "Safari не поддерживает расширение встроенных элементов через `is=`; автономные элементы поддерживаются везде."),
    open("html.templates-custom-elements.m4", "advanced", "Команда хочет переписать весь сайт на собственных веб-компонентах вместо нативных `button`, `select`, `details`. Какие риски вы укажете?", [
      ul(
        "Потеря нативной семантики, фокуса, клавиатуры, форм и доступности: нужно воспроизводить вручную.",
        "Усложнение SSR, SEO и тестирования; рост сложности и размера кода.",
        "Лучше использовать нативные элементы и создавать компоненты только для недостающего или как оболочки над нативными.",
        "Если нужна общая библиотека — проектировать API, доступность и тесты как продукт.",
      ),
    ], ["Названа потеря семантики и доступности", "Названы SSR/SEO/сложность", "Предложен гибрид: нативное + компоненты для недостающего"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.templates-custom-elements.f1", front: "Что такое `<template>`?", back: "Инертная заготовка: не отображается, не выполняет скрипты и не грузит ресурсы. Клонируется через `content.cloneNode(true)`." },
    { id: "html.templates-custom-elements.f2", front: "Жизненный цикл?", back: "`constructor` → (attributeChanged) → `connectedCallback` … `disconnectedCallback`; `observedAttributes` задаёт отслеживаемые атрибуты." },
    { id: "html.templates-custom-elements.f3", front: "Имя Custom Element?", back: "Строчное, с дефисом: `user-badge`." },
    { id: "html.templates-custom-elements.f4", front: "Стилизация Shadow DOM снаружи?", back: "CSS-переменные, наследуемые свойства, `::part()`, слоты (содержимое — в светлом DOM)." },
    { id: "html.templates-custom-elements.f5", front: "События из Shadow DOM?", back: "`composed: true` (и `bubbles: true`), иначе наружу не выйдут." },
    { id: "html.templates-custom-elements.f6", front: "Участие в форме?", back: "`static formAssociated = true` + `ElementInternals.setFormValue/setValidity`." },
  ],

  sources: [
    { title: "HTML Living Standard — The template element", url: "https://html.spec.whatwg.org/multipage/scripting.html#the-template-element", publisher: "WHATWG" },
    { title: "HTML Living Standard — Custom elements", url: "https://html.spec.whatwg.org/multipage/custom-elements.html", publisher: "WHATWG" },
    { title: "DOM Standard — Shadow trees", url: "https://dom.spec.whatwg.org/#shadow-trees", publisher: "WHATWG" },
    { title: "MDN: Web Components", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_components", publisher: "MDN" },
    { title: "MDN: Using custom elements", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements", publisher: "MDN" },
    { title: "MDN: ElementInternals", url: "https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals", publisher: "MDN" },
    { title: "web.dev: Custom Elements best practices", url: "https://web.dev/articles/custom-elements-best-practices", publisher: "Other" },
  ],
};
