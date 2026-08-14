'use client';

import { useEffect } from 'react';
import { buildBrandingCssVars, sanitizeHexColor } from '@/lib/branding';

interface BrandingResponse {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
}

/**
 * Aplica as CSS variables do white-label do tenant no <html> (documentElement).
 * - `--brand-primary` / `--brand-accent`: sempre valores hex sanitizados
 *   (fallback para os padrões Pontufy) — nunca injetar input bruto.
 * - `--brand-logo` / `--brand-favicon`: URLs validadas, opcionais.
 * - Tokens base do dark theme (bg/surface/border) permanecem intactos.
 */
export default function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let cancelled = false;

    fetch('/api/admin/branding', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as BrandingResponse | null;
      })
      .then((branding) => {
        if (cancelled || !branding) return;

        const root = document.documentElement;
        const vars = buildBrandingCssVars(branding);
        root.style.setProperty('--brand-primary', vars['--brand-primary']);
        root.style.setProperty('--brand-accent', vars['--brand-accent']);

        if (branding.logoUrl) {
          root.style.setProperty('--brand-logo', `url(${JSON.stringify(branding.logoUrl)})`);
        } else {
          root.style.removeProperty('--brand-logo');
        }

        if (branding.faviconUrl) {
          const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (icon) icon.href = branding.faviconUrl;
        }
      })
      .catch(() => {
        // Mantém os padrões (CSS vars já definidas no globals.css).
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Re-aplica a cor primária do tenant a elementos marcados com
  // `data-brand-primary` (botões/CTAs que devem acompanhar a marca).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      const root = document.documentElement;
      const primary = root.style.getPropertyValue('--brand-primary');
      if (!primary || !sanitizeHexColor(primary)) return;
      document
        .querySelectorAll<HTMLElement>('[data-brand-primary]')
        .forEach((el) => {
          el.style.backgroundColor = primary;
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}