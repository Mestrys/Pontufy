'use client';

import { BookOpen, PlayCircle, CheckCircle2 } from 'lucide-react';
import { COURSES } from '@/lib/data';
import type { Course } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import CourseCard from '@/components/dashboard/CourseCard';

function courseProgress(course: Course, completedLessonIds: string[]): number {
  const done = course.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  return Math.round((done / course.lessons.length) * 100);
}

function Section({
  title,
  icon: Icon,
  courses,
}: {
  title: string;
  icon: typeof BookOpen;
  courses: Course[];
}) {
  if (courses.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
        <Icon className="h-4 w-4 text-mint" />
        {title}
        <span className="text-sm font-normal text-ink-faint">({courses.length})</span>
      </h2>
      <div className="flex flex-wrap gap-5">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}

export default function CoursesPage() {
  const completedLessonIds = useAppStore((s) => s.completedLessonIds);

  const inProgress = COURSES.filter((c) => {
    const p = courseProgress(c, completedLessonIds);
    return p > 0 && p < 100;
  });
  const completed = COURSES.filter((c) => courseProgress(c, completedLessonIds) === 100);
  const available = COURSES.filter((c) => courseProgress(c, completedLessonIds) === 0);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Cursos</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Todos os cursos disponíveis para você — continue de onde parou ou comece algo novo.
        </p>
      </div>

      <Section title="Em andamento" icon={PlayCircle} courses={inProgress} />
      <Section title="Disponíveis" icon={BookOpen} courses={available} />
      <Section title="Concluídos" icon={CheckCircle2} courses={completed} />
    </div>
  );
}
