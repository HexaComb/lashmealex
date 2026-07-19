import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { processStripeCheckoutEvent } from "@/lib/orders";
import { sendOrderStatusEmail } from "@/lib/order-email";
import { createStripeClient, getStripeWebhookSecret } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const stripe = createStripeClient();
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

    const result = await processStripeCheckoutEvent({
      eventId: event.id,
      eventType: event.type,
      sessionId: session.id,
      cartId,
      paymentStatus: session.payment_status,
      shouldCreatePaidOrder:
        (event.type === "checkout.session.completed" ||
          event.type === "checkout.session.async_payment_succeeded") &&
        session.payment_status === "paid",
    });

    if (result.outcome === "missing_cart_id" || result.outcome === "cart_not_found") {
      // Surface a durable reconciliation failure to the application's error monitoring.
      console.error("Stripe webhook requires reconciliation", {
        eventId: event.id,
        eventType: event.type,
        sessionId: session.id,
        outcome: result.outcome,
      });
    }

    if (result.order) {
      try {
        await sendOrderStatusEmail({
          customerEmail: result.order.customerEmail,
          customerName: result.order.customerName,
          fulfillmentStatus: result.order.fulfillmentStatus,
          statusToken: result.order.statusToken,
          requestOrigin: new URL(request.url).origin,
        });
      } catch (error) {
        // The paid order must remain recorded even when outbound email is temporarily unavailable.
        console.error("Order confirmation email failed:", error);
      }

      revalidatePath("/admin");
      revalidatePath("/admin/carts");
    }
  }

  return NextResponse.json({ received: true });
}
