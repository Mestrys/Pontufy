// Tabela única de mensagens de erro de API para quem usa o app.
//
// As rotas devolvem mensagens pensadas para log ("lessonId inválido.",
// "Transação já em andamento."). Aqui elas viram texto que diz o que
// aconteceu e o que a pessoa pode fazer. Mensagens de regra de negócio que já
// são escritas para o usuário (409, saldo insuficiente, limite de
// velocidade) passam adiante.

export type ApiAction = 'lesson' | 'quiz' | 'redeem' | 'certificate' | 'generic';

export interface ApiFailure {
  status?: number;
  error?: string;
  /** Pontos que faltam (resgate com saldo insuficiente). */
  missing?: number;
}

const NOTHING_CHANGED: Record<ApiAction, string> = {
  lesson: 'A aula continua pendente.',
  quiz: 'Suas respostas não foram registradas.',
  redeem: 'Seus pontos não foram debitados.',
  certificate: '',
  generic: '',
};

function join(...parts: string[]) {
  return parts.filter(Boolean).join(' ');
}

export function friendlyApiError(failure: ApiFailure, action: ApiAction = 'generic'): string {
  const { status, error = '', missing } = failure;
  const keep = NOTHING_CHANGED[action];

  if (status === undefined || status === 0) {
    return join('Sem conexão com o servidor.', keep, 'Verifique a internet e tente de novo.');
  }
  if (status === 401) return 'Sua sessão expirou. Entre de novo para continuar.';
  if (status === 403) return 'Você não tem permissão para fazer isso.';
  if (status === 404) {
    return action === 'redeem'
      ? join('Este benefício não está mais disponível.', keep)
      : 'Este conteúdo não está mais disponível. Atualize a página.';
  }
  if (status === 409) return error || 'Esta ação não pode ser feita agora.';
  if (status === 429) {
    return join('Ainda estamos processando sua última ação.', keep, 'Aguarde alguns segundos e tente de novo.');
  }
  if (status >= 500) {
    return join('Algo deu errado do nosso lado.', keep, 'Tente de novo em instantes.');
  }
  // 400: só repassa o que é regra de negócio escrita para o usuário.
  if (typeof missing === 'number' && missing > 0) {
    return `Faltam ${missing.toLocaleString('pt-BR')} pontos para este resgate.`;
  }
  if (/^Velocidade bloqueada/.test(error)) {
    return error.replace('Velocidade bloqueada.', 'Você está concluindo aulas rápido demais.');
  }
  return join('Não foi possível concluir esta ação.', keep, 'Atualize a página e tente de novo.');
}
