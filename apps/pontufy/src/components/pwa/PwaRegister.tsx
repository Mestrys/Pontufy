'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => {
          console.warn('Falha ao registrar Service Worker:', error);
        });
    };

    window.addEventListener('load', onLoad);

    // Atualização em segundo plano quando uma versão nova do SW ativa.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    return () => {
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return null;
}
