import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { assertAdminSecret } from "./lib/admin";
import {
  checkoutLinesEqual,
  checkoutLinesTotal,
  isPaidFailureOutcome,
  type CheckoutLine,
  type PaidFailureOutcome,
} from "./lib/checkout";

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

const checkoutLineValidator = v.object({
  productId: v.string(),
  quantity: v.number(),
  unitAmount: v.number(),
});

const EMAIL_SEND_STALE_MS = 5 * 60 * 1000;
const EMAIL_RETRY_MAX = 8;

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

function toOrderEmailResult(order: Doc<"orders">) {
  return {
    id: order.id,
    statusToken: order.statusToken ?? "",
    fulfillmentStatus: order.fulfillmentStatus,
    customerEmail: order.customerEmail,
    customerName: order.customerName ?? null,
    confirmationEmailStatus: order.confirmationEmailStatus ?? "pending",
  };
}

async function getOrderBySession(ctx: MutationCtx, sessionId: string) {
  return ctx.db
    .query("orders")
    .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", sessionId))
    .first();
}

async function getOrderByExternalId(ctx: MutationCtx, orderId: string) {
  return ctx.db
    .query("orders")
    .withIndex("by_externalId", (q) => q.eq("id", orderId))
    .first();
}

async function recordPaidFailure(
  ctx: MutationCtx,
  args: {
    eventId: string;
    sessionId: string;
    cartId?: string;
    reason: string;
    amountTotal?: number;
  },
) {
  const now = Date.now();
  const existing = await ctx.db
    .query("paymentExceptions")
    .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", args.sessionId))
    .first();
  if (existing) {
    await ctx.db.patch(existing._id, {
      eventId: args.eventId,
      cartId: args.cartId,
      reason: args.reason,
      amountTotal: args.amountTotal,
      status: "open",
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("paymentExceptions", {
      stripeSessionId: args.sessionId,
      eventId: args.eventId,
      cartId: args.cartId,
      reason: args.reason,
      amountTotal: args.amountTotal,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  }
}

async function resolvePaymentException(ctx: MutationCtx, sessionId: string) {
  const existing = await ctx.db
    .query("paymentExceptions")
    .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", sessionId))
    .first();
  if (existing && existing.status !== "resolved") {
    await ctx.db.patch(existing._id, { status: "resolved", updatedAt: Date.now() });
  }
}

async function releaseCheckoutLockForSession(ctx: MutationCtx, cartId: string | undefined, sessionId: string) {
  if (!cartId) return;
  const cart = await ctx.db
    .query("carts")
    .withIndex("by_externalId", (q) => q.eq("id", cartId))
    .first();
  if (!cart || cart.status !== "checkout_pending") return;
  if (cart.checkoutSessionId && cart.checkoutSessionId !== sessionId) return;
  const now = Date.now();
  await ctx.db.patch(cart._id, {
    status: "active",
    checkoutSessionId: undefined,
    updatedAt: now,
    lastActiveAt: now,
  });
}

async function claimConfirmationEmail(ctx: MutationCtx, orderId: string) {
  const order = await getOrderByExternalId(ctx, orderId);
  if (!order || !order.statusToken) return null;
  if (order.confirmationEmailStatus === "sent") return null;
  const now = Date.now();
  if (
    order.confirmationEmailStatus === "sending" &&
    order.confirmationEmailSendStartedAt &&
    now - order.confirmationEmailSendStartedAt < EMAIL_SEND_STALE_MS
  ) {
    return null;
  }
  await ctx.db.patch(order._id, {
    confirmationEmailStatus: "sending",
    confirmationEmailSendStartedAt: now,
    updatedAt: now,
  });
  return {
    customerEmail: order.customerEmail,
    customerName: order.customerName ?? null,
    fulfillmentStatus: order.fulfillmentStatus,
    statusToken: order.statusToken,
  };
}

/**
 * Stripe-verified Next.js webhook only. Requires ADMIN_INTERNAL_SECRET so this
 * cannot be invoked from the public Convex URL to insert paid orders.
 */
export const processStripeCheckoutEvent = mutation({
  args: {
    adminSecret: v.string(),
    eventId: v.string(),
    eventType: v.string(),
    sessionId: v.string(),
    cartId: v.optional(v.string()),
    paymentStatus: v.string(),
    shouldCreatePaidOrder: v.boolean(),
    amountTotal: v.optional(v.number()),
    lineItems: v.optional(v.array(checkoutLineValidator)),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const priorEvent = await ctx.db
      .query("stripeWebhookEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (priorEvent) {
      const existingOrder = await getOrderBySession(ctx, args.sessionId);
      return {
        ack: !isPaidFailureOutcome(priorEvent.outcome),
        outcome: "duplicate_event" as const,
        order: existingOrder ? toOrderEmailResult(existingOrder) : null,
      };
    }

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

    const failPaid = async (outcome: PaidFailureOutcome) => {
      await recordPaidFailure(ctx, {
        eventId: args.eventId,
        sessionId: args.sessionId,
        cartId: args.cartId,
        reason: outcome,
        amountTotal: args.amountTotal,
      });
      return { ack: false as const, outcome, order: null };
    };

    if (!args.shouldCreatePaidOrder) {
      const outcome = args.eventType === "checkout.session.async_payment_failed"
        ? "payment_failed"
        : args.eventType === "checkout.session.expired"
          ? "expired"
          : "awaiting_payment";
      if (outcome === "expired" || outcome === "payment_failed") {
        await releaseCheckoutLockForSession(ctx, args.cartId, args.sessionId);
      }
      await recordEvent(outcome);
      return { ack: true as const, outcome, order: null };
    }

    if (!args.cartId) {
      return await failPaid("missing_cart_id");
    }

    const existingOrder = await getOrderBySession(ctx, args.sessionId);
    if (existingOrder) {
      await recordEvent("duplicate_session");
      await resolvePaymentException(ctx, args.sessionId);
      return {
        ack: true as const,
        outcome: "duplicate_session" as const,
        order: toOrderEmailResult(existingOrder),
      };
    }

    const snapshot = await ctx.db
      .query("checkoutSnapshots")
      .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", args.sessionId))
      .first();
    if (!snapshot) {
      const cart = await ctx.db
        .query("carts")
        .withIndex("by_externalId", (q) => q.eq("id", args.cartId!))
        .first();
      if (!cart) {
        return await failPaid("cart_not_found");
      }
      return await failPaid("snapshot_not_found");
    }

    const stripeLines: CheckoutLine[] = args.lineItems ?? [];
    const snapshotLines: CheckoutLine[] = snapshot.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitAmount: line.unitAmount,
    }));
    const stripeTotal = args.amountTotal;
    const snapshotTotal = snapshot.amountTotal;
    const lineTotal = checkoutLinesTotal(snapshotLines);

    if (
      stripeTotal == null ||
      stripeTotal !== snapshotTotal ||
      stripeTotal !== lineTotal ||
      checkoutLinesTotal(stripeLines) !== snapshotTotal
    ) {
      return await failPaid("amount_mismatch");
    }
    if (!checkoutLinesEqual(stripeLines, snapshotLines)) {
      return await failPaid("line_mismatch");
    }

    const pricedLines = [];
    for (const line of snapshotLines) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_externalId", (q) => q.eq("id", line.productId))
        .first();
      if (!product) {
        return await failPaid("product_missing");
      }
      pricedLines.push({ product, line });
    }

    const unavailableLine = pricedLines.find(
      ({ product, line }) => !product.isActive || product.inventory < line.quantity,
    );
    if (unavailableLine) {
      return await failPaid("inventory_unavailable");
    }

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
      subtotal: snapshotTotal,
      total: snapshotTotal,
      customerEmail: snapshot.customerEmail,
      customerName: snapshot.customerName,
      confirmationEmailStatus: "pending",
      confirmationEmailAttempts: 0,
      createdAt: now,
      updatedAt: now,
    });

    for (const { product, line } of pricedLines) {
      await ctx.db.patch(product._id, {
        inventory: product.inventory - line.quantity,
        updatedAt: now,
      });
      await ctx.db.insert("orderItems", {
        id: crypto.randomUUID(),
        orderId,
        productId: line.productId,
        quantity: line.quantity,
        price: line.unitAmount,
      });
    }

    await ctx.db.insert("orderStatusEvents", {
      orderId,
      status: "received",
      createdAt: now,
    });

    const cart = await ctx.db
      .query("carts")
      .withIndex("by_externalId", (q) => q.eq("id", snapshot.cartId))
      .first();
    if (cart) {
      await ctx.db.patch(cart._id, { status: "converted", updatedAt: now, lastActiveAt: now });
    }

    await recordEvent("order_created");
    await resolvePaymentException(ctx, args.sessionId);
    await ctx.scheduler.runAfter(15_000, internal.orderEmails.sendOrderConfirmation, { orderId });

    return {
      ack: true as const,
      outcome: "order_created" as const,
      order: {
        id: orderId,
        statusToken,
        fulfillmentStatus: "received" as const,
        customerEmail: snapshot.customerEmail,
        customerName: snapshot.customerName,
        confirmationEmailStatus: "pending" as const,
      },
    };
  },
});

