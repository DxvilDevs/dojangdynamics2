'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { ordersApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const { state, removeItem, updateQuantity, clearCart, setCartOpen, itemCount, totalCents } =
    useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (state.items.length === 0) return;
    setIsCheckingOut(true);
    setError(null);
    try {
      const cart = state.items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      }));
      const { url } = await ordersApi.createCheckoutSession(cart);
      if (url) window.location.href = url;
    } catch (err) {
      setError('Failed to start checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-obsidian-950/70 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-obsidian-900 border-l border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-accent" />
                <h2 className="font-display tracking-widest text-lg">YOUR BAG</h2>
                {itemCount > 0 && (
                  <span className="text-xs text-white/40 font-mono">({itemCount} items)</span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {state.items.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-64 text-center"
                  >
                    <ShoppingBag size={48} className="text-white/10 mb-4" />
                    <p className="text-white/30 font-body">Your bag is empty</p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="mt-4 text-sm text-accent hover:underline"
                    >
                      Continue shopping
                    </button>
                  </motion.div>
                ) : (
                  state.items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 p-3 bg-obsidian-800/50 rounded-lg border border-white/5"
                    >
                      {/* Image */}
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-obsidian-700 flex-shrink-0">
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-obsidian-700" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-white truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-accent mt-0.5">
                          {formatPrice(item.product.priceCents, item.product.currency)}
                        </p>

                        {/* Qty controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-accent transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-sm font-mono w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-accent transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-white/20 hover:text-red-400 transition-colors self-start mt-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {state.items.length > 0 && (
              <div className="px-6 py-5 border-t border-white/10 space-y-4">
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm uppercase tracking-wider">Total</span>
                  <span className="text-xl font-display text-accent">
                    {formatPrice(totalCents)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full flex items-center justify-center gap-2 bg-accent text-white py-3.5 rounded-lg font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isCheckingOut ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Checkout
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <button
                  onClick={clearCart}
                  className="w-full text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  Clear bag
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
