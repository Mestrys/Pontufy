'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { User, LogOut, LayoutDashboard, ShieldCheck, Building2, Menu, X } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { PointsChip } from '@/components/ui/Chip';
import { MD3SearchBar } from '@/components/ui/MD3SearchBar';
import { MD3NavigationDrawer } from '@/components/layout/MD3NavigationDrawer';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDismissableMenu } from '@/hooks/useDismissableMenu';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const pointsBalance = useStore((s) => s.currentPointsBalance);
  const { isOnline } = useNetworkStatus();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  useDismissableMenu(isDropdownOpen, closeDropdown, dropdownRef, avatarButtonRef);
  const pathnameRef = useRef(pathname);

  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      setIsMobileMenuOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/dashboard', label: 'Início' },
    { href: '/cursos', label: 'Meus Cursos' },
    { href: '/skills', label: 'Trilhas' },
    { href: '/battles', label: 'Batalhas' },
    { href: '/loja', label: 'Benefícios' },
    { href: '/wallet', label: 'Carteira' },
    { href: '/certificados', label: 'Certificados' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 px-4 sm:px-8 py-3 transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? 'bg-md-surface/96 backdrop-blur-sm shadow-lg shadow-black/50'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Left: Logo + Desktop links */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-black tracking-tight text-white flex-shrink-0">
              <span className="text-md-primary-text">Pontu</span>fy
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-full ${
                    isActive(link.href)
                      ? 'text-white font-bold bg-md-primary/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {role === 'admin_rh' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-md-secondary hover:text-md-secondary/80 transition-colors ml-1"
                >
                  <LayoutDashboard size={14} />
                  Painel RH
                </Link>
              )}
              {role === 'super_admin' && (
                <Link
                  href="/superadmin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors ml-1"
                >
                  <ShieldCheck size={14} />
                  Console
                </Link>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Points badge (terciário #a1c0ae — padrão MD3 obrigatório) */}
            <Link href="/wallet">
              <PointsChip value={pointsBalance} />
            </Link>

            {/* Notification bell */}
            <NotificationBell />

            {/* Search (desktop) — MD3SearchBar expansível integrada ao useStore */}
            <div className="hidden md:flex relative items-center">
              <MD3SearchBar />
            </div>

            {/* User menu (desktop) */}
            {status === 'authenticated' && (
              <div className="hidden md:block relative" ref={dropdownRef}>
                {/* Alvo de 44px; o círculo visível continua com 32px. */}
                <button
                  ref={avatarButtonRef}
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label={isOnline ? 'Menu do perfil' : 'Menu do perfil (sem conexão)'}
                  aria-expanded={isDropdownOpen}
                  className="group size-11 -m-1.5 flex items-center justify-center rounded-full"
                >
                  <span className="relative w-8 h-8 rounded-full bg-md-primary flex items-center justify-center group-hover:bg-md-primary-container transition-colors text-white font-black text-sm">
                    {session?.user?.name?.[0]?.toUpperCase() ?? <User size={16} aria-hidden="true" />}
                    {/* Badge de status de conexão (3.4) */}
                    <span
                      aria-hidden="true"
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-md-surface ${
                        isOnline ? 'bg-md-tertiary' : 'bg-red-500'
                      }`}
                    />
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-md-surface-container rounded-xl shadow-2xl border border-md-outline py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-md-outline">
                      <p className="text-sm font-semibold text-white truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-md-on-surface-muted truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 transition-colors font-medium"
                    >
                      <User size={15} />
                      Meu Perfil
                    </Link>
                    {role === 'super_admin' && (
                      <Link
                        href="/superadmin/tenants"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-violet-300 hover:bg-white/5 transition-colors font-medium"
                      >
                        <Building2 size={15} />
                        Trocar de locatário
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                    >
                      <LogOut size={15} />
                      Sair da conta
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile: hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Abrir menu de navegação"
              aria-expanded={isMobileMenuOpen}
              className="md:hidden -mr-2 size-11 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile: MD3 Navigation Drawer (modal deslizante) */}
      <MD3NavigationDrawer
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
        activeHref={pathname}
      />
    </>
  );
}
