import "server-only";

import { fetchQuery } from "convex/nextjs";

import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { getAdminSecret } from "./convex";
import { centsToDollars } from "./money";

export type { StoreProduct, StoreVariant } from "../../convex/lib/catalogUtils";

export type AdminProductVariant = Doc<"products">;

export interface AdminProductGalleryImage {
  id: Id<"productImages">;
  imageUrl: string | null;
  sortOrder: number;
}

export interface AdminProductGroup {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  image?: string;
  variantCount: number;
  totalInventory: number;
  isFeatured: boolean;
  isHero: boolean;
  hasActiveVariant: boolean;
  variants: AdminProductVariant[];
  galleryImages?: AdminProductGalleryImage[];
}

export async function listStoreProducts(options?: {
  featuredOnly?: boolean;
  category?: string;
  query?: string;
}) {
  return fetchQuery(api.products.listStoreProducts, {
    featuredOnly: options?.featuredOnly,
    category: options?.category,
    query: options?.query,
  });
}

export async function getStoreProductBySlug(slug: string) {
  return fetchQuery(api.products.getStoreProductBySlug, { slug });
}

export async function getHeroProduct() {
  return fetchQuery(api.products.getHeroProduct, {});
}

export async function getRelatedStoreProducts(product: {
  parentProductId: string;
  category: string;
  id: string;
}) {
  return fetchQuery(api.products.getRelatedStoreProducts, {
    parentProductId: product.parentProductId,
    category: product.category,
    excludeParentId: product.id,
  });
}

export async function listAdminProducts() {
  return fetchQuery(api.products.listAdminProducts, { adminSecret: getAdminSecret() });
}

export async function listAdminProductGroups(): Promise<AdminProductGroup[]> {
  return fetchQuery(api.products.listAdminProductGroups, { adminSecret: getAdminSecret() });
}

export async function getAdminProductGroupBySlug(slug: string) {
  return fetchQuery(api.products.getAdminProductGroupBySlug, {
    slug,
    adminSecret: getAdminSecret(),
  });
}

export async function getAdminCatalogStats() {
  return fetchQuery(api.products.getAdminCatalogStats, { adminSecret: getAdminSecret() });
}

/** Re-export for admin forms that still convert cents in the UI layer. */
export { centsToDollars };
