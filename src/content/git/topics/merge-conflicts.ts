import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  tip,
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

export const mergeConflicts: Topic = {
  id: "git.merge-conflicts",
  slug: "merge-conflicts",
  domain: "git",
  module: "branching",
  title: "Конфликты слияния",
  titleEn: "Merge Conflicts",
  summary:
    "Конфликт возникает, когда обе стороны изменили одно и то же место по-разному, и Git не может выбрать за вас. Это штатная ситуация, а не авария. Тема на опытах показывает, как читать маркеры, что лежит в индексе во время конфликта (стадии 1–3), как разрешить конфликт и завершить слияние, как отменить его, чем `-X ours` отличается от `-s ours`, как разбирать конфликты «изменён/удалён» и как `rerere` запоминает решения.",
  minutes: 80,
  prerequisites: ["git.merge", "git.three-areas"],
  tags: ["merge conflict", "conflict markers", "git status", "git ls-files -u", "git merge --abort", "git restore --ours", "git restore --theirs", "-X ours", "-s ours", "diff3", "rerere", "modify/delete", "mergetool"],
  keyConcepts: [
    { term: "Конфликт — одно место, две разные правки", text: "`port=8000` изменили в `main` на 8080 и в `feature` на 9090: Git написал `CONFLICT (content)`. Правка соседней строки `log=info → debug` слилась автоматически." },
    { term: "Маркеры: наша сторона, база, чужая", text: "`<<<<<<< HEAD` — наша версия (текущая ветка), `=======` — разделитель, `>>>>>>> feature` — вливаемая. С `merge.conflictStyle=diff3` между ними появляется блок `|||||||` с версией общего предка." },
    { term: "В индексе — три версии файла", text: "`git ls-files -u` показал стадии 1, 2, 3 (база, наша, чужая); `git show :1:config.txt`, `:2:`, `:3:` читает каждую." },
    { term: "Решение = правка + `git add` + коммит", text: "После правки файла `git add` помечает конфликт решённым, а `git commit --no-edit` завершает слияние. `git merge --abort` отменяет всё и возвращает состояние до слияния." },
    { term: "`-X ours` и `-s ours` — разные вещи", text: "`-X ours` берёт нашу сторону только в конфликтных строках (в опыте `log=debug` из `feature` сохранился); `-s ours` создаёт коммит слияния, но игнорирует `feature` целиком (`log=info`)." },
  ],
  sections: [
    section("definition", [
      def("Конфликт слияния", "Ситуация, когда Git не может автоматически объединить изменения: обе стороны по-разному изменили одни и те же строки, или одна изменила файл, а другая удалила его, и так далее.", "merge conflict"),
      def("Маркеры конфликта", "Строки `<<<<<<<`, `=======`, `>>>>>>>`, которые Git вставляет в файл. Их нужно убрать, выбрав итоговое содержимое.", "conflict markers"),
      def("Неразрешённый путь", "Файл в состоянии конфликта: в индексе вместо одной записи — три (стадии 1–3). В `git status` — `Unmerged paths`.", "unmerged path"),
      def("Наша и чужая сторона", "При слиянии «наша» — ветка, в которой вы находитесь (`HEAD`), «чужая» — вливаемая. В `rebase` соотношение меняется на обратное.", "ours and theirs"),
      def("Разрешение конфликта", "Редактирование файла до нужного вида, `git add` и коммит слияния.", "conflict resolution"),
      def("rerere", "«Reuse recorded resolution» — механизм, который запоминает, как вы разрешили конфликт, и применяет то же решение при повторении.", "rerere"),
    ]),

    section("why", [
      h("Конфликт — нормальная часть командной работы"),
      p("Пока два человека правят разные места, Git сливает работу сам. Но когда оба меняют одну и ту же строку, решить, какой вариант правильный, может только человек: Git не знает, что значит «порт 8080» или «порт 9090». Вместо того чтобы молча выбрать одно, он останавливает слияние и показывает обе версии."),
      p("Бояться конфликтов не нужно: они безопасны, пока вы понимаете, что происходит. Ошибки случаются, когда слияние «разрешают» вслепую: оставляют маркеры в файле, выбирают сторону механически или теряют чужую правку."),
      ul(
        "**Безопасность:** слияние в состоянии конфликта не изменяет историю — его можно отменить `git merge --abort`.",
        "**Контроль:** Git показывает три версии (база, наша, чужая) и точное место несогласия.",
        "**Навык:** умение разбирать конфликты отличает уверенного пользователя Git от того, кто боится ветвления.",
        "**Профилактика:** понимая причины, их можно сокращать — короткие ветки, частые слияния, раздельные коммиты форматирования.",
      ),
      tip("Конфликт не означает, что кто-то ошибся. Это сигнал, что два человека одновременно изменили одно и то же: разрешать лучше с участием авторов обеих правок."),
    ]),

    section("mental-model", [
      h("Три версии и решение человека"),
      diagram(
        `
                    база (общий предок)             стадия 1
                     port=8000
                    /           \\
        наша (main) /             \\ чужая (feature)
        port=8080  /               \\ port=9090          стадия 2        стадия 3
                   \\               /
                    \\  КОНФЛИКТ   /
                     ▼           ▼
                    итог: решает человек
        `,
        "Обе стороны изменили одну и ту же строку базы по-разному: автоматически выбрать нельзя.",
      ),
      h("Как выглядит конфликт в файле"),
      table(
        ["Маркер", "Что за ним"],
        [
          ["`<<<<<<< HEAD`", "Начало нашей версии (того, что в текущей ветке)"],
          ["`|||||||` (только в стиле `diff3`)", "Версия общего предка"],
          ["`=======`", "Разделитель сторон"],
          ["`>>>>>>> feature`", "Конец чужой версии; в метке указана вливаемая ветка"],
        ],
        "Маркеры конфликта в файле",
      ),
      insight("Итоговый файл — это то, что вы решите, а не «выбор одной из сторон». Часто правильный результат — комбинация обеих правок, и для этого полезно знать, что хотела каждая сторона."),
    ]),

    section("technical", [
      h("Состояния конфликтов в статусе"),
      table(
        ["Код `git status -s`", "Что случилось"],
        [
          ["`UU`", "Обе стороны изменили файл (both modified)"],
          ["`AA`", "Обе стороны добавили файл с одним именем (both added)"],
          ["`DU`", "Мы удалили, они изменили (deleted by us)"],
          ["`UD`", "Мы изменили, они удалили (deleted by them)"],
          ["`DD`", "Файл удалён обеими сторонами (both deleted)"],
          ["`AU`, `UA`", "Файл добавлен только нами / только ими (added by us / by them)"],
        ],
        "Коды неразрешённых файлов",
      ),
      h("Что лежит в индексе"),
      p("Во время конфликта вместо одной записи файла в индексе три: стадия 1 — версия общего предка, 2 — наша, 3 — чужая. Их показывают `git ls-files -u` (режим, хэш, стадия, путь) и `git show :1:файл`, `:2:`, `:3:`. Команда `git add файл` заменяет три записи одной (стадия 0) — так конфликт помечается решённым."),
      h("Как разрешить"),
      ul(
        "**Вручную:** открыть файл, выбрать итоговое содержимое, **удалить маркеры**, сохранить.",
        "**Выбрать сторону целиком:** `git restore --ours файл` (наша) или `git restore --theirs файл` (чужая) — перезаписывают файл выбранной версией целиком, без маркеров; после этого всё равно нужен `git add`.",
        "**Инструмент слияния:** `git mergetool` запускает настроенную программу с тремя панелями.",
        "**Завершить:** `git add файл`, затем `git commit` (сообщение подготовлено; `--no-edit` принимает его).",
        "**Отменить:** `git merge --abort` возвращает состояние до слияния.",
      ),
      h("Параметры -X и стратегия -s"),
      table(
        ["Форма", "Действие"],
        [
          ["`git merge -X ours ветка`", "Обычное слияние, но в **конфликтных** участках берётся наша сторона; неконфликтные чужие правки сохраняются"],
          ["`git merge -X theirs ветка`", "То же, но берётся чужая сторона"],
          ["`git merge -s ours ветка`", "Стратегия: создаётся коммит слияния, а **всё** содержимое вливаемой ветки игнорируется"],
        ],
        "Опции и стратегии выбора стороны",
      ),
      warn("`-X` и `-s ours` молча выбрасывают чужую работу. Используйте их осознанно и только когда уверены, что чужая правка не нужна."),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git merge feature
git status
git diff
git add config.txt
git commit --no-edit
git merge --abort
git restore --ours config.txt
git restore --theirs config.txt
git config merge.conflictStyle diff3
git config rerere.enabled true`,
        [
          { line: 1, text: "Слияние остановилось на конфликте." },
          { line: [2, 3], text: "Состояние: `Unmerged paths`; `git diff` показывает комбинированный diff с маркерами." },
          { line: 4, text: "После правки файла отметить конфликт решённым." },
          { line: 5, text: "Завершить слияние с подготовленным сообщением." },
          { line: 6, text: "Отменить слияние и вернуть состояние до него." },
          { line: [7, 8], text: "Взять файл целиком из нашей или чужой стороны." },
          { line: 9, text: "Включить показ версии общего предка в маркерах." },
          { line: 10, text: "Включить запоминание разрешений." },
        ],
        "команды разрешения конфликтов",
      ),
    ]),

    section("minimal-example", [
      p("Файл `config.txt` с четырьмя строками. В `main` порт изменён на 8080; в `feature` — на 9090 и дополнительно включён подробный журнал (`log=debug`). Сливаем `feature` в `main`:"),
      code("text", `$ git merge feature
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
Automatic merge failed; fix conflicts and then commit the result.
$ git status
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   config.txt

no changes added to commit (use "git add" and/or "git commit -a")
$ cat config.txt
host=localhost
<<<<<<< HEAD
port=8080
=======
port=9090
>>>>>>> feature
debug=false
log=debug
$ git diff
diff --cc config.txt
index 9b14b2a,80fca33..0000000
--- a/config.txt
+++ b/config.txt
@@@ -1,4 -1,4 +1,8 @@@
  host=localhost
++<<<<<<< HEAD
 +port=8080
++=======
+ port=9090
++>>>>>>> feature
  debug=false
- log=info
+ log=debug
$ git ls-files -u
100644 a521c81a4634271746c2c8e40023c26abcfbcbf2 1	config.txt
100644 9b14b2a5acad9a36c9e52cd1139e9ad2e895d9d6 2	config.txt
100644 80fca33dee684767c5e96d2a832aec54efe53a08 3	config.txt
$ git diff --check
config.txt:2: leftover conflict marker
config.txt:4: leftover conflict marker
config.txt:6: leftover conflict marker`, { filename: "сеанс: слияние с конфликтом" }),
      ul(
        "Сообщение `CONFLICT (content): Merge conflict in config.txt` и `Automatic merge failed; fix conflicts and then commit the result.` — Git остановил слияние.",
        "`git status` показывает `both modified: config.txt` и подсказки, что делать.",
        "В файле: между `<<<<<<< HEAD` и `=======` — наша версия (`port=8080`), между `=======` и `>>>>>>> feature` — чужая (`port=9090`). Строка `log=debug` слилась автоматически (её изменила только `feature`).",
        "`git diff` показывает комбинированный формат `diff --cc`; `git ls-files -u` — три записи индекса: стадии 1, 2, 3.",
        "`git diff --check` предупреждает об оставшихся маркерах (`leftover conflict marker`) — полезная проверка перед `git add`.",
      ),
    ]),

    section("detailed-example", [
      h("Разрешаем и завершаем"),
      p("Решаем: оставляем порт `main` (8080) и принимаем подробный журнал из `feature`. Файл правится вручную, затем `git add` и коммит:"),
      code("text", `# правим файл: оставляем порт 8080 и подробный журнал
$ cat config.txt
host=localhost
port=8080
debug=false
log=debug
$ git add config.txt
$ git status
On branch main
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
	modified:   config.txt

$ git commit --no-edit
[main 842327c] Merge branch 'feature'
$ git log --oneline --graph --decorate
*   842327c (HEAD -> main) Merge branch 'feature'
|\\  
| * 4656923 (feature) Feature: порт 9090 и подробный журнал
* | 003d191 Main: порт 8080
|/  
* c0d09a4 Конфигурация
$ git status -s`, { filename: "сеанс: разрешение конфликта" }),
      ul(
        "После `git add` статус изменился: `All conflicts fixed but you are still merging` — слияние ещё не завершено, но конфликтов нет.",
        "`git commit --no-edit` создал коммит слияния с готовым сообщением `Merge branch 'feature'`.",
        "Граф показывает обычный коммит слияния с двумя родителями; в истории не видно, что был конфликт — только результат.",
        "Итоговый `git status -s` пуст.",
      ),
      h("Версия общего предка: diff3"),
      code("text", `$ git config merge.conflictStyle diff3
$ cat config.txt
host=localhost
<<<<<<< HEAD
port=8080
||||||| c0d09a4
port=8000
=======
port=9090
>>>>>>> feature
debug=false
log=debug
$ git show :1:config.txt
host=localhost
port=8000
debug=false
log=info
$ git show :2:config.txt
host=localhost
port=8080
debug=false
log=info
$ git show :3:config.txt
host=localhost
port=9090
debug=false
log=debug`, { filename: "сеанс: merge.conflictStyle = diff3" }),
      p("В стиле `diff3` между нашей и чужой версиями виден блок `|||||||` с базой (`port=8000`): по нему видно, что обе стороны меняли одно и то же значение. Те же три версии доступны через `git show :1:`, `:2:`, `:3:`."),
    ]),

    section("analysis", [
      h("Выбор стороны"),
      code("text", `# «наша» сторона — ветка, в которой вы стоите (main); «чужая» — вливаемая (feature)
$ git restore --ours config.txt
$ cat config.txt
host=localhost
port=8080
debug=false
log=info
$ git restore --theirs config.txt
$ cat config.txt
host=localhost
port=9090
debug=false
log=debug
# опция -X theirs: конфликтные строки берутся из feature, остальное сливается как обычно
$ git merge -X theirs feature -m "Влить feature (-X theirs)"
Auto-merging config.txt
Merge made by the 'ort' strategy.
 config.txt | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
$ cat config.txt
host=localhost
port=9090
debug=false
log=debug`, { filename: "сеанс: ours, theirs и -X" }),
      table(
        ["Команда", "Результат", "Что потеряно"],
        [
          ["`git restore --ours config.txt`", "Файл целиком из нашей версии: `port=8080`, `log=info`", "Правки `feature` в этом файле, включая неконфликтную `log=debug`"],
          ["`git restore --theirs config.txt`", "Файл целиком из чужой версии: `port=9090`, `log=debug`", "Наши правки в файле"],
          ["`git merge -X theirs feature`", "`port=9090`, `log=debug` — сливается, конфликт решается в пользу `feature`", "Наше значение порта (только в конфликтной строке)"],
        ],
        "Что именно выбирают разные способы",
      ),
      p("Обратите внимание на разницу между выбором версии файла (`--ours`/`--theirs`) и опцией `-X`: первая заменяет **весь файл**, вторая решает только конфликтные участки, остальное сливает как обычно."),
      h("`-X ours` против `-s ours`"),
      code("text", `# опция -X ours: конфликтные строки — наши, остальное сливается
$ git merge -X ours feature -m "Влить feature (-X ours)"
Auto-merging config.txt
Merge made by the 'ort' strategy.
 config.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ cat config.txt
host=localhost
port=8080
debug=false
log=debug
# стратегия -s ours: коммит слияния создаётся, но содержимое feature игнорируется целиком
$ git merge -s ours feature -m "Влить feature (-s ours)"
Merge made by the 'ours' strategy.
$ cat config.txt
host=localhost
port=8080
debug=false
log=info
$ git log --oneline --graph --decorate
*   a78d703 (HEAD -> main) Влить feature (-s ours)
|\\  
| * 4656923 (feature) Feature: порт 9090 и подробный журнал
* | 003d191 Main: порт 8080
|/  
* c0d09a4 Конфигурация`, { filename: "сеанс: -X ours и -s ours" }),
      ul(
        "`-X ours`: порт — наш (8080), а `log=debug` из `feature` **сохранился**, потому что не конфликтовал.",
        "`-s ours`: коммит слияния создан (`Merge made by the 'ours' strategy.`), но содержимое `feature` проигнорировано целиком (`log=info`). Ветка при этом считается слитой: история запомнила слияние, содержимое — нет.",
      ),
    ]),

    section("internals", [
      h("Конфликты «изменён/удалён»"),
      p("Конфликт бывает не только в строках. Если одна сторона удалила файл, а другая изменила, Git не может решить за вас, нужен ли файл:"),
      code("text", `$ git merge feature
CONFLICT (modify/delete): config.txt deleted in HEAD and modified in feature.  Version feature of config.txt left in tree.
Automatic merge failed; fix conflicts and then commit the result.
$ git status -s
DU config.txt
$ git ls-files -u
100644 a521c81a4634271746c2c8e40023c26abcfbcbf2 1	config.txt
100644 80fca33dee684767c5e96d2a832aec54efe53a08 3	config.txt
# решение: оставить файл (версию feature)
$ git add config.txt
$ git commit --no-edit
[main d2e847d] Merge branch 'feature'
$ cat config.txt
host=localhost
port=9090
debug=false
log=debug`, { filename: "сеанс: modify/delete" }),
      ul(
        "`CONFLICT (modify/delete): config.txt deleted in HEAD and modified in feature. Version feature of config.txt left in tree.` — файл оставлен в рабочем дереве в версии `feature`.",
        "В коротком статусе — `DU` (deleted by us); в индексе две записи: стадии 1 (база) и 3 (чужая), стадии 2 нет: у нас файла нет.",
        "Решение: оставить файл — `git add config.txt` (или удалить — `git rm config.txt`) и завершить слияние `git commit`.",
      ),
      h("Запомнить решение: rerere"),
      code("text", `$ git config rerere.enabled true
$ git add config.txt
$ git commit --no-edit
Recorded resolution for 'config.txt'.
[main 391f017] Merge branch 'feature'
$ git reset --hard HEAD~1
HEAD is now at 003d191 Main: порт 8080
$ git merge feature
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
Resolved 'config.txt' using previous resolution.
Automatic merge failed; fix conflicts and then commit the result.
$ cat config.txt
host=localhost
port=8080
debug=false
log=debug
$ git status -s
UU config.txt`, { filename: "сеанс: rerere" }),
      ul(
        "С `rerere.enabled` Git записывает разрешение при коммите: `Recorded resolution for 'config.txt'.`",
        "После отката слияния (`reset --hard HEAD~1`) повторное слияние снова даёт конфликт, но Git применил запомненное решение: `Resolved 'config.txt' using previous resolution.`",
        "Статус при этом остался `UU`: решение записано в файл, но не подготовлено — нужно проверить результат и выполнить `git add`.",
        "Полезно, когда одни и те же ветки сливают многократно (долгоживущие ветки, повторные `rebase`, пробное слияние перед настоящим).",
      ),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            <<<<<<< HEAD
            port=8080
            =======
            port=9090
            >>>>>>> feature
            # «разрешено»: git add config.txt && git commit
          `,
          note: "Маркеры остались в файле: в историю попал сломанный конфиг, и `git add` не возражает.",
        },
        {
          title: "Верно",
          code: `
            port=8080
            # затем:
            git diff --check
            git add config.txt
            git commit --no-edit
          `,
          note: "Итоговое содержимое без маркеров, проверка `diff --check`, затем `add` и коммит.",
        },
      ),
      ul(
        "**Оставить маркеры в файле.** Git не проверяет содержимое при `git add`; ищите маркеры перед коммитом (`git diff --check`, поиск `<<<<<<<`).",
        "**Механически выбирать «нашу» или «чужую» сторону,** не прочитав обе: легко потерять чужую правку, а вместе с ней и автора.",
        "**Паниковать и `reset --hard`.** Если запутались — `git merge --abort` вернёт всё как было.",
        "**Путать «нашу» и «чужую» в `rebase`:** при перебазировании роли меняются местами (тема про `rebase`).",
        "**Не запустить тесты после разрешения.** Конфликт мог быть не только текстовым: две правки по отдельности корректны, а вместе — ломают код.",
        "**Разрешать чужой конфликт без автора.** Лучше обсудить; автор знает, что имел в виду.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Долгоживущие ветки с редкими слияниями:** конфликты накапливаются; чем дольше ветка живёт в стороне, тем больше расхождений.",
        "**Массовое форматирование вместе с логикой:** конфликты в каждой строке файла; форматируйте отдельным коммитом и вовремя.",
        "**Слияние «наугад» через `-X theirs`/`-X ours`** во всей команде: незаметные потери кода.",
        "**«Разрешение» конфликта удалением файла и пересозданием:** теряется история и чужие изменения.",
        "**Прятать решение в отдельном коммите после слияния:** исправления конфликта должны быть в самом коммите слияния, иначе в истории есть «сломанное» состояние.",
        "**Игнорирование `Auto-merging` предупреждений:** автоматическое слияние тоже может дать логическую ошибку; проверяйте результат тестами.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Сначала читайте, потом решайте:** посмотрите обе версии (`git diff`, `git show :1/:2/:3`), поймите намерения.",
        "**Включите `merge.conflictStyle=diff3` (или `zdiff3`):** база в маркерах показывает, что каждая сторона изменила.",
        "**После правки:** `git diff --check`, `git status`, тесты; только потом `git add` и коммит.",
        "**Не бойтесь `git merge --abort`:** отмена всегда безопасна.",
        "**Сокращайте конфликты:** короткие ветки, частое слияние `main`, раздельные коммиты форматирования, общение в команде.",
        "**Для повторяющихся слияний включите `rerere`.**",
        "**Для сложных случаев используйте `git mergetool`** с тремя панелями.",
      ),
    ]),

    section("edge-cases", [
      h("Отмена слияния"),
      code("text", `$ git merge feature
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
Automatic merge failed; fix conflicts and then commit the result.
$ git merge --abort
$ git status -s
$ cat config.txt
host=localhost
port=8080
debug=false
log=info
$ git log --oneline --graph --all --decorate
* 003d191 (HEAD -> main) Main: порт 8080
| * 4656923 (feature) Feature: порт 9090 и подробный журнал
|/  
* c0d09a4 Конфигурация`, { filename: "сеанс: отмена слияния" }),
      p("`git merge --abort` вернул файл и индекс в состояние до слияния: статус чистый, `config.txt` с портом 8080, граф без коммита слияния."),
      h("Прочие нюансы"),
      ul(
        "**Двоичные файлы:** Git не может слить их построчно — конфликт возникает всегда, и вам придётся выбрать сторону (`git restore --ours/--theirs`).",
        "**Конфликты переименования** (`rename/rename`, `rename/delete`): Git сообщает о них отдельными сообщениями `CONFLICT (…)`; разбирайте по тексту сообщения.",
        "**`git log --merge`** показывает коммиты, затрагивающие конфликтующие файлы с обеих сторон.",
        "**Пока есть неразрешённые файлы,** Git не даст завершить слияние коммитом и не позволит переключить ветку: сначала разрешите конфликты или отмените слияние.",
        "**Автоматическое слияние ≠ правильное.** Два независимых изменения (например, переименование функции и новый вызов старого имени) сливаются без конфликта, но ломают программу — нужны тесты.",
      ),
    ]),

    section("related", [
      ul(
        "[Слияние веток](/learn/git/merge) — когда Git справляется без вас.",
        "[Рабочее дерево, индекс и репозиторий](/learn/git/three-areas) — стадии конфликта в индексе.",
        "[Поиск по истории](/learn/git/searching-history) — как понять, кто и зачем изменил спорную строку (`blame`, `log -L`).",
        "[Rebase](/learn/git/rebase) — конфликты при перебазировании.",
        "[Cherry-pick и stash](/learn/git/cherry-pick-stash) — конфликты при переносе коммитов и возврате спрятанных правок.",
        "[Стратегии ветвления](/learn/git/branching-strategies) — как организовать работу, чтобы конфликтов было меньше.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Слепое разрешение",
          code: `
            git merge feature
            # CONFLICT
            git add . && git commit -m "fix"
          `,
          note: "Маркеры остались в файлах, чужая правка не прочитана, тесты не запущены, сообщение ничего не говорит.",
        },
        {
          title: "Осознанное разрешение",
          code: `
            git merge feature
            git diff                      # что именно спорное
            # правим файл, оставляя нужное из обеих сторон
            git diff --check              # нет ли маркеров
            git add config.txt
            git commit --no-edit
            # запускаем тесты
          `,
          note: "Прочитали обе версии, собрали итог, проверили, что маркеров нет, и убедились тестами.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.merge-conflicts.ex1",
      title: "Прочитайте конфликт",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Вы на ветке `main` и выполнили `git merge feature`. Получен конфликт, в файле видны строки `<<<<<<< HEAD`, `port=8080`, `=======`, `port=9090`, `>>>>>>> feature`. Чьи это версии? Какая строка изменилась автоматически? Какие команды покажут три версии файла?"),
      ],
      hints: [
        "`HEAD` — ветка, в которой вы находитесь.",
        "Строки, которые изменила только одна сторона, Git сливает сам.",
        "Три версии лежат в индексе в стадиях 1, 2, 3.",
      ],
      checks: ["`port=8080` — наша версия (`main`), `port=9090` — чужая (`feature`)", "Автоматически слилась строка `log=debug`", "`git ls-files -u` и `git show :1:/:2:/:3:` показывают три версии"],
      solution: [
        code("text", `$ git merge feature
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
Automatic merge failed; fix conflicts and then commit the result.
$ git status
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   config.txt

no changes added to commit (use "git add" and/or "git commit -a")
$ cat config.txt
host=localhost
<<<<<<< HEAD
port=8080
=======
port=9090
>>>>>>> feature
debug=false
log=debug
$ git diff
diff --cc config.txt
index 9b14b2a,80fca33..0000000
--- a/config.txt
+++ b/config.txt
@@@ -1,4 -1,4 +1,8 @@@
  host=localhost
++<<<<<<< HEAD
 +port=8080
++=======
+ port=9090
++>>>>>>> feature
  debug=false
- log=info
+ log=debug
$ git ls-files -u
100644 a521c81a4634271746c2c8e40023c26abcfbcbf2 1	config.txt
100644 9b14b2a5acad9a36c9e52cd1139e9ad2e895d9d6 2	config.txt
100644 80fca33dee684767c5e96d2a832aec54efe53a08 3	config.txt
$ git diff --check
config.txt:2: leftover conflict marker
config.txt:4: leftover conflict marker
config.txt:6: leftover conflict marker`, { filename: "проверка в настоящем репозитории" }),
        code("text", `$ git config merge.conflictStyle diff3
$ cat config.txt
host=localhost
<<<<<<< HEAD
port=8080
||||||| c0d09a4
port=8000
=======
port=9090
>>>>>>> feature
debug=false
log=debug
$ git show :1:config.txt
host=localhost
port=8000
debug=false
log=info
$ git show :2:config.txt
host=localhost
port=8080
debug=false
log=info
$ git show :3:config.txt
host=localhost
port=9090
debug=false
log=debug`, { filename: "три версии файла" }),
      ],
    }),
    exercise({
      id: "git.merge-conflicts.ex2",
      title: "Разрешите и завершите слияние",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Разрешите конфликт в `config.txt`: оставьте порт 8080 (договорённость команды) и подробный журнал `log=debug`. Завершите слияние, проверьте граф и статус."),
      ],
      starter: {
        lang: "bash",
        code: `
          git merge feature
          # отредактируйте config.txt и уберите маркеры
        `,
      },
      hints: [
        "Итоговый файл не должен содержать `<<<<<<<`, `=======`, `>>>>>>>`.",
        "После правки — `git add файл`, затем `git commit`.",
        "`git diff --check` предупредит об оставшихся маркерах.",
      ],
      checks: ["В файле `port=8080` и `log=debug`", "Нет маркеров", "Создан коммит слияния с двумя родителями", "`git status -s` пуст"],
      solution: [
        code("text", `# правим файл: оставляем порт 8080 и подробный журнал
$ cat config.txt
host=localhost
port=8080
debug=false
log=debug
$ git add config.txt
$ git status
On branch main
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
	modified:   config.txt

$ git commit --no-edit
[main 842327c] Merge branch 'feature'
$ git log --oneline --graph --decorate
*   842327c (HEAD -> main) Merge branch 'feature'
|\\  
| * 4656923 (feature) Feature: порт 9090 и подробный журнал
* | 003d191 Main: порт 8080
|/  
* c0d09a4 Конфигурация
$ git status -s`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.merge-conflicts.ex3",
      title: "Файл изменён и удалён одновременно",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("В `main` файл `config.txt` удалили, а в `feature` его изменили. Слияние остановилось с сообщением `CONFLICT (modify/delete)`. Объясните сообщение, найдите, какие записи индекса есть у файла, и решите, как поступить, если файл нужен."),
      ],
      hints: [
        "В коротком статусе у такого файла — `DU` или `UD`.",
        "Какой стадии нет в индексе, если одна сторона удалила файл?",
        "Решение — `git add файл` (оставить) или `git rm файл` (удалить).",
      ],
      checks: ["Объяснено: одна сторона удалила, другая изменила", "Названы стадии 1 и 3 (нет стадии 2)", "Файл оставлен `git add` и слияние завершено", "Содержимое — версия `feature`"],
      solution: [
        code("text", `$ git merge feature
CONFLICT (modify/delete): config.txt deleted in HEAD and modified in feature.  Version feature of config.txt left in tree.
Automatic merge failed; fix conflicts and then commit the result.
$ git status -s
DU config.txt
$ git ls-files -u
100644 a521c81a4634271746c2c8e40023c26abcfbcbf2 1	config.txt
100644 80fca33dee684767c5e96d2a832aec54efe53a08 3	config.txt
# решение: оставить файл (версию feature)
$ git add config.txt
$ git commit --no-edit
[main d2e847d] Merge branch 'feature'
$ cat config.txt
host=localhost
port=9090
debug=false
log=debug`, { filename: "решение" }),
        p("Git не знает, нужен ли файл, поэтому оставляет версию «изменившей» стороны в рабочем дереве и ждёт решения: `git add` — оставить, `git rm` — удалить."),
      ],
    }),
  ],

  challenge: {
    id: "git.merge-conflicts.challenge",
    title: "Не решать один конфликт дважды",
    scenario: [
      p("Вы пробно сливаете `feature` в `main`, чтобы проверить сборку, затем откатываете слияние и повторяете его уже после ревью. Конфликт в `config.txt` один и тот же. Нужно, чтобы вручную его пришлось разрешить только один раз."),
    ],
    requirements: [
      "Включить `rerere`",
      "Разрешить конфликт вручную один раз и завершить слияние",
      "Откатить слияние и повторить его: Git должен подставить запомненное решение",
      "Проверить результат в файле и завершить слияние",
    ],
    constraints: [
      "Не копировать решение вручную из старого файла",
      "Не отключать проверку результата: подставленное решение нужно просмотреть и подготовить `git add`",
    ],
    acceptance: [
      "При первом коммите: `Recorded resolution for 'config.txt'.`",
      "При повторном слиянии: `Resolved 'config.txt' using previous resolution.`",
      "В файле итоговое содержимое без маркеров; статус `UU` до `git add`",
    ],
    hints: [
      "Настройка: `git config rerere.enabled true`.",
      "Откат пробного слияния: `git reset --hard HEAD~1` (до публикации).",
      "После автоподстановки файл нужно подготовить: `git add`.",
    ],
    solution: [
      code("text", `$ git config rerere.enabled true
$ git add config.txt
$ git commit --no-edit
Recorded resolution for 'config.txt'.
[main 391f017] Merge branch 'feature'
$ git reset --hard HEAD~1
HEAD is now at 003d191 Main: порт 8080
$ git merge feature
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
Resolved 'config.txt' using previous resolution.
Automatic merge failed; fix conflicts and then commit the result.
$ cat config.txt
host=localhost
port=8080
debug=false
log=debug
$ git status -s
UU config.txt`, { filename: "решение" }),
      p("Запомненное решение хранится в `.git/rr-cache`. Подстановка не заменяет проверку: после неё просмотрите файл, выполните `git add` и коммит."),
    ],
  },

  interview: [
    iq("git.merge-conflicts.i1", "basic", "Что такое конфликт слияния и почему он возникает?", [
      ul(
        "Ситуация, когда обе стороны изменили одно и то же место по-разному (или одна изменила, а другая удалила файл), и Git не может выбрать автоматически.",
        "Git останавливает слияние, помечает файл как неразрешённый и вставляет маркеры.",
        "Конфликт безопасен: слияние можно отменить `git merge --abort`.",
      ),
    ]),
    iq("git.merge-conflicts.i2", "basic", "Что означают маркеры `<<<<<<<`, `=======`, `>>>>>>>`?", [
      ul(
        "Между `<<<<<<< HEAD` и `=======` — версия текущей ветки («наша»).",
        "Между `=======` и `>>>>>>> имя` — версия вливаемой ветки («чужая»).",
        "С `diff3` добавляется блок `|||||||` — версия общего предка. Все маркеры нужно убрать, оставив итоговый текст.",
      ),
    ]),
    iq("git.merge-conflicts.i3", "intermediate", "Как завершить слияние после разрешения конфликта?", [
      ul(
        "Отредактировать файл, убрать маркеры, проверить (`git diff --check`).",
        "`git add файл` — отметить решённым (три записи индекса заменяются одной).",
        "`git commit` (или `--no-edit`): сообщение слияния подготовлено.",
      ),
    ]),
    iq("git.merge-conflicts.i4", "intermediate", "Что лежит в индексе во время конфликта?", [
      ul(
        "Три записи для файла: стадия 1 — общий предок, 2 — наша версия, 3 — чужая.",
        "Видно командами `git ls-files -u` и `git show :1:файл`, `:2:`, `:3:`.",
        "`git add` создаёт запись стадии 0 и убирает остальные.",
      ),
    ]),
    iq("git.merge-conflicts.i5", "intermediate", "Чем `-X ours` отличается от `-s ours`?", [
      ul(
        "`-X ours` — опция обычного слияния: в конфликтных участках берётся наша сторона, остальные чужие правки сливаются.",
        "`-s ours` — стратегия: создаётся коммит слияния, но всё содержимое вливаемой ветки игнорируется.",
        "В опыте: `-X ours` сохранил `log=debug`, `-s ours` — нет. Оба молча отбрасывают чужие правки, использовать нужно осознанно.",
      ),
    ]),
    iq("git.merge-conflicts.i6", "advanced", "Что такое rerere и когда он полезен?", [
      ul(
        "«Reuse recorded resolution»: Git запоминает, как вы разрешили конкретный конфликт, и подставляет то же решение при повторении.",
        "Включается `git config rerere.enabled true`; записи — в `.git/rr-cache`.",
        "Полезен при многократных слияниях одних веток, повторных `rebase`, пробных слияниях.",
        "Подставленное решение нужно проверить и подготовить `git add`.",
      ),
    ]),
    iq("git.merge-conflicts.i7", "engineering", "Как сократить число конфликтов в команде?", [
      ul(
        "Короткие ветки и частое слияние с `main`.",
        "Раздельные коммиты форматирования и автоформатирование в проверках.",
        "Разделение ответственности по файлам/модулям и общение о крупных изменениях.",
        "`.gitattributes` для переводов строк и слияния специальных файлов.",
        "Тесты и CI на результат слияния.",
      ),
    ]),
    iq("git.merge-conflicts.i8", "debugging", "Вы запутались во время разрешения конфликта. Что делать?", [
      ul(
        "`git merge --abort` — вернуть состояние до слияния и начать заново.",
        "Чтобы пересоздать конфликт в одном файле: `git checkout --merge файл` (или `git restore --merge файл`).",
        "Смотреть три версии (`git show :1:/:2:/:3:`), включить `diff3`.",
        "Если часть уже закоммичена: `git reset --hard ORIG_HEAD` (до публикации).",
      ),
    ]),
  ],

  exam: [
    mcq("git.merge-conflicts.e1", "foundation", "Какая команда отменяет слияние, остановившееся на конфликте?", ["`git revert HEAD`", "`git reset --soft`", "`git merge --abort`", "`git clean -fd`"], 2, "`git merge --abort` возвращает состояние до слияния: индекс, рабочее дерево и ветка снова такие, какими были."),
    mcq("git.merge-conflicts.e2", "foundation", "Что после `<<<<<<< HEAD` в маркерах конфликта?", ["Версия текущей ветки", "Версия вливаемой ветки", "Версия общего предка", "Сообщение коммита"], 0, "Между `<<<<<<< HEAD` и `=======` — наша версия (из ветки, в которой вы находитесь). Вливаемая идёт после `=======`."),
    mcq("git.merge-conflicts.e3", "foundation", "Что нужно сделать после правки файла, чтобы пометить конфликт решённым?", ["Ничего: Git сам определит", "`git rm файл`", "`git branch -d`", "`git add файл`"], 3, "`git add` заменяет три записи индекса одной (стадия 0): так Git понимает, что файл разрешён."),
    mcq("git.merge-conflicts.e4", "intermediate", "Какие стадии записей индекса есть у файла в конфликте «содержимое»?", ["Только 0", "1, 2 и 3", "Только 2", "1 и 2"], 1, "Стадия 1 — общий предок, 2 — наша версия, 3 — чужая. Увидеть: `git ls-files -u`."),
    mcq("git.merge-conflicts.e5", "intermediate", "В чём разница `-X theirs` и `--theirs`?", ["Нет разницы", "`-X theirs` удаляет наши коммиты", "`--theirs` работает только в `rebase`", "`-X theirs` решает только конфликтные участки при слиянии, `--theirs` берёт файл целиком"], 3, "`-X theirs` — опция слияния: в конфликтных строках берётся чужая сторона, остальное сливается. `git restore --theirs файл` заменяет файл чужой версией целиком."),
    mcq("git.merge-conflicts.e6", "intermediate", "Что покажет `git diff --check` после неаккуратного разрешения конфликта?", ["Список тестов", "Коммиты слияния", "Оставшиеся маркеры конфликта (`leftover conflict marker`)", "Ничего: проверяет только пробелы"], 2, "`git diff --check` сообщает не только о пробелах, но и об оставшихся маркерах конфликта: удобная проверка перед `git add`."),
    mcq("git.merge-conflicts.e7", "advanced", "Что произойдёт при повторном слиянии, если включён `rerere` и конфликт уже разрешался?", ["Конфликта не будет вообще", "Конфликт возникнет, но Git подставит запомненное решение (нужно проверить и `git add`)", "Git удалит файл", "Git создаст новую ветку"], 1, "`Resolved 'файл' using previous resolution.` Файл уже содержит решение, но статус остаётся `UU`, пока вы не выполните `git add`."),
    open("git.merge-conflicts.e8", "intermediate", "Опишите пошаговый порядок безопасного разрешения конфликта слияния.", [
      ul(
        "`git status` и `git diff`: какие файлы и места; при необходимости `diff3`.",
        "Прочитать обе версии и понять намерения; при сомнениях — обсудить с авторами.",
        "Править файл до итогового вида без маркеров; `git diff --check`.",
        "`git add`, запуск тестов, `git commit`; при затруднениях — `git merge --abort`.",
      ),
    ], ["Диагностика по статусу и diff", "Чтение обеих версий", "Проверка маркеров и тестов", "Использование `--abort`"]),
  ],

  mastery: [
    mcq("git.merge-conflicts.m1", "intermediate", "Что сделает `git merge -s ours feature`?", ["Создаст коммит слияния, игнорируя содержимое `feature` целиком", "Разрешит конфликты в нашу пользу, слив остальное", "Удалит `feature`", "Прервёт слияние"], 0, "Стратегия `ours` записывает слияние в историю, но дерево остаётся нашим. Отличие от `-X ours`: там неконфликтные чужие правки сохраняются."),
    mcq("git.merge-conflicts.m2", "advanced", "Файл `DU config.txt` в статусе: что произошло?", ["Мы изменили, они удалили", "Оба изменили", "Мы удалили, они изменили", "Оба добавили"], 2, "`DU` — deleted by us: в нашей ветке файл удалён, а вливаемая ветка его изменила. Решение: `git add` (оставить) или `git rm`."),
    mcq("git.merge-conflicts.m3", "advanced", "Какие утверждения верны? Выберите все.", ["Автоматическое слияние гарантирует правильность программы", "Конфликт можно отменить `git merge --abort`", "В `rebase` «наша» и «чужая» стороны меняются местами", "`git add` перед правкой маркеров отметит конфликт решённым корректно"], [1, 2], "Автослияние проверяет только текстовое пересечение, а `git add` не смотрит на содержимое: маркеры в файле останутся. `--abort` безопасен, а в `rebase` ours/theirs меняются ролями."),
    open("git.merge-conflicts.m4", "advanced", "В команде часто повторяются конфликты в одних и тех же файлах. Предложите технические и организационные меры.", [
      ul(
        "Технические: короткие ветки и частое слияние, раздельные коммиты форматирования, автоформатирование, `.gitattributes` (переводы строк, драйверы слияния), `rerere` для повторных слияний, CI на результат слияния.",
        "Организационные: владельцы модулей, согласование крупных рефакторингов, обсуждение перед массовыми правками общих файлов.",
        "Диагностика: `git log --merge`, `blame`, статистика конфликтующих файлов; выделить «горячие точки» и рефакторить.",
      ),
    ], ["Технические меры", "Организационные меры", "Диагностика причин", "Упомянут `rerere`"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.merge-conflicts.f1", front: "Откуда конфликт?", back: "Обе стороны изменили одно место по-разному (или изменили/удалили файл)." },
    { id: "git.merge-conflicts.f2", front: "Маркеры?", back: "<<<<<<< HEAD (наша) ======= (чужая) >>>>>>> ветка. diff3 добавляет ||||||| (база)." },
    { id: "git.merge-conflicts.f3", front: "Завершить слияние?", back: "Править файл → git add → git commit (--no-edit). Отменить: git merge --abort." },
    { id: "git.merge-conflicts.f4", front: "Стадии индекса?", back: "1 — общий предок, 2 — наша, 3 — чужая. git ls-files -u; git show :1:файл." },
    { id: "git.merge-conflicts.f5", front: "-X ours и -s ours?", back: "-X ours — наши конфликтные строки, остальное сливается. -s ours — содержимое ветки игнорируется целиком." },
    { id: "git.merge-conflicts.f6", front: "git restore --ours/--theirs файл?", back: "Файл целиком из нашей/чужой версии. Затем нужен git add." },
    { id: "git.merge-conflicts.f7", front: "rerere?", back: "Запоминает разрешения конфликтов и подставляет при повторе (rerere.enabled). Проверить и git add." },
    { id: "git.merge-conflicts.f8", front: "Проверка перед add?", back: "git diff --check ищет leftover conflict marker; затем тесты." },
  ],

  sources: [
    { title: "Pro Git: Basic Merge Conflicts", url: "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging", publisher: "Git" },
    { title: "Pro Git: Advanced Merging", url: "https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging", publisher: "Git" },
    { title: "Pro Git: Rerere", url: "https://git-scm.com/book/en/v2/Git-Tools-Rerere", publisher: "Git" },
    { title: "Git documentation: git-merge (How conflicts are presented)", url: "https://git-scm.com/docs/git-merge", publisher: "Git" },
    { title: "Git documentation: git-rerere", url: "https://git-scm.com/docs/git-rerere", publisher: "Git" },
    { title: "Git documentation: git-mergetool", url: "https://git-scm.com/docs/git-mergetool", publisher: "Git" },
    { title: "Git documentation: git-status (Short Format)", url: "https://git-scm.com/docs/git-status", publisher: "Git" },
  ],
};
