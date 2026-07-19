import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const productFields = {
  id: v.string(),
  parentProductId: v.string(),
  parentProductName: v.string(),
  slug: v.string(),
  name: v.string(),
  variantName: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.string(),
  price: v.number(),
  compareAtPrice: v.optional(v.number()),
  inventory: v.number(),
  imageStorageId: v.optional(v.id("_storage")),
  // Deprecated: fallback for older rows that do not have Convex storage yet.
  imageUrl: v.optional(v.string()),
  isFeatured: v.boolean(),
  isHero: v.boolean(),
  isActive: v.boolean(),
  sortOrder: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const orderFields = {
  id: v.string(),
  stripeSessionId: v.optional(v.string()),
  // Added as optional so orders created before payment reconciliation remain valid.
  stripePaymentStatus: v.optional(v.string()),
  lastStripeEventId: v.optional(v.string()),
  lastStripeEventType: v.optional(v.string()),
  paymentUpdatedAt: v.optional(v.number()),
  status: v.string(),
  fulfillmentStatus: v.string(),
  // Optional so existing orders remain valid while the status-link rollout completes.
  statusToken: v.optional(v.string()),
  subtotal: v.number(),
  total: v.number(),
  customerEmail: v.string(),
  customerName: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const orderStatusEventFields = {
  orderId: v.string(),
  status: v.string(),
  createdAt: v.number(),
};

export const orderItemFields = {
  id: v.string(),
  orderId: v.string(),
  productId: v.string(),
  quantity: v.number(),
  price: v.number(),
};

export const stripeWebhookEventFields = {
  eventId: v.string(),
  eventType: v.string(),
  sessionId: v.optional(v.string()),
  cartId: v.optional(v.string()),
  paymentStatus: v.optional(v.string()),
  outcome: v.string(),
  createdAt: v.number(),
};

export const cartFields = {
  id: v.string(),
  email: v.string(),
  phone: v.string(),
  name: v.string(),
  status: v.string(),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastActiveAt: v.number(),
};

export const cartItemFields = {
  id: v.string(),
  cartId: v.string(),
  productId: v.string(),
  quantity: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const productImageFields = {
  parentProductId: v.string(),
  imageStorageId: v.id("_storage"),
  sortOrder: v.number(),
  createdAt: v.number(),
};

export default defineSchema({
  products: defineTable(productFields)
    .index("by_externalId", ["id"])
    .index("by_slug", ["slug"])
    .index("by_parentProductId", ["parentProductId"])
    .index("by_isActive", ["isActive"]),
  productImages: defineTable(productImageFields)
    .index("by_parentProductId_and_sortOrder", ["parentProductId", "sortOrder"]),
  orders: defineTable(orderFields)
    .index("by_externalId", ["id"])
    .index("by_stripeSessionId", ["stripeSessionId"])
    .index("by_statusToken", ["statusToken"]),
  orderStatusEvents: defineTable(orderStatusEventFields)
    .index("by_orderId_and_createdAt", ["orderId", "createdAt"]),
  orderItems: defineTable(orderItemFields)
    .index("by_externalId", ["id"])
    .index("by_orderId", ["orderId"]),
  stripeWebhookEvents: defineTable(stripeWebhookEventFields)
    .index("by_eventId", ["eventId"])
    .index("by_sessionId", ["sessionId"]),
  carts: defineTable(cartFields)
    .index("by_externalId", ["id"])
    .index("by_email", ["email"]),
  cartItems: defineTable(cartItemFields)
    .index("by_externalId", ["id"])
    .index("by_cartId", ["cartId"])
    .index("by_cartId_productId", ["cartId", "productId"]),
});
