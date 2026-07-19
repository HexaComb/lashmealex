import { expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  findCartByEmail: vi.fn(),
  getCartWithItems: vi.fn(),
  rotateCartAccessTokenForVerifiedShopper: vi.fn(),
  startOverCart: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => ({ value: "cart_1.cart-capability" }),
    set: mocks.cookieSet,
  })),
  headers: vi.fn(async () => new Headers({ host: "store.example.com", "x-forwarded-proto": "https" })),
}));
vi.mock("@/lib/cart", () => ({
  clearCart: vi.fn(),
  createCart: vi.fn(),
  findCartByEmail: mocks.findCartByEmail,
  getCartItemQuantity: vi.fn(),
  getCartWithItems: mocks.getCartWithItems,
  getProductInventory: vi.fn(),
  mergeCartItems: vi.fn(),
  removeCartItem: vi.fn(),
  replaceCartItems: vi.fn(),
  rotateCartAccessTokenForVerifiedShopper: mocks.rotateCartAccessTokenForVerifiedShopper,
  setCartItemQuantity: vi.fn(),
  startOverCart: mocks.startOverCart,
  upsertCartItem: vi.fn(),
  validateActiveProduct: vi.fn(),
}));
vi.mock("@/lib/stripe", () => ({ getStripeSecretKey: () => "sk_test" }));
vi.mock("stripe", () => ({
  default: class Stripe {
    checkout = { sessions: { create: mocks.createSession } };
  },
}));

import { createCheckoutSessionAction, resolveCartConflictAction, startCartAction } from "./actions";

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

test("does not expose checkout configuration errors to customers", async () => {
  mocks.getCartWithItems.mockResolvedValue({
    email: "customer@example.com",
    items: [{
      id: "line_1",
      name: "Lash Set",
      variantName: "Classic",
      price: 1800,
      quantity: 1,
      image: null,
    }],
  });
  mocks.createSession.mockRejectedValue(new Error("STRIPE_SECRET_KEY is not configured"));

  await expect(createCheckoutSessionAction("cart_1")).resolves.toEqual({
    ok: false,
    error: "Checkout is temporarily unavailable. Please try again later.",
  });
});

test("starts over by replacing the authorized cart with a new cart", async () => {
  mocks.startOverCart.mockResolvedValue("cart_2");
  const formData = new FormData();
  formData.set("existingCartId", "cart_1");
  formData.set("intent", "replace");
  formData.set("email", "customer@example.com");
  formData.set("phone", "555-555-5555");
  formData.set("name", "Customer");

  await expect(resolveCartConflictAction(formData)).resolves.toEqual({ ok: true, cartId: "cart_2" });
  expect(mocks.startOverCart).toHaveBeenCalledWith(expect.objectContaining({
    cartId: "cart_1",
    accessToken: "cart-capability",
    email: "customer@example.com",
    phone: "5555555555",
    name: "Customer",
  }));
  expect(mocks.cookieSet).toHaveBeenCalledWith(
    "lashmealex_cart_access",
    expect.stringMatching(/^cart_2\./),
    expect.objectContaining({ httpOnly: true }),
  );
});

test("issues a capability for a verified returning shopper before showing the cart conflict", async () => {
  mocks.rotateCartAccessTokenForVerifiedShopper.mockClear();
  mocks.cookieSet.mockClear();
  mocks.findCartByEmail.mockResolvedValue({
    id: "cart_1",
    name: "Customer",
    phone: "5555555555",
  });
  const formData = new FormData();
  formData.set("email", "customer@example.com");
  formData.set("phone", "555-555-5555");
  formData.set("name", "Customer");

  await expect(startCartAction(formData)).resolves.toEqual({
    ok: false,
    conflict: "existing",
    existingCartId: "cart_1",
    itemCount: 0,
    name: "Customer",
  });
  expect(mocks.rotateCartAccessTokenForVerifiedShopper).toHaveBeenCalledWith(
    "cart_1",
    expect.any(String),
  );
  expect(mocks.cookieSet).toHaveBeenCalledWith(
    "lashmealex_cart_access",
    expect.stringMatching(/^cart_1\./),
    expect.objectContaining({ httpOnly: true }),
  );
});

test("does not issue a cart capability when returning shopper details do not match", async () => {
  mocks.rotateCartAccessTokenForVerifiedShopper.mockClear();
  mocks.findCartByEmail.mockResolvedValue({
    id: "cart_1",
    name: "Customer",
    phone: "5555555555",
  });
  const formData = new FormData();
  formData.set("email", "customer@example.com");
  formData.set("phone", "555-555-0000");
  formData.set("name", "Customer");

  await expect(startCartAction(formData)).resolves.toEqual({
    ok: false,
    error: "We could not verify this existing cart. Please check your details.",
  });
  expect(mocks.rotateCartAccessTokenForVerifiedShopper).not.toHaveBeenCalled();
});
