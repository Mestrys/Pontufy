import { handlers } from '@/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { getClientIp, ipRateLimit } from '@/lib/security/auth-guard';

// 6.1 — Rate limiting por IP (janela deslizante: 5 tentativas / 15 min) antes
// de delegar ao handler do NextAuth. Fail-open se Redis indisponível.
const AUTH_MAX = 5;
const AUTH_WINDOW = 15 * 60;

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const result = await ipRateLimit(ip, 'auth', AUTH_MAX, AUTH_WINDOW);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Muitas tentativas de login. Aguarde 15 minutos antes de tentar novamente.',
        retryAfter: result.resetIn,
      },
      { status: 429 },
    );
  }

  return handlers.POST(request);
}