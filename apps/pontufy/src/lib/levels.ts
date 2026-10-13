// Níveis de progressão: fonte única, segura para o navegador (sem Prisma nem
// Redis). Servidor (lib/gamification) e telas (carteira, player, celebração)
// leem daqui. A base é o saldo de pontos.

export interface Tier {
  name: string;
  minPoints: number;
  emoji: string;
}

export const TIERS: Tier[] = [
  { name: 'Aprendiz', minPoints: 0, emoji: '🌱' },
  { name: 'Analista', minPoints: 150, emoji: '📘' },
  { name: 'Analista Sênior', minPoints: 350, emoji: '💼' },
  { name: 'Especialista', minPoints: 700, emoji: '⭐' },
  { name: 'Mestre', minPoints: 1200, emoji: '👑' },
];

export function getUserTier(pointsBalance: number): Tier {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (pointsBalance >= t.minPoints) tier = t;
  }
  return tier;
}

export interface LevelProgress {
  tier: Tier;
  /** Próximo nível; null no último. */
  next: Tier | null;
  /** 0–100 dentro do nível atual. */
  percent: number;
  /** Pontos que faltam para o próximo nível; 0 no último. */
  pointsToNext: number;
}

export function getLevelProgress(pointsBalance: number): LevelProgress {
  const points = Math.max(0, pointsBalance);
  const tier = getUserTier(points);
  const next = TIERS.find((t) => t.minPoints > points) ?? null;
  if (!next) return { tier, next: null, percent: 100, pointsToNext: 0 };
  const span = next.minPoints - tier.minPoints;
  return {
    tier,
    next,
    percent: Math.min(100, Math.max(0, Math.round(((points - tier.minPoints) / span) * 100))),
    pointsToNext: next.minPoints - points,
  };
}
