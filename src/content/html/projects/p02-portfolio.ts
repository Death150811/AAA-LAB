import type { Project } from "../../types";
import { code, h, note, p, table, tip, warn } from "../../dsl";

export const p02Portfolio: Project = {
  id: "html.p02-portfolio",
  domain: "html",
  order: 2,
  title: "Портфолио фотографа",
  subtitle: "Четыре связанные страницы с адаптивной галереей, видео с субтитрами и единой оболочкой: изображения, медиа и семантический каркас.",
  level: "core",
  estimatedHours: 6,
  buildsOn: ["html.p01-profile"],
  topics: [
    "html.images",
    "html.responsive-images",
    "html.audio-video",
    "html.embedded-content",
    "html.landmarks",
    "html.sectioning",
    "html.content-semantics",
    "html.navigation-patterns",
  ],
  objective:
    "Собрать небольшой **многостраничный сайт** с единой оболочкой, адаптивными изображениями (`picture`, `srcset`, `sizes`), доступным видео и встроенной картой. Проект закрепляет работу с медиа и семантическими блоками и показывает, чем «галерея на `div`» отличается от структурированной галереи.",
  scenario: [
    p("Мария Орлова — документальный фотограф из Казани. Ей нужен сайт-портфолио из четырёх страниц: главная, галерея, «Обо мне» и контакты. Галерея должна быстро открываться на телефоне и не расходовать трафик зря, видео-«шоурил» — работать без звука для тех, кто смотрит его в метро, а страницы — быть удобными для людей с экранными читалками."),
    p("Страница «Обо мне» — это доработанное резюме из прошлого проекта: те же заголовки и списки, но теперь в общей оболочке сайта. Контакты содержат карту проезда в студию и график работы."),
    note("Фотографии подготовьте сами или возьмите свободные (Unsplash, Wikimedia Commons — проверьте лицензию). Требуется 12 снимков в 3 сериях по 4 фото. Каждый — в трёх размерах и трёх форматах (инструкция в подсказках)."),
  ],
  requirements: [
    "Четыре страницы: `index.html`, `gallery.html`, `about.html`, `contact.html` с **одинаковой оболочкой**: ссылка-пропуск, шапка с логотипом-ссылкой и `nav aria-label=\"Основная\"`, `main`, подвал с `nav aria-label=\"Подвал\"`.",
    "Текущая страница отмечена в меню `aria-current=\"page\"`; у каждой страницы уникальные `title`, `description` и `canonical`.",
    "Главная: заголовок и слоган, три избранные работы (`article` с `figure`), видео-шоурил: `<video controls preload=\"metadata\" poster>` с источниками MP4 и WebM, дорожкой субтитров `<track kind=\"captions\">` и ссылкой на текстовую расшифровку.",
    "Галерея: три серии (`section` с `h2`), в каждой четыре `figure` с `<picture>` (AVIF → WebP → JPEG), `srcset` с шириной 400/800/1600 px, `sizes`, `width`/`height`, информативным `alt` и `figcaption` (название, год, место). Первое изображение первого экрана — без `loading=\"lazy\"`, остальные — ленивые.",
    "«Обо мне»: биография, список выставок (`ol` с `time`), награды в `aside`, цитаты прессы в `blockquote` с `cite`.",
    "Контакты: `address` (почта, телефон, адрес студии), карта через `iframe` с `title` и `loading=\"lazy\"` и запасная ссылка «Открыть карту», график работы в таблице (`caption`, `th scope`).",
    "Значок сайта: SVG-favicon через `<link rel=\"icon\">`.",
    "Логотип-ссылка на главную: `img` с `alt`, описывающим **действие** («Мария Орлова — на главную»).",
  ],
  constraints: [
    "Без JavaScript и без CSS-фреймворков; стили — по желанию (один `style.css`).",
    "Вёрстка не должна зависеть от таблиц, кроме настоящей таблицы графика работы.",
    "Размер: ни одно изображение из набора 1600 px — не более 250 КБ; суммарный вес главной (без видео) — не более 1,5 МБ.",
    "Видео ≤ 5 МБ, 45 секунд; автовоспроизведение запрещено.",
    "Все тексты и подписи — на русском; названия серий и работ — осмысленные, без «Фото 1».",
  ],
  expected: [
    "На телефоне загружаются изображения 400–800 px, на широком экране — 1600 px; браузер выбирает формат AVIF/WebP/JPEG по поддержке.",
    "При отсутствии JavaScript и стилей сайт полностью читается и навигируется.",
    "Видео управляется с клавиатуры; субтитры включаются; есть расшифровка.",
    "Переход между страницами не «прыгает»: у изображений заданы размеры (CLS ≈ 0).",
    "Скринридер озвучивает ориентиры, заголовки серий, подписи и описания фотографий, текущую страницу в меню.",
  ],
  technical: [
    "Структура: `index.html`, `gallery.html`, `about.html`, `contact.html`, `style.css`, `img/` (`work-01-400.avif` … `work-12-1600.jpg`), `video/` (`showreel.mp4`, `showreel.webm`, `showreel.ru.vtt`, `poster.jpg`), `favicon.svg`.",
    "`sizes`, соответствующий сетке: например, `(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw`.",
    "Подготовка изображений скриптом (Node + `sharp`) или приложением (Squoosh) — зафиксируйте команду в `README`.",
    "Корневые пути к ресурсам (`/img/...`, `/style.css`) либо единый подход к относительным путям, проверенный на всех страницах.",
    "Проверка: Nu Html Checker, Lighthouse (производительность/доступность ≥ 90), axe.",
  ],
  acceptance: [
    "Все четыре страницы проходят валидатор без ошибок.",
    "Оболочка идентична на всех страницах: одинаковые ссылки меню в одинаковом порядке; `aria-current` стоит у текущей.",
    "В галерее 12 `figure`; у каждого `picture` три источника и `img` с `srcset`, `sizes`, `width`, `height`, `alt`.",
    "Лениво загружаются все изображения, кроме первого на каждой странице; у них нет сдвигов вёрстки.",
    "У видео есть `poster`, дорожка `captions`, источники MP4/WebM и текстовая расшифровка; автовоспроизведения нет.",
    "Карта встроена в `iframe` с `title`; рядом есть обычная ссылка на карту.",
    "Таблица графика работы имеет `caption` и `th scope`.",
    "В Lighthouse (мобильный профиль) доступность ≥ 90, SEO ≥ 90; в axe нет критических нарушений.",
  ],
  hints: [
    "Сначала сделайте **одну** страницу идеальной (шапка, подвал, `head`), затем скопируйте оболочку на остальные. Любое расхождение между страницами — это ошибка шаблона.",
    "`alt` у снимков описывает **содержание** («Мужчина под зонтом переходит мокрую улицу у казанского Кремля»), а `figcaption` — **контекст** (название, год, место). Не дублируйте одно другим.",
    "Порядок источников в `picture` важен: самый современный формат — первым (`avif`), затем `webp`, затем `img` с JPEG. Браузер берёт первый подходящий.",
    "`width` и `height` — реальные размеры файла по умолчанию (например, 1600×1067); CSS с `max-width: 100%; height: auto` сохранит пропорции.",
    "Для проверки `sizes` откройте DevTools → Network, меняйте ширину окна и смотрите, какой файл загружается.",
    "Субтитры — файл WebVTT (`WEBVTT` в первой строке, затем временные метки); `<track default>` включит их по умолчанию, но оставьте пользователю выбор.",
  ],
  advanced: [
    "Добавьте страницы серий (`gallery/kazan-rain.html`) с крупным просмотром и ссылками «предыдущее/следующее».",
    "Реализуйте галерею без JS-лайтбокса через якоря и `:target` (CSS) — и обсудите доступность решения.",
    "Добавьте Open Graph-карточки и JSON-LD `Person`/`ImageObject`; сгенерируйте `sitemap.xml`.",
    "Сделайте версию для печати: контакт-лист с миниатюрами и подписями.",
  ],
  failureModes: [
    "**Галерея из CSS-фонов:** фотографии заданы `background-image`, у них нет `alt`, они не индексируются и не масштабируются адаптивно.",
    "**Один огромный JPEG на все экраны:** телефон скачивает 4 МБ ради картинки 400 px.",
    "**`loading=\"lazy\"` у первого изображения:** главная фотография появляется поздно (LCP).",
    "**Нет `width`/`height`:** страница «прыгает» при загрузке.",
    "**Видео без субтитров и автоплей со звуком** — нарушение доступности и раздражает пользователей.",
    "**Копирование шапки с ошибками:** на одной странице меню отличается, на другой нет `lang` или `title` совпадает.",
    "**Карта без `title`** и без запасной ссылки: скринридер не понимает, что это; при блокировке сторонних ресурсов карта исчезает.",
  ],
  rubric: [
    { criterion: "Каркас и оболочка", weight: 20, description: "Единые структура и навигация на всех страницах, ориентиры, ссылка-пропуск, `aria-current`, корректные пути." },
    { criterion: "Адаптивные изображения", weight: 25, description: "`picture`/`srcset`/`sizes`, форматы, размеры, ленивая загрузка, вес файлов." },
    { criterion: "Видео и встраивания", weight: 15, description: "Доступное видео (poster, captions, расшифровка), карта с `title` и запасной ссылкой." },
    { criterion: "Семантика содержимого", weight: 15, description: "`figure`/`figcaption`, `article`, `aside`, `address`, таблица с `scope`, `time`, цитаты." },
    { criterion: "Доступность", weight: 15, description: "Осмысленные `alt`, имена ссылок, клавиатура, скринридер, нет сдвигов." },
    { criterion: "Метаданные и валидность", weight: 10, description: "Уникальные `title`/`description`/`canonical`, favicon, валидатор без ошибок." },
  ],
  solution: [
    p("Эталон показывает общую оболочку и три самые содержательные страницы. `about.html` — переработанный `index.html` из первого проекта: тот же `main`, но внутри общей шапки и подвала."),
    h("Оболочка"),
    code(
      "html",
      `
      <a class="skip-link" href="#main">Перейти к содержимому</a>
      <header class="site-header">
        <a href="index.html" class="logo"><img src="img/logo.svg" alt="Мария Орлова — на главную" width="140" height="40"></a>
        <nav aria-label="Основная">
          <ul>
            <li><a href="index.html">Главная</a></li>
            <li><a href="gallery.html" aria-current="page">Галерея</a></li>
            <li><a href="about.html">Обо мне</a></li>
            <li><a href="contact.html">Контакты</a></li>
          </ul>
        </nav>
      </header>
      <!-- <main id="main"> … </main> -->
      <footer class="site-footer">
        <nav aria-label="Подвал">
          <ul>
            <li><a href="contact.html">Заказать съёмку</a></li>
            <li><a href="https://example.com/privacy.html">Политика конфиденциальности</a></li>
          </ul>
        </nav>
        <p><small>© 2026 Мария Орлова. Все права на фотографии защищены.</small></p>
      </footer>
      `,
      { filename: "shell.html (общая часть)" },
    ),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Галерея — Мария Орлова, документальная фотография</title>
        <meta name="description" content="Три серии документальных снимков Марии Орловой: «Казань после дождя», «Рабочие руки» и «Тихие дворы». Крупные кадры с подписями.">
        <link rel="canonical" href="https://example.com/gallery.html">
        <link rel="icon" href="favicon.svg" type="image/svg+xml">
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>
        <header class="site-header">
          <a href="index.html" class="logo"><img src="img/logo.svg" alt="Мария Орлова — на главную" width="140" height="40"></a>
          <nav aria-label="Основная">
            <ul>
              <li><a href="index.html">Главная</a></li>
              <li><a href="gallery.html" aria-current="page">Галерея</a></li>
              <li><a href="about.html">Обо мне</a></li>
              <li><a href="contact.html">Контакты</a></li>
            </ul>
          </nav>
        </header>

        <main id="main">
          <h1>Галерея</h1>
          <p>Три серии, снятые в Казани в 2023–2025 годах. Нажмите на название серии в оглавлении, чтобы перейти к ней.</p>
          <nav aria-label="Серии">
            <ul>
              <li><a href="#rain">Казань после дождя</a></li>
              <li><a href="#hands">Рабочие руки</a></li>
              <li><a href="#yards">Тихие дворы</a></li>
            </ul>
          </nav>

          <section id="rain" aria-labelledby="rain-title">
            <h2 id="rain-title">Казань после дождя</h2>
            <figure>
              <picture>
                <source type="image/avif" srcset="img/work-01-400.avif 400w, img/work-01-800.avif 800w, img/work-01-1600.avif 1600w" sizes="(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw">
                <source type="image/webp" srcset="img/work-01-400.webp 400w, img/work-01-800.webp 800w, img/work-01-1600.webp 1600w" sizes="(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw">
                <img src="img/work-01-800.jpg"
                     srcset="img/work-01-400.jpg 400w, img/work-01-800.jpg 800w, img/work-01-1600.jpg 1600w"
                     sizes="(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw"
                     alt="Мужчина с зонтом переходит мокрую улицу у стен Казанского кремля, в лужах отражаются фонари"
                     width="1600" height="1067">
              </picture>
              <figcaption><cite>Перекрёсток</cite>, <time datetime="2024">2024</time>. Улица Кремлёвская, Казань.</figcaption>
            </figure>

            <figure>
              <picture>
                <source type="image/avif" srcset="img/work-02-400.avif 400w, img/work-02-800.avif 800w, img/work-02-1600.avif 1600w" sizes="(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw">
                <source type="image/webp" srcset="img/work-02-400.webp 400w, img/work-02-800.webp 800w, img/work-02-1600.webp 1600w" sizes="(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw">
                <img src="img/work-02-800.jpg"
                     srcset="img/work-02-400.jpg 400w, img/work-02-800.jpg 800w, img/work-02-1600.jpg 1600w"
                     sizes="(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw"
                     alt="Трамвай в сумерках, в окнах горит жёлтый свет, на рельсах блестят капли"
                     width="1600" height="1067" loading="lazy" decoding="async">
              </picture>
              <figcaption><cite>Последний трамвай</cite>, <time datetime="2024">2024</time>. Район Кировский, Казань.</figcaption>
            </figure>
            <!-- ещё два кадра серии — по тому же образцу -->
          </section>

          <section id="hands" aria-labelledby="hands-title">
            <h2 id="hands-title">Рабочие руки</h2>
            <!-- четыре figure -->
          </section>

          <section id="yards" aria-labelledby="yards-title">
            <h2 id="yards-title">Тихие дворы</h2>
            <!-- четыре figure -->
          </section>
        </main>

        <footer class="site-footer">
          <nav aria-label="Подвал">
            <ul>
              <li><a href="contact.html">Заказать съёмку</a></li>
            </ul>
          </nav>
          <p><small>© 2026 Мария Орлова. Все права на фотографии защищены.</small></p>
        </footer>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "gallery.html", collapsed: true },
    ),
    code(
      "html",
      `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Контакты — Мария Орлова, документальная фотография</title>
        <meta name="description" content="Как заказать съёмку у Марии Орловой: почта, телефон, адрес студии в Казани, карта проезда и график работы.">
        <link rel="canonical" href="https://example.com/contact.html">
        <link rel="icon" href="favicon.svg" type="image/svg+xml">
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <a class="skip-link" href="#main">Перейти к содержимому</a>
        <header class="site-header">
          <a href="index.html" class="logo"><img src="img/logo.svg" alt="Мария Орлова — на главную" width="140" height="40"></a>
          <nav aria-label="Основная">
            <ul>
              <li><a href="index.html">Главная</a></li>
              <li><a href="gallery.html">Галерея</a></li>
              <li><a href="about.html">Обо мне</a></li>
              <li><a href="contact.html" aria-current="page">Контакты</a></li>
            </ul>
          </nav>
        </header>

        <main id="main">
          <h1>Контакты</h1>

          <section aria-labelledby="how-title">
            <h2 id="how-title">Как заказать съёмку</h2>
            <address>
              <ul>
                <li>Почта: <a href="mailto:maria@example.com">maria@example.com</a></li>
                <li>Телефон: <a href="tel:+79000000001">+7&nbsp;900&nbsp;000&#8209;00&#8209;01</a></li>
                <li>Студия: Казань, ул. Баумана, 24, второй этаж</li>
              </ul>
            </address>
            <p>Отвечаю в течение рабочего дня. В письме укажите тип съёмки, желаемую дату и город.</p>
          </section>

          <section aria-labelledby="map-title">
            <h2 id="map-title">Как добраться</h2>
            <iframe title="Карта: студия Марии Орловой на улице Баумана, Казань"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=49.095%2C55.795%2C49.115%2C55.803&amp;layer=mapnik&amp;marker=55.7988%2C49.1056"
                    width="600" height="380" loading="lazy"></iframe>
            <p><a href="https://www.openstreetmap.org/?mlat=55.7988&amp;mlon=49.1056#map=16/55.7988/49.1056" target="_blank" rel="noopener noreferrer">Открыть карту на openstreetmap.org</a></p>
          </section>

          <section aria-labelledby="hours-title">
            <h2 id="hours-title">График работы</h2>
            <table>
              <caption>Часы приёма в студии</caption>
              <thead>
                <tr><th scope="col">День</th><th scope="col">Время</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Понедельник — пятница</th><td>10:00–19:00</td></tr>
                <tr><th scope="row">Суббота</th><td>11:00–16:00</td></tr>
                <tr><th scope="row">Воскресенье</th><td>выходной</td></tr>
              </tbody>
            </table>
          </section>
        </main>

        <footer class="site-footer">
          <nav aria-label="Подвал">
            <ul>
              <li><a href="gallery.html">Смотреть работы</a></li>
            </ul>
          </nav>
          <p><small>© 2026 Мария Орлова. Все права на фотографии защищены.</small></p>
        </footer>
      </body>
      </html>
      `,
      { lineNumbers: true, filename: "contact.html", collapsed: true },
    ),
    code(
      "html",
      `
      <section aria-labelledby="reel-title">
        <h2 id="reel-title">Шоурил 2025</h2>
        <video controls preload="metadata" poster="video/poster.jpg" width="1280" height="720">
          <source src="video/showreel.webm" type="video/webm">
          <source src="video/showreel.mp4" type="video/mp4">
          <track kind="captions" src="video/showreel.ru.vtt" srclang="ru" label="Русский">
          <p>Ваш браузер не воспроизводит видео. <a href="video/showreel.mp4">Скачать шоурил (MP4, 4,8 МБ)</a>.</p>
        </video>
        <details>
          <summary>Текстовая расшифровка</summary>
          <p>На кадрах — утренняя Казань: дворники, первые трамваи, мокрый асфальт; затем крупные планы рук мастеров на производстве…</p>
        </details>
      </section>
      `,
      { filename: "фрагмент index.html: видео" },
    ),
    code(
      "js",
      `
      // scripts/make-images.mjs — подготовка изображений: node scripts/make-images.mjs
      import sharp from "sharp";
      import { readdirSync, mkdirSync } from "node:fs";

      const widths = [400, 800, 1600];
      mkdirSync("img", { recursive: true });

      for (const file of readdirSync("src-photos")) {
        const name = file.replace(/\\.\\w+$/, "");
        for (const w of widths) {
          const img = sharp("src-photos/" + file).resize({ width: w });
          await img.clone().avif({ quality: 50 }).toFile("img/" + name + "-" + w + ".avif");
          await img.clone().webp({ quality: 70 }).toFile("img/" + name + "-" + w + ".webp");
          await img.clone().jpeg({ quality: 75, mozjpeg: true }).toFile("img/" + name + "-" + w + ".jpg");
        }
      }
      `,
      { filename: "scripts/make-images.mjs" },
    ),
    table(
      ["Решение", "Зачем"],
      [
        ["`<picture>` + `srcset`/`sizes`", "Браузер сам выбирает формат и ширину по экрану и сети — экономия трафика без JS"],
        ["`width`/`height` у всех `img`", "Резервирование места: нет сдвигов вёрстки (CLS)"],
        ["Первое изображение без `lazy`", "Главный кадр грузится сразу и не ухудшает LCP"],
        ["`alt` ≠ `figcaption`", "`alt` описывает содержание, подпись — контекст; без дублирования"],
        ["`track kind=\"captions\"` и расшифровка", "Видео доступно людям с нарушениями слуха и тем, кто смотрит без звука"],
        ["Запасная ссылка у карты", "Работает при блокировке сторонних встраиваний и для пользователей читалок"],
        ["Единая оболочка копируется один-в-один", "Любое расхождение — ошибка; в следующих проектах оболочку выносят в шаблоны"],
      ],
      "Ключевые решения",
    ),
    warn("Подписывать файлы и `alt` номерами («photo-1», «Фото 1») нельзя: имя файла и `alt` — часть смысла и SEO."),
    tip("Следующий проект («Блог») использует ту же оболочку, но страницы делятся на текстовые материалы — подумайте, как вы избежите копирования шапки в десятках файлов."),
  ],
};
