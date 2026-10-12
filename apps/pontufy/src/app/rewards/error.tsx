'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function RewardsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Erro ao carregar as recompensas"
      description="Algo deu errado. Tente novamente."
      reset={reset}
    />
  );
}