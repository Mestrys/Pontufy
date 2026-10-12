'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import HeroCourse, { type HeroCourseData } from '@/components/dashboard/HeroCourse';
import ContinueCard, { type ContinueCourse } from '@/components/dashboard/ContinueCard';
import CourseRow from '@/components/dashboard/CourseRow';
import SurpriseRewardToast from '@/components/dashboard/SurpriseRewardToast';
import StreakCard from '@/components/dashboard/StreakCard';
import { useCourses, useEnrolledCourses } from '@/hooks/useApi';
import { getCachedCourses, reconcileWithApi, type CachedCourse } from '@/lib/local-courses';
import { DashboardSkeleton, LoadingRegion } from '@/components/ui/Skeleton';

function mergeCourses(apiCourses: any[], local: CachedCourse[]): any[] {
  const apiIds = new Set(apiCourses.map((c: any) => c.id));
  reconcileWithApi(apiIds);
  const fresh = local.filter((c) => !apiIds.has(c.id));
  return [...fresh, ...apiCourses];
}

interface CourseSummary {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  lessons?: { pointsAssigned?: number }[];
}

interface EnrolledCourse {
  id: string;
  title: string;
  status: 'available' | 'in_progress' | 'completed';
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonTitle?: string | null;
  lastActivityAt?: string | null;
  imageUrl?: string | null;
}

export default function Home() {
  const { data: coursesResponse, isLoading: loadingCourses } = useCourses();
  const { data: enrolledCourses, isLoading: loadingEnrolled } = useEnrolledCourses();
  const [localCourses, setLocalCourses] = useState<CachedCourse[]>([]);

  useEffect(() => {
    setLocalCourses(getCachedCourses());
  }, []);

  const apiCourses = Array.isArray(coursesResponse?.data) ? coursesResponse.data : [];
  const allCourses = mergeCourses(apiCourses, localCourses);
  const enrolled = Array.isArray(enrolledCourses) ? enrolledCourses : [];

  const searchQuery = useStore((s) => s.searchQuery);

  const filterCourses = (courses: any[]) => {
    if (!searchQuery) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  };

  const lessonPoints = (c: CourseSummary) =>
    c.lessons?.reduce((sum, l) => sum + (l.pointsAssigned || 0), 0) || 0;

  // "Continuar": o curso em andamento com atividade mais recente.
  const inProgressEnrolled = (enrolled as EnrolledCourse[])
    .filter((c) => c.status === 'in_progress')
    .sort((a, b) => (b.lastActivityAt ?? '').localeCompare(a.lastActivityAt ?? ''));
  const continueCourse: ContinueCourse | null = inProgressEnrolled[0]
    ? {
        id: inProgressEnrolled[0].id,
        title: inProgressEnrolled[0].title,
        nextLessonTitle: inProgressEnrolled[0].nextLessonTitle ?? null,
        completedLessons: inProgressEnrolled[0].completedLessons,
        totalLessons: inProgressEnrolled[0].totalLessons,
        progress: inProgressEnrolled[0].progress,
      }
    : null;

  // Destaque: o curso mais novo que a pessoa ainda não começou.
  const startedIds = new Set(
    (enrolled as EnrolledCourse[]).filter((c) => c.status !== 'available').map((c) => c.id),
  );
  const notStarted = (allCourses as CourseSummary[]).filter((c) => !startedIds.has(c.id));
  const heroSource = notStarted[0];
  const heroCourse: HeroCourseData | null = heroSource
    ? {
        id: heroSource.id,
        title: heroSource.title,
        description: heroSource.description || '',
        lessonsCount: heroSource.lessons?.length || 0,
        pointsReward: lessonPoints(heroSource),
        thumbnail:
          heroSource.imageUrl ||
          'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1400',
      }
    : null;

  // Os outros cursos em andamento (o primeiro já está no cartão "Continuar").
  // Com busca ativa, as linhas trazem todos os cursos (cartão e destaque somem).
  const skip = searchQuery ? 0 : 1;
  const inProgress = inProgressEnrolled.slice(skip).map((c) => ({
    id: c.id,
    title: c.title,
    progress: c.progress,
    subtitle: `${c.completedLessons} de ${c.totalLessons} aulas`,
    thumbnail:
      c.imageUrl ||
      'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=600',
  }));

  const available = notStarted.slice(skip).map((c) => ({
    id: c.id,
    title: c.title,
    pointsReward: lessonPoints(c),
    thumbnail:
      c.imageUrl ||
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600',
  }));

  const filteredInProgress = filterCourses(inProgress);
  const filteredAvailable = filterCourses(available);

  const isLoading = loadingCourses || loadingEnrolled;

  return (
    <div className="min-h-screen pb-20 bg-md-surface-dim">
      <SurpriseRewardToast />

      {isLoading ? (
        <LoadingRegion label="Carregando o início…">
          <DashboardSkeleton />
        </LoadingRegion>
      ) : (
        <div className="pt-6 px-4 sm:px-8 md:px-16 space-y-8">
          <h1 className="sr-only">Início</h1>
          {continueCourse && !searchQuery && <ContinueCard course={continueCourse} />}
          {heroCourse && !searchQuery && <HeroCourse course={heroCourse} />}

          <StreakCard />

          <div className="-mx-4 sm:-mx-8 md:-mx-16">
            {filteredInProgress.length > 0 && (
              <CourseRow title={searchQuery ? 'Em andamento' : 'Também em andamento'} courses={filteredInProgress} />
            )}

            {filteredAvailable.length > 0 && (
              <CourseRow title={searchQuery ? 'Cursos' : 'Mais cursos para você'} courses={filteredAvailable} />
            )}
          </div>

          {filteredInProgress.length === 0 && filteredAvailable.length === 0 && (searchQuery || (!heroCourse && !continueCourse)) && (
            <p className="py-20 text-center text-base text-md-on-surface-muted">
              {searchQuery
                ? `Nenhum curso encontrado para "${searchQuery}".`
                : 'Nenhum curso disponível ainda. Peça ao seu gestor para criar treinamentos.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
