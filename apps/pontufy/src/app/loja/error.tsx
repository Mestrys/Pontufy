'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function LojaError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Erro ao carregar o Clube de Benefícios"
      description="Algo deu errado. Tente novamente."
      reset={reset}
    />
  );
}