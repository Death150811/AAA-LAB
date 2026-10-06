import type { Metadata } from "next";
import { Playground } from "@/components/playground/Playground";
import { PlaygroundSwitch } from "@/components/playground/PlaygroundSwitch";

export const metadata: Metadata = {
  title: "Песочница",
  description: "Редактор HTML, CSS и JavaScript с живым результатом и консолью — в изолированном фрейме. SQL — на соседней вкладке.",
};

export default function PlaygroundPage() {
  return (
    <>
      <PlaygroundSwitch current="web" />
      <Playground />
    </>
  );
}
