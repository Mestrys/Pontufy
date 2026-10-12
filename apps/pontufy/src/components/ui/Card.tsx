import type { HTMLAttributes } from 'react';

// MD3 Card — elevado (1dp), outlined e filled (tonal). Superfícies tonais da
// paleta Pontufy (md-surface / md-surface-container) em vez de cinza chapado.
type Variant = 'elevated' | 'outlined' | 'filled';

const styles: Record<Variant, string> = {
  elevated: 'bg-md-surface rounded-2xl shadow-md',
  outlined: 'bg-md-surface rounded-2xl border border-md-outline',
  filled: 'bg-md-surface-container rounded-2xl',
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Card({ variant = 'outlined', className, ...props }: CardProps) {
  return <div className={`${styles[variant]} ${className ?? ''}`} {...props} />;
}