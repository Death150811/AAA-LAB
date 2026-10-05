import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
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

export const rebase: Topic = {
  id: "git.rebase",
  slug: "rebase",
  domain: "git",
  module: "advanced-git",
  title: "Rebase: перенос коммитов на новую основу",
  titleEn: "Rebase: Replaying Commits onto a New Base",
  summary:
    "`git rebase` берёт коммиты вашей ветки и воспроизводит их поверх другого коммита: история становится линейной, а у коммитов появляются новые хэши. Тема на опытах показывает алгоритм перебазирования, отличие от слияния, остановку на конфликте (`--continue`, `--skip`, `--abort`), перенос части ветки (`--onto`), откат неудачного rebase через `ORIG_HEAD` и reflog, сравнение `range-diff` и главное правило: не перебазировать то, что уже получили другие.",
  minutes: 85,
  prerequisites: ["git.merge", "git.merge-conflicts", "git.commits-history"],
  tags: ["git rebase", "rebase --onto", "rebase --continue", "rebase --abort", "ORIG_HEAD", "range-diff", "linear history", "golden rule of rebasing", "fast-forward", "pull --rebase", "patch-id"],
  keyConcepts: [
    { term: "Rebase воспроизводит коммиты на новой основе", text: "`git rebase main` на `feature` переиграл «Фича: шаг 1–2» поверх `main`: хэши изменились (`5fafe95` → `9f76ef3`, `d1f0841` → `e744456`), содержимое осталось, история стала линейной." },
    { term: "Новые коммиты — копии старых", text: "У перебазированного коммита другой родитель, а значит, другой хэш. Старые коммиты остаются в базе до очистки (`reflog`)." },
    { term: "Конфликты разрешаются покоммитно", text: "Rebase останавливается на коммите, который не лёг на новую основу (`could not apply e2e924c`); после правки — `git add` и `git rebase --continue`; также `--skip` и `--abort`." },
    { term: "`--onto` переносит часть ветки", text: "`git rebase --onto main feature-a feature-b` перенёс только два коммита `B` на `main`, не затронув `feature-a`." },
    { term: "Золотое правило: только неопубликованное", text: "Перебазированная и опубликованная ветка у Боба при обычном `pull` дала дубли (`Фича: шаг 1–2` дважды) и коммит слияния; `pull --rebase` справился, но рассчитывать на это нельзя." },
  ],
  sections: [
    section("definition", [
      def("Rebase", "Операция, которая берёт коммиты текущей ветки, которых нет в указанной основе, и воспроизводит их по очереди поверх этой основы. Ветка затем перемещается на последний воспроизведённый коммит.", "rebase"),
      def("Основа (base)", "Коммит, на котором «стоят» первые коммиты ветки. После rebase основа меняется — например, на свежую вершину `main`.", "base"),
      def("Линейная история", "История без коммитов слияния: каждый коммит имеет одного родителя. Rebase и fast-forward приводят к ней.", "linear history"),
      def("ORIG_HEAD", "Служебная ссылка, в которую Git сохраняет прежнее положение HEAD перед опасной операцией (`rebase`, `merge`, `reset`). Позволяет вернуться: `git reset --hard ORIG_HEAD`.", "ORIG_HEAD"),
      def("Идентификатор патча", "Хэш самого изменения без метаданных. По нему rebase распознаёт и пропускает коммиты, изменения которых уже есть на новой основе.", "patch-id"),
      def("Золотое правило rebase", "Не перебазируйте коммиты, которые уже опубликованы и могли быть получены другими: перебазирование создаёт новые коммиты, а старые у коллег остаются.", "golden rule of rebasing"),
    ]),

    section("why", [
      h("Две ветки, одна история"),
      p("Когда ветка расходится с основной, у вас два пути её объединить: слияние (сохраняет параллельность, добавляет коммит слияния) или rebase (переносит ваши коммиты поверх основной, получая прямую линию). Rebase полезен там, где важна читаемая линейная история и вы работаете над ветками, которых ещё нет у других."),
      ul(
        "**Линейная история.** `git log` читается сверху вниз, нет «лесенок» из параллельных линий и коммитов слияния.",
        "**Чистота запросов на слияние.** Ветка поверх свежего `main` сливается перемоткой; нет шума вроде `Merge branch 'main' into feature`.",
        "**Удобство поиска ошибок.** `git bisect` и `git blame` проще работают на линейной истории.",
        "**Подготовка истории.** Rebase (особенно интерактивный) позволяет привести коммиты в порядок до публикации (следующая тема).",
      ),
      warn("Платой за линейность становится перезапись: новые хэши, возможные повторные конфликты и риск, если перебазировать опубликованное. Поэтому у rebase есть правило применения, а не только команда."),
    ]),

    section("mental-model", [
      h("Что происходит с графом"),
      diagram(
        `
        до:                                        после git rebase main (на feature):

        c1 ◄── c2 ◄── c3 ◄── c4   ← main           c1 ◄── c2 ◄── c3 ◄── c4  ← main
                │                                                          \\
                └── f1 ◄── f2  ← feature                                    f1' ◄── f2'  ← feature

        f1, f2 остаются в базе (но на них никто не ссылается); f1', f2' — новые коммиты с тем же изменением
        `,
        "Rebase не «двигает» коммиты, а создаёт их копии на новой основе.",
      ),
      h("Алгоритм"),
      ul(
        "Определить коммиты вашей ветки, которых нет в основе (`main..feature`): f1, f2.",
        "Переключиться на новую основу (HEAD отрывается от ветки и встаёт на `main`).",
        "Применить каждый из коммитов по очереди (как `cherry-pick`): создаётся новый коммит с тем же сообщением и изменением.",
        "Переставить ветку на последний созданный коммит. Старая вершина сохраняется в `ORIG_HEAD` и в reflog.",
      ),
      h("Rebase и merge"),
      table(
        ["", "merge", "rebase"],
        [
          ["История", "Сохраняет параллельные линии, добавляет коммит слияния", "Линейная: ваши коммиты поверх основы"],
          ["Хэши коммитов", "Не меняются", "Меняются у переносимых коммитов"],
          ["Конфликты", "Один раз, в коммите слияния", "Возможны на каждом переносимом коммите"],
          ["Безопасность для опубликованного", "Безопасно", "Опасно: переписывает историю"],
          ["Что видно потом", "Когда и как ветки встречались", "Только итоговая линия"],
        ],
        "Сравнение способов интеграции",
      ),
      insight("Слияние отвечает на вопрос «что произошло», rebase — «как выглядела бы работа, если бы я начал её с актуальной основы». Для личной неопубликованной работы второй вариант часто лучше, для общей — первый."),
    ]),

    section("technical", [
      h("Команды"),
      table(
        ["Команда", "Действие"],
        [
          ["`git rebase main`", "Перенести коммиты текущей ветки поверх `main`"],
          ["`git rebase --onto новая старая ветка`", "Перенести коммиты `старая..ветка` на `новая`"],
          ["`git rebase --continue`", "Продолжить после разрешения конфликта (после `git add`)"],
          ["`git rebase --skip`", "Пропустить коммит, который не удаётся применить"],
          ["`git rebase --abort`", "Отменить rebase и вернуть ветку в прежнее состояние"],
          ["`git reset --hard ORIG_HEAD`", "Откатить уже завершённый rebase"],
          ["`git range-diff основа старая новая`", "Сравнить две версии серии коммитов (до и после)"],
        ],
        "Основные команды rebase",
      ),
      h("Конфликты при rebase"),
      p("Если очередной коммит не ложится на новую основу, rebase останавливается: `CONFLICT`, `could not apply <хэш>`. Файлы с маркерами разрешаются так же, как при слиянии, но с важной особенностью: **роли сторон меняются**. Пока Git воспроизводит ваш коммит, `HEAD` — это новая основа (то, что уже лежит на `main`), а «чужая» сторона после `=======` — ваш переносимый коммит (его хэш и сообщение видны в маркере `>>>>>>>`)."),
      p("После правки файла: `git add файл` и `git rebase --continue`. Если коммит оказался не нужен (изменение уже есть на основе), можно `git rebase --skip`. Чтобы вернуться к исходному состоянию — `git rebase --abort`."),
      p("Rebase пропускает коммиты, чьё изменение уже есть на основе: по идентификатору патча он распознаёт, что такой коммит уже «влит» (например, ваш `cherry-pick` или принятые в `main` исправления). Поэтому повторное применение не создаёт дублей."),
      h("Правило применения"),
      p("Перебазируйте только то, что ещё не покинуло ваш репозиторий, или то, что принадлежит только вам и о чём вы договорились (личная ветка запроса на слияние). После перебазирования опубликованной личной ветки — `git push --force-with-lease`."),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git rebase main
git rebase --continue
git rebase --skip
git rebase --abort
git rebase --onto main feature-a feature-b
git reset --hard ORIG_HEAD
git range-diff main ORIG_HEAD HEAD
git push --force-with-lease`,
        [
          { line: 1, text: "Перебазировать текущую ветку на `main`." },
          { line: [2, 4], text: "Управление остановленным rebase: продолжить после правки, пропустить коммит, отменить всё." },
          { line: 5, text: "Перенести коммиты ветки `feature-b`, которых нет в `feature-a`, на `main`." },
          { line: 6, text: "Откатить завершённый rebase к прежней вершине ветки." },
          { line: 7, text: "Сравнить, что изменилось в серии коммитов после rebase." },
          { line: 8, text: "Безопасно опубликовать перебазированную личную ветку." },
        ],
        "команды перебазирования",
      ),
    ]),

    section("minimal-example", [
      h("Перенести ветку на актуальный main"),
      p("`main` ушла вперёд на два коммита, а в `feature` два своих. Перебазируем `feature` и затем вливаем перемоткой:"),
      code("text", `$ git log --oneline --graph --all --decorate
* 0f434ca (HEAD -> main) Ещё правка в main
* 9bba773 Правка в main
| * d1f0841 (feature) Фича: шаг 2
| * 5fafe95 Фича: шаг 1
|/  
* 46f3748 Основа
$ git switch feature
Switched to branch 'feature'
$ git rebase main
Successfully rebased and updated refs/heads/feature.
$ git log --oneline --graph --all --decorate
* e744456 (HEAD -> feature) Фича: шаг 2
* 9f76ef3 Фича: шаг 1
* 0f434ca (main) Ещё правка в main
* 9bba773 Правка в main
* 46f3748 Основа
$ git switch main
Switched to branch 'main'
$ git merge --ff-only feature
Updating 0f434ca..e744456
Fast-forward
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --decorate
* e744456 (HEAD -> main, feature) Фича: шаг 2
* 9f76ef3 Фича: шаг 1
* 0f434ca Ещё правка в main
* 9bba773 Правка в main
* 46f3748 Основа`, { filename: "сеанс: rebase и fast-forward" }),
      ul(
        "До rebase история разветвлена: `feature` отходит от «Основа» (`46f3748`), а `main` ушла на два коммита вперёд.",
        "После `git rebase main` коммиты ветки стоят **над** `main`: «Фича: шаг 1» — `9f76ef3`, «шаг 2» — `e744456`. Хэши изменились, потому что у коммитов новый родитель.",
        "`git merge --ff-only feature` на `main` — чистая перемотка: `0f434ca..e744456`, без коммита слияния.",
        "В итоге `git log --graph` — одна прямая линия.",
      ),
    ]),

    section("detailed-example", [
      h("Конфликт во время rebase"),
      p("В `feature` поменяли порт на 9090, а в `main` — на 8080. Rebase остановится на коммите с портом:"),
      code("text", `$ git rebase main
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
error: could not apply e2e924c... Фича: порт 9090
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
Could not apply e2e924c... Фича: порт 9090
$ git status
interactive rebase in progress; onto 93c6d17
Last commands done (3 commands done):
   pick d1f0841 Фича: шаг 2
   pick e2e924c Фича: порт 9090
  (see more in file .git/rebase-merge/done)
No commands remaining.
You are currently rebasing branch 'feature' on '93c6d17'.
  (fix conflicts and then run "git rebase --continue")
  (use "git rebase --skip" to skip this patch)
  (use "git rebase --abort" to check out the original branch)

Unmerged paths:
  (use "git restore --staged <file>..." to unstage)
  (use "git add <file>..." to mark resolution)
	both modified:   config.txt

no changes added to commit (use "git add" and/or "git commit -a")
$ cat config.txt
host=localhost
<<<<<<< HEAD
port=8080
=======
port=9090
>>>>>>> e2e924c (Фича: порт 9090)
debug=false
# решаем: оставляем порт 8080
$ cat config.txt
host=localhost
port=8080
debug=false
$ git add config.txt
$ git rebase --continue
Successfully rebased and updated refs/heads/feature.
$ git log --oneline --graph --decorate
* 1059951 (HEAD -> feature) Фича: шаг 2
* d2004d7 Фича: шаг 1
* 93c6d17 (main) Main: порт 8080
* 0f434ca Ещё правка в main
* 9bba773 Правка в main
* 46f3748 Основа`, { filename: "сеанс: конфликт при rebase" }),
      ul(
        "`CONFLICT (content)` и `could not apply e2e924c... Фича: порт 9090` — Git остановился на третьем коммите; подсказки перечисляют `--continue`, `--skip`, `--abort`.",
        "`git status` пишет `interactive rebase in progress; onto 93c6d17` — так называется состояние для любого rebase: он выполняется тем же механизмом, что и интерактивный. Видно, какие команды выполнены и какие остались.",
        "В файле: после `<<<<<<< HEAD` — `port=8080` (это основа, уже лежащая на `main`), после `=======` — `port=9090` с меткой `>>>>>>> e2e924c (Фича: порт 9090)` — ваш воспроизводимый коммит. «Наша» и «чужая» стороны здесь поменялись местами по сравнению со слиянием.",
        "После правки файла `git add` и `git rebase --continue` дали `Successfully rebased and updated refs/heads/feature`: все три коммита лежат над `main`, у них новые хэши.",
      ),
      h("Отказаться"),
      code("text", `$ git rebase main
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
error: could not apply e2e924c... Фича: порт 9090
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
Could not apply e2e924c... Фича: порт 9090
$ git rebase --abort
$ git status -sb
## feature
$ git log --oneline --graph --all --decorate
* 93c6d17 (main) Main: порт 8080
* 0f434ca Ещё правка в main
* 9bba773 Правка в main
| * e2e924c (HEAD -> feature) Фича: порт 9090
| * d1f0841 Фича: шаг 2
| * 5fafe95 Фича: шаг 1
|/  
* 46f3748 Основа`, { filename: "сеанс: rebase --abort" }),
      p("`git rebase --abort` вернул `feature` в прежнее состояние: три исходных коммита на старой основе (`46f3748`), `main` не тронута. Отмена безопасна на любом шаге."),
    ]),

    section("analysis", [
      h("Перенос части ветки: --onto"),
      code("text", `$ git log --oneline --graph --all --decorate
* 3826a93 (HEAD -> main) Main: правка
| * 3eddad8 (feature-b) B: шаг 2
| * 86616c5 B: шаг 1
| * 30edbd6 (feature-a) A: шаг 2
| * 4d52b6b A: шаг 1
|/  
* 5635365 Основа
# ветка feature-b выросла из feature-a, но feature-a не нужна: переносим только коммиты B на main
$ git rebase --onto main feature-a feature-b
Successfully rebased and updated refs/heads/feature-b.
$ git log --oneline --graph --all --decorate
* 41d9fa6 (HEAD -> feature-b) B: шаг 2
* 3f5cfa0 B: шаг 1
* 3826a93 (main) Main: правка
| * 30edbd6 (feature-a) A: шаг 2
| * 4d52b6b A: шаг 1
|/  
* 5635365 Основа`, { filename: "сеанс: rebase --onto" }),
      table(
        ["Аргумент", "Роль в `git rebase --onto main feature-a feature-b`"],
        [
          ["`main`", "Новая основа: сюда переносим"],
          ["`feature-a`", "Старая основа: коммиты, доступные из неё, переносить не нужно"],
          ["`feature-b`", "Ветка, чьи коммиты `feature-a..feature-b` переносятся"],
        ],
        "Три аргумента `--onto`",
      ),
      p("Результат: два коммита `B` (`86616c5`, `3eddad8`) воспроизведены над `main` как `3f5cfa0`, `41d9fa6`, а ветка `feature-a` осталась на месте со своими коммитами `A`. Типичный случай: ветка `feature-b` выросла из `feature-a`, которую решили не вливать или влили иначе."),
    ]),

    section("internals", [
      h("Откат и сравнение"),
      code("text", `$ git rebase main
Successfully rebased and updated refs/heads/feature.
$ git reflog -6
c1eda7c HEAD@{0}: rebase (finish): returning to refs/heads/feature
c1eda7c HEAD@{1}: rebase (pick): Фича: шаг 2
0c43bf1 HEAD@{2}: rebase (pick): Фича: шаг 1
0f434ca HEAD@{3}: rebase (start): checkout main
d1f0841 HEAD@{4}: checkout: moving from main to feature
0f434ca HEAD@{5}: commit: Ещё правка в main
$ git reset --hard ORIG_HEAD
HEAD is now at d1f0841 Фича: шаг 2
$ git log --oneline --graph --all --decorate
* 0f434ca (main) Ещё правка в main
* 9bba773 Правка в main
| * d1f0841 (HEAD -> feature) Фича: шаг 2
| * 5fafe95 Фича: шаг 1
|/  
* 46f3748 Основа`, { filename: "сеанс: reflog и ORIG_HEAD" }),
      ul(
        "`git reflog` хранит ход rebase: `rebase (start)`, по записи `rebase (pick)` на каждый коммит, `rebase (finish)`.",
        "Пока rebase идёт, HEAD оторван; `ORIG_HEAD` хранит прежнюю вершину ветки (`d1f0841`).",
        "`git reset --hard ORIG_HEAD` вернул `feature` на старые коммиты: старые хэши снова на месте. Это обычный путь отмены уже завершённого rebase.",
      ),
      code("text", `$ git range-diff main ORIG_HEAD HEAD
1:  5fafe95 = 1:  0c43bf1 Фича: шаг 1
2:  d1f0841 = 2:  c1eda7c Фича: шаг 2`, { filename: "сеанс: range-diff" }),
      p("`git range-diff main ORIG_HEAD HEAD` сопоставляет коммиты «до» и «после»: знак `=` означает, что изменения одинаковы (сменились только хэши); знаки `!`, `<`, `>` показывают изменённые, пропавшие и добавленные коммиты. Полезно для ревью перебазированной ветки."),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git switch main
            git rebase feature      # «перебазирую main на feature»
          `,
          note: "Rebase переносит **текущую** ветку на указанную основу; здесь `main` оказалась бы поверх `feature` — перепутано направление.",
        },
        {
          title: "Верно",
          code: `
            git switch feature
            git rebase main         # feature поверх main
            git switch main
            git merge --ff-only feature
          `,
          note: "Перебазируем свою ветку на основу, затем вливаем перемоткой.",
        },
      ),
      ul(
        "**Перебазировать опубликованные общие ветки.** У коллег остаются старые коммиты; при обычном `pull` они получают дубли и коммит слияния (опыт ниже).",
        "**Путать направление.** `git rebase X` — «текущую ветку поверх X», а не наоборот.",
        "**Разрешать конфликты «наша/чужая» механически.** При rebase роли сторон обратные слиянию.",
        "**Терять ориентацию и паниковать.** `git rebase --abort` возвращает всё; `git reflog` и `ORIG_HEAD` — страховка после завершения.",
        "**Забывать `--force-with-lease`** после rebase опубликованной личной ветки (`push` будет отклонён как `non-fast-forward`).",
        "**Перебазировать «ради красоты» огромные ветки** с десятками конфликтов: цена выше выгоды; слияние проще.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Перебазирование `main`, `develop` и других общих веток:** ломает клоны коллег.",
        "**Привычка «rebase всегда и везде»:** без правил команды теряется история встреч веток, а опытные рецензенты не отличают свежие коммиты от старых.",
        "**Перебазирование без просмотра результата:** после rebase смотрите `git log --graph`, запускайте тесты, сравнивайте `range-diff`.",
        "**Rebase после того, как ветку уже влили в другую ветку:** получится дубль коммитов в двух местах.",
        "**Принудительная отправка через `--force`:** только `--force-with-lease`.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Правило:** перебазируйте только свои неопубликованные коммиты или личную ветку, о которой знает только автор.",
        "**Перед rebase** убедитесь, что рабочее дерево чистое, а текущая ветка — та, которую нужно переносить.",
        "**После rebase:** `git log --oneline --graph`, тесты, при необходимости `git range-diff main ORIG_HEAD HEAD`.",
        "**Публикуйте перебазированную личную ветку только `--force-with-lease`.**",
        "**Для получения чужих коммитов** в личной ветке используйте `git pull --rebase` (или `pull.rebase true`).",
        "**Если запутались — `git rebase --abort`,** а после завершения — `git reset --hard ORIG_HEAD`.",
        "**Включите `rerere`,** если часто перебазируете одну и ту же ветку с конфликтами.",
      ),
    ]),

    section("edge-cases", [
      h("Перебазировали опубликованную ветку"),
      p("Алиса опубликовала `feature` (два коммита), Боб скачал её и добавил свой коммит поверх. Затем Алиса перебазировала `feature` на обновлённый `main` и опубликовала принудительно. Что видит Боб:"),
      code("text", `# Алиса перебазирует уже опубликованную ветку и публикует её принудительно
$ git rebase main
Successfully rebased and updated refs/heads/feature.
$ git push --force-with-lease
To /srv/git/project.git
 + 6ec886d...2f468e7 feature -> feature (forced update)
# Боб, не зная об этом, получает ветку обычным pull
$ git pull --no-rebase --no-edit
From /srv/git/project
 + 6ec886d...2f468e7 feature    -> origin/feature  (forced update)
   5635365..2dab255  main       -> origin/main
Merge made by the 'ort' strategy.
 m.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 m.txt
$ git log --oneline --graph --decorate
*   7b587c0 (HEAD -> feature) Merge branch 'feature' of /srv/git/project into feature
|\\  
| * 2f468e7 (origin/feature) Фича: шаг 2
| * d117abf Фича: шаг 1
| * 2dab255 (origin/main, origin/HEAD) Правка в main
* | 27337ae Фича: шаг 3 (Боб)
* | 6ec886d Фича: шаг 2
* | dba51d9 Фича: шаг 1
|/  
* 5635365 (main) Основа
# откатываем и пробуем pull --rebase
$ git reset --hard ORIG_HEAD
HEAD is now at 27337ae Фича: шаг 3 (Боб)
$ git pull --rebase
Successfully rebased and updated refs/heads/feature.
$ git log --oneline --graph --decorate
* e69ecde (HEAD -> feature) Фича: шаг 3 (Боб)
* 2f468e7 (origin/feature) Фича: шаг 2
* d117abf Фича: шаг 1
* 2dab255 (origin/main, origin/HEAD) Правка в main
* 5635365 (main) Основа`, { filename: "сеанс: перебазирование опубликованной ветки" }),
      ul(
        "Обычный `git pull` у Боба создал коммит слияния и **дубли**: «Фича: шаг 1» и «Фича: шаг 2» присутствуют дважды — старые (`dba51d9`, `6ec886d`) и новые (`d117abf`, `2f468e7`).",
        "`git reset --hard ORIG_HEAD` и `git pull --rebase` дали чистый результат: коммит Боба переехал поверх новой версии ветки, дублей нет. Git распознал, что старые коммиты уже были в прежней версии ветки слежения.",
        "Однако это удача при простой истории; на практике разбираться пришлось бы с конфликтами и «двойниками». Поэтому перебазирование опубликованных веток требует согласования с теми, кто с ними работает.",
      ),
      h("Прочие нюансы"),
      ul(
        "**Коммиты слияния** при обычном rebase выпрямляются (теряются); для сохранения структуры есть `--rebase-merges`.",
        "**Rebase и коммиты, уже влитые в основу,** пропускаются по `patch-id`; при изменённых патчах возможны конфликты.",
        "**Rebase с незакоммиченными правками** Git не начнёт (нужно `git stash` или `--autostash`).",
        "**Подпись коммитов** (GPG) при rebase теряется: новые коммиты нужно подписывать заново.",
        "**Время коммитера** новое, автора — прежнее (`git log --format=%an %cn`).",
      ),
    ]),

    section("related", [
      ul(
        "[Слияние веток](/learn/git/merge) — альтернатива rebase и итоговая перемотка.",
        "[Конфликты слияния](/learn/git/merge-conflicts) — разрешение; `rerere` и `--abort`.",
        "[Совместная работа](/learn/git/remote-collaboration) — `pull --rebase` и `--force-with-lease`.",
        "[Интерактивный rebase](/learn/git/interactive-rebase) — `squash`, `fixup`, `reword`, перестановка коммитов.",
        "[Cherry-pick и stash](/learn/git/cherry-pick-stash) — перенос отдельных коммитов, на чём построен rebase.",
        "[Reset, revert и reflog](/learn/git/reset-revert-reflog) — откат и восстановление после rebase.",
        "[Стратегии ветвления](/learn/git/branching-strategies) — когда команды выбирают rebase.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Слияние main в ветку",
          code: `
            git switch feature
            git merge main
            # Merge branch 'main' into feature
          `,
          note: "Для тех, кто обновляет ветку так часто, в истории накапливаются бессмысленные коммиты слияния.",
        },
        {
          title: "Перебазирование ветки",
          code: `
            git switch feature
            git rebase main
            git push --force-with-lease
          `,
          note: "Ветка поверх свежего `main`, история линейна; нужна только `--force-with-lease` для личной опубликованной ветки.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.rebase.ex1",
      title: "Что станет с графом",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("`main` содержит два новых коммита с момента ответвления `feature`, а в `feature` два своих коммита. Вы выполняете `git switch feature` и `git rebase main`. Нарисуйте граф до и после. Изменятся ли хэши коммитов `feature` и коммитов `main`? Какой командой вы затем вольёте `feature` без коммита слияния?"),
      ],
      hints: [
        "Rebase создаёт копии коммитов `feature` на новой основе.",
        "Родитель у переносимых коммитов меняется — значит, меняется хэш.",
        "Влить без коммита можно перемоткой: `--ff-only`.",
      ],
      checks: ["Коммиты `feature` стоят над `main`", "Хэши коммитов `feature` изменились, у `main` — нет", "`git merge --ff-only feature` даёт линейную историю"],
      solution: [
        code("text", `$ git log --oneline --graph --all --decorate
* 0f434ca (HEAD -> main) Ещё правка в main
* 9bba773 Правка в main
| * d1f0841 (feature) Фича: шаг 2
| * 5fafe95 Фича: шаг 1
|/  
* 46f3748 Основа
$ git switch feature
Switched to branch 'feature'
$ git rebase main
Successfully rebased and updated refs/heads/feature.
$ git log --oneline --graph --all --decorate
* e744456 (HEAD -> feature) Фича: шаг 2
* 9f76ef3 Фича: шаг 1
* 0f434ca (main) Ещё правка в main
* 9bba773 Правка в main
* 46f3748 Основа
$ git switch main
Switched to branch 'main'
$ git merge --ff-only feature
Updating 0f434ca..e744456
Fast-forward
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --decorate
* e744456 (HEAD -> main, feature) Фича: шаг 2
* 9f76ef3 Фича: шаг 1
* 0f434ca Ещё правка в main
* 9bba773 Правка в main
* 46f3748 Основа`, { filename: "проверка в настоящем репозитории" }),
      ],
    }),
    exercise({
      id: "git.rebase.ex2",
      title: "Конфликт при rebase: решить и отменить",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("В `feature` поменяли порт на 9090, в `main` — на 8080; вы перебазируете `feature`. (1) Разрешите конфликт, оставив 8080, и завершите rebase. (2) Повторите ситуацию, но откажитесь: верните ветку в исходное состояние. Какие команды использовали?"),
      ],
      starter: {
        lang: "bash",
        code: `
          git switch feature
          git rebase main
          # конфликт: что дальше?
        `,
      },
      hints: [
        "После правки файла — `git add`, затем `git rebase --continue`.",
        "Для отказа есть `git rebase --abort`.",
        "В маркере `HEAD` — основа, а метка с хэшем — ваш коммит.",
      ],
      checks: ["Конфликт разрешён без маркеров", "`--continue` завершил rebase", "`--abort` вернул исходные три коммита", "Объяснено, чья сторона где в маркерах"],
      solution: [
        code("text", `$ git rebase main
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
error: could not apply e2e924c... Фича: порт 9090
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
Could not apply e2e924c... Фича: порт 9090
$ git status
interactive rebase in progress; onto 93c6d17
Last commands done (3 commands done):
   pick d1f0841 Фича: шаг 2
   pick e2e924c Фича: порт 9090
  (see more in file .git/rebase-merge/done)
No commands remaining.
You are currently rebasing branch 'feature' on '93c6d17'.
  (fix conflicts and then run "git rebase --continue")
  (use "git rebase --skip" to skip this patch)
  (use "git rebase --abort" to check out the original branch)

Unmerged paths:
  (use "git restore --staged <file>..." to unstage)
  (use "git add <file>..." to mark resolution)
	both modified:   config.txt

no changes added to commit (use "git add" and/or "git commit -a")
$ cat config.txt
host=localhost
<<<<<<< HEAD
port=8080
=======
port=9090
>>>>>>> e2e924c (Фича: порт 9090)
debug=false
# решаем: оставляем порт 8080
$ cat config.txt
host=localhost
port=8080
debug=false
$ git add config.txt
$ git rebase --continue
Successfully rebased and updated refs/heads/feature.
$ git log --oneline --graph --decorate
* 1059951 (HEAD -> feature) Фича: шаг 2
* d2004d7 Фича: шаг 1
* 93c6d17 (main) Main: порт 8080
* 0f434ca Ещё правка в main
* 9bba773 Правка в main
* 46f3748 Основа`, { filename: "решение (разрешить и продолжить)" }),
        code("text", `$ git rebase main
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
error: could not apply e2e924c... Фича: порт 9090
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
Could not apply e2e924c... Фича: порт 9090
$ git rebase --abort
$ git status -sb
## feature
$ git log --oneline --graph --all --decorate
* 93c6d17 (main) Main: порт 8080
* 0f434ca Ещё правка в main
* 9bba773 Правка в main
| * e2e924c (HEAD -> feature) Фича: порт 9090
| * d1f0841 Фича: шаг 2
| * 5fafe95 Фича: шаг 1
|/  
* 46f3748 Основа`, { filename: "решение (отказаться)" }),
      ],
    }),
    exercise({
      id: "git.rebase.ex3",
      title: "Перенести только свои коммиты",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Ветка `feature-b` выросла из `feature-a`: в ней сначала два коммита `A`, затем два коммита `B`. Ветка `feature-a` отклонена, а коммиты `B` нужны. Перенесите только коммиты `B` на `main`, не затрагивая `feature-a`."),
      ],
      hints: [
        "Обычный `rebase main` перенёс бы и коммиты `A`.",
        "У `--onto` три аргумента: новая основа, старая основа, ветка.",
        "Проверьте результат `git log --graph --all`.",
      ],
      checks: ["В `feature-b` над `main` только два коммита `B`", "`feature-a` не изменилась", "Использован `--onto`"],
      solution: [
        code("text", `$ git log --oneline --graph --all --decorate
* 3826a93 (HEAD -> main) Main: правка
| * 3eddad8 (feature-b) B: шаг 2
| * 86616c5 B: шаг 1
| * 30edbd6 (feature-a) A: шаг 2
| * 4d52b6b A: шаг 1
|/  
* 5635365 Основа
# ветка feature-b выросла из feature-a, но feature-a не нужна: переносим только коммиты B на main
$ git rebase --onto main feature-a feature-b
Successfully rebased and updated refs/heads/feature-b.
$ git log --oneline --graph --all --decorate
* 41d9fa6 (HEAD -> feature-b) B: шаг 2
* 3f5cfa0 B: шаг 1
* 3826a93 (main) Main: правка
| * 30edbd6 (feature-a) A: шаг 2
| * 4d52b6b A: шаг 1
|/  
* 5635365 Основа`, { filename: "решение" }),
      ],
    }),
  ],

  challenge: {
    id: "git.rebase.challenge",
    title: "Исправить последствия перебазирования опубликованной ветки",
    scenario: [
      p("Коллега перебазировал и принудительно опубликовал `feature`, а вы к этому моменту успели добавить в неё локальный коммит. После обычного `git pull` вы видите дубли коммитов и коммит слияния. Нужно вернуть чистую историю: ваш коммит поверх новой версии ветки, без дублей."),
    ],
    requirements: [
      "Откатить неудачный `pull` до состояния перед ним",
      "Получить чужие изменения перебазированием своего коммита",
      "Убедиться по графу, что дублей нет",
      "Сформулировать правило для команды",
    ],
    constraints: [
      "Не использовать `git push --force`",
      "Не терять собственный коммит",
    ],
    acceptance: [
      "`git reset --hard ORIG_HEAD` вернул ветку к вашему коммиту до `pull`",
      "После `git pull --rebase` граф линейный: ваш коммит над новой версией `feature`",
      "В истории нет дублей «Фича: шаг 1/2»",
    ],
    hints: [
      "После слияния Git оставляет прежнюю вершину в `ORIG_HEAD`.",
      "`git pull --rebase` использует историю ветки слежения, чтобы отличить старые коммиты.",
      "Посмотрите `git log --oneline --graph --decorate` до и после.",
    ],
    solution: [
      code("text", `# Алиса перебазирует уже опубликованную ветку и публикует её принудительно
$ git rebase main
Successfully rebased and updated refs/heads/feature.
$ git push --force-with-lease
To /srv/git/project.git
 + 6ec886d...2f468e7 feature -> feature (forced update)
# Боб, не зная об этом, получает ветку обычным pull
$ git pull --no-rebase --no-edit
From /srv/git/project
 + 6ec886d...2f468e7 feature    -> origin/feature  (forced update)
   5635365..2dab255  main       -> origin/main
Merge made by the 'ort' strategy.
 m.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 m.txt
$ git log --oneline --graph --decorate
*   7b587c0 (HEAD -> feature) Merge branch 'feature' of /srv/git/project into feature
|\\  
| * 2f468e7 (origin/feature) Фича: шаг 2
| * d117abf Фича: шаг 1
| * 2dab255 (origin/main, origin/HEAD) Правка в main
* | 27337ae Фича: шаг 3 (Боб)
* | 6ec886d Фича: шаг 2
* | dba51d9 Фича: шаг 1
|/  
* 5635365 (main) Основа
# откатываем и пробуем pull --rebase
$ git reset --hard ORIG_HEAD
HEAD is now at 27337ae Фича: шаг 3 (Боб)
$ git pull --rebase
Successfully rebased and updated refs/heads/feature.
$ git log --oneline --graph --decorate
* e69ecde (HEAD -> feature) Фича: шаг 3 (Боб)
* 2f468e7 (origin/feature) Фича: шаг 2
* d117abf Фича: шаг 1
* 2dab255 (origin/main, origin/HEAD) Правка в main
* 5635365 (main) Основа`, { filename: "решение" }),
      p("Правило для команды: перебазировать можно личные ветки, о перебазировании предупреждают и публикуют только `--force-with-lease`; получающие используют `git pull --rebase`."),
    ],
  },

  interview: [
    iq("git.rebase.i1", "basic", "Что делает `git rebase main` на ветке `feature`?", [
      ul(
        "Воспроизводит коммиты `feature`, которых нет в `main`, поверх вершины `main` и переставляет `feature` на результат.",
        "История становится линейной; хэши перенесённых коммитов меняются.",
        "Старые коммиты остаются в базе, пока их не очистит сборка мусора.",
      ),
    ]),
    iq("git.rebase.i2", "basic", "Чем rebase отличается от merge?", [
      ul(
        "`merge` сохраняет обе линии и создаёт коммит слияния; хэши не меняются.",
        "`rebase` переписывает ваши коммиты поверх основы: история линейна, хэши новые.",
        "Merge безопасен для опубликованного; rebase — только для неопубликованного.",
      ),
    ]),
    iq("git.rebase.i3", "intermediate", "Как действовать, если rebase остановился на конфликте?", [
      ul(
        "Разрешить конфликт в файле (убрать маркеры), `git add файл`, `git rebase --continue`.",
        "Если коммит не нужен — `git rebase --skip`; чтобы всё отменить — `git rebase --abort`.",
        "Помнить: в маркерах `HEAD` — основа, а метка с хэшем — переносимый коммит.",
      ),
    ]),
    iq("git.rebase.i4", "intermediate", "Почему «золотое правило» запрещает перебазировать опубликованные коммиты?", [
      ul(
        "Rebase создаёт новые коммиты с новыми хэшами; у тех, кто уже скачал старые, история разойдётся с новой.",
        "При слиянии получатели получают дубли и конфликты (в опыте — «Фича: шаг 1» и «шаг 2» по два раза).",
        "Если без этого не обойтись — договориться, использовать `--force-with-lease`, сообщить коллегам (`pull --rebase`).",
      ),
    ]),
    iq("git.rebase.i5", "intermediate", "Для чего нужен `--onto`?", [
      ul(
        "Переносит часть ветки: `git rebase --onto новая старая ветка` воспроизводит коммиты `старая..ветка` поверх `новая`.",
        "Типичный случай: ветка выросла из другой ветки, которую не вливают или влили иначе.",
        "Проверка — `git log --graph --all` после операции.",
      ),
    ]),
    iq("git.rebase.i6", "advanced", "Как отменить завершённый rebase?", [
      ul(
        "`git reset --hard ORIG_HEAD` — возвращает ветку на вершину до rebase.",
        "Если `ORIG_HEAD` перезаписана — `git reflog`, найти запись до `rebase (start)` и `git reset --hard HEAD@{n}`.",
        "Проверить итог: `git log --graph`, `git range-diff`.",
      ),
    ]),
    iq("git.rebase.i7", "engineering", "Когда в команде стоит использовать rebase, а когда merge?", [
      ul(
        "Rebase — для личных неопубликованных веток и подготовки истории перед запросом на слияние; для получения чужих изменений в личную ветку (`pull --rebase`).",
        "Merge — для интеграции общих веток и сохранения факта параллельной работы; запрос на слияние можно принимать `--no-ff` или squash.",
        "Критерии: читаемость и линейность против безопасности и истории встреч; единое правило команды важнее личных предпочтений.",
      ),
    ]),
    iq("git.rebase.i8", "debugging", "После `git rebase` ветка «потеряла» коммиты. Что делать?", [
      ul(
        "Не паниковать: старые коммиты есть в reflog.",
        "`git reflog` → найти вершину до `rebase (start)` → `git reset --hard HEAD@{n}` (или `ORIG_HEAD`).",
        "Выяснить причину: часто коммит пропущен как уже применённый (patch-id) или был выбран `--skip`.",
        "Сравнить `git range-diff`.",
      ),
    ]),
  ],

  exam: [
    mcq("git.rebase.e1", "foundation", "Что происходит с хэшами коммитов при rebase?", ["Не меняются", "Меняются у коммитов `main`", "Меняются у переносимых коммитов", "Становятся нулевыми"], 2, "Rebase создаёт копии переносимых коммитов с новым родителем, а значит, с новыми хэшами. Коммиты основы не затрагиваются."),
    mcq("git.rebase.e2", "foundation", "Как отменить rebase, остановившийся на конфликте?", ["`git rebase --abort`", "`git reset --soft`", "`git merge --abort`", "`git clean -fd`"], 0, "`--abort` возвращает ветку в состояние до начала rebase."),
    mcq("git.rebase.e3", "foundation", "Какое правило важно соблюдать при rebase?", ["Перебазировать только опубликованные ветки", "Перебазировать `main` на каждую ветку", "Всегда использовать `--force`", "Не перебазировать коммиты, уже полученные другими"], 3, "Rebase переписывает историю. У тех, кто уже получил старые коммиты, она разойдётся с новой."),
    mcq("git.rebase.e4", "intermediate", "Что делает `git rebase --onto main feature-a feature-b`?", ["Переносит всю `feature-a` на `main`", "Переносит коммиты `feature-a..feature-b` на `main`", "Сливает `feature-b` в `feature-a`", "Удаляет `feature-a`"], 1, "Три аргумента: новая основа `main`, старая основа `feature-a` (коммиты до неё не переносятся), переносимая ветка `feature-b`."),
    mcq("git.rebase.e5", "intermediate", "Во время rebase в маркерах конфликта после `<<<<<<< HEAD` находится…", ["Ваш переносимый коммит", "Результат слияния", "Общий предок", "Основа, на которую переносят (например, `main`)"], 3, "При rebase роли обратные слиянию: `HEAD` — новая основа, а ваш коммит указан после `=======` с хэшем и сообщением."),
    mcq("git.rebase.e6", "intermediate", "Что сделает `git reset --hard ORIG_HEAD` после завершённого rebase?", ["Удалит ветку", "Сделает новый rebase", "Вернёт ветку на вершину до rebase", "Ничего"], 2, "Перед rebase Git сохраняет прежнюю вершину в `ORIG_HEAD`. Жёсткий сброс на неё отменяет операцию."),
    mcq("git.rebase.e7", "advanced", "Какие утверждения верны? Выберите все.", ["Rebase пропускает коммиты, изменения которых уже есть на основе", "Rebase можно безопасно применять к общим веткам", "После rebase опубликованной личной ветки нужен `--force-with-lease`", "Rebase создаёт копии коммитов с новыми хэшами"], [0, 2, 3], "Перебазированная ветка не является потомком старой, поэтому обычный `push` отклонится. Опасность — для общих веток, где копии коммитов у других."),
    open("git.rebase.e8", "intermediate", "Сравните merge и rebase и назовите критерии выбора.", [
      ul(
        "Merge сохраняет параллельные линии и хэши; rebase создаёт линейную историю с новыми хэшами.",
        "Критерии: опубликованность коммитов, читаемость истории, количество конфликтов, договорённость команды, удобство `bisect` и откатов.",
        "Практика: личные ветки — rebase перед слиянием; общие — merge (или squash).",
      ),
    ], ["Описаны оба способа", "Названы критерии", "Упомянута опубликованность", "Приведена практика"]),
  ],

  mastery: [
    mcq("git.rebase.m1", "intermediate", "Что означает `=` в выводе `git range-diff` для пары коммитов?", ["Коммиты удалены", "Изменения одинаковы, различаются только хэши и основа", "Конфликт", "Коммиты слиты"], 1, "`=` — патчи совпадают. Знак `!` показывает изменённый коммит, `<` и `>` — пропавший или добавленный."),
    mcq("git.rebase.m2", "advanced", "Боб получил перебазированную Алисой ветку обычным `git pull`. Что он, вероятно, увидит?", ["Дубли старых и новых коммитов и коммит слияния", "Ничего нового", "Ошибку «ветка удалена»", "Автоматический откат"], 0, "Старые коммиты есть у Боба, новые — на сервере; слияние объединяет обе версии. Спасает `pull --rebase` или договорённость не перебазировать общее."),
    mcq("git.rebase.m3", "advanced", "Почему `git status` во время обычного rebase пишет `interactive rebase in progress`?", ["Потому что вы запустили `-i`", "Это ошибка", "Современный rebase использует тот же механизм, что и интерактивный", "Потому что идёт слияние"], 2, "Rebase выполняется последовательностью команд `pick`; состояние хранится в `.git/rebase-merge/`, поэтому статус так называется для любого rebase."),
    open("git.rebase.m4", "advanced", "Вы обновляете личную ветку запроса на слияние перед ревью. Опишите безопасную последовательность: что проверяете, какие команды используете и как защищаетесь от потери чужих коммитов.", [
      ul(
        "Проверка: ветка личная и никто на неё не опирается; рабочее дерево чистое; `git fetch`.",
        "Команды: `git rebase origin/main`, разрешение конфликтов (`--continue`), тесты, `git range-diff origin/main ORIG_HEAD HEAD` для проверки, затем `git push --force-with-lease`.",
        "Защита: `--force-with-lease`, просмотр `HEAD..origin/ветка` после `fetch`, при ошибке — `git reset --hard ORIG_HEAD`.",
      ),
    ], ["Проверка условий", "Использован `rebase origin/main`", "Использована `--force-with-lease`", "Названа возможность отката"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.rebase.f1", front: "Что делает rebase?", back: "Воспроизводит коммиты текущей ветки поверх другой основы; хэши меняются, история линейна." },
    { id: "git.rebase.f2", front: "Золотое правило?", back: "Не перебазировать коммиты, уже полученные другими." },
    { id: "git.rebase.f3", front: "Конфликт при rebase?", back: "Править файл → git add → git rebase --continue. Или --skip / --abort." },
    { id: "git.rebase.f4", front: "Маркеры при rebase?", back: "HEAD — основа (куда переносят); после ======= — ваш переносимый коммит. Роли обратны слиянию." },
    { id: "git.rebase.f5", front: "--onto?", back: "git rebase --onto новая старая ветка: перенести коммиты старая..ветка на новую основу." },
    { id: "git.rebase.f6", front: "Отменить завершённый rebase?", back: "git reset --hard ORIG_HEAD (или найти вершину в git reflog)." },
    { id: "git.rebase.f7", front: "После rebase опубликованной личной ветки?", back: "git push --force-with-lease." },
    { id: "git.rebase.f8", front: "range-diff?", back: "Сравнивает серию коммитов до и после rebase: = одинаковые, ! изменённые." },
  ],

  sources: [
    { title: "Pro Git: Rebasing", url: "https://git-scm.com/book/en/v2/Git-Branching-Rebasing", publisher: "Git" },
    { title: "Git documentation: git-rebase", url: "https://git-scm.com/docs/git-rebase", publisher: "Git" },
    { title: "Git documentation: git-range-diff", url: "https://git-scm.com/docs/git-range-diff", publisher: "Git" },
    { title: "Pro Git: Rewriting History", url: "https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History", publisher: "Git" },
    { title: "Git documentation: git-reflog", url: "https://git-scm.com/docs/git-reflog", publisher: "Git" },
    { title: "Git documentation: gitrevisions (ORIG_HEAD)", url: "https://git-scm.com/docs/gitrevisions", publisher: "Git" },
  ],
};