export const claimConfirmationEmailSend = mutation({
  args: { adminSecret: v.string(), orderId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    return await claimConfirmationEmail(ctx, args.orderId);
  },
});

export const markConfirmationEmailSent = mutation({
  args: { adminSecret: v.string(), orderId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const order = await getOrderByExternalId(ctx, args.orderId);
    if (!order) return;
    const now = Date.now();
    await ctx.db.patch(order._id, {
      confirmationEmailStatus: "sent",
      confirmationEmailSentAt: now,
      confirmationEmailLastError: undefined,
      updatedAt: now,
    });
  },
});

export const markConfirmationEmailFailed = mutation({
  args: { adminSecret: v.string(), orderId: v.string(), error: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const order = await getOrderByExternalId(ctx, args.orderId);
    if (!order) return;
    const attempts = (order.confirmationEmailAttempts ?? 0) + 1;
    const now = Date.now();
    await ctx.db.patch(order._id, {
      confirmationEmailStatus: attempts >= EMAIL_RETRY_MAX ? "failed" : "pending",
      confirmationEmailAttempts: attempts,
      confirmationEmailLastError: args.error,
      updatedAt: now,
    });
    if (attempts < EMAIL_RETRY_MAX) {
      const delay = Math.min(60_000 * 2 ** Math.max(attempts - 1, 0), 60 * 60 * 1000);
      await ctx.scheduler.runAfter(delay, internal.orderEmails.sendOrderConfirmation, {
        orderId: args.orderId,
      });
    }
  },
});

