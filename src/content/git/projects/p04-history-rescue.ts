import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p04HistoryRescue: Project = {
  id: "git.p04-history-rescue",
  domain: "git",
  order: 4,
  title: "Переписать историю, вернуть потерянное, найти виновного",
  subtitle: "Грязная ветка с секретом — в три чистых коммита, потерянные после reset --hard коммиты — из reflog, регрессия среди 24 коммитов — через bisect: 17 проверок на git 2.43.0",
  level: "advanced",
  estimatedHours: 6,
  buildsOn: ["git.p03-remote-sync"],
  topics: [
    "git.rebase",
    "git.interactive-rebase",
    "git.reset-revert-reflog",
    "git.bisect",
    "git.searching-history",
  ],
  objective:
    "Решить три «аварийные» задачи одного репозитория и подтвердить каждую проверяемым результатом: (1) **привести в порядок ветку** `feature/search` — из семи коммитов (`wip`, `oops forgot app.js`, …) с случайно закоммиченным ключом сделать три осмысленных коммита так, чтобы секрета не было **ни в одном** коммите ветки; (2) **вернуть коммиты**, пропавшие с `release/1.0` после `git reset --hard`, — причём исходные, с теми же хэшами, а не копии; (3) **найти коммит с регрессией** среди 24 коммитов `main` бинарным поиском `git bisect` и записать ответы. Проект про то, что в Git почти ничего не пропадает сразу (reflog), а историю до публикации можно и нужно переписывать — аккуратно и с проверкой результата.",
  scenario: [
    p("Репозиторий `inventory-app` — учёт склада. Скрипт `setup.sh` создаёт в нём три ситуации:"),
    ul(
      "**Ветка `feature/search`** отходит от вершины `main`. Боб набросал поиск «как получилось»: коммиты `wip`, `add tests`, `oops forgot app.js`, `add local config` (в нём файл `config.local` с ключом `API_KEY=sk-live-…`), `fix typo in search`, `readme`, `remove local config`. Ветка не опубликована — переписывать её можно. Нужно получить три коммита: `feat: add search` (код: `search.js` и `app.js`, включая исправление опечатки), `test: cover search` и `docs: describe search`; секрет нигде не должен встречаться.",
      "**Ветка `release/1.0`** отходит от тега `v1.0`. Кэрол сделала два исправления (`fix: rounding in invoice`, `docs: changelog 1.0.1`), а затем «откатила» лишнее командой `git reset --hard HEAD~2` — теперь ветка снова указывает на `v1.0`, а исправлений в `git log` нет. Нужно вернуть именно эти коммиты.",
      "**Ветка `main`** содержит 24 коммита и тег `v1.0` на восьмом. Где-то после выпуска функция `totalValue` стала считать неверно: тест `sh test.sh` на `v1.0` проходит, а на вершине `main` падает. Нужно найти коммит, где всё сломалось, не просматривая шестнадцать коммитов вручную.",
    ),
    p("Скрипт создаёт также файл `answers.txt` (его нужно заполнить; он в `.git/info/exclude`, поэтому рабочее дерево остаётся чистым). Затем `check.mjs` проверяет **17 фактов** — историю веток, состояние `main`, тег и ваши ответы. Нужны `git` 2.32+ и Node.js 18+."),
    code("bash", `mkdir -p ~/devdock-git && cd ~/devdock-git
# сохраните setup.sh и check.mjs из этой страницы в текущую папку
bash setup.sh ~/devdock-git/p04        # создать учебный репозиторий
cd ~/devdock-git/p04
git branch -vv && git log --oneline --graph --all | head -20
# ...когда закончите:
node ../check.mjs ~/devdock-git/p04`, { filename: "порядок работы" }),
    code("bash", `#!/usr/bin/env bash
# setup.sh <каталог> — создаёт репозиторий inventory-app: main (24 коммита, тег v1.0, регрессия), «грязную» ветку feature/search
# и ветку release/1.0, из которой «случайно» пропали два коммита. Даты и авторы фиксированы.
set -e
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null   # ваши глобальные настройки Git (подпись коммитов, шаблоны…) не влияют на результат
W="\${1:?укажите каталог: bash setup.sh ~/devdock-git/p04}"
rm -rf "$W"; mkdir -p "$W"; cd "$W"
git init -q -b main
git config user.name "Student"; git config user.email "student@example.com"
git config gc.auto 0; git config gc.reflogExpire never; git config gc.reflogExpireUnreachable never   # reflog не «протухнет» из-за старых дат
printf 'answers.txt\\n' >> .git/info/exclude
t=1736931600
commit() {  # commit "Автор" "почта" "сообщение" — коммит всех изменений с фиксированным временем
  t=$((t+3600))
  GIT_AUTHOR_NAME="$1" GIT_AUTHOR_EMAIL="$2" GIT_COMMITTER_NAME="$1" GIT_COMMITTER_EMAIL="$2" \\
  GIT_AUTHOR_DATE="$t +0000" GIT_COMMITTER_DATE="$t +0000" git commit -q -a -m "$3"
}
ALICE=("Alice Dev" "alice@example.com"); BOB=("Bob Coder" "bob@example.com"); CAROL=("Carol Ops" "carol@example.com")
note() {  # note "файл" — добавить небольшой файл-«изменение»
  mkdir -p "$(dirname "$1")"; printf '// %s\\nmodule.exports = true;\\n' "$1" > "$1"
}

# ---------- main: 24 коммита ----------
cat > inventory.js <<'EOT'
// inventory: суммарная стоимость склада
function totalValue(items) {
  let sum = 0;
  for (const it of items) sum += it.price * it.qty;
  return sum;
}

function normalize(name) {
  return name;
}

module.exports = { totalValue, normalize };
EOT
cat > run-test.js <<'EOT'
const { totalValue } = require("./inventory");
const got = totalValue([{ price: 10, qty: 3 }, { price: 2.5, qty: 4 }]);
if (got !== 40) { console.log("FAIL: totalValue =", got, "(ожидалось 40)"); process.exit(1); }
console.log("ok");
EOT
printf '#!/bin/sh\\n# 0 — хорошо, иначе — плохо (для git bisect run)\\nnode run-test.js\\n' > test.sh
cat > app.js <<'EOT'
// inventory-app: учёт склада
const { totalValue } = require("./inventory");
const [cmd] = process.argv.slice(2);
if (cmd === "total") console.log(totalValue([{ price: 10, qty: 3 }]));
else console.log("usage: inventory total");
EOT
printf '# inventory-app\\n\\nУчёт склада из командной строки.\\n' > README.md
git add -A; commit "\${ALICE[@]}" "chore: init inventory app"                                          # 1
note modules/item.js;      git add -A; commit "\${ALICE[@]}" "feat: add item model"                    # 2
note modules/stock.js;     git add -A; commit "\${BOB[@]}"   "feat: add stock levels"                  # 3
note tests/stock.js;       git add -A; commit "\${BOB[@]}"   "test: cover stock levels"                # 4
printf '\\n## Модель\\n\\nТовар имеет название, цену и количество.\\n' >> README.md
git add -A; commit "\${ALICE[@]}" "docs: describe items"                                               # 5
note modules/report.js;    git add -A; commit "\${CAROL[@]}" "feat: add low-stock report"               # 6
note modules/empty.js;     git add -A; commit "\${BOB[@]}"   "fix: handle empty inventory"             # 7
printf '\\n## Версия\\n\\nВыпуск 1.0.\\n' >> README.md
git add -A; commit "\${ALICE[@]}" "docs: prepare release 1.0"                                          # 8
GIT_COMMITTER_DATE="$t +0000" git tag -a v1.0 -m "Release 1.0"
note modules/supplier.js;  git add -A; commit "\${BOB[@]}"   "feat: add supplier field"                 # 9
note modules/csv.js;       git add -A; commit "\${CAROL[@]}" "feat: add csv export"                     # 10
note tests/csv.js;         git add -A; commit "\${CAROL[@]}" "test: cover csv export"                   # 11
printf 'node_modules/\\n' > .gitignore
git add -A; commit "\${ALICE[@]}" "chore: update ignore rules"                                         # 12
note modules/price-history.js; git add -A; commit "\${BOB[@]}" "feat: add price history"                # 13
note modules/csv-header.js; git add -A; commit "\${BOB[@]}"  "fix: csv header order"                    # 14
printf '\\n## Примеры\\n\\n\`node app.js total\`\\n' >> README.md
git add -A; commit "\${ALICE[@]}" "docs: add usage examples"                                           # 15
note modules/category.js;  git add -A; commit "\${CAROL[@]}" "feat: add category filter"                # 16
cat > inventory.js <<'EOT'
// inventory: суммарная стоимость склада
function totalValue(items) {
  return items.reduce((sum, it) => sum + Math.floor(it.price) * it.qty, 0);
}

function normalize(name) {
  return name;
}

module.exports = { totalValue, normalize };
EOT
git add -A; commit "\${BOB[@]}"   "refactor: speed up totals"                                           # 17  <-- регрессия
note modules/barcode.js;   git add -A; commit "\${CAROL[@]}" "feat: add barcode lookup"                 # 18
note tests/barcode.js;     git add -A; commit "\${CAROL[@]}" "test: cover barcode lookup"               # 19
cat > inventory.js <<'EOT'
// inventory: суммарная стоимость склада
function totalValue(items) {
  return items.reduce((sum, it) => sum + Math.floor(it.price) * it.qty, 0);
}

function normalize(name) {
  return name.trim().toLowerCase();
}

module.exports = { totalValue, normalize };
EOT
git add -A; commit "\${ALICE[@]}" "fix: normalize item names"                                          # 20
note modules/warehouse.js; git add -A; commit "\${BOB[@]}"   "feat: add warehouse field"                # 21
printf '\\n## Изменения\\n\\n- 1.1: склады, штрихкоды, CSV.\\n' >> README.md
git add -A; commit "\${ALICE[@]}" "docs: update changelog"                                             # 22
note modules/alerts.js;    git add -A; commit "\${CAROL[@]}" "feat: add low-stock alerts"               # 23
note version.js;           git add -A; commit "\${ALICE[@]}" "chore: bump version to 1.1-dev"          # 24

# ---------- feature/search: «грязная» ветка от вершины main ----------
git switch -q -c feature/search
cat > search.js <<'EOT'
// пойск товаров по названию
function search(items, query) {
  const q = query.toLowerCase();
  return items.filter((it) => it.name.toLowerCase().includes(q));
}

module.exports = { search };
EOT
git add -A; commit "\${BOB[@]}" "wip"                                                                    # m1
cat > test-search.js <<'EOT'
const assert = require("assert");
const { search } = require("./search");
const items = [{ name: "Болт" }, { name: "Гайка" }, { name: "Болтик" }];
assert.strictEqual(search(items, "болт").length, 2);
console.log("ok");
EOT
git add -A; commit "\${BOB[@]}" "add tests"                                                              # m2
cat > app.js <<'EOT'
// inventory-app: учёт склада
const { totalValue } = require("./inventory");
const { search } = require("./search");
const [cmd, arg] = process.argv.slice(2);
if (cmd === "total") console.log(totalValue([{ price: 10, qty: 3 }]));
else if (cmd === "search") console.log(search([{ name: "Болт" }, { name: "Гайка" }], arg || ""));
else console.log("usage: inventory total | inventory search <text>");
EOT
git add -A; commit "\${BOB[@]}" "oops forgot app.js"                                                    # m3
printf 'API_KEY=sk-live-4f9a1c\\n' > config.local
git add -A; commit "\${BOB[@]}" "add local config"                                                      # m4 (секрет!)
sed -i.bak 's/пойск/поиск/' search.js && rm -f search.js.bak
git add -A; commit "\${BOB[@]}" "fix typo in search"                                                    # m5
printf '\\n## Поиск\\n\\n\`node app.js search <текст>\` — найти товары по названию.\\n' >> README.md
git add -A; commit "\${BOB[@]}" "readme"                                                                 # m6
git rm -q config.local
commit "\${BOB[@]}" "remove local config"                                                               # m7

# ---------- release/1.0: два коммита «потеряны» командой reset --hard ----------
git switch -q -c release/1.0 v1.0
printf '// округление счёта до копеек\\nmodule.exports = (x) => Math.round(x * 100) / 100;\\n' > invoice.js
git add -A; commit "\${CAROL[@]}" "fix: rounding in invoice"
printf '# Changelog\\n\\n- 1.0.1: исправлено округление в счёте.\\n' > CHANGELOG.md
git add -A; commit "\${CAROL[@]}" "docs: changelog 1.0.1"
git reset -q --hard HEAD~2
git switch -q main
echo "Репозиторий создан: $W"`, { filename: "setup.sh", collapsed: true }),
    table(
      ["Задача", "Что должно получиться"],
      [
        ["Переписать `feature/search`", "Ровно три коммита поверх `main`: `feat: add search` (файлы `app.js`, `search.js`), `test: cover search` (`test-search.js`), `docs: describe search` (`README.md`); итоговое дерево такое же, как было; в истории ветки нет ни `API_KEY`, ни файла `config.local`; прежней вершины ветки в ней нет"],
        ["Вернуть потерянное в `release/1.0`", "Вершина ветки — исходный коммит `docs: changelog 1.0.1` (хэш совпадает), поверх тега `v1.0` — ровно два коммита"],
        ["Найти регрессию в `main`", "`git bisect start main v1.0`, `git bisect run sh test.sh`; затем `git bisect reset` — сеанс завершён, `main` не изменён"],
        ["Ответы в `answers.txt`", "`first-bad:` — хэш коммита с регрессией; `author:` — его автор; `steps:` — число шагов из сообщения bisect («roughly N steps»); `lost:` — хэш вершины потерянной части `release/1.0`"],
      ],
      "Задание",
    ),
    tip("Состояние репозитория нужно привести к виду «вы на `main`, рабочее дерево чистое, ни `bisect`, ни `rebase` не запущены». Прежняя вершина `feature/search` останется в reflog — это нормально; ключ, попавший в коммит, всё равно считается скомпрометированным."),
  ],
  requirements: [
    "`feature/search` отходит от вершины `main` и содержит ровно три коммита: `feat: add search`, `test: cover search`, `docs: describe search` — в этом порядке.",
    "Первый коммит меняет только `app.js` и `search.js`, второй — только `test-search.js`, третий — только `README.md`.",
    "Дерево вершины `feature/search` совпадает с деревом прежней вершины: ничего не потеряно (в том числе исправление опечатки в `search.js`) и ничего не добавлено.",
    "`git log feature/search -S API_KEY` и `git log feature/search -- config.local` ничего не выводят; прежняя вершина ветки (проверка по полному хэшу) в её истории отсутствует.",
    "Вершина `release/1.0` — тот же коммит, что был «потерян» (полный хэш совпадает), и это ровно два коммита поверх `v1.0`.",
    "В `answers.txt`: `first-bad:` — коммит `refactor: speed up totals` (хэш не короче семи знаков), `author:` — `Bob Coder`, `steps:` — число шагов, названное bisect при запуске на диапазоне `main` … `v1.0`, `lost:` — вершина потерянной части `release/1.0`.",
    "Сеанс bisect завершён (нет `.git/BISECT_START`), перебазирования в процессе нет.",
    "`main` не изменён (вершина прежняя), тег `v1.0` на месте, вы на `main`, рабочее дерево чистое.",
  ],
  constraints: [
    "Не публикуйте и не форсируйте ничего: проект целиком локальный; переписывать можно только `feature/search`.",
    "Историю `main` не менять: виновного **не откатывайте** (`revert`) в этом проекте, а только находите.",
    "Потерянные коммиты нужно вернуть из reflog, а не пересоздать или перенести `cherry-pick`ом: проверка требует тех же хэшей.",
    "Ответы получайте командами Git (`reflog`, `bisect`, `log`), а не просмотром файлов.",
  ],
  expected: [
    "`node ../check.mjs ~/devdock-git/p04` печатает `Пройдено проверок: 17 из 17`.",
    "Заготовка (сразу после `setup.sh`) проходит 5 проверок из 17: дерево ветки ещё не изменено, `main` и тег на месте, дерево чистое, сеанса bisect нет.",
    "Каждый из восьми «плохих» вариантов проваливает от 1 до 6 проверок, результат стабилен при повторных запусках.",
    "На диапазоне `main` … `v1.0` bisect сообщает «7 revisions left to test after this (roughly 3 steps)» и находит виновного за три проверки; полная проверка занимает около 0,2 секунды.",
  ],
  technical: [
    "**Что переписывает rebase.** `git rebase -i main` открывает список коммитов ветки: `pick` — оставить, `reword` — поменять сообщение, `fixup`/`squash` — влить в предыдущий, `drop` — убрать, строки можно переставлять; команда `exec` выполняет произвольную команду после коммита (например, `git commit --amend -m …`). Все «новые» коммиты — другие объекты с другими хэшами.",
    "**Секрет в истории.** Коммит, исключённый из ветки, остаётся в репозитории, пока на него есть ссылки (reflog) или пока не отработал `gc`. Поэтому удаление файла **следующим** коммитом (как сделал Боб) историю не очищает, а переписывание ветки очищает только саму ветку. Ключ нужно отозвать и выпустить заново.",
    "**reflog.** Каждое перемещение ветки и `HEAD` записывается в `git reflog` (`release/1.0@{1}` — предыдущее значение ветки). После `reset --hard` потерянные коммиты ещё существуют; вернуть их можно `git reset --hard <хэш>` на ветке или `git branch -f`/`git switch -c` на этот хэш.",
    "**Бинарный поиск.** `git bisect start <плохой> <хороший>` выбирает коммит посередине диапазона, `git bisect good|bad` сужает его; `git bisect run <команда>` делает это автоматически по коду выхода (0 — хороший, 1–127 кроме 125 — плохой). Число проверок растёт как `log₂ N` для N коммитов диапазона; Git называет его сам («roughly N steps»).",
    "**Состояние после bisect.** Пока сеанс не закрыт, `HEAD` отсоединён на проверяемом коммите. `git bisect reset` возвращает вас на исходную ветку.",
    "**Поиск причины.** `git log -S<строка>` и `git blame` находят изменение по содержимому; bisect — по поведению. Для bisect нужен воспроизводимый тест, который одинаково работает на всех коммитах диапазона.",
    "**Проверяйте дерево.** Чтобы убедиться, что чистка ничего не потеряла, сравните деревья прежней и новой вершины: `git diff <старая-вершина> feature/search` должен быть пустым.",
  ],
  acceptance: [
    "`node ../check.mjs ~/devdock-git/p04` — 17 из 17, `git status` чистый.",
    "`git log --oneline main..feature/search` показывает ровно три чистых коммита, а `git log -p feature/search` не содержит ключа.",
    "`git log --oneline release/1.0` показывает два исправления поверх `docs: prepare release 1.0`.",
    "Вы можете объяснить, почему bisect проверил именно столько коммитов и что значит «roughly».",
  ],
  hints: [
    "До начала запишите вершину `feature/search` (`git rev-parse feature/search`): позже вы сравните деревья.",
    "Для чистки: `git rebase -i main feature/search`. Группа `pick` (wip) + `fixup` (oops forgot app.js) + `fixup` (fix typo in search) — это будущий `feat: add search`.",
    "Сообщения удобно задавать через `reword`, либо строкой `exec git commit --amend -m \"…\"` сразу после группы.",
    "Коммиты `add local config` и `remove local config` нужно убрать (`drop`): тогда секрета не будет вообще, а итоговое дерево не изменится, потому что второй из них удалял файл.",
    "Если запутались в rebase — `git rebase --abort` вернёт ветку; она также остаётся в reflog.",
    "Потерянное: `git reflog release/1.0` покажет `reset: moving to HEAD~2` и два коммита перед ним. Возьмите хэш из строки `release/1.0@{1}` и верните его (`git switch release/1.0 && git reset --hard <хэш>`).",
    "Для bisect нужен чистый `main`: `git bisect start main v1.0`, затем `git bisect run sh test.sh`; название виновного коммита bisect печатает сам. Не забудьте `git bisect reset`.",
    "Сообщение «roughly N steps» печатает `git bisect start`, как только заданы обе границы.",
  ],
  advanced: [
    "Повторите чистку без `rebase -i`: `git reset --soft main` и три коммита через `git add <файлы>`; сравните результат.",
    "Полностью удалите из репозитория следы секрета: `git reflog expire --expire=now --all && git gc --prune=now`; проверьте, что `git cat-file -e <старый хэш>` теперь отказывает, и объясните, почему на сервере этого было бы мало.",
    "Выполните bisect вручную (`git bisect good`/`bad`), без `run`, и сравните число шагов.",
    "Сделайте `git bisect skip` на коммите, где тест нельзя запустить (например, сломана сборка), и объясните, что изменится.",
    "Найдите виновного без bisect: `git log -S\"Math.floor\" --oneline` — и сравните способы; когда `-S` не поможет.",
    "Организуйте проверку так, чтобы `git bisect run` печатал причину провала (см. `test.sh`).",
  ],
  failureModes: [
    "**Все коммиты слиты в один:** тесты и документация потеряли отдельные коммиты, структура не та (3 красные из 17).",
    "**Ветку не переписывали:** остались семь «грязных» коммитов, ключ виден в истории, прежняя вершина на месте (6 красных).",
    "**Потерянные коммиты не возвращены:** `release/1.0` по-прежнему указывает на `v1.0`, потерянная часть и ответ `lost:` расходятся (2 красные).",
    "**Потерянные коммиты перенесены `cherry-pick`:** содержимое то же, но хэши другие — это уже не те коммиты (1 красная).",
    "**В ответе не тот коммит:** `first-bad:` указывает на соседний коммит, а не на найденный bisect (2 красные).",
    "**Виновный откачен коммитом `revert` на `main`:** история `main` изменена, хотя нужно было только найти причину (1 красная).",
    "**Сеанс bisect не закрыт:** `HEAD` остаётся на проверяемом коммите, в репозитории `BISECT_START` (2 красные).",
    "**Документация слита с тестами:** два коммита вместо трёх, состав не совпадает (3 красные).",
  ],
  rubric: [
    { criterion: "Чистая переписанная история", weight: 30, description: "Три логических коммита с правильными сообщениями и составом, дерево сохранено, секрет отсутствует, прежняя вершина не осталась в ветке." },
    { criterion: "Восстановление из reflog", weight: 20, description: "Найдены и возвращены исходные коммиты (те же хэши), ветка указывает на верную вершину, ответ `lost:` верен." },
    { criterion: "Поиск регрессии через bisect", weight: 25, description: "Использован `bisect start/run/reset`, найден верный коммит, верны автор и число шагов, сеанс закрыт." },
    { criterion: "Безопасность и неприкосновенность истории", weight: 15, description: "`main` и тег не тронуты, ничего не опубликовано и не форсировано, понимание того, что секрет в reflog остаётся и ключ надо отозвать." },
    { criterion: "Самопроверка", weight: 10, description: "Дерево до и после сравнено, `status` чистый, итог 17 из 17." },
  ],
  solution: [
    p("Эталон — скрипт из 37 строк: он выполняет три части задания командами Git и проходит все 17 проверок; заготовка проходит 5, а каждый из восьми намеренно испорченных вариантов проходит от 11 до 16 проверок из 17. Ниже — решение, проверяющий скрипт и результаты запусков на git 2.43.0."),
    h("solution.sh"),
    code("bash", `#!/usr/bin/env bash
# solution.sh <каталог> — эталонное решение (запускается после setup.sh)
set -e
cd "\${1:?укажите каталог}"
export GIT_EDITOR=true

# ---------- A. feature/search: из семи «грязных» коммитов — три чистых, секрет не попадает в историю ----------
h() { git log --format=%h --grep="^$1\\$" feature/search; }   # хэш коммита по его заголовку
todo="$(mktemp)"
cat > "$todo" <<EOT
pick $(h wip)
fixup $(h "oops forgot app.js")
fixup $(h "fix typo in search")
exec git commit --amend -q -m "feat: add search"
pick $(h "add tests")
exec git commit --amend -q -m "test: cover search"
pick $(h readme)
exec git commit --amend -q -m "docs: describe search"
drop $(h "add local config")
drop $(h "remove local config")
EOT
GIT_SEQUENCE_EDITOR="cp $todo" git rebase -q -i main feature/search
git switch -q main

# ---------- B. release/1.0: два коммита пропали после reset --hard — берём их из reflog ----------
lost="$(git rev-parse 'release/1.0@{1}')"
git switch -q release/1.0
git reset -q --hard "$lost"
git switch -q main

# ---------- C. main: bisect находит коммит, сломавший totalValue ----------
steps="$(git bisect start main v1.0 | sed -n 's/.*roughly \\([0-9]*\\) step.*/\\1/p')"   # сколько шагов обещает bisect
git bisect run sh test.sh > /dev/null
bad="$(git rev-parse refs/bisect/bad)"
git bisect reset > /dev/null 2>&1

printf 'first-bad: %s\\nauthor: %s\\nsteps: %s\\nlost: %s\\n' "$(git rev-parse --short "$bad")" "$(git log -1 --format=%an "$bad")" "$steps" "$(git rev-parse --short "$lost")" > answers.txt`, { filename: "solution.sh", lineNumbers: true }),
    ul(
      "**Часть A.** Список `rebase -i` строится по заголовкам коммитов: `wip` + `oops forgot app.js` + `fixup` опечатки превращаются в `feat: add search`, `add tests` — в `test: cover search`, `readme` — в `docs: describe search`; коммиты с ключом (`add local config`, `remove local config`) исключены через `drop`. Итоговое дерево совпадает с прежним, потому что `remove local config` лишь удалял файл.",
      "**Часть B.** `git rev-parse 'release/1.0@{1}'` — значение ветки перед `reset`; `git reset --hard` на этот хэш возвращает **те же** коммиты. `cherry-pick` создал бы новые объекты с другими хэшами.",
      "**Часть C.** `git bisect start main v1.0` называет «7 revisions left to test after this (roughly 3 steps)»; `git bisect run sh test.sh` находит `refactor: speed up totals` (автор Bob Coder); `git bisect reset` возвращает `main`. Баг — `Math.floor(it.price)`: цена 2,5 округляется до 2, и сумма 40 превращается в 38.",
    ),
    h("check.mjs"),
    code("js", `#!/usr/bin/env node
// check.mjs <каталог репозитория> — проверка проекта 4 «Переписать историю, вернуть потерянное, найти виновного»
// Требуется Node.js 18+ и git; проверка только читает репозиторий.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(process.argv[2] ?? ".");
const ENV = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_TERMINAL_PROMPT: "0", LC_ALL: "C.UTF-8", GIT_PAGER: "cat", GIT_EDITOR: "true" };
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

// Исходные коммиты (setup.sh воспроизводим, поэтому их хэши известны заранее)
const MAIN = "3945bd1b66a86b2e5ca0b9499e3fcccbfe80a31c";       // вершина main: «chore: bump version to 1.1-dev»
const OLD_FEATURE = "b51101505ec55f2dfc219a270543b6539bc5d54e"; // вершина «грязной» ветки до переписывания
const LOST = "4981ed94f05b09b2e6fcea9cf71f63fbb5f03409";       // «docs: changelog 1.0.1» — вершина потерянной части release/1.0
const V10 = "6d2ebf33d72da2ec2b3dc9f0d174ad47f2f6f174";         // коммит выпуска 1.0
const BAD = "213cc909dc925e7936dc183522b91feeb2f4be64";         // «refactor: speed up totals» — коммит с регрессией
const STEPS = "3";       // сколько шагов bisect обещает для диапазона v1.0..main (строка «roughly N steps»)
const has = (p) => existsSync(join(ROOT, p));
const ok = (a) => git(a).ok;
const out = (a) => git(a).out;
const files = (c) => lines(out(["diff-tree", "--no-commit-id", "--name-only", "-r", "--root", c])).sort();
const feat = lines(out(["log", "--reverse", "--format=%H", \`\${MAIN}..feature/search\`]));
const subj = (c) => out(["log", "-1", "--format=%s", c]);
const answers = has("answers.txt") ? read(join(ROOT, "answers.txt")) : "";
const answer = (k) => (answers.match(new RegExp(\`^\${k}:\\\\s*(\\\\S.*?)\\\\s*$\`, "m")) ?? [])[1] ?? "";
const same = (a, b) => a.length >= 7 && out(["rev-parse", "--verify", "-q", \`\${a}^{commit}\`]) === b;

check("feature/search выросла от вершины main и содержит ровно три коммита", () => [ok(["rev-parse", "--verify", "-q", "feature/search"]) && out(["merge-base", MAIN, "feature/search"]) === MAIN && feat.length === 3, \`коммитов после main: \${feat.length}\`]);
check("заголовки: «feat: add search» → «test: cover search» → «docs: describe search»", () => [feat.map(subj).join(" | ") === "feat: add search | test: cover search | docs: describe search", feat.map(subj).join(" | ")]);
check("состав коммитов: код (app.js, search.js) / тест (test-search.js) / документация (README.md)", () => [feat.length === 3 && files(feat[0]).join() === "app.js,search.js" && files(feat[1]).join() === "test-search.js" && files(feat[2]).join() === "README.md", feat.map((c) => files(c).join("+")).join(" | ")]);
check("итоговое дерево ветки совпадает с исходным: ничего не потеряно и не добавлено", () => out(["rev-parse", "feature/search^{tree}"]) === out(["rev-parse", \`\${OLD_FEATURE}^{tree}\`]));
check("секрет API_KEY не встречается ни в одном коммите ветки", () => out(["log", "feature/search", "-S", "API_KEY", "--format=%H"]) === "");
check("файл config.local не встречается в истории ветки", () => out(["log", "feature/search", "--format=%H", "--", "config.local"]) === "");
check("история действительно переписана: прежняя вершина ветки в ней отсутствует", () => ok(["rev-parse", "--verify", "-q", "feature/search"]) && !ok(["merge-base", "--is-ancestor", OLD_FEATURE, "feature/search"]));
check("release/1.0: восстановлены исходные коммиты (хэш вершины совпадает с «потерянным»)", () => [out(["rev-parse", "release/1.0"]) === LOST, out(["rev-parse", "--short", "release/1.0"])]);
check("release/1.0 — это тег v1.0 и ровно два коммита поверх него", () => ok(["merge-base", "--is-ancestor", V10, "release/1.0"]) && out(["rev-list", "--count", \`\${V10}..release/1.0\`]) === "2");
check("answers.txt, first-bad: найден коммит, сломавший totalValue", () => [same(answer("first-bad"), BAD), answer("first-bad") || "нет строки «first-bad: <хэш>»"]);
check("answers.txt, author: автор коммита с регрессией", () => [answer("author") === "Bob Coder", answer("author") || "нет строки «author: <имя>»"]);
check("answers.txt, steps: число шагов, обещанное bisect в начале поиска", () => [answer("steps") === STEPS, answer("steps") || "нет строки «steps: <число>»"]);
check("answers.txt, lost: указана вершина потерянной части release/1.0", () => [same(answer("lost"), LOST), answer("lost") || "нет строки «lost: <хэш>»"]);
check("сеанс bisect завершён (git bisect reset), перебазирования в процессе нет", () => !has(".git/BISECT_START") && !has(".git/rebase-merge") && !has(".git/rebase-apply"));
check("main не тронут: вершина прежняя", () => [out(["rev-parse", "main"]) === MAIN, out(["rev-parse", "--short", "main"])]);
check("тег v1.0 на месте", () => out(["rev-parse", "v1.0^{commit}"]) === V10);
check("вы на main, рабочее дерево чистое", () => out(["rev-parse", "--abbrev-ref", "HEAD"]) === "main" && out(["status", "--porcelain"]) === "");

summary();`, { filename: "check.mjs", collapsed: true }),
    code("text", `✓ feature/search выросла от вершины main и содержит ровно три коммита
✓ заголовки: «feat: add search» → «test: cover search» → «docs: describe search»
✓ состав коммитов: код (app.js, search.js) / тест (test-search.js) / документация (README.md)
✓ итоговое дерево ветки совпадает с исходным: ничего не потеряно и не добавлено
✓ секрет API_KEY не встречается ни в одном коммите ветки
✓ файл config.local не встречается в истории ветки
✓ история действительно переписана: прежняя вершина ветки в ней отсутствует
✓ release/1.0: восстановлены исходные коммиты (хэш вершины совпадает с «потерянным»)
✓ release/1.0 — это тег v1.0 и ровно два коммита поверх него
✓ answers.txt, first-bad: найден коммит, сломавший totalValue
✓ answers.txt, author: автор коммита с регрессией
✓ answers.txt, steps: число шагов, обещанное bisect в начале поиска
✓ answers.txt, lost: указана вершина потерянной части release/1.0
✓ сеанс bisect завершён (git bisect reset), перебазирования в процессе нет
✓ main не тронут: вершина прежняя
✓ тег v1.0 на месте
✓ вы на main, рабочее дерево чистое

Пройдено проверок: 17 из 17`, { filename: "результат node check.mjs (эталонное решение, git 2.43.0)" }),
    code("text", `✗ feature/search выросла от вершины main и содержит ровно три коммита — коммитов после main: 7
✗ заголовки: «feat: add search» → «test: cover search» → «docs: describe search» — wip | add tests | oops forgot app.js | add local config | fix typo in search | readme | remove local config
✗ состав коммитов: код (app.js, search.js) / тест (test-search.js) / документация (README.md) — search.js | test-search.js | app.js | config.local | search.js | README.md | config.local
✓ итоговое дерево ветки совпадает с исходным: ничего не потеряно и не добавлено
✗ секрет API_KEY не встречается ни в одном коммите ветки
✗ файл config.local не встречается в истории ветки
✗ история действительно переписана: прежняя вершина ветки в ней отсутствует
✗ release/1.0: восстановлены исходные коммиты (хэш вершины совпадает с «потерянным») — 6d2ebf3
✗ release/1.0 — это тег v1.0 и ровно два коммита поверх него
✗ answers.txt, first-bad: найден коммит, сломавший totalValue — нет строки «first-bad: <хэш>»
✗ answers.txt, author: автор коммита с регрессией — нет строки «author: <имя>»
✗ answers.txt, steps: число шагов, обещанное bisect в начале поиска — нет строки «steps: <число>»
✗ answers.txt, lost: указана вершина потерянной части release/1.0 — нет строки «lost: <хэш>»
✓ сеанс bisect завершён (git bisect reset), перебазирования в процессе нет
✓ main не тронут: вершина прежняя
✓ тег v1.0 на месте
✓ вы на main, рабочее дерево чистое

Пройдено проверок: 5 из 17`, { filename: "результат для заготовки (сразу после setup.sh)" }),
    code("text", `заготовка — 5 из 17 (красных: 12; первая: feature/search выросла от вершины main и содержит ровно три коммита)
эталонное решение — 17 из 17
b1: все коммиты ветки слиты в один «feat: add search» — 14 из 17 (красных: 3; первая: feature/search выросла от вершины main и содержит ровно три коммита)
b2: ветку feature/search не переписывали (секрет остался в истории) — 11 из 17 (красных: 6; первая: feature/search выросла от вершины main и содержит ровно три коммита)
b3: потерянные коммиты release/1.0 не возвращены — 15 из 17 (красных: 2; первая: release/1.0: восстановлены исходные коммиты (хэш вершины совпадает с «потерянным»))
b4: потерянные коммиты перенесены cherry-pick (другие хэши) — 16 из 17 (красных: 1; первая: release/1.0: восстановлены исходные коммиты (хэш вершины совпадает с «потерянным»))
b5: в ответе указан не тот коммит из bisect — 15 из 17 (красных: 2; первая: answers.txt, first-bad: найден коммит, сломавший totalValue)
b6: виновный откачен коммитом revert на main — 16 из 17 (красных: 1; первая: main не тронут: вершина прежняя)
b7: сеанс bisect не завершён — 15 из 17 (красных: 2; первая: сеанс bisect завершён (git bisect reset), перебазирования в процессе нет)
b8: документация слита с тестами в один коммит — 14 из 17 (красных: 3; первая: feature/search выросла от вершины main и содержит ровно три коммита)`, { filename: "результаты check.mjs для вариантов с ошибками" }),
    tip("Проверка только читает репозиторий. Хэши прежних вершин (`main`, `feature/search`, потерянного коммита, коммита с регрессией) зашиты в `check.mjs`: они одинаковы у всех, кто создал репозиторий скриптом `setup.sh` без изменений."),
    warn("`setup.sh` отключает автоматическую сборку мусора и устаревание reflog в этом репозитории: даты коммитов фиксированы в прошлом, а при сборке мусора Git по умолчанию удаляет записи reflog старше 90 дней (недостижимые — старше 30). В реальных репозиториях потерянные коммиты доступны ограниченное время; не рассчитывайте на reflog как на резервную копию."),
  ],
};
