import "server-only";

import { fetchMutation, fetchQuery } from "convex/nextjs";

import { api } from "../../convex/_generated/api";
import type { CartStatus } from "./cart-constants";
import { getAdminSecret, timestampToDate } from "./convex";

export type { CartStatus } from "./cart-constants";

export interface CartLine {
  id: string;
  productId: string;
  quantity: number;
  name: string;
  variantName: string | null;
  slug: string;
  price: number;
  image: string | null;
  inventory: number;
  isActive: boolean;
}

export interface CartWithItems {
  id: string;
  email: string;
  phone: string;
  name: string;
  status: CartStatus;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  lastActiveAt: Date | null;
  items: CartLine[];
  subtotal: number;
  itemCount: number;
}

function mapCart(raw: Awaited<ReturnType<typeof fetchCartRaw>>): CartWithItems | null {
  if (!raw) return null;
  return {
    ...raw,
    status: raw.status as CartStatus,
    createdAt: timestampToDate(raw.createdAt),
    updatedAt: timestampToDate(raw.updatedAt),
    lastActiveAt: timestampToDate(raw.lastActiveAt),
  };
}

async function fetchCartRaw(cartId: string, accessToken: string) {
  return fetchQuery(api.carts.getCartWithItems, { cartId, accessToken });
}

export async function getCartWithItems(cartId: string, accessToken: string): Promise<CartWithItems | null> {
  return mapCart(await fetchCartRaw(cartId, accessToken));
}

export async function getCartWithItemsForAdmin(cartId: string): Promise<CartWithItems | null> {
  return mapCart(await fetchQuery(api.carts.getCartWithItemsForAdmin, { cartId, adminSecret: getAdminSecret() }));
}

export async function findCartByEmail(email: string) {
  const row = await fetchQuery(api.carts.findCartByEmail, { email, adminSecret: getAdminSecret() });
  if (!row) return null;
  return {
    ...row,
    createdAt: timestampToDate(row.createdAt),
    updatedAt: timestampToDate(row.updatedAt),
    lastActiveAt: timestampToDate(row.lastActiveAt),
  };
}

export async function createCart(input: { email: string; phone: string; name: string; accessToken: string }) {
  return fetchMutation(api.carts.createCart, input);
}

export async function startOverCart(input: {
  cartId: string;
  accessToken: string;
  newAccessToken: string;
  email: string;
  phone: string;
  name: string;
}) {
  return fetchMutation(api.carts.startOverCart, input);
}

export async function upsertCartItem(cartId: string, productId: string, quantity: number, accessToken: string) {
  await fetchMutation(api.carts.upsertCartItem, { cartId, productId, quantity, accessToken });
}

export async function setCartItemQuantity(cartId: string, productId: string, quantity: number, accessToken: string) {
  await fetchMutation(api.carts.setCartItemQuantity, { cartId, productId, quantity, accessToken });
}

export async function removeCartItem(cartId: string, productId: string, accessToken: string) {
  await fetchMutation(api.carts.removeCartItem, { cartId, productId, accessToken });
}

export async function clearCart(cartId: string, accessToken: string) {
  await fetchMutation(api.carts.clearCart, { cartId, accessToken });
}

export async function mergeCartItems(
  cartId: string,
  incoming: Array<{ productId: string; quantity: number }>,
  accessToken: string,
) {
  await fetchMutation(api.carts.mergeCartItems, { cartId, incoming, accessToken });
}

export async function replaceCartItems(
  cartId: string,
  incoming: Array<{ productId: string; quantity: number }>,
  accessToken: string,
) {
  await fetchMutation(api.carts.replaceCartItems, { cartId, incoming, accessToken });
}

export async function deleteCart(cartId: string) {
  await fetchMutation(api.carts.deleteCart, { cartId, adminSecret: getAdminSecret() });
}

export async function adminClearCart(cartId: string) {
  await fetchMutation(api.carts.adminClearCart, {
    cartId,
    adminSecret: getAdminSecret(),
  });
}

export async function updateCartStatus(cartId: string, status: CartStatus) {
  await fetchMutation(api.carts.updateCartStatus, { cartId, status, adminSecret: getAdminSecret() });
}

export async function updateCartNotes(cartId: string, notes: string) {
  await fetchMutation(api.carts.updateCartNotes, {
    cartId,
    notes,
    adminSecret: getAdminSecret(),
  });
}

export interface AdminCartSummary {
  id: string;
  email: string;
  name: string;
  phone: string;
  status: CartStatus;
  itemCount: number;
  subtotal: number;
  lastActiveAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date | null;
}

export async function listAdminCarts(opts?: { status?: CartStatus; search?: string }) {
  const rows = await fetchQuery(api.carts.listAdminCarts, {
    adminSecret: getAdminSecret(),
    status: opts?.status,
    search: opts?.search,
  });
  return rows.map<AdminCartSummary>((c) => ({
    ...c,
    status: c.status as CartStatus,
    lastActiveAt: timestampToDate(c.lastActiveAt),
    updatedAt: timestampToDate(c.updatedAt),
    createdAt: timestampToDate(c.createdAt),
  }));
}

export async function getAdminCartStats() {
  return fetchQuery(api.carts.getAdminCartStats, { adminSecret: getAdminSecret() });
}

export async function validateActiveProduct(productId: string) {
  return fetchQuery(api.products.validateActiveProduct, { productId });
}

export async function getCartItemQuantity(cartId: string, productId: string, accessToken: string) {
  return fetchQuery(api.carts.getCartItemQuantity, { cartId, productId, accessToken });
}

export async function getProductInventory(productId: string) {
  return fetchQuery(api.products.getProductInventory, { productId });
}
