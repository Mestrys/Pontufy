import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { prisma, SEED, USERS, userIdByEmail } from '../helpers/db';

// ═══════════════════════════════════════════════════════════════════════════
// Concorrência & Bloqueio Distribuído (Anti-Double-Spend)
// 5 requisições idênticas e concorrentes a /api/lessons/complete devem
// produzir EXATAMENTE 1 crédito: lock Redis (mutex) + UNIQUE(userId, lessonId).
// Sem Redis o lock é fail-closed (429) — a suíte pula esses testes.
// ═══════════════════════════════════════════════════════════════════════════

const LESSON = SEED.lessonLgpd1;
const POINTS = 40;

const hasRedis = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

test.describe('Concorrência /api/lessons/complete', () => {
  test.skip(!hasRedis(), 'Redis não configurado — lock distribuído indisponível (fail-closed 429).');

  test('5 POSTs concorrentes → exatamente 1 crédito no ledger e 1 conclusão', async ({ request }) => {
    const userId = await userIdByEmail(USERS.race);
    await loginAs(request, USERS.race);

    // Estado limpo e determinístico para a corrida.
    await prisma.pointsLedger.deleteMany({ where: { userId } });
    await prisma.lessonCompletion.deleteMany({ where: { userId } });
    await prisma.user.update({ where: { id: userId }, data: { pointsBalance: 0 } });

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request.post('/api/lessons/complete', { data: { lessonId: LESSON } }),
      ),
    );

    const statuses = responses.map((r) => r.status());
    const succeeded = responses.filter((r) => r.status() === 200);

    // Anti-double-spend: exatamente UMA requisição vence a corrida.
    expect(succeeded.length, `Esperado 1 sucesso, obtido ${succeeded.length} (status: ${statuses})`).toBe(1);
    for (const r of responses) {
      if (r.status() !== 200) {
        expect(r.status(), 'Perdedores da corrida devem receber 429 (lock)').toBe(429);
      }
    }

    const winner = await succeeded[0].json();
    expect(winner.success).toBe(true);
    expect(winner.newBalance).toBe(POINTS);
    expect(winner.alreadyCompleted).toBeFalsy();

    // Verificação no banco (fonte da verdade):
    expect(await prisma.pointsLedger.count({ where: { userId } })).toBe(1);
    expect(
      await prisma.lessonCompletion.count({ where: { userId, lessonId: LESSON } }),
    ).toBe(1);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.pointsBalance).toBe(POINTS);
  });

  test('repetição idempotente (não concorrente) → 200 já concluída, sem novo crédito', async ({ request }) => {
    const userId = await userIdByEmail(USERS.race);
    await loginAs(request, USERS.race);

    const ledgerBefore = await prisma.pointsLedger.count({ where: { userId } });

    const res = await request.post('/api/lessons/complete', { data: { lessonId: LESSON } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.alreadyCompleted).toBe(true);
    expect(body.newBalance).toBe(POINTS);

    expect(await prisma.pointsLedger.count({ where: { userId } })).toBe(ledgerBefore);
  });
});