'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, LogOut, ShieldCheck, User, X } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { MD3SearchBar } from '@/components/ui/MD3SearchBar';
import { Dialog } from '@/components/ui/Dialog';
import { isRouteActive } from './shell-routes';
import BrandMark from '@/components/theme/BrandMark';

export interface MD3DrawerLink {
  href: string;
  label: string;
}

interface MD3NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  links: MD3DrawerLink[];
  activeHref: string;
}

// MD3 Navigation Drawer — modal deslizante em mobile (direita, 320dp),
// com backdrop e bloqueio de scroll. Em desktop o Header mantém a navegação
// colapsável inline (hidden md:flex), conforme o padrão MD3.
export function MD3NavigationDrawer({ open, onClose, links, activeHref }: MD3NavigationDrawerProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isActive = (href: string) => isRouteActive(pathname ?? activeHref, href);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="right"
      ariaLabel="Menu de navegação"
      zIndexClassName="z-50"
      backdropClassName="bg-black/60"
      className="h-full w-[320px] max-w-[85vw] bg-md-surface border-l border-md-outline shadow-2xl flex flex-col"
    >
            {/* Header do drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-md-outline flex-shrink-0">
              <Link href="/dashboard" onClick={onClose} aria-label="Início" className="min-h-11 inline-flex items-center">
                <BrandMark />
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="-mr-2 size-11 flex items-center justify-center text-md-on-surface-variant hover:text-md-on-surface-strong transition-colors rounded-full"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Busca MD3 (mobile) */}
            <div className="px-4 py-3 border-b border-md-outline flex-shrink-0">
              <MD3SearchBar compact />
            </div>

            {/* Navegação */}
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-md-primary/20 text-md-on-surface-strong font-bold'
                      : 'text-md-on-surface-variant hover:bg-md-on-surface-strong/5 hover:text-md-on-surface-strong'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {role === 'admin_rh' && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-md-secondary mt-1 transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Painel de RH
                </Link>
              )}
              {role === 'super_admin' && (
                <Link
                  href="/superadmin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-violet-400 mt-1 transition-colors"
                >
                  <ShieldCheck size={16} />
                  Console
                </Link>
              )}
            </nav>

            {/* Rodapé do usuário */}
            {status === 'authenticated' && (
              <div className="border-t border-md-outline px-4 py-4 flex-shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-md-primary flex items-center justify-center text-md-on-primary font-black">
                      {session?.user?.name?.[0]?.toUpperCase() ?? <User size={18} />}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-md-surface ${
                        isOnline ? 'bg-md-tertiary' : 'bg-red-500'
                      }`}
                      title={isOnline ? 'Conectado' : 'Offline'}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-md-on-surface-strong truncate">{session?.user?.name}</p>
                    <p className="text-xs text-md-on-surface-muted truncate">{session?.user?.email}</p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-md-on-surface hover:bg-md-on-surface-strong/5 hover:text-md-on-surface-strong transition-colors"
                >
                  <User size={15} />
                  Meu perfil
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={15} />
                  Sair da conta
                </button>
              </div>
            )}
    </Dialog>
  );
}