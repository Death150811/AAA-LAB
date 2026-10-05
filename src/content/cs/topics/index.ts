import type { Topic } from "../../types";
import { complexityBigO } from "./complexity-big-o";
import { searchingSorting } from "./searching-sorting";
import { recursionDp } from "./recursion-dp";
import { arraysLinkedLists } from "./arrays-linked-lists";
import { stacksQueues } from "./stacks-queues";
import { hashTables } from "./hash-tables";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const csTopics: Topic[] = [complexityBigO, searchingSorting, recursionDp, arraysLinkedLists, stacksQueues, hashTables];
