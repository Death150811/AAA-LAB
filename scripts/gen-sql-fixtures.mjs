// Собирает src/content/sql/fixtures.ts из файлов src/content/sql/fixtures/*.sql.
// Запуск: node scripts/gen-sql-fixtures.mjs  (источник правды — .sql-файлы: по ним же проверяются примеры в PostgreSQL и SQLite).
import fs from "node:fs";
import path from "node:path";
const dir = path.resolve("src/content/sql/fixtures");
const entries = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => [f.replace(/\.sql$/, ""), fs.readFileSync(path.join(dir, f), "utf8").trimEnd()]);
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
const body = entries.map(([name, text]) => `  ${JSON.stringify(name)}: \`${esc(text)}\`,`).join("\n");
fs.writeFileSync(path.resolve("src/content/sql/fixtures.ts"), `// Сгенерировано scripts/gen-sql-fixtures.mjs из src/content/sql/fixtures/*.sql — не редактировать вручную.\nexport const SQL_FIXTURES: Record<string, string> = {\n${body}\n};\n`);
console.log("fixtures.ts:", entries.map(([n]) => n).join(", "));
