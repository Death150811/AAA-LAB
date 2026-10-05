import type { Project } from "../../types";
import { p01TidyHistory } from "./p01-tidy-history";
import { p02MergeConflicts } from "./p02-merge-conflicts";
import { p03RemoteSync } from "./p03-remote-sync";
import { p04HistoryRescue } from "./p04-history-rescue";
import { p05PlumbingRepo } from "./p05-plumbing-repo";
import { p06ReleaseFlow } from "./p06-release-flow";
import { p07IncidentDay } from "./p07-incident-day";

export const gitProjects: Project[] = [p01TidyHistory, p02MergeConflicts, p03RemoteSync, p04HistoryRescue, p05PlumbingRepo, p06ReleaseFlow, p07IncidentDay];
