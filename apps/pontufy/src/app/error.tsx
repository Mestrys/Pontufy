'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Segment Error Caught:', error);
  }, [error]);

  return (
    <ErrorState
      title="Ops! Algo deu errado."
      description="Ocorreu um erro ao carregar esta seção. Você pode tentar carregar novamente."
      reset={reset}
    />
  );
}