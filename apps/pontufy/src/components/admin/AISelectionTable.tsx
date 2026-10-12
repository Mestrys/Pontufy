'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Users, FileSearch, Loader2 } from 'lucide-react';
import { setCourseStatus } from '@/actions/course-generator';

interface CourseRow {
  id: string;
  title: string;
  status: 'Publicado' | 'Rascunho' | 'Só neste navegador';
  enrolled: number;
  date: string;
}

export default function AISelectionTable({
  courses,
  onChanged,
}: {
  courses: CourseRow[];
  onChanged?: () => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Publicar = revisão humana concluída; Ocultar = volta a rascunho.
  const toggleStatus = async (course: CourseRow) => {
    setPendingId(course.id);
    setError('');
    try {
      const res = await setCourseStatus({
        courseId: course.id,
        status: course.status === 'Publicado' ? 'draft' : 'published',
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      onChanged?.();
    } catch {
      setError('Não foi possível alterar o curso agora. Tente de novo.');
    } finally {
      setPendingId(null);
    }
  };

  if (courses.length === 0) {
    return (
      <div className="p-8 text-center">
        <Sparkles size={48} className="mx-auto text-md-on-surface-muted mb-4" aria-hidden="true" />
        <p className="text-body-md text-md-on-surface-variant">Nenhum curso gerado ainda</p>
        <p className="text-body-sm text-md-on-surface-muted mt-1">Use o assistente de IA para criar o primeiro curso</p>
        <Link href="/admin/wizard" className="md-btn md-btn-filled mt-4 inline-flex">
          <Sparkles size={18} className="mr-2" />
          Gerar primeiro curso
        </Link>
      </div>
    );
  }

  return (
    <div className="md-card-outlined md-elevation-1 overflow-hidden">
      {error && (
        <p role="alert" className="px-4 sm:px-6 py-3 text-body-sm text-md-error border-b border-md-outline">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-md-surface-container-high/50 text-md-on-surface-variant text-label-sm uppercase tracking-wider border-b border-md-outline">
              <th className="px-4 sm:px-6 py-3 font-semibold">Título do Curso</th>
              <th className="px-3 sm:px-6 py-3 font-semibold text-center">Status</th>
              <th className="px-3 sm:px-6 py-3 font-semibold text-center">Engajamento</th>
              <th className="px-3 sm:px-6 py-3 font-semibold text-right whitespace-nowrap">Data</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-md-outline">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-md-surface-container-high/50 transition-colors">
                <td className="px-4 sm:px-6 py-4 font-medium text-md-on-surface max-w-[300px] truncate">
                  {course.status === 'Só neste navegador' ? (
                    course.title
                  ) : (
                    <Link href={`/admin/courses/${course.id}`} className="hover:text-md-primary-text hover:underline">
                      {course.title}
                    </Link>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-label-sm font-semibold ${
                    course.status === 'Publicado'
                      ? 'bg-md-tertiary-container text-md-on-tertiary-container'
                      : 'bg-md-surface-container-high text-md-on-surface-variant'
                  }`}>
                    {course.status}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 text-center text-md-on-surface-variant font-medium">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Users size={16} className="text-md-on-surface-muted" />
                    {course.enrolled}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 text-right text-md-on-surface-variant text-body-sm whitespace-nowrap">{course.date}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {course.status !== 'Só neste navegador' && (
                      <>
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="size-11 flex items-center justify-center rounded-xl text-md-on-surface-variant hover:bg-md-surface-container-high hover:text-md-primary-text transition-colors"
                          title="Revisar aulas"
                          aria-label={`Revisar ${course.title}`}
                        >
                          <FileSearch size={18} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleStatus(course)}
                          disabled={pendingId === course.id}
                          className={`md-btn text-sm ${course.status === 'Publicado' ? 'md-btn-text' : 'md-btn-filled'}`}
                        >
                          {pendingId === course.id ? (
                            <Loader2 size={16} className="animate-spin" aria-label="Salvando" />
                          ) : course.status === 'Publicado' ? (
                            'Ocultar'
                          ) : (
                            'Publicar'
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}