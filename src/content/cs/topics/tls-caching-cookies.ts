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

export const tlsCachingCookies: Topic = {
  id: "cs.tls-caching-cookies",
  slug: "tls-caching-cookies",
  domain: "cs",
  module: "networking",
  title: "TLS, кеширование и cookie: шифрование, свежесть и состояние клиента",
  titleEn: "TLS, Caching and Cookies: Encryption, Freshness and Client State",
  summary:
    "Тема объединяет три механизма, делающих веб безопасным и быстрым. TLS защищает соединение: шифрование, целостность и проверка сертификата (хеши, HMAC, AES-GCM, обмен ключами и подписи; цепочка доверия, имя в SAN, SNI, ALPN, возобновление сессии). HTTP-кеширование (`Cache-Control`, `ETag`, `Vary`) экономит запросы и байты. Cookie хранят состояние клиента (атрибуты `Secure`, `HttpOnly`, `SameSite`, префиксы, сессия против токена). Всё проверено запуском на локальном интерфейсе с реальным OpenSSL: рукопожатие TLS 1.3 занимает около 2 RTT от начала соединения, TLS 1.2 — около 3 (разница ≈ 1 RTT, 125 мс против 85 мс при RTT 40 мс); модель кеша сократила передачу тела с 221 500 до 97 106 байт (−56 %); неверное имя, неизвестный центр, просроченный сертификат и подмена токена отвергаются.",
  minutes: 120,
  prerequisites: ["cs.dns-http", "cs.network-model-ip-tcp"],
  tags: ["TLS", "сертификат", "хеш", "HMAC", "AES-GCM", "SNI", "ALPN", "Cache-Control", "ETag", "Vary", "cookie", "SameSite", "JWT"],
  keyConcepts: [
    { term: "Шифрование ≠ достаточно", text: "AES-256-GCM вернул шифртекст той же длины (44 байта) и тег 16 байт; изменение одного бита — ошибка проверки. Без аутентификации (CTR) подмена бита проходит молча: `сумма=100` → `сумма=101`. Повтор nonce раскрыл XOR открытых текстов." },
    { term: "Доверие — цепочка и имя", text: "Сертификат принят, если подпись проверена по доверенному центру и имя входит в SAN. Неверное имя — `ERR_TLS_CERT_ALTNAME_INVALID`, неизвестный центр — `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, просроченный — `error 10 … certificate has expired`." },
    { term: "TLS стоит кругов RTT", text: "Канал с RTT 40 мс: до готовности шифрованного соединения TLS 1.3 ≈ 85 мс (TCP + 1 RTT), TLS 1.2 ≈ 125 мс (TCP + 2 RTT). Возобновление сессии RTT не экономит (84 мс), но убирает цепочку сертификатов: около 1330 байт от сервера вместо 1850." },
    { term: "Наблюдатель видит метаданные", text: "На проводе открыты тип записи 22 (рукопожатие), версия и имя сервера (SNI); пароль из запроса не найден, записи данных имеют тип 23." },
    { term: "Кеш: свежесть и проверка", text: "Файл с хешем в имени и `max-age=1 год, immutable` — 1 запрос за 30 суток; `no-cache` + `ETag` — каждый раз проверка с ответом `304` (0 байт тела); `no-store` — каждый раз по сети. Итог на сценарии: 97 106 байт вместо 221 500." },
    { term: "Cookie: три флага защиты", text: "При междоменном `fetch` со страницы `evil.test` ни одна из cookie сайта `app.example.com` не отправляется, а cookie с `SameSite=None; Secure` — отправляется; `Secure` не отправляется по HTTP; `HttpOnly` скрыт от скриптов; `__Host-` требует `Secure`, `Path=/` и отсутствия `Domain`." },
    { term: "Токен подписан, но не зашифрован", text: "JWT с подменённой ролью отвергнут (подпись неверна), `alg=none` отвергнут, но полезная нагрузка читается любым. Идентификатор сессии — 128 бит случайности, при входе выдаётся новый (защита от фиксации сессии)." },
  ],
  sections: [
    section("definition", [
      def("TLS", "Протокол защиты транспортного уровня: даёт конфиденциальность (шифрование), целостность (обнаружение изменений) и аутентификацию сервера (а при необходимости и клиента). HTTPS — это HTTP поверх TLS.", "Transport Layer Security"),
      def("Криптографический хеш", "Функция, превращающая данные в короткий отпечаток фиксированной длины: необратима, а найти две разные строки с одним хешем практически невозможно (SHA-256 — 32 байта).", "cryptographic hash"),
      def("MAC / HMAC", "Код аутентичности сообщения: хеш с секретным ключом. Проверяет и целостность, и то, что автор знает ключ.", "message authentication code"),
      def("Шифрование с аутентификацией (AEAD)", "Режим шифрования, который одновременно шифрует данные и вычисляет тег целостности (AES-GCM, ChaCha20-Poly1305).", "authenticated encryption"),
      def("Сертификат X.509", "Подписанная центром сертификации привязка открытого ключа к имени (поле SAN) с указанием срока действия.", "X.509 certificate"),
      def("SNI и ALPN", "Расширения TLS: SNI передаёт имя сервера до выбора сертификата, ALPN согласует протокол прикладного уровня (`h2`, `http/1.1`).", "SNI / ALPN"),
      def("Кеш HTTP", "Хранилище ответов (в браузере, прокси, CDN), позволяющее не обращаться к источнику, пока ответ свеж, и проверять его условным запросом, когда он устарел.", "HTTP cache"),
      def("ETag", "Идентификатор версии представления ресурса; клиент отправляет его в `If-None-Match`, и сервер отвечает `304`, если версия не изменилась.", "entity tag"),
      def("Cookie", "Небольшая запись «имя = значение», которую сервер просит сохранить (`Set-Cookie`) и которую браузер отправляет назад в заголовке `Cookie` по правилам домена, пути и атрибутов.", "cookie"),
      def("SameSite", "Атрибут cookie, определяющий, отправляется ли он в междусайтовых запросах: `Strict`, `Lax` (по умолчанию в современных браузерах) или `None` (только вместе с `Secure`).", "SameSite"),
    ]),

    section("why", [
      h("Три слоя «доверия и скорости»"),
      p("Любой запрос в браузере проходит через шифрование (кто может читать и подменять данные), кеширование (нужно ли вообще идти в сеть) и состояние клиента (кто делает запрос). Ошибки здесь — и утечки данных, и «залипшие» страницы, и взломанные сессии."),
      ul(
        "**Безопасность:** без TLS пароли и cookie видны любому узлу на пути; без проверки сертификата шифрование не защищает от подмены сервера (в замере `rejectUnauthorized: false` принимает соединение с неверным именем).",
        "**Производительность:** TLS добавляет круги RTT (1 у TLS 1.3, 2 у TLS 1.2); кеширование убирает запросы целиком: в нашем сценарии 56 % меньше байт.",
        "**Корректность:** неверные заголовки кеширования приводят к «после деплоя пользователи видят старую версию» или к тому, что одному пользователю показывают данные другого.",
        "**Идентификация:** cookie и токены — основа входа; их атрибуты определяют, переживёт ли сессия XSS, CSRF и перехват.",
        "**Эксплуатация:** истёкшие сертификаты — одна из частых причин сбоев; нужно понимать, как они выдаются, проверяются и продлеваются.",
      ),
      tip("Правило: шифруйте (TLS), проверяйте (сертификат и подпись), не доверяйте (проверяйте вход), кешируйте только то, что одинаково для всех, а персональное помечайте `private` или `no-store`."),
    ]),

    section("mental-model", [
      h("Что даёт TLS и что нет"),
      diagram(
        `
        клиент                                              сервер
          │ ClientHello: версии, шифры, SNI, ALPN, ключевая доля ─►│
          │◄─ ServerHello + сертификат + подпись + Finished ───────│   1 RTT (TLS 1.3)
          │ Finished ──────────────────────────────────────────────►│
          │◄═════════ данные приложения, зашифрованные ═══════════►│

        защищено: содержимое запросов и ответов (шифрование + тег целостности), подлинность сервера (сертификат)
        видно наблюдателю: IP-адреса, порты, объём и время передачи, имя сервера в SNI (если не включено шифрование ClientHello)
        `,
        "TLS 1.3 завершает согласование за один круг RTT; TLS 1.2 требует двух. После этого обе стороны имеют общий симметричный ключ, полученный обменом Диффи — Хеллмана.",
      ),
      h("Цепочка доверия"),
      diagram(
        `
        корневой центр сертификации (в списке доверенных у ОС/браузера)
              │ подписывает
              ▼
        промежуточный центр ─ подписывает ─► сертификат сервера: «ключ K принадлежит app.test», срок действия, SAN

        клиент проверяет: подпись каждого звена → цепочка приходит к доверенному корню → имя из URL есть в SAN → срок не истёк
        `,
        "Любое звено может подвести: неверная подпись, неизвестный центр, имя не совпадает, срок истёк — соединение должно быть отвергнуто.",
      ),
      h("Кеш: когда не ходить в сеть"),
      diagram(
        `
        запрос ──► есть в кеше? ──нет──► сеть ──► сохранить (если разрешено)
                      │да
                      ▼
                  свежий? ──да──► отдать из кеша (0 запросов)
                      │нет/no-cache
                      ▼
            условный запрос: If-None-Match: "v1" ──► 304 (0 байт тела, обновить срок)  или  200 (новая версия)
        `,
        "Два вопроса: «не слишком ли устарел ответ?» (свежесть, `max-age`) и «изменился ли ресурс?» (валидация, `ETag`).",
      ),
      insight("Кеширование, cookie и TLS — разные способы ответить на один вопрос: можно ли доверять тому, что у меня уже есть (ответ, личность, ключ)? Срок действия, подпись и проверка версии — механизмы ограничения доверия во времени."),
    ]),

    section("technical", [
      h("Криптографические примитивы"),
      table(
        ["Примитив", "Что даёт", "Примеры", "Чего не даёт"],
        [
          ["Хеш", "Отпечаток данных, проверка неизменности", "SHA-256 (32 байта)", "Секретности и подлинности автора"],
          ["MAC (HMAC)", "Целостность + знание общего ключа", "HMAC-SHA256", "Не отличает двух владельцев ключа"],
          ["Симметричное шифрование (AEAD)", "Конфиденциальность и целостность", "AES-GCM, ChaCha20-Poly1305", "Безопасно только при уникальном nonce на ключ"],
          ["Обмен ключами", "Общий секрет без передачи по сети", "ECDH (P-256, X25519)", "Подлинности собеседника без сертификата или подписи"],
          ["Цифровая подпись", "Подлинность автора и целостность", "Ed25519, ECDSA, RSA-PSS", "Конфиденциальности"],
          ["Медленные хеши паролей", "Защита хранимых паролей от перебора", "scrypt, Argon2, bcrypt", "Скорость — это недостаток для паролей"],
        ],
        "Основные криптографические примитивы",
      ),
      ul(
        "**Не придумывайте криптографию:** используйте проверенные библиотеки и режимы; ошибки (повтор nonce, отсутствие проверки тега, свой «шифр») ломают защиту, хотя всё «выглядит» зашифрованным.",
        "**Случайность:** секреты (ключи, идентификаторы сессий, nonce) берут из криптографического генератора ОС (`crypto.randomBytes`), а не из `Math.random`.",
        "**Пароли:** хранят не пароль и не быстрый хеш, а результат медленной функции с уникальной солью.",
      ),
      h("TLS: что согласуется и как проверяется"),
      ul(
        "**Версии:** TLS 1.3 (основная), TLS 1.2 (ещё встречается); SSL и TLS 1.0/1.1 устарели и небезопасны.",
        "**Наборы шифров:** в TLS 1.3 только AEAD (например, `TLS_AES_256_GCM_SHA384`), обмен ключами всегда эфемерный (прямая секретность: компрометация долговременного ключа не раскрывает прошлый трафик).",
        "**Сертификат:** проверяются подпись цепочки, срок действия, назначение (`serverAuth`), имя (SAN; поле CN устарело), отзыв (OCSP, списки отзыва).",
        "**SNI** позволяет одному IP-адресу обслуживать много имён; **ALPN** выбирает `h2` или `http/1.1`; **возобновление сессии** по билету экономит передачу сертификата.",
        "**HSTS** (`Strict-Transport-Security`) заставляет браузер всегда использовать HTTPS для домена на указанный срок.",
      ),
      h("HTTP-кеширование: директивы"),
      table(
        ["Заголовок и директива", "Смысл"],
        [
          ["`Cache-Control: max-age=N`", "Ответ свеж `N` секунд; повторных запросов не нужно"],
          ["`public` / `private`", "Можно хранить в общих кешах (CDN, прокси) / только в кеше конкретного пользователя"],
          ["`no-cache`", "Хранить можно, но каждый раз проверять условным запросом"],
          ["`no-store`", "Не сохранять нигде (персональные и секретные данные)"],
          ["`immutable`", "Ресурс не изменится за срок свежести; не проверять даже при обновлении страницы"],
          ["`ETag` + `If-None-Match`", "Проверка версии: `304 Not Modified` без тела"],
          ["`Last-Modified` + `If-Modified-Since`", "Проверка по времени (менее точная)"],
          ["`Vary: Accept-Language`", "Ответ зависит от указанных заголовков запроса: для разных значений — разные записи кеша"],
        ],
        "Основные директивы кеширования",
      ),
      h("Cookie и состояние"),
      table(
        ["Атрибут", "Что делает", "От чего защищает"],
        [
          ["`Secure`", "Отправляется только по HTTPS", "Перехват в открытой сети"],
          ["`HttpOnly`", "Недоступен `document.cookie`", "Кража сессии через XSS"],
          ["`SameSite=Lax/Strict`", "Не отправляется в междусайтовых запросах (Lax — кроме переходов GET по ссылке)", "CSRF"],
          ["`Domain`, `Path`", "Область действия (поддомены и путь)", "Утечку на лишние части сайта"],
          ["`Max-Age` / `Expires`", "Срок жизни; без них — до закрытия сессии браузера", "Бесконечное хранение"],
          ["`__Host-`, `__Secure-`", "Префиксы: браузер проверяет атрибуты при установке", "Подмену cookie поддоменом"],
        ],
        "Атрибуты cookie",
      ),
      ul(
        "**Сессия на сервере:** cookie содержит только случайный идентификатор (128 бит); состояние хранится на сервере; при входе выдаётся новый идентификатор (против фиксации сессии).",
        "**Токен без состояния (JWT):** подписанные данные в cookie или заголовке; сервер проверяет подпись и срок; отозвать до истечения сложнее; нагрузка не зашифрована.",
        "**Лимиты:** до 4096 байт на cookie; cookie отправляются с **каждым** запросом на подходящий адрес: большие cookie замедляют загрузку.",
      ),
    ]),

    section("syntax", [
      annotated(
        "http",
        `Cache-Control: public, max-age=31536000, immutable
Cache-Control: no-cache
Cache-Control: private, no-store
ETag: "3f9a1c"
If-None-Match: "3f9a1c"
Vary: Accept-Language
Set-Cookie: sid=9f2c…; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
Cookie: sid=9f2c…
Strict-Transport-Security: max-age=31536000; includeSubDomains`,
        [
          { line: 1, text: "Неизменяемый файл с хешем в имени: хранить год и не проверять." },
          { line: 2, text: "`no-cache` — можно хранить, но перед использованием проверять (подходит для HTML)." },
          { line: 3, text: "Персональные данные: только кеш пользователя и без сохранения." },
          { line: 4, text: "`ETag` — версия ресурса, отправляется сервером." },
          { line: 5, text: "`If-None-Match` — клиент спрашивает: «версия всё ещё эта?»; ответ `304` без тела." },
          { line: 6, text: "`Vary` — кеш различает представления по заголовку `Accept-Language`." },
          { line: 7, text: "Cookie сессии: `HttpOnly` скрывает от скриптов, `Secure` — только HTTPS, `SameSite=Lax` — защита от CSRF, `Max-Age` — срок жизни." },
          { line: 8, text: "Браузер возвращает cookie заголовком `Cookie`." },
          { line: 9, text: "HSTS: год обязательного HTTPS для домена и поддоменов." },
        ],
        "Заголовки кеширования, cookie и HSTS",
      ),
    ]),

    section("minimal-example", [
      h("Примитивы: хеш, MAC, AEAD, обмен ключами, подпись"),
      code("js", `// Криптографические примитивы на практике (Node.js, OpenSSL): хеш, MAC, шифрование с аутентификацией, ключевой обмен, подпись, медленные хеши паролей
import crypto from "node:crypto";
const hex = (b) => Buffer.from(b).toString("hex");

// 1. хеш: тестовый вектор FIPS 180 / NIST
const h = crypto.createHash("sha256").update("abc").digest("hex");
console.log("SHA-256(\\"abc\\") =", h);
console.log("совпадает с тестовым вектором NIST ba7816bf…20015ad:", h === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" ? "да" : "нет");
console.log("длина SHA-256:", h.length / 2, "байт; изменение одного бита входа меняет в среднем половину битов:", (() => {
  let diff = 0; const N = 200;
  for (let i = 0; i < N; i++) { const a = crypto.createHash("sha256").update(Buffer.from([i, 1, 2, 3])).digest(), b = crypto.createHash("sha256").update(Buffer.from([i, 1, 2, 3 ^ 1])).digest(); for (let k = 0; k < 32; k++) { let x = a[k] ^ b[k]; while (x) { diff += x & 1; x >>= 1; } } }
  const avg = diff / N; return (avg > 118 && avg < 138) ? "да (около 128 из 256)" : "нет";
})());

// 2. HMAC: тестовый вектор RFC 4231 (случай 2)
const mac = crypto.createHmac("sha256", "Jefe").update("what do ya want for nothing?").digest("hex");
console.log("\\nHMAC-SHA256(\\"Jefe\\", \\"what do ya want for nothing?\\") =", mac);
console.log("совпадает с вектором RFC 4231:", mac === "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843" ? "да" : "нет");
console.log("сравнение MAC за постоянное время — crypto.timingSafeEqual:", crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(mac)));

// 3. AES-256-GCM: шифрование с проверкой целостности
const key = crypto.createHash("sha256").update("демонстрационный ключ").digest();
const nonce = Buffer.alloc(12, 7);
function enc(k, n, text) { const c = crypto.createCipheriv("aes-256-gcm", k, n); const ct = Buffer.concat([c.update(text, "utf8"), c.final()]); return { ct, tag: c.getAuthTag() }; }
function dec(k, n, ct, tag) { const d = crypto.createDecipheriv("aes-256-gcm", k, n); d.setAuthTag(tag); return Buffer.concat([d.update(ct), d.final()]).toString("utf8"); }
const m = enc(key, nonce, "перевести 100 рублей Анне");
console.log("\\nAES-256-GCM: шифртекст", m.ct.length, "байт (равен длине открытого текста в UTF-8:", Buffer.byteLength("перевести 100 рублей Анне"), "), тег", m.tag.length, "байт");
console.log("расшифровка с верным тегом:", dec(key, nonce, m.ct, m.tag));
const tampered = Buffer.from(m.ct); tampered[10] ^= 1;
try { dec(key, nonce, tampered, m.tag); console.log("подмена не обнаружена!"); } catch (e) { console.log("изменён один бит шифртекста → расшифровка отвергнута:", e.message); }
console.log("без аутентификации (режим CTR) подмена бита проходит молча:", (() => { const c = crypto.createCipheriv("aes-256-ctr", key, Buffer.alloc(16, 1)); const ct = Buffer.concat([c.update("сумма=100"), c.final()]); ct[ct.length - 1] ^= 0x01; const d = crypto.createDecipheriv("aes-256-ctr", key, Buffer.alloc(16, 1)); return JSON.stringify(Buffer.concat([d.update(ct), d.final()]).toString()); })());

// 4. повтор nonce с одним ключом раскрывает XOR открытых текстов
const p1 = Buffer.from("TRANSFER 100 TO ANNA, ACCT 4111"), p2 = Buffer.from("TRANSFER 999 TO BORIS, ACCT 77!");   // одинаковая длина — 31 байт
const n = Buffer.alloc(16, 9);
const e1 = crypto.createCipheriv("aes-256-ctr", key, n).update(p1), e2 = crypto.createCipheriv("aes-256-ctr", key, n).update(p2);
const x1 = Buffer.from(e1.map((b, i) => b ^ e2[i])), x2 = Buffer.from(p1.map((b, i) => b ^ p2[i]));
console.log("\\nповтор nonce: XOR двух шифртекстов равен XOR открытых текстов (ключа не знаем):", x1.equals(x2) ? "да" : "нет");
const recovered = Buffer.from(x1.map((b, i) => b ^ p1[i]));          // зная первое сообщение, получаем второе без ключа
console.log("зная первое сообщение, атакующий восстановил второе:", JSON.stringify(recovered.toString()));

// 5. обмен ключами Диффи — Хеллмана на кривой P-256
const alice = crypto.createECDH("prime256v1"), bob = crypto.createECDH("prime256v1");
const ap = alice.generateKeys(), bp = bob.generateKeys();
const s1 = alice.computeSecret(bp), s2 = bob.computeSecret(ap);
console.log("\\nECDH P-256: открытый ключ", ap.length, "байт (несжатая точка), общий секрет", s1.length, "байт, обе стороны получили одинаковый:", s1.equals(s2) ? "да" : "нет");
console.log("секрет не передавался по сети; наблюдатель видит только открытые ключи");

// 6. подпись Ed25519
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const sig = crypto.sign(null, Buffer.from("документ"), privateKey);
console.log("\\nEd25519: подпись", sig.length, "байта; проверка верного документа:", crypto.verify(null, Buffer.from("документ"), publicKey, sig), "; изменённого:", crypto.verify(null, Buffer.from("документ."), publicKey, sig));

// 7. хранение паролей: быстрый хеш против медленного
const t0 = process.hrtime.bigint(); for (let i = 0; i < 20000; i++) crypto.createHash("sha256").update("password" + i).digest(); const fast = Number(process.hrtime.bigint() - t0) / 20000;
const t1 = process.hrtime.bigint(); for (let i = 0; i < 5; i++) crypto.scryptSync("password" + i, "salt-salt-salt", 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }); const slow = Number(process.hrtime.bigint() - t1) / 5;
console.error(\`SHA-256: \${(fast / 1000).toFixed(2)} мкс на пароль, scrypt N=2^15: \${(slow / 1e6).toFixed(1)} мс на пароль\`);
console.log("\\nперебор паролей: scrypt (N = 2^15) медленнее SHA-256 более чем в 10 000 раз:", slow > 10000 * fast ? "да" : "нет");
const salt1 = crypto.randomBytes(16), salt2 = crypto.randomBytes(16);
console.log("одинаковые пароли с разными солями дают разные хеши:", !crypto.scryptSync("pw", salt1, 32, { N: 1024 }).equals(crypto.scryptSync("pw", salt2, 32, { N: 1024 })) ? "да" : "нет");
console.log("crypto.randomBytes(16) — 16 непредсказуемых байт из генератора ОС; Math.random() для секретов непригоден");`, { filename: "01-crypto.mjs", collapsed: true }),
      code("text", `SHA-256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
совпадает с тестовым вектором NIST ba7816bf…20015ad: да
длина SHA-256: 32 байт; изменение одного бита входа меняет в среднем половину битов: да (около 128 из 256)

HMAC-SHA256("Jefe", "what do ya want for nothing?") = 5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843
совпадает с вектором RFC 4231: да
сравнение MAC за постоянное время — crypto.timingSafeEqual: true

AES-256-GCM: шифртекст 44 байт (равен длине открытого текста в UTF-8: 44 ), тег 16 байт
расшифровка с верным тегом: перевести 100 рублей Анне
изменён один бит шифртекста → расшифровка отвергнута: Unsupported state or unable to authenticate data
без аутентификации (режим CTR) подмена бита проходит молча: "сумма=101"

повтор nonce: XOR двух шифртекстов равен XOR открытых текстов (ключа не знаем): да
зная первое сообщение, атакующий восстановил второе: "TRANSFER 999 TO BORIS, ACCT 77!"

ECDH P-256: открытый ключ 65 байт (несжатая точка), общий секрет 32 байт, обе стороны получили одинаковый: да
секрет не передавался по сети; наблюдатель видит только открытые ключи

Ed25519: подпись 64 байта; проверка верного документа: true ; изменённого: false

перебор паролей: scrypt (N = 2^15) медленнее SHA-256 более чем в 10 000 раз: да
одинаковые пароли с разными солями дают разные хеши: да
crypto.randomBytes(16) — 16 непредсказуемых байт из генератора ОС; Math.random() для секретов непригоден`, { filename: "Node.js 22 (OpenSSL 3.5): тестовые векторы и свойства примитивов" }),
      ul(
        "**Хеш и MAC** воспроизводят опубликованные тестовые векторы: SHA-256(`abc`) = `ba7816bf…20015ad` (NIST), HMAC-SHA256(`Jefe`, …) = `5bdcc146…ec3843` (RFC 4231). Один изменённый бит входа меняет около половины битов хеша (примерно 128 из 256).",
        "**AES-256-GCM:** шифртекст — 44 байта (столько же, сколько в UTF-8 открытый текст), тег — 16 байт; изменённый бит — `Unsupported state or unable to authenticate data`. В режиме CTR без аутентификации тот же приём незаметен: `сумма=100` превращается в `сумма=101`.",
        "**Повтор nonce** с тем же ключом: XOR двух шифртекстов равен XOR открытых текстов; зная одно сообщение, атакующий восстановил второе без ключа.",
        "**ECDH P-256:** открытый ключ — 65 байт, общий секрет — 32 байта, обе стороны получили одинаковый, не передавая его по сети. **Ed25519:** подпись 64 байта; верный документ проходит, изменённый — нет.",
        "**Пароли:** SHA-256 — около 2 мкс на попытку, scrypt (N = 2¹⁵) — около 107 мс: разница в десятки тысяч раз; одинаковые пароли с разными солями дают разные хеши.",
      ),
      h("TLS: сертификаты, проверки, версии, ALPN, SNI"),
      code("js", `// TLS на локальном интерфейсе: удостоверяющий центр, сертификаты (OpenSSL), проверка цепочки и имени, версии, ALPN, SNI, возобновление сессии
import tls from "node:tls";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "devdock-pki-"));
const sh = (...args) => execFileSync("openssl", args, { cwd: dir, stdio: ["ignore", "pipe", "pipe"] }).toString();
sh("ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", "ca.key");
sh("req", "-x509", "-new", "-key", "ca.key", "-sha256", "-days", "365", "-subj", "/CN=Demo Root CA", "-out", "ca.pem");
function issue(name, san, caKey = "ca.key", caPem = "ca.pem", days = "90") {
  sh("ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", name + ".key");
  sh("req", "-new", "-key", name + ".key", "-subj", "/CN=" + name, "-out", name + ".csr");
  fs.writeFileSync(path.join(dir, name + ".cnf"), \`subjectAltName=\${san}\\nbasicConstraints=CA:FALSE\\nkeyUsage=digitalSignature\\nextendedKeyUsage=serverAuth\\n\`);
  sh("x509", "-req", "-in", name + ".csr", "-CA", caPem, "-CAkey", caKey, "-CAcreateserial", "-days", days, "-sha256", "-extfile", name + ".cnf", "-out", name + ".pem");
}
issue("app.test", "DNS:app.test,DNS:*.app.test,IP:127.0.0.1");
issue("api.test", "DNS:api.test");
sh("ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", "rogue.key");
sh("req", "-x509", "-new", "-key", "rogue.key", "-sha256", "-days", "365", "-subj", "/CN=Rogue CA", "-out", "rogue.pem");
issue("evil.test", "DNS:app.test", "rogue.key", "rogue.pem");
const read = (f) => fs.readFileSync(path.join(dir, f));
const ca = read("ca.pem");
const ctx = (name) => ({ key: read(name + ".key"), cert: read(name + ".pem") });

function listen(opts, onConn = (s) => s.end("pong")) {
  const srv = tls.createServer(opts, onConn); srv.on("tlsClientError", () => {});
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r(srv)));
}
function connect(port, opts = {}) {
  return new Promise((resolve) => {
    const s = tls.connect({ port, host: "127.0.0.1", ca, servername: "app.test", ...opts });
    let data = ""; s.on("data", (d) => (data += d));
    s.once("secureConnect", () => resolve({ s, ok: true }));
    s.once("error", (e) => resolve({ ok: false, code: e.code, message: e.message }));
  });
}
const first = await listen({ ...ctx("app.test"), ALPNProtocols: ["h2", "http/1.1"] });
const port = first.address().port;

// 1. успешное соединение и разбор сертификата
let r = await connect(port);
const cert = r.s.getPeerCertificate();
const x = new (await import("node:crypto")).X509Certificate(r.s.getPeerCertificate(true).raw);
console.log("1) соединение с проверкой: протокол", r.s.getProtocol(), "; шифр", r.s.getCipher().name, "; сертификат принят:", r.s.authorized);
console.log("   субъект:", x.subject, "| издатель:", x.issuer, "| SAN:", x.subjectAltName);
console.log("   ключ сертификата:", x.publicKey.asymmetricKeyType, x.publicKey.asymmetricKeyDetails.namedCurve, "| срок действия:", Math.round((new Date(x.validTo) - new Date(x.validFrom)) / 86400000), "суток");
r.s.destroy();

// 2. неверное имя, неизвестный центр, подменный центр
r = await connect(port, { servername: "other.test" });
console.log("\\n2) имя не совпадает (other.test):", r.code);
r = await connect(port, { ca: undefined });
console.log("   центр не в списке доверенных:", r.code);
const rogue = await listen(ctx("evil.test"));
r = await connect(rogue.address().port);
console.log("   сертификат выдан другим центром (Rogue CA) для того же имени:", r.code);
rogue.close();
r = await connect(port, { servername: "other.test", rejectUnauthorized: false });
console.log("   с отключённой проверкой (rejectUnauthorized: false) соединение с неверным именем «успешно»: authorized =", r.s.authorized, ", причина: «" + String(r.s.authorizationError) + "» — защиты от подмены нет");
r.s.destroy();

// 3. срок действия: проверка «на дату» утилитой openssl verify
const nowSec = Math.floor(Date.now() / 1000);
const check = (at) => { try { return sh("verify", "-CAfile", "ca.pem", "-attime", String(at), "app.test.pem").trim(); } catch (e) { return (e.stdout.toString() + e.stderr.toString()).trim().split("\\n").filter((l) => /error \\d+ at/.test(l)).join("; "); } };
console.log("\\n3) срок действия сертификата 90 суток; проверка openssl verify:");
console.log("   сегодня:", check(nowSec));
console.log("   через 100 суток:", check(nowSec + 100 * 86400));

// 4. версии протокола
const v13 = await listen({ ...ctx("app.test"), minVersion: "TLSv1.3" });
const v12 = await listen({ ...ctx("app.test"), maxVersion: "TLSv1.2" });
r = await connect(v13.address().port); const a = r.s.getProtocol() + " / " + r.s.getCipher().name; r.s.destroy();
r = await connect(v12.address().port); const b = r.s.getProtocol() + " / " + r.s.getCipher().name; r.s.destroy();
r = await connect(v13.address().port, { maxVersion: "TLSv1.2" });
console.log("\\n4) сервер только TLS 1.3 →", a, "; сервер до TLS 1.2 →", b, "; клиент до 1.2 к серверу только 1.3 →", r.ok ? "соединение" : "ошибка " + r.code);
v13.close(); v12.close();

// 5. ALPN и SNI
r = await connect(port, { ALPNProtocols: ["http/1.1"] }); const al1 = r.s.alpnProtocol; r.s.destroy();
r = await connect(port, { ALPNProtocols: ["h2", "http/1.1"] }); const al2 = r.s.alpnProtocol; r.s.destroy();
console.log("\\n5) ALPN: клиент предлагает [http/1.1] →", al1, "; предлагает [h2, http/1.1] →", al2, "(сервер выбирает общий протокол)");
const sni = await listen({ SNICallback: (name, cb) => cb(null, tls.createSecureContext(name === "api.test" ? ctx("api.test") : ctx("app.test"))) });
const cn = async (servername) => { const q = await connect(sni.address().port, { servername }); const c = q.ok ? q.s.getPeerCertificate().subject.CN : q.code; q.ok && q.s.destroy(); return c; };
console.log("   SNI: клиент просит app.test →", await cn("app.test"), "; api.test →", await cn("api.test"), "(один IP и порт, два сертификата)");
sni.close();

// 6. возобновление сессии
let sess = null;
const c1 = tls.connect({ port, host: "127.0.0.1", ca, servername: "app.test" }); c1.on("session", (s) => (sess = s)); c1.on("error", () => {});
await new Promise((res) => c1.once("secureConnect", res)); await new Promise((res) => setTimeout(res, 100)); c1.destroy();
r = await connect(port, { session: sess });
console.log("\\n6) возобновление сессии по билету: получен билет:", !!sess, "; повторное соединение использует сессию:", r.s.isSessionReused());
r.s.destroy();

// 7. что видит наблюдатель на проводе
const captured = []; 
const spy = net.createServer((c) => { const u = net.connect(port, "127.0.0.1"); c.on("data", (d) => { captured.push(d); u.write(d); }); u.on("data", (d) => c.write(d)); c.on("close", () => u.destroy()); u.on("close", () => c.destroy()); c.on("error", () => {}); u.on("error", () => {}); });
await new Promise((res) => spy.listen(0, "127.0.0.1", res));
const sock = tls.connect({ port: spy.address().port, host: "127.0.0.1", ca, servername: "app.test" });
await new Promise((res) => sock.once("secureConnect", res));
sock.write("GET /?password=hunter2-секрет HTTP/1.1\\r\\n\\r\\n"); await new Promise((res) => setTimeout(res, 150)); sock.destroy();
const all = Buffer.concat(captured);
console.log("\\n7) наблюдатель между клиентом и сервером видит:");
console.log("   первая запись — тип", all[0], "(22 = handshake), версия записи 0x" + all.readUInt16BE(1).toString(16), "; имя сервера из SNI открыто:", all.includes("app.test") ? "да" : "нет");
console.log("   пароль из запроса в потоке не найден (данные зашифрованы):", !all.includes("hunter2") && !all.includes(Buffer.from("секрет")) ? "да" : "нет");
console.log("   записи прикладных данных имеют тип 23:", (() => { let o = 0, found = false; while (o + 5 <= all.length) { if (all[o] === 23) found = true; o += 5 + all.readUInt16BE(o + 3); } return found ? "да" : "нет"; })());
spy.close(); first.close(); fs.rmSync(dir, { recursive: true });`, { filename: "02-tls.mjs", collapsed: true }),
      code("text", `1) соединение с проверкой: протокол TLSv1.3 ; шифр TLS_AES_256_GCM_SHA384 ; сертификат принят: true
   субъект: CN=app.test | издатель: CN=Demo Root CA | SAN: DNS:app.test, DNS:*.app.test, IP Address:127.0.0.1
   ключ сертификата: ec prime256v1 | срок действия: 90 суток

2) имя не совпадает (other.test): ERR_TLS_CERT_ALTNAME_INVALID
   центр не в списке доверенных: UNABLE_TO_VERIFY_LEAF_SIGNATURE
   сертификат выдан другим центром (Rogue CA) для того же имени: UNABLE_TO_VERIFY_LEAF_SIGNATURE
   с отключённой проверкой (rejectUnauthorized: false) соединение с неверным именем «успешно»: authorized = false , причина: «ERR_TLS_CERT_ALTNAME_INVALID» — защиты от подмены нет

3) срок действия сертификата 90 суток; проверка openssl verify:
   сегодня: app.test.pem: OK
   через 100 суток: error 10 at 0 depth lookup: certificate has expired

4) сервер только TLS 1.3 → TLSv1.3 / TLS_AES_256_GCM_SHA384 ; сервер до TLS 1.2 → TLSv1.2 / ECDHE-ECDSA-AES128-GCM-SHA256 ; клиент до 1.2 к серверу только 1.3 → ошибка ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION

5) ALPN: клиент предлагает [http/1.1] → http/1.1 ; предлагает [h2, http/1.1] → h2 (сервер выбирает общий протокол)
   SNI: клиент просит app.test → app.test ; api.test → api.test (один IP и порт, два сертификата)

6) возобновление сессии по билету: получен билет: true ; повторное соединение использует сессию: true

7) наблюдатель между клиентом и сервером видит:
   первая запись — тип 22 (22 = handshake), версия записи 0x301 ; имя сервера из SNI открыто: да
   пароль из запроса в потоке не найден (данные зашифрованы): да
   записи прикладных данных имеют тип 23: да`, { filename: "собственный центр сертификации на OpenSSL, серверы TLS на локальном интерфейсе" }),
      ul(
        "Скрипт создаёт центр сертификации и сертификаты (ключи EC `prime256v1`, срок 90 суток, SAN `app.test`, `*.app.test`, `127.0.0.1`). Соединение прошло с протоколом `TLSv1.3` и шифром `TLS_AES_256_GCM_SHA384`.",
        "**Проверки действуют:** неверное имя — `ERR_TLS_CERT_ALTNAME_INVALID`; центр не в списке доверенных и сертификат от «чужого» центра — `UNABLE_TO_VERIFY_LEAF_SIGNATURE`; через 100 суток `openssl verify` сообщает `error 10 … certificate has expired`. С `rejectUnauthorized: false` соединение с неверным именем «успешно», но `authorized = false`: **отключение проверки уничтожает защиту от подмены сервера**.",
        "**Версии:** сервер только TLS 1.3 — согласован `TLSv1.3`; сервер до 1.2 — `TLSv1.2` с `ECDHE-ECDSA-AES128-GCM-SHA256`; клиент до 1.2 к серверу только 1.3 — ошибка `ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION`.",
        "**ALPN:** при предложении `[http/1.1]` выбран `http/1.1`, при `[h2, http/1.1]` — `h2`. **SNI:** один порт отдаёт сертификат `app.test` или `api.test` по запрошенному имени. **Возобновление:** билет сессии получен, повторное соединение использует сессию.",
        "**Наблюдатель на проводе** видит запись типа 22 (рукопожатие), версию записи `0x301` и имя сервера из SNI; пароль из запроса не найден, а записи данных имеют тип 23 (зашифрованные).",
      ),
    ]),

    section("detailed-example", [
      h("Цена TLS в кругах RTT"),
      code("js", `// Цена шифрования в кругах RTT: TLS 1.2, TLS 1.3 и возобновление сессии через канал с условной задержкой RTT = 40 мс.
// Прокси добавляет по 20 мс в каждую сторону и 1 RTT на «рукопожатие TCP» перед первым байтом. Время — в stderr.
import tls from "node:tls";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "devdock-tls-"));
const sh = (...a) => execFileSync("openssl", a, { cwd: dir, stdio: "ignore" });
sh("ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", "ca.key");
sh("req", "-x509", "-new", "-key", "ca.key", "-sha256", "-days", "30", "-subj", "/CN=Demo Root CA", "-out", "ca.pem");
sh("ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", "s.key");
sh("req", "-new", "-key", "s.key", "-subj", "/CN=app.test", "-out", "s.csr");
fs.writeFileSync(path.join(dir, "s.cnf"), "subjectAltName=DNS:app.test\\n");
sh("x509", "-req", "-in", "s.csr", "-CA", "ca.pem", "-CAkey", "ca.key", "-CAcreateserial", "-days", "30", "-sha256", "-extfile", "s.cnf", "-out", "s.pem");
const rd = (f) => fs.readFileSync(path.join(dir, f));
const ca = rd("ca.pem");

const ONE_WAY = 20;
function makeProxy(targetPort, stat) {
  return net.createServer((client) => {
    const up = net.connect(targetPort, "127.0.0.1"); let ready = false; const q = [];
    const fwd = (sock, d, count) => (c) => { if (count) stat.toClient += c.length; setTimeout(() => sock.destroyed || sock.write(c), d); };
    setTimeout(() => { ready = true; q.forEach(fwd(up, ONE_WAY, false)); }, 2 * ONE_WAY);
    client.on("data", (c) => (ready ? fwd(up, ONE_WAY, false)(c) : q.push(c)));
    up.on("data", fwd(client, ONE_WAY, true));
    client.on("close", () => up.destroy()); up.on("close", () => setTimeout(() => client.destroy(), ONE_WAY));
    client.on("error", () => {}); up.on("error", () => {});
  });
}
async function startServer(serverOpts) {                       // один сервер и один прокси на всю серию измерений: билеты сессий привязаны к серверу
  const srv = tls.createServer({ key: rd("s.key"), cert: rd("s.pem"), ...serverOpts }, (s) => { s.on("data", () => s.end("ok")); }); srv.on("tlsClientError", () => {});
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const stat = { toClient: 0 }; const px = makeProxy(srv.address().port, stat);
  await new Promise((r) => px.listen(0, "127.0.0.1", r));
  return { srv, px, stat, close() { px.close(); srv.close(); } };
}
async function scenario(S, clientOpts, session) {
  S.stat.toClient = 0;
  const t = performance.now();
  const s = tls.connect({ port: S.px.address().port, host: "127.0.0.1", ca, servername: "app.test", session, ...clientOpts });
  let ticket = null; s.on("session", (x) => (ticket = x));
  await new Promise((res, rej) => { s.once("secureConnect", res); s.once("error", rej); });
  const tHandshake = performance.now() - t;
  const reused = s.isSessionReused(), proto = s.getProtocol();
  const bytesHandshake = S.stat.toClient;
  s.write("GET / HTTP/1.1\\r\\n\\r\\n");
  await new Promise((res) => s.once("data", res));
  const tTotal = performance.now() - t;
  await new Promise((r) => setTimeout(r, 80));
  s.destroy();
  return { tHandshake, tTotal, reused, proto, bytesHandshake, ticket };
}
const best = async (fn) => { let b = null; for (let i = 0; i < 3; i++) { const r = await fn(); if (!b || r.tTotal < b.tTotal) b = r; } return b; };
const S13 = await startServer({ minVersion: "TLSv1.3" }), S12 = await startServer({ maxVersion: "TLSv1.2" });
const t13 = await best(() => scenario(S13, {}));
const t12 = await best(() => scenario(S12, { maxVersion: "TLSv1.2" }));
const first = await scenario(S13, {});
const rs = await best(() => scenario(S13, {}, first.ticket));
S13.close(); S12.close();
console.error(\`TLS 1.3: рукопожатие \${t13.tHandshake.toFixed(0)} мс, до ответа \${t13.tTotal.toFixed(0)} мс; TLS 1.2: \${t12.tHandshake.toFixed(0)} и \${t12.tTotal.toFixed(0)}; возобновление 1.3: \${rs.tHandshake.toFixed(0)} и \${rs.tTotal.toFixed(0)} (сессия повторно использована: \${rs.reused}); байт от сервера на рукопожатие: полное \${t13.bytesHandshake}, возобновление \${rs.bytesHandshake}\`);
console.log("модель: RTT 40 мс; рукопожатие TCP — 1 RTT до первого байта; запрос и ответ — 1 RTT");
console.log("протоколы:", t13.proto, "и", t12.proto);
console.log("TLS 1.3 — 1 RTT на рукопожатие шифрования: до готовности ≈ 2 RTT от начала (TCP + TLS):", (t13.tHandshake > 60 && t13.tHandshake < 130) ? "да" : "нет");
console.log("TLS 1.2 — 2 RTT на рукопожатие: до готовности ≈ 3 RTT от начала:", (t12.tHandshake > 100 && t12.tHandshake < 170) ? "да" : "нет");
console.log("TLS 1.2 дольше TLS 1.3 примерно на один RTT (разница от 25 до 70 мс):", (t12.tHandshake - t13.tHandshake > 25 && t12.tHandshake - t13.tHandshake < 70) ? "да" : "нет");
console.log("возобновление сессии TLS 1.3 использовано:", rs.reused ? "да" : "нет");
console.log("возобновление не быстрее по кругам RTT: разница с полным рукопожатием менее 20 мс:", Math.abs(rs.tHandshake - t13.tHandshake) < 20 ? "да" : "нет");
console.log("при возобновлении сервер отправил на 300 байт и более меньше (нет цепочки сертификатов и подписи):", t13.bytesHandshake - rs.bytesHandshake >= 300 ? "да" : "нет");
fs.rmSync(dir, { recursive: true });`, { filename: "03-tls-latency.mjs", collapsed: true }),
      code("text", `модель: RTT 40 мс; рукопожатие TCP — 1 RTT до первого байта; запрос и ответ — 1 RTT
протоколы: TLSv1.3 и TLSv1.2
TLS 1.3 — 1 RTT на рукопожатие шифрования: до готовности ≈ 2 RTT от начала (TCP + TLS): да
TLS 1.2 — 2 RTT на рукопожатие: до готовности ≈ 3 RTT от начала: да
TLS 1.2 дольше TLS 1.3 примерно на один RTT (разница от 25 до 70 мс): да
возобновление сессии TLS 1.3 использовано: да
возобновление не быстрее по кругам RTT: разница с полным рукопожатием менее 20 мс: да
при возобновлении сервер отправил на 300 байт и более меньше (нет цепочки сертификатов и подписи): да`, { filename: "RTT 40 мс (прокси с условной задержкой): TLS 1.3, TLS 1.2, возобновление" }),
      ul(
        "Модель: прокси добавляет 20 мс в каждую сторону и 1 RTT на «рукопожатие TCP» (то есть 40 мс до первого байта). Калибровка: **TLS 1.3 — около 85 мс** до готовности шифрованного соединения (≈ 2 RTT: TCP + 1 RTT TLS), до получения ответа около 127 мс; **TLS 1.2 — около 125 мс** (≈ 3 RTT), до ответа около 167 мс. Разница — ровно один круг RTT.",
        "**Возобновление сессии** TLS 1.3 не сокращает число кругов (≈ 84 мс), но сервер отправил около 1330 байт вместо 1850: не нужны сертификат и подпись. Для коротких соединений это экономит передачу и вычисления.",
        "Следствие: каждое новое HTTPS-соединение платит TCP + TLS (≈ 2 RTT) до первого запроса; поэтому важны постоянные соединения, HTTP/2 и HTTP/3, повторное использование сессий и размещение серверов ближе к пользователям (CDN).",
      ),
      h("HTTP-кеш: сценарии свежести и проверки"),
      code("js", `// HTTP-кеширование (RFC 9111): сервер на локальном интерфейсе и простой кеш клиента с условными часами.
import http from "node:http";

const SIZE = { js: 50000, html: 20000, rates: 2000, account: 1000, lang: 500 };
const state = { index: 1, rates: 1 };                                  // «версии» ресурсов на сервере
const hits = {};
const server = http.createServer((req, res) => {
  res.sendDate = false;
  const path = req.url; hits[path] = (hits[path] ?? 0) + 1;
  const send = (code, headers, body) => { res.writeHead(code, { ...headers, "Content-Length": code === 304 ? 0 : Buffer.byteLength(body) }); res.end(code === 304 ? undefined : body); };
  const conditional = (etag, headers, body) => (req.headers["if-none-match"] === etag ? send(304, { ETag: etag, ...headers }) : send(200, { ETag: etag, ...headers }, body));
  if (path === "/app.3f9a1c.js") return conditional('"3f9a1c"', { "Cache-Control": "public, max-age=31536000, immutable" }, "x".repeat(SIZE.js));
  if (path === "/index.html") return conditional(\`"idx-\${state.index}"\`, { "Cache-Control": "no-cache" }, "<h1>v" + state.index + "</h1>" + "y".repeat(SIZE.html));
  if (path === "/api/rates") return conditional(\`"r-\${state.rates}"\`, { "Cache-Control": "max-age=60" }, JSON.stringify({ v: state.rates }) + "z".repeat(SIZE.rates));
  if (path === "/account") return send(200, { "Cache-Control": "private, no-store" }, "секретные данные " + "s".repeat(SIZE.account));
  if (path === "/lang") { const l = req.headers["accept-language"] ?? "en"; return send(200, { "Cache-Control": "max-age=60", Vary: "Accept-Language" }, l + ":" + "l".repeat(SIZE.lang)); }
  send(404, {}, "нет");
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port;

// ---- простой кеш клиента ----
let clock = 0;                                                         // условные часы, мс
const store = new Map();
const parseCC = (h) => Object.fromEntries((h ?? "").split(",").map((x) => x.trim()).filter(Boolean).map((x) => { const [k, v] = x.split("="); return [k.toLowerCase(), v ?? true]; }));
async function get(path, reqHeaders = {}) {
  const url = base + path;
  const keyOf = (vary) => url + "|" + (vary ?? "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean).map((h) => h + "=" + (reqHeaders[h] ?? "")).join("&");
  // поиск записи: сначала по ключу без Vary, затем с учётом сохранённого Vary
  let entry = [...store.values()].find((e) => e.url === url && keyOf(e.vary) === e.key);
  const cc = entry ? parseCC(entry.headers["cache-control"]) : {};
  if (entry && !cc["no-cache"]) {
    const age = (clock - entry.storedAt) / 1000, fresh = Number(cc["max-age"] ?? 0) - age;
    if (fresh > 0) return { status: 200, from: "кеш (свежий, возраст " + Math.round(age) + " с)", bytes: 0, body: entry.body };
  }
  const h = { ...reqHeaders, ...(entry?.headers.etag ? { "If-None-Match": entry.headers.etag } : {}) };
  const r = await fetch(url, { headers: h, cache: "no-store" });
  const body = await r.text(); const headers = Object.fromEntries(r.headers);
  const wire = headers["content-length"] ? Number(headers["content-length"]) : 0;
  if (r.status === 304 && entry) { entry.storedAt = clock; Object.assign(entry.headers, headers); return { status: 304, from: "сеть: проверка, ответ 304", bytes: 0, body: entry.body }; }
  const ccr = parseCC(headers["cache-control"]);
  if (!ccr["no-store"]) { const vary = headers.vary; const key = keyOf(vary); store.delete(entry?.key); store.set(key, { url, key, vary, headers, body, storedAt: clock }); }
  return { status: r.status, from: ccr["no-store"] ? "сеть (no-store: не сохраняется)" : "сеть: полный ответ", bytes: wire, body };
}
const rows = []; let total = 0, totalNoCache = 0;
async function step(label, path, headers) {
  const r = await get(path, headers); total += r.bytes; totalNoCache += SIZE[{ "/app.3f9a1c.js": "js", "/index.html": "html", "/api/rates": "rates", "/account": "account", "/lang": "lang" }[path]] ?? 0;
  console.log(label.padEnd(54), r.from.padEnd(36), "тело по сети:", String(r.bytes).padStart(6), "Б");
}
const sec = (s) => (clock = s * 1000);
console.log("--- неизменяемый файл с хешем в имени (max-age 1 год, immutable) ---");
sec(0); await step("t=0         /app.3f9a1c.js", "/app.3f9a1c.js");
sec(86400); await step("t=1 сутки   /app.3f9a1c.js", "/app.3f9a1c.js");
sec(30 * 86400); await step("t=30 суток  /app.3f9a1c.js", "/app.3f9a1c.js");
console.log("\\n--- no-cache: хранить, но проверять каждый раз (условный запрос, ETag) ---");
sec(0); await step("t=0         /index.html", "/index.html");
sec(10); await step("t=10 с      /index.html (не менялся)", "/index.html");
state.index = 2;
sec(20); await step("t=20 с      /index.html (сервер обновил)", "/index.html");
console.log("\\n--- max-age=60: свежесть по времени, затем проверка ---");
sec(0); await step("t=0         /api/rates", "/api/rates");
sec(30); await step("t=30 с      /api/rates", "/api/rates");
sec(61); await step("t=61 с      /api/rates (устарел, данные те же)", "/api/rates");
state.rates = 2;
sec(130); await step("t=130 с     /api/rates (данные изменились)", "/api/rates");
console.log("\\n--- no-store: ответ с персональными данными не сохраняется ---");
sec(0); await step("t=0         /account", "/account");
sec(1); await step("t=1 с       /account", "/account");
console.log("\\n--- Vary: Accept-Language: разные представления — разные записи кеша ---");
sec(0); await step("t=0         /lang (ru)", "/lang", { "accept-language": "ru" });
sec(1); await step("t=1 с       /lang (en)", "/lang", { "accept-language": "en" });
sec(2); await step("t=2 с       /lang (ru) повторно", "/lang", { "accept-language": "ru" });
console.log("\\nобращений к серверу по путям:", JSON.stringify(hits));
console.log("тело по сети всего:", total, "Б; без кеша те же запросы передали бы:", totalNoCache, "Б; экономия:", Math.round(100 * (1 - total / totalNoCache)), "%");
server.close(); server.closeAllConnections();`, { filename: "04-http-cache.mjs", collapsed: true }),
      code("text", `--- неизменяемый файл с хешем в имени (max-age 1 год, immutable) ---
t=0         /app.3f9a1c.js                             сеть: полный ответ                   тело по сети:  50000 Б
t=1 сутки   /app.3f9a1c.js                             кеш (свежий, возраст 86400 с)        тело по сети:      0 Б
t=30 суток  /app.3f9a1c.js                             кеш (свежий, возраст 2592000 с)      тело по сети:      0 Б

--- no-cache: хранить, но проверять каждый раз (условный запрос, ETag) ---
t=0         /index.html                                сеть: полный ответ                   тело по сети:  20011 Б
t=10 с      /index.html (не менялся)                   сеть: проверка, ответ 304            тело по сети:      0 Б
t=20 с      /index.html (сервер обновил)               сеть: полный ответ                   тело по сети:  20011 Б

--- max-age=60: свежесть по времени, затем проверка ---
t=0         /api/rates                                 сеть: полный ответ                   тело по сети:   2007 Б
t=30 с      /api/rates                                 кеш (свежий, возраст 30 с)           тело по сети:      0 Б
t=61 с      /api/rates (устарел, данные те же)         сеть: проверка, ответ 304            тело по сети:      0 Б
t=130 с     /api/rates (данные изменились)             сеть: полный ответ                   тело по сети:   2007 Б

--- no-store: ответ с персональными данными не сохраняется ---
t=0         /account                                   сеть (no-store: не сохраняется)      тело по сети:   1032 Б
t=1 с       /account                                   сеть (no-store: не сохраняется)      тело по сети:   1032 Б

--- Vary: Accept-Language: разные представления — разные записи кеша ---
t=0         /lang (ru)                                 сеть: полный ответ                   тело по сети:    503 Б
t=1 с       /lang (en)                                 сеть: полный ответ                   тело по сети:    503 Б
t=2 с       /lang (ru) повторно                        кеш (свежий, возраст 2 с)            тело по сети:      0 Б

обращений к серверу по путям: {"/app.3f9a1c.js":1,"/index.html":3,"/api/rates":3,"/account":2,"/lang":2}
тело по сети всего: 97106 Б; без кеша те же запросы передали бы: 221500 Б; экономия: 56 %`, { filename: "сервер на локальном интерфейсе, кеш клиента с условными часами" }),
      ul(
        "**Неизменяемый файл** `app.3f9a1c.js` (`max-age=31536000, immutable`): первый запрос — 50 000 байт, через сутки и через 30 суток — из кеша, 0 запросов к серверу.",
        "**`no-cache` + `ETag`** (HTML): каждый раз условный запрос; пока версия не менялась — `304` и 0 байт тела; после обновления на сервере — полный `200` (20 011 байт).",
        "**`max-age=60`:** в пределах 60 секунд ответ из кеша; через 61 с — проверка, `304`; после смены данных — `200`.",
        "**`private, no-store`:** персональные данные не сохраняются: обе загрузки идут по сети. **`Vary: Accept-Language`:** русская и английская версии — разные записи кеша; повтор русской — из кеша.",
        "Итог: 5 путей, 15 запросов клиента, из них к серверу ушло 11; тело по сети — 97 106 байт вместо 221 500 (−56 %). Практика: хешируйте имена статических файлов и ставьте им год; HTML — `no-cache` с `ETag`; персональное — `private, no-store`; не забывайте `Vary`.",
      ),
      h("Cookie, сессия и токен"),
      code("js", `// Cookie: модель правил RFC 6265bis (упрощённо: «сайт» = последние две метки хоста): разбор Set-Cookie, правила отправки, SameSite, префиксы;
// затем настоящий HTTP-сервер с сессией и подписанный токен
import http from "node:http";
import crypto from "node:crypto";

// ---- разбор Set-Cookie ----
function parseSetCookie(line, requestHost) {
  const [pair, ...attrs] = line.split(";").map((x) => x.trim());
  const eq = pair.indexOf("="); const c = { name: pair.slice(0, eq), value: pair.slice(eq + 1), domain: requestHost, hostOnly: true, path: "/", secure: false, httpOnly: false, sameSite: "Lax", expires: Infinity };
  for (const a of attrs) {
    const [k, v] = a.split("="); const key = k.toLowerCase();
    if (key === "domain") { c.domain = v.replace(/^\\./, "").toLowerCase(); c.hostOnly = false; }
    else if (key === "path") c.path = v; else if (key === "secure") c.secure = true; else if (key === "httponly") c.httpOnly = true;
    else if (key === "samesite") c.sameSite = { lax: "Lax", strict: "Strict", none: "None" }[v.toLowerCase()] ?? "Lax";
    else if (key === "max-age") c.expires = Number(v) * 1000;                    // относительно «сейчас» (0 мс)
  }
  return c;
}
// ---- правила приёма и отправки ----
const sameSite = (a, b) => { const reg = (h) => h.split(".").slice(-2).join("."); return reg(a) === reg(b); };        // упрощённо: «сайт» = последние две метки хоста
function accepts(c, ctx) {
  if (c.name.startsWith("__Host-") && !(c.secure && c.path === "/" && c.hostOnly)) return "отвергнут: префикс __Host- требует Secure, Path=/ и отсутствия Domain";
  if (c.name.startsWith("__Secure-") && !c.secure) return "отвергнут: префикс __Secure- требует Secure";
  if (c.sameSite === "None" && !c.secure) return "отвергнут: SameSite=None без Secure";
  if (c.secure && ctx.scheme !== "https") return "отвергнут: Secure-cookie нельзя установить по HTTP";
  if (!c.hostOnly && !(ctx.host === c.domain || ctx.host.endsWith("." + c.domain))) return "отвергнут: Domain не покрывает хост ответа";
  if (c.domain === "com" || c.domain === "co.uk") return "отвергнут: Domain — публичный суффикс";
  if (Buffer.byteLength(c.name + "=" + c.value) > 4096) return "отвергнут: больше 4096 байт";
  return "принят";
}
function sent(c, req) {                                                         // req: { scheme, host, path, topSite, initiator: "navigation"|"subresource", method }
  if (c.secure && req.scheme !== "https") return "нет: Secure, а соединение по HTTP";
  const hostOk = c.hostOnly ? req.host === c.domain : (req.host === c.domain || req.host.endsWith("." + c.domain));
  if (!hostOk) return "нет: другой хост";
  if (!(req.path === c.path || req.path.startsWith(c.path.endsWith("/") ? c.path : c.path + "/"))) return "нет: другой путь";
  const cross = !sameSite(req.topSite, req.host);
  if (cross) {
    if (c.sameSite === "None") return "да (SameSite=None разрешает междусайтовые запросы)";
    if (c.sameSite === "Lax") return req.initiator === "navigation" && req.method === "GET" ? "да (Lax: переход по ссылке GET)" : "нет: Lax не отправляется во вложенных запросах другого сайта";
    return "нет: Strict не отправляется в междусайтовых запросах";
  }
  return "да";
}

const jar = [
  ["session=abc; Path=/; HttpOnly; Secure; SameSite=Lax", "app.example.com"],
  ["theme=dark; Path=/; Max-Age=31536000", "app.example.com"],
  ["track=1; Path=/; SameSite=None; Secure", "ads.example.net"],
  ["csrf=xyz; Path=/; SameSite=Strict", "app.example.com"],
  ["admin=1; Path=/admin; HttpOnly", "app.example.com"],
  ["wide=1; Domain=example.com", "app.example.com"],
].map(([line, host]) => ({ line, c: parseSetCookie(line, host) }));
console.log("--- приём Set-Cookie (ответ от https://app.example.com) ---");
for (const t of ["__Host-id=1; Secure; Path=/", "__Host-id=1; Secure; Path=/; Domain=example.com", "__Secure-s=1", "x=1; SameSite=None", "y=1; Domain=com", "z=" + "a".repeat(5000), "ok=1; Domain=example.com", "other=1; Domain=evil.test"]) {
  const c = parseSetCookie(t, "app.example.com");
  console.log("  " + (t.length > 60 ? t.slice(0, 20) + "…(" + t.length + " симв.)" : t).padEnd(52), accepts(c, { scheme: "https", host: "app.example.com" }));
}
console.log("\\n--- какие cookie отправит браузер ---");
const ctxs = [
  ["https://app.example.com/, тот же сайт", { scheme: "https", host: "app.example.com", path: "/", topSite: "app.example.com", initiator: "subresource", method: "GET" }],
  ["http://app.example.com/ (без TLS)", { scheme: "http", host: "app.example.com", path: "/", topSite: "app.example.com", initiator: "subresource", method: "GET" }],
  ["https://app.example.com/admin/users", { scheme: "https", host: "app.example.com", path: "/admin/users", topSite: "app.example.com", initiator: "subresource", method: "GET" }],
  ["https://app.example.com/, со страницы evil.test (fetch)", { scheme: "https", host: "app.example.com", path: "/", topSite: "evil.test", initiator: "subresource", method: "POST" }],
  ["https://app.example.com/, по ссылке с evil.test (GET)", { scheme: "https", host: "app.example.com", path: "/", topSite: "evil.test", initiator: "navigation", method: "GET" }],
  ["https://ads.example.net/, со страницы shop.test", { scheme: "https", host: "ads.example.net", path: "/", topSite: "shop.test", initiator: "subresource", method: "GET" }],
];
for (const [label, req] of ctxs) {
  console.log(label);
  for (const { c } of jar) { const r = sent(c, req); if (c.name === "track" && !req.host.includes("ads")) continue; if (c.name !== "track" && req.host.includes("ads")) continue; console.log("    " + c.name.padEnd(6), r); }
}
console.log("\\nHttpOnly-cookie недоступны скрипту: document.cookie их не показывает (защита от кражи сессии через XSS); Secure — только по HTTPS; SameSite — защита от CSRF.");

// ---- настоящий HTTP: сессионный cookie и фиксация сессии ----
const sessions = new Map(); const users = new Map();
const server = http.createServer((req, res) => {
  res.sendDate = false;
  const cookies = Object.fromEntries((req.headers.cookie ?? "").split(";").filter(Boolean).map((x) => x.trim().split("=")));
  const sid = cookies.sid; const sess = sid && sessions.get(sid);
  if (req.url === "/login") {
    if (sid) sessions.delete(sid);                                              // старый идентификатор уничтожаем: защита от фиксации сессии
    const fresh = crypto.randomBytes(16).toString("hex"); sessions.set(fresh, { user: "anna" });
    res.writeHead(200, { "Set-Cookie": \`sid=\${fresh}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600\` }); return res.end("вход выполнен");
  }
  if (req.url === "/me") { res.writeHead(sess ? 200 : 401); return res.end(sess ? "вы: " + sess.user : "не авторизован"); }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port;
console.log("\\n--- сессия на сервере ---");
let r = await fetch(base + "/me"); console.log("GET /me без cookie →", r.status, await r.text());
r = await fetch(base + "/login", { headers: { Cookie: "sid=attacker-known-id" } });
const set = r.headers.get("set-cookie"); await r.text();
console.log("POST-вход с подсунутым sid=attacker-known-id → выдан новый идентификатор (не тот, что подсунули):", !set.includes("attacker-known-id") ? "да" : "нет");
console.log("атрибуты выданного cookie:", set.replace(/sid=[0-9a-f]+/, "sid=<случайные 32 hex-символа>"), "; идентификатор — 32 hex-символа, то есть", /sid=([0-9a-f]+)/.exec(set)[1].length * 4, "бит случайности из crypto.randomBytes");
const sid = /sid=([0-9a-f]+)/.exec(set)[1];
r = await fetch(base + "/me", { headers: { Cookie: "sid=" + sid } }); console.log("GET /me с выданным sid →", r.status, await r.text());
r = await fetch(base + "/me", { headers: { Cookie: "sid=attacker-known-id" } }); console.log("GET /me с подсунутым sid →", r.status, await r.text());
server.close(); server.closeAllConnections();

// ---- подписанный токен без состояния на сервере (JWT, HS256) ----
const b64u = (b) => Buffer.from(b).toString("base64url");
const secret = "демонстрационный-секрет-не-для-продакшена";
const sign = (payload) => { const head = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" })), body = b64u(JSON.stringify(payload)); return head + "." + body + "." + b64u(crypto.createHmac("sha256", secret).update(head + "." + body).digest()); };
function verify(token) {
  const [h, b, s] = token.split("."); const header = JSON.parse(Buffer.from(h, "base64url"));
  if (header.alg !== "HS256") throw new Error("недопустимый алгоритм: " + header.alg);                  // алгоритм фиксируем на сервере, а не берём из токена
  const want = crypto.createHmac("sha256", secret).update(h + "." + b).digest();
  if (!crypto.timingSafeEqual(want, Buffer.from(s, "base64url"))) throw new Error("подпись неверна");
  const p = JSON.parse(Buffer.from(b, "base64url")); if (p.exp <= 1000) throw new Error("срок действия истёк"); return p;
}
const tok = sign({ sub: "anna", role: "user", exp: 2000 });
console.log("\\n--- подписанный токен (JWT, HS256) ---");
console.log("токен:", tok);
console.log("проверка: ", JSON.stringify(verify(tok)));
const [hh, bb, ss] = tok.split(".");
const forged = hh + "." + b64u(JSON.stringify({ sub: "anna", role: "admin", exp: 2000 })) + "." + ss;
try { verify(forged); } catch (e) { console.log("подмена роли на admin без знания секрета →", e.message); }
const none = b64u(JSON.stringify({ alg: "none", typ: "JWT" })) + "." + bb + ".";
try { verify(none); } catch (e) { console.log("атака alg=none →", e.message); }
console.log("полезная нагрузка токена не зашифрована, а лишь подписана: любой читает её (base64url):", Buffer.from(bb, "base64url").toString());
try { verify(sign({ sub: "anna", exp: 500 })); } catch (e) { console.log("просроченный токен →", e.message); }`, { filename: "05-cookies.mjs", collapsed: true }),
      code("text", `--- приём Set-Cookie (ответ от https://app.example.com) ---
  __Host-id=1; Secure; Path=/                          принят
  __Host-id=1; Secure; Path=/; Domain=example.com      отвергнут: префикс __Host- требует Secure, Path=/ и отсутствия Domain
  __Secure-s=1                                         отвергнут: префикс __Secure- требует Secure
  x=1; SameSite=None                                   отвергнут: SameSite=None без Secure
  y=1; Domain=com                                      отвергнут: Domain — публичный суффикс
  z=aaaaaaaaaaaaaaaaaa…(5002 симв.)                    отвергнут: больше 4096 байт
  ok=1; Domain=example.com                             принят
  other=1; Domain=evil.test                            отвергнут: Domain не покрывает хост ответа

--- какие cookie отправит браузер ---
https://app.example.com/, тот же сайт
    session да
    theme  да
    csrf   да
    admin  нет: другой путь
    wide   да
http://app.example.com/ (без TLS)
    session нет: Secure, а соединение по HTTP
    theme  да
    csrf   да
    admin  нет: другой путь
    wide   да
https://app.example.com/admin/users
    session да
    theme  да
    csrf   да
    admin  да
    wide   да
https://app.example.com/, со страницы evil.test (fetch)
    session нет: Lax не отправляется во вложенных запросах другого сайта
    theme  нет: Lax не отправляется во вложенных запросах другого сайта
    csrf   нет: Strict не отправляется в междусайтовых запросах
    admin  нет: другой путь
    wide   нет: Lax не отправляется во вложенных запросах другого сайта
https://app.example.com/, по ссылке с evil.test (GET)
    session да (Lax: переход по ссылке GET)
    theme  да (Lax: переход по ссылке GET)
    csrf   нет: Strict не отправляется в междусайтовых запросах
    admin  нет: другой путь
    wide   да (Lax: переход по ссылке GET)
https://ads.example.net/, со страницы shop.test
    track  да (SameSite=None разрешает междусайтовые запросы)

HttpOnly-cookie недоступны скрипту: document.cookie их не показывает (защита от кражи сессии через XSS); Secure — только по HTTPS; SameSite — защита от CSRF.

--- сессия на сервере ---
GET /me без cookie → 401 не авторизован
POST-вход с подсунутым sid=attacker-known-id → выдан новый идентификатор (не тот, что подсунули): да
атрибуты выданного cookie: sid=<случайные 32 hex-символа>; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600 ; идентификатор — 32 hex-символа, то есть 128 бит случайности из crypto.randomBytes
GET /me с выданным sid → 200 вы: anna
GET /me с подсунутым sid → 401 не авторизован

--- подписанный токен (JWT, HS256) ---
токен: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbm5hIiwicm9sZSI6InVzZXIiLCJleHAiOjIwMDB9.YXmdW5C0tgGrpPjnxQGmB5DEEK349P3EaA5RfuNICug
проверка:  {"sub":"anna","role":"user","exp":2000}
подмена роли на admin без знания секрета → подпись неверна
атака alg=none → недопустимый алгоритм: none
полезная нагрузка токена не зашифрована, а лишь подписана: любой читает её (base64url): {"sub":"anna","role":"user","exp":2000}
просроченный токен → срок действия истёк`, { filename: "правила cookie, сессия на настоящем сервере, подписанный токен" }),
      ul(
        "**Приём:** `__Host-id` принят только при `Secure`, `Path=/` и без `Domain`; `__Secure-`, `SameSite=None` без `Secure`, `Domain=com` (публичный суффикс), cookie больше 4096 байт и `Domain` другого сайта — отвергнуты.",
        "**Отправка (модель правил):** по HTTPS на тот же сайт уходят все подходящие по пути; по HTTP `Secure`-cookie не уходит; со страницы чужого сайта (`fetch` POST) не уходят `Lax` и `Strict`; при переходе по ссылке GET уходит `Lax`, но не `Strict`; `SameSite=None; Secure` разрешает междоменные запросы (рекламные трекеры).",
        "**Сессия на настоящем сервере:** запрос без cookie — `401`; вход с подсунутым `sid=attacker-known-id` выдал **новый** идентификатор (защита от фиксации сессии): 32 hex-символа = 128 бит из `crypto.randomBytes`; старый `sid` стал недействительным.",
        "**JWT (HS256):** подпись проверяется HMAC; подмена роли на `admin` — «подпись неверна»; `alg=none` — «недопустимый алгоритм» (алгоритм фиксируется на сервере, а не берётся из токена); просроченный токен отвергнут. Полезная нагрузка видна любому: подпись — не шифрование.",
      ),
    ]),

    section("analysis", [
      h("Что защищает каждый механизм и где граница"),
      table(
        ["Угроза", "Защита", "Остаточный риск"],
        [
          ["Прослушивание сети", "TLS (AEAD)", "Метаданные: адреса, объёмы, SNI"],
          ["Подмена сервера", "Проверка цепочки и имени", "Скомпрометированный центр, отключённая проверка"],
          ["Кража сессии через XSS", "`HttpOnly`, CSP, экранирование", "Запросы от имени пользователя из самой страницы"],
          ["CSRF", "`SameSite`, токены, проверка `Origin`", "Подделки внутри того же сайта"],
          ["Фиксация сессии", "Новый идентификатор при входе", "Утечка идентификатора"],
          ["Подмена токена", "Подпись, проверка алгоритма и срока", "Утечка секрета, невозможность быстрого отзыва"],
          ["Показ чужих данных из кеша", "`private`/`no-store`, `Vary`", "Ошибки конфигурации CDN"],
          ["Перебор паролей при утечке базы", "scrypt/Argon2 + соль", "Слабые пароли"],
        ],
        "Угрозы, защиты и остаточные риски",
      ),
      h("Типичные причины сбоев в эксплуатации"),
      ul(
        "**Истёкший сертификат:** проверка выдаёт `certificate has expired`; нужны автоматическое продление и мониторинг срока (`openssl verify` через 100 суток после выпуска на 90 суток отвергает).",
        "**Неверное имя в SAN** при обращении по IP или по другому имени: `ERR_TLS_CERT_ALTNAME_INVALID`.",
        "**Неполная цепочка** (сервер не прислал промежуточный сертификат): часть клиентов не сможет проверить подпись (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`).",
        "**Смешанное содержимое** (HTTP-ресурсы на HTTPS-странице) блокируется браузерами.",
        "**Часы клиента:** сильно неверное время делает действующий сертификат «ещё не действительным» или «истёкшим».",
      ),
    ]),

    section("internals", [
      h("Как устроено рукопожатие TLS 1.3"),
      ul(
        "**ClientHello** содержит поддерживаемые версии и шифры, ключевую долю клиента (эфемерный ключ ECDH), SNI и ALPN.",
        "**ServerHello** выбирает параметры и присылает ключевую долю сервера: с этого момента обе стороны вычисляют общий секрет и дальнейшие сообщения шифруются.",
        "**Сертификат и `CertificateVerify`:** сервер доказывает владение закрытым ключом подписью по хешу рукопожатия; **`Finished`** подтверждает, что обе стороны видели одно и то же рукопожатие (защита от подмены параметров).",
        "**Ключи для данных** получаются из общего секрета функцией выведения ключей; для каждой записи используется свой nonce, выведенный из счётчика, — поэтому повтор nonce исключён конструкцией протокола.",
        "**Билеты сессий:** после рукопожатия сервер выдаёт зашифрованный билет; при следующем соединении клиент предъявляет его, и стороны пропускают передачу сертификата (замер: ≈ 1330 байт вместо ≈ 1850). Билеты шифруются ключом сервера: другой сервер без общего ключа билет не примет.",
      ),
      h("Как браузер решает, использовать ли кеш"),
      ul(
        "Вычисляет возраст ответа и срок свежести по `Cache-Control: max-age` (при отсутствии — по `Expires` или эвристике от `Last-Modified`).",
        "Сверяет ключ кеша: URL плюс значения заголовков из `Vary`; для разных значений хранит разные записи.",
        "При устаревании отправляет условный запрос с `If-None-Match`/`If-Modified-Since`; ответ `304` продлевает свежесть сохранённой копии без передачи тела.",
        "Для `no-store` ничего не сохраняет; для `private` запрещает общие кеши; `immutable` отключает проверки при обновлении страницы.",
        "**Обновление ресурсов:** универсальный приём — менять имя файла при изменении содержимого (хеш в имени), тогда срок свежести может быть почти бесконечным.",
      ),
    ]),

    section("mistakes", [
      wrongRight(
        "js",
        {
          title: "Неверно",
          code: `
            // «заработало» — отключаем проверку сертификата
            const agent = new https.Agent({ rejectUnauthorized: false });
            // токен: берём алгоритм из самого токена
            const alg = JSON.parse(atob(token.split(".")[0])).alg;
            if (alg === "none") return decode(token);       // принимает подделку
          `,
          note: "Без проверки сертификата шифрование не защищает от подмены сервера; алгоритм подписи нельзя доверять самому токену.",
        },
        {
          title: "Верно",
          code: `
            // доверяем нужному центру, а не отключаем проверку
            const agent = new https.Agent({ ca: fs.readFileSync("corp-root-ca.pem") });
            // токен: алгоритм зафиксирован на сервере, подпись сравнивается за постоянное время
            if (header.alg !== "HS256") throw new Error("недопустимый алгоритм");
            if (!crypto.timingSafeEqual(expected, actual)) throw new Error("подпись неверна");
          `,
          note: "В замере: подмена роли — «подпись неверна», `alg=none` — «недопустимый алгоритм».",
        },
      ),
      ul(
        "**Отключённая проверка сертификата** (`rejectUnauthorized: false`, `curl -k`) «временно» остаётся в продакшене.",
        "**Повтор nonce** в режимах вроде CTR/GCM: раскрывается XOR открытых текстов (замер); используйте уникальные nonce или библиотеки, которые делают это за вас.",
        "**Шифрование без аутентификации:** подмена шифртекста проходит молча (`сумма=100` → `101`); используйте AEAD.",
        "**Быстрый хеш для паролей** (SHA-256: 2 мкс на попытку против 107 мс у scrypt): перебор ускоряется в десятки тысяч раз.",
        "**Кеширование персональных ответов** без `private`/`no-store` или без `Vary`: общий кеш отдаёт данные одного пользователя другому.",
        "**Длинный `max-age` на неименованных ресурсах** (`app.js` без хеша): после деплоя пользователи долго видят старую версию.",
        "**Cookie сессии без `HttpOnly`/`Secure`/`SameSite`**, идентификатор сессии не обновляется при входе (фиксация сессии).",
        "**JWT как «шифрованное» хранилище:** нагрузка читается всеми (в замере выведена как обычный JSON); секреты в токен не кладут.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Самодельная криптография и «шифрование» через base64/XOR.** `Base64` и XOR с постоянным ключом — не защита (см. [биты и байты](/learn/cs/number-systems-encoding)).",
        "**Один долгоживущий сертификат без автоматизации:** ручное продление — гарантированный сбой в день истечения.",
        "**Секреты в репозитории и в клиентском коде,** ключи подписи токенов в `localStorage` или в JavaScript.",
        "**Хранить токены доступа в `localStorage`:** любой XSS их читает; для сессий браузера предпочтительнее `HttpOnly`-cookie.",
        "**Кеш «на всякий случай» на всё**, включая ответы API с персональными данными.",
        "**«Универсальный» `Cache-Control: max-age=0` или отключение кеша везде:** лишний трафик и задержки; кеш нужно настраивать по типам ресурсов.",
        "**Доверие заголовку `Host` и `X-Forwarded-Proto` без проверки прокси:** подмена схемы и адреса.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Везде HTTPS (TLS 1.3, при необходимости 1.2),** HSTS, автоматическое продление сертификатов, мониторинг срока и цепочки.",
        "**Не отключайте проверку сертификатов;** для внутренних сервисов добавьте свой корневой центр в список доверенных.",
        "**Используйте AEAD и проверенные библиотеки;** nonce уникальные; ключи — из криптографического генератора, хранятся в менеджере секретов.",
        "**Пароли — Argon2/scrypt/bcrypt с солью,** параметры стоимости подбирают под сервер (замер: ≈ 107 мс для scrypt N = 2¹⁵).",
        "**Кеширование по типам:** статические файлы с хешем в имени — год и `immutable`; HTML — `no-cache` с `ETag`; API — по бизнес-логике (`max-age`, `stale-while-revalidate`); персональное — `private, no-store`; не забывайте `Vary`.",
        "**Cookie:** `Secure`, `HttpOnly`, `SameSite=Lax` (или `Strict`) по умолчанию, префикс `__Host-`, короткий срок, новый идентификатор при входе и смене прав.",
        "**Токены:** подпись или MAC, фиксированный алгоритм, срок жизни, проверка `iss`/`aud`, список отзыва или короткое время жизни; секреты не в нагрузке.",
        "**Защита от CSRF:** `SameSite`, проверка `Origin`, токены для изменяющих запросов; от XSS — экранирование и политика безопасности контента.",
        "**Проверяйте поведение измерением:** `openssl s_client`, `curl -v`, инструменты разработчика браузера, журнал запросов к источнику после деплоя.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Нулевой RTT (0-RTT) в TLS 1.3:** данные можно отправить вместе с `ClientHello` при возобновлении, но они уязвимы к повтору; допустимо только для идемпотентных запросов.",
        "**Шифрование SNI:** в классическом варианте имя сервера открыто; расширение ECH шифрует `ClientHello`, но требует поддержки у обеих сторон.",
        "**Подписанные сертификаты и прозрачность:** журналы Certificate Transparency позволяют обнаруживать выпуск лишних сертификатов на ваше имя.",
        "**Отзыв сертификатов** (OCSP, списки) работает неидеально: короткие сроки действия (90 суток и меньше) снижают риск.",
        "**Кеши и `Vary: Cookie`:** делает кеш практически бесполезным в общих кешах; персональное лучше отдельным адресом или `private`.",
        "**`304` и заголовки:** при `304` сервер обязан прислать заголовки, влияющие на кеш (`Cache-Control`, `ETag`); без них срок свежести не обновится.",
        "**Cookie поддоменов:** `Domain=example.com` отправляется на все поддомены (и их скриптам доступна запись); `__Host-` не позволяет поддомену подменить cookie.",
        "**Сторонние cookie:** браузеры ограничивают их; `SameSite=None; Secure` необходим для междоменного использования, но может быть заблокирован политикой браузера.",
      ),
    ]),

    section("related", [
      ul(
        "[DNS и HTTP](/learn/cs/dns-http) — запросы, ответы и методы, поверх которых работают кеш и cookie.",
        "[Сетевая модель, IP и TCP](/learn/cs/network-model-ip-tcp) — рукопожатие TCP и RTT, к которым добавляется TLS.",
        "[Биты и байты](/learn/cs/number-systems-encoding) — Base64, UTF-8 и представление ключей.",
        "[Хеш-таблицы](/learn/cs/hash-tables) — криптографические и обычные хеши, лавинный эффект.",
        "[Транзакции и согласованность](/learn/cs/transactions-consistency-theory) — согласованность кешей и данных.",
        "[JavaScript: формы и fetch](/learn/js/forms-fetch) — запросы с учётными данными и режимы кеша `fetch`.",
        "[JavaScript: хранилища, URL и таймеры](/learn/js/storage-url-timers) — `localStorage`, cookie и их границы.",
        "[HTML: хранилище в вебе](/learn/html/web-storage) — cookie, `localStorage` и `sessionStorage`.",
        "[HTML: безопасность](/learn/html/html-security) — XSS, CSP, смешанное содержимое.",
        "[Git: объекты и адресация по содержимому](/learn/git/objects-content-addressing) — хеш как идентификатор содержимого.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "http",
        {
          title: "Одинаковый `max-age` для всего",
          code: `
            GET /index.html  → Cache-Control: max-age=86400
            GET /app.js      → Cache-Control: max-age=86400     (имя не меняется)
            GET /api/me      → (без заголовков кеширования, общий CDN)
          `,
          note: "После деплоя пользователи сутки видят старый HTML и старый `app.js`; ответ `/api/me` может попасть в общий кеш и быть показан другому пользователю.",
        },
        {
          title: "Политика по типам ресурсов",
          code: `
            GET /index.html          → Cache-Control: no-cache         ETag: "idx-2"
            GET /app.3f9a1c.js       → Cache-Control: public, max-age=31536000, immutable
            GET /api/me              → Cache-Control: private, no-store
          `,
          note: "HTML проверяется условным запросом (304 без тела), статика с хешем в имени кешируется на год, персональные данные не сохраняются (в замере: −56 % байт без нарушений).",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "cs.tls-caching-cookies.ex1",
      title: "Определите, что и сколько времени хранится в кеше",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждого ответа укажите, можно ли сохранить его в общем кеше, как долго он свеж и что произойдёт при повторном запросе через 30 секунд: (1) `Cache-Control: public, max-age=31536000, immutable`; (2) `Cache-Control: no-cache` с `ETag`; (3) `Cache-Control: max-age=60`; (4) `Cache-Control: private, no-store`; (5) `max-age=60` и `Vary: Accept-Language` (запросы на русском и английском)."),
      ],
      hints: [
        "`no-cache` не значит «не хранить»: он означает «проверять перед использованием».",
        "`private` запрещает общие кеши; `no-store` — любое сохранение.",
        "`Vary` создаёт отдельные записи для разных значений заголовка.",
      ],
      checks: ["(1) год, из кеша без проверки", "(2) хранится, но проверяется: `304` без тела", "(3) свежий до 60 с: из кеша через 30 с", "(4) не хранится: всегда по сети", "(5) две записи кеша по языку; повтор русской — из кеша"],
      solution: [
        code("text", `--- неизменяемый файл с хешем в имени (max-age 1 год, immutable) ---
t=0         /app.3f9a1c.js                             сеть: полный ответ                   тело по сети:  50000 Б
t=1 сутки   /app.3f9a1c.js                             кеш (свежий, возраст 86400 с)        тело по сети:      0 Б
t=30 суток  /app.3f9a1c.js                             кеш (свежий, возраст 2592000 с)      тело по сети:      0 Б

--- no-cache: хранить, но проверять каждый раз (условный запрос, ETag) ---
t=0         /index.html                                сеть: полный ответ                   тело по сети:  20011 Б
t=10 с      /index.html (не менялся)                   сеть: проверка, ответ 304            тело по сети:      0 Б
t=20 с      /index.html (сервер обновил)               сеть: полный ответ                   тело по сети:  20011 Б

--- max-age=60: свежесть по времени, затем проверка ---
t=0         /api/rates                                 сеть: полный ответ                   тело по сети:   2007 Б
t=30 с      /api/rates                                 кеш (свежий, возраст 30 с)           тело по сети:      0 Б
t=61 с      /api/rates (устарел, данные те же)         сеть: проверка, ответ 304            тело по сети:      0 Б
t=130 с     /api/rates (данные изменились)             сеть: полный ответ                   тело по сети:   2007 Б

--- no-store: ответ с персональными данными не сохраняется ---
t=0         /account                                   сеть (no-store: не сохраняется)      тело по сети:   1032 Б
t=1 с       /account                                   сеть (no-store: не сохраняется)      тело по сети:   1032 Б

--- Vary: Accept-Language: разные представления — разные записи кеша ---
t=0         /lang (ru)                                 сеть: полный ответ                   тело по сети:    503 Б
t=1 с       /lang (en)                                 сеть: полный ответ                   тело по сети:    503 Б
t=2 с       /lang (ru) повторно                        кеш (свежий, возраст 2 с)            тело по сети:      0 Б

обращений к серверу по путям: {"/app.3f9a1c.js":1,"/index.html":3,"/api/rates":3,"/account":2,"/lang":2}
тело по сети всего: 97106 Б; без кеша те же запросы передали бы: 221500 Б; экономия: 56 %`, { filename: "проверка сценариев" }),
        ul(
          "(1) Общий кеш разрешён, срок — год, `immutable` отключает проверки: через 30 суток тело по сети 0 байт.",
          "(2) `no-cache` с `ETag`: ответ хранится, но каждый раз отправляется условный запрос; пока версия прежняя — `304` и 0 байт тела, после обновления — полный `200`.",
          "(3) В пределах 60 секунд — из кеша; на 61-й секунде — проверка (`304`), после смены данных — новый ответ.",
          "(4) Не сохраняется и не попадает в общие кеши: оба запроса идут по сети.",
          "(5) Кеш различает представления по `Accept-Language`: русский и английский — две записи; повторный русский через 2 с — из кеша.",
        ),
      ],
    }),
    exercise({
      id: "cs.tls-caching-cookies.ex2",
      title: "Проверьте подписанный токен без типичных уязвимостей",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Реализуйте функцию `verify(token, secret)` для токена формата `заголовок.нагрузка.подпись` (base64url), подписанного HMAC-SHA256. Требования: алгоритм фиксирован на сервере (токен с `alg: none` отвергается), подпись сравнивается за постоянное время, срок действия проверяется. Покажите тестами: верный токен, подмена роли, `alg=none`, просроченный токен."),
      ],
      starter: {
        lang: "js",
        code: `
          import crypto from "node:crypto";
          function verify(token, secret, nowSec) {
            // разобрать, проверить алгоритм, подпись и срок
          }
        `,
      },
      hints: [
        "Подпись — HMAC-SHA256 от строки `заголовок.нагрузка` с вашим секретом.",
        "Для сравнения используйте `crypto.timingSafeEqual` (длины должны совпадать).",
        "Не читайте алгоритм из токена для выбора способа проверки: он должен быть заранее известен.",
      ],
      checks: ["Верный токен возвращает нагрузку", "Подмена роли отвергается («подпись неверна»)", "`alg=none` отвергается", "Просроченный токен отвергается", "Сравнение — `timingSafeEqual`"],
      solution: [
        code("js", `
          import crypto from "node:crypto";
          const b64 = (s) => Buffer.from(s, "base64url");
          function verify(token, secret, nowSec) {
            const [h, p, s] = token.split(".");
            if (!h || !p || s === undefined) throw new Error("неверный формат");
            if (JSON.parse(b64(h)).alg !== "HS256") throw new Error("недопустимый алгоритм");     // фиксируем алгоритм на сервере
            const expected = crypto.createHmac("sha256", secret).update(h + "." + p).digest();
            const actual = b64(s);
            if (actual.length !== expected.length || !crypto.timingSafeEqual(expected, actual)) throw new Error("подпись неверна");
            const payload = JSON.parse(b64(p));
            if (payload.exp !== undefined && payload.exp <= nowSec) throw new Error("срок действия истёк");
            return payload;
          }
        `, { filename: "решение" }),
        code("text", `--- приём Set-Cookie (ответ от https://app.example.com) ---
  __Host-id=1; Secure; Path=/                          принят
  __Host-id=1; Secure; Path=/; Domain=example.com      отвергнут: префикс __Host- требует Secure, Path=/ и отсутствия Domain
  __Secure-s=1                                         отвергнут: префикс __Secure- требует Secure
  x=1; SameSite=None                                   отвергнут: SameSite=None без Secure
  y=1; Domain=com                                      отвергнут: Domain — публичный суффикс
  z=aaaaaaaaaaaaaaaaaa…(5002 симв.)                    отвергнут: больше 4096 байт
  ok=1; Domain=example.com                             принят
  other=1; Domain=evil.test                            отвергнут: Domain не покрывает хост ответа

--- какие cookie отправит браузер ---
https://app.example.com/, тот же сайт
    session да
    theme  да
    csrf   да
    admin  нет: другой путь
    wide   да
http://app.example.com/ (без TLS)
    session нет: Secure, а соединение по HTTP
    theme  да
    csrf   да
    admin  нет: другой путь
    wide   да
https://app.example.com/admin/users
    session да
    theme  да
    csrf   да
    admin  да
    wide   да
https://app.example.com/, со страницы evil.test (fetch)
    session нет: Lax не отправляется во вложенных запросах другого сайта
    theme  нет: Lax не отправляется во вложенных запросах другого сайта
    csrf   нет: Strict не отправляется в междусайтовых запросах
    admin  нет: другой путь
    wide   нет: Lax не отправляется во вложенных запросах другого сайта
https://app.example.com/, по ссылке с evil.test (GET)
    session да (Lax: переход по ссылке GET)
    theme  да (Lax: переход по ссылке GET)
    csrf   нет: Strict не отправляется в междусайтовых запросах
    admin  нет: другой путь
    wide   да (Lax: переход по ссылке GET)
https://ads.example.net/, со страницы shop.test
    track  да (SameSite=None разрешает междусайтовые запросы)

HttpOnly-cookie недоступны скрипту: document.cookie их не показывает (защита от кражи сессии через XSS); Secure — только по HTTPS; SameSite — защита от CSRF.

--- сессия на сервере ---
GET /me без cookie → 401 не авторизован
POST-вход с подсунутым sid=attacker-known-id → выдан новый идентификатор (не тот, что подсунули): да
атрибуты выданного cookie: sid=<случайные 32 hex-символа>; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600 ; идентификатор — 32 hex-символа, то есть 128 бит случайности из crypto.randomBytes
GET /me с выданным sid → 200 вы: anna
GET /me с подсунутым sid → 401 не авторизован

--- подписанный токен (JWT, HS256) ---
токен: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbm5hIiwicm9sZSI6InVzZXIiLCJleHAiOjIwMDB9.YXmdW5C0tgGrpPjnxQGmB5DEEK349P3EaA5RfuNICug
проверка:  {"sub":"anna","role":"user","exp":2000}
подмена роли на admin без знания секрета → подпись неверна
атака alg=none → недопустимый алгоритм: none
полезная нагрузка токена не зашифрована, а лишь подписана: любой читает её (base64url): {"sub":"anna","role":"user","exp":2000}
просроченный токен → срок действия истёк`, { filename: "эталон: подмена роли, alg=none и срок действия" }),
        p("Сначала проверяется алгоритм (фиксированный), затем подпись по заранее известному секрету за постоянное время и только потом срок действия. Подмена роли ломает подпись, `alg=none` отвергается ещё до неё. Проверка длин перед `timingSafeEqual` необходима, иначе функция бросит исключение на буферах разной длины."),
      ],
    }),
    exercise({
      id: "cs.tls-caching-cookies.ex3",
      title: "После деплоя пользователи неделю видят старый сайт, а один из них — чужие данные",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Команда выпустила обновление. Часть пользователей неделю видит старую версию интерфейса, а у одного пользователя на странице оказался профиль другого человека. Статические файлы отдаются как `/app.js` и `/style.css` с `Cache-Control: max-age=604800`, HTML — с `max-age=86400`, профиль `/api/me` — без заголовков кеширования через общий CDN. Найдите причины, предложите политику заголовков для трёх типов ресурсов и способ проверки после исправления."),
      ],
      hints: [
        "Что заставит браузер забрать новый `app.js`, если имя файла не меняется?",
        "Что делает общий кеш с ответом без `Cache-Control` и с `Cookie` в запросе?",
        "Как проверить поведение кеша без пользователей: условия и счётчики на сервере?",
      ],
      checks: ["Причина 1: неизменяемое имя + длинный `max-age`", "Причина 2: персональный ответ без `private`/`no-store` в общем кеше", "Политика: файлы с хешем — год и `immutable`; HTML — `no-cache` + `ETag`; API — `private, no-store`", "Проверка: счётчики обращений к источнику и сценарии свежести/проверки"],
      solution: [
        code("text", `--- неизменяемый файл с хешем в имени (max-age 1 год, immutable) ---
t=0         /app.3f9a1c.js                             сеть: полный ответ                   тело по сети:  50000 Б
t=1 сутки   /app.3f9a1c.js                             кеш (свежий, возраст 86400 с)        тело по сети:      0 Б
t=30 суток  /app.3f9a1c.js                             кеш (свежий, возраст 2592000 с)      тело по сети:      0 Б

--- no-cache: хранить, но проверять каждый раз (условный запрос, ETag) ---
t=0         /index.html                                сеть: полный ответ                   тело по сети:  20011 Б
t=10 с      /index.html (не менялся)                   сеть: проверка, ответ 304            тело по сети:      0 Б
t=20 с      /index.html (сервер обновил)               сеть: полный ответ                   тело по сети:  20011 Б

--- max-age=60: свежесть по времени, затем проверка ---
t=0         /api/rates                                 сеть: полный ответ                   тело по сети:   2007 Б
t=30 с      /api/rates                                 кеш (свежий, возраст 30 с)           тело по сети:      0 Б
t=61 с      /api/rates (устарел, данные те же)         сеть: проверка, ответ 304            тело по сети:      0 Б
t=130 с     /api/rates (данные изменились)             сеть: полный ответ                   тело по сети:   2007 Б

--- no-store: ответ с персональными данными не сохраняется ---
t=0         /account                                   сеть (no-store: не сохраняется)      тело по сети:   1032 Б
t=1 с       /account                                   сеть (no-store: не сохраняется)      тело по сети:   1032 Б

--- Vary: Accept-Language: разные представления — разные записи кеша ---
t=0         /lang (ru)                                 сеть: полный ответ                   тело по сети:    503 Б
t=1 с       /lang (en)                                 сеть: полный ответ                   тело по сети:    503 Б
t=2 с       /lang (ru) повторно                        кеш (свежий, возраст 2 с)            тело по сети:      0 Б

обращений к серверу по путям: {"/app.3f9a1c.js":1,"/index.html":3,"/api/rates":3,"/account":2,"/lang":2}
тело по сети всего: 97106 Б; без кеша те же запросы передали бы: 221500 Б; экономия: 56 %`, { filename: "модель политики кеширования" }),
        ul(
          "**Причина 1.** Файлы `/app.js` и `/style.css` не меняют имя и хранятся неделю: браузер не обращается к серверу, пока ответ свеж; HTML кешируется на сутки и ссылается на старые файлы.",
          "**Причина 2.** `/api/me` без `Cache-Control` может быть сохранён общим кешем (CDN) и отдан другому пользователю: персональные ответы должны быть помечены `private` или `no-store` (и/или `Vary: Cookie`/`Authorization`).",
          "**Политика.** Статика с хешем в имени (`app.3f9a1c.js`): `public, max-age=31536000, immutable` — в модели после первого запроса 0 обращений за 30 суток. HTML: `no-cache` + `ETag` — проверка каждый раз, `304` без тела. API: `private, no-store`.",
          "**Проверка.** После деплоя смотреть, что HTML ссылается на новые хешированные файлы; считать обращения к источнику (в модели: файл с хешем — 1, HTML — по числу просмотров, но без тела при `304`); запросить `/api/me` от двух пользователей через CDN и убедиться, что ответы разные; `curl -I` для проверки заголовков.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "cs.tls-caching-cookies.challenge",
    title: "Безопасная и быстрая схема доставки одностраничного приложения",
    scenario: [
      p("Нужно развернуть одностраничное приложение: HTML, хешированная статика, API с личными данными, вход по паролю. Спроектируйте политику TLS, кеширования и cookie, проверьте её на тестовом стенде и объясните, какой риск закрывает каждое решение."),
    ],
    requirements: [
      "Политика TLS: версии, проверка сертификатов, HSTS, автоматическое продление, мониторинг срока",
      "Заголовки кеширования для HTML, статических файлов с хешем и API; `Vary` и `private`/`no-store` для персональных ответов",
      "Cookie сессии: `Secure`, `HttpOnly`, `SameSite`, префикс `__Host-`, новый идентификатор при входе, срок жизни",
      "Хранение паролей: scrypt/Argon2 с солью и подобранной стоимостью (замер времени)",
      "Тесты на стенде: неверное имя, неизвестный центр, просроченный сертификат, подмена токена, сценарии свежести и проверки кеша",
    ],
    constraints: [
      "Нельзя отключать проверку сертификатов даже в тестах — используйте собственный доверенный центр",
      "Нельзя хранить токены доступа в `localStorage`",
      "Алгоритм подписи токена фиксируется на сервере",
    ],
    acceptance: [
      "Проверки сертификата отвергают неверное имя, чужой центр и просроченный сертификат",
      "Файл с хешем получает 0 запросов к серверу при повторных загрузках; HTML — `304` без тела",
      "`/api/me` не сохраняется общим кешем",
      "Подменённый токен и `alg=none` отвергаются; вход выдаёт новый идентификатор сессии",
      "Объяснено, почему TLS 1.3 дешевле TLS 1.2 на один RTT",
    ],
    hints: [
      "Проверьте TLS с собственным центром сертификации и `openssl verify -attime` для будущих дат.",
      "Для кеша измеряйте не только время, но и число обращений к источнику и байты тела.",
      "Для паролей подберите параметры так, чтобы одна проверка занимала порядка сотни миллисекунд.",
    ],
    solution: [
      code("text", `1) соединение с проверкой: протокол TLSv1.3 ; шифр TLS_AES_256_GCM_SHA384 ; сертификат принят: true
   субъект: CN=app.test | издатель: CN=Demo Root CA | SAN: DNS:app.test, DNS:*.app.test, IP Address:127.0.0.1
   ключ сертификата: ec prime256v1 | срок действия: 90 суток

2) имя не совпадает (other.test): ERR_TLS_CERT_ALTNAME_INVALID
   центр не в списке доверенных: UNABLE_TO_VERIFY_LEAF_SIGNATURE
   сертификат выдан другим центром (Rogue CA) для того же имени: UNABLE_TO_VERIFY_LEAF_SIGNATURE
   с отключённой проверкой (rejectUnauthorized: false) соединение с неверным именем «успешно»: authorized = false , причина: «ERR_TLS_CERT_ALTNAME_INVALID» — защиты от подмены нет

3) срок действия сертификата 90 суток; проверка openssl verify:
   сегодня: app.test.pem: OK
   через 100 суток: error 10 at 0 depth lookup: certificate has expired

4) сервер только TLS 1.3 → TLSv1.3 / TLS_AES_256_GCM_SHA384 ; сервер до TLS 1.2 → TLSv1.2 / ECDHE-ECDSA-AES128-GCM-SHA256 ; клиент до 1.2 к серверу только 1.3 → ошибка ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION

5) ALPN: клиент предлагает [http/1.1] → http/1.1 ; предлагает [h2, http/1.1] → h2 (сервер выбирает общий протокол)
   SNI: клиент просит app.test → app.test ; api.test → api.test (один IP и порт, два сертификата)

6) возобновление сессии по билету: получен билет: true ; повторное соединение использует сессию: true

7) наблюдатель между клиентом и сервером видит:
   первая запись — тип 22 (22 = handshake), версия записи 0x301 ; имя сервера из SNI открыто: да
   пароль из запроса в потоке не найден (данные зашифрованы): да
   записи прикладных данных имеют тип 23: да`, { filename: "стенд TLS: проверки и версии" }),
      code("text", `--- неизменяемый файл с хешем в имени (max-age 1 год, immutable) ---
t=0         /app.3f9a1c.js                             сеть: полный ответ                   тело по сети:  50000 Б
t=1 сутки   /app.3f9a1c.js                             кеш (свежий, возраст 86400 с)        тело по сети:      0 Б
t=30 суток  /app.3f9a1c.js                             кеш (свежий, возраст 2592000 с)      тело по сети:      0 Б

--- no-cache: хранить, но проверять каждый раз (условный запрос, ETag) ---
t=0         /index.html                                сеть: полный ответ                   тело по сети:  20011 Б
t=10 с      /index.html (не менялся)                   сеть: проверка, ответ 304            тело по сети:      0 Б
t=20 с      /index.html (сервер обновил)               сеть: полный ответ                   тело по сети:  20011 Б

--- max-age=60: свежесть по времени, затем проверка ---
t=0         /api/rates                                 сеть: полный ответ                   тело по сети:   2007 Б
t=30 с      /api/rates                                 кеш (свежий, возраст 30 с)           тело по сети:      0 Б
t=61 с      /api/rates (устарел, данные те же)         сеть: проверка, ответ 304            тело по сети:      0 Б
t=130 с     /api/rates (данные изменились)             сеть: полный ответ                   тело по сети:   2007 Б

--- no-store: ответ с персональными данными не сохраняется ---
t=0         /account                                   сеть (no-store: не сохраняется)      тело по сети:   1032 Б
t=1 с       /account                                   сеть (no-store: не сохраняется)      тело по сети:   1032 Б

--- Vary: Accept-Language: разные представления — разные записи кеша ---
t=0         /lang (ru)                                 сеть: полный ответ                   тело по сети:    503 Б
t=1 с       /lang (en)                                 сеть: полный ответ                   тело по сети:    503 Б
t=2 с       /lang (ru) повторно                        кеш (свежий, возраст 2 с)            тело по сети:      0 Б

обращений к серверу по путям: {"/app.3f9a1c.js":1,"/index.html":3,"/api/rates":3,"/account":2,"/lang":2}
тело по сети всего: 97106 Б; без кеша те же запросы передали бы: 221500 Б; экономия: 56 %`, { filename: "стенд кеша" }),
      code("text", `--- приём Set-Cookie (ответ от https://app.example.com) ---
  __Host-id=1; Secure; Path=/                          принят
  __Host-id=1; Secure; Path=/; Domain=example.com      отвергнут: префикс __Host- требует Secure, Path=/ и отсутствия Domain
  __Secure-s=1                                         отвергнут: префикс __Secure- требует Secure
  x=1; SameSite=None                                   отвергнут: SameSite=None без Secure
  y=1; Domain=com                                      отвергнут: Domain — публичный суффикс
  z=aaaaaaaaaaaaaaaaaa…(5002 симв.)                    отвергнут: больше 4096 байт
  ok=1; Domain=example.com                             принят
  other=1; Domain=evil.test                            отвергнут: Domain не покрывает хост ответа

--- какие cookie отправит браузер ---
https://app.example.com/, тот же сайт
    session да
    theme  да
    csrf   да
    admin  нет: другой путь
    wide   да
http://app.example.com/ (без TLS)
    session нет: Secure, а соединение по HTTP
    theme  да
    csrf   да
    admin  нет: другой путь
    wide   да
https://app.example.com/admin/users
    session да
    theme  да
    csrf   да
    admin  да
    wide   да
https://app.example.com/, со страницы evil.test (fetch)
    session нет: Lax не отправляется во вложенных запросах другого сайта
    theme  нет: Lax не отправляется во вложенных запросах другого сайта
    csrf   нет: Strict не отправляется в междусайтовых запросах
    admin  нет: другой путь
    wide   нет: Lax не отправляется во вложенных запросах другого сайта
https://app.example.com/, по ссылке с evil.test (GET)
    session да (Lax: переход по ссылке GET)
    theme  да (Lax: переход по ссылке GET)
    csrf   нет: Strict не отправляется в междусайтовых запросах
    admin  нет: другой путь
    wide   да (Lax: переход по ссылке GET)
https://ads.example.net/, со страницы shop.test
    track  да (SameSite=None разрешает междусайтовые запросы)

HttpOnly-cookie недоступны скрипту: document.cookie их не показывает (защита от кражи сессии через XSS); Secure — только по HTTPS; SameSite — защита от CSRF.

--- сессия на сервере ---
GET /me без cookie → 401 не авторизован
POST-вход с подсунутым sid=attacker-known-id → выдан новый идентификатор (не тот, что подсунули): да
атрибуты выданного cookie: sid=<случайные 32 hex-символа>; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600 ; идентификатор — 32 hex-символа, то есть 128 бит случайности из crypto.randomBytes
GET /me с выданным sid → 200 вы: anna
GET /me с подсунутым sid → 401 не авторизован

--- подписанный токен (JWT, HS256) ---
токен: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbm5hIiwicm9sZSI6InVzZXIiLCJleHAiOjIwMDB9.YXmdW5C0tgGrpPjnxQGmB5DEEK349P3EaA5RfuNICug
проверка:  {"sub":"anna","role":"user","exp":2000}
подмена роли на admin без знания секрета → подпись неверна
атака alg=none → недопустимый алгоритм: none
полезная нагрузка токена не зашифрована, а лишь подписана: любой читает её (base64url): {"sub":"anna","role":"user","exp":2000}
просроченный токен → срок действия истёк`, { filename: "стенд cookie и токенов" }),
      p("TLS 1.3 с автоматическим продлением сертификатов (срок 90 суток) и HSTS; проверка цепочки и имени, собственный корневой центр для тестового стенда (в замере: неверное имя, чужой центр и просроченная дата отвергаются). Кеширование: файлы с хешем — `public, max-age=31536000, immutable` (0 обращений за 30 суток), HTML — `no-cache` + `ETag` (`304` без тела), `/api/me` — `private, no-store`; итог в модели — 97 106 байт вместо 221 500. Сессия: cookie `__Host-sid` с `Secure; HttpOnly; SameSite=Lax; Path=/`, идентификатор — 128 бит случайности, новый при входе (в замере подсунутый идентификатор не принят). Пароли — scrypt с солью (в замере ≈ 107 мс на пароль против 2 мкс у SHA-256). TLS 1.3 дешевле TLS 1.2 на один круг RTT: клиент сразу отправляет ключевую долю в `ClientHello` (в замере 85 против 125 мс при RTT 40 мс)."),
    ],
  },

  interview: [
    iq("cs.tls-caching-cookies.i1", "basic", "Что даёт HTTPS и чего он не даёт?", [
      ul(
        "Конфиденциальность и целостность (шифрование с аутентификацией) и подлинность сервера (сертификат): пароль из запроса на проводе не виден, подмена шифртекста обнаруживается.",
        "Не скрывает метаданные (адреса, объём, время, имя в SNI) и не защищает от уязвимостей самого сервера и клиента.",
        "Проверка сертификата обязательна: при `rejectUnauthorized: false` в замере соединение с неверным именем принималось.",
      ),
    ]),
    iq("cs.tls-caching-cookies.i2", "basic", "Для чего нужны `Cache-Control` и `ETag`?", [
      ul(
        "`Cache-Control` задаёт, можно ли хранить ответ и как долго он свеж (`max-age`, `no-store`, `private`); `ETag` позволяет проверить, изменилась ли версия: ответ `304` без тела.",
        "В замере файл с хешем в имени не запрашивался повторно 30 суток, а HTML проверялся без передачи 20 000 байт.",
        "`no-cache` не запрещает хранение — требует проверки.",
      ),
    ]),
    iq("cs.tls-caching-cookies.i3", "intermediate", "Как клиент проверяет сертификат сервера?", [
      ul(
        "Проверяет подписи цепочки до доверенного корня, срок действия, назначение и соответствие имени из URL значениям SAN.",
        "Ошибки в замере: `ERR_TLS_CERT_ALTNAME_INVALID` (неверное имя), `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (неизвестный центр), `certificate has expired` (срок).",
        "Дополнительно: отзыв (OCSP), прозрачность сертификатов, закрепление ключей в особых случаях.",
      ),
    ]),
    iq("cs.tls-caching-cookies.i4", "intermediate", "Почему TLS 1.3 быстрее TLS 1.2?", [
      ul(
        "Рукопожатие 1 RTT вместо 2: клиент отправляет ключевую долю в первом сообщении.",
        "В замере при RTT 40 мс до готовности соединения ≈ 85 мс (TLS 1.3) и ≈ 125 мс (TLS 1.2).",
        "Кроме того, в 1.3 только современные шифры и эфемерный обмен ключами (прямая секретность); возобновление сессии убирает цепочку сертификатов (≈ 1330 против 1850 байт).",
      ),
    ]),
    iq("cs.tls-caching-cookies.i5", "intermediate", "Для чего нужны `Secure`, `HttpOnly` и `SameSite` у cookie?", [
      ul(
        "`Secure` — только по HTTPS (в модели по HTTP сессия не отправляется); `HttpOnly` — недоступно скриптам (защита от кражи через XSS); `SameSite` — не отправлять в междусайтовых запросах (защита от CSRF).",
        "Префикс `__Host-` требует `Secure`, `Path=/` и отсутствия `Domain`: поддомен не подменит cookie.",
        "Идентификатор сессии — 128 бит случайности; при входе выдаётся новый (защита от фиксации).",
      ),
    ]),
    iq("cs.tls-caching-cookies.i6", "advanced", "Сессия на сервере или JWT: что выбрать?", [
      ul(
        "Сессия: cookie с идентификатором, состояние на сервере; легко отозвать, нужна общая память или база при нескольких серверах.",
        "JWT: подписанные данные, проверка без обращения к хранилищу; отозвать трудно, нагрузка читается (подпись, а не шифрование); обязательно фиксировать алгоритм (замер: `alg=none` отвергнут) и срок.",
        "Для браузерных приложений часто достаточно сессии в `HttpOnly`-cookie; JWT — для межсервисных вызовов с короткой жизнью.",
      ),
    ]),
    iq("cs.tls-caching-cookies.i7", "engineering", "Как настроить кеширование для одностраничного приложения?", [
      ul(
        "Статика с хешем в имени: `public, max-age=31536000, immutable`; HTML: `no-cache` + `ETag`; API с персональными данными: `private, no-store`; `Vary` при зависимости от заголовков.",
        "В модели: 97 106 байт вместо 221 500 (−56 %), файл с хешем — 1 запрос за 30 суток, HTML — `304` без тела.",
        "Проверка после деплоя: счётчики обращений к источнику, `curl -I`, тесты от двух пользователей через CDN.",
      ),
    ]),
    iq("cs.tls-caching-cookies.i8", "debugging", "Пользователи видят старую версию сайта после деплоя. Что проверите?", [
      ul(
        "Заголовки HTML и статики: длинный `max-age` на файлах без хеша в имени; кеш CDN; кеширование `index.html`.",
        "Исправление: менять имя файлов при изменении (хеш), HTML — `no-cache`/`ETag`, инвалидировать кеш CDN.",
        "Проверить Service Worker, если используется, и версии в манифесте.",
      ),
    ]),
  ],

  exam: [
    mcq("cs.tls-caching-cookies.e1", "foundation", "Что означает `Cache-Control: no-store`?", ["Ответ можно хранить, но проверять", "Ответ хранится год", "Ответ нельзя сохранять ни в каком кеше", "Ответ можно хранить только в браузере"], 2, "`no-store` запрещает сохранение (в замере персональный ответ шёл по сети оба раза); `no-cache` — наоборот, хранить можно, но проверять каждый раз."),
    mcq("cs.tls-caching-cookies.e2", "foundation", "Какой атрибут cookie скрывает его от `document.cookie`?", ["HttpOnly", "Secure", "SameSite", "Path"], 0, "`HttpOnly` запрещает доступ из JavaScript: при XSS скрипт не прочитает идентификатор сессии (но может выполнять запросы от имени пользователя)."),
    mcq("cs.tls-caching-cookies.e3", "foundation", "Чем MAC (HMAC) отличается от обычного хеша?", ["Ничем", "Короче хеша", "Шифрует данные", "Использует секретный ключ, поэтому подтверждает и целостность, и знание ключа"], 3, "Хеш может вычислить кто угодно; HMAC требует секретного ключа (в замере — вектор RFC 4231), поэтому подделать сообщение без ключа нельзя."),
    mcq("cs.tls-caching-cookies.e4", "intermediate", "Сколько RTT требует рукопожатие TLS 1.3 по сравнению с TLS 1.2?", ["Одинаково", "1 против 2", "2 против 1", "0 против 3"], 1, "В TLS 1.3 клиент отправляет ключевую долю сразу, рукопожатие завершается за 1 RTT (замер: 85 против 125 мс при RTT 40 мс); у TLS 1.2 — 2 RTT."),
    mcq("cs.tls-caching-cookies.e5", "intermediate", "Что вернёт сервер на условный запрос с актуальным `If-None-Match`?", ["200 с полным телом", "412", "404", "304 без тела"], 3, "`304 Not Modified` без тела продлевает свежесть копии (в замере для HTML 0 байт тела вместо 20 011)."),
    mcq("cs.tls-caching-cookies.e6", "intermediate", "Почему повтор nonce с тем же ключом в режиме CTR/GCM опасен?", ["Замедляет шифрование", "Меняет ключ", "XOR шифртекстов раскрывает XOR открытых текстов", "Увеличивает размер сообщения"], 2, "В замере XOR двух шифртекстов совпал с XOR открытых текстов: зная одно сообщение, атакующий восстановил второе без ключа."),
    mcq("cs.tls-caching-cookies.e7", "advanced", "Какие утверждения верны? Выберите все.", ["Подпись JWT скрывает его содержимое от читателя", "`SameSite=Lax` не отправляется при междусайтовом `fetch` POST, но отправляется при переходе по ссылке GET", "Файл с хешем в имени можно кешировать на год", "`rejectUnauthorized: false` сохраняет защиту от подмены сервера"], [1, 2], "Подпись только защищает от изменений, нагрузка читается; `Lax` отправляется при переходе GET по ссылке; хеш в имени позволяет `immutable` на год; отключение проверки лишает защиты от подмены."),
    open("cs.tls-caching-cookies.e8", "intermediate", "Объясните, почему хранить пароли нужно медленным хешем с солью, и какие параметры вы бы выбрали.", [
      ul(
        "Быстрый хеш (SHA-256: ≈ 2 мкс на попытку) позволяет перебирать миллиарды паролей; scrypt при N = 2¹⁵ — ≈ 107 мс на попытку, то есть на десятки тысяч раз дороже.",
        "Соль (уникальная случайная строка на пользователя) делает хеши одинаковых паролей разными и лишает атакующего готовых таблиц.",
        "Параметры подбирают так, чтобы проверка занимала порядка 100 мс на сервере (память и время), и периодически повышают; предпочтительны Argon2, scrypt, bcrypt.",
      ),
    ], ["Названа разница скоростей быстрого и медленного хеша", "Названа соль и её роль", "Названы алгоритмы", "Упомянут подбор параметров по времени"]),
  ],

  mastery: [
    mcq("cs.tls-caching-cookies.m1", "intermediate", "Почему в сценарии кеширования HTML с `no-cache` + `ETag` по сети передаётся 0 байт тела при повторном запросе, но запрос к серверу всё равно идёт?", ["Это ошибка кеша", "`no-cache` требует проверки; сервер отвечает `304` без тела, подтверждая, что копия актуальна", "Сервер не получает запрос", "Кеш обновляет HTML самостоятельно"], 1, "Проверка стоит одного круга RTT, но экономит передачу тела (в замере 20 011 байт); поэтому `no-cache` подходит для HTML, который должен быть актуальным."),
    mcq("cs.tls-caching-cookies.m2", "advanced", "Почему возобновление сессии в TLS 1.3 не сократило число кругов RTT в замере, но всё же полезно?", ["Остаётся 1 RTT, но не передаётся цепочка сертификатов и не проверяется подпись: меньше байт и вычислений", "Оно бесполезно", "Оно отключает шифрование", "Оно работает только по HTTP"], 0, "В замере 84 мс против 85 мс, но сервер отправил около 1330 байт вместо 1850: экономится передача и проверка сертификата."),
    mcq("cs.tls-caching-cookies.m3", "advanced", "Какую роль играет `Vary: Accept-Language` в общем кеше?", ["Ускоряет TLS", "Шифрует ответ", "Различает записи кеша по значению заголовка запроса, чтобы не отдать русскую версию англоязычному клиенту", "Запрещает кеширование"], 2, "В замере русская и английская версии — две записи кеша; повторный русский запрос взят из кеша без обращения к серверу."),
    open("cs.tls-caching-cookies.m4", "advanced", "Спроектируйте выпуск и продление сертификатов для сотни внутренних сервисов: автоматизация, срок жизни, мониторинг, отзыв, доверие, аварийные процедуры.", [
      ul(
        "Собственный центр сертификации (или управляемый сервис) с автоматической выдачей по протоколу вроде ACME; короткие сроки (дни–недели) снижают зависимость от отзыва.",
        "Автоматическое продление агентом на каждом сервисе за заранее заданное время до истечения; хранение ключей в менеджере секретов, права доступа, отсутствие ключей в образах.",
        "Мониторинг: срок действия каждого сертификата, цепочка, имена в SAN, ошибки рукопожатий; оповещения за недели до истечения (в замере `openssl verify` ловит «certificate has expired»).",
        "Доверие и отзыв: распространение корня во все клиенты, ротация промежуточных центров, список отзыва или короткие сроки; аварийный план — быстрый выпуск, отдельный резервный центр, тесты процедуры.",
      ),
    ], ["Автоматизация выдачи и продления", "Короткие сроки и хранение ключей", "Мониторинг сроков и цепочек", "Доверие, отзыв и аварийный план"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "cs.tls-caching-cookies.f1", front: "Примитивы?", back: "Хеш (SHA-256), HMAC (ключ), AEAD (AES-GCM: тег 16 Б), ECDH (общий секрет), подпись (Ed25519: 64 Б). Повтор nonce раскрывает XOR текстов." },
    { id: "cs.tls-caching-cookies.f2", front: "Проверка сертификата?", back: "Цепочка до доверенного корня + SAN содержит имя + срок + назначение. Ошибки: ALTNAME_INVALID, UNABLE_TO_VERIFY_LEAF_SIGNATURE, expired." },
    { id: "cs.tls-caching-cookies.f3", front: "Цена TLS?", back: "TLS 1.3 — 1 RTT (≈ 85 мс при RTT 40 мс от начала), TLS 1.2 — 2 RTT (≈ 125 мс). Возобновление: без сертификата (≈ 1330 вместо 1850 Б)." },
    { id: "cs.tls-caching-cookies.f4", front: "Что видно на проводе?", back: "Адреса, объём, время, SNI. Не видно: содержимое (записи типа 23)." },
    { id: "cs.tls-caching-cookies.f5", front: "Кеш по типам?", back: "Хешированная статика: public, max-age=1 год, immutable. HTML: no-cache + ETag (304). Персональное: private, no-store. Vary по заголовкам." },
    { id: "cs.tls-caching-cookies.f6", front: "Cookie-флаги?", back: "Secure (только HTTPS), HttpOnly (не для JS), SameSite (CSRF), __Host- (Secure, Path=/, без Domain), Max-Age." },
    { id: "cs.tls-caching-cookies.f7", front: "JWT?", back: "Подписано, не зашифровано. Фиксируйте алгоритм (alg=none отвергать), проверяйте подпись за постоянное время и срок; секреты не в нагрузке." },
    { id: "cs.tls-caching-cookies.f8", front: "Пароли?", back: "scrypt/Argon2/bcrypt + соль: ≈ 107 мс на попытку против 2 мкс у SHA-256. Не быстрые хеши." },
  ],

  sources: [
    { title: "RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3", url: "https://www.rfc-editor.org/rfc/rfc8446", publisher: "IETF" },
    { title: "RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile", url: "https://www.rfc-editor.org/rfc/rfc5280", publisher: "IETF" },
    { title: "RFC 9111: HTTP Caching", url: "https://www.rfc-editor.org/rfc/rfc9111", publisher: "IETF" },
    { title: "RFC 6265: HTTP State Management Mechanism (Cookies)", url: "https://www.rfc-editor.org/rfc/rfc6265", publisher: "IETF" },
    { title: "RFC 7519: JSON Web Token (JWT)", url: "https://www.rfc-editor.org/rfc/rfc7519", publisher: "IETF" },
    { title: "RFC 4231: Identifiers and Test Vectors for HMAC-SHA-224, -256, -384, and -512", url: "https://www.rfc-editor.org/rfc/rfc4231", publisher: "IETF" },
    { title: "RFC 6797: HTTP Strict Transport Security (HSTS)", url: "https://www.rfc-editor.org/rfc/rfc6797", publisher: "IETF" },
    { title: "NIST FIPS 180-4: Secure Hash Standard (SHS)", url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final", publisher: "Other" },
    { title: "MDN: HTTP caching, HTTP cookies и Transport Layer Security", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching", publisher: "MDN" },
  ],
};
