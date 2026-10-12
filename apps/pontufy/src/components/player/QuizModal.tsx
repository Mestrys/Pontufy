'use client';

import { useId, useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Award,
  Loader2,
  ClipboardCheck,
  Coins,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { playFeedbackSound, haptic } from '@/lib/feedback';
import { friendlyApiError } from '@/lib/api-errors';
import { Dialog } from '@/components/ui/Dialog';
import { AlertDialog } from '@/components/ui/AlertDialog';

export interface QuizQuestion {
  question: string;
  options: { text: string }[];
  correctIndex: number;
}

export interface QuizModuleData {
  module: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
  bonusAwarded: boolean;
}

interface QuizModalProps {
  courseId: string;
  courseTitle: string;
  modules: QuizModuleData[];
  alreadyPassed: boolean;
  onClose: () => void;
  onQuizPassed?: (result: QuizResult) => void;
  onEmitCertificate?: () => void;
}

interface FlatQuestion extends QuizQuestion {
  module: string;
}

export default function QuizModal({
  courseId,
  courseTitle,
  modules,
  alreadyPassed,
  onClose,
  onQuizPassed,
  onEmitCertificate,
}: QuizModalProps) {
  const setPointsBalance = useStore((s) => s.setPointsBalance);

  const questions: FlatQuestion[] = modules.flatMap((m) =>
    (m.questions ?? []).map((q) => ({ ...q, module: m.module })),
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const titleId = useId();
  const [result, setResult] = useState<QuizResult | null>(
    alreadyPassed ? { score: 0, total: 0, passed: true, bonusAwarded: false } : null,
  );

  const q = questions[currentIdx];
  const isLast = currentIdx >= questions.length - 1;
  const answeredCount = answers.filter((a) => a !== null).length;

  const reset = () => {
    setCurrentIdx(0);
    setSelected(null);
    setConfirmed(false);
    setAnswers(questions.map(() => null));
    setResult(null);
    setSubmitting(false);
    setSubmitError('');
  };

  // Fechar no meio do quiz descarta as respostas: pede confirmação antes.
  const requestClose = () => {
    if (submitting) return;
    if (!result && answeredCount > 0) {
      setConfirmLeave(true);
      return;
    }
    onClose();
  };

  const handleConfirm = () => {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    const isCorrect = selected === questions[currentIdx].correctIndex;
    playFeedbackSound(isCorrect ? 'quiz-correct' : 'quiz-wrong');
    haptic(isCorrect ? 25 : [15, 40, 15]);
    setAnswers((prev) => prev.map((a, i) => (i === currentIdx ? selected : a)));
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/courses/${courseId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answers.map((a) => a ?? -1) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(friendlyApiError({ status: res.status, error: data.error }, 'quiz'));
        return;
      }
      const r: QuizResult = {
        score: data.score,
        total: data.total,
        passed: data.passed,
        bonusAwarded: data.bonusAwarded,
      };
      setResult(r);
      if (data.newBalance !== undefined) setPointsBalance(data.newBalance);
      if (r.passed) {
        onQuizPassed?.(r);
        playFeedbackSound('points');
        haptic([40, 60, 40]);
      }
    } catch {
      setSubmitError(friendlyApiError({}, 'quiz'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open
        onClose={requestClose}
        dismissible={!submitting}
        labelledBy={titleId}
        zIndexClassName="z-[90]"
        backdropClassName="bg-black/70 backdrop-blur-sm"
        className="w-full max-w-2xl max-h-[85dvh] overflow-y-auto bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={requestClose}
          disabled={submitting}
          className="absolute top-2 right-2 size-11 flex items-center justify-center rounded-lg text-md-on-surface-muted hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Fechar quiz"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {result ? (
          result.passed ? (
            /* ── Tela de sucesso ─────────────────────────────── */
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-md-tertiary/10 flex items-center justify-center mb-5">
                <Trophy size={32} className="text-md-tertiary" />
              </div>
              <h2 id={titleId} className="text-2xl font-black text-white mb-1">
                {alreadyPassed ? 'Quiz Já Aprovado' : 'Quiz Aprovado!'}
              </h2>
              <p className="text-gray-400 text-sm mb-2">{courseTitle}</p>

              {alreadyPassed ? (
                <p className="text-sm text-gray-400 mb-6">
                  Você já havia aprovado o quiz final deste curso.
                </p>
              ) : (
                <>
                  <p className="text-5xl font-black text-md-tertiary mb-1">
                    {result.score}/{result.total}
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    {Math.round((result.score / Math.max(1, result.total)) * 100)}% de acertos — nota mínima: 70%
                  </p>
                </>
              )}

              {result.bonusAwarded && (
                <div className="inline-flex items-center gap-2 bg-md-tertiary/10 border border-md-tertiary/40 rounded-full px-4 py-2 mb-6">
                  <Coins size={15} className="text-md-tertiary" />
                  <span className="text-sm font-bold text-md-tertiary">+50 pontos de bônus adicionados ao seu saldo</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                {onEmitCertificate && (
                  <button
                    onClick={onEmitCertificate}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm bg-md-primary text-md-on-primary hover:bg-md-primary-container transition-colors"
                  >
                    <Award size={16} /> Emitir Certificado
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg font-bold text-sm bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            /* ── Tela de reprovação ──────────────────────────── */
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                <XCircle size={32} className="text-red-400" />
              </div>
              <h2 id={titleId} className="text-2xl font-black text-white mb-1">Não foi dessa vez</h2>
              <p className="text-gray-400 text-sm mb-4">{courseTitle}</p>
              <p className="text-5xl font-black text-red-400 mb-1">
                {result.score}/{result.total}
              </p>
              <p className="text-sm text-gray-400 mb-2">
                {Math.round((result.score / Math.max(1, result.total)) * 100)}% de acertos
              </p>
              <p className="text-sm text-md-on-surface-muted mb-6 leading-relaxed max-w-md mx-auto">
                A nota mínima para aprovação é <span className="text-white font-bold">70%</span>. Revise o conteúdo
                das aulas e tente novamente — você consegue!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm bg-md-primary text-md-on-primary hover:bg-md-primary-container transition-colors"
                >
                  <RotateCcw size={16} /> Tentar Novamente
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg font-bold text-sm bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-colors"
                >
                  Voltar ao Curso
                </button>
              </div>
            </div>
          )
        ) : (
          /* ── Questões ──────────────────────────────────────── */
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-md-tertiary" />
                <h2 id={titleId} className="text-base font-bold text-white">Quiz de Avaliação</h2>
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-2 py-0.5">
                  +50 pts
                </span>
              </div>
              <span className="text-xs text-md-on-surface-muted font-medium">
                {currentIdx + 1}/{questions.length}
              </span>
            </div>

            <div className="h-0.5 bg-[#2a2a2a] rounded-full mb-5 mt-3">
              <div
                className="h-full bg-md-tertiary rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }}
              />
            </div>

            <p className="text-xs font-bold uppercase tracking-wide text-md-on-surface-muted mb-2">{q.module}</p>
            <p className="text-white font-semibold text-sm mb-5 leading-relaxed">{q.question}</p>

            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                let cls = 'border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a] hover:text-white';
                if (confirmed) {
                  if (idx === q.correctIndex) cls = 'border-md-tertiary bg-md-tertiary/10 text-md-tertiary';
                  else if (idx === selected) cls = 'border-red-500 bg-red-500/10 text-red-400';
                } else if (idx === selected) {
                  cls = 'border-md-tertiary bg-md-tertiary/10 text-white';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !confirmed && !submitting && setSelected(idx)}
                    disabled={confirmed || submitting}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all bg-[#0f0f0f] ${cls} ${
                      confirmed ? 'cursor-default' : 'cursor-pointer'
                    } flex items-center gap-3`}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-black">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {confirmed && idx === q.correctIndex && (
                      <CheckCircle2 size={16} className="text-md-tertiary flex-shrink-0" />
                    )}
                    {confirmed && idx === selected && idx !== q.correctIndex && (
                      <XCircle size={16} className="text-red-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {submitError && (
              <p role="alert" className="mt-5 text-sm text-md-error bg-md-error/10 border border-md-error/30 rounded-xl px-4 py-3">
                {submitError}
              </p>
            )}

            <div className="mt-6 flex justify-end">
              {!confirmed ? (
                <button
                  onClick={handleConfirm}
                  disabled={selected === null || submitting}
                  className="px-6 py-2.5 rounded-full font-bold text-sm bg-md-primary text-md-on-primary hover:bg-md-primary-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Confirmar
                </button>
              ) : isLast ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Enviando...
                    </>
                  ) : (
                    'Enviar Quiz'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm bg-white text-black hover:bg-gray-200 transition-colors"
                >
                  Próxima →
                </button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      <AlertDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        // Fecha a confirmação antes do quiz, para o foco voltar ao botão que abriu o quiz.
        onConfirm={() => setTimeout(onClose, 0)}
        title="Sair do quiz?"
        description={`Você respondeu ${answeredCount} de ${questions.length} perguntas. Ao sair, as respostas são descartadas e o quiz recomeça do início.`}
        confirmLabel="Sair e descartar"
        cancelLabel="Continuar o quiz"
        destructive
      />
    </>
  );
}