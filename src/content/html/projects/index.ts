import type { Project } from "../../types";
import { p01Profile } from "./p01-profile";
import { p02Portfolio } from "./p02-portfolio";

/** Кумулятивные проекты курса HTML — в порядке выполнения. */
export const htmlProjects: Project[] = [p01Profile, p02Portfolio];
