'use client';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface CountUpProps {
  value: number;
  duration?: number; // ms
  className?: string;
  format?: (n: number) => string;
}

// Efeito de contagem acelerada (M3 motion: emphasized) ao creditar pontos.
// Com prefers-reduced-motion, o valor é exibido instantaneamente (sem animar).
export function CountUp({ value, duration = 900, className, format }: CountUpProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    const to = value;
    previous.current = to;

    if (reduced || from === to) {
      setDisplay(to);
      return;
    }

    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      // easing emphasized M3: acelera rápido, desacelera suave
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  const formatted = format ? format(display) : display.toLocaleString('pt-BR');
  return <span className={className}>{formatted}</span>;
}