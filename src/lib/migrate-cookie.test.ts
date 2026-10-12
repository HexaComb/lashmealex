import { expect, test } from "vitest";

import {
  deleteCookiePair,
  readAndMigrateCookie,
  writeCookieAndClearLegacy,
  type CookieWriteOptions,
  type MigratableCookieStore,
} from "./migrate-cookie";

const options: CookieWriteOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  path: "/",
};

function memoryStore(initial: Record<string, string> = {}): MigratableCookieStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    get: (name) => (data[name] !== undefined ? { value: data[name] } : undefined),
    set: (name, value) => {
      data[name] = value;
    },
    delete: (input) => {
      delete data[input.name];
    },
  };
}

test("reads the current cookie name without touching a missing legacy cookie", () => {
  const store = memoryStore({ cheri_cosmetics_cart_access: "cart_1.token" });
  expect(readAndMigrateCookie(store, "cheri_cosmetics_cart_access", "lashmealex_cart_access", options)).toBe(
    "cart_1.token",
  );
  expect(store.data).toEqual({ cheri_cosmetics_cart_access: "cart_1.token" });
});

test("copies a legacy cookie to the new name and clears the old one", () => {
  const store = memoryStore({ lashmealex_cart_access: "cart_1.token" });
  expect(readAndMigrateCookie(store, "cheri_cosmetics_cart_access", "lashmealex_cart_access", options)).toBe(
    "cart_1.token",
  );
  expect(store.data).toEqual({ cheri_cosmetics_cart_access: "cart_1.token" });
});

test("prefers the current cookie and still clears a leftover legacy cookie", () => {
  const store = memoryStore({
    cheri_cosmetics_cart_access: "new.token",
    lashmealex_cart_access: "old.token",
  });
  expect(readAndMigrateCookie(store, "cheri_cosmetics_cart_access", "lashmealex_cart_access", options)).toBe(
    "new.token",
  );
  expect(store.data).toEqual({ cheri_cosmetics_cart_access: "new.token" });
});

test("writes the current name and clears the legacy name", () => {
  const store = memoryStore({ lashmealex_cart_access: "old.token" });
  writeCookieAndClearLegacy(store, "cheri_cosmetics_cart_access", "lashmealex_cart_access", "cart_2.token", options);
  expect(store.data).toEqual({ cheri_cosmetics_cart_access: "cart_2.token" });
});

test("deletes both current and legacy cookies", () => {
  const store = memoryStore({
    cheri_cosmetics_cart_access: "new.token",
    lashmealex_cart_access: "old.token",
  });
  deleteCookiePair(store, "cheri_cosmetics_cart_access", "lashmealex_cart_access", "/");
  expect(store.data).toEqual({});
});
