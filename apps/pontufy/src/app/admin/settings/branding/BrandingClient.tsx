'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Save, Palette, Image as ImageIcon, ArrowLeft, Check } from 'lucide-react';
import { sanitizeHexColor, DEFAULT_PRIMARY_COLOR, DEFAULT_ACCENT_COLOR } from '@/lib/branding';

interface Branding {
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
}

const PRESETS = ['#10B981', '#8B5CF6', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

export default function BrandingClient() {
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
          setPrimaryColor(data.primaryColor ?? DEFAULT_PRIMARY_COLOR);
          setAccentColor(data.accentColor ?? DEFAULT_ACCENT_COLOR);
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-600" size={26} />
      </div>
    );
  }

  const primaryHex = sanitizeHexColor(primaryColor) ?? DEFAULT_PRIMARY_COLOR;
  const accentHex = sanitizeHexColor(accentColor) ?? DEFAULT_ACCENT_COLOR;

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-2"
          >
            <ArrowLeft size={15} /> Voltar ao painel
          </Link>
          <h1 className="text-2xl font-bold text-white">Identidade Visual</h1>
          <p className="text-sm text-gray-500 mt-1">
            Personalize a marca exibida para {branding?.name ?? 'sua empresa'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center font-medium">
            {error}
          </div>
        )}
        {colorError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center font-medium">
            {colorError}
          </div>
        )}
        {saved && (
          <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-lg font-medium">
            <Check size={16} /> Identidade visual salva com sucesso!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <ImageIcon size={16} className="text-emerald-400" /> Logos
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  URL do logo
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://suaempresa.com/logo.png"
                  className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  URL do favicon
                </label>
                <input
                  type="text"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="https://suaempresa.com/favicon.ico"
                  className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors"
                />
              </div>

              {logoUrl && (
                <div className="flex items-center gap-3 p-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Prévia do logo"
                    className="h-10 w-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = '0.3';
                    }}
                  />
                  <p className="text-xs text-gray-500">Prévia do logo</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <Palette size={16} className="text-emerald-400" /> Cores da marca
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Cor primária
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryHex}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-11 w-14 rounded-lg border border-[#2a2a2a] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm uppercase transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Cor de destaque
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentHex}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-11 w-14 rounded-lg border border-[#2a2a2a] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm uppercase transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPrimaryColor(preset)}
                  className="h-8 w-8 rounded-full border border-[#2a2a2a] transition-transform hover:scale-110"
                  style={{ backgroundColor: preset }}
                  aria-label={`Usar cor ${preset}`}
                />
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg">
              <p className="text-xs text-gray-500 mb-3">Prévia do gradiente da marca:</p>
              <button
                type="button"
                className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${primaryHex} 0%, #059669 100%)` }}
              >
                CTA principal
              </button>
              <span
                className="ml-4 text-sm font-black"
                style={{ backgroundImage: `linear-gradient(135deg, ${primaryHex} 0%, ${accentHex} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
              >
                Pontufy
              </span>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Salvar identidade visual
          </button>
        </form>
      </div>
    </div>
  );
}