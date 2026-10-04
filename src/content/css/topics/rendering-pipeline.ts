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
  wrongRight,
} from "../../dsl";

export const renderingPipeline: Topic = {
  id: "css.rendering-pipeline",
  slug: "rendering-pipeline",
  domain: "css",
  module: "rendering",
  title: "Конвейер рендеринга: от стилей до пикселей",
  titleEn: "The rendering pipeline: style, layout, paint, composite, forced reflow and invalidation scope",
  summary:
    "После каждого изменения браузер заново проходит конвейер: пересчёт стилей, раскладка, отрисовка, композиция. Тема показывает, какие стадии запускает каждое изменение (по трассировке Chromium: `width` — стиль, layout и paint; `background-color` — стиль и paint; уже заданный `transform` — только стиль), как чтение геометрии после записи принудительно запускает раскладку (500 раскладок против одной на одинаковой работе), какие чтения безопасны, как далеко распространяется пересчёт стилей (2000 против 4002 против 2 элементов) и что реально делают слои композитора. Все числа получены трассировкой и счётчиками Chromium.",
  minutes: 55,
  prerequisites: ["css.how-css-works", "css.stacking-contexts", "css.animation-performance-motion"],
  tags: ["rendering pipeline", "style recalc", "layout", "reflow", "paint", "composite", "layers", "forced synchronous layout", "layout thrashing", "invalidation", "will-change", "CDP tracing", "performance"],
  keyConcepts: [
    { term: "Чем раньше стадия, тем дороже", text: "Изменение на ранней стадии запускает все последующие: `width` даёт стиль → layout → paint, `background-color` — стиль → paint, уже заданный `transform` — только стиль (замер трассировкой)." },
    { term: "Принудительная раскладка", text: "Чтение геометрии (`offsetWidth`, `getBoundingClientRect()`) после записи заставляет браузер немедленно пересчитать раскладку. В цикле это 500 раскладок вместо одной (замер для 500 элементов)." },
    { term: "Охват инвалидации", text: "Браузер пересчитывает стили не всей страницы, а затронутых элементов: класс на `<html>` с правилом `.dark .item` пересчитал 2000 элементов, пользовательское свойство на `<html>` — 4002, на листе — 2." },
    { term: "Слой — не бесплатно", text: "`will-change: transform` и `translateZ(0)` создают отдельный слой композитора: 10 карточек дали 10 слоёв 300×200. Каждый слой занимает память текстуры." },
    { term: "Измеряйте стадии", text: "Трассировка (`UpdateLayoutTree`, `Layout`, `Paint`) и счётчики (`LayoutCount`) отвечают на вопрос «что запустило это изменение» точнее, чем догадки." },
  ],
  sections: [
    section("definition", [
      def("Конвейер рендеринга", "Последовательность стадий, превращающая DOM и CSS в пиксели: стили → раскладка → подготовка к отрисовке → отрисовка → слои → растеризация и композиция.", "rendering pipeline"),
      def("Пересчёт стилей", "Сопоставление селекторов с элементами и вычисление итоговых значений свойств (`UpdateLayoutTree` в трассировке Chromium).", "style recalculation"),
      def("Раскладка (layout, reflow)", "Вычисление размеров и положения каждого блока по вычисленным стилям (`Layout`).", "layout / reflow"),
      def("Отрисовка (paint)", "Запись команд рисования (фоны, границы, текст) для слоёв (`Paint`); растеризация выполняется отдельно.", "paint"),
      def("Композиция", "Сборка кадра из растеризованных слоёв с применением трансформаций, прозрачности и прокрутки; выполняется отдельным потоком.", "compositing"),
      def("Принудительная раскладка", "Ситуация, когда скрипт читает значение, зависящее от раскладки, при «грязной» раскладке, и браузер вынужден пересчитать её немедленно, посреди выполнения скрипта.", "forced synchronous layout"),
      def("Инвалидация", "Пометка того, что должно быть пересчитано после изменения: набор элементов для стилей, поддеревья для раскладки, области для отрисовки.", "invalidation"),
    ]),

    section("why", [
      h("Кадр — это бюджет"),
      p("При 60 кадрах в секунду на кадр приходится около 16,7 мс (1000 / 60), при 120 — около 8,3 мс. В этот бюджет должны уместиться скрипты, пересчёт стилей, раскладка и отрисовка на главном потоке. Если работа не помещается, кадры пропускаются, и анимация дёргается."),
      h("Одинаковый результат — разная цена"),
      p("Два цикла делают одно и то же: уменьшают ширину 500 элементов на 10 пикселей. Первый читает `offsetWidth` и сразу пишет `style.width` у каждого элемента, второй сначала читает все значения, потом пишет. Счётчик Chromium показал **500 раскладок против одной**; в нашем запуске это около 133 мс против 6 мс (абсолютные цифры зависят от машины, разница в числе раскладок — нет)."),
      h("Что объясняет эта тема"),
      ul(
        "Почему `transform` и `opacity` дешевле `left` и `width`, а `background-color` — где-то посередине.",
        "Почему безобидное чтение `offsetWidth` может превратить обработчик в тормоз.",
        "Почему переключение темы или класса на корне стоит дороже, чем на листе.",
        "Почему `will-change` не стоит вешать на всё подряд.",
      ),
      insight("Скорость интерфейса определяется не «количеством CSS», а тем, **какие стадии конвейера и для скольких элементов вы запускаете** на каждое изменение."),
    ]),

    section("mental-model", [
      p("Представьте **типографию**. Стили — решение, каким шрифтом и краской печатать; раскладка — вёрстка полос (где какой абзац встанет); отрисовка — печать полос; композиция — склейка готовых листов в разворот. Если изменился текст абзаца, нужно переверстать полосу и перепечатать. Если изменился цвет — переверстывать не надо, но перепечатать придётся. Если нужно сдвинуть уже напечатанный лист — достаточно переложить его при склейке, ничего не печатая."),
      table(
        ["Стадия", "Что делает", "Событие трассировки Chromium", "Что запускает"],
        [
          ["Стили", "Сопоставляет селекторы, вычисляет значения свойств", "`UpdateLayoutTree`", "Любое изменение классов, атрибутов, `style`, правил"],
          ["Раскладка", "Считает размеры и положения блоков", "`Layout`", "Свойства, влияющие на геометрию (`width`, `margin`, `display`…)"],
          ["Подготовка к отрисовке", "Строит деревья свойств (transform, clip, effect, scroll) и находит, что перерисовать", "`PrePaint`", "Почти любое визуальное изменение"],
          ["Отрисовка", "Записывает команды рисования для слоёв", "`Paint`", "Цвета, фоны, тени, границы, текст"],
          ["Слои и композиция", "Делит на слои, растеризует плитки, собирает кадр на GPU", "`Layerize`, `Commit`, растеризация", "Трансформации и прозрачность слоя, прокрутка"],
        ],
        "Стадии конвейера (по архитектуре RenderingNG)",
      ),
    ]),

    section("technical", [
      h("Что запускает каждое изменение"),
      p("Для каждой строки таблицы один элемент в странице меняется скриптом; трассировка Chromium (`devtools.timeline`) считает события после изменения. «Layout» учитывает только раскладки с ненулевым числом «грязных» объектов."),
      table(
        ["Изменение", "Стили", "Layout", "Paint"],
        [
          ["`width`", "да", "**да**", "да"],
          ["`background-color`", "да", "нет", "да"],
          ["`box-shadow`", "да", "нет", "да"],
          ["`display: none`", "да", "**да**", "да"],
          ["`transform` из `none`", "да", "**да**", "да"],
          ["`transform`, если значение уже задано", "да", "нет", "**нет**"],
          ["`transform` при `will-change: transform`", "да", "нет", "**нет**"],
          ["`opacity` из `1`", "да", "**да**", "да"],
          ["`opacity`, если значение уже задано (`0.99`)", "да", "нет", "**нет**"],
        ],
        "Стадии после одного изменения (замер, Chromium)",
      ),
      ul(
        "**Стили запускаются всегда** — менялось значение, значит, его нужно вычислить.",
        "**Первое появление** `transform` или `opacity` на элементе (из `none` или `1`) создаёт новое свойство в деревьях отрисовки и стоит раскладки и отрисовки. Дальнейшие изменения значения — только стиль: ни раскладки, ни отрисовки не выполняется.",
        "Поэтому анимируемому элементу задают начальное значение (`transform: translateX(0)`) или `will-change` **до** старта анимации, а не в её первом кадре.",
        "`width` и `display` меняют геометрию: раскладка выполняется всегда, и отрисовка вместе с ней.",
      ),
      note("Таблица описывает Chromium. Другие движки устроены иначе; общий вывод один: чем раньше стадия, тем дороже, а изменения, которые композитор делает сам (трансформация и прозрачность готового слоя), — самые дешёвые."),

      h("Принудительная раскладка"),
      p("Браузер откладывает раскладку до конца кадра и объединяет все изменения в один проход. Но если скрипт читает значение, которое зависит от раскладки, а она «грязная», пересчёт выполняется немедленно. Замер: что именно принуждает к пересчёту после записи `width` (раскладка грязная) и после записи `color` (грязны только стили):"),
      table(
        ["Чтение", "После записи `width`", "После записи `color`"],
        [
          ["`el.offsetWidth`, `clientHeight`, `scrollTop`", "стили + **layout**", "только стили"],
          ["`el.getBoundingClientRect()`, `getClientRects()`", "стили + **layout**", "только стили"],
          ["`getComputedStyle(el).height` / `.width`", "стили + **layout**", "только стили"],
          ["`getComputedStyle(el).color`", "только стили", "только стили"],
          ["`el.innerText`, `el.offsetParent`, `scrollIntoView()`", "стили + **layout**", "только стили"],
          ["`el.focus()`", "стили (дважды) + **layout**", "стили (дважды)"],
          ["`el.getAnimations()`", "только стили", "только стили"],
          ["`el.textContent`, `el.matches()`, `classList.contains()`, `window.innerWidth`", "ничего", "ничего"],
        ],
        "Что принудительно вызывает пересчёт (замер)",
      ),
      ul(
        "Раскладку форсируют **геометрические** чтения (`offsetWidth`, `getBoundingClientRect()`, `getComputedStyle().width`), а не любые обращения к DOM.",
        "`getComputedStyle(el).color` после записи `width` форсирует только стили: браузер считает лишь то, что нужно для ответа.",
        "Если раскладка чистая, повторные геометрические чтения бесплатны: замер на 500 элементах — 0 раскладок.",
      ),

      h("Layout thrashing"),
      p("Чередование «запись — чтение геометрии» в цикле заставляет браузер раскладывать страницу на каждом шаге. Замер на 500 элементах (стили — только `width`):"),
      table(
        ["Вариант", "Раскладок", "Время (наш запуск)"],
        [
          ["Чтение и запись вперемешку", "500", "около 133 мс"],
          ["Сначала все чтения, потом все записи", "1", "около 6 мс"],
          ["Только записи", "1", "около 10 мс"],
          ["Чтения без записей", "0", "около 1 мс"],
        ],
        "Чередование против разделения (число раскладок — стабильно, время зависит от машины)",
      ),
      code(
        "js",
        `
        // плохо: каждая итерация читает значение, сделанное «грязным» предыдущей записью
        for (const el of items) el.style.width = (el.offsetWidth - 10) + "px";

        // хорошо: фаза чтения, затем фаза записи
        const widths = items.map((el) => el.offsetWidth);
        items.forEach((el, i) => { el.style.width = (widths[i] - 10) + "px"; });
        `,
        { filename: "read-write.js" },
      ),
      p("Если размеры нужны по факту изменения, используйте `ResizeObserver`: замер для 300 элементов с изменением `width` дал **одну** раскладку и 300 полученных размеров — наблюдатель получает значения из жизненного цикла кадра, а не из форсированного чтения."),

      h("Охват инвалидации стилей"),
      p("Браузер не пересчитывает стили всей страницы: он находит затронутые элементы по правилам, которые зависят от изменённого признака. Замер: страница с 2000 элементами `.item` (внутри каждого `.label`), число пересчитанных элементов по трассировке:"),
      table(
        ["Изменение", "Пересчитано элементов"],
        [
          ["Класс на `<html>`, правило `.dark .item`", "2000"],
          ["Класс на `<html>`, правило `.dark .label`", "2000"],
          ["Класс на одном `.item`, правило `.item.on`", "1"],
          ["Класс на `<html>`, ни одно правило от него не зависит", "0 (события пересчёта нет)"],
          ["Пользовательское свойство на `<html>`, которое читают все `.item`", "**4002**"],
          ["Пользовательское свойство на одном элементе, которое не читает ни одно правило", "1 (раскладки и отрисовки нет)"],
          ["Пользовательское свойство на одном `.item`", "2"],
        ],
        "Охват пересчёта стилей (замер)",
      ),
      ul(
        "Пересчёт зависит от **правил, которые затронул признак**, а не от размера DOM: класс, под который нет правил, не стоит ничего.",
        "Пользовательские свойства **наследуются**: смена на высоком предке пересчитывает всех потомков (4002 = 2000 `.item` + 2000 `.label` + 2 контейнера), даже тех, что значение не читают.",
        "Поэтому часто меняемые значения (позиция указателя, прогресс) задают на узком элементе-владельце, а не на `<html>`.",
      ),
      tip("Смена темы на `<html>` пересчитывает все элементы, чей вид от темы зависит, — это неизбежно. Если нужно уменьшить стоимость, сокращайте число элементов с правилами под тему, а не гоняйтесь за селекторами."),

      h("Слои композитора"),
      p("Элемент получает отдельный слой при `will-change: transform` и при `transform: translateZ(0)`. Замер дерева слоёв (`LayerTree`) для 10 карточек 300×200:"),
      table(
        ["Вариант", "Слоёв 300×200"],
        [
          ["Без `will-change`", "0"],
          ["`will-change: transform`", "10"],
          ["`transform: translateZ(0)`", "10"],
          ["`opacity: 0.99` без `will-change`", "0"],
          ["100 карточек, `will-change`, окно 1000×800", "69"],
          ["100 карточек, `will-change`, окно 1000×8000", "100"],
        ],
        "Отдельные слои (замер)",
      ),
      ul(
        "Слой — память: оценка по формуле «ширина × высота × 4 байта» даёт около 234 КиБ на слой 300×200, около 23 МиБ на сотню.",
        "Число слоёв зависит от того, что находится рядом с областью просмотра: в окне 1000×800 из 100 карточек получилось 69 слоёв, в окне 1000×8000 — все 100.",
        "Слой нужен тем, что меняется часто и независимо (анимируемый элемент, плавающая панель). Постоянные «ускорения» на статичных элементах только тратят память.",
      ),

      h("Как измерить стадии самому"),
      p("Для разового анализа достаточно панели Performance в DevTools: стадии видны на таймлайне как «Recalculate style», «Layout», «Pre-paint», «Paint», «Layerize», «Commit». Для проверок в тестах используйте трассировку через CDP — скрипт в «Подробном примере»."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `
        function resizeAll(items) {
          const widths = items.map((el) => el.offsetWidth);
          items.forEach((el, i) => {
            el.style.width = widths[i] - 10 + "px";
          });
        }

        const ro = new ResizeObserver((entries) => {
          for (const e of entries) console.log(e.contentRect.width);
        });
        `,
        [
          { line: 2, text: "Фаза чтения: одна раскладка (если она «грязная»), остальные чтения бесплатны." },
          { line: [3, 5], text: "Фаза записи: браузер только помечает раскладку «грязной» и откладывает её до конца кадра." },
          { line: [8, 10], text: "`ResizeObserver` отдаёт размеры из цикла кадра: узнать новый размер без форсирования раскладки." },
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
        <title>Принудительная раскладка</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          button { margin: 0 0.5rem 0.5rem 0; padding: 0.4rem 0.8rem; font: inherit; }
          output { display: block; margin-bottom: 0.5rem; }
          .list { inline-size: 24rem; max-inline-size: 100%; max-block-size: 8rem; overflow: auto; border: 1px solid #c5cae9; }
          .item { box-sizing: border-box; padding: 2px 8px; border-bottom: 1px solid #e0e3f5; }
        </style>
        <button type="button" id="mixed">Читать и писать вперемешку</button>
        <button type="button" id="batched">Сначала читать, потом писать</button>
        <output id="out">Нажмите кнопку</output>
        <div class="list" id="list"></div>
        <script>
          const list = document.querySelector("#list");
          const out = document.querySelector("#out");

          function fill() {
            list.textContent = "";
            for (let i = 0; i < 500; i++) {
              const d = document.createElement("div");
              d.className = "item";
              d.textContent = "Строка " + i;
              list.append(d);
            }
            list.offsetHeight;                          // начать с чистой раскладки
          }

          function measure(label, work) {
            fill();
            const t0 = performance.now();
            work([...list.children]);
            list.offsetHeight;                          // учесть последнюю раскладку
            out.textContent = label + ": " + Math.round(performance.now() - t0) + " мс";
          }

          document.querySelector("#mixed").addEventListener("click", () => measure("вперемешку", (items) => {
            for (const el of items) el.style.width = (el.offsetWidth - 10) + "px";
          }));
          document.querySelector("#batched").addEventListener("click", () => measure("разделено", (items) => {
            const widths = items.map((el) => el.offsetWidth);
            items.forEach((el, i) => { el.style.width = (widths[i] - 10) + "px"; });
          }));
        </script>
        </html>
        `,
        { filename: "forced-layout.html", runnable: true, lineNumbers: true },
      ),
      p("Нажмите обе кнопки несколько раз: «вперемешку» заметно медленнее, чем «разделено». Абсолютные цифры зависят от устройства; в нашем запуске было около 160 мс против 5 мс — разница в десятки раз."),
    ]),

    section("detailed-example", [
      p("Скрипт для Node.js с Playwright и Chromium, который по трассировке считает стадии после каждого изменения. Этим же скриптом получена таблица «Что запускает каждое изменение»."),
      code(
        "js",
        `
        // trace-stages.mjs — какие стадии конвейера выполняет Chromium после изменения (Node + Playwright)
        import { chromium } from "playwright";

        async function stages(page, cdp, action) {
          const events = [];
          cdp.on("Tracing.dataCollected", (d) => events.push(...d.value));
          const complete = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
          await cdp.send("Tracing.start", { categories: "devtools.timeline", transferMode: "ReportEvents" });
          await action();
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100)))));
          await cdp.send("Tracing.end");
          await complete;
          cdp.removeAllListeners("Tracing.dataCollected");

          const named = (name) => events.filter((e) => e.name === name && (e.ph === "X" || e.ph === "B"));
          return {
            style: named("UpdateLayoutTree").length,                                                    // пересчёт стилей
            layout: named("Layout").filter((e) => (e.args?.beginData?.dirtyObjects ?? 0) > 0).length,   // реальная раскладка
            paint: named("Paint").length,                                                               // запись команд отрисовки
          };
        }

        const browser = await chromium.launch();
        const page = await browser.newPage();
        const cdp = await page.context().newCDPSession(page);

        const cases = {
          "width":                 { css: "", change: "width = '300px'" },
          "background-color":      { css: "", change: "backgroundColor = 'rgb(179, 38, 30)'" },
          "transform (из none)":   { css: "", change: "transform = 'translateX(100px)'" },
          "transform (уже задан)": { css: ".box { transform: translateX(0) }", change: "transform = 'translateX(100px)'" },
          "transform + will-change": { css: ".box { will-change: transform }", change: "transform = 'translateX(100px)'" },
          "opacity (из 1)":        { css: "", change: "opacity = '0.3'" },
          "opacity (уже 0.99)":    { css: ".box { opacity: 0.99 }", change: "opacity = '0.3'" },
          "box-shadow":            { css: "", change: "boxShadow = '0 10px 20px rgba(0,0,0,.5)'" },
          "display: none":         { css: "", change: "display = 'none'" },
        };

        for (const [label, { css, change }] of Object.entries(cases)) {
          await page.setContent("<style>body{margin:0}.box{width:100px;height:100px;margin:20px;background:rgb(47,61,154)}" + css + "</style><div class=box></div><p>сосед</p>");
          await page.waitForTimeout(300);
          const result = await stages(page, cdp, () => page.evaluate("document.querySelector('.box').style." + change));
          console.log(label.padEnd(26), JSON.stringify(result));
        }
        await browser.close();
        `,
        { filename: "trace-stages.mjs", lineNumbers: true, collapsed: true },
      ),
      code(
        "text",
        `
        width                      {"style":1,"layout":1,"paint":2}
        background-color           {"style":1,"layout":0,"paint":2}
        transform (из none)        {"style":1,"layout":1,"paint":2}
        transform (уже задан)      {"style":1,"layout":0,"paint":0}
        transform + will-change    {"style":1,"layout":0,"paint":0}
        opacity (из 1)             {"style":1,"layout":1,"paint":2}
        opacity (уже 0.99)         {"style":1,"layout":0,"paint":0}
        box-shadow                 {"style":1,"layout":0,"paint":2}
        display: none              {"style":1,"layout":1,"paint":2}
        `,
        { filename: "output.txt" },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент скрипта", "Что делает и почему"],
        [
          ["`Tracing.start` с категорией `devtools.timeline`", "Включает события конвейера: `UpdateLayoutTree`, `Layout`, `Paint`"],
          ["Два `requestAnimationFrame` и пауза 100 мс", "Даёт браузеру пройти кадр после изменения; события приходят после `Tracing.end`"],
          ["`named(\"Layout\").filter(dirtyObjects > 0)`", "Отбрасывает «пустые» проходы раскладки без изменений"],
          ["`await page.waitForTimeout(300)` перед замером", "Дожидается завершения первой отрисовки: иначе она попадёт в счёт"],
          ["`paint: 2` вместо `1`", "Число событий отрисовки не равно числу «перерисовок»; значим признак «больше нуля»"],
        ],
        "Как читать скрипт",
      ),
      ul(
        "Строки `transform (уже задан)` и `transform + will-change` дают `layout: 0` и `paint: 0` — изменение не покидает главный поток дальше стиля.",
        "Строки `transform (из none)` и `opacity (из 1)` совпадают по числам с `width`: первое появление свойства стоит дорого.",
        "Строка `display: none` показывает, что раскладка нужна даже тогда, когда элемент исчезает.",
        "Результат стабилен: три запуска подряд дали идентичный вывод.",
      ),
    ]),

    section("internals", [
      h("Два потока и деревья свойств"),
      p("В современном Chromium (архитектура RenderingNG) главный поток выполняет скрипты, стили, раскладку, подготовку к отрисовке и отрисовку, а композитор — отдельный поток, собирающий кадр. Между ними передаётся не картинка, а описание: список команд рисования и **деревья свойств** — трансформаций, обрезки, эффектов и прокрутки. Изменение значения уже существующего узла дерева (например, `transform` у элемента, где он уже был) не требует новой записи команд — это объясняет нулевой `Paint` в замере."),
      h("Почему первое появление дороже"),
      p("Когда у элемента впервые появляется `transform` или `opacity`, ему нужно создать узел в деревьях свойств, а значит — пересмотреть раскладку и перерисовать его (в замере: layout и paint). Потом достаточно менять значения узла."),
      h("Отложенная раскладка"),
      steps(
        [
          ["Запись", "`el.style.width = …` помечает элемент и его контейнеры «грязными»; стили могут быть вычислены позже."],
          ["Накопление", "Следующие записи добавляют отметки; ничего не пересчитывается."],
          ["Чтение геометрии", "Если скрипт запрашивает размер, браузер вынужден синхронно довести стили и раскладку до актуального состояния."],
          ["Кадр", "Если чтений не было, пересчёт выполняется один раз при подготовке кадра."],
        ],
        "Когда выполняется раскладка",
      ),
      p("Поэтому «грязная» раскладка + чтение геометрии = немедленный пересчёт. В цикле он повторяется на каждой итерации, как показал замер (500 раскладок)."),
      h("Что экономит браузер сам"),
      ul(
        "Не выполняет пересчёт стилей, если ни одно правило от изменённого признака не зависит (0 событий в замере).",
        "Раскладывает только «грязные» объекты: в замере изменение ширины одного `.item` из 2000 пометило 5 объектов из 4004, изменение ширины контейнера — 4.",
        "Не вызывает отрисовку при изменении значения уже существующего узла `transform` или `opacity`.",
      ),
    ]),

    section("mistakes", [
      h("Ошибка 1. Чтение геометрии в цикле записи"),
      wrongRight(
        "js",
        {
          code: `
            for (const el of items) {
              el.style.height = (el.offsetHeight + 10) + "px";   // чтение после записи — раскладка на каждой итерации
            }
          `,
          note: "Замер для 300 элементов: 300 раскладок.",
        },
        {
          code: `
            const heights = items.map((el) => el.offsetHeight);
            items.forEach((el, i) => { el.style.height = (heights[i] + 10) + "px"; });
          `,
          note: "Одна раскладка; итоговая высота идентична (проверено сравнением).",
        },
      ),
      h("Ошибка 2. Анимировать свойства раскладки"),
      p("`left`, `top`, `width`, `height` запускают раскладку на каждом кадре. Для движения используйте `transform`, для появления — `opacity`; начальное значение задайте заранее, чтобы первый кадр не стоил раскладки и отрисовки."),
      h("Ошибка 3. `will-change` на всём"),
      p("Каждый слой занимает память текстуры: замер для 100 карточек дал 69–100 слоёв по 300×200, то есть порядка 16–23 МиБ по оценке. Слой нужен тем, что действительно анимируется."),
      h("Ошибка 4. Чтение размеров в обработчике `scroll`"),
      p("Обработчик, вызывающий `getBoundingClientRect()` после записи стилей, форсирует раскладку при каждом событии. Используйте `IntersectionObserver` и `ResizeObserver`, которые не форсируют её."),
      h("Ошибка 5. Менять значения на `<html>`, когда достаточно листа"),
      p("Пользовательское свойство на `<html>` пересчитало 4002 элемента, на листе — 2. Часто меняемые значения (позиция указателя, прогресс) держите у владельца."),
      h("Ошибка 6. Угадывать вместо измерения"),
      p("«Это должно быть быстро» не аргумент: трассировка показывает, какие стадии на самом деле выполняются. Один скрипт на 40 строк заменяет споры."),
      h("Ошибка 7. Переносить числа Chromium на все браузеры"),
      p("Таблицы этой темы измерены в Chromium. Принципы (чем раньше стадия, тем дороже; не читать геометрию после записи) общие, а конкретные «нули» могут отличаться."),
      h("Ошибка 8. Считать `translateZ(0)` бесплатным ускорением"),
      p("Замер: `translateZ(0)` на десяти карточках создал десять слоёв, как и `will-change: transform`. Это решение с ценой, а не «оптимизация по умолчанию»."),
    ]),

    section("antipatterns", [
      ul(
        "**Чередование чтения и записи геометрии** в циклах и обработчиках.",
        "**Анимация `top`, `left`, `width`, `height`, `margin`** вместо `transform` и `opacity`.",
        "**Глобальный `will-change` и `translateZ(0)` на каждом блоке.**",
        "**Пользовательские свойства на `<html>` для быстро меняющихся значений.**",
        "**Оптимизация без трассировки:** правка селекторов «по ощущениям».",
        "**Чтение `offsetWidth` в `scroll` и `resize` без наблюдателей.**",
        "**Таймеры `setTimeout` для отрисовки** вместо `requestAnimationFrame`.",
        "**Включение слоя в первый кадр анимации,** а не заранее.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Разделяйте фазы:** сначала все чтения, затем все записи.",
        "**Анимируйте `transform` и `opacity`;** начальное значение или `will-change` задавайте до старта.",
        "**Используйте `ResizeObserver` и `IntersectionObserver`** вместо опроса размеров.",
        "**Снимайте `will-change` после анимации,** если слой больше не нужен.",
        "**Держите меняющиеся значения у владельца:** узкий элемент, а не корень.",
        "**Измеряйте:** трассировка в тестах, Performance в DevTools; сравнивайте до и после.",
        "**Планируйте работу кадра:** запись стилей в `requestAnimationFrame`, чтение — до записи.",
        "**Фиксируйте числа в тестах:** `layout: 0` для анимации — условие приёмки.",
      ),
    ]),

    section("edge-cases", [
      h("Скрытая вкладка"),
      p("В неактивной вкладке кадры не рисуются: изменения накапливаются, а стоимость проявляется при возврате. Измерения проводите в видимом окне."),
      h("Слои зависят от области просмотра"),
      p("Количество слоёв в замере изменилось от окна 1000×800 (69) к 1000×8000 (100): не делайте выводов о слоях на странице другого размера."),
      h("`display: none` и `visibility: hidden`"),
      p("`display: none` убирает элемент из раскладки: замер показал раскладку и отрисовку. `visibility: hidden` оставляет место в раскладке — проверьте стадии трассировкой для своего случая."),
      h("Вложенные раскладки"),
      p("Изменение размера элемента помечает его и тех, чья геометрия может от него зависеть. Узнать охват для своей разметки можно в трассировке: событие `Layout` содержит `beginData.dirtyObjects` и `totalObjects` (в замере на 2000 элементах — 5 из 4004)."),
      h("Фокус"),
      p("`el.focus()` дважды пересчитывает стили (замер): помните об этом, когда переводите фокус в цикле."),
    ]),

    section("related", [
      ul(
        "[Как работает CSS](/learn/css/how-css-works) — этапы от разбора до отрисовки.",
        "[Анимации и производительность](/learn/css/animation-performance-motion) — compositor, FLIP, WAAPI.",
        "[Контексты наложения](/learn/css/stacking-contexts) — как появляются слои.",
        "[Содержащий блок](/learn/css/containing-block) — влияние на раскладку.",
        "[Производительность CSS](/learn/css/css-performance) — `contain`, `content-visibility`, загрузка.",
        "[Отладка CSS](/learn/css/debugging-css) — DevTools и поиск причин.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "500 раскладок",
          code: `
            for (const el of items) {
              el.style.width = (el.offsetWidth - 10) + "px";
            }
          `,
          note: "Чтение после записи форсирует раскладку на каждой итерации: 500 раскладок, около 133 мс в нашем запуске.",
        },
        {
          title: "1 раскладка",
          code: `
            const widths = items.map((el) => el.offsetWidth);
            items.forEach((el, i) => {
              el.style.width = (widths[i] - 10) + "px";
            });
          `,
          note: "Все чтения до записей: одна раскладка, около 6 мс; результат идентичен.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.rendering-pipeline.ex1",
      title: "Какие стадии запустятся",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждого изменения одного элемента назовите, какие стадии (стили, layout, paint) выполнятся в Chromium. Предположение: до изменения у элемента нет `transform` и `opacity`, если не сказано иное."),
        ul(
          "`width: 100px → 300px`",
          "`background-color`: синий → красный",
          "`transform: none → translateX(100px)`",
          "`transform: translateX(0) → translateX(100px)` (значение уже было задано стилем)",
          "`opacity: 1 → 0.3`",
          "`opacity: 0.99 → 0.3` (значение уже было задано стилем)",
        ),
      ],
      hints: ["Создаётся ли новое свойство в деревьях отрисовки?", "Меняется ли геометрия?"],
      checks: ["Для каждой строки названы стадии", "Различены «из `none`» и «уже задан»", "Названа причина разницы"],
      solution: [
        table(
          ["Изменение", "Стили", "Layout", "Paint"],
          [
            ["`width`", "да", "да", "да"],
            ["`background-color`", "да", "нет", "да"],
            ["`transform` из `none`", "да", "да", "да"],
            ["`transform` уже задан", "да", "нет", "нет"],
            ["`opacity` из `1`", "да", "да", "да"],
            ["`opacity` уже задан", "да", "нет", "нет"],
          ],
          "Разбор",
        ),
        p("Первое появление `transform` и `opacity` создаёт узел в деревьях свойств и стоит раскладки с отрисовкой; изменение значения существующего узла — только стили. Все шесть результатов получены трассировкой Chromium."),
      ],
    }),
    exercise({
      id: "css.rendering-pipeline.ex2",
      title: "Устраните принудительные раскладки",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Список из 300 элементов `.item`, высота каждого увеличивается на 10 пикселей. Код вызывает 300 раскладок. Перепишите его так, чтобы раскладка выполнялась один раз, и докажите, что итоговая высота не изменилась."),
        code(
          "js",
          `
          for (const el of document.querySelectorAll(".item")) {
            el.style.height = (el.offsetHeight + 10) + "px";
          }
          `,
        ),
      ],
      hints: ["Что делает чтение `offsetHeight` после записи в предыдущую итерацию?", "Как собрать все значения заранее?"],
      checks: ["Раскладок не больше одной", "Итоговые высоты совпадают с исходным вариантом", "Чтения отделены от записей"],
      solution: [
        code(
          "js",
          `
          const items = [...document.querySelectorAll(".item")];
          const heights = items.map((el) => el.offsetHeight);                     // все чтения
          items.forEach((el, i) => { el.style.height = (heights[i] + 10) + "px"; });  // все записи
          `,
        ),
        p("Замер: исходный цикл — 300 раскладок, исправленный — 1. Итоговая высота совпала (46 пикселей на тестовой разметке в обоих вариантах)."),
      ],
    }),
    exercise({
      id: "css.rendering-pipeline.ex3",
      title: "Предскажите и измерьте",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Дополните `trace-stages.mjs` двумя случаями: изменение `margin-left` у элемента и добавление класса, под который в CSS нет ни одного правила. Для каждого предскажите значения `style`, `layout`, `paint`, затем запустите скрипт и объясните расхождения, если они есть."),
      ],
      hints: ["Влияет ли `margin-left` на геометрию?", "Нужно ли пересчитывать стили, если ни одно правило не зависит от класса?"],
      checks: ["Даны предсказания", "Скрипт дополнен и запущен", "Объяснено каждое расхождение"],
      solution: [
        p("`margin-left` меняет геометрию: ожидается `style: 1`, `layout: 1`, `paint > 0`. Пользовательское свойство, которое не читает ни одно правило, не влияет ни на геометрию, ни на вид: ожидается `style: 1`, `layout: 0`, `paint: 0` — стиль элемента всё же приходится пересчитать, потому что изменился атрибут `style`."),
        code(
          "js",
          `
          "margin-left":                { css: "", change: "marginLeft = '40px'" },
          "--unused (никто не читает)": { css: "", change: "setProperty('--unused', '1')" },
          `,
          { filename: "extra-cases.mjs" },
        ),
        p("Замер: `margin-left` — `{style: 1, layout: 1, paint: 2}`, `--unused` — `{style: 1, layout: 0, paint: 0}`. Расхождения с предсказанием (если они были) указывают на то, что стадия запускается шире, чем вы ожидали."),
      ],
    }),
  ],

  challenge: {
    id: "css.rendering-pipeline.challenge",
    title: "Тест на отсутствие принудительных раскладок в обработчике",
    scenario: [
      p("Команда жалуется: список из 500 строк «подвисает» при выравнивании ширины. Нужно найти причину по числу раскладок, исправить и добавить тест, который упадёт, если принудительные раскладки вернутся."),
    ],
    requirements: [
      "Измерить число раскладок до исправления счётчиком `LayoutCount` (CDP `Performance.getMetrics`)",
      "Исправить: фазы чтения и записи разделены",
      "Тест: число раскладок за действие не больше двух",
      "Тест: итоговые ширины совпадают с исходным вариантом",
    ],
    constraints: [
      "Нельзя менять результат (итоговые значения `style.width`)",
      "Нельзя использовать таймеры, скрывающие проблему",
    ],
    acceptance: [
      "Исходный вариант даёт 500 раскладок, исправленный — не больше 2 (замер: 1)",
      "Итоговые ширины идентичны",
      "Тест падает, если вернуть исходный цикл",
    ],
    hints: [
      "Как получить счётчик раскладок из страницы?",
      "Что вызывает раскладку в каждой итерации?",
      "Как сравнить итоговые значения двух вариантов?",
    ],
    solution: [
      code(
        "js",
        `
        // layout-count.test.mjs
        import { chromium } from "playwright";

        const browser = await chromium.launch();
        const page = await browser.newPage();
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Performance.enable");
        const layoutCount = async () => (await cdp.send("Performance.getMetrics")).metrics.find((m) => m.name === "LayoutCount").value;

        const html = "<style>body{margin:0}.item{padding:4px;border-bottom:1px solid #ccc}</style>" +
          Array.from({ length: 500 }, (_, i) => "<div class=item>Строка " + i + "</div>").join("");

        async function run(work) {
          await page.setContent(html);
          await page.evaluate("document.body.offsetHeight");               // чистая раскладка
          const before = await layoutCount();
          const widths = await page.evaluate("(() => { const items = [...document.querySelectorAll('.item')]; (" + work + ")(items); return items.map((el) => el.style.width); })()");
          return { layouts: (await layoutCount()) - before, widths };
        }

        const mixed = await run((items) => { for (const el of items) el.style.width = (el.offsetWidth - 10) + "px"; });
        const split = await run((items) => { const w = items.map((el) => el.offsetWidth); items.forEach((el, i) => { el.style.width = (w[i] - 10) + "px"; }); });

        console.log("вперемешку:", mixed.layouts, "разделено:", split.layouts);
        if (split.layouts > 2) throw new Error("принудительные раскладки вернулись: " + split.layouts);
        if (JSON.stringify(mixed.widths) !== JSON.stringify(split.widths)) throw new Error("итоговые ширины различаются");
        await browser.close();
        `,
        { filename: "layout-count.test.mjs", lineNumbers: true },
      ),
      ul(
        "**Измерение:** счётчик `LayoutCount` из CDP растёт на единицу за каждую раскладку.",
        "**Исправление:** все `offsetWidth` читаются до первой записи.",
        "**Тест:** условие `layouts ≤ 2` падает при возврате чередования; сравнение ширин гарантирует тот же результат.",
      ),
    ],
  },

  interview: [
    iq("css.rendering-pipeline.i1", "basic", "Из каких стадий состоит рендеринг страницы?", [
      p("Стили (сопоставление селекторов и вычисление значений) → раскладка (размеры и положения) → подготовка к отрисовке и отрисовка (команды рисования) → слои и композиция (сборка кадра). Чем раньше стадия, тем больше работы запускает изменение."),
    ]),
    iq("css.rendering-pipeline.i2", "basic", "Почему `transform` дешевле `left`?", [
      p("`left` меняет геометрию: на каждом кадре выполняются раскладка и отрисовка. Значение `transform` у элемента, где оно уже задано, меняется без раскладки и отрисовки — замер Chromium: layout 0, paint 0."),
    ]),
    iq("css.rendering-pipeline.i3", "intermediate", "Что такое принудительная синхронная раскладка?", [
      p("Чтение значения, зависящего от раскладки (`offsetWidth`, `getBoundingClientRect()`, `getComputedStyle().width`), после записи, которая сделала раскладку «грязной». Браузер пересчитывает её немедленно, не дожидаясь конца кадра. В цикле это 500 раскладок вместо одной."),
    ]),
    iq("css.rendering-pipeline.i4", "intermediate", "Как исправить layout thrashing?", [
      ul(
        "Разделить фазы: сначала все чтения, затем все записи.",
        "Для узнавания размеров использовать `ResizeObserver` (замер: 300 элементов — одна раскладка).",
        "Записи группировать в `requestAnimationFrame`.",
        "Измерять результат счётчиком раскладок.",
      ),
    ]),
    iq("css.rendering-pipeline.i5", "intermediate", "Первое включение `transform` стоит дороже последующих. Почему?", [
      p("Для элемента создаётся узел в деревьях свойств, поэтому нужны раскладка и отрисовка (замер: layout 1, paint > 0). Дальнейшие изменения значения идут по уже существующему узлу и дают layout 0 и paint 0. Поэтому начальное значение или `will-change` задают до старта анимации."),
    ]),
    iq("css.rendering-pipeline.i6", "advanced", "Почему пользовательское свойство на `<html>` может быть дорогим?", [
      p("Пользовательские свойства наследуются: смена на корне пересчитывает всех потомков (замер на 2000 элементов: 4002 пересчитанных), даже тех, что значение не читают. На узком элементе-владельце — 2."),
    ]),
    iq("css.rendering-pipeline.i7", "engineering", "Как автоматически проверить, что анимация не вызывает раскладки?", [
      ul(
        "Включить трассировку через CDP (`devtools.timeline`).",
        "Выполнить изменение и дождаться кадра.",
        "Подсчитать события `Layout` с ненулевым числом «грязных» объектов и `Paint`.",
        "Утвердить в тесте `layout === 0` (и `paint === 0` для случая уже заданного значения).",
      ),
    ]),
    iq("css.rendering-pipeline.i8", "debugging", "Страница «подвисает» при прокрутке. С чего начнёте?", [
      ul(
        "Запишу профиль в Performance: какие стадии занимают кадр — стили, раскладка, отрисовка.",
        "Найду форсированные раскладки в обработчиках `scroll` и `resize`: чтение геометрии после записи.",
        "Проверю, нет ли анимации свойств раскладки и избыточных слоёв (`will-change`).",
        "Исправлю и сравню числа до и после (число раскладок, длительность кадра).",
      ),
    ]),
  ],

  exam: [
    mcq("css.rendering-pipeline.e1", "foundation", "Какие стадии запускает изменение `background-color` у элемента?", ["Стили, layout, paint", "Только paint", "Стили и paint", "Только композиция"], 2, "Цвет не влияет на геометрию: пересчёт стилей и отрисовка без раскладки (замер: layout 0, paint > 0)."),
    mcq("css.rendering-pipeline.e2", "foundation", "Что дешевле всего для движения элемента, если у него уже задан `transform`?", ["Изменить значение `transform`", "Изменить `margin-left`", "Изменить `left`", "Изменить `width`"], 0, "Замер: стили без раскладки и без отрисовки; остальные свойства запускают раскладку."),
    mcq("css.rendering-pipeline.e3", "intermediate", "Какое чтение после записи `width` форсирует раскладку?", ["`el.textContent`", "`el.matches('.a')`", "`getComputedStyle(el).color`", "`el.getBoundingClientRect()`"], 3, "Геометрические чтения требуют актуальной раскладки; `color`, `textContent` и `matches` её не требуют."),
    mcq("css.rendering-pipeline.e4", "intermediate", "Сколько раскладок даст цикл «прочитать `offsetWidth` — записать `style.width`» для 500 элементов?", ["Одну", "500", "Две", "Ни одной"], 1, "Каждое чтение после записи форсирует раскладку: замер дал 500 против 1 у варианта с разделёнными фазами."),
    mcq("css.rendering-pipeline.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`ResizeObserver` позволяет узнать размеры без форсирования раскладки", "`translateZ(0)` создаёт слой композитора", "Класс, под который нет правил, всегда пересчитывает стили всех элементов", "Пользовательское свойство наследуется потомками"], [0, 1, 3], "Класс без зависимых правил в замере не вызвал пересчёта стилей вообще."),
    mcq("css.rendering-pipeline.e6", "advanced", "Почему первое включение `opacity` (из `1`) дороже последующих изменений?", ["Из-за размера DOM", "Из-за каскада", "Из-за загрузки изображений", "Потому что создаётся узел в деревьях свойств: нужны раскладка и отрисовка"], 3, "Замер: из `1` — layout 1 и paint > 0, при уже заданном значении — 0 и 0."),
    open("css.rendering-pipeline.e7", "intermediate", "Объясните, почему чередование чтения и записи геометрии медленнее, и как это исправить.", [
      ul(
        "Запись помечает раскладку «грязной»; чтение геометрии требует актуальных значений и принуждает к немедленному пересчёту.",
        "В цикле пересчёт повторяется на каждой итерации (500 раскладок вместо одной в замере).",
        "Исправление: собрать все чтения, затем выполнить записи; для размеров использовать наблюдатели.",
      ),
    ], ["Названа форсированная раскладка", "Приведено число из замера или оценка", "Предложено разделение фаз"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.rendering-pipeline.m1", "intermediate", "Что показал замер охвата инвалидации для пользовательского свойства на `<html>`?", ["Пересчитан 1 элемент", "Пересчёт не нужен", "Пересчитаны все потомки (4002 элемента), а не только читающие", "Пересчитаны только элементы, читающие свойство"], 2, "Свойство наследуется: пересчитаны все потомки (2000 `.item`, 2000 `.label` и два контейнера), а не только читающие."),
    mcq("css.rendering-pipeline.m2", "advanced", "Почему число слоёв при `will-change` на 100 карточках зависело от размера окна?", ["Из-за случайности", "Слои создаются для содержимого вблизи области просмотра: 69 в окне 800 px и 100 в окне 8000 px", "Из-за разрешения экрана", "Потому что `will-change` не работает в узком окне"], 1, "Замер дерева слоёв дал 69 слоёв в окне 1000×800 и 100 в окне 1000×8000."),
    mcq("css.rendering-pipeline.m3", "advanced", "Что проверяет условие `layout === 0 && paint === 0` в тесте анимации?", ["Что изменение не покидает главный поток дальше стиля при уже существующем узле свойства", "Что анимация быстрая на любом устройстве", "Что браузер не рисует кадр", "Что нет пересчёта стилей"], 0, "Замер: для уже заданного `transform` и `will-change` `layout` и `paint` равны 0, а стили всё равно пересчитываются."),
    open("css.rendering-pipeline.m4", "advanced", "Спроектируйте набор автоматических проверок производительности для анимированного интерфейса.", [
      ul(
        "Трассировочный тест стадий для ключевых анимаций: `layout: 0`, `paint: 0` для `transform` и `opacity` с заранее заданным значением.",
        "Тест числа раскладок обработчиков (`LayoutCount`) для списков и форм.",
        "Бюджет слоёв: не больше N слоёв на экране; контроль `will-change`.",
        "Профили Performance в CI на типовых сценариях и сравнение с базовой линией.",
      ),
    ], ["Трассировка стадий", "Счётчик раскладок", "Бюджет слоёв и профили"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.rendering-pipeline.f1", front: "Стадии конвейера?", back: "Стили → раскладка → подготовка к отрисовке → отрисовка → слои/композиция." },
    { id: "css.rendering-pipeline.f2", front: "`width` или `transform`?", back: "`width`: стили + layout + paint. `transform` (уже задан): только стили." },
    { id: "css.rendering-pipeline.f3", front: "Принудительная раскладка?", back: "Чтение геометрии после записи форсирует layout: 500 против 1 в замере." },
    { id: "css.rendering-pipeline.f4", front: "Какие чтения безопасны?", back: "`textContent`, `matches()`, `classList.contains()`, `getComputedStyle().color` (стили, без layout)." },
    { id: "css.rendering-pipeline.f5", front: "Охват инвалидации?", back: "Свойство на `<html>`: 4002 элемента; на листе: 2; класс без правил: 0." },
    { id: "css.rendering-pipeline.f6", front: "Цена слоя?", back: "Память текстуры: ≈ ширина × высота × 4 байта; `will-change` и `translateZ(0)` создают слой." },
  ],

  sources: [
    { title: "RenderingNG architecture", url: "https://developer.chrome.com/docs/chromium/renderingng-architecture", publisher: "Other" },
    { title: "MDN: Critical rendering path", url: "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path", publisher: "MDN" },
    { title: "MDN: will-change", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/will-change", publisher: "MDN" },
    { title: "MDN: ResizeObserver", url: "https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver", publisher: "MDN" },
    { title: "CSS Containment Module Level 2", url: "https://www.w3.org/TR/css-contain-2/", publisher: "W3C" },
    { title: "Chrome DevTools Protocol: Tracing", url: "https://chromedevtools.github.io/devtools-protocol/tot/Tracing/", publisher: "Other" },
  ],
};
