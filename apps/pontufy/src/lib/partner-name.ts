// Nome comercial do parceiro de um benefício.
//
// O campo `partner` guarda o canal técnico da integração ("custom",
// "LOMADEE", "amazon"...), que não significa nada para o colaborador. O nome
// mostrado vem do domínio da oferta; o canal só é usado se não houver URL.

const KNOWN: Record<string, string> = {
  amazon: 'Amazon',
  ifood: 'iFood',
  magalu: 'Magalu',
  magazineluiza: 'Magalu',
  shopee: 'Shopee',
  mercadolivre: 'Mercado Livre',
  americanas: 'Americanas',
  netshoes: 'Netshoes',
  pontufy: 'Pontufy',
  uber: 'Uber',
  rappi: 'Rappi',
  submarino: 'Submarino',
  casasbahia: 'Casas Bahia',
};

// Canais técnicos que nunca devem aparecer como nome.
const TECHNICAL = new Set(['custom', 'lomadee', 'partner', 'parceiro']);

function fromHost(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const base = host.split('.')[0];
    if (!base) return null;
    return KNOWN[base] ?? base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return null;
  }
}

export function partnerDisplayName(reward: {
  originalUrl?: string | null;
  partner?: string | null;
  partnerStore?: string | null;
}): string {
  const fromUrl = reward.originalUrl ? fromHost(reward.originalUrl) : null;
  if (fromUrl) return fromUrl;
  const raw = (reward.partnerStore ?? reward.partner ?? '').trim();
  if (!raw || TECHNICAL.has(raw.toLowerCase())) return 'Parceiro';
  return KNOWN[raw.toLowerCase()] ?? raw;
}
