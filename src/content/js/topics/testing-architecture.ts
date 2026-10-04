import type { Topic } from "../../types";
import {
  p,
  h,
  ul,
  code,
  tip,
  insight,
  table,
  def,
  wrongRight,
  beforeAfter,
  annotated,
  steps,
  diagram,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const testingArchitecture: Topic = {
  id: "js.testing-architecture",
  slug: "testing-architecture",
  domain: "js",
  module: "engineering",
  title: "Тестирование и архитектура",
  titleEn: "Testing and architecture",
  summary:
    "Код, который трудно проверить, трудно и менять: тестируемость — это свойство архитектуры. Тема на замерах в Node.js 22 и Chromium 141 показывает, как устроены тесты (`node:test`, хуки, `mock.fn`, `mock.timers`), чем отличаются заглушка, шпион, подделка и мок, почему покрытие 100 % не гарантирует качества (слабый тест — 100 %, сильный — 90 %), как мутационное тестирование находит дыры (1 из 5 мутантов убит против 5 из 5), как внедрение зависимостей делает время, случайность и сеть детерминированными, чем опасны общее состояние и циклы импортов, и как проверять интерфейс в браузере (роли, автоожидание, подмена сети, изоляция). В конце вы пишете собственный мини-фреймворк тестирования и тестируемый модуль приветствия.",
  minutes: 130,
  prerequisites: ["js.errors-debugging", "js.modules-esm", "js.async-await-abort"],
  tags: ["testing", "node:test", "unit test", "integration test", "e2e", "mock", "stub", "spy", "fake", "dependency injection", "coverage", "mutation testing", "flaky tests", "architecture", "circular dependency", "Playwright", "TDD", "functional core"],
  keyConcepts: [
    { term: "Тестируемость — результат архитектуры", text: "Функция, читающая `new Date()`, `Math.random()` и `fetch` внутри, зависит от мира; если время, случайность и сеть **внедряются** параметрами, тесты детерминированы (9:00 и 21:00 проверяются всегда)." },
    { term: "Тест проверяет поведение, а не реализацию", text: "Проверка «helper вызван 3 раза» проходит для варианта 1 и падает для эквивалентного варианта 2 (`[true, false]`); проверка результата устойчива к рефакторингу." },
    { term: "Покрытие — не качество", text: "Слабый тест (вызывает код, ничего не проверяет): покрытие строк 100 %. Сильный: 90 % (строка `дёшево` не покрыта), но проверяет результаты. Мутационный тест: слабый убил 1 мутант из 5, сильный — все 5." },
    { term: "Двойники: stub, spy, fake, mock", text: "Stub отдаёт заготовленные ответы; spy записывает вызовы (`callCount`, `arguments`); fake — рабочая упрощённая реализация (хранилище в памяти); mock заранее знает ожидания и проверяет их (`verify()`)." },
    { term: "Тесты должны быть независимы", text: "Общее состояние модуля даёт ложные падения: «первый» и «второй» проходят по одному, а вместе второй падает (`[✓, ✗]`). Создавайте состояние заново для каждого теста." },
    { term: "Циклические зависимости — запах границ", text: "В ESM `const` из цикла недоступен (`Cannot access 'a' before initialization`), в CommonJS модуль получает неполный `exports`. Выносите общее в третий модуль, направляйте зависимости к ядру." },
  ],
  sections: [
    section("definition", [
      def("Автоматический тест", "Программа, которая запускает код в заданных условиях и проверяет результат утверждениями (`assert`); повторяемо, быстро и без участия человека.", "automated test"),
      def("Юнит-, интеграционный и сквозной (e2e) тест", "Юнит проверяет небольшую часть (функцию, модуль) в изоляции; интеграционный — взаимодействие модулей; e2e — всё приложение глазами пользователя (в браузере).", "unit / integration / e2e"),
      def("Тестовый двойник", "Подмена зависимости в тесте: stub (заготовленные ответы), spy (запись вызовов), fake (упрощённая рабочая версия), mock (ожидания + проверка).", "test double"),
      def("Внедрение зависимостей (DI)", "Передача зависимостей (часы, случайность, сеть, хранилище) в функцию или фабрику параметрами вместо обращения к глобальным объектам.", "dependency injection"),
      def("Покрытие кода (coverage)", "Доля строк, ветвей и функций, выполненных тестами; показывает, что **не** проверено, но не доказывает, что проверено правильно.", "code coverage"),
      def("Мутационное тестирование", "Автоматическое внесение небольших дефектов («мутантов») в код: если тесты не падают, мутант «выжил» — проверки слабые.", "mutation testing"),
      def("Flaky-тест", "Тест, который то проходит, то падает без изменения кода: причины — общее состояние, время, случайность, сеть, порядок выполнения.", "flaky test"),
      def("Чистое ядро и императивная оболочка", "Архитектурный приём: логика — чистые функции без побочных эффектов (легко тестировать), ввод-вывод и состояние — в тонком слое на границе.", "functional core, imperative shell"),
    ]),

    section("why", [
      h("Тесты и архитектура — две стороны одного свойства"),
      p("Тесты нужны не ради отчётов, а чтобы **безопасно менять код**: исправить баг, переписать модуль, обновить зависимость и сразу увидеть, что сломалось. Но писать тесты на код, смешавший вычисления с обращениями к времени, сети и DOM, мучительно: приходится подменять глобальные объекты, ждать таймеры, поднимать окружение. Поэтому хорошая архитектура — это такая, где логика отделена от побочных эффектов, зависимости явны, а модули имеют узкие интерфейсы."),
      ul(
        "**Скорость изменений:** быстрые детерминированные тесты позволяют рефакторить без страха.",
        "**Надёжность:** границы, ошибки и особые случаи (пустой ввод, границы диапазонов) зафиксированы тестами.",
        "**Документация:** хорошие тесты показывают, как пользоваться модулем и что он гарантирует.",
        "**Проектирование:** если тест писать трудно — это сигнал о слишком связанной архитектуре.",
      ),
      insight("Тест — это **первый клиент** вашего кода. Если ему неудобно (нужно подменять `Date`, ждать таймеры, лезть в приватные детали), то так же неудобно будет и остальным: исправляйте дизайн, а не добавляйте хитрые подмены."),
    ]),

    section("mental-model", [
      p("**Тест — это контрольная проба на конвейере.** Вы кладёте на ленту известную заготовку (вход), запускаете механизм (код) и сверяете с эталоном (ожидание). Чтобы проба была честной, **условия должны быть одинаковыми**: ни случайных заготовок, ни «сегодня другая погода». Поэтому зависимости от мира (время, случайность, сеть) вы заменяете двойниками: **заглушка** — кукла, которая говорит заученное; **шпион** — кукла с диктофоном; **подделка** — упрощённая, но настоящая модель (склад в коробке из-под обуви); **мок** — актёр, который знает сценарий и жалуется, если партнёр отступил от него. А **архитектура** — это планировка цеха: разделите «кухню» (чистая логика) и «подсобку» (ввод-вывод), и контрольные пробы ставить станет легко."),
      diagram(
        `
        Пирамида тестов
                 ▲
                / \\        e2e (мало): сценарии пользователя в настоящем браузере — медленно, дорого, ближе всего к реальности
               /───\\
              /     \\      интеграционные (немного): модули вместе, настоящие границы (HTTP, хранилище) — средне
             /───────\\
            /         \\    юнит (много): чистая логика, двойники вместо мира — быстро, точно показывают, где сломалось
           ───────────────
        `,
        "Больше быстрых и точных тестов внизу, меньше медленных и «широких» наверху",
      ),
      diagram(
        `
        Слои и направление зависимостей (стрелка = «знает о»)

          UI (DOM, события) ──► приложение (сценарии, состояние) ──► домен (чистая логика, правила)
                                         │
                                         ▼
                              инфраструктура (fetch, storage, часы, случайность) — внедряется в приложение
        `,
        "Зависимости направлены к ядру; всё внешнее приходит параметрами (composition root собирает приложение)",
      ),
      table(
        ["Приём", "Что решает", "Цена"],
        [
          ["Внедрение зависимостей (параметры, фабрики)", "Детерминированные тесты, замена реализаций", "Чуть больше «сборки» при старте приложения"],
          ["Чистые функции для логики", "Тесты без двойников, простое рассуждение", "Нужно выделять побочные эффекты наружу"],
          ["Узкий публичный интерфейс модуля", "Свобода рефакторинга внутри, меньше связей", "Дисциплина: не импортировать внутренности"],
          ["Один composition root", "Видно, как собрано приложение", "Центральное место надо поддерживать"],
          ["Контракты на границах (валидация данных API)", "Ошибки ловятся у входа, а не в глубине", "Код проверок и сообщения об ошибках"],
        ],
        "Архитектурные приёмы тестируемости",
      ),
    ]),

    section("technical", [
      h("Как устроены тесты в Node.js (`node:test`)"),
      code("js", `// Запускаем набор тестов программно и считаем результаты — вывод детерминирован (без времени выполнения)
import { run, mock } from "node:test";
import { Readable } from "node:stream";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nt-"));
const file = path.join(dir, "sample.test.mjs");
fs.writeFileSync(file, \`
import { describe, it, test, before, after, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

const log = [];
describe("корзина", () => {
  before(() => log.push("before (один раз перед всеми)"));
  after(() => { log.push("after (один раз после всех)"); console.log("ПОРЯДОК: " + log.join(" | ")); });
  beforeEach(() => log.push("beforeEach"));
  afterEach(() => log.push("afterEach"));

  it("считает сумму", () => { log.push("тест 1"); assert.equal(1 + 1, 2); });
  it("падает на неверном ожидании", () => { log.push("тест 2"); assert.deepEqual({ a: 1 }, { a: 2 }); });
  it.skip("пропущенный тест", () => {});
  it.todo("запланированный тест");
  it("асинхронный тест", async () => { log.push("тест 3"); await Promise.resolve(); assert.ok(true); });
});

test("assert.rejects и throws", async () => {
  await assert.rejects(Promise.reject(new TypeError("плохой тип")), { name: "TypeError", message: "плохой тип" });
  assert.throws(() => { throw new RangeError("вне диапазона"); }, RangeError);
});

test("mock.fn: подмена функции и учёт вызовов", () => {
  const send = mock.fn((to, text) => "ok:" + to);
  const result = send("anna", "привет");
  assert.equal(result, "ok:anna");
  assert.equal(send.mock.callCount(), 1);
  assert.deepEqual(send.mock.calls[0].arguments, ["anna", "привет"]);
});

test("mock.method: подмена метода объекта и восстановление", () => {
  const api = { now: () => "настоящее" };
  const m = mock.method(api, "now", () => "поддельное");
  assert.equal(api.now(), "поддельное");
  m.mock.restore();
  assert.equal(api.now(), "настоящее");
});

test("mock.timers: время под контролем теста", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let fired = false;
  setTimeout(() => { fired = true; }, 1000);
  assert.equal(fired, false);
  t.mock.timers.tick(1000);
  assert.equal(fired, true);
});
\`);

const counts = { pass: 0, fail: 0, skip: 0, todo: 0 };
const names = { pass: [], fail: [], skip: [], todo: [] };
let failureCode = null, failureOperator = null;
let output = "";
for await (const event of run({ files: [file], concurrency: false })) {
  if (event.type === "test:pass") {
    const kind = event.data.skip ? "skip" : event.data.todo ? "todo" : "pass";
    if (event.data.details.type !== "suite") { counts[kind]++; names[kind].push(event.data.name); }
  } else if (event.type === "test:fail") {
    if (event.data.details.type !== "suite") { counts.fail++; names.fail.push(event.data.name); failureCode = event.data.details.error.cause?.code; failureOperator = event.data.details.error.cause?.operator; }
  } else if (event.type === "test:stdout") output += event.data.message;
}
const show = (k, v) => console.log(k.padEnd(52), "→", typeof v === "string" ? v : JSON.stringify(v));
show("итог (без учёта наборов describe)", counts);
show("упавшие", names.fail);
show("пропущенные и запланированные", [...names.skip, ...names.todo]);
show("ошибка проверки: код и оператор", [failureCode, failureOperator]);
show("порядок хуков", output.trim().replace(/^ПОРЯДОК: /, "").split(" | "));
fs.rmSync(dir, { recursive: true });`, { filename: "t1-node-test.mjs", collapsed: true, lineNumbers: true }),
      code("text", `итог (без учёта наборов describe)                    → {"pass":6,"fail":1,"skip":1,"todo":1}
упавшие                                              → ["падает на неверном ожидании"]
пропущенные и запланированные                        → ["пропущенный тест","запланированный тест"]
ошибка проверки: код и оператор                      → ["ERR_ASSERTION","deepStrictEqual"]
порядок хуков                                        → ["before (один раз перед всеми)","beforeEach","тест 1","afterEach","beforeEach","тест 2","afterEach","beforeEach","afterEach","beforeEach","тест 3","afterEach","after (один раз после всех)"]`, { filename: "вывод Node.js 22.22.0 (3 запуска подряд одинаковы)" }),
      ul(
        "**Итог:** 6 прошли, 1 упал, 1 пропущен (`it.skip`), 1 запланирован (`it.todo`); наборы `describe` в подсчёт не входят.",
        "**Упавший тест:** `assert.deepEqual({ a: 1 }, { a: 2 })` бросает `AssertionError` с `code: \"ERR_ASSERTION\"` и оператором `deepStrictEqual`; в отчёте — диффом ожидаемого и фактического.",
        "**Хуки:** `before`/`after` — один раз на набор, `beforeEach`/`afterEach` — вокруг **каждого** теста; пропущенный тест (`skip`) хуки не запускает, а `todo` без функции — запускает (проверено отдельным замером).",
        "**Мок-функции:** `mock.fn()` считает вызовы (`callCount()`) и хранит аргументы (`calls[0].arguments`); `mock.method(obj, \"метод\", подмена)` подменяет метод и возвращает исходный через `restore()`.",
        "**Время:** `t.mock.timers.enable({ apis: [\"setTimeout\", \"Date\"] })` и `tick(ms)` — управляемое время (API помечен как экспериментальный: `ExperimentalWarning` в `stderr`).",
        "**Утверждения:** `assert.rejects` для промисов, `assert.throws` для исключений, `assert.equal`/`deepEqual` — в строгом режиме (`node:assert/strict`).",
      ),
      code("js", `import { describe, it, before, after, beforeEach, afterEach } from "node:test";
const log = (m) => console.log("LOG: " + m);

before(() => log("корень: before"));
beforeEach(() => log("корень: beforeEach"));
afterEach(() => log("корень: afterEach"));
after(() => log("корень: after"));

describe("A", () => {
  before(() => log("A: before"));
  beforeEach(() => log("A: beforeEach"));
  afterEach(() => log("A: afterEach"));
  after(() => log("A: after"));

  it("A1", () => log("тест A1"));

  describe("B", () => {
    beforeEach(() => log("B: beforeEach"));
    afterEach(() => log("B: afterEach"));
    it("B1", () => log("тест B1"));
  });

  it("A2", () => log("тест A2"));
});

it("корневой тест", () => log("тест корневой"));`, { filename: "x1-hooks.test.mjs (порядок хуков — задание ниже)", collapsed: true }),

      h("Двойники и внедрение зависимостей"),
      code("js", `import { mock } from "node:test";
import assert from "node:assert/strict";
const show = (k, v) => console.log(k.padEnd(64), "→", typeof v === "string" ? v : JSON.stringify(v));

// 1. Зависимость от «мира» делает функцию непроверяемой; внедрение зависимости — проверяемой
const greetHardcoded = () => (new Date().getHours() < 12 ? "Доброе утро" : "Добрый вечер");
const createGreeter = ({ now = () => new Date() } = {}) => () => (now().getHours() < 12 ? "Доброе утро" : "Добрый вечер");
show("без внедрения: результат зависит от времени запуска", ["Доброе утро", "Добрый вечер"].includes(greetHardcoded()));
show("с внедрением: утро (9:00) и вечер (21:00) проверяются всегда", [createGreeter({ now: () => new Date(2024, 0, 1, 9) })(), createGreeter({ now: () => new Date(2024, 0, 1, 21) })()]);

// 2. Типы тестовых двойников на примере сервиса уведомлений
const createNotifier = ({ users, mailer }) => ({
  async welcome(id) {
    const user = await users.find(id);
    if (!user) throw new Error("нет пользователя " + id);
    await mailer.send(user.email, "Добро пожаловать, " + user.name);
    return true;
  },
});
// заглушка (stub): отдаёт заготовленные ответы
const stubUsers = { find: async (id) => (id === 1 ? { email: "anna@example.com", name: "Анна" } : null) };
// шпион (spy): записывает вызовы
const sendSpy = mock.fn(async () => {});
const notifier = createNotifier({ users: stubUsers, mailer: { send: sendSpy } });
await notifier.welcome(1);
show("шпион: число вызовов и аргументы", [sendSpy.mock.callCount(), sendSpy.mock.calls[0].arguments]);
const missing = await notifier.welcome(2).catch((e) => e.message);
show("заглушка вернула null → ошибка, письмо не отправлено", [missing, sendSpy.mock.callCount()]);
// подделка (fake): рабочая упрощённая реализация (хранилище в памяти)
const fakeUsers = (() => { const rows = new Map(); return { add: (u) => rows.set(u.id, u), find: async (id) => rows.get(id) ?? null }; })();
fakeUsers.add({ id: 7, email: "boris@example.com", name: "Борис" });
const outbox = [];
await createNotifier({ users: fakeUsers, mailer: { send: async (to, text) => { outbox.push({ to, text }); } } }).welcome(7);
show("подделка: хранилище в памяти и «почтовый ящик»", outbox);
// мок (mock): ожидания заданы заранее, двойник сам проверяет вызовы и «подтверждает» сценарий в конце
const makeMock = (expectedRecipients) => ({
  expected: [...expectedRecipients],
  async send(to) { assert.equal(to, this.expected.shift(), "неожиданный получатель"); },
  verify() { assert.equal(this.expected.length, 0, "ожидаемые вызовы не выполнены"); },
});
const okMock = makeMock(["anna@example.com"]);
await createNotifier({ users: stubUsers, mailer: okMock }).welcome(1);
okMock.verify();
show("мок: ожидаемый вызов выполнен, verify() прошёл", true);
const unusedMock = makeMock(["anna@example.com"]);
show("мок: ожидаемого вызова не было — verify() бросает ошибку", (() => { try { unusedMock.verify(); return "не бросил"; } catch (e) { return e.code; } })());
const wrongMock = makeMock(["boris@example.com"]);
show("мок: вызван с другим адресом — ошибка сразу", (await createNotifier({ users: stubUsers, mailer: wrongMock }).welcome(1).catch((e) => e.message)).split("\\n")[0]);

// 3. Хрупкий тест проверяет реализацию, устойчивый — поведение
const calls = [];
const doubleImpl1 = (x) => { calls.push("helper"); return x * 2; };
const sumOfDoubles1 = (xs) => xs.reduce((s, x) => s + doubleImpl1(x), 0);          // вариант 1: использует вспомогательную функцию
const sumOfDoubles2 = (xs) => 2 * xs.reduce((s, x) => s + x, 0);                     // вариант 2: другая реализация, тот же результат
show("поведение: оба варианта дают одинаковый результат", sumOfDoubles1([1, 2, 3]) === sumOfDoubles2([1, 2, 3]));
calls.length = 0; sumOfDoubles1([1, 2, 3]);
const brittleOnImpl1 = calls.length === 3;
calls.length = 0; sumOfDoubles2([1, 2, 3]);
const brittleOnImpl2 = calls.length === 3;
show("хрупкая проверка «helper вызван 3 раза»: вариант 1 / вариант 2", [brittleOnImpl1, brittleOnImpl2]);

// 4. Недетерминированность: случайность через внедрённый источник
const createShuffler = ({ random = Math.random } = {}) => (xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fixed = [0.9, 0.1, 0.5];
let k = 0;
const shuffle = createShuffler({ random: () => fixed[k++ % fixed.length] });
show("перемешивание с заданной последовательностью случайных чисел", shuffle(["a", "b", "c", "d"]));
k = 0;
show("то же ещё раз — тот же результат (воспроизводимость)", shuffle(["a", "b", "c", "d"]));

// 5. Подмена глобального времени без внедрения (запасной вариант)
mock.timers.enable({ apis: ["Date"], now: new Date(2030, 5, 1, 9, 30).getTime() });
show("mock.timers подменяет Date: greetHardcoded() утром", greetHardcoded());
mock.timers.reset();`, { filename: "t2-doubles.mjs", collapsed: true, lineNumbers: true }),
      code("text", `без внедрения: результат зависит от времени запуска              → true
с внедрением: утро (9:00) и вечер (21:00) проверяются всегда     → ["Доброе утро","Добрый вечер"]
шпион: число вызовов и аргументы                                 → [1,["anna@example.com","Добро пожаловать, Анна"]]
заглушка вернула null → ошибка, письмо не отправлено             → ["нет пользователя 2",1]
подделка: хранилище в памяти и «почтовый ящик»                   → [{"to":"boris@example.com","text":"Добро пожаловать, Борис"}]
мок: ожидаемый вызов выполнен, verify() прошёл                   → true
мок: ожидаемого вызова не было — verify() бросает ошибку         → ERR_ASSERTION
мок: вызван с другим адресом — ошибка сразу                      → неожиданный получатель
поведение: оба варианта дают одинаковый результат                → true
хрупкая проверка «helper вызван 3 раза»: вариант 1 / вариант 2   → [true,false]
перемешивание с заданной последовательностью случайных чисел     → ["c","b","a","d"]
то же ещё раз — тот же результат (воспроизводимость)             → ["c","b","a","d"]
mock.timers подменяет Date: greetHardcoded() утром               → Доброе утро`, { filename: "вывод Node.js 22.22.0 (3 запуска подряд одинаковы)" }),
      ul(
        "**Без внедрения** результат `greetHardcoded()` зависит от часа запуска теста; **с внедрением** (`now: () => new Date(2024, 0, 1, 9)`) утро и вечер проверяются всегда.",
        "**Шпион** записал один вызов `send` с адресом и текстом; **заглушка** вернула `null` для пользователя 2 — ошибка есть, письмо не отправлено (счётчик остался `1`).",
        "**Подделка:** хранилище в памяти и «почтовый ящик» — упрощённые, но рабочие реализации; тест видит итоговое состояние.",
        "**Мок:** ожидания заданы заранее; `verify()` бросает `ERR_ASSERTION`, если ожидаемого вызова не было, а неожиданный получатель — ошибка сразу.",
        "**Хрупкая проверка:** «helper вызван 3 раза» проходит для варианта 1 и **падает** для эквивалентного варианта 2 — тест привязан к реализации, а не к поведению.",
        "**Случайность:** внедрённый источник `random` с заданной последовательностью даёт воспроизводимое перемешивание (`[\"c\", \"b\", \"a\", \"d\"]` дважды).",
        "**Запасной вариант без DI:** `mock.timers` с `Date` подменяет глобальное время (`Доброе утро`), но это обходной путь — архитектура с внедрением чище.",
      ),

      h("Покрытие кода"),
      code("js", `// Запускает тесты с покрытием кода и разбирает отчёт: что значит «покрытие 100 %» и чего оно не гарантирует
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cov-"));
fs.writeFileSync(path.join(dir, "price.mjs"), \`export function discount(price, percent) {
  if (percent < 0 || percent > 100) throw new RangeError("процент вне диапазона");
  if (percent === 0) return price;
  return price - price * percent / 100;     // ошибка: для percent = 100 вернёт 0 — нормально, но для отрицательной цены результат неверен
}
export function label(price) {
  if (price > 1000) return "дорого";
  if (price > 100) return "средне";
  return "дёшево";
}
\`);
fs.writeFileSync(path.join(dir, "weak.test.mjs"), \`import { test } from "node:test";
import { discount, label } from "./price.mjs";
test("вызывает всё, но ничего не проверяет", () => {
  discount(100, 10); discount(100, 0); label(5000); label(500); label(5);
  try { discount(1, 200); } catch {}
});
\`);
fs.writeFileSync(path.join(dir, "strong.test.mjs"), \`import { test } from "node:test";
import assert from "node:assert/strict";
import { discount, label } from "./price.mjs";
test("discount", () => {
  assert.equal(discount(100, 10), 90);
  assert.equal(discount(100, 0), 100);
  assert.throws(() => discount(1, 200), RangeError);
});
test("label", () => { assert.equal(label(5000), "дорого"); assert.equal(label(500), "средне"); });
\`);

function coverage(testFile) {
  const r = spawnSync(process.execPath, ["--test", "--experimental-test-coverage", testFile], { cwd: dir, encoding: "utf8" });
  const row = r.stdout.split("\\n").find((l) => l.includes("price.mjs") && l.includes("|"));
  const cells = row.split("|").map((c) => c.trim());
  return { файл: cells[0].replace(/^[#\\s]*/, ""), строки: cells[1] + " %", ветви: cells[2] + " %", функции: cells[3] + " %", непокрытыеСтроки: cells[4] || "—", статус: r.status === 0 ? "тесты прошли" : "тесты упали" };
}
const show = (k, v) => console.log(k.padEnd(52), "→", JSON.stringify(v));
show("слабый тест: вызывает код, но ничего не проверяет", coverage("weak.test.mjs"));
show("сильный тест: те же строки + проверки результатов", coverage("strong.test.mjs"));
fs.rmSync(dir, { recursive: true });`, { filename: "t3-coverage.mjs", collapsed: true }),
      code("text", `слабый тест: вызывает код, но ничего не проверяет    → {"файл":"price.mjs","строки":"100.00 %","ветви":"100.00 %","функции":"100.00 %","непокрытыеСтроки":"—","статус":"тесты прошли"}
сильный тест: те же строки + проверки результатов    → {"файл":"price.mjs","строки":"90.00 %","ветви":"87.50 %","функции":"100.00 %","непокрытыеСтроки":"9","статус":"тесты прошли"}`, { filename: "вывод Node.js 22.22.0 (--experimental-test-coverage)" }),
      ul(
        "**Слабый тест:** вызывает все функции и ветви, но не проверяет результат — покрытие строк, ветвей и функций **100 %**, тесты «прошли».",
        "**Сильный тест** проверяет значения, но не вызывает ветку «дёшево» — покрытие строк **90 %**, ветвей **87,5 %**, непокрытая строка 9. Показатель ниже, а проверка лучше.",
        "**Вывод:** покрытие показывает, что **не выполнялось**; оно не проверяет утверждения. Используйте его для поиска непротестированных веток, а не как цель сама по себе.",
      ),

      h("Мутационное тестирование"),
      code("js", `// Мутационное тестирование: портим код и смотрим, заметят ли это тесты. Выживший мутант = дыра в проверках.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mut-"));
const SOURCE = \`export function shippingCost(total, isMember) {
  if (total >= 5000) return 0;
  const base = isMember ? 150 : 300;
  return total > 0 ? base : 0;
}
\`;
const mutations = [
  { name: "граница >= 5000 → > 5000", from: "total >= 5000", to: "total > 5000" },
  { name: "бесплатная доставка: 0 → 1", from: "return 0;\\n  const", to: "return 1;\\n  const" },
  { name: "членам клуба: 150 → 300", from: "isMember ? 150 : 300", to: "isMember ? 300 : 300" },
  { name: "total > 0 → total >= 0", from: "total > 0 ?", to: "total >= 0 ?" },
  { name: "!isMember вместо isMember", from: "isMember ? 150 : 300", to: "!isMember ? 150 : 300" },
];

const suites = {
  "слабые тесты (проверяют один «счастливый» сценарий)": (cost) => { assert.equal(cost(1000, false), 300); },
  "сильные тесты (границы, оба вида клиентов, пустая корзина)": (cost) => {
    assert.equal(cost(1000, false), 300);
    assert.equal(cost(1000, true), 150);
    assert.equal(cost(4999, false), 300);
    assert.equal(cost(5000, false), 0);
    assert.equal(cost(5000, true), 0);
    assert.equal(cost(0, false), 0);
  },
};

let n = 0;
async function load(source) {
  const file = path.join(dir, \`shipping-\${n++}.mjs\`);
  fs.writeFileSync(file, source);
  return (await import(file)).shippingCost;
}
const passes = (suite, cost) => { try { suite(cost); return true; } catch { return false; } };

for (const [title, suite] of Object.entries(suites)) {
  console.log(title);
  console.log("  оригинал проходит тесты:", passes(suite, await load(SOURCE)));
  let killed = 0;
  for (const m of mutations) {
    if (!SOURCE.includes(m.from)) throw new Error("мутация не применима: " + m.name);
    const survived = passes(suite, await load(SOURCE.replace(m.from, m.to)));
    if (!survived) killed++;
    console.log(\`  \${survived ? "выжил " : "убит  "} \${m.name}\`);
  }
  console.log(\`  итого убито мутантов: \${killed} из \${mutations.length}\`);
}
fs.rmSync(dir, { recursive: true });`, { filename: "t6-mutation.mjs", collapsed: true }),
      code("text", `слабые тесты (проверяют один «счастливый» сценарий)
  оригинал проходит тесты: true
  выжил  граница >= 5000 → > 5000
  выжил  бесплатная доставка: 0 → 1
  выжил  членам клуба: 150 → 300
  выжил  total > 0 → total >= 0
  убит   !isMember вместо isMember
  итого убито мутантов: 1 из 5
сильные тесты (границы, оба вида клиентов, пустая корзина)
  оригинал проходит тесты: true
  убит   граница >= 5000 → > 5000
  убит   бесплатная доставка: 0 → 1
  убит   членам клуба: 150 → 300
  убит   total > 0 → total >= 0
  убит   !isMember вместо isMember
  итого убито мутантов: 5 из 5`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Суть:** в функцию вносятся мелкие правки (`>=` → `>`, `0` → `1`, подмена ветви); если набор тестов не падает, мутант «выжил» — значит, соответствующее поведение никто не проверяет.",
        "**Замер:** слабые тесты убили **1 из 5** мутантов (граница `5000`, значение бесплатной доставки, цена для членов клуба и граница `total > 0` остались незамеченными); сильные — **5 из 5**.",
        "**Применение:** инструменты (Stryker и др.) автоматизируют перебор; в этом курсе все «решения» проверялись ручными мутантами: каждая поломка должна давать красный тест.",
      ),

      h("Независимость тестов: общее состояние"),
      code("js", `// Тесты, зависящие от общего состояния: проходят по одному и падают вместе (или наоборот)
import { run } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "shared-"));
fs.writeFileSync(path.join(dir, "counter.mjs"), \`let value = 0;\\nexport const increment = () => ++value;\\nexport const reset = () => { value = 0; };\\n\`);
const body = (only) => \`import { test } from "node:test";
import assert from "node:assert/strict";
import { increment } from "./counter.mjs";
test("первый: после одного increment счётчик равен 1", { \${only === 1 ? "" : only ? "skip: true" : ""} }, () => assert.equal(increment(), 1));
test("второй: после одного increment счётчик равен 1", { \${only === 2 ? "" : only ? "skip: true" : ""} }, () => assert.equal(increment(), 1));
\`;
async function results(only) {
  const file = path.join(dir, \`t\${only ?? "all"}.test.mjs\`);
  fs.writeFileSync(file, body(only));
  const out = [];
  for await (const e of run({ files: [file], concurrency: false })) if ((e.type === "test:pass" || e.type === "test:fail") && !e.data.skip) out.push((e.type === "test:pass" ? "✓ " : "✗ ") + e.data.name.split(":")[0]);
  return out;
}
const show = (k, v) => console.log(k.padEnd(46), "→", JSON.stringify(v));
show("запуск всех тестов подряд", await results(null));
show("только «первый»", await results(1));
show("только «второй»", await results(2));
fs.rmSync(dir, { recursive: true });`, { filename: "x2-shared-state.mjs", collapsed: true }),
      code("text", `запуск всех тестов подряд                      → ["✓ первый","✗ второй"]
только «первый»                                → ["✓ первый"]
только «второй»                                → ["✓ второй"]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**Симптом:** «первый» и «второй» проходят по отдельности, но вместе «второй» падает: состояние модуля (`let value`) сохранилось между тестами.",
        "**Причины flaky-тестов:** общее изменяемое состояние, порядок выполнения, реальное время и случайность, сеть, ресурсы (порты, файлы), гонки.",
        "**Лечение:** фабрика состояния на каждый тест (`beforeEach`), внедрение зависимостей, отказ от глобальных переменных, изоляция ресурсов (временные каталоги, случайный порт).",
      ),

      h("Структура приложения: циклические зависимости"),
      code("js", `// Циклические зависимости модулей: что реально происходит в ESM и CommonJS
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cyc-"));
const w = (name, text) => fs.writeFileSync(path.join(dir, name), text);
const run = (file) => { const r = spawnSync(process.execPath, [file], { cwd: dir, encoding: "utf8" }); const err = r.stderr.split("\\n").find((l) => /Error/.test(l) && !l.startsWith("file:") ) ?? ""; return { stdout: r.stdout.trim().split("\\n"), error: err.trim() || null }; };
const show = (k, v) => console.log(k.padEnd(60), "→", JSON.stringify(v));

// 1. ESM: функции-объявления доступны в цикле, а const — нет (TDZ)
w("a.mjs", \`import { b, readB } from "./b.mjs";\\nexport const a = "значение a";\\nexport function hello() { return "hello из a"; }\\nconsole.log("a выполняется; b =", b);\\n\`);
w("b.mjs", \`import { a, hello } from "./a.mjs";\\nexport const b = "значение b";\\nexport function readB() { return b; }\\nconsole.log("b выполняется; hello() =", hello());\\ntry { console.log(a); } catch (e) { console.log("чтение a в b:", e.name + ":", e.message); }\\n\`);
const r1 = run("a.mjs");
show("ESM: a ↔ b, чтение const и вызов function в цикле", r1.stdout);

// 2. ESM: безопасно — читать импорты не при загрузке, а при вызове
w("c.mjs", \`import { d } from "./d.mjs";\\nexport const c = "значение c";\\nexport const useD = () => d;\\nconsole.log("c загружен");\\n\`);
w("d.mjs", \`import { c } from "./c.mjs";\\nexport const d = "значение d";\\nexport const useC = () => c;      // обращение отложено до вызова\\nconsole.log("d загружен");\\n\`);
w("main-ok.mjs", \`import { useC } from "./d.mjs";\\nimport { useD } from "./c.mjs";\\nconsole.log("после загрузки:", useC(), "|", useD());\\n\`);
show("ESM: отложенное чтение импорта работает", run("main-ok.mjs").stdout);

// 3. CommonJS: цикл отдаёт частично заполненный exports
w("x.cjs", \`exports.early = "x: ранее";\\nconst y = require("./y.cjs");\\nexports.late = "x: позже";\\nconsole.log("x видит y:", JSON.stringify(y));\\n\`);
w("y.cjs", \`const x = require("./x.cjs");\\nconsole.log("y видит x при загрузке:", JSON.stringify(x));\\nmodule.exports = { fromY: true, xKeys: Object.keys(x) };\\n\`);
show("CommonJS: y получает частично заполненный exports модуля x", run("x.cjs").stdout);

// 4. Как разорвать цикл: вынести общее в третий модуль
w("shared.mjs", \`export const config = { name: "общая настройка" };\\n\`);
w("p.mjs", \`import { config } from "./shared.mjs";\\nexport const p = "p использует " + config.name;\\n\`);
w("q.mjs", \`import { config } from "./shared.mjs";\\nexport const q = "q использует " + config.name;\\n\`);
w("main-ok2.mjs", \`import { p } from "./p.mjs";\\nimport { q } from "./q.mjs";\\nconsole.log(p, "|", q);\\n\`);
show("общее вынесено в третий модуль: циклов нет", run("main-ok2.mjs").stdout);

fs.rmSync(dir, { recursive: true });`, { filename: "t4-cycles.mjs", collapsed: true }),
      code("text", `ESM: a ↔ b, чтение const и вызов function в цикле            → ["b выполняется; hello() = hello из a","чтение a в b: ReferenceError: Cannot access 'a' before initialization","a выполняется; b = значение b"]
ESM: отложенное чтение импорта работает                      → ["c загружен","d загружен","после загрузки: значение c | значение d"]
CommonJS: y получает частично заполненный exports модуля x   → ["y видит x при загрузке: {\\"early\\":\\"x: ранее\\"}","x видит y: {\\"fromY\\":true,\\"xKeys\\":[\\"early\\"]}"]
общее вынесено в третий модуль: циклов нет                   → ["p использует общая настройка | q использует общая настройка"]`, { filename: "вывод Node.js 22.22.0" }),
      ul(
        "**ESM:** в цикле `a ↔ b` модуль `b` выполняется раньше `a`: вызов `function hello()` из `a` работает (объявления функций подняты), а чтение `const a` — `ReferenceError: Cannot access 'a' before initialization`.",
        "**Безопасный приём:** читать импорт не при загрузке, а при вызове — тогда к моменту использования все модули инициализированы (`после загрузки: значение c | значение d`).",
        "**CommonJS:** `y` при загрузке получает **частично заполненный** `exports` модуля `x` (`{\"early\":\"x: ранее\"}`); поля, добавленные позже, недоступны.",
        "**Лучшее решение — убрать цикл:** вынести общее (`config`) в третий модуль, от которого зависят оба; цикл — симптом неверных границ. Проверяйте линтером (`import/no-cycle`).",
      ),

      h("Сквозные тесты в браузере"),
      code("js", `// Сквозная проверка интерфейса в настоящем браузере: роли, автоожидание, подмена сети, изоляция контекстов
import http from "node:http";
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";

const PAGE = \`<!doctype html><html lang="ru"><meta charset="utf-8"><title>Список дел</title>
<h1>Список дел</h1>
<button id="add">Добавить задачу</button>
<p role="status" id="status"></p>
<ul id="items" aria-label="Задачи"></ul>
<script>
  const status = document.getElementById("status"), items = document.getElementById("items");
  document.getElementById("add").addEventListener("click", async () => {
    status.textContent = "Загрузка…";
    try {
      const res = await fetch("/api/task");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const task = await res.json();
      items.insertAdjacentHTML("beforeend", "<li>" + task.title + "</li>");
      setTimeout(() => { status.textContent = "Готово: " + task.title; }, 300);     // сообщение появляется не сразу
    } catch (e) { status.textContent = "Ошибка: " + e.message; }
  });
</script>\`;
let serverCalls = 0;
const server = http.createServer((req, res) => {
  if (req.url === "/api/task") { serverCalls++; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ title: "купить хлеб" })); return; }
  res.setHeader("content-type", "text/html; charset=utf-8"); res.end(PAGE);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = \`http://127.0.0.1:\${server.address().port}/\`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const show = (k, v) => console.log(k.padEnd(68), "→", JSON.stringify(v));

// 1. Локаторы по роли и доступному имени — так же, как их «видит» пользователь
let context = await browser.newContext(); let page = await context.newPage(); await page.goto(url);
await page.getByRole("button", { name: "Добавить задачу" }).click();
await page.getByRole("listitem").first().waitFor();
show("getByRole('button', { name }) нашёл кнопку, getByRole('listitem') — элемент списка", await page.getByRole("listitem").allTextContents());

// 2. Автоожидание вместо «спим и надеемся»
const sleepy = await page.getByText("Готово: купить хлеб").count();                 // сразу после клика сообщения ещё нет
show("мгновенная проверка сразу после клика: сообщения «Готово» ещё нет", sleepy === 0);
await page.getByText("Готово: купить хлеб").waitFor({ timeout: 2000 });
show("waitFor() дождался появления сообщения", await page.getByRole("status").textContent());

// 3. Подмена сети: проверяем состояние ошибки без настоящего сервера
await page.route("**/api/task", (route) => route.fulfill({ status: 500, body: "сбой" }));
const callsBefore = serverCalls;
await page.getByRole("button", { name: "Добавить задачу" }).click();
await page.getByText("Ошибка: HTTP 500").waitFor();
show("ответ 500 подставлен тестом: интерфейс показал ошибку; на настоящий сервер запрос не ушёл", [await page.getByRole("status").textContent(), serverCalls === callsBefore]);

// 4. Изоляция: у нового контекста нет состояния старого
await page.evaluate(() => localStorage.setItem("draft", "черновик"));
const second = await browser.newContext(); const page2 = await second.newPage(); await page2.goto(url);
show("в первом контексте localStorage.draft / во втором", [await page.evaluate(() => localStorage.getItem("draft")), await page2.evaluate(() => localStorage.getItem("draft"))]);

// 5. Артефакты для разбора падений
const png = await page.screenshot();
show("скриншот страницы получен (PNG)", [png.subarray(1, 4).toString(), png.length > 1000]);
await browser.close(); server.close();`, { filename: "t5-e2e.mjs", collapsed: true, lineNumbers: true }),
      code("text", `getByRole('button', { name }) нашёл кнопку, getByRole('listitem') — элемент списка → ["купить хлеб"]
мгновенная проверка сразу после клика: сообщения «Готово» ещё нет    → true
waitFor() дождался появления сообщения                               → "Готово: купить хлеб"
ответ 500 подставлен тестом: интерфейс показал ошибку; на настоящий сервер запрос не ушёл → ["Ошибка: HTTP 500",true]
в первом контексте localStorage.draft / во втором                    → ["черновик",null]
скриншот страницы получен (PNG)                                      → ["PNG",true]`, { filename: "вывод Node.js 22.22.0 + Chromium 141 (Playwright; 5 запусков подряд одинаковы)" }),
      ul(
        "**Локаторы по роли и имени** (`getByRole(\"button\", { name })`, `getByRole(\"listitem\")`) ищут то же, что видит пользователь и ассистивные технологии, и устойчивее селекторов по классам.",
        "**Автоожидание:** сообщение «Готово» появляется через 300 мс; мгновенная проверка после клика его не находит (`count() === 0`), а `waitFor()` дожидается появления. Фиксированные `sleep` дают нестабильные тесты.",
        "**Подмена сети:** `page.route(...)` отдаёт ответ `500` — интерфейс показывает `Ошибка: HTTP 500`, а на настоящий сервер запрос не уходит.",
        "**Изоляция:** новый контекст браузера не видит `localStorage` старого (`[\"черновик\", null]`) — тесты не мешают друг другу.",
        "**Артефакты:** скриншоты, трассировки, видео помогают разбирать падения в CI.",
      ),

      h("Практика: собственный тест-фреймворк"),
      code("js", `// Мини-фреймворк тестирования: наборы, хуки, async, тайм-аут, skip/only, expect с матчерами
import { inspect } from "node:util";

export class AssertionError extends Error {
  constructor(message) { super(message); this.name = "AssertionError"; }
}
const show = (v) => inspect(v, { depth: 4, breakLength: Infinity });

export function isEqual(a, b) {                              // структурное равенство
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Map) return a.size === b.size && [...a].every(([k, v]) => b.has(k) && isEqual(v, b.get(k)));
  if (a instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v));
  const keysA = Reflect.ownKeys(a), keysB = Reflect.ownKeys(b);
  return keysA.length === keysB.length && keysA.every((k) => Object.hasOwn(b, k) && isEqual(a[k], b[k]));
}

function matchers(actual, negate = false) {
  const assert = (pass, message, notMessage) => { if (pass === negate) throw new AssertionError(negate ? notMessage : message); };
  const thrown = (fn) => { try { fn(); } catch (e) { return { threw: true, error: e }; } return { threw: false }; };
  const matchesError = (error, expected) =>
    expected === undefined ? true
    : typeof expected === "string" ? String(error?.message ?? error).includes(expected)
    : expected instanceof RegExp ? expected.test(String(error?.message ?? error))
    : typeof expected === "function" ? error instanceof expected
    : isEqual(error?.message, expected?.message);
  return {
    toBe: (expected) => assert(Object.is(actual, expected), \`Ожидалось \${show(expected)}, получено \${show(actual)}\`, \`Не ожидалось \${show(expected)}\`),
    toEqual: (expected) => assert(isEqual(actual, expected), \`Ожидалось (структурно) \${show(expected)}, получено \${show(actual)}\`, \`Значения не должны быть равны: \${show(actual)}\`),
    toBeTruthy: () => assert(Boolean(actual), \`Ожидалось истинное значение, получено \${show(actual)}\`, \`Ожидалось ложное значение, получено \${show(actual)}\`),
    toBeFalsy: () => assert(!actual, \`Ожидалось ложное значение, получено \${show(actual)}\`, \`Ожидалось истинное значение, получено \${show(actual)}\`),
    toContain: (item) => assert(typeof actual === "string" ? actual.includes(item) : [...actual].some((x) => Object.is(x, item)), \`Ожидалось, что \${show(actual)} содержит \${show(item)}\`, \`Ожидалось, что \${show(actual)} не содержит \${show(item)}\`),
    toHaveLength: (n) => assert(actual?.length === n, \`Ожидалась длина \${n}, получено \${show(actual?.length)}\`, \`Длина не должна быть \${n}\`),
    toBeCloseTo: (n, digits = 2) => assert(Math.abs(actual - n) < 10 ** -digits / 2, \`Ожидалось близкое к \${n} (знаков: \${digits}), получено \${actual}\`, \`Ожидалось не близкое к \${n}, получено \${actual}\`),
    toThrow: (expected) => {
      const r = thrown(actual);
      assert(r.threw && matchesError(r.error, expected), r.threw ? \`Брошено не то: \${show(r.error?.message ?? r.error)}\` : "Ожидалось исключение, но его не было", "Исключения не ожидалось, но оно было");
    },
  };
}

export function expect(actual) {
  const api = matchers(actual);
  api.not = matchers(actual, true);
  const lift = (promiseGetter, label) => new Proxy({}, {                         // await expect(p).rejects.toThrow() / .resolves.toBe()
    get: (_, name) => async (...args) => {
      const settled = await promiseGetter();
      return matchers(settled.value)[name](...args);
    },
  });
  api.resolves = lift(async () => ({ value: await actual }));
  api.rejects = lift(async () => { try { await actual; } catch (e) { return { value: () => { throw e; } }; } throw new AssertionError("Ожидался отказ промиса, но он выполнился"); });
  return api;
}

export function createRunner({ timeoutMs = 1000 } = {}) {
  const root = { name: "", suites: [], tests: [], before: [], after: [], parent: null, order: [] };
  let current = root, onlyUsed = false;

  function describe(name, fn) {
    const suite = { name, tests: [], before: [], after: [], parent: current, order: [] };
    current.order.push({ suite });
    const saved = current; current = suite;
    try { fn(); } finally { current = saved; }
  }
  function add(name, fn, mode) {
    if (mode === "only") onlyUsed = true;
    current.order.push({ test: { name, fn, mode, suite: current } });
  }
  const test = (name, fn) => add(name, fn, "run");
  test.skip = (name, fn) => add(name, fn, "skip");
  test.only = (name, fn) => add(name, fn, "only");

  const chain = (suite) => { const out = []; for (let s = suite; s; s = s.parent) out.unshift(s); return out; };
  const fullName = (t) => [...chain(t.suite).map((s) => s.name).filter(Boolean), t.name].join(" > ");

  function withTimeout(fn) {
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(\`Превышено время ожидания \${timeoutMs} мс\`)), timeoutMs); });
    return Promise.race([Promise.resolve().then(fn), timeout]).finally(() => clearTimeout(timer));
  }
  const describeError = (e) => (e instanceof Error ? { name: e.name, message: e.message } : { name: "Thrown", message: String(e) });

  async function runTest(t) {
    const suites = chain(t.suite);
    const result = { name: fullName(t), status: "passed" };
    const fail = (e) => { if (result.status === "passed") { result.status = "failed"; result.error = describeError(e); } };
    let prepared = true;
    for (const s of suites) for (const hook of s.before) { try { await withTimeout(hook); } catch (e) { fail(e); prepared = false; } }
    if (prepared) { try { await withTimeout(t.fn); } catch (e) { fail(e); } }        // тело теста не запускается, если упал beforeEach
    for (const s of [...suites].reverse()) for (const hook of [...s.after].reverse()) { try { await withTimeout(hook); } catch (e) { fail(e); } }
    return result;
  }

  async function run() {
    const results = [];
    async function walk(suite) {
      for (const item of suite.order) {
        if (item.suite) { await walk(item.suite); continue; }
        const t = item.test;
        const skipped = t.mode === "skip" || (onlyUsed && t.mode !== "only");
        results.push(skipped ? { name: fullName(t), status: "skipped" } : await runTest(t));
      }
    }
    await walk(root);
    const count = (s) => results.filter((r) => r.status === s).length;
    return { passed: count("passed"), failed: count("failed"), skipped: count("skipped"), results };
  }

  return {
    describe, test, it: test, run,
    beforeEach: (fn) => current.before.push(fn),
    afterEach: (fn) => current.after.push(fn),
    expect,
  };
}`, { filename: "mini-test.mjs", lineNumbers: true }),
      code("js", `// Проверяем фреймворк его же средствами снаружи: пишем примерные наборы, запускаем и сверяем результаты
import assert from "node:assert/strict";
const { createRunner, expect: globalExpect, AssertionError, isEqual } = await import(new URL(process.argv[2] ?? "mini-test.mjs", import.meta.url));

const results = [];
const check = async (name, fn) => { try { await fn(); results.push(true); console.log("✓ " + name); } catch (e) { results.push(false); console.log("✗ " + name + " — " + String(e.message).split("\\n")[0].slice(0, 120)); } };
const summary = (r) => r.results.map((x) => \`\${x.status[0]}:\${x.name}\`).join(" | ");

await check("считает прошедшие, упавшие и пропущенные; имена вида «набор > тест»", async () => {
  const t = createRunner(), { describe, test, expect } = t;
  describe("математика", () => {
    test("сложение", () => expect(1 + 1).toBe(2));
    test("ошибка", () => expect(1 + 1).toBe(3));
    describe("вложенный", () => { test.skip("позже", () => {}); test("умножение", () => expect(2 * 3).toBe(6)); });
  });
  const r = await t.run();
  assert.deepEqual([r.passed, r.failed, r.skipped], [2, 1, 1]);
  assert.equal(summary(r), "p:математика > сложение | f:математика > ошибка | s:математика > вложенный > позже | p:математика > вложенный > умножение");
  assert.match(r.results[1].error.message, /Ожидалось 3, получено 2/);
});

await check("порядок хуков: beforeEach снаружи внутрь, afterEach изнутри наружу", async () => {
  const t = createRunner(), log = [];
  t.describe("A", () => {
    t.beforeEach(() => log.push("A.before")); t.afterEach(() => log.push("A.after"));
    t.describe("B", () => { t.beforeEach(() => log.push("B.before")); t.afterEach(() => log.push("B.after")); t.test("тест", () => log.push("тест")); });
  });
  await t.run();
  assert.deepEqual(log, ["A.before", "B.before", "тест", "B.after", "A.after"]);
});

await check("afterEach выполняется и после упавшего теста; статус остаётся failed", async () => {
  const t = createRunner(); let cleaned = 0;
  t.describe("S", () => { t.afterEach(() => { cleaned++; }); t.test("падает", () => { throw new RangeError("сбой"); }); t.test("проходит", () => {}); });
  const r = await t.run();
  assert.equal(cleaned, 2); assert.equal(r.results[0].status, "failed"); assert.equal(r.results[0].error.name, "RangeError");
});

await check("упавший beforeEach: тело теста не выполняется, afterEach выполняется, тест failed", async () => {
  const t = createRunner(), log = [];
  t.describe("S", () => { t.beforeEach(() => { throw new Error("подготовка не удалась"); }); t.afterEach(() => log.push("after")); t.test("т", () => log.push("тело")); });
  const r = await t.run();
  assert.deepEqual(log, ["after"]); assert.equal(r.results[0].status, "failed"); assert.match(r.results[0].error.message, /подготовка/);
});

await check("async-тесты: ожидаются, отказ промиса — падение", async () => {
  const t = createRunner();
  t.test("ждёт", async () => { await new Promise((r) => setTimeout(r, 20)); t.expect(1).toBe(1); });
  t.test("отказ", async () => { throw new Error("async-сбой"); });
  t.test("отклонённый промис", () => Promise.reject(new TypeError("отказ промиса")));
  const r = await t.run();
  assert.equal(summary(r), "p:ждёт | f:отказ | f:отклонённый промис"); assert.equal(r.results[2].error.name, "TypeError");
});

await check("тайм-аут: зависший тест падает с сообщением о времени, прогон продолжается", async () => {
  const t = createRunner({ timeoutMs: 40 }); const start = Date.now();
  t.test("зависает", () => new Promise(() => {}));
  t.test("после", () => {});
  const r = await t.run();
  assert.equal(r.results[0].status, "failed"); assert.match(r.results[0].error.message, /Превышено время ожидания 40 мс/); assert.equal(r.results[1].status, "passed");
  assert.ok(Date.now() - start < 1000);
});

await check("only: выполняются только отмеченные тесты, остальные — skipped", async () => {
  const t = createRunner();
  t.test("а", () => {}); t.test.only("б", () => {}); t.describe("С", () => { t.test("в", () => {}); t.test.only("г", () => {}); });
  const r = await t.run();
  assert.equal(summary(r), "s:а | p:б | s:С > в | p:С > г");
});

await check("toBe использует Object.is: NaN равен NaN, +0 и -0 различаются", () => {
  const e = globalExpect;
  e(NaN).toBe(NaN); e(0).not.toBe(-0);
  assert.throws(() => e({}).toBe({}), AssertionError);
});

await check("toEqual: вложенные структуры, Date, Map, Set, NaN; лишнее свойство и undefined-поле различаются", () => {
  const e = globalExpect;
  e({ a: [1, { b: 2 }], d: new Date(5), m: new Map([[1, { x: 1 }]]), s: new Set([1, 2]), n: NaN }).toEqual({ a: [1, { b: 2 }], d: new Date(5), m: new Map([[1, { x: 1 }]]), s: new Set([2, 1]), n: NaN });
  assert.equal(isEqual({ a: 1 }, { a: 1, b: 2 }), false);
  assert.equal(isEqual({ a: undefined }, {}), false);
  assert.equal(isEqual([1, 2], [1, 2, 3]), false);
  assert.equal(isEqual(new Date(1), new Date(2)), false);
  assert.equal(isEqual([], {}), false);
  class Point { constructor() { this.x = 1; } }
  assert.equal(isEqual(new Point(), { x: 1 }), false);
});

await check("toThrow: без аргумента, по подстроке, по RegExp, по классу; not.toThrow", () => {
  const e = globalExpect;
  const bad = () => { throw new TypeError("плохой тип"); };
  e(bad).toThrow(); e(bad).toThrow("плохой"); e(bad).toThrow(/тип$/); e(bad).toThrow(TypeError);
  e(() => {}).not.toThrow();
  assert.throws(() => e(bad).toThrow(RangeError), AssertionError);
  assert.throws(() => e(bad).toThrow("совсем другое"), AssertionError);
  assert.throws(() => e(bad).toThrow(/^нет$/), AssertionError);
  assert.throws(() => e(() => {}).toThrow(), AssertionError);
});

await check("rejects и resolves для промисов", async () => {
  const e = globalExpect;
  await e(Promise.resolve(5)).resolves.toBe(5);
  await e(Promise.reject(new Error("не вышло"))).rejects.toThrow("не вышло");
  await assert.rejects(e(Promise.resolve(1)).rejects.toThrow(), AssertionError);
  await assert.rejects(e(Promise.resolve(1)).resolves.toBe(2), AssertionError);
});

await check("toContain, toHaveLength, toBeCloseTo, toBeTruthy/Falsy и not", () => {
  const e = globalExpect;
  e([1, 2, 3]).toContain(2); e("привет мир").toContain("мир"); e([1, 2]).toHaveLength(2);
  e(0.1 + 0.2).toBeCloseTo(0.3); e(0.1 + 0.2).not.toBe(0.3); e(1).toBeTruthy(); e("").toBeFalsy();
  assert.throws(() => e(0.5).toBeCloseTo(0.3), AssertionError);
  assert.throws(() => e([1]).toContain(2), AssertionError);
});

await check("сообщение об ошибке содержит ожидаемое и фактическое значения", () => {
  try { globalExpect({ a: 1 }).toEqual({ a: 2 }); assert.fail("должно было бросить"); } catch (e) { assert.equal(e.name, "AssertionError"); assert.match(e.message, /a: 2/); assert.match(e.message, /a: 1/); }
});

await check("исключение не из Error (throw 'строка') записывается как падение с текстом", async () => {
  const t = createRunner(); t.test("т", () => { throw "просто строка"; });
  const r = await t.run();
  assert.equal(r.results[0].status, "failed"); assert.equal(r.results[0].error.message, "просто строка");
});

await check("тесты независимы: падение одного не мешает следующим; хуки не текут между наборами", async () => {
  const t = createRunner(), log = [];
  t.describe("A", () => { t.beforeEach(() => log.push("A")); t.test("1", () => { throw new Error("x"); }); });
  t.describe("B", () => { t.test("2", () => log.push("тест 2")); });
  const r = await t.run();
  assert.deepEqual(log, ["A", "тест 2"]); assert.equal(summary(r), "f:A > 1 | p:B > 2");
});

await check("после прогона не остаётся активных таймеров (тайм-ауты снимаются)", async () => {
  const t = createRunner({ timeoutMs: 5000 });
  t.test("быстрый", () => {}); t.test("асинхронный", async () => { await Promise.resolve(); });
  await t.run();
  await new Promise((r) => setImmediate(r));
  assert.equal(process.getActiveResourcesInfo().filter((x) => x === "Timeout").length, 0);
});

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
process.exit(failed ? 1 : 0);`, { filename: "mini-test-test.mjs", collapsed: true }),
      code("text", `✓ считает прошедшие, упавшие и пропущенные; имена вида «набор > тест»
✓ порядок хуков: beforeEach снаружи внутрь, afterEach изнутри наружу
✓ afterEach выполняется и после упавшего теста; статус остаётся failed
✓ упавший beforeEach: тело теста не выполняется, afterEach выполняется, тест failed
✓ async-тесты: ожидаются, отказ промиса — падение
✓ тайм-аут: зависший тест падает с сообщением о времени, прогон продолжается
✓ only: выполняются только отмеченные тесты, остальные — skipped
✓ toBe использует Object.is: NaN равен NaN, +0 и -0 различаются
✓ toEqual: вложенные структуры, Date, Map, Set, NaN; лишнее свойство и undefined-поле различаются
✓ toThrow: без аргумента, по подстроке, по RegExp, по классу; not.toThrow
✓ rejects и resolves для промисов
✓ toContain, toHaveLength, toBeCloseTo, toBeTruthy/Falsy и not
✓ сообщение об ошибке содержит ожидаемое и фактическое значения
✓ исключение не из Error (throw 'строка') записывается как падение с текстом
✓ тесты независимы: падение одного не мешает следующим; хуки не текут между наборами
✓ после прогона не остаётся активных таймеров (тайм-ауты снимаются)

Все проверки пройдены: 16/16`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("syntax", [
      annotated(
        "js",
        `import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createCart } from "./cart.js";

describe("корзина", () => {
  let cart;
  beforeEach(() => { cart = createCart({ now: () => 0 }); });

  test("добавляет товар и считает сумму", () => {
    cart.add({ id: 1, price: 100 }, 2);
    assert.equal(cart.total(), 200);
  });

  test("уведомляет подписчиков", () => {
    const listener = mock.fn();
    cart.subscribe(listener);
    cart.add({ id: 1, price: 100 });
    assert.equal(listener.mock.callCount(), 1);
  });
});`,
        [
          { line: [1, 3], text: "Встроенный раннер `node:test` и строгие утверждения `node:assert/strict`; тестируемый модуль — отдельный файл." },
          { line: 5, text: "`describe` группирует тесты; вложенные наборы наследуют хуки." },
          { line: [6, 7], text: "Состояние создаётся заново перед **каждым** тестом (`beforeEach`), зависимость (`now`) внедряется." },
          { line: [9, 12], text: "Шаблон «подготовка → действие → проверка» (Arrange–Act–Assert): один тест — одно поведение." },
          { line: [14, 19], text: "`mock.fn()` — шпион: считает вызовы; проверяем наблюдаемое поведение (подписчик уведомлён), а не внутренности." },
        ],
        "syntax.js",
      ),
    ]),

    section("minimal-example", [
      p("Не запуская код, запишите порядок вывода хуков и тестов: сколько раз и в каком порядке сработают `beforeEach`/`afterEach` корня, наборов `A` и `B`, и когда выполняются `before`/`after`."),
      code("js", `import { describe, it, before, after, beforeEach, afterEach } from "node:test";
const log = (m) => console.log("LOG: " + m);

before(() => log("корень: before"));
beforeEach(() => log("корень: beforeEach"));
afterEach(() => log("корень: afterEach"));
after(() => log("корень: after"));

describe("A", () => {
  before(() => log("A: before"));
  beforeEach(() => log("A: beforeEach"));
  afterEach(() => log("A: afterEach"));
  after(() => log("A: after"));

  it("A1", () => log("тест A1"));

  describe("B", () => {
    beforeEach(() => log("B: beforeEach"));
    afterEach(() => log("B: afterEach"));
    it("B1", () => log("тест B1"));
  });

  it("A2", () => log("тест A2"));
});

it("корневой тест", () => log("тест корневой"));`, { filename: "x1-hooks.test.mjs", collapsed: true }),
      code("text", ` 1. корень: before
 2. A: before
 3. корень: beforeEach
 4. A: beforeEach
 5. тест A1
 6. A: afterEach
 7. корень: afterEach
 8. корень: beforeEach
 9. A: beforeEach
10. B: beforeEach
11. тест B1
12. B: afterEach
13. A: afterEach
14. корень: afterEach
15. корень: beforeEach
16. A: beforeEach
17. тест A2
18. A: afterEach
19. корень: afterEach
20. A: after
21. корень: beforeEach
22. тест корневой
23. корень: afterEach
24. корень: after`, { filename: "вывод Node.js 22.22.0 (запуск `node --test`; показаны только строки LOG)" }),
      ul(
        "**Один раз на набор:** `before` корня и `A` — перед первым тестом соответствующей области; `after` — после последнего.",
        "**Вокруг каждого теста:** `beforeEach` — от внешнего набора к внутреннему (корень → `A` → `B`), `afterEach` — наоборот (`B` → `A` → корень).",
        "**Порядок тестов — порядок определения:** `A1`, затем вложенный набор `B`, затем `A2`; корневой тест идёт после набора `A`.",
      ),
    ]),

    section("detailed-example", [
      p("`createWeatherGreeting({ now, random, fetchImpl, baseUrl, timeoutMs, tips })` — тот же функционал, что в исходной функции `weatherGreeting(city)`, но с внедрёнными часами, источником случайности и `fetch`, чистыми функциями `greetingFor` и `describeTemp`, безопасной сборкой адреса (`URL` и `searchParams`), тайм-аутом (`AbortSignal.timeout`) и мягкой деградацией при сбоях (HTTP-ошибка, сеть, битый JSON). Исходник нельзя проверить без подмены глобальных объектов; новая версия проверяется 10 детерминированными тестами."),
      code("js", `// Исходная версия: зависит от часов, случайности и сети — проверить её по-настоящему нельзя
const tips = ["возьмите зонт", "пейте воду", "проветрите комнату"];

export async function weatherGreeting(city) {
  const hour = new Date().getHours();
  const hello = hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  let weather;
  try {
    const res = await fetch("https://api.example.test/weather?city=" + city);
    const { tempC } = await res.json();
    weather = tempC + "°C";
  } catch {
    weather = "погода недоступна";
  }
  const tip = tips[Math.floor(Math.random() * tips.length)];
  return hello + "! " + city + ": " + weather + ". Совет дня: " + tip;
}`, { filename: "weather-greeting-original.mjs (исходная версия)", collapsed: true }),
      code("js", `// Тестируемая версия: время, случайность и сеть внедряются, логика — чистые функции
const TIPS = ["возьмите зонт", "пейте воду", "проветрите комнату"];

export const greetingFor = (hour) => (hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер");
export const describeTemp = (tempC) => (tempC < 0 ? "мороз" : tempC < 15 ? "прохладно" : tempC < 25 ? "тепло" : "жарко");

export function createWeatherGreeting({ now = () => new Date(), random = Math.random, fetchImpl = globalThis.fetch, baseUrl = "https://api.example.test", timeoutMs = 2000, tips = TIPS } = {}) {
  async function loadWeather(city) {
    try {
      const url = new URL("/weather", baseUrl);
      url.searchParams.set("city", city);                                    // город кодируется, а не склеивается
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) return null;
      const { tempC } = await response.json();
      return Number.isFinite(tempC) ? \`\${tempC}°C, \${describeTemp(tempC)}\` : null;
    } catch {
      return null;                                                           // сеть, тайм-аут, битый JSON — не причина падать
    }
  }
  return async function greet(city) {
    const weather = await loadWeather(city);
    const tip = tips[Math.floor(random() * tips.length)];
    return \`\${greetingFor(now().getHours())}! \${city}: \${weather ?? "погода недоступна"}. Совет дня: \${tip}\`;
  };
}`, { filename: "weather-greeting.mjs", lineNumbers: true }),
      code("js", `import assert from "node:assert/strict";
const { createWeatherGreeting, greetingFor, describeTemp } = await import(new URL(process.argv[2] ?? "weather-greeting.mjs", import.meta.url));

const results = [];
const check = async (name, fn) => { try { await fn(); results.push(true); console.log("✓ " + name); } catch (e) { results.push(false); console.log("✗ " + name + " — " + String(e.message).split("\\n")[0]); } };
const at = (h) => () => new Date(2024, 0, 1, h);
const ok = (body) => async () => ({ ok: true, json: async () => body });
const make = (overrides = {}) => createWeatherGreeting({ now: at(9), random: () => 0, fetchImpl: ok({ tempC: 20 }), ...overrides });

await check("приветствие по часам, включая границы 4/5, 11/12, 17/18", () => assert.deepEqual([4, 5, 11, 12, 17, 18].map(greetingFor), ["Доброй ночи", "Доброе утро", "Доброе утро", "Добрый день", "Добрый день", "Добрый вечер"]));
await check("описание температуры на границах: -1, 0, 14, 15, 24, 25", () => assert.deepEqual([-1, 0, 14, 15, 24, 25].map(describeTemp), ["мороз", "прохладно", "прохладно", "тепло", "тепло", "жарко"]));
await check("успешный ответ: приветствие, погода, совет по заданной «случайности»", async () => assert.equal(await make()("Омск"), "Доброе утро! Омск: 20°C, тепло. Совет дня: возьмите зонт"));
await check("случайность внедряется: random() = 0.99 выбирает последний совет", async () => assert.match(await make({ random: () => 0.99 })("Омск"), /проветрите комнату$/));
await check("запрос: город кодируется, передаётся AbortSignal (тайм-аут)", async () => {
  let seen;
  await make({ fetchImpl: async (url, init) => { seen = { url: String(url), signal: init.signal }; return { ok: true, json: async () => ({ tempC: 1 }) }; } })("Санкт-Петербург & область");
  assert.equal(new URL(seen.url).searchParams.get("city"), "Санкт-Петербург & область");
  assert.ok(seen.signal instanceof AbortSignal);
});
await check("HTTP-ошибка (ok: false) → «погода недоступна», без исключения", async () => assert.match(await make({ fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({ tempC: 20 }) }) })("Омск"), /Омск: погода недоступна\\./));
await check("сетевая ошибка → «погода недоступна»", async () => assert.match(await make({ fetchImpl: async () => { throw new TypeError("fetch failed"); } })("Омск"), /погода недоступна/));
await check("битый JSON и ответ без числа → «погода недоступна»", async () => {
  assert.match(await make({ fetchImpl: async () => ({ ok: true, json: async () => { throw new SyntaxError("плохой JSON"); } }) })("Омск"), /погода недоступна/);
  assert.match(await make({ fetchImpl: ok({ tempC: "тепло" }) })("Омск"), /погода недоступна/);
});
await check("время суток из внедрённых часов: ночью и вечером", async () => {
  assert.match(await make({ now: at(2) })("Омск"), /^Доброй ночи!/);
  assert.match(await make({ now: at(23) })("Омск"), /^Добрый вечер!/);
});
await check("функции независимы: два экземпляра с разными зависимостями не мешают друг другу", async () => {
  const [a, b] = await Promise.all([make({ now: at(9) })("А"), make({ now: at(20) })("Б")]);
  assert.ok(a.startsWith("Доброе утро") && b.startsWith("Добрый вечер"));
});

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
process.exit(failed ? 1 : 0);`, { filename: "weather-greeting-test.mjs", collapsed: true }),
      code("text", `✓ приветствие по часам, включая границы 4/5, 11/12, 17/18
✓ описание температуры на границах: -1, 0, 14, 15, 24, 25
✓ успешный ответ: приветствие, погода, совет по заданной «случайности»
✓ случайность внедряется: random() = 0.99 выбирает последний совет
✓ запрос: город кодируется, передаётся AbortSignal (тайм-аут)
✓ HTTP-ошибка (ok: false) → «погода недоступна», без исключения
✓ сетевая ошибка → «погода недоступна»
✓ битый JSON и ответ без числа → «погода недоступна»
✓ время суток из внедрённых часов: ночью и вечером
✓ функции независимы: два экземпляра с разными зависимостями не мешают друг другу

Все проверки пройдены: 10/10`, { filename: "результат запуска (Node.js 22.22.0)" }),
    ]),

    section("analysis", [
      table(
        ["Решение в мини-фреймворке", "Что даёт", "Что сломается без него (проверено мутацией теста)"],
        [
          ["Хуки: `beforeEach` снаружи внутрь, `afterEach` изнутри наружу", "Предсказуемая подготовка и очистка", "Порядок хуков нарушен — красная проверка порядка"],
          ["`afterEach` выполняется после падения и при падении `beforeEach`", "Очистка ресурсов гарантирована", "Утечка ресурсов между тестами"],
          ["Тело теста не выполняется при падении `beforeEach`", "Не тестируем «не подготовленное» состояние", "Тест пишет в лишнее состояние и маскирует причину"],
          ["`Promise.race` с таймером и `clearTimeout` в `finally`", "Зависший тест не вешает прогон; таймеры не копятся", "Прогон ждёт вечно; без `clearTimeout` остаются активные таймеры"],
          ["`only`/`skip` как состояние регистрации", "Быстрая отладка одного теста", "`only` игнорируется — выполняются все тесты"],
          ["`toBe` через `Object.is`; `toEqual` — структурно (прототип, ключи, `Date`, `Map`, `Set`, `NaN`)", "Точные сравнения без ложных совпадений", "`NaN !== NaN`, `+0 === -0`, экземпляр класса равен простому объекту"],
          ["Матчеры с `not` через общий `assert(pass, message, notMessage)`", "Единая логика отрицания", "`not` не работает: проверки инвертируются неверно"],
          ["`rejects`/`resolves` на основе `Proxy`", "`await expect(promise).rejects.toThrow()`", "Отказ промиса остаётся без проверки"],
          ["Ошибки не-`Error` (`throw \"строка\"`) описываются как `Thrown`", "Фреймворк не падает на странных исключениях", "Потеря сообщения или исключение внутри раннера"],
        ],
        "Разбор мини-фреймворка",
      ),
      ul(
        "**Раннер — это цикл:** собрать дерево тестов (регистрация), пройти по нему по порядку, для каждого выполнить хуки и тело, записать результат.",
        "**Независимость тестов** обеспечивается тем, что фреймворк сам не хранит состояние между тестами, кроме реестра регистраций.",
        "**Отчёт — данные,** а не вывод в консоль: `{ passed, failed, skipped, results }` легко проверять и форматировать.",
      ),
    ]),

    section("internals", [
      h("Как устроен раннер"),
      steps(
        [
          ["Сбор", "Файлы тестов импортируются; вызовы `describe`/`test` регистрируют дерево наборов и тестов (ничего ещё не выполняется)."],
          ["Фильтры", "Применяются `only`, `skip`, `todo`, фильтры по имени и по шаблону файлов."],
          ["Выполнение", "Для каждого теста: `before` (один раз на набор) → цепочка `beforeEach` → тело (с тайм-аутом) → цепочка `afterEach` → `after` наборов, когда они завершены."],
          ["Изоляция", "Файлы выполняются в отдельных процессах (`node --test`), чтобы общее состояние модулей и глобальных объектов не пересекалось."],
          ["Отчёт", "События (`test:pass`, `test:fail`, `test:diagnostic`) преобразуются в формат вывода: spec, TAP, JUnit, точки."],
        ],
        "Жизненный цикл прогона",
      ),
      h("Как измеряется покрытие"),
      p("Движок V8 умеет собирать сведения о выполненных диапазонах кода (счётчики блоков и функций); раннер запускает тесты с включённым сбором и сопоставляет диапазоны с исходниками, получая строки, ветви и функции. Поэтому покрытие показывает **факт выполнения**, но ничего не знает об утверждениях (замер: 100 % у теста без проверок)."),
      h("Модули, замыкания и подмена зависимостей"),
      p("ESM-импорты привязываются к модулю один раз при загрузке; подменить импортируемую функцию «снаружи» нельзя без специального механизма (загрузчик, `mock.module` — экспериментальный). Это ещё одна причина передавать зависимости **параметрами**: тогда подмена — обычный аргумент, а не обход системы модулей."),
      h("Время и таймеры в тестах"),
      p("Управляемое время (`mock.timers`) заменяет `setTimeout`, `setInterval`, `setImmediate` и (опционально) `Date`: `tick(ms)` синхронно вызывает колбэки, срок которых наступил. Это даёт быстрые тесты, но скрывает реальные гонки; ключевые асинхронные сценарии стоит проверять и без подмены."),
      h("Почему e2e тесты медленнее и хрупче"),
      p("Они запускают настоящий браузер, сеть и всё приложение; на пути возникают рендеринг, анимации, загрузка ресурсов. Автоожидание Playwright (ждать элемент, видимость, стабильность) и подмена сети уменьшают нестабильность, но стоимость остаётся выше, чем у юнит-тестов — поэтому их мало и они проверяют **главные сценарии**."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Зависимость от времени, случайности и сети внутри функции"),
      wrongRight(
        "js",
        {
          code: `
            export function greet() {
              const hour = new Date().getHours();             // зависит от часа запуска теста
              return hour < 12 ? "Доброе утро" : "Добрый вечер";
            }
          `,
          note: "Тест проходит утром и падает вечером (замер: результат зависит от времени запуска).",
        },
        {
          code: `
            export const createGreeter = ({ now = () => new Date() } = {}) =>
              () => (now().getHours() < 12 ? "Доброе утро" : "Добрый вечер");
            // тест: createGreeter({ now: () => new Date(2024, 0, 1, 21) })() === "Добрый вечер"
          `,
          note: "Время внедряется — утро и вечер проверяются в любое время суток.",
        },
      ),
      h("Ошибка 2. Тест проверяет реализацию, а не поведение"),
      p("«Вспомогательная функция вызвана 3 раза» ломается при любом рефакторинге (замер: вариант 1 — `true`, эквивалентный вариант 2 — `false`). Проверяйте результат и наблюдаемые эффекты на границе модуля."),
      h("Ошибка 3. Тест без проверок или с неточными проверками"),
      p("Тест, вызывающий код без утверждений, даёт 100 % покрытия (замер) и ноль защиты; мутационный замер показал 1 убитый мутант из 5. Каждый тест должен проверять конкретный результат, включая границы."),
      h("Ошибка 4. Общее изменяемое состояние между тестами"),
      p("Тесты зависят от порядка: «второй» падает после «первого» (замер). Создавайте состояние заново (`beforeEach`/фабрика), не храните состояние в модульных переменных."),
      h("Ошибка 5. `sleep` вместо ожидания условия"),
      p("`await sleep(500)` — это догадка о скорости машины. Используйте автоожидание (`waitFor`, `expect.poll`), события или управляемые таймеры."),
      h("Ошибка 6. Гнаться за покрытием"),
      p("100 % у слабого теста и 90 % у сильного (замер) — показатель вводит в заблуждение. Покрытие — для поиска пропущенных веток; качество проверяют проверки и мутации."),
      h("Ошибка 7. Тестировать приватные детали и подменять всё подряд"),
      p("Если нужно подменять половину системы, чтобы проверить функцию, — модуль слишком связан. Выносите логику в чистые функции и тестируйте их напрямую."),
      h("Ошибка 8. Циклические зависимости модулей"),
      p("Чтение `const` из цикла — `ReferenceError` (замер), частично загруженный `exports` в CommonJS. Выносите общее в отдельный модуль и направляйте зависимости к ядру."),
      h("Ошибка 9. Нестабильные e2e: селекторы по классам и фиксированные паузы"),
      p("Используйте роли и доступные имена, автоожидание, подмену сети и изоляцию контекстов (замер: сообщение появляется через 300 мс — фиксированная пауза либо ломается, либо замедляет)."),
    ]),

    section("antipatterns", [
      ul(
        "**«Тест-монолит»:** один тест проверяет десять поведений — при падении неясно, что именно сломалось.",
        "**Зависимость тестов друг от друга и от порядка запуска.**",
        "**Снимок (snapshot) всего вывода без осмысленных проверок:** тесты «обновляют, чтобы прошли».",
        "**Игнорирование нестабильных тестов** (`retry` без разбора причин).",
        "**Тесты, повторяющие реализацию** (в тесте та же формула, что в коде).",
        "**Глобальные переменные, синглтоны и неявные зависимости** (`window`, `process.env`) в бизнес-логике.",
        "**Огромные «боги»-модули** и «утилитные» файлы, импортирующие всё со всем.",
        "**Тесты ради метрики** — без анализа, что именно они защищают.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Выносите логику в чистые функции;** побочные эффекты — на границе (оболочка), зависимости внедряйте параметрами и собирайте в одном месте (composition root).",
        "**Один тест — одно поведение,** шаблон Arrange–Act–Assert, понятные имена («что делает при каких условиях»).",
        "**Тестируйте границы и ошибки:** пустой ввод, крайние значения, сбои сети, битые данные, отмену.",
        "**Быстрые и детерминированные юнит-тесты:** время, случайность, сеть и файловая система — через двойники и внедрение.",
        "**Двойники по необходимости:** подделки и заглушки чаще, моки и проверка вызовов — для действительно важных взаимодействий.",
        "**Независимость:** свежее состояние на каждый тест, чистка ресурсов в `afterEach`, параллельный запуск без конфликтов.",
        "**Покрытие и мутации — вспомогательные метрики;** слабые места ищите мутационным тестированием критичной логики.",
        "**Тесты в CI на каждом изменении;** упавший тест чинят сразу, нестабильный — разбирают и изолируют, а не «перезапускают».",
      ),
      tip("Перед тем как исправлять баг, напишите тест, который его воспроизводит (красный), затем исправьте код (зелёный) и очистите (рефакторинг). Такой тест остаётся навсегда и не даёт багу вернуться."),
    ]),

    section("edge-cases", [
      h("Тесты асинхронного кода и необработанные отказы"),
      p("Тест, который не возвращает/не ожидает промис, может завершиться раньше, чем сработает проверка; отказ без обработчика приведёт к падению процесса (см. [Ошибки и отладка](/learn/js/errors-debugging)). Всегда `await` или `return` промис, используйте `assert.rejects`."),
      h("Подмена модулей и глобальных объектов"),
      p("Подмена глобальных `fetch`, `Date`, `Math.random` в тесте требует обязательного восстановления (`restore`, `mock.reset`); иначе подмена «протечёт» в соседние тесты. Предпочитайте внедрение зависимостей."),
      h("Параллельный запуск"),
      p("Раннеры выполняют файлы параллельно: тесты не должны делить порты, файлы, базы данных. Используйте временные каталоги и порт `0` (система выберет свободный)."),
      h("Тесты и источники времени"),
      p("`Date` и `performance.now()` подменяются по-разному; `AbortSignal.timeout` использует реальные таймеры — для детерминированности принимайте `signal` параметром (см. [async/await, отмена и AbortController](/learn/js/async-await-abort))."),
      h("Тестирование браузерного кода без браузера"),
      p("jsdom и подобные окружения быстры, но не реализуют раскладку, `IntersectionObserver` и многие API полностью; для поведения, зависящего от рендеринга, используйте настоящий браузер (Playwright), для чистой логики — юнит-тесты."),
      h("Тестирование времени и часовых поясов"),
      p("Даты зависят от часового пояса окружения: фиксируйте его в тестах (`TZ`), сравнивайте ISO-строки в UTC и внедряйте `now`."),
    ]),

    section("related", [
      ul(
        "[Ошибки и отладка](/learn/js/errors-debugging) — типизированные ошибки, сбор необработанных ошибок, отладка.",
        "[async/await, отмена и AbortController](/learn/js/async-await-abort) — тестирование асинхронного кода, тайм-ауты и отмена.",
        "[ES-модули и импорт](/learn/js/modules-esm) — структура модулей, циклы и публичный интерфейс.",
        "[Производительность JavaScript](/learn/js/performance) — измерение и бюджеты, мутационные и нагрузочные проверки.",
        "[Память и сборка мусора](/learn/js/memory-gc) — тесты на утечки (`checkLeak`).",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Скрытые зависимости, общее состояние и проверка реализации",
          code: `
            let cache = {};                                             // общее состояние модуля
            export async function getDiscount(userId) {
              if (cache[userId]) return cache[userId];
              const res = await fetch("/api/users/" + userId);          // сеть внутри
              const user = await res.json();
              const d = Date.now() - user.since > 3.15e10 ? 0.1 : 0;    // время внутри
              cache[userId] = d;
              return d;
            }
            // тест: подмена глобального fetch и Date.now, проверка «fetch вызван 1 раз», порядок тестов важен
          `,
          note: "Глобальные зависимости, общее изменяемое состояние, тест привязан к реализации и порядку выполнения.",
        },
        {
          title: "Чистая логика, внедрённые зависимости, состояние на экземпляр",
          code: `
            export const discountFor = (user, now) => (now - user.since > 3.15e10 ? 0.1 : 0);   // чистая функция

            export function createDiscountService({ loadUser, now = Date.now }) {
              const cache = new Map();                                                          // состояние на экземпляр
              return async (userId) => {
                if (!cache.has(userId)) cache.set(userId, discountFor(await loadUser(userId), now()));
                return cache.get(userId);
              };
            }
            // тест: createDiscountService({ loadUser: async () => ({ since: 0 }), now: () => 4e10 }) → 0.1 без сети и часов
          `,
          note: "Логика проверяется напрямую; сеть и время передаются; каждый тест создаёт свой сервис.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.testing-architecture.ex1",
      title: "Порядок хуков",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код (раздел «Минимальный пример»), запишите порядок срабатывания хуков и тестов. Затем сверьтесь с замером и объясните три правила: когда выполняются `before` и `after`, в каком порядке — `beforeEach` и `afterEach`, где окажется корневой тест."),
        code("js", `import { describe, it, before, after, beforeEach, afterEach } from "node:test";
const log = (m) => console.log("LOG: " + m);

before(() => log("корень: before"));
beforeEach(() => log("корень: beforeEach"));
afterEach(() => log("корень: afterEach"));
after(() => log("корень: after"));

describe("A", () => {
  before(() => log("A: before"));
  beforeEach(() => log("A: beforeEach"));
  afterEach(() => log("A: afterEach"));
  after(() => log("A: after"));

  it("A1", () => log("тест A1"));

  describe("B", () => {
    beforeEach(() => log("B: beforeEach"));
    afterEach(() => log("B: afterEach"));
    it("B1", () => log("тест B1"));
  });

  it("A2", () => log("тест A2"));
});

it("корневой тест", () => log("тест корневой"));`, { filename: "x1-hooks.test.mjs", collapsed: true }),
      ],
      hints: ["Сколько раз выполняется `beforeEach` корня?", "Что идёт после `A1` — вложенный набор или `A2`?"],
      checks: ["24 строки в верном порядке", "`beforeEach`: корень → A → B, `afterEach`: B → A → корень", "`before`/`after` — по одному разу на набор"],
      solution: [
        code("text", ` 1. корень: before
 2. A: before
 3. корень: beforeEach
 4. A: beforeEach
 5. тест A1
 6. A: afterEach
 7. корень: afterEach
 8. корень: beforeEach
 9. A: beforeEach
10. B: beforeEach
11. тест B1
12. B: afterEach
13. A: afterEach
14. корень: afterEach
15. корень: beforeEach
16. A: beforeEach
17. тест A2
18. A: afterEach
19. корень: afterEach
20. A: after
21. корень: beforeEach
22. тест корневой
23. корень: afterEach
24. корень: after`, { filename: "вывод Node.js 22.22.0" }),
        p("`before` корня и набора `A` выполняются один раз перед первым тестом области, `after` — после последнего. Вокруг каждого теста `beforeEach` идёт от внешнего набора к внутреннему, `afterEach` — в обратном порядке. Тесты выполняются в порядке определения: `A1`, вложенный набор `B` (`B1`), затем `A2`, потом корневой тест; хуки `A` для корневого теста не выполняются."),
      ],
    }),
    exercise({
      id: "js.testing-architecture.ex2",
      title: "«Первый» проходит, «второй» падает только в общем запуске",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("Два теста одного набора проходят по отдельности, но при запуске всех подряд второй падает. Найдите причину по замеру, предложите два способа исправления (сброс состояния и устранение общего состояния) и объясните, почему такие тесты называют нестабильными."),
        code("js", `// Тесты, зависящие от общего состояния: проходят по одному и падают вместе (или наоборот)
import { run } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "shared-"));
fs.writeFileSync(path.join(dir, "counter.mjs"), \`let value = 0;\\nexport const increment = () => ++value;\\nexport const reset = () => { value = 0; };\\n\`);
const body = (only) => \`import { test } from "node:test";
import assert from "node:assert/strict";
import { increment } from "./counter.mjs";
test("первый: после одного increment счётчик равен 1", { \${only === 1 ? "" : only ? "skip: true" : ""} }, () => assert.equal(increment(), 1));
test("второй: после одного increment счётчик равен 1", { \${only === 2 ? "" : only ? "skip: true" : ""} }, () => assert.equal(increment(), 1));
\`;
async function results(only) {
  const file = path.join(dir, \`t\${only ?? "all"}.test.mjs\`);
  fs.writeFileSync(file, body(only));
  const out = [];
  for await (const e of run({ files: [file], concurrency: false })) if ((e.type === "test:pass" || e.type === "test:fail") && !e.data.skip) out.push((e.type === "test:pass" ? "✓ " : "✗ ") + e.data.name.split(":")[0]);
  return out;
}
const show = (k, v) => console.log(k.padEnd(46), "→", JSON.stringify(v));
show("запуск всех тестов подряд", await results(null));
show("только «первый»", await results(1));
show("только «второй»", await results(2));
fs.rmSync(dir, { recursive: true });`, { filename: "x2-shared-state.mjs", collapsed: true }),
      ],
      hints: ["Где хранится значение `value` и когда оно создаётся?", "Что произойдёт, если каждый тест получит свой счётчик?"],
      checks: ["Названо общее состояние модуля", "Исправление 1: `reset()` в `beforeEach`", "Исправление 2: фабрика `createCounter()` на тест"],
      solution: [
        code("text", `запуск всех тестов подряд                      → ["✓ первый","✗ второй"]
только «первый»                                → ["✓ первый"]
только «второй»                                → ["✓ второй"]`, { filename: "вывод Node.js 22.22.0" }),
        code("js", `// Способ 1: сбрасывать состояние перед каждым тестом
beforeEach(() => reset());

// Способ 2 (лучше): не иметь общего состояния — фабрика на каждый тест
export const createCounter = () => { let value = 0; return { increment: () => ++value }; };
let counter; beforeEach(() => { counter = createCounter(); });`, { filename: "исправления" }),
        p("Состояние `value` живёт на уровне модуля и переживает тесты: второй тест видит значение после первого. Поэтому результат зависит от набора и порядка запуска — это и есть нестабильность. Надёжнее второй способ: состояние создаётся заново для каждого теста, никакого порядка нет."),
      ],
    }),
    exercise({
      id: "js.testing-architecture.ex3",
      title: "Сделайте функцию тестируемой",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Функция `weatherGreeting(city)` зависит от часов, случайности и сети — проверить её нельзя без подмены глобальных объектов. Перепишите её как `createWeatherGreeting({ now, random, fetchImpl, baseUrl, timeoutMs, tips })`: приветствие по часам (границы 5, 12, 18 часов), температура → описание (границы 0, 15, 25), адрес через `URL` и `searchParams`, тайм-аут через `AbortSignal`, мягкая деградация при HTTP-ошибке, сети и битом JSON (`погода недоступна`)."),
        code("js", `// Исходная версия: зависит от часов, случайности и сети — проверить её по-настоящему нельзя
const tips = ["возьмите зонт", "пейте воду", "проветрите комнату"];

export async function weatherGreeting(city) {
  const hour = new Date().getHours();
  const hello = hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  let weather;
  try {
    const res = await fetch("https://api.example.test/weather?city=" + city);
    const { tempC } = await res.json();
    weather = tempC + "°C";
  } catch {
    weather = "погода недоступна";
  }
  const tip = tips[Math.floor(Math.random() * tips.length)];
  return hello + "! " + city + ": " + weather + ". Совет дня: " + tip;
}`, { filename: "weather-greeting-original.mjs", collapsed: true }),
      ],
      hints: ["Какие три обращения к «миру» нужно превратить в параметры?", "Какие части можно вынести в чистые функции?", "Как построить адрес, чтобы город с пробелами и `&` не ломал запрос?"],
      checks: ["Все 10 проверок теста проходят", "Чистые функции `greetingFor` и `describeTemp` вынесены и экспортируются", "Нет обращений к `Date`, `Math.random` и `fetch` кроме значений по умолчанию"],
      solution: [
        code("js", `// Тестируемая версия: время, случайность и сеть внедряются, логика — чистые функции
const TIPS = ["возьмите зонт", "пейте воду", "проветрите комнату"];

export const greetingFor = (hour) => (hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер");
export const describeTemp = (tempC) => (tempC < 0 ? "мороз" : tempC < 15 ? "прохладно" : tempC < 25 ? "тепло" : "жарко");

export function createWeatherGreeting({ now = () => new Date(), random = Math.random, fetchImpl = globalThis.fetch, baseUrl = "https://api.example.test", timeoutMs = 2000, tips = TIPS } = {}) {
  async function loadWeather(city) {
    try {
      const url = new URL("/weather", baseUrl);
      url.searchParams.set("city", city);                                    // город кодируется, а не склеивается
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) return null;
      const { tempC } = await response.json();
      return Number.isFinite(tempC) ? \`\${tempC}°C, \${describeTemp(tempC)}\` : null;
    } catch {
      return null;                                                           // сеть, тайм-аут, битый JSON — не причина падать
    }
  }
  return async function greet(city) {
    const weather = await loadWeather(city);
    const tip = tips[Math.floor(random() * tips.length)];
    return \`\${greetingFor(now().getHours())}! \${city}: \${weather ?? "погода недоступна"}. Совет дня: \${tip}\`;
  };
}`, { filename: "weather-greeting.mjs" }),
        code("text", `✓ приветствие по часам, включая границы 4/5, 11/12, 17/18
✓ описание температуры на границах: -1, 0, 14, 15, 24, 25
✓ успешный ответ: приветствие, погода, совет по заданной «случайности»
✓ случайность внедряется: random() = 0.99 выбирает последний совет
✓ запрос: город кодируется, передаётся AbortSignal (тайм-аут)
✓ HTTP-ошибка (ok: false) → «погода недоступна», без исключения
✓ сетевая ошибка → «погода недоступна»
✓ битый JSON и ответ без числа → «погода недоступна»
✓ время суток из внедрённых часов: ночью и вечером
✓ функции независимы: два экземпляра с разными зависимостями не мешают друг другу

Все проверки пройдены: 10/10`, { filename: "результат запуска (Node.js 22.22.0)" }),
        p("Время, случайность и сеть превращены в параметры с настоящими значениями по умолчанию, поэтому в проде вызов не меняется, а тесты подставляют фиксированные часы, последовательность случайных чисел и поддельный `fetch`. Границы проверяются чистыми функциями; адрес собирается через `URL`; все сбои сводятся к «погода недоступна». Проверено мутациями: сдвиг границ часов и температуры, склейка адреса, отсутствие проверки `response.ok`, проглатывание ошибок, отсутствие `signal` и проверки числа — каждая поломка даёт красный тест."),
      ],
    }),
  ],

  challenge: {
    id: "js.testing-architecture.challenge",
    title: "Свой тест-фреймворк: createRunner и expect",
    scenario: [
      p("Чтобы понять, как устроены тесты, вам предстоит написать собственный мини-фреймворк: регистрация наборов и тестов, хуки, асинхронность, тайм-аут, `skip`/`only`, отчёт и библиотека проверок `expect`."),
    ],
    requirements: [
      "`createRunner({ timeoutMs })` возвращает `{ describe, test (it), run, beforeEach, afterEach, expect }`; `test.skip`, `test.only`",
      "`run()` выполняет тесты по порядку определения и возвращает `{ passed, failed, skipped, results }`; элементы `results` — `{ name: \"набор > вложенный > тест\", status: \"passed\" | \"failed\" | \"skipped\", error?: { name, message } }`",
      "Хуки: `beforeEach` от внешнего набора к внутреннему, `afterEach` в обратном порядке; `afterEach` выполняется и после падения теста или `beforeEach`; при падении `beforeEach` тело теста не выполняется",
      "Асинхронные тесты и хуки ожидаются; зависший тест падает с сообщением `Превышено время ожидания N мс`, таймеры снимаются; любое брошенное значение (в том числе не `Error`) записывается как падение",
      "`only`: если есть хотя бы один `only`, выполняются только они, остальные — `skipped`",
      "`expect(actual)`: `toBe` (`Object.is`), `toEqual` (структурно: прототип, ключи, `Date`, `Map`, `Set`, `NaN`; `{a: undefined}` ≠ `{}`), `toBeTruthy`/`toBeFalsy`, `toContain`, `toHaveLength`, `toBeCloseTo`, `toThrow` (без аргумента, подстрока, `RegExp`, класс), `.not`, `.resolves`, `.rejects.toThrow`",
      "Сообщения матчеров содержат ожидаемое и фактическое значения; исключение матчера — `AssertionError`",
    ],
    constraints: [
      "Без внешних библиотек (допустим `node:util` для форматирования значений)",
      "Фреймворк не хранит состояния между вызовами `run()`, кроме регистрации; тесты независимы",
    ],
    acceptance: [
      "Все 16 проверок теста проходят (3 запуска подряд)",
      "Мутации — неверный порядок `afterEach`, выполнение тела после падения `beforeEach`, `===` вместо `Object.is`, отсутствие проверки прототипа и числа ключей, игнорирование `only`, нерабочее `not`, отсутствие `clearTimeout`, пропуск проверки подстроки в `toThrow` — обнаруживаются тестом",
    ],
    hints: [
      "Что хранить при регистрации: дерево наборов или плоский список с цепочкой хуков?",
      "Как реализовать `rejects`, чтобы переиспользовать `toThrow`?",
      "Как гарантировать, что таймер тайм-аута снимается при любом исходе?",
    ],
    solution: [
      code("js", `// Мини-фреймворк тестирования: наборы, хуки, async, тайм-аут, skip/only, expect с матчерами
import { inspect } from "node:util";

export class AssertionError extends Error {
  constructor(message) { super(message); this.name = "AssertionError"; }
}
const show = (v) => inspect(v, { depth: 4, breakLength: Infinity });

export function isEqual(a, b) {                              // структурное равенство
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Map) return a.size === b.size && [...a].every(([k, v]) => b.has(k) && isEqual(v, b.get(k)));
  if (a instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v));
  const keysA = Reflect.ownKeys(a), keysB = Reflect.ownKeys(b);
  return keysA.length === keysB.length && keysA.every((k) => Object.hasOwn(b, k) && isEqual(a[k], b[k]));
}

function matchers(actual, negate = false) {
  const assert = (pass, message, notMessage) => { if (pass === negate) throw new AssertionError(negate ? notMessage : message); };
  const thrown = (fn) => { try { fn(); } catch (e) { return { threw: true, error: e }; } return { threw: false }; };
  const matchesError = (error, expected) =>
    expected === undefined ? true
    : typeof expected === "string" ? String(error?.message ?? error).includes(expected)
    : expected instanceof RegExp ? expected.test(String(error?.message ?? error))
    : typeof expected === "function" ? error instanceof expected
    : isEqual(error?.message, expected?.message);
  return {
    toBe: (expected) => assert(Object.is(actual, expected), \`Ожидалось \${show(expected)}, получено \${show(actual)}\`, \`Не ожидалось \${show(expected)}\`),
    toEqual: (expected) => assert(isEqual(actual, expected), \`Ожидалось (структурно) \${show(expected)}, получено \${show(actual)}\`, \`Значения не должны быть равны: \${show(actual)}\`),
    toBeTruthy: () => assert(Boolean(actual), \`Ожидалось истинное значение, получено \${show(actual)}\`, \`Ожидалось ложное значение, получено \${show(actual)}\`),
    toBeFalsy: () => assert(!actual, \`Ожидалось ложное значение, получено \${show(actual)}\`, \`Ожидалось истинное значение, получено \${show(actual)}\`),
    toContain: (item) => assert(typeof actual === "string" ? actual.includes(item) : [...actual].some((x) => Object.is(x, item)), \`Ожидалось, что \${show(actual)} содержит \${show(item)}\`, \`Ожидалось, что \${show(actual)} не содержит \${show(item)}\`),
    toHaveLength: (n) => assert(actual?.length === n, \`Ожидалась длина \${n}, получено \${show(actual?.length)}\`, \`Длина не должна быть \${n}\`),
    toBeCloseTo: (n, digits = 2) => assert(Math.abs(actual - n) < 10 ** -digits / 2, \`Ожидалось близкое к \${n} (знаков: \${digits}), получено \${actual}\`, \`Ожидалось не близкое к \${n}, получено \${actual}\`),
    toThrow: (expected) => {
      const r = thrown(actual);
      assert(r.threw && matchesError(r.error, expected), r.threw ? \`Брошено не то: \${show(r.error?.message ?? r.error)}\` : "Ожидалось исключение, но его не было", "Исключения не ожидалось, но оно было");
    },
  };
}

export function expect(actual) {
  const api = matchers(actual);
  api.not = matchers(actual, true);
  const lift = (promiseGetter, label) => new Proxy({}, {                         // await expect(p).rejects.toThrow() / .resolves.toBe()
    get: (_, name) => async (...args) => {
      const settled = await promiseGetter();
      return matchers(settled.value)[name](...args);
    },
  });
  api.resolves = lift(async () => ({ value: await actual }));
  api.rejects = lift(async () => { try { await actual; } catch (e) { return { value: () => { throw e; } }; } throw new AssertionError("Ожидался отказ промиса, но он выполнился"); });
  return api;
}

export function createRunner({ timeoutMs = 1000 } = {}) {
  const root = { name: "", suites: [], tests: [], before: [], after: [], parent: null, order: [] };
  let current = root, onlyUsed = false;

  function describe(name, fn) {
    const suite = { name, tests: [], before: [], after: [], parent: current, order: [] };
    current.order.push({ suite });
    const saved = current; current = suite;
    try { fn(); } finally { current = saved; }
  }
  function add(name, fn, mode) {
    if (mode === "only") onlyUsed = true;
    current.order.push({ test: { name, fn, mode, suite: current } });
  }
  const test = (name, fn) => add(name, fn, "run");
  test.skip = (name, fn) => add(name, fn, "skip");
  test.only = (name, fn) => add(name, fn, "only");

  const chain = (suite) => { const out = []; for (let s = suite; s; s = s.parent) out.unshift(s); return out; };
  const fullName = (t) => [...chain(t.suite).map((s) => s.name).filter(Boolean), t.name].join(" > ");

  function withTimeout(fn) {
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(\`Превышено время ожидания \${timeoutMs} мс\`)), timeoutMs); });
    return Promise.race([Promise.resolve().then(fn), timeout]).finally(() => clearTimeout(timer));
  }
  const describeError = (e) => (e instanceof Error ? { name: e.name, message: e.message } : { name: "Thrown", message: String(e) });

  async function runTest(t) {
    const suites = chain(t.suite);
    const result = { name: fullName(t), status: "passed" };
    const fail = (e) => { if (result.status === "passed") { result.status = "failed"; result.error = describeError(e); } };
    let prepared = true;
    for (const s of suites) for (const hook of s.before) { try { await withTimeout(hook); } catch (e) { fail(e); prepared = false; } }
    if (prepared) { try { await withTimeout(t.fn); } catch (e) { fail(e); } }        // тело теста не запускается, если упал beforeEach
    for (const s of [...suites].reverse()) for (const hook of [...s.after].reverse()) { try { await withTimeout(hook); } catch (e) { fail(e); } }
    return result;
  }

  async function run() {
    const results = [];
    async function walk(suite) {
      for (const item of suite.order) {
        if (item.suite) { await walk(item.suite); continue; }
        const t = item.test;
        const skipped = t.mode === "skip" || (onlyUsed && t.mode !== "only");
        results.push(skipped ? { name: fullName(t), status: "skipped" } : await runTest(t));
      }
    }
    await walk(root);
    const count = (s) => results.filter((r) => r.status === s).length;
    return { passed: count("passed"), failed: count("failed"), skipped: count("skipped"), results };
  }

  return {
    describe, test, it: test, run,
    beforeEach: (fn) => current.before.push(fn),
    afterEach: (fn) => current.after.push(fn),
    expect,
  };
}`, { filename: "mini-test.mjs", lineNumbers: true }),
      code("text", `✓ считает прошедшие, упавшие и пропущенные; имена вида «набор > тест»
✓ порядок хуков: beforeEach снаружи внутрь, afterEach изнутри наружу
✓ afterEach выполняется и после упавшего теста; статус остаётся failed
✓ упавший beforeEach: тело теста не выполняется, afterEach выполняется, тест failed
✓ async-тесты: ожидаются, отказ промиса — падение
✓ тайм-аут: зависший тест падает с сообщением о времени, прогон продолжается
✓ only: выполняются только отмеченные тесты, остальные — skipped
✓ toBe использует Object.is: NaN равен NaN, +0 и -0 различаются
✓ toEqual: вложенные структуры, Date, Map, Set, NaN; лишнее свойство и undefined-поле различаются
✓ toThrow: без аргумента, по подстроке, по RegExp, по классу; not.toThrow
✓ rejects и resolves для промисов
✓ toContain, toHaveLength, toBeCloseTo, toBeTruthy/Falsy и not
✓ сообщение об ошибке содержит ожидаемое и фактическое значения
✓ исключение не из Error (throw 'строка') записывается как падение с текстом
✓ тесты независимы: падение одного не мешает следующим; хуки не текут между наборами
✓ после прогона не остаётся активных таймеров (тайм-ауты снимаются)

Все проверки пройдены: 16/16`, { filename: "результат запуска (Node.js 22.22.0)" }),
      p("Регистрация строит дерево наборов (`order` хранит и тесты, и вложенные наборы в порядке определения). Для теста собирается цепочка наборов от корня: `beforeEach` выполняются в этом порядке, `afterEach` — в обратном; любое падение запоминается, но последующая очистка всё равно выполняется. Тайм-аут реализован `Promise.race` с таймером, снимаемым в `finally`. `expect` возвращает объект матчеров; `not` и общий `assert(pass, message, notMessage)` дают единую логику отрицания; `resolves`/`rejects` — `Proxy`, который ждёт промис и вызывает нужный матчер. Проверено мутациями: каждая из десяти поломок обнаруживается красной проверкой."),
    ],
  },

  interview: [
    iq("js.testing-architecture.i1", "basic", "Какие бывают виды тестов и как они соотносятся?", [
      ul(
        "Юнит — быстрая проверка небольшой части в изоляции; интеграционные — взаимодействие модулей и реальных границ (HTTP, хранилище); e2e — сценарии пользователя в браузере.",
        "Пирамида: много юнит-тестов, меньше интеграционных, мало e2e: чем выше, тем медленнее, дороже и нестабильнее.",
        "Каждый вид закрывает свой класс рисков; ни один не заменяет остальные.",
      ),
    ]),
    iq("js.testing-architecture.i2", "basic", "Что такое stub, spy, fake и mock?", [
      ul(
        "Stub — заглушка с заготовленными ответами; spy — запись вызовов и аргументов (`mock.fn`); fake — упрощённая рабочая реализация (хранилище в памяти); mock — двойник с заранее заданными ожиданиями и проверкой.",
        "Предпочитайте fake и stub; проверку вызовов (mock/spy) используйте для значимых взаимодействий — иначе тесты привязываются к реализации.",
      ),
    ]),
    iq("js.testing-architecture.i3", "intermediate", "Как сделать код, зависящий от времени и случайности, тестируемым?", [
      ul(
        "Внедрять зависимости: `now`, `random`, `fetchImpl` — параметрами с настоящими значениями по умолчанию.",
        "Выносить логику в чистые функции (`greetingFor(hour)`), которые не зависят от мира.",
        "Запасной вариант — подмена глобальных объектов (`mock.timers`), но с обязательным восстановлением.",
      ),
    ]),
    iq("js.testing-architecture.i4", "intermediate", "Достаточно ли 100 % покрытия?", [
      ul(
        "Нет: покрытие показывает выполненные строки и ветви, но не проверенные результаты (замер: слабый тест без проверок дал 100 %).",
        "Полезно для поиска непротестированных веток; качество проверяют осмысленные утверждения, границы и мутационное тестирование.",
        "Цель — уверенность в поведении, а не число.",
      ),
    ]),
    iq("js.testing-architecture.i5", "intermediate", "Что такое flaky-тест и как его лечить?", [
      ul(
        "Тест, нестабильный без изменения кода: причины — общее состояние и порядок, время и случайность, сеть и ресурсы, гонки, фиксированные паузы.",
        "Лечение: изоляция состояния (свежие объекты на тест), внедрение времени и случайности, автоожидание вместо `sleep`, уникальные ресурсы (порты, каталоги), параллельная безопасность.",
        "Не перезапускать «до зелёного», а искать причину; карантин с тикетом на исправление.",
      ),
    ]),
    iq("js.testing-architecture.i6", "advanced", "Что такое мутационное тестирование и какую проблему оно решает?", [
      ul(
        "В код вносятся мелкие дефекты (`>=` → `>`, замена констант, инверсия условий); если тесты не падают, мутант «выжил» — значит, поведение не проверено.",
        "Решает проблему «зелёных» тестов с плохими утверждениями; дополняет покрытие (замер: 1 из 5 мутантов убит слабым набором, 5 из 5 — сильным).",
        "Дорого по времени — применять к критичной логике, использовать инструменты (Stryker).",
      ),
    ]),
    iq("js.testing-architecture.i7", "engineering", "Как построить архитектуру фронтенда, удобную для тестирования?", [
      ul(
        "Слои: UI → приложение (сценарии, состояние) → домен (чистая логика); инфраструктура (API, хранилище, часы) внедряется и собирается в composition root.",
        "Чистые функции и неизменяемые данные в ядре; побочные эффекты на границе; узкие публичные интерфейсы модулей; отсутствие циклов.",
        "Тесты: много юнит-тестов домена, интеграционные на границах, мало e2e по ключевым сценариям; контракты API проверяются на границе.",
      ),
    ]),
    iq("js.testing-architecture.i8", "debugging", "Тесты проходят локально и падают в CI. Что проверять?", [
      ul(
        "Различия окружений: часовой пояс, локаль, версии Node/браузера, переменные окружения, ресурсы CPU/сети (тайм-ауты, гонки).",
        "Порядок и параллельность запуска, общее состояние, занятые порты/файлы, зависимость от времени и случайности.",
        "Воспроизвести локально (та же версия, `TZ`, `--test-concurrency`, повтор N раз), включить трассировки/скриншоты и логи; устранить причину, а не перезапускать.",
      ),
    ]),
  ],

  exam: [
    mcq("js.testing-architecture.e1", "foundation", "Какой из тестовых двойников записывает вызовы функции?", ["Stub", "Fake", "Spy", "Dummy"], 2, "Spy (`mock.fn`) хранит число вызовов и аргументы (`callCount()`, `calls[0].arguments`)."),
    mcq("js.testing-architecture.e2", "foundation", "Что означает, что тесты независимы?", ["Результат каждого не зависит от других тестов и порядка запуска", "Они выполняются параллельно", "Они не используют двойники", "Они лежат в разных файлах"], 0, "Независимые тесты не делят изменяемое состояние (замер: общее состояние дало «✓ первый, ✗ второй» только при запуске подряд)."),
    mcq("js.testing-architecture.e3", "intermediate", "Какой вариант делает функцию с `new Date()` тестируемой?", ["Подменить `Date` глобально навсегда", "Тестировать только вечером", "Использовать `sleep` в тесте", "Принять `now` параметром (с `() => new Date()` по умолчанию)"], 3, "Внедрение зависимости даёт детерминированный тест в любое время суток; глобальная подмена — запасной вариант."),
    mcq("js.testing-architecture.e4", "intermediate", "Что показал замер покрытия?", ["Сильный тест всегда покрывает больше", "Слабый тест — 100 %, сильный — 90 %", "Покрытие гарантирует отсутствие ошибок", "Покрытие нельзя получить в Node.js"], 1, "Тест без проверок выполнил все строки (100 %), а сильный не выполнил ветку «дёшево» (90 %), но проверяет результаты."),
    mcq("js.testing-architecture.e5", "intermediate", "Что делает «выживший мутант»?", ["Означает, что тесты хорошие", "Нужен только для e2e", "Ускоряет тесты", "Показывает, что внесённое изменение не обнаружено тестами"], 3, "Если тесты проходят на испорченном коде, соответствующее поведение не проверяется (слабый набор убил лишь 1 из 5)."),
    mcq("js.testing-architecture.e6", "advanced", "Что произойдёт при чтении `const a` из циклической зависимости ESM до его инициализации?", ["`undefined`", "Пустой объект", "`ReferenceError: Cannot access 'a' before initialization`", "Ничего"], 2, "Экспорт `const` находится в TDZ; функции-объявления доступны (замер); в CommonJS модуль получит неполный `exports`."),
    mcq("js.testing-architecture.e7", "advanced", "Что верно про e2e-тесты в Playwright? Выберите все.", ["Локаторы по роли устойчивее селекторов по классам", "Фиксированные паузы надёжнее автоожидания", "Подмена сети позволяет проверять состояния ошибок", "Новый контекст браузера изолирует `localStorage`"], [0, 2, 3], "Замеры: `getByRole`, `route` с ответом 500, `localStorage` в другом контексте пуст; автоожидание надёжнее `sleep`."),
    open("js.testing-architecture.e8", "intermediate", "Опишите, как вы организуете тестирование модуля, который загружает данные по сети, зависит от времени и показывает результат в DOM.", [
      ul(
        "Разделить: чистая логика (преобразование данных, правила), слой данных (`fetchImpl` и `now` внедряются), слой отображения (DOM).",
        "Юнит-тесты логики без двойников; тесты слоя данных с поддельным `fetch` (успех, HTTP-ошибка, сеть, битый JSON, тайм-аут, отмена); время через `now`/управляемые таймеры.",
        "Интеграционный/e2e: сценарий в браузере с подменой сети, автоожиданием, ролями; состояния загрузки и ошибки.",
        "Изоляция и независимость, CI, покрытие как вспомогательная метрика, мутационный замер критичной логики.",
      ),
    ], ["Названо разделение логики и побочных эффектов", "Названы двойники для сети и времени", "Названы сценарии отказов", "Упомянуты e2e и изоляция"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.testing-architecture.m1", "intermediate", "Какой набор проверок надёжнее для функции `shippingCost(total, isMember)`?", ["Один «счастливый» сценарий", "Границы (`4999`/`5000`), оба вида клиентов, пустая корзина", "Только случайные значения", "Только вызов без утверждений"], 1, "Сильный набор убил все 5 мутантов, слабый — 1: границы и оба класса данных нужны (замер)."),
    mcq("js.testing-architecture.m2", "advanced", "Когда подмена глобального времени (`mock.timers` с `Date`) оправдана?", ["Когда код нельзя изменить (унаследованный) или нужен тест вызовов таймеров; обязательно восстановить подмену", "Всегда лучше внедрения зависимостей", "Никогда", "Только в e2e"], 0, "Внедрение времени чище, но подмена полезна для унаследованного кода и таймерной логики; её нужно восстанавливать (`mock.reset`)."),
    open("js.testing-architecture.m3", "advanced", "В проекте нарастают циклические зависимости между модулями `cart`, `user` и `pricing`, а тесты требуют сложных подмен. Опишите, как вы перестроите архитектуру.", [
      ul(
        "Найти циклы (`import/no-cycle`, граф зависимостей), понять причину: общие типы/константы, взаимные вызовы, смешение слоёв.",
        "Вынести общее в отдельные модули нижнего слоя (типы, правила цен); направить зависимости к домену; ввести интерфейсы/параметры вместо прямых импортов («зависимость от абстракции»).",
        "Чистое ядро: расчёт цен — чистые функции; побочные эффекты (API, хранилище, события) — в оболочке; сборка в composition root.",
        "Тесты: юнит-тесты ядра без подмен, интеграционные по границам; запретить новые циклы в CI; описать решение (ADR).",
      ),
    ], ["Описан поиск циклов и причина", "Описано выделение общего слоя и направление зависимостей", "Описаны чистое ядро и DI", "Описаны тесты и защита от регрессии"], { format: "architecture" }),
    open("js.testing-architecture.m4", "advanced", "Тест проходит в 9 из 10 запусков. Постройте план диагностики и устранения нестабильности.", [
      ul(
        "Сначала воспроизвести: запустить тест 50–100 раз, в случайном порядке и параллельно; записать, на каком шаге и с каким сообщением падает.",
        "Гипотезы: общее состояние/порядок; время и случайность; гонки и ожидание без условия (`sleep`); внешние ресурсы (порт, файл, сеть); зависимость от окружения (TZ, локаль).",
        "Проверка: фиксировать время/случайность, изолировать состояние, заменить паузы ожиданием условия, использовать уникальные ресурсы; добавить логи/трассировки/скриншоты.",
        "Исправить причину и закрепить: цикл повторных запусков в CI для затронутого теста; не использовать слепые `retry`.",
      ),
    ], ["Описано воспроизведение серией запусков", "Названы типичные причины", "Описаны исправления", "Названа защита от возврата"], { format: "debug" }),
  ],

  flashcards: [
    { id: "js.testing-architecture.f1", front: "Виды тестов?", back: "Юнит (быстро, точно), интеграционные (границы), e2e (сценарии в браузере). Пирамида: много юнит, мало e2e." },
    { id: "js.testing-architecture.f2", front: "Двойники?", back: "Stub — заготовленные ответы; spy — запись вызовов (mock.fn); fake — упрощённая рабочая реализация; mock — ожидания + verify." },
    { id: "js.testing-architecture.f3", front: "DI?", back: "Время, случайность, сеть — параметрами (now, random, fetchImpl) с настоящими значениями по умолчанию; логика — чистые функции." },
    { id: "js.testing-architecture.f4", front: "Покрытие?", back: "Показывает выполнение, не проверку: слабый тест 100 %, сильный 90 %. Используйте для поиска непроверенных веток." },
    { id: "js.testing-architecture.f5", front: "Мутационные тесты?", back: "Портим код (>= → >, 0 → 1); выживший мутант = слабые проверки. Слабый набор убил 1 из 5, сильный — 5 из 5." },
    { id: "js.testing-architecture.f6", front: "Flaky?", back: "Общее состояние/порядок, время, случайность, сеть, sleep. Лечение: изоляция, DI, автоожидание, уникальные ресурсы." },
    { id: "js.testing-architecture.f7", front: "Хуки node:test?", back: "before/after — раз на набор; beforeEach снаружи внутрь, afterEach изнутри наружу; skip хуки не запускает." },
    { id: "js.testing-architecture.f8", front: "Циклы модулей?", back: "ESM: const из цикла — TDZ (ReferenceError), функции доступны; CJS: неполный exports. Лечение: вынести общее в третий модуль." },
  ],

  sources: [
    { title: "Node.js: Test runner (node:test)", url: "https://nodejs.org/api/test.html", publisher: "Other" },
    { title: "Node.js: Assert (node:assert)", url: "https://nodejs.org/api/assert.html", publisher: "Other" },
    { title: "Node.js: Mocking (mock.fn, mock.timers)", url: "https://nodejs.org/api/test.html#mocking", publisher: "Other" },
    { title: "Playwright: Writing tests (locators, auto-waiting)", url: "https://playwright.dev/docs/writing-tests", publisher: "Other" },
    { title: "Playwright: Network mocking", url: "https://playwright.dev/docs/mock", publisher: "Other" },
    { title: "Playwright: Isolation (browser contexts)", url: "https://playwright.dev/docs/browser-contexts", publisher: "Other" },
    { title: "ECMAScript: Modules (циклические зависимости)", url: "https://tc39.es/ecma262/#sec-modules", publisher: "ECMA" },
    { title: "MDN: Test your JavaScript", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Testing", publisher: "MDN" },
    { title: "MDN: JavaScript modules", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules", publisher: "MDN" },
    { title: "Martin Fowler: Mocks Aren't Stubs", url: "https://martinfowler.com/articles/mocksArentStubs.html", publisher: "Other" },
    { title: "Martin Fowler: Test Pyramid", url: "https://martinfowler.com/bliki/TestPyramid.html", publisher: "Other" },
  ],
};
