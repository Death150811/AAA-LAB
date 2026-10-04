import type { Topic } from "../../types";
import { howCssWorks } from "./how-css-works";
import { selectors } from "./selectors";
import { pseudoClassesElements } from "./pseudo-classes-elements";
import { cascade } from "./cascade";
import { specificity } from "./specificity";
import { inheritanceValues } from "./inheritance-values";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const cssTopics: Topic[] = [howCssWorks, selectors, pseudoClassesElements, cascade, specificity, inheritanceValues];
