import { notFound } from 'next/navigation';
import { COURSES } from '@/lib/data';
import CoursePlayer from '@/components/player/CoursePlayer';

export function generateStaticParams() {
  return COURSES.map((course) => ({ courseId: course.id }));
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) notFound();

  return <CoursePlayer course={course} />;
}
