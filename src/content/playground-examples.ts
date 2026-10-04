import { dedent } from "./dsl";

export interface PlaygroundExample {
  id: string;
  title: string;
  description: string;
  html: string;
  css: string;
  js: string;
}

const ex = (e: PlaygroundExample): PlaygroundExample => ({
  ...e,
  html: dedent(e.html),
  css: dedent(e.css),
  js: dedent(e.js),
});

export const EXAMPLES: PlaygroundExample[] = [
  ex({
    id: "semantic-page",
    title: "Семантическая страница",
    description: "Каркас документа: ориентиры, заголовки, список ссылок. Отключите CSS — структура остаётся читаемой.",
    html: `
      <header>
        <h1>Кофейня «Зерно»</h1>
        <nav aria-label="Основная">
          <ul>
            <li><a href="#menu" aria-current="page">Меню</a></li>
            <li><a href="#contacts">Контакты</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <h2 id="menu">Меню</h2>
        <ul>
          <li>Эспрессо — 150&nbsp;₽</li>
          <li>Капучино — 220&nbsp;₽</li>
        </ul>
        <h2 id="contacts">Контакты</h2>
        <p>Москва, ул. Тверская, 1</p>
      </main>
    `,
    css: `
      body { font: 16px/1.6 system-ui, sans-serif; margin: 0; padding: 1.5rem; max-width: 40rem; }
      nav ul { display: flex; gap: 1rem; list-style: none; padding: 0; }
      [aria-current="page"] { font-weight: 700; }
    `,
    js: ``,
  }),
  ex({
    id: "form-validation",
    title: "Форма с встроенной валидацией",
    description: "Ограничения HTML: required, type, pattern, minlength. Попробуйте отправить пустую форму.",
    html: `
      <form id="signup" novalidate>
        <p>
          <label for="email">Почта</label><br>
          <input id="email" name="email" type="email" required autocomplete="email">
        </p>
        <p>
          <label for="pwd">Пароль (от 8 символов)</label><br>
          <input id="pwd" name="pwd" type="password" required minlength="8" autocomplete="new-password">
        </p>
        <p>
          <label for="zip">Индекс</label><br>
          <input id="zip" name="zip" inputmode="numeric" pattern="[0-9]{6}" title="Шесть цифр">
        </p>
        <button type="submit">Отправить</button>
      </form>
      <p id="status" role="status"></p>
    `,
    css: `
      body { font: 16px/1.5 system-ui, sans-serif; padding: 1.5rem; }
      input { padding: .4rem .6rem; font: inherit; }
      input:user-invalid { outline: 2px solid #c0392b; }
      input:user-valid { outline: 2px solid #1e8449; }
    `,
    js: `
      const form = document.getElementById("signup");
      const status = document.getElementById("status");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          status.textContent = "Исправьте отмеченные поля.";
          form.reportValidity();
          return;
        }
        status.textContent = "Данные корректны (отправка отключена в песочнице).";
      });
    `,
  }),
  ex({
    id: "flexbox-cards",
    title: "Раскладка карточек (Flexbox)",
    description: "Одномерная раскладка: перенос, равные доли и выравнивание.",
    html: `
      <ul class="cards">
        <li><h3>HTML</h3><p>Структура и смысл</p></li>
        <li><h3>CSS</h3><p>Оформление и раскладка</p></li>
        <li><h3>JS</h3><p>Поведение</p></li>
      </ul>
    `,
    css: `
      body { font: 16px/1.5 system-ui, sans-serif; padding: 1.5rem; }
      .cards { display: flex; flex-wrap: wrap; gap: 1rem; list-style: none; padding: 0; }
      .cards li { flex: 1 1 10rem; border: 1px solid #ccc; border-radius: .5rem; padding: 1rem; }
      h3 { margin: 0 0 .25rem; }
    `,
    js: ``,
  }),
  ex({
    id: "events-delegation",
    title: "События и делегирование",
    description: "Один обработчик на контейнере вместо десятка на элементах. Смотрите консоль.",
    html: `
      <ul id="list">
        <li><button data-id="1">Задача 1</button></li>
        <li><button data-id="2">Задача 2</button></li>
        <li><button data-id="3">Задача 3</button></li>
      </ul>
      <button id="add">Добавить задачу</button>
    `,
    css: `
      body { font: 16px/1.5 system-ui, sans-serif; padding: 1.5rem; }
      li { margin: .4rem 0; list-style: none; }
    `,
    js: `
      const list = document.getElementById("list");

      list.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-id]");
        if (!button) return;
        console.log("Клик по задаче", button.dataset.id);
      });

      let n = 3;
      document.getElementById("add").addEventListener("click", () => {
        n += 1;
        const li = document.createElement("li");
        li.innerHTML = '<button data-id="' + n + '">Задача ' + n + "</button>";
        list.append(li);   // новые кнопки работают без нового обработчика
      });
    `,
  }),
  ex({
    id: "closure-counter",
    title: "Замыкание: счётчик",
    description: "Функция помнит своё лексическое окружение. Результат — в консоли.",
    html: `<p>Откройте консоль песочницы.</p>`,
    css: `body { font: 16px/1.5 system-ui, sans-serif; padding: 1.5rem; }`,
    js: `
      function makeCounter() {
        let count = 0;
        return () => ++count;
      }

      const a = makeCounter();
      const b = makeCounter();

      console.log(a(), a(), a());   // 1 2 3
      console.log(b());             // 1 — у каждого счётчика своё окружение
    `,
  }),
  ex({
    id: "event-loop",
    title: "Порядок выполнения: цикл событий",
    description: "Микрозадачи (Promise) выполняются раньше макрозадач (setTimeout). Предскажите вывод, затем запустите.",
    html: `<p>Результат — в консоли.</p>`,
    css: `body { font: 16px/1.5 system-ui, sans-serif; padding: 1.5rem; }`,
    js: `
      console.log("1 — синхронный код");

      setTimeout(() => console.log("4 — макрозадача (setTimeout)"), 0);

      Promise.resolve().then(() => console.log("3 — микрозадача (Promise)"));

      console.log("2 — синхронный код");
    `,
  }),
];
