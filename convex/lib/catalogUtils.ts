import type { Doc } from "../_generated/dataModel";

export type ProductDoc = Doc<"products">;

export function toParentSlug(parentProductId: string): string {
  return parentProductId.replace(/_/g, "-");
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export interface StoreVariant {
  id: string;
  slug: string;
  name: string;
  variantName?: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  inStock: boolean;
  image?: string;
}

export interface StoreProduct {
  id: string;
  parentProductId: string;
  parentProductName: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  inStock: boolean;
  image?: string;
  images: string[];
  isFeatured: boolean;
  isHero: boolean;
  sortOrder: number;
  rating: number;
  reviewCount: number;
  features: string[];
  variants: StoreVariant[];
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
  variants: ProductDoc[];
}

function normalizeVariant(row: ProductDoc): StoreVariant {
  const inventory = row.inventory ?? 0;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    variantName: row.variantName,
    price: centsToDollars(row.price),
    compareAtPrice: row.compareAtPrice ? centsToDollars(row.compareAtPrice) : undefined,
    inventory,
    inStock: inventory > 0,
    image: row.imageUrl,
  };
}

export function groupProducts(
  rows: ProductDoc[],
  galleryImagesByProductId: Record<string, string[]> = {},
): StoreProduct[] {
  const grouped = new Map<string, ProductDoc[]>();

  for (const row of rows) {
    const existing = grouped.get(row.parentProductId);
    if (existing) {
      existing.push(row);
      continue;
    }
    grouped.set(row.parentProductId, [row]);
  }

  return Array.from(grouped.values()).map((groupRows) => {
    const sortedRows = [...groupRows].sort((a, b) => a.sortOrder - b.sortOrder);
    const primaryRow = sortedRows[0];
    const variants = sortedRows.map(normalizeVariant);
    const prices = variants.map((variant) => variant.price);
    const compareAtPrices = variants
      .map((variant) => variant.compareAtPrice)
      .filter((value): value is number => value !== undefined);
    const inventories = variants.map((variant) => variant.inventory);
    const activeImages = sortedRows
      .map((row) => row.imageUrl)
      .filter((value): value is string => Boolean(value));
    const images = Array.from(new Set([
      ...(galleryImagesByProductId[primaryRow.parentProductId] ?? []),
      ...activeImages,
    ]));

    return {
      id: primaryRow.parentProductId,
      parentProductId: primaryRow.parentProductId,
      parentProductName: primaryRow.parentProductName,
      slug: toParentSlug(primaryRow.parentProductId),
      name: primaryRow.parentProductName,
      description: primaryRow.description ?? "",
      category: primaryRow.category,
      price: Math.min(...prices),
      compareAtPrice: compareAtPrices.length > 0 ? Math.max(...compareAtPrices) : undefined,
      inventory: inventories.reduce((sum, inventory) => sum + inventory, 0),
      inStock: variants.some((variant) => variant.inStock),
      image: images[0],
      images,
      isFeatured: sortedRows.some((row) => row.isFeatured),
      isHero: sortedRows.some((row) => row.isHero),
      sortOrder: primaryRow.sortOrder,
      rating: 5,
      reviewCount: 0,
      features: [
        "Salon-curated lash trays",
        "Real-time stock — what you see is what we have",
        "Choose your exact size and curl on the product page",
      ],
      variants,
    };
  });
}

export function groupAdminProducts(rows: ProductDoc[]): AdminProductGroup[] {
  const grouped = new Map<string, ProductDoc[]>();

  for (const row of rows) {
    const existing = grouped.get(row.parentProductId);
    if (existing) {
      existing.push(row);
      continue;
    }
    grouped.set(row.parentProductId, [row]);
  }

  return Array.from(grouped.values()).map((groupRows) => {
    const sortedRows = [...groupRows].sort((a, b) => a.sortOrder - b.sortOrder);
    const primaryRow = sortedRows[0];

    return {
      id: primaryRow.parentProductId,
      slug: toParentSlug(primaryRow.parentProductId),
      name: primaryRow.parentProductName,
      category: primaryRow.category,
      description: primaryRow.description ?? "",
      image: primaryRow.imageUrl,
      variantCount: sortedRows.length,
      totalInventory: sortedRows.reduce((sum, row) => sum + row.inventory, 0),
      isFeatured: sortedRows.some((row) => row.isFeatured),
      isHero: sortedRows.some((row) => row.isHero),
      hasActiveVariant: sortedRows.some((row) => row.isActive),
      variants: sortedRows,
    };
  });
}

export function matchesStoreQuery(row: ProductDoc, query?: string): boolean {
  if (!query?.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    row.name.toLowerCase().includes(q) ||
    row.parentProductName.toLowerCase().includes(q) ||
    row.category.toLowerCase().includes(q)
  );
}
