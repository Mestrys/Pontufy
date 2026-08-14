import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';

// Public endpoint: validates an invitation token before the register page
// submits the form. The token is a global secret (uuid), looked up directly
// on the global client — same trust boundary as POST /api/auth/register.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token de convite ausente.' }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: { select: { name: true } } },
    });

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

    return NextResponse.json({
      success: true,
      email: invitation.email,
      role: invitation.role,
      companyName: invitation.tenant.name,
      expiresAt: invitation.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('GET /api/invitations/accept:', error);
    return NextResponse.json({ error: 'Erro interno ao validar convite.' }, { status: 500 });
  }
}
