import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { getCartWithItems } from '@/lib/cart';
import { formatUsdFromCents } from '@/lib/money';
import { logoutAction } from '../../auth-actions';
import { adminClearCartAction, adminDeleteCartAction, adminUpdateCartStatusAction, adminUpdateCartNotesAction } from '../../actions';
import AdminHeader from '@/components/AdminHeader';

export const dynamic = 'force-dynamic';

function formatDate(value: Date | number | null) {
  if (!value) return '—';
  try {
    const date = typeof value === 'number' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return '—';
  }
}

export default async function AdminCartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const id = (await params).id;
  const cart = await getCartWithItems(id);

  if (!cart) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <AdminHeader logoutAction={logoutAction} />

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10 sm:px-12 lg:px-20">
        <div className="flex items-center gap-4">
          <Link href="/admin/carts" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
            ← Back to Carts
          </Link>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content: Items */}
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <div className="flex items-end justify-between border-b border-foreground pb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Cart Details</p>
                  <h1 className="mt-3 font-display text-4xl tracking-tighter text-foreground">
                    {cart.name}&apos;s Bag
                  </h1>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Cart ID</p>
                  <p className="text-xs font-mono text-muted">{cart.id}</p>
                </div>
              </div>

              {cart.items.length === 0 ? (
                <div className="border border-dashed border-foreground bg-white px-10 py-16 text-center">
                  <p className="text-muted">This cart is currently empty.</p>
                </div>
              ) : (
                <div className="border border-foreground bg-white">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-foreground bg-[#faf9f7] text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-sm text-foreground">
                      {cart.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-5 flex items-center gap-4">
                            <div className="h-12 w-12 flex-shrink-0 bg-[#f0ede8] border border-line">
                              {item.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              {item.variantName && (
                                <p className="text-[10px] uppercase tracking-widest text-muted">{item.variantName}</p>
                              )}
                              {!item.isActive && (
                                <p className="text-[9px] font-bold uppercase text-red-600 mt-1">Inactive</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">{formatUsdFromCents(item.price)}</td>
                          <td className="px-6 py-5">{item.quantity}</td>
                          <td className="px-6 py-5 text-right font-medium">
                            {formatUsdFromCents(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-foreground bg-[#faf9f7] font-bold">
                        <td colSpan={3} className="px-6 py-5 text-[10px] uppercase tracking-[0.3em]">Subtotal</td>
                        <td className="px-6 py-5 text-right text-lg">{formatUsdFromCents(cart.subtotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: Customer & Actions */}
          <div className="space-y-8">
            {/* Customer Info */}
            <section className="border border-foreground bg-white p-6 space-y-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted border-b border-line pb-4">
                Customer Info
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Name</p>
                  <p className="text-sm font-semibold">{cart.name}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Email</p>
                  <p className="text-sm">{cart.email}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Phone</p>
                  <p className="text-sm">{cart.phone}</p>
                </div>
                <div className="pt-4 border-t border-line space-y-2">
                  <p className="text-[10px] text-muted">Created: {formatDate(cart.createdAt)}</p>
                  <p className="text-[10px] text-muted">Last Active: {formatDate(cart.lastActiveAt)}</p>
                </div>
              </div>
            </section>

            {/* Management Actions */}
            <section className="border border-foreground bg-white p-6 space-y-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted border-b border-line pb-4">
                Management
              </p>
              
              <form action={adminUpdateCartStatusAction} className="space-y-4">
                <input type="hidden" name="cartId" value={cart.id} />
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Status</span>
                  <select
                    name="status"
                    defaultValue={cart.status}
                    className="w-full border border-foreground bg-transparent px-3 py-2 text-sm text-foreground outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="abandoned">Abandoned</option>
                    <option value="converted">Converted</option>
                  </select>
                </label>
                <button type="submit" className="w-full border border-foreground px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-foreground hover:text-white transition-colors">
                  Update Status
                </button>
              </form>

              <form action={adminUpdateCartNotesAction} className="space-y-4 pt-4 border-t border-line">
                <input type="hidden" name="cartId" value={cart.id} />
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Internal Notes</span>
                  <textarea
                    name="notes"
                    defaultValue={cart.notes ?? ''}
                    rows={4}
                    placeholder="Add notes about this customer..."
                    className="w-full border border-foreground bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-pink-dark resize-none"
                  />
                </label>
                <button type="submit" className="w-full border border-foreground px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-foreground hover:text-white transition-colors">
                  Save Notes
                </button>
              </form>

              <div className="pt-6 border-t border-line space-y-3">
                <form action={adminClearCartAction} onSubmit={(e) => !confirm('Clear all items from this cart?') && e.preventDefault()}>
                  <input type="hidden" name="cartId" value={cart.id} />
                  <button type="submit" className="w-full border border-amber-200 text-amber-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-50 transition-colors">
                    Clear Items
                  </button>
                </form>
                <form action={adminDeleteCartAction} onSubmit={(e) => !confirm('Permanently delete this cart?') && e.preventDefault()}>
                  <input type="hidden" name="cartId" value={cart.id} />
                  <button type="submit" className="w-full border border-red-200 text-red-600 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-50 transition-colors">
                    Delete Cart
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
