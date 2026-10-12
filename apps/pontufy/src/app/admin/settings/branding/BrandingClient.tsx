'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Palette, Image as ImageIcon, ArrowLeft, Check } from 'lucide-react';
import {
  sanitizeHexColor,
  sanitizeBrandingUrl,
  customBrandColor,
  deriveBrandTheme,
  brandThemeCssVars,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_ACCENT_COLOR,
} from '@/lib/branding';
import { useBrand } from '@/components/theme/DynamicThemeProvider';

interface Branding {
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
}

const PRESETS = [DEFAULT_PRIMARY_COLOR, '#1E3A8A', '#3B82F6', '#14B8A6', '#F59E0B', '#F97316', '#EF4444', '#EC4899'];

export default function BrandingClient() {
  const { refresh } = useBrand();
  const [branding, setBranding] = useState<Branding | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [colorError, setColorError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/branding', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setBranding(data);
          setLogoUrl(data.logoUrl ?? '');
          setFaviconUrl(data.faviconUrl ?? '');
          // Padrões antigos (esmeralda/lavanda) contam como "sem personalização".
          setPrimaryColor(customBrandColor(data.primaryColor) ?? DEFAULT_PRIMARY_COLOR);
          setAccentColor(customBrandColor(data.accentColor) ?? DEFAULT_ACCENT_COLOR);
        } else {
          setError(data.error || 'Erro ao carregar a marca.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Erro ao conectar ao servidor.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const validateColors = (): boolean => {
    const primary = sanitizeHexColor(primaryColor);
    const accent = sanitizeHexColor(accentColor);
    if (!primary || !accent) {
      setColorError('Cores inválidas. Use formato #RGB ou #RRGGBB.');
      return false;
    }
    setColorError('');
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (!validateColors()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: logoUrl.trim() || null,
          faviconUrl: faviconUrl.trim() || null,
          primaryColor: primaryColor.trim(),
          accentColor: accentColor.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBranding(data.branding);
        setSaved(true);
        refresh();
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Erro ao salvar a marca.');
      }
    } catch {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-md-primary-text" size={26} />
      </div>
    );
  }

  const primaryHex = sanitizeHexColor(primaryColor) ?? DEFAULT_PRIMARY_COLOR;
  const accentHex = sanitizeHexColor(accentColor) ?? DEFAULT_ACCENT_COLOR;
  const isCustom = customBrandColor(primaryHex) !== null;
  const theme = deriveBrandTheme(primaryHex, customBrandColor(accentHex));
  // A prévia usa os mesmos tokens que o app vai usar; sem cor própria, a paleta Pontufy.
  const previewVars = (isCustom ? brandThemeCssVars(theme) : {}) as React.CSSProperties;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-headline-md font-extrabold text-md-on-surface">Marca</h1>
            <p className="text-body-md text-md-on-surface-variant mt-1">
              Personalize a marca exibida para {branding?.name ?? 'sua empresa'}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-md-error/10 border border-md-error/30 text-md-error text-body-sm p-3 rounded-xl text-center font-medium">
          {error}
        </div>
      )}
      {colorError && (
        <div className="bg-md-error/10 border border-md-error/30 text-md-error text-body-sm p-3 rounded-xl text-center font-medium">
          {colorError}
        </div>
      )}
      {saved && (
        <div className="flex items-center justify-center gap-2 bg-md-tertiary-container/20 border border-md-tertiary-container/30 text-md-on-tertiary-container text-body-sm p-3 rounded-xl font-medium">
          <Check size={16} /> Identidade visual salva com sucesso!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="md-card-outlined md-elevation-1 p-6">
          <h2 className="text-label-lg font-bold text-md-on-surface uppercase tracking-wider mb-5 flex items-center gap-2">
            <ImageIcon size={18} className="text-md-primary-text" /> Logos
          </h2>

          <div className="space-y-5">
            <div>
              <label htmlFor="brand-logo-url" className="text-label-lg text-md-on-surface-variant mb-2 block">
                URL do logo
              </label>
              <input
                id="brand-logo-url"
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://suaempresa.com/logo.png"
                className="w-full px-4 py-3.5 bg-md-surface-container border border-md-outline rounded-xl text-md-on-surface placeholder:text-md-on-surface-muted focus:outline-none focus:border-md-focus focus:ring-2 focus:ring-md-focus/40 text-body-md transition-colors"
              />
            </div>

            <div>
              <label htmlFor="brand-favicon-url" className="text-label-lg text-md-on-surface-variant mb-2 block">
                URL do favicon
              </label>
              <input
                id="brand-favicon-url"
                type="text"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://suaempresa.com/favicon.ico"
                className="w-full px-4 py-3.5 bg-md-surface-container border border-md-outline rounded-xl text-md-on-surface placeholder:text-md-on-surface-muted focus:outline-none focus:border-md-focus focus:ring-2 focus:ring-md-focus/40 text-body-md transition-colors"
              />
            </div>

            {logoUrl && (
              <div className="flex items-center gap-3 p-4 bg-md-surface-container-high border border-md-outline rounded-xl">
                <img
                  src={logoUrl}
                  alt="Prévia do logo"
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '0.3';
                  }}
                />
                <p className="text-body-sm text-md-on-surface-muted">Prévia do logo</p>
              </div>
            )}
          </div>
        </section>

        <section className="md-card-outlined md-elevation-1 p-6">
          <h2 className="text-label-lg font-bold text-md-on-surface uppercase tracking-wider mb-5 flex items-center gap-2">
            <Palette size={18} className="text-md-primary-text" /> Cores da marca
          </h2>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="brand-primary-hex" className="text-label-lg text-md-on-surface-variant mb-2 block">
                Cor primária
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Escolher cor primária"
                  value={primaryHex}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-11 w-14 rounded-xl border border-md-outline bg-transparent cursor-pointer"
                />
                <input
                  id="brand-primary-hex"
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-3.5 bg-md-surface-container border border-md-outline rounded-xl text-md-on-surface focus:outline-none focus:border-md-focus focus:ring-2 focus:ring-md-focus/40 text-body-md uppercase transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="brand-accent-hex" className="text-label-lg text-md-on-surface-variant mb-2 block">
                Cor de destaque
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Escolher cor de destaque"
                  value={accentHex}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-11 w-14 rounded-xl border border-md-outline bg-transparent cursor-pointer"
                />
                <input
                  id="brand-accent-hex"
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-4 py-3.5 bg-md-surface-container border border-md-outline rounded-xl text-md-on-surface focus:outline-none focus:border-md-focus focus:ring-2 focus:ring-md-focus/40 text-body-md uppercase transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 mb-6">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setPrimaryColor(preset);
                  if (preset === DEFAULT_PRIMARY_COLOR) setAccentColor(DEFAULT_ACCENT_COLOR);
                }}
                className="size-11 rounded-full border border-md-outline transition-transform motion-safe:hover:scale-110"
                style={{ backgroundColor: preset }}
                aria-label={preset === DEFAULT_PRIMARY_COLOR ? 'Usar as cores Pontufy' : `Usar cor ${preset}`}
                aria-pressed={primaryHex === preset}
              />
            ))}
          </div>

          {isCustom && theme.adjusted && (
            <p role="status" className="mb-4 rounded-xl border border-md-highlight/30 bg-md-highlight/10 p-3 text-body-sm text-md-highlight">
              Ajustamos o preenchimento para {theme.primary} para manter o texto dos botões legível (contraste mínimo de 4,5:1).
            </p>
          )}

          <div style={previewVars} className="rounded-xl border border-md-outline bg-md-surface-dim overflow-hidden" aria-label="Prévia da marca" role="group">
            <div className="flex items-center justify-between gap-3 border-b border-md-outline bg-md-surface px-4 py-3">
              {sanitizeBrandingUrl(logoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element -- prévia de URL externa digitada pelo RH
                <img src={sanitizeBrandingUrl(logoUrl)!} alt={branding?.name ?? 'Logo'} className="h-8 max-w-[140px] w-auto object-contain" />
              ) : (
                <span className="text-xl font-black tracking-tight text-white">
                  <span className="text-md-primary-text">Pontu</span>fy
                </span>
              )}
              <span className="rounded-full bg-md-primary/20 px-3 py-1.5 text-sm font-bold text-white">Início</span>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-body-md text-md-on-surface">
                Texto da aula com um <span className="text-md-primary-text underline underline-offset-2">link</span> e um{' '}
                <span className="font-bold text-md-secondary">destaque</span>.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-11 items-center rounded-full bg-md-primary px-6 text-sm font-bold text-md-on-primary">
                  Concluir e avançar
                </span>
                <span className="inline-flex h-11 items-center rounded-full bg-md-primary-container px-6 text-sm font-bold text-md-on-primary-container">
                  Ao passar o mouse
                </span>
                <span className="md-btn md-btn-outlined">Secundário</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-body-sm text-md-on-surface-muted">
            A cor de destaque aparece em rótulos e em botões tonais. Para voltar às cores Pontufy, escolha a primeira cor da lista.
          </p>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="md-btn md-btn-filled w-full"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Salvar identidade visual
        </button>
      </form>
    </div>
  );
}