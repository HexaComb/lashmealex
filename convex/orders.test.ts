import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = {
  "./_generated/api.ts": () => import("./_generated/api"),
  "./_generated/server.ts": () => import("./_generated/server"),
  "./orders.ts": () => import("./orders"),
  "./orderEmails.ts": () => import("./orderEmails"),
  "./lib/admin.ts": () => import("./lib/admin"),
  "./lib/checkout.ts": () => import("./lib/checkout"),
};

const ADMIN = "test-admin-secret";

function paidArgs(overrides: Record<string, unknown> = {}) {
  return {
    adminSecret: ADMIN,
    eventId: "evt_paid_1",
    eventType: "checkout.session.completed",
    sessionId: "cs_1",
    cartId: "cart_1",
    paymentStatus: "paid",
    shouldCreatePaidOrder: true,
    amountTotal: 2400,
    lineItems: [{ productId: "product_1", quantity: 2, unitAmount: 1200 }],
    ...overrides,
  };
}

async function seedOrder(t: ReturnType<typeof convexTest>, overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  await t.run(async (ctx) => {
    await ctx.db.insert("orders", {
      id: "order_1",
      stripeSessionId: "cs_order_1",
      status: "paid",
      fulfillmentStatus: "received",
      statusToken: "status_token_1",
      subtotal: 2400,
      total: 2400,
      customerEmail: "customer@example.com",
      customerName: "Customer",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  });
}

async function seedPaidCheckout(t: ReturnType<typeof convexTest>, inventory = 10) {
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
      inventory,
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
      status: "checkout_pending",
      checkoutSessionId: "cs_1",
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
    await ctx.db.insert("checkoutSnapshots", {
      stripeSessionId: "cs_1",
      cartId: "cart_1",
      customerEmail: "customer@example.com",
      customerName: "Customer",
      amountTotal: 2400,
      lines: [{ productId: "product_1", quantity: 2, unitAmount: 1200 }],
      createdAt: now,
    });
  });
}

test("rejects unauthenticated paid-order processing", async () => {
  const t = convexTest(schema, modules);
  const originalSecret = process.env.ADMIN_INTERNAL_SECRET;
  process.env.ADMIN_INTERNAL_SECRET = ADMIN;
  try {
    await expect(t.mutation(api.orders.processStripeCheckoutEvent, {
      ...paidArgs(),
      adminSecret: "nope",
    })).rejects.toThrow("Unauthorized");
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_INTERNAL_SECRET;
    else process.env.ADMIN_INTERNAL_SECRET = originalSecret;
  }
});

test("creates one paid order from the frozen Stripe snapshot and records duplicate events", async () => {
  const t = convexTest(schema, modules);
  const originalSecret = process.env.ADMIN_INTERNAL_SECRET;
  process.env.ADMIN_INTERNAL_SECRET = ADMIN;
  try {
    await seedPaidCheckout(t);

    const first = await t.mutation(api.orders.processStripeCheckoutEvent, paidArgs());
    const duplicateSession = await t.mutation(api.orders.processStripeCheckoutEvent, paidArgs({
      eventId: "evt_paid_2",
      eventType: "checkout.session.async_payment_succeeded",
    }));
    const duplicateEvent = await t.mutation(api.orders.processStripeCheckoutEvent, paidArgs());

    expect(first.outcome).toBe("order_created");
    expect(first.ack).toBe(true);
    expect(duplicateSession.outcome).toBe("duplicate_session");
    expect(duplicateEvent.outcome).toBe("duplicate_event");
    expect(duplicateEvent.order?.confirmationEmailStatus).toBe("pending");

    const snapshot = await t.run(async (ctx) => ({
      orders: await ctx.db.query("orders").collect(),
      carts: await ctx.db.query("carts").collect(),
      events: await ctx.db.query("stripeWebhookEvents").collect(),
      items: await ctx.db.query("orderItems").collect(),
    }));
    expect(snapshot.orders).toHaveLength(1);
    expect(snapshot.orders[0]).toMatchObject({
      stripeSessionId: "cs_1",
      stripePaymentStatus: "paid",
      status: "paid",
      total: 2400,
      confirmationEmailStatus: "pending",
    });
    expect(snapshot.items[0]).toMatchObject({ productId: "product_1", quantity: 2, price: 1200 });
    expect(snapshot.carts[0].status).toBe("converted");
    expect((await t.run(async (ctx) => ctx.db.query("products").collect()))[0].inventory).toBe(8);
    expect(snapshot.events.map((event) => event.outcome).sort()).toEqual([
      "duplicate_session",
      "order_created",
    ]);
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_INTERNAL_SECRET;
    else process.env.ADMIN_INTERNAL_SECRET = originalSecret;
  }
});

