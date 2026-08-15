import { Coins } from 'lucide-react';
import type { HTMLAttributes } from 'react';

// MD3 Chip/Badge com tons semânticos da paleta Pontufy.
// REGRA DE OURO: badges de PONTOS usam OBRIGATORIAMENTE o tom terciário
// #a1c0ae (ver PointsChip) — acessibilidade: on-tertiary #0d1f16 (9:1).
type Tone = 'default' | 'primary' | 'secondary' | 'tertiary' | 'highlight';

const tones: Record<Tone, string> = {
  default: 'bg-md-surface-container text-md-on-surface-variant border border-md-outline',
  primary: 'bg-md-primary text-md-on-primary',
  secondary: 'bg-md-secondary/15 text-md-secondary border border-md-secondary/30',
  tertiary: 'bg-md-tertiary/15 text-md-tertiary border border-md-tertiary/30',
  highlight: 'bg-md-highlight/15 text-md-highlight border border-md-highlight/30',
};

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Chip({ tone = 'default', className, ...props }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${tones[tone]} ${className ?? ''}`}
      {...props}
    />
  );
}

// Badge de saldo/pontos — SEMPRE terciário (#a1c0ae), padrão obrigatório MD3.
export function PointsChip({ value, className }: { value: number; className?: string }) {
  return (
    <Chip tone="tertiary" className={className}>
      <Coins size={14} />
      <span className="font-bold">{value.toLocaleString('pt-BR')}</span>
    </Chip>
  );
}