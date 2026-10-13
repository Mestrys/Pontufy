'use client';
import { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';

import VideoPlayer from '@/components/player/VideoPlayer';
import LessonContent from '@/components/player/LessonContent';
import CourseSidebar from '@/components/player/CourseSidebar';
import QuizModal, { type QuizModuleData } from '@/components/player/QuizModal';
import PointsCelebration from '@/components/gamification/PointsCelebration';
import CelebrationModal from '@/components/gamification/CelebrationModal';
import { useCourse, triggerLessonCompletion } from '@/hooks/useApi';
import { friendlyApiError } from '@/lib/api-errors';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/store/useStore';
import { getCachedCourses } from '@/lib/local-courses';
import { downloadCertificate } from '@/lib/download-certificate';
import { getUserTier, TIERS } from '@/lib/levels';
import { BookOpen, ArrowLeft, Award, Trophy, Crown, Medal, LoaderCircle } from 'lucide-react';
import { LoadingRegion, PlayerSkeleton } from '@/components/ui/Skeleton';

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
  // Erro de conclusão mostrado junto ao botão "Concluir"; some ao trocar de aula.
  const [completionError, setCompletionError] = useState<{ lessonId: string; message: string } | null>(null);
  const { toast } = useToast();
  const [quizOpen, setQuizOpen] = useState(false);
  const [certificateError, setCertificateError] = useState('');
  const [quizPassed, setQuizPassed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Level-up celebration state
  const [showLevelUp, setShowLevelUp] = useState(false);
  type LevelUpData = {
    previousTier: string;
    newTier: { name: string; color: string; icon: typeof Trophy | typeof Crown | typeof Medal; maxPoints?: number };
    points: number;
  };
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  // Subida de nível espera a celebração de pontos terminar: nunca dois
  // overlays ao mesmo tempo.
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelUpData | null>(null);

  const course = apiCourse && !apiCourse.error ? apiCourse : localCourse;

  if (isLoading && !localCourse) {
    return (
      <LoadingRegion label="Carregando a aula…">
        <PlayerSkeleton />
      </LoadingRegion>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-md-surface-dim gap-4">
        <BookOpen size={48} className="text-md-on-surface-muted" />
        <p className="text-md-on-surface-strong text-lg font-bold">Curso não encontrado.</p>
        <Link href="/dashboard" className="text-md-primary-text font-bold hover:text-md-secondary transition-colors">
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
  // Rascunho de IA aberto pelo RH: pré-visualização sem pontos nem quiz.
  const isPreview = (course as { status?: string }).status === 'draft';
  const passed = quizPassed || !!course.quizPassed;

  if (!activeLesson) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-md-surface-dim gap-4">
        <p className="text-md-on-surface-strong text-lg font-bold">Este curso não possui aulas.</p>
        <Link href="/dashboard" className="text-md-primary-text font-bold hover:text-md-secondary transition-colors">
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

  // Verifica subida de nível. Chamado só DEPOIS que o servidor confirmou a
  // conclusão (ou a enfileirou offline): nunca celebrar uma ação que falhou.
  const checkLevelUp = (previousPoints: number, newPoints: number) => {
    const previousTier = getUserTier(previousPoints);
    const newTier = getUserTier(newPoints);

    if (previousTier.name !== newTier.name) {
      const TierIcon = previousTier.name === 'Mestre' ? Trophy :
        previousTier.name === 'Especialista' ? Crown : Trophy;
      const nextTier = TIERS.find((t) => t.minPoints > newPoints);
      setPendingLevelUp({
        previousTier: previousTier.name,
        newTier: {
          name: newTier.name,
          color: newTier.name === 'Mestre' ? 'text-purple-400' :
            newTier.name === 'Especialista' ? 'text-amber-400' :
            newTier.name === 'Analista Sênior' ? 'text-blue-400' :
            newTier.name === 'Analista' ? 'text-md-tertiary' : 'text-md-on-surface-variant',
          icon: TierIcon,
          maxPoints: nextTier?.minPoints,
        },
        points: newPoints,
      });
    }
  };

  const handlePointsCelebrationComplete = () => {
    setShowCelebration(false);
    if (pendingLevelUp) {
      setLevelUpData(pendingLevelUp);
      setPendingLevelUp(null);
      setShowLevelUp(true);
    }
  };

  const handleLessonComplete = async () => {
    if (completedMap.has(activeLesson.id) || isCompleting) return;

    const previousPoints = useStore.getState().currentPointsBalance;
    const lessonPoints = activeLesson.points;
    setIsCompleting(true);
    setCompletionError(null);
    // Otimista: reflete os pontos imediatamente no store global (Navbar reativa).
    // A celebração e a subida de nível só acontecem após a confirmação.
    addPoints(lessonPoints);
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

      if (res.success || res.queued) {
        setCompletedOverrides((prev) => new Set(prev).add(activeLesson.id));
        checkLevelUp(previousPoints, previousPoints + lessonPoints);
        celebrate(
          lessonPoints,
          res.success ? 'Você acaba de ganhar' : 'Aula salva offline — sincronização automática',
        );
        if (res.success) mutate();
        // "Concluir e avançar": segue para a próxima aula após confirmar.
        if (nextLesson) setActiveLessonId(nextLesson.id);
      } else {
        // Rollback do saldo otimista em caso de falha.
        deductPoints(activeLesson.points);
        setCompletionError({ lessonId: activeLesson.id, message: friendlyApiError(res, 'lesson') });
      }
    } catch (error) {
      deductPoints(activeLesson.points);
      console.error(error);
      setCompletionError({ lessonId: activeLesson.id, message: friendlyApiError({}, 'lesson') });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setIsDownloading(true);
    setCertificateError('');
    try {
      await downloadCertificate(course.id, course.title);
    } catch (err) {
      console.error(err);
      // Dentro do quiz (modal) o aviso vai junto do botão: um toast fora do
      // diálogo não é anunciado nem alcançável pelo teclado.
      if (quizOpen) {
        setCertificateError('Não foi possível baixar o certificado. Tente de novo em instantes.');
        return;
      }
      toast({
        tone: 'error',
        title: 'Não foi possível baixar o certificado.',
        description: 'Tente de novo em instantes. Se continuar, o certificado também fica em Certificados.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleQuizPassed = (result: { score: number; total: number; bonusAwarded: boolean }) => {
    setQuizPassed(true);
    if (result.bonusAwarded) {
      const previousPoints = useStore.getState().currentPointsBalance;
      addPoints(50);
      const newPoints = useStore.getState().currentPointsBalance;
      checkLevelUp(previousPoints, newPoints);
      celebrate(50, 'Bônus por aprovação no quiz');
    }
  };

  const aiMeta = course as { aiGenerated?: boolean; reviewedBy?: string | null };
  const aiNotice = aiMeta.aiGenerated
    ? aiMeta.reviewedBy
      ? `Criado com IA, revisado por ${aiMeta.reviewedBy}`
      : 'Criado com IA'
    : '';

  const lessonNavProps = {
    aiNotice,
    lessonTitle: activeLesson.title,
    lessonIndex: currentIndex + 1,
    totalLessons: lessons.length,
    points: activeLesson.points,
    completed: completedMap.has(activeLesson.id),
    isCompleting,
    onComplete: handleLessonComplete,
    onPrevious: prevLesson ? () => setActiveLessonId(prevLesson.id) : null,
    onNext: nextLesson ? () => setActiveLessonId(nextLesson.id) : null,
    preview: isPreview,
    completionError: completionError?.lessonId === activeLesson.id ? completionError.message : '',
  };

  return (
    <div className="flex flex-col h-dvh bg-md-surface-dim overflow-hidden">
      <PointsCelebration
        points={celebrationPoints}
        isVisible={showCelebration}
        message={celebrationMessage}
        onComplete={handlePointsCelebrationComplete}
      />
      <CelebrationModal
        isVisible={showLevelUp}
        onComplete={() => { setShowLevelUp(false); setLevelUpData(null); }}
        type="levelUp"
        title="Você subiu de nível!"
        points={levelUpData?.points}
        subtitle={`Parabéns! Você alcançou o nível ${levelUpData?.newTier?.name}.`}
        newTier={levelUpData ? {
          name: levelUpData.newTier.name,
          color: levelUpData.newTier.color,
          icon: levelUpData.newTier.icon,
          maxPoints: levelUpData.newTier.maxPoints,
        } : undefined}
        previousTier={levelUpData?.previousTier}
        // Depois do "Concluir e avançar" a aula trocou: o foco volta para a
        // ação principal da aula nova (ou para o texto dela).
        returnFocus={() =>
          document.querySelector<HTMLElement>('[data-lesson-primary]:not([disabled])') ??
          document.querySelector<HTMLElement>('[aria-label="Conteúdo da aula"]')
        }
      />

      {/* Top bar (Udemy-style) */}
      <div className="h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] flex-shrink-0 bg-md-surface border-b border-md-outline flex items-center px-4 gap-4 z-40">
        <Link
          href="/dashboard"
          className="-ml-2 h-11 min-w-11 px-2 flex items-center justify-center gap-2 rounded-lg text-md-on-surface-variant hover:text-md-on-surface-strong transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {/* sr-only no celular mantém o nome acessível do link. */}
          <span className="sr-only sm:not-sr-only">Voltar ao início</span>
        </Link>
        <div className="h-5 w-px bg-md-outline" />
        <h1 className="text-sm font-bold text-md-on-surface-strong truncate flex-1">{course.title}</h1>
        <div className="text-xs text-md-on-surface-muted hidden sm:block">
          {completedCount}/{lessons.length} aulas
        </div>
      </div>

      {isPreview && (
        <p
          role="note"
          className="flex-shrink-0 px-4 sm:px-10 py-2.5 text-body-sm bg-md-highlight/10 text-md-highlight border-b border-md-highlight/30"
        >
          Pré-visualização de rascunho: os colaboradores ainda não veem este curso. Publique pelo painel de RH quando o conteúdo estiver correto.
        </p>
      )}

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
                <LessonContent key={activeLesson.id} content={activeLesson.content} {...lessonNavProps} />
              </div>
            </>
          ) : (
            <LessonContent key={activeLesson.id} content={activeLesson.content} {...lessonNavProps} />
          )}

          {/* CTA do Quiz / Certificado (rodapé do conteúdo) */}
          {allCompleted && !isPreview && (
            <div className="flex-shrink-0 px-6 sm:px-10 py-6 border-t border-md-outline bg-md-surface-dim">
              {!passed ? (
                <div className="max-w-4xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-md-tertiary/10 rounded-full flex items-center justify-center">
                      <Trophy size={18} className="text-md-tertiary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-md-on-surface-strong">Avaliação final disponível</p>
                      <p className="text-xs text-md-on-surface-muted">Nota mínima: 70% · Bônus de +50 pts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuizOpen(true)}
                    className="px-6 py-3 rounded-lg font-bold text-sm bg-md-primary text-md-on-primary hover:bg-md-primary-container transition-colors"
                  >
                    Fazer a avaliação final
                  </button>
                </div>
              ) : (
                <div className="max-w-4xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-md-tertiary/10 rounded-full flex items-center justify-center">
                      <Award size={18} className="text-md-tertiary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-md-on-surface-strong">Curso concluído!</p>
                      <p className="text-xs text-md-on-surface-muted">Seu certificado com código de verificação está pronto.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm bg-md-surface-container text-md-on-surface-strong hover:bg-md-surface-container-high border border-md-outline disabled:opacity-50 transition-colors"
                  >
                    {isDownloading ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" /> Gerando...
                      </>
                    ) : (
                      <>
                        <Award size={16} /> Emitir certificado
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar (desktop) */}
        <div className="hidden lg:flex w-[340px] xl:w-[380px] flex-shrink-0 border-l border-md-outline flex-col">
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
            preview={isPreview}
          />
        </div>
      </div>

      {/* Sidebar (mobile bottom sheet) */}
      {/* No celular o sumário começa recolhido: a aula fica com a maior parte
          da tela e a lista abre sob demanda. */}
      <div className="lg:hidden border-t border-md-outline bg-md-surface max-h-[45dvh] flex flex-col min-h-0 pb-[env(safe-area-inset-bottom)]">
        <CourseSidebar
          defaultCollapsed
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
          preview={isPreview}
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
            onClose={() => {
              setQuizOpen(false);
              setCertificateError('');
            }}
            onQuizPassed={handleQuizPassed}
            onEmitCertificate={handleDownloadCertificate}
            emittingCertificate={isDownloading}
            certificateError={certificateError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}