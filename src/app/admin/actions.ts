'use server';

import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { requireAdmin } from '@/lib/admin-auth';
import { adminClearCart, deleteCart, updateCartNotes, updateCartStatus } from '@/lib/cart';
import { CART_STATUSES, type CartStatus } from '@/lib/cart-constants';
import { getAdminSecret } from '@/lib/convex';
import { updateOrder } from '@/lib/orders';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parentIdFromSlug(slug: string) {
  return slug.replace(/-/g, '_');
}

async function getUniqueParentSlug(baseSlug: string) {
  return fetchQuery(api.products.getUniqueParentSlug, {
    baseSlug,
    adminSecret: getAdminSecret(),
  });
}

async function getUniqueVariantSlug(baseSlug: string, excludeProductId?: string) {
  return fetchQuery(api.products.getUniqueVariantSlug, {
    baseSlug,
    excludeProductId,
    adminSecret: getAdminSecret(),
  });
}

function toCents(value: FormDataEntryValue | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function toNullableCents(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return null;
  const amount = Number(rawValue);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : null;
}

function toInventoryCount(value: FormDataEntryValue | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
}

function toSortOrder(value: FormDataEntryValue | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.floor(amount) : 0;
}

function getBooleanField(formData: FormData, key: string) {
  return formData.get(key) === 'on';
}

async function uploadImageFile(file: File, adminSecret: string): Promise<Id<'_storage'>> {
  const uploadUrl = await fetchMutation(api.products.generateProductImageUploadUrl, {
    adminSecret,
  });
  const result = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!result.ok) {
    throw new Error(`Convex image upload failed with status ${result.status}`);
  }

  const body = (await result.json()) as { storageId: Id<'_storage'> };
  return body.storageId;
}

function revalidateCatalogPaths(parentSlug: string, variantSlug?: string, previousVariantSlug?: string) {
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/admin');
  revalidatePath(`/admin/products/${parentSlug}`);
  revalidatePath(`/products/${parentSlug}`);
  if (variantSlug) revalidatePath(`/products/${variantSlug}`);
  if (previousVariantSlug && previousVariantSlug !== variantSlug) {
    revalidatePath(`/products/${previousVariantSlug}`);
  }
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const adminSecret = getAdminSecret();

  const productName = String(formData.get('productName') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? 'Lashes').trim() || 'Lashes';
  const imageUrl = String(formData.get('imageUrl') ?? '').trim();
  const initialVariantName = String(formData.get('initialVariantName') ?? '').trim();
  const price = toCents(formData.get('price'));
  const compareAtPrice = toNullableCents(formData.get('compareAtPrice'));
  const inventory = toInventoryCount(formData.get('inventory'));
  const isFeatured = getBooleanField(formData, 'isFeatured');
  const isActive = getBooleanField(formData, 'isActive');

  if (!productName || !initialVariantName) redirect('/admin');

  const parentSlug = await getUniqueParentSlug(slugify(productName));
  const variantSlug = await getUniqueVariantSlug(`${parentSlug}-${slugify(initialVariantName)}`);
  const newProductId = crypto.randomUUID();
  const parentProductId = parentIdFromSlug(parentSlug);

  let finalImageUrl = imageUrl || undefined;
  let imageStorageId: Id<'_storage'> | undefined;
  const upload = formData.get('image') as File | null;
  const isValidFile = upload && typeof upload === 'object' && 'size' in upload && 'name' in upload;

  if (isValidFile && upload.size > 0 && upload.type.startsWith('image/')) {
    imageStorageId = await uploadImageFile(upload, adminSecret);
    finalImageUrl = undefined;
  }

  await fetchMutation(api.products.createProduct, {
    adminSecret,
    product: {
      id: newProductId,
      parentProductId,
      parentProductName: productName,
      slug: variantSlug,
      name: `${productName} ${initialVariantName}`.trim(),
      variantName: initialVariantName,
      description,
      category,
      imageStorageId,
      imageUrl: finalImageUrl,
      price,
      compareAtPrice: compareAtPrice ?? undefined,
      inventory,
      isFeatured,
      isActive,
      sortOrder: 0,
    },
  });

  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/admin');
  redirect(`/admin/products/${parentSlug}`);
}

