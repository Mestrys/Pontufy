'use client';

import { FileText, FileType2, Presentation, Globe, Youtube, AlignLeft, X } from 'lucide-react';
import type { KnowledgeSource, SourceKind } from '@/lib/types';
import { formatFileSize } from '@/lib/studio';

const KIND_META: Record<SourceKind, { icon: typeof FileText; label: string }> = {
  file: { icon: FileText, label: 'Arquivo' },
  gdoc: { icon: FileType2, label: 'Google Docs' },
  gslides: { icon: Presentation, label: 'Google Slides' },
  url: { icon: Globe, label: 'Página web' },
  youtube: { icon: Youtube, label: 'YouTube' },
  text: { icon: AlignLeft, label: 'Texto direto' },
};

interface SourceChipProps {
  source: KnowledgeSource;
  onRemove: (id: string) => void;
}

export default function SourceChip({ source, onRemove }: SourceChipProps) {
  const { icon: Icon, label } = KIND_META[source.kind];

  return (
    <div
      data-testid="source-chip"
      className="flex items-center gap-3 rounded-xl border border-edge bg-surface-1 py-2.5 pl-3 pr-2"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2">
        <Icon className="h-4 w-4 text-mint" />
      </span>
      <div className="min-w-0">
        <p className="max-w-52 truncate text-sm font-medium text-ink">{source.label}</p>
        <p className="text-xs text-ink-faint">
          {label}
          {source.sizeBytes !== undefined && ` · ${formatFileSize(source.sizeBytes)}`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(source.id)}
        aria-label={`Remover fonte ${source.label}`}
        className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
