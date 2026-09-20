import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";

import {
  claimConfirmationEmailSend,
  markConfirmationEmailFailed,
  markConfirmationEmailSent,
  processStripeCheckoutEvent,
} from "@/lib/orders";
import { sendOrderStatusEmail } from "@/lib/order-email";
import { createStripeClient, getStripeWebhookSecret } from "@/lib/stripe";
import { isOrderFulfillmentStatus } from "@/lib/order-status";

function stripeCheckoutLines(session: Stripe.Checkout.Session) {
  const lines = [];
  for (const item of session.line_items?.data ?? []) {
    const product = item.price?.product;
    const productId = typeof product === "object" && product && !product.deleted
      ? product.metadata?.productId
      : undefined;
    const unitAmount = item.price?.unit_amount;
    const quantity = item.quantity;
    if (!productId || unitAmount == null || quantity == null) {
      continue;
    }
    lines.push({ productId, quantity, unitAmount });
  }
  return lines;
}

async function deliverConfirmationEmail(
  order: {
    id: string;
    customerEmail: string;
    customerName?: string | null;
    fulfillmentStatus: string;
    statusToken: string;
    confirmationEmailStatus?: string;
  },
  requestOrigin: string,
) {
  if (order.confirmationEmailStatus === "sent" || !order.statusToken) return;
  const claimed = await claimConfirmationEmailSend(order.id);
  if (!claimed) return;
  const fulfillmentStatus = isOrderFulfillmentStatus(claimed.fulfillmentStatus)
    ? claimed.fulfillmentStatus
    : "received";
  try {
    await sendOrderStatusEmail({
      customerEmail: claimed.customerEmail,
      customerName: claimed.customerName,
      fulfillmentStatus,
      statusToken: claimed.statusToken,
      requestOrigin,
    });
    await markConfirmationEmailSent(order.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "email_send_failed";
    console.error("Order confirmation email failed:", error);
    await markConfirmationEmailFailed(order.id, message);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = createStripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, getStripeWebhookSecret());
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    const session = event.data.object;
    const cartId = session.metadata?.cartId;
    const shouldCreatePaidOrder =
      (event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded") &&
      session.payment_status === "paid";

    let amountTotal = session.amount_total ?? undefined;
    let lineItems: Array<{ productId: string; quantity: number; unitAmount: number }> | undefined;
    if (shouldCreatePaidOrder) {
      const paidSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price.product"],
      });
      amountTotal = paidSession.amount_total ?? amountTotal;
      lineItems = stripeCheckoutLines(paidSession);
    }

    const result = await processStripeCheckoutEvent({
      eventId: event.id,
      eventType: event.type,
      sessionId: session.id,
      cartId,
      paymentStatus: session.payment_status,
      shouldCreatePaidOrder,
      amountTotal,
      lineItems,
    });

    if (!result.ack) {
      console.error("Stripe webhook requires reconciliation; refusing to ACK", {
        eventId: event.id,
        eventType: event.type,
        sessionId: session.id,
        outcome: result.outcome,
      });
      return NextResponse.json(
        { error: "payment_requires_reconciliation", outcome: result.outcome },
        { status: 500 },
      );
    }

    if (result.order) {
      await deliverConfirmationEmail(result.order, new URL(request.url).origin);
      revalidatePath("/admin");
      revalidatePath("/admin/carts");
    }
  }

  return NextResponse.json({ received: true });
}
