import type { Project } from "../../types";
import { code, h, note, p, table, tip, ul, warn } from "../../dsl";

export const p04Docs: Project = {
  id: "html.p04-docs",
  domain: "html",
  order: 4,
  title: "Портал документации",
  subtitle: "Многостраничная документация API с боковой навигацией, оглавлением страницы, поиском и доступной формой обратной связи — включая состояния ошибки и успеха.",
  level: "intermediate",
  estimatedHours: 10,
  buildsOn: ["html.p03-blog"],
  topics: [
    "html.forms-basics",
    "html.input-types",
    "html.form-controls",
    "html.form-validation",
    "html.form-ux-autocomplete",
    "html.accessible-forms",
    "html.interactive-elements",
    "html.navigation-patterns",
    "html.content-semantics",
  ],
  objective:
    "Спроектировать **документацию с поиском и формами**, которая работает без JavaScript: боковая навигация, оглавление страницы, технические блоки (код, параметры, таблицы ошибок), форма поиска (`GET`), форма обратной связи с серверной проверкой и **полным набором состояний** — по умолчанию, ошибка, успех, пустой результат.",
  scenario: [
    p("Сервис «Таймер» (учёт рабочего времени) открывает публичное API и нуждается в портале документации. Разработчики-интеграторы приходят по поисковым запросам на конкретную страницу, читают её, копируют пример и возвращаются в код. Им важны: быстрый поиск, понятная навигация, примеры, которые можно скопировать, и возможность сообщить, что в документации ошибка."),
    p("Нужно собрать семь страниц: главную документации, «Быстрый старт», «Аутентификация», «Лимиты и ошибки», страницу поиска, страницу «Спасибо» и страницу «Ошибка в форме обратной связи». На каждой странице документации внизу — форма «Страница помогла?». Форма обязана корректно работать **без JavaScript**, а при ошибках — возвращать пользователя на страницу с понятными сообщениями и сохранёнными данными."),
    note("Для проверки форм вам понадобится минимальный локальный сервер (код в решении) — он принимает `POST /feedback`, валидирует данные и возвращает либо страницу ошибок, либо перенаправление на страницу благодарности."),
  ],
  requirements: [
    "Семь страниц: `docs/index.html`, `docs/quickstart.html`, `docs/auth.html`, `docs/errors.html`, `search.html`, `feedback-thanks.html`, `feedback-error.html` с общей оболочкой документации.",
    "Шапка: логотип-ссылка, поиск (`search` / `form role=\"search\"`, метод `GET`, `input type=\"search\" name=\"q\"` с меткой, `enterkeyhint=\"search\"`), переключатель версии API (`select name=\"v\"` в GET-форме с кнопкой «Перейти» — работает без JS).",
    "Боковая навигация `nav aria-label=\"Разделы документации\"` с группами в `details` («Начало работы», «Справочник»), текущая страница — `aria-current=\"page\"`.",
    "Страница документации: `article`, `h1`, дата обновления в `time`, оглавление `nav aria-label=\"На этой странице\"` с якорями на `h2`, ссылки-якоря у заголовков (`a` с понятным `aria-label`).",
    "Технические блоки: примеры кода в `pre > code` с подписью (`figure` + `figcaption`), параметры запроса — в `dl`, таблица кодов ошибок (`caption`, `th scope`), предупреждения и заметки — `aside` с заголовком.",
    "Глоссарий: хотя бы два термина с пояснением во всплывающей панели (`button[popovertarget]` + элемент `popover`) и запасным вариантом без поддержки (`dfn` с текстом рядом).",
    "Форма обратной связи под каждой статьёй: `fieldset`/`legend` «Страница помогла?» (радио «Да/Нет/Частично», `required`), `label` + `textarea` (`maxlength=\"500\"`), необязательное поле почты (`type=\"email\"`, `autocomplete=\"email\"`), скрытое поле `page`, кнопка `type=\"submit\"`.",
    "Страница ошибки формы: `title` с «Ошибка:», сводка ошибок со ссылками на поля, сообщения у полей через `aria-describedby`, `aria-invalid`, сохранённые значения.",
    "Страница поиска: форма с сохранённым запросом, число результатов в `role=\"status\"`, список результатов (`ol`) с подсветкой `mark`, пагинация ссылками и пустое состояние с подсказками.",
    "Метаданные: уникальные `title`/`description`/`canonical`; у страницы поиска и результатов — `<meta name=\"robots\" content=\"noindex\">`.",
  ],
  constraints: [
    "Все основные функции (навигация, поиск, форма) должны работать без JavaScript; JS допустим только как улучшение (до 40 строк).",
    "Валидацию нельзя реализовывать только скриптом: сервер обязан проверять данные.",
    "`placeholder` не заменяет `label`; обязательность отмечена словами и атрибутом `required`.",
    "Без CSS-фреймворков и без `style=\"…\"`; стили — по желанию.",
    "Все сообщения об ошибках — текстом, с указанием, как исправить.",
  ],
  expected: [
    "Разработчик попадает на `docs/auth.html`, видит боковое меню и оглавление, копирует пример, нажимает «Да, страница помогла» и отправляет форму — получает страницу благодарности.",
    "При пустом выборе радио форма возвращает ошибку на странице `feedback-error.html` с фокусом на сводке, а введённый комментарий и почта сохраняются.",
    "Поиск по запросу формирует URL вида `/search.html?q=токен&v=v2` — его можно сохранить и поделиться.",
    "Скринридер объявляет заголовок страницы, ориентиры, имена навигаций, число результатов и ошибки формы.",
    "Клавиатурой можно пройти сайт целиком: поиск → меню → оглавление → форма; фокус всегда виден.",
  ],
  technical: [
    "Структура: `docs/…`, `search.html`, `feedback-*.html`, `style.css`, `server.mjs` (учебный сервер без зависимостей).",
    "`POST /feedback` → при ошибках ответ `422` и страница ошибок; при успехе — `303 See Other` на `/feedback-thanks.html` (шаблон Post/Redirect/Get).",
    "Поля формы имеют `name`, `id`, `autocomplete` там, где применимо; радио объединены общим `name`.",
    "Ошибки: `aria-invalid=\"true\"`, `aria-describedby` на сообщения, сводка со ссылками `#id` и `tabindex=\"-1\"` для переноса фокуса.",
    "Проверка: Nu Html Checker, axe, ручной прогон клавиатурой и скринридером, отправка формы с корректными и некорректными данными.",
  ],
  acceptance: [
    "Все семь страниц проходят валидатор без ошибок.",
    "Оболочка идентична на страницах документации; текущая страница отмечена в боковом меню.",
    "Поиск и переключатель версии — `GET`-формы с метками; работают без JavaScript.",
    "Форма обратной связи: у каждого поля есть видимая метка; радио в `fieldset` с `legend`; обязательность выражена `required` и текстом.",
    "Сервер возвращает `422` с `feedback-error`-страницей при ошибках и `303` на страницу благодарности при успехе; значения полей сохраняются (кроме технических).",
    "На странице ошибки: `title` начинается с «Ошибка:», сводка со ссылками на поля, `aria-invalid` и `aria-describedby` у проблемных полей.",
    "Таблица ошибок имеет `caption` и `th scope`; параметры оформлены в `dl`; примеры кода — в `figure` с подписью.",
    "Страница поиска показывает число результатов в `role=\"status\"`, пустое состояние и пагинацию ссылками; `noindex` выставлен.",
  ],
  hints: [
    "Начните с **одной** страницы документации и её формы. Когда она работает, остальные получаются копированием оболочки и заменой содержимого.",
    "Радио-группа: общий `name=\"helpful\"`, `required` достаточно поставить на одну кнопку. Сообщение об ошибке привяжите к `fieldset` через `aria-describedby`, а в сводке ссылайтесь на **первую** радиокнопку.",
    "Чтобы сервер вернул введённые значения, шаблон ошибки подставляет их в `value` (для `input`) и в содержимое `textarea` — не забудьте **экранировать** (`&`, `<`, `>`, `\"`).",
    "Для `popover`: кнопка с `popovertarget=\"gl-token\"` и элемент `<div id=\"gl-token\" popover>`. Без поддержки браузера объяснение терминов должно остаться доступным — продублируйте его в разделе «Глоссарий» внизу страницы.",
    "Форма поиска должна использовать `method=\"get\"` и `name=\"q\"`; тогда результат автоматически получает URL с параметрами и открывается по ссылке.",
    "Тестируйте отправку формы **и без JS** (отключите скрипты в DevTools) — всё должно работать так же.",
  ],
  advanced: [
    "Добавьте модальное окно «Горячие клавиши» (`<dialog>` + кнопка) как прогрессивное улучшение: без JS кнопка скрыта, а список клавиш доступен на отдельной странице.",
    "Реализуйте улучшение через `fetch`: отправка формы без перезагрузки с откатом к обычной отправке при ошибке.",
    "Добавьте копирование кода по кнопке (`navigator.clipboard`) с объявлением результата через `role=\"status\"`.",
    "Сделайте страницу устаревшей версии с баннером и `canonical` на актуальную страницу.",
    "Подключите статический поиск (Pagefind или Lunr) как улучшение, сохранив работающую форму `GET`.",
  ],
  failureModes: [
    "**Форма только на JS:** `div` и `onclick` вместо `form`, при отключённых скриптах ничего не отправляется.",
    "**Валидация только на клиенте:** сервер принимает пустую отправку; ошибки показываются «алертом».",
    "**Placeholder вместо метки** и красная рамка как единственный сигнал ошибки.",
    "**Сообщения «Неверно»:** без объяснения, что исправить, и без привязки к полю.",
    "**Потеря данных:** после ошибки форма очищена, пользователь вводит комментарий заново.",
    "**Радио без `fieldset`/`legend`:** непонятно, о чём вопрос; `required` не работает на группе.",
    "**Оглавление без якорей** или якоря на несуществующие `id`; дубликаты `id` из-за копирования блоков.",
    "**Таблица ошибок без `scope`** и примеры кода без подписей и языка.",
  ],
  rubric: [
    { criterion: "Формы и валидация", weight: 25, description: "Метки, группы, типы и атрибуты, `required`/`maxlength`, серверная проверка, PRG, сохранение значений." },
    { criterion: "Состояния и сообщения об ошибках", weight: 15, description: "Сводка и сообщения у полей, `aria-invalid`/`aria-describedby`, `title` с «Ошибка:», успех, пустой поиск." },
    { criterion: "Навигация и структура документации", weight: 20, description: "Боковое меню, оглавление, якоря, крошки/версии, поиск `GET`, одинаковая оболочка." },
    { criterion: "Семантика технического содержимого", weight: 15, description: "`dl`, таблицы с `scope`, `figure` для кода, `aside`, `time`, `dfn`/popover." },
    { criterion: "Доступность", weight: 15, description: "Клавиатура, фокус, ориентиры с именами, понятные ссылки и сообщения, работа без JS." },
    { criterion: "Метаданные и качество кода", weight: 10, description: "`title`/`description`/`canonical`/`noindex`, валидатор, уникальные `id`, единый стиль." },
  ],
  solution: [
    p("Эталон показывает типичную страницу документации (`docs/auth.html`) с формой, страницу поиска и **серверно сгенерированное** состояние ошибки формы, а также учебный сервер."),
    h("Страница документации"),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Аутентификация — API Таймера v2</title>
        <meta name="description" content="Как передавать ключ API в запросах к Таймеру: заголовок Authorization, формат ключа, примеры curl и ответы при ошибках аутентификации.">
        <link rel="canonical" href="https://example.com/docs/auth.html">
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>

        <header class="site-header">
          <a class="logo" href="/docs/">Таймер API</a>
          <form role="search" action="/search.html" method="get">
            <label for="q">Поиск по документации</label>
            <input id="q" name="q" type="search" enterkeyhint="search" autocomplete="off" required>
            <input type="hidden" name="v" value="v2">
            <button type="submit">Найти</button>
          </form>
          <form action="/docs/" method="get" class="version">
            <label for="v">Версия API</label>
            <select id="v" name="v">
              <option value="v2" selected>v2 (актуальная)</option>
              <option value="v1">v1 (устаревшая)</option>
            </select>
            <button type="submit">Перейти</button>
          </form>
        </header>

        <div class="layout">
          <nav aria-label="Разделы документации" class="sidebar">
            <details open>
              <summary>Начало работы</summary>
              <ul>
                <li><a href="/docs/">Обзор</a></li>
                <li><a href="/docs/quickstart.html">Быстрый старт</a></li>
                <li><a href="/docs/auth.html" aria-current="page">Аутентификация</a></li>
              </ul>
            </details>
            <details open>
              <summary>Справочник</summary>
              <ul>
                <li><a href="/docs/errors.html">Лимиты и ошибки</a></li>
              </ul>
            </details>
          </nav>

          <main id="main" tabindex="-1">
            <article>
              <header>
                <h1>Аутентификация</h1>
                <p>Обновлено <time datetime="2026-03-18">18 марта 2026</time></p>
              </header>

              <nav aria-label="На этой странице">
                <h2>На этой странице</h2>
                <ol>
                  <li><a href="#key">Ключ API</a></li>
                  <li><a href="#request">Как передать ключ</a></li>
                  <li><a href="#errors">Ошибки аутентификации</a></li>
                </ol>
              </nav>

              <section id="key" aria-labelledby="key-title">
                <h2 id="key-title">Ключ API <a class="anchor" href="#key" aria-label="Ссылка на раздел «Ключ API»">#</a></h2>
                <p>Каждый запрос подписывается ключом API. Создайте его в разделе «Интеграции» личного кабинета. Ключ показывается один раз — сохраните его в безопасном месте.</p>
                <aside aria-labelledby="warn-title">
                  <h3 id="warn-title">Важно</h3>
                  <p>Не публикуйте ключ в репозитории и не передавайте его в адресной строке: он попадёт в журналы серверов и историю браузера.</p>
                </aside>
              </section>

              <section id="request" aria-labelledby="request-title">
                <h2 id="request-title">Как передать ключ <a class="anchor" href="#request" aria-label="Ссылка на раздел «Как передать ключ»">#</a></h2>
                <p>Передавайте ключ в заголовке <code>Authorization</code> со схемой <code>Bearer</code>.</p>
                <figure>
                  <pre><code class="language-bash">curl https://api.example.com/v2/projects \\
        -H "Authorization: Bearer $TIMER_API_KEY"</code></pre>
                  <figcaption>Пример запроса списка проектов (<abbr title="Hypertext Transfer Protocol Secure">HTTPS</abbr> обязателен).</figcaption>
                </figure>

                <h3>Заголовки запроса</h3>
                <dl>
                  <dt><code>Authorization</code></dt>
                  <dd>Строка <code>Bearer &lt;ключ&gt;</code>. Обязателен.</dd>
                  <dt><code>Accept</code></dt>
                  <dd>Формат ответа. По умолчанию <code>application/json</code>.</dd>
                </dl>
                <p>Ключ — это <button type="button" popovertarget="gl-token" class="term">токен доступа</button>, привязанный к вашему аккаунту.</p>
                <div id="gl-token" popover>
                  <p><dfn>Токен доступа</dfn> — строка, которая подтверждает право клиента обращаться к API без передачи пароля.</p>
                </div>
              </section>

              <section id="errors" aria-labelledby="errors-title">
                <h2 id="errors-title">Ошибки аутентификации <a class="anchor" href="#errors" aria-label="Ссылка на раздел «Ошибки аутентификации»">#</a></h2>
                <table>
                  <caption>Ответы API при проблемах с ключом</caption>
                  <thead>
                    <tr><th scope="col">Код</th><th scope="col">Причина</th><th scope="col">Что делать</th></tr>
                  </thead>
                  <tbody>
                    <tr><th scope="row">401</th><td>Ключ не передан или недействителен</td><td>Проверьте заголовок и актуальность ключа</td></tr>
                    <tr><th scope="row">403</th><td>У ключа нет прав на операцию</td><td>Выдайте ключу нужную роль в личном кабинете</td></tr>
                  </tbody>
                </table>
              </section>

              <section id="glossary" aria-labelledby="glossary-title">
                <h2 id="glossary-title">Глоссарий</h2>
                <dl>
                  <dt>Токен доступа</dt>
                  <dd>Строка, подтверждающая право клиента обращаться к API без передачи пароля.</dd>
                </dl>
              </section>

              <form action="/feedback" method="post" class="feedback" id="feedback">
                <h2>Страница помогла?</h2>
                <input type="hidden" name="page" value="/docs/auth.html">

                <fieldset>
                  <legend>Ваша оценка <span class="req">(обязательно)</span></legend>
                  <label><input id="helpful-yes" type="radio" name="helpful" value="yes" required> Да</label>
                  <label><input type="radio" name="helpful" value="partly"> Частично</label>
                  <label><input type="radio" name="helpful" value="no"> Нет</label>
                </fieldset>

                <p>
                  <label for="comment">Что можно улучшить <span class="opt">(необязательно)</span></label><br>
                  <textarea id="comment" name="comment" rows="4" maxlength="500" aria-describedby="comment-hint"></textarea>
                </p>
                <p id="comment-hint">Не более 500 символов. Не указывайте в комментарии ключи и пароли.</p>

                <p>
                  <label for="email">Почта для ответа <span class="opt">(необязательно)</span></label><br>
                  <input id="email" name="email" type="email" autocomplete="email" aria-describedby="email-hint">
                </p>
                <p id="email-hint">Например, name@example.com. Используем только для ответа на ваш отзыв.</p>

                <button type="submit">Отправить отзыв</button>
              </form>
            </article>
          </main>
        </div>

        <footer class="site-footer">
          <p><small>© 2026 Таймер</small></p>
        </footer>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "docs/auth.html", collapsed: true },
    ),
    h("Страница поиска"),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="noindex">
        <title>Результаты поиска «токен» — Таймер API</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>
        <header class="site-header"><a class="logo" href="/docs/">Таймер API</a></header>

        <main id="main">
          <h1>Поиск по документации</h1>
          <form role="search" action="/search.html" method="get">
            <label for="q">Запрос</label>
            <input id="q" name="q" type="search" value="токен" enterkeyhint="search">
            <label for="v">Версия</label>
            <select id="v" name="v">
              <option value="v2" selected>v2</option>
              <option value="v1">v1</option>
            </select>
            <button type="submit">Найти</button>
          </form>

          <p role="status">Найдено страниц: 2</p>
          <ol>
            <li>
              <h2><a href="/docs/auth.html">Аутентификация</a></h2>
              <p>Ключ — это <mark>токен</mark> доступа, привязанный к вашему аккаунту…</p>
            </li>
            <li>
              <h2><a href="/docs/errors.html">Лимиты и ошибки</a></h2>
              <p>При истечении срока действия <mark>токена</mark> API возвращает код 401…</p>
            </li>
          </ol>

          <nav aria-label="Страницы результатов">
            <ul>
              <li><a href="/search.html?q=%D1%82%D0%BE%D0%BA%D0%B5%D0%BD&amp;v=v2&amp;page=1" aria-current="page">1</a></li>
            </ul>
          </nav>

          <section aria-labelledby="empty-title" hidden>
            <h2 id="empty-title">Ничего не найдено</h2>
            <p>Попробуйте другой запрос или посмотрите <a href="/docs/">оглавление документации</a>.</p>
          </section>
        </main>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "search.html", collapsed: true },
    ),
    h("Состояние ошибки формы (результат работы сервера)"),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="noindex">
        <title>Ошибка: отправка отзыва — Таймер API</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>
        <header class="site-header"><a class="logo" href="/docs/">Таймер API</a></header>

        <main id="main">
          <div id="error-summary" role="alert" tabindex="-1" aria-labelledby="err-title">
            <h2 id="err-title">Исправьте ошибки в форме</h2>
            <ul>
              <li><a href="#helpful-yes">Выберите, помогла ли страница</a></li>
              <li><a href="#email">Введите адрес почты в формате name@example.com</a></li>
            </ul>
          </div>

          <h1>Отзыв о странице</h1>
          <form action="/feedback" method="post" novalidate>
            <input type="hidden" name="page" value="/docs/auth.html">

            <fieldset aria-describedby="helpful-error">
              <legend>Ваша оценка <span class="req">(обязательно)</span></legend>
              <p id="helpful-error"><span class="visually-hidden">Ошибка:</span> Выберите, помогла ли страница</p>
              <label><input id="helpful-yes" type="radio" name="helpful" value="yes"> Да</label>
              <label><input type="radio" name="helpful" value="partly"> Частично</label>
              <label><input type="radio" name="helpful" value="no"> Нет</label>
            </fieldset>

            <p>
              <label for="comment">Что можно улучшить <span class="opt">(необязательно)</span></label><br>
              <textarea id="comment" name="comment" rows="4" maxlength="500">Не хватает примера на Python</textarea>
            </p>

            <p>
              <label for="email">Почта для ответа <span class="opt">(необязательно)</span></label><br>
              <span id="email-error"><span class="visually-hidden">Ошибка:</span> Введите адрес почты в формате name@example.com</span><br>
              <input id="email" name="email" type="email" value="ivan@" autocomplete="email" aria-invalid="true" aria-describedby="email-error">
            </p>

            <button type="submit">Отправить отзыв</button>
          </form>
        </main>

        <script>document.getElementById("error-summary").focus();</script>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "feedback-error.html (сгенерирован сервером)", collapsed: true },
    ),
    h("Учебный сервер (без зависимостей)"),
    code(
      "js",
      `
      // server.mjs — запуск: node server.mjs, затем http://localhost:3000/docs/auth.html
      import { createServer } from "node:http";
      import { readFile } from "node:fs/promises";
      import { extname, join, normalize } from "node:path";

      const ROOT = process.cwd();
      const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
      const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      function validate(data) {
        const errors = {};
        if (!data.get("helpful")) errors.helpful = "Выберите, помогла ли страница";
        const email = data.get("email") ?? "";
        if (email && !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) errors.email = "Введите адрес почты в формате name@example.com";
        if ((data.get("comment") ?? "").length > 500) errors.comment = "Комментарий не длиннее 500 символов";
        return errors;
      }

      function errorPage(data, errors) {
        const val = (k) => esc(data.get(k) ?? "");
        const radio = (v, label, id) =>
          "<label><input" + (id ? ' id="' + id + '"' : "") + ' type="radio" name="helpful" value="' + v + '"' +
          (data.get("helpful") === v ? " checked" : "") + "> " + label + "</label> ";
        const msg = (k, tag = "p") =>
          errors[k] ? "<" + tag + ' id="' + k + '-error"><span class="visually-hidden">Ошибка:</span> ' + esc(errors[k]) + "</" + tag + ">" : "";
        const bad = (k) => (errors[k] ? ' aria-invalid="true" aria-describedby="' + k + '-error"' : "");
        const list = Object.entries(errors)
          .map(([k, m]) => '<li><a href="#' + (k === "helpful" ? "helpful-yes" : k) + '">' + esc(m) + "</a></li>")
          .join("");

        return "<!doctype html>" +
          '<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
          "<title>Ошибка: отправка отзыва — Таймер API</title></head><body><main>" +
          '<div id="error-summary" role="alert" tabindex="-1"><h2>Исправьте ошибки в форме</h2><ul>' + list + "</ul></div>" +
          "<h1>Отзыв о странице</h1>" +
          '<form action="/feedback" method="post" novalidate>' +
          '<input type="hidden" name="page" value="' + val("page") + '">' +
          "<fieldset" + (errors.helpful ? ' aria-describedby="helpful-error"' : "") + "><legend>Ваша оценка (обязательно)</legend>" + msg("helpful") +
          radio("yes", "Да", "helpful-yes") + radio("partly", "Частично") + radio("no", "Нет") + "</fieldset>" +
          '<p><label for="comment">Что можно улучшить (необязательно)</label><br>' + msg("comment", "span") + "<br>" +
          '<textarea id="comment" name="comment" rows="4" maxlength="500"' + bad("comment") + ">" + val("comment") + "</textarea></p>" +
          '<p><label for="email">Почта для ответа (необязательно)</label><br>' + msg("email", "span") + "<br>" +
          '<input id="email" name="email" type="email" autocomplete="email" value="' + val("email") + '"' + bad("email") + "></p>" +
          '<button type="submit">Отправить отзыв</button></form>' +
          '<script>document.getElementById("error-summary").focus()</script></main></body></html>';
      }

      createServer(async (req, res) => {
        const url = new URL(req.url, "http://localhost");

        if (req.method === "POST" && url.pathname === "/feedback") {
          let body = "";
          for await (const chunk of req) body += chunk;
          const data = new URLSearchParams(body);
          const errors = validate(data);
          if (Object.keys(errors).length) {
            res.writeHead(422, { "Content-Type": "text/html; charset=utf-8" });
            return res.end(errorPage(data, errors));
          }
          res.writeHead(303, { Location: "/feedback-thanks.html" });   // Post/Redirect/Get
          return res.end();
        }

        const safe = normalize(url.pathname).replace(/^(\\.\\.[\\/\\\\])+/, "");
        const file = join(ROOT, safe === "/" ? "docs/index.html" : safe);
        try {
          const data = await readFile(file);
          res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
          res.end(data);
        } catch {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Страница не найдена");
        }
      }).listen(3000, () => console.log("http://localhost:3000"));
      `,
      { lineNumbers: true, filename: "server.mjs", collapsed: true },
    ),
    table(
      ["Решение", "Зачем"],
      [
        ["`GET`-формы для поиска и версии", "Адрес содержит параметры — результат можно сохранить, отправить, индексировать (или закрыть `noindex`)"],
        ["`details` в боковом меню", "Группировка разделов без JS, с клавиатурой и состоянием"],
        ["`aria-describedby` на `fieldset` радио", "Ошибка относится ко всей группе, а не к отдельной кнопке"],
        ["`role=\"alert\"` + фокус на сводке", "Результат отправки озвучивается и ссылки ведут к полям"],
        ["Код ответа `422` и PRG при успехе", "Правильная семантика HTTP: ошибка данных не равна успеху; обновление страницы не отправляет форму повторно"],
        ["Экранирование при подстановке значений", "Защита от XSS: введённые пользователем данные возвращаются как текст"],
        ["Ссылка `#` у заголовков с `aria-label`", "Можно поделиться ссылкой на раздел; скринридер понимает назначение ссылки"],
      ],
      "Ключевые решения",
    ),
    warn("Сервер из решения — учебный. Для продакшена потребуются CSRF-токены, ограничение частоты, хранение отзывов и защита от спама."),
    tip("Следующий проект собирает всё вместе в многостраничный сайт продукта: общая оболочка перестанет быть копированием — вы подключите шаблоны."),
  ],
};
