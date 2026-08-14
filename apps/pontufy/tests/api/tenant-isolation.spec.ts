import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { FIXTURES, SEED, USERS } from '../helpers/db';

// ═══════════════════════════════════════════════════════════════════════════
// Zero Trust Data Leak — Isolamento Multi-Tenant
// Sessão do Tenant A (Empresa Alpha) NUNCA deve ler/modificar recursos do
// Tenant B (Beta Corp) e vice-versa. O interceptor getTenantDb escopa toda
// consulta por tenantId — a violação se manifesta como 404/403, nunca vazamento.
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Isolamento multi-tenant (Zero Trust)', () => {
  test('alpha lê o próprio curso; beta recebe 404 no mesmo recurso', async ({ request }) => {
    await loginAs(request, USERS.alphaAdmin);
    const own = await request.get(`/api/courses/${FIXTURES.courseIsolationAlpha}`);
    expect(own.status()).toBe(200);
    const body = await own.json();
    expect(body.id).toBe(FIXTURES.courseIsolationAlpha);

    await loginAs(request, USERS.betaAdmin);
    const foreign = await request.get(`/api/courses/${FIXTURES.courseIsolationAlpha}`);
    expect(foreign.status()).toBe(404);
  });

  test('beta não consegue concluir aula do curso da alpha (404)', async ({ request }) => {
    await loginAs(request, USERS.betaEmployee);
    const res = await request.post('/api/lessons/complete', {
      data: { lessonId: FIXTURES.lessonIsolationAlpha },
    });
    expect(res.status()).toBe(404);
  });

  test('beta não resgata recompensa da alpha (404)', async ({ request }) => {
    await loginAs(request, USERS.betaEmployee);
    const res = await request.post('/api/rewards/redeem', {
      data: { rewardId: SEED.rewardAmazon },
    });
    expect(res.status()).toBe(404);
  });

  test('beta não emite certificado em curso da alpha (404)', async ({ request }) => {
    await loginAs(request, USERS.betaEmployee);
    const res = await request.post('/api/certificates', {
      data: { courseId: FIXTURES.courseIsolationAlpha },
    });
    expect(res.status()).toBe(404);
  });

  test('auditoria do beta é escopada: ações da alpha não vazam (availableActions)', async ({ request }) => {
    await loginAs(request, USERS.betaAdmin);
    const res = await request.get('/api/admin/audit-logs?limit=100');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.logs)).toBe(true);
    expect(body.availableActions).not.toContain('AI_CREDITS_ADJUSTED');
    expect(body.availableActions).not.toContain('REWARD_REDEEMED');
  });

  test('colega do mesmo tenant (alpha) completa aula normalmente (200)', async ({ request }) => {
    await loginAs(request, USERS.alphaEmployee);
    const res = await request.post('/api/lessons/complete', {
      data: { lessonId: FIXTURES.lessonIsolationAlpha },
    });
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
    }
  });

  test('endpoints de API rejeitam requisições não autenticadas (401)', async ({ request }) => {
    const cases = [
      request.get('/api/courses'),
      request.post('/api/lessons/complete', { data: { lessonId: 'x' } }),
      request.post('/api/rewards/redeem', { data: { rewardId: 'x' } }),
      request.get('/api/certificates'),
      request.get('/api/admin/audit-logs'),
    ];
    for (const res of await Promise.all(cases)) {
      expect(res.status()).toBe(401);
    }
  });
});