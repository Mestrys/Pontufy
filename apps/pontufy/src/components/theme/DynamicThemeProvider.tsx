'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  brandStylesheet,
  brandThemeCssVars,
  customBrandColor,
  deriveBrandTheme,
  sanitizeBrandingUrl,
} from '@/lib/branding';

interface BrandingResponse {
  name?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
}

export interface BrandInfo {
  /** Nome da empresa (tenant); null antes de carregar ou sem sessão. */
  name: string | null;
  logoUrl: string | null;
  /** Busca a marca de novo (depois que o RH salva a identidade visual). */
  refresh: () => void;
}

const BrandContext = createContext<BrandInfo>({ name: null, logoUrl: null, refresh: () => {} });

export const useBrand = () => useContext(BrandContext);

/**
 * Chave do cache local da marca ({ dark, light }), lida também pelo script do
 * <head> (layout.tsx). v2: a v1 guardava só os valores do tema escuro.
 */
export const BRAND_CACHE_KEY = 'pontufy-brand-v2';
const STYLE_ID = 'pontufy-brand';

type BrandVars = { dark: Record<string, string>; light: Record<string, string> };

/** Escreve a marca numa <style> (por tema), nunca no style do <html>: inline venceria o tema claro. */
function applyBrand(vars: BrandVars | null) {
  let tag = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (vars) {
    if (!tag) {
      tag = document.createElement('style');
      tag.id = STYLE_ID;
      document.head.appendChild(tag);
    }
    tag.textContent = brandStylesheet(vars.dark, vars.light);
  } else {
    tag?.remove();
  }
  try {
    localStorage.removeItem('pontufy-brand-vars');
    if (vars) localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify(vars));
    else localStorage.removeItem(BRAND_CACHE_KEY);
  } catch {
    // Sem storage (aba privada): só perde o cache contra o "flash" de cor.
  }
}

/**
 * White-label do tenant. Busca a marca depois do login (e de novo se o tenant
 * mudar) e sobrescreve no <html> os tokens md-primary, md-primary-container,
 * on-primary, md-primary-text e md-secondary com valores derivados da cor do
 * cliente e já ajustados para 4,5:1 (deriveBrandTheme). Sem cor própria, a
 * paleta Pontufy do globals.css continua valendo. Nome e logo vão por contexto.
 */
export default function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId ?? null;
  // Guardado com o tenant de origem: ao sair ou trocar de tenant, o valor velho deixa de valer.
  const [brand, setBrand] = useState<{ tenantId: string; name: string | null; logoUrl: string | null } | null>(null);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || !tenantId) {
      // Sem sessão (login, landing): volta à marca Pontufy.
      applyBrand(null);
      return;
    }

    let cancelled = false;
    fetch('/api/admin/branding', { cache: 'no-store' })
      .then((res) => (res.ok ? (res.json() as Promise<BrandingResponse>) : null))
      .then((branding) => {
        if (cancelled || !branding) return;

        const primary = customBrandColor(branding.primaryColor);
        const accent = customBrandColor(branding.accentColor);
        applyBrand(
          primary
            ? {
                dark: brandThemeCssVars(deriveBrandTheme(primary, accent, 'dark')),
                light: brandThemeCssVars(deriveBrandTheme(primary, accent, 'light')),
              }
            : null,
        );

        setBrand({
          tenantId,
          name: branding.name?.trim() || null,
          logoUrl: sanitizeBrandingUrl(branding.logoUrl),
        });

        const favicon = sanitizeBrandingUrl(branding.faviconUrl);
        if (favicon) {
          const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (icon) icon.href = favicon;
        }
      })
      .catch(() => {
        // Mantém o que já está aplicado.
      });

    return () => {
      cancelled = true;
    };
  }, [status, tenantId, version]);

  const current = status === 'authenticated' && brand?.tenantId === tenantId ? brand : null;
  const value = useMemo(
    () => ({ name: current?.name ?? null, logoUrl: current?.logoUrl ?? null, refresh }),
    [current, refresh],
  );
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}
