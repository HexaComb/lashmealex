import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = {
  "./_generated/api.ts": () => import("./_generated/api"),
  "./_generated/server.ts": () => import("./_generated/server"),
  "./products.ts": () => import("./products"),
  "./lib/admin.ts": () => import("./lib/admin"),
  "./lib/catalogUtils.ts": () => import("./lib/catalogUtils"),
};

test("lists only active catalog variants and groups them by parent product", async () => {
  const t = convexTest(schema, modules);
  const now = Date.now();
  await t.run(async (ctx) => {
    await ctx.db.insert("products", {
      id: "classic",
      parentProductId: "lash_set",
      parentProductName: "Lash Set",
      slug: "lash-set",
      name: "Lash Set Classic",
      variantName: "Classic",
      category: "lashes",
      price: 1800,
      inventory: 5,
      isFeatured: true,
      isHero: false,
      isActive: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("products", {
      id: "volume",
      parentProductId: "lash_set",
      parentProductName: "Lash Set",
      slug: "lash-set-volume",
      name: "Lash Set Volume",
      variantName: "Volume",
      category: "lashes",
      price: 2200,
      inventory: 3,
      isFeatured: true,
      isHero: false,
      isActive: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("products", {
      id: "archived",
      parentProductId: "archived_set",
      parentProductName: "Archived Set",
      slug: "archived-set",
      name: "Archived Set",
      category: "lashes",
      price: 1000,
      inventory: 1,
      isFeatured: true,
      isHero: false,
      isActive: false,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  });

  const products = await t.query(api.products.listStoreProducts, { featuredOnly: true });

  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    id: "lash_set",
    slug: "lash-set",
    name: "Lash Set",
    variants: [
      { id: "volume", variantName: "Volume" },
      { id: "classic", variantName: "Classic" },
    ],
  });
  expect(JSON.stringify(products)).not.toContain("Archived Set");
});
