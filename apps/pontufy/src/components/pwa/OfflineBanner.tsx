'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useStore } from '@/store/useStore';
import { getQueuedCompletionCount, syncPendingCompletions } from '@/lib/sync-engine';

type SyncState = 'idle' | 'syncing' | 'done' | 'error';

export default function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const currentUser = useStore((s) => s.currentUser);

  const [queueCount, setQueueCount] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncedCount, setSyncedCount] = useState(0);

  // Mantém o contador da fila local atualizado (conclusões offline pendentes).
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    getQueuedCompletionCount(currentUser.tenantId, currentUser.userId)
      .then((count) => {
        if (!cancelled) setQueueCount(count);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [currentUser, isOnline]);

  // Ao voltar online após uma queda: dispara o sync automático da fila.
  useEffect(() => {
    if (!currentUser || !isOnline || !wasOffline) return;
    let cancelled = false;

    syncPendingCompletions(currentUser.tenantId, currentUser.userId)
      .then((result) => {
        if (cancelled) return;
        setSyncedCount(result.synced + result.duplicates);
        setSyncState('done');
        return getQueuedCompletionCount(currentUser.tenantId, currentUser.userId).then(
          (count) => {
            if (!cancelled) setQueueCount(count);
          },
        );
      })
      .catch(() => {
        if (!cancelled) setSyncState('error');
      })
      .finally(() => {
        setTimeout(() => {
          if (!cancelled) setSyncState('idle');
        }, 4000);
      });

    return () => {
      cancelled = true;
    };
  }, [isOnline, wasOffline, currentUser]);

  if (!currentUser) return null;

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-4 py-2.5 rounded-full shadow-lg shadow-black/40">
          <WifiOff size={15} />
          <span>Modo offline</span>
          {queueCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-300">
              {queueCount} pendente{queueCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (syncState === 'syncing' || syncState === 'done' || syncState === 'error') {
    const isDone = syncState === 'done';
    const isError = syncState === 'error';
    const tone = isError
      ? 'bg-red-500/10 border-red-500/20 text-red-400'
      : isDone
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        : 'bg-amber-500/10 border-amber-500/20 text-amber-400';

    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div
          className={`flex items-center gap-2.5 ${tone} text-xs font-medium px-4 py-2.5 rounded-full shadow-lg shadow-black/40`}
        >
          {isError ? (
            <WifiOff size={15} />
          ) : isDone ? (
            <CheckCircle2 size={15} />
          ) : (
            <RefreshCw size={15} className="animate-spin" />
          )}
          <span>
            {isError
              ? 'Falha ao sincronizar — tentaremos novamente.'
              : isDone
                ? `${syncedCount > 0 ? `${syncedCount} conclusões sincronizadas.` : 'Tudo sincronizado.'}`
                : 'Sincronizando conclusões offline...'}
          </span>
        </div>
      </div>
    );
  }

  return null;
}