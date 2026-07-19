import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = {
  "./_generated/api.ts": () => import("./_generated/api"),
  "./_generated/server.ts": () => import("./_generated/server"),
  "./orders.ts": () => import("./orders"),
  "./lib/admin.ts": () => import("./lib/admin"),
};

test("creates one paid order for a confirmed payment and records duplicate events", async () => {
  const t = convexTest(schema, modules);
  const now = Date.now();

  await t.run(async (ctx) => {
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
    await ctx.db.insert("carts", {
      id: "cart_1",
      email: "customer@example.com",
      phone: "5555555555",
      name: "Customer",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    });
    await ctx.db.insert("cartItems", {
      id: "cart_item_1",
      cartId: "cart_1",
      productId: "product_1",
      quantity: 2,
      createdAt: now,
      updatedAt: now,
    });
  });

  const first = await t.mutation(api.orders.processStripeCheckoutEvent, {
    eventId: "evt_paid_1",
    eventType: "checkout.session.completed",
    sessionId: "cs_1",
    cartId: "cart_1",
    paymentStatus: "paid",
    shouldCreatePaidOrder: true,
  });
  const duplicateSession = await t.mutation(api.orders.processStripeCheckoutEvent, {
    eventId: "evt_paid_2",
    eventType: "checkout.session.async_payment_succeeded",
    sessionId: "cs_1",
    cartId: "cart_1",
    paymentStatus: "paid",
    shouldCreatePaidOrder: true,
  });
  const duplicateEvent = await t.mutation(api.orders.processStripeCheckoutEvent, {
    eventId: "evt_paid_1",
    eventType: "checkout.session.completed",
    sessionId: "cs_1",
    cartId: "cart_1",
    paymentStatus: "paid",
    shouldCreatePaidOrder: true,
  });

  expect(first.outcome).toBe("order_created");
  expect(duplicateSession.outcome).toBe("duplicate_session");
  expect(duplicateEvent.outcome).toBe("duplicate_event");

  const snapshot = await t.run(async (ctx) => ({
    orders: await ctx.db.query("orders").collect(),
    carts: await ctx.db.query("carts").collect(),
    events: await ctx.db.query("stripeWebhookEvents").collect(),
  }));
  expect(snapshot.orders).toHaveLength(1);
  expect(snapshot.orders[0]).toMatchObject({
    stripeSessionId: "cs_1",
    stripePaymentStatus: "paid",
    status: "paid",
    total: 2400,
  });
  expect(snapshot.carts[0].status).toBe("converted");
  expect((await t.run(async (ctx) => ctx.db.query("products").collect()))[0].inventory).toBe(8);
  expect(snapshot.events.map((event) => event.outcome).sort()).toEqual([
    "duplicate_session",
    "order_created",
  ]);
});

test("does not create or decrement for an unfulfillable paid session", async () => {
  const t = convexTest(schema, modules);
  const now = Date.now();
  await t.run(async (ctx) => {
    await ctx.db.insert("products", { id: "low_stock", parentProductId: "low", parentProductName: "Low", slug: "low", name: "Low", category: "care", price: 1200, inventory: 1, isFeatured: false, isHero: false, isActive: true, sortOrder: 0, createdAt: now, updatedAt: now });
    await ctx.db.insert("carts", { id: "cart_low", email: "customer@example.com", phone: "5555555555", name: "Customer", status: "active", createdAt: now, updatedAt: now, lastActiveAt: now });
    await ctx.db.insert("cartItems", { id: "item_low", cartId: "cart_low", productId: "low_stock", quantity: 2, createdAt: now, updatedAt: now });
  });
  const result = await t.mutation(api.orders.processStripeCheckoutEvent, { eventId: "evt_low", eventType: "checkout.session.completed", sessionId: "cs_low", cartId: "cart_low", paymentStatus: "paid", shouldCreatePaidOrder: true });
  expect(result).toEqual({ outcome: "inventory_unavailable", order: null });
  const snapshot = await t.run(async (ctx) => ({ products: await ctx.db.query("products").collect(), orders: await ctx.db.query("orders").collect() }));
  expect(snapshot.products[0].inventory).toBe(1);
  expect(snapshot.orders).toHaveLength(0);
});

test("does not create an order until Stripe reports a paid session", async () => {
  const t = convexTest(schema, modules);
  const result = await t.mutation(api.orders.processStripeCheckoutEvent, {
    eventId: "evt_unpaid_1",
    eventType: "checkout.session.completed",
    sessionId: "cs_unpaid_1",
    cartId: "cart_missing",
    paymentStatus: "unpaid",
    shouldCreatePaidOrder: false,
  });

  expect(result).toEqual({ outcome: "awaiting_payment", order: null });
  const orders = await t.run(async (ctx) => ctx.db.query("orders").collect());
  expect(orders).toHaveLength(0);
});