test("does not ACK an unfulfillable paid session and leaves a payment exception", async () => {
  const t = convexTest(schema, modules);
  const originalSecret = process.env.ADMIN_INTERNAL_SECRET;
  process.env.ADMIN_INTERNAL_SECRET = ADMIN;
  try {
    await seedPaidCheckout(t, 1);
    const result = await t.mutation(api.orders.processStripeCheckoutEvent, paidArgs({ eventId: "evt_low" }));
    expect(result).toEqual({ ack: false, outcome: "inventory_unavailable", order: null });
    const snapshot = await t.run(async (ctx) => ({
      products: await ctx.db.query("products").collect(),
      orders: await ctx.db.query("orders").collect(),
      events: await ctx.db.query("stripeWebhookEvents").collect(),
      exceptions: await ctx.db.query("paymentExceptions").collect(),
    }));
    expect(snapshot.products[0].inventory).toBe(1);
    expect(snapshot.orders).toHaveLength(0);
    expect(snapshot.events).toHaveLength(0);
    expect(snapshot.exceptions[0]).toMatchObject({
      stripeSessionId: "cs_1",
      reason: "inventory_unavailable",
      status: "open",
    });
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_INTERNAL_SECRET;
    else process.env.ADMIN_INTERNAL_SECRET = originalSecret;
  }
});

test("does not create an order from a mutated live cart when Stripe lines differ", async () => {
  const t = convexTest(schema, modules);
  const originalSecret = process.env.ADMIN_INTERNAL_SECRET;
  process.env.ADMIN_INTERNAL_SECRET = ADMIN;
  try {
    await seedPaidCheckout(t);
    await t.run(async (ctx) => {
      const items = await ctx.db.query("cartItems").collect();
      await ctx.db.patch(items[0]._id, { quantity: 9 });
    });
    const result = await t.mutation(api.orders.processStripeCheckoutEvent, paidArgs({
      eventId: "evt_mismatch",
      lineItems: [{ productId: "product_1", quantity: 9, unitAmount: 1200 }],
      amountTotal: 10800,
    }));
    expect(result.ack).toBe(false);
    expect(result.outcome).toBe("amount_mismatch");
    const orders = await t.run(async (ctx) => ctx.db.query("orders").collect());
    expect(orders).toHaveLength(0);
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_INTERNAL_SECRET;
    else process.env.ADMIN_INTERNAL_SECRET = originalSecret;
  }
});

test("does not create an order until Stripe reports a paid session", async () => {
  const t = convexTest(schema, modules);
  const originalSecret = process.env.ADMIN_INTERNAL_SECRET;
  process.env.ADMIN_INTERNAL_SECRET = ADMIN;
  try {
    const result = await t.mutation(api.orders.processStripeCheckoutEvent, {
      adminSecret: ADMIN,
      eventId: "evt_unpaid_1",
      eventType: "checkout.session.completed",
      sessionId: "cs_unpaid_1",
      cartId: "cart_missing",
      paymentStatus: "unpaid",
      shouldCreatePaidOrder: false,
    });

    expect(result).toEqual({ ack: true, outcome: "awaiting_payment", order: null });
    const orders = await t.run(async (ctx) => ctx.db.query("orders").collect());
    expect(orders).toHaveLength(0);
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_INTERNAL_SECRET;
    else process.env.ADMIN_INTERNAL_SECRET = originalSecret;
  }
});

test("returns only non-sensitive data for a public order-status link", async () => {
  const t = convexTest(schema, modules);
  await seedOrder(t);
  await t.run(async (ctx) => {
    await ctx.db.insert("orderStatusEvents", {
      orderId: "order_1",
      status: "received",
      createdAt: Date.now(),
    });
  });

  const status = await t.query(api.orders.getPublicOrderStatus, { statusToken: "status_token_1" });

  expect(status).toMatchObject({
    id: "order_1",
    fulfillmentStatus: "received",
    total: 2400,
    events: [{ status: "received" }],
  });
  expect(status).not.toHaveProperty("customerEmail");
  expect(status).not.toHaveProperty("customerName");
});

test("records fulfillment history only when an authorized admin changes fulfillment", async () => {
  const t = convexTest(schema, modules);
  const originalSecret = process.env.ADMIN_INTERNAL_SECRET;
  process.env.ADMIN_INTERNAL_SECRET = ADMIN;
  try {
    await seedOrder(t);

    await expect(t.mutation(api.orders.updateOrder, {
      adminSecret: "incorrect",
      orderId: "order_1",
      status: "paid",
      fulfillmentStatus: "ready_for_pickup",
    })).rejects.toThrow("Unauthorized");

    const updated = await t.mutation(api.orders.updateOrder, {
      adminSecret: ADMIN,
      orderId: "order_1",
      status: "paid",
      fulfillmentStatus: "ready_for_pickup",
    });
    expect(updated).toMatchObject({ fulfillmentStatus: "ready_for_pickup", fulfillmentStatusChanged: true });

    const events = await t.run(async (ctx) => ctx.db.query("orderStatusEvents").collect());
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ orderId: "order_1", status: "ready_for_pickup" });
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_INTERNAL_SECRET;
    else process.env.ADMIN_INTERNAL_SECRET = originalSecret;
  }
});
