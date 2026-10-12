'use client';

import { type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, BookOpen } from 'lucide-react';

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
}

function formatInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let currentParagraph: string[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let key = 0;

  const flush = () => {
    if (currentList) {
      const items = currentList.items;
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={key++} className="list-disc ml-5 space-y-1.5 mb-5 text-gray-300">
            {items.map((item, i) => (
              <li key={i} className="leading-relaxed">{formatInline(item)}</li>
            ))}
          </ul>,
        );
      } else {
        elements.push(
          <ol key={key++} className="list-decimal ml-5 space-y-1.5 mb-5 text-gray-300">
            {items.map((item, i) => (
              <li key={i} className="leading-relaxed">{formatInline(item)}</li>
            ))}
          </ol>,
        );
      }
      currentList = null;
    }
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ');
      if (text.trim()) {
        elements.push(
          <p key={key++} className="mb-5 leading-relaxed text-gray-300">
            {formatInline(text)}
          </p>,
        );
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      flush();
      elements.push(
        <h2 key={key++} className="text-xl font-bold text-white mt-8 mb-3 first:mt-0 border-b border-md-outline pb-2">
          {formatInline(trimmed.slice(3))}
        </h2>,
      );
    } else if (trimmed.startsWith('### ')) {
      flush();
      elements.push(
        <h3 key={key++} className="text-base font-bold text-white mt-6 mb-2">
          {formatInline(trimmed.slice(4))}
        </h3>,
      );
    } else if (/^[-*]\s/.test(trimmed)) {
      if (currentParagraph.length > 0) flush();
      if (!currentList || currentList.type !== 'ul') {
        if (currentList) flush();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(trimmed.replace(/^[-*]\s/, ''));
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (currentParagraph.length > 0) flush();
      if (!currentList || currentList.type !== 'ol') {
        if (currentList) flush();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(trimmed.replace(/^\d+\.\s/, ''));
    } else if (trimmed === '') {
      flush();
    } else {
      if (currentList) flush();
      currentParagraph.push(trimmed);
    }
  }
  flush();

  return <div className="lesson-content text-sm sm:text-base leading-relaxed">{elements}</div>;
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
          <h2 className="text-xl sm:text-2xl font-black text-white">{lessonTitle}</h2>
        </div>

        {/* Conteúdo markdown DA AULA ATIVA */}
        <div className="px-6 sm:px-10 py-8 max-w-4xl">
          {content ? (
            <MarkdownContent content={content} />
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