'use client';

import { useState } from 'react';
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
}

export default function CourseSidebar({
  lessons,
  activeLesson,
  completedCount,
  onLessonClick,
  allCompleted,
  quizPassed,
  onOpenQuiz,
}: CourseSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // Acesso sequencial: a primeira aula incompleta é a "em andamento";
  // todas as seguintes ficam bloqueadas até serem desbloqueadas.
  const firstIncompleteIndex = lessons.findIndex((l) => !l.completed);

  return (
    <div className="w-full h-full bg-[#141414] flex flex-col overflow-hidden">
      {/* Header com colapso */}
      <div className="p-4 border-b border-[#2a2a2a] flex-shrink-0">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between"
          aria-expanded={!collapsed}
        >
          <h2 className="font-bold text-white text-sm">Conteúdo do Curso</h2>
          <ChevronDown
            size={16}
            className={`text-gray-500 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2 mt-3">
          <span>{completedCount}/{lessons.length} aulas</span>
          <span className="text-emerald-400 font-bold">{progress}%</span>
        </div>
        <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Lista de aulas */}
          <div className="flex-1 overflow-y-auto">
            {lessons.map((lesson, index) => {
              const isActive = activeLesson?.id === lesson.id;
              const locked = !lesson.completed && index > firstIncompleteIndex && !isActive;

              return (
                <button
                  key={lesson.id}
                  onClick={() => !locked && onLessonClick(lesson)}
                  disabled={locked}
                  className={`w-full text-left p-4 flex gap-3 transition-colors border-b border-[#1f1f1f] ${
                    isActive
                      ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                      : 'hover:bg-[#1f1f1f] border-l-2 border-l-transparent'
                  } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {lesson.completed ? (
                      <CheckCircle2 size={17} className="text-emerald-500" />
                    ) : locked ? (
                      <Lock size={17} className="text-gray-600" />
                    ) : isActive ? (
                      <PlayCircle size={17} className="text-emerald-400" />
                    ) : (
                      <Circle size={17} className="text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-snug ${
                        isActive ? 'text-white font-bold' : 'text-gray-400 font-medium'
                      } ${lesson.completed ? 'line-through opacity-50' : ''}`}
                    >
                      <span className="text-gray-600 mr-1">{index + 1}.</span>
                      {lesson.title}
                    </p>
                    {!lesson.completed && !locked && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400 font-bold">
                        <Coins size={10} /> +{lesson.points} pts
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Trigger do Quiz Final */}
          <div className="p-4 border-t border-[#2a2a2a] flex-shrink-0">
            <button
              onClick={onOpenQuiz}
              disabled={!allCompleted}
              className={`w-full px-4 py-3 rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2 ${
                quizPassed
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                  : allCompleted
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-[#1f1f1f] text-gray-600 cursor-not-allowed border border-[#2a2a2a]'
              }`}
            >
              {quizPassed ? (
                <>
                  <ClipboardCheck size={16} /> Quiz Final Aprovado
                </>
              ) : (
                <>
                  <Trophy size={16} />
                  {allCompleted ? 'Fazer Quiz Final' : 'Quiz Final (+50 pts)'}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}