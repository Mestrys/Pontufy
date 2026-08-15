'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Trophy, Sparkles, Crown, Medal } from 'lucide-react';

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
}

const TIER_ICONS: Record<string, typeof Trophy | typeof Crown | typeof Medal> = {
  Iniciante: Trophy,
  Analista: Medal,
  'Analista Sénior': Trophy,
  Especialista: Crown,
  Mestre: Crown,
};

const TIER_COLORS: Record<string, string> = {
  Iniciante: 'text-gray-400',
  Analista: 'text-emerald-400',
  'Analista Sénior': 'text-blue-400',
  Especialista: 'text-amber-400',
  Mestre: 'text-purple-400',
};

const TIER_BG: Record<string, string> = {
  Iniciante: 'bg-gray-400/10 border-gray-400/30',
  Analista: 'bg-emerald-500/10 border-emerald-500/30',
  'Analista Sénior': 'bg-blue-500/10 border-blue-500/30',
  Especialista: 'bg-amber-500/10 border-amber-500/30',
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
}: CelebrationModalProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => onComplete(), 3500);
    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  const TierIcon = newTier ? TIER_ICONS[newTier.name] : Trophy;
  const tierColor = newTier ? TIER_COLORS[newTier.name] : 'text-emerald-400';
  const tierBg = newTier ? TIER_BG[newTier.name] : 'bg-emerald-500/10 border-emerald-500/30';

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-emerald-500/5"
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="relative bg-[#141414] px-10 py-8 rounded-2xl shadow-2xl border border-[#2a2a2a] flex flex-col items-center gap-4 max-w-md w-full mx-4"
          >
            {/* Animated background glow */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-2xl ${tierBg} pointer-events-none` }
            />

            {/* Close button */}
            <button
              onClick={onComplete}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/5 transition-colors text-gray-500 hover:text-white"
              aria-label="Fechar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Main icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`relative p-5 rounded-full ${tierBg.replace('border-', 'border-2 ')} flex items-center justify-center`}
            >
              <TierIcon size={48} className={tierColor} />
            </motion.div>

            {/* Floating particles */}
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

            {/* Content */}
            <div className="text-center relative z-10">
              <h2 className="text-2xl font-black text-white mb-1">{title}</h2>
              <p className="text-gray-400 text-sm mb-4">{subtitle}</p>

              {type === 'levelUp' && newTier && (
                <div className={`mb-4 p-4 rounded-xl ${tierBg} flex items-center justify-center gap-3`}>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                      {previousTier ? `De ${previousTier}` : 'Novo nível'}
                    </p>
                    <p className={`text-lg font-black ${tierColor}`}>{newTier.name}</p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-px h-10 bg-current/30"
                  />
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                      Para {newTier.name === 'Mestre' ? 'o topo' : 'próximo nível'}
                    </p>
                    <p className="text-lg font-black text-gray-300">
                      {newTier.name === 'Mestre' ? '∞' : `${newTier.maxPoints?.toLocaleString() || '∞'} pts`}
                    </p>
                  </div>
                </div>
              )}

              {points && type !== 'levelUp' && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-5 py-2 mb-4"
                >
                  <Coins size={20} className="text-emerald-400" />
                  <span className="text-lg font-black text-emerald-400">+{points} Pontos</span>
                </motion.div>
              )}

              {type === 'achievement' && (
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2 mb-4">
                  <Sparkles size={18} className="text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">Conquista desbloqueada</span>
                </div>
              )}

              <button
                onClick={onComplete}
                className="mt-2 px-6 py-2.5 rounded-full font-bold text-sm bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-colors"
              >
                Continuar
              </button>
            </div>

            {/* Subtle progress hint */}
            {newTier && !previousTier && (
              <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-wider">
                Continue evoluindo — cada aula te aproxima do próximo nível
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}