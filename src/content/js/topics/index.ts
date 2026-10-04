import type { Topic } from "../../types";
import { whatIsJs } from "./what-is-js";
import { variablesTypes } from "./variables-types";
import { operatorsCoercion } from "./operators-coercion";
import { controlFlow } from "./control-flow";
import { functionsBasics } from "./functions-basics";
import { higherOrderRecursion } from "./higher-order-recursion";
import { executionContextScope } from "./execution-context-scope";
import { closures } from "./closures";
import { objectsProperties } from "./objects-properties";
import { prototypesThis } from "./prototypes-this";
import { classes } from "./classes";
import { arrays } from "./arrays";
import { mapSetWeak } from "./map-set-weak";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const jsTopics: Topic[] = [whatIsJs, variablesTypes, operatorsCoercion, controlFlow, functionsBasics, higherOrderRecursion, executionContextScope, closures, objectsProperties, prototypesThis, classes, arrays, mapSetWeak];
