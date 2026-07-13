import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canAccessStudio } from '@/lib/roles';
import { calculateMaxPoints, DIFFICULTY_OPTIONS } from '@/lib/studio';
import {
  AiUnavailableError,
  buildCoursePrompt,
  normalizeCourse,
  streamCompletion,
} from '@/lib/ai';
import type { Difficulty, KnowledgeSource } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Geração real por IA com streaming NDJSON para o cliente:
 *   {"type":"token","text":"..."}   — progresso em tempo real
 *   {"type":"course","course":{..}} — resultado final validado no servidor
 *   {"type":"error","error":"..."}  — falha após o início do stream
 */
export async function POST(request: Request) {
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

  // Recalculado no servidor — o valor do cliente é apenas exibição
  const maxPoints = calculateMaxPoints(difficulty, sources.length);
  const prompt = buildCoursePrompt(sources, difficulty, maxPoints);

  let tokens: ReadableStream<string>;
  try {
    tokens = await streamCompletion(prompt);
  } catch (err) {
    // Motor fora do ar antes de começar: 503 permite fallback limpo no cliente
    const message =
      err instanceof AiUnavailableError
        ? err.message
        : 'Motor de IA indisponível no momento.';
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const reader = tokens.getReader();
  let raw = '';

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (!done && value) {
        raw += value;
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'token', text: value }) + '\n'));
        return;
      }
      const course = normalizeCourse(raw, difficulty, maxPoints);
      const final = course
        ? { type: 'course', course, generatedAt: new Date().toISOString() }
        : { type: 'error', error: 'A IA não retornou um curso válido. Tente novamente.' };
      controller.enqueue(encoder.encode(JSON.stringify(final) + '\n'));
      controller.close();
    },
    cancel(reason) {
      void reader.cancel(reason);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
