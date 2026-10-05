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

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const sqlTopics: Topic[] = [relationalModel, dataTypesNull, keysConstraints, selectWhere, orderLimitDistinct, groupByHaving, expressionsCaseDates, insertUpdateDelete, upsertReturning];
