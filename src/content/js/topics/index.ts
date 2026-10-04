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
import { destructuringSpread } from "./destructuring-spread";
import { modulesEsm } from "./modules-esm";
import { iteratorsGenerators } from "./iterators-generators";
import { eventLoop } from "./event-loop";
import { promises } from "./promises";
import { asyncAwaitAbort } from "./async-await-abort";
import { domEvents } from "./dom-events";
import { formsFetch } from "./forms-fetch";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const jsTopics: Topic[] = [whatIsJs, variablesTypes, operatorsCoercion, controlFlow, functionsBasics, higherOrderRecursion, executionContextScope, closures, objectsProperties, prototypesThis, classes, arrays, mapSetWeak, destructuringSpread, modulesEsm, iteratorsGenerators, eventLoop, promises, asyncAwaitAbort, domEvents, formsFetch];
