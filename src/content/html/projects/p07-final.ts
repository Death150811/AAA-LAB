import type { Project } from "../../types";
import { code, h, insight, note, p, table, tip, ul, warn } from "../../dsl";

export const p07Final: Project = {
  id: "html.p07-final",
  domain: "html",
  order: 7,
  title: "Итоговый проект: двуязычный сайт сети библиотек",
  subtitle: "Сайт производственного качества на русском и английском: контент как данные, взаимные hreflang, доступность WCAG 2.2 AA, строгая CSP, работа без JavaScript и автоматические ворота качества в CI.",
  level: "mastery",
  estimatedHours: 24,
  isFinal: true,
  buildsOn: [
    "html.p01-profile",
    "html.p02-portfolio",
    "html.p03-blog",
    "html.p04-docs",
    "html.p05-product-site",
    "html.p06-accessible-production",
  ],
  topics: [
    "html.document-patterns",
    "html.head-metadata",
    "html.seo-fundamentals",
    "html.open-graph-structured-data",
    "html.landmarks",
    "html.tables-accessibility",
    "html.accessible-forms",
    "html.a11y-fundamentals",
    "html.keyboard-focus",
    "html.global-attributes",
    "html.html-security",
    "html.progressive-enhancement",
    "html.html-performance",
    "html.html-quality",
  ],
  objective:
    "Собрать **целостный сайт**, в котором каждое решение объяснимо и проверяемо: контент хранится как данные, страницы на двух языках собираются из шаблонов, доступность, SEO, безопасность и производительность закреплены автоматическими проверками, а при ошибке CI не пропускает изменение. Это итог всего курса HTML: вы показываете не отдельные приёмы, а **инженерную систему**.",
  scenario: [
    p("Сеть публичных библиотек «Читальня» (организация вымышленная) до сих пор жила на PDF-афишах и странице в соцсети. Директор хочет настоящий сайт: читатели должны находить книги, расписание и события; сайт должен быть доступен слабовидящим и пожилым посетителям, открываться на телефоне в метро и работать на русском и английском — в городе много студентов и гостей."),
    p("Библиотекари не программисты. Они должны добавлять книги и события, **не трогая HTML**, а выпуск правок — не бояться, что что-то сломается. Директор отдельно просит публичное заявление о доступности и уверенность, что сайт не нарушит требования законодательства и не пропадёт из поисковой выдачи после переезда."),
    p("Вам предстоит довести до конца весь путь: от структуры данных до заявления о доступности. Результат — репозиторий, который любой разработчик может склонировать и выполнить `npm ci && npm run verify`, получив зелёный отчёт."),
    note("Название, адреса, авторы книг и контакты вымышлены; домен — зарезервированный `chitalnya.example`. Вы можете выбрать другую тему (музей, школа, кооператив) при условии сохранения объёма и всех требований."),
  ],
  requirements: [
    "Не менее **10 страниц на каждый язык** (русский и английский): главная, каталог (таблица), не менее трёх страниц книг, события, «О библиотеках» с адресами и часами работы, запись в библиотеку (форма), новости (список и статья), заявление о доступности, политика конфиденциальности, страница `404`.",
    "**Контент как данные:** страницы собираются генератором из шаблонов и данных (`data`); библиотекарь добавляет книгу или событие, правя только файл данных. Копирования оболочки между страницами нет.",
    "**Двуязычность:** корректный `lang` у `html` и у иноязычных фрагментов, взаимные `hreflang` (включая `x-default`), переключатель языка, ведущий на **эквивалентную** страницу, `lang` и `hreflang` у ссылки переключателя, `sitemap.xml` с альтернативами.",
    "**Доступность WCAG 2.2 AA:** ориентиры, правильная иерархия заголовков, ссылка-пропуск, видимый фокус, доступные формы и таблицы, контраст, reflow на 320 px, масштаб текста до 200 %, поддержка `prefers-reduced-motion` и `forced-colors`.",
    "**SEO и метаданные:** уникальные `title` и `description` на каждом языке, самоссылающийся абсолютный `canonical`, Open Graph, структурированные данные (`Library`, `Book`, `Event`, `BreadcrumbList`), `robots.txt`, `noindex` на служебных страницах.",
    "**Формы:** «Запись в библиотеку» с метками, `autocomplete`, `required`, серверными ошибками (сводка и связь с полями), защитой от CSRF на стороне сервера и работой без JavaScript; все тексты формы переведены.",
    "**Производительность:** бюджеты (LCP ≤ 2,5 с, CLS ≤ 0,1, TBT ≤ 200 мс), изображения с `width`/`height`, `srcset` и `sizes`, `fetchpriority` у главного изображения, шрифты со своего origin, отсутствие блокирующих скриптов.",
    "**Безопасность:** CSP без `unsafe-inline`, заголовки безопасности, `rel=\"noopener noreferrer\"` у внешних ссылок, SRI у внешних ресурсов (если они есть), экранирование данных при генерации страниц и JSON-LD.",
    "**Прогрессивное улучшение:** все сценарии работают без JavaScript; если скрипт есть, он необязателен и занимает не более 3 КБ.",
    "**Автоматические ворота качества:** валидатор HTML, скрипт проверки консистентности (`check`), тесты Playwright + axe по всем адресам из `sitemap.xml`, Lighthouse CI с бюджетами; CI блокирует слияние при падении любого шага.",
    "**Документация:** README (как добавить страницу, книгу, язык и как выпустить правку), заявление о доступности, решения по архитектуре (ADR), результаты ручной проверки (клавиатура, скринридер, масштаб).",
    "**Доказательство защиты:** для каждого класса ошибок, который ловит `check`, показать «красный» прогон на намеренно испорченной копии сайта (мутационные проверки).",
  ],
  constraints: [
    "Без CSS-фреймворков и клиентских UI-библиотек; без `style=\"…\"` и `on*`-обработчиков в разметке; один файл стилей.",
    "Никаких «заплаток» ARIA вместо нативного HTML: если есть `button`, `a`, `label`, `table`, `nav`, используйте их.",
    "Контент правдоподобный и полный: никаких «Lorem ipsum» и страниц-заглушек. Реальные организации и персональные данные не используются.",
    "Все отступления от стандарта (отключённые правила, исключения из проверок) записываются в ADR с причиной и сроком пересмотра.",
    "Сборка воспроизводима: `npm ci && npm run verify` проходит на чистой машине без ручных шагов.",
    "Зависимости — только для сборки и проверок; в браузер не попадает ни одной сторонней библиотеки.",
  ],
  expected: [
    "Любую страницу можно открыть, прочитать и использовать клавиатурой, скринридером, на телефоне и без JavaScript.",
    "Поисковая система видит для каждой пары страниц корректные взаимные `hreflang`, один канонический адрес и актуальный `sitemap.xml`.",
    "Библиотекарь добавляет книгу правкой данных и получает новую страницу на двух языках, попавшую в каталог, `sitemap.xml` и проверки автоматически.",
    "Попытка слить изменение, ломающее доступность, ссылки, `hreflang` или CSP, завершается красным CI.",
    "Заявление о доступности честно описывает, что проверено, что известно как ограничение и как сообщить о проблеме.",
  ],
  technical: [
    "Структура: `src/data.mjs` (контент), `src/pages.mjs` (определения страниц), `src/assets/` (стили, значки, шрифты), `src/_headers`, `build.mjs`, `check.mjs`, `tests/`, `.github/workflows/`, `.htmlvalidate.json`, `lighthouserc.json`, `README.md`, `docs/adr/`.",
    "Адреса «чистые», корневые: `/catalog/` и `/en/catalog/`; русский язык на корне, английский под префиксом `/en/`; `404.html` на каждом языке.",
    "Метаданные и `hreflang` генерируются из одной структуры данных, поэтому HTML и `sitemap.xml` не могут разойтись; `check` дополнительно проверяет взаимность связей.",
    "Целевые бюджеты Lighthouse (мобильный профиль): производительность ≥ 0,9; доступность, Best Practices, SEO ≥ 0,95; `404` исключена из проверки SEO, так как намеренно закрыта от индексации.",
    "Порядок разработки: **данные → шаблон → страницы → проверки → ручная проверка → документация → выпуск**; проверки подключаются раньше контента, а не после.",
  ],
  acceptance: [
    "`npm ci && npm run verify` завершается успешно: сборка, `check`, валидатор HTML, тесты Playwright + axe по всем страницам.",
    "Не менее 10 страниц на язык; у каждой пары есть взаимные `hreflang`, самоссылающийся `canonical` и запись в `sitemap.xml`; `404` имеет `noindex` и отсутствует в карте сайта.",
    "На всех страницах нет нарушений `axe` (WCAG 2.2 AA и best-practice) и горизонтальной прокрутки на 320 px; таблицы данных, превышающие ширину, прокручиваются в фокусируемой области с именем.",
    "Форма записи работает без JavaScript, возвращает ошибки со сводкой и связью с полями, сохраняет введённое и переведена на оба языка.",
    "CSP не содержит `unsafe-inline`; в разметке нет `style=` и `on*`; внешние ссылки имеют `rel`; JSON-LD экранирует `<`.",
    "Lighthouse CI на всех индексируемых страницах: производительность ≥ 0,9, остальные категории ≥ 0,95, LCP ≤ 2,5 с, CLS ≤ 0,1.",
    "Мутационные проверки показывают красный результат для каждого класса ошибок: `hreflang`, `canonical`, дубль `title`, инлайн-стили, битая ссылка, отсутствие пропуска, `noindex` в `sitemap.xml`, изображение без `alt`.",
    "README, ADR и заявление о доступности написаны; результаты ручной проверки (клавиатура, скринридер, масштаб 200 %/400 %) приложены.",
  ],
  hints: [
    "Начните с **модели данных**: какие сущности есть (страница, книга, событие, язык) и что у каждой переводится. Шаблон — это функция «данные и язык → HTML».",
    "Сначала соберите **две страницы** на двух языках и подключите все проверки. Затем добавляйте страницы: каждая новая автоматически проверяется теми же правилами.",
    "Путь страницы для каждого языка храните в данных страницы, а ссылки строите функцией `pathOf(id, lang)`. Так переименование адреса не ломает ссылки.",
    "Для `hreflang` перечисляйте **все** языковые версии, включая саму страницу, и добавьте `x-default`. Связь должна быть взаимной: если A указывает на B, то B указывает на A.",
    "Широкие таблицы оберните в прокручиваемую область с `tabindex=\"0\"` и `aria-label`; без этого `axe` и клавиатура сообщат о недоступной области прокрутки.",
    "Напишите `check` как независимый скрипт, который **не использует** код генератора. Иначе он повторит те же ошибки, что и генератор.",
    "Испортите сайт намеренно (удалите `alt`, добавьте `style`, сломайте ссылку) и убедитесь, что проверки краснеют. Проверка, которая ни разу не падала, ничего не гарантирует.",
    "Lighthouse по умолчанию проверяет не более пяти найденных страниц; параметр `maxAutodiscoverUrls: 0` включает все.",
  ],
  advanced: [
    "Добавьте третий язык (например, татарский или украинский) так, чтобы изменились только данные и список языков, а все проверки продолжили работать.",
    "Реализуйте поиск по каталогу: статическая страница результатов и улучшение через Pagefind или собственный индекс; без JavaScript остаётся ссылка на алфавитный указатель.",
    "Добавьте страницы событий со структурированными данными `Event` и ссылку «Добавить в календарь» (файл `.ics`).",
    "Сгенерируйте уникальные OG-картинки (`satori` или `sharp`) для каждой страницы и каждого языка.",
    "Внедрите CSP в режиме `Report-Only` с отчётами, затем переведите в блокирующий режим.",
    "Настройте автоматический комментарий в pull request с отчётом: нарушения `axe`, диффы `sitemap.xml`, динамика метрик Lighthouse.",
  ],
  failureModes: [
    "**Перевод только текста:** `lang` остался `ru` на английской странице, `canonical` указывает на русскую версию, переключатель ведёт на главную вместо эквивалента.",
    "**Односторонний `hreflang`:** русская страница ссылается на английскую, а обратной ссылки нет — поисковая система игнорирует связь.",
    "**Копирование шаблона:** меню отличается на разных страницах, часть страниц без `canonical` и `description`.",
    "**`noindex`-страница в `sitemap.xml`** или `404` с кодом 200 — противоречивые сигналы.",
    "**Ломающее «улучшение»:** фильтр каталога работает только через JavaScript, без него страница пуста.",
    "**Проверки без красного прогона:** написали `check`, но не убедились, что он ловит ошибки; в CI всегда зелёно, но ничего не защищено.",
    "**Ослабленные пороги:** при первом падении Lighthouse или `axe` бюджеты и правила снижают вместо исправления причины.",
    "**Контент в коде:** тексты вшиты в шаблоны, и библиотекарь вынужден править HTML — ошибки и «залипание» старых данных неизбежны.",
  ],
  rubric: [
    { criterion: "Архитектура и контент как данные", weight: 12, description: "Единая модель данных, шаблоны без копирования, пути и ссылки строятся функциями, воспроизводимая сборка." },
    { criterion: "Семантика и структура", weight: 12, description: "Ориентиры, заголовки, таблицы, списки, `time`, `address`, формы; нативные элементы вместо ARIA-заплаток." },
    { criterion: "Доступность", weight: 18, description: "WCAG 2.2 AA: клавиатура, фокус, контраст, reflow, формы и ошибки, `forced-colors`, ручная проверка со скринридером." },
    { criterion: "Многоязычность и SEO", weight: 15, description: "`lang`, взаимные `hreflang`, `canonical`, `sitemap.xml` с альтернативами, структурированные данные, `noindex`." },
    { criterion: "Производительность", weight: 10, description: "Бюджеты, изображения и шрифты, отсутствие блокирующих ресурсов, результаты Lighthouse на всех страницах." },
    { criterion: "Безопасность и прогрессивное улучшение", weight: 10, description: "Строгая CSP, заголовки, `rel`, экранирование, работа без JavaScript, необязательность скриптов." },
    { criterion: "Автоматизация и CI", weight: 13, description: "Валидатор, `check`, Playwright + axe по sitemap, Lighthouse CI, мутационные проверки, блокировка слияния." },
    { criterion: "Документация и процесс", weight: 10, description: "README, ADR, заявление о доступности, протокол ручной проверки, история коммитов, защита решений." },
  ],
  solution: [
    p("Эталонное решение — **ядро**: семь страниц на два языка плюс страницы `404` (16 файлов) и все инженерные механизмы. Оно намеренно меньше задания: остальные страницы создаются теми же шаблонами, и именно поэтому они автоматически попадают под проверки. Ваша задача — расширить ядро до 10 страниц и добавить форму записи."),

    h("1. Архитектура"),
    p("Данные отделены от шаблонов, а проверки — от генератора. Это три независимых слоя, и каждый можно заменить без переписывания остальных:"),
    table(
      ["Слой", "Файлы", "Ответственность"],
      [
        ["Данные", "`src/data.mjs`", "Названия, меню, книги, события, часы работы; все переводимые строки хранятся парами `ru`/`en`"],
        ["Страницы", "`src/pages.mjs`", "Для каждой страницы: пути на каждом языке, `title`, `description`, JSON-LD, содержимое `main`"],
        ["Генератор", "`build.mjs`", "Оболочка (`head`, пропуск, шапка, переключатель языка, подвал), `hreflang`, `sitemap.xml`, `robots.txt`, копирование ресурсов"],
        ["Проверки", "`check.mjs`, `.htmlvalidate.json`, `tests/`", "Независимый контроль результата: консистентность, валидность, доступность, бюджеты"],
        ["Выпуск", "`.github/workflows/site.yml`, `src/_headers`", "Ворота качества и заголовки безопасности"],
      ],
      "Слои решения",
    ),
    insight("`check.mjs` не импортирует код генератора. Он читает уже **собранные файлы**, как это делает поисковый робот или браузер. Если бы проверка использовала те же функции, что и генератор, она повторяла бы его ошибки и ничего не обнаруживала."),

    h("2. Данные"),
    code(
      "js",
      `
      // Данные сайта: всё, что меняется от страницы к странице и от языка к языку.
      export const site = {
        url: "https://chitalnya.example",
        langs: ["ru", "en"],
        defaultLang: "ru",
        name: { ru: "Читальня", en: "Chitalnya Public Libraries" },
        ui: {
          ru: { skip: "Перейти к содержимому", nav: "Основная", langNav: "Язык", crumbs: "Хлебные крошки", switchTo: "English", rights: "© 2026 Читальня. Публичные библиотеки города." },
          en: { skip: "Skip to content", nav: "Main", langNav: "Language", crumbs: "Breadcrumbs", switchTo: "Русский", rights: "© 2026 Chitalnya Public Libraries." },
        },
        menu: [
          { id: "catalog", label: { ru: "Каталог", en: "Catalog" } },
          { id: "events", label: { ru: "События", en: "Events" } },
          { id: "accessibility", label: { ru: "Доступность", en: "Accessibility" } },
        ],
      };

      export const books = [
        {
          slug: { ru: "karta-chuzhikh-beregov", en: "map-of-foreign-shores" },
          title: { ru: "Карта чужих берегов", en: "A Map of Foreign Shores" },
          author: { ru: "Мария Лесная", en: "Maria Lesnaya" },
          kind: { ru: "Роман", en: "Novel" },
          year: 2019, pages: 320, where: { ru: "Зал 2, стеллаж 14", en: "Hall 2, shelf 14" },
          blurb: {
            ru: "Картограф возвращается в родной порт и обнаруживает, что побережье на её картах не совпадает с настоящим. Роман о памяти и точности.",
            en: "A cartographer returns to her home port and finds that the coastline on her maps no longer matches the real one. A novel about memory and precision.",
          },
        },
        {
          slug: { ru: "tihiy-dom", en: "the-quiet-house" },
          title: { ru: "Тихий дом", en: "The Quiet House" },
          author: { ru: "Пётр Ветров", en: "Pyotr Vetrov" },
          kind: { ru: "Повесть", en: "Novella" },
          year: 2021, pages: 184, where: { ru: "Зал 1, стеллаж 3", en: "Hall 1, shelf 3" },
          blurb: {
            ru: "Семья переезжает в дом, где слышно каждый шаг. Короткая повесть о соседях, звуках и умении слушать.",
            en: "A family moves into a house where every footstep carries. A short novella about neighbours, sounds and the art of listening.",
          },
        },
        {
          slug: { ru: "zimnie-ogni", en: "winter-lights" },
          title: { ru: "Зимние огни", en: "Winter Lights" },
          author: { ru: "Ольга Северная", en: "Olga Severnaya" },
          kind: { ru: "Сборник рассказов", en: "Short stories" },
          year: 2017, pages: 256, where: { ru: "Зал 2, стеллаж 9", en: "Hall 2, shelf 9" },
          blurb: {
            ru: "Двенадцать рассказов о городе в декабре: вокзалы, ночные автобусы и окна, в которых горит свет.",
            en: "Twelve stories about a city in December: railway stations, night buses and windows with the light on.",
          },
        },
      ];

      export const events = [
        { date: "2026-11-12", time: "18:30", title: { ru: "Вечер вслух: читаем «Тихий дом»", en: "Reading aloud: “The Quiet House”" }, place: { ru: "Читальный зал, Центральная библиотека", en: "Reading room, Central Library" } },
        { date: "2026-11-21", time: "12:00", title: { ru: "Мастерская переплёта для начинающих", en: "Bookbinding workshop for beginners" }, place: { ru: "Мастерская, филиал на Речной", en: "Workshop, Riverside branch" } },
        { date: "2026-12-05", time: "16:00", title: { ru: "Встреча с автором: Ольга Северная", en: "Author meeting: Olga Severnaya" }, place: { ru: "Лекторий, Центральная библиотека", en: "Lecture hall, Central Library" } },
      ];

      export const hours = [
        { days: { ru: "Понедельник – пятница", en: "Monday to Friday" }, time: "10:00–20:00" },
        { days: { ru: "Суббота", en: "Saturday" }, time: "11:00–18:00" },
        { days: { ru: "Воскресенье", en: "Sunday" }, time: { ru: "выходной", en: "closed" } },
      ];
      `,
      { filename: "src/data.mjs" },
    ),

    h("3. Страницы"),
    p("Каждая страница — объект с путями на обоих языках. Тексты, зависящие от языка, формируются внутри `main(lang)`; книги порождают страницы автоматически из данных. Заметьте, как таблица каталога оборачивается в прокручиваемую область: это ответ на реальную находку теста reflow (см. раздел 7)."),
    code(
      "js",
      `
      import { site, books, events, hours } from "./data.mjs";

      const date = (iso, lang) =>
        new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

      export const pathOf = (id, lang) => pages.find((p) => p.id === id).path[lang];

      const home = {
        id: "home",
        path: { ru: "/", en: "/en/" },
        title: { ru: "Читальня — публичные библиотеки города", en: "Chitalnya — public libraries of the city" },
        description: {
          ru: "Книги, тихие залы и вечерние встречи в шести районах города. Читательский билет бесплатный.",
          en: "Books, quiet reading rooms and evening events in six districts of the city. A library card is free.",
        },
        jsonld: (lang) => [
          {
            "@context": "https://schema.org",
            "@type": "Library",
            name: site.name[lang],
            url: site.url + home.path[lang],
            description: home.description[lang],
            openingHours: ["Mo-Fr 10:00-20:00", "Sa 11:00-18:00"],
          },
        ],
        main: (lang) => {
          const L = (ru, en) => (lang === "ru" ? ru : en);
          const next = events[0];
          return \`
      <section class="hero">
        <h1>\${home.title[lang]}</h1>
        <p class="lead">\${home.description[lang]}</p>
        <p><a class="button" href="\${pathOf("catalog", lang)}">\${L("Открыть каталог", "Browse the catalog")}</a></p>
      </section>
      <section aria-labelledby="hours-title">
        <h2 id="hours-title">\${L("Часы работы", "Opening hours")}</h2>
        <table>
          <caption>\${L("Центральная библиотека", "Central Library")}</caption>
          <thead><tr><th scope="col">\${L("День", "Day")}</th><th scope="col">\${L("Время", "Time")}</th></tr></thead>
          <tbody>
      \${hours.map((h) => \`      <tr><th scope="row">\${h.days[lang]}</th><td>\${typeof h.time === "string" ? h.time.replace("–", "&#8211;") : h.time[lang]}</td></tr>\`).join("\\n")}
          </tbody>
        </table>
      </section>
      <section aria-labelledby="next-title">
        <h2 id="next-title">\${L("Ближайшее событие", "Next event")}</h2>
        <article>
          <h3>\${next.title[lang]}</h3>
          <p><time datetime="\${next.date}T\${next.time}">\${date(next.date, lang)}, \${next.time}</time> · \${next.place[lang]}</p>
          <p><a href="\${pathOf("events", lang)}">\${L("Все события", "All events")}</a></p>
        </article>
      </section>\`;
        },
      };

      const catalog = {
        id: "catalog",
        path: { ru: "/catalog/", en: "/en/catalog/" },
        title: { ru: "Каталог — Читальня", en: "Catalog — Chitalnya" },
        description: {
          ru: "Подборка книг, которые можно взять в библиотеках «Читальни»: название, автор, год и место на полке.",
          en: "A selection of books you can borrow from Chitalnya libraries: title, author, year and shelf location.",
        },
        main: (lang) => {
          const L = (ru, en) => (lang === "ru" ? ru : en);
          return \`
      <h1>\${L("Каталог", "Catalog")}</h1>
      <p>\${L("Подборка этого месяца. Все книги выдаются на 30 дней.", "This month’s selection. All books are lent for 30 days.")}</p>
      <section class="table-scroll" aria-label="\${L("Книги месяца: таблица", "Books of the month: table")}" tabindex="0">
      <table>
        <caption>\${L("Книги месяца", "Books of the month")}</caption>
        <thead>
          <tr><th scope="col">\${L("Название", "Title")}</th><th scope="col">\${L("Автор", "Author")}</th><th scope="col">\${L("Год", "Year")}</th><th scope="col">\${L("Где искать", "Location")}</th></tr>
        </thead>
        <tbody>
      \${books.map((b) => \`    <tr><th scope="row"><a href="/\${lang === "ru" ? "" : "en/"}catalog/\${b.slug[lang]}/">\${b.title[lang]}</a></th><td>\${b.author[lang]}</td><td>\${b.year}</td><td>\${b.where[lang]}</td></tr>\`).join("\\n")}
        </tbody>
      </table>
      </section>\`;
        },
      };

      const bookPages = books.map((b) => ({
        id: "book-" + b.slug.en,
        path: { ru: "/catalog/" + b.slug.ru + "/", en: "/en/catalog/" + b.slug.en + "/" },
        parent: "catalog",
        name: b.title,
        title: { ru: b.title.ru + " — " + b.author.ru + " — Читальня", en: b.title.en + " — " + b.author.en + " — Chitalnya" },
        description: { ru: b.blurb.ru, en: b.blurb.en },
        jsonld: (lang) => [
          {
            "@context": "https://schema.org",
            "@type": "Book",
            name: b.title[lang],
            author: { "@type": "Person", name: b.author[lang] },
            inLanguage: lang,
            numberOfPages: b.pages,
            datePublished: String(b.year),
          },
        ],
        main: (lang) => {
          const L = (ru, en) => (lang === "ru" ? ru : en);
          return \`
      <article>
        <h1>\${b.title[lang]}</h1>
        <p class="lead">\${b.blurb[lang]}</p>
        <dl>
          <dt>\${L("Автор", "Author")}</dt><dd>\${b.author[lang]}</dd>
          <dt>\${L("Жанр", "Genre")}</dt><dd>\${b.kind[lang]}</dd>
          <dt>\${L("Год издания", "Year")}</dt><dd>\${b.year}</dd>
          <dt>\${L("Страниц", "Pages")}</dt><dd>\${b.pages}</dd>
          <dt>\${L("Где искать", "Location")}</dt><dd>\${b.where[lang]}</dd>
        </dl>
        <p><a href="\${pathOf("catalog", lang)}">\${L("← Вернуться в каталог", "← Back to the catalog")}</a></p>
      </article>\`;
        },
      }));

      const eventsPage = {
        id: "events",
        path: { ru: "/events/", en: "/en/events/" },
        title: { ru: "События — Читальня", en: "Events — Chitalnya" },
        description: {
          ru: "Чтения вслух, мастерские и встречи с авторами в библиотеках «Читальни»: даты, время и места.",
          en: "Readings, workshops and author meetings in Chitalnya libraries: dates, times and venues.",
        },
        main: (lang) => \`
      <h1>\${lang === "ru" ? "События" : "Events"}</h1>
      \${events.map((e) => \`<article>
        <h2>\${e.title[lang]}</h2>
        <p><time datetime="\${e.date}T\${e.time}">\${date(e.date, lang)}, \${e.time}</time></p>
        <p>\${e.place[lang]}</p>
      </article>\`).join("\\n")}\`,
      };

      const accessibility = {
        id: "accessibility",
        path: { ru: "/accessibility/", en: "/en/accessibility/" },
        title: { ru: "Заявление о доступности — Читальня", en: "Accessibility statement — Chitalnya" },
        description: {
          ru: "Что мы делаем для доступности сайта, какие ограничения известны и как сообщить о проблеме.",
          en: "What we do to keep this site accessible, which limitations we know about and how to report a problem.",
        },
        main: (lang) =>
          lang === "ru"
            ? \`
      <h1>Заявление о доступности</h1>
      <p>Мы стремимся, чтобы сайт соответствовал WCAG 2.2 уровня AA. Последняя проверка: <time datetime="2026-10-01">1 октября 2026</time>.</p>
      <h2>Что мы делаем</h2>
      <ul>
        <li>проверяем каждую страницу автоматически при каждом изменении (валидатор HTML, axe, Lighthouse);</li>
        <li>проверяем вручную: клавиатура, увеличение до 400 %, скринридер;</li>
        <li>сайт работает без JavaScript.</li>
      </ul>
      <h2>Известные ограничения</h2>
      <p>Афиши мероприятий в формате PDF, которые вы можете получить в библиотеке, пока не имеют текстовой версии для скринридера. Та же информация всегда есть на странице «События».</p>
      <h2>Сообщить о проблеме</h2>
      <p>Напишите на <a href="mailto:a11y@chitalnya.example">a11y@chitalnya.example</a>: опишите страницу и что не получилось. Мы отвечаем в течение пяти рабочих дней.</p>\`
            : \`
      <h1>Accessibility statement</h1>
      <p>We aim for this site to meet WCAG 2.2 level AA. Last reviewed: <time datetime="2026-10-01">1 October 2026</time>.</p>
      <h2>What we do</h2>
      <ul>
        <li>we check every page automatically on every change (HTML validator, axe, Lighthouse);</li>
        <li>we check manually: keyboard, zoom up to 400%, screen reader;</li>
        <li>the site works without JavaScript.</li>
      </ul>
      <h2>Known limitations</h2>
      <p>Event posters in PDF format available at the library do not yet have a text version for screen readers. The same information is always on the Events page.</p>
      <h2>Report a problem</h2>
      <p>Write to <a href="mailto:a11y@chitalnya.example">a11y@chitalnya.example</a>: describe the page and what went wrong. We reply within five working days.</p>\`,
      };

      const notFound = {
        id: "404",
        indexable: false,
        path: { ru: "/404.html", en: "/en/404.html" },
        title: { ru: "Страница не найдена — Читальня", en: "Page not found — Chitalnya" },
        description: { ru: "Такой страницы нет.", en: "There is no such page." },
        main: (lang) =>
          lang === "ru"
            ? \`<h1>Страница не найдена</h1>\\n<p>Возможно, адрес набран с ошибкой или страница переехала. Начните с <a href="/">главной</a> или откройте <a href="/catalog/">каталог</a>.</p>\`
            : \`<h1>Page not found</h1>\\n<p>The address may be mistyped or the page may have moved. Start from the <a href="/en/">home page</a> or open the <a href="/en/catalog/">catalog</a>.</p>\`,
      };

      export const pages = [home, catalog, ...bookPages, eventsPage, accessibility, notFound];
      `,
      { filename: "src/pages.mjs" },
    ),

    h("4. Генератор"),
    code(
      "js",
      `
      import { cp, mkdir, rm, writeFile } from "node:fs/promises";
      import { dirname, join } from "node:path";
      import { site } from "./src/data.mjs";
      import { pages, pathOf } from "./src/pages.mjs";

      const OUT = "dist";
      const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const abs = (path) => site.url + path;
      const fileFor = (path) => join(OUT, path.endsWith("/") ? path + "index.html" : path);
      const other = (lang) => site.langs.find((l) => l !== lang);

      // JSON-LD: «<» экранируем, чтобы данные не могли закрыть тег script
      const ldScript = (obj) =>
        '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, "\\\\u003c") + "</script>";

      function breadcrumbs(page, lang) {
        if (!page.parent) return null;
        const parent = pages.find((p) => p.id === page.parent);
        return [
          { name: site.name[lang], path: pathOf("home", lang) },
          { name: site.menu.find((m) => m.id === parent.id).label[lang], path: parent.path[lang] },
          { name: page.name[lang], path: page.path[lang] },
        ];
      }

      function layout(page, lang) {
        const ui = site.ui[lang];
        const canonical = abs(page.path[lang]);
        const indexable = page.indexable !== false;

        const head = [
          indexable ? '<link rel="canonical" href="' + canonical + '">' : '<meta name="robots" content="noindex">',
          ...(indexable
            ? [
                ...site.langs.map((l) => '<link rel="alternate" hreflang="' + l + '" href="' + abs(page.path[l]) + '">'),
                '<link rel="alternate" hreflang="x-default" href="' + abs(page.path[site.defaultLang]) + '">',
              ]
            : []),
        ];

        const ld = [...(page.jsonld ? page.jsonld(lang) : [])];
        const crumbs = breadcrumbs(page, lang);
        if (crumbs) {
          ld.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })),
          });
        }

        const menu = site.menu
          .map((m) => {
            const current = m.id === page.id ? ' aria-current="page"' : "";
            return '<li><a href="' + pathOf(m.id, lang) + '"' + current + ">" + esc(m.label[lang]) + "</a></li>";
          })
          .join("");

        const crumbNav = crumbs
          ? '<nav aria-label="' + ui.crumbs + '"><ol class="crumbs">' +
            crumbs.map((c, i) => (i === crumbs.length - 1 ? '<li aria-current="page">' + esc(c.name) + "</li>" : '<li><a href="' + c.path + '">' + esc(c.name) + "</a></li>")).join("") +
            "</ol></nav>\\n"
          : "";

        const ldBlock = ld.map((item) => "\\n  " + ldScript(item)).join("");
        const o = other(lang);
        return \`<!doctype html>
      <html lang="\${lang}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>\${esc(page.title[lang])}</title>
        <meta name="description" content="\${esc(page.description[lang])}">
        \${head.join("\\n  ")}
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="\${esc(site.name[lang])}">
        <meta property="og:title" content="\${esc(page.title[lang])}">
        <meta property="og:description" content="\${esc(page.description[lang])}">
        <meta property="og:url" content="\${canonical}">
        <meta property="og:locale" content="\${lang === "ru" ? "ru_RU" : "en_GB"}">
        <link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
        <link rel="stylesheet" href="/assets/style.css">\${ldBlock}
      </head>
      <body>
        <a class="skip-link" href="#main">\${ui.skip}</a>
        <header class="top">
          <a class="logo" href="\${pathOf("home", lang)}">\${esc(site.name[lang])}</a>
          <nav aria-label="\${ui.nav}"><ul>\${menu}</ul></nav>
          <nav aria-label="\${ui.langNav}"><a href="\${page.path[o]}" lang="\${o}" hreflang="\${o}">\${ui.switchTo}</a></nav>
        </header>
        <main id="main">
      \${crumbNav}\${page.main(lang).trim()}
        </main>
        <footer class="footer"><p>\${ui.rights}</p></footer>
      </body>
      </html>
      \`;
      }

      await rm(OUT, { recursive: true, force: true });
      for (const page of pages) {
        for (const lang of site.langs) {
          const file = fileFor(page.path[lang]);
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, layout(page, lang));
        }
      }

      // Файлы для поисковых систем и хостинга
      const indexable = pages.filter((p) => p.indexable !== false);
      const urls = indexable
        .flatMap((p) =>
          site.langs.map((lang) => {
            const alt = site.langs
              .map((l) => '    <xhtml:link rel="alternate" hreflang="' + l + '" href="' + abs(p.path[l]) + '"/>')
              .join("\\n");
            return "  <url>\\n    <loc>" + abs(p.path[lang]) + "</loc>\\n" + alt + "\\n  </url>";
          }),
        )
        .join("\\n");
      await writeFile(
        join(OUT, "sitemap.xml"),
        '<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\\n' + urls + "\\n</urlset>\\n",
      );
      await writeFile(join(OUT, "robots.txt"), "User-agent: *\\nAllow: /\\n\\nSitemap: " + abs("/sitemap.xml") + "\\n");
      await cp("src/_headers", join(OUT, "_headers"));
      await cp("src/assets", join(OUT, "assets"), { recursive: true });

      console.log("Собрано страниц:", pages.length * site.langs.length);
      `,
      { filename: "build.mjs" },
    ),
    warn("JSON-LD вставляется в `script`, поэтому `JSON.stringify` дополняется заменой `<` на `\\u003c`. Иначе строка `</script>` в данных закрыла бы тег и позволила внедрить разметку."),

    h("5. Стили и заголовки"),
    code(
      "css",
      `
      :root {
        --ink: #1b1f1d;
        --muted: #4d5653;
        --brand: #1f3a34;
        --link: #0b5d4b;
        --focus: #0b57d0;
        --line: #767676;
      }

      body { margin: 0; color: var(--ink); background: #fff; font: 1rem/1.6 system-ui, sans-serif; }
      main, .top, .footer { max-width: 60rem; margin-inline: auto; padding-inline: 1rem; }
      main { padding-block: 1.5rem; }

      a { color: var(--link); text-underline-offset: 0.15em; }
      :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

      .skip-link { position: absolute; left: 0.5rem; top: -4rem; padding: 0.5rem 1rem; background: #fff; z-index: 10; }
      .skip-link:focus { top: 0.5rem; }

      .top { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; align-items: center; padding-block: 0.75rem; border-bottom: 1px solid var(--line); }
      .top ul { display: flex; flex-wrap: wrap; gap: 1rem; margin: 0; padding: 0; list-style: none; }
      .logo { font-weight: 700; color: var(--brand); }
      .top nav:last-child { margin-inline-start: auto; }

      .hero { padding-block: 1rem 2rem; }
      .lead { font-size: 1.125rem; max-width: 40rem; }
      .button { display: inline-block; padding: 0.7rem 1.2rem; background: var(--brand); color: #fff; text-decoration: none; font-weight: 600; }
      .crumbs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0 0 1rem; padding: 0; list-style: none; color: var(--muted); }
      .crumbs li + li::before { content: "/"; margin-inline-end: 0.5rem; }

      table { border-collapse: collapse; }
      .table-scroll { max-width: 100%; overflow-x: auto; }
      caption { padding-bottom: 0.5rem; font-weight: 600; text-align: left; }
      th, td { padding: 0.5rem 0.75rem; border: 1px solid var(--line); text-align: left; vertical-align: top; }
      dt { font-weight: 600; }
      dd { margin: 0 0 0.75rem; }
      article { margin-block: 1rem; }
      .footer { padding-block: 1.5rem; color: var(--muted); }
      `,
      { filename: "src/assets/style.css" },
    ),
    code(
      "text",
      `
      /*
        Content-Security-Policy: default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
        X-Content-Type-Options: nosniff
        Referrer-Policy: strict-origin-when-cross-origin
        Permissions-Policy: camera=(), microphone=(), geolocation=()
      `,
      { filename: "src/_headers" },
    ),
    p("CSP не содержит `unsafe-inline`: стили вынесены в файл, а блок JSON-LD с типом `application/ld+json` не исполняется как скрипт и политикой `script-src` не блокируется. Если на сайте появится форма, оставьте `form-action 'self'`."),

    h("6. Результат сборки"),
    p("Так выглядит собранная страница книги на английском. Обратите внимание на `lang`, взаимные `hreflang`, самоссылающийся `canonical`, `breadcrumb` в JSON-LD и переключатель языка с `lang` и `hreflang`."),
    code(
      "html",
      `
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>The Quiet House — Pyotr Vetrov — Chitalnya</title>
        <meta name="description" content="A family moves into a house where every footstep carries. A short novella about neighbours, sounds and the art of listening.">
        <link rel="canonical" href="https://chitalnya.example/en/catalog/the-quiet-house/">
        <link rel="alternate" hreflang="ru" href="https://chitalnya.example/catalog/tihiy-dom/">
        <link rel="alternate" hreflang="en" href="https://chitalnya.example/en/catalog/the-quiet-house/">
        <link rel="alternate" hreflang="x-default" href="https://chitalnya.example/catalog/tihiy-dom/">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="Chitalnya Public Libraries">
        <meta property="og:title" content="The Quiet House — Pyotr Vetrov — Chitalnya">
        <meta property="og:description" content="A family moves into a house where every footstep carries. A short novella about neighbours, sounds and the art of listening.">
        <meta property="og:url" content="https://chitalnya.example/en/catalog/the-quiet-house/">
        <meta property="og:locale" content="en_GB">
        <link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
        <link rel="stylesheet" href="/assets/style.css">
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"Book","name":"The Quiet House","author":{"@type":"Person","name":"Pyotr Vetrov"},"inLanguage":"en","numberOfPages":184,"datePublished":"2021"}</script>
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Chitalnya Public Libraries","item":"https://chitalnya.example/en/"},{"@type":"ListItem","position":2,"name":"Catalog","item":"https://chitalnya.example/en/catalog/"},{"@type":"ListItem","position":3,"name":"The Quiet House","item":"https://chitalnya.example/en/catalog/the-quiet-house/"}]}</script>
      </head>
      <body>
        <a class="skip-link" href="#main">Skip to content</a>
        <header class="top">
          <a class="logo" href="/en/">Chitalnya Public Libraries</a>
          <nav aria-label="Main"><ul><li><a href="/en/catalog/">Catalog</a></li><li><a href="/en/events/">Events</a></li><li><a href="/en/accessibility/">Accessibility</a></li></ul></nav>
          <nav aria-label="Language"><a href="/catalog/tihiy-dom/" lang="ru" hreflang="ru">Русский</a></nav>
        </header>
        <main id="main">
      <nav aria-label="Breadcrumbs"><ol class="crumbs"><li><a href="/en/">Chitalnya Public Libraries</a></li><li><a href="/en/catalog/">Catalog</a></li><li aria-current="page">The Quiet House</li></ol></nav>
      <article>
        <h1>The Quiet House</h1>
        <p class="lead">A family moves into a house where every footstep carries. A short novella about neighbours, sounds and the art of listening.</p>
        <dl>
          <dt>Author</dt><dd>Pyotr Vetrov</dd>
          <dt>Genre</dt><dd>Novella</dd>
          <dt>Year</dt><dd>2021</dd>
          <dt>Pages</dt><dd>184</dd>
          <dt>Location</dt><dd>Hall 1, shelf 3</dd>
        </dl>
        <p><a href="/en/catalog/">← Back to the catalog</a></p>
      </article>
        </main>
        <footer class="footer"><p>© 2026 Chitalnya Public Libraries.</p></footer>
      </body>
      </html>
      `,
      { filename: "dist/en/catalog/the-quiet-house/index.html" },
    ),

    h("7. Проверка консистентности"),
    code(
      "js",
      `
      import { access, readFile, readdir } from "node:fs/promises";
      import { join } from "node:path";
      import { parseHTML } from "linkedom";

      const DIST = process.argv[2] ?? "dist";
      const ORIGIN = "https://chitalnya.example";
      const errors = [];
      const fail = (where, message) => errors.push(where + ": " + message);

      async function* walk(dir) {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
          const path = join(dir, entry.name);
          if (entry.isDirectory()) yield* walk(path);
          else yield path;
        }
      }

      const exists = (path) => access(path).then(() => true, () => false);
      const urlOf = (file) => "/" + file.slice(DIST.length + 1).replace(/index\\.html$/, "");
      const fileOf = (url) => join(DIST, url.endsWith("/") ? url + "index.html" : url);
      const langOf = (url) => (url.startsWith("/en/") ? "en" : "ru");

      const docs = new Map();
      for await (const file of walk(DIST)) {
        if (file.endsWith(".html")) docs.set(urlOf(file), { file, document: parseHTML(await readFile(file, "utf8")).document });
      }

      const sitemap = await readFile(join(DIST, "sitemap.xml"), "utf8");
      const locs = [...sitemap.matchAll(/<loc>([^<]+)<\\/loc>/g)].map((m) => m[1]);
      const titles = { ru: new Map(), en: new Map() };

      for (const [url, { file, document }] of docs) {
        const lang = langOf(url);
        const noindex = Boolean(document.querySelector('meta[name="robots"][content~="noindex"]'));

        // Язык и заголовки
        if (document.documentElement.getAttribute("lang") !== lang) fail(file, "lang не совпадает с разделом сайта (" + lang + ")");
        const h1 = document.querySelectorAll("h1").length;
        if (h1 !== 1) fail(file, "ожидался один h1, найдено " + h1);

        // Метаданные
        const title = document.title.trim();
        if (!title) fail(file, "пустой title");
        else if (!noindex) {
          if (titles[lang].has(title)) fail(file, "title повторяется на " + titles[lang].get(title));
          titles[lang].set(title, url);
        }
        if (!document.querySelector('meta[name="description"]')?.getAttribute("content")) fail(file, "нет meta description");

        // Canonical, hreflang и sitemap
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
        const inSitemap = locs.includes(ORIGIN + url);
        if (noindex) {
          if (canonical) fail(file, "страница с noindex не должна иметь canonical");
          if (inSitemap) fail(file, "страница с noindex попала в sitemap.xml");
        } else {
          if (canonical !== ORIGIN + url) fail(file, "canonical должен быть " + ORIGIN + url + ", а не " + canonical);
          if (!inSitemap) fail(file, "индексируемая страница отсутствует в sitemap.xml");
          const alternates = new Map(
            [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [l.getAttribute("hreflang"), l.getAttribute("href")]),
          );
          for (const need of ["ru", "en", "x-default"]) if (!alternates.has(need)) fail(file, "нет hreflang=" + need);
          if (alternates.get(lang) !== ORIGIN + url) fail(file, "hreflang=" + lang + " должен указывать на саму страницу");
          for (const [code, href] of [...alternates].filter(([, h], i, all) => all.findIndex(([, x]) => x === h) === i)) {
            const target = docs.get(href.replace(ORIGIN, ""));
            if (!target) {
              fail(file, "hreflang=" + code + " ведёт на несуществующую страницу " + href);
              continue;
            }
            const back = [...target.document.querySelectorAll('link[rel="alternate"][hreflang]')].some((l) => l.getAttribute("href") === ORIGIN + url);
            if (!back) fail(file, "страница " + href + " не ссылается обратно через hreflang (связь должна быть взаимной)");
          }
        }

        // Структура и доступность
        const firstLink = document.querySelector("body a[href]");
        if (firstLink?.getAttribute("href") !== "#main" || !document.getElementById("main")) fail(file, "первой в body должна быть ссылка-пропуск на #main");
        if (document.querySelectorAll("main").length !== 1) fail(file, "ожидался один main");
        for (const nav of document.querySelectorAll("nav")) if (!nav.getAttribute("aria-label")) fail(file, "nav без aria-label");
        if (!document.querySelector("header a[hreflang][lang]")) fail(file, "нет переключателя языка с lang и hreflang");
        for (const img of document.querySelectorAll("img")) {
          if (!img.hasAttribute("alt")) fail(file, "img без alt: " + img.getAttribute("src"));
          if (!img.getAttribute("width") || !img.getAttribute("height")) fail(file, "img без width/height: " + img.getAttribute("src"));
        }
        const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
        for (const id of new Set(ids.filter((v, i) => ids.indexOf(v) !== i))) fail(file, "повторяющийся id=" + id);

        // Готовность к строгой CSP и безопасность
        if (document.querySelector("[style], style")) fail(file, "инлайн-стили несовместимы с CSP (style-src 'self')");
        for (const el of document.querySelectorAll("*")) {
          for (const name of el.getAttributeNames()) if (/^on/i.test(name)) fail(file, "обработчик " + name + " в разметке");
        }
        for (const s of document.querySelectorAll('script:not([type="application/ld+json"])')) {
          if (!(s.getAttribute("src") ?? "").startsWith("/")) fail(file, "скрипт не с собственного origin");
        }
        for (const a of document.querySelectorAll('a[target="_blank"]')) {
          if (!/noopener/.test(a.getAttribute("rel") ?? "")) fail(file, "target=_blank без rel=noopener");
        }

        // Структурированные данные
        for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
          try {
            const data = JSON.parse(s.textContent);
            if (!data["@context"] || !data["@type"]) fail(file, "JSON-LD без @context или @type");
          } catch {
            fail(file, "JSON-LD не разбирается как JSON");
          }
        }

        // Ссылки
        for (const a of document.querySelectorAll("a[href]")) {
          const href = a.getAttribute("href");
          if (/^(https?:|mailto:|tel:)/.test(href)) continue;
          if (href.startsWith("#")) {
            if (!document.getElementById(href.slice(1))) fail(file, "ссылка на несуществующий якорь " + href);
            continue;
          }
          const path = href.split("#")[0];
          if (!path.startsWith("/")) fail(file, "относительная ссылка " + href + ": используйте корневые пути");
          else if (!(await exists(fileOf(path)))) fail(file, "битая ссылка " + href);
        }
      }

      // Файлы уровня сайта
      const headers = await readFile(join(DIST, "_headers"), "utf8");
      for (const name of ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy"]) {
        if (!headers.includes(name)) fail("_headers", "нет заголовка " + name);
      }
      const robots = await readFile(join(DIST, "robots.txt"), "utf8");
      if (!robots.includes("Sitemap: " + ORIGIN + "/sitemap.xml")) fail("robots.txt", "нет ссылки на sitemap.xml");

      if (errors.length) {
        console.error(errors.join("\\n"));
        console.error("\\nПроверка не пройдена: " + errors.length);
        process.exit(1);
      }
      console.log("Проверено страниц: " + docs.size + ". Нарушений нет.");
      `,
      { filename: "check.mjs" },
    ),
    p("Скрипт проверяет итоговые файлы более чем по двадцати правилам. Чтобы доказать, что они работают, испортите копию сайта и запустите проверку. В нашем стенде семь намеренных повреждений дали одиннадцать сообщений об ошибках:"),
    table(
      ["Что испортили", "Что сообщила проверка"],
      [
        ["Убрали `hreflang=\"en\"` с русской страницы событий", "«нет hreflang=en» и «страница не ссылается обратно через hreflang»"],
        ["Вставили `style` и `onclick` в заголовок каталога", "«инлайн-стили несовместимы с CSP» и «обработчик onclick в разметке»"],
        ["Дали английской странице событий `title` каталога", "«title повторяется на /en/catalog/»"],
        ["Добавили `img` без `alt` и ссылку на несуществующую страницу", "«img без alt», «img без width/height», «битая ссылка /nope/»"],
        ["Удалили ссылку-пропуск с английской главной", "«первой в body должна быть ссылка-пропуск на #main»"],
        ["Указали у книги `canonical` на каталог", "«canonical должен быть …/catalog/tihiy-dom/»"],
        ["Добавили `404.html` в `sitemap.xml`", "«страница с noindex попала в sitemap.xml»"],
      ],
      "Мутационные проверки",
    ),

    h("8. Тесты Playwright и axe"),
    code(
      "js",
      `
      import { readFile } from "node:fs/promises";
      import { test, expect } from "@playwright/test";
      import AxeBuilder from "@axe-core/playwright";

      // Все адреса берём из sitemap.xml, чтобы новая страница попадала под проверку автоматически
      const sitemap = await readFile("dist/sitemap.xml", "utf8");
      const paths = [...sitemap.matchAll(/<loc>https:\\/\\/chitalnya\\.example([^<]*)<\\/loc>/g)].map((m) => m[1]);
      paths.push("/404.html", "/en/404.html"); // служебные страницы вне sitemap тоже должны быть доступны

      for (const path of paths) {
        test("доступность и reflow: " + path, async ({ page }) => {
          await page.setViewportSize({ width: 320, height: 640 });
          await page.goto(path);

          const { violations } = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
            .analyze();
          const report = violations.map((v) => v.id + " (" + v.impact + "): " + v.nodes.map((n) => n.target.join(" ")).join("; "));
          expect(report, report.join("\\n")).toEqual([]);

          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, "горизонтальная прокрутка на 320 px").toBeLessThanOrEqual(0);
        });
      }

      test("переключатель языка ведёт на эквивалентную страницу", async ({ page }) => {
        await page.goto("/catalog/tihiy-dom/");
        await page.getByRole("link", { name: "English" }).click();
        await expect(page).toHaveURL("/en/catalog/the-quiet-house/");
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        await page.getByRole("link", { name: "Русский" }).click();
        await expect(page).toHaveURL("/catalog/tihiy-dom/");
      });

      test("первый Tab — ссылка-пропуск, Enter переводит фокус к основному содержимому", async ({ page }) => {
        await page.goto("/");
        await page.keyboard.press("Tab");
        const skip = page.getByRole("link", { name: "Перейти к содержимому" });
        await expect(skip).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/#main$/);
      });

      test.describe("без JavaScript", () => {
        test.use({ javaScriptEnabled: false });

        test("каталог читается и ведёт на страницу книги", async ({ page }) => {
          await page.goto("/catalog/");
          await page.getByRole("link", { name: "Тихий дом" }).click();
          await expect(page.getByRole("heading", { level: 1, name: "Тихий дом" })).toBeVisible();
        });
      });
      `,
      { filename: "tests/site.spec.mjs" },
    ),
    code(
      "js",
      `
      import { defineConfig } from "@playwright/test";

      export default defineConfig({
        testDir: "tests",
        webServer: {
          command: "npx http-server dist -p 4173 -s",
          url: "http://localhost:4173",
          reuseExistingServer: !process.env.CI,
        },
        use: { baseURL: "http://localhost:4173" },
      });
      `,
      { filename: "playwright.config.mjs" },
    ),
    note("Адреса берутся из `sitemap.xml`, поэтому новая страница попадает под проверку без правки теста. При первом запуске тест reflow **упал на каталоге**: таблица из четырёх столбцов не помещалась на 320 px. Исправление — обернуть её в `section` с `tabindex=\"0\"` и `aria-label` и разрешить внутри `overflow-x: auto`. Это разрешено критерием 1.4.10, который допускает двумерную прокрутку для таблиц данных."),

    h("9. Валидатор, Lighthouse и CI"),
    code(
      "json",
      `
      {
        "root": true,
        "extends": ["html-validate:recommended", "html-validate:document"],
        "rules": {
          "doctype-style": "off",
          "no-inline-style": "error",
          "require-sri": ["error", { "target": "crossorigin" }]
        }
      }
      `,
      { filename: ".htmlvalidate.json" },
    ),
    code(
      "json",
      `
      {
        "ci": {
          "collect": {
            "staticDistDir": "./dist",
            "staticDirFileDiscoveryDepth": 4,
            "maxAutodiscoverUrls": 0,
            "numberOfRuns": 3
          },
          "assert": {
            "assertMatrix": [
              {
                "matchingUrlPattern": ".*",
                "assertions": {
                  "categories:performance": ["error", { "minScore": 0.9 }],
                  "categories:accessibility": ["error", { "minScore": 0.95 }],
                  "categories:best-practices": ["error", { "minScore": 0.95 }],
                  "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
                  "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
                  "total-blocking-time": ["warn", { "maxNumericValue": 200 }],
                  "resource-summary:script:size": ["error", { "maxNumericValue": 0 }]
                }
              },
              {
                "matchingUrlPattern": "^(?!.*404).*$",
                "assertions": {
                  "categories:seo": ["error", { "minScore": 0.95 }]
                }
              }
            ]
          }
        }
      }
      `,
      { filename: "lighthouserc.json" },
    ),
    p("Два параметра Lighthouse CI не очевидны. `staticDirFileDiscoveryDepth` определяет, насколько глубоко искать страницы в каталоге, а `maxAutodiscoverUrls: 0` отключает ограничение в пять случайных страниц. Без них проверялась бы лишь часть сайта. `assertMatrix` исключает `404` из проверки SEO: страница намеренно закрыта `noindex`, и Lighthouse справедливо сообщает, что она не индексируется."),
    code(
      "json",
      `
      {
        "name": "chitalnya-site",
        "private": true,
        "type": "module",
        "scripts": {
          "build": "node build.mjs",
          "check": "node check.mjs",
          "lint:html": "html-validate \\"dist/**/*.html\\"",
          "serve": "http-server dist -p 4173 -s",
          "test": "playwright test",
          "lhci": "lhci autorun",
          "verify": "npm run build && npm run check && npm run lint:html && npm run test"
        },
        "devDependencies": {
          "@axe-core/playwright": "^4.13.0",
          "@lhci/cli": "^0.15.1",
          "@playwright/test": "^1.63.0",
          "html-validate": "^11.16.2",
          "http-server": "^14.1.1",
          "linkedom": "^0.18.13"
        }
      }
      `,
      { filename: "package.json" },
    ),
    code(
      "yaml",
      `
      name: site

      on:
        pull_request:
        push:
          branches: [main]

      jobs:
        verify:
          runs-on: ubuntu-latest
          timeout-minutes: 20
          steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                node-version: 22
                cache: npm
            - run: npm ci

            - name: Сборка
              run: npm run build

            - name: Проверка консистентности (hreflang, canonical, sitemap, CSP-готовность)
              run: npm run check

            - name: Валидатор HTML
              run: npm run lint:html

            - name: Доступность и reflow по всем страницам из sitemap
              run: |
                npx playwright install --with-deps chromium
                npm test
              env:
                CI: "true"

            - name: Lighthouse CI (бюджеты)
              run: npm run lhci
      `,
      { filename: ".github/workflows/site.yml" },
    ),
    p("В нашем стенде на всех 16 страницах получено: производительность, доступность и Best Practices — 1,0; SEO — 1,0 на индексируемых страницах и 0,63 на `404` (ожидаемо из-за `noindex`). Все 19 тестов Playwright проходят."),

    h("10. Что нужно добавить до полного задания"),
    ul(
      "**«О библиотеках»:** адреса в `address`, часы работы в таблице, карта в `iframe` с `title` или ссылка на карту.",
      "**Запись в библиотеку:** форма с `autocomplete`, серверными ошибками и защитой от CSRF (по образцу проекта 4); переведите все сообщения.",
      "**Новости:** список статей и страница статьи с `article`, `time` и структурированными данными `NewsArticle`.",
      "**Политика конфиденциальности:** структурированный документ с оглавлением и датой редакции.",
      "**Изображения:** обложки с `width`, `height`, `srcset` и осмысленным `alt`; главное изображение с `fetchpriority=\"high\"`.",
      "**Open Graph:** изображения 1200×630 для каждого языка и `og:locale:alternate`.",
      "**ADR:** записи о решениях (почему свой генератор, почему русский на корне, почему и `hreflang` в `head`, и в `sitemap.xml`).",
    ),
    tip("Для `hreflang` достаточно любого одного способа: `link` в `head`, заголовок HTTP или `sitemap.xml`. Здесь используются два, потому что оба формируются из одной структуры данных и разойтись не могут, а `check` проверяет взаимность связей."),

    h("11. Ворота выпуска"),
    table(
      ["Ворота", "Инструмент", "Блокирует слияние"],
      [
        ["Сборка воспроизводима", "`npm ci && npm run build`", "Да"],
        ["Консистентность", "`npm run check`", "Да"],
        ["Валидность HTML", "`html-validate`", "Да"],
        ["Доступность и reflow", "Playwright + axe", "Да"],
        ["Производительность, SEO, Best Practices", "Lighthouse CI", "Да"],
        ["Ручная проверка: клавиатура, скринридер, масштаб", "Протокол в `docs/`", "Перед релизом (чек-лист)"],
        ["Обновлено заявление о доступности", "Дата в `time`, список ограничений", "Перед релизом (чек-лист)"],
      ],
      "Определение готовности",
    ),

    h("12. Шаблон ADR"),
    code(
      "text",
      `
      # ADR-003. Русский язык на корне, английский под /en/

      Статус: принято · Дата: 2026-10-05

      ## Контекст
      Основная аудитория говорит по-русски; английская версия нужна гостям города.

      ## Решение
      Русские страницы живут на корне (/catalog/), английские — под префиксом (/en/catalog/).
      x-default указывает на русскую версию.

      ## Последствия
      + Сохраняются существующие адреса и внешние ссылки.
      + Добавление языка не меняет адреса других языков.
      − Ссылки на английские страницы нельзя построить без знания языка: используем pathOf(id, lang).

      ## Пересмотр
      При появлении третьего языка оценить префиксы для всех языков.
      `,
      { filename: "docs/adr/003-language-paths.md" },
    ),
  ],
};
