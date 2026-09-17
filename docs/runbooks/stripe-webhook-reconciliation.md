# Stripe Webhook Reconciliation

Use this procedure when a Stripe Checkout payment does not appear in the Lashmealex admin order list or Stripe reports repeated delivery failures.

1. In Stripe Dashboard, find the Checkout session and verify its payment status, `amount_total`, line items, and the relevant event IDs.
2. In Convex Dashboard, inspect:
   - `checkoutSnapshots` by `stripeSessionId` (frozen cart at Checkout)
   - `paymentExceptions` by `stripeSessionId` (paid sessions that were not ACKed)
   - `stripeWebhookEvents` by `eventId` or `sessionId` (only outcomes that were safely ACKed)
   - `orders.confirmationEmailStatus` if the order exists but the shopper got no email
3. Interpret the recorded outcome:
   - `order_created`: the paid order was persisted from the frozen snapshot after amount/line reconciliation.
   - `awaiting_payment`, `payment_failed`, or `expired`: no paid order should exist; a frozen cart may be released back to `active`.
   - `duplicate_event` or `duplicate_session`: delivery was safely idempotent.
   - `missing_cart_id`, `cart_not_found`, `snapshot_not_found`, `amount_mismatch`, `line_mismatch`, `inventory_unavailable`, or `product_missing`: the webhook **returns HTTP 500** and writes `paymentExceptions` so Stripe retries. Do not treat these as success.
4. For a confirmed paid session with an open `paymentExceptions` row, repair only through an approved operational procedure (restock + replay, or refund in Stripe). Do not ACK the event until an order exists or the payment is reversed.
5. Confirmation email is stored on the order (`pending` / `sending` / `sent` / `failed`) and retried by a Convex scheduled action independently of Stripe `eventId` idempotency. Set Resend env vars on both Vercel and Convex.
6. Preserve the Stripe event and session IDs in the incident record so retries and follow-up reconciliation remain traceable.
