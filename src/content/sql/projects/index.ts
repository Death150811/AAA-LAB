import type { Project } from "../../types";
import { p01ShopSchema } from "./p01-shop-schema";
import { p02SalesAnalytics } from "./p02-sales-analytics";
import { p03JoinReports } from "./p03-join-reports";
import { p04RankingsHierarchies } from "./p04-rankings-hierarchies";
import { p05SchoolNormalization } from "./p05-school-normalization";
import { p06ReliableBooking } from "./p06-reliable-booking";
import { p07ShopFinal } from "./p07-shop-final";

export const sqlProjects: Project[] = [p01ShopSchema, p02SalesAnalytics, p03JoinReports, p04RankingsHierarchies, p05SchoolNormalization, p06ReliableBooking, p07ShopFinal];
