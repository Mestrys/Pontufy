'use client';

import { useEffect, useRef, useState } from 'react';
import { Coins, Layers } from 'lucide-react';
import type { Difficulty } from '@/lib/types';
import { calculateMaxPoints, getDifficultyOption } from '@/lib/studio';

interface PointsCalculatorProps {
  difficulty: Difficulty | null;
  sourceCount: number;
}

/**
 * Anima o número do valor atual até o alvo em ~450ms.
 * Usa setInterval + snap final (rAF é pausado em abas em segundo plano,
 * o que congelaria o valor no meio da animação).
 */
function useAnimatedNumber(target: number) {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(display);
  displayRef.current = display;

  useEffect(() => {
    const from = displayRef.current;
    if (from === target) return;
    const start = performance.now();
    const duration = 450;

    const interval = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t >= 1) window.clearInterval(interval);
    }, 24);
    // Garante o valor final mesmo com timers estrangulados
    const snap = window.setTimeout(() => setDisplay(target), duration + 100);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(snap);
      setDisplay(target);
    };
  }, [target]);

  return display;
}

export default function PointsCalculator({ difficulty, sourceCount }: PointsCalculatorProps) {
  const maxPoints = difficulty ? calculateMaxPoints(difficulty, sourceCount) : 0;
  const animated = useAnimatedNumber(maxPoints);
  const option = difficulty ? getDifficultyOption(difficulty) : null;
  const rangePercent = option
    ? Math.round(((maxPoints - option.minPoints) / (option.maxPoints - option.minPoints)) * 100)
    : 0;

  return (
    <section className="rounded-2xl border border-edge bg-surface-1 p-6">
      <h2 className="text-base font-semibold text-ink">Pontuação Máxima Potencial</h2>
      <p className="mt-1 text-sm text-ink-faint">
        Recompensa total que o colaborador pode acumular ao concluir o curso.
      </p>

      <div className="mt-5 flex items-center justify-center rounded-xl border border-mint/20 bg-mint/5 py-8">
        {difficulty ? (
          <div className="text-center">
            <p
              data-testid="max-points"
              className="flex items-baseline justify-center gap-2 text-5xl font-bold tabular-nums tracking-tight text-mint"
            >
              <Coins className="h-8 w-8 self-center" />
              {animated}
              <span className="text-xl font-semibold text-mint/70">pts</span>
            </p>
            <p className="mt-2 text-xs text-ink-faint">
              Faixa {option!.label}: {option!.minPoints}–{option!.maxPoints} pts
            </p>
          </div>
        ) : (
          <p className="px-6 text-center text-sm text-ink-dim">
            Selecione um nível de dificuldade para calcular a recompensa.
          </p>
        )}
      </div>

      {difficulty && (
        <div className="mt-4 space-y-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-mint transition-all duration-500"
              style={{ width: `${rangePercent}%` }}
            />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Layers className="h-3.5 w-3.5" />
            {sourceCount === 0
              ? 'Adicione fontes para elevar a recompensa dentro da faixa.'
              : `${sourceCount} ${sourceCount === 1 ? 'fonte eleva' : 'fontes elevam'} a recompensa a ${rangePercent}% da faixa.`}
          </p>
        </div>
      )}
    </section>
  );
}
