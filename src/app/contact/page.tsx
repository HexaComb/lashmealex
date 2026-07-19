import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Mail, MapPin, MessageCircle } from 'lucide-react';

import HeaderShell from '@/components/HeaderShell';

const contactFormUrl = 'https://lashmealex.glossgenius.com/contact';
const directionsUrl = 'https://www.google.com/maps/dir/?api=1&destination=5130+N+Blackstone+Ave,+Fresno,+CA+93710';
const instagramUrl = 'https://www.instagram.com/lashmealex';

export const metadata: Metadata = {
  title: 'Contact Lashmealex',
  description: 'Contact Lashmealex, visit the Fresno salon, or find directions for appointment and pickup questions.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderShell />
      <main className="px-6 py-14 sm:px-12 lg:px-20 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-dark">Lashmealex in Fresno</p>
          <div className="mt-4 grid border border-foreground bg-white lg:grid-cols-[1.1fr_0.9fr]">
            <section className="px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
              <h1 className="max-w-xl font-display text-5xl font-medium leading-none tracking-[-0.02em] text-foreground text-balance sm:text-6xl">
                Get in touch.
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-muted text-pretty">
                Questions about appointments, products, or a pickup order? Send a note through our booking contact form or message us on Instagram. We&apos;ll help you find the right next step.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href={contactFormUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  Contact Alexandria <ExternalLink size={15} aria-hidden="true" />
                </a>
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                  <MessageCircle size={15} aria-hidden="true" /> Instagram
                </a>
              </div>
            </section>
            <aside className="border-t border-foreground bg-[#faf7f5] px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-12 lg:py-14">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">Salon location</p>
              <address className="mt-5 not-italic text-sm font-semibold leading-7 text-foreground">
                5130 N Blackstone Ave<br />
                Fresno, CA 93710
              </address>
              <a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 border-b border-foreground pb-1 text-xs font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-pink-dark hover:text-pink-dark">
                <MapPin size={15} aria-hidden="true" /> Get directions <ExternalLink size={13} aria-hidden="true" />
              </a>
              <div className="mt-10 border-t border-line pt-6">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-muted"><Mail size={14} aria-hidden="true" /> Need help?</p>
                <p className="mt-3 text-sm leading-6 text-muted">For product-pickup timing, use the contact form and include your order details.</p>
              </div>
            </aside>
          </div>
          <p className="mt-6 text-sm text-muted">Looking for order collection details? Visit <Link href="/shipping-pickup" className="font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-pink-dark">Shipping &amp; Pickup</Link>.</p>
        </div>
      </main>
    </div>
  );
}
