'use client';

import { useState } from 'react';
import {
  Ticket,
  TrendingUp,
  Coins,
  Gift,
  Target,
  Award,
  GraduationCap,
  FileBadge,
} from 'lucide-react';
import { REWARDS } from '@/lib/data';
import type { Reward } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { MOCK_CERTIFICATES } from '@/lib/mock-certificates';
import RewardCard from '@/components/rewards/RewardCard';
import RedeemModal from '@/components/rewards/RedeemModal';

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-edge bg-surface-1 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint/10">
        <Icon className="h-5 w-5 text-mint" />
      </span>
      <div>
        <p className="text-xs text-ink-faint">{label}</p>
        <p className="text-lg font-bold tabular-nums tracking-tight text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const points = useAppStore((s) => s.points);
  const redemptions = useAppStore((s) => s.redemptions);
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null);

  // Derivado do próprio estado: ganho total = saldo atual + tudo que já foi gasto
  const spent = redemptions.reduce(
    (sum, r) => sum + (REWARDS.find((rw) => rw.id === r.rewardId)?.requiredPoints ?? 0),
    0
  );
  const earned = points + spent;

  // Próxima meta: a recompensa mais barata que ainda não cabe no saldo
  const nextGoal = [...REWARDS]
    .sort((a, b) => a.requiredPoints - b.requiredPoints)
    .find((r) => r.requiredPoints > points);
  const goalProgress = nextGoal ? Math.min(100, Math.round((points / nextGoal.requiredPoints) * 100)) : 100;

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6">
      {/* ── Seção A: evolução de pontos e histórico ─────────────────── */}
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Recompensas</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Sua evolução, o marketplace de benefícios e suas conquistas — tudo em um lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Coins} label="Saldo disponível" value={`${points.toLocaleString('pt-BR')} pts`} />
          <StatCard icon={TrendingUp} label="Total acumulado" value={`${earned.toLocaleString('pt-BR')} pts`} />
          <StatCard icon={Gift} label="Total resgatado" value={`${spent.toLocaleString('pt-BR')} pts`} />
        </div>

        {nextGoal && (
          <div className="space-y-3 rounded-2xl border border-edge bg-surface-1 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <Target className="h-4 w-4 text-mint" />
                Próxima meta: <span className="font-semibold">{nextGoal.title}</span>
              </p>
              <p className="text-xs tabular-nums text-ink-muted">
                {points.toLocaleString('pt-BR')} / {nextGoal.requiredPoints.toLocaleString('pt-BR')} pts
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-mint transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-xs text-ink-faint">
              Faltam {(nextGoal.requiredPoints - points).toLocaleString('pt-BR')} pontos — conclua aulas
              para chegar lá.
            </p>
          </div>
        )}

        {redemptions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Meus resgates</h2>
            <ul className="divide-y divide-edge overflow-hidden rounded-xl border border-edge bg-surface-1">
              {redemptions.map((redemption) => {
                const reward = REWARDS.find((r) => r.id === redemption.rewardId);
                return (
                  <li
                    key={redemption.code}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="h-4 w-4 text-mint" />
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {reward?.title ?? redemption.rewardId}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {new Date(redemption.redeemedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <code className="rounded-lg bg-surface-0 px-3 py-1 text-xs font-semibold tracking-wider text-mint">
                      {redemption.code}
                    </code>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* ── Seção B: marketplace ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Clube de Benefícios</h2>
            <p className="mt-1 text-sm text-ink-faint">
              Troque seus pontos por recompensas reais de parceiros.
            </p>
          </div>
          <p className="text-sm text-ink-muted">
            Saldo disponível:{' '}
            <span className="font-semibold text-mint">{points.toLocaleString('pt-BR')} pts</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REWARDS.map((reward) => (
            <RewardCard key={reward.id} reward={reward} onRedeem={setRedeemTarget} />
          ))}
        </div>
      </section>

      {/* ── Seção C: conquistas e diplomas (DADOS MOCK) ─────────────── */}
      <section className="space-y-4" data-testid="certificates-section">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <Award className="h-4 w-4 text-mint" />
            Conquistas e Diplomas
          </h2>
          <p className="mt-1 text-sm text-ink-faint">
            Certificados emitidos ao concluir cursos e trilhas.{' '}
            <span className="text-ink-dim">(dados de demonstração)</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_CERTIFICATES.map((cert) => (
            <article
              key={cert.id}
              className="overflow-hidden rounded-2xl border border-edge bg-surface-1"
            >
              {/* Placeholder do diploma — sem geração de PDF/asset ainda */}
              <div className="flex h-32 items-center justify-center border-b border-dashed border-edge bg-surface-2/60">
                <div className="flex flex-col items-center gap-1.5 text-ink-dim">
                  <FileBadge className="h-8 w-8" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    Prévia do certificado
                  </span>
                </div>
              </div>
              <div className="space-y-2 p-5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-mint">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {cert.kind}
                </p>
                <h3 className="text-sm font-semibold leading-snug text-ink">{cert.title}</h3>
                <p className="text-xs text-ink-faint">
                  {cert.completedAt} · {cert.hours}h de carga horária
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {redeemTarget && (
        <RedeemModal reward={redeemTarget} onClose={() => setRedeemTarget(null)} />
      )}
    </div>
  );
}
