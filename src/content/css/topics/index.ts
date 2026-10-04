import type { Topic } from "../../types";
import { howCssWorks } from "./how-css-works";
import { selectors } from "./selectors";
import { pseudoClassesElements } from "./pseudo-classes-elements";
import { cascade } from "./cascade";
import { specificity } from "./specificity";
import { inheritanceValues } from "./inheritance-values";
import { unitsMath } from "./units-math";
import { colors } from "./colors";
import { boxModel } from "./box-model";
import { displayFlow } from "./display-flow";
import { marginCollapsing } from "./margin-collapsing";
import { overflowSizing } from "./overflow-sizing";
import { typography } from "./typography";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const cssTopics: Topic[] = [howCssWorks, selectors, pseudoClassesElements, cascade, specificity, inheritanceValues, unitsMath, colors, boxModel, displayFlow, marginCollapsing, overflowSizing, typography];
