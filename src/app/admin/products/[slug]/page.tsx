import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  createVariantAction,
  deleteProductAction,
  deleteVariantAction,
  setHeroProductAction,
  updateProductAction,
  updateVariantAction,
  uploadProductImageAction,
  uploadVariantImageAction,
} from '../../actions';
import { logoutAction } from '../../auth-actions';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminProductGroupBySlug } from '@/lib/catalog';
import AdminHeader from '@/components/AdminHeader';
import AdminFieldLabel from '@/components/admin/AdminFieldLabel';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';

export const dynamic = 'force-dynamic';

const inputClass =
  'w-full border border-foreground bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-pink-dark';
const compactInputClass =
  'w-full min-w-0 border border-foreground bg-transparent px-2 py-1.5 text-sm text-foreground outline-none focus:border-pink-dark';
const fileInputClass =
  'w-full cursor-pointer border border-foreground bg-white px-3 py-2.5 text-xs text-muted outline-none file:mr-3 file:cursor-pointer file:border file:border-foreground file:bg-foreground file:px-3 file:py-1.5 file:text-[9px] file:font-bold file:uppercase file:tracking-[0.12em] file:text-background hover:file:bg-pink-dark focus:border-pink-dark';
const adminBtnSm =
  'inline-flex items-center justify-center border border-foreground px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors';

/** Grid columns for variant rows (photo + 6 edit columns). */
const variantRowGrid =
  'grid-cols-[88px_minmax(200px,1fr)_100px_88px_72px_120px_140px]';
const variantEditGrid = 'grid-cols-[minmax(200px,1fr)_100px_88px_72px_120px_140px]';

interface AdminProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminProductPage({ params }: AdminProductPageProps) {
  await requireAdmin();

  const resolvedParams = await params;
  const product = await getAdminProductGroupBySlug(resolvedParams.slug);

  if (!product) notFound();

  const activeCount = product.variants.filter((v) => v.isActive).length;
  const outOfStockCount = product.variants.filter((v) => v.inventory === 0).length;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <AdminHeader logoutAction={logoutAction} productName={product.name} />

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10 sm:px-12 lg:px-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin#products"
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
          >
            ← Back to catalog
          </Link>
          <Link
            href={`/products/${product.slug}`}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-dark transition-colors hover:text-foreground"
          >
            View on storefront ↗
          </Link>
        </div>

