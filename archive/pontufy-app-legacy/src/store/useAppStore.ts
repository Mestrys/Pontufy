'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_USER } from '@/lib/data';
import type { Redemption } from '@/lib/types';

interface CelebrationState {
  points: number;
  lessonTitle: string;
}

interface AppState {
  userName: string;
  userRole: string;
  points: number;
  completedLessonIds: string[];
  redemptions: Redemption[];
  celebration: CelebrationState | null;
  completingLessonId: string | null;
  redeemingRewardId: string | null;

  completeLesson: (courseId: string, lessonId: string, lessonTitle: string) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<Redemption>;
  dismissCelebration: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userName: INITIAL_USER.name,
      userRole: INITIAL_USER.role,
      points: INITIAL_USER.points,
      completedLessonIds: INITIAL_USER.completedLessonIds,
      redemptions: [],
      celebration: null,
      completingLessonId: null,
      redeemingRewardId: null,

      completeLesson: async (courseId, lessonId, lessonTitle) => {
        const { completedLessonIds, completingLessonId } = get();
        if (completedLessonIds.includes(lessonId) || completingLessonId) return;

        set({ completingLessonId: lessonId });
        try {
          const res = await fetch('/api/lessons/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, lessonId }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.error ?? 'Falha ao registrar conclusão da aula.');
          }
          const data: { pointsAwarded: number } = await res.json();
          set((state) => ({
            points: state.points + data.pointsAwarded,
            completedLessonIds: [...state.completedLessonIds, lessonId],
            celebration: { points: data.pointsAwarded, lessonTitle },
          }));
        } finally {
          set({ completingLessonId: null });
        }
      },

      redeemReward: async (rewardId) => {
        const { points, redeemingRewardId } = get();
        if (redeemingRewardId) throw new Error('Resgate em andamento.');

        set({ redeemingRewardId: rewardId });
        try {
          const res = await fetch('/api/rewards/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardId, currentPoints: points }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(data?.error ?? 'Falha ao processar o resgate.');
          }
          const redemption: Redemption = {
            rewardId,
            code: data.code,
            affiliateUrl: data.affiliateUrl,
            redeemedAt: data.redeemedAt,
          };
          set((state) => ({
            points: state.points - data.pointsDeducted,
            redemptions: [redemption, ...state.redemptions],
          }));
          return redemption;
        } finally {
          set({ redeemingRewardId: null });
        }
      },

      dismissCelebration: () => set({ celebration: null }),
    }),
    {
      name: 'pontufy-app-state',
      // Evita mismatch de hidratação: o servidor e o primeiro render do cliente
      // usam o estado seed; o estado salvo é aplicado via rehydrate() após mount.
      skipHydration: true,
      partialize: (state) => ({
        points: state.points,
        completedLessonIds: state.completedLessonIds,
        redemptions: state.redemptions,
      }),
    }
  )
);
