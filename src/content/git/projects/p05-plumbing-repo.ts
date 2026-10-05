import type { Project } from "../../types";
import { code, h, p, table, tip, ul, warn } from "../../dsl";

export const p05PlumbingRepo: Project = {
  id: "git.p05-plumbing-repo",
  domain: "git",
  order: 5,
  title: "Репозиторий руками: blob, tree, commit и tag без git add и git commit",
  subtitle: "Собрать два коммита, общее поддерево и аннотированный тег командами plumbing и получить те же хэши, что у эталона: 15 проверок на git 2.43.0",
  level: "advanced",
  estimatedHours: 4,
  buildsOn: ["git.p04-history-rescue"],
  topics: [
    "git.objects-content-addressing",
    "git.refs-packfiles-gc",
    "git.git-mental-model",
    "git.three-areas",
    "git.releases-tags",
  ],
  objective:
    "Убедиться, что Git — это **хранилище объектов, адресуемых по содержимому, плюс ссылки на них**, собрав репозиторий вручную низкоуровневыми командами: `hash-object -w` создаёт blob, `update-index --cacheinfo` заполняет индекс, `write-tree` превращает индекс в деревья, `commit-tree` создаёт коммиты, `update-ref` двигает ветку, `tag -a` создаёт объект-тег. Результат проверяется не «на глаз», а **по хэшам**: при одинаковых файлах, личности и времени у всех получаются одни и те же идентификаторы коммитов. Проект про устройство Git изнутри: почему одинаковые файлы хранятся один раз, почему неизменённая папка не копируется между коммитами и что именно хранит тег.",
  scenario: [
    p("`setup.sh` подготавливает материалы: каталоги `files/v1` и `files/v2` с исходными файлами, файл `env.sh` (личность автора и функция `stamp` для времени) и **пустой** каталог `repo/`. Репозиторий вы создаёте сами — только командами «водопровода» (plumbing), без `git add` и `git commit`. Нужно получить такую историю:"),
    ul(
      "**Коммит 1 «Initial commit»** (корневой, время `1736931600`): `hello.txt` и `copy.txt` с одинаковым содержимым `hello`, исполняемый `bin/run.sh` (режим `100755`), `docs/readme.md`;",
      "**Коммит 2 «Update hello, add guide»** (родитель — коммит 1, время `1736935200`): `hello.txt` теперь `hello, world`, добавлен `docs/guide.md`; `copy.txt` и `bin/` не менялись;",
      "**Ветка `main`** указывает на коммит 2, `HEAD` — на `main`;",
      "**Аннотированный тег `v1`** («Release v1», время `1736938800`) на коммите 1.",
    ),
    p("Файлы `files/v1` и `files/v2` лежат рядом — читайте содержимое оттуда (`git hash-object -w <файл>`). `check.mjs` проверяет **15 фактов**: структуру деревьев, режимы файлов, совпадение хэшей с эталоном, число объектов, целостность (`git fsck --strict`) и три ответа в `answers.txt`. Нужны `git` 2.32+ и Node.js 18+."),
    code("bash", `mkdir -p ~/devdock-git && cd ~/devdock-git
# сохраните setup.sh и check.mjs из этой страницы в текущую папку
bash setup.sh ~/devdock-git/p05        # материалы: files/, env.sh, пустой repo/
cd ~/devdock-git/p05
source env.sh                          # личность и функция stamp (глобальные настройки Git в этой оболочке отключены)
cd repo && git init -b main            # дальше — только plumbing
# ...когда закончите, из каталога ~/devdock-git:
node check.mjs ~/devdock-git/p05`, { filename: "порядок работы" }),
    code("bash", `#!/usr/bin/env bash
# setup.sh <каталог> — готовит материалы проекта: files/v1, files/v2 (исходные файлы), env.sh (личность и время) и пустой каталог repo/.
# Репозиторий вы создадите сами — командами «водопровода» (plumbing).
set -e
W="\${1:?укажите каталог: bash setup.sh ~/devdock-git/p05}"
rm -rf "$W"; mkdir -p "$W"; cd "$W"
mkdir -p files/v1/bin files/v1/docs files/v2/docs repo
# версия 1: четыре файла, два из них с одинаковым содержимым
printf 'hello\\n' > files/v1/hello.txt
printf 'hello\\n' > files/v1/copy.txt
printf '#!/bin/sh\\necho run\\n' > files/v1/bin/run.sh; chmod +x files/v1/bin/run.sh
printf '# Demo\\n' > files/v1/docs/readme.md
# версия 2: изменён hello.txt и добавлен docs/guide.md
printf 'hello, world\\n' > files/v2/hello.txt
printf '# Guide\\n' > files/v2/docs/guide.md
# личность и время: чтобы у всех получились одинаковые хэши коммитов; глобальные настройки Git в этой оболочке отключаются
cat > env.sh <<'EOT'
# source env.sh — личность и время для воспроизводимых хэшей
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null
export GIT_AUTHOR_NAME="Alice Dev" GIT_AUTHOR_EMAIL="alice@example.com"
export GIT_COMMITTER_NAME="Alice Dev" GIT_COMMITTER_EMAIL="alice@example.com"
stamp() { export GIT_AUTHOR_DATE="$1 +0000" GIT_COMMITTER_DATE="$1 +0000"; }   # stamp 1736931600
EOT
echo "Материалы созданы: $W (исходные файлы — files/, ваш репозиторий — repo/)"`, { filename: "setup.sh", collapsed: true }),
    table(
      ["Шаг", "Команды", "Что создаётся"],
      [
        ["1. Содержимое", "`git hash-object -w <файл>`", "blob; хэш печатается и записывается в `.git/objects`"],
        ["2. Индекс", "`git update-index --add --cacheinfo <режим>,<хэш>,<путь>`", "строки индекса: режим `100644` или `100755`, хэш blob, путь"],
        ["3. Деревья", "`git write-tree`", "деревья корня и подпапок; печатает хэш корня"],
        ["4. Коммиты", "`stamp <время>`, затем `git commit-tree <дерево> [-p <родитель>] -m \"…\"`", "объект commit; хэш печатается"],
        ["5. Ветка", "`git update-ref refs/heads/main <коммит>`", "файл ссылки `refs/heads/main`"],
        ["6. Тег", "`stamp <время>`, затем `git tag -a v1 -m \"Release v1\" <коммит 1>`", "объект tag и ссылка `refs/tags/v1`"],
        ["7. Ответы", "`git cat-file --batch-all-objects --batch-check`, `git ls-tree -r`", "`answers.txt`: `objects:`, `unique-blobs:`, `bin-tree:`"],
      ],
      "План",
    ),
    tip("Время и личность влияют на хэш коммита: поэтому нужны `env.sh` и `stamp`. Сообщения коммитов — ровно как в задании. После `git init` рабочий каталог пуст: `git status` покажет все файлы удалёнными, потому что индекс и коммиты вы заполнили в обход рабочего дерева. Это нормально."),
  ],
  requirements: [
    "`HEAD` указывает на `refs/heads/main`; `main` — коммит `Update hello, add guide` с одним родителем.",
    "Родитель — корневой коммит `Initial commit` (без родителей).",
    "Дерево первого коммита содержит ровно четыре файла: `hello.txt`, `copy.txt`, `bin/run.sh`, `docs/readme.md`; `bin/run.sh` — режим `100755`, остальные — `100644`.",
    "`hello.txt` и `copy.txt` первого коммита ссылаются на **один и тот же blob** с содержимым `hello`.",
    "Во втором коммите `hello.txt` содержит `hello, world`, `copy.txt` — прежний blob, `docs/guide.md` содержит `# Guide`.",
    "Поддерево `bin` в обоих коммитах — один и тот же объект (хэш совпадает).",
    "Тег `v1` — объект типа `tag`, указывающий на первый коммит.",
    "Хэши обоих коммитов и тега совпадают с эталоном; в репозитории **ровно 13 объектов** (5 blob, 5 tree, 2 commit, 1 tag); `git fsck --strict` молчит.",
    "`answers.txt`: `objects:` — число объектов, `unique-blobs:` — число различных blob в первом коммите, `bin-tree:` — хэш (не короче семи знаков) общего поддерева `bin`.",
  ],
  constraints: [
    "Только plumbing (`hash-object`, `update-index`, `write-tree`, `commit-tree`, `update-ref`, `tag`, `cat-file`, `ls-tree`, `rev-parse`): без `git add`, `git commit`, `git checkout`, `git merge`. Проверка не отличает способ создания, но смысл проекта — именно в нём.",
    "Нельзя править файлы в `.git/` руками (кроме того, что делают команды Git).",
    "Не создавайте лишних объектов: каждый `hash-object -w` для ненужного файла остаётся в хранилище и сломает подсчёт.",
    "Материалы (`files/`, `env.sh`) не изменять: от их содержимого зависят хэши.",
  ],
  expected: [
    "`node check.mjs ~/devdock-git/p05` печатает `Пройдено проверок: 15 из 15`.",
    "Заготовка (пустой `repo/`) проходит 0 проверок из 15.",
    "Каждый из восьми «плохих» вариантов проваливает от 1 до 12 проверок, результат стабилен при повторных запусках.",
    "В эталоне 13 объектов: blob «hello\\n» — 6 байт (`ce01362…`), коммит 1 — 173 байта, коммит 2 — 230 байт; после `git gc` те же 13 объектов лежат в одном pack-файле (`count: 0`, `in-pack: 13`, `packs: 1`). Полная проверка занимает около 0,2 секунды.",
  ],
  technical: [
    "**Адрес объекта — хэш его содержимого.** Для blob это SHA-1 от заголовка `blob <размер>\\0` и байтов файла; одинаковые файлы дают один объект. Поэтому `hello.txt` и `copy.txt` — один blob, а девять записей о файлах в двух коммитах (4 + 5) ссылаются всего на пять blob.",
    "**Tree — список записей** `режим тип хэш имя`. Режим `100644` — обычный файл, `100755` — исполняемый, `040000` — подпапка. Дерево подпапки — отдельный объект, поэтому неизменённая подпапка (`bin`) в новом коммите — тот же самый объект: `write-tree` второго коммита пересчитывает только изменённые ветви.",
    "**Индекс как промежуточная площадка.** `update-index --cacheinfo` записывает в индекс режим, хэш и путь **без файла в рабочем каталоге**; `write-tree` строит деревья из индекса. Во втором коммите в индексе меняют только две записи.",
    "**Commit** — это ссылка на корневое дерево, список родителей, автор и коммиттер с временем, сообщение. Любое отличие (имя, время, сообщение) — другой хэш; поэтому нужны `env.sh` и `stamp`. `commit-tree` объект создаёт, но **не двигает ветку**: это делает `update-ref`.",
    "**Ссылки.** Ветка `refs/heads/main` — файл с хэшем коммита, `HEAD` — символическая ссылка на ветку. Именно движение ссылки превращает набор объектов в «историю».",
    "**Аннотированный тег** — отдельный объект `tag` с адресатом (`object`, `type`), именем, автором тега и сообщением; ссылка `refs/tags/v1` указывает на него, а не на коммит (`v1^{commit}` — «снять» тег). Лёгкий тег — просто ссылка на коммит.",
    "**Контроль целостности.** `git fsck --strict` проверяет формат и связность объектов; объект, на который ничто не ссылается, будет назван `dangling`/`unreachable` — так выглядит «лишний» `hash-object -w`.",
  ],
  acceptance: [
    "`node check.mjs ~/devdock-git/p05` — 15 из 15.",
    "`git log --oneline --decorate` показывает два коммита и тег `v1` у первого; `git cat-file -p main` печатает дерево, родителя, автора и сообщение.",
    "`git cat-file --batch-all-objects --batch-check` перечисляет 13 объектов, `git fsck --strict` ничего не выводит.",
    "Вы можете объяснить, почему поддерево `bin` в двух коммитах — один объект и почему хэши коммитов зависят от времени.",
  ],
  hints: [
    "`git hash-object -w <файл>` печатает хэш: сохраняйте его в переменную (`hello=$(git hash-object -w ../files/v1/hello.txt)`).",
    "Для `copy.txt` хэш получится тот же, что для `hello.txt`: новый объект Git не создаст — проверьте `git count-objects` или `--batch-check`.",
    "Запись индекса: `git update-index --add --cacheinfo 100644,$hello,hello.txt` (три значения через запятую); для `bin/run.sh` режим `100755`.",
    "`git write-tree` печатает хэш корневого дерева; `git cat-file -p <дерево>` покажет записи, `git ls-tree -r <коммит>` — все файлы.",
    "Перед `commit-tree` задайте время: `stamp 1736931600`. Родитель добавляется ключом `-p <хэш>`; у первого коммита его нет.",
    "Если хэш коммита «не тот», сравните `git cat-file -p <коммит>` с эталоном: чаще всего дело в сообщении, времени или режиме `100755`.",
    "Во втором коммите достаточно заново записать в индекс `hello.txt` и добавить `docs/guide.md`; остальные записи индекса уже на месте.",
    "Ответы: `objects` — число строк `git cat-file --batch-all-objects --batch-check`; `unique-blobs` — число различных хэшей blob в `git ls-tree -r <коммит 1>`; `bin-tree` — `git rev-parse <коммит 1>:bin`.",
  ],
  advanced: [
    "Создайте коммит 2 **без** `update-index`: сначала `git read-tree <коммит 1>`, и объясните, чем это отличается.",
    "Заполните рабочее дерево командой `git restore .` (или `git reset --hard`) и убедитесь, что `git status` стал чистым; какие объекты при этом создались?",
    "Запустите `git gc` и сравните `git count-objects -v` до и после (в эталоне: `count: 13` → `count: 0`, `in-pack: 13`, `packs: 1`); посмотрите содержимое pack-файла командой `git verify-pack -v`.",
    "Создайте тег «вручную»: `git mktag` и `git update-ref refs/tags/v1-manual`; сравните хэш с тегом, созданным `git tag -a`.",
    "Посчитайте SHA-1 blob самостоятельно: `printf 'blob 6\\0hello\\n' | sha1sum` — и сравните с `git hash-object`.",
    "Измените время в `stamp` на одну секунду и посмотрите, как поменяются хэши обоих коммитов и всех следующих.",
  ],
  failureModes: [
    "**`bin/run.sh` записан как `100644`:** дерево `bin` и все коммиты получают другие хэши; исполняемость потеряна (2 красные из 15: режимы и совпадение хэшей).",
    "**Забыт `copy.txt`:** дерево неполное, нет общего blob, хэши отличаются (4 красные).",
    "**Второй коммит без родителя (`-p` не указан):** история из двух корневых коммитов, ветка `main` не ведёт к первому (11 красных).",
    "**Лёгкий тег вместо аннотированного:** `refs/tags/v1` указывает прямо на коммит, объекта `tag` нет, в репозитории 12 объектов (3 красные).",
    "**Лишний объект:** `hash-object -w` для постороннего файла: объектов 14, `git fsck` сообщает о висячем объекте (2 красные).",
    "**Ветка `main` не передвинута на второй коммит:** второй коммит существует, но недостижим (12 красных).",
    "**Другое сообщение первого коммита:** меняется его хэш, а за ним — хэш второго (2 красные).",
    "**Неверный подсчёт различных blob в ответе:** четыре записи вместо трёх различных blob (1 красная).",
  ],
  rubric: [
    { criterion: "Корректность объектов", weight: 30, description: "Blob, tree, commit и tag созданы правильно: содержимое, режимы, структура вложенных деревьев, родитель, сообщения." },
    { criterion: "Понимание адресации по содержимому", weight: 25, description: "Общий blob для одинаковых файлов, общее поддерево `bin`, число объектов 13, объяснение зависимости хэша от данных, времени и сообщения." },
    { criterion: "Ссылки и теги", weight: 15, description: "`main` и `HEAD` настроены, аннотированный тег указывает на первый коммит, различие с лёгким тегом понятно." },
    { criterion: "Целостность и чистота", weight: 15, description: "`git fsck --strict` без замечаний, лишних объектов нет, материалы не изменены." },
    { criterion: "Ответы и самопроверка", weight: 15, description: "Верные `objects`, `unique-blobs`, `bin-tree`; результат проверен `cat-file`, `ls-tree`, 15 из 15." },
  ],
  solution: [
    p("Эталон — скрипт из 40 строк: он создаёт репозиторий только командами plumbing и проходит все 15 проверок; заготовка (пустой `repo/`) не проходит ни одной, а каждый из восьми намеренно испорченных вариантов проходит от 3 до 14 проверок из 15. Ниже — решение, проверяющий скрипт и результаты запусков на git 2.43.0."),
    h("solution.sh"),
    code("bash", `#!/usr/bin/env bash
# solution.sh <каталог> — эталонное решение: репозиторий собирается только командами plumbing
set -e
W="$(cd "\${1:?укажите каталог}" && pwd)"
source "$W/env.sh"
cd "$W/repo"
git init -q -b main

# --- первый коммит: четыре файла, два из них — один и тот же blob ---
hello=$(git hash-object -w ../files/v1/hello.txt)       # blob «hello\\n»
copy=$(git hash-object -w ../files/v1/copy.txt)         # то же содержимое — тот же хэш, новый объект не создаётся
run=$(git hash-object -w ../files/v1/bin/run.sh)
readme=$(git hash-object -w ../files/v1/docs/readme.md)
git update-index --add --cacheinfo 100644,$hello,hello.txt
git update-index --add --cacheinfo 100644,$copy,copy.txt
git update-index --add --cacheinfo 100755,$run,bin/run.sh
git update-index --add --cacheinfo 100644,$readme,docs/readme.md
tree1=$(git write-tree)                                  # три дерева: корень, bin, docs
stamp 1736931600
c1=$(git commit-tree "$tree1" -m "Initial commit")
git update-ref refs/heads/main "$c1"

# --- второй коммит: новый hello.txt и docs/guide.md; bin не менялся ---
hello2=$(git hash-object -w ../files/v2/hello.txt)
guide=$(git hash-object -w ../files/v2/docs/guide.md)
git update-index --cacheinfo 100644,$hello2,hello.txt
git update-index --add --cacheinfo 100644,$guide,docs/guide.md
tree2=$(git write-tree)                                  # поддерево bin — прежний объект
stamp 1736935200
c2=$(git commit-tree "$tree2" -p "$c1" -m "Update hello, add guide")
git update-ref refs/heads/main "$c2"

# --- аннотированный тег на первом коммите ---
stamp 1736938800
git tag -a v1 -m "Release v1" "$c1"

# --- ответы ---
printf 'objects: %s\\nunique-blobs: %s\\nbin-tree: %s\\n' \\
  "$(git cat-file --batch-all-objects --batch-check | wc -l | tr -d ' ')" \\
  "$(git ls-tree -r "$c1" | grep ' blob ' | awk '{print $3}' | sort -u | wc -l | tr -d ' ')" \\
  "$(git rev-parse --short "$c1:bin")" > "$W/answers.txt"`, { filename: "solution.sh", lineNumbers: true }),
    ul(
      "**Blob и индекс.** Четыре `hash-object -w` создают три объекта: для `copy.txt` получается тот же хэш `ce01362…`, что и для `hello.txt`. `update-index --cacheinfo` записывает четыре строки индекса.",
      "**Деревья.** `write-tree` создаёт три дерева: корень, `bin` и `docs`. Во втором `write-tree` создаются только новые корень и `docs`: поддерево `bin` (`ab9886a`) остаётся прежним объектом.",
      "**Коммиты.** `commit-tree` создаёт объекты, `update-ref` двигает `main`. Время задано `stamp`, поэтому хэши коммитов воспроизводимы: у всех, кто выполнил проект без отклонений, это `ca13f89…` и `8ba8163…`.",
      "**Тег.** `git tag -a` создаёт объект `tag` (133 байта) и ссылку `refs/tags/v1`; `git cat-file -p v1` печатает `object`, `type commit`, `tag`, `tagger` и сообщение.",
      "**Подсчёт.** 5 blob + 5 tree + 2 commit + 1 tag = 13 объектов; в первом коммите четыре файла указывают на три разных blob (`unique-blobs: 3`).",
    ),
    h("check.mjs"),
    code("js", `#!/usr/bin/env node
// check.mjs <каталог> — проверка проекта 5 «Репозиторий руками». Каталог — тот, что создал setup.sh
// (внутри repo/ — ваш репозиторий, рядом answers.txt). Требуется Node.js 18+ и git; проверка только читает.
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

const W = ROOT, REPO = join(W, "repo");
const g = (a) => git(a, REPO);
// Эталонные хэши: при одинаковых данных, личности и времени они одинаковы у всех
const REF = { c1: "ca13f892d13cf3d27b6d6d9b04929926a790bdb2", c2: "8ba81637a71920457db8975ff87d2224492d3a6a", tag: "40f3a07725af1767c877ff9be9b58dd5414d2b06" };
const isRepo = existsSync(join(REPO, ".git")) || existsSync(join(REPO, "HEAD"));
const rev = (r) => (isRepo ? g(["rev-parse", "--verify", "-q", r]).out : "");
const type = (o) => (o ? g(["cat-file", "-t", o]).out : "");
const subject = (c) => (c ? g(["log", "-1", "--format=%s", c]).out : "");
const parents = (c) => (c ? lines(g(["rev-list", "--parents", "-n1", c]).out.split(" ").slice(1).join("\\n")) : []);
const tree = (c) => (c ? Object.fromEntries(lines(g(["ls-tree", "-r", "-t", c]).out).map((l) => { const [meta, path] = l.split("\\t"); const [mode, kind, id] = meta.split(" "); return [path, { mode, kind, id }]; })) : {});
const blob = (o) => (o ? g(["cat-file", "blob", o]).out : undefined);
const answers = existsSync(join(W, "answers.txt")) ? read(join(W, "answers.txt")) : "";
const answer = (k) => (answers.match(new RegExp(\`^\${k}:\\\\s*(\\\\S.*?)\\\\s*$\`, "m")) ?? [])[1] ?? "";
const objects = isRepo ? lines(g(["cat-file", "--batch-all-objects", "--batch-check"]).out) : [];
const C2 = rev("main"), C1 = rev("main~1"); // ваши второй и первый коммиты
const t1 = tree(C1), t2 = tree(C2);

check("репозиторий создан, HEAD указывает на ветку main", () => isRepo && g(["symbolic-ref", "HEAD"]).out === "refs/heads/main");
check("main: второй коммит «Update hello, add guide» с единственным родителем", () => [C2 !== "" && subject(C2) === "Update hello, add guide" && parents(C2).length === 1, C2 ? \`\${subject(C2)}, родителей: \${parents(C2).length}\` : "ветка main не создана"]);
check("родитель: корневой коммит «Initial commit» (родителей нет)", () => [C1 !== "" && subject(C1) === "Initial commit" && parents(C1).length === 0, C1 ? \`\${subject(C1)}, родителей: \${parents(C1).length}\` : "первый коммит не найден"]);
check("дерево первого коммита: hello.txt, copy.txt, bin/run.sh, docs/readme.md, без лишнего", () => { const f = Object.keys(t1).filter((p) => t1[p].kind === "blob").sort().join(); return [f === "bin/run.sh,copy.txt,docs/readme.md,hello.txt", f || "нет коммита"]; });
check("bin/run.sh записан с правами 100755, остальные файлы: 100644", () => t1["bin/run.sh"]?.mode === "100755" && ["copy.txt", "docs/readme.md", "hello.txt"].every((p) => t1[p]?.mode === "100644"));
check("hello.txt и copy.txt первого коммита: один и тот же blob с содержимым «hello»", () => t1["hello.txt"] !== undefined && t1["hello.txt"].id === t1["copy.txt"]?.id && blob(t1["hello.txt"].id) === "hello");
check("второй коммит: hello.txt обновлён, copy.txt прежний, добавлен docs/guide.md", () => blob(t2["hello.txt"]?.id) === "hello, world" && t2["copy.txt"]?.id === t1["copy.txt"]?.id && blob(t2["docs/guide.md"]?.id) === "# Guide");
check("поддерево bin в двух коммитах: один и тот же объект (общее не копируется)", () => [t1.bin !== undefined && t1.bin.id === t2.bin?.id, \`\${t1.bin?.id?.slice(0, 7)} / \${t2.bin?.id?.slice(0, 7)}\`]);
check("аннотированный тег v1: объект типа tag, указывающий на первый коммит", () => { const t = rev("refs/tags/v1"); return [type(t) === "tag" && rev("v1^{commit}") === C1 && C1 !== "", type(t) || "тег v1 не создан"]; });
check("хэши обоих коммитов и тега совпадают с эталоном (те же данные → те же хэши)", () => [C1 === REF.c1 && C2 === REF.c2 && rev("refs/tags/v1") === REF.tag, \`\${C1.slice(0, 7)} \${C2.slice(0, 7)} \${rev("refs/tags/v1").slice(0, 7)}\`]);
check("в репозитории ровно 13 объектов: 5 blob, 5 tree, 2 commit, 1 tag", () => { const n = (t) => objects.filter((l) => l.split(" ")[1] === t).length; return [objects.length === 13, \`blob \${n("blob")}, tree \${n("tree")}, commit \${n("commit")}, tag \${n("tag")}\`]; });
check("\`git fsck --strict\` без замечаний (нет оборванных и недостижимых объектов)", () => { const r = g(["fsck", "--strict", "--no-reflogs"]); return [isRepo && r.ok && r.out === "" && r.err === "", (r.out + " " + r.err).trim().split("\\n")[0]]; });
check("answers.txt, objects: сколько всего объектов в репозитории", () => [answer("objects") === String(objects.length) && objects.length > 0, answer("objects") || "нет строки «objects: <число>»"]);
check("answers.txt, unique-blobs: сколько разных blob в первом коммите", () => { const u = new Set(Object.values(t1).filter((e) => e.kind === "blob").map((e) => e.id)).size; return [u > 0 && answer("unique-blobs") === String(u), answer("unique-blobs") || "нет строки «unique-blobs: <число>»"]; });
check("answers.txt, bin-tree: хэш общего поддерева bin (не короче 7 знаков)", () => { const h = answer("bin-tree"); return [h.length >= 7 && t1.bin !== undefined && t1.bin.id.startsWith(h.toLowerCase()), h || "нет строки «bin-tree: <хэш>»"]; });

summary();`, { filename: "check.mjs", collapsed: true }),
    code("text", `✓ репозиторий создан, HEAD указывает на ветку main
✓ main: второй коммит «Update hello, add guide» с единственным родителем
✓ родитель: корневой коммит «Initial commit» (родителей нет)
✓ дерево первого коммита: hello.txt, copy.txt, bin/run.sh, docs/readme.md, без лишнего
✓ bin/run.sh записан с правами 100755, остальные файлы: 100644
✓ hello.txt и copy.txt первого коммита: один и тот же blob с содержимым «hello»
✓ второй коммит: hello.txt обновлён, copy.txt прежний, добавлен docs/guide.md
✓ поддерево bin в двух коммитах: один и тот же объект (общее не копируется)
✓ аннотированный тег v1: объект типа tag, указывающий на первый коммит
✓ хэши обоих коммитов и тега совпадают с эталоном (те же данные → те же хэши)
✓ в репозитории ровно 13 объектов: 5 blob, 5 tree, 2 commit, 1 tag
✓ \`git fsck --strict\` без замечаний (нет оборванных и недостижимых объектов)
✓ answers.txt, objects: сколько всего объектов в репозитории
✓ answers.txt, unique-blobs: сколько разных blob в первом коммите
✓ answers.txt, bin-tree: хэш общего поддерева bin (не короче 7 знаков)

Пройдено проверок: 15 из 15`, { filename: "результат node check.mjs (эталонное решение, git 2.43.0)" }),
    code("text", `✗ репозиторий создан, HEAD указывает на ветку main
✗ main: второй коммит «Update hello, add guide» с единственным родителем — ветка main не создана
✗ родитель: корневой коммит «Initial commit» (родителей нет) — первый коммит не найден
✗ дерево первого коммита: hello.txt, copy.txt, bin/run.sh, docs/readme.md, без лишнего — нет коммита
✗ bin/run.sh записан с правами 100755, остальные файлы: 100644
✗ hello.txt и copy.txt первого коммита: один и тот же blob с содержимым «hello»
✗ второй коммит: hello.txt обновлён, copy.txt прежний, добавлен docs/guide.md
✗ поддерево bin в двух коммитах: один и тот же объект (общее не копируется) — undefined / undefined
✗ аннотированный тег v1: объект типа tag, указывающий на первый коммит — тег v1 не создан
✗ хэши обоих коммитов и тега совпадают с эталоном (те же данные → те же хэши) —   
✗ в репозитории ровно 13 объектов: 5 blob, 5 tree, 2 commit, 1 tag — blob 0, tree 0, commit 0, tag 0
✗ \`git fsck --strict\` без замечаний (нет оборванных и недостижимых объектов) — fatal: not a git repository (or any of the parent directories): .git
✗ answers.txt, objects: сколько всего объектов в репозитории — нет строки «objects: <число>»
✗ answers.txt, unique-blobs: сколько разных blob в первом коммите — нет строки «unique-blobs: <число>»
✗ answers.txt, bin-tree: хэш общего поддерева bin (не короче 7 знаков) — нет строки «bin-tree: <хэш>»

Пройдено проверок: 0 из 15`, { filename: "результат для заготовки (пустой repo/)" }),
    code("text", `заготовка — 0 из 15 (красных: 15; первая: репозиторий создан, HEAD указывает на ветку main)
эталонное решение — 15 из 15
b1: bin/run.sh записан без права исполнения (100644) — 13 из 15 (красных: 2; первая: bin/run.sh записан с правами 100755, остальные файлы: 100644)
b2: файл copy.txt забыт — 11 из 15 (красных: 4; первая: дерево первого коммита: hello.txt, copy.txt, bin/run.sh, docs/readme.md, без лишнего)
b3: второй коммит создан без родителя — 4 из 15 (красных: 11; первая: main: второй коммит «Update hello, add guide» с единственным родителем)
b4: вместо аннотированного тега — лёгкий — 12 из 15 (красных: 3; первая: аннотированный тег v1: объект типа tag, указывающий на первый коммит)
b5: в репозитории остался лишний «висящий» объект — 13 из 15 (красных: 2; первая: в репозитории ровно 13 объектов: 5 blob, 5 tree, 2 commit, 1 tag)
b6: ветка main не передвинута на второй коммит — 3 из 15 (красных: 12; первая: main: второй коммит «Update hello, add guide» с единственным родителем)
b7: в сообщении первого коммита другая надпись — 13 из 15 (красных: 2; первая: родитель: корневой коммит «Initial commit» (родителей нет))
b8: в ответе число разных blob посчитано без sort -u — 14 из 15 (красных: 1; первая: answers.txt, unique-blobs: сколько разных blob в первом коммите)`, { filename: "результаты check.mjs для вариантов с ошибками" }),
    tip("Проверка только читает репозиторий. Эталонные хэши зашиты в `check.mjs`; они одинаковы у всех, кто использует `env.sh` и сообщения из задания."),
    warn("Файл `env.sh` отключает глобальные настройки Git (`GIT_CONFIG_GLOBAL=/dev/null`) в той оболочке, где вы его выполнили `source`. Закройте её после проекта или откройте новую для повседневной работы."),
  ],
};
