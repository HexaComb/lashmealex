import { notFound } from 'next/navigation';

import AdminHeader from '@/components/AdminHeader';
import AdminFieldLabel from '@/components/admin/AdminFieldLabel';
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
import { getAdminOrder } from '@/lib/orders';
import { formatUsdFromCents } from '@/lib/money';
import { isOrderFulfillmentStatus, orderFulfillmentCopy } from '@/lib/order-status';
import { requireAdmin } from '@/lib/admin-auth';
import { logoutAction } from '../../auth-actions';
import { updateOrderAction } from '../../actions';

export const dynamic = 'force-dynamic';

const paymentLabel: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

function formatDate(value: Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

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

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const orderResult = await getAdminOrder((await params).id);
  if (!orderResult) notFound();

  const { order, items } = orderResult;
  const fulfillmentStatus = isOrderFulfillmentStatus(order.fulfillmentStatus) ? order.fulfillmentStatus : 'received';
  const mailto = `mailto:${order.customerEmail}?subject=${encodeURIComponent(`Lashmealex order ${order.id}`)}`;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader logoutAction={logoutAction} />
      <AdminPageShell>
        <div className="flex flex-wrap gap-3">
          <AdminActionLink href="/admin#orders">Back to orders</AdminActionLink>
          <AdminActionLink href="/admin" tone="ghost">Overview</AdminActionLink>
        </div>

        <AdminPageHeader
          eyebrow="Order details"
          title={order.customerName ?? order.customerEmail}
          description={`Order ${order.id}. Created ${formatDate(order.createdAt)}.`}
          actions={
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge tone={paymentTone(order.status)}>{paymentLabel[order.status] ?? order.status}</AdminStatusBadge>
              <AdminStatusBadge tone={fulfillmentTone(fulfillmentStatus)}>
                {orderFulfillmentCopy[fulfillmentStatus]?.label ?? fulfillmentStatus}
              </AdminStatusBadge>
            </div>
          }
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminStat label="Total" value={formatUsdFromCents(order.total)} detail="order total" />
          <AdminStat label="Items" value={items.reduce((sum, item) => sum + item.quantity, 0)} detail="units ordered" />
          <AdminStat label="Updated" value={<span className="text-base">{formatDate(order.updatedAt)}</span>} detail="last change" />
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <AdminSection title="Products" description="The products and prices captured when this order was placed.">
            {items.length === 0 ? (
              <AdminEmptyState title="No line items" description="This order does not have any recorded products." />
            ) : (
              <AdminTableWrap minWidth="min-w-[620px]">
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
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="flex items-center gap-4 px-5 py-4">
                          <div className="h-12 w-12 shrink-0 border border-line bg-photo-well">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            {item.variantName ? <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{item.variantName}</p> : null}
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
                      <td colSpan={3} className="px-5 py-4 text-[10px] uppercase tracking-[0.24em]">Total</td>
                      <td className="px-5 py-4 text-right text-lg">{formatUsdFromCents(order.total)}</td>
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
                  <p className="mt-1 font-semibold">{order.customerName ?? 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Email</p>
                  <p className="mt-1 break-all">{order.customerEmail}</p>
                </div>
                <AdminActionLink href={mailto} tone="primary" className="w-full text-center">Contact customer</AdminActionLink>
              </div>
            </AdminSection>

            <AdminSection title="Order status" description="Update payment and fulfillment progress.">
              <form action={updateOrderAction} className="space-y-4 p-5">
                <input type="hidden" name="orderId" value={order.id} />
                <label className="block space-y-1.5">
                  <AdminFieldLabel>Payment</AdminFieldLabel>
                  <select name="status" defaultValue={order.status} className={adminInputClass()}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <AdminFieldLabel>Fulfillment</AdminFieldLabel>
                  <select name="fulfillmentStatus" defaultValue={fulfillmentStatus} className={adminInputClass()}>
                    <option value="received">Received</option>
                    <option value="working_on_it">Working on it</option>
                    <option value="ready_for_pickup">Ready for Pickup</option>
                    <option value="picked_up">Picked up</option>
                  </select>
                </label>
                <AdminButton type="submit" className="w-full">Save status</AdminButton>
              </form>
            </AdminSection>
          </div>
        </div>
      </AdminPageShell>
    </div>
  );
}
