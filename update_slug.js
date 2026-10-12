const fs = require('fs');
const path = '/home/marcochavez/Desktop/lashmealex/apps/storefront/src/app/products/[slug]/page.tsx';

const newCode = \`import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function fetchMedusaProduct(handle: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';
    
    // In Medusa v2, you query products using handles to match the slug
    const url = \`\${backendUrl}/store/products?handle=\${handle}&fields=*variants,*categories\`;
    const res = await fetch(url, {
      headers: {
        'x-publishable-api-key': apiKey,
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error(\`Failed to fetch from Medusa: \${res.statusText}\`);
    }

    const data = await res.json();
    if (data.products && data.products.length > 0) {
      return data.products[0];
    }
  } catch (err) {
    console.error("error fetching medusa product", err);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const medusaProduct = await fetchMedusaProduct(resolvedParams.slug);
  
  if (!medusaProduct) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    };
  }

  return {
    title: \`\${medusaProduct.title} | Cheri Cosmetics\`,
    description: medusaProduct.description || 'Premium lash products',
    openGraph: {
      title: medusaProduct.title,
      description: medusaProduct.description || 'Premium lash products',
      images: medusaProduct.thumbnail ? [medusaProduct.thumbnail] : [],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: medusaProduct.title,
      description: medusaProduct.description || 'Premium lash products',
      images: medusaProduct.thumbnail ? [medusaProduct.thumbnail] : []
    }
  };
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const medusaProduct = await fetchMedusaProduct(resolvedParams.slug);

  if (!medusaProduct) {
    notFound();
  }

  // Format the product to match our frontend's ProductDetailClient expected structure
  const formattedProduct = {
    id: medusaProduct.id,
    slug: medusaProduct.handle,
    name: medusaProduct.title,
    price: medusaProduct.variants?.[0]?.calculated_price?.calculated_amount || medusaProduct.variants?.[0]?.prices?.[0]?.amount || 15,
    description: medusaProduct.description || '',
    images: medusaProduct.images?.map((i: any) => i.url) || [medusaProduct.thumbnail || '/api/placeholder/600/600'],
    category: medusaProduct.categories?.[0]?.name || 'Lashes',
    rating: 5.0,
    reviewCount: 0,
    inStock: true,
    features: ['Premium quality handmade items', 'Cruelty-free'],
    specifications: {},
    seo: { title: medusaProduct.title, description: medusaProduct.description || '' },
    variants: medusaProduct.variants || [],
    options: medusaProduct.options || []
  };

  return <ProductDetailClient product={formattedProduct} />;
}
\`;

fs.writeFileSync(path, newCode, 'utf8');
console.log("Successfully replaced server component page to fetch from Medusa.");
