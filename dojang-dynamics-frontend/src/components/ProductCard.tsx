'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, setCartOpen } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    setCartOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link href={`/store/${product.slug}`} className="group block">
        <div className="relative bg-obsidian-900 border border-white/5 rounded-xl overflow-hidden hover:border-accent/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:-translate-y-0.5">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-obsidian-800">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={48} className="text-white/10" />
              </div>
            )}

            {/* Featured badge */}
            {product.featured && (
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-accent/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                <Star size={8} fill="currentColor" />
                Featured
              </div>
            )}

            {/* Quick add overlay */}
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={handleAddToCart}
                className="w-full bg-accent text-white py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 transition-opacity"
              >
                <ShoppingBag size={14} />
                Add to Bag
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
              {product.category}
            </p>
            <h3 className="font-body font-semibold text-white text-sm leading-tight truncate">
              {product.name}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-accent font-display text-lg">
                {formatPrice(product.priceCents, product.currency)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-obsidian-900 border border-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-obsidian-800" />
      <div className="p-4 space-y-2">
        <div className="h-2 bg-obsidian-800 rounded w-1/4" />
        <div className="h-4 bg-obsidian-800 rounded w-3/4" />
        <div className="h-5 bg-obsidian-800 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}
