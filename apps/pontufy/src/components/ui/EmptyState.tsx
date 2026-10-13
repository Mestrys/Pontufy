import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  /** Ação no próprio lugar (ex.: limpar filtros). */
  onAction?: () => void;
  /** Ou um destino (ex.: completar o perfil). */
  actionHref?: string;
  className?: string;
}

// Empty State MD3 — toda tela vazia diz o que aconteceu e oferece o próximo
// passo quando existe um.
export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionHref, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center gap-3 py-16 px-6 bg-md-surface rounded-2xl border border-md-outline ${className}`}>
      <div className="w-16 h-16 rounded-full bg-md-tertiary/15 flex items-center justify-center">
        <Icon size={28} className="text-md-tertiary" aria-hidden="true" />
      </div>
      <h2 className="text-title-lg text-md-on-surface-strong font-bold">{title}</h2>
      <p className="text-sm text-md-on-surface-muted max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-2 inline-flex items-center justify-center h-11 px-6 rounded-full text-sm font-semibold bg-md-secondary/15 text-md-secondary hover:bg-md-secondary/25 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button variant="tonal" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
