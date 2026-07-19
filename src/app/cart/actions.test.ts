import { expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  getCartWithItems: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => ({ value: "cart_1.cart-capability" }) })),
  headers: vi.fn(async () => new Headers({ host: "store.example.com", "x-forwarded-proto": "https" })),
}));
vi.mock("@/lib/cart", () => ({
  clearCart: vi.fn(),
  createCart: vi.fn(),
  findCartByEmail: vi.fn(),
  getCartItemQuantity: vi.fn(),
  getCartWithItems: mocks.getCartWithItems,
  getProductInventory: vi.fn(),
  mergeCartItems: vi.fn(),
  removeCartItem: vi.fn(),
  replaceCartItems: vi.fn(),
  setCartItemQuantity: vi.fn(),
  upsertCartItem: vi.fn(),
  validateActiveProduct: vi.fn(),
}));
vi.mock("@/lib/stripe", () => ({ getStripeSecretKey: () => "sk_test" }));
vi.mock("stripe", () => ({
  default: class Stripe {
    checkout = { sessions: { create: mocks.createSession } };
  },
}));

import { createCheckoutSessionAction } from "./actions";

test("creates a Stripe checkout session only for the cart held by the capability cookie", async () => {
  mocks.getCartWithItems.mockResolvedValue({
    email: "customer@example.com",
    items: [{
      id: "line_1",
      name: "Lash Set",
      variantName: "Classic",
      price: 1800,
      quantity: 2,
      image: "/lash-set.jpg",
    }],
  });
  mocks.createSession.mockResolvedValue({ url: "https://checkout.stripe.test/session" });

  await expect(createCheckoutSessionAction("cart_1")).resolves.toEqual({
    ok: true,
    url: "https://checkout.stripe.test/session",
  });
  expect(mocks.getCartWithItems).toHaveBeenCalledWith("cart_1", "cart-capability");
  expect(mocks.createSession).toHaveBeenCalledWith(expect.objectContaining({
    customer_email: "customer@example.com",
    metadata: { cartId: "cart_1" },
    line_items: [expect.objectContaining({ quantity: 2 })],
  }));
});
