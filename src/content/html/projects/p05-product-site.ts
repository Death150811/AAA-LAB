import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p05ProductSite: Project = {
  id: "html.p05-product-site",
  domain: "html",
  order: 5,
  title: "Сайт продукта «Таймер»",
  subtitle: "Маркетинговый сайт SaaS-сервиса из восьми страниц: единые шаблоны, SEO и социальные карточки, структурированные данные, формы регистрации и контактов, страница цен и базовая защита.",
  level: "advanced",
  estimatedHours: 12,
  buildsOn: ["html.p04-docs"],
  topics: [
    "html.head-metadata",
    "html.seo-fundamentals",
    "html.open-graph-structured-data",
    "html.document-patterns",
    "html.resource-loading",
    "html.global-attributes",
    "html.html-security",
    "html.form-validation",
    "html.form-ux-autocomplete",
  ],
  objective:
    "Собрать **многостраничный сайт продукта** так, как это делают в реальных командах: оболочка и метаданные генерируются из **шаблонов и данных**, каждая страница получает правильные `title`, `canonical`, Open Graph и JSON-LD, формы регистрации и контактов доступны и безопасны, а сборка выдаёт `sitemap.xml` и `robots.txt` автоматически.",
  scenario: [
    p("«Таймер» — сервис учёта рабочего времени для небольших команд. Маркетолог просит сайт, который объясняет ценность продукта, показывает тарифы и приводит посетителя к регистрации. Сайт должен хорошо находиться в поиске, красиво выглядеть в карточках мессенджеров, быстро открываться на мобильном интернете и не ломаться, если не загрузился скрипт."),
    p("Разработчик до вас копировал шапку и подвал в каждый файл — через месяц на двух страницах отличались меню, на трёх забыли `canonical`, а на странице тарифов заголовок совпадал с главной. Ваша задача — построить сайт так, чтобы такие ошибки были **невозможны**: единый шаблон, метаданные из данных страницы, проверка консистентности после сборки."),
    note("Сайт собирается скриптом из шаблона и страниц-источников. Можно использовать Eleventy/Astro/Hugo или короткий собственный скрипт без зависимостей (пример — в решении). Главное — в готовом HTML нет копипасты и расхождений."),
  ],
  requirements: [
    "Не менее **восьми страниц**: главная, «Возможности», «Цены» (и вариант «годовая оплата»), «Регистрация», «Контакты», «О компании», «Политика конфиденциальности», `404`.",
    "Оболочка (head, ссылка-пропуск, шапка с навигацией, `main`, подвал) определяется **в одном шаблоне**; страницы содержат только уникальное содержимое и метаданные (frontmatter/JSON).",
    "Метаданные каждой страницы формируются из данных: уникальные `title` (формат «Страница — Таймер»), `description`, самоссылающийся абсолютный `canonical`; на `404` — `noindex`.",
    "Социальные карточки: `og:type`, `og:title`, `og:description`, `og:url`, `og:image` (абсолютный URL, 1200×630), `og:image:alt`, `og:locale`, `twitter:card=summary_large_image`.",
    "Структурированные данные (JSON-LD, без ошибок): `Organization` на главной, `SoftwareApplication` с `offers` на странице цен, `BreadcrumbList` на внутренних страницах; данные соответствуют видимому содержимому.",
    "Главная: герой (`h1`, подзаголовок, две ссылки-призыва), три блока возможностей с изображениями (`picture`, `fetchpriority=\"high\"` у главного), отзывы (`blockquote` с `cite`), блок тарифов, FAQ на `details`, завершающий призыв.",
    "Страница цен: сравнительная таблица тарифов (`caption`, `th scope`), переключатель «Помесячно/Ежегодно» как навигация между двумя страницами (`aria-current`), ссылки на регистрацию с параметром тарифа.",
    "Форма регистрации: `name`, `email`, `password` (`autocomplete=\"new-password\"`, `minlength`), размер команды (`select`), согласие с условиями (`required`); метки, подсказки, `autocomplete`, `inputmode`/`enterkeyhint` там, где применимо; доступные сообщения об ошибках (шаблон из проекта 4).",
    "Форма контактов: имя, почта, тема (`select`), сообщение (`textarea` с лимитом), согласие; `method=\"post\"`, работает без JS.",
    "Файлы SEO генерируются сборкой: `sitemap.xml` (только канонические индексируемые URL), `robots.txt` с ссылкой на карту сайта, SVG-favicon, `manifest.webmanifest`.",
  ],
  constraints: [
    "Никакого копирования оболочки между файлами: изменение меню — в одном месте.",
    "JavaScript — только как улучшение (до 60 строк, например, «Показать пароль» и счётчик символов); сайт полностью работает без него.",
    "Без CSS-фреймворков и встроенных `style=\"…\"`/`on*`-обработчиков; допускается один `style.css`.",
    "Внешних скриптов нет (или они подключены с `integrity` и `crossorigin`); все внешние ссылки — с `rel=\"noopener noreferrer\"`.",
    "Содержание правдоподобное и полное: никаких «Lorem ipsum»; тарифы, цены и условия описаны конкретно.",
  ],
  expected: [
    "Любая страница при просмотре «исходного кода» содержит полную оболочку и корректные метаданные — без выполнения JavaScript.",
    "Ссылка на сайт в мессенджере показывает заголовок, описание и картинку; в Rich Results Test структурированные данные проходят проверку.",
    "Главная страница быстро показывает герой: главное изображение имеет приоритет и размеры, шрифты и CSS не блокируют лишнего.",
    "Регистрация и контактная форма работают как обычные HTTP-формы и дают понятные ошибки.",
    "Сайт можно целиком пройти с клавиатуры; скринридер озвучивает заголовки, ориентиры, таблицу тарифов и ошибки форм.",
  ],
  technical: [
    "Структура: `src/layout.html`, `src/site.json` (название, адрес, меню), `src/pages/*.html` (JSON-метаданные в начале файла), `build.mjs`, `dist/` (результат), `_headers`.",
    "Адреса «чистые»: `/pricing/` → `dist/pricing/index.html`; корневые пути к ресурсам (`/assets/...`).",
    "JSON-LD сериализуется через `JSON.stringify` с экранированием `<` (`\\u003c`).",
    "Заголовки безопасности и CSP — в файле `_headers` (или конфигурации хостинга): `default-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.",
    "Проверки: валидатор итогового HTML, `check.mjs` (консистентность: `lang`, `title`, `canonical`, один `h1`, одинаковая навигация), Lighthouse (мобильный профиль), Rich Results Test, ручная проверка карточек.",
  ],
  acceptance: [
    "В репозитории один шаблон оболочки; в `dist/` все страницы собраны из него (проверка `check.mjs` проходит).",
    "У каждой страницы уникальные `title` и `description`, абсолютный самоссылающийся `canonical`; `404` имеет `noindex`.",
    "На всех страницах корректные Open Graph и Twitter Card; `og:image` — абсолютный URL публичного файла 1200×630.",
    "JSON-LD валиден (парсится как JSON, содержит `@context` и `@type`) и соответствует содержимому: цены в разметке равны ценам на странице.",
    "Таблица тарифов имеет `caption`, `th scope=\"col\"` и `th scope=\"row\"`; переключатель периода реализован ссылками.",
    "Формы: у полей есть метки, `autocomplete`, `required`; ошибки возвращаются сервером со сводкой и сохранением значений; без JS всё работает.",
    "`sitemap.xml` и `robots.txt` сгенерированы сборкой и не содержат `404`/служебных страниц; ссылка на карту сайта указана в `robots.txt`.",
    "Lighthouse (мобильный): производительность, доступность, SEO и Best Practices — не ниже 90.",
    "Нет внешних скриптов без SRI; внешние ссылки имеют `rel=\"noopener noreferrer\"`; в `_headers` указаны CSP и базовые заголовки.",
  ],
  hints: [
    "Сначала определите **данные**: что меняется от страницы к странице (`title`, `description`, `url`, `ogImage`, `jsonld`), что общее (название сайта, меню). Шаблон — это функция «данные → HTML».",
    "Не пишите `canonical` руками: получите его как `site.url + page.url`. Тогда ошибки из-за копирования невозможны.",
    "JSON-LD удобнее хранить в данных страницы как объект и вставлять в шаблон одним вызовом сериализации. Не забудьте экранировать `<`.",
    "Для таблицы тарифов подумайте, что будет **заголовком строки**: если сравниваете функции по тарифам, строки — функции (`th scope=\"row\"`), а столбцы — тарифы (`th scope=\"col\"`).",
    "Переключатель «Помесячно/Ежегодно» — это обычные ссылки на две страницы. Текущая отмечается `aria-current=\"page\"`, а не классом.",
    "Для OG-изображений достаточно одного шаблона 1200×630 на сайт; позже его можно сделать уникальным для каждой страницы.",
    "Проверку консистентности напишите как скрипт, который открывает все файлы из `dist/` через DOM-парсер (`jsdom`/`linkedom`) и сверяет правила — по образцу мини-линтера из темы «Шаблоны страниц».",
  ],
  advanced: [
    "Добавьте английскую версию сайта (`/en/…`) с `hreflang` и переключателем языка, ведущим на соответствующие страницы.",
    "Сгенерируйте уникальные OG-картинки для страниц (например, `satori`/`sharp` из шаблона) и кэшируйте их.",
    "Подключите Lighthouse CI и бюджеты производительности в GitHub Actions, блокирующие ухудшение.",
    "Сделайте страницу `/status/` с `meta refresh`-free обновлением и `<noscript>`-совместимым выводом статуса.",
    "Настройте CSP в режиме `Report-Only`, соберите нарушения и переведите политику в блокирующий режим.",
  ],
  failureModes: [
    "**Копирование шапки в каждый файл:** через месяц меню отличается, а `canonical` забыт.",
    "**Одинаковые `title`/`description` на всех страницах** и `canonical` на главную везде.",
    "**Цены в JSON-LD ≠ цены на странице** или `aggregateRating` без отзывов — нарушение правил разметки.",
    "**`og:image` с относительным путём или за авторизацией** — карточка без картинки.",
    "**Страница `404` отдаёт 200** (мягкая 404) и попадает в `sitemap.xml`.",
    "**Форма регистрации только на JS:** без скрипта ничего не отправляется; пароль — `type=\"text\"`, поле без `autocomplete`.",
    "**Данные пользователя в JSON-LD или `data-*` без экранирования,** внешние скрипты без SRI.",
    "**Главное изображение лениво загружается** и не имеет размеров — LCP и CLS в красной зоне.",
  ],
  rubric: [
    { criterion: "Шаблоны и архитектура", weight: 15, description: "Единая оболочка, данные отдельно от разметки, чистые адреса, корневые пути, проверка консистентности." },
    { criterion: "SEO и социальные карточки", weight: 20, description: "Уникальные метаданные, canonical, OG/Twitter, JSON-LD, sitemap/robots, noindex на служебных страницах." },
    { criterion: "Формы и валидация", weight: 15, description: "Доступные формы регистрации и контактов, `autocomplete`, ошибки сервера, работа без JS." },
    { criterion: "Доступность и семантика", weight: 15, description: "Ориентиры, заголовки, таблица тарифов, FAQ, навигация, клавиатура и скринридер." },
    { criterion: "Производительность", weight: 15, description: "Главное изображение, `picture`/`sizes`, `defer`, предзагрузка шрифта, отсутствие сдвигов, Lighthouse ≥ 90." },
    { criterion: "Безопасность", weight: 10, description: "`rel` у внешних ссылок, SRI, экранирование JSON-LD, CSP и заголовки." },
    { criterion: "Качество кода и проверки", weight: 10, description: "Валидатор итогового HTML, линтеры, автоматические проверки в сборке." },
  ],
  solution: [
    p("Решение — компактный генератор без зависимостей. Он показывает принцип: **данные + шаблон → страницы**. Вы можете заменить его на Eleventy или Astro, сохранив структуру и проверки."),
    h("Структура репозитория"),
    code(
      "text",
      `
      timer-site/
      ├─ src/
      │  ├─ layout.html            оболочка с плейсхолдерами {{ … }}
      │  ├─ site.json              { "name", "url", "nav": [ … ], "ogImage" }
      │  ├─ pages/
      │  │  ├─ index.html          <!-- { "title": "…", "url": "/", … } --> + содержимое
      │  │  ├─ features.html · pricing.html · pricing-yearly.html
      │  │  ├─ signup.html · contact.html · about.html · privacy.html · 404.html
      │  └─ assets/                css, js, img, fonts
      ├─ build.mjs                 генератор: страницы → dist/
      ├─ check.mjs                 проверка консистентности итогового HTML
      ├─ _headers                  CSP и заголовки безопасности
      └─ dist/                     результат сборки (публикуется)
      `,
      { filename: "структура" },
    ),
    h("Шаблон оболочки"),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{title}}</title>
        <meta name="description" content="{{description}}">
        {{robots}}
        <link rel="canonical" href="{{canonical}}">

        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{siteName}}">
        <meta property="og:title" content="{{ogTitle}}">
        <meta property="og:description" content="{{description}}">
        <meta property="og:url" content="{{canonical}}">
        <meta property="og:image" content="{{ogImage}}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="{{ogImageAlt}}">
        <meta property="og:locale" content="ru_RU">
        <meta name="twitter:card" content="summary_large_image">

        <link rel="icon" href="/assets/img/icon.svg" type="image/svg+xml">
        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="preload" href="/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
        <link rel="stylesheet" href="/assets/css/style.css">
        <script src="/assets/js/enhance.js" defer></script>
        {{jsonld}}
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>
        <header class="site-header">
          <a class="logo" href="/">{{siteName}}</a>
          <nav aria-label="Основная"><ul>{{nav}}</ul></nav>
          <a class="button" href="/signup/">Начать бесплатно</a>
        </header>
        <main id="main" tabindex="-1">
      {{content}}
        </main>
        <footer class="site-footer">
          <nav aria-label="Подвал">
            <ul>
              <li><a href="/about/">О компании</a></li>
              <li><a href="/contact/">Контакты</a></li>
              <li><a href="/privacy/">Конфиденциальность</a></li>
            </ul>
          </nav>
          <p><small>© 2026 {{siteName}}</small></p>
        </footer>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "src/layout.html", collapsed: true },
    ),
    h("Генератор страниц"),
    code(
      "js",
      `
      // build.mjs — node build.mjs
      import { readFile, writeFile, mkdir, readdir, cp } from "node:fs/promises";
      import { join } from "node:path";

      const site = JSON.parse(await readFile("src/site.json", "utf8"));
      const layout = await readFile("src/layout.html", "utf8");
      const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

      // JSON-LD: сериализация с защитой от </script>
      const ld = (obj) => '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, "\\\\u003c") + "</script>";

      const sitemap = [];

      for (const file of (await readdir("src/pages")).filter((f) => f.endsWith(".html"))) {
        const raw = await readFile(join("src/pages", file), "utf8");
        const m = raw.match(/^<!--\\s*(\\{[\\s\\S]*?\\})\\s*-->\\s*/);       // метаданные страницы — JSON в первом комментарии
        if (!m) throw new Error(file + ": нет блока метаданных");
        const page = JSON.parse(m[1]);
        const content = raw.slice(m[0].length);

        const canonical = site.url + page.url;
        const nav = site.nav
          .map((i) => '<li><a href="' + i.url + '"' + (page.url.startsWith(i.url) && (i.url !== "/" || page.url === "/") ? ' aria-current="page"' : "") + ">" + esc(i.title) + "</a></li>")
          .join("");

        const html = layout
          .replaceAll("{{title}}", esc(page.url === "/" ? site.name + " — учёт рабочего времени" : page.title + " — " + site.name))
          .replaceAll("{{ogTitle}}", esc(page.ogTitle ?? page.title))
          .replaceAll("{{description}}", esc(page.description))
          .replaceAll("{{canonical}}", esc(canonical))
          .replaceAll("{{robots}}", page.noindex ? '<meta name="robots" content="noindex">' : "")
          .replaceAll("{{ogImage}}", esc(site.url + (page.ogImage ?? site.ogImage)))
          .replaceAll("{{ogImageAlt}}", esc(page.ogImageAlt ?? site.ogImageAlt))
          .replaceAll("{{siteName}}", esc(site.name))
          .replaceAll("{{jsonld}}", (page.jsonld ?? []).map(ld).join("\\n  "))
          .replaceAll("{{nav}}", nav)
          .replaceAll("{{content}}", content);

        const dir = page.output ? "dist" : join("dist", page.url);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, page.output ?? "index.html"), html);
        if (!page.noindex) sitemap.push(canonical);
      }

      await cp("src/assets", "dist/assets", { recursive: true });
      await writeFile("dist/sitemap.xml",
        '<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n' +
        sitemap.map((u) => "  <url><loc>" + u + "</loc></url>").join("\\n") + "\\n</urlset>\\n");
      await writeFile("dist/robots.txt", "User-agent: *\\nAllow: /\\n\\nSitemap: " + site.url + "/sitemap.xml\\n");
      console.log("Собрано страниц: " + sitemap.length + " (в sitemap)");
      `,
      { lineNumbers: true, filename: "build.mjs", collapsed: true },
    ),
    h("Страница цен (результат сборки)"),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Цены — Таймер</title>
        <meta name="description" content="Тарифы Таймера: бесплатный для одного человека, «Про» за 490 ₽ в месяц и «Команда» за 1 990 ₽. Сравнение возможностей и переход к регистрации.">
        <link rel="canonical" href="https://timer.example/pricing/">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="Таймер">
        <meta property="og:title" content="Цены на Таймер">
        <meta property="og:description" content="Бесплатный тариф, «Про» и «Команда»: сравнение и регистрация за минуту.">
        <meta property="og:url" content="https://timer.example/pricing/">
        <meta property="og:image" content="https://timer.example/assets/img/og.png">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="Интерфейс Таймера: таблица тарифов">
        <meta property="og:locale" content="ru_RU">
        <meta name="twitter:card" content="summary_large_image">
        <link rel="icon" href="/assets/img/icon.svg" type="image/svg+xml">
        <link rel="stylesheet" href="/assets/css/style.css">
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Таймер","applicationCategory":"BusinessApplication","operatingSystem":"Web","offers":[{"@type":"Offer","name":"Бесплатный","price":"0","priceCurrency":"RUB"},{"@type":"Offer","name":"Про","price":"490","priceCurrency":"RUB"},{"@type":"Offer","name":"Команда","price":"1990","priceCurrency":"RUB"}]}</script>
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>
        <header class="site-header">
          <a class="logo" href="/">Таймер</a>
          <nav aria-label="Основная">
            <ul>
              <li><a href="/">Главная</a></li>
              <li><a href="/features/">Возможности</a></li>
              <li><a href="/pricing/" aria-current="page">Цены</a></li>
              <li><a href="/contact/">Контакты</a></li>
            </ul>
          </nav>
          <a class="button" href="/signup/">Начать бесплатно</a>
        </header>
        <main id="main" tabindex="-1">
          <nav aria-label="Хлебные крошки">
            <ol><li><a href="/">Главная</a></li><li aria-current="page">Цены</li></ol>
          </nav>
          <h1>Тарифы</h1>
          <nav aria-label="Период оплаты">
            <ul>
              <li><a href="/pricing/" aria-current="page">Помесячно</a></li>
              <li><a href="/pricing/yearly/">Ежегодно (−20%)</a></li>
            </ul>
          </nav>

          <table>
            <caption>Сравнение тарифов Таймера (цены за месяц при помесячной оплате)</caption>
            <thead>
              <tr>
                <td></td>
                <th scope="col">Бесплатный</th>
                <th scope="col">Про</th>
                <th scope="col">Команда</th>
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">Цена</th><td>0 ₽</td><td>490 ₽</td><td>1 990 ₽</td></tr>
              <tr><th scope="row">Пользователей</th><td>1</td><td>1</td><td>до 10</td></tr>
              <tr><th scope="row">Проекты</th><td>3</td><td>без ограничений</td><td>без ограничений</td></tr>
              <tr><th scope="row">Отчёты и экспорт</th><td>нет</td><td>да</td><td>да</td></tr>
              <tr><th scope="row">Интеграции с API</th><td>нет</td><td>да</td><td>да</td></tr>
              <tr><th scope="row">Приоритетная поддержка</th><td>нет</td><td>нет</td><td>да</td></tr>
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td><a href="/signup/?plan=free">Начать бесплатно</a></td>
                <td><a href="/signup/?plan=pro">Выбрать «Про»</a></td>
                <td><a href="/signup/?plan=team">Выбрать «Команда»</a></td>
              </tr>
            </tfoot>
          </table>

          <section aria-labelledby="faq-title">
            <h2 id="faq-title">Частые вопросы о тарифах</h2>
            <details>
              <summary>Можно ли сменить тариф позже?</summary>
              <p>Да, тариф меняется в любой момент в настройках аккаунта. Разницу в стоимости пересчитаем пропорционально оставшемуся времени.</p>
            </details>
            <details>
              <summary>Есть ли пробный период?</summary>
              <p>Платные тарифы можно попробовать 14 дней бесплатно без привязки карты.</p>
            </details>
          </section>
        </main>
        <footer class="site-footer">
          <nav aria-label="Подвал">
            <ul>
              <li><a href="/about/">О компании</a></li>
              <li><a href="/contact/">Контакты</a></li>
              <li><a href="/privacy/">Конфиденциальность</a></li>
            </ul>
          </nav>
          <p><small>© 2026 Таймер</small></p>
        </footer>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "dist/pricing/index.html", collapsed: true },
    ),
    h("Страница регистрации (результат сборки)"),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Регистрация — Таймер</title>
        <meta name="description" content="Создайте аккаунт в Таймере за минуту: имя, почта и пароль. Платные тарифы — 14 дней бесплатно, без привязки карты.">
        <link rel="canonical" href="https://timer.example/signup/">
        <link rel="stylesheet" href="/assets/css/style.css">
        <script src="/assets/js/enhance.js" defer></script>
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>
        <header class="site-header"><a class="logo" href="/">Таймер</a></header>
        <main id="main" tabindex="-1">
          <h1>Регистрация</h1>
          <p>Поля, отмеченные «обязательно», нужно заполнить.</p>

          <form action="/signup" method="post">
            <p>
              <label for="name">Имя <span class="req">(обязательно)</span></label><br>
              <input id="name" name="name" type="text" autocomplete="name" autocapitalize="words" enterkeyhint="next" required>
            </p>

            <p>
              <label for="email">Рабочая почта <span class="req">(обязательно)</span></label><br>
              <input id="email" name="email" type="email" autocomplete="email" spellcheck="false" enterkeyhint="next" required aria-describedby="email-hint">
            </p>
            <p id="email-hint">Например, name@company.com. На неё придёт подтверждение.</p>

            <p>
              <label for="password">Пароль <span class="req">(обязательно)</span></label><br>
              <input id="password" name="password" type="password" autocomplete="new-password" minlength="10" enterkeyhint="next" required aria-describedby="password-hint">
            </p>
            <p id="password-hint">Не менее 10 символов. Можно вставить из менеджера паролей.</p>

            <p>
              <label for="size">Размер команды</label><br>
              <select id="size" name="size">
                <option value="1">Только я</option>
                <option value="2-10">2–10 человек</option>
                <option value="11-50">11–50 человек</option>
              </select>
            </p>

            <p>
              <label for="plan">Тариф</label><br>
              <select id="plan" name="plan">
                <option value="free">Бесплатный</option>
                <option value="pro">Про — 490 ₽ в месяц</option>
                <option value="team">Команда — 1 990 ₽ в месяц</option>
              </select>
            </p>

            <p>
              <label><input type="checkbox" name="terms" value="yes" required> Я принимаю <a href="/privacy/">политику конфиденциальности</a> <span class="req">(обязательно)</span></label>
            </p>

            <button type="submit">Создать аккаунт</button>
          </form>
        </main>
        <footer class="site-footer"><p><small>© 2026 Таймер</small></p></footer>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "dist/signup/index.html", collapsed: true },
    ),
    h("Улучшение (необязательный JS) и заголовки безопасности"),
    code(
      "js",
      `
      // assets/js/enhance.js — работает только как улучшение
      const pw = document.getElementById("password");
      if (pw) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Показать пароль";
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-controls", "password");
        btn.addEventListener("click", () => {
          const show = pw.type === "password";
          pw.type = show ? "text" : "password";
          btn.setAttribute("aria-pressed", String(show));
        });
        pw.after(btn);
      }

      // предварительный выбор тарифа из адреса: /signup/?plan=pro
      const plan = new URLSearchParams(location.search).get("plan");
      const select = document.getElementById("plan");
      if (plan && select && [...select.options].some((o) => o.value === plan)) select.value = plan;
      `,
      { filename: "assets/js/enhance.js" },
    ),
    code(
      "text",
      `
      /*
        Content-Security-Policy: default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
        X-Content-Type-Options: nosniff
        Referrer-Policy: strict-origin-when-cross-origin
        Permissions-Policy: camera=(), microphone=(), geolocation=()
        Strict-Transport-Security: max-age=31536000; includeSubDomains
      */
      `,
      { filename: "_headers" },
    ),
    table(
      ["Решение", "Зачем"],
      [
        ["Метаданные страницы — данные, а не разметка", "`canonical`, `og:url`, `title` вычисляются; расхождения между страницами невозможны"],
        ["`escape` значений и `\\u003c` в JSON-LD", "Защита от внедрения: данные не становятся разметкой или закрытием `<script>`"],
        ["Таблица тарифов: `th scope` + `caption` + `tfoot` со ссылками", "Скринридер озвучивает тариф и параметр при движении по ячейкам; действия — под таблицей"],
        ["Переключатель периода — ссылки с `aria-current`", "Работает без JS; текущий вариант отмечен семантически"],
        ["Пароль: `new-password`, вставка разрешена, «Показать» — улучшение", "Менеджеры паролей работают; без JS поле остаётся обычным"],
        ["`_headers`: CSP без `unsafe-inline`", "Скрипты и стили только свои; JSON-LD не исполняется и CSP не нарушает"],
        ["Sitemap без `noindex`-страниц", "В карту попадают только индексируемые канонические адреса"],
      ],
      "Ключевые решения",
    ),
    warn("Сайт-генератор здесь учебный. Для production подключите проверенные инструменты (Eleventy, Astro), CSRF-защиту форм, ограничение частоты и антиспам на сервере."),
    tip("Следующий проект — **аудит**: вы получите чужой сайт с десятками дефектов и доведёте его до производственного качества с автоматическими проверками."),
  ],
};
