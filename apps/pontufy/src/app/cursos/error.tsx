'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function CursosError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Erro ao carregar seus cursos"
      description="Algo deu errado. Tente novamente."
      reset={reset}
    />
  );
}