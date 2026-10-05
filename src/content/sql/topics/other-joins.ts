import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  table,
  def,
  beforeAfter,
  annotated,
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const otherJoins: Topic = {
  id: "sql.other-joins",
  slug: "other-joins",
  domain: "sql",
  module: "joins",
  title: "RIGHT, FULL, CROSS и SELF JOIN",
  titleEn: "RIGHT, FULL, CROSS and SELF JOIN",
  summary:
    "Кроме `INNER` и `LEFT` у соединений есть ещё четыре роли: `RIGHT JOIN` — зеркальный `LEFT`, `FULL JOIN` сохраняет строки обеих сторон (сверка «план — факт»: четыре строки, из них две — без пары), `CROSS JOIN` строит все комбинации (сетка «клиент × статус» с нулями), а `SELF JOIN` соединяет таблицу с самой собой (сотрудник и руководитель, пары коллег, цепочки подчинения). Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает соединение не по равенству (разряды зарплат), почему `e1.id < e2.id` убирает зеркальные пары (из 4 строк осталась 1), чем «полу-соединение» через `EXISTS` отличается от `JOIN` (7 строк против 5 клиентов), что такое `LATERAL` в PostgreSQL и как не ошибиться в `COUNT` для `FULL JOIN`.",
  minutes: 75,
  prerequisites: ["sql.inner-left-joins"],
  tags: ["RIGHT JOIN", "FULL JOIN", "CROSS JOIN", "SELF JOIN", "LATERAL", "semi-join", "EXISTS", "non-equi join", "hierarchy", "reconciliation", "calendar grid", "pairs"],
  keyConcepts: [
    { term: "RIGHT JOIN = LEFT JOIN наоборот", text: "`orders RIGHT JOIN customers` даёт тот же результат, что `customers LEFT JOIN orders` (восемь клиентов, у Егора и Игоря 0 заказов). На практике пишут `LEFT`, меняя порядок таблиц." },
    { term: "FULL JOIN — строки обеих сторон", text: "Сверка «план — факт» дала 4 строки: товар 1 есть только в плане, 4 — только в продажах, 2 и 3 — в обоих. `FULL JOIN` — основной инструмент сверок и синхронизаций." },
    { term: "CROSS JOIN — все комбинации", text: "Произведение `M × N`: календарь × товары, клиенты × статусы. В сочетании с `LEFT JOIN` даёт полную сетку с нулями вместо пропусков." },
    { term: "SELF JOIN — таблица как две", text: "Сотрудники и их руководители — одна таблица `employees`, соединённая по `manager_id`; псевдонимы `e` и `m` различают роли. Корень иерархии (Ирина) получает `NULL` в `manager` при `LEFT JOIN`." },
    { term: "Пары без зеркал: id < id", text: "Условие `a.id < b.id` исключает сравнение строки с собой и зеркальные пары: из 4 строк «все пары» осталась одна (Юлия — Яков)." },
  ],
  sections: [
    section("definition", [
      def("RIGHT JOIN", "Внешнее соединение, сохраняющее все строки правой таблицы. Равнозначно `LEFT JOIN` с переставленными таблицами.", "right (outer) join"),
      def("FULL JOIN", "Внешнее соединение, сохраняющее все строки обеих таблиц: совпавшие — парами, несовпавшие — с `NULL` на другой стороне. Поддерживается в PostgreSQL и SQLite 3.39+.", "full (outer) join"),
      def("CROSS JOIN", "Декартово произведение двух источников: каждая строка левого с каждой строкой правого, без условия.", "cross join"),
      def("SELF JOIN", "Соединение таблицы с самой собой через два псевдонима: для иерархий, сравнения строк между собой, поиска дублей.", "self join"),
      def("Полусоединение", "Выбор строк левой таблицы, для которых в правой есть хотя бы одна пара, без размножения: `WHERE EXISTS (…)` или `IN (…)`.", "semi-join"),
      def("Соединение не по равенству", "Соединение с условием `<`, `>`, `BETWEEN`: диапазоны, разряды, периоды действия. Выполняется медленнее соединения по равенству.", "non-equi join"),
      def("LATERAL", "Расширение PostgreSQL: подзапрос в `FROM` может ссылаться на столбцы предыдущих источников — для «первые N по каждой строке слева».", "LATERAL join"),
    ]),

    section("why", [
      h("Не всё в мире описывается «внутренним» соединением"),
      p("«Что есть в плане, но нет в продажах — и наоборот» — это `FULL JOIN`. «Все клиенты и все статусы, даже если комбинации не встречались» — `CROSS JOIN`. «Кто чей руководитель» — соединение таблицы с самой собой. Каждая такая задача простыми средствами решается громоздко и с ошибками, а нужным соединением — одной строкой."),
      ul(
        "**Сверки и миграции:** сравнить две таблицы, найти расхождения в обе стороны (`FULL JOIN`).",
        "**Отчёты без пропусков:** сетки «период × категория» с нулями (`CROSS JOIN` + `LEFT JOIN`).",
        "**Иерархии и пары:** организационные структуры, поиск дублей, сравнение соседей (`SELF JOIN`).",
        "**Корректность:** `JOIN` и `EXISTS` дают разные числа, если справа несколько совпадений.",
      ),
    ]),

    section("mental-model", [
      h("Диаграмма Венна — только подсказка"),
      p("Рисунки с перекрывающимися кругами хороши, чтобы запомнить, **какие строки остаются**, но плохи для понимания размножения: соединение работает с парами строк, а не с множествами значений. Надёжная ментальная модель — «сначала все пары (`CROSS JOIN`), затем оставляем те, что удовлетворяют `ON`, и добавляем строки без пары для внешних соединений»."),
      diagram(
        `
        A: 1, 2, 2, 3          B: 2, 3, 3, 4

        INNER  A⨝B  : (2,2) (2,2) (3,3) (3,3)                    → 4 строки
        LEFT   A⟕B  : INNER + (1, NULL)                          → 5
        RIGHT  A⟖B  : INNER + (NULL, 4)                          → 5
        FULL   A⟗B  : INNER + (1, NULL) + (NULL, 4)              → 6
        CROSS  A×B  : все пары 4 × 4                              → 16
        `,
        "Число строк соединения — не число общих значений, а число совпавших пар (повторы умножаются: 2 × 1 для значения 2 и 1 × 2 для значения 3).",
      ),
      h("Таблица и её «отражение»"),
      p("`SELF JOIN` удобно представить так: у вас два экземпляра одной таблицы с разными именами. В одном вы смотрите на «сотрудника», в другом — на «руководителя». Условие `m.id = e.manager_id` связывает роли; всё остальное — обычное соединение."),
    ]),

    section("technical", [
      h("Сводка соединений"),
      table(
        ["Соединение", "Сохраняет", "Пары без совпадения", "Типичная задача"],
        [
          ["`INNER JOIN`", "Только совпадения", "Отбрасываются", "Данные, у которых есть связь"],
          ["`LEFT JOIN`", "Все слева", "Справа `NULL`", "«Все X и их Y, если есть»"],
          ["`RIGHT JOIN`", "Все справа", "Слева `NULL`", "То же с обратным порядком"],
          ["`FULL JOIN`", "Все с обеих сторон", "`NULL` на недостающей стороне", "Сверка двух наборов"],
          ["`CROSS JOIN`", "Все комбинации", "—", "Сетки, календари, перебор"],
          ["`SELF JOIN`", "Любое из вышеперечисленных", "—", "Иерархии, пары, цепочки"],
        ],
        "Сравнение соединений",
      ),
      h("Практические приёмы"),
      ul(
        "**Сверка:** `FULL JOIN` + `COALESCE(a.key, b.key)` как ключ строки, `CASE` для вердикта.",
        "**Сетка с нулями:** `CROSS JOIN` справочника измерений → `LEFT JOIN` фактов по обоим ключам → `count(факт.id)`.",
        "**Иерархия:** `LEFT JOIN employees m ON m.id = e.manager_id`; для произвольной глубины — рекурсивный CTE (тема впереди).",
        "**Пары без зеркал:** `a.id < b.id`; без условия получите каждую пару дважды и пары «с самим собой».",
        "**Условия не по равенству:** `ON x BETWEEN lo AND hi` — разряды, тарифы, периоды действия.",
        "**LATERAL (PostgreSQL):** `CROSS JOIN LATERAL (SELECT … WHERE … = левая.col ORDER BY … LIMIT n)` — «n лучших строк для каждой слева».",
      ),
      h("Полусоединение и антисоединение"),
      p("Если нужен только **факт наличия** связанных строк, `EXISTS` честнее соединения: не размножает строки и не требует `DISTINCT`. Зеркально, `NOT EXISTS` — «связанных строк нет» (антисоединение)."),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `-- Сверка плана и факта: FULL JOIN показывает строки, которые есть только в одной из таблиц
CREATE TABLE plan   (product_id integer PRIMARY KEY, planned integer NOT NULL);
CREATE TABLE actual (product_id integer PRIMARY KEY, sold    integer NOT NULL);
INSERT INTO plan   VALUES (1, 10), (2, 20), (3, 5);
INSERT INTO actual VALUES (2, 18), (3, 5), (4, 7);

SELECT COALESCE(p.product_id, a.product_id) AS product_id,
       p.planned, a.sold,
       CASE WHEN p.product_id IS NULL THEN 'нет в плане'
            WHEN a.product_id IS NULL THEN 'нет продаж'
            WHEN a.sold = p.planned   THEN 'сошлось'
            ELSE 'расхождение' END AS verdict
FROM plan AS p
FULL JOIN actual AS a ON a.product_id = p.product_id
ORDER BY product_id;`,
        [
          { line: [2, 3], text: "Две таблицы: план и факт по продуктам. Ключ `product_id` в каждой." },
          { line: [4, 5], text: "Данные: товар 1 только в плане, товар 4 только в продажах; товары 2 и 3 — в обеих." },
          { line: [7, 8], text: "`COALESCE(p.product_id, a.product_id)` — единый ключ строки, где бы он ни был." },
          { line: [9, 12], text: "`CASE` определяет вердикт: нет пары слева (`p.product_id IS NULL`), нет пары справа, значения совпали или расходятся." },
          { line: [13, 14], text: "`FULL JOIN … ON` сохраняет строки обеих сторон: плана без продаж и продаж без плана." },
          { line: 15, text: "Порядок задан по общему ключу." },
        ],
        "01-full-join.sql",
      ),
    ]),

    section("minimal-example", [
      p("Сверка плана и факта: четыре товара, у двух из которых нет пары. Выполните блок в браузере — SQLite 3.39+ поддерживает `FULL JOIN`."),
      code("sql", `-- Сверка плана и факта: FULL JOIN показывает строки, которые есть только в одной из таблиц
CREATE TABLE plan   (product_id integer PRIMARY KEY, planned integer NOT NULL);
CREATE TABLE actual (product_id integer PRIMARY KEY, sold    integer NOT NULL);
INSERT INTO plan   VALUES (1, 10), (2, 20), (3, 5);
INSERT INTO actual VALUES (2, 18), (3, 5), (4, 7);

SELECT COALESCE(p.product_id, a.product_id) AS product_id,
       p.planned, a.sold,
       CASE WHEN p.product_id IS NULL THEN 'нет в плане'
            WHEN a.product_id IS NULL THEN 'нет продаж'
            WHEN a.sold = p.planned   THEN 'сошлось'
            ELSE 'расхождение' END AS verdict
FROM plan AS p
FULL JOIN actual AS a ON a.product_id = p.product_id
ORDER BY product_id;`, { filename: "01-full-join.sql", runnable: true }),
      code("text", ` product_id | planned | sold |   verdict   
------------+---------+------+-------------
          1 |      10 |      | нет продаж
          2 |      20 |   18 | расхождение
          3 |       5 |    5 | сошлось
          4 |         |    7 | нет в плане
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Товар 1 запланирован, но не продан («нет продаж»); товар 4 продан без плана («нет в плане»); для 2 продано 18 при плане 20 («расхождение»); для 3 всё сошлось. Такой отчёт невозможен ни с `INNER`, ни с `LEFT` — каждый потерял бы одну сторону."),
    ]),

    section("detailed-example", [
      p("`CROSS JOIN` строит все комбинации «клиент × статус», а `LEFT JOIN` считает заказы в каждой ячейке. Результат содержит строки с нулями — без них пропуски в отчёте выглядели бы как «нет данных»."),
      code("sql", `-- Полная сетка «клиент × статус» с нулями: CROSS JOIN даёт все комбинации, LEFT JOIN подсчитывает
WITH statuses(status) AS (VALUES ('new'), ('paid'), ('shipped'), ('cancelled'))
SELECT c.name, s.status, count(o.id) AS orders
FROM customers AS c
CROSS JOIN statuses AS s
LEFT JOIN orders AS o ON o.customer_id = c.id AND o.status = s.status
WHERE c.id IN (1, 4)
GROUP BY c.id, c.name, s.status
ORDER BY c.id, s.status;`, { filename: "02-cross-grid.sql", runnable: true, fixture: "shop" }),
      code("text", ` name |  status   | orders 
------+-----------+--------
 Анна | cancelled |      0
 Анна | new       |      0
 Анна | paid      |      3
 Анна | shipped   |      1
 Глеб | cancelled |      0
 Глеб | new       |      1
 Глеб | paid      |      0
 Глеб | shipped   |      0
(8 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Для двух клиентов и четырёх статусов — ровно 8 строк (2 × 4). У Анны 3 оплаченных и 1 отгруженный заказ, у Глеба — один новый; остальные ячейки — нули."),
      h("SELF JOIN: сотрудник и руководитель"),
      code("sql", `-- Сотрудник и его руководитель: таблица соединяется сама с собой
SELECT e.name AS employee, e.dept, m.name AS manager
FROM employees AS e
LEFT JOIN employees AS m ON m.id = e.manager_id
ORDER BY e.id;`, { filename: "03-self-manager.sql", runnable: true, fixture: "staff" }),
      code("text", ` employee |    dept    | manager 
----------+------------+---------
 Ирина    | правление  | 
 Павел    | разработка | Ирина
 Ольга    | разработка | Павел
 Семён    | разработка | Павел
 Тимур    | разработка | Ольга
 Ульяна   | разработка | Ольга
 Фёдор    | продажи    | Ирина
 Хлоя     | продажи    | Фёдор
 Цезарь   | продажи    | Фёдор
 Эльвира  | продажи    | Хлоя
 Юлия     | поддержка  | Фёдор
 Яков     | поддержка  | Юлия
(12 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Двенадцать сотрудников, у каждого — имя руководителя; у Ирины (корень) руководителя нет, поэтому `LEFT JOIN` вернул пустое значение. `INNER JOIN` потерял бы корень иерархии."),
    ]),

    section("analysis", [
      table(
        ["Запрос", "Результат", "Объяснение"],
        [
          ["`l JOIN r` для `l = (1, 2, 2, 3)`, `r = (2, 3, 3, 4)`", "4 строки", "Значение 2: 2 × 1 пары, значение 3: 1 × 2 пары"],
          ["`l LEFT JOIN r`", "5 строк", "4 пары + строка `1` без пары"],
          ["`l FULL JOIN r`", "6 строк", "4 пары + `1` без пары + `4` без пары"],
          ["`l CROSS JOIN r`", "16 строк", "4 × 4"],
          ["`employees e JOIN employees e2 ON dept = dept` (отдел «поддержка», 2 человека)", "4 строки", "Все пары, включая «с самим собой» и зеркальные"],
          ["то же с `a.id < b.id`", "1 строка", "Одна пара: Юлия — Яков"],
        ],
        "Число строк при разных соединениях (замеры PostgreSQL 16.14)",
      ),
      code("sql", `-- Пары коллег одного отдела с одинаковой зарплатой; e1.id < e2.id убирает зеркальные пары и сравнение с самим собой
SELECT e1.dept, e1.name AS first, e2.name AS second, e1.salary
FROM employees AS e1
JOIN employees AS e2 ON e2.dept = e1.dept AND e2.salary = e1.salary AND e1.id < e2.id
ORDER BY e1.dept, e1.name;`, { filename: "04-self-pairs.sql", runnable: true, fixture: "staff" }),
      code("text", `    dept    | first | second | salary 
------------+-------+--------+--------
 продажи    | Хлоя  | Цезарь | 110000
 разработка | Ольга | Семён  | 180000
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Пары коллег одного отдела с равной зарплатой: Хлоя и Цезарь (по 110000) и Ольга с Семёном (по 180000). Условие `e1.id < e2.id` оставляет каждую пару ровно один раз."),
    ]),

    section("internals", [
      h("Соединение не по равенству"),
      code("sql", `-- Соединение не по равенству: к какому разряду относится зарплата
WITH grades(grade, lo, hi) AS (VALUES ('A', 0, 99999), ('B', 100000, 149999), ('C', 150000, 999999))
SELECT g.grade, count(*) AS employees, min(e.salary) AS lowest, max(e.salary) AS highest
FROM employees AS e
JOIN grades AS g ON e.salary BETWEEN g.lo AND g.hi
GROUP BY g.grade
ORDER BY g.grade;`, { filename: "05-non-equi.sql", runnable: true, fixture: "staff" }),
      code("text", ` grade | employees | lowest | highest 
-------+-----------+--------+---------
 A     |         3 |  85000 |   95000
 B     |         4 | 110000 |  140000
 C     |         5 | 180000 |  300000
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Таблица разрядов `grades` соединяется с сотрудниками по диапазону зарплаты (`BETWEEN`). Результат: 3 сотрудника разряда A, 4 — B, 5 — C. Хэш-соединение для неравенств неприменимо: СУБД использует вложенные циклы, поэтому на больших таблицах такие соединения дорогие; границы разрядов не должны пересекаться, иначе сотрудник попадёт сразу в два."),
      h("Полусоединение: EXISTS и JOIN"),
      code("sql", `-- Кто хотя бы раз покупал посуду? JOIN размножает клиентов, EXISTS — нет
SELECT count(*) AS rows_with_join
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
JOIN order_items AS oi ON oi.order_id = o.id
JOIN products AS p ON p.id = oi.product_id AND p.category = 'посуда';

SELECT c.name
FROM customers AS c
WHERE EXISTS (
  SELECT 1 FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products AS p ON p.id = oi.product_id
  WHERE o.customer_id = c.id AND p.category = 'посуда'
)
ORDER BY c.name;`, { filename: "06-semi.sql", runnable: true, fixture: "shop" }),
      code("text", ` rows_with_join 
----------------
              7
(1 row)

 name  
-------
 Анна
 Борис
 Вера
 Дарья
 Жанна
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Соединение вернуло 7 строк — по числу покупок посуды (клиент повторяется для каждой), а `EXISTS` — 5 разных клиентов, каждый ровно один раз. Если нужен список **сущностей**, а не **событий**, `EXISTS` проще и безопаснее."),
      h("LATERAL: «первые N по каждой строке»"),
      code("sql", `-- Два последних заказа каждого клиента: LATERAL позволяет подзапросу ссылаться на столбцы левой стороны
SELECT c.name, o.id AS order_id, o.ordered_on
FROM customers AS c
CROSS JOIN LATERAL (
  SELECT id, ordered_on FROM orders WHERE customer_id = c.id ORDER BY ordered_on DESC, id DESC LIMIT 2
) AS o
ORDER BY c.id, o.ordered_on DESC;`, { filename: "07-lateral.pg.sql" }),
      code("text", ` name  | order_id | ordered_on 
-------+----------+------------
 Анна  |       12 | 2024-06-01
 Анна  |        7 | 2024-04-02
 Борис |        9 | 2024-04-30
 Борис |        3 | 2024-02-20
 Вера  |       11 | 2024-05-21
 Вера  |        5 | 2024-03-15
 Глеб  |        6 | 2024-03-20
 Дарья |       13 | 2024-06-18
 Дарья |        8 | 2024-04-11
 Жанна |       10 | 2024-05-06
(10 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Для каждого клиента подзапрос возвращает два последних заказа; у Глеба и Жанны заказов меньше двух — выведено по одному. `LATERAL` позволяет подзапросу ссылаться на `c.id` слева, чего обычный подзапрос в `FROM` не умеет. В SQLite такого нет — используют оконные функции."),
      h("RIGHT JOIN"),
      code("sql", `-- RIGHT JOIN — то же, что LEFT JOIN с обратным порядком таблиц
SELECT c.name, count(o.id) AS orders
FROM orders AS o
RIGHT JOIN customers AS c ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;`, { filename: "08-right-join.sql", runnable: true, fixture: "shop" }),
      code("text", ` name  | orders 
-------+--------
 Анна  |      4
 Борис |      2
 Вера  |      3
 Глеб  |      1
 Дарья |      2
 Егор  |      0
 Жанна |      1
 Игорь |      0
(8 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Результат совпадает с `customers LEFT JOIN orders`. `RIGHT JOIN` читается хуже (приходится «держать в голове» перестановку), поэтому в рабочем коде его почти не пишут."),
    ]),

    section("mistakes", [
      h("Ошибка: SELF JOIN без условия на порядок пар"),
      code("sql", `-- Хотим список пар коллег по отделу без дублей. Получили каждую пару дважды и «пары» с самими собой
SELECT a.name, b.name AS colleague
FROM employees AS a
JOIN employees AS b ON b.dept = a.dept
WHERE a.dept = 'поддержка'
ORDER BY a.name, b.name;`, { filename: "10-ex-fix.sql", runnable: true, fixture: "staff" }),
      code("text", ` name | colleague 
------+-----------
 Юлия | Юлия
 Юлия | Яков
 Яков | Юлия
 Яков | Яков
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Отдел «поддержка» из двух человек даёт четыре строки: «Юлия — Юлия», «Юлия — Яков», «Яков — Юлия», «Яков — Яков». Нужны только разные сотрудники и без зеркал:"),
      code("sql", `SELECT a.name, b.name AS colleague
FROM employees AS a
JOIN employees AS b ON b.dept = a.dept AND a.id < b.id
WHERE a.dept = 'поддержка'
ORDER BY a.name, b.name;`, { filename: "11-fix-solution.sql", runnable: true, fixture: "staff" }),
      code("text", ` name | colleague 
------+-----------
 Юлия | Яков
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
      h("Ошибка: JOIN вместо EXISTS, когда нужен список сущностей"),
      p("Соединение с несколькими совпадениями размножает строки; `DISTINCT` скрывает симптом. `EXISTS` отвечает на вопрос «есть ли хоть одна пара» без размножения (в замере 7 строк против 5 клиентов)."),
      h("Ошибка: условие в WHERE после FULL JOIN"),
      p("Условие по столбцу одной стороны в `WHERE` отбросит строки с `NULL` на этой стороне — то есть именно те, ради которых использован `FULL JOIN`. Условия, относящиеся к стороне, пишут в `ON` (или фильтруют стороны до соединения подзапросами)."),
      h("Ошибка: пересекающиеся диапазоны в соединении не по равенству"),
      p("Если разряды `BETWEEN 100000 AND 150000` и `BETWEEN 150000 AND 200000` пересекаются на границе, сотрудник с 150000 попадёт в оба — строка размножится. Границы диапазонов делают полуоткрытыми (`>= lo AND < hi`)."),
      h("Ошибка: SELF JOIN без `LEFT` для иерархии"),
      p("`INNER JOIN` по `manager_id` потеряет корень иерархии (у него нет руководителя); для списков «все сотрудники» используйте `LEFT JOIN`."),
    ]),

    section("antipatterns", [
      ul(
        "**`RIGHT JOIN` в рабочем коде** — переставьте таблицы и используйте `LEFT JOIN`.",
        "**Случайный `CROSS JOIN`** (запятая без `WHERE`, `JOIN` без `ON`).",
        "**`DISTINCT` вместо `EXISTS`** для устранения размножения.",
        "**`SELF JOIN` для «предыдущей строки»** на больших таблицах вместо оконных функций `lag()`/`lead()`.",
        "**`FULL JOIN` с `WHERE` по одной стороне.**",
        "**Рекурсивные иерархии цепочкой `SELF JOIN` фиксированной глубины** — ломаются при добавлении уровня; нужен рекурсивный CTE.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Для сверки двух наборов — `FULL JOIN`** с вердиктом через `CASE` и единым ключом `COALESCE`.",
        "**Для отчётов без пропусков — `CROSS JOIN` справочника + `LEFT JOIN`** фактов.",
        "**Для иерархий — `LEFT JOIN` на ту же таблицу**, понятные псевдонимы (`e`, `m`, `mm`).",
        "**Для пар — `a.id < b.id`.**",
        "**Для «есть ли связанные данные» — `EXISTS`**, для «нет» — `NOT EXISTS`.",
        "**Для диапазонов — полуоткрытые границы** и проверка, что они не пересекаются.",
        "**Для «первые N на каждую строку» — `LATERAL` (PostgreSQL) или оконные функции.**",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`FULL JOIN` и `NULL` в ключах:** строки с `NULL` в ключе не совпадают ни с чем и выводятся отдельно с каждой стороны.",
        "**`FULL JOIN` и `count(*)`:** строки «только слева» и «только справа» считаются по отдельности; для разных счётчиков используйте `count(левый.ключ)` и `count(правый.ключ)`.",
        "**`FULL JOIN` с условием не по равенству** в PostgreSQL недоступен: нужен хэш- или merge-совместимый предикат (`ON …= …`).",
        "**`CROSS JOIN` с пустой таблицей** даёт пустой результат (произведение с нулём).",
        "**SQLite:** `RIGHT` и `FULL JOIN` — с версии 3.39; `LATERAL` не поддерживается.",
        "**Циклы в иерархии** (`A` — руководитель `B`, а `B` — `A`) для `SELF JOIN` безвредны, для рекурсивных запросов — опасны.",
      ),
    ]),

    section("related", [
      ul(
        "[INNER и LEFT JOIN](/learn/sql/inner-left-joins) — основа: `ON` и `WHERE`, размножение.",
        "[Агрегаты, GROUP BY и HAVING](/learn/sql/group-by-having) — агрегаты по результатам соединений.",
        "[Ловушки соединений](/learn/sql/join-pitfalls) — размножение строк и `NULL` в ключах.",
        "[Подзапросы](/learn/sql/subqueries) — `EXISTS`, `IN` и коррелированные подзапросы.",
        "[Рекурсивные CTE](/learn/sql/recursive-ctes) — иерархии произвольной глубины.",
        "[Оконные функции](/learn/sql/window-functions) — `lag()`/`lead()` вместо `SELF JOIN`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Список клиентов через JOIN и DISTINCT",
          code: `
            SELECT DISTINCT c.name
            FROM customers c
            JOIN orders o ON o.customer_id = c.id
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id AND p.category = 'посуда';
          `,
          note: "Сначала строки размножаются (7 для 5 клиентов), потом `DISTINCT` склеивает их: лишняя работа и риск скрыть ошибку.",
        },
        {
          title: "EXISTS",
          code: `
            SELECT c.name FROM customers c
            WHERE EXISTS (
              SELECT 1 FROM orders o
              JOIN order_items oi ON oi.order_id = o.id
              JOIN products p ON p.id = oi.product_id
              WHERE o.customer_id = c.id AND p.category = 'посуда');
          `,
          note: "Клиент либо подходит, либо нет — без размножения и `DISTINCT`; СУБД останавливает поиск на первой найденной паре.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.other-joins.ex1",
      title: "Сколько строк у каждого соединения",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Таблицы `l = (1, 2, 2, 3)` и `r = (2, 3, 3, 4)`. Не запуская, определите число строк каждого соединения по условию `l.k = r.k` и для `CROSS JOIN`."),
        code("sql", `CREATE TABLE l (k integer); CREATE TABLE r (k integer);
INSERT INTO l VALUES (1), (2), (2), (3);
INSERT INTO r VALUES (2), (3), (3), (4);
SELECT count(*) FROM l JOIN r ON l.k = r.k;
SELECT count(*) FROM l LEFT JOIN r ON l.k = r.k;
SELECT count(*) FROM l FULL JOIN r ON l.k = r.k;
SELECT count(*) FROM l CROSS JOIN r;`, { filename: "09-ex-predict.sql", runnable: true }),
      ],
      hints: ["Сколько пар у значения 2? У значения 3?", "Что добавляет `LEFT`, а что — `FULL`?", "Сколько всего пар у `CROSS JOIN`?"],
      checks: ["`INNER`: 4", "`LEFT`: 5", "`FULL`: 6", "`CROSS`: 16"],
      solution: [
        code("text", ` count 
-------
     4
(1 row)

 count 
-------
     5
(1 row)

 count 
-------
     6
(1 row)

 count 
-------
    16
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "Совпадения: значение 2 — 2 × 1 = 2 пары, значение 3 — 1 × 2 = 2 пары; всего 4.",
          "`LEFT` добавляет строку `1` без пары: 5. `FULL` — ещё и `4` справа: 6.",
          "`CROSS`: 4 × 4 = 16.",
        ),
      ],
    }),
    exercise({
      id: "sql.other-joins.ex2",
      title: "Пары коллег без дублей",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Нужны пары коллег отдела «поддержка» — каждая ровно один раз и без «пары с самим собой». Запрос возвращает четыре строки. Исправьте."),
        code("sql", `-- Хотим список пар коллег по отделу без дублей. Получили каждую пару дважды и «пары» с самими собой
SELECT a.name, b.name AS colleague
FROM employees AS a
JOIN employees AS b ON b.dept = a.dept
WHERE a.dept = 'поддержка'
ORDER BY a.name, b.name;`, { filename: "10-ex-fix.sql", runnable: true, fixture: "staff" }),
      ],
      hints: ["Какое условие исключает сравнение сотрудника с собой?", "Как избавиться от зеркальных пар «А — Б» и «Б — А»?"],
      checks: ["Условие `a.id < b.id`", "Одна строка: Юлия — Яков"],
      solution: [
        code("sql", `SELECT a.name, b.name AS colleague
FROM employees AS a
JOIN employees AS b ON b.dept = a.dept AND a.id < b.id
WHERE a.dept = 'поддержка'
ORDER BY a.name, b.name;`, { filename: "11-fix-solution.sql", runnable: true, fixture: "staff" }),
        code("text", ` name | colleague 
------+-----------
 Юлия | Яков
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("`a.id < b.id` одновременно исключает пару «сам с собой» (`id = id`) и зеркальную (если `a.id < b.id`, то обратный порядок невозможен)."),
      ],
    }),
    exercise({
      id: "sql.other-joins.ex3",
      title: "Цепочка подчинения",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Для сотрудников отдела «продажи» выведите: сотрудника, его руководителя и руководителя руководителя. Топ-менеджеры без вышестоящих должны остаться в результате."),
      ],
      hints: ["Сколько раз нужно соединить таблицу с собой?", "Какое соединение сохраняет сотрудников без руководителя?"],
      checks: ["Два `LEFT JOIN` по `employees`", "Фёдор: руководитель Ирина, выше — пусто", "Эльвира: Хлоя, выше — Фёдор"],
      solution: [
        code("sql", `-- Цепочка подчинения: сотрудник, руководитель и руководитель руководителя
SELECT e.name AS employee, m.name AS manager, mm.name AS manager_of_manager
FROM employees AS e
LEFT JOIN employees AS m  ON m.id  = e.manager_id
LEFT JOIN employees AS mm ON mm.id = m.manager_id
WHERE e.dept = 'продажи'
ORDER BY e.id;`, { filename: "12-challenge.sql", runnable: true, fixture: "staff" }),
        code("text", ` employee | manager | manager_of_manager 
----------+---------+--------------------
 Фёдор    | Ирина   | 
 Хлоя     | Фёдор   | Ирина
 Цезарь   | Фёдор   | Ирина
 Эльвира  | Хлоя    | Фёдор
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Два последовательных `LEFT JOIN` к той же таблице с разными псевдонимами дают два уровня вверх. Для произвольной глубины иерархии такой подход не годится — нужен рекурсивный CTE."),
      ],
    }),
  ],

  challenge: {
    id: "sql.other-joins.challenge",
    title: "Сверка плана и фактических продаж",
    scenario: [
      p("Отдел продаж ведёт план по товарам, склад — фактические отгрузки. Раз в неделю нужна сверка: что запланировано, но не продано; что продано без плана; где факт отличается от плана."),
    ],
    requirements: [
      "Единый список товаров из обеих таблиц с планом и фактом",
      "Вердикт по каждому товару: «нет продаж», «нет в плане», «сошлось», «расхождение»",
      "Строки обеих сторон не должны теряться",
    ],
    constraints: [
      "Используйте `FULL JOIN` и единый ключ через `COALESCE`",
      "Не фильтруйте результат в `WHERE` по столбцам одной из сторон",
    ],
    acceptance: [
      "Четыре строки: товары 1, 2, 3, 4",
      "Товар 1 — «нет продаж», 4 — «нет в плане», 2 — «расхождение», 3 — «сошлось»",
    ],
    hints: [
      "`COALESCE(p.product_id, a.product_id)` — ключ строки.",
      "`CASE` проверяет `IS NULL` сторон, затем сравнивает значения.",
    ],
    solution: [
      code("sql", `-- Сверка плана и факта: FULL JOIN показывает строки, которые есть только в одной из таблиц
CREATE TABLE plan   (product_id integer PRIMARY KEY, planned integer NOT NULL);
CREATE TABLE actual (product_id integer PRIMARY KEY, sold    integer NOT NULL);
INSERT INTO plan   VALUES (1, 10), (2, 20), (3, 5);
INSERT INTO actual VALUES (2, 18), (3, 5), (4, 7);

SELECT COALESCE(p.product_id, a.product_id) AS product_id,
       p.planned, a.sold,
       CASE WHEN p.product_id IS NULL THEN 'нет в плане'
            WHEN a.product_id IS NULL THEN 'нет продаж'
            WHEN a.sold = p.planned   THEN 'сошлось'
            ELSE 'расхождение' END AS verdict
FROM plan AS p
FULL JOIN actual AS a ON a.product_id = p.product_id
ORDER BY product_id;`, { filename: "01-full-join.sql", runnable: true }),
      code("text", ` product_id | planned | sold |   verdict   
------------+---------+------+-------------
          1 |      10 |      | нет продаж
          2 |      20 |   18 | расхождение
          3 |       5 |    5 | сошлось
          4 |         |    7 | нет в плане
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`FULL JOIN` сохранил строки обеих таблиц: товар 1 (только в плане) и товар 4 (только в продажах). Вердикт строится по тому, какая сторона `NULL`, и только затем сравниваются значения. Условие по одной стороне в `WHERE` убрало бы как раз «несовпавшие» строки."),
    ],
  },

  interview: [
    iq("sql.other-joins.i1", "basic", "Когда нужен FULL JOIN?", [
      ul(
        "Когда важны строки обеих сторон: сверка двух наборов, поиск расхождений в обе стороны, слияние источников.",
        "В результате — пары, строки только слева (справа `NULL`) и только справа (слева `NULL`).",
        "Для ключа строки используют `COALESCE(a.key, b.key)`.",
      ),
    ]),
    iq("sql.other-joins.i2", "basic", "Что такое CROSS JOIN и для чего он нужен?", [
      ul(
        "Декартово произведение: все пары строк двух источников (M × N).",
        "Полезен для сеток «период × категория», генерации комбинаций и перебора; в сочетании с `LEFT JOIN` даёт отчёты с нулями вместо пропусков.",
        "Случайный `CROSS JOIN` (забытое условие) — частая причина «миллионов лишних строк».",
      ),
    ]),
    iq("sql.other-joins.i3", "intermediate", "Как выбрать «пары» строк одной таблицы без дублей и сравнения с самой собой?", [
      ul(
        "`FROM t a JOIN t b ON … AND a.id < b.id`.",
        "Условие по `id` исключает `a = b` и зеркальные пары (в замере 4 строки → 1).",
        "Если уникального ключа нет, используйте служебный столбец (`ctid` в PostgreSQL, `rowid` в SQLite) или оконную функцию `row_number()`.",
      ),
    ]),
    iq("sql.other-joins.i4", "intermediate", "В чём разница между JOIN и EXISTS при поиске клиентов, купивших посуду?", [
      ul(
        "`JOIN` размножает клиента по числу покупок (в замере 7 строк для 5 клиентов); нужен `DISTINCT`.",
        "`EXISTS` проверяет наличие хотя бы одной пары и возвращает каждого клиента один раз.",
        "`EXISTS` останавливает поиск на первой найденной паре — обычно быстрее и безопаснее.",
      ),
    ]),
    iq("sql.other-joins.i5", "intermediate", "Как получить для сотрудника цепочку руководителей на два уровня?", [
      ul(
        "Два `LEFT JOIN` к той же таблице: `m` по `e.manager_id`, `mm` по `m.manager_id`.",
        "`LEFT`, чтобы не потерять сотрудников без руководителя.",
        "Для произвольной глубины — рекурсивный CTE (`WITH RECURSIVE`).",
      ),
    ]),
    iq("sql.other-joins.i6", "advanced", "Что такое LATERAL и когда он нужен?", [
      ul(
        "Подзапрос в `FROM`, который может ссылаться на столбцы предыдущих источников.",
        "Позволяет «для каждой строки слева взять N строк справа» (`ORDER BY … LIMIT n`).",
        "В замере для каждого клиента выведены два последних заказа. Альтернатива — оконные функции (`row_number() OVER (PARTITION BY …)`).",
      ),
    ]),
    iq("sql.other-joins.i7", "engineering", "Почему соединения не по равенству (BETWEEN, <, >) обычно медленнее?", [
      ul(
        "Хэш-соединение и merge-соединение рассчитаны на равенство; для диапазонов остаются вложенные циклы с проверкой условия для каждой пары.",
        "Помогают индексы по границам диапазона и ограничение левой стороны; иногда — материализация диапазонов в календарь/справочник и соединение по равенству.",
        "Диапазоны не должны пересекаться: иначе строки размножаются.",
      ),
    ]),
    iq("sql.other-joins.i8", "debugging", "FULL JOIN «потерял» строки, которые есть только в одной таблице. Что проверить?", [
      ul(
        "Условие в `WHERE` по столбцу одной стороны: строки с `NULL` на этой стороне отброшены.",
        "Ключи с `NULL`: `NULL` не совпадает ни с чем — строка остаётся только с одной стороны (это норма).",
        "`INNER JOIN` в цепочке после `FULL JOIN`, отбрасывающий «пустые» строки.",
        "Решение: условия — в `ON` или через подзапросы до соединения.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.other-joins.e1", "foundation", "Какие строки сохраняет `FULL JOIN`?", ["Только совпавшие", "Все строки левой", "Все строки обеих таблиц", "Только строки без пар"], 2, "`FULL JOIN` сохраняет все строки обеих сторон; несовпавшие дополняются `NULL`."),
    mcq("sql.other-joins.e2", "foundation", "Сколько строк даст `CROSS JOIN` таблиц с 8 и 13 строками?", ["104", "13", "21", "8"], 0, "`CROSS JOIN` строит все пары строк: 8 × 13 = 104 (замер); поэтому забытое условие соединения так опасно."),
    mcq("sql.other-joins.e3", "foundation", "Чему равносилен `A RIGHT JOIN B`?", ["`A LEFT JOIN B`", "`A FULL JOIN B`", "`A INNER JOIN B`", "`B LEFT JOIN A`"], 3, "`RIGHT JOIN` сохраняет правую таблицу — то же, что `LEFT JOIN` с переставленными таблицами."),
    mcq("sql.other-joins.e4", "intermediate", "Какое условие убирает зеркальные пары и «пары с самим собой» в SELF JOIN?", ["`a.id <> b.id`", "`a.id < b.id`", "`a.id = b.id`", "`a.id IS NULL`"], 1, "`a.id < b.id` оставляет каждую пару в одном порядке и исключает равные идентификаторы (`<>` оставил бы зеркальные)."),
    mcq("sql.other-joins.e5", "intermediate", "Какие утверждения верны? Выберите все.", ["`FULL JOIN` нужен для сверок двух наборов", "`CROSS JOIN` не использует условие соединения", "`SELF JOIN` невозможен без `WITH RECURSIVE`", "`EXISTS` не размножает строки левой таблицы"], [0, 1, 3], "`SELF JOIN` — обычное соединение с псевдонимами; рекурсивный CTE нужен для иерархий произвольной глубины."),
    mcq("sql.other-joins.e6", "intermediate", "Сколько строк вернёт `l FULL JOIN r ON l.k = r.k` для `l = (1, 2, 2, 3)` и `r = (2, 3, 3, 4)`?", ["4", "5", "16", "6"], 3, "4 совпавшие пары + `1` без пары + `4` без пары = 6 (замер)."),
    mcq("sql.other-joins.e7", "advanced", "Почему `JOIN` вместо `EXISTS` вернул 7 строк, а `EXISTS` — 5 клиентов?", ["Из-за `DISTINCT`", "`EXISTS` отбрасывает часть клиентов", "Соединение размножает клиента по числу его покупок посуды, а `EXISTS` проверяет только наличие", "Из-за `NULL`"], 2, "Клиенты с несколькими покупками встречаются в соединении несколько раз; `EXISTS` возвращает каждого один раз."),
    open("sql.other-joins.e8", "intermediate", "Опишите, как построить отчёт «клиенты × статусы заказов» с нулями в пустых ячейках, и объясните роль каждого соединения.", [
      ul(
        "Справочник статусов (`VALUES` или таблица) — вторая ось.",
        "`CROSS JOIN customers × statuses` даёт все возможные комбинации (клиентов × статусов строк).",
        "`LEFT JOIN orders ON customer_id = c.id AND status = s.status` подсчитывает заказы в каждой ячейке; пустые остаются с `NULL`.",
        "`count(o.id)` даёт нули; `GROUP BY c.id, s.status`; без `CROSS JOIN` ячейки с нулями просто отсутствовали бы.",
      ),
    ], ["Названы обе оси", "Роль CROSS JOIN", "Роль LEFT JOIN и условия в ON", "count(o.id) даёт нули"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.other-joins.m1", "intermediate", "Сколько строк даст соединение `employees e JOIN employees b ON b.dept = e.dept AND e.id < b.id` для отдела из трёх человек?", ["9", "3", "6", "1"], 1, "Пар из трёх человек без зеркал и самих с собой — 3 (C(3,2))."),
    mcq("sql.other-joins.m2", "advanced", "Почему SELF JOIN по `manager_id` с `INNER JOIN` потеряет сотрудника Ирину?", ["У неё `manager_id = NULL`, пары нет", "Из-за повторения имени", "`INNER JOIN` не работает на одной таблице", "Из-за `ORDER BY`"], 0, "Для корня иерархии пары нет; `LEFT JOIN` сохраняет такие строки с `NULL` в столбцах руководителя."),
    mcq("sql.other-joins.m3", "advanced", "Что произойдёт, если разряды заданы как `BETWEEN 100000 AND 150000` и `BETWEEN 150000 AND 200000`, а сотрудник получает ровно 150000?", ["Попадёт в первый разряд", "Попадёт во второй", "Попадёт в оба — строка размножится", "Не попадёт никуда"], 2, "Границы `BETWEEN` включены с обеих сторон: строка совпадёт с двумя разрядами; нужны полуоткрытые диапазоны."),
    open("sql.other-joins.m4", "advanced", "Нужно найти в таблице заказов «подозрительные дубли»: пары заказов одного клиента в один день с одинаковым составом строк. Опишите, какие соединения и условия вы используете и как избежать зеркальных пар и размножения.", [
      ul(
        "`SELF JOIN` заказов: `a.customer_id = b.customer_id AND a.ordered_on = b.ordered_on AND a.id < b.id` — без зеркал и самих с собой.",
        "Состав сравнивают через позиции: для каждой пары проверить, что множества `(product_id, qty)` равны — `NOT EXISTS` в обе стороны (или сравнение агрегатов `string_agg` / хэша отсортированного состава по заказу).",
        "Чтобы не размножить пары позициями, сравнение состава делают в подзапросе над позициями, а не соединением позиций в основном запросе.",
        "Результат проверяют на известных примерах и контрольных числах; для больших таблиц — предварительный хэш состава заказа и группировка по `(customer_id, ordered_on, hash)`.",
      ),
    ], ["Условие a.id < b.id", "Сравнение состава через NOT EXISTS или агрегат", "Защита от размножения", "Предложен более быстрый способ"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.other-joins.f1", front: "FULL JOIN?", back: "Строки обеих сторон: пары, только слева, только справа. Сверки, расхождения. Ключ строки — COALESCE(a.k, b.k)." },
    { id: "sql.other-joins.f2", front: "CROSS JOIN?", back: "Все пары M × N. Сетка «измерение × измерение» + LEFT JOIN для нулей." },
    { id: "sql.other-joins.f3", front: "RIGHT JOIN?", back: "Зеркало LEFT JOIN. Пишите LEFT, переставив таблицы." },
    { id: "sql.other-joins.f4", front: "SELF JOIN?", back: "Таблица соединена сама с собой через два псевдонима: иерархии, пары, сравнения." },
    { id: "sql.other-joins.f5", front: "Пары без зеркал?", back: "a.id < b.id: нет «себя с собой» и зеркальных пар." },
    { id: "sql.other-joins.f6", front: "EXISTS и JOIN?", back: "EXISTS — факт наличия, без размножения. JOIN размножает по числу совпадений (7 строк против 5 клиентов)." },
    { id: "sql.other-joins.f7", front: "LATERAL?", back: "PostgreSQL: подзапрос в FROM ссылается на строки слева. Для «первые N на каждую строку»." },
    { id: "sql.other-joins.f8", front: "Соединение не по равенству?", back: "BETWEEN, <, >: вложенные циклы, дорого. Диапазоны — полуоткрытые и без пересечений." },
  ],

  sources: [
    { title: "PostgreSQL 16: Joined Tables (outer joins, CROSS JOIN)", url: "https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-JOIN", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: LATERAL Subqueries", url: "https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-LATERAL", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Subquery Expressions (EXISTS)", url: "https://www.postgresql.org/docs/16/functions-subquery.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Table Aliases (self-joins)", url: "https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-TABLE-ALIASES", publisher: "PostgreSQL" },
    { title: "SQLite: RIGHT and FULL OUTER JOIN (3.39.0)", url: "https://www.sqlite.org/releaselog/3_39_0.html", publisher: "Other" },
    { title: "SQLite: JOIN clause", url: "https://www.sqlite.org/syntax/join-clause.html", publisher: "Other" },
  ],
};
