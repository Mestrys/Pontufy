import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRedis } from '@/lib/redis';

// 7.3 — Revogação instantânea de TODAS as sessões do usuário autenticado
// (comprometimento, dispositivo roubado, troca de senha forçada).
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const redis = getRedis();
  if (redis) {
    const current = (await redis.get<number>(`session-version:${session.user.id}`)) ?? 1;
    await redis.set(`session-version:${session.user.id}`, current + 1);
  }

  return NextResponse.json({ success: true });
}