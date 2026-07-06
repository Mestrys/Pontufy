'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  Loader2,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import type { Course } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

export default function CoursePlayer({ course }: { course: Course }) {
  const completedLessonIds = useAppStore((s) => s.completedLessonIds);
  const completeLesson = useAppStore((s) => s.completeLesson);
  const completingLessonId = useAppStore((s) => s.completingLessonId);

  const firstPendingIndex = course.lessons.findIndex(
    (l) => !completedLessonIds.includes(l.id)
  );
  const [activeIndex, setActiveIndex] = useState(
    firstPendingIndex === -1 ? 0 : firstPendingIndex
  );
  const [error, setError] = useState<string | null>(null);

  const activeLesson = course.lessons[activeIndex];
  const isCompleted = completedLessonIds.includes(activeLesson.id);
  const isCompleting = completingLessonId === activeLesson.id;
  const completedCount = course.lessons.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;
  const progress = Math.round((completedCount / course.lessons.length) * 100);

  const handleComplete = async () => {
    setError(null);
    try {
      await completeLesson(course.id, activeLesson.id, activeLesson.title);
      // Avança para a próxima aula pendente, se houver
      const nextIndex = course.lessons.findIndex(
        (l, i) => i > activeIndex && !completedLessonIds.includes(l.id)
      );
      if (nextIndex !== -1) {
        window.setTimeout(() => setActiveIndex(nextIndex), 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao concluir a aula.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar ao início
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Painel de conteúdo — 70% */}
        <div className="min-w-0 lg:w-[70%]">
          <div
            className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-edge bg-gradient-to-br ${course.gradient}`}
          >
            <button
              type="button"
              aria-label="Reproduzir aula"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 transition-transform hover:scale-105"
            >
              <Play className="ml-1 h-6 w-6 fill-black text-black" />
            </button>
            {/* Sobre overlay preto (mídia): cor literal, independe do tema */}
            <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-gray-300 backdrop-blur">
              Aula {activeIndex + 1} de {course.lessons.length} · {activeLesson.durationMin} min
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">
                  {activeLesson.title}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-faint">
                  <Sparkles className="h-3.5 w-3.5 text-mint" />
                  {course.title}
                </p>
              </div>

              {isCompleted ? (
                <span
                  data-testid="lesson-completed-badge"
                  className="flex items-center gap-2 rounded-xl border border-mint/30 bg-mint/10 px-4 py-2.5 text-sm font-semibold text-mint"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aula concluída · +{activeLesson.points} pts
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isCompleting}
                  data-testid="complete-lesson"
                  className="flex items-center gap-2 rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Coins className="h-4 w-4" />
                  )}
                  {isCompleting
                    ? 'Registrando...'
                    : `Concluir Aula e Ganhar ${activeLesson.points} Pontos`}
                </button>
              )}
            </div>

            {error && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
                {error}
              </p>
            )}

            <div className="space-y-4 rounded-xl border border-edge bg-surface-1 p-6">
              {activeLesson.content.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-ink-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Painel do currículo — 30% */}
        <aside className="lg:w-[30%]">
          <div className="rounded-xl border border-edge bg-surface-1">
            <div className="border-b border-edge p-4">
              <h2 className="text-sm font-semibold text-ink">Conteúdo do curso</h2>
              <div className="mt-3 flex items-center gap-3">
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
            </div>

            <ul>
              {course.lessons.map((lesson, index) => {
                const done = completedLessonIds.includes(lesson.id);
                const active = index === activeIndex;
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`flex w-full items-start gap-3 border-b border-edge p-4 text-left transition-colors last:border-b-0 ${
                        active ? 'bg-surface-2' : 'hover:bg-surface-2/50'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                      ) : (
                        <Circle
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            active ? 'text-ink' : 'text-ink-dim'
                          }`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium leading-snug ${
                            active ? 'text-ink' : done ? 'text-ink-muted' : 'text-ink-soft'
                          }`}
                        >
                          {index + 1}. {lesson.title}
                        </p>
                        <p className="mt-1 flex items-center gap-3 text-xs text-ink-faint">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.durationMin} min
                          </span>
                          <span className={`flex items-center gap-1 ${done ? 'text-mint' : ''}`}>
                            <Coins className="h-3 w-3" />
                            {lesson.points} pts
                          </span>
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
