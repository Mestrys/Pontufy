'use client';

import Link from 'next/link';
import { Route, Users, BookOpen, CheckCircle2, Coins } from 'lucide-react';
import { TRACKS, coursesOfTrack } from '@/lib/tracks';
import { useAppStore } from '@/store/useAppStore';

export default function TracksPage() {
  const completedLessonIds = useAppStore((s) => s.completedLessonIds);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Trilhas de Aprendizado</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Jornadas completas de desenvolvimento, compostas por cursos que se complementam.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {TRACKS.map((track) => {
          const courses = coursesOfTrack(track);
          const allLessons = courses.flatMap((c) => c.lessons);
          const doneLessons = allLessons.filter((l) => completedLessonIds.includes(l.id));
          const progress = Math.round((doneLessons.length / allLessons.length) * 100);
          const totalPoints = allLessons.reduce((sum, l) => sum + l.points, 0);

          return (
            <article
              key={track.id}
              data-testid={`track-${track.id}`}
              className="space-y-5 rounded-2xl border border-edge bg-surface-1 p-6"
            >
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-mint">
                  <Route className="h-3.5 w-3.5" />
                  Trilha corporativa
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink">
                  {track.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-faint">{track.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {track.audience}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {courses.length} cursos · {allLessons.length} aulas
                </span>
                <span className="flex items-center gap-1 font-semibold text-mint">
                  <Coins className="h-3.5 w-3.5" />
                  {totalPoints} pts
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-mint transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums text-ink-muted">
                  {progress}%
                </span>
              </div>

              <ul className="space-y-2">
                {courses.map((course, index) => {
                  const done = course.lessons.every((l) => completedLessonIds.includes(l.id));
                  return (
                    <li key={course.id}>
                      <Link
                        href={`/courses/${course.id}`}
                        className="flex items-center gap-3 rounded-xl border border-edge bg-surface-0 px-4 py-3 transition-colors hover:border-ink-dim"
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-mint" />
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-edge text-[10px] font-semibold text-ink-muted">
                            {index + 1}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                          {course.title}
                        </span>
                        <span className="shrink-0 text-xs text-ink-faint">
                          {course.lessons.length} aulas
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
