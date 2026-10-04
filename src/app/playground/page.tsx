import type { Metadata } from "next";
import { Playground } from "@/components/playground/Playground";

export const metadata: Metadata = {
  title: "Песочница",
  description: "Редактор HTML, CSS и JavaScript с живым результатом и консолью — в изолированном фрейме.",
};

export default function PlaygroundPage() {
  return <Playground />;
}
