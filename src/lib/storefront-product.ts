import type { StoreVariant } from "../../convex/lib/catalogUtils";

export interface StorefrontCartSource {
  id: string;
  name: string;
  category: string;
  image?: string;
  variants?: StoreVariant[];
}

/**
 * Resolves the sellable variant for an add-to-bag call.
 * Quick view / PDP already set `id` to a variant id; shop cards still use the parent id.
 */
export function resolveSellableCartVariant(
  product: StorefrontCartSource,
): StoreVariant | undefined {
  const variants = product.variants ?? [];
  const selected = variants.find((variant) => variant.id === product.id);
  if (selected) return selected;
  return variants.find((variant) => variant.inStock) ?? variants[0];
}

export function toCartLine(
  product: StorefrontCartSource,
  variant: StoreVariant,
) {
  return {
    id: variant.id,
    name: `${product.name} ${variant.variantName ?? ""}`.trim(),
    price: variant.price,
    image: variant.image ?? product.image,
    category: product.category,
  };
}
