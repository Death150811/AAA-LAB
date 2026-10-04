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
  open,
  p,
  section,
  steps,
  table,
  ul,
  wrongRight,
} from "../../dsl";

export const logicalProperties: Topic = {
  id: "css.logical-properties",
  slug: "logical-properties",
  domain: "css",
  module: "modern",
  title: "Логические свойства и режимы письма",
  titleEn: "CSS logical properties, writing modes, direction, inline and block axes",
  summary:
    "`margin-left` и `width` привязаны к физическим сторонам экрана, а язык может писаться справа налево или сверху вниз. Логические свойства (`margin-inline-start`, `inline-size`, `inset-block-start`) привязаны к **направлению письма**: «начало строки» — слева в русском, справа в арабском и сверху в вертикальной вёрстке. Тема объясняет оси inline и block, `direction` и `writing-mode`, сопоставление физических и логических свойств, `text-align: start`, `float: inline-start`, `:dir()`, как каскадируются логические и физические записи вместе, и как проверить зеркалирование интерфейса тестом.",
  minutes: 45,
  prerequisites: ["css.box-model", "css.display-flow"],
  tags: ["logical properties", "writing-mode", "direction", "RTL", "inline axis", "block axis", "margin-inline", "padding-block", "inline-size", "block-size", "inset", ":dir()", "i18n", "text-align: start", "float: inline-start"],
  keyConcepts: [
    { term: "Две оси потока", text: "**Inline** — направление строки текста, **block** — направление, в котором строки складываются. В русском: inline слева направо, block сверху вниз. В арабском inline идёт справа налево. В `writing-mode: vertical-rl` inline идёт сверху вниз, block — справа налево." },
    { term: "Начало и конец вместо сторон", text: "`inline-start`/`inline-end` и `block-start`/`block-end` заменяют left/right/top/bottom. `margin-inline-start: 20px` — это левый отступ в LTR, правый в RTL и верхний в вертикальной вёрстке." },
    { term: "`inline-size` и `block-size`", text: "Заменяют `width` и `height`: `inline-size` — размер вдоль строки. В вертикальном режиме `inline-size: 100px` даёт высоту 100px (замер: width 40px, height 100px)." },
    { term: "Физические и логические — один каскад", text: "`margin-left` и `margin-inline-start` — это разные записи одного свойства: побеждает объявленное **позже** (в LTR: 20px и 10px в зависимости от порядка). В RTL `margin-left` и `margin-inline-start` — разные стороны и не конфликтуют." },
    { term: "Не всё становится логическим", text: "Тени, `transform: translateX()`, `background-position`, направление градиента и медиазапрос `width` остаются физическими. Зеркалировать их нужно отдельно (например, через `:dir(rtl)`)." },
  ],
  sections: [
    section("definition", [
      def("Режим письма", "Свойство `writing-mode` задаёт направление, в котором строки текста идут по странице: `horizontal-tb` (горизонтально, строки сверху вниз), `vertical-rl` и `vertical-lr` (вертикально).", "writing mode"),
      def("Направление", "Свойство `direction` (и атрибут `dir`) задаёт направление текста в строке: `ltr` — слева направо, `rtl` — справа налево.", "direction"),
      def("Ось inline", "Ось вдоль строки текста. Её начало и конец определяются `direction` и `writing-mode`.", "inline axis"),
      def("Ось block", "Ось, вдоль которой друг за другом идут блоки (строки, абзацы). Перпендикулярна оси inline.", "block axis"),
      def("Логическое свойство", "Свойство, определённое через оси и направления потока (`margin-inline-start`, `inline-size`, `inset-block`), а не через физические стороны. Браузер сопоставляет его физическому на этапе вычисления.", "flow-relative / logical property"),
    ]),

    section("why", [
      h("Интерфейс для всех языков"),
      p("Арабский, иврит, фарси и урду пишутся справа налево; традиционная китайская, японская и корейская вёрстка допускает вертикальные строки. Интерфейс на `margin-left` и `padding-right` в таких языках ломается: иконки оказываются «не с той стороны», отступы — между не теми элементами."),
      p("Логические свойства позволяют написать правило один раз: «отступ перед текстом», «граница в начале строки», «значок в конце». Зеркалирование происходит само при смене `dir`."),
      h("Что даёт подход"),
      ul(
        "**Один CSS для LTR и RTL** — без `[dir=rtl] .x { margin-right: 10px; margin-left: 0 }` для каждого правила.",
        "**Меньше багов зеркалирования:** тест «отзеркаленного» интерфейса проходит автоматически.",
        "**Поддержка вертикальной вёрстки** без отдельной ветки стилей.",
        "**Лучшее имя намерения:** `margin-inline-start` читается как «отступ в начале строки», а не «слева».",
      ),
      insight("Для текстового интерфейса «слева» редко означает именно слева. Обычно имеется в виду «в начале строки» — это и есть `inline-start`."),
    ]),

    section("mental-model", [
      p("Представьте **стрелки на странице**. Первая стрелка показывает, куда идёт текст в строке (inline), вторая — куда идут строки (block). Если повернуть или отзеркалить страницу, стрелки поворачиваются вместе с ней, а «начало» и «конец» остаются на тех же концах стрелок. Физические `left/right/top/bottom` — это стороны стола, на котором лежит страница: они не двигаются."),
      diagram(
        `
        горизонтальный LTR           горизонтальный RTL             vertical-rl
        inline →                     ← inline                       inline ↓
        block  ↓                     block  ↓                       block  ←

        inline-start = левый край    inline-start = правый край     inline-start = верхний край
        block-start  = верхний       block-start  = верхний         block-start  = правый
        inline-size  = ширина        inline-size  = ширина          inline-size  = высота
        block-size   = высота        block-size   = высота          block-size   = ширина
        `,
        "Как оси потока соотносятся со сторонами экрана",
      ),
      table(
        ["Физическое", "Логическое (горизонтальный режим)", "Логическое свойство"],
        [
          ["`width`, `height`", "`inline-size`, `block-size`", "размеры вдоль осей"],
          ["`min-width`, `max-height`…", "`min-inline-size`, `max-block-size`…", "ограничения размеров"],
          ["`margin-left` / `-right`", "`margin-inline-start` / `-end`", "краткая запись `margin-inline: a b`"],
          ["`margin-top` / `-bottom`", "`margin-block-start` / `-end`", "краткая запись `margin-block: a b`"],
          ["`padding-*`", "`padding-inline-*`, `padding-block-*`", "аналогично"],
          ["`border-left`, `border-top`…", "`border-inline-start`, `border-block-start`…", "включая `-width`, `-style`, `-color`"],
          ["`top`, `right`, `bottom`, `left`", "`inset-block-start`, `inset-inline-end`, …", "`inset-inline`, `inset-block`, `inset`"],
          ["`text-align: left` / `right`", "`text-align: start` / `end`", "значения вместо свойств"],
          ["`float: left` / `right`", "`float: inline-start` / `inline-end`", "значения вместо свойств"],
          ["`border-top-left-radius`…", "`border-start-start-radius`…", "углы: блок-начало/инлайн-начало и т. д."],
        ],
        "Соответствие физических и логических свойств",
      ),
    ]),

    section("technical", [
      h("`direction` и `writing-mode`"),
      code(
        "css",
        `
        html { direction: ltr; }                 /* или атрибут dir="ltr" в разметке */
        [lang="ar"], [lang="he"] { direction: rtl; }

        .vertical { writing-mode: vertical-rl; }  /* строки вертикальны, идут справа налево */
        `,
        { filename: "direction.css" },
      ),
      ul(
        "Направление текста лучше задавать **атрибутом `dir`** в разметке (`<html dir=\"rtl\">`): оно нужно и без CSS, и скринридерам, и режимам без стилей.",
        "`dir=\"auto\"` определяет направление по первому сильному символу содержимого (удобно для пользовательских сообщений).",
        "`writing-mode` меняет оси: в вертикальном режиме inline идёт сверху вниз.",
      ),
      h("Размеры, отступы и положение"),
      code(
        "css",
        `
        .box {
          inline-size: 100px;               /* ширина в горизонтальном режиме */
          block-size: 40px;                 /* высота */
          margin-inline-start: 20px;        /* отступ в начале строки */
          margin-block-start: 10px;         /* отступ в начале блочной оси */
        }
        `,
        { filename: "logical-box.css" },
      ),
      p("Замер: контейнер 400×200 с рамкой 1px, элемент с этими четырьмя свойствами, в четырёх режимах:"),
      table(
        ["Режим", "Положение и размер элемента (left, top, width, height)", "Физические отступы"],
        [
          ["`horizontal-tb`, `ltr`", "21, 11, 100 × 40", "left 20, top 10"],
          ["`horizontal-tb`, `rtl`", "279, 11, 100 × 40", "right 20, top 10"],
          ["`vertical-rl`", "349, 21, 40 × 100", "top 20, right 10"],
          ["`vertical-lr`", "11, 21, 40 × 100", "top 20, left 10"],
        ],
        "Одно объявление — четыре результата",
      ),
      p("Видно, как `inline-size: 100px` в вертикальных режимах стал высотой, а `margin-inline-start` — верхним отступом; в `vertical-rl` начало блочной оси находится справа, в `vertical-lr` — слева."),
      h("Позиционирование: `inset`"),
      code(
        "css",
        `
        .badge { position: absolute; inset-inline-end: 0.5rem; inset-block-start: 0.5rem; }
        .overlay { position: fixed; inset: 0; }               /* все четыре стороны */
        `,
        { filename: "inset.css" },
      ),
      p("Замер для `position: absolute; inset-inline-start: 10px; inset-block-start: 5px` в контейнере 400×200: в LTR левая граница 11, в RTL правая граница отступает на 10px (левая 359), а в `vertical-rl` элемент прижат сверху на 10px и справа на 5px."),
      h("Текст, обтекание и скругления"),
      code(
        "css",
        `
        p { text-align: start; }                               /* а не left */
        .figure { float: inline-start; margin-inline-end: 1rem; }
        .tab { border-start-start-radius: 0.5rem; border-start-end-radius: 0.5rem; }
        `,
        { filename: "text-float-radius.css" },
      ),
      ul(
        "Замер в RTL: `text-align: start` выровнял текст по правому краю (диапазон x = 353…399), а `text-align: left` — по левому (x = 99…120).",
        "`float: inline-start` в RTL прижал элемент вправо (left = 359 при контейнере 400px), а `cssFloat` остался `inline-start`.",
        "`border-start-start-radius: 20px` в RTL дал скругление `border-top-right-radius: 20px` (начало блока и начало строки — верхний правый угол).",
      ),
      h("Flexbox и Grid уже логические"),
      p("`flex-direction: row` идёт вдоль оси inline: замер в RTL — первый элемент справа (left = 349), второй левее (299); в LTR — 1 и 51. Колонки Grid тоже нумеруются от начала inline-оси. Поэтому раскладки на Flex и Grid зеркалируются сами, а ручные `margin-left` в них ломают зеркалирование."),
      h("Каскад: физические и логические вместе"),
      p("Логическое и физическое свойство описывают одну и ту же величину. Если они обращаются к одной стороне, побеждает объявленное **позже**:"),
      table(
        ["Правила (LTR)", "`margin-left` в итоге"],
        [
          ["`margin-left: 10px; margin-inline-start: 20px;`", "20px — позднее логическое"],
          ["`margin-inline-start: 20px; margin-left: 10px;`", "10px — позднее физическое"],
        ],
        "Замер в Chromium",
      ),
      p("В RTL `margin-inline-start` — это `margin-right`, и конфликта нет: оба правила работают (`margin-left: 10px`, `margin-right: 20px`). Поэтому код, где смешаны физические и логические отступы, ведёт себя по-разному в LTR и RTL — не смешивайте их для одной стороны."),
      h("`:dir()` и то, что остаётся физическим"),
      code(
        "css",
        `
        .arrow { transform: none; }
        .arrow:dir(rtl) { transform: scaleX(-1); }             /* зеркалим только стрелки/иконки направления */

        .card { box-shadow: 4px 4px 0 #0003; }                 /* тень физическая: не зеркалится сама */
        :dir(rtl) .card { box-shadow: -4px 4px 0 #0003; }
        `,
        { filename: "dir-pseudo.css" },
      ),
      p("Замер: `.s:dir(rtl)` внутри элемента с `dir=\"rtl\"` сработал, а в обычном контексте — нет. `:dir()` определяет направление по DOM (атрибуту `dir` и наследованию), поэтому надёжнее селектора `[dir=rtl]`, который не учитывает `dir=\"auto\"` и унаследованное направление."),
      ul(
        "**Остаются физическими:** `box-shadow` и `text-shadow` (смещения x и y), `transform: translateX()`, `background-position`, направления градиентов (`to right`), медиазапросы по `width`.",
        "**Иконки направления** (стрелка «вперёд», «назад», шеврон) зеркалят через `:dir(rtl)`; значки без направления (лупа, часы) зеркалить не нужно.",
        "**Числа и латинский текст** в RTL остаются слева направо внутри строки: `unicode-bidi` и `<bdi>` отвечают за смешанные направления.",
      ),
      h("Запасной вариант и поддержка"),
      p("Логические свойства поддерживаются современными браузерами уже несколько лет (проверьте таблицы совместимости для нужных версий). Если нужна совместимость с очень старыми браузерами, физическое объявление ставят **перед** логическим: логическое перебьёт его там, где поддерживается."),
      code(
        "css",
        `
        .media {
          margin-left: 1rem;                 /* запасной вариант */
          margin-inline-start: 1rem;         /* перебивает там, где поддерживается */
        }
        `,
        { filename: "fallback.css" },
      ),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        .card {
          padding-inline: 1rem;
          padding-block: 0.75rem;
          border-inline-start: 4px solid #2f3d9a;
          text-align: start;
        }

        .card .badge {
          position: absolute;
          inset-block-start: 0.5rem;
          inset-inline-end: 0.5rem;
        }

        .card .icon { margin-inline-end: 0.5rem; }
        .card .arrow:dir(rtl) { transform: scaleX(-1); }
        `,
        [
          { line: 2, text: "Краткая запись для отступов вдоль строки: слева и справа в LTR, справа и слева в RTL, сверху и снизу в вертикальной вёрстке." },
          { line: 4, text: "Акцентная полоса в начале строки: слева в LTR, справа в RTL." },
          { line: 5, text: "Выравнивание текста по началу строки, а не «по левому краю»." },
          { line: [9, 10], text: "Значок в «углу начала блока и конца строки»: правый верхний угол в LTR, левый верхний в RTL." },
          { line: 13, text: "Отступ после значка (между значком и текстом) — по направлению письма." },
          { line: 14, text: "Стрелка направления отражается только в RTL: физический `transform` нужно зеркалить вручную." },
        ],
        "syntax.css",
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru" dir="ltr">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Логические свойства</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          .note { padding-inline: 1rem; padding-block: 0.5rem; border-inline-start: 6px solid #2f3d9a; background: #eef0fb; text-align: start; max-inline-size: 28rem; }
          .note::before { content: "→ "; display: inline-block; }
          .note:dir(rtl)::before { transform: scaleX(-1); }
          button { margin-block-start: 1rem; font: inherit; padding: 0.375rem 0.75rem; }
        </style>
        <p class="note">Полоса, поля и выравнивание привязаны к началу строки. Переключите направление, и интерфейс зеркалится без единого изменения CSS.</p>
        <button id="b" type="button">Переключить direction (LTR / RTL)</button>
        <script>
          document.getElementById("b").addEventListener("click", () => {
            const root = document.documentElement;
            root.dir = root.dir === "rtl" ? "ltr" : "rtl";
          });
        </script>
        </html>
        `,
        { filename: "logical-basics.html", runnable: true },
      ),
      p("Полоса слева переезжает вправо, поля остаются «перед текстом», а стрелка отражается через `:dir(rtl)`. Попробуйте заменить `border-inline-start` на `border-left` и посмотреть, что сломается при RTL."),
    ]),

    section("detailed-example", [
      p("Карточка комментария с аватаром, меткой автора, значком «закреплено» и кнопками. Все направленные свойства — логические; переключатель меняет `dir` на корневом элементе. Физическим оставлена лишь тень — её зеркалит `:dir(rtl)`."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru" dir="ltr">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Карточка в LTR и RTL</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; color: #1b1b1f; background: #f4f5fb; }

          .toolbar { display: flex; gap: 0.5rem; margin-block-end: 1rem; }
          button { font: inherit; padding: 0.375rem 0.75rem; }

          .comment { position: relative; display: flex; gap: 0.75rem; max-inline-size: 36rem; padding-block: 0.75rem; padding-inline: 1rem; background: #fff; border-radius: 0.5rem; border-inline-start: 6px solid #2f3d9a; box-shadow: 4px 4px 0 #0002; }
          .comment:dir(rtl) { box-shadow: -4px 4px 0 #0002; }
          .avatar { flex: none; inline-size: 2.5rem; block-size: 2.5rem; border-radius: 50%; background: #7986cb; }
          .body { min-inline-size: 0; }
          .author { margin: 0; font-weight: 700; }
          .text { margin: 0.25rem 0 0.5rem; text-align: start; }
          .actions { display: flex; gap: 1rem; }
          .actions a { color: #2f3d9a; }
          .pin { position: absolute; inset-block-start: 0.5rem; inset-inline-end: 0.75rem; font-size: 0.875rem; }
          .reply::after { content: " →"; display: inline-block; }
          .reply:dir(rtl)::after { transform: scaleX(-1); }
        </style>
        <div class="toolbar">
          <button id="ltr" type="button" aria-pressed="true">LTR</button>
          <button id="rtl" type="button" aria-pressed="false">RTL</button>
        </div>
        <article class="comment">
          <div class="avatar" aria-hidden="true"></div>
          <div class="body">
            <p class="author">Анна Петрова</p>
            <p class="text">Все направленные свойства карточки логические: полоса, поля, значок «закреплено», отступы и выравнивание следуют направлению письма.</p>
            <div class="actions"><a class="reply" href="#reply">Ответить</a><a href="#share">Поделиться</a></div>
          </div>
          <span class="pin">📌 Закреплено</span>
        </article>
        <script>
          const root = document.documentElement;
          for (const dir of ["ltr", "rtl"]) {
            document.getElementById(dir).addEventListener("click", () => {
              root.dir = dir;
              document.getElementById("ltr").setAttribute("aria-pressed", String(dir === "ltr"));
              document.getElementById("rtl").setAttribute("aria-pressed", String(dir === "rtl"));
            });
          }
        </script>
        </html>
        `,
        { filename: "comment-rtl.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
    ]),

    section("analysis", [
      table(
        ["Фрагмент", "Что делает"],
        [
          ["`border-inline-start: 6px solid …`", "Акцентная полоса в начале строки: слева в LTR, справа в RTL"],
          ["`padding-block` / `padding-inline`", "Отступы по осям потока, а не по сторонам"],
          ["`inline-size` / `block-size` у аватара", "Размеры не зависят от режима письма (в вертикальном аватар остался бы квадратным)"],
          ["`inset-block-start` + `inset-inline-end` у значка", "Значок в углу «начало блока, конец строки»: правый верхний в LTR, левый верхний в RTL"],
          ["`display: flex; gap`", "Порядок элементов следует направлению строки: аватар в начале, а не слева"],
          ["`.comment:dir(rtl) { box-shadow: -4px 4px … }`", "Физическая тень отзеркалена вручную: смещение по x меняет знак"],
          ["`.reply::after` + `:dir(rtl)`", "Стрелка «вперёд» отражается в RTL; иконки без направления не зеркалят"],
        ],
        "Как устроена карточка",
      ),
      ul(
        "Единственные физические значения в CSS — тень и `transform` стрелки; обе помечены `:dir(rtl)`.",
        "Переключатель направления не знает о стилях: он лишь меняет атрибут `dir` на `html`.",
        "Правило проверки: зеркалирование должно быть идеальным — каждый элемент в RTL оказывается на «зеркальном» месте.",
      ),
    ]),

    section("internals", [
      h("Как браузер сопоставляет логические и физические свойства"),
      steps(
        [
          ["Определение режима письма", "Для каждого элемента вычисляются `writing-mode` и `direction` (наследуются по дереву). Они определяют физические направления осей inline и block."],
          ["Группы свойств", "Логические и физические свойства объединены в «логические группы» (например, `margin-*`). В группе все записи сводятся к четырём физическим сторонам."],
          ["Каскад", "Победитель для каждого физического свойства определяется обычным каскадом: источник, важность, слой, специфичность, **порядок**. Логическое и физическое объявления конкурируют между собой по общим правилам, поэтому поздняя запись побеждает."],
          ["Преобразование", "Выигравшее логическое значение подставляется в соответствующее физическое по режиму письма элемента. Например, `margin-inline-start` в RTL становится `margin-right`."],
          ["Раскладка", "Дальше работает обычная раскладка на физических значениях."],
        ],
        "Путь логического свойства",
      ),
      h("Чьё направление считается"),
      p("Для логических свойств используется режим письма **самого элемента** (свойства `direction` и `writing-mode` наследуются, но могут быть переопределены на элементе). Для раскладки Flex и Grid используется режим контейнера. Элемент, изменивший `direction` внутри родителя с другим направлением, сопоставляет свои логические свойства со своим режимом."),
      h("Проверка в DevTools и в коде"),
      code(
        "js",
        `
        const cs = getComputedStyle(document.querySelector(".box"));
        console.log(cs.direction, cs.writingMode);                        // режим элемента
        console.log(cs.marginLeft, cs.marginRight, cs.marginTop);         // физический результат
        console.log(cs.width, cs.height);                                 // inline-size/block-size → width/height
        `,
        { filename: "check-logical.js" },
      ),
      note("В `getComputedStyle` логические свойства возвращают вычисленные значения тоже, но для сравнения удобнее читать физические: они показывают, куда реально ушло значение."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Физические отступы в интерфейсе с RTL"),
      wrongRight(
        "css",
        {
          code: `
            .icon { margin-right: 0.5rem; }
            .card { border-left: 4px solid #2f3d9a; text-align: left; }
          `,
          note: "В RTL значок прижат к тексту «с неправильной» стороны, а полоса и выравнивание остаются слева, хотя текст идёт справа.",
        },
        {
          code: `
            .icon { margin-inline-end: 0.5rem; }
            .card { border-inline-start: 4px solid #2f3d9a; text-align: start; }
          `,
          note: "Отступ, полоса и выравнивание следуют направлению письма и зеркалятся при смене `dir`.",
        },
      ),
      h("Ошибка 2. Смешивание физических и логических для одной стороны"),
      p("`margin-left: 10px; margin-inline-start: 20px` в LTR даёт 20px, а при обратном порядке — 10px (замер). В RTL конфликта нет, и результат другой. Переведите весь компонент на один словарь."),
      h("Ошибка 3. Зеркалить всё подряд"),
      p("Стрелки «вперёд/назад» и шевроны зеркалят; логотипы, часы, лупу, изображения с текстом, номера телефонов и видеоплеер (в большинстве интерфейсов) — нет. Зеркалить нужно только то, что несёт направленный смысл."),
      h("Ошибка 4. Направление только через CSS"),
      p("`direction: rtl` в CSS без атрибута `dir` не сообщает направление скринридерам, программам обработки текста и режимам без стилей. Задавайте `dir` в разметке, а CSS используйте для оформления."),
      h("Ошибка 5. `[dir=rtl]` вместо `:dir()`"),
      p("Селектор `[dir=rtl]` не видит унаследованное направление и `dir=\"auto\"`. Псевдокласс `:dir(rtl)` определяет фактическое направление элемента."),
      h("Ошибка 6. Тени и трансформации «забыты»"),
      p("`box-shadow: 4px 4px …` остаётся справа-снизу и в RTL, где визуально ожидается зеркальная тень; `transform: translateX(10px)` сдвигает вправо всегда. Для направленных эффектов используйте `:dir(rtl)` или логические альтернативы там, где они есть."),
      h("Ошибка 7. `inline-size` как «ширина» в вертикальных режимах"),
      p("Если нужна именно ширина (физическая) независимо от режима, используйте `width`. Замер: `inline-size: 100px; block-size: 40px` в `vertical-rl` дали `width: 40px; height: 100px`."),
      h("Ошибка 8. Только ручное тестирование"),
      p("Зеркальный вид не проверишь «на глаз» для всех экранов. Автоматическая проверка (положение каждого элемента в RTL = зеркальное положение в LTR) ловит забытые `margin-left` за секунды."),
    ]),

    section("antipatterns", [
      ul(
        "**Отдельный файл `rtl.css`** с переопределением `margin-right`/`margin-left` для каждого правила.",
        "**`[dir=rtl] .x { … }` для каждого компонента** вместо логических свойств.",
        "**Физические свойства в Flex- и Grid-раскладках**, которые уже зеркалятся сами.",
        "**`text-align: left`** для основного текста (если нужно «к началу», используйте `start`).",
        "**Зеркалирование всех иконок**, включая те, у которых нет направления.",
        "**`float: left`** для врезок: используйте `float: inline-start`.",
        "**Смешанные физические и логические объявления** для одной стороны одного элемента.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Логические по умолчанию:** `margin-inline`, `padding-block`, `inset-inline-start`, `inline-size`, `border-inline-start`.",
        "**Значения `start`/`end`:** `text-align: start`, `float: inline-start`.",
        "**Направление — в разметке:** `<html lang dir>`; `dir=\"auto\"` для пользовательского текста.",
        "**Flex и Grid** без ручных левых и правых отступов: `gap`, `margin-inline-*`.",
        "**Физические значения — осознанно:** тени, трансформации, градиенты; зеркальте через `:dir(rtl)`.",
        "**Иконки направления** отражаются, остальные нет; ресурсы с текстом локализуются, а не зеркалятся.",
        "**Тесты зеркалирования:** положение элементов в RTL равно зеркальному положению в LTR.",
        "**Шкала проверки:** прогон интерфейса с `dir=\"rtl\"` в обзоре компонентов.",
      ),
    ]),

    section("edge-cases", [
      h("Смешанные направления в тексте"),
      p("Латинский текст, числа и названия брендов внутри арабского абзаца идут слева направо. За порядок отвечает алгоритм двунаправленного текста; элемент `<bdi>` и атрибут `dir=\"auto\"` защищают пользовательские вставки от «перепрыгивания» знаков препинания."),
      h("`margin: auto` по блочной оси"),
      p("`margin-inline: auto` центрирует блок по оси inline (замер: в блоке 400px элемент шириной 100px встал в x = 150 при рамке 1px). Автоматические поля по блочной оси в обычном потоке не центрируют (как `margin-top: auto`): для вертикального центрирования используйте Flex или Grid."),
      h("Логические значения `resize`, `overflow`, `scroll-*`"),
      p("Для прокрутки и привязки тоже есть логические варианты (`scroll-padding-inline`, `overscroll-behavior-inline`, `scroll-margin-block`). Поддержку отдельных новых свойств и значений проверяйте по таблицам совместимости."),
      h("`background-position` и изображения"),
      p("`background-position: left` — физическое значение: в RTL фон останется слева. Для направленных фонов задайте правило в `:dir(rtl)` или меняйте `background-position-x` вместе с остальными правилами темы."),
      h("Вертикальная вёрстка и таблицы"),
      p("В вертикальных режимах таблицы и колонки тоже следуют осям потока. Если вёрстка поддерживает такие языки, проверяйте её в `writing-mode: vertical-rl` — это быстрый способ найти физические допущения."),
      h("Печать и PDF"),
      p("При печати RTL-страниц проверяйте предпросмотр: направление чтения, положение номеров страниц и полей. Физические значения `@page` и колонтитулов не зеркалятся сами."),
    ]),

    section("related", [
      ul(
        "[Блочная модель](/learn/css/box-model) — `margin`, `padding`, `border`, `inline-size`.",
        "[Display и поток](/learn/css/display-flow) — inline и block уровни.",
        "[Позиционирование](/learn/css/positioning) — `inset` и физические стороны.",
        "[Flexbox: основы](/learn/css/flexbox-basics) — главная ось следует направлению письма.",
        "[Grid: треки, линии и размещение](/learn/css/grid-basics) — нумерация колонок по inline-оси.",
        "[Глобальные атрибуты](/learn/html/global-attributes) — `lang`, `dir`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "Физические стороны и отдельный RTL-файл",
          code: `
            .note { padding: 0.5rem 1rem 0.5rem 1.5rem; border-left: 4px solid #2f3d9a; text-align: left; }
            .note .icon { margin-right: 0.5rem; float: left; }

            [dir="rtl"] .note { padding: 0.5rem 1.5rem 0.5rem 1rem; border-left: 0; border-right: 4px solid #2f3d9a; text-align: right; }
            [dir="rtl"] .note .icon { margin-right: 0; margin-left: 0.5rem; float: right; }
          `,
          note: "Каждое направленное свойство приходится переопределять; при добавлении нового правила легко забыть RTL-версию.",
        },
        {
          title: "Логические свойства",
          code: `
            .note { padding-block: 0.5rem; padding-inline: 1.5rem 1rem; border-inline-start: 4px solid #2f3d9a; text-align: start; }
            .note .icon { margin-inline-end: 0.5rem; float: inline-start; }
          `,
          note: "Одни и те же правила работают в LTR, RTL и вертикальной вёрстке; отдельного RTL-кода нет.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.logical-properties.ex1",
      title: "Переведите на логические свойства",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Перепишите правило с логическими свойствами так, чтобы поведение в LTR не изменилось, а в RTL интерфейс зеркалился."),
      ],
      starter: {
        lang: "css",
        code: `
          .alert {
            width: 28rem;
            padding-left: 1rem;
            padding-right: 1rem;
            margin-top: 1rem;
            border-left: 4px solid #b3261e;
            text-align: left;
            float: left;
          }
        `,
      },
      hints: ["Какое логическое свойство заменяет `width`?", "Как записать левый и правый отступы одним свойством?", "Какие значения заменяют `left` у `text-align` и `float`?"],
      checks: ["`inline-size`", "`padding-inline`", "`margin-block-start`", "`border-inline-start`", "`text-align: start`, `float: inline-start`"],
      solution: [
        code(
          "css",
          `
          .alert {
            inline-size: 28rem;
            padding-inline: 1rem;
            margin-block-start: 1rem;
            border-inline-start: 4px solid #b3261e;
            text-align: start;
            float: inline-start;
          }
          `,
        ),
        p("В LTR результат прежний. В RTL полоса и выравнивание уходят вправо, обтекание — тоже вправо (замер: `float: inline-start` в RTL — left = 359 в контейнере 400px)."),
      ],
    }),
    exercise({
      id: "css.logical-properties.ex2",
      title: "Куда попадёт блок",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Блок `inline-size: 100px; block-size: 40px; margin-inline-start: 20px; margin-block-start: 10px` лежит в контейнере 400×200 с рамкой 1px. Определите физические отступы и размеры блока в четырёх режимах: `ltr`, `rtl`, `vertical-rl`, `vertical-lr`."),
      ],
      hints: ["Куда направлена ось inline в каждом режиме?", "Где находится начало блочной оси в `vertical-rl` и `vertical-lr`?"],
      checks: ["LTR: left 20, top 10, 100×40", "RTL: right 20, top 10, 100×40", "vertical-rl: top 20, right 10, 40×100", "vertical-lr: top 20, left 10, 40×100"],
      solution: [
        table(
          ["Режим", "Физические отступы", "Размер (ширина × высота)"],
          [
            ["`ltr`", "margin-left 20, margin-top 10", "100 × 40"],
            ["`rtl`", "margin-right 20, margin-top 10", "100 × 40"],
            ["`vertical-rl`", "margin-top 20, margin-right 10", "40 × 100"],
            ["`vertical-lr`", "margin-top 20, margin-left 10", "40 × 100"],
          ],
        ),
        p("Замер подтвердил положения: (21, 11), (279, 11), (349, 21) и (11, 21) — с учётом рамки контейнера 1px. В вертикальных режимах начало блочной оси находится справа (`vertical-rl`) или слева (`vertical-lr`)."),
      ],
    }),
    exercise({
      id: "css.logical-properties.ex3",
      title: "Конфликт логического и физического",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("В компоненте два правила для одной стороны: `margin-left: 10px; margin-inline-start: 20px;`. В LTR отступ 20px, а после рефакторинга порядок поменялся: `margin-inline-start: 20px; margin-left: 10px;` — и стал 10px. В RTL на обоих вариантах получается одно и то же. Объясните и исправьте так, чтобы поведение не зависело от порядка и направления."),
      ],
      starter: {
        lang: "css",
        code: `
          .box { margin-inline-start: 20px; margin-left: 10px; }
        `,
      },
      hints: ["Какая сторона соответствует `margin-inline-start` в LTR и в RTL?", "Что решает конфликт двух объявлений одной стороны?"],
      checks: ["Причина: конфликт по порядку для одной стороны в LTR", "В RTL стороны разные — конфликта нет", "Исправление: только логические свойства"],
      solution: [
        p("**Причина.** В LTR `margin-inline-start` и `margin-left` — одна сторона: побеждает объявление, написанное позже (замер: 20px и 10px в зависимости от порядка). В RTL `margin-inline-start` — это `margin-right`, поэтому обе записи применяются (`margin-left: 10px`, `margin-right: 20px`)."),
        code(
          "css",
          `
          .box { margin-inline-start: 20px; margin-inline-end: 10px; }
          `,
        ),
        p("Весь компонент переведён на логические свойства: результат одинаков при любом порядке и зеркалируется при смене направления."),
      ],
    }),
  ],

  challenge: {
    id: "css.logical-properties.challenge",
    title: "Тест зеркалирования компонента для LTR и RTL",
    scenario: [
      p("Команда готовит интерфейс к выходу на арабский и иврит. В макете часть компонентов написана на `margin-left` и `padding-right`, и в RTL они выглядят сломанными. Нужно перевести карточку на логические свойства и написать **автоматический тест зеркалирования**: положение каждого элемента в RTL должно быть зеркальным положению в LTR."),
    ],
    requirements: [
      "Карточка: аватар, заголовок, текст, значок «закреплено» в углу, кнопка действия",
      "Все направленные свойства — логические; тени и трансформации зеркалятся через `:dir(rtl)`",
      "Тест: для каждого элемента сравнить положение в LTR и RTL; ожидаемое: `x_rtl = W − x_ltr − width`",
      "Тест выводит расхождения больше 1px и итог",
    ],
    constraints: [
      "Нельзя использовать `margin-left`, `margin-right`, `padding-left`, `padding-right`, `left`, `right`, `float: left/right`, `text-align: left/right`",
      "Нельзя дублировать правила для RTL, кроме теней и стрелок",
    ],
    acceptance: [
      "Для всех проверяемых элементов расхождение не более 1px",
      "Значок «закреплено» — в верхнем правом углу в LTR и в верхнем левом в RTL",
      "Текст выровнен по началу строки в обоих режимах",
      "Тест находит ошибку, если вернуть `margin-left` вместо `margin-inline-start`",
    ],
    hints: [
      "Как переключить направление в тесте?",
      "Как вычислить зеркальное положение по ширине контейнера?",
      "Какие элементы нужно проверить?",
    ],
    solution: [
      code(
        "css",
        `
        .comment { position: relative; display: flex; gap: 0.75rem; padding-block: 0.75rem; padding-inline: 1rem; border-inline-start: 6px solid #2f3d9a; }
        .avatar  { flex: none; inline-size: 2.5rem; block-size: 2.5rem; }
        .text    { text-align: start; margin-block: 0.25rem 0.5rem; }
        .pin     { position: absolute; inset-block-start: 0.5rem; inset-inline-end: 0.75rem; }
        .reply   { margin-inline-start: auto; }
        .comment:dir(rtl) { box-shadow: -4px 4px 0 #0002; }
        `,
        { filename: "comment.css", lineNumbers: true },
      ),
      code(
        "js",
        `
        const rects = () => page.evaluate(() => {
          const root = document.querySelector(".comment").getBoundingClientRect();
          return {
            width: root.width,
            items: [".avatar", ".text", ".pin", ".reply"].map((s) => {
              const r = document.querySelector(s).getBoundingClientRect();
              return { s, x: r.left - root.left, w: r.width };
            }),
          };
        });

        await page.evaluate(() => { document.documentElement.dir = "ltr"; });
        const ltr = await rects();
        await page.evaluate(() => { document.documentElement.dir = "rtl"; });
        const rtl = await rects();

        let failures = 0;
        ltr.items.forEach((a, i) => {
          const b = rtl.items[i];
          const expected = ltr.width - a.x - a.w;                    // зеркальное положение
          const diff = Math.abs(b.x - expected);
          if (diff > 1) { failures++; console.log("FAIL", a.s, "ожидалось", expected.toFixed(1), "получено", b.x.toFixed(1)); }
        });
        console.log(failures === 0 ? "зеркалирование ok" : failures + " ошибок");
        `,
        { filename: "mirror.test.js" },
      ),
      ul(
        "**Идея теста:** при отражении интерфейса `x_rtl = W − x_ltr − width`. Любой элемент с физическим `margin-left` нарушит равенство.",
        "**Проверяемые элементы:** аватар (начало строки), текст (flex-элемент), значок (`inset-inline-end`), кнопка (`margin-inline-start: auto`).",
        "**Тени и стрелки:** зеркалятся через `:dir(rtl)`; в тест положения они не входят.",
      ),
    ],
  },

  interview: [
    iq("css.logical-properties.i1", "basic", "Что такое логические свойства CSS и зачем они нужны?", [
      p("Это свойства, привязанные к осям потока (inline и block), а не к физическим сторонам: `margin-inline-start`, `inline-size`, `inset-block`. Они зеркалятся при смене `direction` и работают в вертикальных режимах письма, поэтому один CSS обслуживает LTR, RTL и вертикальную вёрстку."),
    ]),
    iq("css.logical-properties.i2", "basic", "Чем `inline-size` отличается от `width`?", [
      p("`width` — физическая ширина, `inline-size` — размер вдоль строки. В горизонтальном режиме они совпадают, в вертикальном `inline-size` становится высотой (замер: `inline-size: 100px; block-size: 40px` в `vertical-rl` дали `width: 40px; height: 100px`)."),
    ]),
    iq("css.logical-properties.i3", "intermediate", "Что означает `margin-inline-start` в LTR, RTL и `vertical-rl`?", [
      p("Это отступ в начале строки: левый в LTR, правый в RTL, верхний в `vertical-rl`. А `margin-block-start` — отступ в начале блочной оси: верхний в горизонтальных режимах, правый в `vertical-rl` и левый в `vertical-lr`."),
    ]),
    iq("css.logical-properties.i4", "intermediate", "Почему `text-align: start` лучше `left`?", [
      p("`start` выравнивает по началу строки: левый край в LTR и правый в RTL. `left` всегда физически слева — в RTL основной текст окажется «не с той стороны» (замер: `start` дал диапазон x = 353…399 в контейнере 400px, `left` — 99…120)."),
    ]),
    iq("css.logical-properties.i5", "intermediate", "Как каскадируются физические и логические объявления?", [
      p("Они конкурируют как записи одного свойства: побеждает объявленное позже, при прочих равных. `margin-left: 10px; margin-inline-start: 20px` в LTR даёт 20px, при обратном порядке — 10px. В RTL `margin-inline-start` — это `margin-right`, поэтому конфликта нет."),
    ]),
    iq("css.logical-properties.i6", "advanced", "Что остаётся физическим и как это зеркалить?", [
      ul(
        "`box-shadow` и `text-shadow` (смещения), `transform: translateX()`, `background-position`, `to right` в градиентах, медиазапросы по `width`.",
        "Зеркалят через `:dir(rtl)`: меняют знак смещения, отражают `scaleX(-1)` для иконок направления.",
        "Не зеркалят иконки без направления, логотипы, изображения с текстом.",
      ),
    ]),
    iq("css.logical-properties.i7", "engineering", "Как организовать поддержку RTL в большой кодовой базе?", [
      ul(
        "Правило: логические свойства по умолчанию, линтер запрещает `margin-left`/`right`, `padding-left`/`right`, `float: left/right`, `text-align: left/right`.",
        "Направление — в разметке (`dir`), `:dir()` в CSS.",
        "Автоматический тест зеркалирования и скриншотные тесты в RTL.",
        "Каталог иконок: какие зеркалятся, какие нет; локализация изображений с текстом.",
      ),
    ]),
    iq("css.logical-properties.i8", "debugging", "В RTL значок оказался не с той стороны. Что проверите?", [
      ul(
        "Нет ли `margin-left`/`margin-right`, `left`/`right`, `float: left/right` в правилах компонента.",
        "Задано ли направление атрибутом `dir` на нужном предке, и не переопределяет ли его локальное правило.",
        "Не используется ли `[dir=rtl]` вместо `:dir()` для случаев `dir=\"auto\"`.",
        "Тень, `transform` и фон — физические: нужен `:dir(rtl)` или отдельное правило.",
      ),
    ]),
  ],

  exam: [
    mcq("css.logical-properties.e1", "foundation", "Какое логическое свойство заменяет `margin-left` в LTR?", ["`margin-inline-end`", "`margin-block-start`", "`margin-inline-start`", "`margin-start`"], 2, "Левый отступ в LTR — это отступ в начале строки: `margin-inline-start`."),
    mcq("css.logical-properties.e2", "foundation", "Что делает `text-align: start` в RTL?", ["Выравнивает по правому краю", "Выравнивает по левому краю", "Центрирует", "Растягивает"], 0, "В RTL начало строки — правый край, поэтому `start` выравнивает вправо."),
    mcq("css.logical-properties.e3", "intermediate", "В `writing-mode: vertical-rl` задано `inline-size: 100px; block-size: 40px`. Что получится?", ["width 100px, height 40px", "Ошибка", "width 100px, height 100px", "width 40px, height 100px"], 3, "В вертикальном режиме inline идёт сверху вниз: `inline-size` становится высотой, `block-size` — шириной."),
    mcq("css.logical-properties.e4", "intermediate", "`margin-left: 10px; margin-inline-start: 20px;` в LTR. Какой левый отступ?", ["10px", "20px", "0", "30px"], 1, "Это одна сторона: побеждает объявление, написанное позже."),
    mcq("css.logical-properties.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`box-shadow` автоматически зеркалится в RTL", "Flex-строка (`flex-direction: row`) в RTL идёт справа налево", "`:dir(rtl)` учитывает унаследованное направление", "`float: inline-start` существует"], [1, 2, 3], "Смещения теней физические: их нужно зеркалить вручную."),
    mcq("css.logical-properties.e6", "advanced", "Где окажется `position: absolute; inset-inline-end: 10px` в RTL?", ["Справа на 10px от края", "По центру", "Сверху на 10px от края", "Слева на 10px от края"], 3, "Конец строки в RTL — левый край, поэтому отступ 10px отсчитывается от левой границы содержащего блока."),
    open("css.logical-properties.e7", "intermediate", "Объясните, как подготовить интерфейс к RTL, и что остаётся физическим.", [
      ul(
        "Логические свойства вместо физических; `text-align: start`, `float: inline-start`; направление в атрибуте `dir`.",
        "Физическими остаются тени, трансформации, фоны и градиенты — их зеркалят через `:dir(rtl)`.",
        "Иконки направления отражают, остальные нет; автоматический тест зеркалирования.",
      ),
    ], ["Логические свойства и `dir`", "Что остаётся физическим", "Тест зеркалирования"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.logical-properties.m1", "intermediate", "Что означает `border-start-start-radius` в RTL?", ["Скругление верхнего левого угла", "Скругление нижнего правого угла", "Скругление верхнего правого угла", "Скругление всех углов"], 2, "Начало блока и начало строки в RTL — верхний правый угол (замер: `border-top-right-radius: 20px`)."),
    mcq("css.logical-properties.m2", "advanced", "`margin-left: 10px; margin-inline-start: 20px` в RTL. Каковы `margin-left` и `margin-right`?", ["20px и 0", "10px и 20px", "10px и 0", "0 и 30px"], 1, "В RTL `margin-inline-start` — это `margin-right`: стороны разные, оба правила работают."),
    mcq("css.logical-properties.m3", "advanced", "Почему `:dir(rtl)` надёжнее `[dir=rtl]`?", ["Учитывает унаследованное направление и `dir=\"auto\"`", "Быстрее работает", "Работает только в Chrome", "Заменяет `direction`"], 0, "`[dir=rtl]` видит только атрибут на самом элементе, а `:dir()` определяет фактическое направление."),
    open("css.logical-properties.m4", "advanced", "Спроектируйте процесс перехода большого проекта на логические свойства и проверку RTL.", [
      ul(
        "Инвентаризация физических свойств (линтер), правила замены и автоматический codemod там, где безопасно.",
        "Направление в разметке (`dir`), `:dir()` для тени и иконок; каталог иконок.",
        "Тест зеркалирования (позиции элементов), скриншотные тесты в RTL, проверка в `vertical-rl`.",
        "Правила команды: запрет физических свойств для направленных отступов, обзор компонентов в RTL.",
        "Поэтапность: компоненты по приоритетам; метрики числа оставшихся физических свойств.",
      ),
    ], ["Линтер и миграция", "Тесты зеркалирования", "Процесс и правила"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.logical-properties.f1", front: "Оси потока?", back: "inline — вдоль строки, block — в направлении складывания строк; зависят от `direction` и `writing-mode`." },
    { id: "css.logical-properties.f2", front: "`margin-inline-start`?", back: "Левый в LTR, правый в RTL, верхний в `vertical-rl`." },
    { id: "css.logical-properties.f3", front: "`inline-size`/`block-size`?", back: "Заменяют `width`/`height`; в вертикальных режимах меняются местами." },
    { id: "css.logical-properties.f4", front: "Конфликт физического и логического?", back: "Одна сторона → побеждает объявление, написанное позже." },
    { id: "css.logical-properties.f5", front: "Что остаётся физическим?", back: "Тени, `translateX`, `background-position`, градиенты, `@media (width)`." },
    { id: "css.logical-properties.f6", front: "`:dir(rtl)`?", back: "Псевдокласс фактического направления (учитывает наследование и `dir=auto`)." },
  ],

  sources: [
    { title: "CSS Logical Properties and Values Level 1", url: "https://www.w3.org/TR/css-logical-1/", publisher: "W3C" },
    { title: "CSS Writing Modes Level 4", url: "https://www.w3.org/TR/css-writing-modes-4/", publisher: "W3C" },
    { title: "MDN: CSS logical properties and values", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values", publisher: "MDN" },
    { title: "MDN: writing-mode", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/writing-mode", publisher: "MDN" },
    { title: "MDN: :dir()", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/:dir", publisher: "MDN" },
    { title: "MDN: direction", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/direction", publisher: "MDN" },
    { title: "HTML Standard: the dir attribute", url: "https://html.spec.whatwg.org/multipage/dom.html#the-dir-attribute", publisher: "WHATWG" },
  ],
};
