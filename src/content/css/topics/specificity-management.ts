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

export const specificityManagement: Topic = {
  id: "css.specificity-management",
  slug: "specificity-management",
  domain: "css",
  module: "architecture",
  title: "Управление специфичностью: как не проиграть «войну весов»",
  titleEn: "Managing specificity: layers, flat selectors, !important policy, budgets and cascade debugging",
  summary:
    "Специфичность — лишь пятая ступень каскада; когда её используют как главное оружие, стили превращаются в аукцион: каждое переопределение тяжелее предыдущего и заканчивается `!important`. Тема даёт порядок решения споров, четыре стратегии (низкий и ровный вес, слои, токены как канал переопределения, политика `!important`), приёмы работы с чужим CSS (включая инверсию `!important` в слоях), бюджет веса с проверкой линтером, собственный инструмент диагностики «почему не применилось» и безопасный рефакторинг со снимком вычисленных стилей. Все выводы подтверждены замерами в Chromium: на учебном листе из 10 правил — 5 селекторов с `#id`, 3 `!important`, максимальный вес (1,2,1); после рефакторинга — 0, 0 и (0,2,0) при нулевых расхождениях вычисленных стилей.",
  minutes: 55,
  prerequisites: ["css.specificity", "css.cascade-layers", "css.methodologies"],
  tags: ["specificity", "cascade", "@layer", "!important", ":where", "specificity budget", "stylelint", "refactoring", "debugging", "vendor CSS", "@bramus/specificity", "custom properties", "legacy CSS"],
  keyConcepts: [
    { term: "Вес решает последним", text: "Каскад сравнивает по очереди: важность → контекст → атрибут `style` → слой → специфичность → порядок записи. Селектор с тяжёлым весом проигрывает слою, `style=\"\"` и `!important`." },
    { term: "Меняйте правила аукциона", text: "Повышать ставки (`#app .panel .btn`, `.btn.btn.btn`, `!important`) можно бесконечно. Слои и порядок записи убирают вес из спора вообще: класс из позднего слоя побеждает `#id` из раннего." },
    { term: "Низкий и ровный вес", text: "Один класс на правило, `:where()` для базовых и библиотечных стилей, варианты через токены. Бюджет `0,2,0` проверяется линтером и отчётом по листу." },
    { term: "`!important` — политика", text: "В слоях порядок `!important` обратный: ранний слой сильнее позднего, а слой сильнее внеслойного. Это даёт способ перебить чужой `!important` — и ловушку для своих утилит." },
    { term: "Диагностика и доказательство", text: "Причину «не применилось» находят по ключу сортировки каскада, а рефакторинг доказывают снимком вычисленных стилей до и после." },
  ],
  sections: [
    section("definition", [
      def("Война специфичности", "Ситуация, в которой переопределение стиля достигается усложнением селектора или `!important`, а не изменением структуры правил: каждое следующее правило должно быть «тяжелее» предыдущего.", "specificity war"),
      def("Порядок сортировки каскада", "Последовательность критериев, по которым браузер выбирает победителя для каждого свойства: происхождение и важность, контекст, атрибут `style`, слой, специфичность, (близость области `@scope`), порядок записи.", "cascade sorting order"),
      def("Бюджет специфичности", "Договорённый потолок веса селектора (например, `0,2,0`) и нулевая терпимость к `#id` и `!important`; проверяется линтером и отчётом по листу стилей.", "specificity budget"),
      def("Канал переопределения", "Заранее предусмотренное место, где вариант или тема меняют компонент без конкуренции за свойство: чаще всего пользовательское свойство (`--btn-bg`) с запасным значением.", "override channel"),
      def("Снимок вычисленных стилей", "Список значений `getComputedStyle` для выбранных свойств у всех элементов страницы; сравнение снимков «до» и «после» доказывает, что рефакторинг не изменил вид.", "computed-style snapshot"),
    ]),

    section("why", [
      h("Как выглядит война весов"),
      p("Начинается невинно: кнопка `.btn` (0,1,0). Потом в одном из разделов её перекрасили селектором `#app .panel .btn` (1,2,0). Вариант «опасная кнопка» потребовал ещё одного правила, а состоянию «недоступно» (0,2,0) не хватило веса, и к нему дописали `!important`. Каждое следующее правило — ответ на предыдущее, и ни одно не объясняет, зачем оно нужно, кроме «иначе не работает»."),
      p("Учебный лист из 10 правил (см. раздел «До / после») измерен скриптом: **5 правил содержат `#id`, 3 объявления с `!important`, ни одного правила в слое, максимальный вес (1,2,1)** — `#app .panel h2.title`. Чтобы перекрасить такую кнопку в новом разделе, нужен селектор не легче (1,2,0)."),
      h("Что это стоит"),
      ul(
        "**Хрупкость:** перенос компонента в другое место ломает вид — вес привязан к вложенности в `#app`.",
        "**Рост спиралью:** чем тяжелее старый селектор, тем тяжелее новый; `!important` оказывается единственным выходом, а против `!important` помогает только `!important`.",
        "**Непредсказуемость:** результат определяется не тем, что написано в правиле, а тем, какое из десятков конкурирующих окажется тяжелее.",
        "**Стоимость сопровождения:** рефакторинг без измерений рискован, поэтому устаревший CSS не удаляют, а обкладывают новым.",
      ),
      insight("Специфичность — не механизм управления, а **тай-брейкер** между правилами, которые вы случайно записали одинаково «сильно». Управлять нужно тем, что сравнивается раньше (слои, `style`, важность) или после (порядок), а вес держать низким и ровным."),
    ]),

    section("mental-model", [
      p("Война весов — это **аукцион**: каждое правило делает ставку (вес), побеждает самая высокая, а перебить её можно только ставкой выше. Ставки растут до предела (`!important`), после чего участники начинают воевать уже за уровень предела. Здоровая архитектура — **очередь с приоритетными окнами**: у каждого типа правил своё окно (`reset`, `base`, `components`, `utilities`), внутри окна все равны (один класс), а кто впереди, решает порядок окон, а не размер ставки."),
      table(
        ["Инструмент (по порядку предпочтения)", "Что меняет", "Цена", "Когда применять"],
        [
          ["Порядок записи", "Последнее правило из равных побеждает", "Нужно следить за порядком файлов", "Равные по весу правила одного уровня"],
          ["Слои `@layer`", "Старшинство групп, не зависящее от веса", "Внеслойный код сильнее слоёв", "Любой проект: базовые, компоненты, утилиты, вендор"],
          ["Низкий вес, `:where()`", "Уменьшает ставку базовых и библиотечных стилей", "`:where()` слабее даже типового селектора", "Сброс, базовые стили, дефолты библиотек"],
          ["Токены-каналы", "Убирает конкуренцию за одно свойство", "Нужно придумать имена токенов", "Варианты, состояния, темы компонента"],
          ["Минимальное повышение веса", "Точечно поднимает ставку (`.a.a`)", "Хак с неясной причиной", "Крайний случай; временно, с комментарием"],
          ["`!important` в слое утилит", "Побеждает даже `style=\"\"`", "Инверсия порядка слоёв", "Выключатели (`hidden`), обход чужого кода"],
        ],
        "Чем решать споры правил",
      ),
    ]),

    section("technical", [
      h("Как каскад выбирает победителя"),
      p("Для каждого свойства элемента браузер собирает все объявления и сравнивает их по критериям строго в таком порядке; следующий критерий смотрят, только если предыдущие равны."),
      ol(
        "**Происхождение и важность.** Обычные объявления автора слабее анимаций, а `!important` автора — сильнее анимаций.",
        "**Контекст** (теневые деревья): для обычных объявлений побеждает внешний контекст, для `!important` — внутренний.",
        "**Атрибут `style`.** Обычный `style=\"…\"` сильнее любых селекторов и слоёв; `!important` в селекторе перебивает его.",
        "**Слой.** Позднее объявленный слой сильнее; внеслойные правила сильнее всех слоёв. Для `!important` порядок обратный.",
        "**Специфичность** — тройка (a, b, c), сравнивается по разрядам, а не как число.",
        "**Близость области** (`@scope`, CSS Cascading Level 6): побеждает область, ближе расположенная к элементу.",
        "**Порядок записи:** позже — сильнее.",
      ),
      p("Замеры в Chromium подтверждают порядок (в каждой строке два конкурирующих правила; проверялся итоговый цвет):"),
      table(
        ["Правила", "Победитель", "Что показывает"],
        [
          ["`:where(.btn)` против `button`", "`button`", "Вес `:where()` равен нулю — слабее даже типового селектора (0,0,1)"],
          ["`*` и `:where(.btn)` (записан позже)", "`:where(.btn)`", "Оба (0,0,0): решает порядок записи"],
          ["`#a` против `.x.x.x.x` / 11 классов", "`#a`", "Классы никогда не складываются в `id` — разряды сравниваются слева направо"],
          ["`#a` против `[id=\"a\"]`", "`#a`", "Селектор атрибута весит как класс, а не как `id`"],
          ["Класс в позднем слое против `#a` в раннем", "класс", "Слой сравнивается раньше веса"],
          ["Внеслойный класс против `#a` в слое", "внеслойный класс", "Внеслойные правила сильнее слоёв (для обычных объявлений)"],
          ["`style=\"color:blue\"` против `#a.x.y`", "`style`", "Вес `style=\"\"` выше любого селектора"],
          ["`[style] { color: red !important }` против `style=\"color:blue\"`", "правило с `!important`", "Единственный способ перебить inline без правки разметки"],
          ["Обычная анимация против `#a.x.x.x`", "анимация", "Анимация сильнее обычных объявлений автора"],
          ["`color: … !important` против анимации", "`!important`", "`!important` сильнее анимации"],
        ],
        "Замеры порядка каскада",
      ),

      h("Стратегия 1. Низкий и ровный вес"),
      p("Один класс на правило: `.btn`, `.btn--danger`, `.title`. Состояния выражаются атрибутами или псевдоклассами; глубина вложенности не участвует в весе. Для базовых стилей и дефолтов библиотек используйте `:where()`: правило с нулевым весом переопределяется любым классом."),
      note("Нулевой вес — не «слабый», а **самый слабый**: он проигрывает даже `button` (0,0,1). Поэтому базовые стили с `:where()` помещают в ранний слой, а не полагаются на вес."),
      p("Вес вложенного правила считается как у `:is()` от родителя. Замер: `.a, #x { & .b }` весит (1,1,0) и побеждает `.a .b.b` (0,3,0) — вес списка берётся по самому тяжёлому элементу. Правило `.a { & .b }` весит (0,2,0) и проигрывает `.a .b.b` (0,3,0). Родитель в `:where()` не добавляет веса: `:where(.card) { .t { … } }` весит (0,1,0) — как просто `.t`."),

      h("Стратегия 2. Порядок вместо веса: слои"),
      code(
        "css",
        `
        @layer reset, base, vendor, components, utilities;

        @layer base       { #page-title { font-size: 2rem; } }      /* тяжёлый вес (1,0,0) */
        @layer components { .title { font-size: 1.25rem; } }        /* лёгкий (0,1,0), но слой позже */
        `,
        { filename: "layers.css" },
      ),
      p("Замер: `.x` из слоя `ui` побеждает `#a` из слоя `base`, а внеслойный `.x` побеждает `#a` из любого слоя. Поэтому устаревший внеслойный код сильнее новых слоёв: при миграции его **оборачивают в слой** `legacy` и ставят на нужное место порядка."),
      warn("Слой не отменяет `!important`: у объявлений с `!important` порядок слоёв **обратный** (ранний слой сильнее позднего), а слой сильнее внеслойного. Замер: `@layer a, b` — побеждает `!important` из `a`; `!important` из слоя побеждает внеслойный `!important`."),

      h("Стратегия 3. Канал переопределения: токены"),
      code(
        "css",
        `
        .btn { background: var(--btn-bg, var(--accent)); }
        .btn--danger { --btn-bg: var(--danger); }
        .btn:disabled { --btn-bg: var(--muted); }
        `,
        { filename: "override-channel.css" },
      ),
      p("Варианты и состояния меняют **токен**, а не свойство: правила `.btn--danger` и `.btn:disabled` не соперничают за `background` и не зависят от порядка. Вес каждого — один класс и один класс с псевдоклассом."),

      h("Стратегия 4. Политика `!important`"),
      ul(
        "**Разрешён:** выключатели в слое утилит (`.u-hidden { display: none !important }`), системные настройки доступности, обход чужого `!important`.",
        "**Запрещён:** «чтобы заработало» в компонентах и вариантах: `!important` в компонентах заставит утилиты тоже использовать `!important`.",
        "**Помните об инверсии:** в слоях раньше объявленный слой побеждает среди `!important`; утилита с `!important` из последнего слоя проиграет `!important` любого раннего слоя.",
      ),

      h("Чужой CSS"),
      p("Библиотека приходит с `#modal .btn { background: red !important }`, а править её нельзя. Замеры (внутри — цвет кнопки):"),
      table(
        ["Подключение", "Свой CSS", "Цвет"],
        [
          ["Без слоёв", "`.btn { background: blue !important }`", "красный (вес (1,1,0) против (0,1,0))"],
          ["Без слоёв", "`#modal .btn { background: blue !important }`", "синий (веса равны, ваш правило позже)"],
          ["Вендор в слое `vendor`", "`.btn { background: blue !important }` вне слоя", "красный (слой сильнее у `!important`)"],
          ["Вендор в слое `vendor`", "`.btn { background: blue }` вне слоя", "красный (`!important` сильнее обычного)"],
          ["`@layer overrides, vendor;` и вендор в `vendor`", "`@layer overrides { .btn { background: blue !important } }`", "синий (ранний слой побеждает среди `!important`)"],
          ["Вендор в слое без `!important`", "`.btn { background: blue }` вне слоя", "синий (внеслойное сильнее слоя)"],
        ],
        "Перебиваем чужой CSS",
      ),
      code(
        "css",
        `
        @layer overrides, vendor;                                   /* порядок объявляем ДО подключения */
        @import url("vendor.css") layer(vendor);
        @layer overrides { .btn { background: blue !important; } }
        `,
        { filename: "override-vendor.css" },
      ),
      p("Если опустить первую строку, слой `vendor` создаётся импортом первым и выигрывает: замер дал красный цвет вместо синего. Порядок слоёв определяется **первым упоминанием**."),
      p("Если чужой скрипт навешивает `style=\"…\"`, обычное правило не поможет: замер показал, что `[style] { color: red !important }` перебивает inline-значение. Это крайняя мера: её держат в слое утилит и комментируют причину."),

      h("Бюджет специфичности: правила и проверки"),
      code(
        "json",
        `
        {
          "rules": {
            "selector-max-id": 0,
            "declaration-no-important": true,
            "selector-max-specificity": "0,2,0",
            "selector-max-compound-selectors": 3
          }
        }
        `,
        { filename: ".stylelintrc.json" },
      ),
      p("Замер stylelint 17.16.0 на учебном листе из 10 правил: **13 нарушений** (5 `#id`, 5 превышений веса, 3 `!important`); на листе после рефакторинга — 0. Линтер ловит нарушения в исходниках; отчёт по листу в браузере показывает фактическую картину после сборки."),
      code(
        "js",
        `
        // specificity-report.js — сводка по весам всех правил страницы (specificity() — калькулятор, см. «Подробный пример»)
        export function report(specificity) {
          const rows = [];
          const visit = (rules, layer) => {
            for (const r of rules) {
              if (r instanceof CSSLayerBlockRule) visit(r.cssRules, r.name);
              else if (r instanceof CSSMediaRule || r instanceof CSSSupportsRule) visit(r.cssRules, layer);
              else if (r instanceof CSSStyleRule) {
                const imp = (r.cssText.match(/!important/g) || []).length;   // объявления как записаны
                rows.push({ selector: r.selectorText, weight: specificity(r.selectorText), imp, layer });
              }
            }
          };
          for (const s of document.styleSheets) { try { visit(s.cssRules, null); } catch { /* другой origin */ } }
          const top = rows.reduce((m, r) => (r.weight[0] - m.weight[0] || r.weight[1] - m.weight[1] || r.weight[2] - m.weight[2]) > 0 ? r : m);
          return {
            rules: rows.length,
            ids: rows.filter((r) => r.weight[0] > 0).length,
            important: rows.reduce((n, r) => n + r.imp, 0),
            unlayered: rows.filter((r) => r.layer === null).length,
            max: "(" + top.weight.join(",") + ") " + top.selector,
          };
        }
        `,
        { filename: "specificity-report.js", lineNumbers: true, collapsed: true },
      ),
      table(
        ["Метрика", "Учебный лист до", "После рефакторинга"],
        [
          ["Правил", "10", "8"],
          ["Правил с `#id`", "5", "0"],
          ["Объявлений с `!important`", "3", "0"],
          ["Внеслойных правил", "10", "0"],
          ["Максимальный вес", "(1,2,1) `#app .panel h2.title`", "(0,2,0) `.btn:disabled`"],
          ["Нарушений stylelint", "13", "0"],
        ],
        "Бюджет до и после (замер)",
      ),
      note("`cssRules` таблицы с другого origin недоступен: чтение выбрасывает `SecurityError` (замер: `<link>` на другой порт). Отчёт запускают на странице, где стили отдаются с того же origin, а сторонние таблицы пропускают."),

      h("Диагностика: «почему не применилось»"),
      p("Первый инструмент — панель Styles в DevTools: проигравшие объявления зачёркнуты. Когда этого мало (много слоёв, много таблиц), полезен собственный разбор: для элемента и свойства перечислить все объявления и отсортировать их по ключу каскада."),
      code(
        "js",
        `
        // ключ сортировки: больше — сильнее
        const key = (d) => [
          d.important ? 1 : 0,                       // 1. важность
          d.inline ? 1 : 0,                          // 3. атрибут style
          layerKey(d),                               // 4. слой (у !important порядок обратный)
          ...d.weight,                               // 5. специфичность: a, b, c
          d.order,                                   // 7. порядок записи
        ];
        `,
        { filename: "key.js" },
      ),
      p("Полная версия — в «Подробном примере»; на всех 9 проверочных страницах (слои, `!important`, inline, `@media`, `@supports`, список селекторов) победитель совпал с `getComputedStyle`. Вот вывод для кнопки «Удалить» учебного листа (`background-color`):"),
      table(
        ["Селектор", "Значение", "!", "Вес", "Итог"],
        [
          ["`#app .panel .btn-danger`", "rgb(179, 38, 30)", "!", "(1,2,0)", "победило"],
          ["`#app .panel .btn`", "rgb(57, 73, 171)", "", "(1,2,0)", "проиграло: важность"],
          ["`.btn`", "rgb(47, 61, 154)", "", "(0,1,0)", "проиграло: важность"],
          ["`button`", "rgb(47, 61, 154)", "", "(0,0,1)", "проиграло: важность"],
        ],
        "explain(кнопка «Удалить», background-color)",
      ),
      note("Инструмент учебный: вложенные слои (`a.b`), вложенность CSS, теневой DOM и анимации не разбираются. Для расчёта веса в production используйте `@bramus/specificity` — мой калькулятор сверен с ним на 31 селекторе: 0 расхождений."),

      h("Рефакторинг «войны весов»"),
      steps(
        [
          ["Снимок «до»", "Снимите вычисленные стили всех элементов страницы для важных свойств. Это ваш эталон."],
          ["Слои", "Объявите порядок слоёв и оберните существующий код в слой `legacy`; вид не изменится, а новый код сможет побеждать без веса."],
          ["Плоские имена", "Замените зависимость от `#app` и вложенности на классы блока и модификаторы."],
          ["Токены-каналы", "Варианты и состояния переведите на пользовательские свойства компонента."],
          ["Уберите `#id` и `!important`", "Каждое удаление проверяйте снимком; линтер с бюджетом не даст вернуть."],
          ["Снимок «после»", "Сравните снимки: ноль расхождений — рефакторинг безопасен."],
        ],
        "План миграции",
      ),
      code(
        "js",
        `
        // snapshot.js — снимок вычисленных стилей и сравнение
        export const PROPS = ["color", "background-color", "font-size", "font-weight", "margin-top", "margin-bottom", "padding-top", "padding-left", "border-top-width", "border-top-left-radius"];
        export function snapshot(root = document.body) {
          return [...root.querySelectorAll("*")].map((el) => {
            const cs = getComputedStyle(el);
            return { tag: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 20), style: Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)])) };
          });
        }
        export function diff(before, after) {
          const out = [];
          before.forEach((b, i) => { for (const p of PROPS) if (b.style[p] !== after[i].style[p]) out.push({ element: b.tag + " «" + b.text + "»", prop: p, before: b.style[p], after: after[i].style[p] }); });
          return out;
        }
        `,
        { filename: "snapshot.js", lineNumbers: true, collapsed: true },
      ),
      p("Замер: на учебной странице 9 элементов × 10 свойств = 90 сравнений, **0 расхождений** между листом из 10 правил с `#id` и `!important` и листом из 8 правил в слоях."),
    ]),

    section("syntax", [
      annotated(
        "css",
        `
        @layer reset, base, vendor, components, utilities;

        @layer base {
          :where(a) { color: var(--link); }
          :where(button) { font: inherit; }
        }

        @layer components {
          .btn { background: var(--btn-bg, var(--accent)); color: var(--on-accent); }
          .btn--danger { --btn-bg: var(--danger); }
          .btn:disabled { --btn-bg: var(--muted); }
        }

        @layer utilities {
          .u-hidden { display: none !important; }
        }
        `,
        [
          { line: 1, text: "Порядок слоёв объявлен один раз: кто сильнее, решает позиция в списке, а не вес селектора." },
          { line: [3, 6], text: "Базовые стили с `:where()`: нулевой вес в раннем слое — любое правило компонента перебьёт их без борьбы." },
          { line: 9, text: "Компонент читает собственный токен `--btn-bg` с запасным значением из семантики." },
          { line: [10, 11], text: "Вариант и состояние меняют токен, а не свойство: не конкурируют между собой и не зависят от порядка." },
          { line: [14, 16], text: "`!important` — только для выключателей в слое утилит; не используется внутри компонентов." },
        ],
        "syntax.css",
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
        <title>Слой против id</title>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.5 system-ui, sans-serif; }
          @layer base, ui;
          @layer base { #save { background: #b3261e; } }          /* вес (1,0,0), ранний слой */
          @layer ui   { .btn  { background: #2f3d9a; color: #fff; } } /* вес (0,1,0), поздний слой */
          .btn { padding: 0.5rem 1rem; border: 0; border-radius: 0.25rem; font: inherit; }
          output { display: block; margin-top: 1rem; }
        </style>
        <button type="button" id="save" class="btn">Сохранить</button>
        <output></output>
        <script>
          const btn = document.querySelector("#save");
          document.querySelector("output").textContent = "background-color: " + getComputedStyle(btn).backgroundColor;
        </script>
        </html>
        `,
        { filename: "layer-vs-id.html", runnable: true, lineNumbers: true },
      ),
      p("Кнопка синяя: `rgb(47, 61, 154)`. Правило с `#save` тяжелее, но находится в раннем слое. Если убрать строку `@layer base, ui;`, порядок слоёв определится первым упоминанием (`base`, затем `ui`) — результат тот же; поменяйте имена местами, и кнопка станет красной."),
    ]),

    section("detailed-example", [
      p("Рабочий инструмент «почему не применилось»: учебный лист с войной весов, калькулятор специфичности и разбор по ключу каскада. Выберите элемент и свойство — таблица покажет, кто победил и почему проиграли остальные."),
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Почему не применилось</title>
        <style>
          /* учебный лист «войны весов» */
          button { padding: 8px 12px; border: 0; border-radius: 4px; background: #2f3d9a; color: #fff; font: inherit; }
          .btn { background: #2f3d9a; }
          #app .panel .btn { background: #3949ab; }
          #app .panel .btn-danger { background: #b3261e !important; }
          .btn[disabled] { background: #9e9e9e !important; color: #eee; }
          .title { font-size: 1.25rem; margin: 0; }
          #app .page__header .title { font-size: 2rem; }
          #app .panel h2.title { font-size: 1.5rem !important; }
          .note { color: #555; margin: 0.5rem 0; }
          #app .panel p.note { color: #333; }
        </style>
        <style>
          body { margin: 0; padding: 1rem; font: 16px/1.4 system-ui, sans-serif; }
          .diag { margin-top: 1.5rem; overflow-x: auto; }
          .diag label { margin-inline-end: 1rem; }
          .diag table { margin-top: 0.75rem; border-collapse: collapse; }
          .diag th, .diag td { padding: 4px 8px; border: 1px solid #c5cae9; text-align: left; font-size: 14px; }
        </style>

        <div id="app" class="page">
          <header class="page__header"><h1 class="title">Отчёт</h1><button type="button" class="btn">Обновить</button></header>
          <section class="panel">
            <h2 class="title">Продажи</h2>
            <p class="note">Данные за неделю</p>
            <button type="button" class="btn btn-danger">Удалить</button>
            <button type="button" class="btn" disabled>Недоступно</button>
          </section>
        </div>

        <div class="diag">
          <label>Элемент
            <select id="target">
              <option value=".btn-danger">кнопка «Удалить»</option>
              <option value="h2.title">заголовок «Продажи»</option>
              <option value=".note">примечание</option>
              <option value="button[disabled]">кнопка «Недоступно»</option>
            </select>
          </label>
          <label>Свойство
            <select id="prop">
              <option>background-color</option>
              <option>color</option>
              <option>font-size</option>
            </select>
          </label>
          <table>
            <thead><tr><th>Селектор</th><th>Значение</th><th>Слой</th><th>!</th><th>Вес</th><th>Итог</th></tr></thead>
            <tbody id="rows"></tbody>
          </table>
          <p id="computed"></p>
        </div>

        <script>
          // --- калькулятор специфичности (учебный; сверен с @bramus/specificity) ---
          function specificity(selector) {
            const cmp = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
            const max = (list) => list.reduce((m, s) => (cmp(s, m) > 0 ? s : m), [0, 0, 0]);
            const split = (s) => {
              const out = []; let depth = 0, cur = "";
              for (const ch of s) {
                if ("([".includes(ch)) depth++;
                if (")]".includes(ch)) depth--;
                if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
              }
              return out.concat(cur).map((x) => x.trim()).filter(Boolean);
            };
            const word = (s) => /^[\\w-]*/.exec(s)[0].length;
            const one = (sel) => {
              let a = 0, b = 0, c = 0, i = 0;
              while (i < sel.length) {
                const ch = sel[i];
                if (ch === "#") { a++; i += 1 + word(sel.slice(i + 1)); }
                else if (ch === ".") { b++; i += 1 + word(sel.slice(i + 1)); }
                else if (ch === "[") { b++; i = sel.indexOf("]", i) + 1; }
                else if (ch === ":") {
                  const el = sel[i + 1] === ":";
                  const start = i + (el ? 2 : 1);
                  const name = sel.slice(start, start + word(sel.slice(start)));
                  i = start + name.length;
                  let arg = "";
                  if (sel[i] === "(") { let d = 0, j = i; for (; j < sel.length; j++) { if (sel[j] === "(") d++; if (sel[j] === ")" && --d === 0) break; } arg = sel.slice(i + 1, j); i = j + 1; }
                  if (el || ["before", "after", "first-line", "first-letter"].includes(name)) c++;
                  else if (name === "where") { /* вес 0 */ }
                  else if (["is", "not", "has", "matches"].includes(name)) { const m = max(split(arg).map(one)); a += m[0]; b += m[1]; c += m[2]; }
                  else b++;
                }
                else if (/[a-zA-Z]/.test(ch)) { c++; i += word(sel.slice(i)); }
                else i++;
              }
              return [a, b, c];
            };
            return max(split(selector).map(one));
          }

          // --- разбор каскада для элемента и свойства ---
          function explain(el, prop) {
            const layers = [], found = [];
            let order = 0;
            const note = (name) => { if (!layers.includes(name)) layers.push(name); };
            const visit = (rules, layer) => {
              for (const rule of rules) {
                if (rule instanceof CSSLayerStatementRule) rule.nameList.forEach(note);
                else if (rule instanceof CSSLayerBlockRule) { note(rule.name); visit(rule.cssRules, rule.name); }
                else if (rule instanceof CSSMediaRule) { if (matchMedia(rule.conditionText).matches) visit(rule.cssRules, layer); }
                else if (rule instanceof CSSSupportsRule) { if (CSS.supports(rule.conditionText)) visit(rule.cssRules, layer); }
                else if (rule instanceof CSSStyleRule) {
                  order++;
                  const value = rule.style.getPropertyValue(prop);
                  if (!value) continue;
                  const parts = rule.selectorText.split(/,(?![^(]*\\))/).map((s) => s.trim());
                  const hits = parts.filter((s) => el.matches(s));
                  if (!hits.length) continue;
                  const weights = hits.map(specificity).sort((x, y) => y[0] - x[0] || y[1] - x[1] || y[2] - x[2]);
                  found.push({ selector: hits.join(", "), value, important: rule.style.getPropertyPriority(prop) === "important", layer, weight: weights[0], order });
                }
              }
            };
            for (const sheet of document.styleSheets) { try { visit(sheet.cssRules, null); } catch (e) { /* чужой origin */ } }
            const inline = el.style.getPropertyValue(prop);
            if (inline) found.push({ selector: 'style=""', value: inline, important: el.style.getPropertyPriority(prop) === "important", layer: null, weight: [1, 0, 0], order: Infinity, inline: true });

            const key = (d) => {
              const rank = d.layer === null ? layers.length : layers.indexOf(d.layer);
              const layerKey = d.important ? (d.layer === null ? -1 : layers.length - rank) : rank;
              return [d.important ? 1 : 0, d.inline ? 1 : 0, layerKey, ...d.weight, d.order];
            };
            found.sort((a, b) => { const x = key(a), y = key(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] - x[i]; return 0; });

            const names = ["важность", "inline-стиль", "слой", "специфичность", "специфичность", "специфичность", "порядок"];
            const w = (d) => "(" + d.weight.join(",") + ")";
            return found.map((d, i) => {
              let verdict = "победило";
              if (i > 0) {
                const x = key(found[0]), y = key(d);
                const at = x.findIndex((v, j) => v !== y[j]);
                verdict = "проиграло: " + names[at] + (at >= 3 && at <= 5 ? " " + w(d) + " < " + w(found[0]) : "");
              }
              return { selector: d.selector, value: d.value, layer: d.layer === null ? "—" : d.layer, important: d.important, weight: w(d), verdict };
            });
          }

          // --- интерфейс ---
          const target = document.querySelector("#target"), propSelect = document.querySelector("#prop");
          const rows = document.querySelector("#rows"), computed = document.querySelector("#computed");
          function render() {
            const el = document.querySelector(target.value), prop = propSelect.value;
            rows.textContent = "";
            const list = explain(el, prop);
            if (!list.length) {
              const tr = rows.insertRow();
              const td = tr.insertCell(); td.colSpan = 6; td.textContent = "Объявлений этого свойства для элемента нет";
            }
            for (const r of list) {
              const tr = rows.insertRow();
              for (const text of [r.selector, r.value, r.layer, r.important ? "!" : "", r.weight, r.verdict]) tr.insertCell().textContent = text;
            }
            computed.textContent = "getComputedStyle: " + getComputedStyle(el).getPropertyValue(prop);
          }
          target.addEventListener("change", render);
          propSelect.addEventListener("change", render);
          render();
        </script>
        </html>
        `,
        { filename: "why-not.html", runnable: true, lineNumbers: true, collapsed: true },
      ),
      p("Проверка по всем сочетаниям: для 4 элементов × 3 свойств победитель в таблице совпадает со значением `getComputedStyle`."),
    ]),

    section("analysis", [
      table(
        ["Запрос", "Победитель", "Причина"],
        [
          ["Кнопка «Удалить», `background-color`", "`#app .panel .btn-danger` (1,2,0) `!`", "Единственное объявление с `!important` среди четырёх; остальные проиграли на первом критерии"],
          ["Заголовок «Продажи», `font-size`", "`#app .panel h2.title` (1,2,1) `!`", "`.title` (0,1,0) проиграл на первом критерии — важности"],
          ["Примечание, `color`", "`#app .panel p.note` (1,2,1)", "`!important` нет: решает вес — (0,1,0) против (1,2,1)"],
          ["Кнопка «Недоступно», `background-color`", "`.btn[disabled]` (0,2,0) `!`", "Объявление с `!important` побеждает даже тяжёлый `#app .panel .btn` (1,2,0), у которого `!important` нет"],
        ],
        "Что показал разбор учебного листа",
      ),
      ul(
        "Важность проверяется **раньше** веса: `.btn[disabled]` (0,2,0) обыгрывает `#app .panel .btn` (1,2,0) только потому, что у него `!important`.",
        "В четвёртой строке видно, как рождается спираль: `!important` у состояния заставит и вариант получить `!important`, а потом — следующий вариант.",
        "В таблице вес показывается для каждого объявления, поэтому видно, на каком именно критерии оно проиграло: «важность», «слой», «специфичность (…)» или «порядок».",
        "Для элемента, у которого в правиле несколько селекторов через запятую, берётся вес того, что реально сопоставился (замер: `.x, #a` для элемента с `id=\"a\"` даёт (1,0,0)).",
      ),
    ]),

    section("internals", [
      h("Что происходит при разрешении конфликта"),
      steps(
        [
          ["Сбор", "Для элемента находятся все правила, чей селектор подходит, и объявления нужного свойства из них (включая `style=\"\"` и ключевые кадры активной анимации)."],
          ["Сортировка по критериям", "Объявления сравниваются по порядку: происхождение и важность → контекст → `style` → слой → специфичность → близость области → порядок записи."],
          ["Победитель", "Первое объявление в отсортированном списке становится «каскадным значением». Остальные не участвуют в наследовании и вычислении."],
          ["Вычисление", "Каскадное значение превращается в вычисленное (`var()`, относительные единицы)."],
        ],
        "Разрешение конфликта для одного свойства",
      ),
      p("Каждое свойство решается **независимо**: одно правило может выиграть `color`, а соседнее — `background`. Поэтому разбор всегда задаётся парой «элемент + свойство», а `explain` в примере принимает именно её."),
      h("Почему слои идут раньше веса"),
      p("Слои были придуманы, чтобы управлять приоритетом групп стилей **без** подгонки веса. Если бы вес сравнивался первым, `#id` из `reset` перебивал бы класс из `components`. Поэтому слой — критерий выше специфичности, а у `!important` порядок слоёв инвертируется: так «ранний» слой (обычно reset и сторонний код) может защитить критичные правила. Та же схема действует для происхождений: по спецификации `!important` пользователя и браузера сильнее `!important` автора."),
      h("Как считается вес вложенных правил"),
      p("Вложенное правило раскрывается до `:is()` от родителя: `.a, #x { & .b }` ≡ `:is(.a, #x) .b`, поэтому его вес берётся по самому тяжёлому аргументу — (1,1,0). Замер подтвердил: такое правило побеждает `.a .b.b` (0,3,0)."),
      h("`:not()` и `:is()` могут раздувать вес"),
      p("Аргумент псевдокласса учитывается целиком: `.x:not(#nope)` весит (1,1,0) и в замере победил `.x.x.x` (0,3,0), хотя `#nope` в документе не встречается. Это приём повышения веса — и ловушка, когда `:is()` с `#id` в списке «заражает» весь селектор."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Побеждать весом"),
      wrongRight(
        "css",
        {
          code: `
            #header .btn { background: #b3261e; }
            #header .nav .btn-primary { background: #2f3d9a; }   /* пришлось повысить вес */
          `,
          note: "Вес растёт (1,1,0) → (1,2,0); следующий вариант должен быть ещё тяжелее.",
        },
        {
          code: `
            .btn { background: var(--btn-bg, #b3261e); }
            .btn-primary { --btn-bg: #2f3d9a; }
          `,
          note: "Вариант меняет токен: ни веса, ни порядка в споре нет.",
        },
      ),
      h("Ошибка 2. `!important` как первый инструмент"),
      p("`!important` «лечит» одно переопределение и заставляет следующее тоже использовать `!important`. Решайте причину (слои, вес, токены); `!important` оставляйте для выключателей и обхода чужого кода."),
      h("Ошибка 3. Хак `.btn.btn.btn`"),
      p("Повторение класса даёт вес (0,3,0) и работает, но причина неочевидна, а следующий разработчик повторит ещё раз. Если выбираете повышение веса временно, оставьте комментарий и задачу на слой."),
      h("Ошибка 4. Считать `:where()` «сильным»"),
      p("Замер: `:where(.btn)` проигрывает `button` (0,0,1). Нулевой вес защищает от борьбы, но не выигрывает у типовых селекторов. Базовые стили держите в раннем слое."),
      h("Ошибка 5. Ожидать, что слои победят внеслойный код"),
      p("Внеслойные правила сильнее любых слоёв (для обычных объявлений): замер — внеслойный `.x` победил `#a` из слоя. Старый код, оставленный вне слоёв, будет перебивать новый; оберните его в слой `legacy`."),
      h("Ошибка 6. `!important` в слое и неверное ожидание порядка"),
      p("Среди `!important` побеждает **ранний** слой. Если `.u-hidden { display: none !important }` лежит в последнем слое `utilities`, `!important` из `components` его перебьёт."),
      h("Ошибка 7. Менять стили через `el.style`"),
      p("`style=\"…\"` сильнее всех слоёв и селекторов; перебить его можно только `!important` в таблице. Переключайте классы и атрибуты, а не пишите свойства из скрипта."),
      h("Ошибка 8. Рефакторить без снимка"),
      p("«Визуально такое же» не доказательство: заметить смещение на 1px или оттенок цвета в десятке состояний нельзя. Снимайте вычисленные стили до и после."),
    ]),

    section("antipatterns", [
      ul(
        "**Привязка к `#app` или `body`** в каждом селекторе «для надёжности».",
        "**`!important` в компонентах и вариантах.**",
        "**Селекторы длиннее трёх составных частей:** `.page .panel .list .item .link`.",
        "**Повторение класса** (`.a.a.a`) вместо слоя.",
        "**Копирование селекторов чужой библиотеки** с `#id`, чтобы её перебить.",
        "**Миграция без слоя `legacy`:** новый код оказывается слабее старого внеслойного.",
        "**Стили через `el.style`** для состояний.",
        "**Бюджет без линтера:** договорённость, не подтверждённая автоматикой, нарушается за месяц.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Объявляйте порядок слоёв в одной строке** в начале главного файла и подключайте вендора в отдельный слой через `@import … layer(vendor)`.",
        "**Держите вес не выше `0,2,0`:** `selector-max-specificity: 0,2,0`, `selector-max-id: 0`, `declaration-no-important: true` (кроме слоя утилит).",
        "**Базовые стили и дефолты — через `:where()`** в раннем слое.",
        "**Варианты, состояния и темы — через токены:** `--btn-bg`, а не новое объявление `background`.",
        "**Диагностируйте по ключу каскада:** сначала важность и слой, потом вес, потом порядок.",
        "**Перед рефакторингом снимайте стили,** после — сравнивайте; ноль расхождений — условие слияния.",
        "**Комментируйте исключения:** любое `!important` или повышение веса — с причиной и ссылкой на задачу.",
        "**Запишите политику `!important`:** где разрешён, как ведёт себя в слоях, как обходить чужой.",
      ),
      tip("Добавьте проверку бюджета в CI: упавший `stylelint` с понятным сообщением («Too many ID selectors …») дешевле, чем неделя отладки каскада."),
    ]),

    section("edge-cases", [
      h("Порядок слоёв определяет первое упоминание"),
      p("Слой, созданный `@import … layer(vendor)` раньше строки `@layer overrides, vendor;`, окажется **раньше** `overrides`. В замере это дало красный цвет чужого `!important` вместо своего синего. Объявляйте порядок строкой `@layer …;` до любых импортов."),
      h("Правило со списком селекторов"),
      p("Если в правиле `.x, #a { … }` элемент подходит и под `.x`, и под `#a`, учитывается вес наиболее специфичного **сопоставившегося** селектора (в замере (1,0,0))."),
      h("`@media`, `@supports` и вес"),
      p("Условные правила не меняют вес: `@media (min-width: 100px) { .x { … } }` весит как `.x`; при равенстве решает порядок записи."),
      h("Анимации"),
      p("Обычное объявление автора проигрывает анимации даже при тяжёлом селекторе (замер: `#a.x.x.x` (1,3,0) проиграл анимации), а `!important` анимацию перебивает. Если элемент «не меняет цвет», проверьте активные `animation`."),
      h("Чужие таблицы"),
      p("У таблиц с другого origin `cssRules` недоступен (`SecurityError`): инструменты, перебирающие `document.styleSheets`, их пропускают — доверяйте только DevTools для них."),
      h("Теневой DOM"),
      p("Контекст сравнивается раньше слоёв: правила внутри и снаружи теневого дерева не «воюют» весом. Разбор в примере теневой DOM не обходит."),
    ]),

    section("related", [
      ul(
        "[Специфичность](/learn/css/specificity) — расчёт тройки (a, b, c) и исключения.",
        "[Каскад](/learn/css/cascade) — происхождение, важность, порядок.",
        "[Каскадные слои](/learn/css/cascade-layers) — `@layer`, `revert-layer`, импорт в слой.",
        "[Методологии CSS](/learn/css/methodologies) — плоские имена и проверка соглашений.",
        "[Организация CSS](/learn/css/organizing-css) — структура слоёв проекта.",
        "[Дизайн-токены](/learn/css/design-tokens) — токены как канал переопределения.",
        "[Вложенность CSS](/learn/css/nesting-modern) — вес вложенных правил.",
        "[Отладка CSS](/learn/css/debugging-css) — DevTools и практические приёмы поиска причин.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "css",
        {
          title: "До: 10 правил, 5 с #id, 3 !important, вес до (1,2,1)",
          code: `
            button { padding: 8px 12px; border: 0; border-radius: 4px; background: #2f3d9a; color: #fff; font: inherit; }
            .btn { background: #2f3d9a; }
            #app .panel .btn { background: #3949ab; }
            #app .panel .btn-danger { background: #b3261e !important; }
            .btn[disabled] { background: #9e9e9e !important; color: #eee; }
            .title { font-size: 1.25rem; margin: 0; }
            #app .page__header .title { font-size: 2rem; }
            #app .panel h2.title { font-size: 1.5rem !important; }
            .note { color: #555; margin: 0.5rem 0; }
            #app .panel p.note { color: #333; }
          `,
          note: "Вес растёт вместе с вложенностью, варианты соревнуются за свойства, `!important` — единственный выход.",
        },
        {
          title: "После: 8 правил в слоях, без #id и !important, вес до (0,2,0)",
          code: `
            @layer base, components, utilities;

            @layer base {
              :where(button) { padding: 8px 12px; border: 0; border-radius: 4px; background: #2f3d9a; color: #fff; font: inherit; }
            }

            @layer components {
              .btn { background: var(--btn-bg, #2f3d9a); }
              .btn--danger { --btn-bg: #b3261e; }
              .btn:disabled { --btn-bg: #9e9e9e; color: #eee; }
              .title { font-size: var(--title-size, 1.25rem); margin: 0; }
              .title--page { --title-size: 2rem; }
              .title--section { --title-size: 1.5rem; }
              .note { color: #333; margin: 0.5rem 0; }
            }
          `,
          note: "Вычисленные стили идентичны (90 сравнений, 0 расхождений); stylelint с бюджетом `0,2,0` — 0 нарушений.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "css.specificity-management.ex1",
      title: "Кто победит: порядок критериев",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждой пары определите победителя и назовите критерий, который это решает. Все правила задают `color` одному элементу."),
        ol(
          "`.card .title` и `.title`",
          "`#a` и `.x.x.x.x` (элемент имеет `id=\"a\"` и класс `x`)",
          "`:where(.btn)` и `button`",
          "`#a` и `[id=\"a\"]`",
          "`.x` в слое `ui` и `#a` в слое `base` (`@layer base, ui;`)",
          "`.x` без слоя и `#a` в слое",
        ),
      ],
      hints: ["Что сравнивается раньше: слой или специфичность?", "Как считается вес `:where()`?"],
      checks: ["Названы шесть победителей", "Для каждой пары указан критерий", "Различены слои и вес"],
      solution: [
        table(
          ["Пара", "Победитель", "Критерий"],
          [
            ["1", "`.card .title` (0,2,0)", "Специфичность"],
            ["2", "`#a` (1,0,0)", "Специфичность: разряд `a` решает, классы не складываются в `id`"],
            ["3", "`button` (0,0,1)", "Специфичность: у `:where()` вес 0"],
            ["4", "`#a`", "Специфичность: атрибут весит как класс, а не как `id`"],
            ["5", "`.x` из `ui`", "Слой: поздний слой сильнее независимо от веса"],
            ["6", "`.x` внеслойный", "Слой: внеслойные правила сильнее слоёв (для обычных объявлений)"],
          ],
          "Разбор",
        ),
        p("Все шесть результатов проверены в Chromium по итоговому цвету."),
      ],
    }),
    exercise({
      id: "css.specificity-management.ex2",
      title: "Не работает вариант кнопки",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Вариант `.btn-primary` не перекрашивает кнопку. Исправьте двумя способами **без** `!important`, `#id` и повышения веса: (а) уменьшив вес старого правила; (б) не меняя селекторов, а оградив старый код слоем."),
        code(
          "css",
          `
          #header .btn { background: #b3261e; }
          .btn-primary { background: #2f3d9a; }       /* не применяется */
          `,
        ),
        code("html", `<header id="header"><button class="btn btn-primary">Сохранить</button></header>`),
      ],
      hints: ["Какой вес у `#header .btn` и у `.btn-primary`?", "Как слои помогают, если нельзя менять веса?"],
      checks: ["Оба способа дают `rgb(47, 61, 154)`", "Нет `!important`", "Нет повышения веса"],
      solution: [
        code(
          "css",
          `
          /* (а) понизить вес старого правила — порядок записи решает */
          .btn { background: #b3261e; }
          .btn-primary { background: #2f3d9a; }

          /* (б) слои: старый код в раннем слое */
          @layer legacy, components;
          @layer legacy { #header .btn { background: #b3261e; } }
          @layer components { .btn-primary { background: #2f3d9a; } }
          `,
        ),
        p("Причина: `#header .btn` — (1,1,0), `.btn-primary` — (0,1,0). Оба способа замерены в Chromium: итоговый цвет кнопки `rgb(47, 61, 154)`. Исходный вариант даёт `rgb(179, 38, 30)`."),
      ],
    }),
    exercise({
      id: "css.specificity-management.ex3",
      title: "Перебить чужой !important",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Файл `vendor.css` менять нельзя, в нём есть правило:"),
        code("css", `#modal .btn { background: red !important; }`),
        p("Нужно, чтобы кнопка `.btn` внутри `#modal` стала синей. Напишите минимальный CSS страницы, использующий слои и импорт, и объясните, почему порядок строк важен."),
      ],
      hints: ["Как ведёт себя порядок слоёв у `!important`?", "Когда создаётся слой при `@import … layer(…)`?"],
      checks: ["Порядок слоёв объявлен до импорта", "Свой `!important` в раннем слое", "Объяснена инверсия"],
      solution: [
        code(
          "css",
          `
          @layer overrides, vendor;
          @import url("vendor.css") layer(vendor);
          @layer overrides { .btn { background: blue !important; } }
          `,
        ),
        p("Среди `!important` побеждает ранний слой, поэтому `overrides` объявлен раньше `vendor`. Если убрать первую строку, слой `vendor` создастся импортом первым, и чужой `!important` выиграет: замер дал красный цвет вместо синего. Результат с первой строкой проверен на странице, обслуживаемой по HTTP: цвет `rgb(0, 0, 255)`."),
      ],
    }),
  ],

  challenge: {
    id: "css.specificity-management.challenge",
    title: "Миграция из войны весов в слои с доказательством эквивалентности",
    scenario: [
      p("Учебный лист из 10 правил (раздел «До / после») нужно переписать: убрать `#id` и `!important`, перейти на слои, плоские имена и токены. Разметку можно менять только добавлением модификаторов вместо зависимости от `#app`. Результат должен выглядеть идентично, а доказывать это надо автоматически."),
    ],
    requirements: [
      "Лист в слоях `base`, `components`, `utilities`; базовые стили через `:where()`",
      "Нет правил с `#id`, нет `!important`, нет внеслойных правил",
      "Максимальный вес не выше `0,2,0`",
      "Варианты (`danger`, `disabled`, заголовки страницы и раздела) — через токены",
      "Снимок вычисленных стилей до и после по 10 свойствам",
      "Отчёт `specificity-report` и `stylelint` с бюджетом",
    ],
    constraints: [
      "Нельзя менять структуру разметки (порядок и вложенность элементов)",
      "Нельзя использовать `!important` и `#id`",
      "Нельзя повышать вес повторением класса",
    ],
    acceptance: [
      "Снимок «до» и «после»: 9 элементов × 10 свойств — 0 расхождений",
      "Отчёт: `ids` = 0, `important` = 0, `unlayered` = 0, максимум не выше (0,2,0)",
      "`stylelint` с правилами `selector-max-id: 0`, `declaration-no-important: true`, `selector-max-specificity: \"0,2,0\"` — 0 нарушений",
      "Новый вариант (`btn--warning`) добавляется без селекторов и без изменений существующих правил",
    ],
    hints: [
      "Что должно стоять на месте `#app .panel .btn`?",
      "Как выразить «опасная» и «недоступная» кнопки без конкуренции за `background`?",
      "Какие свойства нужно включить в снимок, чтобы заметить смещение отступов?",
    ],
    solution: [
      code(
        "css",
        `
        @layer base, components, utilities;

        @layer base {
          :where(button) { padding: 8px 12px; border: 0; border-radius: 4px; background: #2f3d9a; color: #fff; font: inherit; }
        }

        @layer components {
          .btn { background: var(--btn-bg, #2f3d9a); }
          .btn--danger { --btn-bg: #b3261e; }
          .btn:disabled { --btn-bg: #9e9e9e; color: #eee; }
          .title { font-size: var(--title-size, 1.25rem); margin: 0; }
          .title--page { --title-size: 2rem; }
          .title--section { --title-size: 1.5rem; }
          .note { color: #333; margin: 0.5rem 0; }
        }
        `,
        { filename: "refactored.css", lineNumbers: true },
      ),
      code(
        "html",
        `
        <div class="page">
          <header class="page__header"><h1 class="title title--page">Отчёт</h1><button type="button" class="btn">Обновить</button></header>
          <section class="panel">
            <h2 class="title title--section">Продажи</h2>
            <p class="note">Данные за неделю</p>
            <button type="button" class="btn btn--danger">Удалить</button>
            <button type="button" class="btn" disabled>Недоступно</button>
          </section>
        </div>
        `,
        { filename: "markup.html" },
      ),
      ul(
        "**Слои:** базовые стили `:where(button)` в `base`; компоненты и варианты — в `components`; `!important` не нужен.",
        "**Токены:** `--btn-bg` и `--title-size` убирают конкуренцию за `background` и `font-size`; вес каждого правила — не выше (0,2,0).",
        "**Доказательство:** `snapshot()` на обеих страницах → `diff(before, after)` пуст (замер: 90 сравнений, 0 расхождений); `report(specificity)` даёт `ids: 0, important: 0, unlayered: 0, max: (0,2,0) .btn:disabled`; stylelint — 0 нарушений.",
        "**Расширение:** `btn--warning { --btn-bg: #8a5a00 }` — одно правило, без селекторов и без правок существующих.",
      ),
    ],
  },

  interview: [
    iq("css.specificity-management.i1", "basic", "Что такое «война специфичности» и чем она опасна?", [
      p("Ситуация, когда переопределение достигается более тяжёлым селектором или `!important`, а не структурой правил. Вес растёт спиралью, привязывается к вложенности, рефакторинг становится рискованным, а единственным способом переопределить `!important` остаётся другой `!important`."),
    ]),
    iq("css.specificity-management.i2", "basic", "В каком порядке каскад сравнивает объявления?", [
      ol(
        "Происхождение и важность.",
        "Контекст (теневой DOM).",
        "Атрибут `style`.",
        "Слой.",
        "Специфичность.",
        "Близость области (`@scope`).",
        "Порядок записи.",
      ),
    ]),
    iq("css.specificity-management.i3", "intermediate", "Класс из позднего слоя против `#id` из раннего: кто победит и почему?", [
      p("Класс. Слой сравнивается раньше специфичности; вес `#id` в споре не участвует (замер в Chromium)."),
    ]),
    iq("css.specificity-management.i4", "intermediate", "Как ведёт себя `!important` внутри слоёв?", [
      ul(
        "Порядок слоёв обратный: у раннего слоя `!important` сильнее.",
        "Слой побеждает внеслойный `!important`.",
        "Поэтому свой `!important` для обхода чужого кладут в слой, объявленный **раньше** слоя вендора (`@layer overrides, vendor;`).",
      ),
    ]),
    iq("css.specificity-management.i5", "intermediate", "Почему базовые стили оформляют через `:where()`, и где здесь ловушка?", [
      p("Вес `:where()` равен нулю, поэтому любое правило с классом его перебивает без борьбы. Ловушка: ноль слабее даже типового селектора — `:where(.btn)` проиграл `button` (0,0,1), поэтому базовые стили лучше сочетать с ранним слоем."),
    ]),
    iq("css.specificity-management.i6", "advanced", "Как безопасно мигрировать большой устаревший CSS к слоям?", [
      ul(
        "Снять снимок вычисленных стилей ключевых страниц.",
        "Объявить порядок слоёв и обернуть старый код в слой `legacy`, чтобы внеслойный код не побеждал новые слои.",
        "Переносить компоненты на плоские классы и токены, удаляя `#id` и `!important` по одному и сверяя снимки.",
        "Включить линтер с бюджетом веса, чтобы не вернуть старые приёмы.",
      ),
    ]),
    iq("css.specificity-management.i7", "engineering", "Как автоматизировать контроль специфичности в проекте?", [
      ul(
        "Линтер: `selector-max-specificity`, `selector-max-id`, `declaration-no-important`, `selector-max-compound-selectors`.",
        "Отчёт по листу в браузере: число правил с `#id`, `!important`, внеслойных правил и максимальный вес.",
        "Тест на снимок вычисленных стилей при рефакторинге.",
        "Для расчёта веса в инструментах — библиотека `@bramus/specificity`.",
      ),
    ]),
    iq("css.specificity-management.i8", "debugging", "Стиль не применяется. Как вы найдёте причину?", [
      ul(
        "В DevTools найти элемент и свойство в Styles: проигравшее объявление зачёркнуто, победитель виден в Computed.",
        "Проверить критерии по порядку: `!important` → `style` → слой → вес → порядок записи.",
        "Проверить активные анимации и внеслойные правила; убедиться, что селектор действительно сопоставляется.",
        "Не усложнять селектор, а выбрать подходящий уровень: слой, токен или упрощение старого правила.",
      ),
    ]),
  ],

  exam: [
    mcq("css.specificity-management.e1", "foundation", "Что побеждает: `.x` из позднего слоя или `#a` из раннего?", ["Решает порядок записи", "`#a`: id всегда сильнее", "Класс из позднего слоя", "Они равны"], 2, "Слой сравнивается раньше специфичности: класс из позднего слоя побеждает независимо от веса `#a`."),
    mcq("css.specificity-management.e2", "foundation", "Какой вес имеет `:where(.btn)`?", ["(0,0,0)", "(0,0,1)", "(0,1,0)", "(1,0,0)"], 0, "Аргументы `:where()` не участвуют в весе: он равен нулю — слабее даже `button`."),
    mcq("css.specificity-management.e3", "intermediate", "Что побеждает в `@layer a, b;` среди объявлений `!important`?", ["Слой `b`, как и для обычных", "Побеждает внеслойное", "Решает специфичность", "Слой `a`: порядок обратный"], 3, "У `!important` порядок слоёв обратный: раньше объявленный слой сильнее; слой сильнее внеслойного."),
    mcq("css.specificity-management.e4", "intermediate", "Какой критерий проверяется раньше: слой или специфичность?", ["Специфичность", "Слой", "Порядок записи", "Они проверяются одновременно"], 1, "Слой стоит выше специфичности в порядке сортировки каскада."),
    mcq("css.specificity-management.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`style=\"\"` сильнее селектора с `#id`", "Внеслойное правило сильнее слоя для обычных объявлений", "`[id=\"a\"]` весит как `#a`", "Анимация сильнее обычного объявления автора"], [0, 1, 3], "Атрибутный селектор весит как класс (0,1,0), а `#a` — (1,0,0); остальные утверждения подтверждены замерами."),
    mcq("css.specificity-management.e6", "advanced", "Как правильно подключить чужой CSS с `!important`, чтобы свой `!important` его перебил?", ["`@import url(vendor.css)` и `.btn.btn { … !important }`", "Ничего не получится: `!important` не перебить", "`@import … layer(vendor)` раньше объявления порядка", "`@layer overrides, vendor;` затем `@import … layer(vendor)` и `!important` в `overrides`"], 3, "Среди `!important` побеждает ранний слой, а порядок слоёв определяется первым упоминанием — его задают строкой `@layer …;` до импорта."),
    open("css.specificity-management.e7", "intermediate", "Объясните, почему рост весов не решает проблему переопределения, и предложите альтернативу.", [
      ul(
        "Вес — тай-брейкер пятого уровня; ставка каждого следующего правила должна быть выше предыдущей, и заканчивается всё `!important`.",
        "Вес привязывает стили к вложенности (`#app …`): компонент нельзя перенести.",
        "Альтернатива: слои вместо веса, один класс на правило, токены-каналы для вариантов, `!important` только в слое утилит.",
      ),
    ], ["Объяснена спираль", "Назван перенос компонента", "Предложены слои, токены, политика"], { format: "concept" }),
  ],

  mastery: [
    mcq("css.specificity-management.m1", "intermediate", "Что покажет `.a, #x { & .b }` в сравнении с `.a .b.b` (0,3,0)?", ["Победит `.a .b.b`: три класса больше", "Решит порядок записи", "Победит вложенное правило: вес (1,1,0)", "Ничего не применится"], 2, "Вложенное правило раскрывается до `:is(.a, #x) .b`: вес по самому тяжёлому аргументу (1,1,0) выше (0,3,0)."),
    mcq("css.specificity-management.m2", "advanced", "Почему `[style] { color: red !important }` может перебить inline-значение?", ["Атрибутный селектор весит (1,0,0)", "`!important` автора сильнее обычного `style`", "Селекторы всегда сильнее inline", "Потому что слой раньше"], 1, "Среди критериев важность сравнивается первой: `!important` в таблице побеждает обычное значение `style`."),
    mcq("css.specificity-management.m3", "advanced", "Что даёт снимок вычисленных стилей при рефакторинге?", ["Доказательство того, что вид не изменился", "Ускоряет рендеринг", "Проверяет доступность", "Уменьшает размер CSS"], 0, "Сравнение значений `getComputedStyle` до и после доказывает эквивалентность — на измеренной странице 90 сравнений дали 0 расхождений."),
    open("css.specificity-management.m4", "advanced", "Спроектируйте процесс отказа от `#id` и `!important` в проекте на 300 компонентов и 5 команд.", [
      ul(
        "Подготовка: слой `legacy`, порядок слоёв, снимки ключевых страниц, линтер с бюджетом в режиме предупреждений.",
        "Миграция: по компонентам; плоские классы, токены-каналы, снимок до/после в CI; `!important` остаётся только в слое утилит.",
        "Контроль: правила линтера, отчёт по весам на сборке, документ политики `!important`, обзор исключений.",
        "Завершение: переключить линтер на ошибки, удалить слой `legacy`, измерить размер и число исключений.",
      ),
    ], ["Слой legacy и порядок слоёв", "Снимки в CI", "Линтер и политика"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "css.specificity-management.f1", front: "Порядок сортировки каскада?", back: "Важность → контекст → `style` → слой → специфичность → (`@scope`) → порядок записи." },
    { id: "css.specificity-management.f2", front: "Слой или `#id`?", back: "Слой: слой сильнее специфичности; внеслойное сильнее слоя (для обычных объявлений)." },
    { id: "css.specificity-management.f3", front: "`!important` в слоях?", back: "Порядок обратный: ранний слой сильнее; слой сильнее внеслойного." },
    { id: "css.specificity-management.f4", front: "Вес `:where()`?", back: "0 — слабее даже `button` (0,0,1); база в раннем слое." },
    { id: "css.specificity-management.f5", front: "Канал переопределения?", back: "Токен: `.btn { background: var(--btn-bg, …) }`, вариант меняет `--btn-bg`, а не `background`." },
    { id: "css.specificity-management.f6", front: "Доказательство рефакторинга?", back: "Снимок `getComputedStyle` до и после: 0 расхождений; линтер с бюджетом `0,2,0`." },
  ],

  sources: [
    { title: "CSS Cascading and Inheritance Level 5: Cascade Sorting Order", url: "https://www.w3.org/TR/css-cascade-5/#cascade-sort", publisher: "W3C" },
    { title: "CSS Cascading and Inheritance Level 6: Scoping proximity", url: "https://www.w3.org/TR/css-cascade-6/#cascade-sort", publisher: "W3C" },
    { title: "Selectors Level 4: Calculating a selector's specificity", url: "https://www.w3.org/TR/selectors-4/#specificity-rules", publisher: "W3C" },
    { title: "MDN: Specificity", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity", publisher: "MDN" },
    { title: "MDN: @layer", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@layer", publisher: "MDN" },
    { title: "MDN: :where()", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/:where", publisher: "MDN" },
    { title: "stylelint: selector-max-specificity", url: "https://stylelint.io/user-guide/rules/selector-max-specificity/", publisher: "Other" },
    { title: "@bramus/specificity", url: "https://github.com/bramus/specificity", publisher: "Other" },
  ],
};
