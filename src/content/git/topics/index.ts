import type { Topic } from "../../types";
import { gitMentalModel } from "./git-mental-model";
import { threeAreas } from "./three-areas";
import { commitsHistory } from "./commits-history";
import { undoingChanges } from "./undoing-changes";
import { gitignoreTracking } from "./gitignore-tracking";
import { searchingHistory } from "./searching-history";
import { branchesHead } from "./branches-head";
import { merge } from "./merge";
import { mergeConflicts } from "./merge-conflicts";
import { remotesFetchPush } from "./remotes-fetch-push";
import { remoteCollaboration } from "./remote-collaboration";
import { rebase } from "./rebase";
import { interactiveRebase } from "./interactive-rebase";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const gitTopics: Topic[] = [gitMentalModel, threeAreas, commitsHistory, undoingChanges, gitignoreTracking, searchingHistory, branchesHead, merge, mergeConflicts, remotesFetchPush, remoteCollaboration, rebase, interactiveRebase];
