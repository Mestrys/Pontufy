'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function LojaError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Não foi possível carregar os benefícios"
      description="Algo deu errado. Tente novamente."
      reset={reset}
    />
  );
}