import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

/**
 * Durable confirmation-email retry. Independent of Stripe eventId idempotency.
 * Requires RESEND_API_KEY, RESEND_FROM_EMAIL, and NEXT_PUBLIC_SITE_URL on the Convex deployment.
 */
export const sendOrderConfirmation = internalAction({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.runMutation(internal.orders.claimConfirmationEmailJob, {
      orderId: args.orderId,
    });
    if (!job) return;

    try {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
      if (!from) throw new Error("RESEND_FROM_EMAIL is not configured");
      if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL is not configured");

      const statusUrl = new URL(`/orders/${job.statusToken}`, siteUrl).toString();
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [job.customerEmail],
          subject: "Your Lashmealex order: Received",
          text: `Your order is confirmed and queued for preparation.\n\nTrack your order: ${statusUrl}`,
          html: `<p>Your order is confirmed and queued for preparation.</p><p><a href="${statusUrl}">Track your order</a></p>`,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Resend failed to send order-status email: ${detail || response.status}`);
      }

      await ctx.runMutation(internal.orders.markConfirmationEmailSentJob, { orderId: args.orderId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "email_send_failed";
      await ctx.runMutation(internal.orders.markConfirmationEmailRetryJob, {
        orderId: args.orderId,
        error: message,
      });
    }
  },
});
