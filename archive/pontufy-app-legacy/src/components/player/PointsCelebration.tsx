'use client';

import { useEffect } from 'react';
import { CheckCircle2, Coins } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function PointsCelebration() {
  const celebration = useAppStore((s) => s.celebration);
  const dismissCelebration = useAppStore((s) => s.dismissCelebration);

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(dismissCelebration, 3200);
    return () => window.clearTimeout(timer);
  }, [celebration, dismissCelebration]);

  if (!celebration) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
      <div
        data-testid="celebration-toast"
        className="animate-celebration pointer-events-auto flex items-center gap-4 rounded-2xl border border-mint/30 bg-surface-1 px-6 py-4 shadow-2xl shadow-black/60"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mint/15">
          <CheckCircle2 className="h-6 w-6 text-mint" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Aula concluída!</p>
          <p className="max-w-xs truncate text-xs text-ink-muted">{celebration.lessonTitle}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1.5">
          <Coins className="h-4 w-4 text-mint" />
          <span className="text-sm font-bold text-mint">+{celebration.points} pts</span>
        </div>
      </div>
    </div>
  );
}
