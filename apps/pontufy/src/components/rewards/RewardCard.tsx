'use client';
import Image from 'next/image';
import { Gift, Lock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getPartnerDisplayName, getPartnerIcon, type Partner } from '@/lib/affiliate-engine';

interface RewardCardProps {
  id: string;
  title: string;
  pricePoints: number;
  imageUrl: string | null;
  partnerStore: string;
  category: string | null;
  isActive: boolean;
  onRedeem: (rewardId: string) => void;
}

export function RewardCard({
  id,
  title,
  pricePoints,
  imageUrl,
  partnerStore,
  category,
  isActive,
  onRedeem,
}: RewardCardProps) {
  const pointsBalance = useStore((s) => s.currentPointsBalance);
  const canAfford = pointsBalance >= pricePoints;
  const missingPoints = pricePoints - pointsBalance;

  const partner = partnerStore as Partner;
  const partnerDisplay = getPartnerDisplayName(partner);
  const partnerIcon = getPartnerIcon(partner);

  if (!isActive) return null;

  return (
    <article className="group relative bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0a0a0a]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl">
            {partnerIcon}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-3 right-3">
          <span className="bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full border border-[#2a2a2a]">
            {partnerIcon} {partnerDisplay}
          </span>
        </div>

        {category && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-xs font-medium px-2 py-1 rounded-full border border-emerald-500/30">
              {category}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-white text-base line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>

        <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-emerald-400" />
            <span className="font-bold text-emerald-400 text-lg">{pricePoints.toLocaleString('pt-BR')}</span>
            <span className="text-gray-500 text-sm">pontos</span>
          </div>

          <button
            onClick={() => onRedeem(id)}
            disabled={!canAfford}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              canAfford
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/50 active:scale-[0.98]'
                : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
            }`}
          >
            {canAfford ? (
              <>
                <Gift size={14} />
                Resgatar
              </>
            ) : (
              <>
                <Lock size={14} />
                Faltam {missingPoints.toLocaleString('pt-BR')}
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Saldo: <span className="font-medium text-white">{pointsBalance.toLocaleString('pt-BR')}</span> pts</span>
          <span className={canAfford ? 'text-emerald-400' : 'text-red-400'}>
            {canAfford ? `Novo saldo: ${(pointsBalance - pricePoints).toLocaleString('pt-BR')}` : `Faltam ${missingPoints.toLocaleString('pt-BR')}`}
          </span>
        </div>
      </div>
    </article>
  );
}