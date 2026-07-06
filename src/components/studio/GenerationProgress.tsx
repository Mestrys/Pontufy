'use client';

import { CheckCircle2, Loader2, Circle } from 'lucide-react';

export const GENERATION_STEPS = [
  'Lendo e indexando fontes...',
  'Estruturando a ementa...',
  'Gerando aulas e exercícios...',
  'Calculando recompensas...',
];

export default function GenerationProgress({ currentStep }: { currentStep: number }) {
  return (
    <div
      data-testid="generation-progress"
      className="space-y-3 rounded-2xl border border-edge bg-surface-1 p-6"
    >
      {GENERATION_STEPS.map((label, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        return (
          <div key={label} className="flex items-center gap-3">
            {done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-mint" />
            ) : active ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-mint" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-ink-dim" />
            )}
            <span
              className={`text-sm ${
                done ? 'text-ink-faint line-through' : active ? 'font-medium text-ink' : 'text-ink-dim'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
