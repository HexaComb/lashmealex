import { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  processStripeCheckoutEvent: vi.fn(),
  sendOrderStatusEmail: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/orders", () => ({ processStripeCheckoutEvent: mocks.processStripeCheckoutEvent }));
vi.mock("@/lib/order-email", () => ({ sendOrderStatusEmail: mocks.sendOrderStatusEmail }));
vi.mock("@/lib/stripe", () => ({
  createStripeClient: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
  getStripeWebhookSecret: () => "whsec_test",
}));

import { POST } from "./route";

test("rejects unsigned Stripe webhook requests", async () => {
  const response = await POST(new NextRequest("https://store.example.com/api/webhooks/stripe", {
    method: "POST",
    body: "{}",
  }));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: "Missing signature" });
});

test("processes a verified paid checkout webhook exactly through the order mutation", async () => {
  mocks.constructEvent.mockReturnValue({
    id: "evt_1",
    type: "checkout.session.completed",
    data: { object: { id: "cs_1", payment_status: "paid", metadata: { cartId: "cart_1" } } },
  });
  mocks.processStripeCheckoutEvent.mockResolvedValue({ outcome: "duplicate_session", order: null });

  const response = await POST(new NextRequest("https://store.example.com/api/webhooks/stripe", {
    method: "POST",
    body: "{}",
    headers: { "stripe-signature": "sig_1" },
  }));

  expect(response.status).toBe(200);
  expect(mocks.processStripeCheckoutEvent).toHaveBeenCalledWith({
    eventId: "evt_1",
    eventType: "checkout.session.completed",
    sessionId: "cs_1",
    cartId: "cart_1",
    paymentStatus: "paid",
    shouldCreatePaidOrder: true,
  });
});
