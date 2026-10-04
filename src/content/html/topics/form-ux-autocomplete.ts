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

export const formUxAutocomplete: Topic = {
  id: "html.form-ux-autocomplete",
  slug: "form-ux-autocomplete",
  domain: "html",
  module: "forms",
  title: "Автозаполнение и UX форм",
  titleEn: "Form UX: autocomplete, inputmode, enterkeyhint, mobile keyboards, error recovery",
  summary:
    "Лучшая форма — та, которую не приходится заполнять: браузер подставит имя, адрес и пароль, а мобильная клавиатура сама окажется нужной. Тема учит подсказывать платформе смысл полей (`autocomplete`, `inputmode`, `enterkeyhint`), не мешать менеджерам паролей и проектировать форму так, чтобы ошибки стоили пользователю как можно меньше.",
  minutes: 55,
  prerequisites: ["html.forms-basics", "html.input-types", "html.form-controls"],
  tags: ["autocomplete", "autofill", "inputmode", "enterkeyhint", "autocapitalize", "spellcheck", "autofocus", "password manager", "one-time-code", "mobile keyboard", "WCAG 1.3.5", "WCAG 3.3.7", "WCAG 3.3.8", "UX"],
  keyConcepts: [
    { term: "autocomplete-токены", text: "Стандартные значения (`email`, `given-name`, `postal-code`, `cc-number`…) сообщают браузеру **смысл** поля и включают точное автозаполнение." },
    { term: "Менеджеры паролей", text: "Работают с полями `username`, `current-password`, `new-password`. Блокировка вставки и «автозаполнение выключено» ломают их." },
    { term: "inputmode и enterkeyhint", text: "Подсказки **виртуальной клавиатуре**: раскладка и подпись клавиши Enter. Не меняют тип данных и проверку." },
    { term: "Не заставлять вводить дважды", text: "WCAG 3.3.7 (Redundant Entry): уже введённое повторно не запрашивают — подставляют или предлагают выбрать." },
    { term: "Ошибка не должна стоить данных", text: "После ошибки сервера значения полей сохраняются, фокус и сообщение ведут пользователя к исправлению." },
  ],
  sections: [
    section("definition", [
      def("autocomplete (атрибут)", "Подсказка браузеру о том, **какие данные** ожидаются в поле и можно ли подставлять сохранённые значения. Значения-токены задают смысл поля (`email`, `street-address`, `one-time-code`); значения `on` и `off` включают и выключают автозаполнение.", "autocomplete attribute"),
      def("inputmode и enterkeyhint", "`inputmode` подсказывает виртуальной клавиатуре, какую раскладку показать (`numeric`, `tel`, `email`, `url`, `decimal`, `search`, `none`). `enterkeyhint` подсказывает, как подписать клавишу Enter (`next`, `done`, `go`, `search`, `send`, `previous`, `enter`).", "inputmode / enterkeyhint"),
      p("Вместе с метками и валидацией эти атрибуты составляют «слой удобства» формы: они не меняют отправляемые данные, но определяют, сколько усилий нужно человеку, чтобы форму заполнить."),
    ]),

    section("why", [
      h("Проблема: ввод — самая дорогая часть формы"),
      p("На телефоне каждое нажатие по экранной клавиатуре — это секунды и риск опечатки. Адрес из семи полей, номер карты из шестнадцати цифр, пароль — всё это пользователь вводит вручную, если платформа не знает, что это за поля. Брошенная форма — основная потеря в онлайн-оформлении."),
      p("Браузер умеет подставлять адрес, телефон, почту, пароль, код из SMS и данные карты, но только когда понимает **смысл** полей. Угадывать по `name` и тексту рядом он пытается, но ненадёжно — особенно в многоязычных формах. Явные токены `autocomplete` делают подстановку точной и предсказуемой."),
      h("Проблема: «защитные» ограничения, вредящие людям"),
      p("Запрет вставки в поле пароля «ради безопасности», автозаполнение, отключённое «на всякий случай», разбитый на четыре поля номер карты, маска телефона, не пропускающая международные номера, — типичные решения, которые ухудшают и удобство, и безопасность: пользователи выбирают короткие пароли, потому что набирать длинные тяжело."),
      h("Доступность"),
      p("Для людей с когнитивными и моторными нарушениями автозаполнение — не удобство, а условие. Поэтому стандарт WCAG требует: определять назначение полей программно (SC 1.3.5), не заставлять вводить одни и те же данные повторно (SC 3.3.7) и не блокировать менеджеры паролей и вставку (SC 3.3.8)."),
      insight("Каждое действие, которое платформа может выполнить за пользователя, нужно **ей позволить**: объявить смысл поля, не блокировать вставку, не просить повторять."),
    ]),

    section("mental-model", [
      p("Форма — это **диалог с тремя собеседниками**: человеком, браузером (менеджер автозаполнения, клавиатура) и сервером. Ваши атрибуты — «реплики» браузеру: «это адрес доставки», «здесь код из SMS», «после этого поля — «Далее»». Чем точнее реплики, тем меньше работы остаётся человеку."),
      diagram(
        `
        человек ──► <input autocomplete="shipping postal-code" inputmode="numeric" enterkeyhint="next">
                        │                   │                         │                  │
                        ▼                   ▼                         ▼                  ▼
                 имя из метки         менеджер автозаполнения   раскладка клавиатуры   подпись Enter
                (доступное имя)       подставит сохранённый        (цифры)              («Далее»)
                                         индекс адреса доставки
        `,
        "Кто что читает из атрибутов поля",
      ),
      table(
        ["Атрибут", "Кому адресован", "Что делает"],
        [
          ["`<label>`", "Человеку, скринридеру", "Называет поле"],
          ["`type`", "Браузеру", "Формат значения, проверка, клавиатура"],
          ["`autocomplete`", "Менеджеру автозаполнения", "Смысл поля для подстановки"],
          ["`inputmode`", "Виртуальной клавиатуре", "Раскладка (без изменения проверки)"],
          ["`enterkeyhint`", "Виртуальной клавиатуре", "Подпись клавиши Enter"],
          ["`autocapitalize`, `spellcheck`", "Клавиатуре и редактору", "Заглавные буквы, проверка орфографии"],
        ],
        "Слой удобства формы",
      ),
    ]),

    section("technical", [
      h("Синтаксис `autocomplete`"),
      p("Значение — набор токенов через пробел. Общая схема (все части, кроме названия поля, необязательны):"),
      code(
        "text",
        `
        [section-имя]  [shipping | billing]  [home | work | mobile | fax | pager]  <название-поля>  [webauthn]
        `,
        { caption: "Схема значения autocomplete" },
      ),
      ul(
        "**`section-*`** разделяет несколько наборов однотипных полей в одной форме (два адреса: `section-sender`, `section-recipient`).",
        "**`shipping` / `billing`** — адрес доставки и платёжный адрес.",
        "**`home`, `work`, `mobile`…** — тип контакта; допустим только для `tel*`, `email`, `impp`.",
        "**`webauthn`** — добавляется последним токеном и подсказывает, что для поля возможен вход по passkey (например, `username webauthn`).",
      ),
      h("Самые нужные токены"),
      table(
        ["Данные", "Токен", "Замечание"],
        [
          ["Полное имя", "`name`", "Одно поле «Имя» лучше, чем три (имена бывают разными)"],
          ["Имя / фамилия / отчество", "`given-name`, `family-name`, `additional-name`", "Если разделение действительно нужно"],
          ["Почта", "`email`", "Вместе с `type=\"email\"`"],
          ["Телефон", "`tel` (также `tel-national`, `tel-country-code`)", "Вместе с `type=\"tel\"`"],
          ["Логин", "`username`", "Рядом с полем пароля"],
          ["Пароль для входа", "`current-password`", "Менеджер подставит сохранённый"],
          ["Новый пароль", "`new-password`", "Менеджер **предложит сгенерировать**, а не подставит старый"],
          ["Код из SMS", "`one-time-code`", "Подсказка для автоподстановки кода"],
          ["Адрес одной строкой", "`street-address`", "Для `textarea` или одиночного поля"],
          ["Адрес по строкам", "`address-line1`, `address-line2`", "Улица, дом; квартира и т.п."],
          ["Регион, город", "`address-level1`, `address-level2`", "Регион/область и город"],
          ["Индекс", "`postal-code`", "Текстовое поле, не `number`"],
          ["Страна", "`country` (код), `country-name` (название)", "Для `select` значения — коды стран"],
          ["Карта", "`cc-name`, `cc-number`, `cc-exp`, `cc-exp-month`, `cc-exp-year`, `cc-csc`", "Платёжные данные"],
          ["Дата рождения", "`bday` (также `bday-day/month/year`)", "Вместе с `type=\"date\"`"],
          ["Организация, должность", "`organization`, `organization-title`", "Контактные формы"],
        ],
        "Токены autocomplete для типичных полей",
      ),
      h("`on`, `off` и «режим менеджера паролей»"),
      ul(
        "**`autocomplete=\"off\"`** просит не подставлять сохранённые значения. Для полей входа и платёжных данных браузеры часто **игнорируют** его ради менеджеров паролей. Использовать стоит осознанно: для одноразовых данных (поле поиска по справочнику, код подтверждения администратором).",
        "**`new-password`** — единственный надёжный способ сказать «не подставляйте старый пароль» (например, в форме смены пароля).",
        "Атрибут можно поставить на `<form autocomplete=\"off\">`: он станет значением по умолчанию для полей, но не отменяет явных токенов у них.",
        "**Хитрости вроде `autocomplete=\"nope\"`** нестандартны и ломают доступность: токен становится нераспознанным и ничего не означает.",
      ),
      h("`inputmode` и `enterkeyhint`"),
      table(
        ["`inputmode`", "Клавиатура", "Когда"],
        [
          ["`numeric`", "Цифры", "Коды, индексы, номера карт (идентификаторы)"],
          ["`decimal`", "Цифры и разделитель", "Суммы, вес, размеры"],
          ["`tel`", "Телефонная", "Номера телефонов"],
          ["`email`", "С `@` и `.`", "Адреса почты (когда нельзя `type=\"email\"`)"],
          ["`url`", "С `/` и `.com`", "Адреса сайтов"],
          ["`search`", "С кнопкой поиска", "Поисковые строки"],
          ["`none`", "Без экранной клавиатуры", "Собственный экранный ввод (например, калькулятор)"],
        ],
      ),
      ul(
        "**`enterkeyhint`**: `next` — перейти к следующему полю, `done` — закончить, `go` — перейти, `search`, `send`, `previous`, `enter`.",
        "Подсказки влияют **только** на экранную клавиатуру: проверка и формат значения остаются заботой `type`, `pattern` и сервера.",
      ),
      h("Другие атрибуты ввода"),
      ul(
        "**`autocapitalize`**: `none` для логинов (иначе мобильная клавиатура поднимет первую букву), `words` для имён и адресов. Для `type=\"email\"`, `type=\"url\"` и `type=\"password\"` атрибут не указывают: браузер и так не делает заглавной первую букву, а спецификация его на этих типах не допускает.",
        "**`spellcheck=\"false\"`** для логинов, кодов и токенов — иначе красные подчёркивания и «исправления».",
        "**`autofocus`**: фокус при загрузке. Только один раз на странице и там, где поле — единственная цель (страница поиска, диалог). В прочих случаях фокус «из ниоткуда» дезориентирует, особенно пользователей скринридера.",
        "**`maxlength`**: используйте с запасом и показывайте лимит; не обрезайте ввод молча.",
      ),
      h("Принципы проектирования формы"),
      ul(
        "**Меньше полей.** Каждое поле снижает конверсию; убирайте то, что можно узнать позже.",
        "**Один столбец,** метки над полями, логичный порядок = порядок в DOM (никаких положительных `tabindex`).",
        "**Не дробите данные** на кусочки: номер карты, телефон, код из SMS — **одно** поле. Несколько полей ломают вставку и автозаполнение.",
        "**Не блокируйте вставку и менеджеры паролей** (SC 3.3.8): `onpaste=\"return false\"` вредит и безопасности, и доступности.",
        "**Обязательное и необязательное:** отметьте и то и другое (например, «(необязательно)») либо объясните звёздочку в начале формы.",
        "**Подсказки формата** — видимым текстом **до** ошибки, связанным через `aria-describedby`; `placeholder` — только пример.",
        "**Не заставляйте вводить дважды:** «Адрес плательщика совпадает с адресом доставки» — флажок вместо повторных полей (SC 3.3.7). Исключение — подтверждение нового пароля или проверка безопасности.",
        "**Шрифт полей не меньше 16px:** на iOS меньший размер приводит к принудительному увеличению страницы при фокусе.",
        "**Отправка:** не отключайте кнопку «навсегда»; защищайтесь от двойной отправки и показывайте состояние.",
        "**Ошибки:** сохраняйте введённые значения (кроме паролей), показывайте сводку и ведите к первому полю (см. «Валидацию форм»).",
      ),
      h("Пароли и вход"),
      ul(
        "Форма входа — **настоящая `<form>`** с `username` (`autocomplete=\"username\"`) и паролем (`current-password`) и кнопкой отправки; менеджеры паролей опознают её по структуре.",
        "Регистрация и смена пароля — `new-password`; повтор пароля часто **не нужен**, если есть «Показать пароль».",
        "Кнопка «Показать пароль» — `<button type=\"button\">` с постоянной подписью и `aria-pressed`.",
        "Разрешайте длинные пароли и любые символы; не навязывайте произвольные правила состава — важнее длина и проверка по спискам скомпрометированных паролей (рекомендации NIST SP 800-63B).",
        "Не требуйте решить «когнитивную задачу» (запомнить, расшифровать, сложить числа) — SC 3.3.8; допускайте вставку, менеджеры паролей, passkeys.",
      ),
      h("Код из SMS"),
      code(
        "html",
        `
        <label for="otp">Код из SMS</label>
        <input id="otp" name="otp" type="text"
               inputmode="numeric" autocomplete="one-time-code"
               pattern="[0-9]{6}" maxlength="6" enterkeyhint="done">
        `,
        { caption: "Одно поле, цифровая клавиатура, подсказка автоподстановки." },
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <form action="/checkout" method="post">
          <fieldset>
            <legend>Контакты</legend>
            <label for="name">Имя и фамилия</label>
            <input id="name" name="name" autocomplete="name" autocapitalize="words" enterkeyhint="next" required>

            <label for="email">Почта</label>
            <input id="email" name="email" type="email" autocomplete="email"
                   spellcheck="false" enterkeyhint="next" required>

            <label for="tel">Телефон</label>
            <input id="tel" name="tel" type="tel" autocomplete="tel" enterkeyhint="next">
          </fieldset>

          <fieldset>
            <legend>Адрес доставки</legend>
            <label for="addr">Улица, дом, квартира</label>
            <input id="addr" name="address" autocomplete="shipping street-address" enterkeyhint="next" required>

            <label for="city">Город</label>
            <input id="city" name="city" autocomplete="shipping address-level2" enterkeyhint="next" required>

            <label for="zip">Индекс</label>
            <input id="zip" name="zip" inputmode="numeric" autocomplete="shipping postal-code"
                   pattern="[0-9]{6}" enterkeyhint="done" required>
          </fieldset>

          <button type="submit">Оформить заказ</button>
        </form>
        `,
        { lineNumbers: true, filename: "checkout.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <form>
          <label for="pw">Пароль</label>
          <input id="pw" name="password" type="password" autocomplete="current-password">
          <button type="button" id="toggle" aria-controls="pw" aria-pressed="false">Показать пароль</button>
        </form>
        <script>
          const pw = document.getElementById("pw");
          const toggle = document.getElementById("toggle");
          toggle.addEventListener("click", () => {
            const show = pw.type === "password";
            pw.type = show ? "text" : "password";
            toggle.setAttribute("aria-pressed", String(show));
            console.log("type =", pw.type, "| aria-pressed =", toggle.getAttribute("aria-pressed"));
          });
        </script>
        `,
        { runnable: true },
      ),
      p("Постоянная подпись «Показать пароль» с состоянием `aria-pressed` — переключатель. Скринридер озвучит «кнопка-переключатель, нажата / не нажата». Если одновременно менять и подпись, и `aria-pressed`, пользователь услышит противоречие."),
    ]),

    section("detailed-example", [
      p("Оформление заказа с блоком «Платёжный адрес»: пока флажок «совпадает с адресом доставки» отмечен, поля скрыты и **отключены** (не требуются и не отправляются); при снятии — включаются. Такой приём реализует принцип «не вводить дважды»."),
      code(
        "html",
        `
        <form action="/pay" method="post">
          <fieldset>
            <legend>Адрес доставки</legend>
            <label for="s-addr">Адрес</label>
            <input id="s-addr" name="ship_address" autocomplete="shipping street-address" required>
            <label for="s-zip">Индекс</label>
            <input id="s-zip" name="ship_zip" inputmode="numeric" autocomplete="shipping postal-code" pattern="[0-9]{6}" required>
          </fieldset>

          <label>
            <input type="checkbox" id="same" name="billing_same" value="1" checked>
            Платёжный адрес совпадает с адресом доставки
          </label>

          <fieldset id="billing" hidden disabled>
            <legend>Платёжный адрес</legend>
            <label for="b-addr">Адрес</label>
            <input id="b-addr" name="bill_address" autocomplete="billing street-address" required>
            <label for="b-zip">Индекс</label>
            <input id="b-zip" name="bill_zip" inputmode="numeric" autocomplete="billing postal-code" pattern="[0-9]{6}" required>
          </fieldset>

          <fieldset>
            <legend>Карта</legend>
            <label for="cc">Номер карты</label>
            <input id="cc" name="cc" inputmode="numeric" autocomplete="cc-number" spellcheck="false" required>
            <label for="exp">Срок действия (ММ/ГГ)</label>
            <input id="exp" name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="09/28" required>
            <label for="cvc">CVC</label>
            <input id="cvc" name="cvc" inputmode="numeric" autocomplete="cc-csc" maxlength="4" required>
          </fieldset>

          <button type="submit">Оплатить</button>
        </form>

        <script>
          const same = document.getElementById("same");
          const billing = document.getElementById("billing");
          same.addEventListener("change", () => {
            billing.hidden = same.checked;
            billing.disabled = same.checked;
          });
        </script>
        `,
        { lineNumbers: true, filename: "pay.html", collapsed: true },
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <input id="zip" name="zip" inputmode="numeric"
               autocomplete="shipping postal-code"
               pattern="[0-9]{6}" enterkeyhint="next" required>
        <input id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6">
        <input id="pw" type="password" autocomplete="new-password">
        <input id="login" autocomplete="username" autocapitalize="none" spellcheck="false">
        `,
        [
          { line: 1, text: "Индекс — **идентификатор**, а не число: поэтому текстовое поле, цифровая клавиатура (`inputmode`) и шаблон `pattern`." },
          { line: 2, text: "`shipping postal-code` — смысл поля («индекс адреса доставки»). Браузер подставит индекс из сохранённого адреса именно для доставки, а не платёжного адреса." },
          { line: 3, text: "`enterkeyhint=\"next\"` меняет подпись клавиши Enter на «Далее»; нажатие по-прежнему отправит форму или перейдёт к следующему полю — по правилам браузера." },
          { line: 4, text: "`one-time-code` позволяет мобильным браузерам предложить код из полученного SMS. Одно поле важно: шесть отдельных ломают подстановку." },
          { line: 5, text: "`new-password` говорит менеджеру паролей, что поле для **нового** пароля: он предложит сгенерировать надёжный, а не подставит старый." },
          { line: 6, text: "Логин не должен автоматически получать заглавную букву и подчёркиваться «опечаткой»: `autocapitalize=\"none\"` и `spellcheck=\"false\"`." },
        ],
        "autocomplete-attrs.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Распознавание поля", "При загрузке менеджер автозаполнения анализирует форму: сначала токены `autocomplete`, затем (если токенов нет) эвристики по `name`, `id`, метке и `type`. Явные токены надёжнее и не зависят от языка страницы."],
          ["Фокус и предложение", "При фокусе на поле браузер показывает сохранённые варианты или предлагает заполнить всю форму; для `new-password` — предлагает сгенерировать пароль."],
          ["Подстановка", "Значения записываются в поля, как если бы их ввёл пользователь, и возникают события `input`/`change`. Хорошо написанные скрипты обрабатывают их так же, как ручной ввод."],
          ["Клавиатура", "ОС выбирает раскладку по `type` и `inputmode`, подпись клавиши Enter — по `enterkeyhint`, автоматическую заглавную и исправления — по `autocapitalize`/`spellcheck`."],
          ["Сохранение", "После успешной отправки браузер может предложить сохранить введённые данные или пароль. Он ориентируется на реальную форму с кнопкой отправки и на то, что страница сменилась (навигация)."],
        ],
        "Как браузер использует атрибуты",
      ),
      note("Автозаполнение может заполнить поля **без** событий клавиатуры, а иногда — только при первом взаимодействии (из соображений безопасности значения не доступны скриптам до действия пользователя). Не полагайтесь на то, что `input.value` заполнено при загрузке."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Выключить автозаполнение везде"),
      wrongRight(
        "html",
        {
          code: `
            <form autocomplete="off">
              <input name="email" autocomplete="off">
              <input name="password" type="password" autocomplete="off">
            </form>
          `,
          note: "Менеджеры паролей и автозаполнение «для безопасности» отключены: пользователи вынуждены вводить всё вручную и выбирают слабые пароли.",
        },
        {
          code: `
            <form>
              <input name="email" type="email" autocomplete="email">
              <input name="password" type="password" autocomplete="current-password">
            </form>
          `,
          note: "Точные токены: браузер подставляет данные, менеджер паролей работает. Для новых паролей — `new-password`.",
        },
      ),
      h("Ошибка 2. Разбивать данные на кусочки"),
      wrongRight(
        "html",
        {
          code: `
            <input name="card1" maxlength="4"><input name="card2" maxlength="4">
            <input name="card3" maxlength="4"><input name="card4" maxlength="4">
          `,
          note: "Нельзя вставить номер целиком, автозаполнение ломается, а скринридер называет четыре безымянных поля.",
        },
        {
          code: `
            <label for="cc">Номер карты</label>
            <input id="cc" name="cc" inputmode="numeric" autocomplete="cc-number" spellcheck="false">
          `,
          note: "Одно поле: вставка, автозаполнение и пробелы (форматируйте при показе, а не блокируйте ввод).",
        },
      ),
      h("Ошибка 3. Блокировать вставку"),
      p("`onpaste=\"return false\"` на полях пароля или подтверждения «для безопасности» запрещает использовать менеджер паролей — один из главных инструментов безопасности. Это и нарушение WCAG 3.3.8, и фактическое снижение защищённости."),
      h("Ошибка 4. Неверные токены"),
      ul(
        "`autocomplete=\"name\"` на поле «Фамилия» подставит полное имя; используйте `family-name`.",
        "`autocomplete=\"address\"` — такого токена нет (допустимы `street-address`, `address-line1`…).",
        "`autocomplete=\"email\"` на поле «Логин (почта)» уместен, а `username` — для нейтрального логина; выбирайте по смыслу.",
        "Токен `postal-code` у числового `type=\"number\"` вредит ведущим нулям: используйте текстовое поле.",
      ),
      h("Ошибка 5. `autofocus` где попало"),
      p("Фокус «из ниоткуда» на странице с несколькими блоками дезориентирует и пропускает приветствие скринридера. Оставляйте `autofocus` для единственной цели страницы и диалогов."),
      h("Ошибка 6. Маски, ломающие ввод"),
      p("Жёсткая маска `+7 (___) ___-__-__` не пропускает международные номера, мешает вставке и работе курсора. Принимайте разные форматы и **нормализуйте на сервере**."),
      h("Ошибка 7. Слишком мелкий шрифт на мобильных"),
      p("Шрифт полей меньше 16px приводит на iOS к автоматическому увеличению страницы при фокусе. Задавайте `font-size: 1rem` и больше."),
      h("Ошибка 8. Потеря данных после ошибки"),
      p("Страница с ошибкой, на которой все поля пусты, — худший исход. Сервер обязан возвращать форму с введёнными значениями (за исключением паролей и данных карты)."),
    ]),

    section("antipatterns", [
      ul(
        "**«Хитрые» значения `autocomplete`** (`nope`, случайные строки), чтобы «обмануть» браузер.",
        "**Подтверждение электронной почты вторым полем** («введите почту ещё раз»): мешает вставке, не ловит опечатки лучше письма-подтверждения.",
        "**Капча и «когнитивные тесты» при входе** без альтернативы (SC 3.3.8).",
        "**Раздельные поля для даты рождения** (`день`, `месяц`, `год` по `text`) вместо `type=\"date\"` или `bday`.",
        "**Многостраничная форма без сохранения:** возврат «назад» стирает введённое.",
        "**Отключённая кнопка отправки** без объяснения, что не так.",
        "**«Пароль должен содержать заглавную, цифру, спецсимвол…»** без возможности вставки и менеджера паролей.",
        "**Двойное запрашивание одних и тех же данных** (адрес доставки и платёжный адрес по умолчанию пустыми).",
        "**Placeholder, подменяющий метку** вместе с автозаполнением: подставленное значение скрывает подсказку, и поле остаётся без названия.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Для каждого поля личных данных — токен `autocomplete`** (SC 1.3.5) вместе с подходящим `type`.",
        "**Пароли:** `current-password` / `new-password`, `username` рядом, вставка разрешена, «Показать пароль» — переключатель.",
        "**Коды:** `one-time-code`, `inputmode=\"numeric\"`, одно поле, `pattern` для проверки.",
        "**Клавиатуры:** `type` по смыслу, `inputmode` для идентификаторов, `enterkeyhint` по сценарию, `autocapitalize`/`spellcheck` для логинов и кодов.",
        "**Имена и адреса международно:** одно поле «Имя», необязательные регион и индекс, гибкая длина.",
        "**Не вводить дважды:** предзаполнение, флажки «совпадает с…», сохранение между шагами (SC 3.3.7).",
        "**Сохранение при ошибках:** значения возвращаются, сводка ошибок, фокус на проблеме.",
        "**Защита от двойной отправки:** флаг «занято» + `aria-disabled`, идемпотентность на сервере.",
        "**Тестирование на реальных устройствах:** клавиатуры iOS/Android, менеджеры паролей, автозаполнение браузера.",
        "**Измеряйте:** время заполнения и места, где пользователи уходят — это даёт больше, чем догадки.",
      ),
    ]),

    section("edge-cases", [
      h("Автозаполнение и события"),
      p("Некоторые браузеры подставляют значения без событий `input`, а иногда — только после первого взаимодействия. Скрипт, который «включает кнопку» по событию `input`, может остаться с неактивной кнопкой. Проверяйте состояние ещё и при `change`, при отправке и по `:autofill` в CSS."),
      h("`:autofill` в CSS"),
      p("Автозаполненные поля получают собственные стили браузера (цвет фона). Их можно распознать псевдоклассом `:autofill` (в WebKit/Blink-браузерах — с префиксом `:-webkit-autofill`) и скорректировать оформление; переопределять нужно аккуратно, чтобы не потерять контраст."),
      h("Автозаполнение по формам в SPA"),
      p("Менеджеры паролей ожидают реальную отправку формы или навигацию. В одностраничных приложениях сохраняйте структуру `<form>`, имена полей и кнопку `type=\"submit\"`; иначе предложения «сохранить пароль» не появятся."),
      h("Два поля пароля"),
      p("В форме регистрации с `new-password` и «подтверждением» оба поля должны иметь `new-password`: иначе менеджер подставит старый пароль во второе поле."),
      h("Адреса разных стран"),
      p("Структура адресов различается: нет единого понятия «региона» или «индекса». Не требуйте поля, которых в стране нет; поле `address-level1` не обязательно везде. Для международной формы удобен один `street-address` и необязательные уточнения."),
      h("Имена людей"),
      p("Имя не всегда делится на «имя» и «фамилию»: бывают мононимы, длинные составные имена, порядок «фамилия-имя». W3C описывает международные особенности имён. Поэтому «Полное имя» (`name`) часто надёжнее трёх полей."),
      h("Конфиденциальность"),
      p("Автозаполнение может раскрывать данные при совместном доступе к устройству. Для особо чувствительных значений (разовые коды, ответы на секретные вопросы) осознанно используйте `autocomplete=\"off\"` или `one-time-code`."),
      h("`inputmode=\"none\"`"),
      p("Скрывает экранную клавиатуру, и пользователь без собственной клавиатуры на экране ввода не сможет ничего ввести. Используйте только при наличии полноценной альтернативы."),
    ]),

    section("related", [
      ul(
        "[Типы полей ввода](/learn/html/input-types) — `type`, `inputmode`, форматы значений.",
        "[Элементы управления](/learn/html/form-controls) — метки, группы, кнопки.",
        "[Валидация форм](/learn/html/form-validation) — ошибки, сообщения, `aria-invalid`.",
        "[Доступные формы](/learn/html/accessible-forms) — SC 1.3.5, 3.3.x, сводка ошибок и порядок фокуса.",
        "[Безопасность HTML](/learn/html/html-security) — формы, `autocomplete` и защита данных.",
        "Из других курсов: **JS** — события `input`/`change`, `FormData`; **CSS** — `:autofill`, `font-size` полей, адаптивные формы.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Форма, которая мешает",
          code: `
            <form autocomplete="off">
              <input name="n" placeholder="Имя" onpaste="return false">
              <input name="e" placeholder="Почта">
              <input name="ph" placeholder="+7 (___) ___-__-__">
              <input name="c1" maxlength="4"><input name="c2" maxlength="4">
              <input name="otp1" maxlength="1"><input name="otp2" maxlength="1">
              <input name="pw" type="password" onpaste="return false">
              <input name="pw2" type="password" onpaste="return false">
            </form>
          `,
          note: "Нет меток, смысла полей и клавиатур; вставка запрещена; данные разбиты на кусочки; автозаполнение выключено.",
        },
        {
          title: "Форма, которая помогает",
          code: `
            <form>
              <label for="n">Имя и фамилия</label>
              <input id="n" name="name" autocomplete="name">
              <label for="e">Почта</label>
              <input id="e" name="email" type="email" autocomplete="email">
              <label for="ph">Телефон</label>
              <input id="ph" name="phone" type="tel" autocomplete="tel">
              <label for="cc">Номер карты</label>
              <input id="cc" name="cc" inputmode="numeric" autocomplete="cc-number">
              <label for="otp">Код из SMS</label>
              <input id="otp" name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6">
              <label for="pw">Пароль</label>
              <input id="pw" name="password" type="password" autocomplete="new-password" minlength="10">
            </form>
          `,
          note: "Метки, токены, подходящие клавиатуры, одно поле на карту и код, вставка разрешена, менеджер паролей работает.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.form-ux-autocomplete.ex1",
      title: "Подберите autocomplete",
      difficulty: "foundation",
      kind: "recall",
      prompt: [
        p("Для каждого поля назовите токен `autocomplete` (и при необходимости `type`/`inputmode`):"),
        ol(
          "Полное имя покупателя.",
          "Электронная почта.",
          "Телефон.",
          "Логин при входе в аккаунт.",
          "Пароль при входе.",
          "Новый пароль при регистрации.",
          "Код из SMS.",
          "Индекс **платёжного** адреса.",
          "Номер банковской карты.",
          "Срок действия карты.",
        ),
      ],
      hints: ["Для платёжного адреса нужен префикс.", "Новый и текущий пароль — разные токены."],
      checks: ["Токены корректны и существуют в стандарте", "Использованы префиксы `shipping`/`billing` там, где нужно"],
      solution: [
        ol(
          "`name`",
          "`email` (`type=\"email\"`)",
          "`tel` (`type=\"tel\"`)",
          "`username`",
          "`current-password`",
          "`new-password`",
          "`one-time-code` (`inputmode=\"numeric\"`)",
          "`billing postal-code` (`inputmode=\"numeric\"`)",
          "`cc-number` (`inputmode=\"numeric\"`)",
          "`cc-exp` (или `cc-exp-month` и `cc-exp-year` для раздельных полей)",
        ),
      ],
    }),
    exercise({
      id: "html.form-ux-autocomplete.ex2",
      title: "Вход, регистрация и подтверждение",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Сделайте три формы: (1) вход — логин и пароль; (2) регистрация — почта, имя, пароль (с кнопкой «Показать пароль»); (3) подтверждение — код из SMS. Подберите `type`, `autocomplete`, `inputmode`, `autocapitalize`, `enterkeyhint`. Вставка должна быть разрешена, поля — подписаны."),
      ],
      hints: ["Что нужно менеджеру паролей, чтобы опознать форму входа?", "Какой токен у нового пароля?", "Почему код — одно поле?"],
      checks: ["Форма входа: `username` + `current-password`", "Регистрация: `new-password`, `email`, `name`", "Код: `one-time-code`, одно поле", "Переключатель пароля с `aria-pressed`"],
      solution: [
        code(
          "html",
          `
          <form action="/login" method="post">
            <label for="l-login">Логин или почта</label>
            <input id="l-login" name="login" autocomplete="username" autocapitalize="none" spellcheck="false" enterkeyhint="next" required>
            <label for="l-pw">Пароль</label>
            <input id="l-pw" name="password" type="password" autocomplete="current-password" enterkeyhint="go" required>
            <button type="submit">Войти</button>
          </form>

          <form action="/register" method="post">
            <label for="r-name">Имя</label>
            <input id="r-name" name="name" autocomplete="name" autocapitalize="words" enterkeyhint="next" required>
            <label for="r-email">Почта</label>
            <input id="r-email" name="email" type="email" autocomplete="email" spellcheck="false" enterkeyhint="next" required>
            <label for="r-pw">Пароль (не менее 10 символов)</label>
            <input id="r-pw" name="password" type="password" autocomplete="new-password" minlength="10" enterkeyhint="go" required>
            <button type="button" id="r-toggle" aria-controls="r-pw" aria-pressed="false">Показать пароль</button>
            <button type="submit">Создать аккаунт</button>
          </form>

          <form action="/verify" method="post">
            <label for="otp">Код из SMS</label>
            <input id="otp" name="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" enterkeyhint="done" required>
            <button type="submit">Подтвердить</button>
          </form>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        note("Кнопка «Показать пароль» нуждается в небольшом скрипте (меняет `type` между `password` и `text` и значение `aria-pressed`), как в минимальном примере темы."),
      ],
    }),
    exercise({
      id: "html.form-ux-autocomplete.ex3",
      title: "Форма, которую хочется бросить",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Аналитика: на шаге оплаты уходит половина пользователей. Отзывы: «не могу вставить номер карты», «на айфоне страница увеличивается», «приходится каждый раз вводить адрес», «менеджер паролей молчит», «вместо цифр показывается обычная клавиатура». Найдите все проблемы и исправьте форму."),
      ],
      starter: {
        lang: "html",
        code: `
          <form autocomplete="off">
            <input name="c1" maxlength="4" style="font-size:12px">
            <input name="c2" maxlength="4" style="font-size:12px">
            <input name="c3" maxlength="4" style="font-size:12px">
            <input name="c4" maxlength="4" style="font-size:12px">
            <input name="zip" type="number" placeholder="Индекс">
            <input name="addr" placeholder="Адрес доставки">
            <input name="baddr" placeholder="Платёжный адрес">
            <input name="pw" type="password" onpaste="return false">
            <div class="btn" onclick="pay()">Оплатить</div>
          </form>
        `,
      },
      hints: ["Сколько полей должно быть у номера карты?", "Чем плох `type=\"number\"` для индекса?", "Что даёт флажок «совпадает с адресом доставки»?", "Кнопка — это `div`?"],
      checks: ["Одно поле карты с `cc-number`", "Шрифт ≥16px", "Токены адресов с префиксами", "Вставка разрешена, `new-password`/`current-password`", "Настоящая кнопка отправки", "Метки у полей"],
      solution: [
        ul(
          "**Карта в 4 полях:** нельзя вставить, автозаполнение не работает. Одно поле с `autocomplete=\"cc-number\"` и `inputmode=\"numeric\"`.",
          "**Шрифт 12px:** iOS увеличивает страницу при фокусе; задать не меньше 16px.",
          "**Индекс в `number`:** теряются ведущие нули и клавиатура неудобна → `text` + `inputmode=\"numeric\"` + `shipping postal-code`.",
          "**Адрес без токенов, платёжный адрес повторяется:** добавить токены (`shipping street-address`, `billing street-address`) и флажок «совпадает с адресом доставки».",
          "**`onpaste=\"return false\"`** блокирует менеджер паролей; убрать, указать `autocomplete`.",
          "**`autocomplete=\"off\"` на форме** лишает автозаполнения; убрать.",
          "**`div` вместо кнопки:** `<button type=\"submit\">`.",
          "**Нет меток:** подписать поля.",
        ),
        code(
          "html",
          `
          <form action="/pay" method="post">
            <label for="cc">Номер карты</label>
            <input id="cc" name="cc" inputmode="numeric" autocomplete="cc-number" spellcheck="false" required>

            <label for="addr">Адрес доставки</label>
            <input id="addr" name="address" autocomplete="shipping street-address" required>
            <label for="zip">Индекс</label>
            <input id="zip" name="zip" inputmode="numeric" pattern="[0-9]{6}" autocomplete="shipping postal-code" required>

            <label><input type="checkbox" id="same" name="billing_same" checked> Платёжный адрес совпадает с адресом доставки</label>
            <fieldset id="billing" hidden disabled>
              <legend>Платёжный адрес</legend>
              <label for="baddr">Адрес</label>
              <input id="baddr" name="billing_address" autocomplete="billing street-address" required>
            </fieldset>

            <label for="pw">Пароль</label>
            <input id="pw" name="password" type="password" autocomplete="current-password" required>

            <button type="submit">Оплатить</button>
          </form>
          <style>input, button { font-size: 1rem; }</style>
          `,
          { lineNumbers: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.form-ux-autocomplete.challenge",
    title: "Оформление заказа с минимальным трением",
    scenario: [
      p("Интернет-магазин переделывает оформление заказа. Сейчас у формы 22 поля, 38% пользователей бросают её на мобильных. Требования бизнеса: сохранить контактные данные, адрес доставки, платёжный адрес (по желанию другой), оплату картой, создание аккаунта (необязательное) и повторное использование ранее введённых данных. Юристы настаивают на соблюдении WCAG 2.2 AA."),
      p("Спроектируйте разметку: какие поля нужны, какие токены `autocomplete`, какие клавиатуры, как не заставлять вводить повторно, как оформить аккаунт и ошибки. Объясните каждое решение критерием WCAG или принципом UX."),
    ],
    requirements: [
      "Таблица «поле → type → autocomplete → inputmode/enterkeyhint → обоснование»",
      "Разметка контактов, доставки, платёжного адреса (с флажком «совпадает») и карты",
      "Решение для создания аккаунта (пароль, показ пароля, менеджер паролей)",
      "Указать, как выполняются SC 1.3.5, 3.3.7, 3.3.8",
    ],
    constraints: [
      "Не более 12 полей на экране для типичного пользователя",
      "Номер карты, телефон и код — по одному полю",
      "Вставка и менеджеры паролей не блокируются",
    ],
    acceptance: [
      "Каждое поле личных данных имеет подходящий токен",
      "Блок платёжного адреса отключается, пока «совпадает» отмечен",
      "Ошибки сохраняют введённые значения (кроме паролей и карты)",
      "Форма проходит ручную проверку с клавиатуры и скринридером",
    ],
    hints: [
      "Какие данные можно не спрашивать вообще?",
      "Как реализовать «не вводить дважды» без JS-зависимости?",
      "Нужен ли повтор пароля при наличии кнопки «Показать»?",
    ],
    solution: [
      table(
        ["Поле", "Тип и атрибуты", "Обоснование"],
        [
          ["Имя и фамилия", "`autocomplete=\"name\"`, `autocapitalize=\"words\"`", "Одно поле: международные имена; SC 1.3.5"],
          ["Почта", "`type=\"email\"`, `autocomplete=\"email\"`, `spellcheck=\"false\"`", "Клавиатура с `@`, подстановка, чек на почту"],
          ["Телефон", "`type=\"tel\"`, `autocomplete=\"tel\"`", "Без жёсткой маски; нормализация на сервере"],
          ["Адрес", "`autocomplete=\"shipping street-address\"`", "Одна строка + необязательные уточнения"],
          ["Город", "`autocomplete=\"shipping address-level2\"`", "Подстановка по сохранённому адресу"],
          ["Индекс", "`inputmode=\"numeric\"`, `shipping postal-code`, `pattern`", "Идентификатор, а не число"],
          ["Платёжный адрес", "Флажок «совпадает» + `fieldset hidden disabled` с `billing …`", "SC 3.3.7: не вводить повторно"],
          ["Номер карты", "`inputmode=\"numeric\"`, `cc-number`, `spellcheck=\"false\"`", "Одно поле, вставка и автозаполнение"],
          ["Срок", "`inputmode=\"numeric\"`, `cc-exp`", "Подстановка срока из сохранённой карты"],
          ["CVC", "`inputmode=\"numeric\"`, `cc-csc`, `maxlength=\"4\"`", "Цифровая клавиатура"],
          ["Пароль аккаунта (опц.)", "`new-password`, `minlength=\"10\"`, кнопка «Показать пароль»", "Генерация в менеджере; SC 3.3.8; без обязательного повтора"],
        ],
      ),
      code(
        "html",
        `
        <form action="/checkout" method="post" id="checkout">
          <fieldset>
            <legend>Контакты</legend>
            <label for="name">Имя и фамилия</label>
            <input id="name" name="name" autocomplete="name" autocapitalize="words" enterkeyhint="next" required>
            <label for="email">Почта</label>
            <input id="email" name="email" type="email" autocomplete="email" spellcheck="false" enterkeyhint="next" required>
            <label for="tel">Телефон</label>
            <input id="tel" name="tel" type="tel" autocomplete="tel" enterkeyhint="next" required>
          </fieldset>

          <fieldset>
            <legend>Доставка</legend>
            <label for="addr">Адрес</label>
            <input id="addr" name="address" autocomplete="shipping street-address" enterkeyhint="next" required>
            <label for="zip">Индекс</label>
            <input id="zip" name="zip" inputmode="numeric" pattern="[0-9]{6}" autocomplete="shipping postal-code" enterkeyhint="next" required>
          </fieldset>

          <label><input type="checkbox" id="same" name="billing_same" checked> Платёжный адрес совпадает с адресом доставки</label>
          <fieldset id="billing" hidden disabled>
            <legend>Платёжный адрес</legend>
            <label for="b-addr">Адрес</label>
            <input id="b-addr" name="bill_address" autocomplete="billing street-address" required>
          </fieldset>

          <fieldset>
            <legend>Оплата картой</legend>
            <label for="cc">Номер карты</label>
            <input id="cc" name="cc" inputmode="numeric" autocomplete="cc-number" spellcheck="false" required>
            <label for="exp">Срок (ММ/ГГ)</label>
            <input id="exp" name="exp" inputmode="numeric" autocomplete="cc-exp" required>
            <label for="cvc">CVC</label>
            <input id="cvc" name="cvc" inputmode="numeric" autocomplete="cc-csc" maxlength="4" required>
          </fieldset>

          <fieldset>
            <legend>Аккаунт (необязательно)</legend>
            <label for="pw">Пароль (минимум 10 символов)</label>
            <input id="pw" name="password" type="password" autocomplete="new-password" minlength="10">
            <button type="button" id="toggle" aria-controls="pw" aria-pressed="false">Показать пароль</button>
          </fieldset>

          <button type="submit">Оплатить</button>
        </form>
        `,
        { lineNumbers: true, collapsed: true },
      ),
      ul(
        "**SC 1.3.5:** токены `autocomplete` определяют назначение полей программно для браузеров и вспомогательных технологий.",
        "**SC 3.3.7:** платёжный адрес по умолчанию совпадает с адресом доставки; повторный ввод не требуется.",
        "**SC 3.3.8:** вставка разрешена, менеджеры паролей работают, когнитивных тестов нет.",
        "**Меньше полей:** убраны отчество, страна (определяется по контексту магазина), повтор пароля и подтверждение почты. Подтверждает почту письмо-ссылка.",
        "**Ошибки:** сервер возвращает форму с введёнными значениями (кроме пароля и данных карты), сводка ошибок и фокус — как в теме о валидации.",
        "**Двойная отправка:** флаг «занято» и `aria-disabled` на кнопке; сервер идемпотентен по ключу заказа.",
        "**Платёжные данные:** по возможности используйте встроенные платёжные формы провайдера (iframe/hosted fields): данные карты не касаются вашего сервера.",
      ),
    ],
  },

  interview: [
    iq("html.form-ux-autocomplete.i1", "basic", "Зачем нужен атрибут `autocomplete` со значениями вроде `email` и `postal-code`?", [
      p("Он сообщает браузеру смысл поля и позволяет точно подставить сохранённые данные. Без токенов браузер угадывает по имени и тексту, что работает хуже. Кроме удобства, это требование доступности (WCAG 1.3.5)."),
    ]),
    iq("html.form-ux-autocomplete.i2", "basic", "Чем `inputmode` отличается от `type`?", [
      p("`type` определяет формат значения, проверку и поведение; `inputmode` лишь подсказывает раскладку экранной клавиатуры. Для идентификаторов (индекс, код) используют `type=\"text\"` с `inputmode=\"numeric\"`."),
    ]),
    iq("html.form-ux-autocomplete.i3", "intermediate", "Какие значения `autocomplete` нужны на форме регистрации с паролем?", [
      ul(
        "`username` (или `email`) для логина/почты.",
        "`new-password` для нового пароля (менеджер предложит сгенерировать).",
        "На форме входа — `username` и `current-password`.",
      ),
    ]),
    iq("html.form-ux-autocomplete.i4", "intermediate", "Почему не стоит блокировать вставку в поля пароля?", [
      p("Вставка нужна менеджерам паролей и людям с ограниченными возможностями набора; её блокировка заставляет выбирать короткие запоминающиеся пароли и нарушает WCAG 3.3.8. Это снижает, а не повышает безопасность."),
    ]),
    iq("html.form-ux-autocomplete.i5", "intermediate", "Как вы подойдёте к полю «код из SMS»?", [
      p("Одно текстовое поле: `inputmode=\"numeric\"`, `autocomplete=\"one-time-code\"`, `pattern=\"[0-9]{6}\"`. Несколько отдельных полей-«кубиков» ломают вставку и подстановку кода и ухудшают доступность."),
    ]),
    iq("html.form-ux-autocomplete.i6", "advanced", "Что значит WCAG 3.3.7 (Redundant Entry) и как его выполнить в многошаговой форме?", [
      p("Информацию, уже введённую пользователем в рамках процесса, нельзя требовать повторно: её подставляют автоматически или дают выбрать из ранее введённого. Примеры: «платёжный адрес совпадает с адресом доставки», сохранение данных между шагами. Исключения: безопасность, обязательное подтверждение (например, нового пароля) и ситуации, когда данные устарели."),
    ]),
    iq("html.form-ux-autocomplete.i7", "engineering", "Конверсия формы оформления заказа на мобильных низкая. Как вы будете искать и устранять проблемы в самой форме?", [
      ul(
        "Аналитика полей: время на поле, ошибки, места ухода.",
        "Аудит: токены `autocomplete`, клавиатуры, раздробленные поля, блокировки вставки, шрифт <16px.",
        "Сокращение: убрать лишние поля и повторы, дать «совпадает с…».",
        "Ошибки: сохранение значений, понятные тексты, сводка.",
        "Проверка на реальных устройствах и в сценарии с менеджером паролей; A/B-тесты.",
      ),
    ]),
    iq("html.form-ux-autocomplete.i8", "debugging", "Менеджер паролей не предлагает сохранить пароль после входа в SPA. Что проверить?", [
      ul(
        "Есть ли настоящая `<form>` с полями `username` и `current-password` и кнопкой `type=\"submit\"`.",
        "Не очищается ли форма и не удаляется ли она из DOM до того, как браузер зафиксировал отправку.",
        "Происходит ли навигация или хотя бы смена URL (`history`) после успешного входа.",
        "Не отключено ли автозаполнение (`autocomplete=\"off\"`) и не заблокирована ли вставка.",
      ),
    ]),
  ],

  exam: [
    mcq("html.form-ux-autocomplete.e1", "foundation", "Какой токен `autocomplete` подходит для поля нового пароля?", ["`password`", "`current-password`", "`new-password`", "`secret`"], 2, "`new-password` сообщает менеджеру, что нужен новый пароль, и он предложит сгенерировать его."),
    mcq("html.form-ux-autocomplete.e2", "foundation", "Что делает `inputmode=\"numeric\"`?", ["Превращает поле в `number`", "Подсказывает цифровую клавиатуру", "Проверяет, что введены цифры", "Запрещает ввод букв"], 1, "Это подсказка раскладки; проверку и ограничение ввода задают `type`, `pattern` и сервер."),
    mcq("html.form-ux-autocomplete.e3", "intermediate", "Как лучше оформить ввод кода из SMS?", ["Шесть полей по одной цифре", "Одно поле с `autocomplete=\"one-time-code\"` и `inputmode=\"numeric\"`", "`type=\"number\"`", "`type=\"password\"`"], 1, "Одно поле с подсказками позволяет подставить код и вставить его целиком."),
    mcq("html.form-ux-autocomplete.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["Запрет вставки пароля повышает безопасность", "`autocapitalize=\"none\"` полезен для логина в текстовом поле", "Номер карты лучше разбить на четыре поля", "`autofocus` нужно использовать осторожно"], [1, 3], "Блокировка вставки вредит, а дробление карты ломает автозаполнение."),
    mcq("html.form-ux-autocomplete.e5", "intermediate", "Какое значение `autocomplete` соответствует адресу доставки, индексу?", ["`shipping postal-code`", "`zip`", "`postal`", "`address-zip`"], 0, "Токен `postal-code` с префиксом `shipping` — стандартный способ указать индекс адреса доставки."),
    mcq("html.form-ux-autocomplete.e6", "advanced", "Что требует WCAG 3.3.8 (Accessible Authentication, Minimum)?", ["Двухфакторную аутентификацию", "Не требовать когнитивных тестов при входе, разрешать вставку и менеджеры паролей", "Капчу на каждой форме", "Пароль не короче 12 символов"], 1, "Критерий исключает необходимость запоминания, расшифровки и вычислений при входе без альтернативы."),
    open("html.form-ux-autocomplete.e7", "intermediate", "Объясните, как атрибуты `autocomplete`, `inputmode` и `enterkeyhint` уменьшают трение при заполнении формы на телефоне, и чем они различаются.", [
      ul(
        "`autocomplete` — смысл поля для менеджера автозаполнения: подставляет данные, генерирует пароли.",
        "`inputmode` — раскладка экранной клавиатуры (цифры, телефон, адрес почты).",
        "`enterkeyhint` — подпись клавиши Enter («Далее», «Готово», «Найти»).",
      ),
      p("Все три — подсказки платформе: они не меняют формат значения и не заменяют `type`/валидацию, но сокращают число нажатий и ошибок."),
    ], ["Названо назначение каждого атрибута", "Отмечено, что это подсказки, а не проверка", "Указан эффект на мобильных"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.form-ux-autocomplete.m1", "intermediate", "Для чего нужен префикс `billing` в `autocomplete=\"billing street-address\"`?", ["Для отправки на другой адрес", "Чтобы браузер подставил платёжный адрес, а не адрес доставки", "Чтобы скрыть поле", "Чтобы включить проверку"], 1, "Префиксы `shipping`/`billing` различают два набора однотипных полей в одной форме."),
    mcq("html.form-ux-autocomplete.m2", "advanced", "Почему на iOS поля с шрифтом меньше 16px вызывают проблему?", ["Они не отображаются", "Браузер увеличивает страницу при фокусе", "Они не принимают цифры", "Они не отправляются"], 1, "Safari на iOS приближает страницу при фокусе на полях с мелким шрифтом, что ломает вёрстку и ввод."),
    mcq("html.form-ux-autocomplete.m3", "advanced", "Что в первую очередь нужно для работы менеджера паролей в SPA?", ["Только `fetch` без формы", "Настоящая форма с `username`/`password`, кнопкой отправки и сменой состояния страницы", "`autocomplete=\"off\"`", "Скрытая iframe"], 1, "Менеджеры опознают форму по структуре и ожидают признаки успешной отправки."),
    open("html.form-ux-autocomplete.m4", "advanced", "Продакт-менеджер просит добавить ещё одно поле «Повторите e-mail» и запретить вставку, чтобы «исключить опечатки». Что вы ответите и что предложите?", [
      ul(
        "Блокировка вставки ухудшает доступность (WCAG 3.3.8) и мешает менеджерам паролей и автозаполнению.",
        "Повтор почты не гарантирует отсутствие опечатки (её повторяют при вставке) и увеличивает число полей — снижает конверсию.",
        "Надёжное подтверждение — письмо со ссылкой/кодом; плюс `type=\"email\"`, `autocomplete=\"email\"` и подсказки (например, «Вы имели в виду gmail.com?»).",
      ),
      p("Предложение: одно поле, автозаполнение, понятная ошибка и письмо-подтверждение; метрики конверсии и ошибок — как проверка гипотезы."),
    ], ["Названа блокировка вставки и доступность", "Названо снижение конверсии", "Предложено подтверждение письмом и метрики"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.form-ux-autocomplete.f1", front: "Токен для нового пароля?", back: "`autocomplete=\"new-password\"`; для входа — `current-password`, логин — `username`." },
    { id: "html.form-ux-autocomplete.f2", front: "Как оформить код из SMS?", back: "Одно поле: `inputmode=\"numeric\"`, `autocomplete=\"one-time-code\"`, `pattern=\"[0-9]{6}\"`." },
    { id: "html.form-ux-autocomplete.f3", front: "`inputmode` vs `type`?", back: "`inputmode` — только раскладка клавиатуры; `type` — формат, проверка, поведение." },
    { id: "html.form-ux-autocomplete.f4", front: "SC 3.3.7?", back: "Redundant Entry: не требовать повторно ввода уже введённого (подставлять или давать выбрать)." },
    { id: "html.form-ux-autocomplete.f5", front: "Префиксы адресов?", back: "`shipping`, `billing`: `autocomplete=\"billing postal-code\"`." },
    { id: "html.form-ux-autocomplete.f6", front: "Что не делать с вставкой?", back: "Не блокировать: ломает менеджеры паролей, нарушает SC 3.3.8 и снижает безопасность." },
  ],

  sources: [
    { title: "HTML Living Standard — Autofill", url: "https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill", publisher: "WHATWG" },
    { title: "MDN: autocomplete attribute", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete", publisher: "MDN" },
    { title: "MDN: inputmode", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode", publisher: "MDN" },
    { title: "MDN: enterkeyhint", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint", publisher: "MDN" },
    { title: "Understanding SC 1.3.5: Identify Input Purpose", url: "https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html", publisher: "W3C" },
    { title: "Understanding SC 3.3.7: Redundant Entry", url: "https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html", publisher: "W3C" },
    { title: "Understanding SC 3.3.8: Accessible Authentication (Minimum)", url: "https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html", publisher: "W3C" },
    { title: "W3C: Personal names around the world", url: "https://www.w3.org/International/questions/qa-personal-names", publisher: "W3C" },
  ],
};
