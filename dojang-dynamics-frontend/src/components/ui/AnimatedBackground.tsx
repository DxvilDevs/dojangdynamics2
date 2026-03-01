'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface Shape {
  id: number;
  type: 'triangle' | 'circle' | 'square' | 'ring' | 'cross';
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  color: 'accent' | 'dim';
}

const NUM_SHAPES = 18;

function generateShapes(): Shape[] {
  const types: Shape['type'][] = ['triangle', 'circle', 'square', 'ring', 'cross'];
  return Array.from({ length: NUM_SHAPES }, (_, i) => ({
    id: i,
    type: types[i % types.length],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 12 + Math.random() * 32,
    opacity: 0.04 + Math.random() * 0.1,
    speed: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 0.4,
    color: Math.random() > 0.7 ? 'accent' : 'dim',
  }));
}

function ShapeEl({ shape }: { shape: Shape }) {
  const strokeColor = shape.color === 'accent' ? 'rgb(var(--accent))' : 'rgba(255,255,255,0.3)';
  const size = shape.size;

  const motionProps = {
    animate: {
      y: [0, -20, 0],
      rotate: [shape.rotation, shape.rotation + 360],
    },
    transition: {
      duration: shape.speed,
      repeat: Infinity,
      ease: 'linear' as const,
    },
    style: {
      position: 'absolute' as const,
      left: `${shape.x}%`,
      top: `${shape.y}%`,
      opacity: shape.opacity,
    },
  };

  if (shape.type === 'triangle') {
    return (
      <motion.svg
        {...motionProps}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M12 2L22 20H2L12 2Z" stroke={strokeColor} strokeWidth="1.5" />
      </motion.svg>
    );
  }

  if (shape.type === 'circle') {
    return (
      <motion.svg {...motionProps} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={strokeColor} strokeWidth="1.5" />
      </motion.svg>
    );
  }

  if (shape.type === 'ring') {
    return (
      <motion.svg {...motionProps} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={strokeColor} strokeWidth="0.75" strokeDasharray="4 4" />
      </motion.svg>
    );
  }

  if (shape.type === 'cross') {
    return (
      <motion.svg {...motionProps} width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2V22M2 12H22" stroke={strokeColor} strokeWidth="1" />
      </motion.svg>
    );
  }

  // square
  return (
    <motion.svg {...motionProps} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" stroke={strokeColor} strokeWidth="1.5" />
    </motion.svg>
  );
}

export function AnimatedBackground() {
  const shapes = useRef(generateShapes()).current;
  const cursorX = useMotionValue(0.5);
  const cursorY = useMotionValue(0.5);
  const springX = useSpring(cursorX, { stiffness: 50, damping: 20 });
  const springY = useSpring(cursorY, { stiffness: 50, damping: 20 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      cursorX.set(e.clientX / window.innerWidth);
      cursorY.set(e.clientY / window.innerHeight);
    },
    [cursorX, cursorY]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {/* Mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-obsidian-950 via-obsidian-900 to-obsidian-950" />

      {/* Cursor-reactive radial glow */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          left: 0,
          top: 0,
          scaleX: 1.5,
        }}
      />

      {/* Fixed accent orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse-glow"
        style={{ background: 'rgb(var(--accent))' }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-5 animate-pulse-glow"
        style={{ background: 'rgb(var(--accent))', animationDelay: '1.5s' }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Floating shapes */}
      {shapes.map((shape) => (
        <ShapeEl key={shape.id} shape={shape} />
      ))}
    </div>
  );
}
