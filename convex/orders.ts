import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdminSecret } from "./lib/admin";

export const getOrderByStripeSessionId = query({
  args: { stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("orders")
      .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();
  },
});

export const createOrderFromCart = mutation({
  args: {
    cartId: v.string(),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_externalId", (q) => q.eq("id", args.cartId))
      .first();
    if (!cart) throw new Error("Cart not found");

    const itemRows = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId", (q) => q.eq("cartId", args.cartId))
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
    const now = Date.now();
    const orderId = crypto.randomUUID();

    await ctx.db.insert("orders", {
      id: orderId,
      stripeSessionId: args.stripeSessionId,
      status: "paid",
      fulfillmentStatus: "unfulfilled",
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

    return orderId;
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
    status: v.string(),
    fulfillmentStatus: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_externalId", (q) => q.eq("id", args.orderId))
      .first();
    if (!order) return;
    await ctx.db.patch(order._id, {
      status: args.status,
      fulfillmentStatus: args.fulfillmentStatus,
      updatedAt: Date.now(),
    });
  },
});
