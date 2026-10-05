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

export const resetRevertReflog: Topic = {
  id: "git.reset-revert-reflog",
  slug: "reset-revert-reflog",
  domain: "git",
  module: "advanced-git",
  title: "Reset, revert и reflog: откат и восстановление",
  titleEn: "Reset, Revert and Reflog: Undoing and Recovering",
  summary:
    "Три инструмента отката с разным смыслом. `git reset` перемещает ветку (и, по режиму, индекс и рабочее дерево) — для неопубликованной истории; `git revert` добавляет коммит с обратным изменением — для опубликованной; `git reflog` хранит локальный журнал перемещений ссылок и спасает после ошибок. Тема на опытах показывает три режима reset, потерю несохранённых правок при `--hard`, восстановление через `HEAD@{n}`, откат диапазонов и коммитов слияния, а также ловушку повторного слияния после `revert -m 1`.",
  minutes: 85,
  prerequisites: ["git.undoing-changes", "git.rebase", "git.branches-head"],
  tags: ["git reset", "reset --soft", "reset --mixed", "reset --hard", "git revert", "revert -m 1", "git reflog", "HEAD@{n}", "ORIG_HEAD", "recovery", "undo", "reapply"],
  keyConcepts: [
    { term: "Reset двигает ветку; режим решает судьбу индекса и файлов", text: "`--soft` — только ветка (изменения остаются подготовленными: `M  a.txt`, `A  b.txt`); `--mixed` (по умолчанию) — ещё и индекс (` M a.txt`, `?? b.txt`); `--hard` — ещё и рабочее дерево (чисто)." },
    { term: "`reset --hard` стирает неподготовленные правки безвозвратно", text: "В опыте `reset --hard HEAD~2` убрал и коммиты (их вернул `reflog`), и правку `base.txt` — после восстановления файл содержит прежнее `основа`." },
    { term: "Revert добавляет обратный коммит", text: "`git revert --no-edit HEAD~1` создал `Revert \"Версия 4 (с ошибкой)\"` с текстом `This reverts commit a10bb62…`; история сохранилась, а `a.txt` вернулся к `v3`." },
    { term: "Reflog — журнал перемещений ссылок", text: "Строки `HEAD@{1}: commit: Версия 3`, `reset: moving to HEAD~2` позволили вернуть потерянные коммиты: `git reset --hard HEAD@{1}`." },
    { term: "Откат слияния требует `-m 1`, а повторное слияние — отката отката", text: "После `revert -m 1` команда `git merge feature` ответила `Already up to date.`; вернуть фичу помог `git revert` самого коммита отката (`Reapply \"Влить feature\"`)." },
  ],
  sections: [
    section("definition", [
      def("git reset", "Команда, которая перемещает текущую ветку на указанный коммит. В зависимости от режима (`--soft`, `--mixed`, `--hard`) она также приводит индекс и рабочее дерево к этому коммиту.", "reset"),
      def("git revert", "Команда, которая создаёт **новый** коммит, отменяющий изменения указанного коммита. История растёт, а не переписывается.", "revert"),
      def("Reflog", "Локальный журнал перемещений HEAD и веток: каждая запись — «ссылка была здесь, а затем сдвинулась». Адресуется как `HEAD@{n}` или `ветка@{n}`.", "reference log"),
      def("ORIG_HEAD", "Ссылка, куда Git кладёт прежнее положение HEAD перед операциями `reset`, `merge`, `rebase`. Позволяет вернуться: `git reset --hard ORIG_HEAD`.", "ORIG_HEAD"),
      def("Достижимость", "Коммит достижим, если до него можно дойти от какой-либо ссылки (ветка, тег, HEAD). Недостижимые коммиты остаются в базе до сборки мусора и находятся через reflog.", "reachability"),
      def("Откат слияния", "`git revert -m 1 <коммит слияния>`: отмена изменений, принесённых слиянием, с выбором родителя (`-m 1` — основная линия).", "reverting a merge"),
    ]),

    section("why", [
      h("Три задачи — три инструмента"),
      p("Слово «откатить» в Git описывает три разные ситуации, и инструмент зависит от того, куда мы смотрим — в прошлое своего репозитория или в общую историю."),
      table(
        ["Ситуация", "Инструмент", "Почему"],
        [
          ["Свои неопубликованные коммиты нужно «стереть» или переделать", "`git reset`", "Двигает ветку назад; чужих копий нет — переписывать безопасно"],
          ["Опубликованный коммит оказался ошибочным", "`git revert`", "Добавляет коммит-отмену; у коллег история растёт, а не расходится"],
          ["Что-то «пропало» после reset, rebase, amend, удаления ветки", "`git reflog`", "Находит коммиты, на которые больше никто не указывает"],
        ],
        "Что использовать",
      ),
      ul(
        "**Безопасность.** Знание, что `reset --hard` разрушает, а `revert` нет, спасает работу и нервы.",
        "**Скорость.** Откатить ошибочный коммит — одна команда; восстановить потерянное — две.",
        "**Командная работа.** Правило «переписываем только своё» формулируется именно через различие reset и revert.",
      ),
      tip("Перед любой разрушительной командой спросите: «есть ли у меня способ вернуться?» Для коммитов — `reflog`; для неподготовленных правок — только их сохранение (`git stash`, `git add`) заранее."),
    ]),

    section("mental-model", [
      h("Что двигает reset"),
      diagram(
        `
        HEAD ──► main ──► c3 ◄── c2 ◄── c1            git reset <режим> c2

                  ┌────────────────────────────────────────────────────────────┐
        режим     │ ветка main │ индекс            │ рабочее дерево             │
        ──────────┼────────────┼───────────────────┼────────────────────────────┤
        --soft    │ → c2       │ без изменений     │ без изменений              │
        --mixed   │ → c2       │ = c2              │ без изменений              │
        --hard    │ → c2       │ = c2              │ = c2  (правки пропадают)   │
                  └────────────────────────────────────────────────────────────┘
        `,
        "Reset перемещает ветку на c2; чем жёстче режим, тем больше областей приводится к c2.",
      ),
      h("Revert не двигает ветку назад"),
      diagram(
        `
        c1 ◄── c2 ◄── c3 ◄── c4                        git revert c3
                                │
        c1 ◄── c2 ◄── c3 ◄── c4 ◄── R3                 R3 = коммит с обратным изменением c3

        история только растёт: c3 остаётся, а R3 отменяет его действие
        `,
        "Revert безопасен для опубликованного: ветка движется вперёд.",
      ),
      insight("Reset переписывает, revert дополняет, reflog помнит. Первая пара — про то, что вы делаете, а reflog — про то, что можно сделать, когда ошиблись."),
    ]),

    section("technical", [
      h("Режимы reset"),
      table(
        ["Команда", "Ветка", "Индекс", "Рабочее дерево", "Типичное применение"],
        [
          ["`git reset --soft <коммит>`", "Да", "Нет", "Нет", "Переделать последние коммиты (изменения остаются подготовленными)"],
          ["`git reset [--mixed] <коммит>`", "Да", "Да", "Нет", "Расформировать коммиты, оставив правки в файлах"],
          ["`git reset --hard <коммит>`", "Да", "Да", "Да", "Полностью вернуться к коммиту; несохранённые правки теряются"],
          ["`git reset <путь>`", "Нет", "Для пути", "Нет", "Снять подготовку файла (то же, что `git restore --staged`)"],
        ],
        "Режимы git reset",
      ),
      p("Есть и осторожные варианты: `--keep` не трогает файлы с неподготовленными правками и отказывается, если сброс их затрагивает; `--merge` аналогичен для случая остановленного слияния."),
      h("git revert"),
      ul(
        "`git revert <коммит>` вычисляет обратное изменение и записывает коммит `Revert \"…\"` с пояснением `This reverts commit <хэш>`.",
        "Для нескольких коммитов применяйте от новых к старым: `git revert -n HEAD HEAD~1`, затем один общий коммит; ключ `-n` (`--no-commit`) подготавливает изменения без коммита.",
        "Коммит слияния нужно откатывать с параметром `-m <номер родителя>` (обычно `-m 1` — основная линия).",
        "Конфликты при откате разрешаются как при cherry-pick: `--continue`, `--skip`, `--abort`.",
      ),
      h("Reflog"),
      ul(
        "`git reflog` — записи для HEAD; `git reflog show <ветка>` — для ветки. Запись: хэш, `HEAD@{n}`, действие (`commit`, `checkout`, `merge`, `reset`, `rebase`…) и сообщение.",
        "`HEAD@{1}` — где был HEAD один шаг назад, `HEAD@{n}` — n шагов (не коммитов!). Выражения работают в любой команде (`git diff HEAD@{1} HEAD`, `git reset --hard HEAD@{2}`).",
        "Reflog **локален**: он создаётся там, где выполнялись операции, и не передаётся при `push` и `clone`.",
        "Записи не вечны: по умолчанию достижимые живут 90 дней, недостижимые — 30 (`gc.reflogExpire`, `gc.reflogExpireUnreachable`). После этого сборка мусора удаляет сами коммиты.",
      ),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git reset --soft HEAD~1
git reset HEAD~1
git reset --hard HEAD~1
git revert <коммит>
git revert -m 1 <слияние>
git reflog
git reset --hard HEAD@{1}
git branch восстановленная <хэш>`,
        [
          { line: 1, text: "Убрать последний коммит, оставив изменения подготовленными." },
          { line: 2, text: "Убрать последний коммит, оставив изменения в рабочем дереве (неподготовленными)." },
          { line: 3, text: "Убрать последний коммит и его изменения целиком — осторожно, правки пропадут." },
          { line: 4, text: "Добавить коммит, отменяющий указанный." },
          { line: 5, text: "Отменить слияние, считая основной линией первого родителя." },
          { line: [6, 7], text: "Найти потерянное и вернуться: журнал и жёсткий сброс на нужную запись." },
          { line: 8, text: "Спасти коммит, создав на нём ветку." },
        ],
        "команды отката",
      ),
    ]),

    section("minimal-example", [
      h("Три режима reset на одном коммите"),
      p("Три коммита. Откатим последний (`Версия 3`: меняет `a.txt` и добавляет `b.txt`) каждым режимом, возвращаясь к исходному состоянию через `ORIG_HEAD`:"),
      code("text", `$ git log --oneline
8c555c7 Версия 3
c4b603f Версия 2
2779c1a Версия 1
# --soft: сдвигается только ветка; изменения остаются подготовленными
$ git reset --soft HEAD~1
$ git log --oneline
c4b603f Версия 2
2779c1a Версия 1
$ git status -s
M  a.txt
A  b.txt
# --mixed (по умолчанию): ветка и индекс; изменения остаются в рабочем дереве
$ git reset HEAD~1
Unstaged changes after reset:
M	a.txt
$ git status -s
 M a.txt
?? b.txt
$ cat a.txt
v3
# --hard: ветка, индекс и рабочее дерево
$ git reset --hard HEAD~1
HEAD is now at c4b603f Версия 2
$ git status -s
$ cat a.txt
v2
$ ls
a.txt
base.txt`, { filename: "сеанс: --soft, --mixed, --hard" }),
      ul(
        "`--soft`: коммит исчез из `git log`, а изменения остались **подготовленными** (`M  a.txt`, `A  b.txt`) — можно сразу сделать новый коммит.",
        "`--mixed`: изменения остались в файлах, но не подготовлены (` M a.txt`, `?? b.txt`; `a.txt` содержит `v3`). Git даже напоминает: `Unstaged changes after reset`.",
        "`--hard`: файлы тоже вернулись — `a.txt` содержит `v2`, `b.txt` исчез (`ls`).",
        "`git reset --hard ORIG_HEAD` между опытами возвращал ветку на исходную вершину: прежнее положение Git запомнил сам.",
      ),
    ]),

    section("detailed-example", [
      h("«Потерял коммиты»: reflog"),
      p("Выполним `reset --hard HEAD~2` при наличии несохранённой правки в `base.txt`, затем попробуем вернуться:"),
      code("text", `$ git status -s
 M base.txt
$ git reset --hard HEAD~2
HEAD is now at 2779c1a Версия 1
$ git log --oneline
2779c1a Версия 1
$ git status -s
# коммиты «пропали» из log, но остались в reflog
$ git reflog -5
2779c1a HEAD@{0}: reset: moving to HEAD~2
8c555c7 HEAD@{1}: commit: Версия 3
c4b603f HEAD@{2}: commit: Версия 2
2779c1a HEAD@{3}: commit (initial): Версия 1
$ git reset --hard HEAD@{1}
HEAD is now at 8c555c7 Версия 3
$ git log --oneline
8c555c7 Версия 3
c4b603f Версия 2
2779c1a Версия 1
$ cat base.txt
основа`, { filename: "сеанс: reset --hard и восстановление" }),
      ul(
        "После `reset --hard HEAD~2` в `git log` один коммит, статус чист.",
        "`git reflog` хранит ход событий: `reset: moving to HEAD~2` и под ним `HEAD@{1}: commit: Версия 3`, `HEAD@{2}: commit: Версия 2`.",
        "`git reset --hard HEAD@{1}` вернул обе потерянные версии.",
        "А вот несохранённая правка `base.txt` не вернулась: файл содержит `основа`. Reflog хранит коммиты, а не то, что лежало на диске без коммита.",
      ),
      h("Отменить опубликованный коммит: revert"),
      code("text", `$ git revert --no-edit HEAD~1
[main 97d7fbb] Revert "Версия 4 (с ошибкой)"
 Date: Wed Jan 15 09:07:00 2025 +0000
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline
97d7fbb Revert "Версия 4 (с ошибкой)"
b265230 Версия 5
a10bb62 Версия 4 (с ошибкой)
8c555c7 Версия 3
c4b603f Версия 2
2779c1a Версия 1
$ cat a.txt
v3
$ git show --stat --format=%B HEAD
Revert "Версия 4 (с ошибкой)"

This reverts commit a10bb621d1b086558c5082a6fe9e221987a58c4f.


 a.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)`, { filename: "сеанс: git revert" }),
      ul(
        "`git revert --no-edit HEAD~1` откатил **предпоследний** коммит (`Версия 4 (с ошибкой)`), не трогая следующий (`Версия 5`).",
        "В истории новый коммит `Revert \"Версия 4 (с ошибкой)\"`; `a.txt` снова `v3`.",
        "В сообщении — ссылка `This reverts commit a10bb62…`: так видно, что и зачем отменено.",
      ),
    ]),

    section("analysis", [
      h("Откат нескольких коммитов одним"),
      code("text", `$ git revert -n HEAD HEAD~1
$ git status -s
M  a.txt
$ cat a.txt
v3
$ git commit -m "Откатить версии 4 и 5"
[main e5fcd4d] Откатить версии 4 и 5
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline
e5fcd4d Откатить версии 4 и 5
18564c7 Версия 5 (тоже с ошибкой)
a10bb62 Версия 4 (с ошибкой)
8c555c7 Версия 3
c4b603f Версия 2
2779c1a Версия 1`, { filename: "сеанс: revert -n для нескольких коммитов" }),
      p("Два ошибочных коммита (версии 4 и 5) отменены одним: `git revert -n HEAD HEAD~1` применяет обратные изменения от новых к старым и подготавливает их, а затем делается один обычный коммит. Результат — `a.txt` снова `v3`. Диапазон `A..B` тоже работает, но исключает `A` (как в `cherry-pick`)."),
      h("Reset или revert?"),
      table(
        ["Вопрос", "reset", "revert"],
        [
          ["Меняет историю?", "Да (ветка идёт назад)", "Нет (добавляет коммит)"],
          ["Безопасно для опубликованного?", "Нет: нужна принудительная отправка", "Да"],
          ["След в истории", "Нет: коммит «исчез»", "Есть: виден и сам коммит, и его отмена"],
          ["Откат слияния", "Просто, но переписывает", "Нужен `-m 1` и осторожность с повторным слиянием"],
          ["Когда", "Неопубликованные коммиты, подготовка истории", "Опубликованные коммиты, общие ветки"],
        ],
        "Сравнение reset и revert",
      ),
    ]),

    section("internals", [
      h("Откат слияния и ловушка повторного слияния"),
      code("text", `$ git merge --no-ff -m "Влить feature" feature
Merge made by the 'ort' strategy.
 feature.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 feature.txt
$ git revert -m 1 --no-edit HEAD
[main 0637bfa] Revert "Влить feature"
 Date: Wed Jan 15 09:08:00 2025 +0000
 1 file changed, 1 deletion(-)
 delete mode 100644 feature.txt
$ git log --oneline --graph --decorate
* 0637bfa (HEAD -> main) Revert "Влить feature"
*   53b190e Влить feature
|\\  
| * fc8909e (feature) Фича
* | 9a36cb3 Правка main
|/  
* 5e5df4c Основа
# ветка feature снова готова, но повторное слияние ничего не вносит
$ git merge feature
Already up to date.
$ ls
base.txt
main.txt
# сначала отменяем откат, потом слияние снова возможно
$ git revert --no-edit HEAD
[main 12870ce] Reapply "Влить feature"
 Date: Wed Jan 15 09:12:00 2025 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 feature.txt
$ ls
base.txt
feature.txt
main.txt`, { filename: "сеанс: revert -m 1 и повторное слияние" }),
      ul(
        "`git revert -m 1 --no-edit HEAD` отменил слияние: удалил `feature.txt`, сохранив изменения основной линии (`main.txt`).",
        "Ветка `feature` осталась нетронутой, но `git merge feature` отвечает `Already up to date.` — Git считает, что её коммиты уже влиты (они достижимы), и не вносит их заново.",
        "Чтобы вернуть изменения, нужно сначала **отменить откат**: `git revert HEAD` создал `Reapply \"Влить feature\"`, и `feature.txt` вернулся. (Альтернатива — новые коммиты в ветке или слияние заново через изменённую ветку.)",
      ),
      h("Что запоминает reflog"),
      code("text", `$ git reflog
8c555c7 HEAD@{0}: reset: moving to HEAD~1
0c605e2 HEAD@{1}: merge feature: Fast-forward
8c555c7 HEAD@{2}: checkout: moving from feature to main
0c605e2 HEAD@{3}: commit: Фича
8c555c7 HEAD@{4}: checkout: moving from main to feature
8c555c7 HEAD@{5}: commit: Версия 3
c4b603f HEAD@{6}: commit: Версия 2
2779c1a HEAD@{7}: commit (initial): Версия 1
$ git reflog show feature
0c605e2 feature@{0}: commit: Фича
8c555c7 feature@{1}: branch: Created from HEAD
$ git diff --stat HEAD@{1} HEAD
 feature.txt | 1 -
 1 file changed, 1 deletion(-)
$ git log -1 --oneline HEAD@{4}
8c555c7 Версия 3`, { filename: "сеанс: записи reflog" }),
      ul(
        "Каждая операция оставляет запись: `commit`, `checkout: moving from … to …`, `merge feature: Fast-forward`, `reset: moving to HEAD~1`.",
        "`git reflog show feature` — журнал самой ветки (`feature@{0}`, `feature@{1}: branch: Created from HEAD`).",
        "`HEAD@{1}` и `HEAD@{4}` — относительные адреса записей: `git diff --stat HEAD@{1} HEAD` показал, что последний `reset` убрал `feature.txt`.",
      ),
      note("Рядом с `reflog` лежит `ORIG_HEAD` — запись о прежнем положении перед `reset`, `merge`, `rebase`. Она проще: один шаг назад, но перезаписывается следующей операцией, поэтому для длинных цепочек надёжнее `reflog`."),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git reset --hard HEAD~3        # «откатываю»; три коммита уже на сервере
            git push --force                # «чтобы у всех было так же»
          `,
          note: "Переписана опубликованная история: у коллег остаются старые коммиты, возможна потеря чужой работы.",
        },
        {
          title: "Верно",
          code: `
            git revert -n HEAD~2..HEAD     # или revert отдельных коммитов
            git commit -m "Откатить …"
            git push                       # обычная отправка
          `,
          note: "Опубликованное отменяется новым коммитом; история остаётся общей.",
        },
      ),
      ul(
        "**Использовать `reset --hard`, не посмотрев `git status`:** неподготовленные правки исчезнут навсегда.",
        "**Откатывать опубликованное через `reset`** и принудительную отправку.",
        "**Путать `HEAD~n` и `HEAD@{n}`:** первое — родители по графу, второе — записи журнала.",
        "**Повторно сливать откатанную ветку** и удивляться, что ничего не происходит: сначала `revert` самого отката.",
        "**Откатывать коммит слияния без `-m`:** Git откажется — не знает, какого родителя считать основным.",
        "**Рассчитывать на reflog в другой копии:** он локален; у коллеги или на сервере нужных записей может не быть.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Привычка «reset --hard, чтобы всё починить»:** вместе с ошибкой теряется текущая работа. Сначала `git stash` или коммит.",
        "**Откат опубликованных коммитов через reset + force:** разрушает клоны коллег; для общих веток — только `revert`.",
        "**Бесконечные цепочки `Revert \"Revert \"…\"\"`:** показывают, что команда не договорилась о процессе; фиксируйте решение и причину.",
        "**Откат слияния без плана повторного слияния:** ветка «навсегда» считается влитой.",
        "**Надежда на reflog как резервную копию:** срок жизни ограничен, локален и не передаётся.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Перед `reset --hard` — `git status` и `git diff`.** Если есть что терять — `git stash` или коммит.",
        "**Для опубликованных коммитов используйте `revert`.** В сообщении укажите причину отката.",
        "**Мягкие режимы для переделки:** `--soft` или `--mixed`, если нужно сохранить изменения.",
        "**После ошибки не паникуйте:** `git reflog` → нужная запись → `git reset --hard HEAD@{n}` (или `git branch rescue <хэш>`).",
        "**Для отката слияния** используйте `revert -m 1` и заранее решите, как вернуть ветку (revert отката).",
        "**Запоминайте `ORIG_HEAD`:** после `reset`, `merge`, `rebase` это самый быстрый способ вернуться.",
        "**Не откладывайте восстановление:** записи reflog и недостижимые коммиты со временем удаляются.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**`git reset <коммит> -- <путь>`** не двигает ветку: подготавливает версию файла из коммита (аналог `restore --staged --source`).",
        "**Reset на коммит из другой ветки** — перемещает текущую ветку на него; изменения ветки теряют достижимость, но остаются в reflog.",
        "**Удалённую ветку** можно восстановить: найти хэш в reflog или в выводе `git branch -D`, затем `git branch имя хэш`.",
        "**`git reflog` и сам репозиторий:** в только что клонированной копии журнал пуст, пока вы не начали операции.",
        "**`git revert` для слияния при конфликте:** `--continue` и `--abort` работают так же, как при cherry-pick.",
        "**Очистка reflog** (`git reflog expire --expire=now --all` + `git gc --prune=now`) удаляет возможность восстановления: делают только осознанно.",
      ),
    ]),

    section("related", [
      ul(
        "[Отмена изменений](/learn/git/undoing-changes) — `restore`, `clean`, `--amend`, первый взгляд на `revert`.",
        "[Rebase](/learn/git/rebase) — `ORIG_HEAD` и отмена перебазирования.",
        "[Ветки и HEAD](/learn/git/branches-head) — спасение коммитов оторванного HEAD.",
        "[Слияние веток](/learn/git/merge) — коммиты слияния и их родители.",
        "[Ссылки, пакеты и сборка мусора](/learn/git/refs-packfiles-gc) — когда исчезают недостижимые коммиты.",
        "[Bisect](/learn/git/bisect) — найти коммит, который стоит откатить.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Откат вслепую",
          code: `
            git reset --hard HEAD~2
            # «ой, не те коммиты… и ещё потерял правки»
          `,
          note: "Без `git status` и без плана возврата: неподготовленные правки утрачены, коммиты нужно искать.",
        },
        {
          title: "Откат с запасом",
          code: `
            git status -s            # что можно потерять?
            git stash                # сохранить, если нужно
            git reset --hard HEAD~2
            git reflog               # если ошиблись
            git reset --hard HEAD@{1}
          `,
          note: "Перед разрушительной командой — проверка и сохранение; после — известный путь возврата.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.reset-revert-reflog.ex1",
      title: "Три режима reset",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Последний коммит меняет `a.txt` и добавляет `b.txt`. Предскажите, что покажут `git status -s` и содержимое `a.txt` после `git reset --soft HEAD~1`, `git reset HEAD~1` и `git reset --hard HEAD~1`. Что станет с `b.txt` в каждом случае?"),
      ],
      hints: [
        "`--soft` не трогает ни индекс, ни файлы.",
        "`--mixed` приводит индекс к новому HEAD, но не файлы.",
        "`--hard` приводит и файлы.",
      ],
      checks: ["`--soft`: `M  a.txt`, `A  b.txt`", "`--mixed`: ` M a.txt`, `?? b.txt`, `a.txt` = v3", "`--hard`: чисто, `a.txt` = v2, `b.txt` исчез"],
      solution: [
        code("text", `$ git log --oneline
8c555c7 Версия 3
c4b603f Версия 2
2779c1a Версия 1
# --soft: сдвигается только ветка; изменения остаются подготовленными
$ git reset --soft HEAD~1
$ git log --oneline
c4b603f Версия 2
2779c1a Версия 1
$ git status -s
M  a.txt
A  b.txt
# --mixed (по умолчанию): ветка и индекс; изменения остаются в рабочем дереве
$ git reset HEAD~1
Unstaged changes after reset:
M	a.txt
$ git status -s
 M a.txt
?? b.txt
$ cat a.txt
v3
# --hard: ветка, индекс и рабочее дерево
$ git reset --hard HEAD~1
HEAD is now at c4b603f Версия 2
$ git status -s
$ cat a.txt
v2
$ ls
a.txt
base.txt`, { filename: "проверка в настоящем репозитории" }),
      ],
    }),
    exercise({
      id: "git.reset-revert-reflog.ex2",
      title: "Верните «потерянные» коммиты",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Вы выполнили `git reset --hard HEAD~2` и поняли, что ошиблись: два коммита исчезли. Верните их. Что произойдёт с правкой, которую вы не успели закоммитить до сброса?"),
      ],
      hints: [
        "Все перемещения HEAD записаны в журнале.",
        "`HEAD@{n}` — адрес записи; нужная — перед `reset`.",
        "Подумайте, попадала ли неподготовленная правка в базу объектов.",
      ],
      checks: ["Использован `git reflog`", "Выполнен `git reset --hard HEAD@{1}`", "Коммиты вернулись", "Несохранённая правка не вернулась (объяснено почему)"],
      solution: [
        code("text", `$ git status -s
 M base.txt
$ git reset --hard HEAD~2
HEAD is now at 2779c1a Версия 1
$ git log --oneline
2779c1a Версия 1
$ git status -s
# коммиты «пропали» из log, но остались в reflog
$ git reflog -5
2779c1a HEAD@{0}: reset: moving to HEAD~2
8c555c7 HEAD@{1}: commit: Версия 3
c4b603f HEAD@{2}: commit: Версия 2
2779c1a HEAD@{3}: commit (initial): Версия 1
$ git reset --hard HEAD@{1}
HEAD is now at 8c555c7 Версия 3
$ git log --oneline
8c555c7 Версия 3
c4b603f Версия 2
2779c1a Версия 1
$ cat base.txt
основа`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.reset-revert-reflog.ex3",
      title: "Откатить слияние и вернуть ветку",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Ветка `feature` влита в `main` (`--no-ff`), но выяснилось, что слияние ломает сборку. Откатите слияние без переписывания истории. Через неделю исправленная `feature` готова: почему `git merge feature` ничего не вносит и как вернуть изменения?"),
      ],
      hints: [
        "Для коммита слияния нужно указать основного родителя.",
        "Git считает коммиты ветки уже влитыми, раз они достижимы.",
        "Откат тоже коммит — его можно отменить.",
      ],
      checks: ["Использован `git revert -m 1`", "Историю не переписывали", "Повторное слияние: `Already up to date.`", "Для возврата — `revert` коммита-отката (`Reapply`)"],
      solution: [
        code("text", `$ git merge --no-ff -m "Влить feature" feature
Merge made by the 'ort' strategy.
 feature.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 feature.txt
$ git revert -m 1 --no-edit HEAD
[main 0637bfa] Revert "Влить feature"
 Date: Wed Jan 15 09:08:00 2025 +0000
 1 file changed, 1 deletion(-)
 delete mode 100644 feature.txt
$ git log --oneline --graph --decorate
* 0637bfa (HEAD -> main) Revert "Влить feature"
*   53b190e Влить feature
|\\  
| * fc8909e (feature) Фича
* | 9a36cb3 Правка main
|/  
* 5e5df4c Основа
# ветка feature снова готова, но повторное слияние ничего не вносит
$ git merge feature
Already up to date.
$ ls
base.txt
main.txt
# сначала отменяем откат, потом слияние снова возможно
$ git revert --no-edit HEAD
[main 12870ce] Reapply "Влить feature"
 Date: Wed Jan 15 09:12:00 2025 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 feature.txt
$ ls
base.txt
feature.txt
main.txt`, { filename: "решение" }),
      ],
    }),
  ],

  challenge: {
    id: "git.reset-revert-reflog.challenge",
    title: "Откатить ошибочные опубликованные коммиты",
    scenario: [
      p("В `main` уже опубликованы две версии с ошибкой (версии 4 и 5); пользователи жалуются. Нужно вернуть рабочее состояние (версия 3) так, чтобы не переписывать историю и чтобы по истории было видно, что и зачем откатили."),
    ],
    requirements: [
      "Откатить оба коммита, не используя `reset` и принудительную отправку",
      "Собрать откат одним коммитом с понятным сообщением",
      "Порядок отката — от новых коммитов к старым",
      "Проверить содержимое файла после отката",
    ],
    constraints: [
      "История остаётся прежней: ни один из прежних коммитов не меняется",
      "Не использовать `git reset --hard`",
    ],
    acceptance: [
      "`git log --oneline` содержит оба ошибочных коммита и новый коммит отката сверху",
      "`a.txt` снова содержит `v3`",
      "Сообщение отката называет откатываемые версии",
    ],
    hints: [
      "`git revert -n HEAD HEAD~1` подготавливает обратные изменения без коммитов.",
      "Затем обычный `git commit -m …`.",
      "Проверьте `git status -s` и `cat a.txt` перед коммитом.",
    ],
    solution: [
      code("text", `$ git revert -n HEAD HEAD~1
$ git status -s
M  a.txt
$ cat a.txt
v3
$ git commit -m "Откатить версии 4 и 5"
[main e5fcd4d] Откатить версии 4 и 5
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline
e5fcd4d Откатить версии 4 и 5
18564c7 Версия 5 (тоже с ошибкой)
a10bb62 Версия 4 (с ошибкой)
8c555c7 Версия 3
c4b603f Версия 2
2779c1a Версия 1`, { filename: "решение" }),
    ],
  },

  interview: [
    iq("git.reset-revert-reflog.i1", "basic", "Чем `git reset` отличается от `git revert`?", [
      ul(
        "`reset` перемещает ветку назад (переписывает историю), `revert` добавляет новый коммит с обратным изменением.",
        "`reset` — для неопубликованных коммитов; `revert` безопасен для опубликованных.",
        "Следы: после `reset` коммит «исчезает» из ветки, после `revert` остаётся виден и сам коммит, и его отмена.",
      ),
    ]),
    iq("git.reset-revert-reflog.i2", "basic", "Что делают режимы `--soft`, `--mixed`, `--hard`?", [
      ul(
        "`--soft` — перемещает только ветку; изменения остаются подготовленными.",
        "`--mixed` (по умолчанию) — ветка и индекс; изменения остаются в рабочем дереве.",
        "`--hard` — ветка, индекс и рабочее дерево; несохранённые правки теряются.",
      ),
    ]),
    iq("git.reset-revert-reflog.i3", "intermediate", "Что такое reflog и что он спасает?", [
      ul(
        "Локальный журнал перемещений HEAD и веток: `git reflog`, `HEAD@{n}`.",
        "Позволяет найти коммиты, на которые больше никто не указывает: после `reset --hard`, `rebase`, `amend`, удаления ветки.",
        "Живёт 90 дней (достижимые записи) и 30 дней (недостижимые) по умолчанию; не передаётся при `push`/`clone`.",
      ),
    ]),
    iq("git.reset-revert-reflog.i4", "intermediate", "Как вернуть коммиты после ошибочного `reset --hard`?", [
      ul(
        "`git reflog` — найти запись перед `reset`.",
        "`git reset --hard HEAD@{n}` или `git branch rescue <хэш>`.",
        "Несохранённые правки рабочего дерева так не вернуть: они не были в базе объектов.",
      ),
    ]),
    iq("git.reset-revert-reflog.i5", "intermediate", "Как откатить коммит слияния?", [
      ul(
        "`git revert -m 1 <слияние>` — указать основного родителя (1 — основная линия).",
        "Историю не переписываем; изменения ветки отменены.",
        "Но повторное слияние той же ветки ничего не внесёт: нужно отменить откат (`git revert <коммит-откат>`) или слить заново после перестройки ветки.",
      ),
    ]),
    iq("git.reset-revert-reflog.i6", "advanced", "Чем `HEAD~2` отличается от `HEAD@{2}`?", [
      ul(
        "`HEAD~2` — коммит на два родителя назад по графу.",
        "`HEAD@{2}` — положение HEAD два шага назад по журналу (reflog): это могут быть переключения, коммиты, `reset`, не связанные с родителями.",
        "Первое относится к истории, второе — к вашим действиям в этом репозитории.",
      ),
    ]),
    iq("git.reset-revert-reflog.i7", "engineering", "Как вы принимаете решение «reset или revert» в команде?", [
      ul(
        "Если коммит ещё не опубликован — `reset`/`amend`/rebase для чистки истории.",
        "Если опубликован и в общей ветке — `revert` с объяснением в сообщении; принудительная отправка только в личные ветки.",
        "Для крупного отката — запланировать повторную доставку (как вернуть откатанные изменения).",
      ),
    ]),
    iq("git.reset-revert-reflog.i8", "debugging", "Вы выполнили `git reset --hard` и потеряли неподготовленные правки. Что делать?", [
      ul(
        "Остановиться: reflog хранит коммиты, а не файлы без коммита.",
        "Проверить, подготавливались ли правки: `git fsck --lost-found` может найти blob.",
        "Искать в истории редактора, резервных копиях, временных файлах.",
        "Урок: перед `--hard` — `git status`, `git stash` или коммит.",
      ),
    ]),
  ],

  exam: [
    mcq("git.reset-revert-reflog.e1", "foundation", "Какой режим reset не затрагивает ни индекс, ни рабочее дерево?", ["`--hard`", "`--mixed`", "`--soft`", "Такого нет"], 2, "`--soft` перемещает только ветку: изменения откатываемых коммитов остаются подготовленными в индексе."),
    mcq("git.reset-revert-reflog.e2", "foundation", "Какая команда безопасна для отмены уже опубликованного коммита?", ["`git revert`", "`git reset --hard`", "`git push --force`", "`git clean`"], 0, "`revert` добавляет коммит с обратным изменением, не переписывая историю; у коллег она просто продолжается."),
    mcq("git.reset-revert-reflog.e3", "foundation", "Что показывает `git reflog`?", ["Историю коммитов ветки", "Список тегов", "Список удалённых веток на сервере", "Журнал перемещений HEAD (и веток) в этом репозитории"], 3, "Reflog — локальный журнал того, где находился HEAD: переключения, коммиты, `reset`, `rebase`."),
    mcq("git.reset-revert-reflog.e4", "intermediate", "Что станет с неподготовленной правкой в `base.txt` после `git reset --hard HEAD~2`?", ["Сохранится", "Пропадёт безвозвратно", "Попадёт в stash", "Станет подготовленной"], 1, "`--hard` приводит рабочее дерево к коммиту. Правка, которой нет ни в одном коммите, не попадает в базу объектов, поэтому reflog её не вернёт."),
    mcq("git.reset-revert-reflog.e5", "intermediate", "Почему для коммита слияния `git revert` требует `-m`?", ["Потому что слияния нельзя откатывать", "Чтобы удалить ветку", "Для скорости", "Нужно указать, какого из родителей считать основной линией"], 3, "У коммита слияния два родителя; Git должен знать, относительно какого считать откатываемые изменения (обычно `-m 1`)."),
    mcq("git.reset-revert-reflog.e6", "intermediate", "После `revert -m 1` слияния команда `git merge feature` отвечает `Already up to date.` Почему?", ["Ветка `feature` удалена", "Это ошибка", "Коммиты `feature` достижимы из `main`, Git считает их уже влитыми", "Нужен ключ `-f`"], 2, "Откат слияния не убирает связь с коммитами ветки. Чтобы вернуть изменения, нужно отменить сам коммит отката (`Reapply`)."),
    mcq("git.reset-revert-reflog.e7", "advanced", "Какие утверждения верны? Выберите все.", ["Reflog хранится локально и не передаётся при `push`", "`HEAD@{n}` и `HEAD~n` — одно и то же", "`git reset --keep` не затирает неподготовленные правки, затрагиваемые сбросом", "Записи reflog и недостижимые коммиты живут вечно"], [0, 2], "`HEAD~n` — предки по графу, `HEAD@{n}` — шаги журнала. Reflog и недостижимые коммиты очищаются: 90/30 дней по умолчанию и сборкой мусора."),
    open("git.reset-revert-reflog.e8", "intermediate", "Сравните reset и revert и опишите, как вы выберете инструмент для отката.", [
      ul(
        "`reset` переписывает историю, `revert` добавляет коммит; `reset` — для неопубликованных, `revert` — для опубликованных.",
        "Критерии: опубликован ли коммит, нужен ли след в истории, чем рискуем (потеря правок при `--hard`).",
        "Страховка: reflog и `ORIG_HEAD` для reset; план повторного возврата при откате слияния.",
      ),
    ], ["Описаны оба инструмента", "Критерий публикации", "Названа страховка", "Упомянуты риски"]),
  ],

  mastery: [
    mcq("git.reset-revert-reflog.m1", "intermediate", "Вы сделали `git reset --soft HEAD~3`. Что получите?", ["Три коммита удалены вместе с файлами", "Три коммита расформированы, их изменения подготовлены к новому коммиту", "Ветка удалена", "Откат слияния"], 1, "`--soft` — самый удобный способ склеить последние коммиты в один: после него достаточно одного `git commit`."),
    mcq("git.reset-revert-reflog.m2", "advanced", "Как вернуть случайно удалённую ветку `feature` (`git branch -D feature`)?", ["Найти её вершину в `git reflog` (или в сообщении `was <хэш>`) и создать ветку командой `git branch feature <хэш>`", "Никак", "`git revert feature`", "`git fetch`"], 0, "Удаляется только указатель. Коммиты остаются в базе; хэш выводится при удалении и записан в reflog."),
    mcq("git.reset-revert-reflog.m3", "advanced", "Опубликованные коммиты A и B (A старее) нужно откатить одним коммитом. Какая последовательность верна?", ["`git revert -n A B`, коммит", "`git reset --hard A~1`, `git push --force`", "`git revert -n B A`, коммит", "`git revert --abort`"], 2, "Откат идёт от новых к старым: сначала B, затем A, с `-n`, затем один общий коммит. Reset с принудительной отправкой переписал бы общую историю."),
    open("git.reset-revert-reflog.m4", "advanced", "Опишите безопасный процесс отката ошибочного релиза, когда в `main` уже влито пять запросов, один из которых — слияние с проблемой.", [
      ul(
        "Определить виновный коммит слияния (`bisect`, тесты), решить, откатывать целиком или исправлять вперёд.",
        "Откат: `git revert -m 1 <слияние>` (или `revert` отдельных коммитов) обычным коммитом, публикация без `--force`.",
        "План возврата: исправить ветку и вернуть её, начав с `revert` отката, либо влить новую ветку; сообщение объясняет причину.",
        "Проверки: тесты на результате, оповещение команды, фиксация решения.",
      ),
    ], ["Диагностика", "`revert -m 1` без `--force`", "План повторного слияния", "Проверка и коммуникация"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.reset-revert-reflog.f1", front: "reset --soft / --mixed / --hard?", back: "Ветка; ветка+индекс; ветка+индекс+файлы. --hard теряет несохранённые правки." },
    { id: "git.reset-revert-reflog.f2", front: "revert?", back: "Новый коммит с обратным изменением. Безопасно для опубликованного. -m 1 — для слияния." },
    { id: "git.reset-revert-reflog.f3", front: "reflog?", back: "Локальный журнал перемещений HEAD и веток. HEAD@{n}. 90/30 дней по умолчанию." },
    { id: "git.reset-revert-reflog.f4", front: "Вернуть коммиты после reset --hard?", back: "git reflog → git reset --hard HEAD@{n} (или git branch имя хэш)." },
    { id: "git.reset-revert-reflog.f5", front: "HEAD~n vs HEAD@{n}?", back: "~n — предки по графу; @{n} — шаги журнала." },
    { id: "git.reset-revert-reflog.f6", front: "Повторное слияние после revert -m 1?", back: "Already up to date. Сначала revert коммита отката («Reapply»)." },
    { id: "git.reset-revert-reflog.f7", front: "Несколько revert одним коммитом?", back: "git revert -n HEAD HEAD~1 (от новых к старым), затем git commit." },
    { id: "git.reset-revert-reflog.f8", front: "ORIG_HEAD?", back: "Прежняя вершина перед reset/merge/rebase: git reset --hard ORIG_HEAD." },
  ],

  sources: [
    { title: "Pro Git: Reset Demystified", url: "https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified", publisher: "Git" },
    { title: "Git documentation: git-reset", url: "https://git-scm.com/docs/git-reset", publisher: "Git" },
    { title: "Git documentation: git-revert", url: "https://git-scm.com/docs/git-revert", publisher: "Git" },
    { title: "Git documentation: git-reflog", url: "https://git-scm.com/docs/git-reflog", publisher: "Git" },
    { title: "Pro Git: Data Recovery", url: "https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery", publisher: "Git" },
    { title: "Git documentation: howto — revert a faulty merge", url: "https://git-scm.com/docs/howto/revert-a-faulty-merge.html", publisher: "Git" },
    { title: "Git documentation: git-config (gc.reflogExpire)", url: "https://git-scm.com/docs/git-config", publisher: "Git" },
  ],
};
