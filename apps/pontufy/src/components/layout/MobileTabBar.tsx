'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Swords, Gift, User } from 'lucide-react';
import { isRouteActive } from './shell-routes';

// Navigation bar MD3 na base do celular: os 5 destinos principais ficam
// sempre visíveis (no modo instalado não há barra do navegador). Carteira,
// Certificados e Trilhas ficam no Perfil e no menu.
const TABS = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/cursos', label: 'Cursos', icon: BookOpen },
  { href: '/battles', label: 'Batalhas', icon: Swords },
  { href: '/loja', label: 'Benefícios', icon: Gift },
  { href: '/profile', label: 'Perfil', icon: User, also: ['/wallet', '/certificados', '/skills'] },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-md-outline bg-md-surface/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, also }) => {
          const current = isRouteActive(pathname, href);
          const active = current || (also ?? []).some((h) => isRouteActive(pathname, h));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  active ? 'text-white' : 'text-md-on-surface-variant hover:text-white'
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    active ? 'bg-md-primary text-md-on-primary' : ''
                  }`}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
