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

export const webStorage: Topic = {
  id: "html.web-storage",
  slug: "web-storage",
  domain: "html",
  module: "advanced",
  title: "Хранение данных в браузере",
  titleEn: "Browser storage: localStorage, sessionStorage, cookies, IndexedDB and the storage event",
  summary:
    "Браузер умеет хранить данные между визитами — но каждый механизм хранения имеет свои границы: время жизни, объём, доступ скриптам и серверу, безопасность. Тема учит выбирать между `localStorage`, `sessionStorage`, cookies и IndexedDB и писать надёжный код: с обработкой ошибок, версиями данных и без хранения секретов.",
  minutes: 55,
  prerequisites: ["html.parsing-dom", "html.forms-basics"],
  tags: ["localStorage", "sessionStorage", "Web Storage", "cookies", "IndexedDB", "storage event", "same-origin", "QuotaExceededError", "HttpOnly", "SameSite", "XSS", "privacy", "navigator.storage"],
  keyConcepts: [
    { term: "Web Storage", text: "Хранилище «ключ → строка», синхронное, привязанное к **источнику** (origin). `localStorage` — постоянное, `sessionStorage` — на вкладку." },
    { term: "Только строки", text: "Любое значение превращается в строку. Объекты хранят через `JSON.stringify`/`JSON.parse`, с обработкой ошибок." },
    { term: "Не место для секретов", text: "Любой скрипт страницы (включая внедрённый через XSS) читает хранилище. Токены доступа и пароли — не сюда." },
    { term: "Хранилище может быть недоступно", text: "Запрет в настройках, режим приватности, песочница, переполнение квоты — оборачивайте доступ в `try/catch`." },
    { term: "Событие storage", text: "Срабатывает в **других** вкладках того же источника при изменении `localStorage`; в самой вкладке не приходит." },
  ],
  sections: [
    section("definition", [
      def("Web Storage", "Интерфейс `Storage` с двумя экземплярами: `window.localStorage` (данные сохраняются между сессиями, пока их не удалят) и `window.sessionStorage` (данные живут, пока открыта вкладка). Методы `getItem`, `setItem`, `removeItem`, `clear`, `key`, свойство `length`. Ключи и значения — только строки.", "Web Storage API"),
      def("Источник (origin)", "Тройка «схема + хост + порт». Хранилище изолировано по источнику: `https://example.com` и `https://app.example.com` — разные источники с разными хранилищами.", "origin"),
      p("Помимо Web Storage браузер предлагает cookies (отправляются на сервер), IndexedDB (большие структурированные данные), Cache API и service workers (оффлайн-ресурсы). Выбор механизма — это выбор свойств хранения."),
    ]),

    section("why", [
      h("Зачем хранить данные на клиенте"),
      ul(
        "**Запоминать выбор пользователя:** тема оформления, язык, свернутые панели.",
        "**Сохранять черновики:** текст сообщения, незавершённая форма — чтобы случайное закрытие вкладки не стоило данных.",
        "**Ускорять интерфейс:** кэш справочников, последние поисковые запросы.",
        "**Работать без сети:** оффлайн-режим, очередь отправки.",
        "**Анонимные сценарии:** корзина до входа в аккаунт.",
      ),
      h("Почему «просто положу в localStorage» — опасная привычка"),
      p("Хранилище кажется удобным и бесплатным, но в нём нет защиты: любой скрипт на странице читает его целиком; данные переживают смену пользователя на общем компьютере; запись синхронная и блокирует основной поток; объём ограничен; доступ может быть запрещён. Выбор неправильного механизма приводит к утечкам (токены в `localStorage` — классика XSS), потере данных и зависаниям интерфейса."),
      insight("Задавайте три вопроса перед записью: **Кто должен это видеть?** (клиент / сервер), **Как долго хранить?** (вкладка / навсегда) и **Что случится, если украдут?** Ответы определяют механизм."),
    ]),

    section("mental-model", [
      p("Представьте четыре «ящика» в браузере. **sessionStorage** — блокнот на столе: исчезает, когда вы уходите (закрыли вкладку). **localStorage** — шкаф в комнате: остаётся, но им может пользоваться любой, кто зашёл в комнату (скрипт этого источника). **Cookie** — записка, которую браузер сам кладёт в каждый конверт на сервер. **IndexedDB** — архив с картотекой: большой, структурированный, асинхронный."),
      diagram(
        `
                       видит скрипт   уходит на сервер   время жизни        объём        API
        sessionStorage    да             нет             вкладка            ~5 МБ        синхронный
        localStorage      да             нет             до удаления        ~5 МБ        синхронный
        cookie            да*            ДА (каждый      до Expires/        ~4 КБ        document.cookie /
                                         запрос)         Max-Age                          Set-Cookie
        IndexedDB         да             нет             до удаления        сотни МБ+    асинхронный

        * кроме cookie с HttpOnly — они невидимы скрипту
        `,
        "Сравнение механизмов хранения",
      ),
      table(
        ["Задача", "Лучший выбор", "Почему"],
        [
          ["Тема, язык, свёрнутые панели", "`localStorage`", "Мелкие неконфиденциальные настройки на постоянной основе"],
          ["Шаг мастера, состояние вкладки", "`sessionStorage`", "Данные нужны только текущей вкладке"],
          ["Идентификатор сессии, токен входа", "Cookie `HttpOnly; Secure; SameSite`", "Недоступна скриптам (защита от XSS), управляется сервером"],
          ["Большие данные, оффлайн-кэш, очередь", "IndexedDB (+ Cache API)", "Объём, структура, транзакции, асинхронность"],
          ["Секреты, персональные данные", "**Не на клиенте** (или только в памяти)", "Любое клиентское хранилище читается XSS и утекает"],
        ],
        "Какой механизм выбрать",
      ),
    ]),

    section("technical", [
      h("API Web Storage"),
      table(
        ["Метод/свойство", "Что делает"],
        [
          ["`setItem(key, value)`", "Записывает значение (приводит к строке). Может бросить `QuotaExceededError`"],
          ["`getItem(key)`", "Возвращает строку или `null`, если ключа нет"],
          ["`removeItem(key)`", "Удаляет ключ"],
          ["`clear()`", "Удаляет **все** ключи источника"],
          ["`key(i)`, `length`", "Перебор ключей по индексу (порядок не определён)"],
        ],
      ),
      code(
        "js",
        `
        localStorage.setItem("theme", "dark");
        localStorage.getItem("theme");      // "dark"
        localStorage.getItem("missing");    // null — не undefined и не ""

        localStorage.setItem("count", 5);
        typeof localStorage.getItem("count"); // "string" — число превратилось в строку

        localStorage.setItem("user", { name: "Ann" });
        localStorage.getItem("user");        // "[object Object]" — потеря данных!

        // Правильно: JSON
        localStorage.setItem("user", JSON.stringify({ name: "Ann", plan: "pro" }));
        const user = JSON.parse(localStorage.getItem("user") ?? "null");
        `,
        { filename: "storage-basics.js" },
      ),
      ul(
        "**Только строки:** числа, булевы значения и объекты превращаются в строки; `undefined` — в `\"undefined\"`.",
        "**Синхронный API:** каждая операция блокирует основной поток. Большие объёмы данных тормозят интерфейс.",
        "**Объём:** около 5 МБ на источник (зависит от браузера; считается в единицах UTF-16). При превышении — `QuotaExceededError`.",
        "**`sessionStorage`** отделён **по вкладке** (browsing context): две вкладки одного сайта имеют разные `sessionStorage`; обновление страницы данные сохраняет; при дублировании вкладки они копируются.",
        "**Изоляция по источнику:** другой протокол (`http` против `https`), поддомен или порт — другое хранилище.",
      ),
      h("Событие `storage`"),
      code(
        "js",
        `
        // Сработает в ДРУГИХ вкладках того же источника, когда localStorage изменили
        window.addEventListener("storage", (e) => {
          // e.key, e.oldValue, e.newValue, e.url, e.storageArea
          if (e.key === "theme") applyTheme(e.newValue);
          if (e.key === null) console.log("storage.clear() вызван в другой вкладке");
        });
        `,
        { filename: "storage-event.js" },
      ),
      ul(
        "В вкладке, которая **сделала** изменение, событие **не приходит**.",
        "`e.key === null` означает `clear()`.",
        "Подходит для синхронизации настроек между вкладками. Для сообщений в реальном времени удобнее `BroadcastChannel`.",
      ),
      h("Надёжный доступ: ошибки и недоступность"),
      p("Обращение к `localStorage` может бросить исключение: пользователь запретил хранилище, браузер в режиме приватности с жёсткими ограничениями, страница загружена из песочницы (`<iframe sandbox>` без `allow-same-origin`) или превышена квота. Поэтому доступ оборачивают в функции с `try/catch` и запасным вариантом в памяти."),
      code(
        "js",
        `
        const memory = new Map();

        const storage = {
          get(key, fallback = null) {
            try {
              const raw = localStorage.getItem(key);
              return raw === null ? fallback : JSON.parse(raw);
            } catch {
              return memory.has(key) ? memory.get(key) : fallback;
            }
          },
          set(key, value) {
            try {
              localStorage.setItem(key, JSON.stringify(value));
            } catch {
              memory.set(key, value);          // хранилище недоступно или переполнено — работаем в памяти
            }
          },
          remove(key) {
            try { localStorage.removeItem(key); } catch {}
            memory.delete(key);
          },
        };
        `,
        { filename: "safe-storage.js" },
      ),
      h("Версионирование и срок жизни"),
      ul(
        "**Пространство имён ключей:** `app:v2:cart`, чтобы не конфликтовать с другими скриптами того же источника.",
        "**Версия схемы:** в данных храните `version`; при несовместимости — миграция или сброс. Код после деплоя читает данные, записанные старой версией.",
        "**Срок жизни:** у хранилища нет TTL. Сохраняйте `expiresAt` и проверяйте при чтении.",
        "**Валидация при чтении:** данные могли быть изменены пользователем, расширением или старой версией кода.",
      ),
      h("Cookies"),
      code(
        "text",
        `
        Set-Cookie: sid=abc123; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000
        `,
        { caption: "Пример заголовка Set-Cookie для идентификатора сессии." },
      ),
      table(
        ["Атрибут", "Смысл"],
        [
          ["`Max-Age` / `Expires`", "Срок жизни; без них cookie «сессионная» (до закрытия браузера)"],
          ["`Path`, `Domain`", "К каким адресам и хостам относится (по умолчанию — только текущий хост)"],
          ["`Secure`", "Отправлять только по HTTPS"],
          ["`HttpOnly`", "**Недоступна JavaScript** (`document.cookie`) — защита от кражи через XSS"],
          ["`SameSite=Lax|Strict|None`", "Когда отправлять при межсайтовых запросах (защита от CSRF); `None` требует `Secure`"],
        ],
      ),
      ul(
        "Cookie отправляются **с каждым запросом** на соответствующий хост — тяжёлые cookie замедляют всё.",
        "Размер одной cookie — около 4 КБ; количество на домен ограничено.",
        "Для идентификатора сессии выбирайте `HttpOnly; Secure; SameSite=Lax` и ставьте её **сервером**.",
        "**Сторонние (third-party) cookie** блокируются или ограничиваются браузерами; не стройте на них критичные функции.",
      ),
      h("IndexedDB, Cache API и другое"),
      ul(
        "**IndexedDB:** асинхронная объектная база с индексами и транзакциями; сотни мегабайт и более. Удобнее работать через обёртки (`idb`, Dexie).",
        "**Cache API + Service Worker:** хранение HTTP-ответов для оффлайн-режима и управления загрузкой.",
        "**Оценка квоты:** `navigator.storage.estimate()` возвращает использованное и доступное место; `navigator.storage.persist()` запрашивает защиту данных от автоматической очистки.",
        "**Очистка браузером:** при нехватке места или для давно неиспользуемых сайтов; Safari ограничивает срок хранения данных, записанных скриптом, если пользователь не взаимодействует с сайтом (интеллектуальная защита от отслеживания). Данные нельзя считать вечными.",
      ),
      h("Безопасность и приватность"),
      ul(
        "**XSS читает всё хранилище.** Секреты (токены доступа, ключи, пароли) в `localStorage`/`sessionStorage` — прямой путь к утечке. Для сессий — `HttpOnly`-cookie.",
        "**Данные не шифруются** и доступны любому, кто сидит за этим профилем браузера.",
        "**Общий компьютер:** выход из аккаунта должен очищать пользовательские данные.",
        "**Согласие и законы о персональных данных:** хранение идентификаторов и данных, не необходимых для работы запрошенного сервиса, как правило, требует уведомления/согласия (GDPR, ePrivacy, локальные законы). Технически необходимые данные (корзина, язык) — исключение, но правила зависят от юрисдикции.",
        "**Не доверяйте прочитанному:** значение могло быть изменено пользователем — серверные проверки обязательны.",
      ),
    ]),

    section("syntax", [
      code(
        "js",
        `
        // Настройки: тема
        const THEME_KEY = "app:v1:theme";

        function loadTheme() {
          try {
            return localStorage.getItem(THEME_KEY) ?? "system";
          } catch {
            return "system";
          }
        }

        function saveTheme(theme) {
          try { localStorage.setItem(THEME_KEY, theme); } catch { /* хранилище недоступно */ }
          document.documentElement.dataset.theme = theme;
        }

        // Синхронизация между вкладками
        window.addEventListener("storage", (e) => {
          if (e.key === THEME_KEY) document.documentElement.dataset.theme = e.newValue ?? "system";
        });

        // Состояние вкладки
        sessionStorage.setItem("wizard:step", "2");
        `,
        { lineNumbers: true, filename: "settings.js" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <script>
          // Этот код выполняется в изолированном окне предпросмотра (iframe с sandbox без allow-same-origin),
          // поэтому доступ к localStorage запрещён — это реальный сценарий «хранилище недоступно».
          const memory = new Map();
          let backend = "localStorage";

          function save(key, value) {
            try {
              localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
              backend = "память (" + e.name + ")";
              memory.set(key, value);
            }
          }
          function load(key, fallback) {
            try {
              const raw = localStorage.getItem(key);
              return raw === null ? fallback : JSON.parse(raw);
            } catch {
              return memory.has(key) ? memory.get(key) : fallback;
            }
          }

          save("prefs", { theme: "dark", fontSize: 18 });
          console.log("хранилище:", backend);
          console.log("прочитано:", JSON.stringify(load("prefs", {})));
          console.log("нет ключа → запасное значение:", JSON.stringify(load("absent", { theme: "light" })));

          // Что происходит с типами после JSON-цикла (так «видит» их Storage)
          const back = JSON.parse(JSON.stringify({ n: 5, when: new Date(0), nothing: undefined }));
          console.log("n:", typeof back.n, "| when:", typeof back.when, "| nothing:", "nothing" in back);
        </script>
        `,
        { runnable: true },
      ),
      p("Окно предпросмотра в песочнице не имеет доступа к хранилищу: `localStorage.setItem` бросает `SecurityError`, и обёртка переключается на память. В обычной странице тот же код сохранит данные постоянно — а в вашем продукте так же ведут себя режимы приватности и запреты cookie."),
    ]),

    section("detailed-example", [
      p("Автосохранение черновика сообщения: запись с задержкой (debounce), версия схемы, срок жизни, восстановление при загрузке и синхронизация между вкладками. Код устойчив к повреждённым данным и недоступному хранилищу."),
      code(
        "html",
        `
        <form id="compose">
          <label for="msg">Сообщение</label>
          <textarea id="msg" rows="5"></textarea>
          <p id="status" role="status"></p>
          <button type="submit">Отправить</button>
        </form>

        <script>
          const KEY = "app:v2:draft";
          const TTL = 7 * 24 * 60 * 60 * 1000; // 7 дней
          const msg = document.getElementById("msg");
          const status = document.getElementById("status");

          function readDraft() {
            try {
              const raw = localStorage.getItem(KEY);
              if (!raw) return "";
              const data = JSON.parse(raw);
              if (data.version !== 2 || typeof data.text !== "string") return "";
              if (Date.now() > data.expiresAt) { localStorage.removeItem(KEY); return ""; }
              return data.text;
            } catch {
              return "";
            }
          }

          function writeDraft(text) {
            try {
              if (!text) { localStorage.removeItem(KEY); return; }
              localStorage.setItem(KEY, JSON.stringify({ version: 2, text, expiresAt: Date.now() + TTL }));
              status.textContent = "Черновик сохранён";
            } catch {
              status.textContent = "Не удалось сохранить черновик";
            }
          }

          let timer;
          msg.addEventListener("input", () => {
            clearTimeout(timer);
            timer = setTimeout(() => writeDraft(msg.value), 500);
          });

          msg.value = readDraft();

          document.getElementById("compose").addEventListener("submit", (e) => {
            e.preventDefault();
            try { localStorage.removeItem(KEY); } catch {}
            msg.value = "";
            status.textContent = "Отправлено";
          });

          window.addEventListener("storage", (e) => {
            if (e.key === KEY && document.activeElement !== msg) msg.value = readDraft();
          });
        </script>
        `,
        { lineNumbers: true, filename: "draft-autosave.html", collapsed: true },
      ),
      ul(
        "**Debounce 500 мс** — запись не на каждое нажатие клавиши (операция синхронная).",
        "**Версия и срок жизни** позволяют безопасно читать данные после обновления кода.",
        "**Двойной `try/catch`:** и чтение, и запись защищены; интерфейс сообщает о проблеме, а не «молча» теряет данные.",
        "**Событие `storage`** обновляет черновик в других вкладках, но не перезаписывает то, что человек печатает прямо сейчас.",
      ),
    ]),

    section("analysis", [
      annotated(
        "js",
        `
        const raw = localStorage.getItem("cart");
        const cart = raw ? JSON.parse(raw) : [];
        cart.push({ id: 7, qty: 1 });
        localStorage.setItem("cart", JSON.stringify(cart));
        window.addEventListener("storage", (e) => { if (e.key === "cart") render(); });
        sessionStorage.setItem("step", "3");
        `,
        [
          { line: 1, text: "`getItem` возвращает `null`, если ключа нет. Не `undefined` и не пустую строку — это важно для проверки." },
          { line: 2, text: "Разбор JSON: `raw` может быть `null` (нет данных) или повреждённой строкой — `JSON.parse` бросит исключение. В боевом коде это место оборачивают в `try/catch`." },
          { line: 3, text: "Данные изменяются **в памяти**: хранилище не обновляется, пока вы не вызовете `setItem`." },
          { line: 4, text: "Значение записывается целиком, в виде строки. Может бросить `QuotaExceededError` при переполнении, поэтому тоже нужен `try/catch`." },
          { line: 5, text: "Событие `storage` приходит в **другие** вкладки; текущая вкладка уже знает об изменении, потому что сама его сделала." },
          { line: 6, text: "`sessionStorage` принадлежит этой вкладке: «шаг 3» не появится в соседней вкладке и исчезнет при её закрытии." },
        ],
        "storage-annotated.js",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Определение источника", "Браузер сопоставляет страницу с хранилищем по источнику (схема+хост+порт). Страницы из песочницы без `allow-same-origin` получают «непрозрачный» источник и теряют доступ к хранилищу."],
          ["Чтение и запись", "`setItem` записывает значение синхронно в хранилище процесса браузера; на диск оно попадает с задержкой. Из-за синхронности в одном процессе страницы операции блокируют основной поток."],
          ["Рассылка события", "После изменения браузер **ставит в очередь** событие `storage` для остальных окон того же источника, у которых открыт тот же `localStorage`. Событие не приходит в окно, где изменение произошло."],
          ["Квота и вытеснение", "У каждого источника есть квота. При переполнении `setItem` бросает `QuotaExceededError`. При нехватке места браузер может очистить данные источников, которыми давно не пользовались (если не включён `persist`)."],
          ["Cookie иначе", "Cookie хранится отдельно от Web Storage: браузер сам прикладывает подходящие cookie к каждому запросу и сохраняет те, что пришли в `Set-Cookie`. `HttpOnly`-cookie недоступна JS."],
          ["Разделение хранилища (partitioning)", "В современных браузерах хранилище, к которому обращается встроенный сторонний `iframe`, **разделяется** по сайту верхнего уровня: один и тот же виджет на разных сайтах не видит общих данных."],
        ],
        "Как работает хранилище",
      ),
      note("Нельзя полагаться на то, что данные «останутся навсегда»: пользователь очистит хранилище, браузер вытеснит данные, режим приватности удалит их при закрытии окна. Критичные данные должны жить на сервере."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Токены и секреты в `localStorage`"),
      wrongRight(
        "js",
        {
          code: `
            // после входа
            localStorage.setItem("accessToken", token);
            fetch("/api/me", { headers: { Authorization: "Bearer " + localStorage.getItem("accessToken") } });
          `,
          note: "Любой XSS (скрипт сторонней библиотеки, внедрение через комментарий) прочитает токен и украдёт сессию.",
        },
        {
          code: `
            // сервер ставит cookie: Set-Cookie: sid=...; HttpOnly; Secure; SameSite=Lax
            fetch("/api/me", { credentials: "include" });
          `,
          note: "Сессионная cookie `HttpOnly` недоступна JavaScript; защита от CSRF — `SameSite` и токены.",
        },
      ),
      h("Ошибка 2. Объекты без сериализации"),
      p("`localStorage.setItem(\"user\", user)` сохранит строку `\"[object Object]\"`. Всегда `JSON.stringify` при записи и `JSON.parse` при чтении."),
      h("Ошибка 3. `JSON.parse` без защиты"),
      wrongRight(
        "js",
        {
          code: `
            const settings = JSON.parse(localStorage.getItem("settings"));
            settings.theme;   // TypeError, если ключа нет (null) или JSON повреждён
          `,
          note: "`JSON.parse(null)` вернёт `null`, а повреждённая строка бросит исключение — приложение падает при запуске.",
        },
        {
          code: `
            function loadSettings() {
              try {
                const raw = localStorage.getItem("settings");
                const data = raw ? JSON.parse(raw) : null;
                return data && typeof data === "object" ? data : { theme: "system" };
              } catch {
                return { theme: "system" };
              }
            }
          `,
          note: "Ошибки ловим, форму данных проверяем, возвращаем значения по умолчанию.",
        },
      ),
      h("Ошибка 4. Забыли про `QuotaExceededError` и недоступное хранилище"),
      p("Запись без `try/catch` в приватном режиме или в песочнице роняет скрипт. Оборачивайте доступ и предусмотрите запасной вариант."),
      h("Ошибка 5. Ключи без пространства имён и версии"),
      p("`localStorage.setItem(\"data\", …)` конфликтует со сторонними скриптами и ломается при изменении формата. Используйте префикс и версию (`app:v2:cart`)."),
      h("Ошибка 6. Ожидать `storage` в той же вкладке"),
      p("Событие приходит только в **другие** вкладки. Для реакции в текущей вкладке вызывайте нужную функцию сами или используйте собственное событие."),
      h("Ошибка 7. Большие данные в синхронном хранилище"),
      p("Хранение мегабайтов JSON и частая запись замораживают интерфейс. Для больших объёмов — IndexedDB (асинхронно) и «ленивая» запись."),
      h("Ошибка 8. Полагаться на хранилище как на источник истины"),
      p("Корзина, платёж, права доступа — серверные данные. Клиентское хранилище — кэш и удобство, а не авторитет."),
    ]),

    section("antipatterns", [
      ul(
        "**«Всё положим в localStorage»:** смешивание настроек, кэша, токенов и персональных данных без политики.",
        "**Хранение паролей, токенов, ключей и персональных данных** в открытом виде.",
        "**Отслеживание пользователей без согласия** через «вечные» идентификаторы.",
        "**Опора на `sessionStorage` для передачи данных между вкладками** — он не общий.",
        "**Хранение состояния приложения целиком** и его «гидрация» без версий и миграций.",
        "**Cookie для данных, которые не нужны серверу:** они раздувают каждый запрос.",
        "**Очистка пользовательских данных не при выходе из аккаунта** на общем устройстве.",
        "**Проверка прав на клиенте по данным из хранилища** («isAdmin = true»).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Выбирайте механизм по требованиям:** настройки — `localStorage`; состояние вкладки — `sessionStorage`; сессии — `HttpOnly`-cookie; большие данные — IndexedDB.",
        "**Оборачивайте доступ** в функции с `try/catch`, JSON-сериализацией, проверкой формы данных и запасным вариантом.",
        "**Ключи — с пространством имён и версией;** данные — с `version` и, при необходимости, `expiresAt`.",
        "**Не храните секреты** и персональные данные на клиенте без крайней необходимости; шифрование на клиенте не заменяет защиту ключа.",
        "**Пишите редко и небольшими порциями:** debounce, батчи; большие данные — в IndexedDB.",
        "**Синхронизируйте вкладки** через `storage` или `BroadcastChannel`.",
        "**Очищайте данные при выходе** и дайте пользователю возможность сбросить их.",
        "**Учитывайте приватность:** минимизируйте, объясняйте и запрашивайте согласие там, где это требуется.",
        "**Серверная проверка** всего, что пришло из клиентского хранилища.",
        "**Тестируйте** с отключённым хранилищем, в режиме приватности, при переполнении квоты и с повреждёнными данными.",
      ),
    ]),

    section("edge-cases", [
      h("Режим приватности"),
      p("В режиме «инкогнито» данные удаляются при закрытии окна; ранние версии Safari в приватном режиме бросали `QuotaExceededError` на любую запись. Современные браузеры позволяют запись, но не сохраняют данные между сессиями — не строить логику на «вечном» хранении."),
      h("`localStorage` в iframe"),
      p("Встроенный сторонний фрейм использует **разделённое** хранилище (partitioned) или не имеет доступа вовсе (блокировка сторонних данных). Виджеты, зависящие от общего хранилища между сайтами, перестают работать."),
      h("Порядок и перебор ключей"),
      p("`localStorage.key(i)` не гарантирует порядок. При перебоях храните индекс или структуру в одном ключе. Удаляя во время перебора, идите с конца или соберите список ключей заранее."),
      h("Типы и `undefined`"),
      p("`setItem(\"k\", undefined)` запишет строку `\"undefined\"`; `JSON.stringify(undefined)` вернёт `undefined`, а не строку. Не записывайте `undefined`: удаляйте ключ. Даты после JSON превращаются в строки — восстанавливайте явно."),
      h("Конкуренция вкладок"),
      p("Две вкладки могут читать и обновлять один ключ почти одновременно — «последняя запись побеждает». Для критичных операций используйте идентификаторы версии или Web Locks API."),
      h("Квота и оценка"),
      p("`navigator.storage.estimate()` возвращает приблизительные значения; фактическая квота зависит от браузера и свободного места. Запросите `persist()` для важных данных, но не рассчитывайте, что это гарантия."),
      h("Cookie и `SameSite`"),
      p("Если cookie должна отправляться при переходе со сторонних сайтов (SSO, платёжные редиректы), `SameSite=Lax` ограничивает отправку при межсайтовых POST-запросах и субресурсах. Для встраивания нужен `SameSite=None; Secure` — с осознанием рисков и ограничений сторонних cookie."),
      h("Service Worker и оффлайн"),
      p("Оффлайн-режим строят на Cache API и IndexedDB под управлением service worker; `localStorage` в service worker недоступен (синхронный API запрещён в воркерах)."),
    ]),

    section("related", [
      ul(
        "[Формы: отправка данных](/learn/html/forms-basics) — данные формы и `FormData`.",
        "[Безопасность HTML](/learn/html/html-security) — XSS, CSP, изоляция.",
        "[Прогрессивное улучшение](/learn/html/progressive-enhancement) — что делать, если хранилища нет.",
        "[Встраиваемое содержимое](/learn/html/embedded-content) — `iframe`, `sandbox` и доступ к хранилищу.",
        "Из других курсов: **JS** — `JSON`, `try/catch`, события, `BroadcastChannel`, IndexedDB; **HTTP** — `Set-Cookie`, `SameSite`, CORS; **Безопасность** — XSS, CSRF.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Хрупкий код",
          code: `
            localStorage.setItem("user", user);
            const token = localStorage.token;
            const cart = JSON.parse(localStorage.getItem("cart"));
            cart.push(item);
            localStorage.cart = JSON.stringify(cart);
          `,
          note: "Объект → «[object Object]»; токен в хранилище; `JSON.parse(null)`/повреждённые данные роняют код; свойства вместо методов; нет защиты и версий.",
        },
        {
          title: "Устойчивый код",
          code: `
            function read(key, fallback) {
              try {
                const raw = localStorage.getItem(key);
                return raw === null ? fallback : JSON.parse(raw);
              } catch { return fallback; }
            }
            function write(key, value) {
              try { localStorage.setItem(key, JSON.stringify(value)); return true; }
              catch { return false; }
            }

            const cart = read("app:v1:cart", []);
            cart.push(item);
            write("app:v1:cart", cart);
          `,
          note: "Обёртки с `try/catch`, JSON, значение по умолчанию, ключ с пространством имён и версией; токены — в `HttpOnly`-cookie.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.web-storage.ex1",
      title: "Куда это положить?",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждого типа данных выберите механизм (`localStorage`, `sessionStorage`, cookie, IndexedDB, только память, сервер) и обоснуйте:"),
        ol(
          "Тёмная/светлая тема оформления.",
          "Токен сессии пользователя.",
          "Текущий шаг многошаговой формы в одной вкладке.",
          "Черновик письма (до 20 КБ).",
          "Оффлайн-копия 5 000 статей с картинками (100 МБ).",
          "Пароль пользователя.",
          "Корзина до входа в аккаунт.",
          "Признак «пользователь — администратор» для показа меню.",
        ),
      ],
      hints: ["Что видит XSS?", "Нужны ли данные серверу при каждом запросе?", "Что случится при краже данных?"],
      checks: ["Секреты не на клиенте", "Большие данные — IndexedDB", "Права проверяются на сервере"],
      solution: [
        ol(
          "`localStorage` — мелкая неконфиденциальная настройка, нужна между сессиями.",
          "Cookie `HttpOnly; Secure; SameSite=Lax`, установленная сервером — недоступна JS.",
          "`sessionStorage` — данные нужны только этой вкладке.",
          "`localStorage` с версией и сроком жизни (или IndexedDB, если растёт); черновик не конфиденциален.",
          "IndexedDB + Cache API/service worker — большой объём, асинхронность.",
          "**Нигде на клиенте.** Пароль отправляют по HTTPS и не сохраняют; для удобства — менеджер паролей браузера.",
          "`localStorage` (идентификаторы товаров и количество), с последующим слиянием с серверной корзиной после входа.",
          "Не хранить как источник истины: права определяет сервер; клиент может показывать меню по ответу API.",
        ),
      ],
    }),
    exercise({
      id: "html.web-storage.ex2",
      title: "Тема оформления с синхронизацией вкладок",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Реализуйте переключатель темы (`light`, `dark`, `system`): значение хранится в `localStorage`, применяется на странице через `data-theme`, переживает обновление, синхронизируется между вкладками и не ломается, если хранилище недоступно. Предусмотрите ключ с версией."),
      ],
      hints: ["Какое событие сработает в других вкладках?", "Что сделать при `SecurityError`?", "Где применить тему, чтобы не было «вспышки»?"],
      checks: ["`try/catch` при чтении и записи", "`storage`-событие", "Запасное значение `system`", "Применение до отрисовки (инлайновый скрипт в `head`)"],
      solution: [
        code(
          "html",
          `
          <head>
            <script>
              // Выполняется до отрисовки: нет «вспышки» неверной темы
              (function () {
                var theme = "system";
                try { theme = localStorage.getItem("app:v1:theme") || "system"; } catch (e) {}
                document.documentElement.dataset.theme = theme;
              })();
            </script>
          </head>
          <body>
            <label for="theme">Тема</label>
            <select id="theme">
              <option value="system">Как в системе</option>
              <option value="light">Светлая</option>
              <option value="dark">Тёмная</option>
            </select>

            <script>
              const KEY = "app:v1:theme";
              const select = document.getElementById("theme");
              select.value = document.documentElement.dataset.theme;

              function apply(theme) {
                document.documentElement.dataset.theme = theme;
                select.value = theme;
              }

              select.addEventListener("change", () => {
                apply(select.value);
                try { localStorage.setItem(KEY, select.value); } catch {}
              });

              window.addEventListener("storage", (e) => {
                if (e.key === KEY) apply(e.newValue || "system");
              });
            </script>
          </body>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        note("Для режима `system` сопоставьте тему с `prefers-color-scheme` в CSS. Скрипт в `head` синхронный — он должен быть очень маленьким."),
      ],
    }),
    exercise({
      id: "html.web-storage.ex3",
      title: "Ломается после релиза",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("После релиза часть пользователей видит белый экран. В консоли: `Cannot read properties of null (reading 'items')`, `SyntaxError: Unexpected token u in JSON`, у других — `QuotaExceededError`. Тем временем безопасники нашли токен доступа в `localStorage`. Найдите причины и исправьте."),
      ],
      starter: {
        lang: "js",
        code: `
          const cart = JSON.parse(localStorage.getItem("cart"));
          render(cart.items);

          function save(cart) {
            localStorage.setItem("cart", JSON.stringify(cart));
            localStorage.setItem("token", token);
            localStorage.setItem("cache", JSON.stringify(bigList)); // ~8 МБ
          }
        `,
      },
      hints: ["Что вернёт `getItem` для отсутствующего ключа?", "Что записано старой версией приложения?", "Что делает `JSON.stringify(undefined)`?", "Сколько места доступно?"],
      checks: ["`try/catch` и значения по умолчанию", "Версия формата и миграция", "Токен убран из хранилища", "Большие данные — в IndexedDB"],
      solution: [
        ul(
          "**`JSON.parse(null)` → `null`**, затем `cart.items` — `TypeError`: нет проверки на отсутствие данных.",
          "**`SyntaxError`:** в хранилище осталось `\"undefined\"` или данные старого формата; нет версии схемы и проверки.",
          "**`QuotaExceededError`:** запись ~8 МБ превышает квоту; нет `try/catch`; большие данные нужно хранить в IndexedDB.",
          "**Токен в `localStorage`** доступен любому скрипту (XSS) → заменить `HttpOnly`-cookie.",
        ),
        code(
          "js",
          `
          const CART_KEY = "app:v2:cart";

          function loadCart() {
            try {
              const raw = localStorage.getItem(CART_KEY);
              const data = raw ? JSON.parse(raw) : null;
              if (data && data.version === 2 && Array.isArray(data.items)) return data;
            } catch {}
            return { version: 2, items: [] };
          }

          function saveCart(cart) {
            try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
            catch { /* показать сообщение или работать в памяти */ }
          }

          render(loadCart().items);
          // токен: Set-Cookie: sid=...; HttpOnly; Secure; SameSite=Lax (ставит сервер)
          // большой кэш: IndexedDB (асинхронно), с оценкой квоты через navigator.storage.estimate()
          `,
          { lineNumbers: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.web-storage.challenge",
    title: "Корзина без аккаунта: хранение, миграции, синхронизация вкладок и приватность",
    scenario: [
      p("Интернет-магазин разрешает собирать корзину без входа. Требования: корзина переживает закрытие браузера на 30 дней; изменения в одной вкладке сразу видны в другой; после входа корзина сливается с серверной; приложение не должно падать, если хранилище недоступно; формат корзины будет меняться (добавятся скидки и варианты товаров); данные не должны содержать секретов; юристы просят учесть требования к согласию и очистку при выходе."),
      p("Спроектируйте модуль хранения корзины: формат данных, API, обработку ошибок, миграции, синхронизацию, слияние после входа и меры безопасности/приватности."),
    ],
    requirements: [
      "Формат данных с версией и сроком жизни",
      "API модуля (`load`, `add`, `remove`, `clear`, `subscribe`) с обработкой ошибок",
      "Синхронизация между вкладками и защита от гонок",
      "Алгоритм слияния с серверной корзиной после входа",
      "Решение по безопасности, приватности и очистке",
    ],
    constraints: [
      "В хранилище — только идентификаторы товаров и количество (не цены и не персональные данные)",
      "Цены и итоговая сумма определяются сервером",
      "Модуль работает при недоступном хранилище",
    ],
    acceptance: [
      "Повреждённые или старые данные не роняют приложение",
      "Изменения в одной вкладке отражаются в другой",
      "После входа корзина без дублей сливается с серверной",
      "Данные удаляются по истечении 30 дней и при выходе из аккаунта",
    ],
    hints: [
      "Как разрешить конфликт, если одну корзину меняют две вкладки?",
      "Что делать с товаром, которого уже нет в каталоге?",
      "Нужно ли согласие на хранение корзины?",
    ],
    solution: [
      code(
        "js",
        `
        const KEY = "shop:v3:cart";
        const TTL = 30 * 24 * 60 * 60 * 1000;
        const memory = { value: null };
        const listeners = new Set();

        function empty() { return { version: 3, items: [], updatedAt: Date.now(), expiresAt: Date.now() + TTL }; }

        // Миграции: старая версия → новая
        function migrate(data) {
          if (!data || typeof data !== "object") return empty();
          if (data.version === 1 && Array.isArray(data.ids)) {            // v1: массив id без количества
            data = { version: 2, items: data.ids.map((id) => ({ id, qty: 1 })), updatedAt: Date.now() };
          }
          if (data.version === 2) {
            data = { ...data, version: 3, expiresAt: Date.now() + TTL };
          }
          return data.version === 3 && Array.isArray(data.items) ? data : empty();
        }

        function read() {
          try {
            const raw = localStorage.getItem(KEY);
            const data = migrate(raw ? JSON.parse(raw) : null);
            if (Date.now() > data.expiresAt) return empty();
            return data;
          } catch {
            return memory.value ?? empty();
          }
        }

        function write(cart) {
          cart.updatedAt = Date.now();
          cart.expiresAt = Date.now() + TTL;
          try { localStorage.setItem(KEY, JSON.stringify(cart)); }
          catch { memory.value = cart; }
          listeners.forEach((fn) => fn(cart));
        }

        export const cartStore = {
          load: read,
          add(id, qty = 1) {
            const cart = read();                                // читаем свежее состояние перед записью
            const row = cart.items.find((i) => i.id === id);
            if (row) row.qty = Math.min(99, row.qty + qty);
            else cart.items.push({ id, qty });
            write(cart);
          },
          remove(id) { const c = read(); c.items = c.items.filter((i) => i.id !== id); write(c); },
          clear() { try { localStorage.removeItem(KEY); } catch {} memory.value = null; listeners.forEach((fn) => fn(empty())); },
          subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
        };

        // Синхронизация вкладок
        window.addEventListener("storage", (e) => {
          if (e.key === KEY || e.key === null) listeners.forEach((fn) => fn(read()));
        });
        `,
        { lineNumbers: true, filename: "cart-store.js", collapsed: true },
      ),
      ul(
        "**Формат:** версия, список \`{ id, qty }\`, \`updatedAt\`, \`expiresAt\`. Цены и названия **не** хранятся: их определяет сервер по \`id\` при показе корзины и оформлении заказа.",
        "**Миграции:** функция \`migrate\` приводит любые поддерживаемые версии к текущей; неизвестное — пустая корзина (лучше потерять корзину, чем уронить приложение).",
        "**Ошибки:** чтение и запись защищены; при недоступном хранилище корзина живёт в памяти вкладки и показывается уведомление «Корзина не сохранится после закрытия».",
        "**Гонки:** перед каждой записью читаем свежее состояние (\`read()\`), поэтому конфликты минимальны; для строгой атомарности можно использовать Web Locks API или счётчик версий и повтор.",
        "**Слияние после входа:** клиент отправляет \`{id, qty}\` серверу; сервер сопоставляет с корзиной аккаунта (суммирует количество, ограничивая максимум, исключает недоступные товары) и возвращает итог; клиент очищает локальную копию и работает с серверной.",
        "**Приватность и закон:** корзина — технически необходимые данные, нужные для запрошенного сервиса, но политику хранения (30 дней) необходимо описать в уведомлении о cookie/хранилище; аналитические идентификаторы в этот ключ не добавляются; при выходе из аккаунта локальная корзина очищается; пользователь может очистить вручную.",
        "**Безопасность:** нет токенов и персональных данных; значения из хранилища валидируются (тип, диапазон количества) и не используются как доверенные для цен или скидок.",
        "**Тесты:** отключённое хранилище, повреждённый JSON, старые версии, переполнение квоты, две вкладки с одновременными изменениями, истёкший срок.",
      ),
    ],
  },

  interview: [
    iq("html.web-storage.i1", "basic", "Чем `localStorage` отличается от `sessionStorage`?", [
      p("`localStorage` сохраняется между сессиями, пока данные не удалят, и общий для всех вкладок источника. `sessionStorage` живёт, пока открыта вкладка, и отдельный в каждой вкладке (сохраняется при обновлении страницы)."),
    ]),
    iq("html.web-storage.i2", "basic", "Какого типа значения хранятся в Web Storage?", [
      p("Только строки. Числа и булевы значения превращаются в строки, объекты — в `\"[object Object]\"`. Для структур используют `JSON.stringify`/`JSON.parse`."),
    ]),
    iq("html.web-storage.i3", "intermediate", "Когда срабатывает событие `storage` и в каких вкладках?", [
      p("При изменении `localStorage` (и `sessionStorage` в рамках одной вкладки с фреймами). Событие приходит в **другие** окна/вкладки того же источника, но не в ту, где изменение выполнено. `e.key === null` означает вызов `clear()`."),
    ]),
    iq("html.web-storage.i4", "intermediate", "Почему не стоит хранить токен доступа в `localStorage`?", [
      p("Любой скрипт на странице, включая внедрённый через XSS, может прочитать `localStorage` и украсть токен. Для сессий используют cookie с `HttpOnly; Secure; SameSite`, недоступную JavaScript."),
    ]),
    iq("html.web-storage.i5", "intermediate", "Какие исключения и сбои может вызвать работа с `localStorage`?", [
      ul(
        "`QuotaExceededError` при переполнении квоты.",
        "`SecurityError` при запрете хранилища (настройки, песочница `iframe`, блокировка сторонних данных).",
        "`SyntaxError` при `JSON.parse` повреждённых данных.",
        "Поэтому доступ оборачивают в `try/catch` с запасным вариантом.",
      ),
    ]),
    iq("html.web-storage.i6", "advanced", "Как вы организуете версионирование данных в `localStorage`?", [
      ul(
        "Ключи с пространством имён и версией (`app:v2:cart`) и/или поле `version` внутри данных.",
        "Функции миграции: из старых версий в текущую; неизвестное — безопасное значение по умолчанию.",
        "Валидация формы данных при чтении; защита от повреждений.",
        "Тесты на чтение данных, записанных предыдущими релизами.",
      ),
    ]),
    iq("html.web-storage.i7", "engineering", "Когда выбрать IndexedDB вместо `localStorage`?", [
      ul(
        "Большие объёмы данных (мегабайты и более).",
        "Нужны индексы, запросы, транзакции и структурированные объекты.",
        "Нельзя блокировать основной поток (IndexedDB асинхронна).",
        "Оффлайн-приложения и очереди синхронизации; чаще через обёртки (idb, Dexie).",
      ),
    ]),
    iq("html.web-storage.i8", "debugging", "Приложение падает при запуске у части пользователей из-за данных в `localStorage`. Как диагностировать и исправить?", [
      ul(
        "Посмотреть ошибки (`TypeError`, `SyntaxError`) и состояние хранилища на проблемном профиле.",
        "Выяснить, какая версия приложения записала данные; воспроизвести на этих данных.",
        "Исправить чтение: `try/catch`, проверка формы, значения по умолчанию, миграции.",
        "Добавить версию схемы и тесты на старые форматы; предусмотреть сброс повреждённых данных.",
      ),
    ]),
  ],

  exam: [
    mcq("html.web-storage.e1", "foundation", "Что вернёт `localStorage.getItem(\"absent\")` для несуществующего ключа?", ["`undefined`", "`null`", "Пустую строку", "Ошибку"], 1, "Для отсутствующего ключа `getItem` возвращает `null`."),
    mcq("html.web-storage.e2", "foundation", "Какого типа значение вернёт `getItem` после `setItem(\"n\", 5)`?", ["`number`", "`string`", "`boolean`", "`object`"], 1, "Web Storage хранит только строки; числа нужно приводить обратно."),
    mcq("html.web-storage.e3", "intermediate", "Где безопаснее хранить идентификатор сессии?", ["`localStorage`", "`sessionStorage`", "Cookie с `HttpOnly; Secure; SameSite`", "В глобальной переменной"], 2, "`HttpOnly`-cookie недоступна JavaScript, что защищает от кражи при XSS."),
    mcq("html.web-storage.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["Событие `storage` приходит и во вкладку, сделавшую изменение", "`sessionStorage` отдельный в каждой вкладке", "`localStorage` — синхронный API", "Cookie не отправляются на сервер"], [1, 2], "Событие `storage` приходит в другие вкладки; cookie отправляются с запросами."),
    mcq("html.web-storage.e5", "intermediate", "Что произойдёт при вызове `localStorage.setItem` в `iframe sandbox` без `allow-same-origin`?", ["Данные сохранятся", "Будет выброшен `SecurityError`", "Данные запишутся в `sessionStorage`", "Ничего, без ошибки"], 1, "Документ получает непрозрачный источник и теряет доступ к хранилищу."),
    mcq("html.web-storage.e6", "advanced", "Какой механизм подходит для хранения 100 МБ данных для оффлайн-режима?", ["`localStorage`", "Cookie", "IndexedDB (и Cache API)", "`sessionStorage`"], 2, "IndexedDB асинхронна и рассчитана на большие структурированные данные."),
    open("html.web-storage.e7", "intermediate", "Объясните, как выбрать между `localStorage`, `sessionStorage`, cookie и IndexedDB.", [
      ul(
        "`localStorage` — мелкие неконфиденциальные настройки между сессиями; `sessionStorage` — данные одной вкладки.",
        "Cookie — когда данные нужны серверу при каждом запросе; для сессий — `HttpOnly; Secure; SameSite`.",
        "IndexedDB — большие и структурированные данные, оффлайн.",
        "Секреты и персональные данные — не на клиенте. Критерии: кто видит, как долго, сколько, что будет при краже.",
      ),
    ], ["Названы свойства каждого механизма", "Названы критерии выбора", "Указано, что секреты не хранят на клиенте"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.web-storage.m1", "intermediate", "Как правильно прочитать объект из `localStorage`?", ["`localStorage.user.name`", "`JSON.parse(localStorage.getItem(\"user\"))` в `try/catch`", "`localStorage.getItem(\"user\").name`", "`Object.assign({}, localStorage.user)`"], 1, "Нужны `getItem`, `JSON.parse` и обработка ошибок и отсутствующих данных."),
    mcq("html.web-storage.m2", "advanced", "Две вкладки меняют одну корзину. Какая стратегия минимизирует потерю изменений?", ["Хранить корзину в глобальной переменной", "Перед каждой записью читать свежее состояние и использовать `storage`-синхронизацию (при необходимости — Web Locks)", "Использовать `sessionStorage`", "Никак не обрабатывать"], 1, "Чтение актуального состояния перед записью и синхронизация сокращают окно гонки."),
    mcq("html.web-storage.m3", "advanced", "Почему корзине нельзя доверять цены из `localStorage`?", ["Они не помещаются", "Пользователь может изменить значения; цены определяет сервер", "Браузер шифрует данные", "Цены нельзя сериализовать"], 1, "Данные клиента недоверенные: цены и суммы вычисляются и проверяются на сервере."),
    open("html.web-storage.m4", "advanced", "Команда хочет хранить JWT доступа и данные профиля в `localStorage`, «чтобы не ходить на сервер». Какие риски вы назовёте и что предложите?", [
      ul(
        "XSS даёт злоумышленнику токен и данные: хранилище читается любым скриптом страницы.",
        "Данные профиля устаревают и могут быть подменены пользователем; на общем устройстве остаются после выхода.",
        "Предложение: сессия в `HttpOnly; Secure; SameSite`-cookie; профиль запрашивать у сервера и кэшировать на короткий срок (в памяти или `sessionStorage`), очищать при выходе.",
        "Усилить защиту от XSS: CSP, экранирование, безопасные зависимости.",
      ),
    ], ["Названы риски XSS и устаревания", "Предложены cookie `HttpOnly` и серверный источник истины", "Упомянута очистка при выходе и защита от XSS"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.web-storage.f1", front: "localStorage vs sessionStorage?", back: "local — постоянно, общий для вкладок источника; session — на вкладку, до закрытия." },
    { id: "html.web-storage.f2", front: "Какие значения хранит Storage?", back: "Только строки. Объекты — через JSON.stringify/parse." },
    { id: "html.web-storage.f3", front: "Событие storage?", back: "Приходит в другие вкладки того же источника; `key === null` — clear()." },
    { id: "html.web-storage.f4", front: "Где хранить токен сессии?", back: "Cookie `HttpOnly; Secure; SameSite`, установленная сервером. Не в localStorage." },
    { id: "html.web-storage.f5", front: "Что бросает доступ к хранилищу?", back: "`QuotaExceededError`, `SecurityError`; `JSON.parse` — `SyntaxError`. Нужен `try/catch`." },
    { id: "html.web-storage.f6", front: "Большие данные?", back: "IndexedDB (асинхронно) + Cache API; Storage — ~5 МБ и синхронный." },
  ],

  sources: [
    { title: "HTML Living Standard — Web storage", url: "https://html.spec.whatwg.org/multipage/webstorage.html", publisher: "WHATWG" },
    { title: "MDN: Web Storage API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API", publisher: "MDN" },
    { title: "MDN: Window: storage event", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event", publisher: "MDN" },
    { title: "MDN: Set-Cookie", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie", publisher: "MDN" },
    { title: "MDN: IndexedDB API", url: "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API", publisher: "MDN" },
    { title: "MDN: Storage quotas and eviction criteria", url: "https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria", publisher: "MDN" },
  ],
};
