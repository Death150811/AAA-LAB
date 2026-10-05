import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
  tip,
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

export const windowFunctions: Topic = {
  id: "sql.window-functions",
  slug: "window-functions",
  domain: "sql",
  module: "advanced-sql",
  title: "Оконные функции: ранжирование, нарастающие итоги, соседние строки",
  titleEn: "Window Functions: Ranking, Running Totals, Neighbouring Rows",
  summary:
    "Оконная функция считает значение по «окну» связанных строк, но не сворачивает их в одну, как `GROUP BY`: рядом с каждым сотрудником можно вывести сумму всего фонда (1 830 000), среднюю по отделу (у разработки 168 000), его место в рейтинге (`rank`, `dense_rank`, `row_number`), нарастающий итог по месяцам (21 390 за полгода) и значение предыдущей строки (`lag`). Тема на замерах PostgreSQL 16.14 и SQLite 3.49: ранги при равных зарплатах (4, 4, 6 и 4, 4, 5), рамки `ROWS` и `RANGE` (итог 490 000 у двух «равных» против 380 000 и 490 000), ловушка `last_value` с рамкой по умолчанию, топ-N в группе через подзапрос и планы `WindowAgg` + `Sort`.",
  minutes: 90,
  prerequisites: ["sql.group-by-having", "sql.subqueries", "sql.ctes"],
  tags: ["window function", "OVER", "PARTITION BY", "ORDER BY", "frame", "ROWS", "RANGE", "GROUPS", "row_number", "rank", "dense_rank", "ntile", "lag", "lead", "first_value", "last_value", "running total", "moving average", "top-N per group", "WindowAgg"],
  keyConcepts: [
    { term: "Окно — это набор строк, а не группа", text: "`sum(salary) OVER ()` даёт 1 830 000 в каждой из 12 строк, а `GROUP BY` вернул бы одну. Оконная функция добавляет столбец, не уменьшая число строк." },
    { term: "PARTITION BY делит, ORDER BY упорядочивает", text: "`avg(salary) OVER (PARTITION BY dept)` — среднее внутри отдела: 168 000 у разработки, 128 750 у продаж, 87 500 у поддержки." },
    { term: "rank, dense_rank, row_number по-разному относятся к равным", text: "При зарплатах 180 000, 180 000, 140 000: `row_number` — 4, 5, 6; `rank` — 4, 4, 6; `dense_rank` — 4, 4, 5. Для `row_number` нужен уникальный порядок (добавьте `id`)." },
    { term: "Рамка определяет, какие строки видит функция", text: "Рамка по умолчанию с `ORDER BY` — `RANGE … CURRENT ROW`, и равные значения считаются «соседями»: у Хлои и Цезаря (по 110 000) нарастающий итог одинаков — 490 000. `ROWS` считает строка за строкой: 380 000 и 490 000." },
    { term: "last_value с рамкой по умолчанию возвращает текущую строку", text: "Чтобы получить последнюю строку группы, расширьте рамку: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, либо возьмите `max(...) OVER (PARTITION BY …)`." },
    { term: "В WHERE оконных функций нет", text: "PostgreSQL отвечает `window functions are not allowed in WHERE`: окна считаются после `WHERE`, `GROUP BY` и `HAVING`. Фильтр по результату — через подзапрос или CTE." },
  ],
  sections: [
    section("definition", [
      def("Оконная функция", "Функция, которая вычисляется для каждой строки по набору связанных с ней строк (окну) и возвращает значение, не сворачивая строки. Синтаксис — `функция(…) OVER (…)`.", "window function"),
      def("Окно", "Набор строк, видимых функции для текущей строки: определяется `PARTITION BY` (разбиение), `ORDER BY` (порядок внутри разбиения) и рамкой.", "window"),
      def("PARTITION BY", "Часть определения окна, которая делит строки на независимые разделы (например, по отделам). Без неё весь результат — один раздел.", "partition"),
      def("Рамка", "Подмножество раздела вокруг текущей строки: `ROWS`, `RANGE` или `GROUPS` с границами (`UNBOUNDED PRECEDING`, `n PRECEDING`, `CURRENT ROW`, `n FOLLOWING`, `UNBOUNDED FOLLOWING`).", "frame"),
      def("Ранжирующие функции", "`row_number`, `rank`, `dense_rank`, `ntile`, `percent_rank`, `cume_dist` — нумеруют строки или вычисляют положение в упорядоченном разделе.", "ranking functions"),
      def("Функции смещения и значений", "`lag`, `lead` (соседние строки), `first_value`, `last_value`, `nth_value` (строки рамки).", "offset / value functions"),
      def("Оконный агрегат", "Обычный агрегат (`sum`, `avg`, `count`, `min`, `max`) с `OVER`: вычисляется по рамке и не сворачивает строки.", "window aggregate"),
    ]),

    section("why", [
      h("Задачи, которые не решает GROUP BY"),
      p("`GROUP BY` отвечает на вопрос «сколько в каждой группе», но теряет строки. Реальные отчёты чаще спрашивают другое: «зарплата сотрудника и его доля в фонде», «место сотрудника в отделе», «выручка месяца и накопленная с начала года», «на сколько изменилась выручка к прошлому месяцу», «последний заказ каждого клиента». Без оконных функций это самосоединения и коррелированные подзапросы, которые читаются тяжело и выполняются для каждой строки заново."),
      ul(
        "**Рейтинги и топ-N в группе:** лучшие два сотрудника отдела, самый дорогой товар категории.",
        "**Нарастающие итоги и скользящие средние:** накопленная выручка, среднее за три месяца.",
        "**Сравнение со «соседом»:** изменение к предыдущему периоду, интервал между заказами (`lag`/`lead`).",
        "**Доли и отклонения:** процент от общего итога, отличие от среднего по отделу.",
        "**Дедупликация и «последняя запись по ключу»:** `row_number() = 1`.",
      ),
      note("Оконные функции входят в стандарт SQL и доступны в PostgreSQL и SQLite 3.25+. Диалекты расходятся в мелочах (например, поддержка `GROUPS` и `EXCLUDE`), поэтому примеры темы проверены на обоих движках."),
    ]),

    section("mental-model", [
      h("«Таблица с ещё одним столбцом»: окно смотрит вокруг строки"),
      p("Представьте, что для каждой строки вы берёте рамку на листе: внутри — строки того же раздела в нужном порядке, а функция смотрит только в эту рамку. Затем вы переходите к следующей строке, рамка сдвигается, значение вычисляется заново, но сама строка никуда не исчезает. Агрегат с `GROUP BY` — это «сложить всё в мешок и выдать один результат», окно — «посмотреть на соседей и записать ответ рядом»."),
      diagram(
        `
        Раздел «продажи» (ORDER BY salary, id):

          Эльвира  95 000   ┐  ← рамка для Хлои при ROWS BETWEEN 1 PRECEDING AND CURRENT ROW:
          Хлоя    110 000   ┘     видит Эльвиру и себя
          Цезарь  110 000
          Фёдор   200 000

        Для каждой строки — свой набор строк внутри раздела.
        Результат — те же строки плюс столбец с вычисленным значением.
        `,
        "Раздел делит строки, порядок упорядочивает их, рамка выбирает строки вокруг текущей.",
      ),
      h("Порядок обработки запроса"),
      steps(
        [
          ["`FROM` и `JOIN`", "Собираются исходные строки."],
          ["`WHERE`", "Лишние строки отбрасываются — окна их уже не увидят."],
          ["`GROUP BY` и `HAVING`", "Если есть группировка, окна работают по её результату (можно ранжировать суммы групп)."],
          ["Оконные функции", "К каждой оставшейся строке добавляются вычисленные значения."],
          ["`DISTINCT`, `ORDER BY`, `LIMIT`", "Итоговая сортировка и обрезка. Фильтровать по результату окна можно только на следующем уровне запроса."],
        ],
        "Где вычисляются оконные функции",
      ),
    ]),

    section("technical", [
      h("Синтаксис"),
      ul(
        "`функция(аргументы) OVER (PARTITION BY … ORDER BY … рамка)` — окно прямо в вызове.",
        "`функция(…) OVER w` и `WINDOW w AS (PARTITION BY … ORDER BY …)` — именованное окно, если оно нужно нескольким функциям.",
        "`агрегат(…) FILTER (WHERE условие) OVER (…)` — учитывать только подходящие строки (PostgreSQL, SQLite 3.30+).",
        "`OVER ()` — одно окно из всех строк результата.",
        "Оконные функции допустимы только в списке `SELECT` и в `ORDER BY`.",
      ),
      h("Какие функции бывают"),
      table(
        ["Группа", "Функции", "Что возвращают"],
        [
          ["Нумерация и ранги", "`row_number`, `rank`, `dense_rank`", "Номер строки / место с пропусками / место без пропусков"],
          ["Доли и корзины", "`percent_rank`, `cume_dist`, `ntile(n)`", "Относительное положение; номер корзины из n равных"],
          ["Соседние строки", "`lag(x, n, default)`, `lead(x, n, default)`", "Значение n строк назад / вперёд (по умолчанию n = 1, default = NULL)"],
          ["Значения рамки", "`first_value`, `last_value`, `nth_value(x, n)`", "Значение первой / последней / n-й строки рамки"],
          ["Агрегаты", "`sum`, `avg`, `count`, `min`, `max`", "Результат по рамке без сворачивания строк"],
        ],
        "Оконные функции PostgreSQL и SQLite",
      ),
      h("Рамка окна"),
      ul(
        "`ROWS` — границы считаются в строках; `RANGE` — по значению столбца `ORDER BY` (равные значения — одна «компания»); `GROUPS` — в группах равных значений (PostgreSQL 11+, SQLite 3.28+).",
        "Границы: `UNBOUNDED PRECEDING`, `n PRECEDING`, `CURRENT ROW`, `n FOLLOWING`, `UNBOUNDED FOLLOWING`.",
        "**Рамка по умолчанию:** если есть `ORDER BY` — `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`; если нет — весь раздел.",
        "Ранжирующие функции и `lag`/`lead` от рамки не зависят; `first_value`, `last_value`, `nth_value` и агрегаты — зависят.",
      ),
      tip("Для детерминированных результатов задавайте полный порядок: `ORDER BY salary DESC, id`. Если порядок неоднозначен, `row_number` выдаст разный результат при разных планах, а `ROWS`-рамки — разные суммы."),
    ]),

    section("syntax", [
      p("В запросе «две самые высокие зарплаты каждого отдела» оконная функция — только промежуточный шаг: сначала ранжируем, потом фильтруем в обёртке."),
      annotated(
        "sql",
        `-- Две самые высокие зарплаты в каждом отделе: оконную функцию нельзя поставить в WHERE, поэтому подзапрос
SELECT dept, name, salary, place
FROM (
  SELECT dept, name, salary,
         rank() OVER (PARTITION BY dept ORDER BY salary DESC) AS place
  FROM employees
) AS ranked
WHERE place <= 2
ORDER BY dept, place, name;`,
        [
          { line: 1, text: "Комментарий называет задачу и причину подзапроса: оконной функции нельзя стоять в `WHERE`." },
          { line: 2, text: "Внешний запрос выбирает готовое место `place` и фильтрует по нему." },
          { line: [3, 7], text: "Подзапрос с псевдонимом `ranked`: строки сотрудников и вычисленный столбец." },
          { line: 5, text: "`rank() OVER (PARTITION BY dept ORDER BY salary DESC)` — место внутри отдела по убыванию зарплаты; `PARTITION BY` делит на отделы." },
          { line: 8, text: "Фильтр по месту — теперь допустим: `place` уже вычислен." },
          { line: 9, text: "Итоговая сортировка: отдел, место, имя — порядок вывода не определяет оконный порядок." },
        ],
        "04-top-n.sql",
      ),
    ]),

    section("minimal-example", [
      p("Сначала разница между `GROUP BY` и окном: у каждого сотрудника остаётся своя строка, а рядом — общий фонд и доля."),
      code("sql", `-- GROUP BY сворачивает строки, оконная функция — нет: у каждого сотрудника остаётся своя строка
SELECT name, dept, salary,
       sum(salary) OVER ()                                    AS payroll,
       round(100.0 * salary / sum(salary) OVER (), 1)         AS pct_of_payroll
FROM employees
ORDER BY id;`, { filename: "01-over-vs-group.sql", runnable: true, fixture: "staff" }),
      code("text", `  name   |    dept    | salary | payroll | pct_of_payroll 
---------+------------+--------+---------+----------------
 Ирина   | правление  | 300000 | 1830000 |           16.4
 Павел   | разработка | 220000 | 1830000 |           12.0
 Ольга   | разработка | 180000 | 1830000 |            9.8
 Семён   | разработка | 180000 | 1830000 |            9.8
 Тимур   | разработка | 140000 | 1830000 |            7.7
 Ульяна  | разработка | 120000 | 1830000 |            6.6
 Фёдор   | продажи    | 200000 | 1830000 |           10.9
 Хлоя    | продажи    | 110000 | 1830000 |            6.0
 Цезарь  | продажи    | 110000 | 1830000 |            6.0
 Эльвира | продажи    |  95000 | 1830000 |            5.2
 Юлия    | поддержка  |  90000 | 1830000 |            4.9
 Яков    | поддержка  |  85000 | 1830000 |            4.6
(12 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Двенадцать строк, в каждой `payroll = 1830000`, доли складываются в 100 %. Ирина получает 16,4 %, Павел — 12,0 %, Яков — 4,6 %. `OVER ()` с пустыми скобками означает «всё множество строк — одно окно»."),
    ]),

    section("detailed-example", [
      h("PARTITION BY: среднее по отделу рядом с каждым"),
      code("sql", `-- PARTITION BY делит строки на группы, но не склеивает их: среднее по отделу рядом с каждым сотрудником
SELECT dept, name, salary,
       round(avg(salary) OVER (PARTITION BY dept))        AS dept_avg,
       salary - round(avg(salary) OVER (PARTITION BY dept)) AS vs_avg
FROM employees
ORDER BY dept, salary DESC, id;`, { filename: "02-partition.sql", runnable: true, fixture: "staff" }),
      code("text", `    dept    |  name   | salary | dept_avg | vs_avg 
------------+---------+--------+----------+--------
 поддержка  | Юлия    |  90000 |    87500 |   2500
 поддержка  | Яков    |  85000 |    87500 |  -2500
 правление  | Ирина   | 300000 |   300000 |      0
 продажи    | Фёдор   | 200000 |   128750 |  71250
 продажи    | Хлоя    | 110000 |   128750 | -18750
 продажи    | Цезарь  | 110000 |   128750 | -18750
 продажи    | Эльвира |  95000 |   128750 | -33750
 разработка | Павел   | 220000 |   168000 |  52000
 разработка | Ольга   | 180000 |   168000 |  12000
 разработка | Семён   | 180000 |   168000 |  12000
 разработка | Тимур   | 140000 |   168000 | -28000
 разработка | Ульяна  | 120000 |   168000 | -48000
(12 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("У разработки средняя 168 000: Павел выше неё на 52 000, Ульяна ниже на 48 000. В отделе «правление» один человек, поэтому разница с самим собой — 0."),
      h("Ранги: row_number, rank, dense_rank"),
      code("sql", `-- Три способа пронумеровать одинаковые зарплаты (у Ольги и Семёна по 180000, у Хлои и Цезаря по 110000)
SELECT name, salary,
       row_number() OVER (ORDER BY salary DESC, id) AS row_num,
       rank()       OVER (ORDER BY salary DESC)     AS rnk,
       dense_rank() OVER (ORDER BY salary DESC)     AS dense
FROM employees
ORDER BY salary DESC, id;`, { filename: "03-ranking.sql", runnable: true, fixture: "staff" }),
      code("text", `  name   | salary | row_num | rnk | dense 
---------+--------+---------+-----+-------
 Ирина   | 300000 |       1 |   1 |     1
 Павел   | 220000 |       2 |   2 |     2
 Фёдор   | 200000 |       3 |   3 |     3
 Ольга   | 180000 |       4 |   4 |     4
 Семён   | 180000 |       5 |   4 |     4
 Тимур   | 140000 |       6 |   6 |     5
 Ульяна  | 120000 |       7 |   7 |     6
 Хлоя    | 110000 |       8 |   8 |     7
 Цезарь  | 110000 |       9 |   8 |     7
 Эльвира |  95000 |      10 |  10 |     8
 Юлия    |  90000 |      11 |  11 |     9
 Яков    |  85000 |      12 |  12 |    10
(12 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`row_number` нумерует строки без повторов: Ольга — 4, Семён — 5 (по тай-брейку `id`).",
        "`rank` даёт равным одно место и пропускает следующие: 4, 4, затем 6.",
        "`dense_rank` не пропускает: 4, 4, затем 5.",
      ),
      h("Топ-N в каждой группе"),
      code("sql", `-- Две самые высокие зарплаты в каждом отделе: оконную функцию нельзя поставить в WHERE, поэтому подзапрос
SELECT dept, name, salary, place
FROM (
  SELECT dept, name, salary,
         rank() OVER (PARTITION BY dept ORDER BY salary DESC) AS place
  FROM employees
) AS ranked
WHERE place <= 2
ORDER BY dept, place, name;`, { filename: "04-top-n.sql", runnable: true, fixture: "staff" }),
      code("text", `    dept    |  name  | salary | place 
------------+--------+--------+-------
 поддержка  | Юлия   |  90000 |     1
 поддержка  | Яков   |  85000 |     2
 правление  | Ирина  | 300000 |     1
 продажи    | Фёдор  | 200000 |     1
 продажи    | Хлоя   | 110000 |     2
 продажи    | Цезарь | 110000 |     2
 разработка | Павел  | 220000 |     1
 разработка | Ольга  | 180000 |     2
 разработка | Семён  | 180000 |     2
(9 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Вместо «двух лучших» вернулось девять строк, а не семь (1 + 2 + 2 + 2): в разработке Ольга и Семён делят второе место, в продажах — Хлоя и Цезарь. `rank` честно отдаёт всех «вторых». Нужно ровно N строк — берите `row_number` с уникальным порядком; нужны все с N лучшими значениями — `dense_rank`."),
    ]),

    section("analysis", [
      table(
        ["Запрос", "Результат (замер)", "Что показывает"],
        [
          ["`sum(salary) OVER ()`", "1 830 000 в каждой из 12 строк", "Окно из всех строк, строки не сворачиваются"],
          ["`avg(salary) OVER (PARTITION BY dept)`", "168 000 / 128 750 / 87 500 / 300 000", "Среднее по отделам рядом с каждым сотрудником"],
          ["`rank` / `dense_rank` при ничьих", "4, 4, 6 / 4, 4, 5", "Пропуск мест при `rank`, плотная нумерация при `dense_rank`"],
          ["Топ-2 по отделу (`rank`)", "9 строк вместо 7", "Ничьи на втором месте попадают в результат"],
          ["Нарастающий итог по месяцам", "1 380 → 21 390 за 6 месяцев", "Итог по `ORDER BY month` с рамкой по умолчанию"],
          ["`lag(revenue)`", "NULL у первого месяца, 2 170 у второго", "Предыдущая строка; у первой её нет"],
        ],
        "Результаты оконных запросов (замеры PostgreSQL 16.14)",
      ),
      h("Нарастающий итог и скользящее среднее"),
      code("sql", `-- Выручка по месяцам (без отменённых заказов): накопительный итог и скользящее среднее за три месяца
WITH monthly AS (
  SELECT substr(CAST(o.ordered_on AS text), 1, 7) AS month,
         sum(oi.qty * p.price)                    AS revenue
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products    AS p  ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY substr(CAST(o.ordered_on AS text), 1, 7)
)
SELECT month, revenue,
       sum(revenue) OVER (ORDER BY month)                                          AS running_total,
       round(avg(revenue) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)) AS avg_last_3
FROM monthly
ORDER BY month;`, { filename: "05-running.sql", runnable: true, fixture: "shop" }),
      code("text", `  month  | revenue | running_total | avg_last_3 
---------+---------+---------------+------------
 2024-01 | 1380.00 |       1380.00 |       1380
 2024-02 | 3550.00 |       4930.00 |       2465
 2024-03 | 4330.00 |       9260.00 |       3087
 2024-04 | 4890.00 |      14150.00 |       4257
 2024-05 | 2880.00 |      17030.00 |       4033
 2024-06 | 4360.00 |      21390.00 |       4043
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`sum(revenue) OVER (ORDER BY month)` — выручка с начала периода: к июню накоплено 21 390.",
        "`avg(...) ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` — среднее за текущий и два предыдущих месяца. В первых двух строках окно короче (1380 и 2465 — среднее из одного и двух значений).",
        "Месяц получен как `substr(CAST(ordered_on AS text), 1, 7)`: одинаковый способ для PostgreSQL и SQLite.",
      ),
      h("Предыдущая и следующая строка"),
      code("sql", `-- Изменение к предыдущему месяцу и предыдущий/следующий заказ клиента
WITH monthly AS (
  SELECT substr(CAST(o.ordered_on AS text), 1, 7) AS month,
         sum(oi.qty * p.price)                    AS revenue
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products    AS p  ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY substr(CAST(o.ordered_on AS text), 1, 7)
)
SELECT month, revenue,
       lag(revenue) OVER (ORDER BY month)              AS prev_month,
       revenue - lag(revenue, 1, 0) OVER (ORDER BY month) AS change
FROM monthly
ORDER BY month;

SELECT customer_id, id AS order_id, ordered_on,
       lag(ordered_on)  OVER (PARTITION BY customer_id ORDER BY ordered_on) AS prev_order,
       lead(ordered_on) OVER (PARTITION BY customer_id ORDER BY ordered_on) AS next_order
FROM orders
WHERE customer_id IN (1, 2)
ORDER BY customer_id, ordered_on;`, { filename: "06-lag-lead.sql", runnable: true, fixture: "shop" }),
      code("text", `  month  | revenue | prev_month |  change  
---------+---------+------------+----------
 2024-01 | 1380.00 |            |  1380.00
 2024-02 | 3550.00 |    1380.00 |  2170.00
 2024-03 | 4330.00 |    3550.00 |   780.00
 2024-04 | 4890.00 |    4330.00 |   560.00
 2024-05 | 2880.00 |    4890.00 | -2010.00
 2024-06 | 4360.00 |    2880.00 |  1480.00
(6 rows)

 customer_id | order_id | ordered_on | prev_order | next_order 
-------------+----------+------------+------------+------------
           1 |        1 | 2024-01-10 |            | 2024-02-14
           1 |        2 | 2024-02-14 | 2024-01-10 | 2024-04-02
           1 |        7 | 2024-04-02 | 2024-02-14 | 2024-06-01
           1 |       12 | 2024-06-01 | 2024-04-02 | 
           2 |        3 | 2024-02-20 |            | 2024-04-30
           2 |        9 | 2024-04-30 | 2024-02-20 | 
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("У января нет предыдущего месяца: `lag(revenue)` вернул `NULL`, а `lag(revenue, 1, 0)` подставил 0 — поэтому «изменение» первого месяца равно всей выручке (1 380). Выбор значения по умолчанию — смысловое решение: 0 здесь вводит в заблуждение, `NULL` честнее. У клиента 1 заказы идут 10 января, 14 февраля, 2 апреля и 1 июня: у последнего нет `next_order`."),
    ]),

    section("internals", [
      h("Рамки: ROWS и RANGE при равных значениях"),
      code("sql", `-- Режимы рамки: RANGE (по умолчанию) считает равные значения «соседями» и даёт им один итог, ROWS — строка за строкой
SELECT name, salary,
       sum(salary) OVER (ORDER BY salary)                                                AS running_range,
       sum(salary) OVER (ORDER BY salary, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_rows
FROM employees
WHERE dept IN ('продажи', 'поддержка')
ORDER BY salary, id;`, { filename: "07-frames.sql", runnable: true, fixture: "staff" }),
      code("text", `  name   | salary | running_range | running_rows 
---------+--------+---------------+--------------
 Яков    |  85000 |         85000 |        85000
 Юлия    |  90000 |        175000 |       175000
 Эльвира |  95000 |        270000 |       270000
 Хлоя    | 110000 |        490000 |       380000
 Цезарь  | 110000 |        490000 |       490000
 Фёдор   | 200000 |        690000 |       690000
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("У Хлои и Цезаря одинаковая зарплата 110 000. С рамкой по умолчанию (`RANGE`) оба — «соседи по значению», и нарастающий итог у них общий: 490 000. `ROWS` идёт строка за строкой: 380 000 после Хлои и 490 000 после Цезаря. Если нужен «обычный» нарастающий итог по строкам, задавайте `ROWS` явно и добавляйте уникальный порядок."),
      h("first_value и last_value: ловушка рамки"),
      code("sql", `-- last_value с рамкой по умолчанию возвращает текущую строку; чтобы увидеть последнюю в группе, рамку надо расширить
SELECT dept, name, salary,
       first_value(name) OVER w                                                   AS lowest_paid,
       last_value(name)  OVER w                                                   AS last_default,
       last_value(name)  OVER (PARTITION BY dept ORDER BY salary, id
                               ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS top_paid
FROM employees
WHERE dept IN ('продажи', 'поддержка')
WINDOW w AS (PARTITION BY dept ORDER BY salary, id)
ORDER BY dept, salary, id;`, { filename: "08-first-last.sql", runnable: true, fixture: "staff" }),
      code("text", `   dept    |  name   | salary | lowest_paid | last_default | top_paid 
-----------+---------+--------+-------------+--------------+----------
 поддержка | Яков    |  85000 | Яков        | Яков         | Юлия
 поддержка | Юлия    |  90000 | Яков        | Юлия         | Юлия
 продажи   | Эльвира |  95000 | Эльвира     | Эльвира      | Фёдор
 продажи   | Хлоя    | 110000 | Эльвира     | Хлоя         | Фёдор
 продажи   | Цезарь  | 110000 | Эльвира     | Цезарь       | Фёдор
 продажи   | Фёдор   | 200000 | Эльвира     | Фёдор        | Фёдор
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`first_value` работает как ожидалось (самый низкооплачиваемый), а `last_value` с рамкой по умолчанию возвращает **текущую строку**: рамка заканчивается на ней. Чтобы увидеть самого высокооплачиваемого (`top_paid`), нужна полная рамка `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`. Именованное окно `WINDOW w AS (…)` избавляет от повторения одинаковых определений."),
      h("percent_rank, cume_dist, ntile"),
      code("sql", `-- Доли и корзины: percent_rank, cume_dist и ntile(4) по зарплате
SELECT name, salary,
       round(CAST(percent_rank() OVER (ORDER BY salary) AS numeric), 2) AS pct_rank,
       round(CAST(cume_dist()    OVER (ORDER BY salary) AS numeric), 2) AS cume,
       ntile(4) OVER (ORDER BY salary, id)                              AS quartile
FROM employees
ORDER BY salary, id;`, { filename: "09-percent-ntile.sql", runnable: true, fixture: "staff" }),
      code("text", `  name   | salary | pct_rank | cume | quartile 
---------+--------+----------+------+----------
 Яков    |  85000 |     0.00 | 0.08 |        1
 Юлия    |  90000 |     0.09 | 0.17 |        1
 Эльвира |  95000 |     0.18 | 0.25 |        1
 Хлоя    | 110000 |     0.27 | 0.42 |        2
 Цезарь  | 110000 |     0.27 | 0.42 |        2
 Ульяна  | 120000 |     0.45 | 0.50 |        2
 Тимур   | 140000 |     0.55 | 0.58 |        3
 Ольга   | 180000 |     0.64 | 0.75 |        3
 Семён   | 180000 |     0.64 | 0.75 |        3
 Фёдор   | 200000 |     0.82 | 0.83 |        4
 Павел   | 220000 |     0.91 | 0.92 |        4
 Ирина   | 300000 |     1.00 | 1.00 |        4
(12 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "`percent_rank = (rank − 1) / (n − 1)`: у самого низкого 0,00, у самого высокого 1,00; у Хлои и Цезаря — по 0,27 (ранг 4 из 12).",
        "`cume_dist` — доля строк со значением не больше текущего: у равных — одинаковая (0,42), у последнего — 1,00.",
        "`ntile(4)` делит 12 строк на четыре корзины по три; при неделимом числе первые корзины получают на строку больше (замер `ntile(5)`: размеры 3, 3, 2, 2, 2).",
      ),
      h("Окно над группами и FILTER"),
      code("sql", `-- Окно работает после GROUP BY: можно ранжировать сами группы
SELECT dept, count(*) AS staff, sum(salary) AS payroll,
       rank() OVER (ORDER BY sum(salary) DESC) AS by_payroll,
       rank() OVER (ORDER BY count(*) DESC)    AS by_size
FROM employees
GROUP BY dept
ORDER BY by_payroll;`, { filename: "13-over-groups.sql", runnable: true, fixture: "staff" }),
      code("text", `    dept    | staff | payroll | by_payroll | by_size 
------------+-------+---------+------------+---------
 разработка |     5 |  840000 |          1 |       1
 продажи    |     4 |  515000 |          2 |       2
 правление  |     1 |  300000 |          3 |       4
 поддержка  |     2 |  175000 |          4 |       3
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Окна работают после `GROUP BY`, поэтому внутри `OVER` допустимы агрегаты: отделы ранжированы по фонду (разработка — 840 000, поддержка — 175 000) и по размеру (поддержка — третья по размеру, но последняя по фонду)."),
      code("sql", `-- FILTER внутри оконного агрегата: сколько оплаченных заказов было у клиента к этому моменту
SELECT o.customer_id, o.id AS order_id, o.status,
       count(*) FILTER (WHERE o.status = 'paid') OVER (PARTITION BY o.customer_id ORDER BY o.id) AS paid_so_far
FROM orders AS o
WHERE o.customer_id IN (1, 3)
ORDER BY o.customer_id, o.id;`, { filename: "10-filter.sql", runnable: true, fixture: "shop" }),
      code("text", ` customer_id | order_id |  status   | paid_so_far 
-------------+----------+-----------+-------------
           1 |        1 | paid      |           1
           1 |        2 | paid      |           2
           1 |        7 | paid      |           3
           1 |       12 | shipped   |           3
           3 |        4 | paid      |           1
           3 |        5 | cancelled |           1
           3 |       11 | paid      |           2
(7 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("`FILTER (WHERE …)` учитывает в оконном агрегате только подходящие строки: у клиента 3 отменённый заказ 5 не увеличил счётчик оплаченных (`1` остался `1`)."),
      h("Как оконные функции видны в плане"),
      code("sql", `-- План запроса с одним окном и с двумя разными окнами (COSTS OFF убирает цифры стоимости)
EXPLAIN (COSTS OFF)
SELECT name, rank() OVER (PARTITION BY dept ORDER BY salary DESC) AS place
FROM employees;

EXPLAIN (COSTS OFF)
SELECT name,
       sum(salary) OVER (PARTITION BY dept)       AS dept_total,
       rank()      OVER (ORDER BY salary DESC)    AS company_place
FROM employees;

EXPLAIN (COSTS OFF)
SELECT name,
       rank()      OVER w AS place,
       sum(salary) OVER w AS running
FROM employees
WINDOW w AS (PARTITION BY dept ORDER BY salary DESC);`, { filename: "18-explain.pg.sql" }),
      code("text", `             QUERY PLAN              
-------------------------------------
 WindowAgg
   ->  Sort
         Sort Key: dept, salary DESC
         ->  Seq Scan on employees
(4 rows)

                  QUERY PLAN                   
-----------------------------------------------
 WindowAgg
   ->  Sort
         Sort Key: dept
         ->  WindowAgg
               ->  Sort
                     Sort Key: salary DESC
                     ->  Seq Scan on employees
(7 rows)

             QUERY PLAN              
-------------------------------------
 WindowAgg
   ->  Sort
         Sort Key: dept, salary DESC
         ->  Seq Scan on employees
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      ul(
        "Один раздел и порядок: узел `WindowAgg` над `Sort` по `dept, salary DESC` — окно требует отсортированного входа.",
        "Два разных окна (`PARTITION BY dept` и `ORDER BY salary DESC`) дали **два** `WindowAgg` и **две** сортировки.",
        "Функции с одинаковым определением окна (`OVER w`) вычисляются за один проход: один `WindowAgg` и одна сортировка.",
      ),
      p("Вывод: выносите одинаковые окна в `WINDOW w AS (…)`, а лишних разных сортировок избегайте: на больших таблицах каждая — заметная цена. Как индекс помогает избежать сортировки, разберём в теме про индексы."),
    ]),

    section("mistakes", [
      h("Ошибка: оконная функция в WHERE"),
      code("sql", `-- Оконная функция в WHERE невозможна: окно считается после фильтрации
SELECT name, salary FROM employees WHERE rank() OVER (ORDER BY salary DESC) <= 3;`, { filename: "11-where-error.pg.sql" }),
      code("text", `ERROR:  window functions are not allowed in WHERE
LINE 1: SELECT name, salary FROM employees WHERE rank() OVER (ORDER ...
                                                 ^`, { filename: "результат (PostgreSQL 16.14)" }),
      p("Окно вычисляется после `WHERE`, поэтому фильтровать по нему на том же уровне нельзя. Решение — подзапрос или CTE: сначала вычислить столбец, потом отфильтровать (см. `04-top-n.sql`)."),
      h("Ошибка: last_value без расширенной рамки"),
      wrongRight(
        "sql",
        { title: "Возвращает текущую строку", code: `last_value(salary) OVER (PARTITION BY dept ORDER BY salary)`, note: "Рамка по умолчанию заканчивается на текущей строке, поэтому результат равен зарплате самой строки, а «разрыв до лидера» — нулю." },
        { title: "Полная рамка или max", code: `max(salary) OVER (PARTITION BY dept)`, note: "Для максимума раздела достаточно `max` по окну без `ORDER BY`; для `last_value` — `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`." },
      ),
      h("Ошибка: row_number без однозначного порядка"),
      p("Если в `ORDER BY` есть равные значения, `row_number` присвоит им номера в произвольном порядке, и «первая» строка группы может отличаться между запусками и планами. Добавляйте тай-брейк: `ORDER BY ordered_on DESC, id DESC`."),
      h("Ошибка: путать rank, dense_rank и row_number в топ-N"),
      p("`rank() <= 2` вернул девять строк вместо семи (ничьи). `row_number() <= 2` вернёт не более двух строк на отдел, но выберет одну из равных произвольно. Решите заранее, что должно происходить при ничьей, и выберите функцию осознанно."),
      h("Ошибка: забыть PARTITION BY"),
      p("Без `PARTITION BY` окно охватывает весь результат: `rank() OVER (ORDER BY salary DESC)` ранжирует всех сотрудников компании, а не внутри отделов. Проверяйте, что ранжирование и накопление идут по нужному разбиению."),
      h("Ошибка: NULL в ORDER BY окна"),
      p("Где окажутся `NULL` в упорядочении, зависит от СУБД и направления сортировки; нарастающие итоги и `lag` на них реагируют. Задавайте порядок явно: `ORDER BY value DESC NULLS LAST`."),
    ]),

    section("antipatterns", [
      ul(
        "**Коррелированный подзапрос вместо окна:** среднее по отделу, пересчитываемое для каждой строки (в плане — `SubPlan` с `Seq Scan` внутри).",
        "**`SELECT DISTINCT` после оконной функции**, чтобы «склеить» дубли: если строки нужны уникальные, группируйте или выберите нужную строку через `row_number`.",
        "**Одинаковое окно, записанное несколько раз** вместо `WINDOW w AS (…)` — при правке легко разойтись.",
        "**Нарастающий итог без явной рамки на неуникальном порядке:** «равные» строки получат один итог, и сумма будет выглядеть неверной.",
        "**Окно по огромной таблице без индекса** под `PARTITION BY`/`ORDER BY`: сортировка всей таблицы ради одного отчёта.",
        "**Фильтр по результату окна через `HAVING`** — `HAVING` работает до окон; нужен внешний запрос.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Всегда задавайте полный порядок** (`ORDER BY` + уникальный тай-брейк) внутри окна.",
        "**Фильтруйте до окна** (`WHERE` во внутреннем запросе) — окно обрабатывает меньше строк.",
        "**Фильтруйте по результату окна на внешнем уровне** (подзапрос или CTE).",
        "**Задавайте рамку явно**, если важна разница между `ROWS` и `RANGE`.",
        "**Выбирайте функцию ранга по задаче:** `row_number` — ровно одна строка, `rank` — олимпийская нумерация, `dense_rank` — «N лучших значений».",
        "**Именуйте общие окна** (`WINDOW w AS …`) и используйте `OVER w`.",
        "**Указывайте значение по умолчанию для `lag`/`lead` осознанно** (`NULL` или смысловое).",
        "**Проверяйте план:** `WindowAgg` над `Sort` — нормально для отчёта, но на больших таблицах подумайте об индексе под порядок окна.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Пустой результат:** оконная функция на пустом наборе возвращает пустой набор строк.",
        "**Один элемент в разделе:** `percent_rank` равен 0 (замер для «правления»), `lag` — `NULL`, `avg` — само значение (300 000, разница с ним 0).",
        "**`ntile(n)` при числе строк меньше n:** каждая строка получает свою корзину, старшие номера не используются (в замере `ntile(6)` для трёх строк: 1, 2, 3).",
        "**`nth_value(x, n)`:** возвращает `NULL`, пока рамка короче n строк.",
        "**Окна и агрегаты в одном запросе:** сначала вычисляется `GROUP BY`, затем окна над его результатом (`rank() OVER (ORDER BY sum(salary) DESC)`).",
        "**SQLite:** оконные функции с версии 3.25, `FILTER` — с 3.30, `GROUPS` и `EXCLUDE` — с 3.28; на старых версиях запрос завершится ошибкой.",
      ),
    ]),

    section("related", [
      ul(
        "[GROUP BY и HAVING](/learn/sql/group-by-having) — агрегация, сворачивающая строки: что окно делает иначе.",
        "[Подзапросы](/learn/sql/subqueries) — обёртка для фильтрации по результату окна.",
        "[CTE: именованные шаги запроса](/learn/sql/ctes) — читаемая запись «ранжирование → фильтр».",
        "[Рекурсивные CTE](/learn/sql/recursive-ctes) — обходы, в которых окна считают размеры и уровни.",
        "[Индексы и B-дерево](/learn/sql/indexes-btree) — как индекс избавляет окно от сортировки.",
        "[Планы запросов](/learn/sql/explain-plans) — как читать `WindowAgg`, `Sort` и `SubPlan`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "sql",
        {
          title: "Коррелированный подзапрос",
          code: `
            SELECT name, salary,
                   (SELECT round(avg(salary)) FROM employees AS e2 WHERE e2.dept = e.dept) AS dept_avg
            FROM employees AS e
            ORDER BY id;
          `,
          note: "В плане — `SubPlan` с `Seq Scan` по `employees` внутри; логика «среднее по отделу» размазана по подзапросу.",
        },
        {
          title: "Оконная функция",
          code: `
            SELECT name, salary,
                   round(avg(salary) OVER (PARTITION BY dept)) AS dept_avg
            FROM employees
            ORDER BY id;
          `,
          note: "Тот же результат (в замере вывод идентичен), задача выражена одной строкой, а планировщик считает окно одним проходом.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "sql.window-functions.ex1",
      title: "Предскажите ранги и итог",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская, определите результат двух запросов. В разработке зарплаты — 220 000, 180 000, 180 000, 140 000, 120 000. Во втором запросе внутри `OVER ()` стоит агрегат: подумайте, на каком шаге он вычисляется."),
        code("sql", `SELECT salary,
       rank()       OVER (ORDER BY salary DESC) AS r,
       dense_rank() OVER (ORDER BY salary DESC) AS d
FROM employees
WHERE dept = 'разработка'
ORDER BY salary DESC, id;

SELECT dept, count(*) AS n, sum(count(*)) OVER () AS total
FROM employees
GROUP BY dept
ORDER BY dept;`, { filename: "14-ex-predict.sql", runnable: true, fixture: "staff" }),
      ],
      hints: ["Что делает `rank` с равными значениями и что — `dense_rank`?", "Окно над группами видит строки после `GROUP BY` — сколько там строк и чему равна сумма их `count(*)`?"],
      checks: ["Первый: r = 1, 2, 2, 4, 5; d = 1, 2, 2, 3, 4", "Второй: четыре строки, в каждой `total = 12`"],
      solution: [
        code("text", ` salary | r | d 
--------+---+---
 220000 | 1 | 1
 180000 | 2 | 2
 180000 | 2 | 2
 140000 | 4 | 3
 120000 | 5 | 4
(5 rows)

    dept    | n | total 
------------+---+-------
 поддержка  | 2 |    12
 правление  | 1 |    12
 продажи    | 4 |    12
 разработка | 5 |    12
(4 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        ul(
          "`rank` пропускает номер после ничьей (1, 2, 2, 4, 5), `dense_rank` — нет (1, 2, 2, 3, 4).",
          "После `GROUP BY dept` остаётся четыре строки (2, 1, 4, 5 человек); `sum(count(*)) OVER ()` суммирует их числа — 12, во всех четырёх строках.",
        ),
      ],
    }),
    exercise({
      id: "sql.window-functions.ex2",
      title: "Разрыв до лидера всегда ноль",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Запрос должен показать, на сколько зарплата каждого сотрудника разработки отличается от максимальной в отделе, но во всех строках получается 0. Найдите причину и исправьте (два способа)."),
        code("sql", `-- Хотим узнать, на сколько зарплата каждого сотрудника отличается от самой высокой в отделе
SELECT dept, name, salary,
       last_value(salary) OVER (PARTITION BY dept ORDER BY salary) - salary AS gap_to_top
FROM employees
WHERE dept = 'разработка'
ORDER BY salary, id;`, { filename: "15-ex-fix.sql", runnable: true, fixture: "staff" }),
      ],
      hints: ["До какой строки доходит рамка окна, если задан `ORDER BY`?", "Можно ли вычислить максимум раздела, не задавая порядок?"],
      checks: ["Причина — рамка по умолчанию заканчивается на текущей строке", "Исправление: `max(salary) OVER (PARTITION BY dept)` или полная рамка у `last_value`"],
      solution: [
        code("sql", `SELECT dept, name, salary,
       max(salary) OVER (PARTITION BY dept) - salary AS gap_to_top
FROM employees
WHERE dept = 'разработка'
ORDER BY salary, id;`, { filename: "16-fix-solution.sql", runnable: true, fixture: "staff" }),
        code("text", `    dept    |  name  | salary | gap_to_top 
------------+--------+--------+------------
 разработка | Ульяна | 120000 |     100000
 разработка | Тимур  | 140000 |      80000
 разработка | Ольга  | 180000 |      40000
 разработка | Семён  | 180000 |      40000
 разработка | Павел  | 220000 |          0
(5 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("`last_value` смотрит в рамку, которая по умолчанию кончается на текущей строке, поэтому возвращает её саму. Вместо этого взяли `max(salary) OVER (PARTITION BY dept)` — без `ORDER BY` рамка охватывает весь раздел. Второй способ — оставить `last_value` и задать `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`."),
      ],
    }),
    exercise({
      id: "sql.window-functions.ex3",
      title: "Последний заказ каждого клиента",
      difficulty: "advanced",
      kind: "application",
      prompt: [
        p("Для каждого клиента, у которого есть заказы, выведите его последний заказ: `customer_id`, номер заказа, дату и статус. При одинаковой дате побеждает заказ с большим `id`. Клиенты без заказов не нужны."),
      ],
      hints: ["Какой функцией нумеруют строки внутри клиента от новых к старым?", "Как оставить только первую строку каждого клиента, если окно нельзя поставить в `WHERE`?"],
      checks: ["`row_number() OVER (PARTITION BY customer_id ORDER BY ordered_on DESC, id DESC)`", "Подзапрос и `WHERE rn = 1`", "Шесть клиентов, у Дарьи последний заказ — отменённый"],
      solution: [
        code("sql", `-- Последний заказ каждого клиента: row_number по убыванию даты, берём первую строку
SELECT customer_id, order_id, ordered_on, status
FROM (
  SELECT customer_id, id AS order_id, ordered_on, status,
         row_number() OVER (PARTITION BY customer_id ORDER BY ordered_on DESC, id DESC) AS rn
  FROM orders
) AS t
WHERE rn = 1
ORDER BY customer_id;`, { filename: "12-latest-per-customer.sql", runnable: true, fixture: "shop", lineNumbers: true }),
        code("text", ` customer_id | order_id | ordered_on |  status   
-------------+----------+------------+-----------
           1 |       12 | 2024-06-01 | shipped
           2 |        9 | 2024-04-30 | paid
           3 |       11 | 2024-05-21 | paid
           4 |        6 | 2024-03-20 | new
           5 |       13 | 2024-06-18 | cancelled
           7 |       10 | 2024-05-06 | paid
(6 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
        p("Тай-брейк `id DESC` делает порядок однозначным, `row_number` — «ровно одна строка на клиента». Обратите внимание: у Дарьи последний заказ — отменённый (13, `cancelled`); статус в этой задаче не фильтровался. Егор и Игорь без заказов в результат не попали."),
      ],
    }),
  ],

  challenge: {
    id: "sql.window-functions.challenge",
    title: "Заказы клиентов: накопление и рейтинг по сумме",
    scenario: [
      p("Аналитик хочет таблицу заказов без отменённых: для каждого заказа — клиент, дата, сумма заказа, накопленная сумма клиента к этой дате и место заказа по размеру среди заказов этого клиента."),
    ],
    requirements: [
      "Сумма заказа = `qty × price` по всем позициям, отменённые заказы исключены",
      "Накопленная сумма клиента — по порядку дат (при равных датах — по номеру заказа)",
      "Место по размеру — внутри клиента, от самого крупного заказа",
      "Порядок вывода: имя клиента, дата, номер заказа",
    ],
    constraints: [
      "Сумма заказа считается один раз (подзапрос или CTE), окна — поверх неё",
      "Ни коррелированных подзапросов, ни самосоединений",
    ],
    acceptance: [
      "У Анны четыре заказа: накопленная сумма 1 380, 3 030, 4 400, 8 760; самый крупный — 4 360 (место 1)",
      "11 строк в результате; у Бориса и Веры по два заказа",
    ],
    hints: [
      "Сначала CTE `order_totals`: `GROUP BY` по заказу с `sum(qty * price)`.",
      "Два окна с разным порядком: по дате (накопление) и по сумме (место).",
    ],
    solution: [
      code("sql", `-- Клиенты и их заказы (без отменённых): сумма заказа, накопительная сумма клиента, место заказа по размеру среди заказов клиента
WITH order_totals AS (
  SELECT o.id AS order_id, o.customer_id, o.ordered_on, sum(oi.qty * p.price) AS total
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  JOIN products    AS p  ON p.id = oi.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id, o.customer_id, o.ordered_on
)
SELECT c.name, t.ordered_on, t.total,
       sum(t.total) OVER (PARTITION BY t.customer_id ORDER BY t.ordered_on, t.order_id) AS customer_running,
       rank() OVER (PARTITION BY t.customer_id ORDER BY t.total DESC)                   AS size_rank
FROM order_totals AS t
JOIN customers AS c ON c.id = t.customer_id
ORDER BY c.name, t.ordered_on, t.order_id;`, { filename: "17-challenge.sql", runnable: true, fixture: "shop", lineNumbers: true }),
      code("text", ` name  | ordered_on |  total  | customer_running | size_rank 
-------+------------+---------+------------------+-----------
 Анна  | 2024-01-10 | 1380.00 |          1380.00 |         3
 Анна  | 2024-02-14 | 1650.00 |          3030.00 |         2
 Анна  | 2024-04-02 | 1370.00 |          4400.00 |         4
 Анна  | 2024-06-01 | 4360.00 |          8760.00 |         1
 Борис | 2024-02-20 | 1900.00 |          1900.00 |         1
 Борис | 2024-04-30 | 1420.00 |          3320.00 |         2
 Вера  | 2024-03-01 | 3480.00 |          3480.00 |         1
 Вера  | 2024-05-21 |  730.00 |          4210.00 |         2
 Глеб  | 2024-03-20 |  850.00 |           850.00 |         1
 Дарья | 2024-04-11 | 2100.00 |          2100.00 |         1
 Жанна | 2024-05-06 | 2150.00 |          2150.00 |         1
(11 rows)`, { filename: "результат (PostgreSQL 16.14)" }),
      p("CTE `order_totals` сворачивает позиции до заказов, а окна работают над ней уже по одной строке на заказ. `customer_running` накапливается по дате, `size_rank` — независимое ранжирование по сумме. Контроль: накопленная сумма Анны в последней строке — 8 760, как сумма её четырёх заказов."),
    ],
  },

  interview: [
    iq("sql.window-functions.i1", "basic", "Чем оконная функция отличается от агрегатной с GROUP BY?", [
      ul(
        "`GROUP BY` сворачивает строки группы в одну, оконная функция вычисляет значение по группе (окну), но оставляет каждую строку.",
        "Пример: `sum(salary) OVER ()` — 1 830 000 в каждой из 12 строк, `GROUP BY` дал бы одну строку.",
        "Оконную функцию можно комбинировать с обычными столбцами без дополнительной группировки.",
      ),
    ]),
    iq("sql.window-functions.i2", "basic", "В чём разница между row_number, rank и dense_rank?", [
      ul(
        "Все три нумеруют строки по порядку окна; различаются поведением при равных значениях.",
        "`row_number` — всегда уникальные числа (при равных — произвольно, нужен тай-брейк).",
        "`rank` — равным одно место, следующее пропускается (1, 2, 2, 4).",
        "`dense_rank` — равным одно место, без пропусков (1, 2, 2, 3).",
      ),
    ]),
    iq("sql.window-functions.i3", "intermediate", "Как получить топ-2 сотрудника по зарплате в каждом отделе?", [
      ul(
        "Вычислить место оконной функцией с `PARTITION BY dept ORDER BY salary DESC` во внутреннем запросе.",
        "Отфильтровать `place <= 2` во внешнем — в `WHERE` оконная функция запрещена.",
        "При равных зарплатах `rank` вернёт больше двух строк на отдел (в замере 9 строк вместо 7), `row_number` — не более двух.",
      ),
    ]),
    iq("sql.window-functions.i4", "intermediate", "Что такое рамка окна и какая используется по умолчанию?", [
      ul(
        "Рамка — подмножество раздела вокруг текущей строки, задаётся `ROWS`/`RANGE`/`GROUPS` и границами.",
        "По умолчанию при наличии `ORDER BY`: `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`; без `ORDER BY` — весь раздел.",
        "Ранжирующие функции и `lag`/`lead` рамку игнорируют, агрегаты и `first_value`/`last_value` используют.",
      ),
    ]),
    iq("sql.window-functions.i5", "intermediate", "Чем ROWS отличается от RANGE в нарастающем итоге?", [
      ul(
        "`ROWS` считает строки; `RANGE` включает все строки с тем же значением `ORDER BY` (равные значения — «соседи»).",
        "В замере у Хлои и Цезаря (по 110 000): `RANGE` — 490 000 у обоих, `ROWS` — 380 000 и 490 000.",
        "Для привычного «нарастающего по строкам» задают `ROWS` явно и порядок делают однозначным.",
      ),
    ]),
    iq("sql.window-functions.i6", "advanced", "Почему last_value часто возвращает не то, что ожидают, и как это исправить?", [
      ul(
        "Рамка по умолчанию заканчивается на текущей строке, поэтому `last_value` возвращает её значение.",
        "Исправление: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` или другая функция (`max(...) OVER (PARTITION BY ...)`).",
        "То же касается `nth_value` и агрегатов, зависящих от рамки.",
      ),
    ]),
    iq("sql.window-functions.i7", "advanced", "Как оконные функции влияют на план выполнения?", [
      ul(
        "В плане PostgreSQL — узел `WindowAgg` над `Sort` по `PARTITION BY` и `ORDER BY` (в замере: `Sort Key: dept, salary DESC`).",
        "Каждое окно с разным порядком требует своей сортировки: два разных окна дали два `WindowAgg` и два `Sort`.",
        "Функции с одним определением окна вычисляются за один проход; индекс под порядок окна может убрать сортировку.",
      ),
    ]),
    iq("sql.window-functions.i8", "engineering", "Отчёт с оконными функциями по таблице в 50 млн строк работает минуты. Что вы проверите и сделаете?", [
      ul(
        "Сначала `EXPLAIN (ANALYZE, BUFFERS)`: сколько строк попадает в `WindowAgg` и не сбрасывается ли сортировка на диск.",
        "Отфильтровать строки до окна (`WHERE` по периоду) и взять нужные столбцы — сортировать меньше данных.",
        "Свести одинаковые окна в `WINDOW w`, избавиться от лишних разных порядков.",
        "Индекс под `PARTITION BY … ORDER BY …` для топ-N по группе; для готовых отчётов — материализованное представление или предагрегаты.",
        "Сравнить планы и время до и после; проверять результат на тех же данных.",
      ),
    ]),
  ],

  exam: [
    mcq("sql.window-functions.e1", "foundation", "Чем оконная функция отличается от агрегата с `GROUP BY`?", ["Оконная функция сворачивает строки сильнее", "Оконная функция работает только с `NULL`", "Оконная функция сохраняет все строки и добавляет вычисленный столбец", "Разницы нет"], 2, "Агрегат с `GROUP BY` возвращает по строке на группу, а окно считает значение по группе и оставляет каждую строку (12 строк при `OVER ()`)."),
    mcq("sql.window-functions.e2", "foundation", "Что делает `PARTITION BY dept` внутри `OVER`?", ["Делит строки на независимые разделы по отделам", "Сортирует результат по отделу", "Объединяет отделы в один", "Удаляет повторы"], 0, "Функция считается отдельно в каждом разделе: среднее по разработке 168 000, по продажам — 128 750."),
    mcq("sql.window-functions.e3", "foundation", "Какая функция присваивает равным значениям одно место и НЕ пропускает следующие?", ["`row_number`", "`rank`", "`ntile`", "`dense_rank`"], 3, "`dense_rank` даёт 1, 2, 2, 3, а `rank` пропускает номер после ничьей: 1, 2, 2, 4."),
    mcq("sql.window-functions.e4", "intermediate", "Где нельзя использовать оконную функцию?", ["В списке `SELECT`", "В `WHERE`", "В `ORDER BY`", "В подзапросе в `FROM`"], 1, "Окна вычисляются после `WHERE`; PostgreSQL отвечает `window functions are not allowed in WHERE`. Нужен внешний запрос."),
    mcq("sql.window-functions.e5", "intermediate", "Зарплаты разработки: 220 000, 180 000, 180 000, 140 000, 120 000. Что вернёт `rank() OVER (ORDER BY salary DESC)` для 140 000, если рассматривать только сотрудников разработки?", ["3", "2", "5", "4"], 3, "Две строки делят второе место, следующая получает 4 (замер: 1, 2, 2, 4, 5)."),
    mcq("sql.window-functions.e6", "intermediate", "Какой результат даёт `last_value(salary) OVER (PARTITION BY dept ORDER BY salary)` с рамкой по умолчанию?", ["Максимум в отделе", "NULL", "Зарплату текущей строки (рамка заканчивается на ней)", "Минимум в отделе"], 2, "Рамка по умолчанию — от начала раздела до текущей строки (с равными), поэтому последнее значение — текущее; «разрыв до лидера» получается нулевым."),
    mcq("sql.window-functions.e7", "advanced", "Как получить сумму нарастающим итогом строка за строкой даже при равных значениях `ORDER BY`?", ["`sum(x) OVER (ORDER BY y)`", "`sum(x) OVER (ORDER BY y, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`", "`sum(x) OVER (PARTITION BY y)`", "`sum(x) GROUP BY y`"], 1, "`ROWS` с уникальным порядком считает по строкам: 380 000 и 490 000, а рамка `RANGE` по умолчанию даёт обоим 490 000."),
    open("sql.window-functions.e8", "intermediate", "Напишите запрос: для каждой категории товаров вернуть самый дорогой товар, и объясните, как обработать ничью по цене.", [
      ul(
        "`SELECT category, title, price FROM (SELECT category, title, price, row_number() OVER (PARTITION BY category ORDER BY price DESC, id) AS rn FROM products) AS t WHERE rn = 1`.",
        "Подзапрос нужен: оконную функцию нельзя поставить в `WHERE`.",
        "Тай-брейк (`id`) делает результат детерминированным; если нужны все товары с максимальной ценой — `rank() = 1` или `dense_rank() = 1`.",
        "Для больших таблиц — индекс по `(category, price DESC)`; проверить план `EXPLAIN`.",
      ),
    ], ["Ранжирование по категории", "Подзапрос и фильтр по рангу", "Тай-брейк или ничья", "Индекс и план"], { format: "sql" }),
  ],

  mastery: [
    mcq("sql.window-functions.m1", "intermediate", "Чему равна `lag(revenue)` в первой строке окна `ORDER BY month`?", ["NULL", "0", "revenue", "Ошибка"], 0, "У первой строки нет предыдущей; `lag` возвращает `NULL`, если не задано значение по умолчанию (`lag(revenue, 1, 0)` вернёт 0)."),
    mcq("sql.window-functions.m2", "advanced", "В плане PostgreSQL два окна с разным порядком (`PARTITION BY dept` и `ORDER BY salary DESC`). Что вы увидите?", ["Один `WindowAgg` без сортировки", "Только `Seq Scan`", "Два `WindowAgg` и две `Sort`", "`Hash Join`"], 2, "Для каждого окна нужен отсортированный вход: в замере два `WindowAgg` с двумя узлами `Sort`; одинаковые окна (`OVER w`) вычисляются одним проходом."),
    mcq("sql.window-functions.m3", "advanced", "Почему «топ-2 по отделу» через `rank() <= 2` вернул 9 строк вместо 7?", ["Ничьи на втором месте получают одинаковый ранг и обе попадают в результат", "Ошибка в данных", "`rank` считает отделы, а не людей", "Из-за `NULL`"], 0, "Ольга и Семён (разработка), Хлоя и Цезарь (продажи) делят второе место, поэтому в результат попало на две строки больше максимальных семи — всего девять (замер)."),
    open("sql.window-functions.m4", "advanced", "Таблица событий `events(user_id, created_at, kind)` на 200 млн строк. Нужно для каждого пользователя найти время до следующего события и отметить «сессии» (разрыв больше 30 минут). Опишите решение и его риски.", [
      ul(
        "`lead(created_at) OVER (PARTITION BY user_id ORDER BY created_at)` даёт следующее событие; разность времён сравнивается с порогом, сессия нумеруется накопительной суммой флагов «начало сессии».",
        "Риски: сортировка 200 млн строк (`WindowAgg` над `Sort`), поэтому фильтр по периоду до окна и индекс по `(user_id, created_at)`.",
        "Тай-брейк на одинаковые времена (id события), иначе порядок и сессии недетерминированы.",
        "Для регулярных отчётов — инкрементальная обработка по дням и предагрегаты; проверять планом `EXPLAIN (ANALYZE, BUFFERS)` и на выборке с известным ответом.",
      ),
    ], ["lead и порог разрыва", "Нумерация сессий накопительной суммой", "Индекс и фильтр до окна", "Тай-брейк и проверка"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "sql.window-functions.f1", front: "Оконная функция?", back: "функция(…) OVER (PARTITION BY … ORDER BY … рамка): считает по окну строк, но не сворачивает их, в отличие от GROUP BY." },
    { id: "sql.window-functions.f2", front: "row_number / rank / dense_rank?", back: "Уникальные номера / равным одно место с пропуском (1,2,2,4) / без пропуска (1,2,2,3). Для row_number нужен тай-брейк." },
    { id: "sql.window-functions.f3", front: "Рамка по умолчанию?", back: "С ORDER BY: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW (равные — «соседи»). Без ORDER BY — весь раздел." },
    { id: "sql.window-functions.f4", front: "last_value ловушка?", back: "С рамкой по умолчанию возвращает текущую строку. Нужна полная рамка ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING или max/min по окну." },
    { id: "sql.window-functions.f5", front: "Окно в WHERE?", back: "Нельзя: окна вычисляются после WHERE/GROUP BY/HAVING. Нужен подзапрос или CTE." },
    { id: "sql.window-functions.f6", front: "lag / lead?", back: "Значение предыдущей / следующей строки (lag(x, n, default)); у первой/последней — NULL без default." },
    { id: "sql.window-functions.f7", front: "Топ-N в группе?", back: "Подзапрос с row_number()/rank() OVER (PARTITION BY g ORDER BY x DESC) и WHERE rn <= N во внешнем." },
    { id: "sql.window-functions.f8", front: "Окно в плане PostgreSQL?", back: "WindowAgg над Sort по PARTITION BY/ORDER BY; разные окна — разные сортировки; одинаковые (OVER w) — один проход." },
  ],

  sources: [
    { title: "PostgreSQL 16: Window Functions (tutorial)", url: "https://www.postgresql.org/docs/16/tutorial-window.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Window Function Processing", url: "https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-WINDOW", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Window Functions (built-in reference)", url: "https://www.postgresql.org/docs/16/functions-window.html", publisher: "PostgreSQL" },
    { title: "PostgreSQL 16: Window Function Calls (syntax and frames)", url: "https://www.postgresql.org/docs/16/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS", publisher: "PostgreSQL" },
    { title: "SQLite: Window Functions", url: "https://www.sqlite.org/windowfunctions.html", publisher: "Other" },
  ],
};
