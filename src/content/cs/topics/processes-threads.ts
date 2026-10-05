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

export const processesThreads: Topic = {
  id: "cs.processes-threads",
  slug: "processes-threads",
  domain: "cs",
  module: "os",
  title: "Процессы и потоки: изоляция, общая память и цена переключения",
  titleEn: "Processes and Threads: Isolation, Shared Memory and the Cost of Switching",
  summary:
    "Процесс — это запущенная программа с собственным адресным пространством и ресурсами, поток — линия исполнения внутри процесса, разделяющая его память. Тема разбирает жизненный цикл процесса (`fork`, `exec`, `wait`, зомби, сигналы, коды выхода), каналы (pipe) и конвейеры оболочки, устройство потоков (общая куча, собственный стек, локальные данные потока), гонки данных и стоимость создания и переключения. Всё проверено запуском на Linux: `fork` + `wait` занимает около 196 мкс против 54 мкс у потока, системный вызов — около 103 нс, каждому потоку резервируется 8 МиБ виртуальной памяти, но физически он занимает около 9 КиБ; в CPython 3.11 четыре потока вычислений не быстрее одного, а четыре процесса — в 2,9 раза быстрее.",
  minutes: 100,
  prerequisites: ["cs.cpu-memory-cache"],
  tags: ["процесс", "поток", "fork", "exec", "сигналы", "pipe", "зомби", "код выхода", "GIL", "worker_threads", "гонка данных", "стек потока"],
  keyConcepts: [
    { term: "Процесс — изоляция", text: "После `fork` потомок получает копию адресного пространства: присвоение `x = 2` в потомке не меняет `x = 1` у родителя; потомок завершился с кодом 7, родитель его прочитал через `waitpid`." },
    { term: "Поток — общая память", text: "Три потока в процессе: `Threads: 1` → `Threads: 4`; общая переменная видна всем, значения `__thread` — только своему потоку (10, 20, 30 и 5 в main), стеки по разным адресам." },
    { term: "Жизненный цикл и зомби", text: "Завершившийся потомок до `wait` остаётся записью в таблице процессов — состояние `Z`; после `waitpid` запись исчезает. `SIGTERM` завершает со статусом 15, `SIGKILL` — 9, и его нельзя перехватить." },
    { term: "Создание: поток дешевле процесса", text: "Замер: создание и ожидание потока — около 54 мкс, `fork` + `wait` — около 196 мкс (в 3,7 раза дороже); системный вызов `getppid` — около 103 нс." },
    { term: "Память потока", text: "200 потоков: виртуальная память выросла на 8,00 МиБ на поток (стек по умолчанию 8192 КиБ), физическая — всего на 9 КиБ на поток." },
    { term: "Гонка данных", text: "4 потока × 1 000 000 увеличений: мьютекс и атомарная операция дают ровно 4 000 000, простое `x++` теряет обновления (результат меньше)." },
    { term: "GIL и выбор модели", text: "CPython 3.11: четыре вычислительные задачи в потоках — 0,59 с против 0,50 с последовательно, в процессах — 0,17 с (в 2,9 раза быстрее); четыре ожидания по 0,2 с в потоках — 0,20 с против 0,80 с." },
  ],
  sections: [
    section("definition", [
      def("Процесс", "Экземпляр выполняющейся программы: собственное виртуальное адресное пространство, открытые файлы, идентификатор (pid), права и один или несколько потоков. Операционная система изолирует процессы друг от друга.", "process"),
      def("Поток", "Единица планирования внутри процесса: свои регистры, счётчик команд и стек, но общие с другими потоками адресное пространство, куча и открытые файлы.", "thread"),
      def("Системный вызов", "Обращение программы к ядру операционной системы за услугой (чтение файла, создание процесса, сон); переключает процессор в привилегированный режим.", "system call"),
      def("`fork` и `exec`", "В Unix `fork` создаёт копию вызывающего процесса, а `exec` заменяет образ процесса новой программой. Их сочетание — основа запуска программ оболочкой.", "fork / exec"),
      def("Зомби-процесс", "Завершившийся процесс, чей код выхода ещё не прочитан родителем через `wait`; от него остаётся только запись в таблице процессов.", "zombie process"),
      def("Сигнал", "Асинхронное уведомление процессу (`SIGTERM`, `SIGKILL`, `SIGINT`, `SIGPIPE`, `SIGUSR1`): по умолчанию завершает процесс, большинство можно перехватить или игнорировать (кроме `SIGKILL` и `SIGSTOP`).", "signal"),
      def("Канал (pipe)", "Однонаправленный буфер ядра между процессами: данные, записанные в один конец, читаются из другого. Основа конвейеров оболочки `a | b`.", "pipe"),
      def("Переключение контекста", "Сохранение состояния одного потока и загрузка состояния другого, чтобы процессор переключился между задачами.", "context switch"),
      def("Гонка данных", "Ситуация, когда несколько потоков обращаются к одной переменной без синхронизации и хотя бы один пишет: результат зависит от порядка выполнения.", "data race"),
    ]),

    section("why", [
      h("Почему это важно для разработчика"),
      p("Любая программа, которую вы запускаете, — процесс; веб-сервер, браузер, база данных, сборщик проекта, хук Git — всё это процессы и потоки. Выбор между ними определяет изоляцию, надёжность, скорость запуска, потребление памяти и возможность использовать ядра процессора."),
      ul(
        "**Надёжность и безопасность.** Падение процесса не роняет соседей (браузеры запускают вкладки в отдельных процессах); падение потока — роняет весь процесс.",
        "**Производительность.** Потоки быстрее создаются и делят данные, но порождают гонки; процессы изолированы, но требуют копирования данных.",
        "**Диагностика.** Зависший сервис, «зомби» в списке процессов, `EAGAIN` при запуске, `Killed` из-за нехватки памяти, код `143` после остановки контейнера — всё это язык процессов и сигналов.",
        "**Инструменты разработчика.** Конвейеры оболочки, коды выхода в CI, [хуки Git](/learn/git/commit-quality-hooks) (ненулевой код блокирует коммит), воркеры Node.js, пулы процессов Python.",
        "**Понимание языков.** Python с GIL, Node.js с одним потоком JavaScript и пулом потоков libuv, Go с горутинами, Java с потоками ядра — разные ответы на один вопрос.",
      ),
      tip("Диагностический вопрос номер один: «это процесс или поток, и что у них общего?» От ответа зависит, что нужно синхронизировать, что копируется и что произойдёт при падении."),
    ]),

    section("mental-model", [
      h("Процесс = адресное пространство + ресурсы; поток = регистры + стек"),
      diagram(
        `
        процесс A                                   процесс B
        ┌─────────────────────────────────┐        ┌───────────────────────┐
        │ код    данные    куча (общие)   │        │ свои код, данные,     │
        │ открытые файлы, pid, права      │        │ куча, файлы, pid      │
        │                                 │        │                       │
        │ поток 1      поток 2    поток 3 │        │ поток 1               │
        │ регистры     регистры   регистры│        │ регистры, стек        │
        │ стек         стек       стек    │        └───────────────────────┘
        └─────────────────────────────────┘
                 │ системные вызовы (fork, read, write, wait, kill, pipe)
        ─────────▼────────────────────────────────────────────────────────
                          ядро: таблица процессов, планировщик, память
        `,
        "Потоки одного процесса делят код, кучу и файлы, но имеют отдельные стеки и регистры; процессы изолированы друг от друга ядром и общаются через явные каналы (pipe, сокеты, общая память).",
      ),
      h("Жизненный цикл процесса"),
      diagram(
        `
        fork()           exec()               exit() / сигнал
         │                 │                         │
        создан ──► готов ──► выполняется ──► завершён (зомби, Z) ──► wait() родителя ──► запись удалена
                     ▲            │
                     └── спит (S) ◄┘  ожидание ввода-вывода, таймера, блокировки
        `,
        "Состояния читаются из `/proc/<pid>/stat`: `R` — выполняется или готов, `S` — спит, `D` — непрерываемый сон (ожидание устройства), `T` — остановлен, `Z` — зомби.",
      ),
      insight("Изоляция процессов обеспечивается виртуальной памятью: каждый видит «свои» адреса. Потоки же — это способ запустить несколько линий исполнения в одном адресном пространстве. Всё остальное — следствия: у потоков дёшево создание и обмен данными, но нужна синхронизация."),
    ]),

    section("technical", [
      h("Процессы в Unix: fork, exec, wait"),
      table(
        ["Вызов", "Что делает", "Замечание"],
        [
          ["`fork()`", "Создаёт потомка — копию процесса (с `copy-on-write`)", "Возвращает pid потомка родителю и 0 потомку"],
          ["`exec*()`", "Заменяет код и данные процесса новой программой", "pid сохраняется; при ошибке возвращается в вызывающий код"],
          ["`waitpid()`", "Ждёт завершения потомка и читает статус", "Без него потомок остаётся зомби"],
          ["`exit()` / `_exit()`", "Завершает процесс с кодом 0–255", "`0` — успех; остальное — по договорённости"],
          ["`kill(pid, sig)`", "Посылает сигнал", "`SIGTERM` просит завершиться, `SIGKILL` не обсуждается"],
          ["`pipe()`", "Создаёт канал из двух дескрипторов", "Наследуется потомками при `fork`"],
        ],
        "Базовые вызовы управления процессами",
      ),
      ul(
        "**Copy-on-write.** `fork` не копирует память сразу: страницы общие и копируются лишь при записи; поэтому `fork` недорог для процесса с большой памятью.",
        "**Код выхода.** `0` — успех. Оболочка использует `128 + N` для процесса, убитого сигналом `N` (143 для `SIGTERM`, 137 для `SIGKILL`, 141 для `SIGPIPE`) и `127` для «команда не найдена».",
        "**Сигналы.** Обработчик можно установить для большинства сигналов; он наследуется при `fork` и сбрасывается при `exec`. `SIGKILL` и `SIGSTOP` перехватить нельзя.",
        "**Конвейер `a | b | c`.** Оболочка создаёт процессы и соединяет их каналами; запись в закрытый канал вызывает `SIGPIPE`, поэтому `seq … | head -1` быстро завершается.",
      ),
      h("Потоки"),
      ul(
        "**Общее:** адресное пространство (код, глобальные данные, куча), открытые файлы, идентификатор процесса.",
        "**Собственное:** регистры, счётчик команд, стек (по умолчанию 8 МиБ виртуальной памяти в Linux), локальные данные потока (`thread_local` / `__thread`), маска сигналов.",
        "**Планирование.** В Linux потоки — единицы планирования ядра (задачи): ядро распределяет их по ядрам процессора.",
        "**Опасности:** гонки данных, взаимные блокировки, зависимость от порядка — отдельная тема «Конкурентность и планирование» (ссылка в разделе «Связанные темы»).",
      ),
      h("Три модели «параллельности» в популярных средах"),
      table(
        ["Среда", "Что даёт", "Ограничение"],
        [
          ["C / Java / Rust: потоки ядра", "Настоящий параллелизм на нескольких ядрах, общая память", "Синхронизация вручную; гонки"],
          ["CPython: `threading`", "Конкурентность для ввода-вывода (ожидание отпускает GIL)", "GIL: байт-код выполняет один поток, вычисления не ускоряются"],
          ["CPython: `multiprocessing`", "Параллельные вычисления в отдельных процессах", "Копирование данных между процессами, запуск дороже"],
          ["Node.js", "Один поток JavaScript + пул потоков libuv + `worker_threads`, `child_process`", "Объекты между воркерами копируются (или передаются), общая память — только `SharedArrayBuffer`"],
        ],
        "Модели параллельности",
      ),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `#!/bin/bash
# Процессы глазами оболочки: конвейеры, коды выхода, фоновые задачи, сигналы
printf 'banana\\napple\\ncherry\\n' | sort | head -2 | tr 'a-z' 'A-Z' | paste -sd,
echo "конвейер из 5 команд вернул статус: $?"

false; echo "false → \\$? = $?"
true;  echo "true  → \\$? = $?"
(exit 42); echo "подоболочка (exit 42) → \\$? = $?"
nonexistent_cmd_xyz 2>/dev/null; echo "команда не найдена → \\$? = $?"

seq 1 100000000 | head -1 >/dev/null; echo "seq 1 100000000 | head -1 → статусы стадий: \${PIPESTATUS[*]} (141 = 128 + 13: seq убит сигналом SIGPIPE, когда head закрыл вход)"
false | true; echo "false | true (без pipefail) → $?"
set -o pipefail
false | true; echo "false | true (с pipefail)   → $?"
set +o pipefail

sleep 5 & pid=$!
kill -0 $pid 2>/dev/null && echo "фоновый процесс жив: да"
kill $pid; wait $pid 2>/dev/null; echo "убит SIGTERM → код $? (128 + 15)"
sleep 5 & pid=$!
kill -9 $pid; wait $pid 2>/dev/null; echo "убит SIGKILL → код $? (128 + 9)"

( sleep 0.2; echo "из фоновой подоболочки" ) &
echo "оболочка продолжила работу, не дожидаясь"
wait
echo "после wait все фоновые задачи завершены"

x=1; ( x=2 ); echo "подоболочка не меняет переменную родителя: x = $x"
echo "pid оболочки и подоболочки различаются: $([ "$$" != "$(sh -c 'echo $$')" ] && echo да || echo нет)"`,
        [
          { line: 3, text: "Конвейер: `printf`, `sort`, `head`, `tr`, `paste` — отдельные процессы, соединённые каналами." },
          { line: 4, text: "`$?` — код выхода последней команды." },
          { line: 6, text: "`false` возвращает 1: ненулевой код означает неудачу — на этом строятся CI и хуки Git." },
          { line: 8, text: "Подоболочка `( … )` — отдельный процесс: её `exit 42` не завершает родителя." },
          { line: 9, text: "127 — стандартный код «команда не найдена»." },
          { line: 11, text: "`seq … | head -1`: `head` закрывает вход, `seq` получает `SIGPIPE`; `PIPESTATUS` показывает статусы всех стадий." },
          { line: 12, text: "Без `pipefail` статус конвейера — статус последней стадии, ошибки предыдущих теряются." },
          { line: 17, text: "`&` запускает процесс в фоне, `$!` — его pid." },
          { line: 19, text: "`kill` по умолчанию посылает `SIGTERM`; `wait` возвращает код `128 + 15 = 143`." },
        ],
        "Процессы в оболочке",
      ),
    ]),

    section("minimal-example", [
      h("Жизнь процесса: fork, wait, зомби, сигналы, pipe, exec"),
      code("c", `#define _POSIX_C_SOURCE 200809L
// Процессы в Linux: fork, copy-on-write, wait, зомби, сигналы, pipe, exec.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <ctype.h>
#include <sys/wait.h>
#include <time.h>

static int x = 1;                 // глобальная переменная: после fork у каждого процесса своя копия
static volatile sig_atomic_t got_usr1 = 0;
static void on_usr1(int s) { (void)s; got_usr1 = 1; }

static void pause_ms(int ms) { struct timespec t = { 0, ms * 1000000L }; nanosleep(&t, 0); }
static char state_of(pid_t p) {   // буква состояния из /proc/<pid>/stat: после ")" идёт пробел и состояние
    char path[64], buf[512];
    snprintf(path, sizeof path, "/proc/%d/stat", (int)p);
    FILE *f = fopen(path, "r");
    if (!f) return '-';
    size_t n = fread(buf, 1, sizeof buf - 1, f); fclose(f); buf[n] = 0;
    char *c = strrchr(buf, ')');
    return c ? c[2] : '?';
}

int main(void) {
    setvbuf(stdout, 0, _IONBF, 0);
    pid_t me = getpid();

    // 1. fork и COW
    pid_t c = fork();
    if (c == 0) { x = 2; _exit(7); }
    int st; waitpid(c, &st, 0);
    printf("1) fork: у потомка свой pid (отличается от родителя): %s;  после x = 2 в потомке у родителя x = %d\\n", c != me ? "да" : "нет", x);
    printf("   код завершения потомка: WIFEXITED = %d, WEXITSTATUS = %d\\n", WIFEXITED(st), WEXITSTATUS(st));

    // 2. ppid потомка
    int p[2]; pipe(p);
    c = fork();
    if (c == 0) { pid_t pp = getppid(); write(p[1], &pp, sizeof pp); _exit(0); }
    pid_t child_ppid; read(p[0], &child_ppid, sizeof child_ppid); waitpid(c, 0, 0); close(p[0]); close(p[1]);
    printf("2) getppid() потомка равен pid родителя: %s\\n", child_ppid == me ? "да" : "нет");

    // 3. зомби
    c = fork();
    if (c == 0) _exit(0);
    pause_ms(200);
    char z1 = state_of(c);
    waitpid(c, 0, 0);
    char z2 = state_of(c);
    printf("3) завершившийся потомок до wait: состояние '%c' (Z — зомби); после wait: '%c' (запись удалена)\\n", z1, z2);

    // 4. сигналы
    c = fork();
    if (c == 0) { for (;;) pause(); }
    pause_ms(100);
    kill(c, SIGTERM); waitpid(c, &st, 0);
    printf("4) SIGTERM по умолчанию завершает: WIFSIGNALED = %d, WTERMSIG = %d (SIGTERM = %d)\\n", WIFSIGNALED(st), WTERMSIG(st), SIGTERM);
    c = fork();
    if (c == 0) { signal(SIGTERM, SIG_IGN); for (;;) pause(); }
    pause_ms(100);
    kill(c, SIGTERM); pause_ms(100);
    char ign = state_of(c);
    kill(c, SIGKILL); waitpid(c, &st, 0);
    printf("   с игнорированием SIGTERM потомок жив (состояние '%c'); SIGKILL перехватить нельзя: WTERMSIG = %d (SIGKILL = %d)\\n", ign, WTERMSIG(st), SIGKILL);
    signal(SIGUSR1, on_usr1);
    c = fork();
    if (c == 0) { for (int i = 0; i < 100 && !got_usr1; i++) pause_ms(20); _exit(got_usr1 ? 42 : 1); }
    pause_ms(100);
    kill(c, SIGUSR1); waitpid(c, &st, 0);
    printf("   обработчик SIGUSR1 в потомке (унаследован после fork) сработал: код выхода %d\\n", WEXITSTATUS(st));

    // 5. pipe между процессами
    int a[2], b[2]; pipe(a); pipe(b);
    c = fork();
    if (c == 0) {
        close(a[1]); close(b[0]);
        char buf[64]; ssize_t n = read(a[0], buf, sizeof buf);
        for (ssize_t i = 0; i < n; i++) buf[i] = (char)toupper((unsigned char)buf[i]);
        write(b[1], buf, n); _exit(0);
    }
    close(a[0]); close(b[1]);
    write(a[1], "hello from parent", 17);
    char out[64] = {0}; ssize_t n = read(b[0], out, sizeof out - 1); waitpid(c, 0, 0);
    printf("5) pipe: родитель отправил \\"hello from parent\\", потомок вернул \\"%.*s\\"\\n", (int)n, out);
    close(a[1]); close(b[0]);

    // 6. fork + exec
    int e[2]; pipe(e);
    c = fork();
    if (c == 0) { dup2(e[1], 1); close(e[0]); close(e[1]); execlp("echo", "echo", "hello from exec", (char *)0); _exit(127); }
    close(e[1]);
    char eb[64] = {0}; n = read(e[0], eb, sizeof eb - 1); waitpid(c, &st, 0); close(e[0]);
    printf("6) fork + exec(\\"echo\\"): родитель прочитал из канала \\"%.*s\\", код выхода %d\\n", (int)n - 1, eb, WEXITSTATUS(st));
    c = fork();
    if (c == 0) { execlp("/nonexistent/program", "x", (char *)0); _exit(127); }
    waitpid(c, &st, 0);
    printf("   exec несуществующей программы: потомок вернулся с кодом %d (договорённость оболочек: 127 — команда не найдена)\\n", WEXITSTATUS(st));
    return 0;
}`, { filename: "01-processes.c", collapsed: true }),
      code("text", `1) fork: у потомка свой pid (отличается от родителя): да;  после x = 2 в потомке у родителя x = 1
   код завершения потомка: WIFEXITED = 1, WEXITSTATUS = 7
2) getppid() потомка равен pid родителя: да
3) завершившийся потомок до wait: состояние 'Z' (Z — зомби); после wait: '-' (запись удалена)
4) SIGTERM по умолчанию завершает: WIFSIGNALED = 1, WTERMSIG = 15 (SIGTERM = 15)
   с игнорированием SIGTERM потомок жив (состояние 'S'); SIGKILL перехватить нельзя: WTERMSIG = 9 (SIGKILL = 9)
   обработчик SIGUSR1 в потомке (унаследован после fork) сработал: код выхода 42
5) pipe: родитель отправил "hello from parent", потомок вернул "HELLO FROM PARENT"
6) fork + exec("echo"): родитель прочитал из канала "hello from exec", код выхода 0
   exec несуществующей программы: потомок вернулся с кодом 127 (договорённость оболочек: 127 — команда не найдена)`, { filename: "Linux, gcc: жизненный цикл процесса" }),
      ul(
        "**fork.** Потомок имеет свой `pid`; его `getppid()` равен pid родителя. После `x = 2` в потомке у родителя остаётся `x = 1` — адресные пространства независимы. Код выхода потомка `7` родитель получает через `waitpid` (`WEXITSTATUS`).",
        "**Зомби.** Потомок, завершившийся до `wait`, остаётся в состоянии `Z`; после `waitpid` записи в `/proc` нет. Копить зомби — утечка записей таблицы процессов.",
        "**Сигналы.** `SIGTERM` завершает процесс по умолчанию (`WTERMSIG = 15`); при `SIG_IGN` процесс остаётся жив (`S` — спит), а `SIGKILL` (9) перехватить невозможно. Обработчик `SIGUSR1`, установленный до `fork`, сработал в потомке (код выхода 42).",
        "**pipe.** Родитель отправил `hello from parent`, потомок вернул строку заглавными буквами — обмен через ядро без общей памяти.",
        "**fork + exec.** Потомок заменил себя программой `echo`, его вывод родитель прочитал из канала; неудачный `exec` вернул код `127`.",
      ),
      h("Конвейер, коды выхода и сигналы в оболочке"),
      code("bash", `#!/bin/bash
# Процессы глазами оболочки: конвейеры, коды выхода, фоновые задачи, сигналы
printf 'banana\\napple\\ncherry\\n' | sort | head -2 | tr 'a-z' 'A-Z' | paste -sd,
echo "конвейер из 5 команд вернул статус: $?"

false; echo "false → \\$? = $?"
true;  echo "true  → \\$? = $?"
(exit 42); echo "подоболочка (exit 42) → \\$? = $?"
nonexistent_cmd_xyz 2>/dev/null; echo "команда не найдена → \\$? = $?"

seq 1 100000000 | head -1 >/dev/null; echo "seq 1 100000000 | head -1 → статусы стадий: \${PIPESTATUS[*]} (141 = 128 + 13: seq убит сигналом SIGPIPE, когда head закрыл вход)"
false | true; echo "false | true (без pipefail) → $?"
set -o pipefail
false | true; echo "false | true (с pipefail)   → $?"
set +o pipefail

sleep 5 & pid=$!
kill -0 $pid 2>/dev/null && echo "фоновый процесс жив: да"
kill $pid; wait $pid 2>/dev/null; echo "убит SIGTERM → код $? (128 + 15)"
sleep 5 & pid=$!
kill -9 $pid; wait $pid 2>/dev/null; echo "убит SIGKILL → код $? (128 + 9)"

( sleep 0.2; echo "из фоновой подоболочки" ) &
echo "оболочка продолжила работу, не дожидаясь"
wait
echo "после wait все фоновые задачи завершены"

x=1; ( x=2 ); echo "подоболочка не меняет переменную родителя: x = $x"
echo "pid оболочки и подоболочки различаются: $([ "$$" != "$(sh -c 'echo $$')" ] && echo да || echo нет)"`, { filename: "07-shell.sh", collapsed: true }),
      code("text", `APPLE,BANANA
конвейер из 5 команд вернул статус: 0
false → $? = 1
true  → $? = 0
подоболочка (exit 42) → $? = 42
команда не найдена → $? = 127
seq 1 100000000 | head -1 → статусы стадий: 141 0 (141 = 128 + 13: seq убит сигналом SIGPIPE, когда head закрыл вход)
false | true (без pipefail) → 0
false | true (с pipefail)   → 1
фоновый процесс жив: да
убит SIGTERM → код 143 (128 + 15)
убит SIGKILL → код 137 (128 + 9)
оболочка продолжила работу, не дожидаясь
из фоновой подоболочки
после wait все фоновые задачи завершены
подоболочка не меняет переменную родителя: x = 1
pid оболочки и подоболочки различаются: да`, { filename: "bash: конвейеры, статусы и сигналы" }),
      ul(
        "Конвейер из пяти команд вернул `0`; коды `1`, `0`, `42` и `127` соответствуют `false`, `true`, `exit 42` и ненайденной команде.",
        "`false | true` без `pipefail` возвращает 0 — ошибка первой стадии потеряна; с `pipefail` — 1. Это одна из причин, почему в сценариях CI включают `set -o pipefail`.",
        "`seq 1 100000000 | head -1`: `PIPESTATUS` — `141 0`: `seq` убит `SIGPIPE`, когда `head` закрыл вход.",
        "Процесс, убитый `SIGTERM`, даёт код `143`, `SIGKILL` — `137`; именно эти числа видны в логах контейнеров при остановке и при нехватке памяти (OOM).",
      ),
    ]),

    section("detailed-example", [
      h("Потоки: общая память, собственные стеки и гонка данных"),
      code("c", `#define _POSIX_C_SOURCE 200809L
// Потоки: общая память, собственные стеки, локальные для потока данные, гонка данных.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <pthread.h>
#include <unistd.h>
#include <sys/syscall.h>

static int shared = 0;                      // общая переменная
static __thread int tls = 0;                // у каждого потока своя копия
static volatile long racy = 0;              // без синхронизации
static long locked = 0; static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static long atomic_ctr = 0;
static void *addr_of_local[4];

static int threads_in_status(void) {
    FILE *f = fopen("/proc/self/status", "r"); char line[256]; int n = -1;
    while (f && fgets(line, sizeof line, f)) if (sscanf(line, "Threads: %d", &n) == 1) break;
    if (f) fclose(f);
    return n;
}
static void *w1(void *arg) {
    long id = (long)arg;
    int local = (int)id;                    // локальная переменная — на стеке потока
    addr_of_local[id] = &local;
    shared = 100 + (int)id;                 // видно всем
    tls = 10 * ((int)id + 1);               // видно только этому потоку
    usleep(20000);
    return (void *)(intptr_t)tls;
}
#define ITER 1000000
static void *w2(void *arg) {
    (void)arg;
    for (int i = 0; i < ITER; i++) { racy++; pthread_mutex_lock(&mu); locked++; pthread_mutex_unlock(&mu); __atomic_fetch_add(&atomic_ctr, 1, __ATOMIC_SEQ_CST); }
    return 0;
}
int main(void) {
    printf("до создания потоков в процессе потоков: %d\\n", threads_in_status());
    pthread_t t[4];
    tls = 5;
    for (long i = 0; i < 3; i++) pthread_create(&t[i], 0, w1, (void *)i);
    usleep(10000);
    printf("после создания трёх потоков (поток main + 3): %d\\n", threads_in_status());
    long r[3];
    for (int i = 0; i < 3; i++) { void *v; pthread_join(t[i], &v); r[i] = (long)(intptr_t)v; }
    printf("значения TLS, вернувшиеся из потоков: %ld %ld %ld;  TLS в main по-прежнему %d\\n", r[0], r[1], r[2], tls);
    printf("общая переменная после потоков принадлежит последнему записавшему: значение в диапазоне 100..102: %s\\n", (shared >= 100 && shared <= 102) ? "да" : "нет");
    int distinct = 1;
    for (int i = 0; i < 3; i++) for (int j = i + 1; j < 3; j++) if (addr_of_local[i] == addr_of_local[j]) distinct = 0;
    printf("локальные переменные трёх потоков имеют разные адреса (разные стеки): %s\\n", distinct ? "да" : "нет");

    printf("\\nчетыре потока по %d увеличений трёх счётчиков:\\n", ITER);
    for (int i = 0; i < 4; i++) pthread_create(&t[i], 0, w2, 0);
    for (int i = 0; i < 4; i++) pthread_join(t[i], 0);
    long expect = 4L * ITER;
    printf("  ожидается %ld\\n  с мьютексом:   %ld (%s)\\n  атомарно:      %ld (%s)\\n", expect, locked, locked == expect ? "верно" : "ОШИБКА", atomic_ctr, atomic_ctr == expect ? "верно" : "ОШИБКА");
    printf("  без синхронизации потеряны обновления (результат меньше ожидаемого): %s\\n", racy < expect ? "да" : "нет");
    return 0;
}`, { filename: "02-threads.c", collapsed: true }),
      code("text", `до создания потоков в процессе потоков: 1
после создания трёх потоков (поток main + 3): 4
значения TLS, вернувшиеся из потоков: 10 20 30;  TLS в main по-прежнему 5
общая переменная после потоков принадлежит последнему записавшему: значение в диапазоне 100..102: да
локальные переменные трёх потоков имеют разные адреса (разные стеки): да

четыре потока по 1000000 увеличений трёх счётчиков:
  ожидается 4000000
  с мьютексом:   4000000 (верно)
  атомарно:      4000000 (верно)
  без синхронизации потеряны обновления (результат меньше ожидаемого): да`, { filename: "потоки POSIX: что общее, что своё" }),
      ul(
        "`Threads` в `/proc/self/status`: 1 до создания и 4 после (main + 3). Общая переменная `shared` видна всем потокам, а `__thread`-переменные у каждого потока свои: из потоков вернулись 10, 20, 30, в main значение по-прежнему 5.",
        "Локальные переменные потоков лежат по разным адресам — у каждого свой стек.",
        "Четыре потока по 1 000 000 увеличений: счётчик под мьютексом и атомарный дают ровно 4 000 000, а `volatile long` без синхронизации теряет обновления (`чтение → сложение → запись` у разных потоков перемежается). Точное значение при гонке меняется от запуска к запуску, поэтому скрипт печатает только факт потери.",
      ),
      h("Сколько стоит поток: память и создание"),
      code("c", `#define _POSIX_C_SOURCE 200809L
// Сколько памяти «стоят» потоки: виртуальная резервируется сразу, физическая — по мере использования стека.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#include <unistd.h>

static pthread_barrier_t up, down;
static long kb(const char *key) {
    FILE *f = fopen("/proc/self/status", "r"); char line[256]; long v = -1;
    size_t k = strlen(key);
    while (f && fgets(line, sizeof line, f)) if (!strncmp(line, key, k) && line[k] == ':') { v = atol(line + k + 1); break; }
    if (f) fclose(f);
    return v;
}
static void *worker(void *x) { (void)x; volatile char small[256]; small[0] = 1; pthread_barrier_wait(&up); pthread_barrier_wait(&down); return 0; }
#define N 200
int main(void) {
    long vm0 = kb("VmSize"), rss0 = kb("VmRSS"), th0 = kb("Threads");
    pthread_barrier_init(&up, 0, N + 1); pthread_barrier_init(&down, 0, N + 1);
    pthread_t t[N];
    for (int i = 0; i < N; i++) pthread_create(&t[i], 0, worker, 0);
    pthread_barrier_wait(&up);                       // все потоки запущены и ждут
    long vm1 = kb("VmSize"), rss1 = kb("VmRSS"), th1 = kb("Threads");
    pthread_barrier_wait(&down);
    for (int i = 0; i < N; i++) pthread_join(t[i], 0);
    printf("потоков в процессе: было %ld, стало %ld\\n", th0, th1);
    printf("виртуальная память выросла в среднем на поток не менее чем на 8 МиБ (стек по умолчанию): %s\\n", (vm1 - vm0) >= (long)N * 8192 * 95 / 100 ? "да" : "нет");
    printf("физическая память (RSS) выросла в среднем на поток менее чем на 256 КиБ: %s\\n", (rss1 - rss0) < (long)N * 256 ? "да" : "нет");
    fprintf(stderr, "VmSize +%ld КиБ (%.2f МиБ на поток), VmRSS +%ld КиБ (%.0f КиБ на поток)\\n", vm1 - vm0, (vm1 - vm0) / 1024.0 / N, rss1 - rss0, (double)(rss1 - rss0) / N);
    return 0;
}`, { filename: "06-thread-memory.c", collapsed: true }),
      code("text", `потоков в процессе: было 1, стало 201
виртуальная память выросла в среднем на поток не менее чем на 8 МиБ (стек по умолчанию): да
физическая память (RSS) выросла в среднем на поток менее чем на 256 КиБ: да`, { filename: "200 потоков: виртуальная и физическая память" }),
      code("bash", `#!/bin/bash
# Ограничения и устройство процессов в Linux (значения тестовой машины)
echo "размер стека потока по умолчанию (ulimit -s), КиБ: $(ulimit -s)"
echo "лимит открытых файлов (ulimit -n):                  $(ulimit -n)"
echo "максимальный pid (/proc/sys/kernel/pid_max):        $(cat /proc/sys/kernel/pid_max)"
echo "максимум потоков в системе (threads-max):           $(cat /proc/sys/kernel/threads-max)"
echo "число ядер (nproc):                                 $(nproc)"
echo "состояния процессов в /proc/<pid>/stat: R (выполняется), S (спит), D (непрерываемый сон), T (остановлен), Z (зомби)"
echo "родитель процесса 1: $(awk '{print $4}' /proc/1/stat)  (у init нет родителя)"
echo "поля /proc/self/status: $(grep -E '^(Name|State|Pid|PPid|Threads|VmRSS|voluntary_ctxt_switches)' /proc/self/status | cut -d: -f1 | tr '\\n' ' ')"`, { filename: "00-limits.sh", collapsed: true }),
      code("text", `размер стека потока по умолчанию (ulimit -s), КиБ: 8192
лимит открытых файлов (ulimit -n):                  20000
максимальный pid (/proc/sys/kernel/pid_max):        32768
максимум потоков в системе (threads-max):           128601
число ядер (nproc):                                 4
состояния процессов в /proc/<pid>/stat: R (выполняется), S (спит), D (непрерываемый сон), T (остановлен), Z (зомби)
родитель процесса 1: 0  (у init нет родителя)
поля /proc/self/status: Name State Pid PPid VmRSS Threads voluntary_ctxt_switches `, { filename: "ограничения тестовой машины" }),
      ul(
        "200 потоков: число потоков процесса стало 201; виртуальная память выросла на `8196 КиБ` на поток (8 МиБ стека и страница-ограничитель), а физическая (RSS) — только на 9 КиБ на поток: страницы стека выделяются при первом обращении.",
        "Ограничения тестовой машины: стек потока 8192 КиБ, 20 000 открытых файлов на процесс, `pid_max = 32768`, `threads-max = 128601`, 4 ядра. Поэтому «десятки тысяч потоков» упираются в адресное пространство и лимиты задолго до исчерпания физической памяти.",
      ),
      h("Сколько стоит создание и переключение"),
      code("c", `#define _POSIX_C_SOURCE 200809L
// Стоимость: создание потока и процесса, системный вызов, передача управления через pipe. Время — в stderr.
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <pthread.h>
#include <sys/wait.h>
#include <sys/syscall.h>
#include <time.h>
#include <sched.h>
static double now(void) { struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t); return t.tv_sec + t.tv_nsec * 1e-9; }
static void *noop(void *x) { return x; }
static volatile long sink;

#define NCREATE 2000
static double thread_create(void) {
    double t = now();
    for (int i = 0; i < NCREATE; i++) { pthread_t th; pthread_create(&th, 0, noop, 0); pthread_join(th, 0); }
    return (now() - t) / NCREATE;
}
static double process_create(void) {
    double t = now();
    for (int i = 0; i < NCREATE; i++) { pid_t c = fork(); if (c == 0) _exit(0); waitpid(c, 0, 0); }
    return (now() - t) / NCREATE;
}
static double syscall_cost(void) {
    long n = 2000000; double t = now();
    for (long i = 0; i < n; i++) sink = syscall(SYS_getppid);
    return (now() - t) / n;
}
// пинг-понг через два канала: round trip = 2 переключения контекста
#define ROUNDS 100000
static int ab[2], ba[2];
static void *echo_thread(void *x) { (void)x; char c; for (int i = 0; i < ROUNDS; i++) { if (read(ab[0], &c, 1) != 1) break; if (write(ba[1], &c, 1) != 1) break; } return 0; }
static double pingpong_threads(void) {
    if (pipe(ab) || pipe(ba)) return -1;
    pthread_t th; pthread_create(&th, 0, echo_thread, 0);
    char c = 'x'; double t = now();
    for (int i = 0; i < ROUNDS; i++) { if (write(ab[1], &c, 1) != 1 || read(ba[0], &c, 1) != 1) break; }
    double e = now() - t; pthread_join(th, 0);
    close(ab[0]); close(ab[1]); close(ba[0]); close(ba[1]);
    return e / ROUNDS;
}
static double pingpong_processes(void) {
    if (pipe(ab) || pipe(ba)) return -1;
    pid_t c = fork();
    if (c == 0) { echo_thread(0); _exit(0); }
    char ch = 'x'; double t = now();
    for (int i = 0; i < ROUNDS; i++) { if (write(ab[1], &ch, 1) != 1 || read(ba[0], &ch, 1) != 1) break; }
    double e = now() - t; waitpid(c, 0, 0);
    close(ab[0]); close(ab[1]); close(ba[0]); close(ba[1]);
    return e / ROUNDS;
}
int main(void) {
    double tt = 1e9, tp = 1e9, ts = 1e9, pt = 1e9, pp = 1e9;
    for (int r = 0; r < 3; r++) {
        double v;
        if ((v = thread_create()) < tt) tt = v;
        if ((v = process_create()) < tp) tp = v;
        if ((v = syscall_cost()) < ts) ts = v;
        if ((v = pingpong_threads()) < pt) pt = v;
        if ((v = pingpong_processes()) < pp) pp = v;
    }
    fprintf(stderr, "создание потока %.1f мкс, процесса (fork) %.1f мкс, системный вызов %.0f нс, round trip по pipe: потоки %.1f мкс, процессы %.1f мкс\\n", tt * 1e6, tp * 1e6, ts * 1e9, pt * 1e6, pp * 1e6);
    printf("создание процесса (fork + wait) дороже создания потока (create + join): %s\\n", tp > tt ? "да" : "нет");
    printf("системный вызов дешевле создания потока более чем в 20 раз: %s\\n", ts * 20 < tt ? "да" : "нет");
    printf("передача управления между двумя потоками через pipe укладывается в 100 мкс на круг: %s\\n", pt < 100e-6 ? "да" : "нет");
    printf("передача управления между двумя процессами через pipe укладывается в 100 мкс на круг: %s\\n", pp < 100e-6 ? "да" : "нет");
    return 0;
}`, { filename: "03-costs.c", collapsed: true }),
      code("text", `создание процесса (fork + wait) дороже создания потока (create + join): да
системный вызов дешевле создания потока более чем в 20 раз: да
передача управления между двумя потоками через pipe укладывается в 100 мкс на круг: да
передача управления между двумя процессами через pipe укладывается в 100 мкс на круг: да`, { filename: "создание потока и процесса, системный вызов, переключение" }),
      ul(
        "Калибровочные значения тестовой машины (виртуальная машина, 4 ядра): создание и ожидание потока — около 54 мкс, `fork` + `wait` — около 196 мкс (в 3,7 раза дороже), системный вызов `getppid` — около 103 нс, один обмен «туда и обратно» через pipe между двумя потоками — около 27,7 мкс, между двумя процессами — около 27,5 мкс.",
        "Системный вызов дешевле создания потока более чем в 20 раз; создание процесса — самая дорогая из этих операций. Поэтому серверы используют пулы потоков и процессов, а не запускают новый на каждый запрос.",
        "Передача управления через pipe между двумя потоками и между двумя процессами в этом замере оказалась одинаковой: время определяется системными вызовами и пробуждением потока, а не сменой адресного пространства. Различие процессов и потоков проявляется в другом — в кешах и TLB при переключениях между разными задачами, а не в этом микротесте.",
      ),
    ]),

    section("analysis", [
      h("Сколько процессов создаст код: fork как умножение"),
      code("c", `#define _POSIX_C_SOURCE 200809L
// Сколько процессов создаст код с fork? Каждый процесс в конце записывает по байту в общий канал, родитель их считает.
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

static int fd[2];
static void report(void) { char c = '.'; if (write(fd[1], &c, 1) != 1) _exit(1); }

static int count(void (*body)(void)) {
    if (pipe(fd)) return -1;
    pid_t root = fork();
    if (root == 0) {                      // корень эксперимента — отдельный процесс, чтобы подождать всех потомков
        body();
        report();
        while (wait(0) > 0) {}            // ждём своих потомков
        _exit(0);
    }
    close(fd[1]);
    while (waitpid(-1, 0, 0) > 0) {}      // ждём процесс-корень
    char buf[64]; int total = 0, n;
    // читаем, пока все процессы-писатели не закроют канал (то есть не завершатся)
    while ((n = read(fd[0], buf, sizeof buf)) > 0) total += n;
    close(fd[0]);
    return total;
}
static void three_forks(void) { fork(); fork(); fork(); }
static void if_fork(void) { if (fork()) fork(); }
static void loop_fork(void) { for (int i = 0; i < 3; i++) fork(); }
static void and_fork(void) { fork() && fork(); }
static void or_fork(void) { fork() || fork(); }
int main(void) {
    printf("fork(); fork(); fork();                  → процессов: %d (2^3)\\n", count(three_forks));
    printf("if (fork()) fork();                      → процессов: %d\\n", count(if_fork));
    printf("for (i = 0; i < 3; i++) fork();          → процессов: %d\\n", count(loop_fork));
    printf("fork() && fork();                        → процессов: %d\\n", count(and_fork));
    printf("fork() || fork();                        → процессов: %d\\n", count(or_fork));
    return 0;
}`, { filename: "08-fork-count.c", collapsed: true }),
      code("text", `fork(); fork(); fork();                  → процессов: 8 (2^3)
if (fork()) fork();                      → процессов: 3
for (i = 0; i < 3; i++) fork();          → процессов: 8
fork() && fork();                        → процессов: 3
fork() || fork();                        → процессов: 3`, { filename: "число процессов для типичных головоломок" }),
      ul(
        "Каждый `fork` удваивает число процессов, выполняющих следующий код: `fork(); fork(); fork();` — 8 процессов (`2³`), цикл из трёх `fork` — тоже 8.",
        "`if (fork()) fork();` — 3, `fork() && fork();` — 3 (потомок первого `fork` получает 0 и пропускает второй), `fork() || fork();` — 3 (родитель получает ненулевое значение и пропускает второй). Классическая «fork-бомба» — бесконечная рекурсия этого удвоения.",
      ),
      h("Python: потоки против процессов (GIL)"),
      code("python", `# Потоки и процессы в CPython 3.11: GIL мешает ускорять вычисления потоками, но не ввод-вывод. Время — в stderr.
import sys, time, threading, multiprocessing as mp

def cpu(n):                    # вычисления на чистом Python
    s = 0
    for i in range(n):
        s += i * i % 7
    return s

def io(sec):                   # ожидание: блокирующий вызов отпускает GIL
    time.sleep(sec)

def timed(fn):
    best = 1e9; r = None
    for _ in range(3):
        t = time.perf_counter(); r = fn(); best = min(best, time.perf_counter() - t)
    return best, r

N, W = 3_000_000, 4

def sequential(): return [cpu(N) for _ in range(W)]
def with_threads():
    out = [None] * W
    def run(k): out[k] = cpu(N)
    th = [threading.Thread(target=run, args=(k,)) for k in range(W)]
    [t.start() for t in th]; [t.join() for t in th]
    return out
def with_processes():
    with mp.get_context("fork").Pool(W) as pool:
        return pool.map(cpu, [N] * W)

def io_seq():
    for _ in range(W): io(0.2)
def io_threads():
    th = [threading.Thread(target=io, args=(0.2,)) for _ in range(W)]
    [t.start() for t in th]; [t.join() for t in th]

if __name__ == "__main__":
    ts, rs = timed(sequential); tt, rt = timed(with_threads); tp, rp = timed(with_processes)
    ios, _ = timed(io_seq); iot, _ = timed(io_threads)
    print("Python", sys.version.split()[0], " ядер:", mp.cpu_count())
    print("результаты вычислений совпадают во всех трёх вариантах:", "да" if rs == rt == rp else "нет")
    print("4 задачи на потоках не быстрее последовательного выполнения (выигрыш меньше 1,3 раза):", "да" if ts / tt < 1.3 else "нет")
    print("4 задачи на процессах быстрее последовательного выполнения более чем в 2 раза:", "да" if ts / tp > 2 else "нет")
    print("4 ожидания по 0,2 с в потоках занимают меньше половины последовательного времени:", "да" if iot < 0.5 * ios else "нет")
    print("последовательные ожидания заняли не меньше 0,8 с:", "да" if ios >= 0.8 else "нет")
    print(f"seq {ts:.2f} thr {tt:.2f} proc {tp:.2f} | io seq {ios:.2f} thr {iot:.2f}", file=sys.stderr)`, { filename: "04-python-gil.py", collapsed: true }),
      code("text", `Python 3.11.15  ядер: 4
результаты вычислений совпадают во всех трёх вариантах: да
4 задачи на потоках не быстрее последовательного выполнения (выигрыш меньше 1,3 раза): да
4 задачи на процессах быстрее последовательного выполнения более чем в 2 раза: да
4 ожидания по 0,2 с в потоках занимают меньше половины последовательного времени: да
последовательные ожидания заняли не меньше 0,8 с: да`, { filename: "CPython 3.11: четыре вычислительные задачи и четыре ожидания" }),
      ul(
        "Калибровка: четыре вычислительные задачи последовательно — 0,50 с, в четырёх потоках — 0,59 с (**не быстрее, даже чуть медленнее**), в четырёх процессах — 0,17 с (**быстрее в 2,9 раза**).",
        "Четыре ожидания по 0,2 с: последовательно — 0,80 с, в потоках — 0,20 с (**в 4 раза быстрее**): `time.sleep` и ввод-вывод отпускают GIL.",
        "Вывод: потоки CPython годятся для ввода-вывода (сеть, диск), для вычислений нужны процессы (`multiprocessing`, `concurrent.futures.ProcessPoolExecutor`), расширения на C, отпускающие GIL, или другой язык.",
      ),
      h("Node.js: воркеры, общая память и процессы"),
      code("js", `// Node.js: потоки-«воркеры», общая память и передача сообщений; процессы через child_process.
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { spawnSync } from "node:child_process";

const ITER = 500_000, W = 4;

if (!isMainThread) {
  const view = new Int32Array(workerData.sab);
  if (workerData.kind === "atomic") for (let i = 0; i < ITER; i++) Atomics.add(view, 0, 1);
  else if (workerData.kind === "racy") for (let i = 0; i < ITER; i++) view[1] = view[1] + 1;   // чтение, сложение, запись — не атомарно
  else if (workerData.kind === "msg") parentPort.postMessage({ len: workerData.payload.length, same: false });
  if (workerData.kind !== "msg") parentPort.postMessage("done");
} else {
  const sab = new SharedArrayBuffer(8);
  const view = new Int32Array(sab);
  const run = (kind, extra = {}) => new Promise((res) => {
    const w = new Worker(new URL(import.meta.url), { workerData: { sab, kind, ...extra } });
    w.on("message", res);
  });
  await Promise.all(Array.from({ length: W }, () => run("atomic")));
  console.log("атомарно (Atomics.add):", view[0], "из ожидаемых", W * ITER, view[0] === W * ITER ? "(верно)" : "(ошибка)");
  await Promise.all(Array.from({ length: W }, () => run("racy")));
  console.log("без Atomics: результат меньше ожидаемого (потеряны обновления):", view[1] < W * ITER ? "да" : "нет");

  // сообщения копируются; ArrayBuffer можно передать без копирования
  const buf = new ArrayBuffer(1024);
  const copy = structuredClone(buf);
  console.log("\\nstructuredClone: исходный буфер", buf.byteLength, "байт, копия", copy.byteLength, "байт, это разные объекты:", buf !== copy);
  const moved = structuredClone(buf, { transfer: [buf] });
  console.log("с transfer: исходный буфер после передачи", buf.byteLength, "байт (отсоединён), новый владелец", moved.byteLength, "байт");

  // процесс: отдельное адресное пространство и код выхода
  const r = spawnSync(process.execPath, ["-e", "process.stdout.write(String(process.pid)); process.exit(3)"], { encoding: "utf8" });
  console.log("\\nдочерний процесс node: pid отличается от родительского: " + (Number(r.stdout) !== process.pid ? "да" : "нет") + ", код выхода: " + r.status);
  const r2 = spawnSync(process.execPath, ["-e", "process.kill(process.pid, 'SIGKILL')"], { encoding: "utf8" });
  console.log("процесс, убитый сигналом: status = " + r2.status + ", signal = " + r2.signal);
}`, { filename: "05-node-workers.mjs", collapsed: true }),
      code("text", `атомарно (Atomics.add): 2000000 из ожидаемых 2000000 (верно)
без Atomics: результат меньше ожидаемого (потеряны обновления): да

structuredClone: исходный буфер 1024 байт, копия 1024 байт, это разные объекты: true
с transfer: исходный буфер после передачи 0 байт (отсоединён), новый владелец 1024 байт

дочерний процесс node: pid отличается от родительского: да, код выхода: 3
процесс, убитый сигналом: status = null, signal = SIGKILL`, { filename: "worker_threads, SharedArrayBuffer, Atomics, child_process" }),
      ul(
        "Четыре воркера по 500 000 `Atomics.add` на общем `SharedArrayBuffer` дали точно 2 000 000; тот же цикл `view[1] = view[1] + 1` без `Atomics` потерял обновления.",
        "`structuredClone` копирует буфер (разные объекты по 1024 байта), а передача с `transfer` отсоединяет исходный (0 байт) и отдаёт владение новому: так избегают копирования больших массивов между потоками.",
        "Дочерний процесс `node` имеет другой pid; его код выхода `3` и сигнал `SIGKILL` видны родителю.",
      ),
      h("Конвейер процессов, собранный вручную"),
      code("js", `// Конвейер процессов, собранный вручную: stdout одного процесса — stdin следующего; статусы всех стадий
import { spawn } from "node:child_process";

function pipeline(stages) {
  return new Promise((resolve) => {
    const procs = stages.map((s) => spawn(s[0], s.slice(1), { stdio: ["pipe", "pipe", "inherit"] }));
    for (let i = 0; i < procs.length - 1; i++) procs[i].stdout.pipe(procs[i + 1].stdin);   // соединяем
    let out = ""; procs.at(-1).stdout.on("data", (d) => (out += d));
    const codes = new Array(procs.length);
    let left = procs.length;
    procs.forEach((p, i) => p.on("close", (code, signal) => { codes[i] = signal ?? code; if (--left === 0) resolve({ out, codes }); }));
    procs[0].stdin.end();                                                                  // первой стадии вход не нужен
  });
}
// printf | sort | head -2
let r = await pipeline([["printf", "banana\\napple\\ncherry\\n"], ["sort"], ["head", "-2"]]);
console.log("printf | sort | head -2 → вывод:", JSON.stringify(r.out), " статусы стадий:", JSON.stringify(r.codes));

// средняя стадия падает с кодом 3
r = await pipeline([["printf", "a\\nb\\n"], ["sh", "-c", "cat >/dev/null; exit 3"], ["wc", "-c"]]);
console.log("средняя стадия завершается с кодом 3 → вывод последней:", JSON.stringify(r.out.trim()), " статусы:", JSON.stringify(r.codes), "(оболочка без pipefail вернула бы только статус последней стадии)");`, { filename: "09-pipeline.mjs", collapsed: true }),
      code("text", `printf | sort | head -2 → вывод: "apple\\nbanana\\n"  статусы стадий: [0,0,0]
средняя стадия завершается с кодом 3 → вывод последней: "0"  статусы: [0,3,0] (оболочка без pipefail вернула бы только статус последней стадии)`, { filename: "stdout одного процесса соединён со stdin следующего" }),
      ul(
        "Оболочка делает ровно это: создаёт процессы, соединяет `stdout` одного с `stdin` следующего и ждёт всех. Статусы стадий хранятся отдельно: в замере `[0,3,0]` — средняя стадия завершилась с ошибкой, но последняя вернула 0, и без `pipefail` это не было бы видно.",
      ),
    ]),

    section("internals", [
      h("Что происходит при создании процесса и потока"),
      ul(
        "**`fork`:** ядро создаёт новую запись в таблице процессов, копирует таблицы страниц (но не сами страницы — `copy-on-write`), дублирует таблицу открытых файлов и ставит потомка в очередь планировщика. Страницы, в которые затем пишет любой из процессов, копируются.",
        "**`exec`:** ядро загружает исполняемый файл, заменяет адресное пространство, сохраняет открытые файлы (кроме помеченных `close-on-exec`) и передаёт управление точке входа. Поэтому оболочка делает `fork`, затем в потомке `exec` — с настроенными перенаправлениями.",
        "**Поток:** в Linux создаётся системным вызовом `clone` с флагами совместного использования памяти, файлов и сигналов: поток — тот же вид «задачи» ядра, но делящий ресурсы с родителем.",
        "**Стек потока.** Библиотека резервирует виртуальную область (по умолчанию 8 МиБ) и страницу-ограничитель; физическая память выделяется по первому обращению (замер: 9 КиБ на поток).",
        "**Переключение.** При переключении между потоками одного процесса адресное пространство остаётся тем же; при переключении между процессами меняется корень таблиц страниц, и кеши трансляции адресов частично теряют полезное содержимое.",
        "**Планировщик ядра** выбирает, какая задача будет выполняться на ядре: потоки разных процессов равноправны (подробнее — в теме «Конкурентность и планирование»).",
      ),
      h("Связь с виртуальной памятью"),
      p("Изоляция процессов обеспечивается виртуальной памятью: у каждого процесса собственная таблица страниц, отображающая «его» адреса в физические. Подробно — в теме «Виртуальная память и файловые системы». Именно поэтому указатель из одного процесса бессмыслен в другом, а потоки обмениваются указателями свободно."),
    ]),

    section("mistakes", [
      wrongRight(
        "c",
        {
          title: "Неверно",
          code: `
            // сервис запускает потомков и не ждёт их
            for (;;) {
              int conn = accept(srv, 0, 0);
              if (fork() == 0) { handle(conn); _exit(0); }
              close(conn);
            }   // завершившиеся потомки навсегда остаются зомби
          `,
          note: "Без `wait` записи о завершённых потомках копятся в таблице процессов; рано или поздно `fork` вернёт `EAGAIN` (исчерпан `pid_max` или лимит пользователя).",
        },
        {
          title: "Верно",
          code: `
            // сообщаем ядру, что код выхода потомков нам не нужен
            signal(SIGCHLD, SIG_IGN);              // либо обработчик SIGCHLD с waitpid(-1, 0, WNOHANG)
            for (;;) {
              int conn = accept(srv, 0, 0);
              if (fork() == 0) { handle(conn); _exit(0); }
              close(conn);
            }
          `,
          note: "При `SIG_IGN` для `SIGCHLD` потомки не превращаются в зомби; для сбора кодов выхода используют обработчик с `waitpid(-1, …, WNOHANG)` в цикле или пул воркеров.",
        },
      ),
      ul(
        "**Потеря статуса в конвейере.** `false | true` возвращает 0 без `pipefail`: CI зелёный, хотя первая стадия упала.",
        "**Перехват `SIGKILL`.** Невозможен; завершение по `SIGKILL` не даёт программе очистить ресурсы — готовьте корректное завершение по `SIGTERM`.",
        "**Общий изменяемый счётчик между потоками без синхронизации:** потеря обновлений (воспроизведена и в C, и в Node).",
        "**Потоки для вычислений в CPython:** не ускоряют (0,59 с против 0,50 с последовательно); нужны процессы.",
        "**Неограниченное создание потоков и процессов:** на каждый запрос новый — это 54 мкс (потоки) или 196 мкс (процессы) плюс память; пул ограничивает нагрузку.",
        "**Забытые открытые дескрипторы после `fork`:** потомок держит концы каналов открытыми, и читатель не получает конец данных — закрывайте ненужные концы.",
        "**Использование `fork` в многопоточной программе:** в потомке остаётся только вызвавший поток; блокировки, которые удерживали другие потоки, остаются «навсегда занятыми».",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**«Потоки быстрее всегда».** Для ввода-вывода в Python они дали ×4, для вычислений — ничего; в других средах картина другая. Измеряйте.",
        "**Процесс на каждый запрос** в высоконагруженном сервисе: цена `fork` (около 196 мкс в замере) складывается с памятью и очередью.",
        "**Тысячи потоков «на всякий случай».** Каждый резервирует 8 МиБ адресного пространства и расходует ресурсы планировщика; для большого числа ожиданий используют асинхронный ввод-вывод или пул.",
        "**Игнорирование кодов выхода** в скриптах и сборках: ошибка в середине конвейера остаётся незамеченной.",
        "**Блокирующие вызовы в главном потоке** интерфейса или цикла событий: приложение «замирает»; тяжёлую работу переносят в воркер.",
        "**Самодельная синхронизация «по времени»** (`sleep` вместо ожидания события): результат зависит от скорости машины.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Выбирайте модель по задаче.** Много независимых ожиданий — потоки или асинхронность; тяжёлые вычисления — процессы или потоки в языке без GIL; изоляция и отказоустойчивость — процессы.",
        "**Используйте пулы** потоков и процессов с ограниченным размером (обычно порядка числа ядер для вычислений).",
        "**Всегда собирайте потомков:** `wait`/`waitpid`, обработчик `SIGCHLD`, `SA_NOCLDWAIT` или менеджеры процессов.",
        "**Корректно завершайтесь по `SIGTERM`:** закончить текущую работу, закрыть соединения и файлы, выйти с кодом; не полагайтесь на `SIGKILL`.",
        "**Проверяйте коды выхода** и включайте `set -o pipefail` (и `set -e`/`set -u` по ситуации) в сценариях.",
        "**Передавайте данные между воркерами явно:** сообщения, `transfer` для больших буферов, `SharedArrayBuffer` + `Atomics` для общей памяти.",
        "**Закрывайте ненужные концы каналов** после `fork`, помечайте дескрипторы `close-on-exec`.",
        "**Смотрите на процесс глазами системы:** `ps`, `top`, `/proc/<pid>/status` (`Threads`, `VmRSS`, `State`), `strace` — прежде чем строить гипотезы.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Осиротевшие процессы** (родитель завершился раньше) усыновляет процесс 1 (init), который их собирает; у самого init родителя нет.",
        "**Процессы в состоянии `D`** (непрерываемый сон, обычно ожидание диска или сетевой ФС) не реагируют даже на `SIGKILL`, пока операция не завершится.",
        "**Контейнеры.** Первым процессом контейнера часто оказывается ваше приложение (pid 1), которое должно собирать зомби и обрабатывать `SIGTERM`; поэтому используют лёгкие init-обёртки.",
        "**Лимиты:** число процессов и потоков (`ulimit -u`, `pid_max`), открытых файлов (`ulimit -n`), размер стека (`ulimit -s`) — источники ошибок `EAGAIN` и `EMFILE` под нагрузкой.",
        "**`fork` в многопоточной программе** безопасен только для `exec` сразу после него; поэтому библиотеки используют `posix_spawn` или запускают процессы из отдельного «чистого» потока.",
        "**Сигналы и потоки:** сигнал, адресованный процессу, доставляется одному из потоков; код с обработчиками должен вызывать только функции, безопасные для сигналов.",
        "**Windows:** нет `fork`; процессы создаются вызовом `CreateProcess`, а сигналы эмулируются; поэтому переносимые инструменты используют `spawn` и портируемые обёртки.",
      ),
    ]),

    section("related", [
      ul(
        "[Процессор, память и кеш](/learn/cs/cpu-memory-cache) — ядра, кеши и ложное разделение: почему потоки не бесплатны.",
        "[Виртуальная память и файловые системы](/learn/cs/virtual-memory-files) — адресные пространства процессов и copy-on-write.",
        "[Конкурентность и планирование](/learn/cs/concurrency-scheduling) — блокировки, взаимная блокировка, планировщик.",
        "[Сетевая модель, IP и TCP](/learn/cs/network-model-ip-tcp) — сокеты как каналы между процессами на разных машинах.",
        "[Стеки и очереди](/learn/cs/stacks-queues) — стек вызовов потока и очередь событий.",
        "[JavaScript: цикл событий](/learn/js/event-loop) — один поток JavaScript и пул потоков окружения.",
        "[JavaScript: асинхронность и отмена](/learn/js/async-await-abort) — конкурентность без потоков.",
        "[Git: качество коммитов и хуки](/learn/git/commit-quality-hooks) — хуки как процессы с кодом выхода.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "python",
        {
          title: "Потоки для вычислений",
          code: `
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(4) as pool:
                results = list(pool.map(cpu_bound, jobs))
          `,
          note: "В CPython (GIL) вычисления не ускоряются: в замере 0,59 с против 0,50 с последовательно.",
        },
        {
          title: "Процессы для вычислений",
          code: `
            from concurrent.futures import ProcessPoolExecutor
            if __name__ == "__main__":
                with ProcessPoolExecutor(4) as pool:
                    results = list(pool.map(cpu_bound, jobs))
          `,
          note: "Каждый процесс со своим интерпретатором: в замере 0,17 с против 0,50 с (в 2,9 раза быстрее); данные копируются между процессами.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "cs.processes-threads.ex1",
      title: "Сколько процессов создаст программа",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Сколько процессов (включая исходный) выполнится после следующих фрагментов: `fork(); fork(); fork();`, `if (fork()) fork();`, `fork() && fork();`, `fork() || fork();`? Нарисуйте дерево процессов для первого фрагмента."),
      ],
      hints: [
        "После каждого `fork` оба процесса (родитель и потомок) продолжают с одной и той же строки.",
        "`fork` возвращает 0 потомку и pid потомка родителю.",
        "`&&` и `||` вычисляют второй операнд не всегда.",
      ],
      checks: ["`fork(); fork(); fork();` — 8 процессов", "`if (fork()) fork();` — 3 процесса", "`fork() && fork();` — 3 процесса", "`fork() || fork();` — 3 процесса"],
      solution: [
        code("text", `fork(); fork(); fork();                  → процессов: 8 (2^3)
if (fork()) fork();                      → процессов: 3
for (i = 0; i < 3; i++) fork();          → процессов: 8
fork() && fork();                        → процессов: 3
fork() || fork();                        → процессов: 3`, { filename: "проверка запуском" }),
        ul(
          "Три подряд `fork` удваивают число процессов три раза: после первого — 2, после второго — 4, после третьего — `2³ = 8`. В дереве у исходного процесса три прямых потомка (по одному от каждого `fork`), у потомка первого `fork` — два, у потомка второго `fork` и у внука от второго — по одному, всего `1 + 3 + 2 + 1 + 1 = 8`.",
          "`if (fork()) fork();`: родитель (результат ненулевой) делает второй `fork`, потомок (результат 0) — нет: 3 процесса.",
          "`fork() && fork()`: потомок первого `fork` получает 0 и пропускает второй, родитель получает pid и выполняет его: 3 процесса. `fork() || fork()` — наоборот: второй `fork` выполняет потомок первого: 3 процесса.",
        ),
      ],
    }),
    exercise({
      id: "cs.processes-threads.ex2",
      title: "Соберите конвейер из процессов",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Напишите функцию `pipeline(stages)` для Node.js: каждая стадия — массив `[команда, ...аргументы]`; `stdout` стадии соединяется с `stdin` следующей; функция возвращает вывод последней стадии и массив кодов выхода всех стадий. Покажите, что ошибка средней стадии видна в массиве кодов, хотя последняя стадия завершилась успешно."),
      ],
      starter: {
        lang: "js",
        code: `
          import { spawn } from "node:child_process";
          function pipeline(stages) {
            return new Promise((resolve) => {
              // spawn каждой стадии, pipe stdout → stdin, сбор кодов выхода
            });
          }
          console.log(await pipeline([["printf", "b\\na\\n"], ["sort"]]));
        `,
      },
      hints: [
        "`spawn(cmd, args, { stdio: [\"pipe\", \"pipe\", \"inherit\"] })` даёт управляемые потоки.",
        "Соедините `procs[i].stdout.pipe(procs[i + 1].stdin)`.",
        "Первая стадия не получает входа: закройте её `stdin` (`end()`).",
        "Код выхода берите из события `close`.",
      ],
      checks: ["`printf | sort | head -2` → `\"apple\\nbanana\\n\"` и коды `[0,0,0]`", "Средняя стадия `exit 3` → коды `[0,3,0]`", "Все процессы завершены до `resolve`", "Нет утечки процессов и неперехваченных `error`"],
      solution: [
        code("js", `// Конвейер процессов, собранный вручную: stdout одного процесса — stdin следующего; статусы всех стадий
import { spawn } from "node:child_process";

function pipeline(stages) {
  return new Promise((resolve) => {
    const procs = stages.map((s) => spawn(s[0], s.slice(1), { stdio: ["pipe", "pipe", "inherit"] }));
    for (let i = 0; i < procs.length - 1; i++) procs[i].stdout.pipe(procs[i + 1].stdin);   // соединяем
    let out = ""; procs.at(-1).stdout.on("data", (d) => (out += d));
    const codes = new Array(procs.length);
    let left = procs.length;
    procs.forEach((p, i) => p.on("close", (code, signal) => { codes[i] = signal ?? code; if (--left === 0) resolve({ out, codes }); }));
    procs[0].stdin.end();                                                                  // первой стадии вход не нужен
  });
}
// printf | sort | head -2
let r = await pipeline([["printf", "banana\\napple\\ncherry\\n"], ["sort"], ["head", "-2"]]);
console.log("printf | sort | head -2 → вывод:", JSON.stringify(r.out), " статусы стадий:", JSON.stringify(r.codes));

// средняя стадия падает с кодом 3
r = await pipeline([["printf", "a\\nb\\n"], ["sh", "-c", "cat >/dev/null; exit 3"], ["wc", "-c"]]);
console.log("средняя стадия завершается с кодом 3 → вывод последней:", JSON.stringify(r.out.trim()), " статусы:", JSON.stringify(r.codes), "(оболочка без pipefail вернула бы только статус последней стадии)");`, { filename: "решение", collapsed: true }),
        code("text", `printf | sort | head -2 → вывод: "apple\\nbanana\\n"  статусы стадий: [0,0,0]
средняя стадия завершается с кодом 3 → вывод последней: "0"  статусы: [0,3,0] (оболочка без pipefail вернула бы только статус последней стадии)`, { filename: "результат" }),
        p("Функция создаёт процессы, соединяет каналы, закрывает вход первой стадии и дожидается события `close` каждой стадии: код выхода хранится по индексу стадии. Так работает и оболочка; без `pipefail` она вернула бы лишь статус последней стадии (`0`), потеряв `3` — именно поэтому массив кодов важен. Для длинных потоков следует обрабатывать `EPIPE` при раннем закрытии читателя."),
      ],
    }),
    exercise({
      id: "cs.processes-threads.ex3",
      title: "Сервис «захлебнулся» из-за зомби",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Сервис на C принимает соединения и на каждое делает `fork`. Через несколько дней в `ps` тысячи процессов в состоянии `Z`, а новые соединения отвергаются: `fork` возвращает `EAGAIN`. Объясните причину, покажите воспроизведение состояния зомби и предложите два исправления. Какие лимиты определяют, когда «захлебнётся» сервис?"),
      ],
      hints: [
        "Что остаётся от процесса после завершения, если родитель не вызывает `wait`?",
        "Посмотрите на состояние потомка по `/proc/<pid>/stat` до и после `waitpid`.",
        "Подумайте, какие ресурсы ядра заняты зомби (запись в таблице, pid).",
      ],
      checks: ["Причина: потомки не собраны (`wait`) — записи в таблице процессов и занятые pid не освобождаются", "Воспроизведение: состояние `Z` до `waitpid`, запись исчезает после", "Исправление 1: `SIGCHLD` игнорируется или обработчик с `waitpid(-1, …, WNOHANG)`", "Исправление 2: пул воркеров / менеджер процессов", "Лимиты: `pid_max`, `ulimit -u`"],
      solution: [
        code("text", `1) fork: у потомка свой pid (отличается от родителя): да;  после x = 2 в потомке у родителя x = 1
   код завершения потомка: WIFEXITED = 1, WEXITSTATUS = 7
2) getppid() потомка равен pid родителя: да
3) завершившийся потомок до wait: состояние 'Z' (Z — зомби); после wait: '-' (запись удалена)
4) SIGTERM по умолчанию завершает: WIFSIGNALED = 1, WTERMSIG = 15 (SIGTERM = 15)
   с игнорированием SIGTERM потомок жив (состояние 'S'); SIGKILL перехватить нельзя: WTERMSIG = 9 (SIGKILL = 9)
   обработчик SIGUSR1 в потомке (унаследован после fork) сработал: код выхода 42
5) pipe: родитель отправил "hello from parent", потомок вернул "HELLO FROM PARENT"
6) fork + exec("echo"): родитель прочитал из канала "hello from exec", код выхода 0
   exec несуществующей программы: потомок вернулся с кодом 127 (договорённость оболочек: 127 — команда не найдена)`, { filename: "замер: состояние зомби до и после wait" }),
        code("text", `размер стека потока по умолчанию (ulimit -s), КиБ: 8192
лимит открытых файлов (ulimit -n):                  20000
максимальный pid (/proc/sys/kernel/pid_max):        32768
максимум потоков в системе (threads-max):           128601
число ядер (nproc):                                 4
состояния процессов в /proc/<pid>/stat: R (выполняется), S (спит), D (непрерываемый сон), T (остановлен), Z (зомби)
родитель процесса 1: 0  (у init нет родителя)
поля /proc/self/status: Name State Pid PPid VmRSS Threads voluntary_ctxt_switches `, { filename: "лимиты тестовой машины" }),
        ul(
          "**Причина.** Потомки завершаются, но родитель не вызывает `wait`, поэтому от каждого остаётся запись в таблице процессов вместе с занятым pid (в замере: до `wait` состояние `Z`, после — записи нет). Когда накоплено порядка `pid_max` (32768 на тестовой машине) или достигнут лимит процессов пользователя, `fork` возвращает `EAGAIN`.",
          "**Исправление 1.** `signal(SIGCHLD, SIG_IGN)` (или `SA_NOCLDWAIT`) — ядро освобождает записи сразу; либо обработчик `SIGCHLD`, который в цикле вызывает `waitpid(-1, &st, WNOHANG)` и логирует коды выхода.",
          "**Исправление 2.** Заменить «процесс на соединение» пулом воркеров или асинхронным обработчиком, ограничить число одновременных потомков, а лимиты поднять только при необходимости.",
          "**Профилактика.** Мониторинг числа процессов и состояний, проверка `fork` на `EAGAIN` с понятной ошибкой, корректная обработка `SIGTERM` для чистого завершения.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "cs.processes-threads.challenge",
    title: "Выберите модель параллелизма для сервиса обработки",
    scenario: [
      p("Сервис получает задачи двух видов: вычислительные (около 0,12 с процессорного времени на CPython) и сетевые (ожидание ответа около 0,2 с). Нужно обрабатывать их параллельно на 4 ядрах и вернуть результаты в исходном порядке. Постройте обработчики на потоках и на процессах, измерьте оба вида задач и сделайте обоснованный вывод."),
    ],
    requirements: [
      "Один и тот же набор задач выполняется последовательно, в потоках и в процессах; результаты совпадают",
      "Для вычислительных и для ожидающих задач измерено время всех трёх вариантов (минимум из нескольких запусков)",
      "Размер пула ограничен (не более числа ядер для вычислений)",
      "Описан способ корректного завершения воркеров по `SIGTERM` и сбор кодов выхода",
    ],
    constraints: [
      "Нельзя считать вычисления «параллельными» только потому, что создано четыре потока",
      "Нельзя оставлять неперехваченные исключения в воркерах и зомби-процессы",
    ],
    acceptance: [
      "Для вычислений процессы быстрее последовательного выполнения более чем в 2 раза, потоки — нет",
      "Для ожиданий потоки быстрее последовательного выполнения более чем в 2 раза",
      "Результаты всех вариантов идентичны",
      "Вывод связан с GIL и с разницей между вычислениями и ожиданием",
    ],
    hints: [
      "В CPython для вычислений используйте `multiprocessing` или `ProcessPoolExecutor`.",
      "Ожидание `time.sleep` или ввода-вывода отпускает GIL.",
      "Не забудьте `if __name__ == \"__main__\"` при запуске процессов.",
    ],
    solution: [
      code("text", `Python 3.11.15  ядер: 4
результаты вычислений совпадают во всех трёх вариантах: да
4 задачи на потоках не быстрее последовательного выполнения (выигрыш меньше 1,3 раза): да
4 задачи на процессах быстрее последовательного выполнения более чем в 2 раза: да
4 ожидания по 0,2 с в потоках занимают меньше половины последовательного времени: да
последовательные ожидания заняли не меньше 0,8 с: да`, { filename: "измерение: три варианта для вычислений и ожиданий" }),
      p("Измерение подтверждает гипотезу: для вычислений потоки CPython не дают выигрыша (GIL выполняет байт-код одного потока), процессы дают ускорение, близкое к числу ядер (в калибровке — в 2,9 раза на четырёх), а для ожиданий потоки выигрывают в 4 раза, потому что ожидание не занимает процессор и отпускает GIL. Практический вывод: диспетчеризуйте вычислительные задачи в пул процессов, сетевые — в пул потоков (или асинхронно), а результаты собирайте по индексам, чтобы сохранить порядок; пулы ограничивайте числом ядер и завершайте по `SIGTERM` с ожиданием текущих задач."),
    ],
  },

  interview: [
    iq("cs.processes-threads.i1", "basic", "В чём разница между процессом и потоком?", [
      ul(
        "Процесс — программа с собственным адресным пространством, файлами и pid; поток — линия исполнения внутри процесса со своими регистрами и стеком, но общей памятью.",
        "Процессы изолированы ядром; потоки видят данные друг друга и требуют синхронизации.",
        "Создание потока дешевле (замер: около 54 мкс против 196 мкс для `fork` + `wait`).",
      ),
    ]),
    iq("cs.processes-threads.i2", "basic", "Что делают `fork` и `exec`?", [
      ul(
        "`fork` создаёт копию процесса: потомок получает копию адресного пространства (copy-on-write), `fork` возвращает 0 потомку и pid потомка родителю.",
        "`exec` заменяет текущую программу процесса новой, сохраняя pid и открытые файлы.",
        "Оболочка запускает команды как `fork` + `exec`, между ними настраивая перенаправления и каналы.",
      ),
    ]),
    iq("cs.processes-threads.i3", "intermediate", "Что такое зомби-процесс и как избежать их накопления?", [
      ul(
        "Завершившийся процесс, код выхода которого не прочитан родителем; от него остаётся запись в таблице процессов (состояние `Z`, в замере исчезает после `waitpid`).",
        "Избегать: `wait`/`waitpid`, обработчик `SIGCHLD` с `WNOHANG`, `SIG_IGN` для `SIGCHLD` или `SA_NOCLDWAIT`, менеджер процессов.",
        "Накопление зомби исчерпывает pid и приводит к `EAGAIN` при `fork`.",
      ),
    ]),
    iq("cs.processes-threads.i4", "intermediate", "Чем `SIGTERM` отличается от `SIGKILL`?", [
      ul(
        "`SIGTERM` — вежливая просьба завершиться: её можно перехватить, выполнить очистку и выйти (в замере без обработчика процесс завершился со статусом 15; код оболочки 143).",
        "`SIGKILL` (9, код 137) перехватить и игнорировать нельзя: процесс убивается ядром без очистки.",
        "Принцип: сначала `SIGTERM`, через таймаут — `SIGKILL`; приложения должны корректно обрабатывать `SIGTERM`.",
      ),
    ]),
    iq("cs.processes-threads.i5", "intermediate", "Почему потоки в CPython не ускоряют вычисления, и что делать?", [
      ul(
        "GIL позволяет выполнять байт-код только одному потоку за раз; вычисления в потоках не распараллеливаются (замер: 0,59 с против 0,50 с последовательно).",
        "Ввод-вывод и `sleep` отпускают GIL, поэтому для ожиданий потоки дают ускорение (×4 при четырёх ожиданиях).",
        "Для вычислений: `multiprocessing` (замер: 0,17 с, ×2,9), расширения на C/NumPy, отпускающие GIL, или другой язык.",
      ),
    ]),
    iq("cs.processes-threads.i6", "advanced", "Что общего и что отдельного у потоков одного процесса?", [
      ul(
        "Общее: адресное пространство (код, глобальные данные, куча), открытые файлы, идентификатор процесса и обработчики сигналов.",
        "Отдельное: регистры, счётчик команд, стек (8 МиБ виртуально, около 9 КиБ физически в замере), локальные данные потока, маска сигналов.",
        "Следствие: обмен данными дёшев, но все общие изменяемые данные требуют синхронизации (в замере простое `++` теряет обновления).",
      ),
    ]),
    iq("cs.processes-threads.i7", "engineering", "Как построить вычислительный сервис, использующий все ядра, и не «положить» систему?", [
      ul(
        "Пул воркеров ограниченного размера (порядка числа ядер для вычислений), очередь задач с лимитом, обратное давление.",
        "Для CPython — процессы; для Node.js — `worker_threads` с передачей буферов `transfer` или `SharedArrayBuffer` + `Atomics`; для языков без GIL — потоки.",
        "Корректное завершение по `SIGTERM`, сбор кодов выхода, мониторинг числа процессов, потоков, памяти и файловых дескрипторов; тайм-ауты и перезапуск упавших воркеров.",
      ),
    ]),
    iq("cs.processes-threads.i8", "debugging", "В CI сборка прошла, хотя тест упал внутри конвейера `test | tee log`. Почему и как исправить?", [
      ul(
        "Статус конвейера — статус последней стадии (`tee`), а не `test`: `false | true` вернул 0 в замере.",
        "Исправление: `set -o pipefail` (или проверка `${PIPESTATUS[0]}`).",
        "Дополнительно: `set -e`, явная проверка кодов выхода, не проглатывать stderr.",
      ),
    ]),
  ],

  exam: [
    mcq("cs.processes-threads.e1", "foundation", "Что обязательно у каждого процесса и не является общим с другими процессами?", ["Системные часы", "Файл исполняемой программы", "Адресное пространство", "Ядро операционной системы"], 2, "Каждый процесс имеет собственное виртуальное адресное пространство; изоляция обеспечивается ядром и виртуальной памятью, в отличие от потоков, делящих адресное пространство."),
    mcq("cs.processes-threads.e2", "foundation", "Что возвращает `fork()` в потомке?", ["0", "pid родителя", "−1", "pid потомка"], 0, "В потомке `fork` возвращает 0, в родителе — pid потомка, при ошибке (в родителе) — −1. Так различают ветви выполнения."),
    mcq("cs.processes-threads.e3", "foundation", "Какой код выхода оболочка показывает для процесса, убитого `SIGTERM`?", ["15", "128", "255", "143"], 3, "Для убитого сигналом `N` оболочка использует `128 + N`: для `SIGTERM` (15) — 143 (в замере `убит SIGTERM → код 143`)."),
    mcq("cs.processes-threads.e4", "intermediate", "Почему завершившийся процесс может остаться в состоянии `Z`?", ["Он ждёт ввода", "Родитель не вызвал `wait` и не прочитал код выхода", "Он заблокирован мьютексом", "У него не хватило памяти"], 1, "Зомби — запись о завершившемся процессе, хранящая код выхода до тех пор, пока родитель не вызовет `wait` (в замере исчезла после `waitpid`)."),
    mcq("cs.processes-threads.e5", "intermediate", "Что показал замер создания: сколько раз `fork` + `wait` дороже создания потока (create + join)?", ["Примерно в 0,5 раза", "Примерно в 1 раз", "Примерно в 100 раз", "Примерно в 3,7 раза"], 3, "Около 196 мкс против 54 мкс: создание процесса дороже, потому что ядро копирует таблицы страниц и структуры процесса, а поток делит их с родителем."),
    mcq("cs.processes-threads.e6", "intermediate", "Сколько физической памяти в замере потребовали 200 потоков со стеком 8 МиБ каждый (в среднем на поток)?", ["8 МиБ", "около 1 МиБ", "около 9 КиБ", "0 байт"], 2, "Стек резервируется как виртуальная память (8 МиБ на поток), а физические страницы выделяются по первому обращению: RSS вырос примерно на 9 КиБ на поток."),
    mcq("cs.processes-threads.e7", "advanced", "Какие утверждения верны? Выберите все.", ["`SIGKILL` нельзя перехватить", "В CPython четыре потока вычислений на чистом Python работают заметно быстрее одного", "Потоки одного процесса делят кучу", "Без `pipefail` статус конвейера `false | true` равен 0"], [0, 2, 3], "`SIGKILL` не перехватывается; потоки делят кучу; без `pipefail` статус конвейера определяет последняя стадия. В CPython из-за GIL потоки вычислений не быстрее (0,59 с против 0,50 с)."),
    open("cs.processes-threads.e8", "intermediate", "Объясните, как оболочка выполняет конвейер `a | b | c` и почему код выхода конвейера может скрывать ошибку.", [
      ul(
        "Оболочка создаёт процессы (`fork` + `exec`) для каждой команды, соединяет `stdout` одной с `stdin` следующей каналами (pipe) и ждёт всех.",
        "По умолчанию код выхода конвейера — код последней команды: ошибка в `a` или `b` теряется (`false | true` → 0).",
        "Исправление: `set -o pipefail` (код — последний ненулевой), `${PIPESTATUS[@]}` для статусов всех стадий.",
      ),
    ], ["Названы fork/exec и каналы", "Названо правило статуса последней стадии", "Предложен pipefail или PIPESTATUS", "Приведён пример `false | true`"]),
  ],

  mastery: [
    mcq("cs.processes-threads.m1", "intermediate", "Почему `fork` недорог даже для процесса с большим объёмом памяти?", ["Потому что память не копируется", "Страницы памяти общие и копируются лишь при записи (copy-on-write)", "Потому что потомок использует только стек", "Потому что `fork` вызывает `exec`"], 1, "Ядро копирует таблицы страниц, а сами страницы помечает как «только для чтения, копировать при записи»; физическое копирование происходит при первой записи в страницу."),
    mcq("cs.processes-threads.m2", "advanced", "Почему в замере обмен через pipe между двумя потоками и между двумя процессами занял одинаковое время (около 27,5 мкс на круг)?", ["Время определяется системными вызовами и пробуждением потока, а не сменой адресного пространства", "Потому что процессы и потоки — одно и то же", "Потому что pipe работает только с потоками", "Потому что замер был некорректным"], 0, "Круг состоит из двух `write` и двух `read` с блокировкой и пробуждением; издержки смены адресного пространства (кеши, TLB) в таком коротком тесте малы по сравнению с ними."),
    mcq("cs.processes-threads.m3", "advanced", "Что произойдёт при `fork()` в многопоточной программе в момент, когда другой поток удерживает мьютекс?", ["Мьютекс автоматически освободится", "Потомок получит копии всех потоков", "В потомке остаётся только вызывающий поток, а мьютекс остаётся захваченным без владельца", "Процесс завершится"], 2, "После `fork` в потомке выполняется один поток; состояние мьютекса копируется как есть, поэтому попытка захватить его в потомке может заблокироваться навсегда; безопасно лишь сразу вызывать `exec`."),
    open("cs.processes-threads.m4", "advanced", "Спроектируйте менеджер процессов для контейнера: запуск нескольких воркеров, перезапуск упавших, корректная остановка по `SIGTERM`, сбор зомби и передача сигналов.", [
      ul(
        "Менеджер — процесс 1 в контейнере: запускает воркеров через `posix_spawn`/`fork`+`exec`, хранит таблицу pid → состояние.",
        "Обработчик `SIGCHLD`: в цикле `waitpid(-1, &st, WNOHANG)`, определение причины (код выхода или сигнал), перезапуск с задержкой (backoff) и ограничением числа перезапусков.",
        "Остановка: по `SIGTERM` менеджер пересылает `SIGTERM` воркерам, ждёт таймаут, затем `SIGKILL` оставшимся; собирает зомби и завершается с понятным кодом.",
        "Корректность: сигналы обрабатываются безопасным способом (флаг/самопайп), закрываются лишние дескрипторы, `close-on-exec`, учёт лимитов процессов и файлов, журналирование причин завершения.",
      ),
    ], ["Менеджер как pid 1 и таблица воркеров", "SIGCHLD и waitpid(WNOHANG), перезапуск", "Остановка: SIGTERM, таймаут, SIGKILL", "Безопасная обработка сигналов и дескрипторов"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "cs.processes-threads.f1", front: "Процесс и поток?", back: "Процесс: своё адресное пространство, файлы, pid. Поток: регистры и стек внутри процесса, общая память с другими потоками." },
    { id: "cs.processes-threads.f2", front: "fork / exec / wait?", back: "fork — копия процесса (COW), 0 потомку и pid родителю; exec — заменить программу; wait — прочитать код выхода потомка." },
    { id: "cs.processes-threads.f3", front: "Зомби?", back: "Завершившийся процесс, код выхода которого не прочитан (состояние Z). Лечение: wait, SIGCHLD с WNOHANG, SIG_IGN." },
    { id: "cs.processes-threads.f4", front: "Коды выхода оболочки?", back: "0 — успех, 127 — команда не найдена, 128+N — убит сигналом N: 143 (TERM), 137 (KILL), 141 (PIPE)." },
    { id: "cs.processes-threads.f5", front: "Стоимость?", back: "Поток ≈ 54 мкс, fork+wait ≈ 196 мкс, системный вызов ≈ 103 нс; 8 МиБ виртуально и ≈ 9 КиБ физически на поток." },
    { id: "cs.processes-threads.f6", front: "GIL?", back: "CPython: байт-код выполняет один поток. Вычисления в потоках не ускоряются (0,59 против 0,50 с); ввод-вывод — ускоряется (×4); процессы — ×2,9." },
    { id: "cs.processes-threads.f7", front: "pipefail?", back: "set -o pipefail: статус конвейера — последний ненулевой; без него false | true → 0. PIPESTATUS даёт статусы всех стадий." },
    { id: "cs.processes-threads.f8", front: "Node.js параллелизм?", back: "worker_threads: сообщения копируются, transfer отсоединяет буфер, SharedArrayBuffer + Atomics — общая память; child_process — отдельные процессы." },
  ],

  sources: [
    { title: "Arpaci-Dusseau R., Arpaci-Dusseau A. Operating Systems: Three Easy Pieces: Processes, API, Threads", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", publisher: "Other" },
    { title: "The Open Group: POSIX.1-2017 — fork, exec, waitpid, pthread_create", url: "https://pubs.opengroup.org/onlinepubs/9699919799/", publisher: "Other" },
    { title: "Linux manual page: fork(2)", url: "https://man7.org/linux/man-pages/man2/fork.2.html", publisher: "Other" },
    { title: "Linux manual page: signal(7)", url: "https://man7.org/linux/man-pages/man7/signal.7.html", publisher: "Other" },
    { title: "Linux manual page: pthreads(7)", url: "https://man7.org/linux/man-pages/man7/pthreads.7.html", publisher: "Other" },
    { title: "Linux manual page: proc(5)", url: "https://man7.org/linux/man-pages/man5/proc.5.html", publisher: "Other" },
    { title: "Python documentation: threading, multiprocessing и GIL (glossary)", url: "https://docs.python.org/3/library/multiprocessing.html", publisher: "Other" },
    { title: "Node.js documentation: worker_threads и child_process", url: "https://nodejs.org/api/worker_threads.html", publisher: "Other" },
  ],
};
