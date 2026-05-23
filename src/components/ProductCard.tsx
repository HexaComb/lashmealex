'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import { clsx } from 'clsx';

export interface ProductCardProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  description: string;
  category: string;
  rating?: number;
  inStock: boolean;
}

interface ProductCardProps {
  product: ProductCardProduct;
  onQuickView?: (product: ProductCardProduct) => void;
  onAddToCart?: (product: ProductCardProduct) => void;
  onToggleWishlist?: (productId: string) => void;
  isWishlisted?: boolean;
  className?: string;
}

export default function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  className,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.(product.id);
  };

  const imageLabel = product.name.split(' ').slice(0, 2).join(' ');
  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice - product.price
      : null;

  return (
    <motion.article
      className={clsx(
        'group relative cursor-pointer overflow-hidden rounded-none border border-line bg-white transition-shadow duration-300 hover:shadow-soft',
        !product.inStock && 'opacity-70',
        className
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleQuickView}
      layout
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-photo-well">
        {product.image ? (
          <>
            <img
              src={product.image}
              alt={product.name}
              className={clsx(
                'h-full w-full object-cover transition-all duration-700',
                imageLoading && 'skeleton',
                isHovered && 'scale-105'
              )}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
            {isHovered && (
              <motion.div
                className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-foreground/90 p-4 backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="focus-ring w-full bg-white py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-pink-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {product.inStock ? 'Add to Bag' : 'Out of Stock'}
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col justify-between p-6">
            <div className="flex justify-between">
              <span className="bg-foreground px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                {product.category}
              </span>
              {savings && (
                <span className="bg-pink px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                  -${savings}
                </span>
              )}
            </div>

            <div className="flex h-full items-center justify-center py-5">
              <div className="w-full text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted">
                  Lashmealex
                </p>
                <span className="mt-2 block font-display text-4xl font-medium leading-none tracking-tighter text-foreground">
                  {imageLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
              <span>Pickup</span>
              <span>Fresno, CA</span>
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {!product.inStock && (
            <span className="bg-muted px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
              Sold Out
            </span>
          )}
        </div>

        <button
          onClick={handleToggleWishlist}
          className="focus-ring absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-foreground shadow-card transition-colors hover:text-pink-dark"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={14} className={clsx(isWishlisted && 'fill-pink-dark text-pink-dark')} />
        </button>

        {product.rating && (
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-1 bg-white px-2 py-1 text-[10px] font-bold text-foreground">
            <Star size={10} className="fill-foreground text-foreground" />
            {product.rating}
          </div>
        )}
      </div>

      <div className="space-y-6 p-8">
        <div className="space-y-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-pink-dark">
            {product.category}
          </p>
          <h3 className="line-clamp-2 font-display text-2xl font-medium leading-[1.1] tracking-tight text-foreground group-hover:underline">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-xs leading-5 text-muted">{product.description}</p>
        </div>

        <div className="flex items-center justify-between border-t border-line pt-6">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">${product.price}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-muted line-through">${product.compareAtPrice}</span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-pink-dark transition-colors group-hover:text-foreground">View →</span>
        </div>
      </div>
    </motion.article>
  );
}
