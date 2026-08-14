'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins } from 'lucide-react';

// Celebração de pontos: modal/toast sem som, animação spring suave.
// Somente visual — o saldo global é atualizado via useStore (addPoints).

interface PointsCelebrationProps {
  points: number;
  isVisible: boolean;
  onComplete?: () => void;
  message?: string;
}

export default function PointsCelebration({
  points,
  isVisible,
  onComplete,
  message = 'Você acaba de ganhar',
}: PointsCelebrationProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => onComplete?.(), 2800);
    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-emerald-500/10"
          />
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative bg-[#141414] px-10 py-8 rounded-2xl shadow-2xl border border-[#2a2a2a] flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="bg-emerald-500/10 p-4 rounded-full"
            >
              <Coins size={48} className="text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-black text-white">Incrível!</h2>
            <p className="text-gray-400 text-sm">{message}</p>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              +{points} Pontos
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}