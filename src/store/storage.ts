import type { StateStorage } from "zustand/middleware";

/**
 * Адаптер хранилища. Сейчас — localStorage; интерфейс StateStorage совпадает с тем,
 * что понадобится для замены на серверное/облачное хранилище (Supabase, PostgreSQL).
 * Любые сбои (приватный режим, квота) не должны ломать приложение.
 */
export const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* квота исчерпана или хранилище недоступно */
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};
