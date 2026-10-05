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

export const concurrencyScheduling: Topic = {
  id: "cs.concurrency-scheduling",
  slug: "concurrency-scheduling",
  domain: "cs",
  module: "os",
  title: "Конкурентность и планирование: гонки, блокировки, очереди и планировщик",
  titleEn: "Concurrency and Scheduling: Races, Locks, Queues and the Scheduler",
  summary:
    "Когда несколько задач работают одновременно, появляются гонки данных, взаимные блокировки и вопросы справедливости и задержки. Тема разбирает критические секции, мьютексы, атомарные операции и условные переменные, взаимную блокировку и способы её избежать, модель памяти (почему «простая» программа даёт невозможный результат), алгоритмы планирования (FCFS, SJF, SRTF, Round Robin), приоритеты (`nice`) и теорию очередей (почему загрузка 95 % — это плохо). Всё подтверждено запуском: простое увеличение счётчика потеряло 51–74 % обновлений, атомарная операция стоит около 30 нс, мьютекс — около 50 нс, спинлок на четырёх потоках — около 175 нс, локальные счётчики — доли микросекунды; процесс с `nice 10` получил 1/9 процессорного времени; тест «буфер записи» показал запрещённый для последовательной согласованности исход в 5 % испытаний.",
  minutes: 110,
  prerequisites: ["cs.processes-threads", "cs.cpu-memory-cache"],
  tags: ["гонка данных", "мьютекс", "атомарные операции", "взаимная блокировка", "условная переменная", "модель памяти", "планировщик", "Round Robin", "nice", "очереди", "закон Литтла", "async"],
  keyConcepts: [
    { term: "Гонка данных — потерянные обновления", text: "4 потока × 2 000 000 увеличений общего `volatile long` дали на 51–74 % меньше ожидаемых 8 000 000; мьютекс, атомарная операция, спинлок и локальные счётчики — ровно 8 000 000." },
    { term: "Цена синхронизации", text: "Атомарное увеличение при конкуренции — около 30 нс на операцию, мьютекс — около 50 нс, спинлок на 4 потоках — около 175 нс, локальные счётчики с суммированием в конце — на 3–4 порядка быстрее всех (0,1–0,3 мс на 8 000 000 операций)." },
    { term: "Взаимная блокировка", text: "Два потока берут замки `A` и `B` в разном порядке: оба получили тайм-аут при ожидании второго замка. Единый порядок захвата и `trylock` с откатом работают." },
    { term: "Модель памяти", text: "Тест «буфер записи»: `x = 1; r1 = y` и `y = 1; r2 = x`. С `relaxed` исход `r1 = r2 = 0` наблюдался в 96–106 тысячах из 2 000 000 испытаний (около 5 %), с `seq_cst` — ни разу." },
    { term: "Планирование процессора", text: "Для процессов P1 (0, 8), P2 (1, 4), P3 (2, 9), P4 (3, 5): среднее ожидание FCFS — 8,75, SJF — 7,75, SRTF — 6,50, Round Robin при `q = 4` — 11,75 (зато отклик 4,50 против 8,75)." },
    { term: "Приоритеты", text: "Два процесса на одном ядре с равным `nice` получили доли с отношением 0,99; при `nice 0` и `nice 10` — отношение 9,07 (≈ 90 % и 10 %)." },
    { term: "Очереди и загрузка", text: "Время в системе одного обработчика растёт как `1/(μ−λ)`: 2,01 с при ρ = 0,5; 9,94 при 0,9; 19,83 при 0,95. Общая очередь на двух обработчиках: 5,22 с против 9,92 с у случайного разделения." },
  ],
  sections: [
    section("definition", [
      def("Конкурентность", "Структура программы, в которой несколько задач выполняются с перекрытием во времени (чередуясь на одном ядре или параллельно на нескольких). Не обязательно означает одновременное выполнение.", "concurrency"),
      def("Параллелизм", "Одновременное выполнение вычислений на нескольких исполнителях (ядрах) для ускорения.", "parallelism"),
      def("Критическая секция", "Участок кода, обращающийся к общим изменяемым данным, который в каждый момент может выполнять только одна задача.", "critical section"),
      def("Мьютекс", "Примитив взаимного исключения: в критическую секцию входит владелец замка; остальные ждут.", "mutex"),
      def("Атомарная операция", "Операция над памятью, выполняемая неделимо: другие потоки видят состояние до или после неё, но не посередине.", "atomic operation"),
      def("Условная переменная", "Примитив ожидания события внутри критической секции: поток отпускает мьютекс и засыпает до сигнала, затем снова захватывает мьютекс.", "condition variable"),
      def("Взаимная блокировка", "Состояние, при котором каждая из задач ждёт ресурс, удерживаемый другой, и ни одна не может продолжить.", "deadlock"),
      def("Планировщик", "Часть ядра, решающая, какая задача и на каком ядре выполняется в данный момент и на какое время.", "scheduler"),
      def("Голодание", "Ситуация, когда готовая к выполнению задача неопределённо долго не получает ресурс (процессор, замок) из-за предпочтения других.", "starvation"),
      def("Закон Литтла", "Среднее число заявок в системе равно произведению интенсивности поступления на среднее время пребывания: `L = λ·W`.", "Little's law"),
    ]),

    section("why", [
      h("Почему конкурентность — главный источник «невоспроизводимых» ошибок"),
      p("Ошибки конкурентности проявляются редко, зависят от нагрузки и порядка выполнения и пропадают при отладке. Единственный надёжный способ — понимать модель: что разделяется, что синхронизируется, в каком порядке видны изменения, и измерять."),
      ul(
        "**Корректность.** Потерянные обновления, двойное списание, чтение «наполовину записанного» состояния, взаимные блокировки сервисов.",
        "**Производительность.** Неверная синхронизация может быть медленнее однопоточной программы; верная — линейно масштабируется. Различие — на порядки (замер: локальные счётчики против общего атомарного).",
        "**Задержки и ёмкость.** Очереди, загрузка и планировщик определяют время ответа: при 95 % загрузки среднее время в системе в 10 раз больше времени обработки.",
        "**Языки и среды.** Потоки с общей памятью (C, Java, Rust), асинхронность на одном потоке (JavaScript), процессы с сообщениями (Erlang, Go-каналы) — разные способы ограничить общие данные.",
        "**Базы данных.** Блокировки, уровни изоляции и взаимные блокировки в СУБД — те же идеи в другом масштабе ([блокировки и дедлоки в SQL](/learn/sql/locking-deadlocks), [уровни изоляции](/learn/sql/isolation-levels)).",
      ),
      tip("Правило: сначала уберите разделяемое изменяемое состояние (копии, неизменяемые данные, сообщения), и только потом синхронизируйте то, что осталось."),
    ]),

    section("mental-model", [
      h("Где возникает проблема: чтение — изменение — запись"),
      diagram(
        `
        поток 1                  память            поток 2
        r = x   (читает 0) ──►  x = 0  ◄──  r = x   (читает 0)
        r = r + 1                                r = r + 1
        x = r   (пишет 1)  ──►  x = 1  ◄──  x = r   (пишет 1)

        два увеличения — результат 1 вместо 2: второй поток записал значение, вычисленное по устаревшему чтению
        `,
        "Операция `x++` — три шага (чтение, сложение, запись). Если шаги двух потоков перемежаются, одно из обновлений теряется.",
      ),
      h("Четыре условия взаимной блокировки (Коффмана)"),
      ul(
        "**Взаимное исключение:** ресурс удерживается одной задачей.",
        "**Удержание и ожидание:** задача держит один ресурс и ждёт другой.",
        "**Отсутствие вытеснения:** ресурс нельзя отобрать принудительно.",
        "**Циклическое ожидание:** есть цикл задач, где каждая ждёт ресурс следующей. Достаточно нарушить любое условие — например, ввести единый порядок захвата.",
      ),
      h("Планирование: кто и на сколько получает процессор"),
      diagram(
        `
        готовые задачи ──► планировщик ──► процессор (ядро)
                              ▲                │
                              │ вытеснение по  │ задача блокируется (ввод-вывод, замок) →
                              │ истечении кванта│ уходит в ожидание; готовая — возвращается в очередь
                              └────────────────┘

        цели: загрузка процессора, пропускная способность, время ответа, справедливость — выполнимы не одновременно
        `,
        "Планировщик компромиссно балансирует загрузку, пропускную способность, отклик и справедливость; разные политики расставляют акценты по-разному.",
      ),
      insight("Синхронизация и планирование — две стороны одной задачи: как нескольким исполнителям делить ресурс. Замки решают «кто один», планировщик — «кто следующий», очереди — «сколько ждать»."),
    ]),

    section("technical", [
      h("Примитивы синхронизации"),
      table(
        ["Примитив", "Назначение", "Цена и ограничения"],
        [
          ["Мьютекс", "Взаимное исключение; ожидающий поток засыпает", "В замере около 50 нс на операцию при 4 потоках; риск взаимной блокировки и инверсии приоритетов"],
          ["Спинлок", "Взаимное исключение с активным ожиданием", "Хорош для очень коротких секций на разных ядрах; в замере около 175 нс на операцию — хуже мьютекса при конкуренции"],
          ["Атомарные операции", "Неделимое чтение–изменение–запись одного слова", "В замере около 30 нс при конкуренции; не заменяют блокировку для составных инвариантов"],
          ["Условная переменная", "Ожидание события в критической секции", "Проверять условие в цикле `while`: возможны ложные пробуждения"],
          ["Семафор", "Счётчик доступных разрешений", "Ограничение числа одновременных пользователей ресурса"],
          ["Блокировка чтения-записи", "Много читателей или один писатель", "Выгодна при редких записях"],
          ["Барьер", "Ожидание, пока все задачи достигнут точки", "Используется в параллельных вычислениях"],
        ],
        "Основные средства синхронизации",
      ),
      h("Как избежать проблем"),
      ul(
        "**Не разделять изменяемое состояние:** каждая задача работает со своими данными, результаты объединяются в конце (локальные счётчики — самый быстрый вариант в замере).",
        "**Неизменяемые данные** можно безопасно читать из любого числа потоков.",
        "**Единый порядок захвата замков** (например, по номеру счёта) исключает циклическое ожидание.",
        "**Минимальные критические секции:** замок удерживается недолго, внутри нет блокирующего ввода-вывода и вызовов чужого кода.",
        "**Тайм-ауты и `trylock`:** обнаружение и откат вместо вечного ожидания.",
        "**Очереди сообщений:** передача владения вместо общего доступа (каналы, акторы, очередь воркеров).",
      ),
      h("Алгоритмы планирования процессора"),
      table(
        ["Алгоритм", "Идея", "Достоинство", "Недостаток"],
        [
          ["FCFS", "Кто первый пришёл, тот первый обслужен", "Прост, без голодания", "Эффект конвоя: короткие задачи ждут длинную"],
          ["SJF", "Выбрать самую короткую задачу (без вытеснения)", "Минимальное среднее ожидание при известных длительностях", "Длительности неизвестны; голодание длинных"],
          ["SRTF", "Вытеснение по наименьшему остатку", "Оптимален по среднему ожиданию", "Много переключений; голодание"],
          ["Round Robin", "Каждому — квант времени по кругу", "Хороший отклик, справедливость", "Накладные расходы на переключения; среднее ожидание хуже"],
          ["Приоритеты", "Выше приоритет — раньше", "Управляемость", "Голодание, инверсия приоритетов; старение как лекарство"],
          ["Многоуровневые очереди с обратной связью", "Интерактивные задачи — высокий приоритет, длинные — ниже", "Приближает SJF без знания длительностей", "Сложность настройки"],
        ],
        "Алгоритмы планирования",
      ),
      h("Очереди и загрузка"),
      ul(
        "Для одного обработчика с интенсивностью `μ` и потока заявок `λ` при `ρ = λ/μ < 1` среднее время в системе `W = 1/(μ − λ)`; при `ρ → 1` оно неограниченно растёт.",
        "**Закон Литтла:** `L = λ·W` — связывает число заявок в системе и время пребывания и справедлив очень широко.",
        "**Общая очередь к нескольким обработчикам** лучше, чем отдельные очереди с случайным распределением.",
        "**Хвостовые задержки:** p99 растёт быстрее среднего; SLA нужно задавать по процентилям.",
      ),
    ]),

    section("syntax", [
      annotated(
        "c",
        `pthread_mutex_lock(&m);                           // войти в критическую секцию (остальные ждут)
pthread_mutex_unlock(&m);                         // выйти из неё
while (!ready) pthread_cond_wait(&cv, &m);        // ждать условие, отпуская мьютекс; проверка в цикле
pthread_cond_signal(&cv);                         // разбудить одного ожидающего (broadcast — всех)
__atomic_fetch_add(&n, 1, __ATOMIC_SEQ_CST);      // неделимое увеличение без мьютекса
sem_wait(&s);  sem_post(&s);                      // семафор: счётчик разрешений`,
        [
          { line: 1, text: "`pthread_mutex_lock` — войти в критическую секцию; остальные потоки ждут." },
          { line: 2, text: "`pthread_mutex_unlock` — выйти; не забывайте на всех путях выхода." },
          { line: 3, text: "`pthread_cond_wait` отпускает мьютекс и усыпляет поток; условие проверяют в цикле `while`." },
          { line: 4, text: "`pthread_cond_signal` будит одного ожидающего, `broadcast` — всех." },
          { line: 5, text: "`__atomic_fetch_add` — неделимое увеличение без блокировки." },
          { line: 6, text: "Семафор: `sem_wait` уменьшает счётчик (ждёт при нуле), `sem_post` увеличивает." },
        ],
        "Основные вызовы POSIX и встроенные атомарные операции GCC",
      ),
    ]),

    section("minimal-example", [
      h("Гонка данных и цена синхронизации"),
      code("c", `#define _POSIX_C_SOURCE 200809L
// Гонка данных и способы синхронизации: корректность и цена. Время — в stderr, на stdout — корректность и проверки порядка.
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>
#define T 4
#define ITER 2000000L
static double now(void) { struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t); return t.tv_sec + t.tv_nsec * 1e-9; }

static volatile long racy;
static long locked; static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static long atomic_ctr;
static long spin_ctr; static volatile int spin_flag;
static long total_local;

static void *w_racy(void *x) { (void)x; for (long i = 0; i < ITER; i++) racy++; return 0; }
static void *w_mutex(void *x) { (void)x; for (long i = 0; i < ITER; i++) { pthread_mutex_lock(&mu); locked++; pthread_mutex_unlock(&mu); } return 0; }
static void *w_atomic(void *x) { (void)x; for (long i = 0; i < ITER; i++) __atomic_fetch_add(&atomic_ctr, 1, __ATOMIC_RELAXED); return 0; }
static void spin_lock(void) { while (__atomic_exchange_n(&spin_flag, 1, __ATOMIC_ACQUIRE)) { while (spin_flag) {} } }
static void spin_unlock(void) { __atomic_store_n(&spin_flag, 0, __ATOMIC_RELEASE); }
static void *w_spin(void *x) { (void)x; for (long i = 0; i < ITER; i++) { spin_lock(); spin_ctr++; spin_unlock(); } return 0; }
static void *w_local(void *x) { (void)x; long mine = 0; for (long i = 0; i < ITER; i++) mine++; __atomic_fetch_add(&total_local, mine, __ATOMIC_SEQ_CST); return 0; }

static double run(void *(*f)(void *)) {
    pthread_t t[T]; double s = now();
    for (int i = 0; i < T; i++) pthread_create(&t[i], 0, f, 0);
    for (int i = 0; i < T; i++) pthread_join(t[i], 0);
    return now() - s;
}
int main(void) {
    long expect = (long)T * ITER;
    double t_racy = run(w_racy), t_mutex = run(w_mutex), t_atomic = run(w_atomic), t_spin = run(w_spin), t_local = run(w_local);
    double b;
    b = t_racy;   for (int r = 0; r < 2; r++) { racy = 0; double v = run(w_racy); if (v < b) b = v; } t_racy = b;
    b = t_mutex;  for (int r = 0; r < 2; r++) { locked = 0; double v = run(w_mutex); if (v < b) b = v; } t_mutex = b;
    b = t_atomic; for (int r = 0; r < 2; r++) { atomic_ctr = 0; double v = run(w_atomic); if (v < b) b = v; } t_atomic = b;
    b = t_spin;   for (int r = 0; r < 2; r++) { spin_ctr = 0; double v = run(w_spin); if (v < b) b = v; } t_spin = b;
    b = t_local;  for (int r = 0; r < 2; r++) { total_local = 0; double v = run(w_local); if (v < b) b = v; } t_local = b;
    racy = 0; run(w_racy);
    fprintf(stderr, "без синхронизации %.3f (итог %ld из %ld, потеряно %.1f %%), мьютекс %.3f, атомарная %.3f, спинлок %.3f, локальные счётчики %.4f с\\n", t_racy, racy, expect, 100.0 * (expect - racy) / expect, t_mutex, t_atomic, t_spin, t_local);
    printf("%d потоков по %ld увеличений, ожидается %ld\\n", T, ITER, expect);
    printf("  мьютекс:              %ld (%s)\\n", locked, locked == expect ? "верно" : "ОШИБКА");
    printf("  атомарная операция:   %ld (%s)\\n", atomic_ctr, atomic_ctr == expect ? "верно" : "ОШИБКА");
    printf("  спинлок:              %ld (%s)\\n", spin_ctr, spin_ctr == expect ? "верно" : "ОШИБКА");
    printf("  локальные счётчики:   %ld (%s)\\n", total_local, total_local == expect ? "верно" : "ОШИБКА");
    printf("  без синхронизации потеряна заметная доля обновлений (больше 1 %%): %s\\n", (double)(expect - racy) / expect > 0.01 ? "да" : "нет");
    printf("локальные счётчики быстрее атомарной операции более чем в 10 раз: %s\\n", t_local * 10 < t_atomic ? "да" : "нет");
    printf("атомарная операция быстрее мьютекса: %s\\n", t_atomic < t_mutex ? "да" : "нет");
    return 0;
}`, { filename: "01-sync-cost.c", collapsed: true }),
      code("text", `4 потоков по 2000000 увеличений, ожидается 8000000
  мьютекс:              8000000 (верно)
  атомарная операция:   8000000 (верно)
  спинлок:              8000000 (верно)
  локальные счётчики:   8000000 (верно)
  без синхронизации потеряна заметная доля обновлений (больше 1 %): да
локальные счётчики быстрее атомарной операции более чем в 10 раз: да
атомарная операция быстрее мьютекса: да`, { filename: "4 потока × 2 000 000 увеличений: корректность и порядок скоростей" }),
      ul(
        "**Без синхронизации** итоговое значение оказалось на 51–74 % меньше ожидаемых 8 000 000 (в разных запусках — разное), потому что шаги «чтение — сложение — запись» перемежаются. Скрипт печатает только факт потери: точный результат не воспроизводим.",
        "**Корректные варианты** — мьютекс, атомарная операция, спинлок и локальные счётчики — дали ровно 8 000 000.",
        "Калибровочные времена: мьютекс — 0,37–0,43 с (около 50 нс на операцию), атомарная операция — 0,22–0,29 с (около 30 нс), спинлок на четырёх потоках — 1,25–1,5 с (около 175 нс), локальные счётчики (каждый поток считает у себя и добавляет итог один раз) — 0,1–0,3 мс: **в тысячи раз быстрее** общего счётчика, потому что нет разделяемого состояния.",
        "Вывод: самый дешёвый способ синхронизации — не разделять; затем — атомарные операции; затем — мьютексы; спинлоки при конкуренции на нескольких ядрах бывают хуже мьютекса.",
      ),
      h("Взаимная блокировка"),
      code("c", `#define _GNU_SOURCE
// Взаимная блокировка: два потока берут два мьютекса в разном порядке. Обнаружение по тайм-ауту и исправление порядком захвата.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <pthread.h>
#include <time.h>

static pthread_mutex_t A = PTHREAD_MUTEX_INITIALIZER, B = PTHREAD_MUTEX_INITIALIZER;
static pthread_barrier_t bar, bar2;
static int timed_out[2], finished[2];

static int lock_timed(pthread_mutex_t *m, int ms) {
    struct timespec t; clock_gettime(CLOCK_REALTIME, &t);
    t.tv_nsec += ms * 1000000L; t.tv_sec += t.tv_nsec / 1000000000L; t.tv_nsec %= 1000000000L;
    return pthread_mutex_timedlock(m, &t);
}
// вариант 1: потоки берут замки в разном порядке (A,B) и (B,A) — после барьера оба держат первый замок
static void *worker_bad(void *arg) {
    int id = (int)(long)arg;
    pthread_mutex_t *first = id == 0 ? &A : &B, *second = id == 0 ? &B : &A;
    pthread_mutex_lock(first);
    pthread_barrier_wait(&bar);                         // оба потока уже удерживают по замку
    if (lock_timed(second, 300) == ETIMEDOUT) {
        timed_out[id] = 1;
        pthread_barrier_wait(&bar2);                    // не отпускаем замок, пока и второй поток не зафиксировал тайм-аут
        pthread_mutex_unlock(first); return 0;
    }
    finished[id] = 1;
    pthread_mutex_unlock(second); pthread_mutex_unlock(first);
    return 0;
}
// вариант 2: единый порядок захвата (сначала A, затем B) — взаимная блокировка невозможна
static void *worker_ordered(void *arg) {
    int id = (int)(long)arg;
    pthread_barrier_wait(&bar);
    pthread_mutex_lock(&A); pthread_mutex_lock(&B);     // и у второго потока тот же порядок
    finished[id] = 1;
    pthread_mutex_unlock(&B); pthread_mutex_unlock(&A);
    return 0;
}
// вариант 3: trylock с откатом — потоки сами освобождают первый замок, если второй занят
static int backoffs;
static void *worker_trylock(void *arg) {
    int id = (int)(long)arg;
    pthread_mutex_t *first = id == 0 ? &A : &B, *second = id == 0 ? &B : &A;
    pthread_barrier_wait(&bar);
    for (;;) {
        pthread_mutex_lock(first);
        if (pthread_mutex_trylock(second) == 0) break;
        pthread_mutex_unlock(first);                    // откат: отпускаем и пробуем снова
        __atomic_fetch_add(&backoffs, 1, __ATOMIC_RELAXED);
        struct timespec ts = { 0, (id + 1) * 100000L }; nanosleep(&ts, 0);   // разная пауза разводит потоки
    }
    finished[id] = 1;
    pthread_mutex_unlock(second); pthread_mutex_unlock(first);
    return 0;
}
int main(void) {
    pthread_t t[2];
    pthread_barrier_init(&bar, 0, 2); pthread_barrier_init(&bar2, 0, 2);
    for (long i = 0; i < 2; i++) pthread_create(&t[i], 0, worker_bad, (void *)i);
    for (int i = 0; i < 2; i++) pthread_join(t[i], 0);
    printf("1) замки в разном порядке: поток 0 — %s, поток 1 — %s\\n", timed_out[0] ? "тайм-аут (взаимная блокировка)" : "завершён", timed_out[1] ? "тайм-аут (взаимная блокировка)" : "завершён");
    printf("   оба потока не смогли взять второй замок: %s\\n", (timed_out[0] && timed_out[1]) ? "да" : "нет");

    memset(finished, 0, sizeof finished);
    pthread_barrier_destroy(&bar); pthread_barrier_init(&bar, 0, 2);
    for (long i = 0; i < 2; i++) pthread_create(&t[i], 0, worker_ordered, (void *)i);
    for (int i = 0; i < 2; i++) pthread_join(t[i], 0);
    printf("2) единый порядок захвата (A, затем B): завершились оба потока: %s\\n", (finished[0] && finished[1]) ? "да" : "нет");

    memset(finished, 0, sizeof finished);
    pthread_barrier_destroy(&bar); pthread_barrier_init(&bar, 0, 2);
    for (long i = 0; i < 2; i++) pthread_create(&t[i], 0, worker_trylock, (void *)i);
    for (int i = 0; i < 2; i++) pthread_join(t[i], 0);
    printf("3) trylock с откатом (разный порядок, но без ожидания «с замком в руках»): завершились оба потока: %s\\n", (finished[0] && finished[1]) ? "да" : "нет");
    return 0;
}`, { filename: "02-deadlock.c", collapsed: true }),
      code("text", `1) замки в разном порядке: поток 0 — тайм-аут (взаимная блокировка), поток 1 — тайм-аут (взаимная блокировка)
   оба потока не смогли взять второй замок: да
2) единый порядок захвата (A, затем B): завершились оба потока: да
3) trylock с откатом (разный порядок, но без ожидания «с замком в руках»): завершились оба потока: да`, { filename: "два замка в разном порядке и два способа избежать блокировки" }),
      ul(
        "Поток 0 берёт `A`, затем `B`; поток 1 — `B`, затем `A`. Барьер гарантирует, что оба уже держат первый замок: **оба ждут вечно**. Мы обнаруживаем это по тайм-ауту (`pthread_mutex_timedlock`, 300 мс) и держим замки, пока оба потока не зафиксируют ситуацию.",
        "**Единый порядок захвата** (всегда `A`, затем `B`) делает циклическое ожидание невозможным: оба потока завершились.",
        "**`trylock` с откатом:** если второй замок занят, поток отпускает первый и пробует снова после паузы (разной у разных потоков). Он не держит ресурс «в руках» во время ожидания.",
      ),
    ]),

    section("detailed-example", [
      h("Ограниченная очередь: производитель и потребитель"),
      code("c", `#define _POSIX_C_SOURCE 200809L
// Ограниченная очередь (producer–consumer) на мьютексе и двух условных переменных.
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#define CAP 8                    // ёмкость буфера
#define ITEMS 200000             // число элементов
#define PRODUCERS 2
#define CONSUMERS 3
static int buf[CAP], head, tail, count;
static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t not_full = PTHREAD_COND_INITIALIZER, not_empty = PTHREAD_COND_INITIALIZER;
static int producers_done;
static long max_count;
static long long sums[CONSUMERS]; static long taken[CONSUMERS];

static void put(int v) {
    pthread_mutex_lock(&mu);
    while (count == CAP) pthread_cond_wait(&not_full, &mu);      // while, а не if: пробуждение может быть ложным
    buf[tail] = v; tail = (tail + 1) % CAP; count++;
    if (count > max_count) max_count = count;
    pthread_cond_signal(&not_empty);
    pthread_mutex_unlock(&mu);
}
static int get(int *v) {
    pthread_mutex_lock(&mu);
    while (count == 0) {
        if (producers_done == PRODUCERS) { pthread_mutex_unlock(&mu); return 0; }
        pthread_cond_wait(&not_empty, &mu);
    }
    *v = buf[head]; head = (head + 1) % CAP; count--;
    pthread_cond_signal(&not_full);
    pthread_mutex_unlock(&mu);
    return 1;
}
static void *producer(void *arg) {
    long id = (long)arg;
    for (int i = 0; i < ITEMS; i++) put((int)(id * ITEMS + i));  // уникальные значения
    pthread_mutex_lock(&mu); producers_done++; pthread_cond_broadcast(&not_empty); pthread_mutex_unlock(&mu);
    return 0;
}
static void *consumer(void *arg) {
    long id = (long)arg; int v;
    while (get(&v)) { sums[id] += v; taken[id]++; }
    return 0;
}
int main(void) {
    pthread_t p[PRODUCERS], c[CONSUMERS];
    for (long i = 0; i < CONSUMERS; i++) pthread_create(&c[i], 0, consumer, (void *)i);
    for (long i = 0; i < PRODUCERS; i++) pthread_create(&p[i], 0, producer, (void *)i);
    for (int i = 0; i < PRODUCERS; i++) pthread_join(p[i], 0);
    for (int i = 0; i < CONSUMERS; i++) pthread_join(c[i], 0);
    long long total = 0, n = 0, expect = 0;
    for (int i = 0; i < CONSUMERS; i++) { total += sums[i]; n += taken[i]; }
    for (long id = 0; id < PRODUCERS; id++) for (int i = 0; i < ITEMS; i++) expect += id * ITEMS + i;
    printf("производителей %d, потребителей %d, ёмкость буфера %d, элементов от каждого производителя %d\\n", PRODUCERS, CONSUMERS, CAP, ITEMS);
    printf("получено элементов: %lld из %d (ни один не потерян и не получен дважды: %s)\\n", n, PRODUCERS * ITEMS, n == (long long)PRODUCERS * ITEMS ? "да" : "нет");
    printf("сумма значений совпала с ожидаемой %lld: %s\\n", expect, total == expect ? "да" : "нет");
    printf("буфер никогда не превышал ёмкость (макс. заполнение ≤ %d): %s\\n", CAP, max_count <= CAP ? "да" : "нет");
    printf("каждый потребитель получил хотя бы по одному элементу: %s\\n", (taken[0] > 0 && taken[1] > 0 && taken[2] > 0) ? "да" : "нет");
    return 0;
}`, { filename: "03-producer-consumer.c", collapsed: true }),
      code("text", `производителей 2, потребителей 3, ёмкость буфера 8, элементов от каждого производителя 200000
получено элементов: 400000 из 400000 (ни один не потерян и не получен дважды: да)
сумма значений совпала с ожидаемой 79999800000: да
буфер никогда не превышал ёмкость (макс. заполнение ≤ 8): да
каждый потребитель получил хотя бы по одному элементу: да`, { filename: "2 производителя, 3 потребителя, буфер на 8 элементов" }),
      ul(
        "Один мьютекс защищает буфер; две условные переменные сообщают «есть место» и «есть элемент». Ожидание всегда в цикле `while`, так как пробуждение может быть ложным или другой поток успеет забрать элемент первым.",
        "Получено ровно 400 000 элементов из 400 000, сумма значений совпала с ожидаемой `79 999 800 000`, ёмкость буфера не превышалась, все три потребителя участвовали. Завершение: счётчик завершённых производителей и `broadcast`, чтобы потребители вышли из ожидания.",
      ),
      h("Модель памяти: почему «невозможный» результат возможен"),
      code("c", `#define _GNU_SOURCE
// Модель памяти: тест «буфер записи» (store buffering). Может ли быть r1 = 0 и r2 = 0 одновременно?
//   поток A: x = 1; r1 = y;        поток B: y = 1; r2 = x;
// При последовательной согласованности (каждое чтение видит все прежние записи в едином порядке) исход (0, 0) невозможен.
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <sched.h>

#define N 2000000
static volatile int x_, y_;                              // общие переменные
static int sense_count; static int sense;                // барьер с инверсией смысла на двух потоках
static int r1_, r2_;
static int MODE;                                         // 0 — relaxed, 1 — seq_cst
static long both_zero;

static void barrier(int *local) {
    *local = !*local;
    if (__atomic_add_fetch(&sense_count, 1, __ATOMIC_SEQ_CST) == 2) { sense_count = 0; __atomic_store_n(&sense, *local, __ATOMIC_SEQ_CST); }
    else while (__atomic_load_n(&sense, __ATOMIC_SEQ_CST) != *local) {}
}
static void *thread_a(void *arg) {
    (void)arg; int loc = 0;
    cpu_set_t s; CPU_ZERO(&s); CPU_SET(0, &s); sched_setaffinity(0, sizeof s, &s);
    for (int i = 0; i < N; i++) {
        barrier(&loc);
        if (MODE == 0) { __atomic_store_n(&x_, 1, __ATOMIC_RELAXED); r1_ = __atomic_load_n(&y_, __ATOMIC_RELAXED); }
        else           { __atomic_store_n(&x_, 1, __ATOMIC_SEQ_CST); r1_ = __atomic_load_n(&y_, __ATOMIC_SEQ_CST); }
        barrier(&loc);
        if (r1_ == 0 && r2_ == 0) both_zero++;
        x_ = 0; y_ = 0;
        barrier(&loc);
    }
    return 0;
}
static void *thread_b(void *arg) {
    (void)arg; int loc = 0;
    cpu_set_t s; CPU_ZERO(&s); CPU_SET(1, &s); sched_setaffinity(0, sizeof s, &s);
    for (int i = 0; i < N; i++) {
        barrier(&loc);
        if (MODE == 0) { __atomic_store_n(&y_, 1, __ATOMIC_RELAXED); r2_ = __atomic_load_n(&x_, __ATOMIC_RELAXED); }
        else           { __atomic_store_n(&y_, 1, __ATOMIC_SEQ_CST); r2_ = __atomic_load_n(&x_, __ATOMIC_SEQ_CST); }
        barrier(&loc);
        barrier(&loc);
    }
    return 0;
}
static long run(int mode) {
    MODE = mode; both_zero = 0; x_ = y_ = 0; sense_count = 0; sense = 0;
    pthread_t a, b; pthread_create(&a, 0, thread_a, 0); pthread_create(&b, 0, thread_b, 0);
    pthread_join(a, 0); pthread_join(b, 0);
    return both_zero;
}
int main(void) {
    long relaxed = run(0), seqcst = run(1);
    fprintf(stderr, "relaxed: исход (0,0) в %ld из %d испытаний; seq_cst: %ld\\n", relaxed, N, seqcst);
    printf("%d испытаний на двух ядрах\\n", N);
    printf("с relaxed-операциями исход (r1 = 0, r2 = 0) наблюдался хотя бы раз: %s\\n", relaxed > 0 ? "да" : "нет");
    printf("с seq_cst-операциями исход (r1 = 0, r2 = 0) не наблюдался ни разу: %s\\n", seqcst == 0 ? "да" : "нет");
    return 0;
}`, { filename: "08-memory-order.c", collapsed: true }),
      code("text", `2000000 испытаний на двух ядрах
с relaxed-операциями исход (r1 = 0, r2 = 0) наблюдался хотя бы раз: да
с seq_cst-операциями исход (r1 = 0, r2 = 0) не наблюдался ни разу: да`, { filename: "тест «буфер записи» на двух ядрах" }),
      ul(
        "Поток A делает `x = 1; r1 = y`, поток B — `y = 1; r2 = x`. Если бы все операции происходили в одном общем порядке, хотя бы один поток увидел бы запись другого: исход `r1 = r2 = 0` невозможен.",
        "С `relaxed`-операциями он наблюдался в 96–106 тысячах из 2 000 000 испытаний (около 5 %): процессор откладывает запись в буфере записи и выполняет чтение раньше — и компилятор, и процессор вправе переставлять независимые операции. С `seq_cst` — ни разу: добавляется барьер между записью и чтением.",
        "Вывод: правильность многопоточного кода нельзя проверять «на глаз по порядку строк». Нужны синхронизирующие операции (замки, `acquire/release`, `seq_cst`), задающие отношение «происходит до».",
      ),
      h("Конкурентность без потоков: гонки между `await`"),
      code("js", `// Конкурентность без потоков: гонки между await в одном потоке и их исправление очередью (мьютекс на промисах)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. «проверить — потом действовать» через await: два параллельных списания
let balance = 100;
async function withdrawBad(amount) {
  if (balance >= amount) {           // проверка
    await sleep(5);                  // здесь управление уходит другим задачам (запрос к базе, сети)
    balance -= amount;               // действие по устаревшей проверке
    return true;
  }
  return false;
}
const r1 = await Promise.all([withdrawBad(80), withdrawBad(80)]);
console.log("без синхронизации: результаты", JSON.stringify(r1), " баланс", balance, "(ушёл в минус:", balance < 0 ? "да" : "нет", ")");

// 2. мьютекс на цепочке промисов
class Mutex {
  #tail = Promise.resolve();
  run(fn) {
    const result = this.#tail.then(fn, fn);
    this.#tail = result.then(() => {}, () => {});
    return result;
  }
}
balance = 100;
const mu = new Mutex();
const withdrawGood = (amount) => mu.run(async () => {
  if (balance >= amount) { await sleep(5); balance -= amount; return true; }
  return false;
});
const r2 = await Promise.all([withdrawGood(80), withdrawGood(80)]);
console.log("с мьютексом:        результаты", JSON.stringify(r2), " баланс", balance, "(не отрицателен:", balance >= 0 ? "да" : "нет", ")");

// 3. порядок выполнения: синхронный код, nextTick, микрозадачи, таймеры, setImmediate
const order = [];
setTimeout(() => order.push("setTimeout 0"), 0);
setImmediate(() => order.push("setImmediate"));
Promise.resolve().then(() => order.push("promise.then"));
process.nextTick(() => order.push("nextTick"));
queueMicrotask(() => order.push("queueMicrotask"));
order.push("синхронный код");
await sleep(20);
console.log("\\nпорядок:", order.join(" → "));

// 4. один поток: долгое вычисление задерживает всё остальное
const t0 = performance.now(); let fired = null;
setTimeout(() => (fired = performance.now() - t0), 10);
const end = performance.now() + 100; while (performance.now() < end) {}   // 100 мс занимаем единственный поток
await sleep(30);
console.log("таймер на 10 мс сработал не раньше чем через 100 мс (поток был занят):", fired >= 100 ? "да" : "нет");

// 5. параллельность ввода-вывода: 5 ожиданий по 50 мс
const s = performance.now();
await Promise.all(Array.from({ length: 5 }, () => sleep(50)));
const par = performance.now() - s;
const s2 = performance.now();
for (let i = 0; i < 5; i++) await sleep(50);
const seq = performance.now() - s2;
console.log("5 ожиданий по 50 мс: Promise.all быстрее последовательных await более чем в 3 раза:", seq > 3 * par ? "да" : "нет");

// 6. неперехваченное исключение в «забытом» промисе
let seen = null;
process.once("unhandledRejection", (e) => (seen = e.message));
(async () => { throw new Error("потерянная ошибка"); })();
await sleep(10);
console.log("забытый промис без catch породил unhandledRejection с сообщением «" + seen + "»");`, { filename: "07-async-races.mjs", collapsed: true }),
      code("text", `без синхронизации: результаты [true,true]  баланс -60 (ушёл в минус: да )
с мьютексом:        результаты [true,false]  баланс 20 (не отрицателен: да )

порядок: синхронный код → promise.then → queueMicrotask → nextTick → setImmediate → setTimeout 0
таймер на 10 мс сработал не раньше чем через 100 мс (поток был занят): да
5 ожиданий по 50 мс: Promise.all быстрее последовательных await более чем в 3 раза: да
забытый промис без catch породил unhandledRejection с сообщением «потерянная ошибка»`, { filename: "Node.js: гонка между await, мьютекс на промисах, порядок задач" }),
      ul(
        "Даже в одном потоке возможна гонка: между проверкой `balance >= amount` и вычитанием стоит `await`, и другая задача успевает списать деньги. Результат `[true, true]` и баланс `−60` — классическая ошибка «проверить, потом действовать».",
        "Исправление — сериализовать критическую секцию очередью промисов («мьютекс»): вторая операция увидела уже изменённый баланс и вернула `false`, итог `20`.",
        "Порядок в данном запуске: синхронный код → `promise.then` → `queueMicrotask` → `nextTick` → `setImmediate` → `setTimeout 0`. Порядок `nextTick`/микрозадач и `setImmediate`/таймера зависит от контекста запуска (здесь код выполняется после `await` внутри обработчика таймера), поэтому полагаться на него нельзя; подробнее — [цикл событий](/learn/js/event-loop).",
        "Долгое вычисление блокирует единственный поток: таймер на 10 мс сработал не раньше чем через 100 мс. `Promise.all` по пяти ожиданиям — одновременное ожидание, быстрее последовательных `await` более чем в 3 раза. Забытый промис без `catch` порождает `unhandledRejection`.",
      ),
    ]),

    section("analysis", [
      h("Планирование процессора: симулятор"),
      code("js", `// Симулятор планировщика процессора: FCFS, SJF, SRTF, Round Robin. Время — в условных единицах (тиках).
function simulate(procs, policy, quantum = 0) {
  const P = procs.map((p, i) => ({ ...p, id: i, left: p.burst, start: -1, finish: -1 }));
  let t = 0, done = 0, switches = 0, last = -1;
  const timeline = [];
  const ready = [];                        // для RR — очередь; для остальных — просто множество
  const arrived = new Set();
  const admit = () => { for (const p of P) if (p.arrival <= t && !arrived.has(p.id)) { arrived.add(p.id); ready.push(p); } };
  admit();
  while (done < P.length) {
    if (ready.length === 0) { t++; admit(); continue; }
    let cur, slice;
    if (policy === "FCFS") { cur = ready.shift(); slice = cur.left; }
    else if (policy === "SJF") { ready.sort((a, b) => a.left - b.left || a.id - b.id); cur = ready.shift(); slice = cur.left; }
    else if (policy === "SRTF") { ready.sort((a, b) => a.left - b.left || a.id - b.id); cur = ready.shift(); slice = 1; }
    else if (policy === "RR") { cur = ready.shift(); slice = Math.min(quantum, cur.left); }
    if (cur.start < 0) cur.start = t;
    if (last !== cur.id) { if (last !== -1) switches++; last = cur.id; }
    for (let k = 0; k < slice; k++) { t++; cur.left--; timeline.push(cur.id); admit(); }
    if (cur.left === 0) { cur.finish = t; done++; } else ready.push(cur);
  }
  const n = P.length;
  const avg = (f) => (P.reduce((s, p) => s + f(p), 0) / n);
  return { P, timeline, switches, wait: avg((p) => p.finish - p.arrival - p.burst), turn: avg((p) => p.finish - p.arrival), resp: avg((p) => p.start - p.arrival) };
}
const gantt = (tl) => { const out = []; for (const id of tl) { const s = "P" + (id + 1); if (out.length && out.at(-1)[0] === s) out.at(-1)[1]++; else out.push([s, 1]); } return out.map(([s, k]) => s + "×" + k).join(" "); };

const set = [{ arrival: 0, burst: 8 }, { arrival: 1, burst: 4 }, { arrival: 2, burst: 9 }, { arrival: 3, burst: 5 }];
console.log("процессы (приход, длительность): P1 (0, 8)  P2 (1, 4)  P3 (2, 9)  P4 (3, 5)");
console.log("политика        ср. ожидание  ср. оборот  ср. отклик  переключений");
for (const [name, pol, q] of [["FCFS", "FCFS"], ["SJF", "SJF"], ["SRTF", "SRTF"], ["RR q=2", "RR", 2], ["RR q=4", "RR", 4], ["RR q=8", "RR", 8]]) {
  const r = simulate(set, pol, q);
  console.log(name.padEnd(14), r.wait.toFixed(2).padStart(11), r.turn.toFixed(2).padStart(11), r.resp.toFixed(2).padStart(11), String(r.switches).padStart(11));
}
console.log("\\nдиаграмма FCFS:", gantt(simulate(set, "FCFS").timeline));
console.log("диаграмма SRTF:", gantt(simulate(set, "SRTF").timeline));
console.log("диаграмма RR q=4:", gantt(simulate(set, "RR", 4).timeline));

// эффект конвоя: длинная задача пришла первой, затем 9 коротких
const convoy = [{ arrival: 0, burst: 100 }, ...Array.from({ length: 9 }, (_, i) => ({ arrival: 1 + i, burst: 2 }))];
console.log("\\nэффект конвоя: P1 (0, 100) и девять коротких по 2 тика");
for (const [name, pol, q] of [["FCFS", "FCFS"], ["SJF", "SJF"], ["RR q=4", "RR", 4]]) {
  const r = simulate(convoy, pol, q);
  console.log(name.padEnd(8), "среднее ожидание", r.wait.toFixed(2).padStart(7), " средний отклик", r.resp.toFixed(2).padStart(7), " ожидание коротких (среднее):", (r.P.slice(1).reduce((s, p) => s + (p.finish - p.arrival - p.burst), 0) / 9).toFixed(2));
}
// голодание при SRTF: длинная задача и непрерывный поток коротких
const stream = [{ arrival: 0, burst: 20 }, ...Array.from({ length: 40 }, (_, i) => ({ arrival: i, burst: 1 }))];
const sr = simulate(stream, "SRTF"), rr = simulate(stream, "RR", 2);
const progress = (r, t) => r.timeline.slice(0, t).filter((x) => x === 0).length;
console.log("\\nпоток из 40 задач по 1 тику (по одной на тик) и одна длинная (20 тиков, пришла в момент 0):");
console.log("  SRTF: к моменту 40 длинная задача выполнена на", progress(sr, 40), "из 20 тиков; первый запуск в момент", sr.P[0].start);
console.log("  RR q=2: к моменту 40 длинная задача выполнена на", progress(rr, 40), "из 20 тиков; первый запуск в момент", rr.P[0].start);
console.log("  общее время работы одинаково (политика не меняет суммарную работу):", sr.timeline.length, "тиков;", "короткие при SRTF в среднем ждали", (sr.P.slice(1).reduce((s, p) => s + (p.finish - p.arrival - p.burst), 0) / 40).toFixed(2), "тиков, при RR q=2 —", (rr.P.slice(1).reduce((s, p) => s + (p.finish - p.arrival - p.burst), 0) / 40).toFixed(2));`, { filename: "04-scheduler-sim.mjs", collapsed: true }),
      code("text", `процессы (приход, длительность): P1 (0, 8)  P2 (1, 4)  P3 (2, 9)  P4 (3, 5)
политика        ср. ожидание  ср. оборот  ср. отклик  переключений
FCFS                  8.75       15.25        8.75           3
SJF                   7.75       14.25        7.75           3
SRTF                  6.50       13.00        4.25           4
RR q=2               12.75       19.25        2.00          12
RR q=4               11.75       18.25        4.50           7
RR q=8                9.75       16.25        8.50           4

диаграмма FCFS: P1×8 P2×4 P3×9 P4×5
диаграмма SRTF: P1×1 P2×4 P4×5 P1×7 P3×9
диаграмма RR q=4: P1×4 P2×4 P3×4 P4×4 P1×4 P3×4 P4×1 P3×1

эффект конвоя: P1 (0, 100) и девять коротких по 2 тика
FCFS     среднее ожидание   92.70  средний отклик   92.70  ожидание коротких (среднее): 103.00
SJF      среднее ожидание   92.70  средний отклик   92.70  ожидание коротких (среднее): 103.00
RR q=4   среднее ожидание   10.10  средний отклик    8.30  ожидание коротких (среднее): 9.22

поток из 40 задач по 1 тику (по одной на тик) и одна длинная (20 тиков, пришла в момент 0):
  SRTF: к моменту 40 длинная задача выполнена на 0 из 20 тиков; первый запуск в момент 40
  RR q=2: к моменту 40 длинная задача выполнена на 10 из 20 тиков; первый запуск в момент 0
  общее время работы одинаково (политика не меняет суммарную работу): 60 тиков; короткие при SRTF в среднем ждали 0.00 тиков, при RR q=2 — 7.75`, { filename: "FCFS, SJF, SRTF, Round Robin; эффект конвоя и голодание" }),
      ul(
        "Для P1 (0, 8), P2 (1, 4), P3 (2, 9), P4 (3, 5) среднее время ожидания: FCFS — 8,75, SJF — 7,75, SRTF — 6,50 (оптимум), Round Robin при кванте 2 — 12,75, при 4 — 11,75, при 8 — 9,75.",
        "Зато средний **отклик** (время до первого запуска): FCFS — 8,75, SRTF — 4,25, Round Robin с квантом 2 — 2,00. Короткий квант улучшает интерактивность ценой роста числа переключений (12 при `q = 2` против 3 у FCFS) и общего ожидания: компромисс.",
        "**Эффект конвоя:** длинная задача (100 тиков) пришла первой, затем девять коротких по 2 тика. При FCFS и даже при несрочном SJF короткие ждут в среднем 103 тика, среднее ожидание 92,70; Round Robin с квантом 4 — 10,10 (короткие ждут 9,22).",
        "**Голодание:** при непрерывном потоке коротких задач (по одной на тик) SRTF не запускает длинную до момента 40 — к этому времени она выполнена на 0 тиков из 20; Round Robin уже выполнил её на 10 тиков. Суммарная работа одна и та же — 60 тиков, различается, кто и когда её получает.",
      ),
      h("Приоритеты в Linux: nice"),
      code("c", `#define _GNU_SOURCE
// Планировщик Linux (CFS/EEVDF): доля процессорного времени двух процессов на одном ядре при равных и разных приоритетах (nice).
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sched.h>
#include <time.h>
#include <sys/resource.h>
#include <sys/wait.h>

static double now(void) { struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t); return t.tv_sec + t.tv_nsec * 1e-9; }
static unsigned long spin(double seconds) {
    unsigned long n = 0; double end = now() + seconds;
    for (;;) { for (int i = 0; i < 100000; i++) n++; if (now() >= end) break; }
    return n;
}
static void run_pair(int nice_a, int nice_b, unsigned long *ra, unsigned long *rb) {
    int pa[2], pb[2]; if (pipe(pa) || pipe(pb)) exit(1);
    int nices[2] = { nice_a, nice_b }; int *pp[2] = { pa, pb };
    pid_t kids[2];
    for (int k = 0; k < 2; k++) {
        kids[k] = fork();
        if (kids[k] == 0) {
            cpu_set_t set; CPU_ZERO(&set); CPU_SET(0, &set); sched_setaffinity(0, sizeof set, &set);   // оба — на ядро 0
            setpriority(PRIO_PROCESS, 0, nices[k]);
            unsigned long n = spin(2.0);
            if (write(pp[k][1], &n, sizeof n) != sizeof n) _exit(1);
            _exit(0);
        }
    }
    if (read(pa[0], ra, sizeof *ra) != sizeof *ra || read(pb[0], rb, sizeof *rb) != sizeof *rb) exit(1);
    waitpid(kids[0], 0, 0); waitpid(kids[1], 0, 0);
}
int main(void) {
    unsigned long a, b;
    run_pair(0, 0, &a, &b);
    double r1 = (double)a / b;
    fprintf(stderr, "nice 0 и 0: счётчики %lu и %lu, отношение %.2f\\n", a, b, r1);
    printf("два процесса с одинаковым приоритетом на одном ядре получили почти равную долю (отношение от 0,7 до 1,4): %s\\n", (r1 > 0.7 && r1 < 1.4) ? "да" : "нет");
    run_pair(0, 10, &a, &b);
    double r2 = (double)a / b;
    fprintf(stderr, "nice 0 и 10: счётчики %lu и %lu, отношение %.2f\\n", a, b, r2);
    printf("процесс с nice 0 получил более чем в 4 раза больше процессорного времени, чем процесс с nice 10: %s\\n", r2 > 4 ? "да" : "нет");
    printf("процесс с nice 10 всё же не «умер от голода»: ему досталось больше 3 %% работы: %s\\n", ((double)b / (a + b)) > 0.03 ? "да" : "нет");
    return 0;
}`, { filename: "05-nice.c", collapsed: true }),
      code("text", `два процесса с одинаковым приоритетом на одном ядре получили почти равную долю (отношение от 0,7 до 1,4): да
процесс с nice 0 получил более чем в 4 раза больше процессорного времени, чем процесс с nice 10: да
процесс с nice 10 всё же не «умер от голода»: ему досталось больше 3 % работы: да`, { filename: "два процесса на одном ядре: равные и разные приоритеты" }),
      ul(
        "Оба процесса привязаны к одному ядру и 2 секунды выполняют счётный цикл. При одинаковом `nice` доли отличались на 1 % (отношение 0,99). При `nice 0` и `nice 10` отношение счётчиков 9,07: первый получил около 90 % процессорного времени, второй — около 10 % (по весам планировщика Linux ≈ 1024 и 110).",
        "Процесс с низким приоритетом не «умирает от голода»: ему достаётся доля, пропорциональная весу, — в этом отличие справедливого планировщика от строгих приоритетов.",
      ),
      h("Очереди: почему высокая загрузка опасна"),
      code("js", `// Очередь с одним обработчиком (M/M/1): задержка растёт нелинейно с загрузкой. Детерминированный генератор sfc32.
function sfc32(a, b, c, d) {
  return () => { a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; let t = (a + b) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0; return (t >>> 0) / 4294967296; };
}
const rnd = sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, 42);
for (let i = 0; i < 20; i++) rnd();
const exp = (rate) => -Math.log(1 - rnd()) / rate;

function simulate(lambda, mu, n) {
  let arrival = 0, free = 0, sumWait = 0, sumSys = 0, maxSys = 0, busy = 0;
  const sys = [];
  for (let i = 0; i < n; i++) {
    arrival += exp(lambda);
    const service = exp(mu);
    const start = Math.max(arrival, free);
    free = start + service; busy += service;
    const wait = start - arrival;
    sumWait += wait; sumSys += wait + service; sys.push(wait + service);
  }
  sys.sort((a, b) => a - b);
  return { wait: sumWait / n, sys: sumSys / n, p99: sys[Math.floor(0.99 * n)], util: busy / free };
}
const mu = 1, N = 400000;
console.log("обработчик производительностью μ = 1 запрос/с, пуассоновский поток заявок λ, " + N + " заявок");
console.log("загрузка ρ=λ/μ   среднее время в системе (с)   по формуле 1/(μ−λ)   p99 (с)   среднее ожидание в очереди (с)");
for (const rho of [0.5, 0.7, 0.8, 0.9, 0.95, 0.99]) {
  const r = simulate(rho * mu, mu, N);
  console.log(String(rho).padEnd(14), r.sys.toFixed(2).padStart(18), (1 / (mu - rho * mu)).toFixed(2).padStart(26), r.p99.toFixed(1).padStart(10), r.wait.toFixed(2).padStart(24));
}
// закон Литтла: среднее число в системе L = λ·W
const rho = 0.8, r = simulate(rho, mu, N);
console.log("\\nзакон Литтла L = λ·W при ρ = 0.8: λ·W =", (rho * r.sys).toFixed(2), "; для M/M/1 теоретическое L = ρ/(1−ρ) =", (rho / (1 - rho)).toFixed(2));
// два обработчика с общей очередью против двух раздельных очередей при той же суммарной нагрузке
function twoServers(lambda, mu, n, shared) {
  let arrival = 0; const free = [0, 0]; let sum = 0;
  for (let i = 0; i < n; i++) {
    arrival += exp(lambda);
    const service = exp(mu);
    const k = shared ? (free[0] <= free[1] ? 0 : 1) : (rnd() < 0.5 ? 0 : 1);
    const start = Math.max(arrival, free[k]);
    free[k] = start + service; sum += start + service - arrival;
  }
  return sum / n;
}
console.log("\\nдва обработчика (μ = 1 каждый), суммарная нагрузка λ = 1.8 (ρ = 0.9 на обработчик):");
console.log("  общая очередь:               среднее время в системе", twoServers(1.8, 1, N, true).toFixed(2), "с");
console.log("  случайное распределение:     среднее время в системе", twoServers(1.8, 1, N, false).toFixed(2), "с");`, { filename: "06-queue-sim.mjs", collapsed: true }),
      code("text", `обработчик производительностью μ = 1 запрос/с, пуассоновский поток заявок λ, 400000 заявок
загрузка ρ=λ/μ   среднее время в системе (с)   по формуле 1/(μ−λ)   p99 (с)   среднее ожидание в очереди (с)
0.5                          2.01                       2.00        9.2                     1.00
0.7                          3.35                       3.33       15.4                     2.35
0.8                          4.97                       5.00       23.1                     3.97
0.9                          9.94                      10.00       44.9                     8.94
0.95                        19.83                      20.00       83.7                    18.83
0.99                        60.83                     100.00      244.6                    59.83

закон Литтла L = λ·W при ρ = 0.8: λ·W = 4.02 ; для M/M/1 теоретическое L = ρ/(1−ρ) = 4.00

два обработчика (μ = 1 каждый), суммарная нагрузка λ = 1.8 (ρ = 0.9 на обработчик):
  общая очередь:               среднее время в системе 5.22 с
  случайное распределение:     среднее время в системе 9.92 с`, { filename: "обработчик с μ = 1 запрос/с, 400 000 заявок" }),
      ul(
        "Среднее время в системе совпало с формулой `1/(μ − λ)`: 2,01 с против 2,00 при ρ = 0,5; 4,97 против 5,00 при 0,8; 9,94 против 10,00 при 0,9; 19,83 против 20,00 при 0,95. При ρ = 0,99 формула даёт 100 с, а симуляция из 400 000 заявок — 60,8: система не успевает выйти на установившийся режим; хвост p99 — 245 с.",
        "Нагрузка 80 → 90 → 95 % увеличивает время ответа в 2 и затем ещё в 2 раза: график — «хоккейная клюшка». Правило практики: держать расчётную загрузку заметно ниже 100 % (обычно 60–70 % на пике).",
        "Закон Литтла подтверждён: при ρ = 0,8 произведение `λ·W` равно 4,02 (теория `ρ/(1−ρ) = 4,00`).",
        "**Общая очередь против раздельных:** два обработчика, суммарная нагрузка 1,8: общая очередь — 5,22 с, случайное разделение по двум очередям — 9,92 с (почти вдвое хуже): одна очередь не оставляет обработчика простаивающим, когда у соседа есть работа.",
      ),
    ]),

    section("internals", [
      h("Как реализованы замки и планирование"),
      ul(
        "**Атомарные операции** опираются на инструкции процессора (`lock xadd`, `cmpxchg`) и протокол согласования кешей: ядро получает строку кеша в исключительное владение. Поэтому при конкуренции за одну строку атомарные операции дорогие (≈ 30 нс в замере), а «ложное разделение» — см. тему про [кеш и память](/learn/cs/cpu-memory-cache).",
        "**Мьютекс** в Linux (`futex`) сначала пробует захватить замок атомарной операцией в пользовательском режиме; ядро подключается только если нужно ждать — поэтому неконкурирующий мьютекс почти бесплатен.",
        "**Спинлок** крутится в цикле без сна: полезен, когда критическая секция короче переключения контекста; при большем числе потоков, чем ядер, тратит время впустую.",
        "**Планировщик Linux** распределяет процессорное время пропорционально весам, зависящим от `nice` (в замере 9:1 при разнице 10), и хранит очереди по ядрам с балансировкой между ними.",
        "**Вытесняющая многозадачность:** по прерыванию таймера ядро может отобрать процессор у задачи; кооперативная модель (асинхронный JavaScript) требует, чтобы задача сама возвращала управление — долгое вычисление блокирует всех.",
      ),
      h("Инверсия приоритетов"),
      p("Если задача низкого приоритета держит замок, а задача высокого приоритета его ждёт, то задача среднего приоритета, не нуждающаяся в замке, может вытеснять низкую, и высокая ждёт неопределённо долго. Лекарства: наследование приоритета (владелец замка временно получает приоритет ждущего), потолок приоритета, отказ от замков в критических задачах. Известный случай — сбои программы марсохода Pathfinder в 1997 году, исправленные включением наследования приоритетов."),
      h("Модели ограничения общего доступа"),
      table(
        ["Модель", "Идея", "Пример"],
        [
          ["Общая память + замки", "Все видят данные, доступ по очереди", "C, Java, Rust (Mutex)"],
          ["Передача сообщений", "Данные передаются, не разделяются", "Каналы Go, акторы Erlang, очереди"],
          ["Неизменяемость", "Нет записи — нет гонки", "Функциональные структуры данных"],
          ["Один поток + события", "Нет параллелизма — нет гонок потоков (но есть гонки между await)", "JavaScript, Node.js"],
          ["Транзакции", "Блоки операций исполняются как неделимые", "СУБД, программная транзакционная память"],
        ],
        "Подходы к ограничению разделяемого состояния",
      ),
    ]),

    section("mistakes", [
      wrongRight(
        "c",
        {
          title: "Неверно",
          code: `
            // счётчик посетителей, общий для потоков
            volatile long visits;
            void on_request(void) { visits++; }          // три шага: чтение, сложение, запись
          `,
          note: "`volatile` не делает операцию атомарной: в замере потеряно 51–74 % увеличений.",
        },
        {
          title: "Верно",
          code: `
            long visits;
            void on_request(void) { __atomic_fetch_add(&visits, 1, __ATOMIC_RELAXED); }
            // для горячих счётчиков лучше счётчик на поток и суммирование при чтении
          `,
          note: "Атомарное увеличение корректно; локальные счётчики по потокам быстрее на порядки.",
        },
      ),
      ul(
        "**`volatile` вместо синхронизации.** В C/C++ `volatile` не даёт ни атомарности, ни упорядочения между потоками.",
        "**Проверка условия через `if` вместо `while`** при `pthread_cond_wait`: ложные пробуждения и состязания приводят к работе с невалидным состоянием.",
        "**Замки в разном порядке:** циклическое ожидание — взаимная блокировка (в замере оба потока получили тайм-аут).",
        "**Блокирующий ввод-вывод под замком:** все потоки выстраиваются в очередь за медленной операцией.",
        "**Чтение общих данных без замка «потому что только читаем»:** при параллельной записи чтение рвётся.",
        "**Ожидание по `sleep`** вместо события: время работы зависит от машины.",
        "**Проверка–действие через `await`** (двойное списание): перед `await` инвариант может быть нарушен; исправление — очередь операций или транзакция.",
        "**Рассчитывать на порядок выполнения «как написано».** Компилятор и процессор переставляют операции (тест «буфер записи»: 5 % «невозможных» исходов).",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Глобальный замок на всё.** Корректно, но сериализует программу: параллельности нет; используйте мелкозернистые замки или раздельные данные.",
        "**Тысячи замков без порядка захвата.** Взаимные блокировки появляются «на стыке» модулей; вводите иерархию замков.",
        "**Самодельные примитивы синхронизации** (спинлоки, двойная проверка) без знания модели памяти.",
        "**Потоки на каждую задачу.** Создание потока стоит десятки микросекунд, память — мегабайты; нужен пул.",
        "**Бесконечные очереди.** При превышении нагрузки очередь растёт, задержки уходят в бесконечность; нужны ограничение и обратное давление.",
        "**Планирование ёмкости по среднему времени.** Хвостовые задержки (p99) растут раньше и сильнее: при ρ = 0,9 p99 = 44,9 с при среднем 9,94 с.",
        "**Использовать блокирующий код в цикле событий** (синхронное чтение файла, тяжёлый JSON-разбор): все запросы замирают.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Проектируйте от данных:** определите, какие данные разделяются; сократите их (копии, неизменяемость, сообщения).",
        "**Один владелец у каждого изменяемого объекта** — поток или задача, остальные обращаются через очередь.",
        "**Единый порядок захвата замков** и короткие критические секции; никакого ввода-вывода и чужого кода под замком.",
        "**Ожидайте условие в цикле**; завершайте воркеров явным сигналом (`broadcast`/закрытие очереди).",
        "**Ограничивайте очереди и пулы;** задавайте тайм-ауты, обратное давление и отказ при перегрузке.",
        "**Измеряйте p99 и загрузку,** планируйте ёмкость с запасом (не выше 60–70 % на пике); используйте закон Литтла для проверки данных мониторинга.",
        "**Тестируйте конкурентный код** под нагрузкой и со случайными задержками, используйте детекторы гонок (ThreadSanitizer, `go test -race`) и стресс-тесты; тест, прошедший один раз, ничего не доказывает.",
        "**Используйте готовые структуры** (конкурентные очереди, пулы, `Atomics`, транзакции базы данных) вместо собственных.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Ложные пробуждения** условных переменных допускаются стандартом POSIX; поэтому условие всегда проверяется заново.",
        "**ABA-проблема** в lock-free структурах: значение изменилось с `A` на `B` и обратно, и `compare-and-swap` ошибочно считает состояние неизменным.",
        "**Живая блокировка (livelock):** задачи постоянно уступают друг другу и не продвигаются; в нашем `trylock` ей препятствует разная пауза.",
        "**Голодание при несправедливых замках:** потоки могут «обгонять» друг друга; справедливые замки медленнее.",
        "**Сигналы и замки:** вызов небезопасных функций из обработчика сигнала может вызвать взаимную блокировку.",
        "**`fork` в многопоточной программе:** замки, удерживаемые другими потоками, остаются захваченными в потомке (см. [процессы и потоки](/learn/cs/processes-threads)).",
        "**Гонки на уровне файловой системы и сети** (проверить существование, затем создать): используйте атомарные операции ОС (`O_EXCL`, `rename`).",
        "**Асинхронность не равна безопасности:** состояние между `await` может измениться; неперехваченные ошибки в «забытых» промисах теряются.",
      ),
    ]),

    section("related", [
      ul(
        "[Процессы и потоки](/learn/cs/processes-threads) — потоки, GIL, воркеры и стоимость создания.",
        "[Процессор, память и кеш](/learn/cs/cpu-memory-cache) — ложное разделение строки кеша и закон Амдала.",
        "[Виртуальная память и файловые системы](/learn/cs/virtual-memory-files) — блокировки файлов и атомарные операции файловой системы.",
        "[Стеки и очереди](/learn/cs/stacks-queues) — очередь как основа планировщика и пулов.",
        "[Транзакции и согласованность](/learn/cs/transactions-consistency-theory) — сериализуемость, блокировки и изоляция в СУБД.",
        "[Сетевая модель, IP и TCP](/learn/cs/network-model-ip-tcp) — очереди, перегрузка и задержки в сетях.",
        "[JavaScript: цикл событий](/learn/js/event-loop) — порядок задач, микрозадачи и один поток.",
        "[JavaScript: промисы](/learn/js/promises) — состояния и цепочки промисов.",
        "[JavaScript: async/await и отмена](/learn/js/async-await-abort) — конкурентность и отмена без потоков.",
        "[SQL: блокировки и взаимные блокировки](/learn/sql/locking-deadlocks) — те же идеи в СУБД.",
        "[SQL: уровни изоляции](/learn/sql/isolation-levels) — какие гонки допускает каждый уровень.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Проверка и действие через await",
          code: `
            async function reserve(seats, n) {
              if (seats.free >= n) {                       // проверка
                await db.save({ reserved: n });            // другая задача успевает выполнить ту же проверку
                seats.free -= n;                           // действие по устаревшему условию
              }
            }
          `,
          note: "Две параллельные брони проходят проверку и обе уменьшают счётчик: в замере баланс ушёл в минус (−60).",
        },
        {
          title: "Сериализованная секция",
          code: `
            const lock = new Mutex();                      // очередь промисов
            const reserve = (seats, n) => lock.run(async () => {
              if (seats.free >= n) { await db.save({ reserved: n }); seats.free -= n; return true; }
              return false;
            });
          `,
          note: "Вторая операция начинается после завершения первой и видит актуальное значение: в замере `[true, false]`, баланс `20`. В базе — транзакция или условное обновление.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "cs.concurrency-scheduling.ex1",
      title: "Посчитайте среднее время ожидания вручную",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Три процесса (приход, длительность): P1 (0, 5), P2 (1, 3), P3 (2, 1). Постройте диаграммы Ганта и найдите среднее время ожидания для FCFS, SJF (без вытеснения), SRTF и Round Robin с квантом 2. Какая политика минимизирует среднее ожидание и почему она не всегда применима?"),
      ],
      hints: [
        "Ожидание = момент завершения − приход − длительность.",
        "При SJF без вытеснения выбор делается только когда процессор свободен.",
        "Для Round Robin: новые процессы встают в очередь в момент прихода; недоработавший — в конец.",
      ],
      checks: ["FCFS: ожидание 0, 4, 6 — среднее 3,33", "SJF: 0, 5, 3 — среднее 2,67", "SRTF: 4, 1, 0 — среднее 1,67", "Round Robin q=2: 4, 4, 2 — среднее 3,33", "Минимум — у SRTF; нужны известные длительности"],
      solution: [
        code("text", `FCFS    ожидание по процессам: 0, 4, 6   среднее 3.33   порядок: P1P1P1P1P1P2P2P2P3
SJF     ожидание по процессам: 0, 5, 3   среднее 2.67   порядок: P1P1P1P1P1P3P2P2P2
SRTF    ожидание по процессам: 4, 1, 0   среднее 1.67   порядок: P1P2P3P2P2P1P1P1P1
RR q=2  ожидание по процессам: 4, 4, 2   среднее 3.33   порядок: P1P1P2P2P3P1P1P2P1`, { filename: "проверка симулятором" }),
        ul(
          "FCFS: P1 0–5, P2 5–8, P3 8–9: ожидания `0`, `5−1 = 4`, `8−2 = 6`.",
          "SJF: после P1 в очереди P2 (3) и P3 (1) — выбираем P3: P1 0–5, P3 5–6, P2 6–9: ожидания `0`, `6−1 = 5`, `5−2 = 3`.",
          "SRTF: P1 работает до прихода P2, затем P2, в момент 2 приходит P3 (1) и вытесняет P2; порядок `P1 P2 P3 P2 P2 P1 P1 P1 P1`: ожидания 4, 1, 0 — среднее 1,67.",
          "SRTF оптимален по среднему ожиданию, но требует знать остаточное время работы, чего реальный планировщик не знает; он приводит к голоданию длинных задач, поэтому на практике применяют приоритеты с обратной связью и квантование.",
        ),
      ],
    }),
    exercise({
      id: "cs.concurrency-scheduling.ex2",
      title: "Напишите ограниченную асинхронную очередь",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Реализуйте класс `BoundedQueue(capacity)` для JavaScript с асинхронными методами `put(value)` (ждёт, пока есть место), `get()` (ждёт, пока есть элемент) и `close()` (после закрытия `get` возвращает `undefined`, когда очередь пуста). Покажите на трёх производителях и двух потребителях, что ничего не потеряно и ёмкость не превышена."),
      ],
      starter: {
        lang: "js",
        code: `
          class BoundedQueue {
            constructor(capacity) { /* ... */ }
            async put(value) { /* ждать место */ }
            async get() { /* ждать элемент */ }
            close() { /* разбудить всех получателей */ }
          }
        `,
      },
      hints: [
        "Храните массив элементов и очереди ожидающих «resolve»-функций отдельно для отправителей и получателей.",
        "Ожидание — в цикле `while`: после пробуждения условие нужно проверить заново.",
        "После `put` будите одного получателя, после `get` — одного отправителя; `close()` будит всех получателей.",
      ],
      checks: ["Получено ровно столько элементов, сколько отправлено", "Все значения уникальны", "Длина очереди никогда не больше ёмкости", "Порядок элементов каждого производителя сохранён", "После `close()` получатели завершаются"],
      solution: [
        code("js", `// Ограниченная асинхронная очередь: put ждёт, пока есть место, get ждёт, пока есть элемент. Без потоков — только промисы.
class BoundedQueue {
  #items = []; #cap; #getters = []; #putters = []; closed = false; maxLen = 0;
  constructor(cap) { this.#cap = cap; }
  async put(v) {
    while (this.#items.length >= this.#cap) await new Promise((r) => this.#putters.push(r));
    this.#items.push(v); this.maxLen = Math.max(this.maxLen, this.#items.length);
    this.#getters.shift()?.();                                  // разбудить одного получателя
  }
  async get() {
    while (this.#items.length === 0) {
      if (this.closed) return undefined;
      await new Promise((r) => this.#getters.push(r));
    }
    const v = this.#items.shift();
    this.#putters.shift()?.();                                  // освободилось место — разбудить одного отправителя
    return v;
  }
  close() { this.closed = true; for (const g of this.#getters.splice(0)) g(); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = new BoundedQueue(4);
const P = 3, C = 2, ITEMS = 50;
const got = [], perConsumer = new Array(C).fill(0);
const producers = Array.from({ length: P }, async (_, p) => { for (let i = 0; i < ITEMS; i++) { await q.put(p * 1000 + i); if (i % 7 === 0) await sleep(1); } });
const consumers = Array.from({ length: C }, async (_, c) => { for (;;) { const v = await q.get(); if (v === undefined) return; got.push(v); perConsumer[c]++; if (v % 5 === 0) await sleep(1); } });
await Promise.all(producers);
q.close();
await Promise.all(consumers);
const expect = P * ITEMS;
console.log("производителей", P, ", потребителей", C, ", ёмкость 4, элементов от каждого", ITEMS);
console.log("получено", got.length, "из", expect, ":", got.length === expect ? "верно" : "ошибка");
console.log("все значения уникальны и ни одно не потеряно:", new Set(got).size === expect ? "да" : "нет");
console.log("очередь никогда не превышала ёмкость (максимум ≤ 4):", q.maxLen <= 4 ? "да" : "нет");
console.log("порядок элементов каждого производителя сохранён:", [0, 1, 2].every((p) => { const own = got.filter((v) => Math.floor(v / 1000) === p); return own.every((v, i) => i === 0 || v > own[i - 1]); }) ? "да" : "нет");
console.log("оба потребителя работали:", perConsumer.every((n) => n > 0) ? "да" : "нет");`, { filename: "решение", collapsed: true }),
        code("text", `производителей 3 , потребителей 2 , ёмкость 4, элементов от каждого 50
получено 150 из 150 : верно
все значения уникальны и ни одно не потеряно: да
очередь никогда не превышала ёмкость (максимум ≤ 4): да
порядок элементов каждого производителя сохранён: да
оба потребителя работали: да`, { filename: "результат" }),
        p("Структура повторяет тему в miniature: ожидающие хранятся в двух очередях, пробуждение будит по одному, условие проверяется в цикле `while`. Поскольку JavaScript выполняется в одном потоке, гонок потоков нет, но есть гонки между `await`, поэтому логика «проверить — изменить» выполнена без `await` между проверкой и изменением внутри методов."),
      ],
    }),
    exercise({
      id: "cs.concurrency-scheduling.ex3",
      title: "Банк «зависает» при встречных переводах",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Сервис переводов блокирует счёт-отправитель, затем счёт-получатель. Под нагрузкой изредка все потоки обработки останавливаются; в логах последние операции — встречные переводы `A → B` и `B → A`. Объясните причину, предложите три различных исправления и опишите, как обнаружить проблему до выхода в эксплуатацию."),
      ],
      hints: [
        "Выпишите последовательность захвата замков двумя потоками.",
        "Какое из четырёх условий взаимной блокировки проще всего нарушить?",
        "Как тест может «заставить» потоки одновременно держать первый замок?",
      ],
      checks: ["Причина: два потока берут замки в противоположном порядке — циклическое ожидание", "Исправление 1: единый порядок (например, по номеру счёта)", "Исправление 2: `trylock` с откатом и повтором", "Исправление 3: одна транзакция БД или сериализация через очередь/один замок", "Обнаружение: стресс-тест со встречными переводами, тайм-ауты, детекторы блокировок"],
      solution: [
        code("text", `1) замки в разном порядке: поток 0 — тайм-аут (взаимная блокировка), поток 1 — тайм-аут (взаимная блокировка)
   оба потока не смогли взять второй замок: да
2) единый порядок захвата (A, затем B): завершились оба потока: да
3) trylock с откатом (разный порядок, но без ожидания «с замком в руках»): завершились оба потока: да`, { filename: "воспроизведение: два замка в разном порядке" }),
        ul(
          "**Причина.** Поток 1 держит `A` и ждёт `B`, поток 2 держит `B` и ждёт `A`: выполнены все четыре условия Коффмана. Воспроизведение: барьер между первым и вторым захватом — оба потока получили тайм-аут.",
          "**Исправление 1.** Всегда блокировать счета в порядке возрастания номера (`min(id)`, затем `max(id)`): циклическое ожидание невозможно (в замере оба потока завершились).",
          "**Исправление 2.** `trylock` для второго замка: при неудаче отпустить первый, выждать случайную паузу и повторить (в замере завершились оба потока); следить за livelock.",
          "**Исправление 3.** Выполнять перевод транзакцией базы данных (СУБД обнаруживает взаимную блокировку и откатывает одну из транзакций, а приложение повторяет её) или через очередь операций с единственным владельцем состояния.",
          "**Обнаружение.** Нагрузочный тест со встречными переводами, тайм-ауты ожидания замков с логированием владельцев, ThreadSanitizer/детекторы взаимных блокировок и мониторинг числа потоков в ожидании.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "cs.concurrency-scheduling.challenge",
    title: "Подберите ёмкость сервиса по нагрузке и SLA",
    scenario: [
      p("Сервис получает в среднем 3,6 запроса в секунду, среднее время обработки запроса — 1 секунда, распределение времени — экспоненциальное. Бизнес требует, чтобы 99 % запросов получали ответ менее чем за 8 секунд. Определите минимальное число обработчиков с общей очередью, обоснуйте запас по загрузке и объясните, чем отличаются средние значения от хвостовых."),
    ],
    requirements: [
      "Симуляция очереди с `c` обработчиками и общей очередью (детерминированный генератор псевдослучайных чисел)",
      "Таблица для `c` = 3…8: загрузка, среднее время ответа, p99, среднее ожидание в очереди",
      "Вывод: минимальное `c`, при котором p99 меньше 8 секунд, и запас по загрузке",
      "Проверка закона Литтла и сравнение общей очереди с раздельными очередями при той же нагрузке",
    ],
    constraints: [
      "Не использовать среднее время ответа вместо процентиля при проверке SLA",
      "При ρ ≥ 1 система нестабильна: такой вариант отвергается сразу",
    ],
    acceptance: [
      "Для 3 обработчиков отмечена перегрузка (ρ = 1,2)",
      "Минимальное число обработчиков определено по p99 (получено 5)",
      "Объяснено, почему при 4 обработчиках (ρ = 0,9) p99 = 13,21 с, хотя среднее время ответа 3,11 с",
      "Указано, почему запас по загрузке нужен и для устойчивости к всплескам",
    ],
    hints: [
      "Выбирайте обработчик, освобождающийся раньше всех.",
      "При ρ = λ/(c·μ) ≥ 1 очередь растёт неограниченно.",
      "Процентиль вычисляйте по отсортированным временам ответа.",
    ],
    solution: [
      code("text", `λ = 3.6 запросов/с, среднее время обработки 1 с; c обработчиков с общей очередью
обработчиков  загрузка    среднее время ответа (с)   p99 (с)   среднее ожидание в очереди (с)
          3    ρ ≥ 1: очередь растёт без предела (нагрузка превышает ёмкость)
          4      0.90                   3.11         13.21                   2.11
          5      0.72                   1.30          5.25                   0.30
          6      0.60                   1.08          4.74                   0.08
          8      0.45                   1.01          4.62                   0.01
минимальное число обработчиков, при котором p99 < 8 с: 5`, { filename: "решение: таблица ёмкости" }),
      code("text", `обработчик производительностью μ = 1 запрос/с, пуассоновский поток заявок λ, 400000 заявок
загрузка ρ=λ/μ   среднее время в системе (с)   по формуле 1/(μ−λ)   p99 (с)   среднее ожидание в очереди (с)
0.5                          2.01                       2.00        9.2                     1.00
0.7                          3.35                       3.33       15.4                     2.35
0.8                          4.97                       5.00       23.1                     3.97
0.9                          9.94                      10.00       44.9                     8.94
0.95                        19.83                      20.00       83.7                    18.83
0.99                        60.83                     100.00      244.6                    59.83

закон Литтла L = λ·W при ρ = 0.8: λ·W = 4.02 ; для M/M/1 теоретическое L = ρ/(1−ρ) = 4.00

два обработчика (μ = 1 каждый), суммарная нагрузка λ = 1.8 (ρ = 0.9 на обработчик):
  общая очередь:               среднее время в системе 5.22 с
  случайное распределение:     среднее время в системе 9.92 с`, { filename: "проверка теории: закон Литтла, общая очередь" }),
      p("Три обработчика (ρ = 1,2) не справляются вообще. Четыре дают среднее 3,11 с, но p99 = 13,21 с — SLA нарушен: при ρ = 0,9 очередь часто длинна. Пять (ρ = 0,72) дают p99 = 5,25 с — SLA соблюдён, а шесть и восемь уменьшают хвост лишь незначительно (4,74 и 4,62 с: нижняя граница — само время обработки). Минимум — 5 обработчиков с запасом по загрузке 28 %: этот запас поглощает всплески. Среднее скрывает хвост: при высокой загрузке несколько запросов ждут очень долго. Общая очередь эффективнее раздельных: те же два обработчика при ρ = 0,9 — 5,22 с против 9,92 с."),
    ],
  },

  interview: [
    iq("cs.concurrency-scheduling.i1", "basic", "Что такое гонка данных и как её избежать?", [
      ul(
        "Несколько потоков обращаются к одной переменной без синхронизации, и хотя бы один пишет; результат зависит от порядка выполнения (в замере — потеряно 51–74 % увеличений).",
        "Избегать: не разделять состояние (копии, локальные счётчики), использовать неизменяемость, атомарные операции, мьютексы, очереди сообщений.",
        "Проверять: ThreadSanitizer, стресс-тесты; результат «прошёл один раз» ничего не доказывает.",
      ),
    ]),
    iq("cs.concurrency-scheduling.i2", "basic", "Чем конкурентность отличается от параллелизма?", [
      ul(
        "Конкурентность — структура: задачи перекрываются во времени, возможно на одном ядре (JavaScript с `async`).",
        "Параллелизм — одновременное выполнение на нескольких ядрах для ускорения.",
        "Одно не подразумевает другое: можно быть конкурентным без параллелизма и наоборот.",
      ),
    ]),
    iq("cs.concurrency-scheduling.i3", "intermediate", "Что такое взаимная блокировка и как её предотвратить?", [
      ul(
        "Каждая из задач держит ресурс и ждёт ресурс другой — цикл ожидания (в замере два потока получили тайм-аут).",
        "Условия Коффмана: взаимное исключение, удержание и ожидание, отсутствие вытеснения, циклическое ожидание — достаточно нарушить одно.",
        "Практика: единый порядок захвата, `trylock` с откатом, тайм-ауты, меньше замков, транзакции.",
      ),
    ]),
    iq("cs.concurrency-scheduling.i4", "intermediate", "Чем мьютекс отличается от спинлока и атомарной операции?", [
      ul(
        "Мьютекс усыпляет ожидающий поток (около 50 нс в замере на операцию); спинлок крутится в цикле (около 175 нс при конкуренции на 4 потоках); атомарная операция защищает одно слово без замка (около 30 нс).",
        "Спинлок оправдан для очень коротких секций и когда потоков не больше ядер; мьютекс — для обычных; атомарные операции — для счётчиков и флагов.",
        "Ничего из этого не лучше «не разделять состояние»: локальные счётчики были в тысячи раз быстрее.",
      ),
    ]),
    iq("cs.concurrency-scheduling.i5", "intermediate", "Сравните FCFS, SJF и Round Robin.", [
      ul(
        "FCFS — просто, но эффект конвоя (среднее ожидание 8,75 на примере, при конвое короткие ждут 103 такта).",
        "SJF/SRTF — минимальное среднее ожидание (7,75 и 6,50), но нужны длительности и возможно голодание длинных.",
        "Round Robin — отклик и справедливость (отклик 2,00 при `q = 2`), но среднее ожидание хуже (12,75) и больше переключений (12 против 3).",
      ),
    ]),
    iq("cs.concurrency-scheduling.i6", "advanced", "Что такое модель памяти и почему важны барьеры и `acquire/release`?", [
      ul(
        "Компилятор и процессор вправе переставлять независимые операции; модель памяти определяет, какие порядки наблюдаемы другими потоками.",
        "Тест «буфер записи»: с `relaxed` исход `r1 = r2 = 0` в 5 % испытаний, с `seq_cst` — ни разу.",
        "Синхронизирующие операции (замки, `acquire/release`, `seq_cst`) создают отношение «происходит до» и делают результат предсказуемым.",
      ),
    ]),
    iq("cs.concurrency-scheduling.i7", "engineering", "Как выбрать число обработчиков и размер очереди для сервиса?", [
      ul(
        "Оценить `λ` и `μ`, держать расчётную загрузку ниже 60–70 % на пике; при ρ = 0,9 среднее время ответа в 10 раз больше времени обработки, а p99 ещё хуже.",
        "Использовать общую очередь (на двух обработчиках 5,22 с против 9,92 с у раздельных), ограниченный размер очереди и обратное давление, тайм-ауты.",
        "Задавать SLA по процентилям, проверять нагрузочными тестами и законом Литтла (`L = λ·W`).",
      ),
    ]),
    iq("cs.concurrency-scheduling.i8", "debugging", "Сервис периодически замирает, CPU почти не загружен. Что проверите?", [
      ul(
        "Взаимную блокировку: снять дампы потоков (`jstack`, `gdb`, `py-spy`) и посмотреть, кто чего ждёт; искать цикл в графе ожидания.",
        "Блокирующий ввод-вывод под замком или в цикле событий; исчерпание пула потоков и соединений; ожидание условия, которое уже не наступит (потерянный сигнал).",
        "Меры: единый порядок замков, тайм-ауты и логирование владельцев замков, ограничение пулов, мониторинг числа ожидающих потоков.",
      ),
    ]),
  ],

  exam: [
    mcq("cs.concurrency-scheduling.e1", "foundation", "Почему `volatile long counter; counter++` из нескольких потоков теряет обновления?", ["Из-за ошибки компилятора", "`volatile` запрещает увеличение", "Операция состоит из чтения, сложения и записи, которые перемежаются у разных потоков", "Потоки работают на разных процессорах"], 2, "`counter++` — три шага, а `volatile` не делает их неделимыми; в замере потеряно 51–74 % увеличений при четырёх потоках."),
    mcq("cs.concurrency-scheduling.e2", "foundation", "Что делать, чтобы избежать взаимной блокировки двух замков?", ["Всегда брать их в одном и том же порядке", "Брать замки в произвольном порядке", "Использовать больше потоков", "Удерживать замок как можно дольше"], 0, "Единый порядок захвата нарушает условие циклического ожидания; в замере с таким порядком оба потока завершились."),
    mcq("cs.concurrency-scheduling.e3", "foundation", "Какой алгоритм планирования даёт эффект конвоя?", ["Round Robin", "SRTF", "Многоуровневые очереди с обратной связью", "FCFS"], 3, "FCFS не вытесняет: короткие задачи ждут за длинной (в замере короткие ждали в среднем 103 такта)."),
    mcq("cs.concurrency-scheduling.e4", "intermediate", "Как относятся доли процессорного времени двух процессов (`nice 0` и `nice 10`) на одном ядре в замере?", ["Примерно 1:1", "Примерно 9:1", "Примерно 2:1", "Второй не получает времени"], 1, "Отношение счётчиков 9,07: первый получил около 90 %, второй — около 10 % (веса ≈ 1024 и 110)."),
    mcq("cs.concurrency-scheduling.e5", "intermediate", "Во что превращается среднее время в системе при росте загрузки ρ с 0,9 до 0,95 (по замеру и формуле `1/(μ−λ)`)?", ["Остаётся равным", "Растёт на 5 %", "Падает вдвое", "Удваивается"], 3, "9,94 с при 0,9 и 19,83 с при 0,95: время ответа растёт нелинейно; формула `1/(μ−λ)` даёт 10 и 20 с."),
    mcq("cs.concurrency-scheduling.e6", "intermediate", "Зачем условие ожидания `pthread_cond_wait` проверяют в цикле `while`?", ["Для скорости", "Так требует компилятор", "Из-за ложных пробуждений и состязаний за элемент", "Чтобы не использовать мьютекс"], 2, "Поток может проснуться, когда условие уже не выполняется (ложное пробуждение или другой поток успел забрать элемент): нужно проверить его заново."),
    mcq("cs.concurrency-scheduling.e7", "advanced", "Какие утверждения верны? Выберите все.", ["В тесте «буфер записи» с `seq_cst` исход `r1 = r2 = 0` не наблюдается", "Общая очередь к двум обработчикам даёт меньшее время ответа, чем случайное разделение на две очереди", "Локальные счётчики по потокам с суммированием в конце в замере быстрее общего мьютекса на порядки", "`volatile` в C гарантирует атомарность увеличения"], [0, 1, 2], "С `seq_cst` исход не наблюдался; общая очередь — 5,22 с против 9,92 с; локальные счётчики — доли миллисекунды против 0,4 с. `volatile` атомарность не гарантирует."),
    open("cs.concurrency-scheduling.e8", "intermediate", "Объясните, почему при росте загрузки сервиса с 80 до 95 % время ответа растёт так резко, и что из этого следует для планирования ёмкости.", [
      ul(
        "В очереди с одним обработчиком время в системе `W = 1/(μ − λ)`: при приближении `λ` к `μ` знаменатель стремится к нулю (в замере 4,97 → 9,94 → 19,83 с при ρ = 0,8; 0,9; 0,95).",
        "Случайные всплески нагрузки не успевают рассасываться, очередь накапливается; хвостовые задержки (p99) растут ещё сильнее среднего.",
        "Следствие: держать расчётную загрузку на пике 60–70 %, использовать общую очередь, ограничивать длину очереди и применять обратное давление, задавать SLA по процентилям.",
      ),
    ], ["Названа формула или рост нелинейно", "Объяснены всплески и накопление очереди", "Упомянуты процентили", "Даны рекомендации по запасу и ограничению очереди"]),
  ],

  mastery: [
    mcq("cs.concurrency-scheduling.m1", "intermediate", "Почему SRTF оптимален по среднему ожиданию, но не используется «как есть» в универсальных ОС?", ["Он слишком медленный", "Он требует знать остаточное время работы и приводит к голоданию длинных задач", "Он не поддерживает вытеснение", "Он работает только на одном ядре"], 1, "Остаточное время неизвестно заранее, а длинные задачи при потоке коротких не запускаются (в замере — до момента 40 при 0 из 20 тиков); применяют приближения и приоритеты с обратной связью."),
    mcq("cs.concurrency-scheduling.m2", "advanced", "Что такое инверсия приоритетов и как с ней бороться?", ["Высокоприоритетная задача ждёт замок низкоприоритетной, а средняя вытесняет низкую; лечат наследованием приоритета", "Рост приоритета со временем", "Отмена приоритетов", "Ошибка планировщика при `nice`"], 0, "Владелец замка с низким приоритетом не получает процессор из-за задач среднего приоритета, и высокоприоритетная задача блокируется неопределённо долго; наследование приоритета временно повышает владельца."),
    mcq("cs.concurrency-scheduling.m3", "advanced", "Почему оба потока в нашем тесте на взаимную блокировку «держат» замки до фиксации тайм-аута?", ["Это ошибка", "Так требует POSIX", "Чтобы тайм-аут одного потока не освободил замок и не позволил второму завершиться, сделав результат недетерминированным", "Чтобы быстрее завершиться"], 2, "Если один поток отпустит замок раньше, второй может успеть захватить его и завершиться: результат зависит от гонки. Барьер перед отпусканием замков делает демонстрацию детерминированной."),
    open("cs.concurrency-scheduling.m4", "advanced", "Спроектируйте пул воркеров для обработки заданий с приоритетами: структуры данных, синхронизация, завершение, защита от голодания и перегрузки.", [
      ul(
        "Структуры: несколько очередей по приоритетам (или куча) под одним мьютексом и условной переменной; ограничение суммарной ёмкости; число воркеров — порядка числа ядер для вычислений.",
        "Голодание: старение — приоритет задачи растёт с временем ожидания, или квоты на долю низкоприоритетных задач; Round Robin между классами.",
        "Перегрузка: ограниченная очередь, обратное давление (блокировка или отказ производителя), тайм-ауты заданий, отбрасывание наименее важных при переполнении.",
        "Завершение: флаг остановки и `broadcast`, дожидание текущих заданий, затем выход; обработка исключений воркера без потери пула; метрики (длина очереди, p99 ожидания) и закон Литтла для проверки.",
      ),
    ], ["Структуры данных и синхронизация", "Защита от голодания (старение/квоты)", "Ограничение очереди и обратное давление", "Корректное завершение и мониторинг"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "cs.concurrency-scheduling.f1", front: "Гонка данных?", back: "Несколько потоков пишут/читают общую переменную без синхронизации. x++ = чтение, сложение, запись. Лечение: не разделять, атомарные операции, мьютекс." },
    { id: "cs.concurrency-scheduling.f2", front: "Цена синхронизации (4 потока)?", back: "Локальные счётчики ≪ атомарная (≈ 30 нс) < мьютекс (≈ 50 нс) < спинлок (≈ 175 нс). Не разделять — дешевле всего." },
    { id: "cs.concurrency-scheduling.f3", front: "Условия deadlock?", back: "Взаимное исключение, удержание и ожидание, отсутствие вытеснения, циклическое ожидание. Лечение: единый порядок замков, trylock, тайм-ауты." },
    { id: "cs.concurrency-scheduling.f4", front: "Условная переменная?", back: "Ждать в цикле while: wait отпускает мьютекс и усыпляет поток; возможны ложные пробуждения. signal — одного, broadcast — всех." },
    { id: "cs.concurrency-scheduling.f5", front: "Модель памяти?", back: "Компилятор и CPU переставляют операции. relaxed: (0,0) в 5 % испытаний; seq_cst: 0. Нужны замки/acquire–release." },
    { id: "cs.concurrency-scheduling.f6", front: "Планирование?", back: "FCFS: конвой. SJF/SRTF: мин. ожидание, голодание. Round Robin: отклик, переключения. nice 10: ≈ 1/9 времени при nice 0." },
    { id: "cs.concurrency-scheduling.f7", front: "Очереди?", back: "W = 1/(μ−λ): 2 с при ρ 0,5, 10 с при 0,9, 20 с при 0,95. Закон Литтла L = λW. Общая очередь лучше раздельных (5,22 против 9,92 с)." },
    { id: "cs.concurrency-scheduling.f8", front: "Async-гонка?", back: "Между проверкой и действием стоит await: другая задача меняет состояние. Лечение: сериализация (мьютекс на промисах) или транзакция." },
  ],

  sources: [
    { title: "Arpaci-Dusseau R., Arpaci-Dusseau A. Operating Systems: Three Easy Pieces: Concurrency, CPU Scheduling", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", publisher: "Other" },
    { title: "The Open Group: POSIX.1-2017 — pthread_mutex_lock, pthread_cond_wait, sem_wait", url: "https://pubs.opengroup.org/onlinepubs/9699919799/", publisher: "Other" },
    { title: "Linux manual page: futex(2) и nice(2)", url: "https://man7.org/linux/man-pages/man2/futex.2.html", publisher: "Other" },
    { title: "Coffman E., Elphick M., Shoshani A. System Deadlocks (ACM Computing Surveys, 1971)", url: "https://doi.org/10.1145/356586.356588", publisher: "Other" },
    { title: "Little J. A Proof for the Queuing Formula: L = λW (Operations Research, 1961)", url: "https://doi.org/10.1287/opre.9.3.383", publisher: "Other" },
    { title: "Node.js documentation: Event Loop, Timers, and process.nextTick()", url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick", publisher: "Other" },
    { title: "ECMAScript® Language Specification: Jobs and Job Queues, Atomics", url: "https://tc39.es/ecma262/#sec-jobs", publisher: "ECMA" },
  ],
};
