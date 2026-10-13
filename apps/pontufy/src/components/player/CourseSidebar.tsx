'use client';

import { useId, useState } from 'react';
import {
  CheckCircle2,
  PlayCircle,
  Circle,
  Coins,
  Lock,
  ChevronDown,
  Trophy,
  ClipboardCheck,
} from 'lucide-react';

interface LessonItem {
  id: string;
  title: string;
  points: number;
  completed: boolean;
}

interface CourseSidebarProps {
  lessons: LessonItem[];
  activeLesson: LessonItem | null;
  completedCount: number;
  onLessonClick: (lesson: LessonItem) => void;
  allCompleted: boolean;
  quizPassed: boolean;
  onOpenQuiz: () => void;
  /** Começa recolhido (usado no celular para priorizar a aula). */
  defaultCollapsed?: boolean;
  /** Pré-visualização de rascunho: todas as aulas abertas, sem quiz. */
  preview?: boolean;
}

export default function CourseSidebar({
  lessons,
  activeLesson,
  completedCount,
  onLessonClick,
  allCompleted,
  quizPassed,
  onOpenQuiz,
  defaultCollapsed = false,
  preview = false,
}: CourseSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const listId = useId();
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // Acesso sequencial: a primeira aula incompleta é a "em andamento";
  // todas as seguintes ficam bloqueadas até serem desbloqueadas.
  const firstIncompleteIndex = lessons.findIndex((l) => !l.completed);

  return (
    <div className="w-full h-full min-h-0 bg-md-surface flex flex-col overflow-hidden">
      {/* Header com colapso */}
      <div className="p-4 border-b border-md-outline flex-shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="w-full min-h-11 -my-2 flex items-center justify-between"
          aria-expanded={!collapsed}
          aria-controls={listId}
        >
          <h2 className="font-bold text-md-on-surface-strong text-sm">Conteúdo do curso</h2>
          <ChevronDown
            size={16}
            className={`text-md-on-surface-muted transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
        <div className="flex items-center justify-between text-xs text-md-on-surface-muted mb-2 mt-3">
          <span>{completedCount}/{lessons.length} aulas</span>
          <span className="text-md-tertiary font-bold">{progress}%</span>
        </div>
        <div className="h-1 bg-md-outline rounded-full overflow-hidden">
          <div
            className="h-full bg-md-tertiary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Lista de aulas */}
          <div id={listId} className="flex-1 min-h-0 overflow-y-auto">
            {lessons.map((lesson, index) => {
              const isActive = activeLesson?.id === lesson.id;
              const locked = !preview && !lesson.completed && index > firstIncompleteIndex && !isActive;

              return (
                <button
                  key={lesson.id}
                  onClick={() => !locked && onLessonClick(lesson)}
                  disabled={locked}
                  className={`w-full text-left p-4 flex gap-3 transition-colors border-b border-md-outline ${
                    isActive
                      ? 'bg-md-primary/15 border-l-2 border-l-md-primary'
                      : 'hover:bg-md-surface-container border-l-2 border-l-transparent'
                  } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {lesson.completed ? (
                      <CheckCircle2 size={17} className="text-md-tertiary" />
                    ) : locked ? (
                      <Lock size={17} className="text-md-on-surface-muted" />
                    ) : isActive ? (
                      <PlayCircle size={17} className="text-md-secondary" />
                    ) : (
                      <Circle size={17} className="text-md-on-surface-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-snug ${
                        isActive ? 'text-md-on-surface-strong font-bold' : lesson.completed ? 'text-md-on-surface-muted font-medium' : 'text-md-on-surface-variant font-medium'
                      }`}
                    >
                      <span className={`mr-1 ${isActive ? 'text-md-on-surface' : 'text-md-on-surface-muted'}`}>{index + 1}.</span>
                      {lesson.title}
                    </p>
                    {!lesson.completed && !locked && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-md-tertiary font-bold">
                        <Coins size={10} /> +{lesson.points} pts
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Trigger do Quiz Final */}
          <div className="p-4 border-t border-md-outline flex-shrink-0">
            <button
              onClick={onOpenQuiz}
              disabled={!allCompleted}
              className={`w-full px-4 py-3 rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2 ${
                quizPassed
                  ? 'bg-md-tertiary/10 text-md-tertiary border border-md-tertiary/40'
                  : allCompleted
                    ? 'bg-md-primary text-md-on-primary hover:bg-md-primary-container'
                    : 'bg-md-surface-container text-md-on-surface-muted cursor-not-allowed border border-md-outline'
              }`}
            >
              {quizPassed ? (
                <>
                  <ClipboardCheck size={16} /> Quiz Final Aprovado
                </>
              ) : (
                <>
                  <Trophy size={16} />
                  {allCompleted ? 'Fazer a avaliação final' : 'Avaliação final (+50 pts)'}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}