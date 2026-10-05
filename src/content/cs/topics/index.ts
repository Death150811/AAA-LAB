import type { Topic } from "../../types";
import { complexityBigO } from "./complexity-big-o";
import { searchingSorting } from "./searching-sorting";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const csTopics: Topic[] = [complexityBigO, searchingSorting];
