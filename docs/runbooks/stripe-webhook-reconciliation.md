# Stripe Webhook Reconciliation

Use this procedure when a Stripe Checkout payment does not appear in the Lashmealex admin order list or Stripe reports repeated delivery failures.

1. In Stripe Dashboard, find the Checkout session and verify its payment status and the relevant event IDs.
2. In Convex Dashboard, inspect `stripeWebhookEvents` by `eventId` or `sessionId`.
3. Interpret the recorded outcome:
   - `order_created`: the paid order was persisted.
   - `awaiting_payment`, `payment_failed`, or `expired`: no paid order should exist.
   - `duplicate_event` or `duplicate_session`: delivery was safely idempotent.
   - `missing_cart_id` or `cart_not_found`: investigate the Checkout session metadata and cart retention before retrying.
4. For a confirmed paid session with no `order_created` event, repair the data only through an approved operational procedure; do not manually mark an order paid without confirming the Stripe session.
5. Preserve the Stripe event and session IDs in the incident record so retries and follow-up reconciliation remain traceable.
