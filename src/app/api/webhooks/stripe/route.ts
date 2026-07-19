import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { updateCartStatus } from "@/lib/cart";
import { createOrderFromCart, getOrderByStripeSessionId } from "@/lib/orders";
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const cartId = session.metadata?.cartId;

    if (!cartId) {
      return NextResponse.json({ error: "Missing cartId in metadata" }, { status: 400 });
    }

    const existing = await getOrderByStripeSessionId(session.id);
    if (existing) {
      return NextResponse.json({ received: true });
    }

    const { getCartWithItems } = await import("@/lib/cart");
    const cart = await getCartWithItems(cartId);
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const order = await createOrderFromCart(cart, session.id);
    await updateCartStatus(cartId, "converted");

    try {
      await sendOrderStatusEmail({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        fulfillmentStatus: order.fulfillmentStatus,
        statusToken: order.statusToken,
        requestOrigin: new URL(request.url).origin,
      });
    } catch (error) {
      // The paid order must remain recorded even when outbound email is temporarily unavailable.
      console.error("Order confirmation email failed:", error);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/carts");
  }

  return NextResponse.json({ received: true });
}
