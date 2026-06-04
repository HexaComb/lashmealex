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
  status: v.string(),
  fulfillmentStatus: v.string(),
  subtotal: v.number(),
  total: v.number(),
  customerEmail: v.string(),
  customerName: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const orderItemFields = {
  id: v.string(),
  orderId: v.string(),
  productId: v.string(),
  quantity: v.number(),
  price: v.number(),
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

export default defineSchema({
  products: defineTable(productFields)
    .index("by_externalId", ["id"])
    .index("by_slug", ["slug"])
    .index("by_parentProductId", ["parentProductId"])
    .index("by_isActive", ["isActive"]),
  orders: defineTable(orderFields)
    .index("by_externalId", ["id"])
    .index("by_stripeSessionId", ["stripeSessionId"]),
  orderItems: defineTable(orderItemFields)
    .index("by_externalId", ["id"])
    .index("by_orderId", ["orderId"]),
  carts: defineTable(cartFields)
    .index("by_externalId", ["id"])
    .index("by_email", ["email"]),
  cartItems: defineTable(cartItemFields)
    .index("by_externalId", ["id"])
    .index("by_cartId", ["cartId"])
    .index("by_cartId_productId", ["cartId", "productId"]),
});
