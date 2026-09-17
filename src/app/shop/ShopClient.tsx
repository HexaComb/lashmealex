'use client';

import { useMemo, useState } from 'react';
import { Filter } from 'lucide-react';

import Cart from '@/components/Cart';
import CartStartModal from '@/components/CartStartModal';
import FilterSidebar, { FilterOptions } from '@/components/FilterSidebar';
import Header from '@/components/Header';
import { FadeIn } from '@/components/LoadingStates';
import ProductCard, { type ProductCardProduct } from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import SearchModal from '@/components/SearchModal';
import type { StoreProduct } from '@/lib/catalog';
import { useCart } from '@/context/CartContext';
import { resolveSellableCartVariant, toCartLine } from '@/lib/storefront-product';

interface ShopClientProps {
  initialProducts: StoreProduct[];
  initialCategory?: string;
}

const priceCeiling = 100;

type CartProduct = ProductCardProduct & {
  variants?: StoreProduct['variants'];
};

function toFilterCategory(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function ShopClient({
  initialProducts,
  initialCategory,
}: ShopClientProps) {
  const { isOpen: isCartOpen, openCart, addItem, itemCount } = useCart();
  const [filters, setFilters] = useState<FilterOptions>({
    category: initialCategory ? [initialCategory] : [],
    priceRange: [0, priceCeiling],
    lashType: [],
    brand: [],
    inStock: false,
    onSale: false,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCardProduct | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const normalizedCategory = toFilterCategory(product.category);

      if (filters.category.length > 0 && !filters.category.includes(normalizedCategory)) {
        return false;
      }

      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      if (filters.inStock && !product.inStock) {
        return false;
      }

      if (filters.onSale && !product.compareAtPrice) {
        return false;
      }

      if (searchQuery) {
        const haystack = `${product.name} ${product.parentProductName} ${product.category}`.toLowerCase();
        if (!haystack.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [filters, initialProducts, searchQuery]);

  const handleAddToCart = async (product: CartProduct, quantity = 1) => {
    const variant = resolveSellableCartVariant(product);
    if (!variant?.inStock) return;
    await addItem(toCartLine(product, variant), quantity);
  };

  const handleQuickView = (product: ProductCardProduct) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemCount={itemCount}
        onSearchToggle={() => setIsSearchOpen(true)}
        onCartToggle={openCart}
        isSearchOpen={isSearchOpen}
        isCartOpen={isCartOpen}
      />

      <main className="w-full px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
        <FadeIn>
          <section className="mb-20">
            <div className="max-w-3xl space-y-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-pink-dark">
                All Products
              </p>
              <h1 className="font-display text-5xl font-medium tracking-tighter text-foreground lg:text-7xl">
                The Collection.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted">
                Professional lash extensions, aftercare, and beauty tools — browse by curl,
                diameter, and length to find your perfect match.
              </p>
            </div>
          </section>
        </FadeIn>

        <div className="mb-12 lg:hidden">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="btn-secondary flex w-full items-center justify-center gap-2"
          >
            <Filter size={18} />
            Show Filters
          </button>
        </div>

        <div className="flex flex-col gap-16 lg:flex-row lg:items-start">
          <div className="hidden w-80 flex-shrink-0 lg:block">
            <FilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              isOpen
              onClose={() => undefined}
              maxPrice={priceCeiling}
            />
          </div>

          <div className="flex-1">
            <FadeIn delay={0.2}>
              <div className="mb-12 flex flex-col gap-8 border-b border-line pb-8 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-muted">
                  {filteredProducts.length} Results
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Sort by:</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                    Best Selling
                  </span>
                </div>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {initialProducts.length === 0 ? (
                <div className="col-span-full border border-dashed border-line py-32 text-center">
                  <h3 className="mb-6 font-display text-4xl font-medium text-foreground">
                    Nothing listed right now
                  </h3>
                  <p className="mx-auto max-w-md text-muted">
                    The shop is empty at the moment. Check back soon or book a salon appointment
                    in the meantime.
                  </p>
                </div>
              ) : (
                filteredProducts.map((product, index) => (
                  <FadeIn key={product.id} delay={index * 0.06}>
                    <ProductCard
                      product={product}
                      onQuickView={handleQuickView}
                      onAddToCart={handleAddToCart}
                    />
                  </FadeIn>
                ))
              )}
            </div>

            {initialProducts.length > 0 && filteredProducts.length === 0 && (
              <div className="border border-dashed border-line py-32 text-center">
                <h3 className="mb-6 font-display text-4xl font-medium text-foreground">
                  No Products Found
                </h3>
                <p className="mb-12 text-muted">Refine your search or clear filters to see more.</p>
                <button
                  onClick={() =>
                    setFilters({
                      category: [],
                      priceRange: [0, priceCeiling],
                      lashType: [],
                      brand: [],
                      inStock: false,
                      onSale: false,
                    })
                  }
                  className="btn-primary"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="lg:hidden">
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          maxPrice={priceCeiling}
        />
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={setSearchQuery}
        products={initialProducts}
      />

      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <Cart />
      <CartStartModal />
    </div>
  );
}
