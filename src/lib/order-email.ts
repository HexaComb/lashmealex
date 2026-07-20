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
  const siteLink = siteUrl.replace(/\/$/, "");
  const name = input.customerName ? `Hi ${escapeHtml(input.customerName)},` : "Hi,";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Lashmealex order: ${copy.label}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;color:#121212;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf9f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#121212;width:48px;height:48px;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;letter-spacing:0.2em;color:#ffffff;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
                    LM
                  </td>
                  <td style="padding-left:14px;font-size:28px;font-weight:400;letter-spacing:-0.04em;color:#121212;font-family:'Cormorant Garamond','Georgia',serif;">
                    lashmealex
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e2e2e2;padding:40px 36px;">

              <!-- Greeting -->
              <p style="margin:0 0 28px;font-size:16px;line-height:1.5;color:#121212;">
                ${name}
              </p>

              <!-- Status Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background-color:#d46a8c;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:8px 18px;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
                    ${copy.label}
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <p style="margin:0 0 36px;font-size:15px;line-height:1.7;color:#626262;">
                ${copy.description}
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${statusUrl}" target="_blank" style="display:inline-block;background-color:#d46a8c;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:16px 40px;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
                      Track Your Order
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#626262;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
                Lashmealex &mdash; Professional Lash Products
              </p>
              <p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#626262;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
                Fresno, California
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;">
                <a href="${siteLink}" style="color:#d46a8c;text-decoration:none;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
                  lashmealexaesthetics.com
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [input.customerEmail],
    subject: `Your Lashmealex order: ${copy.label}`,
    text: `${copy.label}\n\n${copy.description}\n\nTrack your order: ${statusUrl}`,
    html,
  });
  if (error) throw new Error(`Resend failed to send order-status email: ${error.message}`);
}
