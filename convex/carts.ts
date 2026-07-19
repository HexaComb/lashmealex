import { v } from "convex/values";
import { type MutationCtx, type QueryCtx, mutation, query } from "./_generated/server";
import { assertAdminSecret } from "./lib/admin";
import {
  ABANDONED_THRESHOLD_MS,
  isValidCartStatus,
  hashCartAccessToken,
  normalizeEmail,
  normalizePhone,
  type CartStatus,
} from "./lib/cartUtils";
import type { Doc } from "./_generated/dataModel";

export interface CartLine {
  id: string;
  productId: string;
  quantity: number;
  name: string;
  variantName: string | null;
  slug: string;
  price: number;
  image: string | null;
  inventory: number;
  isActive: boolean;
}

export interface CartWithItems {
  id: string;
  email: string;
  phone: string;
  name: string;
  status: CartStatus;
  notes: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  lastActiveAt: number | null;
  items: CartLine[];
  subtotal: number;
  itemCount: number;
}

function subtotalOf(lines: Array<{ price: number; quantity: number }>) {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}

function itemCountOf(lines: Array<{ quantity: number }>) {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

async function getCartById(ctx: QueryCtx | MutationCtx, cartId: string) {
  return ctx.db
    .query("carts")
    .withIndex("by_externalId", (q) => q.eq("id", cartId))
    .first();
}

async function requireCartAccess(ctx: QueryCtx | MutationCtx, cartId: string, accessToken: string) {
  const cart = await getCartById(ctx, cartId);
  if (!cart?.accessTokenHash || cart.accessTokenHash !== await hashCartAccessToken(accessToken)) {
    throw new Error("Unauthorized cart access");
  }
  return cart;
}

async function getProductImageUrl(ctx: QueryCtx, product: Doc<"products">) {
  if (product.imageStorageId) {
    const storageUrl = await ctx.storage.getUrl(product.imageStorageId);
    if (storageUrl) return storageUrl;
  }
  return product.imageUrl ?? null;
}

async function buildCartWithItems(ctx: QueryCtx, cartId: string): Promise<CartWithItems | null> {
  const cartRow = await getCartById(ctx, cartId);
  if (!cartRow) return null;

  const itemRows = await ctx.db
    .query("cartItems")
    .withIndex("by_cartId", (q) => q.eq("cartId", cartId))
    .collect();

  const lines: CartLine[] = [];
  for (const item of itemRows) {
    const product = await ctx.db
      .query("products")
      .withIndex("by_externalId", (q) => q.eq("id", item.productId))
      .first();
    if (!product) continue;
    lines.push({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      name: product.parentProductName,
      variantName: product.variantName ?? null,
      slug: product.slug,
      price: product.price,
      image: await getProductImageUrl(ctx, product),
      inventory: product.inventory,
      isActive: product.isActive,
    });
  }

  return {
    id: cartRow.id,
    email: cartRow.email,
    phone: cartRow.phone,
    name: cartRow.name,
    status: cartRow.status as CartStatus,
    notes: cartRow.notes ?? null,
    createdAt: cartRow.createdAt,
    updatedAt: cartRow.updatedAt,
    lastActiveAt: cartRow.lastActiveAt,
    items: lines,
    subtotal: subtotalOf(lines),
    itemCount: itemCountOf(lines),
  };
}

export const getCartWithItems = query({
  args: { cartId: v.string(), accessToken: v.string() },
  handler: async (ctx, args) => {
    await requireCartAccess(ctx, args.cartId, args.accessToken);
    return buildCartWithItems(ctx, args.cartId);
  },
});

export const getCartWithItemsForAdmin = query({
  args: { cartId: v.string(), adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    return buildCartWithItems(ctx, args.cartId);
  },
});

export const findCartByEmail = query({
  args: { email: v.string(), adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const normalized = normalizeEmail(args.email);
    return ctx.db
      .query("carts")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
  },
});

export const getCartItemQuantity = query({
  args: { cartId: v.string(), productId: v.string(), accessToken: v.string() },
  handler: async (ctx, args) => {
    await requireCartAccess(ctx, args.cartId, args.accessToken);
    const row = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId_productId", (q) =>
        q.eq("cartId", args.cartId).eq("productId", args.productId),
      )
      .first();
    return row?.quantity ?? 0;
  },
});

