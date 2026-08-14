export interface UserTier {
  name: string;
  minPoints: number;
  maxPoints: number | null;
  progress: number;
  nextTierName: string | null;
  pointsToNext: number;
}

const TIERS: { name: string; min: number; max: number | null }[] = [
  { name: 'Iniciante', min: 0, max: 499 },
  { name: 'Analista', min: 500, max: 1999 },
  { name: 'Analista Sénior', min: 2000, max: 4999 },
  { name: 'Especialista', min: 5000, max: 9999 },
  { name: 'Mestre', min: 10000, max: null },
];

export function getUserTier(points: number): UserTier {
  const currentIndex = TIERS.findIndex(
    (t) => points >= t.min && (t.max === null || points <= t.max),
  );
  const idx = currentIndex >= 0 ? currentIndex : TIERS.length - 1;
  const current = TIERS[idx];
  const next = TIERS[idx + 1] ?? null;

  const span = current.max !== null ? current.max - current.min + 1 : 0;
  const progress = next
    ? Math.max(0, Math.min(100, ((points - current.min) / span) * 100))
    : 100;

  return {
    name: current.name,
    minPoints: current.min,
    maxPoints: current.max,
    progress,
    nextTierName: next?.name ?? null,
    pointsToNext: next ? next.min - points : 0,
  };
}
