// Ordem das aulas de um curso. As aulas do gerador de IA nascem na mesma
// transação; antes elas ficavam com o mesmo createdAt e a ordem vinha
// indefinida (editar uma aula a jogava para o fim). Hoje o gerador espaça os
// createdAt em 1 ms por aula; o id desempata cursos antigos de forma estável.
export const LESSON_ORDER = [{ createdAt: 'asc' as const }, { id: 'asc' as const }];
