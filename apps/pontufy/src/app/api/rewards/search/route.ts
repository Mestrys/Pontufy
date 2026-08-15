import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { lomadeeService } from '@/lib/lomadee';

export async function GET(request: Request) {
  try {
    await getSessionContext();

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword')?.trim();
    const type = searchParams.get('type');

    if (type === 'coupons') {
      try {
        const coupons = await lomadeeService.fetchCoupons();
        return NextResponse.json({ data: coupons });
      } catch (error: any) {
        if (error.message?.includes('not configured')) {
          return NextResponse.json({ data: [], message: 'Lomadee not configured.' });
        }
        console.error('Lomadee coupons error:', error);
        return NextResponse.json({ error: 'Falha ao buscar cupons.' }, { status: 502 });
      }
    }

    if (!keyword || keyword.length < 2) {
      return NextResponse.json({ error: 'Palavra-chave deve ter pelo menos 2 caracteres.' }, { status: 400 });
    }

    try {
      const catalog = await lomadeeService.fetchCatalog();
      // Filter offers by keyword
      const filteredOffers = catalog.offers.filter(offer =>
        offer.title.toLowerCase().includes(keyword.toLowerCase()) ||
        offer.description?.toLowerCase().includes(keyword.toLowerCase()) ||
        offer.partnerName.toLowerCase().includes(keyword.toLowerCase())
      );
      return NextResponse.json({ data: filteredOffers });
    } catch (error: any) {
      if (error.message?.includes('not configured')) {
        return NextResponse.json({ data: [], message: 'Lomadee not configured.' });
      }
      console.error('Lomadee search error:', error);
      return NextResponse.json({ error: 'Falha ao buscar ofertas.' }, { status: 502 });
    }
  } catch (error: any) {
    if (error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
