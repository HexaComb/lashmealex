import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminCartStats, listAdminCarts } from '@/lib/cart';
import { formatUsdFromCents } from '@/lib/money';
import { logoutAction } from '../auth-actions';
import { type CartStatus } from '@/lib/cart-constants';
import AdminHeader from '@/components/AdminHeader';
import {
  AdminActionLink,
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

function cartTone(status: string) {
  if (status === 'active') return 'success';
  if (status === 'abandoned') return 'warning';
  return 'info';
}

export default async function AdminCartsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = params.status as CartStatus | undefined;
  const search = params.search;

  const [carts, stats] = await Promise.all([
    listAdminCarts({ status, search }),
    getAdminCartStats(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader logoutAction={logoutAction} />

      <AdminPageShell>
        <AdminPageHeader
          eyebrow="Carts"
          title="Customer carts"
          description="Track active, abandoned, and converted carts. Use search when following up with a customer."
          actions={<AdminActionLink href="/admin">Back to overview</AdminActionLink>}
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminStat label="Active value" value={formatUsdFromCents(stats.totalValue)} detail="current cart value" />
          <AdminStat label="Active carts" value={stats.activeCount} detail="customers with open carts" />
          <AdminStat label="Abandoned" value={stats.abandonedCount} detail="carts needing review" />
        </section>

        <AdminSection title="Cart list" description="Filter by status or search by customer name and email.">
          <div className="flex flex-col gap-4 border-b border-line p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/carts"
                className={`border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
                  !status ? 'border-foreground bg-foreground text-[#faf9f6]' : 'border-line bg-white text-muted hover:border-foreground hover:text-foreground'
                }`}
              >
                All
              </Link>
              <Link
                href="/admin/carts?status=active"
                className={`border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
                  status === 'active' ? 'border-foreground bg-foreground text-[#faf9f6]' : 'border-line bg-white text-muted hover:border-foreground hover:text-foreground'
                }`}
              >
                Active
              </Link>
              <Link
                href="/admin/carts?status=abandoned"
                className={`border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
                  status === 'abandoned' ? 'border-foreground bg-foreground text-[#faf9f6]' : 'border-line bg-white text-muted hover:border-foreground hover:text-foreground'
                }`}
              >
                Abandoned
              </Link>
            </div>

            <form className="w-full max-w-sm">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search name or email"
                className={adminInputClass()}
              />
              {status ? <input type="hidden" name="status" value={status} /> : null}
            </form>
          </div>

          {carts.length === 0 ? (
            <AdminEmptyState title="No carts found" description="Adjust the filters or search terms." />
          ) : (
            <AdminTableWrap minWidth="min-w-[780px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-foreground bg-background text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Subtotal</th>
                    <th className="px-5 py-3">Last activity</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm text-foreground">
                  {carts.map((cart) => (
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
                      <td className="px-5 py-4 text-xs text-muted">{formatDate(cart.lastActiveAt)}</td>
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
      </AdminPageShell>
    </div>
  );
}
