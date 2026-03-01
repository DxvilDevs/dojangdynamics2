'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/ui/CartDrawer';
import { productsApi, type Product } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

export default function ProductPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { addItem, setCartOpen } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    productsApi
      .getBySlug(slug)
      .then((p) => setProduct(p))
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setCartOpen(true);
    }, 800);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <AlertCircle size={48} className="text-white/20" />
          <p className="text-white/40 font-body">Product not found</p>
          <Link href="/store" className="text-accent hover:underline text-sm">
            Back to store
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className="min-h-screen bg-obsidian-950 pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-white/30 mb-8">
            <Link href="/store" className="hover:text-accent flex items-center gap-1 transition-colors">
              <ArrowLeft size={10} />
              Store
            </Link>
            <span>/</span>
            <span className="text-white/50">{product.name}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            {/* Image gallery */}
            <div className="space-y-4">
              {/* Main image */}
              <div className="relative aspect-square bg-obsidian-900 rounded-2xl overflow-hidden border border-white/5">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImg}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={product.images[activeImg] || '/placeholder.jpg'}
                    alt={`${product.name} image ${activeImg + 1}`}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Nav arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImg((i) => (i - 1 + product.images.length) % product.images.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-obsidian-950/70 flex items-center justify-center text-white hover:bg-accent/80 transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImg((i) => (i + 1) % product.images.length)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-obsidian-950/70 flex items-center justify-center text-white hover:bg-accent/80 transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImg === i ? 'border-accent' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col"
            >
              <p className="text-xs font-mono text-white/30 uppercase tracking-[0.2em] mb-3">
                {product.category}
              </p>
              <h1 className="font-display text-4xl md:text-5xl tracking-wider text-white uppercase leading-tight">
                {product.name}
              </h1>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-4xl text-accent">
                  {formatPrice(product.priceCents, product.currency)}
                </span>
              </div>

              <div className="mt-8 border-t border-white/10 pt-8">
                <p className="font-body text-white/60 leading-relaxed">{product.description}</p>
              </div>

              {/* Add to cart */}
              <div className="mt-10">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={added}
                  className="w-full flex items-center justify-center gap-3 bg-accent hover:opacity-90 disabled:opacity-70 text-white font-semibold py-4 rounded-xl transition-all duration-200 glow-accent text-base"
                >
                  {added ? (
                    <>
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        ✓
                      </motion.span>
                      Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      Add to Bag
                    </>
                  )}
                </motion.button>
              </div>

              {/* Details */}
              <div className="mt-8 space-y-3 text-sm font-body">
                <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                  <span className="text-white/30">SKU</span>
                  <span className="font-mono text-white/50 text-xs">{product.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-white/5">
                  <span className="text-white/30">Category</span>
                  <span className="text-white/50 capitalize">{product.category}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white/30">Availability</span>
                  <span className="text-jade-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-jade-400 inline-block animate-pulse" />
                    In Stock
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