export const createCart = mutation({
  args: {
    email: v.string(),
    phone: v.string(),
    name: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    await ctx.db.insert("carts", {
      id,
      accessTokenHash: await hashCartAccessToken(args.accessToken),
      email: normalizeEmail(args.email),
      phone: normalizePhone(args.phone),
      name: args.name.trim(),
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    });
    return id;
  },
});

async function touchCart(ctx: MutationCtx, cartId: string) {
  const cart = await getCartById(ctx, cartId);
  if (!cart) return;
  const now = Date.now();
  await ctx.db.patch(cart._id, { updatedAt: now, lastActiveAt: now });
}

export const upsertCartItem = mutation({
  args: { cartId: v.string(), productId: v.string(), quantity: v.number(), accessToken: v.string() },
  handler: async (ctx, args) => {
    await requireCartAccess(ctx, args.cartId, args.accessToken);
    if (args.quantity <= 0) return;
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId_productId", (q) =>
        q.eq("cartId", args.cartId).eq("productId", args.productId),
      )
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("cartItems", {
        id: crypto.randomUUID(),
        cartId: args.cartId,
        productId: args.productId,
        quantity: args.quantity,
        createdAt: now,
        updatedAt: now,
      });
    }
    await touchCart(ctx, args.cartId);
  },
});

export const setCartItemQuantity = mutation({
  args: { cartId: v.string(), productId: v.string(), quantity: v.number(), accessToken: v.string() },
  handler: async (ctx, args) => {
    await requireCartAccess(ctx, args.cartId, args.accessToken);
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId_productId", (q) =>
        q.eq("cartId", args.cartId).eq("productId", args.productId),
      )
      .first();
    const now = Date.now();

    if (args.quantity <= 0) {
      if (existing) await ctx.db.delete(existing._id);
      await touchCart(ctx, args.cartId);
      return;
    }

    if (existing) {
      await ctx.db.patch(existing._id, { quantity: args.quantity, updatedAt: now });
    } else {
      await ctx.db.insert("cartItems", {
        id: crypto.randomUUID(),
        cartId: args.cartId,
        productId: args.productId,
        quantity: args.quantity,
        createdAt: now,
        updatedAt: now,
      });
    }
    await touchCart(ctx, args.cartId);
  },
});

export const removeCartItem = mutation({
  args: { cartId: v.string(), productId: v.string(), accessToken: v.string() },
  handler: async (ctx, args) => {
    await requireCartAccess(ctx, args.cartId, args.accessToken);
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId_productId", (q) =>
        q.eq("cartId", args.cartId).eq("productId", args.productId),
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);
    await touchCart(ctx, args.cartId);
  },
});

export const clearCart = mutation({
  args: { cartId: v.string(), accessToken: v.string() },
  handler: async (ctx, args) => {
    await requireCartAccess(ctx, args.cartId, args.accessToken);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId", (q) => q.eq("cartId", args.cartId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await touchCart(ctx, args.cartId);
  },
});

