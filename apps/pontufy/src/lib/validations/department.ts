import { sanitizeAiText } from '@/lib/validations/security';

// TAREFA 13.2 — Departamento é a chave de agrupamento do ranking
// interdepartamental (Redis + groupBy no Postgres). Normalizar SEMPRE pelo
// mesmo caminho evita "Vendas" e " vendas  " virarem departamentos distintos
// e impede que string vazia vire um departamento fantasma no ranking.

export const DEPARTMENT_MIN_LENGTH = 2;
export const DEPARTMENT_MAX_LENGTH = 60;

export type DepartmentParseResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

/**
 * Valida e normaliza o departamento vindo do cliente.
 * `null`, `undefined` ou string vazia => `null` (sem departamento).
 */
export function parseDepartment(input: unknown): DepartmentParseResult {
  if (input === null || input === undefined) return { ok: true, value: null };
  if (typeof input !== 'string') {
    return { ok: false, error: 'Departamento inválido.' };
  }

  const normalized = sanitizeAiText(input).replace(/\s+/g, ' ').trim();
  if (normalized === '') return { ok: true, value: null };

  if (normalized.length < DEPARTMENT_MIN_LENGTH || normalized.length > DEPARTMENT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Departamento deve ter entre ${DEPARTMENT_MIN_LENGTH} e ${DEPARTMENT_MAX_LENGTH} caracteres.`,
    };
  }

  return { ok: true, value: normalized };
}
