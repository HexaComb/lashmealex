import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdminSecret } from "./lib/admin";

const fulfillmentStatusValidator = v.union(
  v.literal("received"),
  v.literal("working_on_it"),
  v.literal("ready_for_pickup"),
  v.literal("picked_up"),
);

const paymentStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("cancelled"),
);

export const getOrderByStripeSessionId = query({
  args: { stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("orders")
      .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();
  },
});

/**
 * Retrieves the non-sensitive pickup progress associated with a customer's secret order link.
 */
export const getPublicOrderStatus = query({
  args: { statusToken: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_statusToken", (q) => q.eq("statusToken", args.statusToken))
      .unique();
    if (!order) return null;

    const events = await ctx.db
      .query("orderStatusEvents")
      .withIndex("by_orderId_and_createdAt", (q) => q.eq("orderId", order.id))
      .take(20);

    return {
      id: order.id,
      fulfillmentStatus: order.fulfillmentStatus,
      total: order.total,
      createdAt: order.createdAt,
      events,
    };
  },
});

export const processStripeCheckoutEvent = mutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    sessionId: v.string(),
    cartId: v.optional(v.string()),
    paymentStatus: v.string(),
    shouldCreatePaidOrder: v.boolean(),
  },
  handler: async (ctx, args) => {
    const priorEvent = await ctx.db
      .query("stripeWebhookEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (priorEvent) return { outcome: "duplicate_event", order: null };

    const now = Date.now();
    const recordEvent = async (outcome: string) => {
      await ctx.db.insert("stripeWebhookEvents", {
        eventId: args.eventId,
        eventType: args.eventType,
        sessionId: args.sessionId,
        cartId: args.cartId,
        paymentStatus: args.paymentStatus,
        outcome,
        createdAt: now,
      });
    };

    if (!args.shouldCreatePaidOrder) {
      const outcome = args.eventType === "checkout.session.async_payment_failed"
        ? "payment_failed"
        : args.eventType === "checkout.session.expired"
          ? "expired"
          : "awaiting_payment";
      await recordEvent(outcome);
      return { outcome, order: null };
    }

    if (!args.cartId) {
      await recordEvent("missing_cart_id");
      return { outcome: "missing_cart_id", order: null };
    }

    const existingOrder = await ctx.db
      .query("orders")
      .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", args.sessionId))
      .first();
    if (existingOrder) {
      await recordEvent("duplicate_session");
      return { outcome: "duplicate_session", order: null };
    }

    const cart = await ctx.db
      .query("carts")
      .withIndex("by_externalId", (q) => q.eq("id", args.cartId!))
      .first();
    if (!cart) {
      await recordEvent("cart_not_found");
      return { outcome: "cart_not_found", order: null };
    }

    const itemRows = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId", (q) => q.eq("cartId", args.cartId!))
      .collect();

    const lines = [];
    for (const item of itemRows) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_externalId", (q) => q.eq("id", item.productId))
        .first();
      if (!product) continue;
      lines.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const orderId = crypto.randomUUID();

    const statusToken = crypto.randomUUID();
    await ctx.db.insert("orders", {
      id: orderId,
      stripeSessionId: args.sessionId,
      stripePaymentStatus: args.paymentStatus,
      lastStripeEventId: args.eventId,
      lastStripeEventType: args.eventType,
      paymentUpdatedAt: now,
      status: "paid",
      fulfillmentStatus: "received",
      statusToken,
      subtotal,
      total: subtotal,
      customerEmail: cart.email,
      customerName: cart.name,
      createdAt: now,
      updatedAt: now,
    });

    for (const line of lines) {
      await ctx.db.insert("orderItems", {
        id: crypto.randomUUID(),
        orderId,
        productId: line.productId,
        quantity: line.quantity,
        price: line.price,
      });
    }

    await ctx.db.insert("orderStatusEvents", {
      orderId,
      status: "received",
      createdAt: now,
    });

    await ctx.db.patch(cart._id, { status: "converted", updatedAt: now, lastActiveAt: now });
    await recordEvent("order_created");

    return {
      outcome: "order_created",
      order: {
        id: orderId,
        statusToken,
        fulfillmentStatus: "received" as const,
        customerEmail: cart.email,
        customerName: cart.name,
      },
    };
  },
});

export const listAdminOrders = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const rows = await ctx.db.query("orders").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows;
  },
});

export const getAdminOrderStats = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const orders = await ctx.db.query("orders").collect();
    const orderCount = orders.length;
    const grossSales = orders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + o.total, 0);

    const orderItems = await ctx.db.query("orderItems").collect();
    let unitsSold = 0;
    for (const item of orderItems) {
      const order = orders.find((o) => o.id === item.orderId);
      if (order?.status === "paid") {
        unitsSold += item.quantity;
      }
    }

    return { orderCount, grossSales, unitsSold };
  },
});

export const updateOrder = mutation({
  args: {
    adminSecret: v.string(),
    orderId: v.string(),
    status: paymentStatusValidator,
    fulfillmentStatus: fulfillmentStatusValidator,
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_externalId", (q) => q.eq("id", args.orderId))
      .first();
    if (!order) return null;
    const now = Date.now();
    const currentFulfillmentStatus = order.fulfillmentStatus === "unfulfilled"
      ? "received"
      : order.fulfillmentStatus === "fulfilled"
        ? "picked_up"
        : order.fulfillmentStatus;
    const fulfillmentStatusChanged = currentFulfillmentStatus !== args.fulfillmentStatus;
    const statusToken = order.statusToken ?? crypto.randomUUID();
    await ctx.db.patch(order._id, {
      status: args.status,
      fulfillmentStatus: args.fulfillmentStatus,
      statusToken,
      updatedAt: now,
    });
    if (fulfillmentStatusChanged) {
      await ctx.db.insert("orderStatusEvents", {
        orderId: order.id,
        status: args.fulfillmentStatus,
        createdAt: now,
      });
    }
    return {
      id: order.id,
      statusToken,
      fulfillmentStatus: args.fulfillmentStatus,
      fulfillmentStatusChanged,
      customerEmail: order.customerEmail,
      customerName: order.customerName ?? null,
    };
  },
});
