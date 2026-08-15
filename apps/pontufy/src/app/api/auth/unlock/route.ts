import { NextResponse } from 'next/server';
import { consumeUnlockToken, getClientIp, ipRateLimit } from '@/lib/security/auth-guard';
import { parseBody, unlockSchema } from '@/lib/validations';

// 6.4 — Desbloqueio de conta via link mágico (token de uso único, 30 min).
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = await ipRateLimit(ip, 'unlock', 10, 15 * 60);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde.' }, { status: 429 });
    }

    // 8.1 — Validação centralizada via Zod
    const raw = await request.json().catch(() => null);
    const { data: body, error: validationError } = parseBody(unlockSchema, raw);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { token } = body;

    const email = await consumeUnlockToken(token);

    if (!email) {
      return NextResponse.json(
        { error: 'Token expirado ou já utilizado. Solicite um novo desbloqueio tentando entrar novamente.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('POST /api/auth/unlock:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}