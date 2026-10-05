import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p03RemoteSync: Project = {
  id: "git.p03-remote-sync",
  domain: "git",
  order: 3,
  title: "Синхронизация с сервером: отклонённый push и чужие коммиты",
  subtitle: "«Сервер», ваш клон и клон коллеги: расхождение истории, перебазирование своих коммитов, публикация ветки с upstream и аккуратное удаление — 22 проверки на git 2.43.0",
  level: "intermediate",
  estimatedHours: 5,
  buildsOn: ["git.p02-merge-conflicts"],
  topics: [
    "git.remotes-fetch-push",
    "git.remote-collaboration",
    "git.rebase",
    "git.branches-head",
  ],
  objective:
    "Пройти полный цикл работы с общим репозиторием **без потери чужой работы и без лишних слияний**: понять, почему обычный `push` отклонён, измерить расхождение (`ahead`/`behind`), перенести свои коммиты поверх чужих (`pull --rebase`), опубликовать новую ветку с настройкой upstream, дождаться правки коллеги в этой же ветке, снова синхронизироваться, влить ветку перемоткой и убрать её с сервера. Проект про то, что `fetch` и `push` — операции над **ссылками** в двух репозиториях, а история на сервере общая и не должна переписываться.",
  scenario: [
    p("Вы — Алиса, участница проекта `weather-cli` (консольный прогноз погоды). Сервер — «голый» репозиторий `remote.git` рядом с вашим клоном (это обычный каталог: ровно так устроены общие репозитории). Скрипт `setup.sh` создаёт три каталога: `work/` — ваш клон, `remote.git/` — сервер, `teammate/` — клон Боба. Пока вы работали, Боб успел отправить в `main` исправление `fix: handle unknown city`, а у вас есть два локальных коммита, которых нет на сервере: `feat: add forecast command` и `docs: update README`. Первая же попытка `git push` будет отклонена."),
    p("Затем вы начнёте новую ветку `feature/units`. Когда вы её опубликуете, Боб (команда `bash teammate.sh`) исправит опечатку в справке и отправит свой коммит прямо в эту ветку — поэтому следующий ваш `push` тоже будет отклонён. Проверка `check.mjs` анализирует **22 факта** об итоговом состоянии сервера и вашего клона. Нужны `git` 2.32+ и Node.js 18+."),
    code("bash", `mkdir -p ~/devdock-git && cd ~/devdock-git
# сохраните setup.sh и check.mjs из этой страницы в текущую папку
bash setup.sh ~/devdock-git/p03        # создаёт work/, remote.git/, teammate/ и teammate.sh
cd ~/devdock-git/p03/work              # работайте здесь
git status -sb                         # ahead 2 — два коммита ещё не на сервере
# ...когда закончите, из каталога ~/devdock-git:
node check.mjs ~/devdock-git/p03       # путь — к каталогу, который создал setup.sh`, { filename: "порядок работы" }),
    code("bash", `#!/usr/bin/env bash
# setup.sh <каталог> — создаёт «сервер» (remote.git), ваш клон (work/) и клон коллеги (teammate/).
# Даты и авторы фиксированы: у всех получается одно и то же.
set -e
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null   # ваши глобальные настройки Git (подпись коммитов, шаблоны…) не влияют на результат
W="\${1:?укажите каталог: bash setup.sh ~/devdock-git/p03}"
rm -rf "$W"; mkdir -p "$W"; W="$(cd "$W" && pwd)"; cd "$W"
git init -q --bare -b main remote.git
t=1736931600
commit() {  # commit "Автор" "почта" "сообщение" — коммит всех изменений с фиксированным временем
  t=$((t+3600))
  GIT_AUTHOR_NAME="$1" GIT_AUTHOR_EMAIL="$2" GIT_COMMITTER_NAME="$1" GIT_COMMITTER_EMAIL="$2" \\
  GIT_AUTHOR_DATE="$t +0000" GIT_COMMITTER_DATE="$t +0000" git commit -q -a -m "$3"
}
ALICE=("Alice Dev" "alice@example.com"); BOB=("Bob Coder" "bob@example.com")

# история проекта weather-cli на сервере (три коммита)
git clone -q remote.git seed 2>/dev/null; cd seed
git config user.name "Seed"; git config user.email "seed@example.com"
cat > app.js <<'EOT'
// weather-cli: температура в городе
const city = process.argv[2] || "Moscow";
const data = { Moscow: -3, Kazan: -8, Sochi: 9 };

function temp(c) {
  return data[c];
}

console.log(\`\${city}: \${temp(city)}°C\`);
EOT
printf 'usage: weather [city]\\nshows the current temprature in the city\\n' > help.txt
git add -A; commit "\${ALICE[@]}" "feat: current weather command"
printf '// город из аргумента командной строки\\n' >> app.js
git add -A; commit "\${ALICE[@]}" "feat: city argument"
printf '# weather-cli\\n\\nТемпература в городе из командной строки.\\n' > README.md
git add -A; commit "\${ALICE[@]}" "docs: add README"
git push -q origin main
cd "$W"; rm -rf seed

# два клона: ваш и коллеги; настраиваем личность в каждом
git clone -q remote.git work 2>/dev/null
git clone -q remote.git teammate 2>/dev/null
git -C work config user.name "Alice Dev"; git -C work config user.email "alice@example.com"
git -C teammate config user.name "Bob Coder"; git -C teammate config user.email "bob@example.com"

# Боб уже отправил исправление в main, пока вы работали
cd teammate
cat > app.js <<'EOT'
// weather-cli: температура в городе
const city = process.argv[2] || "Moscow";
const data = { Moscow: -3, Kazan: -8, Sochi: 9 };

function temp(c) {
  if (!(c in data)) return "unknown";
  return data[c];
}

console.log(\`\${city}: \${temp(city)}°C\`);
// город из аргумента командной строки
EOT
git add -A; commit "\${BOB[@]}" "fix: handle unknown city"
git push -q origin main
cd "$W"

# у вас два локальных коммита, которых нет на сервере
cd work
printf '// прогноз на завтра\\nmodule.exports = { tomorrow: (c) => c + ": no data" };\\n' > forecast.js
git add -A; commit "\${ALICE[@]}" "feat: add forecast command"
printf '\\n## Команды\\n\\n\`node app.js [город]\` — температура сейчас.\\n' >> README.md
git add -A; commit "\${ALICE[@]}" "docs: update README"
cd "$W"

# скрипт «коллега»: правит опечатку в ветке feature/units, которую вы опубликуете
cat > teammate.sh <<'EOT'
#!/usr/bin/env bash
# teammate.sh — Боб исправляет опечатку в ветке feature/units и отправляет её на сервер.
# Запускайте, когда вы уже опубликовали ветку feature/units.
set -e
cd "$(dirname "$0")/teammate"
git fetch -q origin
git switch -q -C feature/units origin/feature/units
text=$(<help.txt)
printf '%s\\n' "\${text//temprature/temperature}" > help.txt
export GIT_AUTHOR_NAME="Bob Coder" GIT_AUTHOR_EMAIL="bob@example.com" GIT_COMMITTER_NAME="Bob Coder" GIT_COMMITTER_EMAIL="bob@example.com"
export GIT_AUTHOR_DATE="1737100000 +0000" GIT_COMMITTER_DATE="1737100000 +0000"
git commit -q -a -m "fix: typo in units help"
git push -q origin feature/units
echo "Боб отправил в feature/units коммит «fix: typo in units help»"
EOT
chmod +x teammate.sh
echo "Готово: $W (ваш клон — work/, сервер — remote.git, клон Боба — teammate/)"`, { filename: "setup.sh", collapsed: true }),
    table(
      ["Что сделать", "Результат"],
      [
        ["Попробовать `git push`", "Отказ: на сервере есть коммит, которого у вас нет"],
        ["Измерить расхождение и записать в `~/devdock-git/p03/answers.txt`", "Строки `ahead: <число>` и `behind: <число>` (сколько ваших коммитов не на сервере и сколько чужих у вас отсутствует)"],
        ["Перенести свои коммиты поверх чужих и отправить `main`", "История `main` на сервере линейная: коммит Боба, затем ваши два; слияний нет"],
        ["Создать `feature/units`, добавить `units.js`, опубликовать ветку с upstream", "Коммит `feat: add --units option`; `git push -u origin feature/units`"],
        ["Запустить `bash ../teammate.sh` (Боб правит `help.txt`)", "На сервере в ветке появляется коммит `fix: typo in units help`"],
        ["Добавить в `README.md` описание `--units`, синхронизироваться и отправить", "Коммит `docs: describe --units` лежит после коммита Боба"],
        ["Влить `feature/units` в `main` **перемоткой**, отправить `main`, удалить ветку на сервере", "`main` на сервере содержит все девять коммитов; серверной ветки нет; локальная ветка `feature/units` сохранена"],
      ],
      "Задание",
    ),
    tip("Сообщения коммитов именно такие, как в таблице: проверка ищет их по тексту. Локальную ветку `feature/units` **оставьте** — по её настройкам видно, что вы публиковали её с `-u`."),
  ],
  requirements: [
    "На сервере в `main` есть коммит Боба `fix: handle unknown city` (проверка по полному хэшу): чужая работа не потеряна.",
    "Ваши коммиты `feat: add forecast command` и `docs: update README` лежат на сервере по одному разу, **поверх** коммита Боба; их исходные (до переноса) хэши в истории сервера отсутствуют.",
    "История `main` на сервере линейная (`git rev-list --merges --count main` — 0); в ней девять коммитов: три исходных, коммит Боба, два ваших, `feat: add --units option`, `fix: typo in units help`, `docs: describe --units`; повторяющихся сообщений нет.",
    "Коммиты функции идут в порядке: ваш `feat: add --units option` → коммит Боба → ваш `docs: describe --units`.",
    "Серверной ветки `feature/units` нет; её коммиты уже в `main`; ссылка `origin/feature/units` в вашем клоне не осталась.",
    "Локальный `main`, `origin/main` и `main` на сервере указывают на один коммит; вы на `main`, рабочее дерево чистое, upstream `main` — `origin/main`.",
    "Локальная ветка `feature/units` сохранена, совпадает с `main`, а в `.git/config` у неё `remote = origin` и `merge = refs/heads/feature/units`.",
    "В `main` есть непустой `units.js`, `README.md` упоминает `--units`, а в `help.txt` исправлена опечатка (`temperature`); коммит с исправлением написан Bob Coder.",
    "`answers.txt` (в каталоге `p03`, а не внутри `work/`): `ahead: 2` и `behind: 1`.",
  ],
  constraints: [
    "Никакого `push --force` (и `--force-with-lease`): серверная история общая, затирать чужие коммиты нельзя.",
    "Свои неопубликованные коммиты можно перебазировать, **опубликованные** — нет; поэтому в этом проекте rebase допустим только в `git pull --rebase` до публикации.",
    "Влить `feature/units` в `main` нужно перемоткой (`--ff-only`): без дополнительного коммита слияния.",
    "Каталоги `teammate/` и `remote.git/` руками не правьте — они играют роль других людей и сервера. Единственное воздействие на `teammate/` — запуск `teammate.sh`.",
  ],
  expected: [
    "`node check.mjs ~/devdock-git/p03` печатает `Пройдено проверок: 22 из 22`.",
    "Заготовка (сразу после `setup.sh`) проходит 3 проверки из 22.",
    "Каждый из восьми «плохих» вариантов проваливает от 2 до 6 проверок, результат стабилен при повторных запусках.",
    "Эталон — два `pull --rebase`, один отказ `push` на каждом этапе и `--ff-only`; полная проверка занимает около 0,2 секунды.",
  ],
  technical: [
    "**Отказ push.** `git push` отправляет только перемотку: сервер принимает обновление ссылки, если новое значение — потомок старого. Если на сервере есть коммит, которого нет у вас, Git сообщает `rejected … (fetch first)` и ничего не меняет.",
    "**Измерение расхождения.** После `git fetch` команда `git rev-list --left-right --count main...origin/main` печатает два числа: сколько коммитов только у вас (`ahead`) и сколько только на сервере (`behind`). Наглядно: `git log --oneline --graph --all`, `git status -sb`.",
    "**Интеграция.** Два способа: `git pull` со слиянием (создаёт коммит слияния и сохраняет исходные хэши) и `git pull --rebase` (повторяет ваши коммиты поверх чужих, хэши меняются, история линейна). Сделать выбор постоянным можно настройкой `pull.rebase`. Без неё Git 2.43 откажется выполнять `git pull` при расхождении и попросит выбрать способ.",
    "**Upstream.** `git push -u origin <ветка>` публикует ветку и записывает в конфигурацию `branch.<имя>.remote` и `branch.<имя>.merge`; после этого `git pull`/`git push` без аргументов знают, откуда и куда. `git branch -vv` показывает связь и состояние (`ahead`, `behind`, `gone`).",
    "**Перемотка.** `git merge --ff-only` либо сдвинет ветку вперёд, либо откажется. Это удобный предохранитель: если `main` кто-то обогнал, вы узнаете об этом сразу.",
    "**Удаление ветки на сервере.** `git push origin --delete <ветка>`; вместе с ней исчезает и ваша ссылка `origin/<ветка>` — локальная ветка при этом остаётся и показывается как `gone`. Устаревшие ссылки на ветки, удалённые другими, убирает `git fetch --prune`.",
    "**Когда rebase нельзя.** После публикации коммит видят другие; его перебазирование создаёт «двойника» и ломает чужие клоны. Поэтому rebase — до первого `push`.",
  ],
  acceptance: [
    "`node check.mjs ~/devdock-git/p03` — 22 из 22.",
    "`git log --oneline --graph --all` в `work/` — одна прямая линия из девяти коммитов без слияний.",
    "`git branch -vv` показывает `main` с upstream `origin/main` и `feature/units` с пометкой `gone` (серверной ветки нет).",
    "Вы можете объяснить, откуда взялись числа `ahead: 2` и `behind: 1`, и показать их командой.",
  ],
  hints: [
    "Для расхождения сначала нужен `git fetch`: до него `origin/main` в вашем клоне ничего не знает о коммите Боба.",
    "Команда `git rev-list --left-right --count main...origin/main` выводит два числа через табуляцию: первое — ваши коммиты, второе — чужие.",
    "`git pull` без настройки при расхождении откажется работать. Нужен `git pull --rebase` (или `git config pull.rebase true`).",
    "Ветку публикуйте так: `git switch -c feature/units`, коммит, `git push -u origin feature/units`.",
    "`bash ../teammate.sh` запускайте из `work/` уже **после** публикации ветки; скрипт сам заберёт ветку с сервера и отправит коммит Боба.",
    "Следующий `git push` будет отклонён — это нормально: `git pull --rebase`, затем `git push`.",
    "`git switch main && git merge --ff-only feature/units && git push`; затем `git push origin --delete feature/units`.",
    "Если запутались, `git log --oneline --graph --all` в `work/`, `teammate/` и `git -C ../remote.git log --oneline main` покажут картину целиком.",
  ],
  advanced: [
    "Повторите задачу со слиянием вместо rebase (`git pull --no-rebase`) и сравните историю: какие хэши сохраняются и что покажет `git log --graph`.",
    "Настройте `pull.rebase`, `pull.ff only` и `fetch.prune` и объясните, как изменится поведение `git pull` и `git fetch`.",
    "Выполните шаг с `--force-with-lease` вместо обычного: чем он безопаснее `--force` и в каком случае откажет.",
    "Покажите состояние `branch -vv` до `push -u`, после и после удаления серверной ветки.",
    "Эмулируйте «форк»: добавьте второй remote `upstream` на `remote.git` и синхронизируйте с ним `main`.",
  ],
  failureModes: [
    "**`pull` со слиянием вместо `rebase`:** в истории сервера появляется коммит слияния, исходные хэши ваших коммитов остаются, история нелинейна (3 красные из 22).",
    "**`push --force` затирает коммит Боба:** чужой коммит пропадает, в `main` не девять коммитов, порядок нарушен (4 красные).",
    "**Ветка опубликована без `-u`:** у `feature/units` нет upstream, `git pull` без аргументов не работает (2 красные).",
    "**Серверная ветка не удалена:** `feature/units` остаётся на сервере (2 красные).",
    "**Перепутаны `ahead` и `behind` в ответах** (2 красные).",
    "**`main` влит слиянием, а не перемоткой:** появляется лишний коммит слияния, история нелинейна, коммитов десять (3 красные).",
    "**Локальная ветка удалена:** по настройкам upstream уже не видно, что ветка публиковалась с `-u` (3 красные).",
    "**Коллега не запускался:** в ветке нет коммита Боба, опечатка не исправлена, порядок и число коммитов не те (6 красных).",
  ],
  rubric: [
    { criterion: "Не потерять чужую работу", weight: 25, description: "Коммит Боба на сервере сохранён, force-push не использован, повторов и «двойников» нет." },
    { criterion: "Линейная история через rebase", weight: 25, description: "Свои коммиты перенесены `pull --rebase` до публикации, слияний нет, порядок коммитов осмысленный." },
    { criterion: "Работа с ветками и upstream", weight: 20, description: "Ветка опубликована с `-u`, влита перемоткой, удалена на сервере, локальная ветка сохранена." },
    { criterion: "Диагностика расхождения", weight: 15, description: "Верные `ahead`/`behind`, использование `fetch`, `rev-list --left-right`, `log --graph`, `branch -vv`." },
    { criterion: "Аккуратность", weight: 15, description: "Чистое дерево, сообщения коммитов по условию, ни одной лишней команды, меняющей чужую историю." },
  ],
  solution: [
    p("Эталон — скрипт из 40 строк: он проходит все 22 проверки; заготовка проходит 3, а каждый из восьми намеренно испорченных вариантов проходит от 16 до 20 проверок из 22. Ниже — решение, проверяющий скрипт и результаты запусков на git 2.43.0."),
    h("solution.sh"),
    code("bash", `#!/usr/bin/env bash
# solution.sh <каталог> — эталонное решение (запускается после setup.sh)
set -e
W="$(cd "\${1:?укажите каталог}" && pwd)"
cd "$W/work"
export GIT_EDITOR=true

# 1. Обычный push отклонён: на сервере есть чужой коммит. Сначала смотрим, как разошлись истории
git push || true
git fetch -q origin
read -r ahead behind < <(git rev-list --left-right --count main...origin/main)
printf 'ahead: %s\\nbehind: %s\\n' "$ahead" "$behind" > "$W/answers.txt"

# 2. Переносим свои коммиты поверх чужих (линейная история) и отправляем
git pull -q --rebase
git push -q

# 3. Ветка для новой функции: публикуем с запоминанием upstream
git switch -q -c feature/units
printf '// единицы измерения: --units c|f\\nmodule.exports = { convert: (v, u) => (u === "f" ? v * 9 / 5 + 32 : v) };\\n' > units.js
git add units.js
git commit -q -m "feat: add --units option"
git push -q -u origin feature/units

# 4. Боб правит опечатку в той же ветке и отправляет
bash "$W/teammate.sh"

# 5. Ваш следующий коммит: push отклонён, подтягиваем чужой коммит с перебазированием
printf '\\n\`node app.js [город] --units f\` — температура в градусах Фаренгейта.\\n' >> README.md
git commit -q -am "docs: describe --units"
git push || true
git pull -q --rebase
git push -q

# 6. Вливаем ветку в main перемоткой и публикуем; серверную ветку удаляем, ссылки на неё чистим
git switch -q main
git merge -q --ff-only feature/units
git push -q
git push -q origin --delete feature/units
git fetch -q --prune`, { filename: "solution.sh", lineNumbers: true }),
    ul(
      "**Шаг 1.** `git push` отклонён (`fetch first`). После `git fetch` команда `rev-list --left-right --count main...origin/main` печатает `2` и `1`: у вас два коммита, которых нет на сервере, а на сервере один, которого нет у вас.",
      "**Шаг 2.** `git pull --rebase` повторяет два ваших коммита поверх коммита Боба; их хэши меняются, и именно поэтому проверка требует отсутствия исходных хэшей. Теперь `push` проходит как перемотка.",
      "**Шаг 3.** `push -u` записывает `branch.feature/units.remote` и `branch.feature/units.merge`: по ним проверка узнаёт, что ветка публиковалась с upstream.",
      "**Шаг 5.** Коммит Боба на сервере делает ваш `push` отклонённым снова; `pull --rebase` переносит ваш `docs: describe --units` поверх него — получается порядок «ваш → Боб → ваш».",
      "**Шаг 6.** `merge --ff-only` сдвигает `main` на конец ветки без нового коммита; `push origin --delete` удаляет серверную ветку и заодно ссылку `origin/feature/units`, поэтому `git branch -vv` показывает `[origin/feature/units: gone]`.",
    ),
    h("check.mjs"),
    code("js", `#!/usr/bin/env node
// check.mjs <каталог> — проверка проекта 3 «Синхронизация с сервером». Каталог — тот, что создал setup.sh
// (внутри work/, remote.git, teammate/ и ваш answers.txt). Требуется Node.js 18+ и git; проверка только читает.
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

const W = ROOT, work = join(W, "work"), remote = join(W, "remote.git");
const wg = (a) => git(a, work), rg = (a) => git(a, remote);
// Исходные коммиты (setup.sh воспроизводим, поэтому их хэши известны заранее)
const BOB = "88f307f6b93a6b8df185fd0adfa70f30092c9a97";       // «fix: handle unknown city» — уже на сервере
const ORIG = ["c5ebecd92f819cf6aa76faa1b9de4972e1047759", "f0cadb78baa3859c3cbbeb8a19aa7f14b9febc74"]; // ваши два локальных коммита до перебазирования
const subjects = lines(rg(["log", "--reverse", "--format=%s", "main"]).out);
const count = (s) => subjects.filter((x) => x === s).length;
const idx = (s) => subjects.indexOf(s);
const answers = existsSync(join(W, "answers.txt")) ? read(join(W, "answers.txt")) : "";
const answer = (k) => (answers.match(new RegExp(\`^\${k}:\\\\s*(\\\\S+)\`, "m")) ?? [])[1] ?? "";
const cfg = (k) => wg(["config", "--get", k]).out;
const F = ["feat: add --units option", "fix: typo in units help", "docs: describe --units"];

check("на сервере есть ветка main", () => rg(["rev-parse", "--verify", "-q", "refs/heads/main"]).ok);
check("коммит Боба («fix: handle unknown city») на сервере: чужую работу не затёрли", () => rg(["merge-base", "--is-ancestor", BOB, "main"]).ok);
check("ваши коммиты «feat: add forecast command» и «docs: update README» доставлены ровно по разу", () => count("feat: add forecast command") === 1 && count("docs: update README") === 1);
check("они перенесены поверх чужого коммита: исходные хэши в истории сервера отсутствуют", () => count("docs: update README") === 1 && ORIG.every((h) => !rg(["merge-base", "--is-ancestor", h, "main"]).ok));
check("история main на сервере линейная: слияний нет", () => [count("docs: update README") === 1 && rg(["rev-list", "--merges", "--count", "main"]).out === "0", \`слияний: \${rg(["rev-list", "--merges", "--count", "main"]).out}\`]);
check("коммит Боба стоит раньше ваших двух", () => idx("fix: handle unknown city") >= 0 && idx("fix: handle unknown city") < idx("feat: add forecast command") && idx("feat: add forecast command") < idx("docs: update README"));
check("коммиты функции --units на сервере в main: по одному", () => F.every((s) => count(s) === 1));
check("порядок коммитов функции: ваш → Боб → ваш", () => idx(F[0]) >= 0 && idx(F[0]) < idx(F[1]) && idx(F[1]) < idx(F[2]));
check("повторяющихся сообщений в main нет (нет старых копий после rebase)", () => [subjects.length > 4 && new Set(subjects).size === subjects.length, \`коммитов: \${subjects.length}, уникальных: \${new Set(subjects).size}\`]);
check("в main ровно 9 коммитов (3 исходных + Боб + 2 ваших + 3 коммита функции)", () => [subjects.length === 9, \`сейчас: \${subjects.length}\`]);
check("серверная ветка feature/units удалена (после того, как её коммиты попали в main)", () => F.every((x) => count(x) === 1) && !rg(["rev-parse", "--verify", "-q", "refs/heads/feature/units"]).ok);
check("main: локальный = origin/main = серверный", () => { const a = wg(["rev-parse", "main"]).out, b = wg(["rev-parse", "origin/main"]).out, c = rg(["rev-parse", "main"]).out; return [a === b && b === c && a !== "", \`\${a.slice(0, 7)} \${b.slice(0, 7)} \${c.slice(0, 7)}\`]; });
check("локальная ветка feature/units сохранена и совпадает с main", () => wg(["rev-parse", "feature/units"]).out === wg(["rev-parse", "main"]).out);
check("у feature/units настроен upstream на origin (ветка публиковалась с -u)", () => [cfg("branch.feature/units.remote") === "origin" && cfg("branch.feature/units.merge") === "refs/heads/feature/units", \`\${cfg("branch.feature/units.remote")} \${cfg("branch.feature/units.merge")}\`]);
check("ссылка origin/feature/units не осталась «висеть» после удаления ветки", () => cfg("branch.feature/units.remote") === "origin" && !wg(["rev-parse", "--verify", "-q", "refs/remotes/origin/feature/units"]).ok);
check("вы на main (upstream origin/main), рабочее дерево чистое", () => wg(["rev-parse", "--abbrev-ref", "HEAD"]).out === "main" && cfg("branch.main.remote") === "origin" && cfg("branch.main.merge") === "refs/heads/main" && wg(["status", "--porcelain"]).out === "");
check("units.js есть в main и не пуст", () => rg(["show", "main:units.js"]).out.length > 0);
check("README в main описывает --units", () => rg(["show", "main:README.md"]).out.includes("--units"));
check("опечатка Боба исправлена в help.txt в main", () => { const s = rg(["show", "main:help.txt"]).out; return s.includes("temperature") && !s.includes("temprature"); });
check("коммит с исправлением опечатки написан Бобом (Bob Coder)", () => rg(["log", "--format=%an", "--grep=^fix: typo in units help$", "main"]).out === "Bob Coder");
check("answers.txt: ahead: 2 (столько ваших коммитов не было на сервере)", () => [answer("ahead") === "2", answer("ahead") || "нет строки «ahead: …» в answers.txt"]);
check("answers.txt: behind: 1 (столько чужих коммитов вы не имели)", () => [answer("behind") === "1", answer("behind") || "нет строки «behind: …» в answers.txt"]);

summary();`, { filename: "check.mjs", collapsed: true }),
    code("text", `✓ на сервере есть ветка main
✓ коммит Боба («fix: handle unknown city») на сервере: чужую работу не затёрли
✓ ваши коммиты «feat: add forecast command» и «docs: update README» доставлены ровно по разу
✓ они перенесены поверх чужого коммита: исходные хэши в истории сервера отсутствуют
✓ история main на сервере линейная: слияний нет
✓ коммит Боба стоит раньше ваших двух
✓ коммиты функции --units на сервере в main: по одному
✓ порядок коммитов функции: ваш → Боб → ваш
✓ повторяющихся сообщений в main нет (нет старых копий после rebase)
✓ в main ровно 9 коммитов (3 исходных + Боб + 2 ваших + 3 коммита функции)
✓ серверная ветка feature/units удалена (после того, как её коммиты попали в main)
✓ main: локальный = origin/main = серверный
✓ локальная ветка feature/units сохранена и совпадает с main
✓ у feature/units настроен upstream на origin (ветка публиковалась с -u)
✓ ссылка origin/feature/units не осталась «висеть» после удаления ветки
✓ вы на main (upstream origin/main), рабочее дерево чистое
✓ units.js есть в main и не пуст
✓ README в main описывает --units
✓ опечатка Боба исправлена в help.txt в main
✓ коммит с исправлением опечатки написан Бобом (Bob Coder)
✓ answers.txt: ahead: 2 (столько ваших коммитов не было на сервере)
✓ answers.txt: behind: 1 (столько чужих коммитов вы не имели)

Пройдено проверок: 22 из 22`, { filename: "результат node check.mjs (эталонное решение, git 2.43.0)" }),
    code("text", `✓ на сервере есть ветка main
✓ коммит Боба («fix: handle unknown city») на сервере: чужую работу не затёрли
✗ ваши коммиты «feat: add forecast command» и «docs: update README» доставлены ровно по разу
✗ они перенесены поверх чужого коммита: исходные хэши в истории сервера отсутствуют
✗ история main на сервере линейная: слияний нет — слияний: 0
✗ коммит Боба стоит раньше ваших двух
✗ коммиты функции --units на сервере в main: по одному
✗ порядок коммитов функции: ваш → Боб → ваш
✗ повторяющихся сообщений в main нет (нет старых копий после rebase) — коммитов: 4, уникальных: 4
✗ в main ровно 9 коммитов (3 исходных + Боб + 2 ваших + 3 коммита функции) — сейчас: 4
✗ серверная ветка feature/units удалена (после того, как её коммиты попали в main)
✗ main: локальный = origin/main = серверный — f0cadb7 536f066 88f307f
✗ локальная ветка feature/units сохранена и совпадает с main
✗ у feature/units настроен upstream на origin (ветка публиковалась с -u) —  
✗ ссылка origin/feature/units не осталась «висеть» после удаления ветки
✓ вы на main (upstream origin/main), рабочее дерево чистое
✗ units.js есть в main и не пуст
✗ README в main описывает --units
✗ опечатка Боба исправлена в help.txt в main
✗ коммит с исправлением опечатки написан Бобом (Bob Coder)
✗ answers.txt: ahead: 2 (столько ваших коммитов не было на сервере) — нет строки «ahead: …» в answers.txt
✗ answers.txt: behind: 1 (столько чужих коммитов вы не имели) — нет строки «behind: …» в answers.txt

Пройдено проверок: 3 из 22`, { filename: "результат для заготовки (сразу после setup.sh)" }),
    code("text", `заготовка — 3 из 22 (красных: 19; первая: ваши коммиты «feat: add forecast command» и «docs: update README» доставлены ровно по разу)
эталонное решение — 22 из 22
b1: pull со слиянием вместо rebase — 19 из 22 (красных: 3; первая: они перенесены поверх чужого коммита: исходные хэши в истории сервера отсутствуют)
b2: force push затирает коммит Боба — 18 из 22 (красных: 4; первая: коммит Боба («fix: handle unknown city») на сервере: чужую работу не затёрли)
b3: ветка опубликована без -u — 20 из 22 (красных: 2; первая: у feature/units настроен upstream на origin (ветка публиковалась с -u))
b4: серверная ветка feature/units не удалена — 20 из 22 (красных: 2; первая: серверная ветка feature/units удалена (после того, как её коммиты попали в main))
b5: в answers.txt перепутаны ahead и behind — 20 из 22 (красных: 2; первая: answers.txt: ahead: 2 (столько ваших коммитов не было на сервере))
b6: main слит в виде слияния, а не перемоткой — 19 из 22 (красных: 3; первая: история main на сервере линейная: слияний нет)
b7: локальная ветка удалена — 19 из 22 (красных: 3; первая: локальная ветка feature/units сохранена и совпадает с main)
b8: коллега не запускался: нет коммита Боба в ветке — 16 из 22 (красных: 6; первая: коммиты функции --units на сервере в main: по одному)`, { filename: "результаты check.mjs для вариантов с ошибками" }),
    tip("Проверка только читает репозитории (`work/` и `remote.git/`). Аргумент — каталог, созданный `setup.sh`; файл `answers.txt` ищется в нём же."),
    warn("Хэши исходных коммитов (Боба и двух ваших локальных) зашиты в `check.mjs`: они одинаковы у всех, кто создал репозитории скриптом `setup.sh` без изменений. Коммит Боба в ветке `feature/units` ищется по тексту сообщения и автору."),
  ],
};
