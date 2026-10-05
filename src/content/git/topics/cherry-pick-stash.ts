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

export const cherryPickStash: Topic = {
  id: "git.cherry-pick-stash",
  slug: "cherry-pick-stash",
  domain: "git",
  module: "advanced-git",
  title: "Cherry-pick и stash: переносить коммиты и прятать правки",
  titleEn: "Cherry-pick and Stash: Moving Commits and Parking Changes",
  summary:
    "Два инструмента для «срочных» ситуаций. `git cherry-pick` копирует изменение отдельного коммита на текущую ветку (исправление в релиз, коммит не в той ветке), а `git stash` временно прячет незакоммиченную работу, чтобы переключиться на другую задачу. Тема на опытах показывает диапазоны, `-x`, `-n`, конфликты, `git cherry`, а также устройство stash (это коммиты со связью с индексом), `-u`/`-a`, `pop`, `branch` и обмен патчами через `format-patch` и `am`.",
  minutes: 80,
  prerequisites: ["git.rebase", "git.branches-head", "git.undoing-changes"],
  tags: ["git cherry-pick", "git stash", "stash pop", "stash -u", "git cherry", "format-patch", "git am", "backport", "hotfix", "cherry-pick -x", "refs/stash", "WIP"],
  keyConcepts: [
    { term: "Cherry-pick создаёт копию коммита", text: "`git cherry-pick -x main~1` на `release` создал коммит с тем же изменением и сообщением, но другим хэшем (`1640a8a` → `b979d94`) и строкой `(cherry picked from commit 1640a8a…)`." },
    { term: "Диапазон `A..B` не включает A", text: "`git cherry-pick main~2..main` перенёс два коммита; `-n` (`--no-commit`) подготавливает изменения в индексе, и их можно закоммитить одним коммитом." },
    { term: "`git cherry` показывает, что уже перенесено", text: "`git cherry -v release main`: `-` — эквивалентный патч уже есть в `release`, `+` — коммит ещё не перенесён." },
    { term: "Stash по умолчанию прячет только отслеживаемые файлы", text: "После `git stash` новый `notes.txt` остался `??`; `-u` прячет и неотслеживаемые файлы, `-a` — ещё и игнорируемые." },
    { term: "Stash — это коммиты в `refs/stash`", text: "`git cat-file -p stash` показал коммит с двумя родителями: текущий HEAD и «index on main: …». Список `stash@{0}` — это журнал ссылки `refs/stash`." },
  ],
  sections: [
    section("definition", [
      def("Cherry-pick", "Команда `git cherry-pick <коммит>`: вычислить изменение, внесённое коммитом, и применить его к текущей ветке новым коммитом (с тем же автором и сообщением, но другим родителем и хэшем).", "cherry-pick"),
      def("Backport", "Перенос исправления из основной ветки в более старую поддерживаемую ветку (например, `release`), обычно через `cherry-pick -x`.", "backport"),
      def("Stash", "Временное хранилище незакоммиченных изменений. `git stash` сохраняет текущие правки (и приводит дерево к HEAD), `git stash pop` возвращает их.", "stash"),
      def("Запись stash", "Элемент списка `stash@{n}`: фактически коммит, у которого в родителях текущий HEAD и коммит состояния индекса; хранится в `refs/stash` и его журнале.", "stash entry"),
      def("Патч", "Текстовое описание изменения (формат diff) с метаданными коммита: автор, дата, сообщение. Создаётся `git format-patch`, применяется `git am`.", "patch"),
      def("WIP-коммит", "Временный коммит «work in progress», который делают вместо stash, когда работу нужно сохранить надолго; позднее его переписывают.", "WIP commit"),
    ]),

    section("why", [
      h("Реальные ситуации"),
      p("Работа не всегда идёт по плану: срочное исправление нужно выпустить сегодня, коммит попал не в ту ветку, полезное изменение лежит в ветке, которую решили не вливать, а ревью вдруг просит переключиться на другую задачу посреди незаконченной правки. Для этих случаев в Git есть два небольших, но очень полезных инструмента."),
      ul(
        "**Backport исправлений.** Ошибку исправили в `main`, но продукт на клиентах работает на `release`: перенесите один коммит, а не всю ветку (`cherry-pick`).",
        "**Коммит не в той ветке.** Сделали коммит в `main`, хотя нужна своя ветка: перенесите его `cherry-pick`, а в `main` откатите.",
        "**Перенос части работы.** Из чужой или заброшенной ветки нужен один коммит; слияние привело бы всё остальное.",
        "**Срочное переключение.** Правка не готова, коммитить рано, а переключиться надо: `git stash` прячет работу и возвращает чистое дерево.",
      ),
      tip("Cherry-pick и stash не должны становиться основным способом работы: они решают исключения. Если вы постоянно переносите коммиты, подумайте о стратегии ветвления; если постоянно прячете работу — о более мелких коммитах и ветках."),
    ]),

    section("mental-model", [
      h("Cherry-pick: копия изменения"),
      diagram(
        `
        main:     c1 ◄── f1 ◄── fix ◄── f2                 «fix» — нужное исправление
                   │
        release:   c1 ◄── fix'                              fix' = то же изменение, новый коммит

        fix и fix' — разные коммиты (хэши и родители разные); связывает их только сообщение
        и, при желании, строка «(cherry picked from commit …)»
        `,
        "Cherry-pick переносит изменение, а не историю: у копии другой родитель и другой хэш.",
      ),
      h("Stash: парковка"),
      diagram(
        `
        рабочее дерево с правками  ──► git stash ──►  чистое дерево (как HEAD)  +  запись stash@{0}
                                                         │
        ...срочная работа в другой ветке...              │
                                                         ▼
        рабочее дерево с правками  ◄── git stash pop ◄──  запись удаляется после успешного применения
        `,
        "Stash — стек: последняя спрятанная запись — `stash@{0}`; `pop` берёт её и удаляет.",
      ),
      insight("Оба инструмента — «временные»: cherry-pick создаёт отдельный коммит, не связанный с оригиналом, а stash хранит правки в локальных записях, которые не передаются при `push` и со временем легко забываются."),
    ]),

    section("technical", [
      h("cherry-pick"),
      table(
        ["Команда", "Действие"],
        [
          ["`git cherry-pick X`", "Применить коммит X к текущей ветке новым коммитом"],
          ["`git cherry-pick -x X`", "То же, добавив в сообщение строку `(cherry picked from commit …)`"],
          ["`git cherry-pick A..B`", "Применить коммиты после A до B включительно (A не включается)"],
          ["`git cherry-pick -n X Y`", "Применить изменения в индекс и рабочее дерево без создания коммитов"],
          ["`git cherry-pick -m 1 M`", "Применить коммит слияния M, считая основным родителя 1"],
          ["`--continue`, `--skip`, `--abort`", "Продолжить после разрешения конфликта, пропустить коммит, отменить всё"],
          ["`git cherry -v upstream ветка`", "Показать, какие коммиты ветки ещё не имеют эквивалента в upstream"],
        ],
        "Основные формы cherry-pick",
      ),
      p("Автор и сообщение у копии сохраняются, коммитером становитесь вы; дата автора прежняя, дата коммитера новая. Если изменение уже есть в целевой ветке, Git сообщит, что коммит пуст."),
      h("stash"),
      table(
        ["Команда", "Действие"],
        [
          ["`git stash` / `git stash push -m \"текст\"`", "Спрятать изменения отслеживаемых файлов (подготовленные и неподготовленные), вернуть дерево к HEAD"],
          ["`git stash push -u`", "Включить неотслеживаемые файлы"],
          ["`git stash push -a`", "Включить и игнорируемые файлы"],
          ["`git stash push -- путь`", "Спрятать только указанные пути"],
          ["`git stash list` / `show [-p]`", "Список записей / содержимое записи"],
          ["`git stash pop`", "Применить последнюю запись и удалить её"],
          ["`git stash apply [stash@{n}]`", "Применить, не удаляя запись"],
          ["`git stash drop` / `clear`", "Удалить запись / все записи"],
          ["`git stash branch имя`", "Создать ветку от коммита записи и применить её"],
        ],
        "Основные формы stash",
      ),
      h("Патчи"),
      p("Коммит можно передать как файл: `git format-patch -1 <коммит>` создаёт файл патча с автором, датой, сообщением и diff; `git am файл.patch` применяет его как коммит, сохраняя автора и дату. Это основа почтового процесса разработки (он принят, например, в разработке ядра Linux) и удобный способ перенести работу между не связанными репозиториями."),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git cherry-pick -x <коммит>
git cherry-pick A..B
git cherry-pick -n <коммит>
git cherry-pick --continue
git stash push -u -m "описание"
git stash list
git stash pop
git stash branch новая-ветка`,
        [
          { line: 1, text: "Перенести коммит с пометкой об источнике." },
          { line: 2, text: "Перенести диапазон: коммиты после `A` до `B`." },
          { line: 3, text: "Применить без коммита: собрать несколько переносов в один коммит." },
          { line: 4, text: "Продолжить после разрешения конфликта." },
          { line: 5, text: "Спрятать всё, включая неотслеживаемые файлы, с описанием." },
          { line: 6, text: "Посмотреть спрятанное." },
          { line: 7, text: "Вернуть последнюю запись и удалить её." },
          { line: 8, text: "Продолжить спрятанную работу в новой ветке." },
        ],
        "команды cherry-pick и stash",
      ),
    ]),

    section("minimal-example", [
      h("Перенести исправление в release"),
      p("В `main` три коммита после версии 1.0: фича 1, **исправление режима по умолчанию**, фича 2. В `release` нужно только исправление:"),
      code("text", `$ git log --oneline --graph --all --decorate
* c9837b9 (HEAD -> main) Добавить фичу 2
* 1640a8a Исправить режим по умолчанию
* 0bdbb79 Добавить фичу 1
* ee41f43 (release) Версия 1.0
$ git switch release
Switched to branch 'release'
$ git cherry-pick -x main~1
[release b979d94] Исправить режим по умолчанию
 Date: Wed Jan 15 09:06:00 2025 +0000
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline --graph --all --decorate
* b979d94 (HEAD -> release) Исправить режим по умолчанию
| * c9837b9 (main) Добавить фичу 2
| * 1640a8a Исправить режим по умолчанию
| * 0bdbb79 Добавить фичу 1
|/  
* ee41f43 Версия 1.0
$ git log -1
commit b979d943742c10f7ea6f66fa5792d7c1ccf2c14b
Author: Alice Dev <alice@example.com>
Date:   Wed Jan 15 09:06:00 2025 +0000

    Исправить режим по умолчанию
    
    (cherry picked from commit 1640a8a5d43c6e65da1a6369e1941962e07cbd19)
$ cat app.cfg
версия=1.0
режим=безопасный
$ ls
app.cfg
core.txt
# git cherry показывает, какие коммиты main ещё не перенесены в release («+» — не перенесён, «-» — эквивалентный патч уже есть)
$ git cherry -v release main
+ 0bdbb79f6e612162e5ef9326aadcb566a624d33d Добавить фичу 1
- 1640a8a5d43c6e65da1a6369e1941962e07cbd19 Исправить режим по умолчанию
+ c9837b9dba87194cefcbaa422a7c47563def43f7 Добавить фичу 2`, { filename: "сеанс: cherry-pick -x" }),
      ul(
        "`git cherry-pick -x main~1` создал на `release` коммит `b979d94` с тем же изменением (файл `app.cfg`: режим «безопасный»). Фичи в `release` не попали (`ls`: только `app.cfg` и `core.txt`).",
        "В сообщении добавилась строка `(cherry picked from commit 1640a8a…)`; автор и дата автора прежние.",
        "В графе копия стоит отдельной линией: никакой связи с оригиналом, кроме текста.",
        "`git cherry -v release main` отмечает `-` у «Исправить режим по умолчанию» (эквивалентный патч уже есть) и `+` у обеих фич (ещё не перенесены).",
      ),
      h("Несколько коммитов"),
      code("text", `$ git cherry-pick main~2..main
[release 27d4eb7] Исправить режим по умолчанию
 Date: Wed Jan 15 09:06:00 2025 +0000
 1 file changed, 1 insertion(+), 1 deletion(-)
[release cd079eb] Добавить фичу 2
 Date: Wed Jan 15 09:07:00 2025 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 feature2.txt
$ git log --oneline --graph --all --decorate
* cd079eb (HEAD -> release) Добавить фичу 2
* 27d4eb7 Исправить режим по умолчанию
| * c9837b9 (main) Добавить фичу 2
| * 1640a8a Исправить режим по умолчанию
| * 0bdbb79 Добавить фичу 1
|/  
* ee41f43 Версия 1.0`, { filename: "сеанс: диапазон" }),
      p("`main~2..main` содержит два коммита (исправление и фичу 2); оба перенесены по порядку. Первый коммит диапазона (`main~2`, «Добавить фичу 1») не включается — запись `A..B` исключает A. Если нужно собрать перенос в один коммит, добавляют `-n`:"),
      code("text", `$ git cherry-pick -n main~2 main
$ git status -s
A  feature1.txt
A  feature2.txt
$ git commit -m "Перенести фичи 1 и 2 одним коммитом"
[release 1caa2da] Перенести фичи 1 и 2 одним коммитом
 2 files changed, 2 insertions(+)
 create mode 100644 feature1.txt
 create mode 100644 feature2.txt
$ git log --oneline --graph --all --decorate
* 1caa2da (HEAD -> release) Перенести фичи 1 и 2 одним коммитом
| * c9837b9 (main) Добавить фичу 2
| * 1640a8a Исправить режим по умолчанию
| * 0bdbb79 Добавить фичу 1
|/  
* ee41f43 Версия 1.0`, { filename: "сеанс: cherry-pick -n" }),
    ]),

    section("detailed-example", [
      h("Конфликт при переносе"),
      p("Если в целевой ветке изменена та же строка, Git остановится так же, как при слиянии или rebase:"),
      code("text", `$ git cherry-pick main~1
Auto-merging app.cfg
CONFLICT (content): Merge conflict in app.cfg
error: could not apply 1640a8a... Исправить режим по умолчанию
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run
hint: "git cherry-pick --continue".
hint: You can instead skip this commit with "git cherry-pick --skip".
hint: To abort and get back to the state before "git cherry-pick",
hint: run "git cherry-pick --abort".
$ git status
On branch release
You are currently cherry-picking commit 1640a8a.
  (fix conflicts and run "git cherry-pick --continue")
  (use "git cherry-pick --skip" to skip this patch)
  (use "git cherry-pick --abort" to cancel the cherry-pick operation)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   app.cfg

no changes added to commit (use "git add" and/or "git commit -a")
# решаем: берём «безопасный»
$ git add app.cfg
$ git cherry-pick --continue
[release a202f3b] Исправить режим по умолчанию
 Date: Wed Jan 15 09:06:00 2025 +0000
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline --graph --all --decorate
* a202f3b (HEAD -> release) Исправить режим по умолчанию
* 5b4ce1e Release: режим «ограниченный»
| * c9837b9 (main) Добавить фичу 2
| * 1640a8a Исправить режим по умолчанию
| * 0bdbb79 Добавить фичу 1
|/  
* ee41f43 Версия 1.0`, { filename: "сеанс: конфликт cherry-pick" }),
      ul(
        "`git status` пишет `You are currently cherry-picking commit 1640a8a` и подсказывает `--continue`, `--skip` и `--abort`.",
        "После правки файла и `git add` команда `git cherry-pick --continue` создаёт коммит с прежним автором и сообщением.",
        "В графе итоговый коммит `a202f3b` лежит поверх `release`; оригинал `1640a8a` остался в `main` — это две независимые записи.",
      ),
      h("Спрятать работу и вернуться"),
      code("text", `$ echo "правка в процессе" >> core.txt
$ echo "заметка" > notes.txt
$ git status -s
 M core.txt
?? notes.txt
$ git stash
Saved working directory and index state WIP on main: c9837b9 Добавить фичу 2
$ git status -s
?? notes.txt
$ git stash list
stash@{0}: WIP on main: c9837b9 Добавить фичу 2
# срочная правка: рабочее дерево чистое
$ echo "срочно" > hotfix.txt
$ git commit -m "Срочное исправление"
[main 2a7629e] Срочное исправление
 1 file changed, 1 insertion(+)
 create mode 100644 hotfix.txt
$ git stash pop
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   core.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	notes.txt

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (0dec49d96b37b6825507d88aa8ffdf646c255823)
$ git status -s
 M core.txt
?? notes.txt
$ git stash list`, { filename: "сеанс: git stash и pop" }),
      ul(
        "`git stash` напечатал `Saved working directory and index state WIP on main: c9837b9 …`: правка `core.txt` спрятана, дерево чистое.",
        "Неотслеживаемый `notes.txt` остался (`??`): по умолчанию stash его не трогает.",
        "После срочного коммита `git stash pop` вернул правку и удалил запись (`Dropped refs/stash@{0}`).",
      ),
    ]),

    section("analysis", [
      h("Что прячет stash"),
      code("text", `$ git status -s --ignored
 M core.txt
?? notes.txt
!! debug.log
$ git stash push -m "основная правка"
Saved working directory and index state On main: основная правка
$ git status -s --ignored
?? notes.txt
!! debug.log
$ git stash push -u -m "правка и заметка"
Saved working directory and index state On main: правка и заметка
$ git status -s --ignored
!! debug.log
$ git stash push -a -m "всё, включая игнорируемое"
Saved working directory and index state On main: всё, включая игнорируемое
$ git status -s --ignored
$ git stash list
stash@{0}: On main: всё, включая игнорируемое`, { filename: "сеанс: stash, -u и -a" }),
      table(
        ["Команда", "Что спрятано", "Что осталось"],
        [
          ["`git stash push -m …`", "` M core.txt` (отслеживаемый)", "`?? notes.txt`, `!! debug.log`"],
          ["`git stash push -u -m …`", "`core.txt` и `notes.txt`", "`!! debug.log` (игнорируется)"],
          ["`git stash push -a -m …`", "Всё: `core.txt`, `notes.txt`, `debug.log`", "Рабочее дерево пусто"],
        ],
        "Что попадает в stash",
      ),
      p("Правило: `-u`, если среди правок есть новые файлы; `-a` — редко (игнорируемые файлы, как правило, не нужно прятать). Всегда давайте записям понятное сообщение (`-m`): список `stash list` без сообщений быстро становится загадкой."),
    ]),

    section("internals", [
      h("Что внутри stash"),
      code("text", `$ git status -s
 M core.txt
A  staged.txt
$ git stash push -m "эксперимент"
Saved working directory and index state On main: эксперимент
$ git stash show -p
diff --git a/core.txt b/core.txt
index acbae74..d11b5a6 100644
--- a/core.txt
+++ b/core.txt
@@ -1 +1,2 @@
 ядро
+правка
diff --git a/staged.txt b/staged.txt
new file mode 100644
index 0000000..9e2bd55
--- /dev/null
+++ b/staged.txt
@@ -0,0 +1 @@
+подготовленная
$ git cat-file -p stash
tree ccd288fd51f5b74f684a4491e848d8be515c2e95
parent c9837b9dba87194cefcbaa422a7c47563def43f7
parent d379bc8d92957e99fe0c6d7288043c429b5e4821
author Alice Dev <alice@example.com> 1736932320 +0000
committer Alice Dev <alice@example.com> 1736932320 +0000

On main: эксперимент
$ git log --oneline --graph stash
*   0764410 On main: эксперимент
|\\  
| * d379bc8 index on main: c9837b9 Добавить фичу 2
|/  
* c9837b9 Добавить фичу 2
* 1640a8a Исправить режим по умолчанию
* 0bdbb79 Добавить фичу 1
* ee41f43 Версия 1.0
$ git stash branch experiment
Switched to a new branch 'experiment'
On branch experiment
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   staged.txt

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   core.txt

Dropped refs/stash@{0} (076441077be28fafd96f0a0895c6a0aac23d94f7)
$ git status -s
 M core.txt
A  staged.txt
$ git stash list`, { filename: "сеанс: устройство stash" }),
      ul(
        "`git stash show -p` показывает спрятанное как diff относительно HEAD (включая подготовленный `staged.txt`).",
        "`git cat-file -p stash` — это объект коммита: `tree …`, **два родителя** — текущий HEAD (`c9837b9`) и служебный коммит «index on main: …» (`d379bc8`), а сообщение — `On main: эксперимент`.",
        "`git log --graph stash` рисует этот «ромб»: запись stash — настоящий коммит в истории, на который указывает `refs/stash`.",
        "`git stash branch experiment` создал ветку от коммита, на котором прятали, применил запись (подготовленный файл остался подготовленным) и удалил её. Это удобный способ продолжить работу без конфликтов, если ветка разошлась.",
      ),
      note("Записи stash — локальные: они не передаются при `push`/`clone`. Журнал `refs/stash` — единственное, что на них указывает, поэтому `git stash drop` и `clear` нельзя «отменить» штатно (теряется доступ к коммитам, их можно найти `git fsck --unreachable`)."),
      h("Конфликт при применении"),
      code("text", `$ git stash pop
Auto-merging core.txt
CONFLICT (content): Merge conflict in core.txt
On branch main
Unmerged paths:
  (use "git restore --staged <file>..." to unstage)
  (use "git add <file>..." to mark resolution)
	both modified:   core.txt

no changes added to commit (use "git add" and/or "git commit -a")
The stash entry is kept in case you need it again.
$ git status -s
UU core.txt
$ git stash list
stash@{0}: WIP on main: c9837b9 Добавить фичу 2`, { filename: "сеанс: stash pop с конфликтом" }),
      p("Если спрятанные правки не ложатся на изменившуюся ветку, `pop` сообщает `CONFLICT`, оставляет файл в состоянии `UU` и **не удаляет запись**: `The stash entry is kept in case you need it again`. Разрешите конфликт, затем удалите запись вручную `git stash drop`."),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git cherry-pick A..B      # «A..B включает A»
            git stash                 # «спрятал всё»
            git stash drop            # потом «куда делись правки?»
          `,
          note: "A..B исключает A; stash по умолчанию не прячет новые файлы; `drop` удаляет единственную ссылку на спрятанную работу.",
        },
        {
          title: "Верно",
          code: `
            git cherry-pick A~1..B    # или явный список коммитов
            git stash push -u -m "работа над фичей 3"
            git stash pop             # применить и убрать запись
          `,
          note: "Границы диапазона проверены, новые файлы включены `-u`, у записи есть описание.",
        },
      ),
      ul(
        "**Переносить коммиты в неправильном порядке.** Зависимые правки применяйте в порядке создания; иначе конфликты.",
        "**Cherry-pick целой ветки по одному коммиту** вместо `merge`/`rebase`: возникают дубли и конфликты при последующем слиянии.",
        "**Забывать `-x` при переносе в релиз:** потом не найти, откуда взялся коммит.",
        "**Копить stash:** через месяц `stash@{7}` — загадка. Прячьте на минуты и часы, а надолго — в WIP-коммит ветки.",
        "**Путать `pop` и `apply`:** `pop` удаляет запись, `apply` оставляет.",
        "**Надеяться, что stash прячет новые файлы:** без `-u` они остаются в дереве и могут перемешаться с чужой работой.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**«Конвейер cherry-pick» вместо ветвления:** постоянный перенос коммитов между `main` и `release` вручную. Лучше выбрать стратегию (например, исправлять в `release` и вливать в `main`, или использовать `-x` и список переносимых коммитов).",
        "**Cherry-pick опубликованных коммитов в обе стороны без учёта:** создаёт параллельные копии; при слиянии веток — шум и конфликты.",
        "**Stash как «хранилище» черновиков:** записи живут локально, легко теряются, не видны другим.",
        "**Pop на другой ветке без проверки:** правки лягут на чужой код и вызовут конфликты; читайте `stash show -p` перед применением.",
        "**Перенос коммитов слияния без `-m`:** Git откажется — не знает, какого родителя считать основным.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Используйте `cherry-pick -x`** для backport: след остаётся в сообщении.",
        "**Перед переносом смотрите `git show <коммит>`** и `git cherry -v`: нужен ли коммит и нет ли его эквивалента.",
        "**Для переноса нескольких правок одним коммитом — `-n`.**",
        "**Прячьте с описанием и `-u`:** `git stash push -u -m \"что именно\"`.",
        "**Перед `pop` смотрите `git stash show -p`** и состояние ветки; при сомнениях — `git stash branch`.",
        "**Не копите stash:** разбирайте список в тот же день; долгую работу фиксируйте в WIP-коммитах отдельной ветки.",
        "**Для передачи изменений вне сети — `format-patch` и `am`.**",
      ),
    ]),

    section("edge-cases", [
      h("Передать коммит как файл"),
      code("text", `$ git format-patch -1
0001-Make-safe-mode-the-default.patch
$ cat 0001-Make-safe-mode-the-default.patch
From aa5c38c27fa310b13f782310f900f8b674dcd846 Mon Sep 17 00:00:00 2001
From: Alice Dev <alice@example.com>
Date: Wed, 15 Jan 2025 09:04:00 +0000
Subject: [PATCH] Make safe mode the default

---
 app.cfg | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

diff --git a/app.cfg b/app.cfg
index 332dec8..7cd75d5 100644
--- a/app.cfg
+++ b/app.cfg
@@ -1 +1 @@
-mode=normal
+mode=safe
-- 
2.43.0

$ git am 0001-Make-safe-mode-the-default.patch
Applying: Make safe mode the default
$ git log --oneline --graph --all --decorate
* fee74c0 (HEAD -> release) Make safe mode the default
| * aa5c38c (main) Make safe mode the default
|/  
* 486c79a Initial version
$ git log -1 --format="%an <%ae> %ad"
Alice Dev <alice@example.com> Wed Jan 15 09:04:00 2025 +0000`, { filename: "сеанс: format-patch и am" }),
      ul(
        "`git format-patch -1` создал файл `0001-Make-safe-mode-the-default.patch`: заголовки `From`, `Date`, `Subject`, затем diff. (Для сообщений на кириллице заголовок кодируется MIME, поэтому в примере английский заголовок.)",
        "`git am` применил патч в `release` как коммит: автор и дата автора сохранены (`Alice Dev … 09:04:00`), хэш другой.",
        "Формат удобен для переписки, ревью по почте и переноса между разными репозиториями.",
      ),
      h("Прочие нюансы"),
      ul(
        "**Пустой cherry-pick:** если изменение уже есть в ветке, Git сообщит, что нечего коммитить; продолжить можно `--skip` или `--allow-empty`.",
        "**`git stash --keep-index`** прячет изменения, но оставляет подготовленное в индексе и в дереве (удобно, чтобы проверить подготовленное в чистом виде).",
        "**Stash и подмодули/большие файлы:** поведение зависит от настроек; перед сложным stash проверяйте `git status`.",
        "**Reflog stash:** `git stash list` читает журнал `refs/stash`; потерянные записи можно найти `git fsck --unreachable` до сборки мусора.",
        "**Rebase** построен на тех же механизмах: перенос каждого коммита — это cherry-pick.",
      ),
    ]),

    section("related", [
      ul(
        "[Rebase](/learn/git/rebase) — массовый cherry-pick и пропуск уже перенесённых патчей.",
        "[Ветки и HEAD](/learn/git/branches-head) — ограничение при переключении с правками.",
        "[Отмена изменений](/learn/git/undoing-changes) — `restore` и `reset` для откатов после переноса.",
        "[Reset, revert и reflog](/learn/git/reset-revert-reflog) — откат неправильно перенесённых коммитов.",
        "[Стратегии ветвления](/learn/git/branching-strategies) — как организовать исправления для релизных веток.",
        "[Релизы и теги](/learn/git/releases-tags) — backport исправлений в поддерживаемые версии.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Правки «на потом»",
          code: `
            cp -r проект проект_копия      # «прячем» работу копированием папки
            git switch hotfix
            # ...
            # потом вручную сравниваем и переносим
          `,
          note: "Копии каталога устаревают, легко перепутать, что и откуда переносили.",
        },
        {
          title: "stash и cherry-pick",
          code: `
            git stash push -u -m "работа над фичей"
            git switch release
            git cherry-pick -x <коммит исправления>
            git switch main
            git stash pop
          `,
          note: "Работа сохранена, исправление перенесено с пометкой, дерево чистое там, где нужно.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.cherry-pick-stash.ex1",
      title: "Backport исправления",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("В `main` лежат три коммита после релиза: фича 1, исправление режима по умолчанию и фича 2. В `release` нужно перенести только исправление и оставить след об источнике. Выполните перенос и проверьте, какие файлы окажутся в `release`."),
      ],
      hints: [
        "Исправление — предпоследний коммит `main` (`main~1`).",
        "Ключ `-x` добавляет строку об источнике.",
        "`git cherry -v release main` покажет, что перенесено.",
      ],
      checks: ["Перенесён один коммит", "В сообщении есть `(cherry picked from commit …)`", "Файлов `feature1.txt` и `feature2.txt` в `release` нет", "`git cherry` показывает `-` у исправления"],
      solution: [
        code("text", `$ git log --oneline --graph --all --decorate
* c9837b9 (HEAD -> main) Добавить фичу 2
* 1640a8a Исправить режим по умолчанию
* 0bdbb79 Добавить фичу 1
* ee41f43 (release) Версия 1.0
$ git switch release
Switched to branch 'release'
$ git cherry-pick -x main~1
[release b979d94] Исправить режим по умолчанию
 Date: Wed Jan 15 09:06:00 2025 +0000
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline --graph --all --decorate
* b979d94 (HEAD -> release) Исправить режим по умолчанию
| * c9837b9 (main) Добавить фичу 2
| * 1640a8a Исправить режим по умолчанию
| * 0bdbb79 Добавить фичу 1
|/  
* ee41f43 Версия 1.0
$ git log -1
commit b979d943742c10f7ea6f66fa5792d7c1ccf2c14b
Author: Alice Dev <alice@example.com>
Date:   Wed Jan 15 09:06:00 2025 +0000

    Исправить режим по умолчанию
    
    (cherry picked from commit 1640a8a5d43c6e65da1a6369e1941962e07cbd19)
$ cat app.cfg
версия=1.0
режим=безопасный
$ ls
app.cfg
core.txt
# git cherry показывает, какие коммиты main ещё не перенесены в release («+» — не перенесён, «-» — эквивалентный патч уже есть)
$ git cherry -v release main
+ 0bdbb79f6e612162e5ef9326aadcb566a624d33d Добавить фичу 1
- 1640a8a5d43c6e65da1a6369e1941962e07cbd19 Исправить режим по умолчанию
+ c9837b9dba87194cefcbaa422a7c47563def43f7 Добавить фичу 2`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.cherry-pick-stash.ex2",
      title: "Cherry-pick остановился на конфликте",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("В `release` изменена строка `режим=…` другим значением, и перенос исправления из `main` остановился с `CONFLICT`. Разрешите конфликт (оставьте `режим=безопасный`) и завершите перенос. Что покажет `git status` во время остановки?"),
      ],
      hints: [
        "Подсказки Git называют `--continue`, `--skip`, `--abort`.",
        "Правка файла и `git add`, затем `--continue`.",
        "Статус сообщает, какой коммит переносится.",
      ],
      checks: ["Конфликт разрешён", "`--continue` создал коммит", "В истории `release` два коммита после релиза: свой и перенесённый", "Объяснено, чем отличается `--skip`"],
      solution: [
        code("text", `$ git cherry-pick main~1
Auto-merging app.cfg
CONFLICT (content): Merge conflict in app.cfg
error: could not apply 1640a8a... Исправить режим по умолчанию
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run
hint: "git cherry-pick --continue".
hint: You can instead skip this commit with "git cherry-pick --skip".
hint: To abort and get back to the state before "git cherry-pick",
hint: run "git cherry-pick --abort".
$ git status
On branch release
You are currently cherry-picking commit 1640a8a.
  (fix conflicts and run "git cherry-pick --continue")
  (use "git cherry-pick --skip" to skip this patch)
  (use "git cherry-pick --abort" to cancel the cherry-pick operation)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   app.cfg

no changes added to commit (use "git add" and/or "git commit -a")
# решаем: берём «безопасный»
$ git add app.cfg
$ git cherry-pick --continue
[release a202f3b] Исправить режим по умолчанию
 Date: Wed Jan 15 09:06:00 2025 +0000
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline --graph --all --decorate
* a202f3b (HEAD -> release) Исправить режим по умолчанию
* 5b4ce1e Release: режим «ограниченный»
| * c9837b9 (main) Добавить фичу 2
| * 1640a8a Исправить режим по умолчанию
| * 0bdbb79 Добавить фичу 1
|/  
* ee41f43 Версия 1.0`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.cherry-pick-stash.ex3",
      title: "Срочное исправление без потери работы",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Вы правите `core.txt` и создали новый файл `draft.txt`; всё не готово. Приходит срочная задача: исправить `release` и перенести то же исправление в `main`. Выполните это, не теряя работу и без коммитов-«мусора»."),
      ],
      hints: [
        "Новые файлы прячутся ключом `-u`.",
        "Сначала спрятать, затем переключиться и закоммитить исправление.",
        "Перенос в `main` — `cherry-pick -x release`; в конце `stash pop`.",
      ],
      checks: ["Работа спрятана вместе с `draft.txt`", "Исправление есть в `release` и в `main`", "`stash pop` вернул работу", "Список stash пуст"],
      solution: [
        code("text", `$ git status -s
 M core.txt
?? draft.txt
# 1. прячем всё, включая неотслеживаемое
$ git stash push -u -m "работа над фичей 3"
Saved working directory and index state On main: работа над фичей 3
$ git status -s
# 2. срочное исправление в release
$ git switch release
Switched to branch 'release'
$ git add patch.txt && git commit -m "Срочное исправление безопасности"
[release 254dde2] Срочное исправление безопасности
 1 file changed, 1 insertion(+)
 create mode 100644 patch.txt
# 3. то же исправление нужно и в main
$ git switch main
Switched to branch 'main'
$ git cherry-pick -x release
[main 5001987] Срочное исправление безопасности
 Date: Wed Jan 15 09:16:00 2025 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 patch.txt
# 4. возвращаем работу
$ git stash pop
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   core.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	draft.txt

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (6cdef2e2e6a1b569be846623b55ef464691e24a6)
$ git status -s
 M core.txt
?? draft.txt
$ git log --oneline --graph --all --decorate
* 5001987 (HEAD -> main) Срочное исправление безопасности
* c9837b9 Добавить фичу 2
* 1640a8a Исправить режим по умолчанию
* 0bdbb79 Добавить фичу 1
| * 254dde2 (release) Срочное исправление безопасности
|/  
* ee41f43 Версия 1.0`, { filename: "решение" }),
      ],
    }),
  ],

  challenge: {
    id: "git.cherry-pick-stash.challenge",
    title: "Дневной цикл: исправление, перенос, возврат к работе",
    scenario: [
      p("Вы работаете над фичей: изменён отслеживаемый файл и есть неотслеживаемый черновик. В релизной ветке обнаружена уязвимость, исправить нужно сегодня, и то же исправление должно оказаться в `main`. После этого вы продолжаете работу над фичей с того же места."),
    ],
    requirements: [
      "Спрятать всю текущую работу, включая неотслеживаемые файлы, с понятным описанием",
      "Сделать исправление в `release` одним коммитом",
      "Перенести исправление в `main` с пометкой об источнике",
      "Вернуть спрятанную работу и убедиться, что состояние дерева прежнее",
    ],
    constraints: [
      "Не создавать временных коммитов с «WIP» в `main`",
      "Не копировать каталог проекта",
    ],
    acceptance: [
      "`git stash push -u -m …` оставил чистое дерево",
      "В `main` есть коммит с `(cherry picked from commit …)`",
      "После `git stash pop` статус: ` M core.txt` и `?? draft.txt`",
      "`git stash list` пуст",
    ],
    hints: [
      "`-u` включает неотслеживаемые файлы.",
      "`git cherry-pick -x release` берёт верхний коммит `release`.",
      "`pop` применяет и удаляет запись.",
    ],
    solution: [
      code("text", `$ git status -s
 M core.txt
?? draft.txt
# 1. прячем всё, включая неотслеживаемое
$ git stash push -u -m "работа над фичей 3"
Saved working directory and index state On main: работа над фичей 3
$ git status -s
# 2. срочное исправление в release
$ git switch release
Switched to branch 'release'
$ git add patch.txt && git commit -m "Срочное исправление безопасности"
[release 254dde2] Срочное исправление безопасности
 1 file changed, 1 insertion(+)
 create mode 100644 patch.txt
# 3. то же исправление нужно и в main
$ git switch main
Switched to branch 'main'
$ git cherry-pick -x release
[main 5001987] Срочное исправление безопасности
 Date: Wed Jan 15 09:16:00 2025 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 patch.txt
# 4. возвращаем работу
$ git stash pop
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   core.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	draft.txt

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (6cdef2e2e6a1b569be846623b55ef464691e24a6)
$ git status -s
 M core.txt
?? draft.txt
$ git log --oneline --graph --all --decorate
* 5001987 (HEAD -> main) Срочное исправление безопасности
* c9837b9 Добавить фичу 2
* 1640a8a Исправить режим по умолчанию
* 0bdbb79 Добавить фичу 1
| * 254dde2 (release) Срочное исправление безопасности
|/  
* ee41f43 Версия 1.0`, { filename: "решение" }),
    ],
  },

  interview: [
    iq("git.cherry-pick-stash.i1", "basic", "Что делает `git cherry-pick`?", [
      ul(
        "Применяет изменение указанного коммита к текущей ветке новым коммитом.",
        "Автор и сообщение сохраняются; хэш и родитель другие.",
        "Типичное использование: перенос исправления в релизную ветку.",
      ),
    ]),
    iq("git.cherry-pick-stash.i2", "basic", "Для чего нужен `git stash`?", [
      ul(
        "Временно спрятать незакоммиченные изменения и вернуть рабочее дерево к чистому состоянию (например, чтобы переключиться на срочную задачу).",
        "Вернуть: `git stash pop` (с удалением записи) или `git stash apply`.",
        "По умолчанию прячутся только отслеживаемые файлы; `-u` добавляет неотслеживаемые.",
      ),
    ]),
    iq("git.cherry-pick-stash.i3", "intermediate", "Что делает `-x` в `cherry-pick` и зачем он нужен?", [
      ul(
        "Добавляет в сообщение строку `(cherry picked from commit <хэш>)`.",
        "Оставляет след о происхождении: полезно при backport и поиске дубликатов.",
        "Не создаёт технической связи — это просто текст.",
      ),
    ]),
    iq("git.cherry-pick-stash.i4", "intermediate", "Что означает диапазон `A..B` в `cherry-pick`?", [
      ul(
        "Коммиты, достижимые из B, но не из A: сам A не включается.",
        "Коммиты применяются от старых к новым.",
        "Чтобы включить A, используют `A~1..B` или перечисляют коммиты явно.",
      ),
    ]),
    iq("git.cherry-pick-stash.i5", "intermediate", "Как устроен stash и где он хранится?", [
      ul(
        "Запись stash — настоящий коммит с двумя родителями: HEAD и коммит состояния индекса (`index on …`).",
        "Хранится в `refs/stash`; список `stash@{n}` — журнал этой ссылки.",
        "Записи локальные: при `push`/`clone` не передаются.",
      ),
    ]),
    iq("git.cherry-pick-stash.i6", "advanced", "Что произойдёт при `git stash pop` с конфликтом?", [
      ul(
        "Git выведет `CONFLICT`, оставит файлы в `UU` и **не удалит** запись stash (`The stash entry is kept`).",
        "Нужно разрешить конфликт, а затем вручную `git stash drop`.",
        "Альтернатива: `git stash branch <имя>` — применить на коммите, где прятали, без конфликтов с новой историей.",
      ),
    ]),
    iq("git.cherry-pick-stash.i7", "engineering", "Как организовать исправления для нескольких поддерживаемых версий?", [
      ul(
        "Исправлять там, где это дешевле (чаще в `main`), и переносить `cherry-pick -x` в релизные ветки; либо исправлять в самой старой ветке и вливать вперёд.",
        "Вести список перенесённых коммитов (`git cherry`), покрывать исправления тестами в каждой ветке.",
        "Договориться, какой способ принят, чтобы не плодить дубли и не терять исправления.",
      ),
    ]),
    iq("git.cherry-pick-stash.i8", "debugging", "Вы сделали `git stash drop` и поняли, что записи не хватает. Что делать?", [
      ul(
        "Не запускать `git gc`.",
        "Найти недостижимые коммиты: `git fsck --unreachable | grep commit`; посмотреть `git show <хэш>` — запись stash выглядит как `WIP on …`.",
        "Применить найденный коммит: `git stash apply <хэш>` или `git branch восстановленная <хэш>`.",
      ),
    ]),
  ],

  exam: [
    mcq("git.cherry-pick-stash.e1", "foundation", "Что создаёт `git cherry-pick X` на текущей ветке?", ["Слияние с X", "Копию ветки", "Новый коммит с изменением из X", "Тег"], 2, "Cherry-pick применяет изменение коммита X как новый коммит с тем же автором и сообщением, но с другим родителем и хэшем."),
    mcq("git.cherry-pick-stash.e2", "foundation", "Что по умолчанию не попадает в `git stash`?", ["Неотслеживаемые файлы", "Изменения отслеживаемых файлов", "Подготовленные изменения", "Удаления файлов"], 0, "Без `-u` stash прячет только отслеживаемые файлы. Новый файл остаётся в рабочем дереве."),
    mcq("git.cherry-pick-stash.e3", "foundation", "Чем `git stash pop` отличается от `git stash apply`?", ["Ничем", "`pop` создаёт ветку", "`apply` удаляет запись, `pop` нет", "`pop` после успешного применения удаляет запись, `apply` оставляет"], 3, "`pop` = применить + удалить запись; при конфликте запись остаётся. `apply` запись не удаляет."),
    mcq("git.cherry-pick-stash.e4", "intermediate", "Что перенесёт `git cherry-pick main~2..main`?", ["Три коммита, включая `main~2`", "Два коммита: после `main~2` до `main`", "Только `main~2`", "Все коммиты `main`"], 1, "Запись `A..B` исключает A: переносятся коммиты, достижимые из B, но не из A."),
    mcq("git.cherry-pick-stash.e5", "intermediate", "Что показывает `-` в выводе `git cherry -v release main`?", ["Коммит удалён", "Ошибка", "Коммит ещё не перенесён", "В `release` уже есть коммит с эквивалентным патчем"], 3, "`-` означает, что эквивалентный по изменению коммит уже есть в upstream; `+` — коммит ещё не перенесён."),
    mcq("git.cherry-pick-stash.e6", "intermediate", "Что содержит запись stash как объект Git?", ["Только diff", "Тег", "Коммит с двумя родителями: HEAD и коммит состояния индекса", "Ветку"], 2, "`git cat-file -p stash` показывает два `parent`: текущий коммит и служебный «index on …»."),
    mcq("git.cherry-pick-stash.e7", "advanced", "Какие утверждения верны? Выберите все.", ["`cherry-pick -x` записывает источник в сообщение", "Записи stash передаются при `git push`", "Конфликт при `stash pop` оставляет запись в списке", "`git stash -u` прячет и неотслеживаемые файлы"], [0, 2, 3], "Stash — локальный механизм: при `push` и `clone` его записи не передаются. Остальные утверждения верны."),
    open("git.cherry-pick-stash.e8", "intermediate", "Опишите ситуации, где вы используете cherry-pick, и риски такого подхода.", [
      ul(
        "Backport исправления в релизную ветку; перенос коммита, оказавшегося не в той ветке; извлечение отдельного коммита из заброшенной ветки.",
        "Риски: дубли коммитов с разными хэшами, конфликты при последующем слиянии веток, потеря связи с оригиналом (поэтому `-x`).",
        "Практика: переносить зависимые коммиты по порядку, проверять `git cherry`, документировать правило команды.",
      ),
    ], ["Названы сценарии", "Названы риски", "Упомянут `-x` и `git cherry`", "Упомянуты правила команды"]),
  ],

  mastery: [
    mcq("git.cherry-pick-stash.m1", "intermediate", "Как перенести два коммита из `main` в `release` одним коммитом?", ["`git cherry-pick A B`", "`git cherry-pick -n A B`, затем `git commit`", "`git merge main`", "`git stash`"], 1, "Ключ `-n` применяет изменения без коммита; после обоих переносов делается один обычный коммит."),
    mcq("git.cherry-pick-stash.m2", "advanced", "Почему `git stash pop` на другой ветке может привести к конфликту, а `git stash branch` — нет?", ["`stash branch` применяет запись на коммите, где её прятали, поэтому изменения ложатся чисто", "Из-за бага", "Потому что `stash branch` удаляет изменения", "Потому что он использует другой алгоритм слияния"], 0, "`git stash branch имя` создаёт ветку от исходного коммита записи и применяет изменения там, где они были сделаны, поэтому конфликтов с новыми изменениями нет."),
    mcq("git.cherry-pick-stash.m3", "advanced", "Вы перенесли исправление cherry-pick в `release`, а затем слили `main` в `release`. Что, вероятнее всего, произойдёт?", ["Исправление применится дважды с конфликтом", "Git откажется сливать", "Слияние пройдёт: изменение уже совпадает с результатом, конфликта нет", "Исправление удалится"], 2, "Если оба пути приводят к одному и тому же содержимому, трёхстороннее слияние их совпадение принимает. Дубли в истории при этом остаются."),
    open("git.cherry-pick-stash.m4", "advanced", "Ваша команда поддерживает три релизные ветки. Предложите схему исправлений и объясните, как не потерять исправления и не запутаться в дублях.", [
      ul(
        "Схема: исправлять в `main`, затем `cherry-pick -x` в релизные ветки (или исправлять в самой старой ветке и вливать вперёд).",
        "Контроль: `git cherry -v` для списка непереносённых, журнал исправлений (запрос на слияние, чек-лист), тесты в каждой ветке.",
        "Договорённость: единообразное сообщение, пометка `-x`, проверка при релизе, что все исправления присутствуют.",
      ),
    ], ["Выбрана схема", "Контроль непереносённых", "Единые правила", "Тесты и проверка при релизе"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.cherry-pick-stash.f1", front: "cherry-pick?", back: "Применяет изменение коммита к текущей ветке новым коммитом (новый хэш). -x — след об источнике." },
    { id: "git.cherry-pick-stash.f2", front: "A..B в cherry-pick?", back: "Коммиты после A до B; A не включается." },
    { id: "git.cherry-pick-stash.f3", front: "cherry-pick -n?", back: "Применить в индекс без коммита; можно собрать несколько переносов в один коммит." },
    { id: "git.cherry-pick-stash.f4", front: "git cherry -v up ветка?", back: "+ — не перенесён, - — эквивалент уже в upstream." },
    { id: "git.cherry-pick-stash.f5", front: "git stash?", back: "Прячет изменения отслеживаемых файлов; -u — и неотслеживаемые, -a — и игнорируемые." },
    { id: "git.cherry-pick-stash.f6", front: "pop / apply?", back: "pop — применить и удалить запись; apply — оставить. При конфликте запись сохраняется." },
    { id: "git.cherry-pick-stash.f7", front: "Устройство stash?", back: "Коммит с двумя родителями (HEAD и index on …) в refs/stash. Локально, не передаётся." },
    { id: "git.cherry-pick-stash.f8", front: "format-patch / am?", back: "Коммит → файл патча → применить как коммит с тем же автором и датой." },
  ],

  sources: [
    { title: "Pro Git: Rebasing (Cherry-picking)", url: "https://git-scm.com/book/en/v2/Git-Branching-Rebasing", publisher: "Git" },
    { title: "Pro Git: Stashing and Cleaning", url: "https://git-scm.com/book/en/v2/Git-Tools-Stashing-and-Cleaning", publisher: "Git" },
    { title: "Git documentation: git-cherry-pick", url: "https://git-scm.com/docs/git-cherry-pick", publisher: "Git" },
    { title: "Git documentation: git-stash", url: "https://git-scm.com/docs/git-stash", publisher: "Git" },
    { title: "Git documentation: git-cherry", url: "https://git-scm.com/docs/git-cherry", publisher: "Git" },
    { title: "Git documentation: git-format-patch", url: "https://git-scm.com/docs/git-format-patch", publisher: "Git" },
    { title: "Git documentation: git-am", url: "https://git-scm.com/docs/git-am", publisher: "Git" },
  ],
};
