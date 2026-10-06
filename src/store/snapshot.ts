import { useUserStore } from "./user-store";

/** Всё, что относится к прогрессу ученика (те же поля, что сохраняются в localStorage и экспортируются в «Моё»). */
export function snapshotState() {
  const s = useUserStore.getState();
  return {
    completedTopics: s.completedTopics,
    completedProjects: s.completedProjects,
    projectChecks: s.projectChecks,
    xp: s.xp,
    streak: s.streak,
    bookmarks: s.bookmarks,
    notes: s.notes,
    snippets: s.snippets,
    recent: s.recent,
    attempts: s.attempts,
    cards: s.cards,
  };
}

export function hasProgress(): boolean {
  const s = useUserStore.getState();
  return (
    Object.keys(s.completedTopics).length > 0 ||
    Object.keys(s.completedProjects).length > 0 ||
    s.notes.length > 0 ||
    s.bookmarks.length > 0 ||
    s.snippets.length > 0 ||
    Object.keys(s.cards).length > 0 ||
    s.attempts.length > 0
  );
}
