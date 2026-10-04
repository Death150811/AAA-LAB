"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Bookmark, CodeLang, DomainId, Note, PracticeAttempt, Snippet } from "@/content/types";
import { safeLocalStorage } from "./storage";

export interface RecentItem {
  id: string;
  title: string;
  href: string;
  at: number;
}

export interface CardState {
  due: number; // timestamp
  interval: number; // дни
  ease: number;
  reps: number;
}

interface UserState {
  completedTopics: Record<string, number>;
  completedProjects: Record<string, number>;
  xp: number;
  streak: { current: number; lastDay: string | null };
  bookmarks: Bookmark[];
  notes: Note[];
  snippets: Snippet[];
  recent: RecentItem[];
  attempts: PracticeAttempt[];
  cards: Record<string, CardState>;

  toggleTopic: (id: string) => void;
  toggleProject: (id: string) => void;
  visit: (item: Omit<RecentItem, "at">) => void;
  toggleBookmark: (b: Omit<Bookmark, "createdAt">) => void;
  saveNote: (n: { id?: string; topicId: string | null; title: string; body: string }) => void;
  deleteNote: (id: string) => void;
  saveSnippet: (s: { title: string; lang: CodeLang; code: string }) => void;
  deleteSnippet: (id: string) => void;
  recordAttempt: (a: { ref: string; topicId: string | null; domain: DomainId; correct: boolean | null }) => void;
  reviewCard: (id: string, grade: 0 | 1 | 2 | 3) => void;
  reset: () => void;
}

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function bumpStreak(s: UserState["streak"]): UserState["streak"] {
  const today = dayKey();
  if (s.lastDay === today) return s;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return { current: s.lastDay === dayKey(y) ? s.current + 1 : 1, lastDay: today };
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const initial = {
  completedTopics: {},
  completedProjects: {},
  xp: 0,
  streak: { current: 0, lastDay: null },
  bookmarks: [],
  notes: [],
  snippets: [],
  recent: [],
  attempts: [],
  cards: {},
} satisfies Partial<UserState>;

export const XP = { topic: 20, project: 100, correct: 5 } as const;

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initial,

      toggleTopic: (id) =>
        set((s) => {
          const done = { ...s.completedTopics };
          if (done[id]) {
            delete done[id];
            return { completedTopics: done, xp: Math.max(0, s.xp - XP.topic) };
          }
          done[id] = Date.now();
          return { completedTopics: done, xp: s.xp + XP.topic, streak: bumpStreak(s.streak) };
        }),

      toggleProject: (id) =>
        set((s) => {
          const done = { ...s.completedProjects };
          if (done[id]) {
            delete done[id];
            return { completedProjects: done, xp: Math.max(0, s.xp - XP.project) };
          }
          done[id] = Date.now();
          return { completedProjects: done, xp: s.xp + XP.project, streak: bumpStreak(s.streak) };
        }),

      visit: (item) =>
        set((s) => ({
          recent: [{ ...item, at: Date.now() }, ...s.recent.filter((r) => r.id !== item.id)].slice(0, 12),
          streak: bumpStreak(s.streak),
        })),

      toggleBookmark: (b) =>
        set((s) =>
          s.bookmarks.some((x) => x.id === b.id)
            ? { bookmarks: s.bookmarks.filter((x) => x.id !== b.id) }
            : { bookmarks: [{ ...b, createdAt: Date.now() }, ...s.bookmarks] },
        ),

      saveNote: ({ id, topicId, title, body }) =>
        set((s) => {
          const now = Date.now();
          if (id && s.notes.some((n) => n.id === id)) {
            return { notes: s.notes.map((n) => (n.id === id ? { ...n, title, body, topicId, updatedAt: now } : n)) };
          }
          return { notes: [{ id: uid(), topicId, title, body, createdAt: now, updatedAt: now }, ...s.notes] };
        }),

      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      saveSnippet: ({ title, lang, code }) =>
        set((s) => ({ snippets: [{ id: uid(), title, lang, code, createdAt: Date.now() }, ...s.snippets].slice(0, 100) })),

      deleteSnippet: (id) => set((s) => ({ snippets: s.snippets.filter((x) => x.id !== id) })),

      recordAttempt: ({ ref, topicId, domain, correct }) =>
        set((s) => {
          const firstCorrect = correct === true && !s.attempts.some((a) => a.ref === ref && a.correct === true);
          const attempt: PracticeAttempt = { id: uid(), ref, topicId, domain, correct, at: Date.now() };
          return {
            attempts: [attempt, ...s.attempts].slice(0, 500),
            xp: s.xp + (firstCorrect ? XP.correct : 0),
            streak: bumpStreak(s.streak),
          };
        }),

      // Упрощённый SM-2: grade 0 — не помню, 1 — трудно, 2 — хорошо, 3 — легко
      reviewCard: (id, grade) =>
        set((s) => {
          const prev = s.cards[id] ?? { due: 0, interval: 0, ease: 2.5, reps: 0 };
          let { interval, ease, reps } = prev;
          if (grade === 0) {
            reps = 0;
            interval = 0;
            ease = Math.max(1.3, ease - 0.2);
          } else {
            reps += 1;
            interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ease * (grade === 1 ? 0.8 : grade === 3 ? 1.3 : 1));
            ease = Math.max(1.3, ease + (grade === 3 ? 0.1 : grade === 1 ? -0.15 : 0));
          }
          const due = Date.now() + Math.max(interval, 0) * 86_400_000 + (interval === 0 ? 10 * 60_000 : 0);
          return { cards: { ...s.cards, [id]: { due, interval, ease, reps } }, streak: bumpStreak(s.streak) };
        }),

      reset: () => set({ ...initial }),
    }),
    {
      name: "devdock-user-v1",
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      // Гидратация выполняется вручную на клиенте (StoreHydrator) — без расхождения SSR/CSR.
      skipHydration: true,
      partialize: (s) => ({
        completedTopics: s.completedTopics,
        completedProjects: s.completedProjects,
        xp: s.xp,
        streak: s.streak,
        bookmarks: s.bookmarks,
        notes: s.notes,
        snippets: s.snippets,
        recent: s.recent,
        attempts: s.attempts,
        cards: s.cards,
      }),
    },
  ),
);
