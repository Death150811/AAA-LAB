import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  tip,
  insight,
  table,
  def,
  wrongRight,
  beforeAfter,
  annotated,
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const dnsHttp: Topic = {
  id: "cs.dns-http",
  slug: "dns-http",
  domain: "cs",
  module: "networking",
  title: "DNS и HTTP: имена, запросы и ответы",
  titleEn: "DNS and HTTP: Names, Requests and Responses",
  summary:
    "DNS превращает имя в адрес, HTTP описывает обмен запросами и ответами между клиентом и сервером. Тема разбирает формат сообщения DNS (запрос на 33 байта, сжатие имён, TTL, коды ответа), иерархию серверов и кеширование (холодный запрос — 3 обращения, тёплый — 0), HTTP/1.1 «на проводе» (строка запроса, заголовки, `Content-Length` и `chunked`, коды состояния, Range), постоянные соединения и мультиплексирование HTTP/2, семантику методов (безопасность, идемпотентность, `Idempotency-Key`, `If-Match`) и устройство URL. Всё проверено запуском на локальном интерфейсе: 10 запросов через канал с RTT 40 мс занимают 0,85 с на новых соединениях, 0,47 с по одному соединению и 0,13 с по шести; HTTP/2 выполняет 10 запросов по 50 мс за 66 мс и отправляет заголовки в 8 раз компактнее.",
  minutes: 110,
  prerequisites: ["cs.network-model-ip-tcp"],
  tags: ["DNS", "TTL", "резолвер", "HTTP", "HTTP/2", "keep-alive", "chunked", "идемпотентность", "URL", "origin", "ETag", "Idempotency-Key"],
  keyConcepts: [
    { term: "DNS — иерархическая база имён", text: "Запрос A для `www.example.com` — 33 байта (12 заголовок + 17 имя + 4 тип и класс). В ответе имя повторно записывается указателем `0xC00C` (2 байта вместо 17). Несуществующее имя — `NXDOMAIN` (код 3), и такой ответ тоже кешируется." },
    { term: "Кеш и TTL", text: "Холодный запрос в модели: корень → `.test` → авторитетный сервер = 3 обращения; повтор — 0; другое имя в той же зоне — 1; после истечения TTL (61 с при TTL 60) — 1." },
    { term: "HTTP — текст поверх TCP", text: "Запрос `GET /hello` — 74 байта текста; ответ — строка состояния, заголовки, пустая строка и тело. `Content-Length` считает байты (тело `{\"имя\":\"Анна\"}` — 21 байт при 14 символах), без него используется `chunked`." },
    { term: "Новое соединение стоит кругов RTT", text: "10 запросов через канал с RTT 40 мс: новое соединение на запрос — 854 мс, одно соединение (keep-alive) — 470 мс, до 6 параллельных — 129 мс." },
    { term: "HTTP/2 — мультиплексирование и HPACK", text: "10 запросов по 50 мс на сервере: HTTP/1.1 по одному соединению — 537 мс, шесть соединений — 109 мс, HTTP/2 по одному — 66 мс. Заголовки 10 запросов: 4820 байт в HTTP/1.1 и 578 в HTTP/2 (первый запрос — 277 байт, последующие — по 15)." },
    { term: "Методы и повторы", text: "Повтор `POST` создал дубликат (`id` 1 и 2); с `Idempotency-Key` — ответ `200` с тем же ресурсом; `PUT` повторно оставил одну запись; устаревший `If-Match` — `412`." },
    { term: "URL — не строка", text: "Источник (origin) — схема + хост + порт: `https://a.test` и `https://a.test:8443` — разные. Проверка `startsWith('https://a.test')` пропускает `https://a.test.evil.test`, а `new URL('https://a.test@evil.test/').hostname` — `evil.test`." },
  ],
  sections: [
    section("definition", [
      def("DNS", "Распределённая иерархическая система имён, отображающая доменные имена в данные (адреса, почтовые серверы, текстовые записи). Работает по UDP и TCP на порту 53.", "Domain Name System"),
      def("Резолвер", "Программа или сервер, получающий ответ на DNS-запрос: рекурсивный резолвер обходит иерархию серверов от имени клиента и кеширует результаты.", "resolver"),
      def("Запись DNS", "Единица данных зоны: имя, тип (`A`, `AAAA`, `CNAME`, `NS`, `MX`, `TXT`), время жизни (TTL) и значение.", "resource record"),
      def("TTL", "Время в секундах, на которое запись может храниться в кеше.", "time to live"),
      def("HTTP", "Протокол прикладного уровня «запрос — ответ» для передачи гипертекста и данных: запрос состоит из метода, цели, заголовков и необязательного тела; ответ — из кода состояния, заголовков и тела.", "Hypertext Transfer Protocol"),
      def("Идемпотентный метод", "Метод, повторный вызов которого с теми же данными даёт тот же результат на сервере, что и однократный (`GET`, `PUT`, `DELETE`).", "idempotent method"),
      def("Постоянное соединение", "Повторное использование одного TCP-соединения для нескольких запросов (keep-alive): экономит рукопожатия и медленный старт.", "persistent connection"),
      def("Мультиплексирование", "Передача нескольких запросов и ответов одновременно по одному соединению в виде кадров с идентификаторами потоков (HTTP/2, HTTP/3).", "multiplexing"),
      def("URL", "Универсальный указатель ресурса: схема, необязательные учётные данные, хост, порт, путь, запрос, фрагмент. Источник (origin) — схема, хост и порт.", "Uniform Resource Locator"),
    ]),

    section("why", [
      h("Каждая загрузка страницы начинается с имени и запроса"),
      p("Перед первым байтом страницы браузер разрешает имя (DNS), устанавливает TCP-соединение (и TLS), отправляет запрос и ждёт ответ. Каждое действие — это круг RTT; ошибки на любом этапе выглядят для пользователя одинаково — «сайт не открывается». Понимание этой цепочки превращает «магию» в диагностику."),
      ul(
        "**Диагностика:** различить `NXDOMAIN`, устаревший кеш, смену адреса, отказ соединения, `4xx` и `5xx`, редиректы и таймауты.",
        "**Производительность:** DNS, соединения и число запросов определяют время загрузки: постоянные соединения и HTTP/2 сокращают задержку в разы (замер: 854 → 470 → 129 мс).",
        "**Проектирование API:** выбор метода, кода ответа, идемпотентности и повторов определяет, переживёт ли система обрывы сети и дублирование запросов.",
        "**Безопасность:** разбор URL и проверка источников — типичный источник уязвимостей (обход фильтров, перенаправления, SSRF); DNS-кеш и TTL — основа миграций и отказоустойчивости.",
        "**Основа веба:** `fetch`, формы, кеширование, cookie, CORS и TLS строятся на HTTP — см. [JavaScript: формы и fetch](/learn/js/forms-fetch) и [HTML: безопасность](/learn/html/html-security).",
      ),
      tip("Три вопроса при любой «сетевой» проблеме: что сказал DNS, удалось ли соединение и что вернул сервер (код, заголовки)? Каждый ответ сужает поиск на уровень."),
    ]),

    section("mental-model", [
      h("От URL до ответа"),
      diagram(
        `
        https://www.example.com/page
              │
        1. DNS: www.example.com → 93.184.216.34   (кеш браузера → ОС → резолвер провайдера → иерархия серверов)
              │
        2. TCP: рукопожатие с 93.184.216.34:443    (1 RTT)
              │
        3. TLS: согласование ключей                (1–2 RTT, см. тему про TLS)
              │
        4. HTTP: GET /page, Host: www.example.com  (1 RTT до первого байта ответа)
              │
        5. ответ: 200 OK, заголовки, тело → разбор HTML → новые запросы (стили, скрипты, картинки)
        `,
        "Пять этапов, каждый со своей задержкой и со своим кешем. Новое соединение платит этапы 1–3 заново, постоянное — только этап 4.",
      ),
      h("Иерархия DNS"),
      diagram(
        `
        резолвер        корневые серверы        серверы зоны .com        авторитетный сервер example.com
           │  «www.example.com?»  │                    │                         │
           ├────────────────────► │ «не знаю, спроси .com» (NS + адрес сервера)    │
           ├─────────────────────────────────────────► │ «не знаю, спроси example.com» (NS)
           ├─────────────────────────────────────────────────────────────────────► │ «A 93.184.216.34, TTL 60»
           ▼
        ответ кешируется на TTL; следующие запросы к этой зоне пропускают корень и .com
        `,
        "Резолвер идёт по ссылкам (referrals) от корня к авторитетному серверу; кеширует и ответы, и делегирования (NS).",
      ),
      insight("DNS и HTTP построены на одной идее: простые текстовые или компактные сообщения «запрос — ответ» плюс кеширование. Время жизни записи и заголовки кеша — это договор о том, насколько можно доверять устаревшему ответу ради скорости."),
    ]),

    section("technical", [
      h("DNS: типы записей и сообщение"),
      table(
        ["Тип", "Значение", "Пример"],
        [
          ["`A` / `AAAA`", "Адрес IPv4 / IPv6", "`web.example.test A 192.0.2.10`"],
          ["`CNAME`", "Псевдоним другого имени (цепочка)", "`www → web.example.test`"],
          ["`NS`", "Серверы, отвечающие за зону", "`example.test NS ns.example.test`"],
          ["`MX`", "Почтовые серверы с приоритетом", "`10 mail.example.test`"],
          ["`TXT`", "Произвольный текст (SPF, проверка владения)", "`v=spf1 -all`"],
          ["`SOA`", "Параметры зоны, включая время отрицательного кеширования", "серийный номер, интервалы"],
        ],
        "Основные типы записей",
      ),
      ul(
        "**Сообщение:** заголовок 12 байт (идентификатор, флаги, число записей в секциях), вопрос (имя, тип, класс) и секции ответов, авторитетных серверов и дополнительных данных.",
        "**Имена** кодируются метками с длиной (`3www7example3com0`) и могут сжиматься указателями `0xC0xx`.",
        "**Коды ответа:** `NOERROR` (0), `SERVFAIL` (2), `NXDOMAIN` (3, имя не существует), `REFUSED` (5).",
        "**Транспорт:** UDP (обычно датаграмма до 512 байт без расширения EDNS; больше — усечение и повтор по TCP), защищённые варианты — DoT и DoH.",
        "**Кеширование:** каждая запись хранится до истечения TTL; отрицательные ответы (`NXDOMAIN`) тоже кешируются, на срок из записи `SOA`.",
      ),
      h("HTTP/1.1: структура сообщения"),
      ul(
        "**Запрос:** `МЕТОД цель HTTP/1.1`, заголовки (`Host` обязателен в HTTP/1.1), пустая строка, необязательное тело.",
        "**Ответ:** `HTTP/1.1 КОД причина`, заголовки, пустая строка, тело.",
        "**Границы тела:** `Content-Length` (число байтов) или `Transfer-Encoding: chunked` (куски `размер-в-hex ⏎ данные ⏎`, завершает кусок размера 0).",
        "**Постоянные соединения** включены по умолчанию в HTTP/1.1: следующий запрос можно отправлять по тому же соединению, но ответы идут строго по порядку (блокировка очереди).",
      ),
      table(
        ["Класс", "Смысл", "Типичные коды"],
        [
          ["`1xx`", "Информационные", "`101` переключение протокола"],
          ["`2xx`", "Успех", "`200` OK, `201` Created (+ `Location`), `204` без тела, `206` часть (Range)"],
          ["`3xx`", "Перенаправление и кеш", "`301` и `308` навсегда, `302` и `307` временно, `304` не изменялось"],
          ["`4xx`", "Ошибка клиента", "`400`, `401`, `403`, `404`, `405` (+ `Allow`), `409`, `412`, `429`"],
          ["`5xx`", "Ошибка сервера", "`500`, `502`, `503` (+ `Retry-After`), `504`"],
        ],
        "Классы кодов состояния",
      ),
      h("Методы и их свойства"),
      table(
        ["Метод", "Безопасный", "Идемпотентный", "Назначение"],
        [
          ["`GET`", "да", "да", "Получить представление ресурса"],
          ["`HEAD`", "да", "да", "Как `GET`, но без тела"],
          ["`PUT`", "нет", "да", "Заменить ресурс целиком (создать по известному адресу)"],
          ["`DELETE`", "нет", "да", "Удалить ресурс"],
          ["`POST`", "нет", "нет", "Создать ресурс, выполнить действие"],
          ["`PATCH`", "нет", "нет (обычно)", "Частично изменить ресурс"],
        ],
        "Свойства методов HTTP",
      ),
      ul(
        "**Безопасный** — не меняет состояние сервера по смыслу (его можно предзагружать и кешировать). **Идемпотентный** — повтор не меняет результат: его безопасно автоматически повторять при обрыве.",
        "Для неидемпотентных операций вводят **ключ идемпотентности** (`Idempotency-Key`): сервер запоминает результат по ключу и при повторе возвращает прежний ответ.",
        "**Условные запросы** (`If-Match`, `If-None-Match`, `If-Modified-Since`) с `ETag` защищают от потерянного обновления (`412`) и экономят передачу (`304`).",
      ),
      h("HTTP/2 и HTTP/3"),
      ul(
        "**HTTP/2:** один TCP-соединение, много параллельных потоков; бинарные кадры (`HEADERS`, `DATA`, `SETTINGS`, `WINDOW_UPDATE`); сжатие заголовков HPACK; приоритеты; отсутствует блокировка очереди на уровне HTTP (но остаётся на уровне TCP при потере пакета).",
        "**HTTP/3:** тот же смысл поверх QUIC (UDP): независимые потоки без блокировки между собой, быстрое установление соединения (в том числе совмещённое с шифрованием).",
        "Семантика (методы, коды, заголовки) одинакова во всех версиях: меняется способ передачи сообщений.",
      ),
    ]),

    section("syntax", [
      annotated(
        "js",
        `// URL: компоненты, процентное кодирование, разрешение относительных ссылок, международные имена, источник (origin)
const u = new URL("https://user:pa%20ss@Example.COM:8443/a/b/../c%20d/файл.html?q=привет&x=1&x=2#раздел");
console.log("href:     ", u.href);
for (const k of ["protocol", "username", "password", "host", "hostname", "port", "pathname", "search", "hash", "origin"]) console.log(k.padEnd(10), JSON.stringify(u[k]));
console.log("параметры:", JSON.stringify([...u.searchParams]), "; getAll('x') =", JSON.stringify(u.searchParams.getAll("x")));

console.log("\\nпорт по умолчанию отбрасывается: new URL('https://a.test:443/').port =", JSON.stringify(new URL("https://a.test:443/").port), "; http://a.test:80 →", JSON.stringify(new URL("http://a.test:80/").port));
console.log("регистр хоста нормализуется:", new URL("HTTP://ExAmPlE.com/Path").href, "(путь регистр сохраняет)");
console.log("точки в пути вычисляются:", new URL("http://a.test/x/./y/../z").pathname);

console.log("\\nразрешение относительных ссылок от базы https://a.test/dir/page.html?z=1#h:");
for (const rel of ["other.html", "./other.html", "../up.html", "/root.html", "?only=query", "#frag", "//cdn.test/lib.js", "https://b.test/abs", "sub/", "..//double"]) console.log("  " + rel.padEnd(20), "→", new URL(rel, "https://a.test/dir/page.html?z=1#h").href);

console.log("\\nпроцентное кодирование (UTF-8 → %XX):");
for (const s of ["a b", "привет", "😀", "a&b=c", "100%", "a/b?c#d"]) console.log("  " + JSON.stringify(s).padEnd(12), "encodeURIComponent →", encodeURIComponent(s).padEnd(40), " encodeURI →", encodeURI(s));
console.log("«привет» в UTF-8 — 12 байт → 12 · 3 =", "привет".length * 2 * 3, "символов %XX:", encodeURIComponent("привет").length === 36 ? "да" : "нет");
const sp = new URLSearchParams({ q: "a b&c", empty: "" }); sp.append("tag", "x+y");
console.log("URLSearchParams:", sp.toString(), "(пробел → «+» в строке запроса; «+» → %2B)");
console.log("decodeURIComponent('%E0%A4%A') выбрасывает исключение:", (() => { try { decodeURIComponent("%E0%A4%A"); return "нет"; } catch (e) { return e.name; } })());

console.log("\\nмеждународные доменные имена (punycode):", new URL("https://пример.рф/").hostname, "|", new URL("https://münchen.example/").hostname);
console.log("недопустимый URL:", (() => { try { new URL("not a url"); } catch (e) { return e.name + " (" + e.code + ")"; } })(), "; URL.canParse('a:b') =", URL.canParse("a:b"), "; URL.canParse('/rel') =", URL.canParse("/rel"));

console.log("\\nисточник (origin) = схема + хост + порт:");
const same = (a, b) => new URL(a).origin === new URL(b).origin;
for (const [a, b] of [["https://a.test/x", "https://a.test/y"], ["https://a.test", "http://a.test"], ["https://a.test", "https://a.test:8443"], ["https://a.test", "https://sub.a.test"], ["https://a.test:443", "https://a.test"]]) console.log("  " + a.padEnd(20), "и", b.padEnd(22), "один источник:", same(a, b) ? "да" : "нет");
console.log("\\nловушка проверки редиректа: startsWith('https://a.test') принимает https://a.test.evil.test:", "https://a.test.evil.test/".startsWith("https://a.test"), "; сравнение origin:", new URL("https://a.test.evil.test/").origin === "https://a.test");
console.log("и userinfo-обман: new URL('https://a.test@evil.test/').hostname =", new URL("https://a.test@evil.test/").hostname);`,
        [
          { line: 2, text: "`new URL(строка)` разбирает адрес: нормализует регистр хоста, вычисляет `.`/`..`, кодирует не-ASCII символы." },
          { line: 4, text: "Каждый компонент доступен свойством: `protocol`, `hostname`, `port`, `pathname`, `search`, `hash`, `origin`." },
          { line: 5, text: "`searchParams` — разбор параметров запроса: `getAll` возвращает повторяющиеся значения." },
          { line: 7, text: "Порт по умолчанию (443 для `https`) отбрасывается: `port` — пустая строка." },
          { line: 12, text: "Второй аргумент `new URL(относительный, база)` разрешает относительные ссылки по правилам RFC 3986." },
          { line: 15, text: "`encodeURIComponent` кодирует всё, кроме безопасных символов, — для значений параметров; `encodeURI` оставляет разделители." },
          { line: 17, text: "`URLSearchParams` кодирует пробел как `+`, а настоящий `+` — как `%2B`." },
          { line: 26, text: "Источники сравнивают по `origin`, а не по префиксу строки." },
        ],
        "Работа с URL в JavaScript",
      ),
    ]),

    section("minimal-example", [
      h("Сообщение DNS на проводе"),
      code("js", `// DNS «на проводе»: формат сообщения (RFC 1035), сжатие имён, типы записей, коды ответа
const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, "0")).join(" ");
const TYPES = { A: 1, NS: 2, CNAME: 5, SOA: 6, MX: 15, TXT: 16, AAAA: 28 };
const TYPE_NAMES = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v, k]));
const RCODES = ["NOERROR", "FORMERR", "SERVFAIL", "NXDOMAIN", "NOTIMP", "REFUSED"];

function encodeName(name) {
  const parts = name.split(".").filter(Boolean);
  return Buffer.concat([...parts.map((l) => Buffer.concat([Buffer.from([l.length]), Buffer.from(l, "ascii")])), Buffer.from([0])]);
}
function encodeQuery(id, name, type) {
  const h = Buffer.alloc(12);
  h.writeUInt16BE(id, 0); h.writeUInt16BE(0x0100, 2);            // флаги: RD (запрошена рекурсия)
  h.writeUInt16BE(1, 4);                                          // один вопрос
  const q = Buffer.alloc(4); q.writeUInt16BE(TYPES[type], 0); q.writeUInt16BE(1, 2);   // класс IN
  return Buffer.concat([h, encodeName(name), q]);
}
function readName(buf, off) {                                     // с поддержкой указателей сжатия (0xC0xx)
  const labels = []; let jumped = false, end = off, guard = 0;
  for (;;) {
    if (++guard > 64) throw new Error("цикл в указателях сжатия");
    const len = buf[off];
    if (len === 0) { if (!jumped) end = off + 1; break; }
    if ((len & 0xc0) === 0xc0) { const ptr = ((len & 0x3f) << 8) | buf[off + 1]; if (!jumped) end = off + 2; jumped = true; off = ptr; continue; }
    labels.push(buf.toString("ascii", off + 1, off + 1 + len)); off += 1 + len;
  }
  return [labels.join("."), end];
}
function decode(buf) {
  const id = buf.readUInt16BE(0), flags = buf.readUInt16BE(2);
  const qd = buf.readUInt16BE(4), an = buf.readUInt16BE(6), ns = buf.readUInt16BE(8), ar = buf.readUInt16BE(10);
  let off = 12; const questions = [], records = [];
  for (let i = 0; i < qd; i++) { const [n, o] = readName(buf, off); questions.push({ name: n, type: TYPE_NAMES[buf.readUInt16BE(o)] }); off = o + 4; }
  for (let i = 0; i < an + ns + ar; i++) {
    const [n, o] = readName(buf, off); const type = buf.readUInt16BE(o), ttl = buf.readUInt32BE(o + 4), rdlen = buf.readUInt16BE(o + 8);
    let data; const rd = o + 10;
    if (type === 1) data = [...buf.subarray(rd, rd + 4)].join(".");
    else if (type === 28) data = Array.from({ length: 8 }, (_, k) => buf.readUInt16BE(rd + 2 * k).toString(16)).join(":");
    else if (type === 5 || type === 2) data = readName(buf, rd)[0];
    else if (type === 16) data = buf.toString("utf8", rd + 1, rd + 1 + buf[rd]);
    else data = hex(buf.subarray(rd, rd + rdlen));
    records.push({ name: n, type: TYPE_NAMES[type] ?? type, ttl, data }); off = rd + rdlen;
  }
  return { id, qr: flags >> 15, aa: (flags >> 10) & 1, rd: (flags >> 8) & 1, ra: (flags >> 7) & 1, rcode: RCODES[flags & 15], questions, records };
}
const q = encodeQuery(0x1234, "www.example.com", "A");
console.log("запрос A www.example.com (", q.length, "байт ):");
console.log(hex(q));
console.log("  заголовок (12 Б):", hex(q.subarray(0, 12)), "→ id 0x1234, флаги 0x0100 (RD), вопросов 1");
console.log("  имя (17 Б):", hex(q.subarray(12, 29)), "→ 3 «www» 7 «example» 3 «com» 0");
console.log("  тип и класс:", hex(q.subarray(29)), "→ A (1), IN (1)");
console.log("итого:", q.length, "байт — запрос умещается в одну UDP-датаграмму");

// ответ с двумя записями: CNAME и A; имя в ответе — указатель 0xC00C на имя вопроса (сжатие)
const resp = Buffer.concat([
  Buffer.from([0x12, 0x34, 0x81, 0x80, 0x00, 0x01, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00]),                    // заголовок: QR=1, RD, RA; 1 вопрос, 2 ответа
  q.subarray(12),                                                                                          // вопрос
  Buffer.from([0xc0, 0x0c, 0x00, 0x05, 0x00, 0x01, 0x00, 0x00, 0x01, 0x2c, 0x00, 0x06, 0x03, 0x77, 0x65, 0x62, 0xc0, 0x10]),   // www → CNAME web.example.com (метка «web» + указатель на «example.com»), TTL 300
  Buffer.from([0xc0, 0x2d, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x04, 93, 184, 216, 34]),   // имя — указатель на «web.example.com» внутри предыдущей записи; A 93.184.216.34, TTL 60
]);
const r = decode(resp);
console.log("\\nразбор ответа (", resp.length, "байт ):", JSON.stringify({ id: r.id, qr: r.qr, rcode: r.rcode, ra: r.ra }));
for (const rec of r.records) console.log("  ", rec.name.padEnd(18), rec.type.padEnd(6), "TTL", String(rec.ttl).padStart(4), rec.data);
console.log("имя в ответе записано указателем 0xC00C (2 байта) вместо 17 байт полного имени: экономия", 17 - 2, "байт на запись");
console.log("TTL: CNAME 300 с, A 60 с — кеш хранит каждую запись, пока не истечёт её срок");

// ответ NXDOMAIN
const nx = Buffer.concat([Buffer.from([0x12, 0x34, 0x81, 0x83, 0, 1, 0, 0, 0, 0, 0, 0]), q.subarray(12)]);
const rn = decode(nx);
console.log("\\nответ с флагами 0x8183: rcode =", rn.rcode, ", записей:", rn.records.length, "(имя не существует; такой ответ тоже кешируется — «отрицательное кеширование»)");
console.log("типы записей:", Object.entries(TYPES).map(([k, v]) => k + "=" + v).join(", "));
// защита от циклов в сжатии
const evil = Buffer.concat([Buffer.from([0, 1, 0x81, 0x80, 0, 1, 0, 0, 0, 0, 0, 0, 0xc0, 0x0c, 0, 1, 0, 1])]);
try { decode(evil); } catch (e) { console.log("указатель, ссылающийся сам на себя (0xC00C по смещению 12), отвергнут:", e.message); }`, { filename: "01-dns-wire.mjs", collapsed: true }),
      code("text", `запрос A www.example.com ( 33 байт ):
12 34 01 00 00 01 00 00 00 00 00 00 03 77 77 77 07 65 78 61 6d 70 6c 65 03 63 6f 6d 00 00 01 00 01
  заголовок (12 Б): 12 34 01 00 00 01 00 00 00 00 00 00 → id 0x1234, флаги 0x0100 (RD), вопросов 1
  имя (17 Б): 03 77 77 77 07 65 78 61 6d 70 6c 65 03 63 6f 6d 00 → 3 «www» 7 «example» 3 «com» 0
  тип и класс: 00 01 00 01 → A (1), IN (1)
итого: 33 байт — запрос умещается в одну UDP-датаграмму

разбор ответа ( 67 байт ): {"id":4660,"qr":1,"rcode":"NOERROR","ra":1}
   www.example.com    CNAME  TTL  300 web.example.com
   web.example.com    A      TTL   60 93.184.216.34
имя в ответе записано указателем 0xC00C (2 байта) вместо 17 байт полного имени: экономия 15 байт на запись
TTL: CNAME 300 с, A 60 с — кеш хранит каждую запись, пока не истечёт её срок

ответ с флагами 0x8183: rcode = NXDOMAIN , записей: 0 (имя не существует; такой ответ тоже кешируется — «отрицательное кеширование»)
типы записей: A=1, NS=2, CNAME=5, SOA=6, MX=15, TXT=16, AAAA=28
указатель, ссылающийся сам на себя (0xC00C по смещению 12), отвергнут: цикл в указателях сжатия`, { filename: "формат DNS: запрос, ответ со сжатием, NXDOMAIN" }),
      ul(
        "Запрос `A www.example.com` — **33 байта**: заголовок 12 байт (`id 0x1234`, флаги `0x0100` — запрошена рекурсия, один вопрос), имя `03 www 07 example 03 com 00` (17 байт), тип и класс (4 байта).",
        "В ответе (67 байт) имя `www.example.com` записано указателем `0xC00C` — 2 байта вместо 17; цель `CNAME` использует метку `web` и указатель на `example.com`. Записи имеют разные TTL: 300 с и 60 с.",
        "`NXDOMAIN` — код 3 в младших четырёх битах флагов (`0x8183`), записей нет; такой ответ тоже кешируется. Указатель, ссылающийся сам на себя, отвергается — защита от зацикливания.",
      ),
      h("HTTP на проводе"),
      code("js", `// HTTP/1.1 «на проводе»: сервер Node.js на локальном интерфейсе и клиент на сыром TCP-сокете — видны байты запросов и ответов
import http from "node:http";
import net from "node:net";

const server = http.createServer((req, res) => {
  res.sendDate = false;                                           // убираем заголовок Date, чтобы вывод был воспроизводим
  const chunks = []; req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/hello") { const body = "Привет, мир!"; res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Content-Length": Buffer.byteLength(body) }); res.end(req.method === "HEAD" ? undefined : body); }
    else if (url.pathname === "/echo") { const body = Buffer.concat(chunks).toString(); res.writeHead(201, { "Content-Type": "application/json", Location: "/items/1" }); res.end(JSON.stringify({ получено: body.length, метод: req.method })); }
    else if (url.pathname === "/stream") { res.writeHead(200, { "Content-Type": "text/plain" }); res.write("первая часть, "); res.write("вторая часть, "); res.end("конец"); }   // без Content-Length → chunked
    else if (url.pathname === "/old") { res.writeHead(301, { Location: "/hello" }); res.end(); }
    else if (url.pathname === "/range") { const full = "0123456789abcdefghij"; const m = /bytes=(\\d+)-(\\d+)/.exec(req.headers.range ?? ""); if (m) { res.writeHead(206, { "Content-Range": \`bytes \${m[1]}-\${m[2]}/\${full.length}\`, "Content-Length": +m[2] - +m[1] + 1 }); res.end(full.slice(+m[1], +m[2] + 1)); } else { res.writeHead(200, { "Accept-Ranges": "bytes", "Content-Length": full.length }); res.end(full); } }
    else if (url.pathname === "/nocontent") { res.writeHead(204); res.end(); }
    else { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("нет такого ресурса"); }
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

function raw(request, { closeAfterMs = 150 } = {}) {                // отправляем текст запроса как есть и собираем все байты ответа
  return new Promise((resolve) => {
    const s = net.connect(port, "127.0.0.1"); const parts = [];
    s.on("data", (d) => parts.push(d)); s.on("connect", () => s.write(request));
    setTimeout(() => { s.destroy(); resolve(Buffer.concat(parts)); }, closeAfterMs);
  });
}
const vis = (buf) => buf.toString("utf8").replace(/\\r\\n/g, "⏎\\n");     // ⏎ обозначает CR LF
async function show(title, request) {
  const resp = await raw(request);
  console.log("== " + title + " ==\\n→ запрос (" + Buffer.byteLength(request) + " байт):\\n" + vis(Buffer.from(request)) + "← ответ (" + resp.length + " байт):\\n" + vis(resp) + "\\n");
}
const h = "Host: example.test\\r\\nUser-Agent: demo\\r\\nAccept: */*\\r\\n";
await show("GET с Content-Length", \`GET /hello HTTP/1.1\\r\\n\${h}\\r\\n\`);
await show("HEAD: те же заголовки, но без тела", \`HEAD /hello HTTP/1.1\\r\\n\${h}\\r\\n\`);
const body = JSON.stringify({ имя: "Анна" });
await show("POST с телом JSON", \`POST /echo HTTP/1.1\\r\\n\${h}Content-Type: application/json\\r\\nContent-Length: \${Buffer.byteLength(body)}\\r\\n\\r\\n\${body}\`);
await show("ответ без Content-Length: chunked", \`GET /stream HTTP/1.1\\r\\n\${h}\\r\\n\`);
await show("перенаправление 301", \`GET /old HTTP/1.1\\r\\n\${h}\\r\\n\`);
await show("частичный ответ: Range", \`GET /range HTTP/1.1\\r\\n\${h}Range: bytes=5-9\\r\\n\\r\\n\`);
await show("204: успех без тела", \`GET /nocontent HTTP/1.1\\r\\n\${h}\\r\\n\`);
await show("несуществующий ресурс", \`GET /нет HTTP/1.1\\r\\n\${h}\\r\\n\`.replace("/нет", "/%D0%BD%D0%B5%D1%82"));
const bad = await raw("GET /hello HTTP/1.1\\r\\nUser-Agent: demo\\r\\n\\r\\n");
console.log("== запрос HTTP/1.1 без заголовка Host ==\\nответ:", vis(bad).split("⏎")[0]);
server.close(); server.closeAllConnections();`, { filename: "03-http-wire.mjs", collapsed: true }),
      code("text", `== GET с Content-Length ==
→ запрос (74 байт):
GET /hello HTTP/1.1⏎
Host: example.test⏎
User-Agent: demo⏎
Accept: */*⏎
⏎
← ответ (148 байт):
HTTP/1.1 200 OK⏎
Content-Type: text/plain; charset=utf-8⏎
Content-Length: 21⏎
Connection: keep-alive⏎
Keep-Alive: timeout=5⏎
⏎
Привет, мир!

== HEAD: те же заголовки, но без тела ==
→ запрос (75 байт):
HEAD /hello HTTP/1.1⏎
Host: example.test⏎
User-Agent: demo⏎
Accept: */*⏎
⏎
← ответ (127 байт):
HTTP/1.1 200 OK⏎
Content-Type: text/plain; charset=utf-8⏎
Content-Length: 21⏎
Connection: keep-alive⏎
Keep-Alive: timeout=5⏎
⏎


== POST с телом JSON ==
→ запрос (147 байт):
POST /echo HTTP/1.1⏎
Host: example.test⏎
User-Agent: demo⏎
Accept: */*⏎
Content-Type: application/json⏎
Content-Length: 21⏎
⏎
{"имя":"Анна"}← ответ (205 байт):
HTTP/1.1 201 Created⏎
Content-Type: application/json⏎
Location: /items/1⏎
Connection: keep-alive⏎
Keep-Alive: timeout=5⏎
Transfer-Encoding: chunked⏎
⏎
2b⏎
{"получено":14,"метод":"POST"}⏎
0⏎
⏎


== ответ без Content-Length: chunked ==
→ запрос (75 байт):
GET /stream HTTP/1.1⏎
Host: example.test⏎
User-Agent: demo⏎
Accept: */*⏎
⏎
← ответ (202 байт):
HTTP/1.1 200 OK⏎
Content-Type: text/plain⏎
Connection: keep-alive⏎
Keep-Alive: timeout=5⏎
Transfer-Encoding: chunked⏎
⏎
19⏎
первая часть, ⏎
19⏎
вторая часть, ⏎
a⏎
конец⏎
0⏎
⏎


== перенаправление 301 ==
→ запрос (72 байт):
GET /old HTTP/1.1⏎
Host: example.test⏎
User-Agent: demo⏎
Accept: */*⏎
⏎
← ответ (132 байт):
HTTP/1.1 301 Moved Permanently⏎
Location: /hello⏎
Connection: keep-alive⏎
Keep-Alive: timeout=5⏎
Transfer-Encoding: chunked⏎
⏎
0⏎
⏎


== частичный ответ: Range ==
→ запрос (92 байт):
GET /range HTTP/1.1⏎
Host: example.test⏎
User-Agent: demo⏎
Accept: */*⏎
Range: bytes=5-9⏎
⏎
← ответ (132 байт):
HTTP/1.1 206 Partial Content⏎
Content-Range: bytes 5-9/20⏎
Content-Length: 5⏎
Connection: keep-alive⏎
Keep-Alive: timeout=5⏎
⏎
56789

== 204: успех без тела ==
→ запрос (78 байт):
GET /nocontent HTTP/1.1⏎
Host: example.test⏎
User-Agent: demo⏎
Accept: */*⏎
⏎
← ответ (74 байт):
HTTP/1.1 204 No Content⏎
Connection: keep-alive⏎
Keep-Alive: timeout=5⏎
⏎


== несуществующий ресурс ==
→ запрос (87 байт):
GET /%D0%BD%D0%B5%D1%82 HTTP/1.1⏎
Host: example.test⏎
User-Agent: demo⏎
Accept: */*⏎
⏎
← ответ (172 байт):
HTTP/1.1 404 Not Found⏎
Content-Type: text/plain⏎
Connection: keep-alive⏎
Keep-Alive: timeout=5⏎
Transfer-Encoding: chunked⏎
⏎
22⏎
нет такого ресурса⏎
0⏎
⏎


== запрос HTTP/1.1 без заголовка Host ==
ответ: HTTP/1.1 400 Bad Request`, { filename: "Node.js: байты запросов и ответов HTTP/1.1 (⏎ — CR LF)" }),
      ul(
        "Запрос `GET /hello` занимает 74 байта: строка запроса, три заголовка и пустая строка. Ответ — 148 байт: 127 байт заголовков и тело в 21 байт `Привет, мир!` — длина в **байтах** (кириллица — по 2 байта), а не в символах.",
        "`HEAD` вернул те же заголовки (127 байт), но без тела. `POST` с телом JSON: `Content-Length: 21` при 14 символах — классическая ошибка при подсчёте длины через `.length`.",
        "Ответ без `Content-Length` отправляется как `chunked`: куски `19` (25 байт «первая часть, »), `19`, `a` (10 байт «конец») и финальный `0`. Ответ `201` с JSON тоже ушёл кусками: размер `2b` — 43 байта.",
        "`301` несёт `Location` и пустое тело; `206` — `Content-Range: bytes 5-9/20` и 5 байт `56789`; `204` — только заголовки; запрос без `Host` — `400 Bad Request`.",
      ),
    ]),

    section("detailed-example", [
      h("Иерархия DNS и кеш: корень → .test → example.test"),
      code("js", `// Иерархия DNS на локальном интерфейсе: корневой сервер, сервер зоны верхнего уровня .test и авторитетный сервер example.test.
// Серверы и резолвер обмениваются настоящими DNS-сообщениями по UDP; часы кеша — условные (можно «перемотать» время).
import dgram from "node:dgram";

// ---- минимальный кодек DNS (формат из RFC 1035) ----
const T = { A: 1, NS: 2, CNAME: 5, SOA: 6, TXT: 16 }, TN = Object.fromEntries(Object.entries(T).map(([k, v]) => [v, k]));
const encName = (n) => Buffer.concat([...n.split(".").filter(Boolean).map((l) => Buffer.concat([Buffer.from([l.length]), Buffer.from(l)])), Buffer.from([0])]);
function readName(b, off) { const out = []; let end = off, jumped = false; for (;;) { const l = b[off]; if (l === 0) { if (!jumped) end = off + 1; break; } if ((l & 0xc0) === 0xc0) { if (!jumped) end = off + 2; jumped = true; off = ((l & 0x3f) << 8) | b[off + 1]; continue; } out.push(b.toString("ascii", off + 1, off + 1 + l)); off += 1 + l; } return [out.join("."), end]; }
function encRR(r) {
  let rd; if (r.type === "A") rd = Buffer.from(r.data.split(".").map(Number)); else if (r.type === "TXT") rd = Buffer.concat([Buffer.from([r.data.length]), Buffer.from(r.data)]); else rd = encName(r.data);
  const h = Buffer.alloc(10); h.writeUInt16BE(T[r.type], 0); h.writeUInt16BE(1, 2); h.writeUInt32BE(r.ttl, 4); h.writeUInt16BE(rd.length, 8);
  return Buffer.concat([encName(r.name), h, rd]);
}
function encode({ id, qr, aa, rcode = 0, question, an = [], ns = [], ar = [] }) {
  const h = Buffer.alloc(12); h.writeUInt16BE(id, 0); h.writeUInt16BE((qr << 15) | (aa << 10) | 0x0100 | rcode, 2); h.writeUInt16BE(1, 4); h.writeUInt16BE(an.length, 6); h.writeUInt16BE(ns.length, 8); h.writeUInt16BE(ar.length, 10);
  const q = Buffer.alloc(4); q.writeUInt16BE(T[question.type], 0); q.writeUInt16BE(1, 2);
  return Buffer.concat([h, encName(question.name), q, ...an.map(encRR), ...ns.map(encRR), ...ar.map(encRR)]);
}
function decode(b) {
  const id = b.readUInt16BE(0), fl = b.readUInt16BE(2), qd = b.readUInt16BE(4), an = b.readUInt16BE(6), ns = b.readUInt16BE(8), ar = b.readUInt16BE(10);
  let off = 12; const [qn, o1] = readName(b, off); const question = { name: qn, type: TN[b.readUInt16BE(o1)] }; off = o1 + 4;
  const rr = []; for (let i = 0; i < an + ns + ar; i++) {
    const [n, o] = readName(b, off); const type = b.readUInt16BE(o), ttl = b.readUInt32BE(o + 4), len = b.readUInt16BE(o + 8), rd = o + 10;
    const data = type === 1 ? [...b.subarray(rd, rd + 4)].join(".") : type === 16 ? b.toString("utf8", rd + 1, rd + 1 + b[rd]) : readName(b, rd)[0];
    rr.push({ name: n, type: TN[type], ttl, data, sec: i < an ? "an" : i < an + ns ? "ns" : "ar" }); off = rd + len;
  }
  return { id, rcode: fl & 15, aa: (fl >> 10) & 1, question, rr };
}

// ---- данные зон ----
const ZONES = {
  root: { name: "root", records: [], delegations: { test: { ns: "ns.tld.test", glue: "ns.tld.test" } } },
  tld: { name: "tld", records: [], delegations: { "example.test": { ns: "ns.example.test", glue: "ns.example.test" } } },
  auth: {
    name: "auth", delegations: {},
    records: [
      { name: "www.example.test", type: "CNAME", ttl: 300, data: "web.example.test" },
      { name: "web.example.test", type: "A", ttl: 60, data: "192.0.2.10" },
      { name: "mail.example.test", type: "A", ttl: 60, data: "192.0.2.25" },
      { name: "multi.example.test", type: "A", ttl: 60, data: "192.0.2.1" }, { name: "multi.example.test", type: "A", ttl: 60, data: "192.0.2.2" }, { name: "multi.example.test", type: "A", ttl: 60, data: "192.0.2.3" },
      { name: "example.test", type: "TXT", ttl: 120, data: "v=spf1 -all" },
    ],
  },
};
const log = [];                                                                 // журнал обращений к серверам
function startServer(zone) {
  const sock = dgram.createSocket("udp4"); const rot = new Map();
  sock.on("message", (msg, rinfo) => {
    const q = decode(msg); log.push(zone.name + ": " + q.question.type + " " + q.question.name);
    let resp;
    const deleg = Object.entries(zone.delegations).find(([z]) => q.question.name === z || q.question.name.endsWith("." + z));
    if (deleg) {                                                                // отсылка: NS и «клей» с адресом (в учебной модели — имя NS)
      resp = encode({ id: q.id, qr: 1, aa: 0, question: q.question, ns: [{ name: deleg[0], type: "NS", ttl: 3600, data: deleg[1].ns }], ar: [{ name: deleg[1].ns, type: "A", ttl: 3600, data: "127.0.0.1" }] });
    } else {
      let an = []; let name = q.question.name;
      for (let hop = 0; hop < 5; hop++) {                                       // следуем по цепочке CNAME внутри зоны
        const cn = zone.records.find((r) => r.name === name && r.type === "CNAME");
        if (cn && q.question.type !== "CNAME") { an.push(cn); name = cn.data; continue; }
        break;
      }
      const direct = zone.records.filter((r) => r.name === name && r.type === q.question.type);
      if (direct.length > 1) { const k = (rot.get(name) ?? 0); rot.set(name, k + 1); direct.push(...direct.splice(0, k % direct.length)); }   // круговой перебор
      an.push(...direct);
      const exists = zone.records.some((r) => r.name === q.question.name);
      resp = encode({ id: q.id, qr: 1, aa: 1, rcode: an.length === 0 && !exists ? 3 : 0, question: q.question, an });
    }
    sock.send(resp, rinfo.port, rinfo.address);
  });
  return new Promise((res) => sock.bind(0, "127.0.0.1", () => res({ sock, port: sock.address().port })));
}
const servers = { root: await startServer(ZONES.root), tld: await startServer(ZONES.tld), auth: await startServer(ZONES.auth) };
const NS_PORT = { "ns.tld.test": servers.tld.port, "ns.example.test": servers.auth.port };   // «клей»: имя сервера → адрес:порт (на реальном DNS порт всегда 53)

// ---- рекурсивный резолвер с кешем и условными часами ----
let clock = 0, nextId = 1;
const cache = new Map(), nsCache = new Map();
const client = dgram.createSocket("udp4");
function ask(port, question) {
  const id = nextId++; return new Promise((resolve) => { const onMsg = (m) => { const r = decode(m); if (r.id === id) { client.off("message", onMsg); resolve(r); } }; client.on("message", onMsg); client.send(encode({ id, qr: 0, aa: 0, question }), port, "127.0.0.1"); });
}
async function resolve(name, type = "A") {
  const key = type + " " + name, hit = cache.get(key);
  if (hit && hit.expires > clock) return { ...hit.result, fromCache: true };
  let port = servers.root.port, zone = "";
  for (const z of [...nsCache.keys()].sort((a, b) => b.length - a.length)) if ((name === z || name.endsWith("." + z)) && nsCache.get(z).expires > clock) { port = NS_PORT[nsCache.get(z).ns]; zone = z; break; }
  for (let step = 0; step < 6; step++) {
    const r = await ask(port, { name, type });
    const ns = r.rr.find((x) => x.sec === "ns");
    if (ns) { nsCache.set(ns.name, { ns: ns.data, expires: clock + ns.ttl * 1000 }); port = NS_PORT[ns.data]; continue; }
    const answers = r.rr.filter((x) => x.sec === "an");
    const ttl = answers.length ? Math.min(...answers.map((x) => x.ttl)) : 30;             // для NXDOMAIN — условный «отрицательный» TTL 30 с
    const result = { rcode: r.rcode, answers };
    cache.set(key, { result, expires: clock + ttl * 1000 });
    return { ...result, fromCache: false };
  }
}
async function lookup(label, name, type = "A") {
  const before = log.length; const r = await resolve(name, type);
  const sent = log.slice(before);
  console.log(label.padEnd(44), (r.fromCache ? "из кеша" : sent.length + " запрос(а/ов)").padEnd(14), r.rcode === 3 ? "NXDOMAIN" : r.answers.map((a) => a.type === "A" || a.type === "TXT" ? a.data : a.type + "→" + a.data).join(", "), sent.length ? "   [" + sent.join("; ") + "]" : "");
  return sent.length;
}
const counts = [];
counts.push(await lookup("1. www.example.test A (холодный кеш)", "www.example.test"));
counts.push(await lookup("2. то же сразу повторно", "www.example.test"));
counts.push(await lookup("3. mail.example.test A (другое имя в той же зоне)", "mail.example.test"));
clock += 61_000;
counts.push(await lookup("4. mail.example.test через 61 с (TTL записи 60 с)", "mail.example.test"));
counts.push(await lookup("5. www.example.test через 61 с (мин. TTL ответа 60 с)", "www.example.test"));
counts.push(await lookup("6. missing.example.test (несуществующее имя)", "missing.example.test"));
counts.push(await lookup("7. то же повторно (отрицательное кеширование)", "missing.example.test"));
counts.push(await lookup("8. TXT example.test", "example.test", "TXT"));
console.log("\\nкруговой перебор: три адреса для multi.example.test, кеш отключён (порядок первого адреса меняется между ответами)");
const firsts = [];
for (let i = 0; i < 4; i++) { cache.clear(); const r = await resolve("multi.example.test"); firsts.push(r.answers[0].data); }
console.log("первые адреса в четырёх ответах:", firsts.join(" → "));
console.log("\\nвсего обращений к серверам:", log.length, "= корень:", log.filter((l) => l.startsWith("root")).length, ", .test:", log.filter((l) => l.startsWith("tld")).length, ", example.test:", log.filter((l) => l.startsWith("auth")).length);
console.log("холодный запрос потребовал 3 обращения (корень → .test → example.test), тёплый — 0, новое имя в известной зоне — 1:", counts[0] === 3 && counts[1] === 0 && counts[2] === 1 ? "да" : "нет");
for (const s of Object.values(servers)) s.sock.close(); client.close();`, { filename: "02-dns-hierarchy.mjs", collapsed: true }),
      code("text", `1. www.example.test A (холодный кеш)         3 запрос(а/ов) CNAME→web.example.test, 192.0.2.10    [root: A www.example.test; tld: A www.example.test; auth: A www.example.test]
2. то же сразу повторно                      из кеша        CNAME→web.example.test, 192.0.2.10 
3. mail.example.test A (другое имя в той же зоне) 1 запрос(а/ов) 192.0.2.25    [auth: A mail.example.test]
4. mail.example.test через 61 с (TTL записи 60 с) 1 запрос(а/ов) 192.0.2.25    [auth: A mail.example.test]
5. www.example.test через 61 с (мин. TTL ответа 60 с) 1 запрос(а/ов) CNAME→web.example.test, 192.0.2.10    [auth: A www.example.test]
6. missing.example.test (несуществующее имя) 1 запрос(а/ов) NXDOMAIN    [auth: A missing.example.test]
7. то же повторно (отрицательное кеширование) из кеша        NXDOMAIN 
8. TXT example.test                          1 запрос(а/ов) v=spf1 -all    [auth: TXT example.test]

круговой перебор: три адреса для multi.example.test, кеш отключён (порядок первого адреса меняется между ответами)
первые адреса в четырёх ответах: 192.0.2.1 → 192.0.2.2 → 192.0.2.3 → 192.0.2.1

всего обращений к серверам: 12 = корень: 1 , .test: 1 , example.test: 10
холодный запрос потребовал 3 обращения (корень → .test → example.test), тёплый — 0, новое имя в известной зоне — 1: да`, { filename: "три настоящих DNS-сервера по UDP на локальном интерфейсе" }),
      ul(
        "**Холодный запрос** `www.example.test`: корень отсылает к серверу `.test`, тот — к авторитетному серверу `example.test`, который отвечает цепочкой `CNAME → A`: **3 обращения**. Повтор — из кеша, **0 обращений**.",
        "Другое имя в той же зоне (`mail.example.test`) — **1 обращение**: делегирование (NS) уже в кеше, корень и `.test` пропускаются.",
        "Через условные 61 секунду запись с TTL 60 истекла: снова **1 обращение**; для неё хранятся и корневые данные (TTL делегирования — 3600 с).",
        "Несуществующее имя: `NXDOMAIN` — 1 обращение; повтор берётся из **отрицательного кеша** (0).",
        "Имя с тремя адресами: сервер вращает порядок записей (`192.0.2.1 → .2 → .3 → .1`) — простейшая балансировка нагрузки (round-robin DNS). Всего 12 обращений: корень 1, `.test` 1, `example.test` 10.",
        "Это модель: серверы и резолвер — учебные, часы кеша условные, а «клей» (адрес NS) сопоставляется с портами, потому что в реальном DNS порт всегда 53. Формат сообщений — настоящий (RFC 1035).",
      ),
      h("Постоянные соединения: цена нового соединения"),
      code("js", `// Повторное использование соединений: 10 запросов через канал с условной задержкой RTT = 40 мс (прокси добавляет по 20 мс в каждую сторону
// и «рукопожатие» в 1 RTT на каждое новое соединение). Время — в stderr, на stdout — число соединений и проверки.
import http from "node:http";
import net from "node:net";

let connections = 0;
const upstream = http.createServer((req, res) => { res.sendDate = false; res.end("ok"); });
upstream.on("connection", () => connections++);
await new Promise((r) => upstream.listen(0, "127.0.0.1", r));
const upPort = upstream.address().port;

const ONE_WAY = 20;                                                   // мс
const proxy = net.createServer((client) => {
  const up = net.connect(upPort, "127.0.0.1");
  let ready = false; const queue = [];
  const delayTo = (sock, d) => (chunk) => setTimeout(() => sock.destroyed || sock.write(chunk), d);
  setTimeout(() => { ready = true; queue.forEach((c) => delayTo(up, ONE_WAY)(c)); }, 2 * ONE_WAY);        // «рукопожатие»: первый байт идёт не раньше 1 RTT
  client.on("data", (c) => (ready ? delayTo(up, ONE_WAY)(c) : queue.push(c)));
  up.on("data", delayTo(client, ONE_WAY));
  client.on("close", () => up.destroy()); up.on("close", () => setTimeout(() => client.destroy(), ONE_WAY));
  client.on("error", () => {}); up.on("error", () => {});
});
await new Promise((r) => proxy.listen(0, "127.0.0.1", r));
const port = proxy.address().port;

const get = (agent) => new Promise((resolve, reject) => {
  http.get({ host: "127.0.0.1", port, path: "/", agent, headers: agent ? {} : { Connection: "close" } }, (res) => { res.resume(); res.on("end", resolve); }).on("error", reject);
});
async function scenario(name, agent, parallel) {
  connections = 0; const t = performance.now();
  if (parallel) await Promise.all(Array.from({ length: 10 }, () => get(agent)));
  else for (let i = 0; i < 10; i++) await get(agent);
  const ms = performance.now() - t; agent?.destroy();
  return { name, ms, conns: connections };
}
const a = await scenario("новое соединение на каждый запрос, последовательно", new http.Agent({ keepAlive: false }), false);
const b = await scenario("одно соединение (keep-alive), последовательно", new http.Agent({ keepAlive: true, maxSockets: 1 }), false);
const c = await scenario("до 6 соединений (keep-alive), параллельно", new http.Agent({ keepAlive: true, maxSockets: 6 }), true);
console.log("10 запросов через канал с RTT 40 мс (модель)");
for (const r of [a, b, c]) console.log(" ", r.name.padEnd(52), "соединений:", String(r.conns).padStart(2));
for (const r of [a, b, c]) console.error(r.name, r.ms.toFixed(0), "мс");
console.log("без повторного использования открыто 10 соединений, с keep-alive — 1, при параллельности — 6:", a.conns === 10 && b.conns === 1 && c.conns === 6 ? "да" : "нет");
console.log("keep-alive быстрее соединения на каждый запрос более чем в 1,5 раза:", a.ms > 1.5 * b.ms ? "да" : "нет");
console.log("параллельные запросы по 6 соединениям быстрее последовательных по одному соединению более чем в 2 раза:", b.ms > 2 * c.ms ? "да" : "нет");
proxy.close(); upstream.close(); upstream.closeAllConnections?.();`, { filename: "04-http-keepalive.mjs", collapsed: true }),
      code("text", `10 запросов через канал с RTT 40 мс (модель)
  новое соединение на каждый запрос, последовательно   соединений: 10
  одно соединение (keep-alive), последовательно        соединений:  1
  до 6 соединений (keep-alive), параллельно            соединений:  6
без повторного использования открыто 10 соединений, с keep-alive — 1, при параллельности — 6: да
keep-alive быстрее соединения на каждый запрос более чем в 1,5 раза: да
параллельные запросы по 6 соединениям быстрее последовательных по одному соединению более чем в 2 раза: да`, { filename: "10 запросов через канал с RTT 40 мс (модель задержки)" }),
      ul(
        "Прокси добавляет по 20 мс в каждую сторону и «рукопожатие» в 1 RTT на каждое новое соединение. Калибровка: **новое соединение на каждый запрос — 854 мс** (10 соединений, ≈ 2 RTT на запрос), **одно постоянное соединение — 470 мс** (1 соединение, ≈ 1 RTT на запрос плюс одно рукопожатие), **до шести параллельных — 129 мс** (6 соединений, две «волны»).",
        "Разница — именно в кругах RTT: ни пропускная способность, ни размер ответа (2 байта) не изменились.",
        "Браузеры открывают до шести соединений к одному серверу, чтобы обойти блокировку очереди в HTTP/1.1; HTTP/2 решает ту же задачу одним соединением.",
      ),
      h("HTTP/2: мультиплексирование и сжатие заголовков"),
      code("js", `// HTTP/1.1 и HTTP/2 (без TLS, режим h2c) на локальном интерфейсе: мультиплексирование, сжатие заголовков, кадры.
import http from "node:http";
import http2 from "node:http2";
import net from "node:net";

const WORK = 50;                                                  // каждый запрос обрабатывается 50 мс
const handler = (req, res) => { setTimeout(() => { res.statusCode = 200; res.end("ok"); }, WORK); };
const h1 = http.createServer((req, res) => { res.sendDate = false; handler(req, res); });
const h2 = http2.createServer(handler);
await new Promise((r) => h1.listen(0, "127.0.0.1", r));
await new Promise((r) => h2.listen(0, "127.0.0.1", r));
const p1 = h1.address().port, p2 = h2.address().port;

// 1. скорость: 10 запросов
const get1 = (agent) => new Promise((resolve) => http.get({ host: "127.0.0.1", port: p1, path: "/", agent }, (res) => { res.resume(); res.on("end", resolve); }));
async function t1(maxSockets, parallel) {
  const agent = new http.Agent({ keepAlive: true, maxSockets }); const t = performance.now();
  if (parallel) await Promise.all(Array.from({ length: 10 }, () => get1(agent))); else for (let i = 0; i < 10; i++) await get1(agent);
  agent.destroy(); return performance.now() - t;
}
async function tH2() {
  const c = http2.connect("http://127.0.0.1:" + p2); const t = performance.now();
  await Promise.all(Array.from({ length: 10 }, () => new Promise((resolve) => { const r = c.request({ ":path": "/" }); r.resume(); r.on("end", resolve); r.end(); })));
  const ms = performance.now() - t; c.close(); return ms;
}
const seq = await t1(1, false), six = await t1(6, true), multi = await tH2();
console.error(\`HTTP/1.1 одно соединение \${seq.toFixed(0)} мс, 6 соединений \${six.toFixed(0)} мс, HTTP/2 одно соединение \${multi.toFixed(0)} мс\`);
console.log("10 запросов по 50 мс обработки на сервере:");
console.log("  HTTP/1.1, одно соединение, по очереди: не меньше 500 мс:", seq >= 500 ? "да" : "нет");
console.log("  HTTP/1.1, 6 соединений: около двух «волн» (меньше 250 мс и больше 100 мс):", six < 250 && six >= 100 ? "да" : "нет");
console.log("  HTTP/2, одно соединение, все запросы одновременно: меньше 150 мс:", multi < 150 ? "да" : "нет");
console.log("  HTTP/2 быстрее одного HTTP/1.1-соединения более чем в 3 раза:", seq > 3 * multi ? "да" : "нет");

// 2. счётчик байтов клиент → сервер через прозрачный прокси
function counting(targetPort) {
  const stat = { toServer: 0, first: Buffer.alloc(0) };
  const srv = net.createServer((c) => { const u = net.connect(targetPort, "127.0.0.1"); c.on("data", (d) => { stat.toServer += d.length; if (stat.first.length < 400) stat.first = Buffer.concat([stat.first, d]); u.write(d); }); u.on("data", (d) => c.write(d)); c.on("close", () => u.destroy()); u.on("close", () => c.destroy()); c.on("error", () => {}); u.on("error", () => {}); });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r({ srv, stat, port: srv.address().port })));
}
const HEADERS = { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "accept-language": "ru-RU,ru;q=0.9,en;q=0.8", "accept-encoding": "gzip, deflate, br", cookie: "session=" + "a".repeat(120) + "; theme=dark" };
const N = 10;
{
  const { srv, stat, port } = await counting(p1);
  const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
  for (let i = 0; i < N; i++) await new Promise((resolve) => http.get({ host: "127.0.0.1", port, path: "/page" + i, agent, headers: HEADERS }, (res) => { res.resume(); res.on("end", resolve); }));
  agent.destroy(); await new Promise((r) => setTimeout(r, 50));
  var bytes1 = stat.toServer; srv.close();
}
let first2, bytes2, frames;
{
  const { srv, stat, port } = await counting(p2);
  const c = http2.connect("http://127.0.0.1:" + port);
  for (let i = 0; i < N; i++) await new Promise((resolve) => { const r = c.request({ ":path": "/page" + i, ...HEADERS }); r.resume(); r.on("end", resolve); r.end(); });
  c.close(); await new Promise((r) => setTimeout(r, 100));
  bytes2 = stat.toServer; first2 = stat.first; srv.close();
  // разбор кадров HTTP/2 в начале потока
  const preface = first2.subarray(0, 24).toString();
  let off = 24; frames = [];
  const TYPES = ["DATA", "HEADERS", "PRIORITY", "RST_STREAM", "SETTINGS", "PUSH_PROMISE", "PING", "GOAWAY", "WINDOW_UPDATE", "CONTINUATION"];
  while (off + 9 <= first2.length && frames.length < 6) { const len = first2.readUIntBE(off, 3), type = first2[off + 3], sid = first2.readUInt32BE(off + 5) & 0x7fffffff; frames.push(\`\${TYPES[type] ?? type}(поток \${sid}, \${len} Б)\`); off += 9 + len; }
  console.log("\\nначало потока клиента HTTP/2:", JSON.stringify(preface), "(24 байта «преамбулы»)");
  console.log("первые кадры за преамбулой:", frames.join(", "));
}
console.log("\\n" + N + " одинаковых по составу запросов с типичными заголовками браузера и cookie:");
console.log("  HTTP/1.1: отправлено клиентом", bytes1, "байт (", Math.round(bytes1 / N), "в среднем на запрос )");
console.log("  HTTP/2:   отправлено клиентом", bytes2, "байт (", Math.round(bytes2 / N), "в среднем на запрос, включая служебные кадры )");
console.log("HTTP/2 передал не больше четверти байт HTTP/1.1 благодаря сжатию заголовков (HPACK):", bytes2 * 4 <= bytes1 ? "да" : "нет");
h1.close(); h2.close(); h1.closeAllConnections?.();`, { filename: "05-http2.mjs", collapsed: true }),
      code("text", `10 запросов по 50 мс обработки на сервере:
  HTTP/1.1, одно соединение, по очереди: не меньше 500 мс: да
  HTTP/1.1, 6 соединений: около двух «волн» (меньше 250 мс и больше 100 мс): да
  HTTP/2, одно соединение, все запросы одновременно: меньше 150 мс: да
  HTTP/2 быстрее одного HTTP/1.1-соединения более чем в 3 раза: да

начало потока клиента HTTP/2: "PRI * HTTP/2.0\\r\\n\\r\\nSM\\r\\n\\r\\n" (24 байта «преамбулы»)
первые кадры за преамбулой: SETTINGS(поток 0, 0 Б), HEADERS(поток 1, 277 Б), SETTINGS(поток 0, 0 Б), HEADERS(поток 3, 15 Б), HEADERS(поток 5, 15 Б), HEADERS(поток 7, 15 Б)

10 одинаковых по составу запросов с типичными заголовками браузера и cookie:
  HTTP/1.1: отправлено клиентом 4820 байт ( 482 в среднем на запрос )
  HTTP/2:   отправлено клиентом 578 байт ( 58 в среднем на запрос, включая служебные кадры )
HTTP/2 передал не больше четверти байт HTTP/1.1 благодаря сжатию заголовков (HPACK): да`, { filename: "Node.js 22: HTTP/1.1 и HTTP/2 (h2c) на локальном интерфейсе" }),
      ul(
        "Сервер обрабатывает каждый запрос 50 мс. 10 запросов по одному HTTP/1.1-соединению идут по очереди — **537 мс**; через 6 соединений — **109 мс**; HTTP/2 по **одному** соединению — **66 мс**, потому что все потоки идут одновременно.",
        "Клиент HTTP/2 начинает с 24-байтной преамбулы `PRI * HTTP/2.0 ⏎⏎ SM ⏎⏎`, затем кадры: `SETTINGS`, `HEADERS` (поток 1, 277 байт — полный набор заголовков), `SETTINGS` (подтверждение) и `HEADERS` потоков 3, 5, 7 — **по 15 байт**: заголовки, которые не изменились, берутся из таблицы HPACK.",
        "Итого для 10 запросов с типичными заголовками браузера и cookie клиент отправил 4820 байт по HTTP/1.1 и 578 байт по HTTP/2 — **в 8 с лишним раз меньше**.",
        "HTTP/2 убирает блокировку очереди на уровне HTTP, но остаётся одно TCP-соединение: при потере пакета ждут все потоки — поэтому появился HTTP/3 на QUIC.",
      ),
      h("Семантика методов: повторы и условные запросы"),
      code("js", `// Семантика методов HTTP: безопасность и идемпотентность, повтор запроса после обрыва, Idempotency-Key, условные запросы
import http from "node:http";

const items = new Map(); let nextId = 1; const keys = new Map();     // «база данных» в памяти
const server = http.createServer((req, res) => {
  res.sendDate = false;
  let body = ""; req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (code, obj, headers = {}) => { res.writeHead(code, { "Content-Type": "application/json", ...headers }); res.end(JSON.stringify(obj)); };
    const m = /^\\/items(?:\\/(\\d+))?$/.exec(req.url);
    if (!m) return send(404, { ошибка: "нет ресурса" });
    const id = m[1] && Number(m[1]);
    if (req.method === "POST" && !id) {
      const key = req.headers["idempotency-key"];
      if (key && keys.has(key)) return send(200, keys.get(key), { "Idempotent-Replay": "true" });     // повтор: возвращаем прежний результат
      const item = { id: nextId++, name: JSON.parse(body).name, version: 1 }; items.set(item.id, item);
      if (key) keys.set(key, item);
      return send(201, item, { Location: "/items/" + item.id });
    }
    if (req.method === "PUT" && id) {
      const cur = items.get(id); const match = req.headers["if-match"];
      if (match && (!cur || \`"\${cur.version}"\` !== match)) return send(412, { ошибка: "версия устарела" });
      const item = { id, name: JSON.parse(body).name, version: (cur?.version ?? 0) + 1 }; items.set(id, item);
      return send(cur ? 200 : 201, item, { ETag: \`"\${item.version}"\` });
    }
    if (req.method === "DELETE" && id) { const had = items.delete(id); return had ? send(204, {}) : send(404, { ошибка: "уже удалён" }); }
    if (req.method === "GET") return id ? (items.has(id) ? send(200, items.get(id), { ETag: \`"\${items.get(id).version}"\` }) : send(404, { ошибка: "нет" })) : send(200, [...items.values()]);
    return send(405, { ошибка: "метод не поддерживается" }, { Allow: "GET, POST, PUT, DELETE" });
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port;
const call = async (method, path, body, headers = {}) => { const r = await fetch(base + path, { method, body: body && JSON.stringify(body), headers: { "Content-Type": "application/json", ...headers } }); const text = await r.text(); return { status: r.status, body: text ? JSON.parse(text) : null, headers: r.headers }; };

console.log("--- POST не идемпотентен: повтор после «потерянного ответа» создаёт дубликат ---");
let r = await call("POST", "/items", { name: "книга" }); console.log("POST →", r.status, JSON.stringify(r.body));
r = await call("POST", "/items", { name: "книга" });     console.log("POST (повтор) →", r.status, JSON.stringify(r.body));
console.log("в хранилище записей:", (await call("GET", "/items")).body.length, "(создано две одинаковых)");

console.log("\\n--- POST с ключом идемпотентности ---");
items.clear(); nextId = 1;
const k = { "Idempotency-Key": "order-42" };
r = await call("POST", "/items", { name: "заказ" }, k); console.log("POST →", r.status, JSON.stringify(r.body));
r = await call("POST", "/items", { name: "заказ" }, k); console.log("POST (повтор) →", r.status, JSON.stringify(r.body), "; Idempotent-Replay:", r.headers.get("idempotent-replay"));
console.log("в хранилище записей:", (await call("GET", "/items")).body.length);

console.log("\\n--- PUT идемпотентен по результату ---");
items.clear();
r = await call("PUT", "/items/7", { name: "лампа" }); console.log("PUT /items/7 →", r.status, JSON.stringify(r.body));
r = await call("PUT", "/items/7", { name: "лампа" }); console.log("PUT (повтор) →", r.status, JSON.stringify(r.body), "(версия выросла, но содержимое то же; записей всё ещё 1:", items.size === 1, ")");

console.log("\\n--- DELETE: повтор даёт 404, состояние то же ---");
r = await call("DELETE", "/items/7"); console.log("DELETE →", r.status);
r = await call("DELETE", "/items/7"); console.log("DELETE (повтор) →", r.status, JSON.stringify(r.body), "; записей:", items.size);

console.log("\\n--- условный запрос If-Match: защита от потерянного обновления ---");
items.clear();
await call("PUT", "/items/1", { name: "v1" });
const a = await call("GET", "/items/1"); const etag = a.headers.get("etag");
r = await call("PUT", "/items/1", { name: "правка А" }, { "If-Match": etag }); console.log("клиент А с ETag", etag, "→", r.status, JSON.stringify(r.body));
r = await call("PUT", "/items/1", { name: "правка Б" }, { "If-Match": etag }); console.log("клиент Б с тем же устаревшим ETag →", r.status, JSON.stringify(r.body));
console.log("\\n--- прочее ---");
r = await call("PATCH", "/items/1", { name: "x" }); console.log("PATCH →", r.status, "; Allow:", r.headers.get("allow"));
r = await call("GET", "/unknown"); console.log("GET /unknown →", r.status);
server.close(); server.closeAllConnections();`, { filename: "06-http-semantics.mjs", collapsed: true }),
      code("text", `--- POST не идемпотентен: повтор после «потерянного ответа» создаёт дубликат ---
POST → 201 {"id":1,"name":"книга","version":1}
POST (повтор) → 201 {"id":2,"name":"книга","version":1}
в хранилище записей: 2 (создано две одинаковых)

--- POST с ключом идемпотентности ---
POST → 201 {"id":1,"name":"заказ","version":1}
POST (повтор) → 200 {"id":1,"name":"заказ","version":1} ; Idempotent-Replay: true
в хранилище записей: 1

--- PUT идемпотентен по результату ---
PUT /items/7 → 201 {"id":7,"name":"лампа","version":1}
PUT (повтор) → 200 {"id":7,"name":"лампа","version":2} (версия выросла, но содержимое то же; записей всё ещё 1: true )

--- DELETE: повтор даёт 404, состояние то же ---
DELETE → 204
DELETE (повтор) → 404 {"ошибка":"уже удалён"} ; записей: 0

--- условный запрос If-Match: защита от потерянного обновления ---
клиент А с ETag "1" → 200 {"id":1,"name":"правка А","version":2}
клиент Б с тем же устаревшим ETag → 412 {"ошибка":"версия устарела"}

--- прочее ---
PATCH → 405 ; Allow: GET, POST, PUT, DELETE
GET /unknown → 404`, { filename: "POST, PUT, DELETE, Idempotency-Key, If-Match" }),
      ul(
        "**`POST` не идемпотентен:** клиент не получил ответ, повторил запрос — создались два ресурса (`id` 1 и 2).",
        "**С ключом идемпотентности** повтор вернул `200` и тот же ресурс (`Idempotent-Replay: true`); в хранилище одна запись.",
        "**`PUT`** при повторе оставил одну запись (версия выросла, содержимое то же). **`DELETE`** при повторе вернул `404`, но состояние сервера то же — идемпотентность относится к состоянию, а не к коду ответа.",
        "**`If-Match`** защитил от потерянного обновления: первый клиент с `ETag \"1\"` получил `200`, второй с тем же устаревшим `ETag` — `412 Precondition Failed`.",
        "`PATCH` на сервер без поддержки — `405` с заголовком `Allow`.",
      ),
    ]),

    section("analysis", [
      h("URL: разбор, кодирование, источник"),
      code("js", `// URL: компоненты, процентное кодирование, разрешение относительных ссылок, международные имена, источник (origin)
const u = new URL("https://user:pa%20ss@Example.COM:8443/a/b/../c%20d/файл.html?q=привет&x=1&x=2#раздел");
console.log("href:     ", u.href);
for (const k of ["protocol", "username", "password", "host", "hostname", "port", "pathname", "search", "hash", "origin"]) console.log(k.padEnd(10), JSON.stringify(u[k]));
console.log("параметры:", JSON.stringify([...u.searchParams]), "; getAll('x') =", JSON.stringify(u.searchParams.getAll("x")));

console.log("\\nпорт по умолчанию отбрасывается: new URL('https://a.test:443/').port =", JSON.stringify(new URL("https://a.test:443/").port), "; http://a.test:80 →", JSON.stringify(new URL("http://a.test:80/").port));
console.log("регистр хоста нормализуется:", new URL("HTTP://ExAmPlE.com/Path").href, "(путь регистр сохраняет)");
console.log("точки в пути вычисляются:", new URL("http://a.test/x/./y/../z").pathname);

console.log("\\nразрешение относительных ссылок от базы https://a.test/dir/page.html?z=1#h:");
for (const rel of ["other.html", "./other.html", "../up.html", "/root.html", "?only=query", "#frag", "//cdn.test/lib.js", "https://b.test/abs", "sub/", "..//double"]) console.log("  " + rel.padEnd(20), "→", new URL(rel, "https://a.test/dir/page.html?z=1#h").href);

console.log("\\nпроцентное кодирование (UTF-8 → %XX):");
for (const s of ["a b", "привет", "😀", "a&b=c", "100%", "a/b?c#d"]) console.log("  " + JSON.stringify(s).padEnd(12), "encodeURIComponent →", encodeURIComponent(s).padEnd(40), " encodeURI →", encodeURI(s));
console.log("«привет» в UTF-8 — 12 байт → 12 · 3 =", "привет".length * 2 * 3, "символов %XX:", encodeURIComponent("привет").length === 36 ? "да" : "нет");
const sp = new URLSearchParams({ q: "a b&c", empty: "" }); sp.append("tag", "x+y");
console.log("URLSearchParams:", sp.toString(), "(пробел → «+» в строке запроса; «+» → %2B)");
console.log("decodeURIComponent('%E0%A4%A') выбрасывает исключение:", (() => { try { decodeURIComponent("%E0%A4%A"); return "нет"; } catch (e) { return e.name; } })());

console.log("\\nмеждународные доменные имена (punycode):", new URL("https://пример.рф/").hostname, "|", new URL("https://münchen.example/").hostname);
console.log("недопустимый URL:", (() => { try { new URL("not a url"); } catch (e) { return e.name + " (" + e.code + ")"; } })(), "; URL.canParse('a:b') =", URL.canParse("a:b"), "; URL.canParse('/rel') =", URL.canParse("/rel"));

console.log("\\nисточник (origin) = схема + хост + порт:");
const same = (a, b) => new URL(a).origin === new URL(b).origin;
for (const [a, b] of [["https://a.test/x", "https://a.test/y"], ["https://a.test", "http://a.test"], ["https://a.test", "https://a.test:8443"], ["https://a.test", "https://sub.a.test"], ["https://a.test:443", "https://a.test"]]) console.log("  " + a.padEnd(20), "и", b.padEnd(22), "один источник:", same(a, b) ? "да" : "нет");
console.log("\\nловушка проверки редиректа: startsWith('https://a.test') принимает https://a.test.evil.test:", "https://a.test.evil.test/".startsWith("https://a.test"), "; сравнение origin:", new URL("https://a.test.evil.test/").origin === "https://a.test");
console.log("и userinfo-обман: new URL('https://a.test@evil.test/').hostname =", new URL("https://a.test@evil.test/").hostname);`, { filename: "07-url.mjs", collapsed: true }),
      code("text", `href:      https://user:pa%20ss@example.com:8443/a/c%20d/%D1%84%D0%B0%D0%B9%D0%BB.html?q=%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82&x=1&x=2#%D1%80%D0%B0%D0%B7%D0%B4%D0%B5%D0%BB
protocol   "https:"
username   "user"
password   "pa%20ss"
host       "example.com:8443"
hostname   "example.com"
port       "8443"
pathname   "/a/c%20d/%D1%84%D0%B0%D0%B9%D0%BB.html"
search     "?q=%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82&x=1&x=2"
hash       "#%D1%80%D0%B0%D0%B7%D0%B4%D0%B5%D0%BB"
origin     "https://example.com:8443"
параметры: [["q","привет"],["x","1"],["x","2"]] ; getAll('x') = ["1","2"]

порт по умолчанию отбрасывается: new URL('https://a.test:443/').port = "" ; http://a.test:80 → ""
регистр хоста нормализуется: http://example.com/Path (путь регистр сохраняет)
точки в пути вычисляются: /x/z

разрешение относительных ссылок от базы https://a.test/dir/page.html?z=1#h:
  other.html           → https://a.test/dir/other.html
  ./other.html         → https://a.test/dir/other.html
  ../up.html           → https://a.test/up.html
  /root.html           → https://a.test/root.html
  ?only=query          → https://a.test/dir/page.html?only=query
  #frag                → https://a.test/dir/page.html?z=1#frag
  //cdn.test/lib.js    → https://cdn.test/lib.js
  https://b.test/abs   → https://b.test/abs
  sub/                 → https://a.test/dir/sub/
  ..//double           → https://a.test//double

процентное кодирование (UTF-8 → %XX):
  "a b"        encodeURIComponent → a%20b                                     encodeURI → a%20b
  "привет"     encodeURIComponent → %D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82      encodeURI → %D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82
  "😀"         encodeURIComponent → %F0%9F%98%80                              encodeURI → %F0%9F%98%80
  "a&b=c"      encodeURIComponent → a%26b%3Dc                                 encodeURI → a&b=c
  "100%"       encodeURIComponent → 100%25                                    encodeURI → 100%25
  "a/b?c#d"    encodeURIComponent → a%2Fb%3Fc%23d                             encodeURI → a/b?c#d
«привет» в UTF-8 — 12 байт → 12 · 3 = 36 символов %XX: да
URLSearchParams: q=a+b%26c&empty=&tag=x%2By (пробел → «+» в строке запроса; «+» → %2B)
decodeURIComponent('%E0%A4%A') выбрасывает исключение: URIError

международные доменные имена (punycode): xn--e1afmkfd.xn--p1ai | xn--mnchen-3ya.example
недопустимый URL: TypeError (ERR_INVALID_URL) ; URL.canParse('a:b') = true ; URL.canParse('/rel') = false

источник (origin) = схема + хост + порт:
  https://a.test/x     и https://a.test/y       один источник: да
  https://a.test       и http://a.test          один источник: нет
  https://a.test       и https://a.test:8443    один источник: нет
  https://a.test       и https://sub.a.test     один источник: нет
  https://a.test:443   и https://a.test         один источник: да

ловушка проверки редиректа: startsWith('https://a.test') принимает https://a.test.evil.test: true ; сравнение origin: false
и userinfo-обман: new URL('https://a.test@evil.test/').hostname = evil.test`, { filename: "Node.js 22: класс URL" }),
      ul(
        "`new URL(...)` нормализует регистр хоста (`Example.COM → example.com`), вычисляет `.` и `..` (`/a/b/../c%20d` → `/a/c%20d`), кодирует не-ASCII символы пути, запроса и фрагмента (`файл.html → %D1%84…`) и отбрасывает порт по умолчанию.",
        "Относительные ссылки разрешаются по базе: `../up.html` → `/up.html`, `?only=query` сохраняет путь и заменяет запрос, `#frag` сохраняет и путь, и запрос, `//cdn.test/lib.js` наследует только схему.",
        "Кодирование: `encodeURIComponent` экранирует разделители (`&`, `=`, `/`, `?`, `#`), `encodeURI` — нет; «привет» — 12 байт UTF-8 и 36 символов `%XX`. `URLSearchParams` кодирует пробел как `+`; `decodeURIComponent` на некорректной последовательности выбрасывает `URIError`.",
        "Международные имена приводятся к punycode: `пример.рф → xn--e1afmkfd.xn--p1ai`.",
        "**Источник** = схема + хост + порт: `https://a.test` и `http://a.test`, `…:8443`, `sub.a.test` — разные источники. Сравнивайте `origin`, а не префикс: `startsWith('https://a.test')` принимает `https://a.test.evil.test`, а `https://a.test@evil.test/` указывает на хост `evil.test`.",
      ),
    ]),

    section("internals", [
      h("Как браузер и ОС разрешают имя"),
      ul(
        "Порядок поиска: кеш браузера → кеш ОС → файл `hosts` → настроенный резолвер (провайдера или публичный) → иерархия серверов; каждый уровень имеет свой кеш и свою глубину.",
        "**Рекурсивный резолвер** хранит ответы до истечения TTL: поэтому смена адреса «расходится» не мгновенно. При миграции TTL заранее уменьшают.",
        "**Round-robin DNS** и **геораспределение** возвращают разные адреса разным клиентам; клиенты пробуют адреса по порядку (и по алгоритму «счастливых глаз» между IPv4 и IPv6).",
        "**Уязвимости:** подмена ответов (кеш-отравление), амплификация (маленький запрос — большой ответ), перехват запросов; меры — DNSSEC, DoH/DoT, случайные порты и идентификаторы запросов.",
      ),
      h("Как устроен HTTP-сервер и клиент"),
      ul(
        "**Разбор запроса:** сервер читает строку запроса и заголовки до пустой строки, затем тело по `Content-Length` или `chunked`. Ошибки в границах тела — основа атак «контрабанды запросов» (request smuggling) при расхождении прокси и сервера.",
        "**Обратный прокси и балансировщик** принимают соединения клиентов, держат собственные соединения с серверами и добавляют заголовки (`X-Forwarded-For`, `Via`).",
        "**Тайм-ауты и повторы:** клиент может безопасно повторять только идемпотентные запросы; для остальных нужен ключ идемпотентности.",
        "**Сжатие и кодирование:** `Content-Encoding: gzip/br` сокращает тело; заголовок `Vary` сообщает кешам, от каких заголовков запроса зависит ответ.",
        "**Версии:** HTTP/1.1 — текст, одна очередь на соединение; HTTP/2 — бинарные кадры и мультиплексирование; HTTP/3 — QUIC. Выбор версии согласуется при установке соединения (ALPN в TLS).",
      ),
    ]),

    section("mistakes", [
      wrongRight(
        "js",
        {
          title: "Неверно",
          code: `
            // отправка JSON: длина через .length, перенаправление по префиксу
            const body = JSON.stringify({ имя: "Анна" });
            req.setHeader("Content-Length", body.length);          // 14, а в проводе 21 байт
            if (target.startsWith("https://a.test")) redirect(target);   // пропустит https://a.test.evil.test
          `,
          note: "`Content-Length` измеряется в байтах UTF-8, а доверять префиксу строки нельзя: адрес надо разобрать и сравнить `origin`.",
        },
        {
          title: "Верно",
          code: `
            const body = JSON.stringify({ имя: "Анна" });
            req.setHeader("Content-Length", Buffer.byteLength(body));    // 21
            const t = new URL(target, base);
            if (t.origin === "https://a.test") redirect(t.href);
          `,
          note: "Байты считаются по кодировке, адрес сравнивается по источнику после разбора.",
        },
      ),
      ul(
        "**Повторять `POST` при обрыве без ключа идемпотентности:** дубликаты платежей и заказов (в замере создались два ресурса).",
        "**Считать код ответа единственным признаком состояния:** `DELETE` при повторе вернул `404`, хотя состояние нужное.",
        "**Новое соединение на каждый запрос:** 854 мс против 470 мс при постоянном соединении (RTT 40 мс).",
        "**Забыть про TTL при миграции:** адрес изменили, а клиенты ещё часы ходят на старый из кешей; заранее уменьшают TTL.",
        "**Сборка URL конкатенацией строк:** пробелы, `&`, `#` и не-ASCII ломают адрес; используйте `URL` и `URLSearchParams`.",
        "**Использовать `GET` для действий с побочными эффектами:** предзагрузка, кеши и роботы вызовут их без ведома пользователя.",
        "**Бесконечные редиректы и неограниченные повторы:** ограничивайте число переходов и применяйте экспоненциальную задержку.",
        "**Опираться на `X-Forwarded-For` без доверенного прокси:** заголовок подделывается клиентом.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Хранить в коде IP-адреса сервисов** вместо имён: теряется гибкость миграции и балансировки.",
        "**Слишком большой TTL** на записях, которые планируется менять; **слишком малый** — рост нагрузки на DNS и задержки.",
        "**Отключать проверку редиректов и использовать «белые списки» по подстроке** — открытое перенаправление и SSRF.",
        "**«Универсальный» POST для всего** (RPC через один адрес): теряется кеширование, идемпотентность и читаемость логов; выбирайте методы по семантике.",
        "**Ответ `200` с описанием ошибки в теле:** клиенты, кеши и мониторинг не узнают о сбое; используйте коды состояния.",
        "**Огромные заголовки и cookie** на каждый запрос (в HTTP/1.1 4820 байт на 10 запросов): раздувают трафик; в HTTP/2 помогает HPACK, но лучше не пересылать лишнее.",
        "**Опрос по таймеру вместо долгоживущих соединений или событий** при нужде в обновлениях в реальном времени (см. WebSocket, Server-Sent Events).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Используйте постоянные соединения и HTTP/2 (или HTTP/3)** между клиентом и сервером; ограничивайте число отдельных запросов.",
        "**Выбирайте методы и коды по семантике:** `GET` без побочных эффектов, `PUT` для замены, `POST` для создания, `201` + `Location`, `204`, `409`, `412`, `429` + `Retry-After`.",
        "**Делайте неидемпотентные операции повторяемыми:** `Idempotency-Key`, условные запросы `If-Match` и `ETag`.",
        "**Всегда задавайте тайм-ауты** (соединения, ответа, общий дедлайн) и повторяйте только идемпотентные запросы с экспоненциальной задержкой и джиттером.",
        "**Разбирайте URL библиотекой** (`URL`, `URLSearchParams`), сравнивайте источники по `origin`, кодируйте значения `encodeURIComponent`.",
        "**Считайте длину в байтах;** для потоковых ответов используйте `chunked` или `Content-Length` обдуманно.",
        "**Планируйте TTL:** перед миграцией снижайте, после стабилизации повышайте; держите резервные записи.",
        "**Диагностируйте по слоям:** DNS → соединение → TLS → HTTP; сверяйте коды и заголовки (`Location`, `Retry-After`, `Allow`, `Content-Type`).",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Усечение DNS-ответа по UDP:** большие ответы приходят с флагом усечения, и резолвер повторяет запрос по TCP.",
        "**CNAME в корне зоны** недопустим (мешает другим записям), поэтому для «голого» домена используют `A`/`AAAA` или специальные псевдонимы провайдера.",
        "**Несколько `Content-Length` или смесь `Content-Length` с `chunked`** — источник уязвимостей; серверы и прокси отвергают такие запросы.",
        "**Частичные ответы и `Range`:** сервер может проигнорировать диапазон и вернуть `200` целиком; клиент обязан проверять код.",
        "**Редиректы:** `301/302` могут менять метод `POST` на `GET`, а `307/308` сохраняют метод и тело — выбирайте код сознательно.",
        "**`HEAD` и `GET`** должны возвращать одинаковые заголовки (в замере — 127 байт заголовков и 21 байт тела отдельно).",
        "**Имена с не-ASCII символами** хранятся в DNS как punycode; отображение и сравнение требуют нормализации (омографические атаки).",
        "**Cookie и источники:** понятия «сайт» и «источник» различаются; подробнее — в теме «TLS, кеширование и cookie» (ссылка в разделе «Связанные темы»).",
      ),
    ]),

    section("related", [
      ul(
        "[Сетевая модель, IP и TCP](/learn/cs/network-model-ip-tcp) — соединения, окно и задержки, на которых стоит HTTP.",
        "[TLS, кеширование и cookie](/learn/cs/tls-caching-cookies) — шифрование, кеширование ответов и состояние клиента.",
        "[Биты и байты](/learn/cs/number-systems-encoding) — UTF-8, процентное кодирование и подсчёт длины в байтах.",
        "[Конкурентность и планирование](/learn/cs/concurrency-scheduling) — очереди, повторы и задержки.",
        "[Хеш-таблицы](/learn/cs/hash-tables) — кеши и ключи.",
        "[JavaScript: формы и fetch](/learn/js/forms-fetch) — HTTP-запросы из браузера.",
        "[JavaScript: хранилища, URL и таймеры](/learn/js/storage-url-timers) — `URL`, `URLSearchParams`, таймеры.",
        "[HTML: ссылки](/learn/html/links) — URL в разметке.",
        "[HTML: загрузка ресурсов](/learn/html/resource-loading) — предзагрузка, соединения и приоритеты.",
        "[HTML: безопасность](/learn/html/html-security) — источники, перенаправления и политика безопасности.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Повтор POST без защиты",
          code: `
            async function pay(order) {
              for (let i = 0; i < 3; i++) {
                try { return await fetch("/payments", { method: "POST", body: JSON.stringify(order) }); }
                catch { /* обрыв: попробуем ещё раз */ }
              }
            }
          `,
          note: "Если сервер обработал первый запрос, а ответ потерялся, повтор спишет деньги дважды (в замере — два ресурса).",
        },
        {
          title: "Повтор с ключом идемпотентности",
          code: `
            async function pay(order) {
              const key = crypto.randomUUID();                       // один ключ на логическую операцию
              for (let i = 0; i < 3; i++) {
                try { return await fetch("/payments", { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(order) }); }
                catch { await new Promise((r) => setTimeout(r, 2 ** i * 200 + Math.random() * 100)); }
              }
            }
          `,
          note: "Сервер по ключу возвращает прежний результат (в замере: `200` и `Idempotent-Replay: true`, одна запись); повторы идут с экспоненциальной задержкой и джиттером.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "cs.dns-http.ex1",
      title: "Разберите DNS-запрос по байтам",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Запрос `A www.example.com` выглядит как `12 34 01 00 00 01 00 00 00 00 00 00 03 77 77 77 07 65 78 61 6d 70 6c 65 03 63 6f 6d 00 00 01 00 01`. Какова длина? Что означают первые 12 байт? Как закодировано имя? Что значат последние 4 байта? Почему в ответе имя можно записать двумя байтами?"),
      ],
      hints: [
        "Заголовок DNS всегда 12 байт: идентификатор, флаги, четыре счётчика.",
        "Имя — последовательность «длина + метка», заканчивается нулём.",
        "Указатель сжатия начинается с битов `11` (`0xC0`).",
      ],
      checks: ["Длина 33 байта (12 + 17 + 4)", "id `0x1234`, флаги `0x0100` (рекурсия), один вопрос", "Имя: 3 «www» 7 «example» 3 «com» 0 (17 байт)", "Тип A (1), класс IN (1)", "Указатель `0xC00C` ссылается на смещение 12"],
      solution: [
        code("text", `запрос A www.example.com ( 33 байт ):
12 34 01 00 00 01 00 00 00 00 00 00 03 77 77 77 07 65 78 61 6d 70 6c 65 03 63 6f 6d 00 00 01 00 01
  заголовок (12 Б): 12 34 01 00 00 01 00 00 00 00 00 00 → id 0x1234, флаги 0x0100 (RD), вопросов 1
  имя (17 Б): 03 77 77 77 07 65 78 61 6d 70 6c 65 03 63 6f 6d 00 → 3 «www» 7 «example» 3 «com» 0
  тип и класс: 00 01 00 01 → A (1), IN (1)
итого: 33 байт — запрос умещается в одну UDP-датаграмму

разбор ответа ( 67 байт ): {"id":4660,"qr":1,"rcode":"NOERROR","ra":1}
   www.example.com    CNAME  TTL  300 web.example.com
   web.example.com    A      TTL   60 93.184.216.34
имя в ответе записано указателем 0xC00C (2 байта) вместо 17 байт полного имени: экономия 15 байт на запись
TTL: CNAME 300 с, A 60 с — кеш хранит каждую запись, пока не истечёт её срок

ответ с флагами 0x8183: rcode = NXDOMAIN , записей: 0 (имя не существует; такой ответ тоже кешируется — «отрицательное кеширование»)
типы записей: A=1, NS=2, CNAME=5, SOA=6, MX=15, TXT=16, AAAA=28
указатель, ссылающийся сам на себя (0xC00C по смещению 12), отвергнут: цикл в указателях сжатия`, { filename: "разбор запроса и ответа" }),
        ul(
          "Заголовок: `12 34` — идентификатор, `01 00` — флаги (бит RD: рекурсия желательна), `00 01` — один вопрос, остальные счётчики нулевые.",
          "Имя состоит из меток: `03 w w w`, `07 e x a m p l e`, `03 c o m`, `00` — всего 1 + 3 + 1 + 7 + 1 + 3 + 1 = 17 байт.",
          "`00 01` — тип A, `00 01` — класс IN (Интернет). Итого `12 + 17 + 4 = 33`.",
          "В ответе имя начинается с байтов `C0 0C`: старшие два бита `11` означают указатель, остальные 14 бит (`0x00C = 12`) — смещение, где уже записано то же имя; экономия 15 байт на запись.",
        ),
      ],
    }),
    exercise({
      id: "cs.dns-http.ex2",
      title: "Напишите кеш DNS с TTL и отрицательным кешем",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Реализуйте функцию `makeCachedResolver(lookup, now)`, где `lookup(name)` — медленный запрос к серверу (возвращает `{ rcode, ttl, address }`), а `now()` — часы. Результат кешируется на `ttl` секунд; ответ `NXDOMAIN` кешируется на 30 секунд. Покажите на условных часах: повторный вызов даёт 0 обращений к серверу, через `ttl + 1` секунд — снова 1, а для несуществующего имени повтор в пределах 30 секунд тоже не обращается к серверу."),
      ],
      starter: {
        lang: "js",
        code: `
          function makeCachedResolver(lookup, now) {
            const cache = new Map();
            return async function resolve(name) {
              // вернуть из кеша, если не истёк срок; иначе спросить lookup(name) и сохранить
            };
          }
        `,
      },
      hints: [
        "Храните вместе с результатом момент истечения: `expires = now() + ttl * 1000`.",
        "Для `NXDOMAIN` используйте фиксированное время хранения.",
        "Следите, чтобы одновременные запросы одного имени не плодили лишние обращения (кешируйте и промис).",
      ],
      checks: ["Повторный вызов в пределах TTL не обращается к `lookup`", "После истечения TTL — ровно одно обращение", "`NXDOMAIN` кешируется отдельно (30 с)", "Одновременные вызовы одного имени делят один запрос"],
      solution: [
        code("js", `
          function makeCachedResolver(lookup, now) {
            const cache = new Map();                                   // имя → { expires, promise }
            return function resolve(name) {
              const hit = cache.get(name);
              if (hit && hit.expires > now()) return hit.promise;      // свежая запись или запрос «в полёте»
              const entry = { expires: Infinity, promise: null };
              entry.promise = lookup(name).then((r) => {
                entry.expires = now() + (r.rcode === 3 ? 30 : r.ttl) * 1000;   // отрицательный ответ — 30 с
                return r;
              }, (e) => { cache.delete(name); throw e; });             // ошибки не кешируем
              cache.set(name, entry);
              return entry.promise;
            };
          }
        `, { filename: "решение" }),
        code("text", `1. www.example.test A (холодный кеш)         3 запрос(а/ов) CNAME→web.example.test, 192.0.2.10    [root: A www.example.test; tld: A www.example.test; auth: A www.example.test]
2. то же сразу повторно                      из кеша        CNAME→web.example.test, 192.0.2.10 
3. mail.example.test A (другое имя в той же зоне) 1 запрос(а/ов) 192.0.2.25    [auth: A mail.example.test]
4. mail.example.test через 61 с (TTL записи 60 с) 1 запрос(а/ов) 192.0.2.25    [auth: A mail.example.test]
5. www.example.test через 61 с (мин. TTL ответа 60 с) 1 запрос(а/ов) CNAME→web.example.test, 192.0.2.10    [auth: A www.example.test]
6. missing.example.test (несуществующее имя) 1 запрос(а/ов) NXDOMAIN    [auth: A missing.example.test]
7. то же повторно (отрицательное кеширование) из кеша        NXDOMAIN 
8. TXT example.test                          1 запрос(а/ов) v=spf1 -all    [auth: TXT example.test]

круговой перебор: три адреса для multi.example.test, кеш отключён (порядок первого адреса меняется между ответами)
первые адреса в четырёх ответах: 192.0.2.1 → 192.0.2.2 → 192.0.2.3 → 192.0.2.1

всего обращений к серверам: 12 = корень: 1 , .test: 1 , example.test: 10
холодный запрос потребовал 3 обращения (корень → .test → example.test), тёплый — 0, новое имя в известной зоне — 1: да`, { filename: "эталон: поведение настоящего резолвера в модели" }),
        p("Запись хранит и результат, и срок. Пока запрос не завершился, срок бесконечен: параллельные вызовы получают тот же промис. Отрицательный ответ хранится 30 секунд, ошибки (таймаут, `SERVFAIL`) не кешируются — иначе временный сбой станет постоянным. В эталоне видно то же: 0 обращений при повторе, 1 после TTL и 1 + 0 для `NXDOMAIN`."),
      ],
    }),
    exercise({
      id: "cs.dns-http.ex3",
      title: "100 мелких запросов — 8 секунд",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Клиент загружает по HTTPS набор из 100 небольших ресурсов с сервера, находящегося на расстоянии RTT 40 мс. Загрузка занимает около 8 секунд, хотя ответы маленькие, канал быстрый, а сервер отвечает мгновенно. Найдите причины (по числу кругов RTT), посчитайте ожидаемое время для каждого варианта и предложите последовательные улучшения."),
      ],
      hints: [
        "Сколько RTT тратится на запрос с новым соединением, если TLS 1.3 добавляет ещё круг?",
        "Что меняет постоянное соединение? Что меняют параллельные соединения?",
        "Как HTTP/2 справляется с сотней запросов?",
      ],
      checks: ["Причина: новое соединение на каждый запрос и последовательные запросы", "Оценка: ≈ 2–3 RTT на запрос → 100 × (80…120) мс = 8–12 с", "Постоянное соединение: ≈ 1 RTT на запрос → ≈ 4 с", "Шесть соединений: ≈ 0,7 с", "HTTP/2: десятки миллисекунд после установки соединения плюс время передачи"],
      solution: [
        code("text", `10 запросов через канал с RTT 40 мс (модель)
  новое соединение на каждый запрос, последовательно   соединений: 10
  одно соединение (keep-alive), последовательно        соединений:  1
  до 6 соединений (keep-alive), параллельно            соединений:  6
без повторного использования открыто 10 соединений, с keep-alive — 1, при параллельности — 6: да
keep-alive быстрее соединения на каждый запрос более чем в 1,5 раза: да
параллельные запросы по 6 соединениям быстрее последовательных по одному соединению более чем в 2 раза: да`, { filename: "модель: 10 запросов при RTT 40 мс" }),
        code("text", `10 запросов по 50 мс обработки на сервере:
  HTTP/1.1, одно соединение, по очереди: не меньше 500 мс: да
  HTTP/1.1, 6 соединений: около двух «волн» (меньше 250 мс и больше 100 мс): да
  HTTP/2, одно соединение, все запросы одновременно: меньше 150 мс: да
  HTTP/2 быстрее одного HTTP/1.1-соединения более чем в 3 раза: да

начало потока клиента HTTP/2: "PRI * HTTP/2.0\\r\\n\\r\\nSM\\r\\n\\r\\n" (24 байта «преамбулы»)
первые кадры за преамбулой: SETTINGS(поток 0, 0 Б), HEADERS(поток 1, 277 Б), SETTINGS(поток 0, 0 Б), HEADERS(поток 3, 15 Б), HEADERS(поток 5, 15 Б), HEADERS(поток 7, 15 Б)

10 одинаковых по составу запросов с типичными заголовками браузера и cookie:
  HTTP/1.1: отправлено клиентом 4820 байт ( 482 в среднем на запрос )
  HTTP/2:   отправлено клиентом 578 байт ( 58 в среднем на запрос, включая служебные кадры )
HTTP/2 передал не больше четверти байт HTTP/1.1 благодаря сжатию заголовков (HPACK): да`, { filename: "HTTP/2 против HTTP/1.1" }),
        ul(
          "**Причина.** Каждый запрос на новом соединении платит рукопожатием TCP (1 RTT), шифрованием (ещё 1 RTT) и самим запросом (1 RTT); запросы идут по очереди. В модели 10 запросов при RTT 40 мс — 854 мс (≈ 85 мс на запрос); 100 запросов — около 8,5 с.",
          "**Улучшение 1.** Постоянное соединение: убирает рукопожатия, остаётся 1 RTT на запрос — в модели 470 мс на 10 запросов; на 100 запросов около 4 с.",
          "**Улучшение 2.** Параллельные соединения (до 6): в модели 129 мс на 10 запросов; на 100 запросов ≈ 17 «волн» по 1 RTT ≈ 0,7 с плюс рукопожатия.",
          "**Улучшение 3.** HTTP/2 или HTTP/3: все 100 запросов идут по одному соединению одновременно (в замере 10 запросов по 50 мс — 66 мс против 537 мс), заголовки сжимаются (4820 → 578 байт на 10 запросов).",
          "**Улучшение 4.** Сократить число запросов: объединение ресурсов, кеширование, предзагрузка и `preconnect`.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "cs.dns-http.challenge",
    title: "Идемпотентный API платежей",
    scenario: [
      p("Мобильное приложение отправляет платёж методом `POST /payments`. Сеть нестабильна: ответ часто теряется, и клиент повторяет запрос. Требуется, чтобы платёж создавался ровно один раз при любом числе повторов, одновременные правки счёта не терялись, а ошибки были понятны клиенту. Спроектируйте протокол и реализуйте демонстрационный сервер."),
    ],
    requirements: [
      "`POST /payments` с заголовком `Idempotency-Key`: повтор с тем же ключом возвращает прежний результат (`200`, `Idempotent-Replay: true`), первый — `201` и `Location`",
      "`PUT` для замены ресурса и `If-Match`/`ETag` для защиты от потерянного обновления (`412` при устаревшей версии)",
      "Корректные коды: `201`, `200`, `204`, `404`, `405` с `Allow`, `409` при конфликте ключа с другим телом, `412`",
      "Описание поведения клиента: тайм-аут, повторы с экспоненциальной задержкой и джиттером, один ключ на логическую операцию",
    ],
    constraints: [
      "Повтор не должен создавать второй платёж даже при параллельных запросах с одним ключом (атомарная проверка ключа)",
      "Ключ хранится не меньше времени, в течение которого клиент может повторять запрос",
      "Не использовать `GET` для действий с побочными эффектами",
    ],
    acceptance: [
      "Два `POST` с одним ключом создают одну запись; без ключа — две",
      "Повтор `PUT` оставляет одну запись; повтор `DELETE` возвращает `404` без изменения состояния",
      "Клиент с устаревшим `ETag` получает `412`",
      "Объяснено, почему `409` нужен, если тот же ключ пришёл с другим телом",
    ],
    hints: [
      "Храните ответ по ключу и возвращайте его при повторе.",
      "Проверка и запись ключа должны быть атомарны (в базе — уникальный индекс).",
      "Для параллельных запросов с одним ключом второй должен дождаться первого или получить `409`/ответ по ключу.",
    ],
    solution: [
      code("text", `--- POST не идемпотентен: повтор после «потерянного ответа» создаёт дубликат ---
POST → 201 {"id":1,"name":"книга","version":1}
POST (повтор) → 201 {"id":2,"name":"книга","version":1}
в хранилище записей: 2 (создано две одинаковых)

--- POST с ключом идемпотентности ---
POST → 201 {"id":1,"name":"заказ","version":1}
POST (повтор) → 200 {"id":1,"name":"заказ","version":1} ; Idempotent-Replay: true
в хранилище записей: 1

--- PUT идемпотентен по результату ---
PUT /items/7 → 201 {"id":7,"name":"лампа","version":1}
PUT (повтор) → 200 {"id":7,"name":"лампа","version":2} (версия выросла, но содержимое то же; записей всё ещё 1: true )

--- DELETE: повтор даёт 404, состояние то же ---
DELETE → 204
DELETE (повтор) → 404 {"ошибка":"уже удалён"} ; записей: 0

--- условный запрос If-Match: защита от потерянного обновления ---
клиент А с ETag "1" → 200 {"id":1,"name":"правка А","version":2}
клиент Б с тем же устаревшим ETag → 412 {"ошибка":"версия устарела"}

--- прочее ---
PATCH → 405 ; Allow: GET, POST, PUT, DELETE
GET /unknown → 404`, { filename: "решение: поведение сервера и клиента" }),
      p("Сервер запоминает результат по `Idempotency-Key`: первый `POST` — `201` и `Location`, повтор — `200` с тем же ресурсом и пометкой `Idempotent-Replay: true`; без ключа повтор создаёт дубликат. Для замены ресурса — `PUT` (идемпотентен) и условные запросы `If-Match` с `ETag`: устаревшая версия получает `412`. В реальной системе ключ хранят вместе с хэшем тела, чтобы ответить `409` при том же ключе и другом теле, и записывают атомарно (уникальный индекс), чтобы параллельные повторы не создали два платежа. Клиент использует один ключ на логическую операцию, тайм-аут и повторы с экспоненциальной задержкой и джиттером."),
    ],
  },

  interview: [
    iq("cs.dns-http.i1", "basic", "Как работает DNS? Что происходит при разрешении имени?", [
      ul(
        "Резолвер обходит иерархию: корневые серверы → серверы зоны верхнего уровня → авторитетный сервер домена; каждый отвечает либо данными, либо ссылкой на следующий.",
        "Ответы кешируются на время TTL: в модели холодный запрос — 3 обращения, повтор — 0, другое имя в той же зоне — 1.",
        "Типы записей: `A`/`AAAA`, `CNAME`, `NS`, `MX`, `TXT`; несуществующее имя — `NXDOMAIN`.",
      ),
    ]),
    iq("cs.dns-http.i2", "basic", "Из чего состоит HTTP-запрос и ответ?", [
      ul(
        "Запрос: строка `МЕТОД цель HTTP/1.1`, заголовки (обязателен `Host`), пустая строка, необязательное тело; ответ: строка состояния с кодом, заголовки, пустая строка, тело.",
        "Границы тела задают `Content-Length` (в байтах!) или `Transfer-Encoding: chunked`.",
        "В замере `GET /hello` — 74 байта запроса и 148 байт ответа (127 заголовков + 21 тело).",
      ),
    ]),
    iq("cs.dns-http.i3", "intermediate", "Чем отличаются безопасные и идемпотентные методы? Приведите примеры.", [
      ul(
        "Безопасные (`GET`, `HEAD`) не меняют состояние; идемпотентные (`GET`, `PUT`, `DELETE`) при повторе дают то же состояние на сервере.",
        "`POST` не идемпотентен: повтор создал два ресурса; для повторяемости вводят `Idempotency-Key`.",
        "`DELETE` повторно вернул `404`, но состояние то же: идемпотентность относится к состоянию, не к коду ответа.",
      ),
    ]),
    iq("cs.dns-http.i4", "intermediate", "Что даёт keep-alive и HTTP/2?", [
      ul(
        "Keep-alive убирает повторные рукопожатия: 10 запросов при RTT 40 мс — 470 мс вместо 854 мс; параллельные соединения — 129 мс.",
        "HTTP/2 мультиплексирует потоки в одном соединении: 10 запросов по 50 мс — 66 мс против 537 мс по одному HTTP/1.1-соединению; HPACK сократил заголовки с 4820 до 578 байт.",
        "Ограничение: при потере пакета в TCP ждут все потоки — HTTP/3 на QUIC решает это.",
      ),
    ]),
    iq("cs.dns-http.i5", "intermediate", "Что такое TTL в DNS и как он влияет на миграцию сервиса?", [
      ul(
        "Время хранения записи в кешах: до истечения резолверы не спрашивают заново (в модели: через 61 с при TTL 60 — снова 1 обращение).",
        "Изменение адреса «расходится» постепенно; перед миграцией TTL снижают заранее, после — повышают.",
        "Отрицательные ответы (`NXDOMAIN`) тоже кешируются, поэтому «только что созданное» имя может быть недоступно некоторое время.",
      ),
    ]),
    iq("cs.dns-http.i6", "advanced", "Как реализовать безопасные повторы платёжного запроса?", [
      ul(
        "`POST` с заголовком `Idempotency-Key`: сервер атомарно сохраняет результат по ключу и при повторе возвращает его (`200`, `Idempotent-Replay`); ключ с другим телом — `409`.",
        "Клиент: один ключ на логическую операцию, тайм-аут, экспоненциальная задержка с джиттером, ограничение числа попыток.",
        "Дополнительно: `PUT` с `If-Match`/`ETag` для правок (`412`), журнал и сверка состояния.",
      ),
    ]),
    iq("cs.dns-http.i7", "engineering", "Страница из 100 мелких ресурсов грузится 8 секунд при RTT 40 мс. Что делать?", [
      ul(
        "Сначала число кругов RTT: новое соединение на каждый запрос стоит ≈ 2–3 RTT (в модели 854 мс на 10 запросов).",
        "Постоянные соединения, параллельные соединения (до 6), HTTP/2 или HTTP/3, предзагрузка и `preconnect`, кеширование, объединение критических ресурсов.",
        "Измерять по этапам (DNS, соединение, TLS, первый байт, передача) и проверять на реальных сетях.",
      ),
    ]),
    iq("cs.dns-http.i8", "debugging", "Редирект после входа ведёт на чужой сайт. Как это могло получиться и как исправить?", [
      ul(
        "Проверка `startsWith(\"https://a.test\")` принимает `https://a.test.evil.test`; адрес с `userinfo` (`https://a.test@evil.test`) указывает на другой хост.",
        "Исправление: разобрать адрес (`new URL(target, base)`), сравнить `origin` или использовать белый список путей; не принимать абсолютные адреса из параметров.",
        "Добавить тесты на такие адреса и логировать подозрительные перенаправления.",
      ),
    ]),
  ],

  exam: [
    mcq("cs.dns-http.e1", "foundation", "Какой код ответа DNS означает, что имя не существует?", ["NOERROR", "SERVFAIL", "NXDOMAIN", "REFUSED"], 2, "`NXDOMAIN` (код 3) сообщает, что такого имени нет; такой ответ тоже кешируется (отрицательный кеш), чтобы не спрашивать повторно."),
    mcq("cs.dns-http.e2", "foundation", "В каких единицах измеряется `Content-Length`?", ["В байтах", "В символах", "В килобайтах", "В кусках chunked"], 0, "`Content-Length` — число байтов тела: JSON `{\"имя\":\"Анна\"}` занимает 21 байт при 14 символах."),
    mcq("cs.dns-http.e3", "foundation", "Какой метод HTTP идемпотентен?", ["POST", "Только GET", "Ни один", "PUT"], 3, "`PUT` при повторе оставляет одну запись (замер); `GET`, `HEAD`, `DELETE` тоже идемпотентны, `POST` — нет."),
    mcq("cs.dns-http.e4", "intermediate", "Сколько обращений к серверам DNS потребовал холодный запрос в модели иерархии?", ["1", "3", "2", "5"], 1, "Корень (отсылка) → сервер `.test` (отсылка) → авторитетный сервер (ответ) = 3; повтор из кеша — 0, новое имя в той же зоне — 1."),
    mcq("cs.dns-http.e5", "intermediate", "Что показал замер 10 запросов через канал с RTT 40 мс?", ["Соединение на запрос быстрее keep-alive", "Параллельные соединения медленнее", "Все варианты одинаковы", "Новое соединение на запрос — 854 мс, keep-alive — 470 мс, до шести параллельных — 129 мс"], 3, "Каждое новое соединение платит рукопожатием и медленным стартом; постоянное соединение убирает их, параллельные — сокращают число «волн» ожидания."),
    mcq("cs.dns-http.e6", "intermediate", "Как называется механизм HTTP/2, позволяющий одновременно передавать много запросов по одному соединению?", ["Кеширование", "Redirect", "Мультиплексирование потоков", "Chunked-кодирование"], 2, "В HTTP/2 запросы и ответы разбиты на кадры с идентификаторами потоков: 10 запросов по 50 мс — 66 мс против 537 мс по одному HTTP/1.1-соединению."),
    mcq("cs.dns-http.e7", "advanced", "Какие утверждения верны? Выберите все.", ["`startsWith('https://a.test')` безопасно проверяет принадлежность адреса сайту", "`new URL('https://a.test@evil.test/').hostname` равен `evil.test`", "Источник (origin) включает схему, хост и порт", "Повтор `POST` без ключа идемпотентности может создать дубликат"], [1, 2, 3], "Проверка по префиксу пропускает `https://a.test.evil.test`; `userinfo` до `@` не является хостом; origin — схема, хост и порт; повтор `POST` создал два ресурса (замер)."),
    open("cs.dns-http.e8", "intermediate", "Объясните, почему повторять неидемпотентный запрос после тайм-аута опасно, и как это безопасно организовать.", [
      ul(
        "Тайм-аут не значит, что сервер не выполнил запрос: он мог обработать его, а ответ потерялся; повтор `POST` создаёт дубликат (в замере — два ресурса).",
        "Решение: `Idempotency-Key` на логическую операцию; сервер атомарно запоминает результат по ключу и при повторе возвращает прежний; ключ с другим телом — `409`.",
        "Клиент ограничивает число повторов, использует экспоненциальную задержку с джиттером; для правок — `If-Match`/`ETag` против потерянного обновления.",
      ),
    ], ["Объяснено, что тайм-аут не доказывает невыполнение", "Назван Idempotency-Key и его хранение на сервере", "Названы задержка и ограничение повторов", "Упомянуты условные запросы или конфликт ключа"]),
  ],

  mastery: [
    mcq("cs.dns-http.m1", "intermediate", "Почему в нашем замере HTTP/2 передал заголовки 10 запросов в 578 байт против 4820 в HTTP/1.1?", ["HTTP/2 отбрасывает cookie", "Сжатие заголовков HPACK: неизменившиеся заголовки берутся из таблицы, повторные запросы — по 15 байт", "HTTP/2 использует UDP", "Запросы были разными"], 1, "Первый `HEADERS` занял 277 байт, следующие — по 15 (меняется только `:path`): HPACK хранит таблицу ранее отправленных заголовков."),
    mcq("cs.dns-http.m2", "advanced", "Почему нельзя считать ответ `404` на повторный `DELETE` ошибкой идемпотентности?", ["Идемпотентность — свойство состояния сервера: после обоих вызовов ресурса нет, хотя коды ответа разные", "Потому что `DELETE` не идемпотентен", "Потому что 404 означает успех", "Потому что DELETE нельзя повторять"], 0, "В замере оба вызова оставили 0 записей; идемпотентность определяется итоговым состоянием, а не совпадением кодов."),
    mcq("cs.dns-http.m3", "advanced", "Что делает `If-Match` с `ETag` при параллельных правках?", ["Ускоряет загрузку", "Кеширует ответ", "Отвергает запись с устаревшей версией (`412`), защищая от потерянного обновления", "Шифрует тело"], 2, "Первый клиент с актуальным `ETag` получил `200`, второй с тем же устаревшим — `412 Precondition Failed`; так избегают затирания чужих изменений."),
    open("cs.dns-http.m4", "advanced", "Спроектируйте стратегию миграции веб-сервиса на новый IP-адрес без простоя: роль DNS и TTL, поведение клиентов и кешей, откат, проверка.", [
      ul(
        "Заранее (не менее чем за старый TTL) уменьшить TTL записей, затем поднять новый сервер и вести проверку по прямому адресу, не меняя DNS.",
        "Переключить запись `A`/`AAAA` на новый адрес; старый сервер оставить работающим до полного истечения прежнего TTL (учесть долгие кеши и клиентов, игнорирующих TTL), при желании проксировать на новый.",
        "Откат: вернуть прежнюю запись (TTL уже мал, откат быстрый); мониторить трафик по обоим адресам, коды ответов и задержки.",
        "После стабилизации повысить TTL; учесть отрицательные кеши, постоянные соединения клиентов (они держат старый адрес до разрыва) и IPv6.",
      ),
    ], ["Снижение TTL заранее", "Параллельная работа старого и нового адреса", "План отката и мониторинг", "Учёт долгих кешей и постоянных соединений"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "cs.dns-http.f1", front: "DNS-сообщение?", back: "Заголовок 12 Б + вопрос (имя метками, тип, класс). Запрос A www.example.com — 33 Б. Сжатие имён указателем 0xC0xx. NXDOMAIN = код 3." },
    { id: "cs.dns-http.f2", front: "Иерархия и кеш?", back: "Корень → .tld → авторитетный. Холодный 3 обращения, повтор 0, новое имя в зоне 1. Записи живут TTL; NXDOMAIN тоже кешируется." },
    { id: "cs.dns-http.f3", front: "HTTP/1.1 сообщение?", back: "Строка запроса/статуса, заголовки, пустая строка, тело. Границы: Content-Length (в байтах!) или chunked. Host обязателен." },
    { id: "cs.dns-http.f4", front: "Методы?", back: "Безопасные: GET, HEAD. Идемпотентные: GET, HEAD, PUT, DELETE. POST — нет → Idempotency-Key. If-Match + ETag → 412." },
    { id: "cs.dns-http.f5", front: "Цена соединения?", back: "RTT 40 мс, 10 запросов: новое соединение 854 мс, keep-alive 470 мс, 6 параллельных 129 мс." },
    { id: "cs.dns-http.f6", front: "HTTP/2?", back: "Мультиплексирование: 10×50 мс — 66 мс (HTTP/1.1: 537 мс). HPACK: 4820 → 578 Б. HTTP/3 — QUIC, без блокировки при потерях." },
    { id: "cs.dns-http.f7", front: "URL и origin?", back: "Origin = схема + хост + порт. Разбирать через URL, сравнивать origin, не startsWith. userinfo до @ — не хост." },
    { id: "cs.dns-http.f8", front: "Коды?", back: "2xx успех (201 + Location, 204, 206), 3xx (301/308 навсегда, 304), 4xx клиент (404, 405 + Allow, 409, 412, 429), 5xx сервер (503 + Retry-After)." },
  ],

  sources: [
    { title: "RFC 1034: Domain Names — Concepts and Facilities", url: "https://www.rfc-editor.org/rfc/rfc1034", publisher: "IETF" },
    { title: "RFC 1035: Domain Names — Implementation and Specification", url: "https://www.rfc-editor.org/rfc/rfc1035", publisher: "IETF" },
    { title: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110", publisher: "IETF" },
    { title: "RFC 9112: HTTP/1.1", url: "https://www.rfc-editor.org/rfc/rfc9112", publisher: "IETF" },
    { title: "RFC 9113: HTTP/2", url: "https://www.rfc-editor.org/rfc/rfc9113", publisher: "IETF" },
    { title: "RFC 7541: HPACK — Header Compression for HTTP/2", url: "https://www.rfc-editor.org/rfc/rfc7541", publisher: "IETF" },
    { title: "RFC 3986: Uniform Resource Identifier (URI): Generic Syntax", url: "https://www.rfc-editor.org/rfc/rfc3986", publisher: "IETF" },
    { title: "WHATWG URL Standard", url: "https://url.spec.whatwg.org/", publisher: "WHATWG" },
    { title: "MDN: HTTP", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP", publisher: "MDN" },
  ],
};
