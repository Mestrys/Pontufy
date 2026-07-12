import React, { useEffect, useRef, useState } from 'react';
import { Gift, Award, CheckCircle, ArrowRight, ShieldCheck, Ticket, RefreshCw, AlertTriangle, Package, Store, ShoppingCart, Handshake } from 'lucide-react';
import { translations } from '../translations';

const rewardIcons: Record<string, React.ElementType> = {
  amazon_50: Package,
  magalu_100: Store,
  shopee_50: ShoppingCart,
  mercadolivre_150: Handshake
};

interface RewardsSimulatorProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  addSecurityLog: (action: string, status: 'success' | 'warning' | 'info', details: string) => void;
  language: string;
}

export default function RewardsSimulator({ points, setPoints, addSecurityLog, language }: RewardsSimulatorProps) {
  const [selectedRewardId, setSelectedRewardId] = useState<string>('amazon_50');
  const [redemptionStep, setRedemptionStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [verificationIndex, setVerificationIndex] = useState(0);
  const [generatedCode, setGeneratedCode] = useState('');
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  const t = translations[language].showcase;
  const secLogs = translations[language].security.logs;

  const currentReward = t.rewards[selectedRewardId];

  const handleRedeem = () => {
    if (points < currentReward.requiredPoints) {
      const logDetails = secLogs.redeemFailed
        .replace('{reward}', currentReward.name)
        .replace('{points}', points.toString())
        .replace('{req}', currentReward.requiredPoints.toString());
      addSecurityLog('REDEEM_FAILED', 'warning', logDetails);
      setInsufficientBalance(true);
      return;
    }

    setInsufficientBalance(false);
    setRedemptionStep('processing');
    setVerificationIndex(0);

    const requestedLog = secLogs.redeemRequested
      .replace('{reward}', currentReward.name)
      .replace('{value}', currentReward.value);
    addSecurityLog('REDEEM_REQUESTED', 'info', requestedLog);

    // Efeitos colaterais ficam fora do state updater para não serem
    // disparados em dobro pelo StrictMode (que reexecuta updaters em dev).
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      if (step < t.steps.length) {
        setVerificationIndex(step);
      } else {
        clearInterval(interval);
        intervalRef.current = null;
        window.setTimeout(() => {
          const randomCode = `PNTF-${currentReward.name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          setGeneratedCode(randomCode);
          setPoints(current => current - currentReward.requiredPoints);
          setRedemptionStep('success');

          const successLog = secLogs.redeemSuccess
            .replace('{reward}', currentReward.name)
            .replace('{code}', randomCode)
            .replace('{points}', currentReward.requiredPoints.toString());
          addSecurityLog('REDEEM_SUCCESS', 'success', successLog);
        }, 600);
      }
    }, 500);
    intervalRef.current = interval;
  };

  return (
    <section id="rewards-showcase" className="py-24 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200/60 text-slate-500 px-3 py-1 rounded-full text-xs font-medium mb-4">
            <Gift className="w-3.5 h-3.5 text-purple-500" />
            <span>{t.badge}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-slate-500 text-balance">
            {t.desc}
          </p>
        </div>

        {/* Unified Interface Panel */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-10 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Box: Reward Cards Selection */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="font-display text-xl font-semibold tracking-tight text-slate-900">{t.catalogTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t.catalogDesc}
                </p>
              </div>

              {/* Reward Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(t.rewards).map((reward) => (
                  <button
                    key={reward.id}
                    onClick={() => {
                      setSelectedRewardId(reward.id);
                      setInsufficientBalance(false);
                    }}
                    className={`p-5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedRewardId === reward.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200/60 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const RewardIcon = rewardIcons[reward.id] || Gift;
                        return (
                          <span className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${selectedRewardId === reward.id ? 'bg-white border-slate-200/60 text-slate-900' : 'bg-slate-50 border-slate-200/60 text-slate-400'}`}>
                            <RewardIcon className="w-5 h-5" />
                          </span>
                        );
                      })()}
                      <div>
                        <span className="block font-medium text-sm text-slate-900">{reward.name}</span>
                        <span className="text-xs text-slate-500">{reward.requiredPoints} Pts</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-display font-semibold text-sm text-slate-900">{reward.value}</span>
                      <span className="text-xs text-slate-400 block">
                        {language === 'PT-BR' ? 'Vale Digital' : language === 'EN-US' ? 'Digital Card' : 'Vale Digital'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Real-time points indicator */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center">
                    <Award className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">{t.labelBalance}</span>
                    <span className="text-sm font-medium text-slate-700">{t.subBalance}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-display font-semibold tracking-tight text-slate-900 block">
                    {points} <span className="text-xs font-sans text-slate-400 font-medium">PTS</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Box: Redemption Simulator State */}
            <div className="lg:col-span-5 h-full">
              <div className="border border-slate-200/60 bg-slate-50 rounded-xl p-6 flex flex-col justify-between min-h-[340px]">
                
                {redemptionStep === 'idle' && (
                  <div className="space-y-6">
                    {insufficientBalance && (
                      <div className="flex items-start space-x-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>
                          {language === 'PT-BR'
                            ? `Saldo insuficiente! Ganhe mais pontos no Simulador IA (acima) para realizar o resgate de ${currentReward.value}.`
                            : language === 'EN-US'
                            ? `Insufficient points! Complete more quizzes in the AI Simulator (above) to redeem your ${currentReward.value} voucher.`
                            : `¡Saldo insuficiente! Obtenga más puntos en el Simulador IA (arriba) para canjear su vale de ${currentReward.value}.`}
                        </span>
                      </div>
                    )}
                    <div className="text-center py-6">
                      {(() => {
                        const RewardIcon = rewardIcons[currentReward.id] || Gift;
                        return (
                          <span className="w-14 h-14 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center mx-auto mb-3 text-slate-700">
                            <RewardIcon className="w-6 h-6" />
                          </span>
                        );
                      })()}
                      <h4 className="font-display text-lg font-semibold tracking-tight text-slate-900">{t.confirmTitle}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {t.confirmText.replace('{name}', currentReward.name).replace('{value}', currentReward.value)}
                      </p>
                    </div>

                    <div className="space-y-2 border-y border-slate-200/60 py-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t.costLabel}</span>
                        <span className="font-bold text-slate-800">{currentReward.requiredPoints} Pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t.balanceLabel}</span>
                        <span className={`font-bold ${points >= currentReward.requiredPoints ? 'text-emerald-600' : 'text-red-500'}`}>
                          {points} Pts
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRedeem}
                      className="w-full py-3.5 rounded-xl text-sm font-medium font-sans text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{t.btnRedeem}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {redemptionStep === 'processing' && (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium text-xs border-b border-slate-200/60 pb-3">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <span>{t.processingBanner}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 transition-all duration-300"
                        style={{ width: `${((verificationIndex + 1) / t.steps.length) * 100}%` }}
                      ></div>
                    </div>

                    {/* Console Output list */}
                    <div className="space-y-2.5 font-mono text-xs text-slate-600">
                      {t.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start space-x-2 transition-all duration-300 ${
                            idx <= verificationIndex ? 'text-slate-800 font-medium' : 'text-slate-300'
                          }`}
                        >
                          {idx < verificationIndex ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : idx === verificationIndex ? (
                            <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-200/60 shrink-0 mt-0.5"></div>
                          )}
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {redemptionStep === 'success' && (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto shadow-sm">
                      <CheckCircle className="w-6 h-6" />
                    </div>

                    <div>
                      <h4 className="font-display text-base font-semibold tracking-tight text-slate-900">{t.successTitle}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {t.successDesc}
                      </p>
                    </div>

                    {/* Coupon Box */}
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-4 max-w-xs mx-auto">
                      <span className="text-xs text-emerald-700 font-medium flex items-center justify-center gap-1 mb-1">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>{t.voucherTitle}</span>
                      </span>
                      <span className="font-mono text-base font-semibold text-slate-900 tracking-wider">
                        {generatedCode}
                      </span>
                      <span className="block text-xs text-slate-400 mt-1.5">{t.voucherSub}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRedemptionStep('idle')}
                      className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      {t.btnNewRedeem}
                    </button>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
