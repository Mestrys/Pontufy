'use client';

import { useState } from 'react';
import {
  X,
  Coins,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import type { Redemption, Reward } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

interface RedeemModalProps {
  reward: Reward;
  onClose: () => void;
}

export default function RedeemModal({ reward, onClose }: RedeemModalProps) {
  const points = useAppStore((s) => s.points);
  const redeemReward = useAppStore((s) => s.redeemReward);
  const redeeming = useAppStore((s) => s.redeemingRewardId) !== null;

  const [result, setResult] = useState<Redemption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const affordable = points >= reward.requiredPoints;

  const handleConfirm = async () => {
    setError(null);
    try {
      const redemption = await redeemReward(reward.id);
      setResult(redemption);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao processar o resgate.');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Resgatar ${reward.title}`}
    >
      <div className="animate-celebration w-full max-w-md rounded-2xl border border-edge bg-surface-1 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              {reward.partner}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{reward.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {result ? (
          <div className="mt-6 space-y-4" data-testid="redeem-success">
            <div className="flex items-center gap-3 rounded-xl border border-mint/30 bg-mint/10 p-4">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-mint" />
              <div>
                <p className="text-sm font-semibold text-ink">Resgate confirmado!</p>
                <p className="text-xs text-ink-muted">
                  {reward.requiredPoints.toLocaleString('pt-BR')} pts debitados do seu saldo.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-edge bg-surface-0 p-4">
              <p className="text-xs text-ink-faint">Seu código de resgate</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="text-base font-bold tracking-wider text-mint">{result.code}</code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-dim hover:text-ink"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <a
              href={result.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-300"
            >
              Ativar no parceiro
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-relaxed text-ink-muted">{reward.description}</p>

            <div className="flex items-center justify-between rounded-xl border border-edge bg-surface-0 p-4 text-sm">
              <span className="text-ink-muted">Custo do resgate</span>
              <span className="flex items-center gap-1.5 font-semibold text-mint">
                <Coins className="h-4 w-4" />
                {reward.requiredPoints.toLocaleString('pt-BR')} pts
              </span>
            </div>
            <div className="flex items-center justify-between px-1 text-xs text-ink-faint">
              <span>Saldo atual: {points.toLocaleString('pt-BR')} pts</span>
              <span>
                Saldo após: {(points - reward.requiredPoints).toLocaleString('pt-BR')} pts
              </span>
            </div>

            {(error || !affordable) && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error ?? 'Saldo insuficiente para este resgate. Conclua mais aulas para acumular pontos.'}
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!affordable || redeeming}
              data-testid="confirm-redeem"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-faint"
            >
              {redeeming && <Loader2 className="h-4 w-4 animate-spin" />}
              {redeeming ? 'Processando...' : 'Confirmar Resgate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
