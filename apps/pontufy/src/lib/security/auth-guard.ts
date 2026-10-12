import { randomBytes } from 'crypto';
import { getRedis } from '@/lib/redis';
import { rateLimitCheck } from '@/lib/redis';

// ═══════════════════════════════════════════════════════════════════════════
// Security Guard (TAREFA 6) — proteção Zero-Trust contra força bruta:
//  • ipRateLimit: janela deslizante por IP (sliding window via zset)
//  • Account Lockout: 5 falhas / 15min → bloqueio temporário + alerta por email
//  • Unlock via link mágico: token de uso único (TTL 30min) em Redis
//  • Bloqueio global de IPs (hash Redis) com painel para super_admin
// Fail-open quando Redis indisponível (nunca derrubar produção por infra).
// ═══════════════════════════════════════════════════════════════════════════

export const AUTH_MAX_ATTEMPTS = 5;
export const AUTH_WINDOW_SECONDS = 15 * 60; // 15 min
export const LOCK_TTL_SECONDS = 15 * 60;
export const UNLOCK_TOKEN_TTL_SECONDS = 30 * 60;

export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function ipRateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  return rateLimitCheck(`ratelimit:ip:${ip}:${endpoint}`, maxRequests, windowSeconds);
}

// ── Account lockout ─────────────────────────────────────────────────────────

interface LockState {
  locked: boolean;
  remainingAttempts: number;
  shouldNotify: boolean;
}

export async function recordFailedLogin(email: string): Promise<LockState> {
  const redis = getRedis();
  const failKey = `lockout:fail:${email}`;
  const lockKey = `lockout:blocked:${email}`;

  if (!redis) {
    // Sem Redis: fail-open, mas com contagem em memória por processo não é
    // confiável — retornamos sem travar (proteção real exige Redis).
    return { locked: false, remainingAttempts: AUTH_MAX_ATTEMPTS, shouldNotify: false };
  }

  const count = await redis.incr(failKey);
  if (count === 1) await redis.expire(failKey, AUTH_WINDOW_SECONDS);

  const locked = count >= AUTH_MAX_ATTEMPTS;
  if (locked) {
    await redis.set(lockKey, '1', { ex: LOCK_TTL_SECONDS });
    await redis.del(failKey); // reinicia contagem após o bloqueio expirar
    return { locked: true, remainingAttempts: 0, shouldNotify: true };
  }

  return { locked: false, remainingAttempts: AUTH_MAX_ATTEMPTS - count, shouldNotify: false };
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  return (await redis.exists(`lockout:blocked:${email}`)) === 1;
}

export async function clearAccountLockout(email: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`lockout:blocked:${email}`, `lockout:fail:${email}`);
}

// ── Unlock via link mágico (uso único) ──────────────────────────────────────

export async function createUnlockToken(email: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const token = randomBytes(24).toString('hex');
  await redis.set(`unlock:${token}`, email, { ex: UNLOCK_TOKEN_TTL_SECONDS });
  return token;
}

export async function consumeUnlockToken(token: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const email = await redis.get<string>(`unlock:${token}`);
  if (!email) return null;
  await redis.del(`unlock:${token}`); // uso único: apaga antes de aplicar
  await clearAccountLockout(email);
  return email;
}

// ── Bloqueio global de IPs (painel super_admin) ────────────────────────────

export async function blockIp(ip: string, reason: string, ttlSeconds = 24 * 3600): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const entry = JSON.stringify({
    reason,
    blockedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  });
  await redis.hset('security:blocked-ips', { [ip]: entry });
  await redis.expire('security:blocked-ips', ttlSeconds);
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  return (await redis.hexists('security:blocked-ips', ip)) === 1;
}

export async function listBlockedIps(): Promise<Array<{ ip: string; reason: string; blockedAt: string; expiresAt: string }>> {
  const redis = getRedis();
  if (!redis) return [];
  const entries = await redis.hgetall('security:blocked-ips');
  if (!entries) return [];
  return Object.entries(entries).map(([ip, raw]) => {
    try {
      return { ip, ...JSON.parse(String(raw)) };
    } catch {
      return { ip, reason: 'bloqueio manual', blockedAt: '', expiresAt: '' };
    }
  });
}

export async function unblockIp(ip: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.hdel('security:blocked-ips', ip);
}