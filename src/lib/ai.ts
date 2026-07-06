import type { Difficulty, GeneratedCourse, KnowledgeSource } from './types';
import { getDifficultyOption } from './studio';

/**
 * Motor de IA plugável:
 *  - dev:  Ollama local (AI_PROVIDER=ollama) — zero custo, sem API key
 *  - prod: Groq (AI_PROVIDER=groq) — Llama 3 hospedado, free tier, roda na Vercel
 */
export type AiProvider = 'ollama' | 'groq';

export function resolveProvider(): AiProvider {
  const p = process.env.AI_PROVIDER;
  if (p === 'ollama' || p === 'groq') return p;
  // Sem config explícita: usa Groq se houver key, senão Ollama local
  return process.env.GROQ_API_KEY ? 'groq' : 'ollama';
}

const OLLAMA_URL = () => process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL ?? 'llama3';
const GROQ_MODEL = () => process.env.GROQ_MODEL ?? 'llama3-70b-8192';

export function buildCoursePrompt(
  sources: KnowledgeSource[],
  difficulty: Difficulty,
  maxPoints: number
): string {
  const option = getDifficultyOption(difficulty);
  const sourceBlock = sources
    .map((s, i) => {
      const body =
        s.kind === 'text' && s.detail
          ? `Conteúdo:\n${s.detail.slice(0, 4000)}`
          : `Referência (${s.kind}): ${s.detail ?? s.label}`;
      return `--- Fonte ${i + 1}: ${s.label} ---\n${body}`;
    })
    .join('\n\n');

  return [
    'Você é um designer instrucional. Crie um curso corporativo em português do Brasil a partir das fontes abaixo.',
    '',
    sourceBlock,
    '',
    `Nível: ${option.label}. Pontuação total do curso: exatamente ${maxPoints} pontos, distribuídos entre as aulas.`,
    'Responda APENAS com JSON válido, sem markdown, neste formato:',
    '{"title": "...", "lessons": [{"title": "1. ...", "durationMin": 8, "points": 20}]}',
    'Gere de 4 a 6 aulas, títulos numerados, durationMin entre 5 e 20.',
  ].join('\n');
}

/**
 * Chama o provedor com streaming e devolve um stream de tokens de texto
 * já normalizado (independente do formato NDJSON/SSE de cada provedor).
 */
export async function streamCompletion(prompt: string): Promise<ReadableStream<string>> {
  const provider = resolveProvider();
  const upstream =
    provider === 'groq' ? await groqStream(prompt) : await ollamaStream(prompt);
  return upstream;
}

async function ollamaStream(prompt: string): Promise<ReadableStream<string>> {
  const res = await fetch(`${OLLAMA_URL()}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL(),
      prompt,
      stream: true,
      format: 'json', // força saída JSON válida
      options: { temperature: 0.4 },
    }),
  });
  if (!res.ok || !res.body) {
    throw new AiUnavailableError(`Ollama indisponível (${res.status})`);
  }
  // NDJSON: uma linha {"response":"...","done":false} por chunk
  return parseLines(res.body, (line) => {
    const data = JSON.parse(line) as { response?: string };
    return data.response ?? '';
  });
}

async function groqStream(prompt: string): Promise<ReadableStream<string>> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    throw new AiUnavailableError(`Groq indisponível (${res.status})`);
  }
  // SSE: linhas "data: {...}" terminando em "data: [DONE]"
  return parseLines(res.body, (line) => {
    if (!line.startsWith('data: ')) return '';
    const payload = line.slice(6);
    if (payload === '[DONE]') return '';
    const data = JSON.parse(payload) as {
      choices?: { delta?: { content?: string } }[];
    };
    return data.choices?.[0]?.delta?.content ?? '';
  });
}

export class AiUnavailableError extends Error {}

/** Converte um body em stream de tokens, aplicando um parser por linha. */
function parseLines(
  body: ReadableStream<Uint8Array>,
  parseLine: (line: string) => string
): ReadableStream<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  const reader = body.getReader();

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const token = parseLine(trimmed);
          if (token) controller.enqueue(token);
        } catch {
          // linha parcial/keep-alive: ignora
        }
      }
    },
    cancel(reason) {
      void reader.cancel(reason);
    },
  });
}

/**
 * Normaliza o JSON bruto do modelo em um GeneratedCourse confiável:
 * valida a estrutura e redistribui os pontos para fechar exato em maxPoints
 * (o modelo sugere a proporção; o servidor garante o teto da gamificação).
 */
export function normalizeCourse(
  raw: string,
  difficulty: Difficulty,
  maxPoints: number
): GeneratedCourse | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  let parsed: { title?: unknown; lessons?: unknown };
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof parsed.title !== 'string' || !Array.isArray(parsed.lessons)) return null;

  const lessons = parsed.lessons
    .filter(
      (l): l is { title: string; durationMin?: number; points?: number } =>
        typeof l === 'object' && l !== null && typeof (l as { title?: unknown }).title === 'string'
    )
    .slice(0, 8);
  if (lessons.length === 0) return null;

  const weights = lessons.map((l) =>
    typeof l.points === 'number' && l.points > 0 ? l.points : 1
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const points = weights.map((w) => Math.max(1, Math.floor((w / totalWeight) * maxPoints)));
  // A última aula absorve a diferença para o total fechar exato
  const diff = maxPoints - points.reduce((a, b) => a + b, 0);
  points[points.length - 1] += diff;

  return {
    title: parsed.title,
    difficulty,
    maxPoints,
    lessons: lessons.map((l, i) => ({
      title: l.title,
      durationMin:
        typeof l.durationMin === 'number' && l.durationMin >= 1
          ? Math.min(60, Math.round(l.durationMin))
          : 8,
      points: points[i],
    })),
  };
}
