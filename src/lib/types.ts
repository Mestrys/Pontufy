export interface Lesson {
  id: string;
  title: string;
  durationMin: number;
  points: number;
  content: string[];
}

export interface Course {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  mandatory: boolean;
  aiGenerated: boolean;
  gradient: string;
  lessons: Lesson[];
}

export interface Reward {
  id: string;
  title: string;
  partner: string;
  description: string;
  requiredPoints: number;
  gradient: string;
  affiliateUrl: string;
}

export type SourceKind = 'file' | 'gdoc' | 'gslides' | 'url' | 'youtube' | 'text';

export interface KnowledgeSource {
  id: string;
  kind: SourceKind;
  label: string;
  /** URL para fontes web/cloud, trecho inicial para texto direto */
  detail?: string;
  /** Tamanho em bytes, apenas para kind === 'file' */
  sizeBytes?: number;
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'super';

export interface GeneratedLesson {
  title: string;
  durationMin: number;
  points: number;
}

export interface GeneratedCourse {
  title: string;
  difficulty: Difficulty;
  maxPoints: number;
  lessons: GeneratedLesson[];
}

export interface Redemption {
  rewardId: string;
  code: string;
  affiliateUrl: string;
  redeemedAt: string;
}
