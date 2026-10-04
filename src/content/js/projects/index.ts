import type { Project } from "../../types";
import { p01DataWithoutSurprises } from "./p01-data-without-surprises";
import { p02LibraryModel } from "./p02-library-model";
import { p03DependencyGraph } from "./p03-dependency-graph";

export const jsProjects: Project[] = [p01DataWithoutSurprises, p02LibraryModel, p03DependencyGraph];
