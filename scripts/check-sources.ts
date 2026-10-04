/**
 * Проверка первоисточников: каждый URL из `sources` должен отвечать 2xx/3xx.
 * Запуск: npm run check:sources  (нужен свободный выход в сеть; не входит в обязательную валидацию).
 * В ограниченных песочницах прокси отвечает 403 на все внешние адреса — это не ошибка источников.
 */
import { allTopics } from "../src/content/registry";

const urls = new Map<string, string>();
for (const t of allTopics) for (const s of t.sources ?? []) urls.set(s.url.split("#")[0]!, t.id);

async function main() {
let bad = 0;
for (const [url, topic] of urls) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "devdock-source-check" } });
    const ok = res.status < 400;
    if (!ok) bad++;
    console.log(`${ok ? "OK " : "BAD"} ${res.status} ${url}  (${topic})`);
  } catch (e) {
    bad++;
    console.log(`ERR     ${url}  (${topic}) ${(e as Error).message}`);
  }
}
console.log(`\nПроверено ${urls.size} URL, проблем: ${bad}`);
process.exit(bad ? 1 : 0);
}

main();
