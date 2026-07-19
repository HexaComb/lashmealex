import { notFound } from 'next/navigation';

import { getPublicOrderStatus } from '@/lib/orders';
import { isOrderFulfillmentStatus, ORDER_FULFILLMENT_STATUSES, orderFulfillmentCopy } from '@/lib/order-status';
import { formatUsdFromCents } from '@/lib/money';

export const dynamic = 'force-dynamic';

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

export default async function OrderStatusPage({ params }: { params: Promise<{ statusToken: string }> }) {
  const { statusToken } = await params;
  const order = await getPublicOrderStatus(statusToken);
  if (!order || !isOrderFulfillmentStatus(order.fulfillmentStatus)) notFound();

  const currentIndex = ORDER_FULFILLMENT_STATUSES.indexOf(order.fulfillmentStatus);
  const eventsByStatus = new Map(order.events.map((event) => [event.status, event]));

  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-pink-dark">Lashmealex order</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-[-0.02em] text-foreground sm:text-6xl">Pickup status</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">Your order is in the hands of our Fresno salon team. We’ll email you whenever this status changes.</p>

        <section className="mt-8 border border-foreground bg-white p-5 sm:p-7" aria-labelledby="current-status-heading">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">Current status</p>
          <h2 id="current-status-heading" className="mt-2 text-xl font-semibold text-foreground">{orderFulfillmentCopy[order.fulfillmentStatus].label}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{orderFulfillmentCopy[order.fulfillmentStatus].description}</p>
          <div className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Order placed {formatDate(order.createdAt)} · {formatUsdFromCents(order.total)}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="progress-heading">
          <h2 id="progress-heading" className="text-sm font-semibold text-foreground">Order progress</h2>
          <ol className="mt-4 divide-y divide-line border-y border-line bg-white">
            {ORDER_FULFILLMENT_STATUSES.map((status, index) => {
              const event = eventsByStatus.get(status);
              const complete = index <= currentIndex;
              const copy = orderFulfillmentCopy[status];
              return (
                <li key={status} className="flex gap-4 px-5 py-4 sm:px-6">
                  <span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border text-[10px] font-bold ${complete ? 'border-foreground bg-foreground text-white' : 'border-line text-muted'}`}>{complete ? '✓' : index + 1}</span>
                  <div>
                    <p className={complete ? 'text-sm font-semibold text-foreground' : 'text-sm font-medium text-muted'}>{copy.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{event ? formatDate(event.createdAt) : copy.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="mt-8 text-xs leading-5 text-muted">Questions about pickup? Reply to your order email and the Lashmealex team will help.</p>
      </div>
    </main>
  );
}