        <header className="space-y-4 border border-foreground bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {product.category ? (
              <span className="border border-foreground px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-muted">
                {product.category}
              </span>
            ) : null}
            {product.isHero ? (
              <span className="border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-pink-dark">
                Homepage hero
              </span>
            ) : null}
          </div>
          <h1 className="font-display text-4xl tracking-tighter text-foreground sm:text-5xl">{product.name}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            {product.variantCount} variant{product.variantCount !== 1 ? 's' : ''} · {activeCount} live on shop ·{' '}
            {product.totalInventory} units in stock
            {outOfStockCount > 0 ? ` · ${outOfStockCount} sold out` : ''}
          </p>
        </header>

        <section className="border border-foreground bg-white">
          <div className="border-b border-foreground px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Step 1</p>
            <h2 className="mt-2 font-display text-2xl tracking-tighter text-foreground">Product details</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              Name, category, and description apply to every variant. Add a default photo on the right; variant rows are
              below.
            </p>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start">
            <form action={updateProductAction} className="space-y-5 p-6 lg:border-r lg:border-line">
              <input type="hidden" name="parentProductId" value={product.id} />
              <input type="hidden" name="parentSlug" value={product.slug} />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <AdminFieldLabel>Product name</AdminFieldLabel>
                  <input
                    type="text"
                    name="productName"
                    required
                    defaultValue={product.name}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <AdminFieldLabel>Category</AdminFieldLabel>
                  <input type="text" name="category" defaultValue={product.category} className={inputClass} />
                </label>
              </div>

              <label className="block space-y-1.5">
                <AdminFieldLabel hint="Optional. Shown on the shop product page.">
                  Description
                </AdminFieldLabel>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Materials, curl options, who this tray is best for…"
                  defaultValue={product.description}
                  className={`${inputClass} resize-y py-2.5 placeholder:text-muted/50`}
                />
              </label>

              <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-[11px] text-muted">/products/{product.slug}</p>
                <button
                  type="submit"
                  className={`${adminBtnSm} shrink-0 bg-foreground text-white hover:bg-pink-dark hover:border-pink-dark`}
                >
                  Save details
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-0 border-t border-line bg-[#faf9f7] lg:border-t-0">
              <form action={uploadProductImageAction} className="space-y-4 p-6">
                <input type="hidden" name="parentProductId" value={product.id} />
                <input type="hidden" name="parentSlug" value={product.slug} />

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">Default photo</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Used when a variant has no image of its own.
                  </p>
                </div>

                <div className="h-36 w-full overflow-hidden border border-line bg-white">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                      No image
                    </div>
                  )}
                </div>

                <label className="block space-y-1.5">
                  <AdminFieldLabel>Replace image</AdminFieldLabel>
                  <input type="file" name="image" accept="image/*" required className={fileInputClass} />
                </label>

                <button
                  type="submit"
                  className={`${adminBtnSm} w-full bg-white text-foreground hover:bg-foreground hover:text-white`}
                >
                  Upload
                </button>
              </form>

              <div className="border-t border-line px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">Homepage</p>
                <form action={setHeroProductAction} className="mt-3">
                  <input type="hidden" name="parentProductId" value={product.id} />
                  <input type="hidden" name="parentSlug" value={product.slug} />
                  <button
                    type="submit"
                    disabled={product.isHero}
                    className={`${adminBtnSm} w-full ${
                      product.isHero
                        ? 'cursor-default border-pink-dark bg-pink-dark text-white'
                        : 'bg-white text-foreground hover:bg-foreground hover:text-white'
                    }`}
                  >
                    {product.isHero ? 'Current hero' : 'Set as hero'}
                  </button>
                  {!product.isHero ? (
                    <p className="mt-2 text-[10px] leading-relaxed text-muted">Shows on your homepage feature slot</p>
                  ) : null}
                </form>
              </div>

              <div className="border-t border-red-200 bg-red-50/40 px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-600">Delete product</p>
                <form action={deleteProductAction} className="mt-3">
                  <input type="hidden" name="parentProductId" value={product.id} />
                  <input type="hidden" name="parentSlug" value={product.slug} />
                  <ConfirmSubmitButton
                    message={`Delete "${product.name}" and all ${product.variantCount} variant(s)? This cannot be undone.`}
                    formAction={deleteProductAction}
                    className={`${adminBtnSm} w-full border-red-300 bg-white text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white`}
                  >
                    Delete product
                  </ConfirmSubmitButton>
                  <p className="mt-2 text-[10px] leading-relaxed text-muted">Removes all variants permanently</p>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2 border-b border-foreground pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Step 2</p>
              <h2 className="mt-2 font-display text-3xl tracking-tighter text-foreground sm:text-4xl">Variants</h2>
              <p className="mt-1 max-w-xl text-sm text-muted">
                Each row is one option shoppers can add to cart. Edit the row, then click Save.
              </p>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              {product.variantCount} option{product.variantCount !== 1 ? 's' : ''}
            </p>
          </div>

          {product.variants.length === 0 ? (
            <div className="border border-dashed border-foreground bg-white px-10 py-16 text-center">
              <p className="font-display text-2xl text-foreground">No variants yet</p>
              <p className="mt-2 text-sm text-muted">Add your first sellable option using the form below.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-foreground bg-white">
              <div className="min-w-[880px] text-left text-sm text-foreground">
                <div
                  className={`grid ${variantRowGrid} border-b border-foreground bg-[#faf9f7] text-[10px] font-bold uppercase tracking-[0.3em] text-muted`}
                >
                  <div className="px-4 py-4">Photo</div>
                  <div className="px-4 py-4">Variant name</div>
                  <div className="px-4 py-4">Price</div>
                  <div className="px-4 py-4">Stock</div>
                  <div className="px-4 py-4">Order</div>
                  <div className="px-4 py-4">Visibility</div>
                  <div className="px-4 py-4 text-right">Actions</div>
                </div>

                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`grid ${variantRowGrid} items-start border-t border-line hover:bg-[#faf9f7]/60`}
                  >
                    <div className="px-4 py-4">
                      <form action={uploadVariantImageAction} className="flex flex-col items-start gap-2">
                        <input type="hidden" name="productId" value={variant.id} />
                        <input type="hidden" name="slug" value={variant.slug} />
                        <input type="hidden" name="parentProductId" value={product.id} />
                        <input type="hidden" name="parentSlug" value={product.slug} />
                        <div className="h-14 w-14 shrink-0 overflow-hidden border border-line bg-[#f5f3f0]">
                          {variant.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={variant.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[9px] font-bold uppercase tracking-widest text-muted">
                              None
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          required
                          className="max-w-[120px] text-[10px] text-muted file:mr-1 file:border-0 file:bg-foreground file:px-1.5 file:py-0.5 file:text-[8px] file:font-bold file:uppercase file:text-background"
                        />
                        <button
                          type="submit"
                          className="text-[9px] font-bold uppercase tracking-widest text-pink-dark hover:underline"
                        >
                          Upload
                        </button>
                      </form>
                    </div>

                    <form
                      action={updateVariantAction}
                      className={`col-span-6 grid ${variantEditGrid} items-start`}
                    >
                      <div className="hidden">
                        <input type="hidden" name="productId" value={variant.id} />
                        <input type="hidden" name="slug" value={variant.slug} />
                        <input type="hidden" name="parentProductId" value={product.id} />
                        <input type="hidden" name="parentSlug" value={product.slug} />
                        <input type="hidden" name="parentProductName" value={product.name} />
                        <input type="hidden" name="description" value={variant.description ?? ''} />
                        <input type="hidden" name="category" value={variant.category} />
                      </div>

                      <div className="px-4 py-4">
                        <input
                          type="text"
                          name="variantName"
                          required
                          defaultValue={variant.variantName ?? ''}
                          className={compactInputClass}
                        />
                        <div className="mt-2 flex flex-wrap gap-1">
                          {!variant.isActive ? (
                            <span className="border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-slate-600">
                              Hidden
                            </span>
                          ) : null}
                          {variant.isFeatured ? (
                            <span className="border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-pink-dark">
                              Featured
                            </span>
                          ) : null}
                          {variant.inventory === 0 ? (
                            <span className="border border-red-200 bg-red-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-red-600">
                              Sold out
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="px-4 py-4">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">
                            $
                          </span>
                          <input
                            type="number"
                            name="price"
                            step="0.01"
                            min="0"
                            defaultValue={(variant.price / 100).toFixed(2)}
                            className={`${compactInputClass} pl-5`}
                          />
                        </div>
                      </div>
                      <div className="px-4 py-4">
                        <input
                          type="number"
                          name="inventory"
                          min="0"
                          defaultValue={variant.inventory}
                          className={compactInputClass}
                        />
                      </div>
                      <div className="px-4 py-4">
                        <input
                          type="number"
                          name="sortOrder"
                          defaultValue={variant.sortOrder}
                          className={`${compactInputClass} w-14`}
                        />
                      </div>
                      <div className="px-4 py-4">
                        <div className="space-y-2">
                          <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground">
                            <input
                              type="checkbox"
                              name="isActive"
                              defaultChecked={variant.isActive}
                              className="h-3.5 w-3.5 accent-foreground"
                            />
                            Live
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground">
                            <input
                              type="checkbox"
                              name="isFeatured"
                              defaultChecked={variant.isFeatured}
                              className="h-3.5 w-3.5 accent-foreground"
                            />
                            Featured
                          </label>
                        </div>
                      </div>
                      <div className="px-4 py-4">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="submit"
                            className="border border-foreground bg-foreground px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-transparent hover:text-foreground"
                          >
                            Save
                          </button>
                          <ConfirmSubmitButton
                            message={`Delete variant "${variant.variantName ?? variant.name}"?`}
                            formAction={deleteVariantAction}
                            className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:underline"
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </div>
                      </div>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="border border-foreground bg-white">
          <div className="border-b border-foreground px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Add variant</p>
            <h3 className="mt-2 font-display text-2xl tracking-tighter text-foreground">New sellable option</h3>
            <p className="mt-1.5 text-xs text-muted">
              Use the professional name shoppers recognize, for example CC Curl 0.03 10 to 15mm.
            </p>
          </div>

          <form action={createVariantAction} className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <input type="hidden" name="parentProductId" value={product.id} />
            <input type="hidden" name="parentProductName" value={product.name} />
            <input type="hidden" name="parentSlug" value={product.slug} />
            <input type="hidden" name="description" value={product.description} />
            <input type="hidden" name="category" value={product.category} />

            <label className="block space-y-1.5 lg:col-span-2">
              <AdminFieldLabel hint="Required">Variant name</AdminFieldLabel>
              <input
                type="text"
                name="variantName"
                required
                placeholder="e.g. CC Curl 0.03 10-15mm"
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5">
              <AdminFieldLabel>Price</AdminFieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <AdminFieldLabel>Starting stock</AdminFieldLabel>
              <input
                type="number"
                name="inventory"
                min="0"
                defaultValue="0"
                required
                className={inputClass}
              />
            </label>

            <div className="flex flex-wrap items-center gap-6 md:col-span-2 lg:col-span-3">
              <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground">
                <input type="checkbox" name="isActive" defaultChecked className="h-3.5 w-3.5 accent-foreground" />
                Show on storefront
              </label>
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                <span>Sort order</span>
                <input
                  type="number"
                  name="sortOrder"
                  defaultValue={product.variantCount}
                  className="w-14 border border-foreground bg-transparent px-2 py-1 text-center text-sm text-foreground outline-none focus:border-pink-dark"
                />
              </label>
            </div>

            <button type="submit" className="btn-primary w-full lg:w-auto">
              Add variant
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
