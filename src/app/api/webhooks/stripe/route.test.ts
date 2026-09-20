import { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  retrieve: vi.fn(),
  processStripeCheckoutEvent: vi.fn(),
  sendOrderStatusEmail: vi.fn(),
  claimConfirmationEmailSend: vi.fn(),
  markConfirmationEmailSent: vi.fn(),
  markConfirmationEmailFailed: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/orders", () => ({
  processStripeCheckoutEvent: mocks.processStripeCheckoutEvent,
  claimConfirmationEmailSend: mocks.claimConfirmationEmailSend,
  markConfirmationEmailSent: mocks.markConfirmationEmailSent,
  markConfirmationEmailFailed: mocks.markConfirmationEmailFailed,
}));
vi.mock("@/lib/order-email", () => ({ sendOrderStatusEmail: mocks.sendOrderStatusEmail }));
vi.mock("@/lib/stripe", () => ({
  createStripeClient: () => ({
    webhooks: { constructEvent: mocks.constructEvent },
    checkout: { sessions: { retrieve: mocks.retrieve } },
  }),
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

test("processes a verified paid checkout webhook with Stripe line items", async () => {
  mocks.constructEvent.mockReturnValue({
    id: "evt_1",
    type: "checkout.session.completed",
    data: { object: { id: "cs_1", payment_status: "paid", amount_total: 2400, metadata: { cartId: "cart_1" } } },
  });
  mocks.retrieve.mockResolvedValue({
    id: "cs_1",
    amount_total: 2400,
    line_items: {
      data: [{
        quantity: 2,
        price: {
          unit_amount: 1200,
          product: { deleted: false, metadata: { productId: "product_1" } },
        },
      }],
    },
  });
  mocks.processStripeCheckoutEvent.mockResolvedValue({ outcome: "duplicate_session", ack: true, order: null });

  const response = await POST(new NextRequest("https://store.example.com/api/webhooks/stripe", {
    method: "POST",
    body: "{}",
    headers: { "stripe-signature": "sig_1" },
  }));

  expect(response.status).toBe(200);
  expect(mocks.retrieve).toHaveBeenCalledWith("cs_1", { expand: ["line_items.data.price.product"] });
  expect(mocks.processStripeCheckoutEvent).toHaveBeenCalledWith({
    eventId: "evt_1",
    eventType: "checkout.session.completed",
    sessionId: "cs_1",
    cartId: "cart_1",
    paymentStatus: "paid",
    shouldCreatePaidOrder: true,
    amountTotal: 2400,
    lineItems: [{ productId: "product_1", quantity: 2, unitAmount: 1200 }],
  });
});

test("does not ACK a captured payment that could not create an order", async () => {
  mocks.constructEvent.mockReturnValue({
    id: "evt_fail",
    type: "checkout.session.completed",
    data: { object: { id: "cs_fail", payment_status: "paid", amount_total: 2400, metadata: { cartId: "cart_1" } } },
  });
  mocks.retrieve.mockResolvedValue({
    id: "cs_fail",
    amount_total: 2400,
    line_items: { data: [] },
  });
  mocks.processStripeCheckoutEvent.mockResolvedValue({
    ack: false,
    outcome: "inventory_unavailable",
    order: null,
  });

  const response = await POST(new NextRequest("https://store.example.com/api/webhooks/stripe", {
    method: "POST",
    body: "{}",
    headers: { "stripe-signature": "sig_1" },
  }));

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "payment_requires_reconciliation",
    outcome: "inventory_unavailable",
  });
});

test("retries confirmation email on a duplicate Stripe event when send is still pending", async () => {
  mocks.constructEvent.mockReturnValue({
    id: "evt_1",
    type: "checkout.session.completed",
    data: { object: { id: "cs_1", payment_status: "paid", amount_total: 2400, metadata: { cartId: "cart_1" } } },
  });
  mocks.retrieve.mockResolvedValue({
    id: "cs_1",
    amount_total: 2400,
    line_items: {
      data: [{
        quantity: 2,
        price: { unit_amount: 1200, product: { deleted: false, metadata: { productId: "product_1" } } },
      }],
    },
  });
  mocks.processStripeCheckoutEvent.mockResolvedValue({
    ack: true,
    outcome: "duplicate_event",
    order: {
      id: "order_1",
      statusToken: "status_token_1",
      fulfillmentStatus: "received",
      customerEmail: "customer@example.com",
      customerName: "Customer",
      confirmationEmailStatus: "pending",
    },
  });
  mocks.claimConfirmationEmailSend.mockResolvedValue({
    customerEmail: "customer@example.com",
    customerName: "Customer",
    fulfillmentStatus: "received",
    statusToken: "status_token_1",
  });
  mocks.sendOrderStatusEmail.mockResolvedValue(undefined);
  mocks.markConfirmationEmailSent.mockResolvedValue(undefined);

  const response = await POST(new NextRequest("https://store.example.com/api/webhooks/stripe", {
    method: "POST",
    body: "{}",
    headers: { "stripe-signature": "sig_1" },
  }));

  expect(response.status).toBe(200);
  expect(mocks.sendOrderStatusEmail).toHaveBeenCalled();
  expect(mocks.markConfirmationEmailSent).toHaveBeenCalledWith("order_1");
});
