export const CONTENT_TYPES = [
  'text',
  'video',
  'podcast',
  'slides',
  'quiz_interativo',
  'escrita_expressa',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text: 'Texto / Artigo',
  video: 'Roteiro de Vídeo',
  podcast: 'Roteiro de Podcast',
  slides: 'Apresentação de Slides',
  quiz_interativo: 'Quiz Interativo',
  escrita_expressa: 'Escrita Expressa',
};
