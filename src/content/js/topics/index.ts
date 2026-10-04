import type { Topic } from "../../types";
import { whatIsJs } from "./what-is-js";
import { variablesTypes } from "./variables-types";
import { operatorsCoercion } from "./operators-coercion";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const jsTopics: Topic[] = [whatIsJs, variablesTypes, operatorsCoercion];
