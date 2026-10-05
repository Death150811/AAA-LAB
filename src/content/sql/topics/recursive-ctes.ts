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
  steps,
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const recursiveCtes: Topic = {
  id: "sql.recursive-ctes",
  slug: "recursive-ctes",
  domain: "sql",
  module: "advanced-sql",
  title: "Рекурсивные CTE: иерархии и графы",
  titleEn: "Recursive CTEs: Hierarchies and Graphs",
  summary:
    "`WITH RECURSIVE` позволяет запросу ссылаться на собственный результат: стартовая строка (якорь) и шаг, который порождает новые строки из предыдущих, пока шаг что-то возвращает. Тема на замерах PostgreSQL 16.14 и SQLite 3.49 показывает, как обойти оргструктуру вниз (подчинённые Фёдора: 6 строк на уровнях 0–2) и вверх (цепочка Якова: 4 звена), построить путь `Ирина > Павел > Ольга > Тимур`, посчитать фонды зарплат поддеревьев (у Ирины — 1 830 000 и 11 подчинённых), найти маршруты в графе с циклом (в графе из задачи-вызова из A в D ведут три маршрута: `A,D`, `A,B,D`, `A,B,C,D`), почему `UNION ALL` без защиты «ходит по кругу» (шесть строк A, B, A, B, A, B до ограничителя глубины) и как `CYCLE` и `SEARCH` (PostgreSQL 14+) делают то же без ручных путей.",
  minutes: 80,
  prerequisites: ["sql.ctes", "sql.other-joins"],
  tags: ["WITH RECURSIVE", "recursive CTE", "hierarchy", "tree", "graph", "anchor", "recursive term", "UNION ALL", "UNION", "cycle detection", "CYCLE", "SEARCH", "path", "depth", "bill of materials"],
  keyConcepts: [
    { term: "Рекурсивная CTE = якорь + шаг", text: "Якорный запрос даёт стартовые строки, рекурсивный — новые строки на основе строк предыдущего шага; процесс идёт, пока шаг не вернёт пустой результат. Например: `1, 2, …, 10` с факториалами до `3628800`." },
    { term: "Иерархия обходится по связи «родитель — потомок»", text: "`JOIN employees e ON e.manager_id = t.id` спускается на уровень вниз; обратное условие `e.id = c.manager_id` — поднимается вверх." },
    { term: "Цикл в данных — бесконечная рекурсия", text: "При `UNION ALL` и цикле A→B→A запрос порождал строки A, B, A, B… и остановился только на ограничителе `hops < 5` (6 строк). Защита: путь с проверкой «уже были», `UNION` без повторов или `CYCLE` (PostgreSQL 14+)." },
    { term: "LIMIT останавливает «бесконечную» рекурсию", text: "`WITH RECURSIVE nat(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM nat) SELECT n FROM nat LIMIT 5` вернул 1–5: строки вычисляются лениво, по мере чтения." },
    { term: "Агрегаты по поддеревьям", text: "Отслеживая `root_id` на каждом шаге, можно посчитать размер и сумму любого поддерева одним запросом: у Павла 4 подчинённых и фонд 840 000." },
  ],
  sections: [
    section("definition", [
      def("Рекурсивная CTE", "CTE, объявленная как `WITH RECURSIVE`, в определении которой есть ссылка на себя. Состоит из якорного запроса и рекурсивного, соединённых `UNION [ALL]`.", "recursive CTE"),
      def("Якорный запрос", "Нерекурсивная часть, дающая стартовые строки (корень дерева, начальную вершину графа, первое число).", "anchor member"),
      def("Рекурсивный шаг", "Часть, ссылающаяся на саму CTE: для строк, полученных на предыдущем шаге, вычисляет новые. Выполняется, пока возвращает хотя бы одну строку.", "recursive member"),
      def("Иерархия", "Данные «родитель — потомок» в одной таблице (`employees.manager_id`, категории, файловое дерево). У корня родителя нет (`NULL`).", "hierarchy / adjacency list"),
      def("Цикл", "Ситуация, когда обход возвращается в уже посещённую строку (A→B→A). Для дерева — ошибка данных, для графа — обычное свойство.", "cycle"),
      def("Глубина и путь", "Служебные столбцы рекурсии: номер уровня (`depth`) и накопленный путь от корня (`path`) — основа сортировки, вывода и защиты от циклов.", "depth / path"),
      def("SEARCH и CYCLE", "Предложения PostgreSQL 14+ после рекурсивной CTE: `SEARCH` задаёт порядок обхода (в глубину/ширину), `CYCLE` отслеживает повторное посещение и помечает цикл.", "SEARCH / CYCLE clauses"),
    ]),

    section("why", [
      h("Иерархии и графы не умещаются в плоский запрос"),
      p("Оргструктура, дерево категорий, комментарии с ответами, маршруты, зависимости пакетов — глубина **заранее неизвестна**. «Все подчинённые руководителя» невозможно записать конечным числом `JOIN`: сегодня три уровня, завтра пять. Рекурсивная CTE обходит структуру на любую глубину одним запросом, без цикла в приложении."),
      ul(
        "**Иерархии:** подчинённые и руководители, категории товаров, файловые структуры.",
        "**Графы:** маршруты, зависимости, рекомендации «друзья друзей».",
        "**Генерация данных:** числа, даты, календари (когда нет `generate_series`).",
        "**Агрегаты по поддеревьям:** размер команды, фонд зарплат, итоги по категориям.",
      ),
    ]),

    section("mental-model", [
      h("Волны: каждая строка порождает следующие"),
      p("Представьте волны на воде: якорь — первый камень, брошенный в воду; рекурсивный шаг берёт **последнюю волну** (только строки, добавленные на предыдущем шаге) и порождает следующую. Процесс заканчивается, когда новая волна пуста. Результат CTE — все волны вместе (для `UNION ALL`)."),
      diagram(
        `
        Шаг 0 (якорь):      Фёдор(7)                                    ← employees WHERE id = 7
                               │
        Шаг 1:        Хлоя(8)  Цезарь(9)  Юлия(11)                      ← manager_id = 7
                         │                   │
        Шаг 2:       Эльвира(10)          Яков(12)                      ← manager_id ∈ {8, 9, 11}
                                                                          Шаг 3: пусто → конец
        `,
        "Рекурсивный шаг видит только строки предыдущей волны, а не весь накопленный результат.",
      ),
      h("Структура рекурсивного запроса"),
      steps(
        [
          ["Якорь", "Что берём в начале: корень дерева, начальную вершину, первое число."],
          ["`UNION ALL`", "Склеивает волны; `UNION` дополнительно убирает повторы (и защищает от некоторых циклов)."],
          ["Шаг", "`SELECT … FROM таблица JOIN cte ON связь` — как из строки предыдущей волны получить новые."],
          ["Остановка", "Шаг перестаёт возвращать строки сам (конец ветвей) либо ограничен условием (`depth < N`, «уже были»)."],
          ["Итог", "Внешний `SELECT … FROM cte` фильтрует, сортирует, агрегирует результат."],
        ],
        "Как устроена рекурсивная CTE",
      ),
    ]),

    section("technical", [
      h("Синтаксис и правила"),
      ul(
        "`WITH RECURSIVE имя(столбцы) AS ( якорь UNION [ALL] рекурсивный_шаг ) SELECT … FROM имя`.",
        "Ссылка на саму CTE допустима **только в рекурсивной части**, ровно один раз и не внутри агрегата или подзапроса.",
        "Типы столбцов задаются якорем: `SELECT 'A'::text, 0` — иначе в PostgreSQL `'A'` может быть `unknown`.",
        "**`UNION ALL`** сохраняет все строки (быстро, но не защищает от циклов); **`UNION`** удаляет повторы: при цикле без «уникализирующих» столбцов (глубина, путь) обход остановится сам.",
        "Порядок строк результата не определён: упорядочивайте внешним `ORDER BY` (по `path`, `depth`, `SEARCH`).",
      ),
      h("Типовые шаблоны"),
      table(
        ["Задача", "Якорь", "Условие шага"],
        [
          ["Подчинённые вниз", "Выбранный руководитель", "`e.manager_id = t.id`"],
          ["Руководители вверх", "Выбранный сотрудник", "`e.id = c.manager_id`"],
          ["Путь от корня", "Корень (`manager_id IS NULL`), `path = name`", "`path || ' > ' || e.name`"],
          ["Размер/сумма поддерева", "Каждый сотрудник как свой корень (`root_id = id`)", "Сохранять `root_id`, агрегировать по нему"],
          ["Маршруты в графе", "Начальная вершина, `path = ',A,'`", "`WHERE path NOT LIKE '%,' || dst || ',%'`"],
          ["Числа и даты", "`SELECT 1`", "`n + 1 … WHERE n < N`"],
        ],
        "Шаблоны рекурсивных запросов",
      ),
      h("Защита от бесконечности"),
      ul(
        "Условие `depth < N` — ограничитель по глубине (не защищает от повторов внутри глубины).",
        "Накопление пути и проверка «не посещали» — надёжно (в PostgreSQL удобнее массивы: `path || id`, `id <> ALL(path)`).",
        "`UNION` без `ALL`, если в строках нет растущих столбцов (глубина, путь).",
        "PostgreSQL 14+: `CYCLE col SET is_cycle USING path`.",
        "Внешний `LIMIT` — страховка в ручных запросах (строки считаются лениво).",
      ),
    ]),

    section("syntax", [
      annotated(
        "sql",
        `-- Все подчинённые Фёдора (id 7) на любой глубине, с уровнем
WITH RECURSIVE team(id, name, manager_id, depth) AS (
  SELECT id, name, manager_id, 0 FROM employees WHERE id = 7
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.depth + 1
  FROM employees AS e JOIN team AS t ON e.manager_id = t.id
)
SELECT depth, name FROM team ORDER BY depth, name;`,
        [
          { line: 1, text: "Комментарий формулирует задачу: подчинённые Фёдора на любой глубине." },
          { line: 2, text: "`WITH RECURSIVE team(id, name, manager_id, depth)` — имя CTE и список её столбцов; `depth` отслеживает уровень." },
          { line: 3, text: "Якорь: сам Фёдор на уровне 0." },
          { line: 4, text: "`UNION ALL` склеивает волны результата." },
          { line: [5, 7], text: "Рекурсивный шаг: сотрудники, чей `manager_id` равен `id` строки предыдущей волны; глубина увеличивается на 1." },
          { line: 8, text: "Внешний запрос выводит результат; порядок задан явно." },
        ],
        "02-subordinates.sql",
      ),
    ]),

    section("minimal-example", [
      p("Самая короткая рекурсия — числа с накопленными значениями: факториал и числа Фибоначчи. Якорь — первая строка, шаг — следующая, условие `n < 10` останавливает процесс."),
      code("sql", `-- Базовый шаг + рекурсивный шаг: числа, факториалы и Фибоначчи
WITH RECURSIVE t(n, factorial, fib_a, fib_b) AS (
  SELECT 1, 1, 0, 1                                  -- якорь: стартовая строка
  UNION ALL
  SELECT n + 1, factorial * (n + 1), fib_b, fib_a + fib_b FROM t WHERE n < 10   -- шаг и условие остановки
)
SELECT n, factorial, fib_a AS fibonacci FROM t ORDER BY n;`, { filename: "01-numbers.sql", runnable: true }),
      code("text", ` n  | factorial | fibonacci 
----+-----------+-----------
  1 |         1 |         0
  2 |         2 |         1
  3 |         6 |         1
  4 |        24 |         2
  5 |       120 |         3
  6 |       720 |         5
  7 |      5040 |         8
  8 |     40320 |        13
  9 |    362880 |        21
 10 |   3628800 |        34
(10 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Десять строк: `10! = 3628800`, десятое число Фибоначчи (при нумерации с нуля) — 34. Без `WHERE n < 10` рекурсия не остановилась бы."),
    ]),

    section("detailed-example", [
      p("Иерархия сотрудников: Ирина — верх, у неё Павел (разработка) и Фёдор (продажи); у них свои команды. Обход вниз от Фёдора:"),
      code("sql", `-- Все подчинённые Фёдора (id 7) на любой глубине, с уровнем
WITH RECURSIVE team(id, name, manager_id, depth) AS (
  SELECT id, name, manager_id, 0 FROM employees WHERE id = 7
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.depth + 1
  FROM employees AS e JOIN team AS t ON e.manager_id = t.id
)
SELECT depth, name FROM team ORDER BY depth, name;`, { filename: "02-subordinates.sql", runnable: true, fixture: "staff" }),
      code("text", ` depth |  name   
-------+---------
     0 | Фёдор
     1 | Хлоя
     1 | Цезарь
     1 | Юлия
     2 | Эльвира
     2 | Яков
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Шесть человек на трёх уровнях: сам Фёдор (0), Хлоя, Цезарь, Юлия (1), Эльвира, Яков (2). Теперь вся оргструктура с путём и отступами — основа для вывода «дерева»:"),
      code("sql", `-- Оргструктура с путём от корня и отступом по глубине
WITH RECURSIVE tree(id, name, depth, path) AS (
  SELECT id, name, 0, name FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, t.depth + 1, t.path || ' > ' || e.name
  FROM employees AS e JOIN tree AS t ON e.manager_id = t.id
)
SELECT substr('          ', 1, depth * 2) || name AS org_chart, path
FROM tree
ORDER BY path;`, { filename: "03-path.sql", runnable: true, fixture: "staff" }),
      code("text", `   org_chart   |              path              
---------------+--------------------------------
 Ирина         | Ирина
   Павел       | Ирина > Павел
     Ольга     | Ирина > Павел > Ольга
       Тимур   | Ирина > Павел > Ольга > Тимур
       Ульяна  | Ирина > Павел > Ольга > Ульяна
     Семён     | Ирина > Павел > Семён
   Фёдор       | Ирина > Фёдор
     Хлоя      | Ирина > Фёдор > Хлоя
       Эльвира | Ирина > Фёдор > Хлоя > Эльвира
     Цезарь    | Ирина > Фёдор > Цезарь
     Юлия      | Ирина > Фёдор > Юлия
       Яков    | Ирина > Фёдор > Юлия > Яков
(12 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Сортировка по `path` даёт порядок «обход в глубину»: потомки сразу под своим родителем. Отступ — `depth × 2` пробелов."),
      h("Вверх по иерархии"),
      code("sql", `-- Цепочка руководителей снизу вверх для Якова (id 12)
WITH RECURSIVE chain(id, name, manager_id, level) AS (
  SELECT id, name, manager_id, 0 FROM employees WHERE id = 12
  UNION ALL
  SELECT e.id, e.name, e.manager_id, c.level + 1
  FROM employees AS e JOIN chain AS c ON e.id = c.manager_id
)
SELECT level, name FROM chain ORDER BY level;`, { filename: "04-ancestors.sql", runnable: true, fixture: "staff" }),
      code("text", ` level | name  
-------+-------
     0 | Яков
     1 | Юлия
     2 | Фёдор
     3 | Ирина
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Цепочка Якова: он сам (0), Юлия (1), Фёдор (2), Ирина (3). Условие шага перевёрнуто: `e.id = c.manager_id` — берём руководителя строки предыдущей волны."),
    ]),

    section("analysis", [
      table(
        ["Запрос", "Результат", "Что показывает"],
        [
          ["Подчинённые Фёдора (id 7)", "6 строк, уровни 0–2", "Обход вниз на любую глубину"],
          ["Цепочка Якова вверх", "4 строки, уровни 0–3", "Обход вверх по `manager_id`"],
          ["`team` для Ольги (id 3)", "3 человека, глубина 1", "Ольга, Тимур и Ульяна"],
          ["Подсчёт по поддеревьям", "Ирина — 11 подчинённых, 1 830 000", "Весь штат: 12 человек, сумма всех зарплат"],
          ["Маршруты A→D (граф из `06-graph.sql`)", "2 маршрута: `A,D` и `A,B,C,D` (1 и 3 шага)", "Путь с защитой от повторных посещений в графе с циклом A→B→C→A"],
        ],
        "Результаты рекурсивных запросов (замеры PostgreSQL 16.14)",
      ),
      code("sql", `-- Для каждого сотрудника: сколько человек в его поддереве и их суммарная зарплата
WITH RECURSIVE subtree(root_id, id, salary) AS (
  SELECT id, id, salary FROM employees
  UNION ALL
  SELECT s.root_id, e.id, e.salary
  FROM subtree AS s JOIN employees AS e ON e.manager_id = s.id
)
SELECT r.name, count(*) - 1 AS reports, sum(s.salary) AS payroll
FROM subtree AS s JOIN employees AS r ON r.id = s.root_id
GROUP BY r.id, r.name
HAVING count(*) > 1
ORDER BY payroll DESC;`, { filename: "05-subtree-sums.sql", runnable: true, fixture: "staff" }),
      code("text", ` name  | reports | payroll 
-------+---------+---------
 Ирина |      11 | 1830000
 Павел |       4 |  840000
 Фёдор |       5 |  690000
 Ольга |       2 |  440000
 Хлоя  |       1 |  205000
 Юлия  |       1 |  175000
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Каждый сотрудник — корень собственного поддерева (`root_id = id` в якоре); шаг переносит `root_id` дальше вместе с потомками.",
        "`count(*) - 1` — число подчинённых (без самого корня); `HAVING count(*) > 1` отбрасывает «листья».",
        "Контроль: у Ирины 11 подчинённых и сумма 1 830 000 — это весь штат и общий фонд зарплат.",
      ),
    ]),

    section("internals", [
      h("Как исполняется рекурсия"),
      p("PostgreSQL выполняет якорь, кладёт его строки в рабочую таблицу, затем многократно выполняет рекурсивную часть, подставляя вместо ссылки на CTE **только строки предыдущей итерации**; результаты добавляются к итогу и становятся рабочей таблицей следующего шага. Когда итерация не вернула строк, обход завершается. Для `UNION` каждая новая строка сверяется с уже выданными, для `UNION ALL` — нет."),
      h("Циклы в графе"),
      code("sql", `-- Граф дорог с циклом: A→B, B→C, C→A, C→D. Путь хранится строкой, повторное посещение запрещено
CREATE TABLE roads (src text, dst text);
INSERT INTO roads VALUES ('A', 'B'), ('B', 'C'), ('C', 'A'), ('C', 'D'), ('A', 'D');

WITH RECURSIVE walk(node, hops, path) AS (
  SELECT 'A', 0, ',A,'
  UNION ALL
  SELECT r.dst, w.hops + 1, w.path || r.dst || ','
  FROM walk AS w JOIN roads AS r ON r.src = w.node
  WHERE w.path NOT LIKE '%,' || r.dst || ',%'
)
SELECT node, min(hops) AS shortest_hops, count(*) AS routes
FROM walk
GROUP BY node
ORDER BY node;`, { filename: "06-graph.sql", runnable: true }),
      code("text", ` node | shortest_hops | routes 
------+---------------+--------
 A    |             0 |      1
 B    |             1 |      1
 C    |             2 |      1
 D    |             1 |      2
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("В графе есть цикл A→B→C→A. Путь хранится строкой `,A,B,`, и шаг запрещает вершину, которая уже в пути. Результат: `D` достижима за 1 пересадку (напрямую) и ещё одним маршрутом (через `B` и `C`: 2 маршрута), остальные вершины — по одному."),
      h("Что будет без защиты"),
      code("sql", `-- В данных цикл A→B→A. Запрос защищён только ограничением глубины — и «ходит по кругу»
CREATE TABLE roads (src text, dst text);
INSERT INTO roads VALUES ('A', 'B'), ('B', 'A');

WITH RECURSIVE walk(node, hops) AS (
  SELECT 'A', 0
  UNION ALL
  SELECT r.dst, w.hops + 1 FROM walk AS w JOIN roads AS r ON r.src = w.node WHERE w.hops < 5
)
SELECT hops, node FROM walk ORDER BY hops;`, { filename: "11-ex-fix.sql", runnable: true }),
      code("text", ` hops | node 
------+------
    0 | A
    1 | B
    2 | A
    3 | B
    4 | A
    5 | B
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Граф с циклом A→B→A обходится по кругу: A, B, A, B, A, B — остановил только ограничитель `hops < 5`. Без него запрос работал бы, пока не кончится память или время. Ограничитель глубины защищает от бесконечности, но не от повторов и **раздувает результат**."),
      h("Ленивое вычисление и LIMIT"),
      code("sql", `-- «Бесконечная» рекурсия безопасна, если снаружи есть LIMIT: строки вычисляются по мере надобности
WITH RECURSIVE nat(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM nat)
SELECT n FROM nat LIMIT 5;`, { filename: "07-limit-stops.sql", runnable: true }),
      code("text", ` n 
---
 1
 2
 3
 4
 5
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Запрос формально бесконечен, но внешний `LIMIT 5` остановил его: PostgreSQL и SQLite вычисляют рекурсию по мере чтения результата. Это удобно для экспериментов, но не заменяет защиту от циклов в рабочих запросах."),
      h("PostgreSQL 14+: SEARCH и CYCLE"),
      code("sql", `CREATE TABLE roads (src text, dst text);
INSERT INTO roads VALUES ('A', 'B'), ('B', 'C'), ('C', 'A'), ('C', 'D');

-- PostgreSQL 14+: CYCLE сам отслеживает повторное посещение, SEARCH задаёт порядок обхода
WITH RECURSIVE walk(node, hops) AS (
  SELECT 'A'::text, 0
  UNION ALL
  SELECT r.dst, w.hops + 1 FROM walk AS w JOIN roads AS r ON r.src = w.node
) SEARCH DEPTH FIRST BY node SET visit_order
  CYCLE node SET is_cycle USING path
SELECT node, hops, is_cycle, path
FROM walk ORDER BY visit_order;`, { filename: "08-search-cycle.pg.sql" }),
      code("text", ` node | hops | is_cycle |       path        
------+------+----------+-------------------
 A    |    0 | f        | {(A)}
 B    |    1 | f        | {(A),(B)}
 C    |    2 | f        | {(A),(B),(C)}
 A    |    3 | t        | {(A),(B),(C),(A)}
 D    |    3 | f        | {(A),(B),(C),(D)}
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`CYCLE node SET is_cycle USING path` сам ведёт путь и помечает строку, в которой вершина повторилась (`A` на шаге 3, `is_cycle = t`) — дальше от неё рекурсия не идёт. `SEARCH DEPTH FIRST BY node SET visit_order` задаёт столбец для упорядочения обхода в глубину."),
      h("UNION и UNION ALL при цикле"),
      code("sql", `CREATE TABLE roads (src text, dst text);
INSERT INTO roads VALUES ('A', 'B'), ('B', 'A');

-- UNION ALL без защиты от цикла: ограничитель по глубине спасает от бесконечности
WITH RECURSIVE walk(node, hops) AS (
  SELECT 'A'::text, 0
  UNION ALL
  SELECT r.dst, w.hops + 1 FROM walk w JOIN roads r ON r.src = w.node WHERE w.hops < 5
)
SELECT count(*) AS rows_until_depth_limit, max(hops) AS max_hops FROM walk;

-- UNION (с устранением повторов) останавливается сам, когда новых строк нет
WITH RECURSIVE walk(node) AS (
  SELECT 'A'::text
  UNION
  SELECT r.dst FROM walk w JOIN roads r ON r.src = w.node
)
SELECT node FROM walk ORDER BY node;`, { filename: "09-no-guard.pg.sql" }),
      code("text", ` rows_until_depth_limit | max_hops 
------------------------+----------
                      6 |        5
(1 row)

 node 
------
 A
 B
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`UNION ALL` с ограничителем глубины 5 выдал 6 строк (глубины 0–5), а `UNION` остановился сам, получив только `A` и `B`: новые строки с уже известными значениями отбрасываются. `UNION` работает, только если строки не содержат растущих столбцов (глубина, путь)."),
    ]),

    section("mistakes", [
      h("Ошибка: рекурсия без условия остановки"),
      p("Для иерархии без циклов шаг остановится сам (когда у последних потомков нет детей). Но если в данных появился цикл (`A` — руководитель `B`, а `B` — руководитель `A`) или если это граф, запрос с `UNION ALL` не завершится. Всегда задумывайтесь: «а что будет при цикле?»"),
      h("Ошибка: ограничение глубины вместо защиты от циклов"),
      code("sql", `CREATE TABLE roads (src text, dst text);
INSERT INTO roads VALUES ('A', 'B'), ('B', 'A');

WITH RECURSIVE walk(node, hops, path) AS (
  SELECT 'A', 0, ',A,'
  UNION ALL
  SELECT r.dst, w.hops + 1, w.path || r.dst || ','
  FROM walk AS w JOIN roads AS r ON r.src = w.node
  WHERE w.path NOT LIKE '%,' || r.dst || ',%'
)
SELECT hops, node FROM walk ORDER BY hops;`, { filename: "12-fix-solution.sql", runnable: true }),
      code("text", ` hops | node 
------+------
    0 | A
    1 | B
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("С путём и проверкой «уже были» обход остановился на `B` — две строки вместо шести. Ограничитель глубины лишь прячет проблему, а путь решает её для любых данных."),
      h("Ошибка: типы столбцов якоря и шага не совпадают"),
      p("В PostgreSQL тип столбца определяется якорем: `SELECT 'A', 0` даёт `unknown`/`text`, а шаг, склеивающий `path || …`, может не сойтись — используйте явные приведения (`'A'::text`) и одинаковые типы в обеих частях."),
      h("Ошибка: агрегат или подзапрос в рекурсивной части"),
      p("Нельзя использовать саму CTE внутри агрегата, оконной функции или подзапроса рекурсивного шага (`recursive reference … must not appear within a subquery`) — шаг должен быть соединением, а накопление делается столбцами (`path`, `depth`, `root_id`)."),
      h("Ошибка: рассчитывать на порядок результата"),
      p("Порядок строк рекурсивной CTE — не гарантия обхода (ни в ширину, ни в глубину). Для «дерева» сортируйте по пути (`ORDER BY path`) или используйте `SEARCH … SET`."),
    ]),

    section("antipatterns", [
      ul(
        "**Рекурсия по неиндексированному `manager_id`** на большой таблице: каждая итерация — полный просмотр.",
        "**`UNION ALL` по графу без защиты от повторов.**",
        "**Использование рекурсивного запроса для плоской задачи** (которая решается `JOIN` или `generate_series`).",
        "**Хранение дерева без ограничений:** без внешнего ключа `manager_id` и контроля циклов легко записать цикл.",
        "**Рекурсивный обход в приложении по уровню** (цикл «запрос на каждый уровень») вместо одного рекурсивного запроса.",
        "**Бесконечная глубина «на всякий случай»** вместо разумного ограничения для заведомо мелких деревьев.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Задайте якорь явно** и подумайте о том, что остановит шаг.",
        "**Всегда защищайтесь от циклов** в графах: путь с проверкой, `UNION`, `CYCLE`.",
        "**Накапливайте нужные столбцы:** `depth`, `path`, `root_id`.",
        "**Индексируйте столбец связи** (`employees.manager_id`).",
        "**Упорядочивайте внешним `ORDER BY`** (по `path` или `SEARCH`).",
        "**Приводите типы явно** в якоре.",
        "**Ограничивайте глубину осознанно**, если структура неоднозначна.",
        "**Для часто читаемых иерархий** рассмотрите альтернативы хранения (материализованный путь, вложенные множества, `ltree`).",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Несколько якорей:** `UNION ALL` нескольких нерекурсивных запросов — обход сразу из нескольких корней.",
        "**Несколько рекурсивных частей** в PostgreSQL не допускаются в одном шаге (разные ветки объединяют отдельными CTE).",
        "**Деревья с несколькими родителями (DAG):** один потомок попадёт в результат столько раз, сколько путей до него; для уникальных узлов — `DISTINCT` или `UNION`.",
        "**Глубокие деревья:** тысячи итераций допустимы; контролируйте память и время: в PostgreSQL нет настройки, ограничивающей число итераций, поэтому остановку должен гарантировать сам запрос.",
        "**Пустой якорь** — пустой результат (рекурсия не стартует).",
        "**SQLite:** рекурсивные CTE поддерживаются; `SEARCH`/`CYCLE` нет — защита вручную.",
      ),
    ]),

    section("related", [
      ul(
        "[CTE: именованные шаги запроса](/learn/sql/ctes) — основа синтаксиса `WITH`.",
        "[RIGHT, FULL, CROSS и SELF JOIN](/learn/sql/other-joins) — самосоединение как фиксированная глубина иерархии.",
        "[Подзапросы](/learn/sql/subqueries) — ограничения использования ссылки на CTE в подзапросе.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Фиксированное число самосоединений",
          code: `
            SELECT e.name, m.name AS manager, mm.name AS manager2, mmm.name AS manager3
            FROM employees e
            LEFT JOIN employees m   ON m.id   = e.manager_id
            LEFT JOIN employees mm  ON mm.id  = m.manager_id
            LEFT JOIN employees mmm ON mmm.id = mm.manager_id;
          `,
          note: "Работает только до заданной глубины; когда появится четвёртый уровень, запрос молча потеряет цепочку.",
        },
        {
          title: "Рекурсивная CTE",
          code: `
            WITH RECURSIVE chain(id, name, manager_id, level) AS (
              SELECT id, name, manager_id, 0 FROM employees WHERE id = 12
              UNION ALL
              SELECT e.id, e.name, e.manager_id, c.level + 1
              FROM employees e JOIN chain c ON e.id = c.manager_id
            )
            SELECT level, name FROM chain ORDER BY level;
          `,
          note: "Глубина не ограничена текстом запроса: растёт вместе с данными.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.recursive-ctes.ex1",
      title: "Предскажите результат рекурсии",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская, определите результат двух рекурсивных запросов. Помните: у Ольги (id 3) двое прямых подчинённых — Тимур и Ульяна, у которых подчинённых нет."),
        code("sql", `WITH RECURSIVE t(n) AS (SELECT 5 UNION ALL SELECT n - 1 FROM t WHERE n > 1)
SELECT n FROM t ORDER BY n DESC;

WITH RECURSIVE team(id, depth) AS (
  SELECT id, 0 FROM employees WHERE id = 3
  UNION ALL
  SELECT e.id, t.depth + 1 FROM employees e JOIN team t ON e.manager_id = t.id
)
SELECT count(*) AS people, max(depth) AS deepest FROM team;`, { filename: "10-ex-predict.sql", runnable: true, fixture: "staff" }),
      ],
      hints: ["Что останавливает первую рекурсию?", "Сколько человек получится на каждом шаге второй?"],
      checks: ["Первый: 5, 4, 3, 2, 1", "Второй: 3 человека, глубина 1"],
      solution: [
        code("text", ` n 
---
 5
 4
 3
 2
 1
(5 rows)

 people | deepest 
--------+---------
      3 |       1
(1 row)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "Якорь даёт 5; шаг уменьшает значение, пока `n > 1`: получаем 5, 4, 3, 2, 1 — сортировка по убыванию показывает их все.",
          "Для Ольги: уровень 0 — она сама, уровень 1 — Тимур и Ульяна, уровень 2 пуст, рекурсия заканчивается: 3 человека, максимальная глубина 1.",
        ),
      ],
    }),
    exercise({
      id: "sql.recursive-ctes.ex2",
      title: "Запрос ходит по кругу",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("В данных появился цикл A→B→A. Запрос защищён только ограничителем глубины и выдаёт повторяющиеся вершины. Исправьте: каждая вершина должна появляться не более одного раза на пути."),
        code("sql", `-- В данных цикл A→B→A. Запрос защищён только ограничением глубины — и «ходит по кругу»
CREATE TABLE roads (src text, dst text);
INSERT INTO roads VALUES ('A', 'B'), ('B', 'A');

WITH RECURSIVE walk(node, hops) AS (
  SELECT 'A', 0
  UNION ALL
  SELECT r.dst, w.hops + 1 FROM walk AS w JOIN roads AS r ON r.src = w.node WHERE w.hops < 5
)
SELECT hops, node FROM walk ORDER BY hops;`, { filename: "11-ex-fix.sql", runnable: true }),
      ],
      hints: ["Что нужно накапливать в строке, чтобы знать, где уже были?", "Как проверить, что вершина ещё не в пути?"],
      checks: ["Накапливается путь", "Условие `NOT LIKE` по пути в шаге", "Результат: A и B, два шага"],
      solution: [
        code("sql", `CREATE TABLE roads (src text, dst text);
INSERT INTO roads VALUES ('A', 'B'), ('B', 'A');

WITH RECURSIVE walk(node, hops, path) AS (
  SELECT 'A', 0, ',A,'
  UNION ALL
  SELECT r.dst, w.hops + 1, w.path || r.dst || ','
  FROM walk AS w JOIN roads AS r ON r.src = w.node
  WHERE w.path NOT LIKE '%,' || r.dst || ',%'
)
SELECT hops, node FROM walk ORDER BY hops;`, { filename: "12-fix-solution.sql", runnable: true }),
        code("text", ` hops | node 
------+------
    0 | A
    1 | B
(2 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Путь `,A,B,` запоминает посещённые вершины; шаг не переходит в вершину, которая уже встречалась. В PostgreSQL то же делает `CYCLE node SET is_cycle USING path` (14+)."),
      ],
    }),
    exercise({
      id: "sql.recursive-ctes.ex3",
      title: "Все маршруты из A в D",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Даны дороги: A→B, B→C, C→A, C→D, A→D, B→D. Найдите все маршруты из A в D без повторов вершин, упорядочив их от коротких к длинным. Покажите число пересадок (`hops`) и маршрут строкой."),
      ],
      hints: ["Какой столбец защитит от возврата в уже посещённую вершину?", "Как отфильтровать только маршруты, закончившиеся в D?"],
      checks: ["Путь хранится строкой с разделителями", "Шаг запрещает вершины из пути", "Три маршрута: `A,D`, `A,B,D`, `A,B,C,D`"],
      solution: [
        code("sql", `-- Все маршруты из A в D без повторов вершин, от коротких к длинным
CREATE TABLE roads (src text, dst text);
INSERT INTO roads VALUES ('A', 'B'), ('B', 'C'), ('C', 'A'), ('C', 'D'), ('A', 'D'), ('B', 'D');

WITH RECURSIVE walk(node, hops, path) AS (
  SELECT 'A', 0, ',A,'
  UNION ALL
  SELECT r.dst, w.hops + 1, w.path || r.dst || ','
  FROM walk AS w JOIN roads AS r ON r.src = w.node
  WHERE w.path NOT LIKE '%,' || r.dst || ',%'
)
SELECT hops, trim(path, ',') AS route FROM walk WHERE node = 'D' ORDER BY hops, path;`, { filename: "13-challenge.sql", runnable: true, lineNumbers: true }),
        code("text", ` hops |  route  
------+---------
    1 | A,D
    2 | A,B,D
    3 | A,B,C,D
(3 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Путь с разделителями `,A,B,` позволяет надёжно проверить «уже были» (подстрока `,B,` не спутается с другими вершинами). Маршрут `A,B,C,D` длиннейший: из `C` нельзя вернуться в `A` (цикл запрещён)."),
      ],
    }),
  ],

  challenge: {
    id: "sql.recursive-ctes.challenge",
    title: "Оргструктура: размеры команд и фонды зарплат",
    scenario: [
      p("Директору нужны две вещи: оргструктура в виде дерева с отступами и таблица «руководитель — размер команды — фонд зарплат» для всех, у кого есть подчинённые. Данные — таблица `employees` с `manager_id`."),
    ],
    requirements: [
      "Дерево: имя с отступом по глубине и путь от корня; сортировка в порядке обхода в глубину",
      "Таблица: сотрудник, число подчинённых (всех уровней, без него самого) и суммарная зарплата поддерева",
      "Показать только тех, у кого есть подчинённые; порядок по фонду зарплат по убыванию",
    ],
    constraints: [
      "Один рекурсивный запрос на каждую часть",
      "Корень и глубина не заданы вручную: корень находится по `manager_id IS NULL`",
    ],
    acceptance: [
      "Ирина — 11 подчинённых, 1 830 000; Павел — 4, 840 000; Фёдор — 5, 690 000",
      "В дереве 12 строк, у Эльвиры путь `Ирина > Фёдор > Хлоя > Эльвира`",
    ],
    hints: [
      "Для таблицы каждый сотрудник — собственный корень (`root_id`).",
      "Для дерева — `path` и `depth` из якоря «корень».",
    ],
    solution: [
      code("sql", `-- Для каждого сотрудника: сколько человек в его поддереве и их суммарная зарплата
WITH RECURSIVE subtree(root_id, id, salary) AS (
  SELECT id, id, salary FROM employees
  UNION ALL
  SELECT s.root_id, e.id, e.salary
  FROM subtree AS s JOIN employees AS e ON e.manager_id = s.id
)
SELECT r.name, count(*) - 1 AS reports, sum(s.salary) AS payroll
FROM subtree AS s JOIN employees AS r ON r.id = s.root_id
GROUP BY r.id, r.name
HAVING count(*) > 1
ORDER BY payroll DESC;`, { filename: "05-subtree-sums.sql", runnable: true, fixture: "staff" }),
      code("text", ` name  | reports | payroll 
-------+---------+---------
 Ирина |      11 | 1830000
 Павел |       4 |  840000
 Фёдор |       5 |  690000
 Ольга |       2 |  440000
 Хлоя  |       1 |  205000
 Юлия  |       1 |  175000
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Дерево с отступами — запрос `03-path.sql` выше. Здесь — таблица по поддеревьям: корень отслеживается столбцом `root_id`. Контроль: у Ирины 11 подчинённых и сумма всех зарплат — 1 830 000."),
    ],
  },

  interview: [
    iq("sql.recursive-ctes.i1", "basic", "Из каких частей состоит рекурсивная CTE?", [
      ul(
        "Якорный запрос (стартовые строки) и рекурсивный шаг, соединённые `UNION ALL` (или `UNION`).",
        "Шаг ссылается на саму CTE и обрабатывает строки предыдущей итерации; когда шаг не возвращает строк — рекурсия заканчивается.",
        "Внешний `SELECT` использует результат.",
      ),
    ]),
    iq("sql.recursive-ctes.i2", "basic", "Как получить всех подчинённых сотрудника на любой глубине?", [
      ul(
        "Рекурсивная CTE: якорь — сам сотрудник (`WHERE id = :id`), шаг — `JOIN employees e ON e.manager_id = t.id`.",
        "Столбец `depth` — уровень; `ORDER BY depth` показывает «слоями».",
        "Для подсчёта — `count(*) - 1` (без самого корня).",
      ),
    ]),
    iq("sql.recursive-ctes.i3", "intermediate", "Что произойдёт, если в данных есть цикл, а запрос использует UNION ALL?", [
      ul(
        "Рекурсия не завершится (A, B, A, B, …) — строки будут порождаться бесконечно, пока не закончатся ресурсы.",
        "В замере с ограничителем `hops < 5` получили 6 строк с повторами.",
        "Защита: путь + проверка «уже были», `UNION` (если нет растущих столбцов), `CYCLE` (PostgreSQL 14+).",
      ),
    ]),
    iq("sql.recursive-ctes.i4", "intermediate", "Чем UNION отличается от UNION ALL в рекурсивной CTE?", [
      ul(
        "`UNION ALL` оставляет все строки (быстро, без защиты от циклов).",
        "`UNION` убирает повторы: новая строка, уже встречавшаяся, не порождает следующую — обход графа без растущих столбцов останавливается сам.",
        "Но если в строке есть `depth` или `path`, строки всегда уникальны и `UNION` не помогает.",
      ),
    ]),
    iq("sql.recursive-ctes.i5", "intermediate", "Как посчитать размер команды и суммарную зарплату каждого руководителя одним запросом?", [
      ul(
        "Якорь: каждый сотрудник как собственный корень (`id AS root_id`).",
        "Шаг: присоединять подчинённых, сохраняя `root_id`.",
        "Внешний запрос: `GROUP BY root_id`, `count(*) - 1` и `sum(salary)` (в замере: Ирина — 11 и 1 830 000).",
      ),
    ]),
    iq("sql.recursive-ctes.i6", "advanced", "Как работает CYCLE в PostgreSQL 14+ и что оно заменяет?", [
      ul(
        "`CYCLE col SET is_cycle USING path` автоматически накапливает путь по `col` и помечает строку, где значение повторилось; рекурсия от неё не продолжается.",
        "Заменяет ручное накопление путей и проверок `NOT LIKE`/`<> ALL(path)`.",
        "Парное предложение `SEARCH DEPTH|BREADTH FIRST BY … SET order_col` задаёт порядок обхода.",
      ),
    ]),
    iq("sql.recursive-ctes.i7", "engineering", "Какие способы хранить иерархии есть и как они связаны с рекурсивными запросами?", [
      ul(
        "Список смежности (`manager_id`): просто хранить, обход — рекурсивной CTE.",
        "Материализованный путь (`path = '1/3/5'`, `ltree`): быстрые поддеревья индексом по префиксу, дороже перемещения.",
        "Вложенные множества (`lft`, `rgt`): мгновенные выборки поддеревьев, сложные вставки.",
        "Таблица замыканий (предок, потомок, глубина): быстрые запросы, больше места.",
        "Выбор — по соотношению чтения и изменений и размеру деревьев.",
      ),
    ]),
    iq("sql.recursive-ctes.i8", "debugging", "Рекурсивный запрос работает «вечно». Что проверить?", [
      ul(
        "Цикл в данных (обход по `manager_id` с циклом, граф) — добавить путь/`CYCLE`/`UNION`.",
        "Условие шага: возможно, соединение даёт всегда новые строки (например, `ON true`).",
        "Размножение путей в DAG: потомок с несколькими родителями возвращается многократно.",
        "Диагностика: добавить `LIMIT` и вывести `depth`, `path`; запустить с ограничителем `depth < 20`.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.recursive-ctes.e1", "foundation", "Какое ключевое слово делает CTE рекурсивной?", ["`WITH LOOP`", "`WITH REPEAT`", "`WITH RECURSIVE`", "`RECURSIVE WITH`"], 2, "Рекурсивные CTE объявляются как `WITH RECURSIVE`."),
    mcq("sql.recursive-ctes.e2", "foundation", "Из чего состоит рекурсивная CTE?", ["Из якоря и рекурсивного шага, соединённых `UNION [ALL]`", "Из двух независимых запросов без связи", "Только из рекурсивного шага", "Из трёх запросов"], 0, "Якорь даёт стартовые строки, шаг — новые на основе предыдущих."),
    mcq("sql.recursive-ctes.e3", "foundation", "Чем заканчивается рекурсия?", ["Когда закончится память", "Когда в таблице нет `NULL`", "После 100 итераций", "Когда рекурсивный шаг вернёт ноль строк"], 3, "Итерации идут, пока шаг возвращает хотя бы одну новую строку."),
    mcq("sql.recursive-ctes.e4", "intermediate", "Как найти руководителей сотрудника снизу вверх?", ["`e.manager_id = c.id`", "`e.id = c.manager_id`", "`e.id = c.id`", "`e.manager_id IS NULL`"], 1, "Шаг вверх берёт строку руководителя: `e.id = c.manager_id` (цепочка Якова: 4 звена)."),
    mcq("sql.recursive-ctes.e5", "intermediate", "Какие способы защищают от циклов? Выберите все.", ["Путь и проверка «уже были»", "`UNION` вместо `UNION ALL` при отсутствии растущих столбцов", "`CYCLE` в PostgreSQL 14+", "Индекс по `manager_id`"], [0, 1, 2], "Индекс ускоряет шаг, но от цикла не защищает."),
    mcq("sql.recursive-ctes.e6", "intermediate", "Сколько строк дал граф A↔B с ограничителем `hops < 5` и `UNION ALL`?", ["2", "5", "Бесконечность", "6"], 3, "Глубины 0–5: A, B, A, B, A, B — шесть строк (замер); без ограничителя запрос не остановился бы."),
    mcq("sql.recursive-ctes.e7", "advanced", "Почему `ORDER BY` нужен снаружи рекурсивной CTE?", ["Без него запрос не работает", "`ORDER BY` в CTE запрещён", "Порядок строк рекурсии не определён и не равен обходу", "Из-за индекса"], 2, "Порядок результата не гарантирован; для дерева сортируют по пути или `SEARCH … SET`."),
    open("sql.recursive-ctes.e8", "intermediate", "Постройте запрос «вся команда руководителя с уровнем» и объясните, как он останавливается и как защитить его от цикла в данных.", [
      ul(
        "`WITH RECURSIVE team(id, name, depth) AS (SELECT id, name, 0 FROM employees WHERE id = :id UNION ALL SELECT e.id, e.name, t.depth + 1 FROM employees e JOIN team t ON e.manager_id = t.id) SELECT * FROM team ORDER BY depth, name`.",
        "Остановка: у «листьев» нет подчинённых, шаг возвращает ноль строк.",
        "Цикл в данных: добавить путь (`path`) и условие `NOT LIKE`/`<> ALL(path)`; в PostgreSQL 14+ — `CYCLE id SET is_cycle USING path`.",
        "Индекс на `manager_id` и контроль данных (триггер/проверка при записи).",
      ),
    ], ["Якорь и шаг", "Условие остановки", "Защита от цикла", "Индекс по manager_id"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.recursive-ctes.m1", "intermediate", "Сколько человек вернёт рекурсия от Ольги (id 3), у которой двое прямых подчинённых без своих подчинённых?", ["1", "3", "2", "4"], 1, "Сама Ольга и Тимур с Ульяной — 3 человека на двух уровнях (замер)."),
    mcq("sql.recursive-ctes.m2", "advanced", "Что вернёт `WITH RECURSIVE nat(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM nat) SELECT n FROM nat LIMIT 5`?", ["Числа 1–5", "Бесконечный результат", "Ошибку", "Только 1"], 0, "Строки вычисляются лениво; `LIMIT 5` остановил рекурсию (замер)."),
    mcq("sql.recursive-ctes.m3", "advanced", "Почему `UNION` остановил обход графа A↔B, а `UNION ALL` с растущим `hops` — нет?", ["`UNION` быстрее", "`UNION ALL` не поддерживает циклы", "`UNION` отбрасывает уже встречавшиеся строки; со столбцом `hops` строки всегда различны", "Из-за `NULL`"], 2, "Без растущих столбцов повторяющиеся значения отбрасываются, и новых строк нет; `hops` делает каждую строку уникальной."),
    open("sql.recursive-ctes.m4", "advanced", "В каталоге товаров 100 000 категорий, дерево 12 уровней; запрос «все товары категории и её подкатегорий» работает 3 секунды. Какие варианты ускорения вы рассмотрите?", [
      ul(
        "Индекс по `categories(parent_id)` и по `products(category_id)` — каждая итерация рекурсии и соединение с товарами используют индексы.",
        "Сначала рекурсией получить множество идентификаторов категорий, затем `WHERE category_id IN (…)`/соединение, а не вычислять рекурсию для каждого товара.",
        "Материализованный путь (`ltree`/`path`) или таблица замыканий: поддерево — один индексный поиск; цена — поддержка при изменении дерева.",
        "Кеширование/материализованное представление для часто запрашиваемых узлов; сверка планов `EXPLAIN ANALYZE` до и после.",
      ),
    ], ["Индексы по связи", "Раздельное получение множества категорий", "Альтернативные способы хранения", "Сравнение планов"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.recursive-ctes.f1", front: "Рекурсивная CTE?", back: "WITH RECURSIVE: якорь UNION ALL шаг (ссылка на себя). Шаг видит только строки предыдущей итерации; стоп — пустой результат шага." },
    { id: "sql.recursive-ctes.f2", front: "Вниз и вверх по иерархии?", back: "Вниз: e.manager_id = t.id. Вверх: e.id = c.manager_id." },
    { id: "sql.recursive-ctes.f3", front: "Цикл в данных?", back: "UNION ALL зациклится. Защита: путь + проверка «уже были», UNION (без растущих столбцов), CYCLE (PostgreSQL 14+)." },
    { id: "sql.recursive-ctes.f4", front: "Поддеревья одним запросом?", back: "Якорь: каждый как свой корень (root_id = id); шаг переносит root_id; внешний GROUP BY root_id." },
    { id: "sql.recursive-ctes.f5", front: "Порядок результата?", back: "Не определён. Сортируйте по path или SEARCH … SET." },
    { id: "sql.recursive-ctes.f6", front: "LIMIT и рекурсия?", back: "Строки вычисляются лениво: LIMIT останавливает даже бесконечную рекурсию. Не заменяет защиту от циклов." },
    { id: "sql.recursive-ctes.f7", front: "Индекс для обхода?", back: "Индекс по столбцу связи (manager_id/parent_id): каждая итерация использует его." },
    { id: "sql.recursive-ctes.f8", front: "Альтернативы хранения деревьев?", back: "Список смежности, материализованный путь (ltree), вложенные множества, таблица замыканий." },
  ],

  sources: [
    { title: "PostgreSQL 16: WITH Queries — Recursive Queries", url: "https://www.postgresql.org/docs/16/queries-with.html#QUERIES-WITH-RECURSIVE", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Search Order (SEARCH clause)", url: "https://www.postgresql.org/docs/16/queries-with.html#QUERIES-WITH-SEARCH", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Cycle Detection (CYCLE clause)", url: "https://www.postgresql.org/docs/16/queries-with.html#QUERIES-WITH-CYCLE", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: ltree — hierarchical tree-like structures", url: "https://www.postgresql.org/docs/16/ltree.html", publisher: "PostgreSQL" },
    { title: "SQLite: Recursive Common Table Expressions", url: "https://www.sqlite.org/lang_with.html#recursivecte", publisher: "Other" },
  ],
};
