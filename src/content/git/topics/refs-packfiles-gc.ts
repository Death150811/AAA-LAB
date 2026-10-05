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

export const refsPackfilesGc: Topic = {
  id: "git.refs-packfiles-gc",
  slug: "refs-packfiles-gc",
  domain: "git",
  module: "internals",
  title: "Ссылки, пакеты и сборка мусора",
  titleEn: "Refs, Packfiles and Garbage Collection",
  summary:
    "Ссылки (ветки, теги, HEAD) — единственное изменяемое в репозитории: имена, указывающие на объекты. Тема на опытах показывает, как устроены `refs/`, символические ссылки и `packed-refs`, чем достижимые объекты отличаются от недостижимых, как `git gc` упаковывает объекты в пакеты с дельтами (63 рыхлых объекта на 252 КиБ превращаются в один пакет на 8 КиБ), когда мусор удаляется и как эта механика связана с восстановлением потерянных коммитов.",
  minutes: 85,
  prerequisites: ["git.objects-content-addressing", "git.branches-head", "git.reset-revert-reflog"],
  tags: ["refs", "packed-refs", "symbolic-ref", "git gc", "packfile", "delta compression", "git repack", "git prune", "git fsck", "unreachable objects", "git count-objects", "git verify-pack", "reachability"],
  keyConcepts: [
    { term: "Ссылка — файл с хэшем", text: "`.git/refs/heads/main` и `refs/tags/v0.1` содержат хэш коммита; `refs/tags/v1.0` — хэш объекта тега (`09baef1`), который `rev-parse v1.0^{commit}` «очищает» до коммита (`c7c50eb`). `HEAD` в обычном режиме — символическая ссылка `ref: refs/heads/main`." },
    { term: "`packed-refs` и приоритет рыхлых ссылок", text: "`git pack-refs --all` перенёс ветки и теги в один файл; после нового коммита ветка снова лежит отдельным файлом и перекрывает запись `packed-refs`." },
    { term: "Достижимость определяет судьбу объекта", text: "После `branch -D` коммит (`a44913e`) не считается недостижимым, пока на него указывает reflog; с `--no-reflogs` `fsck` показал commit, tree и blob как `unreachable`." },
    { term: "Пакеты хранят похожие объекты разностями", text: "63 рыхлых объекта (21 версия файла по 31 992 байта) занимали `size: 252` КиБ; после `git gc` — один пакет, `size-pack: 8`: базовый blob 931 байт и дельты (в первых четырёх строках вывода по 40–59 байт) с цепочками до 9 звеньев." },
    { term: "Сборка мусора необратима, если убрать журнал", text: "`git reflog expire --expire=now --all` и `git gc --prune=now` удалили коммит безвозвратно: `cat-file` — `could not get object info`. По умолчанию недостижимые объекты хранятся не менее двух недель." },
  ],
  sections: [
    section("definition", [
      def("Ссылка (ref)", "Имя, указывающее на объект (обычно коммит): `refs/heads/main`, `refs/tags/v1.0`, `refs/remotes/origin/main`, `refs/stash`. Меняется командами `branch`, `tag`, `update-ref` и операциями, которые двигают ветки.", "reference"),
      def("Символическая ссылка", "Ссылка, указывающая не на объект, а на другую ссылку. Пример — `HEAD`: `ref: refs/heads/main`. Читается `git symbolic-ref HEAD`.", "symbolic reference"),
      def("packed-refs", "Файл `.git/packed-refs` — «упакованное» хранилище ссылок: одна строка «хэш имя» вместо отдельных файлов. Создаётся `git pack-refs` и сборкой мусора; рыхлая ссылка с тем же именем имеет приоритет.", "packed-refs"),
      def("Достижимый объект", "Объект, до которого можно дойти от какой-либо ссылки, индекса или записи журнала ссылок. Остальные — недостижимые: кандидаты на удаление сборкой мусора.", "reachable object"),
      def("Пакет (packfile)", "Файл `.git/objects/pack/pack-*.pack` с множеством объектов в сжатом виде, часть которых хранится как разности (дельты) относительно других, и индекс `.idx` для быстрого поиска.", "packfile"),
      def("Сборка мусора", "Команда `git gc`: упаковывает ссылки и объекты, очищает старые записи журнала ссылок и удаляет недостижимые объекты, старше срока хранения (по умолчанию две недели).", "garbage collection"),
    ]),

    section("why", [
      h("Откуда у репозитория размер и как он растёт"),
      p("Каждое изменение создаёт новые объекты, и без вмешательства они бы копились вечно — каждый как отдельный файл. Сборка мусора и упаковка решают две задачи: уменьшить размер (за счёт сжатия разностями) и убрать то, на что никто не ссылается."),
      ul(
        "**Скорость и размер.** Упакованные объекты читаются и передаются быстрее; репозиторий с историей в тысячи версий файла занимает мегабайты, а не гигабайты.",
        "**Сетевой обмен.** При `fetch` и `push` Git отправляет пакеты: не нужно пересылать объекты по одному.",
        "**Корректное восстановление.** Понимая, что удаляет `gc` и когда, вы знаете, сколько времени есть на спасение коммитов.",
        "**Диагностика.** `count-objects`, `verify-pack`, `fsck` объясняют, почему репозиторий «тяжёлый» или «повреждён».",
      ),
      tip("Обычно вручную запускать `git gc` не нужно: Git сам запускает `gc --auto` после некоторых команд, когда рыхлых объектов становится много. Знание механики нужно для диагностики и восстановления."),
    ]),

    section("mental-model", [
      h("Ссылки сверху, объекты снизу"),
      diagram(
        `
        ссылки (изменяемые имена)                       объекты (неизменяемые)

        HEAD ──► refs/heads/main ────────────► commit ──► tree ──► blob
                 refs/heads/feature/login ───►    │
                 refs/tags/v0.1 ──────────────►   ▼
                 refs/tags/v1.0 ──► tag-объект ► commit ...
                 refs/remotes/origin/main ────►   ...
                 reflog, индекс — тоже «корни»

        объект «жив», пока до него можно дойти от любого корня
        `,
        "Ссылки и журналы — «корни»: всё, до чего можно дойти от них, достижимо и сборкой мусора не удаляется.",
      ),
      h("Жизненный цикл объекта"),
      table(
        ["Стадия", "Что происходит"],
        [
          ["Создан", "Рыхлый файл в `.git/objects/xx/`: коммит, `add`, `hash-object -w`"],
          ["Достижим", "На него указывает ссылка, индекс или журнал: `gc` его не трогает"],
          ["Недостижим", "Ссылки убрали (`branch -D`, `reset`, `rebase`), журнал истёк: объект остаётся в базе"],
          ["Упакован", "`gc`/`repack` собрали объекты в пакет (похожие — дельтами)"],
          ["Удалён", "`gc` с `prune` убирает недостижимые объекты, старше срока хранения (по умолчанию две недели)"],
        ],
        "Что происходит с объектом",
      ),
      insight("Git почти ничего не удаляет сразу: объект уходит в «карантин» недостижимости и существует, пока его не вычистит сборка мусора. Это и даёт запас времени для восстановления (`reflog`, `fsck`)."),
    ]),

    section("technical", [
      h("Ссылки"),
      table(
        ["Пространство имён", "Что хранится"],
        [
          ["`refs/heads/*`", "Локальные ветки"],
          ["`refs/tags/*`", "Теги (легковесные — коммит; аннотированные — объект тега)"],
          ["`refs/remotes/<remote>/*`", "Ветки слежения"],
          ["`refs/stash`", "Последняя запись stash (журнал даёт список)"],
          ["`HEAD`, `ORIG_HEAD`, `FETCH_HEAD`, `MERGE_HEAD`", "Служебные ссылки в корне `.git`"],
        ],
        "Основные ссылки",
      ),
      ul(
        "`git show-ref` — все ссылки с хэшами; `git for-each-ref --format=…` — то же с форматом, удобное для скриптов.",
        "`git rev-parse <имя>` — хэш, на который указывает ссылка; `<тег>^{commit}` — «очистка» аннотированного тега до коммита.",
        "`git update-ref <ссылка> <хэш>` меняет ссылку, `update-ref -d` удаляет.",
        "Журналы ссылок лежат в `.git/logs/` — отсюда `git reflog`.",
        "`git pack-refs --all` собирает рыхлые ссылки в `packed-refs`; при чтении сначала проверяется рыхлый файл, затем `packed-refs`.",
      ),
      h("Упаковка"),
      p("Рыхлый объект — отдельный сжатый файл. Пакет объединяет много объектов в один файл и хранит похожие объекты (версии одного файла) как **базовый объект и дельты**: «возьми объект X и примени такие-то правки». Индекс `.idx` позволяет быстро находить объект в пакете. `git repack` и `git gc` создают пакеты; `git verify-pack -v` показывает их содержимое: хэш, тип, размер, размер в пакете, смещение, глубину цепочки дельт и базовый объект."),
      h("Сборка мусора"),
      ul(
        "`git gc` выполняет упаковку ссылок, очистку устаревших записей журнала, упаковку объектов и удаление недостижимых объектов, старше `gc.pruneExpire` (по умолчанию две недели).",
        "`git gc --auto` запускается после многих команд и срабатывает, когда рыхлых объектов больше порога (`gc.auto`, по умолчанию около 6700) или пакетов больше `gc.autoPackLimit` (по умолчанию 50).",
        "`git gc --prune=now` удаляет недостижимые объекты немедленно; `git prune` делает только удаление.",
        "Записи журнала по умолчанию живут 90 дней (достижимые) и 30 дней (недостижимые).",
      ),
    ]),

    section("syntax", [
      annotated(
        "bash",
        `git show-ref
git for-each-ref --format='%(refname:short) %(objectname:short)'
git symbolic-ref HEAD
git pack-refs --all
git fsck --unreachable --no-reflogs
git gc
git count-objects -v
git verify-pack -v .git/objects/pack/*.idx`,
        [
          { line: 1, text: "Список всех ссылок и хэшей, на которые они указывают." },
          { line: 2, text: "То же с форматом: полезно для скриптов (`%(objecttype)` отличает коммит от тега)." },
          { line: 3, text: "Куда указывает символическая ссылка `HEAD`." },
          { line: 4, text: "Упаковать ссылки в `packed-refs`." },
          { line: 5, text: "Найти недостижимые объекты, не считая записей журнала." },
          { line: 6, text: "Сборка мусора и упаковка объектов." },
          { line: 7, text: "Статистика рыхлых и упакованных объектов." },
          { line: 8, text: "Содержимое пакета: типы, размеры, дельты." },
        ],
        "команды диагностики",
      ),
    ]),

    section("minimal-example", [
      h("Что лежит в refs"),
      code("text", `$ cat .git/HEAD
ref: refs/heads/main
$ git symbolic-ref HEAD
refs/heads/main
$ find .git/refs -type f | sort
.git/refs/heads/feature/login
.git/refs/heads/main
.git/refs/remotes/origin/main
.git/refs/tags/v0.1
.git/refs/tags/v1.0
$ cat .git/refs/heads/main
c7c50eb205bf281576d12b074178d2413788019d
$ cat .git/refs/tags/v0.1
45c5fe05471a0fe58c38c016ffd2271aa46b4989
$ cat .git/refs/tags/v1.0
09baef16954c164ea8103c05aa9e11f8023b09bf
$ git show-ref
c7c50eb205bf281576d12b074178d2413788019d refs/heads/feature/login
c7c50eb205bf281576d12b074178d2413788019d refs/heads/main
c7c50eb205bf281576d12b074178d2413788019d refs/remotes/origin/main
45c5fe05471a0fe58c38c016ffd2271aa46b4989 refs/tags/v0.1
09baef16954c164ea8103c05aa9e11f8023b09bf refs/tags/v1.0
$ git for-each-ref --format='%(refname:short) -> %(objecttype) %(objectname:short)'
feature/login -> commit c7c50eb
main -> commit c7c50eb
origin/main -> commit c7c50eb
v0.1 -> commit 45c5fe0
v1.0 -> tag 09baef1
$ git rev-parse v1.0 v1.0^{commit}
09baef16954c164ea8103c05aa9e11f8023b09bf
c7c50eb205bf281576d12b074178d2413788019d`, { filename: "сеанс: устройство ссылок" }),
      ul(
        "`HEAD` — `ref: refs/heads/main` (символическая ссылка); `git symbolic-ref HEAD` — `refs/heads/main`.",
        "В `.git/refs` пять файлов: две ветки (`main`, `feature/login`), ветка слежения `origin/main` и два тега. Имя с `/` — вложенный каталог.",
        "Ветки `main`, `feature/login` и `origin/main` содержат один и тот же хэш `c7c50eb…`.",
        "Лёгкий тег `v0.1` содержит хэш коммита (`45c5fe0…`), а аннотированный `v1.0` — хэш объекта тега (`09baef1…`): `for-each-ref` показывает у него тип `tag`, а `rev-parse v1.0^{commit}` — коммит `c7c50eb…`.",
      ),
      h("Упакованные ссылки"),
      code("text", `$ find .git/refs -type f | sort
.git/refs/heads/feature
.git/refs/heads/main
.git/refs/tags/v0.1
$ git pack-refs --all
$ find .git/refs -type f | sort
$ cat .git/packed-refs
# pack-refs with: peeled fully-peeled sorted 
45c5fe05471a0fe58c38c016ffd2271aa46b4989 refs/heads/feature
45c5fe05471a0fe58c38c016ffd2271aa46b4989 refs/heads/main
45c5fe05471a0fe58c38c016ffd2271aa46b4989 refs/tags/v0.1
# ветка, созданная позже, снова лежит отдельным файлом и перекрывает упакованную запись
$ find .git/refs -type f | sort
.git/refs/heads/feature
.git/refs/heads/main
$ git show-ref
0db299e05d008a29616fdfe9a9ea9942ab289964 refs/heads/feature
0db299e05d008a29616fdfe9a9ea9942ab289964 refs/heads/main
45c5fe05471a0fe58c38c016ffd2271aa46b4989 refs/tags/v0.1`, { filename: "сеанс: pack-refs" }),
      ul(
        "До `pack-refs` — три файла в `refs/` (две ветки и тег); после — ни одного: все ссылки в `.git/packed-refs`, по строке на ссылку (хэш и имя).",
        "После нового коммита ветки `main` и `feature` снова стали отдельными файлами с новым хэшем `0db299e…`, а тег `v0.1` остался только в `packed-refs`. `git show-ref` показывает общую картину: рыхлая запись перекрывает упакованную.",
      ),
    ]),

    section("detailed-example", [
      h("Недостижимые объекты и сборка мусора"),
      code("text", `$ git branch -D experiment
Deleted branch experiment (was a44913e).
$ git cat-file -t $GONE
commit
# журнал ссылок всё ещё указывает на коммит, поэтому fsck не считает его недостижимым
$ git fsck --unreachable
$ git fsck --unreachable --no-reflogs
unreachable commit a44913e43aa3969f8b264f2151246b35cf508d6a
unreachable tree 480801aaf1178d51536fad7d7054e20dc56d6685
unreachable blob 9c06057dcb9b2fbc830645be7db6612e9b3b0b7b
# забываем журнал и убираем мусор немедленно
$ git reflog expire --expire=now --all
$ git gc -q --prune=now
$ git fsck --unreachable --no-reflogs
$ git cat-file -t $GONE
fatal: git cat-file: could not get object info
$ git count-objects -v | head -2
count: 0
size: 0`, { filename: "сеанс: жизненный цикл удалённой ветки" }),
      ul(
        "`git branch -D experiment` напечатал `was a44913e`; `cat-file -t` подтвердил: коммит в базе остаётся (`commit`).",
        "`git fsck --unreachable` **ничего не нашёл**: журнал ссылок всё ещё указывает на коммит, поэтому он считается достижимым.",
        "`git fsck --unreachable --no-reflogs` показал три недостижимых объекта: commit `a44913e`, его tree и blob.",
        "`git reflog expire --expire=now --all` и `git gc --prune=now` удалили всё: `fsck` чист, `cat-file` — `could not get object info`, `count-objects` — `count: 0`.",
        "Две оговорки: по умолчанию сроки значительно мягче (две недели для объектов, 30 дней для недостижимых записей журнала), а команды с `now` отключают страховку — их запускают только осознанно.",
      ),
    ]),

    section("analysis", [
      h("Эффект упаковки: измерение"),
      p("Файл из 300 строк (31 992 байта) изменяется двадцать раз по одной строке, каждая версия коммитится. Всего получается 63 рыхлых объекта: 21 коммит, 21 дерево, 21 blob. Смотрим, сколько они занимают до и после `git gc` (для воспроизводимости `pack.threads=1`):"),
      code("text", `$ git count-objects -v
count: 63
size: 252
in-pack: 0
packs: 0
size-pack: 0
prune-packable: 0
garbage: 0
size-garbage: 0
$ find .git/objects -type f | wc -l
63
$ git gc -q
$ git count-objects -v
count: 0
size: 0
in-pack: 63
packs: 1
size-pack: 8
prune-packable: 0
garbage: 0
size-garbage: 0
$ find .git/objects -type f | wc -l
5
$ ls .git/objects/pack
pack-d45f42ac4e73e23fbeb7d225567c682c4e7b544b.idx
pack-d45f42ac4e73e23fbeb7d225567c682c4e7b544b.pack
pack-d45f42ac4e73e23fbeb7d225567c682c4e7b544b.rev
$ git verify-pack -v .git/objects/pack/*.idx | grep " blob " | head -5
25cc3fe1f3b3a60b87120960e8ebf0bff9b07971 blob   31992 931 3423
c9564ed69438400057e6543bde353303dbbdf8c3 blob   49 59 4354 1 25cc3fe1f3b3a60b87120960e8ebf0bff9b07971
9429ba350f4c56c7dd6a86f5e77b2038e64498f5 blob   42 46 4413 2 c9564ed69438400057e6543bde353303dbbdf8c3
0ea2c3702d60b85ac246931fdb3f93a50aea7f2f blob   31 40 4459 3 9429ba350f4c56c7dd6a86f5e77b2038e64498f5
aacbdf8c7642300247c37ab0786c508ba5ea2c3e blob   31 40 4499 4 0ea2c3702d60b85ac246931fdb3f93a50aea7f2f
$ git verify-pack -v .git/objects/pack/*.idx | grep "chain length"
chain length = 1: 1 object
chain length = 2: 3 objects
chain length = 3: 2 objects
chain length = 4: 2 objects
chain length = 5: 3 objects
chain length = 6: 2 objects
chain length = 7: 2 objects
chain length = 8: 2 objects
chain length = 9: 3 objects`, { filename: "сеанс: count-objects до и после gc" }),
      table(
        ["Показатель", "До `gc`", "После `gc`"],
        [
          ["Рыхлых объектов (`count`)", "63", "0"],
          ["Место, занимаемое рыхлыми (`size`, КиБ)", "252", "0"],
          ["Объектов в пакетах (`in-pack`)", "0", "63"],
          ["Пакетов (`packs`)", "0", "1"],
          ["Размер пакетов (`size-pack`, КиБ)", "0", "8"],
          ["Файлов в `.git/objects`", "63", "5"],
        ],
        "Измерение упаковки (Git 2.43.0)",
      ),
      ul(
        "`size` для рыхлых — это место на диске по блокам (по файлу на объект), поэтому цифры не равны сумме размеров объектов; в пакете такого «округления» нет.",
        "`verify-pack -v`: первый blob (`25cc3fe…`) 31 992 байта хранится в пакете за **931 байт**; следующие версии — дельты (в первых четырёх строках по 40–59 байт) с глубиной 1, 2, 3, 4… (колонки после смещения: глубина и базовый объект).",
        "Блок `chain length` — распределение глубины цепочек: от 1 до 9 звеньев. Чем длиннее цепочка, тем больше работы при чтении, но размер меньше.",
        "Цифры зависят от версии Git и содержимого; воспроизводимая часть — порядок величины: единицы килобайт вместо сотен.",
      ),
    ]),

    section("internals", [
      h("Что остаётся после упаковки"),
      p("В `.git/objects/pack/` лежит пара файлов (`.pack` и `.idx`) и дополнительный `.rev` — обратный индекс; рыхлых объектов больше нет. Имя пакета включает контрольную сумму его содержимого. Ссылки и объекты при этом не изменились: упаковка — это только способ хранения, и все хэши остаются прежними."),
      ul(
        "`git fetch` и `git push` передают данные тоже в виде пакетов — поэтому отправка больших историй относительно компактна.",
        "Клон `--depth N` (мелкий) и `--filter=blob:none` (частичный) передают только часть истории или объектов; остальное докачивается по требованию.",
        "`git maintenance` (Git 2.29+) запускает сборку мусора и упаковку по расписанию в фоне.",
      ),
      note("Упаковка не меняет модель: объекты по-прежнему неизменяемы и адресуются по хэшу. Дельты — деталь хранения: `cat-file -p` вернёт тот же результат для упакованного и рыхлого объекта."),
    ]),

    section("mistakes", [
      wrongRight(
        "text",
        {
          title: "Неверно",
          code: `
            git reflog expire --expire=now --all
            git gc --prune=now
            # «почищу репозиторий, а потом, если что, восстановлю из reflog»
          `,
          note: "Первая же команда убирает страховку, вторая удаляет недостижимые объекты безвозвратно.",
        },
        {
          title: "Верно",
          code: `
            git count-objects -vH           # сначала измерить
            git gc                          # обычная сборка: безопасные сроки
            git fsck --unreachable --no-reflogs   # что станет мусором
          `,
          note: "Измерение, обычная сборка с безопасными сроками, просмотр недостижимого до удаления.",
        },
      ),
      ul(
        "**Думать, что `branch -D` удаляет коммиты.** Удаляется ссылка; коммиты живут до сборки мусора и срока хранения.",
        "**Запускать `gc --prune=now` «на всякий случай».** Это отменяет возможность восстановления.",
        "**Править `.git/refs` и `packed-refs` руками:** используйте `update-ref`, `branch`, `tag`.",
        "**Ждать, что `fsck --unreachable` покажет всё потерянное:** журнал ссылок считается «корнем»; нужен `--no-reflogs`.",
        "**Считать размер репозитория размером рабочего каталога:** основная часть — `.git`, а в нём пакеты.",
        "**Забывать, что рыхлая ссылка перекрывает `packed-refs`:** при ручной диагностике смотрите оба места.",
      ),
    ]),

    section("antipatterns", [
      ul(
        "**Коммиты больших двоичных файлов с частыми обновлениями:** дельты по сжатым и двоичным данным плохо работают, пакеты растут. Используйте внешние хранилища (например, Git LFS) или артефакты сборки.",
        "**Частые принудительные `gc --aggressive`:** долго и редко нужно; обычная автоматическая сборка достаточна.",
        "**Ручная очистка `.git/objects`:** повреждает базу.",
        "**Хранение секретов в истории с расчётом «потом gc удалит»:** объекты остаются в клонах и в упакованном виде; нужна очистка истории и ротация секретов.",
        "**Игнорирование предупреждений о повреждении:** `git fsck` нужно запускать при подозрении и восстанавливать из клона.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Доверяйте автоматике:** `gc --auto` и `maintenance` справляются; вручную `git gc` — после массовых операций (удаление веток, перебазирование огромной истории).",
        "**Перед чисткой измеряйте:** `git count-objects -vH`, `git verify-pack -v`, `git fsck`.",
        "**Не отключайте страховку без необходимости:** `reflog expire --expire=now` и `--prune=now` — только в одноразовых сценариях (после очистки истории от секретов).",
        "**Используйте `for-each-ref` и `show-ref` в скриптах** вместо чтения файлов в `.git`.",
        "**Для крупных проектов** изучите `--filter=blob:none`, `--depth`, `git maintenance`.",
        "**При подозрении на повреждения:** `git fsck`, затем восстановление объектов из клона (`git fetch`) или резервной копии.",
        "**Учитывайте время хранения:** потерянные коммиты ищите до истечения двух недель (объекты) и 30 дней (записи журнала).",
      ),
    ]),

    section("edge-cases", [
      ul(
        "**Недавние недостижимые объекты** не удаляются: у них ещё не истёк срок `gc.pruneExpire`; обычный `git gc` их оставит.",
        "**Аннотированные теги** держат свой объект; удаление тега без других ссылок делает объект недостижимым.",
        "**Объекты, нужные другим** (например, незавершённая операция `rebase`): служебные ссылки (`ORIG_HEAD`, `REBASE_HEAD`) считаются корнями.",
        "**Множество рабочих каталогов** (`git worktree`) разделяют одну базу объектов и ссылки; `gc` учитывает их все.",
        "**Одновременные операции** во время `gc` блокируются служебными файлами; при аварии остаются файлы `.lock` — их удаляют, убедившись, что процессов Git нет.",
        "**`git gc` и `.git/info/alternates`:** репозитории могут разделять объекты; удаление «общего» источника ломает зависимые.",
      ),
    ]),

    section("related", [
      ul(
        "[Объекты и адресация по содержимому](/learn/git/objects-content-addressing) — что лежит внутри объектов, которые упаковываются.",
        "[Ветки и HEAD](/learn/git/branches-head) — ветка как ссылка; оторванный HEAD.",
        "[Reset, revert и reflog](/learn/git/reset-revert-reflog) — журнал ссылок и восстановление.",
        "[Удалённые репозитории](/learn/git/remotes-fetch-push) — ветки слежения и передача пакетов.",
        "[Релизы и теги](/learn/git/releases-tags) — объекты тегов и `refs/tags`.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "text",
        {
          title: "Рыхлые объекты",
          code: `
            git count-objects -v
            count: 63
            size: 252
            in-pack: 0
          `,
          note: "Каждая версия — отдельный файл; 63 файла на диске, место расходуется блоками.",
        },
        {
          title: "После git gc",
          code: `
            git count-objects -v
            count: 0
            in-pack: 63
            packs: 1
            size-pack: 8
          `,
          note: "Один пакет: базовые объекты и дельты; в опыте 8 КиБ вместо 252 КиБ.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "git.refs-packfiles-gc.ex1",
      title: "Где лежат ветки, теги и HEAD",
      difficulty: "foundation",
      kind: "recall",
      prompt: [
        p("Объясните, где физически хранятся: ветка `feature/login`, лёгкий тег `v0.1`, аннотированный тег `v1.0` и `HEAD`. Чем отличается содержимое файлов тегов? Как получить коммит, на который указывает аннотированный тег?"),
      ],
      hints: [
        "Ветки и теги — файлы в `.git/refs`; слеш в имени — вложенный каталог.",
        "Лёгкий тег содержит хэш коммита, аннотированный — хэш объекта `tag`.",
        "Для «очистки» тега до коммита есть запись `^{commit}`.",
      ],
      checks: ["Ветки — `.git/refs/heads/…`, теги — `.git/refs/tags/…`", "`HEAD` — файл `ref: refs/heads/…`", "Аннотированный тег указывает на объект `tag`", "`git rev-parse v1.0^{commit}` даёт коммит"],
      solution: [
        code("text", `$ cat .git/HEAD
ref: refs/heads/main
$ git symbolic-ref HEAD
refs/heads/main
$ find .git/refs -type f | sort
.git/refs/heads/feature/login
.git/refs/heads/main
.git/refs/remotes/origin/main
.git/refs/tags/v0.1
.git/refs/tags/v1.0
$ cat .git/refs/heads/main
c7c50eb205bf281576d12b074178d2413788019d
$ cat .git/refs/tags/v0.1
45c5fe05471a0fe58c38c016ffd2271aa46b4989
$ cat .git/refs/tags/v1.0
09baef16954c164ea8103c05aa9e11f8023b09bf
$ git show-ref
c7c50eb205bf281576d12b074178d2413788019d refs/heads/feature/login
c7c50eb205bf281576d12b074178d2413788019d refs/heads/main
c7c50eb205bf281576d12b074178d2413788019d refs/remotes/origin/main
45c5fe05471a0fe58c38c016ffd2271aa46b4989 refs/tags/v0.1
09baef16954c164ea8103c05aa9e11f8023b09bf refs/tags/v1.0
$ git for-each-ref --format='%(refname:short) -> %(objecttype) %(objectname:short)'
feature/login -> commit c7c50eb
main -> commit c7c50eb
origin/main -> commit c7c50eb
v0.1 -> commit 45c5fe0
v1.0 -> tag 09baef1
$ git rev-parse v1.0 v1.0^{commit}
09baef16954c164ea8103c05aa9e11f8023b09bf
c7c50eb205bf281576d12b074178d2413788019d`, { filename: "проверка в настоящем репозитории" }),
      ],
    }),
    exercise({
      id: "git.refs-packfiles-gc.ex2",
      title: "Удалённая ветка: можно ли вернуть коммит",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Вы удалили ветку `experiment` (`git branch -D`). Покажите, что её коммит ещё существует и как его найти, если вы не запомнили хэш. При каких условиях он исчезнет окончательно и сколько у вас по умолчанию времени?"),
      ],
      hints: [
        "`git branch -D` печатает `was <хэш>`.",
        "`fsck --unreachable` по умолчанию не считает мусором то, на что указывает журнал; нужен `--no-reflogs`.",
        "Восстановить: `git branch имя <хэш>`.",
      ],
      checks: ["Коммит найден через вывод `branch -D` или `fsck --no-reflogs`", "Объяснена роль журнала ссылок", "Названы условия удаления: `reflog expire`, `gc --prune`", "Названы сроки (две недели для объектов, 30 дней для записей журнала)"],
      solution: [
        code("text", `$ git branch -D experiment
Deleted branch experiment (was a44913e).
$ git cat-file -t $GONE
commit
# журнал ссылок всё ещё указывает на коммит, поэтому fsck не считает его недостижимым
$ git fsck --unreachable
$ git fsck --unreachable --no-reflogs
unreachable commit a44913e43aa3969f8b264f2151246b35cf508d6a
unreachable tree 480801aaf1178d51536fad7d7054e20dc56d6685
unreachable blob 9c06057dcb9b2fbc830645be7db6612e9b3b0b7b
# забываем журнал и убираем мусор немедленно
$ git reflog expire --expire=now --all
$ git gc -q --prune=now
$ git fsck --unreachable --no-reflogs
$ git cat-file -t $GONE
fatal: git cat-file: could not get object info
$ git count-objects -v | head -2
count: 0
size: 0`, { filename: "решение" }),
      ],
    }),
    exercise({
      id: "git.refs-packfiles-gc.ex3",
      title: "Измерьте эффект упаковки",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Создайте файл из 300 строк и сделайте 20 коммитов, меняя по одной строке. Измерьте `git count-objects -v` до и после `git gc`, посмотрите структуру пакета через `git verify-pack -v` и объясните, откуда берётся экономия."),
      ],
      hints: [
        "Для воспроизводимости `git config pack.threads 1`.",
        "Смотрите `count`, `size`, `in-pack`, `size-pack`.",
        "В выводе `verify-pack` ищите строки blob с глубиной и базовым объектом.",
      ],
      checks: ["До `gc` — рыхлые объекты (63)", "После — один пакет и `count: 0`", "Видны дельты: блоб по 40–59 байт с глубиной цепочки", "Объяснена дельта-компрессия"],
      solution: [
        code("text", `$ git count-objects -v
count: 63
size: 252
in-pack: 0
packs: 0
size-pack: 0
prune-packable: 0
garbage: 0
size-garbage: 0
$ find .git/objects -type f | wc -l
63
$ git gc -q
$ git count-objects -v
count: 0
size: 0
in-pack: 63
packs: 1
size-pack: 8
prune-packable: 0
garbage: 0
size-garbage: 0
$ find .git/objects -type f | wc -l
5
$ ls .git/objects/pack
pack-d45f42ac4e73e23fbeb7d225567c682c4e7b544b.idx
pack-d45f42ac4e73e23fbeb7d225567c682c4e7b544b.pack
pack-d45f42ac4e73e23fbeb7d225567c682c4e7b544b.rev
$ git verify-pack -v .git/objects/pack/*.idx | grep " blob " | head -5
25cc3fe1f3b3a60b87120960e8ebf0bff9b07971 blob   31992 931 3423
c9564ed69438400057e6543bde353303dbbdf8c3 blob   49 59 4354 1 25cc3fe1f3b3a60b87120960e8ebf0bff9b07971
9429ba350f4c56c7dd6a86f5e77b2038e64498f5 blob   42 46 4413 2 c9564ed69438400057e6543bde353303dbbdf8c3
0ea2c3702d60b85ac246931fdb3f93a50aea7f2f blob   31 40 4459 3 9429ba350f4c56c7dd6a86f5e77b2038e64498f5
aacbdf8c7642300247c37ab0786c508ba5ea2c3e blob   31 40 4499 4 0ea2c3702d60b85ac246931fdb3f93a50aea7f2f
$ git verify-pack -v .git/objects/pack/*.idx | grep "chain length"
chain length = 1: 1 object
chain length = 2: 3 objects
chain length = 3: 2 objects
chain length = 4: 2 objects
chain length = 5: 3 objects
chain length = 6: 2 objects
chain length = 7: 2 objects
chain length = 8: 2 objects
chain length = 9: 3 objects`, { filename: "решение" }),
        p("Экономия — от дельт: вместо двадцати копий почти одинакового файла пакет хранит один базовый объект и 20 небольших правок."),
      ],
    }),
  ],

  challenge: {
    id: "git.refs-packfiles-gc.challenge",
    title: "Отчёт о состоянии базы репозитория",
    scenario: [
      p("Коллега жалуется, что `.git` «распух» и спрашивает, не стоит ли удалить половину веток и запустить жёсткую очистку. Подготовьте отчёт: сколько объектов рыхлых и упакованных, сколько места до и после обычной сборки мусора, есть ли недостижимые объекты, и что безопасно сделать."),
    ],
    requirements: [
      "Измерить `git count-objects -v` до `git gc`",
      "Выполнить обычный `git gc` и измерить снова",
      "Показать структуру пакета (`verify-pack -v`) и объяснить, откуда экономия",
      "Проверить недостижимые объекты (`fsck --unreachable --no-reflogs`) и объяснить, почему не стоит начинать с `--prune=now`",
    ],
    constraints: [
      "Не использовать `git gc --prune=now` и `reflog expire --expire=now`",
      "Не удалять файлы из `.git` вручную",
    ],
    acceptance: [
      "В отчёте: `count` 63 → 0, `size` 252 КиБ → 0, `size-pack` 0 → 8 КиБ",
      "Показана цепочка дельт (глубина до 9)",
      "Объяснено, что обычный `gc` безопасен (две недели хранения), а `--prune=now` необратим",
    ],
    hints: [
      "`git count-objects -v` и `git verify-pack -v` — основа отчёта.",
      "`fsck --unreachable --no-reflogs` показывает потенциальный мусор до удаления.",
      "Рекомендация: запускать `gc` без `now`, ветки удалять осознанно.",
    ],
    solution: [
      code("text", `$ git count-objects -v
count: 63
size: 252
in-pack: 0
packs: 0
size-pack: 0
prune-packable: 0
garbage: 0
size-garbage: 0
$ find .git/objects -type f | wc -l
63
$ git gc -q
$ git count-objects -v
count: 0
size: 0
in-pack: 63
packs: 1
size-pack: 8
prune-packable: 0
garbage: 0
size-garbage: 0
$ find .git/objects -type f | wc -l
5
$ ls .git/objects/pack
pack-d45f42ac4e73e23fbeb7d225567c682c4e7b544b.idx
pack-d45f42ac4e73e23fbeb7d225567c682c4e7b544b.pack
pack-d45f42ac4e73e23fbeb7d225567c682c4e7b544b.rev
$ git verify-pack -v .git/objects/pack/*.idx | grep " blob " | head -5
25cc3fe1f3b3a60b87120960e8ebf0bff9b07971 blob   31992 931 3423
c9564ed69438400057e6543bde353303dbbdf8c3 blob   49 59 4354 1 25cc3fe1f3b3a60b87120960e8ebf0bff9b07971
9429ba350f4c56c7dd6a86f5e77b2038e64498f5 blob   42 46 4413 2 c9564ed69438400057e6543bde353303dbbdf8c3
0ea2c3702d60b85ac246931fdb3f93a50aea7f2f blob   31 40 4459 3 9429ba350f4c56c7dd6a86f5e77b2038e64498f5
aacbdf8c7642300247c37ab0786c508ba5ea2c3e blob   31 40 4499 4 0ea2c3702d60b85ac246931fdb3f93a50aea7f2f
$ git verify-pack -v .git/objects/pack/*.idx | grep "chain length"
chain length = 1: 1 object
chain length = 2: 3 objects
chain length = 3: 2 objects
chain length = 4: 2 objects
chain length = 5: 3 objects
chain length = 6: 2 objects
chain length = 7: 2 objects
chain length = 8: 2 objects
chain length = 9: 3 objects`, { filename: "решение" }),
      p("Рекомендация для коллеги: обычная `git gc` уже даёт основной эффект (упаковка и дельты); удаление веток не уменьшит размер, пока объекты достижимы по другим ссылкам и пока не истёк срок хранения; жёсткая очистка (`--prune=now`) нужна лишь в особых случаях (например, после удаления секретов из истории) и необратима."),
    ],
  },

  interview: [
    iq("git.refs-packfiles-gc.i1", "basic", "Что такое ссылка в Git и где хранится ветка?", [
      ul(
        "Ссылка — имя, указывающее на объект: `refs/heads/main`, `refs/tags/v1.0`.",
        "Ветка — файл `.git/refs/heads/<имя>` с хэшем коммита.",
        "`HEAD` — символическая ссылка (`ref: refs/heads/main`) или хэш при оторванном HEAD.",
      ),
    ]),
    iq("git.refs-packfiles-gc.i2", "basic", "Что делает `git gc`?", [
      ul(
        "Упаковывает объекты и ссылки, чистит старые записи журнала и удаляет недостижимые объекты старше срока хранения.",
        "Запускается автоматически после некоторых команд (`gc --auto`).",
        "Обычный запуск безопасен: недавние недостижимые объекты сохраняются (по умолчанию две недели).",
      ),
    ]),
    iq("git.refs-packfiles-gc.i3", "intermediate", "Что такое достижимый и недостижимый объект?", [
      ul(
        "Достижимый — до него можно дойти от ссылки, индекса или записи журнала.",
        "Недостижимый — на него никто не ссылается: кандидат на удаление при сборке мусора.",
        "`git fsck --unreachable --no-reflogs` покажет недостижимые объекты без учёта журнала.",
      ),
    ]),
    iq("git.refs-packfiles-gc.i4", "intermediate", "Как работают пакеты и зачем они нужны?", [
      ul(
        "Объекты собираются в `.pack` с индексом `.idx`; похожие объекты хранятся как база и дельты.",
        "Результат — резкая экономия места (в опыте 252 КиБ → 8 КиБ) и быстрая передача по сети.",
        "Модель не меняется: хэши и содержимое те же.",
      ),
    ]),
    iq("git.refs-packfiles-gc.i5", "intermediate", "Что такое `packed-refs`?", [
      ul(
        "Файл со списком ссылок «хэш имя»; создаётся `git pack-refs` и `gc`.",
        "Рыхлая ссылка (отдельный файл) имеет приоритет над записью в `packed-refs`.",
        "Для чтения и записи ссылок используйте команды Git, а не файлы.",
      ),
    ]),
    iq("git.refs-packfiles-gc.i6", "advanced", "Через какое время и при каких условиях потерянный коммит исчезнет безвозвратно?", [
      ul(
        "Когда на него не ссылаются ни ветки, ни теги, ни индекс, ни записи журнала (по умолчанию 90 дней для достижимых записей и 30 для недостижимых), и сборка мусора удалит объект, старше `gc.pruneExpire` (две недели).",
        "Немедленно — после `reflog expire --expire=now` и `gc --prune=now`.",
        "До этого: `git reflog`, `fsck --lost-found/--unreachable`.",
      ),
    ]),
    iq("git.refs-packfiles-gc.i7", "engineering", "Репозиторий вырос до нескольких гигабайт. Что вы проверите?", [
      ul(
        "`git count-objects -vH`, `git verify-pack -v` (самые большие объекты), `git rev-list --objects --all` для поиска крупных файлов.",
        "Лишние двоичные артефакты в истории; кандидат — Git LFS, очистка истории (специальные средства) и согласование с командой.",
        "Мелкие клоны (`--depth`, `--filter`) и `git maintenance` для регулярной упаковки.",
      ),
    ]),
    iq("git.refs-packfiles-gc.i8", "debugging", "`git fsck` сообщает об отсутствующих или повреждённых объектах. Что делать?", [
      ul(
        "Понять масштаб: какие объекты и какие ссылки на них (`fsck --full`).",
        "Восстановить объекты из другой копии: `git fetch` из надёжного клона или сервера, копирование пакетов.",
        "Если нужные данные только локальные — резервная копия; не запускать `gc --prune=now`.",
        "Выяснить причину: сбой диска, обрыв копирования, ручная правка `.git`.",
      ),
    ]),
  ],

  exam: [
    mcq("git.refs-packfiles-gc.e1", "foundation", "Что лежит в файле `.git/refs/heads/main`?", ["Имя ветки", "Список файлов", "Хэш коммита", "Сообщение коммита"], 2, "Ветка — файл с хэшем коммита и переводом строки; имя ветки — путь к файлу."),
    mcq("git.refs-packfiles-gc.e2", "foundation", "Что означает `ref: refs/heads/main` в `.git/HEAD`?", ["HEAD — символическая ссылка на ветку `main`", "HEAD оторван", "Ветка удалена", "Идёт слияние"], 0, "Символическая ссылка указывает на другую ссылку: HEAD «стоит» на ветке `main`."),
    mcq("git.refs-packfiles-gc.e3", "foundation", "Какое минимальное время по умолчанию хранятся недостижимые объекты до удаления сборкой мусора?", ["Сутки", "Не удаляются никогда", "Год", "Две недели"], 3, "Параметр `gc.pruneExpire` по умолчанию — две недели: недавно ставшие недостижимыми объекты `gc` не трогает."),
    mcq("git.refs-packfiles-gc.e4", "intermediate", "Чем объект в пакете может отличаться от рыхлого?", ["Содержимым", "Способом хранения: может храниться как дельта относительно другого объекта", "Хэшем", "Типом"], 1, "Упаковка меняет только хранение; хэши и содержимое остаются прежними. Похожие объекты хранятся как база и дельты."),
    mcq("git.refs-packfiles-gc.e5", "intermediate", "Почему `git fsck --unreachable` ничего не нашёл после `branch -D`?", ["Коммит удалён сразу", "Нужны права администратора", "Нужен `git gc`", "Журнал ссылок всё ещё указывает на коммит, поэтому он считается достижимым"], 3, "Записи reflog — «корни» достижимости. С `--no-reflogs` недостижимые объекты видны."),
    mcq("git.refs-packfiles-gc.e6", "intermediate", "Какая из ссылок имеет приоритет: рыхлая `refs/heads/main` или запись в `packed-refs`?", ["`packed-refs`", "Зависит от даты", "Рыхлая ссылка", "Они равны"], 2, "Рыхлый файл ссылки перекрывает запись в `packed-refs`: так обновления не требуют переписывать весь файл."),
    mcq("git.refs-packfiles-gc.e7", "advanced", "Какие утверждения верны? Выберите все.", ["`git gc --prune=now` вместе с `reflog expire --expire=now` необратимо удаляет недостижимые объекты", "`branch -D` сразу удаляет коммиты", "Пакет хранит похожие объекты в виде дельт", "Упаковка меняет хэши объектов"], [0, 2], "`branch -D` удаляет только ссылку, а упаковка не меняет хэши. Необратимость — следствие отключённой страховки."),
    open("git.refs-packfiles-gc.e8", "intermediate", "Опишите путь коммита от создания до окончательного удаления после `git branch -D`.", [
      ul(
        "Создан как рыхлый объект, достижим от ветки; после `branch -D` ссылки нет, но запись журнала держит его достижимым.",
        "После истечения записей журнала коммит становится недостижимым; `gc` может упаковать его (недавние недостижимые обычно остаются рыхлыми) и удаляет, когда срок хранения (две недели) истёк.",
        "Ускорить можно `reflog expire --expire=now` и `gc --prune=now` — необратимо.",
      ),
    ], ["Описана роль журнала", "Названа недостижимость", "Названы сроки", "Упомянут ускоренный путь"]),
  ],

  mastery: [
    mcq("git.refs-packfiles-gc.m1", "intermediate", "Что покажет `git rev-parse v1.0^{commit}`, если `v1.0` — аннотированный тег?", ["Хэш объекта тега", "Хэш коммита, на который указывает тег", "Ошибку", "Хэш дерева"], 1, "Запись `^{commit}` «очищает» тег до коммита; без неё `rev-parse v1.0` возвращает хэш самого объекта `tag`."),
    mcq("git.refs-packfiles-gc.m2", "advanced", "После `git gc` число файлов в `.git/objects` резко уменьшилось. Что произошло с объектами?", ["Упакованы в пакет; все хэши и содержимое те же", "Удалены", "Перемещены на сервер", "Переименованы"], 0, "Рыхлые объекты собраны в `.pack` с индексом `.idx`; содержимое и имена объектов не меняются."),
    mcq("git.refs-packfiles-gc.m3", "advanced", "Что означает глубина цепочки дельт 9 в `verify-pack -v`?", ["Девять версий файла", "Девять пакетов", "Чтобы получить объект, нужно применить цепочку из девяти дельт к базовому объекту", "Девять ссылок"], 2, "Дельта-цепочка: объект хранится как правки к другому объекту, тот — как правки к следующему и так до базы. Длиннее цепочка — меньше размер, больше работы при чтении."),
    open("git.refs-packfiles-gc.m4", "advanced", "Секрет закоммитили в историю и отправили. После очистки истории вы хотите убедиться, что он удалён из репозитория. Какие шаги нужны на уровне объектов и ссылок и почему обычного `git gc` недостаточно?", [
      ul(
        "Очистка истории (переписывание коммитов специальными средствами) и принудительная публикация; удалить старые ветки и теги, указывающие на прежнюю историю.",
        "Локально: `git reflog expire --expire=now --all` и `git gc --prune=now --aggressive` — иначе записи журнала и недавние недостижимые объекты сохранят секрет.",
        "Клоны и форки коллег всё ещё содержат его: нужна их очистка; секрет считать скомпрометированным и заменить.",
      ),
    ], ["Очистка истории и публикация", "Журнал и prune now", "Клоны и форки", "Замена секрета"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "git.refs-packfiles-gc.f1", front: "Ссылка?", back: "Имя, указывающее на объект: refs/heads, refs/tags, refs/remotes. Ветка — файл с хэшем." },
    { id: "git.refs-packfiles-gc.f2", front: "HEAD?", back: "Символическая ссылка: ref: refs/heads/main (или хэш при оторванном HEAD)." },
    { id: "git.refs-packfiles-gc.f3", front: "packed-refs?", back: "Файл «хэш имя» для упакованных ссылок; рыхлая ссылка перекрывает запись." },
    { id: "git.refs-packfiles-gc.f4", front: "Достижимость?", back: "Объект достижим, если на него ведёт ссылка, индекс или запись reflog. Недостижимые — кандидаты на gc." },
    { id: "git.refs-packfiles-gc.f5", front: "Пакет?", back: "Файл .pack + .idx: объекты сжаты, похожие хранятся дельтами. Хэши не меняются." },
    { id: "git.refs-packfiles-gc.f6", front: "Сроки хранения?", back: "Недостижимые объекты — 2 недели (gc.pruneExpire); записи reflog — 90 дней достижимые и 30 недостижимые." },
    { id: "git.refs-packfiles-gc.f7", front: "Необратимое удаление?", back: "git reflog expire --expire=now --all + git gc --prune=now." },
    { id: "git.refs-packfiles-gc.f8", front: "Диагностика?", back: "git count-objects -v, git verify-pack -v, git fsck [--unreachable --no-reflogs]." },
  ],

  sources: [
    { title: "Pro Git: Git References", url: "https://git-scm.com/book/en/v2/Git-Internals-Git-References", publisher: "Git" },
    { title: "Pro Git: Packfiles", url: "https://git-scm.com/book/en/v2/Git-Internals-Packfiles", publisher: "Git" },
    { title: "Pro Git: Maintenance and Data Recovery", url: "https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery", publisher: "Git" },
    { title: "Git documentation: git-gc", url: "https://git-scm.com/docs/git-gc", publisher: "Git" },
    { title: "Git documentation: git-pack-refs", url: "https://git-scm.com/docs/git-pack-refs", publisher: "Git" },
    { title: "Git documentation: git-count-objects", url: "https://git-scm.com/docs/git-count-objects", publisher: "Git" },
    { title: "Git documentation: git-verify-pack", url: "https://git-scm.com/docs/git-verify-pack", publisher: "Git" },
    { title: "Git documentation: git-for-each-ref", url: "https://git-scm.com/docs/git-for-each-ref", publisher: "Git" },
  ],
};
