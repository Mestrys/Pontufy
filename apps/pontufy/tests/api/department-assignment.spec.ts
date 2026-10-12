import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { prisma, USERS, userIdByEmail } from '../helpers/db';

// ═══════════════════════════════════════════════════════════════════════════
// TAREFA 13.2 — Departamento do colaborador (fonte do ranking interdepartamental)
// Somente o RH (admin_rh) do próprio tenant define o departamento; o
// colaborador não edita o próprio (anti-manipulação do ranking).
// ═══════════════════════════════════════════════════════════════════════════

test.describe.serial('Atribuição de departamento pelo RH', () => {
  let employeeId: string;
  let originalDepartment: string | null;

  test.beforeAll(async () => {
    employeeId = await userIdByEmail(USERS.alphaEmployee);
    const user = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { department: true },
    });
    originalDepartment = user?.department ?? null;
  });

  test.afterAll(async () => {
    await prisma.user.update({
      where: { id: employeeId },
      data: { department: originalDepartment },
    });
  });

  test('RH define o departamento, valor persiste normalizado e é auditado', async ({ request }) => {
    await loginAs(request, USERS.alphaAdmin);
    const res = await request.patch(`/api/admin/users/${employeeId}`, {
      data: { department: '  Engenharia   QA ' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.department).toBe('Engenharia QA');

    const stored = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { department: true, tenantId: true },
    });
    expect(stored?.department).toBe('Engenharia QA');

    const audit = await prisma.auditLog.findFirst({
      where: { tenantId: stored!.tenantId, action: 'USER_DEPARTMENT_UPDATED', entityId: employeeId },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit?.newValue).toEqual({ department: 'Engenharia QA' });

    const team = await request.get('/api/invitations');
    const teamBody = await team.json();
    expect(teamBody.departments).toContain('Engenharia QA');

    const ranking = await request.get('/api/battles/leaderboard');
    expect(ranking.status()).toBe(200);
    const rankingBody = await ranking.json();
    expect(rankingBody.ranking.map((r: { department: string }) => r.department)).toContain(
      'Engenharia QA',
    );
  });

  test('RH limpa o departamento com string vazia (vira null, sem departamento fantasma)', async ({
    request,
  }) => {
    await loginAs(request, USERS.alphaAdmin);
    const res = await request.patch(`/api/admin/users/${employeeId}`, {
      data: { department: '   ' },
    });
    expect(res.status()).toBe(200);
    const stored = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { department: true },
    });
    expect(stored?.department).toBeNull();
  });

  test('validação server-side rejeita tamanho e tipo inválidos (400)', async ({ request }) => {
    await loginAs(request, USERS.alphaAdmin);
    for (const department of ['A', 'x'.repeat(61), 42, ['Vendas']]) {
      const res = await request.patch(`/api/admin/users/${employeeId}`, { data: { department } });
      expect(res.status(), `department=${JSON.stringify(department)}`).toBe(400);
    }
    const missing = await request.patch(`/api/admin/users/${employeeId}`, { data: {} });
    expect(missing.status()).toBe(400);
  });

  test('RH de outro tenant recebe 404 (isolamento)', async ({ request }) => {
    await loginAs(request, USERS.betaAdmin);
    const res = await request.patch(`/api/admin/users/${employeeId}`, {
      data: { department: 'Invasores' },
    });
    expect(res.status()).toBe(404);
  });

  test('colaborador não define departamento: nem via admin (403) nem via perfil (403)', async ({
    request,
  }) => {
    await loginAs(request, USERS.alphaEmployee);
    const admin = await request.patch(`/api/admin/users/${employeeId}`, {
      data: { department: 'Diretoria' },
    });
    expect(admin.status()).toBe(403);

    const profile = await request.patch('/api/users/profile', {
      data: { department: 'Diretoria' },
    });
    expect(profile.status()).toBe(403);

    const stored = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { department: true },
    });
    expect(stored?.department).not.toBe('Diretoria');
  });

  test('departamento definido no convite é herdado no registro', async ({ request }) => {
    const email = `dept-invite-${Date.now()}@empresaalpha.com`;
    try {
      await loginAs(request, USERS.alphaAdmin);
      const invite = await request.post('/api/invitations', {
        data: { email, role: 'employee', department: ' Financeiro ' },
      });
      expect(invite.status()).toBe(200);
      const inviteBody = await invite.json();
      expect(inviteBody.invitation.department).toBe('Financeiro');

      const invalid = await request.post('/api/invitations', {
        data: { email: `x-${email}`, role: 'employee', department: 'x'.repeat(61) },
      });
      expect(invalid.status()).toBe(400);

      const token = new URL(inviteBody.invitation.signupUrl).searchParams.get('token');
      const register = await request.post('/api/auth/register', {
        data: { token, name: 'Colaborador Financeiro', password: 'SenhaForte123' },
      });
      expect([200, 201]).toContain(register.status());

      const created = await prisma.user.findUnique({ where: { email }, select: { department: true } });
      expect(created?.department).toBe('Financeiro');
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await prisma.invitation.deleteMany({ where: { email } });
    }
  });

  test('não autenticado recebe 401', async ({ request }) => {
    const res = await request.patch(`/api/admin/users/${employeeId}`, {
      data: { department: 'Vendas' },
    });
    expect(res.status()).toBe(401);
  });
});
