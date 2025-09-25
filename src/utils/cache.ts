// Simple 1-hour SWR-style cache: in-memory + localStorage fallback.
// Store JSON-serializable data only.

// Example:
//   const key = cache.key('antDetail', arnsname, 1);
//   const data = cache.get<MyType>(key, 3600_000);
//   cache.set(key, data);

type CacheEntry<T> = { data: T; storedAt: number };

const mem = new Map<string, CacheEntry<unknown>>();
const LS_PREFIX = 'aoapp:cache:';

const now = () => Date.now();

function lsRead<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function lsWrite<T>(key: string, entry: CacheEntry<T>) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
  } catch {
    // ignore (quota, privacy, etc.)
  }
}

function lsDel(key: string) {
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    //
  }
}

export const cache = {
  /** Build a namespaced, versioned key. */
  key(ns: string, arnsname: string, version = 1) {
    return `${ns}:${arnsname.trim().toLowerCase()}:v${version}`;
  },

  /** Get with TTL. Checks memory → localStorage. Warms memory if LS hit. */
  get<T>(key: string, ttlMs: number): T | null {
    const memEntry = mem.get(key) as CacheEntry<T> | undefined;
    const entry = memEntry ?? lsRead<T>(key);
    if (!entry) return null;
    if (now() - entry.storedAt > ttlMs) return null;
    if (!memEntry) mem.set(key, entry); // warm memory
    return entry.data;
  },

  /** Set both memory and localStorage. */
  set<T>(key: string, data: T) {
    const entry: CacheEntry<T> = { data, storedAt: now() };
    mem.set(key, entry);
    lsWrite(key, entry);
  },

  /** Remove from both memory and localStorage. */
  remove(key: string) {
    mem.delete(key);
    lsDel(key);
  },
};