export const mergeCartItems = mutation({
  args: {
    cartId: v.string(),
    accessToken: v.string(),
    incoming: v.array(v.object({ productId: v.string(), quantity: v.number() })),
  },
  handler: async (ctx, args) => {
    await requireCartAccess(ctx, args.cartId, args.accessToken);
    for (const item of args.incoming) {
      if (!item.productId || item.quantity <= 0) continue;
      const existing = await ctx.db
        .query("cartItems")
        .withIndex("by_cartId_productId", (q) =>
          q.eq("cartId", args.cartId).eq("productId", item.productId),
        )
        .first();
      const now = Date.now();
      if (existing) {
        if (item.quantity > existing.quantity) {
          await ctx.db.patch(existing._id, { quantity: item.quantity, updatedAt: now });
        }
      } else {
        await ctx.db.insert("cartItems", {
          id: crypto.randomUUID(),
          cartId: args.cartId,
          productId: item.productId,
          quantity: item.quantity,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    await touchCart(ctx, args.cartId);
  },
});

export const replaceCartItems = mutation({
  args: {
    cartId: v.string(),
    accessToken: v.string(),
    incoming: v.array(v.object({ productId: v.string(), quantity: v.number() })),
  },
  handler: async (ctx, args) => {
    await requireCartAccess(ctx, args.cartId, args.accessToken);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId", (q) => q.eq("cartId", args.cartId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    for (const item of args.incoming) {
      if (!item.productId || item.quantity <= 0) continue;
      const now = Date.now();
      await ctx.db.insert("cartItems", {
        id: crypto.randomUUID(),
        cartId: args.cartId,
        productId: item.productId,
        quantity: item.quantity,
        createdAt: now,
        updatedAt: now,
      });
    }
    await touchCart(ctx, args.cartId);
  },
});

export const deleteCart = mutation({
  args: { cartId: v.string(), adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId", (q) => q.eq("cartId", args.cartId))
      .collect();
    for (const item of items) await ctx.db.delete(item._id);
    const cart = await getCartById(ctx, args.cartId);
    if (cart) await ctx.db.delete(cart._id);
  },
});

export const updateCartStatus = mutation({
  args: { cartId: v.string(), status: v.string(), adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    if (!isValidCartStatus(args.status)) {
      throw new Error(`Invalid cart status: ${args.status}`);
    }
    const cart = await getCartById(ctx, args.cartId);
    if (!cart) return;
    await ctx.db.patch(cart._id, { status: args.status, updatedAt: Date.now() });
  },
});

export const updateCartNotes = mutation({
  args: { cartId: v.string(), notes: v.string(), adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const cart = await getCartById(ctx, args.cartId);
    if (!cart) return;
    await ctx.db.patch(cart._id, {
      notes: args.notes.trim() || undefined,
      updatedAt: Date.now(),
    });
  },
});

export const adminClearCart = mutation({
  args: { cartId: v.string(), adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_cartId", (q) => q.eq("cartId", args.cartId))
      .collect();
    for (const item of items) await ctx.db.delete(item._id);
    const cart = await getCartById(ctx, args.cartId);
    if (cart) {
      const now = Date.now();
      await ctx.db.patch(cart._id, { updatedAt: now, lastActiveAt: now });
    }
  },
});

export const listAdminCarts = query({
  args: {
    adminSecret: v.string(),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    let cartRows = await ctx.db.query("carts").collect();

    if (args.status) {
      cartRows = cartRows.filter((c) => c.status === args.status);
    }

    const search = args.search?.trim().toLowerCase();
    if (search) {
      cartRows = cartRows.filter(
        (c) => c.email.includes(search) || c.name.toLowerCase().includes(search),
      );
    }

    cartRows.sort((a, b) => b.lastActiveAt - a.lastActiveAt);

    const summaries = [];
    for (const c of cartRows) {
      const items = await ctx.db
        .query("cartItems")
        .withIndex("by_cartId", (q) => q.eq("cartId", c.id))
        .collect();
      let count = 0;
      let subtotal = 0;
      for (const item of items) {
        const product = await ctx.db
          .query("products")
          .withIndex("by_externalId", (q) => q.eq("id", item.productId))
          .first();
        if (!product) continue;
        count += item.quantity;
        subtotal += product.price * item.quantity;
      }
      summaries.push({
        id: c.id,
        email: c.email,
        name: c.name,
        phone: c.phone,
        status: c.status as CartStatus,
        itemCount: count,
        subtotal,
        lastActiveAt: c.lastActiveAt,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
      });
    }
    return summaries;
  },
});

export const getAdminCartStats = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const activeCarts = (await ctx.db.query("carts").collect()).filter((c) => c.status === "active");

    let totalValue = 0;
    for (const cart of activeCarts) {
      const items = await ctx.db
        .query("cartItems")
        .withIndex("by_cartId", (q) => q.eq("cartId", cart.id))
        .collect();
      for (const item of items) {
        const product = await ctx.db
          .query("products")
          .withIndex("by_externalId", (q) => q.eq("id", item.productId))
          .first();
        if (product) totalValue += product.price * item.quantity;
      }
    }

    const now = Date.now();
    const abandonedCount = activeCarts.filter((c) => now - c.lastActiveAt > ABANDONED_THRESHOLD_MS).length;

    return {
      activeCount: activeCarts.length,
      totalValue,
      abandonedCount,
    };
  },
});
