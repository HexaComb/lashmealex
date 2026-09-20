import Link from "next/link";
import type { Metadata } from "next";

import HeaderShell from "../../components/HeaderShell";

export const metadata: Metadata = {
  title: "Saved items",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderShell />
      <main className="w-full px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
        <div className="border border-dashed border-line py-32 text-center">
          <h1 className="mb-6 font-display text-4xl font-medium text-foreground">
            Saved lists aren&apos;t available
          </h1>
          <p className="mx-auto mb-12 max-w-md text-lg text-muted">
            This shop does not keep a wishlist. Browse the collection and add items
            directly to your bag.
          </p>
          <Link href="/shop" className="btn-primary min-w-[240px]">
            Shop the collection
          </Link>
        </div>
      </main>
    </div>
  );
}
