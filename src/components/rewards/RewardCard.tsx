'use client';

import { Gift, Lock, Coins } from 'lucide-react';
import type { Reward } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

interface RewardCardProps {
  reward: Reward;
  onRedeem: (reward: Reward) => void;
  compact?: boolean;
}

export default function RewardCard({ reward, onRedeem, compact = false }: RewardCardProps) {
  const points = useAppStore((s) => s.points);
  const affordable = points >= reward.requiredPoints;
  const missing = reward.requiredPoints - points;

  return (
    <div
      className={`group flex shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-edge bg-surface-1 transition-colors hover:border-ink-dim ${
        compact ? 'w-64' : 'w-full'
      }`}
    >
      <div
        className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${reward.gradient}`}
      >
        <Gift className="h-9 w-9 text-white/25 transition-transform group-hover:scale-110" />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-ink-soft backdrop-blur">
          {reward.partner}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold leading-snug text-ink">{reward.title}</h3>
        {!compact && <p className="text-xs leading-relaxed text-ink-faint">{reward.description}</p>}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-mint">
            <Coins className="h-4 w-4" />
            {reward.requiredPoints.toLocaleString('pt-BR')} pts
          </span>

          <button
            type="button"
            onClick={() => onRedeem(reward)}
            disabled={!affordable}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              affordable
                ? 'bg-mint/15 text-mint hover:bg-mint/25'
                : 'cursor-not-allowed bg-surface-2 text-ink-faint'
            }`}
            title={affordable ? 'Resgatar recompensa' : `Faltam ${missing} pts`}
          >
            {affordable ? (
              'Resgatar'
            ) : (
              <>
                <Lock className="h-3 w-3" />
                Faltam {missing.toLocaleString('pt-BR')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
