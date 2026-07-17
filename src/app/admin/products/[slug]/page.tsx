import { notFound } from 'next/navigation';

import {
  createVariantAction,
  deleteProductGalleryImageAction,
  deleteProductAction,
  deleteVariantAction,
  setHeroProductAction,
  updateProductAction,
  updateVariantAction,
  uploadProductImageAction,
  uploadProductGalleryImagesAction,
  uploadVariantImageAction,
} from '../../actions';
import { logoutAction } from '../../auth-actions';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminProductGroupBySlug } from '@/lib/catalog';
import AdminHeader from '@/components/AdminHeader';
import AdminFieldLabel from '@/components/admin/AdminFieldLabel';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import {
  AdminActionLink,
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  AdminStatusBadge,
  adminFileInputClass,
  adminInputClass,
  adminSmallInputClass,
} from '@/components/admin/AdminUI';

export const dynamic = 'force-dynamic';

const dangerButtonClass =
  'inline-flex w-full items-center justify-center border border-red-300 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white';
const textDangerButtonClass =
  'text-[10px] font-bold uppercase tracking-[0.16em] text-red-600 transition-colors hover:text-foreground';

interface AdminProductPageProps {
  params: Promise<{ slug: string }>;
}

function formatCents(value?: number | null) {
  return value ? (value / 100).toFixed(2) : '';
}

