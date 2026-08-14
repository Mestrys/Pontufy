'use client';
import { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';

import VideoPlayer from '@/components/player/VideoPlayer';
import LessonContent from '@/components/player/LessonContent';
import CourseSidebar from '@/components/player/CourseSidebar';
import QuizModal, { type QuizModuleData } from '@/components/player/QuizModal';
import PointsCelebration from '@/components/gamification/PointsCelebration';
import { useCourse, triggerLessonCompletion } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { getCachedCourses } from '@/lib/local-courses';
import { downloadCertificate } from '@/lib/download-certificate';
import { Loader2, BookOpen, ArrowLeft, Award, Trophy, LoaderCircle } from 'lucide-react';

interface LessonItem {
  id: string;
  title: string;
  type: string;
  points: number;
  completed: boolean;
  content: string; // markdown da aula ativa (nunca a descrição do curso)
  contentUrl?: string | null;
}

interface ApiLesson {
  id: string;
  title: string;
  type: string;
  points?: number;
  pointsAssigned?: number;
  completed?: boolean;
  contentUrl?: string | null;
}

interface LocalCourse {
  id: string;
  title: string;
  description: string | null;
  lessons: LessonItem[];
  quiz: QuizModuleData[] | null;
}

export default function CoursePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: apiCourse, isLoading, mutate } = useCourse(id);

  const addPoints = useStore((s) => s.addPoints);
  const deductPoints = useStore((s) => s.deductPoints);

  // Cache offline (localStorage, síncrono) derivado — sem setState em effect.
  const localCourse = useMemo<LocalCourse | null>(() => {
    const cached = getCachedCourses().find((c) => c.id === id);
    if (!cached) return null;
    let quiz: QuizModuleData[] | null = null;
    if (cached.quizJson) {
      try { quiz = JSON.parse(cached.quizJson); } catch {}
    }
    return {
      id: cached.id,
      title: cached.title,
      description: cached.description,
      lessons: cached.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        contentUrl: l.contentUrl,
        content: l.contentUrl ?? '',
        points: l.pointsAssigned,
        completed: false,
      })),
      quiz,
    };
  }, [id]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completedOverrides, setCompletedOverrides] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState('Você acaba de ganhar');
  const [isCompleting, setIsCompleting] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const course = apiCourse && !apiCourse.error ? apiCourse : localCourse;

  if (isLoading && !localCourse) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-emerald-500" size={36} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] gap-4">
        <BookOpen size={48} className="text-gray-700" />
        <p className="text-white text-lg font-bold">Curso não encontrado.</p>
        <Link href="/dashboard" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
          ← Voltar ao Início
        </Link>
      </div>
    );
  }

  const lessons: LessonItem[] = ((course?.lessons ?? []) as ApiLesson[]).map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type,
    points: l.points ?? l.pointsAssigned ?? 0,
    completed: !!l.completed,
    content: l.contentUrl ?? '',
    contentUrl: l.contentUrl,
  }));

  const completedMap = new Set<string>([
    ...lessons.filter((l) => l.completed).map((l) => l.id),
    ...completedOverrides,
  ]);

  const firstIncomplete = lessons.find((l) => !completedMap.has(l.id));
  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? firstIncomplete ?? lessons[0];
  const completedCount = lessons.filter((l) => completedMap.has(l.id)).length;
  const allCompleted = lessons.length > 0 && completedCount === lessons.length;
  const modules: QuizModuleData[] = course.quiz ?? [];
  const passed = quizPassed || !!course.quizPassed;

  if (!activeLesson) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] gap-4">
        <p className="text-white text-lg font-bold">Este curso não possui aulas.</p>
        <Link href="/dashboard" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
          ← Voltar ao Início
        </Link>
      </div>
    );
  }

  const currentIndex = lessons.findIndex((l) => l.id === activeLesson.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const isVideoLesson = activeLesson.type === 'video';

  const celebrate = (points: number, message: string) => {
    setCelebrationPoints(points);
    setCelebrationMessage(message);
    setShowCelebration(true);
  };

  const handleLessonComplete = async () => {
    if (completedMap.has(activeLesson.id) || isCompleting) return;

    setIsCompleting(true);
    // Otimista: reflete os pontos imediatamente no store global (Navbar reativa).
    addPoints(activeLesson.points);
    try {
      const res = await triggerLessonCompletion(activeLesson.id, {
        courseId: course.id,
        courseTitle: course.title,
        courseDescription: course.description,
        lessons: lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          contentUrl: l.contentUrl ?? undefined,
          points: l.points,
        })),
      });

      if (res.success) {
        setCompletedOverrides((prev) => new Set(prev).add(activeLesson.id));
        celebrate(activeLesson.points, 'Você acaba de ganhar');
        mutate();
      } else if (res.queued) {
        // Offline: salvo na fila local; será sincronizado automaticamente.
        setCompletedOverrides((prev) => new Set(prev).add(activeLesson.id));
        celebrate(activeLesson.points, 'Aula salva offline — sincronização automática');
      } else {
        // Rollback do saldo otimista em caso de falha.
        deductPoints(activeLesson.points);
        alert(res.error || 'Erro ao completar a aula.');
      }
    } catch (error) {
      deductPoints(activeLesson.points);
      console.error(error);
      alert('Erro ao concluir a aula.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setIsDownloading(true);
    try {
      await downloadCertificate(course.id, course.title);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao baixar certificado.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleQuizPassed = (result: { score: number; total: number; bonusAwarded: boolean }) => {
    setQuizPassed(true);
    if (result.bonusAwarded) {
      celebrate(50, 'Bônus por aprovação no quiz');
    }
  };

  const lessonNavProps = {
    lessonTitle: activeLesson.title,
    lessonIndex: currentIndex + 1,
    totalLessons: lessons.length,
    points: activeLesson.points,
    completed: completedMap.has(activeLesson.id),
    isCompleting,
    onComplete: handleLessonComplete,
    onPrevious: prevLesson ? () => setActiveLessonId(prevLesson.id) : null,
    onNext: nextLesson ? () => setActiveLessonId(nextLesson.id) : null,
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden">
      <PointsCelebration
        points={celebrationPoints}
        isVisible={showCelebration}
        message={celebrationMessage}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Top bar (Udemy-style) */}
      <div className="h-14 flex-shrink-0 bg-[#141414] border-b border-[#2a2a2a] flex items-center px-4 gap-4 z-40">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Voltar</span>
        </Link>
        <div className="h-5 w-px bg-[#2a2a2a]" />
        <h1 className="text-sm font-bold text-white truncate flex-1">{course.title}</h1>
        <div className="text-xs text-gray-500 hidden sm:block">
          {completedCount}/{lessons.length} aulas
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {isVideoLesson ? (
            <>
              <div className="aspect-video lg:aspect-auto lg:flex-none lg:h-[52%] bg-black flex-shrink-0">
                <VideoPlayer lesson={{ id: activeLesson.id, title: activeLesson.title, videoUrl: activeLesson.contentUrl ?? undefined }} />
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <LessonContent content={activeLesson.content} {...lessonNavProps} />
              </div>
            </>
          ) : (
            <LessonContent content={activeLesson.content} {...lessonNavProps} />
          )}

          {/* CTA do Quiz / Certificado (rodapé do conteúdo) */}
          {allCompleted && (
            <div className="flex-shrink-0 px-6 sm:px-10 py-6 border-t border-[#2a2a2a] bg-[#0f0f0f]">
              {!passed ? (
                <div className="max-w-4xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-400/10 rounded-full flex items-center justify-center">
                      <Trophy size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Quiz final disponível!</p>
                      <p className="text-xs text-gray-500">Nota mínima: 70% · Bônus de +50 pts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuizOpen(true)}
                    className="px-6 py-3 rounded-lg font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                  >
                    Iniciar Quiz Final
                  </button>
                </div>
              ) : (
                <div className="max-w-4xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <Award size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Curso concluído!</p>
                      <p className="text-xs text-gray-500">Seu certificado com código de verificação está pronto.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] border border-[#2a2a2a] disabled:opacity-50 transition-colors"
                  >
                    {isDownloading ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" /> Gerando...
                      </>
                    ) : (
                      <>
                        <Award size={16} /> Emitir Certificado
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar (desktop) */}
        <div className="hidden lg:flex w-[340px] xl:w-[380px] flex-shrink-0 border-l border-[#2a2a2a] flex-col">
          <CourseSidebar
            lessons={lessons.map((l) => ({
              id: l.id,
              title: l.title,
              points: l.points,
              completed: completedMap.has(l.id),
            }))}
            activeLesson={{
              id: activeLesson.id,
              title: activeLesson.title,
              points: activeLesson.points,
              completed: completedMap.has(activeLesson.id),
            }}
            completedCount={completedCount}
            onLessonClick={(lesson) => setActiveLessonId(lesson.id)}
            allCompleted={allCompleted}
            quizPassed={passed}
            onOpenQuiz={() => setQuizOpen(true)}
          />
        </div>
      </div>

      {/* Sidebar (mobile bottom sheet) */}
      <div className="lg:hidden border-t border-[#2a2a2a] bg-[#141414] max-h-[40vh] overflow-hidden">
        <CourseSidebar
          lessons={lessons.map((l) => ({
            id: l.id,
            title: l.title,
            points: l.points,
            completed: completedMap.has(l.id),
          }))}
          activeLesson={{
            id: activeLesson.id,
            title: activeLesson.title,
            points: activeLesson.points,
            completed: completedMap.has(activeLesson.id),
          }}
          completedCount={completedCount}
          onLessonClick={(lesson) => setActiveLessonId(lesson.id)}
          allCompleted={allCompleted}
          quizPassed={passed}
          onOpenQuiz={() => setQuizOpen(true)}
        />
      </div>

      {/* Quiz Modal (remontado a cada abertura → estado sempre limpo) */}
      <AnimatePresence>
        {quizOpen && (
          <QuizModal
            courseId={course.id}
            courseTitle={course.title}
            modules={modules}
            alreadyPassed={passed}
            onClose={() => setQuizOpen(false)}
            onQuizPassed={handleQuizPassed}
            onEmitCertificate={handleDownloadCertificate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}