export async function createVariantAction(formData: FormData) {
  await requireAdmin();
  const adminSecret = getAdminSecret();

  const parentProductId = String(formData.get('parentProductId') ?? '').trim();
  const parentProductName = String(formData.get('parentProductName') ?? '').trim();
  const parentSlug = String(formData.get('parentSlug') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? 'Lashes').trim() || 'Lashes';
  const imageUrl = String(formData.get('imageUrl') ?? '').trim();
  const variantName = String(formData.get('variantName') ?? '').trim();
  const price = toCents(formData.get('price'));
  const compareAtPrice = toNullableCents(formData.get('compareAtPrice'));
  const inventory = toInventoryCount(formData.get('inventory'));
  const sortOrderValue = String(formData.get('sortOrder') ?? '').trim();
  const isFeatured = getBooleanField(formData, 'isFeatured');
  const isActive = getBooleanField(formData, 'isActive');

  if (!parentProductId || !parentProductName || !parentSlug || !variantName) return;

  const groups = await fetchQuery(api.products.listAdminProductGroups, { adminSecret });
  const group = groups.find((g) => g.id === parentProductId);
  const lastSort = group?.variants.at(-1)?.sortOrder ?? -1;
  const variantSlug = await getUniqueVariantSlug(`${parentSlug}-${slugify(variantName)}`);

  await fetchMutation(api.products.createVariant, {
    adminSecret,
    product: {
      id: crypto.randomUUID(),
      parentProductId,
      parentProductName,
      slug: variantSlug,
      name: `${parentProductName} ${variantName}`.trim(),
      variantName,
      description,
      category,
      imageUrl: imageUrl || undefined,
      price,
      compareAtPrice: compareAtPrice ?? undefined,
      inventory,
      isFeatured,
      isActive,
      sortOrder: sortOrderValue ? toSortOrder(sortOrderValue) : lastSort + 1,
    },
  });

  revalidateCatalogPaths(parentSlug, variantSlug);
  redirect(`/admin/products/${parentSlug}`);
}

export async function uploadProductImageAction(formData: FormData) {
  await requireAdmin();
  const adminSecret = getAdminSecret();

  const parentProductId = String(formData.get('parentProductId') ?? '').trim();
  const parentSlug = String(formData.get('parentSlug') ?? '').trim();
  const upload = formData.get('image') as File | null;
  const isValidFile = upload && typeof upload === 'object' && 'size' in upload && 'name' in upload;

  if (!parentProductId || !parentSlug || !isValidFile || upload.size === 0) {
    redirect(`/admin/products/${parentSlug || ''}`);
  }
  if (!upload.type.startsWith('image/')) redirect(`/admin/products/${parentSlug}`);

  const imageStorageId = await uploadImageFile(upload, adminSecret);

  await fetchMutation(api.products.updateProductImageStorageId, {
    adminSecret,
    parentProductId,
    imageStorageId,
  });

  revalidateCatalogPaths(parentSlug);
  redirect(`/admin/products/${parentSlug}`);
}

export async function uploadVariantImageAction(formData: FormData) {
  await requireAdmin();
  const adminSecret = getAdminSecret();

  const productId = String(formData.get('productId') ?? '').trim();
  const parentSlug = String(formData.get('parentSlug') ?? '').trim();
  const variantSlug = String(formData.get('slug') ?? '').trim();
  const upload = formData.get('image') as File | null;
  const isValidFile = upload && typeof upload === 'object' && 'size' in upload && 'name' in upload;

  if (!productId || !parentSlug || !variantSlug || !isValidFile || upload.size === 0) {
    redirect(`/admin/products/${parentSlug || ''}`);
  }
  if (!upload.type.startsWith('image/')) redirect(`/admin/products/${parentSlug}`);

  const imageStorageId = await uploadImageFile(upload, adminSecret);

  await fetchMutation(api.products.updateProductImageStorageId, {
    adminSecret,
    productId,
    imageStorageId,
  });

  revalidateCatalogPaths(parentSlug, variantSlug);
  redirect(`/admin/products/${parentSlug}`);
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const adminSecret = getAdminSecret();

  const parentSlug = String(formData.get('parentSlug') ?? '');
  const parentProductId = String(formData.get('parentProductId') ?? '');
  const productName = String(formData.get('productName') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? 'Lashes').trim() || 'Lashes';

  if (!parentSlug || !parentProductId || !productName) return;

  await fetchMutation(api.products.updateProductGroup, {
    adminSecret,
    parentProductId,
    productName,
    description,
    category,
  });

  revalidateCatalogPaths(parentSlug);
  redirect(`/admin/products/${parentSlug}`);
}

