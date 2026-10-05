import type { Project } from "../../types";
import { p01TidyHistory } from "./p01-tidy-history";
import { p02MergeConflicts } from "./p02-merge-conflicts";

export const gitProjects: Project[] = [p01TidyHistory, p02MergeConflicts];
