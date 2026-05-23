import { v } from "convex/values";
import { type MutationCtx, type QueryCtx, mutation, query } from "./_generated/server";
import { assertAdminSecret } from "./lib/admin";
import {
  groupAdminProducts,
  groupProducts,
  matchesStoreQuery,
} from "./lib/catalogUtils";

async function getProductById(ctx: QueryCtx | MutationCtx, id: string) {
  return ctx.db
    .query("products")
    .withIndex("by_externalId", (q) => q.eq("id", id))
    .first();
}

async function getProductBySlug(ctx: QueryCtx | MutationCtx, slug: string) {
  return ctx.db
    .query("products")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();
}

export const listStoreProducts = query({
  args: {
    featuredOnly: v.optional(v.boolean()),
    category: v.optional(v.string()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const filtered = rows
      .filter((row) => !args.featuredOnly || row.isFeatured)
      .filter((row) => !args.category || row.category === args.category)
      .filter((row) => matchesStoreQuery(row, args.query));

    filtered.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return groupProducts(filtered);
  },
});

export const getStoreProductBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    rows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const products = groupProducts(rows);
    return products.find((p) => p.slug === args.slug) ?? null;
  },
});

export const getHeroProduct = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    rows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const products = groupProducts(rows);
    return products.find((p) => p.isHero) ?? products.find((p) => p.isFeatured) ?? products[0] ?? null;
  },
});

export const getRelatedStoreProducts = query({
  args: {
    parentProductId: v.string(),
    category: v.string(),
    excludeParentId: v.string(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const related = rows
      .filter(
        (row) =>
          row.parentProductId !== args.excludeParentId &&
          (row.parentProductId === args.parentProductId || row.category === args.category),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder || b.inventory - a.inventory)
      .slice(0, 8);

    return groupProducts(related)
      .filter((p) => p.parentProductId !== args.excludeParentId)
      .slice(0, 4);
  },
});

export const listAdminProducts = query({
  args: { adminSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const rows = await ctx.db.query("products").collect();
    rows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return rows;
  },
});

export const listAdminProductGroups = query({
  args: { adminSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const rows = await ctx.db.query("products").collect();
    rows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return groupAdminProducts(rows);
  },
});

export const getAdminProductGroupBySlug = query({
  args: { slug: v.string(), adminSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const rows = await ctx.db.query("products").collect();
    rows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const groups = groupAdminProducts(rows);
    return groups.find((g) => g.slug === args.slug) ?? null;
  },
});

export const getAdminCatalogStats = query({
  args: { adminSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const rows = await ctx.db
      .query("products")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    return {
      activeVariants: rows.length,
      totalInventory: rows.reduce((sum, r) => sum + r.inventory, 0),
      inventoryValue: rows.reduce((sum, r) => sum + r.inventory * r.price, 0),
    };
  },
});

export const getProductInventory = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    const row = await getProductById(ctx, args.productId);
    if (!row || !row.isActive) return null;
    return row.inventory;
  },
});

export const validateActiveProduct = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    const row = await getProductById(ctx, args.productId);
    return Boolean(row?.isActive);
  },
});

export const getUniqueParentSlug = query({
  args: { baseSlug: v.string(), adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    let candidate = args.baseSlug;
    let counter = 2;
    for (;;) {
      const parentId = candidate.replace(/-/g, "_");
      const existing = await ctx.db
        .query("products")
        .withIndex("by_parentProductId", (q) => q.eq("parentProductId", parentId))
        .first();
      if (!existing) return candidate;
      candidate = `${args.baseSlug}-${counter}`;
      counter += 1;
    }
  },
});

export const getUniqueVariantSlug = query({
  args: { baseSlug: v.string(), excludeProductId: v.optional(v.string()), adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    let candidate = args.baseSlug;
    let counter = 2;
    for (;;) {
      const existing = await getProductBySlug(ctx, candidate);
      if (!existing || existing.id === args.excludeProductId) return candidate;
      candidate = `${args.baseSlug}-${counter}`;
      counter += 1;
    }
  },
});

