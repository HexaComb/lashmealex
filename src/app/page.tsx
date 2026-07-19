import type {Metadata} from "next";
import Link from "next/link";

import HeaderShell from "../components/HeaderShell";
import {FadeIn} from "../components/LoadingStates";
import {getHeroProduct, listStoreProducts} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lashmealex — Lashes, Aftercare & Beauty Essentials",
  description:
    "Shop professional-grade lashes, adhesives, aftercare, and beauty tools from Lashmealex. Curated by a Fresno lash artist. Same-day pickup in Fresno, CA.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Lashmealex — Lashes, Aftercare & Beauty Essentials",
    description:
      "Shop professional-grade lashes, adhesives, aftercare, and beauty tools from Lashmealex. Curated by a Fresno lash artist. Same-day pickup in Fresno, CA.",
    url: "/",
    type: "website",
  },
};

export default async function Home() {
  const storeProducts = await listStoreProducts();
  const heroProduct = await getHeroProduct();

  return (
    <div className="min-h-screen bg-background">
      <HeaderShell products={storeProducts} />

      <main>
        {/* Hero */}
        <section className="px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="grid min-h-[20.5rem] border border-foreground lg:min-h-[20.5rem] lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex flex-col border-b border-foreground bg-white px-6 py-10 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">
                Lashmealex
              </p>
              <h1 className="mt-6 font-display text-[clamp(3rem,6vw,5.5rem)] font-medium leading-none tracking-[-0.02em] text-foreground text-balance">
                Your Lash <br />
                Essentials.
              </h1>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/shop"
                  className="btn-primary min-w-[200px] !bg-pink-dark !border-pink-dark hover:!bg-foreground hover:!border-foreground"
                >
                  Shop Now
                </Link>
                <Link
                  href={heroProduct ? `/products/${heroProduct.slug}` : "/shop"}
                  className="btn-secondary min-w-[200px]"
                >
                  See the Product
                </Link>
              </div>
              <div className="mt-auto grid gap-5 border-t border-line pt-7 sm:grid-cols-3">
                {["Premium Quality", "Salon Curated", "Same-Day Pickup"].map((item) => (
                  <div key={item}>
                    <p className="m-0 text-[10px] font-bold text-pink-dark">—</p>
                    <p className="mt-3 text-[11px] font-bold uppercase leading-normal tracking-[0.08em] text-muted">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex min-h-52 flex-col bg-photo-well">
              <div className="absolute inset-0 overflow-hidden">
                {heroProduct?.image ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${heroProduct.image}')` }}
                  />
                ) : (
                  <img
                    src="/assets/IMG_5806.jpeg"
                    alt="Lashmealex lash collection"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent to-55%" />
              </div>
              <div className="relative z-10 mt-auto border-t border-foreground bg-white p-4">
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">
                  Featured
                </p>
                <h2 className="mt-2 font-display text-[1.75rem] font-medium tracking-[-0.02em] text-foreground">
                  {heroProduct?.name ?? "Lash Extensions."}
                </h2>
                <p className="mt-2 text-[13px] leading-[1.55] text-muted">
                  {heroProduct?.description ||
                    "Browse our full range of curls, diameters, and lengths — each one stocked individually so you always know exactly what's available."}
                </p>
                <Link
                  href={heroProduct ? `/products/${heroProduct.slug}` : "/shop"}
                  className="btn-ghost mt-5 w-fit"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Brand values */}
        <section className="px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
          <div className="w-full">
            <FadeIn>
              <div className="mb-16">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">
                  Why Lashmealex
                </p>
                <h2 className="mt-8 font-display text-[3rem] font-medium leading-none tracking-tighter text-foreground sm:text-[4rem]">
                  Built for Artists.
                </h2>
              </div>
            </FadeIn>

            <div className="grid gap-0 border border-foreground lg:grid-cols-3">
              {[
                {
                  label: "Premium Quality",
                  body: "Every tray is hand-selected by a working lash artist. If it wouldn't go on a client, it doesn't go on the shelf.",
                },
                {
                  label: "Exact Inventory",
                  body: "Stock is updated in real time. No phantom listings, no backorders — you only see what's actually on hand.",
                },
                {
                  label: "Same-Day Pickup",
                  body: "Order online and pick up the same day at the Fresno salon. No shipping wait, no guesswork.",
                },
              ].map((item, index) => (
                <FadeIn key={item.label} delay={index * 0.08}>
                  <div className="flex flex-col justify-between border-b border-foreground bg-white p-10 sm:p-12 lg:border-b-0 lg:border-r last:border-r-0 last:border-b-0">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-pink-dark">
                        0{index + 1}
                      </p>
                      <h3 className="mt-8 font-display text-3xl font-medium tracking-tight text-foreground">
                        {item.label}
                      </h3>
                      <p className="mt-6 text-sm leading-relaxed text-muted">{item.body}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Photo strip */}
        <section className="overflow-hidden border-y border-foreground">
          <div className="flex">
            {[
              { src: "/assets/IMG_5801.jpeg", alt: "Velvet lash collection" },
              { src: "/assets/IMG_5852.jpeg", alt: "Lash artist at work" },
              { src: "/assets/IMG_5796.jpeg", alt: "Lashmealex cashmere collection" },
              { src: "/assets/IMG_2844.jpeg", alt: "Lashmealex packaging" },
            ].map((img, i) => (
              <div key={img.src} className={`relative h-72 flex-1 overflow-hidden sm:h-96 ${i > 0 ? "border-l border-foreground" : ""}`}>
                <img
                  src={img.src}
                  alt={img.alt}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Visit the salon */}
        <section className="px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
          <div className="w-full">
            <FadeIn>
              <div className="grid border border-foreground lg:grid-cols-[1fr_1fr_0.6fr]">
                <div className="bg-white px-10 py-16 sm:px-16 sm:py-20 lg:border-r lg:border-foreground">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">
                    Fresno, CA
                  </p>
                  <h2 className="mt-10 font-display text-[3rem] font-medium leading-[1] tracking-tighter text-foreground sm:text-[4rem]">
                    Visit the Salon.
                  </h2>
                  <p className="mt-10 max-w-xl text-lg leading-relaxed text-muted">
                    Book a lash appointment through GlossGenius, or place a product order for pickup at our Fresno salon. Pickup availability is confirmed with your order during business hours.
                  </p>

                  <div className="mt-14 flex flex-col gap-3 sm:flex-row">
                    <a
                      href="https://lashmealex.glossgenius.com/services"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary min-w-[200px]"
                    >
                      Book an Appointment
                    </a>
                    <Link href="/shipping-pickup" className="btn-secondary min-w-[200px]">
                      Pickup Details
                    </Link>
                  </div>
                </div>

                <div className="bg-foreground p-10 text-background sm:p-16">
                  <div className="space-y-16">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-light opacity-80">
                        Hours
                      </p>
                      <p className="mt-6 font-display text-3xl font-medium tracking-tight">
                        Mon, Wed – Sat
                      </p>
                      <p className="mt-3 text-sm leading-6 text-white/70">Mon 9:30–4:30 · Wed–Fri until 5 · Sat until noon</p>
                    </div>
                    <div className="h-px bg-white/15" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-light opacity-80">
                        Location
                      </p>
                      <p className="mt-6 font-display text-3xl font-medium tracking-tight">
                        5130 N Blackstone Ave
                      </p>
                      <a href="https://www.google.com/maps/dir/?api=1&destination=5130+N+Blackstone+Ave,+Fresno,+CA+93710" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-white/70 underline underline-offset-4 transition-colors hover:text-white">Get directions</a>
                    </div>
                    <div className="h-px bg-white/15" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-light opacity-80">
                        Online Orders
                      </p>
                      <p className="mt-6 font-display text-3xl font-medium tracking-tight">
                        Pickup Only
                      </p>
                      <p className="mt-3 text-sm leading-6 text-white/70">Shipping is not offered at checkout. Wait for your ready-for-pickup confirmation before visiting.</p>
                    </div>
                  </div>
                </div>

                <div className="relative hidden overflow-hidden border-l border-foreground lg:block">
                  <img
                    src="/assets/IMG_5796.jpeg"
                    alt="Lashmealex lash tray"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground bg-[#faf7f5] px-6 py-16 sm:px-12 lg:px-20">
        <div className="grid gap-16 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-display text-3xl tracking-tighter text-foreground">lashmealex</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Professional lashes and beauty essentials, curated in Fresno, CA.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">Shop</p>
            <div className="mt-6 space-y-4">
              <Link href="/shop" className="block text-sm text-muted transition-colors hover:text-foreground">
                All Products
              </Link>
              <Link href="/shop?category=lashes" className="block text-sm text-muted transition-colors hover:text-foreground">
                Lashes
              </Link>
              <Link href="/admin" className="block text-sm text-muted transition-colors hover:text-foreground">
                Owner Dashboard
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">Info</p>
            <div className="mt-6 space-y-4">
              <a
                href="https://lashmealex.glossgenius.com/"
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-muted transition-colors hover:text-foreground"
              >
                Book Appointment
              </a>
              <Link href="/shipping-pickup" className="block text-sm text-muted transition-colors hover:text-foreground">
                Shipping & Pickup
              </Link>
              <Link href="/contact" className="block text-sm text-muted transition-colors hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">Connect</p>
            <div className="mt-6 space-y-4">
              <a
                href="https://instagram.com/lashmealex"
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-muted transition-colors hover:text-foreground"
              >
                Instagram
              </a>
              <a
                href="https://lashmealex.glossgenius.com/"
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-muted transition-colors hover:text-foreground"
              >
                GlossGenius
              </a>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-line pt-8">
          <p className="text-xs text-muted">&copy; {new Date().getFullYear()} Lashmealex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
