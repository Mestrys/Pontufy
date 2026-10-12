import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';

export interface ContinueCourse {
  id: string;
  title: string;
  nextLessonTitle: string | null;
  completedLessons: number;
  totalLessons: number;
  progress: number;
}

// Primeiro elemento do Início: retoma o curso mexido mais recentemente.
export default function ContinueCard({ course }: { course: ContinueCourse }) {
  return (
    <section aria-labelledby="continue-heading" className="rounded-2xl border border-md-outline bg-md-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="hidden sm:flex size-12 flex-none items-center justify-center rounded-full bg-md-tertiary/10 text-md-tertiary">
          <PlayCircle size={24} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-md-on-surface-muted">Continue de onde parou</p>
          <h2 id="continue-heading" className="mt-1 text-lg sm:text-xl font-bold text-white text-balance">
            {course.nextLessonTitle ?? course.title}
          </h2>
          {course.nextLessonTitle && (
            <p className="mt-0.5 text-sm text-md-on-surface-variant truncate">{course.title}</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 max-w-xs overflow-hidden rounded-full bg-md-surface-container"
              role="progressbar"
              aria-label={`Progresso em ${course.title}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={course.progress}
            >
              <div className="h-full rounded-full bg-md-tertiary" style={{ width: `${course.progress}%` }} />
            </div>
            <span className="text-xs text-md-on-surface-muted whitespace-nowrap">
              {course.completedLessons} de {course.totalLessons} aulas
            </span>
          </div>
        </div>
        <Link
          href={`/player/${course.id}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-md-primary px-6 text-sm font-bold text-md-on-primary transition-colors hover:bg-md-primary-container"
        >
          Continuar <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
