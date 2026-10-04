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
  steps,
  section,
  mcq,
  open,
  iq,
  exercise,
} from "../../dsl";

export const domEvents: Topic = {
  id: "js.dom-events",
  slug: "dom-events",
  domain: "js",
  module: "browser",
  title: "DOM и события: всплытие и делегирование",
  titleEn: "DOM and events: propagation and delegation",
  summary:
    "Событие в браузере проходит три фазы — погружение, цель, всплытие, — и именно на этом держатся делегирование, `stopPropagation` и «клик вне меню». Тема на замерах в Chromium 141 разбирает `addEventListener` (`once`, `passive`, `capture`, `signal`, `handleEvent`), разницу `target` и `currentTarget`, порядок обработчиков на цели, события, которые не всплывают (`focus`, `mouseenter`), `preventDefault` и пассивные слушатели, `CustomEvent` и `composed` в теневом DOM, а также безопасную работу с DOM: живые и статические коллекции, `textContent` против `innerHTML`, `<template>` и фрагменты. В конце вы пишете универсальный `delegate()` и выпадающее меню без утечек слушателей.",
  minutes: 100,
  prerequisites: ["js.event-loop", "html.parsing-dom"],
  tags: ["DOM", "events", "addEventListener", "bubbling", "capturing", "delegation", "target", "currentTarget", "closest", "preventDefault", "stopPropagation", "CustomEvent", "composedPath", "passive", "AbortSignal", "innerHTML", "textContent", "HTMLCollection"],
  keyConcepts: [
    { term: "Три фазы: погружение → цель → всплытие", text: "Клик по кнопке `#inner` идёт `outer:capture → middle:capture → inner → middle:bubble → outer:bubble`. Обычный слушатель срабатывает на всплытии, `capture: true` — на погружении." },
    { term: "`target` и `currentTarget`", text: "`target` — элемент, где событие возникло (вложенный `<span>`), `currentTarget` (и `this` в обычной функции) — тот, на ком висит исполняемый слушатель. Стрелочная функция `this` не получает." },
    { term: "Делегирование = один слушатель на корне", text: "Подписываемся на контейнер и находим нужный элемент через `e.target.closest(селектор)`, проверяя `container.contains(найденный)`. Работает и для элементов, добавленных позже: на 200 задач — 1 подписка вместо 400." },
    { term: "Не всё всплывает", text: "`focus`, `blur`, `mouseenter`, `mouseleave` не всплывают (`bubbles=false`) — делегируйте через `focusin`/`focusout` или `mouseover`/`mouseout`, либо ловите на погружении." },
    { term: "`preventDefault` ≠ `stopPropagation`", text: "`preventDefault()` отменяет действие браузера по умолчанию (переход по ссылке) — только у отменяемых событий и не в пассивных слушателях. `stopPropagation()` останавливает путь события, но не отменяет остальные слушатели на текущем элементе; для этого есть `stopImmediatePropagation()`." },
    { term: "`dispatchEvent` синхронен", text: "Все слушатели `CustomEvent` отрабатывают до возврата из `dispatchEvent`, и он вернёт `false`, если слушатель вызвал `preventDefault()` у отменяемого (`cancelable: true`) события." },
  ],
  sections: [
    section("definition", [
      def("DOM-событие", "Объект `Event`, который браузер или код создаёт и «отправляет» узлу-цели; у него есть тип (`click`), цель (`target`), фаза (`eventPhase`) и флаги `bubbles`, `cancelable`, `composed`.", "DOM event"),
      def("Слушатель (обработчик)", "Функция или объект с методом `handleEvent`, зарегистрированные через `addEventListener(type, listener, options)` на `EventTarget`.", "event listener"),
      def("Фазы события", "Погружение (capture) — от `window` к цели, цель (target), всплытие (bubble) — обратно к `window`. Путь определяется один раз при отправке события.", "capture, target, bubble"),
      def("`target` и `currentTarget`", "`event.target` — самый глубокий узел пути (источник); `event.currentTarget` — узел, чей слушатель сейчас выполняется. После завершения диспетчеризации `currentTarget` становится `null`.", "event.target / currentTarget"),
      def("Делегирование событий", "Приём: один слушатель на общем предке обрабатывает события множества потомков, определяя источник по `event.target`.", "event delegation"),
      def("Действие по умолчанию", "То, что браузер делает после события: переход по ссылке, отправка формы, прокрутка. Отменяется `preventDefault()`, если событие `cancelable` и слушатель не пассивный.", "default action"),
      def("`CustomEvent`", "Событие, создаваемое кодом: `new CustomEvent(type, { detail, bubbles, cancelable, composed })`. Данные передаются в `detail`.", "CustomEvent"),
      def("Живая и статическая коллекция", "`HTMLCollection` (`getElementsByClassName`, `children`) отражает изменения DOM автоматически; `NodeList` из `querySelectorAll` — снимок на момент вызова.", "live / static collection"),
    ]),

    section("why", [
      h("Интерфейс — это реакция на события"),
      p("Любая интерактивность браузера — клики, ввод, фокус, прокрутка, отправка форм — построена на событиях. Понимание пути события отвечает на повседневные вопросы: почему клик по иконке внутри кнопки «не срабатывает», почему обработчик вызывается три раза, почему меню закрывается в тот же момент, когда открылось, почему `preventDefault()` «не работает», почему список с тысячей строк тормозит и протекает."),
      ul(
        "**Корректность:** правильно определять, по какому элементу кликнули (`closest`, а не `target`), не дублировать подписки при перерисовке, отменять действия браузера там, где это допустимо.",
        "**Производительность и память:** делегирование заменяет сотни подписок одной (замер на 200 задачах: делегирование — 1 подписка, прямые слушатели — 400); `signal` снимает слушатели одним вызовом.",
        "**Безопасность:** `textContent` не превращает пользовательский текст в разметку, `innerHTML` — превращает (замер: `onerror` сработал).",
        "**Архитектура:** `CustomEvent` развязывает модули — компонент сообщает «что случилось», не зная, кто слушает.",
      ),
      insight("Событие — это **путь** по дереву. Вы не подписываетесь на «кнопку», вы выбираете точку на пути и фазу, где перехватите событие. Всё остальное — следствие."),
    ]),

    section("mental-model", [
      p("**Событие — это посылка, которую курьер несёт по подъезду.** Клик произошёл на квартире `#inner`. Сначала курьер **спускается** с крыши (`window`, `document`, `html`, `body`, `#outer`, `#middle`) — на каждом этаже консьерж может перехватить посылку (слушатели `capture`). Потом посылка у адресата (`#inner`). Затем курьер **поднимается** обратно, и каждый консьерж может расписаться ещё раз (обычные слушатели). Консьерж с красной печатью (`stopPropagation`) не пускает курьера дальше; печать «не вскрывать» (`preventDefault`) запрещает жильцу открыть посылку так, как она открывается по умолчанию (перейти по ссылке). **Делегирование** — это один консьерж на первом этаже, который расписывается за все квартиры подъезда и по накладной (`event.target`) знает, к кому шла посылка."),
      table(
        ["Свойство / метод", "Что говорит", "Пример из замера"],
        [
          ["`event.target`", "Где событие возникло (самый глубокий элемент)", "Клик по `<span id=label>` внутри кнопки: `target=#label`"],
          ["`event.currentTarget` / `this`", "Чей слушатель выполняется сейчас", "`currentTarget=#btn`, `this === currentTarget` (обычная функция)"],
          ["`event.eventPhase`", "1 — погружение, 2 — цель, 3 — всплытие", "`outer capture (фаза capture)` … `inner bubble (фаза target)`"],
          ["`event.bubbles` / `cancelable` / `composed`", "Всплывает ли, можно ли отменить, пересекает ли границу теневого DOM", "`focus`: `bubbles=false`; `focusin`: `bubbles=true`"],
          ["`event.composedPath()`", "Полный путь события от цели до `window`", "`inner → middle → outer → BODY → HTML → #document → window`"],
          ["`event.isTrusted`", "Создано пользователем (`true`) или кодом (`false`)", "`b.click()` → `false`, настоящий клик → `true`"],
        ],
        "Основные свойства события",
      ),
    ]),

    section("technical", [
      h("Подписка: `addEventListener` и её параметры"),
      code("html", `<button id="btn"><span id="label">Нажми</span></button>
<script>
  const log = [];
  const btn = document.querySelector("#btn");

  // 1. Объект события и this
  btn.addEventListener("click", function (e) {
    log.push(\`regular: target=#\${e.target.id}, currentTarget=#\${e.currentTarget.id}, this===currentTarget: \${this === e.currentTarget}\`);
  });
  btn.addEventListener("click", (e) => {
    log.push(\`arrow: this===window: \${this === window}, currentTarget=#\${e.currentTarget.id}\`);
  });

  // 2. Объект с handleEvent: this — сам объект
  const counter = {
    n: 0,
    handleEvent(e) { this.n++; log.push(\`handleEvent: n=\${this.n}, type=\${e.type}\`); },
  };
  btn.addEventListener("click", counter);

  // 3. once: сработает один раз
  btn.addEventListener("click", () => log.push("once"), { once: true });

  // 4. Одна и та же функция дважды — подписка одна
  function same() { log.push("same"); }
  btn.addEventListener("click", same);
  btn.addEventListener("click", same);

  // 5. Анонимную функцию не снять, именованную — можно
  btn.addEventListener("click", () => log.push("anon"));
  btn.removeEventListener("click", () => log.push("anon")); // другая функция — ничего не снимает
  function removable() { log.push("removable"); }
  btn.addEventListener("click", removable);
  btn.removeEventListener("click", removable);

  // 6. Снятие через AbortSignal
  const ac = new AbortController();
  btn.addEventListener("click", () => log.push("signal"), { signal: ac.signal });

  // 7. Свойство onclick — одно место
  btn.onclick = () => log.push("onclick #1");
  btn.onclick = () => log.push("onclick #2 (заменил #1)");

  window.run = (label, fn) => { log.length = 0; fn(); return \`\${label}:\\n  \` + log.join("\\n  "); };
  window.stopSignal = () => ac.abort();
</script>`, { filename: "ev1-listeners.html", lineNumbers: true, collapsed: true }),
      code("text", `клик по вложенному <span>:
  regular: target=#label, currentTarget=#btn, this===currentTarget: true
  arrow: this===window: true, currentTarget=#btn
  handleEvent: n=1, type=click
  once
  same
  anon
  signal
  onclick #2 (заменил #1)
второй клик (once и removable уже не сработали):
  regular: target=#label, currentTarget=#btn, this===currentTarget: true
  arrow: this===window: true, currentTarget=#btn
  handleEvent: n=2, type=click
  same
  anon
  signal
  onclick #2 (заменил #1)
после abort() сигнала:
  regular: target=#label, currentTarget=#btn, this===currentTarget: true
  arrow: this===window: true, currentTarget=#btn
  handleEvent: n=3, type=click
  same
  anon
  onclick #2 (заменил #1)
ошибки страницы: []`, { filename: "замер в Chromium 141 (клик по вложенному span)" }),
      ul(
        "**`target` и `currentTarget`:** клик по `#label` внутри кнопки — `target=#label`, `currentTarget=#btn`; в обычной функции `this === currentTarget` (`true`), в стрелочной `this` — внешний (`window`), поэтому в стрелке используйте `e.currentTarget`.",
        "**Порядок:** слушатели вызываются в порядке регистрации; свойство `onclick` занимает своё место при первом присваивании, а повторное присваивание **заменяет** предыдущий обработчик (`onclick #2 (заменил #1)`), тогда как `addEventListener` добавляет.",
        "**`handleEvent`:** объект с таким методом тоже годится как слушатель; `this` внутри — сам объект (`n=1, 2, 3` растёт между кликами).",
        "**`once: true`:** слушатель срабатывает один раз и снимается автоматически (во втором клике «once» нет).",
        "**Дубликаты:** одна и та же функция на тот же тип и с тем же `capture` регистрируется один раз (`same` напечатан однажды).",
        "**Снятие:** `removeEventListener` требует **ту же** функцию (анонимную стрелку не снять — `anon` продолжает срабатывать, а именованная `removable` снята) и тот же `capture`.",
        "**`signal`:** после `abort()` слушатель с `{ signal }` снят (`signal` исчез из вывода третьего клика) — удобный способ снять много подписок разом.",
      ),

      h("Распространение: погружение, цель, всплытие"),
      code("html", `<style>
  #outer, #middle { padding: 20px; border: 1px solid #888; }
  #outer { width: 360px; }
</style>
<div id="outer">
  <div id="middle">
    <button id="inner">Кнопка</button>
  </div>
  <a id="link" href="#moved">ссылка</a>
</div>
<script>
  const log = [];
  const phase = ["", "capture", "target", "bubble"];
  const $ = (id) => document.getElementById(id);

  // Слушатели на всех трёх уровнях: и на погружении (capture), и на всплытии
  for (const id of ["outer", "middle", "inner"]) {
    $(id).addEventListener("click", (e) => log.push(\`\${id} capture  (фаза \${phase[e.eventPhase]})\`), true);
    $(id).addEventListener("click", (e) => log.push(\`\${id} bubble   (фаза \${phase[e.eventPhase]})\`));
  }

  window.run = {
    reset() { log.length = 0; },
    log() { return log.join("\\n"); },
    stop(at) { // остановить распространение на элементе \`at\` (фаза всплытия)
      const h = (e) => { log.push(\`stopPropagation на \${at}\`); e.stopPropagation(); };
      $(at).addEventListener("click", h, { once: true });
    },
    stopImmediate() { // два слушателя на одном элементе
      $("inner").addEventListener("click", (e) => { log.push("inner: первый (stopImmediatePropagation)"); e.stopImmediatePropagation(); }, { once: true });
      const second = () => log.push("inner: второй — не сработает");
      $("inner").addEventListener("click", second, { once: true });
      setTimeout(() => $("inner").removeEventListener("click", second), 0);
    },
    prevent() {
      $("link").addEventListener("click", (e) => { log.push(\`link: cancelable=\${e.cancelable}, до preventDefault: \${e.defaultPrevented}\`); e.preventDefault(); log.push(\`после preventDefault: \${e.defaultPrevented}\`); }, { once: true });
    },
    path() { $("inner").addEventListener("click", (e) => log.push("composedPath: " + e.composedPath().map((n) => n.id || n.nodeName || "window").join(" → ")), { once: true }); },
  };
</script>`, { filename: "ev2-propagation.html", collapsed: true }),
      code("text", `клик по кнопке (погружение → цель → всплытие):
  outer capture  (фаза capture)
  middle capture  (фаза capture)
  inner capture  (фаза target)
  inner bubble   (фаза target)
  middle bubble   (фаза bubble)
  outer bubble   (фаза bubble)
клик по рамке #middle (потомок #inner не участвует):
  outer capture  (фаза capture)
  middle capture  (фаза target)
  middle bubble   (фаза target)
  outer bubble   (фаза bubble)
stopPropagation на #middle (после слушателя «middle bubble»):
  outer capture  (фаза capture)
  middle capture  (фаза capture)
  inner capture  (фаза target)
  inner bubble   (фаза target)
  middle bubble   (фаза bubble)
  stopPropagation на middle
composedPath:
  outer capture  (фаза capture)
  middle capture  (фаза capture)
  inner capture  (фаза target)
  inner bubble   (фаза target)
  composedPath: inner → middle → outer → BODY → HTML → #document → window
  middle bubble   (фаза bubble)
  outer bubble   (фаза bubble)
preventDefault у ссылки:
  outer capture  (фаза capture)
  link: cancelable=true, до preventDefault: false
  после preventDefault: true
  outer bubble   (фаза bubble)
  адрес остался без #moved: true
stopImmediatePropagation на #inner:
  outer capture  (фаза capture)
  middle capture  (фаза capture)
  inner capture  (фаза target)
  inner bubble   (фаза target)
  inner: первый (stopImmediatePropagation)
ошибки: []`, { filename: "замер в Chromium 141" }),
      ul(
        "**Путь:** `outer capture → middle capture → inner (target) → middle bubble → outer bubble`. Фазы: `capture` у предков до цели, `target` у самой цели, `bubble` у предков после.",
        "**Клик по рамке `#middle`:** потомок `#inner` в пути не участвует — путь строится от реальной цели вверх.",
        "**`stopPropagation()`:** остановил всплытие выше `#middle` (`outer bubble` нет), но другие слушатели того же элемента отработали (`middle bubble` — до остановки, потому что был зарегистрирован раньше).",
        "**`stopImmediatePropagation()`:** прекращает и **остальные слушатели на этом же элементе** (второй слушатель на `#inner` не вызван).",
        "**`preventDefault()`:** событие `click` по ссылке отменяемое (`cancelable=true`); после вызова `defaultPrevented=true`, адрес остался без `#moved`. Распространение при этом **продолжается** (`outer bubble` напечатан).",
        "**`composedPath()`** возвращает весь путь, включая `document` и `window`.",
      ),
      h("События, которые не всплывают, и порядок на цели"),
      code("html", `<style>
  #box { padding: 10px; }
  #parent { width: 200px; height: 80px; background: #eef; padding: 10px; margin-top: 20px; }
  #child { display: block; width: 100px; height: 40px; background: #cce; }
</style>
<div id="box">
  <input id="field">
  <div id="parent"><span id="child">дочерний</span></div>
</div>
<script>
  const log = [];
  const box = document.getElementById("box");
  const parent = document.getElementById("parent");
  const note = (name) => (e) => log.push(\`\${name} → target=\${e.target.id}, currentTarget=\${e.currentTarget.id}, bubbles=\${e.bubbles}\`);

  // На внешнем контейнере — подписки на события фокуса
  box.addEventListener("focus", note("box: focus (всплытие)"));
  box.addEventListener("focus", note("box: focus (погружение)"), true);
  box.addEventListener("focusin", note("box: focusin"));
  box.addEventListener("blur", note("box: blur (всплытие)"));
  box.addEventListener("focusout", note("box: focusout"));

  // На родителе — события наведения
  for (const type of ["mouseenter", "mouseover", "mouseleave", "mouseout"]) {
    parent.addEventListener(type, note("parent: " + type));
  }

  // Порядок слушателей на самой цели: сначала зарегистрирован «bubble», затем «capture»
  const field = document.getElementById("field");
  field.addEventListener("keydown", () => log.push("field: слушатель всплытия (зарегистрирован первым)"));
  field.addEventListener("keydown", () => log.push("field: слушатель погружения (зарегистрирован вторым)"), true);

  window.run = { reset() { log.length = 0; }, log() { return log.join("\\n"); } };
</script>`, { filename: "ev2b-nonbubbling.html", collapsed: true }),
      code("text", `фокус на поле:
  box: focus (погружение) → target=field, currentTarget=box, bubbles=false
  box: focusin → target=field, currentTarget=box, bubbles=true
потеря фокуса:
  box: focusout → target=field, currentTarget=box, bubbles=true
нажатие клавиши в поле (порядок слушателей на цели):
  field: слушатель погружения (зарегистрирован вторым)
  field: слушатель всплытия (зарегистрирован первым)
курсор вошёл в #parent:
  parent: mouseover → target=parent, currentTarget=parent, bubbles=true
  parent: mouseenter → target=parent, currentTarget=parent, bubbles=false
курсор перешёл на дочерний #child:
  parent: mouseout → target=parent, currentTarget=parent, bubbles=true
  parent: mouseover → target=child, currentTarget=parent, bubbles=true
курсор ушёл:
  parent: mouseout → target=child, currentTarget=parent, bubbles=true
  parent: mouseleave → target=parent, currentTarget=parent, bubbles=false
ошибки: []`, { filename: "замер в Chromium 141 (реальные фокус, клавиатура и мышь)" }),
      ul(
        "**`focus` не всплывает** (`bubbles=false`): слушатель на предке без `capture` его не увидит, а слушатель на погружении — увидит. **`focusin`/`focusout` всплывают** и годятся для делегирования.",
        "**`mouseenter`/`mouseleave` не всплывают и не срабатывают при переходе внутрь потомков**; `mouseover`/`mouseout` всплывают и срабатывают на каждом переходе между потомками (при переходе на `#child`: `mouseout` у `#parent` и `mouseover` с `target=#child`). Чтобы эмулировать вход/выход при делегировании, сравнивают `relatedTarget`.",
        "**Порядок на самой цели:** слушатель погружения сработал **раньше** слушателя всплытия, хотя был зарегистрирован позже — в Chromium 141 на цели сначала идут все `capture`-слушатели, затем остальные.",
      ),

      h("Делегирование"),
      code("html", `<ul id="list"></ul>
<ul id="direct"></ul>
<div id="outside"><button data-action="remove" id="stranger">чужая кнопка</button></div>
<!-- Виджет внутри элемента, который тоже подходит под селектор -->
<div id="card" data-action="open-card"><div id="widget"><span id="w-text">внутри виджета</span></div></div>
<script>
  // Счётчик подписок (для измерения): оборачиваем addEventListener
  let subscriptions = 0;
  const original = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (...args) {
    if (this instanceof Element) subscriptions++;
    return original.apply(this, args);
  };

  const log = [];
  const list = document.getElementById("list");
  const direct = document.getElementById("direct");

  function itemHtml(title) {
    return \`<li><span class="title">\${title}</span>
      <button data-action="done"><span class="icon">✓</span> готово</button>
      <button data-action="remove"><span class="icon">✕</span></button></li>\`;
  }

  // Вариант 1: делегирование — один слушатель на контейнере
  list.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button || !list.contains(button)) return; // клик мимо кнопок или кнопка вне списка
    const li = button.closest("li");
    log.push(\`делегирование: \${button.dataset.action} → «\${li.querySelector(".title").textContent}» (e.target=\${e.target.className || e.target.tagName.toLowerCase()})\`);
    if (button.dataset.action === "remove") li.remove();
  });

  // Вариант 2: слушатель на каждой кнопке
  function addDirect(title) {
    direct.insertAdjacentHTML("beforeend", itemHtml(title));
    for (const b of direct.lastElementChild.querySelectorAll("button")) {
      b.addEventListener("click", () => log.push(\`прямой слушатель: \${b.dataset.action} → «\${title}»\`));
    }
  }

  // Ловушка closest: он поднимается выше корня делегирования
  const widget = document.getElementById("widget");
  widget.addEventListener("click", (e) => {
    const hit = e.target.closest("[data-action]");
    if (hit) log.push(\`без проверки contains: найден «\${hit.dataset.action}» (внутри виджета: \${widget.contains(hit)})\`);
  });
  widget.addEventListener("click", (e) => {
    const hit = e.target.closest("[data-action]");
    if (!hit || !widget.contains(hit)) { log.push("с проверкой contains: клик проигнорирован"); return; }
    log.push(\`с проверкой contains: найден «\${hit.dataset.action}»\`);
  });

  window.run = {
    reset() { log.length = 0; },
    log() { return log.join("\\n"); },
    fill(n) {
      for (let i = 1; i <= n; i++) { list.insertAdjacentHTML("beforeend", itemHtml("задача " + i)); addDirect("задача " + i); }
    },
    add(title) { list.insertAdjacentHTML("beforeend", itemHtml(title)); },
    counts() { return { подписок: subscriptions, элементовСписка: list.children.length, элементовПрямого: direct.children.length }; },
    clearDirect() { direct.replaceChildren(); },
  };
</script>`, { filename: "ev3-delegation.html", collapsed: true }),
      code("text", `200 задач: {"подписок":403,"элементовСписка":200,"элементовПрямого":200}
клик по иконке внутри кнопки «готово» (делегирование):
  делегирование: done → «задача 3» (e.target=icon)
то же при прямых слушателях:
  прямой слушатель: done → «задача 3»
элемент, добавленный после подписки (делегирование):
  делегирование: done → «добавлена позже» (e.target=button)
кнопка вне списка (слушатель не реагирует):
  
клик внутри виджета, вложенного в подходящий элемент:
  без проверки contains: найден «open-card» (внутри виджета: false)
  с проверкой contains: клик проигнорирован
клик по заголовку (не кнопка):
  
удаление задачи 2:
  делегирование: remove → «задача 2» (e.target=icon)
в списке осталось: 200
ошибки: []`, { filename: "замер в Chromium 141 (200 задач)" }),
      ul(
        "**Экономия подписок:** 200 задач — делегирование даёт **1** подписку, прямые слушатели — **400** (всего `401`).",
        "**Динамические элементы:** строка «добавлена позже» обрабатывается без новой подписки.",
        "**`closest` вместо `target`:** клик по `<span class=icon>` внутри кнопки (`e.target=icon`) всё равно находит кнопку: `e.target.closest(\"button[data-action]\")`.",
        "**Проверка `root.contains(найденный)`:** `closest` поднимается по всему дереву, в том числе выше корня делегирования. Виджет, вложенный в элемент `[data-action]`, без проверки получил бы чужое действие `open-card`; с проверкой клик игнорируется.",
        "**Клик мимо кнопок** (по заголовку) и по элементам вне списка ничего не вызывает.",
      ),

      h("Собственные события"),
      code("html", `<div id="app"><div id="widget"></div></div>
<x-badge id="badge"></x-badge>
<script>
  const log = [];
  const app = document.getElementById("app");
  const widget = document.getElementById("widget");

  // 1. CustomEvent: данные в detail; по умолчанию не всплывает и не отменяется
  app.addEventListener("cart:add", (e) => log.push(\`app получил cart:add (всплытие)\`));
  widget.addEventListener("cart:add", (e) => {
    log.push(\`widget: detail=\${JSON.stringify(e.detail)}, bubbles=\${e.bubbles}, cancelable=\${e.cancelable}\`);
  });
  log.push("до dispatchEvent");
  const result = widget.dispatchEvent(new CustomEvent("cart:add", { detail: { id: 7, qty: 2 } }));
  log.push(\`после dispatchEvent (вернул \${result}) — обработчики уже отработали синхронно\`);

  log.push("— с bubbles: true —");
  widget.dispatchEvent(new CustomEvent("cart:add", { detail: { id: 8 }, bubbles: true }));

  // 2. cancelable + preventDefault: dispatchEvent вернёт false
  widget.addEventListener("cart:remove", (e) => { if (e.detail.locked) e.preventDefault(); });
  log.push(\`remove (locked=false): \${widget.dispatchEvent(new CustomEvent("cart:remove", { detail: { locked: false }, cancelable: true }))}\`);
  log.push(\`remove (locked=true):  \${widget.dispatchEvent(new CustomEvent("cart:remove", { detail: { locked: true }, cancelable: true }))}\`);
  log.push(\`remove (locked=true, но cancelable не задан): \${widget.dispatchEvent(new CustomEvent("cart:remove", { detail: { locked: true } }))}\`);

  // 3. Свой источник событий: наследуем EventTarget
  class Store extends EventTarget {
    #items = [];
    add(item) { this.#items.push(item); this.dispatchEvent(new CustomEvent("change", { detail: { size: this.#items.length } })); }
  }
  const store = new Store();
  store.addEventListener("change", (e) => log.push(\`Store.change: size=\${e.detail.size}\`));
  store.add("a"); store.add("b");

  // 4. Shadow DOM: события пересекают границу только при composed: true
  customElements.define("x-badge", class extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = '<button id="inside">внутри</button>';
    }
  });
  const badge = document.getElementById("badge");
  badge.addEventListener("ping", (e) => log.push(\`снаружи: \${e.type}, target=\${e.target.localName}, composed=\${e.composed}\`));
  badge.addEventListener("click", (e) => log.push(\`снаружи: click, target=\${e.target.localName} (ретаргетинг), composedPath[0]=\${e.composedPath()[0].localName}\`));
  const inside = badge.shadowRoot.getElementById("inside");
  inside.dispatchEvent(new CustomEvent("ping", { bubbles: true }));                 // не покинет теневое дерево
  inside.dispatchEvent(new CustomEvent("ping", { bubbles: true, composed: true })); // покинет
  inside.click();                                                                  // click — composed по умолчанию
  window.log = log;
</script>`, { filename: "ev4-custom.html", collapsed: true }),
      code("text", `до dispatchEvent
widget: detail={"id":7,"qty":2}, bubbles=false, cancelable=false
после dispatchEvent (вернул true) — обработчики уже отработали синхронно
— с bubbles: true —
widget: detail={"id":8}, bubbles=true, cancelable=false
app получил cart:add (всплытие)
remove (locked=false): true
remove (locked=true):  false
remove (locked=true, но cancelable не задан): true
Store.change: size=1
Store.change: size=2
снаружи: ping, target=x-badge, composed=true
снаружи: click, target=x-badge (ретаргетинг), composedPath[0]=button
ошибки: []`, { filename: "замер в Chromium 141" }),
      ul(
        "**Синхронность:** `dispatchEvent` вернулся только после работы всех слушателей — порядок `до dispatchEvent → widget → после dispatchEvent`.",
        "**Значения по умолчанию:** `bubbles=false`, `cancelable=false`; без `bubbles: true` предок (`app`) событие не получит.",
        "**`cancelable` + `preventDefault`:** `dispatchEvent` вернул `false` только при `cancelable: true` и вызове `preventDefault()`; без `cancelable` результат `true`, хотя слушатель вызвал `preventDefault()`.",
        "**`extends EventTarget`:** любой объект становится источником событий (`Store.change: size=1, 2`) без DOM.",
        "**Теневой DOM:** `ping` с `bubbles: true`, но без `composed` не покинул теневое дерево; с `composed: true` дошёл до хоста, а `target` для внешнего кода — сам `x-badge` (ретаргетинг), тогда как `composedPath()[0]` — внутренняя кнопка. Событие `click` создаётся с `composed: true`.",
      ),

      h("Работа с DOM: коллекции, вставка, безопасность"),
      code("html", `<ul id="menu"><li class="item">A</li><li class="item">B</li></ul>
<div id="out"></div>
<template id="row"><li class="row"><b></b> — <i></i></li></template>
<script>
  const log = [];
  const menu = document.getElementById("menu");

  // 1. Живая и статическая коллекции
  const live = menu.getElementsByClassName("item");   // HTMLCollection — живая
  const snap = menu.querySelectorAll(".item");        // NodeList — снимок
  menu.insertAdjacentHTML("beforeend", '<li class="item">C</li>');
  log.push(\`после добавления: живая=\${live.length}, статическая=\${snap.length}\`);
  log.push(\`типы: \${live.constructor.name}, \${snap.constructor.name}; у живой есть forEach: \${typeof live.forEach}, у статической: \${typeof snap.forEach}\`);

  // 2. Цикл по живой коллекции с удалением пропускает элементы
  const skipped = [];
  const list2 = document.createElement("ul");
  list2.innerHTML = "<li class=x>1</li><li class=x>2</li><li class=x>3</li><li class=x>4</li>";
  const xs = list2.getElementsByClassName("x");
  for (let i = 0; i < xs.length; i++) { skipped.push(xs[i].textContent); xs[i].remove(); }
  log.push(\`удаляли в цикле по живой коллекции: обработаны \${skipped.join(", ")}, осталось \${xs.length}\`);
  list2.innerHTML = "<li class=x>1</li><li class=x>2</li><li class=x>3</li><li class=x>4</li>";
  for (const li of [...list2.getElementsByClassName("x")]) li.remove();
  log.push(\`удаляли по копии [...коллекция]: осталось \${list2.children.length}\`);

  // 3. textContent и innerHTML: вставка пользовательской строки
  let executed = 0;
  window.hacked = () => executed++;
  const evil = '<img src="x" onerror="hacked()">';
  const out = document.getElementById("out");
  out.textContent = evil;
  log.push(\`textContent: дочерних элементов=\${out.children.length}, текст=\${JSON.stringify(out.textContent)}\`);
  out.innerHTML = evil;
  log.push(\`innerHTML: дочерних элементов=\${out.children.length}, обработчик сработает асинхронно (пока executed=\${executed})\`);

  // 4. Шаблон <template> и DocumentFragment
  const row = document.getElementById("row");
  const frag = document.createDocumentFragment();
  for (const [a, b] of [["x", 1], ["y", 2]]) {
    const node = row.content.cloneNode(true);
    node.querySelector("b").textContent = a;
    node.querySelector("i").textContent = b;
    frag.append(node);
  }
  log.push(\`фрагмент до вставки: \${frag.childNodes.length} узла, в документе строк: \${document.querySelectorAll(".row").length}\`);
  menu.append(frag);
  log.push(\`после menu.append(frag): фрагмент \${frag.childNodes.length}, строк в документе: \${document.querySelectorAll(".row").length}\`);

  // 5. Узлы и элементы
  log.push(\`menu.childNodes=\${menu.childNodes.length}, menu.children=\${menu.children.length}\`);
  const mixed = document.createElement("div");
  mixed.innerHTML = "текст <b>жирный</b> ещё <!-- комментарий -->";
  log.push(\`смешанный узел: childNodes=\${mixed.childNodes.length} (\${[...mixed.childNodes].map((n) => n.nodeName).join(", ")}), children=\${mixed.children.length}\`);

  // 6. data-атрибуты и classList
  const li = menu.firstElementChild;
  li.dataset.userId = "42";
  li.classList.toggle("active");
  log.push(\`dataset → атрибут: \${li.getAttribute("data-user-id")}, класс: "\${li.className}", classList.contains(active): \${li.classList.contains("active")}\`);

  window.done = new Promise((r) => setTimeout(() => { log.push(\`через макрозадачу: onerror сработал \${executed} раз\`); r(); }, 200));
  window.log = log;
</script>`, { filename: "ev5-dom.html", collapsed: true }),
      code("text", `после добавления: живая=3, статическая=2
типы: HTMLCollection, NodeList; у живой есть forEach: undefined, у статической: function
удаляли в цикле по живой коллекции: обработаны 1, 3, осталось 2
удаляли по копии [...коллекция]: осталось 0
textContent: дочерних элементов=0, текст="<img src=\\"x\\" onerror=\\"hacked()\\">"
innerHTML: дочерних элементов=1, обработчик сработает асинхронно (пока executed=0)
фрагмент до вставки: 2 узла, в документе строк: 0
после menu.append(frag): фрагмент 0, строк в документе: 2
menu.childNodes=5, menu.children=5
смешанный узел: childNodes=4 (#text, B, #text, #comment), children=1
dataset → атрибут: 42, класс: "item active", classList.contains(active): true
через макрозадачу: onerror сработал 1 раз
ошибки: []`, { filename: "замер в Chromium 141" }),
      ul(
        "**Живая и статическая коллекции:** после добавления `<li>` живая `HTMLCollection` стала `3`, статическая `NodeList` осталась `2`; у `HTMLCollection` нет `forEach` (`undefined`), у `NodeList` есть.",
        "**Удаление в цикле по живой коллекции** пропускает элементы: из четырёх обработаны `1, 3`, осталось `2`; цикл по копии `[...коллекция]` удалил все.",
        "**`textContent` против `innerHTML`:** `textContent` сохраняет строку как текст (`дочерних элементов=0`), `innerHTML` создаёт `<img>`, и его `onerror` **сработал** (`executed=1` после макрозадачи) — путь к XSS при пользовательских данных.",
        "**`<template>` и `DocumentFragment`:** клонированные строки собираются во фрагменте (`2 узла`, в документе `0` строк), `menu.append(frag)` переносит их и **опустошает** фрагмент.",
        "**Узлы и элементы:** `childNodes` включает текст и комментарии (`#text, B, #text, #comment` — 4), `children` — только элементы (1).",
        "**`dataset`/`classList`:** `dataset.userId = \"42\"` создаёт атрибут `data-user-id`; `classList.toggle` меняет класс без перезаписи строки.",
      ),

      h("Тонкости: пассивные слушатели, `isTrusted`, изменение списка слушателей"),
      code("html", `<button id="b">кнопка</button>
<div id="scroller" style="height:50px;overflow:auto"><div style="height:400px">длинное содержимое</div></div>
<script>
  const log = [];
  const b = document.getElementById("b");
  window.log = log;

  // 1. passive: preventDefault игнорируется (в консоль идёт предупреждение)
  b.addEventListener("click", (e) => { e.preventDefault(); log.push(\`passive:true → defaultPrevented=\${e.defaultPrevented}\`); }, { passive: true });
  b.addEventListener("click", (e) => { e.preventDefault(); log.push(\`passive не задан → defaultPrevented=\${e.defaultPrevented}\`); });

  // 2. wheel на document по умолчанию пассивен
  document.addEventListener("wheel", (e) => { e.preventDefault(); log.push(\`wheel на document, passive по умолчанию → defaultPrevented=\${e.defaultPrevented}\`); }, { once: true });
  document.addEventListener("wheel", (e) => { e.preventDefault(); log.push(\`wheel на document, passive:false → defaultPrevented=\${e.defaultPrevented}\`); }, { once: true, passive: false });

  // 3. removeEventListener должен совпасть по типу, функции И capture
  function h() { log.push("h вызван"); }
  const c = document.createElement("i");
  c.addEventListener("x", h, true);
  c.removeEventListener("x", h);                  // capture не совпал
  c.dispatchEvent(new Event("x"));
  c.removeEventListener("x", h, true);
  c.dispatchEvent(new Event("x"));
  log.push("после removeEventListener(x, h, true) — тишина (выше ровно один «h вызван»)");

  // 4. isTrusted
  b.addEventListener("click", (e) => log.push(\`click: isTrusted=\${e.isTrusted}\`));

  // 5. Изменение списка слушателей во время диспетчеризации
  const t = document.createElement("i");
  const late = () => log.push("late (добавлен во время события)");
  const victim = () => log.push("victim (снят до своей очереди)");
  t.addEventListener("go", () => { log.push("first"); t.addEventListener("go", late); t.removeEventListener("go", victim); });
  t.addEventListener("go", victim);
  t.addEventListener("go", () => log.push("third"));
  t.dispatchEvent(new Event("go"));
  log.push("— второй dispatch —");
  t.dispatchEvent(new Event("go"));

  // 6. Исключение в слушателе не мешает остальным
  const t2 = document.createElement("i");
  t2.addEventListener("boom", () => { throw new Error("сбой в слушателе"); });
  t2.addEventListener("boom", () => log.push("слушатель после упавшего всё равно вызван"));
  t2.dispatchEvent(new Event("boom"));

  // 7. currentTarget обнуляется после диспетчеризации
  let saved;
  b.addEventListener("click", async (e) => {
    saved = e;
    log.push(\`синхронно: currentTarget=\${e.currentTarget && e.currentTarget.id}\`);
    await null;                                   // микрозадача
    log.push(\`после await null: currentTarget=\${e.currentTarget && e.currentTarget.id}\`);
    await new Promise((r) => setTimeout(r));      // макрозадача: диспетчеризация точно завершена
    log.push(\`после setTimeout: currentTarget=\${e.currentTarget}, target=\${e.target.id}\`);
  });
  window.fire = () => b.click();
  window.reset = () => { log.length = 0; };
</script>`, { filename: "ev6-edge.html", collapsed: true }),
      code("text", `h вызван
после removeEventListener(x, h, true) — тишина (выше ровно один «h вызван»)
first
third
— второй dispatch —
first
third
late (добавлен во время события)
слушатель после упавшего всё равно вызван
wheel на document, passive по умолчанию → defaultPrevented=false
wheel на document, passive:false → defaultPrevented=true
— программный b.click() —
click: isTrusted=false
синхронно: currentTarget=b
после await null: currentTarget=null
после setTimeout: currentTarget=null, target=b
— настоящий клик —
click: isTrusted=true
синхронно: currentTarget=b
после await null: currentTarget=b
после setTimeout: currentTarget=null, target=b
ошибки страницы: [ 'Error: сбой в слушателе' ]
предупреждения консоли (3):
  Unable to preventDefault inside passive event listener due to target being treated as passive.
  Unable to preventDefault inside passive event listener invocation.`, { filename: "замер в Chromium 141 (реальные колесо мыши и клик)" }),
      ul(
        "**`passive: true`** запрещает `preventDefault()` (`defaultPrevented=false`, в консоли предупреждение `Unable to preventDefault inside passive event listener invocation.`). Для `wheel`/`touchstart`/`touchmove` на `window`, `document` и `body` пассивность включена **по умолчанию** (`defaultPrevented=false`); `{ passive: false }` возвращает возможность отмены (`true`).",
        "**`removeEventListener` с другим `capture`** ничего не снимает: первая попытка не помогла (`h вызван` один раз), вторая с `true` — помогла.",
        "**`isTrusted`:** `b.click()` из кода — `false`, настоящий клик — `true`.",
        "**Список слушателей во время диспетчеризации:** слушатель, добавленный во время события, в этом проходе **не вызывается** (`late` — только во втором `dispatch`), а снятый до своей очереди — не вызывается вовсе (`victim` нет ни разу).",
        "**Исключение в слушателе** не мешает остальным (`слушатель после упавшего всё равно вызван`) и попадает в `pageerror`.",
        "**`currentTarget` обнуляется** после завершения диспетчеризации: после `await new Promise(setTimeout)` — `null`. Для программного `b.click()` он `null` уже после `await null` (микрозадачи идут после всей диспетчеризации), а при настоящем клике — ещё `b` (микрозадача выполняется между слушателями), см. [цикл событий](/learn/js/event-loop).",
      ),

      h("Мелочи, которые ломают предположения"),
      code("js", `import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
const GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await b.newPage();
await page.setContent(\`<div id=p style="padding:10px"><span id=s1 style="display:inline-block;width:80px;height:30px">один</span> <span id=s2 style="display:inline-block;width:80px;height:30px">два</span></div>
<button id=btn>b</button><a id=ln href="#target">ссылка</a><input id=txt>
<div id=sc style="height:40px;overflow:auto"><div style="height:300px">x</div></div>\`);

// 1. mousedown и mouseup на разных элементах
await page.evaluate(() => { window.L = []; document.getElementById("p").addEventListener("click", (e) => L.push("click: target=" + e.target.id)); for (const id of ["s1", "s2"]) document.getElementById(id).addEventListener("click", () => L.push("click на " + id)); });
const b1 = await page.locator("#s1").boundingBox(), b2 = await page.locator("#s2").boundingBox();
await page.mouse.move(b1.x + 5, b1.y + 5); await page.mouse.down(); await page.mouse.move(b2.x + 5, b2.y + 5); await page.mouse.up();
console.log("mousedown на #s1, mouseup на #s2 →", JSON.stringify(await page.evaluate(() => L.splice(0))));

// 2. return false: addEventListener и onclick
await page.evaluate(() => document.getElementById("ln").addEventListener("click", () => false));
await page.click("#ln");
console.log("return false в addEventListener → переход выполнен:", (await page.evaluate(() => location.hash)) === "#target");
await page.evaluate(() => { location.hash = "none"; document.getElementById("ln").onclick = () => false; });
await page.click("#ln");
console.log("return false в onclick → переход отменён:", (await page.evaluate(() => location.hash)) === "#none");

// 3. scroll
console.log("scroll у элемента →", JSON.stringify(await page.evaluate(() => new Promise((res) => { const sc = document.getElementById("sc"); sc.addEventListener("scroll", (e) => res({ bubbles: e.bubbles, cancelable: e.cancelable }), { once: true }); sc.scrollTop = 50; }))));

// 4. Enter и Space на кнопке
await page.evaluate(() => { window.K = []; document.getElementById("btn").addEventListener("click", (e) => K.push(\`click (detail=\${e.detail}, isTrusted=\${e.isTrusted})\`)); });
await page.focus("#btn"); await page.keyboard.press("Enter"); await page.keyboard.press("Space");
console.log("Enter, затем Space на кнопке →", JSON.stringify(await page.evaluate(() => K.splice(0))));

// 5. load, input, change
console.log("load у изображения: bubbles =", await page.evaluate((src) => new Promise((res) => { const i = new Image(); i.addEventListener("load", (e) => res(e.bubbles)); i.src = src; }), GIF));
await page.evaluate(() => { const t = document.getElementById("txt"); window.IC = {}; t.addEventListener("input", (e) => (IC.input = e.bubbles)); t.addEventListener("change", (e) => (IC.change = e.bubbles)); });
await page.focus("#txt"); await page.keyboard.type("abc"); await page.keyboard.press("Tab");
console.log("input и change: bubbles =", JSON.stringify(await page.evaluate(() => IC)));

// 6. Место onclick в очереди слушателей
console.log("порядок при onclick между слушателями →", JSON.stringify(await page.evaluate(() => { const el = document.createElement("button"); document.body.append(el); const o = []; el.onclick = () => o.push("onclick (1)"); el.addEventListener("click", () => o.push("listener A")); el.onclick = () => o.push("onclick (2)"); el.addEventListener("click", () => o.push("listener B")); el.click(); return o; })));

// 7. Встроенный атрибут onclick под CSP
const p2 = await b.newPage(); const msgs = [];
p2.on("console", (m) => msgs.push(m.text().split(".")[0]));
await p2.setContent(\`<meta http-equiv="Content-Security-Policy" content="script-src 'self'"><button id=x onclick="window.fired=true">x</button>\`);
await p2.click("#x");
console.log("атрибут onclick под CSP script-src 'self' → выполнен:", await p2.evaluate(() => window.fired === true), "| сообщение:", msgs[0]);
await b.close();`, { filename: "run-ev7.mjs", collapsed: true }),
      code("text", `mousedown на #s1, mouseup на #s2 → ["click: target=p"]
return false в addEventListener → переход выполнен: true
return false в onclick → переход отменён: true
scroll у элемента → {"bubbles":false,"cancelable":false}
Enter, затем Space на кнопке → ["click (detail=0, isTrusted=true)","click (detail=0, isTrusted=true)"]
load у изображения: bubbles = false
input и change: bubbles = {"input":true,"change":true}
порядок при onclick между слушателями → ["onclick (2)","listener A","listener B"]
атрибут onclick под CSP script-src 'self' → выполнен: false | сообщение: Refused to execute inline event handler because it violates the following Content Security Policy directive: "script-src 'self'"`, { filename: "замер в Chromium 141" }),
      ul(
        "**`click` на общем предке:** нажали на `#s1`, отпустили на `#s2` — `click` пришёл на их общего родителя (`target=p`), слушатели на `#s1`/`#s2` не сработали.",
        "**`return false`** в `addEventListener` ничего не отменяет (переход по ссылке выполнен), в свойстве `onclick` — отменяет действие по умолчанию.",
        "**`scroll` не всплывает и не отменяется; `load` не всплывает; `input` и `change` всплывают.**",
        "**`Enter`/`Space` на кнопке** порождают `click` с `isTrusted=true` и `detail=0`.",
        "**Свойство `onclick`** сохраняет место первого присваивания: после повторного присваивания `onclick (2)` остался **перед** `listener A`.",
        "**Встроенный `onclick=\"…\"`** блокируется политикой `script-src 'self'` без `'unsafe-inline'` (`Refused to execute inline event handler`).",
      ),

      h("Лаборатория: путь события вживую"),
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Лаборатория событий</title>
<style>
  body { font: 15px system-ui, sans-serif; margin: 1rem; }
  .box { border: 2px solid #6b7280; padding: 14px; margin: 6px 0; border-radius: 8px; }
  .box.hit { background: #fde68a; }
  #log { white-space: pre-wrap; background: #111827; color: #e5e7eb; padding: .75rem; border-radius: 8px; min-height: 8rem; }
  label { margin-right: 1rem; }
</style>
<fieldset>
  <legend>Настройки</legend>
  <label><input type="checkbox" id="useCapture"> слушатель на #outer — на погружении</label>
  <label><input type="checkbox" id="stopAtMiddle"> stopPropagation на #middle</label>
</fieldset>
<div class="box" id="outer">outer
  <div class="box" id="middle">middle
    <div class="box" id="inner">inner (кликните здесь)</div>
  </div>
</div>
<button id="clear" type="button">Очистить журнал</button>
<div id="log" aria-live="polite"></div>
<script>
  const $ = (id) => document.getElementById(id);
  const phases = ["", "погружение", "цель", "всплытие"];
  const logEl = $("log");
  const flash = (el) => { el.classList.add("hit"); setTimeout(() => el.classList.remove("hit"), 400); };
  const say = (e, extra = "") => {
    logEl.textContent += \`\${e.currentTarget.id}: \${phases[e.eventPhase]}\${extra}\\n\`;
    flash(e.currentTarget);
  };

  let outerHandler;
  function subscribeOuter() {
    if (outerHandler) $("outer").removeEventListener("click", outerHandler, outerHandler.capture);
    const capture = $("useCapture").checked;
    outerHandler = (e) => say(e, capture ? " (слушатель с capture)" : "");
    outerHandler.capture = capture;
    $("outer").addEventListener("click", outerHandler, capture);
  }
  subscribeOuter();
  $("useCapture").addEventListener("change", subscribeOuter);

  $("middle").addEventListener("click", (e) => {
    say(e);
    if ($("stopAtMiddle").checked) { logEl.textContent += "  → stopPropagation(): выше событие не пойдёт\\n"; e.stopPropagation(); }
  });
  $("inner").addEventListener("click", (e) => { logEl.textContent += \`цель: e.target=#\${e.target.id}\\n\`; say(e); });
  $("clear").addEventListener("click", () => { logEl.textContent = ""; });
</script>
</html>`, { filename: "events-lab.html", runnable: true, lineNumbers: true }),
      code("text", `по умолчанию:
  цель: e.target=#inner
  inner: цель
  middle: всплытие
  outer: всплытие
слушатель #outer на погружении:
  outer: погружение (слушатель с capture)
  цель: e.target=#inner
  inner: цель
  middle: всплытие
stopPropagation на #middle:
  цель: e.target=#inner
  inner: цель
  middle: всплытие
    → stopPropagation(): выше событие не пойдёт
ошибки: []`, { filename: "замер в Chromium 141" }),
      p("Кликайте по вложенным блокам, переключайте «слушатель на `#outer` — на погружении» и «`stopPropagation` на `#middle`»: подсвечиваются узлы пути, а журнал показывает фазу каждого шага. Замер подтверждает порядок: по умолчанию `inner: цель → middle: всплытие → outer: всплытие`; с `capture` внешний блок срабатывает **первым**; с `stopPropagation` внешний блок не получает событие вовсе."),
    ]),

    section("syntax", [
      annotated(
        "js",
        `const controller = new AbortController();
const list = document.querySelector("#tasks");

list.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !list.contains(button)) return;
    event.preventDefault();
    list.dispatchEvent(
      new CustomEvent("task:action", { bubbles: true, detail: { action: button.dataset.action } }),
    );
  },
  { signal: controller.signal },
);

document.addEventListener("task:action", (event) => console.log(event.detail.action));
controller.abort();`,
        [
          { line: 1, text: "`AbortController` — общий «выключатель» всех подписок компонента." },
          { line: [4, 6], text: "`addEventListener(тип, функция, опции)`: слушатель на контейнере, обычная фаза всплытия." },
          { line: 7, text: "`closest` поднимается от `event.target` до подходящего предка — клик по вложенной иконке даёт кнопку." },
          { line: 8, text: "Защита: нашлось ли что-то и лежит ли оно внутри контейнера (`contains`)." },
          { line: 9, text: "`preventDefault()` — отменить действие браузера (если событие отменяемо и слушатель не пассивный)." },
          { line: [10, 12], text: "`dispatchEvent(new CustomEvent(...))` — собственное событие; `bubbles: true`, чтобы его услышали выше; данные — в `detail`." },
          { line: 14, text: "`{ signal }` — слушатель снимется при `controller.abort()`." },
          { line: 17, text: "Подписчик на пользовательское событие — на `document`, не зная, откуда оно пришло." },
          { line: 18, text: "Одним `abort()` сняты все слушатели, подписанные с этим сигналом." },
        ],
        "syntax.js",
      ),
    ]),

    section("minimal-example", [
      p("Не запуская код, определите порядок вывода. Помните: `click()` — программный клик, диспетчеризация синхронна; а `e.stopPropagation()` вызывается в слушателе, зарегистрированном **после** `b:bubble`."),
      code("html", `<div id="a"><div id="b"><button id="c">go</button></div></div>
<script>
  const out = [];
  const el = (id) => document.getElementById(id);
  const on = (id, label, capture) => el(id).addEventListener("click", () => out.push(label), capture);

  on("a", "a:capture", true);
  on("a", "a:bubble", false);
  on("b", "b:bubble", false);
  on("b", "b:capture", true);
  on("c", "c:bubble", false);
  on("c", "c:capture", true);
  el("b").addEventListener("click", (e) => { out.push("b:stop"); e.stopPropagation(); });

  el("c").click();                       // программный клик
  out.push("sync end");
  Promise.resolve().then(() => out.push("microtask"));
  window.out = out;
</script>`, { filename: "x1-predict.html" }),
      code("text", `a:capture
b:capture
c:capture
c:bubble
b:bubble
b:stop
sync end
microtask`, { filename: "вывод Chromium 141" }),
      ul(
        "**Погружение:** `a:capture → b:capture`; на цели `c` сначала капчер-слушатель, затем обычный (`c:capture`, `c:bubble`).",
        "**Всплытие:** `b:bubble`, затем `b:stop` (второй обычный слушатель на `#b`) — после него событие дальше не идёт, `a:bubble` **не** вывелся.",
        "**Синхронность:** `sync end` после всей цепочки (программный `click()` блокирует), `microtask` — последним.",
      ),
    ]),

    section("detailed-example", [
      p("Приложение «Задачи» собирает всё в одном месте: форма (`submit`, а не `click` по кнопке — работает и по `Enter`), один делегированный слушатель на список, клавиша `Delete` на строке, фильтр через всплывающее `change`, счётчик, подписанный на пользовательское событие `tasks:change`, и единый `AbortController`, который снимает все подписки. Пользовательский текст попадает в DOM через `textContent`."),
      code("html", `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Задачи: делегирование и события</title>
<style>
  body { font: 16px system-ui, sans-serif; margin: 1.5rem; max-width: 32rem; }
  li { display: flex; gap: .5rem; align-items: center; padding: .25rem 0; }
  li[data-done="true"] .title { text-decoration: line-through; color: #777; }
  li:focus-visible { outline: 2px solid #3b82f6; }
  .title { flex: 1; }
</style>
<form id="add"><input name="title" placeholder="Новая задача" required> <button>Добавить</button></form>
<fieldset id="filter"><legend>Показать</legend>
  <label><input type="radio" name="f" value="all" checked> все</label>
  <label><input type="radio" name="f" value="open"> активные</label>
  <label><input type="radio" name="f" value="done"> готовые</label>
</fieldset>
<ul id="tasks"></ul>
<p id="counter" aria-live="polite"></p>
<button id="teardown" type="button">Отключить обработчики</button>
<pre id="log"></pre>
<script>
  const root = document.body;
  const list = document.getElementById("tasks");
  const lifetime = new AbortController();        // один сигнал снимает все подписки сразу
  const { signal } = lifetime;
  const log = (m) => { document.getElementById("log").textContent += m + "\\n"; };

  function render(title) {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.dataset.done = "false";
    li.innerHTML = '<span class="title"></span><button data-action="toggle">Готово</button><button data-action="remove" aria-label="Удалить">✕</button>';
    li.querySelector(".title").textContent = title;           // textContent: пользовательский текст не станет разметкой
    return li;
  }
  function announce() {                                       // «кастомное событие» — слабая связность модулей
    list.dispatchEvent(new CustomEvent("tasks:change", { bubbles: true, detail: { total: list.children.length, done: list.querySelectorAll('[data-done="true"]').length } }));
  }

  // Форма: submit, а не click по кнопке (работает и по Enter)
  document.getElementById("add").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = e.currentTarget.elements.title;
    list.append(render(input.value.trim()));
    input.value = "";
    announce();
  }, { signal });

  // Список: ОДИН слушатель на все кнопки, в том числе добавленные позже
  list.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button || !list.contains(button)) return;
    const li = button.closest("li");
    if (button.dataset.action === "toggle") li.dataset.done = String(li.dataset.done !== "true");
    else li.remove();
    announce();
  }, { signal });

  // Клавиатура: Delete на строке с фокусом
  list.addEventListener("keydown", (e) => {
    if (e.key === "Delete" && e.target.matches("li")) { e.target.remove(); announce(); }
  }, { signal });

  // Фильтр: change всплывает от radio до fieldset
  document.getElementById("filter").addEventListener("change", (e) => {
    list.dataset.filter = e.target.value;
    for (const li of list.children) li.hidden = (e.target.value === "open" && li.dataset.done === "true") || (e.target.value === "done" && li.dataset.done !== "true");
  }, { signal });

  // Счётчик слушает кастомное событие
  root.addEventListener("tasks:change", (e) => {
    document.getElementById("counter").textContent = \`Готово \${e.detail.done} из \${e.detail.total}\`;
  }, { signal });

  document.getElementById("teardown").addEventListener("click", () => { lifetime.abort(); log("все обработчики сняты одним abort()"); });
</script>
</html>`, { filename: "tasks.html", runnable: true, lineNumbers: true, collapsed: true }),
      code("text", `после трёх добавлений (Enter в поле): {"задачи":["молоко","хлеб","<b>тег</b>"],"счётчик":"Готово 0 из 3"}
текст с тегами не стал разметкой: true
отмечена первая: {"задачи":["молоко ✓","хлеб","<b>тег</b>"],"счётчик":"Готово 1 из 3"}
фильтр «активные»: ["молоко ✓ (скрыта)","хлеб","<b>тег</b>"]
фильтр «готовые»: ["молоко ✓","хлеб (скрыта)","<b>тег</b> (скрыта)"]
Delete на строке «хлеб»: {"задачи":["молоко ✓","<b>тег</b>"],"счётчик":"Готово 1 из 2"}
удалена кнопкой ✕: {"задачи":["молоко ✓"],"счётчик":"Готово 1 из 1"}
после abort(): {"задачи":["молоко ✓"],"счётчик":"Готово 1 из 1"} — клики больше ничего не меняют
журнал страницы: все обработчики сняты одним abort()
ошибки: []`, { filename: "сценарий в Chromium 141 (Playwright)" }),
      ul(
        "`<b>тег</b>` отображается как текст (`document.querySelectorAll(\"#tasks b\").length === 0`).",
        "Фильтр `change` всплыл от `<input type=radio>` до `<fieldset>`; скрытие — через `hidden`.",
        "Счётчик не знает о списке: он слушает `tasks:change` на `body` (событие всплывает от `ul`).",
        "После `abort()` клики по кнопкам и форме больше ничего не меняют.",
      ),
    ]),

    section("analysis", [
      table(
        ["Решение", "Что даёт", "Цена / риск"],
        [
          ["Делегирование на контейнере", "1 подписка вместо N; работает для динамических элементов", "Нужны `closest` + `contains`; не работает для событий без всплытия (нужен `focusin` или capture)"],
          ["`closest(селектор)` вместо `target`", "Клик по вложенным элементам даёт нужную кнопку", "`closest` выходит за корень — проверять `root.contains`"],
          ["`submit` вместо `click` по кнопке", "Работает по `Enter`, по программной отправке, с валидацией", "Нужен `preventDefault()` при ручной обработке"],
          ["`{ signal }` вместо ручного `removeEventListener`", "Снятие многих слушателей одним вызовом; не нужна ссылка на функцию", "Нужен `AbortController` с понятным временем жизни"],
          ["`textContent` вместо `innerHTML`", "Нет разметки из пользовательского текста", "Для разметки нужен `<template>`/`createElement`"],
          ["`CustomEvent` с `bubbles: true`", "Слабая связность модулей", "Имена событий нужно документировать; `detail` не типизирован"],
          ["`stopPropagation()` — редко", "Локально прекращает всплытие", "Ломает делегирование и аналитику выше; лучше проверять условия в самом слушателе"],
        ],
        "Разбор решений",
      ),
      ul(
        "**Где подписываться:** на ближайшем стабильном предке (форма, список, корень компонента), а не на `document`, если событие нужно только части страницы.",
        "**Фаза capture** оправдана для перехвата событий без всплытия, «глобальной» блокировки (модальное окно) и логирования; для остального достаточно всплытия.",
        "**Двойная защита от дубликатов:** подписываться один раз при инициализации, а перерисовывать только содержимое (замер: после трёх перерисовок один клик давал 3 вызова при повторной подписке и 1 — при подписке один раз).",
      ),
    ]),

    section("internals", [
      h("Алгоритм диспетчеризации"),
      steps(
        [
          ["Построение пути", "Для цели строится «путь события»: цель, её предки до `document` и `window` (при `composed` — через хосты теневых деревьев). Путь фиксируется до первого слушателя."],
          ["Погружение", "От `window` к родителю цели вызываются слушатели, зарегистрированные с `capture: true`."],
          ["Цель", "У самой цели вызываются сначала `capture`-слушатели, затем остальные (в Chromium 141 — замер выше)."],
          ["Всплытие", "Если `bubbles = true`, вызываются обычные слушатели предков в обратном порядке."],
          ["Действие по умолчанию", "Если событие не отменено, браузер выполняет действие по умолчанию (переход, отправка формы)."],
        ],
        "Диспетчеризация события",
      ),
      h("Список слушателей копируется"),
      p("Перед вызовом слушателей узла движок берёт «снимок» их списка: добавленные во время события слушатели в этом проходе не вызываются, а удалённые помечаются как снятые и пропускаются (замер: `late` — только во втором `dispatch`, `victim` — ни разу)."),
      h("Пассивные слушатели и прокрутка"),
      p("Браузер не может начать прокрутку, пока не знает, вызовут ли `preventDefault()` в `touchstart`/`wheel`. Пассивный слушатель обещает, что не вызовет, и прокрутка идёт без ожидания JavaScript. Поэтому для `wheel` и `touch*` на `window`/`document`/`body` пассивность включена по умолчанию, а `preventDefault()` в таком слушателе игнорируется с предупреждением в консоли."),
      h("Микрозадачи между слушателями"),
      p("После завершения каждого слушателя, если стек вызовов пуст (настоящий клик), выполняется микрозадачный чекпоинт — поэтому продолжение `await null` видит `currentTarget` ещё не обнулённым. При программном `button.click()` стек не пуст, и микрозадачи ждут конца всей диспетчеризации. Разница объяснена в теме про [цикл событий](/learn/js/event-loop)."),
      h("Теневой DOM и ретаргетинг"),
      p("Для кода снаружи теневого дерева `event.target` заменяется на хост (ретаргетинг), чтобы не раскрывать внутренности компонента. `composedPath()` у открытого (`mode: \"open\"`) дерева возвращает и внутренние узлы. Пользовательские события пересекают границу теневого дерева только при `composed: true`."),
    ]),

    section("mistakes", [
      h("Ошибка 1. Подписка заново при каждой перерисовке"),
      wrongRight(
        "js",
        {
          code: `
            function render(items) {
              list.innerHTML = items.map(rowHtml).join("");
              list.addEventListener("click", onClick);   // новая функция или та же — на каждой перерисовке
            }
          `,
          note: "Если функция новая (стрелка) — слушателей становится по числу перерисовок: замер — после 3 перерисовок один клик вызвал обработчик 3 раза.",
        },
        {
          code: `
            list.addEventListener("click", onClick);     // один раз при инициализации
            function render(items) {
              list.innerHTML = items.map(rowHtml).join("");
            }
          `,
          note: "Подписка не зависит от содержимого: перерисовка меняет только DOM.",
        },
      ),
      h("Ошибка 2. `e.target` вместо `closest`"),
      p("Клик по `<span>` внутри кнопки даёт `target=icon`, а не кнопку: проверка `e.target.dataset.action` не сработает. Используйте `e.target.closest(\"button[data-action]\")` и убедитесь, что результат внутри корня."),
      h("Ошибка 3. Делегирование `focus` и `mouseenter`"),
      p("Эти события не всплывают (`bubbles=false`), слушатель на предке их не получит. Используйте `focusin`/`focusout`, пару `mouseover`/`mouseout` с проверкой `relatedTarget` или `capture: true`."),
      h("Ошибка 4. Анонимная функция при снятии"),
      p("`removeEventListener(\"click\", () => …)` не снимает ничего: это другая функция (замер: `anon` продолжил срабатывать). Сохраняйте ссылку или используйте `{ signal }`."),
      h("Ошибка 5. `innerHTML` с пользовательскими данными"),
      p("Строка `<img src=\"x\" onerror=\"…\">` создаёт реальный элемент, и обработчик выполняется (замер: сработал один раз). Для текста — `textContent`, для структуры — `createElement`/`<template>`."),
      h("Ошибка 6. Цикл по живой коллекции с изменением"),
      p("`for (let i = 0; i < xs.length; i++) xs[i].remove()` пропускает каждый второй элемент (замер: обработаны `1, 3`, осталось `2`). Копируйте: `[...xs]`, `Array.from`, или используйте `querySelectorAll`."),
      h("Ошибка 7. `stopPropagation()` «для надёжности»"),
      p("Остановка всплытия ломает делегирование и аналитику выше по дереву, а закрытие меню по клику вне пересекается с ней. Если нужно ограничить обработку — проверяйте условие в слушателе, а не глушите событие."),
      h("Ошибка 8. `preventDefault()` в пассивном слушателе"),
      p("`touchstart`/`wheel` на `document` по умолчанию пассивны: отмена игнорируется (`defaultPrevented=false`). Нужен `{ passive: false }` — осознанно, с оценкой влияния на плавность прокрутки."),
      h("Ошибка 9. Открывающий клик закрывает меню"),
      p("Слушатель `click` на `document`, добавленный внутри обработчика клика, **получит тот же клик** при всплытии (слушатель добавлен до того, как событие дошло до `document`). Игнорируйте события, путь которых содержит кнопку (`composedPath().includes(button)`), как в упражнении «Меню»."),
    ]),

    section("antipatterns", [
      ul(
        "**Атрибуты `onclick=\"…\"` в разметке** (смешение слоёв, строковый код, конфликт с CSP `script-src` без `'unsafe-inline'`).",
        "**Свойство `element.onclick = …` для всего:** перезаписывается молча; `addEventListener` безопаснее.",
        "**Слушатель на каждую строку большого списка** — сотни подписок и утечки при пересоздании узлов.",
        "**Глобальный слушатель на `document` «навсегда»** для компонента, который существует недолго.",
        "**`return false` как «и preventDefault, и stopPropagation»:** в слушателях `addEventListener` значение игнорируется (замер: переход по ссылке выполнен); отменяет только в `onclick`-свойстве и то лишь действие по умолчанию, но не распространение.",
        "**Делегирование без проверки границ:** `closest` без `contains` и селекторы, пересекающиеся с чужим кодом.",
        "**`setTimeout` вместо порядка событий** для «починки» гонок между слушателями.",
        "**Поиск элементов по `innerText`/индексам** вместо `data-*` атрибутов.",
      ),
    ]),

    section("best-practices", [
      ul(
        "**Подписывайтесь один раз** на стабильном предке; перерисовывайте только содержимое.",
        "**Делегируйте** повторяющиеся элементы: `e.target.closest(selector)` + `root.contains()`; действие — в `data-action`.",
        "**Снимайте слушатели через `{ signal }`** — один `AbortController` на время жизни компонента.",
        "**Для форм — `submit`, для переключателей — `change`/`input`,** а не `click`: так работают клавиатура и ассистивные технологии.",
        "**Используйте `once`** для одноразовых реакций и `passive: true` для прокрутки и касаний, где отмена не нужна.",
        "**Вставляйте текст через `textContent`**, структуру — через `<template>` и фрагменты, `innerHTML` — только для доверенных строк.",
        "**Собственные события — с префиксом/пространством имён** (`tasks:change`), с `detail` в виде простого объекта и `bubbles: true` для компонентов; для отменяемых — `cancelable: true`.",
        "**Документируйте путь события:** какой слушатель на каком элементе и в какой фазе — это экономит часы отладки.",
      ),
      tip("В DevTools на вкладке Elements → Event Listeners видно слушатели выбранного элемента и их фазу; `monitorEvents(element, \"click\")` в консоли печатает события, а `getEventListeners(element)` показывает подписки."),
    ]),

    section("edge-cases", [
      h("Слушатель, добавленный во время события"),
      p("Если слушатель добавляется на **ещё не пройденный** узел пути (например, `document` из обработчика на кнопке), он будет вызван в этом же проходе — именно поэтому открывающий клик может сразу закрыть меню. Если на **текущий** узел — только в следующих событиях (замер `late`)."),
      h("`event.target` — текстовый узел?"),
      p("В современных браузерах цель клика — всегда элемент; для других событий (`selectionchange`, события на `document`) цель может быть иной. Для универсальности: `const el = e.target instanceof Element ? e.target : e.target.parentElement`."),
      h("`click`, `mousedown` и `mouseup`"),
      p("Если нажатие началось на одном элементе, а кнопка отпущена на другом, `click` приходит на **ближайшего общего предка** (замер: нажали на `#s1`, отпустили на `#s2` — `click: target=p`). Слушатели на `#s1` и `#s2` ничего не увидят. `Enter` и `Space` на кнопке порождают настоящий `click` с `detail=0`."),
      h("`input` и `change`"),
      p("`input` — на каждое изменение значения; `change` — при фиксации (потеря фокуса у текстового поля, выбор у `select`/`radio`/`checkbox`). Оба всплывают (`bubbles=true`) — подходят для делегирования."),
      h("`scroll`, `load`, `wheel`, `touchmove`"),
      p("`scroll` у элемента не всплывает и не отменяется (`bubbles=false`, `cancelable=false`); `load` у изображения не всплывает (ловится на погружении). `wheel` и `touchmove` отменяемы только в непассивных слушателях."),
      h("Утечки через слушатели"),
      p("Слушатель удерживает замыкание, а оно — узлы DOM. Удалённый из документа узел с подписанным на `document` слушателем остаётся в памяти, пока слушатель не снят (подробнее — в теме про память)."),
    ]),

    section("related", [
      ul(
        "[Цикл событий](/learn/js/event-loop) — когда выполняются слушатели и микрозадачи между ними.",
        "[Формы, fetch и FormData](/learn/js/forms-fetch) — события форм: `submit`, `input`, `change`, `FormData`.",
        "[Разбор HTML и DOM](/learn/html/parsing-dom) — как строится дерево, `innerHTML` и разбор разметки.",
        "[Шаблоны и пользовательские элементы](/learn/html/templates-custom-elements) — `<template>`, Shadow DOM и `composed`.",
        "[Клавиатура и фокус](/learn/html/keyboard-focus) — `focusin`/`focusout`, порядок табуляции, `Escape` в диалогах.",
        "[Безопасность HTML](/learn/html/html-security) — XSS, `innerHTML` и CSP.",
      ),
    ]),

    section("before-after", [
      beforeAfter(
        "js",
        {
          title: "Слушатель на каждой строке, дублирование и небезопасная вставка",
          code: `
            function render(tasks) {
              list.innerHTML = tasks.map((t) => '<li>' + t.title + '<button class="del">✕</button></li>').join("");
              list.querySelectorAll(".del").forEach((btn, i) => {
                btn.addEventListener("click", () => remove(tasks[i].id));   // N слушателей на каждую перерисовку
              });
            }
          `,
          note: "Название задачи попадает в разметку без экранирования (XSS), слушатели создаются заново при каждой перерисовке, индексы устаревают при удалении.",
        },
        {
          title: "Делегирование, данные в атрибутах, текст через textContent",
          code: `
            list.addEventListener("click", (e) => {
              const btn = e.target.closest("button[data-action=remove]");
              if (btn && list.contains(btn)) remove(btn.closest("li").dataset.id);
            });

            function render(tasks) {
              list.replaceChildren(...tasks.map((t) => {
                const li = document.createElement("li");
                li.dataset.id = t.id;
                li.textContent = t.title;
                li.insertAdjacentHTML("beforeend", '<button data-action="remove" aria-label="Удалить">✕</button>');
                return li;
              }));
            }
          `,
          note: "Одна подписка, текст безопасен, идентификатор лежит в DOM и не устаревает.",
        },
      ),
    ]),
  ],

  exercises: [
    exercise({
      id: "js.dom-events.ex1",
      title: "Порядок обработчиков",
      difficulty: "foundation",
      kind: "understanding",
      prompt: [
        p("Не запуская код (раздел «Минимальный пример»), запишите порядок вывода и объясните, почему `a:bubble` отсутствует, а `microtask` — последний."),
        code("html", `<div id="a"><div id="b"><button id="c">go</button></div></div>
<script>
  const out = [];
  const el = (id) => document.getElementById(id);
  const on = (id, label, capture) => el(id).addEventListener("click", () => out.push(label), capture);

  on("a", "a:capture", true);
  on("a", "a:bubble", false);
  on("b", "b:bubble", false);
  on("b", "b:capture", true);
  on("c", "c:bubble", false);
  on("c", "c:capture", true);
  el("b").addEventListener("click", (e) => { out.push("b:stop"); e.stopPropagation(); });

  el("c").click();                       // программный клик
  out.push("sync end");
  Promise.resolve().then(() => out.push("microtask"));
  window.out = out;
</script>`, { filename: "x1-predict.html" }),
      ],
      hints: ["На цели сначала идут capture-слушатели или обычные?", "Что делает `stopPropagation()` с остальными слушателями того же элемента?"],
      checks: ["Порядок `a:capture → b:capture → c:capture → c:bubble → b:bubble → b:stop → sync end → microtask`", "Объяснён `stopPropagation`", "Объяснена синхронность `click()`"],
      solution: [
        code("text", `a:capture
b:capture
c:capture
c:bubble
b:bubble
b:stop
sync end
microtask`, { filename: "вывод Chromium 141" }),
        p("Погружение идёт сверху вниз (`a`, `b`), на цели сначала `capture`-слушатель, затем обычный. Всплытие: `b:bubble` (зарегистрирован раньше остановки) и `b:stop`; `stopPropagation()` не пускает событие к `#a` — `a:bubble` не печатается. Программный `click()` синхронен: `sync end` — после всей цепочки; микрозадача — после синхронного кода."),
      ],
    }),
    exercise({
      id: "js.dom-events.ex2",
      title: "Клик срабатывает трижды",
      difficulty: "intermediate",
      kind: "debugging",
      prompt: [
        p("После нескольких перерисовок списка один клик вызывает обработчик несколько раз. Найдите причину в примере и исправьте, не меняя разметки списка."),
        code("html", `<ul id="list"></ul>
<script>
  const list = document.getElementById("list");
  const calls = [];
  let items = ["a", "b"];

  // ОШИБКА: при каждой перерисовке подписываемся заново
  function renderBuggy() {
    list.innerHTML = items.map((t) => \`<li><button data-id="\${t}">\${t}</button></li>\`).join("");
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (btn) calls.push("buggy:" + btn.dataset.id);
    });
  }

  // Исправление: подписка один раз, перерисовка не трогает слушателей
  const fixedList = document.createElement("ul");
  document.body.append(fixedList);
  fixedList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn) calls.push("fixed:" + btn.dataset.id);
  });
  function renderFixed() {
    fixedList.innerHTML = items.map((t) => \`<li><button data-id="\${t}">\${t}</button></li>\`).join("");
  }

  for (let i = 0; i < 3; i++) { renderBuggy(); renderFixed(); items = [...items, "x" + i]; }
  window.calls = calls;
</script>`, { filename: "x2-duplicates.html" }),
      ],
      hints: ["Сколько раз вызывается `addEventListener` для `list`?", "Различаются ли функции при каждом вызове `renderBuggy`?"],
      checks: ["Названа причина (повторная подписка новой функцией)", "Подписка вынесена из `render`", "Замер: 3 вызова против 1"],
      solution: [
        code("text", `после 3 перерисовок, один клик:
  с повторной подпиской: срабатываний = 3 ["buggy:a","buggy:a","buggy:a"]
  с подпиской один раз:  срабатываний = 1 ["fixed:a"]`, { filename: "замер в Chromium 141" }),
        p("`renderBuggy` при каждой перерисовке регистрирует **новую** анонимную стрелку на том же `ul`. Одинаковая функция была бы отброшена как дубликат, но здесь функции разные — слушателей становится столько, сколько было перерисовок. Исправление — как в `renderFixed`: подписка один раз при инициализации (делегирование через `closest`), а `render` меняет только содержимое."),
      ],
    }),
    exercise({
      id: "js.dom-events.ex3",
      title: "Выпадающее меню без утечек",
      difficulty: "advanced",
      kind: "engineering",
      prompt: [
        p("Напишите `setupDropdown({ button, menu })`: кнопка открывает и закрывает меню (`hidden` и `aria-expanded`), клик вне меню и `Escape` закрывают (после `Escape` фокус возвращается на кнопку), клик внутри меню не закрывает. Слушатели на `document` должны существовать **только пока меню открыто**, а `destroy()` — снимать всё."),
      ],
      hints: ["Что происходит с кликом по кнопке, если слушатель на `document` добавлен внутри её обработчика?", "Как снять сразу два слушателя с `document`?"],
      checks: ["Открывающий клик не закрывает меню", "`composedPath()` вместо `contains(e.target)`", "Слушатели на `document` — через `AbortSignal`", "`destroy()` снимает всё"],
      solution: [
        code("js", `// Выпадающее меню: открывается кнопкой, закрывается кликом вне меню и клавишей Escape.
export function setupDropdown({ button, menu }) {
  const lifetime = new AbortController();       // снимает всё при destroy()
  let closeController = null;                    // слушатели на document живут, пока меню открыто

  function open() {
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
    closeController = new AbortController();
    const signal = AbortSignal.any([closeController.signal, lifetime.signal]);
    document.addEventListener("click", (e) => {
      const path = e.composedPath();
      if (!path.includes(menu) && !path.includes(button)) close();
    }, { signal });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { close(); button.focus(); }
    }, { signal });
  }

  function close() {
    if (!closeController) return;
    closeController.abort();
    closeController = null;
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }

  button.addEventListener("click", () => (closeController ? close() : open()), { signal: lifetime.signal });
  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");

  return { open, close, destroy() { close(); lifetime.abort(); } };
}`, { filename: "dropdown.mjs", lineNumbers: true }),
        code("js", `import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import fs from "node:fs";
const src = fs.readFileSync(process.argv[2] ?? "dropdown.mjs", "utf8").replace(/^export /m, "");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await b.newPage();
await page.setContent(\`<button id="btn">Меню</button><ul id="menu"><li><a href="#one" id="one">Пункт</a></li></ul><p id="outside">вне меню</p>\`);
await page.addScriptTag({ content: \`
  window.docListeners = 0;
  const add = document.addEventListener.bind(document);
  const rem = document.removeEventListener.bind(document);
  document.addEventListener = (type, fn, opts) => { if (opts && opts.signal) { window.docListeners++; opts.signal.addEventListener("abort", () => window.docListeners--, { once: true }); } return add(type, fn, opts); };
\` });
await page.addScriptTag({ content: src + \`\\nwindow.dd = setupDropdown({ button: document.getElementById("btn"), menu: document.getElementById("menu") });\` });
const state = () => page.evaluate(() => ({ open: !document.getElementById("menu").hidden, expanded: document.getElementById("btn").getAttribute("aria-expanded"), docListeners: window.docListeners }));
const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };

let s = await state();
check("изначально закрыто, aria-expanded=false, слушателей на document нет", !s.open && s.expanded === "false" && s.docListeners === 0, JSON.stringify(s));
await page.click("#btn"); s = await state();
check("клик по кнопке открывает; aria-expanded=true; на document 2 слушателя", s.open && s.expanded === "true" && s.docListeners === 2, JSON.stringify(s));
await page.click("#btn"); s = await state();
check("повторный клик по кнопке закрывает и снимает слушатели с document", !s.open && s.docListeners === 0, JSON.stringify(s));
await page.click("#btn"); await page.click("#outside"); s = await state();
check("клик вне меню закрывает", !s.open && s.expanded === "false" && s.docListeners === 0);
await page.click("#btn"); await page.evaluate(() => document.getElementById("one").addEventListener("click", (e) => e.preventDefault())); await page.click("#one"); s = await state();
check("клик внутри меню не закрывает", s.open);
await page.focus("#one"); await page.keyboard.press("Escape"); s = await state();
const focusOnButton = await page.evaluate(() => document.activeElement.id === "btn");
check("Escape закрывает и возвращает фокус на кнопку", !s.open && focusOnButton && s.docListeners === 0);
await page.click("#btn"); await page.click("#btn"); await page.click("#btn"); s = await state();
check("быстрые переключения не копят слушателей", s.open && s.docListeners === 2, JSON.stringify(s));
await page.evaluate(() => dd.destroy()); s = await state();
await page.click("#btn"); const afterDestroy = await state();
check("destroy() закрывает меню и снимает все слушатели", !s.open && s.docListeners === 0 && !afterDestroy.open);
const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
await b.close();
process.exit(failed ? 1 : 0);`, { filename: "dropdown-test.mjs", collapsed: true }),
        code("text", `✓ изначально закрыто, aria-expanded=false, слушателей на document нет — {"open":false,"expanded":"false","docListeners":0}
✓ клик по кнопке открывает; aria-expanded=true; на document 2 слушателя — {"open":true,"expanded":"true","docListeners":2}
✓ повторный клик по кнопке закрывает и снимает слушатели с document — {"open":false,"expanded":"false","docListeners":0}
✓ клик вне меню закрывает
✓ клик внутри меню не закрывает
✓ Escape закрывает и возвращает фокус на кнопку
✓ быстрые переключения не копят слушателей — {"open":true,"expanded":"true","docListeners":2}
✓ destroy() закрывает меню и снимает все слушатели

Все проверки пройдены: 8/8`, { filename: "результат запуска (Chromium 141)" }),
        p("Слушатели на `document` создаются в `open()` с общим `AbortSignal.any([closeController.signal, lifetime.signal])`: `close()` снимает оба одним `abort()`. Открывающий клик доходит до `document` тем же всплытием и был бы воспринят как «клик вне меню», поэтому в пути события ищем и меню, и кнопку. `composedPath()` работает и для меню, содержащего теневой DOM."),
      ],
    }),
  ],

  challenge: {
    id: "js.dom-events.challenge",
    title: "delegate(): универсальное делегирование",
    scenario: [
      p("В вашем проекте десятки мест с подпиской на строки списков, меню и карточек. Напишите функцию `delegate(root, type, selector, handler, options)`, которая заменит их и аккуратно обработает граничные случаи: вложенные совпадения, элементы вне корня, события без всплытия."),
    ],
    requirements: [
      "`delegate(root, type, selector, handler, { once, signal, capture })` возвращает функцию `off()`",
      "`handler.call(matched, event, matched)`: `this` и второй аргумент — найденный элемент",
      "Совпадение определяется через `closest(selector)` от `event.target`; если найденный элемент не лежит строго внутри `root` (сам `root` и предки не считаются) — игнорировать",
      "Работает для динамически добавленных элементов и для вложенных совпадений (берётся ближайший)",
      "`focus`/`blur` обрабатываются через `focusin`/`focusout`; `mouseenter`/`mouseleave` — через `mouseover`/`mouseout` с проверкой `relatedTarget`: один вход и один выход при переходах внутри элемента",
      "`off()` идемпотентна; `signal` тоже снимает подписку; `once: true` срабатывает ровно один раз по **успешному** совпадению (промах не расходует подписку)",
    ],
    constraints: [
      "Без внешних библиотек",
      "Не хранить состояние вне замыкания; одна подписка на вызов `delegate`",
    ],
    acceptance: [
      "Все 11 проверок проходят в Chromium 141 стабильно (3 запуска подряд)",
      "Нарушение любого требования (например, замена `closest` на `matches`, удаление проверки корня, потеря `focusin`) обнаруживается тестом",
    ],
    hints: [
      "Как получить один выключатель для подписки, `once` и внешнего `signal`?",
      "Чем `focus` отличается от `focusin` с точки зрения всплытия?",
      "Как понять, что `mouseover` — это переход внутри элемента, а не вход?",
    ],
    solution: [
      code("js", `// Делегирование событий: один слушатель на корне вместо множества на потомках.
const ALIASES = { focus: "focusin", blur: "focusout" };
const ENTER_LEAVE = { mouseenter: "mouseover", mouseleave: "mouseout" };

export function delegate(root, type, selector, handler, options = {}) {
  const { once = false, signal, capture = false } = options;
  const realType = ENTER_LEAVE[type] ?? ALIASES[type] ?? type;
  const isEnterLeave = type in ENTER_LEAVE;
  const controller = new AbortController();
  if (signal) {
    if (signal.aborted) return () => {};
    signal.addEventListener("abort", () => controller.abort(), { once: true, signal: controller.signal });
  }

  root.addEventListener(
    realType,
    (event) => {
      const start = event.target instanceof Element ? event.target : event.target.parentElement;
      const matched = start?.closest(selector);
      if (!matched || matched === root || !root.contains(matched)) return;
      if (isEnterLeave && matched.contains(event.relatedTarget)) return; // переход внутри элемента — не вход и не выход
      if (once) controller.abort();
      handler.call(matched, event, matched);
    },
    { capture, signal: controller.signal },
  );

  return () => controller.abort(); // повторный вызов безопасен
}`, { filename: "delegate.mjs", lineNumbers: true }),
      code("js", `import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import fs from "node:fs";
const src = fs.readFileSync(process.argv[2] ?? "delegate.mjs", "utf8").replace(/^export /m, "");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-proxy-server"] });
const page = await b.newPage();
await page.setContent(\`<style>#hover{width:200px;height:80px;margin:20px;padding:10px;background:#eef}#hchild{display:block;width:100px;height:40px;background:#cce}</style>
<div id="app"><ul id="list"><li><button class="btn"><span class="ic">★</span> один</button></li></ul>
<div class="card" id="outer-card"><div id="widget"><div class="card" id="inner-card"><span id="deep">глубоко</span></div></div></div>
<div class="field" id="fw"><input id="fi"></div><div id="hover" class="zone"><span id="hchild">дочерний</span></div></div>
<div class="btn" id="stranger"><span id="s-in">вне корня</span></div>\`);
await page.addScriptTag({ content: src + "\\nwindow.delegate = delegate;" });
const calls = () => page.evaluate(() => window.__calls.splice(0));
await page.evaluate(() => { window.__calls = []; });

const results = [];
const check = (name, ok, info = "") => { results.push(ok); console.log((ok ? "✓ " : "✗ ") + name + (info ? " — " + info : "")); };

// 1. Клик по вложенному span → matched = button, this === matched
await page.evaluate(() => {
  window.off1 = delegate(document.querySelector("#list"), "click", ".btn", function (e, m) { window.__calls.push(\`click:\${e.target.className}:\${m.className}:\${this === m}\`); });
});
await page.click(".ic");
check("клик по вложенному элементу → matched — кнопка, this === matched", (await calls()).join() === "click:ic:btn:true");

// 2. Динамически добавленный элемент
await page.evaluate(() => document.querySelector("#list").insertAdjacentHTML("beforeend", '<li><button class="btn" id="b2">два</button></li>'));
await page.click("#b2");
check("элемент, добавленный позже, обрабатывается", (await calls()).join() === "click:btn:btn:true");

// 3. Клик мимо селектора
await page.evaluate(() => document.querySelector("#list").insertAdjacentHTML("beforeend", "<li id=plain>просто текст</li>"));
await page.click("#plain");
check("клик по элементу, не подходящему под селектор, игнорируется", (await calls()).length === 0);

// 4. Совпадение вне корня
await page.click("#s-in");
check("подходящий элемент вне корня не срабатывает", (await calls()).length === 0);

// 5. Совпадение, найденное выше корня, и вложенные совпадения
await page.evaluate(() => {
  const widget = document.querySelector("#widget");
  window.off5 = delegate(widget, "click", ".card", (e, m) => window.__calls.push("card:" + m.id));
});
await page.click("#deep");
check("вложенные совпадения: берётся ближайший, и только внутри корня", (await calls()).join() === "card:inner-card");
await page.evaluate(() => document.querySelector("#widget").insertAdjacentHTML("beforeend", "<span id=w2>w2</span>"));
await page.click("#w2");
check("совпадение выше корня (#outer-card) не срабатывает", (await calls()).length === 0);

// 6. off(): отписка и идемпотентность
await page.evaluate(() => { window.off1(); window.off1(); });
await page.click("#b2");
check("off() отписывает; повторный вызов безопасен", (await calls()).length === 0);

// 7. signal
await page.evaluate(() => {
  window.ac = new AbortController();
  delegate(document.querySelector("#list"), "click", ".btn", () => window.__calls.push("signal"), { signal: ac.signal });
});
await page.click("#b2"); const before = (await calls()).join();
await page.evaluate(() => ac.abort());
await page.click("#b2"); const after = (await calls()).length;
check("опция signal снимает слушатель", before === "signal" && after === 0);

// 8. once: считается по срабатыванию, а не по событию
await page.evaluate(() => delegate(document.querySelector("#list"), "click", ".btn", () => window.__calls.push("once"), { once: true }));
await page.click("#plain"); const miss = (await calls()).length;
await page.click("#b2"); await page.click("#b2");
const once = (await calls()).filter((c) => c === "once").length;
check("once: промах не расходует подписку, срабатывает ровно один раз", miss === 0 && once === 1);

// 9. focus делегируется через focusin
await page.evaluate(() => delegate(document.querySelector("#app"), "focus", ".field", (e, m) => window.__calls.push("focus:" + m.id + ":" + e.target.id)));
await page.focus("#fi");
check("focus делегируется (через focusin): matched — обёртка .field", (await calls()).join() === "focus:fw:fi");

// 10. mouseenter / mouseleave без повторов при переходе внутри элемента
await page.evaluate(() => {
  const app = document.querySelector("#app");
  delegate(app, "mouseenter", ".zone", () => window.__calls.push("enter"));
  delegate(app, "mouseleave", ".zone", () => window.__calls.push("leave"));
});
await page.mouse.move(2, 2); await calls();
const zb = await page.locator("#hover").boundingBox(); const cb = await page.locator("#hchild").boundingBox();
await page.mouse.move(zb.x + zb.width - 4, zb.y + zb.height - 4);
await page.mouse.move(cb.x + 10, cb.y + 10);
await page.mouse.move(zb.x + zb.width - 4, zb.y + zb.height - 4);
const inside = (await calls()).join();
await page.mouse.move(2, 2);
const outside = (await calls()).join();
check("mouseenter/mouseleave: один вход и один выход, переходы внутри игнорируются", inside === "enter" && outside === "leave", \`внутри: \${inside}; снаружи: \${outside}\`);

const failed = results.filter((x) => !x).length;
console.log(failed ? \`\\nПровалено: \${failed}\` : \`\\nВсе проверки пройдены: \${results.length}/\${results.length}\`);
await b.close();
process.exit(failed ? 1 : 0);`, { filename: "delegate-test.mjs", collapsed: true }),
      code("text", `✓ клик по вложенному элементу → matched — кнопка, this === matched
✓ элемент, добавленный позже, обрабатывается
✓ клик по элементу, не подходящему под селектор, игнорируется
✓ подходящий элемент вне корня не срабатывает
✓ вложенные совпадения: берётся ближайший, и только внутри корня
✓ совпадение выше корня (#outer-card) не срабатывает
✓ off() отписывает; повторный вызов безопасен
✓ опция signal снимает слушатель
✓ once: промах не расходует подписку, срабатывает ровно один раз
✓ focus делегируется (через focusin): matched — обёртка .field
✓ mouseenter/mouseleave: один вход и один выход, переходы внутри игнорируются — внутри: enter; снаружи: leave

Все проверки пройдены: 11/11`, { filename: "результат запуска (Chromium 141)" }),
      p("Один внутренний `AbortController` отвечает и за `off()`, и за `once`, и за внешний `signal`. `mouseover`/`mouseout` превращаются в вход/выход проверкой `matched.contains(event.relatedTarget)`. Проверено мутациями: замена `closest` на `matches` проваливает 3 теста, снятие проверки корня — 1, удаление псевдонимов `focusin` — 1, потеря семантики `once` — 1, потеря проверки `relatedTarget` — 1."),
    ],
  },

  interview: [
    iq("js.dom-events.i1", "basic", "Что такое всплытие и погружение?", [
      ul(
        "Событие проходит путь от `window` к цели (погружение), затем у цели и обратно вверх (всплытие).",
        "Обычные слушатели срабатывают на всплытии, `capture: true` — на погружении.",
        "Не все события всплывают (`focus`, `blur`, `mouseenter`, `mouseleave`, `load`).",
      ),
    ]),
    iq("js.dom-events.i2", "basic", "Чем отличаются `target` и `currentTarget`?", [
      ul(
        "`target` — элемент, на котором событие возникло (самый глубокий); `currentTarget` — элемент, чей слушатель выполняется.",
        "В обычной функции `this === currentTarget`; в стрелке `this` другой.",
        "После окончания диспетчеризации `currentTarget` — `null`.",
      ),
    ]),
    iq("js.dom-events.i3", "intermediate", "Что такое делегирование и зачем оно нужно?", [
      ul(
        "Один слушатель на предке вместо множества на потомках; цель определяется по `event.target.closest(selector)`.",
        "Работает для элементов, добавленных позже; меньше подписок и утечек (замер: 1 вместо 400 для 200 строк).",
        "Ограничения: нужны всплывающие события и проверка границ `root.contains(found)`.",
      ),
    ]),
    iq("js.dom-events.i4", "intermediate", "Чем `stopPropagation` отличается от `stopImmediatePropagation` и `preventDefault`?", [
      ul(
        "`stopPropagation` останавливает путь к другим узлам, но слушатели того же узла вызываются.",
        "`stopImmediatePropagation` останавливает и остальные слушатели на этом узле.",
        "`preventDefault` отменяет действие браузера (переход по ссылке) и не влияет на распространение; не работает в пассивных слушателях и для неотменяемых событий.",
      ),
    ]),
    iq("js.dom-events.i5", "intermediate", "Как делегировать `focus`?", [
      ul(
        "`focus` не всплывает; используйте `focusin` (всплывает) или `focus` с `capture: true`.",
        "Аналогично `blur` → `focusout`.",
        "Для `mouseenter`/`mouseleave` — `mouseover`/`mouseout` + проверка `relatedTarget`.",
      ),
    ]),
    iq("js.dom-events.i6", "advanced", "Почему меню закрывается сразу после открытия, если закрытие вешается на `document`?", [
      ul(
        "Слушатель `click` на `document` добавлен в обработчике клика по кнопке, ещё до того, как событие дошло до `document`, и вызывается тем же кликом.",
        "Решения: проверять путь события (`composedPath().includes(button)`), добавлять слушатель после завершения события (`setTimeout`) или останавливать распространение (хуже).",
        "Слушатели на `document` держать только пока меню открыто (`AbortController`).",
      ),
    ]),
    iq("js.dom-events.i7", "engineering", "Как отменить десятки слушателей при удалении компонента?", [
      ul(
        "Подписываться с `{ signal: controller.signal }` и вызвать `controller.abort()` при удалении — не нужно хранить ссылки на функции.",
        "Для глобальных слушателей (`window`, `document`) это обязательно: иначе замыкание удерживает узлы DOM.",
        "Для пользовательских компонентов — делать это в `disconnectedCallback`.",
      ),
    ]),
    iq("js.dom-events.i8", "debugging", "`preventDefault()` в обработчике `touchstart` на `document` не работает. Что проверить?", [
      ul(
        "Слушатели `touchstart`/`touchmove`/`wheel` на `window`/`document`/`body` пассивны по умолчанию — нужен `{ passive: false }`.",
        "Проверить предупреждение в консоли «Unable to preventDefault inside passive event listener».",
        "Событие должно быть `cancelable` (`scroll` — нет). Оценить влияние на плавность прокрутки.",
      ),
    ]),
  ],

  exam: [
    mcq("js.dom-events.e1", "foundation", "В каком порядке сработают слушатели при клике по `#c` внутри `#b` внутри `#a`, если на каждом элементе есть обычный слушатель?", ["Только `c`", "`a`, `b`, `c`", "`c`, `b`, `a`", "Порядок не определён"], 2, "Обычные слушатели срабатывают на всплытии: от цели к корню (`c → b → a`)."),
    mcq("js.dom-events.e2", "foundation", "Как получить элемент, на котором висит выполняющийся слушатель?", ["`event.currentTarget`", "`event.target`", "`event.srcElement.parent`", "`document.activeElement`"], 0, "`currentTarget` — узел слушателя; `target` — источник события."),
    mcq("js.dom-events.e3", "intermediate", "Какое событие всплывает?", ["`focus`", "`blur`", "`mouseenter`", "`focusin`"], 3, "`focusin` всплывает (`bubbles=true` в замере), остальные перечисленные — нет."),
    mcq("js.dom-events.e4", "intermediate", "Что произойдёт при `removeEventListener(\"click\", () => log())`, если подписывались другой стрелкой с таким же телом?", ["Слушатель снимется", "Ничего: это другая функция", "Ошибка", "Снимутся все слушатели `click`"], 1, "Снятие требует той же функции и того же `capture`; анонимную стрелку не снять (замер: `anon` продолжил срабатывать)."),
    mcq("js.dom-events.e5", "intermediate", "Что верно для `dispatchEvent(new CustomEvent(\"x\", { cancelable: true }))`?", ["Слушатели вызываются асинхронно", "`detail` недоступен", "Событие всплывает по умолчанию", "Он вернёт `false`, если слушатель вызвал `preventDefault()`"], 3, "`dispatchEvent` синхронен и возвращает `false` только при отмене отменяемого события."),
    mcq("js.dom-events.e6", "advanced", "Что произойдёт при `list.innerHTML = '<img src=x onerror=...>'`?", ["Обработчик не выполнится, это текст", "Исключение", "Элемент создастся, `onerror` выполнится", "Элемент создастся, но обработчик заблокирован браузером"], 2, "`innerHTML` разбирает разметку и создаёт элементы; `onerror` сработал в замере. `textContent` вставил бы строку как текст."),
    mcq("js.dom-events.e7", "advanced", "Что верно про `preventDefault()` и `stopPropagation()`? Выберите все.", ["`preventDefault` останавливает всплытие", "`stopPropagation` отменяет переход по ссылке", "`preventDefault` не влияет на распространение", "`stopPropagation` не отменяет другие слушатели того же элемента"], [2, 3], "Это независимые механизмы: действие по умолчанию и путь события (замер: `outer bubble` после `preventDefault`; `middle bubble` до остановки)."),
    open("js.dom-events.e8", "intermediate", "Объясните, как работает делегирование и какие у него ограничения.", [
      ul(
        "Слушатель на предке получает события потомков благодаря всплытию; источник — `e.target.closest(selector)` с проверкой `root.contains`.",
        "Плюсы: одна подписка, поддержка динамических элементов, меньше утечек.",
        "Ограничения: события без всплытия (`focus`, `mouseenter`) требуют `focusin`/`mouseover`/capture; `stopPropagation` ниже по дереву ломает делегирование; нужны проверки границ.",
      ),
    ], ["Описан механизм (всплытие + closest)", "Названы плюсы", "Названы ограничения"], { format: "concept" }),
  ],

  mastery: [
    mcq("js.dom-events.m1", "intermediate", "Слушатель `click` добавляется на `document` внутри обработчика клика по кнопке. Что произойдёт?", ["Не вызовется для текущего клика", "Вызовется тем же кликом при всплытии до `document`", "Выбросит исключение", "Вызовется дважды"], 1, "Список слушателей узла копируется перед его обходом, но `document` ещё не достигнут — слушатель на нём увидит тот же клик."),
    mcq("js.dom-events.m2", "advanced", "Почему `for (let i = 0; i < xs.length; i++) xs[i].remove()` для `getElementsByClassName` пропускает элементы?", ["Коллекция живая: после удаления индексы сдвигаются", "Баг браузера", "`remove` асинхронный", "Из-за `let`"], 0, "В замере из четырёх элементов обработаны 1 и 3, осталось 2; копия `[...xs]` решает проблему."),
    open("js.dom-events.m3", "advanced", "Разберите отладку: «Кнопки в динамически добавленных строках не реагируют на клик; в старых строках всё работает».", [
      ul(
        "Подписка выполнена на существующие элементы при инициализации (`querySelectorAll(...).forEach(addEventListener)`), а новые строки создаются позже без слушателей.",
        "Исправление: делегирование на контейнере с `closest(\"button[data-action]\")` либо подписка при создании каждой строки (хуже).",
        "Проверка: DevTools → Elements → Event Listeners на новой строке; `getEventListeners`.",
        "Если после исправления кнопка не реагирует — проверить `stopPropagation` у потомков и `pointer-events: none` в CSS.",
      ),
    ], ["Названа причина (нет слушателей у новых элементов)", "Предложено делегирование", "Названы способы проверки"], { format: "debug" }),
    open("js.dom-events.m4", "advanced", "Спроектируйте механизм событий для компонента «Корзина», который сообщает о добавлении и удалении товаров другим частям страницы и может запретить удаление.", [
      ul(
        "Наследование от `EventTarget` или события на корневом элементе компонента.",
        "Имена с пространством: `cart:add`, `cart:remove`; `detail` — простой объект (`{ id, qty }`).",
        "`cart:remove` — `cancelable: true`: если слушатель вызвал `preventDefault()`, компонент не удаляет (результат `dispatchEvent`).",
        "`bubbles: true` (и `composed: true` для теневого DOM) для компонентов, чтобы подписываться на предке.",
        "Документировать контракт событий; тесты: порядок, отмена, отсутствие утечек (`AbortSignal`).",
      ),
    ], ["Названы имена и detail", "Описана отмена через preventDefault", "Описаны bubbles/composed", "Упомянут контракт и тесты"], { format: "architecture" }),
  ],

  flashcards: [
    { id: "js.dom-events.f1", front: "Фазы события?", back: "Погружение (window → цель), цель, всплытие (цель → window). Обычный слушатель — на всплытии, capture: true — на погружении." },
    { id: "js.dom-events.f2", front: "target и currentTarget?", back: "target — источник; currentTarget (и this в обычной функции) — узел исполняемого слушателя; после диспетчеризации currentTarget = null." },
    { id: "js.dom-events.f3", front: "Делегирование?", back: "Один слушатель на предке; e.target.closest(selector) + root.contains(found); работает для динамических элементов." },
    { id: "js.dom-events.f4", front: "Не всплывают?", back: "focus, blur, mouseenter, mouseleave (load, error). Делегируйте focusin/focusout, mouseover/mouseout+relatedTarget или capture." },
    { id: "js.dom-events.f5", front: "preventDefault vs stopPropagation?", back: "preventDefault — отмена действия браузера (cancelable, не в passive); stopPropagation — стоп пути; stopImmediatePropagation — и слушателей на этом узле." },
    { id: "js.dom-events.f6", front: "Снять слушатель?", back: "removeEventListener с той же функцией и тем же capture; анонимную не снять; лучше { signal } + abort()." },
    { id: "js.dom-events.f7", front: "CustomEvent?", back: "new CustomEvent(type, { detail, bubbles, cancelable, composed }); dispatchEvent синхронен и возвращает false при отмене; без composed не пересекает shadow root." },
    { id: "js.dom-events.f8", front: "textContent vs innerHTML?", back: "textContent — текст; innerHTML — разбор разметки (onerror выполнится) — XSS при пользовательских данных." },
  ],

  sources: [
    { title: "DOM Standard: Events", url: "https://dom.spec.whatwg.org/#events", publisher: "WHATWG" },
    { title: "DOM Standard: Dispatching events", url: "https://dom.spec.whatwg.org/#concept-event-dispatch", publisher: "WHATWG" },
    { title: "HTML Standard: Event handlers", url: "https://html.spec.whatwg.org/multipage/webappapis.html#event-handlers", publisher: "WHATWG" },
    { title: "UI Events", url: "https://www.w3.org/TR/uievents/", publisher: "W3C" },
    { title: "MDN: EventTarget.addEventListener()", url: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener", publisher: "MDN" },
    { title: "MDN: Event.stopPropagation()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation", publisher: "MDN" },
    { title: "MDN: Event.composedPath()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath", publisher: "MDN" },
    { title: "MDN: Element.closest()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/closest", publisher: "MDN" },
    { title: "MDN: CustomEvent", url: "https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent", publisher: "MDN" },
    { title: "MDN: Element: focusin event", url: "https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event", publisher: "MDN" },
    { title: "MDN: Node.textContent", url: "https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent", publisher: "MDN" },
  ],
};
