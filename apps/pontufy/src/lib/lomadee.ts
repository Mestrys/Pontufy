// File: src/lib/lomadee.ts
// Lomadee (Social Soul) Affiliate Integration Service
// Server-only: Never expose API tokens to the client.

export interface LomadeeConfig {
  appToken: string;
  sourceId: string;
  apiBaseUrl: string;
}

export interface LomadeeDeeplinkResponse {
  deeplink: string;
  shortUrl?: string;
  trackingId?: string;
}

export interface LomadeeCoupon {
  id: string;
  title: string;
  description?: string;
  code?: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  discountValue: number;
  minOrderValue?: number;
  validFrom: string;
  validUntil: string;
  affiliateLink: string;
  partnerName: string;
  partnerLogo?: string;
  category?: string;
  termsAndConditions?: string;
}

export interface LomadeeOffer {
  id: string;
  title: string;
  description?: string;
  originalPrice?: number;
  promotionalPrice: number;
  discountPercentage?: number;
  imageUrl?: string;
  affiliateLink: string;
  partnerName: string;
  partnerLogo?: string;
  category?: string;
  validUntil?: string;
}

export interface LomadeeCatalogResponse {
  coupons: LomadeeCoupon[];
  offers: LomadeeOffer[];
}

function getConfig(): LomadeeConfig {
  const appToken = process.env.LOMADEE_APP_TOKEN;
  const sourceId = process.env.LOMADEE_SOURCE_ID;
  const apiBaseUrl = process.env.LOMADEE_API_BASE_URL || 'https://api.lomadee.com/v2';

  if (!appToken || !sourceId) {
    throw new Error('Lomadee configuration missing: LOMADEE_APP_TOKEN and LOMADEE_SOURCE_ID are required');
  }

  return { appToken, sourceId, apiBaseUrl };
}

function getAuthHeaders(): HeadersInit {
  const { appToken, sourceId } = getConfig();
  return {
    'Authorization': `Bearer ${appToken}`,
    'X-Source-Id': sourceId,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

export class LomadeeService {
  private static instance: LomadeeService;

  static getInstance(): LomadeeService {
    if (!LomadeeService.instance) {
      LomadeeService.instance = new LomadeeService();
    }
    return LomadeeService.instance;
  }

  /**
   * Creates a tracked deeplink for a target URL with unique tracking subId.
   * Endpoint: POST /deeplink/_create
   */
  async createTrackedLink(targetUrl: string, trackingSubId: string): Promise<string> {
    const { apiBaseUrl } = getConfig();
    const url = `${apiBaseUrl}/deeplink/_create`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          url: targetUrl,
          subId: trackingSubId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lomadee deeplink creation failed (${response.status}): ${errorText}`);
      }

      const data: LomadeeDeeplinkResponse = await response.json();
      return data.deeplink || data.shortUrl || targetUrl;
    } catch (error) {
      console.error('Lomadee createTrackedLink error:', error);
      // Fail-open: return original URL if Lomadee is unavailable
      return targetUrl;
    }
  }

  /**
   * Fetches active coupons and offers from Lomadee catalog.
   * Endpoint: GET /coupons and GET /offers (or combined catalog endpoint)
   */
  async fetchCatalog(categoryId?: number): Promise<LomadeeCatalogResponse> {
    const { apiBaseUrl } = getConfig();

    try {
      const params = new URLSearchParams({
        status: 'active',
        ...(categoryId && { categoryId: categoryId.toString() }),
      });

      const [couponsRes, offersRes] = await Promise.allSettled([
        fetch(`${apiBaseUrl}/coupons?${params}`, { headers: getAuthHeaders() }),
        fetch(`${apiBaseUrl}/offers?${params}`, { headers: getAuthHeaders() }),
      ]);

      let coupons: LomadeeCoupon[] = [];
      let offers: LomadeeOffer[] = [];

      if (couponsRes.status === 'fulfilled' && couponsRes.value.ok) {
        const data = await couponsRes.value.json();
        coupons = data.coupons || data || [];
      }

      if (offersRes.status === 'fulfilled' && offersRes.value.ok) {
        const data = await offersRes.value.json();
        offers = data.offers || data || [];
      }

      return { coupons, offers };
    } catch (error) {
      console.error('Lomadee fetchCatalog error:', error);
      return { coupons: [], offers: [] };
    }
  }

  /**
   * Fetches coupons only.
   */
  async fetchCoupons(categoryId?: number): Promise<LomadeeCoupon[]> {
    const { coupons } = await this.fetchCatalog(categoryId);
    return coupons;
  }

  /**
   * Fetches offers only.
   */
  async fetchOffers(categoryId?: number): Promise<LomadeeOffer[]> {
    const { offers } = await this.fetchCatalog(categoryId);
    return offers;
  }

  /**
   * Validates if the service is properly configured.
   */
  isConfigured(): boolean {
    try {
      getConfig();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const lomadeeService = LomadeeService.getInstance();

// Convenience function for creating tracked links
export async function createLomadeeTrackedLink(targetUrl: string, trackingSubId: string): Promise<string> {
  return lomadeeService.createTrackedLink(targetUrl, trackingSubId);
}

// Convenience function for fetching catalog
export async function fetchLomadeeCatalog(categoryId?: number): Promise<LomadeeCatalogResponse> {
  return lomadeeService.fetchCatalog(categoryId);
}