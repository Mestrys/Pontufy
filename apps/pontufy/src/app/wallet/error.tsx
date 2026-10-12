'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function WalletError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Erro ao carregar a Carteira"
      description="Algo deu errado. Tente novamente."
      reset={reset}
    />
  );
}