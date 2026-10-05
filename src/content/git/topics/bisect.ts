import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
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

export const bisect: Topic = {
  id: "git.bisect",
  slug: "bisect",
  domain: "git",
  module: "advanced-git",
  title: "Bisect: бинарный поиск коммита с ошибкой",
  titleEn: "Bisect: Binary Search for the Commit That Broke It",
  summary:
    "`git bisect` находит коммит, внёсший ошибку, бинарным поиском: вы называете один хороший и один плохой коммит, Git проверяет коммиты посередине, и за ⌈log₂ N⌉ шагов виновник найден. Тема на опытах показывает ручную сессию (16 коммитов → 4 проверки), автоматический поиск `bisect run` с кодами выхода 0, 1, 125, пропуск непроверяемых коммитов, предел метода и связку «найти → откатить».",
  minutes: 70,
  prerequisites: ["git.commits-history", "git.searching-history", "git.reset-revert-reflog"],
  tags: ["git bisect", "bisect run", "bisect skip", "binary search", "regression", "good commit", "bad commit", "git bisect log", "exit code 125", "first bad commit"],
  keyConcepts: [
    { term: "Бинарный поиск: каждый шаг вдвое сужает диапазон", text: "Между хорошим и плохим коммитом 16 коммитов; Git предложил `Шаг 7`, затем `Шаг 11`, `Шаг 9`, `Шаг 10` — всего четыре проверки, и `e12099f` назван первым плохим." },
    { term: "Для поиска нужны хороший и плохой коммиты и проверка", text: "`git bisect start` + `bad` + `good <коммит>`; решение «хорошо/плохо» принимаете вы (или скрипт). Без воспроизводимой проверки bisect бесполезен." },
    { term: "`bisect run` автоматизирует поиск по коду выхода", text: "Скрипт `check.sh` вернул 0 — хорошо, 1 — плохо; `git bisect run` сам прошёл те же четыре шага и напечатал `bisect found first bad commit`." },
    { term: "Код 125 пропускает коммит, который нельзя проверить", text: "Коммит «Шаг 4» не собирался (`BROKEN`), скрипт вернул 125 — bisect пропустил его и всё равно нашёл виновника «Шаг 6». Если пропущенные коммиты соседствуют с виновным — ответ неоднозначен." },
    { term: "После поиска — `git bisect reset`", text: "Команда вернула ветку `main` (`Switched to branch 'main'`); найденный коммит можно откатить `git revert`." },
  ],
  sections: [
    section("definition", [
      def("git bisect", "Команда бинарного поиска по истории: Git выбирает коммит посередине между известными хорошим и плохим, вы сообщаете результат проверки, диапазон сужается вдвое.", "bisect"),
      def("Хороший и плохой коммит", "Хороший — коммит, где дефекта ещё нет; плохой — где он уже есть. Определяется вашей проверкой (тест, скрипт, ручная проверка).", "good / bad commit"),
      def("Первый плохой коммит", "Результат bisect: коммит, у которого родители хорошие, а он сам — плохой. Именно он внёс изменение, ставшее причиной дефекта.", "first bad commit"),
      def("Регрессия", "Поведение, которое раньше работало и перестало работать после изменения.", "regression"),
      def("Пропуск (skip)", "Отметка «этот коммит проверить нельзя» (например, не собирается): bisect выбирает другой и продолжает.", "skip"),
      def("Код выхода скрипта", "Контракт `bisect run`: 0 — хорошо; 1–127, кроме 125, — плохо; 125 — пропустить; 128–255 — прервать поиск.", "exit code"),
    ]),

    section("why", [
      h("Искать виновника не листанием истории"),
      p("Классическая ситуация: вчера всё работало, сегодня — нет, а между этими днями сорок коммитов от десяти человек. Читать их все — долго, и причина может быть в самом неочевидном. Если вы можете за минуту проверить, «сломано» или «работает», то поиск причины сводится к игре «угадай число»: на каждом шаге нужно проверить одну версию и исключить половину оставшихся."),
      ul(
        "**Скорость.** Для N коммитов нужно около ⌈log₂ N⌉ проверок: 16 коммитов — 4, 1000 — 10, миллион — 20.",
        "**Объективность.** Ответ не зависит от предположений: найден коммит, у которого дефекта «ещё не было» и «уже есть».",
        "**Автоматизация.** Скрипт-проверка превращает поиск в одну команду без человека.",
        "**Основа для действия.** Найденный коммит можно откатить (`revert`), исправить или обсудить с автором.",
      ),
      tip("Если вы знаете, **где** в коде проблема, начните с `git log -L`/`-S`/`blame`. Если знаете только **что** сломалось — `bisect`."),
    ]),

    section("mental-model", [
      h("Игра «выше — ниже»"),
      diagram(
        `
        хороший                                                      плохой
          │                                                            │
          ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ●
          0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15

        шаг 1: проверить 7  → хорошо → ошибка правее      (диапазон 8–15)
        шаг 2: проверить 11 → плохо   → ошибка левее      (диапазон 8–11)
        шаг 3: проверить 9  → хорошо                       (диапазон 10–11)
        шаг 4: проверить 10 → хорошо ⇒ первый плохой — 11
        `,
        "Каждый шаг делит диапазон пополам; 16 коммитов — четыре проверки.",
      ),
      h("Что нужно для успеха"),
      ul(
        "Известный **хороший** коммит (тег релиза, прошлый зелёный CI, «вчерашний» коммит).",
        "Быстрая и **воспроизводимая** проверка: «да/нет» без случайности.",
        "Коммиты, которые **собираются** (иначе нужны `skip`); поэтому ценны мелкие рабочие коммиты и чистая история.",
      ),
      insight("Bisect находит **первый** коммит, после которого проверка «ломается». Если проверка недетерминирована или условие дефекта менялось в середине истории, ответ будет неверным. Проверку нужно сначала отладить на заведомо хорошем и плохом коммите."),
    ]),

    section("technical", [
      h("Команды"),
      table(
        ["Команда", "Действие"],
        [
          ["`git bisect start [плохой [хороший]]`", "Начать сессию; можно сразу указать границы"],
          ["`git bisect bad [коммит]` / `good [коммит]`", "Отметить текущий (или указанный) коммит плохим/хорошим"],
          ["`git bisect run команда`", "Автоматически выполнять проверку на каждом шаге"],
          ["`git bisect skip`", "Пропустить текущий коммит (не проверяется)"],
          ["`git bisect log`", "Показать протокол сессии (можно сохранить и воспроизвести `git bisect replay`)"],
          ["`git bisect reset`", "Завершить сессию и вернуться на исходную ветку"],
          ["`git bisect start --term-old=… --term-new=…`", "Свои названия состояний (например, «быстро/медленно»), если ищут не только ошибку"],
          ["`git bisect start --first-parent`", "Идти только по первым родителям (удобно для «веток-функций» в основной линии)"],
        ],
        "Команды git bisect",
      ),
      h("Контракт bisect run"),
      table(
        ["Код выхода", "Значение"],
        [
          ["0", "Коммит хороший"],
          ["1–127, кроме 125", "Коммит плохой"],
          ["125", "Коммит нельзя проверить (пропустить)"],
          ["128–255", "Прервать поиск (ошибка скрипта)"],
        ],
        "Коды выхода скрипта проверки",
      ),
      p("Скрипт запускается в корне рабочего дерева на каждом проверяемом коммите. Он не должен менять отслеживаемые файлы и должен быть вне репозитория или неотслеживаемым — иначе переключение коммитов его затрёт. Сборка и тесты внутри скрипта обязаны быть быстрыми: их выполнят ⌈log₂ N⌉ раз."),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git bisect start
git bisect bad
git bisect good <коммит>
git bisect run ./check.sh
git bisect skip
git bisect log
git bisect reset`,
        [
          { line: 1, text: "Начать сессию." },
          { line: 2, text: "Текущий коммит — плохой (дефект воспроизводится)." },
          { line: 3, text: "Назвать хороший коммит (например, тег прошлого релиза)." },
          { line: 4, text: "Или автоматически: Git сам переключает коммиты и вызывает скрипт." },
          { line: 5, text: "Пропустить коммит, который нельзя проверить." },
          { line: 6, text: "Протокол: что было отмечено и в какой последовательности." },
          { line: 7, text: "Завершить и вернуться на ветку." },
        ],
        "команды bisect",
      ),
    ]),

    section("minimal-example", [
      h("Ручной поиск"),
      p("Шестнадцать коммитов («Шаг 0» … «Шаг 15»). В `rate.txt` должно быть `rate=18`, а сейчас — `rate=25`. Хороший коммит — самый первый. Проверка — посмотреть `rate.txt`:"),
      code("text", `$ git log --oneline | wc -l
16
$ cat rate.txt
rate=25
$ git bisect start
status: waiting for both good and bad commits
$ git bisect bad
status: waiting for good commit(s), bad commit known
$ git bisect good HEAD~15
Bisecting: 7 revisions left to test after this (roughly 3 steps)
[e3303c0d6628f8151109e22653b59273016df334] Шаг 7
$ cat rate.txt
rate=18
$ git bisect good
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[e12099f601a44e41a93e4a30034ff07586b73736] Шаг 11: оптимизация расчётов
$ cat rate.txt
rate=25
$ git bisect bad
Bisecting: 1 revision left to test after this (roughly 1 step)
[86ae83e41e1bc6f473ac20da47c084b888c3a2d4] Шаг 9
$ cat rate.txt
rate=18
$ git bisect good
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[195ce13daac2b2c8173d7f742eac48040b971b19] Шаг 10
$ cat rate.txt
rate=18
$ git bisect good
e12099f601a44e41a93e4a30034ff07586b73736 is the first bad commit
commit e12099f601a44e41a93e4a30034ff07586b73736
Author: Alice Dev <alice@example.com>
Date:   Wed Jan 15 09:13:00 2025 +0000

    Шаг 11: оптимизация расчётов

 rate.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git bisect reset
Previous HEAD position was 195ce13 Шаг 10
Switched to branch 'main'`, { filename: "сеанс: ручной bisect" }),
      ul(
        "После `bad` и `good HEAD~15` Git сообщил `Bisecting: 7 revisions left to test after this (roughly 3 steps)` и переключился на «Шаг 7».",
        "На «Шаг 7» `rate=18` — хорошо (`bisect good`); дальше Git проверил «Шаг 11» (плохо), «Шаг 9» (хорошо), «Шаг 10» (хорошо).",
        "Четвёртый ответ дал результат: `e12099f … is the first bad commit` и описание коммита — «Шаг 11: оптимизация расчётов», изменение `rate.txt`.",
        "`git bisect reset` вернул ветку `main`.",
      ),
    ]),

    section("detailed-example", [
      h("Автоматизация: bisect run"),
      code("text", `$ cat /home/dev/check.sh
#!/bin/sh
# 0 — коммит хороший, 1 — плохой
grep -qx 'rate=18' rate.txt
$ git bisect start HEAD HEAD~15
Bisecting: 7 revisions left to test after this (roughly 3 steps)
[e3303c0d6628f8151109e22653b59273016df334] Шаг 7
$ git bisect run /home/dev/check.sh
running '/home/dev/check.sh'
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[e12099f601a44e41a93e4a30034ff07586b73736] Шаг 11: оптимизация расчётов
running '/home/dev/check.sh'
Bisecting: 1 revision left to test after this (roughly 1 step)
[86ae83e41e1bc6f473ac20da47c084b888c3a2d4] Шаг 9
running '/home/dev/check.sh'
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[195ce13daac2b2c8173d7f742eac48040b971b19] Шаг 10
running '/home/dev/check.sh'
e12099f601a44e41a93e4a30034ff07586b73736 is the first bad commit
commit e12099f601a44e41a93e4a30034ff07586b73736
Author: Alice Dev <alice@example.com>
Date:   Wed Jan 15 09:13:00 2025 +0000

    Шаг 11: оптимизация расчётов

 rate.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
bisect found first bad commit
$ git bisect log
# bad: [8559f8537bd443ac0670718f2125c6e9157d78d4] Шаг 15
# good: [14506a1341072cdf1723686d51623069ae38cb24] Шаг 0: начальная версия
git bisect start 'HEAD' 'HEAD~15'
# good: [e3303c0d6628f8151109e22653b59273016df334] Шаг 7
git bisect good e3303c0d6628f8151109e22653b59273016df334
# bad: [e12099f601a44e41a93e4a30034ff07586b73736] Шаг 11: оптимизация расчётов
git bisect bad e12099f601a44e41a93e4a30034ff07586b73736
# good: [86ae83e41e1bc6f473ac20da47c084b888c3a2d4] Шаг 9
git bisect good 86ae83e41e1bc6f473ac20da47c084b888c3a2d4
# good: [195ce13daac2b2c8173d7f742eac48040b971b19] Шаг 10
git bisect good 195ce13daac2b2c8173d7f742eac48040b971b19
# first bad commit: [e12099f601a44e41a93e4a30034ff07586b73736] Шаг 11: оптимизация расчётов
$ git bisect reset
Previous HEAD position was 195ce13 Шаг 10
Switched to branch 'main'
$ git status -sb
## main`, { filename: "сеанс: bisect run и протокол" }),
      ul(
        "Скрипт `check.sh` — одна строка `grep -qx 'rate=18' rate.txt`: код выхода 0, если строка есть, иначе 1.",
        "`git bisect run` сам переключает коммиты, выполняет скрипт и выбирает следующий; результат тот же — `Шаг 11`. Протокол показывает последовательность решений.",
        "`git bisect log` — это журнал, который можно сохранить в файл и воспроизвести (`git bisect replay`), в том числе на другой машине.",
        "После `reset` — `## main`: рабочее дерево на исходной ветке.",
      ),
      h("Коммиты, которые нельзя проверить"),
      code("text", `$ cat /home/dev/check.sh
#!/bin/sh
# 125 — коммит нельзя проверить (сборка сломана), 0 — хороший, 1 — плохой
[ -f BROKEN ] && exit 125
grep -qx 'rate=18' rate.txt
$ git bisect start HEAD HEAD~8
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[24247d6e5680f6c215a4edf7318917691cfb36e3] Шаг 4: временно ломает сборку
$ git bisect run /home/dev/check.sh
running '/home/dev/check.sh'
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[efbe357c1aaa4318e082b58deb2c1b84fb6c56c3] Шаг 2
running '/home/dev/check.sh'
Bisecting: 2 revisions left to test after this (roughly 2 steps)
[75f363c8c812df6c83cceb18e994863b73530277] Шаг 5: чинит сборку
running '/home/dev/check.sh'
Bisecting: 1 revision left to test after this (roughly 1 step)
[48a9d18a100c3fe00552fc44572bb9fc743eb0dc] Шаг 6: оптимизация расчётов
running '/home/dev/check.sh'
48a9d18a100c3fe00552fc44572bb9fc743eb0dc is the first bad commit
commit 48a9d18a100c3fe00552fc44572bb9fc743eb0dc
Author: Alice Dev <alice@example.com>
Date:   Wed Jan 15 09:08:00 2025 +0000

    Шаг 6: оптимизация расчётов

 rate.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
bisect found first bad commit`, { filename: "сеанс: код 125 и пропуск" }),
      ul(
        "В истории есть коммит «Шаг 4», не собирающийся (в нём файл `BROKEN`); скрипт для таких коммитов возвращает **125**.",
        "Первым bisect выбрал именно его; скрипт вернул 125 — Git пропустил его и выбрал соседний «Шаг 2», затем «Шаг 5», «Шаг 6».",
        "Виновник найден: «Шаг 6: оптимизация расчётов». Пропуск не помешал, потому что непроверяемый коммит не граничит с виновным.",
      ),
    ]),

    section("analysis", [
      h("Когда пропусков слишком много"),
      code("text", `$ cat /home/dev/check.sh
#!/bin/sh
# 125 — коммит нельзя проверить (сборка сломана), 0 — хороший, 1 — плохой
[ -f BROKEN ] && exit 125
grep -qx 'rate=18' rate.txt
$ git bisect start HEAD HEAD~8
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[24247d6e5680f6c215a4edf7318917691cfb36e3] Шаг 4: временно ломает сборку
$ git bisect run /home/dev/check.sh
running '/home/dev/check.sh'
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[efbe357c1aaa4318e082b58deb2c1b84fb6c56c3] Шаг 2
running '/home/dev/check.sh'
Bisecting: 2 revisions left to test after this (roughly 2 steps)
[11d84a6c09b5f00dbe8ee0c531437b28517f49f3] Шаг 5
running '/home/dev/check.sh'
Bisecting: 2 revisions left to test after this (roughly 2 steps)
[54b1e631f78ab15af150baad98fad8a46f56bd04] Шаг 6: оптимизация расчётов
running '/home/dev/check.sh'
Bisecting: 2 revisions left to test after this (roughly 2 steps)
[9a41b1175cb2b08b95b47625d530fa8091d08c5e] Шаг 3
running '/home/dev/check.sh'
Bisecting: 2 revisions left to test after this (roughly 1 step)
[b2e4bd2ae0d0eb6d1f357fb400b3073718c3ac7d] Шаг 7: чинит сборку
running '/home/dev/check.sh'
There are only 'skip'ped commits left to test.
The first bad commit could be any of:
11d84a6c09b5f00dbe8ee0c531437b28517f49f3
24247d6e5680f6c215a4edf7318917691cfb36e3
54b1e631f78ab15af150baad98fad8a46f56bd04
b2e4bd2ae0d0eb6d1f357fb400b3073718c3ac7d
We cannot bisect more!
error: bisect run cannot continue any more`, { filename: "сеанс: виновник рядом с непроверяемым" }),
      p("Здесь сборка сломана на коммитах 4–6 — как раз там, где меняется значение. Bisect пропустил их, но не смог отличить: `There are only 'skip'ped commits left to test. The first bad commit could be any of:` и список из четырёх кандидатов. Git честно предупреждает: подозреваемых несколько."),
      table(
        ["Ситуация", "Что делать"],
        [
          ["Единичный непроверяемый коммит вдали от виновного", "`skip`/код 125: поиск продолжится"],
          ["Непроверяемые коммиты рядом с виновным", "Исправить проверку (например, временно подправить сборку скриптом) или просмотреть кандидатов вручную (`git show`, `git log -S`)"],
          ["Проверка недетерминирована", "Сначала стабилизировать (повторить N раз, зафиксировать окружение)"],
          ["Хороший коммит указан неверно", "Проверить `git bisect log`; начать заново с достоверно хорошего"],
        ],
        "Проблемы и их решения",
      ),
    ]),

    section("internals", [
      h("Как Git выбирает следующий коммит"),
      p("Bisect работает на **графе коммитов**, а не на «списке»: он берёт все коммиты, достижимые из плохого, но не из хорошего, и выбирает тот, чьё тестирование наилучшим образом делит это множество пополам (учитывая слияния). В линейной истории это просто середина диапазона. После каждой отметки множество сужается, Git сообщает, сколько ревизий осталось (`7 revisions left … roughly 3 steps`), и переключает рабочее дерево на выбранный коммит."),
      ul(
        "Служебные ссылки лежат в `refs/bisect/` (`refs/bisect/bad`, `refs/bisect/good-*`); а в `.git` — файлы состояния (`BISECT_LOG`, `BISECT_START`).",
        "Пока сессия идёт, HEAD оторван; `git bisect reset` возвращает ветку, на которой вы начинали.",
        "Поиск не меняет историю: только перемещает HEAD и ничего не удаляет.",
      ),
      h("Найти и откатить"),
      code("text", `$ git show --stat --format="%h %s" refs/bisect/bad
e12099f Шаг 11: оптимизация расчётов

 rate.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git bisect reset
Previous HEAD position was 195ce13 Шаг 10
Switched to branch 'main'
$ git revert --no-edit $BAD
[main 24673fd] Revert "Шаг 11: оптимизация расчётов"
 Date: Wed Jan 15 09:23:00 2025 +0000
 1 file changed, 1 insertion(+), 1 deletion(-)
$ cat rate.txt
rate=18
$ git log --oneline -3
24673fd Revert "Шаг 11: оптимизация расчётов"
8559f85 Шаг 15
63ce5d0 Шаг 14`, { filename: "сеанс: найти коммит и откатить" }),
      p("Пока сессия не завершена, виновный коммит доступен как `refs/bisect/bad`: из него можно взять хэш для `git show` и `git revert`. После `bisect reset` ссылка исчезает, поэтому хэш нужно сохранить заранее. Откат `git revert --no-edit` создал коммит `Revert \"Шаг 11: оптимизация расчётов\"`, `rate.txt` снова `rate=18`."),
      note("Откат проходит чисто, если виновный коммит содержал только неверное изменение. Если он смешан с другими правками (рефакторинг, форматирование), откат может конфликтовать — ещё один довод в пользу атомарных коммитов."),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git bisect start
            git bisect bad
            git bisect good v1.0      # хороший, «наверное»
            git bisect run ./test.sh  # скрипт лежит внутри репозитория и «исчезает» при переключении
          `,
          note: "Не проверен хороший коммит; скрипт отслеживается и меняется вместе с коммитами.",
        },
        {
          title: "Верно",
          code: `
            ./check.sh && echo ok          # проверка на хорошем и плохом коммитах заранее
            git bisect start HEAD v1.0
            git bisect run /путь/вне/репозитория/check.sh
            git bisect reset
          `,
          note: "Проверка отлажена, скрипт вне истории, сессия завершена `reset`.",
        },
      ),
      ul(
        "**Забыть `git bisect reset`:** вы остаётесь на оторванном HEAD — легко потерять работу.",
        "**Неверно указать хороший коммит:** результат будет ложным; проверяйте границы заранее.",
        "**Недетерминированная проверка:** случайные падения дают случайный ответ.",
        "**Тяжёлый скрипт:** каждая проверка выполняется на каждом шаге — оптимизируйте и кэшируйте.",
        "**Правки рабочего дерева во время bisect:** переключение коммитов их затронет; сначала `stash` или коммит.",
        "**Считать найденный коммит «виновником-человеком»:** это изменение, которое привело к дефекту, а не обвинение.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Ручной просмотр десятков коммитов,** когда есть воспроизводимая проверка.",
        "**Огромные коммиты** («рефакторинг + новая функция + форматирование»): bisect находит коммит, но причина внутри десяти изменений. Дробите на атомарные.",
        "**Нерабочие промежуточные коммиты в основной ветке:** bisect постоянно упирается в `skip`; перед публикацией чистите историю (`rebase -i --exec`).",
        "**Тест, зависящий от сети/времени/случайности:** результат bisect не воспроизводим.",
        "**Bisect по истории с долгими «мёртвыми» участками** (нет хороших сборок): сначала установите границы хотя бы грубо.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Сначала воспроизведите ошибку и напишите проверку** (скрипт, тест). Проверьте её на заведомо хорошем и плохом коммитах.",
        "**Используйте `bisect run`** и храните скрипт вне репозитория или неотслеживаемым.",
        "**Возвращайте 125** для коммитов, которые нельзя проверить (не собираются, нет зависимостей).",
        "**Сохраняйте `git bisect log`:** его можно приложить к отчёту об ошибке.",
        "**Всегда `git bisect reset`** по завершении.",
        "**Держите историю бисектабельной:** атомарные коммиты, рабочая сборка на каждом (`rebase --exec`).",
        "**После нахождения:** `git show`, обсудите с автором, откатите (`revert`) или исправьте и добавьте тест.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Слияния в истории:** bisect учитывает граф; результат может указать на коммит в боковой ветке. `--first-parent` ограничивает поиск основной линией.",
        "**Поиск «хорошего» поведения:** вместо ошибки можно искать, когда что-то улучшилось (`--term-old/--term-new` или `git bisect old/new`).",
        "**Диапазон по дате или тегу:** вместо хэша подходят теги и выражения (`v1.0`, `HEAD~40`).",
        "**Скрипт возвращает ≥128:** поиск прерывается — это сигнал, что с проверкой что-то не так.",
        "**Много хороших коммитов:** `git bisect good A B C` принимает несколько хороших границ.",
        "**Подмодули и генерируемые файлы** могут «пережить» переключение; в скрипте предусмотрите очистку (`git clean`, пересборка).",
      ),
    ]),

    section("related", [
      ul(
        "[Поиск по истории](/learn/git/searching-history) — `log -S`, `blame` и `-L`, когда известно место в коде.",
        "[Reset, revert и reflog](/learn/git/reset-revert-reflog) — откат найденного коммита.",
        "[Интерактивный rebase](/learn/git/interactive-rebase) — `--exec` помогает сделать историю бисектабельной.",
        "[Качество коммитов и хуки](/learn/git/commit-quality-hooks) — атомарные коммиты и проверки перед ними.",
        "[Релизы и теги](/learn/git/releases-tags) — теги как «последний хороший» коммит.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Чтение всех коммитов",
          code: `
            git log --oneline v1.0..HEAD | wc -l
            # 120 коммитов... читаем по порядку
          `,
          note: "До ста двадцати проверок «на глаз»; причина может быть в любом, а решение — субъективное.",
        },
        {
          title: "Бинарный поиск",
          code: `
            git bisect start HEAD v1.0
            git bisect run ./check.sh
            # семь проверок — найден первый плохой коммит
          `,
          note: "Для 120 коммитов достаточно около семи проверок; решение принимает скрипт.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.bisect.ex1",
      title: "Сколько проверок?",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Между известным хорошим и плохим коммитом 16 коммитов. Сколько проверок понадобится bisect в худшем случае? А если коммитов 100 и 1000? Объясните, почему число растёт так медленно."),
      ],
      hints: [
        "Каждая проверка исключает половину оставшихся.",
        "Ищите степень двойки, не меньшую числа коммитов.",
        "Сверьте с сеансом: Git сообщает `roughly N steps`.",
      ],
      checks: ["16 коммитов — 4 проверки", "100 — 7 (2⁷ = 128 ≥ 100)", "1000 — 10 (2¹⁰ = 1024 ≥ 1000)", "Объяснён принцип деления пополам"],
      solution: [
        code("text", `$ git log --oneline | wc -l
16
$ cat rate.txt
rate=25
$ git bisect start
status: waiting for both good and bad commits
$ git bisect bad
status: waiting for good commit(s), bad commit known
$ git bisect good HEAD~15
Bisecting: 7 revisions left to test after this (roughly 3 steps)
[e3303c0d6628f8151109e22653b59273016df334] Шаг 7
$ cat rate.txt
rate=18
$ git bisect good
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[e12099f601a44e41a93e4a30034ff07586b73736] Шаг 11: оптимизация расчётов
$ cat rate.txt
rate=25
$ git bisect bad
Bisecting: 1 revision left to test after this (roughly 1 step)
[86ae83e41e1bc6f473ac20da47c084b888c3a2d4] Шаг 9
$ cat rate.txt
rate=18
$ git bisect good
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[195ce13daac2b2c8173d7f742eac48040b971b19] Шаг 10
$ cat rate.txt
rate=18
$ git bisect good
e12099f601a44e41a93e4a30034ff07586b73736 is the first bad commit
commit e12099f601a44e41a93e4a30034ff07586b73736
Author: Alice Dev <alice@example.com>
Date:   Wed Jan 15 09:13:00 2025 +0000

    Шаг 11: оптимизация расчётов

 rate.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git bisect reset
Previous HEAD position was 195ce13 Шаг 10
Switched to branch 'main'`, { filename: "сеанс на 16 коммитах" }),
        p("В сеансе потребовалось четыре ответа (`good`, `bad`, `good`, `good`) — столько же, сколько показывает ⌈log₂ 16⌉ = 4. Для 100 коммитов нужно не больше 7 проверок (2⁷ = 128), для 1000 — не больше 10 (2¹⁰ = 1024): число проверок растёт логарифмически."),
      ],
    }),
    exercise({
      id: "git.bisect.ex2",
      title: "Найдите виновный коммит вручную",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("`rate.txt` содержит `rate=25`, хотя в начале истории было `rate=18`. Найдите коммит, изменивший ставку, ручным `git bisect`: отмечайте каждый предложенный Git коммит по содержимому `rate.txt`. Не забудьте завершить сессию."),
      ],
      starter: {
        lang: "bash",
        code: `
          git bisect start
          git bisect bad
          git bisect good HEAD~15
          # дальше: cat rate.txt → bisect good/bad
        `,
      },
      hints: [
        "На каждом шаге смотрите `cat rate.txt`.",
        "`rate=18` — хороший коммит, иначе — плохой.",
        "В конце — `git bisect reset`.",
      ],
      checks: ["Использованы `bad` и `good`", "Найден «Шаг 11: оптимизация расчётов»", "Выполнен `git bisect reset`", "Ветка `main` восстановлена"],
      solution: [
        code("text", `$ git log --oneline | wc -l
16
$ cat rate.txt
rate=25
$ git bisect start
status: waiting for both good and bad commits
$ git bisect bad
status: waiting for good commit(s), bad commit known
$ git bisect good HEAD~15
Bisecting: 7 revisions left to test after this (roughly 3 steps)
[e3303c0d6628f8151109e22653b59273016df334] Шаг 7
$ cat rate.txt
rate=18
$ git bisect good
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[e12099f601a44e41a93e4a30034ff07586b73736] Шаг 11: оптимизация расчётов
$ cat rate.txt
rate=25
$ git bisect bad
Bisecting: 1 revision left to test after this (roughly 1 step)
[86ae83e41e1bc6f473ac20da47c084b888c3a2d4] Шаг 9
$ cat rate.txt
rate=18
$ git bisect good
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[195ce13daac2b2c8173d7f742eac48040b971b19] Шаг 10
$ cat rate.txt
rate=18
$ git bisect good
e12099f601a44e41a93e4a30034ff07586b73736 is the first bad commit
commit e12099f601a44e41a93e4a30034ff07586b73736
Author: Alice Dev <alice@example.com>
Date:   Wed Jan 15 09:13:00 2025 +0000

    Шаг 11: оптимизация расчётов

 rate.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git bisect reset
Previous HEAD position was 195ce13 Шаг 10
Switched to branch 'main'`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.bisect.ex3",
      title: "Автоматический поиск с пропуском",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("В истории есть коммит, который не собирается (в нём файл `BROKEN`). Напишите скрипт проверки, который для такого коммита сообщает «пропустить», а для остальных проверяет `rate=18`, и найдите виновника командой `git bisect run`."),
      ],
      hints: [
        "Для пропуска скрипт возвращает 125.",
        "Хороший — 0, плохой — любой код 1–127, кроме 125.",
        "Скрипт храните вне репозитория.",
      ],
      checks: ["Скрипт возвращает 125 для `BROKEN`", "Bisect пропустил коммит и продолжил", "Найден «Шаг 6: оптимизация расчётов»", "Сессия завершена `reset`"],
      solution: [
        code("text", `$ cat /home/dev/check.sh
#!/bin/sh
# 125 — коммит нельзя проверить (сборка сломана), 0 — хороший, 1 — плохой
[ -f BROKEN ] && exit 125
grep -qx 'rate=18' rate.txt
$ git bisect start HEAD HEAD~8
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[24247d6e5680f6c215a4edf7318917691cfb36e3] Шаг 4: временно ломает сборку
$ git bisect run /home/dev/check.sh
running '/home/dev/check.sh'
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[efbe357c1aaa4318e082b58deb2c1b84fb6c56c3] Шаг 2
running '/home/dev/check.sh'
Bisecting: 2 revisions left to test after this (roughly 2 steps)
[75f363c8c812df6c83cceb18e994863b73530277] Шаг 5: чинит сборку
running '/home/dev/check.sh'
Bisecting: 1 revision left to test after this (roughly 1 step)
[48a9d18a100c3fe00552fc44572bb9fc743eb0dc] Шаг 6: оптимизация расчётов
running '/home/dev/check.sh'
48a9d18a100c3fe00552fc44572bb9fc743eb0dc is the first bad commit
commit 48a9d18a100c3fe00552fc44572bb9fc743eb0dc
Author: Alice Dev <alice@example.com>
Date:   Wed Jan 15 09:08:00 2025 +0000

    Шаг 6: оптимизация расчётов

 rate.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
bisect found first bad commit`, { filename: "решение" }),
      ],
    }),
  ],

  challenge: {
    id: "git.bisect.challenge",
    title: "От «сломалось» до отката",
    scenario: [
      p("Тест на ставку налога стал падать. Сегодня в `main` 16 коммитов с момента, когда всё работало. Нужно найти коммит, который внёс ошибку, и безопасно отменить его, не переписывая историю."),
    ],
    requirements: [
      "Описать проверку скриптом вне репозитория (код выхода 0/1)",
      "Найти первый плохой коммит автоматически",
      "Сохранить его хэш до завершения сессии",
      "Завершить сессию и откатить коммит через `git revert`",
    ],
    constraints: [
      "Не использовать `git reset --hard` и принудительную отправку",
      "Не листать историю вручную",
    ],
    acceptance: [
      "`git bisect run` сообщает `first bad commit` и показывает «Шаг 11: оптимизация расчётов»",
      "`git bisect reset` вернул ветку `main`",
      "`git revert` создал коммит отката; `rate.txt` снова `rate=18`",
      "История содержит ошибочный коммит и откат: ничего не переписано",
    ],
    hints: [
      "`refs/bisect/bad` указывает на найденный коммит, пока сессия активна.",
      "Сохраните хэш: `BAD=$(git rev-parse refs/bisect/bad)`.",
      "`git revert --no-edit \"$BAD\"` после `bisect reset`.",
    ],
    solution: [
      code("text", `$ git show --stat --format="%h %s" refs/bisect/bad
e12099f Шаг 11: оптимизация расчётов

 rate.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git bisect reset
Previous HEAD position was 195ce13 Шаг 10
Switched to branch 'main'
$ git revert --no-edit $BAD
[main 24673fd] Revert "Шаг 11: оптимизация расчётов"
 Date: Wed Jan 15 09:23:00 2025 +0000
 1 file changed, 1 insertion(+), 1 deletion(-)
$ cat rate.txt
rate=18
$ git log --oneline -3
24673fd Revert "Шаг 11: оптимизация расчётов"
8559f85 Шаг 15
63ce5d0 Шаг 14`, { filename: "решение" }),
    ],
  },

  interview: [
    iq("git.bisect.i1", "basic", "Для чего нужен `git bisect`?", [
      ul(
        "Для поиска коммита, который внёс ошибку (регрессию), бинарным поиском по истории.",
        "Вы называете хороший и плохой коммиты и проверяете предложенные Git версии; за ⌈log₂ N⌉ шагов виновник найден.",
        "Нужна воспроизводимая проверка.",
      ),
    ]),
    iq("git.bisect.i2", "basic", "Сколько шагов потребуется для 1000 коммитов?", [
      ul(
        "Не более 10: ⌈log₂ 1000⌉ = 10 (2¹⁰ = 1024).",
        "Каждый шаг исключает половину оставшихся коммитов.",
        "Для 16 коммитов в опыте — 4 проверки.",
      ),
    ]),
    iq("git.bisect.i3", "intermediate", "Как автоматизировать bisect и каков контракт скрипта?", [
      ul(
        "`git bisect run команда`: Git сам переключает коммиты и вызывает команду.",
        "Код выхода: 0 — хорошо; 1–127 (кроме 125) — плохо; 125 — пропустить; 128–255 — прервать.",
        "Скрипт должен быть детерминированным и находиться вне репозитория или быть неотслеживаемым.",
      ),
    ]),
    iq("git.bisect.i4", "intermediate", "Что такое `bisect skip` и когда он нужен?", [
      ul(
        "Отметка «этот коммит проверить нельзя» (не собирается, нет зависимостей): Git выбирает другой.",
        "В автоматическом режиме — код 125.",
        "Если пропущенные коммиты соседствуют с виновным, Git сообщает список кандидатов: `The first bad commit could be any of`.",
      ),
    ]),
    iq("git.bisect.i5", "intermediate", "Что нужно сделать после окончания bisect?", [
      ul(
        "`git bisect reset` — вернуться на исходную ветку (иначе вы остаётесь на оторванном HEAD).",
        "Сохранить результат (`git bisect log`, хэш виновного коммита).",
        "Разобрать причину: `git show`, обсуждение, `git revert` или исправление с тестом.",
      ),
    ]),
    iq("git.bisect.i6", "advanced", "Чем bisect отличается от `git log -S` и `git blame`?", [
      ul(
        "`log -S`/`blame` отвечают, когда **известно место в коде**: кто менял строку или когда появился текст.",
        "`bisect` отвечает, когда **известно только поведение**: при каком коммите оно сломалось.",
        "Инструменты дополняют друг друга: bisect находит коммит, `blame`/`log -L` объясняют контекст.",
      ),
    ]),
    iq("git.bisect.i7", "engineering", "Как сделать историю удобной для bisect?", [
      ul(
        "Атомарные коммиты: одна причина изменения — один коммит.",
        "Рабочая сборка на каждом коммите; проверка `git rebase --exec 'make test'` перед публикацией.",
        "Теги релизов как известные хорошие границы; тесты на регрессии.",
      ),
    ]),
    iq("git.bisect.i8", "debugging", "Bisect указал на коммит, который явно ни при чём. Что проверить?", [
      ul(
        "Правильность хорошего и плохого коммитов, детерминированность проверки (запустить несколько раз).",
        "`git bisect log`: не ошибочные ли отметки.",
        "Не влияет ли окружение (зависимости, кэши, сгенерированные файлы): очищать между шагами.",
        "Если есть пропуски рядом — список кандидатов, смотреть вручную.",
      ),
    ]),
  ],

  exam: [
    mcq("git.bisect.e1", "foundation", "Какой алгоритм использует `git bisect`?", ["Линейный перебор всех коммитов", "Случайный выбор", "Бинарный поиск", "Сортировку по авторам"], 2, "Каждая проверка делит оставшийся диапазон пополам, поэтому число шагов растёт логарифмически."),
    mcq("git.bisect.e2", "foundation", "Какую команду нужно выполнить по окончании bisect?", ["`git bisect reset`", "`git bisect stop`", "`git reset --hard`", "`git bisect finish`"], 0, "`git bisect reset` завершает сессию и возвращает ветку, на которой вы начинали."),
    mcq("git.bisect.e3", "foundation", "Какой код выхода скрипта в `bisect run` означает «коммит хороший»?", ["255", "1", "125", "0"], 3, "0 — хороший; 1–127 (кроме 125) — плохой; 125 — пропустить; 128–255 — прервать."),
    mcq("git.bisect.e4", "intermediate", "Что означает код 125?", ["Коммит плохой", "Коммит нельзя проверить — пропустить", "Поиск завершён", "Скрипт не найден"], 1, "125 — специальный код: Git пропускает этот коммит и выбирает другой для проверки."),
    mcq("git.bisect.e5", "intermediate", "Сколько проверок потребуется в худшем случае для 100 коммитов?", ["10", "100", "50", "7"], 3, "⌈log₂ 100⌉ = 7, потому что 2⁷ = 128 ≥ 100: каждый шаг сокращает диапазон вдвое."),
    mcq("git.bisect.e6", "intermediate", "Где должен находиться скрипт для `bisect run`?", ["В отслеживаемом файле репозитория, меняющемся вместе с коммитами", "В `.git/hooks`", "Вне репозитория или неотслеживаемым", "В любом коммите"], 2, "При переключении коммитов отслеживаемый скрипт изменится или исчезнет. Скрипт вне репозитория остаётся одним и тем же на всех шагах."),
    mcq("git.bisect.e7", "advanced", "Какие утверждения верны? Выберите все.", ["Bisect не меняет историю", "Пока идёт сессия, HEAD оторван", "Результат корректен, даже если проверка случайна", "`git bisect log` можно сохранить и воспроизвести"], [0, 1, 3], "Bisect только перемещает HEAD. Протокол можно воспроизвести `bisect replay`. Недетерминированная проверка даёт неверный результат."),
    open("git.bisect.e8", "intermediate", "Опишите процесс поиска регрессии с помощью bisect от начала до исправления.", [
      ul(
        "Воспроизвести ошибку, написать проверку (скрипт), проверить её на хорошем и плохом коммитах.",
        "`git bisect start <плохой> <хороший>`, `git bisect run <скрипт>` (при необходимости 125 для непроверяемых).",
        "Сохранить хэш (`refs/bisect/bad`), `git bisect reset`, посмотреть найденный коммит (`git show`).",
        "Откатить (`revert`) или исправить и добавить тест на регрессию.",
      ),
    ], ["Названа проверка", "Использован `bisect run`", "Выполнен `reset`", "Описано действие с найденным коммитом"]),
  ],

  mastery: [
    mcq("git.bisect.m1", "intermediate", "Bisect сообщает `The first bad commit could be any of:` и перечисляет четыре коммита. Что это значит?", ["Ошибка в Git", "Пропущенные (skip) коммиты не позволяют различить виновного среди нескольких кандидатов", "Найдены четыре виновника", "Проверка прошла успешно"], 1, "Если непроверяемые коммиты соседствуют с виновным, Git не может сузить диапазон до одного; нужно улучшить проверку или смотреть кандидатов вручную."),
    mcq("git.bisect.m2", "advanced", "Зачем сохранять хэш `refs/bisect/bad` до `git bisect reset`?", ["После reset ссылка удаляется", "Он нужен для push", "Без этого reset не работает", "Он ускоряет откат"], 0, "Служебные ссылки `refs/bisect/*` существуют только на время сессии. Хэш виновного коммита нужно сохранить, чтобы потом откатить или показать его."),
    mcq("git.bisect.m3", "advanced", "Когда `--first-parent` полезен в bisect?", ["Когда история линейна", "Когда нужно искать в чужих ветках", "Когда в основной линии много слияний веток-функций и нужно искать по слияниям", "Никогда"], 2, "Ключ ограничивает поиск первыми родителями: проверяются только коммиты основной линии (слияния), а не все коммиты боковых веток."),
    open("git.bisect.m4", "advanced", "У вас монолитный проект, сборка которого занимает 8 минут, а в истории 800 коммитов. Как организуете поиск регрессии и как сократите стоимость?", [
      ul(
        "Оценка: ⌈log₂ 800⌉ = 10 проверок × 8 минут ≈ 80 минут — приемлемо, но можно лучше.",
        "Сократить: проверка только затронутого модуля, кэш сборки, быстрый тест вместо полной сборки, параллельные окружения; код 125 для непроверяемых коммитов.",
        "Сузить границы: известный хороший релизный тег, `--first-parent` для основной линии, затем второй bisect внутри найденной ветки.",
        "Подготовить процесс: атомарные коммиты и `--exec` проверки перед публикацией.",
      ),
    ], ["Оценка числа проверок", "Способы сократить стоимость", "Сужение границ", "Меры на будущее"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.bisect.f1", front: "bisect?", back: "Бинарный поиск коммита, внёсшего ошибку: хороший + плохой коммит, проверка на каждом шаге." },
    { id: "git.bisect.f2", front: "Число шагов?", back: "⌈log₂ N⌉: 16 → 4, 100 → 7, 1000 → 10." },
    { id: "git.bisect.f3", front: "Основные команды?", back: "start, bad, good, run, skip, log, reset." },
    { id: "git.bisect.f4", front: "Коды выхода run?", back: "0 хорошо; 1–127 (кроме 125) плохо; 125 пропустить; 128–255 прервать." },
    { id: "git.bisect.f5", front: "Завершение?", back: "git bisect reset — вернуться на исходную ветку." },
    { id: "git.bisect.f6", front: "refs/bisect/bad?", back: "Найденный (текущий плохой) коммит на время сессии; хэш сохранить до reset." },
    { id: "git.bisect.f7", front: "Что делать с находкой?", back: "git show; git revert (если опубликован) или исправление + тест." },
    { id: "git.bisect.f8", front: "Условия успеха?", back: "Хороший коммит, воспроизводимая быстрая проверка, собираемые коммиты (иначе skip)." },
  ],

  sources: [
    { title: "Pro Git: Binary Search (Debugging with Git)", url: "https://git-scm.com/book/en/v2/Git-Tools-Debugging-with-Git", publisher: "Git" },
    { title: "Git documentation: git-bisect", url: "https://git-scm.com/docs/git-bisect", publisher: "Git" },
    { title: "Git documentation: git-bisect (Bisect run)", url: "https://git-scm.com/docs/git-bisect#_bisect_run", publisher: "Git" },
    { title: "Git documentation: git-bisect-lk2009", url: "https://git-scm.com/docs/git-bisect-lk2009", publisher: "Git" },
    { title: "Git documentation: git-revert", url: "https://git-scm.com/docs/git-revert", publisher: "Git" },
  ],
};
