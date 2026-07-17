import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { getCartWithItems } from '@/lib/cart';
import { formatUsdFromCents } from '@/lib/money';
import { logoutAction } from '../../auth-actions';
import { adminClearCartAction, adminDeleteCartAction, adminUpdateCartStatusAction, adminUpdateCartNotesAction } from '../../actions';
import AdminHeader from '@/components/AdminHeader';
import AdminFieldLabel from '@/components/admin/AdminFieldLabel';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import {
  AdminActionLink,
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  AdminSection,
  AdminStat,
  AdminStatusBadge,
  AdminTableWrap,
  adminInputClass,
} from '@/components/admin/AdminUI';

export const dynamic = 'force-dynamic';

const warningButtonClass =
  'w-full border border-amber-200 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 transition-colors hover:bg-amber-50';
const dangerButtonClass =
  'w-full border border-red-200 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-red-600 transition-colors hover:bg-red-50';

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
  } catch {
    return '—';
  }
}

function cartTone(status: string) {
  if (status === 'active') return 'success';
  if (status === 'abandoned') return 'warning';
  return 'info';
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
    <div className="min-h-screen bg-background">
      <AdminHeader logoutAction={logoutAction} />

      <AdminPageShell>
        <div className="flex flex-wrap gap-3">
          <AdminActionLink href="/admin/carts">Back to carts</AdminActionLink>
          <AdminActionLink href="/admin" tone="ghost">Overview</AdminActionLink>
        </div>

        <AdminPageHeader
          eyebrow="Cart"
          title={cart.name}
          description={`Cart ${cart.id}. Last active ${formatDate(cart.lastActiveAt)}.`}
          actions={<AdminStatusBadge tone={cartTone(cart.status)}>{cart.status}</AdminStatusBadge>}
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminStat label="Items" value={cart.itemCount} detail="cart quantity" />
          <AdminStat label="Subtotal" value={formatUsdFromCents(cart.subtotal)} detail="before checkout" />
          <AdminStat label="Created" value={<span className="text-base">{formatDate(cart.createdAt)}</span>} detail="cart start time" />
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <AdminSection title="Items" description="Products currently saved in this cart.">
            {cart.items.length === 0 ? (
              <AdminEmptyState title="Cart is empty" description="There are no products in this cart." />
            ) : (
              <AdminTableWrap minWidth="min-w-[720px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-foreground bg-background text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-sm text-foreground">
                    {cart.items.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-hover">
                        <td className="flex items-center gap-4 px-5 py-4">
                          <div className="h-12 w-12 shrink-0 border border-line bg-photo-well">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            {item.variantName ? <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{item.variantName}</p> : null}
                            {!item.isActive ? <AdminStatusBadge tone="danger">Inactive</AdminStatusBadge> : null}
                          </div>
                        </td>
                        <td className="px-5 py-4">{formatUsdFromCents(item.price)}</td>
                        <td className="px-5 py-4">{item.quantity}</td>
                        <td className="px-5 py-4 text-right font-medium">{formatUsdFromCents(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-foreground bg-background font-semibold">
                      <td colSpan={3} className="px-5 py-4 text-[10px] uppercase tracking-[0.24em]">Subtotal</td>
                      <td className="px-5 py-4 text-right text-lg">{formatUsdFromCents(cart.subtotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </AdminTableWrap>
            )}
          </AdminSection>

          <div className="space-y-6">
            <AdminSection title="Customer">
              <div className="space-y-4 p-5 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Name</p>
                  <p className="mt-1 font-semibold">{cart.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Email</p>
                  <p className="mt-1">{cart.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Phone</p>
                  <p className="mt-1">{cart.phone}</p>
                </div>
                <div className="space-y-1 border-t border-line pt-4 text-xs text-muted">
                  <p>Created: {formatDate(cart.createdAt)}</p>
                  <p>Updated: {formatDate(cart.updatedAt)}</p>
                  <p>Last active: {formatDate(cart.lastActiveAt)}</p>
                </div>
              </div>
            </AdminSection>

            <AdminSection title="Status and notes">
              <div className="space-y-5 p-5">
                <form action={adminUpdateCartStatusAction} className="space-y-4">
                  <input type="hidden" name="cartId" value={cart.id} />
                  <label className="block space-y-1.5">
                    <AdminFieldLabel>Status</AdminFieldLabel>
                    <select name="status" defaultValue={cart.status} className={adminInputClass()}>
                      <option value="active">Active</option>
                      <option value="abandoned">Abandoned</option>
                      <option value="converted">Converted</option>
                    </select>
                  </label>
                  <AdminButton type="submit" className="w-full">Update status</AdminButton>
                </form>

                <form action={adminUpdateCartNotesAction} className="space-y-4 border-t border-line pt-5">
                  <input type="hidden" name="cartId" value={cart.id} />
                  <label className="block space-y-1.5">
                    <AdminFieldLabel>Internal notes</AdminFieldLabel>
                    <textarea
                      name="notes"
                      defaultValue={cart.notes ?? ''}
                      rows={5}
                      placeholder="Add notes about this customer."
                      className={adminInputClass('resize-y')}
                    />
                  </label>
                  <AdminButton type="submit" className="w-full">Save notes</AdminButton>
                </form>
              </div>
            </AdminSection>

            <AdminSection title="Cart actions">
              <div className="space-y-3 p-5">
                <form action={adminClearCartAction}>
                  <input type="hidden" name="cartId" value={cart.id} />
                  <ConfirmSubmitButton message="Clear all items from this cart?" className={warningButtonClass}>
                    Clear items
                  </ConfirmSubmitButton>
                </form>
                <form action={adminDeleteCartAction}>
                  <input type="hidden" name="cartId" value={cart.id} />
                  <ConfirmSubmitButton message="Permanently delete this cart?" className={dangerButtonClass}>
                    Delete cart
                  </ConfirmSubmitButton>
                </form>
              </div>
            </AdminSection>
          </div>
        </div>
      </AdminPageShell>
    </div>
  );
}
