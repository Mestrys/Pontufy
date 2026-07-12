'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Evita mismatch de hidratação: o tema só é conhecido no cliente
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      // Rótulo fixo: o tema só é conhecido no cliente (evita hydration mismatch)
      aria-label="Alternar tema"
      title="Alternar tema"
      data-testid="theme-toggle"
      className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-1 hover:text-ink"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <span className="block h-4 w-4" />
      )}
    </button>
  );
}
