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

export const headMetadata: Topic = {
  id: "html.head-metadata",
  slug: "head-metadata",
  domain: "html",
  module: "metadata",
  title: "Элемент head и метаданные документа",
  titleEn: "The head element: title, meta, link, base, icons, theme-color, robots, canonical, hreflang",
  summary:
    "`<head>` не показывается на странице, но решает, как её найдут, как она выглядит во вкладке и в выдаче, какая кодировка и масштаб будут применены и в каком порядке загрузятся ресурсы. Тема разбирает все основные элементы `head`, их порядок и типичные ловушки.",
  minutes: 55,
  prerequisites: ["html.document-anatomy", "html.parsing-dom"],
  tags: ["head", "title", "meta", "charset", "viewport", "description", "robots", "canonical", "hreflang", "link", "icon", "manifest", "theme-color", "color-scheme", "base", "http-equiv", "favicon"],
  keyConcepts: [
    { term: "Метаданные документа", text: "Информация **о** странице, а не её содержимое: заголовок, кодировка, описание, язык, связанные ресурсы, правила индексации." },
    { term: "Порядок важен", text: "`<meta charset>` должен оказаться в первых 1024 байтах; блокирующие скрипты и стили в начале `head` задерживают рендеринг." },
    { term: "Canonical и robots", text: "`canonical` — подсказка «какой URL главный»; `robots` — управление индексацией. Это не одно и то же, и это не `robots.txt`." },
    { term: "Парсер закрывает head сам", text: "Первый же элемент, не допустимый в `head` (`div`, текст), закрывает его: последующие `meta` и `link` оказываются в `body` и часто не работают." },
    { term: "Метаданные работают на людей и машины", text: "Вкладка, закладка, поисковая выдача, скринридер, сообщение в мессенджере и PWA — всё использует `head`." },
  ],
  sections: [
    section("definition", [
      def("<head>", "Контейнер метаданных документа. Содержит `<title>`, `<meta>`, `<link>`, `<style>`, `<script>`, `<base>`, `<noscript>` и `<template>`. Ничего из содержимого `head` не отображается как контент страницы (кроме эффектов, которые оно вызывает).", "document head"),
      def("Метаданные", "Данные о документе: его название, кодировка, язык, описание, связанные файлы (стили, значки, манифест, альтернативные версии), инструкции для поисковых систем и браузеров.", "metadata"),
      p("Структуру документа (`doctype`, `html`, `head`, `body`) мы разобрали в теме «Анатомия документа». Здесь — **что именно лежит в `head`** и как каждый элемент влияет на поведение страницы."),
    ]),

    section("why", [
      h("Что решает `head`"),
      ul(
        "**Как страницу прочитают:** кодировка (`charset`), язык, масштаб на мобильных (`viewport`).",
        "**Как её найдут:** `title`, `description`, `robots`, `canonical`, `hreflang`.",
        "**Как она выглядит снаружи:** название во вкладке, значок, цвет адресной строки, карточка в мессенджере (следующая тема).",
        "**Что и когда загрузится:** стили, скрипты, шрифты, подсказки ресурсов; порядок элементов влияет на скорость первой отрисовки.",
        "**Что скажет скринридер:** `title` читается первым при открытии страницы.",
      ),
      h("Цена ошибок"),
      p("Ошибки в `head` дёшевы в исправлении, но дороги в последствиях: забытый `noindex` на продакшене скрывает сайт из поиска; `canonical` на главную со всех страниц «склеивает» сайт в один URL; неверная кодировка превращает текст в «кракозябры»; `user-scalable=no` лишает людей масштаба. Такие дефекты не видны на экране и месяцами остаются незамеченными."),
      insight("Содержимое `head` — часть интерфейса сайта, только для браузера, поисковика и ассистивных технологий. Его нужно проектировать и проверять так же внимательно, как `body`."),
    ]),

    section("mental-model", [
      p("`<head>` — это **паспорт и инструкция по эксплуатации** страницы. В паспорте записано, как она называется, на каком языке, кем создана и какой у неё «главный адрес» (canonical). В инструкции — что подключить (стили, шрифты), кому показывать (роботам) и как отображать на разных устройствах."),
      diagram(
        `
        <head>
          ├─ кодировка и язык      <meta charset>             ← первыми (в первых 1024 байтах)
          ├─ устройство            <meta name="viewport">
          ├─ идентификация         <title>, <meta description>, <link canonical>, hreflang
          ├─ внешний вид «снаружи» <link rel=icon>, <meta theme-color>, <link manifest>, Open Graph
          ├─ поведение роботов     <meta robots>
          ├─ ресурсы               <link rel=preconnect|preload|stylesheet>, <script defer>
          └─ прочее                <base>, <style>, <noscript>
        </head>
        `,
        "Что хранится в head",
      ),
      table(
        ["Элемент", "Кому адресован", "Что делает"],
        [
          ["`<title>`", "Людям, браузеру, поисковику, скринридеру", "Название страницы"],
          ["`<meta charset>`", "Парсеру", "Кодировка символов"],
          ["`<meta name=\"viewport\">`", "Мобильному браузеру", "Масштаб и ширина области просмотра"],
          ["`<meta name=\"description\">`", "Поисковику", "Кандидат на сниппет"],
          ["`<meta name=\"robots\">`", "Поисковым роботам", "Индексировать ли, показывать ли сниппет"],
          ["`<link rel=\"canonical\">`", "Поисковику", "Главный URL среди дубликатов"],
          ["`<link rel=\"icon\">`", "Браузеру, ОС", "Значок вкладки и закладки"],
          ["`<link rel=\"stylesheet\">`", "Браузеру", "Подключение стилей"],
          ["`<base>`", "Парсеру URL", "Базовый адрес для относительных ссылок"],
        ],
      ),
    ]),

    section("technical", [
      h("`<title>`"),
      ul(
        "**Обязателен** в любом документе. Показывается во вкладке, истории, закладках, результатах поиска и читается скринридером первым.",
        "**Уникален для страницы** и описывает её содержимое: «Кроссовки Run — Магазин». Принятый формат — «Страница — Сайт» (важное слева).",
        "**Только текст**: разметка внутри не работает; символы `<` экранируют.",
        "**Обновляйте в SPA** при смене маршрута (`document.title = …`).",
        "**Длина:** поисковики показывают ограниченное число символов (порядка 50–60, зависит от ширины); ключевое — в начале.",
      ),
      h("`<meta charset>`"),
      ul(
        "`<meta charset=\"utf-8\">` — единственная нужная кодировка современных сайтов.",
        "Должен находиться в **первых 1024 байтах** документа и до любого текста, содержащего не-ASCII символы (включая `<title>` на русском). Ставьте первым элементом `head`.",
        "HTTP-заголовок `Content-Type: text/html; charset=utf-8` имеет **приоритет** над `meta`; настройте оба согласованно.",
      ),
      h("`<meta name=\"viewport\">`"),
      code(
        "html",
        `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        `,
      ),
      ul(
        "Без `viewport` мобильные браузеры отрисовывают страницу как «десктопную» ширины ~980px и уменьшают её.",
        "**Не запрещайте масштаб:** `user-scalable=no`, `maximum-scale=1` нарушают WCAG 1.4.4.",
        "`viewport-fit=cover` — для экранов с вырезом (с `env(safe-area-inset-*)`).",
        "`interactive-widget=resizes-content` — как реагирует вёрстка на экранную клавиатуру (поддержка выборочная).",
      ),
      h("`<meta name=\"description\">`"),
      ul(
        "Краткое описание страницы (порядка 120–160 символов); поисковик **может** использовать его как сниппет, но может и сформировать свой из текста.",
        "**Не фактор ранжирования** по заявлениям поисковых систем, но влияет на кликабельность выдачи.",
        "Уникально для каждой страницы; без «набора ключевых слов».",
      ),
      h("`<meta name=\"robots\">` и индексация"),
      table(
        ["Значение", "Смысл"],
        [
          ["`index, follow`", "По умолчанию: индексировать и идти по ссылкам"],
          ["`noindex`", "Не включать страницу в поисковый индекс"],
          ["`nofollow`", "Не передавать вес по ссылкам страницы"],
          ["`noarchive`, `nosnippet`", "Не показывать копию из кэша / сниппет"],
          ["`max-snippet:N`, `max-image-preview:large`", "Ограничения на сниппеты и превью изображений"],
        ],
      ),
      warn("**`robots.txt` и `noindex` — разные механизмы.** `robots.txt` запрещает **обход** страницы. Если обход закрыт, робот не увидит `noindex`, и страница может остаться в выдаче (по внешним ссылкам, без описания). Чтобы убрать страницу из выдачи, разрешите обход и поставьте `noindex` (или заголовок `X-Robots-Tag`, особенно для не-HTML файлов)."),
      h("`<link rel=\"canonical\">`"),
      ul(
        "Указывает **предпочтительный** URL среди страниц с одинаковым или очень похожим содержимым (параметры UTM, сортировки, зеркала).",
        "Использовать **абсолютный** URL. На каждой странице допустим и желателен **самоссылающийся** canonical.",
        "Это **подсказка**, а не команда: поисковик может выбрать другой URL.",
        "Типичная ошибка — один и тот же `canonical` (главная) на всех страницах.",
      ),
      h("Языковые версии: `hreflang`"),
      code(
        "html",
        `
        <link rel="alternate" hreflang="ru" href="https://example.com/ru/catalog">
        <link rel="alternate" hreflang="en" href="https://example.com/en/catalog">
        <link rel="alternate" hreflang="x-default" href="https://example.com/en/catalog">
        `,
        { caption: "Каждая версия перечисляет все версии, включая себя; ссылки должны быть взаимными." },
      ),
      ul(
        "Значение — код языка (`ru`, `en`) и, при необходимости, региона (`en-GB`, `pt-BR`).",
        "`x-default` — версия для пользователей, чей язык не найден.",
        "Связь двусторонняя: если страница A указывает на B, то B должна указывать на A.",
      ),
      h("Значки и манифест"),
      code(
        "html",
        `
        <link rel="icon" href="/favicon.ico" sizes="32x32">
        <link rel="icon" href="/icon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/manifest.webmanifest">
        `,
        { caption: "Минимальный современный набор значков." },
      ),
      ul(
        "**SVG-значок** масштабируется и может адаптироваться к тёмной теме (внутри — `prefers-color-scheme`).",
        "**ICO 32×32** — запасной вариант для старых клиентов и инструментов.",
        "**`apple-touch-icon`** — 180×180 px, для добавления на домашний экран iOS.",
        "**Манифест** (`manifest.webmanifest`) — имя, цвета и значки 192×192 и 512×512 для установки веб-приложения (PWA).",
      ),
      h("Цвета интерфейса: `theme-color` и `color-scheme`"),
      code(
        "html",
        `
        <meta name="color-scheme" content="light dark">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#0b0f14" media="(prefers-color-scheme: dark)">
        `,
      ),
      ul(
        "`theme-color` подсказывает цвет адресной строки/панели мобильного браузера.",
        "`color-scheme` сообщает браузеру, что страница поддерживает светлую и тёмную темы: стандартные элементы управления и фон по умолчанию подстроятся, исчезнет «вспышка» белого при загрузке.",
      ),
      h("`<base>`"),
      p("`<base href=\"https://example.com/docs/\">` задаёт базу для **всех** относительных URL документа — и для якорей `#section` тоже: `href=\"#x\"` превратится в `https://example.com/docs/#x`, то есть вызовет переход на другую страницу. Допустим один элемент `<base>`, расположенный до использования относительных адресов. Применяйте редко и осознанно."),
      h("`<meta http-equiv>`"),
      ul(
        "`http-equiv=\"content-security-policy\"` — политика безопасности в разметке; поддерживает не все директивы (нет `frame-ancestors`, `report-uri`, `sandbox`). Предпочтителен HTTP-заголовок.",
        "`http-equiv=\"refresh\"` — перенаправление или автообновление: **не рекомендуется** (нарушает WCAG 2.2.1/3.2.5, ломает «назад»); используйте серверный редирект (301/302/308).",
        "`x-ua-compatible` и подобное — устаревшее.",
      ),
      h("Ресурсы и порядок"),
      p("Стили блокируют отрисовку, синхронные скрипты блокируют парсинг. Поэтому в начале `head` держат малое и важное, а остальное — позже и с `defer`/`async`. Рекомендуемая схема (по мотивам инструмента Capo.js): кодировка → viewport → `title` → `preconnect` → скрипты `async` → стили → синхронные скрипты → `preload` → скрипты `defer` → `prefetch` → прочие метаданные. Подробности — в теме «Загрузка ресурсов»."),
      h("Парсинг: где заканчивается `head`"),
      ul(
        "`head` закрывается неявно на первом **не допустимом** элементе или тексте: `div`, `p`, `img`, `section`, буква.",
        "Всё, что окажется после этого (`meta`, `link`, `title`), попадёт в `body`: часть таких элементов продолжает работать (`link rel=stylesheet`, `title`), часть — нет (`charset`, `viewport`, `canonical` и `robots` теряют смысл).",
        "Поэтому один ошибочный `<div>`, `<img>` или невидимый текст в `head` (в том числе из шаблона, генерирующего разметку) способен «отрезать» все последующие метаданные.",
      ),
    ]),

    section("syntax", [
      code(
        "html",
        `
        <!doctype html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Кроссовки Run — Магазин</title>
          <meta name="description" content="Беговые кроссовки Run: лёгкие, с амортизацией. Доставка за 2 дня, возврат 30 дней.">

          <link rel="canonical" href="https://example.com/catalog/run">
          <link rel="alternate" hreflang="ru" href="https://example.com/ru/catalog/run">
          <link rel="alternate" hreflang="en" href="https://example.com/en/catalog/run">
          <link rel="alternate" hreflang="x-default" href="https://example.com/en/catalog/run">

          <link rel="icon" href="/favicon.ico" sizes="32x32">
          <link rel="icon" href="/icon.svg" type="image/svg+xml">
          <link rel="apple-touch-icon" href="/apple-touch-icon.png">
          <link rel="manifest" href="/manifest.webmanifest">

          <meta name="color-scheme" content="light dark">
          <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
          <meta name="theme-color" content="#0b0f14" media="(prefers-color-scheme: dark)">

          <link rel="preconnect" href="https://fonts.example.com" crossorigin>
          <link rel="stylesheet" href="/css/main.css">
          <script src="/js/app.js" defer></script>
        </head>
        <body>…</body>
        </html>
        `,
        { lineNumbers: true, filename: "head.html" },
      ),
    ]),

    section("minimal-example", [
      code(
        "html",
        `
        <title>Каталог — Магазин</title>
        <meta name="description" content="Каталог кроссовок: беговые, городские, для зала.">
        <link rel="canonical" href="https://example.com/catalog">
        <p>Откройте консоль: скрипт читает метаданные документа.</p>
        <script>
          console.log("title:", document.title);
          console.log("description:", document.querySelector('meta[name="description"]').content);
          console.log("canonical:", document.querySelector('link[rel="canonical"]').href);
          console.log("кодировка документа:", document.characterSet);
          console.log("lang:", document.documentElement.lang || "(не задан)");

          // Как <base> влияет на относительные адреса
          console.log(new URL("img/a.png", "https://example.com/blog/post/").href);
          console.log(new URL("#faq", "https://example.com/docs/").href);
        </script>
        `,
        { runnable: true },
      ),
      p("Метаданные доступны скриптам как обычные элементы DOM. Последние две строки показывают, как браузер разрешает относительные адреса относительно базы: `<base href>` меняет эту базу для **всех** ссылок, включая якоря `#faq`."),
    ]),

    section("detailed-example", [
      p("Двуязычный интернет-магазин: русская и английская версии, тёмная и светлая темы, PWA-значки. Вставлен и \"плохой\" вариант — типичный шаблон, который разработчики копируют годами, — чтобы сравнить и найти различия."),
      code(
        "html",
        `
        <!-- Плохо -->
        <html>
        <head>
          <title>Магазин</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
          <meta name="robots" content="noindex, nofollow">
          <link rel="canonical" href="https://example.com/">
          <meta http-equiv="refresh" content="300">
          <meta charset="utf-8">
          <div id="loader"></div>
          <link rel="icon" href="/favicon.png">
        </head>
        `,
        { filename: "head-bad.html" },
      ),
      code(
        "html",
        `
        <!-- Хорошо -->
        <!doctype html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Кроссовки Run — Магазин</title>
          <meta name="description" content="Беговые кроссовки Run: лёгкие, с амортизацией. Доставка за 2 дня.">
          <link rel="canonical" href="https://example.com/ru/catalog/run">
          <link rel="alternate" hreflang="ru" href="https://example.com/ru/catalog/run">
          <link rel="alternate" hreflang="en" href="https://example.com/en/catalog/run">
          <link rel="alternate" hreflang="x-default" href="https://example.com/en/catalog/run">
          <link rel="icon" href="/favicon.ico" sizes="32x32">
          <link rel="icon" href="/icon.svg" type="image/svg+xml">
          <link rel="apple-touch-icon" href="/apple-touch-icon.png">
          <link rel="manifest" href="/manifest.webmanifest">
          <meta name="color-scheme" content="light dark">
          <link rel="stylesheet" href="/css/main.css">
          <script src="/js/app.js" defer></script>
        </head>
        <body>…</body>
        </html>
        `,
        { lineNumbers: true, filename: "head-good.html", collapsed: true },
      ),
      ul(
        "**Плохой:** нет `doctype`, `lang`; `title` не уникален; `user-scalable=no`; `noindex` на продакшене; `canonical` ведёт на главную со всех страниц; `refresh` каждые 5 минут; `charset` стоит поздно; `<div>` закрывает `head` — значок оказывается в `body`.",
        "**Хороший:** порядок и набор метаданных осмысленны; значки и язык заданы; индексация разрешена; для двух языков заданы связанные `hreflang`.",
      ),
    ]),

    section("analysis", [
      annotated(
        "html",
        `
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Кроссовки Run — Магазин</title>
        <meta name="robots" content="noindex">
        <link rel="canonical" href="https://example.com/catalog/run">
        <link rel="alternate" hreflang="en" href="https://example.com/en/catalog/run">
        <meta name="theme-color" content="#0b0f14">
        <base href="/docs/">
        `,
        [
          { line: 1, text: "Кодировка — первым элементом: гарантированно попадает в первые 1024 байта, и все последующие символы (включая русский `title`) читаются верно." },
          { line: 2, text: "Без этого мобильный браузер отрисует страницу шириной ≈980px. `width=device-width` берёт ширину устройства, `initial-scale=1` отключает автоматическое уменьшение." },
          { line: 3, text: "Заголовок: уникальный, описательный, формат «Страница — Сайт»; он же станет заголовком результата поиска." },
          { line: 4, text: "`noindex` исключает страницу из индекса. Для **продакшена** это почти всегда ошибка — частая причина «пропавшего» сайта из поиска после релиза со стейджинга." },
          { line: 5, text: "Самоссылающийся canonical: «я и есть главный адрес». Параметры вроде `?utm_source=…` не создадут дубликатов." },
          { line: 6, text: "Альтернативная версия страницы для английского. Для полноты нужны ссылка на себя, `x-default` и обратная ссылка со стороны английской версии." },
          { line: 7, text: "Цвет адресной строки мобильного браузера. Работает с атрибутом `media` для тёмной и светлой тем." },
          { line: 8, text: "`<base>` меняет базу для **всех** относительных URL, включая `#якоря`: ссылка `#faq` превратится в `/docs/#faq`. Ловушка для SPA и статических сайтов." },
        ],
        "head-annotated.html",
      ),
    ]),

    section("internals", [
      steps(
        [
          ["Определение кодировки", "Браузер выбирает кодировку в таком порядке: BOM → HTTP-заголовок `Content-Type` → `<meta charset>`/`http-equiv` в первых 1024 байтах → эвристика. Поэтому `meta` должен идти рано, а сервер — отдавать верный заголовок."],
          ["Парсер встречает `<head>`", "В режиме «in head» разрешены только метаданные. Встретив `body`, текст или неподходящий элемент, парсер неявно закрывает `head` и переходит в режим «after head» → «in body»."],
          ["Блокирующие ресурсы", "`<link rel=\"stylesheet\">` блокирует **отрисовку** (но не парсинг); `<script src>` без `async`/`defer` блокирует **парсинг**. Они задерживают первую отрисовку, пока не загрузятся и не выполнятся."],
          ["Предсканер", "Параллельно основному парсеру работает «preload scanner»: он заранее находит в разметке ссылки на стили, скрипты и изображения и инициирует их загрузку. Динамически добавленные ресурсы он не видит — поэтому критичные подключения лучше указывать в HTML."],
          ["Использование метаданных", "`title` попадает в UI вкладки; `viewport` влияет на раскладку; `canonical`, `robots`, `hreflang` читаются **поисковым роботом** при индексации — не пользовательским браузером."],
          ["Динамические изменения", "Поисковые роботы с поддержкой JavaScript учитывают изменения `head` после выполнения скриптов, но надёжнее отдавать корректные метаданные сразу в исходном HTML (SSR/SSG)."],
        ],
        "Как браузер и робот используют head",
      ),
      note("Чтобы увидеть то, что видит робот до выполнения JavaScript, откройте «Просмотр исходного кода» (view-source) и сравните с DOM в DevTools: различия показывают, что генерирует скрипт."),
    ]),

    section("mistakes", [
      h("Ошибка 1. `noindex` попал в продакшен"),
      p("Тестовое окружение закрывают от индексации — и забывают убрать. Сайт «пропадает» из поиска. Контролируйте через переменные окружения и проверку в CI: на продакшене `noindex` быть не должно."),
      h("Ошибка 2. Одинаковые `title` и `description` на всех страницах"),
      p("Шаблон подставляет «Магазин» везде. Страницы неразличимы во вкладках, истории и поиске. Формируйте метаданные из содержимого страницы."),
      h("Ошибка 3. Неверный canonical"),
      wrongRight(
        "html",
        {
          code: `
            <!-- на каждой странице -->
            <link rel="canonical" href="https://example.com/">
          `,
          note: "Все страницы объявляют главную «главным адресом»; поисковик склеивает сайт в один URL.",
        },
        {
          code: `
            <!-- на странице /catalog/run -->
            <link rel="canonical" href="https://example.com/catalog/run">
          `,
          note: "Самоссылающийся абсолютный canonical на каждой странице.",
        },
      ),
      h("Ошибка 4. Поздний `charset` или его отсутствие"),
      p("Если `<meta charset>` стоит после длинного комментария или скриптов и выходит за 1024 байта, браузеру придётся перепарсить страницу или угадывать кодировку. Ставьте `charset` первым и настройте заголовок `Content-Type`."),
      h("Ошибка 5. Запрет масштабирования"),
      wrongRight(
        "html",
        {
          code: `
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
          `,
          note: "Пользователи не могут увеличить страницу (WCAG 1.4.4).",
        },
        {
          code: `
            <meta name="viewport" content="width=device-width, initial-scale=1">
          `,
          note: "Масштабирование разрешено.",
        },
      ),
      h("Ошибка 6. `<div>` или текст в `<head>`"),
      p("Невидимый `<img>`-пиксель счётчика, `<div id=\"app\">` или комментарий-условие из шаблона закрывают `head`. Все последующие `meta`/`link` оказываются в `body`. Проверяйте результат в DevTools: элементы должны быть внутри `head`."),
      h("Ошибка 7. Блокирующие скрипты в начале"),
      p("`<script src=\"big.js\">` без `defer` в начале `head` откладывает отрисовку страницы. Добавляйте `defer` (или `type=\"module\"`)."),
      h("Ошибка 8. `<base>` и якоря"),
      p("После добавления `<base href=\"/\">` перестали работать ссылки `#section` и пути `images/a.png` ведут не туда. Либо не используйте `<base>`, либо делайте якоря абсолютными/через скрипт."),
    ]),

    section("antipatterns", [
      ul(
        "**Копирование «огромной» шапки `head` из проекта в проект** без понимания, что в ней есть: устаревшие `meta` (`keywords`, `X-UA-Compatible`, `generator`) только занимают место.",
        "**`<meta name=\"keywords\">`** — давно не используется основными поисковыми системами; не тратьте время.",
        "**Метаданные, генерируемые только на клиенте** для страниц, которые должны индексироваться: многие боты и превью соцсетей не выполняют JavaScript.",
        "**Редиректы через `<meta http-equiv=\"refresh\">`** вместо серверных.",
        "**Подсказки ресурсов «на всякий случай»** (`preload` десятка файлов): конкурируют друг с другом и замедляют критичное.",
        "**`robots.txt` для скрытия страниц из выдачи** (не работает: нужна `noindex` при разрешённом обходе).",
        "**Один и тот же файл `og:image`/значка для всех страниц**, когда нужны разные.",
        "**Тема-цвет без учёта тёмной темы** — яркая полоса в тёмном интерфейсе.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Порядок:** `charset` → `viewport` → `title` → описание и canonical → значки → стили → скрипты (`defer`).",
        "**Уникальные `title` и `description`** на каждой странице; формат «Страница — Сайт».",
        "**Самоссылающийся абсолютный `canonical`** и корректные `hreflang` для языковых версий.",
        "**`lang` на `<html>`;** `dir` для RTL-языков.",
        "**Минимальный современный набор значков** (SVG + ICO + `apple-touch-icon` + манифест).",
        "**`color-scheme` и `theme-color` с `media`** для светлой и тёмной тем.",
        "**Индексацией управляйте осознанно:** `noindex` только там, где нужно; не блокируйте обход страниц, которые нужно убрать из индекса.",
        "**Метаданные в HTML сервера (SSR/SSG),** а не только в клиентском JS.",
        "**Проверяйте результат:** view-source, DevTools, инструменты поисковых консолей, валидатор разметки.",
        "**Автоматизируйте:** в CI проверяйте отсутствие `noindex` в продакшене, наличие `title`, `lang`, `viewport`, уникальность `title`.",
      ),
    ]),

    section("edge-cases", [
      h("Несколько `title`"),
      p("Допустим только один `<title>` в `head` (SVG-`title` — отдельная история). Если элементов несколько, браузеры берут первый, что приводит к неожиданностям."),
      h("`title` в SPA и скринридеры"),
      p("При смене маршрута `document.title` нужно обновлять; скринридер при этом ничего сам не объявит: используйте перенос фокуса на `h1` или живую область (см. «Клавиатуру и фокус»)."),
      h("`description`, которого нет"),
      p("Поисковик сам составит сниппет из содержимого — это нормально. Хороший сниппет всё же лучше получается из явного `description` для ключевых страниц."),
      h("Относительный `canonical` и протокол"),
      p("`href=\"/catalog\"` технически допустим, но абсолютный URL с протоколом и доменом надёжнее: он однозначно определяет главный адрес и защищает от путаницы с зеркалами (`http`/`https`, `www`)."),
      h("Фавикон не меняется"),
      p("Браузеры агрессивно кэшируют значки. После замены добавьте версию в URL (`/icon.svg?v=2`) или смените имя файла."),
      h("`<meta>` с `itemprop`/`property`"),
      p("`<meta property=\"og:title\">` (Open Graph) и `<meta itemprop>` (микроразметка) — особые случаи; они обсуждаются в теме «Open Graph и структурированные данные»."),
      h("Заголовки HTTP против `meta`"),
      p("Многое можно задать заголовками: `Content-Type`, `X-Robots-Tag`, `Content-Security-Policy`, `Link`. Заголовки приоритетнее для безопасности и кодировки и применимы к не-HTML ресурсам; `meta` — запасной путь, когда управлять сервером нельзя."),
      h("Шаблоны и условные комментарии"),
      p("Шаблонизатор может вставить пустую строку или невидимые символы (BOM, пробел) в начале документа и вызвать режим совместимости или закрыть `head`. Проверяйте итоговый HTML."),
    ]),

    section("related", [
      ul(
        "[Анатомия документа](/learn/html/document-anatomy) — `doctype`, `html`, `head`, `body`, режим совместимости.",
        "[Парсинг и DOM](/learn/html/parsing-dom) — как парсер закрывает `head`.",
        "[SEO на уровне разметки](/learn/html/seo-fundamentals) — заголовки, ссылки, структура и индексация.",
        "[Open Graph и структурированные данные](/learn/html/open-graph-structured-data) — карточки в соцсетях, JSON-LD.",
        "[Загрузка ресурсов](/learn/html/resource-loading) — `preload`, `preconnect`, `defer`, `async`.",
        "[Безопасность HTML](/learn/html/html-security) — CSP, `referrer-policy`, `sandbox`.",
        "Из других курсов: **HTTP** — заголовки `Content-Type`, `Link`, `X-Robots-Tag`; **PWA** — манифест и значки.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "html",
        {
          title: "Шаблон «как у всех»",
          code: `
            <html>
            <head>
              <title>Магазин</title>
              <meta name="keywords" content="кроссовки, обувь, купить, дёшево">
              <meta name="viewport" content="width=device-width, user-scalable=no">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <link rel="canonical" href="/">
              <meta name="robots" content="noindex">
              <script src="/js/bundle.js"></script>
              <meta charset="utf-8">
            </head>
          `,
          note: "Нет `doctype`/`lang`; устаревшие `keywords` и `X-UA-Compatible`; запрет зума; `noindex` и неверный canonical; блокирующий скрипт; поздний charset.",
        },
        {
          title: "Осознанный head",
          code: `
            <!doctype html>
            <html lang="ru">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Кроссовки Run — Магазин</title>
              <meta name="description" content="Беговые кроссовки Run: лёгкие, с амортизацией.">
              <link rel="canonical" href="https://example.com/catalog/run">
              <link rel="icon" href="/icon.svg" type="image/svg+xml">
              <link rel="stylesheet" href="/css/main.css">
              <script src="/js/app.js" defer></script>
            </head>
          `,
          note: "Правильный порядок, уникальные метаданные, корректный canonical, `defer`, без устаревшего.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "html.head-metadata.ex1",
      title: "Сделайте head страницы",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("Напишите `head` для страницы «Тариф Про» сервиса «Таймер»: URL `https://timer.example/pricing/pro`, язык — русский, есть английская версия `https://timer.example/en/pricing/pro`. Нужны кодировка, масштаб, уникальный заголовок и описание, canonical, hreflang (включая `x-default` на английскую), значки (SVG и ICO), цвет темы для светлой и тёмной схем, подключение стилей и скрипта без блокировки."),
      ],
      hints: ["С чего начинается `head`?", "Что должен содержать каждый `hreflang`-набор?", "Какой атрибут делает скрипт неблокирующим?"],
      checks: ["`charset` и `viewport`", "Уникальные `title` и `description`", "Самоссылающийся canonical", "`hreflang` с `x-default`", "`defer` у скрипта"],
      solution: [
        code(
          "html",
          `
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Тариф Про — Таймер</title>
            <meta name="description" content="Тариф «Про» для небольших команд: командные проекты, отчёты и интеграции. 490 ₽ в месяц, 14 дней бесплатно.">
            <link rel="canonical" href="https://timer.example/pricing/pro">
            <link rel="alternate" hreflang="ru" href="https://timer.example/pricing/pro">
            <link rel="alternate" hreflang="en" href="https://timer.example/en/pricing/pro">
            <link rel="alternate" hreflang="x-default" href="https://timer.example/en/pricing/pro">
            <link rel="icon" href="/favicon.ico" sizes="32x32">
            <link rel="icon" href="/icon.svg" type="image/svg+xml">
            <meta name="color-scheme" content="light dark">
            <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
            <meta name="theme-color" content="#0b0f14" media="(prefers-color-scheme: dark)">
            <link rel="stylesheet" href="/css/main.css">
            <script src="/js/app.js" defer></script>
          </head>
          `,
          { lineNumbers: true, collapsed: true },
        ),
        note("`lang=\"ru\"` ставится на `<html>`, а не в `head`. Английская страница должна содержать такой же набор `hreflang` и свой canonical."),
      ],
    }),
    exercise({
      id: "html.head-metadata.ex2",
      title: "Почему страница в поиске без описания?",
      difficulty: "intermediate",
      kind: "understanding",
      prompt: [
        p("Страница `/old-sale` закрыта в `robots.txt` (`Disallow: /old-sale`) и содержит `<meta name=\"robots\" content=\"noindex\">`. Владелец сайта удивлён, что в поисковой выдаче всё ещё есть ссылка на неё — но без описания. Объясните причину и предложите, как убрать страницу из выдачи."),
      ],
      hints: ["Что запрещает `robots.txt` — обход или индексацию?", "Видит ли робот `noindex`, если не может открыть страницу?"],
      checks: ["Различены обход и индексация", "Объяснено, почему `noindex` не прочитан", "Предложен корректный способ"],
      solution: [
        ul(
          "**`robots.txt` запрещает обход,** а не индексацию. Робот не открывает страницу и не видит ни `noindex`, ни описания.",
          "Но URL может быть известен по внешним ссылкам, поэтому поисковик показывает его **без сниппета**.",
          "**Решение:** убрать `Disallow` для этой страницы, оставить `noindex` (или отдавать заголовок `X-Robots-Tag: noindex`), дождаться повторного обхода. Если страница удалена навсегда — отдавать код **410** (или 404); для срочного удаления есть инструменты поисковых консолей.",
          "Для закрытого контента (личные данные) нужна **аутентификация**, а не только `noindex`.",
        ),
      ],
    }),
    exercise({
      id: "html.head-metadata.ex3",
      title: "Почему метаданные «не работают»?",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("После релиза: страница пропала из поиска, превью в мессенджерах пустое, на телефоне масштаб странный, русский заголовок кракозябрами, а ссылки `#faq` ведут на другой URL. Найдите причины в `head` и исправьте."),
      ],
      starter: {
        lang: "html",
        code: `
          <!doctype html>
          <html>
          <head>
            <title>Магазин — Распродажа осень</title>
            <meta name="robots" content="noindex,nofollow">
            <link rel="canonical" href="https://staging.example.com/sale">
            <base href="/shop/">
            <div id="loader"></div>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta charset="utf-8">
          </head>
          <body>…</body>
          </html>
        `,
      },
      hints: ["Где стоит `charset` и что стоит перед ним?", "Что делает `<div>` в `head`?", "Куда указывает canonical?", "Что делает `<base>` с якорями?"],
      checks: ["`charset` первым", "`<div>` убран из `head`", "`noindex` убран, canonical на боевой домен", "`<base>` убран или обойдён"],
      solution: [
        ul(
          "**`noindex, nofollow` на продакшене** — страница исчезает из поиска. Убрать (оставлять только там, где нужно).",
          "**`canonical` ведёт на `staging`** — поисковик считает главным адрес стейджинга. Указать боевой домен.",
          "**`<div id=\"loader\">` в `head`** закрывает `head`: `viewport` и `charset` оказываются в `body` и не работают (масштаб, кодировка).",
          "**`charset` после русского `title`** (текст вне ASCII) и после других элементов — должен идти первым.",
          "**`<base href=\"/shop/\">`** делает `#faq` ссылкой на `/shop/#faq`. Убрать `<base>` или переписать якоря.",
          "**Нет `lang`** на `<html>`.",
        ),
        code(
          "html",
          `
          <!doctype html>
          <html lang="ru">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Распродажа осень — Магазин</title>
            <link rel="canonical" href="https://example.com/sale">
          </head>
          <body>
            <div id="loader"></div>
            …
          </body>
          </html>
          `,
          { lineNumbers: true },
        ),
      ],
    }),
  ],

  challenge: {
    id: "html.head-metadata.challenge",
    title: "Шаблон head для двуязычного сайта с поиском, PWA и темами",
    scenario: [
      p("Команда делает сайт интернет-магазина на двух языках (ru, en) с SSR. Нужно написать единый шаблон `head`: он принимает данные страницы (заголовок, описание, URL, языковые версии, картинка, флаг индексации) и выдаёт корректные метаданные. Бизнес-требования: хорошая индексация, ссылки в мессенджерах, светлая и тёмная темы, установка как приложение, быстрая отрисовка. Стейджинг не должен индексироваться."),
      p("Опишите шаблон, правила генерации значений, проверки в CI и план проверки в браузере и поисковых консолях."),
    ],
    requirements: [
      "Шаблон `head` с динамическими полями и порядком элементов",
      "Правила генерации `title`, `description`, canonical и `hreflang`",
      "Решение для запрета индексации на стейджинге и страницах корзины/кабинета",
      "Набор значков и манифест, темы",
      "Список автоматических проверок (CI) и ручных проверок",
    ],
    constraints: [
      "Метаданные должны отдаваться в HTML сервером (не только JS)",
      "`noindex` не должен попасть на продакшен для индексируемых страниц",
      "Нельзя запрещать масштабирование",
    ],
    acceptance: [
      "На каждой странице один `title`, один `description`, самоссылающийся canonical",
      "`hreflang` взаимны, есть `x-default`",
      "Страницы корзины и кабинета имеют `noindex`; стейджинг закрыт и заголовком, и аутентификацией",
      "CI падает при пустом `title`, дубликатах и `noindex` на индексируемых страницах",
    ],
    hints: [
      "Откуда взять canonical для страницы с параметрами сортировки?",
      "Что делать, если для языка нет перевода страницы?",
      "Как надёжно закрыть стейджинг?",
    ],
    solution: [
      code(
        "html",
        `
        <!doctype html>
        <html lang="{{ page.lang }}" dir="{{ page.dir }}">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>{{ page.title }} — {{ site.name }}</title>
          <meta name="description" content="{{ page.description }}">

          {% if page.noindex or env != "production" %}
          <meta name="robots" content="noindex, nofollow">
          {% endif %}

          <link rel="canonical" href="{{ page.canonicalUrl }}">
          {% for alt in page.alternates %}
          <link rel="alternate" hreflang="{{ alt.lang }}" href="{{ alt.url }}">
          {% endfor %}
          <link rel="alternate" hreflang="x-default" href="{{ page.defaultUrl }}">

          <link rel="icon" href="/favicon.ico" sizes="32x32">
          <link rel="icon" href="/icon.svg" type="image/svg+xml">
          <link rel="apple-touch-icon" href="/apple-touch-icon.png">
          <link rel="manifest" href="/manifest.webmanifest">

          <meta name="color-scheme" content="light dark">
          <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
          <meta name="theme-color" content="#0b0f14" media="(prefers-color-scheme: dark)">

          {# Open Graph — см. следующую тему #}
          <link rel="preconnect" href="https://cdn.example.com" crossorigin>
          <link rel="stylesheet" href="/css/main.css">
          <script src="/js/app.js" defer></script>
        </head>
        `,
        { lineNumbers: true, filename: "head.template", collapsed: true },
      ),
      ul(
        "**Заголовок и описание:** формируются из данных страницы (название товара, категория); фолбэк — шаблон по умолчанию, но **не** одинаковый для всех; длины контролируются тестом (предупреждение, не ошибка).",
        "**Canonical:** строится из «чистого» пути страницы без параметров сортировки/фильтров/UTM; всегда абсолютный, с боевым доменом и протоколом из конфигурации (не из `Host` запроса).",
        "**Hreflang:** список альтернатив строится из таблицы переводов; если перевода нет — версия не указывается; `x-default` — английская (или выбор языка). Ссылки двусторонние: набор генерируется одним источником для всех языков.",
        "**Индексация:** `noindex` включается по флагу страницы (корзина, оформление, личный кабинет, внутренний поиск, страницы благодарности) и **везде** вне `production`; на стейджинге дополнительно — HTTP-заголовок `X-Robots-Tag: noindex` и аутентификация (Basic Auth/VPN), потому что `meta` легко потерять, а `robots.txt` не защищает.",
        "**Значки и темы:** SVG + ICO + `apple-touch-icon` + манифест (192/512); `theme-color` для светлой и тёмной схем; `color-scheme` избегает вспышки белого.",
        "**CI:** проверки итогового HTML — один `title`, непустой, уникальный среди страниц; `lang`; `viewport` без `user-scalable=no`; для каждой индексируемой страницы нет `noindex` и canonical совпадает с собственным URL; `hreflang` взаимны; `head` не содержит элементов, закрывающих его (линтер/валидатор).",
        "**Ручные проверки:** view-source; DevTools (элементы в `head`); инструменты поисковых консолей (проверка URL, покрытие); просмотр в мессенджерах; Lighthouse; проверка на мобильных устройствах в светлой и тёмной теме.",
      ),
    ],
  },

  interview: [
    iq("html.head-metadata.i1", "basic", "Что находится в `<head>` и отображается ли оно на странице?", [
      p("Метаданные документа: `title`, `meta`, `link`, `style`, `script`, `base`. Содержимое `head` не отображается как контент, но влияет на вкладку, кодировку, масштаб, поиск и загрузку ресурсов."),
    ]),
    iq("html.head-metadata.i2", "basic", "Зачем нужен `<meta name=\"viewport\">`?", [
      p("Без него мобильные браузеры отрисовывают страницу как «десктопную» шириной около 980px и уменьшают её. `width=device-width, initial-scale=1` заставляет использовать реальную ширину устройства. Нельзя запрещать масштабирование."),
    ]),
    iq("html.head-metadata.i3", "intermediate", "Почему `<meta charset>` нужно ставить первым?", [
      p("Он должен находиться в первых 1024 байтах документа и до любого не-ASCII текста, иначе браузеру придётся перепарсить страницу или угадывать кодировку. Для надёжности сервер также отдаёт `Content-Type` с `charset=utf-8` (заголовок приоритетнее)."),
    ]),
    iq("html.head-metadata.i4", "intermediate", "Чем `robots.txt` отличается от `<meta name=\"robots\">`?", [
      p("`robots.txt` управляет **обходом** (разрешено ли роботу открывать URL). `meta robots` и `X-Robots-Tag` управляют **индексацией и показом**. Если обход закрыт, робот не увидит `noindex`; чтобы убрать страницу из выдачи, нужно разрешить обход и поставить `noindex`."),
    ]),
    iq("html.head-metadata.i5", "intermediate", "Что такое canonical и в каких случаях он нужен?", [
      p("`<link rel=\"canonical\">` сообщает предпочтительный URL среди страниц с одинаковым содержимым (параметры, зеркала, `http`/`https`, `www`). Это подсказка, не команда. На каждой странице ставят самоссылающийся абсолютный canonical; ошибка — один и тот же canonical на всех страницах."),
    ]),
    iq("html.head-metadata.i6", "advanced", "Как работает `hreflang` и какие у него частые ошибки?", [
      ul(
        "Связывает языковые/региональные версии страницы; каждая версия перечисляет **все** версии, включая себя.",
        "Ссылки должны быть **взаимными**; без обратной ссылки сигнал игнорируется.",
        "Используется `x-default` для «остальных» пользователей.",
        "Типичные ошибки: неверные коды языков, относительные URL, ссылки на редиректы, отсутствие самоссылки.",
      ),
    ]),
    iq("html.head-metadata.i7", "engineering", "Как защитить сайт от случайной индексации стейджинга и от случайного `noindex` на продакшене?", [
      ul(
        "Стейджинг закрывают аутентификацией (Basic Auth/VPN) и добавляют `X-Robots-Tag: noindex`; `meta noindex` включают по окружению.",
        "В CI: на продакшен-сборке тест, что у индексируемых страниц нет `noindex`; на стейджинге — что есть.",
        "Мониторинг: проверка `robots`/индексации после релиза (поисковые консоли, синтетические тесты).",
        "Конфигурация окружения в одном месте, а не «закомментированный `meta` в шаблоне».",
      ),
    ]),
    iq("html.head-metadata.i8", "debugging", "`<meta name=\"viewport\">` есть в исходном коде, но не действует. Почему так может быть?", [
      ul(
        "Перед ним в `head` оказался неразрешённый элемент (`div`, текст, `img`) — `head` закрылся, и `meta` попал в `body`.",
        "Присутствуют два `viewport` с конфликтующими значениями.",
        "Мета-тег добавляется скриптом слишком поздно или только на клиенте.",
        "Проверка: в DevTools убедиться, что элемент находится внутри `<head>`, и сравнить view-source с DOM.",
      ),
    ]),
  ],

  exam: [
    mcq("html.head-metadata.e1", "foundation", "Какой элемент задаёт заголовок страницы во вкладке?", ["`<h1>`", "`<title>`", "`<meta name=\"title\">`", "`<header>`"], 1, "`<title>` внутри `head` задаёт название документа: вкладка, закладка, результат поиска, чтение скринридером."),
    mcq("html.head-metadata.e2", "foundation", "Где должен находиться `<meta charset>`?", ["В конце `body`", "В `head`, в первых 1024 байтах", "Только в HTTP-заголовке", "Внутри `<title>`"], 1, "Парсеру нужно определить кодировку до чтения остального текста; поэтому `charset` ставят первым в `head`."),
    mcq("html.head-metadata.e3", "intermediate", "Что делает `<link rel=\"canonical\">`?", ["Запрещает индексацию", "Указывает предпочтительный URL среди дубликатов", "Подключает стили", "Задаёт язык"], 1, "Canonical — подсказка поисковику о главном адресе страницы с похожим содержимым."),
    mcq("html.head-metadata.e4", "intermediate", "Какие утверждения верны? Выберите все.", ["`Disallow` в `robots.txt` гарантирует удаление страницы из выдачи", "`<meta name=\"robots\" content=\"noindex\">` просит не индексировать страницу", "`user-scalable=no` нарушает WCAG 1.4.4", "`<base>` влияет на относительные URL, включая якоря"], [1, 2, 3], "`Disallow` лишь закрывает обход — страница может остаться в выдаче, а `noindex` робот не прочитает."),
    mcq("html.head-metadata.e5", "intermediate", "Что произойдёт с `<meta>` после `<div>` внутри `<head>`?", ["Всё будет работать", "`head` закроется, `meta` окажется в `body` и часто не сработает", "Браузер выдаст ошибку и остановится", "`div` исчезнет"], 1, "Парсер неявно закрывает `head` на неподходящем элементе; последующие метаданные оказываются в `body`."),
    mcq("html.head-metadata.e6", "advanced", "Что важно для корректного `hreflang`?", ["Односторонние ссылки", "Взаимные ссылки между версиями, включая ссылку на себя", "Только относительные URL", "Один и тот же canonical на всех языках"], 1, "Каждая версия должна ссылаться на все версии и на себя, а ссылки должны быть взаимными."),
    open("html.head-metadata.e7", "intermediate", "Объясните, чем `noindex` отличается от запрета в `robots.txt`, и как корректно убрать страницу из поисковой выдачи.", [
      ul(
        "`robots.txt` запрещает **обход** URL, но не индексацию: адрес может остаться в выдаче без описания.",
        "`noindex` (meta или `X-Robots-Tag`) запрещает **индексацию**, но робот должен иметь доступ к странице, чтобы его прочитать.",
        "Корректно: разрешить обход, отдавать `noindex`; для удалённых страниц — 404/410; для конфиденциального — аутентификация.",
      ),
    ], ["Различены обход и индексация", "Названа необходимость доступа для чтения `noindex`", "Предложен корректный способ"], { format: "concept" }),
  ],

  mastery: [
    mcq("html.head-metadata.m1", "intermediate", "Как лучше задать значок сайта для современных браузеров?", ["Только `favicon.ico` 16×16", "SVG-значок + ICO 32×32 + `apple-touch-icon`", "Только PNG 1000×1000", "`<meta name=\"icon\">`"], 1, "Минимальный современный набор: SVG (масштабируется), ICO как запасной вариант, `apple-touch-icon` 180×180 и манифест."),
    mcq("html.head-metadata.m2", "advanced", "Что даёт `<meta name=\"color-scheme\" content=\"light dark\">`?", ["Скрывает страницу", "Сообщает браузеру о поддержке тем: контролы и фон по умолчанию подстраиваются, нет «вспышки» белого", "Включает автоматическую тёмную тему для всех стилей", "Отключает `prefers-color-scheme`"], 1, "Браузер применяет подходящую стандартную раскраску до загрузки CSS, избегая вспышки."),
    mcq("html.head-metadata.m3", "advanced", "Какой подход надёжнее для метаданных страницы, которая должна индексироваться и показывать превью в соцсетях?", ["Генерировать только на клиенте JS", "Отдавать в HTML на сервере (SSR/SSG)", "Хранить в `localStorage`", "Только в HTTP-заголовках"], 1, "Многие боты и сервисы превью не выполняют JavaScript; метаданные должны быть в исходном HTML."),
    open("html.head-metadata.m4", "advanced", "После миграции сайта на новую платформу трафик из поиска упал на 70%. В исходном коде страниц вы видите `noindex` и canonical на главную. Какие гипотезы и шаги проверки вы выдвинете?", [
      ul(
        "Гипотеза 1: `noindex` из стейджинга попал в продакшен-шаблон. Проверка: view-source, заголовок `X-Robots-Tag`, инструмент проверки URL.",
        "Гипотеза 2: canonical «склеивает» сайт в одну страницу. Проверка: значения canonical на разных URL, отчёты о покрытии.",
        "Дополнительно: редиректы со старых URL, `robots.txt`, sitemap, hreflang, метаданные только на клиенте.",
        "Исправление: убрать `noindex`, сделать самоссылающийся canonical, обновить sitemap, запросить повторную индексацию; в CI добавить проверки на эти ошибки.",
      ),
    ], ["Названы noindex и canonical как гипотезы", "Описаны способы проверки", "Предложены исправления и защита в CI"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "html.head-metadata.f1", front: "Порядок начала head?", back: "`charset` (в первых 1024 байтах) → `viewport` → `title` → описание/canonical → значки → стили → скрипты `defer`." },
    { id: "html.head-metadata.f2", front: "`robots.txt` vs `noindex`?", back: "`robots.txt` — обход; `noindex` — индексация. Закрытая от обхода страница `noindex` не покажет." },
    { id: "html.head-metadata.f3", front: "Что должен содержать canonical?", back: "Абсолютный предпочтительный URL; на каждой странице — самоссылающийся." },
    { id: "html.head-metadata.f4", front: "`hreflang`?", back: "Версии по языкам/регионам; взаимные ссылки, включая себя; `x-default`." },
    { id: "html.head-metadata.f5", front: "Что закрывает `head` неявно?", back: "Первый неразрешённый элемент или текст (`div`, `img`, символ): последующие `meta`/`link` окажутся в `body`." },
    { id: "html.head-metadata.f6", front: "Что делает `<base>`?", back: "Меняет базу для всех относительных URL, включая якоря `#id`. Один элемент, до использования ссылок." },
  ],

  sources: [
    { title: "HTML Living Standard — Document metadata", url: "https://html.spec.whatwg.org/multipage/semantics.html#document-metadata", publisher: "WHATWG" },
    { title: "MDN: <meta>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta", publisher: "MDN" },
    { title: "MDN: <link>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link", publisher: "MDN" },
    { title: "MDN: <title>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title", publisher: "MDN" },
    { title: "MDN: <base>", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base", publisher: "MDN" },
    { title: "Google Search Central: Robots meta tag specifications", url: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag", publisher: "Other" },
    { title: "Google Search Central: Consolidate duplicate URLs (canonical)", url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls", publisher: "Other" },
    { title: "Google Search Central: Localized versions of your pages (hreflang)", url: "https://developers.google.com/search/docs/specialty/international/localized-versions", publisher: "Other" },
  ],
};
