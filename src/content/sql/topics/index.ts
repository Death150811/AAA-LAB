import type { Topic } from "../../types";
import { relationalModel } from "./relational-model";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const sqlTopics: Topic[] = [relationalModel];
