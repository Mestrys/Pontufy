import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rpc, RpcError } from '@/lib/supabase-rpc';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? '';
  const newPassword = body.newPassword ?? '';
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'A nova senha deve ter pelo menos 8 caracteres.' },
      { status: 422 }
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: 'A nova senha deve ser diferente da atual.' },
      { status: 422 }
    );
  }

  try {
    await rpc('auth_change_password', {
      p_user_id: session.user.id,
      p_current_password: currentPassword,
      p_new_password: newPassword,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RpcError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: 'Falha ao alterar a senha.' }, { status: 500 });
  }
}
