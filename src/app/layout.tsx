import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ConsentProvider } from "@/context/ConsentContext";
import CookieBanner from "@/components/CookieBanner";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://lashmealex.com"),
  title: {
    default: "Cheri Cosmetics",
    template: "%s | Cheri Cosmetics",
  },
  description:
    "Shop professional lashes, adhesives, aftercare, and beauty tools from Cheri Cosmetics. Curated by a Fresno lash artist.",
  keywords: [
    "Cheri Cosmetics",
    "lash supplies",
    "lash extensions",
    "lash adhesive",
    "lash aftercare",
    "beauty products",
    "Fresno lash artist",
    "same-day pickup",
    "eyelash salon Fresno",
  ],
  openGraph: {
    siteName: "Cheri Cosmetics",
    title: "Cheri Cosmetics",
    description:
      "Shop professional lashes, adhesives, aftercare, and beauty tools. Curated by a Fresno lash artist.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/assets/IMG_5806.jpeg",
        width: 1200,
        height: 630,
        alt: "Cheri Cosmetics — Professional Lash Products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cheri Cosmetics",
    description:
      "Professional lashes, adhesives, aftercare, and beauty essentials from Cheri Cosmetics.",
    images: ["/assets/IMG_5806.jpeg"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakartaSans.variable} ${cormorant.variable}`}>
      <body>
        <ConsentProvider>
          <CartProvider>{children}</CartProvider>
          <CookieBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}
