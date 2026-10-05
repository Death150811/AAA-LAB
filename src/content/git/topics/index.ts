import type { Topic } from "../../types";
import { gitMentalModel } from "./git-mental-model";
import { threeAreas } from "./three-areas";
import { commitsHistory } from "./commits-history";
import { undoingChanges } from "./undoing-changes";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const gitTopics: Topic[] = [gitMentalModel, threeAreas, commitsHistory, undoingChanges];
