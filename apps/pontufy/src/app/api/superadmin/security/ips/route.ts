import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listBlockedIps, unblockIp } from '@/lib/security/auth-guard';

// 6.5 — Painel de monitoramento de IPs bloqueados (somente super_admin @pontufy.com).
export async function GET() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== 'super_admin' ||
    !session.user.email?.endsWith('@pontufy.com')
  ) {
    // 403 opaco: sem pistas sobre a existência da rota.
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ips = await listBlockedIps();
  return NextResponse.json({ ips });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== 'super_admin' ||
    !session.user.email?.endsWith('@pontufy.com')
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { ip } = await request.json();
  if (!ip || typeof ip !== 'string') {
    return NextResponse.json({ error: 'IP inválido.' }, { status: 400 });
  }

  await unblockIp(ip);
  return NextResponse.json({ success: true });
}