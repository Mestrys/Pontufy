export type Partner = 'amazon' | 'magalu' | 'shopee' | 'mercadolivre' | 'custom';

export interface AffiliatePayload {
  partner: Partner;
  baseUrl: string;
  userId: string;
  tenantId: string;
  rewardId: string;
}

export function generateAffiliateUrl(payload: AffiliatePayload): string {
  const trackingCode = `ptfy_${payload.tenantId.slice(0, 6)}_${payload.userId.slice(0, 6)}_${payload.rewardId.slice(0, 6)}`;
  const url = new URL(payload.baseUrl);

  switch (payload.partner) {
    case 'amazon': {
      const tag = process.env.AMAZON_AFFILIATE_TAG || 'pontufy-20';
      url.searchParams.set('tag', tag);
      url.searchParams.set('ascsubtag', trackingCode);
      break;
    }
    case 'magalu': {
      const partnerId = process.env.MAGALU_PARTNER_ID || 'pontufy';
      url.searchParams.set('partner_id', partnerId);
      url.searchParams.set('custom_id', trackingCode);
      break;
    }
    case 'shopee': {
      url.searchParams.set('utm_source', 'affiliate');
      url.searchParams.set('utm_medium', 'pontufy');
      url.searchParams.set('utm_campaign', trackingCode);
      break;
    }
    case 'mercadolivre': {
      const toolId = process.env.MELI_TOOL_ID || 'pontufy';
      url.searchParams.set('matt_tool', toolId);
      url.searchParams.set('matt_word', trackingCode);
      break;
    }
    default: {
      url.searchParams.set('ref', trackingCode);
      url.searchParams.set('utm_source', 'pontufy');
      url.searchParams.set('utm_campaign', trackingCode);
    }
  }
  return url.toString();
}

export function getPartnerDisplayName(partner: Partner): string {
  switch (partner) {
    case 'amazon': return 'Amazon';
    case 'magalu': return 'Magalu';
    case 'shopee': return 'Shopee';
    case 'mercadolivre': return 'Mercado Livre';
    default: return 'Parceiro';
  }
}

export function getPartnerIcon(partner: Partner): string {
  switch (partner) {
    case 'amazon': return '📦';
    case 'magalu': return '🛍️';
    case 'shopee': return '🛒';
    case 'mercadolivre': return '🟡';
    default: return '🔗';
  }
}