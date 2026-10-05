import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p06ReleaseFlow: Project = {
  id: "git.p06-release-flow",
  domain: "git",
  order: 6,
  title: "Релиз по правилам: хук, версия из истории, журнал изменений, теги, hotfix",
  subtitle: "Хук commit-msg для команды, следующая версия по Conventional Commits, CHANGELOG, аннотированные теги, публикация с --follow-tags и срочное исправление от тега: 25 проверок на git 2.43.0",
  level: "engineering",
  estimatedHours: 7,
  buildsOn: ["git.p03-remote-sync", "git.p04-history-rescue"],
  topics: [
    "git.commit-quality-hooks",
    "git.releases-tags",
    "git.cherry-pick-stash",
    "git.branching-strategies",
    "git.remotes-fetch-push",
  ],
  objective:
    "Пройти весь путь выпуска версии так, как это делает команда: **автоматизировать соглашение о коммитах** (хук `commit-msg` в репозитории и `core.hooksPath`), **определить следующую версию по истории** (SemVer из типов Conventional Commits), **собрать журнал изменений** из коммитов, выпустить версию **аннотированным тегом** на коммите выпуска, опубликовать **только то, что нужно** (`--follow-tags`, без случайных локальных меток) и **выпустить срочное исправление** для предыдущей линии от тега, не трогая основную ветку. Проект про воспроизводимый выпуск: версия — функция истории, тег — неизменяемая метка, а процесс проверяется командами, а не на словах.",
  scenario: [
    p("Проект `textkit` (разбор текста на слова). Версия `v1.2.0` выпущена и опубликована аннотированным тегом. С тех пор в `main` попало **шесть коммитов**: `docs: describe parser options`, `fix(parser): handle empty input`, `chore: update lint config`, `feat(cli): add --verbose flag`, `feat(api)!: rename parse() to parseText()` и `fix(cli): exit code on error`. Среди них есть несовместимое изменение (`!`). У вас в клоне также есть **лёгкая локальная метка `wip-notes`** на вершине `main` — «закладка для себя», которой на сервере быть не должно."),
    p("Нужно: (1) ввести проверку формата сообщений хуком; (2) определить следующую версию и записать ответы; (3) собрать `CHANGELOG.md`, закоммитить его как `chore(release): v2.0.0`, поставить аннотированный тег и опубликовать; (4) параллельно выпустить `v1.2.1` — исправление `fix(parser): handle empty input` для пользователей версии 1.2.x — из ветки `release/1.2`, созданной **от тега `v1.2.0`**. Скрипт `setup.sh` создаёт «сервер» `remote.git` и ваш клон `work/`. `check.mjs` проверяет **25 фактов**: хук (запускается на тестовых сообщениях), ответы, журнал изменений, теги, состояние сервера и ветку исправления. Нужны `git` 2.32+ и Node.js 18+."),
    code("bash", `mkdir -p ~/devdock-git && cd ~/devdock-git
# сохраните setup.sh и check.mjs из этой страницы в текущую папку
bash setup.sh ~/devdock-git/p06        # создаёт work/ (ваш клон) и remote.git (сервер)
cd ~/devdock-git/p06/work
git log --oneline --decorate           # шесть коммитов после v1.2.0, тег wip-notes
# ...когда закончите, из каталога ~/devdock-git:
node check.mjs ~/devdock-git/p06`, { filename: "порядок работы" }),
    code("bash", `#!/usr/bin/env bash
# setup.sh <каталог> — создаёт «сервер» remote.git и ваш клон work/ проекта textkit: тег v1.2.0 и шесть коммитов после него.
# Даты и авторы фиксированы: у всех получается одно и то же.
set -e
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null   # ваши глобальные настройки Git (подпись коммитов, шаблоны…) не влияют на результат
W="\${1:?укажите каталог: bash setup.sh ~/devdock-git/p06}"
rm -rf "$W"; mkdir -p "$W"; W="$(cd "$W" && pwd)"; cd "$W"
git init -q --bare -b main remote.git
git clone -q remote.git work 2>/dev/null; cd work
git config user.name "Alice Dev"; git config user.email "alice@example.com"
t=1736931600
commit() {  # commit "Автор" "почта" "сообщение" — коммит всех изменений с фиксированным временем
  t=$((t+3600))
  GIT_AUTHOR_NAME="$1" GIT_AUTHOR_EMAIL="$2" GIT_COMMITTER_NAME="$1" GIT_COMMITTER_EMAIL="$2" \\
  GIT_AUTHOR_DATE="$t +0000" GIT_COMMITTER_DATE="$t +0000" git commit -q -a -m "$3"
}
ALICE=("Alice Dev" "alice@example.com"); BOB=("Bob Coder" "bob@example.com"); CAROL=("Carol Ops" "carol@example.com")

# --- до выпуска 1.2.0 ---
printf '// textkit: разбор текста\\nfunction parse(text) {\\n  return text.split(/\\\\s+/);\\n}\\n\\nmodule.exports = { parse };\\n' > parser.js
git add -A; commit "\${ALICE[@]}" "feat: initial parser"
printf 'const { parse } = require("./parser");\\nconsole.log(parse(process.argv[2] || ""));\\n' > cli.js
git add -A; commit "\${ALICE[@]}" "feat(cli): add cli entry"
printf '// textkit: разбор текста\\nfunction parse(text) {\\n  return text.trim().split(/\\\\s+/);\\n}\\n\\nmodule.exports = { parse };\\n' > parser.js
git add -A; commit "\${BOB[@]}" "fix(parser): trim whitespace"
printf '# textkit\\n\\nРазбор текста на слова.\\n' > README.md
git add -A; commit "\${ALICE[@]}" "docs: add README"
printf '{ "name": "textkit", "version": "1.2.0" }\\n' > package.json
git add -A; commit "\${CAROL[@]}" "chore: prepare 1.2.0"
GIT_COMMITTER_NAME="Carol Ops" GIT_COMMITTER_EMAIL="carol@example.com" GIT_COMMITTER_DATE="$t +0000" git tag -a v1.2.0 -m "Release v1.2.0"

# --- после выпуска: шесть коммитов ---
printf '\\n## Параметры\\n\\nФункция \`parse(text)\` возвращает массив слов.\\n' >> README.md
git add -A; commit "\${ALICE[@]}" "docs: describe parser options"
printf '// textkit: разбор текста\\nfunction parse(text) {\\n  if (!text) return [];\\n  return text.trim().split(/\\\\s+/);\\n}\\n\\nmodule.exports = { parse };\\n' > parser.js
git add -A; commit "\${BOB[@]}" "fix(parser): handle empty input"
printf '{ "extends": "eslint:recommended" }\\n' > .eslintrc.json
git add -A; commit "\${CAROL[@]}" "chore: update lint config"
printf 'const { parse } = require("./parser");\\nconst verbose = process.argv.includes("--verbose");\\nconst words = parse(process.argv[2] || "");\\nif (verbose) console.log("words:", words.length);\\nconsole.log(words);\\n' > cli.js
git add -A; commit "\${BOB[@]}" "feat(cli): add --verbose flag"
printf '// textkit: разбор текста\\nfunction parseText(text) {\\n  if (!text) return [];\\n  return text.trim().split(/\\\\s+/);\\n}\\n\\nmodule.exports = { parseText };\\n' > parser.js
printf 'const { parseText } = require("./parser");\\nconst verbose = process.argv.includes("--verbose");\\nconst words = parseText(process.argv[2] || "");\\nif (verbose) console.log("words:", words.length);\\nconsole.log(words);\\n' > cli.js
git add -A; commit "\${ALICE[@]}" "feat(api)!: rename parse() to parseText()"
printf 'const { parseText } = require("./parser");\\nconst verbose = process.argv.includes("--verbose");\\nconst words = parseText(process.argv[2] || "");\\nif (verbose) console.log("words:", words.length);\\nconsole.log(words);\\nprocess.exit(words.length ? 0 : 1);\\n' > cli.js
git add -A; commit "\${CAROL[@]}" "fix(cli): exit code on error"
git push -q origin main --follow-tags 2>/dev/null
git tag wip-notes     # лёгкая локальная метка «для себя» — её на сервере быть не должно
echo "Готово: $W (ваш клон — work/, сервер — remote.git)"`, { filename: "setup.sh", collapsed: true }),
    table(
      ["Что сделать", "Результат"],
      [
        ["Написать хук `commit-msg` и включить его для всей команды", "Файл `.githooks/commit-msg` (исполняемый) в репозитории, `core.hooksPath = .githooks`; закоммитьте `chore: add commit-msg hook`. Хук принимает `тип(область)!: описание` (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`, `ci`, `style`), отклоняет остальное с понятным сообщением, пропускает `Merge …` и `Revert …`"],
        ["Определить версию по истории с последнего тега", "В `~/devdock-git/p06/answers.txt` строки `last-tag: <тег>`, `commits-since: <число коммитов после тега на старте>` и `next: <версия>`"],
        ["Собрать `CHANGELOG.md` и закоммитить выпуск", "Раздел `## v2.0.0` с блоком BREAKING и списками feat/fix (без docs и chore); коммит `chore(release): v2.0.0`"],
        ["Поставить тег и опубликовать", "Аннотированный `v2.0.0` на коммите выпуска; на сервере `main` и тег; **лёгкой метки `wip-notes` на сервере нет**"],
        ["Выпустить исправление 1.2.1", "Ветка `release/1.2` от `v1.2.0` с одним коммитом — перенесённым `fix(parser): handle empty input`; аннотированный `v1.2.1`; ветка и тег на сервере; `main` не слит с веткой"],
      ],
      "Задание",
    ),
    tip("Хук нужно написать так, чтобы он проходил **свои собственные** коммиты: сообщения всех ваших коммитов в этом проекте — в формате Conventional Commits. Проверка запускает ваш хук напрямую (как это делает Git), поэтому ему нужны строка `#!/bin/sh` (или другой интерпретатор) и бит исполнения."),
  ],
  requirements: [
    "`.githooks/commit-msg` — в репозитории (режим `100755`); `git config core.hooksPath` = `.githooks`.",
    "Хук принимает: `feat: add x`, `fix(parser): handle empty input`, `feat(api)!: rename x`, `docs: update readme`, `chore(release): v2.0.0` и сообщение с телом после пустой строки; отклоняет (код 1): `update`, `Fix: x`, `feat:no space`, `feature: add x`, `fix:`, `wip`, пустое сообщение; при отказе печатает причину; пропускает `Merge branch …` и `Revert …`.",
    "`answers.txt`: `last-tag: v1.2.0`, `commits-since: 6`, `next: v2.0.0`.",
    "`CHANGELOG.md` в `main`: раздел `## v2.0.0`, блок BREAKING перед описанием `rename parse() to parseText()`, перечислены все четыре `feat`/`fix` с прошлого выпуска, служебных коммитов (docs, chore) нет.",
    "Коммит выпуска называется `chore(release): v2.0.0` и содержит `CHANGELOG.md`; тег `v2.0.0` — **аннотированный** (с сообщением, содержащим `2.0.0`), стоит на вершине `main`.",
    "На сервере: `main` совпадает с вашим и содержит новые коммиты; тег `v2.0.0` указывает на коммит выпуска; из тегов на сервере только `v1.2.0`, `v1.2.1`, `v2.0.0` (`wip-notes` не опубликована).",
    "`release/1.2` отходит от `v1.2.0`, содержит ровно один коммит `fix(parser): handle empty input` (копия, а не слияние), в нём нет `parseText` и `--verbose`; аннотированный `v1.2.1` — на её вершине; ветка и тег на сервере, upstream настроен.",
    "Все ваши коммиты в `main` после старта оформлены по Conventional Commits; вы на `main`, рабочее дерево чистое.",
  ],
  constraints: [
    "Только Git и shell/Node (хук может быть на `sh`, Node.js или Python — но запускаться должен как исполняемый файл).",
    "Не используйте `git push --tags` и `git push --force`: нужно опубликовать только созданные вами аннотированные теги.",
    "Опубликованные теги (`v1.2.0`) не переносить; ошибки исправляйте новыми коммитами или тегами.",
    "Исправление `fix(parser): handle empty input` в ветку `release/1.2` переносите копией (`cherry-pick`), а не слиянием `main`: в `v1.2.1` не должно быть остальных изменений.",
    "Ответы получайте командами Git, а не просмотром файлов.",
  ],
  expected: [
    "`node check.mjs ~/devdock-git/p06` печатает `Пройдено проверок: 25 из 25`.",
    "Заготовка (сразу после `setup.sh`) проходит 1 проверку из 25: рабочее дерево чистое.",
    "Каждый из десяти «плохих» вариантов проваливает от 1 до 19 проверок, результат стабилен при повторных запусках.",
    "Полная проверка (включая запуск хука на 15 тестовых сообщениях) занимает около 0,3 секунды.",
  ],
  technical: [
    "**Хук и `core.hooksPath`.** Хуки из `.git/hooks` не клонируются; общие хуки хранят в репозитории и подключают `git config core.hooksPath .githooks` (каждый участник один раз). Хук `commit-msg` получает путь к файлу сообщения (`$1`); код выхода не ноль отменяет коммит. Хук запускается при `commit` и `commit --amend`; `cherry-pick` его не вызывает (в git 2.43.0 проверено).",
    "**Проверка заголовка.** Регулярное выражение вида `^(feat|fix|…)(\\([a-z0-9-]+\\))?!?: .+` проверяет первую строку; слияния и откаты (`Merge …`, `Revert …`) формат не соблюдают — их пропускают явно.",
    "**Версия из истории.** SemVer: несовместимое изменение (`!` после типа/области или `BREAKING CHANGE:` в подвале) — MAJOR, `feat` — MINOR, `fix` — PATCH; старший тип с последнего тега определяет версию. Коммиты `docs`/`chore` сами по себе версию не меняют.",
    "**Какой тег считать последним.** `git describe --abbrev=0` без `--tags` учитывает только аннотированные теги; с `--tags` в игру вступают и лёгкие — здесь это `wip-notes`, стоящая на самой вершине `main`. Результат `describe --tags --abbrev=0` — `wip-notes`: версия посчиталась бы по пустому диапазону.",
    "**Журнал изменений.** `git log <тег>..HEAD --format=%s` даёт заголовки; `grep -E '^feat(\\(…\\))?: '` отбирает типы; `sed` превращает «feat(cli): текст» в строку списка. Блок BREAKING формируют по `!` в заголовке.",
    "**Публикация.** `git push` теги не отправляет; `git push --follow-tags` отправляет вместе с коммитами только **аннотированные** теги, достижимые из отправляемых веток; `--tags` отправил бы и лёгкую метку.",
    "**Hotfix от тега.** `git switch -c release/1.2 v1.2.0` создаёт ветку из выпущенного состояния; `git cherry-pick -x <коммит>` копирует исправление (и добавляет строку `(cherry picked from commit …)`). Тег `v1.2.1` ставят на вершину этой ветки; в `main` исправление уже есть своим коммитом, поэтому ветку не сливают.",
  ],
  acceptance: [
    "`node check.mjs ~/devdock-git/p06` — 25 из 25.",
    "`git log --oneline --decorate --graph --all` показывает два «рукава»: `main` с `v2.0.0` и `release/1.2` с `v1.2.1`, отходящий от `v1.2.0`.",
    "`git ls-remote --tags origin` выводит `v1.2.0`, `v1.2.1`, `v2.0.0` (и их коммиты `^{}`), но не `wip-notes`.",
    "Вы можете показать, что хук отклоняет `update` и принимает `feat: add x`, и объяснить, почему без `core.hooksPath` у коллег он не сработает.",
  ],
  hints: [
    "Хук начинается с `#!/bin/sh`; первая строка сообщения — `head -n 1 \"$1\"`; проверка — `grep -Eq '^(feat|fix|…)(\\([a-z0-9-]+\\))?!?: .+'`. Не забудьте `chmod +x`.",
    "Отказ хука должен выводить причину в `stderr` и завершаться `exit 1`; слияния и откаты (`Merge `, `Revert `) пропускайте до проверки формата.",
    "Последний тег: `git describe --abbrev=0` (без `--tags`). Число коммитов после него — `git rev-list --count v1.2.0..HEAD`, пока вы ещё не сделали своих коммитов.",
    "Версию определяйте по `git log v1.2.0..HEAD --format=%s`: есть ли `!:` перед описанием, иначе `feat`, иначе `fix`.",
    "Для журнала изменений: `git log v1.2.0..HEAD --format=%s | grep -E '^feat(\\([^)]*\\))?: '`; `sed -E` превратит заголовок в строку «- описание (область)».",
    "Тег ставьте **после** коммита выпуска: `git commit -m \"chore(release): v2.0.0\"`, затем `git tag -a v2.0.0 -m \"Release v2.0.0\"`.",
    "Публикация: `git push --follow-tags origin main`. Проверьте `git ls-remote --tags origin`: `wip-notes` там быть не должно.",
    "Hotfix: `git switch -c release/1.2 v1.2.0`, `git cherry-pick -x <хэш fix(parser)>`, `git tag -a v1.2.1 -m …`, `git push -u origin release/1.2 --follow-tags`, затем `git switch main`.",
  ],
  advanced: [
    "Включите проверку формата ещё и на сервере: напишите `pre-receive`-хук для `remote.git`, который отклоняет push с коммитами в неверном формате (клиентский хук обходится `--no-verify`).",
    "Допишите хук `prepare-commit-msg`, подставляющий шаблон `тип(область): `, и `pre-push`, который запрещает отправку лёгких тегов.",
    "Автоматизируйте весь выпуск одним скриптом `release.sh`: вычисление версии, `CHANGELOG`, коммит, тег, публикация; прогоните его на копии репозитория.",
    "Учтите `BREAKING CHANGE:` в подвале сообщения (а не только `!`) при определении версии; допишите соответствующий тест на сообщениях.",
    "Перенесите исправление в ветку `release/1.2` слиянием и сравните историю с вариантом `cherry-pick`: что окажется в `v1.2.1`?",
    "Выпустите предварительную версию `v2.0.0-rc.1` и покажите, как `git tag --sort=v:refname` с `versionsort.suffix=-rc` расставляет её относительно `v2.0.0`.",
  ],
  failureModes: [
    "**Хук не исполняемый (нет `chmod +x`):** Git его молча игнорирует; проверка не может запустить файл (7 красных из 25).",
    "**Хук принимает всё:** некорректные сообщения не отклоняются, `update` попадает в историю (4 красные).",
    "**`core.hooksPath` не настроен:** хук лежит в репозитории, но Git его не вызывает; в историю попадает коммит с неверным заголовком (3 красные).",
    "**Неверная версия (`v1.3.0` при несовместимом изменении):** ответ, журнал изменений, тег и сервер не те (7 красных).",
    "**Последний тег найден через `git describe --tags`:** «последним» оказывается лёгкая метка `wip-notes`, версия определяется по почти пустому диапазону как `v1.2.1`, тег `v1.2.1` оказывается занят, и остальные шаги не выполняются (19 красных; проходит 6 проверок).",
    "**В журнал попали `docs` и `chore`:** шум в списке изменений (1 красная).",
    "**Лёгкий тег `v2.0.0`:** нет автора, даты и сообщения; `--follow-tags` его не отправит (3 красные).",
    "**Тег поставлен до коммита с журналом изменений:** `v2.0.0` указывает на коммит без `CHANGELOG.md` и не на вершину `main` (2 красные).",
    "**`push --tags` вместо `--follow-tags`:** на сервер утекает локальная метка `wip-notes` (1 красная).",
    "**Ветка исправления создана от `v2.0.0`, а не от `v1.2.0`:** в `v1.2.1` попадают все новые изменения (7 красных).",
  ],
  rubric: [
    { criterion: "Хук и соглашение о коммитах", weight: 20, description: "Хук в репозитории, исполняемый, подключён через `core.hooksPath`; верно принимает и отклоняет, объясняет причину, пропускает слияния и откаты." },
    { criterion: "Версия и журнал изменений", weight: 25, description: "Следующая версия определена по старшему типу с последнего аннотированного тега; журнал изменений без служебных коммитов, с блоком BREAKING; верные ответы." },
    { criterion: "Теги и публикация", weight: 25, description: "Аннотированный тег на коммите выпуска, `--follow-tags`, лёгкая метка не утекла на сервер, `main` и теги совпадают с сервером." },
    { criterion: "Срочное исправление от тега", weight: 20, description: "Ветка от `v1.2.0`, один перенесённый коммит без лишних изменений, аннотированный `v1.2.1`, опубликованы ветка и тег, `main` не слит." },
    { criterion: "Аккуратность и самопроверка", weight: 10, description: "Все коммиты в формате, чистое дерево, итог 25 из 25, понимание ограничений клиентских хуков." },
  ],
  solution: [
    p("Эталон — скрипт из 64 строк: он выполняет все пять частей и проходит все 25 проверок; заготовка проходит 1, а каждый из десяти намеренно испорченных вариантов проходит от 6 до 24 проверок из 25. Ниже — решение, проверяющий скрипт и результаты запусков на git 2.43.0."),
    h("solution.sh"),
    code("bash", `#!/usr/bin/env bash
# solution.sh <каталог> — эталонное решение (запускается после setup.sh)
set -e
W="$(cd "\${1:?укажите каталог}" && pwd)"
cd "$W/work"
export GIT_EDITOR=true

# ---------- 1. Хук commit-msg лежит в репозитории и включён через core.hooksPath ----------
mkdir -p .githooks
cat > .githooks/commit-msg <<'EOT'
#!/bin/sh
# commit-msg: заголовок должен быть вида «тип(область): описание»; слияния и откаты разрешены
msg=$(head -n 1 "$1")
case "$msg" in "Merge "*|"Revert "*) exit 0 ;; esac
if printf '%s' "$msg" | grep -Eq '^(feat|fix|docs|chore|refactor|test|perf|build|ci|style)(\\([a-z0-9-]+\\))?!?: .+'; then
  exit 0
fi
echo "commit-msg: заголовок должен быть вида «тип(область): описание», получено: $msg" >&2
exit 1
EOT
chmod +x .githooks/commit-msg
git config core.hooksPath .githooks
git add .githooks
git commit -q -m "chore: add commit-msg hook"
git commit -q --allow-empty -m "update" 2>/dev/null || true      # хук отклоняет такое сообщение

# ---------- 2. Версия по истории с последнего (аннотированного) тега ----------
commits_since=$(git rev-list --count v1.2.0..HEAD~1)               # без коммита с хуком
last=$(git describe --abbrev=0)                                     # лёгкие теги (wip-notes) без --tags игнорируются
subjects=$(git log "$last"..HEAD --format='%s%n%b')
if echo "$subjects" | grep -qE '^[a-z]+(\\([^)]*\\))?!:|^BREAKING CHANGE:'; then next=v2.0.0
elif echo "$subjects" | grep -qE '^feat(\\(|:)'; then next=v1.3.0
else next=v1.2.1; fi

# ---------- 3. CHANGELOG и коммит выпуска ----------
fmt() { sed -E 's/^[a-z]+(\\(([^)]*)\\))?!?: (.*)$/- \\3 (\\2)/; s/ \\(\\)$//'; }   # «feat(cli): текст» → «- текст (cli)»
{
  echo "## $next"
  echo
  echo "### BREAKING CHANGES"
  git log "$last"..HEAD --format=%s | grep -E '^[a-z]+(\\([^)]*\\))?!: ' | fmt
  echo
  echo "### Features"
  git log "$last"..HEAD --format=%s | grep -E '^feat(\\([^)]*\\))?: ' | fmt
  echo
  echo "### Fixes"
  git log "$last"..HEAD --format=%s | grep -E '^fix(\\([^)]*\\))?: ' | fmt
} > CHANGELOG.md
git add CHANGELOG.md
git commit -q -m "chore(release): $next"
git tag -a "$next" -m "Release $next"

# ---------- 4. Публикация: ветка и аннотированные теги, лёгкая метка остаётся у вас ----------
git push -q --follow-tags origin main

# ---------- 5. Срочное исправление для 1.2.x: от тега v1.2.0, а не от main ----------
fix=$(git log --format=%h --grep='^fix(parser): handle empty input$' main)
git switch -q -c release/1.2 v1.2.0
git cherry-pick -x "$fix" > /dev/null
git tag -a v1.2.1 -m "Release v1.2.1"
git push -q -u origin release/1.2 --follow-tags
git switch -q main

printf 'last-tag: %s\\nnext: %s\\ncommits-since: %s\\n' "$last" "$next" "$commits_since" > "$W/answers.txt"`, { filename: "solution.sh", lineNumbers: true }),
    ul(
      "**Хук.** Первая строка сообщения проверяется регулярным выражением; `Merge `/`Revert ` пропускаются; при отказе печатается причина и `exit 1`. Хук проходит свой собственный коммит `chore: add commit-msg hook`; попытка `git commit -m update` отклоняется.",
      "**Версия.** `git describe --abbrev=0` возвращает `v1.2.0` (лёгкая `wip-notes` игнорируется); `rev-list --count v1.2.0..HEAD~1` — 6; в сообщениях есть `feat(api)!:` — следующая версия `v2.0.0`.",
      "**Журнал.** Функция `fmt` превращает `feat(cli): add --verbose flag` в `- add --verbose flag (cli)`; блок BREAKING строится по `!:`; `docs` и `chore` в список не попадают.",
      "**Теги.** `chore(release): v2.0.0` создаётся **до** тега; `git tag -a` ставит аннотированный тег на вершину; `git push --follow-tags` отправляет `main` и `v2.0.0`, а лёгкая `wip-notes` остаётся у вас.",
      "**Hotfix.** `git switch -c release/1.2 v1.2.0`, `cherry-pick -x` копирует исправление (хэш меняется), `v1.2.1` ставится на вершину ветки, ветка и тег публикуются с `--follow-tags`; `main` не затронут.",
    ),
    h("check.mjs"),
    code("js", `#!/usr/bin/env node
// check.mjs <каталог> — проверка проекта 6 «Релиз по правилам». Каталог — тот, что создал setup.sh
// (внутри work/, remote.git и ваш answers.txt). Требуется Node.js 18+ и git; проверка читает репозитории
// и запускает ваш хук .githooks/commit-msg на тестовых сообщениях.
import { mkdtempSync, rmSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(process.argv[2] ?? ".");
const ENV = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_TERMINAL_PROMPT: "0", LC_ALL: "C.UTF-8", GIT_PAGER: "cat", GIT_CEILING_DIRECTORIES: resolve(ROOT, ".."), GIT_EDITOR: "true" };
/** git(args, cwd) → { ok, out, err }; вывод без хвостовых пробелов */
const git = (args, cwd = ROOT) => {
  const r = spawnSync("git", ["-c", "core.quotepath=off", ...args], { cwd, env: ENV, encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout ?? "").replace(/\\s+$/, ""), err: (r.stderr ?? "").trim() };
};
const lines = (s) => (s ? s.split("\\n") : []);
const read = (p) => readFileSync(p, "utf8");
let okCount = 0, allCount = 0;
/** check("описание", () => true | false | [false, "подробность"]) — исключение считается провалом */
const check = (name, fn) => {
  allCount++;
  let ok = false, detail = "";
  try { const r = fn(); if (Array.isArray(r)) { ok = !!r[0]; detail = r[1] ?? ""; } else ok = !!r; } catch (e) { detail = String(e.message ?? e).split("\\n")[0]; }
  if (ok) okCount++;
  console.log(\`\${ok ? "✓" : "✗"} \${name}\${!ok && detail ? " — " + detail : ""}\`);
};
const summary = () => { console.log(\`\\nПройдено проверок: \${okCount} из \${allCount}\`); process.exit(okCount === allCount ? 0 : 1); };

const W = ROOT, work = join(W, "work"), remote = join(W, "remote.git");
const wg = (a) => git(a, work), rg = (a) => git(a, remote);
// Исходные коммиты (setup.sh воспроизводим, поэтому их хэши известны заранее)
const V120 = "d381e33e428924c907de104c9a74d99c5c3ab5f3";   // коммит выпуска v1.2.0
const MAIN0 = "ca0a790ae5c83015ca3c4ed4f1d2118354da7bd3"; // вершина main до ваших коммитов: «fix(cli): exit code on error»
const FIX = "9af054e8653ea4a2ab0d1b0030605258cfd3ce11";     // «fix(parser): handle empty input» — исправление для 1.2.1
const NEXT = "v2.0.0";
const answers = existsSync(join(W, "answers.txt")) ? read(join(W, "answers.txt")) : "";
const answer = (k) => (answers.match(new RegExp(\`^\${k}:\\\\s*(\\\\S.*?)\\\\s*$\`, "m")) ?? [])[1] ?? "";
const type = (r) => wg(["cat-file", "-t", r]).out;
const subject = (r) => wg(["log", "-1", "--format=%s", r]).out;
const peel = (r) => wg(["rev-parse", "--verify", "-q", \`\${r}^{commit}\`]).out;
const remoteTags = lines(rg(["tag", "-l"]).out).sort();
const hook = join(work, ".githooks", "commit-msg");
const runHook = (msg) => {
  const d = mkdtempSync(join(tmpdir(), "p06-")); const f = join(d, "MSG");
  try { writeFileSync(f, msg); const r = spawnSync(hook, [f], { cwd: work, env: ENV, encoding: "utf8" }); return { status: r.error ? -1 : r.status, text: ((r.stdout ?? "") + (r.stderr ?? "")).trim() }; }
  finally { rmSync(d, { recursive: true, force: true }); }
};
const changelog = existsSync(join(work, "CHANGELOG.md")) ? read(join(work, "CHANGELOG.md")) : "";
const tagCommit = peel(NEXT);

check("хук .githooks/commit-msg добавлен в репозиторий с правами 100755", () => wg(["ls-tree", "HEAD", ".githooks/commit-msg"]).out.startsWith("100755 blob"));
check("core.hooksPath указывает на .githooks", () => [wg(["config", "--get", "core.hooksPath"]).out === ".githooks", wg(["config", "--get", "core.hooksPath"]).out || "не задан"]);
check("хук принимает корректные заголовки (feat, fix с областью, feat!, docs, chore(release))", () => { const bad = ["feat: add x", "fix(parser): handle empty input", "feat(api)!: rename x", "docs: update readme", "chore(release): v2.0.0", "feat: ok\\n\\nТело сообщения"].filter((m) => runHook(m).status !== 0); return [bad.length === 0, \`отклонены: \${bad.map((m) => JSON.stringify(m)).join(" | ")}\`]; });
check("хук отклоняет некорректные заголовки (update, Fix:, feat:без пробела, feature:, fix:, пустое сообщение)", () => { const bad = ["update", "Fix: x", "feat:no space", "feature: add x", "fix:", "wip", ""].filter((m) => runHook(m).status !== 1); return [bad.length === 0, \`приняты: \${bad.map((m) => JSON.stringify(m)).join(" | ")}\`]; });
check("хук объясняет причину отказа (выводит сообщение)", () => { const r = runHook("update"); return [r.status !== 0 && r.text.length > 10, r.text || "вывода нет"]; });
check("хук пропускает сообщения слияния и отката («Merge branch …», «Revert …»)", () => runHook("Merge branch 'x' into main").status === 0 && runHook('Revert "feat: add x"').status === 0);
check("answers.txt, last-tag: последний аннотированный тег до выпуска", () => [answer("last-tag") === "v1.2.0", answer("last-tag") || "нет строки «last-tag: …» (подсказка: git describe без --tags)"]);
check("answers.txt, commits-since: сколько коммитов было после тега на старте (6)", () => [answer("commits-since") === "6", answer("commits-since") || "нет строки «commits-since: <число>»"]);
check("answers.txt, next: следующая версия по истории (есть несовместимое изменение)", () => [answer("next") === NEXT, answer("next") || "нет строки «next: <версия>»"]);
check("CHANGELOG.md в main: раздел «## v2.0.0» и блок BREAKING с изменением из feat(api)!", () => { const i = changelog.search(/break/i), j = changelog.indexOf("rename parse() to parseText()"); return [/^## v2\\.0\\.0\\s*$/m.test(changelog) && i >= 0 && j > i, "нет заголовка или блока BREAKING перед описанием"]; });
check("CHANGELOG.md перечисляет все feat и fix с прошлого выпуска", () => ["add --verbose flag", "exit code on error", "handle empty input", "rename parse() to parseText()"].every((s) => changelog.includes(s)));
check("CHANGELOG.md не содержит служебных коммитов (docs, chore)", () => changelog !== "" && !changelog.includes("describe parser options") && !changelog.includes("update lint config") && !changelog.includes("commit-msg hook"));
check("коммит выпуска называется «chore(release): v2.0.0» и содержит CHANGELOG.md", () => [tagCommit !== "" && subject(NEXT) === "chore(release): v2.0.0" && wg(["show", \`\${NEXT}:CHANGELOG.md\`]).out.includes("## v2.0.0"), subject(NEXT) || "тега v2.0.0 нет"]);
check("тег v2.0.0 аннотированный (объект tag) с сообщением, содержащим 2.0.0", () => type("refs/tags/v2.0.0") === "tag" && wg(["tag", "-l", "-n1", NEXT]).out.includes("2.0.0"));
check("v2.0.0 стоит на вершине main (после хука и журнала изменений)", () => tagCommit !== "" && tagCommit === wg(["rev-parse", "main"]).out);
check("на сервере main совпадает с вашим main и содержит новые коммиты", () => [rg(["rev-parse", "main"]).out === wg(["rev-parse", "main"]).out && rg(["rev-parse", "main"]).out !== MAIN0, rg(["rev-parse", "--short", "main"]).out]);
check("на сервере есть тег v2.0.0, указывающий на коммит выпуска", () => rg(["rev-parse", "--verify", "-q", "refs/tags/v2.0.0^{commit}"]).out === tagCommit && tagCommit !== "");
check("на сервере только аннотированные теги выпусков: лёгкая метка wip-notes не опубликована", () => [!remoteTags.includes("wip-notes") && remoteTags.includes("v2.0.0") && remoteTags.includes("v1.2.1"), remoteTags.join(", ")]);
check("ветка release/1.2 отходит от тега v1.2.0 и содержит ровно один коммит", () => [wg(["merge-base", "v1.2.0", "release/1.2"]).out === V120 && wg(["rev-list", "--count", "v1.2.0..release/1.2"]).out === "1", \`коммитов поверх v1.2.0: \${wg(["rev-list", "--count", "v1.2.0..release/1.2"]).out}\`]);
check("исправление перенесено: «fix(parser): handle empty input» в release/1.2, новых функций там нет", () => { const p = wg(["show", "release/1.2:parser.js"]).out, c = wg(["show", "release/1.2:cli.js"]).out; return [subject("release/1.2") === "fix(parser): handle empty input" && p.includes("if (!text) return []") && !p.includes("parseText") && !c.includes("--verbose") && wg(["rev-parse", "release/1.2"]).out !== FIX, ""]; });
check("тег v1.2.1 аннотированный и стоит на вершине release/1.2", () => type("refs/tags/v1.2.1") === "tag" && peel("v1.2.1") === wg(["rev-parse", "release/1.2"]).out);
check("на сервере release/1.2 совпадает с вашей и upstream настроен", () => [rg(["rev-parse", "--verify", "-q", "refs/heads/release/1.2"]).out === wg(["rev-parse", "release/1.2"]).out && wg(["config", "--get", "branch.release/1.2.remote"]).out === "origin", ""]);
check("main не содержит коммита исправления из ветки релиза (перенос, а не слияние)", () => wg(["rev-parse", "--verify", "-q", "release/1.2"]).ok && !wg(["merge-base", "--is-ancestor", wg(["rev-parse", "release/1.2"]).out, "main"]).ok);
check("коммиты после v1.2.0 в main (ваши): по Conventional Commits", () => { const bad = lines(wg(["log", "--format=%s", \`\${MAIN0}..main\`]).out).filter((s) => !/^(feat|fix|docs|chore|refactor|test|perf|build|ci|style)(\\([a-z0-9-]+\\))?!?: \\S.*$/.test(s)); return [bad.length === 0 && wg(["rev-list", "--count", \`\${MAIN0}..main\`]).out !== "0", bad.join(" | ") || "ваших коммитов нет"]; });
check("вы на main, рабочее дерево чистое", () => wg(["rev-parse", "--abbrev-ref", "HEAD"]).out === "main" && wg(["status", "--porcelain"]).out === "");

summary();`, { filename: "check.mjs", collapsed: true }),
    code("text", `✓ хук .githooks/commit-msg добавлен в репозиторий с правами 100755
✓ core.hooksPath указывает на .githooks
✓ хук принимает корректные заголовки (feat, fix с областью, feat!, docs, chore(release))
✓ хук отклоняет некорректные заголовки (update, Fix:, feat:без пробела, feature:, fix:, пустое сообщение)
✓ хук объясняет причину отказа (выводит сообщение)
✓ хук пропускает сообщения слияния и отката («Merge branch …», «Revert …»)
✓ answers.txt, last-tag: последний аннотированный тег до выпуска
✓ answers.txt, commits-since: сколько коммитов было после тега на старте (6)
✓ answers.txt, next: следующая версия по истории (есть несовместимое изменение)
✓ CHANGELOG.md в main: раздел «## v2.0.0» и блок BREAKING с изменением из feat(api)!
✓ CHANGELOG.md перечисляет все feat и fix с прошлого выпуска
✓ CHANGELOG.md не содержит служебных коммитов (docs, chore)
✓ коммит выпуска называется «chore(release): v2.0.0» и содержит CHANGELOG.md
✓ тег v2.0.0 аннотированный (объект tag) с сообщением, содержащим 2.0.0
✓ v2.0.0 стоит на вершине main (после хука и журнала изменений)
✓ на сервере main совпадает с вашим main и содержит новые коммиты
✓ на сервере есть тег v2.0.0, указывающий на коммит выпуска
✓ на сервере только аннотированные теги выпусков: лёгкая метка wip-notes не опубликована
✓ ветка release/1.2 отходит от тега v1.2.0 и содержит ровно один коммит
✓ исправление перенесено: «fix(parser): handle empty input» в release/1.2, новых функций там нет
✓ тег v1.2.1 аннотированный и стоит на вершине release/1.2
✓ на сервере release/1.2 совпадает с вашей и upstream настроен
✓ main не содержит коммита исправления из ветки релиза (перенос, а не слияние)
✓ коммиты после v1.2.0 в main (ваши): по Conventional Commits
✓ вы на main, рабочее дерево чистое

Пройдено проверок: 25 из 25`, { filename: "результат node check.mjs (эталонное решение, git 2.43.0)" }),
    code("text", `✗ хук .githooks/commit-msg добавлен в репозиторий с правами 100755
✗ core.hooksPath указывает на .githooks — не задан
✗ хук принимает корректные заголовки (feat, fix с областью, feat!, docs, chore(release)) — отклонены: "feat: add x" | "fix(parser): handle empty input" | "feat(api)!: rename x" | "docs: update readme" | "chore(release): v2.0.0" | "feat: ok\\n\\nТело сообщения"
✗ хук отклоняет некорректные заголовки (update, Fix:, feat:без пробела, feature:, fix:, пустое сообщение) — приняты: "update" | "Fix: x" | "feat:no space" | "feature: add x" | "fix:" | "wip" | ""
✗ хук объясняет причину отказа (выводит сообщение) — вывода нет
✗ хук пропускает сообщения слияния и отката («Merge branch …», «Revert …»)
✗ answers.txt, last-tag: последний аннотированный тег до выпуска — нет строки «last-tag: …» (подсказка: git describe без --tags)
✗ answers.txt, commits-since: сколько коммитов было после тега на старте (6) — нет строки «commits-since: <число>»
✗ answers.txt, next: следующая версия по истории (есть несовместимое изменение) — нет строки «next: <версия>»
✗ CHANGELOG.md в main: раздел «## v2.0.0» и блок BREAKING с изменением из feat(api)! — нет заголовка или блока BREAKING перед описанием
✗ CHANGELOG.md перечисляет все feat и fix с прошлого выпуска
✗ CHANGELOG.md не содержит служебных коммитов (docs, chore)
✗ коммит выпуска называется «chore(release): v2.0.0» и содержит CHANGELOG.md — тега v2.0.0 нет
✗ тег v2.0.0 аннотированный (объект tag) с сообщением, содержащим 2.0.0
✗ v2.0.0 стоит на вершине main (после хука и журнала изменений)
✗ на сервере main совпадает с вашим main и содержит новые коммиты — ca0a790
✗ на сервере есть тег v2.0.0, указывающий на коммит выпуска
✗ на сервере только аннотированные теги выпусков: лёгкая метка wip-notes не опубликована — v1.2.0
✗ ветка release/1.2 отходит от тега v1.2.0 и содержит ровно один коммит — коммитов поверх v1.2.0: 
✗ исправление перенесено: «fix(parser): handle empty input» в release/1.2, новых функций там нет
✗ тег v1.2.1 аннотированный и стоит на вершине release/1.2
✗ на сервере release/1.2 совпадает с вашей и upstream настроен
✗ main не содержит коммита исправления из ветки релиза (перенос, а не слияние)
✗ коммиты после v1.2.0 в main (ваши): по Conventional Commits — ваших коммитов нет
✓ вы на main, рабочее дерево чистое

Пройдено проверок: 1 из 25`, { filename: "результат для заготовки (сразу после setup.sh)" }),
    code("text", `заготовка — 1 из 25 (красных: 24; первая: хук .githooks/commit-msg добавлен в репозиторий с правами 100755)
эталонное решение — 25 из 25
b1: хук не исполняемый (нет chmod +x) — 18 из 25 (красных: 7; первая: хук .githooks/commit-msg добавлен в репозиторий с правами 100755)
b2: хук принимает любые сообщения — 21 из 25 (красных: 4; первая: хук отклоняет некорректные заголовки (update, Fix:, feat:без пробела, feature:, fix:, пустое сообщение))
b3: core.hooksPath не настроен — 22 из 25 (красных: 3; первая: core.hooksPath указывает на .githooks)
b4: версия выбрана неверно: minor вместо major — 18 из 25 (красных: 7; первая: answers.txt, next: следующая версия по истории (есть несовместимое изменение))
b5: последний тег найден через --tags (попала лёгкая метка wip-notes) — 6 из 25 (красных: 19; первая: хук .githooks/commit-msg добавлен в репозиторий с правами 100755)
b6: в CHANGELOG попали docs и chore — 24 из 25 (красных: 1; первая: CHANGELOG.md не содержит служебных коммитов (docs, chore))
b7: тег выпуска лёгкий, а не аннотированный — 22 из 25 (красных: 3; первая: тег v2.0.0 аннотированный (объект tag) с сообщением, содержащим 2.0.0)
b8: тег выпуска поставлен до коммита с журналом изменений — 23 из 25 (красных: 2; первая: коммит выпуска называется «chore(release): v2.0.0» и содержит CHANGELOG.md)
b9: опубликовано через push --tags (утекла метка wip-notes) — 24 из 25 (красных: 1; первая: на сервере только аннотированные теги выпусков: лёгкая метка wip-notes не опубликована)
b10: ветка исправления создана от выпуска 2.0.0, а не от v1.2.0 — 18 из 25 (красных: 7; первая: answers.txt, last-tag: последний аннотированный тег до выпуска)`, { filename: "результаты check.mjs для вариантов с ошибками" }),
    tip("Проверка читает репозитории `work/` и `remote.git/` и **запускает ваш хук** на тестовых сообщениях во временном каталоге (в репозиторий ничего не пишется). Хэши исходных коммитов зашиты в `check.mjs`: они одинаковы у всех, кто создал репозитории скриптом `setup.sh` без изменений."),
    warn("Клиентский хук — удобство, а не защита: `git commit --no-verify` его обходит. В настоящей команде те же правила проверяют на сервере (серверный хук или CI) — поэтому в расширенных заданиях предложен `pre-receive`."),
  ],
};
