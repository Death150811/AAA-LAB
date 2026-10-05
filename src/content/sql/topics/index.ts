import type { Topic } from "../../types";
import { relationalModel } from "./relational-model";
import { dataTypesNull } from "./data-types-null";
import { keysConstraints } from "./keys-constraints";
import { selectWhere } from "./select-where";
import { orderLimitDistinct } from "./order-limit-distinct";
import { groupByHaving } from "./group-by-having";
import { expressionsCaseDates } from "./expressions-case-dates";
import { insertUpdateDelete } from "./insert-update-delete";
import { upsertReturning } from "./upsert-returning";
import { innerLeftJoins } from "./inner-left-joins";
import { otherJoins } from "./other-joins";
import { joinPitfalls } from "./join-pitfalls";
import { subqueries } from "./subqueries";
import { ctes } from "./ctes";
import { recursiveCtes } from "./recursive-ctes";
import { windowFunctions } from "./window-functions";
import { normalization } from "./normalization";
import { relationships } from "./relationships";
import { schemaPatterns } from "./schema-patterns";
import { acidTransactions } from "./acid-transactions";
import { isolationLevels } from "./isolation-levels";
import { lockingDeadlocks } from "./locking-deadlocks";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const sqlTopics: Topic[] = [relationalModel, dataTypesNull, keysConstraints, selectWhere, orderLimitDistinct, groupByHaving, expressionsCaseDates, insertUpdateDelete, upsertReturning, innerLeftJoins, otherJoins, joinPitfalls, subqueries, ctes, recursiveCtes, windowFunctions, normalization, relationships, schemaPatterns, acidTransactions, isolationLevels, lockingDeadlocks];
