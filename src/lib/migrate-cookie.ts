export type CookieWriteOptions = {
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  path: string;
  maxAge?: number;
};

export type MigratableCookieStore = {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: CookieWriteOptions) => void;
  delete: (options: { name: string; path: string }) => void;
};

function deleteNamedCookie(store: MigratableCookieStore, name: string, path: string) {
  store.delete({ name, path });
}

/**
 * Prefer the current cookie name. If only the legacy name is present, copy it
 * forward and clear the old cookie so sessions/carts/consent are not dropped.
 */
export function readAndMigrateCookie(
  store: MigratableCookieStore,
  currentName: string,
  legacyName: string,
  options: CookieWriteOptions,
): string | undefined {
  const current = store.get(currentName)?.value;
  if (current) {
    if (store.get(legacyName)?.value) {
      deleteNamedCookie(store, legacyName, options.path);
    }
    return current;
  }

  const legacy = store.get(legacyName)?.value;
  if (!legacy) return undefined;

  store.set(currentName, legacy, options);
  deleteNamedCookie(store, legacyName, options.path);
  return legacy;
}

export function writeCookieAndClearLegacy(
  store: MigratableCookieStore,
  currentName: string,
  legacyName: string,
  value: string,
  options: CookieWriteOptions,
) {
  store.set(currentName, value, options);
  deleteNamedCookie(store, legacyName, options.path);
}

export function deleteCookiePair(
  store: MigratableCookieStore,
  currentName: string,
  legacyName: string,
  path: string,
) {
  deleteNamedCookie(store, currentName, path);
  deleteNamedCookie(store, legacyName, path);
}
