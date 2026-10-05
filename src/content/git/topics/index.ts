import type { Topic } from "../../types";
import { gitMentalModel } from "./git-mental-model";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const gitTopics: Topic[] = [gitMentalModel];
