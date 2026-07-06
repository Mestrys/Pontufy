import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canAccessStudio } from '@/lib/roles';
import { calculateMaxPoints, DIFFICULTY_OPTIONS, getDifficultyOption } from '@/lib/studio';
import type { Difficulty, GeneratedCourse, KnowledgeSource } from '@/lib/types';

const LESSON_TEMPLATES = [
  'Fundamentos e contexto',
  'Conceitos-chave na prática',
  'Estudo de caso aplicado',
  'Erros comuns e como evitá-los',
  'Exercício guiado',
  'Avaliação final',
];

export async function POST(request: Request) {
  // Mesmo portão do gerador por IA: gerar curso é capacidade de Studio,
  // vetada a colaboradores comuns. Sem isso, esta rota-fallback seria um
  // desvio silencioso do gate imposto em /api/generate-course.
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  if (!canAccessStudio(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão para gerar cursos.' }, { status: 403 });
  }

  let body: { sources?: KnowledgeSource[]; difficulty?: Difficulty };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const { sources, difficulty } = body;
  if (!Array.isArray(sources) || sources.length === 0) {
    return NextResponse.json(
      { error: 'Adicione pelo menos uma fonte de conhecimento.' },
      { status: 422 }
    );
  }
  if (!difficulty || !DIFFICULTY_OPTIONS.some((o) => o.id === difficulty)) {
    return NextResponse.json({ error: 'Nível de dificuldade inválido.' }, { status: 422 });
  }

  // Recalculado no servidor — o valor do cliente é apenas exibição.
  const maxPoints = calculateMaxPoints(difficulty, sources.length);
  const option = getDifficultyOption(difficulty);

  // Geração real (LLM lendo as fontes) entra aqui; por ora a rota estrutura
  // um curso determinístico a partir dos metadados recebidos.
  const primarySource = sources.find((s) => s.kind === 'text') ?? sources[0];
  const topic = primarySource.label.replace(/\.(pdf|txt|md)$/i, '').replace(/…$/, '');

  const lessonCount = Math.min(LESSON_TEMPLATES.length, 3 + Math.min(sources.length, 3));
  const basePoints = Math.floor(maxPoints / lessonCount);
  const remainder = maxPoints - basePoints * lessonCount;

  const course: GeneratedCourse = {
    title: `${topic} — Trilha ${option.label}`,
    difficulty,
    maxPoints,
    lessons: LESSON_TEMPLATES.slice(0, lessonCount).map((template, index) => ({
      title: `${index + 1}. ${template}`,
      durationMin: 6 + index * 2,
      // A última aula absorve o resto para o total fechar exato em maxPoints
      points: index === lessonCount - 1 ? basePoints + remainder : basePoints,
    })),
  };

  return NextResponse.json({ course, generatedAt: new Date().toISOString() });
}
