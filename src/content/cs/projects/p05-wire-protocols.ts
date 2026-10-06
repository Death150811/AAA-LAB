import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p05WireProtocols: Project = {
  id: "cs.p05-wire-protocols",
  domain: "cs",
  order: 5,
  title: "Протоколы на проводе",
  subtitle: "Контрольная сумма Интернета, заголовок IPv4, UDP с псевдозаголовком, DNS со сжатием имён, строгий разбор HTTP/1.1 с блоками и решение кеша по RFC 9111 — 53 проверки на канонических байтах, 3000 испорченных сообщений и защите от подмены запросов",
  level: "intermediate",
  estimatedHours: 14,
  buildsOn: [],
  topics: ["cs.network-model-ip-tcp", "cs.dns-http", "cs.tls-caching-cookies"],
  objective:
    "Написать модуль `wire.mjs`, который собирает и разбирает **настоящие байты** сетевых протоколов: контрольную сумму RFC 1071 (в заголовке IPv4 из статьи — `0xb861`), заголовок IPv4 (флаги, фрагментация, параметры), UDP с контрольной суммой по псевдозаголовку, сообщения DNS со сжатием имён (ответ из примера — 88 байт против 151 без сжатия), HTTP/1.1 с `Content-Length` и `chunked` (в том числе неполными сообщениями) и решение кеша по формулам RFC 9111 (возраст, срок свежести, эвристика 10 %). Парсеры обязаны быть **строгими**: на тысячах случайно испорченных сообщений — либо результат, либо `WireError`, но никогда `TypeError`, зависание или тихая ошибка.",
  scenario: [
    p("Вы пишете ядро диагностического инструмента для сетевой команды: он читает дампы пакетов, показывает поля заголовков, проверяет контрольные суммы, раскладывает DNS-ответы и HTTP-сообщения и объясняет, почему ответ из кеша «свежий» или «устаревший». Данные приходят из сети — значит, любые из них могут быть **неверными и враждебными**: указатель DNS, ссылающийся на самого себя, `Content-Length` вместе с `Transfer-Encoding` (классика подмены HTTP-запросов), отрицательные и нечисловые длины, оборванные сообщения."),
    p("Заготовка лежит в `starter/wire.mjs`: функции бросают «не реализовано». Проверка `check.mjs` (53 проверки) запускается командой `node check.mjs .` в каталоге с вашим `wire.mjs`. Нужен только Node.js 22; все векторы — канонические: заголовок IPv4 и пример `chunked` из статей Википедии, примеры RFC 1071 и RFC 1035, формулы возраста RFC 9111."),
    code("js", `// Заготовка проекта «Протоколы на проводе». Реализуйте функции, затем запустите:  node check.mjs .
// Имена экспортов менять нельзя. Подробные форматы и правила — в описании проекта.

export class WireError extends Error {
  constructor(message) { super(message); this.name = "WireError"; }
}

export function internetChecksum(data) {
  throw new Error("не реализовано: internetChecksum");
}

export function buildIPv4Header(fields) {
  throw new Error("не реализовано: buildIPv4Header");
}

export function parseIPv4Header(data) {
  throw new Error("не реализовано: parseIPv4Header");
}

export function buildUdpDatagram(fields) {
  throw new Error("не реализовано: buildUdpDatagram");
}

export function parseUdpDatagram(data, srcIp, dstIp) {
  throw new Error("не реализовано: parseUdpDatagram");
}

export function encodeDns(message) {
  throw new Error("не реализовано: encodeDns");
}

export function decodeDns(data) {
  throw new Error("не реализовано: decodeDns");
}

export function parseHttpMessage(data) {
  throw new Error("не реализовано: parseHttpMessage");
}

export function cacheDecision(response, options = {}) {
  throw new Error("не реализовано: cacheDecision");
}`, { filename: "starter/wire.mjs" }),
    table(
      ["Функция", "Контракт"],
      [
        ["`internetChecksum(data)`", "Дополнение до единицы суммы 16-битных слов (RFC 1071); данные — `Uint8Array`, массив или строка; нечётная длина дополняется нулём; пустой вход → `0xFFFF`"],
        ["`buildIPv4Header({ tos, totalLength, id, dontFragment, moreFragments, fragmentOffset, ttl, protocol, src, dst })`", "`Uint8Array(20)` с вычисленной суммой; адреса — строки `a.b.c.d`; смещение фрагмента 0…8191; длина пакета 20…65535, иначе `WireError`"],
        ["`parseIPv4Header(data)`", "`{ version, ihl, headerLength, tos, totalLength, id, dontFragment, moreFragments, fragmentOffset, ttl, protocol, checksum, checksumValid, src, dst }`; версия не 4, `ihl < 5`, данных меньше заголовка → `WireError`"],
        ["`buildUdpDatagram({ srcPort, dstPort, payload, srcIp, dstIp })` · `parseUdpDatagram(data, srcIp, dstIp)`", "Сумма по псевдозаголовку (src, dst, 0, 17, длина); нулевая сумма передаётся как `0xFFFF`; принятая сумма `0` — «без суммы», `checksumValid = true`; поле длины не согласовано с данными → `WireError`"],
        ["`encodeDns(message)` · `decodeDns(data)`", "`message = { id, flags: { qr, opcode, aa, tc, rd, ra, rcode }, questions: [{ name, type, class }], answers: [{ name, type, class, ttl, data }] }`; типы `A`, `NS`, `CNAME`, `MX` (`{ preference, exchange }`), `TXT` (массив строк), `AAAA` (восемь групп без `::` и ведущих нулей)"],
        ["`parseHttpMessage(data)`", "`{ complete: false }` для неполного сообщения; иначе `{ complete: true, kind, version, method, target | status, reason, headers, trailers, body, rest, closeDelimited? }`; заголовки — в нижнем регистре, повторы объединяются через `\", \"`; нарушения формата → `WireError`"],
        ["`cacheDecision({ status, headers, requestTime, responseTime, now }, { shared })`", "`{ storable, currentAge, freshnessLifetime, fresh, mustRevalidate }`; время — в секундах; `shared: true` — общий кеш (учитывает `s-maxage` и `private`)"],
      ],
      "Контракт модуля",
    ),
  ],
  requirements: [
    "`wire.mjs` экспортирует `WireError`, `internetChecksum`, `buildIPv4Header`, `parseIPv4Header`, `buildUdpDatagram`, `parseUdpDatagram`, `encodeDns`, `decodeDns`, `parseHttpMessage`, `cacheDecision`.",
    "`internetChecksum` для заголовка `4500 0073 0000 4000 4011 0000 c0a8 0001 c0a8 00c7` равна `0xb861`; для `00 01 f2 03 f4 f5 f6 f7` — `0x220d`; сумма блока вместе с дописанной суммой равна `0`.",
    "Разбор заголовка из статьи: длина 115, `dontFragment = true`, TTL 64, протокол 17, адреса `192.168.0.1` и `192.168.0.199`, сумма верна; изменение **любого из 160 битов** делает `checksumValid = false`; заголовок с параметрами (`ihl = 6`) проверяется по всем 24 байтам.",
    "UDP: сумма считается с псевдозаголовком, поэтому изменённый адрес получателя или байт нагрузки делает её неверной; найденная нулевая сумма заменяется на `0xFFFF`; лишние байты после датаграммы отбрасываются.",
    "DNS: запрос `example.com A` кодируется канонически (`1234 0100 0001 … 07 example 03 com 00 0001 0001`); при кодировании каждое имя пишется метками, а **самый длинный** уже встречавшийся суффикс заменяется указателем `0xC000 | смещение первого вхождения` (ответ из примера — ровно 88 байт, указатели `c00c`, `c010`, `c02d`); метка — 1…63 байта.",
    "`decodeDns` разворачивает указатели, но отвергает указатель **на себя или вперёд**, цикл указателей, метки длиннее 63 байт, оборванные имена и записи, неверную длину данных (`A` — 4 байта, `AAAA` — 16); любой строгий префикс корректного ответа даёт `WireError`.",
    "HTTP: допускаются только `CRLF` (голый `LF` — ошибка), версии `1.0` и `1.1`; свёртка строк заголовка (obs-fold), пробел перед двоеточием и неверные имена — ошибка; ответы `1xx`, `204`, `304` не имеют тела; ответ без указания длины читается до конца соединения (`closeDelimited = true`).",
    "`chunked`: размер — только шестнадцатеричные цифры (1–8), без знака и `0x`; расширения `;name=value` игнорируются; трейлеры разбираются; после данных блока — `CRLF`; результат для примера из Википедии — тело `Wikipedia in \\r\\n\\r\\nchunks.`.",
    "Защита от подмены запросов: `Content-Length` вместе с `Transfer-Encoding`, разные значения `Content-Length`, нецифровой или со знаком `Content-Length`, `Transfer-Encoding` не `chunked` или `chunked` не последним — `WireError`.",
    "Любой строгий префикс корректного HTTP-сообщения (запроса, ответа с `Content-Length`, `chunked`) даёт `{ complete: false }`; на 3000 случайно испорченных DNS- и HTTP-сообщений результат — объект или `WireError`.",
    "Кеш (RFC 9111): исходный возраст = `max(кажущийся, Age + задержка ответа)`, текущий = исходный + время в кеше; срок — `s-maxage` (общий кеш) → `max-age` → `Expires − Date` → 10 % от `Date − Last-Modified` (только для кодов, кешируемых по умолчанию); свежим считается ответ, срок которого **строго больше** возраста; `no-store` и `private` (в общем кеше) запрещают хранение, `no-cache` требует проверки.",
  ],
  constraints: [
    "Только стандартные средства JavaScript (`Uint8Array`, `DataView`, `TextEncoder`/`TextDecoder`); никаких библиотек.",
    "Парсеры не должны зависать: цикл указателей DNS обнаруживается, чтение блоков не рекурсивно.",
    "Парсеры не бросают ничего, кроме `WireError`: ни `TypeError` при обращении за концом буфера, ни `RangeError`.",
    "`headers` — объект без унаследованных свойств: заголовок `__proto__` — обычный заголовок, `headers.toString` не определён.",
    "Входные буферы не изменяются; результаты сборки — новые `Uint8Array`.",
  ],
  expected: [
    "`node check.mjs .` печатает `Пройдено проверок: 53 из 53`.",
    "`buildIPv4Header({ totalLength: 115, dontFragment: true, ttl: 64, protocol: 17, src: \"192.168.0.1\", dst: \"192.168.0.199\" })` — байты `4500 0073 0000 4000 4011 b861 c0a8 0001 c0a8 00c7`.",
    "Для ответа `www.example.com` с `CNAME`, `A` и `MX` `encodeDns` возвращает 88 байт, начинающихся с `0001 8180 0001 0003 0000 0000 03 77 77 77 07 …`.",
    "`cacheDecision` с `Age: 10`, `max-age=60`, задержкой ответа 1 с, `Date` на 2 с раньше получения и временем 28 с в кеше: `currentAge = 39`, `fresh = true`.",
  ],
  technical: [
    "Контрольная сумма: складывайте слова в обычное число, затем «сворачивайте» перенос (`while (sum > 0xFFFF) sum = (sum & 0xFFFF) + (sum >>> 16)`) и инвертируйте. Проверка получателя — сумма вместе с полем суммы равна `0`.",
    "IPv4: байт 0 — версия (старшие 4 бита) и `ihl` (младшие); слово 6–7: бит `0x4000` — не фрагментировать, `0x2000` — есть ещё фрагменты, младшие 13 бит — смещение в восьмибайтных единицах; адреса — байты 12–15 и 16–19.",
    "Псевдозаголовок UDP: `src(4) dst(4) 0 протокол(17) длина(2)`; он **не передаётся**, но входит в сумму — поэтому доставка не тому получателю обнаруживается.",
    "Сжатие имён DNS: ведите таблицу «суффикс → смещение первой записи»; для каждой метки проверяйте самый длинный суффикс; указатель — два байта `11xxxxxx xxxxxxxx`, смещение — 14 бит.",
    "Разворачивая имя, держите счётчик переходов и требуйте, чтобы указатель вёл **назад** (на смещение меньше текущего): так циклы невозможны по построению.",
    "Разбор HTTP начинайте с поиска `\\r\\n\\r\\n`; если его нет — `complete: false`. Длину тела определяет `Transfer-Encoding`, затем `Content-Length`, иначе — до конца соединения (для ответов) или пусто (для запросов). Проверку «и то и другое» делайте до чтения тела.",
    "Для `chunked` читайте строку размера, затем ровно `size` байт и `CRLF`; последний блок `0` завершается пустой строкой или трейлерами. Если данных не хватает — `complete: false`, а не ошибка: сообщение просто ещё не пришло целиком.",
    "Возраст кеша: `apparent = max(0, responseTime − Date)`, `delay = responseTime − requestTime`, `initial = max(apparent, Age + delay)`, `current = initial + (now − responseTime)`; ответ свеж, если `freshnessLifetime > current`.",
  ],
  acceptance: [
    "`node check.mjs .` — 53 из 53.",
    "Заготовка проходит 1 из 53 проверок (экспорты).",
    "Каждый из двадцати четырёх «плохих» вариантов проваливает не менее одной проверки: от 1 (нет проверки версии, нулевая сумма UDP, цикл указателей, метка 64 байта, группы AAAA с нулями, неполное сообщение как ошибка, Content-Length вместе с Transfer-Encoding, свёртка строк, тело у 204, возраст без задержки, эвристика 50 %, `private` в общем кеше, `no-cache` как свежий и другие) до 6 (контрольная сумма без свёртки переноса).",
    "Парсеры проходят проверки на испорченных данных: ни одного исключения, кроме `WireError`.",
  ],
  hints: [
    "Начните с `internetChecksum` и проверьте три значения: `0xb861`, `0x220d`, `0xffff` для пустого входа — на них держатся IPv4 и UDP.",
    "Если разбор IPv4 из статьи верен, а случайные заголовки «не сходятся», проверьте порядок байтов (старший первым) и порядок битов флагов: `0x4000` — DF, `0x2000` — MF.",
    "Для UDP сначала соберите массив `псевдозаголовок + датаграмма`, посчитайте сумму и только потом запишите её в байты 6–7; при проверке сумма **всего** вместе с полем должна быть `0`.",
    "В DNS сначала добейтесь канонического байтового представления запроса (без сжатия), затем добавьте таблицу суффиксов; сверяйте с шестнадцатеричной строкой из описания, а не «на глаз».",
    "Ошибки типа `TypeError: Cannot read properties of undefined` почти всегда означают, что вы обратились за пределы буфера: добавьте функцию `need(n)`, которая бросает `WireError`, и вызывайте её перед каждым чтением.",
    "Для `chunked` напишите цикл «строка размера → данные → CRLF» и вставьте `return { complete: false }` в каждое место, где данных может не хватить; затем прогоните сообщение по всем префиксам — любое «успешное» разбиение префикса выдаёт ошибку.",
    "В кеше сначала реализуйте срок (max-age → Expires → эвристика), потом возраст, потом правила хранения: так проще найти, какая часть формулы даёт неверное число.",
  ],
  advanced: [
    "Добавьте разбор TCP-заголовка (флаги, номера последовательности и подтверждения, размер окна) с суммой по псевдозаголовку и разбор параметров (MSS, масштаб окна, SACK).",
    "Реализуйте сборку фрагментированных IPv4-датаграмм по `id`, смещению и `moreFragments` с защитой от перекрытий и от слишком больших пакетов.",
    "Добавьте в DNS типы `SRV`, `SOA`, `PTR` и записи EDNS(0) (`OPT`), а также усечённые ответы (`tc`) и повторный запрос по TCP.",
    "Реализуйте разбор HTTP-заголовков `Cache-Control`, `Vary`, `ETag`, `If-None-Match` и условный запрос: решение «отдать из кеша / проверить / загрузить заново».",
    "Напишите «фаззер»: генерируйте корректные сообщения, мутируйте их и проверяйте инвариант «результат либо корректен, либо `WireError`»; найденные падения превращайте в регрессионные тесты.",
  ],
  failureModes: [
    "**Контрольная сумма без свёртки переноса:** суммы верны только для коротких данных; красных 6 проверок из 53 (IPv4, UDP, примеры RFC 1071).",
    "**Нечётный последний байт дублируется, а не дополняется нулём:** 2 проверки.",
    "**Биты DF и MF перепутаны:** разбор заголовка из статьи показывает `moreFragments` вместо `dontFragment`; 3 проверки.",
    "**Нет проверки версии:** заголовок IPv6 «разбирается» как IPv4; 1 проверка.",
    "**Сумма IPv4 считается только по первым 20 байтам:** заголовок с параметрами признаётся неверным; 1 проверка.",
    "**UDP без псевдозаголовка:** сумма не зависит от адресов; 4 проверки.",
    "**Нулевая сумма UDP остаётся нулём:** получатель решит, что суммы нет; 1 проверка.",
    "**Принятая нулевая сумма считается неверной:** отвергаются корректные датаграммы без суммы; 1 проверка.",
    "**DNS без сжатия имён:** сообщение занимает 151 байт вместо эталонных 88; 1 проверка.",
    "**Цикл указателей не обнаруживается:** на сообщении с указателем на себя разбор зависает (в проверке срабатывает счётчик переходов); 1 проверка.",
    "**Метка в 64 байта допускается:** нарушение предела RFC 1035; 1 проверка.",
    "**Бит `rd` в неверной позиции:** флаги запроса искажены; красных 4 проверки.",
    "**AAAA с ведущими нулями:** данные не совпадают с контрактом; 1 проверка.",
    "**Размер блока читается как десятичное число:** `E` и `10` разбираются неверно; 4 проверки.",
    "**Неполное сообщение — ошибка:** потоковый разбор невозможен; 1 проверка.",
    "**`Content-Length` вместе с `Transfer-Encoding` допускается:** окно для подмены запросов; 1 проверка.",
    "**Свёртка строк заголовка допускается:** разные узлы видят разные заголовки; 1 проверка.",
    "**У ответа `204` читается тело:** остаток потока теряется; 1 проверка.",
    "**Повторный заголовок затирает предыдущий:** `x-dup: a` и `x-dup: b` дают `b`; 2 проверки.",
    "**Возраст без задержки ответа:** `currentAge = 38` вместо 39; 1 проверка.",
    "**Свежим считается ответ с равными сроком и возрастом:** граница 60 с; 2 проверки.",
    "**Эвристика 50 %, а не 10 %:** срок 432 000 вместо 86 400; 1 проверка.",
    "**`private` не учитывается в общем кеше:** личные данные сохраняются для всех; 1 проверка.",
    "**`no-cache` считается свежим:** обращение к серверу пропускается; 1 проверка.",
  ],
  rubric: [
    { criterion: "Контрольные суммы и IPv4/UDP", weight: 20, description: "Сумма RFC 1071, поля заголовка, флаги, параметры, псевдозаголовок, нулевая сумма, обнаружение всех одиночных битовых ошибок." },
    { criterion: "DNS", weight: 25, description: "Канонические байты, сжатие по самому длинному суффиксу, защита от цикла и вперёд-указателей, оборванные сообщения, типы записей, флаги." },
    { criterion: "HTTP/1.1", weight: 25, description: "Стартовые строки, заголовки, `Content-Length`, `chunked`, трейлеры, неполные сообщения, безтельные ответы, защита от подмены запросов." },
    { criterion: "Кеш по RFC 9111", weight: 15, description: "Возраст, срок свежести, эвристика, `no-store`, `no-cache`, `private`, `s-maxage`, `must-revalidate`, строгая граница свежести." },
    { criterion: "Устойчивость", weight: 10, description: "Только `WireError` на мусоре, отсутствие зависаний, проверка границ буфера, чистые результаты." },
    { criterion: "Читаемость", weight: 5, description: "Функция `need`, понятные имена, небольшие функции, комментарии с форматами." },
  ],
  solution: [
    p("Эталон — один файл `wire.mjs` (около 260 строк). Он проходит все 53 проверки; заготовка проходит 1 из 53, а каждый из двадцати четырёх намеренно испорченных вариантов — меньше 53."),
    h("wire.mjs"),
    code("js", `// wire.mjs — протоколы «на проводе»: контрольная сумма Интернета, заголовок IPv4, UDP, сообщения DNS, HTTP/1.1 и решение кеша по RFC 9111

export class WireError extends Error { constructor(message) { super(message); this.name = "WireError"; } }
const bytesOf = (x) => (typeof x === "string" ? new TextEncoder().encode(x) : Uint8Array.from(x));

/* ───────── Контрольная сумма (RFC 1071) ───────── */
export function internetChecksum(data) {
  const b = bytesOf(data); let sum = 0;
  for (let i = 0; i < b.length; i += 2) sum += (b[i] << 8) | (i + 1 < b.length ? b[i + 1] : 0);
  while (sum > 0xffff) sum = (sum & 0xffff) + (sum >>> 16);
  return ~sum & 0xffff;
}
const ipBytes = (s) => { const p = String(s).split("."); if (p.length !== 4 || p.some((x) => !/^\\d{1,3}$/.test(x) || Number(x) > 255)) throw new WireError(\`неверный IPv4-адрес «\${s}»\`); return p.map(Number); };
const ipText = (b) => \`\${b[0]}.\${b[1]}.\${b[2]}.\${b[3]}\`;

/* ───────── IPv4 ───────── */
export function buildIPv4Header({ tos = 0, totalLength, id = 0, dontFragment = false, moreFragments = false, fragmentOffset = 0, ttl = 64, protocol, src, dst }) {
  const h = new Uint8Array(20), dv = new DataView(h.buffer);
  if (!Number.isInteger(totalLength) || totalLength < 20 || totalLength > 65535) throw new WireError("длина пакета вне диапазона 20…65535");
  if (!Number.isInteger(fragmentOffset) || fragmentOffset < 0 || fragmentOffset > 0x1fff) throw new WireError("смещение фрагмента вне диапазона 0…8191");
  h[0] = 0x45; h[1] = tos; dv.setUint16(2, totalLength); dv.setUint16(4, id);
  dv.setUint16(6, (dontFragment ? 0x4000 : 0) | (moreFragments ? 0x2000 : 0) | fragmentOffset);
  h[8] = ttl; h[9] = protocol; h.set(ipBytes(src), 12); h.set(ipBytes(dst), 16);
  dv.setUint16(10, internetChecksum(h)); return h;
}
export function parseIPv4Header(data) {
  const b = bytesOf(data);
  if (b.length < 20) throw new WireError("заголовок IPv4 короче 20 байт");
  const version = b[0] >> 4, ihl = b[0] & 15;
  if (version !== 4) throw new WireError(\`версия \${version}, ожидалась 4\`);
  if (ihl < 5) throw new WireError(\`длина заголовка \${ihl} слов меньше 5\`);
  if (b.length < ihl * 4) throw new WireError("данных меньше, чем длина заголовка");
  const dv = new DataView(b.buffer, b.byteOffset, b.length), ff = dv.getUint16(6);
  return { version, ihl, headerLength: ihl * 4, tos: b[1], totalLength: dv.getUint16(2), id: dv.getUint16(4), dontFragment: !!(ff & 0x4000), moreFragments: !!(ff & 0x2000), fragmentOffset: ff & 0x1fff, ttl: b[8], protocol: b[9], checksum: dv.getUint16(10), checksumValid: internetChecksum(b.subarray(0, ihl * 4)) === 0, src: ipText(b.subarray(12, 16)), dst: ipText(b.subarray(16, 20)) };
}

/* ───────── UDP ───────── */
const pseudo = (src, dst, len) => Uint8Array.from([...ipBytes(src), ...ipBytes(dst), 0, 17, len >> 8, len & 255]);
export function buildUdpDatagram({ srcPort, dstPort, payload, srcIp, dstIp }) {
  const p = bytesOf(payload), len = 8 + p.length, d = new Uint8Array(len), dv = new DataView(d.buffer);
  if (len > 65535) throw new WireError("датаграмма длиннее 65535 байт");
  dv.setUint16(0, srcPort); dv.setUint16(2, dstPort); dv.setUint16(4, len); d.set(p, 8);
  let c = internetChecksum(Uint8Array.from([...pseudo(srcIp, dstIp, len), ...d]));
  if (c === 0) c = 0xffff;                                                     // нулевая сумма передаётся как 0xFFFF: 0 означает «без суммы»
  dv.setUint16(6, c); return d;
}
export function parseUdpDatagram(data, srcIp, dstIp) {
  const b = bytesOf(data);
  if (b.length < 8) throw new WireError("датаграмма UDP короче 8 байт");
  const dv = new DataView(b.buffer, b.byteOffset, b.length), length = dv.getUint16(4), checksum = dv.getUint16(6);
  if (length < 8 || length > b.length) throw new WireError(\`поле длины \${length} не согласовано с данными (\${b.length} байт)\`);
  const seg = b.subarray(0, length);
  const valid = checksum === 0 ? true : internetChecksum(Uint8Array.from([...pseudo(srcIp, dstIp, length), ...seg])) === 0;
  return { srcPort: dv.getUint16(0), dstPort: dv.getUint16(2), length, checksum, checksumValid: valid, payload: seg.slice(8) };
}

/* ───────── DNS (RFC 1035) ───────── */
const TYPES = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28 }, TYPE_NAME = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v, k]));
export function encodeDns(msg) {
  const out = [], names = new Map();                                            // суффикс имени → смещение первого вхождения
  const u16 = (v) => out.push((v >> 8) & 255, v & 255), u32 = (v) => { u16(v >>> 16); u16(v & 0xffff); };
  const name = (n) => {
    const labels = n === "" || n === "." ? [] : n.replace(/\\.$/, "").split(".");
    for (let i = 0; i < labels.length; i++) {
      const suffix = labels.slice(i).join(".").toLowerCase();
      if (names.has(suffix)) { u16(0xc000 | names.get(suffix)); return; }
      if (out.length < 0x4000) names.set(suffix, out.length);
      const l = new TextEncoder().encode(labels[i]);
      if (l.length === 0 || l.length > 63) throw new WireError(\`метка «\${labels[i]}» должна быть длиной 1…63 байта\`);
      out.push(l.length, ...l);
    }
    out.push(0);
  };
  const f = msg.flags ?? {};
  u16(msg.id); u16(((f.qr ? 1 : 0) << 15) | ((f.opcode ?? 0) << 11) | ((f.aa ? 1 : 0) << 10) | ((f.tc ? 1 : 0) << 9) | ((f.rd ? 1 : 0) << 8) | ((f.ra ? 1 : 0) << 7) | (f.rcode ?? 0));
  u16((msg.questions ?? []).length); u16((msg.answers ?? []).length); u16(0); u16(0);
  for (const q of msg.questions ?? []) { name(q.name); u16(TYPES[q.type]); u16(q.class ?? 1); }
  for (const a of msg.answers ?? []) {
    name(a.name); u16(TYPES[a.type]); u16(a.class ?? 1); u32(a.ttl);
    const lenAt = out.length; u16(0); const start = out.length;
    if (a.type === "A") out.push(...ipBytes(a.data));
    else if (a.type === "AAAA") for (const g of a.data.split(":")) u16(parseInt(g, 16));
    else if (a.type === "CNAME" || a.type === "NS") name(a.data);
    else if (a.type === "MX") { u16(a.data.preference); name(a.data.exchange); }
    else if (a.type === "TXT") for (const s of a.data) { const t = new TextEncoder().encode(s); if (t.length > 255) throw new WireError("строка TXT длиннее 255 байт"); out.push(t.length, ...t); }
    else throw new WireError(\`неподдерживаемый тип «\${a.type}»\`);
    const len = out.length - start; out[lenAt] = len >> 8; out[lenAt + 1] = len & 255;
  }
  return Uint8Array.from(out);
}
export function decodeDns(data) {
  const b = bytesOf(data), dv = new DataView(b.buffer, b.byteOffset, b.length); let pos = 0;
  const need = (n) => { if (pos + n > b.length) throw new WireError("сообщение оборвано"); };
  const u16 = () => { need(2); const v = dv.getUint16(pos); pos += 2; return v; }, u32 = () => { need(4); const v = dv.getUint32(pos); pos += 4; return v; };
  const readName = (at) => {
    const labels = []; let p = at, jumped = false, end = at, hops = 0;
    for (;;) {
      if (p >= b.length) throw new WireError("имя оборвано");
      const len = b[p];
      if (len === 0) { if (!jumped) end = p + 1; break; }
      if ((len & 0xc0) === 0xc0) {
        if (p + 1 >= b.length) throw new WireError("указатель оборван");
        if (!jumped) end = p + 2; jumped = true;
        const target = ((len & 0x3f) << 8) | b[p + 1];
        if (target >= p || ++hops > 64) throw new WireError("указатель ссылается вперёд или образует цикл");
        p = target; continue;
      }
      if (len > 63) throw new WireError(\`метка длиннее 63 байт (\${len})\`);
      if (p + 1 + len > b.length) throw new WireError("метка оборвана");
      labels.push(new TextDecoder().decode(b.subarray(p + 1, p + 1 + len))); p += 1 + len;
      if (!jumped) end = p;
    }
    return { name: labels.join("."), end };
  };
  const nameHere = () => { const r = readName(pos); pos = r.end; return r.name; };
  if (b.length < 12) throw new WireError("заголовок DNS короче 12 байт");
  const id = u16(), fl = u16(), qd = u16(), an = u16(), ns = u16(), ar = u16();
  const flags = { qr: !!(fl & 0x8000), opcode: (fl >> 11) & 15, aa: !!(fl & 0x400), tc: !!(fl & 0x200), rd: !!(fl & 0x100), ra: !!(fl & 0x80), rcode: fl & 15 };
  const questions = [], answers = [];
  for (let i = 0; i < qd; i++) { const n = nameHere(), t = u16(), c = u16(); questions.push({ name: n, type: TYPE_NAME[t] ?? t, class: c }); }
  for (let i = 0; i < an; i++) {
    const n = nameHere(), t = u16(), c = u16(), ttl = u32(), len = u16(); need(len); const rdEnd = pos + len; let data;
    if (t === 1) { if (len !== 4) throw new WireError("запись A должна занимать 4 байта"); data = ipText(b.subarray(pos, pos + 4)); pos += 4; }
    else if (t === 28) { if (len !== 16) throw new WireError("запись AAAA должна занимать 16 байт"); const g = []; for (let k = 0; k < 8; k++) g.push(dv.getUint16(pos + 2 * k).toString(16)); data = g.join(":"); pos += 16; }
    else if (t === 5 || t === 2) data = nameHere();
    else if (t === 15) { const preference = u16(); data = { preference, exchange: nameHere() }; }
    else if (t === 16) { data = []; while (pos < rdEnd) { const l = b[pos++]; need(l); data.push(new TextDecoder().decode(b.subarray(pos, pos + l))); pos += l; } }
    else { data = b.slice(pos, rdEnd); pos = rdEnd; }
    if (pos !== rdEnd) throw new WireError("длина данных записи не совпала с содержимым");
    answers.push({ name: n, type: TYPE_NAME[t] ?? t, class: c, ttl, data });
  }
  void ns; void ar;
  return { id, flags, questions, answers };
}

/* ───────── HTTP/1.1 (RFC 9112) ───────── */
const TOKEN = /^[!#$%&'*+\\-.^_\`|~0-9A-Za-z]+$/;
export function parseHttpMessage(data) {
  const b = bytesOf(data), text = new TextDecoder("latin1").decode(b), end = text.indexOf("\\r\\n\\r\\n");
  if (/(^|[^\\r])\\n/.test(end === -1 ? text : text.slice(0, end))) throw new WireError("строка заканчивается голым LF");
  if (end === -1) return { complete: false };
  const lines = text.slice(0, end).split("\\r\\n"), start = lines.shift();
  const m = /^HTTP\\/(1\\.[01]) (\\d{3})(?: (.*))?$/.exec(start), r = m ? null : /^([!#$%&'*+\\-.^_\`|~0-9A-Za-z]+) (\\S+) HTTP\\/(1\\.[01])$/.exec(start);
  if (!m && !r) throw new WireError(\`неверная стартовая строка «\${start.slice(0, 40)}»\`);
  const kind = m ? "response" : "request", headers = Object.create(null);
  const parseHeaderLines = (ls) => { const h = Object.create(null); for (const line of ls) { if (/^[ \\t]/.test(line)) throw new WireError("свёртка строк заголовка (obs-fold) запрещена"); const i = line.indexOf(":"); if (i <= 0) throw new WireError(\`строка заголовка без двоеточия «\${line.slice(0, 30)}»\`); const name = line.slice(0, i); if (!TOKEN.test(name)) throw new WireError(\`неверное имя заголовка «\${name}»\`); const v = line.slice(i + 1).replace(/^[ \\t]+|[ \\t]+$/g, ""), k = name.toLowerCase(); h[k] = k in h ? \`\${h[k]}, \${v}\` : v; } return h; };
  Object.assign(headers, parseHeaderLines(lines));
  const bodyStart = end + 4, status = m ? Number(m[2]) : null;
  const res = { complete: true, kind, version: m ? m[1] : r[3], ...(m ? { status, reason: m[3] ?? "" } : { method: r[1], target: r[2] }), headers, trailers: Object.create(null), body: new Uint8Array(0), rest: new Uint8Array(0) };
  const noBody = kind === "response" && (status < 200 || status === 204 || status === 304);
  const te = headers["transfer-encoding"], cl = headers["content-length"];
  if (te !== undefined && cl !== undefined) throw new WireError("одновременно Transfer-Encoding и Content-Length");
  if (noBody) { res.rest = b.slice(bodyStart); return res; }
  if (te !== undefined) {
    const codings = te.split(",").map((s) => s.trim().toLowerCase());
    if (codings[codings.length - 1] !== "chunked" || codings.length > 1) throw new WireError(\`неподдерживаемое Transfer-Encoding: \${te}\`);
    const chunks = []; let p = bodyStart;
    for (;;) {
      const eol = text.indexOf("\\r\\n", p); if (eol === -1) return { complete: false };
      const sizeText = text.slice(p, eol).split(";")[0].trim();
      if (!/^[0-9a-fA-F]{1,8}$/.test(sizeText)) throw new WireError(\`неверный размер блока «\${sizeText.slice(0, 20)}»\`);
      const size = parseInt(sizeText, 16); p = eol + 2;
      if (size === 0) {                                                        // последний блок: необязательные трейлеры и пустая строка
        if (text.startsWith("\\r\\n", p)) { p += 2; break; }
        const tEnd = text.indexOf("\\r\\n\\r\\n", p); if (tEnd === -1) return { complete: false };
        Object.assign(res.trailers, parseHeaderLines(text.slice(p, tEnd).split("\\r\\n"))); p = tEnd + 4; break;
      }
      if (p + size + 2 > b.length) return { complete: false };
      if (text.slice(p + size, p + size + 2) !== "\\r\\n") throw new WireError("после данных блока нет CRLF");
      chunks.push(b.subarray(p, p + size)); p += size + 2;
    }
    res.body = Uint8Array.from(chunks.flatMap((c) => [...c])); res.rest = b.slice(p); return res;
  }
  if (cl !== undefined) {
    const values = cl.split(",").map((s) => s.trim());
    if (values.some((v) => !/^\\d+$/.test(v)) || new Set(values).size > 1) throw new WireError(\`неверный Content-Length «\${cl}»\`);
    const n = Number(values[0]);
    if (bodyStart + n > b.length) return { complete: false };
    res.body = b.slice(bodyStart, bodyStart + n); res.rest = b.slice(bodyStart + n); return res;
  }
  if (kind === "request") { res.rest = b.slice(bodyStart); return res; }
  res.body = b.slice(bodyStart); res.closeDelimited = true; return res;
}

/* ───────── Решение кеша (RFC 9111) ───────── */
const DEFAULT_CACHEABLE = new Set([200, 203, 204, 206, 300, 301, 308, 404, 405, 410, 414, 501]);
export function cacheDecision({ status, headers, requestTime, responseTime, now }, { shared = false } = {}) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
  const cc = Object.create(null);
  for (const part of (h["cache-control"] ?? "").split(",")) { const [k, ...v] = part.trim().split("="); if (k) cc[k.toLowerCase()] = v.length ? v.join("=").replace(/^"|"$/g, "") : true; }
  const date = h.date !== undefined && !Number.isNaN(Date.parse(h.date)) ? Date.parse(h.date) / 1000 : responseTime;
  const secs = (v) => (/^\\d+$/.test(String(v)) ? Number(v) : 0);
  let lifetime = 0, explicit = false;
  const maxAge = shared && cc["s-maxage"] !== undefined ? cc["s-maxage"] : cc["max-age"];
  if (maxAge !== undefined) { lifetime = secs(maxAge); explicit = true; }
  else if (h.expires !== undefined) { const e = Date.parse(h.expires); lifetime = Number.isNaN(e) ? 0 : Math.max(0, e / 1000 - date); explicit = true; }
  else if (h["last-modified"] !== undefined && DEFAULT_CACHEABLE.has(status)) { const lm = Date.parse(h["last-modified"]); if (!Number.isNaN(lm)) lifetime = Math.max(0, Math.floor((date - lm / 1000) * 0.1)); }
  const storable = cc["no-store"] === undefined && !(shared && cc.private !== undefined) && (explicit || DEFAULT_CACHEABLE.has(status));
  const apparent = Math.max(0, responseTime - date), delay = responseTime - requestTime, corrected = secs(h.age) + delay;
  const currentAge = Math.max(apparent, corrected) + (now - responseTime);
  const fresh = storable && cc["no-cache"] === undefined && lifetime > currentAge;
  return { storable, currentAge, freshnessLifetime: lifetime, fresh, mustRevalidate: storable && (cc["no-cache"] !== undefined || (!fresh && cc["must-revalidate"] !== undefined)) };
}`, { filename: "wire.mjs", lineNumbers: true }),
    h("Самопроверка check.mjs"),
    p("В проверках — канонические векторы (заголовок IPv4 и пример `chunked` из Википедии, пример RFC 1071), независимый расчёт суммы UDP, проход по **всем** строгим префиксам корректных сообщений и по тысячам случайно испорченных (с фиксированным начальным значением, поэтому воспроизводимо)."),
    code("js", `// Самопроверка проекта «Протоколы на проводе». Запуск: node check.mjs [каталог с wire.mjs]
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.argv[2] ?? "solution");
const W = await import(pathToFileURL(path.join(dir, "wire.mjs")).href);
const { WireError, internetChecksum, buildIPv4Header, parseIPv4Header, buildUdpDatagram, parseUdpDatagram, encodeDns, decodeDns, parseHttpMessage, cacheDecision } = W;

let total = 0, passed = 0;
function check(name, fn) {
  total++;
  let ok = false, note = "";
  try { const r = fn(); ok = r === true; if (!ok) note = \` (вернуло \${typeof r === "object" ? JSON.stringify(r)?.slice(0, 90) : String(r)})\`; } catch (e) { note = \` (\${e?.name ?? "Error"}: \${String(e?.message ?? e).split("\\n")[0].slice(0, 90)})\`; }
  if (ok) passed++;
  console.log(\`\${ok ? "OK " : "НЕТ"}  \${name}\${ok ? "" : note}\`);
}
const J = JSON.stringify;
const seeded = (sd) => { let x = sd >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; };
const hex = (s) => Uint8Array.from(s.replace(/\\s+/g, "").match(/../g)?.map((x) => parseInt(x, 16)) ?? []);
const toHex = (b) => Buffer.from(b).toString("hex");
const wireErr = (f) => { try { f(); return false; } catch (e) { return e instanceof WireError || e?.name === "WireError"; } };
const txt = (b) => new TextDecoder().decode(b);
const enc = (s) => new TextEncoder().encode(s);

// ── Контрольная сумма ──
check("экспортированы все функции и WireError", () => [WireError, internetChecksum, buildIPv4Header, parseIPv4Header, buildUdpDatagram, parseUdpDatagram, encodeDns, decodeDns, parseHttpMessage, cacheDecision].every((x) => typeof x === "function"));
check("internetChecksum: заголовок IPv4 из статьи (поле суммы обнулено) → 0xb861", () => internetChecksum(hex("4500 0073 0000 4000 4011 0000 c0a8 0001 c0a8 00c7")) === 0xb861);
check("internetChecksum: пример RFC 1071 (00 01 f2 03 f4 f5 f6 f7) → 0x220d; нечётная длина дополняется нулём", () => internetChecksum(hex("0001 f203 f4f5 f6f7")) === 0x220d && internetChecksum([0x12]) === 0xedff && internetChecksum([]) === 0xffff);
check("internetChecksum: если дописать сумму в данные, сумма всего равна 0 (проверка получателя); на 100 случайных блоках чётной длины", () => { const r = seeded(3); for (let t = 0; t < 100; t++) { const n = 2 * (1 + Math.floor(r() * 30)), d = Array.from({ length: n }, () => Math.floor(r() * 256)), c = internetChecksum(d); if (internetChecksum([...d, c >> 8, c & 255]) !== 0) return false; } return true; });

// ── IPv4 ──
const wiki = "4500 0073 0000 4000 4011 b861 c0a8 0001 c0a8 00c7";
check("parseIPv4Header: пример из статьи — длина 115, DF, TTL 64, протокол 17, адреса 192.168.0.1 и 192.168.0.199, сумма 0xb861 верна", () => { const h = parseIPv4Header(hex(wiki)); return h.version === 4 && h.ihl === 5 && h.headerLength === 20 && h.tos === 0 && h.totalLength === 115 && h.id === 0 && h.dontFragment === true && h.moreFragments === false && h.fragmentOffset === 0 && h.ttl === 64 && h.protocol === 17 && h.checksum === 0xb861 && h.checksumValid === true && h.src === "192.168.0.1" && h.dst === "192.168.0.199"; });
check("buildIPv4Header собирает тот же заголовок (с суммой b861)", () => toHex(buildIPv4Header({ totalLength: 115, dontFragment: true, ttl: 64, protocol: 17, src: "192.168.0.1", dst: "192.168.0.199" })) === wiki.replace(/\\s+/g, ""));
check("флаги и смещение фрагмента: MF и смещение 5 → байты 0x2005; DF → 0x4000; смещение 8191 допустимо, 8192 — WireError", () => { const a = parseIPv4Header(buildIPv4Header({ totalLength: 40, moreFragments: true, fragmentOffset: 5, protocol: 6, src: "1.2.3.4", dst: "5.6.7.8" })); const raw = buildIPv4Header({ totalLength: 40, moreFragments: true, fragmentOffset: 5, protocol: 6, src: "1.2.3.4", dst: "5.6.7.8" }); return a.moreFragments && !a.dontFragment && a.fragmentOffset === 5 && raw[6] === 0x20 && raw[7] === 0x05 && buildIPv4Header({ totalLength: 40, fragmentOffset: 8191, protocol: 6, src: "1.2.3.4", dst: "5.6.7.8" })[7] === 0xff && wireErr(() => buildIPv4Header({ totalLength: 40, fragmentOffset: 8192, protocol: 6, src: "1.2.3.4", dst: "5.6.7.8" })); });
check("IPv4: 200 случайных заголовков — сборка и разбор возвращают те же поля, сумма верна", () => { const r = seeded(8), ip = () => [0, 0, 0, 0].map(() => Math.floor(r() * 256)).join("."); for (let t = 0; t < 200; t++) { const f = { tos: Math.floor(r() * 256), totalLength: 20 + Math.floor(r() * 60000), id: Math.floor(r() * 65536), dontFragment: r() < 0.5, moreFragments: r() < 0.5, fragmentOffset: Math.floor(r() * 8192), ttl: Math.floor(r() * 256), protocol: Math.floor(r() * 256), src: ip(), dst: ip() }; const h = parseIPv4Header(buildIPv4Header(f)); for (const k of Object.keys(f)) if (h[k] !== f[k]) return false; if (!h.checksumValid) return false; } return true; });
check("IPv4: изменение любого из 160 битов заголовка делает сумму неверной (контрольная сумма ловит все одиночные ошибки)", () => { const base = buildIPv4Header({ totalLength: 60, id: 7, ttl: 33, protocol: 6, src: "10.0.0.1", dst: "10.0.0.2" }); for (let bit = 0; bit < 160; bit++) { const c = Uint8Array.from(base); c[bit >> 3] ^= 1 << (bit & 7); let ok; try { ok = parseIPv4Header(c).checksumValid; } catch (e) { if (e instanceof WireError) continue; throw e; } if (ok) return false; } return true; });
check("parseIPv4Header: короткие данные, версия 6, длина заголовка 4 слова, данных меньше заголовка с параметрами → WireError", () => wireErr(() => parseIPv4Header(hex("4500 0073"))) && wireErr(() => parseIPv4Header(hex("6500 0073 0000 4000 4011 b861 c0a8 0001 c0a8 00c7"))) && wireErr(() => parseIPv4Header(hex("4400 0073 0000 4000 4011 b861 c0a8 0001 c0a8 00c7"))) && wireErr(() => parseIPv4Header(hex("4600 0073 0000 4000 4011 b861 c0a8 0001 c0a8 00c7"))));
check("заголовок с параметрами (IHL = 6): headerLength 24, сумма считается по всем 24 байтам", () => { const h = hex("4600 0080 0001 0000 4006 0000 0a00 0001 0a00 0002 0102 0304"); const c = internetChecksum(h); h[10] = c >> 8; h[11] = c & 255; const p = parseIPv4Header(h); return p.ihl === 6 && p.headerLength === 24 && p.checksumValid === true; });
check("buildIPv4Header: неверный адрес, длина пакета вне 20…65535 → WireError", () => wireErr(() => buildIPv4Header({ totalLength: 40, protocol: 6, src: "1.2.3", dst: "1.2.3.4" })) && wireErr(() => buildIPv4Header({ totalLength: 40, protocol: 6, src: "1.2.3.256", dst: "1.2.3.4" })) && wireErr(() => buildIPv4Header({ totalLength: 19, protocol: 6, src: "1.2.3.4", dst: "1.2.3.4" })) && wireErr(() => buildIPv4Header({ totalLength: 70000, protocol: 6, src: "1.2.3.4", dst: "1.2.3.4" })));

// ── UDP ──
const refUdp = (src, dst, seg) => { const p = [...src.split(".").map(Number), ...dst.split(".").map(Number), 0, 17, seg.length >> 8, seg.length & 255]; let sum = 0; const all = [...p, ...seg]; for (let i = 0; i < all.length; i += 2) sum += (all[i] << 8) | (all[i + 1] ?? 0); while (sum > 0xffff) sum = (sum & 0xffff) + (sum >> 16); return ~sum & 0xffff; };
check("buildUdpDatagram: порты, длина, полезная нагрузка; сумма проверяется независимым расчётом с псевдозаголовком", () => { const d = buildUdpDatagram({ srcPort: 5353, dstPort: 53, payload: "hello", srcIp: "192.168.1.5", dstIp: "8.8.8.8" }); return d.length === 13 && d[0] === 0x14 && d[1] === 0xe9 && d[2] === 0 && d[3] === 53 && d[4] === 0 && d[5] === 13 && txt(d.subarray(8)) === "hello" && refUdp("192.168.1.5", "8.8.8.8", d) === 0; });
check("parseUdpDatagram: разбор и проверка суммы; случайные 100 датаграмм из сборки разбираются без потерь", () => { const r = seeded(4); for (let t = 0; t < 100; t++) { const payload = Uint8Array.from({ length: Math.floor(r() * 40) }, () => Math.floor(r() * 256)), a = "10.1.2.3", b = "172.16.0.9", sp = Math.floor(r() * 65536), dp = Math.floor(r() * 65536), p = parseUdpDatagram(buildUdpDatagram({ srcPort: sp, dstPort: dp, payload, srcIp: a, dstIp: b }), a, b); if (p.srcPort !== sp || p.dstPort !== dp || p.length !== 8 + payload.length || !p.checksumValid || toHex(p.payload) !== toHex(payload)) return false; } return true; });
check("UDP: изменённый байт нагрузки или другой адрес получателя в псевдозаголовке → checksumValid = false", () => { const d = buildUdpDatagram({ srcPort: 1, dstPort: 2, payload: "data!", srcIp: "1.1.1.1", dstIp: "2.2.2.2" }); const bad = Uint8Array.from(d); bad[9] ^= 1; return parseUdpDatagram(d, "1.1.1.1", "2.2.2.2").checksumValid && !parseUdpDatagram(bad, "1.1.1.1", "2.2.2.2").checksumValid && !parseUdpDatagram(d, "1.1.1.1", "2.2.2.3").checksumValid; });
check("UDP: если сумма получилась нулевой, передаётся 0xFFFF; принятая сумма 0 означает «без суммы» и считается верной", () => { let found = null; for (let v = 0; v < 65536 && !found; v++) { const payload = [v >> 8, v & 255]; const seg = Uint8Array.from([0, 1, 0, 2, 0, 10, 0, 0, ...payload]); if (refUdp("1.1.1.1", "2.2.2.2", seg) === 0) found = payload; } const d = buildUdpDatagram({ srcPort: 1, dstPort: 2, payload: found, srcIp: "1.1.1.1", dstIp: "2.2.2.2" }); const none = Uint8Array.from(d); none[6] = 0; none[7] = 0; return d[6] === 0xff && d[7] === 0xff && parseUdpDatagram(d, "1.1.1.1", "2.2.2.2").checksumValid && parseUdpDatagram(none, "1.1.1.1", "2.2.2.2").checksumValid; });
check("parseUdpDatagram: короче 8 байт, поле длины меньше 8 или больше данных → WireError; лишние байты после датаграммы отбрасываются", () => { const d = buildUdpDatagram({ srcPort: 1, dstPort: 2, payload: "ab", srcIp: "1.1.1.1", dstIp: "2.2.2.2" }); const longer = Uint8Array.from([...d, 9, 9, 9]), tooBig = Uint8Array.from(d); tooBig[5] = 200; const tooSmall = Uint8Array.from(d); tooSmall[5] = 4; return wireErr(() => parseUdpDatagram(d.subarray(0, 5), "1.1.1.1", "2.2.2.2")) && wireErr(() => parseUdpDatagram(tooBig, "1.1.1.1", "2.2.2.2")) && wireErr(() => parseUdpDatagram(tooSmall, "1.1.1.1", "2.2.2.2")) && txt(parseUdpDatagram(longer, "1.1.1.1", "2.2.2.2").payload) === "ab"; });

// ── DNS ──
const Q = "1234 0100 0001 0000 0000 0000 07 6578616d706c65 03 636f6d 00 0001 0001";
const R_HEX = "00018180000100030000000003777777076578616d706c6503636f6d0000010001c00c000500010000012c000603776562c010c02d000100010000003c00045db8d822c010000f000100000e100009000a046d61696cc010";
const R = { id: 1, flags: { qr: true, rd: true, ra: true }, questions: [{ name: "www.example.com", type: "A" }], answers: [{ name: "www.example.com", type: "CNAME", ttl: 300, data: "web.example.com" }, { name: "web.example.com", type: "A", ttl: 60, data: "93.184.216.34" }, { name: "example.com", type: "MX", ttl: 3600, data: { preference: 10, exchange: "mail.example.com" } }] };
check("encodeDns: запрос A для example.com — канонические байты 1234 0100 0001 … 07 example 03 com 00 0001 0001", () => toHex(encodeDns({ id: 0x1234, flags: { rd: true }, questions: [{ name: "example.com", type: "A" }] })) === Q.replace(/\\s+/g, ""));
check("decodeDns: тот же запрос — id 0x1234, rd = true, один вопрос example.com типа A класса 1, ответов нет", () => { const m = decodeDns(hex(Q)); return m.id === 0x1234 && m.flags.rd === true && m.flags.qr === false && m.questions.length === 1 && m.questions[0].name === "example.com" && m.questions[0].type === "A" && m.questions[0].class === 1 && m.answers.length === 0; });
check("encodeDns: сжатие имён — ответ с CNAME, A и MX кодируется ровно в 88 байт с указателями c00c, c010, c02d (самый длинный общий суффикс)", () => { const b = encodeDns(R); return toHex(b) === R_HEX && b.length === 88; });
check("decodeDns: разбор сжатого ответа возвращает исходные имена, типы, TTL и данные записей", () => { const m = decodeDns(hex(R_HEX)); return m.answers[0].data === "web.example.com" && m.answers[1].name === "web.example.com" && m.answers[1].data === "93.184.216.34" && m.answers[1].ttl === 60 && m.answers[2].type === "MX" && m.answers[2].data.preference === 10 && m.answers[2].data.exchange === "mail.example.com" && m.answers[0].ttl === 300 && m.flags.qr && m.flags.ra; });
check("DNS: round trip для A, AAAA (2001:db8:0:0:0:0:0:1), CNAME, NS, MX и TXT; сжатие не меняет результат", () => { const m = { id: 7, flags: { qr: true, opcode: 0, aa: true, tc: false, rd: true, ra: true, rcode: 0 }, questions: [{ name: "a.test", type: "A", class: 1 }], answers: [{ name: "a.test", type: "A", class: 1, ttl: 1, data: "1.2.3.4" }, { name: "a.test", type: "AAAA", class: 1, ttl: 2, data: "2001:db8:0:0:0:0:0:1" }, { name: "b.a.test", type: "CNAME", class: 1, ttl: 3, data: "a.test" }, { name: "test", type: "NS", class: 1, ttl: 4, data: "ns.a.test" }, { name: "a.test", type: "MX", class: 1, ttl: 5, data: { preference: 20, exchange: "mx.test" } }, { name: "a.test", type: "TXT", class: 1, ttl: 6, data: ["v=spf1 -all", "второй"] }] }; return J(decodeDns(encodeDns(m))) === J(m); });
check("DNS: флаги qr, opcode = 2, aa, tc, rd, ra, rcode = 3 кодируются в слово 0x9783 и разбираются обратно", () => { const f = { qr: true, opcode: 2, aa: true, tc: true, rd: true, ra: true, rcode: 3 }; const b = encodeDns({ id: 1, flags: f, questions: [] }); const m = decodeDns(b); return b[2] === 0x97 && b[3] === 0x83 && J(m.flags) === J(f); });
check("encodeDns: метка длиннее 63 байт, пустая метка, неподдерживаемый тип → WireError; ровно 63 байта допустимо", () => wireErr(() => encodeDns({ id: 1, questions: [{ name: "a".repeat(64) + ".com", type: "A" }] })) && wireErr(() => encodeDns({ id: 1, questions: [{ name: "a..com", type: "A" }] })) && wireErr(() => encodeDns({ id: 1, questions: [], answers: [{ name: "a.com", type: "SRV", ttl: 1, data: "x" }] })) && encodeDns({ id: 1, questions: [{ name: "a".repeat(63) + ".com", type: "A" }] }).length > 63);
check("decodeDns: указатель на самого себя и цикл из двух указателей → WireError (не зависает); указатель вперёд → WireError", () => { const head = "0001 0100 0001 0000 0000 0000"; return wireErr(() => decodeDns(hex(head + "c00c 0001 0001"))) && wireErr(() => decodeDns(hex(head + "c00e c00c 0001 0001"))) && wireErr(() => decodeDns(hex(head + "c014 0001 0001 0000 0000"))); });
check("decodeDns: метка длиннее 63, оборванное имя, оборванный заголовок, неверная длина A-записи → WireError", () => { const head = "0001 0000 0001 0000 0000 0000"; return wireErr(() => decodeDns(hex("0001 0100"))) && wireErr(() => decodeDns(hex(head + "40" + "61".repeat(64) + "00 0001 0001"))) && wireErr(() => decodeDns(hex(head + "05 616263"))) && wireErr(() => decodeDns(hex("0001 8180 0000 0001 0000 0000 01 61 00 0001 0001 0000003c 0003 010203"))); });
check("decodeDns: любой строгий префикс корректного ответа → WireError (а не другая ошибка и не «успех»)", () => { const full = hex(R_HEX); for (let n = 0; n < full.length; n++) { try { decodeDns(full.subarray(0, n)); return false; } catch (e) { if (!(e instanceof WireError || e?.name === "WireError")) return false; } } return true; });
check("decodeDns: 3000 случайно испорченных сообщений — результат либо объект, либо WireError (никаких TypeError, RangeError и зависаний)", () => { const r = seeded(19), base = hex(R_HEX); for (let t = 0; t < 3000; t++) { const m = Uint8Array.from(base); for (let k = 0; k < 1 + Math.floor(r() * 4); k++) m[Math.floor(r() * m.length)] = Math.floor(r() * 256); try { const x = decodeDns(m); if (typeof x !== "object") return false; } catch (e) { if (!(e instanceof WireError || e?.name === "WireError")) return false; } } return true; });
check("decodeDns: неизвестный тип записи (99) — type = число, данные — байты; несовпадение длины данных и содержимого (MX, TXT) → WireError", () => { const m = decodeDns(hex("0001 8180 0000 0001 0000 0000 01 61 00 0063 0001 00000001 0002 abcd")); return m.answers[0].type === 99 && toHex(m.answers[0].data) === "abcd" && wireErr(() => decodeDns(hex("0001 8180 0000 0001 0000 0000 01 61 00 0010 0001 00000001 0003 05 6161"))); });

// ── HTTP ──
const REQ = "GET /index.html?q=1 HTTP/1.1\\r\\nHost: example.com\\r\\nAccept: text/html\\r\\nX-Dup: a\\r\\nx-dup:   b  \\r\\n\\r\\n";
const WIKI = "HTTP/1.1 200 OK\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n4\\r\\nWiki\\r\\n6\\r\\npedia \\r\\nE\\r\\nin \\r\\n\\r\\nchunks.\\r\\n0\\r\\n\\r\\n";
check("parseHttpMessage: запрос — метод, цель, версия, заголовки в нижнем регистре, повторные значения через «, », пробелы обрезаны", () => { const m = parseHttpMessage(REQ); return m.complete && m.kind === "request" && m.method === "GET" && m.target === "/index.html?q=1" && m.version === "1.1" && m.headers.host === "example.com" && m.headers["x-dup"] === "a, b" && m.body.length === 0 && m.rest.length === 0; });
check("parseHttpMessage: ответ с Content-Length — статус, причина, тело; следующее сообщение остаётся в rest", () => { const m = parseHttpMessage("HTTP/1.1 404 Not Found\\r\\nContent-Length: 5\\r\\n\\r\\nhelloNEXT"); return m.kind === "response" && m.status === 404 && m.reason === "Not Found" && txt(m.body) === "hello" && txt(m.rest) === "NEXT"; });
check("parseHttpMessage: пример разбиения на блоки из Википедии → тело «Wikipedia in \\\\r\\\\n\\\\r\\\\nchunks.»", () => { const m = parseHttpMessage(WIKI); return m.complete && txt(m.body) === "Wikipedia in \\r\\n\\r\\nchunks." && m.rest.length === 0; });
check("chunked: расширения блоков (;name=value), шестнадцатеричные размеры в любом регистре, трейлеры, остаток после сообщения", () => { const m = parseHttpMessage("HTTP/1.1 200 OK\\r\\nTransfer-Encoding: Chunked\\r\\n\\r\\nA;ext=1\\r\\n0123456789\\r\\n3\\r\\nabc\\r\\n0\\r\\nX-Sum: 7\\r\\n\\r\\nSTART"); return txt(m.body) === "0123456789abc" && m.trailers["x-sum"] === "7" && txt(m.rest) === "START"; });
check("неполные сообщения: каждый строгий префикс запроса, ответа с Content-Length и chunked-ответа → { complete: false } (не ошибка и не «готово»)", () => { for (const msg of [REQ, "HTTP/1.1 200 OK\\r\\nContent-Length: 5\\r\\n\\r\\nhello", WIKI, "POST /x HTTP/1.1\\r\\nContent-Length: 3\\r\\n\\r\\nabc"]) for (let n = 0; n < msg.length; n++) { const r = parseHttpMessage(msg.slice(0, n)); if (r.complete !== false) return false; } return true; });
check("ответы без тела: 204, 304 и 1xx не читают тело, всё остальное остаётся в rest", () => ["204 No Content", "304 Not Modified", "101 Switching Protocols"].every((s) => { const m = parseHttpMessage(\`HTTP/1.1 \${s}\\r\\nContent-Length: 10\\r\\n\\r\\nNEXT\`); return m.complete && m.body.length === 0 && txt(m.rest) === "NEXT"; }));
check("ответ без указания длины: тело — всё до конца соединения, closeDelimited = true; запрос без длины — без тела", () => { const a = parseHttpMessage("HTTP/1.0 200 OK\\r\\nServer: x\\r\\n\\r\\nbody until close"); const b = parseHttpMessage("GET / HTTP/1.1\\r\\nHost: h\\r\\n\\r\\n"); return a.complete && txt(a.body) === "body until close" && a.closeDelimited === true && b.body.length === 0 && !b.closeDelimited; });
check("ошибки заголовков: свёртка строк, пробел перед двоеточием, строка без двоеточия, неверное имя, голый LF → WireError", () => wireErr(() => parseHttpMessage("GET / HTTP/1.1\\r\\nA: b\\r\\n c\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("GET / HTTP/1.1\\r\\nHost : x\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("GET / HTTP/1.1\\r\\nHost x\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("GET / HTTP/1.1\\r\\n@bad: 1\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("GET / HTTP/1.1\\nHost: x\\r\\n\\r\\n")));
check("ошибки стартовой строки: нет версии, версия HTTP/2.0, статус из двух цифр, метод с пробелом → WireError", () => wireErr(() => parseHttpMessage("GET /\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("GET / HTTP/2.0\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("HTTP/1.1 20 OK\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("GE T / HTTP/1.1\\r\\n\\r\\n")));
check("защита от подмены запросов: Content-Length вместе с Transfer-Encoding, разные Content-Length, нецифровой или отрицательный Content-Length, Transfer-Encoding не «chunked» последним → WireError", () => wireErr(() => parseHttpMessage("POST / HTTP/1.1\\r\\nContent-Length: 3\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n0\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("POST / HTTP/1.1\\r\\nContent-Length: 3\\r\\nContent-Length: 4\\r\\n\\r\\nabc")) && wireErr(() => parseHttpMessage("POST / HTTP/1.1\\r\\nContent-Length: +3\\r\\n\\r\\nabc")) && wireErr(() => parseHttpMessage("POST / HTTP/1.1\\r\\nContent-Length: -1\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("POST / HTTP/1.1\\r\\nTransfer-Encoding: gzip, chunked\\r\\n\\r\\n0\\r\\n\\r\\n")) && wireErr(() => parseHttpMessage("POST / HTTP/1.1\\r\\nTransfer-Encoding: gzip\\r\\n\\r\\n")));
check("одинаковые Content-Length в нескольких заголовках допустимы (3, 3 → 3)", () => txt(parseHttpMessage("POST / HTTP/1.1\\r\\nContent-Length: 3\\r\\nContent-Length: 3\\r\\n\\r\\nabcdef").body) === "abc");
check("ошибки блоков: неверный размер (g, пустой, -1, +4, 0x4, слишком длинный), нет CRLF после данных → WireError", () => { const mk = (c) => \`HTTP/1.1 200 OK\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n\${c}\`; return ["g\\r\\nx\\r\\n0\\r\\n\\r\\n", "\\r\\n", "-1\\r\\nx\\r\\n", "+4\\r\\nabcd\\r\\n", "0x4\\r\\nabcd\\r\\n", "123456789\\r\\nx\\r\\n"].every((c) => wireErr(() => parseHttpMessage(mk(c)))) && wireErr(() => parseHttpMessage(mk("3\\r\\nabcXY0\\r\\n\\r\\n"))); });
check("chunked: 150 случайных тел, разбитых на блоки случайных размеров (с пустым телом), разбираются без потерь", () => { const r = seeded(23); for (let t = 0; t < 150; t++) { const body = Uint8Array.from({ length: Math.floor(r() * 300) }, () => Math.floor(r() * 256)); let msg = "HTTP/1.1 200 OK\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n"; const parts = []; for (let i = 0; i < body.length;) { const n = Math.min(body.length - i, 1 + Math.floor(r() * 50)); parts.push(body.subarray(i, i + n)); i += n; } const raw = [Buffer.from(msg, "latin1")]; for (const p of parts) raw.push(Buffer.from(p.length.toString(16) + "\\r\\n", "latin1"), Buffer.from(p), Buffer.from("\\r\\n", "latin1")); raw.push(Buffer.from("0\\r\\n\\r\\n", "latin1")); const m = parseHttpMessage(Buffer.concat(raw)); if (!m.complete || toHex(m.body) !== toHex(body)) return false; } return true; });
check("parseHttpMessage: 3000 случайно испорченных сообщений — результат либо объект, либо WireError", () => { const r = seeded(29), bases = [REQ, WIKI, "HTTP/1.1 200 OK\\r\\nContent-Length: 4\\r\\n\\r\\ndata"]; for (let t = 0; t < 3000; t++) { const b = Buffer.from(bases[t % 3], "latin1"); for (let k = 0; k < 1 + Math.floor(r() * 3); k++) b[Math.floor(r() * b.length)] = Math.floor(r() * 256); try { const x = parseHttpMessage(b); if (typeof x !== "object") return false; } catch (e) { if (!(e instanceof WireError || e?.name === "WireError")) return false; } } return true; });
check("заголовки: имена без учёта регистра, пустое значение допустимо, в объекте нет унаследованных свойств (заголовок __proto__ — обычный)", () => { const m = parseHttpMessage("GET / HTTP/1.1\\r\\nHOST: A\\r\\n__proto__: x\\r\\nEmpty:\\r\\n\\r\\n"); return m.headers.host === "A" && m.headers.empty === "" && m.headers["__proto__"] === "x" && Object.keys(m.headers).length === 3 && m.headers.toString === undefined; });

// ── Кеш ──
const D = (s) => Date.parse(s) / 1000, T0 = D("Sun, 06 Nov 1994 08:49:37 GMT");
const dec = (headers, extra = {}, opts) => cacheDecision({ status: 200, headers, requestTime: T0, responseTime: T0, now: T0, ...extra }, opts);
check("cacheDecision: возраст по RFC 9111 — Age 10, задержка ответа 1 с, Date на 2 с раньше получения: исходный возраст 11, спустя 28 с — 39; срок 60 → свежий", () => { const r = cacheDecision({ status: 200, headers: { "Cache-Control": "max-age=60", Date: "Sun, 06 Nov 1994 08:49:37 GMT", Age: "10" }, requestTime: T0 + 1, responseTime: T0 + 2, now: T0 + 30 }); return r.storable && r.currentAge === 39 && r.freshnessLifetime === 60 && r.fresh && !r.mustRevalidate; });
check("cacheDecision: «кажущийся возраст» больше Age (Date отстаёт от получения на 100 с) определяет исходный возраст", () => { const r = cacheDecision({ status: 200, headers: { "Cache-Control": "max-age=300", Date: "Sun, 06 Nov 1994 08:49:37 GMT", Age: "5" }, requestTime: T0 + 100, responseTime: T0 + 100, now: T0 + 100 }); return r.currentAge === 100 && r.fresh; });
check("cacheDecision: граница свежести — срок 60 с: при возрасте 59 — свежий, при 60 — устаревший (нужно строго больше)", () => dec({ "Cache-Control": "max-age=60" }, { now: T0 + 59 }).fresh === true && dec({ "Cache-Control": "max-age=60" }, { now: T0 + 60 }).fresh === false);
check("cacheDecision: Expires − Date как срок, если нет max-age; max-age имеет приоритет над Expires", () => { const h = { Date: "Sun, 06 Nov 1994 08:49:37 GMT", Expires: "Sun, 06 Nov 1994 09:49:37 GMT" }; return dec(h).freshnessLifetime === 3600 && dec({ ...h, "Cache-Control": "max-age=10" }).freshnessLifetime === 10 && dec({ ...h, Expires: "not a date" }).freshnessLifetime === 0; });
check("cacheDecision: эвристика 10 % от (Date − Last-Modified): изменено за 10 суток → срок 86400; только для кодов, кешируемых по умолчанию (200 да, 500 нет)", () => { const h = { Date: "Sun, 06 Nov 1994 08:49:37 GMT", "Last-Modified": "Fri, 27 Oct 1994 08:49:37 GMT" }; const a = dec(h), b = dec(h, { status: 500 }); return a.freshnessLifetime === 86400 && a.storable && !b.storable && b.freshnessLifetime === 0; });
check("cacheDecision: no-store — не сохранять; private для общего кеша — не сохранять (для личного — можно)", () => { const a = dec({ "Cache-Control": "no-store, max-age=60" }), b = dec({ "Cache-Control": "private, max-age=60" }, {}, { shared: true }), c = dec({ "Cache-Control": "private, max-age=60" }, {}, { shared: false }); return !a.storable && !a.fresh && !b.storable && c.storable && c.fresh; });
check("cacheDecision: no-cache — сохраняется, но всегда требует проверки (fresh = false, mustRevalidate = true); must-revalidate при устаревании", () => { const a = dec({ "Cache-Control": "no-cache, max-age=60" }, { now: T0 + 1 }), b = dec({ "Cache-Control": "max-age=5, must-revalidate" }, { now: T0 + 50 }), c = dec({ "Cache-Control": "max-age=5" }, { now: T0 + 50 }); return a.storable && !a.fresh && a.mustRevalidate && !b.fresh && b.mustRevalidate && !c.fresh && !c.mustRevalidate; });
check("cacheDecision: s-maxage действует только в общем кеше; неверный max-age (abc) — срок 0", () => { const h = { "Cache-Control": "max-age=10, s-maxage=100" }; return dec(h, {}, { shared: true }).freshnessLifetime === 100 && dec(h, {}, { shared: false }).freshnessLifetime === 10 && dec({ "Cache-Control": "max-age=abc" }).freshnessLifetime === 0 && dec({ "Cache-Control": "max-age=abc" }).fresh === false; });
check("cacheDecision: код 500 без явного срока не сохраняется; код 404 с max-age — сохраняется; имена заголовков — без учёта регистра; нет Date → берётся время получения", () => { const a = dec({}, { status: 500 }), b = dec({ "cache-control": "MAX-AGE=30" }, { status: 404, now: T0 + 10 }), c = cacheDecision({ status: 200, headers: { "CACHE-CONTROL": "max-age=30" }, requestTime: T0, responseTime: T0, now: T0 + 5 }); return !a.storable && b.storable && b.fresh && c.currentAge === 5 && c.fresh; });

console.log(\`\\nПройдено проверок: \${passed} из \${total}\`);
process.exitCode = passed === total ? 0 : 1;`, { filename: "check.mjs", collapsed: true }),
    code("text", `Пройдено проверок: 53 из 53`, { filename: "результат node check.mjs solution (Node.js 22.22.0)" }),
    code("text", `Пройдено проверок: 1 из 53`, { filename: "результат node check.mjs starter (заготовка)" }),
    h("Проверка самой проверки: «плохие» варианты"),
    code("text", `b01-checksum-no-carry-fold: Пройдено проверок: 47 из 53
b02-checksum-odd-not-padded: Пройдено проверок: 51 из 53
b03-ip-df-flag-wrong-bit: Пройдено проверок: 50 из 53
b04-ip-no-version-check: Пройдено проверок: 52 из 53
b05-ip-checksum-header-only-first-20: Пройдено проверок: 52 из 53
b06-udp-no-pseudo-header: Пройдено проверок: 49 из 53
b07-udp-zero-checksum-stays-zero: Пройдено проверок: 52 из 53
b08-udp-zero-checksum-invalid: Пройдено проверок: 52 из 53
b09-dns-no-compression: Пройдено проверок: 52 из 53
b10-dns-pointer-loop-unchecked: Пройдено проверок: 52 из 53
b11-dns-label-limit-64: Пройдено проверок: 52 из 53
b12-dns-flags-rd-bit: Пройдено проверок: 49 из 53
b13-dns-aaaa-leading-zeros: Пройдено проверок: 52 из 53
b14-http-chunk-size-decimal: Пройдено проверок: 49 из 53
b15-http-incomplete-throws: Пройдено проверок: 52 из 53
b16-http-te-and-cl-allowed: Пройдено проверок: 52 из 53
b17-http-obs-fold-allowed: Пройдено проверок: 52 из 53
b18-http-no-body-204: Пройдено проверок: 52 из 53
b19-http-duplicate-headers-last-wins: Пройдено проверок: 51 из 53
b20-cache-age-ignores-delay: Пройдено проверок: 52 из 53
b21-cache-fresh-when-equal: Пройдено проверок: 51 из 53
b22-cache-heuristic-50-percent: Пройдено проверок: 52 из 53
b23-cache-private-ignored: Пройдено проверок: 52 из 53
b24-cache-no-cache-fresh: Пройдено проверок: 52 из 53`, { filename: "результат check.mjs для вариантов с ошибками (из 53)" }),
    warn("Если `Content-Length` и `Transfer-Encoding` допускаются вместе, два узла цепочки (прокси и сервер) могут разойтись в том, где кончается запрос, — это основа атак «подмена HTTP-запросов». Строгий парсер **отвергает** такую двусмысленность, а не выбирает «правильный» заголовок."),
    tip("Корректность парсера проверяйте двумя «зеркалами»: каждый строгий префикс корректного сообщения должен давать «неполно» (или ошибку для бинарных форматов), а любая случайная порча — результат или `WireError`. Эти два цикла находят больше ошибок, чем десяток ручных примеров."),
  ],
};
