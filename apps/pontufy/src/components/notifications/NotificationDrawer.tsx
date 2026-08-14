'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, Coins, Gift, GraduationCap, TrendingUp, Megaphone, Bell } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';

export type NotificationType =
  | 'POINTS_EARNED'
  | 'REWARD_REDEEMED'
  | 'COURSE_ASSIGNED'
  | 'LEVEL_UP'
  | 'SYSTEM';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_STYLES: Record<NotificationType, { icon: typeof Coins; badge: string; iconColor: string }> = {
  POINTS_EARNED: { icon: Coins, badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', iconColor: 'text-emerald-400' },
  REWARD_REDEEMED: { icon: Gift, badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30', iconColor: 'text-purple-400' },
  COURSE_ASSIGNED: { icon: GraduationCap, badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', iconColor: 'text-blue-400' },
  LEVEL_UP: { icon: TrendingUp, badge: 'bg-violet-500/20 text-violet-400 border-violet-500/30', iconColor: 'text-violet-400' },
  SYSTEM: { icon: Megaphone, badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30', iconColor: 'text-gray-400' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

async function fetchNotifications(page = 1, limit = 30) {
  const res = await fetch(`/api/notifications?page=${page}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const unreadNotifications = useStore((s) => s.unreadNotifications);
  const setUnreadNotifications = useStore((s) => s.setUnreadNotifications);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetchNotifications()
      .then((json) => {
        if (cancelled) return;
        setItems(json.data || []);
        setUnreadNotifications(json.unreadCount ?? 0);
      })
      .catch((err) => {
        if (!cancelled) console.error('Falha ao carregar notificações:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, setUnreadNotifications]);

  const markRead = useCallback(
    async (id: string) => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadNotifications(Math.max(0, unreadNotifications - 1));
      try {
        await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      } catch {}
    },
    [unreadNotifications, setUnreadNotifications],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifications(0);
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch {}
  }, [setUnreadNotifications]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#141414] border-l border-[#2a2a2a] shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell size={18} className="text-emerald-400" />
                Notificações
                {unreadNotifications > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadNotifications} novas
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadNotifications === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-emerald-400 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCheck size={14} />
                  Marcar todas
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 animate-pulse space-y-2">
                      <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
                      <div className="h-2 bg-[#2a2a2a] rounded w-3/4" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && items.length === 0 && (
                <div className="text-center py-16">
                  <Bell size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">Nenhuma notificação por aqui.</p>
                  <p className="text-sm text-gray-600 mt-1">Conclua aulas e resgate recompensas para receber avisos.</p>
                </div>
              )}

              {!isLoading &&
                items.map((item) => {
                  const style = TYPE_STYLES[item.type] || TYPE_STYLES.SYSTEM;
                  const Icon = style.icon;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        if (!item.read) markRead(item.id);
                      }}
                      className={`w-full text-left bg-[#0a0a0a] border rounded-xl p-4 transition-colors ${
                        item.read
                          ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                          : 'border-emerald-500/25 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`inline-flex p-2 rounded-lg border ${style.badge}`}>
                          <Icon size={16} className={style.iconColor} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-semibold ${item.read ? 'text-gray-300' : 'text-white'}`}>
                              {item.title}
                            </p>
                            <span className="text-[10px] text-gray-600 flex-shrink-0">
                              {timeAgo(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-0.5">{item.message}</p>
                        </div>
                        {!item.read && <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />}
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}