export const claimConfirmationEmailJob = internalMutation({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    return await claimConfirmationEmail(ctx, args.orderId);
  },
});

export const markConfirmationEmailSentJob = internalMutation({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await getOrderByExternalId(ctx, args.orderId);
    if (!order) return;
    const now = Date.now();
    await ctx.db.patch(order._id, {
      confirmationEmailStatus: "sent",
      confirmationEmailSentAt: now,
      confirmationEmailLastError: undefined,
      updatedAt: now,
    });
  },
});

export const markConfirmationEmailRetryJob = internalMutation({
  args: { orderId: v.string(), error: v.string() },
  handler: async (ctx, args) => {
    const order = await getOrderByExternalId(ctx, args.orderId);
    if (!order || order.confirmationEmailStatus === "sent") return;
    const attempts = (order.confirmationEmailAttempts ?? 0) + 1;
    const now = Date.now();
    await ctx.db.patch(order._id, {
      confirmationEmailStatus: attempts >= EMAIL_RETRY_MAX ? "failed" : "pending",
      confirmationEmailAttempts: attempts,
      confirmationEmailLastError: args.error,
      updatedAt: now,
    });
    if (attempts < EMAIL_RETRY_MAX) {
      const delay = Math.min(60_000 * 2 ** Math.max(attempts - 1, 0), 60 * 60 * 1000);
      await ctx.scheduler.runAfter(delay, internal.orderEmails.sendOrderConfirmation, {
        orderId: args.orderId,
      });
    }
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

export const getAdminOrder = query({
  args: { adminSecret: v.string(), orderId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_externalId", (q) => q.eq("id", args.orderId))
      .first();
    if (!order) return null;

    const itemRows = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", order.id))
      .collect();

    const items = await Promise.all(itemRows.map(async (item) => {
      const product = await ctx.db
        .query("products")
        .withIndex("by_externalId", (q) => q.eq("id", item.productId))
        .first();
      const imageUrl = product?.imageStorageId ? await ctx.storage.getUrl(product.imageStorageId) : null;

      return {
        id: item.id,
        productId: item.productId,
        name: product?.name ?? "Product no longer available",
        variantName: product?.variantName ?? null,
        imageUrl: imageUrl ?? product?.imageUrl ?? null,
        quantity: item.quantity,
        price: item.price,
      };
    }));

    items.sort((a, b) => a.name.localeCompare(b.name));
    return { order, items };
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
