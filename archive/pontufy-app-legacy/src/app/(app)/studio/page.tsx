'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Wand2, Clock, Coins, RotateCcw, AlertTriangle } from 'lucide-react';
import type { Difficulty, GeneratedCourse, KnowledgeSource } from '@/lib/types';
import KnowledgeBase from '@/components/studio/KnowledgeBase';
import DifficultySelector from '@/components/studio/DifficultySelector';
import PointsCalculator from '@/components/studio/PointsCalculator';
import GenerationProgress, { GENERATION_STEPS } from '@/components/studio/GenerationProgress';

/**
 * Consome o stream NDJSON de /api/generate-course.
 * Retorna o curso gerado, ou null se o motor de IA estiver indisponível
 * (aí o chamador cai no gerador determinístico).
 */
async function generateWithAi(
  sources: KnowledgeSource[],
  difficulty: Difficulty,
  onProgress: (step: number) => void
): Promise<GeneratedCourse | null> {
  let res: Response;
  try {
    res = await fetch('/api/generate-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources, difficulty }),
    });
  } catch {
    return null;
  }
  if (res.status === 503) return null; // motor fora do ar → fallback
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Falha ao gerar o curso.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let tokenCount = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      let event: { type: string; text?: string; course?: GeneratedCourse; error?: string };
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }
      if (event.type === 'token') {
        // Avança o stepper conforme os tokens reais chegam do modelo
        tokenCount += 1;
        onProgress(Math.min(GENERATION_STEPS.length - 1, Math.floor(tokenCount / 25)));
      } else if (event.type === 'course' && event.course) {
        onProgress(GENERATION_STEPS.length - 1);
        return event.course;
      } else if (event.type === 'error') {
        throw new Error(event.error ?? 'Falha ao gerar o curso.');
      }
    }
  }
  throw new Error('A geração foi interrompida. Tente novamente.');
}

export default function StudioPage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [course, setCourse] = useState<GeneratedCourse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Objetos File reais ficam fora do estado React (não são serializáveis);
  // seguirão via FormData/upload pré-assinado quando o backend real existir.
  const filesRef = useRef<Map<string, File>>(new Map());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, []);

  const handleAddSource = (source: KnowledgeSource, file?: File) => {
    if (file) filesRef.current.set(source.id, file);
    setSources((prev) => [...prev, source]);
    setCourse(null);
  };

  const handleRemoveSource = (id: string) => {
    filesRef.current.delete(id);
    setSources((prev) => prev.filter((s) => s.id !== id));
    setCourse(null);
  };

  const canGenerate = sources.length > 0 && difficulty !== null && !generating;

  const handleGenerate = async () => {
    if (!canGenerate || !difficulty) return;
    setError(null);
    setCourse(null);
    setGenerating(true);
    setGenerationStep(0);

    // Contador externo: StrictMode-safe (sem efeitos dentro de updaters)
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      if (step < GENERATION_STEPS.length) {
        setGenerationStep(step);
      } else {
        window.clearInterval(interval);
        intervalRef.current = null;
      }
    }, 900);
    intervalRef.current = interval;

    try {
      // 1ª tentativa: geração real por IA (Ollama local / Groq) com streaming
      const generated = await generateWithAi(sources, difficulty, setGenerationStep);
      if (generated) {
        setCourse(generated);
      } else {
        // Fallback: gerador determinístico — o Studio nunca fica fora do ar
        const [res] = await Promise.all([
          fetch('/api/courses/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sources, difficulty }),
          }),
          // Garante que o stepper completa a narrativa antes do resultado
          new Promise((resolve) => window.setTimeout(resolve, GENERATION_STEPS.length * 900)),
        ]);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? 'Falha ao gerar o curso.');
        setCourse(data.course);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar o curso.');
    } finally {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setGenerating(false);
      setGenerationStep(0);
    }
  };

  const missingHint = !difficulty
    ? sources.length === 0
      ? 'Adicione pelo menos uma fonte e escolha a dificuldade para gerar.'
      : 'Escolha o nível de dificuldade para gerar.'
    : sources.length === 0
      ? 'Adicione pelo menos uma fonte de conhecimento para gerar.'
      : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-mint">
          <Sparkles className="h-3.5 w-3.5" />
          Studio do Gestor
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          Gerador de Cursos por IA
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-faint">
          Alimente a IA com o conhecimento da sua empresa e configure a recompensa. O curso
          completo — ementa, aulas e pontos — é gerado automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <KnowledgeBase
            sources={sources}
            onAdd={handleAddSource}
            onRemove={handleRemoveSource}
          />
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </div>

        <div className="space-y-6">
          <PointsCalculator difficulty={difficulty} sourceCount={sources.length} />

          {generating ? (
            <GenerationProgress currentStep={generationStep} />
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                data-testid="generate-course"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mint px-6 py-4 text-sm font-semibold text-black transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-faint"
              >
                <Wand2 className="h-4 w-4" />
                Gerar Curso
              </button>
              {missingHint && <p className="text-center text-xs text-ink-dim">{missingHint}</p>}
              {error && (
                <p className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          )}

          {course && (
            <div
              data-testid="generated-course"
              className="animate-celebration space-y-4 rounded-2xl border border-mint/30 bg-surface-1 p-6"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-mint">
                  Curso gerado
                </p>
                <h2 className="mt-1 text-base font-semibold leading-snug text-ink">
                  {course.title}
                </h2>
              </div>

              <ul className="space-y-2">
                {course.lessons.map((lesson) => (
                  <li
                    key={lesson.title}
                    className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-surface-0 px-4 py-3"
                  >
                    <span className="min-w-0 truncate text-sm text-ink-soft">{lesson.title}</span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-ink-faint">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {lesson.durationMin} min
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-mint">
                        <Coins className="h-3 w-3" />
                        {lesson.points}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-edge pt-4">
                <span className="text-sm text-ink-muted">Recompensa total</span>
                <span className="text-sm font-bold text-mint">{course.maxPoints} pts</span>
              </div>

              <button
                type="button"
                onClick={() => setCourse(null)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-edge px-4 py-2.5 text-xs font-medium text-ink-muted transition-colors hover:border-ink-dim hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Descartar e gerar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
