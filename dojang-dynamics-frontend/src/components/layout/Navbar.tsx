'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, Zap } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { itemCount, toggleCart } = useCart();
  const { accent, toggleAccent } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/store', label: 'Store' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-obsidian-950/90 backdrop-blur-xl border-b border-white/5 shadow-2xl'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center">
              <span className="font-display text-white text-xl leading-none">D</span>
            </div>
            <span className="font-display tracking-widest text-xl text-white">
              DOJANG
              <span className="text-accent ml-1">DYNAMICS</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-body text-white/60 hover:text-accent transition-colors duration-200 tracking-widest uppercase"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Accent toggle */}
            <button
              onClick={toggleAccent}
              aria-label={`Switch to ${accent === 'crimson' ? 'ember' : 'crimson'} accent`}
              className="hidden md:flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <Zap size={12} />
              <span className="font-mono">{accent.toUpperCase()}</span>
            </button>

            {/* Cart */}
            <button
              onClick={toggleCart}
              aria-label={`Cart (${itemCount} items)`}
              className="relative p-2 text-white/70 hover:text-accent transition-colors"
            >
              <ShoppingBag size={20} />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 text-white/70"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-obsidian-950/95 backdrop-blur-xl border-b border-white/5 md:hidden"
          >
            <nav className="flex flex-col px-6 py-6 gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg text-white/70 hover:text-accent transition-colors uppercase tracking-widest"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  toggleAccent();
                }}
                className="flex items-center gap-2 text-sm text-white/40 mt-2"
              >
                <Zap size={14} />
                <span className="font-mono">Accent: {accent.toUpperCase()}</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
