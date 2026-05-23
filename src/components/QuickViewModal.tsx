'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, ChevronLeft, ChevronRight, Share2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { LoadingButton } from './LoadingStates';
import type { ProductCardProduct } from './ProductCard';
import type { StoreVariant } from '@/lib/catalog';
import { motionEaseOut } from '@/lib/motion';

interface Product extends ProductCardProduct {
  images?: string[];
  features?: string[];
  specifications?: Record<string, string>;
  reviewCount?: number;
  variants?: StoreVariant[];
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => Promise<void> | void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted?: boolean;
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false
}: QuickViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(product?.variants?.[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state to product when it changes
  const [prevProductId, setPrevProductId] = useState(product?.id);
  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id);
    setSelectedVariantId(product.variants?.[0]?.id ?? '');
    setQuantity(1);
    setCurrentImageIndex(0);
  }

  if (!product) return null;

  const variants = product.variants ?? [];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const images = product.images || [];
  const hasMultipleImages = images.length > 1;
  const productUrl = `/products/${product.slug}`;
  const activePrice = selectedVariant?.price ?? product.price;
  const activeCompareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const activeInStock = selectedVariant?.inStock ?? product.inStock;
  const cartProduct: Product = selectedVariant
    ? {
        ...product,
        id: selectedVariant.id,
        slug: selectedVariant.slug,
        name: `${product.name} ${selectedVariant.variantName ?? ''}`.trim(),
        price: selectedVariant.price,
        compareAtPrice: selectedVariant.compareAtPrice,
        image: selectedVariant.image ?? product.image,
        inStock: selectedVariant.inStock,
      }
    : product;

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    // addItem is handled by the parent via onAddToCart
    await onAddToCart(cartProduct, quantity);
    setIsAddingToCart(false);
    onClose();
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-modal-backdrop bg-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 lg:inset-8 z-modal flex items-start lg:items-center justify-center p-4 lg:p-0 overflow-y-auto lg:overflow-visible"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={motionEaseOut}
            onClick={onClose}
          >
            <div 
              className="relative glass-heavy my-4 flex w-full max-w-4xl flex-col overflow-visible lg:my-0 lg:h-[560px] lg:flex-row lg:overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button — removed from absolute position, placed inline in header below */}

              {/* Product Images */}
              <div className="relative bg-gradient-to-br from-rose-gold-light via-background to-rose-gold lg:h-full lg:w-[45%]">
                {images.length > 0 ? (
                  <>
                    <div className="aspect-square lg:aspect-auto lg:h-full flex items-center justify-center p-8">
                      <motion.img
                        key={currentImageIndex}
                        src={images[currentImageIndex]}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain shadow-soft"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>

                    {/* Image Navigation */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={handlePreviousImage}
                          className="focus-ring absolute left-8 top-1/2 -translate-y-1/2 rounded-full bg-white/84 p-3 text-foreground transition-colors hover:text-pink-dark shadow-md"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="focus-ring absolute right-8 top-1/2 -translate-y-1/2 rounded-full bg-white/84 p-3 text-foreground transition-colors hover:text-pink-dark shadow-md"
                          aria-label="Next image"
                        >
                          <ChevronRight size={24} />
                        </button>
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={clsx(
                                'w-3 h-3 rounded-full transition-all duration-300',
                                index === currentImageIndex ? 'bg-pink-dark w-6' : 'bg-white/50 hover:bg-white/80'
                              )}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="aspect-square lg:aspect-auto lg:h-full flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center border border-line bg-rose-gold-light/40">
                        <span className="text-4xl font-display text-foreground">
                          {product.name.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
                      <p className="text-muted text-lg">Product image coming soon</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 flex flex-col p-5 lg:p-7 overflow-y-auto lg:overflow-hidden bg-white/40 backdrop-blur-md">
                <div className="flex flex-col gap-4 h-full">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-dark">
                          {product.category}
                        </p>
                        <h2 className="mt-1.5 font-display text-2xl font-medium tracking-tight text-foreground">
                          {product.name}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onToggleWishlist(product.id)}
                          className="focus-ring rounded-full border border-line bg-white p-2.5 text-foreground transition-all hover:scale-110 hover:text-pink-dark shadow-sm"
                          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <Heart size={16} className={clsx('transition-colors', isWishlisted && 'fill-pink-dark text-pink-dark')} />
                        </button>
                        <button
                          onClick={onClose}
                          className="focus-ring rounded-full border border-line bg-white p-2.5 text-foreground transition-all hover:bg-foreground hover:text-background shadow-sm"
                          aria-label="Close quick view"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Rating */}
                    {product.rating && (
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13} className={clsx(i < Math.floor(product.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-line')} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                          {product.rating} ({product.reviewCount || 0} reviews)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold tracking-tight text-foreground">${activePrice}</span>
                    {activeCompareAtPrice && activeCompareAtPrice > activePrice && (
                      <>
                        <span className="text-lg text-muted line-through opacity-50">${activeCompareAtPrice}</span>
                        <span className="bg-pink px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                          Save ${activeCompareAtPrice - activePrice}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-muted line-clamp-2">
                    {product.description}
                  </p>

                  {/* Add to Cart Section */}
                  <div className="flex flex-col gap-3 border-t border-line pt-4 mt-auto">
                    {variants.length > 0 && (
                      <div>
                        <label htmlFor="quickview-variant" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-1.5">
                          Select Tray Size + Curl
                        </label>
                        <select
                          id="quickview-variant"
                          value={selectedVariant?.id ?? ''}
                          onChange={(event) => setSelectedVariantId(event.target.value)}
                          className="w-full border border-line bg-white px-3 py-2.5 text-sm text-foreground outline-none"
                        >
                          {variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {(variant.variantName ?? variant.name)} · ${variant.price} · {variant.inStock ? `${variant.inventory} in stock` : 'Out of stock'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">Quantity</span>
                      <div className="flex items-center gap-3 border border-line">
                        <button onClick={decrementQuantity} disabled={quantity <= 1} className="focus-ring flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-30" aria-label="Decrease quantity">-</button>
                        <span className="w-6 text-center text-sm font-bold text-foreground">{quantity}</span>
                        <button onClick={incrementQuantity} className="focus-ring flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-line" aria-label="Increase quantity">+</button>
                      </div>
                    </div>

                    <LoadingButton
                      isLoading={isAddingToCart}
                      disabled={!activeInStock}
                      className={clsx('w-full py-3.5 text-xs font-bold uppercase tracking-[0.3em] transition-all', activeInStock ? 'btn-primary' : 'cursor-not-allowed bg-line text-muted')}
                      onClick={handleAddToCart}
                    >
                      {activeInStock ? 'Add to Bag' : 'Out of Stock'}
                    </LoadingButton>

                    <div className="flex items-center gap-2">
                      <Link href={productUrl} className="flex-1 btn-secondary py-3 text-center text-[10px]" onClick={onClose}>
                        View Full Details
                      </Link>
                      <button
                        onClick={async () => {
                          const fullUrl = `${window.location.origin}${productUrl}`;
                          await navigator.clipboard.writeText(fullUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex h-[42px] w-[42px] items-center justify-center border border-foreground text-foreground transition-all hover:bg-foreground hover:text-background"
                        aria-label="Share product"
                      >
                        {copied ? <Check size={14} /> : <Share2 size={14} />}
                      </button>
                    </div>

                    <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted">
                      <span className="text-pink">·</span> Fresno pickup in 2–4 hours <span className="text-pink">·</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
