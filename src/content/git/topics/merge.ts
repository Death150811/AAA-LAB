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

export const merge: Topic = {
  id: "git.merge",
  slug: "merge",
  domain: "git",
  module: "branching",
  title: "Слияние веток: fast-forward и merge commit",
  titleEn: "Merging Branches: Fast-Forward and Merge Commits",
  summary:
    "Слияние объединяет работу двух линий истории. Если одна ветка просто «впереди» другой, Git лишь переставляет указатель (fast-forward); если истории разошлись, он находит общего предка, объединяет изменения и создаёт коммит с двумя родителями. Тема на опытах показывает оба случая, ключи `--no-ff`, `--ff-only`, `--squash`, `--no-commit`, `--abort`, поиск общего предка и то, как форма слияния отражается в истории.",
  minutes: 75,
  prerequisites: ["git.branches-head", "git.commits-history"],
  tags: ["git merge", "fast-forward", "merge commit", "three-way merge", "merge-base", "--no-ff", "--ff-only", "--squash", "--abort", "first-parent", "ort strategy"],
  keyConcepts: [
    { term: "Fast-forward: просто сдвиг указателя", text: "Если текущая ветка — предок вливаемой, Git не создаёт коммит: `Updating 1038734..b27926c`, `Fast-forward`. После слияния обе ветки указывают на один коммит." },
    { term: "Трёхстороннее слияние использует общего предка", text: "При расхождении Git находит `merge-base` (`1038734`), сравнивает его с обеими вершинами и создаёт коммит с двумя родителями (`parent 188b4ea`, `parent b27926c`)." },
    { term: "Правки в разных местах одного файла сливаются автоматически", text: "Одна ветка поправила строку 2, другая — строку 7: Git написал `Auto-merging doc.txt`, и в результате есть обе правки без участия человека." },
    { term: "`--no-ff` сохраняет «пузырь» ветки", text: "Даже когда возможна перемотка, `--no-ff` создаёт коммит слияния: в графе видно, где ветка начиналась и когда влита." },
    { term: "`--squash` сливает содержимое, но не историю", text: "После `git merge --squash feature` и коммита в `main` один коммит `Фича целиком`; ветка `feature` не считается слитой — `git branch -d feature` отказался: `not fully merged`." },
  ],
  sections: [
    section("definition", [
      def("Слияние", "Операция, объединяющая изменения другой ветки с текущей. Выполняется командой `git merge <ветка>` в той ветке, **в которую** вливают.", "merge"),
      def("Fast-forward", "Слияние, при котором текущая ветка просто перемещается вперёд до вершины вливаемой: новых коммитов не создаётся. Возможно, только если текущий коммит — предок вливаемого.", "fast-forward"),
      def("Коммит слияния", "Коммит с двумя (или более) родителями: первый — прежняя вершина текущей ветки, второй — вершина вливаемой.", "merge commit"),
      def("Общий предок", "Ближайший коммит, достижимый из обеих вершин (`git merge-base`). Относительно него определяется, кто что изменил.", "merge base"),
      def("Трёхстороннее слияние", "Алгоритм объединения, использующий три версии: общего предка, «нашу» и «чужую». Изменение, сделанное только с одной стороны, принимается; конфликт — когда обе стороны изменили одно место по-разному.", "three-way merge"),
      def("Squash-слияние", "Слияние `--squash`: изменения вливаемой ветки попадают в индекс как одно целое, а коммит слияния не создаётся — вы сами делаете обычный коммит с одним родителем.", "squash merge"),
    ]),

    section("why", [
      h("Параллельная работа возвращается в одну линию"),
      p("Ветки нужны, чтобы работать параллельно; слияние — чтобы эту работу собрать. Для команды это основной способ интеграции: исправление ошибки и новая функция, сделанные независимо, объединяются в основную линию."),
      ul(
        "**Автоматическая интеграция.** Git сам объединяет правки в разных частях файлов и разные файлы; человека зовут только при реальном пересечении.",
        "**Сохранение истории.** Коммит слияния фиксирует, что две линии встретились, и из него видны оба родителя.",
        "**Выбор формы истории.** Fast-forward даёт линейную историю, `--no-ff` — явные границы веток, `--squash` — по одному коммиту на задачу. Эти решения влияют на то, как читается проект через год.",
        "**Основа командного процесса:** слияние — финальный шаг запроса на слияние (pull request).",
      ),
      tip("Перед слиянием спросите: «что войдёт?» — `git log main..feature` и `git diff main...feature --stat`. Это дешевле, чем разбирать последствия."),
    ]),

    section("mental-model", [
      h("Два случая слияния"),
      diagram(
        `
        1) Fast-forward: main — предок feature

           до:   c1 ◄─ c2 ◄─ c3 ◄─ c4  ← feature
                        │
                       main ◄─ HEAD

           после git merge feature:
                 c1 ◄─ c2 ◄─ c3 ◄─ c4  ← main, feature, HEAD         (новых коммитов нет)

        2) Расхождение: нужен коммит слияния

           до:   c1 ◄─ c2 ◄─ c5  ← main ◄─ HEAD
                        └── c3 ◄─ c4  ← feature

           после git merge feature:
                 c1 ◄─ c2 ◄─ c5 ◄──────── M ← main ◄─ HEAD
                        └── c3 ◄─ c4 ◄────┘                   (M имеет двух родителей)
        `,
        "Если основная линия ушла вперёд, перемотка невозможна и Git создаёт коммит M.",
      ),
      h("Три версии файла"),
      p("При расхождении Git берёт три версии: **базу** (общий предок c2), **нашу** (вершина `main`, c5) и **чужую** (вершина `feature`, c4). Для каждого участка файла: если изменила только одна сторона — принимается её версия; если обе изменили одинаково — принимается общее; если по-разному — конфликт."),
      insight("Слияние не «сравнивает две ветки»: оно сравнивает каждую с общим предком. Именно поэтому правка, сделанная только в одной ветке, не может «откатиться» из-за другой."),
    ]),

    section("technical", [
      h("Как выполнить слияние"),
      p("Слияние выполняют из ветки, **в которую** вливают: `git switch main` и `git merge feature`. Результат записывается в текущую ветку; вливаемая остаётся без изменений."),
      table(
        ["Ключ", "Поведение"],
        [
          ["(по умолчанию)", "Fast-forward, если возможно; иначе — коммит слияния"],
          ["`--no-ff`", "Всегда создавать коммит слияния, даже если возможна перемотка"],
          ["`--ff-only`", "Только перемотка; если невозможна — отказ (`Not possible to fast-forward`)"],
          ["`--squash`", "Принести изменения в индекс одним куском, без коммита слияния"],
          ["`--no-commit`", "Выполнить слияние, но остановиться до коммита — можно проверить результат"],
          ["`--abort`", "Прервать слияние, находящееся в процессе, и вернуть состояние до него"],
          ["`-m \"сообщение\"`", "Сообщение коммита слияния (по умолчанию `Merge branch 'имя'`)"],
        ],
        "Основные ключи git merge",
      ),
      h("Общий предок и разности"),
      ul(
        "`git merge-base main feature` — общий предок двух вершин.",
        "`git log main..feature` — коммиты, которые войдут в `main`.",
        "`git diff main...feature` (три точки) — изменения `feature` относительно общего предка, то есть ровно то, что принесёт слияние.",
        "`git log --merges`, `--no-merges`, `--first-parent` — выбрать только коммиты слияния, исключить их или идти по основной линии.",
      ),
      h("Стратегия слияния"),
      p("По умолчанию используется стратегия `ort` (Git 2.34+; раньше — `recursive`): сообщение `Merge made by the 'ort' strategy.` в выводе — это она. Для обычной работы выбирать стратегию не нужно."),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git switch main
git merge feature
git merge --no-ff feature -m "Влить фичу"
git merge --ff-only feature
git merge --squash feature
git merge --no-commit --no-ff feature
git merge --abort
git merge-base main feature`,
        [
          { line: 1, text: "Встать на ветку, в которую будем вливать." },
          { line: 2, text: "Влить `feature`: перемотка или коммит слияния — как позволит история." },
          { line: 3, text: "Всегда создавать коммит слияния и задать сообщение." },
          { line: 4, text: "Разрешить только перемотку; иначе отказ." },
          { line: 5, text: "Принести изменения одним куском в индекс (без коммита слияния)." },
          { line: 6, text: "Слить, но не коммитить: осмотреть результат (`git status`, `git diff --staged`)." },
          { line: 7, text: "Отменить слияние в процессе." },
          { line: 8, text: "Найти общего предка двух ветвей." },
        ],
        "команды слияния",
      ),
    ]),

    section("minimal-example", [
      h("Fast-forward"),
      p("Репозиторий с коммитами «Основа документа» и «Заметка в main»; ветка `feature` отходит от второго и получает два коммита. `main` с тех пор не менялась:"),
      code("text", `$ git log --oneline --graph --all --decorate
* b27926c (feature) Фича: шаг 2
* 2426902 Фича: шаг 1
* 1038734 (HEAD -> main) Заметка в main
* 0f20262 Основа документа
$ git merge feature
Updating 1038734..b27926c
Fast-forward
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --all --decorate
* b27926c (HEAD -> main, feature) Фича: шаг 2
* 2426902 Фича: шаг 1
* 1038734 Заметка в main
* 0f20262 Основа документа`, { filename: "сеанс: fast-forward" }),
      ul(
        "`Updating 1038734..b27926c` и `Fast-forward`: Git перенёс `main` с `1038734` на `b27926c`.",
        "Новых коммитов не создано; граф линейный; `HEAD -> main, feature` — обе ветки на одном коммите.",
        "Слитую `feature` теперь можно удалить `git branch -d feature`.",
      ),
    ]),

    section("detailed-example", [
      h("Расхождение: коммит слияния"),
      p("Теперь `main` ушла вперёд («Правка в main»), пока в `feature` делалась работа:"),
      code("text", `$ git log --oneline --graph --all --decorate
* 188b4ea (HEAD -> main) Правка в main
| * b27926c (feature) Фича: шаг 2
| * 2426902 Фича: шаг 1
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа
$ git merge-base main feature
10387340c46025356597b6939243746e3b7fae2b
$ git merge feature -m "Влить фичу"
Merge made by the 'ort' strategy.
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --decorate
*   588ad86 (HEAD -> main) Влить фичу
|\\  
| * b27926c (feature) Фича: шаг 2
| * 2426902 Фича: шаг 1
* | 188b4ea Правка в main
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа
$ git cat-file -p HEAD
tree da505adf4bafcce5f64d89e33c184e233ca323fd
parent 188b4ea1b1f6b5baab783687d5c1f636a9ecd93d
parent b27926c8d9bc55abf0a4467e1746edde768e0d51
author Alice Dev <alice@example.com> 1736932440 +0000
committer Alice Dev <alice@example.com> 1736932440 +0000

Влить фичу
$ git log --oneline --merges
588ad86 Влить фичу
$ git log --oneline --first-parent
588ad86 Влить фичу
188b4ea Правка в main
1038734 Заметка в main
0f20262 Основа документа`, { filename: "сеанс: трёхстороннее слияние" }),
      ul(
        "`git merge-base main feature` вернул `1038734` — точку расхождения.",
        "Слияние создало коммит `588ad86` с двумя родителями (`parent 188b4ea`, `parent b27926c`): первый — прежний `main`, второй — вершина `feature`.",
        "`git log --merges` выводит только коммиты слияния; `--first-parent` идёт только по основной линии (без коммитов самой ветки).",
      ),
      h("Правки в разных местах одного файла"),
      code("text", `$ git merge feature -m "Влить feature"
Auto-merging doc.txt
Merge made by the 'ort' strategy.
 doc.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ cat doc.txt
строка 1
строка 2 (из feature)
строка 3
строка 4
строка 5
строка 6
строка 7 (из main)
строка 8
$ git log --oneline --graph --decorate
*   96dfd38 (HEAD -> main) Влить feature
|\\  
| * 4e5d736 (feature) Правка в начале файла (feature)
* | 3df3979 Правка в конце файла (main)
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа`, { filename: "сеанс: автоматическое слияние внутри файла" }),
      p("`Auto-merging doc.txt`: одна ветка изменила строку 2, другая — строку 7; Git принял обе правки без вопросов. Конфликт возникает, когда стороны меняют одни и те же строки (следующая тема)."),
    ]),

    section("analysis", [
      h("Выбор формы слияния"),
      code("text", `$ git merge --no-ff feature -m "Влить фичу"
Merge made by the 'ort' strategy.
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --decorate
*   38ec81b (HEAD -> main) Влить фичу
|\\  
| * b27926c (feature) Фича: шаг 2
| * 2426902 Фича: шаг 1
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа
# ещё одна ветка, но main уже ушла вперёд — перемотка невозможна
$ git merge --ff-only other
hint: Diverging branches can't be fast-forwarded, you need to either:
hint: 
hint: 	git merge --no-ff
hint: 
hint: or:
hint: 
hint: 	git rebase
hint: 
hint: Disable this message with "git config advice.diverging false"
fatal: Not possible to fast-forward, aborting.`, { filename: "сеанс: --no-ff и --ff-only" }),
      table(
        ["Подход", "Что получаем", "Когда выбирают"],
        [
          ["Fast-forward (по умолчанию, когда возможен)", "Линейная история, ветка «растворяется»", "Короткие ветки, нужна чистая линия"],
          ["`--no-ff`", "Коммит слияния даже при возможной перемотке: в графе виден «пузырь» ветки", "Нужно видеть границы задач и откатывать задачу целиком"],
          ["`--ff-only`", "Отказ, если перемотка невозможна", "Политика «никаких лишних коммитов слияния»; проверка перед публикацией"],
          ["`--squash`", "Один обычный коммит с суммой изменений", "Ветка с «шумной» историей; нужна одна запись на задачу"],
        ],
        "Как форма слияния влияет на историю",
      ),
      p("`--no-ff` сохранил группу коммитов `Фича: шаг 1…2` как отдельную линию в графе, а `--ff-only` в расходящейся истории отказал с подсказкой: нужно либо слияние `--no-ff`, либо `rebase` (отдельная тема)."),
    ]),

    section("internals", [
      h("Что внутри коммита слияния"),
      p("Коммит слияния ничем не отличается от обычного, кроме числа строк `parent`. В сеансе `git cat-file -p HEAD` показал дерево и двух родителей. Дерево — результат объединения трёх версий; родители фиксируют, что история обеих линий теперь достижима из нового коммита."),
      p("Именно поэтому после слияния `git log main..feature` пуст: все коммиты `feature` достижимы из `main`. И именно поэтому `git branch -d feature` после обычного слияния проходит без возражений: Git видит, что ветка слита."),
      h("Squash и достижимость"),
      code("text", `$ git merge --squash feature
Updating 1038734..b27926c
Fast-forward
Squash commit -- not updating HEAD
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git status -s
A  a.txt
A  b.txt
$ git commit -m "Фича целиком"
[main b47876b] Фича целиком
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --all --decorate
* b47876b (HEAD -> main) Фича целиком
| * b27926c (feature) Фича: шаг 2
| * 2426902 Фича: шаг 1
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа
$ git branch --merged
* main
$ git branch -d feature
error: the branch 'feature' is not fully merged.
If you are sure you want to delete it, run 'git branch -D feature'`, { filename: "сеанс: squash-слияние" }),
      ul(
        "`git merge --squash feature` не создал коммит: изменения лежат в индексе (`A  a.txt`, `A  b.txt`), HEAD не сдвинулся — Git так и написал: `Squash commit -- not updating HEAD`.",
        "Обычный `git commit` создал `b47876b` с **одним** родителем: связи с `feature` нет.",
        "В графе `feature` по-прежнему отходит отдельной линией; `git branch --merged` её не показал; `git branch -d feature` отказал: `not fully merged`.",
        "Вывод: после squash ветку удаляют принудительно (`-D`), помня, что её коммиты в основную линию не включены как история.",
      ),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git switch feature
            git merge main         # хотели «влить фичу в main»
          `,
          note: "Слияние записывается в **текущую** ветку: так `main` влился в `feature`, а в `main` ничего не изменилось.",
        },
        {
          title: "Верно",
          code: `
            git switch main
            git merge feature
          `,
          note: "Встаём на ту ветку, в которую вливаем.",
        },
      ),
      ul(
        "**Путать направление слияния.** `git merge X` вливает X в текущую ветку, а не наоборот.",
        "**Сливать вслепую.** Перед слиянием смотрите `git log main..feature` и `git diff main...feature --stat`.",
        "**Сливать с «грязным» рабочим деревом.** Git может отказаться или смешать ваши правки с чужими; сначала закоммитьте или спрячьте.",
        "**Использовать `--squash` и считать ветку слитой.** Git так не считает: `-d` откажет, а повторное слияние внесёт те же правки снова.",
        "**Бояться коммитов слияния.** Они нужны: показывают, где линии встретились. Проблема не в них, а в слиянии в обе стороны без причины.",
        "**Продолжать слияние, не разобравшись, что не так:** `git merge --abort` вернёт состояние до слияния.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**«Шум слияний»:** постоянное вливание `main` в рабочую ветку «чтобы быть свежим» плодит бессмысленные коммиты слияния; используйте `rebase` для своей неопубликованной ветки или делайте это осознанно.",
        "**Слияние неполной работы в `main`:** основная линия должна оставаться рабочей; проверяйте до слияния.",
        "**Огромные ветки** с сотнями коммитов, слияние которых превращается в события. Дробите задачи.",
        "**Правка коммита слияния «по месту»:** изменения прячутся в служебном коммите, и их не видно при обычном ревью. Исправления делайте отдельными коммитами.",
        "**Слияние «наугад» с `-X ours`/`-X theirs`** без понимания: молча выбрасывает чужие правки там, где обе стороны менялись.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Встаньте на целевую ветку и убедитесь, что она актуальна,** прежде чем вливать.",
        "**Просмотрите, что войдёт:** `git log main..feature`, `git diff main...feature --stat`.",
        "**Для осмотра результата используйте `--no-commit`,** а при сомнении — `git merge --abort`.",
        "**Договоритесь о форме истории в команде:** fast-forward, `--no-ff` или squash; не смешивайте без причины.",
        "**Пишите осмысленные сообщения слияния,** когда они нужны: `Влить фичу «вход по почте»` информативнее `Merge branch 'feature'`.",
        "**Удаляйте слитые ветки** (`git branch -d`).",
        "**Проверяйте результат до публикации:** запустите тесты после слияния.",
      ),
    ]),

    section("edge-cases", [
      h("Осмотреть результат до коммита"),
      code("text", `$ git log --oneline main..feature
2426902 Фича: шаг 1
$ git diff --stat main...feature
 a.txt | 1 +
 1 file changed, 1 insertion(+)
$ git merge --no-commit --no-ff feature
Automatic merge went well; stopped before committing as requested
$ git status
On branch main
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
	new file:   a.txt

$ git merge --abort
$ git status -s
$ git log --oneline --graph --all --decorate
* a6f8f4d (HEAD -> main) Правка в main
| * 2426902 (feature) Фича: шаг 1
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа`, { filename: "сеанс: --no-commit и --abort" }),
      ul(
        "`git log main..feature` и `git diff --stat main...feature` показали, что войдёт: один коммит и один файл.",
        "`--no-commit --no-ff` выполнил слияние и остановился: `git status` пишет `All conflicts fixed but you are still merging` — статус «слияние в процессе», изменения подготовлены.",
        "`git merge --abort` вернул состояние до слияния: статус чистый, история прежняя.",
      ),
      h("Прочие нюансы"),
      ul(
        "**Слияние уже слитой ветки** — `Already up to date.`: ничего не меняется.",
        "**Слияние нескольких веток сразу** (`git merge a b`) создаёт коммит с несколькими родителями («octopus»), но при конфликтах не поддерживается.",
        "**Сообщение слияния** открывает редактор; опция `-m` или `--no-edit` — без редактора.",
        "**`merge.ff`** в настройках меняет поведение по умолчанию (`false` — всегда `--no-ff`, `only` — всегда `--ff-only`).",
        "**Откат слияния** (`git revert -m 1 <слияние>`) требует указать основного родителя (тема про `revert`).",
      ),
    ]),

    section("related", [
      ul(
        "[Ветки и HEAD](/learn/git/branches-head) — на какую ветку вы встаёте перед слиянием.",
        "[Коммиты и история](/learn/git/commits-history) — `main..feature`, `--first-parent`, `^2`.",
        "[Конфликты слияния](/learn/git/merge-conflicts) — что делать, когда обе стороны правили одно место.",
        "[Rebase](/learn/git/rebase) — альтернатива слиянию для линейной истории.",
        "[Стратегии ветвления](/learn/git/branching-strategies) — как команды выбирают форму слияния.",
        "[Reset, revert и reflog](/learn/git/reset-revert-reflog) — откат слияния.",
        "[Совместная работа](/learn/git/remote-collaboration) — pull = fetch + merge.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Слияние вслепую",
          code: `
            git switch feature
            git merge main
            # «вроде влил»
          `,
          note: "Не ясно, что вошло и в какую ветку; `main` не изменилась.",
        },
        {
          title: "Осознанное слияние",
          code: `
            git switch main
            git log --oneline main..feature
            git diff --stat main...feature
            git merge --no-ff feature -m "Влить фичу"
          `,
          note: "Встали на целевую ветку, посмотрели состав, выбрали форму истории.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.merge.ex1",
      title: "Перемотка или коммит слияния",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Для каждой ситуации скажите, что сделает `git merge feature` на `main`: (а) `feature` содержит два новых коммита, а `main` с момента ответвления не менялась; (б) и в `main`, и в `feature` есть новые коммиты. Что получится в графе в каждом случае?"),
      ],
      hints: [
        "Перемотка возможна, если текущая вершина — предок вливаемой.",
        "При расхождении Git создаёт коммит с двумя родителями.",
        "Посмотрите `git log --graph --all` до слияния.",
      ],
      checks: ["(а) fast-forward, новых коммитов нет, граф линейный", "(б) коммит слияния с двумя родителями", "Названа роль общего предка", "Показан результат в графе"],
      solution: [
        code("text", `$ git log --oneline --graph --all --decorate
* b27926c (feature) Фича: шаг 2
* 2426902 Фича: шаг 1
* 1038734 (HEAD -> main) Заметка в main
* 0f20262 Основа документа
$ git merge feature
Updating 1038734..b27926c
Fast-forward
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --all --decorate
* b27926c (HEAD -> main, feature) Фича: шаг 2
* 2426902 Фича: шаг 1
* 1038734 Заметка в main
* 0f20262 Основа документа`, { filename: "случай (а)" }),
        code("text", `$ git log --oneline --graph --all --decorate
* 188b4ea (HEAD -> main) Правка в main
| * b27926c (feature) Фича: шаг 2
| * 2426902 Фича: шаг 1
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа
$ git merge-base main feature
10387340c46025356597b6939243746e3b7fae2b
$ git merge feature -m "Влить фичу"
Merge made by the 'ort' strategy.
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --decorate
*   588ad86 (HEAD -> main) Влить фичу
|\\  
| * b27926c (feature) Фича: шаг 2
| * 2426902 Фича: шаг 1
* | 188b4ea Правка в main
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа
$ git cat-file -p HEAD
tree da505adf4bafcce5f64d89e33c184e233ca323fd
parent 188b4ea1b1f6b5baab783687d5c1f636a9ecd93d
parent b27926c8d9bc55abf0a4467e1746edde768e0d51
author Alice Dev <alice@example.com> 1736932440 +0000
committer Alice Dev <alice@example.com> 1736932440 +0000

Влить фичу
$ git log --oneline --merges
588ad86 Влить фичу
$ git log --oneline --first-parent
588ad86 Влить фичу
188b4ea Правка в main
1038734 Заметка в main
0f20262 Основа документа`, { filename: "случай (б)" }),
      ],
    }),
    exercise({
      id: "git.merge.ex2",
      title: "Сохранить границы ветки",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Ветка `feature` может быть влита перемоткой, но команда хочет видеть в истории границы задачи: коммит слияния со своим сообщением «Влить фичу». Выполните слияние так, чтобы он был создан, и покажите графом. Затем проверьте, что `--ff-only` откажется сливать расходящуюся ветку."),
      ],
      hints: [
        "Ключ, запрещающий перемотку, — `--no-ff`.",
        "`-m` задаёт сообщение коммита слияния.",
        "У `--ff-only` в расходящейся истории будет ошибка и подсказка.",
      ],
      checks: ["Создан коммит слияния `Влить фичу` с двумя родителями", "Граф показывает «пузырь» ветки", "`--ff-only` для расходящейся ветки отказал: `Not possible to fast-forward`"],
      solution: [
        code("text", `$ git merge --no-ff feature -m "Влить фичу"
Merge made by the 'ort' strategy.
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --decorate
*   38ec81b (HEAD -> main) Влить фичу
|\\  
| * b27926c (feature) Фича: шаг 2
| * 2426902 Фича: шаг 1
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа
# ещё одна ветка, но main уже ушла вперёд — перемотка невозможна
$ git merge --ff-only other
hint: Diverging branches can't be fast-forwarded, you need to either:
hint: 
hint: 	git merge --no-ff
hint: 
hint: or:
hint: 
hint: 	git rebase
hint: 
hint: Disable this message with "git config advice.diverging false"
fatal: Not possible to fast-forward, aborting.`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.merge.ex3",
      title: "Ветка «не слита» после squash",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Вы влили `feature` командой `git merge --squash feature` и закоммитили результат. `git branch -d feature` отвечает `not fully merged`. Объясните, почему Git так считает, и что можно сделать. Почему повторное слияние `feature` в будущем опасно?"),
      ],
      hints: [
        "Сколько родителей у коммита после squash?",
        "Достижима ли вершина `feature` из `main`?",
        "Что произойдёт, если влить `feature` ещё раз?",
      ],
      checks: ["Объяснено: после squash нет связи между `main` и `feature`", "`--merged` ветку не показывает", "Удаление — `-D` после проверки, что содержимое влито", "Повторное слияние добавит те же изменения ещё раз и вызовет конфликты"],
      solution: [
        code("text", `$ git merge --squash feature
Updating 1038734..b27926c
Fast-forward
Squash commit -- not updating HEAD
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git status -s
A  a.txt
A  b.txt
$ git commit -m "Фича целиком"
[main b47876b] Фича целиком
 2 files changed, 2 insertions(+)
 create mode 100644 a.txt
 create mode 100644 b.txt
$ git log --oneline --graph --all --decorate
* b47876b (HEAD -> main) Фича целиком
| * b27926c (feature) Фича: шаг 2
| * 2426902 Фича: шаг 1
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа
$ git branch --merged
* main
$ git branch -d feature
error: the branch 'feature' is not fully merged.
If you are sure you want to delete it, run 'git branch -D feature'`, { filename: "решение" }),
        ul(
          "Коммит `Фича целиком` имеет одного родителя; вершина `feature` в `main` недостижима, поэтому Git считает ветку неслитой.",
          "Содержимое влито — убедитесь в этом (`git diff main feature` пуст) и удалите ветку `git branch -D feature`.",
          "Повторное слияние `feature` посчитает все её коммиты новыми и попытается внести правки заново (повторы и конфликты).",
        ),
      ],
    }),
  ],

  challenge: {
    id: "git.merge.challenge",
    title: "Безопасное слияние с проверкой",
    scenario: [
      p("Нужно влить `feature` в `main`, но основная линия ушла вперёд. Перед слиянием вы хотите убедиться, что именно войдёт, выполнить слияние без немедленного коммита, посмотреть результат и, если что-то не так, откатиться без последствий."),
    ],
    requirements: [
      "Показать, какие коммиты войдут (`main..feature`) и какие файлы изменятся (`main...feature`)",
      "Выполнить слияние без коммита",
      "Проверить статус в состоянии «слияние в процессе»",
      "Прервать слияние и убедиться, что история и рабочее дерево не изменились",
    ],
    constraints: [
      "Не использовать `reset --hard`",
      "Не менять ветку `feature`",
    ],
    acceptance: [
      "`git merge --no-commit --no-ff feature` останавливается до коммита",
      "`git status` сообщает, что слияние ещё не завершено",
      "После `git merge --abort` статус пуст, а граф остаётся прежним",
    ],
    hints: [
      "Для остановки до коммита есть ключ `--no-commit`.",
      "Прервать слияние можно только в процессе — командой `--abort`.",
      "Три точки в `git diff main...feature` дают изменения относительно общего предка.",
    ],
    solution: [
      code("text", `$ git log --oneline main..feature
2426902 Фича: шаг 1
$ git diff --stat main...feature
 a.txt | 1 +
 1 file changed, 1 insertion(+)
$ git merge --no-commit --no-ff feature
Automatic merge went well; stopped before committing as requested
$ git status
On branch main
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
	new file:   a.txt

$ git merge --abort
$ git status -s
$ git log --oneline --graph --all --decorate
* a6f8f4d (HEAD -> main) Правка в main
| * 2426902 (feature) Фича: шаг 1
|/  
* 1038734 Заметка в main
* 0f20262 Основа документа`, { filename: "решение" }),
      p("Схема безопасного слияния: посмотреть состав, выполнить `--no-commit`, оценить `git status` и `git diff --staged`, затем `git commit` или `git merge --abort`."),
    ],
  },

  interview: [
    iq("git.merge.i1", "basic", "Что делает `git merge feature`?", [
      ul(
        "Вливает изменения ветки `feature` в текущую ветку.",
        "Если текущая ветка — предок `feature`, происходит fast-forward; иначе создаётся коммит слияния с двумя родителями.",
        "Вливаемая ветка не изменяется.",
      ),
    ]),
    iq("git.merge.i2", "basic", "Что такое fast-forward?", [
      ul(
        "Слияние без нового коммита: указатель текущей ветки переставляется на вершину вливаемой.",
        "Возможно, если текущий коммит — предок вливаемого (истории не разошлись).",
        "Результат — линейная история.",
      ),
    ]),
    iq("git.merge.i3", "intermediate", "Как Git выполняет трёхстороннее слияние?", [
      ul(
        "Находит общего предка (`merge-base`) и сравнивает с ним каждую вершину.",
        "Изменение, сделанное только с одной стороны, принимается; одинаковое с обеих сторон — тоже; разные правки одного места — конфликт.",
        "Результат записывается в новый коммит с двумя родителями.",
      ),
    ]),
    iq("git.merge.i4", "intermediate", "Чем `--no-ff` отличается от обычного слияния и когда его используют?", [
      ul(
        "Создаёт коммит слияния даже тогда, когда возможна перемотка.",
        "В графе остаётся «пузырь» ветки: видно, какие коммиты относились к задаче, и можно откатить задачу целиком одним `revert -m 1`.",
        "Выбирают, когда важна наглядность границ задач.",
      ),
    ]),
    iq("git.merge.i5", "intermediate", "Чем `--squash` отличается от обычного слияния?", [
      ul(
        "Приносит изменения как один набор в индекс; коммит слияния не создаётся, у итогового коммита один родитель.",
        "История ветки не попадает в основную линию, а Git не считает ветку слитой (`branch -d` откажет).",
        "Плюс — по одной записи на задачу; минус — потеря детальной истории и связей.",
      ),
    ]),
    iq("git.merge.i6", "advanced", "Как узнать, что войдёт в слияние, не выполняя его?", [
      ul(
        "`git log main..feature` — коммиты; `git diff main...feature` — изменения относительно общего предка.",
        "`git merge-base main feature` — точка расхождения.",
        "`git merge --no-commit --no-ff feature` — выполнить без коммита, осмотреть и при необходимости `--abort`.",
      ),
    ]),
    iq("git.merge.i7", "engineering", "Какую политику слияния вы бы выбрали для команды и почему?", [
      ul(
        "Зависит от потребностей: линейная история (rebase + fast-forward), явные границы задач (`--no-ff`) или одна запись на задачу (squash).",
        "Критерии: читаемость истории, простота откатов, поиск ошибок (`bisect` лучше работает на линейной), привычки команды.",
        "Важно зафиксировать выбор и настроить хостинг/хуки, чтобы он соблюдался.",
      ),
    ]),
    iq("git.merge.i8", "debugging", "Вы слили не в ту сторону (`main` влили в `feature`). Что делать?", [
      ul(
        "Если слияние не опубликовано: `git reset --hard ORIG_HEAD` или `git reset --hard HEAD~1` на ветке `feature` вернёт состояние до слияния.",
        "Затем выполнить слияние в правильном направлении.",
        "Если опубликовано — `git revert -m 1 <слияние>`.",
        "Привычка: перед слиянием проверять `git status` и текущую ветку.",
      ),
    ]),
  ],

  exam: [
    mcq("git.merge.e1", "foundation", "В какую ветку записывается результат `git merge feature`?", ["В `feature`", "В `main` всегда", "В текущую ветку", "В новую ветку"], 2, "Слияние всегда выполняется в текущей ветке (на которой стоит HEAD); вливаемая ветка не меняется."),
    mcq("git.merge.e2", "foundation", "Когда возможен fast-forward?", ["Когда текущий коммит — предок вливаемой ветки", "Когда есть конфликты", "Когда ветки в разных репозиториях", "Всегда"], 0, "Перемотка возможна, если вершина текущей ветки достижима из вершины вливаемой: тогда достаточно переставить указатель."),
    mcq("git.merge.e3", "foundation", "Сколько родителей у коммита слияния?", ["Ни одного", "Один", "Всегда три", "Два (или больше)"], 3, "Коммит слияния ссылается на прежнюю вершину текущей ветки и на вершину вливаемой."),
    mcq("git.merge.e4", "intermediate", "Что сделает `git merge --ff-only feature`, если ветки разошлись?", ["Создаст коммит слияния", "Откажется: `Not possible to fast-forward`", "Выполнит squash", "Удалит `feature`"], 1, "`--ff-only` разрешает только перемотку; при расхождении Git останавливается и подсказывает `--no-ff` или `rebase`."),
    mcq("git.merge.e5", "intermediate", "Что показывает `git diff main...feature` (три точки)?", ["Различие вершин `main` и `feature`", "Конфликты слияния", "Только удалённые строки", "Изменения `feature` относительно общего предка"], 3, "Три точки сравнивают вершину `feature` с общим предком двух веток — это ровно то, что принесёт слияние."),
    mcq("git.merge.e6", "intermediate", "Почему после `git merge --squash feature` и коммита ветка `feature` «не слита»?", ["Из-за ошибки Git", "Squash удаляет ветку", "У итогового коммита один родитель — вершина `feature` недостижима из `main`", "Нужен `git gc`"], 2, "Squash создаёт обычный коммит без связи с вершиной `feature`; Git проверяет достижимость, поэтому `branch -d` откажет."),
    mcq("git.merge.e7", "advanced", "Какие утверждения о трёхстороннем слиянии верны? Выберите все.", ["Изменение, сделанное только в одной ветке, принимается", "Используется общий предок", "Две ветки сравниваются между собой напрямую, без предка", "Одинаковые правки с обеих сторон не конфликтуют"], [0, 1, 3], "Алгоритм сравнивает каждую вершину с общим предком: односторонние и одинаковые правки принимаются, конфликт — только для разных правок одного места."),
    open("git.merge.e8", "intermediate", "Сравните fast-forward, `--no-ff` и `--squash`: что получается в истории и когда какой вариант уместен.", [
      ul(
        "Fast-forward — линейная история без нового коммита, годится для коротких веток.",
        "`--no-ff` — коммит слияния с двумя родителями: видны границы задачи, откат задачи целиком.",
        "`--squash` — один обычный коммит на задачу: чистая основная линия, но потеря детальной истории и связи с веткой.",
        "Выбор — договорённость команды.",
      ),
    ], ["Описаны три варианта", "Названо влияние на историю", "Названы плюсы и минусы", "Сказано про договорённость команды"]),
  ],

  mastery: [
    mcq("git.merge.m1", "intermediate", "Что вернёт `git log --oneline main..feature` сразу после обычного слияния `feature` в `main`?", ["Все коммиты `feature`", "Ничего: всё достижимо из `main`", "Только коммит слияния", "Ошибку"], 1, "Диапазон — «в feature, но не в main». После слияния вершина `feature` достижима из `main` через второго родителя, поэтому результат пуст."),
    mcq("git.merge.m2", "advanced", "Что означает сообщение `All conflicts fixed but you are still merging` после `git merge --no-commit`?", ["Слияние выполнено без конфликтов, но коммит ещё не создан", "Конфликты не решены", "Слияние завершено", "Ветка удалена"], 0, "Git остановился перед коммитом по вашей просьбе. Изменения подготовлены; завершить можно `git commit`, отменить — `git merge --abort`."),
    mcq("git.merge.m3", "advanced", "Вы хотите, чтобы по умолчанию слияния всегда создавали коммит слияния. Какая настройка?", ["`git config core.mergemode noff`", "`git config merge.squash true`", "`git config merge.ff false`", "`git config pull.rebase true`"], 2, "`merge.ff false` равносильно `--no-ff` по умолчанию; `only` соответствует `--ff-only`."),
    open("git.merge.m4", "advanced", "Опишите безопасную процедуру слияния feature-ветки в `main` в вашей команде: что проверяете до, во время и после.", [
      ul(
        "До: `main` актуальна, ветка актуальна; `git log main..feature`, `git diff main...feature --stat`; проверки и ревью пройдены.",
        "Во время: `--no-commit` для осмотра результата, при сюрпризах `--abort`; осмысленное сообщение слияния.",
        "После: тесты на результате, удаление слитой ветки, публикация; при необходимости — знать, как откатить (`revert -m 1`).",
      ),
    ], ["Проверки до слияния", "Использование `--no-commit`/`--abort`", "Проверки после", "План отката"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.merge.f1", front: "Куда записывается слияние?", back: "В текущую ветку (на которой HEAD). Вливаемая не меняется." },
    { id: "git.merge.f2", front: "Fast-forward?", back: "Сдвиг указателя без нового коммита; возможен, если текущая вершина — предок вливаемой." },
    { id: "git.merge.f3", front: "Коммит слияния?", back: "Коммит с двумя родителями: прежняя вершина и вершина вливаемой ветки." },
    { id: "git.merge.f4", front: "merge-base?", back: "Общий предок двух вершин; относительно него считаются правки сторон." },
    { id: "git.merge.f5", front: "--no-ff / --ff-only?", back: "--no-ff — всегда коммит слияния; --ff-only — только перемотка, иначе отказ." },
    { id: "git.merge.f6", front: "--squash?", back: "Изменения в индекс одним куском, без коммита слияния; ветка не считается слитой." },
    { id: "git.merge.f7", front: "Что войдёт в слияние?", back: "git log main..feature; git diff main...feature (три точки)." },
    { id: "git.merge.f8", front: "Отменить слияние в процессе?", back: "git merge --abort (после --no-commit или при конфликте)." },
  ],

  sources: [
    { title: "Pro Git: Basic Branching and Merging", url: "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging", publisher: "Git" },
    { title: "Git documentation: git-merge", url: "https://git-scm.com/docs/git-merge", publisher: "Git" },
    { title: "Git documentation: git-merge-base", url: "https://git-scm.com/docs/git-merge-base", publisher: "Git" },
    { title: "Pro Git: Advanced Merging", url: "https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging", publisher: "Git" },
    { title: "Git documentation: merge strategies", url: "https://git-scm.com/docs/merge-strategies", publisher: "Git" },
    { title: "Git documentation: gitrevisions", url: "https://git-scm.com/docs/gitrevisions", publisher: "Git" },
  ],
};
