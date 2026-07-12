import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findLesson } from '@/lib/data';

export async function POST(request: Request) {
  // Premiar pontos exige identidade: quando a persistência entrar, o crédito
  // vai para session.user.id — nunca para um caller anônimo.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let body: { courseId?: string; lessonId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const { courseId, lessonId } = body;
  if (!courseId || !lessonId) {
    return NextResponse.json(
      { error: 'courseId e lessonId são obrigatórios.' },
      { status: 400 }
    );
  }

  const match = findLesson(courseId, lessonId);
  if (!match) {
    return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
  }

  // Persistência real (banco + sessão do usuário) entra aqui quando o backend
  // for provisionado; por ora a rota valida contra o catálogo e premia.
  return NextResponse.json({
    lessonId,
    courseId,
    pointsAwarded: match.lesson.points,
    completedAt: new Date().toISOString(),
  });
}
