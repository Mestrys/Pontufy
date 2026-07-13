/**
 * DADOS ESTRITAMENTE MOCK — apenas para o layout da seção
 * 'Conquistas e Diplomas'. Geração real de certificados (PDF/asset)
 * ainda não está implementada.
 */
export interface MockCertificate {
  id: string;
  title: string;
  kind: 'Curso' | 'Trilha';
  completedAt: string;
  hours: number;
}

export const MOCK_CERTIFICATES: MockCertificate[] = [
  {
    id: 'cert-seg-trabalho',
    title: 'Curso de Segurança do Trabalho',
    kind: 'Curso',
    completedAt: 'Concluído em 12/2025',
    hours: 8,
  },
  {
    id: 'cert-ia-aplicada',
    title: 'Trilha de IA Aplicada',
    kind: 'Trilha',
    completedAt: 'Concluída em 02/2026',
    hours: 24,
  },
  {
    id: 'cert-atendimento',
    title: 'Curso de Atendimento ao Cliente',
    kind: 'Curso',
    completedAt: 'Concluído em 04/2026',
    hours: 6,
  },
];
