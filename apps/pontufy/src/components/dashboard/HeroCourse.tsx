import { ArrowRight, Coins } from 'lucide-react';
import Link from 'next/link';

export interface HeroCourseData {
  id: string;
  title: string;
  description: string;
  lessonsCount: number;
  pointsReward: number;
  thumbnail: string;
}

// Destaque de um curso novo, ainda não começado. Altura do conteúdo (sem vh)
// e uma ação só: "Começar curso" serve para aula em texto e em vídeo.
export default function HeroCourse({ course }: { course: HeroCourseData }) {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden rounded-2xl border border-md-outline bg-md-surface">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${course.thumbnail})` }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
      </div>

      <div className="relative px-5 py-8 sm:px-10 sm:py-12 max-w-2xl">
        <p className="inline-flex items-center rounded-full bg-md-tertiary-container px-3 py-1 text-xs font-bold text-md-on-tertiary-container">
          Novo curso
        </p>
        <h2 id="hero-heading" className="mt-4 text-2xl sm:text-4xl font-black tracking-tight text-on-media text-balance leading-tight">
          {course.title}
        </h2>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm font-semibold text-md-on-surface">
          <span>{course.lessonsCount} {course.lessonsCount === 1 ? 'aula' : 'aulas'}</span>
          <span aria-hidden="true" className="text-md-on-surface-muted">·</span>
          <span className="inline-flex items-center gap-1 text-md-tertiary">
            <Coins size={14} aria-hidden="true" /> +{course.pointsReward.toLocaleString('pt-BR')} pontos
          </span>
        </p>
        {course.description && (
          <p className="mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-md-on-surface line-clamp-3">
            {course.description}
          </p>
        )}
        <Link
          href={`/player/${course.id}`}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-md-primary px-6 text-sm font-bold text-md-on-primary transition-colors hover:bg-md-primary-container"
        >
          Começar curso <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
