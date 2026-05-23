import "server-only";

import { fetchMutation, fetchQuery } from "convex/nextjs";

import { api } from "../../convex/_generated/api";
import type { CartWithItems } from "./cart";
import { getAdminSecret, timestampToDate } from "./convex";

export async function createOrderFromCart(cart: CartWithItems, stripeSessionId: string): Promise<string> {
  return fetchMutation(api.orders.createOrderFromCart, {
    cartId: cart.id,
    stripeSessionId,
  });
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

export async function getAdminOrderStats() {
  return fetchQuery(api.orders.getAdminOrderStats, { adminSecret: getAdminSecret() });
}

export async function updateOrder(input: {
  orderId: string;
  status: string;
  fulfillmentStatus: string;
}) {
  await fetchMutation(api.orders.updateOrder, {
    adminSecret: getAdminSecret(),
    ...input,
  });
}
