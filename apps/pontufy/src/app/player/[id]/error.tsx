'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function PlayerError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Erro ao carregar o player"
      description="Algo deu errado. Tente novamente."
      reset={reset}
    />
  );
}