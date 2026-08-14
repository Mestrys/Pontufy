import { expect, type APIRequestContext } from '@playwright/test';
import { SEED_PASSWORD } from './db';

// Autenticação NextAuth v5 (Credentials) direto no contexto `request` da
// fixture — isolado por teste — sem precisar de newContext (a partir do
// Playwright 1.61 a fixture `request` É um APIRequestContext).
//
//   1. GET  /api/auth/csrf            → { csrfToken } (+ cookie de csrf)
//   2. POST /api/auth/callback/credentials (form: csrfToken, email, password)
// Resultado: cookie httpOnly `authjs.session-token` no contexto.
//
// Múltiplos usuários no mesmo teste: chame loginAs sequencialmente — cada
// login substitui a sessão anterior no contexto.

export async function loginAs(
  request: APIRequestContext,
  email: string,
  password: string = SEED_PASSWORD,
): Promise<void> {
  const csrfRes = await request.get('/api/auth/csrf');
  expect(csrfRes.status(), 'GET /api/auth/csrf deve responder 200').toBe(200);
  const { csrfToken } = await csrfRes.json();
  expect(typeof csrfToken, 'csrfToken ausente na resposta').toBe('string');

  const res = await request.post('/api/auth/callback/credentials', {
    form: { csrfToken, email, password, callbackUrl: '/dashboard' },
  });
  expect(
    [200, 302].includes(res.status()),
    `Login via API falhou para ${email} (status ${res.status()})`,
  ).toBe(true);
}