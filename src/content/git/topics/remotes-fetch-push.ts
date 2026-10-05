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

export const remotesFetchPush: Topic = {
  id: "git.remotes-fetch-push",
  slug: "remotes-fetch-push",
  domain: "git",
  module: "collaboration",
  title: "Удалённые репозитории: remote, fetch, pull, push",
  titleEn: "Remotes: remote, fetch, pull, push",
  summary:
    "Распределённость Git проявляется в обмене между репозиториями. Тема на опытах с настоящими репозиториями (сервер — «голый» репозиторий, два клона) объясняет, что такое remote и ветки слежения `origin/main`, чем `fetch` отличается от `pull`, как работает `push -u` и связь с upstream, почему `git status` может «не знать» о чужих коммитах, как удалять удалённые ветки и подключать несколько remote (например, форк и оригинал).",
  minutes: 80,
  prerequisites: ["git.branches-head", "git.merge", "git.git-mental-model"],
  tags: ["git remote", "git clone", "git fetch", "git pull", "git push", "origin", "upstream", "remote-tracking branch", "bare repository", "git push -u", "--prune", "git ls-remote", "fork"],
  keyConcepts: [
    { term: "Remote — имя для адреса репозитория", text: "`git remote add origin <путь или URL>` записывает в `.git/config` адрес и правило копирования веток `+refs/heads/*:refs/remotes/origin/*`. `git clone` создаёт `origin` автоматически." },
    { term: "`origin/main` — локальная копия состояния сервера", text: "Ветка слежения обновляется только при обмене (`fetch`, `pull`, `push`). Это ваш последний известный снимок чужой ветки; коммитить в неё нельзя." },
    { term: "`fetch` скачивает, но ничего не меняет у вас", text: "В опыте `git status` до `fetch` сказал `up to date`, хотя Боб уже отправил коммит; после `fetch` — `behind 'origin/main' by 1 commit`. Рабочее дерево и локальная `main` не тронуты." },
    { term: "`pull` = `fetch` + слияние", text: "`git pull` скачивает и сразу вливает ветку слежения в текущую ветку. В расходящейся истории требуется явно выбрать стратегию (следующая тема)." },
    { term: "`push -u` связывает локальную ветку с удалённой", text: "`git push -u origin main` отправил ветку и записал `branch.main.remote=origin`, `branch.main.merge=refs/heads/main`; после этого `git push`, `git pull` и `git status` знают, с чем сравнивать." },
  ],
  sections: [
    section("definition", [
      def("Удалённый репозиторий (remote)", "Другой репозиторий Git, с которым вы обмениваетесь коммитами. В настройках хранится как имя + адрес: `origin /srv/git/project.git`. Адрес может быть путём, `ssh` или `https`.", "remote"),
      def("origin", "Имя remote по умолчанию: так называется репозиторий, из которого вы клонировали. Это обычное имя, ему можно дать другое.", "origin"),
      def("Ветка слежения", "Ссылка `refs/remotes/<remote>/<ветка>` (например `origin/main`): локальная копия положения ветки на сервере при последнем обмене. Обновляется только `fetch`, `pull`, `push`.", "remote-tracking branch"),
      def("Upstream", "Ветка слежения, с которой связана локальная ветка. Записывается в `branch.<имя>.remote` и `branch.<имя>.merge`; её используют `git status`, `git pull` и `git push` без аргументов.", "upstream branch"),
      def("Голый репозиторий", "Репозиторий без рабочего дерева (`git init --bare`): только база объектов и ссылки. Именно такие репозитории хранят на серверах для обмена.", "bare repository"),
      def("fetch", "Скачивание недостающих объектов и обновление веток слежения без изменения рабочего дерева и локальных веток.", "fetch"),
      def("pull", "Команда `fetch` с последующим слиянием (или перебазированием) ветки слежения в текущую ветку.", "pull"),
      def("push", "Отправка локальных коммитов на сервер и обновление ветки на нём. Сервер принимает её только как перемотку вперёд (иначе `rejected`).", "push"),
    ]),

    section("why", [
      h("Работать вдвоём — значит обмениваться коммитами"),
      p("Каждый репозиторий Git самодостаточен, но проект делает команда. Коммиты нужно передавать между копиями, и для этого достаточно двух операций: забрать чужое и отдать своё. Сервер (GitHub, GitLab или просто `git init --bare` на общем диске) — это договорённость: общее место, куда все отправляют и откуда забирают."),
      ul(
        "**Совместная работа.** Коллега опубликовал коммит — вы получаете его `fetch`; вы закончили задачу — отправляете `push`.",
        "**Резервная копия.** Опубликованная ветка существует вне вашего компьютера.",
        "**Контроль.** `fetch` безопасен: вы сначала смотрите, что пришло (`git log main..origin/main`), и только потом решаете, как объединять.",
        "**Форки и несколько источников.** Можно подключить сколько угодно remote: свой форк и оригинал, зеркало, сервер сборки.",
      ),
      tip("Привыкните различать «у меня» и «у них»: `main` — ваша ветка, `origin/main` — ваша последняя копия чужой. `git fetch` сближает копию с сервером, а `merge`/`pull` — вашу ветку с копией."),
    ]),

    section("mental-model", [
      h("Четыре места"),
      diagram(
        `
        рабочая копия Алисы                                  сервер (bare)
        ┌──────────────────────────────────┐   push   ┌────────────────────────┐
        │ main ──────► коммиты              │ ───────► │ refs/heads/main        │
        │ origin/main (копия сервера)       │ ◄─────── │ коммиты                │
        └──────────────────────────────────┘  fetch    └────────────────────────┘
                                                              ▲   │
        рабочая копия Боба                                    │   │ fetch/clone
        ┌──────────────────────────────────┐   push           │   ▼
        │ main                              │ ─────────────────┘
        │ origin/main                       │
        └──────────────────────────────────┘
        `,
        "Обмен идёт через сервер: `push` обновляет ветку на нём, `fetch` обновляет `origin/*` у каждого участника.",
      ),
      h("fetch и pull"),
      table(
        ["Команда", "Что обновляет", "Трогает ли рабочее дерево и локальные ветки"],
        [
          ["`git fetch`", "Базу объектов и ветки слежения `origin/*`", "Нет"],
          ["`git merge origin/main`", "Текущую ветку (вливает копию сервера)", "Да"],
          ["`git pull`", "То же, что `fetch` + `merge origin/<ветка>` (или `rebase`)", "Да"],
          ["`git push`", "Ветку на сервере и `origin/*` у вас", "Нет (удалённая сторона обновляется, ваши файлы — нет)"],
        ],
        "Что делает каждая команда",
      ),
      insight("`pull` — это сокращение, а не отдельная операция. Если вы понимаете `fetch` и `merge`, вы понимаете и `pull`; если нет — `pull` будет временами «ломать» ваш проект."),
    ]),

    section("technical", [
      h("Настройка remote"),
      table(
        ["Команда", "Действие"],
        [
          ["`git remote -v`", "Список remote с адресами для получения (`fetch`) и отправки (`push`)"],
          ["`git remote add имя URL`", "Добавить remote"],
          ["`git remote rename старое новое`", "Переименовать (ветки слежения тоже)"],
          ["`git remote set-url имя URL`", "Изменить адрес"],
          ["`git remote remove имя`", "Удалить remote и его ветки слежения"],
          ["`git remote show имя`", "Подробности: адреса, ветки, связи для `pull` и `push`"],
          ["`git ls-remote имя`", "Список ссылок на сервере без скачивания объектов"],
        ],
        "Команды git remote",
      ),
      h("clone, fetch, push"),
      ul(
        "**`git clone URL [каталог]`** — копирует все объекты и ссылки, создаёт `origin`, ветки слежения, создаёт и переключает локальную ветку по умолчанию, настраивает upstream.",
        "**`git fetch [remote]`** — скачивает новые объекты и обновляет `origin/*`; ничего не меняет в ваших ветках и файлах. `--prune` удаляет ветки слежения для веток, которых больше нет на сервере.",
        "**`git pull`** — `fetch` и слияние; `--ff-only` — слияние только перемоткой, `--rebase` — перебазирование вместо слияния.",
        "**`git push [remote ветка]`** — отправляет коммиты ветки; `-u` (`--set-upstream`) связывает её с удалённой; `--delete` удаляет ветку на сервере.",
      ),
      h("Upstream и git status"),
      p("Когда у локальной ветки есть upstream, `git status` пишет, как она соотносится с веткой слежения: `up to date`, `ahead N`, `behind N` или `diverged`. Но сравнение идёт с **последней сохранённой копией** `origin/main`, а не с сервером: без `fetch` Git о новых коммитах не знает. `git branch -vv` показывает те же сведения для всех веток (`[origin/main: behind 1]`)."),
      h("Протоколы"),
      p("Адрес remote может быть локальным путём (как в опытах этой темы), `file://`, `ssh://` или `https://`. Способ доступа и аутентификация (ключи SSH, токены, менеджеры учётных данных) к модели Git не относятся: объекты и ссылки передаются одинаково."),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git clone /srv/git/project.git
git remote add origin /srv/git/project.git
git remote -v
git fetch
git fetch --prune
git pull --ff-only
git push -u origin main
git push origin --delete feature
git branch -vv`,
        [
          { line: 1, text: "Клонировать репозиторий: появляются каталог, `origin`, ветки слежения." },
          { line: [2, 3], text: "Подключить репозиторий-сервер к существующему локальному и проверить адреса." },
          { line: [4, 5], text: "Скачать новое с сервера; `--prune` ещё и удалит «мёртвые» ветки слежения." },
          { line: 6, text: "Скачать и влить только перемоткой: безопасная форма `pull`." },
          { line: 7, text: "Отправить ветку и запомнить связь с удалённой (`-u`)." },
          { line: 8, text: "Удалить ветку на сервере." },
          { line: 9, text: "Показать ветки, их upstream и расхождение (`ahead`/`behind`)." },
        ],
        "команды обмена",
      ),
    ]),

    section("minimal-example", [
      h("Опубликовать локальный репозиторий"),
      p("Сервер — «голый» репозиторий `/srv/git/project.git`. У Алисы локальный репозиторий с одним коммитом. Подключаем сервер и отправляем ветку:"),
      code("text", `$ git remote -v
$ git remote add origin /srv/git/project.git
$ git remote -v
origin	/srv/git/project.git (fetch)
origin	/srv/git/project.git (push)
$ git push -u origin main
To /srv/git/project.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
$ git branch -vv
* main 6fc049f [origin/main] Первый коммит
$ git remote show origin
* remote origin
  Fetch URL: /srv/git/project.git
  Push  URL: /srv/git/project.git
  HEAD branch: main
  Remote branch:
    main tracked
  Local branch configured for 'git pull':
    main merges with remote main
  Local ref configured for 'git push':
    main pushes to main (up to date)
$ git ls-remote origin
6fc049f5eb67d960194f773eab7c483fef1887f2	HEAD
6fc049f5eb67d960194f773eab7c483fef1887f2	refs/heads/main
$ git config --get-regexp '^(remote|branch)\\.'
remote.origin.url /srv/git/project.git
remote.origin.fetch +refs/heads/*:refs/remotes/origin/*
branch.main.remote origin
branch.main.merge refs/heads/main`, { filename: "сеанс: remote add и push -u" }),
      ul(
        "До `remote add` команда `git remote -v` пуста: у репозитория нет связей.",
        "`git push -u origin main` напечатала `* [new branch] main -> main` и `branch 'main' set up to track 'origin/main'`.",
        "`git branch -vv` — `[origin/main]` без пометок: локальная ветка совпадает с веткой слежения.",
        "`git remote show origin` описывает связи: `main merges with remote main` (для `pull`) и `main pushes to main (up to date)` (для `push`).",
        "`git ls-remote origin` показал, что на сервере `HEAD` и `main` указывают на `6fc049f` — столько же, сколько у Алисы.",
        "`git config --get-regexp` показал, как всё записано: `remote.origin.url`, правило `remote.origin.fetch` и связь `branch.main.remote`/`branch.main.merge`.",
      ),
    ]),

    section("detailed-example", [
      h("Коллега отправил коммит: fetch и слияние"),
      p("Боб клонировал репозиторий, сделал коммит и отправил его. Алиса ничего не делала. Смотрим её репозиторий:"),
      code("text", `# Алиса ещё не знает о коммите Боба: ссылка origin/main устарела
$ git status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
$ git fetch
From /srv/git/project
   6fc049f..12f5847  main       -> origin/main
$ git status
On branch main
Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)

nothing to commit, working tree clean
$ git log --oneline main..origin/main
12f5847 Коммит Боба
$ git diff --stat main origin/main
 bob.txt | 1 +
 1 file changed, 1 insertion(+)
$ git branch -vv
* main 6fc049f [origin/main: behind 1] Первый коммит
$ git merge origin/main
Updating 6fc049f..12f5847
Fast-forward
 bob.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 bob.txt
$ git branch -vv
* main 12f5847 [origin/main] Коммит Боба`, { filename: "сеанс: fetch и состояние ветки" }),
      ul(
        "До `fetch` `git status` уверенно говорит `up to date`: Алиса не знает о коммите Боба, ветка слежения устарела.",
        "`git fetch` напечатала `From /srv/git/project` и `6fc049f..12f5847 main -> origin/main`: ветка слежения сдвинулась. Локальная `main` и файлы не изменились.",
        "`git status` теперь `behind 'origin/main' by 1 commit, and can be fast-forwarded`; `git log main..origin/main` и `git diff --stat main origin/main` показывают, что пришло.",
        "`git branch -vv` — `[origin/main: behind 1]`; `git merge origin/main` выполнил перемотку, `git pull` сделал бы то же одной командой.",
      ),
      h("Клон: что создаётся автоматически"),
      code("text", `$ git clone /srv/git/project.git bob
Cloning into 'bob'...
done.
$ cd bob
$ git log --oneline --all --decorate
0f41cbd (HEAD -> main, origin/main, origin/HEAD) Второй коммит
6fc049f Первый коммит
$ git branch -a
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/main
$ git remote -v
origin	/srv/git/project.git (fetch)
origin	/srv/git/project.git (push)
$ find .git/refs -type f | sort
.git/refs/heads/main
.git/refs/remotes/origin/HEAD
$ cat .git/packed-refs
# pack-refs with: peeled fully-peeled sorted 
0f41cbd853d3baafbb917b1e97ea406004dde689 refs/remotes/origin/main
$ git rev-parse origin/main
0f41cbd853d3baafbb917b1e97ea406004dde689
$ git status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`, { filename: "сеанс: git clone" }),
      ul(
        "`git clone` создал каталог, `origin`, ветку слежения `origin/main` и локальную `main` (отмечена `HEAD -> main, origin/main, origin/HEAD`).",
        "Ссылки удалённых веток хранятся не обязательно отдельными файлами: в опыте они лежат в `.git/packed-refs` (формат «хэш ссылка»); `.git/refs/remotes/origin/HEAD` указывает на ветку по умолчанию.",
        "`git status` сразу показывает связь: `up to date with 'origin/main'`.",
      ),
    ]),

    section("analysis", [
      h("Ветки на сервере и удаление"),
      code("text", `$ git push -u origin feature
To /srv/git/project.git
 * [new branch]      feature -> feature
branch 'feature' set up to track 'origin/feature'.
$ git branch -a
* feature
  main
  remotes/origin/feature
  remotes/origin/main
$ git branch -r
  origin/feature
  origin/main
# у Боба: новая ветка появляется после fetch
$ git fetch
From /srv/git/project
 * [new branch]      feature    -> origin/feature
$ git branch -a
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/feature
  remotes/origin/main
$ git switch feature
Switched to a new branch 'feature'
branch 'feature' set up to track 'origin/feature'.
$ git branch -vv
* feature 903d368 [origin/feature] Фича
  main    6fc049f [origin/main] Первый коммит
# Алиса удаляет ветку на сервере
$ git push origin --delete feature
To /srv/git/project.git
 - [deleted]         feature
$ git branch -r
  origin/HEAD -> origin/main
  origin/feature
  origin/main
$ git fetch --prune
From /srv/git/project
 - [deleted]         (none)     -> origin/feature
$ git branch -r
  origin/HEAD -> origin/main
  origin/main`, { filename: "сеанс: удалённые ветки" }),
      table(
        ["Шаг", "Результат", "Объяснение"],
        [
          ["`git push -u origin feature`", "`* [new branch] feature -> feature`, upstream настроен", "Ветка создана на сервере и связана с локальной"],
          ["`git branch -a` / `-r`", "Добавились `remotes/origin/feature`", "Ветки слежения отмечены `remotes/`; `-r` — только они"],
          ["У Боба `git fetch`", "`* [new branch] feature -> origin/feature`", "Новая ветка появилась только как ветка слежения"],
          ["`git switch feature` у Боба", "`branch 'feature' set up to track 'origin/feature'`", "Локальная ветка создаётся автоматически по имени ветки слежения"],
          ["`git push origin --delete feature`", "`- [deleted] feature`", "Ветка удалена на сервере"],
          ["У Боба `git branch -r` и `git fetch --prune`", "До `--prune` `origin/feature` остаётся, после — `- [deleted] (none) -> origin/feature`", "Ветка слежения не исчезает сама; `--prune` убирает «мёртвые»"],
        ],
        "Жизненный цикл удалённой ветки",
      ),
      h("Несколько remote: форк и оригинал"),
      p("Типичная схема для участия в чужом проекте: `origin` — ваш форк (куда вы можете писать), `upstream` — оригинал (откуда вы только забираете). Чтобы форк не отставал, подтягивайте оригинал и отправляйте результат в свой:"),
      code("text", `# мейнтейнер оригинального репозитория публикует новый коммит
$ git remote add upstream /srv/git/upstream.git
$ git remote -v
origin	/srv/git/project.git (fetch)
origin	/srv/git/project.git (push)
upstream	/srv/git/upstream.git (fetch)
upstream	/srv/git/upstream.git (push)
$ git fetch upstream
From /srv/git/upstream
 * [new branch]      main       -> upstream/main
$ git log --oneline --all --decorate
cbfd238 (upstream/main) Обновление от мейнтейнера
6fc049f (HEAD -> main, origin/main, origin/HEAD) Первый коммит
$ git merge --ff-only upstream/main
Updating 6fc049f..cbfd238
Fast-forward
 app.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git push origin main
To /srv/git/project.git
   6fc049f..cbfd238  main -> main
$ git branch -vv
* main cbfd238 [origin/main] Обновление от мейнтейнера`, { filename: "сеанс: синхронизация форка" }),
      ul(
        "`git remote add upstream …` добавил второй remote; `git remote -v` показывает оба.",
        "`git fetch upstream` скачал ветку оригинала в `upstream/main`, не трогая локальную `main`.",
        "`git merge --ff-only upstream/main` подвинул `main` перемоткой (если бы в форке были свои коммиты, `--ff-only` отказал бы — и пришлось бы выбирать слияние или `rebase`).",
        "`git push origin main` отправил обновление в форк; `origin/main` теперь совпадает.",
      ),
      code("text", `$ git remote add origin /srv/git/project.git
$ git remote add upstream /srv/git/upstream.git
$ git remote -v
origin	/srv/git/project.git (fetch)
origin	/srv/git/project.git (push)
upstream	/srv/git/upstream.git (fetch)
upstream	/srv/git/upstream.git (push)
$ git push -u origin main
To /srv/git/project.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
$ git push upstream main
To /srv/git/upstream.git
 * [new branch]      main -> main
$ git remote rename upstream source
$ git remote set-url source /srv/git/project.git
$ git remote -v
origin	/srv/git/project.git (fetch)
origin	/srv/git/project.git (push)
source	/srv/git/project.git (fetch)
source	/srv/git/project.git (push)
$ git remote remove source
$ git remote
origin`, { filename: "сеанс: управление remote" }),
    ]),

    section("internals", [
      h("Что записано в .git"),
      p("Информация о remote — это обычные строки конфигурации и ссылки:"),
      ul(
        "`remote.origin.url` — адрес; `remote.origin.fetch = +refs/heads/*:refs/remotes/origin/*` — правило **refspec**: ветки сервера `refs/heads/*` копируются в `refs/remotes/origin/*` (плюс означает «обновлять и без перемотки»).",
        "`branch.main.remote` и `branch.main.merge` — upstream локальной ветки `main`: с каким remote и какой удалённой веткой она связана.",
        "Ветки слежения — ссылки `refs/remotes/origin/*` (файлы или записи `packed-refs`).",
      ),
      p("`fetch` читает у сервера список ссылок, определяет, каких объектов не хватает, скачивает их (в упакованном виде) и обновляет ветки слежения по refspec. `push` делает обратное: отправляет недостающие серверу объекты и просит его сдвинуть ссылку — сервер соглашается только на перемотку (если отправляемый коммит является потомком текущего)."),
      note("`git ls-remote` показывает ссылки сервера без скачивания объектов — быстрый способ проверить, что вы подключены к нужному репозиторию и на каком коммите стоят его ветки."),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git status
            # On branch main. Your branch is up to date with 'origin/main'.
            # «значит, коллеги ничего не отправляли»
          `,
          note: "`up to date` означает совпадение с ПОСЛЕДНЕЙ СКАЧАННОЙ копией сервера; без `fetch` Git о новых коммитах не знает.",
        },
        {
          title: "Верно",
          code: `
            git fetch
            git status
            git log --oneline main..origin/main
          `,
          note: "Сначала обновляем ветки слежения, потом смотрим состояние и что пришло.",
        },
      ),
      ul(
        "**Путать `main` и `origin/main`.** Первая — ваша ветка, вторая — копия серверной; коммитить можно только в первую.",
        "**Думать, что `fetch` «скачивает изменения в файлы».** Он обновляет только базу объектов и ветки слежения; файлы меняет `merge`/`pull`.",
        "**Использовать `git pull` вслепую.** Он может сделать неожиданное слияние; для осмотра сначала `fetch`.",
        "**Забывать `-u` при первой отправке:** `git push` и `git pull` без аргументов потребуют указать remote и ветку.",
        "**Считать удалённую ветку удалённой локально:** ветка слежения остаётся до `fetch --prune`.",
        "**Отправлять в чужой `origin` по привычке:** проверяйте `git remote -v` — в форке и в оригинале адреса разные.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Раз в неделю огромный `push`:** коллеги не видят работу, а слияние превращается в событие. Отправляйте небольшие законченные части регулярно.",
        "**«Мёртвые» remote и ветки:** десятки `origin/old-*` засоряют `git branch -a`. Выполняйте `git fetch --prune` и удаляйте слитые ветки на сервере.",
        "**Хранение учётных данных и токенов в адресе remote** (`https://token@…`): адрес виден в `git remote -v` и конфигурации. Используйте менеджер учётных данных или ключи SSH.",
        "**Работа напрямую в `main` после `clone` без обновления:** каждый коммит потом приходится сливать с чужим.",
        "**Один remote с запутанным назначением** (в одном `origin` — и свои, и чужие ветки): используйте `origin`/`upstream` по смыслу.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Сначала `fetch`, потом решайте:** `git fetch` безопасен; `git log main..origin/main` и `git diff` покажут, что пришло.",
        "**Для обновления ветки используйте `git pull --ff-only`,** если не хотите неожиданных слияний; настройте `pull.ff only` для привычки.",
        "**При первой отправке ветки `git push -u origin имя`** — потом хватит `git push`.",
        "**Проверяйте `git remote -v` и `git branch -vv`** перед отправкой: куда и откуда.",
        "**Регулярно `git fetch --prune`,** чтобы не копить «мёртвые» ветки слежения.",
        "**Для форков:** `origin` — ваш, `upstream` — оригинал; обновляйте `main` из `upstream` и работайте в ветках.",
        "**Секреты не кладите в адрес remote:** ключи SSH или менеджер учётных данных.",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Несколько remote с одинаковой веткой:** `origin/main` и `upstream/main` — разные ветки слежения; `git pull` без аргументов использует upstream текущей ветки.",
        "**Нет upstream:** `git pull` отвечает `There is no tracking information for the current branch`; настройте `git branch -u origin/main` или используйте `git pull origin main`.",
        "**Клон конкретной ветки или мелкая копия:** `git clone -b ветка`, `--depth 1` (без полной истории; часть операций ограничена).",
        "**Переименование ветки на сервере** — это создание новой и удаление старой (`git push origin новая`, `git push origin --delete старая`).",
        "**Refspec** можно менять: например, ограничить `fetch` одной веткой.",
        "**Обновление `origin/HEAD`:** `git remote set-head origin -a` синхронизирует «ветку по умолчанию».",
        "**Права доступа** (`push` запрещён) — это настройка сервера, а не Git: сообщение об отказе придёт от него.",
      ),
    ]),

    section("related", [
      ul(
        "[Что такое Git: снимки, объекты и ссылки](/learn/git/git-mental-model) — клон и распределённость.",
        "[Ветки и HEAD](/learn/git/branches-head) — локальные ветки и их связь с удалёнными.",
        "[Слияние веток](/learn/git/merge) — как `pull` объединяет историю.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "pull вслепую",
          code: `
            git pull
            # неожиданное слияние, конфликты, непонятный результат
          `,
          note: "Вы не знаете, что пришло, и уже изменили свою ветку.",
        },
        {
          title: "Сначала посмотреть",
          code: `
            git fetch
            git log --oneline main..origin/main
            git diff --stat main origin/main
            git merge --ff-only origin/main
          `,
          note: "Сначала `fetch`, затем осмотр, затем осознанное обновление ветки.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.remotes-fetch-push.ex1",
      title: "Почему status говорит «up to date»",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Коллега только что отправил коммит. Вы запускаете `git status` и видите `Your branch is up to date with 'origin/main'`. Означает ли это, что на сервере нет новых коммитов? Что нужно сделать, чтобы увидеть новое, и какие команды покажут, что пришло?"),
      ],
      hints: [
        "С чем именно сравнивает `status`?",
        "Какая команда обновляет ветки слежения, не трогая локальные ветки?",
        "Диапазон `main..origin/main` покажет «что нового на сервере».",
      ],
      checks: ["Объяснено: сравнение с устаревшей веткой слежения", "Названа команда `git fetch`", "Показаны `git status`, `git log main..origin/main`, `git diff --stat`", "Локальная ветка при `fetch` не меняется"],
      solution: [
        code("text", `# Алиса ещё не знает о коммите Боба: ссылка origin/main устарела
$ git status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
$ git fetch
From /srv/git/project
   6fc049f..12f5847  main       -> origin/main
$ git status
On branch main
Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.
  (use "git pull" to update your local branch)

nothing to commit, working tree clean
$ git log --oneline main..origin/main
12f5847 Коммит Боба
$ git diff --stat main origin/main
 bob.txt | 1 +
 1 file changed, 1 insertion(+)
$ git branch -vv
* main 6fc049f [origin/main: behind 1] Первый коммит
$ git merge origin/main
Updating 6fc049f..12f5847
Fast-forward
 bob.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 bob.txt
$ git branch -vv
* main 12f5847 [origin/main] Коммит Боба`, { filename: "проверка в настоящем репозитории" }),
      ],
    }),
    exercise({
      id: "git.remotes-fetch-push.ex2",
      title: "Опубликовать проект",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("У вас есть локальный репозиторий с одним коммитом и пустой сервер `/srv/git/project.git`. Подключите сервер как `origin`, отправьте `main` с настройкой upstream и проверьте, что связь настроена (`branch -vv`, `remote show`, `ls-remote`)."),
      ],
      starter: {
        lang: "bash",
        code: `
          git remote -v
          # дальше — подключение и первая отправка
        `,
      },
      hints: [
        "Добавьте remote командой `git remote add`.",
        "Ключ `-u` при `push` запоминает связь.",
        "Проверяйте `git ls-remote origin`.",
      ],
      checks: ["`git remote -v` показывает `origin`", "`push -u` отправил ветку", "`git branch -vv` показывает `[origin/main]`", "`git ls-remote` показывает тот же хэш"],
      solution: [
        code("text", `$ git remote -v
$ git remote add origin /srv/git/project.git
$ git remote -v
origin	/srv/git/project.git (fetch)
origin	/srv/git/project.git (push)
$ git push -u origin main
To /srv/git/project.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
$ git branch -vv
* main 6fc049f [origin/main] Первый коммит
$ git remote show origin
* remote origin
  Fetch URL: /srv/git/project.git
  Push  URL: /srv/git/project.git
  HEAD branch: main
  Remote branch:
    main tracked
  Local branch configured for 'git pull':
    main merges with remote main
  Local ref configured for 'git push':
    main pushes to main (up to date)
$ git ls-remote origin
6fc049f5eb67d960194f773eab7c483fef1887f2	HEAD
6fc049f5eb67d960194f773eab7c483fef1887f2	refs/heads/main
$ git config --get-regexp '^(remote|branch)\\.'
remote.origin.url /srv/git/project.git
remote.origin.fetch +refs/heads/*:refs/remotes/origin/*
branch.main.remote origin
branch.main.merge refs/heads/main`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.remotes-fetch-push.ex3",
      title: "Ветка удалена на сервере, а у меня осталась",
      difficulty: "advanced",
      kind: "debugging",
      prompt: [
        p("Коллега удалил ветку `feature` на сервере, но у вас `git branch -r` по-прежнему показывает `origin/feature`. Объясните, почему так и как привести ветки слежения в соответствие с сервером. Что остаётся у вас локально, если вы ранее создали локальную `feature`?"),
      ],
      hints: [
        "Ветки слежения обновляются только при обмене.",
        "У `fetch` есть ключ для удаления «мёртвых» веток слежения.",
        "Локальные ветки удаляются отдельно: `git branch -d`.",
      ],
      checks: ["Объяснено: ветка слежения — копия, не обновляется сама", "Выполнен `git fetch --prune`", "`origin/feature` исчез из `branch -r`", "Локальная `feature` осталась и удаляется отдельно"],
      solution: [
        code("text", `$ git push -u origin feature
To /srv/git/project.git
 * [new branch]      feature -> feature
branch 'feature' set up to track 'origin/feature'.
$ git branch -a
* feature
  main
  remotes/origin/feature
  remotes/origin/main
$ git branch -r
  origin/feature
  origin/main
# у Боба: новая ветка появляется после fetch
$ git fetch
From /srv/git/project
 * [new branch]      feature    -> origin/feature
$ git branch -a
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/feature
  remotes/origin/main
$ git switch feature
Switched to a new branch 'feature'
branch 'feature' set up to track 'origin/feature'.
$ git branch -vv
* feature 903d368 [origin/feature] Фича
  main    6fc049f [origin/main] Первый коммит
# Алиса удаляет ветку на сервере
$ git push origin --delete feature
To /srv/git/project.git
 - [deleted]         feature
$ git branch -r
  origin/HEAD -> origin/main
  origin/feature
  origin/main
$ git fetch --prune
From /srv/git/project
 - [deleted]         (none)     -> origin/feature
$ git branch -r
  origin/HEAD -> origin/main
  origin/main`, { filename: "решение" }),
        p("`git fetch --prune` убрал `origin/feature`. Локальная ветка `feature` не затрагивается: её нужно удалить самим (`git branch -d feature` после слияния или `-D`), иначе она продолжит ссылаться на несуществующий upstream."),
      ],
    }),
  ],

  challenge: {
    id: "git.remotes-fetch-push.challenge",
    title: "Синхронизировать форк с оригиналом",
    scenario: [
      p("Вы работаете в форке: `origin` — ваша копия на сервере, оригинальный проект — другой репозиторий. Мейнтейнер оригинала выпустил обновление. Нужно подтянуть его в свой `main` безопасно (без лишних коммитов слияния) и опубликовать в форке."),
    ],
    requirements: [
      "Добавить remote `upstream` с адресом оригинала",
      "Скачать оригинал, не меняя своих веток",
      "Обновить `main` только перемоткой; если невозможна — остановиться и разобраться",
      "Отправить обновлённый `main` в `origin` и убедиться, что `origin/main` совпала",
    ],
    constraints: [
      "Не использовать `git pull` без `--ff-only`",
      "Не использовать принудительную отправку (`--force`)",
    ],
    acceptance: [
      "`git remote -v` показывает `origin` и `upstream`",
      "`git log --all --decorate` показывает `main` и `upstream/main` на одном коммите",
      "`git push origin main` прошёл как перемотка (`6fc049f..cbfd238`)",
      "`git branch -vv` показывает `[origin/main]` без расхождения",
    ],
    hints: [
      "`git fetch upstream` скачивает ветки в `upstream/*`.",
      "`git merge --ff-only upstream/main` откажет, если в форке есть свои коммиты.",
      "Проверяйте `git remote -v` перед отправкой.",
    ],
    solution: [
      code("text", `# мейнтейнер оригинального репозитория публикует новый коммит
$ git remote add upstream /srv/git/upstream.git
$ git remote -v
origin	/srv/git/project.git (fetch)
origin	/srv/git/project.git (push)
upstream	/srv/git/upstream.git (fetch)
upstream	/srv/git/upstream.git (push)
$ git fetch upstream
From /srv/git/upstream
 * [new branch]      main       -> upstream/main
$ git log --oneline --all --decorate
cbfd238 (upstream/main) Обновление от мейнтейнера
6fc049f (HEAD -> main, origin/main, origin/HEAD) Первый коммит
$ git merge --ff-only upstream/main
Updating 6fc049f..cbfd238
Fast-forward
 app.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git push origin main
To /srv/git/project.git
   6fc049f..cbfd238  main -> main
$ git branch -vv
* main cbfd238 [origin/main] Обновление от мейнтейнера`, { filename: "решение" }),
      p("Если в `main` форка есть собственные коммиты, `--ff-only` откажет: тогда нужно решить, сливать (`merge`) или перебазировать (`rebase`) свои коммиты поверх `upstream/main`. Лучшая практика — не коммитить в `main` форка, а работать в ветках."),
    ],
  },

  interview: [
    iq("git.remotes-fetch-push.i1", "basic", "Что такое remote и `origin`?", [
      ul(
        "Remote — именованная ссылка на другой репозиторий (имя + адрес) в настройках.",
        "`origin` — имя по умолчанию для репозитория, откуда сделан клон.",
        "`git remote -v` показывает адреса получения и отправки.",
      ),
    ]),
    iq("git.remotes-fetch-push.i2", "basic", "Чем `git fetch` отличается от `git pull`?", [
      ul(
        "`fetch` скачивает новые объекты и обновляет ветки слежения `origin/*`, не меняя ваши ветки и файлы.",
        "`pull` = `fetch` + слияние (или перебазирование) ветки слежения в текущую ветку.",
        "Безопаснее сначала `fetch`, посмотреть, потом объединять.",
      ),
    ]),
    iq("git.remotes-fetch-push.i3", "intermediate", "Что такое ветка слежения и почему `git status` может «не знать» о новых коммитах на сервере?", [
      ul(
        "`origin/main` — локальная копия положения ветки на сервере при последнем обмене.",
        "`git status` сравнивает ветку с этой копией, а не с сервером; без `fetch` копия устаревает.",
        "Обновить: `git fetch`; затем `status`, `log main..origin/main`.",
      ),
    ]),
    iq("git.remotes-fetch-push.i4", "intermediate", "Что делает `git push -u origin main`?", [
      ul(
        "Отправляет ветку `main` на `origin` и создаёт её на сервере, если её нет.",
        "Запоминает upstream (`branch.main.remote`, `branch.main.merge`).",
        "После этого `git push`, `git pull` и `git status` работают без аргументов и показывают `ahead`/`behind`.",
      ),
    ]),
    iq("git.remotes-fetch-push.i5", "intermediate", "Как удалить ветку на сервере и привести локальные ветки слежения в порядок?", [
      ul(
        "`git push origin --delete имя` — удалить на сервере.",
        "У остальных `git fetch --prune` удалит «мёртвые» ветки слежения; локальные ветки удаляются отдельно (`git branch -d`).",
        "Просмотр: `git branch -r`, `git branch -vv`.",
      ),
    ]),
    iq("git.remotes-fetch-push.i6", "advanced", "Что хранится в `.git/config` о remote и ветках и как работает refspec?", [
      ul(
        "`remote.origin.url` и `remote.origin.fetch = +refs/heads/*:refs/remotes/origin/*`.",
        "Refspec: «взять ветки сервера `refs/heads/*` и записать как `refs/remotes/origin/*`»; `+` — обновлять и без перемотки.",
        "`branch.<имя>.remote` и `branch.<имя>.merge` — upstream локальной ветки.",
      ),
    ]),
    iq("git.remotes-fetch-push.i7", "engineering", "Как организовать работу с форком и оригинальным репозиторием?", [
      ul(
        "`origin` — ваш форк, `upstream` — оригинал; в `main` не коммитите.",
        "Регулярно `git fetch upstream` и `git merge --ff-only upstream/main` (или `rebase` своей ветки), затем `git push origin main`.",
        "Работаете в ветках и отправляете их в `origin`, затем открываете запрос на слияние в оригинал.",
      ),
    ]),
    iq("git.remotes-fetch-push.i8", "debugging", "`git pull` сообщает `There is no tracking information for the current branch`. Что делать?", [
      ul(
        "У локальной ветки нет upstream.",
        "Настроить: `git branch --set-upstream-to=origin/имя` (или при отправке `git push -u origin имя`).",
        "Или указать явно: `git pull origin имя`.",
        "Проверить связи: `git branch -vv`, `git remote show origin`.",
      ),
    ]),
  ],

  exam: [
    mcq("git.remotes-fetch-push.e1", "foundation", "Какая команда скачивает новые коммиты, не изменяя ваших веток и файлов?", ["`git pull`", "`git merge`", "`git fetch`", "`git clone`"], 2, "`git fetch` обновляет базу объектов и ветки слежения. `pull` дополнительно сливает и меняет вашу ветку."),
    mcq("git.remotes-fetch-push.e2", "foundation", "Что такое `origin/main`?", ["Ваша локальная копия ветки сервера на момент последнего обмена", "Ветка на сервере", "Тег", "Локальная ветка для коммитов"], 0, "Ветка слежения — локальная ссылка, которую обновляют `fetch`, `pull` и `push`; в неё нельзя коммитить."),
    mcq("git.remotes-fetch-push.e3", "foundation", "Что делает флаг `-u` в `git push -u origin main`?", ["Принудительная отправка", "Отправляет все ветки", "Удаляет ветку", "Запоминает связь локальной ветки с удалённой (upstream)"], 3, "`-u` (`--set-upstream`) записывает `branch.main.remote` и `branch.main.merge`: потом работают `git push`/`git pull` без аргументов."),
    mcq("git.remotes-fetch-push.e4", "intermediate", "`git pull` равносилен…", ["`git fetch` и `git push`", "`git fetch` и слиянию (или перебазированию) ветки слежения", "`git clone`", "`git remote update`"], 1, "`pull` = скачать (`fetch`) + объединить (`merge` или `rebase`). Поэтому он меняет вашу ветку, в отличие от `fetch`."),
    mcq("git.remotes-fetch-push.e5", "intermediate", "Что вы увидите в `git status`, если Боб отправил коммит, а вы не делали `fetch`?", ["`behind 1`", "`ahead 1`", "Ошибку", "`up to date with 'origin/main'`"], 3, "Ветка слежения не обновилась, поэтому сравнение идёт со старой копией. После `fetch` статус будет `behind`."),
    mcq("git.remotes-fetch-push.e6", "intermediate", "Как удалить ветку `feature` на сервере?", ["`git branch -d origin/feature`", "`git fetch --delete feature`", "`git push origin --delete feature`", "`git remote remove feature`"], 2, "Удаление на сервере — это отправка с `--delete`. Затем у остальных `fetch --prune` уберёт ветки слежения."),
    mcq("git.remotes-fetch-push.e7", "advanced", "Что означает запись `+refs/heads/*:refs/remotes/origin/*` в `remote.origin.fetch`?", ["Отправлять все ветки на сервер", "Все ветки сервера копируются в ветки слежения `origin/*`; плюс разрешает обновление без перемотки", "Игнорировать ветки сервера", "Скачивать только теги"], 1, "Это refspec для `fetch`: источник `refs/heads/*` на сервере, назначение `refs/remotes/origin/*` у вас. `+` разрешает перезапись даже без перемотки."),
    open("git.remotes-fetch-push.e8", "intermediate", "Опишите безопасный способ получить чужие коммиты в свою ветку и объясните, почему он безопаснее `git pull`.", [
      ul(
        "`git fetch` → осмотр (`git log main..origin/main`, `git diff --stat main origin/main`) → `git merge --ff-only origin/main` (или `rebase`/`merge` осознанно).",
        "Безопаснее: `fetch` не меняет ваши ветки; решение принимается после осмотра; `--ff-only` не создаёт неожиданных коммитов слияния.",
        "`pull` объединяет сразу; при расхождении история меняется до осмотра.",
      ),
    ], ["Описан `fetch` и осмотр", "Названо `--ff-only` или осознанный выбор", "Объяснено отличие от `pull`", "Сказано про неизменность локальных веток при `fetch`"]),
  ],

  mastery: [
    mcq("git.remotes-fetch-push.m1", "intermediate", "Где Git хранит связь локальной ветки `main` с удалённой?", ["В `.git/config` (`branch.main.remote`, `branch.main.merge`)", "В `.gitignore`", "В файле `HEAD`", "В коммите"], 0, "Upstream записан как `branch.<имя>.remote` и `branch.<имя>.merge`; `git push -u` или `git branch -u` их создаёт."),
    mcq("git.remotes-fetch-push.m2", "advanced", "Вы удалили ветку на сервере. Что останется у коллег до `git fetch --prune`?", ["Ничего", "Только локальная ветка", "Ветка слежения `origin/feature` и, возможно, локальная `feature`", "Удалится всё автоматически"], 2, "Ветки слежения обновляются только при обмене; `fetch --prune` их удаляет. Локальные ветки удаляются отдельно."),
    mcq("git.remotes-fetch-push.m3", "advanced", "Зачем в схеме с форком нужен второй remote `upstream`?", ["Чтобы забирать обновления оригинала и отправлять их в свой форк", "Чтобы отправлять в оригинал без прав", "Чтобы удалять коммиты оригинала", "Он не нужен"], 0, "`upstream` — оригинал, откуда вы забираете (`fetch upstream`); `origin` — ваш форк, куда вы отправляете."),
    open("git.remotes-fetch-push.m4", "advanced", "Новый участник жалуется: «Я ничего не получаю, хотя коллеги коммитят каждый день. `git status` говорит up to date». Проведите диагностику и объясните, как настроить привычку работы.", [
      ul(
        "Причина: он не делает `fetch`; ветка слежения устарела. `git fetch` + `git status` + `git log main..origin/main`.",
        "Проверить upstream и remote: `git branch -vv`, `git remote -v`, `git remote show origin`.",
        "Привычки: `git fetch` перед началом работы; `git pull --ff-only` (или `pull.ff only`); `fetch --prune`; сначала смотреть, что пришло.",
      ),
    ], ["Названа причина (устаревшая ветка слежения)", "Названы команды диагностики", "Описаны привычки", "Упомянут безопасный `pull`"], { format: "debug" }),
  ],

  flashcards: [
    { id: "git.remotes-fetch-push.f1", front: "Remote?", back: "Имя + адрес другого репозитория (origin — по умолчанию из clone). git remote -v." },
    { id: "git.remotes-fetch-push.f2", front: "origin/main?", back: "Ветка слежения: локальная копия сервера на момент последнего обмена. Обновляют fetch, pull, push." },
    { id: "git.remotes-fetch-push.f3", front: "fetch vs pull?", back: "fetch — скачать, ничего не меняя у вас. pull = fetch + merge/rebase." },
    { id: "git.remotes-fetch-push.f4", front: "push -u?", back: "Отправить ветку и запомнить upstream (branch.<имя>.remote/merge)." },
    { id: "git.remotes-fetch-push.f5", front: "status «up to date»?", back: "Сравнение с последней скачанной копией; без fetch о новом не знает." },
    { id: "git.remotes-fetch-push.f6", front: "Удалить ветку на сервере?", back: "git push origin --delete имя; у остальных git fetch --prune." },
    { id: "git.remotes-fetch-push.f7", front: "Форк?", back: "origin — ваш форк, upstream — оригинал: fetch upstream, merge --ff-only, push origin." },
    { id: "git.remotes-fetch-push.f8", front: "Refspec?", back: "+refs/heads/*:refs/remotes/origin/* — как ветки сервера отображаются на ветки слежения." },
  ],

  sources: [
    { title: "Pro Git: Working with Remotes", url: "https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes", publisher: "Git" },
    { title: "Pro Git: Remote Branches", url: "https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches", publisher: "Git" },
    { title: "Git documentation: git-remote", url: "https://git-scm.com/docs/git-remote", publisher: "Git" },
    { title: "Git documentation: git-fetch", url: "https://git-scm.com/docs/git-fetch", publisher: "Git" },
    { title: "Git documentation: git-pull", url: "https://git-scm.com/docs/git-pull", publisher: "Git" },
    { title: "Git documentation: git-push", url: "https://git-scm.com/docs/git-push", publisher: "Git" },
    { title: "Git documentation: git-ls-remote", url: "https://git-scm.com/docs/git-ls-remote", publisher: "Git" },
    { title: "Git documentation: git-clone", url: "https://git-scm.com/docs/git-clone", publisher: "Git" },
  ],
};
