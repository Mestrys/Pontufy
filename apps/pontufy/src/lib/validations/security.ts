// ═══════════════════════════════════════════════════════════════════════════
// Sanitização server-side (TAREFA 8.2/8.3/8.4) — sem dependências externas:
//  • sanitizeAiHtml: remove tags/atributos perigosos de conteúdo gerado por IA
//  • validateAffiliateUrl: allowlist de domínios + anti Open Redirect
//  • stripSensitive: interceptor de serialização (passwordHash/tokens nunca
//    vazam no JSON de resposta)
// ═══════════════════════════════════════════════════════════════════════════

const DANGEROUS_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
  'link', 'meta', 'style', 'svg', 'math', 'template', 'noscript', 'video', 'audio',
]);

// HTML gerado por IA (Markdown renderizado) → remove script/iframe etc.
// Mantém tags de conteúdo (p, strong, em, ul, ol, li, h1-h6, blockquote, code, pre, a).
export function sanitizeAiHtml(input: string): string {
  if (!input) return input;
  return input
    // tags perigosas inteiras (com conteúdo)
    .replace(/<\s*(script|iframe|object|embed|form|input|button|link|meta|style|svg|math|template|noscript|video|audio)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    // abertura/fechamento órfãos de tags perigosas
    .replace(/<\s*\/(script|iframe|object|embed|form|link|meta|style|svg|math|template|noscript|video|audio)\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|form|input|button|link|meta|style|svg|math|template|noscript|video|audio)\s*[^>]*>/gi, '')
    // handlers inline (on*) e javascript: — neutros
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:href|src|action|data)\s*=\s*(?:"|')?\s*javascript:[^"'>\s]*/gi, 'data=""')
    // "safe" renderização de colchetes remanescentes
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*)?)>/g, (m, close, tag) => {
      return DANGEROUS_TAGS.has(tag.toLowerCase())
        ? close
          ? `&lt;/${tag}&gt;`
          : `&lt;${tag}&gt;`
        : m;
    });
}

// Texto puro (Markdown de lições) → idêntico ao anterior sem HTML de conteúdo.
export function sanitizeAiText(input: string): string {
  return sanitizeAiHtml(input);
}

const AFFILIATE_ALLOWED_HOSTS = new Set([
  'www.amazon.com.br', 'amazon.com.br',
  'www.magazineluiza.com.br', 'magazineluiza.com.br',
  'shopee.com.br', 'br.shp.ee',
  'www.mercadolivre.com.br', 'mercadolivre.com.br', 'produto.mercadolivre.com.br',
  'www.americanas.com.br', 'americanas.com.br',
  'www.casasbahia.com.br', 'casasbahia.com.br',
  'www.submarino.com.br', 'submarino.com.br',
  'app.pontufy.com', 'pontufy.com', 'www.pontufy.com',
]);

// 8.3 — Validador de links de afiliados: https obrigatório + host em allowlist
// + path absoluto (bloqueia Open Redirect e phishing).
export function validateAffiliateUrl(url: string): { valid: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'URL inválida.' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Apenas links HTTPS são permitidos.' };
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, 'www.');
  const hostAllowed = AFFILIATE_ALLOWED_HOSTS.has(host) || host.endsWith('.pontufy.com');
  if (!hostAllowed) {
    return { valid: false, reason: 'Domínio não autorizado para links de afiliados.' };
  }

  if (parsed.pathname === '/' && !parsed.search && !parsed.hash) {
    return { valid: false, reason: 'Link sem destino.' };
  }

  return { valid: true };
}

// 8.4 — Interceptor de serialização: remove campos sensíveis antes do JSON.
const SENSITIVE_KEYS = new Set([
  'passwordHash', 'password', 'resetToken', 'unlockToken', 'stripeCustomerId', 'stripeSubscriptionId',
]);

export function stripSensitive<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      out[key] = stripSensitive(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}