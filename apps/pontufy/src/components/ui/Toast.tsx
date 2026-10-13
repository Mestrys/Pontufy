'use client';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { bottomOffsetClass } from '@/components/layout/shell-routes';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastPriority = 'low' | 'normal' | 'high';
/** error: anunciado na hora (role=alert) e só some quando a pessoa fecha. */
type ToastTone = 'success' | 'info' | 'error';

interface Toast {
  id: number;
  title: string;
  description?: string;
  priority: ToastPriority;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  undo?: () => void;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id' | 'priority'> & { priority?: ToastPriority }) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Sistema Toast/Snackbar MD3 — fila prioritária (high sobrepõe), ação Undo.
// Some sozinho em 6s, ou 10s quando tem ação (Desfazer etc.), e não some
// enquanto o ponteiro ou o foco estão nele. Erro só fecha pela pessoa.
const AUTO_CLOSE_MS = 6000;
const AUTO_CLOSE_WITH_ACTION_MS = 10000;
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const durations = useRef<Map<number, number>>(new Map());
  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    durations.current.delete(id);
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const schedule = (entry: Toast) => {
    const ms = entry.undo || entry.onAction ? AUTO_CLOSE_WITH_ACTION_MS : AUTO_CLOSE_MS;
    durations.current.set(entry.id, ms);
    timers.current.set(entry.id, setTimeout(() => dismiss(entry.id), ms));
  };
  // Pausa ao passar o mouse ou focar; ao sair, recomeça a contagem inteira.
  const pause = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);
  const resume = useCallback(
    (id: number) => {
      const ms = durations.current.get(id);
      if (!ms || timers.current.has(id)) return;
      timers.current.set(id, setTimeout(() => dismiss(id), ms));
    },
    [dismiss],
  );

  const toast = useCallback(
    (t: Omit<Toast, 'id' | 'priority'> & { priority?: ToastPriority }) => {
      const id = nextId.current++;
      const priority = t.priority ?? (t.tone === 'error' ? 'high' : 'normal');
      const entry: Toast = { ...t, id, priority };
      setToasts((prev) => {
        // Um erro na tela segura só avisos de baixa prioridade; confirmações
        // normais continuam aparecendo. No máximo 3 avisos ao mesmo tempo.
        const hasHigh = prev.some((p) => p.priority === 'high');
        if (hasHigh && entry.priority === 'low') return prev;
        return [...prev, entry].slice(-3);
      });
      if (entry.tone !== 'error') schedule(entry);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- schedule só usa refs e dismiss
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  // Sobe acima da barra de ações do player e da barra de navegação do celular.
  const pathname = usePathname();
  const bottom = bottomOffsetClass(pathname);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className={`fixed ${bottom} left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-2 w-full max-w-sm px-4`}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              role={t.tone === 'error' ? 'alert' : 'status'}
              onMouseEnter={() => pause(t.id)}
              onMouseLeave={(e) => {
                if (!e.currentTarget.contains(document.activeElement)) resume(t.id);
              }}
              onFocus={() => pause(t.id)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resume(t.id);
              }}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-2xl bg-md-surface-container-high text-md-on-surface-strong shadow-2xl border border-md-outline ${
                t.tone === 'error' ? 'border-md-error/40' : t.priority === 'high' ? 'border-md-highlight/40' : ''
              }`}
            >
              <span className="mt-0.5 flex-shrink-0">
                {t.tone === 'error' ? (
                  <AlertTriangle size={18} className="text-md-error" />
                ) : t.priority === 'high' ? (
                  <AlertTriangle size={18} className="text-md-highlight" />
                ) : t.priority === 'low' ? (
                  <Info size={18} className="text-md-on-surface-variant" />
                ) : (
                  <CheckCircle2 size={18} className="text-md-tertiary" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-md-on-surface-strong">{t.title}</p>
                {t.description && <p className="text-xs text-md-on-surface-variant mt-0.5">{t.description}</p>}
                {(t.undo || (t.actionLabel && t.onAction)) && <div className="flex items-center gap-2 -ml-2">
                  {t.undo && (
                    <button
                      type="button"
                      onClick={() => {
                        t.undo?.();
                        dismiss(t.id);
                      }}
                      className="min-h-11 px-2 text-sm font-bold text-md-tertiary hover:text-md-on-surface-strong transition-colors"
                    >
                      Desfazer
                    </button>
                  )}
                  {t.actionLabel && t.onAction && (
                    <button
                      type="button"
                      onClick={() => {
                        t.onAction?.();
                        dismiss(t.id);
                      }}
                      className="min-h-11 px-2 text-sm font-bold text-md-secondary hover:text-md-on-surface-strong transition-colors"
                    >
                      {t.actionLabel}
                    </button>
                  )}
                </div>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar aviso"
                className="-m-2 size-11 flex items-center justify-center rounded-lg text-md-on-surface-variant hover:text-md-on-surface-strong transition-colors flex-shrink-0"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}