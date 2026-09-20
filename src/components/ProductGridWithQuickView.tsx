'use client';

import { useState } from 'react';
import ProductCard, { type ProductCardProduct } from './ProductCard';
import QuickViewModal from './QuickViewModal';
import { FadeIn } from './LoadingStates';
import { useCart } from '@/context/CartContext';
import { resolveSellableCartVariant, toCartLine } from '@/lib/storefront-product';

interface ProductGridWithQuickViewProps {
  products: ProductCardProduct[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export default function ProductGridWithQuickView({
  products,
  columns = 4,
  className,
}: ProductGridWithQuickViewProps) {
  const { addItem } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<ProductCardProduct | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleQuickView = (product: ProductCardProduct) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleAddToCart = async (product: ProductCardProduct, quantity = 1) => {
    const variant = resolveSellableCartVariant(product);
    if (!variant?.inStock) return;
    await addItem(toCartLine(product, variant), quantity);
    setIsQuickViewOpen(false);
  };

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 xl:grid-cols-3',
    4: 'md:grid-cols-2 xl:grid-cols-4',
  };

  return (
    <>
      <div className={`grid gap-8 ${gridCols[columns]} ${className ?? ''}`}>
        {products.map((product, index) => (
          <FadeIn key={product.id} delay={index * 0.08}>
            <ProductCard
              product={product}
              onQuickView={handleQuickView}
              onAddToCart={handleAddToCart}
            />
          </FadeIn>
        ))}
      </div>

      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
