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
  expect(products[0]).not.toHaveProperty("rating");
  expect(products[0]).not.toHaveProperty("reviewCount");
  expect(JSON.stringify(products)).not.toContain("Archived Set");
});

test("hiding a product group deactivates variants and keeps historical order items", async () => {
  const t = convexTest(schema, modules);
  const originalSecret = process.env.ADMIN_INTERNAL_SECRET;
  process.env.ADMIN_INTERNAL_SECRET = "test-admin-secret";
  const now = Date.now();

  try {
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
        isHero: true,
        isActive: true,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("orderItems", {
        id: "oi_1",
        orderId: "order_1",
        productId: "classic",
        quantity: 2,
        price: 1800,
      });
    });

    await t.mutation(api.products.deleteProductGroup, {
      adminSecret: "test-admin-secret",
      parentProductId: "lash_set",
    });

    const products = await t.run(async (ctx) => ctx.db.query("products").collect());
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({ isActive: false, isHero: false });

    const orderItems = await t.run(async (ctx) => ctx.db.query("orderItems").collect());
    expect(orderItems).toEqual([
      expect.objectContaining({ id: "oi_1", productId: "classic", quantity: 2, price: 1800 }),
    ]);

    const storefront = await t.query(api.products.listStoreProducts, {});
    expect(storefront).toHaveLength(0);
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_INTERNAL_SECRET;
    else process.env.ADMIN_INTERNAL_SECRET = originalSecret;
  }
});

test("hiding a variant keeps the row and related order items", async () => {
  const t = convexTest(schema, modules);
  const originalSecret = process.env.ADMIN_INTERNAL_SECRET;
  process.env.ADMIN_INTERNAL_SECRET = "test-admin-secret";
  const now = Date.now();

  try {
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
        isFeatured: false,
        isHero: false,
        isActive: true,
        sortOrder: 0,
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
        isFeatured: false,
        isHero: false,
        isActive: true,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("orderItems", {
        id: "oi_volume",
        orderId: "order_2",
        productId: "volume",
        quantity: 1,
        price: 2200,
      });
    });

    const result = await t.mutation(api.products.deleteVariant, {
      adminSecret: "test-admin-secret",
      productId: "volume",
    });

    expect(result).toEqual({ siblingCount: 2 });

    const volume = await t.run(async (ctx) =>
      ctx.db
        .query("products")
        .withIndex("by_externalId", (q) => q.eq("id", "volume"))
        .first(),
    );
    expect(volume?.isActive).toBe(false);

    const orderItems = await t.run(async (ctx) => ctx.db.query("orderItems").collect());
    expect(orderItems).toHaveLength(1);
    expect(orderItems[0]?.productId).toBe("volume");
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_INTERNAL_SECRET;
    else process.env.ADMIN_INTERNAL_SECRET = originalSecret;
  }
});
