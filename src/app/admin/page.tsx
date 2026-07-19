import { logoutAction } from './auth-actions';
import { createProductAction, updateOrderAction } from './actions';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminCatalogStats, listAdminProductGroups } from '@/lib/catalog';
import { formatUsdFromCents } from '@/lib/money';
import { getAdminOrderStats, listAdminOrders } from '@/lib/orders';
import { isOrderFulfillmentStatus, orderFulfillmentCopy } from '@/lib/order-status';
import { getAdminCartStats, listAdminCarts } from '@/lib/cart';
import AdminHeader from '@/components/AdminHeader';
import AdminFieldLabel from '@/components/admin/AdminFieldLabel';
import {
  AdminActionLink,
  AdminButton,
  AdminEmptyState,
  AdminOperationGroup,
  AdminPageHeader,
  AdminPageShell,
  AdminSection,
  AdminStat,
  AdminStatusBadge,
  AdminTableWrap,
  adminFileInputClass,
  adminInputClass,
} from '@/components/admin/AdminUI';

export const dynamic = 'force-dynamic';

function formatDate(value: Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(value);
}

const paymentLabel: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const fulfillmentLabel: Record<string, string> = {
  unfulfilled: 'Received',
  fulfilled: 'Picked up',
  ...Object.fromEntries(Object.entries(orderFulfillmentCopy).map(([status, copy]) => [status, copy.label])),
};

function paymentTone(status: string) {
  if (status === 'paid') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'warning';
}

function fulfillmentTone(status: string) {
  if (status === 'picked_up' || status === 'fulfilled') return 'success';
  if (status === 'ready_for_pickup') return 'info';
  if (status === 'working_on_it') return 'warning';
  return 'neutral';
}

