// Regras de tempo das batalhas, seguras para o navegador (lib/battles puxa Prisma).

export const BATTLE_QUESTIONS = 5;
export const QUESTION_TIME_LIMIT_SECONDS = 15;
// Tolerância total para latência de rede/UI (5s extras por questão).
export const TURN_TIME_LIMIT_SECONDS = BATTLE_QUESTIONS * (QUESTION_TIME_LIMIT_SECONDS + 5);
// Acomodação de acessibilidade (tempo estendido, escolhido no Perfil): o dobro do tempo.
export const EXTENDED_TIME_FACTOR = 2;
