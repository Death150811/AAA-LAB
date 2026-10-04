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

export const formsBasics: Topic = {
  id: "html.forms-basics",
  slug: "forms-basics",
  domain: "html",
  module: "forms",
  title: "Формы: отправка данных",
  titleEn: "Forms: form element, method, action, enctype, successful controls, FormData",
  summary:
    'Форма — главный способ, которым пользователь **отправляет данные** на сервер без единой строки JavaScript. Тема объясняет, что именно уходит на сервер (и что нет), как отличаются GET и POST, что такое `enctype`, как проходит отправка шаг за шагом и как это согласуется с `fetch` и `FormData`.',
  minutes: 50,
  prerequisites: ["html.elements-attributes", "html.links"],
  tags: ["form", "action", "method", "get", "post", "enctype", "multipart", "formdata", "submit", "name", "successful controls", "csrf", "requestSubmit"],
  keyConcepts: [
    { term: "Форма", en: "form", text: "Элемент, собирающий значения своих элементов управления и отправляющий их по адресу `action` методом `method`." },
    { term: "Успешный элемент управления", en: "successful control", text: "Элемент, чьё значение попадает в отправку: есть `name`, не отключён, а флажки и переключатели — отмечены." },
    { term: "GET и POST", text: "GET помещает данные в адрес (безопасные запросы, закладки); POST — в тело запроса (изменение состояния)." },
    { term: "enctype", text: "Способ кодирования тела запроса: `application/x-www-form-urlencoded` (по умолчанию), `multipart/form-data` (для файлов)." },
    { term: "Неявная отправка", en: "implicit submission", text: "Нажатие Enter в текстовом поле отправляет форму, если у неё есть кнопка отправки (или единственное такое поле)." },
  ],
  sections: [
    section("definition", [
      def("Форма", "Элемент `<form>`, объединяющий **элементы управления** (поля, флажки, списки, кнопки) и описывающий, **куда** (`action`) и **как** (`method`, `enctype`) отправить собранные значения. При отправке браузер формирует **набор данных формы** и делает HTTP-запрос.", "form element"),
      table(
        ["Атрибут `<form>`", "Значение", "Смысл"],
        [
          ["`action`", "URL", "Куда отправлять. По умолчанию — адрес текущей страницы"],
          ["`method`", "`get` (по умолчанию), `post`, `dialog`", "HTTP-метод; `dialog` закрывает содержащий `<dialog>`"],
          ["`enctype`", "`application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`", "Кодирование тела для POST"],
          ["`target`", "`_self`, `_blank`, имя фрейма", "Где показать ответ"],
          ["`novalidate`", "булев", "Не проверять ограничения перед отправкой"],
          ["`autocomplete`", "`on`/`off`", "Разрешение автозаполнения для всей формы"],
          ["`name`, `id`", "строка", "Имя/идентификатор формы"],
        ],
      ),
      note("Форма работает **без JavaScript**: отправка, сбор данных, встроенная проверка, возврат ответа сервера — всё это обеспечивает браузер. JavaScript лишь улучшает (отправка без перезагрузки, динамическая проверка)."),
    ]),

    section("why", [
      h("Проблема: передать данные серверу"),
      p("Страница, которая только показывает информацию, ничего не принимает. Чтобы войти в систему, оставить комментарий, отфильтровать товары, оформить заказ, нужно отправить данные. Для этого в HTML придумана форма: стандартный способ сказать «собери значения этих полей и отправь по такому-то адресу таким-то способом»."),
      h("Почему форма устроена так"),
      ul(
        "**Декларативность.** Поведение (сбор, кодирование, проверка, Enter для отправки, возврат фокуса) описывается атрибутами, а не кодом — одинаково в любом браузере.",
        "**Универсальность.** Один и тот же механизм поддерживает поиск (GET), вход (POST), загрузку файлов (multipart).",
        "**Надёжность.** Форма — часть HTML: работает при медленном JS, без JS, в старых браузерах, программах чтения.",
        "**Единые ассоциации.** `label`, `fieldset`, `name` и `form` создают связи, которые используют браузер, автозаполнение и программы чтения.",
      ),
      insight("Форма — **контракт** между страницей и сервером: имена полей (`name`) — это ключи, значения — то, что ввёл пользователь. Серверный код ожидает именно эти ключи."),
    ]),

    section("mental-model", [
      p("Представьте бумажный бланк: у бланка есть адрес, по которому он будет отправлен (`action`), способ доставки (`method`), графы с названиями для заполнения (поля с `name`) и кнопка «Отправить». Сотрудник почты (браузер) собирает заполненные графы в конверт и отправляет. Незаполненные графы без названия или зачёркнутые (отключённые) в конверт не кладут."),
      diagram(
        `
        <form action="/search" method="get">
          <input name="q" value="html">                 ──►  q=html
          <select name="sort"><option value="new" selected>…</select>  ──►  sort=new
          <input type="checkbox" name="inStock" checked> ──►  inStock=on
          <input type="checkbox" name="sale">            ──►  (не отмечен → не отправляется)
          <input name="note" disabled value="x">         ──►  (disabled → не отправляется)
          <input value="без имени">                      ──►  (нет name → не отправляется)
          <button type="submit">Найти</button>
        </form>

        Итог GET-запроса:   /search?q=html&sort=new&inStock=on
        `,
        "Что попадает в набор данных формы",
      ),
    ]),

    section("technical", [
      h("Что отправляется: «успешные» элементы"),
      table(
        ["Элемент", "Отправляется ли", "Условия"],
        [
          ["Текстовые поля, `textarea`, `select`", "Да", "Есть `name` и не `disabled`"],
          ["`checkbox`, `radio`", "Только **отмеченные**", "Значение — `value` (по умолчанию `on`)"],
          ["`button`/`input[type=submit]`", "Только кнопка, **нажавшая отправку**", "Есть `name`; значение — `value`"],
          ["`input[type=file]`", "Да (при `multipart/form-data`)", "Имя файла и содержимое"],
          ["`input[type=hidden]`", "Да", "Скрытое поле: не секретное, видно в DevTools"],
          ["`disabled`", "**Нет**", "Отключённые поля игнорируются"],
          ["`readonly`", "Да", "Только для чтения, но отправляется"],
          ["Без `name`", "**Нет**", "Значение без имени не может быть ключом"],
          ["`<output>`, `<fieldset>`, `<label>`", "Нет", "Не являются элементами управления данными"],
        ],
      ),
      h("GET или POST"),
      table(
        ["", "GET", "POST"],
        [
          ["Куда идут данные", "В адрес: `?q=html&sort=new`", "В тело запроса"],
          ["Назначение", "**Чтение**: поиск, фильтры, навигация", "**Изменение**: создание, вход, оплата"],
          ["Закладки, ссылки", "Работают (адрес содержит состояние)", "Нет"],
          ["Кеширование и повтор", "Безопасны; браузер может кешировать и повторять", "Повтор — повторное действие; браузер спросит подтверждение"],
          ["Размер и приватность", "Ограничен длиной URL; значения попадают в историю, журналы", "Нет жёсткого предела; не попадает в URL"],
          ["Файлы", "Нельзя", "Можно (`multipart/form-data`)"],
        ],
      ),
      warn("POST — **не** защита. Данные в теле не зашифрованы сами по себе (нужен HTTPS) и не защищены от подделки запроса. Пароли и платёжные данные отправляют POST по HTTPS, а сервер дополнительно защищается от CSRF."),
      h("Кодирование: `enctype`"),
      table(
        ["Значение", "Когда", "Вид тела"],
        [
          ["`application/x-www-form-urlencoded` (по умолчанию)", "Обычные поля", "`name=значение&name2=значение2`; пробел → `+`, прочее — %-кодирование UTF-8"],
          ["`multipart/form-data`", "**Файлы** и крупные данные", "Каждое поле — отдельная часть с границей и заголовками"],
          ["`text/plain`", "Отладка", "Читаемо, но неформализовано; не используйте в продакшене"],
        ],
      ),
      h("Расширенные возможности"),
      ul(
        "**`form=\"id\"`** на элементе управления привязывает его к форме **вне** вложенности (поле в другой части страницы).",
        "**`formaction`, `formmethod`, `formenctype`, `formtarget`, `formnovalidate`** на кнопке переопределяют настройки формы для этой отправки (например, «Сохранить черновик» и «Опубликовать»).",
        "**Кнопки:** `<button>` без `type` — это **submit**! Для кнопок, не отправляющих форму, всегда указывайте `type=\"button\"`.",
        "**Сброс:** `type=\"reset\"` возвращает значения по умолчанию; используется редко и опасен (пользователь случайно сотрёт ввод).",
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <!-- 1. Поиск: GET, состояние в адресе -->
        <form action="/search" method="get" role="search">
          <label for="q">Поиск</label>
          <input id="q" name="q" type="search">
          <button type="submit">Найти</button>
        </form>

        <!-- 2. Вход: POST -->
        <form action="/login" method="post">
          <label for="email">Почта</label>
          <input id="email" name="email" type="email" autocomplete="username" required>
          <label for="pwd">Пароль</label>
          <input id="pwd" name="password" type="password" autocomplete="current-password" required>
          <button type="submit">Войти</button>
        </form>

        <!-- 3. Загрузка файла: POST + multipart -->
        <form action="/upload" method="post" enctype="multipart/form-data">
          <label for="doc">Документ</label>
          <input id="doc" name="document" type="file" accept=".pdf,.docx">
          <button type="submit">Загрузить</button>
        </form>
        `,
        { lineNumbers: true, filename: "forms.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <form id="f">
          <label>Имя <input name="name" value="Анна"></label>
          <label><input type="checkbox" name="news" checked> Подписаться</label>
          <button>Показать данные</button>
        </form>

        <script>
          document.getElementById("f").addEventListener("submit", (event) => {
            event.preventDefault();   // не отправляем, только показываем, что собрал бы браузер
            console.log(new URLSearchParams(new FormData(event.target)).toString());
          });
        </script>
        `,
        { runnable: true },
      ),
      p("Нажмите кнопку и посмотрите в консоль песочницы: `name=%D0%90%D0%BD%D0%BD%D0%B0&news=on`. Это в точности то, что браузер отправил бы на сервер: имя поля, закодированное значение и `on` для отмеченного флажка. Снимите флажок — ключ `news` исчезнет."),
    ]),

    section("detailed-example", [
      p("Форма обратной связи с несколькими видами отправки и ассоциированной кнопкой вне формы. Серверная сторона получает чётко названные поля."),
      code(
        "html",
        `
        <form id="feedback" action="/feedback" method="post">
          <p>
            <label for="name">Имя</label>
            <input id="name" name="name" autocomplete="name" required>
          </p>
          <p>
            <label for="topic">Тема</label>
            <select id="topic" name="topic">
              <option value="">— выберите —</option>
              <option value="bug">Ошибка</option>
              <option value="idea">Предложение</option>
            </select>
          </p>
          <fieldset>
            <legend>Как с вами связаться?</legend>
            <label><input type="radio" name="contact" value="email" checked> Почта</label>
            <label><input type="radio" name="contact" value="phone"> Телефон</label>
          </fieldset>
          <p>
            <label for="msg">Сообщение</label>
            <textarea id="msg" name="message" rows="5" required></textarea>
          </p>

          <button type="submit">Отправить</button>
          <button type="submit" formaction="/feedback/draft" formnovalidate>Сохранить черновик</button>
        </form>

        <!-- Кнопка вне формы, привязанная атрибутом form -->
        <button type="submit" form="feedback">Отправить (из подвала)</button>
        `,
        { lineNumbers: true, filename: "feedback.html", collapsed: true },
      ),
      p("Что получит сервер при отправке со значениями «Анна», темой «Ошибка», выбором «Телефон» и текстом «Не работает кнопка»:"),
      code("http", `POST /feedback HTTP/1.1\nContent-Type: application/x-www-form-urlencoded\n\nname=%D0%90%D0%BD%D0%BD%D0%B0&topic=bug&contact=phone&message=%D0%9D%D0%B5+%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%B0%D0%B5%D1%82+%D0%BA%D0%BD%D0%BE%D0%BF%D0%BA%D0%B0`),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <form action="/feedback" method="post">
          <label for="name">Имя</label>
          <input id="name" name="name" required>
          <input type="checkbox" name="news" checked>
          <input name="draft" disabled value="1">
          <button type="submit" name="action" value="send">Отправить</button>
          <button type="submit" name="action" value="draft" formnovalidate>Черновик</button>
        </form>
        `,
        [
          { line: 1, text: "`action` — адрес обработчика, `method=\"post\"` — данные в теле. Без `method` форма использует GET." },
          { line: 3, text: "`name=\"name\"` — **ключ** в данных формы. Атрибут `id` нужен для связи с `label`, а на отправку не влияет." },
          { line: 4, text: "Отмеченный флажок отправится как `news=on`; снятый — не отправится вовсе (сервер должен трактовать отсутствие ключа как «выключено»)." },
          { line: 5, text: "`disabled` — поле **не отправляется**. Если значение нужно показать, но не редактировать и всё же отправить, используйте `readonly` (или скрытое поле)." },
          { line: 6, text: "Кнопка с `name` отправляется **только если именно она нажата**: сервер узнаёт, какое действие выбрано (`action=send`)." },
          { line: 7, text: "`formnovalidate` у второй кнопки: при «Черновик» браузерная проверка `required` не выполняется." },
        ],
        "form-submit.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Запуск отправки", "Пользователь нажимает кнопку отправки, или нажимает Enter в поле (неявная отправка), или скрипт вызывает `form.requestSubmit()`. (`form.submit()` **пропускает** проверку и событие `submit`.)"],
          ["Проверка ограничений", "Если нет `novalidate`/`formnovalidate`, браузер проверяет все поля (`required`, `pattern`, типы). При ошибке отправка отменяется, фокус переходит на первое неверное поле, показывается сообщение."],
          ["Событие `submit`", "Срабатывает событие `submit` (отменяемое): здесь скрипт может вызвать `preventDefault()` и отправить данные через `fetch`."],
          ["Построение набора данных", "Браузер обходит элементы управления в порядке дерева, выбирает «успешные» и формирует пары имя–значение (кнопка отправки включается, если она нажала)."],
          ["Кодирование и запрос", "По `enctype` данные кодируются в запрос: GET — в строку запроса `action`, POST — в тело."],
          ["Ответ", "Если не отменено — выполняется **навигация**: ответ сервера заменяет документ (`target=\"_self\"`) или открывается в другом контексте."],
        ],
        "Что происходит при отправке формы",
      ),
      h("Post/Redirect/Get"),
      p("После POST сервер, как правило, отвечает **перенаправлением** (302/303) на страницу результата. Иначе пользователь, обновив страницу, повторит запрос (браузер спросит «повторить отправку формы?») — например, дважды оплатит заказ. Шаблон «POST → редирект → GET» устраняет это."),
      h("FormData и fetch"),
      code(
        "js",
        `
        const form = document.getElementById("feedback");

        form.addEventListener("submit", async (event) => {
          event.preventDefault();                     // отменяем стандартную навигацию
          const data = new FormData(form);            // тот же набор данных, что собрал бы браузер
          const response = await fetch(form.action, { method: form.method, body: data });
          if (response.ok) form.reset();
        });
        `,
        { lineNumbers: true },
      ),
      p("`new FormData(form)` повторяет набор данных, который собрал бы браузер; при `body: FormData` кодирование — `multipart/form-data` (заголовок `Content-Type` с границей `fetch` подставит сам: не задавайте его вручную)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Поля без `name`"),
      wrongRight(
        "html",
        {
          code: `<input id="email" type="email">`,
          note: "Поле видно и работает, но на сервер не уходит: у значения нет ключа. Частая причина «форма отправляется пустой».",
        },
        {
          code: `<input id="email" name="email" type="email">`,
          note: "`name` — ключ в данных формы; `id` — для `label` и скриптов. Обычно нужны оба.",
        },
      ),
      h("Ошибка 2. Кнопка по умолчанию — отправка"),
      wrongRight(
        "html",
        {
          code: `
            <form action="/save" method="post">
              <input name="title">
              <button onclick="preview()">Предпросмотр</button>   <!-- type не указан → submit -->
            </form>
          `,
          note: "Кнопка без `type` внутри формы отправляет форму. «Предпросмотр» неожиданно сохраняет данные.",
        },
        {
          code: `
            <form action="/save" method="post">
              <input name="title">
              <button type="button" data-action="preview">Предпросмотр</button>
              <button type="submit">Сохранить</button>
            </form>
          `,
          note: "Всегда указывайте `type`: `button` для действий скрипта, `submit` — для отправки.",
        },
      ),
      h("Ошибка 3. Чувствительные данные в GET"),
      p("`method=\"get\"` для логина или платёжных данных помещает пароль в адрес: он попадает в историю браузера, журналы серверов и прокси, заголовок `Referer`. Для такого — только POST (и HTTPS)."),
      h("Ошибка 4. POST для поиска и фильтров"),
      p("Фильтры каталога через POST теряют возможность поделиться ссылкой и вернуться кнопкой «Назад» к тому же результату. Состояние просмотра должно быть в URL (GET)."),
      h("Ошибка 5. Файлы без `multipart/form-data`"),
      p("Форма с `<input type=\"file\">`, но без `enctype=\"multipart/form-data\"` (и без `method=\"post\"`) отправит только имена файлов, а не их содержимое."),
      h("Ошибка 6. `disabled` вместо `readonly`"),
      p("Если значение должно уйти на сервер, но быть недоступным для редактирования, `disabled` не подходит — поле не отправляется. Используйте `readonly` (или скрытое поле). Но помните: сервер **не должен верить** клиентским данным в любом случае."),
    ]),

    section("antipatterns", [
      ul(
        "**«Форма» без `<form>`:** поля и кнопка в `div` с обработчиком, собирающим данные вручную. Теряются Enter для отправки, валидация, автозаполнение, `FormData`, доступность.",
        "**Полагаться на клиентскую проверку.** Любую проверку в браузере можно обойти; сервер обязан проверять заново.",
        "**Скрытые поля с «секретами»** (цена, права, id пользователя): значения подменяются в DevTools.",
        "**Отправка без CSRF-защиты** для действий, изменяющих состояние: нужен токен или `SameSite`-cookie.",
        "**Повторяющиеся имена там, где нужны массивы,** без понимания, как сервер их разбирает (`tags=a&tags=b` против `tags[]=a`).",
        "**Отключение кнопки отправки** до заполнения (скрывает причину ошибки): лучше сообщать, что именно не так.",
        "**`autocomplete=\"off\"` везде:** мешает менеджерам паролей и автозаполнению.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Поиск и фильтры — GET; изменения — POST (PUT/DELETE через JS) по HTTPS.**",
        "**У каждого поля — осмысленный `name`.** Для флажков и радио продумайте `value`.",
        "**Кнопкам — `type` явно.**",
        "**Для файлов — `method=\"post\"` + `enctype=\"multipart/form-data\"`.**",
        "**После POST — редирект (Post/Redirect/Get).**",
        "**Серверная проверка всегда;** клиентская — для удобства.",
        "**CSRF-токен или `SameSite=Lax/Strict` cookie** для изменяющих запросов.",
        "**Прогрессивное улучшение:** форма должна работать без JavaScript; затем перехватываем `submit` и отправляем через `fetch` с `FormData`.",
        "**Используйте `requestSubmit()`,** а не `submit()`: сохраняет проверку и событие.",
        "**`label` для каждого поля** (отдельная тема) и `autocomplete` с правильными значениями.",
      ),
    ]),

    section("edge-cases", [
      h("Неявная отправка по Enter"),
      p("Если в форме есть кнопка отправки, Enter в текстовом поле **активирует её** (кликает «кнопку по умолчанию» — первую кнопку submit). Если кнопки нет, Enter отправит форму только тогда, когда в ней **ровно одно** поле, блокирующее неявную отправку (текстовое поле и т.п.). Это объясняет «почему форма отправляется по Enter» и «почему не отправляется»."),
      h("Несколько значений с одним `name`"),
      p("Несколько полей с одинаковым `name` (например, флажки `tags`) отправляются как несколько пар: `tags=a&tags=b`. Как их собрать в массив, зависит от серверного фреймворка. В `FormData` — `getAll(\"tags\")`."),
      h("Порядок отправки"),
      p("Пары идут в порядке элементов в дереве документа. Если сервер зависит от порядка — это хрупко."),
      h("`form` вне вложенности"),
      p("Поля могут находиться вне `<form>` и быть связаны с ней атрибутом `form=\"id\"`; вложенность форм друг в друга **недопустима** (парсер игнорирует вложенный `<form>`)."),
      h("Переносы строк и кодировка"),
      p("В `textarea` переводы строк нормализуются в `CRLF` при отправке. Кодировка — UTF-8 (по `accept-charset` или кодировке документа)."),
      h("`method=\"dialog\"`"),
      p("Форма внутри `<dialog>` с `method=\"dialog\"` закрывает диалог и записывает значение нажатой кнопки в `dialog.returnValue`, не делая сетевого запроса."),
      h("`target=\"_blank\"` и POST"),
      p("Ответ на POST откроется в новой вкладке; удобно для PDF-отчётов. Для безопасности добавляйте `rel=\"noopener\"` (поддерживается `<form rel>`)."),
      h("Повторная отправка и двойной клик"),
      p("Пользователи дважды нажимают «Оплатить». Решение — идемпотентность на сервере (токен операции) и мягкая блокировка кнопки после первой отправки (но не `disabled` до проверки)."),
    ]),

    section("related", [
      ul(
        "[Типы полей ввода](/learn/html/input-types) — какие бывают `input` и как выбрать нужный.",
        "[Элементы управления и метки](/learn/html/form-controls) — `label`, `fieldset`, `select`, `textarea`.",
        "[Валидация форм](/learn/html/form-validation) — встроенная проверка и Constraint Validation API.",
        "[Автозаполнение и UX форм](/learn/html/form-ux-autocomplete) — `autocomplete`, `inputmode`, подсказки.",
        "[Безопасность HTML](/learn/html/html-security) — CSRF, XSS, доверие к данным.",
        "Из других курсов: **JS** — `FormData`, `fetch`, событие `submit`; **CS/сети** — HTTP-методы, кодирование, идемпотентность, куки.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Форма на скриптах",
          code: `
            <div class="form">
              <input id="q">
              <div class="btn" onclick="send(document.getElementById('q').value)">Найти</div>
            </div>
          `,
          note: "Нет `form` → нет Enter, валидации, автозаполнения и доступности; значение поля без `name`; кнопка — `div`; не работает без JS; состояние не в URL.",
        },
        {
          title: "Форма на платформе",
          code: `
            <form action="/search" method="get" role="search">
              <label for="q">Поиск</label>
              <input id="q" name="q" type="search">
              <button type="submit">Найти</button>
            </form>
          `,
          note: "Enter, кнопка, ярлык, ссылка вида `/search?q=…`, работа без JS — всё «из коробки». JavaScript может лишь улучшить.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.forms-basics.ex1",
      title: "Что уйдёт на сервер?",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Предскажите строку запроса, которая получится при отправке формы (метод GET). Пользователь ничего не менял и нажал первую кнопку «Найти»."),
        code(
          "html",
          `
          <form action="/s" method="get">
            <input name="q" value="html css">
            <input name="city" value="Москва" disabled>
            <input name="zip" value="101000" readonly>
            <input type="checkbox" name="a" checked>
            <input type="checkbox" name="b" value="yes">
            <input type="radio" name="r" value="1">
            <input type="radio" name="r" value="2" checked>
            <select name="sort"><option value="new">Новые</option><option value="old" selected>Старые</option></select>
            <input value="без имени">
            <button type="submit" name="go" value="1">Найти</button>
            <button type="submit" name="reset" value="1">Сброс</button>
          </form>
          `,
        ),
      ],
      hints: ["Какие поля не отправляются: disabled, без name, неотмеченные?", "Какая из кнопок нажала отправку?"],
      checks: ["Исключены `city`, `b`, `r=1`, поле без имени и вторая кнопка", "Пробел закодирован как `+` или `%20`", "Порядок следует порядку в документе"],
      solution: [
        code("text", `/s?q=html+css&zip=101000&a=on&r=2&sort=old&go=1`),
        ul(
          "`city` — `disabled` → не отправляется.",
          "`zip` — `readonly` отправляется.",
          "`a` — отмечен: `a=on`; `b` — не отмечен: пропущен.",
          "`r` — отмечен только второй: `r=2`.",
          "`sort` — выбран `old`.",
          "Поле без `name` — пропущено. Из двух кнопок отправку вызвала **первая** (нажата по умолчанию при Enter): `go=1`.",
        ),
      ],
    }),
    exercise({
      id: "html.forms-basics.ex2",
      title: "Форма регистрации и загрузки аватара",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Напишите форму регистрации: имя, почта, пароль, согласие с правилами (флажок), аватар (файл PNG/JPEG). Выберите метод, `enctype`, продумайте `name`, `value`, `type` кнопок. Добавьте вторую кнопку «Сохранить черновик», отправляющую данные на другой адрес без проверки."),
      ],
      hints: ["Какой `method` и `enctype` нужны для файла?", "Что отправится, если флажок не отмечен?", "Как отключить проверку для черновика?"],
      checks: ["`method=\"post\"` и `enctype=\"multipart/form-data\"`", "У всех полей есть `name`", "Кнопки с явным `type`; черновик — `formaction` и `formnovalidate`"],
      solution: [
        code(
          "html",
          `
          <form action="/signup" method="post" enctype="multipart/form-data">
            <p><label for="n">Имя</label> <input id="n" name="name" autocomplete="name" required></p>
            <p><label for="e">Почта</label> <input id="e" name="email" type="email" autocomplete="email" required></p>
            <p><label for="p">Пароль</label> <input id="p" name="password" type="password" minlength="8" autocomplete="new-password" required></p>
            <p><label for="a">Аватар</label> <input id="a" name="avatar" type="file" accept="image/png,image/jpeg"></p>
            <p><label><input type="checkbox" name="agree" value="yes" required> Согласен с правилами</label></p>

            <button type="submit">Зарегистрироваться</button>
            <button type="submit" formaction="/signup/draft" formnovalidate>Сохранить черновик</button>
          </form>
          `,
          { lineNumbers: true },
        ),
        note("Если флажок `agree` не отмечен, ключ вообще не придёт на сервер — сервер должен трактовать отсутствие как «нет». Для пароля используется POST; передача по HTTPS обязательна."),
      ],
    }),
    exercise({
      id: "html.forms-basics.ex3",
      title: "Пустая отправка и случайные сохранения",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("QA сообщает: (1) заказ создаётся при нажатии кнопки «Применить купон»; (2) комментарий приходит пустым; (3) загруженный файл на сервере оказывается именем без содержимого; (4) после оплаты обновление страницы создаёт второй платёж. Найдите причины и исправьте."),
      ],
      starter: {
        lang: "html",
        code: `
          <form action="/order" method="post">
            <input id="coupon" name="coupon">
            <button onclick="applyCoupon()">Применить купон</button>

            <textarea id="comment"></textarea>

            <input type="file" name="doc">
            <button>Оплатить</button>
          </form>
        `,
      },
      hints: ["Что делает `<button>` без `type`?", "Что нужно textarea, чтобы попасть в запрос?", "Какой `enctype` нужен файлу?", "Что должен сделать сервер после POST?"],
      checks: ["Кнопке купона — `type=\"button\"`", "У textarea есть `name`", "Добавлен `enctype=\"multipart/form-data\"`", "Назван шаблон Post/Redirect/Get"],
      solution: [
        ul(
          "**(1)** `<button>` без `type` внутри формы — `submit`: добавьте `type=\"button\"`.",
          "**(2)** У `textarea` нет `name`: значение не отправляется.",
          "**(3)** Для файла нужен `enctype=\"multipart/form-data\"`, иначе уходит только имя.",
          "**(4)** Сервер отвечает HTML на POST; после обновления браузер повторяет запрос. Нужен редирект на страницу результата (PRG) и идемпотентный токен операции.",
        ),
        code(
          "html",
          `
          <form action="/order" method="post" enctype="multipart/form-data">
            <input id="coupon" name="coupon">
            <button type="button" data-action="apply-coupon">Применить купон</button>

            <textarea id="comment" name="comment"></textarea>

            <input type="file" name="doc">
            <button type="submit">Оплатить</button>
          </form>
          `,
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.forms-basics.challenge",
    title: "Проектирование форм интернет-магазина: поиск, фильтры, заказ, загрузка",
    scenario: [
      p("Магазин нуждается в четырёх формах: (1) поиск с фильтрами (категория, цена от/до, «в наличии», сортировка); (2) оформление заказа (контакты, доставка, оплата); (3) обращение в поддержку с вложением до 5 файлов; (4) массовое действие над выбранными товарами в корзине (удалить, перенести в избранное)."),
      p("Для каждой формы выберите метод, `enctype`, структуру адреса и ответа, способ защиты и поведение после отправки. Опишите, какие данные и в каком виде придут на сервер."),
    ],
    requirements: [
      "Метод, `enctype`, `action` для каждой формы с обоснованием",
      "Пример итогового запроса (строка или тело)",
      "Защита от повторной отправки и CSRF для изменяющих форм",
      "Поведение без JavaScript и как его улучшить",
    ],
    constraints: [
      "Состояние поиска должно быть в URL",
      "Чувствительные данные — только в теле запроса и по HTTPS",
      "Каждая форма работает без JavaScript",
    ],
    acceptance: [
      "Поиск — GET с `name` у каждого поля; адрес пригоден как ссылка",
      "Заказ — POST + редирект на страницу подтверждения (PRG)",
      "Поддержка — POST + `multipart/form-data` + `multiple`",
      "Массовое действие: несколько кнопок с `name=\"action\"` или `formaction`",
    ],
    hints: [
      "Что произойдёт при обновлении страницы после каждой формы?",
      "Как различать действия «удалить» и «в избранное» на сервере?",
      "Как передать массив выбранных товаров?",
    ],
    solution: [
      table(
        ["Форма", "Метод / enctype", "Данные", "После отправки"],
        [
          ["Поиск и фильтры", "`GET`, по умолчанию", "`/search?q=чайник&cat=kitchen&min=500&max=3000&stock=on&sort=price`", "Страница результатов; ссылкой можно поделиться, «Назад» возвращает к фильтрам"],
          ["Заказ", "`POST`, urlencoded; HTTPS", "`name=…&phone=…&delivery=courier&pay=card` + CSRF-токен + токен операции", "`303 See Other` → `/orders/1042` (PRG); повтор безопасен благодаря токену операции"],
          ["Поддержка", "`POST`, `multipart/form-data`", "Текстовые поля + `files` (`<input type=file multiple name=files>`)", "Редирект на «Спасибо»; лимиты размера и типов на сервере"],
          ["Массовое действие в корзине", "`POST`, urlencoded", "`item=17&item=23&action=delete` (несколько чекбоксов `name=\"item\"`)", "Редирект на корзину; сервер выполняет `action` из нажатой кнопки"],
        ],
      ),
      code(
        "html",
        `
        <!-- Массовое действие: несколько кнопок с одним name -->
        <form action="/cart/bulk" method="post">
          <input type="hidden" name="csrf" value="…">
          <label><input type="checkbox" name="item" value="17"> Чайник</label>
          <label><input type="checkbox" name="item" value="23"> Кофеварка</label>

          <button type="submit" name="action" value="delete">Удалить выбранное</button>
          <button type="submit" name="action" value="favorite">В избранное</button>
        </form>
        `,
        { lineNumbers: true },
      ),
      ul(
        "**Без JavaScript** все формы работают: браузер собирает данные, отправляет, показывает ответ. **С JavaScript** — перехват `submit`, отправка `fetch` + `FormData`, оптимистичное обновление; при сбое — фолбэк на обычную отправку.",
        "**CSRF:** скрытое поле с токеном сессии либо `SameSite=Lax` cookie + проверка `Origin`; **идемпотентность:** уникальный токен операции у заказа.",
        "**Сервер:** проверка всех данных заново, лимиты файлов, обработка отсутствующих ключей (неотмеченные флажки).",
        "**Кнопки с `name=\"action\"`:** сервер узнаёт нажатую по значению; либо `formaction` с разными адресами.",
      ),
    ],
  },

  interview: [
    iq("html.forms-basics.i1", "basic", "Что делает атрибут `name` у поля формы?", [
      p("Это ключ, под которым значение попадёт в данные формы. Поле без `name` на сервер не уходит. `id` нужен для связи с `label` и скриптов, но на отправку не влияет."),
    ]),
    iq("html.forms-basics.i2", "basic", "В чём разница между GET и POST в форме?", [
      p("GET помещает данные в адрес: подходит для поиска, фильтров, навигации, даёт ссылки и закладки, ограничен длиной URL. POST — в тело запроса: для изменения состояния, больших данных, файлов, чувствительных значений (по HTTPS). POST не кешируется и не повторяется браузером без подтверждения."),
    ]),
    iq("html.forms-basics.i3", "intermediate", "Какие элементы управления НЕ попадут в данные формы?", [
      ul(
        "Без `name`.",
        "С `disabled`.",
        "Неотмеченные `checkbox` и `radio`.",
        "Кнопки, которые не нажимали для отправки.",
        "`<output>`, `<label>`, `<fieldset>` и другие не-управляющие элементы.",
      ),
      p("`readonly` и `hidden` — отправляются."),
    ]),
    iq("html.forms-basics.i4", "intermediate", "Когда нужен `enctype=\"multipart/form-data\"`?", [
      p("Для отправки файлов (`input type=file`) и крупных/бинарных данных. По умолчанию `application/x-www-form-urlencoded` кодирует пары `имя=значение`, но не умеет передавать содержимое файлов. Метод при этом — POST."),
    ]),
    iq("html.forms-basics.i5", "intermediate", "Что делает `<button>` без `type` внутри формы?", [
      p("Это `type=\"submit\"` по умолчанию: клик отправляет форму. Поэтому кнопкам, выполняющим действия скрипта, нужно явно писать `type=\"button\"`."),
    ]),
    iq("html.forms-basics.i6", "advanced", "В чём разница между `form.submit()` и `form.requestSubmit()`?", [
      p("`submit()` отправляет форму **сразу**, минуя проверку ограничений и событие `submit`. `requestSubmit()` имитирует нажатие кнопки отправки: выполняет проверку, запускает событие `submit` (его можно отменить) и только затем отправляет."),
    ]),
    iq("html.forms-basics.i7", "engineering", "Как вы реализуете форму, которая работает без JavaScript и улучшается им?", [
      ol(
        "Базовая форма: `action`, `method`, `name`, `label`, встроенная проверка; сервер всё проверяет и возвращает страницу с ошибками.",
        "Серверный шаблон отображает ошибки рядом с полями и сохраняет введённые значения.",
        "JavaScript перехватывает `submit`, отправляет `fetch` с `FormData`, показывает ошибки без перезагрузки; при отказе JS — работает базовый вариант.",
        "Идемпотентность, CSRF-защита, PRG.",
      ),
    ]),
    iq("html.forms-basics.i8", "debugging", "Форма отправляется, но сервер получает пустое значение для одного поля. С чего начнёте?", [
      ol(
        "Проверить `name` у поля (опечатка, отсутствие).",
        "Проверить `disabled` и вложенность в нужную `<form>` (не в чужую, не вне формы без `form=`).",
        "В DevTools → Network посмотреть тело запроса и `Content-Type`.",
        "Для файлов — `enctype` и `method`.",
        "Проверить, не перезаписывает ли скрипт значение или не меняет ли `FormData`.",
      ),
    ]),
  ],

  exam: [
    mcq("html.forms-basics.e1", "foundation", "Какой атрибут задаёт адрес, на который отправляется форма?", ["`method`", "`action`", "`target`", "`name`"], 1, "`action` — адрес обработчика; по умолчанию используется адрес текущей страницы."),
    mcq("html.forms-basics.e2", "foundation", "Какой метод формы используется по умолчанию?", ["`post`", "`get`", "`put`", "`dialog`"], 1, "Если `method` не указан, форма отправляется методом GET."),
    mcq("html.forms-basics.e3", "intermediate", "Что будет отправлено на сервер?", ["`q=html&flag=on`", "`q=html`", "`q=html&flag=on&x=1`", "`flag=on`"], 1, "Поле `flag` отключено (`disabled`), а третий флажок не имеет `name` — оба в набор данных не попадают. Отправится только `q=html`.", { code: { lang: "html", code: "<form method=\"get\">\n  <input name=\"q\" value=\"html\">\n  <input name=\"flag\" type=\"checkbox\" checked disabled>\n  <input type=\"checkbox\" checked>\n</form>" }, format: "output" }),
    mcq("html.forms-basics.e4", "intermediate", "Какой `enctype` нужен для загрузки файлов?", ["`text/plain`", "`application/x-www-form-urlencoded`", "`multipart/form-data`", "`application/json`"], 2, "Для файлов применяется `multipart/form-data` вместе с методом POST."),
    mcq("html.forms-basics.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["Неотмеченный `checkbox` не отправляется", "`disabled` поля отправляются", "`readonly` поля отправляются", "Поле без `name` не отправляется"], [0, 2, 3], "`disabled`-поля не отправляются; `readonly` — отправляются."),
    mcq("html.forms-basics.e6", "advanced", "Зачем нужен шаблон Post/Redirect/Get?", ["Для ускорения GET", "Чтобы обновление страницы после POST не повторяло действие", "Чтобы кешировать POST", "Чтобы шифровать данные"], 1, "После POST сервер перенаправляет на GET-страницу результата, и обновление её не повторяет отправку."),
    open("html.forms-basics.e7", "intermediate", "Объясните, почему форма на платформе (`<form>` + `name` + `button`) лучше самодельной «формы» на `div` с JavaScript.", [
      p("Платформенная форма даёт «бесплатно»: отправку по Enter, встроенную проверку, автозаполнение браузера и менеджеров паролей, сбор данных (`FormData`), правильные роли для программ чтения, работу без JavaScript и стандартные состояния (`:invalid`, `:disabled`)."),
      p("Самодельный вариант должен воспроизвести всё это вручную и почти всегда теряет часть возможностей (клавиатура, доступность, надёжность при сбое скрипта), а ещё требует собственного сбора данных."),
    ], ["Названы Enter, валидация, автозаполнение, FormData", "Названы доступность и работа без JS", "Названа стоимость самодельного решения"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.forms-basics.m1", "intermediate", "Какой вариант корректен для формы поиска?", ["`<form method=\"post\">`", "`<form action=\"/search\" method=\"get\">`", "`<div onsubmit>`", "`<form method=\"dialog\">`"], 1, "Поиск — чтение; GET помещает запрос в URL, ссылкой можно поделиться."),
    mcq("html.forms-basics.m2", "advanced", "Что произойдёт при `form.submit()` для формы с `required`-полем, оставленным пустым?", ["Браузер покажет сообщение о незаполненном поле", "Форма отправится без проверки и без события `submit`", "Ничего", "Форма очистится"], 1, "`submit()` пропускает проверку и событие; для проверки используйте `requestSubmit()`."),
    mcq("html.forms-basics.m3", "advanced", "Две кнопки submit с `name=\"action\"` и разными `value`. Что отправится?", ["Значения обеих", "Только нажатой кнопки", "Ничего", "Только первой"], 1, "В данные формы включается только кнопка, вызвавшая отправку."),
    open("html.forms-basics.m4", "advanced", "Опишите шаги от нажатия Enter в текстовом поле до отображения новой страницы. Что может отменить отправку?", [
      ol(
        "Неявная отправка: Enter активирует кнопку по умолчанию (или отправляет единственное поле).",
        "Проверка ограничений (`required`, `type`, `pattern`…); при ошибке — отмена и сообщение.",
        "Событие `submit` — скрипт может вызвать `preventDefault()` (например, чтобы отправить `fetch`).",
        "Построение набора данных (успешные элементы, кнопка-инициатор).",
        "Кодирование по `enctype`, формирование запроса (`method`, `action`).",
        "Ответ сервера и навигация (замена документа); при POST обычно редирект (PRG).",
      ),
      p("Отменить: ошибки проверки, `preventDefault()` в обработчике `submit`."),
    ], ["Названы проверка, событие submit, набор данных, запрос, навигация", "Названы способы отмены"], { format: "concept" }),
  ],

  flashcards: [
    { id: "html.forms-basics.f1", front: "Что отправляется в форме?", back: "Элементы с `name`, не `disabled`; отмеченные checkbox/radio; нажавшая кнопка." },
    { id: "html.forms-basics.f2", front: "GET vs POST?", back: "GET — в URL (поиск, ссылки). POST — в теле (изменения, файлы, секреты по HTTPS)." },
    { id: "html.forms-basics.f3", front: "Файлы в форме?", back: "`method=\"post\"` + `enctype=\"multipart/form-data\"`." },
    { id: "html.forms-basics.f4", front: "`<button>` без type?", back: "Это `submit`. Для обычных кнопок — `type=\"button\"`." },
    { id: "html.forms-basics.f5", front: "submit() vs requestSubmit()?", back: "`submit()` без проверки и события. `requestSubmit()` — как клик по кнопке." },
    { id: "html.forms-basics.f6", front: "Post/Redirect/Get?", back: "После POST — редирект на GET-страницу результата; обновление не повторяет действие." },
  ],

  sources: [
    { title: "HTML Living Standard — Forms", url: "https://html.spec.whatwg.org/multipage/forms.html", publisher: "WHATWG" },
    { title: "HTML Living Standard — Form submission", url: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-2", publisher: "WHATWG" },
    { title: "MDN: <form>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form", publisher: "MDN" },
    { title: "MDN: FormData", url: "https://developer.mozilla.org/en-US/docs/Web/API/FormData", publisher: "MDN" },
  ],
};
