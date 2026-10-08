/** localStorage that never throws (private mode, blocked storage, prerender). Spec §4.6. */
function store(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  get(key: string): string | null {
    try {
      return store()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      store()?.setItem(key, value);
    } catch {
      /* storage unavailable — the site works without it */
    }
  },
  remove(key: string): void {
    try {
      store()?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/**
 * Zustand persist-compatible storage on top of safeStorage. `getItem` hands back only text that parses as JSON:
 * a malformed value is dropped and read as "nothing saved", so the store still finishes loading (a throw here
 * would leave it waiting forever).
 */
export const safeJSONStorage = {
  getItem: (name: string) => {
    const raw = safeStorage.get(name);
    if (raw === null) return null;
    try {
      JSON.parse(raw);
      return raw;
    } catch {
      safeStorage.remove(name);
      return null;
    }
  },
  setItem: (name: string, value: string) => safeStorage.set(name, value),
  removeItem: (name: string) => safeStorage.remove(name),
};
