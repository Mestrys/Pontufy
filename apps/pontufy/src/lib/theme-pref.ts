'use client';

import { useSyncExternalStore } from 'react';

// Aparência escolhida no Perfil. "system" segue o sistema (prefers-color-scheme);
// "light"/"dark" fixam o tema com data-theme no <html>. O script do <head>
// (layout.tsx) aplica a mesma chave antes da primeira pintura.

export type ThemePref = 'system' | 'light' | 'dark';

export const THEME_KEY = 'pontufy-theme';
const EVENT = 'pontufy:theme';

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function setThemePref(pref: ThemePref): void {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Sem storage: vale até recarregar.
  }
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
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

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, getThemePref, () => 'system');
}
