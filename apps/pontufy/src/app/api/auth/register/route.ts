import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { hashPassword } from '@/lib/crypto';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { token, name, password } = await request.json();

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Token, nome e senha são obrigatórios.' },
        { status: 400 },
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres.' },
        { status: 400 },
      );
    }

    const invitation = await prisma.invitation.findUnique({ where: { token } });

    if (!invitation) {
      return NextResponse.json({ error: 'Convite inválido.' }, { status: 404 });
    }

    if (invitation.status === 'accepted' || invitation.usedAt) {
      return NextResponse.json(
        { error: 'Este convite já foi utilizado.' },
        { status: 410 },
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Este convite expirou. Solicite um novo ao seu gestor.' },
        { status: 410 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este email.' },
        { status: 409 },
      );
    }

    const passwordHash = hashPassword(password);

    // Criação do utilizador + aceitação do convite: transação atómica.
    await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invitation.email,
          name: name.trim(),
          passwordHash,
          role: invitation.role,
          tenantId: invitation.tenantId,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', usedAt: new Date() },
      }),
    ]);

    sendWelcomeEmail(invitation.email, name.trim()).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/auth/register:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar conta.' },
      { status: 500 },
    );
  }
}
