import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { hashCartAccessToken } from "./lib/cartUtils";
import schema from "./schema";

const modules = {
  "./_generated/api.ts": () => import("./_generated/api"),
  "./_generated/server.ts": () => import("./_generated/server"),
  "./carts.ts": () => import("./carts"),
  "./lib/admin.ts": () => import("./lib/admin"),
  "./lib/cartUtils.ts": () => import("./lib/cartUtils"),
};

test("requires a cart capability to read and mutate cart data", async () => {
  const t = convexTest(schema, modules);
  const now = Date.now();
  const accessToken = "cart-capability";

  await t.run(async (ctx) => {
    await ctx.db.insert("carts", {
      id: "cart_1",
      accessTokenHash: await hashCartAccessToken(accessToken),
      email: "customer@example.com",
      phone: "5555555555",
      name: "Customer",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    });
    await ctx.db.insert("products", {
      id: "product_1",
      parentProductId: "parent_1",
      parentProductName: "Lash Shampoo",
      slug: "lash-shampoo",
      name: "Lash Shampoo",
      category: "care",
      price: 1200,
      inventory: 10,
      isFeatured: false,
      isHero: false,
      isActive: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  });

  await expect(t.query(api.carts.getCartWithItems, {
    cartId: "cart_1",
    accessToken: "wrong-capability",
  })).rejects.toThrow("Unauthorized cart access");

  await expect(t.mutation(api.carts.upsertCartItem, {
    cartId: "cart_1",
    productId: "product_1",
    quantity: 1,
    accessToken: "wrong-capability",
  })).rejects.toThrow("Unauthorized cart access");

  await t.mutation(api.carts.upsertCartItem, {
    cartId: "cart_1",
    productId: "product_1",
    quantity: 2,
    accessToken,
  });

  const cart = await t.query(api.carts.getCartWithItems, { cartId: "cart_1", accessToken });
  expect(cart).toMatchObject({ id: "cart_1", itemCount: 2, subtotal: 2400 });
});

test("rejects legacy carts that do not have a capability hash", async () => {
  const t = convexTest(schema, modules);
  const now = Date.now();

  await t.run(async (ctx) => {
    await ctx.db.insert("carts", {
      id: "legacy_cart",
      email: "customer@example.com",
      phone: "5555555555",
      name: "Customer",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    });
  });

  await expect(t.query(api.carts.getCartWithItems, {
    cartId: "legacy_cart",
    accessToken: "any-value",
  })).rejects.toThrow("Unauthorized cart access");
});

test("starts over by deleting the authorized cart and creating a new one", async () => {
  const t = convexTest(schema, modules);
  const now = Date.now();

  await t.run(async (ctx) => {
    await ctx.db.insert("carts", {
      id: "cart_1",
      accessTokenHash: await hashCartAccessToken("old-capability"),
      email: "customer@example.com",
      phone: "5555555555",
      name: "Customer",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    });
    await ctx.db.insert("cartItems", {
      id: "item_1",
      cartId: "cart_1",
      productId: "product_1",
      quantity: 1,
      createdAt: now,
      updatedAt: now,
    });
  });

  const newCartId = await t.mutation(api.carts.startOverCart, {
    cartId: "cart_1",
    accessToken: "old-capability",
    newAccessToken: "new-capability",
    email: "new@example.com",
    phone: "5556667777",
    name: "New Customer",
  });

  expect(newCartId).not.toBe("cart_1");
  await expect(t.query(api.carts.getCartWithItems, {
    cartId: "cart_1",
    accessToken: "old-capability",
  })).rejects.toThrow("Unauthorized cart access");
  const newCart = await t.query(api.carts.getCartWithItems, {
    cartId: newCartId,
    accessToken: "new-capability",
  });
  expect(newCart).toMatchObject({ email: "new@example.com", name: "New Customer", itemCount: 0 });
});

test("cannot start over without the old cart capability", async () => {
  const t = convexTest(schema, modules);
  const now = Date.now();

  await t.run(async (ctx) => {
    await ctx.db.insert("carts", {
      id: "cart_1",
      accessTokenHash: await hashCartAccessToken("old-capability"),
      email: "customer@example.com",
      phone: "5555555555",
      name: "Customer",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    });
  });

  await expect(t.mutation(api.carts.startOverCart, {
    cartId: "cart_1",
    accessToken: "wrong-capability",
    newAccessToken: "new-capability",
    email: "new@example.com",
    phone: "5556667777",
    name: "New Customer",
  })).rejects.toThrow("Unauthorized cart access");
});
