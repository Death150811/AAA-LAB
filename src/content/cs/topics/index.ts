import type { Topic } from "../../types";
import { complexityBigO } from "./complexity-big-o";
import { searchingSorting } from "./searching-sorting";
import { recursionDp } from "./recursion-dp";
import { arraysLinkedLists } from "./arrays-linked-lists";
import { stacksQueues } from "./stacks-queues";
import { hashTables } from "./hash-tables";
import { treesHeaps } from "./trees-heaps";
import { graphs } from "./graphs";
import { numberSystemsEncoding } from "./number-systems-encoding";
import { cpuMemoryCache } from "./cpu-memory-cache";
import { processesThreads } from "./processes-threads";
import { virtualMemoryFiles } from "./virtual-memory-files";
import { concurrencyScheduling } from "./concurrency-scheduling";
import { networkModelIpTcp } from "./network-model-ip-tcp";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const csTopics: Topic[] = [complexityBigO, searchingSorting, recursionDp, arraysLinkedLists, stacksQueues, hashTables, treesHeaps, graphs, numberSystemsEncoding, cpuMemoryCache, processesThreads, virtualMemoryFiles, concurrencyScheduling, networkModelIpTcp];
