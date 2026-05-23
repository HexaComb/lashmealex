'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { motionEaseOut } from '@/lib/motion';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  products?: SearchProduct[];
  recentSearches?: string[];
  popularSearches?: string[];
}

interface SearchProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  url?: string;
  slug?: string;
}

interface SearchResult {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  url: string;
}

export default function SearchModal({
  isOpen,
  onClose,
  onSearch,
  products = [],
  recentSearches = [],
  popularSearches = [
    'strip lashes',
    'lash adhesive',
    'magnetic lashes',
    'aftercare kit',
    'pro tools'
  ]
}: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (searchQuery.trim()) {
      const filteredResults = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        url: product.url ?? (product.slug ? `/products/${product.slug}` : '/shop'),
      }));

      setResults(filteredResults);
    } else {
      setResults([]);
    }

    setIsLoading(false);
  }, [products]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [performSearch, query]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    onSearch(searchQuery);
    if (searchQuery.trim()) {
      onClose();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onClose();
    router.push(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && query.trim()) {
      handleSearch(query);
    }
  };

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

          {/* Search Modal */}
          <motion.div
            className="fixed top-20 left-4 right-4 lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:max-w-2xl z-modal"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={motionEaseOut}
          >
            <div className="glass-heavy overflow-hidden">
              {/* Search Input */}
              <div className="p-6 border-b border-line">
                <div className="flex items-center gap-4">
                  <Search size={20} className="text-muted" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for products, brands, or categories..."
                    className="flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted"
                    autoFocus
                  />
                  <button
                    onClick={onClose}
                    className="focus-ring p-2 text-foreground transition-colors hover:text-pink-dark"
                    aria-label="Close search"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-6 text-center text-muted">
                    <div className="inline-block w-6 h-6 border-2 border-pink border-t-transparent rounded-full animate-spin" />
                    <p className="mt-2">Searching...</p>
                  </div>
                ) : query ? (
                  results.length > 0 ? (
                    <div className="p-4">
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-pink-dark">
                        Results ({results.length})
                      </h3>
                      <div className="space-y-2">
                        {results.map((result) => (
                          <motion.button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className="flex w-full items-center gap-4 border border-transparent p-3 text-left transition-colors hover:border-line hover:bg-surface-hover"
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f3dfd8] to-[#fff7f3]">
                              <span className="text-xs font-semibold text-foreground">
                                {result.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{result.name}</h4>
                              <p className="text-sm text-muted">{result.category}</p>
                            </div>
                            <span className="font-semibold text-foreground">${result.price}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted">
                      <p>No results found for &quot;{query}&quot;</p>
                      <p className="text-sm mt-2">Try searching for something else</p>
                    </div>
                  )
                ) : (
                  <div className="p-6 space-y-6">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock size={16} className="text-muted" />
                          <h3 className="text-sm font-semibold text-pink uppercase tracking-wider">
                            Recent Searches
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(search)}
                              className="rounded-full bg-surface px-3 py-1 text-sm text-foreground transition-colors hover:bg-surface-hover"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Searches */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-muted" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-pink-dark">
                          Popular Searches
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {popularSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearch(search)}
                            className="rounded-full bg-surface px-3 py-1 text-sm text-foreground transition-colors hover:bg-surface-hover"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search Tips */}
                    <div className="border-t border-line pt-6">
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-pink-dark">
                        Search Tips
                      </h3>
                      <ul className="text-sm text-muted space-y-2">
                        <li>Try searching for product names or categories</li>
                        <li>Use specific terms like &quot;magnetic&quot; or &quot;adhesive&quot;</li>
                        <li>Search by brand names</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
