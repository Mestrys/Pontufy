'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Gift, Package, Sparkles } from 'lucide-react';
import { useRewards } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { RewardCard } from '@/components/rewards/RewardCard';
import { RewardFilters } from '@/components/rewards/RewardFilters';
import { CheckoutDrawer } from '@/components/rewards/CheckoutDrawer';

interface Reward {
  id: string;
  title: string;
  pricePoints: number;
  imageUrl: string | null;
  partnerStore: string;
  category: string | null;
  isActive: boolean;
}

export default function RewardsPage() {
  const pointsBalance = useStore((s) => s.currentPointsBalance);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name_asc'>('price_asc');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isLoading, mutate } = useRewards(page, 12, category || undefined);

  const allRewards = useMemo(() => data?.data || [], [data]);
  const totalPages = useMemo(() => data?.totalPages || 0, [data]);
  const totalRewards = useMemo(() => data?.total || 0, [data]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allRewards.forEach((r: Reward) => r.category && cats.add(r.category));
    return Array.from(cats).sort();
  }, [allRewards]);

  const sortedRewards = useMemo(() => {
    return [...allRewards].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.pricePoints - b.pricePoints;
        case 'price_desc':
          return b.pricePoints - a.pricePoints;
        case 'name_asc':
          return a.title.localeCompare(b.title);
      }
    });
  }, [allRewards, sortBy]);

  const handleRedeem = useCallback((rewardId: string) => {
    const reward = allRewards.find((r: Reward) => r.id === rewardId);
    if (reward) {
      setSelectedReward(reward);
      setIsDrawerOpen(true);
    }
  }, [allRewards]);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedReward(null);
  }, []);

  useEffect(() => {
    mutate();
  }, [mutate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Clube de <span className="text-emerald-400">Benefícios</span>
              </h1>
              <p className="mt-2 text-gray-400 text-lg">
                Troque seus pontos por recompensas exclusivas nos melhores parceiros.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-[#141414] border border-[#2a2a2a] rounded-xl px-5 py-3">
              <Gift size={24} className="text-emerald-400" />
              <div className="text-right">
                <p className="text-xs text-gray-500">Seu saldo</p>
                <p className="text-2xl font-black text-emerald-400">{pointsBalance.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-gray-500">Total de recompensas</p>
              <p className="text-2xl font-bold text-white">{totalRewards}</p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-gray-500">Categorias disponíveis</p>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
            </div>
            <div className="bg-[#141414] border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden">
              <Sparkles size={24} className="text-emerald-400 absolute top-2 right-2" />
              <p className="text-xs text-gray-500">Parceiros premium</p>
              <p className="text-2xl font-bold text-emerald-400">
                {new Set(allRewards.map((r: Reward) => r.partnerStore)).size}
              </p>
            </div>
          </div>
        </header>

        <RewardFilters
          categories={categories}
          selectedCategory={category}
          sortBy={sortBy}
          onCategoryChange={setCategory}
          onSortChange={setSortBy}
        />

        {isLoading && page === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#0a0a0a]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
                  <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
                  <div className="flex justify-between">
                    <div className="h-6 bg-[#2a2a2a] rounded w-24" />
                    <div className="h-10 bg-[#2a2a2a] rounded w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && sortedRewards.length === 0 && (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma recompensa encontrada</h3>
            <p className="text-gray-400">
              {category ? 'Tente remover os filtros ou escolha outra categoria.' : 'Nenhuma recompensa disponível no momento.'}
            </p>
            {category && (
              <button
                onClick={() => setCategory(null)}
                className="mt-4 text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {!isLoading && sortedRewards.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  {...reward}
                  onRedeem={handleRedeem}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-[#141414] border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 text-white">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-[#141414] border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}

        <CheckoutDrawer
          isOpen={isDrawerOpen}
          onClose={handleDrawerClose}
          reward={selectedReward}
        />
      </div>
    </div>
  );
}