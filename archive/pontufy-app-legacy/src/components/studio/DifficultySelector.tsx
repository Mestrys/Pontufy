'use client';

import { Sprout, TrendingUp, Flame, Rocket, Check } from 'lucide-react';
import type { Difficulty } from '@/lib/types';
import { DIFFICULTY_OPTIONS } from '@/lib/studio';

const DIFFICULTY_ICONS: Record<Difficulty, typeof Sprout> = {
  beginner: Sprout,
  intermediate: TrendingUp,
  advanced: Flame,
  super: Rocket,
};

interface DifficultySelectorProps {
  value: Difficulty | null;
  onChange: (difficulty: Difficulty) => void;
}

export default function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <section className="rounded-2xl border border-edge bg-surface-1 p-6">
      <h2 className="text-base font-semibold text-ink">Nível de Dificuldade</h2>
      <p className="mt-1 text-sm text-ink-faint">
        Define a profundidade do conteúdo e a faixa de pontos que os colaboradores podem ganhar.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DIFFICULTY_OPTIONS.map((option) => {
          const Icon = DIFFICULTY_ICONS[option.id];
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              data-testid={`difficulty-${option.id}`}
              className={`flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? 'border-mint/60 bg-mint/5'
                  : 'border-edge bg-surface-0 hover:border-ink-dim'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    selected ? 'bg-mint/15' : 'bg-surface-2'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${selected ? 'text-mint' : 'text-ink-muted'}`} />
                </span>
                {selected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint">
                    <Check className="h-3 w-3 text-black" />
                  </span>
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold ${selected ? 'text-ink' : 'text-ink-soft'}`}>
                  {option.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-faint">{option.description}</p>
              </div>
              <p className={`text-xs font-semibold ${selected ? 'text-mint' : 'text-ink-faint'}`}>
                {option.minPoints}–{option.maxPoints} pts
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
