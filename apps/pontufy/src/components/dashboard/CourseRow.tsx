'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Coins, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface RowCourse {
  id: string;
  title: string;
  thumbnail: string;
  progress?: number;
  subtitle?: string;
  pointsReward?: number;
}

// Carrossel horizontal de cursos. No desktop ganha botões anterior/próximo
// (sem mouse com rolagem lateral não havia como avançar); o zoom no hover só
// acontece sem preferência por movimento reduzido.
export default function CourseRow({ title, courses }: { title: string; courses: RowCourse[] }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update, courses.length]);

  const page = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  };

  const headingId = `row-${title.replace(/\W+/g, '-').toLowerCase()}`;

  return (
    <section aria-labelledby={headingId} className="px-4 sm:px-8 md:px-16 mb-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h2>
        <div className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={edges.start}
            aria-label={`Cursos anteriores em ${title}`}
            className="size-11 flex items-center justify-center rounded-full text-md-on-surface-variant hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={edges.end}
            aria-label={`Mais cursos em ${title}`}
            className="size-11 flex items-center justify-center rounded-full text-md-on-surface-variant hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul ref={scroller} onScroll={update} className="flex gap-2 sm:gap-3 overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4">
        {courses.map((course) => (
          <li key={course.id} className="flex-none w-[180px] sm:w-[220px]">
            <Link href={`/player/${course.id}`} className="group block">
              <div className="relative aspect-video rounded-md overflow-hidden transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.03]">
                <img src={course.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                {course.progress !== undefined && course.progress > 0 && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black/60">
                    <div className="h-full bg-md-tertiary" style={{ width: `${course.progress}%` }} />
                  </div>
                )}
              </div>
              <div className="mt-2 px-0.5">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-300 line-clamp-1 group-hover:text-white transition-colors">
                  {course.title}
                </h3>
                {course.subtitle ? (
                  <p className="mt-0.5 text-xs text-md-on-surface-muted">{course.subtitle}</p>
                ) : (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-md-tertiary font-bold">
                    <Coins size={12} aria-hidden="true" /> +{course.pointsReward} pts
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
