import type { Project } from "../../types";
import { p01ShopSchema } from "./p01-shop-schema";
import { p02SalesAnalytics } from "./p02-sales-analytics";
import { p03JoinReports } from "./p03-join-reports";
import { p04RankingsHierarchies } from "./p04-rankings-hierarchies";

export const sqlProjects: Project[] = [p01ShopSchema, p02SalesAnalytics, p03JoinReports, p04RankingsHierarchies];
