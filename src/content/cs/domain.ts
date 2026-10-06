import type { DomainDef } from "../types";

export const csDomain: DomainDef = {
  id: "cs",
  code: "06",
  slug: "cs",
  title: "Computer Science",
  subtitle: "The Theory Behind Software",
  tagline: "Теория, на которой стоит программное обеспечение",
  overview: [
    "Фундамент, объясняющий **почему** технологии из остальных курсов устроены именно так: алгоритмы и сложность, структуры данных, устройство компьютера, операционные системы, сети, языки программирования.",
    "Материал связан с практикой: каждая тема указывает, где эта теория проявляется в вебе, JavaScript, SQL и Git.",
  ],
  why: [
    "Инструменты устаревают, принципы — нет. Теория позволяет быстро осваивать новое.",
    "Собеседования и экзамены проверяют именно понимание фундаментальных идей.",
  ],
  outcomes: [
    "Оценивать сложность алгоритмов и выбирать структуры данных под задачу",
    "Понимать, что происходит от нажатия клавиши до ответа сервера",
    "Рассуждать о памяти, процессах, потоках и конкурентности",
    "Объяснять работу HTTP, TLS, DNS и кеширования",
    "Оценивать качество архитектуры: связность, зацепление, тестируемость",
  ],
  prerequisites: ["Желательно: базовые модули HTML и JavaScript"],
  estimatedHours: 150,
  accent: "indigo",
  modules: [
    { id: "algorithms", index: 1, project: "cs.p01-algorithm-lab", title: "Алгоритмы и сложность", titleEn: "Algorithms & Complexity", summary: "Big O/Θ/Ω, поиск, сортировка, рекурсия.", level: "foundation" },
    { id: "data-structures", index: 2, project: "cs.p02-data-structure-library", title: "Структуры данных", titleEn: "Data Structures", summary: "Массивы, списки, стеки, очереди, хеш-таблицы, деревья, кучи, графы.", level: "core" },
    { id: "architecture", index: 3, project: "cs.p03-cpu-and-cache", title: "Архитектура компьютера", titleEn: "Computer Architecture", summary: "Биты, байты, системы счисления, CPU, память, кеш, хранилище.", level: "core" },
    { id: "os", index: 4, project: "cs.p04-scheduler-and-memory", title: "Операционные системы", titleEn: "Operating Systems", summary: "Процессы, потоки, планирование, виртуальная память, файловые системы.", level: "intermediate" },
    { id: "networking", index: 5, project: "cs.p05-wire-protocols", title: "Сети", titleEn: "Networking", summary: "Модель сети, IP, TCP, UDP, DNS, HTTP, TLS, кеширование, cookies.", level: "intermediate" },
    { id: "databases", index: 6, project: "cs.p06-mini-database", title: "Базы данных (теория)", titleEn: "Database Theory", summary: "Теория, стоящая за SQL: отношения, индексы, транзакции.", level: "advanced" },
    { id: "languages", index: 7, title: "Языки программирования", titleEn: "Programming Language Concepts", summary: "Компиляция, интерпретация, парсинг, система типов, модели памяти.", level: "advanced" },
    { id: "software-engineering", index: 8, title: "Программная инженерия", titleEn: "Software Engineering", summary: "Абстракция, модульность, связность, тестирование, архитектура.", level: "engineering" },
    { id: "capstone", index: 9, project: "cs.p07-mini-ml", title: "Итоговый проект", titleEn: "Final Project", summary: "Мини-ML: лексер, парсер, вывод типов Хиндли — Милнера, интерпретатор и компилятор в байт-код с виртуальной машиной — и тесты, проверяемые мутациями.", level: "mastery" },
  ],
};
