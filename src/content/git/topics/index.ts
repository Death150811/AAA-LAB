import type { Topic } from "../../types";
import { gitMentalModel } from "./git-mental-model";
import { threeAreas } from "./three-areas";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const gitTopics: Topic[] = [gitMentalModel, threeAreas];
