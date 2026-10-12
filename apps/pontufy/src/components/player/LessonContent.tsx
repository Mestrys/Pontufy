'use client';

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, BookOpen } from 'lucide-react';
import LessonMarkdown from './LessonMarkdown';

// Renderiza EXCLUSIVAMENTE o markdown da aula ativa (prop `content`) — nunca a
// descrição global do curso. Aula de vídeo usa VideoPlayer + este mesmo
// conteúdo abaixo; aulas de texto usam apenas este componente.

interface LessonContentProps {
  content: string;
  lessonTitle: string;
  lessonIndex: number; // 1-based
  totalLessons: number;
  points: number;
  completed: boolean;
  isCompleting: boolean;
  onComplete: () => void;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  /** Pré-visualização de rascunho (RH): só navega, não conclui nem pontua. */
  preview?: boolean;
  /** Motivo da última falha ao concluir, exibido junto ao botão. */
  completionError?: string;
}

export default function LessonContent({
  content,
  lessonTitle,
  lessonIndex,
  totalLessons,
  points,
  completed,
  isCompleting,
  onComplete,
  onPrevious,
  onNext,
  preview = false,
  completionError = '',
}: LessonContentProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Região rolável focável: permite rolar a aula pelo teclado. */}
      <div className="flex-1 overflow-y-auto" tabIndex={0} role="region" aria-label="Conteúdo da aula">
        {/* Cabeçalho da aula */}
        <div className="bg-md-surface border-b border-md-outline px-6 sm:px-10 py-6">
          <div className="flex items-center gap-2 text-md-on-surface-muted text-xs mb-2">
            <BookOpen size={13} />
            <span>Aula {lessonIndex} de {totalLessons}</span>
          </div>
          <h2 className="max-w-[34ch] text-2xl sm:text-3xl font-black text-white text-balance">{lessonTitle}</h2>
        </div>

        {/* Conteúdo markdown DA AULA ATIVA */}
        <div className="px-5 sm:px-10 py-8">
          {content ? (
            <LessonMarkdown content={content} />
          ) : (
            <div className="text-center py-16">
              <BookOpen size={40} className="mx-auto text-md-on-surface-muted mb-4" />
              <p className="text-md-on-surface-muted">Conteúdo desta aula em breve.</p>
            </div>
          )}
        </div>
      </div>

      {/* Barra de ações inferior: uma única ação primária por estado.
          - aula pendente → "Concluir e avançar" (ou "Concluir aula" na última)
          - aula concluída → "Próxima aula" (ou status "Aula concluída" na última)
          O acesso é sequencial (o sumário bloqueia as aulas seguintes), então
          não há botão para pular a aula sem concluí-la. */}
      <div className="flex-shrink-0 px-4 sm:px-10 py-3 sm:py-4 bg-md-surface border-t border-md-outline">
        {completionError && (
          <p role="alert" className="mb-3 max-w-4xl text-sm text-md-error">
            {completionError}
          </p>
        )}
        <div className="flex items-center gap-2 sm:gap-3 max-w-4xl">
          <button
            type="button"
            onClick={() => onPrevious?.()}
            disabled={!onPrevious}
            aria-label="Aula anterior"
            className="h-11 min-w-11 px-3 sm:px-4 rounded-lg font-bold transition-colors text-sm flex items-center justify-center gap-2 border border-md-outline text-gray-300 hover:border-md-outline-variant hover:text-white disabled:text-md-on-surface/40 disabled:cursor-not-allowed disabled:hover:border-md-outline"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {preview ? (
            onNext ? (
              <button
                type="button"
                data-lesson-primary
                onClick={() => onNext()}
                className="flex-1 h-11 px-4 rounded-lg font-bold transition-colors text-sm flex items-center justify-center gap-2 bg-md-primary text-md-on-primary hover:bg-md-primary-container"
              >
                Próxima aula <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <p className="flex-1 h-11 px-4 rounded-lg font-bold text-sm flex items-center justify-center bg-md-surface-container text-md-on-surface-variant border border-md-outline">
                Fim da pré-visualização
              </p>
            )
          ) : !completed ? (
            <button
              type="button"
              data-lesson-primary
              onClick={onComplete}
              disabled={isCompleting}
              className="flex-1 h-11 px-4 rounded-lg font-bold transition-colors text-sm flex items-center justify-center gap-2 bg-md-primary text-md-on-primary hover:bg-md-primary-container disabled:opacity-70 disabled:cursor-wait"
            >
              {isCompleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Concluindo…
                </>
              ) : (
                <>
                  {onNext ? 'Concluir e avançar' : 'Concluir aula'}
                  <span className="font-semibold opacity-90">(+{points} pts)</span>
                  {onNext && <ArrowRight size={16} aria-hidden="true" />}
                </>
              )}
            </button>
          ) : onNext ? (
            <button
              type="button"
              data-lesson-primary
              onClick={() => onNext()}
              className="flex-1 h-11 px-4 rounded-lg font-bold transition-colors text-sm flex items-center justify-center gap-2 bg-md-primary text-md-on-primary hover:bg-md-primary-container"
            >
              Próxima aula <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <p
              role="status"
              className="flex-1 h-11 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 bg-md-surface-container text-md-tertiary border border-md-outline"
            >
              <CheckCircle2 size={16} aria-hidden="true" /> Aula concluída
            </p>
          )}
        </div>
      </div>
    </div>
  );
}