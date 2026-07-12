import { NextResponse } from 'next/server';
import { rpc, RpcError, type DbUser } from '@/lib/supabase-rpc';

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string; inviteCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const name = body.name?.trim() ?? '';
  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password ?? '';
  const inviteCode = body.inviteCode?.trim().toUpperCase() ?? '';

  if (name.length < 3) {
    return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 422 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 422 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'A senha deve ter pelo menos 8 caracteres.' },
      { status: 422 }
    );
  }
  if (!inviteCode) {
    return NextResponse.json({ error: 'O código de acesso é obrigatório.' }, { status: 422 });
  }

  try {
    // Função atômica no Postgres: valida o convite, cria o usuário com o
    // role do convite e marca o código como usado — sem corrida possível.
    const user = await rpc<DbUser>('auth_register', {
      p_name: name,
      p_email: email,
      p_password: password,
      p_code: inviteCode,
    });
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof RpcError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: 'Falha ao criar a conta.' }, { status: 500 });
  }
}
