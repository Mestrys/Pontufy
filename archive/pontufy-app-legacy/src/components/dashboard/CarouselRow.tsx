'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselRowProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function CarouselRow({ title, subtitle, children }: CarouselRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({
      left: direction * Math.round(trackRef.current.clientWidth * 0.8),
      behavior: 'smooth',
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="text-sm text-ink-faint">{subtitle}</p>}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={`Rolar ${title} para a esquerda`}
            className="rounded-full border border-edge bg-surface-1 p-2 text-ink-muted transition-colors hover:border-ink-dim hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={`Rolar ${title} para a direita`}
            className="rounded-full border border-edge bg-surface-1 p-2 text-ink-muted transition-colors hover:border-ink-dim hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {children}
      </div>
    </section>
  );
}
