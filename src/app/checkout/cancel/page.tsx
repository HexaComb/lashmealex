import Link from "next/link";

import { ReleaseCheckoutLock } from "./ReleaseCheckoutLock";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <ReleaseCheckoutLock />
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="font-display text-5xl font-medium text-foreground">Order Cancelled</h1>
          <p className="text-sm text-muted leading-relaxed">
            No worries — your cart is still saved. Come back whenever you&apos;re ready.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/shop" className="btn-primary w-full block py-5">
            Return to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
