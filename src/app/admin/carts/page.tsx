import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminCartStats, listAdminCarts } from '@/lib/cart';
import { formatUsdFromCents } from '@/lib/money';
import { logoutAction } from '../auth-actions';
import { type CartStatus } from '@/lib/cart-constants';
import AdminHeader from '@/components/AdminHeader';

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

const statusStyle: Record<string, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  abandoned: 'border-amber-200 bg-amber-50 text-amber-700',
  converted: 'border-blue-200 bg-blue-50 text-blue-700',
};

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
    <div className="min-h-screen bg-[#faf9f7]">
      <AdminHeader logoutAction={logoutAction} />

      <div className="mx-auto max-w-7xl space-y-14 px-6 py-10 sm:px-12 lg:px-20">
        {/* Page Header */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">Sales</p>
            <h1 className="mt-3 font-display text-5xl tracking-tighter text-foreground">Shopping Carts</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              Track active and abandoned customer sessions.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="border border-foreground bg-white px-6 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">Active Value</p>
              <p className="mt-1 font-display text-2xl text-foreground">{formatUsdFromCents(stats.totalValue)}</p>
            </div>
            <div className="border border-foreground bg-white px-6 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">Abandoned</p>
              <p className="mt-1 font-display text-2xl text-foreground">{stats.abandonedCount}</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-8">
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/admin/carts" 
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border ${!status ? 'bg-foreground text-white border-foreground' : 'bg-white text-muted border-foreground/10 hover:border-foreground'}`}
            >
              All
            </Link>
            <Link 
              href="/admin/carts?status=active" 
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border ${status === 'active' ? 'bg-foreground text-white border-foreground' : 'bg-white text-muted border-foreground/10 hover:border-foreground'}`}
            >
              Active
            </Link>
            <Link 
              href="/admin/carts?status=abandoned" 
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border ${status === 'abandoned' ? 'bg-foreground text-white border-foreground' : 'bg-white text-muted border-foreground/10 hover:border-foreground'}`}
            >
              Abandoned
            </Link>
          </div>

          <form className="relative max-w-sm w-full">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="w-full border border-foreground bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-pink-dark"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
        </div>

        {/* Carts List */}
        {carts.length === 0 ? (
          <div className="border border-dashed border-foreground bg-white px-10 py-24 text-center">
            <p className="font-display text-2xl text-foreground">No carts found</p>
            <p className="mt-2 text-sm text-muted">
              Adjust your filters or wait for more customer sessions.
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
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm text-foreground">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-[#faf9f7]">
                    <td className="px-6 py-5">
                      <p className="font-semibold">{cart.name}</p>
                      <p className="text-xs text-muted">{cart.email}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${statusStyle[cart.status]}`}>
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
      </div>
    </div>
  );
}
