export type KeyValueStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

/**
 * Prefer the current localStorage key. If only the legacy key is present, copy
 * it forward and remove the old key so cart id and consent are not dropped.
 */
export function readAndMigrateStorage(
  store: KeyValueStore,
  currentKey: string,
  legacyKey: string,
): string | null {
  const current = store.getItem(currentKey);
  if (current !== null) {
    store.removeItem(legacyKey);
    return current;
  }

  const legacy = store.getItem(legacyKey);
  if (legacy === null) return null;

  store.setItem(currentKey, legacy);
  store.removeItem(legacyKey);
  return legacy;
}

export function writeStorageAndClearLegacy(
  store: KeyValueStore,
  currentKey: string,
  legacyKey: string,
  value: string,
) {
  store.setItem(currentKey, value);
  store.removeItem(legacyKey);
}

export function clearStoragePair(store: KeyValueStore, currentKey: string, legacyKey: string) {
  store.removeItem(currentKey);
  store.removeItem(legacyKey);
}
