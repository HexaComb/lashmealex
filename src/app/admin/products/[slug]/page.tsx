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
import { formatUsdFromCents } from '@/lib/money';
import { getAdminProductGroupBySlug } from '@/lib/catalog';
import AdminHeader from '@/components/AdminHeader';

export const dynamic = 'force-dynamic';

function formatDate(value: Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(value);
}

interface AdminProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminProductPage({ params }: AdminProductPageProps) {
  await requireAdmin();

  const resolvedParams = await params;
  const product = await getAdminProductGroupBySlug(resolvedParams.slug);

  if (!product) notFound();

  const inventoryValue = product.variants.reduce((sum, v) => sum + v.inventory * v.price, 0);

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <AdminHeader logoutAction={logoutAction} productName={product.name} />

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10 sm:px-12 lg:px-20">
        {/* Product Hero Header */}
        <div className="border border-foreground bg-white p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {product.category && (
                  <span className="border border-foreground px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-muted">
                    {product.category}
                  </span>
                )}
                {product.isHero && (
                  <span className="border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-pink-dark">
                    ★ Hero Product
                  </span>
                )}
              </div>
              <h1 className="font-display text-5xl tracking-tighter text-foreground">{product.name}</h1>
              {product.description && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{product.description}</p>
              )}
            </div>

            <div className="flex shrink-0 gap-3">
              <div className="border border-foreground bg-[#faf9f7] px-4 py-3 text-center">
                <p className="font-display text-2xl text-foreground">{product.variantCount}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted">Variants</p>
              </div>
              <div className="border border-foreground bg-[#faf9f7] px-4 py-3 text-center">
                <p className="font-display text-2xl text-foreground">{product.totalInventory}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted">In Stock</p>
              </div>
              <div className="border border-foreground bg-[#faf9f7] px-4 py-3 text-center">
                <p className="font-display text-2xl text-foreground">{formatUsdFromCents(inventoryValue)}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted">Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details + Actions */}
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* Product Details Form */}
          <form action={updateProductAction} className="space-y-5 border border-foreground bg-white p-6">
            <input type="hidden" name="parentProductId" value={product.id} />
            <input type="hidden" name="parentSlug" value={product.slug} />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Product Details</p>
              <h2 className="mt-2 font-display text-2xl tracking-tighter text-foreground">Shared Info</h2>
              <p className="mt-1 text-xs text-muted">These details apply to all variations of this product.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Product Name</span>
                <input
                  type="text"
                  name="productName"
                  required
                  defaultValue={product.name}
                  className="w-full border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus:border-pink-dark"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Category</span>
                <input
                  type="text"
                  name="category"
                  defaultValue={product.category}
                  className="w-full border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus:border-pink-dark"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Description</span>
              <textarea
                name="description"
                rows={5}
                defaultValue={product.description}
                className="w-full resize-none border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus:border-pink-dark"
              />
            </label>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[10px] text-muted">/products/{product.slug}</p>
              <button type="submit" className="btn-secondary">Save Details</button>
            </div>
          </form>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            {/* Upload Image */}
            <form action={uploadProductImageAction} className="space-y-4 border border-foreground bg-white p-5">
              <input type="hidden" name="parentProductId" value={product.id} />
              <input type="hidden" name="parentSlug" value={product.slug} />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-dark">Product Image</p>
                <p className="mt-1 text-xs text-muted">Upload an image that applies to all variants</p>
              </div>

              {product.image && (
                <div className="aspect-square w-full overflow-hidden border border-[#e5e2dd] bg-[#f5f3f0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                </div>
              )}

              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Choose File</span>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  required
                  className="w-full border border-foreground bg-transparent px-3 py-2 text-sm text-foreground outline-none file:mr-3 file:border-0 file:bg-foreground file:px-2 file:py-1 file:text-[9px] file:font-bold file:uppercase file:tracking-[0.15em] file:text-background"
                />
              </label>

              <button type="submit" className="btn-secondary w-full">Upload Image</button>
            </form>

            {/* Hero + Delete */}
            <div className="space-y-4 border border-foreground bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-dark">Actions</p>

              <form action={setHeroProductAction}>
                <input type="hidden" name="parentProductId" value={product.id} />
                <input type="hidden" name="parentSlug" value={product.slug} />
                <button
                  type="submit"
                  disabled={product.isHero}
                  className={`w-full border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
                    product.isHero
                      ? 'cursor-default border-pink-dark bg-pink-dark text-white'
                      : 'border-foreground text-foreground hover:bg-foreground hover:text-white'
                  }`}
                >
                  {product.isHero ? '★ Hero Product' : 'Set as Hero'}
                </button>
                {!product.isHero && (
                  <p className="mt-2 text-center text-[10px] text-muted">Highlights this product on your homepage</p>
                )}
              </form>

              <form action={deleteProductAction}>
                <input type="hidden" name="parentProductId" value={product.id} />
                <input type="hidden" name="parentSlug" value={product.slug} />
                <button
                  type="submit"
                  className="w-full border border-red-200 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
                >
                  Delete Product
                </button>
                <p className="mt-2 text-center text-[10px] text-muted">This will remove all variants too</p>
              </form>
            </div>
          </div>
        </div>

        {/* Variants Grid */}
        <section className="space-y-10">
          <div className="flex items-end justify-between border-b border-foreground pb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Inventory</p>
              <h2 className="mt-2 font-display text-4xl tracking-tighter text-foreground">Product Variants</h2>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">{product.variantCount} total options</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {product.variants.map((variant) => (
              <div key={variant.id} className="group flex flex-col border border-foreground bg-white transition-shadow hover:shadow-xl">
                {/* Card Preview Area */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f3f0]">
                  {variant.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={variant.imageUrl} alt={variant.variantName ?? variant.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col justify-between p-6">
                      <div className="flex justify-between">
                        <span className="border border-foreground bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-foreground">
                          {variant.category}
                        </span>
                        {!variant.isActive && (
                          <span className="bg-slate-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted">Lashmealex</p>
                        <span className="mt-2 block font-display text-3xl font-medium tracking-tighter text-foreground">
                          {variant.variantName?.split(' ').slice(0, 2).join(' ') ?? 'Preview'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                        <span>Variant</span>
                        <span>#{variant.id.slice(-4)}</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute left-4 top-4 flex flex-col gap-2">
                    {variant.isFeatured && (
                      <span className="bg-pink-dark px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white">
                        Featured
                      </span>
                    )}
                    {variant.inventory === 0 && (
                      <span className="bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white">
                        Sold Out
                      </span>
                    )}
                  </div>

                  {/* Quick Image Upload Overlay */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-foreground/90 p-4 backdrop-blur-sm transition-transform group-hover:translate-y-0">
                    <form action={uploadVariantImageAction} className="flex flex-col gap-2">
                      <input type="hidden" name="productId" value={variant.id} />
                      <input type="hidden" name="slug" value={variant.slug} />
                      <input type="hidden" name="parentProductId" value={product.id} />
                      <input type="hidden" name="parentSlug" value={product.slug} />
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        required
                        className="w-full text-[10px] text-white file:mr-2 file:border-0 file:bg-white file:px-2 file:py-0.5 file:text-[9px] file:font-bold file:uppercase file:text-foreground"
                      />
                      <button type="submit" className="w-full bg-white py-1.5 text-[9px] font-bold uppercase tracking-widest text-foreground hover:bg-pink-dark hover:text-white transition-colors">
                        Upload Variant Image
                      </button>
                    </form>
                  </div>
                </div>

                {/* Condensed Editor Form */}
                <form action={updateVariantAction} className="flex flex-1 flex-col p-6">
                  <input type="hidden" name="productId" value={variant.id} />
                  <input type="hidden" name="slug" value={variant.slug} />
                  <input type="hidden" name="parentProductId" value={product.id} />
                  <input type="hidden" name="parentSlug" value={product.slug} />
                  <input type="hidden" name="parentProductName" value={product.name} />
                  <input type="hidden" name="description" value={variant.description ?? ''} />
                  <input type="hidden" name="category" value={variant.category} />
                  <input type="hidden" name="sortOrder" value={variant.sortOrder} />

                  <div className="flex-1 space-y-5">
                    <div className="space-y-4">
                      <label className="block space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Variant Name</span>
                        <input
                          type="text"
                          name="variantName"
                          required
                          defaultValue={variant.variantName ?? ''}
                          className="w-full border-b border-foreground bg-transparent py-1 text-sm font-semibold text-foreground outline-none focus:border-pink-dark"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        <label className="block space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Price ($)</span>
                          <input
                            type="number"
                            name="price"
                            step="0.01"
                            min="0"
                            defaultValue={(variant.price / 100).toFixed(2)}
                            className="w-full border-b border-foreground bg-transparent py-1 text-sm text-foreground outline-none focus:border-pink-dark"
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Inventory</span>
                          <input
                            type="number"
                            name="inventory"
                            min="0"
                            defaultValue={variant.inventory}
                            className="w-full border-b border-foreground bg-transparent py-1 text-sm text-foreground outline-none focus:border-pink-dark"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Settings</span>
                        <p className="text-[9px] text-muted">Pos: {variant.sortOrder}</p>
                      </div>
                      <div className="flex gap-4 border border-[#e5e2dd] bg-[#f5f3f0] p-3">
                        <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground">
                          <input type="checkbox" name="isActive" defaultChecked={variant.isActive} className="h-3 w-3 accent-foreground" />
                          Live
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground">
                          <input type="checkbox" name="isFeatured" defaultChecked={variant.isFeatured} className="h-3 w-3 accent-foreground" />
                          Featured
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-line">
                    <button
                      type="submit"
                      formAction={deleteVariantAction}
                      className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                    <button
                      type="submit"
                      className="border border-foreground bg-foreground px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-transparent hover:text-foreground"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ))}

            {/* Add Variant Card */}
            <div className="flex flex-col border border-dashed border-foreground bg-[#faf9f7] p-8">
              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Variation</p>
                <h3 className="mt-2 font-display text-2xl tracking-tighter text-foreground">Add New Variant</h3>
                <p className="mt-1 text-xs text-muted">Create another option for this product.</p>
              </div>

              <form action={createVariantAction} className="flex flex-1 flex-col gap-6">
                <input type="hidden" name="parentProductId" value={product.id} />
                <input type="hidden" name="parentProductName" value={product.name} />
                <input type="hidden" name="parentSlug" value={product.slug} />
                <input type="hidden" name="description" value={product.description} />
                <input type="hidden" name="category" value={product.category} />
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Variant Name *</span>
                  <input
                    type="text"
                    name="variantName"
                    required
                    placeholder="e.g. 0.03 CC 10-15mm"
                    className="w-full border-b border-foreground bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted/40 focus:border-pink-dark"
                  />
                </label>

                <div className="grid grid-cols-2 gap-6">
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Price ($) *</span>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="w-full border-b border-foreground bg-transparent py-1 text-sm text-foreground outline-none focus:border-pink-dark"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Inventory *</span>
                    <input
                      type="number"
                      name="inventory"
                      min="0"
                      defaultValue="0"
                      required
                      className="w-full border-b border-foreground bg-transparent py-1 text-sm text-foreground outline-none focus:border-pink-dark"
                    />
                  </label>
                </div>

                <div className="mt-auto space-y-6 pt-6">
                  <div className="flex gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground">
                      <input type="checkbox" name="isActive" defaultChecked className="h-3 w-3 accent-foreground" />
                      Live
                    </label>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                      <span>Order:</span>
                      <input
                        type="number"
                        name="sortOrder"
                        defaultValue={product.variantCount}
                        className="w-12 border-b border-foreground bg-transparent text-center text-sm text-foreground outline-none"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-foreground py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-pink-dark">
                    Create Variant →
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
