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

export const globalAttributes: Topic = {
  id: "html.global-attributes",
  slug: "global-attributes",
  domain: "html",
  module: "advanced",
  title: "Глобальные атрибуты",
  titleEn: "Global attributes: id, class, data-*, lang, dir, hidden, title, translate, inert, contenteditable and more",
  summary:
    "Глобальные атрибуты можно поставить на любой HTML-элемент: `id`, `class`, `data-*`, `lang`, `dir`, `hidden`, `title`, `tabindex`, `inert`, `translate`, `contenteditable` и другие. Тема разбирает их точный смысл, взаимодействие с CSS, JavaScript и доступностью — и ловушки (`hidden` против `display`, дубликаты `id`, `title` как подпись).",
  minutes: 50,
  prerequisites: ["html.elements-attributes", "html.parsing-dom"],
  tags: ["id", "class", "data-*", "dataset", "lang", "dir", "hidden", "title", "tabindex", "inert", "translate", "contenteditable", "draggable", "spellcheck", "nonce", "boolean attributes", "enumerated attributes", "style"],
  keyConcepts: [
    { term: "Глобальные атрибуты", text: "Атрибуты, допустимые на **любом** HTML-элементе. Их смысл одинаков везде, поэтому их нужно знать наизусть." },
    { term: "id уникален", text: "Значение `id` должно быть уникальным в документе: на нём держатся якоря, `label for`, ARIA-ссылки и `getElementById`." },
    { term: "data-* — мост к JS", text: "Пользовательские данные лежат в `data-*` и доступны как `element.dataset`. Не изобретайте собственные нестандартные атрибуты." },
    { term: "Логические атрибуты", text: "Наличие атрибута означает `true`: `hidden=\"false\"` тоже скрывает. Удаляйте атрибут, а не меняйте значение." },
    { term: "Не заменяют друг друга", text: "`hidden`, `inert`, `aria-hidden`, `display:none` — разные механизмы: что видит глаз, дерево доступности и фокус." },
  ],
  sections: [
    section("definition", [
      def("Глобальный атрибут", "Атрибут, определённый стандартом HTML для **всех** элементов (в том числе неизвестных и пользовательских). Перечень: `accesskey`, `autocapitalize`, `autofocus`, `class`, `contenteditable`, `data-*`, `dir`, `draggable`, `enterkeyhint`, `hidden`, `id`, `inert`, `inputmode`, `is`, `itemid`/`itemprop`/`itemref`/`itemscope`/`itemtype`, `lang`, `nonce`, `part`, `popover`, `slot`, `spellcheck`, `style`, `tabindex`, `title`, `translate`, а также `role` и `aria-*` из ARIA.", "global attributes"),
      def("Логический (boolean) атрибут", "Атрибут без значения: **наличие** означает «включено», **отсутствие** — «выключено». Допустимые записи: `hidden`, `hidden=\"\"`, `hidden=\"hidden\"`. Запись `hidden=\"false\"` — всё равно «включено».", "boolean attribute"),
      def("Перечислимый (enumerated) атрибут", "Атрибут с конечным набором ключевых слов (`dir=\"ltr|rtl|auto\"`, `contenteditable=\"true|false|plaintext-only\"`). Неизвестное значение приводится к значению по умолчанию, а не к «ошибке».", "enumerated attribute"),
    ]),

    section("why", [
      h("Универсальные «ручки» элемента"),
      p("Любому элементу, будь то `div`, `p` или `user-badge`, нужно уметь: иметь имя для ссылки и подписи (`id`), группироваться для стилей (`class`), нести данные для скрипта (`data-*`), указывать язык и направление текста (`lang`, `dir`), прятаться (`hidden`, `inert`), получать фокус (`tabindex`), быть редактируемым (`contenteditable`). Глобальные атрибуты — этот общий набор."),
      h("Источник многих скрытых ошибок"),
      ul(
        "**Дубликаты `id`** ломают метки, якоря и ARIA-ссылки.",
        "**`hidden`, перебитый CSS,** оставляет «скрытый» блок на экране.",
        "**`title` как подпись** не читается на сенсорных устройствах и не заменяет `label`.",
        "**Неверный `lang`** портит произношение скринридера и работу переводчика.",
        "**Самодельные атрибуты** (`<div type=\"card\">`) невалидны и могут столкнуться с будущими стандартами.",
      ),
      insight("Знание глобальных атрибутов отделяет «пишущего теги» от «понимающего платформу»: многие задачи (скрыть, объяснить язык, сохранить данные, разрешить редактирование) решаются одним атрибутом, без JS."),
    ]),

    section("mental-model", [
      p("Представьте элемент как **карточку сотрудника**, на которой есть универсальные поля для любой должности: личный номер (`id`), отдел (`class`), контакты и заметки для отдела кадров (`data-*`), язык общения (`lang`), доступ и режим работы (`hidden`, `inert`, `tabindex`). Специальные поля зависят от должности (`href` — у ссылки, `src` — у картинки), а универсальные — у всех."),
      diagram(
        `
        любой элемент
          ├─ идентификация       id · class · slot · part · is
          ├─ данные              data-* · itemscope/itemprop (микроразметка)
          ├─ язык и текст        lang · dir · translate · spellcheck · autocapitalize
          ├─ видимость и доступ  hidden · inert · popover · tabindex · accesskey · autofocus
          ├─ ввод                contenteditable · inputmode · enterkeyhint · draggable
          ├─ стиль и подсказки   style · title
          └─ ARIA                role · aria-*
        `,
        "Группы глобальных атрибутов",
      ),
      table(
        ["Вы хотите…", "Используйте"],
        [
          ["Ссылаться на элемент (якорь, `label`, ARIA)", "`id`"],
          ["Применить стили или выбрать группу в JS", "`class`"],
          ["Привязать к элементу данные для скрипта", "`data-*`"],
          ["Указать язык фрагмента", "`lang`"],
          ["Скрыть элемент полностью", "`hidden`"],
          ["Сделать область неинтерактивной", "`inert`"],
          ["Не переводить бренд", "`translate=\"no\"`"],
          ["Дать подсказку мышью (необязательную)", "`title`"],
        ],
      ),
    ]),

    section("technical", [
      h("`id`"),
      ul(
        "**Уникален** в документе (в одном теневом дереве — в его пределах). Допустим любой непустой набор символов **без пробелов**; регистр **учитывается** (`Main` ≠ `main`).",
        "**Для чего:** якоря (`#section`), стиль `:target`, `label for`, `aria-labelledby`/`aria-describedby`, `getElementById`, `form=\"id\"`, `popovertarget`.",
        "**Именованный доступ:** элементы с `id` становятся свойствами `window` (`window.myId`) — удобно в демо, но опасно в коде: возможны конфликты и «затенение» (DOM clobbering). Используйте `getElementById`/`querySelector`.",
        "**Генерация:** в компонентах и списках формируйте `id` из стабильного идентификатора (`qty-42`), а не из порядка.",
        "**В CSS** по `id` не стилизуйте — высокая специфичность затрудняет переопределение; используйте классы.",
      ),
      h("`class`"),
      ul(
        "**Список токенов** через пробел: `class=\"card card--featured\"`. Регистр учитывается.",
        "**JS:** `element.className` (строка) и **`classList`** (`add`, `remove`, `toggle`, `contains`, `replace`) — предпочитайте `classList`.",
        "**Назначение:** группировка для стилей и выбор элементов; **не** смысл. Смысл выражают элементы и атрибуты (`<nav>`, `aria-*`).",
        "**Именование:** договоритесь (BEM, утилитарные классы и т.д.) и держите согласованность.",
      ),
      h("`data-*` и `dataset`"),
      code(
        "html",
        `
        <li class="item" data-product-id="42" data-in-stock="true">Кроссовки</li>
        <script>
          const li = document.querySelector(".item");
          li.dataset.productId;     // "42"       (data-product-id → productId)
          li.dataset.inStock;       // "true"     — строка, не boolean!
          li.dataset.lastSeen = "2026-03-14";   // создаст data-last-seen
          delete li.dataset.lastSeen;
        </script>
        `,
        { filename: "data-attributes.html" },
      ),
      ul(
        "**Имя:** `data-` + строчные буквы, цифры и дефисы; в `dataset` дефисы превращаются в camelCase (`data-product-id` → `productId`).",
        "**Значения — строки.** Числа и булевы значения приводите сами (`Number(...)`, `=== \"true\"`).",
        "**В CSS:** `[data-in-stock=\"true\"] { … }` и `attr(data-label)` в `content`.",
        "**Для чего:** идентификаторы, настройки компонентов, состояния для CSS и JS-хуки. **Не** хранилище секретов и не замена семантике (роль и состояние — через ARIA).",
        "**Не изобретайте** собственные атрибуты без `data-`: они невалидны и могут конфликтовать с будущими стандартами.",
      ),
      h("`lang`, `dir`, `translate`, `spellcheck`"),
      ul(
        "**`lang`** (код BCP 47: `ru`, `en`, `pt-BR`) наследуется потомками. На `<html>` — язык страницы; на фрагменте — смена языка (`<q lang=\"fr\">…`). Влияет на произношение скринридера, правила переносов, кавычки и выбор шрифта, переводчик, проверку орфографии, CSS `:lang()`. Не путайте с `hreflang` у ссылки (язык цели).",
        "**`dir`**: `ltr`, `rtl`, `auto`. Для текста справа налево (арабский, иврит). `<bdi>` изолирует пользовательский текст неизвестного направления; `<bdo dir=\"rtl\">` принудительно переопределяет.",
        "**`translate=\"no\"`** просит автопереводчики не переводить содержимое (названия брендов, код). Распространённый запасной приём — класс `notranslate`.",
        "**`spellcheck=\"false\"`** отключает проверку орфографии (логины, коды); **`autocapitalize`**, **`inputmode`**, **`enterkeyhint`** — подсказки экранной клавиатуры (см. тему об автозаполнении).",
      ),
      h("`hidden`, `inert`, `popover`"),
      table(
        ["Способ", "Виден глазам", "Дерево доступности", "Фокус", "Заметка"],
        [
          ["`hidden`", "Нет", "Нет", "Нет", "UA-стиль `display: none`; **перебивается** любым `display` из CSS"],
          ["`hidden=\"until-found\"`", "Нет", "Нет (до раскрытия)", "Нет", "Находится поиском по странице и якорем; поддержка выборочная"],
          ["`inert`", "Да", "Нет", "Нет", "Блокирует и клики; для фона и закрытых панелей"],
          ["`aria-hidden=\"true\"`", "Да", "Нет", "**Да**", "Только для нефокусируемого содержимого"],
          ["`display: none` / `visibility: hidden`", "Нет", "Нет", "Нет", "Стилевое скрытие"],
          ["`popover`", "Только открытый", "Только открытый", "—", "Показ в верхнем слое"],
        ],
      ),
      warn("Правило UA `[hidden] { display: none }` имеет низкую специфичность. Если вы пишете `.card { display: flex }`, атрибут `hidden` на `.card` **перестанет скрывать** элемент. Решение: `[hidden] { display: none !important }` в своём reset или не задавать `display` скрываемым элементам напрямую."),
      h("`tabindex`, `accesskey`, `autofocus`"),
      ul(
        "**`tabindex`**: `0` — в порядок Tab, `-1` — программный фокус, положительные значения — не использовать (см. «Клавиатура и фокус»).",
        "**`accesskey`**: горячая клавиша элемента; сочетания зависят от браузера и платформы, конфликтуют с горячими клавишами ОС и ассистивных технологий — **не рекомендуется**.",
        "**`autofocus`**: фокус при загрузке/открытии диалога; один на страницу, осторожно.",
      ),
      h("`contenteditable`, `draggable`, `inert`"),
      ul(
        "**`contenteditable`**: `true`, `false`, `plaintext-only` (только текст). Сделать редактором можно любой блок, но настоящему редактору нужны ARIA, управление выделением, сохранение и безопасность: используйте проверенные библиотеки.",
        "**`draggable=\"true\"`** разрешает HTML Drag and Drop; обязательно дайте клавиатурную альтернативу (WCAG 2.5.7).",
      ),
      h("`style`, `title`, `nonce`"),
      ul(
        "**`style`**: встроенные стили. Имеют высокий приоритет, не повторно используются; при строгой CSP (`style-src` без `'unsafe-inline'`) **блокируются**. Допустимы для действительно динамических значений (например, `style=\"--progress: 40%\"`).",
        "**`title`**: всплывающая подсказка. На сенсорных экранах и с клавиатуры недоступна, скринридеры озвучивают нестабильно. Не используйте для важной информации и вместо `label`/`alt`.",
        "**`nonce`**: одноразовый токен для CSP (`script-src 'nonce-…'`) — разрешает конкретные встроенные скрипты и стили.",
      ),
      h("Составные и сквозные: `slot`, `part`, `is`, `itemprop`, `role`, `aria-*`"),
      ul(
        "`slot` и `part` — для веб-компонентов; `is` — расширение встроенного элемента; `itemscope`/`itemprop` — микроразметка; `role`, `aria-*` — семантика ARIA.",
        "Все они допустимы на любом элементе, но корректный смысл зависит от элемента (например, `role` ограничен допустимыми значениями — «ARIA in HTML»).",
      ),
      h("Атрибуты событий"),
      p("`onclick`, `onchange` и подобные тоже допустимы на любом элементе, но их применение **не рекомендуется**: смешивает разметку и поведение, усложняет поддержку и несовместимо со строгой CSP. Используйте `addEventListener`."),
      h("Как браузер читает атрибуты"),
      ul(
        "**Имена нечувствительны к регистру** в HTML (`CLASS` = `class`); значения — чувствительны (`id`, `class`).",
        "**Кавычки** обязательны для значений с пробелами; без них достаточно букв, цифр и некоторых символов, но рекомендуют **всегда** писать двойные кавычки.",
        "**Дубликаты:** при повторе атрибута учитывается **первый**, остальные игнорируются (ошибка разбора).",
        "**Отражение (reflection):** многие атрибуты связаны со свойствами: `id`, `className`, `hidden`, `lang`, `dir`, `title`, `tabIndex`, `draggable`, `spellcheck`, `translate`, `inert`.",
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <article id="post-42" class="post post--featured" data-post-id="42" data-category="html"
                 lang="ru" dir="ltr">
          <h2 id="post-42-title">Глобальные атрибуты</h2>

          <p>Бренд <span translate="no">DevDock</span> и цитата
             <q lang="en">Don't repeat yourself</q>.</p>

          <p>Текст пользователя: <bdi>مرحبا</bdi>.</p>

          <details>
            <summary>Подробнее</summary>
            <div hidden id="more">Скрытая часть для скрипта.</div>
          </details>

          <input name="login" spellcheck="false" autocapitalize="none" inputmode="text" autocomplete="username">

          <div contenteditable="plaintext-only" role="textbox" aria-label="Заметка" tabindex="0"></div>

          <aside inert>Закрытая панель: недоступна и невидима для вспомогательных технологий.</aside>

          <button type="button" aria-describedby="hint">Сохранить</button>
          <p id="hint" hidden>Нажмите Ctrl+S для быстрого сохранения.</p>
        </article>
        `,
        { lineNumbers: true, filename: "global-attributes.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <div id="card" class="card is-active" data-user-id="42" data-plan-name="pro" lang="de" hidden>
          <p id="p1">Hallo</p>
        </div>
        <style>#card.show { display: block }</style>

        <script>
          const el = document.getElementById("card");

          console.log("dataset:", JSON.stringify(el.dataset));        // data-user-id → userId
          el.dataset.lastSeen = "2026-03-14";
          console.log("атрибут:", el.getAttribute("data-last-seen"));

          console.log("classList:", [...el.classList].join(","), el.classList.contains("is-active"));
          el.classList.toggle("is-active");
          console.log("className:", el.className);

          console.log("hidden:", el.hidden, "| display:", getComputedStyle(el).display);
          el.classList.add("show");
          console.log("после .show { display: block }: hidden =", el.hidden, "| display:", getComputedStyle(el).display);
          el.classList.remove("show");

          el.setAttribute("hidden", "false");
          console.log("setAttribute('hidden','false') → hidden =", el.hidden);

          console.log("язык абзаца (из предка):", document.getElementById("p1").closest("[lang]").lang);

          document.body.insertAdjacentHTML("beforeend", '<span id="p1">дубль</span>');
          console.log("getElementById('p1'):", document.getElementById("p1").tagName, "| всего с #p1:", document.querySelectorAll("#p1").length);
        </script>
        `,
        { runnable: true },
      ),
      p("Эксперимент показывает пять ловушек: `dataset` преобразует имена в camelCase и хранит строки; `hidden` **перебивается** CSS `display: block`; `hidden=\"false\"` по-прежнему скрывает; `lang` наследуется от предка; при дубликатах `id` `getElementById` вернёт **первый** элемент, но `querySelectorAll` найдёт оба."),
    ]),

    section("detailed-example", [
      p("Карточки товаров с фильтрацией на `data-*` и классах: JS читает данные из атрибутов, CSS показывает состояние, а `hidden` прячет отфильтрованное. Заметьте, что скрытие делается атрибутом, но `display` у `.card` не задан, чтобы `hidden` работал."),
      code(
        "html",
        `
        <fieldset>
          <legend>Категория</legend>
          <label><input type="radio" name="cat" value="all" checked> Все</label>
          <label><input type="radio" name="cat" value="shoes"> Обувь</label>
          <label><input type="radio" name="cat" value="shirts"> Футболки</label>
        </fieldset>
        <p id="count" role="status"></p>

        <ul class="cards">
          <li class="card" data-category="shoes" data-price="5990">Кроссовки</li>
          <li class="card" data-category="shoes" data-price="7490">Кеды</li>
          <li class="card" data-category="shirts" data-price="1490">Футболка</li>
        </ul>

        <style>
          .cards { list-style: none; padding: 0; display: grid; gap: .5rem; }
          .card { padding: .5rem; border: 1px solid #888; }
          .card[data-price]::after { content: " — " attr(data-price) " ₽"; opacity: .7; }
          [hidden] { display: none !important; }   /* страхуем hidden от переопределения */
        </style>

        <script>
          const cards = document.querySelectorAll(".card");
          const count = document.getElementById("count");
          document.querySelectorAll('input[name="cat"]').forEach((r) =>
            r.addEventListener("change", () => {
              let shown = 0;
              cards.forEach((c) => {
                const visible = r.value === "all" || c.dataset.category === r.value;
                c.hidden = !visible;
                if (visible) shown++;
              });
              count.textContent = "Показано товаров: " + shown;
            }));
        </script>
        `,
        { lineNumbers: true, filename: "filter-cards.html", collapsed: true },
      ),
      ul(
        "**`data-category`, `data-price`** — данные для скрипта и CSS (`attr(data-price)`), а не для скринридера.",
        "**`hidden`** скрывает элемент целиком, включая дерево доступности и фокус; свойство `hidden` связано с атрибутом.",
        "**`[hidden] { display: none !important }`** — защита от случайного перебития.",
        "**`role=\"status\"`** объявляет число найденных товаров, не отнимая фокус.",
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <div id="box" class="a b" data-user-id="7" hidden></div>
        <p lang="fr">Bonjour</p>
        <span translate="no">DevDock</span>
        <input spellcheck="false" autocapitalize="none">
        <section inert>…</section>
        <label for="name">Имя</label><input id="name">
        `,
        [
          { line: 1, text: "`id` — уникальная метка; `class` — два токена; `data-user-id` станет `dataset.userId`; `hidden` — булев атрибут: наличие достаточно (значения не нужно)." },
          { line: 2, text: "`lang=\"fr\"` задаёт язык фрагмента: скринридер переключит произношение, переводчик поймёт, что текст уже французский (WCAG 3.1.2 Language of Parts)." },
          { line: 3, text: "`translate=\"no\"` просит автопереводчик оставить название бренда как есть." },
          { line: 4, text: "Для логина и кодов выключают проверку орфографии и автозаглавные буквы (`autocapitalize=\"none\"`)." },
          { line: 5, text: "`inert` делает секцию неинтерактивной и скрытой от вспомогательных технологий, не меняя внешнего вида — удобно для фона под окном." },
          { line: 6, text: "Связь `label for=\"name\"` работает только если `id=\"name\"` **уникален**; при дубликате метка свяжется с первым элементом." },
        ],
        "global-annotated.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Разбор атрибутов", "Токенайзер читает пары «имя=значение», приводит имена к нижнему регистру, учитывает кавычки; при повторе атрибута сохраняется первый. Атрибуты попадают в `element.attributes`."],
          ["Отражение в свойства", "Для многих атрибутов браузер определяет **IDL-свойства** (`id`, `className`, `hidden`, `tabIndex`, `lang`, `title`, `dataset`), которые читают и записывают атрибуты. Запись `el.hidden = true` ставит атрибут `hidden`; `el.dataset.x = \"1\"` — `data-x=\"1\"`."],
          ["Влияние на стили", "Атрибуты участвуют в каскаде: селекторы `[hidden]`, `[data-x=\"1\"]`, `:lang(ru)`, `:dir(rtl)`, `.class`, `#id`; UA-стили задают, например, `[hidden] { display: none }` с низким приоритетом."],
          ["Влияние на дерево доступности", "`hidden`, `inert`, `lang`, `title` (как запасное имя/описание), `role`, `aria-*` участвуют в вычислении роли, имени и состояния."],
          ["Влияние на поведение", "`tabindex`, `contenteditable`, `draggable`, `autofocus`, `inert`, `popover` меняют поведение браузера без JS (фокус, ввод, перетаскивание, слой)."],
          ["Уникальность `id`", "Браузер **не проверяет** уникальность `id`. Возвращает первый подходящий элемент для `getElementById` и `label for`; остальные становятся «невидимыми» для связей — именно поэтому дубликаты трудно заметить."],
        ],
        "Что делает браузер с атрибутами",
      ),
      note("Различайте **атрибут** (то, что записано в разметке) и **свойство** (состояние объекта в DOM): `input.value` и атрибут `value` — не одно и то же; а вот `id`, `className`, `hidden` и `dataset` отражаются в атрибуты напрямую."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Дубликаты `id`"),
      wrongRight(
        "html",
        {
          code: `
            <label for="name">Имя</label><input id="name">
            <label for="name">Название</label><input id="name">
          `,
          note: "Обе метки связаны с **первым** полем; второе остаётся без имени.",
        },
        {
          code: `
            <label for="user-name">Имя</label><input id="user-name">
            <label for="company-name">Название</label><input id="company-name">
          `,
          note: "Уникальные `id` — осмысленные и стабильные.",
        },
      ),
      h("Ошибка 2. `hidden=\"false\"`"),
      p("Это **не** отменяет скрытия: булев атрибут включён самим фактом присутствия. Убирайте его: `removeAttribute(\"hidden\")` или `el.hidden = false`."),
      h("Ошибка 3. `display` перебивает `hidden`"),
      wrongRight(
        "css",
        {
          code: `
            .card { display: flex; }
            /* <div class="card" hidden> — всё равно виден! */
          `,
          note: "Стиль автора перекрывает UA-правило `[hidden] { display: none }`.",
        },
        {
          code: `
            [hidden] { display: none !important; }
            .card { display: flex; }
          `,
          note: "Явная защита `hidden` в вашем reset-е.",
        },
      ),
      h("Ошибка 4. Самодельные атрибуты вместо `data-*`"),
      wrongRight(
        "html",
        {
          code: `
            <div product-id="42" is-featured="true"></div>
          `,
          note: "Невалидно: нестандартные атрибуты могут столкнуться с будущими стандартами и ломают валидаторы.",
        },
        {
          code: `
            <div data-product-id="42" data-featured="true"></div>
          `,
          note: "`data-*` — единственный стандартный способ хранить свои данные.",
        },
      ),
      h("Ошибка 5. `title` как подпись или единственная инструкция"),
      p("Подсказки по наведению недоступны на сенсорных экранах и клавиатуре; скринридеры озвучивают их по-разному. Нужные подписи — видимые (`label`, текст), а `title` — дополнение."),
      h("Ошибка 6. Неверный или отсутствующий `lang`"),
      p("`lang=\"en\"` на русской странице заставляет скринридер читать русский текст с английским произношением. Для вставок на другом языке — `lang` на элементе."),
      h("Ошибка 7. `data-*` как хранилище состояния и секретов"),
      p("Атрибуты видны любому пользователю и расширению. Не храните там токены и персональные данные; состояние интерфейса, значимое для вспомогательных технологий, оформляйте ARIA (`aria-expanded`, `aria-selected`)."),
      h("Ошибка 8. Обработчики в атрибутах `on*`"),
      p("`<button onclick=\"save()\">` смешивает поведение и разметку, усложняет поддержку и блокируется строгой CSP. Вешайте обработчики через `addEventListener`."),
    ]),

    section("antipatterns", [
      ul(
        "**Стилизация и скрипты через `id`** на каждом шагу: высокая специфичность и хрупкая связность.",
        "**`class=\"hidden\"` вместо атрибута `hidden`** без необходимости: теряется нативная семантика.",
        "**«Классы как смысл»** (`class=\"navigation\"` вместо `<nav>`).",
        "**`style=\"…\"` повсюду:** невозможность переиспользования, блокировка CSP.",
        "**`accesskey` на всём** — конфликт с горячими клавишами.",
        "**`contenteditable` вместо `textarea`** для простого ввода.",
        "**`tabindex=\"0\"` на нейтральных блоках.**",
        "**Глобальные переменные через `id`** (`window.mainMenu`).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Уникальные, осмысленные `id`** только там, где нужна ссылка; для стилей — классы.",
        "**`class` — для оформления и выборки;** договорённая методология именования.",
        "**`data-*` — для данных скрипта;** значения приводите к нужным типам; не храните секреты.",
        "**`lang` на `<html>` и на фрагментах,** `dir` для RTL, `<bdi>` для пользовательского текста.",
        "**`hidden` для полного скрытия;** защитите его (`[hidden]{display:none!important}`); для фона — `inert`.",
        "**`translate=\"no\"`** для брендов и кода.",
        "**`title` — только как дополнение;** важное — видимым текстом.",
        "**Обработчики — в JS,** а не в `on*`-атрибутах.",
        "**`style` только для динамических значений** (переменные CSS), остальное — в таблицах стилей.",
        "**Проверяйте валидатором:** он найдёт дубликаты `id`, неизвестные атрибуты и ошибки значений.",
      ),
    ]),

    section("edge-cases", [
      h("`id` и якоря"),
      p("Фрагмент `#Section` ищет элемент по `id` с учётом регистра; если `id` нет, браузер пробует `name` у `<a>`. Якорная навигация прокручивает страницу и устанавливает стартовую точку для Tab. Для фиксированной шапки используйте `scroll-margin-top`."),
      h("Символы в `id` и CSS"),
      p("В HTML `id` может содержать почти любые символы (кроме пробелов), но в CSS-селекторе цифра в начале или двоеточие требуют экранирования (`#\\31 23`, `#a\\:b`). Используйте безопасные идентификаторы: латиница, цифры, дефис."),
      h("`class` и пустое значение"),
      p("`class=\"\"` допустим. Дубликаты токенов (`class=\"a a\"`) не вредят, но избыточны. Классы — регистрозависимы (в режиме «no quirks»)."),
      h("`data-*` и типы"),
      p("`dataset.count = 5` запишет `\"5\"`; `dataset.flag = false` — `\"false\"`, и `if (el.dataset.flag)` будет истинным. Сравнивайте строки явно."),
      h("`lang` и `hreflang`, `xml:lang`"),
      p("`lang` — язык содержимого элемента; `hreflang` у `<a>` — язык целевого документа. В HTML используется `lang`; `xml:lang` нужен только в XHTML."),
      h("`contenteditable` и безопасность"),
      p("Содержимое редактируемого блока — пользовательский ввод: перед сохранением его нужно очищать (санитизировать). `plaintext-only` снижает риск вставки разметки."),
      h("`inert` и `hidden`"),
      p("`inert` не скрывает визуально: пользователь **видит** содержимое, но не может с ним взаимодействовать, и оно пропадает из дерева доступности. Для закрытой панели, которой пользователь пока не нужен, подходит `hidden`."),
      h("`slot` и `part` вне компонентов"),
      p("Атрибуты `slot` и `part` формально допустимы на любом элементе, но осмысленны только внутри веб-компонентов; вне их ничего не делают."),
    ]),

    section("related", [
      ul(
        "[Элементы и атрибуты](/learn/html/elements-attributes) — синтаксис атрибутов, булевы значения.",
        "[Клавиатура и фокус](/learn/html/keyboard-focus) — `tabindex`, `inert`, `autofocus`.",
        "[ARIA](/learn/html/aria) — `role` и `aria-*` как глобальные атрибуты.",
        "[Шаблоны и Custom Elements](/learn/html/templates-custom-elements) — `slot`, `part`, `is`.",
        "[Автозаполнение и UX форм](/learn/html/form-ux-autocomplete) — `inputmode`, `enterkeyhint`, `autocapitalize`.",
        "[Безопасность HTML](/learn/html/html-security) — `nonce`, CSP и встроенные обработчики.",
        "Из других курсов: **CSS** — селекторы `[attr]`, `:lang()`, `:dir()`, `attr()`; **JS** — `classList`, `dataset`, `closest`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Нестандартная разметка",
          code: `
            <div product-id="42" is-featured="true" class="hidden" onclick="open(this)" style="color:#999">
              <span id="name">Кроссовки</span>
              <span id="name">Цена</span>
            </div>
          `,
          note: "Самодельные атрибуты; дубликаты `id`; скрытие классом; обработчик в атрибуте; встроенный стиль с низким контрастом.",
        },
        {
          title: "Стандартная разметка",
          code: `
            <div data-product-id="42" data-featured="true" hidden>
              <span id="product-42-name">Кроссовки</span>
              <span id="product-42-price">Цена</span>
            </div>
            <script>
              document.querySelector("[data-product-id]").addEventListener("click", open);
            </script>
          `,
          note: "`data-*`, уникальные `id`, нативный `hidden`, обработчик в JS, оформление — в CSS.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.global-attributes.ex1",
      title: "Какой атрибут нужен?",
      difficulty: "foundation",
      kind: "recall",
      prompt: [
        p("Назовите глобальный атрибут (и значение), решающий задачу:"),
        ol(
          "Не переводить название бренда автопереводчиком.",
          "Указать, что цитата написана по-французски.",
          "Спрятать блок полностью (глаз, скринридер, фокус).",
          "Сделать фон неинтерактивным под окном (но видимым).",
          "Сохранить id товара для скрипта.",
          "Запретить проверку орфографии у поля логина.",
          "Сделать блок редактируемым в виде простого текста.",
          "Показать направление текста справа налево для блока на арабском.",
        ),
      ],
      hints: ["Булевы атрибуты не требуют значения.", "Какой атрибут отвечает за язык?"],
      checks: ["Все восемь атрибутов названы верно"],
      solution: [
        ol(
          "`translate=\"no\"`",
          "`lang=\"fr\"`",
          "`hidden`",
          "`inert`",
          "`data-product-id=\"…\"`",
          "`spellcheck=\"false\"`",
          "`contenteditable=\"plaintext-only\"`",
          "`dir=\"rtl\"` (и `lang=\"ar\"`)",
        ),
      ],
    }),
    exercise({
      id: "html.global-attributes.ex2",
      title: "Фильтр товаров на data-атрибутах",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сделайте список из пяти задач с атрибутами `data-status` (`todo`/`done`) и `data-priority` (число 1–3). Добавьте кнопки-фильтры («Все», «Сделано», «Приоритет 1»). Скрывайте отфильтрованное атрибутом `hidden` (учтите защиту от перебития), выводите число показанных элементов в `role=\"status\"` и подсвечивайте приоритет 1 селектором по `data-priority`. Без `onclick`-атрибутов."),
      ],
      hints: ["Как сравнить строку из `dataset` с числом?", "Что защищает `hidden`?", "Как стилизовать по атрибуту?"],
      checks: ["`data-*` в разметке", "`hidden` + `[hidden]{display:none!important}`", "Подсчёт в `role=\"status\"`", "Обработчики через `addEventListener`"],
      solution: [
        code(
          "html",
          `
          <div role="group" aria-label="Фильтры">
            <button type="button" data-filter="all" aria-pressed="true">Все</button>
            <button type="button" data-filter="done" aria-pressed="false">Сделано</button>
            <button type="button" data-filter="p1" aria-pressed="false">Приоритет 1</button>
          </div>
          <p id="count" role="status"></p>

          <ul id="tasks">
            <li data-status="todo" data-priority="1">Написать тесты</li>
            <li data-status="done" data-priority="2">Обновить зависимости</li>
            <li data-status="todo" data-priority="3">Починить фавикон</li>
            <li data-status="done" data-priority="1">Релиз 1.2</li>
            <li data-status="todo" data-priority="2">Документация</li>
          </ul>

          <style>
            [hidden] { display: none !important; }
            [data-priority="1"] { font-weight: 700; border-left: 4px solid #c0392b; padding-left: .5rem; }
          </style>

          <script>
            const items = document.querySelectorAll("#tasks li");
            const count = document.getElementById("count");
            const buttons = document.querySelectorAll("[data-filter]");

            function apply(filter) {
              let shown = 0;
              items.forEach((li) => {
                const ok = filter === "all"
                  || (filter === "done" && li.dataset.status === "done")
                  || (filter === "p1" && Number(li.dataset.priority) === 1);
                li.hidden = !ok;
                if (ok) shown++;
              });
              buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
              count.textContent = "Показано задач: " + shown;
            }

            buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter)));
            apply("all");
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
      ],
    }),
    exercise({
      id: "html.global-attributes.ex3",
      title: "Скрыто, но видно",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Жалобы: «блок с `hidden` всё равно виден», «после `setAttribute('hidden','false')` блок не появляется», «метка подписывает не то поле», «скринридер читает русский текст с английским акцентом», «переводчик испортил название бренда», «в `dataset.flag` лежит `false`, но `if` срабатывает». Найдите причины и исправьте."),
      ],
      starter: {
        lang: "html",
        code: `
          <html lang="en">
          <style>.panel { display: flex; }</style>
          <div class="panel" hidden>Скрытая панель</div>
          <script>
            panel.setAttribute("hidden", "false");
          </script>

          <label for="q">Поиск</label><input id="q">
          <label for="q">Город</label><input id="q">

          <h1>Добро пожаловать в DevDock</h1>
          <div id="box" data-flag="false"></div>
          <script>
            if (box.dataset.flag) console.log("флаг включён");
          </script>
        `,
      },
      hints: ["Что делает `display` из CSS с `hidden`?", "Как отключить булев атрибут?", "Что с дублем `id`?", "Что делает `lang=\"en\"` на русской странице?", "Какой тип у значения в `dataset`?"],
      checks: ["`[hidden]{display:none!important}`", "`removeAttribute`/`hidden=false`", "Уникальные `id`", "`lang=\"ru\"`, `translate=\"no\"`", "`dataset.flag === \"true\"`"],
      solution: [
        ul(
          "**CSS `display: flex`** перекрывает UA-правило `hidden` → добавить `[hidden] { display: none !important }`.",
          "**`hidden=\"false\"`** остаётся включённым → `el.hidden = false` или `removeAttribute(\"hidden\")`.",
          "**Дубликат `id=\"q\"`** → уникальные `id` (`search`, `city`) и соответствующие `for`.",
          "**`lang=\"en\"` на русской странице** → `lang=\"ru\"`; бренд — `translate=\"no\"`.",
          "**`dataset.flag` — строка** `\"false\"`, она истинна → сравнивайте `=== \"true\"`.",
          "**Глобальный доступ `panel`/`box` по `id`** — используйте `getElementById`.",
        ),
        code(
          "html",
          `
          <html lang="ru">
          <style>
            [hidden] { display: none !important; }
            .panel { display: flex; }
          </style>
          <div class="panel" id="panel" hidden>Скрытая панель</div>
          <script>
            document.getElementById("panel").hidden = false;
          </script>

          <label for="search">Поиск</label><input id="search">
          <label for="city">Город</label><input id="city">

          <h1>Добро пожаловать в <span translate="no">DevDock</span></h1>
          <div id="box" data-flag="false"></div>
          <script>
            if (document.getElementById("box").dataset.flag === "true") console.log("флаг включён");
          </script>
          `,
          { lineNumbers: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.global-attributes.challenge",
    title: "Разметка для интерфейса на пяти языках с правилами атрибутов",
    scenario: [
      p("Продукт открывается на рынок Ближнего Востока и Европы: добавляются арабский (RTL), иврит, французский и немецкий. В интерфейсе есть имена пользователей на разных алфавитах, названия брендов, коды промокодов, редактируемые заметки и динамические списки. Команда столкнулась с «поломкой» RTL-текста, неправильным произношением скринридера, переводом названий и промокодов автопереводчиками, дубликатами `id` в повторяющихся компонентах и «невидимыми» блоками."),
      p("Составьте набор правил по глобальным атрибутам для разметки и компонентов, с примерами и автоматическими проверками."),
    ],
    requirements: [
      "Правила для `lang`/`dir`/`<bdi>`/`translate` с примерами разметки",
      "Правила генерации `id` в повторяющихся компонентах (без дубликатов)",
      "Правила для `hidden`/`inert` и защитный CSS",
      "Правила для `data-*` и типов значений",
      "Автоматические проверки (линтер/CI)",
    ],
    constraints: [
      "Пользовательский текст нельзя считать направленным слева направо",
      "Коды промокодов и бренды не должны переводиться",
      "`id` не должны дублироваться при множественном использовании компонента",
    ],
    acceptance: [
      "Страница задаёт `lang` и `dir` на `<html>`; фрагменты — свои",
      "Имена пользователей обёрнуты в `<bdi>`",
      "Промокоды и бренды помечены `translate=\"no\"`",
      "Линтер ловит дубликаты `id`, неизвестные атрибуты и `hidden=\"false\"`",
    ],
    hints: [
      "Что произойдёт с пунктуацией, если имя на иврите стоит в русском предложении?",
      "Как гарантировать уникальность `id` в компоненте, используемом много раз?",
      "Что можно проверить статически?",
    ],
    solution: [
      table(
        ["Область", "Правило", "Пример"],
        [
          ["Язык страницы", "`lang` и `dir` на `<html>` из локали пользователя", "`<html lang=\"ar\" dir=\"rtl\">`"],
          ["Вставки на другом языке", "`lang` на элементе (3.1.2); для цитат — `<q lang>`", "`<q lang=\"fr\">…</q>`"],
          ["Пользовательские имена и сообщения", "`<bdi>` вокруг данных пользователя неизвестного направления", "`Автор: <bdi>${name}</bdi>` (через безопасную подстановку)"],
          ["Принудительное направление", "`<bdo dir>` только для демонстраций/особых случаев", "—"],
          ["Бренды, код, промокоды", "`translate=\"no\"` (и `class=\"notranslate\"` как запасной)", "`<code translate=\"no\">SPRING25</code>`"],
          ["Идентификаторы", "`id` = префикс компонента + стабильный ключ", "`id=\"qty-<productId>\"`"],
          ["Скрытие", "`hidden` для полного скрытия; `inert` для фона; защитный `[hidden]{display:none!important}`", "—"],
          ["Данные", "`data-*`; значения — строки; типы приводятся явно; секретов нет", "`data-price=\"5990\"`"],
          ["Подсказки", "Видимый текст; `title` — только дополнение", "—"],
        ],
      ),
      code(
        "html",
        `
        <html lang="ar" dir="rtl">
        <body>
          <p>المؤلف: <bdi>Иван Петров</bdi> — <bdi>דוד כהן</bdi></p>
          <p>رمز الخصم: <code translate="no">SPRING25</code></p>
          <p>اسم العلامة: <span translate="no">DevDock</span></p>
          <blockquote lang="fr"><p>La vie est belle.</p></blockquote>

          <ul>
            <li><label for="qty-42">الكمية</label> <input id="qty-42" type="number" min="1"></li>
            <li><label for="qty-43">الكمية</label> <input id="qty-43" type="number" min="1"></li>
          </ul>
        </body>
        </html>
        `,
        { lineNumbers: true, filename: "i18n-attributes.html", collapsed: true },
      ),
      ul(
        "**Двунаправленный текст:** `<bdi>` изолирует вставку, чтобы направление и знаки препинания не «перепрыгивали» в соседний текст; значения в атрибутах (`dir=\"auto\"`) подходят для полей ввода.",
        "**Генерация `id`:** компонент принимает уникальный ключ (`productId`) и формирует `id` и `for` из него; в Custom Elements связи держат внутри теневого дерева, где `id` изолированы.",
        "**Проверки:** html-validate/ESLint-плагины: `no-dup-id`, `no-unknown-attributes`, `no-redundant-role`, `valid-lang`; тест, что `[hidden]` не перебивается (проверка вычисленного `display`); линтер запрещает `hidden=\"false\"`, `accesskey`, `tabindex>0`, обработчики `on*`.",
        "**Тестирование:** страницы на арабском и иврите в e2e (скриншоты с RTL), прогон скринридером на каждом языке, автоперевод браузера — проверка, что бренды и промокоды не переведены.",
      ),
    ],
  },

  interview: [
    iq("html.global-attributes.i1", "basic", "Что такое глобальные атрибуты? Назовите пять.", [
      p("Атрибуты, допустимые на любом HTML-элементе: `id`, `class`, `style`, `title`, `lang`, `dir`, `hidden`, `tabindex`, `data-*`, `contenteditable`, `inert` и др., а также `role` и `aria-*`."),
    ]),
    iq("html.global-attributes.i2", "basic", "Как работают `data-*` атрибуты и как к ним обратиться из JS?", [
      p("Пользовательские данные хранятся в `data-имя-через-дефис` и доступны как `element.dataset.имяЧерезДефис` (camelCase). Значения — всегда строки; типы приводят вручную."),
    ]),
    iq("html.global-attributes.i3", "intermediate", "Почему блок с атрибутом `hidden` иногда остаётся видимым?", [
      p("`hidden` реализуется UA-стилем `[hidden] { display: none }` с низким приоритетом. Если для элемента задан `display` в CSS автора (`display: flex`), он перекрывает правило. Решение: `[hidden] { display: none !important }`."),
    ]),
    iq("html.global-attributes.i4", "intermediate", "Что произойдёт при `hidden=\"false\"`?", [
      p("Ничего хорошего: булев атрибут включён самим присутствием; блок остаётся скрытым. Нужно удалить атрибут (`removeAttribute`) или установить `el.hidden = false`."),
    ]),
    iq("html.global-attributes.i5", "intermediate", "Чем `hidden`, `inert`, `aria-hidden` и `display: none` отличаются?", [
      ul(
        "`hidden`/`display: none` — полностью скрывают: от глаз, дерева доступности и фокуса.",
        "`inert` — элемент виден, но недоступен для взаимодействия и скрыт от вспомогательных технологий.",
        "`aria-hidden=\"true\"` — скрывает только от дерева доступности; фокусируемые элементы остаются достижимыми (ошибка).",
      ),
    ]),
    iq("html.global-attributes.i6", "advanced", "Какие требования к `id` и что ломается при дубликатах?", [
      p("`id` должен быть уникален в документе (или теневом дереве), непустым и без пробелов. При дубликатах `label for`, `aria-labelledby`, якоря и `getElementById` работают с первым элементом, остальные теряют связи. Браузер не предупреждает — нужны валидатор и линтер."),
    ]),
    iq("html.global-attributes.i7", "engineering", "Как вы организуете работу с `lang` и `dir` в многоязычном продукте?", [
      ul(
        "`lang` и `dir` на `<html>` из локали; фрагменты других языков — свой `lang`.",
        "`<bdi>`/`dir=\"auto\"` для пользовательских данных; логические CSS-свойства (`margin-inline-start`).",
        "`translate=\"no\"` для брендов и кода; тесты RTL и автоперевода.",
        "Линтер и e2e для проверки атрибутов и вёрстки.",
      ),
    ]),
    iq("html.global-attributes.i8", "debugging", "Метка подписывает не то поле формы. Как диагностировать?", [
      ul(
        "Проверить `for` и `id` на совпадение и **уникальность** (`document.querySelectorAll(\"#id\").length`).",
        "Посмотреть дерево доступности: имя поля и источник.",
        "Убедиться, что элементы не в разных теневых деревьях.",
        "Подключить валидатор/линтер для обнаружения дубликатов.",
      ),
    ]),
  ],

  exam: [
    mcq("html.global-attributes.e1", "foundation", "Как обратиться из JS к `data-user-id=\"7\"`?", ["`el.userId`", "`el.dataset.userId`", "`el.data.user-id`", "`el.getData(\"userId\")`"], 1, "`dataset` преобразует `data-user-id` в `userId`."),
    mcq("html.global-attributes.e2", "foundation", "Какой атрибут полностью скрывает элемент без CSS?", ["`visible=\"false\"`", "`hidden`", "`display=\"none\"`", "`aria-hidden`"], 1, "`hidden` — булев глобальный атрибут: элемент скрыт и от глаз, и от вспомогательных технологий."),
    mcq("html.global-attributes.e3", "intermediate", "Что вернёт `el.hidden` после `el.setAttribute(\"hidden\", \"false\")`?", ["`false`", "`true`", "`undefined`", "`\"false\"`"], 1, "Булев атрибут включён самим фактом присутствия."),
    mcq("html.global-attributes.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["`id` должен быть уникальным", "`title` надёжно заменяет `label`", "`lang` наследуется потомками", "`dataset` хранит значения как строки"], [0, 2, 3], "`title` не заменяет подпись: недоступен на сенсорных экранах и нестабильно озвучивается."),
    mcq("html.global-attributes.e5", "intermediate", "Что делает `translate=\"no\"`?", ["Отключает проверку орфографии", "Просит автопереводчики не переводить содержимое", "Меняет язык", "Скрывает текст"], 1, "Атрибут сообщает инструментам перевода, что содержимое переводить не нужно (бренды, код)."),
    mcq("html.global-attributes.e6", "advanced", "Какой способ делает область неинтерактивной, оставляя её видимой?", ["`hidden`", "`inert`", "`aria-hidden=\"true\"`", "`visibility: hidden`"], 1, "`inert` блокирует взаимодействие и скрывает область от вспомогательных технологий, не меняя внешний вид."),
    open("html.global-attributes.e7", "intermediate", "Объясните, почему не стоит использовать самодельные атрибуты (`product-id`) и что применять вместо них.", [
      ul(
        "Нестандартные атрибуты невалидны и могут конфликтовать с будущими атрибутами HTML.",
        "Стандартный механизм — `data-*`: гарантированно зарезервирован для авторов, доступен через `dataset` и CSS-селекторы.",
        "Для состояния, значимого для вспомогательных технологий, нужны ARIA-атрибуты, а не `data-*`.",
      ),
    ], ["Названа невалидность и риск конфликтов", "Названы `data-*` и `dataset`", "Упомянута роль ARIA для состояния"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.global-attributes.m1", "intermediate", "Элемент `<div class=\"card\" hidden>` виден при `.card { display: grid }`. Почему?", ["`hidden` не работает на `div`", "Правило автора перекрывает UA-стиль `[hidden]`", "Браузер игнорирует `hidden`", "`hidden` работает только с `p`"], 1, "UA-стиль имеет низкий приоритет; нужно защитить его правилом `[hidden]{display:none!important}`."),
    mcq("html.global-attributes.m2", "advanced", "Почему `window.myId` для элемента с `id=\"myId\"` — плохая практика?", ["Не работает в Chrome", "Именованный доступ может конфликтовать со свойствами и допускает DOM clobbering", "Он медленный", "Он запрещён HTML"], 1, "Элементы с `id` затеняют глобальные имена и делают код хрупким и уязвимым."),
    mcq("html.global-attributes.m3", "advanced", "Как правильно оформить имя пользователя, вставляемое в предложение на арабском?", ["Как есть", "Обернуть в `<bdi>`", "Обернуть в `<b>`", "Добавить `translate=\"no\"`"], 1, "`<bdi>` изолирует направление пользовательского текста от окружения."),
    open("html.global-attributes.m4", "advanced", "Ревью показало на странице 14 дубликатов `id`, 6 блоков с `hidden=\"false\"` и классы вместо `hidden`. Какой план исправления и профилактики?", [
      ul(
        "Найти и исправить дубликаты `id` (генерация из ключей компонентов), перепривязать `label for`/ARIA-ссылки.",
        "Заменить `hidden=\"false\"` удалением атрибута, а `class=\"hidden\"` — нативным `hidden` с защитным CSS.",
        "Добавить линтер/валидатор в CI (`no-dup-id`, `no-redundant-attr`), тесты вычисленного `display`.",
        "Описать правила в руководстве по стилю и ревью-чек-листе.",
      ),
    ], ["Исправление дубликатов `id`", "Правильное использование `hidden`", "Автоматические проверки и документирование правил"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.global-attributes.f1", front: "Булев атрибут?", back: "Наличие = true. `hidden=\"false\"` — всё равно true. Убирайте атрибут." },
    { id: "html.global-attributes.f2", front: "`data-*`?", back: "Данные для скрипта и CSS; `dataset.camelCase`; значения — строки." },
    { id: "html.global-attributes.f3", front: "`hidden` vs `inert` vs `aria-hidden`?", back: "hidden — скрыт полностью; inert — виден, но неинтерактивен; aria-hidden — скрыт только от AT (фокус остаётся)." },
    { id: "html.global-attributes.f4", front: "Почему `hidden` бывает «не работает»?", back: "CSS `display` автора перебивает UA-правило. Защита: `[hidden]{display:none!important}`." },
    { id: "html.global-attributes.f5", front: "`lang` vs `hreflang`?", back: "`lang` — язык содержимого; `hreflang` — язык цели ссылки." },
    { id: "html.global-attributes.f6", front: "Пользовательский текст неизвестного направления?", back: "`<bdi>` (или `dir=\"auto\"`)." },
  ],

  sources: [
    { title: "HTML Living Standard — Global attributes", url: "https://html.spec.whatwg.org/multipage/dom.html#global-attributes", publisher: "WHATWG" },
    { title: "MDN: Global attributes", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes", publisher: "MDN" },
    { title: "MDN: Using data attributes", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes", publisher: "MDN" },
    { title: "MDN: hidden", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden", publisher: "MDN" },
    { title: "MDN: inert", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert", publisher: "MDN" },
    { title: "W3C: Language tags in HTML and XML", url: "https://www.w3.org/International/articles/language-tags/", publisher: "W3C" },
  ],
};