export default async function AdminProductPage({ params }: AdminProductPageProps) {
  await requireAdmin();

  const resolvedParams = await params;
  const product = await getAdminProductGroupBySlug(resolvedParams.slug);

  if (!product) notFound();

  const activeCount = product.variants.filter((v) => v.isActive).length;
  const outOfStockCount = product.variants.filter((v) => v.inventory === 0).length;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader logoutAction={logoutAction} productName={product.name} />

      <AdminPageShell>
        <div className="flex flex-wrap gap-3">
          <AdminActionLink href="/admin#products">Back to products</AdminActionLink>
          <AdminActionLink href={`/products/${product.slug}`} tone="ghost">View storefront</AdminActionLink>
        </div>

        <AdminPageHeader
          eyebrow="Product"
          title={product.name}
          description={`${product.variantCount} variant${product.variantCount !== 1 ? 's' : ''}, ${activeCount} live, ${product.totalInventory} units in stock${outOfStockCount > 0 ? `, ${outOfStockCount} sold out` : ''}.`}
          actions={
            <>
              {product.category ? <AdminStatusBadge>{product.category}</AdminStatusBadge> : null}
              {product.isHero ? <AdminStatusBadge tone="accent">Homepage hero</AdminStatusBadge> : null}
            </>
          }
        />

        <section className="grid gap-8 border-t border-foreground pt-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-dark">Product photo</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Show customers what they are buying</h2>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted">This main photo is used unless an option has a photo of its own.</p>
            </div>
            <form action={uploadProductImageAction} className="space-y-3">
              <input type="hidden" name="parentProductId" value={product.id} />
              <input type="hidden" name="parentSlug" value={product.slug} />
              <div className="aspect-[4/3] overflow-hidden border border-foreground bg-photo-well">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={`Main photo for ${product.name}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">No main photo yet</div>
                )}
              </div>
              <label className="block space-y-1.5">
                <AdminFieldLabel>{product.image ? 'Choose a replacement photo' : 'Choose a main photo'}</AdminFieldLabel>
                <input type="file" name="image" accept="image/*" required className={adminFileInputClass()} />
              </label>
              <AdminButton type="submit" tone="primary">{product.image ? 'Replace main photo' : 'Save main photo'}</AdminButton>
            </form>
          </div>

          <div className="space-y-6 lg:pt-7">
            <div className="space-y-3 border-b border-line pb-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">More photos</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">Optional photos shared by every option.</p>
              </div>
              {(product.galleryImages?.length ?? 0) > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {product.galleryImages?.map((image, index) => (
                    <div key={image.id} className="space-y-2">
                      <div className="aspect-square overflow-hidden border border-line bg-photo-well">
                        {image.imageUrl ? <img src={image.imageUrl} alt={`${product.name} additional photo ${index + 1}`} className="h-full w-full object-cover" /> : null}
                      </div>
                      <form action={deleteProductGalleryImageAction}>
                        <input type="hidden" name="parentSlug" value={product.slug} />
                        <input type="hidden" name="imageId" value={image.id} />
                        <ConfirmSubmitButton message="Remove this additional product photo?" className={textDangerButtonClass}>Remove photo</ConfirmSubmitButton>
                      </form>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted">No additional photos yet.</p>}
              <form action={uploadProductGalleryImagesAction} className="space-y-3 pt-1">
                <input type="hidden" name="parentProductId" value={product.id} />
                <input type="hidden" name="parentSlug" value={product.slug} />
                <label className="block space-y-1.5">
                  <AdminFieldLabel>Add more photos</AdminFieldLabel>
                  <input type="file" name="galleryImages" accept="image/*" multiple required className={adminFileInputClass()} />
                </label>
                <AdminButton type="submit">Add selected photos</AdminButton>
              </form>
            </div>

            <form action={updateProductAction} className="space-y-4">
              <input type="hidden" name="parentProductId" value={product.id} />
              <input type="hidden" name="parentSlug" value={product.slug} />
              <div>
                <h2 className="text-base font-semibold text-foreground">Product information</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">The name and category customers see.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <AdminFieldLabel>Product name</AdminFieldLabel>
                  <input type="text" name="productName" required defaultValue={product.name} className={adminInputClass()} />
                </label>

                <label className="block space-y-1.5">
                  <AdminFieldLabel>Category</AdminFieldLabel>
                  <input type="text" name="category" defaultValue={product.category} className={adminInputClass()} />
                </label>
              </div>
              <details className="border-t border-line pt-3">
                <summary className="cursor-pointer text-xs font-semibold text-foreground">Edit storefront description</summary>
                <label className="mt-3 block space-y-1.5">
                  <AdminFieldLabel>Storefront description</AdminFieldLabel>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Materials, curl options, who this tray is best for."
                    defaultValue={product.description}
                    className={adminInputClass('resize-y')}
                  />
                </label>
              </details>
              <AdminButton type="submit" tone="primary">Save changes</AdminButton>
            </form>
          </div>
        </section>

        <section className="space-y-4 border-t border-foreground pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-dark">Product options</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">What customers can buy</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{product.variantCount} option{product.variantCount !== 1 ? 's' : ''} · {activeCount} visible · {product.totalInventory} in stock{outOfStockCount > 0 ? ` · ${outOfStockCount} sold out` : ''}</p>
            </div>
          </div>
          {product.variants.length === 0 ? (
            <AdminEmptyState title="No options yet" description="Add the first version customers can buy below." />
          ) : (
            <div className="border-y border-foreground bg-white">
              <div className="hidden grid-cols-[72px_minmax(0,1fr)_100px_80px_90px_100px] gap-4 border-b border-line px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted lg:grid">
                <span>Photo</span><span>Option</span><span>Price</span><span>Stock</span><span>Website</span><span />
              </div>
              {product.variants.map((variant) => (
                <details key={variant.id} className="group border-b border-line last:border-b-0">
                  <summary className="grid cursor-pointer list-none grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden lg:grid-cols-[72px_minmax(0,1fr)_100px_80px_90px_100px] lg:gap-4 lg:px-5">
                    <span className="h-14 w-14 overflow-hidden border border-line bg-photo-well lg:h-[72px] lg:w-[72px]">
                      {variant.imageUrl ? <img src={variant.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center px-1 text-center text-[9px] text-muted">No photo</span>}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{variant.variantName ?? variant.name}</span>
                      <span className="mt-1 block text-xs text-muted lg:hidden">${(variant.price / 100).toFixed(2)} · {variant.inventory} in stock</span>
                    </span>
                    <span className="hidden text-sm text-foreground lg:block">${(variant.price / 100).toFixed(2)}</span>
                    <span className="hidden text-sm text-foreground lg:block">{variant.inventory}</span>
                    <span className="hidden lg:block"><AdminStatusBadge tone={variant.isActive ? 'success' : 'neutral'}>{variant.isActive ? 'Visible' : 'Hidden'}</AdminStatusBadge></span>
                    <span className="text-xs font-semibold text-pink-dark">Edit</span>
                  </summary>
                  <div className="border-t border-line bg-background p-5">
                    <div className="grid border border-foreground bg-white lg:grid-cols-[minmax(0,1fr)_260px]">
                      <form action={updateVariantAction} className="space-y-4 p-5">
                        <input type="hidden" name="productId" value={variant.id} />
                        <input type="hidden" name="slug" value={variant.slug} />
                        <input type="hidden" name="parentProductId" value={product.id} />
                        <input type="hidden" name="parentSlug" value={product.slug} />
                        <input type="hidden" name="parentProductName" value={product.name} />
                        <input type="hidden" name="description" value={variant.description ?? ''} />
                        <input type="hidden" name="category" value={variant.category} />
                        <div className="grid gap-4 sm:grid-cols-3">
                          <label className="block space-y-1.5 sm:col-span-3"><AdminFieldLabel>Option name</AdminFieldLabel><input type="text" name="variantName" required defaultValue={variant.variantName ?? ''} className={adminInputClass()} /></label>
                          <label className="block space-y-1.5"><AdminFieldLabel>Price</AdminFieldLabel><input type="number" name="price" step="0.01" min="0" defaultValue={(variant.price / 100).toFixed(2)} className={adminSmallInputClass()} /></label>
                          <label className="block space-y-1.5"><AdminFieldLabel>Stock</AdminFieldLabel><input type="number" name="inventory" min="0" defaultValue={variant.inventory} className={adminSmallInputClass()} /></label>
                          <label className="block space-y-1.5"><AdminFieldLabel>Compare-at price</AdminFieldLabel><input type="number" name="compareAtPrice" step="0.01" min="0" defaultValue={formatCents(variant.compareAtPrice)} className={adminSmallInputClass()} /></label>
                        </div>
                        <details className="border-t border-line pt-3"><summary className="cursor-pointer text-xs font-semibold text-foreground">More settings</summary><label className="mt-3 block max-w-40 space-y-1.5"><AdminFieldLabel>Display order</AdminFieldLabel><input type="number" name="sortOrder" defaultValue={variant.sortOrder} className={adminSmallInputClass()} /></label></details>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground"><input type="checkbox" name="isActive" defaultChecked={variant.isActive} className="h-4 w-4 accent-foreground" />Active</label><AdminButton type="submit" tone="primary">Save option</AdminButton></div>
                      </form>
                      <form
                        action={uploadVariantImageAction}
                        className="flex flex-col gap-2 border-t border-foreground bg-background p-4 lg:border-l lg:border-t-0"
                      >
                        <input type="hidden" name="productId" value={variant.id} />
                        <input type="hidden" name="slug" value={variant.slug} />
                        <input type="hidden" name="parentProductId" value={product.id} />
                        <input type="hidden" name="parentSlug" value={product.slug} />
                        <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-pink-dark">Media</p>
                        <h3 className="text-sm font-semibold text-foreground">Option photo</h3>
                        <p className="text-xs leading-relaxed text-muted">
                          Only add one if this option needs a different photo.
                        </p>
                        <input type="file" name="image" accept="image/*" required className={adminFileInputClass()} />
                        <div className="mt-0.5 flex flex-col gap-1.5">
                          <AdminButton type="submit">Save photo</AdminButton>
                          <ConfirmSubmitButton
                            message={`Delete option "${variant.variantName ?? variant.name}"?`}
                            formAction={deleteVariantAction}
                            className={textDangerButtonClass}
                          >
                            Delete option
                          </ConfirmSubmitButton>
                        </div>
                      </form>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        <details className="border-y border-foreground">
          <summary className="cursor-pointer px-1 py-5 text-sm font-semibold text-foreground">+ Add another option</summary>
          <form action={createVariantAction} className="grid gap-4 border-t border-line py-5 md:grid-cols-2 xl:grid-cols-6 xl:items-end">
            <input type="hidden" name="parentProductId" value={product.id} />
            <input type="hidden" name="parentProductName" value={product.name} />
            <input type="hidden" name="parentSlug" value={product.slug} />
            <input type="hidden" name="description" value={product.description} />
            <input type="hidden" name="category" value={product.category} />

            <label className="block space-y-1.5 md:col-span-2">
              <AdminFieldLabel hint="Required">Option name</AdminFieldLabel>
              <input type="text" name="variantName" required placeholder="CC Curl 0.03 10-15mm" className={adminInputClass()} />
            </label>

            <label className="block space-y-1.5">
              <AdminFieldLabel hint="Required">Price</AdminFieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                <input type="number" name="price" min="0" step="0.01" required placeholder="0.00" className={adminInputClass('pl-7')} />
              </div>
            </label>

            <label className="block space-y-1.5">
              <AdminFieldLabel>Compare-at price</AdminFieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                <input type="number" name="compareAtPrice" min="0" step="0.01" placeholder="0.00" className={adminInputClass('pl-7')} />
              </div>
            </label>

            <label className="block space-y-1.5">
              <AdminFieldLabel hint="Required">Starting stock</AdminFieldLabel>
              <input type="number" name="inventory" min="0" defaultValue="0" required className={adminInputClass()} />
            </label>

            <label className="block space-y-1.5">
              <AdminFieldLabel>Display order</AdminFieldLabel>
              <input type="number" name="sortOrder" defaultValue={product.variantCount} className={adminInputClass()} />
            </label>

            <div className="flex flex-wrap gap-5 md:col-span-2 xl:col-span-5">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-foreground" />
                Active
              </label>
            </div>

            <AdminButton type="submit" tone="primary" className="w-full xl:w-auto">Add option</AdminButton>
          </form>
        </details>

        <section className="flex flex-col gap-4 border-t border-red-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-base font-semibold text-foreground">Website and deletion</h2><p className="mt-1 text-sm text-muted">Feature this product on the home page or remove it permanently.</p></div>
          <div className="flex flex-wrap gap-3">
            <form action={setHeroProductAction}><input type="hidden" name="parentProductId" value={product.id} /><input type="hidden" name="parentSlug" value={product.slug} /><AdminButton type="submit" disabled={product.isHero} tone={product.isHero ? 'primary' : 'secondary'}>{product.isHero ? 'Featured on home page' : 'Feature on home page'}</AdminButton></form>
            <form action={deleteProductAction}><input type="hidden" name="parentProductId" value={product.id} /><input type="hidden" name="parentSlug" value={product.slug} /><ConfirmSubmitButton message={`Delete "${product.name}" and all ${product.variantCount} option(s)? This cannot be undone.`} className={dangerButtonClass}>Delete product</ConfirmSubmitButton></form>
          </div>
        </section>
      </AdminPageShell>
    </div>
  );
}
