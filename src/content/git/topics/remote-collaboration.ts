import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  note,
  tip,
  danger,
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

export const remoteCollaboration: Topic = {
  id: "git.remote-collaboration",
  slug: "remote-collaboration",
  domain: "git",
  module: "collaboration",
  title: "Совместная работа: отклонённый push, rebase, force-with-lease",
  titleEn: "Collaboration: Rejected Pushes, Rebase and force-with-lease",
  summary:
    "Командная работа в Git — это правила обмена: сервер принимает только перемотку вперёд, поэтому отклонённый `push` — штатная ситуация. Тема на опытах с двумя участниками и сервером разбирает причины и два пути решения (слияние и `pull --rebase`), почему нельзя переписывать общую историю, чем `--force-with-lease` безопаснее `--force`, как устроен цикл «ветка → публикация → ревью → слияние → уборка» и что в нём делает Git, а что — хостинг.",
  minutes: 85,
  prerequisites: ["git.remotes-fetch-push", "git.merge", "git.merge-conflicts"],
  tags: ["git push rejected", "non-fast-forward", "fetch first", "git pull --rebase", "pull.rebase", "git push --force-with-lease", "force push", "pull request", "code review", "git request-pull", "fork", "branch cleanup", "gone"],
  keyConcepts: [
    { term: "Сервер принимает только перемотку вперёд", text: "`! [rejected] main -> main (fetch first)`: у сервера есть коммит Боба, которого нет у Алисы. Отправка отклоняется, пока Алиса не интегрирует чужое." },
    { term: "Два способа интегрировать: слияние или `pull --rebase`", text: "Слияние оставляет два пути и коммит `Merge branch 'main'…`; `pull --rebase` переносит коммит Алисы поверх чужого (`5320c0d` → `6a2db8d`) и даёт линейную историю. Перебазировать можно только неопубликованное." },
    { term: "Не переписывайте то, что уже получили другие", text: "После `commit --amend` опубликованного коммита `push` отклонён как `non-fast-forward`; принудительная отправка у Боба превращается в `forced update` и расхождение `ahead 1, behind 1`." },
    { term: "`--force-with-lease` проверяет, не изменился ли сервер", text: "В опыте Боб успел отправить коммит в `feature`, и `git push --force-with-lease` отказал с `(stale info)`, тогда как `--force` удалил бы работу Боба." },
    { term: "Запрос на слияние — понятие хостинга, а не Git", text: "С точки зрения Git это публикация ветки, просмотр `git diff main...origin/ветка`, слияние `--no-ff`, удаление ветки и `fetch --prune` у остальных; в `git branch -vv` исчезнувшая ветка помечается `gone`." },
  ],
  sections: [
    section("definition", [
      def("Отклонённая отправка", "Ответ сервера на `push`, который сдвинул бы ветку не вперёд, а в сторону (новый коммит не является потомком текущей вершины). Причины: `fetch first` (у сервера есть чужие коммиты, которых вы не видели) и `non-fast-forward` (вы их видели, но ваша ветка не содержит их).", "rejected push"),
      def("Перебазирование при получении", "`git pull --rebase`: после `fetch` ваши ещё не опубликованные коммиты переносятся поверх новой вершины ветки слежения; история остаётся линейной.", "pull --rebase"),
      def("Принудительная отправка", "`git push --force`: сервер сдвигает ветку независимо от того, является ли новый коммит потомком. Позволяет переписывать историю на сервере и **стирать чужие коммиты**.", "force push"),
      def("Отправка с «арендой»", "`git push --force-with-lease`: принудительная отправка, которая выполняется, только если ветка на сервере совпадает с тем, что вы о ней знаете (`origin/ветка`). Иначе — `stale info`.", "force-with-lease"),
      def("Запрос на слияние", "Объект хостинга (pull request, merge request): предложение влить ветку в другую с обсуждением, проверками и решением о слиянии. В самом Git такого объекта нет.", "pull request / merge request"),
      def("Защищённая ветка", "Настройка хостинга: запрет прямой отправки и принудительной отправки в ветку, требование проверок и ревью. Это правило сервера, а не Git.", "protected branch"),
    ]),

    section("why", [
      h("Правила, без которых общий репозиторий не работает"),
      p("Когда в репозиторий пишут несколько человек, неизбежно одновременное изменение одной ветки. Если бы сервер молча принимал любую отправку, последняя перезаписывала бы предыдущие. Поэтому Git вводит одно правило: ветка двигается только вперёд. Если вы отстали, сначала нужно получить чужую работу и объединить со своей."),
      ul(
        "**Безопасность по построению.** Чужие коммиты нельзя случайно потерять обычным `push`: сервер откажет.",
        "**Выбор формы истории.** Интегрировать чужое можно слиянием (видно параллельность) или перебазированием (линейно) — это решение команды.",
        "**Понятные правила.** Что можно переписывать (локальные, неопубликованные коммиты) и что нельзя (общие ветки) — фундамент командного процесса.",
        "**Основа ревью.** Цикл «ветка → публикация → просмотр → слияние → уборка» одинаков на любом хостинге; знание Git-части позволяет работать в нём уверенно.",
      ),
      tip("Отклонённый `push` — не ошибка, а Git, который защищает вас и коллег. Читайте подсказку: в ней названа причина (`fetch first` или `non-fast-forward`) и следующий шаг."),
    ]),

    section("mental-model", [
      h("Почему сервер отказывает"),
      diagram(
        `
        сервер:   c1 ◄── c2 (Боб)                    ветка main на сервере указывает на c2

        у Алисы:  c1 ◄── c3 (Алиса)                  её main указывает на c3

        push Алисы сдвинул бы main с c2 на c3 — c2 «выпал» бы из ветки
        ⇒ rejected: c3 не потомок c2 (не перемотка вперёд)
        `,
        "Принимается только перемотка вперёд. Алиса должна интегрировать c2 и отправить результат.",
      ),
      h("Два способа интегрировать"),
      diagram(
        `
        слияние (pull --no-rebase)                    перебазирование (pull --rebase)

        c1 ◄── c2 ◄──────── M                         c1 ◄── c2 ◄── c3'
         └──── c3 ◄─────────┘                                    (c3 пересоздан поверх c2)

        два пути и коммит слияния                      линейная история, у c3' новый хэш
        `,
        "Оба результата корректны; различаются формой истории. Перебазируются только ещё не опубликованные коммиты.",
      ),
      insight("Правило перебазирования: переписывать можно коммиты, которых ещё нет ни у кого, кроме вас. Как только коммит отправлен и кто-то его скачал, он принадлежит общей истории."),
    ]),

    section("technical", [
      h("Причины отказа"),
      table(
        ["Сообщение", "Смысл", "Что делать"],
        [
          ["`rejected … (fetch first)`", "На сервере есть коммиты, которых у вас нет локально", "`git fetch`, затем интегрировать: `pull --rebase` или `merge`"],
          ["`rejected … (non-fast-forward)`", "Вы знаете об этих коммитах, но ваша ветка не является потомком серверной (например, после `amend`/`rebase` опубликованного)", "Если коммиты ваши и никто их не взял — `--force-with-lease`; иначе интегрировать"],
          ["`rejected … (stale info)`", "`--force-with-lease`: сервер изменился после вашего последнего `fetch`", "`git fetch`, посмотреть, что пришло, и решить заново"],
        ],
        "Три вида отказов push",
      ),
      h("Интеграция чужих коммитов"),
      table(
        ["Команда", "Результат", "Когда"],
        [
          ["`git pull --no-rebase`", "Слияние ветки слежения: коммит слияния, две линии", "Нужно сохранить параллельность, общие ветки"],
          ["`git pull --rebase`", "Ваши коммиты перенесены поверх чужих; хэши ваших коммитов изменились", "Свои неопубликованные коммиты, линейная история"],
          ["`git pull --ff-only`", "Только перемотка; при расхождении — отказ", "Привычка «не создавать неожиданных коммитов»"],
        ],
        "Способы получить чужую работу",
      ),
      p("Если не указать способ, при расхождении `git pull` откажется: `Need to specify how to reconcile divergent branches` — и подскажет `pull.rebase false|true` и `pull.ff only`. Выбор можно сохранить в настройках (`git config --global pull.rebase true`) или передавать ключом."),
      h("Принудительная отправка"),
      ul(
        "**`git push --force`** перезаписывает ветку на сервере чем угодно — в том числе стирает чужие коммиты. Применять к общим веткам нельзя.",
        "**`git push --force-with-lease`** — перезапись только если сервер совпадает с вашим `origin/ветка`; иначе `stale info`. Используйте её вместо `--force`.",
        "**Оговорка:** если вы сделали `git fetch` и не посмотрели, что пришло, «аренда» уже обновлена и отправка пройдёт; точный контроль даёт `--force-with-lease=ветка:коммит`.",
        "**Куда можно:** в свои личные ветки (после `rebase`, `amend`), пока на них никто не опирается.",
      ),
      h("Цикл работы с запросом на слияние"),
      table(
        ["Шаг", "Что делает Git", "Что делает хостинг"],
        [
          ["1. Ветка и публикация", "`switch -c`, коммиты, `push -u origin ветка`", "Показывает новую ветку, предлагает создать запрос"],
          ["2. Запрос и ревью", "Ревьюер: `fetch`, `log main..origin/ветка`, `diff main...origin/ветка`", "Обсуждение, комментарии, автоматические проверки"],
          ["3. Правки по ревью", "Новые коммиты в ту же ветку (`push`) — или `amend`/`rebase` + `--force-with-lease` для личной ветки", "Обновляет запрос"],
          ["4. Слияние", "Обычное слияние, `--no-ff`, squash или rebase", "Кнопка выбора способа слияния"],
          ["5. Уборка", "`fetch --prune`, `branch -d`, `switch main`, `pull --ff-only`", "Удаляет ветку на сервере"],
        ],
        "Что в жизненном цикле запроса относится к Git",
      ),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git push
git fetch
git status -sb
git pull --rebase
git pull --no-rebase
git log --oneline origin/main..main
git push --force-with-lease
git diff main...origin/feature/login
git fetch --prune`,
        [
          { line: 1, text: "Отправка отклонена — сначала `fetch`." },
          { line: [2, 3], text: "Посмотреть расхождение: `ahead`/`behind` и граф." },
          { line: 4, text: "Интегрировать чужое перебазированием своих неопубликованных коммитов." },
          { line: 5, text: "Или слить: коммит слияния и две линии в истории." },
          { line: 6, text: "Перед отправкой: что уйдёт на сервер." },
          { line: 7, text: "Безопасная принудительная отправка личной ветки." },
          { line: 8, text: "Ревьюеру: что нового в ветке относительно `main`." },
          { line: 9, text: "Уборка после слияния: удалить «мёртвые» ветки слежения." },
        ],
        "команды совместной работы",
      ),
    ]),

    section("minimal-example", [
      h("Отклонённый push и pull --rebase"),
      p("Боб отправил коммит в `main`, Алиса сделала свой, не обновившись. Она пытается отправить:"),
      code("text", `$ git push
To /srv/git/project.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '/srv/git/project.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
$ git fetch
From /srv/git/project
   6fc049f..12f5847  main       -> origin/main
$ git status -sb
## main...origin/main [ahead 1, behind 1]
$ git log --oneline --graph --all --decorate
* 5320c0d (HEAD -> main) Коммит Алисы
| * 12f5847 (origin/main) Коммит Боба
|/  
* 6fc049f Первый коммит
$ git pull --rebase
Successfully rebased and updated refs/heads/main.
$ git log --oneline --graph --decorate
* 6a2db8d (HEAD -> main) Коммит Алисы
* 12f5847 (origin/main) Коммит Боба
* 6fc049f Первый коммит
$ git push
To /srv/git/project.git
   12f5847..6a2db8d  main -> main`, { filename: "сеанс: push отклонён, pull --rebase" }),
      ul(
        "`! [rejected] main -> main (fetch first)` и подсказка: в удалённом репозитории есть работа, которой нет локально; нужен `git pull`.",
        "После `git fetch` `git status -sb` показывает `ahead 1, behind 1`, а граф — две линии от `6fc049f`.",
        "`git pull --rebase` перенёс коммит Алисы поверх коммита Боба: хэш изменился (`5320c0d` → `6a2db8d`), история линейная.",
        "Теперь `git push` — обычная перемотка: `12f5847..6a2db8d`.",
      ),
      h("То же слиянием"),
      code("text", `$ git pull --no-rebase --no-edit
From /srv/git/project
   6fc049f..12f5847  main       -> origin/main
Merge made by the 'ort' strategy.
 bob.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 bob.txt
$ git log --oneline --graph --decorate
*   6972555 (HEAD -> main) Merge branch 'main' of /srv/git/project
|\\  
| * 12f5847 (origin/main) Коммит Боба
* | 5320c0d Коммит Алисы
|/  
* 6fc049f Первый коммит`, { filename: "сеанс: pull --no-rebase" }),
      p("Результат — коммит слияния `Merge branch 'main' of /srv/git/project` с двумя родителями. Содержимое то же, форма истории другая: параллельность сохранена."),
    ]),

    section("detailed-example", [
      h("Переписывание опубликованного: что видит коллега"),
      p("Алиса опубликовала коммит `Добавить черновик`, Боб его скачал. Затем Алиса переписала коммит (`--amend`) и отправила. Простая отправка отклонена, а `--force-with-lease` прошла: на сервере был ровно тот коммит, который Алиса знает."),
      code("text", `# Алиса переписывает уже опубликованный коммит
$ git commit -a --amend -m "Добавить улучшенный черновик"
[main bc68d5b] Добавить улучшенный черновик
 Date: Thu Jan 16 10:00:00 2025 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 draft.txt
$ git push
To /srv/git/project.git
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to '/srv/git/project.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. If you want to integrate the remote changes,
hint: use 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
$ git push --force-with-lease
To /srv/git/project.git
 + 89c5bc2...bc68d5b main -> main (forced update)
# у Боба: fetch показывает принудительное обновление
$ git fetch
From /srv/git/project
 + 89c5bc2...bc68d5b main       -> origin/main  (forced update)
$ git status -sb
## main...origin/main [ahead 1, behind 1]
$ git log --oneline --graph --all --decorate
* 89c5bc2 (HEAD -> main) Добавить черновик
| * bc68d5b (origin/main, origin/HEAD) Добавить улучшенный черновик
|/  
* 6fc049f Первый коммит
# Бобу нечего терять: свои коммиты у него нет — pull --rebase подхватывает новую историю
$ git pull --rebase
Successfully rebased and updated refs/heads/main.
$ git log --oneline --graph --all --decorate
* bc68d5b (HEAD -> main, origin/main, origin/HEAD) Добавить улучшенный черновик
* 6fc049f Первый коммит`, { filename: "сеанс: --amend, --force-with-lease и последствия" }),
      ul(
        "`push` после `--amend` — `non-fast-forward`: новый коммит `bc68d5b` не потомок старого `89c5bc2`.",
        "`--force-with-lease` вывела `+ 89c5bc2...bc68d5b main -> main (forced update)`: плюс и три точки означают принудительное обновление.",
        "У Боба `git fetch` тоже показывает `(forced update)`; `git status -sb` — `ahead 1, behind 1`: его `main` указывает на старый коммит.",
        "Бобу нечего терять, у него нет собственных коммитов: `git pull --rebase` пропустил старую версию и подтянул новую — граф стал линейным.",
        "Если бы у Боба были свои коммиты поверх старого, ему пришлось бы разбираться с конфликтами и «призраками» старой истории. Поэтому переписывание общей ветки — дорогое решение.",
      ),
    ]),

    section("analysis", [
      h("Аренда: защита от потери чужой работы"),
      code("text", `# Алиса не знает о коммите Боба. Обычный push отклонён, а --force-with-lease сравнивает с известным ей состоянием сервера
$ git push
To /srv/git/project.git
 ! [rejected]        feature -> feature (fetch first)
error: failed to push some refs to '/srv/git/project.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
$ git push --force-with-lease
To /srv/git/project.git
 ! [rejected]        feature -> feature (stale info)
error: failed to push some refs to '/srv/git/project.git'
$ git fetch
From /srv/git/project
   c03f5a9..6a3ff05  feature    -> origin/feature
$ git log --oneline --graph --all --decorate
* 6a3ff05 (origin/feature) Исправление от Боба
* c03f5a9 Добавить фичу
| * 6a93b9f (HEAD -> feature) Добавить фичу (переформулировано)
|/  
* 6fc049f (origin/main, main) Первый коммит`, { filename: "сеанс: --force-with-lease и stale info" }),
      table(
        ["Команда", "Результат", "Что это значит"],
        [
          ["`git push` (после `amend` в `feature`)", "`rejected (fetch first)`", "На сервере есть коммит Боба, которого у Алисы нет"],
          ["`git push --force-with-lease`", "`rejected (stale info)`", "Ветка на сервере не такая, какой Алиса её помнит: аренда не даёт перезаписать"],
          ["`git fetch` и граф", "`origin/feature` — «Исправление от Боба» над «Добавить фичу»; локальная ветка Алисы — отдельная линия", "Видно, что принудительная отправка стёрла бы коммит Боба"],
        ],
        "Что показал опыт",
      ),
      p("Обычный `--force` в этот момент затёр бы коммит Боба без предупреждений. Аренда превратила потенциальную потерю в отказ с понятной причиной. Следующий шаг — не пытаться «пробить» отказ, а разобраться: получить изменения Боба, интегрировать их (или договориться) и только потом отправлять."),
      danger("`git push --force` в общую ветку (`main`, `develop`, чужая ветка) — типичная причина потерянных коммитов. На сервере такие ветки защищают настройками, но привычка использовать только `--force-with-lease` и только в свои ветки — главная защита."),
    ]),

    section("internals", [
      h("Что проверяет сервер и что значит «аренда»"),
      p("При `git push` клиент сообщает серверу: «ветка должна сдвинуться со старого значения A на новое B». Сервер проверяет, что B — потомок A (перемотка); если нет, отказывает. При `--force` эта проверка отключается. При `--force-with-lease` клиент дополнительно говорит серверу: «сдвигай, **только если** сейчас ветка равна X», где X — то, что у вас записано в `origin/ветка`. Если ветка успела измениться, значение не совпадёт, и сервер откажет (`stale info`)."),
      p("Поэтому аренда защищает только от изменений, о которых вы **не получали** сведений. Если вы выполнили `git fetch`, не посмотрев, `origin/ветка` уже обновлён, и отправка пройдёт, перезаписав увиденное и непрочитанное. Рутина «после `fetch` посмотреть `git log HEAD..origin/ветка`» и необязательный точный вариант `--force-with-lease=ветка:ожидаемый-коммит` закрывают этот пробел."),
      h("Проверить исходящее до отправки"),
      code("text", `$ git status -sb
## main...origin/main [ahead 2]
$ git log --oneline origin/main..main
7e11324 Шаг 2
6066e13 Шаг 1
$ git diff --stat origin/main
 a.txt | 1 +
 b.txt | 1 +
 2 files changed, 2 insertions(+)
$ git push --dry-run
To /srv/git/project.git
   6fc049f..7e11324  main -> main
$ git push
To /srv/git/project.git
   6fc049f..7e11324  main -> main
$ git status -sb
## main...origin/main`, { filename: "сеанс: что уйдёт на сервер" }),
      ul(
        "`git status -sb` — `ahead 2`: два коммита не отправлены.",
        "`git log --oneline origin/main..main` — какие именно; `git diff --stat origin/main` — что изменится на сервере.",
        "`git push --dry-run` показывает, что произошло бы, но ничего не отправляет.",
      ),
      note("Настройка `push.default` по умолчанию — `simple`: `git push` без аргументов отправляет текущую ветку в одноимённую ветку её upstream (и отказывает, если имена различаются)."),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git push
            # ! [rejected] main -> main (fetch first)
            git push --force            # «пробиваем»
          `,
          note: "Принудительная отправка сотрёт коммит Боба с сервера: он останется только у него локально.",
        },
        {
          title: "Верно",
          code: `
            git fetch
            git log --oneline HEAD..origin/main   # что пришло
            git pull --rebase                     # или merge — по правилам команды
            git push
          `,
          note: "Сначала посмотреть чужие коммиты, затем интегрировать и отправлять перемоткой.",
        },
      ),
      ul(
        "**Лечить отказ принудительной отправкой.** Отказ — защита; интегрируйте чужое вместо того, чтобы перезаписывать.",
        "**Перебазировать опубликованные коммиты** без согласования: у коллег появляются «двойники» коммитов и конфликты.",
        "**Использовать `--force` вместо `--force-with-lease`.**",
        "**Не смотреть, что пришло, перед `pull --rebase`/`merge`:** вы интегрируете то, чего не читали.",
        "**Давать `git pull` решать самому:** на расходящейся истории он потребует выбора; задайте политику в настройках.",
        "**Оставлять мёртвые ветки после слияния:** после запроса удаляйте ветку на сервере и локально, делайте `fetch --prune`.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Работа в общей ветке «в одиночку» неделями:** каждый `push` превращается в конфликт.",
        "**Принудительная отправка в `main`:** теряются чужие коммиты, ломаются клоны коллег. Защитите ветки на хостинге.",
        "**Гигантские запросы на слияние** (десятки файлов, сотни строк): ревью формальное, ошибки проходят. Дробите на небольшие запросы.",
        "**Правки после слияния «поверх» без запроса:** история и ревью теряют смысл.",
        "**Слияние `main` в рабочую ветку каждые пять минут:** шум из коммитов слияния. Либо `rebase` личной ветки, либо слияние по необходимости.",
        "**Хранение секретов в ветках запросов:** история сохраняется, ветку «потом удалят» — но секрет уже скачан.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Перед отправкой — `git fetch`, `git status -sb`, `git log origin/main..main`.** Знайте, что уйдёт и что пришло.",
        "**Выберите политику интеграции** (`pull.rebase true` или `false`/`pull.ff only`) и зафиксируйте в команде.",
        "**Переписывайте историю только в личных ветках** и только `--force-with-lease`.",
        "**Делайте небольшие запросы на слияние** от свежего `main`; обновляйте ветку по мере необходимости.",
        "**Смотрите чужие ветки локально:** `fetch`, `log main..origin/ветка`, `diff main...origin/ветка`; не полагайтесь только на веб-интерфейс.",
        "**После слияния прибирайтесь:** `git fetch --prune`, `git branch -d`, `switch main`, `pull --ff-only`.",
        "**Включите защиту веток на хостинге:** запрет принудительной отправки и обязательные проверки в `main`.",
      ),
    ]),

    section("edge-cases", [
      h("Ревью и уборка после слияния"),
      p("Ревьюер забирает ветку, смотрит изменения, сливает с `--no-ff` и удаляет ветку на сервере; автор синхронизируется и убирает у себя:"),
      code("text", `# 1. работа в ветке и публикация
$ git push -u origin feature/login
To /srv/git/project.git
 * [new branch]      feature/login -> feature/login
branch 'feature/login' set up to track 'origin/feature/login'.
# 2. ревьюер (Боб) забирает ветку и смотрит изменения
$ git fetch
From /srv/git/project
 * [new branch]      feature/login -> origin/feature/login
$ git log --oneline main..origin/feature/login
ae3e3f3 Добавить вход
$ git diff --stat main...origin/feature/login
 login.txt | 1 +
 1 file changed, 1 insertion(+)
# 3. слияние в main на стороне ревьюера (кнопка «Merge» на хостинге делает то же самое)
$ git merge --no-ff -m "Влить feature/login" origin/feature/login
Merge made by the 'ort' strategy.
 login.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 login.txt
$ git push
To /srv/git/project.git
   6fc049f..b885a0c  main -> main
$ git push origin --delete feature/login
To /srv/git/project.git
 - [deleted]         feature/login
# 4. автор синхронизируется и убирает за собой
$ git switch main
Switched to branch 'main'
Your branch is up to date with 'origin/main'.
$ git pull --ff-only
From /srv/git/project
   6fc049f..b885a0c  main       -> origin/main
Updating 6fc049f..b885a0c
Fast-forward
 login.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 login.txt
$ git fetch --prune
From /srv/git/project
 - [deleted]         (none)     -> origin/feature/login
$ git branch -vv
  feature/login ae3e3f3 [origin/feature/login: gone] Добавить вход
* main          b885a0c [origin/main] Влить feature/login
$ git branch -d feature/login
Deleted branch feature/login (was ae3e3f3).
$ git log --oneline --graph --decorate
*   b885a0c (HEAD -> main, origin/main) Влить feature/login
|\\  
| * ae3e3f3 Добавить вход
|/  
* 6fc049f Первый коммит`, { filename: "сеанс: жизненный цикл запроса на слияние" }),
      ul(
        "Ревьюер видит содержимое запроса двумя командами: `git log --oneline main..origin/feature/login` (коммиты) и `git diff --stat main...origin/feature/login` (изменения относительно общего предка).",
        "После `git fetch --prune` у автора `git branch -vv` пишет `[origin/feature/login: gone]`: ветка на сервере удалена. `git branch -d feature/login` проходит без `-D`: вершина ветки достижима из `main` через второго родителя коммита слияния.",
        "Если бы ветку влили через squash, Git считал бы её неслитой, и удалять пришлось бы с `-D` (тема про слияние).",
      ),
      h("Git без хостинга: request-pull"),
      p("Запросы на слияние придумали хостинги, но в Git есть исходная форма — `git request-pull`: она формирует текст для отправки мейнтейнеру по почте или в чат."),
      code("text", `$ git request-pull origin/main /srv/git/project.git feature/login
The following changes since commit 6fc049f5eb67d960194f773eab7c483fef1887f2:

  Первый коммит (2025-01-15 09:02:00 +0000)

are available in the Git repository at:

  /srv/git/project.git feature/login

for you to fetch changes up to ae3e3f316d88cbcac179c753eaaa5a8dd6fc7df3:

  Добавить вход (2025-01-15 09:09:00 +0000)

----------------------------------------------------------------
Alice Dev (1):
      Добавить вход

 login.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 login.txt`, { filename: "сеанс: git request-pull" }),
      p("Вывод содержит базовый коммит, адрес и ветку для получения, последний коммит и сводку изменений: этого достаточно, чтобы другой человек выполнил `git fetch` и `git merge`."),
      h("Прочие нюансы"),
      ul(
        "**Ветка с запросом отстала от `main`:** обновите её (`git fetch`, затем `merge origin/main` или `rebase origin/main`); после `rebase` понадобится `--force-with-lease`.",
        "**Правки по ревью:** проще добавлять новые коммиты; чистку (`fixup`, `rebase -i`) выполняют до слияния и только в своей ветке.",
        "**Слияние двух запросов подряд:** второй часто конфликтует с первым — это нормальная ситуация.",
        "**Защита веток и обязательное ревью** — настройки хостинга; Git их не знает и сообщает лишь об отказе сервера.",
      ),
    ]),

    section("related", [
      ul(
        "[Удалённые репозитории](/learn/git/remotes-fetch-push) — `fetch`, `pull`, `push` и ветки слежения.",
        "[Слияние веток](/learn/git/merge) — формы слияния, которые выбирают в запросах.",
        "[Конфликты слияния](/learn/git/merge-conflicts) — разбор расхождений при интеграции.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Принудительно и вслепую",
          code: `
            git push
            # rejected
            git push --force
          `,
          note: "Коммит коллеги стёрт с сервера, он узнает об этом позже, и его работа существует только локально.",
        },
        {
          title: "Осознанная интеграция",
          code: `
            git fetch
            git log --oneline HEAD..origin/main
            git pull --rebase
            git push
          `,
          note: "Чужая работа прочитана и интегрирована; отправка — обычная перемотка.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.remote-collaboration.ex1",
      title: "Push отклонён",
      difficulty: "foundation",
      kind: "debugging",
      prompt: [
        p("Вы сделали коммит и выполнили `git push`, но получили `! [rejected] main -> main (fetch first)`. Объясните, что случилось, и выполните безопасную последовательность команд, после которой отправка пройдёт, а история останется линейной."),
      ],
      hints: [
        "У сервера есть коммит, которого нет у вас.",
        "Сначала `fetch`, затем посмотрите расхождение `status -sb`.",
        "Интегрируйте чужое перебазированием своего неопубликованного коммита.",
      ],
      checks: ["Понято: на сервере есть чужой коммит", "Выполнен `git fetch` и просмотрено расхождение", "Использован `pull --rebase`", "Отправка прошла как перемотка"],
      solution: [
        code("text", `$ git push
To /srv/git/project.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '/srv/git/project.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
$ git fetch
From /srv/git/project
   6fc049f..12f5847  main       -> origin/main
$ git status -sb
## main...origin/main [ahead 1, behind 1]
$ git log --oneline --graph --all --decorate
* 5320c0d (HEAD -> main) Коммит Алисы
| * 12f5847 (origin/main) Коммит Боба
|/  
* 6fc049f Первый коммит
$ git pull --rebase
Successfully rebased and updated refs/heads/main.
$ git log --oneline --graph --decorate
* 6a2db8d (HEAD -> main) Коммит Алисы
* 12f5847 (origin/main) Коммит Боба
* 6fc049f Первый коммит
$ git push
To /srv/git/project.git
   12f5847..6a2db8d  main -> main`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.remote-collaboration.ex2",
      title: "Слияние или перебазирование",
      difficulty: "intermediate",
      kind: "application",
      prompt: [
        p("В одной и той же ситуации (ваш коммит и чужой коммит на `main`) интегрируйте чужую работу сначала слиянием, затем (в другом клоне) перебазированием. Сравните историю в обоих случаях и скажите, когда вы выберете какой способ."),
      ],
      hints: [
        "`git pull --no-rebase --no-edit` и `git pull --rebase`.",
        "Сравните `git log --oneline --graph --decorate`.",
        "Что изменилось с хэшем вашего коммита?",
      ],
      checks: ["Слияние даёт коммит слияния с двумя родителями", "Перебазирование даёт линейную историю и новый хэш вашего коммита", "Названы критерии выбора"],
      solution: [
        code("text", `$ git pull --no-rebase --no-edit
From /srv/git/project
   6fc049f..12f5847  main       -> origin/main
Merge made by the 'ort' strategy.
 bob.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 bob.txt
$ git log --oneline --graph --decorate
*   6972555 (HEAD -> main) Merge branch 'main' of /srv/git/project
|\\  
| * 12f5847 (origin/main) Коммит Боба
* | 5320c0d Коммит Алисы
|/  
* 6fc049f Первый коммит`, { filename: "слияние" }),
        code("text", `$ git push
To /srv/git/project.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '/srv/git/project.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
$ git fetch
From /srv/git/project
   6fc049f..12f5847  main       -> origin/main
$ git status -sb
## main...origin/main [ahead 1, behind 1]
$ git log --oneline --graph --all --decorate
* 5320c0d (HEAD -> main) Коммит Алисы
| * 12f5847 (origin/main) Коммит Боба
|/  
* 6fc049f Первый коммит
$ git pull --rebase
Successfully rebased and updated refs/heads/main.
$ git log --oneline --graph --decorate
* 6a2db8d (HEAD -> main) Коммит Алисы
* 12f5847 (origin/main) Коммит Боба
* 6fc049f Первый коммит
$ git push
To /srv/git/project.git
   12f5847..6a2db8d  main -> main`, { filename: "перебазирование" }),
        ul(
          "Слияние сохраняет параллельность работы и не переписывает коммиты; перебазирование даёт линейную историю, но создаёт новые коммиты (хэш изменился).",
          "Выбор: для личных неопубликованных коммитов — перебазирование; для общих веток и когда важно сохранить факт параллельной работы — слияние; всегда — по правилам команды.",
        ),
      ],
    }),
    exercise({
      id: "git.remote-collaboration.ex3",
      title: "Принудительная отправка без потерь",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Вы переформулировали сообщение уже опубликованного коммита в личной ветке `feature` и хотите обновить её на сервере. Но пока вы работали, коллега мог отправить в эту же ветку свой коммит. Какая команда защитит от потери его работы и что вы будете делать, получив отказ `stale info`?"),
      ],
      hints: [
        "Обычный `push` будет отклонён, а `--force` опасен.",
        "У `--force-with-lease` есть проверка состояния сервера.",
        "После отказа сначала `fetch` и просмотр `HEAD..origin/feature`.",
      ],
      checks: ["Выбрана `--force-with-lease`", "При отказе `stale info` не используется `--force`", "Выполнен `git fetch` и просмотрены чужие коммиты", "Принято решение об интеграции или договорённость с коллегой"],
      solution: [
        code("text", `# Алиса не знает о коммите Боба. Обычный push отклонён, а --force-with-lease сравнивает с известным ей состоянием сервера
$ git push
To /srv/git/project.git
 ! [rejected]        feature -> feature (fetch first)
error: failed to push some refs to '/srv/git/project.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
$ git push --force-with-lease
To /srv/git/project.git
 ! [rejected]        feature -> feature (stale info)
error: failed to push some refs to '/srv/git/project.git'
$ git fetch
From /srv/git/project
   c03f5a9..6a3ff05  feature    -> origin/feature
$ git log --oneline --graph --all --decorate
* 6a3ff05 (origin/feature) Исправление от Боба
* c03f5a9 Добавить фичу
| * 6a93b9f (HEAD -> feature) Добавить фичу (переформулировано)
|/  
* 6fc049f (origin/main, main) Первый коммит`, { filename: "решение" }),
        ul(
          "`--force-with-lease` отказала (`stale info`): на сервере есть коммит Боба, о котором Алиса не знает. Обычный `--force` стёр бы его.",
          "Правильные шаги: `git fetch`, `git log --oneline HEAD..origin/feature`, обсудить с коллегой и интегрировать его коммит (`rebase`/`merge`), затем отправить.",
        ),
      ],
    }),
  ],

  challenge: {
    id: "git.remote-collaboration.challenge",
    title: "От ветки до слияния и уборки",
    scenario: [
      p("Вы реализовали вход в системе в ветке `feature/login`. Нужно провести полный цикл: опубликовать ветку, дать ревьюеру возможность посмотреть изменения, слить без потери истории задачи, удалить ветку на сервере и привести свой репозиторий в порядок."),
    ],
    requirements: [
      "Опубликовать ветку `feature/login` с настройкой upstream",
      "Ревьюер получает ветку и смотрит коммиты и изменения относительно общего предка",
      "Слияние с `--no-ff` и сообщением, отправка `main`, удаление ветки на сервере",
      "Автор обновляет `main` перемоткой, удаляет «мёртвую» ветку слежения и локальную ветку",
    ],
    constraints: [
      "Не использовать принудительную отправку",
      "Не удалять локальную ветку, пока слияние не подтверждено сервером",
    ],
    acceptance: [
      "`git log --oneline main..origin/feature/login` у ревьюера показывает один коммит",
      "У автора `git branch -vv` до уборки пишет `[origin/feature/login: gone]`",
      "`git branch -d feature/login` проходит без `-D`",
      "`git log --graph` показывает коммит слияния с двумя линиями",
    ],
    hints: [
      "Ревьюеру: `git fetch`, затем диапазон `main..origin/ветка` и три точки в `diff`.",
      "Автору после слияния: `pull --ff-only`, `fetch --prune`, `branch -d`.",
      "`gone` в `branch -vv` означает, что ветки на сервере уже нет.",
    ],
    solution: [
      code("text", `# 1. работа в ветке и публикация
$ git push -u origin feature/login
To /srv/git/project.git
 * [new branch]      feature/login -> feature/login
branch 'feature/login' set up to track 'origin/feature/login'.
# 2. ревьюер (Боб) забирает ветку и смотрит изменения
$ git fetch
From /srv/git/project
 * [new branch]      feature/login -> origin/feature/login
$ git log --oneline main..origin/feature/login
ae3e3f3 Добавить вход
$ git diff --stat main...origin/feature/login
 login.txt | 1 +
 1 file changed, 1 insertion(+)
# 3. слияние в main на стороне ревьюера (кнопка «Merge» на хостинге делает то же самое)
$ git merge --no-ff -m "Влить feature/login" origin/feature/login
Merge made by the 'ort' strategy.
 login.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 login.txt
$ git push
To /srv/git/project.git
   6fc049f..b885a0c  main -> main
$ git push origin --delete feature/login
To /srv/git/project.git
 - [deleted]         feature/login
# 4. автор синхронизируется и убирает за собой
$ git switch main
Switched to branch 'main'
Your branch is up to date with 'origin/main'.
$ git pull --ff-only
From /srv/git/project
   6fc049f..b885a0c  main       -> origin/main
Updating 6fc049f..b885a0c
Fast-forward
 login.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 login.txt
$ git fetch --prune
From /srv/git/project
 - [deleted]         (none)     -> origin/feature/login
$ git branch -vv
  feature/login ae3e3f3 [origin/feature/login: gone] Добавить вход
* main          b885a0c [origin/main] Влить feature/login
$ git branch -d feature/login
Deleted branch feature/login (was ae3e3f3).
$ git log --oneline --graph --decorate
*   b885a0c (HEAD -> main, origin/main) Влить feature/login
|\\  
| * ae3e3f3 Добавить вход
|/  
* 6fc049f Первый коммит`, { filename: "решение" }),
    ],
  },

  interview: [
    iq("git.remote-collaboration.i1", "basic", "Почему `git push` бывает отклонён и что делать?", [
      ul(
        "Сервер принимает только перемотку вперёд: если на нём есть коммиты, которых нет у вас, отправка отклоняется (`fetch first`/`non-fast-forward`).",
        "Нужно получить чужие коммиты (`git fetch`), интегрировать их (`pull --rebase` или `merge`) и отправить снова.",
        "Принудительная отправка для этого не подходит.",
      ),
    ]),
    iq("git.remote-collaboration.i2", "basic", "Чем отличаются `git pull --rebase` и `git pull --no-rebase`?", [
      ul(
        "`--no-rebase` — слияние: появляется коммит слияния, история с двумя линиями.",
        "`--rebase` — перебазирование: ваши неопубликованные коммиты переносятся поверх чужих (хэши меняются), история линейна.",
        "Выбор формы — договорённость команды; можно задать `pull.rebase`.",
      ),
    ]),
    iq("git.remote-collaboration.i3", "intermediate", "Когда можно и когда нельзя перебазировать?", [
      ul(
        "Можно — коммиты, которых нет у других (локальные, неопубликованные или в личной ветке).",
        "Нельзя — общие, уже опубликованные и использованные ветки: у коллег окажутся «двойники» коммитов, возникнут конфликты и расхождения.",
        "Для личной ветки после перебазирования используют `--force-with-lease`.",
      ),
    ]),
    iq("git.remote-collaboration.i4", "intermediate", "Чем `--force-with-lease` лучше `--force`?", [
      ul(
        "`--force` перезаписывает ветку на сервере безусловно и может стереть чужие коммиты.",
        "`--force-with-lease` выполняется только если ветка на сервере совпадает с вашим `origin/ветка`; иначе отказ `stale info`.",
        "Оговорка: после `fetch`, который вы не просмотрели, защита обходится; точный контроль — `--force-with-lease=ветка:коммит`.",
      ),
    ]),
    iq("git.remote-collaboration.i5", "intermediate", "Что делает Git, а что — хостинг в запросе на слияние?", [
      ul(
        "Git: ветка, коммиты, `push`, `fetch`, `diff`, слияние, удаление ветки.",
        "Хостинг: сам объект запроса, обсуждения, проверки, правила защиты, кнопка слияния.",
        "Способ слияния на кнопке (merge commit, squash, rebase) соответствует операциям Git.",
      ),
    ]),
    iq("git.remote-collaboration.i6", "advanced", "Вы сделали `git commit --amend` на опубликованной ветке. Что произойдёт и как поступить?", [
      ul(
        "Обычный `push` будет отклонён (`non-fast-forward`): новый коммит не потомок серверного.",
        "Если ветка личная и никто на неё не опирается — `git push --force-with-lease`; коллегам нужно подтянуть историю (`pull --rebase`).",
        "Если ветка общая — не переписывайте: сделайте новый коммит (`revert`/исправление).",
      ),
    ]),
    iq("git.remote-collaboration.i7", "engineering", "Какие правила совместной работы вы бы закрепили в команде?", [
      ul(
        "Небольшие запросы на слияние от свежего `main`, обязательное ревью и проверки.",
        "Не переписывать общие ветки; принудительная отправка только `--force-with-lease` и только в личные ветки; защита `main` на хостинге.",
        "Единая политика интеграции (`pull.rebase`/`ff only`) и способ слияния (merge/squash/rebase).",
        "Уборка веток после слияния (`fetch --prune`, удаление).",
      ),
    ]),
    iq("git.remote-collaboration.i8", "debugging", "Коллега сообщает, что после вашего `push --force` его коммиты «исчезли». Что делаете?", [
      ul(
        "Не паниковать: коммиты есть у коллеги локально (и в его `reflog`); остановить дальнейшие отправки в ветку.",
        "Попросить его отправить свою ветку в другое имя (`git push origin main:rescue`), затем интегрировать.",
        "Если нужно, восстановить прежнюю вершину ветки (из клона коллеги или вашего `reflog`) и отправить её; принять меры: защита ветки, `--force-with-lease`.",
      ),
    ]),
  ],

  exam: [
    mcq("git.remote-collaboration.e1", "foundation", "Что означает `! [rejected] main -> main (fetch first)`?", ["Ветка `main` удалена на сервере", "У вас нет прав", "На сервере есть коммиты, которых нет локально", "Конфликт слияния"], 2, "Сервер принимает только перемотку вперёд. У вас нет его последних коммитов, поэтому нужно сначала сделать `fetch` и интегрировать их."),
    mcq("git.remote-collaboration.e2", "foundation", "Как получить чужие коммиты и перенести поверх них свои неопубликованные?", ["`git pull --rebase`", "`git push --force`", "`git clone`", "`git reset --hard`"], 0, "`pull --rebase` выполняет `fetch` и перебазирует ваши коммиты на новую вершину ветки слежения: история остаётся линейной."),
    mcq("git.remote-collaboration.e3", "foundation", "Какую принудительную отправку считают безопасной?", ["`git push --force`", "`git push --mirror`", "`git push --delete`", "`git push --force-with-lease`"], 3, "`--force-with-lease` отказывает, если ветка на сервере изменилась после вашего `fetch`; `--force` перезаписывает безусловно."),
    mcq("git.remote-collaboration.e4", "intermediate", "Что означает `(stale info)` в ответе на `push --force-with-lease`?", ["Сервер недоступен", "Ветка на сервере не соответствует вашему `origin/ветка`: кто-то отправил новое", "У вас устарел Git", "Нет прав"], 1, "Аренда сравнивает ожидаемое значение с серверным. Несовпадение значит, что на сервере есть то, чего вы не видели."),
    mcq("git.remote-collaboration.e5", "intermediate", "Когда допустимо перебазировать (`rebase`) ветку?", ["Когда она уже опубликована и у коллег есть её копии", "Только в `main`", "Всегда", "Когда коммиты неопубликованы или ветка личная"], 3, "Перебазирование создаёт новые коммиты. Если у других уже есть старые, их история разойдётся с вашей."),
    mcq("git.remote-collaboration.e6", "intermediate", "Что значит `[origin/feature: gone]` в `git branch -vv`?", ["Ветка слита", "Нужен `push`", "Ветка на сервере удалена, а локальная ссылается на несуществующий upstream", "Ветка повреждена"], 2, "После `fetch --prune` ветка слежения исчезла, а локальная осталась со связью с несуществующей удалённой. Её удаляют `git branch -d`."),
    mcq("git.remote-collaboration.e7", "advanced", "Какие утверждения верны о запросе на слияние? Выберите все.", ["Это объект хостинга, а не Git", "С точки зрения Git это ветка, `push`, просмотр `diff`, слияние", "Без него нельзя пользоваться ветками", "Способ слияния в интерфейсе соответствует операциям Git"], [0, 1, 3], "Запросы создают хостинги; в Git лежат ветки и операции. Ветками можно работать и без хостинга (`git request-pull`)."),
    open("git.remote-collaboration.e8", "intermediate", "Опишите, что вы делаете, когда `git push` отклонён, и чем отличаются варианты интеграции.", [
      ul(
        "Читаю причину (`fetch first`/`non-fast-forward`); `git fetch`, смотрю `status -sb` и `log HEAD..origin/ветка`.",
        "Выбираю способ: `pull --rebase` (линейно, новые хэши вашим коммитам) или слияние (сохраняет параллельность); `--ff-only` — если ожидаю только перемотку.",
        "Проверяю результат (тесты), отправляю обычным `push`; принудительную отправку не использую.",
      ),
    ], ["Названа причина отказа", "Описаны оба способа интеграции", "Названы проверка и обычный push", "Сказано, что force не применяется"]),
  ],

  mastery: [
    mcq("git.remote-collaboration.m1", "intermediate", "Алиса выполнила `git fetch`, не просматривая новое, а затем `git push --force-with-lease`. Что произойдёт?", ["Отправка отклонена всегда", "Отправка пройдёт, перезаписав увиденное, но не прочитанное", "Ничего", "Сервер удалит ветку"], 1, "После `fetch` `origin/ветка` совпадает с сервером, и аренда проходит: защита работает против неизвестных изменений. Поэтому после `fetch` нужно смотреть `HEAD..origin/ветка`."),
    mcq("git.remote-collaboration.m2", "advanced", "Почему слитая через squash ветка не удаляется командой `git branch -d`?", ["Вершина ветки не достижима из `main`: Git считает её неслитой", "Git не умеет удалять такие ветки", "Нужны права администратора", "Ветка защищена"], 0, "Squash не создаёт связи с вершиной ветки. `-d` проверяет достижимость, поэтому предлагает `-D` после проверки содержимого."),
    mcq("git.remote-collaboration.m3", "advanced", "Какая настройка заставит `git pull` по умолчанию перебазировать, а не сливать?", ["`git config merge.ff false`", "`git config push.default simple`", "`git config pull.rebase true`", "`git config fetch.prune true`"], 2, "`pull.rebase true` меняет поведение `git pull` по умолчанию. `fetch.prune` включает удаление «мёртвых» ветвей слежения при `fetch`."),
    open("git.remote-collaboration.m4", "advanced", "В вашей команде три человека регулярно теряют коммиты из-за `push --force`. Предложите технические и организационные меры.", [
      ul(
        "Технические: защита `main` и общих веток на хостинге (запрет принудительной отправки), требование проверок и ревью; в личных ветках только `--force-with-lease` (псевдоним `git config --global alias.pushf 'push --force-with-lease'`).",
        "Организационные: правило «общую историю не переписываем», шаблон ветки на задачу, небольшие запросы, обучение (`fetch` и просмотр перед интеграцией).",
        "Восстановление: `reflog` у автора потерянных коммитов, ветка-спасение, при необходимости восстановление вершины на сервере.",
      ),
    ], ["Защита веток", "`--force-with-lease`", "Правила команды", "План восстановления"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.remote-collaboration.f1", front: "Когда push отклонён?", back: "Когда новая вершина не потомок серверной: fetch first (чужие коммиты) или non-fast-forward." },
    { id: "git.remote-collaboration.f2", front: "Что делать при отказе?", back: "fetch → посмотреть HEAD..origin/ветка → pull --rebase или merge → push." },
    { id: "git.remote-collaboration.f3", front: "pull --rebase?", back: "Ваши неопубликованные коммиты переносятся поверх чужих: линейная история, новые хэши." },
    { id: "git.remote-collaboration.f4", front: "Когда нельзя перебазировать?", back: "Когда коммиты уже у других (опубликованы и используются)." },
    { id: "git.remote-collaboration.f5", front: "--force-with-lease?", back: "Принудительная отправка с проверкой, что сервер не изменился с вашего fetch (иначе stale info)." },
    { id: "git.remote-collaboration.f6", front: "Запрос на слияние?", back: "Понятие хостинга. В Git: ветка, push, diff main...origin/ветка, merge, удаление ветки." },
    { id: "git.remote-collaboration.f7", front: "[origin/x: gone]?", back: "Ветка на сервере удалена; локальную удаляют git branch -d после fetch --prune." },
    { id: "git.remote-collaboration.f8", front: "Что уйдёт на сервер?", back: "git log origin/main..main, git status -sb, git push --dry-run." },
  ],

  sources: [
    { title: "Pro Git: Distributed Workflows", url: "https://git-scm.com/book/en/v2/Distributed-Git-Distributed-Workflows", publisher: "Git" },
    { title: "Pro Git: Contributing to a Project", url: "https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project", publisher: "Git" },
    { title: "Pro Git: Rebasing (The Perils of Rebasing)", url: "https://git-scm.com/book/en/v2/Git-Branching-Rebasing", publisher: "Git" },
    { title: "Git documentation: git-push (--force-with-lease)", url: "https://git-scm.com/docs/git-push", publisher: "Git" },
    { title: "Git documentation: git-pull", url: "https://git-scm.com/docs/git-pull", publisher: "Git" },
    { title: "Git documentation: git-request-pull", url: "https://git-scm.com/docs/git-request-pull", publisher: "Git" },
    { title: "Git documentation: gitworkflows", url: "https://git-scm.com/docs/gitworkflows", publisher: "Git" },
  ],
};
