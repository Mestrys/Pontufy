'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { COURSES, REWARDS } from '@/lib/data';
import type { Reward } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import HeroBanner from '@/components/dashboard/HeroBanner';
import CarouselRow from '@/components/dashboard/CarouselRow';
import CourseCard from '@/components/dashboard/CourseCard';
import RewardCard from '@/components/rewards/RewardCard';
import RedeemModal from '@/components/rewards/RedeemModal';

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? 'colaborador';
  const completedLessonIds = useAppStore((s) => s.completedLessonIds);
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null);

  const featuredCourse = COURSES.find((c) => c.mandatory) ?? COURSES[0];

  const inProgressCourses = COURSES.filter((course) => {
    const done = course.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
    return done > 0 && done < course.lessons.length;
  });

  const firstName = userName.split(' ')[0];

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <div className="space-y-4">
        <p className="text-sm text-ink-faint">Bem-vindo de volta, {firstName}.</p>
        <HeroBanner course={featuredCourse} />
      </div>

      <CarouselRow
        title="Trilhas Recomendadas pela IA"
        subtitle="Geradas a partir do seu cargo, metas e lacunas de habilidade"
      >
        {COURSES.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </CarouselRow>

      {inProgressCourses.length > 0 && (
        <CarouselRow title="Continue de onde parou" subtitle="Retome e garanta seus pontos">
          {inProgressCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </CarouselRow>
      )}

      <CarouselRow
        title="Clube de Benefícios"
        subtitle="Troque seus pontos por recompensas de parceiros"
      >
        {REWARDS.map((reward) => (
          <RewardCard key={reward.id} reward={reward} onRedeem={setRedeemTarget} compact />
        ))}
      </CarouselRow>

      {redeemTarget && (
        <RedeemModal reward={redeemTarget} onClose={() => setRedeemTarget(null)} />
      )}
    </div>
  );
}