export const createProduct = mutation({
  args: {
    adminSecret: v.string(),
    product: v.object({
      id: v.string(),
      parentProductId: v.string(),
      parentProductName: v.string(),
      slug: v.string(),
      name: v.string(),
      variantName: v.string(),
      description: v.string(),
      category: v.string(),
      imageUrl: v.optional(v.string()),
      price: v.number(),
      compareAtPrice: v.optional(v.number()),
      inventory: v.number(),
      isFeatured: v.boolean(),
      isActive: v.boolean(),
      sortOrder: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const now = Date.now();
    await ctx.db.insert("products", {
      ...args.product,
      isHero: false,
      createdAt: now,
      updatedAt: now,
    });
    return args.product.id;
  },
});

export const updateProductImageUrl = mutation({
  args: {
    adminSecret: v.string(),
    productId: v.optional(v.string()),
    parentProductId: v.optional(v.string()),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const now = Date.now();
    if (args.productId) {
      const row = await getProductById(ctx, args.productId);
      if (row) {
        await ctx.db.patch(row._id, { imageUrl: args.imageUrl, updatedAt: now });
      }
      return;
    }
    if (args.parentProductId) {
      const variants = await ctx.db
        .query("products")
        .withIndex("by_parentProductId", (q) => q.eq("parentProductId", args.parentProductId!))
        .collect();
      for (const variant of variants) {
        await ctx.db.patch(variant._id, { imageUrl: args.imageUrl, updatedAt: now });
      }
    }
  },
});

export const createVariant = mutation({
  args: {
    adminSecret: v.string(),
    product: v.object({
      id: v.string(),
      parentProductId: v.string(),
      parentProductName: v.string(),
      slug: v.string(),
      name: v.string(),
      variantName: v.string(),
      description: v.string(),
      category: v.string(),
      imageUrl: v.optional(v.string()),
      price: v.number(),
      compareAtPrice: v.optional(v.number()),
      inventory: v.number(),
      isFeatured: v.boolean(),
      isActive: v.boolean(),
      sortOrder: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const now = Date.now();
    await ctx.db.insert("products", {
      ...args.product,
      isHero: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProductGroup = mutation({
  args: {
    adminSecret: v.string(),
    parentProductId: v.string(),
    productName: v.string(),
    description: v.string(),
    category: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const now = Date.now();
    const variants = await ctx.db
      .query("products")
      .withIndex("by_parentProductId", (q) => q.eq("parentProductId", args.parentProductId))
      .collect();

    for (const variant of variants) {
      await ctx.db.patch(variant._id, {
        parentProductName: args.productName,
        name: `${args.productName} ${variant.variantName ?? ""}`.trim(),
        description: args.description,
        category: args.category,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
    }
  },
});

export const updateVariant = mutation({
  args: {
    adminSecret: v.string(),
    productId: v.string(),
    slug: v.string(),
    name: v.string(),
    variantName: v.string(),
    description: v.string(),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    inventory: v.number(),
    sortOrder: v.number(),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const row = await getProductById(ctx, args.productId);
    if (!row) return;
    await ctx.db.patch(row._id, {
      slug: args.slug,
      name: args.name,
      variantName: args.variantName,
      description: args.description,
      category: args.category,
      imageUrl: args.imageUrl,
      price: args.price,
      compareAtPrice: args.compareAtPrice,
      inventory: args.inventory,
      sortOrder: args.sortOrder,
      isActive: args.isActive,
      isFeatured: args.isFeatured,
      updatedAt: Date.now(),
    });
  },
});

export const setHeroProduct = mutation({
  args: { adminSecret: v.string(), parentProductId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const now = Date.now();
    const all = await ctx.db.query("products").collect();
    for (const row of all) {
      await ctx.db.patch(row._id, { isHero: false, updatedAt: now });
    }
    const variants = await ctx.db
      .query("products")
      .withIndex("by_parentProductId", (q) => q.eq("parentProductId", args.parentProductId))
      .collect();
    for (const variant of variants) {
      await ctx.db.patch(variant._id, { isHero: true, updatedAt: now });
    }
  },
});

export const deleteProductGroup = mutation({
  args: { adminSecret: v.string(), parentProductId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const variants = await ctx.db
      .query("products")
      .withIndex("by_parentProductId", (q) => q.eq("parentProductId", args.parentProductId))
      .collect();

    for (const variant of variants) {
      const orderItems = await ctx.db.query("orderItems").collect();
      for (const item of orderItems) {
        if (item.productId === variant.id) {
          await ctx.db.delete(item._id);
        }
      }
      await ctx.db.delete(variant._id);
    }
  },
});

export const deleteVariant = mutation({
  args: { adminSecret: v.string(), productId: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const row = await getProductById(ctx, args.productId);
    if (!row) return { siblingCount: 0 };

    const orderItems = await ctx.db.query("orderItems").collect();
    for (const item of orderItems) {
      if (item.productId === args.productId) {
        await ctx.db.delete(item._id);
      }
    }
    await ctx.db.delete(row._id);

    const siblings = await ctx.db
      .query("products")
      .withIndex("by_parentProductId", (q) => q.eq("parentProductId", row.parentProductId))
      .collect();

    return { siblingCount: siblings.length };
  },
});
