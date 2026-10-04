import type { Topic } from "../../types";
import { whatIsJs } from "./what-is-js";
import { variablesTypes } from "./variables-types";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const jsTopics: Topic[] = [whatIsJs, variablesTypes];
