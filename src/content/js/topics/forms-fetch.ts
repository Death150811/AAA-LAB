import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
  tip,
  warn,
  insight,
  table,
  def,
  wrongRight,
  beforeAfter,
  annotated,
  steps,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const formsFetch: Topic = {
  id: "js.forms-fetch",
  slug: "forms-fetch",
  domain: "js",
  module: "browser",
  title: "Формы, FormData и fetch",
  titleEn: "Forms, FormData and fetch",
  summary:
    "Форма — главный способ получить данные от пользователя, `fetch` — главный способ отправить их на сервер. Тема на замерах в Chromium 141 и Node.js 22 разбирает, что именно попадает в `FormData` (и что нет), встроенную проверку ограничений (`validity`, `setCustomValidity`, `requestSubmit`), порядок событий отправки (`click` → `submit` → `formdata`), заголовки `Content-Type`, которые `fetch` выставляет сам (и как их сломать вручную), чтение ответа и ошибки (`404` — не отказ), CORS (preflight, `credentials`, «запрос дошёл, ответ скрыт») и приём прогрессивного улучшения. В конце вы пишете `enhanceForm`: форма, которая работает без JavaScript и без перезагрузки — с JavaScript.",
  minutes: 110,
  prerequisites: ["js.async-await-abort", "js.dom-events"],
  tags: ["form", "FormData", "fetch", "Request", "Response", "validation", "constraint validation", "requestSubmit", "submit", "formdata event", "Content-Type", "multipart", "CORS", "preflight", "credentials", "progressive enhancement", "HttpError", "bodyUsed"],
  keyConcepts: [
    { term: "`FormData` — это то, что отправил бы браузер", text: "В набор входят поля с `name`, не отключённые, отмеченные (checkbox/radio) и выбранные (`select`); неотмеченный checkbox, `disabled`-поле, поле без `name` и кнопки (кроме нажатой — `new FormData(form, submitter)`) — не входят." },
    { term: "Проверка встроенная: `required`, `pattern`, `min`…", text: "`form.requestSubmit()` и клик по кнопке проверяют форму: при ошибке `submit` не срабатывает. `form.submit()` проверку и событие `submit` обходит. Серверную ошибку показывают через `field.setCustomValidity(текст)`." },
    { term: "`fetch` сам задаёт `Content-Type` — не мешайте", text: "Для `FormData` это `multipart/form-data; boundary=…`; вручную заданный `multipart/form-data` без `boundary` ломает разбор на сервере. Для `URLSearchParams` — `application/x-www-form-urlencoded`; объект `{a: 1}` отправится строкой `[object Object]`." },
    { term: "`404` и `500` — не отказ `fetch`", text: "Обещание отклоняется только при сетевой ошибке и отмене (`TypeError: Failed to fetch`). Статус нужно проверять: `response.ok`." },
    { term: "Тело читается один раз", text: "После `await response.json()` свойство `bodyUsed === true`, второе чтение бросает `TypeError`. Нужно два чтения — `response.clone()` до первого." },
    { term: "CORS защищает чтение ответа, а не сервер", text: "Запрос к чужому origin доходит до сервера (в замере сервер получил `GET /plain`), но браузер не отдаёт ответ коду без `Access-Control-Allow-Origin`. JSON-запрос порождает preflight `OPTIONS`; без разрешения основной запрос вообще не отправляется." },
  ],
  sections: [
    section("definition", [
      def("`FormData`", "Объект-контейнер пар «имя → значение» (строки и `File`), который собирается из формы (`new FormData(form)`) или вручную (`append`, `set`) и может быть телом запроса `fetch`.", "FormData"),
      def("Constraint validation API", "Встроенная проверка ограничений полей (`required`, `type`, `pattern`, `min`/`max`, `minlength`…): состояние в `field.validity`, текст в `validationMessage`, методы `checkValidity()`, `reportValidity()`, `setCustomValidity()`.", "constraint validation"),
      def("Отправитель (`submitter`)", "Кнопка, из-за которой форма отправляется; доступна как `event.submitter`, её `name`/`value` и атрибуты `formaction`, `formmethod`, `formenctype`, `formnovalidate` переопределяют настройки формы.", "submitter"),
      def("`fetch`", "Метод `fetch(resource, init)` возвращает обещание с `Response`; отказ — только при сетевой ошибке или отмене. Параметры `method`, `headers`, `body`, `credentials`, `mode`, `redirect`, `signal` описывают запрос.", "fetch"),
      def("`Response`", "Объект ответа: `status`, `ok` (200–299), `headers`, `url`, `redirected`, тело (`json()`, `text()`, `blob()`, `formData()`, поток `body`), читаемое один раз.", "Response"),
      def("Origin и CORS", "Origin — схема + хост + порт. Cross-Origin Resource Sharing — протокол заголовков, по которому сервер разрешает чтение своих ответов страницам с другого origin.", "CORS"),
      def("Preflight", "Предварительный запрос `OPTIONS`, который браузер отправляет перед «непростым» кросс-доменным запросом (например, `Content-Type: application/json`), чтобы спросить разрешение.", "preflight"),
      def("Прогрессивное улучшение", "Подход, при котором базовая функциональность работает без JavaScript (обычная форма и перезагрузка), а скрипт добавляет удобство (отправка без перезагрузки, подсказки).", "progressive enhancement"),
    ]),

    section("why", [
      h("Почти каждая страница — это формы и запросы"),
      p("Вход, регистрация, поиск, оформление заказа, комментарии: в каждой из этих задач нужно собрать данные, проверить их, отправить на сервер, показать результат и ошибки. Ошибки здесь стоят дорого: потерянные данные, дважды созданный заказ, пароль в адресной строке, секретный ключ, видимый из консоли, пользователь, который видит «Failed to fetch» вместо объяснения."),
      ul(
        "**Корректность данных:** понимать, какие поля попадают в `FormData` (замер: из десяти элементов формы — шесть записей), как обработать повторяющиеся имена, как не потерять значение кнопки.",
        "**Пользовательский опыт:** встроенная проверка работает с клавиатурой, ассистивными технологиями и локализацией — переписывать её вручную дороже и хуже.",
        "**Надёжность запросов:** `response.ok`, различение сетевой ошибки, ошибки сервера и ошибки валидации; блокировка двойной отправки; отмена.",
        "**Безопасность:** CORS, cookie и `credentials`; `GET` для поиска и `POST` для изменений; данные формы не в адресной строке, если они секретные.",
      ),
      insight("Форма — это **контракт** между страницей и сервером: набор имён, значений и способ их кодирования. JavaScript должен воспроизводить этот контракт, а не изобретать новый: `new FormData(form)` и атрибуты формы (`action`, `method`, `enctype`) — единственный источник правды."),
    ]),

    section("mental-model", [
      p("**Форма — это бланк в канцелярии, `FormData` — заполненный бланк, `fetch` — курьер.** Бланк знает, куда его нести (`action`), каким способом (`method`) и в каком конверте (`enctype`). Курьер может доставить бланк и вернуться со статусом: «принято» (`201`), «ошибка в графе» (`422`), «отдел закрыт» (`500`). Но курьер **не возвращается** (обещание отклоняется) только если не смог дойти или его отозвали (`AbortError`). Если он принёс ответ «нет такого отдела» (`404`), это тоже ответ — решать, что с ним делать, должен ваш код. А **CORS** — это правила чужого здания: курьер входит и сдаёт бланк (запрос доходит до сервера), но на выходе охрана (браузер) отдаёт ответ вам только если на двери чужого отдела (сервера) висит табличка «выдавать ответы посетителям из вашего здания» (`Access-Control-Allow-Origin`)."),
      table(
        ["Шаг", "API", "Что проверить"],
        [
          ["Собрать данные", "`new FormData(form, event.submitter)`", "Какие поля вошли; файлы; повторяющиеся имена (`getAll`)"],
          ["Проверить", "`form.checkValidity()`, `requestSubmit()`", "`submit` не срабатывает при ошибке; `novalidate`, `formnovalidate`"],
          ["Отправить", "`fetch(action, { method, body })`", "`Content-Type` не задавать вручную для `FormData`; `signal`"],
          ["Разобрать ответ", "`response.ok`, `response.json()`", "Статус до чтения тела; тело читается один раз"],
          ["Показать ошибки", "`setCustomValidity`, `aria-live`", "Ошибки сервера (`422`) → в конкретные поля"],
          ["Не навредить", "Блокировка кнопки, `AbortController`", "Двойная отправка, уход со страницы"],
        ],
        "Путь данных формы",
      ),
    ]),

    section("technical", [
      h("`FormData`: что попадает в набор"),
      code("html", `<form id="f">
  <input name="name" value="Анна">
  <input name="agree" type="checkbox" value="yes">
  <input name="newsletter" type="checkbox" value="weekly" checked>
  <label><input name="lang" type="checkbox" value="js" checked> js</label>
  <label><input name="lang" type="checkbox" value="sql" checked> sql</label>
  <input name="size" type="radio" value="s"> <input name="size" type="radio" value="m" checked>
  <select name="tags" multiple><option value="a" selected>a</option><option value="b">b</option><option value="c" selected>c</option></select>
  <input name="locked" value="не уйдёт" disabled>
  <input value="без name">
  <input name="avatar" type="file">
  <textarea name="bio">строка 1
строка 2</textarea>
  <button name="action" value="save">Сохранить</button>
  <button name="action" value="draft">Черновик</button>
</form>
<script>
  const form = document.getElementById("f");
  const show = (fd) => [...fd].map(([k, v]) => \`\${k}=\${v instanceof File ? \`File(name=\${JSON.stringify(v.name)}, size=\${v.size})\` : JSON.stringify(v)}\`);
  const L = {};
  L["new FormData(form)"] = show(new FormData(form));
  L["submitter «Черновик»"] = show(new FormData(form, form.querySelectorAll("button")[1])).filter((s) => s.startsWith("action"));
  const fd = new FormData(form);
  L["getAll('lang')"] = fd.getAll("lang");
  L["get('lang')"] = fd.get("lang");
  L["Object.fromEntries: lang"] = Object.fromEntries(fd).lang;
  L["has('agree') (checkbox без отметки)"] = fd.has("agree");
  L["has('locked') (disabled)"] = fd.has("locked");
  L["URLSearchParams(fd)"] = new URLSearchParams(fd).toString();
  fd.set("name", "Борис"); fd.append("lang", "git"); fd.delete("bio");
  L["после set/append/delete"] = show(fd).filter((s) => /^(name|lang|bio)=/.test(s));
  L["bio (textarea)"] = new FormData(form).get("bio");
  window.L = L;
</script>`, { filename: "fm1-formdata.html", collapsed: true }),
      code("text", `new FormData(form)                       → 
    name="Анна"
    newsletter="weekly"
    lang="js"
    lang="sql"
    size="m"
    tags="a"
    tags="c"
    avatar=File(name="", size=0)
    bio="строка 1\\nстрока 2"
submitter «Черновик»                     → ["action=\\"draft\\""]
getAll('lang')                           → ["js","sql"]
get('lang')                              → "js"
Object.fromEntries: lang                 → "sql"
has('agree') (checkbox без отметки)      → false
has('locked') (disabled)                 → false
URLSearchParams(fd)                      → "name=%D0%90%D0%BD%D0%BD%D0%B0&newsletter=weekly&lang=js&lang=sql&size=m&tags=a&tags=c&avatar=%5Bobject+File%5D&bio=%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B0+1%0A%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B0+2"
после set/append/delete                  → 
    name="Борис"
    lang="js"
    lang="sql"
    lang="git"
bio (textarea)                           → "строка 1\\nстрока 2"`, { filename: "замер в Chromium 141" }),
      ul(
        "**Входят:** поля с `name`, не `disabled`: текст (`name`), отмеченный checkbox (`newsletter`, оба `lang`), выбранный radio (`size=m`), все выбранные `<option>` (`tags=a`, `tags=c`), `textarea` (переводы строк — `\\n`), файловое поле — даже пустое: `File(name=\"\", size=0)`.",
        "**Не входят:** неотмеченный checkbox (`agree`), `disabled`-поле (`locked`), поле без `name`, кнопки. Нажатая кнопка добавляется только если передать её вторым аргументом: `new FormData(form, button)` → `action=\"draft\"`.",
        "**Повторяющиеся имена:** `get(\"lang\")` вернул первое значение (`js`), `getAll(\"lang\")` — все (`[\"js\",\"sql\"]`), а `Object.fromEntries(fd).lang` оставил **последнее** (`sql`) — дубликаты теряются.",
        "**`URLSearchParams(fd)`** превращает файл в строку `[object File]` — для форм с файлами используйте `multipart` и `FormData` как есть.",
        "**Изменение:** `set` заменяет все значения имени, `append` добавляет, `delete` удаляет.",
      ),

      h("Встроенная проверка ограничений"),
      code("html", `<form id="f" novalidate>
  <input id="email" name="email" type="email" required>
  <input id="age" name="age" type="number" min="18" max="99" step="1">
  <input id="code" name="code" pattern="[A-Z]{3}-\\d{2}" title="ABC-12">
  <input id="nick" name="nick" minlength="3" maxlength="8">
  <button>Отправить</button>
</form>
<form id="g">
  <input id="req" name="req" required>
  <button id="gbtn">OK</button>
</form>
<script>
  const $ = (id) => document.getElementById(id);
  const flags = (el) => Object.entries({ valueMissing: 0, typeMismatch: 0, patternMismatch: 0, rangeUnderflow: 0, rangeOverflow: 0, stepMismatch: 0, tooShort: 0, tooLong: 0, badInput: 0, customError: 0 })
    .filter(([k]) => el.validity[k]).map(([k]) => k);
  const L = [];
  const note = (label, v) => L.push(\`\${label}: \${typeof v === "string" ? v : JSON.stringify(v)}\`);

  // 1. validity-флаги
  note("email пустой", flags($("email")));
  $("email").value = "не-почта"; note("email = «не-почта»", flags($("email")));
  $("email").value = "a@b.ru"; note("email = «a@b.ru»", flags($("email")));
  $("age").value = "17"; note("age = 17 (min 18)", flags($("age")));
  $("age").value = "100"; note("age = 100 (max 99)", flags($("age")));
  $("age").value = "20.5"; note("age = 20.5 (step 1)", flags($("age")));
  $("code").value = "abc-12"; note("code = «abc-12»", flags($("code")));
  $("code").value = "ABC-12"; note("code = «ABC-12»", flags($("code")));

  // 2. minlength/maxlength: значение, заданное скриптом, не помечается
  $("nick").value = "ab"; note("nick = «ab», задан скриптом (minlength 3)", flags($("nick")).length ? flags($("nick")) : "ошибок нет (tooShort не проверяется для значения из скрипта)");

  // 3. setCustomValidity
  $("email").setCustomValidity("Адрес занят");
  note("customError", { flags: flags($("email")), validationMessage: $("email").validationMessage, checkValidity: $("email").checkValidity() });
  $("email").setCustomValidity("");
  note("после setCustomValidity('')", { checkValidity: $("email").checkValidity() });

  // 4. checkValidity() и reportValidity(): событие invalid
  let invalidFired = 0;
  $("req").addEventListener("invalid", () => invalidFired++);
  note("checkValidity() на пустом required", { result: $("g").checkValidity(), invalidFired });
  note("form.noValidate", $("f").noValidate);

  // 5. requestSubmit() и submit()
  const g = $("g"); let submits = 0;
  g.addEventListener("submit", (e) => { submits++; e.preventDefault(); });
  g.requestSubmit(); note("requestSubmit() при невалидном поле: событие submit", submits);
  $("req").value = "ok"; g.requestSubmit(); note("requestSubmit() при валидном поле: событие submit", submits);
  window.L = L;
</script>`, { filename: "fm2-validation.html", collapsed: true }),
      code("text", `email пустой: ["valueMissing"]
email = «не-почта»: ["typeMismatch"]
email = «a@b.ru»: []
age = 17 (min 18): ["rangeUnderflow"]
age = 100 (max 99): ["rangeOverflow"]
age = 20.5 (step 1): ["stepMismatch"]
code = «abc-12»: ["patternMismatch"]
code = «ABC-12»: []
nick = «ab», задан скриптом (minlength 3): ошибок нет (tooShort не проверяется для значения из скрипта)
customError: {"flags":["customError"],"validationMessage":"Адрес занят","checkValidity":false}
после setCustomValidity(''): {"checkValidity":true}
checkValidity() на пустом required: {"result":false,"invalidFired":1}
form.noValidate: true
requestSubmit() при невалидном поле: событие submit: 0
requestSubmit() при валидном поле: событие submit: 1
nick = «ab», введён с клавиатуры (minlength 3): {"tooShort":true}
до ввода: {"invalid":true,"userInvalid":false}
после ввода и потери фокуса (поле снова пустое): {"invalid":true,"userInvalid":true}`, { filename: "замер в Chromium 141" }),
      ul(
        "**Флаги `validity`:** `valueMissing` (пустое `required`), `typeMismatch` (`type=email`), `rangeUnderflow`/`rangeOverflow` (`min`/`max`), `stepMismatch` (`20.5` при шаге `1`), `patternMismatch` (регистр важен: `abc-12` не подходит под `[A-Z]{3}-\\d{2}`), `customError`.",
        "**`minlength`/`maxlength` проверяются только для значения, введённого пользователем:** значение `ab`, записанное скриптом, ошибку не даёт, а набранное с клавиатуры — даёт `tooShort: true`.",
        "**`setCustomValidity(текст)`** помечает поле как невалидное (`customError`, `checkValidity() === false`) и задаёт `validationMessage`; пустая строка снимает ошибку.",
        "**`checkValidity()`** возвращает результат и вызывает у невалидных полей событие `invalid` (один раз); `reportValidity()` ещё и показывает подсказку. `form.noValidate` отключает проверку при отправке.",
        "**`requestSubmit()`** при невалидном поле не вызвал `submit` (счётчик `0`), при валидном — вызвал (`1`).",
        "**CSS:** `:invalid` включается сразу (`invalid: true`), а `:user-invalid` — только после взаимодействия пользователя (ввод и уход из поля) — используйте его, чтобы не ругаться на пустую форму.",
      ),

      h("Порядок событий отправки"),
      code("html", `<iframe name="sink" hidden></iframe>
<form id="f" action="about:blank" target="sink">
  <input id="q" name="q" value="js" required>
  <button id="go" name="intent" value="search">Искать</button>
  <button id="alt" name="intent" value="lucky" formnovalidate>Мне повезёт</button>
</form>
<script>
  const f = document.getElementById("f");
  const L = [];
  window.L = L;
  const on = (el, type, label) => el.addEventListener(type, (e) => {
    const extra = type === "submit" ? \` submitter=\${e.submitter ? e.submitter.id : "null"}, cancelable=\${e.cancelable}\` : type === "click" ? \` isTrusted=\${e.isTrusted}, detail=\${e.detail}\` : "";
    L.push(\`\${label}\${extra}\`);
    if (type === "formdata") e.formData.append("added_by", "formdata-listener");
  });
  on(document.getElementById("q"), "keydown", "keydown на поле");
  on(document.getElementById("go"), "click", "click на «Искать»");
  on(document.getElementById("alt"), "click", "click на «Мне повезёт»");
  on(f, "submit", "submit");
  on(f, "formdata", "formdata");
  on(document.getElementById("q"), "invalid", "invalid на поле");
  // отправка уходит в скрытый iframe: страница не перезагружается
  window.reset = () => { L.splice(0); window.entries = []; };
  window.entries = [];
  f.addEventListener("formdata", (e) => { window.entries = [...e.formData].map(([k, v]) => k + "=" + v); });
</script>`, { filename: "fm3-submit-flow.html", collapsed: true }),
      code("text", `Enter в поле (неявная отправка):
  keydown на поле
  click на «Искать» isTrusted=true, detail=0
  submit submitter=go, cancelable=true
  formdata
  данные: q=js&intent=search&added_by=formdata-listener
клик по «Искать»:
  click на «Искать» isTrusted=true, detail=1
  submit submitter=go, cancelable=true
  formdata
  данные: q=js&intent=search&added_by=formdata-listener
form.requestSubmit(#alt):
  submit submitter=alt, cancelable=true
  formdata
  данные: q=js&intent=lucky&added_by=formdata-listener
form.submit() — без события submit:
  formdata
  данные: q=js&added_by=formdata-listener
клик по «Искать» при пустом required:
  click на «Искать» isTrusted=true, detail=1
  invalid на поле
  данные: 
клик по «Мне повезёт» (formnovalidate) при пустом поле:
  click на «Мне повезёт» isTrusted=true, detail=1
  submit submitter=alt, cancelable=true
  formdata
  данные: q=&intent=lucky&added_by=formdata-listener`, { filename: "замер в Chromium 141 (реальные нажатия; отправка в скрытый iframe)" }),
      ul(
        "**`Enter` в поле — неявная отправка:** браузер сам «кликает» по кнопке отправки по умолчанию (`click … isTrusted=true, detail=0`), затем `submit` (`submitter=go`, `cancelable=true`) и `formdata`.",
        "**`formdata`** — последний шанс изменить данные: слушатель добавил поле `added_by`, и оно ушло в набор.",
        "**`form.requestSubmit(кнопка)`** ведёт себя как клик: `submit` с нужным `submitter`; в данные попала `intent=lucky`.",
        "**`form.submit()` — без проверки и без `submit`:** сработал только `formdata`, кнопка не учитывается (`intent` нет).",
        "**Невалидная форма:** клик по «Искать» дал `invalid` и **не** дал `submit`; кнопка с `formnovalidate` обошла проверку и отправила пустое значение.",
      ),
      h("Атрибуты кнопки и формы: ловушка `formAction`"),
      code("js", `import http from "node:http";
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
const html = \`<!doctype html><title>t</title>
<form id="f" action="/signup" method="post" enctype="multipart/form-data">
  <button id="b1">без formaction</button>
  <button id="b2" formaction="/alt" formmethod="get" formenctype="text/plain">с formaction</button>
</form>
<form id="plain"><button id="b3">форма без атрибутов</button></form>\`;
const server = http.createServer((req, res) => { res.setHeader("content-type", "text/html"); res.end(html); });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await b.newPage();
await page.goto(\`http://127.0.0.1:\${port}/page\`);
const mask = (v) => String(v).replace(\`127.0.0.1:\${port}\`, "ORIGIN");
const r = await page.evaluate(() => {
  const $ = (id) => document.getElementById(id);
  return {
    "form.action": $("f").action, "form.method": $("f").method, "form.enctype": $("f").enctype,
    "b1.formAction (атрибута нет)": $("b1").formAction, "b1.hasAttribute('formaction')": $("b1").hasAttribute("formaction"),
    "b1.formMethod": $("b1").formMethod, "b1.formEnctype": $("b1").formEnctype,
    "b2.formAction": $("b2").formAction, "b2.formMethod": $("b2").formMethod, "b2.formEnctype": $("b2").formEnctype,
    "plain.method (атрибута нет)": $("plain").method, "plain.enctype": $("plain").enctype, "plain.action (атрибута нет)": $("plain").action,
  };
});
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(34), "→", JSON.stringify(mask(v)).replace(/^"|"$/g, ""));
// документ без сетевого адреса
const blank = await b.newPage();
await blank.setContent(\`<form id="f" action="/signup"></form>\`);
console.log("\\nв about:blank:");
console.log("document.baseURI".padEnd(34), "→", await blank.evaluate(() => document.baseURI));
console.log("form.action".padEnd(34), "→", await blank.evaluate(() => document.getElementById("f").action));
console.log("new URL('/signup', document.baseURI)".padEnd(34), "→", await blank.evaluate(() => { try { return new URL("/signup", document.baseURI).href; } catch (e) { return e.name + ": " + e.message; } }));
await b.close(); server.close();`, { filename: "run-fm6-formattrs.mjs", collapsed: true }),
      code("text", `form.action                        → http://ORIGIN/signup
form.method                        → post
form.enctype                       → multipart/form-data
b1.formAction (атрибута нет)       → http://ORIGIN/page
b1.hasAttribute('formaction')      → false
b1.formMethod                      → 
b1.formEnctype                     → 
b2.formAction                      → http://ORIGIN/alt
b2.formMethod                      → get
b2.formEnctype                     → text/plain
plain.method (атрибута нет)        → get
plain.enctype                      → application/x-www-form-urlencoded
plain.action (атрибута нет)        → http://ORIGIN/page

в about:blank:
document.baseURI                   → about:blank
form.action                        → 
new URL('/signup', document.baseURI) → TypeError: Failed to construct 'URL': Invalid URL`, { filename: "замер в Chromium 141" }),
      ul(
        "**У кнопки без `formaction` свойство `formAction` возвращает адрес документа** (`/page`), а не `action` формы (`/signup`). Проверяйте `button.hasAttribute(\"formaction\")` или читайте `form.action`.",
        "`formMethod` и `formEnctype` без атрибутов — пустые строки: подставляйте `form.method`/`form.enctype`. Форма без атрибутов: `method = get`, `enctype = application/x-www-form-urlencoded`, `action` — адрес документа.",
        "**В документе без адреса** (`about:blank`, `about:srcdoc`) относительный `action` не разрешается: `form.action` пуст, `new URL(\"/signup\", document.baseURI)` — `TypeError: Failed to construct 'URL': Invalid URL`.",
      ),

      h("`fetch`: тело запроса и `Content-Type`"),
      code("js", `import http from "node:http";

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  if (req.url === "/echo") {
    res.setHeader("content-type", "application/json");
    const ct = req.headers["content-type"] ?? null;
    res.end(JSON.stringify({ method: req.method, contentType: ct && ct.replace(/boundary=.*/, "boundary=…"), hasBoundary: !!ct && /boundary=/.test(ct), bytes: body.length, body: body.toString("utf8").replace(/formdata-undici-\\d+/, "formdata-undici-…").slice(0, 40) }));
  } else if (req.url === "/missing") {
    res.statusCode = 404; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ error: "не найдено" }));
  } else if (req.url === "/old") {
    res.statusCode = 302; res.setHeader("location", "/echo"); res.end();
  } else if (req.url === "/broken-json") {
    res.setHeader("content-type", "application/json"); res.end("{не json");
  } else if (req.url === "/stream") {
    res.setHeader("content-type", "text/plain");
    let n = 0;
    const timer = setInterval(() => { res.write("x".repeat(1000)); if (++n === 4) { clearInterval(timer); res.end(); } }, 40);
  } else { res.statusCode = 204; res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = \`http://127.0.0.1:\${server.address().port}\`;
const echo = async (label, init) => {
  const r = await fetch(base + "/echo", { method: "POST", ...init });
  const j = await r.json();
  console.log(label.padEnd(34), "→", JSON.stringify({ contentType: j.contentType, boundary: j.hasBoundary, body: j.body }));
};

console.log("— тело запроса и заголовок Content-Type, который fetch выставляет сам —");
await echo("строка", { body: "привет" });
await echo("JSON.stringify без заголовка", { body: JSON.stringify({ a: 1 }) });
await echo("JSON.stringify + заголовок", { body: JSON.stringify({ a: 1 }), headers: { "Content-Type": "application/json" } });
await echo("URLSearchParams", { body: new URLSearchParams({ q: "js", page: "2" }) });
await echo("Blob с типом", { body: new Blob(["{}"], { type: "application/json" }) });
await echo("объект {a: 1} (ошибка)", { body: { a: 1 } });
const fd = new FormData(); fd.set("name", "Анна");
await echo("FormData", { body: fd });
await echo("FormData + ручной Content-Type", { body: fd, headers: { "Content-Type": "multipart/form-data" } });

console.log("\\n— ответ —");
const r404 = await fetch(base + "/missing");
console.log("404: fetch не отклонился; ok =", r404.ok, "| status =", r404.status, "| тело:", await r404.json());
const red = await fetch(base + "/old");
console.log("редирект: redirected =", red.redirected, "| status =", red.status, "| url оканчивается на", new URL(red.url).pathname);
const manual = await fetch(base + "/old", { redirect: "manual" });
console.log("redirect: 'manual': status =", manual.status, "| location =", manual.headers.get("location"));
const r = await fetch(base + "/echo", { method: "POST", body: "x" });
console.log("до чтения: bodyUsed =", r.bodyUsed);
const copy = r.clone();
await r.json();
console.log("после json(): bodyUsed =", r.bodyUsed, "| клон ещё читается:", (await copy.json()).method);
try { await r.json(); } catch (e) { console.log("повторное чтение:", e.name + ":", e.message); }
try { await (await fetch(base + "/broken-json")).json(); } catch (e) { console.log("некорректный JSON:", e.name); }
console.log("204: тело пустое, text() =", JSON.stringify(await (await fetch(base + "/none")).text()));
const h = new Headers({ "X-Request-Id": "7", accept: "text/html" });
console.log("Headers: get('x-request-id') =", h.get("x-request-id"), "| ключи:", [...h.keys()].join(", "));

console.log("\\n— потоковое чтение тела —");
const s = await fetch(base + "/stream");
let total = 0, parts = 0;
for await (const chunk of s.body) { total += chunk.length; parts++; }
console.log("получено байт:", total, "| пришло несколькими частями:", parts > 1);

console.log("\\n— сетевая ошибка —");
const probe = http.createServer();
await new Promise((r) => probe.listen(0, "127.0.0.1", r));
const closedPort = probe.address().port; // свободный порт, на котором никто не слушает
await new Promise((r) => probe.close(r));
server.closeAllConnections(); server.close();
try { await fetch(\`http://127.0.0.1:\${closedPort}/\`); } catch (e) { console.log(e.name + ":", e.message, "| причина:", e.cause?.code ?? e.cause?.errors?.map((x) => x.code).join(",")); }`, { filename: "fm4-fetch-basics.mjs", collapsed: true, lineNumbers: true }),
      code("text", `— тело запроса и заголовок Content-Type, который fetch выставляет сам —
строка                             → {"contentType":"text/plain;charset=UTF-8","boundary":false,"body":"привет"}
JSON.stringify без заголовка       → {"contentType":"text/plain;charset=UTF-8","boundary":false,"body":"{\\"a\\":1}"}
JSON.stringify + заголовок         → {"contentType":"application/json","boundary":false,"body":"{\\"a\\":1}"}
URLSearchParams                    → {"contentType":"application/x-www-form-urlencoded;charset=UTF-8","boundary":false,"body":"q=js&page=2"}
Blob с типом                       → {"contentType":"application/json","boundary":false,"body":"{}"}
объект {a: 1} (ошибка)             → {"contentType":"text/plain;charset=UTF-8","boundary":false,"body":"[object Object]"}
FormData                           → {"contentType":"multipart/form-data; boundary=…","boundary":true,"body":"------formdata-undici-…\\r\\nContent-Disposi"}
FormData + ручной Content-Type     → {"contentType":"multipart/form-data","boundary":false,"body":"------formdata-undici-…\\r\\nContent-Disposi"}

— ответ —
404: fetch не отклонился; ok = false | status = 404 | тело: { error: 'не найдено' }
редирект: redirected = true | status = 200 | url оканчивается на /echo
redirect: 'manual': status = 302 | location = /echo
до чтения: bodyUsed = false
после json(): bodyUsed = true | клон ещё читается: POST
повторное чтение: TypeError: Body is unusable: Body has already been read
некорректный JSON: SyntaxError
204: тело пустое, text() = ""
Headers: get('x-request-id') = 7 | ключи: accept, x-request-id

— потоковое чтение тела —
получено байт: 4000 | пришло несколькими частями: true

— сетевая ошибка —
TypeError: fetch failed | причина: ECONNREFUSED`, { filename: "вывод Node.js 22.22.0 (локальный http-сервер)" }),
      ul(
        "**Строка** уходит как `text/plain;charset=UTF-8`; **`JSON.stringify` без заголовка тоже** — сервер не поймёт, что это JSON. Нужно явно: `headers: { \"Content-Type\": \"application/json\" }`.",
        "**`URLSearchParams`** → `application/x-www-form-urlencoded;charset=UTF-8`; **`Blob`** — свой `type`; **`FormData`** → `multipart/form-data; boundary=…` (границу `fetch` создаёт сам).",
        "**Ошибка: ручной `Content-Type: multipart/form-data`** при `FormData` — сервер получил заголовок **без `boundary`** (`boundary: false`) и не сможет разобрать тело. Не задавайте этот заголовок.",
        "**Ошибка: объект как тело** — `body: { a: 1 }` отправил строку `[object Object]`.",
        "**Ответ:** `404` — не отказ (`ok = false`, `status = 404`, тело читается); редирект выполнен автоматически (`redirected = true`, `url` оканчивается на `/echo`), `redirect: \"manual\"` вернул `302` и `location`.",
        "**Тело читается один раз:** до чтения `bodyUsed = false`, после `json()` — `true`; `clone()` до чтения даёт независимую копию; повторное чтение — `TypeError: Body is unusable: Body has already been read` (формулировка в Node; в браузерах другая, но тип тот же).",
        "**Битый JSON:** `json()` отклоняется `SyntaxError`; пустое тело `204` — `text()` вернёт `\"\"`, а `json()` бросил бы `SyntaxError`.",
        "**`Headers`** нечувствительны к регистру: `get(\"x-request-id\")` нашёл `X-Request-Id`; ключи — в нижнем регистре.",
        "**Сетевая ошибка:** `TypeError: fetch failed` (в Node причина — `ECONNREFUSED`; в браузере сообщение — `Failed to fetch`).",
        "**Поток:** `for await (const chunk of response.body)` получил 4000 байт несколькими частями — так делают индикаторы загрузки.",
      ),

      h("CORS: что видит сервер и что видит страница"),
      code("js", `import http from "node:http";
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";

const log = [];
const page_ = http.createServer((req, res) => { res.setHeader("content-type", "text/html"); res.end("<!doctype html><title>A</title><p>страница на origin A</p>"); });
const api = http.createServer(async (req, res) => {
  for await (const _ of req);
  const origin = req.headers.origin;
  const path = req.url.split("?")[0];
  log.push(\`\${req.method} \${path}\${req.method === "OPTIONS" ? \` [ACRM=\${req.headers["access-control-request-method"]}, ACRH=\${req.headers["access-control-request-headers"] ?? "—"}]\` : ""}\`);
  res.setHeader("content-type", "application/json");
  const cors = (extra = {}) => { for (const [k, v] of Object.entries(extra)) res.setHeader(k, v); };
  if (path === "/plain") { res.end('{"ok":true}'); return; }                                   // без CORS-заголовков
  if (path === "/open") { cors({ "access-control-allow-origin": "*", "access-control-expose-headers": "x-exposed" }); res.setHeader("x-exposed", "1"); res.setHeader("x-hidden", "2"); res.end('{"ok":true}'); return; }
  if (path === "/json") {                                                                       // нужен preflight
    if (req.method === "OPTIONS") { cors({ "access-control-allow-origin": origin, "access-control-allow-methods": "POST", "access-control-allow-headers": "content-type" }); res.statusCode = 204; res.end(); return; }
    cors({ "access-control-allow-origin": origin }); res.end('{"saved":true}'); return;
  }
  if (path === "/no-preflight-support") {                                                       // сервер не отвечает на OPTIONS
    if (req.method === "OPTIONS") { res.statusCode = 404; res.end(); return; }
    cors({ "access-control-allow-origin": origin }); res.end('{"saved":true}'); return;
  }
  if (path === "/cookie") {
    cors({ "access-control-allow-origin": origin, "access-control-allow-credentials": "true" });
    if (!req.headers.cookie) res.setHeader("set-cookie", "sid=42; Path=/");
    res.end(JSON.stringify({ cookie: req.headers.cookie ?? null })); return;
  }
  if (path === "/cookie-wildcard") { cors({ "access-control-allow-origin": "*", "access-control-allow-credentials": "true" }); res.end("{}"); return; }
  res.end("{}");
});
await Promise.all([new Promise((r) => page_.listen(0, "localhost", r)), new Promise((r) => api.listen(0, "localhost", r))]);
const A = \`http://localhost:\${page_.address().port}\`, B = \`http://localhost:\${api.address().port}\`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await browser.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().replace(/http:\\/\\/localhost:\\d+/g, "http://localhost:PORT").split(". ")[0]); });
await page.goto(A);

const attempt = async (label, code) => {
  log.length = 0;
  const result = await page.evaluate(async ([base, src]) => {
    const f = new Function("base", \`return (async () => { \${src} })()\`);
    try { return await f(base); } catch (e) { return \`исключение \${e.name}: \${e.message}\`; }
  }, [B, code]);
  console.log(label + "\\n  результат в браузере: " + JSON.stringify(result) + "\\n  сервер получил: " + (log.join(" → ") || "ничего"));
};

await attempt("1. Чужой origin без CORS-заголовков (простой GET)", \`const r = await fetch(base + "/plain"); return r.status;\`);
await attempt("2. Ответ с Access-Control-Allow-Origin: * (читаем заголовки)", \`const r = await fetch(base + "/open"); return { status: r.status, exposed: r.headers.get("x-exposed"), hidden: r.headers.get("x-hidden") };\`);
await attempt("3. POST с Content-Type: text/plain (простой запрос)", \`const r = await fetch(base + "/json", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "x" }); return r.status;\`);
await attempt("4. POST с Content-Type: application/json (нужен preflight)", \`const r = await fetch(base + "/json", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); return await r.json();\`);
await attempt("5. То же, но сервер не отвечает на OPTIONS", \`const r = await fetch(base + "/no-preflight-support", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); return await r.json();\`);
await attempt("6. mode: 'no-cors' к серверу без CORS-заголовков", \`const r = await fetch(base + "/plain", { mode: "no-cors" }); return { type: r.type, status: r.status, body: await r.text() };\`);
await attempt("7a. Cookie: credentials по умолчанию (same-origin)", \`const r = await fetch(base + "/cookie"); return await r.json();\`);
await attempt("7b. Cookie: credentials: 'include' — сервер выдаёт cookie", \`const r = await fetch(base + "/cookie", { credentials: "include" }); return await r.json();\`);
await attempt("7c. Cookie: credentials: 'include' — cookie отправляется", \`const r = await fetch(base + "/cookie", { credentials: "include" }); return await r.json();\`);
await attempt("7d. Cookie: по умолчанию cookie НЕ отправляется", \`const r = await fetch(base + "/cookie"); return await r.json();\`);
await attempt("8. credentials: 'include' и Allow-Origin: *", \`const r = await fetch(base + "/cookie-wildcard", { credentials: "include" }); return r.status;\`);

console.log("\\nСообщения консоли Chromium (первые предложения):");
for (const m of [...new Set(consoleErrors)]) console.log("  " + m);
await browser.close(); page_.close(); api.closeAllConnections?.(); api.close();`, { filename: "run-fm5-cors.mjs", collapsed: true }),
      code("text", `1. Чужой origin без CORS-заголовков (простой GET)
  результат в браузере: "исключение TypeError: Failed to fetch"
  сервер получил: GET /plain
2. Ответ с Access-Control-Allow-Origin: * (читаем заголовки)
  результат в браузере: {"status":200,"exposed":"1","hidden":null}
  сервер получил: GET /open
3. POST с Content-Type: text/plain (простой запрос)
  результат в браузере: 200
  сервер получил: POST /json
4. POST с Content-Type: application/json (нужен preflight)
  результат в браузере: {"saved":true}
  сервер получил: OPTIONS /json [ACRM=POST, ACRH=content-type] → POST /json
5. То же, но сервер не отвечает на OPTIONS
  результат в браузере: "исключение TypeError: Failed to fetch"
  сервер получил: OPTIONS /no-preflight-support [ACRM=POST, ACRH=content-type]
6. mode: 'no-cors' к серверу без CORS-заголовков
  результат в браузере: {"type":"opaque","status":0,"body":""}
  сервер получил: GET /plain
7a. Cookie: credentials по умолчанию (same-origin)
  результат в браузере: {"cookie":null}
  сервер получил: GET /cookie
7b. Cookie: credentials: 'include' — сервер выдаёт cookie
  результат в браузере: {"cookie":null}
  сервер получил: GET /cookie
7c. Cookie: credentials: 'include' — cookie отправляется
  результат в браузере: {"cookie":"sid=42"}
  сервер получил: GET /cookie
7d. Cookie: по умолчанию cookie НЕ отправляется
  результат в браузере: {"cookie":null}
  сервер получил: GET /cookie
8. credentials: 'include' и Allow-Origin: *
  результат в браузере: "исключение TypeError: Failed to fetch"
  сервер получил: GET /cookie-wildcard

Сообщения консоли Chromium (первые предложения):
  Access to fetch at 'http://localhost:PORT/plain' from origin 'http://localhost:PORT' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  Failed to load resource: net::ERR_FAILED
  Access to fetch at 'http://localhost:PORT/no-preflight-support' from origin 'http://localhost:PORT' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  Access to fetch at 'http://localhost:PORT/cookie-wildcard' from origin 'http://localhost:PORT' has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.`, { filename: "замер в Chromium 141: страница на одном порту, API на другом (localhost)" }),
      ul(
        "**Без CORS-заголовков** страница получила `TypeError: Failed to fetch`, **но сервер увидел `GET /plain`** — CORS не мешает запросу дойти, он скрывает ответ.",
        "**С `Access-Control-Allow-Origin: *`** ответ читается; заголовки, не перечисленные в `Access-Control-Expose-Headers`, недоступны (`x-exposed` → `1`, `x-hidden` → `null`).",
        "**Простой запрос** (`POST` с `text/plain`) — без preflight. **`application/json`** — сначала `OPTIONS /json` с `Access-Control-Request-Method: POST` и `Access-Control-Request-Headers: content-type`, затем `POST`.",
        "**Если сервер не разрешил preflight,** основной запрос **не отправляется** (в журнале сервера только `OPTIONS`).",
        "**`mode: \"no-cors\"`** даёт «непрозрачный» ответ: `type: opaque`, `status: 0`, пустое тело — читать нельзя.",
        "**Cookie:** по умолчанию (`credentials: \"same-origin\"`) кросс-доменный запрос cookie не получает и не сохраняет; с `credentials: \"include\"` cookie выдана (7b) и отправляется (7c: `sid=42`). Сервер должен ответить `Access-Control-Allow-Credentials: true` и **конкретным** origin — с `*` браузер отклонил ответ (случай 8).",
        "**Сообщения консоли** названы точно: `has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present…`, `Response to preflight request doesn't pass access control check…`, `must not be the wildcard '*' when the request's credentials mode is 'include'`.",
      ),
      warn("CORS настраивается **на сервере**. Исправить его из JavaScript нельзя: `mode: \"no-cors\"` не открывает ответ, а «прокси для обхода CORS» в клиентском коде — это передача чужому серверу ваших данных и ключей."),

      h("Живая форма: прогрессивное улучшение"),
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Регистрация: форма + fetch</title>
<style>
  body { font: 16px system-ui, sans-serif; margin: 1.5rem; max-width: 26rem; }
  label { display: block; margin: .6rem 0; }
  input { display: block; width: 100%; padding: .4rem; box-sizing: border-box; }
  form[aria-busy] { opacity: .6; }
  #status { margin-top: 1rem; min-height: 1.5rem; }
  #status[data-kind="error"] { color: #b91c1c; }
  #status[data-kind="ok"] { color: #047857; }
</style>
<h1>Регистрация</h1>
<p>Без JavaScript форма отправилась бы обычным POST на условный адрес <code>api.example.test</code> (зарезервированный для примеров домен, RFC 2606). С JavaScript — через <code>fetch</code>. Сервер здесь — заглушка внутри страницы: адрес <b>taken@example.com</b> «занят», <b>boom@example.com</b> вызывает ошибку 500.</p>
<form id="signup" action="https://api.example.test/signup" method="post">
  <label>Почта <input name="email" type="email" required autocomplete="email"></label>
  <label>Пароль (от 8 символов) <input name="password" type="password" minlength="8" required autocomplete="new-password"></label>
  <button>Создать аккаунт</button>
</form>
<p id="status" role="status"></p>
<script>
  // Прогрессивное улучшение формы: без JS — обычная отправка, с JS — fetch без перезагрузки.
  function enhanceForm(form, { onSuccess, onError, resetOnSuccess = true, fetchImpl = globalThis.fetch } = {}) {
    const lifetime = new AbortController();
    let inflight = null;                                    // контроллер текущего запроса

    const setBusy = (busy) => {
      form.toggleAttribute("aria-busy", busy);
      for (const control of form.querySelectorAll("button, input[type=submit]")) control.disabled = busy;
    };

    form.addEventListener("submit", async (event) => {
      if (inflight) { event.preventDefault(); return; }     // повторная отправка во время запроса игнорируется
      event.preventDefault();

      const submitter = event.submitter;
      const data = new FormData(form, submitter);           // значение нажатой кнопки попадёт в данные
      const method = (submitter?.formMethod || form.method || "get").toUpperCase();
      // button.formAction без атрибута возвращает URL документа, а не action формы
      const action = new URL(submitter?.hasAttribute("formaction") ? submitter.formAction : form.action, document.baseURI);
      const multipart = (submitter?.formEnctype || form.enctype) === "multipart/form-data";

      const init = { method, signal: undefined };
      if (method === "GET") {
        for (const [key, value] of data) if (typeof value === "string") action.searchParams.append(key, value);
      } else {
        init.body = multipart ? data : new URLSearchParams([...data].filter(([, v]) => typeof v === "string"));
      }

      inflight = new AbortController();
      init.signal = AbortSignal.any([inflight.signal, lifetime.signal]);
      setBusy(true);
      try {
        const response = await fetchImpl(action, init);
        const isJson = response.headers.get("content-type")?.includes("application/json");
        const payload = isJson ? await response.json() : await response.text();

        if (response.ok) {
          if (resetOnSuccess) form.reset();
          onSuccess?.(payload, response);
        } else if (response.status === 422 && payload?.errors) {
          let first = null;
          for (const [name, message] of Object.entries(payload.errors)) {
            const field = form.elements.namedItem(name);
            if (!field?.setCustomValidity) continue;
            field.setCustomValidity(message);               // сообщение сервера — как нативная ошибка поля
            field.addEventListener("input", () => field.setCustomValidity(""), { once: true });
            first ??= field;
          }
          setBusy(false);                                   // reportValidity() должен видеть доступную форму
          first?.reportValidity();
        } else {
          onError?.({ kind: "http", status: response.status, payload });
        }
      } catch (error) {
        if (lifetime.signal.aborted) return;                // компонент уничтожен — молчим
        onError?.({ kind: error.name === "AbortError" ? "aborted" : "network", error });
      } finally {
        inflight = null;
        if (!lifetime.signal.aborted) setBusy(false);
      }
    }, { signal: lifetime.signal });

    return function destroy() {
      inflight?.abort();
      lifetime.abort();
      setBusy(false);
    };
  }

  // Заглушка сервера: возвращает настоящие объекты Response
  async function fakeServer(url, init) {
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 400);
      init.signal?.addEventListener("abort", () => { clearTimeout(t); reject(init.signal.reason); }, { once: true });
    });
    const data = new URLSearchParams(init.body);
    const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    if (data.get("email") === "taken@example.com") return json(422, { errors: { email: "Адрес уже занят" } });
    if (data.get("email") === "boom@example.com") return json(500, { error: "сбой" });
    return json(201, { id: 7 });
  }

  const status = document.getElementById("status");
  const say = (text, kind) => { status.textContent = text; status.dataset.kind = kind; };
  enhanceForm(document.getElementById("signup"), {
    fetchImpl: fakeServer,
    onSuccess: (data) => say("Аккаунт создан, id " + data.id, "ok"),
    onError: (e) => say(e.kind === "http" ? "Сервер ответил ошибкой " + e.status : "Нет связи с сервером", "error"),
  });
</script>
</html>`, { filename: "signup-demo.html", runnable: true, collapsed: true }),
      code("text", `во время запроса форма занята                        → true
успех                                                → Аккаунт создан, id 7
форма очищена после успеха                           → true
422: ошибка у поля почты                             → Адрес уже занят
после правки поля ошибка снята                       → ""
500                                                  → Сервер ответил ошибкой 500
пароль короче 8 — сервер не вызывается, браузер показывает ошибку → true`, { filename: "сценарий в Chromium 141 (Playwright)" }),
      p("Форма регистрации работает как обычная HTML-форма (без JavaScript она бы отправилась обычным `POST`), а `enhanceForm` из раздела «Задача» перехватывает `submit`, отправляет `fetch`, блокирует кнопки на время запроса (`aria-busy`), превращает ответ `422` в ошибку конкретного поля (`setCustomValidity`) и снимает её при правке. Сервер здесь — заглушка внутри страницы, возвращающая настоящие объекты `Response`; запустите страницу и попробуйте адреса `taken@example.com` и `boom@example.com`."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const form = document.querySelector("#signup");
const controller = new AbortController();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form, event.submitter);
  const response = await fetch(form.action, { method: "POST", body: data, signal: controller.signal });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const result = await response.json();
  console.log(result);
});`,
        [
          { line: 2, text: "`AbortController` — чтобы отменить запрос при уходе со страницы или повторной отправке." },
          { line: [4, 5], text: "Перехватываем `submit` (а не `click` по кнопке: так работают `Enter`, `requestSubmit` и проверка) и отменяем переход браузера." },
          { line: 6, text: "`new FormData(form, event.submitter)` собирает то, что отправил бы браузер, включая `name`/`value` нажатой кнопки." },
          { line: 7, text: "`fetch` с телом `FormData`: `Content-Type` и `boundary` выставляются автоматически; `signal` даёт отмену." },
          { line: 8, text: "`response.ok` — единственный способ узнать о `404`/`500`: `fetch` в этих случаях не отклоняется." },
          { line: 9, text: "Тело читается один раз: `json()` разбирает JSON и может отклониться `SyntaxError`." },
        ],
        "syntax.js",
      ),
    ]),

    section("minimal-example", [
      p("Не запуская код, запишите, какие пары попадут в `FormData`, и объясните, почему отсутствуют остальные."),
      code("html", `<form id="f">
  <input name="a" value="1">
  <input name="b" type="checkbox" value="2">
  <input name="c" type="checkbox" value="3" checked>
  <input name="d" value="4" disabled>
  <input value="5">
  <input name="e" type="radio" value="6"><input name="e" type="radio" value="7" checked>
  <select name="f" multiple><option>8</option><option selected>9</option><option selected>10</option></select>
  <input name="g" type="file">
  <button name="h" value="11">Один</button>
  <button name="i" value="12" type="button">Два</button>
</form>
<script>
  const fd = new FormData(document.getElementById("f"));
  window.out = [...fd].map(([k, v]) => k + "=" + (v instanceof File ? "File" : v));
</script>`, { filename: "x1-predict.html" }),
      code("text", `a=1
c=3
e=7
f=9
f=10
g=File`, { filename: "вывод Chromium 141" }),
      ul(
        "Вошли: `a` (текст), `c` (отмеченный checkbox), `e=7` (выбранный radio), `f=9` и `f=10` (два выбранных `<option>`), `g` (файловое поле: даже пустое даёт `File`).",
        "Не вошли: `b` (не отмечен), `d` (`disabled`), поле без `name`, `e=6` (не выбран), `<option>8` (не выбран), кнопки `h` и `i` (кнопка отправляется только как `submitter`; `type=button` — никогда).",
      ),
    ]),

    section("detailed-example", [
      p("`enhanceForm(form, options)` собирает всё из темы в один модуль: перехват `submit`, `FormData` с отправителем, адрес и способ из атрибутов формы и кнопки, тело `urlencoded` или `multipart`, `GET` с параметрами в адресе, блокировка повторной отправки, разбор `422` в ошибки полей, различение `http`/`network` ошибок и корректное уничтожение. Тест на живом сервере и в Chromium проверяет 11 сценариев."),
      code("js", `// Прогрессивное улучшение формы: без JS — обычная отправка, с JS — fetch без перезагрузки.
export function enhanceForm(form, { onSuccess, onError, resetOnSuccess = true, fetchImpl = globalThis.fetch } = {}) {
  const lifetime = new AbortController();
  let inflight = null;                                    // контроллер текущего запроса

  const setBusy = (busy) => {
    form.toggleAttribute("aria-busy", busy);
    for (const control of form.querySelectorAll("button, input[type=submit]")) control.disabled = busy;
  };

  form.addEventListener("submit", async (event) => {
    if (inflight) { event.preventDefault(); return; }     // повторная отправка во время запроса игнорируется
    event.preventDefault();

    const submitter = event.submitter;
    const data = new FormData(form, submitter);           // значение нажатой кнопки попадёт в данные
    const method = (submitter?.formMethod || form.method || "get").toUpperCase();
    // button.formAction без атрибута возвращает URL документа, а не action формы
    const action = new URL(submitter?.hasAttribute("formaction") ? submitter.formAction : form.action, document.baseURI);
    const multipart = (submitter?.formEnctype || form.enctype) === "multipart/form-data";

    const init = { method, signal: undefined };
    if (method === "GET") {
      for (const [key, value] of data) if (typeof value === "string") action.searchParams.append(key, value);
    } else {
      init.body = multipart ? data : new URLSearchParams([...data].filter(([, v]) => typeof v === "string"));
    }

    inflight = new AbortController();
    init.signal = AbortSignal.any([inflight.signal, lifetime.signal]);
    setBusy(true);
    try {
      const response = await fetchImpl(action, init);
      const isJson = response.headers.get("content-type")?.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (response.ok) {
        if (resetOnSuccess) form.reset();
        onSuccess?.(payload, response);
      } else if (response.status === 422 && payload?.errors) {
        let first = null;
        for (const [name, message] of Object.entries(payload.errors)) {
          const field = form.elements.namedItem(name);
          if (!field?.setCustomValidity) continue;
          field.setCustomValidity(message);               // сообщение сервера — как нативная ошибка поля
          field.addEventListener("input", () => field.setCustomValidity(""), { once: true });
          first ??= field;
        }
        setBusy(false);                                   // reportValidity() должен видеть доступную форму
        first?.reportValidity();
      } else {
        onError?.({ kind: "http", status: response.status, payload });
      }
    } catch (error) {
      if (lifetime.signal.aborted) return;                // компонент уничтожен — молчим
      onError?.({ kind: error.name === "AbortError" ? "aborted" : "network", error });
    } finally {
      inflight = null;
      if (!lifetime.signal.aborted) setBusy(false);
    }
  }, { signal: lifetime.signal });

  return function destroy() {
    inflight?.abort();
    lifetime.abort();
    setBusy(false);
  };
}`, { filename: "enhance-form.mjs", lineNumbers: true }),
      code("js", `import http from "node:http";
import fs from "node:fs";
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";

const src = fs.readFileSync(process.argv[2] ?? "enhance-form.mjs", "utf8").replace(/^export /m, "");
const requests = [];
const server = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/favicon.ico") { res.statusCode = 204; res.end(); return; }
  if (url.pathname === "/") { res.setHeader("content-type", "text/html"); res.end(PAGE); return; }
  const ct = req.headers["content-type"] ?? "";
  const fields = ct.startsWith("application/x-www-form-urlencoded") ? Object.fromEntries(new URLSearchParams(raw)) : {};
  requests.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), ct: ct.split(";")[0], multipart: /boundary=/.test(ct), fields });
  res.setHeader("content-type", "application/json");
  if (url.pathname === "/signup") {
    await new Promise((r) => setTimeout(r, 120));
    if (fields.email === "taken@example.com") { res.statusCode = 422; res.end(JSON.stringify({ errors: { email: "Адрес уже занят" } })); return; }
    if (fields.email === "boom@example.com") { res.statusCode = 500; res.end(JSON.stringify({ error: "сбой" })); return; }
    res.statusCode = 201; res.end(JSON.stringify({ id: 7 })); return;
  }
  res.end(JSON.stringify({ ok: true }));
});
const PAGE = \`<!doctype html><title>t</title>
<form id="f" action="/signup" method="post">
  <input name="email" type="email" required>
  <input name="note">
  <button id="send">Отправить</button>
  <button id="alt" name="intent" value="alt" formaction="/alt">Альтернатива</button>
</form>
<form id="g" action="/search" method="get"><input name="q" value="js"><button>Найти</button></form>
<form id="m" action="/upload" method="post" enctype="multipart/form-data"><input name="title" value="t"><input type="file" name="doc"><button>Загрузить</button></form>\`;
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = \`http://127.0.0.1:\${server.address().port}/\`;

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await b.newPage();
await page.goto(url);
await page.evaluate(() => { window.marker = "жива"; });
await page.addScriptTag({ content: src + \`
  window.events = [];
  window.destroyF = enhanceForm(document.getElementById("f"), { onSuccess: (d) => events.push("success:" + JSON.stringify(d)), onError: (e) => events.push("error:" + e.kind + (e.status ? ":" + e.status : "")) });
  enhanceForm(document.getElementById("g"), { onSuccess: () => events.push("search ok") });
  enhanceForm(document.getElementById("m"), { onSuccess: () => events.push("upload ok") });\` });

const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };
const take = () => requests.splice(0);
const ev = () => page.evaluate(() => events.splice(0));
const busy = () => page.evaluate(() => ({ ariaBusy: document.getElementById("f").hasAttribute("aria-busy"), disabled: [...document.querySelectorAll("#f button")].every((x) => x.disabled) }));

// 1. Успешная отправка: без перезагрузки, urlencoded, форма очищена, onSuccess
await page.fill("#f [name=email]", "ok@example.com"); await page.fill("#f [name=note]", "привет");
await page.click("#send");
await page.waitForFunction(() => events.length > 0);
let rq = take(), e = await ev();
check("успех: без перезагрузки, POST urlencoded, onSuccess, форма очищена",
  (await page.evaluate(() => window.marker)) === "жива" && rq.length === 1 && rq[0].method === "POST" && rq[0].ct === "application/x-www-form-urlencoded" && rq[0].fields.email === "ok@example.com" && rq[0].fields.note === "привет" && e.join() === 'success:{"id":7}' && (await page.inputValue("#f [name=email]")) === "", JSON.stringify({ rq: rq[0], e }));

// 2. Занятость и двойной клик
await page.fill("#f [name=email]", "ok@example.com");
await page.click("#send");
const during = await busy();
await page.evaluate(() => document.getElementById("f").requestSubmit());      // повторная отправка во время запроса
await page.waitForFunction(() => events.length > 0);
rq = take(); await ev();
const after = await busy();
check("во время запроса форма занята (aria-busy, кнопки отключены), повторная отправка игнорируется, потом всё восстановлено", during.ariaBusy && during.disabled && rq.length === 1 && !after.ariaBusy && !after.disabled, JSON.stringify({ during, запросов: rq.length, after }));

// 3. 422 → setCustomValidity
await page.fill("#f [name=email]", "taken@example.com"); await page.click("#send");
await page.waitForFunction(() => document.querySelector("#f [name=email]").validationMessage !== "");
const msg = await page.evaluate(() => document.querySelector("#f [name=email]").validationMessage);
check("422: сообщение сервера стало ошибкой поля, форма не очищена", msg === "Адрес уже занят" && (await page.inputValue("#f [name=email]")) === "taken@example.com" && (await ev()).length === 0, msg);
await page.fill("#f [name=email]", "other@example.com");
check("правка поля снимает серверную ошибку", (await page.evaluate(() => document.querySelector("#f [name=email]").validationMessage)) === "");
take();

// 4. 500 → onError(http)
await page.fill("#f [name=email]", "boom@example.com"); await page.click("#send");
await page.waitForFunction(() => events.length > 0);
e = await ev(); take();
const s500 = await busy();
check("500: onError({kind: http, status: 500}), форма снова доступна", e.join() === "error:http:500" && !s500.ariaBusy && !s500.disabled, e.join());

// 5. Сетевая ошибка
await page.route("**/signup", (route) => route.abort());
await page.fill("#f [name=email]", "ok@example.com"); await page.click("#send");
await page.waitForFunction(() => events.length > 0);
e = await ev(); await page.unroute("**/signup"); take();
check("сетевая ошибка: onError({kind: network})", e.join() === "error:network", e.join());

// 6. submitter: formaction и значение кнопки
await page.fill("#f [name=email]", "ok@example.com"); await page.click("#alt");
await page.waitForFunction(() => events.length > 0 || true); await page.waitForTimeout(150);
rq = take(); await ev();
check("кнопка с formaction и name/value: другой адрес и её значение в данных", rq.length === 1 && rq[0].path === "/alt" && rq[0].fields.intent === "alt", JSON.stringify(rq[0]));

// 7. GET → строка запроса
await page.click("#g button"); await page.waitForTimeout(120);
rq = take(); await ev();
check("method=get: данные в строке запроса, тела нет", rq.length === 1 && rq[0].method === "GET" && rq[0].query.q === "js" && rq[0].ct === "", JSON.stringify(rq[0]));

// 8. multipart
await page.setInputFiles("#m [name=doc]", { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
await page.click("#m button"); await page.waitForTimeout(120);
rq = take(); await ev();
check("enctype=multipart/form-data: тело multipart с boundary", rq.length === 1 && rq[0].ct === "multipart/form-data" && rq[0].multipart, JSON.stringify(rq[0]));

// 9. destroy(): запрос отменён, колбэки молчат, перехват снят
await page.fill("#f [name=email]", "ok@example.com");
await page.evaluate(() => { document.getElementById("f").requestSubmit(); setTimeout(() => destroyF(), 30); });
await page.waitForTimeout(250);
e = await ev(); take();
const dBusy = await busy();
check("destroy() посреди запроса: колбэки не вызваны, форма доступна", e.length === 0 && !dBusy.ariaBusy && !dBusy.disabled);
const prevented = await page.evaluate(() => new Promise((res) => { const f = document.getElementById("f"); f.addEventListener("submit", (ev) => { setTimeout(() => res(ev.defaultPrevented)); }, { once: true }); f.target = "_blank"; f.requestSubmit(); }));
check("после destroy() submit больше не перехватывается", prevented === false);

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
await b.close(); server.closeAllConnections?.(); server.close();
process.exit(failed ? 1 : 0);`, { filename: "enhance-form-test.mjs", collapsed: true }),
      code("text", `✓ успех: без перезагрузки, POST urlencoded, onSuccess, форма очищена — {"rq":{"method":"POST","path":"/signup","query":{},"ct":"application/x-www-form-urlencoded","multipart":false,"fields":{"email":"ok@example.com","note":"привет"}},"e":["success:{\\"id\\":7}"]}
✓ во время запроса форма занята (aria-busy, кнопки отключены), повторная отправка игнорируется, потом всё восстановлено — {"during":{"ariaBusy":true,"disabled":true},"запросов":1,"after":{"ariaBusy":false,"disabled":false}}
✓ 422: сообщение сервера стало ошибкой поля, форма не очищена — Адрес уже занят
✓ правка поля снимает серверную ошибку
✓ 500: onError({kind: http, status: 500}), форма снова доступна — error:http:500
✓ сетевая ошибка: onError({kind: network}) — error:network
✓ кнопка с formaction и name/value: другой адрес и её значение в данных — {"method":"POST","path":"/alt","query":{},"ct":"application/x-www-form-urlencoded","multipart":false,"fields":{"email":"ok@example.com","note":"","intent":"alt"}}
✓ method=get: данные в строке запроса, тела нет — {"method":"GET","path":"/search","query":{"q":"js"},"ct":"","multipart":false,"fields":{}}
✓ enctype=multipart/form-data: тело multipart с boundary — {"method":"POST","path":"/upload","query":{},"ct":"multipart/form-data","multipart":true,"fields":{}}
✓ destroy() посреди запроса: колбэки не вызваны, форма доступна
✓ после destroy() submit больше не перехватывается

Все проверки пройдены: 11/11`, { filename: "результат запуска (Chromium 141 + локальный сервер)" }),
    ]),

    section("analysis", [
      table(
        ["Решение в `enhanceForm`", "Что даёт", "Что сломается без него (проверено мутацией теста)"],
        [
          ["`event.preventDefault()` + `new FormData(form, submitter)`", "Отправка без перезагрузки; значение нажатой кнопки", "Без `submitter` пропадает `intent=alt` — тест «кнопка с formaction» падает"],
          ["`submitter.hasAttribute(\"formaction\") ? submitter.formAction : form.action`", "Правильный адрес", "С `submitter.formAction || form.action` запрос уходит на адрес страницы — падают 7 проверок"],
          ["`if (inflight) return` + `setBusy`", "Одна отправка за раз; `aria-busy`, отключённые кнопки", "Без проверки на сервере два запроса вместо одного"],
          ["`finally { inflight = null; setBusy(false) }`", "Форма всегда возвращается в рабочее состояние", "После успеха кнопка остаётся отключённой, дальнейшая отправка невозможна"],
          ["`response.status === 422 && payload.errors` → `setCustomValidity`", "Ошибки сервера — как нативные ошибки полей, доступные скринридерам", "Без снятия на `input` поле остаётся невалидным и форма не отправится повторно"],
          ["`AbortSignal.any([inflight.signal, lifetime.signal])`", "`destroy()` отменяет запрос; колбэки не вызываются", "Без проверки `lifetime.signal.aborted` пользователь получает `onError` от уничтоженной формы"],
          ["`method === \"GET\"` → параметры в адресе", "Корректный поиск и фильтры", "Тело у `GET` недопустимо — `fetch` бросит `TypeError`"],
        ],
        "Разбор enhanceForm",
      ),
      ul(
        "**Прогрессивное улучшение:** разметка формы остаётся рабочей без скрипта (`action`, `method`); `enhanceForm` меняет только способ доставки.",
        "**Единый контракт:** атрибуты формы — источник правды (адрес, метод, кодировка); код не дублирует их константами.",
        "**Состояние занятости на форме,** а не в переменной компонента: `aria-busy` читают ассистивные технологии, а CSS может его стилизовать.",
      ),
    ]),

    section("internals", [
      h("Как браузер собирает набор данных формы"),
      steps(
        [
          ["Обход", "Браузер проходит по «отправляемым элементам» формы в порядке дерева (включая элементы с атрибутом `form=\"id\"` вне `<form>`)."],
          ["Фильтрация", "Пропускаются отключённые, без `name`, неотмеченные checkbox/radio, невыбранные `<option>`, кнопки (кроме отправителя)."],
          ["Нормализация", "Значения `textarea` и других полей приводятся к виду, пригодному для кодирования; файловое поле без файла даёт пустой `File`."],
          ["Кодирование", "По `enctype`: `application/x-www-form-urlencoded` (по умолчанию), `multipart/form-data` (обязателен для файлов), `text/plain` (отладка)."],
          ["Отправка", "Для `GET` набор попадает в строку запроса, для `POST` — в тело; затем навигация (или `fetch`, если вы перехватили `submit`)."],
        ],
        "Алгоритм отправки формы",
      ),
      h("Событие `formdata` и вызов `submit()`"),
      p("`new FormData(form)` и отправка формы строят один и тот же набор и вызывают событие `formdata` на форме — поэтому слушатель `formdata` может добавить поле независимо от способа отправки (замер: сработал и при `requestSubmit`, и при `form.submit()`). А вот событие `submit` и проверку ограничений `form.submit()` пропускает."),
      h("Как `fetch` выбирает `Content-Type`"),
      p("Если заголовок не задан, он выводится из типа тела: строка → `text/plain;charset=UTF-8`, `URLSearchParams` → `application/x-www-form-urlencoded;charset=UTF-8`, `Blob` → его `type`, `FormData` → `multipart/form-data; boundary=…` (граница создаётся при формировании тела), `ArrayBuffer` и потоки — без заголовка. Заданный вручную заголовок **заменяет** вычисленный — поэтому ручной `multipart/form-data` теряет границу."),
      h("CORS: простые и непростые запросы"),
      p("«Простые» запросы — методы `GET`/`HEAD`/`POST`, безопасные заголовки и `Content-Type` из набора `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data` — отправляются сразу, а ответ проверяется после получения. Все остальные (другие методы, пользовательские заголовки, `application/json`) сначала проходят preflight; без положительного ответа основной запрос не уходит (замер: случай 5). Cookie и HTTP-аутентификация добавляются только при `credentials: \"include\"`, а сервер обязан явно разрешить это и назвать точный origin."),
      h("Тело ответа — поток"),
      p("`response.body` — `ReadableStream`; методы `json()`, `text()`, `blob()` читают его целиком и помечают тело использованным (`bodyUsed`). `clone()` разветвляет поток, поэтому оба читателя держат данные в памяти, пока не прочитают."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Ручной `Content-Type` при отправке `FormData`"),
      wrongRight(
        "js",
        {
          code: `
            await fetch("/upload", {
              method: "POST",
              headers: { "Content-Type": "multipart/form-data" },   // граница не указана
              body: new FormData(form),
            });
          `,
          note: "Замер: сервер получил `multipart/form-data` без `boundary` — разбор невозможен.",
        },
        {
          code: `
            await fetch("/upload", { method: "POST", body: new FormData(form) });  // заголовок и границу выставит fetch
          `,
          note: "Не задавайте `Content-Type` для `FormData`: `fetch` добавит `boundary` сам.",
        },
      ),
      h("Ошибка 2. Объект вместо строки в `body`"),
      p("`body: { a: 1 }` отправляет `[object Object]` (замер). Для JSON — `JSON.stringify(obj)` **и** заголовок `Content-Type: application/json`."),
      h("Ошибка 3. Не проверять `response.ok`"),
      p("`fetch` не отклоняется при `404`/`500` (замер: `ok = false`, тело читается). Код, который сразу вызывает `response.json()`, на ошибках сервера покажет «успех» с чужими данными или упадёт на разборе."),
      h("Ошибка 4. Читать тело дважды"),
      p("Второй вызов `response.json()` падает (`TypeError: Body is unusable`). Читайте один раз либо сделайте `response.clone()` до первого чтения."),
      h("Ошибка 5. Обходить проверку через `form.submit()`"),
      p("`form.submit()` не проверяет ограничения и не вызывает `submit` (замер) — вся встроенная валидация обойдена. Используйте `requestSubmit()`."),
      h("Ошибка 6. Слушать `click` по кнопке вместо `submit`"),
      p("Так теряются отправка по `Enter` (но там `click` тоже приходит), программная отправка `requestSubmit()` и корректный `submitter`. Слушайте `submit` на форме."),
      h("Ошибка 7. Собирать данные вручную через `querySelector`"),
      p("Теряются правила браузера: неотмеченные checkbox, `disabled`, несколько значений, файлы. Используйте `new FormData(form)`; `Object.fromEntries(fd)` — только если нет повторяющихся имён (замер: остаётся последнее значение)."),
      h("Ошибка 8. Считать CORS защитой сервера"),
      p("Запрос доходит до сервера, даже если ответ скрыт (замер: сервер увидел `GET /plain`). Защита от нежелательных запросов — аутентификация, CSRF-токены и проверки на сервере, а не CORS."),
      h("Ошибка 9. Не блокировать повторную отправку"),
      p("Двойной клик создаёт две записи. Блокируйте кнопки (`disabled`, `aria-busy`) на время запроса и идемпотентно обрабатывайте на сервере (ключ идемпотентности)."),
      h("Ошибка 10. `button.formAction` вместо `form.action`"),
      p("У кнопки без атрибута `formaction` свойство возвращает адрес **документа** (замер: `/page`). Проверяйте `hasAttribute(\"formaction\")`."),
    ]),

    section("antipatterns", [
      ul(
        "**Валидация только на клиенте:** встроенная проверка — удобство для пользователя, а не защита; сервер проверяет всё заново.",
        "**Пароли и токены в `GET`-форме** (попадают в историю браузера, журналы и заголовок `Referer`).",
        "**`novalidate` и самописная проверка** без причины: теряются `validity`, локализованные сообщения, `:user-invalid`.",
        "**`alert()` для ошибок,** вместо связанных с полем сообщений и `aria-live`.",
        "**Глобальный `try/catch`, показывающий «Ошибка»,** без различения сети, `4xx`, `5xx` и отмены.",
        "**`fetch(...).then(r => r.json())` без `response.ok`.**",
        "**`mode: \"no-cors\"` как «исправление» CORS:** ответ станет непрозрачным.",
        "**Хранение секретных ключей в JavaScript страницы** (`fetch` с ключом API стороннего сервиса).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Начинайте с рабочей HTML-формы** (`action`, `method`, `name`, `required`, `type`), затем улучшайте скриптом.",
        "**Слушайте `submit`; данные — `new FormData(form, event.submitter)`;** адрес и метод берите из атрибутов формы.",
        "**Не задавайте `Content-Type` для `FormData` и `URLSearchParams`;** для JSON — `JSON.stringify` и `application/json`.",
        "**Проверяйте `response.ok` до чтения тела;** различайте сетевую ошибку (`TypeError`), отмену (`AbortError`), ошибки сервера и ошибки валидации (`422`).",
        "**Ошибки сервера связывайте с полями** (`setCustomValidity` + `aria-describedby`/`aria-live`) и снимайте при правке.",
        "**Блокируйте повторную отправку** и давайте `signal` для отмены; идемпотентность — на сервере.",
        "**Для поиска и фильтров — `GET`** (ссылку можно сохранить и поделиться), для изменений — `POST`/`PUT`/`PATCH`/`DELETE`.",
        "**CORS настраивайте на сервере:** точный `Access-Control-Allow-Origin`, `Allow-Methods`, `Allow-Headers`, `Max-Age` для кэширования preflight; для cookie — `Allow-Credentials: true` и `credentials: \"include\"`.",
      ),
      tip("Для отладки смотрите вкладку Network: колонка Method покажет `OPTIONS` (preflight), а раздел Payload — реальное тело и `Content-Type` с границей `multipart`."),
    ]),

    section("edge-cases", [
      h("Файлы и `multipart`"),
      p("Файловое поле без выбранного файла всё равно даёт запись `File` с пустым именем и размером `0` (замер); сервер должен это обрабатывать. Для файлов нужен `enctype=\"multipart/form-data\"`; при обычной кодировке в тело попадёт только имя файла."),
      h("Поля вне формы и атрибут `form`"),
      p("Элемент с атрибутом `form=\"id\"` относится к форме, даже если лежит вне неё: он попадёт в `FormData` и в `form.elements`. Вложенные формы в HTML недопустимы."),
      h("Кодировка и переводы строк"),
      code("js", `import http from "node:http";
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
const got = [];
const server = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  if (req.method === "POST") got.push({ url: req.url, ct: (req.headers["content-type"] || "").split(";")[0], body: Buffer.concat(chunks).toString("utf8") });
  res.setHeader("content-type", "text/html"); res.end(\`<!doctype html><form id=f method=post action=/native><textarea name=t>a\\nb</textarea><button>go</button></form>\`);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await b.newPage();
await page.goto(\`http://127.0.0.1:\${server.address().port}/\`);
await Promise.all([page.waitForNavigation(), page.click("button")]);
await page.goto(\`http://127.0.0.1:\${server.address().port}/\`);
await page.evaluate(() => fetch("/viafetch", { method: "POST", body: new FormData(document.getElementById("f")) }));
await page.evaluate(() => fetch("/viaparams", { method: "POST", body: new URLSearchParams(new FormData(document.getElementById("f"))) }));
const label = { "/native": "обычная отправка формы    ", "/viafetch": "fetch + FormData(form)      ", "/viaparams": "fetch + URLSearchParams(fd) " };
for (const g of got) console.log(label[g.url], "→", g.ct.padEnd(33), JSON.stringify(g.body.replace(/-{4,}WebKitFormBoundary\\w+/g, "BOUNDARY")));
await b.close(); server.close();`, { filename: "run-fm7-newlines.mjs", collapsed: true }),
      code("text", `обычная отправка формы     → application/x-www-form-urlencoded "t=a%0D%0Ab"
fetch + FormData(form)       → multipart/form-data               "BOUNDARY\\r\\nContent-Disposition: form-data; name=\\"t\\"\\r\\n\\r\\na\\r\\nb\\r\\nBOUNDARY--\\r\\n"
fetch + URLSearchParams(fd)  → application/x-www-form-urlencoded "t=a%0Ab"`, { filename: "замер в Chromium 141 (что получил сервер для textarea со значением «a⏎b»)" }),
      p("В `FormData` значение `textarea` содержит `\\n`, но на проводе картина разная: обычная отправка формы и `multipart` через `FormData` дают `\\r\\n` (`%0D%0A` в urlencoded), а `URLSearchParams(formData)` — одиночный `\\n` (`%0A`). Не полагайтесь на конкретный вид перевода строки: нормализуйте его на сервере."),
      h("`autocomplete` и менеджеры паролей"),
      p("Отправка через `fetch` без навигации может не сохранять пароль в менеджере: браузеры ориентируются на навигацию формы. Для входа проверяйте поведение и используйте правильные `autocomplete` (`username`, `current-password`, `new-password`)."),
      h("`FormData` в `Request` и повторное использование"),
      p("`FormData` можно отправлять повторно (в отличие от потока), поэтому повтор запроса при сетевой ошибке допустим; но для небезопасных методов повторять нужно только идемпотентно."),
      h("Сообщения об ошибках зависят от языка браузера"),
      p("`validationMessage` локализуется браузером; для единого текста задавайте его через `setCustomValidity` в обработчике `invalid`, не забывая очищать в `input`."),
    ]),

    section("related", [
      ul(
        "[async/await, отмена и AbortController](/learn/js/async-await-abort) — `signal`, тайм-ауты и `fetchJson`.",
        "[DOM и события](/learn/js/dom-events) — `submit`, `change`, `input`, делегирование на формах.",
        "[Формы в HTML](/learn/html/forms-basics) — `action`, `method`, `enctype`, `name`.",
        "[Проверка форм](/learn/html/form-validation) — атрибуты ограничений и сообщения.",
        "[Доступные формы](/learn/html/accessible-forms) — подписи, ошибки и `aria-live`.",
        "[Безопасность HTML](/learn/html/html-security) — CSRF, `rel`, политики и межсайтовые запросы.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Клик по кнопке, ручной сбор данных и «успех» при любом ответе",
          code: `
            document.querySelector("#send").addEventListener("click", async () => {
              const body = { email: email.value, agree: agree.checked };
              const res = await fetch("/signup", { method: "POST", body });      // "[object Object]"
              const data = await res.json();
              alert("Готово: " + data.id);
            });
          `,
          note: "Не работает отправка по Enter, не учитывается валидация, тело — `[object Object]`, нет проверки `res.ok`, двойной клик создаёт две записи.",
        },
        {
          title: "submit, FormData, response.ok и состояние занятости",
          code: `
            form.addEventListener("submit", async (event) => {
              event.preventDefault();
              if (form.hasAttribute("aria-busy")) return;
              form.setAttribute("aria-busy", "");
              try {
                const res = await fetch(form.action, { method: "POST", body: new FormData(form, event.submitter) });
                if (res.status === 422) return showFieldErrors(await res.json());
                if (!res.ok) throw new Error("HTTP " + res.status);
                onSuccess(await res.json());
              } catch (error) {
                showNetworkError(error);
              } finally {
                form.removeAttribute("aria-busy");
              }
            });
          `,
          note: "Работает с клавиатурой и `requestSubmit`, учитывает проверку, различает ошибки и не допускает двойной отправки.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.forms-fetch.ex1",
      title: "Что попадёт в FormData",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код (раздел «Минимальный пример»), перечислите пары `имя=значение` из `new FormData(form)` и для каждого пропущенного элемента назовите причину."),
        code("html", `<form id="f">
  <input name="a" value="1">
  <input name="b" type="checkbox" value="2">
  <input name="c" type="checkbox" value="3" checked>
  <input name="d" value="4" disabled>
  <input value="5">
  <input name="e" type="radio" value="6"><input name="e" type="radio" value="7" checked>
  <select name="f" multiple><option>8</option><option selected>9</option><option selected>10</option></select>
  <input name="g" type="file">
  <button name="h" value="11">Один</button>
  <button name="i" value="12" type="button">Два</button>
</form>
<script>
  const fd = new FormData(document.getElementById("f"));
  window.out = [...fd].map(([k, v]) => k + "=" + (v instanceof File ? "File" : v));
</script>`, { filename: "x1-predict.html" }),
      ],
      hints: ["Какие элементы формы «отправляемые»?", "Попадают ли кнопки в `FormData`, если не передан отправитель?"],
      checks: ["Названы `a=1, c=3, e=7, f=9, f=10, g`", "Названы причины пропусков (не отмечен, `disabled`, нет `name`, не выбран, кнопки)", "Учтён пустой файл"],
      solution: [
        code("text", `a=1
c=3
e=7
f=9
f=10
g=File`, { filename: "вывод Chromium 141" }),
        p("Попали поля с `name`, не отключённые и выбранные. Пропущены: `b` (checkbox не отмечен), `d` (`disabled`), поле без `name`, `e=6` и `<option>8` (не выбраны), кнопки `h` и `i`. Файловое поле `g` присутствует, хотя файла нет: запись `File` с пустым именем."),
      ],
    }),
    exercise({
      id: "js.forms-fetch.ex2",
      title: "Сервер не может разобрать загрузку",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Разработчик отправляет форму с файлом так: `fetch(\"/upload\", { method: \"POST\", headers: { \"Content-Type\": \"multipart/form-data\" }, body: new FormData(form) })`, а в соседнем запросе — `body: { title: \"x\" }`. Сервер в первом случае не находит поля, во втором получает странный текст. Объясните обе проблемы по замерам из раздела про `fetch` и исправьте код."),
      ],
      hints: ["Что в заголовке `Content-Type` необходимо для `multipart`, кроме типа?", "Во что превращается объект при приведении к строке?"],
      checks: ["Названа потеря `boundary`", "Названо `[object Object]`", "Исправления: убрать заголовок; JSON.stringify + заголовок или FormData/URLSearchParams"],
      solution: [
        code("text", `— тело запроса и заголовок Content-Type, который fetch выставляет сам —
строка                             → {"contentType":"text/plain;charset=UTF-8","boundary":false,"body":"привет"}
JSON.stringify без заголовка       → {"contentType":"text/plain;charset=UTF-8","boundary":false,"body":"{\\"a\\":1}"}
JSON.stringify + заголовок         → {"contentType":"application/json","boundary":false,"body":"{\\"a\\":1}"}
URLSearchParams                    → {"contentType":"application/x-www-form-urlencoded;charset=UTF-8","boundary":false,"body":"q=js&page=2"}
Blob с типом                       → {"contentType":"application/json","boundary":false,"body":"{}"}
объект {a: 1} (ошибка)             → {"contentType":"text/plain;charset=UTF-8","boundary":false,"body":"[object Object]"}
FormData                           → {"contentType":"multipart/form-data; boundary=…","boundary":true,"body":"------formdata-undici-…\\r\\nContent-Disposi"}
FormData + ручной Content-Type     → {"contentType":"multipart/form-data","boundary":false,"body":"------formdata-undici-…\\r\\nContent-Disposi"}

— ответ —
404: fetch не отклонился; ok = false | status = 404 | тело: { error: 'не найдено' }
редирект: redirected = true | status = 200 | url оканчивается на /echo
redirect: 'manual': status = 302 | location = /echo
до чтения: bodyUsed = false
после json(): bodyUsed = true | клон ещё читается: POST
повторное чтение: TypeError: Body is unusable: Body has already been read
некорректный JSON: SyntaxError
204: тело пустое, text() = ""
Headers: get('x-request-id') = 7 | ключи: accept, x-request-id

— потоковое чтение тела —
получено байт: 4000 | пришло несколькими частями: true

— сетевая ошибка —
TypeError: fetch failed | причина: ECONNREFUSED`, { filename: "вывод Node.js 22.22.0 (смотрите строки про FormData и объект)" }),
        p("Первый запрос: ручной `Content-Type` заменил вычисленный, в нём нет `boundary` (замер: `boundary: false`) — сервер не может разделить части. Второй: объект приводится к строке `[object Object]`. Исправление: `fetch(\"/upload\", { method: \"POST\", body: new FormData(form) })` без заголовка; для JSON — `body: JSON.stringify({ title: \"x\" })` с `Content-Type: application/json`, а для простых полей — `new URLSearchParams({ title: \"x\" })`."),
      ],
    }),
    exercise({
      id: "js.forms-fetch.ex3",
      title: "Три симптома CORS",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Страница на `app.example` обращается к API на `api.example`. Для каждого симптома назовите причину и исправление **на сервере** по замерам раздела «CORS»: 1) в консоли ошибка CORS, но в журнале API запрос виден; 2) `POST` с JSON не доходит — в журнале только `OPTIONS` с кодом `404`; 3) сессионная cookie не отправляется на API, хотя вход выполнен."),
      ],
      hints: ["Что делает браузер с ответом без `Access-Control-Allow-Origin`?", "Какие заголовки нужны в ответе на `OPTIONS`?", "Что нужно и клиенту, и серверу, чтобы cookie ушла на другой origin?"],
      checks: ["Симптом 1: нет `Access-Control-Allow-Origin` в ответе; запрос дошёл", "Симптом 2: обработать `OPTIONS` и вернуть `Allow-Origin`, `Allow-Methods`, `Allow-Headers`", "Симптом 3: `credentials: \"include\"` + `Allow-Credentials: true` + точный origin (не `*`)"],
      solution: [
        code("text", `1. Чужой origin без CORS-заголовков (простой GET)
  результат в браузере: "исключение TypeError: Failed to fetch"
  сервер получил: GET /plain
2. Ответ с Access-Control-Allow-Origin: * (читаем заголовки)
  результат в браузере: {"status":200,"exposed":"1","hidden":null}
  сервер получил: GET /open
3. POST с Content-Type: text/plain (простой запрос)
  результат в браузере: 200
  сервер получил: POST /json
4. POST с Content-Type: application/json (нужен preflight)
  результат в браузере: {"saved":true}
  сервер получил: OPTIONS /json [ACRM=POST, ACRH=content-type] → POST /json
5. То же, но сервер не отвечает на OPTIONS
  результат в браузере: "исключение TypeError: Failed to fetch"
  сервер получил: OPTIONS /no-preflight-support [ACRM=POST, ACRH=content-type]
6. mode: 'no-cors' к серверу без CORS-заголовков
  результат в браузере: {"type":"opaque","status":0,"body":""}
  сервер получил: GET /plain
7a. Cookie: credentials по умолчанию (same-origin)
  результат в браузере: {"cookie":null}
  сервер получил: GET /cookie
7b. Cookie: credentials: 'include' — сервер выдаёт cookie
  результат в браузере: {"cookie":null}
  сервер получил: GET /cookie
7c. Cookie: credentials: 'include' — cookie отправляется
  результат в браузере: {"cookie":"sid=42"}
  сервер получил: GET /cookie
7d. Cookie: по умолчанию cookie НЕ отправляется
  результат в браузере: {"cookie":null}
  сервер получил: GET /cookie
8. credentials: 'include' и Allow-Origin: *
  результат в браузере: "исключение TypeError: Failed to fetch"
  сервер получил: GET /cookie-wildcard

Сообщения консоли Chromium (первые предложения):
  Access to fetch at 'http://localhost:PORT/plain' from origin 'http://localhost:PORT' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  Failed to load resource: net::ERR_FAILED
  Access to fetch at 'http://localhost:PORT/no-preflight-support' from origin 'http://localhost:PORT' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  Access to fetch at 'http://localhost:PORT/cookie-wildcard' from origin 'http://localhost:PORT' has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.`, { filename: "замер в Chromium 141" }),
        ul(
          "**1.** Сервер получил запрос и ответил, но без `Access-Control-Allow-Origin` — браузер скрыл ответ (случай 1). Добавьте заголовок с origin страницы (или `*`, если данные публичные и без cookie).",
          "**2.** Для `application/json` браузер сначала шлёт `OPTIONS` с `Access-Control-Request-Method` и `Access-Control-Request-Headers`; ответ `404` без разрешающих заголовков — основной запрос не отправляется (случай 5). Обработайте `OPTIONS`: `204` и `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods: POST`, `Access-Control-Allow-Headers: content-type` (можно `Access-Control-Max-Age`).",
          "**3.** Кросс-доменный запрос по умолчанию без cookie (случай 7d). Клиент: `credentials: \"include\"`; сервер: `Access-Control-Allow-Credentials: true` и **точный** origin вместо `*` (с `*` ответ отклонён — случай 8); для `Set-Cookie` учтите атрибуты `SameSite`/`Secure`.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "js.forms-fetch.challenge",
    title: "enhanceForm: форма, которая работает и без JavaScript",
    scenario: [
      p("В проекте десятки форм: регистрация, поиск, загрузка файла. Каждая отправляется обычным `POST` с перезагрузкой. Напишите функцию `enhanceForm(form, { onSuccess, onError, resetOnSuccess, fetchImpl })`, которая без изменения разметки отправляет форму через `fetch`, показывает серверные ошибки в полях и не допускает двойной отправки."),
    ],
    requirements: [
      "Перехват события `submit`: `preventDefault()`, данные — `new FormData(form, event.submitter)`",
      "Адрес берётся из `formaction` кнопки (если атрибут есть) либо из `form.action`; метод — из `formmethod`/`form.method`; для `GET` данные уходят в строку запроса без тела",
      "`enctype=\"multipart/form-data\"` — тело `FormData`; иначе — `URLSearchParams` (`application/x-www-form-urlencoded`)",
      "На время запроса форма помечена `aria-busy`, кнопки отключены; повторные отправки игнорируются; в `finally` состояние восстанавливается",
      "Успех (`response.ok`) — `onSuccess(данные, response)` и (по умолчанию) `form.reset()`; `422` с `{ errors: { поле: текст } }` — `setCustomValidity` у полей, `reportValidity()` и снятие ошибки при вводе",
      "Прочие статусы — `onError({ kind: \"http\", status, payload })`; сетевая ошибка — `onError({ kind: \"network\" })`",
      "Возвращает `destroy()`: отменяет запрос, снимает перехват, ни один колбэк после уничтожения не вызывается",
    ],
    constraints: [
      "Без внешних библиотек; `fetch` внедряется параметром `fetchImpl` (для тестов и заглушек)",
      "Не использовать `form.submit()` и не отключать нативную проверку (`novalidate`)",
    ],
    acceptance: [
      "Все 11 проверок теста проходят в Chromium 141 (3 запуска подряд без нестабильности)",
      "Мутации — замена `formAction` на `submitter.formAction || form.action`, снятие блокировки двойной отправки, потеря `submitter`, отсутствие снятия серверной ошибки — обнаруживаются тестом",
    ],
    hints: [
      "Где хранить признак «запрос идёт» так, чтобы он пережил перерисовки?",
      "Что вернёт `button.formAction`, если атрибута `formaction` нет?",
      "Как сделать так, чтобы `destroy()` и повторная отправка отменяли один и тот же запрос?",
    ],
    solution: [
      code("js", `// Прогрессивное улучшение формы: без JS — обычная отправка, с JS — fetch без перезагрузки.
export function enhanceForm(form, { onSuccess, onError, resetOnSuccess = true, fetchImpl = globalThis.fetch } = {}) {
  const lifetime = new AbortController();
  let inflight = null;                                    // контроллер текущего запроса

  const setBusy = (busy) => {
    form.toggleAttribute("aria-busy", busy);
    for (const control of form.querySelectorAll("button, input[type=submit]")) control.disabled = busy;
  };

  form.addEventListener("submit", async (event) => {
    if (inflight) { event.preventDefault(); return; }     // повторная отправка во время запроса игнорируется
    event.preventDefault();

    const submitter = event.submitter;
    const data = new FormData(form, submitter);           // значение нажатой кнопки попадёт в данные
    const method = (submitter?.formMethod || form.method || "get").toUpperCase();
    // button.formAction без атрибута возвращает URL документа, а не action формы
    const action = new URL(submitter?.hasAttribute("formaction") ? submitter.formAction : form.action, document.baseURI);
    const multipart = (submitter?.formEnctype || form.enctype) === "multipart/form-data";

    const init = { method, signal: undefined };
    if (method === "GET") {
      for (const [key, value] of data) if (typeof value === "string") action.searchParams.append(key, value);
    } else {
      init.body = multipart ? data : new URLSearchParams([...data].filter(([, v]) => typeof v === "string"));
    }

    inflight = new AbortController();
    init.signal = AbortSignal.any([inflight.signal, lifetime.signal]);
    setBusy(true);
    try {
      const response = await fetchImpl(action, init);
      const isJson = response.headers.get("content-type")?.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (response.ok) {
        if (resetOnSuccess) form.reset();
        onSuccess?.(payload, response);
      } else if (response.status === 422 && payload?.errors) {
        let first = null;
        for (const [name, message] of Object.entries(payload.errors)) {
          const field = form.elements.namedItem(name);
          if (!field?.setCustomValidity) continue;
          field.setCustomValidity(message);               // сообщение сервера — как нативная ошибка поля
          field.addEventListener("input", () => field.setCustomValidity(""), { once: true });
          first ??= field;
        }
        setBusy(false);                                   // reportValidity() должен видеть доступную форму
        first?.reportValidity();
      } else {
        onError?.({ kind: "http", status: response.status, payload });
      }
    } catch (error) {
      if (lifetime.signal.aborted) return;                // компонент уничтожен — молчим
      onError?.({ kind: error.name === "AbortError" ? "aborted" : "network", error });
    } finally {
      inflight = null;
      if (!lifetime.signal.aborted) setBusy(false);
    }
  }, { signal: lifetime.signal });

  return function destroy() {
    inflight?.abort();
    lifetime.abort();
    setBusy(false);
  };
}`, { filename: "enhance-form.mjs", lineNumbers: true }),
      code("text", `✓ успех: без перезагрузки, POST urlencoded, onSuccess, форма очищена — {"rq":{"method":"POST","path":"/signup","query":{},"ct":"application/x-www-form-urlencoded","multipart":false,"fields":{"email":"ok@example.com","note":"привет"}},"e":["success:{\\"id\\":7}"]}
✓ во время запроса форма занята (aria-busy, кнопки отключены), повторная отправка игнорируется, потом всё восстановлено — {"during":{"ariaBusy":true,"disabled":true},"запросов":1,"after":{"ariaBusy":false,"disabled":false}}
✓ 422: сообщение сервера стало ошибкой поля, форма не очищена — Адрес уже занят
✓ правка поля снимает серверную ошибку
✓ 500: onError({kind: http, status: 500}), форма снова доступна — error:http:500
✓ сетевая ошибка: onError({kind: network}) — error:network
✓ кнопка с formaction и name/value: другой адрес и её значение в данных — {"method":"POST","path":"/alt","query":{},"ct":"application/x-www-form-urlencoded","multipart":false,"fields":{"email":"ok@example.com","note":"","intent":"alt"}}
✓ method=get: данные в строке запроса, тела нет — {"method":"GET","path":"/search","query":{"q":"js"},"ct":"","multipart":false,"fields":{}}
✓ enctype=multipart/form-data: тело multipart с boundary — {"method":"POST","path":"/upload","query":{},"ct":"multipart/form-data","multipart":true,"fields":{}}
✓ destroy() посреди запроса: колбэки не вызваны, форма доступна
✓ после destroy() submit больше не перехватывается

Все проверки пройдены: 11/11`, { filename: "результат запуска (Chromium 141 + локальный сервер)" }),
      p("Модуль держит один `AbortController` на время жизни формы (`lifetime`) и один на текущий запрос (`inflight`); общий сигнал `AbortSignal.any([...])` отменяет запрос при `destroy()`. Признак занятости — атрибут `aria-busy` и отключённые кнопки. Серверные ошибки переводятся в `setCustomValidity`, снимаемый одноразовым слушателем `input`. Проверено мутациями: замена `formAction` роняет 7 проверок, остальные мутации — по одной."),
    ],
  },

  interview: [
    iq("js.forms-fetch.i1", "basic", "Как получить данные формы в JavaScript?", [
      ul(
        "`new FormData(form)` — набор, который отправил бы браузер; `Object.fromEntries(fd)` — простой объект (дубликаты теряются).",
        "Перехватывайте событие `submit` формы (`event.preventDefault()`), а не `click` кнопки.",
        "Неотмеченные checkbox, `disabled`-поля и поля без `name` в набор не входят.",
      ),
    ]),
    iq("js.forms-fetch.i2", "basic", "Что возвращает `fetch` при ответе `404`?", [
      ul(
        "Обещание выполняется: `response.ok === false`, `status === 404`, тело читается.",
        "Отказ (`TypeError`) — только при сетевой ошибке, блокировке CORS или отмене.",
        "Поэтому всегда проверяйте `response.ok`.",
      ),
    ]),
    iq("js.forms-fetch.i3", "intermediate", "Какой `Content-Type` ставит `fetch` для разных тел и почему нельзя задавать его для `FormData`?", [
      ul(
        "Строка — `text/plain;charset=UTF-8`; `URLSearchParams` — `application/x-www-form-urlencoded`; `Blob` — его `type`; `FormData` — `multipart/form-data; boundary=…`.",
        "Граница генерируется при формировании тела; ручной заголовок без `boundary` делает тело неразбираемым (замер: `boundary: false`).",
        "JSON: `JSON.stringify` + явный `Content-Type: application/json`.",
      ),
    ]),
    iq("js.forms-fetch.i4", "intermediate", "Чем `requestSubmit()` отличается от `submit()`?", [
      ul(
        "`requestSubmit()` проверяет ограничения и вызывает событие `submit` (с нужным `submitter`) — как клик по кнопке.",
        "`form.submit()` не проверяет форму и не вызывает `submit`, лишь отправляет (срабатывает только `formdata`).",
        "Для программной отправки с валидацией — `requestSubmit()`.",
      ),
    ]),
    iq("js.forms-fetch.i5", "intermediate", "Как показать ошибку сервера у конкретного поля?", [
      ul(
        "`field.setCustomValidity(\"Адрес уже занят\")` + `form.reportValidity()` — ошибка становится нативной: `validity.customError`, `validationMessage`, `:invalid`.",
        "Снять при вводе: `input` → `setCustomValidity(\"\")`, иначе форма не отправится повторно.",
        "Дополнительно связать сообщение с полем (`aria-describedby`/`aria-live`).",
      ),
    ]),
    iq("js.forms-fetch.i6", "advanced", "Что такое preflight и когда он нужен?", [
      ul(
        "Запрос `OPTIONS` перед «непростым» кросс-доменным запросом (метод не `GET`/`HEAD`/`POST`, нестандартные заголовки, `Content-Type: application/json`).",
        "Заголовки запроса: `Access-Control-Request-Method`, `Access-Control-Request-Headers`; ответ сервера: `Allow-Origin`, `Allow-Methods`, `Allow-Headers` (+ `Max-Age`).",
        "Без положительного ответа основной запрос не отправляется (замер: в журнале сервера только `OPTIONS`).",
      ),
    ]),
    iq("js.forms-fetch.i7", "engineering", "Как защитить форму от двойной отправки и повторных запросов?", [
      ul(
        "На клиенте: флаг занятости (`aria-busy`), отключение кнопки, игнорирование повторных `submit`, отмена предыдущего запроса через `AbortController`.",
        "На сервере: ключ идемпотентности (уникальный идентификатор операции) и ограничение повторов.",
        "Не полагаться только на клиента: пользователь может обновить страницу или отправить запрос напрямую.",
      ),
    ]),
    iq("js.forms-fetch.i8", "debugging", "В консоли «blocked by CORS policy», а на сервере запрос виден и успешен. Что происходит?", [
      ul(
        "Запрос дошёл и выполнился, но в ответе нет `Access-Control-Allow-Origin` (подходящего origin) — браузер скрыл ответ от страницы.",
        "Исправление — на сервере: добавить заголовок (и `Allow-Credentials` с точным origin для cookie); `no-cors` в клиенте даст лишь непрозрачный ответ.",
        "Для `application/json` проверьте обработку `OPTIONS` (preflight).",
      ),
    ]),
  ],

  exam: [
    mcq("js.forms-fetch.e1", "foundation", "Какое поле НЕ попадёт в `new FormData(form)`?", ["Текстовое поле с `name`", "Отмеченный checkbox с `name`", "Неотмеченный checkbox с `name`", "`textarea` с `name`"], 2, "Неотмеченные checkbox/radio в набор не входят (замер: `agree` отсутствует, `newsletter` — есть)."),
    mcq("js.forms-fetch.e2", "foundation", "Что вернёт `fetch` при ответе `500`?", ["Выполненное обещание с `ok === false`", "Отклонённое обещание", "`null`", "Исключение `HttpError`"], 0, "`fetch` отклоняется только при сетевой ошибке и отмене; статус проверяйте через `response.ok`."),
    mcq("js.forms-fetch.e3", "intermediate", "Что произойдёт при `fetch(url, { method: \"POST\", headers: { \"Content-Type\": \"multipart/form-data\" }, body: formData })`?", ["Всё будет работать", "Тело будет пустым", "`fetch` бросит исключение", "Сервер получит заголовок без `boundary` и не разберёт тело"], 3, "Ручной заголовок заменяет вычисленный; границы в нём нет (замер: `boundary: false`)."),
    mcq("js.forms-fetch.e4", "intermediate", "Что делает `form.submit()`?", ["Проверяет форму и вызывает `submit`", "Отправляет форму без проверки и без события `submit`", "То же, что `requestSubmit()`", "Сбрасывает форму"], 1, "В замере сработал только `formdata`; проверка и `submit` пропущены."),
    mcq("js.forms-fetch.e5", "intermediate", "Что верно про CORS? Выберите все.", ["Запрос без разрешающих заголовков не доходит до сервера", "Ответ скрывается от страницы, если нет `Access-Control-Allow-Origin`", "Для `application/json` кросс-доменный запрос сопровождается preflight", "`mode: \"no-cors\"` позволяет прочитать ответ"], [1, 2], "Простой запрос доходит до сервера (замер: `GET /plain`), но ответ скрыт; JSON вызывает preflight; `no-cors` даёт непрозрачный ответ."),
    mcq("js.forms-fetch.e6", "advanced", "Как правильно установить cookie в кросс-доменном запросе?", ["`credentials: \"include\"` и `Access-Control-Allow-Origin: *`", "Это невозможно", "Заголовок `Cookie` вручную", "`credentials: \"include\"`, `Access-Control-Allow-Credentials: true` и точный origin"], 3, "С `*` и `credentials: include` ответ отклоняется (замер); нужен точный origin и `Allow-Credentials`."),
    mcq("js.forms-fetch.e7", "advanced", "Почему `minlength=3` не дал ошибку для значения `ab`, записанного через `input.value = \"ab\"`?", ["Это баг", "`minlength` работает только в `textarea`", "`tooShort` проверяется только для значения, введённого пользователем", "Значение короче порога допускается"], 2, "Замер: скриптовое значение — без ошибки, введённое с клавиатуры — `tooShort: true`."),
    open("js.forms-fetch.e8", "intermediate", "Опишите, как отправить форму через `fetch` корректно: что собрать, что проверить, как обработать ответ.", [
      ul(
        "Слушать `submit`, вызвать `preventDefault()`, собрать `new FormData(form, event.submitter)`; адрес и метод взять из атрибутов формы.",
        "Не задавать `Content-Type` для `FormData`; для JSON — `JSON.stringify` и заголовок.",
        "Проверить `response.ok`; различить `422` (ошибки полей), другие статусы и сетевую ошибку.",
        "Заблокировать повторную отправку, дать `signal` для отмены, показать результат пользователю (в том числе для ассистивных технологий).",
      ),
    ], ["Названы submit, FormData и submitter", "Названа проверка response.ok", "Названа блокировка повторной отправки"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.forms-fetch.m1", "intermediate", "Чем `Object.fromEntries(new FormData(form))` опасен для группы чекбоксов с одним именем?", ["Ничем", "Остаётся только последнее значение, остальные теряются", "Появляется ошибка", "Остаётся только первое значение"], 1, "В замере `Object.fromEntries(fd).lang === \"sql\"`, хотя выбраны `js` и `sql`; нужен `getAll`."),
    mcq("js.forms-fetch.m2", "advanced", "Что вернёт `button.formAction`, если у кнопки нет атрибута `formaction`?", ["Адрес документа", "`action` формы", "Пустую строку", "`null`"], 0, "Спецификация возвращает URL документа (замер: `/page`, а не `/signup`)."),
    open("js.forms-fetch.m3", "advanced", "Форма входа через `fetch` иногда создаёт две сессии и показывает ошибки от «предыдущей» попытки. Найдите причины и предложите исправления.", [
      ul(
        "Повторная отправка (двойной клик, `Enter` и клик) — нет блокировки: добавить `aria-busy`, отключение кнопки, игнорирование `submit` во время запроса.",
        "Гонка ответов: ответ предыдущего запроса приходит позже и затирает состояние — отменять предыдущий запрос (`AbortController`) или сверять версию.",
        "На сервере — ключ идемпотентности, чтобы повторный запрос не создавал вторую сессию.",
        "Ошибки сервера (`422`) снимать при вводе, иначе форма остаётся невалидной.",
        "Тесты: двойная отправка, медленный и быстрый ответы вперемешку, `destroy()` посреди запроса.",
      ),
    ], ["Названа блокировка повторной отправки", "Названа гонка ответов и отмена", "Упомянута идемпотентность на сервере", "Описаны тесты"], { format: "debug" }),
    open("js.forms-fetch.m4", "advanced", "Спроектируйте слой работы с API для SPA: что должна уметь функция-обёртка над `fetch`?", [
      ul(
        "Базовый адрес, заголовки по умолчанию, сериализация JSON и `Content-Type` в одном месте; `FormData` и `URLSearchParams` — без ручного заголовка.",
        "Проверка `response.ok` и типизированные ошибки: `HttpError(status, payload)`, `NetworkError`, `AbortError`/`TimeoutError`.",
        "Тайм-аут и отмена через `AbortSignal.any([signal, AbortSignal.timeout(ms)])`.",
        "Чтение тела один раз; разбор по `Content-Type`; пустое тело `204`.",
        "Политика CORS и cookie (`credentials`) — единая; повтор только идемпотентных запросов.",
        "Тесты с заглушкой `fetch`: статусы, сетевые ошибки, отмена.",
      ),
    ], ["Описана проверка response.ok и типы ошибок", "Описан тайм-аут/отмена", "Описано чтение тела и Content-Type", "Описаны тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.forms-fetch.f1", front: "Что входит в FormData?", back: "Поля с name, не disabled, отмеченные checkbox/radio, выбранные option, файлы (пустой File); кнопки — только submitter." },
    { id: "js.forms-fetch.f2", front: "submit vs requestSubmit vs click?", back: "requestSubmit: проверка + submit с submitter. form.submit(): без проверки и без submit (только formdata)." },
    { id: "js.forms-fetch.f3", front: "Проверка форм?", back: "validity (valueMissing, typeMismatch…), setCustomValidity(текст) для ошибок сервера, reportValidity; minlength — только для ввода пользователя; :user-invalid." },
    { id: "js.forms-fetch.f4", front: "Content-Type в fetch?", back: "Строка — text/plain; URLSearchParams — urlencoded; FormData — multipart с boundary (не задавать вручную!); JSON — задать application/json." },
    { id: "js.forms-fetch.f5", front: "404/500 в fetch?", back: "Не отказ: ok=false. Отказ — только сеть/отмена/CORS (TypeError). Всегда проверять response.ok." },
    { id: "js.forms-fetch.f6", front: "Тело ответа?", back: "Читается один раз (bodyUsed); clone() до чтения; json() → SyntaxError при битом JSON." },
    { id: "js.forms-fetch.f7", front: "CORS в одной фразе?", back: "Запрос доходит до сервера, но ответ скрыт без Access-Control-Allow-Origin; JSON → preflight OPTIONS; cookie — credentials include + точный origin + Allow-Credentials." },
    { id: "js.forms-fetch.f8", front: "button.formAction?", back: "Без атрибута formaction возвращает URL документа, а не action формы: проверяйте hasAttribute." },
  ],

  sources: [
    { title: "HTML Standard: Forms", url: "https://html.spec.whatwg.org/multipage/forms.html", publisher: "WHATWG" },
    { title: "HTML Standard: Form submission", url: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-2", publisher: "WHATWG" },
    { title: "HTML Standard: Constraint validation", url: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraints", publisher: "WHATWG" },
    { title: "Fetch Standard", url: "https://fetch.spec.whatwg.org/", publisher: "WHATWG" },
    { title: "Fetch Standard: CORS protocol", url: "https://fetch.spec.whatwg.org/#http-cors-protocol", publisher: "WHATWG" },
    { title: "XMLHttpRequest Standard: FormData", url: "https://xhr.spec.whatwg.org/#interface-formdata", publisher: "WHATWG" },
    { title: "MDN: FormData", url: "https://developer.mozilla.org/en-US/docs/Web/API/FormData", publisher: "MDN" },
    { title: "MDN: Using the Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", publisher: "MDN" },
    { title: "MDN: Cross-Origin Resource Sharing (CORS)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS", publisher: "MDN" },
    { title: "MDN: Client-side form validation", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation", publisher: "MDN" },
    { title: "MDN: HTMLFormElement.requestSubmit()", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit", publisher: "MDN" },
    { title: "RFC 7578: Returning Values from Forms: multipart/form-data", url: "https://www.rfc-editor.org/rfc/rfc7578", publisher: "IETF" },
    { title: "RFC 2606: Reserved Top Level DNS Names", url: "https://www.rfc-editor.org/rfc/rfc2606", publisher: "IETF" },
  ],
};
