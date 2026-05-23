import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { assertAdminSecret } from "../lib/admin";
import {
  cartFields,
  cartItemFields,
  orderFields,
  orderItemFields,
  productFields,
} from "../schema";

/**
 * One-off batch import from exported D1 rows. Clears tables when `clearFirst` is true.
 */
export const importD1Batch = mutation({
  args: {
    adminSecret: v.string(),
    clearFirst: v.boolean(),
    products: v.optional(v.array(v.object(productFields))),
    carts: v.optional(v.array(v.object(cartFields))),
    cartItems: v.optional(v.array(v.object(cartItemFields))),
    orders: v.optional(v.array(v.object(orderFields))),
    orderItems: v.optional(v.array(v.object(orderItemFields))),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (args.clearFirst) {
      for (const table of ["orderItems", "orders", "cartItems", "carts", "products"] as const) {
        const rows = await ctx.db.query(table).collect();
        for (const row of rows) {
          await ctx.db.delete(row._id);
        }
      }
    }

    if (args.products) {
      for (const row of args.products) {
        await ctx.db.insert("products", row);
      }
    }
    if (args.carts) {
      for (const row of args.carts) {
        await ctx.db.insert("carts", row);
      }
    }
    if (args.cartItems) {
      for (const row of args.cartItems) {
        await ctx.db.insert("cartItems", row);
      }
    }
    if (args.orders) {
      for (const row of args.orders) {
        await ctx.db.insert("orders", row);
      }
    }
    if (args.orderItems) {
      for (const row of args.orderItems) {
        await ctx.db.insert("orderItems", row);
      }
    }
  },
});
