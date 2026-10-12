'use client';

import { useStore } from '@/store/useStore';
import { usePointsHistory } from '@/hooks/useApi';
import BalanceCard from '@/components/wallet/BalanceCard';
import PointsHistory from '@/components/wallet/PointsHistory';
import { ListSkeleton, LoadingRegion } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { History } from 'lucide-react';
import { getLevelProgress } from '@/lib/levels';

export default function WalletPage() {
  const currentUser = useStore((s) => s.currentUser);
  const pointsBalance = useStore((s) => s.currentPointsBalance);
  const { data: apiHistory, isLoading } = usePointsHistory();

  const level = getLevelProgress(pointsBalance);

  const history = (apiHistory || []).map((tx: any) => ({
    id: tx.id,
    type: tx.type as 'gain' | 'loss',
    description: tx.description,
    date: tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('pt-BR') : tx.date || '',
    amount: tx.pointsAmount ?? tx.amount ?? 0,
  }));

  const userData = {
    pointsBalance,
    currentLevel: level.tier.name,
    nextLevel: level.next?.name ?? null,
    levelProgress: level.percent,
    pointsToNext: level.pointsToNext,
  };

  return (
    <div className="min-h-screen pb-20 pt-8 bg-md-surface-dim">
      <div className="max-w-[1000px] mx-auto px-6 md:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">Central de Conquistas</h1>
          <p className="text-md-on-surface-muted mt-1.5 text-sm">
            {currentUser?.name ? `Olá, ${currentUser.name}! ` : ''}Acompanhe seu esforço e recompensas.
          </p>
        </header>

        <BalanceCard data={userData} />

        {isLoading ? (
          <LoadingRegion label="Carregando o histórico de pontos…">
            <ListSkeleton rows={5} />
          </LoadingRegion>
        ) : history.length > 0 ? (
          <PointsHistory history={history} />
        ) : (
          <EmptyState
            icon={History}
            title="Nenhuma movimentação ainda"
            description="Cada aula concluída soma pontos aqui. Comece por um dos seus cursos."
            actionLabel="Ir para Meus Cursos"
            actionHref="/cursos"
          />
        )}
      </div>
    </div>
  );
}
