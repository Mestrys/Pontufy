import { NextResponse } from 'next/server';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { sanitizeAiText, stripSensitive } from '@/lib/validations/security';
import { logAudit, extractRequestMeta } from '@/lib/audit';

const scryptAsync = promisify(scrypt);

export async function PATCH(request: Request) {
  try {
    const { userId, tenantId } = await getSessionContext();
    const db = getTenantDb(tenantId);
    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    const data: Record<string, string> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres.' }, { status: 400 });
      }
      // 8.2 — Nome renderizado na UI: strip de markup antes de persistir.
      data.name = sanitizeAiText(name.trim()).slice(0, 120);
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Senha atual é obrigatória para alterar a senha.' }, { status: 400 });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ error: 'Nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
      }

      const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
      if (!user?.passwordHash) {
        return NextResponse.json({ error: 'Conta sem senha configurada.' }, { status: 400 });
      }

      const [salt, hash] = user.passwordHash.split(':');
      const derived = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
      const { timingSafeEqual } = await import('crypto');
      if (!timingSafeEqual(derived, Buffer.from(hash, 'hex'))) {
        return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 403 });
      }

      const newSalt = randomBytes(16).toString('hex');
      const newBuf = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
      data.passwordHash = `${newSalt}:${newBuf.toString('hex')}`;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data,
      select: { name: true, email: true, role: true },
    });

    // 8.4 — Interceptor de serialização: nunca vazar campos sensíveis no JSON.
    // 9.1 — Auditoria de mutações no próprio perfil (senha = evento sensível).
    const meta = extractRequestMeta(request);
    await logAudit({
      tenantId,
      userId,
      action: data.passwordHash ? 'PASSWORD_CHANGED' : 'PROFILE_UPDATED',
      entity: 'User',
      entityId: userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValue: data.passwordHash ? { field: 'passwordHash' } : { name: body.name },
      newValue: data.passwordHash
        ? { field: 'passwordHash', rotated: true }
        : { name: data.name },
    });

    return NextResponse.json({ success: true, user: stripSensitive(updated as Record<string, unknown>) });
  } catch (error: any) {
    if (error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('PATCH /api/users/profile:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
