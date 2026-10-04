import type { Project } from "../../types";
import { p01Profile } from "./p01-profile";
import { p02Portfolio } from "./p02-portfolio";
import { p03Blog } from "./p03-blog";
import { p04Docs } from "./p04-docs";

/** Кумулятивные проекты курса HTML — в порядке выполнения. */
export const htmlProjects: Project[] = [p01Profile, p02Portfolio, p03Blog, p04Docs];
