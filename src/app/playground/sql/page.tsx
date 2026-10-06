import type { Metadata } from "next";
import { PlaygroundSwitch } from "@/components/playground/PlaygroundSwitch";
import { SqlPlayground } from "@/components/playground/SqlPlayground";

export const metadata: Metadata = {
  title: "SQL-песочница",
  description: "SQLite в браузере: схема и таблицы, редактор запросов, результаты, ошибки и примеры на учебных наборах данных.",
};

export default function SqlPlaygroundPage() {
  return (
    <>
      <PlaygroundSwitch current="sql" />
      <div className="pt-4">
        <SqlPlayground />
      </div>
    </>
  );
}
