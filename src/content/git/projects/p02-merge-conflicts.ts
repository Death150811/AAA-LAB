import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p02MergeConflicts: Project = {
  id: "git.p02-merge-conflicts",
  domain: "git",
  order: 2,
  title: "Слить три ветки и разрешить конфликт",
  subtitle: "Три функциональные ветки, ушедший вперёд main и конфликт в двух файлах: слияние без потери работы, проверка поведения кода и истории — 21 проверка на git 2.43.0",
  level: "core",
  estimatedHours: 5,
  buildsOn: ["git.p01-tidy-history"],
  topics: [
    "git.branches-head",
    "git.merge",
    "git.merge-conflicts",
    "git.commits-history",
  ],
  objective:
    "Влить в `main` три ветки с функциями так, чтобы **не потерять ничью работу**: сохранить исходные коммиты, получить явные коммиты слияния, разрешить настоящий конфликт (две ветки правили одни и те же строки в двух файлах) **осмысленно, а не опцией `-X`**, убедиться, что код и тесты работают, и убрать за собой влитые ветки. Проект про ветки как указатели, слияние как коммит с двумя родителями и про то, что разрешить конфликт — значит принять решение о поведении программы.",
  scenario: [
    p("В репозитории `shop-price` — калькулятор стоимости заказа (`price.js`) с тестами (`test.js`). Три коллеги параллельно сделали ветки от одного и того же коммита `docs: add README`:"),
    ul(
      "`feature/discount` — Боб добавил **скидку** (`opts.discount`, в процентах) и тест к ней;",
      "`feature/tax` — Кэрол добавила **налог** (`opts.tax`, в процентах) и тест к нему; обе ветки правят одну и ту же функцию `total` и один и тот же участок `test.js`;",
      "`feature/docs` — Боб описал параметры в `README.md`.",
    ),
    p("Пока ветки жили, `main` ушёл вперёд: Алиса исправила `subtotal` (игнорировать отрицательные цены). Поэтому ни одна из веток не сливается «перемоткой» — нужны настоящие слияния. Вам предстоит влить ветки **в этом порядке**: `feature/discount`, `feature/tax`, `feature/docs`. Скрипт `setup.sh` создаёт репозиторий (даты и авторы зафиксированы). Затем `check.mjs` проверяет **21 факт** — историю, поведение `price.js` и ваши ответы. Нужны `git` 2.32+ и Node.js 18+."),
    code("bash", `mkdir -p ~/devdock-git && cd ~/devdock-git
# сохраните setup.sh и check.mjs из этой страницы в текущую папку
bash setup.sh ~/devdock-git/p02        # создать учебный репозиторий
cd ~/devdock-git/p02
git log --graph --oneline --all        # посмотрите, как разошлись ветки
# ...когда закончите:
node ../check.mjs ~/devdock-git/p02`, { filename: "порядок работы" }),
    code("bash", `#!/usr/bin/env bash
# setup.sh <каталог> — создаёт репозиторий shop-price: main и три ветки с функциями (скидка, налог, документация).
# Даты и авторы фиксированы: у всех получается один и тот же репозиторий.
set -e
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null   # ваши глобальные настройки Git (подпись коммитов, шаблоны…) не влияют на результат
W="\${1:?укажите каталог: bash setup.sh ~/devdock-git/p02}"
rm -rf "$W"; mkdir -p "$W"; cd "$W"
git init -q -b main
git config user.name "Student"; git config user.email "student@example.com"
t=1736931600
commit() {  # commit "Автор" "почта" "сообщение" — коммит всех изменений с фиксированным временем
  t=$((t+3600))
  GIT_AUTHOR_NAME="$1" GIT_AUTHOR_EMAIL="$2" GIT_COMMITTER_NAME="$1" GIT_COMMITTER_EMAIL="$2" \\
  GIT_AUTHOR_DATE="$t +0000" GIT_COMMITTER_DATE="$t +0000" git commit -q -a -m "$3"
}
ALICE=("Alice Dev" "alice@example.com"); BOB=("Bob Coder" "bob@example.com"); CAROL=("Carol Ops" "carol@example.com")

# main: базовый расчёт, тесты, README
cat > price.js <<'EOT'
// Расчёт стоимости заказа
function subtotal(items) {
  let sum = 0;
  for (const it of items) sum += it.price * it.qty;
  return sum;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function total(items) {
  return round2(subtotal(items));
}

module.exports = { subtotal, total };
EOT
git add -A; commit "\${ALICE[@]}" "feat: calculate order total"

cat > test.js <<'EOT'
const assert = require("assert");
const { total } = require("./price");

assert.strictEqual(total([{ price: 100, qty: 2 }]), 200);
assert.strictEqual(total([]), 0);
console.log("OK");
EOT
git add -A; commit "\${ALICE[@]}" "test: cover total"

printf '# shop-price\\n\\nРасчёт стоимости заказа.\\n' > README.md
git add -A; commit "\${ALICE[@]}" "docs: add README"

# feature/discount (от «docs: add README»)
git switch -q -c feature/discount
cat > price.js <<'EOT'
// Расчёт стоимости заказа
function subtotal(items) {
  let sum = 0;
  for (const it of items) sum += it.price * it.qty;
  return sum;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function total(items, opts = {}) {
  let sum = subtotal(items);
  if (opts.discount) sum = sum * (100 - opts.discount) / 100;
  return round2(sum);
}

module.exports = { subtotal, total };
EOT
git add -A; commit "\${BOB[@]}" "feat: add discount option"
cat > test.js <<'EOT'
const assert = require("assert");
const { total } = require("./price");

assert.strictEqual(total([{ price: 100, qty: 2 }]), 200);
assert.strictEqual(total([]), 0);
assert.strictEqual(total([{ price: 100, qty: 1 }], { discount: 10 }), 90);
console.log("OK");
EOT
git add -A; commit "\${BOB[@]}" "test: cover discount"

# feature/tax (тоже от «docs: add README»)
git switch -q main; git switch -q -c feature/tax
cat > price.js <<'EOT'
// Расчёт стоимости заказа
function subtotal(items) {
  let sum = 0;
  for (const it of items) sum += it.price * it.qty;
  return sum;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function total(items, opts = {}) {
  let sum = subtotal(items);
  if (opts.tax) sum = sum * (100 + opts.tax) / 100;
  return round2(sum);
}

module.exports = { subtotal, total };
EOT
git add -A; commit "\${CAROL[@]}" "feat: add tax option"
cat > test.js <<'EOT'
const assert = require("assert");
const { total } = require("./price");

assert.strictEqual(total([{ price: 100, qty: 2 }]), 200);
assert.strictEqual(total([]), 0);
assert.strictEqual(total([{ price: 100, qty: 1 }], { tax: 20 }), 120);
console.log("OK");
EOT
git add -A; commit "\${CAROL[@]}" "test: cover tax"

# feature/docs (от «docs: add README»)
git switch -q main; git switch -q -c feature/docs
printf '# shop-price\\n\\nРасчёт стоимости заказа.\\n\\n## Использование\\n\\n\`total(items, { discount, tax })\` — сумма заказа в процентах скидки и налога.\\n' > README.md
git add -A; commit "\${BOB[@]}" "docs: describe total options"

# main ушёл вперёд: исправление в subtotal
git switch -q main
cat > price.js <<'EOT'
// Расчёт стоимости заказа
function subtotal(items) {
  let sum = 0;
  for (const it of items) {
    if (it.price < 0) continue;
    sum += it.price * it.qty;
  }
  return sum;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function total(items) {
  return round2(subtotal(items));
}

module.exports = { subtotal, total };
EOT
git add -A; commit "\${ALICE[@]}" "fix: ignore negative prices"
echo "Репозиторий создан: $W"`, { filename: "setup.sh", collapsed: true }),
    table(
      ["Что сделать", "Результат в репозитории"],
      [
        ["Узнать общий предок `feature/discount` и `feature/tax` (до слияния)", "Хэш запомнен для ответа: `git merge-base`"],
        ["Влить `feature/discount` с `--no-ff`", "Коммит слияния `Merge branch 'feature/discount'`; изменения в `price.js` и `test.js` из ветки на месте"],
        ["Влить `feature/tax` и разрешить конфликты в `price.js` и `test.js`", "`total` применяет **и** скидку, **и** налог; в `test.js` есть тесты обеих функций; `node test.js` печатает `OK`"],
        ["Влить `feature/docs`", "Коммит слияния; `README.md` совпадает с версией ветки"],
        ["Удалить влитые ветки", "В `git branch` остался только `main`"],
        ["Записать ответы в `answers.txt` и закоммитить", "`base: <хэш общего предка>` и `conflicts: <файлы с конфликтом>`"],
      ],
      "Задание",
    ),
    tip("Конфликт — это не ошибка, а вопрос: «как должна вести себя программа, если включены и скидка, и налог». В этом проекте ответ задан тестом: `total` для товара за 100 со скидкой 10 % и налогом 20 % возвращает 108."),
  ],
  requirements: [
    "Вы на ветке `main`, рабочее дерево чистое.",
    "Исходные коммиты всех трёх веток находятся в истории `main` (проверка по полным хэшам: копии, созданные `cherry-pick`/`rebase`, не засчитываются), собственный коммит `main` («`fix: ignore negative prices`») сохранён.",
    "В `main` ровно **три** коммита слияния, все на первой линии родителей (слито **в** `main`, а не наоборот); сообщения называют ветки `feature/discount`, `feature/tax`, `feature/docs`.",
    "В зафиксированных файлах нет маркеров конфликта (`<<<<<<<`, `=======`, `>>>>>>>`).",
    "`node test.js` проходит; тесты не ослаблены: в `test.js` остались проверки базовой суммы (200), скидки (90) и налога (120).",
    "`price.js`: `total` даёт 200 для 100 × 2, 90 со скидкой 10 %, 120 с налогом 20 %, 108 с обоими параметрами и игнорирует отрицательные цены (исправление `main`).",
    "`README.md` в `main` совпадает с версией из `feature/docs`.",
    "Влитые ветки удалены: `git branch` показывает только `main`.",
    "`answers.txt` закоммичен: `base:` — общий предок `feature/discount` и `feature/tax` (хэш не короче семи знаков); `conflicts:` — файлы, в которых возник конфликт при слиянии `feature/tax`.",
  ],
  constraints: [
    "Только слияния: без `rebase`, `cherry-pick`, `squash`, `reset --hard` и без опций `-X ours`/`-X theirs` — они разрешают конфликт за вас, не глядя на смысл.",
    "Не правьте историю веток (их коммиты должны остаться теми же) и не слейте `main` в ветки.",
    "Ветки удаляйте безопасной командой `git branch -d`: она откажется удалять невлитую ветку.",
    "Порядок слияния: `feature/discount`, затем `feature/tax`, затем `feature/docs`.",
  ],
  expected: [
    "`node ../check.mjs ~/devdock-git/p02` печатает `Пройдено проверок: 21 из 21`.",
    "Заготовка (сразу после `setup.sh`) проходит 7 проверок из 21.",
    "Каждый из восьми «плохих» вариантов проваливает от 1 до 7 проверок, результат стабилен при повторных запусках.",
    "Эталон — три коммита слияния, один коммит с ответами и разрешение конфликта в двух файлах; полная проверка (вместе с запуском `test.js`) занимает около 0,2 секунды.",
  ],
  technical: [
    "**Слияние — коммит с двумя родителями.** `git merge --no-ff` создаёт такой коммит всегда, даже когда возможна перемотка (fast-forward). Здесь `main` разошёлся с ветками, поэтому слияния настоящие; `--no-ff` фиксирует это правило явно.",
    "**Откуда конфликт.** Трёхстороннее слияние сравнивает обе стороны с общим предком (`git merge-base A B`): изменения в разных местах сливаются автоматически, а правки одних и тех же строк (или соседних вставок) дают конфликт и маркеры `<<<<<<<` / `=======` / `>>>>>>>` в файле.",
    "**Состояние во время конфликта.** `git status` показывает `both modified`, `git diff --name-only --diff-filter=U` — список конфликтующих файлов, `git diff` — комбинированный дифф. Выйти из слияния без последствий можно командой `git merge --abort`.",
    "**Разрешение.** Откройте файл, оставьте нужный код (обычно — объединение обеих сторон), удалите маркеры, проверьте (`node test.js`), затем `git add <файл>` и `git commit` (сообщение слияния уже заготовлено). Опции `-X ours`/`-X theirs` и `checkout --ours/--theirs` выбирают сторону целиком и теряют изменения другой.",
    "**Проверяйте результат тестами, а не глазами.** Сборка без маркеров ещё не означает правильной логики: проверка этого проекта запускает ваш `price.js` на пяти сценариях.",
    "**Безопасное удаление веток.** `git branch -d` удаляет ветку, только если она влита в текущую; `-D` — принудительно (потеря коммитов, до которых не доберётся `reflog` по истечении срока).",
    "**Граф.** `git log --graph --oneline --all` показывает, как ветки расходились и где сходятся; `--first-parent` оставляет линию `main`.",
  ],
  acceptance: [
    "`node ../check.mjs ~/devdock-git/p02` — 21 из 21, `git status` чистый, `git branch` показывает только `main`.",
    "`git log --graph --oneline` показывает три слияния подряд в линии `main` и ветки, которые сходятся к ним.",
    "Вы можете объяснить, почему первое слияние прошло без конфликтов, а второе — нет, и показать это по `git merge-base`.",
    "Вы можете показать, что результат разрешения содержит обе функции, а не одну из сторон целиком.",
  ],
  hints: [
    "Перед слиянием посмотрите `git log --graph --oneline --all` и `git merge-base feature/discount feature/tax` — этот хэш понадобится для `answers.txt`.",
    "Слияние `feature/discount` пройдёт без конфликтов: `main` менял `subtotal`, ветка — `total`. Команда: `git merge --no-ff feature/discount`.",
    "При конфликте не торопитесь с `git add`: откройте `price.js` и `test.js`, найдите блоки между `<<<<<<<` и `>>>>>>>` и оставьте строки **обеих** сторон.",
    "В `price.js` обе строки (`opts.discount`, `opts.tax`) живут в одной функции подряд — порядок для умножения не важен: 100 × 0,9 × 1,2 = 108.",
    "После правки запустите `node test.js` (должно быть `OK`) и `git grep -n \"<<<<<<<\"` (пусто), затем `git add price.js test.js && git commit` (сообщение подставится само).",
    "Запутались — `git merge --abort` вернёт состояние до слияния; повторите попытку.",
    "Файлы с конфликтом видны в выводе `git merge` (`CONFLICT (content): Merge conflict in …`) и по `git diff --name-only --diff-filter=U`.",
    "Ветки удаляются так: `git branch -d feature/discount feature/tax feature/docs`; если Git отказывает — ветка не влита.",
  ],
  advanced: [
    "Повторите задачу с `git merge --no-commit` и изучите `git diff --cached` перед фиксацией; сравните со слиянием по умолчанию.",
    "Включите `merge.conflictStyle diff3` (`git config merge.conflictStyle diff3`) и посмотрите, как в маркерах появляется общий предок; объясните, чем это помогает.",
    "Включите `rerere` (`git config rerere.enabled true`), разрешите конфликт, откатите слияние (`git reset --hard HEAD~`) и повторите: Git применит запомненное разрешение.",
    "Решите ту же задачу через `git rebase` каждой ветки на `main`: какие конфликты возникнут, чем история отличается от слияния и почему проверка этого проекта такое решение не засчитает.",
    "Откатите слияние `feature/tax` командой `git revert -m 1 <коммит слияния>` и объясните, почему нужен номер родителя.",
  ],
  failureModes: [
    "**Конфликт «разрешён» опцией `-X theirs`:** побеждает сторона налога целиком, скидка и её тест потеряны (3 красные из 21: тесты ослаблены, скидка и комбинация не работают).",
    "**Маркеры конфликта закоммичены:** файлы `price.js` и `test.js` содержат `<<<<<<<` — код не загружается, `node test.js` падает, поведение не проверить (7 красных).",
    "**В `test.js` остались только тесты налога:** код верный, но тест на скидку потерян — «зелёные» тесты ничего не доказывают (1 красная).",
    "**В `price.js` осталась только логика налога:** скидка не применяется; `node test.js` падает на проверке скидки, обе поведенческие проверки красные (3 красные).",
    "**Ветка `feature/docs` не влита:** отсутствуют её коммит, слияние и текст в README (5 красных).",
    "**Влитые ветки не удалены** (1 красная).",
    "**В ответе указан не общий предок, а другой коммит** (1 красная).",
    "**Скидка перенесена `cherry-pick` вместо слияния:** копии коммитов имеют другие хэши, слияний только два (3 красные).",
  ],
  rubric: [
    { criterion: "Корректность слияний и истории", weight: 30, description: "Три коммита слияния в `main`, исходные коммиты веток сохранены, `main` не слит в ветки, влитые ветки удалены безопасно." },
    { criterion: "Разрешение конфликта", weight: 30, description: "Маркеры удалены, поведение объединено (скидка и налог вместе), исправление `main` сохранено; решение принято по смыслу, а не опцией `-X`." },
    { criterion: "Проверка тестами", weight: 20, description: "`node test.js` проходит, тесты обеих веток сохранены, результат проверен до фиксации." },
    { criterion: "Понимание графа", weight: 10, description: "Верные ответы про общий предок и список конфликтующих файлов; умение прочитать `git log --graph`." },
    { criterion: "Аккуратность", weight: 10, description: "Чистое дерево, понятные сообщения слияний, безопасные команды (`-d`, `--abort`)." },
  ],
  solution: [
    p("Эталон — скрипт из 64 строк: он выполняет задание командами Git и проходит все 21 проверку; заготовка проходит 7, а каждый из восьми намеренно испорченных вариантов проходит от 14 до 20 проверок из 21. Ниже — решение, проверяющий скрипт и результаты запусков на git 2.43.0."),
    h("solution.sh"),
    code("bash", `#!/usr/bin/env bash
# solution.sh <каталог> — эталонное решение (запускается после setup.sh)
set -e
cd "\${1:?укажите каталог}"
export GIT_EDITOR=true

# 0. Общий предок двух веток — до слияния (потом ветки удалим)
base=$(git merge-base feature/discount feature/tax)

# 1. Скидка: расхождения нет, слияние проходит само; --no-ff оставляет явный коммит слияния
git merge --no-ff -m "Merge branch 'feature/discount'" feature/discount

# 2. Налог: обе ветки правили одни и те же строки в price.js и test.js — конфликт
git merge --no-ff feature/tax || true
git diff --name-only --diff-filter=U > conflicts.txt   # какие файлы конфликтуют
cat > price.js <<'EOT'
// Расчёт стоимости заказа
function subtotal(items) {
  let sum = 0;
  for (const it of items) {
    if (it.price < 0) continue;
    sum += it.price * it.qty;
  }
  return sum;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function total(items, opts = {}) {
  let sum = subtotal(items);
  if (opts.discount) sum = sum * (100 - opts.discount) / 100;
  if (opts.tax) sum = sum * (100 + opts.tax) / 100;
  return round2(sum);
}

module.exports = { subtotal, total };
EOT
cat > test.js <<'EOT'
const assert = require("assert");
const { total } = require("./price");

assert.strictEqual(total([{ price: 100, qty: 2 }]), 200);
assert.strictEqual(total([]), 0);
assert.strictEqual(total([{ price: 100, qty: 1 }], { discount: 10 }), 90);
assert.strictEqual(total([{ price: 100, qty: 1 }], { tax: 20 }), 120);
console.log("OK");
EOT
node test.js
git add price.js test.js
git commit -q --no-edit

# 3. Документация
git merge --no-ff -m "Merge branch 'feature/docs'" feature/docs

# 4. Влитые ветки больше не нужны
git branch -d feature/discount feature/tax feature/docs

# 5. Ответы
printf 'base: %s\\nconflicts: %s\\n' "$(git rev-parse --short "$base")" "$(tr '\\n' ' ' < conflicts.txt | sed 's/ $//')" > answers.txt
rm conflicts.txt
git add answers.txt
git commit -q -m "docs: record merge answers"`, { filename: "solution.sh", lineNumbers: true }),
    ul(
      "**Общий предок** (`git merge-base`) определяется до слияний: потом ветки удаляются.",
      "**`feature/discount`** вливается без конфликтов: `main` менял `subtotal`, ветка — `total`; Git объединил правки в `price.js` автоматически, а `test.js` в `main` не менялся.",
      "**`feature/tax`** конфликтует в `price.js` (обе ветки заменили одну и ту же строку в `total`) и в `test.js` (обе вставили тест на то же место перед `console.log`). Решение — оставить обе строки в каждом файле; результат проверен запуском `node test.js` до `git add`.",
      "**`feature/docs`** меняет только `README.md`, конфликтов нет.",
      "**Ответы:** `base` — коммит `docs: add README`, `conflicts` — `price.js test.js`.",
    ),
    h("check.mjs"),
    code("js", `#!/usr/bin/env node
// check.mjs <каталог репозитория> — проверка проекта 2 «Слить три ветки и разрешить конфликт»
// Требуется Node.js 18+ и git; проверка читает репозиторий и запускает ваш test.js (\`node test.js\`).
import { createRequire } from "node:module";
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

// Исходные коммиты веток и main (setup.sh воспроизводим, поэтому их хэши известны заранее)
const TIP = { discount: "f82152e0c855808dbe91ecb447777edd7bd446eb", tax: "e8b8e42d3ed172120859b708e97118845d42684d", docs: "c45f8f0db213c90b821226fda4edcc2f417a7be8" };
const FIX = "8d3d5f8bdb91e8066a32822e78ae67af5bdbb8ad"; // «fix: ignore negative prices» — собственный коммит main
const BASE = "8c37d1932b042f41f1de1777ea89727f23af8724"; // общий предок веток: «docs: add README»
const has = (p) => existsSync(join(ROOT, p));
const ancestor = (c) => git(["merge-base", "--is-ancestor", c, "HEAD"]).ok;

let mod = null, loadError = "";
try { const f = join(ROOT, "price.js"); mod = createRequire(f)(f); } catch (e) { loadError = String(e.message).split("\\n")[0]; }
const total = (items, opts) => { if (!mod) throw new Error(loadError || "price.js не загружен"); return mod.total(items, opts); };
const one = (price, qty = 1) => [{ price, qty }];
const answers = has("answers.txt") ? read(join(ROOT, "answers.txt")) : "";
const answer = (key) => (answers.match(new RegExp(\`^\${key}:\\\\s*(.+)$\`, "m")) ?? [])[1]?.trim() ?? "";
const merges = lines(git(["log", "--first-parent", "--merges", "--format=%s", \`\${FIX}..HEAD\`]).out);

check("вы на ветке main", () => git(["rev-parse", "--abbrev-ref", "HEAD"]).out === "main");
check("рабочее дерево чистое", () => git(["status", "--porcelain"]).out === "");
check("feature/discount влита: исходные коммиты ветки в истории main", () => ancestor(TIP.discount));
check("feature/tax влита: исходные коммиты ветки в истории main", () => ancestor(TIP.tax));
check("feature/docs влита: исходные коммиты ветки в истории main", () => ancestor(TIP.docs));
check("собственный коммит main («fix: ignore negative prices») не потерян", () => ancestor(FIX));
check("в main ровно три коммита слияния, и все — на первой линии родителей", () => [merges.length === 3 && git(["rev-list", "--merges", "--count", "HEAD"]).out === "3", \`на первой линии: \${merges.length}, всего: \${git(["rev-list", "--merges", "--count", "HEAD"]).out}\`]);
check("сообщения слияний называют ветки (discount, tax, docs)", () => ["feature/discount", "feature/tax", "feature/docs"].every((b) => merges.some((m) => m.includes(b))));
check("в зафиксированных файлах нет маркеров конфликта", () => !git(["grep", "-q", "-E", "^(<{7} |={7}$|>{7} )", "HEAD"]).ok);
check("\`node test.js\` проходит", () => { const r = spawnSync("node", ["test.js"], { cwd: ROOT, encoding: "utf8" }); return [r.status === 0 && r.stdout.includes("OK"), (r.stderr || "").split("\\n").find((l) => l.trim()) ?? ""]; });
check("тесты не ослаблены: в test.js проверки базы, скидки и налога", () => { const s = has("test.js") ? read(join(ROOT, "test.js")) : ""; return /qty: 2[^\\n]*200/.test(s) && /discount: 10[^\\n]*90/.test(s) && /tax: 20[^\\n]*120/.test(s); });
check("total: базовая сумма (100 × 2 = 200)", () => total(one(100, 2)) === 200);
check("total: скидка 10 % → 90", () => total(one(100), { discount: 10 }) === 90);
check("total: налог 20 % → 120", () => total(one(100), { tax: 20 }) === 120);
check("total: скидка и налог вместе → 108", () => total(one(100), { discount: 10, tax: 20 }) === 108);
check("total: отрицательные цены игнорируются (исправление main сохранено)", () => total([{ price: 100, qty: 1 }, { price: -50, qty: 1 }]) === 100);
check("README содержит описание из feature/docs", () => git(["show", \`\${TIP.docs}:README.md\`]).out === git(["show", "HEAD:README.md"]).out);
check("слитые ветки удалены: остался только main", () => { const b = lines(git(["for-each-ref", "--format=%(refname:short)", "refs/heads"]).out); return [b.length === 1 && b[0] === "main", b.join(", ")]; });
check("answers.txt закоммичен", () => git(["ls-files", "answers.txt"]).out === "answers.txt");
check("base: указан общий предок feature/discount и feature/tax", () => { const h = answer("base"); return [h.length >= 7 && git(["rev-parse", "--verify", \`\${h}^{commit}\`]).out === BASE, h || "нет строки «base: <хэш>»"]; });
check("conflicts: перечислены файлы с конфликтом (price.js, test.js)", () => { const f = answer("conflicts").split(/[\\s,]+/).filter(Boolean).sort(); return [f.join(",") === "price.js,test.js", f.join(", ")]; });

summary();`, { filename: "check.mjs", collapsed: true }),
    code("text", `✓ вы на ветке main
✓ рабочее дерево чистое
✓ feature/discount влита: исходные коммиты ветки в истории main
✓ feature/tax влита: исходные коммиты ветки в истории main
✓ feature/docs влита: исходные коммиты ветки в истории main
✓ собственный коммит main («fix: ignore negative prices») не потерян
✓ в main ровно три коммита слияния, и все — на первой линии родителей
✓ сообщения слияний называют ветки (discount, tax, docs)
✓ в зафиксированных файлах нет маркеров конфликта
✓ \`node test.js\` проходит
✓ тесты не ослаблены: в test.js проверки базы, скидки и налога
✓ total: базовая сумма (100 × 2 = 200)
✓ total: скидка 10 % → 90
✓ total: налог 20 % → 120
✓ total: скидка и налог вместе → 108
✓ total: отрицательные цены игнорируются (исправление main сохранено)
✓ README содержит описание из feature/docs
✓ слитые ветки удалены: остался только main
✓ answers.txt закоммичен
✓ base: указан общий предок feature/discount и feature/tax
✓ conflicts: перечислены файлы с конфликтом (price.js, test.js)

Пройдено проверок: 21 из 21`, { filename: "результат node check.mjs (эталонное решение, git 2.43.0)" }),
    code("text", `✓ вы на ветке main
✓ рабочее дерево чистое
✗ feature/discount влита: исходные коммиты ветки в истории main
✗ feature/tax влита: исходные коммиты ветки в истории main
✗ feature/docs влита: исходные коммиты ветки в истории main
✓ собственный коммит main («fix: ignore negative prices») не потерян
✗ в main ровно три коммита слияния, и все — на первой линии родителей — на первой линии: 0, всего: 0
✗ сообщения слияний называют ветки (discount, tax, docs)
✓ в зафиксированных файлах нет маркеров конфликта
✓ \`node test.js\` проходит
✗ тесты не ослаблены: в test.js проверки базы, скидки и налога
✓ total: базовая сумма (100 × 2 = 200)
✗ total: скидка 10 % → 90
✗ total: налог 20 % → 120
✗ total: скидка и налог вместе → 108
✓ total: отрицательные цены игнорируются (исправление main сохранено)
✗ README содержит описание из feature/docs
✗ слитые ветки удалены: остался только main — feature/discount, feature/docs, feature/tax, main
✗ answers.txt закоммичен
✗ base: указан общий предок feature/discount и feature/tax — нет строки «base: <хэш>»
✗ conflicts: перечислены файлы с конфликтом (price.js, test.js)

Пройдено проверок: 7 из 21`, { filename: "результат для заготовки (сразу после setup.sh)" }),
    code("text", `заготовка — 7 из 21 (красных: 14; первая: feature/discount влита: исходные коммиты ветки в истории main)
эталонное решение — 21 из 21
b1: конфликт «разрешён» опцией -X theirs: правки скидки потеряны — 18 из 21 (красных: 3; первая: тесты не ослаблены: в test.js проверки базы, скидки и налога)
b2: маркеры конфликта закоммичены — 14 из 21 (красных: 7; первая: в зафиксированных файлах нет маркеров конфликта)
b3: в test.js остались только тесты налога — 20 из 21 (красных: 1; первая: тесты не ослаблены: в test.js проверки базы, скидки и налога)
b4: в price.js осталась только логика налога — 18 из 21 (красных: 3; первая: \`node test.js\` проходит)
b5: ветка feature/docs не влита — 16 из 21 (красных: 5; первая: feature/docs влита: исходные коммиты ветки в истории main)
b6: влитые ветки не удалены — 20 из 21 (красных: 1; первая: слитые ветки удалены: остался только main)
b7: в ответе base — не общий предок — 20 из 21 (красных: 1; первая: base: указан общий предок feature/discount и feature/tax)
b8: скидка перенесена cherry-pick вместо слияния — 18 из 21 (красных: 3; первая: feature/discount влита: исходные коммиты ветки в истории main)`, { filename: "результаты check.mjs для вариантов с ошибками" }),
    tip("Проверка читает репозиторий и **запускает ваш код**: `price.js` загружается в Node.js, а `test.js` выполняется как `node test.js`. Запускайте её только на своих репозиториях."),
    warn("Хэши исходных коммитов веток зашиты в `check.mjs`: они одинаковы у всех, кто создал репозиторий скриптом `setup.sh` без изменений. Если вы правили `setup.sh` или создавали ветки вручную, проверка о них не узнает."),
  ],
};
