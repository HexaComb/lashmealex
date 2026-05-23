'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, ChevronLeft, ChevronRight, Minus, Plus, Truck, Shield, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useCart } from '@/context/CartContext';
import { analytics } from '@/lib/analytics';
import HeaderShell from '../../../components/HeaderShell';
import { LoadingButton, FadeIn } from '../../../components/LoadingStates';
import ProductGridWithQuickView from '../../../components/ProductGridWithQuickView';
import type { StoreProduct, StoreVariant } from '@/lib/catalog';

interface Product {
  id: string;
  slug: string;
  parentProductName: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  images?: string[];
  category: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  features?: string[];
  specifications?: Record<string, string>;
  variants: StoreVariant[];
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: StoreProduct[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const images = product.images || [];
  const hasMultipleImages = images.length > 1;

  // Track product view once on mount
  useEffect(() => {
    analytics.productViewed(product.id, product.name, selectedVariant?.price ?? product.price);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setIsAddingToCart(true);
    const name = `${product.parentProductName} ${selectedVariant.variantName}`.trim();
    await addItem({
      id: selectedVariant.id,
      name,
      price: selectedVariant.price,
      image: images[0],
      category: product.category,
    }, quantity);
    analytics.addToCart(selectedVariant.id, name, selectedVariant.price, quantity);
    setIsAddingToCart(false);
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // Update wishlist state
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
    <div className="min-h-screen bg-background">
      <HeaderShell />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <FadeIn>
          <nav className="mb-8 flex items-center space-x-2 text-sm text-muted">
            <Link href="/" className="transition-colors hover:text-pink-dark">Home</Link>
            <span>/</span>
            <Link href="/shop" className="transition-colors hover:text-pink-dark">Shop</Link>
            <span>/</span>
            <Link href={`/shop?category=${product.category.toLowerCase()}`} className="transition-colors hover:text-pink-dark">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </FadeIn>

        {/* Product Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <FadeIn direction="left">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden border border-line bg-gradient-to-br from-rose-gold-light via-background to-rose-gold">
                {images.length > 0 ? (
                  <motion.img
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-pink/20 to-transparent rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl font-display text-foreground">
                          {product.name.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
                      <p className="text-muted">Product image coming soon</p>
                    </div>
                  </div>
                )}

                {/* Image Navigation */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="focus-ring absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-foreground shadow-sm transition-colors hover:text-pink-dark"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="focus-ring absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-foreground shadow-sm transition-colors hover:text-pink-dark"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {hasMultipleImages && (
                <div className="flex gap-3 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={clsx(
                        'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors',
                        index === currentImageIndex ? 'border-pink-dark' : 'border-transparent'
                      )}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>

          {/* Product Info */}
          <FadeIn direction="right" delay={0.2}>
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-pink-dark">
                    {product.category}
                  </p>
                  <h1 className="mt-2 font-display text-3xl font-semibold text-foreground lg:text-5xl">
                    {product.name}
                  </h1>
                  {selectedVariant?.variantName && (
                    <p className="mt-3 text-sm uppercase tracking-[0.24em] text-muted">
                      Selected variant: {selectedVariant.variantName}
                    </p>
                  )}
                </div>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={clsx(
                            i < Math.floor(product.rating!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-[#d0c3bd]'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-foreground">
                      {product.rating} ({product.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-semibold text-foreground">
                    ${selectedVariant?.price ?? product.price}
                  </span>
                  {selectedVariant?.compareAtPrice &&
                    selectedVariant.compareAtPrice > selectedVariant.price && (
                    <>
                      <span className="text-2xl text-muted line-through">
                        ${selectedVariant.compareAtPrice}
                      </span>
                      <span className="rounded-full bg-pink-dark px-3 py-1 text-sm font-semibold text-white">
                        Save ${selectedVariant.compareAtPrice - selectedVariant.price}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="max-w-none">
                <p className="text-muted leading-relaxed text-lg">
                  {product.description}
                </p>
              </div>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Key Features</h3>
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-pink-dark" />
                        <span className="text-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add to Cart Section */}
              <div className="space-y-6 border border-line bg-white p-6 shadow-card">
                {product.variants.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Choose Variant</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => {
                          setSelectedVariantId(variant.id);
                          analytics.variantSelected(variant.id, variant.variantName ?? variant.name, variant.price);
                        }}
                          className={clsx(
                            'border px-4 py-3 text-left transition-colors',
                            selectedVariant?.id === variant.id
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-line bg-white text-foreground hover:border-foreground'
                          )}
                        >
                          <p className="text-sm font-semibold">{variant.variantName ?? variant.name}</p>
                          <p className={clsx('mt-1 text-xs', selectedVariant?.id === variant.id ? 'text-background/70' : 'text-muted')}>
                            ${variant.price} · {variant.inStock ? `${variant.inventory} in stock` : 'Out of stock'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground">Quantity:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-foreground transition-colors hover:text-pink-dark disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center text-lg font-semibold text-foreground">
                        {quantity}
                      </span>
                      <button
                        onClick={incrementQuantity}
                        className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-foreground transition-colors hover:text-pink-dark"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleWishlist}
                    className="focus-ring rounded-full border border-line bg-white p-3 text-foreground transition-colors hover:text-pink-dark"
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      size={20}
                      className={clsx(
                        'transition-colors',
                        isWishlisted && 'fill-pink-dark text-pink-dark'
                      )}
                    />
                  </button>
                </div>

                <LoadingButton
                  isLoading={isAddingToCart}
                  disabled={!selectedVariant?.inStock}
                  className={clsx(
                    'w-full py-4 text-lg font-semibold',
                    selectedVariant?.inStock
                      ? 'btn-primary'
                      : 'cursor-not-allowed bg-line text-muted'
                  )}
                  onClick={handleAddToCart}
                >
                  {selectedVariant?.inStock ? 'Add to Cart' : 'Out of Stock'}
                </LoadingButton>

                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <Truck size={16} />
                    <span>Free pickup over $25</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={16} />
                    <span>Secure payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} />
                    <span>Easy returns</span>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Specifications</h3>
                  <div className="space-y-3 border border-line bg-white p-6 shadow-card">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-line py-2 last:border-b-0">
                        <span className="text-muted capitalize">{key}</span>
                        <span className="font-medium text-foreground">
                          {key === 'inventory' && selectedVariant
                            ? `${selectedVariant.inventory} trays`
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
        </div>

        {/* Related Products */}
        <section className="space-y-8">
          <FadeIn>
              <div className="text-center space-y-4">
              <h2 className="font-display text-3xl font-semibold text-foreground">You Might Also Like</h2>
              <p className="text-muted max-w-2xl mx-auto">
                Complete your lash routine with these complementary products
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <ProductGridWithQuickView products={relatedProducts} columns={4} />
          </FadeIn>
        </section>
      </main>
    </div>
  );
}
