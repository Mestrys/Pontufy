'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Não foi possível carregar o início"
      description="Algo deu errado. Tente novamente."
      reset={reset}
    />
  );
}