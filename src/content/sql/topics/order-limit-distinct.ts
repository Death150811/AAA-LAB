import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  table,
  def,
  wrongRight,
  beforeAfter,
  annotated,
  steps,
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const orderLimitDistinct: Topic = {
  id: "sql.order-limit-distinct",
  slug: "order-limit-distinct",
  domain: "sql",
  module: "queries",
  title: "ORDER BY, LIMIT и DISTINCT",
  titleEn: "ORDER BY, LIMIT and DISTINCT",
  summary:
    "`ORDER BY` — единственный способ получить определённый порядок строк, `LIMIT` и `OFFSET` обрезают результат, `DISTINCT` убирает повторы. Тема на замерах PostgreSQL 16.14 показывает, как сортировать по нескольким ключам и выражениям, почему порядок строк с равными ключами не определён без «последнего ключа» (страницы по 3 строки пересеклись по порядку: `1, 4, 2` против `1, 2, 4`), как правила сортировки (collation) меняют порядок кириллицы (`ёж` после `яма` или между `еж` и `ёлка`), почему `OFFSET` ухудшается с номером страницы (на 2 млн строк 94–122 мс против 0,02–0,06 мс у keyset-пагинации), чем `DISTINCT` отличается от `DISTINCT ON` и `FETCH FIRST … WITH TIES`.",
  minutes: 70,
  prerequisites: ["sql.select-where"],
  tags: ["ORDER BY", "LIMIT", "OFFSET", "DISTINCT", "DISTINCT ON", "pagination", "keyset pagination", "collation", "NULLS FIRST", "FETCH FIRST WITH TIES", "tie-breaker", "deterministic"],
  keyConcepts: [
    { term: "Порядок задаёт только ORDER BY", text: "Без `ORDER BY` строки приходят в любом порядке. Сортировка по неуникальному ключу оставляет порядок внутри равных значений неопределённым — добавляйте уникальный «последний ключ» (`id`)." },
    { term: "LIMIT без ORDER BY — баг", text: "`LIMIT 3` вернёт «какие-то» три строки. В замере страницы `OFFSET 0` и `OFFSET 3` с `ORDER BY status` дали порядок `1, 4, 2` внутри `paid`; с `ORDER BY status, id` — `1, 2, 4`." },
    { term: "OFFSET читает и выбрасывает строки", text: "Страница с `OFFSET 1500000` на 2 млн строк прочитала 1 500 010 записей индекса (94–122 мс); keyset `WHERE id > 1500000 LIMIT 10` — 10 записей (0,02–0,06 мс)." },
    { term: "Collation меняет порядок строк", text: "В базе с C.UTF-8 `Ёлка, Яма, еж, ель, жук, яма, ёж, ёлка` (по кодам символов), с `COLLATE \"ru-x-icu\"` — `еж, ёж, ёлка, Ёлка, ель, жук, яма, Яма` (по правилам языка)." },
    { term: "DISTINCT сравнивает строки целиком", text: "`SELECT DISTINCT city` вернул 4 значения (3 города и `NULL` — повторяющиеся `NULL` считаются одинаковыми); `DISTINCT ON (customer_id)` в PostgreSQL оставляет первую строку каждой группы." },
  ],
  sections: [
    section("definition", [
      def("ORDER BY", "Предложение, задающее порядок строк результата: список выражений с направлением `ASC` (по умолчанию) или `DESC` и, при необходимости, `NULLS FIRST/LAST`.", "ORDER BY"),
      def("LIMIT / OFFSET", "`LIMIT n` оставляет не больше `n` строк, `OFFSET k` пропускает первые `k`. Стандартная форма: `OFFSET k ROWS FETCH FIRST n ROWS ONLY`.", "LIMIT / OFFSET"),
      def("DISTINCT", "Убирает дубликаты строк результата: две строки одинаковы, если равны все выбранные значения (`NULL` считаются одинаковыми).", "DISTINCT"),
      def("Детерминированный запрос", "Запрос, который при одних и тех же данных всегда возвращает один и тот же результат, включая порядок строк.", "deterministic query"),
      def("Keyset-пагинация", "Постраничный вывод «после последней увиденной строки»: условие по ключу сортировки вместо `OFFSET`; стоимость страницы не зависит от её номера.", "keyset (seek) pagination"),
      def("Collation", "Правила сравнения и сортировки строк: регистр, диакритика, алфавит языка. Задаются для базы, столбца или выражения (`COLLATE`).", "collation"),
      def("DISTINCT ON", "Расширение PostgreSQL: оставляет по одной (первой по `ORDER BY`) строке для каждого значения выражения в скобках.", "DISTINCT ON"),
    ]),

    section("why", [
      h("Порядок и «первые N» — частые источники ошибок"),
      p("Пользователь видит ленту заказов, топ-10 товаров, «следующую страницу». Всё это — `ORDER BY` + `LIMIT`. Неверные ключи сортировки приводят к тому, что одни и те же записи показываются на двух страницах, а другие не показываются вообще; ошибка не воспроизводится в тестах на маленьких данных. Нестабильный порядок — один из самых коварных видов багов: «работало, пока данных было мало»."),
      ul(
        "**Корректность страниц:** без уникального ключа сортировки соседние страницы могут пересекаться или терять строки.",
        "**Производительность:** `OFFSET` пропорционален номеру страницы, а сортировка без индекса — полному просмотру и сортировке таблицы.",
        "**Правильные уникальные значения:** `DISTINCT` иногда нужен, но чаще маскирует ошибку в соединениях.",
        "**Языковые правила:** порядок русских строк зависит от настроек базы данных.",
      ),
    ]),

    section("mental-model", [
      h("Результат запроса — мешок, пока вы не отсортировали"),
      p("До `ORDER BY` результат — «мешок» строк без порядка. Сортировка превращает его в последовательность — но только настолько, насколько ключи различают строки. Строки с равными ключами остаются в мешке: их взаимный порядок не определён. Поэтому правильный ключ сортировки — **уникальный**: `ORDER BY ordered_on DESC, id DESC`."),
      diagram(
        `
        ORDER BY status            ORDER BY status, id
        ┌───────────┬────┐         ┌───────────┬────┐
        │ cancelled │  5 │         │ cancelled │  5 │
        │ cancelled │ 13 │         │ cancelled │ 13 │
        │ new       │  6 │         │ new       │  6 │
        │ paid      │  1 │ ← вперёд │ paid      │  1 │
        │ paid      │  4 │   может │ paid      │  2 │ ← всегда по id
        │ paid      │  2 │ быть что │ paid      │  4 │
        └───────────┴────┘  угодно └───────────┴────┘
        `,
        "Равные значения `paid` внутри первого запроса идут в произвольном порядке; второй ключ делает порядок однозначным.",
      ),
      h("OFFSET или «после»"),
      p("`OFFSET 150000` означает «прочитай 150 000 строк, выбрось их и верни следующие». Чем дальше страница, тем больше выбрасывается. Keyset-подход запоминает **последнюю увиденную строку** и просит «строки после неё»: индекс позволяет перейти сразу к нужному месту."),
      steps(
        [
          ["Выберите порядок", "Ключи сортировки должны давать уникальную последовательность: добавьте `id` в конец."],
          ["Первая страница", "`ORDER BY created_at DESC, id DESC LIMIT n`."],
          ["Следующая страница", "`WHERE (created_at, id) < (:last_created, :last_id) ORDER BY … LIMIT n`."],
          ["Индекс", "Сделайте индекс на ключах сортировки в том же порядке — тогда страница стоит одинаково везде."],
        ],
        "Keyset-пагинация по шагам",
      ),
    ]),

    section("technical", [
      h("ORDER BY"),
      ul(
        "Несколько ключей: `ORDER BY category, price DESC` — сначала по категории, внутри — по цене по убыванию.",
        "Ключ может быть столбцом, выражением (`length(title)`), псевдонимом из `SELECT` или номером столбца (`ORDER BY 2` — не рекомендуется: ломается при изменении списка).",
        "`NULL` в PostgreSQL по умолчанию считаются «большими»: последними при `ASC`, первыми при `DESC`; в SQLite наоборот. Явно: `NULLS FIRST` / `NULLS LAST`.",
        "Строки сортируются по правилам collation: регистр, ё/е, диакритика зависят от настроек (`COLLATE \"ru-x-icu\"`).",
        "Сортировка — самая дорогая часть запроса, если нет подходящего индекса: большой результат сортируется в памяти или на диске.",
      ),
      h("LIMIT, OFFSET, FETCH FIRST"),
      table(
        ["Форма", "Смысл", "Замечание"],
        [
          ["`LIMIT n`", "Не больше `n` строк", "Расширение (PostgreSQL, SQLite, MySQL)"],
          ["`LIMIT n OFFSET k`", "Пропустить `k`, взять `n`", "Стоимость растёт с `k`"],
          ["`OFFSET k ROWS FETCH FIRST n ROWS ONLY`", "Стандартный SQL", "Эквивалент `LIMIT/OFFSET`"],
          ["`FETCH FIRST n ROWS WITH TIES`", "`n` строк и все с таким же значением ключа сортировки", "PostgreSQL 13+; обязателен `ORDER BY`"],
        ],
        "Ограничение числа строк",
      ),
      h("DISTINCT"),
      ul(
        "`SELECT DISTINCT a, b` убирает повторы пар `(a, b)`; `NULL` считаются одинаковыми.",
        "`count(DISTINCT x)` считает различные непустые значения.",
        "`DISTINCT ON (x)` (PostgreSQL) оставляет первую строку для каждого `x` по `ORDER BY` — удобно для «последнего заказа клиента».",
        "Реализуется сортировкой или хэшированием: на больших таблицах это отдельная стоимость.",
      ),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `-- Лента: заказы от новых к старым, страница по 4; следующая страница — после последней увиденной пары (дата, id)
SELECT id, ordered_on, status
FROM orders
ORDER BY ordered_on DESC, id DESC
LIMIT 4;

SELECT id, ordered_on, status
FROM orders
WHERE (ordered_on, id) < ('2024-05-06', 10)
ORDER BY ordered_on DESC, id DESC
LIMIT 4;`,
        [
          { line: 1, text: "Комментарий: лента от новых к старым, страница по 4." },
          { line: [2, 5], text: "Первая страница: ключи сортировки `ordered_on DESC, id DESC` уникальны (дата + `id`), `LIMIT 4` берёт верх." },
          { line: [7, 11], text: "Следующая страница: `WHERE (ordered_on, id) < (…)` — сравнение пар (row value) с последней увиденной строкой." },
          { line: 10, text: "Те же ключи сортировки — иначе «после» не имеет смысла." },
          { line: 11, text: "`LIMIT 4` — размер страницы; `OFFSET` не нужен." },
        ],
        "12-challenge.sql",
      ),
    ]),

    section("minimal-example", [
      p("Сортировка по двум ключам: категории по алфавиту, внутри категории — по убыванию цены. Попробуйте поменять направление и нажмите «Выполнить в браузере»."),
      code("sql", `-- несколько ключей: категория по алфавиту, внутри — от дорогих к дешёвым
SELECT category, title, price
FROM products
ORDER BY category, price DESC;`, { filename: "01-order-multi.sql", runnable: true, fixture: "shop" }),
      code("text", ` category |        title        |  price  
----------+---------------------+---------
 напитки  | Кофе зерновой 1 кг  | 1200.00
 напитки  | Какао 250 г         |  380.00
 напитки  | Чай чёрный 100 г    |  250.00
 посуда   | Чайник стальной     | 2300.00
 посуда   | Френч-пресс         | 1900.00
 посуда   | Термокружка         |  990.00
 посуда   | Кружка керамическая |  450.00
 продукты | Мёд 300 г           |  520.00
 продукты | Печенье овсяное     |  140.00
 продукты | Сахар 1 кг          |   90.00
(10 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первый ключ группирует строки, второй упорядочивает внутри групп. Если бы цены совпали, порядок таких товаров между собой не был бы определён — для надёжности нужен третий ключ (`id`)."),
    ]),

    section("detailed-example", [
      p("Три приёма в одном: сортировка по выражению и псевдониму, сортировка по номеру столбца, ограничение числа строк."),
      code("sql", `-- сортировка по выражению, по псевдониму и по номеру столбца
SELECT title, length(title) AS len FROM products ORDER BY len DESC, title LIMIT 4;
SELECT title, price FROM products ORDER BY 2 DESC, 1 LIMIT 3;`, { filename: "02-order-expression.sql", runnable: true, fixture: "shop" }),
      code("text", `        title        | len 
---------------------+-----
 Кружка керамическая |  19
 Кофе зерновой 1 кг  |  18
 Чай чёрный 100 г    |  16
 Печенье овсяное     |  15
(4 rows)

       title        |  price  
--------------------+---------
 Чайник стальной    | 2300.00
 Френч-пресс        | 1900.00
 Кофе зерновой 1 кг | 1200.00
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Первый запрос сортирует по длине названия (псевдоним `len` допустим в `ORDER BY`), второй — по второму столбцу (цене) и затем по первому. Обратите внимание: у двух товаров разная длина названия, поэтому дополнительный ключ `title` здесь нужен только как «страховка»."),
      h("Ничья на границе LIMIT"),
      code("sql", `-- Три первых по категории: но в категории «напитки» три товара, а «посуда» — четыре
SELECT id, category, title FROM products ORDER BY category, id LIMIT 3;

-- Без дополнительного ключа порядок внутри одинаковых категорий не определён:
-- «первые три» ненадёжны. Решение — уникальный второй ключ (id).
SELECT category, count(*) AS products_in_category FROM products GROUP BY category ORDER BY category;`, { filename: "04-limit-ties.sql", runnable: true, fixture: "shop" }),
      code("text", ` id | category |       title        
----+----------+--------------------
  1 | напитки  | Кофе зерновой 1 кг
  2 | напитки  | Чай чёрный 100 г
  9 | напитки  | Какао 250 г
(3 rows)

 category | products_in_category 
----------+----------------------
 напитки  |                    3
 посуда   |                    4
 продукты |                    3
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("В категории «напитки» три товара, и `LIMIT 3` ровно её и забрал. Если бы мы взяли `LIMIT 2` только по `ORDER BY category`, какие два из трёх напитков вернутся, было бы не определено; поэтому второй ключ — уникальный `id` — обязателен."),
    ]),

    section("analysis", [
      table(
        ["Запрос", "Что гарантировано", "Что нет"],
        [
          ["`ORDER BY category`", "Категории по возрастанию", "Порядок товаров внутри категории"],
          ["`ORDER BY category, id`", "Полный детерминированный порядок", "—"],
          ["`ORDER BY price DESC LIMIT 2 OFFSET 1`", "Второй и третий по цене товары (id 4 и 1 в замере)", "Какие из товаров с равной ценой попадут на границу"],
          ["`SELECT DISTINCT city`", "Уникальные значения (4 в замере, включая `NULL`)", "Порядок строк (без `ORDER BY`)"],
          ["`DISTINCT ON (customer_id) … ORDER BY customer_id, ordered_on DESC`", "Для каждого клиента последняя по дате строка", "Какая именно, если даты равны (добавьте `id DESC`)"],
        ],
        "Что гарантирует каждая форма",
      ),
      code("sql", `SELECT city FROM customers ORDER BY city NULLS LAST;
SELECT DISTINCT city FROM customers ORDER BY city NULLS LAST;
SELECT count(*) AS rows_total, count(city) AS non_null, count(DISTINCT city) AS distinct_cities FROM customers;`, { filename: "06-distinct.sql", runnable: true, fixture: "shop" }),
      code("text", `  city  
--------
 Казань
 Казань
 Москва
 Москва
 Москва
 Самара
 Самара
 
(8 rows)

  city  
--------
 Казань
 Москва
 Самара
 
(4 rows)

 rows_total | non_null | distinct_cities 
------------+----------+-----------------
          8 |        7 |               3
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Без `DISTINCT` 8 строк, из них города повторяются; с `DISTINCT` — 4: три города и `NULL` (одна запись для всех `NULL`).",
        "`count(DISTINCT city)` вернул 3, а `count(city)` — 7, `count(*)` — 8: различные значения, непустые значения и все строки — три разных числа.",
      ),
    ]),

    section("internals", [
      h("Как PostgreSQL сортирует и обрезает"),
      p("Если порядок запроса совпадает с индексом, СУБД читает индекс по порядку и сразу останавливается после `LIMIT` — сортировка не нужна. Иначе она сортирует результат (в памяти, а при нехватке — на диске) и берёт первые строки; для `LIMIT` используется «top-N» сортировка с кучей, не требующая сортировать всё."),
      h("Цена OFFSET"),
      code("sql", `CREATE TABLE events AS
SELECT g AS id, timestamp '2024-01-01' + g * interval '1 second' AS created_at
FROM generate_series(1, 200000) AS g;
ALTER TABLE events ADD PRIMARY KEY (id);
VACUUM ANALYZE events;

-- Страница 15 001-й строки через OFFSET: сервер читает и отбрасывает 150 000 строк
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT id FROM events ORDER BY id OFFSET 150000 LIMIT 10;

-- Та же страница через keyset («после последней увиденной строки»): читает ровно 10
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT id FROM events WHERE id > 150000 ORDER BY id LIMIT 10;`, { filename: "05-offset-keyset.pg.sql" }),
      code("text", `                                   QUERY PLAN                                   
--------------------------------------------------------------------------------
 Limit (actual rows=10 loops=1)
   ->  Index Only Scan using events_pkey on events (actual rows=150010 loops=1)
         Heap Fetches: 0
(3 rows)

                                 QUERY PLAN                                 
----------------------------------------------------------------------------
 Limit (actual rows=10 loops=1)
   ->  Index Only Scan using events_pkey on events (actual rows=10 loops=1)
         Index Cond: (id > 150000)
         Heap Fetches: 0
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("План показывает главное: в первом запросе узел индекса прошёл `actual rows=150010` записей, чтобы отдать 10, во втором — ровно 10. На таблице в 2 млн строк с `OFFSET 1500000` три замера дали 94–122 мс, а keyset-запрос — 0,02–0,06 мс. Разница растёт с номером страницы."),
      h("Правила сортировки строк"),
      code("sql", `CREATE TABLE words (w text);
INSERT INTO words VALUES ('ёж'), ('еж'), ('ель'), ('жук'), ('Ёлка'), ('ёлка'), ('Яма'), ('яма');

SELECT w FROM words ORDER BY w;                          -- правила базы данных (здесь C.UTF-8 — по кодам символов)
SELECT w FROM words ORDER BY w COLLATE "ru-x-icu";       -- правила русского языка (ICU)`, { filename: "03-order-collation.pg.sql" }),
      code("text", `  w   
------
 Ёлка
 Яма
 еж
 ель
 жук
 яма
 ёж
 ёлка
(8 rows)

  w   
------
 еж
 ёж
 ёлка
 Ёлка
 ель
 жук
 яма
 Яма
(8 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("База создана с C.UTF-8: строки сравниваются по кодам символов, поэтому заглавные буквы идут перед строчными, а «ё» (код U+0451) — после «я». Язык-зависимые правила (`ru-x-icu`) ставят «ё» рядом с «е» и сортируют без учёта регистра на первом уровне. Выбор collation влияет и на индексы: индекс по столбцу применим только для запросов с той же collation."),
    ]),

    section("mistakes", [
      h("Ошибка: LIMIT без ORDER BY"),
      wrongRight(
        "sql",
        { title: "Случайные «первые» строки", code: `SELECT id, name FROM customers LIMIT 3;`, note: "Состав зависит от физического порядка и плана: после обновлений или смены плана результат изменится." },
        { title: "Определённый порядок", code: `SELECT id, name FROM customers ORDER BY signed_up, id LIMIT 3;`, note: "Три самых ранних клиента; `id` разрешает ничьи." },
      ),
      h("Ошибка: страницы пересекаются из-за неуникального ключа"),
      code("sql", `-- «Страницы» по 3 заказа с OFFSET: без детерминированного порядка соседние страницы могут пересекаться
SELECT id, status FROM orders ORDER BY status LIMIT 3 OFFSET 0;
SELECT id, status FROM orders ORDER BY status LIMIT 3 OFFSET 3;`, { filename: "10-ex-fix.pg.sql", runnable: true, fixture: "shop" }),
      code("text", ` id |  status   
----+-----------
  5 | cancelled
 13 | cancelled
  6 | new
(3 rows)

 id | status 
----+--------
  1 | paid
  4 | paid
  2 | paid
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Внутри `paid` порядок произвольный: на второй странице оказались заказы `1, 4, 2`. При изменении данных или плана набор на границе страниц изменится, и один заказ покажется дважды, а другой — ни разу. Добавьте `id` вторым ключом:"),
      code("sql", `SELECT id, status FROM orders ORDER BY status, id LIMIT 3 OFFSET 0;
SELECT id, status FROM orders ORDER BY status, id LIMIT 3 OFFSET 3;`, { filename: "11-fix-solution.sql", runnable: true, fixture: "shop" }),
      code("text", ` id |  status   
----+-----------
  5 | cancelled
 13 | cancelled
  6 | new
(3 rows)

 id | status 
----+--------
  1 | paid
  2 | paid
  4 | paid
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      h("Ошибка: DISTINCT, чтобы «починить» дубли"),
      p("Если после `JOIN` строки задвоились, `DISTINCT` скроет симптом, но не причину (неверное соединение или неучтённая связь «один ко многим»). Он замедляет запрос и может скрыть настоящие дубли данных. Сначала найдите, почему строки размножились."),
      h("Ошибка: большие OFFSET для «бесконечной ленты»"),
      p("Каждая следующая страница дороже предыдущей и нестабильна при вставках: новые записи сдвигают границу. Для лент и API используйте keyset-пагинацию и курсоры."),
    ]),

    section("antipatterns", [
      ul(
        "**Сортировка по неуникальному ключу в пагинации.**",
        "**`ORDER BY 1, 2`** — номера столбцов ломаются при изменении списка выбора.",
        "**`SELECT DISTINCT *`** по широкой таблице для «очистки» данных.",
        "**`ORDER BY random() LIMIT 1`** на большой таблице — полная сортировка ради одной строки (для выборки случайной строки есть другие способы).",
        "**Сортировка на клиенте после `LIMIT`** — порядок и состав страницы определяет не тот запрос, который вы думаете.",
        "**`OFFSET` в API для «глубоких» страниц.**",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Всегда задавайте `ORDER BY`**, если порядок виден пользователю или есть `LIMIT`.",
        "**Заканчивайте ключи сортировки уникальным значением** (`id`) — порядок станет полностью определённым.",
        "**Явно указывайте `NULLS FIRST/LAST`**, когда `NULL` возможны, — результат станет одинаковым в разных СУБД.",
        "**Для ленты и больших страниц используйте keyset-пагинацию** и индекс на ключи сортировки.",
        "**Определитесь с collation** для текста: для естественного русского порядка — языковая collation; для технических идентификаторов — `C`.",
        "**Используйте `DISTINCT` осознанно:** сначала проверьте, нет ли ошибки в соединении.",
        "**Для «последняя запись каждой группы»** в PostgreSQL — `DISTINCT ON` или оконные функции (позже в курсе).",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`LIMIT 0`** возвращает пустой результат (структура столбцов сохраняется); `LIMIT NULL` и `LIMIT ALL` — без ограничения.",
        "**`OFFSET` больше числа строк** — пустой результат без ошибки.",
        "**`WITH TIES`** может вернуть больше `n` строк: в замере при `FETCH FIRST 2 ROWS WITH TIES` и двух товарах по 1900 вернулось 3 строки.",
        "**`ORDER BY` в подзапросе** без `LIMIT` не гарантирует порядок внешнего запроса.",
        "**`DISTINCT` и `ORDER BY`:** в PostgreSQL выражения `ORDER BY` должны входить в список выбора при `SELECT DISTINCT`.",
        "**`DISTINCT ON` без `ORDER BY`** возвращает произвольную строку из группы — всегда сортируйте по ключу и по выбору «какая первая».",
        "**SQLite:** `NULL` первыми при `ASC`; `LIKE`/сортировка кириллицы побайтовые (без ICU).",
      ),
      code("sql", `-- Три самых дорогих товара посуды, но с равными ценами вместе (WITH TIES)
SELECT title, price FROM products WHERE category = 'посуда' ORDER BY price DESC FETCH FIRST 2 ROWS WITH TIES;
INSERT INTO products (id, title, category, price) VALUES (11, 'Френч-пресс малый', 'посуда', 1900.00);
SELECT title, price FROM products WHERE category = 'посуда' ORDER BY price DESC FETCH FIRST 2 ROWS WITH TIES;
SELECT title, price FROM products WHERE category = 'посуда' ORDER BY price DESC LIMIT 2;`, { filename: "08-fetch-ties.pg.sql" }),
      code("text", `      title      |  price  
-----------------+---------
 Чайник стальной | 2300.00
 Френч-пресс     | 1900.00
(2 rows)

       title       |  price  
-------------------+---------
 Чайник стальной   | 2300.00
 Френч-пресс       | 1900.00
 Френч-пресс малый | 1900.00
(3 rows)

      title      |  price  
-----------------+---------
 Чайник стальной | 2300.00
 Френч-пресс     | 1900.00
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      code("sql", `-- Последний заказ каждого клиента: DISTINCT ON оставляет первую строку для каждого customer_id
SELECT DISTINCT ON (customer_id) customer_id, id AS last_order_id, ordered_on
FROM orders
ORDER BY customer_id, ordered_on DESC, id DESC;`, { filename: "07-distinct-on.pg.sql" }),
      code("text", ` customer_id | last_order_id | ordered_on 
-------------+---------------+------------
           1 |            12 | 2024-06-01
           2 |             9 | 2024-04-30
           3 |            11 | 2024-05-21
           4 |             6 | 2024-03-20
           5 |            13 | 2024-06-18
           7 |            10 | 2024-05-06
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
    ]),

    section("related", [
      ul(
        "[SELECT и WHERE](/learn/sql/select-where) — условия и список выбора.",
        "[Типы данных и NULL](/learn/sql/data-types-null) — порядок `NULL` в сортировке.",
        "[GROUP BY и HAVING](/learn/sql/group-by-having) — группировка; `DISTINCT` как частный случай.",
        "[Оконные функции](/learn/sql/window-functions) — `row_number`, «последняя запись каждой группы».",
        "[Индексы и B-дерево](/learn/sql/indexes-btree) — индекс как готовый порядок.",
        "[Планы выполнения](/learn/sql/explain-plans) — как читать `Limit` и `Index Only Scan`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "OFFSET-пагинация",
          code: `
            SELECT id, created_at FROM events
            ORDER BY created_at
            LIMIT 20 OFFSET 150000;
          `,
          note: "Сервер читает 150 020 строк; при `created_at` с повторами страницы нестабильны.",
        },
        {
          title: "Keyset-пагинация",
          code: `
            SELECT id, created_at FROM events
            WHERE (created_at, id) > (:last_created, :last_id)
            ORDER BY created_at, id
            LIMIT 20;
          `,
          note: "Читает ровно 20 строк (при индексе по `(created_at, id)`); порядок полностью определён.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.order-limit-distinct.ex1",
      title: "Предскажите результат",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская запросы, определите результат каждого из четырёх (набор «shop»)."),
        code("sql", `SELECT name FROM customers ORDER BY city NULLS LAST, name LIMIT 4;
SELECT count(DISTINCT category) FROM products WHERE price > 400;
SELECT DISTINCT status FROM orders ORDER BY status DESC;
SELECT id FROM products ORDER BY price DESC LIMIT 2 OFFSET 1;`, { filename: "09-ex-predict.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Где окажется `NULL` при `NULLS LAST`?", "Сколько категорий среди товаров дороже 400?", "Какие значения `status` встречаются и в каком порядке при `DESC`?", "Что делает `OFFSET 1`?"],
      checks: ["Первый: Борис, Дарья, Анна, Вера", "Второй: 3", "Третий: shipped, paid, new, cancelled", "Четвёртый: id 4 и 1"],
      solution: [
        code("text", ` name  
-------
 Борис
 Дарья
 Анна
 Вера
(4 rows)

 count 
-------
     3
(1 row)

  status   
-----------
 shipped
 paid
 new
 cancelled
(4 rows)

 id 
----
  4
  1
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "Города по алфавиту: Казань (Борис, Дарья), Москва (Анна, Вера, Жанна) — `LIMIT 4` обрезал на Вере; Егор с `NULL` был бы последним.",
          "Товары дороже 400: напитки (кофе 1200), посуда (450, 1900, 2300, 990), продукты (мёд 520) — три категории.",
          "`DISTINCT status` по убыванию: `shipped`, `paid`, `new`, `cancelled`.",
          "Цены по убыванию: 2300 (id 8), 1900 (id 4), 1200 (id 1); `OFFSET 1` пропускает первую, `LIMIT 2` берёт `4` и `1`.",
        ),
      ],
    }),
    exercise({
      id: "sql.order-limit-distinct.ex2",
      title: "Страницы пересекаются",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Постраничный вывод заказов по 3 строки отсортирован по `status`. Объясните, почему внутри статуса `paid` порядок произвольный, как это приведёт к дубликатам на страницах, и исправьте запрос."),
        code("sql", `-- «Страницы» по 3 заказа с OFFSET: без детерминированного порядка соседние страницы могут пересекаться
SELECT id, status FROM orders ORDER BY status LIMIT 3 OFFSET 0;
SELECT id, status FROM orders ORDER BY status LIMIT 3 OFFSET 3;`, { filename: "10-ex-fix.pg.sql", runnable: true, fixture: "shop" }),
      ],
      hints: ["Сколько заказов имеют статус `paid`?", "Что определяет порядок строк с равным `status`?"],
      checks: ["Причина: ключ `status` неуникален", "Исправление: `ORDER BY status, id`", "Страницы дают непересекающиеся наборы в стабильном порядке"],
      solution: [
        code("sql", `SELECT id, status FROM orders ORDER BY status, id LIMIT 3 OFFSET 0;
SELECT id, status FROM orders ORDER BY status, id LIMIT 3 OFFSET 3;`, { filename: "11-fix-solution.sql", runnable: true, fixture: "shop" }),
        code("text", ` id |  status   
----+-----------
  5 | cancelled
 13 | cancelled
  6 | new
(3 rows)

 id | status 
----+--------
  1 | paid
  2 | paid
  4 | paid
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Статус `paid` у семи заказов, поэтому порядок среди них определяется физическим расположением и планом, а не данными. С уникальным вторым ключом (`id`) порядок полностью определён: на второй странице `1, 2, 4`, и повторные запросы дают тот же результат."),
      ],
    }),
    exercise({
      id: "sql.order-limit-distinct.ex3",
      title: "Лента заказов",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Сделайте ленту заказов «от новых к старым» страницами по 4. Первая страница — без условия; вторая — «после последней увиденной строки» (последний заказ первой страницы — `id = 10`, дата `2024-05-06`). Порядок должен быть уникальным и стабильным, `OFFSET` использовать нельзя."),
      ],
      hints: ["Какой уникальный ключ сортировки?", "Как сравнить пару `(дата, id)` с последней увиденной?"],
      checks: ["`ORDER BY ordered_on DESC, id DESC`", "Условие `(ordered_on, id) < ('2024-05-06', 10)`", "Нет `OFFSET`", "Страницы не пересекаются: 13–10, затем 9–6"],
      solution: [
        code("sql", `-- Лента: заказы от новых к старым, страница по 4; следующая страница — после последней увиденной пары (дата, id)
SELECT id, ordered_on, status
FROM orders
ORDER BY ordered_on DESC, id DESC
LIMIT 4;

SELECT id, ordered_on, status
FROM orders
WHERE (ordered_on, id) < ('2024-05-06', 10)
ORDER BY ordered_on DESC, id DESC
LIMIT 4;`, { filename: "12-challenge.sql", runnable: true, fixture: "shop" }),
        code("text", ` id | ordered_on |  status   
----+------------+-----------
 13 | 2024-06-18 | cancelled
 12 | 2024-06-01 | shipped
 11 | 2024-05-21 | paid
 10 | 2024-05-06 | paid
(4 rows)

 id | ordered_on | status  
----+------------+---------
  9 | 2024-04-30 | paid
  8 | 2024-04-11 | shipped
  7 | 2024-04-02 | paid
  6 | 2024-03-20 | new
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Первая страница — заказы 13, 12, 11, 10; вторая начинается ровно после пары `(2024-05-06, 10)`: 9, 8, 7, 6. Сравнение пар работает как «строго раньше по дате, а при равной дате — меньший `id`»."),
      ],
    }),
  ],

  challenge: {
    id: "sql.order-limit-distinct.challenge",
    title: "Рейтинг и последние заказы",
    scenario: [
      p("Для личного кабинета нужны два запроса по набору «shop»: «последний заказ каждого клиента» и «два самых дорогих товара посуды с учётом равных цен». Оба должны быть детерминированными."),
    ],
    requirements: [
      "Последний заказ каждого клиента: `customer_id`, `id`, `ordered_on`, один ряд на клиента, по возрастанию `customer_id`",
      "Если у клиента несколько заказов в один день — выбирается заказ с большим `id`",
      "Два самых дорогих товара посуды; товары с ценой, равной цене второго, тоже включаются в результат (`WITH TIES`)",
    ],
    constraints: [
      "Для первого запроса используйте `DISTINCT ON` с явным `ORDER BY`",
      "Результат одинаков при каждом запуске",
    ],
    acceptance: [
      "В первом запросе 6 строк (клиенты с заказами: 1, 2, 3, 4, 5, 7)",
      "У клиента 1 последний заказ — `12` (дата `2024-06-01`)",
      "Во втором запросе при равных ценах возвращаются все товары с такой ценой",
    ],
    hints: [
      "`DISTINCT ON (customer_id)` и `ORDER BY customer_id, ordered_on DESC, id DESC`.",
      "`FETCH FIRST 3 ROWS WITH TIES` требует `ORDER BY price DESC`.",
    ],
    solution: [
      code("sql", `-- Последний заказ каждого клиента: DISTINCT ON оставляет первую строку для каждого customer_id
SELECT DISTINCT ON (customer_id) customer_id, id AS last_order_id, ordered_on
FROM orders
ORDER BY customer_id, ordered_on DESC, id DESC;`, { filename: "07-distinct-on.pg.sql" }),
      code("text", ` customer_id | last_order_id | ordered_on 
-------------+---------------+------------
           1 |            12 | 2024-06-01
           2 |             9 | 2024-04-30
           3 |            11 | 2024-05-21
           4 |             6 | 2024-03-20
           5 |            13 | 2024-06-18
           7 |            10 | 2024-05-06
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      code("sql", `-- Три самых дорогих товара посуды, но с равными ценами вместе (WITH TIES)
SELECT title, price FROM products WHERE category = 'посуда' ORDER BY price DESC FETCH FIRST 2 ROWS WITH TIES;
INSERT INTO products (id, title, category, price) VALUES (11, 'Френч-пресс малый', 'посуда', 1900.00);
SELECT title, price FROM products WHERE category = 'посуда' ORDER BY price DESC FETCH FIRST 2 ROWS WITH TIES;
SELECT title, price FROM products WHERE category = 'посуда' ORDER BY price DESC LIMIT 2;`, { filename: "08-fetch-ties.pg.sql" }),
      code("text", `      title      |  price  
-----------------+---------
 Чайник стальной | 2300.00
 Френч-пресс     | 1900.00
(2 rows)

       title       |  price  
-------------------+---------
 Чайник стальной   | 2300.00
 Френч-пресс       | 1900.00
 Френч-пресс малый | 1900.00
(3 rows)

      title      |  price  
-----------------+---------
 Чайник стальной | 2300.00
 Френч-пресс     | 1900.00
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`DISTINCT ON` берёт первую строку каждой группы по `ORDER BY customer_id, ordered_on DESC, id DESC`: клиент 1 — заказ 12, клиент 5 — заказ 13. `WITH TIES` в примере показывает поведение при равных ценах: после добавления второго товара за 1900 запрос вернул три строки вместо двух, а обычный `LIMIT 2` — по-прежнему две (и какую из двух равных он отдаст, не определено)."),
    ],
  },

  interview: [
    iq("sql.order-limit-distinct.i1", "basic", "Гарантируется ли порядок строк без ORDER BY?", [
      ul(
        "Нет, порядок не определён и может меняться при обновлениях, смене плана или параллельном чтении.",
        "Любой порядок, который вам нужен пользователю или `LIMIT`, задаётся `ORDER BY`.",
      ),
    ]),
    iq("sql.order-limit-distinct.i2", "basic", "Чем DISTINCT отличается от GROUP BY?", [
      ul(
        "`DISTINCT` убирает повторы строк результата; `GROUP BY` объединяет строки в группы и позволяет считать агрегаты по группам.",
        "`SELECT DISTINCT a` и `SELECT a … GROUP BY a` дают один результат, но у `GROUP BY` есть агрегаты и `HAVING`.",
        "`NULL` в обоих случаях считаются одной группой.",
      ),
    ]),
    iq("sql.order-limit-distinct.i3", "intermediate", "Почему пагинация с OFFSET может показывать дубликаты или пропускать записи?", [
      ul(
        "Если ключ сортировки неуникален, порядок внутри равных значений неопределён и может отличаться между запросами (замер: `1, 4, 2` против `1, 2, 4`).",
        "При вставках и удалениях между запросами граница страницы сдвигается: запись показывается дважды или пропускается.",
        "Решения: уникальный последний ключ сортировки; keyset-пагинация.",
      ),
    ]),
    iq("sql.order-limit-distinct.i4", "intermediate", "Почему большой OFFSET медленный и чем заменить?", [
      ul(
        "СУБД должна прочитать и отбросить `OFFSET` строк (в замере 1 500 010 записей индекса, 94–122 мс).",
        "Keyset-пагинация использует условие по ключу и индекс: прочитано ровно `LIMIT` строк (0,02–0,06 мс).",
        "Нужны уникальные ключи сортировки и индекс по ним в том же порядке.",
      ),
    ]),
    iq("sql.order-limit-distinct.i5", "intermediate", "Как в PostgreSQL получить по одной (последней) записи для каждой группы?", [
      ul(
        "`DISTINCT ON (group_key)` + `ORDER BY group_key, created_at DESC, id DESC`.",
        "Переносимый способ: оконная функция `row_number() OVER (PARTITION BY group_key ORDER BY created_at DESC, id DESC)` и фильтр `= 1`.",
        "Оба варианта требуют полностью определённого порядка внутри группы.",
      ),
    ]),
    iq("sql.order-limit-distinct.i6", "advanced", "Что такое collation и как она влияет на ORDER BY и индексы?", [
      ul(
        "Правила сравнения строк (алфавит, регистр, диакритика). В замере C.UTF-8 ставит `ё` после `я`, а `ru-x-icu` — рядом с `е`.",
        "Индекс по строковому столбцу создан с определённой collation и подходит только для запросов с той же (иначе — сортировка в памяти).",
        "Смена collation базы требует пересоздания индексов; для идентификаторов часто выбирают `C` (побайтовое сравнение, быстрее).",
      ),
    ]),
    iq("sql.order-limit-distinct.i7", "engineering", "Как спроектировать API ленты на SQL, чтобы он был стабилен и быстр на миллионах записей?", [
      ul(
        "Порядок: `ORDER BY created_at DESC, id DESC` — уникальный и совпадающий с индексом `(created_at DESC, id DESC)`.",
        "Курсор — пара `(created_at, id)` последней записи; следующая страница: `WHERE (created_at, id) < (:c, :i) ... LIMIT n`.",
        "Размер страницы ограничить сверху; брать `n + 1`, чтобы узнать, есть ли следующая страница.",
        "Для «перейти на страницу N» — отдельная стратегия (счётчики, ограничения) либо отказ от неё.",
      ),
    ]),
    iq("sql.order-limit-distinct.i8", "debugging", "После добавления `DISTINCT` запрос стал на порядок медленнее. Что проверите?", [
      ul(
        "Нужен ли `DISTINCT` вообще: возможно, дубли появились из-за неверного соединения (размножение строк).",
        "План: сортировка или хэш-агрегат по всем столбцам списка выбора; широкие строки делают его дорогим.",
        "Сократить список выбора, использовать `EXISTS` вместо `JOIN` + `DISTINCT`, добавить индекс.",
        "Проверить, не замаскировал ли `DISTINCT` настоящие дубли данных.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.order-limit-distinct.e1", "foundation", "Что делает `ORDER BY price DESC`?", ["Сортирует по возрастанию цены", "Группирует по цене", "Сортирует по убыванию цены", "Удаляет повторы"], 2, "`DESC` задаёт убывающий порядок; по умолчанию — `ASC`."),
    mcq("sql.order-limit-distinct.e2", "foundation", "Что вернёт `SELECT DISTINCT city FROM customers`, если у двух клиентов `NULL`?", ["Одну строку с `NULL`", "Две строки с `NULL`", "Ошибку", "Ни одной строки с `NULL`"], 0, "`DISTINCT` считает `NULL` одинаковыми, поэтому остаётся одна строка (замер: 4 строки — 3 города и `NULL`)."),
    mcq("sql.order-limit-distinct.e3", "foundation", "Что делает `LIMIT 3 OFFSET 2`?", ["Пропускает 3 строки и берёт 2", "Берёт строки 2 и 3", "Берёт первые 5 строк", "Пропускает 2 строки и берёт 3"], 3, "`OFFSET` — сколько пропустить, `LIMIT` — сколько вернуть."),
    mcq("sql.order-limit-distinct.e4", "intermediate", "Почему `ORDER BY status LIMIT 3 OFFSET 3` может дать пересекающиеся страницы?", ["`OFFSET` не работает с `ORDER BY`", "`status` неуникален, порядок внутри равных значений не определён", "`LIMIT` игнорирует сортировку", "Из-за `NULL` в `status`"], 1, "Строки с одинаковым `status` могут идти в любом порядке и между запросами меняться местами; добавьте уникальный ключ."),
    mcq("sql.order-limit-distinct.e5", "intermediate", "Какие приёмы делают пагинацию стабильной и быстрой? Выберите все.", ["Уникальный последний ключ сортировки", "Keyset: `WHERE (a, id) > (:a, :id)`", "Большой `OFFSET`", "Индекс по ключам сортировки"], [0, 1, 3], "Уникальный ключ стабилизирует порядок, keyset и индекс убирают чтение пропускаемых строк; большой `OFFSET` как раз замедляет."),
    mcq("sql.order-limit-distinct.e6", "intermediate", "Сколько строк может вернуть `FETCH FIRST 2 ROWS WITH TIES`?", ["Ровно 2", "Не больше 2", "Все строки таблицы", "2 и все строки, равные последней по ключу сортировки"], 3, "`WITH TIES` добавляет строки, ничем не отличающиеся по `ORDER BY` от последней из выбранных (замер: 3 строки вместо 2)."),
    mcq("sql.order-limit-distinct.e7", "advanced", "Где окажутся `NULL` при `ORDER BY city` в PostgreSQL?", ["Первыми", "Не попадут в результат", "Последними", "Зависит от порядка вставки"], 2, "В PostgreSQL `NULL` считаются «большими»: последними при `ASC`, первыми при `DESC` (в SQLite — наоборот)."),
    open("sql.order-limit-distinct.e8", "intermediate", "Опишите, как выбрать способ пагинации для ленты событий на миллионы записей, и почему `OFFSET` для неё не подходит.", [
      ul(
        "`OFFSET` читает и выбрасывает все пропущенные строки: стоимость растёт линейно с номером страницы (в замере 94–122 мс на странице 150 000-й против 0,02–0,06 мс у keyset).",
        "При вставках новых событий граница страниц смещается — пользователь видит дубликаты.",
        "Keyset-пагинация: уникальные ключи сортировки (`created_at`, `id`), условие «после последней строки», индекс по ключам.",
        "Курсор передаётся клиенту; «страница N» заменяется «следующая»/«предыдущая».",
      ),
    ], ["Названа линейная стоимость OFFSET", "Названа нестабильность при вставках", "Описан keyset с уникальным ключом и индексом"], { format: "architecture" }),
  ],

  mastery: [
    mcq("sql.order-limit-distinct.m1", "intermediate", "Что вернёт `SELECT id FROM products ORDER BY price DESC LIMIT 2 OFFSET 1` для цен 2300 (id 8), 1900 (id 4), 1200 (id 1), 990, 520…?", ["`8` и `4`", "`4` и `1`", "`1` и `10`", "`8` и `1`"], 1, "`OFFSET 1` пропускает самый дорогой товар (id 8), `LIMIT 2` берёт следующие два — id 4 и 1 (замер)."),
    mcq("sql.order-limit-distinct.m2", "advanced", "Почему индекс помогает `ORDER BY id LIMIT 10`, но не избавляет от чтения при `OFFSET 150000`?", ["СУБД всё равно проходит 150 010 записей индекса, чтобы пропустить первые 150 000", "Индекс не используется с `LIMIT`", "`OFFSET` сортирует таблицу заново", "Индекс работает только при `DESC`"], 0, "План в замере: `Index Only Scan … actual rows=150010` под `Limit … actual rows=10`; keyset сразу переходит к значению."),
    mcq("sql.order-limit-distinct.m3", "advanced", "Какой порядок кириллицы даёт база C.UTF-8 без `COLLATE`?", ["Как в словаре русского языка", "По возрастанию длины слова", "По кодам символов: заглавные перед строчными, `ё` после `я`", "Случайный"], 2, "Замер: `Ёлка, Яма, еж, ель, жук, яма, ёж, ёлка` — побайтовое сравнение; языковые правила дают `ru-x-icu`."),
    open("sql.order-limit-distinct.m4", "advanced", "У вас есть таблица комментариев с индексом по `(post_id, created_at)`. Нужна выдача «первые 20 комментариев поста», а затем «следующие 20». Запишите запросы, объясните выбор ключей и что произойдёт при одинаковом `created_at`.", [
      ul(
        "Первая страница: `WHERE post_id = :p ORDER BY created_at, id LIMIT 20` — `id` добавлен как уникальный хвост ключа.",
        "Следующая: `WHERE post_id = :p AND (created_at, id) > (:c, :i) ORDER BY created_at, id LIMIT 20`.",
        "При одинаковом `created_at` порядок определяет `id`: без него одинаковые строки могли бы поменяться местами и страницы бы пересеклись.",
        "Индекс лучше сделать `(post_id, created_at, id)`: тогда и условие, и сортировка идут по индексу без отдельной сортировки.",
      ),
    ], ["Использован уникальный хвост ключа", "Записан keyset-запрос", "Объяснено поведение при равных значениях", "Предложен подходящий индекс"], { format: "sql" }),
  ],

  flashcards: [
    { id: "sql.order-limit-distinct.f1", front: "Порядок строк без ORDER BY?", back: "Не определён. Любой порядок и LIMIT требуют ORDER BY." },
    { id: "sql.order-limit-distinct.f2", front: "Уникальный хвост сортировки?", back: "ORDER BY created_at, id — id разрешает ничьи и стабилизирует страницы." },
    { id: "sql.order-limit-distinct.f3", front: "Цена OFFSET?", back: "Читает и отбрасывает OFFSET строк. На 2 млн строк: 94–122 мс против 0,02–0,06 мс у keyset (замер)." },
    { id: "sql.order-limit-distinct.f4", front: "Keyset?", back: "WHERE (created, id) < (:c, :i) ORDER BY created DESC, id DESC LIMIT n + индекс по ключам." },
    { id: "sql.order-limit-distinct.f5", front: "DISTINCT и NULL?", back: "NULL считаются одинаковыми: одна строка. count(DISTINCT x) не считает NULL." },
    { id: "sql.order-limit-distinct.f6", front: "DISTINCT ON?", back: "PostgreSQL: первая по ORDER BY строка для каждого значения выражения. Нужна полная сортировка внутри группы." },
    { id: "sql.order-limit-distinct.f7", front: "WITH TIES?", back: "FETCH FIRST n ROWS WITH TIES: n строк и все с равным ключом последней. Может вернуть больше n." },
    { id: "sql.order-limit-distinct.f8", front: "NULL в сортировке?", back: "PostgreSQL: ASC — последним, DESC — первым. SQLite: наоборот. Явно: NULLS FIRST/LAST." },
    { id: "sql.order-limit-distinct.f9", front: "Collation?", back: "Правила сравнения строк. C.UTF-8: по кодам; ru-x-icu: по правилам языка. Влияет на ORDER BY и индексы." },
  ],

  sources: [
    { title: "PostgreSQL 16: Sorting Rows (ORDER BY)", url: "https://www.postgresql.org/docs/16/queries-order.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: LIMIT and OFFSET", url: "https://www.postgresql.org/docs/16/queries-limit.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: SELECT — DISTINCT Clause", url: "https://www.postgresql.org/docs/16/sql-select.html#SQL-DISTINCT", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Collation Support", url: "https://www.postgresql.org/docs/16/collation.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Row-wise comparison", url: "https://www.postgresql.org/docs/16/functions-comparisons.html#ROW-WISE-COMPARISON", publisher: "PostgreSQL" },
    { title: "SQLite: ORDER BY clause", url: "https://www.sqlite.org/lang_select.html#orderby", publisher: "Other" },
    { title: "SQLite: Row Values", url: "https://www.sqlite.org/rowvalue.html", publisher: "Other" },
  ],
};
