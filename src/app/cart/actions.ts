"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Stripe from "stripe";

import {
  MAX_PENDING_ITEMS,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  type PendingCartItem,
} from "@/lib/cart-constants";
import {
  clearCart as clearCartLib,
  createCart,
  findCartByEmail,
  getCartItemQuantity,
  getCartWithItems,
  getProductInventory,
  mergeCartItems,
  removeCartItem as removeCartItemLib,
  replaceCartItems,
  setCartItemQuantity as setCartItemQuantityLib,
  upsertCartItem as upsertCartItemLib,
  validateActiveProduct,
} from "@/lib/cart";
import { getStripeSecretKey } from "@/lib/stripe";

export type StartCartResult =
  | { ok: true; cartId: string }
  | { ok: false; conflict: "existing"; existingCartId: string; itemCount: number; name: string }
  | { ok: false; error: string };

export async function startCartAction(formData: FormData): Promise<StartCartResult> {
  const email = String(formData.get("email") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email." };
  if (!isValidPhone(phone)) return { ok: false, error: "Enter a valid phone number." };
  if (name.length < 1 || name.length > 80) return { ok: false, error: "Enter your name." };

  const normalized = normalizeEmail(email);
  const existing = await findCartByEmail(normalized);

  if (existing) {
    const full = await getCartWithItems(existing.id);
    return {
      ok: false,
      conflict: "existing",
      existingCartId: existing.id,
      itemCount: full?.itemCount ?? 0,
      name: existing.name,
    };
  }

  const cartId = await createCart({ email: normalized, phone: normalizePhone(phone), name });
  return { ok: true, cartId };
}

export type ResolveConflictResult =
  | { ok: true; cartId: string }
  | { ok: false; error: string };

function parsePendingItems(raw: unknown): PendingCartItem[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (v): v is PendingCartItem =>
          v && typeof v === "object" && typeof v.productId === "string" && typeof v.quantity === "number" && v.quantity > 0,
      )
      .slice(0, MAX_PENDING_ITEMS);
  } catch {
    return [];
  }
}

export async function resolveCartConflictAction(formData: FormData): Promise<ResolveConflictResult> {
  const existingCartId = String(formData.get("existingCartId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const pending = parsePendingItems(formData.get("pendingItems"));

  if (!existingCartId) return { ok: false, error: "Missing cart." };
  if (intent !== "resume" && intent !== "replace") return { ok: false, error: "Invalid choice." };

  const cart = await getCartWithItems(existingCartId);
  if (!cart) return { ok: false, error: "Cart no longer exists." };

  if (intent === "resume") {
    if (pending.length > 0) await mergeCartItems(existingCartId, pending);
  } else {
    await replaceCartItems(existingCartId, pending);
  }

  return { ok: true, cartId: existingCartId };
}

export async function getCartAction(cartId: string) {
  if (!cartId) return null;
  return getCartWithItems(cartId);
}

export type MutationResult =
  | { ok: true; cartId: string }
  | { ok: false; error: string };

export async function addCartItemAction(formData: FormData): Promise<MutationResult> {
  const cartId = String(formData.get("cartId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!cartId || !productId || !Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, error: "Invalid request." };
  }

  const active = await validateActiveProduct(productId);
  if (!active) return { ok: false, error: "This item is not available." };

  const inventory = await getProductInventory(productId);
  if (inventory === null) return { ok: false, error: "This item is not available." };
  const currentQty = await getCartItemQuantity(cartId, productId);
  if (currentQty + quantity > inventory) {
    return { ok: false, error: `Only ${inventory - currentQty} left in stock.` };
  }

  await upsertCartItemLib(cartId, productId, quantity);
  revalidatePath("/admin/carts");
  revalidatePath(`/admin/carts/${cartId}`);
  return { ok: true, cartId };
}

export async function updateCartItemAction(formData: FormData): Promise<MutationResult> {
  const cartId = String(formData.get("cartId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  if (!cartId || !productId || !Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, error: "Invalid request." };
  }

  if (quantity > 0) {
    const inventory = await getProductInventory(productId);
    if (inventory === null) return { ok: false, error: "This item is not available." };
    if (quantity > inventory) return { ok: false, error: `Only ${inventory} left in stock.` };
  }

  await setCartItemQuantityLib(cartId, productId, quantity);
  revalidatePath("/admin/carts");
  revalidatePath(`/admin/carts/${cartId}`);
  return { ok: true, cartId };
}

export async function removeCartItemAction(formData: FormData): Promise<MutationResult> {
  const cartId = String(formData.get("cartId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!cartId || !productId) return { ok: false, error: "Invalid request." };
  await removeCartItemLib(cartId, productId);
  revalidatePath("/admin/carts");
  revalidatePath(`/admin/carts/${cartId}`);
  return { ok: true, cartId };
}

export async function clearCartAction(formData: FormData): Promise<MutationResult> {
  const cartId = String(formData.get("cartId") ?? "");
  if (!cartId) return { ok: false, error: "Invalid request." };
  await clearCartLib(cartId);
  revalidatePath("/admin/carts");
  revalidatePath(`/admin/carts/${cartId}`);
  return { ok: true, cartId };
}

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

export async function createCheckoutSessionAction(cartId: string): Promise<CheckoutResult> {
  if (!cartId) return { ok: false, error: "No cart found." };

  try {
    const cart = await getCartWithItems(cartId);
    if (!cart || cart.items.length === 0) return { ok: false, error: "Your cart is empty." };

    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "https";
    const origin = `${proto}://${host}`;

    const stripe = new Stripe(getStripeSecretKey());

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: cart.email,
      line_items: cart.items.map((item) => {
        const imageUrl = item.image
          ? item.image.startsWith("http")
            ? item.image
            : `${origin}${item.image}`
          : null;
        return {
          price_data: {
            currency: "usd",
            unit_amount: item.price,
            product_data: {
              name: item.variantName ? `${item.name} – ${item.variantName}` : item.name,
              ...(imageUrl ? { images: [imageUrl] } : {}),
            },
          },
          quantity: item.quantity,
        };
      }),
      metadata: { cartId },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    if (!session.url) return { ok: false, error: "Failed to create checkout session." };
    return { ok: true, url: session.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("createCheckoutSessionAction error:", message);
    return { ok: false, error: message };
  }
}
