import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════
// Esquema rígido de conteúdo (anti-alucinação & qualidade mínima)
// ═══════════════════════════════════════════════════════════════════════
// Regras:
//  - Lesson.content: Markdown completo, mínimo de 200 caracteres úteis.
//  - Lesson.pointsAwarded: inteiro positivo entre 10 e 100.
//  - Quiz: question (string), options (3 a 5 strings), correctIndex (0-based).

export const quizSchema = z.object({
  question: z.string().min(10, 'A pergunta deve ter no mínimo 10 caracteres'),
  options: z.array(z.string().min(1)).min(3, 'Mínimo de 3 opções').max(5, 'Máximo de 5 opções'),
  correctIndex: z.number().int().min(0).max(4),
  explanation: z.string().optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(5, 'Título da aula muito curto'),
  content: z
    .string()
    .min(200, 'O conteúdo Markdown da aula deve ter pelo menos 200 caracteres'),
  pointsAwarded: z.number().int().min(10).max(100).default(20),
  order: z.number().int().min(1),
});

export const generatedCourseSchema = z.object({
  title: z.string().min(5, 'Título do curso obrigatório'),
  description: z.string().min(20, 'Descrição detalhada obrigatória'),
  category: z.string().default('Geral'),
  estimatedDurationMinutes: z.number().int().min(5).default(30),
  lessons: z.array(lessonSchema).min(3, 'O curso deve conter pelo menos 3 aulas'),
  quiz: z.array(quizSchema).min(2, 'O curso deve conter pelo menos 2 perguntas de fixação'),
});

export type GeneratedCourse = z.infer<typeof generatedCourseSchema>;
export type GeneratedLesson = z.infer<typeof lessonSchema>;
export type GeneratedQuiz = z.infer<typeof quizSchema>;
