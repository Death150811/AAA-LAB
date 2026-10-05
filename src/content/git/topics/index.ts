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
import { cherryPickStash } from "./cherry-pick-stash";
import { resetRevertReflog } from "./reset-revert-reflog";
import { bisect } from "./bisect";
import { objectsContentAddressing } from "./objects-content-addressing";
import { refsPackfilesGc } from "./refs-packfiles-gc";
import { branchingStrategies } from "./branching-strategies";
import { commitQualityHooks } from "./commit-quality-hooks";
import { releasesTags } from "./releases-tags";

/** Темы домена в порядке изучения. Порядок определяет состав модулей. */
export const gitTopics: Topic[] = [gitMentalModel, threeAreas, commitsHistory, undoingChanges, gitignoreTracking, searchingHistory, branchesHead, merge, mergeConflicts, remotesFetchPush, remoteCollaboration, rebase, interactiveRebase, cherryPickStash, resetRevertReflog, bisect, objectsContentAddressing, refsPackfilesGc, branchingStrategies, commitQualityHooks, releasesTags];
