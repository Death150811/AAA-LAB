import type { Topic } from "../../types";
import {
  annotated,
  beforeAfter,
  code,
  def,
  exercise,
  h,
  insight,
  iq,
  mcq,
  note,
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

export const debuggingCss: Topic = {
  id: "css.debugging-css",
  slug: "debugging-css",
  domain: "css",
  module: "rendering",
  title: "Отладка CSS: системный поиск причин",
  titleEn: "Debugging CSS: five questions, silent failures, overflow and stacking tools, rule bisection",
  summary:
    "CSS не выдаёт ошибок: неверное значение молча отбрасывается, неподходящее свойство молча ничего не делает. Тема превращает поиск причин в последовательность из пяти вопросов (разобралось ли правило, сопоставилось ли, выиграло ли в каскаде, какое значение получилось, применимо ли свойство в этом контексте) и даёт инструменты, проверенные в Chromium: таблицу «молчаливых отказов» (в том числе режим совместимости, где `height: 100%` даёт 720 px вместо 18), каталог свойств, которые «не действуют» (18 случаев), скрипт поиска причин горизонтальной прокрутки (полоса 15 px от `100vw`, `min-width` у flex-элемента), скрипт причин контекста наложения (сверен на 31 случае) и бисекцию таблицы стилей (виновное правило из 200 за 10 проверок).",
  minutes: 55,
  prerequisites: ["css.specificity-management", "css.rendering-pipeline", "css.stacking-contexts"],
  tags: ["debugging", "DevTools", "computed style", "silent failure", "quirks mode", "overflow", "stacking context", "z-index", "bisect", "minimal reproduction", "CSS.supports", "getComputedStyle"],
  keyConcepts: [
    { term: "Пять вопросов по порядку", text: "Разобрано ли правило → сопоставилось ли с элементом → выиграло ли каскад → какое значение получилось → применимо ли свойство в этом контексте. Каждый вопрос исключает класс причин." },
    { term: "Молчаливые отказы", text: "Неверное значение отбрасывается без ошибки (`color: redd` не ломает соседнее `color: blue`), невалидный селектор в списке отбрасывает **всё правило**, а пропущенная `;` теряет объявление." },
    { term: "Свойство может быть «не по адресу»", text: "`width` у строчного элемента, `gap` у блока, `flex: 1` вне flex-контейнера, `z-index` у статичного элемента — всё это не вызывает ошибок и ничего не делает (замер: 18 случаев)." },
    { term: "Инструмент вместо догадки", text: "Горизонтальную прокрутку ищет скрипт по границам элементов, ловушку `z-index` — перечень причин контекста наложения по цепочке предков, виновное правило — бисекция по таблице." },
    { term: "Минимальный пример", text: "Если причина не найдена за несколько вопросов, постройте минимальную страницу, на которой симптом воспроизводится, и убирайте всё лишнее по одному." },
  ],
  sections: [
    section("definition", [
      def("Молчаливый отказ", "Ситуация, когда браузер, следуя правилам обработки ошибок CSS, отбрасывает неверное объявление, правило или селектор без сообщения: разработчик видит только отсутствие эффекта.", "silent failure"),
      def("Вычисленное и используемое значение", "Вычисленное значение — результат каскада и подстановок (`50%`, `auto`); используемое — итог раскладки (`150px`). `getComputedStyle` возвращает используемое значение для отображаемых элементов, а для `display: none` — вычисленное.", "computed and used value"),
      def("Минимальный воспроизводимый пример", "Наименьший фрагмент HTML и CSS, на котором проблема всё ещё проявляется; без него причину сложно отделить от влияния остальной страницы.", "minimal reproducible example"),
      def("Бисекция правил", "Метод поиска виновного правила двоичным поиском по таблице стилей: половина правил включается, проверяется симптом, диапазон сужается.", "rule bisection"),
      def("Режим совместимости", "Режим разбора документа без `<!doctype html>`, где сохраняются устаревшие правила (например, безразмерные длины и особый расчёт процентной высоты).", "quirks mode"),
    ]),

    section("why", [
      h("CSS не говорит, что сломалось"),
      p("Язык устроен так, чтобы старый браузер переживал новые возможности: непонятное отбрасывается, остальное работает. Для автора это значит, что опечатка, лишний пробел или свойство «не в том месте» превращается не в ошибку, а в отсутствие эффекта. Замеры в Chromium:"),
      table(
        ["Фрагмент", "Что произошло"],
        [
          ["`color: redd; color: blue`", "Цвет синий: неверное значение отброшено, соседнее объявление сработало"],
          ["`display: grid; display: gridd`", "`display` остался `grid`: второе объявление отброшено"],
          ["`.a, p:bogus { color: red }`", "Цвет не применился: неверный селектор в списке отбросил **всё правило**"],
          ["`:is(.a, :bogus) { color: red }`", "Цвет красный: список внутри `:is()` «прощающий», отбрасывается только неверная часть"],
          ["`.a { color: red margin: 0 }` (нет `;`)", "Ни цвет, ни отступ: «объявление» целиком стало неверным"],
          ["`width: 123` без единицы", "Документ без `<!doctype html>` (режим совместимости): ширина 123 px; с `<!doctype html>`: объявление отброшено, блок занял всю доступную ширину (1264 px)"],
          ["`height: 100%` у блока в `<body>` без заданной высоты", "720 px в режиме совместимости (высота окна) и 18 px в стандартном"],
        ],
        "Тихие отказы (замеры)",
      ),
      h("Цена догадок"),
      ul(
        "**Изменение нескольких вещей сразу** не даёт понять, что помогло.",
        "**`!important`, `overflow-x: hidden`, лишние обёртки** прячут симптом: причина остаётся и вернётся в другом месте.",
        "**Отладка в готовой странице** смешивает влияние сотен правил; минимальный пример отделяет причину от шума.",
      ),
      insight("Отладка CSS — это не «подкручивание», а **сужение**: на каждый вопрос вы исключаете целый класс причин, пока не останется одна."),
    ]),

    section("mental-model", [
      p("Представьте **врача-диагноста**: симптом, гипотеза, тест, причина. Врач не назначает лекарство «на всякий случай» и не проверяет анализы в случайном порядке — он идёт от самых вероятных и дешёвых проверок к редким. Для CSS порядок определяет путь самого правила через браузер: сначала его должны **разобрать**, затем **сопоставить** с элементом, затем оно должно **выиграть каскад**, потом значение должно **вычислиться**, и только потом свойство должно **подействовать** в раскладке."),
      table(
        ["№", "Вопрос", "Класс причин", "Чем проверить"],
        [
          ["1", "Правило разобрано?", "Опечатки, неверные значения, пропущенная `;`, неверный селектор в списке, не подключён файл", "Styles: предупреждение и зачёркивание неверных объявлений; `CSS.supports()`; вкладка Network"],
          ["2", "Правило сопоставилось с элементом?", "Опечатка в имени класса, не тот элемент, ещё не существует, состояние (`:hover`)", "`$0.matches(\"…\")`; принудительное состояние `:hov` в Styles"],
          ["3", "Правило выиграло каскад?", "Специфичность, слой, порядок, `!important`, `style=\"\"`", "Styles (зачёркнуто); `explain()` из темы об управлении специфичностью"],
          ["4", "Какое значение получилось?", "Наследование, `var()`, относительные единицы, пересчёт процентов", "Computed в DevTools; `getComputedStyle($0)`"],
          ["5", "Свойство применимо здесь?", "`display`, позиционирование, контекст раскладки (flex/grid), контексты наложения", "Layout pane; каталог «не действует»; скрипты ниже"],
        ],
        "Пять вопросов",
      ),
    ]),

    section("technical", [
      h("Вопросы 1–2: разобрано ли и сопоставилось ли"),
      p("Проверить значение без запуска страницы можно через `CSS.supports` или присваивание в `style`: неверное значение не принимается. Замеры:"),
      table(
        ["Проверка", "Результат"],
        [
          ["`CSS.supports(\"display\", \"grid\")`", "`true`"],
          ["`CSS.supports(\"display\", \"gridd\")`", "`false`"],
          ["`CSS.supports(\"selector(:has(a))\")`", "`true`"],
          ["`CSS.supports(\"color\", \"oklch(60% 0.2 30)\")`", "`true`"],
          ["`CSS.supports(\"width: 10\")`", "`false`"],
          ["`style.setProperty(\"color\", \"redd\")`, затем `style.getPropertyValue(\"color\")`", "пустая строка — значение отброшено"],
        ],
        "Проверка значений и селекторов в Chromium",
      ),
      p("Правило, которое «не сопоставилось», проверяют по элементу: выберите его в Elements и выполните `$0.matches(\"селектор\")`. Для состояний включите принудительно `:hov` в панели Styles — иначе правило `:hover` «не работает» просто потому, что курсор не там."),

      h("Вопрос 3: каскад"),
      p("Для проигравших правил достаточно панели Styles: зачёркнутое объявление проиграло, а победитель виден в Computed. Подробный порядок критериев и инструмент `explain()` — в теме об управлении специфичностью. Здесь важно помнить: если правило разобрано и сопоставилось, а эффекта нет, следующая причина — проигрыш в каскаде либо вопрос 5."),

      h("Вопрос 4: какое значение получилось"),
      table(
        ["Элемент", "`getComputedStyle`", "Что показывает"],
        [
          ["`width: 50%` у блока в родителе 300 px (отображается)", "`150px`", "Используемое значение после раскладки"],
          ["`margin: auto` у блока в родителе 300 px (ширина 50%)", "`75px`", "Автоотступ превращён в пиксели"],
          ["`font-size: 2em` при 16 px у родителя", "`32px`", "Относительная единица вычислена"],
          ["То же с `display: none`", "`50%`, `auto`", "Для невидимого элемента значение не раскладывалось"],
          ["Пользовательское свойство `--gap:  1rem ;`", "`1rem`", "Пробелы по краям убраны"],
          ["Пользовательское свойство `--x: calc(1px + 2px)`", "`calc(1px + 2px)`", "Незарегистрированное свойство хранится как строка, без вычисления"],
          ["Несуществующее `--nope`", "пустая строка", "Свойство не задано"],
        ],
        "Вычисленное и используемое (замер)",
      ),

      h("Вопрос 5: свойство «не действует»"),
      p("Каждый случай ниже воспроизведён в Chromium: свойство добавлено, положение или вид элемента сравнивался до и после."),
      table(
        ["Что написано", "Результат", "Почему и что нужно"],
        [
          ["`span { width: 200px }`", "ничего", "У строчного элемента нет `width`; нужен `display: inline-block` (с ним ширина стала 200 вместо 48)"],
          ["`span { height: 100px }`", "ничего", "Та же причина"],
          ["`span { margin-top: 30px }`", "ничего", "Вертикальные внешние отступы строчного элемента не двигают строку"],
          ["`div { top: 50px }` у статичного блока", "ничего", "`top` действует у позиционированных; с `position: relative` блок сместился на 50 px"],
          ["`z-index: 10` у статичного элемента", "ничего", "Элемент остался под позиционированным соседом; после `position: relative` оказался сверху"],
          ["`gap: 20px` у блочного контейнера", "ничего", "`gap` работает во flex, grid и колонках; с `display: flex` расстояние появилось"],
          ["`justify-content: center` у блочного контейнера", "ничего", "Свойство выравнивает по главной оси flex/grid; во flex блок сдвинулся на 100 px"],
          ["`flex: 1` у ребёнка блочного контейнера", "ничего", "Нужен flex-контейнер: во flex ширина выросла с 50 до 300 px"],
          ["`margin: auto` по вертикали в блоке", "по вертикали 0", "В потоке блоков автоотступы сверху и снизу равны нулю; по горизонтали блок сместился на 250 px; во flex центрируется и по вертикали (смещение 100 px)"],
          ["`height: 100%` при родителе с автовысотой", "ничего (18 px)", "Процентная высота нуждается в определённой высоте родителя; при заданных 200 px блок стал 200"],
          ["`text-align: center` у блока шириной 200 px", "сам блок не двигается", "Свойство выравнивает **содержимое** блока, а не его положение"],
          ["`vertical-align: middle` у блока", "ничего", "Действует у строчных и ячеек таблицы"],
          ["`position: sticky` внутри предка с `overflow: hidden`", "не «прилипает»", "Контейнером прокрутки становится предок; после прокрутки на 300 px `top` равен −300"],
          ["`position: sticky` внутри предка с `overflow: clip`", "«прилипает»", "`clip` не создаёт контейнер прокрутки; `top` равен 0"],
        ],
        "Свойства, которые «не действуют» (замеры)",
      ),
      note("Ни один из этих случаев не вызывает ошибки в консоли. Если свойство «не работает», сначала проверьте, **применимо ли оно** к `display` и позиционированию элемента и его родителя."),

      h("Горизонтальная прокрутка"),
      p("Полоса прокрутки по горизонтали появляется, когда содержимое выходит за ширину окна. Найти виновника вручную сложно: он может быть вложенным и невидимым. Скрипт ищет элементы, границы которых (или переполняющее содержимое) выходят за `documentElement.clientWidth`, пропуская те, что обрезаны предком с `overflow` и фиксированные:"),
      code(
        "js",
        `
        // find-overflow.js — какие элементы создают горизонтальную прокрутку
        function findOverflow() {
          const vw = document.documentElement.clientWidth;
          const path = (el) => {
            const parts = [];
            for (let e = el; e && e !== document.body; e = e.parentElement) {
              parts.unshift(e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.classList.length ? "." + [...e.classList].join(".") : ""));
            }
            return parts.join(" > ");
          };
          const clipped = (el) => {                                   // предок обрезает или прокручивает содержимое
            for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
              if (getComputedStyle(p).overflowX !== "visible") return true;
            }
            return false;
          };

          const over = [];
          for (const el of document.body.querySelectorAll("*")) {
            const cs = getComputedStyle(el);
            if (clipped(el) || cs.position === "fixed") continue;
            const rect = el.getBoundingClientRect();
            const scrolls = cs.overflowX !== "visible";               // свой прокручиваемый контейнер наружу не переполняет
            const right = scrolls ? rect.right : Math.max(rect.right, rect.left + el.scrollWidth);
            if (right > vw + 0.5) over.push({ el, by: Math.round(right - vw), wider: rect.width > el.parentElement.getBoundingClientRect().width + 0.5 });
          }
          // первопричины: элементы, внутри которых нет других переполняющих
          return over
            .filter((a) => !over.some((b) => b !== a && a.el.contains(b.el)))
            .map((a) => ({ path: path(a.el), by: a.by, widerThanParent: a.wider }));
        }
        `,
        { filename: "find-overflow.js", lineNumbers: true, collapsed: true },
      ),
      p("Замер на странице шириной 600 px с классической полосой прокрутки (15 px): `documentElement.scrollWidth` равен 900 при `clientWidth` 585. Скрипт нашёл пять элементов:"),
      table(
        ["Элемент", "Выступает на, px", "Шире родителя", "Причина"],
        [
          ["`section.hero`", "15", "да", "`width: 100vw` не учитывает полосу прокрутки: 600 вместо 585"],
          ["`div.row > div.item` (первый)", "238", "да", "Слово без пробелов: у flex-элемента `min-width: auto` не даёт ему сжаться"],
          ["`div.row > div.item` (второй)", "306", "нет", "Сдвинут первым элементом: следствие, не причина"],
          ["`div.host > span.badge`", "40", "нет", "`position: absolute; right: -40px`"],
          ["`img.pic`", "315", "да", "Ширина 900 без `max-width: 100%`"],
        ],
        "Что нашёл `findOverflow()`",
      ),
      ul(
        "Широкая таблица внутри блока с `overflow: auto` скриптом **не** считается причиной: она прокручивается внутри блока и страницу не расширяет.",
        "Признак «шире родителя» помогает отличить причину (первый `.item`, `img`, `.hero`) от следствия (второй `.item`).",
        "Исправления проверены по одному: после каждого пропадал ровно один элемент из списка; после всех четырёх список пуст, а `scrollWidth` стал равен `clientWidth` (585).",
      ),
      code(
        "css",
        `
        .hero { width: 100%; }                                /* вместо 100vw */
        .item { min-width: 0; overflow-wrap: anywhere; }     /* flex-элемент может сжаться, слово переносится */
        .badge { right: 0; }                                  /* значок внутри контейнера */
        .pic { max-width: 100%; height: auto; }
        `,
        { filename: "overflow-fixes.css" },
      ),
      warn("`overflow-x: hidden` на `html` или на `body` по отдельности причину не устраняет: `scrollWidth` остаётся 900. На обоих сразу `position: sticky` перестаёт работать (замер: `top` равен −300 вместо 0), а содержимое просто обрезается."),

      h("`z-index` «не работает»: контексты наложения"),
      p("Ребёнок с `z-index: 9999` оказывается под соседом с `z-index: 2`, если его предок создаёт контекст наложения: числа сравниваются только внутри контекста. Скрипт перечисляет причины, по которым элемент создаёт контекст, и обходит цепочку предков:"),
      code(
        "js",
        `
        // stacking-reasons.js — почему элемент создаёт контекст наложения
        function stackingReasons(el) {
          const cs = getComputedStyle(el);
          const parent = el.parentElement ? getComputedStyle(el.parentElement) : null;
          const r = [];
          if (el === document.documentElement) r.push("корневой элемент");
          if (cs.position === "fixed" || cs.position === "sticky") r.push("position: " + cs.position);
          if ((cs.position === "absolute" || cs.position === "relative") && cs.zIndex !== "auto") r.push("position + z-index");
          if (parent && /flex|grid/.test(parent.display) && cs.zIndex !== "auto") r.push("z-index у элемента flex/grid");
          if (parseFloat(cs.opacity) < 1) r.push("opacity < 1");
          for (const prop of ["transform", "scale", "rotate", "translate", "filter", "backdrop-filter", "perspective", "clip-path", "mask-image"]) {
            const v = cs.getPropertyValue(prop);
            if (v !== "none" && v !== "") r.push(prop);
          }
          if (cs.transformStyle === "preserve-3d") r.push("transform-style: preserve-3d");
          if (cs.mixBlendMode !== "normal") r.push("mix-blend-mode");
          if (cs.isolation === "isolate") r.push("isolation: isolate");
          if (/\\b(opacity|transform|filter|perspective|isolation|mix-blend-mode|clip-path|mask)\\b/.test(cs.willChange)) r.push("will-change: " + cs.willChange);
          if (/\\b(layout|paint|strict|content)\\b/.test(cs.contain)) r.push("contain: " + cs.contain);
          if (cs.contentVisibility === "auto") r.push("content-visibility: auto");
          return r;
        }

        function stackingChain(el) {
          const out = [];
          for (let e = el; e; e = e.parentElement) {
            const reasons = stackingReasons(e);
            if (reasons.length) out.push({ element: e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.className ? "." + String(e.className).trim().split(/\\s+/).join(".") : ""), reasons });
          }
          return out;
        }
        `,
        { filename: "stacking-reasons.js", lineNumbers: true, collapsed: true },
      ),
      p("Скрипт сверен с поведением на 31 случае: для каждого значения на предке создавался потомок с `z-index: 9999`, а рядом — позиционированный сосед с `z-index: 2`. Если потомок оказывался под соседом, предок создаёт контекст. Результат совпал со скриптом во всех случаях:"),
      table(
        ["Создаёт контекст (потомок «заперт»)", "Не создаёт"],
        [
          ["`position: relative` или `absolute` вместе с `z-index` ≠ `auto` (в том числе `0`)", "`position: relative` без `z-index`"],
          ["`position: fixed`, `position: sticky`", "`opacity: 1`"],
          ["`opacity` меньше 1 (даже `0.99`)", "`overflow: hidden`"],
          ["`transform`, `translate`, `scale`", "`will-change: left`"],
          ["`filter`, `backdrop-filter`, `perspective`, `clip-path`, `mask-image`", "`contain: size`"],
          ["`mix-blend-mode` кроме `normal`, `isolation: isolate`, `transform-style: preserve-3d`", "`container-type: inline-size` и `size` (в Chromium)"],
          ["`will-change: transform` и `will-change: opacity`", ""],
          ["`contain: layout`, `paint`, `strict`, `content`; `content-visibility: auto`", ""],
        ],
        "Контексты наложения: замер в Chromium",
      ),
      note("Таблица описывает Chromium: например, `container-type` не создал контекст в замере, поэтому скрипт его не учитывает. Для другого браузера перепроверьте."),

      h("Бисекция таблицы стилей"),
      p("Когда симптом есть, а причину искать в сотне правил, поможет двоичный поиск: скрипт отключает исходную таблицу и включает копию с первыми `n` правилами, пока не найдёт первое правило, после которого симптом проявляется."),
      code(
        "js",
        `
        // bisect-css.js — бинарный поиск первого правила таблицы, после которого проявляется симптом
        function bisectRules(sheet, isBroken) {
          const rules = [...sheet.cssRules].map((r) => r.cssText);
          const probe = document.createElement("style");
          document.head.append(probe);
          sheet.disabled = true;                                       // проверяем только копии правил, исходная таблица выключена
          let runs = 0;
          const test = (n) => { runs++; probe.textContent = rules.slice(0, n).join("\\n"); return isBroken(); };

          let lo = 0, hi = rules.length;                               // инвариант: test(lo) — здорово, test(hi) — симптом есть
          const valid = !test(lo) && test(hi);
          while (valid && hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (test(mid)) hi = mid; else lo = mid;
          }
          probe.remove();
          sheet.disabled = false;
          return valid ? { index: hi - 1, rule: rules[hi - 1], runs } : null;
        }

        // пример: bisectRules(document.styleSheets[0], () => document.querySelector(".box").offsetHeight === 0)
        `,
        { filename: "bisect-css.js", lineNumbers: true, collapsed: true },
      ),
      p("Проверка на таблицах из 64 и 200 правил с одним виновником (`.box { display: none }`) в разных позициях (начало, середина, конец): правило найдено всегда, число проверок — 8 для 64 правил и 10 для 200 (порядка `log₂ n` плюс две проверки границ). Если симптома нет вообще или он есть уже без правил, функция возвращает `null`."),
      warn("Бисекция предполагает, что симптом, появившись после правила, не исчезает от последующих. Если для симптома нужна комбинация правил или они переопределяют друг друга, найдётся только первое правило, после которого симптом стал виден."),

      h("Подсветка границ без смещения раскладки"),
      p("Чтобы увидеть блоки, подсветите их через `outline`, а не `border`. Замер на странице из 16 элементов: `* { outline: 1px solid red }` и `* { box-shadow: inset 0 0 0 1px red }` не изменили геометрию ни одного элемента, а `* { border: 1px solid red }` изменил все 16."),

      h("Инструменты DevTools"),
      ul(
        "**Elements → Styles:** объявления по порядку приоритета, зачёркнутые проигравшие, предупреждения о неверных значениях; переключатели `:hov` и `.cls` для состояний и классов.",
        "**Computed:** итоговые значения и переход к правилу-победителю.",
        "**Layout:** подсветка flex- и grid-контейнеров поверх страницы.",
        "**Console:** `$0` — выбранный элемент; `getComputedStyle($0)`, `$0.matches(\"…\")`, `$0.getBoundingClientRect()`.",
        "**Rendering:** Paint flashing, Layout Shift Regions, эмуляция `prefers-color-scheme`, `prefers-reduced-motion` и режима печати.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `
        const el = $0;
        const cs = getComputedStyle(el);
        console.log(cs.display, cs.position, cs.zIndex);
        console.log(el.matches(".card:hover"));
        console.log(el.getBoundingClientRect());
        console.log(CSS.supports("display", "grid"));
        console.table(findOverflow());
        console.table(stackingChain(el));
        `,
        [
          { line: 1, text: "`$0` — элемент, выбранный в панели Elements (доступно только в консоли DevTools)." },
          { line: [2, 3], text: "Вопрос 4: используемые значения; `z-index: auto` у статичного элемента подсказывает ответ на вопрос 5." },
          { line: 4, text: "Вопрос 2: сопоставляется ли селектор с этим элементом." },
          { line: 5, text: "Фактические границы: сравнивайте с ожидаемыми." },
          { line: 6, text: "Вопрос 1: понимает ли браузер значение." },
          { line: [7, 8], text: "Готовые инструменты: переполнение страницы и цепочка контекстов наложения." },
        ],
        "syntax.js",
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Проверка объявления</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          label { display: block; margin-bottom: 0.5rem; }
          input { padding: 0.3rem 0.5rem; font: inherit; }
          button { padding: 0.35rem 0.8rem; font: inherit; }
          output { display: block; margin: 0.75rem 0; font-weight: 600; }
          table { border-collapse: collapse; }
          th, td { padding: 4px 10px; border: 1px solid #c5cae9; text-align: left; font-size: 14px; }
        </style>
        <form id="form">
          <label>Свойство <input id="prop" type="text" value="display" autocomplete="off"></label>
          <label>Значение <input id="value" type="text" value="gridd" autocomplete="off"></label>
          <button type="submit">Проверить</button>
        </form>
        <output id="out"></output>
        <table>
          <thead><tr><th>Объявление</th><th>Результат</th></tr></thead>
          <tbody id="examples"></tbody>
        </table>
        <script>
          const verdict = (prop, value) => CSS.supports(prop, value) ? "принято" : "отброшено браузером";

          function show() {
            const prop = document.querySelector("#prop").value.trim();
            const value = document.querySelector("#value").value.trim();
            document.querySelector("#out").textContent = prop + ": " + value + " — " + verdict(prop, value);
          }
          document.querySelector("#form").addEventListener("submit", (e) => { e.preventDefault(); show(); });
          show();

          const examples = [["display", "grid"], ["display", "gridd"], ["color", "redd"], ["color", "rebeccapurple"], ["width", "10"], ["width", "10px"], ["gap", "1rem"], ["aspect-ratio", "16 / 9"]];
          const tbody = document.querySelector("#examples");
          for (const [prop, value] of examples) {
            const row = tbody.insertRow();
            row.insertCell().textContent = prop + ": " + value;
            row.insertCell().textContent = verdict(prop, value);
          }
        </script>
        </html>
        `,
        { filename: "check-declaration.html", runnable: true, lineNumbers: true },
      ),
      p("Поле по умолчанию содержит неверное значение `display: gridd` — результат «отброшено браузером». Попробуйте `width: 10` (без единицы): `false`, а в режиме совместимости (страница без `<!doctype html>`) такое значение принимается."),
    ]),

    section("detailed-example", [
      p("Страница с четырьмя причинами горизонтальной прокрутки и панелью с инструментом: кнопка «Найти переполнение» перечисляет виновников, «Применить исправления» подключает четыре правила из раздела выше. На устройствах с наложенными полосами прокрутки (мобильные браузеры, часть настольных) `100vw` равен `clientWidth`, и `.hero` не будет в списке."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Лаборатория переполнения</title>
        <style>
          body { margin: 0; font: 16px/1.4 system-ui, sans-serif; }
          .hero { width: 100vw; padding: 0.5rem 1rem; box-sizing: border-box; background: #eef0fb; }
          .row { display: flex; gap: 8px; }
          .item { background: #e0e3f5; }
          .host { position: relative; height: 30px; }
          .badge { position: absolute; right: -40px; top: 0; background: #ffd54f; }
          .table-wrap { overflow: auto; }
          .pic { display: block; background: #ccc; }
          .panel { position: sticky; bottom: 0; padding: 0.75rem 1rem; background: #fff; border-top: 2px solid #2f3d9a; }
          .panel button { margin-right: 0.5rem; padding: 0.35rem 0.8rem; font: inherit; }
          .panel th, .panel td { padding: 2px 8px; border: 1px solid #c5cae9; text-align: left; font-size: 13px; }
          .panel table { border-collapse: collapse; margin-top: 0.5rem; }
        </style>

        <section class="hero">Блок на всю ширину</section>
        <div class="row">
          <div class="item">ПрекрасныйНеразрывныйТекстКоторыйНеПереноситсяНиПриКакихУсловияхИНеИмеетПробелов</div>
          <div class="item">Второй</div>
        </div>
        <div class="host"><span class="badge">новое</span></div>
        <div class="table-wrap"><table><tbody><tr><td style="min-width: 900px">широкая таблица внутри блока с прокруткой</td></tr></tbody></table></div>
        <img class="pic" alt="" width="900" height="40" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
        <div style="height: 600px"></div>

        <div class="panel">
          <button type="button" id="find">Найти переполнение</button>
          <button type="button" id="fix">Применить исправления</button>
          <span id="status"></span>
          <table><thead><tr><th>Элемент</th><th>Выступает на, px</th><th>Шире родителя</th></tr></thead><tbody id="rows"></tbody></table>
        </div>

        <script>
          function findOverflow() {
            const vw = document.documentElement.clientWidth;
            const path = (el) => {
              const parts = [];
              for (let e = el; e && e !== document.body; e = e.parentElement) {
                parts.unshift(e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.classList.length ? "." + [...e.classList].join(".") : ""));
              }
              return parts.join(" > ");
            };
            const clipped = (el) => {
              for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
                if (getComputedStyle(p).overflowX !== "visible") return true;
              }
              return false;
            };
            const over = [];
            for (const el of document.querySelectorAll("body *:not(.panel):not(.panel *)")) {
              const cs = getComputedStyle(el);
              if (clipped(el) || cs.position === "fixed") continue;
              const rect = el.getBoundingClientRect();
              const scrolls = cs.overflowX !== "visible";
              const right = scrolls ? rect.right : Math.max(rect.right, rect.left + el.scrollWidth);
              if (right > vw + 0.5) over.push({ el, by: Math.round(right - vw), wider: rect.width > el.parentElement.getBoundingClientRect().width + 0.5 });
            }
            return over
              .filter((a) => !over.some((b) => b !== a && a.el.contains(b.el)))
              .map((a) => ({ path: path(a.el), by: a.by, widerThanParent: a.wider }));
          }

          const rows = document.querySelector("#rows");
          const status = document.querySelector("#status");
          function report() {
            const list = findOverflow();
            rows.textContent = "";
            for (const r of list) {
              const tr = rows.insertRow();
              for (const text of [r.path, String(r.by), r.widerThanParent ? "да" : "нет"]) tr.insertCell().textContent = text;
            }
            const root = document.documentElement;
            status.textContent = "scrollWidth " + root.scrollWidth + ", clientWidth " + root.clientWidth + ", найдено: " + list.length;
          }

          document.querySelector("#find").addEventListener("click", report);
          document.querySelector("#fix").addEventListener("click", () => {
            const s = document.createElement("style");
            s.textContent = ".hero{width:100%}.item{min-width:0;overflow-wrap:anywhere}.badge{right:0}.pic{max-width:100%;height:auto}";
            document.head.append(s);
            report();
          });
          report();
        </script>
        </html>
        `,
        { filename: "overflow-lab.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Шаг", "Что делает код", "Зачем"],
        [
          ["`clipped(el)`", "Поднимается по предкам и ищет `overflow-x` не `visible`", "Элемент в прокручиваемом контейнере страницу не расширяет"],
          ["`scrolls ? rect.right : max(rect.right, rect.left + el.scrollWidth)`", "Для обычного элемента учитывает и переполняющее содержимое", "Находит и длинное слово, не меняющее границы блока"],
          ["`right > vw + 0.5`", "Допуск 0,5 px на дробные значения", "Исключает ложные срабатывания от округления"],
          ["`!over.some(b => a.el.contains(b.el))`", "Оставляет элементы, внутри которых нет других нарушителей", "Предки с переполняющими детьми — следствие"],
          ["`wider`", "Сравнивает ширину элемента с шириной родителя", "Отличает причину от смещённого соседа"],
        ],
        "Как устроен `findOverflow()`",
      ),
      ul(
        "Сначала запускайте инструмент **до** исправлений: список подскажет число причин; после каждого исправления список должен уменьшаться на одну позицию.",
        "Если в списке остался элемент без признака «шире родителя», смотрите на соседей до него: он сдвинут.",
        "Если после всех исправлений `scrollWidth` не равен `clientWidth`, причина вне видимых элементов: ищите абсолютные элементы за краем и трансформации.",
      ),
    ]),

    section("internals", [
      h("Почему CSS молчит"),
      p("Спецификация требует восстановления после ошибок: браузер пропускает неверное объявление до следующей `;` и продолжает. Поэтому `color: redd; color: blue` даёт синий. Неверный селектор в списке (`.a, p:bogus`) делает неверным весь список — правило отбрасывается целиком, а у `:is()` и `:where()` список «прощающий» (замер: правило сработало)."),
      h("Откуда берутся значения в Computed"),
      steps(
        [
          ["Каскадное значение", "Победитель каскада для свойства (или наследование/начальное значение)."],
          ["Вычисленное значение", "Относительные единицы приведены к абсолютным, `var()` подставлена (`font-size: 2em` → `32px`)."],
          ["Используемое значение", "Проценты и `auto` разрешены раскладкой (`50%` → `150px`, `margin: auto` → `75px`)."],
          ["`getComputedStyle`", "Для отображаемого элемента возвращает используемое значение; для `display: none` — вычисленное (`50%`, `auto`)."],
        ],
        "От каскада до значения в консоли",
      ),
      h("Режим совместимости"),
      p("Документ без `<!doctype html>` разбирается в режиме совместимости (`document.compatMode === \"BackCompat\"`). Замер на реальной навигации: `width: 123` и `height: 45` без единицы принимаются (ширина 123, высота 45), а в стандартном режиме отбрасываются; процентная высота блока в `<body>` без заданной высоты даёт 720 px (высота окна) против 18 px. Режим определяется при разборе документа, поэтому проверять такие вещи в `setContent` тестового фреймворка нельзя — используйте навигацию по URL."),
      h("Почему сломался `sticky`"),
      p("`position: sticky` привязывается к ближайшему предку с `overflow`, отличным от `visible`. Если такой предок сам не прокручивается (`overflow: hidden`), «прилипать» не к чему, и элемент уезжает вместе со страницей (замер: `top` −300). `overflow: clip` контейнера прокрутки не создаёт (замер: `top` 0)."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Менять несколько вещей сразу"),
      p("Три правки за раз — и неизвестно, какая помогла и не сломала ли что-то ещё. Меняйте одно, проверяйте, фиксируйте."),
      h("Ошибка 2. Прятать симптом"),
      wrongRight(
        "css",
        {
          code: `
            html, body { overflow-x: hidden; }   /* убрали полосу — причина осталась */
          `,
          note: "`scrollWidth` по-прежнему 900; на `html` и `body` вместе ломается `position: sticky`.",
        },
        {
          code: `
            .hero { width: 100%; }
            .item { min-width: 0; overflow-wrap: anywhere; }
            .pic { max-width: 100%; height: auto; }
          `,
          note: "Найдены и устранены причины; `scrollWidth` стал равен `clientWidth`.",
        },
      ),
      h("Ошибка 3. Отлаживать в готовой странице"),
      p("Сотни правил, скрипты и шрифты скрывают причину. Скопируйте проблемный фрагмент в пустую страницу и убирайте лишнее, пока симптом не исчезнет; последняя убранная строка — подозреваемая."),
      h("Ошибка 4. Верить `getComputedStyle` для скрытого элемента"),
      p("У `display: none` значение не разложено: ширина `50%`, а не `150px`. Покажите элемент, прежде чем измерять."),
      h("Ошибка 5. Забыть про состояния"),
      p("Правило `:hover`, `:focus-visible` или `:checked` «не работает», пока состояние не включено. Используйте принудительные состояния в Styles и проверяйте клавиатуру отдельно."),
      h("Ошибка 6. Подбирать `z-index` числами"),
      p("`z-index: 99999` не помогает, если предок создал контекст наложения: скрипт `stackingChain` показывает, какой именно предок «запирает» потомка."),
      h("Ошибка 7. Не проверять режим документа"),
      p("Без `<!doctype html>` страница в режиме совместимости: единицы и процентные высоты ведут себя иначе. Первым делом проверьте `document.compatMode`."),
      h("Ошибка 8. Не сохранять воспроизведение"),
      p("Исправили и забыли: баг вернётся. Сохраните минимальный пример и добавьте автоматическую проверку (например, `scrollWidth === clientWidth` на ключевых ширинах)."),
    ]),

    section("antipatterns", [
      ul(
        "**`!important` и `overflow-x: hidden` «для проверки»,** которые остаются в коде.",
        "**Одновременные правки** нескольких свойств и файлов.",
        "**`z-index` с четырьмя девятками** вместо поиска контекста наложения.",
        "**Отладка только в одном браузере и одной ширине.**",
        "**Пропуск вопросов 1–2:** разбор причин каскада и раскладки, когда правило даже не разобрано.",
        "**Оставлять диагностические стили** (`outline`, цветные фоны) в коде.",
        "**Тестирование HTML без `<!doctype html>`.**",
        "**Не записывать причину** в комментарии к исправлению.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Идите по пяти вопросам по порядку:** разобрано → сопоставлено → выиграло → значение → применимо.",
        "**Сначала минимальный пример,** потом гипотезы.",
        "**Меняйте одну вещь за раз** и проверяйте результат.",
        "**Используйте инструменты:** `CSS.supports`, `$0.matches`, `getComputedStyle`, `findOverflow`, `stackingChain`, бисекцию.",
        "**Подсвечивайте через `outline`,** а не `border`: геометрия не меняется.",
        "**Проверяйте `document.compatMode`** и наличие `<!doctype html>` в страницах и тестах.",
        "**Фиксируйте регрессию тестом:** `scrollWidth === clientWidth` на заданных ширинах, снимок вычисленных стилей.",
        "**Записывайте причину,** а не только исправление: в комментарии или описании коммита.",
      ),
      tip("Запомните последовательность «разобрано → сопоставлено → выиграло → значение → применимо»: в большинстве случаев причина находится на первых трёх шагах за пару минут."),
    ]),

    section("edge-cases", [
      h("Состояния и взаимодействие"),
      p("Ошибки, зависящие от `:hover`, фокуса, анимации и прокрутки, воспроизводятся только в нужном состоянии: включайте их принудительно или записывайте шаги."),
      h("Теневой DOM и iframe"),
      p("Стили не пересекают границу теневого дерева и iframe: правило снаружи не повлияет на внутреннее содержимое. В DevTools разверните `#shadow-root` или выберите контекст фрейма в консоли."),
      h("Печать и тёмная тема"),
      p("Проблемы режимов `print`, `prefers-color-scheme`, `prefers-reduced-motion` воспроизводятся только при эмуляции: включите её в Rendering."),
      h("Несколько браузеров"),
      p("Все таблицы замеров этой темы получены в Chromium. Для особенностей другого браузера повторите проверку в нём: сами вопросы и инструменты остаются теми же."),
      h("Дробные пиксели"),
      p("Значения вроде `76.7969px` — нормальный результат раскладки. При сравнении границ используйте допуск (в `findOverflow` — 0,5 px)."),
    ]),

    section("related", [
      ul(
        "[Управление специфичностью](/learn/css/specificity-management) — каскад и `explain()` для вопроса 3.",
        "[Конвейер рендеринга](/learn/css/rendering-pipeline) — стадии, форсированные раскладки.",
        "[Контексты наложения](/learn/css/stacking-contexts) — причины создания контекста.",
        "[Каскад](/learn/css/cascade) — порядок решения конфликтов.",
        "[Блочная модель](/learn/css/box-model) — используемые размеры и отступы.",
        "[Производительность CSS](/learn/css/css-performance) — аудит загрузки и покрытия.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Подбор наугад",
          code: `
            1. Появилась горизонтальная прокрутка.
            2. Добавили html, body { overflow-x: hidden }.
            3. Не помогло на другой странице — добавили ещё .container { overflow: hidden }.
            4. Сломался position: sticky — убрали sticky.
          `,
          note: "Причина не найдена; каждая правка прячет симптом и создаёт новую проблему.",
        },
        {
          title: "Пять вопросов и инструмент",
          code: `
            1. findOverflow() → .hero (15 px, шире родителя), .item (238 px), .badge (40 px), img (315 px).
            2. Для каждого вопрос 5: 100vw не учитывает полосу, min-width: auto у flex-элемента, абсолют за краем, нет max-width.
            3. Четыре правки по одной; после каждой список короче.
            4. scrollWidth === clientWidth (585); тест на ширинах 320–1280.
          `,
          note: "Причины найдены и устранены, sticky работает, регрессию ловит тест.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.debugging-css.ex1",
      title: "Почему свойство не действует",
      difficulty: "foundation",
      kind: "debugging",
      prompt: [
        p("Для каждого фрагмента назовите причину, по которой свойство ничего не делает, и минимальное исправление."),
        ul(
          "`<span class=\"tag\">новое</span>` и `.tag { width: 80px; height: 24px }`",
          "`.box { top: 20px }` у статичного блока",
          "`.menu { gap: 12px }`, где `.menu` — обычный блок с дочерними `div`",
          "`.card { z-index: 5 }`, где `.card` не позиционирован и перекрывается позиционированным соседом",
          "`.child { height: 100% }`, где у родителя `.wrap` высота не задана",
        ),
      ],
      hints: ["Подходит ли свойство к `display` и позиционированию элемента?", "Что нужно процентной высоте от родителя?"],
      checks: ["Для каждого названа причина", "Предложено минимальное исправление", "Указаны замеры или принципы"],
      solution: [
        table(
          ["Фрагмент", "Причина", "Исправление"],
          [
            ["`span { width; height }`", "У строчного элемента нет ширины и высоты", "`display: inline-block` (замер: ширина 200 вместо 48)"],
            ["`top` у статичного блока", "`top` действует у позиционированных", "`position: relative` (замер: сдвиг на 50 px)"],
            ["`gap` у блока", "`gap` работает во flex/grid/колонках", "`display: flex` или `grid`"],
            ["`z-index` у статичного", "`z-index` без позиционирования не применяется", "`position: relative` (замер: элемент оказался сверху)"],
            ["`height: 100%` при автовысоте родителя", "Процент требует определённой высоты родителя", "Задать высоту родителю (замер: 200 px при высоте родителя 200 px)"],
          ],
          "Разбор",
        ),
      ],
    }),
    exercise({
      id: "css.debugging-css.ex2",
      title: "Найдите причины горизонтальной прокрутки",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("На странице шириной 600 px (полоса прокрутки 15 px) `scrollWidth` равен 900. `findOverflow()` вернул: `section.hero` (15 px, шире родителя), `div.row > div.item` (238 px, шире родителя), `div.row > div.item` (306 px, не шире), `span.badge` (40 px), `img.pic` (315 px, шире родителя). Определите причины и напишите исправления."),
      ],
      hints: ["Какая единица не учитывает полосу прокрутки?", "Почему второй `.item` выступает сильнее?"],
      checks: ["Названы четыре причины", "Объяснён второй `.item`", "Предложены исправления без `overflow-x: hidden`"],
      solution: [
        code(
          "css",
          `
          .hero { width: 100%; }                               /* вместо 100vw */
          .item { min-width: 0; overflow-wrap: anywhere; }     /* flex-элемент сжимается, слово переносится */
          .badge { right: 0; }                                 /* значок внутри контейнера */
          .pic { max-width: 100%; height: auto; }
          `,
        ),
        p("Второй `.item` не шире родителя: его сдвинул первый. Замер: после каждого исправления из списка пропадал ровно один элемент, после всех четырёх список пуст, а `scrollWidth` стал равен `clientWidth` (585)."),
      ],
    }),
    exercise({
      id: "css.debugging-css.ex3",
      title: "Модальное окно под соседом",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Модальное окно `.modal { position: fixed; z-index: 9999 }` оказывается под шапкой `.header { position: relative; z-index: 2 }`. Предок `.page` (в нём лежит `.modal`) имеет `transform: translateZ(0)`. Объясните причину, выполните диагностику скриптом и предложите два исправления."),
      ],
      hints: ["Какое значение сравнивается: `9999` или `z-index` предка?", "Как вывести модальное окно из `.page`?"],
      checks: ["Названа причина (контекст наложения)", "Указан результат `stackingChain(.modal)`", "Предложены два исправления"],
      solution: [
        p("`transform` у `.page` создаёт контекст наложения (замер: потомок с `z-index: 9999` под соседом с `2`), поэтому число 9999 сравнивается только внутри `.page`, а `.header` сравнивается с `.page` целиком. Кроме того, `position: fixed` внутри трансформированного предка позиционируется относительно него."),
        code(
          "js",
          `
          stackingChain(document.querySelector(".modal"));
          // [ { element: "div.modal", reasons: ["position: fixed"] },
          //   { element: "div.page",  reasons: ["transform"] },
          //   { element: "html",      reasons: ["корневой элемент"] } ]
          `,
          { filename: "diagnostics.js" },
        ),
        ul(
          "**Вынести** модальное окно из `.page` в конец `<body>` (или использовать `<dialog>` с `showModal()`).",
          "**Убрать** `transform: translateZ(0)` у `.page` или заменить на `will-change` только на время анимации.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "css.debugging-css.challenge",
    title: "Тест на отсутствие горизонтальной прокрутки на нескольких ширинах",
    scenario: [
      p("Баг с горизонтальной прокруткой возвращается каждые пару месяцев. Нужен автоматический тест: на ширинах 320, 375, 768, 1024 и 1280 страница не должна иметь горизонтальную прокрутку, а при нарушении тест должен печатать виновников."),
    ],
    requirements: [
      "Проверять `documentElement.scrollWidth <= clientWidth` на пяти ширинах",
      "При нарушении выводить список виновников (`findOverflow`) с выступом в пикселях",
      "Использовать классические полосы прокрутки (чтобы поймать `100vw`)",
      "Код выхода 1 при нарушении, 0 — если всё в порядке",
    ],
    constraints: [
      "Нельзя считать нарушением содержимое, прокручиваемое внутри блока с `overflow: auto`",
      "Нельзя обходить проблему `overflow-x: hidden` на `html` или `body`",
    ],
    acceptance: [
      "На странице с `.hero { width: 100vw }` тест падает и называет `section.hero`",
      "На исправленной странице тест проходит",
      "Широкая таблица внутри `overflow: auto` проблемой не считается",
    ],
    hints: [
      "Как запустить Chromium с классическими полосами?",
      "Как передать `findOverflow` в страницу?",
      "Как собрать результаты по ширинам?",
    ],
    solution: [
      code(
        "js",
        `
        // no-overflow.test.mjs <url>
        import { chromium } from "playwright";
        import { readFileSync } from "node:fs";

        const url = process.argv[2];
        const findOverflow = readFileSync("find-overflow.js", "utf8");        // функция из раздела выше
        const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });   // классические полосы прокрутки
        const failures = [];

        for (const width of [320, 375, 768, 1024, 1280]) {
          const page = await browser.newPage({ viewport: { width, height: 800 } });
          await page.goto(url);
          const result = await page.evaluate("(() => {" + findOverflow + "; const r = document.documentElement; return { sw: r.scrollWidth, cw: r.clientWidth, culprits: findOverflow() }; })()");
          if (result.sw > result.cw) failures.push({ width, scrollWidth: result.sw, clientWidth: result.cw, culprits: result.culprits });
          await page.close();
        }
        await browser.close();

        if (failures.length) {
          for (const f of failures) {
            console.error("✗ " + f.width + " px: scrollWidth " + f.scrollWidth + " > clientWidth " + f.clientWidth);
            for (const c of f.culprits) console.error("    " + c.path + " выступает на " + c.by + " px");
          }
          process.exit(1);
        }
        console.log("✓ горизонтальной прокрутки нет на всех ширинах");
        `,
        { filename: "no-overflow.test.mjs", lineNumbers: true },
      ),
      ul(
        "**Классические полосы:** `ignoreDefaultArgs: [\"--hide-scrollbars\"]` — без этого `100vw` совпадает с `clientWidth`, и проблема не воспроизводится.",
        "**Диагностика:** при нарушении печатаются элементы и величина выступа из `findOverflow()`.",
        "**Блоки с прокруткой:** скрипт их пропускает, поэтому широкая таблица в `overflow: auto` не считается нарушением.",
      ),
    ],
  },

  interview: [
    iq("css.debugging-css.i1", "basic", "Почему в CSS нет сообщений об ошибках?", [
      p("Спецификация требует восстановления после ошибок: неверное объявление или правило пропускается, остальное применяется. Так старый браузер переживает новые возможности. Следствие: ошибка проявляется как отсутствие эффекта (`color: redd; color: blue` даёт синий)."),
    ]),
    iq("css.debugging-css.i2", "basic", "Какой порядок проверки вы используете, когда стиль «не применился»?", [
      ul(
        "Правило разобрано: нет опечаток и пропущенной `;`, значение допустимо (`CSS.supports`), файл подключён.",
        "Правило сопоставилось с элементом (`$0.matches`), включено нужное состояние.",
        "Правило выиграло каскад: Styles показывает зачёркнутое, проверяются специфичность, слой, порядок, `!important`.",
        "Значение получилось ожидаемым: Computed, `getComputedStyle`.",
        "Свойство применимо в контексте: `display`, позиционирование, flex/grid, контексты наложения.",
      ),
    ]),
    iq("css.debugging-css.i3", "intermediate", "Чем вычисленное значение отличается от используемого?", [
      p("Вычисленное — результат каскада и подстановок (`50%`, `auto`, `32px` для `2em`). Используемое — итог раскладки (`150px`, `75px`). `getComputedStyle` возвращает используемое для отображаемого элемента и вычисленное для `display: none`."),
    ]),
    iq("css.debugging-css.i4", "intermediate", "Как найти причину горизонтальной прокрутки?", [
      ul(
        "Скрипт: найти элементы, выходящие правее `documentElement.clientWidth`, пропуская обрезанные предком с `overflow`.",
        "Отличить причину от следствия: причина шире родителя или выходит за край, следствие сдвинуто соседом.",
        "Типичные причины: `100vw` при классической полосе (15 px), `min-width: auto` у flex-элемента, абсолютные элементы, изображения без `max-width`.",
        "Не прятать симптом `overflow-x: hidden` на `html` и `body`: это ломает `sticky`.",
      ),
    ]),
    iq("css.debugging-css.i5", "intermediate", "Почему `z-index: 9999` не поднимает элемент над соседом?", [
      p("Числа сравниваются только внутри одного контекста наложения. Если предок элемента создал контекст (`transform`, `opacity < 1`, `isolation`, `will-change: transform`, `position` с `z-index` и другие), потомок «заперт», а сравниваться будет предок целиком. Перечень причин и цепочку предков показывает `stackingChain`."),
    ]),
    iq("css.debugging-css.i6", "advanced", "Как найти виновное правило в большой таблице стилей?", [
      ul(
        "Отключить исходную таблицу и включить копию с первыми `n` правилами; двоичным поиском найти первое правило, после которого симптом проявляется.",
        "Замер: 64 правила — 8 проверок, 200 — 10.",
        "Ограничение: метод предполагает, что симптом не исчезает от последующих правил.",
        "Дополнение: минимальный воспроизводимый пример и снимок вычисленных стилей.",
      ),
    ]),
    iq("css.debugging-css.i7", "engineering", "Как защитить проект от возврата горизонтальной прокрутки?", [
      ul(
        "Тест на Playwright с классическими полосами на ширинах 320–1280: `scrollWidth <= clientWidth`.",
        "При падении выводить виновников и величину выступа.",
        "Не маскировать проблему `overflow-x: hidden`.",
        "Запускать в CI на ключевых страницах и состояниях.",
      ),
    ]),
    iq("css.debugging-css.i8", "debugging", "Верстка «поехала» только у части пользователей. Что проверите?", [
      ul(
        "Режим документа: наличие `<!doctype html>` и `document.compatMode`.",
        "Классические или наложенные полосы прокрутки (`100vw`, ширина контента).",
        "Размер окна, масштаб, шрифты и язык, `prefers-*`, режим печати.",
        "Состояния и контент: длинные слова, пустые значения, `display: none` на момент измерения.",
        "Воспроизвести на минимальном примере и сравнить вычисленные стили.",
      ),
    ]),
  ],

  exam: [
    mcq("css.debugging-css.e1", "foundation", "Что произойдёт с `color: redd; color: blue`?", ["Оба объявления отброшены", "Цвет станет красным", "Цвет станет синим: неверное значение отброшено", "Браузер выдаст ошибку в консоль"], 2, "Неверное объявление молча пропускается, соседнее верное применяется (замер: синий цвет)."),
    mcq("css.debugging-css.e2", "foundation", "Почему `span { width: 200px }` ничего не меняет?", ["У строчного элемента нет ширины: нужен `display: inline-block`", "Нужен `!important`", "Нужно задать высоту", "Свойство устарело"], 0, "Строчные элементы не принимают `width` и `height`; с `inline-block` замер дал 200 px вместо 48."),
    mcq("css.debugging-css.e3", "intermediate", "Что случится с правилом `.a, p:bogus { color: red }`?", ["Отброшен только `p:bogus`", "Правило сработает для `p`", "Правило сработает для `.a`", "Отброшено всё правило"], 3, "Невалидный селектор в списке делает неверным весь список (кроме «прощающих» списков внутри `:is()` и `:where()`)."),
    mcq("css.debugging-css.e4", "intermediate", "Почему `width: 100vw` создаёт горизонтальную прокрутку на странице с классической полосой?", ["`vw` не поддерживается", "`100vw` не вычитает полосу прокрутки: 600 px при доступных 585", "Из-за `box-sizing`", "Из-за `min-width`"], 1, "Замер: выступ 15 px у блока с `width: 100vw` в окне 600 px."),
    mcq("css.debugging-css.e5", "intermediate", "Какие значения создают контекст наложения? Выберите все.", ["`opacity: 0.99`", "`position: relative` без `z-index`", "`will-change: transform`", "`overflow: hidden`"], [0, 2], "Потомок под соседом наблюдался при `opacity: 0.99` и `will-change: transform`; `position: relative` без `z-index` и `overflow: hidden` контекст не создают."),
    mcq("css.debugging-css.e6", "advanced", "Что даёт `overflow-x: hidden` одновременно на `html` и `body`?", ["Решает причину переполнения", "Ничего", "Включает горизонтальную прокрутку", "Скрывает полосу, но `sticky` перестаёт работать, а содержимое обрезается"], 3, "Замер: `scrollWidth` стал равен `clientWidth`, `top` у `sticky` стал −300."),
    open("css.debugging-css.e7", "intermediate", "Опишите последовательность отладки CSS, начиная с симптома «стиль не применяется».", [
      ul(
        "1. Правило разобрано? Проверить опечатки, значения (`CSS.supports`), `;`, подключение файла.",
        "2. Сопоставилось с элементом? `$0.matches()`, состояния `:hov`.",
        "3. Выиграло каскад? Styles: зачёркнутое; специфичность, слой, порядок, `!important`.",
        "4. Какое значение получилось? Computed: `getComputedStyle`.",
        "5. Применимо в этом контексте? `display`, позиционирование, flex/grid, контексты наложения.",
        "Если причина не найдена — минимальный пример и бисекция.",
      ),
    ], ["Пять шагов по порядку", "Названы инструменты", "Упомянут минимальный пример"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.debugging-css.m1", "intermediate", "Чем отличается результат `getComputedStyle(el).width` для отображаемого элемента и для `display: none`?", ["Ничем", "`auto` и `150px`", "`150px` и `50%`: для скрытого значение не раскладывалось", "`0px` и `50%`"], 2, "Замер при `width: 50%` в родителе 300 px: `150px` у отображаемого и `50%` у скрытого."),
    mcq("css.debugging-css.m2", "advanced", "Почему тест, проверяющий поведение без `<!doctype html>`, нельзя делать через `page.setContent`?", ["`setContent` не поддерживает CSS", "Режим документа и разбор значений могут не соответствовать реальной навигации: в замере `width: 123` без единицы принималось и в «стандартном» `setContent`", "`setContent` медленный", "Из-за кэша"], 1, "Различие между режимами проявилось только при реальной навигации по URL; в `setContent` результаты в двух режимах совпали."),
    mcq("css.debugging-css.m3", "advanced", "Скрипт бисекции нашёл правило за 10 проверок в таблице из 200. Что это значит?", ["Использован двоичный поиск: порядка `log₂ n` проверок плюс границы", "Правила проверялись по одному", "Таблица была отсортирована", "Каждое правило проверено дважды"], 0, "Для 200 правил `log₂ 200 ≈ 7,6`, то есть 8 шагов плюс две проверки границ."),
    open("css.debugging-css.m4", "advanced", "Спроектируйте регрессионную защиту от класса багов «вёрстка ломается на узких экранах и в нестандартных режимах».", [
      ul(
        "Автотесты Playwright на ключевых ширинах с классическими полосами: `scrollWidth <= clientWidth`, печать виновников.",
        "Снимки вычисленных стилей ключевых компонентов и визуальные снимки на разных ширинах и темах.",
        "Проверка `document.compatMode` и наличия `<!doctype html>` в шаблонах; линтер HTML.",
        "Минимальные примеры для каждого найденного бага; запись причины в коммит.",
      ),
    ], ["Тест на ширинах", "Снимки состояний и тем", "Процесс и документация причин"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.debugging-css.f1", front: "Пять вопросов отладки?", back: "Разобрано → сопоставлено → выиграло каскад → какое значение → применимо в этом контексте." },
    { id: "css.debugging-css.f2", front: "Неверное значение в CSS?", back: "Объявление отбрасывается молча; соседние остаются: `color: redd; color: blue` → синий." },
    { id: "css.debugging-css.f3", front: "Невалидный селектор в списке?", back: "Отбрасывается всё правило; в `:is()` и `:where()` список «прощающий»." },
    { id: "css.debugging-css.f4", front: "`100vw` и полоса прокрутки?", back: "`100vw` не вычитает полосу: выступ 15 px при классической полосе." },
    { id: "css.debugging-css.f5", front: "`z-index` не работает?", back: "Предок создал контекст наложения (`transform`, `opacity < 1`, `isolation`…); смотрите цепочку предков." },
    { id: "css.debugging-css.f6", front: "Бисекция таблицы?", back: "Двоичный поиск первого правила, после которого проявляется симптом: 200 правил — 10 проверок." },
  ],

  sources: [
    { title: "CSS Syntax Module Level 3: Error handling", url: "https://www.w3.org/TR/css-syntax-3/#error-handling", publisher: "W3C" },
    { title: "CSSOM View Module", url: "https://www.w3.org/TR/cssom-view-1/", publisher: "W3C" },
    { title: "MDN: Stacking context", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context", publisher: "MDN" },
    { title: "MDN: CSS.supports()", url: "https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports_static", publisher: "MDN" },
    { title: "MDN: Quirks mode and standards mode", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Quirks_mode_and_standards_mode", publisher: "MDN" },
    { title: "Chrome DevTools: View and change CSS", url: "https://developer.chrome.com/docs/devtools/css", publisher: "Other" },
  ],
};

