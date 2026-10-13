import { Coins, TrendingUp } from 'lucide-react';

interface BalanceCardProps {
  data: {
    pointsBalance: number;
    currentLevel: string;
    nextLevel: string | null;
    levelProgress: number;
    pointsToNext: number;
  };
}

export default function BalanceCard({ data }: BalanceCardProps) {
  return (
    <div className="bg-md-surface rounded-2xl border border-md-outline p-6 sm:p-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      {/* Balance Info */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-md-on-surface-muted uppercase tracking-widest mb-2">
          <Coins size={13} className="text-md-highlight" />
          Seu saldo
        </div>
        <div className="flex items-end gap-3">
          <span className="text-5xl md:text-6xl font-black text-md-on-surface-strong tracking-tighter">
            {data.pointsBalance.toLocaleString('pt-BR')}
          </span>
          <span className="text-lg text-md-tertiary font-bold mb-1">pts</span>
        </div>
      </div>

      {/* Level Progress */}
      <div className="w-full md:w-1/2">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-xs font-bold text-md-on-surface-muted uppercase tracking-wider mb-0.5">Nível atual</div>
            <div className="text-base font-black text-md-on-surface-strong flex items-center gap-1.5">
              <TrendingUp size={15} className="text-md-tertiary" />
              {data.currentLevel}
            </div>
          </div>
          {data.nextLevel && (
            <div className="text-right">
              <div className="text-xs font-bold text-md-on-surface-muted uppercase tracking-wider mb-0.5">
                Próximo
              </div>
              <div className="text-sm font-bold text-md-tertiary">{data.nextLevel}</div>
            </div>
          )}
        </div>

        <div
          className="w-full h-1.5 bg-md-surface-container rounded-full overflow-hidden"
          role="progressbar"
          aria-label={data.nextLevel ? `Progresso até ${data.nextLevel}` : 'Nível máximo'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={data.levelProgress}
        >
          <div
            className="h-full rounded-full bg-md-tertiary transition-all duration-1000 ease-out"
            style={{ width: `${data.levelProgress}%` }}
          />
        </div>
        <p className="text-xs text-md-on-surface-muted mt-1.5">
          {data.nextLevel
            ? `Faltam ${data.pointsToNext.toLocaleString('pt-BR')} pts para ${data.nextLevel}`
            : 'Você está no nível máximo'}
        </p>
      </div>
    </div>
  );
}
