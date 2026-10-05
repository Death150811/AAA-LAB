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

export const branchesHead: Topic = {
  id: "git.branches-head",
  slug: "branches-head",
  domain: "git",
  module: "branching",
  title: "Ветки и HEAD",
  titleEn: "Branches and HEAD",
  summary:
    "Ветка в Git — подвижный указатель на коммит, а не копия проекта; HEAD показывает, на какой ветке вы стоите. Тема на опытах в настоящем репозитории показывает, как создавать, переключать, переименовывать и удалять ветки, что происходит с файлами и локальными правками при переключении, почему «оторванный» HEAD опасен для коммитов и как спасти работу через `reflog`.",
  minutes: 75,
  prerequisites: ["git.git-mental-model", "git.commits-history", "git.undoing-changes"],
  tags: ["git branch", "git switch", "git checkout", "HEAD", "detached HEAD", "branch naming", "git branch -d", "git reflog", "feature branch", "refs/heads"],
  keyConcepts: [
    { term: "Ветка — указатель, а не копия", text: "`git branch feature` создал ветку мгновенно: `git log --decorate` показал `HEAD -> main, feature` на одном коммите. Данные не копируются." },
    { term: "Коммит двигает только текущую ветку", text: "После `git switch feature` и коммита `feature` ушла вперёд (`b75fbbd`), а `main` осталась на `d364fc6`; файл `feature.txt` виден только на `feature`." },
    { term: "Переключение меняет рабочее дерево", text: "На `main` команда `ls` показала один файл, на `feature` — два: `git switch` заменяет файлы на снимок целевой ветки." },
    { term: "Локальные правки: переносятся или блокируют", text: "Правка файла, одинакового в обеих ветках, переехала вместе с вами (`M readme.txt`); правка файла, который в ветках различается, остановила переключение: `Your local changes … would be overwritten`." },
    { term: "Оторванный HEAD и спасение коммитов", text: "На `HEAD detached` коммит `Эксперимент` не принадлежит ни одной ветке; после `switch main` Git предупредил о потере, а `git reflog` и `git branch rescue HEAD@{1}` вернули работу." },
  ],
  sections: [
    section("definition", [
      def("Ветка", "Именованный подвижный указатель на коммит. Физически — файл `.git/refs/heads/<имя>` с хэшем. Новый коммит на ветке сдвигает указатель вперёд.", "branch"),
      def("HEAD", "Указатель на текущее положение. Обычно это имя ветки (`ref: refs/heads/main`): тогда HEAD «прикреплён» к ветке.", "HEAD"),
      def("Оторванный HEAD", "Состояние, когда HEAD указывает прямо на коммит, а не на ветку (`HEAD detached at …`). Новые коммиты не принадлежат ни одной ветке и легко теряются.", "detached HEAD"),
      def("Переключение", "`git switch <ветка>` (или `git checkout <ветка>`): HEAD переводится на другую ветку, индекс и рабочее дерево приводятся к её снимку.", "switch, checkout"),
      def("Слитая ветка", "Ветка, все коммиты которой достижимы из другой (обычно из `main`). Такую ветку безопасно удалять (`git branch -d`).", "merged branch"),
      def("Журнал ссылок", "`git reflog` — локальный журнал перемещений HEAD и веток: позволяет найти коммиты, на которые больше ничто не указывает.", "reflog"),
    ]),

    section("why", [
      h("Параллельная работа без копий"),
      p("Ветки решают задачу: несколько линий разработки существуют одновременно и не мешают друг другу. Исправление срочной ошибки, новая функция, эксперимент — каждое в своей ветке, а основная линия остаётся стабильной."),
      p("В старых системах ветка означала копию каталога, и создавать её было дорого — поэтому ветвились редко. В Git ветка — файл в 41 байт: её создают на каждую задачу и удаляют после слияния."),
      ul(
        "**Изоляция.** Незавершённая работа не попадает в основную линию, пока вы не решите.",
        "**Безопасные эксперименты.** Ветку можно удалить вместе с неудачной идеей, ничего не затронув.",
        "**Ревью и слияние.** Ветка — единица обсуждения и проверки (запросы на слияние строятся на ветках).",
        "**Лёгкая смена контекста.** Переключиться на срочную задачу — одна команда.",
      ),
      tip("Если ветка кажется «тяжёлой» или «опасной», вспомните: это указатель. Опасно не ветвление, а долгая жизнь расходящихся веток и работа на оторванном HEAD."),
    ]),

    section("mental-model", [
      h("Ветки — наклейки на коммитах"),
      diagram(
        `
        до:                                       после git branch feature, switch feature, commit:

        c1 ◄── c2                                 c1 ◄── c2 ◄── c3
                │                                        │       │
              main ◄── HEAD                            main     feature ◄── HEAD
        `,
        "Ветка — имя на коммите. Коммит на feature сдвинул только feature; main осталась на c2.",
      ),
      h("HEAD: прикреплённый и оторванный"),
      diagram(
        `
        HEAD прикреплён:                      HEAD оторван:

        c1 ◄── c2 ◄── c3                      c1 ◄── c2 ◄── c3 ◄── e1     ← HEAD (без ветки)
                       │                                      │
                      main ◄── HEAD                          main
        `,
        "В обычном состоянии HEAD → ветка → коммит. В оторванном — HEAD → коммит: ветка не сдвигается, и новый коммит e1 остаётся без имени.",
      ),
      insight("Коммит жив, пока до него можно добраться: от ветки, тега, HEAD или записи reflog. Ветка — самый удобный способ «держать» коммит живым и найти его позже."),
    ]),

    section("technical", [
      h("Создание, переключение, удаление"),
      table(
        ["Команда", "Что делает"],
        [
          ["`git branch`", "Список локальных веток (`*` — текущая); `-v` — с последним коммитом, `-a` — и удалённые"],
          ["`git branch имя [старт]`", "Создать ветку на текущем коммите (или на `старт`), **не переключаясь**"],
          ["`git switch имя`", "Переключиться на существующую ветку"],
          ["`git switch -c имя [старт]`", "Создать ветку и сразу переключиться (старая форма: `git checkout -b`)"],
          ["`git switch -`", "Вернуться на предыдущую ветку"],
          ["`git branch -d имя`", "Удалить слитую ветку; для неслитой отказывается"],
          ["`git branch -D имя`", "Удалить ветку принудительно (коммиты остаются доступны через reflog)"],
          ["`git branch -m старое новое`", "Переименовать"],
          ["`git branch -f имя коммит`", "Переставить указатель ветки (не текущей)"],
          ["`git switch --detach коммит`", "Перейти на коммит, не привязываясь к ветке"],
        ],
        "Основные операции с ветками",
      ),
      p("`git switch` и `git restore` появились в Git 2.23 и разделили две роли старой `git checkout` («переключить ветку» и «восстановить файлы»). `git checkout` по-прежнему работает: в документации и ответах встречаются оба варианта."),
      h("Что происходит при переключении"),
      ul(
        "HEAD переключается на другую ветку (файл `.git/HEAD` меняет значение).",
        "Индекс и рабочее дерево приводятся к снимку целевого коммита: файлы, которых там нет, исчезают, новые появляются.",
        "Локальные правки, не затрагивающие различающиеся файлы, переносятся. Если один и тот же файл отличается между ветками и вы его меняли, Git отказывается переключаться (`would be overwritten by checkout`).",
        "Решение при отказе: закоммитить, спрятать правки (`git stash`) или отбросить.",
      ),
      h("Имена веток"),
      p("Имя ветки — путь в `refs/heads/`. Поэтому косая черта создаёт «вложенность»: `feature/login` лежит в каталоге `feature/`. Нельзя использовать пробелы, `~`, `^`, `:`, `?`, `*`, `[`, `\\`, последовательность `..`, имя не может начинаться с `-`, заканчиваться на `/` или `.lock` (полные правила — `git check-ref-format`). Принято группировать ветки префиксами (`feature/…`, `bugfix/…`, `release/…`) и короткими осмысленными именами."),
      h("Оторванный HEAD"),
      p("`git switch --detach <коммит>` или `git checkout <хэш>` переводят HEAD на коммит без ветки; `git status` пишет `HEAD detached at …`. Это нормальный режим для просмотра старой версии и для временных опытов. Новые коммиты в этом режиме не двигают ни одну ветку и теряются, если вовремя не создать ветку (`git switch -c имя` в момент работы или `git branch имя <хэш>` позже)."),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git branch
git branch feature
git switch feature
git switch -c feature/login
git switch -
git branch -d feature
git branch -D feature
git branch -m old-name new-name
git switch --detach HEAD~1`,
        [
          { line: 1, text: "Список веток; текущая отмечена звёздочкой." },
          { line: 2, text: "Создать ветку на текущем коммите, оставаясь на прежней." },
          { line: 3, text: "Перейти на ветку: меняются HEAD, индекс и файлы." },
          { line: 4, text: "Создать ветку и сразу перейти; `/` в имени задаёт префикс-«каталог»." },
          { line: 5, text: "Вернуться на предыдущую ветку." },
          { line: [6, 7], text: "Удалить ветку: безопасно (`-d`, только слитую) или принудительно (`-D`)." },
          { line: 8, text: "Переименовать ветку." },
          { line: 9, text: "Перейти на коммит без ветки (оторванный HEAD)." },
        ],
        "команды работы с ветками",
      ),
    ]),

    section("minimal-example", [
      p("Создадим ветку, сделаем коммит и сравним ветки. Репозиторий — два коммита («Первая версия», «Вторая версия»):"),
      code("text", `$ git branch feature
$ git branch
  feature
* main
$ cat .git/HEAD
ref: refs/heads/main
$ git log --oneline --decorate
d364fc6 (HEAD -> main, feature) Вторая версия
7cab684 Первая версия
$ git switch feature
Switched to branch 'feature'
$ cat .git/HEAD
ref: refs/heads/feature
$ git add feature.txt && git commit -m "Начать фичу"
[feature b75fbbd] Начать фичу
 1 file changed, 1 insertion(+)
 create mode 100644 feature.txt
$ git log --oneline --graph --all --decorate
* b75fbbd (HEAD -> feature) Начать фичу
* d364fc6 (main) Вторая версия
* 7cab684 Первая версия
$ cat .git/refs/heads/feature
b75fbbd589d81172773091b0c6ed0d514cfaeac9
$ git switch main
Switched to branch 'main'
$ ls
app.txt
$ git switch feature
Switched to branch 'feature'
$ ls
app.txt
feature.txt`, { filename: "сеанс: создание и переключение ветки" }),
      ul(
        "`git branch feature` создал ветку и **не** переключил: `HEAD -> main, feature` на одном коммите `d364fc6`.",
        "`cat .git/HEAD` — `ref: refs/heads/main`, затем `refs/heads/feature`: переключение — смена содержимого одного файла.",
        "После коммита `b75fbbd` ветка `feature` ушла вперёд, `main` осталась на «Вторая версия».",
        "`cat .git/refs/heads/feature` содержит хэш коммита `b75fbbd…` — это вся «ветка».",
        "`ls` на `main` — один файл, на `feature` — два: файл `feature.txt` принадлежит снимку ветки `feature`.",
      ),
    ]),

    section("detailed-example", [
      h("Имена с префиксами и быстрое переключение"),
      code("text", `$ git switch -c feature/login
Switched to a new branch 'feature/login'
$ git switch -c bugfix/issue-42 main
Switched to a new branch 'bugfix/issue-42'
$ find .git/refs/heads -type f | sort
.git/refs/heads/bugfix/issue-42
.git/refs/heads/feature/login
.git/refs/heads/main
$ git branch -v
* bugfix/issue-42 d364fc6 Вторая версия
  feature/login   d364fc6 Вторая версия
  main            d364fc6 Вторая версия
$ git switch -
Switched to branch 'feature/login'
$ git branch
  bugfix/issue-42
* feature/login
  main`, { filename: "сеанс: ветки с префиксами" }),
      ul(
        "`find .git/refs/heads` показал вложенные каталоги `feature/` и `bugfix/`: слеш в имени превращается в путь.",
        "`git switch -c bugfix/issue-42 main` создал ветку от указанного коммита (`main`), а не от текущей.",
        "`git branch -v` показывает вершину каждой ветки и сообщение; `git switch -` вернул на предыдущую (`feature/login`).",
      ),
      h("Удаление веток"),
      code("text", `$ git branch --no-merged
  feature
$ git branch -d feature
error: the branch 'feature' is not fully merged.
If you are sure you want to delete it, run 'git branch -D feature'
$ git branch -D feature
Deleted branch feature (was 00c66af).
$ git branch
* main
# если ветка слита, -d срабатывает без предупреждений
$ git merge small
Updating d364fc6..692d439
Fast-forward
 small.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 small.txt
$ git branch --merged
* main
  small
$ git branch -d small
Deleted branch small (was 692d439).
$ git branch
* main`, { filename: "сеанс: безопасное и принудительное удаление" }),
      ul(
        "`git branch --no-merged` перечислил неслитую `feature`; `-d` отказался: `the branch 'feature' is not fully merged`.",
        "`-D` удалил ветку и напечатал её хэш `was 00c66af` — по нему коммиты можно вернуть, пока их не удалила сборка мусора.",
        "Ветка `small` слита быстрой перемоткой (`Fast-forward` — тема про слияние); `--merged` показал её, и `-d` сработал без предупреждения.",
      ),
    ]),

    section("analysis", [
      h("Переключение при локальных правках"),
      code("text", `# правка в файле, который в обеих ветках одинаков: переносится при переключении
$ echo "дополнение" >> readme.txt
$ git switch feature
Switched to branch 'feature'
M	readme.txt
$ git status -s
 M readme.txt
# правка в файле, который в ветках различается: переключение запрещено
$ echo "локальная правка" >> app.txt
$ git switch feature
error: Your local changes to the following files would be overwritten by checkout:
	app.txt
Please commit your changes or stash them before you switch branches.
Aborting
$ git status -s
 M app.txt`, { filename: "сеанс: правки при переключении" }),
      table(
        ["Ситуация", "Результат", "Объяснение"],
        [
          ["Правка `readme.txt`, одинакового в `main` и `feature`", "Переключение прошло, правка переехала (`M readme.txt`)", "Файл не отличается между снимками — перезаписывать нечего"],
          ["Правка `app.txt`, различающегося между ветками", "`error: Your local changes … would be overwritten by checkout … Aborting`", "Переключение уничтожило бы правку; Git защищает несохранённую работу"],
        ],
        "Что делает Git с локальными изменениями при переключении",
      ),
      p("При отказе есть три пути: закоммитить правку в текущей ветке, спрятать (`git stash`) или отбросить (`git restore`). Принудительные ключи переключения (`--discard-changes`, `-m`) используйте только осознанно."),
    ]),

    section("internals", [
      h("Оторванный HEAD и reflog"),
      p("Файл `.git/HEAD` при обычной работе содержит имя ветки. При `--detach` в него записывается хэш коммита:"),
      code("text", `$ git switch --detach HEAD~1
HEAD is now at 7cab684 Первая версия
$ git status
HEAD detached at 7cab684
nothing to commit, working tree clean
$ cat .git/HEAD
7cab684d99330471630001f82a1d1a3a4da499c6
$ git add exp.txt && git commit -m "Эксперимент"
[detached HEAD ea854bf] Эксперимент
 1 file changed, 1 insertion(+)
 create mode 100644 exp.txt
$ git log --oneline --all --decorate
ea854bf (HEAD) Эксперимент
d364fc6 (main) Вторая версия
7cab684 Первая версия
$ git switch main
Warning: you are leaving 1 commit behind, not connected to
any of your branches:

  ea854bf Эксперимент

If you want to keep it by creating a new branch, this may be a good time
to do so with:

 git branch <new-branch-name> ea854bf

Switched to branch 'main'
$ git log --oneline --all --decorate
d364fc6 (HEAD -> main) Вторая версия
7cab684 Первая версия
$ git reflog -4
d364fc6 HEAD@{0}: checkout: moving from ea854bf2bfac195ae0f8ed123721691ca30469ca to main
ea854bf HEAD@{1}: commit: Эксперимент
7cab684 HEAD@{2}: checkout: moving from main to HEAD~1
d364fc6 HEAD@{3}: commit: Вторая версия
$ git branch rescue HEAD@{1}
$ git log --oneline --all --decorate
ea854bf (rescue) Эксперимент
d364fc6 (HEAD -> main) Вторая версия
7cab684 Первая версия`, { filename: "сеанс: оторванный HEAD, потеря и спасение коммита" }),
      ul(
        "`git status` — `HEAD detached at 7cab684`; `cat .git/HEAD` — голый хэш.",
        "Коммит `Эксперимент` (`ea854bf`) создан, но ни одна ветка на него не указывает: `git log --all --decorate` показывает его только как `(HEAD)`.",
        "При `git switch main` Git предупредил: `you are leaving 1 commit behind, not connected to any of your branches` и подсказал `git branch <new-branch-name> ea854bf`. После переключения коммит исчез из `git log --all`.",
        "`git reflog` хранит запись о коммите (`HEAD@{1}: commit: Эксперимент`), и `git branch rescue HEAD@{1}` вернул его под именем ветки.",
      ),
      note("reflog — локальный журнал: он существует только в вашем репозитории, не передаётся при `push`/`clone` и со временем очищается (по умолчанию записи о недостижимых коммитах живут 30 дней). Рассчитывать на него как на хранилище нельзя, но как на страховку — можно."),
      h("Перемещение и переименование"),
      code("text", `$ git branch -m old-name new-name
$ git branch -v
* main     d364fc6 Вторая версия
  new-name d364fc6 Вторая версия
$ git branch -f new-name HEAD~1
$ git branch -v
* main     d364fc6 Вторая версия
  new-name 7cab684 Первая версия
$ git log --oneline --all --decorate
d364fc6 (HEAD -> main) Вторая версия
7cab684 (new-name) Первая версия`, { filename: "сеанс: переименование и перемещение ветки" }),
      p("`git branch -m` меняет имя файла в `refs/heads`, не затрагивая коммиты. `git branch -f new-name HEAD~1` перенёс указатель на предыдущий коммит — ещё одно подтверждение, что ветка — всего лишь адрес."),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git switch --detach HEAD~1
            # …пишем код, коммитим…
            git switch main            # коммиты «потеряны»
          `,
          note: "Коммиты на оторванном HEAD не принадлежат ни одной ветке; Git предупреждает, но подсказку легко пропустить.",
        },
        {
          title: "Верно",
          code: `
            git switch -c experiment HEAD~1   # сразу ветка
            # …пишем код, коммитим…
            git switch main
          `,
          note: "Ветка с первой минуты работы — коммиты всегда достижимы.",
        },
      ),
      ul(
        "**Думать, что `git branch имя` переключает на неё.** Команда только создаёт; переключение — `git switch` (или `git switch -c` сразу).",
        "**Коммитить в `main` «по привычке»** вместо рабочей ветки: исправлять придётся перемещением коммитов.",
        "**Удалять ветку `-D`, не посмотрев, что в ней:** `--no-merged` и `git log main..ветка` покажут уникальные коммиты.",
        "**Переключаться с «грязным» деревом наугад:** правки могут «переехать» в другую ветку или заблокировать переключение; смотрите `git status` до переключения.",
        "**Игнорировать предупреждение об «оставленных» коммитах** при выходе из оторванного HEAD.",
        "**Давать ветке имя, совпадающее с тегом или каталогом:** команды становятся неоднозначными.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Долгоживущие ветки, которые расходятся с `main` месяцами:** слияние превращается в мучение. Ветки должны жить дни, а не месяцы.",
        "**Одна ветка на всю команду «для всего»:** коммиты разных задач перемешиваются; ревью и откат невозможны.",
        "**Ветки без осмысленных имён** (`test`, `new`, `fix2`): через неделю никто не знает, что в них.",
        "**Накопление слитых веток:** `git branch` превращается в свалку; удаляйте слитые (`-d`).",
        "**Работа на оторванном HEAD без ветки** «на пять минут» — классический способ потерять работу.",
        "**Переписывание уже опубликованных веток** без договорённости (`branch -f`, `reset`, принудительная отправка).",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Новая задача — новая ветка** от актуального `main`: `git switch -c feature/название main`.",
        "**Давайте именам префикс и смысл:** `feature/login`, `bugfix/issue-42`, `release/1.2`.",
        "**Перед переключением смотрите `git status`:** чистое дерево — безопасное переключение.",
        "**Удаляйте слитые ветки** (`git branch -d`); проверяйте `git branch --merged` и `--no-merged`.",
        "**Держите ветки короткими:** чаще сливайте основную линию в рабочую или наоборот, не накапливайте расхождение.",
        "**Для опытов на старой версии:** `git switch --detach`, а если появилась работа — сразу `git switch -c имя`.",
        "**Пользуйтесь `git switch -`** для быстрого возврата и `git branch -vv` для обзора.",
      ),
    ]),

    section("edge-cases", [
      h("Спасение работы с двух оторванных коммитов"),
      code("text", `$ git switch main
Warning: you are leaving 2 commits behind, not connected to
any of your branches:

  4b4a6df Эксперимент 2
  2d8939a Эксперимент 1

If you want to keep them by creating a new branch, this may be a good time
to do so with:

 git branch <new-branch-name> 4b4a6df

Switched to branch 'main'
$ git log --oneline --all --decorate
d364fc6 (HEAD -> main) Вторая версия
7cab684 Первая версия
$ git reflog -5
d364fc6 HEAD@{0}: checkout: moving from 4b4a6df416f39f6d8851eec483ea94932cf7c590 to main
4b4a6df HEAD@{1}: commit: Эксперимент 2
2d8939a HEAD@{2}: commit: Эксперимент 1
7cab684 HEAD@{3}: checkout: moving from main to HEAD~1
d364fc6 HEAD@{4}: commit: Вторая версия
$ git switch -c rescue HEAD@{1}
Switched to a new branch 'rescue'
$ git log --oneline --all --decorate
4b4a6df (HEAD -> rescue) Эксперимент 2
2d8939a Эксперимент 1
d364fc6 (main) Вторая версия
7cab684 Первая версия
$ cat exp.txt
эксперимент 1
эксперимент 2`, { filename: "сеанс: два «потерянных» коммита" }),
      p("Git предупредил про два коммита и подсказал `git branch <имя> <хэш>`; но даже если предупреждение пропущено, `git reflog` показывает, на каких коммитах стоял HEAD, и `git switch -c rescue HEAD@{1}` создаёт ветку на последнем из них — вместе с родителем `Эксперимент 1`."),
      h("Прочие нюансы"),
      ul(
        "**Ветка в чужой копии репозитория:** локальной ветки нет, пока вы её не создали; `git switch имя` создаёт её автоматически, если есть единственная удалённая ветка с таким именем (тема про удалённые репозитории).",
        "**Текущую ветку нельзя удалить или переместить `-f`:** сначала переключитесь.",
        "**Пустой репозиторий:** у ветки `main` ещё нет коммита; она появляется с первым коммитом.",
        "**Одну ветку нельзя открыть одновременно в двух рабочих каталогах:** даже с `git worktree` Git это запрещает (`already checked out`) — каждая ветка в одном каталоге.",
        "**`git switch` против `git checkout`:** `checkout <файл>` восстанавливает файл, `switch` — только ветки; из-за этой двусмысленности и появились новые команды.",
      ),
    ]),

    section("related", [
      ul(
        "[Что такое Git: снимки, объекты и ссылки](/learn/git/git-mental-model) — ветка как файл со ссылкой.",
        "[Коммиты и история](/learn/git/commits-history) — `main..feature` и граф веток.",
        "[Отмена изменений](/learn/git/undoing-changes) — `restore` для файлов при переключении.",
        "[Слияние](/learn/git/merge) — как объединять ветки.",
        "[Cherry-pick и stash](/learn/git/cherry-pick-stash) — спрятать правки перед переключением.",
        "[Reset, revert и reflog](/learn/git/reset-revert-reflog) — восстановление потерянных коммитов.",
        "[Стратегии ветвления](/learn/git/branching-strategies) — как команды организуют ветки.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Работа без ветки",
          code: `
            git switch --detach HEAD~1
            git commit -am "Эксперимент"
            git switch main
            # коммит «потерян»
          `,
          note: "Коммит не принадлежит ни одной ветке; найти его можно только через reflog.",
        },
        {
          title: "Работа в ветке",
          code: `
            git switch -c experiment HEAD~1
            git commit -am "Эксперимент"
            git switch main
            # ветка experiment держит коммит
          `,
          note: "Ветка с первой минуты: коммиты видны в `git log --all` и не теряются.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.branches-head.ex1",
      title: "Где находится HEAD",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("В репозитории два коммита на `main`. Вы выполняете: `git branch feature`, затем `git commit` (после правки файла). Затем `git switch feature` и ещё один `git commit`. На каком коммите окажутся `main` и `feature` и где HEAD? Нарисуйте граф."),
      ],
      hints: [
        "`git branch` не меняет HEAD.",
        "Новый коммит двигает ту ветку, к которой прикреплён HEAD.",
        "После `switch` HEAD указывает на другую ветку.",
      ],
      checks: ["Первый коммит сдвинул `main` (HEAD был на `main`)", "`feature` осталась на втором коммите, пока вы не переключились", "После `switch feature` второй новый коммит сдвинул `feature`", "Получилось расхождение двух веток"],
      solution: [
        code("text", `$ git branch feature
$ git commit -am "Третья версия"
[main ef24db7] Третья версия
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git switch feature
Switched to branch 'feature'
$ cat app.txt
v2
$ git add feature.txt && git commit -m "Начать фичу"
[feature 5ebb0af] Начать фичу
 1 file changed, 1 insertion(+)
 create mode 100644 feature.txt
$ git log --oneline --graph --all --decorate
* 5ebb0af (HEAD -> feature) Начать фичу
| * ef24db7 (main) Третья версия
|/  
* d364fc6 Вторая версия
* 7cab684 Первая версия`, { filename: "проверка в настоящем репозитории" }),
        ul(
          "`git branch feature` создал указатель на «Вторую версию», HEAD остался на `main`.",
          "Коммит «Третья версия» сдвинул `main` (к ней прикреплён HEAD); `feature` осталась на прежнем коммите.",
          "После `git switch feature` файл `app.txt` вернулся к `v2` — рабочее дерево приведено к снимку ветки `feature`.",
          "Коммит «Начать фичу» сдвинул `feature`. Ветки разошлись от «Второй версии»: у каждой по одному своему коммиту.",
        ),
      ],
    }),
    exercise({
      id: "git.branches-head.ex2",
      title: "Ветка для задачи",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("Создайте ветку `feature/login` от `main`, сделайте в ней коммит и убедитесь, что `main` не изменилась. Затем вернитесь на `main` одной командой без указания имени. Проверьте результат `git log --oneline --graph --all --decorate`."),
      ],
      starter: {
        lang: "bash",
        code: `
          git status -s
          # создать и переключиться на ветку одной командой
        `,
      },
      hints: [
        "Одна команда: `git switch -c`.",
        "`git switch -` возвращает на предыдущую ветку.",
        "`git branch -v` показывает вершины всех веток.",
      ],
      checks: ["Ветка `feature/login` создана и содержит новый коммит", "`main` осталась на прежнем коммите", "Возврат выполнен `git switch -`", "Граф показывает две вершины"],
      solution: [
        code("text", `$ git switch -c feature/login
Switched to a new branch 'feature/login'
$ git switch -c bugfix/issue-42 main
Switched to a new branch 'bugfix/issue-42'
$ find .git/refs/heads -type f | sort
.git/refs/heads/bugfix/issue-42
.git/refs/heads/feature/login
.git/refs/heads/main
$ git branch -v
* bugfix/issue-42 d364fc6 Вторая версия
  feature/login   d364fc6 Вторая версия
  main            d364fc6 Вторая версия
$ git switch -
Switched to branch 'feature/login'
$ git branch
  bugfix/issue-42
* feature/login
  main`, { filename: "решение (создание веток и возврат)" }),
        p("`git switch -c feature/login` создаёт ветку и переключает; коммит двигает только её. Вернуться на предыдущую ветку — `git switch -`."),
      ],
    }),
    exercise({
      id: "git.branches-head.ex3",
      title: "Коммиты пропали после переключения",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Вы переключились на старый коммит (`git switch --detach HEAD~1`), сделали два коммита, затем вернулись на `main` — и коммитов не видно в `git log --all`. Найдите их и сохраните в ветке `rescue`, не потеряв ни одного."),
      ],
      hints: [
        "Коммиты не удалены, на них просто никто не указывает.",
        "`git reflog` покажет хэши, на которых стоял HEAD.",
        "`git switch -c имя <ссылка>` создаёт ветку на любом коммите.",
      ],
      checks: ["Использован `git reflog`", "Найден последний из двух коммитов (`HEAD@{1}`)", "Создана ветка `rescue`", "Оба коммита видны в `git log --all`"],
      solution: [
        code("text", `$ git switch main
Warning: you are leaving 2 commits behind, not connected to
any of your branches:

  4b4a6df Эксперимент 2
  2d8939a Эксперимент 1

If you want to keep them by creating a new branch, this may be a good time
to do so with:

 git branch <new-branch-name> 4b4a6df

Switched to branch 'main'
$ git log --oneline --all --decorate
d364fc6 (HEAD -> main) Вторая версия
7cab684 Первая версия
$ git reflog -5
d364fc6 HEAD@{0}: checkout: moving from 4b4a6df416f39f6d8851eec483ea94932cf7c590 to main
4b4a6df HEAD@{1}: commit: Эксперимент 2
2d8939a HEAD@{2}: commit: Эксперимент 1
7cab684 HEAD@{3}: checkout: moving from main to HEAD~1
d364fc6 HEAD@{4}: commit: Вторая версия
$ git switch -c rescue HEAD@{1}
Switched to a new branch 'rescue'
$ git log --oneline --all --decorate
4b4a6df (HEAD -> rescue) Эксперимент 2
2d8939a Эксперимент 1
d364fc6 (main) Вторая версия
7cab684 Первая версия
$ cat exp.txt
эксперимент 1
эксперимент 2`, { filename: "решение" }),
        ul(
          "Предупреждение Git при выходе из оторванного HEAD называет оба коммита; даже без него `reflog` хранит их.",
          "`HEAD@{1}` — вершина перед переключением на `main`; ветка на ней вернула оба коммита.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "git.branches-head.challenge",
    title: "Безопасная чистка веток",
    scenario: [
      p("В репозитории накопились ветки `feature`, `small`, `rescue`. Часть из них слита в `main`, часть — нет. Нужно удалить только безопасное и ничего не потерять: перед каждым удалением проверить, что ветка слита, а неслитые коммиты — сохранить."),
    ],
    requirements: [
      "Найти слитые и неслитые ветки командами Git",
      "Удалить слитые ветки безопасной командой",
      "Для неслитой ветки посмотреть уникальные коммиты и решить, нужны ли они",
      "Не использовать `-D`, пока не проверены уникальные коммиты",
    ],
    constraints: [
      "Не удалять ветку `main` и текущую ветку",
      "Не переписывать историю",
    ],
    acceptance: [
      "`git branch --merged` перечисляет только слитые ветки, и они удалены `-d`",
      "Неслитая ветка сохранена или удалена только после просмотра коммитов (`git log main..ветка`)",
      "`git branch` показывает только нужные ветки",
    ],
    hints: [
      "`--merged` и `--no-merged` относительно текущей ветки.",
      "`-d` откажется удалять неслитую ветку — это защита.",
      "Уникальные коммиты: `git log --oneline main..ветка`.",
    ],
    solution: [
      code("text", `$ git branch --no-merged
  feature
$ git branch -d feature
error: the branch 'feature' is not fully merged.
If you are sure you want to delete it, run 'git branch -D feature'
$ git branch -D feature
Deleted branch feature (was 00c66af).
$ git branch
* main
# если ветка слита, -d срабатывает без предупреждений
$ git merge small
Updating d364fc6..692d439
Fast-forward
 small.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 small.txt
$ git branch --merged
* main
  small
$ git branch -d small
Deleted branch small (was 692d439).
$ git branch
* main`, { filename: "решение (на двух ветках)" }),
      p("Схема: `git branch --merged` → удалить `-d`; `git branch --no-merged` → для каждой `git log --oneline main..ветка`, затем решить: слить, сохранить или удалить `-D` (хэш `was …` запомнить или найти потом в reflog)."),
    ],
  },

  interview: [
    iq("git.branches-head.i1", "basic", "Что такое ветка в Git?", [
      ul(
        "Подвижный указатель на коммит: файл `.git/refs/heads/<имя>` с хэшем.",
        "Новый коммит на ветке сдвигает её вперёд.",
        "Создание ветки — мгновенно и дёшево, данные не копируются.",
      ),
    ]),
    iq("git.branches-head.i2", "basic", "Чем `git branch feature` отличается от `git switch -c feature`?", [
      ul(
        "`git branch feature` только создаёт ветку, HEAD остаётся на прежней.",
        "`git switch -c feature` создаёт ветку и сразу переключается на неё.",
        "Старая форма второго варианта — `git checkout -b feature`.",
      ),
    ]),
    iq("git.branches-head.i3", "intermediate", "Что такое HEAD и чем отличаются прикреплённый и оторванный HEAD?", [
      ul(
        "HEAD — указатель на текущее положение; обычно содержит имя ветки (`ref: refs/heads/main`).",
        "Оторванный — указывает прямо на коммит (`HEAD detached at …`): новые коммиты не двигают ветку.",
        "Для безопасной работы на оторванном HEAD нужно сразу создать ветку.",
      ),
    ]),
    iq("git.branches-head.i4", "intermediate", "Что происходит с локальными правками при `git switch`?", [
      ul(
        "Если правки касаются файлов, одинаковых в обеих ветках, они переносятся.",
        "Если файл отличается между ветками и изменён локально, переключение блокируется (`would be overwritten`).",
        "Выход: закоммитить, `git stash` или отбросить.",
      ),
    ]),
    iq("git.branches-head.i5", "intermediate", "Чем `git branch -d` отличается от `-D`?", [
      ul(
        "`-d` удаляет только слитую ветку и отказывается удалять неслитую (`not fully merged`).",
        "`-D` удаляет принудительно; Git печатает хэш (`was 00c66af`), по нему коммиты можно вернуть, пока их не удалила сборка мусора.",
        "Перед `-D` просматривайте `git log main..ветка`.",
      ),
    ]),
    iq("git.branches-head.i6", "advanced", "Вы сделали коммиты на оторванном HEAD и переключились на `main`. Как их вернуть?", [
      ul(
        "Git предупреждает и подсказывает `git branch <имя> <хэш>`.",
        "Если предупреждение пропущено: `git reflog`, найти хэш последнего коммита, `git branch rescue <хэш>` или `git switch -c rescue HEAD@{n}`.",
        "Сделать это нужно до очистки reflog и сборки мусора.",
      ),
    ]),
    iq("git.branches-head.i7", "engineering", "Как вы называете ветки и как долго они живут?", [
      ul(
        "Префиксы по типу и осмысленное имя: `feature/login`, `bugfix/issue-42`, `release/1.2`.",
        "Ветки задач живут дни: чем дольше, тем сложнее слияние.",
        "Слитые ветки удаляются; общая ветка (`main`) защищается правилами хостинга.",
      ),
    ]),
    iq("git.branches-head.i8", "debugging", "После `git switch` файл «пропал» из рабочего каталога. Что произошло?", [
      ul(
        "Файла нет в снимке целевой ветки: переключение приводит рабочее дерево к снимку этой ветки.",
        "Проверить: `git ls-tree -r <ветка> --name-only`, `git log --all -- файл`.",
        "Вернуть: переключиться обратно или `git restore --source=<ветка> файл`.",
        "Правки в таком файле либо были закоммичены, либо Git заблокировал переключение.",
      ),
    ]),
  ],

  exam: [
    mcq("git.branches-head.e1", "foundation", "Что такое ветка в Git?", ["Копия всех файлов проекта", "Отдельный репозиторий", "Указатель на коммит", "Тег с сообщением"], 2, "Ветка — файл `refs/heads/<имя>` с хэшем коммита. Поэтому создание и переключение веток происходит мгновенно."),
    mcq("git.branches-head.e2", "foundation", "Какая команда создаёт ветку и сразу переключается на неё?", ["`git switch -c имя`", "`git branch имя`", "`git branch -d имя`", "`git merge имя`"], 0, "`git switch -c имя` создаёт ветку и переключает на неё; `git branch имя` только создаёт."),
    mcq("git.branches-head.e3", "foundation", "Что означает `HEAD detached at …` в `git status`?", ["HEAD удалён", "Ветка слита", "Репозиторий повреждён", "HEAD указывает на коммит, а не на ветку"], 3, "Оторванный HEAD — режим просмотра или опыта на конкретном коммите; новые коммиты не принадлежат ветке."),
    mcq("git.branches-head.e4", "intermediate", "Что сделает `git branch -d feature`, если ветка не слита?", ["Удалит принудительно", "Откажется и сообщит `not fully merged`", "Слияет ветку", "Создаст копию"], 1, "`-d` — безопасное удаление: он защищает от потери уникальных коммитов. Для принудительного нужно `-D`."),
    mcq("git.branches-head.e5", "intermediate", "Как называются файлы веток `feature/login` на диске?", ["`.git/refs/heads/feature-login`", "`.git/feature/login`", "`.git/branches/feature/login`", "`.git/refs/heads/feature/login`"], 3, "Имя ветки — путь внутри `refs/heads`; слеш создаёт вложенный каталог."),
    mcq("git.branches-head.e6", "intermediate", "Правка файла `a.txt`, который одинаков в `main` и `feature`. Что произойдёт при `git switch feature`?", ["Переключение запрещено", "Правка пропадёт", "Переключение пройдёт, правка перенесётся", "Git сделает коммит"], 2, "Файл не отличается между снимками — перезаписывать нечего, поэтому правка переезжает вместе с вами. Запрет возникает только для различающихся файлов."),
    mcq("git.branches-head.e7", "advanced", "Что нужно сделать, чтобы вернуть коммиты, сделанные на оторванном HEAD, после `git switch main`?", ["Ничего: они сохраняются в `main`", "Найти хэш в `git reflog` и создать на нём ветку", "Выполнить `git gc`", "Перезагрузить репозиторий"], 1, "Коммиты остаются в базе, пока их не очистила сборка мусора. `reflog` хранит их хэши, а ветка снова делает их достижимыми."),
    open("git.branches-head.e8", "intermediate", "Опишите, что изменяется в `.git` при `git switch feature` и при коммите на этой ветке.", [
      ul(
        "`.git/HEAD` получает `ref: refs/heads/feature`; индекс и рабочее дерево приводятся к снимку вершины `feature`.",
        "Коммит создаёт новые объекты (blob, tree, commit), а файл `refs/heads/feature` получает хэш нового коммита.",
        "`refs/heads/main` и коммиты на нём не меняются.",
      ),
    ], ["Описан HEAD", "Описано обновление индекса и дерева", "Описан сдвиг только текущей ветки", "Упомянуты новые объекты"]),
  ],

  mastery: [
    mcq("git.branches-head.m1", "intermediate", "Что сделает `git branch -f feature HEAD~1`, если вы находитесь на `main`?", ["Переставит указатель `feature` на предыдущий коммит", "Переключит на `feature`", "Удалит `feature`", "Создаст коммит"], 0, "`-f` перемещает ветку (не текущую) на указанный коммит. Данные не копируются, меняется только хэш в `refs/heads/feature`."),
    mcq("git.branches-head.m2", "advanced", "Почему `git branch -D` не навсегда уничтожает коммиты ветки?", ["Потому что они хранятся в `.gitignore`", "Потому что Git копирует ветку на сервер", "Объекты остаются в базе до сборки мусора; хэш напечатан и есть в reflog", "Потому что `-D` на самом деле не удаляет"], 2, "Удаляется только указатель. Коммиты остаются в базе объектов, и до очистки их можно вернуть через `git branch имя <хэш>`."),
    mcq("git.branches-head.m3", "advanced", "Как безопасно работать над экспериментом на старом коммите?", ["`git switch -c experiment <коммит>`", "`git switch --detach` и коммитить без ветки", "Редактировать файлы в `.git/`", "Использовать `git branch -f main`"], 0, "Ветка держит коммиты достижимыми с первой минуты. На оторванном HEAD работу легко потерять при переключении."),
    open("git.branches-head.m4", "advanced", "Коллега говорит: «Я не создаю ветки, потому что это тяжело и опасно, всё пишу в `main`». Как вы объясните устройство веток и что порекомендуете?", [
      ul(
        "Ветка — файл в 41 байт с хэшем; создание мгновенное, данные не копируются; риск потерять код выше при работе в `main` напрямую.",
        "Рекомендации: ветка на каждую задачу (`feature/…`), короткая жизнь, регулярное слияние, удаление слитых.",
        "Показать `git log --graph --all` на примере: ветки видны, ничто не потеряно.",
        "Подчеркнуть, что опасна не ветка, а долгие расхождения и оторванный HEAD.",
      ),
    ], ["Объяснено устройство ветки", "Названа польза", "Даны практические рекомендации", "Упомянуты риски и способ их избежать"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.branches-head.f1", front: "Что такое ветка?", back: "Файл refs/heads/<имя> с хэшем коммита. Указатель, не копия." },
    { id: "git.branches-head.f2", front: "git branch x vs git switch -c x?", back: "Первая создаёт, не переключаясь; вторая создаёт и переключается." },
    { id: "git.branches-head.f3", front: "HEAD?", back: "Текущее положение. ref: refs/heads/main — прикреплён; хэш — оторван (detached)." },
    { id: "git.branches-head.f4", front: "Оторванный HEAD: риск?", back: "Коммиты без ветки теряются при переключении. Спасение: git reflog + git branch имя хэш." },
    { id: "git.branches-head.f5", front: "-d и -D?", back: "-d — только слитая ветка; -D — принудительно (хэш был … печатается)." },
    { id: "git.branches-head.f6", front: "Переключение и правки?", back: "Переносятся, если файл одинаков в ветках; иначе — error: would be overwritten." },
    { id: "git.branches-head.f7", front: "git switch -?", back: "Возврат на предыдущую ветку." },
    { id: "git.branches-head.f8", front: "Имя feature/login?", back: "Файл .git/refs/heads/feature/login: слеш — вложенный каталог." },
  ],

  sources: [
    { title: "Pro Git: Branches in a Nutshell", url: "https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell", publisher: "Git" },
    { title: "Pro Git: Basic Branching and Merging", url: "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging", publisher: "Git" },
    { title: "Pro Git: Branch Management", url: "https://git-scm.com/book/en/v2/Git-Branching-Branch-Management", publisher: "Git" },
    { title: "Git documentation: git-branch", url: "https://git-scm.com/docs/git-branch", publisher: "Git" },
    { title: "Git documentation: git-switch", url: "https://git-scm.com/docs/git-switch", publisher: "Git" },
    { title: "Git documentation: git-check-ref-format", url: "https://git-scm.com/docs/git-check-ref-format", publisher: "Git" },
    { title: "Git documentation: git-reflog", url: "https://git-scm.com/docs/git-reflog", publisher: "Git" },
  ],
};
