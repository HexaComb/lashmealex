import { expect, test } from "vitest";

import {
  clearStoragePair,
  readAndMigrateStorage,
  writeStorageAndClearLegacy,
  type KeyValueStore,
} from "./migrate-local-storage";

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key]! : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

test("reads the current localStorage key", () => {
  const store = memoryStore({ cheri_cosmetics_cart_id: "cart_1" });
  expect(readAndMigrateStorage(store, "cheri_cosmetics_cart_id", "lashmealex_cart_id")).toBe("cart_1");
  expect(store.data).toEqual({ cheri_cosmetics_cart_id: "cart_1" });
});

test("promotes a legacy localStorage key and removes the old one", () => {
  const store = memoryStore({ lashmealex_cart_id: "cart_1" });
  expect(readAndMigrateStorage(store, "cheri_cosmetics_cart_id", "lashmealex_cart_id")).toBe("cart_1");
  expect(store.data).toEqual({ cheri_cosmetics_cart_id: "cart_1" });
});

test("writes the current key and clears the legacy key", () => {
  const store = memoryStore({ lashmealex_cookie_consent: "accepted" });
  writeStorageAndClearLegacy(store, "cheri_cosmetics_cookie_consent", "lashmealex_cookie_consent", "accepted");
  expect(store.data).toEqual({ cheri_cosmetics_cookie_consent: "accepted" });
});

test("clears both current and legacy keys", () => {
  const store = memoryStore({
    cheri_cosmetics_cart_id: "cart_1",
    lashmealex_cart_id: "cart_old",
  });
  clearStoragePair(store, "cheri_cosmetics_cart_id", "lashmealex_cart_id");
  expect(store.data).toEqual({});
});
