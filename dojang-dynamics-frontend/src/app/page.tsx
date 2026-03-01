'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Shield, Zap, Award, ChevronDown } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/ui/CartDrawer';

const AnimatedBackground = dynamic(
  () =>
    import('@/components/ui/AnimatedBackground').then((m) => ({ default: m.AnimatedBackground })),
  { ssr: false }
);

const REVEAL = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FEATURES = [
  {
    icon: Shield,
    title: 'Competition Grade',
    desc: 'Every product engineered to IBJJF & ADCC specifications. Built to endure 1,000 rounds.',
  },
  {
    icon: Zap,
    title: 'Performance First',
    desc: 'Materials sourced from the same suppliers used by world championship podium finishers.',
  },
  {
    icon: Award,
    title: 'Proven on the Mat',
    desc: 'Trusted by black belts, pro grapplers, and world-class academies across 40+ countries.',
  },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main>
        {/* ─── Hero ────────────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
          <AnimatedBackground />

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 text-center px-6 max-w-6xl mx-auto"
          >
            {/* Kicker */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={REVEAL}
              className="inline-flex items-center gap-2 border border-accent/30 bg-accent/10 text-accent text-xs font-mono uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-8"
            >
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              Elite Martial Arts Equipment
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={REVEAL}
              className="font-display text-[clamp(4rem,12vw,9rem)] leading-none tracking-widest text-white uppercase"
            >
              FORGED
              <br />
              FOR THE
              <br />
              <span className="text-accent text-glow">DOJANG</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={REVEAL}
              className="mt-8 text-white/50 font-body text-lg max-w-2xl mx-auto leading-relaxed"
            >
              Competition-grade gis, rashguards, and gear engineered for athletes who
              refuse to compromise. Every stitch. Every weave. Every detail.
            </motion.p>

            {/* CTAs */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={REVEAL}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
            >
              <Link
                href="/store"
                className="group flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 glow-accent"
              >
                Shop Collection
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/store?featured=true"
                className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-semibold px-8 py-4 rounded-lg transition-all duration-200"
              >
                Featured Gear
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={REVEAL}
              className="flex items-center justify-center gap-12 mt-20"
            >
              {[
                { n: '40+', label: 'Countries' },
                { n: '1000+', label: 'Academies' },
                { n: '∞', label: 'Rounds Tested' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-3xl text-accent">{stat.n}</div>
                  <div className="text-xs text-white/30 uppercase tracking-widest mt-1 font-mono">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </motion.div>
        </section>

        {/* ─── Features ──────────────────────────────────────────────────────── */}
        <section className="relative py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 className="font-display text-5xl md:text-7xl tracking-widest text-white uppercase">
                WHY <span className="text-accent">DOJANG</span>
              </h2>
              <p className="text-white/40 font-body mt-4 max-w-xl mx-auto">
                We don&apos;t make gear for the casual practitioner. We build weapons for champions.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="group p-8 bg-obsidian-900/50 border border-white/5 rounded-2xl hover:border-accent/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                    <feat.icon size={20} className="text-accent" />
                  </div>
                  <h3 className="font-display text-2xl tracking-wider text-white mb-3">
                    {feat.title}
                  </h3>
                  <p className="text-white/40 font-body text-sm leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ──────────────────────────────────────────────────── */}
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, rgb(var(--accent)) 0, rgb(var(--accent)) 1px, transparent 0, transparent 50%)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-5xl md:text-8xl tracking-widest text-white uppercase">
                STEP ON THE MAT
                <br />
                <span className="text-accent text-glow">READY.</span>
              </h2>
              <Link
                href="/store"
                className="inline-flex items-center gap-2 mt-10 bg-white text-obsidian-950 font-bold px-10 py-4 rounded-lg hover:bg-accent hover:text-white transition-all duration-300 text-sm uppercase tracking-widest"
              >
                Shop Now <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/5 py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="font-display tracking-widest text-white/40 text-lg">
              DOJANG <span className="text-accent">DYNAMICS</span>
            </div>
            <p className="text-white/20 text-xs font-mono">
              © {new Date().getFullYear()} Dojang Dynamics. Built for the mat.
            </p>
            <Link href="/admin" className="text-white/20 hover:text-white/40 text-xs font-mono">
              Admin
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
