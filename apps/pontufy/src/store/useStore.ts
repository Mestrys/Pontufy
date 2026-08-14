import { create } from 'zustand';
import { buildScope, clearScope } from '@/lib/offline-storage';

interface UserSession {
  userId: string;
  tenantId: string;
  role: 'admin_rh' | 'employee';
  name: string;
}

interface PontufyState {
  currentUser: UserSession | null;
  currentPointsBalance: number;
  searchQuery: string;
  unreadNotifications: number;

  setUser: (user: UserSession) => void;
  clearUser: () => void;
  setPointsBalance: (balance: number) => void;
  addPoints: (amount: number) => void;
  deductPoints: (amount: number) => void;
  setSearchQuery: (query: string) => void;
  setUnreadNotifications: (count: number) => void;
}

export const useStore = create<PontufyState>((set) => ({
  currentUser: null,
  currentPointsBalance: 0,
  searchQuery: '',
  unreadNotifications: 0,

  setUser: (user) => set({ currentUser: user }),
  clearUser: () =>
    set((s) => {
      const user = s.currentUser;
      if (user) {
        // Privacidade/segurança: purge do cache offline do escopo anterior.
        clearScope(buildScope(user.tenantId, user.userId)).catch(() => {});
      }
      return { currentUser: null, currentPointsBalance: 0, searchQuery: '', unreadNotifications: 0 };
    }),
  setPointsBalance: (balance) => set({ currentPointsBalance: balance }),
  addPoints: (amount) => set((s) => ({ currentPointsBalance: s.currentPointsBalance + amount })),
  deductPoints: (amount) => set((s) => ({ currentPointsBalance: Math.max(0, s.currentPointsBalance - amount) })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
}));
