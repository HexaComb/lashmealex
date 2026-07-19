import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarClock, ExternalLink, MapPin, ShoppingBag } from 'lucide-react';

import HeaderShell from '@/components/HeaderShell';

const directionsUrl = 'https://www.google.com/maps/dir/?api=1&destination=5130+N+Blackstone+Ave,+Fresno,+CA+93710';
const bookingUrl = 'https://lashmealex.glossgenius.com/services';

const hours = [
  ['Monday', '9:30 AM – 4:30 PM'],
  ['Tuesday', 'Closed'],
  ['Wednesday', '10 AM – 5 PM'],
  ['Thursday', '11:30 AM – 5 PM'],
  ['Friday', '10 AM – 5 PM'],
  ['Saturday', '9 AM – 12 PM'],
  ['Sunday', 'Closed'],
];

export const metadata: Metadata = {
  title: 'Shipping & Pickup',
  description: 'Lashmealex is pickup-only. Find Fresno salon hours, directions, and pickup guidance before ordering.',
  alternates: { canonical: '/shipping-pickup' },
};

export default function ShippingPickupPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderShell />
      <main className="px-6 py-14 sm:px-12 lg:px-20 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-dark">Before you order</p>
          <div className="mt-4 grid border border-foreground bg-white lg:grid-cols-[1.05fr_0.95fr]">
            <section className="px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
              <h1 className="max-w-xl font-display text-5xl font-medium leading-none tracking-[-0.02em] text-foreground text-balance sm:text-6xl">
                Pickup, made clear.
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-muted text-pretty">
                Lashmealex orders are collected at our Fresno salon. Shipping is not offered at checkout, so you&apos;ll always know your order is headed to one local pickup point.
              </p>
              <ol className="mt-10 divide-y divide-line border-y border-foreground">
                {[
                  ['Place your order', 'Add your products and complete checkout online.'],
                  ['Watch for confirmation', 'We&apos;ll contact you when your order is ready for collection.'],
                  ['Collect at the salon', 'Bring your order confirmation to 5130 N Blackstone Ave during business hours.'],
                ].map(([title, copy], index) => (
                  <li key={title} className="grid grid-cols-[2rem_1fr] gap-4 py-5">
                    <span className="text-xs font-bold text-pink-dark">0{index + 1}</span>
                    <div><h2 className="text-sm font-semibold text-foreground">{title}</h2><p className="mt-1 text-sm leading-6 text-muted">{copy}</p></div>
                  </li>
                ))}
              </ol>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/shop" className="btn-primary"><ShoppingBag size={15} aria-hidden="true" /> Shop products</Link>
                <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn-secondary"><MapPin size={15} aria-hidden="true" /> Directions <ExternalLink size={13} aria-hidden="true" /></a>
              </div>
            </section>
            <aside className="border-t border-foreground bg-[#faf7f5] px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-12 lg:py-14">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-muted"><CalendarClock size={14} aria-hidden="true" /> Pickup hours</p>
              <dl className="mt-5 divide-y divide-line border-y border-line">
                {hours.map(([day, time]) => <div key={day} className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="font-semibold text-foreground">{day}</dt><dd className="text-right text-muted">{time}</dd></div>)}
              </dl>
              <div className="mt-8 border-t border-line pt-6">
                <p className="text-sm font-semibold text-foreground">Same-day pickup</p>
                <p className="mt-2 text-sm leading-6 text-muted">Availability is confirmed with your order during salon hours. A fixed same-day cutoff is not published, so please wait for your ready-for-pickup confirmation before heading over.</p>
              </div>
              <a href={bookingUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground underline underline-offset-4 transition-colors hover:text-pink-dark">Booking a lash appointment? Book a service <ExternalLink size={13} aria-hidden="true" /></a>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
