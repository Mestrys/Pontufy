// Motor White-Label: validação e injeção segura de identidade visual por tenant.
//
// Higienização estrita de cores hex (`#RGB` ou `#RRGGBB`) — a rejeição de
// qualquer outro formato impede CSS Injection / exfiltração por atributos
// arbitrários. As variáveis CSS (`--brand-primary`, `--brand-accent`) são os
// únicos pontos de injeção; os tokens base do tema escuro permanecem intactos.

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

// Paleta Pontufy (md-primary e md-secondary do globals.css).
export const DEFAULT_PRIMARY_COLOR = '#5C4152';
export const DEFAULT_ACCENT_COLOR = '#D97F76';

// Valem como "sem personalização": os padrões antigos gravados pelo schema
// (@default) em todos os tenants — senão todo cliente ficaria esmeralda — e a
// própria paleta Pontufy, que já está desenhada no globals.css.
const LEGACY_DEFAULTS = new Set(['#10B981', '#8B5CF6', DEFAULT_PRIMARY_COLOR, DEFAULT_ACCENT_COLOR]);

/** Cor escolhida pelo cliente, ou null quando é vazia, inválida ou o padrão antigo. */
export function customBrandColor(value: unknown): string | null {
  const hex = sanitizeHexColor(value);
  return hex && !LEGACY_DEFAULTS.has(hex) ? hex : null;
}

/** Retorna a cor normalizada (#RRGGBB) ou null se inválida. */
export function sanitizeHexColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) return null;

  if (trimmed.length === 4) {
    const expanded = trimmed
      .slice(1)
      .split('')
      .map((c) => c + c)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }
  return trimmed.toUpperCase();
}

/** Aceita URLs absolutas (https://) ou relativas (/...) com limite de tamanho. */
export function sanitizeBrandingUrl(value: unknown, maxLength = 500): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return null;
  if (!/^(https?:\/\/|\/)/i.test(trimmed)) return null;
  return trimmed;
}

export interface Branding {
  name?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
}

// ═══════════════════ Guarda de contraste (WCAG 2.x) ═══════════════════

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === rn ? ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6 : max === gn ? ((bn - rn) / d + 2) / 6 : ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): RGB {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}

/**
 * Move a luminosidade da cor (mantendo matiz e saturação) na direção indicada
 * até atingir `min` de contraste contra `against`. Devolve a cor e o quanto
 * a luminosidade mudou (custo).
 */
function shiftUntil(hex: string, against: string, min: number, direction: 1 | -1): { hex: string; cost: number } {
  const [h, s, l0] = rgbToHsl(hexToRgb(hex));
  for (let step = 0; step <= 100; step++) {
    const l = Math.min(1, Math.max(0, l0 + direction * step * 0.01));
    const candidate = rgbToHex(hslToRgb([h, s, l]));
    if (contrastRatio(candidate, against) >= min) return { hex: candidate, cost: step };
    if (l === 0 || l === 1) break;
  }
  return { hex: direction === 1 ? '#FFFFFF' : '#000000', cost: 101 };
}

/** Superfície onde texto de marca tem menos contraste (md-surface-container-high de cada tema). */
const TEXT_BACKDROP = { dark: '#2A2A2A', light: '#E7E4E9' } as const;
export type ColorScheme = keyof typeof TEXT_BACKDROP;
const ON_LIGHT = '#141414';
const ON_DARK = '#FFFFFF';
const MIN_TEXT_CONTRAST = 4.5;

export interface BrandTheme {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  primaryText: string;
  secondary: string;
  /** A cor primária precisou mudar para manter o contraste. */
  adjusted: boolean;
}

/**
 * Deriva os tokens de marca a partir da cor do cliente, garantindo 4,5:1:
 * - texto (onPrimary) sobre o preenchimento e sobre o hover (container);
 * - md-primary-text e md-secondary como texto sobre as superfícies escuras.
 * Escolhe texto branco ou escuro pelo que exige a menor mudança na cor.
 */
export function deriveBrandTheme(
  primaryHex: string,
  accentHex?: string | null,
  scheme: ColorScheme = 'dark',
): BrandTheme {
  const base = sanitizeHexColor(primaryHex) ?? DEFAULT_PRIMARY_COLOR;

  const withWhite = shiftUntil(base, ON_DARK, MIN_TEXT_CONTRAST, -1);
  const withDark = shiftUntil(base, ON_LIGHT, MIN_TEXT_CONTRAST, 1);
  const useDarkText = withDark.cost < withWhite.cost;
  const onPrimary = useDarkText ? ON_LIGHT : ON_DARK;
  const primary = useDarkText ? withDark.hex : withWhite.hex;

  // Hover: um pouco mais longe do texto, para continuar passando.
  const [h, s, l] = rgbToHsl(hexToRgb(primary));
  const hoverL = Math.min(1, Math.max(0, l + (useDarkText ? 0.08 : -0.08)));
  const primaryContainer = rgbToHex(hslToRgb([h, s, hoverL]));

  // Texto de marca: clareia sobre o fundo escuro, escurece sobre o claro.
  const backdrop = TEXT_BACKDROP[scheme];
  const textDirection = scheme === 'dark' ? 1 : -1;
  const primaryText = shiftUntil(base, backdrop, MIN_TEXT_CONTRAST, textDirection).hex;
  const accent = sanitizeHexColor(accentHex) ?? DEFAULT_ACCENT_COLOR;
  const secondary = shiftUntil(accent, backdrop, MIN_TEXT_CONTRAST, textDirection).hex;

  return { primary, primaryContainer, onPrimary, primaryText, secondary, adjusted: primary !== base };
}

/** CSS custom properties que sobrescrevem os tokens md-* no <html>. */
export function brandThemeCssVars(theme: BrandTheme): Record<string, string> {
  return {
    '--color-md-primary': theme.primary,
    '--color-md-primary-container': theme.primaryContainer,
    '--color-md-on-primary': theme.onPrimary,
    '--color-md-on-primary-container': theme.onPrimary,
    '--color-md-primary-text': theme.primaryText,
    '--color-md-secondary': theme.secondary,
  };
}

/**
 * Folha de estilo da marca para os dois temas. Mesmos seletores do tema claro
 * em globals.css, com especificidade maior (:root:root) para vencê-los.
 */
export function brandStylesheet(
  dark: Record<string, string>,
  light: Record<string, string>,
  /** Restringe a um elemento (prévia da tela de marca); sem ele, vale para a página. */
  scope?: string,
): string {
  const block = (vars: Record<string, string>) =>
    Object.entries(vars)
      .filter(([k, v]) => /^--color-md-[a-z-]+$/.test(k) && /^#[0-9A-F]{6}$/i.test(v))
      .map(([k, v]) => `${k}:${v};`)
      .join('');
  const base = scope ? `:root ${scope}` : ':root:root';
  const forced = scope ? `:root[data-theme="light"] ${scope}` : ':root:root[data-theme="light"]';
  const auto = scope ? `:root:not([data-theme="dark"]) ${scope}` : ':root:root:not([data-theme="dark"])';
  return (
    `${base}{${block(dark)}}` +
    `${forced}{${block(light)}}` +
    `@media (prefers-color-scheme: light){${auto}{${block(light)}}}`
  );
}
