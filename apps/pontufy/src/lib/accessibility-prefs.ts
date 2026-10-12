'use client';

import { useSyncExternalStore } from 'react';

// Preferências de acessibilidade deste aparelho (localStorage).
// Tempo estendido: dobra o tempo por questão nas batalhas (H13).

const EXTENDED_TIME_KEY = 'pontufy-extended-time';
const EVENT = 'pontufy:a11y-prefs';

export function isExtendedTime(): boolean {
  try {
    return localStorage.getItem(EXTENDED_TIME_KEY) === '1';
  } catch {
    return false;
  }
}

export function setExtendedTime(enabled: boolean): void {
  try {
    localStorage.setItem(EXTENDED_TIME_KEY, enabled ? '1' : '0');
  } catch {
    // Sem storage: a preferência vale só até recarregar.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useExtendedTime(): boolean {
  return useSyncExternalStore(subscribe, isExtendedTime, () => false);
}
