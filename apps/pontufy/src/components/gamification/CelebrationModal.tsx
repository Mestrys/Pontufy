'use client';

import { useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Coins, Trophy, Sparkles, Crown, Medal } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';

interface CelebrationModalProps {
  isVisible: boolean;
  onComplete: () => void;
  type: 'levelUp' | 'achievement' | 'milestone';
  title: string;
  subtitle: string;
  points?: number;
  newTier?: {
    name: string;
    color: string;
    icon: typeof Trophy | typeof Crown | typeof Medal;
    maxPoints?: number;
  };
  previousTier?: string;
  /** Destino do foco ao fechar se o botão que disparou a celebração sumiu. */
  returnFocus?: () => HTMLElement | null | undefined;
}

const TIER_ICONS: Record<string, typeof Trophy | typeof Crown | typeof Medal> = {
  Aprendiz: Trophy,
  Analista: Medal,
  'Analista Sênior': Trophy,
  Especialista: Crown,
  Mestre: Crown,
};

const TIER_COLORS: Record<string, string> = {
  Aprendiz: 'text-md-on-surface-variant',
  Analista: 'text-md-tertiary',
  'Analista Sênior': 'text-blue-400',
  Especialista: 'text-md-highlight',
  Mestre: 'text-purple-400',
};

const TIER_BG: Record<string, string> = {
  Aprendiz: 'bg-md-on-surface-variant/10 border-md-on-surface-variant/30',
  Analista: 'bg-md-tertiary/10 border-md-tertiary/30',
  'Analista Sênior': 'bg-blue-500/10 border-blue-500/30',
  Especialista: 'bg-md-highlight/10 border-md-highlight/30',
  Mestre: 'bg-purple-500/10 border-purple-500/30',
};

export default function CelebrationModal({
  isVisible,
  onComplete,
  type,
  title,
  subtitle,
  points,
  newTier,
  previousTier,
  returnFocus,
}: CelebrationModalProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const subtitleId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  // Fecha só por ação da pessoa (sem timer). O Dialog cuida do foco em
  // "Continuar", do Escape, do foco preso e de devolver o foco ao fechar; ele
  // guarda onClose em ref, então o arrow function inline do pai não reabre nada.

  // Com movimento reduzido, nenhum loop (escala, rotação, partículas).
  const loop = <T,>(value: T) => (reduced ? undefined : value);

  const TierIcon = newTier ? TIER_ICONS[newTier.name] : Trophy;
  const tierColor = newTier ? TIER_COLORS[newTier.name] : 'text-md-tertiary';
  const tierBg = newTier ? TIER_BG[newTier.name] : 'bg-md-tertiary/10 border-md-tertiary/30';

  return (
    <Dialog
      open={isVisible}
      onClose={onComplete}
      labelledBy={titleId}
      describedBy={subtitleId}
      initialFocus={continueRef}
      returnFocus={returnFocus}
      backdropClassName="bg-black/60"
      className="bg-md-surface px-10 py-8 rounded-2xl shadow-2xl border border-md-outline flex flex-col items-center gap-4 max-w-md w-full"
    >
            {/* Animated background glow */}
            <motion.div
              animate={loop({ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] })}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-2xl ${tierBg} pointer-events-none` }
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onComplete}
              className="absolute top-2 right-2 size-11 flex items-center justify-center rounded-lg hover:bg-md-on-surface-strong/5 transition-colors text-md-on-surface-muted hover:text-md-on-surface-strong"
              aria-label="Fechar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Main icon */}
            <motion.div
              animate={loop({
                scale: [1, 1.15, 1],
                rotate: [0, 3, -3, 0]
              })}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`relative p-5 rounded-full ${tierBg.replace('border-', 'border-2 ')} flex items-center justify-center`}
            >
              <TierIcon size={48} className={tierColor} />
            </motion.div>

            {/* Floating particles */}
            {!reduced && (
            <motion.div
              animate={{ y: [0, -10, 0], opacity: [0, 0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 flex gap-1 pointer-events-none"
            >
              {[...Array(4)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  className={`w-2 h-2 rounded-full ${tierColor.replace('text-', 'bg-')}`}
                />
              ))}
            </motion.div>
            )}

            {/* Content */}
            <div className="text-center relative z-10">
              <h2 id={titleId} className="text-2xl font-black text-md-on-surface-strong mb-1">{title}</h2>
              <p id={subtitleId} className="text-md-on-surface-variant text-sm mb-4">{subtitle}</p>

              {type === 'levelUp' && newTier && (
                <div className={`mb-4 p-4 rounded-xl ${tierBg} flex items-center justify-center gap-3`}>
                  <div className="text-center">
                    <p className="text-xs text-md-on-surface-muted uppercase tracking-wider mb-0.5">
                      {previousTier ? `De ${previousTier}` : 'Novo nível'}
                    </p>
                    <p className={`text-lg font-black ${tierColor}`}>{newTier.name}</p>
                  </div>
                  <div className="w-px h-10 bg-current/30" aria-hidden="true" />
                  <div className="text-center">
                    <p className="text-xs text-md-on-surface-muted uppercase tracking-wider mb-0.5">
                      {newTier.maxPoints ? 'Para o próximo nível' : 'Você chegou ao'}
                    </p>
                    <p className="text-lg font-black text-md-on-surface">
                      {newTier.maxPoints
                        ? `Faltam ${Math.max(0, newTier.maxPoints - (points ?? 0)).toLocaleString('pt-BR')} pts`
                        : 'Nível máximo'}
                    </p>
                  </div>
                </div>
              )}

              {points && type !== 'levelUp' && (
                <motion.div
                  animate={loop({ scale: [1, 1.05, 1] })}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="inline-flex items-center gap-2 bg-md-tertiary/10 border border-md-tertiary/30 rounded-full px-5 py-2 mb-4"
                >
                  <Coins size={20} className="text-md-tertiary" />
                  <span className="text-lg font-black text-md-tertiary">+{points} Pontos</span>
                </motion.div>
              )}

              {type === 'achievement' && (
                <div className="inline-flex items-center gap-2 bg-md-highlight/10 border border-md-highlight/30 rounded-full px-5 py-2 mb-4">
                  <Sparkles size={18} className="text-md-highlight" />
                  <span className="text-sm font-bold text-md-highlight">Conquista desbloqueada</span>
                </div>
              )}

              <button
                ref={continueRef}
                type="button"
                onClick={onComplete}
                className="mt-2 h-11 px-6 rounded-full font-bold text-sm bg-md-surface-container text-md-on-surface-strong hover:bg-md-surface-container-high border border-md-outline transition-colors"
              >
                Continuar
              </button>
            </div>

            {/* Subtle progress hint */}
            {newTier && !previousTier && (
              <p className="text-xs text-md-on-surface-muted mt-2 uppercase tracking-wider">
                Continue evoluindo — cada aula te aproxima do próximo nível
              </p>
            )}
    </Dialog>
  );
}