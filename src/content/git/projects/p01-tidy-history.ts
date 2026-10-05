import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p01TidyHistory: Project = {
  id: "git.p01-tidy-history",
  domain: "git",
  order: 1,
  title: "Привести в порядок рабочий каталог и историю",
  subtitle: "Репозиторий с «грязным» рабочим деревом: атомарные коммиты, .gitignore, отмена случайных правок, поиск в истории — 24 проверки на git 2.43.0",
  level: "foundation",
  estimatedHours: 4,
  buildsOn: [],
  topics: [
    "git.git-mental-model",
    "git.three-areas",
    "git.commits-history",
    "git.undoing-changes",
    "git.gitignore-tracking",
    "git.searching-history",
  ],
  objective:
    "Превратить «грязное» рабочее дерево чужого проекта в **чистую, читаемую историю**: разделить две несвязанные правки одного файла на отдельные коммиты, отбросить случайное изменение, настроить `.gitignore` и перестать отслеживать уже закоммиченный мусор, исправить опечатку в сообщении неопубликованного коммита и ответить на вопросы об истории (**кто и когда добавил константу**) с помощью `git log -S`. Проект про три области Git (рабочее дерево → индекс → репозиторий) и про привычку превращать любое изменение в осмысленный коммит.",
  scenario: [
    p("Коллеги передали вам прототип консольной программы для заметок `notes-cli`. В репозитории шесть коммитов, и последний из них вышел с опечаткой в сообщении (`fix: handel empty note`) — он ещё не опубликован. В рабочем каталоге после коллег осталось много лишнего:"),
    ul(
      "в `app.js` две **несвязанные правки**: новая возможность `list --json` и временная отладочная строка `console.log(\"DEBUG …\")`;",
      "в `config.json` случайно записано `\"max\": -1` — эту правку нужно отбросить;",
      "неотслеживаемые файлы: `.env` с ключом, `notes.log`, `tmp/cache.json`, `dist/bundle.js` и полезная заготовка `docs/usage.md`;",
      "в репозиторий когда-то попал лог сборки `build.log` (его нужно перестать отслеживать, не удаляя с диска и не переписывая историю).",
    ),
    p("Скрипт `setup.sh` создаёт этот репозиторий: даты и авторы зафиксированы, поэтому у всех получается одно и то же. Работайте в нём как в обычном проекте, затем запустите `check.mjs` — он только читает репозиторий и проверяет **24 факта**. Нужны `git` 2.32+ и Node.js 18+."),
    code("bash", `mkdir -p ~/devdock-git && cd ~/devdock-git
# сохраните setup.sh и check.mjs из этой страницы в текущую папку
bash setup.sh ~/devdock-git/p01        # создать учебный репозиторий
cd ~/devdock-git/p01
git status                             # оцените беспорядок и приступайте
# ...когда закончите:
node ../check.mjs ~/devdock-git/p01`, { filename: "порядок работы" }),
    code("bash", `#!/usr/bin/env bash
# setup.sh <каталог> — создаёт учебный репозиторий notes-cli с историей коллег и «грязным» рабочим деревом.
# Даты и авторы фиксированы: у всех получается один и тот же репозиторий.
set -e
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null   # ваши глобальные настройки Git (подпись коммитов, шаблоны…) не влияют на результат
W="\${1:?укажите каталог: bash setup.sh ~/devdock-git/p01}"
rm -rf "$W"; mkdir -p "$W"; cd "$W"
git init -q -b main
git config user.name "Student"; git config user.email "student@example.com"
t=1736931600
commit() {  # commit "Автор" "почта" "сообщение" — коммит всех изменений с фиксированным временем
  t=$((t+3600))
  GIT_AUTHOR_NAME="$1" GIT_AUTHOR_EMAIL="$2" GIT_COMMITTER_NAME="$1" GIT_COMMITTER_EMAIL="$2" \\
  GIT_AUTHOR_DATE="$t +0000" GIT_COMMITTER_DATE="$t +0000" git commit -q -a -m "$3"
}
BOB=("Bob Coder" "bob@example.com"); CAROL=("Carol Ops" "carol@example.com")

# 1. каркас
cat > app.js <<'EOT'
// notes-cli: заметки из командной строки
const fs = require("fs");
const FILE = "notes.json";

function load() {
  return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : [];
}

function save(notes) {
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
}

function add(text) {
  const notes = load();
  notes.push({ text, at: "2025-01-15" });
  save(notes);
}

function list() {
  for (const n of load()) console.log("- " + n.text);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "add") add(args.join(" "));
else if (cmd === "list") list();
else console.log("usage: notes add <text> | notes list");
EOT
printf '# notes-cli\\n\\nМаленькая программа для заметок.\\n' > README.md
git add -A; commit "\${BOB[@]}" "feat: add notes CLI skeleton"

# 2. настройки
printf '{\\n  "file": "notes.json",\\n  "max": 50\\n}\\n' > config.json
git add -A; commit "\${BOB[@]}" "feat: save notes to config"

# 3. лог сборки попал под контроль версий
printf 'build started\\nbuild ok\\n' > build.log
git add -A; commit "\${CAROL[@]}" "chore: add build log"

# 4. лимит заметок
cat > app.js <<'EOT'
// notes-cli: заметки из командной строки
const fs = require("fs");
const FILE = "notes.json";
const MAX_NOTES = 50;

function load() {
  return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : [];
}

function save(notes) {
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
}

function add(text) {
  const notes = load();
  if (notes.length >= MAX_NOTES) return console.log("limit reached");
  notes.push({ text, at: "2025-01-15" });
  save(notes);
}

function list() {
  for (const n of load()) console.log("- " + n.text);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "add") add(args.join(" "));
else if (cmd === "list") list();
else console.log("usage: notes add <text> | notes list");
EOT
git add -A; commit "\${CAROL[@]}" "feat: limit number of notes"

# 5. документация
printf '\\n## Команды\\n\\n- \`notes add <текст>\` — добавить заметку\\n- \`notes list\` — показать все\\n' >> README.md
git add -A; commit "\${BOB[@]}" "docs: describe commands in README"

# 6. пустые заметки (в сообщении опечатка)
cat > app.js <<'EOT'
// notes-cli: заметки из командной строки
const fs = require("fs");
const FILE = "notes.json";
const MAX_NOTES = 50;

function load() {
  return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : [];
}

function save(notes) {
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
}

function add(text) {
  if (!text) return console.log("empty note");
  const notes = load();
  if (notes.length >= MAX_NOTES) return console.log("limit reached");
  notes.push({ text, at: "2025-01-15" });
  save(notes);
}

function list() {
  for (const n of load()) console.log("- " + n.text);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "add") add(args.join(" "));
else if (cmd === "list") list();
else console.log("usage: notes add <text> | notes list");
EOT
git add -A; commit "\${BOB[@]}" "fix: handel empty note"

# --- «грязное» рабочее дерево: две несвязанные правки в app.js, лишние файлы, сломанный config.json ---
cat > app.js <<'EOT'
// notes-cli: заметки из командной строки
const fs = require("fs");
console.log("DEBUG argv:", process.argv);
const FILE = "notes.json";
const MAX_NOTES = 50;

function load() {
  return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : [];
}

function save(notes) {
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
}

function add(text) {
  if (!text) return console.log("empty note");
  const notes = load();
  if (notes.length >= MAX_NOTES) return console.log("limit reached");
  notes.push({ text, at: "2025-01-15" });
  save(notes);
}

function list(json) {
  const notes = load();
  if (json) return console.log(JSON.stringify(notes));
  for (const n of notes) console.log("- " + n.text);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "add") add(args.join(" "));
else if (cmd === "list") list(args[0] === "--json");
else console.log("usage: notes add <text> | notes list");
EOT
printf '{\\n  "file": "notes.json",\\n  "max": -1\\n}\\n' > config.json
printf 'API_KEY=sk-test-123\\n' > .env
printf 'started\\nadded note\\n' > notes.log
mkdir -p tmp dist docs
printf '{"cache":true}\\n' > tmp/cache.json
printf '/* bundle */\\n' > dist/bundle.js
printf '# Использование\\n\\n\`\`\`\\nnode app.js add "купить хлеб"\\nnode app.js list --json\\n\`\`\`\\n' > docs/usage.md
echo "Репозиторий создан: $W"`, { filename: "setup.sh", collapsed: true }),
    table(
      ["Что сделать", "Результат в репозитории"],
      [
        ["Исправить сообщение последнего коммита", "Шестой коммит называется `fix: handle empty note`; коммит переписан, а не продублирован"],
        ["Закоммитить `list --json`", "Отдельный коммит `feat…`, который меняет только `app.js` и **не содержит** отладочную строку; в рабочем дереве `DEBUG` тоже нет"],
        ["Отбросить правку `config.json`", "Файл совпадает с версией из истории"],
        ["Закоммитить `docs/usage.md`", "Отдельный коммит, затрагивающий только этот файл"],
        ["Настроить `.gitignore`", "Игнорируются `.env`, `notes.log`, `tmp/`, `dist/`; нужные файлы — нет; `.env` не попал ни в один коммит"],
        ["Перестать отслеживать `build.log`", "Файл удалён из индекса коммитом, остался на диске, старая история не тронута"],
        ["Ответить на вопросы об истории", "Файл `answers.txt` с двумя строками: `introduced: <хэш коммита>` и `author: <имя автора>` для константы `MAX_NOTES`; файл закоммичен"],
      ],
      "Задание",
    ),
    tip("Сообщения всех новых коммитов — в формате Conventional Commits (`тип(область): описание`). В конце `git status` должен показывать чистое дерево."),
  ],
  requirements: [
    "Первые пять коммитов коллег на месте (те же сообщения и порядок); шестой переписан только по сообщению: `fix: handle empty note`. В истории нет коммитов с `handel`, а коммит про `empty note` один.",
    "`app.js` содержит функцию `--json` и не содержит строки `DEBUG`; функция закоммичена отдельным коммитом типа `feat`, который затрагивает только `app.js` и тоже не содержит отладочной строки.",
    "`config.json` в рабочем дереве и в `HEAD` совпадает с версией из коммита `feat: save notes to config`.",
    "`docs/usage.md` добавлен коммитом, который не затрагивает другие файлы.",
    "`.gitignore` в репозитории; `git check-ignore` подтверждает игнорирование `.env`, `notes.log`, `tmp/cache.json`, `dist/bundle.js` и не игнорирует `app.js`, `README.md`, `config.json`, `docs/usage.md`.",
    "`build.log` не отслеживается (`git ls-files build.log` пуст), остался на диске, удаление записано ровно одним коммитом.",
    "`.env` не появляется ни в одном коммите ни одной ветки (`git log --all -- .env` пуст).",
    "Все новые коммиты оформлены по Conventional Commits; не менее четырёх ваших коммитов, и ни один не смешивает код (`app.js`, `config.json`), документацию (`docs/`, `README.md`, `answers.txt`) и служебные файлы (`.gitignore`, `build.log`).",
    "`answers.txt` закоммичен: хэш (не короче семи знаков) указывает на коммит, где появилась константа `MAX_NOTES`; `author:` — автор этого коммита.",
    "Рабочее дерево чистое: `git status --porcelain` ничего не выводит.",
  ],
  constraints: [
    "Только команды Git (без внешних утилит для правки истории); историю коллег (коммиты 1–5) переписывать нельзя.",
    "Не используйте `git add -A` и `git commit -a` «вслепую»: перед каждым коммитом смотрите `git status` и `git diff --staged`.",
    "Не удаляйте `.env`, `notes.log` и `build.log` с диска и не коммитьте `.env`.",
    "Ответы на вопросы об истории получайте командами Git, а не просмотром файлов.",
  ],
  expected: [
    "`node ../check.mjs ~/devdock-git/p01` печатает `Пройдено проверок: 24 из 24`.",
    "Заготовка (сразу после `setup.sh`) проходит 5 проверок из 24.",
    "Каждый из восьми «плохих» вариантов проваливает от 1 до 10 проверок, результат стабилен при повторных запусках.",
    "Эталонное решение — переписанный шестой коммит и четыре новых поверх истории коллег; полная проверка занимает около 0,2 секунды.",
  ],
  technical: [
    "**Три области.** `git diff` сравнивает дерево с индексом, `git diff --staged` — индекс с `HEAD`. Коммит берёт содержимое индекса, поэтому изменения можно собирать по частям: `git add -p` (интерактивно выбирает фрагменты) или `git add <файл>` по файлам.",
    "**Две правки в одном файле.** Фрагменты (hunks) в `git add -p` предлагаются по очереди: `y` — подготовить, `n` — пропустить. Если фрагменты слиплись, поможет `s` (разделить) или `e` (править вручную). После коммита оставшуюся строку `DEBUG` отбрасывают `git restore app.js`.",
    "**Отмена.** `git restore <файл>` возвращает файл из индекса, `git restore --staged <файл>` — убирает его из индекса, `git commit --amend` переписывает **последний** коммит (допустимо, пока он не опубликован).",
    "**Игнорирование не действует на уже отслеживаемые файлы.** Чтобы перестать отслеживать файл и сохранить его на диске, нужен `git rm --cached <файл>`; затем коммит. Проверить правило помогает `git check-ignore -v <путь>`.",
    "**Поиск по истории.** `git log -S<строка>` находит коммиты, в которых число вхождений строки изменилось (так находят момент появления и удаления); `git blame` показывает последний коммит для каждой строки; `--reverse` выводит старые коммиты первыми.",
    "**Секреты.** Файл, однажды попавший в коммит, остаётся в истории; поэтому `.env` игнорируют **до** первого `git add`.",
  ],
  acceptance: [
    "`node ../check.mjs ~/devdock-git/p01` — 24 из 24, `git status` чистый.",
    "`git log --oneline` читается как рассказ: шесть строк коллег и ваши осмысленные коммиты (`feat`, `docs`, `chore`).",
    "Для каждого вашего коммита вы можете назвать, почему он отдельный, и показать `git show --stat`.",
    "Вы можете показать командой, что `.env` ни разу не был закоммичен, а `build.log` остался в старом коммите.",
  ],
  hints: [
    "Начните с `git status` и `git diff`: сначала поймите, какие изменения чьи, и только потом коммитьте.",
    "Опечатку в сообщении исправляет `git commit --amend -m \"…\"`; сделайте это сразу — пока в индексе пусто, в коммит ничего лишнего не попадёт.",
    "Чтобы закоммитить только `--json`, выберите в `git add -p app.js` второй фрагмент (`n` для первого, `y` для второго), а потом удалите строку `DEBUG` командой `git restore app.js`.",
    "`git restore config.json` возвращает файл из индекса; проверьте `git diff config.json` — вывод должен быть пустым.",
    "Правило `*.log` игнорирует и `notes.log`, и `build.log`; но `build.log` отслеживается — потребуется `git rm --cached build.log`.",
    "Не получается проверить игнорирование — запустите `git check-ignore -v tmp/cache.json`: он покажет файл и строку правила либо ничего.",
    "Для вопросов об истории: `git log -S MAX_NOTES --format=\"%h %an\" --reverse`. Укажите в `answers.txt` значения из первой строки вывода.",
    "Если коммит получился «грязным» — `git reset --soft HEAD~1` вернёт изменения в индекс; затем заново соберите коммиты.",
  ],
  advanced: [
    "Решите ту же задачу без интерактива: отдельный патч для второго фрагмента (`git diff app.js > p.patch`, правка файла, `git apply --cached p.patch`).",
    "Добавьте глобальный файл исключений (`core.excludesFile`) для мусора редактора и объясните, чем он отличается от `.gitignore` и `.git/info/exclude`.",
    "Найдите, **кто и когда** последний раз менял строку с `empty note` (`git blame -L`) и чем это отличается от `git log -S`.",
    "Используйте `git log --follow` для файла `README.md` и перечислите коммиты, которые его меняли.",
    "Допишите хук `pre-commit`, который отклоняет строки `DEBUG` в подготовленных изменениях (см. тему «Качество коммитов и хуки»).",
  ],
  failureModes: [
    "**Нет `.gitignore`:** четыре файла остаются неотслеживаемыми, `git status` грязный, `.gitignore` нет в репозитории (6 красных из 24).",
    "**Всё одним коммитом «update»:** `git add -A` подхватил `.env`, `dist/` и `notes.log`; сообщение не соответствует формату; код и документация смешаны (10 красных).",
    "**`.env` закоммитили, а потом удалили:** секрет остаётся в истории (1 красная: `.env не попал ни в один коммит`).",
    "**`git rm build.log` без `--cached`:** лог удалён с диска (1 красная).",
    "**Случайная правка `config.json` закоммичена вместе со служебными файлами:** файл отличается от версии в истории, а коммит смешивает код и служебные файлы (2 красные).",
    "**Ответ о появлении константы указывает на другой коммит** (1 красная).",
    "**Опечатка осталась:** сообщение не исправлено; вторая красная проверка — что коммит переписан, а не дублирован (2 красные).",
    "**Отладочная строка `DEBUG` попала в коммит и в рабочее дерево** (2 красные).",
  ],
  rubric: [
    { criterion: "Атомарные коммиты и сообщения", weight: 30, description: "Правки разделены по смыслу (функция, документация, служебное), каждый коммит меняет одно; сообщения в формате Conventional Commits." },
    { criterion: "Игнорирование и отслеживание", weight: 20, description: "Правила `.gitignore` верны, ненужное не отслеживается, нужное не игнорируется; `git rm --cached` вместо удаления с диска." },
    { criterion: "Отмена и безопасность истории", weight: 20, description: "`restore` для случайных правок, `--amend` только для неопубликованного коммита, секреты не попадают в историю, чужие коммиты не переписаны." },
    { criterion: "Поиск по истории", weight: 15, description: "Ответы на вопросы получены `git log -S`/`blame` и подтверждены проверкой." },
    { criterion: "Самопроверка и аккуратность", weight: 15, description: "Перед коммитом просмотрены `status` и `diff --staged`; в конце чистое дерево и 24 из 24." },
  ],
  solution: [
    p("Эталон — скрипт из 32 строк: он выполняет шесть шагов задания командами Git и проходит все 24 проверки; заготовка проходит 5, а каждый из восьми намеренно испорченных вариантов проходит от 14 до 23 проверок из 24. Ниже — решение, проверяющий скрипт и результаты запусков на git 2.43.0."),
    h("solution.sh"),
    code("bash", `#!/usr/bin/env bash
# solution.sh <каталог> — эталонное решение (запускается после setup.sh)
set -e
cd "\${1:?укажите каталог}"

# 1. Опечатка в сообщении последнего коммита (он не опубликован — можно переписать)
git commit --amend -q -m "fix: handle empty note"

# 2. Функция --json — отдельным коммитом, отладочная строка в коммит не попадает
grep -v 'DEBUG argv' app.js > app.js.new && mv app.js.new app.js
git add app.js
git commit -q -m "feat: add --json output for list"

# 3. Случайную правку настроек отбрасываем
git restore config.json

# 4. Документация — отдельный коммит
git add docs/usage.md
git commit -q -m "docs: add usage guide"

# 5. Игнорируем локальные файлы и перестаём отслеживать build.log (сам файл остаётся на диске)
printf '.env\\n*.log\\ntmp/\\ndist/\\n' > .gitignore
git rm -q --cached build.log
git add .gitignore
git commit -q -m "chore: ignore local files and stop tracking build.log"

# 6. Ответы на вопросы об истории: кто и когда добавил MAX_NOTES
hash=$(git log -S MAX_NOTES --format=%h --reverse | head -n 1)
author=$(git log -S MAX_NOTES --format=%an --reverse | head -n 1)
printf 'introduced: %s\\nauthor: %s\\n' "$hash" "$author" > answers.txt
git add answers.txt
git commit -q -m "docs: record history answers"`, { filename: "solution.sh", lineNumbers: true }),
    ul(
      "**Шаг 1:** `commit --amend -m` меняет только сообщение — индекс пуст, поэтому лишнего в коммит не попадает; хэши коммитов 1–5 остаются прежними.",
      "**Шаг 2:** строка `DEBUG` удалена до `git add app.js`, поэтому коммит содержит только `--json`. В интерактивном варианте то же делает `git add -p` (второй фрагмент) и затем `git restore app.js`.",
      "**Шаг 3:** `git restore config.json` возвращает файл к версии из индекса.",
      "**Шаг 5:** `git rm --cached build.log` убирает файл из индекса, не трогая диск; правила `.gitignore` не дают снова добавить лог. Секрет `.env` игнорируется с самого начала.",
      "**Шаг 6:** `git log -S MAX_NOTES --format=%h --reverse` выводит один коммит — единственный, где число вхождений изменилось; его автор — Carol Ops.",
    ),
    h("check.mjs"),
    code("js", `#!/usr/bin/env node
// check.mjs <каталог репозитория> — проверка проекта 1 «Привести рабочий каталог в порядок»
// Требуется Node.js 18+ и git; проверка только читает репозиторий.
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

const BASE = ["feat: add notes CLI skeleton", "feat: save notes to config", "chore: add build log", "feat: limit number of notes", "docs: describe commands in README"];
const CONVENTIONAL = /^(feat|fix|docs|chore|refactor|test|style|perf|build|ci)(\\([^)]+\\))?!?: \\S.*$/;
const has = (p) => existsSync(join(ROOT, p));
const find = (subject) => git(["log", "--format=%H", "-n1", "--fixed-strings", \`--grep=\${subject}\`]).out;
const filesOf = (c) => lines(git(["diff-tree", "--no-commit-id", "--name-only", "-r", "--root", c]).out);
const ignored = (p) => git(["check-ignore", "-q", p]).ok;
const category = (f) => (f === "app.js" || f === "config.json" ? "код" : f.startsWith("docs/") || f === "README.md" || f === "answers.txt" ? "документация" : "служебные");

const subjects = lines(git(["log", "--reverse", "--format=%s"]).out);
const c2 = find("feat: save notes to config");
const c5 = find("docs: describe commands in README");
const fresh = c5 ? lines(git(["rev-list", "--reverse", \`\${c5}..HEAD\`]).out) : [];
const mine = fresh.slice(1); // первый — переписанный коммит коллеги, остальные — ваши
const introducing = lines(git(["log", "-S", "MAX_NOTES", "--format=%H", "--reverse"]).out)[0];
const answers = has("answers.txt") ? read(join(ROOT, "answers.txt")) : "";
const answer = (key) => (answers.match(new RegExp(\`^\${key}:\\\\s*(.+)$\`, "m")) ?? [])[1]?.trim() ?? "";

check("история коллег на месте: первые 5 коммитов не изменены", () => [BASE.every((s, i) => subjects[i] === s), subjects.slice(0, 5).join(" | ")]);
check("опечатка исправлена: шестой коммит: «fix: handle empty note»", () => [subjects[5] === "fix: handle empty note", subjects[5]]);
check("коммит с опечаткой переписан, а не продублирован", () => !subjects.some((s) => s.includes("handel")) && subjects.filter((s) => /empty note/.test(s)).length === 1);
check("рабочее дерево чистое (нет изменённых и неотслеживаемых файлов)", () => [git(["status", "--porcelain"]).out === "", git(["status", "--porcelain"]).out.split("\\n").join(", ")]);
check(".gitignore добавлен в репозиторий", () => git(["ls-files", ".gitignore"]).out === ".gitignore");
for (const f of [".env", "notes.log", "tmp/cache.json", "dist/bundle.js"]) check(\`игнорируется: \${f}\`, () => has(f) && ignored(f));
check("нужные файлы не игнорируются (app.js, README.md, config.json, docs/usage.md)", () => ["app.js", "README.md", "config.json", "docs/usage.md"].every((f) => !ignored(f)));
check("build.log больше не отслеживается", () => git(["ls-files", "build.log"]).out === "");
check("build.log остался на диске (удалили из индекса, а не с диска)", () => has("build.log"));
check("удаление build.log из индекса записано коммитом", () => lines(git(["log", "--diff-filter=D", "--format=%H", "--", "build.log"]).out).length === 1);
check(".env не попал ни в один коммит", () => git(["log", "--all", "--format=%H", "--", ".env"]).out === "" && git(["ls-files", ".env"]).out === "");
check("config.json совпадает с версией из истории (случайная правка отброшена)", () => has("config.json") && read(join(ROOT, "config.json")) === git(["show", \`\${c2}:config.json\`]).out + "\\n" && git(["show", "HEAD:config.json"]).out === git(["show", \`\${c2}:config.json\`]).out);
check("в app.js есть вывод --json", () => has("app.js") && read(join(ROOT, "app.js")).includes("--json"));
check("в app.js нет отладочной строки DEBUG", () => has("app.js") && !read(join(ROOT, "app.js")).includes("DEBUG"));
check("--json закоммичен отдельно: коммит «feat» меняет только app.js и не содержит DEBUG", () => {
  const c = mine.find((x) => git(["show", \`\${x}:app.js\`]).out.includes("--json"));
  if (!c) return [false, "нет коммита с функцией --json"];
  const f = filesOf(c);
  return [/^feat/.test(git(["log", "-1", "--format=%s", c]).out) && f.length === 1 && f[0] === "app.js" && !git(["show", \`\${c}:app.js\`]).out.includes("DEBUG"), \`\${f.join(", ")}\`];
});
check("docs/usage.md добавлен коммитом, который не затрагивает другие файлы", () => {
  const c = git(["log", "--diff-filter=A", "--format=%H", "-n1", "--", "docs/usage.md"]).out;
  if (!c) return [false, "docs/usage.md не закоммичен"];
  return [filesOf(c).length === 1, filesOf(c).join(", ")];
});
check("все новые коммиты оформлены по Conventional Commits", () => {
  const bad = fresh.map((c) => git(["log", "-1", "--format=%s", c]).out).filter((s) => !CONVENTIONAL.test(s));
  return [fresh.length > 1 && bad.length === 0, bad.join(" | ") || "новых коммитов нет"];
});
check("ни один ваш коммит не смешивает код, документацию и служебные файлы", () => {
  const mixed = mine.filter((c) => new Set(filesOf(c).map(category)).size > 1);
  return [mine.length >= 4 && mixed.length === 0, \`коммитов: \${mine.length}, смешанных: \${mixed.length}\`];
});
check("answers.txt закоммичен", () => git(["ls-files", "answers.txt"]).out === "answers.txt");
check("introduced: указан коммит, в котором появилась константа MAX_NOTES", () => {
  const h = answer("introduced");
  if (h.length < 7) return [false, "нет строки «introduced: <хэш>»"];
  const full = git(["rev-parse", "--verify", \`\${h}^{commit}\`]).out;
  return [full === introducing, \`получено \${h}\`];
});
check("author: указан автор этого коммита", () => [answer("author") === git(["log", "-1", "--format=%an", introducing]).out, answer("author")]);

summary();`, { filename: "check.mjs", collapsed: true }),
    code("text", `✓ история коллег на месте: первые 5 коммитов не изменены
✓ опечатка исправлена: шестой коммит: «fix: handle empty note»
✓ коммит с опечаткой переписан, а не продублирован
✓ рабочее дерево чистое (нет изменённых и неотслеживаемых файлов)
✓ .gitignore добавлен в репозиторий
✓ игнорируется: .env
✓ игнорируется: notes.log
✓ игнорируется: tmp/cache.json
✓ игнорируется: dist/bundle.js
✓ нужные файлы не игнорируются (app.js, README.md, config.json, docs/usage.md)
✓ build.log больше не отслеживается
✓ build.log остался на диске (удалили из индекса, а не с диска)
✓ удаление build.log из индекса записано коммитом
✓ .env не попал ни в один коммит
✓ config.json совпадает с версией из истории (случайная правка отброшена)
✓ в app.js есть вывод --json
✓ в app.js нет отладочной строки DEBUG
✓ --json закоммичен отдельно: коммит «feat» меняет только app.js и не содержит DEBUG
✓ docs/usage.md добавлен коммитом, который не затрагивает другие файлы
✓ все новые коммиты оформлены по Conventional Commits
✓ ни один ваш коммит не смешивает код, документацию и служебные файлы
✓ answers.txt закоммичен
✓ introduced: указан коммит, в котором появилась константа MAX_NOTES
✓ author: указан автор этого коммита

Пройдено проверок: 24 из 24`, { filename: "результат node check.mjs (эталонное решение, git 2.43.0)" }),
    code("text", `✓ история коллег на месте: первые 5 коммитов не изменены
✗ опечатка исправлена: шестой коммит: «fix: handle empty note» — fix: handel empty note
✗ коммит с опечаткой переписан, а не продублирован
✗ рабочее дерево чистое (нет изменённых и неотслеживаемых файлов) —  M app.js,  M config.json, ?? .env, ?? dist/, ?? docs/, ?? notes.log, ?? tmp/
✗ .gitignore добавлен в репозиторий
✗ игнорируется: .env
✗ игнорируется: notes.log
✗ игнорируется: tmp/cache.json
✗ игнорируется: dist/bundle.js
✓ нужные файлы не игнорируются (app.js, README.md, config.json, docs/usage.md)
✗ build.log больше не отслеживается
✓ build.log остался на диске (удалили из индекса, а не с диска)
✗ удаление build.log из индекса записано коммитом
✓ .env не попал ни в один коммит
✗ config.json совпадает с версией из истории (случайная правка отброшена)
✓ в app.js есть вывод --json
✗ в app.js нет отладочной строки DEBUG
✗ --json закоммичен отдельно: коммит «feat» меняет только app.js и не содержит DEBUG — нет коммита с функцией --json
✗ docs/usage.md добавлен коммитом, который не затрагивает другие файлы — docs/usage.md не закоммичен
✗ все новые коммиты оформлены по Conventional Commits — новых коммитов нет
✗ ни один ваш коммит не смешивает код, документацию и служебные файлы — коммитов: 0, смешанных: 0
✗ answers.txt закоммичен
✗ introduced: указан коммит, в котором появилась константа MAX_NOTES — нет строки «introduced: <хэш>»
✗ author: указан автор этого коммита

Пройдено проверок: 5 из 24`, { filename: "результат для заготовки (сразу после setup.sh)" }),
    code("text", `заготовка — 5 из 24 (красных: 19; первая: опечатка исправлена: шестой коммит: «fix: handle empty note»)
эталонное решение — 24 из 24
b1: нет .gitignore — 18 из 24 (красных: 6; первая: рабочее дерево чистое (нет изменённых и неотслеживаемых файлов))
b2: всё одним коммитом «update» — 14 из 24 (красных: 10; первая: игнорируется: .env)
b3: .env попал в историю — 23 из 24 (красных: 1; первая: .env не попал ни в один коммит)
b4: build.log удалён с диска (git rm без --cached) — 23 из 24 (красных: 1; первая: build.log остался на диске (удалили из индекса, а не с диска))
b5: правка config.json закоммичена — 22 из 24 (красных: 2; первая: config.json совпадает с версией из истории (случайная правка отброшена))
b6: в ответе хэш не того коммита — 23 из 24 (красных: 1; первая: introduced: указан коммит, в котором появилась константа MAX_NOTES)
b7: опечатка в сообщении не исправлена — 22 из 24 (красных: 2; первая: опечатка исправлена: шестой коммит: «fix: handle empty note»)
b8: отладочная строка DEBUG попала в коммит — 22 из 24 (красных: 2; первая: в app.js нет отладочной строки DEBUG)`, { filename: "результаты check.mjs для вариантов с ошибками" }),
    tip("Проверка не меняет ваш репозиторий: она запускает только читающие команды Git. Аргумент — путь к репозиторию (по умолчанию текущий каталог)."),
    warn("Хэши и дата коммитов коллег одинаковы у всех благодаря `setup.sh`, а ваши — нет, поэтому проверка опирается на сообщения и состав коммитов, а не на хэши."),
  ],
};
