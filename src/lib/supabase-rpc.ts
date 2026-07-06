/**
 * Chamadas server-side às funções SECURITY DEFINER do Postgres via PostgREST.
 *
 * Modelo de segurança: as tabelas têm RLS deny-all; a única porta de entrada
 * são funções que exigem o APP_SERVER_SECRET (conhecido apenas por este
 * servidor e armazenado em app_config, tabela inacessível via API). A chave
 * anon sozinha não lê nem escreve nada.
 *
 * NUNCA importe este módulo em componentes client.
 */

export class RpcError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const baseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const secret = process.env.APP_SERVER_SECRET;
  if (!baseUrl || !anonKey || !secret) {
    throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY e APP_SERVER_SECRET devem estar no .env');
  }

  const res = await fetch(`${baseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_secret: secret, ...args }),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new RpcError(data?.message ?? `Falha na operação (${fn})`, res.status);
  }
  return data as T;
}

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: 'MASTER_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  mustChangePassword: boolean;
}
