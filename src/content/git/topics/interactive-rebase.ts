import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
  warn,
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

export const interactiveRebase: Topic = {
  id: "git.interactive-rebase",
  slug: "interactive-rebase",
  domain: "git",
  module: "advanced-git",
  title: "Интерактивный rebase: чистая история перед публикацией",
  titleEn: "Interactive Rebase: Cleaning History Before Publishing",
  summary:
    "`git rebase -i` открывает список коммитов, в котором можно склеить (`squash`, `fixup`), переименовать (`reword`), переставить, удалить (`drop`), остановить для правки или разбиения (`edit`) и проверить каждый коммит командой (`exec`). Тема на опытах в настоящем репозитории показывает синтаксис списка задач, `--autosquash` с `commit --fixup`, разбиение коммита, проверку `--exec` и откат через `ORIG_HEAD`.",
  minutes: 85,
  prerequisites: ["git.rebase", "git.undoing-changes", "git.commits-history"],
  tags: ["git rebase -i", "squash", "fixup", "reword", "edit", "drop", "exec", "autosquash", "commit --fixup", "split commit", "interactive rebase", "todo list", "clean history"],
  keyConcepts: [
    { term: "Список задач идёт от старого коммита к новому", text: "`git rebase -i HEAD~4` показал `pick e719fb2 Добавить вход` … `pick b6ed840 Добавить выход` — порядок обратный `git log`. Каждая строка — команда и коммит." },
    { term: "`fixup` склеивает без сообщения, `squash` — с редактированием", text: "`fixup` присоединил `WIP` и `Исправить опечатку` к «Добавить вход» (`36504db`), оставив его сообщение; `squash` открывает редактор с сообщениями всех склеиваемых коммитов." },
    { term: "`commit --fixup` + `--autosquash` расставляют строки сами", text: "`git commit --fixup=HEAD~1` создал коммит `fixup! Добавить вход`; `rebase -i --autosquash` сам поставил его сразу после целевого и пометил `fixup`." },
    { term: "`edit` останавливает rebase для правки или разбиения", text: "После `edit 67a8de6` Git остановился; `git reset HEAD~1` расформировал коммит, два `git commit` создали `Добавить a` и `Добавить b`, `--continue` довёл rebase до конца." },
    { term: "`exec` проверяет каждый коммит", text: "`git rebase --exec 'grep -qx ok status.txt' HEAD~3` остановился на «Шаг 2 (ломает статус)»: именно там проверка не прошла." },
  ],
  sections: [
    section("definition", [
      def("Интерактивный rebase", "Режим `git rebase -i <основа>`: Git формирует список коммитов `основа..HEAD` как последовательность команд, вы редактируете список, а затем Git выполняет его сверху вниз, создавая новые коммиты.", "interactive rebase"),
      def("Список задач (todo)", "Текстовый файл со строками `команда хэш заголовок`, который открывается в редакторе. Строки идут от старого коммита к новому; комментарии с `#` игнорируются.", "todo list"),
      def("pick, reword, edit", "`pick` — взять коммит как есть; `reword` — взять и изменить сообщение; `edit` — взять и остановиться, чтобы изменить содержимое или разбить коммит.", "pick / reword / edit"),
      def("squash и fixup", "Склеивание коммита с предыдущим. `squash` объединяет сообщения и открывает редактор; `fixup` отбрасывает сообщение приклеиваемого коммита.", "squash / fixup"),
      def("drop и exec", "`drop` — выбросить коммит (то же, что удалить строку); `exec <команда>` — выполнить команду оболочки между коммитами и остановиться, если она завершилась неудачей.", "drop / exec"),
      def("autosquash", "Режим `--autosquash`: коммиты с заголовком `fixup! …`/`squash! …` автоматически ставятся в список сразу после целевого коммита с нужной командой.", "autosquash"),
    ]),

    section("why", [
      h("История — часть продукта"),
      p("В процессе работы коммиты получаются «грязными»: `WIP`, `ещё правка`, `исправить опечатку`. Для работы это нормально, но для ревью, `blame`, `bisect` и релизных заметок нужна история, где один коммит — одна законченная мысль. Интерактивный rebase позволяет привести историю в порядок **до публикации**, не отказываясь от привычки часто коммитить."),
      ul(
        "**Атомарные коммиты.** Склейте цепочку правок одного изменения в один коммит с хорошим сообщением.",
        "**Читаемое ревью.** Рецензент видит осмысленные шаги, а не хронику поиска решения.",
        "**Рабочий `bisect`.** Если каждый коммит собирается и проходит тесты, бинарный поиск ошибки работает без «сломанных» промежуточных состояний (`exec`).",
        "**Исправление без последствий.** Опечатку в сообщении, лишний файл, забытую правку исправляют там, где допущена, а не новым «fix» коммитом.",
      ),
      warn("Интерактивный rebase переписывает историю. Применяйте его только к коммитам, которых ещё нет у других (локальные или личная ветка запроса на слияние)."),
    ]),

    section("mental-model", [
      h("Список инструкций для Git"),
      p("Rebase — это конвейер: Git перематывает HEAD на основу и затем выполняет ваш список строка за строкой. Любая правка списка меняет итоговую историю:"),
      diagram(
        `
        до:      Основа ◄ Добавить вход ◄ WIP ◄ Исправить опечатку ◄ Добавить выход

        список:  pick   Добавить вход
                 fixup  WIP                  ← приклеить к предыдущему, сообщение отбросить
                 fixup  Исправить опечатку   ← приклеить к предыдущему
                 pick   Добавить выход

        после:   Основа ◄ Добавить вход' ◄ Добавить выход'      (хэши новые)
        `,
        "Команды в списке выполняются сверху вниз; `fixup` и `squash` относятся к ближайшему `pick` выше.",
      ),
      h("Команды списка"),
      table(
        ["Команда", "Сокращение", "Что делает"],
        [
          ["`pick`", "`p`", "Применить коммит как есть"],
          ["`reword`", "`r`", "Применить, затем открыть редактор сообщения"],
          ["`edit`", "`e`", "Применить и остановиться: можно менять файлы, разбивать коммит, `--amend`"],
          ["`squash`", "`s`", "Склеить с предыдущим; сообщения объединяются, откроется редактор"],
          ["`fixup`", "`f`", "Склеить с предыдущим, сообщение этого коммита отбросить"],
          ["`drop`", "`d`", "Выбросить коммит"],
          ["`exec`", "`x`", "Выполнить команду; при неудаче rebase остановится"],
          ["`break`", "`b`", "Остановиться для осмотра: продолжить `git rebase --continue`"],
        ],
        "Команды интерактивного rebase",
      ),
      insight("Порядок строк — порядок будущей истории: перестановка строк переставляет коммиты, удаление строки удаляет коммит. Если перестановка приводит к конфликту, Git остановится — как при обычном rebase."),
    ]),

    section("technical", [
      h("Как запускать"),
      ul(
        "`git rebase -i HEAD~4` — последние четыре коммита; `git rebase -i main` — всё, что отличает ветку от `main`; `git rebase -i --root` — включая самый первый коммит.",
        "Список открывается в редакторе из `sequence.editor`, `core.editor` или `GIT_EDITOR`. В файле также есть подсказки с `#` — Git их игнорирует. Сохранение файла запускает выполнение.",
        "Если закрыть редактор с пустым списком или удалить все строки, rebase отменяется.",
      ),
      p("В опытах этой темы редактор имитируется скриптом: после строки `$ git rebase -i …` напечатан список «до правки» и «после правки» (без служебных комментариев), чтобы было видно, что человек сделал в редакторе."),
      h("Склеивание и сообщения"),
      ul(
        "`squash` и `fixup` относятся к ближайшему **предыдущему** коммиту в списке: первая строка списка не может быть `squash`/`fixup`.",
        "При `squash` Git открывает редактор с объединённым сообщением, где вы формируете итоговое: заголовок, пустая строка, тело.",
        "При `fixup` сообщение остаётся от первого коммита; открывать редактор не нужно.",
      ),
      h("fixup! и autosquash"),
      p("Если вы заметили, что правка относится к более раннему коммиту, не пишите «fix»: выполните `git commit --fixup=<коммит>` (или `--squash=`). Git создаст коммит с заголовком `fixup! <заголовок целевого>`. Позже `git rebase -i --autosquash <основа>` сам переместит такие коммиты за целевые и пометит командой `fixup`. Включить это поведение по умолчанию можно настройкой `rebase.autoSquash`."),
      h("exec: проверка каждого коммита"),
      p("`git rebase --exec 'команда' основа` (или `-x`) вставляет `exec команда` после каждого `pick`. Если команда (тесты, сборка) завершается с ошибкой, rebase останавливается на проблемном коммите — исправьте его (`git commit --amend`) и продолжайте `git rebase --continue`. Так готовят историю, где каждый коммит собирается."),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git rebase -i HEAD~4
git commit --fixup=<хэш>
git rebase -i --autosquash HEAD~4
git rebase --edit-todo
git rebase --continue
git rebase --abort
git rebase --exec "тест" main`,
        [
          { line: 1, text: "Открыть список последних четырёх коммитов." },
          { line: 2, text: "Создать коммит-исправление для более раннего коммита (заголовок `fixup! …`)." },
          { line: 3, text: "Автоматически расставить `fixup!`-коммиты в списке." },
          { line: 4, text: "Изменить список остановленного rebase." },
          { line: [5, 6], text: "Продолжить после правок или отменить всё." },
          { line: 7, text: "Проверять каждый коммит командой; остановиться при неудаче." },
        ],
        "команды интерактивного rebase",
      ),
    ]),

    section("minimal-example", [
      h("Склеить «грязные» коммиты"),
      p("История работы над входом: `Добавить вход`, `WIP`, `Исправить опечатку`, затем отдельная задача `Добавить выход`. Нужно, чтобы `WIP` и исправление вошли в «Добавить вход»:"),
      code("text", `$ git log --oneline
b6ed840 Добавить выход
5bfdae5 Исправить опечатку
e8f32cb WIP
e719fb2 Добавить вход
5e5df4c Основа
$ git rebase -i HEAD~4
# в редакторе (до правки):
pick e719fb2 Добавить вход
pick e8f32cb WIP
pick 5bfdae5 Исправить опечатку
pick b6ed840 Добавить выход
# после правки:
pick e719fb2 Добавить вход
fixup e8f32cb WIP
fixup 5bfdae5 Исправить опечатку
pick b6ed840 Добавить выход
Successfully rebased and updated refs/heads/main.
$ git log --oneline
dfd0cf6 Добавить выход
36504db Добавить вход
5e5df4c Основа
$ git show --stat --format=%s HEAD~1
Добавить вход

 login.txt | 1 +
 1 file changed, 1 insertion(+)`, { filename: "сеанс: fixup" }),
      ul(
        "Список от старого к новому: четыре `pick`; во второй и третьей строках `pick` заменён на `fixup`.",
        "Результат: `Добавить вход` (`36504db`) содержит все три правки в одном коммите, `Добавить выход` — следом. Хэши изменились: коммиты пересозданы.",
        "`git show --stat` показал один файл `login.txt` с одной добавленной строкой: итоговое содержимое — как у последней версии.",
      ),
      h("То же с редактированием сообщения: squash"),
      code("text", `$ git rebase -i HEAD~4
# в редакторе (до правки):
pick e719fb2 Добавить вход
pick e8f32cb WIP
pick 5bfdae5 Исправить опечатку
pick b6ed840 Добавить выход
# после правки:
pick e719fb2 Добавить вход
squash e8f32cb WIP
squash 5bfdae5 Исправить опечатку
pick b6ed840 Добавить выход
[detached HEAD 6ea79e3] Добавить страницу входа
 Date: Wed Jan 15 09:03:00 2025 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 login.txt
Successfully rebased and updated refs/heads/main.
$ git log --oneline
5f21b9e Добавить выход
6ea79e3 Добавить страницу входа
5e5df4c Основа
$ git log -2 --format=%B
Добавить выход

Добавить страницу входа

Страница входа с проверкой логина и пароля.`, { filename: "сеанс: squash и итоговое сообщение" }),
      p("`squash` собрал три коммита в один и открыл редактор сообщения (в опыте имитирован): итоговое сообщение — заголовок `Добавить страницу входа`, пустая строка и тело. `git log -2 --format=%B` показывает его целиком."),
    ]),

    section("detailed-example", [
      h("Переименовать, переставить, выбросить"),
      p("История: `Основа`, затем `Отладочный вывод` (лишний коммит), `Добавить выход`, `Добавиь вход` (опечатка в сообщении). Нужно выбросить отладку, исправить опечатку и поставить «вход» раньше «выхода»:"),
      code("text", `$ git log --oneline
82bcb82 Добавиь вход
b78f5ac Добавить выход
f030573 Отладочный вывод
5e5df4c Основа
$ git rebase -i HEAD~3
# в редакторе (до правки):
pick f030573 Отладочный вывод
pick b78f5ac Добавить выход
pick 82bcb82 Добавиь вход
# после правки:
drop f030573 Отладочный вывод
reword 82bcb82 Добавиь вход
pick b78f5ac Добавить выход
[detached HEAD f5edce8] Добавить вход
 Date: Wed Jan 15 09:05:00 2025 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 login.txt
Successfully rebased and updated refs/heads/main.
$ git log --oneline
7d272d5 Добавить выход
f5edce8 Добавить вход
5e5df4c Основа
$ ls
base.txt
login.txt
logout.txt`, { filename: "сеанс: drop, reword и перестановка" }),
      ul(
        "`drop f030573` убрал коммит `Отладочный вывод`: файла `debug.txt` в итоге нет (`ls`).",
        "`reword 82bcb82` исправил сообщение: `Добавить вход`.",
        "Строки `Добавить выход` и `Добавить вход` поменялись местами: в новой истории сначала вход (`f5edce8`), затем выход (`7d272d5`). Перестановка прошла без конфликта: коммиты меняют разные файлы.",
      ),
      h("Fixup-коммит и autosquash"),
      p("Чаще правка обнаруживается позже. Тогда лучше не искать нужный коммит в списке, а пометить правку заранее:"),
      code("text", `$ git commit -a --fixup=HEAD~1
[main 6d9eba5] fixup! Добавить вход
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline
6d9eba5 fixup! Добавить вход
94fbacd Добавить выход
e719fb2 Добавить вход
5e5df4c Основа
$ git rebase -i --autosquash HEAD~3
# в редакторе (до правки):
pick e719fb2 Добавить вход
fixup 6d9eba5 fixup! Добавить вход
pick 94fbacd Добавить выход
Successfully rebased and updated refs/heads/main.
$ git log --oneline
c143009 Добавить выход
5557ade Добавить вход
5e5df4c Основа`, { filename: "сеанс: commit --fixup и --autosquash" }),
      ul(
        "`git commit -a --fixup=HEAD~1` создал `fixup! Добавить вход` для коммита, лежащего на одну позицию глубже.",
        "В списке `--autosquash` сам поставил `fixup 6d9eba5` сразу после «Добавить вход» (вторая строка), хотя по времени он последний.",
        "После выполнения история чистая: `Добавить вход` (с учётом правки) и `Добавить выход`.",
      ),
    ]),

    section("analysis", [
      h("Разбить коммит на два"),
      code("text", `$ git rebase -i HEAD~2
# в редакторе (до правки):
pick 67a8de6 Добавить a и b одним коммитом
pick 654793b Добавить c
# после правки:
edit 67a8de6 Добавить a и b одним коммитом
pick 654793b Добавить c
Stopped at 67a8de6...  Добавить a и b одним коммитом
You can amend the commit now, with

  git commit --amend 

Once you are satisfied with your changes, run

  git rebase --continue
$ git status
interactive rebase in progress; onto 5e5df4c
Last command done (1 command done):
   edit 67a8de6 Добавить a и b одним коммитом
Next command to do (1 remaining command):
   pick 654793b Добавить c
  (use "git rebase --edit-todo" to view and edit)
You are currently editing a commit while rebasing branch 'main' on '5e5df4c'.
  (use "git commit --amend" to amend the current commit)
  (use "git rebase --continue" once you are satisfied with your changes)

nothing to commit, working tree clean
$ git reset HEAD~1
$ git add a.txt && git commit -m "Добавить a"
[detached HEAD d62591a] Добавить a
 1 file changed, 1 insertion(+)
 create mode 100644 a.txt
$ git add b.txt && git commit -m "Добавить b"
[detached HEAD b94788f] Добавить b
 1 file changed, 1 insertion(+)
 create mode 100644 b.txt
$ git rebase --continue
Successfully rebased and updated refs/heads/main.
$ git log --oneline --stat
0c1e58c Добавить c
 c.txt | 1 +
 1 file changed, 1 insertion(+)
b94788f Добавить b
 b.txt | 1 +
 1 file changed, 1 insertion(+)
d62591a Добавить a
 a.txt | 1 +
 1 file changed, 1 insertion(+)
5e5df4c Основа
 base.txt | 1 +
 1 file changed, 1 insertion(+)`, { filename: "сеанс: edit и разбиение коммита" }),
      table(
        ["Шаг", "Что произошло"],
        [
          ["`edit 67a8de6`", "Rebase остановился после применения коммита: `Stopped at 67a8de6… You can amend the commit now`"],
          ["`git status`", "Сообщает `You are currently editing a commit while rebasing branch 'main'` и перечисляет выполненные и оставшиеся команды"],
          ["`git reset HEAD~1`", "Коммит «расформирован»: изменения вернулись в рабочее дерево, HEAD встал на родителя (смешанный сброс — по умолчанию)"],
          ["`git add a.txt && git commit …`, затем `b.txt`", "Созданы два новых коммита: `Добавить a` и `Добавить b`"],
          ["`git rebase --continue`", "Оставшийся `pick` (`Добавить c`) применён, rebase завершён"],
        ],
        "Разбиение коммита через `edit`",
      ),
      p("В итоге вместо одного коммита `Добавить a и b одним коммитом` — два отдельных; `Добавить c` — следом, как раньше. `git log --stat` подтверждает: каждый коммит затрагивает по одному файлу."),
    ]),

    section("internals", [
      h("Проверка каждого коммита"),
      code("text", `# проверяем каждый коммит: в status.txt должна быть строка ok
$ git rebase --exec 'grep -qx ok status.txt' HEAD~3
Executing: grep -qx ok status.txt
Executing: grep -qx ok status.txt
warning: execution failed: grep -qx ok status.txt
You can fix the problem, and then run

  git rebase --continue


$ git status
interactive rebase in progress; onto af76da8
Last commands done (4 commands done):
   pick 2b2710d Шаг 2 (ломает статус)
   exec grep -qx ok status.txt
  (see more in file .git/rebase-merge/done)
Next commands to do (2 remaining commands):
   pick 81672ca Шаг 3 (чинит)
   exec grep -qx ok status.txt
  (use "git rebase --edit-todo" to view and edit)
You are currently editing a commit while rebasing branch 'main' on 'af76da8'.
  (use "git commit --amend" to amend the current commit)
  (use "git rebase --continue" once you are satisfied with your changes)

nothing to commit, working tree clean
$ cat status.txt
broken`, { filename: "сеанс: rebase --exec" }),
      ul(
        "Git после каждого `pick` выполнил `grep -qx ok status.txt`. Для «Шаг 1» проверка прошла, для «Шаг 2 (ломает статус)» — нет: `warning: execution failed` и остановка.",
        "`git status` показывает позицию: в списке остались `pick … Шаг 3` и `exec`; файл `status.txt` содержит `broken` — это состояние коммита, на котором остановились.",
        "Дальше: исправить файл, `git commit --amend`, `git rebase --continue`. Итог — каждый коммит истории проходит проверку.",
      ),
      h("Откат"),
      code("text", `$ git rebase -i HEAD~4
# в редакторе (до правки):
pick e719fb2 Добавить вход
pick e8f32cb WIP
pick 5bfdae5 Исправить опечатку
pick b6ed840 Добавить выход
# после правки:
pick e719fb2 Добавить вход
drop e8f32cb WIP
drop 5bfdae5 Исправить опечатку
pick b6ed840 Добавить выход
Successfully rebased and updated refs/heads/main.
$ git log --oneline
8cde0f8 Добавить выход
e719fb2 Добавить вход
5e5df4c Основа
$ git reset --hard ORIG_HEAD
HEAD is now at b6ed840 Добавить выход
$ git log --oneline
b6ed840 Добавить выход
5bfdae5 Исправить опечатку
e8f32cb WIP
e719fb2 Добавить вход
5e5df4c Основа`, { filename: "сеанс: откат после неудачной правки истории" }),
      p("Если в редакторе всё испортили (например, выбросили лишнее), после завершения помогает `git reset --hard ORIG_HEAD`: ветка возвращается на прежнюю вершину. Во время rebase отменить всё можно `git rebase --abort`."),
      note("Все «потерянные» коммиты остаются в базе и в `git reflog`, пока их не очистит сборка мусора. Это делает интерактивный rebase безопасным для экспериментов с локальной историей."),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git log --oneline
            e8f32cb WIP
            5bfdae5 Исправить опечатку
            # отправлено на сервер, затем:
            git rebase -i HEAD~3      # склеиваем опубликованное
          `,
          note: "Склейка опубликованных коммитов переписывает общую историю: коллеги получат расхождение.",
        },
        {
          title: "Верно",
          code: `
            git rebase -i origin/main     # только то, чего ещё нет на сервере
            # ...правим список, затем
            git push --force-with-lease   # только если ветка личная
          `,
          note: "Чистим локальные или личные коммиты и публикуем с проверкой.",
        },
      ),
      ul(
        "**Путать порядок строк.** Список идёт от старого к новому — обратно `git log`; `squash` приклеивает к строке выше, а не ниже.",
        "**Ставить `squash`/`fixup` на первую строку:** склеивать не с чем — Git вернёт ошибку.",
        "**Удалять строки по ошибке:** удалённая строка — выброшенный коммит. Включите `rebase.missingCommitsCheck=warn`.",
        "**Переставлять зависимые коммиты:** конфликты на каждой перестановке; сначала проверьте, что коммиты независимы.",
        "**Забывать продолжить:** после `edit` и после конфликта нужно `git rebase --continue`.",
        "**Переписывать историю, уже ушедшую к коллегам.**",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Всё в один коммит `squash` «для чистоты»:** теряются осмысленные шаги, ревью становится огромным. Склеивайте шум, а не логические шаги.",
        "**Подготовка истории после ревью:** рецензенты уже читали старые коммиты; чистите до запроса или договоритесь, как именно.",
        "**Перебазирование с неработающими коммитами:** после чистки каждый коммит должен собираться (`--exec` с тестами).",
        "**Сообщение «squashed commits»:** итоговое сообщение нужно писать осмысленно.",
        "**Игнорирование `ORIG_HEAD`:** после ошибки сразу начинают «чинить» вручную, вместо отката.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Коммитьте мелкими шагами,** а перед публикацией приводите историю в порядок: `fixup`, `squash`, `reword`.",
        "**Помечайте исправления сразу:** `git commit --fixup=<коммит>`, а перед публикацией `git rebase -i --autosquash <основа>`.",
        "**Включите `rebase.autoSquash`,** чтобы `-i` расставлял `fixup!` сам.",
        "**Проверяйте каждый коммит:** `git rebase --exec 'make test' <основа>`.",
        "**После чистки смотрите результат:** `git log --stat`, `git range-diff`, тесты.",
        "**Публикуйте только `--force-with-lease`** и только личные ветки.",
        "**При сомнениях:** `git rebase --abort` во время, `git reset --hard ORIG_HEAD` после.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Первый коммит:** `git rebase -i --root` позволяет править и самый первый коммит.",
        "**Коммиты слияния** в списке по умолчанию выпрямляются; для сохранения структуры — `--rebase-merges`.",
        "**Пустые коммиты после склейки** (изменения взаимно уничтожились): Git сообщит и по умолчанию пропустит такой коммит.",
        "**`edit` и `break`:** `break` останавливает rebase без применения коммита (например, перед `exec`).",
        "**Сообщения `fixup -C`/`-c`:** вариант `fixup`, который берёт сообщение приклеиваемого коммита.",
        "**Редактор по умолчанию:** задаётся `core.editor` или `sequence.editor`; для скриптов — `GIT_SEQUENCE_EDITOR`.",
        "**Подпись коммитов** при переписывании теряется; новые коммиты нужно подписывать заново.",
      ),
    ]),

    section("related", [
      ul(
        "[Rebase](/learn/git/rebase) — алгоритм перебазирования, `--onto`, `ORIG_HEAD`.",
        "[Отмена изменений](/learn/git/undoing-changes) — `commit --amend` для последнего коммита.",
        "[Совместная работа](/learn/git/remote-collaboration) — публикация перебазированной ветки `--force-with-lease`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Хроника работы",
          code: `
            Добавить выход
            Исправить опечатку
            WIP
            Добавить вход
          `,
          note: "Шум: незаконченные шаги и «исправления» попали в историю как самостоятельные коммиты.",
        },
        {
          title: "Чистая история",
          code: `
            Добавить выход
            Добавить вход
          `,
          note: "Один коммит — одна законченная мысль; правки склеены, сообщения осмысленны.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.interactive-rebase.ex1",
      title: "Склеить «грязные» коммиты",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("История: `Добавить вход`, `WIP`, `Исправить опечатку`, `Добавить выход`. Приведите её к двум коммитам: `Добавить вход` (со всеми правками) и `Добавить выход`. Какие команды списка нужны?"),
      ],
      hints: [
        "Список идёт от старого к новому.",
        "`fixup` приклеивает коммит к предыдущей строке и отбрасывает его сообщение.",
        "`git log --oneline` после rebase покажет результат.",
      ],
      checks: ["Во второй и третьей строках `pick` заменён на `fixup`", "Остались два коммита", "У «Добавить вход» новый хэш", "Файл `login.txt` содержит итоговую версию"],
      solution: [
        code("text", `$ git log --oneline
b6ed840 Добавить выход
5bfdae5 Исправить опечатку
e8f32cb WIP
e719fb2 Добавить вход
5e5df4c Основа
$ git rebase -i HEAD~4
# в редакторе (до правки):
pick e719fb2 Добавить вход
pick e8f32cb WIP
pick 5bfdae5 Исправить опечатку
pick b6ed840 Добавить выход
# после правки:
pick e719fb2 Добавить вход
fixup e8f32cb WIP
fixup 5bfdae5 Исправить опечатку
pick b6ed840 Добавить выход
Successfully rebased and updated refs/heads/main.
$ git log --oneline
dfd0cf6 Добавить выход
36504db Добавить вход
5e5df4c Основа
$ git show --stat --format=%s HEAD~1
Добавить вход

 login.txt | 1 +
 1 file changed, 1 insertion(+)`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.interactive-rebase.ex2",
      title: "Опечатка, лишний коммит, порядок",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("В ветке есть коммит с отладочным выводом (он не должен попасть в историю), коммит `Добавиь вход` с опечаткой в сообщении, и порядок «выход, вход» нужно изменить на «вход, выход». Сделайте всё одним `git rebase -i`."),
      ],
      hints: [
        "`drop` выбрасывает коммит, `reword` меняет сообщение.",
        "Перестановка — это обмен строк местами.",
        "Для независимых коммитов конфликта не будет.",
      ],
      checks: ["Коммит с отладкой выброшен", "Сообщение исправлено", "Порядок: вход, затем выход", "Нет конфликтов"],
      solution: [
        code("text", `$ git log --oneline
82bcb82 Добавиь вход
b78f5ac Добавить выход
f030573 Отладочный вывод
5e5df4c Основа
$ git rebase -i HEAD~3
# в редакторе (до правки):
pick f030573 Отладочный вывод
pick b78f5ac Добавить выход
pick 82bcb82 Добавиь вход
# после правки:
drop f030573 Отладочный вывод
reword 82bcb82 Добавиь вход
pick b78f5ac Добавить выход
[detached HEAD f5edce8] Добавить вход
 Date: Wed Jan 15 09:05:00 2025 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 login.txt
Successfully rebased and updated refs/heads/main.
$ git log --oneline
7d272d5 Добавить выход
f5edce8 Добавить вход
5e5df4c Основа
$ ls
base.txt
login.txt
logout.txt`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.interactive-rebase.ex3",
      title: "Разделить большой коммит",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Коммит «Добавить a и b одним коммитом» мешает ревью: нужно два коммита. Разбейте его с помощью интерактивного rebase, не трогая коммит `Добавить c`."),
      ],
      hints: [
        "Команда `edit` останавливает rebase после применения коммита.",
        "`git reset HEAD~1` расформирует коммит, оставив изменения в рабочем дереве.",
        "После двух коммитов — `git rebase --continue`.",
      ],
      checks: ["Rebase остановился на нужном коммите", "Созданы коммиты `Добавить a` и `Добавить b`", "`Добавить c` сохранился", "`git log --stat` показывает по файлу на коммит"],
      solution: [
        code("text", `$ git rebase -i HEAD~2
# в редакторе (до правки):
pick 67a8de6 Добавить a и b одним коммитом
pick 654793b Добавить c
# после правки:
edit 67a8de6 Добавить a и b одним коммитом
pick 654793b Добавить c
Stopped at 67a8de6...  Добавить a и b одним коммитом
You can amend the commit now, with

  git commit --amend 

Once you are satisfied with your changes, run

  git rebase --continue
$ git status
interactive rebase in progress; onto 5e5df4c
Last command done (1 command done):
   edit 67a8de6 Добавить a и b одним коммитом
Next command to do (1 remaining command):
   pick 654793b Добавить c
  (use "git rebase --edit-todo" to view and edit)
You are currently editing a commit while rebasing branch 'main' on '5e5df4c'.
  (use "git commit --amend" to amend the current commit)
  (use "git rebase --continue" once you are satisfied with your changes)

nothing to commit, working tree clean
$ git reset HEAD~1
$ git add a.txt && git commit -m "Добавить a"
[detached HEAD d62591a] Добавить a
 1 file changed, 1 insertion(+)
 create mode 100644 a.txt
$ git add b.txt && git commit -m "Добавить b"
[detached HEAD b94788f] Добавить b
 1 file changed, 1 insertion(+)
 create mode 100644 b.txt
$ git rebase --continue
Successfully rebased and updated refs/heads/main.
$ git log --oneline --stat
0c1e58c Добавить c
 c.txt | 1 +
 1 file changed, 1 insertion(+)
b94788f Добавить b
 b.txt | 1 +
 1 file changed, 1 insertion(+)
d62591a Добавить a
 a.txt | 1 +
 1 file changed, 1 insertion(+)
5e5df4c Основа
 base.txt | 1 +
 1 file changed, 1 insertion(+)`, { filename: "решение" }),
      ],
    }),
  ],

  challenge: {
    id: "git.interactive-rebase.challenge",
    title: "Подготовить ветку к ревью",
    scenario: [
      p("Вы закончили работу и обнаружили правку, которая относится к более раннему коммиту. Нужно подготовить историю к ревью: правка должна оказаться в нужном коммите без лишнего «fix», а затем каждый коммит должен пройти проверку."),
    ],
    requirements: [
      "Создать коммит-исправление для более раннего коммита через `--fixup`",
      "Автоматически расставить его в истории через `--autosquash`",
      "Проверить каждый коммит командой через `--exec` и найти проблемный",
      "Не публиковать до завершения проверки",
    ],
    constraints: [
      "Не редактировать список задач вручную при автосквоше",
      "Не использовать принудительную отправку",
    ],
    acceptance: [
      "В списке `--autosquash` строка `fixup! …` стоит сразу после целевого коммита с командой `fixup`",
      "В итоговой истории нет коммитов `fixup!`",
      "`--exec` останавливается на коммите, где проверка не проходит",
    ],
    hints: [
      "`git commit --fixup=<ревизия>` принимает любую ревизию (`HEAD~1`, хэш).",
      "`git rebase -i --autosquash <основа>` расставляет строки сам.",
      "Для проверки: `git rebase --exec 'команда' <основа>`.",
    ],
    solution: [
      code("text", `$ git commit -a --fixup=HEAD~1
[main 6d9eba5] fixup! Добавить вход
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline
6d9eba5 fixup! Добавить вход
94fbacd Добавить выход
e719fb2 Добавить вход
5e5df4c Основа
$ git rebase -i --autosquash HEAD~3
# в редакторе (до правки):
pick e719fb2 Добавить вход
fixup 6d9eba5 fixup! Добавить вход
pick 94fbacd Добавить выход
Successfully rebased and updated refs/heads/main.
$ git log --oneline
c143009 Добавить выход
5557ade Добавить вход
5e5df4c Основа`, { filename: "autosquash" }),
      code("text", `# проверяем каждый коммит: в status.txt должна быть строка ok
$ git rebase --exec 'grep -qx ok status.txt' HEAD~3
Executing: grep -qx ok status.txt
Executing: grep -qx ok status.txt
warning: execution failed: grep -qx ok status.txt
You can fix the problem, and then run

  git rebase --continue


$ git status
interactive rebase in progress; onto af76da8
Last commands done (4 commands done):
   pick 2b2710d Шаг 2 (ломает статус)
   exec grep -qx ok status.txt
  (see more in file .git/rebase-merge/done)
Next commands to do (2 remaining commands):
   pick 81672ca Шаг 3 (чинит)
   exec grep -qx ok status.txt
  (use "git rebase --edit-todo" to view and edit)
You are currently editing a commit while rebasing branch 'main' on 'af76da8'.
  (use "git commit --amend" to amend the current commit)
  (use "git rebase --continue" once you are satisfied with your changes)

nothing to commit, working tree clean
$ cat status.txt
broken`, { filename: "проверка каждого коммита" }),
    ],
  },

  interview: [
    iq("git.interactive-rebase.i1", "basic", "Для чего нужен `git rebase -i`?", [
      ul(
        "Чтобы править историю до публикации: склеивать, переименовывать, переставлять, удалять и разбивать коммиты.",
        "Git показывает список коммитов от старого к новому; вы меняете команды и порядок, и он создаёт новую историю.",
        "Применяется к неопубликованным коммитам.",
      ),
    ]),
    iq("git.interactive-rebase.i2", "basic", "Чем `squash` отличается от `fixup`?", [
      ul(
        "Оба приклеивают коммит к предыдущему.",
        "`squash` объединяет сообщения и открывает редактор, `fixup` сообщение приклеиваемого коммита отбрасывает.",
        "`fixup` удобен для исправлений и «WIP»; `squash` — когда нужно собрать итоговое сообщение.",
      ),
    ]),
    iq("git.interactive-rebase.i3", "intermediate", "В каком порядке идёт список в `rebase -i` и к чему относится `squash`?", [
      ul(
        "От старого коммита к новому — обратно `git log`.",
        "`squash`/`fixup` приклеивают коммит к ближайшему предыдущему `pick` (строке выше).",
        "Поэтому первая строка не может быть `squash`/`fixup`.",
      ),
    ]),
    iq("git.interactive-rebase.i4", "intermediate", "Как работает `git commit --fixup` вместе с `--autosquash`?", [
      ul(
        "`commit --fixup=<коммит>` создаёт коммит с заголовком `fixup! <заголовок целевого>`.",
        "`rebase -i --autosquash <основа>` переставляет такие коммиты сразу за целевые и помечает `fixup`.",
        "Можно включить по умолчанию: `rebase.autoSquash true`.",
      ),
    ]),
    iq("git.interactive-rebase.i5", "intermediate", "Как разделить один коммит на два?", [
      ul(
        "`git rebase -i <основа>`, у нужного коммита `edit`.",
        "На остановке: `git reset HEAD~1`, затем `git add`/`git commit` для каждой части.",
        "`git rebase --continue`.",
      ),
    ]),
    iq("git.interactive-rebase.i6", "advanced", "Что даёт `--exec` и как его использовать?", [
      ul(
        "Запускает команду после каждого коммита (тесты, сборка); при неудаче rebase останавливается на проблемном коммите.",
        "Позволяет проверить, что каждый коммит собирается — важно для `bisect`.",
        "Исправление: правка, `git commit --amend`, `git rebase --continue`.",
      ),
    ]),
    iq("git.interactive-rebase.i7", "engineering", "Какой стиль работы с историей вы бы закрепили в команде?", [
      ul(
        "Коммиты мелкими шагами; перед запросом на слияние — чистка (`fixup`, `squash`, `reword`) в личной ветке.",
        "`--autosquash` и `--exec` в привычном процессе; публикация `--force-with-lease`.",
        "Не переписывать историю общих веток и уже проверенных запросов без согласия рецензентов.",
      ),
    ]),
    iq("git.interactive-rebase.i8", "debugging", "Вы выбросили не тот коммит в `rebase -i`. Как вернуть?", [
      ul(
        "Если rebase идёт — `git rebase --abort`.",
        "Если завершён — `git reset --hard ORIG_HEAD` или найти вершину в `git reflog`.",
        "Затем повторить rebase с правильным списком; включить `rebase.missingCommitsCheck=warn`.",
      ),
    ]),
  ],

  exam: [
    mcq("git.interactive-rebase.e1", "foundation", "В каком порядке `git rebase -i` показывает коммиты?", ["От нового к старому", "По алфавиту", "От старого к новому", "Случайно"], 2, "Список выполняется сверху вниз, поэтому первый коммит — самый старый из перебазируемых. Это обратный порядок относительно `git log`."),
    mcq("git.interactive-rebase.e2", "foundation", "Какая команда списка выбрасывает коммит?", ["`drop`", "`pick`", "`squash`", "`reword`"], 0, "`drop` (или удаление строки) убирает коммит из итоговой истории."),
    mcq("git.interactive-rebase.e3", "foundation", "Что делает `fixup`?", ["Меняет сообщение", "Останавливает rebase", "Выбрасывает коммит", "Приклеивает коммит к предыдущему и отбрасывает его сообщение"], 3, "`fixup` объединяет изменения с предыдущим коммитом, оставляя его сообщение; `squash` объединяет и сообщения."),
    mcq("git.interactive-rebase.e4", "intermediate", "Для чего `git commit --fixup=<коммит>`?", ["Исправляет сообщение", "Создаёт коммит `fixup! …`, который `--autosquash` присоединит к целевому", "Удаляет коммит", "Публикует коммит"], 1, "Такой коммит помечает правку как относящуюся к более раннему; `rebase -i --autosquash` сам поставит и пометит его."),
    mcq("git.interactive-rebase.e5", "intermediate", "Что делает `edit` в списке?", ["Открывает редактор сообщения", "Выполняет команду", "Удаляет коммит", "Применяет коммит и останавливает rebase для правок или разбиения"], 3, "После `edit` Git останавливается: можно `commit --amend`, `reset HEAD~1` и создать несколько коммитов, затем `--continue`."),
    mcq("git.interactive-rebase.e6", "intermediate", "Что делает `git rebase --exec 'make test' main`?", ["Запускает тесты один раз в конце", "Отменяет rebase", "Вставляет проверку после каждого коммита и останавливается при неудаче", "Публикует ветку"], 2, "`exec` выполняется после каждого `pick`; ошибка команды останавливает rebase на проблемном коммите."),
    mcq("git.interactive-rebase.e7", "advanced", "Какие утверждения верны? Выберите все.", ["`squash` на первой строке списка невозможен", "Перестановка зависимых коммитов может дать конфликт", "Интерактивный rebase безопасен для общих опубликованных веток", "Отменить завершённый rebase можно `git reset --hard ORIG_HEAD`"], [0, 1, 3], "Склеивать первую строку не с чем; зависимые коммиты при перестановке конфликтуют; ORIG_HEAD хранит прежнюю вершину. Переписывать общую историю нельзя."),
    open("git.interactive-rebase.e8", "intermediate", "Опишите, как подготовить историю личной ветки к ревью: какие команды и в каком порядке.", [
      ul(
        "Определить основу: `git fetch`, `git rebase -i origin/main` (или `--autosquash`, если были `--fixup`).",
        "Склеить шум (`fixup`), исправить сообщения (`reword`), выбросить лишнее (`drop`), разбить крупные коммиты (`edit`).",
        "Проверить каждый коммит: `--exec` с тестами; посмотреть `git log --stat`, `git range-diff`.",
        "Опубликовать `git push --force-with-lease`.",
      ),
    ], ["Названы основные команды списка", "Упомянут `--exec`", "Упомянута проверка результата", "Использована `--force-with-lease`"]),
  ],

  mastery: [
    mcq("git.interactive-rebase.m1", "intermediate", "Какое сообщение будет у результата `pick A`, `fixup B`, `fixup C`?", ["Сообщение C", "Сообщение A", "Сообщения A, B и C вместе", "Пустое"], 1, "`fixup` отбрасывает сообщения приклеиваемых коммитов, оставляя сообщение первого (`pick`)."),
    mcq("git.interactive-rebase.m2", "advanced", "Где вы окажетесь, если после `edit` выполните `git reset HEAD~1`?", ["Изменения расформированного коммита окажутся в рабочем дереве, HEAD на родителе: можно создать несколько коммитов", "Rebase завершится", "Коммит будет удалён навсегда", "Начнётся слияние"], 0, "Смешанный `reset` перемещает HEAD на родителя и оставляет изменения в рабочем дереве; затем их коммитят частями и продолжают rebase."),
    mcq("git.interactive-rebase.m3", "advanced", "Что произойдёт при `git rebase -i --autosquash`, если коммит `fixup! X` создан, а цели `X` в диапазоне нет?", ["Он будет склеен с последним коммитом", "Rebase завершится ошибкой и удалит ветку", "Он останется как `pick` на своём месте", "Он будет выброшен"], 2, "Если целевой коммит не найден в диапазоне, строка остаётся обычным `pick`. Её можно поправить вручную или расширить диапазон."),
    open("git.interactive-rebase.m4", "advanced", "Ревью показало, что в запросе слишком много «шума»: 12 коммитов с `WIP`, `fix`, `ещё правка`. Как вы приведёте ветку в порядок, не потеряв логику и без поломки сборки?", [
      ul(
        "Определить логические шаги и сгруппировать коммиты: `rebase -i` с `fixup`/`squash` и `reword` для итоговых сообщений; при необходимости переставить и выбросить лишнее.",
        "Проверить, что каждый итоговый коммит собирается: `rebase --exec` с тестами; исправить проблемный через `edit`/`amend`.",
        "Сравнить результат: `git range-diff`, `git diff` относительно прежней версии ветки должен быть пустым.",
        "Опубликовать `--force-with-lease` и сообщить рецензентам, что история изменилась.",
      ),
    ], ["Группировка по логике", "Проверка каждого коммита", "Сравнение итогового содержимого", "Безопасная публикация"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.interactive-rebase.f1", front: "Порядок списка в rebase -i?", back: "От старого коммита к новому (обратно git log)." },
    { id: "git.interactive-rebase.f2", front: "squash vs fixup?", back: "Оба приклеивают к предыдущему; squash объединяет сообщения (редактор), fixup — отбрасывает." },
    { id: "git.interactive-rebase.f3", front: "Команды списка?", back: "pick, reword, edit, squash, fixup, drop, exec, break." },
    { id: "git.interactive-rebase.f4", front: "commit --fixup + --autosquash?", back: "Коммит fixup! <заголовок> автоматически ставится за целевой с командой fixup." },
    { id: "git.interactive-rebase.f5", front: "Разбить коммит?", back: "edit → git reset HEAD~1 → несколько git commit → git rebase --continue." },
    { id: "git.interactive-rebase.f6", front: "--exec?", back: "Выполняет команду после каждого коммита; при неудаче останавливается на проблемном." },
    { id: "git.interactive-rebase.f7", front: "Откат?", back: "Во время — git rebase --abort; после — git reset --hard ORIG_HEAD (или reflog)." },
    { id: "git.interactive-rebase.f8", front: "Когда можно?", back: "Только для неопубликованных или личных коммитов; публикация --force-with-lease." },
  ],

  sources: [
    { title: "Pro Git: Rewriting History", url: "https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History", publisher: "Git" },
    { title: "Git documentation: git-rebase (Interactive mode)", url: "https://git-scm.com/docs/git-rebase#_interactive_mode", publisher: "Git" },
    { title: "Git documentation: git-commit (--fixup)", url: "https://git-scm.com/docs/git-commit", publisher: "Git" },
    { title: "Git documentation: git-config (rebase.autoSquash)", url: "https://git-scm.com/docs/git-config", publisher: "Git" },
    { title: "Git documentation: git-range-diff", url: "https://git-scm.com/docs/git-range-diff", publisher: "Git" },
    { title: "Git documentation: git-reflog", url: "https://git-scm.com/docs/git-reflog", publisher: "Git" },
  ],
};
