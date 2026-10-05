import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  tip,
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

export const gitignoreTracking: Topic = {
  id: "git.gitignore-tracking",
  slug: "gitignore-tracking",
  domain: "git",
  module: "core-ops",
  title: "Игнорирование и отслеживание файлов",
  titleEn: "Ignoring and Tracking Files",
  summary:
    "Не всё, что лежит в каталоге проекта, должно попасть в историю: сборки, зависимости, журналы, локальные настройки, секреты. Тема на опытах показывает, как работает `.gitignore` (синтаксис, приоритеты, ограничения), почему он не действует на уже отслеживаемые файлы, чем отличаются `.git/info/exclude` и глобальный список, как `git rm` и `git mv` меняют индекс и как `.gitattributes` управляет переводами строк.",
  minutes: 70,
  prerequisites: ["git.three-areas", "git.undoing-changes"],
  tags: [".gitignore", "git rm --cached", "git mv", "git check-ignore", ".git/info/exclude", "core.excludesFile", ".gitattributes", "eol", "autocrlf", "untracked", "tracked", "rename detection", "git ls-files"],
  keyConcepts: [
    { term: "Игнорируются только неотслеживаемые файлы", text: "`.gitignore` не действует на файл, который уже в индексе: после правки `local.cfg` статус остался ` M`, а `git check-ignore -v local.cfg` не вывел ничего. Чтобы перестать следить, нужен `git rm --cached`." },
    { term: "Правила читаются сверху вниз, побеждает последнее", text: "`*.tmp` затем `!keep.tmp`: `notes.tmp` игнорируется, `keep.tmp` — нет. Если порядок обратный, исключение перекрывается общим правилом." },
    { term: "Нельзя вернуть файл из игнорируемого каталога", text: "При `logs/` и `!logs/keep.txt` файл `logs/keep.txt` остаётся игнорируемым (`check-ignore` указывает правило `logs/`); правило `logs/*` вместо `logs/` позволяет исключение." },
    { term: "Три места для правил", text: "`.gitignore` в репозитории (общее для команды), `.git/info/exclude` (личное для этого клона), `core.excludesFile` (личное для всех репозиториев). `git check-ignore -v` называет файл, строку и шаблон." },
    { term: "Переименование Git не хранит", text: "`git mv` — это `mv` плюс `git add`; Git распознаёт `R  util.py -> helpers.py` по содержимому (в опыте — `100%`). Правила перевода строк задаёт `.gitattributes`: `git ls-files --eol` показывает индекс и рабочее дерево." },
  ],
  sections: [
    section("definition", [
      def("Отслеживаемый файл", "Файл, путь которого есть в индексе. Изменения таких файлов видны в `git status` и `git diff`.", "tracked file"),
      def("Неотслеживаемый файл", "Файл в рабочем дереве, которого нет ни в индексе, ни в последнем коммите. Статус `??`.", "untracked file"),
      def("Игнорируемый файл", "Неотслеживаемый файл, подпавший под правило игнорирования: Git не показывает его в `status` и не добавляет через `git add .` (в `--ignored` помечается `!!`).", "ignored file"),
      def(".gitignore", "Текстовый файл с шаблонами имён. Лежит в репозитории, действует на каталог, где находится, и на вложенные; общий для команды.", ".gitignore"),
      def("Файл исключений", "`.git/info/exclude` — такой же список, но локальный: в коммиты не попадает. Глобальный список задаётся настройкой `core.excludesFile`.", "exclude file"),
      def("Обнаружение переименований", "Git не хранит переименование как событие: сравнивая снимки, он замечает, что файл исчез по одному пути и появился по другому с похожим содержимым (по умолчанию от 50% совпадения).", "rename detection"),
      def(".gitattributes", "Файл атрибутов путей: правила перевода строк (`text`, `eol`), двоичных файлов, слияния и другое.", ".gitattributes"),
    ]),

    section("why", [
      h("Что не должно попадать в историю"),
      p("История неизменяема, и всё, что попало в коммит, остаётся в ней навсегда и расходится по всем клонам. Поэтому важно с самого начала решить, какие файлы Git не должен видеть."),
      ul(
        "**Производные файлы:** результаты сборки (`build/`, `dist/`), скомпилированные модули, кэши — их можно получить из исходников; они раздувают репозиторий, а их diff бессмысленны.",
        "**Зависимости** (`node_modules/`, `vendor/`, виртуальные окружения): восстанавливаются менеджером пакетов по файлу зависимостей.",
        "**Локальные настройки и секреты** (`.env`, ключи, пароли): у каждого свои, а секрет в истории нельзя считать секретом.",
        "**Журналы, временные файлы, файлы редакторов и ОС** (`*.log`, `*.swp`, `.DS_Store`): шум, из-за которого в `git status` не видно нужного.",
      ),
      p("`.gitignore` убирает этот шум: `git status` показывает только значимое, а `git add .` не подхватывает лишнее. Но игнорирование — не защита и не удаление: оно действует только на файлы, которые ещё не отслеживаются."),
      tip("Заведите `.gitignore` в первом же коммите проекта, до того как в репозитории окажется мусор: удалять уже закоммиченное из истории намного сложнее."),
    ]),

    section("mental-model", [
      h("Три класса файлов"),
      diagram(
        `
        файл в рабочем дереве
              │
              ├── есть в индексе? ── да ──► ОТСЛЕЖИВАЕМЫЙ: .gitignore не действует
              │
              └── нет
                    │
                    ├── подпадает под правило ignore? ── да ──► ИГНОРИРУЕМЫЙ (!!)
                    │
                    └── нет ──► НЕОТСЛЕЖИВАЕМЫЙ (??): кандидат для git add
        `,
        "Решение «показывать ли файл» принимается только для файлов, которых ещё нет в индексе.",
      ),
      h("Где лежат правила и кто главнее"),
      table(
        ["Источник", "Для кого", "В репозитории?"],
        [
          ["`.gitignore` в каталоге файла и выше", "Вся команда", "Да, коммитится"],
          ["`.git/info/exclude`", "Только этот клон", "Нет"],
          ["`core.excludesFile` (глобальный список)", "Все ваши репозитории", "Нет"],
        ],
        "Три источника правил игнорирования",
      ),
      p("Внутри одного файла побеждает **последнее** подходящее правило; правила глубже по каталогам перекрывают правила выше. `git check-ignore -v путь` показывает, какое именно правило сработало."),
    ]),

    section("technical", [
      h("Синтаксис .gitignore"),
      table(
        ["Шаблон", "Значение", "Пример"],
        [
          ["`*.log`", "Звёздочка заменяет любую строку, кроме `/`; без слеша шаблон действует на всех уровнях", "`debug.log`, `logs/a.log`"],
          ["`build/`", "Слеш в конце — только каталоги", "Каталог `build` и всё внутри"],
          ["`/todo.txt`", "Слеш в начале — привязка к каталогу с `.gitignore`", "`todo.txt` в корне, но не `src/todo.txt`"],
          ["`docs/*.md`", "Слеш в середине — шаблон привязан к каталогу", "`docs/guide.md`, но не `docs/api/ref.md`"],
          ["`**/node_modules/`", "`**` — любое число каталогов", "`node_modules` на любом уровне"],
          ["`logs/*` и `!logs/keep.txt`", "`!` отменяет предыдущее правило", "Всё в `logs`, кроме `keep.txt`"],
          ["`?`, `[abc]`", "Один любой символ; один из набора", "`file?.txt`, `[Tt]emp`"],
          ["`# текст`", "Комментарий", ""],
        ],
        "Основные шаблоны",
      ),
      p("Главное ограничение из документации: **нельзя вернуть файл, если исключён его родительский каталог**. Поэтому исключение работает с шаблоном `logs/*` (все файлы внутри), но не с `logs/` (сам каталог)."),
      h("Управление отслеживанием"),
      table(
        ["Команда", "Действие"],
        [
          ["`git rm файл`", "Удалить файл с диска и подготовить удаление"],
          ["`git rm --cached файл`", "Перестать отслеживать, оставив файл на диске"],
          ["`git mv старый новый`", "Переименовать или переместить: `mv` + подготовка"],
          ["`git add -f файл`", "Добавить игнорируемый файл принудительно"],
          ["`git status --ignored`", "Показать игнорируемые файлы (`!!`)"],
          ["`git check-ignore -v путь`", "Показать правило, которое игнорирует путь"],
          ["`git ls-files`", "Список отслеживаемых файлов"],
        ],
        "Команды, связанные с отслеживанием",
      ),
      h("Переводы строк и .gitattributes"),
      p("В Windows строки заканчиваются `CRLF`, в Linux и macOS — `LF`. Если в репозиторий попадут обе формы, diff засоряется «изменениями» во всём файле. Правила задаёт `.gitattributes`: `text` включает нормализацию (в индексе — `LF`), `eol=lf` или `eol=crlf` задаёт форму в рабочем дереве. Состояние показывает `git ls-files --eol`: `i/` — в индексе, `w/` — в рабочем дереве, `attr/` — действующие атрибуты."),
    ]),

    section("syntax", [
      p("Типичный фрагмент `.gitignore`:"),
      annotated(
        "text",
        `*.log
build/
/todo.txt
docs/*.md
**/node_modules/
logs/*
!logs/keep.txt`,
        [
          { line: 1, text: "Любые файлы `*.log` на любом уровне вложенности." },
          { line: 2, text: "Каталог `build/` целиком (шаблон с завершающим слешем)." },
          { line: 3, text: "Только `todo.txt` в корне; `src/todo.txt` останется видимым." },
          { line: 4, text: "Markdown-файлы прямо в `docs/`, без подкаталогов." },
          { line: 5, text: "Каталоги `node_modules` на любой глубине." },
          { line: [6, 7], text: "Игнорировать всё в `logs/`, кроме `keep.txt`. Исключение действует, потому что игнорируется содержимое, а не сам каталог." },
        ],
        "образец .gitignore",
      ),
    ]),

    section("minimal-example", [
      p("Рабочий каталог с исходником `app.py`, журналом, сборкой, временными файлами и файлом локальных настроек. До `.gitignore` весь мусор виден как `??`; затем добавляем правила:"),
      code("text", `$ git status -s
?? .env
?? app.py
?? build/
?? debug.log
?? keep.tmp
?? notes.tmp
$ cat .gitignore
# журналы и сборка
*.log
build/
# локальные настройки
.env
# временные файлы, кроме keep.tmp
*.tmp
!keep.tmp
$ git status -s
?? .gitignore
?? app.py
?? keep.tmp
$ git status -s --ignored
?? .gitignore
?? app.py
?? keep.tmp
!! .env
!! build/
!! debug.log
!! notes.tmp
$ git check-ignore -v debug.log build/out.bin keep.tmp notes.tmp
.gitignore:2:*.log	debug.log
.gitignore:3:build/	build/out.bin
.gitignore:8:!keep.tmp	keep.tmp
.gitignore:7:*.tmp	notes.tmp
$ git add debug.log
The following paths are ignored by one of your .gitignore files:
debug.log
hint: Use -f if you really want to add them.
hint: Turn this message off by running
hint: "git config advice.addIgnoredFile false"`, { filename: "сеанс: .gitignore в действии" }),
      ul(
        "После создания `.gitignore` статус сократился до `.gitignore`, `app.py` и `keep.tmp` — остальное игнорируется.",
        "`git status --ignored` показывает скрытое с пометкой `!!` (`.env`, `build/`, `debug.log`, `notes.tmp`).",
        "`git check-ignore -v` называет файл, строку и шаблон: `.gitignore:2:*.log debug.log`. Для `keep.tmp` сработало правило `!keep.tmp` (строка 8) — исключение.",
        "`git add debug.log` отказал: «The following paths are ignored…» с подсказкой про `-f`.",
        "Сам `.gitignore` остаётся неотслеживаемым (`??`) — его нужно закоммитить, чтобы правила разделила команда.",
      ),
    ]),

    section("detailed-example", [
      h("Привязка к каталогу и исключения"),
      code("text", `$ cat .gitignore
/todo.txt
docs/*.md
logs/
!logs/keep.txt
$ git status -s -uall
?? .gitignore
?? docs/api/ref.md
?? src/todo.txt
# правило /todo.txt привязано к корню: src/todo.txt не игнорируется
# docs/*.md не заходит в подкаталоги: docs/api/ref.md виден
# исключение !logs/keep.txt не работает, пока игнорируется весь каталог logs/
$ git check-ignore -v logs/keep.txt
.gitignore:3:logs/	logs/keep.txt
$ cat .gitignore
/todo.txt
docs/*.md
logs/*
!logs/keep.txt
$ git status -s -uall
?? .gitignore
?? docs/api/ref.md
?? logs/keep.txt
?? src/todo.txt`, { filename: "сеанс: привязка, звёздочка и исключения" }),
      ul(
        "`/todo.txt` игнорирует только корневой файл: `src/todo.txt` остался `??`.",
        "`docs/*.md` не заходит в подкаталоги: `docs/api/ref.md` виден.",
        "`logs/` + `!logs/keep.txt`: файл всё равно игнорируется — `check-ignore` указывает правило `.gitignore:3:logs/`. Родитель исключён целиком, до исключения дело не доходит.",
        "Замена `logs/` на `logs/*` решила проблему: в статусе появился `logs/keep.txt`, а `logs/app.log` по-прежнему скрыт.",
      ),
      h("Файл уже отслеживается"),
      p("Самая частая проблема: файл `local.cfg` закоммитили, потом добавили в `.gitignore`, а Git продолжает показывать его изменения."),
      code("text", `$ git status -s
 M local.cfg
?? .gitignore
# файл уже отслеживается — .gitignore на него не действует
$ git check-ignore -v local.cfg
$ git rm --cached local.cfg
rm 'local.cfg'
$ git status -s
D  local.cfg
?? .gitignore
$ git commit -m "Перестать отслеживать local.cfg"
[main 3348ab7] Перестать отслеживать local.cfg
 1 file changed, 1 deletion(-)
 delete mode 100644 local.cfg
$ git status -s
?? .gitignore
$ cat local.cfg
debug=2
$ git check-ignore -v local.cfg
.gitignore:1:local.cfg	local.cfg`, { filename: "сеанс: перестать отслеживать файл" }),
      ul(
        "`.gitignore` на отслеживаемый файл не действует: статус ` M local.cfg`, а `check-ignore -v` молчит.",
        "`git rm --cached local.cfg` подготовил удаление **из индекса** (`D `), оставив файл на диске.",
        "После коммита файл остался на диске (`debug=2`), а `check-ignore -v` теперь называет правило `.gitignore:1:local.cfg`.",
        "В истории предыдущий коммит по-прежнему содержит `local.cfg`: если там был секрет, он остался (его нужно отозвать).",
      ),
    ]),

    section("analysis", [
      h("Личные правила: exclude и глобальный список"),
      code("text", `$ git status -s
?? app.py
?? scratch.txt
$ echo "scratch.txt" >> .git/info/exclude
$ git status -s
?? app.py
$ git check-ignore -v scratch.txt
.git/info/exclude:7:scratch.txt	scratch.txt
$ echo "*.swp" > ~/.gitignore_global
$ git config --global core.excludesFile ~/.gitignore_global
$ git check-ignore -v .app.py.swp
/home/dev/.gitignore_global:1:*.swp	.app.py.swp`, { filename: "сеанс: личные правила игнорирования" }),
      table(
        ["Шаг", "Результат", "Вывод"],
        [
          ["Строка `scratch.txt` в `.git/info/exclude`", "`scratch.txt` пропал из `status`", "Правило личное: в коммитах его не будет"],
          ["`check-ignore -v scratch.txt`", "`.git/info/exclude:7:scratch.txt`", "Виден файл и номер строки (первые строки заняты комментарием-образцом)"],
          ["`core.excludesFile` → `~/.gitignore_global` с `*.swp`", "`/home/dev/.gitignore_global:1:*.swp`", "Правило работает во всех ваших репозиториях"],
        ],
        "Три источника правил на практике",
      ),
      p("Файлы редакторов и ОС (`*.swp`, `.DS_Store`, `.idea/`) лучше держать в **глобальном** списке: они вашей рабочей среды, а не проекта. В `.gitignore` проекта кладут то, что одинаково для всех: сборки, зависимости, журналы."),
    ]),

    section("internals", [
      h("Переименование, удаление и обнаружение копий"),
      code("text", `$ git mv util.py helpers.py
$ git status -s
R  util.py -> helpers.py
$ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	renamed:    util.py -> helpers.py

$ git commit -m "Переименовать util.py в helpers.py"
[main 8a769c3] Переименовать util.py в helpers.py
 1 file changed, 0 insertions(+), 0 deletions(-)
 rename util.py => helpers.py (100%)
$ git log --oneline -- helpers.py
8a769c3 Переименовать util.py в helpers.py
$ git log --oneline --follow -- helpers.py
8a769c3 Переименовать util.py в helpers.py
225e133 Начало
$ git rm README.md
rm 'README.md'
$ git status -s
D  README.md
$ git commit -m "Удалить README"
[main c039c1a] Удалить README
 1 file changed, 1 deletion(-)
 delete mode 100644 README.md
$ git log --oneline --stat -2
c039c1a Удалить README
 README.md | 1 -
 1 file changed, 1 deletion(-)
8a769c3 Переименовать util.py в helpers.py
 util.py => helpers.py | 0
 1 file changed, 0 insertions(+), 0 deletions(-)`, { filename: "сеанс: git mv и git rm" }),
      ul(
        "`git mv util.py helpers.py` выполнил переименование и подготовил его. В коротком статусе — `R  util.py -> helpers.py`, в длинном — `renamed:`.",
        "В коммите Git сообщил `rename util.py => helpers.py (100%)`: он **вычислил** переименование из двух снимков — в объектах ничего особого нет, а `100%` — степень совпадения содержимого.",
        "`git log -- helpers.py` показал только коммит переименования, а `git log --follow -- helpers.py` проследил историю файла дальше — через переименование к «Начало».",
        "`git rm README.md` одновременно удалил файл и подготовил удаление (`D `).",
      ),
      h("Нормализация переводов строк"),
      code("text", `$ cat .gitattributes
*.sh  text eol=lf
*.bat text eol=crlf
$ git ls-files --eol
i/lf    w/lf    attr/                 	.gitattributes
i/lf    w/crlf  attr/text eol=crlf    	run.bat
i/lf    w/lf    attr/text eol=lf      	run.sh`, { filename: "сеанс: .gitattributes и переводы строк" }),
      ul(
        "`run.bat` с `CRLF` в рабочем дереве хранится в индексе с `LF` (`i/lf  w/crlf`) — правило `text eol=crlf` велит возвращать `CRLF` при выгрузке на диск.",
        "`run.sh` — `i/lf w/lf`: для скриптов Linux правило `eol=lf`.",
        "Без правил Git ничего не нормализует: поведение зависит от `core.autocrlf` у каждого участника, что и приводит к «шторму» различий. Одинаковое для всей команды — только `.gitattributes` в репозитории.",
      ),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            logs/
            !logs/keep.txt          # исключение не сработает

            # .env уже закоммичен, добавляем в .gitignore и считаем, что всё хорошо
            echo ".env" >> .gitignore
          `,
          note: "Родительский каталог исключён целиком; а отслеживаемый файл `.gitignore` не затрагивает: секрет остаётся в индексе и в истории.",
        },
        {
          title: "Верно",
          code: `
            logs/*
            !logs/keep.txt

            git rm --cached .env      # убрать из индекса, оставить на диске
            echo ".env" >> .gitignore
            git commit -m "Перестать отслеживать .env"
            # и заменить секрет: он остался в истории
          `,
          note: "Исключение работает с `logs/*`; из индекса секрет удаляется явно, а затем его отзывают и заменяют.",
        },
      ),
      ul(
        "**Ждать, что `.gitignore` «скроет» отслеживаемый файл.** Нужен `git rm --cached`.",
        "**Считать `.gitignore` защитой секретов.** Он лишь предотвращает случайное добавление; уже закоммиченный секрет в истории остаётся.",
        "**Не коммитить сам `.gitignore`.** Тогда у коллег свои наборы мусора.",
        "**Игнорировать файлы, нужные другим:** lock-файлы зависимостей, пример конфигурации (`.env.example`), миграции.",
        "**Путать `build` и `build/`:** без слеша шаблон совпадёт и с файлом, и с каталогом по имени.",
        "**Править файлы из `.gitignore` прямо в индексе:** `git add -f` помещает игнорируемый файл в историю — иногда нужно, но осознанно.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Одна гигантская копия чужого `.gitignore` «на всякий случай»:** трудно понять, что реально нужно проекту. Берите шаблон под стек и удаляйте лишнее.",
        "**Игнорирование всего каталога с оговорками (`*` и десятки `!…`):** правила превращаются в головоломку; лучше явные списки.",
        "**Коммит сборочных артефактов «чтобы не собирать»:** репозиторий раздувается, разработчики постоянно получают конфликты по двоичным файлам.",
        "**Хранение секретов в репозитории при `.gitignore` «на потом».**",
        "**Разный перевод строк у команды без `.gitattributes`:** diff по всему файлу, ложные конфликты.",
        "**Переименование через `rm` + `add` вручную с одновременной правкой:** распознавание переименований ломается, история файла теряется.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Заводите `.gitignore` в первом коммите** и держите его в репозитории.",
        "**Разделяйте уровни:** проектные правила — в `.gitignore`, личные — в `.git/info/exclude`, файлы редактора и ОС — в глобальном списке.",
        "**Проверяйте правила командой `git check-ignore -v путь`** вместо догадок; `git status --ignored` — что скрыто.",
        "**Храните шаблон настроек** (`.env.example`) в репозитории, реальные значения — вне.",
        "**Задайте переводы строк в `.gitattributes`** (`* text=auto` или явные правила) и проверьте `git ls-files --eol`.",
        "**Переименовывайте через `git mv`** (или хотя бы одним коммитом без правки содержимого), чтобы `--follow` находил историю.",
        "**После изменения `.gitignore` для уже отслеживаемых файлов** выполните `git rm --cached` и закоммитьте.",
      ),
    ]),

    section("edge-cases", [
      h("Принудительное добавление"),
      code("text", `$ git add debug.log
The following paths are ignored by one of your .gitignore files:
debug.log
hint: Use -f if you really want to add them.
hint: Turn this message off by running
hint: "git config advice.addIgnoredFile false"
$ git add -f important.log
$ git status -s
A  important.log
?? .gitignore
$ git ls-files
important.log`, { filename: "сеанс: add и игнорируемые файлы" }),
      p("`git add` отказывается добавлять игнорируемый файл и подсказывает `-f`; с `-f` файл попадает в индекс и дальше отслеживается как обычный (игнорирование на него уже не действует)."),
      h("Прочие нюансы"),
      ul(
        "**Игнорирование и каталоги:** Git не отслеживает пустые каталоги; оставляйте в нужном каталоге пустой `.gitkeep`.",
        "**Вложенные `.gitignore`:** лежат в подкаталогах и действуют на каталог и ниже; правила глубже перекрывают правила выше.",
        "**Пробелы в конце шаблона** игнорируются, если не экранированы обратной косой чертой.",
        "**Пути с `#` или `!` в начале** экранируют обратной косой чертой (`\\#файл`).",
        "**`git clean -X`** удаляет только игнорируемые файлы, `-x` — и игнорируемые, и неотслеживаемые (осторожно).",
      ),
    ]),

    section("related", [
      ul(
        "[Рабочее дерево, индекс и репозиторий](/learn/git/three-areas) — индекс определяет, какие файлы отслеживаются.",
        "[Отмена изменений](/learn/git/undoing-changes) — `git clean` и `restore`, когда мусор уже появился.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Без правил",
          code: `
            git status -s
            ?? .env
            ?? app.py
            ?? build/
            ?? debug.log
            ?? keep.tmp
            ?? notes.tmp
          `,
          note: "Шесть записей, из которых значима одна: легко закоммитить секрет или артефакты сборки.",
        },
        {
          title: "С .gitignore",
          code: `
            git status -s
            ?? .gitignore
            ?? app.py
            ?? keep.tmp
          `,
          note: "Остаётся то, что относится к проекту; всё лишнее скрыто и проверяется `check-ignore`.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.gitignore-tracking.ex1",
      title: "Напишите .gitignore",
      difficulty: "foundation",
      kind: "application",
      prompt: [
        p("В проекте есть: исходник `app.py`, журналы `*.log`, каталог `build/`, локальные настройки `.env`, временные файлы `*.tmp` — но `keep.tmp` нужен в репозитории. Напишите `.gitignore` и проверьте его командами `git status -s`, `git status -s --ignored` и `git check-ignore -v`."),
      ],
      hints: [
        "Для каталога добавьте слеш в конце.",
        "Исключение пишется после общего правила и начинается с `!`.",
        "`check-ignore -v` называет правило — проверьте исключение отдельно.",
      ],
      checks: ["Игнорируются `*.log`, `build/`, `.env`, `*.tmp`", "`keep.tmp` не игнорируется", "`app.py` и `.gitignore` видны", "`git add debug.log` отказывает"],
      solution: [
        code("text", `$ git status -s
?? .env
?? app.py
?? build/
?? debug.log
?? keep.tmp
?? notes.tmp
$ cat .gitignore
# журналы и сборка
*.log
build/
# локальные настройки
.env
# временные файлы, кроме keep.tmp
*.tmp
!keep.tmp
$ git status -s
?? .gitignore
?? app.py
?? keep.tmp
$ git status -s --ignored
?? .gitignore
?? app.py
?? keep.tmp
!! .env
!! build/
!! debug.log
!! notes.tmp
$ git check-ignore -v debug.log build/out.bin keep.tmp notes.tmp
.gitignore:2:*.log	debug.log
.gitignore:3:build/	build/out.bin
.gitignore:8:!keep.tmp	keep.tmp
.gitignore:7:*.tmp	notes.tmp
$ git add debug.log
The following paths are ignored by one of your .gitignore files:
debug.log
hint: Use -f if you really want to add them.
hint: Turn this message off by running
hint: "git config advice.addIgnoredFile false"`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.gitignore-tracking.ex2",
      title: "Файл в .gitignore, а Git следит",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Вы закоммитили `local.cfg`, затем добавили его в `.gitignore`. Но `git status` продолжает показывать ` M local.cfg`. Объясните причину и исправьте ситуацию так, чтобы файл остался на диске, а Git перестал за ним следить. Что важно сделать, если в файле был пароль?"),
      ],
      hints: [
        "Игнорирование действует на файлы, которых нет в индексе.",
        "Нужна команда, удаляющая файл из индекса, но не с диска.",
        "Подумайте о том, что находится в прошлых коммитах.",
      ],
      checks: ["Объяснено: файл в индексе — `.gitignore` не действует", "Выполнен `git rm --cached` и коммит", "Файл на диске сохранён", "Упомянуто: секрет остался в истории — заменить"],
      solution: [
        code("text", `$ git status -s
 M local.cfg
?? .gitignore
# файл уже отслеживается — .gitignore на него не действует
$ git check-ignore -v local.cfg
$ git rm --cached local.cfg
rm 'local.cfg'
$ git status -s
D  local.cfg
?? .gitignore
$ git commit -m "Перестать отслеживать local.cfg"
[main 3348ab7] Перестать отслеживать local.cfg
 1 file changed, 1 deletion(-)
 delete mode 100644 local.cfg
$ git status -s
?? .gitignore
$ cat local.cfg
debug=2
$ git check-ignore -v local.cfg
.gitignore:1:local.cfg	local.cfg`, { filename: "решение" }),
        ul(
          "Причина: файл уже в индексе, а `.gitignore` относится только к неотслеживаемым файлам.",
          "Исправление: `git rm --cached local.cfg`, коммит; после этого `check-ignore` называет правило.",
          "Если там был пароль, считайте его скомпрометированным: он остался в прошлом коммите и клонах — смените и при необходимости очистите историю.",
        ),
      ],
    }),
    exercise({
      id: "git.gitignore-tracking.ex3",
      title: "Исключение не работает",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("В `.gitignore` написано `logs/` и `!logs/keep.txt`, но файл `logs/keep.txt` по-прежнему игнорируется. Найдите правило, которое его скрывает, и исправьте `.gitignore`. Заодно объясните, почему `/todo.txt` не скрыл `src/todo.txt`, а `docs/*.md` — `docs/api/ref.md`."),
      ],
      hints: [
        "`git check-ignore -v` покажет правило и строку.",
        "Что именно исключает шаблон с завершающим слешем: каталог или его содержимое?",
        "Слеш в начале и в середине шаблона привязывает его к каталогу с `.gitignore`.",
      ],
      checks: ["`check-ignore -v` указывает `.gitignore:3:logs/`", "Заменено `logs/` на `logs/*`", "`logs/keep.txt` виден, `logs/app.log` скрыт", "Объяснена привязка `/todo.txt` и `docs/*.md`"],
      solution: [
        code("text", `$ cat .gitignore
/todo.txt
docs/*.md
logs/
!logs/keep.txt
$ git status -s -uall
?? .gitignore
?? docs/api/ref.md
?? src/todo.txt
# правило /todo.txt привязано к корню: src/todo.txt не игнорируется
# docs/*.md не заходит в подкаталоги: docs/api/ref.md виден
# исключение !logs/keep.txt не работает, пока игнорируется весь каталог logs/
$ git check-ignore -v logs/keep.txt
.gitignore:3:logs/	logs/keep.txt
$ cat .gitignore
/todo.txt
docs/*.md
logs/*
!logs/keep.txt
$ git status -s -uall
?? .gitignore
?? docs/api/ref.md
?? logs/keep.txt
?? src/todo.txt`, { filename: "решение" }),
        ul(
          "Правило `logs/` исключает сам каталог, а вернуть файл из исключённого каталога нельзя. Правило `logs/*` исключает содержимое, и `!logs/keep.txt` сработало.",
          "`/todo.txt` привязан к корню; `docs/*.md` — к каталогу `docs` и не заходит глубже (для любой глубины пишут `docs/**/*.md`).",
        ),
      ],
    }),
  ],

  challenge: {
    id: "git.gitignore-tracking.challenge",
    title: "Репозиторий для команды на Windows и Linux",
    scenario: [
      p("В проекте есть исходник, два скрипта (`run.sh` для Linux, `run.bat` для Windows, в последнем строки заканчиваются `CRLF`), секретный `.env`, пример `.env.example` и каталог сборки `build/`. Подготовьте репозиторий так, чтобы секрет и сборка не попали в историю, а переводы строк хранились одинаково независимо от настроек участников."),
    ],
    requirements: [
      "`.gitignore` исключает `build/` и `.env`, но не `.env.example`",
      "`.gitattributes` задаёт `LF` для `*.sh` и `CRLF` для `*.bat`",
      "Подготовьте всё командой `git add -A` и проверьте результат",
      "Проверьте правила командой `check-ignore -v`, переводы строк — `ls-files --eol`",
    ],
    constraints: [
      "Не использовать `git add -f`",
      "Не удалять `.env` с диска",
    ],
    acceptance: [
      "В статусе нет `.env` и `build/`; есть `.env.example`, `.gitignore`, `.gitattributes`",
      "`check-ignore -v` объясняет оба правила и молчит про `.env.example`",
      "`run.bat`: в индексе `lf`, в рабочем дереве `crlf`; `run.sh` — `lf` в обоих",
    ],
    hints: [
      "Шаблон `.env` совпадает только с файлом точно с таким именем.",
      "Атрибуты записываются парами «шаблон — атрибуты» в `.gitattributes`.",
      "В выводе `ls-files --eol` смотрите на столбцы `i/` и `w/`.",
    ],
    solution: [
      code("text", `$ git add -A
$ git status -s
A  .env.example
A  .gitattributes
A  .gitignore
A  app.py
A  run.bat
A  run.sh
$ git check-ignore -v .env build/out.bin .env.example
.gitignore:2:.env	.env
.gitignore:1:build/	build/out.bin
$ git ls-files --eol
i/lf    w/lf    attr/                 	.env.example
i/lf    w/lf    attr/                 	.gitattributes
i/lf    w/lf    attr/                 	.gitignore
i/lf    w/lf    attr/                 	app.py
i/lf    w/crlf  attr/text eol=crlf    	run.bat
i/lf    w/lf    attr/text eol=lf      	run.sh`, { filename: "решение" }),
      p("Индекс хранит `LF` для обоих скриптов, а `run.bat` на диске остаётся с `CRLF`, как требует Windows. `.env` игнорируется, а `.env.example` — часть проекта. Оба файла настроек (`.gitignore`, `.gitattributes`) подготовлены вместе с остальным — они должны быть в репозитории, чтобы правила разделила вся команда."),
    ],
  },

  interview: [
    iq("git.gitignore-tracking.i1", "basic", "Для чего нужен `.gitignore`?", [
      ul(
        "Для перечисления шаблонов файлов, которые Git не должен показывать как неотслеживаемые и не добавляет при `git add .`.",
        "Применяется к сборкам, зависимостям, журналам, локальным настройкам.",
        "Файл лежит в репозитории и действует для всей команды.",
      ),
    ]),
    iq("git.gitignore-tracking.i2", "basic", "Почему файл из `.gitignore` всё равно отображается в `git status`?", [
      ul(
        "Вероятно, он уже отслеживается: `.gitignore` действует только на файлы, которых нет в индексе.",
        "Решение: `git rm --cached файл` и коммит; файл остаётся на диске.",
        "Проверка: `git ls-files | grep файл` и `git check-ignore -v файл`.",
      ),
    ]),
    iq("git.gitignore-tracking.i3", "intermediate", "Чем `.gitignore` отличается от `.git/info/exclude` и глобального списка?", [
      ul(
        "`.gitignore` — в репозитории, общий для команды.",
        "`.git/info/exclude` — локальный для одного клона, не коммитится.",
        "`core.excludesFile` — личный для всех репозиториев пользователя (файлы редактора и ОС).",
      ),
    ]),
    iq("git.gitignore-tracking.i4", "intermediate", "Как вернуть в отслеживаемые файл из игнорируемого каталога?", [
      ul(
        "Правило `logs/` исключает сам каталог — вернуть из него файл нельзя.",
        "Замените на `logs/*` и добавьте `!logs/keep.txt`.",
        "Или добавьте файл принудительно `git add -f`, но тогда правило не защищает его от случайного удаления.",
      ),
    ]),
    iq("git.gitignore-tracking.i5", "intermediate", "Как Git «хранит» переименования?", [
      ul(
        "Не хранит: коммит содержит снимки; переименование вычисляется сравнением содержимого (по умолчанию от 50% сходства).",
        "`git mv` равносилен `mv` + `git add`; в статусе `R`, в коммите `rename … (100%)`.",
        "`git log --follow -- файл` прослеживает историю через переименования.",
      ),
    ]),
    iq("git.gitignore-tracking.i6", "advanced", "Как организовать переводы строк в команде, где работают на Windows и Linux?", [
      ul(
        "Положить в репозиторий `.gitattributes`: например `* text=auto` и явные `*.sh text eol=lf`, `*.bat text eol=crlf`.",
        "Проверять `git ls-files --eol`: в индексе должен быть `lf`.",
        "Не полагаться на `core.autocrlf` у каждого участника: настройка локальна и приводит к расхождению.",
      ),
    ]),
    iq("git.gitignore-tracking.i7", "engineering", "Какие файлы вы добавляете в `.gitignore` нового проекта, а какие намеренно оставляете в репозитории?", [
      ul(
        "Игнорирую: сборки, зависимости, кэши, журналы, локальные настройки и секреты; личные файлы редактора — в глобальный список.",
        "Оставляю: исходники, lock-файлы зависимостей, пример настроек (`.env.example`), миграции, `.gitignore` и `.gitattributes`.",
        "Правила проверяю `git check-ignore -v` и первым коммитом фиксирую.",
      ),
    ]),
    iq("git.gitignore-tracking.i8", "debugging", "В репозитории оказался закоммиченный `.env` с паролем. Что делаете?", [
      ul(
        "Меняю пароль — он считается скомпрометированным.",
        "`git rm --cached .env`, добавляю в `.gitignore`, коммит.",
        "Если репозиторий опубликован — очищаю историю (`git filter-repo` или аналог) и согласую с командой; все клоны должны получить очищенную историю.",
        "Включаю проверки секретов перед коммитом.",
      ),
    ]),
  ],

  exam: [
    mcq("git.gitignore-tracking.e1", "foundation", "Какие файлы игнорирует `.gitignore`?", ["Любые файлы репозитория", "Только каталоги", "Только неотслеживаемые файлы", "Только файлы больше 1 МБ"], 2, "Игнорирование не действует на файлы, которые уже в индексе: для них нужен `git rm --cached`."),
    mcq("git.gitignore-tracking.e2", "foundation", "Что означает завершающий слеш в шаблоне `build/`?", ["Только каталоги с таким именем", "Только файлы с именем `build`", "Любые файлы в подкаталогах", "Исключение из правил"], 0, "Слеш в конце ограничивает шаблон каталогами. Без слеша совпадут и файлы, и каталоги с таким именем."),
    mcq("git.gitignore-tracking.e3", "foundation", "Какая команда показывает, какое правило игнорирует файл?", ["`git status --short`", "`git ls-files --ignored-by`", "`git log --ignore`", "`git check-ignore -v путь`"], 3, "`check-ignore -v` печатает файл, номер строки и шаблон, например `.gitignore:2:*.log debug.log`."),
    mcq("git.gitignore-tracking.e4", "intermediate", "Как прекратить отслеживание файла, оставив его на диске?", ["`git rm файл`", "`git rm --cached файл`", "`git clean файл`", "`git restore --staged файл`"], 1, "`--cached` удаляет запись из индекса, не трогая файл на диске. Обычный `git rm` удалил бы и файл."),
    mcq("git.gitignore-tracking.e5", "intermediate", "Правила `logs/` и `!logs/keep.txt`: что произойдёт с `logs/keep.txt`?", ["Будет отслеживаться", "Появится ошибка", "Будет удалён", "Останется игнорируемым: родительский каталог исключён целиком"], 3, "Документация gitignore: нельзя вернуть файл, если исключён его родительский каталог. Нужно правило `logs/*`."),
    mcq("git.gitignore-tracking.e6", "intermediate", "Где лучше хранить правила для файлов вашего редактора?", ["В `.gitignore` проекта", "В истории коммитов", "В глобальном списке (`core.excludesFile`)", "В каждом файле"], 2, "Файлы редактора относятся к вашей среде, а не к проекту; глобальный список работает во всех репозиториях и не навязывает правила команде."),
    mcq("git.gitignore-tracking.e7", "advanced", "Что означает строка `i/lf w/crlf attr/text eol=crlf run.bat` в `git ls-files --eol`?", ["В индексе `CRLF`, на диске `LF`", "В индексе `LF`, на диске `CRLF`, действует правило `text eol=crlf`", "Файл повреждён", "Файл игнорируется"], 1, "`i/` — перевод строк в индексе, `w/` — в рабочем дереве, `attr/` — действующие атрибуты. Нормализация хранит `LF`, а на диске `CRLF`."),
    open("git.gitignore-tracking.e8", "intermediate", "Опишите, где Git ищет правила игнорирования и как разрешаются конфликты между правилами.", [
      ul(
        "Источники: `.gitignore` в каталоге файла и выше, `.git/info/exclude`, глобальный `core.excludesFile`.",
        "Внутри файла побеждает последнее подходящее правило; правила глубже по каталогам перекрывают правила выше.",
        "`!` отменяет предыдущее, но не возвращает файл из исключённого каталога.",
        "`git check-ignore -v` показывает сработавшее правило.",
      ),
    ], ["Названы три источника", "Описан приоритет «последнее побеждает»", "Упомянуто ограничение с каталогами", "Названа проверка `check-ignore -v`"]),
  ],

  mastery: [
    mcq("git.gitignore-tracking.m1", "intermediate", "Шаблон `docs/*.md` и файл `docs/api/ref.md`. Игнорируется ли файл?", ["Нет: `*` не пересекает границы каталогов", "Да", "Да, если файл новый", "Зависит от ветки"], 0, "`*` не совпадает с `/`, поэтому шаблон охватывает `docs/guide.md`, но не файлы в подкаталогах. Для любой глубины используют `docs/**/*.md`."),
    mcq("git.gitignore-tracking.m2", "advanced", "Файл `secrets.env` добавлен в `.gitignore`, но уже есть в предыдущем коммите. Какие утверждения верны? Выберите все.", ["Файл всё ещё отслеживается", "Секрет остался в истории", "Достаточно удалить файл с диска, чтобы секрет исчез", "Нужен `git rm --cached` и замена секрета"], [0, 1, 3], "Игнорирование не влияет на отслеживаемые файлы, а история неизменяема: секрет остаётся в старых коммитах и клонах, его надо заменить."),
    mcq("git.gitignore-tracking.m3", "advanced", "Что произойдёт при `git add -f debug.log`, если `*.log` игнорируется?", ["Ошибка", "Файл будет удалён", "Файл будет добавлен в индекс и дальше отслеживаться", "Правило будет удалено из `.gitignore`"], 2, "`-f` добавляет игнорируемый файл в индекс. После этого он отслеживается и игнорирование на него не действует."),
    open("git.gitignore-tracking.m4", "advanced", "Вы подключаетесь к проекту, где коллеги жалуются на «бесконечные» конфликты и diff на весь файл в скриптах. Как диагностируете и устраните причину, связанную с переводами строк?", [
      ul(
        "Диагностика: `git ls-files --eol` покажет смесь `crlf`/`lf` в индексе; `git diff --stat` и `git diff -w`/`--ignore-space-at-eol` покажут, что различия только в пробелах в конце строки.",
        "Решение: добавить `.gitattributes` с `* text=auto` и явными `*.sh text eol=lf`, `*.bat text eol=crlf`; выполнить нормализацию (`git add --renormalize .`) и закоммитить отдельным коммитом.",
        "Профилактика: правила хранятся в репозитории, а не в личных `core.autocrlf` участников; в проверках — `git ls-files --eol`.",
      ),
    ], ["Диагностика по `ls-files --eol`", "Решение через `.gitattributes`", "Отдельный коммит нормализации", "Профилактика"], { format: "debug" }),
  ],

  flashcards: [
    { id: "git.gitignore-tracking.f1", front: "Что игнорирует .gitignore?", back: "Только неотслеживаемые файлы. Отслеживаемые остаются под наблюдением." },
    { id: "git.gitignore-tracking.f2", front: "Как перестать отслеживать файл?", back: "git rm --cached файл; затем коммит. Файл остаётся на диске." },
    { id: "git.gitignore-tracking.f3", front: "Какое правило сработало?", back: "git check-ignore -v путь → файл:строка:шаблон." },
    { id: "git.gitignore-tracking.f4", front: "Приоритет правил?", back: "В файле — последнее подходящее; вложенные .gitignore перекрывают вышележащие." },
    { id: "git.gitignore-tracking.f5", front: "Исключение из игнорируемого каталога?", back: "Нельзя при logs/ — работает logs/* и !logs/keep.txt." },
    { id: "git.gitignore-tracking.f6", front: "Личные правила?", back: ".git/info/exclude (этот клон) и core.excludesFile (все репозитории)." },
    { id: "git.gitignore-tracking.f7", front: "git mv?", back: "mv + git add; Git распознаёт переименование по содержимому (git log --follow)." },
    { id: "git.gitignore-tracking.f8", front: "git ls-files --eol?", back: "i/ — в индексе, w/ — в рабочем дереве, attr/ — атрибуты. Правила — в .gitattributes." },
  ],

  sources: [
    { title: "Pro Git: Recording Changes to the Repository (Ignoring Files)", url: "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository", publisher: "Git" },
    { title: "Git documentation: gitignore", url: "https://git-scm.com/docs/gitignore", publisher: "Git" },
    { title: "Git documentation: gitattributes", url: "https://git-scm.com/docs/gitattributes", publisher: "Git" },
    { title: "Git documentation: git-check-ignore", url: "https://git-scm.com/docs/git-check-ignore", publisher: "Git" },
    { title: "Git documentation: git-rm", url: "https://git-scm.com/docs/git-rm", publisher: "Git" },
    { title: "Git documentation: git-mv", url: "https://git-scm.com/docs/git-mv", publisher: "Git" },
    { title: "Pro Git: Git Attributes", url: "https://git-scm.com/book/en/v2/Customizing-Git-Git-Attributes", publisher: "Git" },
    { title: "GitHub: collection of .gitignore templates", url: "https://github.com/github/gitignore", publisher: "Other" },
  ],
};
