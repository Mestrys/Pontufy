// Motor de sincronização offline: esvazia a fila local de conclusões de aula
// quando a conexão é restabelecida, enviando lotes para /api/lessons/sync
// (idempotente via UNIQUE(userId, lessonId) no banco — zero double-counting).
import {
  buildScope,
  enqueueLessonCompletion,
  getPendingCompletions,
  markPendingFailed,
  removePendingCompletion,
} from './offline-storage';

export interface SyncResult {
  synced: number;
  duplicates: number;
  failed: number;
  remaining: number;
  done: boolean;
}

const MAX_BATCH = 50;

export function enqueueOfflineCompletion(
  tenantId: string,
  userId: string,
  lessonId: string,
  courseId: string,
): Promise<void> {
  return enqueueLessonCompletion(
    buildScope(tenantId, userId),
    lessonId,
    courseId,
    new Date().toISOString(),
  );
}

export async function getQueuedCompletionCount(tenantId: string, userId: string): Promise<number> {
  const pending = await getPendingCompletions(buildScope(tenantId, userId));
  return pending.length;
}

export async function syncPendingCompletions(
  tenantId: string,
  userId: string,
): Promise<SyncResult> {
  const scope = buildScope(tenantId, userId);
  const pending = await getPendingCompletions(scope);

  if (pending.length === 0) {
    return { synced: 0, duplicates: 0, failed: 0, remaining: 0, done: true };
  }

  const batch = pending.slice(0, MAX_BATCH);
  const res = await fetch('/api/lessons/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: batch.map((item) => ({
        lessonId: item.lessonId,
        courseId: item.courseId,
        completedAt: item.completedAt,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error('Falha ao sincronizar conclusões.');
  }

  const data = await res.json();

  // Itens marcados como inválidos/erro permanecem na fila (retry futuro).
  const failedKeys = new Set<string>();
  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      if (item?.status === 'error' || item?.status === 'invalid') {
        failedKeys.add(`${scope}:${item.lessonId}`);
      }
    }
  }

  for (const item of batch) {
    if (failedKeys.has(item.key)) {
      await markPendingFailed(item.key);
    } else {
      await removePendingCompletion(item.key);
    }
  }

  const remaining = pending.length - (batch.length - failedKeys.size);
  const done = remaining === 0;

  return {
    synced: typeof data.synced === 'number' ? data.synced : 0,
    duplicates: typeof data.duplicates === 'number' ? data.duplicates : 0,
    failed: failedKeys.size,
    remaining,
    done,
  };
}
