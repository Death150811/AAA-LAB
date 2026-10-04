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

export const accessibleForms: Topic = {
  id: "html.accessible-forms",
  slug: "accessible-forms",
  domain: "html",
  module: "a11y",
  title: "Доступные формы",
  titleEn: "Accessible forms: labels, instructions, groups, error summary, multi-step flows",
  summary:
    "Форма — самое частое место, где доступность решает, получит ли человек услугу. Тема объединяет метки, подсказки, группы, сообщения об ошибках, сводку ошибок и многошаговые сценарии в одну систему, соответствующую WCAG 2.2 AA, — и показывает, как проверить её скринридером.",
  minutes: 60,
  prerequisites: ["html.form-validation", "html.form-ux-autocomplete", "html.aria", "html.keyboard-focus"],
  tags: ["accessible forms", "labels", "instructions", "fieldset", "legend", "error summary", "aria-invalid", "aria-describedby", "required", "multi-step form", "WCAG 3.3.x", "status messages", "error prevention"],
  keyConcepts: [
    { term: "Три слоя поля", text: "**Имя** (метка), **описание** (подсказка и ошибка через `aria-describedby`), **состояние** (`required`, `aria-invalid`)." },
    { term: "Ошибка — это текст", text: "Сообщение об ошибке объясняет, **что не так и как исправить** (3.3.1, 3.3.3), и связано с полем. Цвет и значок — дополнение." },
    { term: "Сводка ошибок", text: "Блок вверху формы со ссылками на проблемные поля; после неудачной отправки на него переводят фокус." },
    { term: "Группы", text: "Радио и флажки — в `fieldset` с `legend`; дата из нескольких полей — тоже группа." },
    { term: "Защита от ошибок", text: "Для юридических, финансовых и необратимых действий — проверка, подтверждение или возможность отмены (3.3.4)." },
  ],
  sections: [
    section("definition", [
      def("Доступная форма", "Форма, которую можно понять, заполнить, исправить и отправить любым способом ввода (клавиатура, голос, переключатели, скринридер, увеличение) — с понятными метками, инструкциями, сообщениями об ошибках и защитой от необратимых ошибок.", "accessible form"),
      def("Сводка ошибок (error summary)", "Блок в начале страницы после неудачной отправки: заголовок, список найденных ошибок со ссылками на поля. Получает фокус, чтобы пользователь сразу узнал, что произошло, и мог быстро перейти к исправлению.", "error summary"),
      p("Предыдущие темы разбирали механику: метки, типы, ограничения, автозаполнение, ARIA и фокус. Здесь они собираются в единую **систему**, где каждое решение привязано к критерию WCAG и проверяется конкретным сценарием."),
    ]),

    section("why", [
      h("Форма — это «касса» сайта"),
      p("Заказ, регистрация, оплата, запись к врачу, подача документов — всё проходит через формы. Недоступная форма означает отказ в услуге: человек не может купить, подать заявку, получить помощь. Именно формы чаще всего становятся предметом жалоб и юридических претензий."),
      h("Какие барьеры возникают"),
      ul(
        "**Без метки:** скринридер говорит «поле ввода» — непонятно, что вводить.",
        "**Ошибка только красным:** человек с нарушением цветовосприятия или скринридера не знает, что что-то пошло не так.",
        "**Ошибка не связана с полем:** сообщение «Неверный формат» висит где-то выше или ниже.",
        "**Фокус потерян после ошибки:** пользователь клавиатуры оказывается на `<body>` и не понимает, куда идти.",
        "**Тайм-аут без предупреждения:** на заполнение уходит больше времени, чем у остальных, и сессия истекает.",
        "**Капча и тесты на запоминание:** барьер для людей с когнитивными и визуальными нарушениями.",
      ),
      insight("Хорошая форма отвечает на четыре вопроса пользователя: **что вводить**, **как вводить**, **что пошло не так** и **что делать дальше**. Каждый ответ должен быть и виден, и программно связан с полем."),
    ]),

    section("mental-model", [
      p("Представьте диалог с **вежливым оператором**: он называет вопрос («Ваша почта»), при необходимости поясняет («Например, name@example.com»), а услышав странный ответ, не говорит «ошибка», а объясняет, что именно не так, и предлагает исправить. Скринридер — это и есть такой оператор; ваша разметка пишет для него «сценарий»."),
      diagram(
        `
        Поле  =  имя (label)  +  описание (hint, error)  +  состояние (required, invalid)
                      │                    │                          │
                  <label for>        aria-describedby            required, aria-invalid

        скринридер:  «Почта, поле редактирования, обязательное, недопустимое значение,
                      Например name@example.com. Введите адрес в формате name@example.com»
        `,
        "Что слышит пользователь на поле",
      ),
      table(
        ["Критерий WCAG", "Требование", "Как выполняется в форме"],
        [
          ["1.3.1 Info and Relationships (A)", "Структура и связи видны программно", "`label`, `fieldset`/`legend`, `aria-describedby`"],
          ["2.4.6 Headings and Labels (AA)", "Метки описывают назначение", "Короткие понятные подписи"],
          ["3.3.1 Error Identification (A)", "Ошибка определена и описана текстом", "Сообщение рядом с полем + сводка"],
          ["3.3.2 Labels or Instructions (A)", "Есть метки и инструкции", "Видимая метка, формат, обязательность"],
          ["3.3.3 Error Suggestion (AA)", "Предложен способ исправления", "«Введите 6 цифр» вместо «Неверно»"],
          ["3.3.4 Error Prevention (AA)", "Защита юридических/финансовых/данных", "Проверка, подтверждение, отмена"],
          ["1.3.5 Identify Input Purpose (AA)", "Назначение полей определяется", "`autocomplete`"],
          ["3.3.7 / 3.3.8 (A / AA)", "Не вводить дважды; доступная аутентификация", "Подстановка, вставка, менеджеры паролей"],
          ["4.1.3 Status Messages (AA)", "Статусы объявляются без фокуса", "`role=\"status\"` / `role=\"alert\"`"],
        ],
        "Критерии, которые вы закрываете формой",
      ),
    ]),

    section("technical", [
      h("Метки и инструкции"),
      ul(
        "**Видимая `<label>` у каждого поля** (см. тему «Элементы управления»); `placeholder` — только пример.",
        "**Метка короткая и однозначная:** «Почта», а не «Введите, пожалуйста, ваш адрес электронной почты, на который…».",
        "**Инструкции — до поля,** чтобы их услышали до ввода: формат, ограничения, зачем нужно поле. Связывайте через `aria-describedby`.",
        "**Обязательность:** используйте `required` (скринридер объявит «обязательное»), а визуально отметьте текстом «(обязательно)» или «*» с пояснением в начале формы. Если обязательны почти все поля, отмечайте **необязательные**.",
        "**Единый стиль** меток и подсказок по всему сайту (3.2.4 Consistent Identification).",
      ),
      h("Группы"),
      ul(
        "**Радио и флажки:** `<fieldset>` + `<legend>` с вопросом («Способ доставки»).",
        "**Составные поля:** дата из трёх полей (день, месяц, год), адрес из нескольких — тоже группа с `legend`.",
        "**Подсказка для группы:** `aria-describedby` на `fieldset` указывает на текст подсказки или ошибки.",
        "**Короткая легенда:** скринридеры повторяют её перед каждым элементом группы.",
      ),
      code(
        "html",
        `
        <fieldset aria-describedby="birth-hint birth-error">
          <legend>Дата рождения</legend>
          <p id="birth-hint">Например: 27 3 1987</p>
          <p id="birth-error" class="error"><span class="visually-hidden">Ошибка:</span> Дата рождения должна быть в прошлом</p>
          <label>День   <input name="bday-day"   inputmode="numeric" autocomplete="bday-day"   size="2" maxlength="2"></label>
          <label>Месяц  <input name="bday-month" inputmode="numeric" autocomplete="bday-month" size="2" maxlength="2"></label>
          <label>Год    <input name="bday-year"  inputmode="numeric" autocomplete="bday-year"  size="4" maxlength="4"></label>
        </fieldset>
        `,
        { caption: "Дата из трёх полей: группа, подсказка и ошибка группы. Такой подход используют государственные сервисы, например GOV.UK." },
      ),
      h("Сообщения об ошибках"),
      ol(
        "**Текст, а не только цвет или значок.** Добавьте слово «Ошибка:» (можно визуально скрытое) перед текстом.",
        "**Что не так + как исправить.** «Введите адрес почты в формате name@example.com».",
        "**Рядом с полем и до него в порядке чтения** (чтобы услышать до ввода), либо сразу после метки.",
        "**Программная связь:** `aria-describedby=\"field-hint field-error\"` на поле и `aria-invalid=\"true\"`.",
        "**Снять `aria-invalid` и ошибку** при исправлении, не дожидаясь отправки.",
        "**Не полагайтесь на `aria-errormessage`:** поддержка вспомогательными технологиями неравномерна; `aria-describedby` работает надёжнее.",
        "**Уникальные сообщения:** «Это поле обязательно» у десяти полей — не помощь. Включайте имя поля («Укажите фамилию»).",
      ),
      h("Сводка ошибок"),
      ul(
        "**Расположение:** вверху формы (или страницы после перезагрузки), до самой формы.",
        "**Фокус:** после неудачной отправки переведите на сводку (`tabindex=\"-1\"` и `role=\"alert\"` либо `focus()` из скрипта; при перезагрузке страницы — автоматически при загрузке).",
        "**Содержимое:** заголовок («Исправьте ошибки в форме»), список ссылок `<a href=\"#id-поля\">Текст ошибки</a>`.",
        "**Ссылки ведут на поля** (для групп — на первое поле группы), чтобы человек мог перейти без поиска.",
        "**Заголовок страницы:** добавьте «Ошибка:» в `<title>`: пользователь скринридера сразу услышит результат перезагрузки.",
      ),
      h("Сообщения о статусе"),
      ul(
        "Успех отправки, число найденных результатов, загрузка файла — через `role=\"status\"` (4.1.3). Область создаётся заранее.",
        "Критичные ошибки, не связанные с полем (сбой сохранения) — `role=\"alert\"`.",
        "После перезагрузки страницы успех подтверждается заголовком и текстом страницы, фокус — на заголовке.",
      ),
      h("Защита от ошибок (3.3.4)"),
      ul(
        "**Для юридических, финансовых действий и изменения/удаления данных** должно быть хотя бы одно из: возможность **отмены** (отозвать), **проверка** с возможностью исправить, **подтверждение** (экран «Проверьте данные» перед отправкой).",
        "**Опасные кнопки** («Удалить») — подтверждение, а безопасный вариант — выбор по умолчанию.",
        "**Многошаговые формы:** шаг «Проверка и отправка» с возможностью вернуться к любому шагу.",
      ),
      h("Время, повтор, аутентификация"),
      ul(
        "**Тайм-ауты (2.2.1):** предупредите заранее и дайте продлить (хотя бы за 20 секунд до окончания, минимум 20 секунд на продление).",
        "**Повторный ввод (3.3.7):** не просите ввести ранее введённое; подставляйте или предлагайте выбор.",
        "**Вход (3.3.8):** разрешите вставку, менеджеры паролей, не требуйте расшифровки символов; для капчи — альтернативы.",
        "**Единая помощь (3.2.6):** контакты и справка находятся на одном месте во всех шагах.",
      ),
      h("Многошаговые формы"),
      ul(
        "**Индикатор шагов:** `<ol>` с `aria-current=\"step\"` на текущем шаге; шаг в заголовке («Шаг 2 из 4: Адрес»).",
        "**Заголовок шага** — `h2`, и на него переносится фокус при переходе.",
        "**Сохранение введённого** между шагами и при возврате назад.",
        "**Валидация шага** перед переходом; ошибки — со сводкой и фокусом.",
        "**Шаг «Проверка»** со ссылками «Изменить» у каждого блока.",
      ),
      h("Кастомные элементы управления"),
      ul(
        "**Переключатель (switch):** нативный `<input type=\"checkbox\" role=\"switch\">` допустим и наследует клавиатуру.",
        "**Календарь:** нативный `type=\"date\"` или три поля. Самодельный календарь — отдельный сложный паттерн (APG), требует много тестов.",
        "**Загрузка файлов:** нативный `input type=\"file\"` стилизуется через метку; перетаскивание — дополнение, а не замена (2.5.7 Dragging Movements).",
        "**Ползунки:** `type=\"range\"` + `<output>`; для точных значений — рядом числовое поле.",
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <form action="/consult" method="post" novalidate>
          <p class="note">Поля, отмеченные «обязательно», нужно заполнить.</p>

          <div class="field">
            <label for="name">Имя <span class="req">(обязательно)</span></label>
            <input id="name" name="name" autocomplete="name" required aria-describedby="name-hint">
            <p id="name-hint" class="hint">Как к вам обращаться</p>
          </div>

          <div class="field">
            <label for="email">Почта <span class="req">(обязательно)</span></label>
            <input id="email" name="email" type="email" autocomplete="email" required
                   aria-describedby="email-hint">
            <p id="email-hint" class="hint">Например, name@example.com</p>
          </div>

          <fieldset>
            <legend>Удобный способ связи <span class="req">(обязательно)</span></legend>
            <label><input type="radio" name="via" value="email" required> Почта</label>
            <label><input type="radio" name="via" value="phone"> Телефон</label>
          </fieldset>

          <div class="field">
            <label for="msg">Сообщение <span class="opt">(необязательно)</span></label>
            <textarea id="msg" name="message" rows="4"></textarea>
          </div>

          <button type="submit">Отправить заявку</button>
        </form>
        `,
        { lineNumbers: true, filename: "consult-form.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <form id="f" novalidate>
          <div id="summary" role="alert" tabindex="-1" hidden>
            <h2>Исправьте ошибки</h2>
            <ul id="list"></ul>
          </div>

          <p>
            <label for="email">Почта</label><br>
            <input id="email" type="email" required aria-describedby="email-error">
            <span id="email-error" hidden></span>
          </p>
          <button>Отправить</button>
        </form>

        <script>
          const f = document.getElementById("f");
          const email = document.getElementById("email");
          const err = document.getElementById("email-error");
          const summary = document.getElementById("summary");
          const list = document.getElementById("list");

          f.addEventListener("submit", (e) => {
            e.preventDefault();
            const ok = email.validity.valid;
            err.hidden = ok;
            err.textContent = ok ? "" : "Ошибка: введите адрес почты в формате name@example.com";
            email.setAttribute("aria-invalid", String(!ok));
            summary.hidden = ok;
            list.replaceChildren();
            if (!ok) {
              const a = document.createElement("a");
              a.href = "#email";
              a.textContent = "Введите адрес почты в формате name@example.com";
              const li = document.createElement("li");
              li.append(a);
              list.append(li);
              summary.focus();
            }
            console.log(ok ? "форма корректна" : "ошибка → фокус на сводке, aria-invalid=true");
          });
        </script>
        `,
        { runnable: true },
      ),
      p("Отправьте форму пустой: фокус уйдёт на сводку ошибок, а ссылка в ней приведёт к полю. Это минимальная версия паттерна: ошибка в тексте, связь с полем (`aria-describedby`), состояние (`aria-invalid`) и управление фокусом."),
    ]),

    section("detailed-example", [
      p("Так выглядит форма **после неудачной отправки**, когда страницу отрисовал сервер (работает без JavaScript). Обратите внимание на `title` с префиксом «Ошибка:», сводку со ссылками, сообщения у полей и ошибку группы радиокнопок."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <title>Ошибка: Заявка на консультацию — Студия</title>
        </head>
        <body>
          <main>
            <div id="error-summary" role="alert" tabindex="-1" aria-labelledby="err-title">
              <h2 id="err-title">Исправьте ошибки в форме</h2>
              <ul>
                <li><a href="#email">Введите адрес почты в формате name@example.com</a></li>
                <li><a href="#via-email">Выберите удобный способ связи</a></li>
              </ul>
            </div>

            <h1>Заявка на консультацию</h1>

            <form action="/consult" method="post" novalidate>
              <div class="field field--error">
                <label for="email">Почта <span class="req">(обязательно)</span></label>
                <p id="email-hint" class="hint">Например, name@example.com</p>
                <p id="email-error" class="error"><span class="visually-hidden">Ошибка:</span> Введите адрес почты в формате name@example.com</p>
                <input id="email" name="email" type="email" value="ivan@" autocomplete="email"
                       aria-describedby="email-hint email-error" aria-invalid="true">
              </div>

              <fieldset class="field--error" aria-describedby="via-error">
                <legend>Удобный способ связи <span class="req">(обязательно)</span></legend>
                <p id="via-error" class="error"><span class="visually-hidden">Ошибка:</span> Выберите удобный способ связи</p>
                <label><input id="via-email" type="radio" name="via" value="email"> Почта</label>
                <label><input type="radio" name="via" value="phone"> Телефон</label>
              </fieldset>

              <button type="submit">Отправить заявку</button>
            </form>
          </main>

          <script>document.getElementById("error-summary").focus();</script>
        </body>
        </html>
        `,
        { lineNumbers: true, filename: "consult-error.html", collapsed: true },
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <div id="error-summary" role="alert" tabindex="-1">
        <li><a href="#email">Введите адрес почты в формате name@example.com</a></li>
        <label for="email">Почта <span class="req">(обязательно)</span></label>
        <p id="email-error"><span class="visually-hidden">Ошибка:</span> Введите адрес…</p>
        <input id="email" type="email" aria-describedby="email-hint email-error" aria-invalid="true">
        <fieldset aria-describedby="via-error">
        `,
        [
          { line: 1, text: "Сводка получает `tabindex=\"-1\"`, чтобы принять фокус программно, а `role=\"alert\"` заставит скринридер объявить заголовок и список при появлении. Одно из двух (перенос фокуса или `alert`) часто достаточно — проверьте, чтобы сводка не читалась дважды." },
          { line: 2, text: "Каждая ошибка — **ссылка** на поле. Для группы радио ссылка ведёт на первую радиокнопку." },
          { line: 3, text: "Метка с пометкой «(обязательно)»: текстовое обозначение не зависит от цвета и доступно всем." },
          { line: 4, text: "Скрытое слово «Ошибка:» озвучивается перед текстом сообщения — пользователь скринридера сразу понимает, что это ошибка, а не подсказка." },
          { line: 5, text: "`aria-describedby` перечисляет подсказку и ошибку в нужном порядке; `aria-invalid=\"true\"` сообщает, что значение недопустимо. После исправления состояние нужно снять." },
          { line: 6, text: "У группы своё описание: ошибка выбора относится к набору радиокнопок, а не к одной из них." },
        ],
        "error-state.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Фокус на поле", "Скринридер вычисляет доступное имя из метки, роль из `type`, состояние (`required`, `aria-invalid`) и описание из `aria-describedby`, и объявляет их в порядке: имя → роль → состояние → описание."],
          ["Группа", "При входе в `fieldset` технологии объявляют имя группы (`legend`) и её описание; затем имя и роль каждого элемента внутри. Длинные `legend` повторяются многословно."],
          ["Отправка с ошибками", "Если используется нативная проверка, браузер показывает свой пузырёк у первого невалидного поля. При собственных сообщениях (`novalidate`) вы отвечаете за показ ошибок, фокус и объявления."],
          ["Сводка и фокус", "Перенос фокуса на сводку заставляет скринридер прочитать её содержимое; ссылки внутри позволяют быстро перейти к полю. Заголовок страницы с «Ошибка:» читается первым при перезагрузке."],
          ["Живые области", "`role=\"alert\"` и `role=\"status\"` создают события в дереве доступности; браузер передаёт их скринридеру, и тот объявляет текст — прерывая речь (`alert`) или дожидаясь паузы (`status`)."],
          ["Состояние после исправления", "Когда значение стало допустимым, `aria-invalid` меняется на `false`, а сообщение скрывается; изменения вспомогательные технологии отслеживают через события атрибутов и дерева."],
        ],
        "Что происходит при заполнении формы",
      ),
      note("Лучший способ узнать, как форма «звучит», — включить скринридер и пройти её. NVDA (Windows) и VoiceOver (macOS) бесплатны. Запишите, что слышите на каждом поле; это и есть тестовый протокол."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Ошибка только цветом"),
      wrongRight(
        "html",
        {
          code: `
            <input id="email" class="invalid" value="ivan@">
            <style>.invalid { border: 2px solid red; }</style>
          `,
          note: "Нет текста, нет связи с полем, нет состояния: скринридер молчит; человеку с нарушением цветовосприятия рамка не видна.",
        },
        {
          code: `
            <label for="email">Почта</label>
            <p id="email-error"><span class="visually-hidden">Ошибка:</span> Введите адрес в формате name@example.com</p>
            <input id="email" value="ivan@" aria-invalid="true" aria-describedby="email-error">
          `,
          note: "Текст, связь и состояние; цвет — лишь дополнительный сигнал.",
        },
      ),
      h("Ошибка 2. Сообщение не связано с полем"),
      p("Текст «Неверный формат» рядом с полем визуально понятен, но без `aria-describedby` скринридер читает поле без пояснения. Свяжите."),
      h("Ошибка 3. Фокус потерян после отправки"),
      p("После клика «Отправить» страница показала ошибки, но фокус остался на кнопке или на `body`. Перенесите его на сводку или первое проблемное поле."),
      h("Ошибка 4. Радио и флажки без группы"),
      p("«Курьер», «Самовывоз» без вопроса — нечего выбирать. Нужны `fieldset` и `legend`."),
      h("Ошибка 5. Неинформативные сообщения"),
      ul(
        "«Ошибка», «Неверное значение», «Заполните поле» у десяти полей подряд.",
        "Сообщения на техническом языке («Regex mismatch», «400 Bad Request»).",
        "Обвинения: «Вы ввели неверный пароль» — лучше «Пароль должен содержать не менее 10 символов».",
      ),
      h("Ошибка 6. `disabled` вместо объяснения"),
      p("Серая недоступная кнопка «Отправить» без пояснения оставляет человека в тупике. Оставьте её активной, а при нажатии покажите, что не заполнено."),
      h("Ошибка 7. Тайм-аут без предупреждения"),
      p("Сессия завершается через 10 минут, пользователь только начал заполнять длинную форму — и теряет всё. Предупреждайте и позволяйте продлить (2.2.1)."),
      h("Ошибка 8. Очистка формы при ошибке"),
      p("После серверной ошибки поля пусты. Возвращайте введённые значения (кроме паролей и данных карт) и фокус на проблему."),
    ]),

    section("antipatterns", [
      ul(
        "**Всплывающие подсказки об ошибках, исчезающие через несколько секунд.**",
        "**Валидация на `blur` с перехватом фокуса:** пользователь не может уйти из поля.",
        "**`alert()`** со списком ошибок.",
        "**Единая красная «плашка» «Форма содержит ошибки»** без указания, какие именно.",
        "**Капча без альтернатив** (аудио, логические вопросы, доверенные устройства).",
        "**Двойной ввод почты и пароля** как «защита» от опечаток.",
        "**Скрытый `label`** (`display: none`): имя пропадает; используйте приём `.visually-hidden`.",
        "**`aria-live=\"assertive\"` на каждом поле** — каждое нажатие клавиши перебивает чтение.",
        "**Кастомный выпадающий список вместо `select`** без клавиатурной модели APG.",
        "**Разделение номера карты/телефона на множество полей.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Каждому полю — видимая метка;** подсказки формата — до поля и через `aria-describedby`.",
        "**Обязательность — словами и атрибутом `required`;** необязательные поля помечайте, если обязательных большинство.",
        "**Группы — в `fieldset`/`legend`,** подсказки и ошибки группы — через `aria-describedby` на `fieldset`.",
        "**Ошибки: что не так + как исправить;** текст рядом с полем и в сводке; `aria-invalid` и снятие после исправления.",
        "**Сводка ошибок со ссылками и фокусом;** `title` с префиксом «Ошибка:».",
        "**Статусы через `role=\"status\"`,** срочное — `role=\"alert\"`; контейнеры создавайте заранее.",
        "**Защита от ошибок:** подтверждение или отмена для необратимых действий; экран проверки в конце длинных форм.",
        "**Не вводить дважды, разрешить вставку и менеджеры паролей;** тайм-ауты — с предупреждением.",
        "**Тестируйте реальным сценарием:** только клавиатура → скринридер → масштаб 200% → голосовое управление («нажми Отправить»).",
        "**Опирайтесь на проверенные системы:** GOV.UK Design System, USWDS, компоненты вашей дизайн-системы с аудитом доступности.",
      ),
    ]),

    section("edge-cases", [
      h("Скринридер читает ошибки дважды"),
      p("Если сводка имеет `role=\"alert\"` и одновременно получает фокус, часть скринридеров прочтёт её дважды. Выберите один подход (фокус на сводке с заголовком — самый предсказуемый) и проверьте в целевых технологиях."),
      h("Ошибки в динамических формах"),
      p("Если ошибки появляются без перезагрузки, сводку нужно создать в DOM и перенести фокус. Если сводки нет, а ошибка относится к текущему полю, достаточно `aria-describedby` и `role=\"status\"` для короткого объявления; не переносите фокус, пока пользователь печатает."),
      h("Валидация в реальном времени"),
      p("Проверка при вводе («достаточно ли надёжен пароль») должна быть доступна всем: показывайте текст и объявляйте итог через живую область с задержкой, а не каждый символ. Индикатор «надёжности» только цветом недопустим."),
      h("Подсказки в `title` и «тултипы»"),
      p("Подсказки по наведению недоступны на сенсорных устройствах и клавиатуре; информация критичного уровня (формат, ограничения) должна быть видимым текстом. Для необязательных деталей — кнопка «Подробнее» с раскрытием, а не hover."),
      h("Скрытые поля и условные блоки"),
      p("Поля, которые появляются в зависимости от выбора (например, «Другое» → текстовое поле), должны быть доступны сразу после выбора: фокус остаётся на выбранном элементе, а новое поле идёт следом в порядке DOM; объявите появление (`aria-expanded` и связь через `aria-controls`)."),
      h("Календарь и выбор диапазона"),
      p("Самодельные календари — сложнейший паттерн: клавиатура, объявление дат, диапазоны, локализация. Предпочитайте нативные `date`, три поля или проверенные библиотеки."),
      h("Языки справа налево и международные данные"),
      p("Для RTL-языков используйте `dir=\"auto\"` или `dir=\"rtl\"`; для имён и адресов — гибкие форматы. Следите за `lang` у полей с вводом на другом языке (3.1.2)."),
      h("Длинные формы"),
      p("Разбейте на логические блоки с заголовками (`h2`) и `fieldset`; сохраняйте черновик; позволяйте вернуться и изменить. Это уменьшает нагрузку и снижает долю ошибок."),
    ]),

    section("related", [
      ul(
        "[Элементы управления](/learn/html/form-controls) — `label`, `fieldset`, `select`, кнопки.",
        "[Валидация форм](/learn/html/form-validation) — Constraint Validation API, `:user-invalid`, `setCustomValidity`.",
        "[Автозаполнение и UX](/learn/html/form-ux-autocomplete) — `autocomplete`, 3.3.7 и 3.3.8.",
        "[ARIA](/learn/html/aria) — `aria-describedby`, `aria-invalid`, живые области.",
        "[Клавиатура и фокус](/learn/html/keyboard-focus) — перенос фокуса на сводку и поля.",
        "[Типичные провалы доступности](/learn/html/a11y-failures) — разбор ошибок на реальных паттернах.",
        "Из других курсов: **JS** — события формы, `FormData`; **Безопасность** — серверная валидация; **Дизайн** — системы GOV.UK, USWDS.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Форма «для глаз»",
          code: `
            <input placeholder="Почта" style="border:2px solid red">
            <div class="tip">Неверный формат</div>
            <div>Способ связи</div>
            <input type="radio" name="v"> Почта <input type="radio" name="v"> Телефон
            <div class="btn" onclick="send()">Отправить</div>
          `,
          note: "Нет метки, ошибка не связана и передана только цветом; группа без `fieldset`; кнопка из `div`.",
        },
        {
          title: "Форма, которую слышно и можно использовать",
          code: `
            <label for="email">Почта <span class="req">(обязательно)</span></label>
            <p id="email-error"><span class="visually-hidden">Ошибка:</span> Введите адрес в формате name@example.com</p>
            <input id="email" type="email" required aria-invalid="true" aria-describedby="email-error">
            <fieldset>
              <legend>Способ связи</legend>
              <label><input type="radio" name="v" value="e"> Почта</label>
              <label><input type="radio" name="v" value="p"> Телефон</label>
            </fieldset>
            <button type="submit">Отправить</button>
          `,
          note: "Метка, связанная ошибка с текстом, группа с вопросом и настоящая кнопка.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.accessible-forms.ex1",
      title: "Аудит меток и ошибок",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждого фрагмента скажите, что услышит пользователь скринридера (или чего не услышит), и как исправить:"),
        ol(
          "`<input placeholder=\"Телефон\">`",
          "`<label>Имя</label><input id=\"n\">`",
          "`<input id=\"e\" type=\"email\" style=\"border:2px solid red\">` (без текста ошибки)",
          "`<div>Доставка</div><input type=\"radio\" name=\"d\"> Курьер <input type=\"radio\" name=\"d\"> Самовывоз`",
          "`<label for=\"p\">Пароль</label><input id=\"p\" type=\"password\" aria-describedby=\"hint\">` при отсутствии элемента с `id=\"hint\"`",
          "`<button disabled>Оплатить</button>` без пояснения",
        ),
      ],
      hints: ["Работает ли `placeholder` как имя?", "Связана ли метка с полем?", "Есть ли элемент для `aria-describedby`?"],
      checks: ["Указано, что имя у поля отсутствует или нет описания", "Предложено исправление для каждого"],
      solution: [
        ol(
          "Имя в лучшем случае берётся из `placeholder`: нестабильно и пропадает при вводе. Нужна видимая `<label>`.",
          "Метка без `for` и без вложенности не связана с полем — скринридер читает «поле ввода». Добавить `for=\"n\"`.",
          "Скринридер не знает об ошибке, рамка — только цвет. Добавить текст ошибки, `aria-describedby` и `aria-invalid=\"true\"`.",
          "«Доставка» — просто текст; радиокнопки без имени группы и без отдельных меток. Использовать `fieldset`/`legend` и `label` для каждой.",
          "Ссылка `aria-describedby` указывает в пустоту — описание не будет прочитано. Создать элемент с `id=\"hint\"` или убрать атрибут.",
          "Кнопка недоступна, причина неизвестна. Оставить кнопку активной, а при нажатии показать, что нужно заполнить; либо добавить рядом текст-объяснение.",
        ),
      ],
    }),
    exercise({
      id: "html.accessible-forms.ex2",
      title: "Страница с ошибками, отрисованная сервером",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Составьте HTML страницы «Запись к врачу» **после неудачной отправки**: поля «ФИО» (обязательно), «Телефон» (обязательно, введено `12345`), группа радио «Тип приёма» (не выбран), дата визита (введена прошедшая дата). Нужны: `title` с «Ошибка:», сводка ошибок со ссылками и фокусом, сообщения рядом с полями, `aria-invalid`, `aria-describedby`, ошибка группы, возврат введённых значений. Скрипт — только для фокуса сводки."),
      ],
      hints: ["Куда ведёт ссылка для группы радио?", "Что будет в `value` у поля телефона?", "Нужно ли JS для сообщений?"],
      checks: ["`title` содержит «Ошибка:»", "Сводка со ссылками на поля", "Каждая ошибка связана с полем", "Введённые значения сохранены"],
      solution: [
        code(
          "html",
          `
          <!doctype html>
          <html lang="ru">
          <head>
            <meta charset="utf-8">
            <title>Ошибка: Запись к врачу — Клиника</title>
          </head>
          <body>
            <main>
              <div id="error-summary" role="alert" tabindex="-1" aria-labelledby="err-title">
                <h2 id="err-title">Исправьте ошибки в форме</h2>
                <ul>
                  <li><a href="#fio">Укажите фамилию, имя и отчество</a></li>
                  <li><a href="#phone">Введите телефон полностью: не менее 10 цифр</a></li>
                  <li><a href="#type-first">Выберите тип приёма</a></li>
                  <li><a href="#date">Выберите дату не раньше сегодняшней</a></li>
                </ul>
              </div>

              <h1>Запись к врачу</h1>
              <form action="/appointment" method="post" novalidate>
                <div>
                  <label for="fio">ФИО <span class="req">(обязательно)</span></label>
                  <p id="fio-error"><span class="visually-hidden">Ошибка:</span> Укажите фамилию, имя и отчество</p>
                  <input id="fio" name="fio" value="" autocomplete="name" aria-describedby="fio-error" aria-invalid="true">
                </div>

                <div>
                  <label for="phone">Телефон <span class="req">(обязательно)</span></label>
                  <p id="phone-hint">Не менее 10 цифр, например 9161234567</p>
                  <p id="phone-error"><span class="visually-hidden">Ошибка:</span> Введите телефон полностью: не менее 10 цифр</p>
                  <input id="phone" name="phone" type="tel" value="12345" autocomplete="tel" aria-describedby="phone-hint phone-error" aria-invalid="true">
                </div>

                <fieldset aria-describedby="type-error">
                  <legend>Тип приёма <span class="req">(обязательно)</span></legend>
                  <p id="type-error"><span class="visually-hidden">Ошибка:</span> Выберите тип приёма</p>
                  <label><input id="type-first" type="radio" name="type" value="first"> Первичный</label>
                  <label><input type="radio" name="type" value="repeat"> Повторный</label>
                </fieldset>

                <div>
                  <label for="date">Дата визита <span class="req">(обязательно)</span></label>
                  <p id="date-error"><span class="visually-hidden">Ошибка:</span> Выберите дату не раньше сегодняшней</p>
                  <input id="date" name="date" type="date" value="2024-01-10" aria-describedby="date-error" aria-invalid="true">
                </div>

                <button type="submit">Записаться</button>
              </form>
            </main>
            <script>document.getElementById("error-summary").focus();</script>
          </body>
          </html>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        note("Дата «2024-01-10» подставлена как пример введённого значения; в реальном сервисе здесь будет то, что отправил пользователь. Для пароля и платёжных данных значения **не** возвращают."),
      ],
    }),
    exercise({
      id: "html.accessible-forms.ex3",
      title: "Форма, которую не заполнить без мыши",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Отзывы: «скринридер говорит только “поле ввода”», «после ошибки не понять, что не так», «не могу выбрать способ оплаты клавиатурой», «после отправки фокус пропадает», «ошибка исчезает за секунды». Найдите проблемы и исправьте разметку и скрипт."),
      ],
      starter: {
        lang: "html",
        code: `
          <form onsubmit="return check()">
            <input name="email" placeholder="Почта">
            <span class="err" style="display:none">Неверно</span>
            <div class="radio" onclick="pick('card')">Карта</div>
            <div class="radio" onclick="pick('cash')">Наличные</div>
            <div class="btn" onclick="submitForm()">Оплатить</div>
          </form>
          <script>
            function check() {
              const e = document.querySelector(".err");
              e.style.display = "block";
              setTimeout(() => (e.style.display = "none"), 3000);
              return false;
            }
          </script>
        `,
      },
      hints: ["Что делает `placeholder` вместо метки?", "Как связать ошибку с полем?", "Чем заменить `div` в роли радио и кнопки?", "Что делать с таймером?"],
      checks: ["Метка и `aria-describedby`", "Настоящие радиокнопки в `fieldset`", "Настоящая кнопка", "Ошибка не исчезает по таймеру; фокус управляется"],
      solution: [
        ul(
          "**`placeholder` вместо метки** → `<label for=\"email\">`.",
          "**Ошибка `Неверно`** не связана и исчезает по таймеру → текст «Введите адрес почты в формате name@example.com», `aria-describedby`, `aria-invalid`, остаётся, пока не исправлена.",
          "**`div` как радио** → `fieldset`/`legend` и `<input type=\"radio\">` с `label`.",
          "**`div` как кнопка** → `<button type=\"submit\">`.",
          "**`return false` без управления фокусом** → сводка ошибок и `focus()` на ней или на первом проблемном поле.",
        ),
        code(
          "html",
          `
          <form id="pay" novalidate>
            <div id="summary" role="alert" tabindex="-1" hidden>
              <h2>Исправьте ошибки в форме</h2>
              <ul id="summary-list"></ul>
            </div>

            <label for="email">Почта <span class="req">(обязательно)</span></label>
            <p id="email-hint">Например, name@example.com</p>
            <p id="email-error" hidden></p>
            <input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-hint email-error">

            <fieldset>
              <legend>Способ оплаты <span class="req">(обязательно)</span></legend>
              <label><input id="pay-card" type="radio" name="pay" value="card" required> Карта</label>
              <label><input type="radio" name="pay" value="cash"> Наличные</label>
            </fieldset>

            <button type="submit">Оплатить</button>
          </form>

          <script>
            const form = document.getElementById("pay");
            const email = document.getElementById("email");
            const err = document.getElementById("email-error");
            const summary = document.getElementById("summary");
            const list = document.getElementById("summary-list");

            form.addEventListener("submit", (e) => {
              const problems = [];
              if (!email.validity.valid) problems.push(["email", "Введите адрес почты в формате name@example.com"]);
              if (!form.elements.pay.value) problems.push(["pay", "Выберите способ оплаты"]);

              err.hidden = email.validity.valid;
              err.textContent = email.validity.valid ? "" : "Ошибка: введите адрес почты в формате name@example.com";
              email.setAttribute("aria-invalid", String(!email.validity.valid));

              list.replaceChildren(...problems.map(([id, text]) => {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = "#" + (id === "pay" ? "pay-card" : id);
                a.textContent = text;
                li.append(a);
                return li;
              }));
              summary.hidden = problems.length === 0;
              if (problems.length) { e.preventDefault(); summary.focus(); }
            });
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        note("Ссылка сводки на группу радио ведёт на первую радиокнопку (`#pay-card`): так пользователь попадает прямо к элементу, который нужно выбрать."),
      ],
    }),
  ],

  challenge: {
    id: "html.accessible-forms.challenge",
    title: "Многошаговая запись на услугу: шаги, ошибки и проверка",
    scenario: [
      p("Государственный сервис запускает онлайн-запись на услугу: четыре шага (Заявитель → Услуга и дата → Контакты → Проверка). Нужно соблюсти WCAG 2.2 AA. Среди пользователей — люди старшего возраста, пользователи скринридеров и мобильных устройств. Требуется сохранение введённых данных, возможность вернуться на предыдущий шаг и подтверждение перед отправкой (заявка юридически значима)."),
      p("Спроектируйте структуру страниц и компонентов: индикатор шагов, заголовки и фокус, ошибки шага, сводку, экран проверки, статусы сохранения, тайм-ауты и вход. Свяжите каждое решение с критерием WCAG."),
    ],
    requirements: [
      "Разметка индикатора шагов с `aria-current=\"step\"` и заголовки шагов",
      "Правила фокуса при переходах и при ошибках",
      "Схема сообщений об ошибках (поле, сводка, `title`)",
      "Экран проверки с возможностью исправления и подтверждением (3.3.4)",
      "Политика тайм-аутов и сохранения данных",
    ],
    constraints: [
      "Не использовать капчу без альтернативы",
      "Не просить вводить данные повторно (3.3.7)",
      "Каждое поле — видимая метка и `autocomplete` там, где применимо",
    ],
    acceptance: [
      "Каждый шаг можно пройти только с клавиатуры",
      "Ошибки перечислены в сводке со ссылками; фокус переходит на сводку",
      "Экран проверки показывает все данные со ссылками «Изменить»",
      "Пользователь предупреждён о тайм-ауте и может его продлить",
    ],
    hints: [
      "Как сообщить пользователю, где он (шаг 2 из 4)?",
      "Что должно быть в `title` страницы шага?",
      "Как сохранить данные, если пользователь вернулся назад?",
    ],
    solution: [
      table(
        ["Элемент", "Решение", "Критерий"],
        [
          ["Индикатор шагов", "`<ol>` с `aria-current=\"step\"` на текущем; текст «Шаг 2 из 4: Услуга и дата»", "1.3.1, 2.4.6"],
          ["Заголовок шага", "`h1` с названием шага; `title`: «Шаг 2 из 4: Услуга и дата — Запись»", "2.4.2, 2.4.6"],
          ["Переход между шагами", "Отдельные страницы или экраны; фокус на `h1` (`tabindex=\"-1\"`); состояние сохраняется", "2.4.3, 3.2.3"],
          ["Ошибки шага", "Сводка + сообщения у полей; `title` с «Ошибка:»", "3.3.1, 3.3.3"],
          ["Экран проверки", "Список ответов с ссылками «Изменить»; чекбокс «Данные верны»; отдельная кнопка «Отправить»", "3.3.4"],
          ["Повторный ввод", "Данные из предыдущих шагов подставляются; «Совпадает с адресом заявителя»", "3.3.7"],
          ["Тайм-аут", "Предупреждение за 2 минуты в `role=\"alert\"`-окне с кнопкой «Продлить»; черновик сохраняется", "2.2.1"],
          ["Вход", "Вставка пароля разрешена; альтернатива капче; passkey/код по SMS", "3.3.8, 1.1.1"],
          ["Помощь", "Блок «Нужна помощь?» на одном месте на всех шагах", "3.2.6"],
        ],
      ),
      code(
        "html",
        `
        <nav aria-label="Шаги записи">
          <ol class="steps">
            <li>Заявитель</li>
            <li aria-current="step"><strong>Услуга и дата</strong></li>
            <li>Контакты</li>
            <li>Проверка</li>
          </ol>
        </nav>

        <main>
          <h1 tabindex="-1">Шаг 2 из 4: Услуга и дата</h1>
          <form action="/booking/step2" method="post" novalidate>
            <label for="service">Услуга <span class="req">(обязательно)</span></label>
            <select id="service" name="service" required aria-describedby="service-error">
              <option value="">Выберите услугу</option>
              <option value="passport">Замена паспорта</option>
              <option value="license">Водительское удостоверение</option>
            </select>

            <fieldset>
              <legend>Дата визита <span class="req">(обязательно)</span></legend>
              <p id="date-hint">Например: 14 3 2026</p>
              <label>День <input name="d" inputmode="numeric" size="2" maxlength="2"></label>
              <label>Месяц <input name="m" inputmode="numeric" size="2" maxlength="2"></label>
              <label>Год <input name="y" inputmode="numeric" size="4" maxlength="4"></label>
            </fieldset>

            <a href="/booking/step1">Назад</a>
            <button type="submit">Продолжить</button>
          </form>
        </main>
        `,
        { lineNumbers: true, filename: "booking-step2.html", collapsed: true },
      ),
      ul(
        "**Заявка юридически значима** — поэтому обязательный экран проверки (3.3.4), чекбокс «Данные верны» и страница подтверждения с номером заявки; отмена или изменение доступны в личном кабинете.",
        "**Сервер** проверяет каждый шаг и всю заявку целиком; черновик хранится на сервере (с уведомлением о сроке хранения) или в `sessionStorage` — для пользователя без аккаунта.",
        "**Фокус:** при переходе на шаг — на `h1`; при ошибках — на сводку; после отправки — на `h1` страницы подтверждения; кнопка «Назад» — ссылка (навигация), а не `button`.",
        "**Проверка:** сценарий с клавиатурой от первого до последнего шага; прогон с NVDA и VoiceOver (слышны ли шаг, ошибки, подтверждение); масштаб 200% и 320 px; режим высокого контраста; ручная проверка голосовым управлением («нажми Продолжить»).",
      ),
    ],
  },

  interview: [
    iq("html.accessible-forms.i1", "basic", "Какие три вещи должен сообщать скринридер о поле формы?", [
      p("Имя (метка), роль (тип: поле редактирования, флажок, список…) и состояние (обязательное, недопустимое значение, значение, отмечен), а также описание (подсказка, ошибка) из `aria-describedby`."),
    ]),
    iq("html.accessible-forms.i2", "basic", "Как правильно оформить группу радиокнопок?", [
      p("В `<fieldset>` с `<legend>`, в котором сформулирован вопрос; у каждой кнопки — своя `<label>`; у всех — общий `name`. Ошибку выбора связывают с `fieldset` через `aria-describedby`."),
    ]),
    iq("html.accessible-forms.i3", "intermediate", "Как сделать сообщение об ошибке доступным?", [
      ul(
        "Текст (а не только цвет), понятный и подсказывающий исправление (3.3.1, 3.3.3).",
        "Связать с полем: `aria-describedby`, `aria-invalid=\"true\"`.",
        "Показать сводку ошибок со ссылками и перенести на неё фокус.",
        "Добавить «Ошибка:» в `title` при перезагрузке страницы.",
      ),
    ]),
    iq("html.accessible-forms.i4", "intermediate", "Чем сводка ошибок лучше, чем сообщения только возле полей?", [
      p("Сводка даёт общую картину («у вас четыре ошибки») и быстрые ссылки к полям — особенно важна на длинных формах и для пользователей скринридеров и клавиатуры, которым нелегко «увидеть» всю страницу. Сообщения у полей сохраняются как контекстные подсказки."),
    ]),
    iq("html.accessible-forms.i5", "intermediate", "Что требует WCAG 3.3.4 (Error Prevention) и как выполнить его в платёжной форме?", [
      p("Для юридических, финансовых действий и изменения/удаления данных нужно предоставить хотя бы одно: отмену, проверку с возможностью исправления или подтверждение. На практике — экран «Проверьте заказ» перед оплатой с возможностью вернуться, подтверждение и письмо с возможностью отмены в течение срока."),
    ]),
    iq("html.accessible-forms.i6", "advanced", "Как правильно реализовать многошаговую форму с точки зрения доступности?", [
      ul(
        "Индикатор шагов в `ol` с `aria-current=\"step\"`; шаг в заголовке и `title`.",
        "Перенос фокуса на заголовок шага; сохранение введённого; валидация шага перед переходом.",
        "Сводка ошибок и экран проверки с ссылками «Изменить».",
        "Не вводить данные повторно (3.3.7); предупредить о тайм-ауте (2.2.1).",
      ),
    ]),
    iq("html.accessible-forms.i7", "engineering", "Как встроить проверки доступности форм в разработку, чтобы они не деградировали?", [
      ul(
        "Единый компонент поля (метка, подсказка, ошибка, связи), который трудно использовать неправильно.",
        "Линтеры и axe в CI на страницах с формами; e2e-тесты с клавиатурой и проверкой фокуса.",
        "Чек-лист ревью: метка, `autocomplete`, ошибки, сводка, порядок фокуса.",
        "Регулярный ручной тест скринридером для ключевых форм; сбор обратной связи.",
      ),
    ]),
    iq("html.accessible-forms.i8", "debugging", "Пользователи скринридера говорят: «после отправки с ошибками ничего не происходит». Как диагностировать?", [
      ul(
        "Проверить, куда уходит фокус после отправки; если на `body` — перенести на сводку или первое поле.",
        "Убедиться, что сводка видима и доступна (`hidden` снят), имеет `tabindex=\"-1\"`, заголовок и ссылки.",
        "Проверить, что ошибки связаны с полями (`aria-describedby`, `aria-invalid`) и что есть текст, а не только цвет.",
        "Протестировать в NVDA/VoiceOver; при двойном чтении убрать лишний механизм (`alert` либо фокус).",
      ),
    ]),
  ],

  exam: [
    mcq("html.accessible-forms.e1", "foundation", "Какой критерий WCAG требует описывать ошибку текстом?", ["1.4.3", "3.3.1 Error Identification", "2.4.7", "4.1.1"], 1, "3.3.1 требует определить ошибку и описать её в тексте; цвета и значка недостаточно."),
    mcq("html.accessible-forms.e2", "foundation", "Какой атрибут связывает сообщение об ошибке с полем?", ["`for`", "`aria-describedby`", "`name`", "`aria-label`"], 1, "`aria-describedby` указывает на элемент с описанием; скринридер читает его после имени и роли."),
    mcq("html.accessible-forms.e3", "intermediate", "Что нужно сделать после неудачной отправки формы со сводкой ошибок?", ["Ничего", "Перевести фокус на сводку или первое поле с ошибкой", "Очистить форму", "Показать `alert()`"], 1, "Фокус на сводке сообщает о результате и позволяет быстро перейти к исправлению."),
    mcq("html.accessible-forms.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["Для группы радио нужен `fieldset` с `legend`", "Ошибка, переданная только красной рамкой, соответствует 3.3.1", "Видимая метка нужна у каждого поля", "`aria-errormessage` одинаково поддерживается всеми скринридерами"], [0, 2], "Цвет — не единственное средство, а поддержка `aria-errormessage` неравномерна; надёжнее `aria-describedby`."),
    mcq("html.accessible-forms.e5", "intermediate", "Что требует критерий 3.3.7 Redundant Entry?", ["Повторно вводить пароль", "Не требовать повторного ввода уже введённой информации", "Показывать капчу", "Сохранять данные на сервере"], 1, "Ранее введённые данные в рамках процесса нужно подставлять или давать выбрать."),
    mcq("html.accessible-forms.e6", "advanced", "Что означает `aria-current=\"step\"` в индикаторе шагов?", ["Шаг завершён", "Это текущий шаг процесса", "Шаг недоступен", "Шаг необязателен"], 1, "Значение `step` помечает текущий шаг последовательности для вспомогательных технологий."),
    open("html.accessible-forms.e7", "intermediate", "Опишите, как должна выглядеть доступная обработка ошибок формы от нажатия «Отправить» до исправления.", [
      ol(
        "Проверить форму; при ошибках не отправлять и не очищать значения.",
        "Показать сводку ошибок вверху: заголовок и список ссылок на поля; перенести на неё фокус; добавить «Ошибка:» в `title`.",
        "У каждого проблемного поля показать текст ошибки (что не так и как исправить), связать через `aria-describedby`, выставить `aria-invalid=\"true\"`.",
        "При исправлении снимать ошибку и `aria-invalid`; успех объявить через `role=\"status\"`.",
        "Повторить проверку на сервере.",
      ),
    ], ["Сводка и перенос фокуса", "Связь ошибки с полем (`aria-describedby`, `aria-invalid`)", "Снятие ошибки и серверная проверка"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.accessible-forms.m1", "intermediate", "Где лучше разместить подсказку формата?", ["Только в `placeholder`", "Видимым текстом до поля, связанным через `aria-describedby`", "В `title`", "После кнопки отправки"], 1, "Подсказка должна быть видима и озвучена до ввода; `placeholder` и `title` ненадёжны."),
    mcq("html.accessible-forms.m2", "advanced", "Почему «Ошибка:» полезно добавлять в `<title>`?", ["Для SEO", "Пользователь скринридера сразу слышит результат после перезагрузки", "Для стилей", "Чтобы форма не отправлялась"], 1, "При перезагрузке `title` читается первым; префикс сообщает, что отправка не удалась."),
    mcq("html.accessible-forms.m3", "advanced", "Что допустимо для удобного ввода даты рождения в доступной форме?", ["Одно поле `text` без подсказок", "`type=\"date\"` или три поля (день, месяц, год) в `fieldset` с `legend`", "Только перетаскивание ползунков", "Календарь на `canvas`"], 1, "Нативный `date` или группа из трёх полей — проверенные доступные решения."),
    open("html.accessible-forms.m4", "advanced", "Команда хочет реализовать валидацию на лету с красной рамкой и всплывающей подсказкой на 3 секунды. Какие проблемы вы укажете и что предложите вместо этого?", [
      ul(
        "Цвет — единственный сигнал: недоступно людям с нарушением цветовосприятия (1.4.1) и пользователям скринридера (3.3.1).",
        "Подсказка исчезает по таймеру: нельзя прочитать скринридером и людям, читающим медленно; нарушает 2.2.1 / 1.4.13.",
        "Нет связи с полем и фокуса — пользователи клавиатуры и скринридера не узнают об ошибке.",
        "Предложение: текст ошибки рядом с полем, `aria-describedby` и `aria-invalid`, сводка со ссылками и перенос фокуса при отправке, проверка при уходе из поля и снятие ошибки при исправлении; цвет — дополнительный сигнал.",
      ),
    ], ["Названы цвет-только и исчезающая подсказка", "Названа потеря связи/фокуса", "Предложено рабочее решение"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.accessible-forms.f1", front: "Из чего состоит доступное поле?", back: "Имя (`label`), описание (`aria-describedby`: подсказка и ошибка), состояние (`required`, `aria-invalid`)." },
    { id: "html.accessible-forms.f2", front: "Что нужно в сводке ошибок?", back: "Заголовок, список ссылок на поля, фокус на сводке; в `title` префикс «Ошибка:»." },
    { id: "html.accessible-forms.f3", front: "WCAG 3.3.4?", back: "Error Prevention: для юридических/финансовых действий — отмена, проверка или подтверждение." },
    { id: "html.accessible-forms.f4", front: "Как оформить группу радио?", back: "`fieldset` + `legend` + общий `name`; ошибку группы — `aria-describedby` на `fieldset`." },
    { id: "html.accessible-forms.f5", front: "Статус без перевода фокуса?", back: "`role=\"status\"` (вежливо) или `role=\"alert\"` (срочно); контейнер создан заранее." },
    { id: "html.accessible-forms.f6", front: "Индикатор шагов?", back: "`ol` с `aria-current=\"step\"`, заголовок шага, перенос фокуса на `h1`, сохранение данных." },
  ],

  sources: [
    { title: "W3C WAI: Forms tutorial", url: "https://www.w3.org/WAI/tutorials/forms/", publisher: "W3C" },
    { title: "W3C WAI: Form instructions", url: "https://www.w3.org/WAI/tutorials/forms/instructions/", publisher: "W3C" },
    { title: "Understanding SC 3.3.3: Error Suggestion", url: "https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html", publisher: "W3C" },
    { title: "Understanding SC 3.3.4: Error Prevention (Legal, Financial, Data)", url: "https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html", publisher: "W3C" },
    { title: "Understanding SC 4.1.3: Status Messages", url: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html", publisher: "W3C" },
    { title: "GOV.UK Design System: Error summary", url: "https://design-system.service.gov.uk/components/error-summary/", publisher: "Other" },
    { title: "GOV.UK Design System: Date input", url: "https://design-system.service.gov.uk/components/date-input/", publisher: "Other" },
  ],
};
