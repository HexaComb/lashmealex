import { expect, test } from "vitest";

import { resolveSellableCartVariant, toCartLine } from "./storefront-product";
import type { StoreVariant } from "../../convex/lib/catalogUtils";

const classic: StoreVariant = {
  id: "classic",
  slug: "classic",
  name: "Classic",
  variantName: "Classic",
  price: 18,
  inventory: 5,
  inStock: true,
};

const volume: StoreVariant = {
  id: "volume",
  slug: "volume",
  name: "Volume",
  variantName: "Volume",
  price: 22,
  inventory: 0,
  inStock: false,
};

test("shop cards use the first in-stock variant instead of the parent id", () => {
  const variant = resolveSellableCartVariant({
    id: "lash_set",
    name: "Lash Set",
    category: "Lashes",
    variants: [volume, classic],
  });

  expect(variant?.id).toBe("classic");
  expect(toCartLine({ id: "lash_set", name: "Lash Set", category: "Lashes" }, variant!)).toMatchObject({
    id: "classic",
    name: "Lash Set Classic",
    price: 18,
  });
});

test("quick view keeps the shopper-selected variant id", () => {
  const variant = resolveSellableCartVariant({
    id: "volume",
    name: "Lash Set Volume",
    category: "Lashes",
    variants: [classic, volume],
  });

  expect(variant?.id).toBe("volume");
});
