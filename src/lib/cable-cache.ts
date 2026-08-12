const DB_NAME = "cable-scanner";
const STORE = "cables";
const VERSION_KEY = "cable-cache-version";
const CURRENT_VERSION = 2; // Bump to force cache invalidation
const TTL_MS = 60 * 60 * 1000; // 1 hour

type Entry<T> = { key: string; value: T; storedAt: number };

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  // Invalidate all cached data when version changes (e.g. demo → fnt switch)
  if (typeof localStorage !== "undefined") {
    const prev = localStorage.getItem(VERSION_KEY);
    if (prev !== String(CURRENT_VERSION)) {
      await cacheClear();
      localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
    }
  }
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    request.onsuccess = () => {
      const entry = request.result as Entry<T> | undefined;
      if (!entry || Date.now() - entry.storedAt > TTL_MS) return resolve(null);
      resolve(entry.value);
    };
    request.onerror = () => resolve(null);
  });
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  if (!db) return;
  const entry: Entry<T> = { key, value, storedAt: Date.now() };
  db.transaction(STORE, "readwrite").objectStore(STORE).put(entry);
}

export async function cacheClear(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  db.transaction(STORE, "readwrite").objectStore(STORE).clear();
}
