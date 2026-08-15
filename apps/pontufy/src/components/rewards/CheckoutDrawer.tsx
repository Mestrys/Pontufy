'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useStore } from '@/store/useStore';
import { triggerRewardRedemption } from '@/hooks/useApi';
import { getPartnerDisplayName, getPartnerIcon, type Partner } from '@/lib/affiliate-engine';
import { playFeedbackSound, haptic } from '@/lib/feedback';
import { ConfettiBurst } from '@/components/ui/Confetti';

type Step = 'confirm' | 'processing' | 'success';

interface RewardData {
  id: string;
  title: string;
  pricePoints: number;
  imageUrl: string | null;
  partnerStore: string;
  affiliateUrl?: string;
}

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reward: RewardData | null;
}

export function CheckoutDrawer({ isOpen, onClose, reward }: CheckoutDrawerProps) {
  const pointsBalance = useStore((s) => s.currentPointsBalance);
  const deductPoints = useStore((s) => s.deductPoints);
  const [step, setStep] = useState<Step>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [affiliateUrl, setAffiliateUrl] = useState<string | null>(null);
  const isFirstOpenRef = useRef(true);

  useEffect(() => {
    if (isOpen && isFirstOpenRef.current) {
      isFirstOpenRef.current = false;
      setStep('confirm');
      setError(null);
      setAffiliateUrl(null);
    } else if (!isOpen) {
      isFirstOpenRef.current = true;
    }
  }, [isOpen]);

  const handleRedeem = useCallback(async () => {
    if (!reward) return;

    setStep('processing');
    setError(null);

    try {
      const result = await triggerRewardRedemption(reward.id);

      if (result.success && result.newBalance !== undefined) {
        deductPoints(reward.pricePoints);
        setAffiliateUrl(result.affiliateUrl || null);
        setStep('success');
        playFeedbackSound('success');
        haptic([40, 60, 40]);
      } else {
        setError(result.error || 'Falha ao processar resgate. Tente novamente.');
        setStep('confirm');
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
      setStep('confirm');
    }
  }, [reward, deductPoints]);

  const handleGoToPartner = useCallback(() => {
    if (affiliateUrl) {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  }, [affiliateUrl]);

  if (!isOpen || !reward) return null;

  const canAfford = pointsBalance >= reward.pricePoints;
  const missingPoints = reward.pricePoints - pointsBalance;
  const newBalance = pointsBalance - reward.pricePoints;
  const partner = reward.partnerStore as Partner;
  const partnerDisplay = getPartnerDisplayName(partner);
  const partnerIcon = getPartnerIcon(partner);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-md-surface border-l border-md-outline shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-md-outline">
            <h2 className="text-lg font-bold text-white">Resgatar Recompensa</h2>
            <button
              onClick={onClose}
              disabled={step === 'processing'}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence mode="wait">
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-[#0a0a0a]">
                      {reward.imageUrl ? (
                        <Image src={reward.imageUrl} alt={reward.title} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-4xl">{partnerIcon}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{reward.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{partnerIcon} {partnerDisplay}</p>
                      <p className="text-sm text-gray-500 mt-1">Categoria: {reward.pricePoints > 5000 ? 'Premium' : reward.pricePoints > 1000 ? 'Standard' : 'Essencial'}</p>
                    </div>
                  </div>

                  <div className="bg-md-surface-dim border border-md-outline rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Seu saldo atual</span>
                      <span className="font-bold text-md-tertiary text-lg">{pointsBalance.toLocaleString('pt-BR')} pts</span>
                    </div>
                    <div className="flex items-center justify-between text-md-tertiary">
                      <span className="text-gray-400">Custo do resgate</span>
                      <span className="font-bold text-lg">{reward.pricePoints.toLocaleString('pt-BR')} pts</span>
                    </div>
                    <div className="h-px bg-md-outline" />
                    <div className="flex items-center justify-between text-white">
                      <span>Saldo projetado</span>
                      <span className="font-bold text-lg">{canAfford ? newBalance.toLocaleString('pt-BR') : '—'}</span>
                    </div>
                  </div>

                  {!canAfford && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
                      <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-400">Saldo insuficiente</p>
                        <p className="text-sm text-gray-400">Faltam {missingPoints.toLocaleString('pt-BR')} pontos para resgatar esta recompensa.</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleRedeem}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      canAfford
                        ? 'bg-md-primary text-md-on-primary hover:bg-md-primary-container active:scale-[0.98]'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Confirmar Resgate
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Ao confirmar, os pontos serão debitados imediatamente e você receberá o link de acesso ao parceiro.
                  </p>
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center py-12 space-y-4"
                >
                  <Loader2 size={48} className="text-md-primary animate-spin" />
                  <h3 className="text-lg font-semibold text-white">Processando resgate...</h3>
                  <p className="text-gray-400 text-center px-4">
                    Debitando pontos e gerando seu link de acesso. Isso pode levar alguns segundos.
                  </p>
                </motion.div>
              )}

              {step === 'success' && (
                <>
                  <ConfettiBurst />
                  <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center py-8 space-y-4 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 150 }}
                    className="w-20 h-20 rounded-full bg-md-tertiary/20 border border-md-tertiary/30 flex items-center justify-center"
                  >
                    <CheckCircle size={36} className="text-md-tertiary" />
                  </motion.div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">Resgate Concluído!</h3>
                    <p className="text-gray-400">{reward.pricePoints.toLocaleString('pt-BR')} pontos debitados com sucesso.</p>
                  </div>

                  <div className="bg-md-tertiary/10 border border-md-tertiary/20 rounded-xl p-4 w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Novo saldo</span>
                      <span className="font-bold text-md-tertiary text-lg">{newBalance.toLocaleString('pt-BR')} pts</span>
                    </div>
                    <p className="text-sm text-gray-500">Seu voucher está pronto para uso no {partnerDisplay}.</p>
                  </div>

                  <div className="w-full space-y-3">
                    <button
                      onClick={handleGoToPartner}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors active:scale-[0.98]"
                    >
                      <ExternalLink size={18} />
                      Acessar Benefício no {partnerDisplay}
                    </button>

                    <button
                      onClick={onClose}
                      className="w-full py-2 px-4 text-gray-400 font-medium hover:text-white transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </motion.div>
                </>
              )}
            </AnimatePresence>

            {error && step === 'confirm' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3"
              >
                <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}