function cartTone(status: string) {
  if (status === 'active') return 'success';
  if (status === 'abandoned') return 'warning';
  return 'info';
}

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
    <div className="min-h-screen bg-background">
      <AdminHeader logoutAction={logoutAction} />

      <AdminPageShell>
        <AdminPageHeader
          eyebrow="Admin"
          title="Operations"
          description="Manage shop products, sales, and customer carts from one workspace."
          actions={
            <AdminActionLink href="#shop-products" tone="secondary">
              Manage products
            </AdminActionLink>
          }
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <AdminStat label="Live variants" value={catalogStats.activeVariants} detail="visible on storefront" href="#products" />
          <AdminStat label="Stock" value={catalogStats.totalInventory} detail="units available" href="#products" />
          <AdminStat label="Active carts" value={cartStats.activeCount} detail={`${cartStats.abandonedCount} abandoned`} href="/admin/carts" />
          <AdminStat label="Paid revenue" value={formatUsdFromCents(orderStats.grossSales)} detail="collected orders" href="#orders" />
          <AdminStat label="Units sold" value={orderStats.unitsSold} detail="ordered items" href="#orders" />
        </section>

        <AdminOperationGroup
          id="shop-products"
          title="Shop products"
          description="Manage the catalog, inventory, visibility, and new products."
          summary={`${productGroups.length} products`}
          defaultOpen
        >
        <AdminSection
          eyebrow="Products"
          title="Catalog"
          description="Open a product to manage variants, stock, photos, and visibility."
          actions={<span className="text-xs text-muted">{productGroups.length} products</span>}
          className="scroll-mt-20"
        >
          <div id="products" className="scroll-mt-24">
            {productGroups.length === 0 ? (
              <AdminEmptyState title="No products yet" description="Add the first product below. It will open into a product editor after creation." />
            ) : (
              <AdminTableWrap minWidth="min-w-[860px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-foreground bg-background text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Variants</th>
                      <th className="px-5 py-3">Stock</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-sm text-foreground">
                    {productGroups.map((product) => (
                      <tr key={product.id} className="hover:bg-surface-hover">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 border border-line bg-photo-well">
                              {product.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.image} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="mt-0.5 max-w-sm truncate text-xs text-muted">{product.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <AdminStatusBadge tone={product.hasActiveVariant ? 'success' : 'neutral'}>
                              {product.hasActiveVariant ? 'Live' : 'Hidden'}
                            </AdminStatusBadge>
                            {product.isHero ? <AdminStatusBadge tone="accent">Hero</AdminStatusBadge> : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted">{product.variantCount}</td>
                        <td className="px-5 py-4 font-medium">{product.totalInventory}</td>
                        <td className="px-5 py-4 text-muted">{product.category || 'Uncategorized'}</td>
                        <td className="px-5 py-4 text-right">
                          <AdminActionLink href={`/admin/products/${product.slug}`} className="px-3 py-1.5">
                            Edit
                          </AdminActionLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableWrap>
            )}
          </div>
        </AdminSection>

        <AdminSection
          eyebrow="Add product"
          title="New product"
          description="Start with one sellable variant. More variants can be added on the product page."
        >
          <form action={createProductAction} className="space-y-6 p-5 sm:p-6">
            <section aria-labelledby="product-details-heading">
              <h3 id="product-details-heading" className="mb-4 text-sm font-semibold text-foreground">Product details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <AdminFieldLabel hint="Required">Product name</AdminFieldLabel>
                  <input
                    type="text"
                    name="productName"
                    required
                    placeholder="Classic Faux Mink Lashes"
                    className={adminInputClass()}
                  />
                </label>

                <label className="block space-y-1.5">
                  <AdminFieldLabel hint="Optional">Category</AdminFieldLabel>
                  <input type="text" name="category" defaultValue="Lashes" className={adminInputClass()} />
                </label>

                <label className="block space-y-1.5 sm:col-span-2">
                  <AdminFieldLabel>Description</AdminFieldLabel>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Materials, curl options, or who this is best for."
                    className={adminInputClass('resize-y')}
                  />
                </label>

                <label className="block space-y-1.5 sm:col-span-2">
                  <AdminFieldLabel>Product image</AdminFieldLabel>
                  <input type="file" name="image" accept="image/*" className={adminFileInputClass()} />
                </label>
              </div>
            </section>

            <section aria-labelledby="first-variant-heading" className="border-t border-line pt-6">
              <h3 id="first-variant-heading" className="mb-4 text-sm font-semibold text-foreground">First variant</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <AdminFieldLabel hint="Required">Variant name</AdminFieldLabel>
                  <input
                    type="text"
                    name="initialVariantName"
                    required
                    placeholder="CC Curl 0.03"
                    className={adminInputClass()}
                  />
                </label>

                <label className="block space-y-1.5">
                  <AdminFieldLabel hint="Required">Starting stock</AdminFieldLabel>
                  <input type="number" name="inventory" min="0" defaultValue="0" required className={adminInputClass()} />
                </label>

                <label className="block space-y-1.5">
                  <AdminFieldLabel hint="Required">Price</AdminFieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                    <input type="number" name="price" min="0" step="0.01" required placeholder="0.00" className={adminInputClass('pl-7')} />
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <AdminFieldLabel hint="Optional">Compare price</AdminFieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                    <input type="number" name="compareAtPrice" min="0" step="0.01" placeholder="0.00" className={adminInputClass('pl-7')} />
                  </div>
                </label>
              </div>
            </section>

            <div className="flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-start gap-3 text-xs text-foreground">
                <input type="checkbox" name="isActive" defaultChecked className="mt-0.5 h-4 w-4 accent-foreground" />
                <span>
                  <span className="font-semibold">Active</span>
                  <span className="block text-muted">Customers can see and buy it.</span>
                </span>
              </label>

              <AdminButton type="submit" tone="primary" className="w-full sm:w-auto sm:min-w-48">
                Create product
              </AdminButton>
            </div>
          </form>
        </AdminSection>

        </AdminOperationGroup>

        <AdminOperationGroup
          id="sales"
          title="Sales"
          description="Review orders, payment state, and fulfillment progress."
          summary={`${orders.length} orders`}
        >
          <AdminSection
            eyebrow="Orders"
            title="Orders"
            description="Update payment and fulfillment status."
            actions={<span className="text-xs text-muted">{orders.length} orders</span>}
            className="scroll-mt-20"
          >
            <div id="orders" className="scroll-mt-24">
              {orders.length === 0 ? (
                <AdminEmptyState title="No orders yet" description="Orders will appear after checkout." />
              ) : (
                <div className="divide-y divide-line">
                  {orders.map((order) => (
                    <form key={order.id} action={updateOrderAction} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_150px_170px_auto] lg:items-end">
                      <input type="hidden" name="orderId" value={order.id} />

                      <div>
                        <p className="text-sm font-semibold text-foreground">{order.customerName ?? order.customerEmail}</p>
                        {order.customerName ? <p className="mt-0.5 text-[11px] text-muted">{order.customerEmail}</p> : null}
                        <p className="mt-2 text-xs text-muted">{formatDate(order.createdAt)}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{formatUsdFromCents(order.total)}</p>
                          <AdminStatusBadge tone={paymentTone(order.status)}>{paymentLabel[order.status] ?? order.status}</AdminStatusBadge>
                          <AdminStatusBadge tone={fulfillmentTone(order.fulfillmentStatus)}>
                            {fulfillmentLabel[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                          </AdminStatusBadge>
                        </div>
                      </div>

                      <label className="space-y-1.5">
                        <AdminFieldLabel>Payment</AdminFieldLabel>
                        <select name="status" defaultValue={order.status} className={adminInputClass()}>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <AdminFieldLabel>Fulfillment</AdminFieldLabel>
                        <select name="fulfillmentStatus" defaultValue={isOrderFulfillmentStatus(order.fulfillmentStatus) ? order.fulfillmentStatus : 'received'} className={adminInputClass()}>
                          <option value="received">Received</option>
                          <option value="working_on_it">Working on it</option>
                          <option value="ready_for_pickup">Ready for Pickup</option>
                          <option value="picked_up">Picked up</option>
                        </select>
                      </label>

                      <AdminButton type="submit">Save</AdminButton>
                    </form>
                  ))}
                </div>
              )}
            </div>
          </AdminSection>

        </AdminOperationGroup>

        <AdminOperationGroup
          id="customer-carts"
          title="Carts"
          description="Review active and abandoned customer carts."
          summary={`${cartStats.activeCount} active`}
        >
          <AdminSection
            eyebrow="Carts"
            title="Recent carts"
            description="Active and abandoned customer carts."
            actions={<AdminActionLink href="/admin/carts">All carts</AdminActionLink>}
            className="scroll-mt-20"
          >
            {recentCarts.length === 0 ? (
              <AdminEmptyState title="No carts yet" description="Customer carts will appear once shoppers add products." />
            ) : (
              <AdminTableWrap minWidth="min-w-[720px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-foreground bg-background text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3">Subtotal</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-sm text-foreground">
                    {recentCarts.slice(0, 6).map((cart) => (
                      <tr key={cart.id} className="hover:bg-surface-hover">
                        <td className="px-5 py-4">
                          <p className="font-semibold">{cart.name}</p>
                          <p className="text-xs text-muted">{cart.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <AdminStatusBadge tone={cartTone(cart.status)}>{cart.status}</AdminStatusBadge>
                        </td>
                        <td className="px-5 py-4 text-muted">{cart.itemCount}</td>
                        <td className="px-5 py-4 font-medium">{formatUsdFromCents(cart.subtotal)}</td>
                        <td className="px-5 py-4 text-right">
                          <AdminActionLink href={`/admin/carts/${cart.id}`} className="px-3 py-1.5">
                            Open
                          </AdminActionLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableWrap>
            )}
          </AdminSection>
        </AdminOperationGroup>
      </AdminPageShell>
    </div>
  );
}
