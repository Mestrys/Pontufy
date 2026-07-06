'use client';

import Link from 'next/link';
import { Play, Sparkles, BookOpen } from 'lucide-react';
import type { Course } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

export default function CourseCard({ course }: { course: Course }) {
  const completedLessonIds = useAppStore((s) => s.completedLessonIds);
  const completed = course.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progress = Math.round((completed / course.lessons.length) * 100);
  const totalPoints = course.lessons.reduce((sum, l) => sum + l.points, 0);

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group w-64 shrink-0 snap-start overflow-hidden rounded-xl border border-edge bg-surface-1 transition-colors hover:border-ink-dim"
    >
      <div
        className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${course.gradient}`}
      >
        <BookOpen className="h-10 w-10 text-white/25 transition-transform group-hover:scale-110" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
            <Play className="h-4 w-4 fill-black text-black" />
          </span>
        </div>
        {course.aiGenerated && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-mint backdrop-blur">
            <Sparkles className="h-3 w-3" />
            IA
          </span>
        )}
        {progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
            <div className="h-full bg-mint" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {course.category}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
          {course.title}
        </h3>
        <div className="flex items-center justify-between pt-1 text-xs text-ink-muted">
          <span>{course.lessons.length} aulas</span>
          <span className="font-semibold text-mint">{totalPoints} pts</span>
        </div>
      </div>
    </Link>
  );
}
