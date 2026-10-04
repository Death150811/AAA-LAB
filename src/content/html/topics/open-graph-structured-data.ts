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

export const openGraphStructuredData: Topic = {
  id: "html.open-graph-structured-data",
  slug: "open-graph-structured-data",
  domain: "html",
  module: "metadata",
  title: "Open Graph и структурированные данные",
  titleEn: "Open Graph, social cards, schema.org and JSON-LD",
  summary:
    "Ссылку на ваш сайт увидят в мессенджерах, соцсетях и выдаче поисковика — и то, как она выглядит, задаёт разметка. Тема учит оформлять карточки (Open Graph, Twitter/X Cards) и описывать содержимое для машин языком schema.org в формате JSON-LD, а также проверять и защищать такую разметку.",
  minutes: 50,
  prerequisites: ["html.head-metadata", "html.seo-fundamentals"],
  tags: ["Open Graph", "og:title", "og:image", "twitter:card", "link preview", "schema.org", "JSON-LD", "microdata", "RDFa", "rich results", "structured data", "Product", "Article", "BreadcrumbList"],
  keyConcepts: [
    { term: "Open Graph", text: "Набор `<meta property=\"og:*\">`, по которому соцсети и мессенджеры строят **карточку ссылки**: заголовок, описание, картинка." },
    { term: "Структурированные данные", text: "Описание сущностей страницы (статья, товар, организация) словарём **schema.org**; основной формат — JSON-LD." },
    { term: "Боты не исполняют JS", text: "Сервисы превью обычно читают исходный HTML. Метаданные должны приходить с сервера." },
    { term: "Разметка = видимый контент", text: "Структурированные данные должны соответствовать тому, что видит пользователь. Скрытая или ложная разметка нарушает правила." },
    { term: "JSON-LD — это код на странице", text: "Данные пользователя внутри `<script>` нужно экранировать, иначе возможна XSS-инъекция." },
  ],
  sections: [
    section("definition", [
      def("Open Graph", "Протокол метаданных, придуманный Facebook, а теперь используемый почти всеми сервисами, где публикуют ссылки. Свойства задаются элементами `<meta property=\"og:…\" content=\"…\">` в `head`.", "Open Graph protocol"),
      def("schema.org", "Общий словарь типов и свойств для описания сущностей (статьи, товары, организации, события, рецепты). Разметка на его основе позволяет поисковикам понимать содержимое и показывать расширенные результаты.", "schema.org vocabulary"),
      def("JSON-LD", "JSON for Linked Data: способ записать структурированные данные как JSON-объект внутри `<script type=\"application/ld+json\">`. Рекомендуемый поисковиками формат; альтернативы — Microdata и RDFa.", "JSON-LD"),
    ]),

    section("why", [
      h("Первое впечатление от ссылки"),
      p("Ссылка в чате без карточки — голый URL, который никому не хочется открывать. Со **своей** картинкой, заголовком и описанием она выглядит как полноценный материал и получает больше переходов. Вы не контролируете, где будут делиться страницей, но можете контролировать, **как она будет выглядеть**."),
      h("Машинное понимание вместо угадывания"),
      p("Поисковик видит текст «5 990 ₽» и должен догадаться, что это цена товара, а «4,7 из 5» — рейтинг. Структурированные данные отвечают на вопрос явно: «это Product, цена 5990, валюта RUB, рейтинг 4.7 по 128 отзывам». Взамен страница может получить расширенный сниппет (цена, рейтинг, наличие, хлебные крошки, даты) — он заметнее и кликабельнее."),
      h("Две аудитории, один принцип"),
      ul(
        "**Соцсети и мессенджеры** → Open Graph и Twitter/X Cards.",
        "**Поисковики** → schema.org (JSON-LD).",
        "**Оба** используют только исходный HTML, а не то, что построил браузер после запуска скриптов.",
      ),
      insight("Структурированные данные не повышают позиции магически: они дают **право** на расширенный вид сниппета и помогают машине правильно понять страницу. Но только при честной и корректной разметке."),
    ]),

    section("mental-model", [
      p("Представьте **визитку и техпаспорт**. Open Graph — визитка: красиво и коротко представляет страницу при «знакомстве» в ленте. Schema.org — техпаспорт: точный перечень характеристик (что это, кто автор, сколько стоит, когда опубликовано), по которому её может принять машина."),
      diagram(
        `
        страница  ──►  <meta property="og:*">         ─►  карточка в Telegram, VK, Slack, LinkedIn, WhatsApp…
           │
           ├──────►  <meta name="twitter:*">         ─►  карточка в X (Twitter)
           │
           └──────►  <script type="application/ld+json">
                                                     ─►  расширенный сниппет в поиске (цена, рейтинг, крошки…)
        `,
        "Кто читает какие метаданные",
      ),
      table(
        ["Формат", "Где", "Для чего", "Пример"],
        [
          ["Open Graph", "`<meta property>` в `head`", "Карточки ссылок в соцсетях и мессенджерах", "`og:title`, `og:image`"],
          ["Twitter/X Cards", "`<meta name=\"twitter:*\">`", "Тип карточки в X; остальное берётся из OG", "`twitter:card`"],
          ["JSON-LD", "`<script type=\"application/ld+json\">`", "Структурированные данные для поисковиков", "`{\"@type\":\"Product\"}`"],
          ["Microdata", "Атрибуты `itemscope`, `itemtype`, `itemprop` в разметке", "То же, но внутри видимых элементов", "`<span itemprop=\"price\">`"],
          ["RDFa", "Атрибуты `vocab`, `typeof`, `property`", "То же; `property` используется и в OG", "`<meta property=\"og:title\">`"],
        ],
        "Форматы метаданных",
      ),
    ]),

    section("technical", [
      h("Open Graph: основные свойства"),
      table(
        ["Свойство", "Смысл", "Рекомендации"],
        [
          ["`og:title`", "Заголовок карточки", "Короче `<title>`, без названия сайта; 40–70 символов"],
          ["`og:description`", "Описание", "1–2 предложения, до ≈200 символов"],
          ["`og:image`", "Картинка", "**Абсолютный** HTTPS-URL, публично доступный, ≈1200×630 (1,91:1), JPEG/PNG/WebP, лучше до 1 МБ"],
          ["`og:image:alt`", "Альтернативный текст картинки", "Описание содержимого картинки"],
          ["`og:image:width`, `og:image:height`", "Размеры", "Ускоряют показ, не заставляют бота скачивать картинку для определения размера"],
          ["`og:url`", "Канонический URL страницы", "Совпадает с `canonical`"],
          ["`og:type`", "Тип объекта", "`website` (по умолчанию), `article`, `product`, `profile`…"],
          ["`og:site_name`", "Название сайта", "Бренд"],
          ["`og:locale`", "Язык и регион", "`ru_RU`, `en_US` (с подчёркиванием)"],
        ],
      ),
      code(
        "html",
        `
        <meta property="og:type" content="article">
        <meta property="og:site_name" content="Студия «Код»">
        <meta property="og:title" content="Как выбрать ноутбук для программирования">
        <meta property="og:description" content="Процессор, память, экран и клавиатура: что действительно важно.">
        <meta property="og:url" content="https://example.com/blog/laptop">
        <meta property="og:image" content="https://example.com/img/og/laptop.jpg">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="Ноутбук с кодом на экране рядом с чашкой кофе">
        <meta property="og:locale" content="ru_RU">

        <meta property="article:published_time" content="2026-03-14T10:00:00+03:00">
        <meta property="article:author" content="https://example.com/authors/ivan">

        <meta name="twitter:card" content="summary_large_image">
        `,
        { filename: "open-graph.html" },
      ),
      ul(
        "**`property`, а не `name`:** в Open Graph используется атрибут `property` (RDFa). Многие парсеры принимают и `name`, но стандарт — `property`.",
        "**Twitter/X Cards:** для большой картинки нужен `twitter:card=\"summary_large_image\"`; `twitter:title`, `twitter:description`, `twitter:image` при отсутствии берутся из OG.",
        "**Telegram, VK, WhatsApp, Slack, LinkedIn, Discord** читают Open Graph; у некоторых есть собственные расширения.",
        "**Кэширование:** сервисы запоминают карточку; после изменения нужно запросить обновление в **отладчике** (у Facebook — Sharing Debugger, у LinkedIn — Post Inspector, у Telegram — бот `@WebpageBot`) или сменить URL картинки.",
      ),
      h("Какие требования у ботов превью"),
      ul(
        "Читают **исходный HTML** (без выполнения JavaScript): метаданные должны быть в ответе сервера.",
        "Должны иметь **доступ** к странице и картинке: без авторизации, без блокировки по `User-Agent` и `robots.txt`.",
        "Подгружают картинку по **абсолютному URL** (`https://…`); относительные пути обычно не работают.",
        "Следуют редиректам (но длинные цепочки ухудшают результат).",
        "Приватные страницы (внутренние документы, личные кабинеты) **не должны** отдавать содержательные метаданные публичному боту: заголовок и картинка могут раскрыть данные.",
      ),
      h("schema.org: основы"),
      ul(
        "**Тип (`@type`)** — что описываем (Article, Product, Organization…).",
        "**Свойства** — характеристики типа (`headline`, `author`, `offers`). Значение — строка, число, дата, вложенный объект или ссылка на другой объект по `@id`.",
        "**Иерархия типов:** `NewsArticle` — разновидность `Article`, она — разновидность `CreativeWork`; чем точнее тип, тем лучше.",
        "**Контекст (`@context`)** — `https://schema.org`.",
        "**Не всякий тип даёт расширенный сниппет:** поисковики показывают только поддерживаемые виды (статья, товар, рецепт, событие, вакансия, видео, хлебные крошки и др.); правила и список меняются — сверяйтесь с документацией.",
      ),
      h("Примеры JSON-LD"),
      code(
        "html",
        `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Как выбрать ноутбук для программирования",
          "image": ["https://example.com/img/og/laptop.jpg"],
          "datePublished": "2026-03-14T10:00:00+03:00",
          "dateModified": "2026-03-20T09:30:00+03:00",
          "author": {
            "@type": "Person",
            "name": "Иван Петров",
            "url": "https://example.com/authors/ivan"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Студия «Код»",
            "logo": { "@type": "ImageObject", "url": "https://example.com/logo.png" }
          },
          "mainEntityOfPage": "https://example.com/blog/laptop"
        }
        </script>
        `,
        { lineNumbers: true, filename: "article.jsonld.html" },
      ),
      code(
        "html",
        `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Кроссовки Run",
          "image": "https://example.com/img/run.jpg",
          "description": "Беговые кроссовки с амортизацией, вес 240 г.",
          "sku": "RUN-42",
          "brand": { "@type": "Brand", "name": "Run" },
          "offers": {
            "@type": "Offer",
            "url": "https://example.com/catalog/run",
            "priceCurrency": "RUB",
            "price": "5990",
            "availability": "https://schema.org/InStock"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.7",
            "reviewCount": "128"
          }
        }
        </script>
        `,
        { lineNumbers: true, filename: "product.jsonld.html", collapsed: true },
      ),
      code(
        "html",
        `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://example.com/" },
            { "@type": "ListItem", "position": 2, "name": "Каталог", "item": "https://example.com/catalog" },
            { "@type": "ListItem", "position": 3, "name": "Кроссовки Run" }
          ]
        }
        </script>
        `,
        { filename: "breadcrumbs.jsonld.html", collapsed: true },
      ),
      h("Правила хорошей разметки"),
      ol(
        "**Описывайте то, что видит пользователь.** Нельзя размечать скрытое, ложное или не относящееся к странице содержимое (рейтинг без отзывов, цену, которой нет).",
        "**Используйте точные типы и обязательные свойства** из документации поисковика для нужного расширенного результата.",
        "**Форматы:** даты — ISO 8601 (`2026-03-14T10:00:00+03:00`); цены — число без символа валюты и отдельный `priceCurrency` (ISO 4217, `RUB`); URL — абсолютные.",
        "**Единый источник данных:** значения для видимого текста и JSON-LD генерируйте из одной модели, чтобы они не расходились.",
        "**Связывайте сущности по `@id`:** Организация, сайт, статья и автор образуют граф (`@graph`).",
        "**Проверяйте:** Rich Results Test (Google) показывает доступность расширенных результатов; Schema Markup Validator — корректность по schema.org.",
      ),
      h("JSON-LD и безопасность"),
      warn("Содержимое `<script type=\"application/ld+json\">` — часть HTML-страницы. Если в данные попал пользовательский текст с последовательностью `</script>`, браузер закроет тег раньше времени и выполнит остаток как разметку: это **XSS**. Сериализуйте объект через `JSON.stringify` и заменяйте `<` на `\\u003c` (а также `\\u2028`/`\\u2029` для старых парсеров)."),
      code(
        "js",
        `
        function jsonLd(data) {
          return JSON.stringify(data)
            .replace(/</g, "\\\\u003c")
            .replace(/\\u2028/g, "\\\\u2028")
            .replace(/\\u2029/g, "\\\\u2029");
        }

        const title = 'Привет </script><script>alert(1)</script>';
        const html = '<script type="application/ld+json">' + jsonLd({ "@type": "Article", headline: title }) + "</script>";
        `,
        { filename: "json-ld-escape.js" },
      ),
      h("Microdata и RDFa"),
      p("Microdata размечает данные прямо в видимых элементах: `<div itemscope itemtype=\"https://schema.org/Product\"><span itemprop=\"name\">Кроссовки Run</span>…</div>`. Он хорошо соответствует принципу «данные = видимый текст», но связывает вёрстку с разметкой и сложнее в поддержке. Поисковики по-прежнему рекомендуют JSON-LD как более простой и независимый от вёрстки."),
      h("Что ещё полезно"),
      ul(
        "**`<time datetime>`** для дат публикации в видимом тексте.",
        "**`<link rel=\"alternate\" type=\"application/rss+xml\">`** для автоматического обнаружения ленты.",
        "**Генерация OG-картинок на сервере** (динамическая картинка с заголовком статьи) — популярное решение для блогов; кэшируйте результат.",
        "**`og:image:alt`** — описание картинки для пользователей с ограничениями зрения в сервисах, которые его показывают.",
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <head>
          <meta charset="utf-8">
          <title>Кроссовки Run — купить | Магазин</title>
          <meta name="description" content="Беговые кроссовки Run: лёгкие, с амортизацией.">
          <link rel="canonical" href="https://example.com/catalog/run">

          <meta property="og:type" content="product">
          <meta property="og:title" content="Кроссовки Run">
          <meta property="og:description" content="Беговые кроссовки: 240 г, амортизация, гарантия 1 год.">
          <meta property="og:url" content="https://example.com/catalog/run">
          <meta property="og:image" content="https://example.com/img/og/run.jpg">
          <meta property="og:image:width" content="1200">
          <meta property="og:image:height" content="630">
          <meta property="og:image:alt" content="Синие беговые кроссовки Run на белом фоне">
          <meta property="og:site_name" content="Магазин">
          <meta property="og:locale" content="ru_RU">

          <meta name="twitter:card" content="summary_large_image">

          <script type="application/ld+json">
            { "@context": "https://schema.org", "@type": "Product", "name": "Кроссовки Run" }
          </script>
        </head>
        `,
        { lineNumbers: true, filename: "social-head.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <meta property="og:title" content="Как выбрать ноутбук">
        <meta property="og:description" content="Процессор, память, экран.">
        <meta property="og:image" content="/img/laptop.jpg">
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Как выбрать ноутбук",
          "datePublished": "14.03.2026",
          "author": { "@type": "Person", "name": "Иван Петров" }
        }
        </script>

        <script>
          // Читаем то, что прочитает бот, и проверяем типичные проблемы
          const og = {};
          document.querySelectorAll('meta[property^="og:"]').forEach((m) => { og[m.getAttribute("property")] = m.content; });
          console.log("Карточка:", JSON.stringify(og));
          if (!/^https?:\\/\\//.test(og["og:image"] || "")) console.log("⚠ og:image не абсолютный URL — превью может не показаться");

          for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
            let data;
            try { data = JSON.parse(s.textContent); } catch (e) { console.log("⚠ JSON-LD невалиден:", e.message); continue; }
            console.log("Тип:", data["@type"]);
            if (data["@type"] === "Article") {
              for (const key of ["headline", "image", "datePublished", "author"]) {
                if (!data[key]) console.log("⚠ нет свойства:", key);
              }
              if (data.datePublished && !/^\\d{4}-\\d{2}-\\d{2}/.test(data.datePublished)) console.log("⚠ datePublished не ISO 8601:", data.datePublished);
            }
          }
        </script>
        `,
        { runnable: true },
      ),
      p("Мини-проверка находит три типичные проблемы: относительный `og:image`, дату не в формате ISO 8601 и отсутствие рекомендованного свойства `image`. Настоящие валидаторы (Rich Results Test, Schema Markup Validator) проверяют гораздо больше, но принцип тот же."),
    ]),

    section("detailed-example", [
      p("Страница статьи блога: карточка для соцсетей, JSON-LD со статьёй, автором, издателем и хлебными крошками в одном графе. Объекты связаны по `@id`, а значения генерируются из одной модели данных."),
      code(
        "html",
        `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://example.com/#org",
              "name": "Студия «Код»",
              "url": "https://example.com/",
              "logo": "https://example.com/logo.png"
            },
            {
              "@type": "Person",
              "@id": "https://example.com/authors/ivan#person",
              "name": "Иван Петров",
              "url": "https://example.com/authors/ivan"
            },
            {
              "@type": "BlogPosting",
              "@id": "https://example.com/blog/laptop#article",
              "mainEntityOfPage": "https://example.com/blog/laptop",
              "headline": "Как выбрать ноутбук для программирования",
              "image": ["https://example.com/img/og/laptop.jpg"],
              "datePublished": "2026-03-14T10:00:00+03:00",
              "dateModified": "2026-03-20T09:30:00+03:00",
              "author": { "@id": "https://example.com/authors/ivan#person" },
              "publisher": { "@id": "https://example.com/#org" },
              "inLanguage": "ru"
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://example.com/" },
                { "@type": "ListItem", "position": 2, "name": "Блог", "item": "https://example.com/blog" },
                { "@type": "ListItem", "position": 3, "name": "Как выбрать ноутбук" }
              ]
            }
          ]
        }
        </script>
        `,
        { lineNumbers: true, filename: "graph.jsonld.html", collapsed: true },
      ),
      ul(
        "**`@graph`** собирает несколько сущностей в один блок; ссылки по `@id` исключают дублирование данных об авторе и издателе.",
        "**`BlogPosting`** — уточнение `Article`; для новостей — `NewsArticle`.",
        "**Значения совпадают** с видимыми на странице: заголовок, автор, дата публикации.",
        "**Хлебные крошки** в JSON-LD дублируют видимую навигацию (последний элемент без `item` — текущая страница).",
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <meta property="og:image" content="https://example.com/img/og/laptop.jpg">
        <meta property="og:image:alt" content="Ноутбук рядом с чашкой кофе">
        <meta name="twitter:card" content="summary_large_image">
        <script type="application/ld+json">
        { "@type": "Product", "offers": { "price": "5990", "priceCurrency": "RUB" } }
        </script>
        `,
        [
          { line: 1, text: "Абсолютный HTTPS-URL публичной картинки (≈1200×630). Относительный путь и картинка за авторизацией не загрузятся ботом." },
          { line: 2, text: "Альтернативный текст картинки: полезен там, где сервис его показывает или озвучивает." },
          { line: 3, text: "Тип карточки для X: без него будет маленькая `summary`. Остальные поля X при отсутствии `twitter:*` берёт из OG." },
          { line: 4, text: "JSON-LD размещают в `head` или `body`; поисковик находит его независимо от места. Содержимое — JSON, не JavaScript." },
          { line: 5, text: "Цена — число в строке без символа «₽», валюта — отдельным свойством в формате ISO 4217. Записи вроде «5 990 ₽» в `price` — ошибка." },
        ],
        "social-annotated.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Пользователь вставляет ссылку", "Мессенджер или соцсеть отправляет запрос на ваш сервер, представляясь ботом (`facebookexternalhit`, `TelegramBot`, `Twitterbot`, `LinkedInBot`, `WhatsApp` и др.)."],
          ["Бот получает HTML", "Он читает **исходный HTML ответа** — без выполнения JavaScript. Если метаданные добавляются клиентским кодом, бот их не увидит."],
          ["Разбор метаданных", "Бот ищет `og:*`/`twitter:*`; при их отсутствии использует запасные: `<title>`, `meta description`, первое подходящее изображение. Результат кэшируется на часы и дни."],
          ["Загрузка изображения", "Бот отдельно запрашивает картинку по `og:image`: ему нужны публичный абсолютный URL, подходящие размер и формат, разумное время ответа."],
          ["Показ карточки", "Сервис строит карточку: картинка, заголовок, описание, домен. Если что-то не загрузилось, карточка получается урезанной или пустой."],
          ["Поисковик и JSON-LD", "Поисковый робот извлекает JSON-LD из HTML (в том числе после рендеринга), проверяет типы и обязательные свойства, и решает, показывать ли расширенный сниппет."],
        ],
        "Как работает превью ссылки и разбор структурированных данных",
      ),
      note("Чтобы посмотреть на страницу «глазами бота», выполните запрос с его User-Agent, например `curl -s -A \"facebookexternalhit/1.1\" https://example.com/page | grep og:` — вы увидите именно то, что получит бот."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Метаданные только на клиенте"),
      p("SPA добавляет `og:*` скриптом после загрузки. Боты не выполняют скрипты и показывают пустую или общую карточку для всех страниц. Генерируйте метаданные на сервере (SSR/SSG)."),
      h("Ошибка 2. Относительный URL картинки"),
      wrongRight(
        "html",
        {
          code: `
            <meta property="og:image" content="/img/og/laptop.jpg">
          `,
          note: "Многие боты не разрешают относительные URL относительно страницы, и картинка не показывается.",
        },
        {
          code: `
            <meta property="og:image" content="https://example.com/img/og/laptop.jpg">
          `,
          note: "Абсолютный HTTPS-URL, публично доступный.",
        },
      ),
      h("Ошибка 3. Одна и та же картинка и заголовок на всех страницах"),
      p("Все ссылки в ленте выглядят одинаково. Для статей и товаров генерируйте уникальные `og:title`, `og:description` и `og:image`."),
      h("Ошибка 4. Невалидный JSON-LD"),
      wrongRight(
        "html",
        {
          code: `
            <script type="application/ld+json">
            {
              '@type': 'Product',
              "name": "Кроссовки",
              "price": "5 990 ₽",
              "datePublished": "14.03.2026",
            }
            </script>
          `,
          note: "Одинарные кавычки, лишняя запятая, нет `@context`, цена со знаком валюты, дата не в ISO — разметка не будет разобрана.",
        },
        {
          code: `
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Кроссовки",
              "offers": { "@type": "Offer", "price": "5990", "priceCurrency": "RUB" }
            }
            </script>
          `,
          note: "Строгий JSON, контекст, число и валюта раздельно.",
        },
      ),
      h("Ошибка 5. Разметка, не совпадающая с видимым контентом"),
      p("Рейтинг в JSON-LD без отзывов на странице, цена, которой нет, FAQ, которого пользователь не видит. Это нарушение правил: возможны ручные санкции, потеря расширенного сниппета."),
      h("Ошибка 6. Подстановка пользовательских данных без экранирования"),
      p("Заголовок статьи или имя автора подставляются в JSON-LD строкой. Последовательность `</script>` в данных ломает страницу и открывает XSS. Всегда сериализуйте и экранируйте `<`."),
      h("Ошибка 7. Картинка слишком маленькая или за авторизацией"),
      p("Картинка 100×100 даёт крошечный квадрат или вовсе игнорируется; картинка на закрытом хранилище недоступна боту. Используйте ≈1200×630 на публичном домене."),
      h("Ошибка 8. Не обновили кэш превью"),
      p("Заголовок исправили, но в мессенджере остаётся старая карточка. Запросите обновление через отладчик сервиса либо добавьте параметр версии к URL картинки."),
    ]),

    section("antipatterns", [
      ul(
        "**«Накрутка» рейтингов** и отзывов в разметке ради звёздочек в выдаче.",
        "**Копирование чужого JSON-LD «как есть»,** с чужими названиями, URL и ценами.",
        "**Разметка всего подряд** (`FAQPage` на каждой странице, `HowTo` без шагов): правила расширенных результатов ограничены и меняются.",
        "**Хранение JSON-LD вручную** в тысячах шаблонов: расхождения неизбежны. Генерируйте из модели данных.",
        "**Динамическая смена `og:*` скриптом** для «умных» превью.",
        "**Использование OG-картинки с мелким текстом:** в ленте он нечитабелен.",
        "**Раскрытие приватных данных в превью** (внутренние документы с заголовком, пользовательские страницы).",
        "**Игнорирование проверки:** выпуск изменений без прогона через валидаторы.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Отдавайте `og:*` и JSON-LD в HTML сервера** (SSR/SSG).",
        "**Уникальные `og:title`, `og:description`, `og:image` для каждой страницы;** картинка ≈1200×630, абсолютный HTTPS-URL, `og:image:alt`.",
        "**`og:url` = `canonical`.** `og:type` — по смыслу страницы.",
        "**`twitter:card=\"summary_large_image\"`** для больших карточек в X.",
        "**JSON-LD из одной модели данных** с видимым текстом; ISO 8601 для дат, число и ISO 4217 для цен, абсолютные URL.",
        "**Используйте точные типы** и обязательные свойства для нужного вида расширенных результатов.",
        "**Экранируйте данные** в JSON-LD (`<` → `\\u003c`).",
        "**Проверяйте** в Rich Results Test, Schema Markup Validator и отладчиках соцсетей; автоматизируйте в CI.",
        "**Не размечайте то, чего нет на странице;** не накручивайте рейтинги.",
        "**Следите за правилами поисковиков:** список поддерживаемых типов и условия показа расширенных результатов меняются.",
      ),
    ]),

    section("edge-cases", [
      h("`og:title` vs `<title>`"),
      p("Они не обязаны совпадать: `<title>` оптимизируют под выдачу («Кроссовки Run — купить | Магазин»), а `og:title` — под ленту (короче, без бренда). Но описывать они должны одну и ту же страницу."),
      h("Несколько `og:image`"),
      p("Допустимо перечислить несколько `og:image`; сервисы выберут подходящее. Для предсказуемости оставляйте основной вариант первым и указывайте размеры."),
      h("Анимированные и SVG-картинки"),
      p("Не все сервисы показывают SVG и анимированные форматы. Для OG используйте JPEG/PNG/WebP."),
      h("FAQ, HowTo, Review: правила ужесточаются"),
      p("Поисковики ограничивали показ некоторых расширенных результатов (например, для FAQ и HowTo). Наличие корректной разметки не гарантирует показа. Следите за актуальной документацией и не строите бизнес-логику на обещании «звёздочек»."),
      h("Многоязычность"),
      p("`og:locale` задаёт язык страницы, `og:locale:alternate` — другие языки. Для JSON-LD используйте `inLanguage`. Для каждой языковой версии — свой `og:url`."),
      h("Авторизованные страницы"),
      p("Если страница требует входа, бот получит страницу логина: превью будет «Войти». Для публичных превью приватных материалов делайте отдельную публичную версию с обезличенными метаданными."),
      h("Изображения и CDN"),
      p("Если картинки отдаёт CDN с защитой от hotlinking или проверкой `Referer`, бот не загрузит их. Разрешите доступ для известных ботов или используйте отдельный публичный путь."),
      h("Изменение схемы"),
      p("Словарь schema.org эволюционирует: свойства добавляются, некоторые становятся устаревшими. При обновлении сверяйтесь с документацией и валидаторами, а в коде генерации храните версии/тесты."),
    ]),

    section("related", [
      ul(
        "[Элемент head и метаданные](/learn/html/head-metadata) — `title`, `description`, `canonical`, `robots`, `hreflang`.",
        "[SEO на уровне разметки](/learn/html/seo-fundamentals) — обход, индексация, ссылки, коды ответов.",
        "[Содержательные элементы](/learn/html/content-semantics) — `time`, `address`, `figure`, `blockquote`.",
        "[Безопасность HTML](/learn/html/html-security) — XSS и экранирование в шаблонах.",
        "[Шаблоны страниц](/learn/html/document-patterns) — повторное использование `head` и метаданных.",
        "Из других курсов: **JS** — `JSON.stringify`, SSR/SSG; **Безопасность** — XSS, Content Security Policy.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Ссылка без карточки",
          code: `
            <title>Магазин</title>
            <!-- og-метаданных нет; JSON-LD нет -->
            <script>
              document.head.insertAdjacentHTML("beforeend",
                '<meta property="og:title" content="' + product.name + '">');
            </script>
          `,
          note: "Бот не выполняет скрипт: в чате — голый URL или общий заголовок. Значение не экранировано.",
        },
        {
          title: "Карточка и данные для машин",
          code: `
            <title>Кроссовки Run — купить | Магазин</title>
            <meta property="og:type" content="product">
            <meta property="og:title" content="Кроссовки Run">
            <meta property="og:description" content="Беговые кроссовки, 240 г.">
            <meta property="og:url" content="https://example.com/catalog/run">
            <meta property="og:image" content="https://example.com/img/og/run.jpg">
            <meta name="twitter:card" content="summary_large_image">
            <script type="application/ld+json">
              {"@context":"https://schema.org","@type":"Product","name":"Кроссовки Run"}
            </script>
          `,
          note: "Метаданные в HTML сервера, абсолютные URL, тип карточки и структурированные данные.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.open-graph-structured-data.ex1",
      title: "Карточка и JSON-LD для статьи",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Для статьи «Git за 20 минут» (автор — Анна Смирнова, опубликована 2026-02-03T12:00:00+03:00, URL `https://dev.example/git-20`, картинка `https://dev.example/og/git-20.jpg` 1200×630) напишите: набор `og:*`, `twitter:card` и JSON-LD `Article`."),
      ],
      hints: ["Какой `og:type` у статьи?", "Какой формат даты в JSON-LD?", "Нужен ли `twitter:card`?"],
      checks: ["Абсолютные URL", "`og:image:width/height/alt`", "ISO 8601 для даты", "Автор как `Person`"],
      solution: [
        code(
          "html",
          `
          <meta property="og:type" content="article">
          <meta property="og:title" content="Git за 20 минут">
          <meta property="og:description" content="Коммиты, ветки, слияние и отмена изменений — минимум для работы в команде.">
          <meta property="og:url" content="https://dev.example/git-20">
          <meta property="og:image" content="https://dev.example/og/git-20.jpg">
          <meta property="og:image:width" content="1200">
          <meta property="og:image:height" content="630">
          <meta property="og:image:alt" content="Схема веток Git на тёмном фоне">
          <meta property="article:published_time" content="2026-02-03T12:00:00+03:00">
          <meta name="twitter:card" content="summary_large_image">

          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Git за 20 минут",
            "image": ["https://dev.example/og/git-20.jpg"],
            "datePublished": "2026-02-03T12:00:00+03:00",
            "author": { "@type": "Person", "name": "Анна Смирнова" },
            "mainEntityOfPage": "https://dev.example/git-20"
          }
          </script>
          `,
          { lineNumbers: true, collapsed: true },
        ),
      ],
    }),
    exercise({
      id: "html.open-graph-structured-data.ex2",
      title: "Найдите ошибки в JSON-LD",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Rich Results Test не принимает разметку товара. Найдите все ошибки и исправьте:"),
      ],
      starter: {
        lang: "html",
        code: `
          <script type="application/ld+json">
          {
            "@type": "Product",
            "name": 'Кроссовки Run',
            "image": "/img/run.jpg",
            "offers": {
              "price": "5 990 ₽",
              "availability": "в наличии"
            },
            "aggregateRating": { "ratingValue": 4.7, "reviewCount": 0 },
          }
          </script>
        `,
      },
      hints: ["Что обязательно в корне JSON-LD?", "Какие кавычки допускает JSON?", "Как записывают цену и валюту?", "Что делать с рейтингом без отзывов?"],
      checks: ["Исправлены кавычки и запятая", "Добавлены `@context`, `@type` у вложенных объектов", "Цена и валюта раздельно", "Абсолютный URL изображения", "`availability` — URL schema.org", "Рейтинг убран или подтверждён отзывами"],
      solution: [
        ul(
          "**Нет `@context`.**",
          "**Одинарные кавычки** у `name` и **лишняя запятая** в конце объекта — это не JSON.",
          "**Относительный URL изображения** — нужен абсолютный.",
          "**У `offers` нет `@type: Offer`**, `price` содержит пробел и знак валюты, нет `priceCurrency`.",
          "**`availability`** — значение из словаря: `https://schema.org/InStock`.",
          "**`aggregateRating` при нуле отзывов** — недопустимо: рейтинг размечают только при реальных отзывах, видимых на странице.",
        ),
        code(
          "html",
          `
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Кроссовки Run",
            "image": "https://example.com/img/run.jpg",
            "offers": {
              "@type": "Offer",
              "price": "5990",
              "priceCurrency": "RUB",
              "availability": "https://schema.org/InStock"
            }
          }
          </script>
          `,
          { lineNumbers: true },
        ),
      ],
    }),
    exercise({
      id: "html.open-graph-structured-data.ex3",
      title: "Превью в Telegram не работает",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Команда запустила новую версию сайта на SPA. В Telegram и VK ссылки показываются без картинки и с общим заголовком «Магазин». В поисковой консоли «Rich results» пропали. Разработчик говорит: «У нас всё есть, я вижу `og:image` в DevTools». Какие причины вы проверите и как исправите?"),
      ],
      hints: ["Что видит бот: HTML до или после JS?", "Как проверить ответ сервера от лица бота?", "Что с картинкой: URL, доступность, размер?"],
      checks: ["Названа проблема клиентского рендеринга", "Предложен способ проверки `curl -A`", "Исправления: SSR/SSG, абсолютные URL, доступность", "Обновление кэша через отладчики"],
      solution: [
        ul(
          "**Метаданные добавляются JS на клиенте:** в DevTools они есть, но бот получает исходный HTML без них. Проверка: `curl -s -A \"TelegramBot\" https://… | grep -i og:`.",
          "**Решение:** SSR/SSG — сервер формирует `og:*`, `twitter:*` и JSON-LD в HTML для каждого маршрута (или пререндер для ботов как временная мера).",
          "**Картинка:** абсолютный HTTPS-URL, публичный доступ (без авторизации и защиты hotlink), ≈1200×630, адекватный вес.",
          "**Проверить** `robots.txt`/WAF: не блокируются ли боты превью по User-Agent.",
          "**Кэш:** после исправления запросить обновление через отладчики (Telegram `@WebpageBot`, Sharing Debugger Facebook) или поменять URL картинки.",
          "**JSON-LD:** убедиться, что присутствует в исходном HTML и валиден; проверить в Rich Results Test.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.open-graph-structured-data.challenge",
    title: "Карточки и структурированные данные интернет-магазина",
    scenario: [
      p("Интернет-магазин с 50 000 товаров переносит каталог на SSR. Задачи: красивые превью товаров и категорий в мессенджерах, расширенные сниппеты (цена, наличие, рейтинг, хлебные крошки), корректная работа с изменением цен каждые несколько часов, защита от XSS и отсутствие расхождений между видимым контентом и разметкой."),
      p("Спроектируйте генерацию метаданных: модель данных, шаблоны, правила, тесты и мониторинг."),
    ],
    requirements: [
      "Шаблон `og:*`/`twitter:*` и JSON-LD (Product, Offer, AggregateRating, BreadcrumbList) для страницы товара",
      "Правила формирования значений из модели данных (цена, наличие, рейтинг)",
      "Безопасная сериализация JSON-LD с экранированием",
      "Автоматические проверки и мониторинг",
    ],
    constraints: [
      "Метаданные отдаются сервером в HTML",
      "Разметка соответствует видимому контенту",
      "Нельзя размечать рейтинг без реальных отзывов на странице",
    ],
    acceptance: [
      "Для каждого товара есть уникальный `og:image` (≈1200×630), `og:title`, `og:description`",
      "JSON-LD проходит валидаторы без критических ошибок",
      "Цена и наличие в JSON-LD совпадают с видимыми",
      "Тесты ловят XSS-вектор в названии товара",
    ],
    hints: [
      "Откуда брать цену, чтобы она совпала с видимой?",
      "Как организовать генерацию OG-картинок?",
      "Что делать с товаром, которого нет в наличии?",
    ],
    solution: [
      code(
        "js",
        `
        // Единая функция сериализации — защита от XSS и от ошибок формата
        function jsonLd(data) {
          return JSON.stringify(data)
            .replace(/</g, "\\\\u003c")
            .replace(/\\u2028/g, "\\\\u2028")
            .replace(/\\u2029/g, "\\\\u2029");
        }

        function productLd(p) {
          const ld = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            image: p.images.map((i) => new URL(i, p.origin).href),
            description: p.description,
            sku: p.sku,
            brand: { "@type": "Brand", name: p.brand },
            offers: {
              "@type": "Offer",
              url: p.url,
              priceCurrency: "RUB",
              price: String(p.price),                              // число без знака валюты
              availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          };
          if (p.reviewCount > 0) {                                // только при реальных отзывах на странице
            ld.aggregateRating = { "@type": "AggregateRating", ratingValue: String(p.rating), reviewCount: String(p.reviewCount) };
          }
          return '<script type="application/ld+json">' + jsonLd(ld) + "</script>";
        }
        `,
        { lineNumbers: true, filename: "product-ld.js", collapsed: true },
      ),
      ul(
        "**Одна модель данных:** страница рендерит цену и наличие из того же объекта `p`, что и JSON-LD — расхождений нет. При обновлении цены кэш страницы инвалидируется (или время жизни кэша ограничивается минутами).",
        "**Шаблон OG:** `og:type=product`, `og:title` — название, `og:description` — краткое описание (до 200 символов), `og:image` — отдельная картинка 1200×630 (генерируется на сервере из фото товара и логотипа, кэшируется на CDN), `og:image:alt`, `og:url` = canonical, `twitter:card=summary_large_image`.",
        "**Хлебные крошки:** `BreadcrumbList` собирается из дерева категорий и совпадает с видимой навигацией.",
        "**Отсутствие в наличии:** `OutOfStock`; страницы удалённых товаров — 404/410 или редирект на категорию.",
        "**Безопасность:** все строки сериализуются `JSON.stringify`, `<` экранируется; юнит-тест подставляет название `</script><script>alert(1)</script>` и проверяет, что в выводе нет `</script>` внутри данных.",
        "**CI:** валидность JSON, обязательные поля (`name`, `image`, `offers.price`, `priceCurrency`), абсолютные URL, соответствие `og:url` и `canonical`, наличие `og:image`, доступность картинки (HEAD-запрос), отсутствие `aggregateRating` без отзывов.",
        "**Мониторинг:** отчёты «Улучшения»/«Rich results» в поисковой консоли, выборочные проверки в Rich Results Test и отладчиках соцсетей, алерты на рост ошибок разметки после релиза.",
      ),
    ],
  },

  interview: [
    iq("html.open-graph-structured-data.i1", "basic", "Что такое Open Graph и зачем он нужен?", [
      p("Набор `<meta property=\"og:*\">`, по которому соцсети и мессенджеры строят карточку ссылки: заголовок, описание, картинка. Без него превью получается пустым или случайным."),
    ]),
    iq("html.open-graph-structured-data.i2", "basic", "Что такое JSON-LD и где он размещается?", [
      p("JSON-объект со структурированными данными по словарю schema.org внутри `<script type=\"application/ld+json\">`. Размещают в `head` или `body`; поисковик находит его независимо от места."),
    ]),
    iq("html.open-graph-structured-data.i3", "intermediate", "Почему метаданные для превью нельзя добавлять только на клиенте?", [
      p("Боты соцсетей и мессенджеров читают исходный HTML и не выполняют JavaScript, поэтому не увидят метаданные, добавленные скриптом. Они должны приходить с сервера (SSR/SSG)."),
    ]),
    iq("html.open-graph-structured-data.i4", "intermediate", "Какие требования к картинке для превью?", [
      ul(
        "Абсолютный HTTPS-URL, публичный доступ (без авторизации и защиты от hotlinking).",
        "≈1200×630 (1,91:1), JPEG/PNG/WebP, разумный вес.",
        "Указать `og:image:width/height` и `og:image:alt`.",
      ),
    ]),
    iq("html.open-graph-structured-data.i5", "intermediate", "Как записывают цену и дату в JSON-LD?", [
      p("Цена — число в строке без символа валюты в `price`, валюта — в `priceCurrency` (ISO 4217: `RUB`). Дата — ISO 8601, например `2026-03-14T10:00:00+03:00`. Все URL — абсолютные."),
    ]),
    iq("html.open-graph-structured-data.i6", "advanced", "Какую уязвимость создаёт подстановка пользовательских данных в JSON-LD и как её предотвратить?", [
      p("Последовательность `</script>` в данных закрывает тег и позволяет внедрить произвольную разметку (XSS). Нужно сериализовать объект через `JSON.stringify` и заменить `<` на `\\u003c` (и `\\u2028/\\u2029`), либо использовать шаблонизатор/библиотеку, делающую это автоматически."),
    ]),
    iq("html.open-graph-structured-data.i7", "engineering", "Как организовать генерацию метаданных в большом проекте, чтобы они не расходились с контентом?", [
      ul(
        "Единая модель данных для видимого шаблона и разметки; общие функции форматирования.",
        "Генерация на сервере; инвалидация кэша при изменении цены/наличия.",
        "Автоматические проверки в CI: валидность, обязательные поля, соответствие видимому контенту.",
        "Мониторинг отчётов поисковой консоли, выборочные проверки валидаторами и отладчиками.",
      ),
    ]),
    iq("html.open-graph-structured-data.i8", "debugging", "В мессенджере показывается старая карточка после изменения заголовка. Что делать?", [
      ul(
        "Сервис кэширует превью: запросить обновление в отладчике (Sharing Debugger, Post Inspector, `@WebpageBot`).",
        "Проверить, что новый HTML отдаётся боту (`curl -A`), нет редиректов и блокировок.",
        "Для картинки — сменить URL (версия в имени) или параметр.",
        "Проверить `og:url` и `canonical`: расхождение может приводить к кэшированию по другому адресу.",
      ),
    ]),
  ],

  exam: [
    mcq("html.open-graph-structured-data.e1", "foundation", "Какой атрибут используют в Open Graph-метатегах?", ["`name`", "`property`", "`itemprop`", "`rel`"], 1, "Стандарт Open Graph (RDFa) использует `property`: `<meta property=\"og:title\" content=\"…\">`."),
    mcq("html.open-graph-structured-data.e2", "foundation", "Какой формат структурированных данных рекомендуют поисковики?", ["XML", "JSON-LD", "CSV", "YAML"], 1, "JSON-LD проще поддерживать и он не связан с вёрсткой."),
    mcq("html.open-graph-structured-data.e3", "intermediate", "Какое значение корректно для цены в JSON-LD?", ["`\"5 990 ₽\"`", "`\"5990\"` с `priceCurrency: \"RUB\"`", "`\"пять тысяч\"`", "`\"RUB5990\"`"], 1, "Цена — число, валюта — отдельным свойством в формате ISO 4217."),
    mcq("html.open-graph-structured-data.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["Боты превью обычно выполняют JavaScript", "`og:image` должен быть абсолютным URL", "Разметка должна соответствовать видимому контенту", "`</script>` в данных JSON-LD безопасен"], [1, 2], "Боты обычно не выполняют JS; `</script>` внутри данных — вектор XSS."),
    mcq("html.open-graph-structured-data.e5", "intermediate", "Для чего нужен `twitter:card=\"summary_large_image\"`?", ["Для SEO", "Для показа большой картинки в карточке в X", "Для JSON-LD", "Для кэширования"], 1, "Тип карточки определяет размер и компоновку; остальные поля могут браться из OG."),
    mcq("html.open-graph-structured-data.e6", "advanced", "Что гарантирует корректный JSON-LD?", ["Первое место в выдаче", "Возможность (но не гарантию) расширенного сниппета", "Отсутствие дубликатов", "Быструю индексацию"], 1, "Структурированные данные дают право на расширенный вид, но решение принимает поисковик."),
    open("html.open-graph-structured-data.e7", "intermediate", "Объясните, почему боты превью не видят метаданные, добавленные скриптом на клиенте, и как решить проблему.", [
      p("Боты запрашивают URL и читают тело ответа как есть, не выполняя JavaScript. Метаданные, вставленные скриптом после загрузки, в ответ не попадают."),
      ul(
        "Генерировать `og:*`, `twitter:*` и JSON-LD на сервере (SSR/SSG).",
        "При невозможности — пререндер/специальный ответ для известных ботов (временная мера).",
        "Проверять ответ командой `curl -A` и отладчиками соцсетей.",
      ),
    ], ["Названа причина: боты не исполняют JS", "Предложено SSR/SSG", "Названа проверка `curl`/отладчиков"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.open-graph-structured-data.m1", "intermediate", "Что делает `@graph` в JSON-LD?", ["Рисует диаграмму", "Объединяет несколько сущностей и позволяет ссылаться на них по `@id`", "Подключает внешний файл", "Включает кэш"], 1, "Граф сущностей избегает дублирования (издатель, автор) и связывает объекты друг с другом."),
    mcq("html.open-graph-structured-data.m2", "advanced", "Рейтинг в JSON-LD есть, а отзывов на странице нет. Что правильно?", ["Оставить: звёздочки в выдаче улучшат клики", "Убрать: разметка должна соответствовать видимому содержимому", "Заменить на `Review` с вымышленным автором", "Скрыть через `display:none`"], 1, "Разметка не должна вводить в заблуждение; несоответствие — нарушение правил."),
    mcq("html.open-graph-structured-data.m3", "advanced", "Как безопасно вставить данные пользователя в JSON-LD?", ["Сконкатенировать строки", "Сериализовать `JSON.stringify` и заменить `<` на `\\u003c`", "Использовать `eval`", "Положить в `data-*`"], 1, "Экранирование `<` предотвращает закрытие тега `script` и выполнение инъекции."),
    open("html.open-graph-structured-data.m4", "advanced", "Маркетинг хочет добавить на все страницы рейтинг 4.9 в JSON-LD и FAQ с общими вопросами, «чтобы выделиться в выдаче». Что вы ответите и что предложите?", [
      ul(
        "Рейтинг без отзывов на странице и FAQ, которого нет в видимом контенте, нарушают правила и могут привести к санкциям.",
        "Предложить собрать настоящие отзывы и размечать только страницы, где они есть; FAQ — только реально присутствующие вопросы.",
        "Для выделения использовать допустимое: корректный Product/Offer, BreadcrumbList, хорошие `title`/`description`, быстрые страницы.",
        "Настроить проверки и мониторинг разметки в CI и консолях.",
      ),
    ], ["Названо нарушение правил", "Предложены честные альтернативы", "Предложены проверки и мониторинг"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.open-graph-structured-data.f1", front: "Минимум OG для карточки?", back: "`og:title`, `og:description`, `og:image` (абсолютный URL), `og:url`, `og:type`." },
    { id: "html.open-graph-structured-data.f2", front: "Почему meta на клиенте не работают для превью?", back: "Боты читают исходный HTML и не выполняют JS. Нужен SSR/SSG." },
    { id: "html.open-graph-structured-data.f3", front: "Формат цены в JSON-LD?", back: "`\"price\": \"5990\"` + `\"priceCurrency\": \"RUB\"`; без знака валюты." },
    { id: "html.open-graph-structured-data.f4", front: "Формат даты?", back: "ISO 8601: `2026-03-14T10:00:00+03:00`." },
    { id: "html.open-graph-structured-data.f5", front: "XSS в JSON-LD?", back: "`</script>` в данных. `JSON.stringify` + замена `<` на `\\u003c`." },
    { id: "html.open-graph-structured-data.f6", front: "Как проверить, что видит бот?", back: "`curl -s -A \"TelegramBot\" URL | grep og:`; отладчики соцсетей; Rich Results Test." },
  ],

  sources: [
    { title: "The Open Graph protocol", url: "https://ogp.me/", publisher: "Other" },
    { title: "schema.org", url: "https://schema.org/", publisher: "Other" },
    { title: "Google Search Central: Intro to structured data markup", url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data", publisher: "Other" },
    { title: "Google Search Central: Structured data general guidelines", url: "https://developers.google.com/search/docs/appearance/structured-data/sd-policies", publisher: "Other" },
    { title: "W3C: JSON-LD 1.1", url: "https://www.w3.org/TR/json-ld11/", publisher: "W3C" },
    { title: "MDN: <meta> (property, name)", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta", publisher: "MDN" },
  ],
};
