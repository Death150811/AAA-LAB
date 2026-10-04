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

export const formValidation: Topic = {
  id: "html.form-validation",
  slug: "form-validation",
  domain: "html",
  module: "forms",
  title: "Валидация форм",
  titleEn: "Form validation: constraint validation API, patterns, custom errors",
  summary:
    "Браузер умеет проверять форму без единой строки JavaScript — атрибуты `required`, `pattern`, `min`/`max` описывают ограничения, а Validity API позволяет читать и дополнять результат. Тема учит строить проверку, которая помогает пользователю, и понимать, чем она отличается от защиты на сервере.",
  minutes: 60,
  prerequisites: ["html.forms-basics", "html.input-types", "html.form-controls"],
  tags: ["validation", "required", "pattern", "minlength", "maxlength", "min", "max", "step", "novalidate", "formnovalidate", "ValidityState", "checkValidity", "reportValidity", "setCustomValidity", ":invalid", ":user-invalid", "aria-invalid", "error messages"],
  keyConcepts: [
    { term: "Constraint validation", text: "Браузер сам проверяет значения по **атрибутам-ограничениям** (`required`, `pattern`, `min`…) при отправке формы." },
    { term: "ValidityState", text: "Объект `el.validity` с булевыми флагами: `valueMissing`, `typeMismatch`, `patternMismatch`, `tooShort`, `rangeOverflow`, `customError` и др." },
    { term: "setCustomValidity", text: "Собственная ошибка: непустая строка делает поле невалидным; **пустая строка** — снимает ошибку. Забытый сброс блокирует форму навсегда." },
    { term: ":user-invalid", text: "Стилизует ошибку **после** взаимодействия пользователя; `:invalid` красит поля ещё до того, как человек что-то ввёл." },
    { term: "Клиент ≠ сервер", text: "Проверка в браузере — **удобство**; защитой данных остаётся проверка на сервере. Запрос можно собрать вручную в обход формы." },
  ],
  sections: [
    section("definition", [
      def("Constraint validation", "Механизм платформы, при котором браузер проверяет значения элементов формы на соответствие объявленным ограничениям (атрибутам и типу поля) и не отправляет форму, пока есть нарушения. Состояние проверки доступно скриптам через Constraint Validation API.", "constraint validation"),
      def("ValidityState", "Объект `element.validity` с набором булевых флагов, описывающих, **почему** значение невалидно: `valueMissing`, `typeMismatch`, `patternMismatch`, `tooLong`, `tooShort`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput`, `customError`, а также общий `valid`.", "ValidityState"),
      p("Валидация формы — это не одна функция, а **три слоя**: объявление ограничений в HTML, их применение браузером и (на ваше усмотрение) показ сообщений пользователю. Отдельный, независимый слой — проверка на сервере."),
    ]),

    section("why", [
      h("Проблема: ошибка, которую заметили слишком поздно"),
      p("Форма отправилась, страница перезагрузилась, и только теперь пользователь узнаёт, что в номере телефона не хватает цифры, — а поля при этом очищены. Чем позже обнаружена ошибка, тем дороже её исправление: потерянное время, раздражение, брошенная заявка."),
      p("Встроенная проверка сообщает о проблеме **до** отправки, указывает на конкретное поле и не требует от разработчика регулярных выражений для почты, чисел и диапазонов. Это быстрая обратная связь без сетевых запросов."),
      h("Проблема: проверка в браузере — не защита"),
      p("Любой запрос можно отправить в обход формы (`curl`, DevTools, скрипт). Поэтому клиентская проверка отвечает за **удобство**, а серверная — за **корректность и безопасность данных**. Они не заменяют друг друга: при ошибке на сервере пользователь должен получить понятное сообщение и сохранённые значения."),
      insight("Проверку нужно написать **дважды с разными целями**: на клиенте — чтобы помочь человеку исправиться быстро; на сервере — чтобы никакие данные не прошли, даже если клиент обойдён."),
    ]),

    section("mental-model", [
      p("Представьте каждое поле как **ячейку с контрольным листом**: тип и атрибуты — это пункты листа («не пусто», «похоже на почту», «не короче 8 символов»). При отправке форма «обходит» ячейки, и первая ячейка с невыполненным пунктом останавливает отправку и получает фокус. `validity` — это сам лист: можно прочитать, какие пункты не выполнены."),
      diagram(
        `
        отправка формы (нажата кнопка / Enter)
              │
              ▼
        novalidate или formnovalidate? ── да ──► событие submit (проверки нет)
              │ нет
              ▼
        для каждого поля-«кандидата» проверить ограничения
              │
        есть нарушения? ── нет ──► событие submit ──► отправка
              │ да
              ▼
        событие invalid на каждом невалидном поле (не всплывает)
              │
              ▼
        браузер показывает сообщение первому, фокусирует его; submit НЕ срабатывает
        `,
        "Как браузер проверяет форму при отправке",
      ),
      table(
        ["Ограничение", "Атрибут / тип", "Флаг в validity"],
        [
          ["Обязательность", "`required`", "`valueMissing`"],
          ["Формат типа", "`type=\"email\"`, `\"url\"`", "`typeMismatch`"],
          ["Шаблон", "`pattern`", "`patternMismatch`"],
          ["Длина", "`minlength`, `maxlength`", "`tooShort`, `tooLong`"],
          ["Диапазон", "`min`, `max`", "`rangeUnderflow`, `rangeOverflow`"],
          ["Шаг", "`step`", "`stepMismatch`"],
          ["Нераспознанный ввод", "`type=\"number\"`, `\"date\"`…", "`badInput`"],
          ["Своя ошибка", "`setCustomValidity(msg)`", "`customError`"],
        ],
        "Ограничения и их флаги",
      ),
    ]),

    section("technical", [
      h("Атрибуты-ограничения"),
      table(
        ["Атрибут", "К чему применим", "Что проверяет"],
        [
          ["`required`", "`input` (кроме `hidden`, `range`, `color`, кнопок), `select`, `textarea`", "Значение не пусто; у флажка — отмечен; у радио-группы — выбран один"],
          ["`minlength`, `maxlength`", "Текстовые `input` и `textarea`", "Длина строки (в единицах UTF-16)"],
          ["`min`, `max`", "`number`, `range`, `date`, `time`, `datetime-local`, `month`, `week`", "Диапазон значения"],
          ["`step`", "Те же, что и `min`/`max`", "Значение кратно шагу, считая от `min` (или `value`)"],
          ["`pattern`", "`text`, `search`, `tel`, `url`, `email`, `password`", "Значение целиком совпадает с регулярным выражением"],
          ["`multiple`", "`email`, `file`", "Меняет правила: список адресов / несколько файлов"],
        ],
      ),
      ul(
        "**Пустое значение** не нарушает `pattern`, `minlength`, `min` и `max`: за пустоту отвечает только `required`.",
        "**Пробелы считаются значением:** строка из одних пробелов проходит `required`. Обрезайте и проверяйте на сервере.",
        "**`pattern`** — регулярное выражение JavaScript **без** слэшей и флагов; браузер неявно добавляет якоря `^(?:…)$`, то есть совпадать должна вся строка. Некорректный шаблон просто игнорируется.",
        "**`minlength`** срабатывает только после **правки пользователем**; `maxlength` браузер не даёт превысить при вводе, а `tooLong` возможен лишь при записи значения из скрипта.",
        "**Элементы, не участвующие в проверке** («barred from constraint validation»): `disabled`, `readonly`, `type=\"hidden\"`, кнопки `button`/`reset`, потомки `datalist`. У них `willValidate === false`.",
      ),
      h("Validity API"),
      table(
        ["Член", "Что делает"],
        [
          ["`el.validity`", "Объект `ValidityState` с флагами"],
          ["`el.validationMessage`", "Локализованный текст ошибки браузера (пусто, если поле валидно или не проверяется)"],
          ["`el.willValidate`", "Проверяется ли поле вообще"],
          ["`el.checkValidity()`", "Возвращает `true`/`false`; для невалидного поля генерирует событие `invalid`; сообщение **не показывает**"],
          ["`el.reportValidity()`", "То же, что `checkValidity()`, **плюс** показывает сообщение и фокусирует поле"],
          ["`el.setCustomValidity(msg)`", "Задаёт собственную ошибку; пустая строка снимает её"],
          ["`form.checkValidity()`, `form.reportValidity()`", "То же для всей формы"],
          ["`form.noValidate`", "Свойство для атрибута `novalidate`"],
        ],
      ),
      code(
        "js",
        `
        const email = form.elements.email;

        email.validity.valueMissing;   // true, если поле пусто, а required
        email.validity.typeMismatch;   // true, если это не похоже на адрес
        email.validationMessage;       // «Введите адрес электронной почты» (зависит от браузера и языка)

        email.setCustomValidity("Этот адрес уже занят");
        email.validity.customError;    // true → поле невалидно
        email.setCustomValidity("");   // снять ошибку обязательно!
        `,
        { filename: "validity-api.js" },
      ),
      warn("Пока в `setCustomValidity` лежит **непустая строка**, поле считается невалидным — и форма не отправится, даже если пользователь уже всё исправил. Сбрасывайте ошибку `setCustomValidity(\"\")` при каждом изменении значения."),
      h("Событие `invalid`"),
      ul(
        "Возникает на каждом невалидном поле при проверке (в том числе при вызове `checkValidity()`).",
        "**Не всплывает** — слушать его на форме можно только в фазе перехвата: `form.addEventListener(\"invalid\", fn, true)`.",
        "Отмена (`preventDefault()`) подавляет встроенное всплывающее сообщение: так делают собственный показ ошибок.",
      ),
      h("CSS-псевдоклассы"),
      table(
        ["Псевдокласс", "Когда срабатывает", "Применение"],
        [
          ["`:invalid` / `:valid`", "**Сразу**, по текущему значению", "Пустое обязательное поле красное ещё до ввода — плохой UX"],
          ["`:user-invalid` / `:user-valid`", "После взаимодействия пользователя (изменил значение и ушёл, либо попытался отправить)", "Основной инструмент стилизации ошибок; поддержка в современных браузерах"],
          ["`:required` / `:optional`", "По атрибуту `required`", "Отметить обязательные поля"],
          ["`:in-range` / `:out-of-range`", "Для полей с `min`/`max`", "Подсветка выхода за диапазон"],
          ["`:placeholder-shown`", "Пока показан `placeholder`", "Старый приём «невалидно, только если не пусто»"],
        ],
      ),
      h("Сообщения браузера"),
      ul(
        "Текст сообщения и вид пузырька определяет **браузер**: он локализован, различается между браузерами и **не стилизуется** CSS.",
        "Показывается по одному и исчезает; на разных платформах по-разному озвучивается вспомогательными технологиями.",
        "Если сообщения нужны в общем стиле, показывают **свои**: отключают встроенные (`novalidate` или `preventDefault()` на `invalid`) и выводят ошибки в странице (см. подробный пример).",
      ),
      h("Доступные сообщения об ошибках"),
      ul(
        "**Идентификация ошибки (WCAG 3.3.1):** ошибка описана **текстом**, а не только цветом или иконкой.",
        "**Подсказка по исправлению (WCAG 3.3.3):** сообщение говорит, **что сделать** («Введите 6 цифр»), а не просто «Неверно».",
        "**Связь с полем:** текст ошибки привязывают `aria-describedby`; невалидному полю ставят `aria-invalid=\"true\"` (и снимают после исправления).",
        "**Фокус:** после неудачной отправки фокус переводят на первое проблемное поле или на сводку ошибок.",
        "**Профилактика (WCAG 3.3.4):** для юридических и денежных действий — подтверждение или возможность отмены.",
      ),
      h("Когда показывать ошибки"),
      ol(
        "**Не ругайте до ввода.** Пустая форма не должна быть красной.",
        "**Сначала — при уходе из поля или при отправке** («поощряйте рано, наказывайте поздно»).",
        "**Затем — при вводе:** когда ошибка уже показана, проверяйте на каждое нажатие и снимайте сообщение, как только поле стало верным.",
        "**Сложные проверки (занятость логина)** — после паузы или ухода из поля, с индикацией ожидания.",
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <form action="/register" method="post">
          <label for="email">Почта</label>
          <input id="email" name="email" type="email" autocomplete="email" required>

          <label for="login">Логин (3–20: буквы, цифры, подчёркивание)</label>
          <input id="login" name="login" required minlength="3" maxlength="20"
                 pattern="[A-Za-z0-9_]+" autocomplete="username">

          <label for="age">Возраст (18–99)</label>
          <input id="age" name="age" type="number" min="18" max="99" step="1">

          <label for="zip">Индекс</label>
          <input id="zip" name="zip" inputmode="numeric" pattern="[0-9]{6}" autocomplete="postal-code">

          <label><input type="checkbox" name="terms" required> Согласен с условиями</label>

          <button type="submit">Зарегистрироваться</button>
          <button type="submit" formnovalidate name="intent" value="draft">Сохранить черновик</button>
        </form>
        `,
        { lineNumbers: true, filename: "register.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <form id="f" novalidate>
          <label>Почта <input name="email" type="email" required></label>
          <label>Пароль <input name="pw" type="password" minlength="8" required></label>
          <button>Проверить</button>
        </form>
        <script>
          const f = document.getElementById("f");
          const flags = ["valueMissing", "typeMismatch", "tooShort", "customError"];
          f.addEventListener("submit", (e) => {
            e.preventDefault();
            for (const el of f.querySelectorAll("input")) {
              const broken = flags.filter((k) => el.validity[k]);
              console.log(el.name + ":", broken.length ? broken.join(", ") : "OK");
            }
          });
        </script>
        `,
        { runnable: true },
      ),
      p("Из-за `novalidate` браузер не блокирует отправку, поэтому событие `submit` срабатывает всегда, а мы сами читаем `validity`. Введите `abc` в почту и пять символов в пароль — в консоли появятся `typeMismatch` и `tooShort`. Уберите `novalidate`: браузер остановит отправку **сам**, и `submit` не наступит."),
    ]),

    section("detailed-example", [
      p("Регистрация с собственными сообщениями. Браузерная проверка выключена (`novalidate`), но ограничения остаются объявленными в разметке — скрипт читает их через `validity`. Ошибки показываются текстом, связаны с полями и не появляются до взаимодействия."),
      code(
        "html",
        `
        <form id="signup" action="/signup" method="post" novalidate>
          <p>
            <label for="email">Почта</label>
            <input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-err">
            <span id="email-err" class="error" hidden></span>
          </p>
          <p>
            <label for="pw">Пароль (минимум 8 символов)</label>
            <input id="pw" name="password" type="password" autocomplete="new-password" minlength="8" required aria-describedby="pw-err">
            <span id="pw-err" class="error" hidden></span>
          </p>
          <p>
            <label for="pw2">Повторите пароль</label>
            <input id="pw2" name="password2" type="password" autocomplete="new-password" required aria-describedby="pw2-err">
            <span id="pw2-err" class="error" hidden></span>
          </p>
          <button type="submit">Создать аккаунт</button>
        </form>

        <script>
          const form = document.getElementById("signup");
          const pw = document.getElementById("pw");
          const pw2 = document.getElementById("pw2");
          const fields = [...form.elements].filter((el) => el.matches("input, select, textarea"));

          function messageFor(el) {
            const v = el.validity;
            if (v.valueMissing) return "Заполните это поле";
            if (v.typeMismatch) return "Проверьте формат, например name@example.com";
            if (v.tooShort) return "Нужно минимум " + el.minLength + " символов, сейчас " + el.value.length;
            if (v.customError) return el.validationMessage;
            return "";
          }

          function checkMatch() {
            pw2.setCustomValidity(pw2.value && pw.value !== pw2.value ? "Пароли не совпадают" : "");
          }

          function show(el) {
            const err = document.getElementById(el.id + "-err");
            const msg = messageFor(el);
            err.textContent = msg;
            err.hidden = !msg;
            el.setAttribute("aria-invalid", msg ? "true" : "false");
          }

          form.addEventListener("input", () => {
            checkMatch();
            for (const el of fields) if (el.getAttribute("aria-invalid") === "true") show(el);
          });

          form.addEventListener("focusout", (e) => {
            if (e.target.matches("input, select, textarea")) { checkMatch(); show(e.target); }
          });

          form.addEventListener("submit", (e) => {
            checkMatch();
            const bad = fields.filter((el) => !el.validity.valid);
            bad.forEach(show);
            if (bad.length) { e.preventDefault(); bad[0].focus(); }
          });
        </script>
        `,
        { lineNumbers: true, filename: "signup.html", collapsed: true },
      ),
    ]),

    section("analysis", [
      annotated(
        "js",
        `
        const el = form.elements.login;
        el.validity.patternMismatch;
        el.checkValidity();
        el.reportValidity();
        el.setCustomValidity("Логин занят");
        el.setCustomValidity("");
        `,
        [
          { line: 1, text: "`form.elements.login` — доступ к полю по `name`. Работает для `input`, `select`, `textarea`, `button`." },
          { line: 2, text: "Флаг показывает **причину**: `true`, когда значение не соответствует `pattern`. Полезно для выбора понятного сообщения." },
          { line: 3, text: "Возвращает булево значение и генерирует `invalid`, если поле невалидно. Ничего не показывает и не двигает фокус — подходит для тихих проверок (например, включить кнопку)." },
          { line: 4, text: "То же плюс видимое сообщение и фокус на поле. Вызывайте в ответ на действие пользователя, иначе внезапный пузырь запутает." },
          { line: 5, text: "Любая непустая строка превращает поле в невалидное (`customError`) и становится его `validationMessage`." },
          { line: 6, text: "Пустая строка **обязательна**, когда причина ошибки устранена; иначе поле останется невалидным навсегда." },
        ],
        "validity-calls.js",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Запрос отправки", "Нажатие кнопки `submit`, Enter в поле или `form.requestSubmit()` запускают алгоритм отправки. Вызов `form.submit()` его **пропускает**: проверки и события `submit` не будет."],
          ["Решение о проверке", "Если у формы есть `novalidate` или у нажатой кнопки — `formnovalidate`, интерактивная проверка не выполняется."],
          ["Статическая проверка", "Для каждого элемента-кандидата вычисляются ограничения. Элементы `disabled`, `readonly`, `hidden`, кнопки `button`/`reset` и потомки `datalist` пропускаются."],
          ["События invalid", "На каждом невалидном элементе срабатывает отменяемое событие `invalid`, **не всплывающее** вверх по дереву."],
          ["Показ ошибки", "Если событие не отменено, браузер показывает сообщение для **первого** невалидного поля и фокусирует его. Событие `submit` в этом случае не возникает."],
          ["Отправка", "Только когда все поля валидны, срабатывает `submit`; затем формируется набор данных и выполняется запрос."],
        ],
        "От нажатия кнопки до отправки",
      ),
      note("Если невалидное поле скрыто (`display: none`) или находится в свёрнутом блоке, браузер **не может его сфокусировать** и молча отменяет отправку; в консоли будет сообщение вроде «An invalid form control is not focusable». Не помечайте скрытые поля как `required` или отключайте их, пока они скрыты."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Считать клиентскую проверку защитой"),
      p("`required`, `pattern` и `maxlength` обходятся запросом без формы. Сервер обязан проверять **всё**: типы, диапазоны, длины, обязательность и права. На клиенте проверка лишь экономит время пользователя."),
      h("Ошибка 2. Забыть сбросить `setCustomValidity`"),
      wrongRight(
        "js",
        {
          code: `
            pw2.addEventListener("input", () => {
              if (pw2.value !== pw.value) {
                pw2.setCustomValidity("Пароли не совпадают");
              }
            });
          `,
          note: "Ошибка устанавливается, но никогда не снимается: даже после исправления поле остаётся невалидным.",
        },
        {
          code: `
            pw2.addEventListener("input", () => {
              pw2.setCustomValidity(
                pw2.value !== pw.value ? "Пароли не совпадают" : ""
              );
            });
          `,
          note: "Каждый раз вычисляем состояние заново: непустое сообщение — ошибка, пустое — валидно.",
        },
      ),
      h("Ошибка 3. Ошибочный `pattern`"),
      ul(
        "Слэши и флаги не нужны: `pattern=\"[0-9]{6}\"`, а не `/[0-9]{6}/`.",
        "Шаблон **уже якорный**: писать `^…$` не требуется.",
        "Современные браузеры компилируют шаблон в режиме Unicode-наборов (флаг `v`): внутри `[...]` символы `( ) [ ] { } / - | \\` нужно экранировать (например, `[0-9\\-]`, а не `[0-9-]`). Неверный шаблон **молча игнорируется**, и проверка перестаёт работать.",
        "Не усложняйте: сложные регулярные выражения для почты и имён отсекают корректные данные.",
      ),
      h("Ошибка 4. Красные поля до ввода"),
      wrongRight(
        "css",
        {
          code: `
            input:invalid { border-color: crimson; }
          `,
          note: "Обязательное пустое поле красное сразу при загрузке: человек ещё ничего не успел сделать.",
        },
        {
          code: `
            input:user-invalid { border-color: crimson; }
          `,
          note: "Ошибка появляется после взаимодействия или попытки отправки. Для запасного варианта используйте классы, выставляемые скриптом.",
        },
      ),
      h("Ошибка 5. Скрытое обязательное поле"),
      p("`display: none` у поля с `required` делает отправку невозможной: браузер не сфокусирует невидимое поле и просто ничего не отправит. Условные блоки формы отключайте (`disabled` на `fieldset`) или убирайте `required`, пока блок скрыт."),
      h("Ошибка 6. `form.submit()` вместо `requestSubmit()`"),
      p("`submit()` пропускает встроенную проверку и событие `submit`. Если вы хотите программно «нажать» кнопку отправки, используйте `requestSubmit()` — он запускает проверку и обработчики."),
      h("Ошибка 7. Неинформативные сообщения"),
      p("«Ошибка» или «Неверное значение» не помогают. Сообщение отвечает на два вопроса: **что не так** и **как исправить** («Введите 6 цифр индекса»)."),
      h("Ошибка 8. Только цвет"),
      p("Красная рамка без текста недоступна людям с нарушением цветовосприятия и пользователям скринридеров (WCAG 3.3.1, 1.4.1). Добавляйте текст и связывайте его с полем."),
    ]),

    section("antipatterns", [
      ul(
        "**«Проверим только на клиенте».** Любые данные из формы — недоверенные.",
        "**Блокировка кнопки отправки до идеально заполненной формы:** пользователь не понимает, почему кнопка не работает. Лучше оставить её активной и объяснить ошибки.",
        "**Валидация при каждом нажатии клавиши с первой буквы:** «Неверный формат почты» после ввода буквы `a`.",
        "**Всплывающие алерты (`alert`) со списком ошибок.**",
        "**Регулярка «на все случаи» для почты или телефона** — она неизбежно отсечёт валидные адреса (`+`, новые домены, международные номера). Для почты — `type=\"email\"` и подтверждающее письмо.",
        "**Обрезание ввода `maxlength` без предупреждения** — пользователь не замечает, что текст урезан.",
        "**Очистка формы после ошибки сервера:** теряются введённые данные (кроме паролей).",
        "**Подсказка формата только в `title`** — она не видна на сенсорных устройствах и плохо озвучивается. Пишите видимую подсказку и связывайте через `aria-describedby`.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Объявляйте ограничения в HTML** (`required`, `type`, `min`/`max`, `pattern`) — это лучшая основа: работает без JS и читается инструментами.",
        "**Всегда дублируйте проверки на сервере** и возвращайте понятные ошибки по полям с сохранением введённых значений.",
        "**Показывайте ошибки текстом рядом с полем,** связывайте через `aria-describedby`, ставьте `aria-invalid` после проверки.",
        "**После неудачной отправки переводите фокус** на первое проблемное поле или сводку ошибок со ссылками на поля.",
        "**Стилизуйте через `:user-invalid`**, а не `:invalid`, и не полагайтесь только на цвет.",
        "**Сообщение = что не так + как исправить.** Говорите на языке пользователя.",
        "**Для сравнения полей** (пароль/повтор, диапазон дат) используйте `setCustomValidity` — тогда работает и встроенная блокировка отправки.",
        "**Не усложняйте `pattern`.** Для сложных форматов — нормализация на сервере или подсказки.",
        "**Подсказки формата показывайте заранее,** до ошибки; не заставляйте угадывать.",
        "**Тестируйте с клавиатуры и скринридером:** Tab, Enter, объявление ошибок.",
      ),
    ]),

    section("edge-cases", [
      h("Пробелы проходят `required`"),
      p("Значение «   » не пусто для браузера, значит `valueMissing` будет `false`. Если пробелы недопустимы, добавьте `pattern`, обрезайте значение в скрипте и обязательно проверяйте на сервере."),
      h("Флажки и радио"),
      p("`required` на флажке требует **именно его** отметки. Для группы флажков «выберите хотя бы один» в HTML нет решения — нужен скрипт (`setCustomValidity` на одном из них). Для радио достаточно `required` на одной кнопке группы."),
      h("`step` отсчитывается от `min`"),
      p("`min=\"0.5\" step=\"1\"` допускает 0.5, 1.5, 2.5… Если `min` не задан, база — атрибут `value` (или ноль). Нарушение даёт `stepMismatch`, а браузер подсказывает ближайшие допустимые значения."),
      h("`badInput` и пустое значение"),
      p("Если в `number` введено «abc», `input.value` — пустая строка, но `validity.badInput` равен `true`. При `required` же при этом `valueMissing` может быть `false`: различайте эти случаи."),
      h("`novalidate` и API"),
      p("`novalidate` отключает только **автоматическую** проверку при отправке. Методы `checkValidity()`, `reportValidity()` и свойства `validity` продолжают работать — на этом основан подход «свои сообщения поверх нативной логики»."),
      h("Автозаполнение"),
      p("Браузер заполняет поля без события `input` в некоторых случаях; проверьте, что ваш код реагирует и на `change`, и при отправке повторно вычисляет состояние."),
      h("Асинхронная проверка"),
      p("Занятость логина выясняется на сервере. Ответы могут прийти **не по порядку**: учитывайте номер запроса или отменяйте предыдущий (`AbortController`), используйте паузу (debounce) и всё равно повторно проверяйте при отправке: между проверкой и отправкой логин мог занять кто-то другой."),
      h("`pattern` и юникод"),
      p("`[A-Za-z]` не пропустит кириллицу и диакритику. Для имён лучше не ограничивать алфавит (имена бывают разными) или использовать классы Unicode (`\\p{L}`) там, где это оправданно."),
      h("Вычисление в разных браузерах"),
      p("Тексты сообщений и некоторые тонкости (например, как обрезаются пробелы в `email`, когда показывается пузырёк) различаются — не завязывайте логику на точный текст `validationMessage`; опирайтесь на флаги `validity`."),
    ]),

    section("related", [
      ul(
        "[Формы: отправка данных](/learn/html/forms-basics) — `submit`, `requestSubmit()`, набор данных формы.",
        "[Типы полей ввода](/learn/html/input-types) — `email`, `number`, `date` и их встроенные проверки.",
        "[Элементы управления](/learn/html/form-controls) — `required` у `select`, метки, группы.",
        "[Автозаполнение и UX форм](/learn/html/form-ux-autocomplete) — подсказки, ошибки, мобильные клавиатуры.",
        "[Доступные формы](/learn/html/accessible-forms) — сообщения об ошибках, `aria-invalid`, сводка ошибок.",
        "Из других курсов: **JS** — события, `FormData`, `fetch`, `AbortController`; **CSS** — `:user-invalid`, `:has()`; **Безопасность** — серверная валидация и санитизация.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Проверка вручную",
          code: `
            <input id="mail" placeholder="Почта">
            <button onclick="
              if (!/^[a-z0-9]+@[a-z]+\\.[a-z]+$/.test(mail.value)) {
                alert('Ошибка');
              } else { send(); }
            ">Отправить</button>
          `,
          note: "Самодельная регулярка отсекает реальные адреса, `alert` не помогает исправить, нет `label`, без JS ничего не проверяется.",
        },
        {
          title: "Проверка платформой",
          code: `
            <label for="mail">Почта</label>
            <input id="mail" name="email" type="email" required
                   autocomplete="email" aria-describedby="mail-hint">
            <p id="mail-hint">Например, name@example.com</p>
            <button type="submit">Отправить</button>
          `,
          note: "Платформенная проверка формата и обязательности, видимая подсказка и метка; свои сообщения можно добавить поверх, сохранив нативную логику.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.form-validation.ex1",
      title: "Какие флаги сработают?",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждого случая назовите, будет ли поле валидным, и какие флаги `validity` станут `true`. Считайте, что значение введено пользователем."),
        ol(
          "`<input type=\"email\" required>` — поле пусто.",
          "`<input type=\"email\">` — введено `abc`.",
          "`<input minlength=\"8\">` — введено `1234`.",
          "`<input pattern=\"[0-9]{6}\">` — введено `1234567`.",
          "`<input pattern=\"[0-9]{6}\">` — поле пусто.",
          "`<input type=\"number\" min=\"1\" max=\"10\">` — введено `11`.",
          "`<input type=\"number\" step=\"2\">` — введено `3`.",
          "`<input required>` — введено три пробела.",
        ),
      ],
      hints: ["Пустое значение нарушает только `required`.", "`pattern` проверяет значение целиком.", "Что считается значением: пробелы?"],
      checks: ["Для каждого случая указан флаг", "Различены пустое и неверное", "Учтены пробелы"],
      solution: [
        ol(
          "Невалидно: `valueMissing`.",
          "Невалидно: `typeMismatch`.",
          "Невалидно: `tooShort` (4 < 8) — флаг срабатывает после правки пользователем.",
          "Невалидно: `patternMismatch` (шаблон должен совпадать со всей строкой, 7 цифр — не 6).",
          "**Валидно**: пустое значение `pattern` не нарушает (нужен `required`).",
          "Невалидно: `rangeOverflow`.",
          "Невалидно: `stepMismatch` (3 не кратно 2 от нуля).",
          "**Валидно**: пробелы — значение, `valueMissing` = `false`. Проверку на пробелы выполняют скрипт и сервер.",
        ),
      ],
    }),
    exercise({
      id: "html.form-validation.ex2",
      title: "Форма с кросс-проверкой",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сделайте форму бронирования: даты «Заезд» и «Выезд» (выезд позже заезда, не раньше сегодня), число гостей 1–6, индекс (6 цифр) и согласие. Нативные атрибуты — где возможно; сравнение двух дат — через `setCustomValidity`. Собственные сообщения на русском; ошибки показывать только после взаимодействия."),
      ],
      hints: ["Что делает `min` у «Выезд», если заезд выбран?", "Когда надо снимать `customError`?", "`:user-invalid` или `:invalid`?"],
      checks: ["`required`, `min`, `max`, `pattern` объявлены в HTML", "Кросс-проверка снимает ошибку пустой строкой", "Сообщение говорит, как исправить", "Стили через `:user-invalid`"],
      solution: [
        code(
          "html",
          `
          <form id="book" action="/book" method="post">
            <label for="in">Заезд</label>
            <input id="in" name="checkin" type="date" required>
            <label for="out">Выезд</label>
            <input id="out" name="checkout" type="date" required>
            <label for="guests">Гостей (1–6)</label>
            <input id="guests" name="guests" type="number" min="1" max="6" value="1" required>
            <label for="zip">Индекс</label>
            <input id="zip" name="zip" inputmode="numeric" pattern="[0-9]{6}" autocomplete="postal-code" required>
            <label><input type="checkbox" name="agree" required> Согласен с правилами</label>
            <button type="submit">Забронировать</button>
          </form>

          <style>
            input:user-invalid { border-color: crimson; }
          </style>

          <script>
            const inEl = document.getElementById("in");
            const outEl = document.getElementById("out");
            inEl.min = new Date().toISOString().slice(0, 10);

            function check() {
              if (inEl.value) outEl.min = inEl.value;
              const bad = inEl.value && outEl.value && outEl.value <= inEl.value;
              outEl.setCustomValidity(bad ? "Выезд должен быть позже заезда" : "");
            }
            inEl.addEventListener("input", check);
            outEl.addEventListener("input", check);
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        note("Строки ISO-дат `ГГГГ-ММ-ДД` корректно сравниваются как строки. Минимальная дата считается на клиенте при загрузке (или сервером) — статичное значение в разметке устареет. Пояс: `toISOString()` использует UTC, поэтому «сегодня» может отличаться от локальной даты; для точности вычисляйте локальную дату."),
      ],
    }),
    exercise({
      id: "html.form-validation.ex3",
      title: "Форма, которая не отправляется",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Жалобы: «форма иногда вообще не отправляется, и ничего не происходит», «после исправления пароля повтор всё равно красный», «в поле индекса никакого контроля, хотя pattern есть», «при загрузке все поля красные». Найдите причины и исправьте."),
      ],
      starter: {
        lang: "html",
        code: `
          <form action="/save" method="post">
            <div id="company" style="display:none">
              <input name="company" required>
            </div>
            <input id="pw" name="pw" type="password">
            <input id="pw2" name="pw2" type="password">
            <input name="zip" pattern="/[0-9]{6}/">
            <button>Сохранить</button>
          </form>
          <style>input:invalid { border: 2px solid red; }</style>
          <script>
            pw2.addEventListener("input", () => {
              if (pw.value !== pw2.value) pw2.setCustomValidity("Не совпадают");
            });
          </script>
        `,
      },
      hints: ["Что делает браузер с невалидным скрытым полем?", "Где снимается `customError`?", "Нужны ли слэши в `pattern`?", "Чем отличается `:user-invalid`?"],
      checks: ["Скрытое `required` убрано/отключено", "`setCustomValidity(\"\")` вызывается", "`pattern` без слэшей", "`:user-invalid` вместо `:invalid`"],
      solution: [
        ul(
          "**Скрытое обязательное поле** (`display:none` + `required`) невозможно сфокусировать — браузер молча отменяет отправку. Отключить блок (`fieldset disabled`/`disabled` у поля) или не ставить `required`, пока он скрыт.",
          "**`customError` не снимается:** после исправления пароля сообщение остаётся. Нужно `setCustomValidity(\"\")` в ветке «совпадают».",
          "**`pattern=\"/[0-9]{6}/\"`** — слэши считаются частью шаблона, шаблон не совпадёт с цифрами; пишется `pattern=\"[0-9]{6}\"`.",
          "**`:invalid`** красит поля до ввода; нужен `:user-invalid`.",
        ),
        code(
          "html",
          `
          <form action="/save" method="post">
            <fieldset id="company" disabled hidden>
              <label for="co">Компания</label>
              <input id="co" name="company" required>
            </fieldset>
            <label for="pw">Пароль</label>
            <input id="pw" name="pw" type="password" autocomplete="new-password">
            <label for="pw2">Повтор</label>
            <input id="pw2" name="pw2" type="password" autocomplete="new-password">
            <label for="zip">Индекс</label>
            <input id="zip" name="zip" inputmode="numeric" pattern="[0-9]{6}">
            <button type="submit">Сохранить</button>
          </form>
          <style>input:user-invalid { border: 2px solid red; }</style>
          <script>
            const pw = document.getElementById("pw");
            const pw2 = document.getElementById("pw2");
            pw2.addEventListener("input", () => {
              pw2.setCustomValidity(pw.value !== pw2.value ? "Пароли не совпадают" : "");
            });
          </script>
          `,
          { lineNumbers: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.form-validation.challenge",
    title: "Регистрация: доступная проверка, сводка ошибок и проверка логина на сервере",
    scenario: [
      p("Сервис просит клиентскую и серверную проверку регистрации: почта, логин (3–20 символов, латиница/цифры/подчёркивание, уникальный), пароль (минимум 10 символов) и повтор. Пользователи скринридеров жалуются, что сообщения «мелькают» и не озвучиваются, а логин «занят» показывается с опозданием и иногда ошибочно."),
      p("Нужно реализовать проверку с понятными сообщениями, сводкой ошибок над формой, переводом фокуса и безопасной асинхронной проверкой логина без гонок. Сервер должен быть источником истины."),
    ],
    requirements: [
      "Ограничения объявлены в HTML; `novalidate` включён, сообщения — собственные",
      "Сводка ошибок со ссылками на поля и фокус на ней после неудачной отправки",
      "`aria-invalid` и `aria-describedby` для каждого поля",
      "Асинхронная проверка логина с защитой от устаревших ответов и повторной проверкой при отправке",
      "Описать серверную проверку и формат ответа об ошибках",
    ],
    constraints: [
      "Не использовать `alert`; не показывать ошибки до взаимодействия",
      "Не блокировать вставку в поля пароля",
      "Работать без `:user-invalid`-зависимости (запасной вариант с классами)",
    ],
    acceptance: [
      "После отправки с ошибками фокус на сводке, ссылки ведут к полям",
      "Сообщение содержит «что не так» и «как исправить»",
      "Ответ на более старый запрос логина не перезаписывает более новый",
      "Сервер отвечает 422 с ошибками по полям; форма сохраняет значения (кроме паролей)",
    ],
    hints: [
      "Как сопоставить ответ запросу?",
      "Что делать, если логин проверен, но потом изменён?",
      "Как связать сводку с полями?",
    ],
    solution: [
      code(
        "html",
        `
        <form id="reg" action="/register" method="post" novalidate>
          <div id="summary" tabindex="-1" role="alert" hidden>
            <h2>Исправьте ошибки в форме</h2>
            <ul id="summary-list"></ul>
          </div>

          <p>
            <label for="login">Логин (3–20: латиница, цифры, _)</label>
            <input id="login" name="login" required minlength="3" maxlength="20"
                   pattern="[A-Za-z0-9_]+" autocomplete="username" aria-describedby="login-err">
            <span id="login-err" class="error" hidden></span>
          </p>
          <p>
            <label for="pw">Пароль (минимум 10 символов)</label>
            <input id="pw" name="password" type="password" required minlength="10"
                   autocomplete="new-password" aria-describedby="pw-err">
            <span id="pw-err" class="error" hidden></span>
          </p>
          <button type="submit">Создать аккаунт</button>
        </form>

        <script>
          const form = document.getElementById("reg");
          const login = document.getElementById("login");
          const summary = document.getElementById("summary");
          const list = document.getElementById("summary-list");
          let seq = 0;          // номер последнего запроса проверки логина
          let taken = null;     // результат последней актуальной проверки

          function msg(el) {
            const v = el.validity;
            if (v.valueMissing) return "Заполните это поле";
            if (v.tooShort) return "Минимум " + el.minLength + " символов, сейчас " + el.value.length;
            if (v.patternMismatch) return "Используйте латиницу, цифры и знак подчёркивания";
            if (v.customError) return el.validationMessage;
            return "";
          }

          function show(el) {
            const err = document.getElementById(el.id + "-err");
            const m = msg(el);
            err.textContent = m;
            err.hidden = !m;
            el.setAttribute("aria-invalid", m ? "true" : "false");
            return m;
          }

          async function checkLogin() {
            const value = login.value;
            const id = ++seq;                       // метим запрос
            login.setCustomValidity("");
            if (!login.validity.valid) return;      // сначала локальные правила
            let available = true;
            try {
              const res = await fetch("/api/login-available?login=" + encodeURIComponent(value));
              ({ available } = await res.json());
            } catch {
              return;                               // сеть недоступна: решит сервер при отправке
            }
            if (id !== seq) return;                 // пришёл устаревший ответ
            taken = !available;
            login.setCustomValidity(taken ? "Логин занят, выберите другой" : "");
            if (login.getAttribute("aria-invalid") === "true" || taken) show(login);
          }

          let timer;
          login.addEventListener("input", () => {
            clearTimeout(timer);
            login.setCustomValidity("");
            timer = setTimeout(checkLogin, 400);    // пауза после ввода
          });

          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await checkLogin();                      // повторная проверка при отправке
            const bad = [...form.elements].filter((el) => el.matches("input") && !el.validity.valid);
            list.replaceChildren();
            for (const el of bad) {
              show(el);
              const li = document.createElement("li");
              const a = document.createElement("a");
              a.href = "#" + el.id;
              a.textContent = document.querySelector("label[for=" + el.id + "]").textContent + ": " + msg(el);
              li.append(a);
              list.append(li);
            }
            summary.hidden = bad.length === 0;
            if (bad.length) { summary.focus(); return; }
            form.submit();                           // данные корректны (сервер всё равно проверит)
          });
        </script>
        `,
        { lineNumbers: true, collapsed: true },
      ),
      ul(
        "**Гонки:** каждый запрос получает номер `id`; ответ применяется, только если `id === seq`. Можно дополнительно отменять предыдущий запрос через `AbortController`.",
        "**Повторная проверка при отправке:** между проверкой и отправкой логин мог занять другой пользователь; окончательный ответ даёт сервер.",
        "**Сводка ошибок:** блок с `tabindex=\"-1\"` получает фокус программно; ссылки `#id` ведут к полям; сообщения связаны с полями через `aria-describedby`.",
        "**Сервер:** повторяет все правила; нарушение уникальности защищено ограничением в базе (`UNIQUE`); при ошибке отвечает `422 Unprocessable Content` (или `400`) с телом вида `{ errors: { login: \"Логин занят\" } }`; форма отображается заново с сохранёнными значениями (кроме паролей), фокус — на сводке.",
        "**Запасной вариант без JS:** форма отправляется обычным способом; сервер возвращает страницу с ошибками. `novalidate` без скрипта означал бы отсутствие клиентской проверки — допустимо для прогрессивного улучшения, но можно добавлять `novalidate` скриптом при загрузке.",
      ),
    ],
  },

  interview: [
    iq("html.form-validation.i1", "basic", "Какие атрибуты HTML позволяют проверять форму без JavaScript?", [
      p("`required`, `minlength`/`maxlength`, `min`/`max`/`step`, `pattern`, а также `type` (`email`, `url`, `number`, `date`…). Браузер сам проверяет значения при отправке и показывает сообщение для первого нарушения."),
    ]),
    iq("html.form-validation.i2", "basic", "Достаточно ли клиентской валидации?", [
      p("Нет. Запрос можно отправить в обход формы, поэтому сервер обязан проверять всё. Клиентская проверка — для удобства пользователя, серверная — для корректности и безопасности данных."),
    ]),
    iq("html.form-validation.i3", "intermediate", "Чем отличаются `checkValidity()` и `reportValidity()`?", [
      ul(
        "Оба возвращают булево значение и генерируют событие `invalid` для невалидных полей.",
        "`reportValidity()` ещё показывает сообщение браузера и фокусирует поле; `checkValidity()` делает это «тихо».",
        "Первый подходит для проверки состояния (включить кнопку), второй — для реакции на действие пользователя.",
      ),
    ]),
    iq("html.form-validation.i4", "intermediate", "Как реализовать проверку «пароль и повтор совпадают»?", [
      p("HTML этого не умеет. На поле повтора вызывают `setCustomValidity` с сообщением, если значения различаются, и с пустой строкой — если совпадают, на событиях `input` обоих полей. Тогда работает встроенная блокировка отправки и `:user-invalid`. Сервер проверяет совпадение повторно."),
    ]),
    iq("html.form-validation.i5", "intermediate", "Почему событие `invalid` нельзя поймать на форме обычным способом?", [
      p("Оно не всплывает. Поймать его на форме можно только в фазе перехвата (`addEventListener(\"invalid\", fn, true)`) либо повесив обработчик на каждое поле."),
    ]),
    iq("html.form-validation.i6", "advanced", "Чем `:user-invalid` лучше `:invalid`?", [
      p("`:invalid` срабатывает сразу: пустые обязательные поля красные при загрузке страницы. `:user-invalid` включается только после взаимодействия пользователя (или попытки отправить форму), поэтому не «ругает» человека до ввода. Поддержка — в современных браузерах; для остальных используют классы, которые ставит скрипт."),
    ]),
    iq("html.form-validation.i7", "engineering", "Как построить доступные сообщения об ошибках формы?", [
      ul(
        "Отключить встроенные пузырьки (`novalidate`) и показывать ошибки **текстом** рядом с полем.",
        "Связать текст с полем через `aria-describedby`, выставить `aria-invalid=\"true\"` после проверки.",
        "После неудачной отправки перевести фокус на сводку ошибок (со ссылками на поля) или на первое поле с ошибкой.",
        "Сообщения должны объяснять, что исправить; не использовать только цвет.",
        "Не проверять «по буквам» до первого ухода из поля; после появления ошибки — снимать её сразу при исправлении.",
      ),
    ]),
    iq("html.form-validation.i8", "debugging", "Форма не отправляется, ошибок на экране нет. С чего начать диагностику?", [
      ul(
        "Открыть консоль: сообщение «An invalid form control … is not focusable» указывает на скрытое поле с `required`/`pattern`.",
        "В консоли проверить `form.checkValidity()` и по `form.elements` найти поле с `!validity.valid`.",
        "Проверить забытый `setCustomValidity(\"…\")` без сброса.",
        "Убедиться, что `pattern` корректен (без слэшей, с экранированием в классах).",
        "Проверить, что кнопка `type=\"submit\"`, а не `button`, и нет обработчика с `preventDefault()`.",
      ),
    ]),
  ],

  exam: [
    mcq("html.form-validation.e1", "foundation", "Какой атрибут делает поле обязательным?", ["`mandatory`", "`required`", "`needed`", "`validate`"], 1, "`required` объявляет ограничение: пустое значение нарушает его (`valueMissing`)."),
    mcq("html.form-validation.e2", "foundation", "Что нужно сделать, чтобы снять ошибку, заданную `setCustomValidity(\"Занято\")`?", ["`setCustomValidity(null)`", "`setCustomValidity(\"\")`", "Перезагрузить страницу", "`removeCustomValidity()`"], 1, "Пустая строка снимает ошибку; непустое сообщение сохраняет невалидность."),
    mcq("html.form-validation.e3", "intermediate", "Поле `<input pattern=\"[0-9]{6}\">` пусто. Оно валидно?", ["Нет, не совпадает с шаблоном", "Да: пустое значение `pattern` не нарушает", "Только если есть `required`", "Зависит от браузера"], 1, "Пустое значение нарушает только `required`; остальные ограничения применяются к непустым значениям."),
    mcq("html.form-validation.e4", "intermediate", "Что делает `form.submit()` по отношению к встроенной проверке?", ["Выполняет её", "Пропускает её", "Выполняет только `required`", "Выполняет и вызывает `invalid`"], 1, "`submit()` не запускает проверку и событие `submit`; для проверки используйте `requestSubmit()`."),
    mcq("html.form-validation.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`novalidate` отключает и методы `checkValidity()`", "`invalid` не всплывает", "`disabled` поля не участвуют в проверке", "`:invalid` срабатывает только после ввода"], [1, 2], "`novalidate` отключает лишь автоматическую проверку при отправке; `:invalid` работает сразу."),
    mcq("html.form-validation.e6", "advanced", "Почему `pattern=\"[0-9-]+\"` может не работать в современных браузерах?", ["Нельзя использовать дефис", "Шаблон компилируется с флагом `v`, где `-` внутри класса нужно экранировать", "`pattern` требует слэшей", "Шаблон работает только с буквами"], 1, "В режиме Unicode-наборов неэкранированные служебные символы в классе делают шаблон ошибочным, и он молча игнорируется; нужно `[0-9\\-]+`."),
    open("html.form-validation.e7", "intermediate", "Объясните, почему клиентской валидации недостаточно, и что должен делать сервер.", [
      p("Клиентский код выполняется в среде пользователя и полностью им управляется: форму можно обойти запросом вручную или изменить в DevTools."),
      ul(
        "Сервер проверяет **все** правила: типы, диапазоны, длину, обязательность, права, уникальность.",
        "Возвращает ошибки по полям (`422`), сохраняя введённые значения.",
        "Использует ограничения БД (`UNIQUE`, `CHECK`) как последний рубеж.",
        "Клиентская проверка остаётся улучшением UX, а не защитой.",
      ),
    ], ["Названо, что клиент можно обойти", "Названы серверные проверки", "Указана роль клиентской проверки как UX"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.form-validation.m1", "advanced", "Что произойдёт при отправке, если невалидное обязательное поле скрыто через `display: none`?", ["Браузер покажет сообщение рядом с полем", "Отправка будет отменена без видимой ошибки", "Поле будет проигнорировано", "Форма отправится"], 1, "Невидимое поле нельзя сфокусировать, поэтому браузер молча прерывает отправку (в консоли — сообщение о нефокусируемом поле)."),
    mcq("html.form-validation.m2", "advanced", "Как корректно вывести ошибки для скринридера?", ["Только красная рамка", "Текст ошибки, связанный через `aria-describedby`, `aria-invalid=\"true\"` и перевод фокуса", "`alert()`", "Только `title`"], 1, "Текст, связь с полем, состояние и управление фокусом — минимальный набор доступных сообщений."),
    mcq("html.form-validation.m3", "advanced", "Пользователь вводит логин, ответы сервера приходят не по порядку. Как избежать показа устаревшего результата?", ["Игнорировать ответы", "Помечать запросы номером и применять только последний (либо отменять предыдущие)", "Отключить ввод до ответа", "Использовать `alert`"], 1, "Сопоставление ответа с последним запросом (или `AbortController`) устраняет гонку."),
    open("html.form-validation.m4", "advanced", "Команда перенесла проверку полностью в JS: `novalidate` везде, свои сообщения, но атрибутов `required`/`type` в разметке больше нет. Какие минусы вы увидите и что предложите?", [
      ul(
        "Теряется декларативная основа: без JS проверки нет, инструменты и ассистивные технологии не видят ограничений (например, обязательность).",
        "Дублирование правил в JS и на сервере без единого источника.",
        "Сложнее поддерживать: каждое правило надо вручную связывать с полем и ошибкой.",
      ),
      p("Предложение: вернуть атрибуты (`required`, `type`, `minlength`, `pattern`) как основу, отключить только показ браузерных сообщений (`novalidate`), читать `validity` и показывать свои сообщения; правила на сервере держать в одной схеме."),
    ], ["Названы потеря декларативности и доступности", "Названо дублирование правил", "Предложен гибрид: атрибуты + собственные сообщения"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.form-validation.f1", front: "Что нарушает пустое значение?", back: "Только `required` (`valueMissing`). `pattern`, `minlength`, `min`/`max` к пустому не применяются." },
    { id: "html.form-validation.f2", front: "checkValidity vs reportValidity?", back: "Оба возвращают булево и вызывают `invalid`; `reportValidity` ещё показывает сообщение и фокусирует поле." },
    { id: "html.form-validation.f3", front: "Как снять custom-ошибку?", back: "`setCustomValidity(\"\")` — пустая строка. Иначе поле невалидно навсегда." },
    { id: "html.form-validation.f4", front: "`:invalid` vs `:user-invalid`?", back: "`:invalid` — сразу; `:user-invalid` — после взаимодействия или попытки отправки." },
    { id: "html.form-validation.f5", front: "`submit()` vs `requestSubmit()`?", back: "`submit()` пропускает проверку и событие submit; `requestSubmit()` запускает их." },
    { id: "html.form-validation.f6", front: "Событие `invalid`?", back: "Генерируется на невалидном поле, отменяемое, **не всплывает**." },
  ],

  sources: [
    { title: "HTML Living Standard — Constraint validation", url: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraint-validation", publisher: "WHATWG" },
    { title: "HTML Living Standard — The pattern attribute", url: "https://html.spec.whatwg.org/multipage/input.html#the-pattern-attribute", publisher: "WHATWG" },
    { title: "MDN: ValidityState", url: "https://developer.mozilla.org/en-US/docs/Web/API/ValidityState", publisher: "MDN" },
    { title: "MDN: HTMLInputElement.setCustomValidity()", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setCustomValidity", publisher: "MDN" },
    { title: "MDN: :user-invalid", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid", publisher: "MDN" },
    { title: "W3C WAI: Form validation tutorial", url: "https://www.w3.org/WAI/tutorials/forms/validation/", publisher: "W3C" },
    { title: "Understanding SC 3.3.1: Error Identification", url: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html", publisher: "W3C" },
  ],
};
