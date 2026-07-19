import "server-only";

import { Resend } from "resend";

import {
  orderFulfillmentCopy,
  type OrderFulfillmentStatus,
} from "./order-status";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

/**
 * Sends a customer-facing order-progress email with the private status link.
 * Resend credentials and a verified sender are intentionally required at runtime.
 */
export async function sendOrderStatusEmail(input: {
  customerEmail: string;
  customerName?: string | null;
  fulfillmentStatus: OrderFulfillmentStatus;
  statusToken: string;
  requestOrigin?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? input.requestOrigin;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  if (!from) throw new Error("RESEND_FROM_EMAIL is not configured");
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL is not configured");

  const copy = orderFulfillmentCopy[input.fulfillmentStatus];
  const statusUrl = new URL(`/orders/${input.statusToken}`, siteUrl).toString();
  const name = input.customerName ? `Hi ${escapeHtml(input.customerName)},` : "Hi,";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [input.customerEmail],
    subject: `Your Lashmealex order: ${copy.label}`,
    text: `${copy.label}\n\n${copy.description}\n\nTrack your order: ${statusUrl}`,
    html: `<p>${name}</p><p><strong>${copy.label}</strong></p><p>${copy.description}</p><p><a href="${statusUrl}">Track your order status</a></p>`,
  });
  if (error) throw new Error(`Resend failed to send order-status email: ${error.message}`);
}
