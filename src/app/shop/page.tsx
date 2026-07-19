import type { Metadata } from 'next';

import ShopClient from './ShopClient';

import { listStoreProducts } from '@/lib/catalog';

interface ShopPageProps {
  searchParams?: Promise<{
    category?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop Professional Lash Supplies',
  description:
    'Browse professional lash extensions, aftercare, adhesives, and beauty tools from Lashmealex.',
  alternates: {
    canonical: '/shop',
  },
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedSearchParams = await searchParams;
  const products = await listStoreProducts();

  return (
    <ShopClient
      initialProducts={products}
      initialCategory={resolvedSearchParams?.category}
    />
  );
}
