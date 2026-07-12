import type { Difficulty, KnowledgeSource, SourceKind } from './types';

export interface DifficultyOption {
  id: Difficulty;
  label: string;
  description: string;
  minPoints: number;
  maxPoints: number;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'beginner',
    label: 'Iniciante',
    description: 'Fundamentos e primeiros passos, sem pré-requisitos.',
    minPoints: 10,
    maxPoints: 100,
  },
  {
    id: 'intermediate',
    label: 'Intermediário',
    description: 'Aprofunda conceitos e exige prática aplicada.',
    minPoints: 101,
    maxPoints: 300,
  },
  {
    id: 'advanced',
    label: 'Avançado',
    description: 'Cenários complexos, decisões e trade-offs reais.',
    minPoints: 301,
    maxPoints: 600,
  },
  {
    id: 'super',
    label: 'Super Avançado',
    description: 'Nível especialista: domínio completo do tema.',
    minPoints: 601,
    maxPoints: 1000,
  },
];

export function getDifficultyOption(id: Difficulty): DifficultyOption {
  return DIFFICULTY_OPTIONS.find((o) => o.id === id)!;
}

/**
 * Pontuação máxima potencial: parte do piso da faixa e cresce com o volume
 * de fontes de conhecimento, sempre limitada ao teto da faixa (10–1000).
 */
export function calculateMaxPoints(difficulty: Difficulty, sourceCount: number): number {
  const { minPoints, maxPoints } = getDifficultyOption(difficulty);
  if (sourceCount <= 0) return minPoints;
  const step = (maxPoints - minPoints) / 5;
  return Math.min(maxPoints, Math.round(minPoints + sourceCount * step));
}

/** Classifica uma URL colada em gdoc / gslides / youtube / url genérica. */
export function classifyUrl(rawUrl: string): SourceKind | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;

  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'youtube';
  if (host === 'docs.google.com') {
    if (url.pathname.startsWith('/presentation')) return 'gslides';
    return 'gdoc';
  }
  return 'url';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.txt', '.md'];

export function isAcceptedFile(file: File): boolean {
  return ACCEPTED_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

export function createSource(partial: Omit<KnowledgeSource, 'id'>): KnowledgeSource {
  return { id: crypto.randomUUID(), ...partial };
}
