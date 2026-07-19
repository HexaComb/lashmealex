import type { Metadata } from 'next';
import Link from 'next/link';

import HeaderShell from '@/components/HeaderShell';

export const metadata: Metadata = {
  title: 'Store Policies',
  description: 'Lashmealex terms, privacy, returns, appointment cancellation, and pickup policies.',
  alternates: { canonical: '/policies' },
};

const contactUrl = 'https://lashmealex.glossgenius.com/contact';

function PolicySection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-foreground py-10 sm:py-12">
      <h2 className="font-display text-4xl font-medium tracking-[-0.02em] text-foreground text-balance">{title}</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-sm leading-7 text-muted">{children}</div>
    </section>
  );
}

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderShell />
      <main className="px-6 py-14 sm:px-12 lg:px-20 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-dark">Lashmealex policies</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-none tracking-[-0.02em] text-foreground text-balance sm:text-6xl">Clear terms before you order.</h1>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-muted">Last updated July 19, 2026. These policies apply to Lashmealex product orders and website use. Appointment services are booked through GlossGenius and have their own booking terms.</p>

          <nav aria-label="Policy sections" className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-y border-foreground py-4 text-xs font-bold uppercase tracking-[0.12em] text-foreground">
            <a href="#privacy" className="hover:text-pink-dark">Privacy</a>
            <a href="#terms" className="hover:text-pink-dark">Terms</a>
            <a href="#returns" className="hover:text-pink-dark">Returns &amp; refunds</a>
            <a href="#cancellation" className="hover:text-pink-dark">Cancellations</a>
            <a href="#pickup" className="hover:text-pink-dark">Pickup</a>
          </nav>

          <div className="mt-2">
            <PolicySection id="privacy" title="Privacy notice">
              <p>We collect the name, email address, and phone number you provide to start a cart or place an order. We also retain order, cart, and product-selection information needed to process collection, communicate order status, prevent duplicate payment processing, and operate the store.</p>
              <p>Payment is processed by Stripe. Order-status email is delivered through Resend. Cart and order records are stored through Convex. If you contact us through GlossGenius, your message is handled through that service. These providers process information only as needed to provide their services to Lashmealex.</p>
              <p>We do not sell personal information or use advertising cookies. Optional site analytics are disabled unless you accept the privacy notice; the analytics events do not include your name, email address, or phone number. Your consent choice is stored locally in your browser.</p>
              <p>You may ask questions about, request access to, request correction of, or request deletion of personal information we hold by using the <a href={contactUrl} target="_blank" rel="noreferrer" className="font-semibold text-foreground underline underline-offset-4">Lashmealex contact form</a>. We may need to verify your identity and may keep information required for completed transactions, security, or legal obligations.</p>
            </PolicySection>

            <PolicySection id="terms" title="Terms of service">
              <p>By using Lashmealex or placing an order, you agree to provide accurate order details and to use the store lawfully. Product availability, prices, and product details can change before checkout; the information shown at completed checkout controls that order.</p>
              <p>Product orders are pickup-only. We use Stripe to process payment and will send order-status communication when available. A completed payment does not promise an unconfirmed pickup time; please wait for a ready-for-pickup message before visiting the salon.</p>
              <p>These terms do not replace the booking policies that apply to lash appointments made through GlossGenius. For product-order questions, use the <a href={contactUrl} target="_blank" rel="noreferrer" className="font-semibold text-foreground underline underline-offset-4">contact form</a>.</p>
            </PolicySection>

            <PolicySection id="returns" title="Returns &amp; refunds">
              <p>Returns and refund requests for Lashmealex merchandise are reviewed directly with Alex on a case-by-case basis. A return or refund is not guaranteed.</p>
              <p>Before attempting to return an item, contact Alex through the <a href={contactUrl} target="_blank" rel="noreferrer" className="font-semibold text-foreground underline underline-offset-4">Lashmealex contact form</a> with your order details and the reason for your request. We will confirm whether a return, replacement, store credit, or refund is available for your order and provide next steps in writing.</p>
            </PolicySection>

            <PolicySection id="cancellation" title="Appointment cancellations">
              <p>Appointment deposits are non-refundable. The published Lashmealex booking policy states that a deposit may be transferred to one rescheduled appointment when the appointment is canceled at least 48 hours in advance and the reason is communicated before the canceled appointment. If you do not reschedule, the deposit is forfeited. No-shows must pay 50% of the missed service to rebook.</p>
              <p>This appointment policy applies to salon services booked through GlossGenius, not to product-order returns. For product orders, see Returns &amp; refunds above.</p>
            </PolicySection>

            <PolicySection id="pickup" title="Pickup policy">
              <p>Lashmealex product orders are collected at 5130 N Blackstone Ave, Fresno, CA 93710. Shipping is not offered at checkout. Pickup availability is confirmed during salon business hours: Monday 9:30 AM–4:30 PM; Wednesday 10 AM–5 PM; Thursday 11:30 AM–5 PM; Friday 10 AM–5 PM; and Saturday 9 AM–12 PM. The salon is closed Tuesday and Sunday.</p>
              <p>Bring your order confirmation when collecting. For detailed directions and collection steps, visit <Link href="/shipping-pickup" className="font-semibold text-foreground underline underline-offset-4">Shipping &amp; Pickup</Link>.</p>
            </PolicySection>
          </div>
        </div>
      </main>
    </div>
  );
}
