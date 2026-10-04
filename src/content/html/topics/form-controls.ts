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

export const formControls: Topic = {
  id: "html.form-controls",
  slug: "form-controls",
  domain: "html",
  module: "forms",
  title: "Элементы управления: метки, группы, списки, кнопки",
  titleEn: "Form controls: label, fieldset, select, textarea, datalist, button, output, progress, meter",
  summary:
    'Поле без метки — это немое поле: пользователь скринридера не знает, что вводить, а пользователь мыши теряет большую область клика. Тема разбирает связку `label`/`fieldset`, элементы `select`, `textarea`, `datalist`, `button`, `output`, `progress`, `meter` и различия `disabled` и `readonly`.',
  minutes: 55,
  prerequisites: ["html.forms-basics", "html.input-types"],
  tags: ["label", "fieldset", "legend", "select", "option", "optgroup", "textarea", "datalist", "button", "output", "progress", "meter", "disabled", "readonly", "form attribute"],
  keyConcepts: [
    { term: "Метка", text: "`<label>` задаёт **доступное имя** полю и расширяет область клика. Без метки поле не опознаётся скринридером." },
    { term: "Labelable-элементы", text: "Метку можно привязать к `input` (кроме `hidden`), `select`, `textarea`, `button`, `meter`, `output`, `progress`." },
    { term: "Группа", text: "`<fieldset>` + `<legend>` объединяют связанные элементы (радио, флажки, адрес) и дают группе имя." },
    { term: "disabled ≠ readonly", text: "`disabled` — не фокусируется и **не отправляется**; `readonly` — фокусируется, **отправляется**, но не редактируется." },
    { term: "Submitter", text: "Из нескольких кнопок отправки в данные попадают `name`/`value` **только нажатой**." },
    { term: "Подсказки ≠ ограничения", text: "`<datalist>` предлагает варианты, но не запрещает ввести другое значение." },
  ],
  sections: [
    section("definition", [
      def("<label>", "Элемент, который задаёт **подпись** связанного элемента управления. Метка и поле связываются атрибутом `for` (значение равно `id` поля) либо вложенностью поля в метку. Подпись становится доступным именем поля и делает клик по тексту активацией поля.", "label element"),
      def("<fieldset> и <legend>", "`<fieldset>` объединяет группу связанных элементов управления в одну логическую единицу; `<legend>` — её заголовок (первый дочерний элемент). Для скринридера это группа с именем.", "fieldset and legend"),
      p("Остальные элементы темы — это «управляющие» элементы за пределами `<input>`: выбор из списка (`<select>`), многострочный ввод (`<textarea>`), подсказки (`<datalist>`), кнопки (`<button>`), результат вычислений (`<output>`) и индикаторы (`<progress>`, `<meter>`)."),
    ]),

    section("why", [
      h("Проблема: поле, которое ничего не объясняет"),
      p("Визуально «Имя» рядом с полем выглядит как подпись. Но для браузера это просто текст, соседствующий с `<input>`. Скринридер, дойдя до такого поля, скажет «поле ввода, пусто» — без имени. Пользователь мыши вынужден попадать в крошечную область поля вместо щелчка по тексту; пользователь с моторными нарушениями это замечает особенно остро."),
      p("Для подписи нужна **программная связь** между текстом и полем. Её создаёт `<label>`: после связи имя поля вычисляется из текста метки, а клик по метке передаёт фокус полю. Аналогично с группами: «Способ доставки: ○ Курьер ○ Самовывоз» — это группа с общим вопросом. Без `<fieldset>`/`<legend>` скринридер озвучит просто «Курьер, радиокнопка», и слушатель не поймёт, о чём спрашивают."),
      h("Проблема: самодельные контролы"),
      p("Соблазн — сделать «красивую кнопку» из `<div>` или раскрывающийся список из набора `<div>`. Нативные элементы бесплатно дают клавиатуру, фокус, роль, состояние, поведение в формах и работу на мобильных устройствах. Самодельный аналог должен воспроизвести всё это вручную — и почти всегда делает это хуже."),
      insight("Правило выбора: **сначала нативный элемент.** Свой контрол оправдан, только когда нативного нет и вы готовы реализовать клавиатуру, фокус и ARIA (отдельный курс — «Доступность»)."),
    ]),

    section("mental-model", [
      p("Представьте поле формы как **узел из трёх частей**: само поле, его **имя** (метка) и необязательное **описание** (подсказка, ошибка). Метка отвечает на «что это?», описание — на «как заполнить?». Группа (`fieldset`) — это узел, у которого «имя» — вопрос, а «поля» — варианты ответа."),
      diagram(
        `
        ┌ fieldset  ← имя группы: <legend> ───────────────┐
        │                                                 │
        │  <label for="a">  ←── связь по id ──→  <input id="a">
        │       │                                    │    │
        │   доступное имя                  значение → данные формы
        │                                                 │
        └─────────────────────────────────────────────────┘
        `,
        "Узел поля формы",
      ),
      table(
        ["Элемент", "Роль в форме", "Отправляется?", "Фокусируется?"],
        [
          ["`input`, `select`, `textarea`", "Ввод значения", "Да (если есть `name`, не `disabled`)", "Да"],
          ["`button`", "Действие", "Только если это нажатая кнопка отправки", "Да"],
          ["`output`", "Результат вычисления", "**Нет**", "Нет"],
          ["`progress`, `meter`", "Индикаторы", "**Нет**", "Нет"],
          ["`label`, `legend`", "Подпись", "Нет", "Нет"],
          ["`datalist`", "Подсказки для `input`", "Нет", "Нет"],
        ],
        "Что участвует в данных формы",
      ),
    ]),

    section("technical", [
      h("`<label>`: две формы привязки"),
      ul(
        "**Явная:** `<label for=\"email\">Почта</label> <input id=\"email\">` — `for` ссылается на `id` поля. Метка и поле могут стоять где угодно в документе.",
        "**Неявная:** `<label>Почта <input name=\"email\"></label>` — поле внутри метки; `for`/`id` не нужны.",
        "**Обе сразу** допустимы и надёжно работают в тех случаях, когда вспомогательные технологии хуже понимают неявную связь.",
      ),
      ul(
        "Метка привязывается к **labelable-элементам**: `input` (не `hidden`), `select`, `textarea`, `button`, `meter`, `output`, `progress` и form-associated custom elements. `for`, указывающий на `div`, не сработает.",
        "Метка клика: клик по метке активирует связанное поле — переводит фокус, а у флажка и радио ещё и переключает его.",
        "У одного поля может быть **несколько** меток (`input.labels` вернёт список), а у метки — одно поле (`label.control`).",
        "Внутри метки не должно быть других labelable-элементов, кроме связанного, и вложенных `label`.",
      ),
      warn("`id` должен быть **уникальным**. Если два поля имеют `id=\"name\"`, метка свяжется только с первым, а второе останется безымянным. Валидатор и DevTools сообщают о дубликатах — не игнорируйте их."),
      h("`<fieldset>` и `<legend>`"),
      ul(
        "`<legend>` — **первый** дочерний элемент `<fieldset>` (после него — любое содержимое).",
        "Скринридеры озвучивают текст `legend` вместе с каждым элементом группы (или при входе в группу): держите легенду **короткой** («Способ доставки», а не абзац).",
        "`<fieldset disabled>` отключает **все** вложенные элементы управления (кроме тех, что внутри первого `legend`). Удобно «выключать» целый блок формы.",
        "Атрибуты `name` и `form` у `fieldset` — для скриптов и привязки к форме; в данные формы `fieldset` не попадает.",
      ),
      h("`<select>`, `<option>`, `<optgroup>`"),
      ul(
        "`<option value=\"ru\">Россия</option>`: если `value` не задан, отправляется **текст** опции.",
        "`selected` — выбор по умолчанию. Если у одиночного списка ничего не выбрано, браузер выбирает **первую неотключённую** опцию.",
        "`multiple` — выбор нескольких; ключ отправляется столько раз, сколько выбрано опций. `size` задаёт число видимых строк.",
        "`<optgroup label=\"Европа\">` группирует опции; `disabled` на группе отключает все её опции.",
        "**Опция-заглушка** («Выберите страну») — первая `<option value=\"\">` без `multiple`. Вместе с `required` пустой выбор считается ошибкой. Спецификация называет её «placeholder label option».",
        "`select.value` — значение выбранной опции; `select.selectedOptions` — коллекция выбранных; `select.options` — все опции.",
      ),
      h("`<textarea>`"),
      ul(
        "Начальное значение — **содержимое** элемента (а не атрибут `value`). Первый перевод строки сразу после открывающего тега игнорируется.",
        "`rows`/`cols` — размер в строках и символах (на практике размер задают в CSS), `wrap=\"hard\"|\"soft\"`, `maxlength`, `minlength`, `placeholder`, `required`.",
        "Перевод строки: `textarea.value` содержит `\\n`, а при отправке переводы строк нормализуются к `\\r\\n` — серверная длина может отличаться от `value.length`.",
        "Изменение размера пользователем регулируется CSS `resize`.",
      ),
      h("`<datalist>`"),
      code(
        "html",
        `
        <label for="city">Город</label>
        <input id="city" name="city" list="cities" autocomplete="off">
        <datalist id="cities">
          <option value="Москва"></option>
          <option value="Мурманск"></option>
          <option value="Минск"></option>
        </datalist>
        `,
        { caption: "datalist подсказывает варианты, но не запрещает ввести другое значение." },
      ),
      note("Поддержка и подача `datalist` различаются между браузерами и скринридерами. Для **обязательного** выбора из списка используйте `<select>` или радио; `datalist` — лишь удобство ввода."),
      h("`<button>`"),
      table(
        ["Атрибут", "Смысл"],
        [
          ["`type=\"submit\"`", "**По умолчанию** внутри формы — отправляет форму"],
          ["`type=\"button\"`", "Ничего не отправляет; для скриптов (раскрыть, добавить строку)"],
          ["`type=\"reset\"`", "Сбрасывает поля к начальным значениям (обычно избегают)"],
          ["`name` и `value`", "Попадают в данные **только если эта кнопка нажата**"],
          ["`form`", "Привязывает кнопку к форме по `id`, даже если она снаружи"],
          ["`formaction`, `formmethod`, `formenctype`, `formtarget`", "Переопределяют параметры формы для этой кнопки"],
          ["`formnovalidate`", "Отправка без встроенной проверки (например, «Сохранить черновик»)"],
          ["`disabled`", "Кнопка неактивна, не фокусируется"],
        ],
      ),
      ul(
        "Внутрь `<button>` можно поместить разметку (иконку, `<span>`), но **не интерактивное содержимое** (`a`, `input`, другую `button`).",
        "Лучше `<button>`, чем `<input type=\"submit\">`: допускает вложенную разметку и псевдоэлементы, подписи не ограничены `value`.",
        "Кнопка вне формы с `type` по умолчанию ничего не отправляет — `submit` действует только в форме.",
      ),
      h("`<output>`, `<progress>`, `<meter>`"),
      ul(
        "**`<output>`** — результат вычисления или действия пользователя. `for=\"a b\"` перечисляет `id` полей-источников, `name`/`form` — как у полей. В данные формы **не отправляется**, при `reset` возвращается к исходному содержимому.",
        "**`<progress value=\"40\" max=\"100\">`** — прогресс задачи. Без `value` — «неопределённый» прогресс (идёт работа, но сколько осталось — неизвестно). По умолчанию `max=\"1\"`.",
        "**`<meter>`** — скалярное измерение в известном диапазоне (заполненность диска, оценка). Атрибуты `min`, `max`, `low`, `high`, `optimum`, `value` определяют «хорошую/плохую» зону. **Не** используйте для прогресса.",
        "Для `progress` и `meter` нужны **метки** (`label`/`aria-label`): без имени пользователь скринридера слышит число без контекста.",
      ),
      h("`disabled` и `readonly`"),
      table(
        ["Свойство", "`disabled`", "`readonly`"],
        [
          ["Получает фокус", "Нет", "Да"],
          ["Отправляется на сервер", "**Нет**", "**Да**"],
          ["Участвует во встроенной проверке", "Нет", "Нет"],
          ["Применимо к", "Почти всем элементам управления", "Только к `input` с текстовыми типами и `textarea`"],
          ["Когда использовать", "Действие сейчас недоступно", "Показать значение, но запретить правку"],
        ],
      ),
      tip("Если поле заблокировано, а пользователю нужно понять **почему** — объясните причину текстом рядом. Заблокированные элементы часто имеют низкий контраст и не фокусируются, поэтому подсказка внутри них не прочитается."),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <form action="/profile" method="post">
          <fieldset>
            <legend>Личные данные</legend>
            <p>
              <label for="name">Имя</label>
              <input id="name" name="name" autocomplete="name" required>
            </p>
            <p>
              <label for="country">Страна</label>
              <select id="country" name="country" required>
                <option value="">Выберите страну</option>
                <optgroup label="Европа">
                  <option value="de">Германия</option>
                  <option value="fr">Франция</option>
                </optgroup>
                <optgroup label="Азия">
                  <option value="jp">Япония</option>
                </optgroup>
              </select>
            </p>
            <p>
              <label for="bio">О себе</label>
              <textarea id="bio" name="bio" rows="4" maxlength="500"></textarea>
            </p>
          </fieldset>

          <fieldset>
            <legend>Рассылка</legend>
            <label><input type="radio" name="digest" value="weekly" checked> Раз в неделю</label>
            <label><input type="radio" name="digest" value="never"> Не присылать</label>
          </fieldset>

          <button type="submit">Сохранить</button>
          <button type="submit" formnovalidate name="intent" value="draft">Сохранить черновик</button>
        </form>
        `,
        { lineNumbers: true, filename: "profile-form.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <form>
          <fieldset>
            <legend>Цена и количество</legend>
            <label>Цена <input type="number" name="price" value="250" min="0"></label>
            <label>Штук <input type="number" name="qty" value="2" min="1"></label>
            <button type="button" id="calc">Посчитать</button>
            <p>Итого: <output id="total" for="price qty">500</output> ₽</p>
          </fieldset>
        </form>
        <script>
          const f = document.forms[0];
          document.getElementById("calc").addEventListener("click", () => {
            const sum = f.price.valueAsNumber * f.qty.valueAsNumber;
            f.querySelector("output").value = sum;
            console.log("Итого:", sum);
          });
        </script>
        `,
        { runnable: true },
      ),
      p("Кнопка с `type=\"button\"` не отправляет форму, `<output>` показывает результат, а `for=\"price qty\"` фиксирует, из каких полей он получен. Подписи — вложенные `<label>`; нажмите на слово «Цена» — фокус перейдёт в поле."),
    ]),

    section("detailed-example", [
      p("Форма доставки с группами, выпадающим списком, счётчиком символов и разными действиями. Обратите внимание, как подписано **каждое** поле и как отправка «Черновик» обходит проверку."),
      code(
        "html",
        `
        <form id="order" action="/orders" method="post">
          <fieldset>
            <legend>Получатель</legend>
            <label for="fio">ФИО</label>
            <input id="fio" name="fio" autocomplete="name" required>

            <label for="phone">Телефон</label>
            <input id="phone" name="phone" type="tel" autocomplete="tel" required>
          </fieldset>

          <fieldset>
            <legend>Способ доставки</legend>
            <label><input type="radio" name="delivery" value="courier" checked> Курьер</label>
            <label><input type="radio" name="delivery" value="pickup"> Самовывоз</label>
          </fieldset>

          <label for="city">Город</label>
          <select id="city" name="city" required>
            <option value="">Выберите город</option>
            <option value="msk">Москва</option>
            <option value="spb">Санкт-Петербург</option>
          </select>

          <label for="comment">Комментарий курьеру</label>
          <textarea id="comment" name="comment" rows="3" maxlength="200" aria-describedby="counter"></textarea>
          <p id="counter">Осталось 200 символов</p>

          <label for="fill">Заполнено</label>
          <progress id="fill" max="3" value="0">0 из 3</progress>

          <button type="submit">Оформить</button>
          <button type="submit" formnovalidate name="intent" value="draft">Черновик</button>
          <button type="button" id="clear">Очистить</button>
        </form>
        `,
        { lineNumbers: true, filename: "order.html", collapsed: true },
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <label for="city">Город</label>
        <select id="city" name="city" required>
          <option value="">Выберите город</option>
          <option value="msk">Москва</option>
        </select>
        <button type="submit" name="intent" value="save">Сохранить</button>
        <button type="submit" name="intent" value="draft" formnovalidate>Черновик</button>
        <input name="login" value="admin" readonly>
        `,
        [
          { line: 1, text: "`for=\"city\"` ссылается на `id=\"city\"`: после этого `select` получает имя «Город», а клик по подписи фокусирует список." },
          { line: 2, text: "`required` плюс первая опция с **пустым** `value` образуют проверку «выбор обязателен»: пока выбрана заглушка, форма не отправится." },
          { line: 3, text: "Пустой `value=\"\"` — важная деталь. Без `value` отправился бы **текст** опции («Выберите город»), и проверка не сработала бы." },
          { line: 6, text: "Кнопка с `name`/`value` попадёт в данные, только если нажата именно она: сервер увидит `intent=save`." },
          { line: 7, text: "`formnovalidate` отключает встроенную проверку для этой кнопки: черновик можно сохранить с пустыми обязательными полями. Сервер при этом всё равно должен проверять данные." },
          { line: 8, text: "`readonly`: поле видно, фокусируется и отправляется, но не редактируется. Не путайте с `disabled`." },
        ],
        "controls.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Построение дерева", "Парсер создаёт элементы форм и связывает их с ближайшей формой-предком или с формой из атрибута `form`. Набор элементов формы доступен как `form.elements`."],
          ["Вычисление имени", "Для каждого поля браузер строит **доступное имя**: сначала `aria-labelledby`, затем `aria-label`, затем нативные источники (метки, `legend` и т.д.), затем `title`/`placeholder` как запасные. Метка — самый надёжный путь."],
          ["Клик по метке", "Браузер перенаправляет событие клика на связанный элемент (так называемая «активация метки») — поэтому на флажке срабатывает клик, когда вы нажали на текст."],
          ["Отправка", "В набор данных попадают **успешные** элементы: имеют `name`, не `disabled`; для кнопок — только нажатая; для флажков/радио — только отмеченные; для `select multiple` — по записи на каждую выбранную опцию."],
          ["Сброс", "`reset` возвращает значения к **начальным** (`defaultValue`, `selected` по разметке, `checked` по разметке); `output` возвращается к исходному содержимому."],
        ],
        "Что делает браузер с элементами формы",
      ),
      note("Доступное имя — это то, что видят вспомогательные технологии. Проверить его можно в DevTools: вкладка Accessibility (Chrome/Firefox) показывает вычисленное имя и источник."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Подпись «рядом» без связи"),
      wrongRight(
        "html",
        {
          code: `
            <p>Имя</p>
            <input name="name">
            <span>Почта</span>
            <input name="email">
          `,
          note: "Рядом стоящий текст не связан с полем. У поля нет имени; клик по тексту ничего не делает.",
        },
        {
          code: `
            <label for="name">Имя</label>
            <input id="name" name="name" autocomplete="name">
            <label for="email">Почта</label>
            <input id="email" name="email" type="email" autocomplete="email">
          `,
          note: "Явная связь `for`/`id`: имя вычисляется из метки, клик по тексту фокусирует поле.",
        },
      ),
      h("Ошибка 2. `placeholder` вместо метки"),
      p("Подсказка в поле исчезает при вводе, часто имеет недостаточный контраст и не гарантирует имя. WCAG 3.3.2 требует подписи или инструкции для полей; `placeholder` их не заменяет. Оставляйте его только для **примера формата**."),
      h("Ошибка 3. Группа без `legend`"),
      p("Радио и флажки без вопроса неразборчивы: «Курьер», «Самовывоз» — чего именно? Оборачивайте их в `fieldset` с `legend`, не используйте для вопроса обычный `<p>` или `<div>`."),
      h("Ошибка 4. `<option>` без пустого значения у заглушки"),
      wrongRight(
        "html",
        {
          code: `
            <select name="country" required>
              <option>Выберите страну</option>
              <option value="de">Германия</option>
            </select>
          `,
          note: "Заглушка без `value=\"\"` имеет значение «Выберите страну»; `required` считает поле заполненным.",
        },
        {
          code: `
            <select name="country" required>
              <option value="">Выберите страну</option>
              <option value="de">Германия</option>
            </select>
          `,
          note: "Пустое значение заглушки — поле остаётся «не заполненным», пока пользователь не выберет страну.",
        },
      ),
      h("Ошибка 5. Кнопка без `type` вне задуманного места"),
      p("Внутри формы кнопка по умолчанию — `submit`. Кнопка «Добавить строку» без `type=\"button\"` отправит форму. Всегда указывайте `type` явно."),
      h("Ошибка 6. `disabled` вместо `readonly`"),
      p("`disabled` поле не уходит на сервер: итоговые данные теряют значение, а пользователь не может его скопировать с клавиатуры. Если значение нужно отправить и показать — `readonly`."),
      h("Ошибка 7. `<div>`/`<a>` вместо `<button>`"),
      p("`<div onclick>` не получает фокус, не реагирует на Enter и пробел, не имеет роли кнопки. Ссылка `<a href=\"#\">` для действий путает: ссылка ведёт, кнопка действует."),
      h("Ошибка 8. Ожидать, что `output` или `progress` отправятся"),
      p("Они не входят в данные формы. Если значение нужно серверу — храните его в `input` (скрытом или `readonly`)."),
    ]),

    section("antipatterns", [
      ul(
        "**Подпись из `title` или `aria-label` вместо видимой метки** без причины: видимый текст полезен всем.",
        "**Автоматическая отправка при смене значения `select`** (переход по ссылке при выборе) — нарушает ожидания (WCAG 3.2.2 «On Input») и ломает работу с клавиатурой: стрелки вверх/вниз запускают переход на каждом пункте.",
        "**Списки на 200+ вариантов** в обычном `select` без поиска: используйте `datalist` или специализированный компонент с доступностью.",
        "**Опции-плейсхолдеры, которые можно отправить** («— выберите —» с непустым значением).",
        "**Огромные `legend`** с абзацами текста: скринридеры повторяют их перед каждым элементом группы.",
        "**`<button>` внутри `<a>`** и наоборот: вложенные интерактивные элементы запрещены и ведут себя непредсказуемо.",
        "**`placeholder` как единственный источник подписи, да ещё с серым текстом на белом.**",
        "**`reset`-кнопка рядом с «Отправить»:** один неверный клик стирает результат длительной работы.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Каждому полю — видимая `<label>`**; по возможности явная связь `for`/`id` (и/или вложенность).",
        "**Группы радио и флажков — всегда в `fieldset` + `legend`.** Легенда — короткая.",
        "**`type` у кнопок указывайте всегда:** `submit`, `button` или `reset`.",
        "**Для `select` с обязательным выбором** — первая опция `value=\"\"` и `required`.",
        "**Для `textarea` задавайте `rows` и `maxlength`, предупреждайте о лимите** и показывайте счётчик, но не обрезайте ввод молча.",
        "**`readonly`, если значение нужно отправить; `disabled`, если действие недоступно** — и объясните причину.",
        "**Несколько действий — несколько кнопок с `name`/`value`** (`intent=save|draft|delete`), а не скрытые поля, меняемые скриптом.",
        "**Различайте `progress` и `meter`:** первое — выполнение задачи, второе — измерение.",
        "**Подписывайте `progress`, `meter` и `output`:** `label`, `aria-label` или `aria-labelledby`.",
        "**Проверяйте имя поля в Accessibility-панели DevTools,** а не «на глаз».",
      ),
    ]),

    section("edge-cases", [
      h("Метка внутри ссылки или кнопки"),
      p("Если внутри `<label>` оказывается ссылка, клик по ссылке и клик по метке конфликтуют: сработает переход, а не активация поля. Не помещайте интерактивные элементы (кроме связанного поля) в метку."),
      h("Несколько меток"),
      p("Допустимо подписать поле двумя метками (видимая и скрытая, «Телефон» и «в формате +7…»), но порядок имён зависит от порядка в документе. Для описаний лучше `aria-describedby`."),
      h("`select multiple` на мобильных"),
      p("Многострочный выбор неудобен на сенсорных экранах и малоизвестен пользователям (нужны модификаторы Ctrl/Shift). Для небольшого набора вариантов надёжнее группа флажков."),
      h("`textarea` и переводы строк"),
      p("`maxlength` считает по значению, где перевод строки — один символ (`\\n`), а сервер получает `\\r\\n` — два. Если на сервере строгая длина, делайте запас или нормализуйте переводы строк до проверки."),
      h("Первое пустое значение и порядок опций"),
      p("Если пустая опция не первая, это уже не «placeholder label option»: проверка `required` всё ещё считает пустое значение отсутствием выбора, но интерфейс ведёт себя иначе. Держите заглушку первой."),
      h("`fieldset` и вёрстка"),
      p("У `fieldset` есть собственные стили по умолчанию (рамка, внутренние отступы, особая раскладка `legend`), которые исторически сложно переопределять. Современные браузеры позволяют стилизовать `fieldset` обычными CSS-свойствами, включая `display: flex`/`grid`, но проверяйте результат. Не заменяйте его на `div` ради вёрстки: потеряете группу."),
      h("Стилизация `select` и `datalist`"),
      p("Выпадающий список — нативный элемент операционной системы; ограничения на его внешний вид существуют. В новых Chromium-браузерах есть возможность настройки внешнего вида `select` через CSS (`appearance: base-select`), но поддержка ограничена — проверяйте таблицы совместимости перед использованием, а для остальных браузеров оставляйте корректное запасное поведение."),
    ]),

    section("related", [
      ul(
        "[Формы: отправка данных](/learn/html/forms-basics) — `name`, `method`, успешные элементы формы.",
        "[Типы полей ввода](/learn/html/input-types) — `type`, `inputmode`, формат значений.",
        "[Валидация форм](/learn/html/form-validation) — `required`, `pattern`, Validity API.",
        "[Автозаполнение и UX форм](/learn/html/form-ux-autocomplete) — `autocomplete`, подсказки и ошибки.",
        "[Основы доступности](/learn/html/a11y-fundamentals) — доступное имя, роли, состояния.",
        "Из других курсов: **CSS** — стилизация полей и `:focus-visible`; **JS** — `form.elements`, `FormData`, события `input`/`change`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "«Визуальная» форма",
          code: `
            <div class="field">Имя</div>
            <input name="name" placeholder="Введите имя">
            <div class="row">Доставка</div>
            <input type="radio" name="d" value="c"> Курьер
            <input type="radio" name="d" value="p"> Самовывоз
            <div class="btn" onclick="send()">Отправить</div>
          `,
          note: "Нет имён полей, группы, клика по подписи, фокуса на «кнопке»; форму не отправить с клавиатуры.",
        },
        {
          title: "Нативные связи",
          code: `
            <label for="name">Имя</label>
            <input id="name" name="name" autocomplete="name">
            <fieldset>
              <legend>Доставка</legend>
              <label><input type="radio" name="d" value="c"> Курьер</label>
              <label><input type="radio" name="d" value="p"> Самовывоз</label>
            </fieldset>
            <button type="submit">Отправить</button>
          `,
          note: "Метка, группа с вопросом и настоящая кнопка: доступное имя, клавиатура, область клика и отправка — из коробки.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.form-controls.ex1",
      title: "Что уйдёт на сервер?",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Дана форма. Пользователь выбрал «Люкс», отметил оба флажка, не трогал поле «Логин» и нажал «Черновик». Запишите, какие пары `ключ=значение` придут на сервер. Какое ещё поле не придёт и почему?"),
        code(
          "html",
          `
          <form method="post">
            <input name="login" value="admin" readonly>
            <input name="token" value="x1" disabled>
            <select name="room">
              <option value="std">Стандарт</option>
              <option value="lux">Люкс</option>
            </select>
            <label><input type="checkbox" name="extra" value="breakfast"> Завтрак</label>
            <label><input type="checkbox" name="extra" value="parking"> Парковка</label>
            <output name="sum">100</output>
            <button name="intent" value="save">Сохранить</button>
            <button name="intent" value="draft">Черновик</button>
          </form>
          `,
        ),
      ],
      hints: ["Кто из элементов «успешный»?", "Какая кнопка нажата?", "`output` и `disabled` отправляются?"],
      checks: ["Перечислены `login`, `room`, `extra` (дважды), `intent=draft`", "Объяснено отсутствие `token`, `sum` и `intent=save`"],
      solution: [
        code("text", `login=admin&room=lux&extra=breakfast&extra=parking&intent=draft`),
        ul(
          "**`token`** не придёт: поле `disabled`.",
          "**`sum`** не придёт: `output` не является отправляемым элементом.",
          "**`intent=save`** не придёт: нажата другая кнопка — в данные попадает `name`/`value` только нажатой.",
          "**`login`** придёт, потому что `readonly` не исключает поле из данных формы.",
        ),
      ],
    }),
    exercise({
      id: "html.form-controls.ex2",
      title: "Форма редактора профиля",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Напишите форму профиля: имя, страна (список с группами и обязательным выбором), «О себе» (до 300 символов), группа радио «Видимость профиля» (публичный/только друзья/скрытый), группа флажков «Уведомления» и три кнопки: «Сохранить», «Сохранить черновик» (без встроенной проверки) и «Удалить профиль» (отправка на другой адрес). Каждое поле должно иметь метку, группы — легенду."),
      ],
      hints: ["Какие атрибуты у кнопки переопределяют адрес и проверку?", "Что должно быть первой опцией в списке?", "Сколько у радио-группы `name`?"],
      checks: ["У всех полей есть `label`", "Группы обёрнуты в `fieldset` с `legend`", "Заглушка `value=\"\"` + `required`", "Использованы `formnovalidate` и `formaction`", "У кнопок указан `type`"],
      solution: [
        code(
          "html",
          `
          <form action="/profile" method="post">
            <label for="name">Имя</label>
            <input id="name" name="name" autocomplete="name" required>

            <label for="country">Страна</label>
            <select id="country" name="country" required>
              <option value="">Выберите страну</option>
              <optgroup label="Европа">
                <option value="de">Германия</option>
                <option value="fr">Франция</option>
              </optgroup>
              <optgroup label="Азия">
                <option value="jp">Япония</option>
              </optgroup>
            </select>

            <label for="bio">О себе</label>
            <textarea id="bio" name="bio" rows="4" maxlength="300"></textarea>

            <fieldset>
              <legend>Видимость профиля</legend>
              <label><input type="radio" name="visibility" value="public" checked> Публичный</label>
              <label><input type="radio" name="visibility" value="friends"> Только друзья</label>
              <label><input type="radio" name="visibility" value="private"> Скрытый</label>
            </fieldset>

            <fieldset>
              <legend>Уведомления</legend>
              <label><input type="checkbox" name="notify" value="mail"> По почте</label>
              <label><input type="checkbox" name="notify" value="push"> Push</label>
            </fieldset>

            <button type="submit">Сохранить</button>
            <button type="submit" formnovalidate name="intent" value="draft">Сохранить черновик</button>
            <button type="submit" formaction="/profile/delete" formnovalidate>Удалить профиль</button>
          </form>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        note("Для удаления профиля нужно подтверждение (отдельная страница или диалог) — это опасное действие. И `formnovalidate` здесь уместен, потому что при удалении пустые обязательные поля не должны мешать."),
      ],
    }),
    exercise({
      id: "html.form-controls.ex3",
      title: "Форма без имён и с лишней отправкой",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Жалобы: «скринридер не называет поля», «щелчок по тексту «Почта» ничего не делает», «кнопка «Добавить телефон» отправляет форму», «можно отправить форму, не выбрав страну», «блок «Адрес» остался доступным, хотя форма заблокирована». Найдите причины и исправьте."),
      ],
      starter: {
        lang: "html",
        code: `
          <form action="/save" method="post">
            <span>Имя</span>
            <input name="name" placeholder="Имя">
            <label for="mail">Почта</label>
            <input id="email" name="email" type="email">
            <select name="country" required>
              <option>Выберите страну</option>
              <option value="de">Германия</option>
            </select>
            <button onclick="addPhone()">Добавить телефон</button>
            <div class="group">Адрес</div>
            <input name="street">
            <button type="submit">Сохранить</button>
          </form>
        `,
      },
      hints: ["Совпадают ли `for` и `id`?", "Какой `type` у кнопки по умолчанию?", "Что значит пустая первая опция?"],
      checks: ["Метки связаны с полями", "`type=\"button\"` у вспомогательной кнопки", "`value=\"\"` у заглушки", "Блок «Адрес» — `fieldset`/`legend`"],
      solution: [
        ul(
          "**«Имя»** — просто `<span>`: нет связи. Нужна `<label for=\"name\">` и `id=\"name\"` у поля. `placeholder` её не заменяет.",
          "**«Почта»**: `for=\"mail\"` указывает на несуществующий `id`; поле имеет `id=\"email\"`. Привести к одному значению.",
          "**Страна**: у заглушки нет `value=\"\"`, поэтому её значение — «Выберите страну», и `required` считает поле заполненным.",
          "**«Добавить телефон»** без `type` внутри формы — это `submit`: нужно `type=\"button\"`.",
          "**«Адрес»** — `div`, а не группа: `fieldset` с `legend` и (для блокировки всего блока) `disabled` на `fieldset`.",
        ),
        code(
          "html",
          `
          <form action="/save" method="post">
            <label for="name">Имя</label>
            <input id="name" name="name" autocomplete="name">

            <label for="email">Почта</label>
            <input id="email" name="email" type="email" autocomplete="email">

            <label for="country">Страна</label>
            <select id="country" name="country" required>
              <option value="">Выберите страну</option>
              <option value="de">Германия</option>
            </select>

            <button type="button" id="add-phone">Добавить телефон</button>

            <fieldset>
              <legend>Адрес</legend>
              <label for="street">Улица</label>
              <input id="street" name="street" autocomplete="street-address">
            </fieldset>

            <button type="submit">Сохранить</button>
          </form>
          `,
          { lineNumbers: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.form-controls.challenge",
    title: "Редактор товара: действия, группы и индикаторы",
    scenario: [
      p("В админке интернет-магазина редактируют товар. Форма содержит название, категорию (список с группами), описание (до 1000 символов), цену и скидку, вес, а также блок «Доставка» (радио и флажки). Рядом нужно показывать: итоговую цену с учётом скидки, заполненность описания и «качество карточки» (низкое/среднее/высокое)."),
      p("Менеджеры работают долго, поэтому нужны разные действия: «Опубликовать» (с проверкой), «Сохранить черновик» (без проверки), «Удалить» (на отдельный адрес и с подтверждением). Форма должна быть доступна с клавиатуры и скринридера."),
    ],
    requirements: [
      "Каждое поле с видимой меткой; группы в `fieldset`/`legend`",
      "Три кнопки с различными `name`/`value`, `formnovalidate`, `formaction`",
      "`<output>` для итоговой цены, `<progress>` для заполненности описания, `<meter>` для «качества»",
      "Описание: `textarea` с `maxlength` и счётчиком",
    ],
    constraints: [
      "Без JavaScript, кроме расчёта output и счётчиков",
      "Нативные элементы вместо `div`-кнопок и списков",
      "Не использовать `placeholder` вместо меток",
    ],
    acceptance: [
      "У каждой кнопки задан `type`; удаление не запускается случайно",
      "`output` содержит `for` с идентификаторами полей-источников",
      "`progress` и `meter` подписаны и применены по назначению",
      "Группы доставки читаются как «Способ доставки: …»",
    ],
    hints: [
      "Что отличает `progress` от `meter`?",
      "Как поведёт себя форма, если в «Черновике» не заполнено обязательное поле?",
      "Как подписать `progress` и `meter`?",
    ],
    solution: [
      code(
        "html",
        `
        <form id="product" action="/products/save" method="post">
          <label for="title">Название</label>
          <input id="title" name="title" required maxlength="120">

          <label for="cat">Категория</label>
          <select id="cat" name="category" required>
            <option value="">Выберите категорию</option>
            <optgroup label="Одежда">
              <option value="tshirt">Футболки</option>
              <option value="jeans">Джинсы</option>
            </optgroup>
            <optgroup label="Обувь">
              <option value="sneakers">Кроссовки</option>
            </optgroup>
          </select>

          <label for="desc">Описание</label>
          <textarea id="desc" name="description" rows="6" maxlength="1000" aria-describedby="desc-count"></textarea>
          <p id="desc-count">0 из 1000</p>

          <label for="price">Цена, ₽</label>
          <input id="price" name="price" type="number" min="0" step="1" required>
          <label for="disc">Скидка, %</label>
          <input id="disc" name="discount" type="number" min="0" max="90" value="0">
          <p>Итоговая цена: <output id="final" for="price disc">0</output> ₽</p>

          <fieldset>
            <legend>Способ доставки</legend>
            <label><input type="radio" name="delivery" value="courier" checked> Курьер</label>
            <label><input type="radio" name="delivery" value="pickup"> Самовывоз</label>
          </fieldset>

          <p>
            <label for="fill">Заполненность описания</label>
            <progress id="fill" max="1000" value="0">0 из 1000</progress>
          </p>
          <p>
            <label for="quality">Качество карточки</label>
            <meter id="quality" min="0" max="100" low="40" high="75" optimum="100" value="30">30 из 100</meter>
          </p>

          <button type="submit" name="intent" value="publish">Опубликовать</button>
          <button type="submit" name="intent" value="draft" formnovalidate>Сохранить черновик</button>
          <button type="submit" formaction="/products/delete" formnovalidate>Удалить</button>
        </form>
        `,
        { lineNumbers: true, collapsed: true },
      ),
      ul(
        "**Действия:** `intent` определяет, что делать с данными; удаление отправляется на отдельный адрес — серверу не надо различать действие по скрытым полям. Удаление должно требовать подтверждения (диалог или отдельный шаг).",
        "**`progress` vs `meter`:** заполненность описания — прогресс «в сторону лимита», `progress` подходит; «качество» — измерение внутри диапазона с «хорошей» зоной, поэтому `meter` с `low`/`high`/`optimum`.",
        "**`output`** содержит результат расчёта (цена × (1 − скидка)); `for` перечисляет поля-источники. В данные формы не уходит, поэтому сервер обязан пересчитать итог сам.",
        "**Скрипт:** слушает `input` на форме, обновляет `output.value`, `progress.value` и счётчик. Все эти элементы имеют имена — метки или `aria-describedby`.",
        "**Серверная проверка:** `formnovalidate` отключает только встроенную проверку; сервер валидирует и черновики по правилам черновика.",
      ),
    ],
  },

  interview: [
    iq("html.form-controls.i1", "basic", "Зачем нужен `<label>` и как привязать его к полю?", [
      p("`<label>` задаёт полю доступное имя и увеличивает область клика. Привязка — атрибутом `for` (значение равно `id` поля) или вложением поля в метку. Без метки скринридер не называет поле, а клик по тексту ничего не делает."),
    ]),
    iq("html.form-controls.i2", "basic", "Чем отличаются `disabled` и `readonly`?", [
      p("`disabled`: поле не фокусируется и **не отправляется**. `readonly`: фокусируется, **отправляется**, но не редактируется; применимо к текстовым `input` и `textarea`. Если нужно показать значение и отправить — `readonly`; если действие недоступно — `disabled` с пояснением."),
    ]),
    iq("html.form-controls.i3", "intermediate", "Зачем нужны `fieldset` и `legend`?", [
      p("Они объединяют связанные элементы (радио, флажки, адрес) в группу с именем. Для скринридера это «группа с названием», и значение каждого элемента воспринимается в контексте вопроса («Способ доставки: Курьер»). `fieldset disabled` отключает сразу все вложенные элементы."),
    ]),
    iq("html.form-controls.i4", "intermediate", "Как в `<select>` сделать обязательный выбор с заглушкой?", [
      p("Первая опция — `<option value=\"\">Выберите…</option>`, на `select` — `required`. Пока выбрана пустая опция, поле считается незаполненным. Без `value=\"\"` отправится текст опции и проверка не сработает."),
    ]),
    iq("html.form-controls.i5", "intermediate", "Что произойдёт, если в форме есть две кнопки отправки с `name`?", [
      p("В данные попадут `name`/`value` только нажатой кнопки. Это стандартный способ различать действия (`intent=save|draft`). Кнопка также может переопределить `formaction`, `formmethod`, `formnovalidate`."),
    ]),
    iq("html.form-controls.i6", "advanced", "Чем `<progress>` отличается от `<meter>`?", [
      ul(
        "`progress` — выполнение задачи (загрузка, шаг мастера); без `value` — неопределённый прогресс.",
        "`meter` — скалярное измерение в известном диапазоне (заполненность диска) с зонами `low`/`high`/`optimum`.",
        "Нельзя использовать `meter` для прогресса и наоборот: смысл разный, и вспомогательные технологии озвучивают их по-разному.",
      ),
    ]),
    iq("html.form-controls.i7", "engineering", "Команда хочет делать кнопки из `<div>`, потому что так проще стилизовать. Что вы скажете?", [
      ul(
        "`div` не получает фокус, не реагирует на Enter/Space, не имеет роли кнопки и не участвует в форме.",
        "Добавление `tabindex`, `role=\"button\"`, обработчиков клавиатуры и состояний воспроизводит часть возможностей `<button>` и почти всегда с ошибками.",
        "`<button>` стилизуется как любой элемент: сбросьте `appearance`/рамку и задайте стили, сохранив фокус (`:focus-visible`).",
        "Использовать `div` оправдано только при отсутствии нативного аналога.",
      ),
    ]),
    iq("html.form-controls.i8", "debugging", "Форма отправляется при нажатии на «Добавить поле», хотя обработчик вызывает `preventDefault`. В чём может быть дело и как лучше сделать?", [
      p("Кнопка внутри формы по умолчанию имеет `type=\"submit\"`. Если обработчик не отменяет отправку (или исключение выбрасывается до `preventDefault`), форма уйдёт. Надёжное решение — явный `type=\"button\"` для вспомогательных действий."),
    ]),
  ],

  exam: [
    mcq("html.form-controls.e1", "foundation", "Как связать `<label>` с полем явно?", ["Атрибутом `for`, равным `id` поля", "Атрибутом `name` у метки", "Классом `field`", "Только вложением, другого способа нет"], 0, "`for` ссылается на `id` поля; вложение — второй способ, но не единственный."),
    mcq("html.form-controls.e2", "foundation", "Какой `type` у `<button>` внутри формы по умолчанию?", ["`button`", "`reset`", "`submit`", "`menu`"], 2, "По умолчанию кнопка внутри формы отправляет её; для вспомогательных действий указывают `type=\"button\"`."),
    mcq("html.form-controls.e3", "intermediate", "Отправляется ли значение поля с `readonly`?", ["Да", "Нет", "Только у `textarea`", "Только если оно изменено"], 0, "`readonly` не исключает поле из набора данных (в отличие от `disabled`)."),
    mcq("html.form-controls.e4", "intermediate", "Какие утверждения о `<output>` верны? Выберите все.", ["Не отправляется на сервер", "Может иметь `for` с `id` полей-источников", "Содержимое уходит в данные формы", "Подходит для результата расчёта"], [0, 1, 3], "`output` показывает результат вычисления и не входит в набор данных формы."),
    mcq("html.form-controls.e5", "intermediate", "Что отправится, если в `<option>` нет `value`?", ["Ничего", "Текст опции", "Её порядковый номер", "`on`"], 1, "Если `value` не задан, значением считается текстовое содержимое опции."),
    mcq("html.form-controls.e6", "advanced", "Что делает `<fieldset disabled>`?", ["Отключает все вложенные элементы управления (кроме внутри первого `legend`)", "Скрывает группу", "Отключает только радиокнопки", "Не влияет на вложенные поля"], 0, "Атрибут действует на всех потомков-элементов управления; исключение — элементы внутри первой `legend`."),
    open("html.form-controls.e7", "intermediate", "Объясните, почему `placeholder` не заменяет `<label>`, и перечислите три практических последствия.", [
      p("`placeholder` — подсказка внутри пустого поля, а не подпись: она исчезает при вводе, не гарантирует доступного имени и не расширяет область клика."),
      ul(
        "Пользователь забывает, что вводить, после начала ввода (особенно при заполнении нескольких полей).",
        "Контраст и размер текста подсказок обычно ниже нормы; их нельзя масштабировать как обычный текст.",
        "Клик по подписи не фокусирует поле; нет видимой подписи при автозаполнении.",
        "Нарушается требование WCAG 3.3.2 (подписи или инструкции).",
      ),
    ], ["Названо различие подпись/подсказка", "Названы минимум три последствия", "Упомянут WCAG 3.3.2 или доступное имя"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.form-controls.m1", "intermediate", "У кнопки задано `formnovalidate`. Что это даёт?", ["Отправку без встроенной проверки ограничений", "Отправку без `name`", "Отключение серверной проверки", "Запрет отправки"], 0, "Браузерная проверка пропускается для этой отправки. Серверная проверка остаётся обязательной."),
    mcq("html.form-controls.m2", "advanced", "Для чего подходит `<meter>`?", ["Индикатор загрузки файла", "Заполненность диска в известном диапазоне", "Выбор значения ползунком", "Подпись к полю"], 1, "`meter` — скалярное измерение в диапазоне (с зонами). Загрузка — это `progress`."),
    mcq("html.form-controls.m3", "advanced", "Метка `for=\"phone\"`, а у поля `id=\"tel\"`. Что случится?", ["Метка свяжется по `name`", "Связи нет: поле останется без имени, клик по тексту не сработает", "Браузер найдёт ближайшее поле", "Форма не отправится"], 1, "`for` должен совпадать с `id`; иначе поле не связано с меткой."),
    open("html.form-controls.m4", "advanced", "Команда делает форму с «Отправить» и «Сохранить черновик». Черновик должен проходить без проверки, но данные формы — отличаться. Предложите решение на уровне HTML и перечислите риски.", [
      p("Две кнопки `type=\"submit\"` с `name=\"intent\"` и разными `value` (`publish`/`draft`); у «Черновика» — `formnovalidate`. Сервер читает `intent` и применяет соответствующие правила."),
      ul(
        "`formnovalidate` отключает только клиентскую проверку: сервер обязан проверять данные черновика (хотя и по более мягким правилам).",
        "Нужен общий обработчик Enter: по умолчанию неявную отправку по Enter выполняет **первая** кнопка отправки в порядке документа, поэтому порядок кнопок важен.",
        "Кнопки должны иметь понятные подписи и состояния (не только цвет).",
      ),
    ], ["Использованы две submit-кнопки с `name`/`value`", "Применён `formnovalidate`", "Названа серверная проверка и роль первой кнопки при Enter"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.form-controls.f1", front: "Как связать label и поле?", back: "`for` = `id` поля, либо поле вложено в `<label>`. Это даёт доступное имя и расширяет область клика." },
    { id: "html.form-controls.f2", front: "`disabled` vs `readonly`?", back: "`disabled`: не фокус, не отправка. `readonly`: фокус и отправка, но без правки (текстовые `input` и `textarea`)." },
    { id: "html.form-controls.f3", front: "Заглушка в `select`?", back: "Первая `<option value=\"\">` + `required`. Без `value=\"\"` отправится текст опции." },
    { id: "html.form-controls.f4", front: "Какой `type` у `<button>` по умолчанию в форме?", back: "`submit`. Для вспомогательных кнопок — `type=\"button\"`." },
    { id: "html.form-controls.f5", front: "`progress` vs `meter`?", back: "`progress` — выполнение задачи. `meter` — измерение в диапазоне с зонами `low`/`high`/`optimum`." },
    { id: "html.form-controls.f6", front: "Кто отправляется из нескольких submit-кнопок?", back: "Только нажатая: её `name` и `value` попадают в данные формы." },
  ],

  sources: [
    { title: "HTML Living Standard — Forms", url: "https://html.spec.whatwg.org/multipage/forms.html", publisher: "WHATWG" },
    { title: "MDN: <label>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label", publisher: "MDN" },
    { title: "MDN: <fieldset>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset", publisher: "MDN" },
    { title: "MDN: <select>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select", publisher: "MDN" },
    { title: "MDN: <button>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button", publisher: "MDN" },
    { title: "W3C WAI: Forms tutorial", url: "https://www.w3.org/WAI/tutorials/forms/", publisher: "W3C" },
    { title: "Understanding SC 3.3.2: Labels or Instructions", url: "https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html", publisher: "W3C" },
  ],
};
