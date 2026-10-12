import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { prisma, USERS } from '../helpers/db';

// ═══════════════════════════════════════════════════════════════════════════
// Barreira de Acesso Super Admin
// employee / admin_rh / guest (e sessões ausentes) que tentem /superadmin/*
// ou endpoints associados recebem estritamente 403 — nunca redirecionamento.
// ═══════════════════════════════════════════════════════════════════════════

const CREDITS_URL = '/api/superadmin/tenants/tenant-alpha-001/credits';

test.describe('Barreira super_admin', () => {
  for (const [label, email] of [
    ['employee', USERS.alphaEmployee],
    ['admin_rh', USERS.alphaAdmin],
    ['guest', USERS.alphaGuest],
  ] as const) {
    test(`PATCH créditos de IA como ${label} → 403 estrito`, async ({ request }) => {
      await loginAs(request, email);
      const res = await request.patch(CREDITS_URL, { data: { aiCredits: 999 } });
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  }

  test('PATCH créditos de IA sem sessão → 403 (fail-closed, sem redirect)', async ({ request }) => {
    const res = await request.patch(CREDITS_URL, { data: { aiCredits: 999 } });
    expect(res.status()).toBe(403);
  });

  test('super_admin @pontufy.com ajusta créditos → 200 + trilha de auditoria', async ({ request }) => {
    await loginAs(request, USERS.superAdmin);
    const res = await request.patch(CREDITS_URL, { data: { aiCredits: 999 } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.tenant.aiCredits).toBe(999);

    const audit = await prisma.auditLog.findFirst({
      where: { tenantId: 'tenant-alpha-001', action: 'AI_CREDITS_ADJUSTED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).not.toBeNull();
    expect(audit?.newValue).toMatchObject({ aiCredits: 999 });

    // Restaura o valor do seed (50) para manter o estado idempotente.
    const restore = await request.patch(CREDITS_URL, { data: { aiCredits: 50 } });
    expect(restore.status()).toBe(200);
  });

  test('super_admin com payload inválido → 400 (validação)', async ({ request }) => {
    await loginAs(request, USERS.superAdmin);
    const res = await request.patch(CREDITS_URL, { data: { aiCredits: 'muitos' } });
    expect(res.status()).toBe(400);
  });
});