import type { Topic } from "../../types";
import { relationalModel } from "./relational-model";
import { dataTypesNull } from "./data-types-null";
import { keysConstraints } from "./keys-constraints";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const sqlTopics: Topic[] = [relationalModel, dataTypesNull, keysConstraints];
