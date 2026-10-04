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

export const interactiveElements: Topic = {
  id: "html.interactive-elements",
  slug: "interactive-elements",
  domain: "html",
  module: "advanced",
  title: "Интерактивные элементы: details, dialog, popover",
  titleEn: "Native interactivity: details/summary, dialog, the Popover API, inert, hidden=until-found",
  summary:
    "Раскрывающиеся блоки, модальные окна и всплывающие панели можно сделать без библиотек и почти без JavaScript: платформа даёт `<details>`, `<dialog>` и атрибут `popover` с готовым фокусом, клавиатурой, слоем «поверх всего» и семантикой. Тема учит выбирать нужный элемент и пользоваться им правильно.",
  minutes: 60,
  prerequisites: ["html.keyboard-focus", "html.aria", "html.form-controls"],
  tags: ["details", "summary", "dialog", "showModal", "popover", "popovertarget", "top layer", "backdrop", "inert", "hidden until-found", "accordion", "modal", "light dismiss", "toggle event"],
  keyConcepts: [
    { term: "Нативное раскрытие", text: "`<details>` с `<summary>` — раскрывающийся блок с клавиатурой, состоянием и работой без JS. Атрибут `name` объединяет блоки в аккордеон." },
    { term: "dialog", text: "`showModal()` открывает **модальное** окно: остальная страница инертна, Esc закрывает, фокус возвращается. `show()` — немодальное." },
    { term: "popover", text: "Атрибут `popover` + `popovertarget` у кнопки: всплывающая панель без JS, со слоем «поверх всего» и закрытием по клику снаружи и Esc." },
    { term: "Верхний слой (top layer)", text: "Модальные `dialog` и открытые popover отображаются поверх всего, независимо от `z-index` и `overflow` предков." },
    { term: "Семантика не «бесплатна»", text: "Меню, подсказки и комбобоксы всё равно требуют ARIA и клавиатурной модели; `popover` лишь даёт механизм показа." },
  ],
  sections: [
    section("definition", [
      def("<details> и <summary>", "`<details>` — раскрывающийся блок «заголовок + содержимое». `<summary>` — первый дочерний элемент: видимый заголовок и переключатель. Состояние хранится в булевом атрибуте `open`; при смене срабатывает событие `toggle`.", "disclosure widget"),
      def("<dialog>", "Элемент диалогового окна. `showModal()` открывает его как **модальное** (в верхнем слое, остальной документ инертен), `show()` — как немодальное, `close()` — закрывает и записывает `returnValue`.", "dialog element"),
      def("Popover (атрибут popover)", "Глобальный атрибут, превращающий элемент во всплывающий слой в верхнем слое. Показ управляется кнопкой с `popovertarget` или методами `showPopover()`, `hidePopover()`, `togglePopover()`. У значения `auto` есть «лёгкое закрытие» (клик снаружи, Esc).", "Popover API"),
    ]),

    section("why", [
      h("Каждый проект делает одно и то же"),
      p("Аккордеон FAQ, подтверждение удаления, меню профиля, подсказка «что это», окно настроек. Исторически для каждого из них писали `div`, `z-index`, обработчики кликов, ловушки фокуса и ARIA-атрибуты — и почти каждая реализация содержала ошибки: Esc не закрывает, фокус остаётся за окном, скринридер не знает о состоянии, фон прокручивается."),
      p("Платформа теперь делает эту работу сама. Нативный `<dialog>` уже умеет **инертность фона, фокус, Esc и возврат фокуса**; `<details>` — **роль, состояние и клавиатуру**; `popover` — **слой поверх всего и лёгкое закрытие**. Меньше кода — меньше ошибок и лучше доступность."),
      h("Прогрессивное улучшение"),
      p("`<details>` и `popovertarget` работают без единой строки JavaScript. Это значит: даже если скрипт не загрузился, пользователь сможет раскрыть вопрос FAQ или открыть панель. Для `<dialog>` JavaScript нужен для `showModal()`, но разметка остаётся доступной как обычное содержимое."),
      insight("Правило выбора: **сначала нативный элемент**, затем ARIA-паттерн по APG, и только потом собственный компонент. Чем больше работы делает браузер, тем меньше вы должны тестировать."),
    ]),

    section("mental-model", [
      p("Представьте страницу как **стопку слоёв**. Основной документ — нижний слой. **Верхний слой (top layer)** — особая «стеклянная плита» над всем: на неё платформа кладёт модальные окна, popover и полноэкранные элементы. Положенное туда не зависит от `z-index`, `overflow: hidden` и `transform` предков. Модальное окно при этом **блокирует** нижний слой (делает его `inert`), а popover — нет."),
      diagram(
        `
        верхний слой (top layer)  ◄── dialog.showModal()  → фон инертен, есть ::backdrop
             ▲                   ◄── [popover]            → фон активен, лёгкое закрытие
             │
        обычный документ         ◄── <details> раскрывается в потоке страницы
        `,
        "Слои страницы",
      ),
      table(
        ["Нужно", "Элемент", "Фон", "Закрытие"],
        [
          ["Раскрыть дополнительный текст в потоке", "`<details>`", "Активен", "Клик по `summary`"],
          ["Подтверждение, форма, прерывающая работу", "`<dialog>` + `showModal()`", "**Инертен**", "Esc, кнопка, `close()`"],
          ["Меню, панель настроек, «поповер» справки", "`[popover]`", "Активен", "Клик снаружи, Esc, кнопка"],
          ["Постоянная немодальная панель (cookie-баннер)", "`<dialog>` + `show()` или обычный блок", "Активен", "Кнопка"],
          ["Подсказка при наведении", "Нет нативного решения — «toggletip» на `popover` или `title` для несущественного", "Активен", "Esc/клик"],
          ["Уведомление о статусе", "`role=\"status\"` (не popover)", "Активен", "Само"],
        ],
        "Выбор элемента",
      ),
    ]),

    section("technical", [
      h("`<details>` и `<summary>`"),
      code(
        "html",
        `
        <details>
          <summary>Как оформить возврат?</summary>
          <p>Возврат оформляется в течение 14 дней со дня получения.</p>
        </details>

        <!-- Аккордеон: одновременно открыт только один -->
        <details name="faq" open><summary>Доставка</summary><p>2–5 дней.</p></details>
        <details name="faq"><summary>Оплата</summary><p>Картой или при получении.</p></details>
        `,
        { filename: "details.html" },
      ),
      ul(
        "`<summary>` — **первый** дочерний элемент `<details>`; без него браузер подставит заголовок по умолчанию («Details»).",
        "**`open`** — начальное и текущее состояние; его можно менять скриптом (`details.open = true`).",
        "**`name`** — одинаковое значение объединяет элементы в **группу**: открытие одного закрывает остальные (аккордеон без JS; поддерживается в современных браузерах).",
        "**Событие `toggle`** срабатывает после смены состояния (не всплывает).",
        "**Доступность:** `summary` озвучивается как кнопка-раскрытие с состоянием «свёрнуто/развёрнуто», Enter и Space работают без кода. Не вкладывайте в `summary` интерактивные элементы (ссылки, кнопки): клик по ним не должен переключать блок. Допустимо поместить внутрь `summary` заголовок (`<h3>`), если нужна структура страницы.",
        "**Поиск по странице:** в ряде браузеров (например, на основе Chromium) поиск по странице находит текст в закрытом `<details>` и раскрывает его.",
        "**Стилизация:** маркер — `summary::marker` или `list-style`; анимацию высоты делают через новые возможности CSS (например, `::details-content`, `interpolate-size`) — проверяйте поддержку.",
        "**Не годится для** сложных меню навигации с клавиатурными схемами «стрелки/Home/End» — для них нужен ARIA-паттерн.",
      ),
      h("`<dialog>`"),
      code(
        "html",
        `
        <button type="button" id="open-btn">Удалить аккаунт</button>

        <dialog id="confirm" aria-labelledby="c-title">
          <form method="dialog">
            <h2 id="c-title">Удалить аккаунт?</h2>
            <p>Действие необратимо.</p>
            <button value="cancel" autofocus>Отмена</button>
            <button value="delete">Удалить</button>
          </form>
        </dialog>

        <script>
          const dlg = document.getElementById("confirm");
          document.getElementById("open-btn").addEventListener("click", () => dlg.showModal());
          dlg.addEventListener("close", () => console.log("returnValue:", dlg.returnValue));
        </script>
        `,
        { lineNumbers: true, filename: "dialog.html" },
      ),
      table(
        ["Метод/свойство/событие", "Назначение"],
        [
          ["`showModal()`", "Открывает **модальное** окно: верхний слой, инертный фон, `::backdrop`, Esc закрывает, фокус возвращается при закрытии"],
          ["`show()`", "Открывает **немодальное** окно: без инертного фона и без `::backdrop`"],
          ["`close(returnValue?)`", "Закрывает и записывает значение в `dialog.returnValue`"],
          ["`open` (свойство/атрибут)", "Открыто ли окно. **Не** ставьте атрибут `open` в разметке, чтобы показать модальное окно — оно откроется как немодальное"],
          ["`form method=\"dialog\"`", "Отправка формы закрывает окно без запроса; `value` нажатой кнопки становится `returnValue`"],
          ["События `cancel`, `close`", "`cancel` — попытка закрыть (Esc), отменяемое; `close` — окно закрыто"],
          ["`::backdrop`, `dialog:modal`", "Стилизация подложки и модального состояния"],
        ],
      ),
      ul(
        "**Имя:** `aria-labelledby` на заголовок (и при необходимости `aria-describedby` на текст).",
        "**Начальный фокус:** по умолчанию первый фокусируемый элемент; для опасных действий задайте `autofocus` на «Отмену».",
        "**Закрытие по клику на подложку** нативно не происходит (в новых браузерах для этого появляется атрибут `closedby`, но поддержка пока неполная). Типичное решение: поместить содержимое во внутренний контейнер с отступами и закрывать окно, когда `event.target === dialog`.",
        "**Блокировка прокрутки фона:** модальные окна оставляют прокрутку основной страницы; при необходимости добавляют `body:has(dialog[open]) { overflow: hidden }`.",
        "**Не вкладывайте обязательное содержимое страницы** в закрытый `dialog`: закрытое окно скрыто (`display: none`).",
        "**Сторонние виджеты** (карты, платёжные формы) в модальном `dialog` работают, но проверяйте фокус внутри `iframe`.",
      ),
      h("Popover API"),
      code(
        "html",
        `
        <button popovertarget="profile-menu">Профиль</button>

        <div id="profile-menu" popover>
          <a href="/account">Личный кабинет</a>
          <a href="/orders">Заказы</a>
          <button type="button" popovertarget="profile-menu" popovertargetaction="hide">Закрыть</button>
        </div>
        `,
        { filename: "popover.html", caption: "Работает без JavaScript." },
      ),
      table(
        ["Значение `popover`", "Поведение"],
        [
          ["`auto` (по умолчанию)", "**Лёгкое закрытие:** клик снаружи и Esc закрывают; открытие нового `auto` закрывает другие (кроме вложенных)"],
          ["`manual`", "Закрывается только явно (кнопкой или скриптом); для постоянных панелей и тостов"],
          ["`hint`", "Новое значение для подсказок: не закрывает `auto`-popover (поддержка появляется постепенно)"],
        ],
      ),
      ul(
        "**Управление:** `popovertarget=\"id\"` на кнопке (`popovertargetaction=\"show|hide|toggle\"`) либо `showPopover()`, `hidePopover()`, `togglePopover()` в скрипте.",
        "**События:** `beforetoggle` (можно отменить открытие) и `toggle` с `event.newState` (`open`/`closed`).",
        "**Стили:** `:popover-open`, `::backdrop`; по умолчанию popover скрыт (`display: none`), открытый — в верхнем слое и по центру области просмотра (позиционируйте сами; привязка к элементу — CSS anchor positioning, поддержка растёт постепенно).",
        "**Фокус:** при закрытии фокус возвращается на элемент, который был в фокусе до открытия (если закрытие связано с фокусом внутри popover).",
        "**Связь с кнопкой:** браузер сам связывает кнопку и popover для вспомогательных технологий и сообщает состояние «развёрнуто/свёрнуто».",
        "**Семантики роли нет:** popover — это механизм показа. Меню нужно оформлять по APG (`role=\"menu\"` и стрелки — только для настоящих меню действий), подсказку — `role=\"tooltip\"` или связью `aria-describedby`, список с поиском — комбобокс.",
      ),
      warn("Popover не делает фон инертным и не захватывает фокус. Если содержимое **прерывает** работу пользователя и требует решения — это модальное `dialog`, а не popover."),
      h("Прочие нативные средства"),
      ul(
        "**`inert`** — делает поддерево неинтерактивным (фокус, клики, чтение скринридером). Подходит для фона и скрытых панелей.",
        "**`hidden=\"until-found\"`** — содержимое скрыто, но находится поиском по странице и якорными переходами и автоматически раскрывается; перед этим срабатывает событие `beforematch` (поддержка выборочная).",
        "**`contenteditable`** — делает элемент редактируемым; для настоящих редакторов нужны ARIA и серьёзная доработка.",
        "**`draggable`** и HTML Drag and Drop API — перетаскивание; дублируйте клавиатурной альтернативой (WCAG 2.5.7).",
        "**`<menu>`** — семантически список команд (аналог `<ul>`), не меню-виджет.",
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <!-- Аккордеон -->
        <section aria-labelledby="faq-title">
          <h2 id="faq-title">Частые вопросы</h2>
          <details name="faq">
            <summary>Как оформить возврат?</summary>
            <p>…</p>
          </details>
          <details name="faq">
            <summary>Сколько идёт доставка?</summary>
            <p>…</p>
          </details>
        </section>

        <!-- Меню-popover без JS -->
        <button popovertarget="user-menu" aria-label="Меню пользователя">☰</button>
        <nav id="user-menu" popover aria-label="Пользователь">
          <a href="/account">Кабинет</a>
          <a href="/logout">Выйти</a>
        </nav>

        <!-- Модальное окно -->
        <dialog id="settings" aria-labelledby="settings-title">
          <h2 id="settings-title">Настройки</h2>
          <form method="dialog">
            <label><input type="checkbox" name="news"> Получать новости</label>
            <button value="save">Сохранить</button>
            <button value="cancel" formnovalidate>Отмена</button>
          </form>
        </dialog>
        <button type="button" onclick="document.getElementById('settings').showModal()">Настройки</button>
        `,
        { lineNumbers: true, filename: "interactive.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <details name="faq" open>
          <summary>Как оформить возврат?</summary>
          <p>В течение 14 дней со дня получения.</p>
        </details>
        <details name="faq">
          <summary>Сколько идёт доставка?</summary>
          <p>От 2 до 5 рабочих дней.</p>
        </details>

        <p>
          <button popovertarget="tip">Что такое SKU?</button>
        </p>
        <div id="tip" popover>SKU — внутренний артикул товара. Esc или клик снаружи закроет подсказку.</div>

        <p><button type="button" id="ask">Удалить аккаунт…</button></p>
        <dialog id="dlg" aria-labelledby="t">
          <form method="dialog">
            <h2 id="t">Удалить аккаунт?</h2>
            <button value="cancel" autofocus>Отмена</button>
            <button value="delete">Удалить</button>
          </form>
        </dialog>

        <script>
          document.querySelectorAll("details").forEach((d) =>
            d.addEventListener("toggle", () => console.log("details «" + d.querySelector("summary").textContent + "»:", d.open ? "открыт" : "закрыт")));
          document.getElementById("tip").addEventListener("toggle", (e) => console.log("popover:", e.newState));
          const dlg = document.getElementById("dlg");
          document.getElementById("ask").addEventListener("click", () => dlg.showModal());
          dlg.addEventListener("close", () => console.log("dialog закрыт, returnValue =", dlg.returnValue));
        </script>
        `,
        { runnable: true },
      ),
      p("Откройте второй вопрос — первый закроется (общее `name`). Кнопка со `popovertarget` открывает подсказку без скрипта, а диалог запоминает, какой кнопкой его закрыли (`returnValue`). Скрипты нужны только для наблюдения и для `showModal()`."),
    ]),

    section("detailed-example", [
      p("Панель настроек с несколькими слоями: меню-popover открывает диалог настроек, внутри которого есть popover-подсказка. Закрытие по клику на подложку реализовано аккуратно — содержимое диалога обёрнуто во внутренний контейнер."),
      code(
        "html",
        `
        <button popovertarget="menu">Меню</button>
        <div id="menu" popover>
          <button type="button" id="open-settings">Настройки…</button>
          <a href="/help">Помощь</a>
        </div>

        <dialog id="settings" aria-labelledby="s-title" class="modal">
          <div class="modal__box">
            <h2 id="s-title">Настройки</h2>

            <form method="dialog">
              <label for="lang">Язык</label>
              <select id="lang"><option>Русский</option><option>English</option></select>

              <button type="button" popovertarget="help-tip" aria-label="Что это?">?</button>
              <div id="help-tip" popover>Язык интерфейса можно изменить позже в профиле.</div>

              <button value="cancel">Отмена</button>
              <button value="save" autofocus>Сохранить</button>
            </form>
          </div>
        </dialog>

        <style>
          .modal { padding: 0; border: 0; border-radius: 12px; }
          .modal::backdrop { background: rgb(0 0 0 / .5); }
          .modal__box { padding: 1.5rem; }
          body:has(dialog[open]) { overflow: hidden; }
        </style>

        <script>
          const dlg = document.getElementById("settings");
          document.getElementById("open-settings").addEventListener("click", () => {
            document.getElementById("menu").hidePopover();
            dlg.showModal();
          });
          // клик по подложке: цель клика — сам <dialog>, а не внутренний контейнер
          dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close("cancel"); });
          dlg.addEventListener("close", () => console.log("закрыто:", dlg.returnValue));
        </script>
        `,
        { lineNumbers: true, filename: "settings-layers.html", collapsed: true },
      ),
      ul(
        "**Меню** — popover: закрывается по клику снаружи и Esc; перед открытием диалога меню закрывается явно.",
        "**Диалог** — модальный: фон инертен, Esc закрывает, фокус возвращается на кнопку меню (или на последний сфокусированный элемент).",
        "**Подсказка** внутри диалога — вложенный popover: он тоже попадает в верхний слой и корректно отображается над диалогом.",
        "**Подложка:** у `.modal` нет собственных отступов, поэтому клик по ней даёт `e.target === dlg`, а клики внутри содержимого — нет.",
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <details name="faq" open>
        <summary>Как оформить возврат?</summary>
        <button popovertarget="m" popovertargetaction="toggle">Меню</button>
        <div id="m" popover>…</div>
        <dialog id="d" aria-labelledby="t"><form method="dialog">
        <button value="cancel" autofocus>Отмена</button>
        </form></dialog>
        <script>d.showModal()</script>
        `,
        [
          { line: 1, text: "`name=\"faq\"` объединяет все `<details>` с таким именем в группу: при открытии одного остальные закрываются. `open` задаёт начальное состояние." },
          { line: 2, text: "`<summary>` — видимый заголовок и переключатель; он фокусируется, реагирует на Enter/Space и озвучивается как кнопка-раскрытие с состоянием." },
          { line: 3, text: "Кнопка управляет popover без JS. `popovertargetaction=\"toggle\"` — значение по умолчанию (можно не писать); для кнопки «Закрыть» внутри панели ставят `hide`." },
          { line: 4, text: "Элемент с атрибутом `popover` скрыт, пока его не откроют. Открытый, он помещается в верхний слой и может закрываться кликом снаружи и по Esc." },
          { line: 5, text: "`aria-labelledby` даёт окну имя. `form method=\"dialog\"` закроет окно по нажатию кнопки и передаст её `value`." },
          { line: 6, text: "`autofocus` на безопасной кнопке: при открытии фокус окажется на «Отмена», а не на «Удалить»." },
          { line: 8, text: "Метод `showModal()` открывает окно как модальное: фон инертен, появляется `::backdrop`; Esc закроет окно; фокус вернётся к источнику при закрытии." },
        ],
        "interactive-annotated.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Состояние `<details>`", "Атрибут `open` — единственный источник истины. Клик по `summary` переключает атрибут и в конце задачи запускает событие `toggle`. Содержимое закрытого `details` скрыто, но (в ряде браузеров) доступно поиску по странице."],
          ["Открытие модального `dialog`", "`showModal()` помещает элемент в **верхний слой**, делает остальной документ **инертным**, добавляет `::backdrop`, выбирает элемент для фокуса (`autofocus` или первый фокусируемый) и запоминает ранее сфокусированный элемент."],
          ["Закрытие диалога", "Esc создаёт `cancel` (его можно отменить); затем — закрытие, возврат инертности, фокус на запомненный элемент и событие `close`. `form method=\"dialog\"` вызывает закрытие с `returnValue`."],
          ["Открытие `popover`", "Показ помещает элемент в верхний слой; для `auto` проверяется иерархия: открытые несвязанные `auto`-popover закрываются; регистрируются обработчики лёгкого закрытия (клик снаружи, Esc)."],
          ["Связь «кнопка — popover»", "Атрибуты `popovertarget` создают неявную связь: кнопка получает состояние (раскрыт/свёрнут) для дерева доступности; клик по ней вызывает показ/скрытие."],
          ["Рендеринг верхнего слоя", "Элементы верхнего слоя рисуются выше любого содержимого страницы в порядке открытия; `z-index`, `overflow` и `transform` предков на них не влияют."],
        ],
        "Что делает браузер",
      ),
      note("Старые браузеры без `popover` игнорируют атрибут, и элемент остаётся видимым в потоке страницы. Для широкой поддержки используйте проверку возможностей (`HTMLElement.prototype.hasOwnProperty(\"popover\")`) и запасной вариант (например, `details` или ARIA-реализацию)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Показывать модальное окно атрибутом `open`"),
      wrongRight(
        "html",
        {
          code: `
            <dialog open>…</dialog>
          `,
          note: "Окно открыто как **немодальное**: нет инертного фона, `::backdrop` и поведения Esc как у модального.",
        },
        {
          code: `
            <dialog id="d">…</dialog>
            <script>document.getElementById("d").showModal()</script>
          `,
          note: "`showModal()` включает всё модальное поведение.",
        },
      ),
      h("Ошибка 2. Интерактивные элементы внутри `<summary>`"),
      p("Ссылка или кнопка внутри `summary` конфликтуют с переключением: клик одновременно раскрывает блок и выполняет действие, а скринридер путает роли. Выносите действия за пределы `summary`."),
      h("Ошибка 3. `role=\"menu\"` для любой панели"),
      p("Если popover содержит обычные ссылки навигации, роль `menu` не нужна и вредна: она включает режим приложения и требует клавиатурной модели. Оставьте нативные ссылки внутри `nav`."),
      h("Ошибка 4. Диалог без имени и без управления фокусом"),
      p("Без `aria-labelledby` скринридер говорит «диалог» без названия; без `autofocus` на безопасном элементе фокус попадает на опасную кнопку. Давайте имя и выбирайте начальный фокус."),
      h("Ошибка 5. Использовать popover вместо модального окна"),
      p("Popover закрывается кликом снаружи и не блокирует фон. Для подтверждения удаления и форм, требующих решения, используйте `dialog.showModal()`."),
      h("Ошибка 6. Зависимость от JS для базового раскрытия"),
      p("Аккордеон на `div` и скрипте не работает без JS. `<details>` решает ту же задачу без скриптов."),
      h("Ошибка 7. Собственный `z-index` против верхнего слоя"),
      p("`z-index: 99999` на обычных элементах и «ловушки» модальных окон избыточны: элементы верхнего слоя всегда выше. Не боритесь с платформой — добавьте `dialog`/`popover`."),
      h("Ошибка 8. Блокировка прокрутки и потеря фокуса при закрытии"),
      p("При самодельном модальном окне разработчики забывают вернуть прокрутку и фокус. Нативный `dialog` возвращает фокус сам; прокрутку страницы при необходимости ограничивают CSS."),
    ]),

    section("antipatterns", [
      ul(
        "**Аккордеон из `div` и `onclick`** вместо `details`.",
        "**Модальное окно из `div` с затемнением** без инертности и ловушки фокуса.",
        "**Подсказки только по наведению** (`:hover`): недоступны на сенсорных экранах и с клавиатуры.",
        "**Всплывающие баннеры, закрывающие содержимое без возможности закрыть** с клавиатуры.",
        "**Вложенные модальные окна на несколько уровней** — перегрузка пользователя; лучше пошаговый сценарий.",
        "**Popover для критичных сообщений:** их можно закрыть случайным кликом.",
        "**Автоматическое открытие диалога при загрузке** без причины (реклама, подписка): раздражает и нарушает ожидания.",
        "**Проверка поддержки через User-Agent** вместо проверки возможностей.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Раскрытие — `<details>`;** группа взаимоисключающих — общий `name`.",
        "**Модальный выбор — `<dialog>` + `showModal()`;** имя через `aria-labelledby`, `autofocus` на безопасном действии, `form method=\"dialog\"` для результата.",
        "**Всплывающая панель — `popover`;** кнопка с `popovertarget`; для меню/подсказок добавляйте нужную семантику и клавиатуру.",
        "**Фон под модальным окном — `inert`** (автоматически при `showModal()`).",
        "**Прокрутка и подложка:** стилизуйте `::backdrop`, при необходимости блокируйте прокрутку CSS.",
        "**Проверяйте клавиатуру и скринридер:** Tab, Shift+Tab, Esc, Enter/Space; возврат фокуса; объявление имени и состояния.",
        "**Feature detection** и запасное поведение для старых браузеров.",
        "**Минимум слоёв:** не открывайте диалог из диалога без необходимости.",
        "**Не прячьте важное:** содержимое, нужное большинству, не должно быть только в свёрнутом `details`.",
        "**Тестируйте на мобильных:** размер, жесты, виртуальная клавиатура.",
      ),
    ]),

    section("edge-cases", [
      h("Вложенные popover и порядок закрытия"),
      p("Открытый `auto`-popover не закрывается, если открывается его «потомок» (кнопка внутри него со `popovertarget`). Несвязанные `auto`-popover закрываются при открытии нового. Для независимых панелей (тосты) используйте `popover=\"manual\"`."),
      h("Popover и позиционирование"),
      p("По умолчанию popover находится по центру окна. Привязать его к кнопке можно с помощью CSS anchor positioning (поддержка растёт) или вычислением координат в JS; следите за прокруткой и размером окна."),
      h("`dialog` внутри `form`"),
      p("`<dialog>` может быть вне формы и содержать собственную `<form method=\"dialog\">`. Если диалог вложен в другую форму, его кнопки могут случайно отправить внешнюю форму — задавайте `type=\"button\"` или выносите диалог."),
      h("Закрытие по `Esc` и `cancel`"),
      p("Esc вызывает событие `cancel`; его можно отменить (`preventDefault()`) — например, для диалога с несохранёнными изменениями. Но вынуждать пользователя остаться в окне без выхода нельзя (WCAG 2.1.2)."),
      h("Стили `dialog`"),
      p("У `dialog` есть стили браузера: рамка, `margin: auto`, `position: fixed` (для модального). Сбрасывайте их осознанно; не задавайте `display: flex` на самом `dialog` — это переопределит `display: none` у закрытого окна. Используйте `dialog[open]` или вложенный контейнер."),
      h("Печать и `details`"),
      p("Закрытые `details` при печати остаются закрытыми. Если печатная версия должна содержать весь текст, раскрывайте их скриптом при событии `beforeprint` и возвращайте состояние после `afterprint`."),
      h("Анимации"),
      p("Верхний слой и `display: none` усложняют анимацию появления. Современный CSS (`@starting-style`, `transition-behavior: allow-discrete`) помогает, но поддержка растёт постепенно; обязательно учитывайте `prefers-reduced-motion`."),
      h("Поддержка браузерами"),
      p("`<details>` и `<dialog>` поддерживаются давно; `name` у `details` и Popover API — в современных версиях основных браузеров (чаще с 2024 года). Смотрите таблицы совместимости и используйте улучшение постепенно."),
    ]),

    section("related", [
      ul(
        "[Клавиатура и фокус](/learn/html/keyboard-focus) — фокус в диалогах, `inert`.",
        "[ARIA](/learn/html/aria) — аккордеоны, диалоги, меню по образцу APG.",
        "[Навигация и меню](/learn/html/navigation-patterns) — меню навигации и раскрывающиеся блоки.",
        "[Элементы управления](/learn/html/form-controls) — `button`, `form method=\"dialog\"`.",
        "[Прогрессивное улучшение](/learn/html/progressive-enhancement) — рабочая страница без JS.",
        "Из других курсов: **CSS** — `::backdrop`, `:popover-open`, `@starting-style`, anchor positioning; **JS** — `showModal()`, события `toggle` и `close`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Самодельные компоненты",
          code: `
            <div class="faq-q" onclick="toggle(this)">Как оформить возврат?</div>
            <div class="faq-a" style="display:none">…</div>

            <div class="overlay" style="display:none;z-index:99999">
              <div class="modal">Удалить?
                <span onclick="ok()">Да</span> <span onclick="close()">Нет</span>
              </div>
            </div>
          `,
          note: "Нет роли, состояния и фокуса; «кнопки» из `span`; фон не инертен; Esc не работает; не работает без JS.",
        },
        {
          title: "Нативные элементы",
          code: `
            <details>
              <summary>Как оформить возврат?</summary>
              <p>…</p>
            </details>

            <dialog id="confirm" aria-labelledby="t">
              <form method="dialog">
                <h2 id="t">Удалить?</h2>
                <button value="no" autofocus>Нет</button>
                <button value="yes">Да</button>
              </form>
            </dialog>
          `,
          note: "Роль, состояние, клавиатура, инертный фон, Esc, возврат фокуса — без дополнительного кода.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.interactive-elements.ex1",
      title: "Какой элемент выбрать?",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждой задачи выберите: `details`, `dialog` (модальный), `dialog` (немодальный), `popover` или другое, и поясните:"),
        ol(
          "Блок FAQ из пяти вопросов.",
          "Подтверждение необратимого удаления.",
          "Меню профиля из трёх ссылок в шапке.",
          "Короткая справка «Что такое SKU?» рядом с полем.",
          "Согласие на cookie внизу страницы, не блокирующее работу.",
          "Уведомление «Сохранено» после действия.",
          "Форма входа, появляющаяся поверх страницы и требующая заполнения.",
          "Выпадающий список подсказок при вводе в строку поиска.",
        ),
      ],
      hints: ["Блокирует ли элемент фон?", "Прерывает ли он работу пользователя?", "Нужна ли особая клавиатурная модель?"],
      checks: ["Выбор соответствует модальности и назначению", "Названы особенности (ARIA, фокус)"],
      solution: [
        ol(
          "`<details name>` — аккордеон без JS.",
          "Модальный `dialog` (`showModal()`), безопасное действие в `autofocus`.",
          "`popover` с `nav`/ссылками (или `details`, если простое раскрытие).",
          "`popover` (toggletip) с кнопкой-инициатором; текст связать через `aria-describedby`, если нужно.",
          "Немодальный `dialog` (`show()`) или обычный `region` с кнопкой закрытия.",
          "Не popover: `role=\"status\"` (живая область).",
          "Модальный `dialog` (`showModal()`) с формой.",
          "Паттерн **combobox** (ARIA) или `input` + `datalist`; `popover` — только механизм показа списка.",
        ),
      ],
    }),
    exercise({
      id: "html.interactive-elements.ex2",
      title: "FAQ, подтверждение и меню без библиотек",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сделайте страницу: (1) FAQ из трёх вопросов — аккордеон, одновременно открыт один; (2) кнопка «Выйти» с модальным диалогом подтверждения (безопасное действие по умолчанию, `returnValue` отображается на странице через `role=\"status\"`); (3) меню профиля как popover из трёх ссылок, работающее без JS."),
      ],
      hints: ["Как объединить `details`?", "Что передаёт `form method=\"dialog\"`?", "Чем закрывается popover?"],
      checks: ["Общий `name` у `details`", "`showModal()` + `autofocus` на «Отмена»", "`popovertarget` без скриптов"],
      solution: [
        code(
          "html",
          `
          <button popovertarget="user-menu">Профиль</button>
          <nav id="user-menu" popover aria-label="Профиль">
            <a href="/account">Кабинет</a>
            <a href="/orders">Заказы</a>
            <a href="/help">Помощь</a>
          </nav>

          <section aria-labelledby="faq">
            <h2 id="faq">Вопросы</h2>
            <details name="faq" open><summary>Как оформить возврат?</summary><p>В течение 14 дней.</p></details>
            <details name="faq"><summary>Как оплатить?</summary><p>Картой или наличными.</p></details>
            <details name="faq"><summary>Где мой заказ?</summary><p>В личном кабинете.</p></details>
          </section>

          <button type="button" id="logout">Выйти</button>
          <dialog id="logout-dlg" aria-labelledby="lt">
            <form method="dialog">
              <h2 id="lt">Выйти из аккаунта?</h2>
              <button value="cancel" autofocus>Остаться</button>
              <button value="logout">Выйти</button>
            </form>
          </dialog>
          <p id="result" role="status"></p>

          <script>
            const dlg = document.getElementById("logout-dlg");
            document.getElementById("logout").addEventListener("click", () => dlg.showModal());
            dlg.addEventListener("close", () => {
              document.getElementById("result").textContent =
                dlg.returnValue === "logout" ? "Вы вышли из аккаунта" : "Остались в аккаунте";
            });
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
      ],
    }),
    exercise({
      id: "html.interactive-elements.ex3",
      title: "Окно, которое не слушается",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Жалобы: «окно открывается, но можно кликать по странице за ним», «скринридер говорит просто “диалог”», «Enter случайно удаляет данные», «клик по затемнению не закрывает окно, хотя дизайнер просил», «меню навигации ведёт себя странно — стрелки перехватываются». Найдите причины и исправьте."),
      ],
      starter: {
        lang: "html",
        code: `
          <dialog id="d" open>
            <h2>Удалить?</h2>
            <button id="yes">Удалить</button>
            <button id="no">Отмена</button>
          </dialog>

          <ul role="menu" popover id="nav">
            <li role="menuitem"><a href="/a">Раздел А</a></li>
            <li role="menuitem"><a href="/b">Раздел Б</a></li>
          </ul>
        `,
      },
      hints: ["Каким методом открывают модальное окно?", "Как задать имя?", "Какой элемент получает фокус по умолчанию?", "Как определить клик по подложке?", "Подходит ли `role=\"menu\"` для навигации?"],
      checks: ["`showModal()` вместо `open`", "`aria-labelledby`", "`autofocus` на «Отмена»", "Закрытие по подложке через внутренний контейнер", "Нативные ссылки в `nav` без роли `menu`"],
      solution: [
        ul(
          "**`open` в разметке** открывает немодальное окно: фон не инертен → `showModal()` из скрипта.",
          "**Нет имени:** `aria-labelledby` на заголовок.",
          "**Фокус:** первым получает фокус «Удалить» → `autofocus` на «Отмена».",
          "**Закрытие по подложке:** нативно нет; добавить внутренний контейнер с отступами и обработчик `e.target === dialog`.",
          "**`role=\"menu\"` для навигации** включает режим приложения и перехват стрелок → `nav` со списком ссылок, без ролей `menu`/`menuitem`.",
        ),
        code(
          "html",
          `
          <button type="button" id="ask">Удалить…</button>
          <dialog id="d" aria-labelledby="dt">
            <div class="box">
              <h2 id="dt">Удалить?</h2>
              <form method="dialog">
                <button value="no" autofocus>Отмена</button>
                <button value="yes">Удалить</button>
              </form>
            </div>
          </dialog>
          <style>dialog { padding: 0; } .box { padding: 1.5rem; }</style>
          <script>
            const d = document.getElementById("d");
            document.getElementById("ask").addEventListener("click", () => d.showModal());
            d.addEventListener("click", (e) => { if (e.target === d) d.close("no"); });
          </script>

          <button popovertarget="nav">Разделы</button>
          <nav id="nav" popover aria-label="Разделы">
            <ul>
              <li><a href="/a">Раздел А</a></li>
              <li><a href="/b">Раздел Б</a></li>
            </ul>
          </nav>
          `,
          { lineNumbers: true, collapsed: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.interactive-elements.challenge",
    title: "Слои интерфейса без z-index: настройки, уведомления и подсказки",
    scenario: [
      p("В веб-приложении накопилось 14 различных «оверлеев» с разными `z-index`: модальные окна, выпадающие меню, подсказки, тосты. Они конфликтуют: тост оказывается под модальным окном, Esc закрывает не то, фокус уходит «в никуда», а скринридеры не объявляют ни одно из окон. Требуется переписать слой оверлеев на нативных средствах с сохранением работы в старых браузерах."),
      p("Спроектируйте систему: какие элементы для каких сценариев, правила фокуса и закрытия, вложенность, уведомления, запасной вариант и тесты."),
    ],
    requirements: [
      "Матрица «сценарий → элемент → поведение (фон, фокус, закрытие, объявление)»",
      "Разметка и скрипты для модального окна, меню-popover, подсказки и тоста",
      "Правила вложенности и закрытия (Esc, клик снаружи)",
      "Стратегия поддержки старых браузеров",
      "Список тестов (клавиатура, скринридер, мобильные)",
    ],
    constraints: [
      "Без `z-index` выше 10 для оверлеев",
      "Все окна доступны с клавиатуры, фокус всегда возвращается",
      "Работа без JS там, где это возможно",
    ],
    acceptance: [
      "Модальное окно инертно к фону и закрывается по Esc, фокус возвращается",
      "Меню и подсказки закрываются по Esc и клику снаружи",
      "Тосты объявляются, но не крадут фокус и не закрывают меню",
      "В браузерах без `popover` интерфейс остаётся рабочим",
    ],
    hints: [
      "Что из перечисленного должно блокировать фон?",
      "Какой popover подходит для тоста?",
      "Как определить поддержку `popover`?",
    ],
    solution: [
      table(
        ["Сценарий", "Элемент", "Фон", "Фокус", "Закрытие", "Объявление"],
        [
          ["Подтверждение, формы, критичный выбор", "`dialog` + `showModal()`", "Инертен", "Внутрь окна; `autofocus` на безопасном; возврат", "Esc, кнопки, `close()`", "Имя окна (`aria-labelledby`)"],
          ["Меню профиля, действия", "`popover` (auto)", "Активен", "Остаётся на кнопке или переходит внутрь по паттерну", "Esc, клик снаружи, выбор пункта", "Состояние кнопки (развёрнуто)"],
          ["Подсказка «Что это?»", "`popover` (auto), toggletip", "Активен", "Остаётся на кнопке", "Esc, клик снаружи", "`aria-describedby` или читаемый текст"],
          ["Тост «Сохранено»", "`popover=\"manual\"` + `role=\"status\"` (или просто `role=\"status\"`)", "Активен", "Не перехватывает", "Автоматически через 5–8 с, кнопка закрытия", "`role=\"status\"`"],
          ["Критичная ошибка", "`role=\"alert\"` или модальный `dialog`", "По серьёзности", "К сообщению/кнопке «Повторить»", "Явное действие", "`alert`"],
          ["Cookie-баннер", "Немодальный `dialog` (`show()`) или регион", "Активен", "Не перехватывает", "Кнопки выбора", "Имя региона"],
        ],
      ),
      code(
        "html",
        `
        <!-- Меню профиля: popover (работает без JS) -->
        <button popovertarget="profile" aria-label="Профиль">☰</button>
        <nav id="profile" popover aria-label="Профиль">
          <a href="/account">Кабинет</a>
          <button type="button" id="open-settings">Настройки…</button>
        </nav>

        <!-- Модальные настройки -->
        <dialog id="settings" aria-labelledby="st">
          <div class="box">
            <h2 id="st">Настройки</h2>
            <form method="dialog">
              <button value="cancel">Отмена</button>
              <button value="save" autofocus>Сохранить</button>
            </form>
          </div>
        </dialog>

        <!-- Тосты: popover manual + статус -->
        <div id="toast" popover="manual" role="status"></div>

        <script>
          const settings = document.getElementById("settings");
          const toast = document.getElementById("toast");

          document.getElementById("open-settings").addEventListener("click", () => {
            document.getElementById("profile").hidePopover();
            settings.showModal();
          });
          settings.addEventListener("click", (e) => { if (e.target === settings) settings.close("cancel"); });
          settings.addEventListener("close", () => { if (settings.returnValue === "save") notify("Настройки сохранены"); });

          let timer;
          function notify(text) {
            toast.textContent = text;
            if (toast.showPopover) toast.showPopover();           // popover поддерживается
            clearTimeout(timer);
            timer = setTimeout(() => toast.hidePopover?.(), 6000);
          }
        </script>

        <style>
          dialog { padding: 0; border: 0; border-radius: 12px; }
          dialog::backdrop { background: rgb(0 0 0 / .5); }
          .box { padding: 1.5rem; }
          #toast { inset: auto 1rem 1rem auto; margin: 0; }
          body:has(dialog[open]) { overflow: hidden; }
          /* запасной вариант: без поддержки popover панель просто остаётся скрытой, пока не нужна */
          @supports not selector(:popover-open) { #profile, #toast { display: none; } #profile.open, #toast.open { display: block; } }
        </style>
        `,
        { lineNumbers: true, filename: "layers.html", collapsed: true },
      ),
      ul(
        "**Верхний слой** заменяет `z-index`: тост поверх модального окна возможен, потому что `popover=\"manual\"` открывается позже и находится выше; но тост не должен перекрывать содержимое диалога — размещайте его в углу.",
        "**Фокус:** модальное окно возвращает фокус само; popover-меню оставляет фокус на кнопке; тост фокус не трогает.",
        "**Порядок закрытия:** Esc закрывает самый верхний открытый слой (нативно); в `auto`-popover внутри диалога сначала закрывается popover.",
        "**Старые браузеры:** `<details>` как запасной вариант меню; проверка `HTMLElement.prototype.hasOwnProperty(\"popover\")`; запасной скрипт, переключающий класс `.open` и `aria-expanded`; тосты — просто `role=\"status\"`.",
        "**Тесты:** клавиатура (Tab, Esc, Enter), скринридер (объявление имени окна и тостов), мобильные (фокус, прокрутка), e2e: после закрытия окна `document.activeElement` — кнопка-инициатор; при открытом диалоге элементы фона недоступны (`inert`).",
      ),
    ],
  },

  interview: [
    iq("html.interactive-elements.i1", "basic", "Для чего нужен `<details>` и чем он лучше раскрывающегося блока на `div`?", [
      p("`<details>`/`<summary>` — нативный раскрывающийся блок: без JS, с клавиатурой (Enter/Space), ролью и состоянием для скринридера и событием `toggle`. Блок из `div` всё это придётся реализовывать вручную."),
    ]),
    iq("html.interactive-elements.i2", "basic", "Чем `showModal()` отличается от `show()`?", [
      p("`showModal()` открывает модальное окно: верхний слой, `::backdrop`, остальной документ инертен, Esc закрывает, фокус возвращается. `show()` — немодальное окно без этих эффектов."),
    ]),
    iq("html.interactive-elements.i3", "intermediate", "Как работает атрибут `popover` и чем он отличается от модального `dialog`?", [
      ul(
        "`popover` показывает элемент в верхнем слое; управляется `popovertarget` или методами; у `auto` есть лёгкое закрытие (клик снаружи, Esc).",
        "Он **не** делает фон инертным и не захватывает фокус.",
        "Модальный `dialog` блокирует фон и требует решения — для подтверждений и форм; popover — для меню, подсказок, панелей.",
      ),
    ]),
    iq("html.interactive-elements.i4", "intermediate", "Как сделать аккордеон без JavaScript?", [
      p("Несколько `<details>` с одинаковым значением `name`: открытие одного закрывает остальные. Работает в современных браузерах; в старых блоки просто остаются независимыми."),
    ]),
    iq("html.interactive-elements.i5", "intermediate", "Как закрыть `dialog` по клику на подложку?", [
      p("Нативно этого нет (в новых браузерах появляется `closedby`, но поддержка неполная). Обычное решение: убрать отступы у `dialog`, обернуть содержимое в контейнер с отступами и закрывать окно, если `event.target === dialog`."),
    ]),
    iq("html.interactive-elements.i6", "advanced", "Какие ARIA-атрибуты нужны для `<dialog>` и что браузер делает за вас?", [
      ul(
        "Нужно имя: `aria-labelledby` (и при необходимости `aria-describedby`).",
        "Браузер сам задаёт роль `dialog`; `showModal()` делает фон инертным, управляет фокусом и возвратом, обеспечивает Esc.",
        "Начальный фокус — через `autofocus` на безопасном элементе.",
      ),
    ]),
    iq("html.interactive-elements.i7", "engineering", "Как вы поддержите старые браузеры, не знающие `popover`?", [
      ul(
        "Проверка возможностей: `HTMLElement.prototype.hasOwnProperty(\"popover\")`.",
        "Запасной вариант: `<details>` или кнопка с `aria-expanded` и классом, переключаемым скриптом; `hidden` для скрытия.",
        "Прогрессивное улучшение: базовый контент доступен без поддержки, `popover` добавляет удобство.",
        "Тесты в целевых браузерах и политика поддержки.",
      ),
    ]),
    iq("html.interactive-elements.i8", "debugging", "После закрытия модального окна фокус уходит в начало страницы. Что проверить?", [
      ul(
        "Используется ли `showModal()`/`close()` (нативно возвращает фокус) или окно сделано самодельно.",
        "Не удалён ли элемент-инициатор из DOM до закрытия.",
        "Не вызывается ли `focus()` на другом элементе в обработчике `close`.",
        "Не скрыт ли инициатор (`display: none`, `inert`) в момент закрытия.",
      ),
    ]),
  ],

  exam: [
    mcq("html.interactive-elements.e1", "foundation", "Какой элемент даёт раскрывающийся блок без JavaScript?", ["`<dialog>`", "`<details>`", "`<template>`", "`<menu>`"], 1, "`<details>` с `<summary>` реализует раскрытие нативно."),
    mcq("html.interactive-elements.e2", "foundation", "Каким методом открывают модальное окно?", ["`dialog.open = true`", "`dialog.showModal()`", "`dialog.show()`", "`dialog.popover()`"], 1, "`showModal()` включает модальное поведение; атрибут `open` и `show()` открывают немодальное окно."),
    mcq("html.interactive-elements.e3", "intermediate", "Что делает общий `name` у нескольких `<details>`?", ["Задаёт стиль", "Делает их группой: открыт может быть только один", "Скрывает их", "Объединяет в форму"], 1, "Атрибут `name` создаёт взаимоисключающую группу (аккордеон)."),
    mcq("html.interactive-elements.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["Popover делает фон инертным", "Модальный `dialog` помещается в верхний слой", "`popovertarget` работает без JavaScript", "`<dialog open>` открывает окно как модальное"], [1, 2], "Фон инертен только у модального `dialog`; атрибут `open` открывает немодальное окно."),
    mcq("html.interactive-elements.e5", "intermediate", "Что делает `<form method=\"dialog\">` внутри `<dialog>`?", ["Отправляет данные на сервер", "Закрывает окно и записывает `value` нажатой кнопки в `returnValue`", "Открывает другое окно", "Очищает форму"], 1, "Отправка такой формы закрывает диалог без запроса и передаёт значение кнопки."),
    mcq("html.interactive-elements.e6", "advanced", "Для чего подходит `popover=\"manual\"`?", ["Для меню с лёгким закрытием", "Для панелей и тостов, закрываемых только явно", "Для модальных окон", "Для аккордеона"], 1, "`manual` не закрывается кликом снаружи и Esc: подходит для независимых панелей."),
    open("html.interactive-elements.e7", "intermediate", "Объясните, когда выбрать модальный `dialog`, когда `popover`, а когда `details`.", [
      ul(
        "`dialog.showModal()` — когда нужно прервать работу и получить решение или ввод: подтверждение, форма, критичное сообщение; фон инертен.",
        "`popover` — вспомогательные панели без блокировки фона: меню, подсказки, фильтры; лёгкое закрытие.",
        "`details` — раскрытие дополнительного содержимого в потоке страницы: FAQ, пояснения; работает без JS.",
      ),
      p("Во всех случаях проверяйте клавиатуру, имя и состояние для скринридера."),
    ], ["Названо различие модальности", "Названы примеры для каждого", "Упомянута проверка клавиатуры и доступности"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.interactive-elements.m1", "intermediate", "Почему не следует задавать `display: flex` на сам `dialog`?", ["Это запрещено", "Это переопределит скрытие закрытого окна", "Это отключит `::backdrop`", "Это блокирует Esc"], 1, "Стиль `display` на `dialog` перекроет `display: none` закрытого окна, и оно будет видно."),
    mcq("html.interactive-elements.m2", "advanced", "Что из перечисленного НЕ делает `popover` автоматически?", ["Помещает элемент в верхний слой", "Закрывает по клику снаружи (auto)", "Определяет роль меню и клавиатурную модель", "Связывает кнопку-инициатор с панелью"], 2, "`popover` — механизм показа; семантику меню и клавиатуру нужно реализовывать по образцу APG."),
    mcq("html.interactive-elements.m3", "advanced", "Как правильно поддержать браузеры без `popover`?", ["Проверять User-Agent", "Проверять возможность (`hasOwnProperty(\"popover\")`) и иметь запасной вариант", "Не поддерживать", "Использовать `alert`"], 1, "Проверка возможностей и прогрессивное улучшение надёжнее проверки версий браузера."),
    open("html.interactive-elements.m4", "advanced", "Команда предлагает сделать все оверлеи через `popover`, включая подтверждение удаления: «меньше кода». Что вы ответите?", [
      ul(
        "Popover закрывается кликом снаружи и не блокирует фон: пользователь может случайно закрыть критичное подтверждение или продолжить работать с интерфейсом под ним.",
        "Подтверждение, прерывающее работу, — задача модального `dialog`: инертный фон, фокус внутри, `returnValue`.",
        "Разные инструменты для разных задач: `details` для раскрытия, `popover` для вспомогательных панелей, `dialog` для решений.",
        "Единообразие обеспечивает дизайн-система (стили и поведение), а не один элемент на всё.",
      ),
    ], ["Названо отличие по модальности", "Предложен выбор по задаче", "Предложена дизайн-система для единообразия"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.interactive-elements.f1", front: "Аккордеон без JS?", back: "`<details name=\"x\">` у всех блоков группы: открыт один." },
    { id: "html.interactive-elements.f2", front: "`showModal()` vs `show()`?", back: "showModal — модальное (инертный фон, backdrop, Esc, возврат фокуса); show — немодальное." },
    { id: "html.interactive-elements.f3", front: "popover без JS?", back: "Кнопка `popovertarget=\"id\"` + элемент с атрибутом `popover`." },
    { id: "html.interactive-elements.f4", front: "`form method=\"dialog\"`?", back: "Закрывает окно без отправки; `value` кнопки → `dialog.returnValue`." },
    { id: "html.interactive-elements.f5", front: "Что НЕ даёт popover?", back: "Инертный фон, захват фокуса, роль меню и клавиатурную модель." },
    { id: "html.interactive-elements.f6", front: "Верхний слой?", back: "Слой над всем: модальные `dialog`, открытые popover. Не зависит от `z-index` и `overflow`." },
  ],

  sources: [
    { title: "HTML Living Standard — The details element", url: "https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element", publisher: "WHATWG" },
    { title: "HTML Living Standard — The dialog element", url: "https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element", publisher: "WHATWG" },
    { title: "HTML Living Standard — Popover API", url: "https://html.spec.whatwg.org/multipage/popover.html", publisher: "WHATWG" },
    { title: "MDN: <details>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details", publisher: "MDN" },
    { title: "MDN: <dialog>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog", publisher: "MDN" },
    { title: "MDN: Popover API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Popover_API", publisher: "MDN" },
    { title: "ARIA Authoring Practices Guide: Dialog (Modal) Pattern", url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/", publisher: "W3C" },
  ],
};
