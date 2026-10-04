import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p03Blog: Project = {
  id: "html.p03-blog",
  domain: "html",
  order: 3,
  title: "Блог с длинной статьёй",
  subtitle: "Лента записей, страница статьи с оглавлением, сносками и таблицей сравнения, хлебные крошки, пагинация и RSS — вся семантика текстового контента.",
  level: "core",
  estimatedHours: 8,
  buildsOn: ["html.p02-portfolio"],
  topics: [
    "html.headings-paragraphs",
    "html.inline-text",
    "html.lists",
    "html.sectioning",
    "html.content-semantics",
    "html.tables-structure",
    "html.tables-accessibility",
    "html.navigation-patterns",
    "html.head-metadata",
  ],
  objective:
    "Построить **текстовый сайт**, который одинаково хорошо читается людьми, скринридерами и поисковыми роботами: лента записей, страница статьи с оглавлением, сносками, цитатами, кодом и **доступной таблицей сравнения**, навигация (крошки, «назад/вперёд», пагинация) и лента RSS.",
  scenario: [
    p("Илья Смирнов ведёт блог «Код и кофе» о веб-разработке. Сейчас записи лежат в одном длинном документе без структуры: заголовки сделаны жирным шрифтом, таблица — картинкой, а ссылки на предыдущую и следующую записи отсутствуют. Читатели не находят нужное, а поисковик показывает одинаковые заголовки у всех страниц."),
    p("Вам нужно переделать блог на семантический HTML. Достаточно трёх типов страниц: **список записей**, **страница статьи** и **страница тега** — плюс RSS-лента. Тема для главной статьи — «JPEG, PNG, WebP, AVIF или SVG: какой формат выбрать» (по материалам курса). Статья содержит сравнительную таблицу, цитату, фрагмент кода, горячие клавиши и сноски."),
    note("Оболочку (шапка/подвал/ссылка-пропуск) возьмите из прошлого проекта. Подумайте, как не копировать её в десятки файлов, — в проекте 5 вы научитесь делать это шаблонами, а пока можно скопировать один раз для трёх страниц."),
  ],
  requirements: [
    "Три HTML-страницы: `index.html` (лента), `posts/image-formats.html` (статья), `tags/images.html` (записи с тегом) и `feed.xml` (RSS 2.0).",
    "Лента: `h1`, список из 5 превью; каждое — `article` с заголовком-ссылкой `h2 > a`, `time[datetime]`, коротким описанием и списком тегов; **без** ссылок «Читать далее».",
    "Пагинация: `nav aria-label=\"Страницы блога\"` со ссылками «Назад», «1», «2» (текущая — `aria-current=\"page\"`), «Вперёд».",
    "Статья: `article` > `header` (`h1`, автор в `address` со ссылкой `rel=\"author\"`, дата публикации и обновления в `time`), оглавление (`nav aria-label=\"Содержание\"` со ссылками-якорями на `h2`), разделы с `h2/h3`.",
    "Содержимое статьи использует осмысленные элементы: `figure` + `figcaption` (с кодом в `pre > code`), `blockquote` с `cite`, `kbd` для клавиш, `abbr` для аббревиатур, `mark` для выделения найденного, `code` в тексте, `del`/`ins` для правки, `q` или `lang` для иноязычной фразы.",
    "Таблица сравнения форматов: `caption`, `thead`, `tbody`, `th scope=\"col\"` и `th scope=\"row\"`, не менее 5 строк и 5 столбцов.",
    "Сноски: ссылка `sup > a` в тексте и блок сносок `ol` внизу с обратными ссылками; роли DPUB-ARIA (`doc-noteref`, `doc-endnotes`, `doc-backlink`) — по желанию.",
    "Хлебные крошки на статье и теге (`nav aria-label=\"Хлебные крошки\"`, `ol`, последний пункт — текущая страница без ссылки).",
    "Навигация «Предыдущая / Следующая запись» с `rel=\"prev\"` и `rel=\"next\"` и названиями записей.",
    "Метаданные: уникальные `title` и `description`, `canonical`, `link rel=\"alternate\" type=\"application/rss+xml\"` на каждой странице.",
    "`feed.xml`: корректный RSS 2.0 с `title`, `link`, `description`, `language` и пятью `item` (`title`, `link`, `guid`, `pubDate`, `description`).",
  ],
  constraints: [
    "Без JavaScript; оформление — по желанию, но таблица и код должны оставаться читаемыми без CSS.",
    "Таблица — только настоящая `table`; никаких картинок с таблицами и вёрстки таблицами.",
    "Никаких «Читать далее», «Здесь», «Подробнее» как текстов ссылок.",
    "Заголовки только по иерархии; в статье один `h1`.",
    "Содержание полное и правдоподобное: статья — не менее 600 слов, 4 раздела `h2`.",
  ],
  expected: [
    "Скринридер строит оглавление страницы из заголовков, озвучивает подпись таблицы и заголовки строк/столбцов при перемещении по ячейкам.",
    "Читатель переходит по оглавлению, возвращается из сноски по обратной ссылке и листает записи «вперёд/назад».",
    "Поисковик получает уникальные заголовки и описания; RSS-клиент подписывается на ленту.",
    "В режиме чтения браузера статья отображается чисто: заголовок, автор, дата, текст, таблица.",
    "Страницы проходят валидатор; `feed.xml` — валидатор RSS/XML.",
  ],
  technical: [
    "Структура: `index.html`, `posts/*.html`, `tags/*.html`, `feed.xml`, `style.css` (по желанию), `img/`.",
    "Адреса — корневые (`/posts/image-formats.html`) или единообразно относительные; проверьте, что страницы разной глубины находят `style.css`.",
    "Даты — в формате ISO 8601 (`2026-03-14`); в RSS — RFC 822 (`Sat, 14 Mar 2026 10:00:00 +0300`).",
    "Фрагмент кода — в `pre > code` с `lang`-классом по желанию; длинные строки не обрезаются.",
    "Проверка: Nu Html Checker, axe, чтение с клавиатуры и скринридером; проверка ленты в любом RSS-читателе.",
  ],
  acceptance: [
    "Валидатор Nu Html Checker не показывает ошибок на трёх страницах.",
    "В статье ровно один `h1`, четыре и более `h2`, оглавление ведёт на каждый `h2`.",
    "Таблица имеет `caption`, `th scope=\"col\"` в шапке и `th scope=\"row\"` в первом столбце; нет пустых `th`.",
    "Сноски работают в обе стороны: из текста в блок сносок и обратно.",
    "Использованы `figure`/`figcaption`, `blockquote[cite]`, `kbd`, `abbr[title]`, `time[datetime]`, `address`.",
    "В ленте и на странице тега нет ссылок «Читать далее»; текст каждой ссылки понятен вне контекста.",
    "На каждой странице есть `link rel=\"alternate\"` на RSS, уникальные `title`, `description`, `canonical`.",
    "`feed.xml` содержит пять корректных `item` и открывается без ошибок в RSS-читателе.",
  ],
  hints: [
    "Сначала составьте **план статьи**: `h1`, четыре `h2` (например, «Что такое формат», «Растровые форматы», «SVG», «Как выбрать»). Только потом пишите текст — структура определяет разметку.",
    "Оглавление — это `ol` или `ul` внутри `nav` с `aria-label`. Каждому `h2` задайте `id` (латиницей), а в оглавлении ссылайтесь на него (`href=\"#raster\"`).",
    "В таблице первая колонка — **названия форматов**, поэтому в каждой строке первая ячейка — `th scope=\"row\"`, а не `td`. Пустую угловую ячейку заполните текстом («Формат»).",
    "Для сноски создайте пару ссылок: `<sup><a id=\"fnref1\" href=\"#fn1\">1</a></sup>` в тексте и `<li id=\"fn1\">… <a href=\"#fnref1\">↩</a></li>` в списке сносок. Подпись обратной ссылки сделайте понятной (`aria-label=\"Вернуться к тексту\"`).",
    "Название записи — единственный текст ссылки в превью. Если нужна «подпись действия», добавьте контекст в само название или используйте `aria-label` с названием, но видимого «Читать далее» быть не должно.",
    "RSS проще всего писать вручную по шаблону: корень `rss version=\"2.0\"`, внутри `channel` и повторяющиеся `item`. Не забудьте экранировать `&`, `<` в тексте и использовать `CDATA` для HTML в `description`.",
  ],
  advanced: [
    "Добавьте структурированные данные `BlogPosting` (JSON-LD) для статьи и `BreadcrumbList` для крошек.",
    "Реализуйте страницы пагинации 1–2 и тега без дублей: у каждой свой `canonical` и `title`.",
    "Добавьте печатный стиль: скрыть навигацию, показывать адреса ссылок, не разрывать таблицу.",
    "Подготовьте файл `sitemap.xml` и `robots.txt` для блога.",
    "Автоматизируйте проверку: скрипт, который открывает страницы и сверяет заголовки, `alt` и ссылки (по образцу мини-линтера из темы «Качество HTML»).",
  ],
  failureModes: [
    "**Таблица картинкой** или `div`-сеткой: данные не читаются скринридером и не копируются.",
    "**Таблица без `scope` и `caption`:** при навигации по ячейкам скринридер не озвучивает заголовки.",
    "**«Читать далее» ×5:** в списке ссылок скринридера пять одинаковых пунктов.",
    "**Заголовки для размера шрифта:** `h4` вместо `p`, пропуск `h2 → h4`, несколько `h1`.",
    "**Сноски без обратных ссылок:** читатель теряет место в тексте.",
    "**Одинаковые `title` и `description`** у ленты, статьи и тега.",
    "**Битый RSS:** неэкранированные `&`, даты не в RFC 822, отсутствует `guid`.",
  ],
  rubric: [
    { criterion: "Семантика статьи", weight: 25, description: "`article`, `header`, `address`, `time`, `figure`, `blockquote`, `kbd`, `abbr`, `mark`, `del/ins`, структура заголовков." },
    { criterion: "Таблица и данные", weight: 15, description: "`caption`, `thead/tbody`, `th scope`, осмысленное содержание и читаемость без CSS." },
    { criterion: "Навигация", weight: 15, description: "Оглавление, крошки, пагинация, «предыдущая/следующая», сноски в обе стороны." },
    { criterion: "Метаданные и RSS", weight: 10, description: "Уникальные `title`/`description`/`canonical`, `alternate` на RSS, корректный `feed.xml`." },
    { criterion: "Доступность", weight: 20, description: "Тексты ссылок, имена навигаций, заголовки, клавиатура и скринридер, язык вставок." },
    { criterion: "Валидность и качество кода", weight: 15, description: "Валидатор, единый стиль, уникальные `id`, отсутствие устаревшего и встроенного." },
  ],
  solution: [
    p("Эталон показывает страницу статьи (самую насыщенную), ленту и RSS. Страница тега устроена как лента с фильтром по тегу."),
    h("Страница статьи"),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>JPEG, PNG, WebP, AVIF или SVG: какой формат выбрать — Код и кофе</title>
        <meta name="description" content="Сравнение пяти форматов изображений для веб: сжатие, прозрачность, анимация, поддержка и типичные сценарии. Таблица и практические правила выбора.">
        <link rel="canonical" href="https://example.com/posts/image-formats.html">
        <link rel="alternate" type="application/rss+xml" title="Код и кофе — RSS" href="/feed.xml">
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>
        <header class="site-header">
          <a class="logo" href="/">Код и кофе</a>
          <nav aria-label="Основная">
            <ul>
              <li><a href="/" aria-current="page">Блог</a></li>
              <li><a href="/tags/">Теги</a></li>
              <li><a href="/feed.xml">RSS</a></li>
            </ul>
          </nav>
        </header>

        <main id="main">
          <nav aria-label="Хлебные крошки">
            <ol>
              <li><a href="/">Блог</a></li>
              <li><a href="/tags/images.html">Изображения</a></li>
              <li aria-current="page">Какой формат выбрать</li>
            </ol>
          </nav>

          <article>
            <header>
              <h1>JPEG, PNG, WebP, AVIF или SVG: какой формат выбрать</h1>
              <p>
                Автор: <a href="/authors/ilya.html" rel="author">Илья Смирнов</a>.
                Опубликовано <time datetime="2026-03-14">14 марта 2026</time>,
                обновлено <time datetime="2026-03-20">20 марта 2026</time>.
              </p>
              <p>Время чтения: около 6 минут.</p>
            </header>

            <nav aria-label="Содержание">
              <h2>Содержание</h2>
              <ol>
                <li><a href="#what">Что такое формат изображения</a></li>
                <li><a href="#raster">Растровые форматы</a></li>
                <li><a href="#svg">Векторный формат SVG</a></li>
                <li><a href="#choose">Как выбрать</a></li>
              </ol>
            </nav>

            <section id="what" aria-labelledby="what-title">
              <h2 id="what-title">Что такое формат изображения</h2>
              <p>Формат определяет, как картинка хранится в файле: какие данные сохраняются, как они <strong>сжимаются</strong> и что умеет браузер. От выбора зависят вес страницы и скорость загрузки.<sup><a id="fnref1" href="#fn1" role="doc-noteref">1</a></sup></p>
              <p>В документации принято различать сжатие <dfn>с потерями</dfn> (часть данных отбрасывается) и <dfn>без потерь</dfn> (картинку можно восстановить в точности).</p>
            </section>

            <section id="raster" aria-labelledby="raster-title">
              <h2 id="raster-title">Растровые форматы</h2>
              <p>Растровая картинка — это сетка пикселей. Сравним четыре формата, которые используют чаще всего.</p>

              <table>
                <caption>Сравнение форматов изображений для веб</caption>
                <thead>
                  <tr>
                    <th scope="col">Формат</th>
                    <th scope="col">Сжатие</th>
                    <th scope="col">Прозрачность</th>
                    <th scope="col">Анимация</th>
                    <th scope="col">Лучше всего для</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><th scope="row">JPEG</th><td>с потерями</td><td>нет</td><td>нет</td><td>фотографий</td></tr>
                  <tr><th scope="row">PNG</th><td>без потерь</td><td>да</td><td>нет</td><td>скриншотов и графики с прозрачностью</td></tr>
                  <tr><th scope="row">WebP</th><td>с потерями и без</td><td>да</td><td>да</td><td>универсального применения</td></tr>
                  <tr><th scope="row">AVIF</th><td>с потерями и без</td><td>да</td><td>да</td><td>фотографий при минимальном весе</td></tr>
                  <tr><th scope="row">SVG</th><td>векторный (текст)</td><td>да</td><td>средствами CSS/SMIL</td><td>иконок и логотипов</td></tr>
                </tbody>
              </table>

              <p><del>JPEG подходит для любых изображений</del> <ins>JPEG подходит для фотографий, а для графики с резкими краями лучше PNG, WebP или SVG</ins>.</p>

              <figure>
                <pre><code>&lt;picture&gt;
        &lt;source type="image/avif" srcset="photo.avif"&gt;
        &lt;source type="image/webp" srcset="photo.webp"&gt;
        &lt;img src="photo.jpg" alt="Описание" width="800" height="600"&gt;
      &lt;/picture&gt;</code></pre>
                <figcaption>Подбор формата с запасным вариантом через <code>picture</code>.</figcaption>
              </figure>
            </section>

            <section id="svg" aria-labelledby="svg-title">
              <h2 id="svg-title">Векторный формат SVG</h2>
              <p>SVG описывает фигуры текстом, поэтому масштабируется без потери качества. Откройте код логотипа в редакторе — это обычный текст, который можно сжать и стилизовать.</p>
              <blockquote cite="https://developer.mozilla.org/en-US/docs/Web/SVG">
                <p><q lang="en">SVG is a markup language for describing two-dimensional vector graphics.</q></p>
                <footer>— документация <cite>MDN Web Docs</cite></footer>
              </blockquote>
              <p>Чтобы просмотреть исходный код элемента в браузере, нажмите <kbd>Ctrl</kbd>+<kbd>U</kbd> (или <kbd>⌥</kbd>+<kbd>⌘</kbd>+<kbd>U</kbd> на macOS).</p>
            </section>

            <section id="choose" aria-labelledby="choose-title">
              <h2 id="choose-title">Как выбрать</h2>
              <ol>
                <li>Фотография: <mark>AVIF</mark> или WebP с запасным JPEG.</li>
                <li>Скриншот или схема с текстом: PNG или WebP без потерь.</li>
                <li>Логотип и иконки: SVG.</li>
              </ol>
              <p>Проверяйте результат по весу файла и по качеству на целевом устройстве — формат всегда компромисс между этими двумя величинами.</p>
            </section>

            <section id="notes" role="doc-endnotes" aria-labelledby="notes-title">
              <h2 id="notes-title">Примечания</h2>
              <ol>
                <li id="fn1">Вес изображений обычно составляет большую часть передаваемых данных страницы. <a href="#fnref1" role="doc-backlink" aria-label="Вернуться к тексту">↩</a></li>
              </ol>
            </section>

            <footer>
              <p>Теги: <a href="/tags/images.html" rel="tag">изображения</a>, <a href="/tags/performance.html" rel="tag">производительность</a></p>
            </footer>
          </article>

          <nav aria-label="Другие записи">
            <ul>
              <li><a href="/posts/semantic-html.html" rel="prev">← Предыдущая: Зачем нужен семантический HTML</a></li>
              <li><a href="/posts/forms-basics.html" rel="next">Следующая: Формы без JavaScript →</a></li>
            </ul>
          </nav>
        </main>

        <footer class="site-footer">
          <p><small>© 2026 Илья Смирнов</small></p>
        </footer>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "posts/image-formats.html", collapsed: true },
    ),
    h("Лента записей"),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Код и кофе — блог о веб-разработке</title>
        <meta name="description" content="Блог Ильи Смирнова о веб-разработке: семантический HTML, доступность, производительность и инструменты. Свежие записи и архив.">
        <link rel="canonical" href="https://example.com/">
        <link rel="alternate" type="application/rss+xml" title="Код и кофе — RSS" href="/feed.xml">
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>
        <header class="site-header">
          <a class="logo" href="/">Код и кофе</a>
          <nav aria-label="Основная">
            <ul>
              <li><a href="/" aria-current="page">Блог</a></li>
              <li><a href="/tags/">Теги</a></li>
              <li><a href="/feed.xml">RSS</a></li>
            </ul>
          </nav>
        </header>

        <main id="main">
          <h1>Записи блога</h1>
          <ul class="posts">
            <li>
              <article>
                <h2><a href="/posts/image-formats.html">JPEG, PNG, WebP, AVIF или SVG: какой формат выбрать</a></h2>
                <p><time datetime="2026-03-14">14 марта 2026</time></p>
                <p>Сравниваем форматы изображений: сжатие, прозрачность, анимация и типичные сценарии. Таблица и правила выбора.</p>
                <ul aria-label="Теги записи">
                  <li><a href="/tags/images.html" rel="tag">изображения</a></li>
                  <li><a href="/tags/performance.html" rel="tag">производительность</a></li>
                </ul>
              </article>
            </li>
            <li>
              <article>
                <h2><a href="/posts/semantic-html.html">Зачем нужен семантический HTML</a></h2>
                <p><time datetime="2026-03-02">2 марта 2026</time></p>
                <p>Как структура разметки влияет на доступность, поиск и поддержку проекта — на примерах «до» и «после».</p>
                <ul aria-label="Теги записи">
                  <li><a href="/tags/html.html" rel="tag">html</a></li>
                </ul>
              </article>
            </li>
            <!-- ещё три превью по тому же образцу -->
          </ul>

          <nav aria-label="Страницы блога">
            <ul>
              <li><span aria-hidden="true">← Назад</span></li>
              <li><a href="/" aria-current="page">1</a></li>
              <li><a href="/page/2.html">2</a></li>
              <li><a href="/page/2.html" rel="next">Вперёд →</a></li>
            </ul>
          </nav>
        </main>

        <footer class="site-footer">
          <p><small>© 2026 Илья Смирнов</small></p>
        </footer>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "index.html", collapsed: true },
    ),
    h("RSS-лента"),
    code(
      "html",
      `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Код и кофе</title>
          <link>https://example.com/</link>
          <description>Блог Ильи Смирнова о веб-разработке</description>
          <language>ru</language>
          <item>
            <title>JPEG, PNG, WebP, AVIF или SVG: какой формат выбрать</title>
            <link>https://example.com/posts/image-formats.html</link>
            <guid isPermaLink="true">https://example.com/posts/image-formats.html</guid>
            <pubDate>Sat, 14 Mar 2026 10:00:00 +0300</pubDate>
            <description><![CDATA[Сравниваем форматы изображений: сжатие, прозрачность, анимация и типичные сценарии.]]></description>
          </item>
          <!-- ещё четыре item -->
        </channel>
      </rss>
      `,
      { filename: "feed.xml" },
    ),
    table(
      ["Решение", "Зачем"],
      [
        ["`nav aria-label` у каждого навигационного блока", "Основное меню, оглавление, крошки, пагинация и «другие записи» различимы в списке ориентиров"],
        ["`th scope=\"row\"` в первом столбце", "При движении по строке читалка называет формат: «PNG, сжатие без потерь…»"],
        ["`<caption>` вместо заголовка над таблицей", "Подпись программно связана с таблицей и озвучивается при входе"],
        ["`role=\"doc-endnotes\"` и `doc-backlink`", "Скринридер сообщает, что это сноски, и позволяет вернуться к тексту"],
        ["Заголовок записи как текст ссылки", "Ссылка понятна вне контекста; нет «Читать далее»"],
        ["`del`/`ins` вместо зачёркивания стилем", "Правка записана в разметке и озвучивается, при необходимости — со временем"],
        ["`kbd` для сочетаний клавиш", "Смысловая разметка ввода: можно стилизовать как клавиши, а читалка различает"],
      ],
      "Ключевые решения",
    ),
    warn("Таблица должна быть доступна в режиме без CSS. Если вы «красиво» скрыли `caption` (display: none), он пропадёт и для скринридера — используйте визуально скрытый стиль, но не `display: none`."),
    tip("В проекте 5 вы вынесете оболочку (шапка, подвал, `head`) в шаблон, чтобы её не приходилось копировать в каждый файл."),
  ],
};
