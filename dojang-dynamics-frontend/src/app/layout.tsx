import type { Metadata } from 'next';
import { Bebas_Neue, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

const display = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Dojang Dynamics — Elite Martial Arts Gear',
  description:
    'Competition-grade martial arts equipment engineered for champions. Gis, rashguards, shorts, and accessories built for the mat.',
  keywords: ['BJJ', 'grappling', 'martial arts', 'gi', 'rashguard', 'jiu-jitsu', 'MMA'],
  openGraph: {
    title: 'Dojang Dynamics',
    description: 'Elite Martial Arts Gear',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} bg-obsidian-950 text-white antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
