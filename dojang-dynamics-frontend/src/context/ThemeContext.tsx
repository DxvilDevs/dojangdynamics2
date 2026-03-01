'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Accent = 'crimson' | 'ember';

interface ThemeContextValue {
  accent: Accent;
  toggleAccent: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState<Accent>('crimson');

  useEffect(() => {
    const stored = localStorage.getItem('dojang-accent') as Accent;
    if (stored === 'crimson' || stored === 'ember') setAccent(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('dojang-accent', accent);
  }, [accent]);

  const toggleAccent = () => setAccent((a) => (a === 'crimson' ? 'ember' : 'crimson'));

  return (
    <ThemeContext.Provider value={{ accent, toggleAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
