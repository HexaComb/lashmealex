import Link from 'next/link';

import { logoutAction } from './auth-actions';
import { createProductAction, updateOrderAction } from './actions';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminCatalogStats, listAdminProductGroups } from '@/lib/catalog';
import { formatUsdFromCents } from '@/lib/money';
import { getAdminOrderStats, listAdminOrders } from '@/lib/orders';
import { getAdminCartStats, listAdminCarts } from '@/lib/cart';
import AdminHeader from '@/components/AdminHeader';

export const dynamic = 'force-dynamic';

function formatDate(value: Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(value);
}

const paymentStyle: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-red-200 bg-red-50 text-red-600',
};

const fulfillmentStyle: Record<string, string> = {
  unfulfilled: 'border-slate-200 bg-slate-100 text-slate-500',
  ready_for_pickup: 'border-blue-200 bg-blue-50 text-blue-700',
  fulfilled: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const paymentLabel: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const fulfillmentLabel: Record<string, string> = {
  unfulfilled: 'Unfulfilled',
  ready_for_pickup: 'Ready for Pickup',
  fulfilled: 'Fulfilled',
};

export default async function AdminPage() {
  await requireAdmin();

  const [productGroups, catalogStats, orders, orderStats, cartStats, recentCarts] = await Promise.all([
    listAdminProductGroups(),
    getAdminCatalogStats(),
    listAdminOrders(),
    getAdminOrderStats(),
    getAdminCartStats(),
    listAdminCarts(),
  ]);

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <AdminHeader logoutAction={logoutAction} />

      <div className="mx-auto max-w-7xl space-y-14 px-6 py-10 sm:px-12 lg:px-20">
        {/* Page Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Dashboard</p>
          <h1 className="mt-3 font-display text-5xl tracking-tighter text-foreground">Your Shop</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Manage your lash catalog and track orders. Any changes you make here show up on the storefront immediately.
          </p>
        </div>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="border border-foreground bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Products Listed</p>
            <p className="mt-4 font-display text-4xl text-foreground">{catalogStats.activeVariants}</p>
            <p className="mt-2 text-[10px] text-muted">active on storefront</p>
          </div>
          <div className="border border-foreground bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Items in Stock</p>
            <p className="mt-4 font-display text-4xl text-foreground">{catalogStats.totalInventory}</p>
            <p className="mt-2 text-[10px] text-muted">trays available</p>
          </div>
          <Link href="/admin/carts" className="border border-foreground bg-white p-6 block hover:bg-[#f5f3f0] transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Active Carts</p>
            <p className="mt-4 font-display text-4xl text-foreground">{cartStats.activeCount}</p>
            <p className="mt-2 text-[10px] text-muted">{cartStats.abandonedCount} abandoned</p>
          </Link>
          <div className="border border-foreground bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Revenue Collected</p>
            <p className="mt-4 font-display text-4xl text-foreground">{formatUsdFromCents(orderStats.grossSales)}</p>
            <p className="mt-2 text-[10px] text-muted">from paid orders</p>
          </div>
          <div className="border border-foreground bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Units Sold</p>
            <p className="mt-4 font-display text-4xl text-foreground">{orderStats.unitsSold}</p>
            <p className="mt-2 text-[10px] text-muted">items purchased</p>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="scroll-mt-20 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Catalog</p>
              <h2 className="mt-3 font-display text-4xl tracking-tighter text-foreground">Products</h2>
              <p className="mt-2 max-w-lg text-sm text-muted">
                Create a product here, then open it to add variants, photos, and stock.
              </p>
            </div>
            <p className="text-xs text-muted">{productGroups.length} product{productGroups.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Product Cards */}
          {productGroups.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {productGroups.map((product) => (
                <div key={product.id} className="flex flex-col border border-foreground bg-white">
                  <div className="relative aspect-square w-full overflow-hidden bg-[#f0ede8]">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted opacity-30">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em]">No image</p>
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${product.hasActiveVariant ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white/90 text-slate-500'}`}>
                        {product.hasActiveVariant ? 'Active' : 'Hidden'}
                      </span>
                      {product.isFeatured && (
                        <span className="border border-pink-200 bg-pink-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-pink-dark">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-display text-xl leading-tight text-foreground">{product.name}</p>
                    {product.category && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{product.category}</p>
                    )}
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{product.description}</p>
                    <div className="mt-4 flex items-center gap-4 border-t border-[#e8e5e0] pt-4 text-xs text-muted">
                      <span>{product.variantCount} variant{product.variantCount !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{product.totalInventory} in stock</span>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/admin/products/${product.slug}`}
                        className="block w-full border border-foreground px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-white"
                      >
                        Edit product
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Product Form */}
          <div className="border border-foreground bg-white">
            <div className="border-b border-foreground px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">New Product</p>
              <h3 className="mt-2 font-display text-2xl tracking-tighter text-foreground">Add a Product</h3>
              <p className="mt-1.5 text-xs text-muted">
                Fill out the details below to list a new product. You can add more variations after creating it.
              </p>
            </div>

            <form action={createProductAction} className="p-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {/* Basic Info */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">Basic Info</p>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Product Name *</span>
                    <input
                      type="text"
                      name="productName"
                      required
                      placeholder="e.g. Classic Faux Mink Lashes"
                      className="w-full border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/40 focus:border-pink-dark"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Description</span>
                    <textarea
                      name="description"
                      rows={4}
                      placeholder="Describe this product for customers…"
                      className="w-full resize-none border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/40 focus:border-pink-dark"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Category</span>
                    <input
                      type="text"
                      name="category"
                      defaultValue="Lashes"
                      className="w-full border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus:border-pink-dark"
                    />
                  </label>
                </div>

                {/* First Variation */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">First Variation</p>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Variation Name *</span>
                    <input
                      type="text"
                      name="initialVariantName"
                      required
                      placeholder="e.g. CC Curl 0.03"
                      className="w-full border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/40 focus:border-pink-dark"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Price *</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                      <input
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        className="w-full border border-foreground bg-transparent py-2.5 pl-7 pr-3 text-sm text-foreground outline-none placeholder:text-muted/40 focus:border-pink-dark"
                      />
                    </div>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                      Compare-At Price{' '}
                      <span className="font-normal normal-case tracking-normal text-muted/70">(optional, for sales)</span>
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                      <input
                        type="number"
                        name="compareAtPrice"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full border border-foreground bg-transparent py-2.5 pl-7 pr-3 text-sm text-foreground outline-none placeholder:text-muted/40 focus:border-pink-dark"
                      />
                    </div>
                  </label>
                </div>

                {/* Inventory & Visibility */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">Inventory & Visibility</p>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Starting Inventory *</span>
                    <input
                      type="number"
                      name="inventory"
                      min="0"
                      defaultValue="0"
                      required
                      className="w-full border border-foreground bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus:border-pink-dark"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Product Image</span>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      className="w-full border border-foreground bg-transparent px-3 py-2 text-sm text-foreground outline-none file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-[9px] file:font-bold file:uppercase file:tracking-[0.15em] file:text-background"
                    />
                  </label>

                  <div className="space-y-3 border border-[#e5e2dd] bg-[#f5f3f0] p-4">
                    <label className="flex cursor-pointer items-start gap-3 text-xs text-foreground">
                      <input type="checkbox" name="isActive" defaultChecked className="mt-0.5 h-4 w-4 accent-foreground" />
                      <span>
                        <span className="font-semibold">Show on storefront</span>
                        <span className="ml-1 text-muted">— customers can see and buy this</span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 text-xs text-foreground">
                      <input type="checkbox" name="isFeatured" defaultChecked className="mt-0.5 h-4 w-4 accent-foreground" />
                      <span>
                        <span className="font-semibold">Feature on homepage</span>
                        <span className="ml-1 text-muted">— highlights this product</span>
                      </span>
                    </label>
                  </div>

                  <button type="submit" className="btn-primary w-full">
                    Create Product →
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Carts */}
        <section id="carts" className="scroll-mt-20 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Leads</p>
              <h2 className="mt-3 font-display text-4xl tracking-tighter text-foreground">Shopping Carts</h2>
            </div>
            <Link
              href="/admin/carts"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
            >
              View All →
            </Link>
          </div>

          {recentCarts.length === 0 ? (
            <div className="border border-dashed border-foreground bg-white px-10 py-16 text-center">
              <p className="font-display text-2xl text-foreground">No carts yet</p>
              <p className="mt-2 text-sm text-muted">
                Customer sessions will appear here once shoppers start building their bags.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-foreground bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-foreground bg-[#faf9f7] text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Subtotal</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm text-foreground">
                  {recentCarts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-[#faf9f7]">
                      <td className="px-6 py-5">
                        <p className="font-semibold">{cart.name}</p>
                        <p className="text-xs text-muted">{cart.email}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                          cart.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : cart.status === 'abandoned' ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-blue-200 bg-blue-50 text-blue-700'
                        }`}>
                          {cart.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-muted">{cart.itemCount} items</td>
                      <td className="px-6 py-5 font-medium">{formatUsdFromCents(cart.subtotal)}</td>
                      <td className="px-6 py-5 text-xs text-muted">{formatDate(cart.lastActiveAt)}</td>
                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/admin/carts/${cart.id}`}
                          className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-dark hover:underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Orders */}
        <section id="orders" className="scroll-mt-20 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Sales</p>
              <h2 className="mt-3 font-display text-4xl tracking-tighter text-foreground">Orders</h2>
            </div>
            <p className="text-xs text-muted">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          </div>

          {orders.length === 0 ? (
            <div className="border border-dashed border-foreground bg-white px-10 py-16 text-center">
              <p className="font-display text-2xl text-foreground">No orders yet</p>
              <p className="mt-2 text-sm text-muted">
                Once customers start purchasing, their orders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <form
                  key={order.id}
                  action={updateOrderAction}
                  className="border border-foreground bg-white"
                >
                  <input type="hidden" name="orderId" value={order.id} />

                  <div className="grid gap-4 p-5 sm:grid-cols-[1fr_160px_160px_auto] sm:items-center">
                    {/* Customer */}
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {order.customerName ?? order.customerEmail}
                      </p>
                      {order.customerName && (
                        <p className="mt-0.5 text-[11px] text-muted">{order.customerEmail}</p>
                      )}
                      <p className="mt-2 text-xs text-muted">{formatDate(order.createdAt)}</p>
                      <p className="mt-1 font-display text-lg text-foreground">{formatUsdFromCents(order.total)}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <span className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${paymentStyle[order.status] ?? 'border-gray-200 bg-gray-100 text-gray-600'}`}>
                          {paymentLabel[order.status] ?? order.status}
                        </span>
                        <span className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${fulfillmentStyle[order.fulfillmentStatus] ?? 'border-gray-200 bg-gray-100 text-gray-600'}`}>
                          {fulfillmentLabel[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Payment */}
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Payment</span>
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="w-full border border-foreground bg-transparent px-3 py-2 text-sm text-foreground outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>

                    {/* Fulfillment */}
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Fulfillment</span>
                      <select
                        name="fulfillmentStatus"
                        defaultValue={order.fulfillmentStatus}
                        className="w-full border border-foreground bg-transparent px-3 py-2 text-sm text-foreground outline-none"
                      >
                        <option value="unfulfilled">Unfulfilled</option>
                        <option value="ready_for_pickup">Ready for Pickup</option>
                        <option value="fulfilled">Fulfilled</option>
                      </select>
                    </label>

                    <div className="flex sm:justify-end">
                      <button
                        type="submit"
                        className="border border-foreground px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-white"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
