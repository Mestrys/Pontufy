'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Coins,
  GraduationCap,
  Gift,
  LayoutGrid,
  Wand2,
  ShieldCheck,
  LogOut,
  BookOpen,
  Route,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { canAccessStudio, isMasterAdmin, ROLE_LABELS, type Role } from '@/lib/roles';
import ThemeToggle from '@/components/layout/ThemeToggle';

interface AppHeaderProps {
  userName: string;
  role: Role;
}

export default function AppHeader({ userName, role }: AppHeaderProps) {
  const pathname = usePathname();
  const points = useAppStore((s) => s.points);
  const celebration = useAppStore((s) => s.celebration);

  // skipHydration: aplica o estado salvo (localStorage) só após o mount
  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Início', icon: LayoutGrid },
    { href: '/courses', label: 'Cursos', icon: BookOpen },
    { href: '/tracks', label: 'Trilhas', icon: Route },
    { href: '/rewards', label: 'Recompensas', icon: Gift },
    ...(canAccessStudio(role) ? [{ href: '/studio', label: 'Studio', icon: Wand2 }] : []),
    ...(isMasterAdmin(role)
      ? [{ href: '/superadmin', label: 'Admin', icon: ShieldCheck }]
      : []),
  ];

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-surface-0/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-mint" />
            <span className="text-lg font-semibold tracking-tight text-ink">Pontufy</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-surface-2 text-ink'
                      : 'text-ink-muted hover:bg-surface-1 hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div
            data-testid="points-balance"
            className="relative flex items-center gap-2 rounded-full border border-edge bg-surface-1 px-4 py-1.5"
          >
            <Coins className="h-4 w-4 text-mint" />
            <span className="text-sm font-semibold tabular-nums text-ink">
              {points.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-ink-muted">pts</span>
            {celebration && (
              <span className="animate-points-float absolute -top-1 right-2 text-sm font-bold text-mint">
                +{celebration.points}
              </span>
            )}
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-ink" data-testid="session-name">
              {userName}
            </p>
            <p className="text-[10px] text-ink-faint" data-testid="session-role">
              {ROLE_LABELS[role]}
            </p>
          </div>

          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-surface-2 text-xs font-semibold text-ink-soft"
            title={userName}
          >
            {initials}
          </div>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            aria-label="Sair"
            title="Sair"
            className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-1 hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
