import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findReward } from '@/lib/data';

function generateRedemptionCode(rewardId: string) {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `PNT-${rewardId.slice(0, 4).toUpperCase()}-${random}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let body: { rewardId?: string; currentPoints?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const { rewardId, currentPoints } = body;
  if (!rewardId || typeof currentPoints !== 'number') {
    return NextResponse.json(
      { error: 'rewardId e currentPoints são obrigatórios.' },
      { status: 400 }
    );
  }

  const reward = findReward(rewardId);
  if (!reward) {
    return NextResponse.json({ error: 'Recompensa não encontrada.' }, { status: 404 });
  }

  if (currentPoints < reward.requiredPoints) {
    return NextResponse.json(
      {
        error: 'Saldo insuficiente para este resgate.',
        requiredPoints: reward.requiredPoints,
        currentPoints,
      },
      { status: 422 }
    );
  }

  // PROVISÓRIO: `currentPoints` vem do cliente e é apenas consultivo. A
  // autoridade sobre o saldo migra para o servidor na Fase 2 (persistência):
  // o saldo será lido do banco pelo session.user.id e o postback do parceiro
  // disparado aqui, de forma auditável. Até lá, o gate de auth acima já impede
  // que um caller anônimo emita códigos de resgate.
  return NextResponse.json({
    rewardId,
    code: generateRedemptionCode(rewardId),
    affiliateUrl: reward.affiliateUrl,
    pointsDeducted: reward.requiredPoints,
    redeemedAt: new Date().toISOString(),
  });
}
