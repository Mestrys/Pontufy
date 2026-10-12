import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { checkAIProviders } from '@/lib/ai-providers';

export async function GET() {
  try {
    const { role } = await getSessionContext();
    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
  }

  const { available, configured, diagnostics, chainOrder } = await checkAIProviders();

  return NextResponse.json({
    status: configured ? 'ok' : 'no_providers',
    providers: Object.entries(diagnostics).map(([key, detail]) => ({
      key,
      detail,
      configured: available.some((p) => p.toLowerCase().includes(key)),
    })),
    chainOrder,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    hint: !configured
      ? 'Nenhuma chave de IA configurada. No Vercel: Settings > Environment Variables > Adicione GEMINI_API_KEY para TODOS os ambientes (Production, Preview, Development).'
      : undefined,
  });
}
