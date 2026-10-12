import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCourseForReview } from '@/actions/course-review';
import CourseReview from '@/components/admin/CourseReview';

// Revisão de um curso (rascunho ou publicado): ler, editar, gerar uma aula de
// novo e publicar. O acesso a /admin já exige admin_rh no proxy; a action
// confere de novo e escopa pelo tenant da sessão.
export default async function AdminCourseReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getCourseForReview(id);

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-md-on-surface-variant hover:text-md-primary-text">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar ao painel
      </Link>
      {res.success ? (
        <CourseReview initial={res.course} headingLevel="h1" />
      ) : (
        <div role="alert" className="rounded-xl border border-md-error/30 bg-md-error/10 p-4 text-md-error">
          {res.error}
        </div>
      )}
    </div>
  );
}
