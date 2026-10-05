import type { Project } from "../../types";
import { p01ShopSchema } from "./p01-shop-schema";
import { p02SalesAnalytics } from "./p02-sales-analytics";

export const sqlProjects: Project[] = [p01ShopSchema, p02SalesAnalytics];
