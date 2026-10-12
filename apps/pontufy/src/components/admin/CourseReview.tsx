'use client';

import { useId, useRef, useState } from 'react';
import Link from 'next/link';
import { mutate } from 'swr';
import {
  AlertTriangle, BookOpen, Check, ChevronDown, ExternalLink, Loader2, Pencil, RefreshCw, Sparkles, X,
} from 'lucide-react';
import LessonMarkdown from '@/components/player/LessonMarkdown';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { setCourseStatus } from '@/actions/course-generator';
import { regenerateLesson, updateCourseInfo, updateLesson } from '@/actions/course-review';
import type { ReviewCourse, ReviewLesson } from '@/actions/course-review';
import { CONTENT_TYPE_LABELS } from '@/lib/course-types';

// Revisão humana de um curso gerado por IA (H1): ler cada aula, corrigir o
// texto ou pedir outra versão de uma aula, e só então publicar.

type Mode = 'closed' | 'read' | 'edit';

function LessonCard({
  courseId,
  index,
  lesson,
  canRegenerate,
  onChange,
  onRead,
  titleAs: TitleTag,
}: {
  titleAs: 'h3' | 'h5';
  courseId: string;
  index: number;
  lesson: ReviewLesson;
  canRegenerate: boolean;
  onChange: (lesson: ReviewLesson) => void;
  onRead: (lessonId: string) => void;
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('closed');
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [regenOpen, setRegenOpen] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState('');
  const regenButtonRef = useRef<HTMLButtonElement>(null);
  const regenTextRef = useRef<HTMLTextAreaElement>(null);
  const ids = { title: useId(), content: useId(), panel: useId(), regenTitle: useId(), regenText: useId() };

  const open = (next: Mode) => {
    setError('');
    if (next === 'edit') {
      setTitle(lesson.title);
      setContent(lesson.content);
    }
    if (next !== 'closed') onRead(lesson.id);
    setMode(next);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await updateLesson({ courseId, lessonId: lesson.id, title, content });
      if (!res.success) {
        setError(res.error);
        return;
      }
      onChange(res.lesson);
      setMode('read');
      toast({ title: 'Aula salva.' });
    } catch {
      setError('Não foi possível salvar agora. Verifique a conexão e tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    setRegenError('');
    try {
      const res = await regenerateLesson({ courseId, lessonId: lesson.id, instructions: instructions.trim() || undefined });
      if (!res.success) {
        setRegenError(res.error);
        return;
      }
      onChange(res.lesson);
      setRegenOpen(false);
      setInstructions('');
      setMode('read');
      onRead(lesson.id);
      toast({ title: 'Nova versão da aula pronta.', description: 'Leia antes de publicar.' });
    } catch {
      setRegenError('Não foi possível falar com a IA agora. Tente de novo em instantes.');
    } finally {
      setRegenerating(false);
    }
  };

  const dirty = title !== lesson.title || content !== lesson.content;

  return (
    <li className="rounded-xl border border-md-outline bg-md-surface-container">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span className="flex size-8 flex-none items-center justify-center rounded-full bg-md-surface-container-high text-sm font-bold text-md-on-surface">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <TitleTag className="font-semibold text-md-on-surface">{lesson.title}</TitleTag>
          <p className="text-xs text-md-on-surface-muted">+{lesson.points} pts</p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => open(mode === 'read' ? 'closed' : 'read')}
            aria-expanded={mode === 'read'}
            aria-controls={ids.panel}
            className="md-btn md-btn-text text-sm"
          >
            <BookOpen size={16} aria-hidden="true" /> {mode === 'read' ? 'Fechar' : 'Ler'}
            <ChevronDown size={16} aria-hidden="true" className={mode === 'read' ? 'rotate-180' : ''} />
          </button>
          <button
            type="button"
            onClick={() => open('edit')}
            disabled={mode === 'edit'}
            className="md-btn md-btn-text text-sm"
          >
            <Pencil size={16} aria-hidden="true" /> Editar
          </button>
          {canRegenerate && (
            <button
              ref={regenButtonRef}
              type="button"
              onClick={() => {
                setRegenError('');
                setRegenOpen(true);
              }}
              className="md-btn md-btn-text text-sm"
            >
              <RefreshCw size={16} aria-hidden="true" /> Gerar de novo
            </button>
          )}
        </div>
      </div>

      {mode === 'read' && (
        <div id={ids.panel} className="border-t border-md-outline bg-md-surface px-4 py-6 sm:px-8">
          {lesson.content ? (
            <LessonMarkdown content={lesson.content} />
          ) : (
            <p className="text-md-on-surface-muted">Esta aula está vazia.</p>
          )}
        </div>
      )}

      {mode === 'edit' && (
        <div id={ids.panel} className="space-y-4 border-t border-md-outline bg-md-surface p-4 sm:p-6">
          <div>
            <label htmlFor={ids.title} className="mb-2 block text-sm font-medium text-md-on-surface-variant">
              Título da aula
            </label>
            <input
              id={ids.title}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              className="w-full rounded-xl border bg-md-surface-container px-4 py-3 text-md-on-surface focus:border-md-focus focus:outline-none"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label htmlFor={ids.content} className="mb-2 block text-sm font-medium text-md-on-surface-variant">
                Texto (Markdown)
              </label>
              <textarea
                id={ids.content}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                aria-describedby={`${ids.content}-hint`}
                className="w-full rounded-xl border bg-md-surface-container px-4 py-3 font-mono text-sm leading-relaxed text-md-on-surface focus:border-md-focus focus:outline-none"
              />
              <p id={`${ids.content}-hint`} className="mt-1 text-xs text-md-on-surface-muted">
                ## subtítulo · **negrito** · - lista · &gt; citação · [link](https://…)
              </p>
            </div>
            <div className="hidden lg:block">
              <p className="mb-2 text-sm font-medium text-md-on-surface-variant">Como o colaborador vê</p>
              <div className="max-h-[30rem] overflow-y-auto rounded-xl border border-md-outline bg-md-surface-dim p-5">
                <LessonMarkdown content={content} />
              </div>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-md-error">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setMode('read')} className="md-btn md-btn-text">
              Cancelar
            </button>
            <button type="button" onClick={save} disabled={saving || !dirty} className="md-btn md-btn-filled">
              {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
              {saving ? 'Salvando…' : 'Salvar aula'}
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        labelledBy={ids.regenTitle}
        dismissible={!regenerating}
        returnFocus={() => regenButtonRef.current}
        initialFocus={regenTextRef}
        className="w-full max-w-lg rounded-2xl border border-md-outline bg-md-surface p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={ids.regenTitle} className="text-lg font-bold text-white">
            Gerar a aula {index + 1} de novo
          </h2>
          <button
            type="button"
            onClick={() => setRegenOpen(false)}
            disabled={regenerating}
            aria-label="Fechar"
            className="-mr-2 -mt-2 flex size-11 items-center justify-center rounded-full text-md-on-surface-variant hover:text-white"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm text-md-on-surface-variant">
          A IA escreve uma nova versão de “{lesson.title}” e substitui o texto atual. Não gasta créditos.
        </p>
        <label htmlFor={ids.regenText} className="mt-4 mb-2 block text-sm font-medium text-md-on-surface-variant">
          O que mudar? (opcional)
        </label>
        <textarea
          ref={regenTextRef}
          id={ids.regenText}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Ex.: use exemplos de call center e cite o artigo 46 da LGPD."
          className="w-full rounded-xl border bg-md-surface-container px-4 py-3 text-sm text-md-on-surface placeholder:text-md-on-surface-muted focus:border-md-focus focus:outline-none"
        />
        {regenError && (
          <p role="alert" className="mt-3 text-sm text-md-error">
            {regenError}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setRegenOpen(false)} disabled={regenerating} className="md-btn md-btn-text">
            Cancelar
          </button>
          <button type="button" onClick={regenerate} disabled={regenerating} className="md-btn md-btn-filled">
            {regenerating ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            {regenerating ? 'Gerando…' : 'Gerar nova versão'}
          </button>
        </div>
      </Dialog>
    </li>
  );
}

function CourseInfo({
  course,
  as: Heading,
  onSaved,
}: {
  course: ReviewCourse;
  as: 'h1' | 'h3';
  onSaved: (title: string, description: string) => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const ids = { title: useId(), description: useId() };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await updateCourseInfo({ courseId: course.id, title, description });
      if (!res.success) {
        setError(res.error);
        return;
      }
      onSaved(res.title, res.description);
      setEditing(false);
      toast({ title: 'Título e descrição salvos.' });
    } catch {
      setError('Não foi possível salvar agora. Verifique a conexão e tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <header className="space-y-2">
        <Heading className={`${Heading === 'h1' ? 'text-headline-md font-extrabold' : 'text-xl font-bold'} text-md-on-surface text-balance`}>
          {course.title}
        </Heading>
        {course.description && <p className="max-w-3xl text-body-md text-md-on-surface-variant">{course.description}</p>}
        <button
          type="button"
          onClick={() => {
            setTitle(course.title);
            setDescription(course.description);
            setEditing(true);
          }}
          className="md-btn md-btn-text -ml-3 text-sm"
        >
          <Pencil size={16} aria-hidden="true" /> Editar título e descrição
        </button>
      </header>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-md-outline bg-md-surface-container p-4 sm:p-6">
      <div>
        <label htmlFor={ids.title} className="mb-2 block text-sm font-medium text-md-on-surface-variant">
          Título do curso
        </label>
        <input
          id={ids.title}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          className="w-full rounded-xl border bg-md-surface px-4 py-3 text-md-on-surface focus:border-md-focus focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor={ids.description} className="mb-2 block text-sm font-medium text-md-on-surface-variant">
          Descrição
        </label>
        <textarea
          id={ids.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full rounded-xl border bg-md-surface px-4 py-3 text-md-on-surface focus:border-md-focus focus:outline-none"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-md-error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => setEditing(false)} className="md-btn md-btn-text">
          Cancelar
        </button>
        <button type="button" onClick={save} disabled={saving} className="md-btn md-btn-filled">
          {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

export default function CourseReview({
  initial,
  headingLevel = 'h3',
}: {
  initial: ReviewCourse;
  /** h1 na página de revisão; h3 dentro do assistente, que já tem o próprio título. */
  headingLevel?: 'h1' | 'h3';
}) {
  const { toast } = useToast();
  const [course, setCourse] = useState(initial);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const isPublished = course.status === 'published';
  const SectionTag = headingLevel === 'h1' ? 'h2' : 'h4';
  const readCount = course.lessons.filter((l) => read.has(l.id)).length;

  const markRead = (id: string) => setRead((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  const replaceLesson = (lesson: ReviewLesson) =>
    setCourse((c) => ({ ...c, lessons: c.lessons.map((l) => (l.id === lesson.id ? lesson : l)) }));

  const toggleStatus = async () => {
    setPublishing(true);
    setPublishError('');
    try {
      const next = isPublished ? 'draft' : 'published';
      const res = await setCourseStatus({ courseId: course.id, status: next });
      if (!res.success) {
        setPublishError(res.error);
        return;
      }
      setCourse((c) => ({ ...c, status: res.status }));
      mutate('/api/courses?limit=50');
      mutate('/api/courses/enrolled');
      toast({
        title: next === 'published' ? 'Curso publicado.' : 'Curso voltou para rascunho.',
        description: next === 'published' ? 'Os colaboradores já podem fazer o curso.' : 'Os colaboradores deixam de ver o curso.',
      });
    } catch {
      setPublishError('Não foi possível alterar o curso agora. Verifique a conexão e tente de novo.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <CourseInfo
        course={course}
        as={headingLevel}
        onSaved={(title, description) => setCourse((c) => ({ ...c, title, description }))}
      />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`rounded-full px-3 py-1 font-semibold ${
            isPublished ? 'bg-md-tertiary-container text-md-on-tertiary-container' : 'bg-md-surface-container-high text-md-on-surface-variant'
          }`}
        >
          {isPublished ? 'Publicado' : 'Rascunho'}
        </span>
        {course.aiGenerated && (
          <span className="inline-flex items-center gap-1 rounded-full bg-md-secondary/15 px-3 py-1 font-medium text-md-secondary">
            <Sparkles size={14} aria-hidden="true" /> Criado com IA
          </span>
        )}
        <span className="rounded-full bg-md-surface-container-high px-3 py-1 text-md-on-surface-variant">
          {CONTENT_TYPE_LABELS[course.contentType]}
        </span>
      </div>

      {course.aiGenerated && !isPublished && (
        <div className="flex items-start gap-3 rounded-xl border border-md-highlight/30 bg-md-highlight/10 p-4 text-md-highlight">
          <AlertTriangle size={20} className="mt-0.5 flex-none" aria-hidden="true" />
          <p className="text-sm">
            <strong>Leia cada aula antes de publicar.</strong> A IA pode errar fatos, nomes de leis, números e prazos. O curso
            só chega aos colaboradores quando você publica, e eles verão o selo “Criado com IA, revisado por” com o seu nome.
          </p>
        </div>
      )}

      <section aria-labelledby="review-lessons">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <SectionTag id="review-lessons" className="text-lg font-bold text-md-on-surface">
            Aulas
          </SectionTag>
          <p className="text-sm text-md-on-surface-muted" aria-live="polite">
            Você abriu {readCount} de {course.lessons.length}
          </p>
        </div>
        <ol className="space-y-3">
          {course.lessons.map((lesson, i) => (
            <LessonCard
              key={lesson.id}
              courseId={course.id}
              index={i}
              lesson={lesson}
              canRegenerate={!isPublished}
              onChange={replaceLesson}
              onRead={markRead}
              titleAs={headingLevel === 'h1' ? 'h3' : 'h5'}
            />
          ))}
        </ol>
      </section>

      {course.quiz.length > 0 && (
        <details className="rounded-xl border border-md-outline bg-md-surface-container">
          <summary className="flex min-h-11 cursor-pointer items-center px-4 font-semibold text-md-on-surface">
            Avaliação final ({course.quiz.length} {course.quiz.length === 1 ? 'pergunta' : 'perguntas'})
          </summary>
          <ol className="space-y-5 border-t border-md-outline p-4 sm:p-6">
            {course.quiz.map((q, qi) => (
              <li key={qi}>
                <p className="font-medium text-md-on-surface">
                  {qi + 1}. {q.question}
                </p>
                <ul className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => (
                    <li
                      key={oi}
                      className={`flex items-start gap-2 text-sm ${oi === q.correctIndex ? 'font-semibold text-md-tertiary' : 'text-md-on-surface-variant'}`}
                    >
                      {oi === q.correctIndex ? <Check size={16} className="mt-0.5 flex-none" aria-hidden="true" /> : <span className="w-4 flex-none" />}
                      <span>
                        {opt}
                        {oi === q.correctIndex && <span className="sr-only"> (resposta correta)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                {q.explanation && <p className="mt-2 text-sm text-md-on-surface-muted">{q.explanation}</p>}
              </li>
            ))}
          </ol>
        </details>
      )}

      {publishError && (
        <p role="alert" className="text-sm text-md-error">
          {publishError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-md-outline pt-5">
        <Link href={`/player/${course.id}`} target="_blank" rel="noopener noreferrer" className="md-btn md-btn-outlined">
          <ExternalLink size={16} aria-hidden="true" /> Ver como colaborador
        </Link>
        <button type="button" onClick={toggleStatus} disabled={publishing} className={`md-btn ${isPublished ? 'md-btn-outlined' : 'md-btn-filled'}`}>
          {publishing && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {isPublished ? 'Voltar para rascunho' : 'Publicar curso'}
        </button>
      </div>
    </div>
  );
}
