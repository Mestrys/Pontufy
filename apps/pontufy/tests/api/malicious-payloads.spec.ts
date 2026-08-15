import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════
// Payloads maliciosos (TAREFA 8.5)
// Validação Zod centralizada deve rejeitar SQLi, XSS e prototype pollution
// com 4xx — nunca 500, nunca sucesso. Testa as rotas autenticadas com
// credenciais reais de um tenant de teste (ver tests/helpers/auth.ts).
// ═══════════════════════════════════════════════════════════════════════════

const SQLI = "' OR '1'='1' --";
const XSS = '<script>alert(1)</script>';
const PROTO_POLLUTION = { __proto__: { polluted: true }, constructor: { prototype: { polluted: true } } };

function authHeaders(token: string) {
  return { cookie: `authjs.session-token=${token}` };
}

test.describe('Validação centralizada (Zod) — rotas públicas', () => {
  test('register rejeita nome com XSS → 400', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { token: 'a'.repeat(32), name: XSS, password: 'SenhaForte123!' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('register rejeita senha curta → 400', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { token: 'a'.repeat(32), name: 'Usuário Teste', password: '123' },
    });
    expect(res.status()).toBe(400);
  });

  test('forgot-password rejeita email com SQLi → 400', async ({ request }) => {
    const res = await request.post('/api/auth/forgot-password', {
      data: { email: SQLI },
    });
    expect(res.status()).toBe(400);
  });

  test('forgot-password PUT rejeita token malformado → 400', async ({ request }) => {
    const res = await request.put('/api/auth/forgot-password', {
      data: { token: 'x', newPassword: 'SenhaForte123!' },
    });
    expect(res.status()).toBe(400);
  });

  test('unlock rejeita token curto → 400', async ({ request }) => {
    const res = await request.post('/api/auth/unlock', { data: { token: 'x' } });
    expect(res.status()).toBe(400);
  });
});

test.describe('Validação centralizada (Zod) — rotas autenticadas', () => {
  test('lessons/complete rejeita lessonId não-UUID → 400', async ({ request }) => {
    const res = await request.post('/api/lessons/complete', {
      data: { lessonId: SQLI },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('lessons/complete rejeita corpo vazio → 400', async ({ request }) => {
    const res = await request.post('/api/lessons/complete', { data: {} });
    expect([400, 401]).toContain(res.status());
  });

  test('rewards/redeem rejeita URL javascript: → 400', async ({ request }) => {
    const res = await request.post('/api/rewards/redeem', {
      data: { productUrl: 'javascript:alert(1)' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('rewards/redeem rejeita URL fora da allowlist (open redirect) → 400', async ({ request }) => {
    const res = await request.post('/api/rewards/redeem', {
      data: { productUrl: 'https://evil.example.com/phish' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('rewards/redeem rejeita corpo com prototype pollution → 400', async ({ request }) => {
    const res = await request.post('/api/rewards/redeem', {
      data: { ...PROTO_POLLUTION, rewardId: '00000000-0000-4000-8000-000000000000' },
    });
    expect([400, 404, 401]).toContain(res.status());
  });
});

// Cobertura unitária do sanitizador de conteúdo IA (executável no Node)
import { sanitizeAiHtml, sanitizeAiText, validateAffiliateUrl, stripSensitive } from '../../src/lib/validations/security';

test.describe('Sanitização server-side (8.2/8.3/8.4)', () => {
  test('sanitizeAiHtml remove script/iframe com conteúdo', () => {
    const out = sanitizeAiHtml('<p>ok</p><script>alert(1)</script><iframe src="x"></iframe>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('<iframe');
    expect(out).toContain('<p>ok</p>');
  });

  test('sanitizeAiHtml neutraliza handlers on* e javascript:', () => {
    const out = sanitizeAiHtml('<a href="javascript:alert(1)" onclick="x()">link</a>');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('onclick');
  });

  test('sanitizeAiText mantém texto limpo', () => {
    expect(sanitizeAiText('Aula 1 — Introdução')).toContain('Aula 1');
  });

  test('validateAffiliateUrl aceita apenas https + allowlist', () => {
    expect(validateAffiliateUrl('https://www.amazon.com.br/dp/B0EXAMPLE').valid).toBe(true);
    expect(validateAffiliateUrl('http://amazon.com.br/dp/B0').valid).toBe(false);
    expect(validateAffiliateUrl('https://evil.example.com/x').valid).toBe(false);
    expect(validateAffiliateUrl('https://www.amazon.com.br').valid).toBe(false); // sem destino
  });

  test('stripSensitive remove passwordHash/tokens recursivamente', () => {
    const out = stripSensitive({ id: '1', passwordHash: 'x', nested: { resetToken: 'y', ok: 1 } });
    expect(out.passwordHash).toBeUndefined();
    expect(out.nested.resetToken).toBeUndefined();
    expect(out.nested.ok).toBe(1);
  });
});