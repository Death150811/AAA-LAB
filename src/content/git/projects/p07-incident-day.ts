import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p07IncidentDay: Project = {
  id: "git.p07-incident-day",
  domain: "git",
  order: 7,
  title: "Итоговый проект: день аварии — от разведки до выпуска",
  subtitle: "Найти регрессию, вернуть удалённый коммит, вычистить секрет, разрешить конфликт, влить ветку, выпустить 3.0.1 и 3.1.0 и не потерять чужую работу: 27 проверок на git 2.43.0",
  level: "mastery",
  estimatedHours: 12,
  isFinal: true,
  buildsOn: [
    "git.p01-tidy-history",
    "git.p02-merge-conflicts",
    "git.p03-remote-sync",
    "git.p04-history-rescue",
    "git.p05-plumbing-repo",
    "git.p06-release-flow",
  ],
  topics: [
    "git.three-areas",
    "git.searching-history",
    "git.merge-conflicts",
    "git.remote-collaboration",
    "git.interactive-rebase",
    "git.cherry-pick-stash",
    "git.reset-revert-reflog",
    "git.bisect",
    "git.objects-content-addressing",
    "git.branching-strategies",
    "git.commit-quality-hooks",
    "git.releases-tags",
  ],
  objective:
    "Собрать в одном сценарии всё, чему учит домен Git. В репозитории `ledger-service` случилась «обычная» пятница: в `main` тихо появилась ошибка, ветка с новой функцией содержит секрет и десяток мусорных коммитов, коллега успел обновить `main` на сервере, а нужная для срочного исправления ветка удалена по ошибке. Вы **разведаете** (какой коммит всё сломал, что потеряно, как разошлись истории), **приведёте историю в порядок** (`rebase -i`, исключение секрета, перенос на свежий `main`, разрешение конфликта и тесты), **вольёте работу без потери чужой** (слияние `--no-ff`, push без force), **выпустите исправление 3.0.1** из потерянного коммита и **версию 3.1.0** аннотированными тегами и опубликуете только то, что нужно. Проект проверяет инженерную дисциплину: каждый шаг оставляет в репозиториях измеримый след, а результат подтверждается 27 проверками.",
  scenario: [
    p("`setup.sh` создаёт три каталога: `remote.git/` — общий «сервер», `work/` — ваш клон, `teammate/` — клон Боба. Состояние на старте:"),
    ul(
      "**`main`** на вашей стороне — 13 коммитов; тег `v3.0.0` стоит на восьмом. Среди коммитов после выпуска есть **регрессия**: `total()` стала терять дробную часть; `sh test.sh` на `v3.0.0` проходит, на вершине `main` падает.",
      "**Сервер** уже ушёл вперёд: Боб отправил в `main` два коммита (`feat(report): add summary section` и `fix(report): align columns`, с тестом `test-report.js`). У вас их нет.",
      "**Ветка `feature/export`** (локальная, не опубликована) — шесть коммитов: `wip`, `add env` (в нём файл `.env` с `EXPORT_TOKEN=tk-live-…`), `export.js`, `test for export`, `remove env` и `readme`. Она добавляет функцию `formatCsv` в `report.js` — **в том же месте, где работал Боб**, поэтому при переносе на свежий `main` будет конфликт.",
      "**Ветка `hotfix/rounding`** с исправлением `fix: rounding in totals` отходила от `v3.0.0`, но её **удалили** (`git branch -D`): коммит остался только в reflog.",
      "У вас есть **лёгкая локальная метка `scratch`** на `main`; на сервере её быть не должно.",
    ),
    p("Нужно привести всё в порядок и выпустить: **`v3.0.1`** (исправление округления для линии 3.0) и **`v3.1.0`** (`main` со слитой функцией экспорта). Проверка `check.mjs` анализирует **27 фактов** об итоговом состоянии сервера и вашего клона и запускает во временном каталоге тесты, взятые с сервера. Нужны `git` 2.32+ и Node.js 18+."),
    code("bash", `mkdir -p ~/devdock-git && cd ~/devdock-git
# сохраните setup.sh и check.mjs из этой страницы в текущую папку
bash setup.sh ~/devdock-git/p07        # создаёт work/ (ваш клон), remote.git (сервер), teammate/ (клон Боба)
cd ~/devdock-git/p07/work
git log --oneline --all --graph        # осмотритесь: ветки, теги, чего не хватает
# ...когда закончите, из каталога ~/devdock-git:
node check.mjs ~/devdock-git/p07`, { filename: "порядок работы" }),
    code("bash", `#!/usr/bin/env bash
# setup.sh <каталог> — создаёт «сервер» remote.git, ваш клон work/ и клон коллеги teammate/ проекта ledger-service.
# Даты и авторы фиксированы: у всех получается одно и то же.
set -e
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null   # ваши глобальные настройки Git (подпись коммитов, шаблоны…) не влияют на результат
W="\${1:?укажите каталог: bash setup.sh ~/devdock-git/p07}"
rm -rf "$W"; mkdir -p "$W"; W="$(cd "$W" && pwd)"; cd "$W"
git init -q --bare -b main remote.git
git clone -q remote.git work 2>/dev/null; git clone -q remote.git teammate 2>/dev/null
git -C work config user.name "Alice Dev"; git -C work config user.email "alice@example.com"
git -C work config gc.auto 0; git -C work config gc.reflogExpire never; git -C work config gc.reflogExpireUnreachable never   # reflog не «протухнет» из-за старых дат
git -C teammate config user.name "Bob Coder"; git -C teammate config user.email "bob@example.com"
t=1736931600
commit() {  # commit "Автор" "почта" "сообщение" — коммит всех изменений с фиксированным временем
  t=$((t+3600))
  GIT_AUTHOR_NAME="$1" GIT_AUTHOR_EMAIL="$2" GIT_COMMITTER_NAME="$1" GIT_COMMITTER_EMAIL="$2" \\
  GIT_AUTHOR_DATE="$t +0000" GIT_COMMITTER_DATE="$t +0000" git commit -q -a -m "$3"
}
ALICE=("Alice Dev" "alice@example.com"); BOB=("Bob Coder" "bob@example.com"); CAROL=("Carol Ops" "carol@example.com")
note() { mkdir -p "$(dirname "$1")"; printf '// %s\\nmodule.exports = true;\\n' "$1" > "$1"; }

# ===== история main до выпуска 3.0.0 =====
cd "$W/work"
cat > ledger.js <<'EOT'
// ledger: учёт записей
function add(entries, name, amount) {
  return entries.concat([{ name, amount }]);
}

function total(entries) {
  let sum = 0;
  for (const e of entries) sum += e.amount;
  return sum;
}

function round(x) {
  return Math.floor(x * 100) / 100;
}

module.exports = { add, total, round };
EOT
cat > run-test.js <<'EOT'
const { total } = require("./ledger");
const got = total([{ amount: 10 }, { amount: 2.5 }]);
if (got !== 12.5) { console.log("FAIL: total =", got, "(ожидалось 12.5)"); process.exit(1); }
console.log("ok");
EOT
printf '#!/bin/sh\\n# 0 — хорошо, иначе — плохо (для git bisect run)\\nnode run-test.js\\n' > test.sh
printf '# ledger-service\\n\\nУчёт записей и отчёты.\\n' > README.md
git add -A; commit "\${ALICE[@]}" "chore: init ledger service"                                         # 1
note modules/entries.js; git add -A; commit "\${ALICE[@]}" "feat: add entries"                         # 2
note modules/totals.js;  git add -A; commit "\${BOB[@]}"   "feat: add totals"                          # 3
note tests/totals.js;    git add -A; commit "\${BOB[@]}"   "test: cover totals"                        # 4
printf '\\n## Записи\\n\\nЗапись — имя и сумма.\\n' >> README.md
git add -A; commit "\${ALICE[@]}" "docs: describe ledger"                                              # 5
cat > report.js <<'EOT'
// report: текстовый отчёт
function formatReport(entries) {
  return entries.map((e) => e.name + ": " + e.amount).join("\\n");
}

module.exports = { formatReport };
EOT
git add -A; commit "\${CAROL[@]}" "feat: add report module"                                            # 6
note modules/header.js;  git add -A; commit "\${BOB[@]}"   "fix: report header"                        # 7
printf '{ "name": "ledger-service", "version": "3.0.0" }\\n' > package.json
git add -A; commit "\${CAROL[@]}" "chore: release 3.0.0"                                               # 8
GIT_COMMITTER_NAME="Carol Ops" GIT_COMMITTER_EMAIL="carol@example.com" GIT_COMMITTER_DATE="$t +0000" git tag -a v3.0.0 -m "Release v3.0.0"
# ===== после выпуска =====
note modules/currency.js; git add -A; commit "\${BOB[@]}"   "feat: add currency field"                 # 9
note modules/csv-import.js; git add -A; commit "\${CAROL[@]}" "feat: add csv import"                   # 10
cat > ledger.js <<'EOT'
// ledger: учёт записей
function add(entries, name, amount) {
  return entries.concat([{ name, amount }]);
}

function total(entries) {
  return entries.reduce((sum, e) => sum + Math.floor(e.amount), 0);
}

function round(x) {
  return Math.floor(x * 100) / 100;
}

module.exports = { add, total, round };
EOT
git add -A; commit "\${BOB[@]}"   "refactor: speed up totals"                                          # 11  <-- регрессия
note tests/csv-import.js; git add -A; commit "\${CAROL[@]}" "test: cover csv import"                   # 12
printf '\\n## Импорт\\n\\nCSV-импорт записей.\\n' >> README.md
git add -A; commit "\${ALICE[@]}" "docs: update readme"                                               # 13
git push -q origin main --follow-tags 2>/dev/null

# ===== коллега Боб обновил main на сервере (два коммита) =====
cd "$W/teammate"
git pull -q origin main 2>/dev/null
cat > report.js <<'EOT'
// report: текстовый отчёт
function formatReport(entries) {
  return entries.map((e) => e.name + ": " + e.amount).join("\\n");
}

function summarize(entries) {
  return "Total: " + entries.reduce((s, e) => s + e.amount, 0);
}

module.exports = { formatReport, summarize };
EOT
git add -A; commit "\${BOB[@]}" "feat(report): add summary section"                                    # 14
cat > report.js <<'EOT'
// report: текстовый отчёт
function formatReport(entries) {
  const width = Math.max(...entries.map((e) => e.name.length));
  return entries.map((e) => e.name.padEnd(width) + ": " + e.amount).join("\\n");
}

function summarize(entries) {
  return "Total: " + entries.reduce((s, e) => s + e.amount, 0);
}

module.exports = { formatReport, summarize };
EOT
cat > test-report.js <<'EOT'
const assert = require("assert");
const { formatReport, summarize } = require("./report");
const e = [{ name: "a", amount: 1 }, { name: "bb", amount: 22 }];
assert.strictEqual(formatReport(e), "a : 1\\nbb: 22");
assert.strictEqual(summarize(e), "Total: 23");
console.log("ok");
EOT
git add -A; commit "\${BOB[@]}" "fix(report): align columns"                                          # 15
git push -q origin main 2>/dev/null

# ===== ваша работа: «грязная» ветка feature/export от устаревшего main (13 коммитов) =====
cd "$W/work"
git switch -q -c feature/export
cat > report.js <<'EOT'
// report: текстовый отчёт
function formatReport(entries) {
  return entries.map((e) => e.name + ": " + e.amount).join("\\n");
}

function formatCsv(entries) {
  return entries.map((e) => e.name + "," + e.amount).join("\\n");
}

module.exports = { formatReport, formatCsv };
EOT
git add -A; commit "\${ALICE[@]}" "wip"                                                                  # f1
printf 'EXPORT_TOKEN=tk-live-8d41c2\\n' > .env
git add -A; commit "\${ALICE[@]}" "add env"                                                              # f2 (секрет!)
cat > export.js <<'EOT'
// export: выгрузка отчёта в CSV-файл
const fs = require("fs");
const { formatCsv } = require("./report");

function exportCsv(entries, file) {
  fs.writeFileSync(file, formatCsv(entries) + "\\n");
}

module.exports = { exportCsv };
EOT
git add -A; commit "\${ALICE[@]}" "export.js"                                                            # f3
cat > test-export.js <<'EOT'
const assert = require("assert");
const { formatCsv } = require("./report");
assert.strictEqual(formatCsv([{ name: "a", amount: 1 }, { name: "bb", amount: 22 }]), "a,1\\nbb,22");
console.log("ok");
EOT
git add -A; commit "\${ALICE[@]}" "test for export"                                                       # f4
git rm -q .env
commit "\${ALICE[@]}" "remove env"                                                                       # f5
printf '\\n## Экспорт\\n\\n\`exportCsv(entries, file)\` сохраняет записи в CSV.\\n' >> README.md
git add -A; commit "\${ALICE[@]}" "readme"                                                                # f6

# ===== случайно удалённая ветка hotfix/rounding: её коммит остался только в reflog =====
git switch -q -c hotfix/rounding v3.0.0
cat > ledger.js <<'EOT'
// ledger: учёт записей
function add(entries, name, amount) {
  return entries.concat([{ name, amount }]);
}

function total(entries) {
  let sum = 0;
  for (const e of entries) sum += e.amount;
  return sum;
}

function round(x) {
  return Math.round(x * 100) / 100;
}

module.exports = { add, total, round };
EOT
git add -A; commit "\${CAROL[@]}" "fix: rounding in totals"
git switch -q main
git branch -q -D hotfix/rounding
git tag scratch      # лёгкая локальная метка «для себя» — на сервере её быть не должно
printf 'answers.txt\\n' >> .git/info/exclude
cd "$W"
echo "Готово: $W (ваш клон — work/, сервер — remote.git, клон Боба — teammate/)"`, { filename: "setup.sh", collapsed: true }),
    table(
      ["Этап", "Что сделать", "Результат"],
      [
        ["1. Разведка", "`git fetch`; найти регрессию (`git bisect start main v3.0.0`, `bisect run sh test.sh`); найти в `feature/export` коммит, добавивший `.env`; найти в `reflog` коммит удалённой ветки; измерить расхождение `feature/export` с `origin/main`", "`answers.txt`: `first-bad:`, `secret-commit:`, `lost-commit:`, `ahead:`, `behind:`"],
        ["2. История ветки", "Интерактивный rebase `feature/export` на `origin/main`: три коммита `chore: ignore .env` → `feat(export): add csv export` → `docs: describe export`; секрет нигде; конфликт в `report.js` разрешить так, чтобы работали **и** тест Боба, **и** ваш", "Ветка опубликована с upstream; тесты `test-report.js` и `test-export.js` проходят"],
        ["3. Слияние", "Обновить `main` (`pull --ff-only`), влить ветку `--no-ff` с сообщением `Merge branch 'feature/export'`, проверить тесты, опубликовать", "На сервере `main` = коммиты Боба + слияние; без force-push"],
        ["4. Исправление 3.0.1", "Создать `release/3.0` от `v3.0.0`, перенести потерянный коммит, поставить аннотированный `v3.0.1`, опубликовать ветку и тег", "Один коммит над `v3.0.0` с тем же изменением (patch-id)"],
        ["5. Выпуск 3.1.0", "Аннотированный `v3.1.0` на вершине `main`, публикация с `--follow-tags`", "На сервере ровно три тега: `v3.0.0`, `v3.0.1`, `v3.1.0`; `scratch` остаётся у вас"],
      ],
      "Задание",
    ),
    tip("Порядок этапов важен: секрет нужно убрать **до** публикации ветки (иначе он окажется на сервере навсегда), `main` — обновить **до** слияния, а ответы — собрать **до** того, как ветка `feature/export` будет переписана (после этого исходные коммиты останутся только в reflog)."),
  ],
  requirements: [
    "`answers.txt`: `first-bad:` — коммит `refactor: speed up totals`; `secret-commit:` — коммит `add env`; `lost-commit:` — коммит `fix: rounding in totals` из reflog (хэши не короче семи знаков); `ahead: 6`, `behind: 2`.",
    "`feature/export` опубликована; локальная и серверная ветки совпадают, upstream (`origin`) настроен.",
    "Ветка отходит от вершины `main` на сервере (после работы Боба) и содержит ровно три коммита в порядке `chore: ignore .env` → `feat(export): add csv export` → `docs: describe export`; файлы: `.gitignore` / `export.js`, `report.js`, `test-export.js` / `README.md`.",
    "Исходные «грязные» коммиты (`wip`, `add env`, `export.js`, `test for export`, `remove env`, `readme`) на сервере отсутствуют; файл `.env` не встречается ни в одном коммите ни одной ветки и тега (локально и на сервере); строка `EXPORT_TOKEN` на сервере не найдена; в `main` на сервере `.gitignore` содержит `.env`.",
    "`main` на сервере продвинут вперёд (оба коммита Боба в истории, без force-push) и содержит ровно одно слияние поверх них — `Merge branch 'feature/export'`, второй родитель — вершина `feature/export`.",
    "На `main` проходят `test-report.js` (тест Боба) и `test-export.js` (ваш); оба файла не изменены (проверка по хэшам blob).",
    "`release/3.0` отходит от `v3.0.0` и содержит ровно один коммит с тем же изменением, что и «потерянный» (совпадает patch-id); аннотированный `v3.0.1` стоит на её вершине и опубликован.",
    "Аннотированный `v3.1.0` указывает на вершину `main` на сервере, в сообщении есть `3.1.0`.",
    "На сервере ровно три тега (`v3.0.0`, `v3.0.1`, `v3.1.0`) и три ветки (`main`, `feature/export`, `release/3.0`); `v3.0.0` не тронут.",
    "Ваш `main` совпадает с серверным, вы на `main`, рабочее дерево чистое, нет незавершённых `rebase`, `merge`, `bisect`.",
  ],
  constraints: [
    "Без `git push --force` и `--force-with-lease`; опубликованные теги и чужие коммиты не трогать.",
    "Без `git push --tags`: публиковать только аннотированные теги выпусков (`--follow-tags` или явное имя тега).",
    "Секрет не должен попасть на сервер ни на минуту: ветку нельзя публиковать до очистки истории.",
    "Тесты не менять и не удалять; конфликт разрешать по смыслу (оба набора функций сохранить), а не опциями `-X ours`/`-X theirs`.",
    "Исправление 3.0.1 должно быть **копией** потерянного коммита (или самим коммитом) на ветке от тега `v3.0.0`, а не слиянием `main`.",
  ],
  expected: [
    "`node check.mjs ~/devdock-git/p07` печатает `Пройдено проверок: 27 из 27`.",
    "Заготовка (сразу после `setup.sh`) проходит 2 проверки из 27: ничего ещё не опубликовано и тег `v3.0.0` на месте.",
    "Каждый из восьми «плохих» вариантов проваливает от 1 до 5 проверок, результат стабилен при повторных запусках.",
    "`git rev-list --left-right --count feature/export...origin/main` после `fetch` печатает `6` и `2`; полная проверка (включая запуск двух тестов) занимает около 0,35 секунды.",
  ],
  technical: [
    "**Не терять чужое.** После `git fetch` сравните истории (`git log --graph --all`, `rev-list --left-right --count`). Свои неопубликованные коммиты переносят `rebase`, чужие опубликованные — не трогают; `pull --ff-only` защищает от неожиданных слияний.",
    "**Секрет и порядок действий.** Файл, попавший в коммит, живёт в истории, пока на коммит есть ссылки (ветки, reflog) и пока его не собрал `gc`. Правильный порядок: исключить коммит из ветки (`drop`) → убедиться, что ни одна ссылка его не содержит → только потом публиковать. Ключ при этом всё равно отзывают.",
    "**Интерактивный rebase со скриптом.** Список действий можно подставить заранее: `GIT_SEQUENCE_EDITOR=\"cp todo\" git rebase -i <основа> <ветка>`; строка `exec <команда>` выполняет команду после очередного коммита (создать `.gitignore` и сделать коммит, переписать сообщение через `commit --amend`). `fixup` вливает коммит в предыдущий, `drop` убирает.",
    "**Конфликт при переносе.** Rebase останавливается на коммите с конфликтом: `git status` показывает `both modified`; после правки — `git add` и `git rebase --continue`. Правят **оба** изменения: добавленные функции и строку `module.exports`.",
    "**Слияние как фиксация.** `merge --no-ff` оставляет коммит слияния даже при возможной перемотке: на первой линии `main` видна «веха» с вашей веткой в качестве второго родителя (`git log --first-parent`).",
    "**reflog как страховка.** `git reflog` показывает перемещения `HEAD`, в том числе `commit: fix: rounding in totals` удалённой ветки; хэш из него можно вернуть командой `branch`/`switch -c`/`cherry-pick`. `git branch -D` не уничтожает коммиты немедленно.",
    "**Hotfix от тега.** Ветка для исправления старой линии начинается с тега (`git switch -c release/3.0 v3.0.0`); `cherry-pick -x` копирует изменение, `patch-id` у копии и оригинала одинаков (так проверка узнаёт «то же изменение»).",
    "**Публикация выпусков.** `git push --follow-tags` отправляет вместе с веткой только аннотированные теги, достижимые из неё; лёгкая метка `scratch` остаётся локальной.",
  ],
  acceptance: [
    "`node check.mjs ~/devdock-git/p07` — 27 из 27, `git status` чистый.",
    "`git log --oneline --graph --all --decorate` показывает на `main` слияние `feature/export` поверх коммитов Боба, тег `v3.1.0`, а отдельно — `release/3.0` с `v3.0.1`, отходящий от `v3.0.0`.",
    "`git ls-remote --tags origin` перечисляет три тега выпусков, но не `scratch`; `git log --all -- .env` ничего не выводит ни в `work/`, ни в `remote.git/`.",
    "Вы можете объяснить порядок действий: почему секрет убирают до публикации, зачем `pull --ff-only` перед слиянием и почему исправление 3.0.1 делается от тега, а не от `main`.",
  ],
  hints: [
    "Начните с `git fetch` и `git log --oneline --all --graph`. Запишите хэши ключевых коммитов до переписывания ветки (`git rev-parse feature/export`).",
    "Регрессию ищет `git bisect start main v3.0.0` + `git bisect run sh test.sh`; не забудьте `git bisect reset`. Автор секрета — `git log feature/export --diff-filter=A -- .env`.",
    "Потерянный коммит: `git reflog` (поищите `commit: fix: rounding in totals`); `git cat-file -p <хэш>` покажет, что это тот самый коммит.",
    "Расхождение: `git rev-list --left-right --count feature/export...origin/main` (первое число — ваши коммиты, второе — Боба).",
    "Для rebase: `git rebase -i origin/main feature/export`. Строки `exec`, `pick`, `fixup`, `drop` и их порядок можно подготовить заранее и подставить через `GIT_SEQUENCE_EDITOR`.",
    "При конфликте в `report.js` оставьте обе функции (`summarize` Боба и `formatCsv`) и обе записи в `module.exports`; затем `node test-report.js && node test-export.js`, `git add report.js`, `git rebase --continue`.",
    "Публикуйте ветку только после того, как `git log --all -- .env` пуст: `git push -u origin feature/export`.",
    "Слияние: `git switch main && git pull --ff-only origin main && git merge --no-ff feature/export` (сообщение `Merge branch 'feature/export'`), тесты, `git push origin main`.",
    "Исправление: `git switch -c release/3.0 v3.0.0 && git cherry-pick -x <хэш из reflog>`, `git tag -a v3.0.1 -m …`, `git push -u origin release/3.0 --follow-tags`.",
    "Выпуск: `git switch main && git tag -a v3.1.0 -m \"Release v3.1.0\" && git push --follow-tags origin main`. Проверьте `git ls-remote --tags --heads origin`.",
  ],
  advanced: [
    "Перенесите исправление округления и в `main` отдельным `cherry-pick` и добавьте `v3.1.1`; объясните, почему `v3.0.1` и `v3.1.1` содержат «одно и то же» изменение с разными хэшами.",
    "Исправьте регрессию в `main` через `git revert` найденного коммита; сравните с исправлением новым коммитом и объясните выбор для опубликованной истории.",
    "Удалите следы секрета из локального репозитория (`git reflog expire --expire=now --all && git gc --prune=now`) и проверьте `git cat-file -e <хэш add env>`; почему на сервере этого мало и что нужно сделать с ключом?",
    "Напишите хук `pre-push`, который запрещает публиковать ветки, где в истории есть `.env`, и проверьте его на «грязной» версии `feature/export`.",
    "Включите `rerere` (`git config rerere.enabled true`), повторите перенос на `origin/main` и посмотрите, как Git запоминает разрешение конфликта.",
    "Проведите ту же операцию переносом через `merge` вместо rebase и сравните историю ветки; какие требования проверки перестанут выполняться?",
  ],
  failureModes: [
    "**Конфликт «разрешён в пользу Боба»:** `formatCsv` потерян, `test-export.js` не проходит; коммит `wip` после такого разрешения пустой и пропадает, поэтому `commit --amend` переписывает коммит с `.gitignore`, и в ветке остаётся два коммита вместо трёх (3 красные из 27).",
    "**Секретный коммит оставлен в истории ветки:** `.env` и токен остаются в опубликованных коммитах, число и состав коммитов ветки не те (4 красные).",
    "**Слияние перемоткой (`--ff-only`):** коммита слияния нет, `Merge branch 'feature/export'` не фиксируется (2 красные).",
    "**Лёгкие теги выпусков:** `--follow-tags` их не отправляет, на сервере нет `v3.0.1` и `v3.1.0` (3 красные).",
    "**Исправление 3.0.1 не выпущено:** ветки `release/3.0` и тега `v3.0.1` нет, набор тегов и веток на сервере неполон (5 красных).",
    "**`push --tags`:** на сервер утекает локальная метка `scratch` (1 красная).",
    "**Перепутаны `ahead` и `behind`:** ответы расходятся с `rev-list --left-right` (2 красные).",
    "**Ветка `release/3.0` создана от `main`, а не от тега:** в «исправлении» оказывается вся новая работа (1 красная: проверка основы и числа коммитов).",
  ],
  rubric: [
    { criterion: "Разведка и диагностика", weight: 15, description: "Регрессия найдена bisect'ом, потерянный коммит — в reflog, автор секрета — по `log --diff-filter`, расхождение измерено; ответы верны." },
    { criterion: "Чистая история и конфликт", weight: 25, description: "Три осмысленных коммита вместо шести, секрета нет, ветка перенесена на свежий `main`, конфликт разрешён по смыслу, оба теста проходят и не изменены." },
    { criterion: "Слияние и публикация без потери чужого", weight: 20, description: "`main` обновлён `--ff-only`, слияние `--no-ff` с верным сообщением, коммиты Боба сохранены, force-push не использован." },
    { criterion: "Выпуски и теги", weight: 25, description: "Ветка `release/3.0` от тега с одним перенесённым коммитом, аннотированные `v3.0.1` и `v3.1.0`, публикация `--follow-tags`, `scratch` не утекла, набор веток и тегов на сервере верный." },
    { criterion: "Безопасность и аккуратность", weight: 15, description: "Секрет не публиковался, порядок действий выдержан, чистое дерево, нет незавершённых операций, итог 27 из 27." },
  ],
  solution: [
    p("Эталон — скрипт из 72 строк: он проходит все 27 проверок; заготовка проходит 2, а каждый из восьми намеренно испорченных вариантов проходит от 22 до 26 проверок из 27. Ниже — решение, проверяющий скрипт и результаты запусков на git 2.43.0."),
    h("solution.sh"),
    code("bash", `#!/usr/bin/env bash
# solution.sh <каталог> — эталонное решение (запускается после setup.sh)
set -e
W="$(cd "\${1:?укажите каталог}" && pwd)"
cd "$W/work"
export GIT_EDITOR=true

# ---------- 1. Разведка: расхождение, секрет, потерянный коммит, регрессия ----------
git fetch -q origin
read -r ahead behind < <(git rev-list --left-right --count feature/export...origin/main)       # ваши / чужие коммиты
secret="$(git log feature/export --diff-filter=A --format=%h -- .env)"                          # кто добавил .env
lost="$(git reflog | grep 'commit: fix: rounding in totals' | cut -d' ' -f1)"                   # удалённая ветка hotfix/rounding
git bisect start main v3.0.0 > /dev/null
git bisect run sh test.sh > /dev/null
bad="$(git rev-parse refs/bisect/bad)"
git bisect reset > /dev/null 2>&1
printf 'first-bad: %s\\nsecret-commit: %s\\nlost-commit: %s\\nahead: %s\\nbehind: %s\\n' \\
  "$(git rev-parse --short "$bad")" "$secret" "$lost" "$ahead" "$behind" > "$W/answers.txt"

# ---------- 2. feature/export: из шести «грязных» коммитов — чистая ветка поверх свежего origin/main ----------
h() { git log --format=%h --grep="^$1\\$" feature/export; }
todo="$(mktemp)"
cat > "$todo" <<EOT
exec printf '.env\\n' > .gitignore && git add .gitignore && git commit -q -m "chore: ignore .env"
pick $(h wip)
fixup $(h export.js)
fixup $(h "test for export")
exec git commit --amend -q -m "feat(export): add csv export"
pick $(h readme)
exec git commit --amend -q -m "docs: describe export"
drop $(h "add env")
drop $(h "remove env")
EOT
GIT_SEQUENCE_EDITOR="cp $todo" git rebase -q -i origin/main feature/export > /dev/null 2>&1 || true   # остановится на конфликте в report.js
cat > report.js <<'EOT'
// report: текстовый отчёт
function formatReport(entries) {
  const width = Math.max(...entries.map((e) => e.name.length));
  return entries.map((e) => e.name.padEnd(width) + ": " + e.amount).join("\\n");
}

function summarize(entries) {
  return "Total: " + entries.reduce((s, e) => s + e.amount, 0);
}

function formatCsv(entries) {
  return entries.map((e) => e.name + "," + e.amount).join("\\n");
}

module.exports = { formatReport, summarize, formatCsv };
EOT
git add report.js
git rebase --continue > /dev/null
git push -q -u origin feature/export

# ---------- 3. Слияние в main: обновляем main, сливаем с --no-ff, проверяем тесты, публикуем ----------
git switch -q main
git pull -q --ff-only origin main
git merge -q --no-ff -m "Merge branch 'feature/export'" feature/export
node test-report.js > /dev/null && node test-export.js > /dev/null
git push -q origin main

# ---------- 4. Исправление 3.0.1 для старой линии: коммит из reflog переносится на ветку от тега ----------
git switch -q -c release/3.0 v3.0.0
git cherry-pick -x "$lost" > /dev/null
git tag -a v3.0.1 -m "Release v3.0.1"
git push -q -u origin release/3.0 --follow-tags
git switch -q main

# ---------- 5. Выпуск 3.1.0 ----------
git tag -a v3.1.0 -m "Release v3.1.0"
git push -q --follow-tags origin main`, { filename: "solution.sh", lineNumbers: true }),
    ul(
      "**Разведка.** `fetch` приносит два коммита Боба; `rev-list --left-right --count feature/export...origin/main` печатает `6` и `2`; `log --diff-filter=A -- .env` находит коммит `add env`; `reflog` — коммит `fix: rounding in totals`; `bisect run sh test.sh` приводит к `refactor: speed up totals`.",
      "**История ветки.** Скрипт подставляет список действий: сначала `exec` создаёт `.gitignore` и коммит `chore: ignore .env`, затем `wip` + `export.js` + `test for export` сливаются в `feat(export): add csv export`, `readme` становится `docs: describe export`, а `add env` и `remove env` исключены через `drop`. Rebase останавливается на конфликте в `report.js`; разрешение содержит `formatReport` (с выравниванием) и `summarize` Боба и `formatCsv`, `module.exports` перечисляет все три функции.",
      "**Слияние.** `pull --ff-only` подтягивает Боба в локальный `main`, `merge --no-ff` создаёт коммит слияния; `node test-report.js` и `node test-export.js` проходят до публикации.",
      "**Выпуски.** `release/3.0` создаётся от `v3.0.0`, `cherry-pick -x` копирует потерянный коммит (patch-id совпадает с оригиналом), `v3.0.1` и `v3.1.0` — аннотированные теги, оба уходят `--follow-tags`; метка `scratch` остаётся локальной.",
    ),
    h("check.mjs"),
    code("js", `#!/usr/bin/env node
// check.mjs <каталог> — проверка проекта 7 «Итоговый проект: день аварии». Каталог — тот, что создал setup.sh
// (внутри work/, remote.git, teammate/ и ваш answers.txt). Требуется Node.js 18+ и git.
// Проверка читает репозитории; тесты запускаются во временном каталоге из файлов, взятых с сервера.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
// Исходные объекты (setup.sh воспроизводим, поэтому их хэши известны заранее)
const MAIN_S = "a371a0b58414109412e28d177fad8cf7803fbe57";  // вершина main на сервере после работы Боба: «fix(report): align columns»
const BOB1 = "74dffe5138dc60bd14cf532e4ed73f2c6645e68b";      // «feat(report): add summary section»
const V300 = "5d102f713aa434d0cef96ffc834e8f2e639676e7";      // коммит выпуска 3.0.0
const BAD = "2a40e775c59f390a45b225e85f095e3f2369c061";        // «refactor: speed up totals» — регрессия
const SECRET = "5ac30ef1ba6c11a525f97e42f0b6471b6697de8f";  // «add env» — коммит, добавивший .env
const LOST = "d2cb272f22d54eb99f43b607abe70152d89fe975";      // «fix: rounding in totals» — коммит удалённой ветки hotfix/rounding
const MESSY = "80f21ae18db6c22f15ef043ea55a196e3785d38d,5ac30ef1ba6c11a525f97e42f0b6471b6697de8f,cffdc8d1c169fbd9b55a17dd26e4c9a4d3cbc2e2,a5303e3c67e3d720c7eee161afed8ae15c25f23a,077ac34cf0b8031041cbcd378692bfbab1480d0c,b942a3454874e8bdafaa6d0bb7f2b39a25c2dd7d".split(","); // шесть исходных «грязных» коммитов feature/export
const BLOB = { testReport: "a43df219d10d55932c17e6124f5d1650c52eddf2", testExport: "291904ded0d5d0be8175fc6aac7ae3f37ba405db" };
const answers = existsSync(join(W, "answers.txt")) ? read(join(W, "answers.txt")) : "";
const answer = (k) => (answers.match(new RegExp(\`^\${k}:\\\\s*(\\\\S.*?)\\\\s*$\`, "m")) ?? [])[1] ?? "";
const same = (a, full) => a.length >= 7 && wg(["rev-parse", "--verify", "-q", \`\${a}^{commit}\`]).out === full;
const rev = (cwd, r) => git(["rev-parse", "--verify", "-q", r], cwd).out;
const sMain = rev(remote, "refs/heads/main"), sFeat = rev(remote, "refs/heads/feature/export"), sRel = rev(remote, "refs/heads/release/3.0");
const subjects = (range) => lines(rg(["log", "--reverse", "--format=%s", range]).out);
const filesOf = (c) => lines(rg(["diff-tree", "--no-commit-id", "--name-only", "-r", "--root", c]).out).sort().join();
const featCommits = sFeat ? lines(rg(["log", "--reverse", "--format=%H", \`\${MAIN_S}..\${sFeat}\`]).out) : [];
const isAnc = (a, b, cwd = remote) => git(["merge-base", "--is-ancestor", a, b], cwd).ok;
const patchId = (cwd, c) => { const show = git(["show", c], cwd).out + "\\n"; const r = spawnSync("git", ["patch-id", "--stable"], { cwd, env: ENV, input: show, encoding: "utf8" }); return (r.stdout ?? "").split(" ")[0]; };
const runTests = () => {
  if (!sMain) return [false, "main на сервере не найден"];
  const d = mkdtempSync(join(tmpdir(), "p07-"));
  try {
    for (const f of ["report.js", "test-report.js", "test-export.js"]) { const r = rg(["show", \`\${sMain}:\${f}\`]); if (!r.ok) return [false, \`в main на сервере нет \${f}\`]; writeFileSync(join(d, f), r.out + "\\n"); }
    const res = ["test-report.js", "test-export.js"].map((f) => { const r = spawnSync("node", [f], { cwd: d, encoding: "utf8" }); return [f, r.status === 0, (r.stderr || "").split("\\n").find((l) => /Error|assert/.test(l)) ?? ""]; });
    return res;
  } finally { rmSync(d, { recursive: true, force: true }); }
};
const tests = runTests();
const tagsRemote = lines(rg(["tag", "-l"]).out).sort().join(",");
const branchesRemote = lines(rg(["for-each-ref", "--format=%(refname:short)", "refs/heads"]).out).sort().join(",");

// --- разведка и ответы ---
check("answers.txt, first-bad: коммит, внёсший регрессию в total()", () => [same(answer("first-bad"), BAD), answer("first-bad") || "нет строки «first-bad: <хэш>»"]);
check("answers.txt, secret-commit: коммит, добавивший файл .env", () => [same(answer("secret-commit"), SECRET), answer("secret-commit") || "нет строки «secret-commit: <хэш>»"]);
check("answers.txt, lost-commit: коммит удалённой ветки hotfix/rounding (из reflog)", () => [same(answer("lost-commit"), LOST), answer("lost-commit") || "нет строки «lost-commit: <хэш>»"]);
check("answers.txt, ahead: сколько коммитов у feature/export относительно origin/main", () => [answer("ahead") === "6", answer("ahead") || "нет строки «ahead: <число>»"]);
check("answers.txt, behind: сколько новых коммитов Боба на сервере", () => [answer("behind") === "2", answer("behind") || "нет строки «behind: <число>»"]);
// --- feature/export ---
check("feature/export опубликована; локальная ветка совпадает с серверной, upstream настроен", () => [sFeat !== "" && rev(work, "refs/heads/feature/export") === sFeat && wg(["config", "--get", "branch.feature/export.remote"]).out === "origin", ""]);
check("feature/export перенесена на свежий main: вершина main после работы Боба — её предок", () => sFeat !== "" && isAnc(MAIN_S, sFeat));
check("ровно три коммита: «chore: ignore .env» → «feat(export): add csv export» → «docs: describe export»", () => { const s = sFeat ? subjects(\`\${MAIN_S}..\${sFeat}\`) : []; return [s.join(" | ") === "chore: ignore .env | feat(export): add csv export | docs: describe export", s.join(" | ") || "ветки нет"]; });
check("состав коммитов: .gitignore / export.js, report.js, test-export.js / README.md", () => { const f = featCommits.map(filesOf); return [f.join(" | ") === ".gitignore | export.js,report.js,test-export.js | README.md", f.join(" | ")]; });
check("исходные «грязные» коммиты (wip, add env, … readme) на сервере отсутствуют", () => sFeat !== "" && MESSY.every((c) => c !== "" && !isAnc(c, sFeat || "HEAD") && !isAnc(c, sMain || "HEAD")));
check("файл .env не встречается ни в одном коммите ни одной ветки и тега (локально и на сервере)", () => wg(["log", "--all", "--format=%H", "--", ".env"]).out === "" && rg(["log", "--all", "--format=%H", "--", ".env"]).out === "");
check("секрет (EXPORT_TOKEN) не попал на сервер", () => rg(["log", "--all", "-S", "EXPORT_TOKEN", "--format=%H"]).out === "");
check("правило .env есть в .gitignore в main на сервере", () => sMain !== "" && lines(rg(["show", \`\${sMain}:.gitignore\`]).out).includes(".env"));
// --- слияние ---
check("main на сервере продвинут вперёд: коммиты Боба на месте (без force-push)", () => sMain !== "" && sMain !== MAIN_S && isAnc(MAIN_S, sMain) && isAnc(BOB1, sMain));
check("в main ровно одно слияние поверх коммитов Боба: «Merge branch 'feature/export'»", () => { const m = sMain ? lines(rg(["log", "--first-parent", "--merges", "--format=%s", \`\${MAIN_S}..\${sMain}\`]).out) : []; return [m.length === 1 && m[0] === "Merge branch 'feature/export'", m.join(" | ") || "слияния нет"]; });
check("второй родитель слияния: вершина feature/export", () => { const p = sMain ? rg(["rev-list", "--parents", "-n1", sMain]).out.split(" ") : []; return p.length === 3 && p[2] === sFeat && sFeat !== ""; });
check("test-report.js (тест Боба) на main проходит: конфликт разрешён без потери его кода", () => Array.isArray(tests[0]) ? [tests[0][1], tests[0][2]] : tests);
check("test-export.js на main проходит: ваша функция formatCsv сохранена", () => Array.isArray(tests[1]) ? [tests[1][1], tests[1][2]] : [false, ""]);
check("файлы тестов не изменены (хэши совпадают с исходными)", () => sMain !== "" && rg(["rev-parse", \`\${sMain}:test-report.js\`]).out === BLOB.testReport && rg(["rev-parse", \`\${sMain}:test-export.js\`]).out === BLOB.testExport);
// --- hotfix 3.0.1 ---
check("release/3.0 отходит от v3.0.0 и содержит ровно один коммит", () => [sRel !== "" && rg(["merge-base", V300, sRel]).out === V300 && rg(["rev-list", "--count", \`\${V300}..\${sRel}\`]).out === "1", sRel ? \`коммитов: \${rg(["rev-list", "--count", \`\${V300}..\${sRel}\`]).out}\` : "ветки нет на сервере"]);
check("этот коммит — то же изменение, что в «потерянном» коммите (patch-id совпадает)", () => { const a = sRel ? patchId(work, sRel) : "", b = patchId(work, LOST); return [a !== "" && a === b, ""]; });
check("тег v3.0.1 аннотированный, стоит на вершине release/3.0 и опубликован", () => sRel !== "" && wg(["cat-file", "-t", "refs/tags/v3.0.1"]).out === "tag" && rg(["rev-parse", "--verify", "-q", "refs/tags/v3.0.1^{commit}"]).out === sRel);
// --- выпуск 3.1.0 и порядок на сервере ---
check("тег v3.1.0 аннотированный, указывает на вершину main на сервере; в сообщении есть 3.1.0", () => sMain !== "" && rg(["cat-file", "-t", "refs/tags/v3.1.0"]).out === "tag" && rg(["rev-parse", "--verify", "-q", "refs/tags/v3.1.0^{commit}"]).out === sMain && rg(["tag", "-l", "-n1", "v3.1.0"]).out.includes("3.1.0"));
check("на сервере ровно три тега выпусков: v3.0.0, v3.0.1, v3.1.0 (метка scratch не опубликована)", () => [tagsRemote === "v3.0.0,v3.0.1,v3.1.0", tagsRemote]);
check("на сервере ровно три ветки: main, feature/export, release/3.0", () => [branchesRemote === "feature/export,main,release/3.0", branchesRemote]);
check("тег v3.0.0 не тронут", () => rg(["rev-parse", "--verify", "-q", "refs/tags/v3.0.0^{commit}"]).out === V300);
check("ваш main совпадает с серверным; вы на main, дерево чистое, rebase/merge/bisect не запущены", () => wg(["rev-parse", "main"]).out === sMain && sMain !== "" && wg(["rev-parse", "--abbrev-ref", "HEAD"]).out === "main" && wg(["status", "--porcelain"]).out === "" && !existsSync(join(work, ".git", "rebase-merge")) && !existsSync(join(work, ".git", "rebase-apply")) && !existsSync(join(work, ".git", "MERGE_HEAD")) && !existsSync(join(work, ".git", "BISECT_START")));

summary();`, { filename: "check.mjs", collapsed: true }),
    code("text", `✓ answers.txt, first-bad: коммит, внёсший регрессию в total()
✓ answers.txt, secret-commit: коммит, добавивший файл .env
✓ answers.txt, lost-commit: коммит удалённой ветки hotfix/rounding (из reflog)
✓ answers.txt, ahead: сколько коммитов у feature/export относительно origin/main
✓ answers.txt, behind: сколько новых коммитов Боба на сервере
✓ feature/export опубликована; локальная ветка совпадает с серверной, upstream настроен
✓ feature/export перенесена на свежий main: вершина main после работы Боба — её предок
✓ ровно три коммита: «chore: ignore .env» → «feat(export): add csv export» → «docs: describe export»
✓ состав коммитов: .gitignore / export.js, report.js, test-export.js / README.md
✓ исходные «грязные» коммиты (wip, add env, … readme) на сервере отсутствуют
✓ файл .env не встречается ни в одном коммите ни одной ветки и тега (локально и на сервере)
✓ секрет (EXPORT_TOKEN) не попал на сервер
✓ правило .env есть в .gitignore в main на сервере
✓ main на сервере продвинут вперёд: коммиты Боба на месте (без force-push)
✓ в main ровно одно слияние поверх коммитов Боба: «Merge branch 'feature/export'»
✓ второй родитель слияния: вершина feature/export
✓ test-report.js (тест Боба) на main проходит: конфликт разрешён без потери его кода
✓ test-export.js на main проходит: ваша функция formatCsv сохранена
✓ файлы тестов не изменены (хэши совпадают с исходными)
✓ release/3.0 отходит от v3.0.0 и содержит ровно один коммит
✓ этот коммит — то же изменение, что в «потерянном» коммите (patch-id совпадает)
✓ тег v3.0.1 аннотированный, стоит на вершине release/3.0 и опубликован
✓ тег v3.1.0 аннотированный, указывает на вершину main на сервере; в сообщении есть 3.1.0
✓ на сервере ровно три тега выпусков: v3.0.0, v3.0.1, v3.1.0 (метка scratch не опубликована)
✓ на сервере ровно три ветки: main, feature/export, release/3.0
✓ тег v3.0.0 не тронут
✓ ваш main совпадает с серверным; вы на main, дерево чистое, rebase/merge/bisect не запущены

Пройдено проверок: 27 из 27`, { filename: "результат node check.mjs (эталонное решение, git 2.43.0)" }),
    code("text", `✗ answers.txt, first-bad: коммит, внёсший регрессию в total() — нет строки «first-bad: <хэш>»
✗ answers.txt, secret-commit: коммит, добавивший файл .env — нет строки «secret-commit: <хэш>»
✗ answers.txt, lost-commit: коммит удалённой ветки hotfix/rounding (из reflog) — нет строки «lost-commit: <хэш>»
✗ answers.txt, ahead: сколько коммитов у feature/export относительно origin/main — нет строки «ahead: <число>»
✗ answers.txt, behind: сколько новых коммитов Боба на сервере — нет строки «behind: <число>»
✗ feature/export опубликована; локальная ветка совпадает с серверной, upstream настроен
✗ feature/export перенесена на свежий main: вершина main после работы Боба — её предок
✗ ровно три коммита: «chore: ignore .env» → «feat(export): add csv export» → «docs: describe export» — ветки нет
✗ состав коммитов: .gitignore / export.js, report.js, test-export.js / README.md
✗ исходные «грязные» коммиты (wip, add env, … readme) на сервере отсутствуют
✗ файл .env не встречается ни в одном коммите ни одной ветки и тега (локально и на сервере)
✓ секрет (EXPORT_TOKEN) не попал на сервер
✗ правило .env есть в .gitignore в main на сервере
✗ main на сервере продвинут вперёд: коммиты Боба на месте (без force-push)
✗ в main ровно одно слияние поверх коммитов Боба: «Merge branch 'feature/export'» — слияния нет
✗ второй родитель слияния: вершина feature/export
✗ test-report.js (тест Боба) на main проходит: конфликт разрешён без потери его кода — в main на сервере нет test-export.js
✗ test-export.js на main проходит: ваша функция formatCsv сохранена
✗ файлы тестов не изменены (хэши совпадают с исходными)
✗ release/3.0 отходит от v3.0.0 и содержит ровно один коммит — ветки нет на сервере
✗ этот коммит — то же изменение, что в «потерянном» коммите (patch-id совпадает)
✗ тег v3.0.1 аннотированный, стоит на вершине release/3.0 и опубликован
✗ тег v3.1.0 аннотированный, указывает на вершину main на сервере; в сообщении есть 3.1.0
✗ на сервере ровно три тега выпусков: v3.0.0, v3.0.1, v3.1.0 (метка scratch не опубликована) — v3.0.0
✗ на сервере ровно три ветки: main, feature/export, release/3.0 — main
✓ тег v3.0.0 не тронут
✗ ваш main совпадает с серверным; вы на main, дерево чистое, rebase/merge/bisect не запущены

Пройдено проверок: 2 из 27`, { filename: "результат для заготовки (сразу после setup.sh)" }),
    code("text", `заготовка — 2 из 27 (красных: 25; первая: answers.txt, first-bad: коммит, внёсший регрессию в total())
эталонное решение — 27 из 27
b1: конфликт разрешён «в пользу Боба»: formatCsv потерян — 24 из 27 (красных: 3; первая: ровно три коммита: «chore: ignore .env» → «feat(export): add csv export» → «docs: describe export»)
b2: секретный коммит оставлен в истории ветки — 23 из 27 (красных: 4; первая: ровно три коммита: «chore: ignore .env» → «feat(export): add csv export» → «docs: describe export»)
b3: слияние перемоткой (без коммита слияния) — 25 из 27 (красных: 2; первая: в main ровно одно слияние поверх коммитов Боба: «Merge branch 'feature/export'»)
b4: теги выпусков лёгкие: --follow-tags их не отправляет — 24 из 27 (красных: 3; первая: тег v3.0.1 аннотированный, стоит на вершине release/3.0 и опубликован)
b5: исправление 3.0.1 не выпущено — 22 из 27 (красных: 5; первая: release/3.0 отходит от v3.0.0 и содержит ровно один коммит)
b6: опубликовано через push --tags (утекла метка scratch) — 26 из 27 (красных: 1; первая: на сервере ровно три тега выпусков: v3.0.0, v3.0.1, v3.1.0 (метка scratch не опубликована))
b7: в ответах перепутаны ahead и behind — 25 из 27 (красных: 2; первая: answers.txt, ahead: сколько коммитов у feature/export относительно origin/main)
b8: ветка release/3.0 создана от main, а не от тега v3.0.0 — 26 из 27 (красных: 1; первая: release/3.0 отходит от v3.0.0 и содержит ровно один коммит)`, { filename: "результаты check.mjs для вариантов с ошибками" }),
    tip("Проверка читает репозитории `work/` и `remote.git/`; тесты запускаются во временном каталоге из файлов `report.js`, `test-report.js`, `test-export.js`, взятых из `main` **на сервере** (ваши рабочие файлы не используются). Хэши исходных коммитов и тестов зашиты в `check.mjs`: они одинаковы у всех, кто создал репозитории скриптом `setup.sh` без изменений."),
    warn("`setup.sh` отключает автоматическую сборку мусора и устаревание reflog в `work/`: даты коммитов фиксированы в прошлом, а `gc` по умолчанию удаляет старые записи reflog. В реальном репозитории потерянный коммит доступен ограниченное время — восстанавливайте сразу."),
  ],
};
