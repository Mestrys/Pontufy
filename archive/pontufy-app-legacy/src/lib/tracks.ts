import { COURSES } from './data';
import type { Course } from './types';

/**
 * Trilhas corporativas: agrupamento derivado dos cursos existentes.
 * Não altera o schema de Course — apenas referencia IDs.
 */
export interface Track {
  id: string;
  title: string;
  description: string;
  audience: string;
  courseIds: string[];
}

export const TRACKS: Track[] = [
  {
    id: 'onboarding-seguro',
    title: 'Onboarding Seguro',
    description:
      'A base obrigatória para todo colaborador: proteção de dados no dia a dia e domínio das ferramentas de produtividade.',
    audience: 'Todos os colaboradores',
    courseIds: ['seguranca-informacao', 'excel-produtividade'],
  },
  {
    id: 'excelencia-comercial',
    title: 'Excelência Comercial',
    description:
      'Do atendimento consultivo à decisão orientada por dados: a jornada completa de quem fala com o cliente.',
    audience: 'Times de vendas e atendimento',
    courseIds: ['atendimento-consultivo', 'lideranca-dados'],
  },
  {
    id: 'lideranca-do-futuro',
    title: 'Liderança do Futuro',
    description:
      'Prepara novos gestores: liderança com dados, cultura de segurança e produtividade de alto nível.',
    audience: 'Gestores e futuros líderes',
    courseIds: ['lideranca-dados', 'seguranca-informacao', 'excel-produtividade'],
  },
];

export function coursesOfTrack(track: Track): Course[] {
  return track.courseIds
    .map((id) => COURSES.find((c) => c.id === id))
    .filter((c): c is Course => Boolean(c));
}