export async function updateVariantAction(formData: FormData) {
  await requireAdmin();
  const adminSecret = getAdminSecret();

  const productId = String(formData.get('productId') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const parentSlug = String(formData.get('parentSlug') ?? '').trim();
  const parentProductName = String(formData.get('parentProductName') ?? '').trim();
  const variantName = String(formData.get('variantName') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? 'Lashes').trim() || 'Lashes';
  const price = toCents(formData.get('price'));
  const compareAtPrice = toNullableCents(formData.get('compareAtPrice'));
  const inventory = toInventoryCount(formData.get('inventory'));
  const sortOrder = toSortOrder(formData.get('sortOrder'));
  const isActive = getBooleanField(formData, 'isActive');
  const isFeatured = getBooleanField(formData, 'isFeatured');

  if (!productId || !parentSlug || !parentProductName || !variantName) return;

  const variantSlug = await getUniqueVariantSlug(`${parentSlug}-${slugify(variantName)}`, productId);

  await fetchMutation(api.products.updateVariant, {
    adminSecret,
    productId,
    slug: variantSlug,
    name: `${parentProductName} ${variantName}`.trim(),
    variantName,
    description,
    category,
    price,
    compareAtPrice: compareAtPrice ?? undefined,
    inventory,
    sortOrder,
    isActive,
    isFeatured,
  });

  revalidateCatalogPaths(parentSlug, variantSlug, slug);
  redirect(`/admin/products/${parentSlug}`);
}

export async function setHeroProductAction(formData: FormData) {
  await requireAdmin();
  const parentProductId = String(formData.get('parentProductId') ?? '').trim();
  const parentSlug = String(formData.get('parentSlug') ?? '').trim();
  if (!parentProductId || !parentSlug) return;

  await fetchMutation(api.products.setHeroProduct, {
    adminSecret: getAdminSecret(),
    parentProductId,
  });

  revalidateCatalogPaths(parentSlug);
  redirect(`/admin/products/${parentSlug}`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const parentProductId = String(formData.get('parentProductId') ?? '').trim();
  const parentSlug = String(formData.get('parentSlug') ?? '').trim();
  if (!parentProductId || !parentSlug) return;

  const groups = await fetchQuery(api.products.listAdminProductGroups, {
    adminSecret: getAdminSecret(),
  });
  const group = groups.find((g) => g.id === parentProductId);
  const variants = group?.variants ?? [];

  await fetchMutation(api.products.deleteProductGroup, {
    adminSecret: getAdminSecret(),
    parentProductId,
  });

  revalidateCatalogPaths(parentSlug);
  for (const variant of variants) {
    revalidatePath(`/products/${variant.slug}`);
  }
  redirect('/admin');
}

export async function deleteVariantAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get('productId') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const parentProductId = String(formData.get('parentProductId') ?? '').trim();
  const parentSlug = String(formData.get('parentSlug') ?? '').trim();
  if (!productId || !parentProductId || !parentSlug) return;

  const result = await fetchMutation(api.products.deleteVariant, {
    adminSecret: getAdminSecret(),
    productId,
  });

  if (result.siblingCount <= 1) {
    revalidateCatalogPaths(parentSlug, undefined, slug);
    redirect('/admin');
  }

  revalidateCatalogPaths(parentSlug, undefined, slug);
  redirect(`/admin/products/${parentSlug}`);
}

export async function updateOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get('orderId') ?? '');
  const status = String(formData.get('status') ?? 'pending');
  const fulfillmentStatus = String(formData.get('fulfillmentStatus') ?? 'unfulfilled');
  if (!orderId) return;

  await updateOrder({ orderId, status, fulfillmentStatus });
  revalidatePath('/admin');
}

export async function adminClearCartAction(formData: FormData) {
  await requireAdmin();
  const cartId = String(formData.get('cartId') ?? '');
  if (!cartId) return;
  await adminClearCart(cartId);
  revalidatePath('/admin/carts');
  revalidatePath(`/admin/carts/${cartId}`);
}

export async function adminDeleteCartAction(formData: FormData) {
  await requireAdmin();
  const cartId = String(formData.get('cartId') ?? '');
  if (!cartId) return;
  await deleteCart(cartId);
  revalidatePath('/admin');
  revalidatePath('/admin/carts');
  redirect('/admin/carts');
}

export async function adminUpdateCartStatusAction(formData: FormData) {
  await requireAdmin();
  const cartId = String(formData.get('cartId') ?? '');
  const status = String(formData.get('status') ?? '') as CartStatus;
  if (!cartId || !CART_STATUSES.includes(status)) return;
  await updateCartStatus(cartId, status);
  revalidatePath('/admin/carts');
  revalidatePath(`/admin/carts/${cartId}`);
}

export async function adminUpdateCartNotesAction(formData: FormData) {
  await requireAdmin();
  const cartId = String(formData.get('cartId') ?? '');
  const notes = String(formData.get('notes') ?? '').trim();
  if (!cartId) return;
  await updateCartNotes(cartId, notes);
  revalidatePath(`/admin/carts/${cartId}`);
}
