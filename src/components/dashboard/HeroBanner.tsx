'use client';

import Link from 'next/link';
import { Play, Sparkles, ShieldAlert, Clock } from 'lucide-react';
import type { Course } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

export default function HeroBanner({ course }: { course: Course }) {
  const completedLessonIds = useAppStore((s) => s.completedLessonIds);
  const completed = course.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const totalMin = course.lessons.reduce((sum, l) => sum + l.durationMin, 0);
  const totalPoints = course.lessons.reduce((sum, l) => sum + l.points, 0);
  const progress = Math.round((completed / course.lessons.length) * 100);

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-edge bg-gradient-to-br ${course.gradient}`}
    >
      <div className="relative z-10 flex flex-col gap-6 p-8 sm:p-12 lg:max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {course.mandatory && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              Obrigatório
            </span>
          )}
          {course.aiGenerated && (
            <span className="flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">
              <Sparkles className="h-3.5 w-3.5" />
              Gerado por IA
            </span>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-400">{course.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {totalMin} min
          </span>
          <span>{course.lessons.length} aulas</span>
          <span className="font-semibold text-mint">{totalPoints} pts no total</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/courses/${course.id}`}
            className="flex items-center gap-2 rounded-xl bg-mint px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-300"
          >
            <Play className="h-4 w-4 fill-current" />
            {completed > 0 ? 'Continuar Aprendendo' : 'Começar a Aprender'}
          </Link>
          {completed > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-mint" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-medium text-gray-400">{progress}%</span>
            </div>
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
    </section>
  );
}
