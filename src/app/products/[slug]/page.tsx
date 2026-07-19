import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProductDetailClient from './ProductDetailClient';
import { getRelatedStoreProducts, getStoreProductBySlug } from '@/lib/catalog';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getStoreProductBySlug(resolvedParams.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    };
  }

  return {
    title: product.name,
    description: product.description || 'Premium lash products',
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.description || 'Premium lash products',
      images: product.image ? [product.image] : [],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || 'Premium lash products',
      images: product.image ? [product.image] : []
    }
  };
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await getStoreProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedStoreProducts(product);

  const formattedProduct = {
    ...product,
    specifications: {
      product: product.parentProductName,
      variants: `${product.variants.length} options`,
      inventory: `${product.inventory} trays`,
      category: product.category,
    },
  };

  return <ProductDetailClient product={formattedProduct} relatedProducts={relatedProducts} />;
}
