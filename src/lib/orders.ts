import "server-only";

import { fetchMutation, fetchQuery } from "convex/nextjs";

import { api } from "../../convex/_generated/api";
import { getAdminSecret, timestampToDate } from "./convex";

export async function processStripeCheckoutEvent(input: {
  eventId: string;
  eventType: string;
  sessionId: string;
  cartId: string | undefined;
  paymentStatus: string;
  shouldCreatePaidOrder: boolean;
}) {
  return fetchMutation(api.orders.processStripeCheckoutEvent, {
    ...input,
  });
}

export async function getPublicOrderStatus(statusToken: string) {
  const row = await fetchQuery(api.orders.getPublicOrderStatus, { statusToken });
  if (!row) return null;
  return {
    ...row,
    createdAt: timestampToDate(row.createdAt),
    events: row.events.map((event) => ({
      ...event,
      createdAt: timestampToDate(event.createdAt),
    })),
  };
}

export async function getOrderByStripeSessionId(stripeSessionId: string) {
  const row = await fetchQuery(api.orders.getOrderByStripeSessionId, { stripeSessionId });
  if (!row) return null;
  return {
    ...row,
    createdAt: timestampToDate(row.createdAt),
    updatedAt: timestampToDate(row.updatedAt),
  };
}

export async function listAdminOrders() {
  const rows = await fetchQuery(api.orders.listAdminOrders, { adminSecret: getAdminSecret() });
  return rows.map((row) => ({
    ...row,
    createdAt: timestampToDate(row.createdAt),
    updatedAt: timestampToDate(row.updatedAt),
  }));
}

export async function getAdminOrder(orderId: string) {
  const result = await fetchQuery(api.orders.getAdminOrder, {
    adminSecret: getAdminSecret(),
    orderId,
  });
  if (!result) return null;

  return {
    ...result,
    order: {
      ...result.order,
      createdAt: timestampToDate(result.order.createdAt),
      updatedAt: timestampToDate(result.order.updatedAt),
    },
  };
}

export async function getAdminOrderStats() {
  return fetchQuery(api.orders.getAdminOrderStats, { adminSecret: getAdminSecret() });
}

export async function updateOrder(input: {
  orderId: string;
  status: "pending" | "paid" | "cancelled";
  fulfillmentStatus: "received" | "working_on_it" | "ready_for_pickup" | "picked_up";
}) {
  return fetchMutation(api.orders.updateOrder, {
    adminSecret: getAdminSecret(),
    ...input,
  });
}
