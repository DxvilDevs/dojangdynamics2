'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, ChevronDown, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/ui/CartDrawer';
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard';
import { productsApi, type Product } from '@/lib/api';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'gi', 'rashguard', 'shorts', 'spats', 'accessories', 'recovery'];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'createdAt', order: 'desc' as const },
  { label: 'Price: Low to High', value: 'priceCents', order: 'asc' as const },
  { label: 'Price: High to Low', value: 'priceCents', order: 'desc' as const },
  { label: 'Name A–Z', value: 'name', order: 'asc' as const },
];

export default function StorePage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortIdx, setSortIdx] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for Stripe success
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const sort = SORT_OPTIONS[sortIdx];
      const res = await productsApi.getAll({
        category: category === 'All' ? undefined : category,
        search: debouncedSearch || undefined,
        sort: sort.value,
        order: sort.order,
        featured: searchParams.get('featured') === 'true' ? true : undefined,
      });
      setProducts(res.products);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, sortIdx, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className="min-h-screen bg-obsidian-950 pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Success toast */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-jade-600 text-white px-6 py-3 rounded-full shadow-2xl"
            >
              <CheckCircle size={16} />
              <span className="font-semibold text-sm">Order confirmed! Check your email.</span>
            </motion.div>
          )}

          {/* Header */}
          <div className="mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-6xl md:text-8xl tracking-widest text-white uppercase"
            >
              THE <span className="text-accent">COLLECTION</span>
            </motion.h1>
            <p className="text-white/30 font-body mt-3 font-mono text-sm">
              {loading ? '—' : `${total} products`}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-obsidian-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 font-body"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md border transition-all duration-200',
                    category === cat
                      ? 'bg-accent border-accent text-white'
                      : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative ml-auto">
              <select
                value={sortIdx}
                onChange={(e) => setSortIdx(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-2.5 bg-obsidian-900 border border-white/10 rounded-lg text-sm text-white/60 focus:outline-none focus:border-accent/50 font-body cursor-pointer"
              >
                {SORT_OPTIONS.map((opt, i) => (
                  <option key={i} value={i}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
              />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32">
              <SlidersHorizontal size={48} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/30 font-body">No products found</p>
              <button
                onClick={() => {
                  setSearch('');
                  setCategory('All');
                }}
                className="mt-4 text-sm text-accent hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
